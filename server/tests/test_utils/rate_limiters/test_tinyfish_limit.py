import pytest

from app.utils.rate_limiters.core import RateLimitPolicy
from app.utils.rate_limiters.tinyfish import (TinyFishGuard, TinyFishLimit,
                                            TinyFishLimitExceeded,
                                            get_tinyfish_guard, set_tinyfish_guard)


class MockDecision:
    def __init__(self, allowed: bool) -> None:
        self.allowed = allowed


class MockLimiter:
    def __init__(self, allowed: bool = True) -> None:
        self.allowed = allowed
        self.calls = []

    async def acquire(self, *, group: str, policies: list[RateLimitPolicy]):
        self.calls.append(
            {
                "group": group,
                "policies": policies,
            }
        )
        return MockDecision(self.allowed)


@pytest.fixture
def model_limits() -> dict[str, TinyFishLimit]:
    return {
        "search": TinyFishLimit(rpm=10),
        "extract": TinyFishLimit(rpm=5),
    }


@pytest.mark.asyncio
async def test_acquire_success(model_limits):
    limiter = MockLimiter(allowed=True)
    guard = TinyFishGuard(
        limiter=limiter,  # type: ignore
        model_limits=model_limits,
    )

    await guard.acquire(
        tinyfish_exec_type="search",
        credit_usage_by_type=2,
        project_id="test-project",
    )

    assert len(limiter.calls) == 1

    call = limiter.calls[0]

    assert call["group"] == "tinyfish:test-project:search"
    assert len(call["policies"]) == 1

    policy = call["policies"][0]

    assert policy.name == "rpm"
    assert policy.limit == 10
    assert policy.window_seconds == 60
    assert policy.cost == 2


@pytest.mark.asyncio
async def test_acquire_raises_when_execution_type_is_not_configured(
    model_limits,
):
    limiter = MockLimiter()
    guard = TinyFishGuard(
        limiter=limiter,  # type: ignore
        model_limits=model_limits,
    )

    with pytest.raises(ValueError, match="No rate limit configured"):
        await guard.acquire(
            tinyfish_exec_type="unknown",
        )

    assert limiter.calls == []


@pytest.mark.asyncio
async def test_acquire_raises_when_credit_usage_exceeds_rpm(
    model_limits,
):
    limiter = MockLimiter()
    guard = TinyFishGuard(
        limiter=limiter,  # type: ignore
        model_limits=model_limits,
    )

    with pytest.raises(
        ValueError,
        match="Request requires 11 credits",
    ):
        await guard.acquire(
            tinyfish_exec_type="search",
            credit_usage_by_type=11,
        )

    assert limiter.calls == []


@pytest.mark.asyncio
async def test_acquire_raises_when_rate_limit_is_exceeded(
    model_limits,
):
    limiter = MockLimiter(allowed=False)
    guard = TinyFishGuard(
        limiter=limiter,  # type: ignore
        model_limits=model_limits,
    )

    with pytest.raises(
        TinyFishLimitExceeded,
        match="Rate limit exceeded for TinyFish",
    ):
        await guard.acquire(
            tinyfish_exec_type="search",
        )


def test_set_and_get_tinyfish_guard(model_limits):
    limiter = MockLimiter()
    guard = TinyFishGuard(
        limiter=limiter,  # type: ignore
        model_limits=model_limits,
    )

    set_tinyfish_guard(guard)

    assert get_tinyfish_guard() is guard


def test_get_tinyfish_guard_raises_when_not_initialized():
    set_tinyfish_guard(None)

    with pytest.raises(
        RuntimeError,
        match="TinyFish guard has not been initialized",
    ):
        get_tinyfish_guard()
