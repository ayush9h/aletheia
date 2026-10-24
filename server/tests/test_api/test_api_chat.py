from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.api.chats import chat_stream
from app.utils.rate_limiters.core import RateLimitDecision


@pytest.mark.asyncio
async def test_chat_stream_rejects_when_monthly_cap_reached():
    rate_limiter = MagicMock()
    rate_limiter.acquire = AsyncMock(
        return_value=RateLimitDecision(
            allowed=True, retry_after_seconds=0, limits={}, used={}, remaining={}
        )
    )
    payload = MagicMock(userId="user-1")
    session = MagicMock()
    session.add = MagicMock()

    with (
        patch("app.api.chats.get_tokens_used", AsyncMock(return_value=20_000)),
        patch("app.api.chats.settings.MONTHLY_TOKEN_CAP", 20_000),
    ):
        with pytest.raises(HTTPException) as exc:
            await chat_stream(MagicMock(), payload, session, rate_limiter)

    assert exc.value.status_code == 429
    assert exc.value.detail["token_limit"] == 20_000
    session.add.assert_not_called()
