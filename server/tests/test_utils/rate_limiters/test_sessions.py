from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException, status

from app.utils.rate_limiters.endpoints.sessions import (
    session_rate_limit,
    session_throttle,
)


class MockLimitResult:
    def __init__(self, limited: bool) -> None:
        self.limited = limited


@pytest.mark.asyncio
async def test_session_rate_limit_allows_request(monkeypatch):
    mock_limit = AsyncMock(
        return_value=MockLimitResult(limited=False),
    )

    monkeypatch.setattr(
        session_throttle,
        "limit",
        mock_limit,
    )

    await session_rate_limit("user-123")

    mock_limit.assert_awaited_once_with(
        "sessions:user:user-123",
    )


@pytest.mark.asyncio
async def test_session_rate_limit_rejects_request(monkeypatch):
    mock_limit = AsyncMock(
        return_value=MockLimitResult(limited=True),
    )

    monkeypatch.setattr(
        session_throttle,
        "limit",
        mock_limit,
    )

    with pytest.raises(HTTPException) as exc_info:
        await session_rate_limit("user-123")

    assert exc_info.value.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert exc_info.value.detail == "Too many session requests. Please try again later."

    mock_limit.assert_awaited_once_with(
        "sessions:user:user-123",
    )
