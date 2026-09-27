import secrets

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.exc import DatabaseError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.db import get_session
from app.db_service.models import UserConnectors
from app.schemas.connectors.github import GitHubConnectorRequest
from app.utils.config import settings

logger = structlog.get_logger(__name__)

connector_router = APIRouter(prefix="/v1/connectors")


@connector_router.post(
    "/github",
    tags=["connectors"],
    description="Store or update a user's GitHub connector",
)
async def store_github_connector(
    payload: GitHubConnectorRequest,
    x_connector_secret: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
):
    if not x_connector_secret or not secrets.compare_digest(
        x_connector_secret,
        settings.CONNECTOR_SECRET,
    ):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )

    try:
        stmt = select(UserConnectors).where(
            UserConnectors.user_id == payload.userId,
            UserConnectors.provider == "github",
        )

        result = await session.execute(stmt)
        connector = result.scalar_one_or_none()

        if connector:
            connector.provider_user_id = payload.providerUserId
            connector.provider_username = payload.providerUsername
            connector.access_token = payload.accessToken
            connector.status = "connected"

            logger.info(
                "GitHub connector updated",
                user_id=payload.userId,
            )

        else:
            connector = UserConnectors(
                user_id=payload.userId,
                provider="github",
                provider_user_id=payload.providerUserId,
                provider_username=payload.providerUsername,
                access_token=payload.accessToken,
                status="connected",
            )

            session.add(connector)

            logger.info(
                "GitHub connector created",
                user_id=payload.userId,
            )

        await session.commit()

        return {
            "status": "success",
            "message": "GitHub connector stored successfully",
            "code": 200,
        }

    except DatabaseError as e:
        await session.rollback()

        logger.exception(
            "Failed to store GitHub connector",
            user_id=payload.userId,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to store GitHub connector",
        ) from e



@connector_router.get(
    "",
    tags=["connectors"],
    description="Get connected connectors for a user",
)
async def get_user_connectors(
    user_id: str,
    x_connector_secret: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
):
    if not x_connector_secret or not secrets.compare_digest(
        x_connector_secret,
        settings.CONNECTOR_SECRET,
    ):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )

    try:
        stmt = select(UserConnectors).where(
            UserConnectors.user_id == user_id,
            UserConnectors.status == "connected",
        )

        result = await session.execute(stmt)
        connectors = result.scalars().all()

        return {
            "status": "success",
            "connectors": [
                {
                    "provider": connector.provider,
                    "providerUserId": connector.provider_user_id,
                    "providerUsername": connector.provider_username,
                    "status": connector.status,
                }
                for connector in connectors
            ],
        }

    except DatabaseError as e:
        await session.rollback()

        logger.exception(
            "Failed to fetch user connectors",
            user_id=user_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch connectors",
        ) from e
