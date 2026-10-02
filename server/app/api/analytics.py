from collections import defaultdict
from datetime import datetime, timedelta

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import DatabaseError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.db import get_session
from app.db_service.models import UserChats, UserSessions

logger = structlog.get_logger(__name__)

analytics_router = APIRouter(prefix="/v1")


def format_duration(seconds: float) -> str:
    seconds = max(0, int(seconds))

    minutes, remaining_seconds = divmod(seconds, 60)

    if minutes == 0:
        return f"{remaining_seconds}s"

    hours, minutes = divmod(minutes, 60)

    if hours:
        return f"{hours}h {minutes}m"

    return f"{minutes}m {remaining_seconds}s"


def empty_weekly_activity():
    return [
        {"day": day, "messages": 0}
        for day in [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
        ]
    ]


@analytics_router.get(
    "/analytics",
    tags=["Analytics"],
    description="Get analytics for a particular user",
)
async def get_user_analytics(
    user_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:

        session_result = await session.execute(
            select(UserSessions).where(
                UserSessions.user_id == user_id
            )
        )

        user_sessions = session_result.scalars().all()

        session_ids = [
            item.session_id
            for item in user_sessions
        ]

        logger.info(
            "Analytics sessions fetched",
            user_id=user_id,
            session_count=len(user_sessions),
            session_ids=session_ids,
        )

        if not session_ids:
            logger.warning(
                "No sessions found for analytics",
                user_id=user_id,
            )

            return {
                "total_conversations": 0,
                "messages_sent": 0,
                "average_session": "0s",
                "active_days": 0,
                "weekly_activity": empty_weekly_activity(),
            }

        chat_result = await session.execute(
            select(UserChats).where(
                UserChats.session_id.in_(session_ids)
            )
        )

        chats = chat_result.scalars().all()

        logger.info(
            "Analytics chats fetched",
            user_id=user_id,
            session_count=len(session_ids),
            chat_count=len(chats),
        )

        messages_sent = len(chats)
        tokens_consumed = sum(
            int(chat.tokens_consumed or 0)
            for chat in chats
        )

        session_durations: dict[int, float] = defaultdict(float)

        for chat in chats:
            duration = chat.duration or 0

            session_durations[chat.session_id] += float(duration)

        if session_durations:
            average_duration = (
                sum(session_durations.values())
                / len(session_durations)
            )
        else:
            average_duration = 0


        now = datetime.utcnow()

        thirty_days_ago = now - timedelta(days=30)

        active_dates = set()

        for chat in chats:
            if not chat.created_at:
                continue

            if chat.created_at >= thirty_days_ago:
                active_dates.add(chat.created_at.date())

        active_days = len(active_dates)

        weekly_dates = [
            (now - timedelta(days=i)).date()
            for i in range(6, -1, -1)
        ]

        weekly_counts = {
            date: 0
            for date in weekly_dates
        }

        for chat in chats:
            if not chat.created_at:
                continue

            chat_date = chat.created_at.date()

            if chat_date in weekly_counts:
                weekly_counts[chat_date] += 1

        weekly_activity = [
            {
                "day": date.strftime("%a"),
                "messages": weekly_counts[date],
            }
            for date in weekly_dates
        ]

        response = {
            "total_conversations": len(user_sessions),
            "messages_sent": messages_sent,
            "average_session": format_duration(
                average_duration
            ),
            "active_days": active_days,
            "weekly_activity": weekly_activity,
            "tokens_consumed": tokens_consumed,
        }

        logger.info(
            "User analytics calculated",
            user_id=user_id,
            total_conversations=response["total_conversations"],
            messages_sent=response["messages_sent"],
            average_session=response["average_session"],
            active_days=response["active_days"],
            weekly_activity=response["weekly_activity"],
            tokens_consumed=response["tokens_consumed"],
        )

        return response

    except DatabaseError as error:
        await session.rollback()

        logger.exception(
            "Failed to fetch user analytics",
            user_id=user_id,
            error=str(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to fetch analytics",
        )
