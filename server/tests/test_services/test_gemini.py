from unittest.mock import AsyncMock, patch

import pytest

from app.services.gemini import (GeminiFreeTierLimiter,
                                 GeminiRateLimitExceeded)
from app.utils.rate_limiters.core import RateLimitDecision


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


def decision(allowed: bool, retry_after: int = 0) -> RateLimitDecision:
    return RateLimitDecision(
        allowed=allowed,
        retry_after_seconds=retry_after,
        limits={},
        used={},
        remaining={},
    )


@pytest.mark.anyio
async def test_allowed_request_passes() -> None:
    limiter = GeminiFreeTierLimiter()
    limiter.limiter = AsyncMock()
    limiter.limiter.acquire.return_value = decision(True)

    assert await limiter.aacquire() is True


@pytest.mark.anyio
async def test_short_wait_sleeps_then_retries() -> None:
    limiter = GeminiFreeTierLimiter()
    limiter.limiter = AsyncMock()
    limiter.limiter.acquire.side_effect = [decision(False, 3), decision(True)]

    with patch("app.services.gemini.asyncio.sleep", new=AsyncMock()) as sleep:
        assert await limiter.aacquire() is True

    sleep.assert_awaited_once_with(3)


@pytest.mark.anyio
async def test_spent_daily_quota_raises() -> None:
    limiter = GeminiFreeTierLimiter()
    limiter.limiter = AsyncMock()
    limiter.limiter.acquire.return_value = decision(False, 3600)

    with pytest.raises(GeminiRateLimitExceeded):
        await limiter.aacquire()
