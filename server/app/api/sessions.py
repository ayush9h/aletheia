from datetime import datetime
from typing import List

from app.db_service.db import get_session
from app.db_service.models import UserChats, UserSessions
from app.utils.logger import logger
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import delete, select

session_router = APIRouter(prefix="/v1")


@session_router.get(
    "/sessions",
    tags=["Sessions for a particular user"],
    description="Get all sessions for a given user_id",
)
async def users_session(
    user_id: str,
    session: AsyncSession = Depends(get_session),
) -> List[dict]:
    try:
        stmt = (
            select(UserSessions)
            .where(UserSessions.user_id == user_id)
            .order_by(UserSessions.created_at.desc())  # type: ignore
        )

        result = await session.execute(stmt)
        sessions = result.scalars().all()

        logger.info(f"Successfully fetched sessions")

        return [
            {
                "session_id": s.session_id,
                "session_title": s.session_title,
                "created_at": s.created_at,
                "is_pinned": s.is_pinned,
            }
            for s in sessions
        ]
    except Exception as e:
        await session.rollback()
        logger.error(f"Error occurred in fetching session due to {e}")
        return []


@session_router.delete(
    "/sessions/{session_id}",
    tags=["Sessions for a particular user"],
    description="Delete a session by session_id for a given user",
)
async def delete_session(
    session_id: int,
    user_id: str,
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
                "message": f"Exception occurred : Session not found",
                "code": 404,
            }
        await session.delete(db_session)
        await session.commit()
    except Exception as e:
        await session.rollback()
        logger.error(f"Error occurred while deleting a session: {e}")

@session_router.post("/sessions/{session_id}/toggle-pin-session")
async def pin_session(
    session_id: int,
    user_id: str,
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

        return await users_session(user_id, session)

    except Exception as e:
        await session.rollback()
        logger.error(f"Pinning chat failed due to {e}")


@session_router.delete(
    "/sessions/all-chats/{user_id}",
    tags=["user_delete_chats_all"],
    description="Delete all chats and sessions for a user",
)
async def all_chats(
    user_id: str,
    session: AsyncSession = Depends(get_session),
):

    try:

        result = await session.execute(
            select(UserSessions.session_id).where(UserSessions.user_id == user_id)
        )
        session_ids = result.scalars().all()

        if not session_ids:
            return {"message": "No sessions found"}

        session_ids = [sid for sid in session_ids]

        await session.execute(
            delete(UserChats).where(UserChats.session_id.in_(session_ids))
        )

        await session.execute(
            delete(UserSessions).where(UserSessions.user_id == user_id)  # type:ignore
        )
        await session.commit()

        return {"message": "All chats deleted successfully"}

    except Exception as e:
        await session.rollback()
        logger.error(f"Error deleting chats: {e}")
