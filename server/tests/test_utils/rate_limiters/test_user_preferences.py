from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException, status

from app.utils.rate_limiters.endpoints.user_preferences import (
    user_preferences_read_rate_limit,
    user_preferences_write_rate_limit,
    user_prefs_read_throttle,
    user_prefs_write_throttle,
)


class MockLimitResult:
    def __init__(self, limited: bool) -> None:
        self.limited = limited


@pytest.mark.asyncio
async def test_user_preferences_read_rate_limit_allows_request(
    monkeypatch,
):
    mock_limit = AsyncMock(
        return_value=MockLimitResult(limited=False),
    )

    monkeypatch.setattr(
        user_prefs_read_throttle,
        "limit",
        mock_limit,
    )

    await user_preferences_read_rate_limit("user-123")

    mock_limit.assert_awaited_once_with(
        "user-preferences:read:user-123",
    )


@pytest.mark.asyncio
async def test_user_preferences_read_rate_limit_rejects_request(
    monkeypatch,
):
    mock_limit = AsyncMock(
        return_value=MockLimitResult(limited=True),
    )

    monkeypatch.setattr(
        user_prefs_read_throttle,
        "limit",
        mock_limit,
    )

    with pytest.raises(HTTPException) as exc_info:
        await user_preferences_read_rate_limit("user-123")

    assert exc_info.value.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert (
        exc_info.value.detail
        == "Too many user preference requests. Please try again later."
    )

    mock_limit.assert_awaited_once_with(
        "user-preferences:read:user-123",
    )


@pytest.mark.asyncio
async def test_user_preferences_write_rate_limit_allows_request(
    monkeypatch,
):
    mock_limit = AsyncMock(
        return_value=MockLimitResult(limited=False),
    )

    monkeypatch.setattr(
        user_prefs_write_throttle,
        "limit",
        mock_limit,
    )

    payload = SimpleNamespace(userId="user-123")

    await user_preferences_write_rate_limit(payload)

    mock_limit.assert_awaited_once_with(
        "user-preferences:write:user-123",
    )


@pytest.mark.asyncio
async def test_user_preferences_write_rate_limit_rejects_request(
    monkeypatch,
):
    mock_limit = AsyncMock(
        return_value=MockLimitResult(limited=True),
    )

    monkeypatch.setattr(
        user_prefs_write_throttle,
        "limit",
        mock_limit,
    )

    payload = SimpleNamespace(userId="user-123")

    with pytest.raises(HTTPException) as exc_info:
        await user_preferences_write_rate_limit(payload)

    assert exc_info.value.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert (
        exc_info.value.detail
        == "Too many user preference updates. Please try again later."
    )

    mock_limit.assert_awaited_once_with(
        "user-preferences:write:user-123",
    )
