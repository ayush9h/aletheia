from unittest.mock import AsyncMock

import pytest

from app.utils.rate_limiters.llm import (
    GroqGuard,
    GroqModelLimit,
    GroqRateLimitExceeded,
    get_groq_guard,
    set_groq_guard,
)


class MockDecision:
    def __init__(self, allowed: bool, retry_after_seconds: int = 0) -> None:
        self.allowed = allowed
        self.retry_after_seconds = retry_after_seconds


class MockLimiter:
    def __init__(self, decision: MockDecision) -> None:
        self.acquire = AsyncMock(return_value=decision)


@pytest.fixture(autouse=True)
def reset_groq_guard():
    set_groq_guard(None)
    yield
    set_groq_guard(None)


@pytest.fixture
def model_limits() -> dict[str, GroqModelLimit]:
    return {
        "llama-3.3-70b-versatile": GroqModelLimit(
            rpm=30,
            tpm=10000,
        ),
        "openai/gpt-oss-20b": GroqModelLimit(
            rpm=60,
            tpm=20000,
        ),
    }


@pytest.mark.asyncio
async def test_groq_guard_acquire_allows_request(model_limits):
    limiter = MockLimiter(
        MockDecision(
            allowed=True,
            retry_after_seconds=0,
        )
    )

    guard = GroqGuard(
        limiter=limiter,
        organization_id="org-123",
        model_limits=model_limits,
    )

    await guard.acquire(
        model="llama-3.3-70b-versatile",
        input_tokens=100,
        max_output_tokens=500,
    )

    limiter.acquire.assert_awaited_once()

    call_kwargs = limiter.acquire.await_args.kwargs

    assert call_kwargs["group"] == ("groq:org-123:llama-3.3-70b-versatile")

    policies = call_kwargs["policies"]

    assert len(policies) == 2

    assert policies[0].name == "rpm"
    assert policies[0].limit == 30
    assert policies[0].window_seconds == 60
    assert policies[0].cost == 1

    assert policies[1].name == "tpm"
    assert policies[1].limit == 10000
    assert policies[1].window_seconds == 60
    assert policies[1].cost == 600


@pytest.mark.asyncio
async def test_groq_guard_raises_for_unknown_model(model_limits):
    limiter = MockLimiter(MockDecision(allowed=True))

    guard = GroqGuard(
        limiter=limiter,
        organization_id="org-123",
        model_limits=model_limits,
    )

    with pytest.raises(ValueError) as exc_info:
        await guard.acquire(
            model="unknown-model",
            input_tokens=100,
            max_output_tokens=500,
        )

    assert str(exc_info.value) == (
        "No groq limit mentioned for the model:unknown-model"
    )

    limiter.acquire.assert_not_awaited()


@pytest.mark.asyncio
async def test_groq_guard_raises_when_tpm_limit_exceeded(model_limits):
    limiter = MockLimiter(MockDecision(allowed=True))

    guard = GroqGuard(
        limiter=limiter,
        organization_id="org-123",
        model_limits=model_limits,
    )

    with pytest.raises(ValueError) as exc_info:
        await guard.acquire(
            model="llama-3.3-70b-versatile",
            input_tokens=9000,
            max_output_tokens=2001,
        )

    assert str(exc_info.value) == (
        "Request reserves 11001 tokens, "
        "but llama-3.3-70b-versatile has a TPM limit of 10000"
    )

    limiter.acquire.assert_not_awaited()


@pytest.mark.asyncio
async def test_groq_guard_raises_rate_limit_exceeded(model_limits):
    limiter = MockLimiter(
        MockDecision(
            allowed=False,
            retry_after_seconds=15,
        )
    )

    guard = GroqGuard(
        limiter=limiter,
        organization_id="org-123",
        model_limits=model_limits,
    )

    with pytest.raises(GroqRateLimitExceeded) as exc_info:
        await guard.acquire(
            model="llama-3.3-70b-versatile",
            input_tokens=100,
            max_output_tokens=500,
        )

    error = exc_info.value

    assert error.model == "llama-3.3-70b-versatile"
    assert error.retry_after_seconds == 15
    assert str(error) == ("Groq rate limit exceeded for model llama-3.3-70b-versatile")

    limiter.acquire.assert_awaited_once()


def test_set_and_get_groq_guard(model_limits):
    limiter = MockLimiter(MockDecision(allowed=True))

    guard = GroqGuard(
        limiter=limiter,
        organization_id="org-123",
        model_limits=model_limits,
    )

    set_groq_guard(guard)

    assert get_groq_guard() is guard


def test_get_groq_guard_raises_when_not_initialized():
    set_groq_guard(None)

    with pytest.raises(RuntimeError) as exc_info:
        get_groq_guard()

    assert str(exc_info.value) == ("Groq rate guard has not been initialized")


def test_set_groq_guard_can_clear_guard(model_limits):
    limiter = MockLimiter(MockDecision(allowed=True))

    guard = GroqGuard(
        limiter=limiter,
        organization_id="org-123",
        model_limits=model_limits,
    )

    set_groq_guard(guard)
    assert get_groq_guard() is guard

    set_groq_guard(None)

    with pytest.raises(RuntimeError):
        get_groq_guard()
