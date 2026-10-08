from unittest.mock import AsyncMock, MagicMock

import pytest
from redis.exceptions import RedisError

from app.utils.rate_limiters.core import (
    POLICY_SCRIPT,
    RateLimitDecision,
    RateLimitPolicy,
    RedisSlidingWindowLimiter,
)


def test_rate_limit_policy_defaults_cost_to_one():
    policy = RateLimitPolicy(
        name="rpm",
        limit=60,
        window_seconds=60,
    )

    assert policy.name == "rpm"
    assert policy.limit == 60
    assert policy.window_seconds == 60
    assert policy.cost == 1


def test_rate_limit_policy_accepts_valid_cost():
    policy = RateLimitPolicy(
        name="tpm",
        limit=1000,
        window_seconds=60,
        cost=100,
    )

    assert policy.cost == 100


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        (
            {
                "name": "",
                "limit": 60,
                "window_seconds": 60,
            },
            "Policy name cannot be empty",
        ),
        (
            {
                "name": "rpm",
                "limit": 0,
                "window_seconds": 60,
            },
            "Limit cannot be zero",
        ),
        (
            {
                "name": "rpm",
                "limit": -1,
                "window_seconds": 60,
            },
            "Limit cannot be zero",
        ),
        (
            {
                "name": "rpm",
                "limit": 60,
                "window_seconds": 0,
            },
            "window seconds cannot be zero",
        ),
        (
            {
                "name": "rpm",
                "limit": 60,
                "window_seconds": -1,
            },
            "window seconds cannot be zero",
        ),
        (
            {
                "name": "rpm",
                "limit": 60,
                "window_seconds": 60,
                "cost": 0,
            },
            "Cost cannot be zero",
        ),
        (
            {
                "name": "rpm",
                "limit": 60,
                "window_seconds": 60,
                "cost": -1,
            },
            "Cost cannot be zero",
        ),
        (
            {
                "name": "rpm",
                "limit": 60,
                "window_seconds": 60,
                "cost": 60,
            },
            "Policy cost 60 exceeds limit 60",
        ),
    ],
)
def test_rate_limit_policy_validation(kwargs, message):
    with pytest.raises(ValueError, match=f"^{message}$"):
        RateLimitPolicy(**kwargs)


def test_rate_limit_policy_is_frozen():
    policy = RateLimitPolicy(
        name="rpm",
        limit=60,
        window_seconds=60,
    )

    with pytest.raises(AttributeError):
        policy.limit = 100


def test_rate_limit_decision():
    decision = RateLimitDecision(
        allowed=True,
        retry_after_seconds=0,
        limits={"rpm": 60},
        used={"rpm": 10},
        remaining={"rpm": 50},
    )

    assert decision.allowed is True
    assert decision.retry_after_seconds == 0
    assert decision.limits == {"rpm": 60}
    assert decision.used == {"rpm": 10}
    assert decision.remaining == {"rpm": 50}


def test_limiter_initializes_and_registers_script():
    redis = MagicMock()
    script = MagicMock()

    redis.register_script.return_value = script

    limiter = RedisSlidingWindowLimiter(
        redis=redis,
        key_prefix="test-rate-limit",
    )

    assert limiter.redis is redis
    assert limiter.key_prefix == "test-rate-limit"
    assert limiter._script is script

    redis.register_script.assert_called_once_with(POLICY_SCRIPT)


def test_limiter_uses_default_key_prefix():
    redis = MagicMock()
    script = MagicMock()

    redis.register_script.return_value = script

    limiter = RedisSlidingWindowLimiter(redis=redis)

    assert limiter.key_prefix == "rate-limit"


@pytest.mark.asyncio
async def test_acquire_requires_at_least_one_policy():
    redis = MagicMock()
    redis.register_script.return_value = MagicMock()

    limiter = RedisSlidingWindowLimiter(redis=redis)

    with pytest.raises(ValueError, match="^atleast one policy is required$"):
        await limiter.acquire(
            group="test-group",
            policies=[],
        )


