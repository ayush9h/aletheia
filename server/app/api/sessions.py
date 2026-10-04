from datetime import datetime

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy.exc import DatabaseError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import delete, select

from app.db_service.db import get_session
from app.db_service.models import UserChats, UserSessions
from app.utils.rate_limiters.endpoints.sessions import session_rate_limit

logger = structlog.get_logger(__name__)

session_router = APIRouter(prefix="/v1")


@session_router.get(
    "/sessions",
    tags=["Sessions for a particular user"],
    description="Get all sessions for a given user_id",
)
async def users_session(
    user_id: str,
    _: None = Depends(session_rate_limit),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    try:
        stmt = (
            select(UserSessions)
            .where(UserSessions.user_id == user_id)
            .order_by(UserSessions.created_at.desc())  # type: ignore
        )

        result = await session.execute(stmt)
        sessions = result.scalars().all()

        logger.info(
            "Successfully fetched sessions",
            user_id=user_id,
        )

        return [
            {
                "session_id": item.session_id,
                "session_title": item.session_title,
                "created_at": item.created_at,
                "is_pinned": item.is_pinned,
            }
            for item in sessions
        ]

    except DatabaseError:
        await session.rollback()

        logger.exception(
            "Error occurred while fetching sessions",
            user_id=user_id,
        )

        return []


@session_router.delete(
    "/sessions/{session_id}",
    tags=["Sessions for a particular user"],
    description="Delete a session by session_id for a given user",
)
async def delete_session(
    session_id: int,
    user_id: str,
    _: None = Depends(session_rate_limit),
    session: AsyncSession = Depends(get_session),
):
    try:
        stmt = select(UserSessions).where(
            UserSessions.session_id == session_id,
            UserSessions.user_id == user_id,
        )

        result = await session.execute(stmt)
        db_session = result.scalar_one_or_none()

        if not db_session:
            return {
                "status": "Exception",
                "message": "Exception occurred : Session not found",
                "code": 404,
            }

        await session.delete(db_session)
        await session.commit()

        logger.info(
            "Session deleted",
            user_id=user_id,
            session_id=session_id,
        )

        return {
            "status": "success",
            "message": "Session deleted successfully",
        }

    except DatabaseError:
        await session.rollback()

        logger.exception(
            "Error occurred while deleting a session",
            user_id=user_id,
            session_id=session_id,
        )

        return {
            "status": "error",
            "message": "Unable to delete session",
        }


@session_router.post(
    "/sessions/{session_id}/toggle-pin-session",
)
async def pin_session(
    session_id: int,
    user_id: str,
    _: None = Depends(session_rate_limit),
    session: AsyncSession = Depends(get_session),
):
    try:
        stmt = select(UserSessions).where(
            UserSessions.session_id == session_id,
            UserSessions.user_id == user_id,
        )

        result = await session.execute(stmt)
        db_session = result.scalar_one_or_none()

        if not db_session:
            return []

        if db_session.is_pinned:
            db_session.is_pinned = False
            db_session.pinned_at = None
        else:
            db_session.is_pinned = True
            db_session.pinned_at = datetime.utcnow()

        await session.commit()

        logger.info(
            "Session pin state updated",
            user_id=user_id,
            session_id=session_id,
            is_pinned=db_session.is_pinned,
        )

        return await users_session(
            user_id=user_id,
            session=session,
        )

    except DatabaseError:
        await session.rollback()

        logger.exception(
            "Pinning chat failed",
            user_id=user_id,
            session_id=session_id,
        )

        return []


@session_router.delete(
    "/sessions/all-chats/{user_id}",
    tags=["user_delete_chats_all"],
    description="Delete all chats and sessions for a user",
)
async def all_chats(
    user_id: str,
    _: None = Depends(session_rate_limit),
    session: AsyncSession = Depends(get_session),
):
    try:
        result = await session.execute(
            select(UserSessions.session_id).where(UserSessions.user_id == user_id)
        )

        session_ids = result.scalars().all()

        if not session_ids:
            return {
                "message": "No sessions found",
            }

        await session.execute(
            delete(UserChats).where(UserChats.session_id.in_(session_ids))
        )

        await session.execute(
            delete(UserSessions).where(UserSessions.user_id == user_id)
        )

        await session.commit()

        logger.info(
            "All sessions deleted",
            user_id=user_id,
        )

        return {
            "message": "All chats deleted successfully",
        }

    except DatabaseError:
        await session.rollback()

        logger.exception(
            "Error deleting chats",
            user_id=user_id,
        )

        return {
            "message": "Unable to delete chats",
        }
