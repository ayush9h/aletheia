from app.db_service.db import get_session
from app.db_service.models import UserPrefs
from app.schemas.user_pref import UserPref
from app.utils.logger import logger
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

user_router = APIRouter(prefix="/v1/users")


@user_router.post(
    "/preferences",
    tags=["user_preferences"],
    description="Store the updated user preference",
)
async def store_user_pref(
    payload: UserPref,
    session: AsyncSession = Depends(get_session),
):

    try:
        stmt = select(UserPrefs).where(UserPrefs.user_id == payload.userId)
        result = await session.execute(stmt)
        pref = result.scalar_one_or_none()

        if pref:
            pref.assistant_behavior = payload.userCustomInstruction
            pref.alias = payload.nickname
            pref.user_personal_description = payload.userHobbies
            logger.info("User preferences updated")
        else:
            pref = UserPrefs(
                user_id=payload.userId,
                nickname=payload.nickname,
                assistant_behavior=payload.userCustomInstruction,
                user_personal_description=payload.userHobbies,
                occupation=payload.occupation,
                baseTone=payload.baseTone,
            )
            session.add(pref)
            logger.info("New user preferences created")

        logger.info("User preferences updated successfully")

        await session.commit()

        return {
            "status": "success",
            "message": "User preferences updated successfully",
            "code": 200,
        }

    except Exception as e:
        await session.rollback()
        return {
            "status": "failure",
            "message": f"Error occurred: {e}",
            "code": 400,
        }


@user_router.get(
    "/preferences",
    tags=["user_preferences"],
    description="Get user preferences by user ID",
)
async def get_user_pref(
    user_id: str,
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
            }

        return {
            "userId": pref.user_id,
            "userCustomInstruction": pref.assistant_behavior or "",
            "nickname": pref.nickname or "",
            "userHobbies": pref.user_personal_description or "",
            "occupation": pref.occupation,
            "baseTone": pref.baseTone,
        }

    except Exception as e:
        await session.rollback()
        logger.error(f"Error occurred due to {e}")
