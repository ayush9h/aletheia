import structlog
from fastapi import APIRouter, Depends
from sqlalchemy.exc import DatabaseError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.db import get_session
from app.db_service.models import UserPrefs
from app.schemas.user_pref import UserPref
from app.utils.rate_limiters.endpoints.user_preferences import (
    user_preferences_read_rate_limit, user_preferences_write_rate_limit)

logger = structlog.get_logger(__name__)

user_router = APIRouter(prefix="/v1/users")


@user_router.post(
    "/preferences",
    tags=["user_preferences"],
    description="Store the updated user preference",
)
async def store_user_pref(
    payload: UserPref,
    _: None = Depends(user_preferences_write_rate_limit),
    session: AsyncSession = Depends(get_session),
):
    try:
        stmt = select(UserPrefs).where(UserPrefs.user_id == payload.userId)

        result = await session.execute(stmt)
        pref = result.scalar_one_or_none()

        if pref:
            pref.assistant_behavior = payload.userCustomInstruction
            pref.nickname = payload.nickname
            pref.user_personal_description = payload.userHobbies
            pref.memory_enabled = payload.memoryEnabled
            pref.occupation = payload.occupation
            pref.baseTone = payload.baseTone

            logger.info(
                "User preferences updated",
                user_id=payload.userId,
            )

        else:
            pref = UserPrefs(
                user_id=payload.userId,
                nickname=payload.nickname,
                assistant_behavior=payload.userCustomInstruction,
                user_personal_description=payload.userHobbies,
                occupation=payload.occupation,
                baseTone=payload.baseTone,
                memory_enabled=payload.memoryEnabled,
            )

            session.add(pref)

            logger.info(
                "New user preferences created",
                user_id=payload.userId,
            )

        await session.commit()

        return {
            "status": "success",
            "message": "User preferences updated successfully",
            "code": 200,
        }

    except DatabaseError:
        await session.rollback()

        logger.exception(
            "Failed to update user preferences",
            user_id=payload.userId,
        )

        return {
            "status": "failure",
            "message": "Unable to update user preferences",
            "code": 500,
        }


@user_router.get(
    "/preferences",
    tags=["user_preferences"],
    description="Get user preferences by user ID",
)
async def get_user_pref(
    user_id: str,
    _: None = Depends(user_preferences_read_rate_limit),
    session: AsyncSession = Depends(get_session),
):
    try:
        stmt = select(UserPrefs).where(UserPrefs.user_id == user_id)

        result = await session.execute(stmt)
        pref = result.scalar_one_or_none()

        if not pref:
            return {
                "userId": user_id,
                "userCustomInstruction": "",
                "nickname": "",
                "userHobbies": "",
                "occupation": "",
                "baseTone": "",
                "memoryEnabled": False,
            }

        return {
            "userId": pref.user_id,
            "userCustomInstruction": pref.assistant_behavior or "",
            "nickname": pref.nickname or "",
            "userHobbies": pref.user_personal_description or "",
            "occupation": pref.occupation or "",
            "baseTone": pref.baseTone or "",
            "memoryEnabled": pref.memory_enabled,
        }

    except DatabaseError:
        await session.rollback()

        logger.exception(
            "Failed to fetch user preferences",
            user_id=user_id,
        )

        return {
            "status": "failure",
            "message": "Unable to fetch user preferences",
            "code": 500,
        }
