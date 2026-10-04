from collections import defaultdict
from datetime import datetime, timedelta

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import DatabaseError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.db import get_session
from app.db_service.models import UserChats, UserSessions
from app.utils.rate_limiters.endpoints.analytics import analytics_rate_limit

logger = structlog.get_logger(__name__)

analytics_router = APIRouter(prefix="/v1")

WEEK_DAYS = 7


def format_duration(seconds: float) -> str:
    seconds = max(0, int(seconds))

    minutes, remaining_seconds = divmod(seconds, 60)

    if minutes == 0:
        return f"{remaining_seconds}s"

    hours, minutes = divmod(minutes, 60)

    if hours:
        return f"{hours}h {minutes}m"

    return f"{minutes}m {remaining_seconds}s"


def get_week_dates(today):
    return [today - timedelta(days=offset) for offset in range(WEEK_DAYS - 1, -1, -1)]


def build_weekly_tokens(chats, week_dates):
    token_by_date = dict.fromkeys(week_dates, 0)

    for chat in chats:
        if not chat.created_at:
            continue

        chat_date = chat.created_at.date()

        if chat_date in token_by_date:
            token_by_date[chat_date] += int(chat.tokens_consumed or 0)

    return [
        {
            "day": date.strftime("%a"),
            "tokens": token_by_date[date],
        }
        for date in week_dates
    ]


@analytics_router.get(
    "/analytics",
    tags=["Analytics"],
    description="Get analytics for a particular user",
)
async def get_user_analytics(
    user_id: str,
    _: None = Depends(analytics_rate_limit),
    session: AsyncSession = Depends(get_session),
):
    try:
        session_result = await session.execute(
            select(UserSessions).where(UserSessions.user_id == user_id)
        )

        user_sessions = session_result.scalars().all()
        session_ids = [item.session_id for item in user_sessions]

        if not session_ids:
            today = datetime.utcnow().date()
            week_dates = get_week_dates(today)

            return {
                "total_conversations": 0,
                "messages_sent": 0,
                "average_session": "0s",
                "tokens_consumed": 0,
                "weekly_tokens": [
                    {
                        "day": date.strftime("%a"),
                        "tokens": 0,
                    }
                    for date in week_dates
                ],
            }

        chat_result = await session.execute(
            select(UserChats).where(UserChats.session_id.in_(session_ids))
        )

        chats = chat_result.scalars().all()

        messages_sent = len(chats)

        tokens_consumed = sum(int(chat.tokens_consumed or 0) for chat in chats)

        session_durations: dict[int, float] = defaultdict(float)

        for chat in chats:
            session_durations[chat.session_id] += float(chat.duration or 0)

        average_duration = (
            sum(session_durations.values()) / len(session_durations)
            if session_durations
            else 0
        )

        today = datetime.utcnow().date()
        week_dates = get_week_dates(today)

        weekly_tokens = build_weekly_tokens(
            chats,
            week_dates,
        )

        response = {
            "total_conversations": len(user_sessions),
            "messages_sent": messages_sent,
            "average_session": format_duration(average_duration),
            "tokens_consumed": tokens_consumed,
            "weekly_tokens": weekly_tokens,
        }

        logger.info(
            "User analytics calculated",
            user_id=user_id,
            total_conversations=response["total_conversations"],
            messages_sent=response["messages_sent"],
            average_session=response["average_session"],
            tokens_consumed=response["tokens_consumed"],
            weekly_tokens=response["weekly_tokens"],
        )

        return response

    except DatabaseError:
        await session.rollback()

        logger.exception(
            "Failed to fetch user analytics",
            user_id=user_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to fetch analytics",
        )