@pytest.mark.asyncio
async def test_acquire_single_policy_allowed():
    redis = MagicMock()
    script = AsyncMock(
        return_value=[
            1,
            0,
            10,
        ]
    )

    redis.register_script.return_value = script

    limiter = RedisSlidingWindowLimiter(
        redis=redis,
        key_prefix="test-rate-limit",
    )

    policy = RateLimitPolicy(
        name="rpm",
        limit=60,
        window_seconds=60,
        cost=1,
    )

    decision = await limiter.acquire(
        group="test-group",
        policies=[policy],
    )

    assert decision.allowed is True
    assert decision.retry_after_seconds == 0
    assert decision.limits == {"rpm": 60}
    assert decision.used == {"rpm": 10}
    assert decision.remaining == {"rpm": 50}

    script.assert_awaited_once()

    call_kwargs = script.await_args.kwargs

    assert len(call_kwargs["keys"]) == 2

    assert call_kwargs["keys"][0].startswith("test-rate-limit:{")
    assert call_kwargs["keys"][0].endswith(":rpm:events")

    assert call_kwargs["keys"][1].startswith("test-rate-limit:{")
    assert call_kwargs["keys"][1].endswith(":rpm:total")

    assert len(call_kwargs["args"]) == 5
    assert call_kwargs["args"][1] == 1
    assert call_kwargs["args"][2] == 60
    assert call_kwargs["args"][3] == 60000
    assert call_kwargs["args"][4] == 1


@pytest.mark.asyncio
async def test_acquire_single_policy_denied():
    redis = MagicMock()
    script = AsyncMock(
        return_value=[
            0,
            2500,
            60,
        ]
    )

    redis.register_script.return_value = script

    limiter = RedisSlidingWindowLimiter(
        redis=redis,
        key_prefix="test-rate-limit",
    )

    policy = RateLimitPolicy(
        name="rpm",
        limit=60,
        window_seconds=60,
        cost=1,
    )

    decision = await limiter.acquire(
        group="test-group",
        policies=[policy],
    )

    assert decision.allowed is False
    assert decision.retry_after_seconds == 3
    assert decision.limits == {"rpm": 60}
    assert decision.used == {"rpm": 60}
    assert decision.remaining == {"rpm": 0}


@pytest.mark.asyncio
async def test_acquire_never_returns_negative_remaining():
    redis = MagicMock()
    script = AsyncMock(
        return_value=[
            0,
            1000,
            75,
        ]
    )

    redis.register_script.return_value = script

    limiter = RedisSlidingWindowLimiter(redis=redis)

    policy = RateLimitPolicy(
        name="rpm",
        limit=60,
        window_seconds=60,
        cost=1,
    )

    decision = await limiter.acquire(
        group="test-group",
        policies=[policy],
    )

    assert decision.remaining["rpm"] == 0


@pytest.mark.asyncio
async def test_acquire_rounds_retry_after_up():
    redis = MagicMock()
    script = AsyncMock(
        return_value=[
            0,
            1001,
            60,
        ]
    )

    redis.register_script.return_value = script

    limiter = RedisSlidingWindowLimiter(redis=redis)

    policy = RateLimitPolicy(
        name="rpm",
        limit=60,
        window_seconds=60,
    )

    decision = await limiter.acquire(
        group="test-group",
        policies=[policy],
    )

    assert decision.retry_after_seconds == 2


@pytest.mark.asyncio
async def test_acquire_wraps_redis_error():
    redis = MagicMock()

    script = AsyncMock(side_effect=RedisError("Redis connection failed"))

    redis.register_script.return_value = script

    limiter = RedisSlidingWindowLimiter(redis=redis)

    policy = RateLimitPolicy(
        name="rpm",
        limit=60,
        window_seconds=60,
    )

    with pytest.raises(
        RuntimeError,
        match=r"^Error occurred due to Redis connection failed$",
    ):
        await limiter.acquire(
            group="test-group",
            policies=[policy],
        )

    script.assert_awaited_once()
