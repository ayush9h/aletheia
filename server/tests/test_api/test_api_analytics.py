from datetime import date, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import DatabaseError

from app.api.analytics import (
    WEEK_DAYS,
    build_weekly_tokens,
    format_duration,
    get_user_analytics,
    get_week_dates,
)
from app.db_service.models import UserChats, UserSessions


def make_session_result(items):
    result = MagicMock()
    result.scalars.return_value.all.return_value = items
    return result


# Format duration


def test_format_duration_seconds():
    assert format_duration(45) == "45s"


def test_format_duration_minutes():
    assert format_duration(125) == "2m 5s"


def test_format_duration_hours():
    assert format_duration(3725) == "1h 2m"


def test_format_duration_negative_seconds():
    assert format_duration(-10) == "0s"


def test_format_duration_truncates_fractional_seconds():
    assert format_duration(59.9) == "59s"


# get week dates
def test_get_week_dates_returns_last_seven_dates():
    today = date(2026, 10, 8)

    result = get_week_dates(today)

    assert len(result) == WEEK_DAYS
    assert result[0] == date(2026, 10, 2)
    assert result[-1] == today


# Week tokens


def test_build_weekly_tokens_aggregates_tokens_by_date():
    week_dates = [
        date(2026, 10, 2),
        date(2026, 10, 3),
        date(2026, 10, 4),
        date(2026, 10, 5),
        date(2026, 10, 6),
        date(2026, 10, 7),
        date(2026, 10, 8),
    ]

    chat_1 = MagicMock()
    chat_1.created_at = datetime(2026, 10, 8, 10, 30)
    chat_1.tokens_consumed = 100

    chat_2 = MagicMock()
    chat_2.created_at = datetime(2026, 10, 8, 15, 30)
    chat_2.tokens_consumed = 250

    chat_3 = MagicMock()
    chat_3.created_at = datetime(2026, 10, 5, 12, 0)
    chat_3.tokens_consumed = 50

    result = build_weekly_tokens(
        [chat_1, chat_2, chat_3],
        week_dates,
    )

    assert result == [
        {"day": "Fri", "tokens": 0},
        {"day": "Sat", "tokens": 0},
        {"day": "Sun", "tokens": 0},
        {"day": "Mon", "tokens": 50},
        {"day": "Tue", "tokens": 0},
        {"day": "Wed", "tokens": 0},
        {"day": "Thu", "tokens": 350},
    ]


def test_build_weekly_tokens_ignores_chat_without_created_at():
    week_dates = get_week_dates(date(2026, 10, 8))

    chat = MagicMock()
    chat.created_at = None
    chat.tokens_consumed = 100

    result = build_weekly_tokens([chat], week_dates)

    assert all(item["tokens"] == 0 for item in result)


def test_build_weekly_tokens_ignores_chat_outside_week():
    week_dates = get_week_dates(date(2026, 10, 8))

    chat = MagicMock()
    chat.created_at = datetime(2026, 9, 30, 10, 0)
    chat.tokens_consumed = 100

    result = build_weekly_tokens([chat], week_dates)

    assert all(item["tokens"] == 0 for item in result)


def test_build_weekly_tokens_handles_missing_tokens():
    week_dates = get_week_dates(date(2026, 10, 8))

    chat = MagicMock()
    chat.created_at = datetime(2026, 10, 8, 10, 0)
    chat.tokens_consumed = None

    result = build_weekly_tokens([chat], week_dates)

    assert result[-1]["tokens"] == 0


@pytest.mark.asyncio
async def test_get_user_analytics_returns_defaults_when_no_sessions():
    session = MagicMock()

    session.execute = AsyncMock(return_value=make_session_result([]))

    session.rollback = AsyncMock()

    result = await get_user_analytics(
        user_id="user-123",
        session=session,
    )

    assert result["total_conversations"] == 0
    assert result["messages_sent"] == 0
    assert result["average_session"] == "0s"
    assert result["tokens_consumed"] == 0

    assert len(result["weekly_tokens"]) == 7
    assert all(item["tokens"] == 0 for item in result["weekly_tokens"])

    session.execute.assert_awaited_once()
    session.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_user_analytics_calculates_metrics():
    session = MagicMock()

    session_1 = MagicMock(spec=UserSessions)
    session_1.session_id = "session-1"

    session_2 = MagicMock(spec=UserSessions)
    session_2.session_id = "session-2"

    chat_1 = MagicMock(spec=UserChats)
    chat_1.session_id = "session-1"
    chat_1.tokens_consumed = 100
    chat_1.duration = 30
    chat_1.created_at = datetime.utcnow()

    chat_2 = MagicMock(spec=UserChats)
    chat_2.session_id = "session-1"
    chat_2.tokens_consumed = 200
    chat_2.duration = 60
    chat_2.created_at = datetime.utcnow()

    chat_3 = MagicMock(spec=UserChats)
    chat_3.session_id = "session-2"
    chat_3.tokens_consumed = 50
    chat_3.duration = 90
    chat_3.created_at = datetime.utcnow()

    session.execute = AsyncMock(
        side_effect=[
            make_session_result([session_1, session_2]),
            make_session_result([chat_1, chat_2, chat_3]),
        ]
    )

    session.rollback = AsyncMock()

    result = await get_user_analytics(
        user_id="user-123",
        session=session,
    )

    assert result["total_conversations"] == 2
    assert result["messages_sent"] == 3
    assert result["tokens_consumed"] == 350

    assert result["average_session"] == "1m 30s"

    assert len(result["weekly_tokens"]) == 7
    assert result["weekly_tokens"][-1]["tokens"] == 350

    assert session.execute.await_count == 2
    session.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_user_analytics_handles_sessions_without_chats():
    session = MagicMock()

    session_1 = MagicMock(spec=UserSessions)
    session_1.session_id = "session-1"

    session.execute = AsyncMock(
        side_effect=[
            make_session_result([session_1]),
            make_session_result([]),
        ]
    )

    session.rollback = AsyncMock()

    result = await get_user_analytics(
        user_id="user-123",
        session=session,
    )

    assert result["total_conversations"] == 1
    assert result["messages_sent"] == 0
    assert result["tokens_consumed"] == 0
    assert result["average_session"] == "0s"

    assert len(result["weekly_tokens"]) == 7
    assert all(item["tokens"] == 0 for item in result["weekly_tokens"])


@pytest.mark.asyncio
async def test_get_user_analytics_handles_database_error():
    session = MagicMock()

    session.execute = AsyncMock(
        side_effect=DatabaseError(
            "SELECT",
            {},
            Exception("database unavailable"),
        )
    )

    session.rollback = AsyncMock()

    with pytest.raises(HTTPException) as exc_info:
        await get_user_analytics(
            user_id="user-123",
            session=session,
        )

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Unable to fetch analytics"

    session.rollback.assert_awaited_once()
