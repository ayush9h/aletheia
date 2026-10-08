import pytest

from app.utils.rate_limiters.core import RateLimitPolicy
from app.utils.rate_limiters.serpapi import (
    SerpApiGuard,
    SerpApiLimit,
    SerpAPILimitExceeded,
    get_serp_guard,
    set_serp_guard,
)


class MockDecision:
    def __init__(self, allowed: bool) -> None:
        self.allowed = allowed


class MockLimiter:
    def __init__(self, allowed: bool = True) -> None:
        self.allowed = allowed
        self.calls = []

    async def acquire(
        self,
        *,
        group: str,
        policies: list[RateLimitPolicy],
    ):
        self.calls.append(
            {
                "group": group,
                "policies": policies,
            }
        )

        return MockDecision(self.allowed)


@pytest.fixture(autouse=True)
def reset_serp_guard():
    set_serp_guard(None)
    yield
    set_serp_guard(None)


@pytest.fixture
def model_limits() -> dict[str, SerpApiLimit]:
    return {
        "google": SerpApiLimit(rpm=10),
        "google_news": SerpApiLimit(rpm=5),
        "google_finance": SerpApiLimit(rpm=3),
    }


@pytest.mark.asyncio
async def test_acquire_success(model_limits):
    limiter = MockLimiter(allowed=True)

    guard = SerpApiGuard(
        limiter=limiter,
        model_limits=model_limits,
    )

    await guard.acquire(
        serp_type="google",
        credit_usage_by_type=2,
        project_id="test-project",
    )

    assert len(limiter.calls) == 1

    call = limiter.calls[0]

    assert call["group"] == "serpapi:test-project:google"
    assert len(call["policies"]) == 1

    policy = call["policies"][0]

    assert policy.name == "rpm"
    assert policy.limit == 10
    assert policy.window_seconds == 60
    assert policy.cost == 2


@pytest.mark.asyncio
async def test_acquire_uses_default_project_id(model_limits):
    limiter = MockLimiter()

    guard = SerpApiGuard(
        limiter=limiter,
        model_limits=model_limits,
    )

    await guard.acquire(
        serp_type="google",
    )

    assert len(limiter.calls) == 1
    assert limiter.calls[0]["group"] == "serpapi:default:google"


@pytest.mark.asyncio
async def test_acquire_with_different_serp_types(model_limits):
    limiter = MockLimiter()

    guard = SerpApiGuard(
        limiter=limiter,
        model_limits=model_limits,
    )

    await guard.acquire(
        serp_type="google_news",
        credit_usage_by_type=3,
    )

    assert len(limiter.calls) == 1

    call = limiter.calls[0]
    policy = call["policies"][0]

    assert call["group"] == "serpapi:default:google_news"
    assert policy.name == "rpm"
    assert policy.limit == 5
    assert policy.window_seconds == 60
    assert policy.cost == 3


@pytest.mark.asyncio
async def test_acquire_raises_when_serp_type_is_not_configured(
    model_limits,
):
    limiter = MockLimiter()

    guard = SerpApiGuard(
        limiter=limiter,
        model_limits=model_limits,
    )

    with pytest.raises(
        ValueError,
        match="No rate limit configured for execution type 'unknown'",
    ):
        await guard.acquire(
            serp_type="unknown",
        )

    assert limiter.calls == []


@pytest.mark.asyncio
async def test_acquire_raises_when_credit_usage_exceeds_rpm(
    model_limits,
):
    limiter = MockLimiter()

    guard = SerpApiGuard(
        limiter=limiter,
        model_limits=model_limits,
    )

    with pytest.raises(
        ValueError,
        match=("Request requires 11 credits, but 'google' has an RPM limit of 10"),
    ):
        await guard.acquire(
            serp_type="google",
            credit_usage_by_type=11,
        )

    assert limiter.calls == []


@pytest.mark.asyncio
async def test_acquire_raises_when_rate_limit_is_exceeded(
    model_limits,
):
    limiter = MockLimiter(allowed=False)

    guard = SerpApiGuard(
        limiter=limiter,
        model_limits=model_limits,
    )

    with pytest.raises(
        SerpAPILimitExceeded,
        match="Rate limit exceeded for SerpAPI 'google' operation",
    ):
        await guard.acquire(
            serp_type="google",
        )

    assert len(limiter.calls) == 1


def test_set_and_get_serp_guard(model_limits):
    limiter = MockLimiter()

    guard = SerpApiGuard(
        limiter=limiter,
        model_limits=model_limits,
    )

    set_serp_guard(guard)

    assert get_serp_guard() is guard


def test_get_serp_guard_raises_when_not_initialized():
    with pytest.raises(
        RuntimeError,
        match="Tavily guard has not been initialized",
    ):
        get_serp_guard()
