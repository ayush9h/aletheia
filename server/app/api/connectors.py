import secrets
from datetime import datetime, timedelta

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.exc import DatabaseError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.db import get_session
from app.db_service.models import UserConnectors
from app.schemas.connectors.github import GitHubConnectorRequest
from app.schemas.connectors.gmail import GmailConnectorRequest, GmailSendRequest
from app.schemas.connectors.slack import SlackConnectorRequest
from app.services.agents.gmail.client import get_gmail_client
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
    return await store_connector(
        "github", "GitHub", payload, x_connector_secret, session
    )


@connector_router.post(
    "/slack",
    tags=["connectors"],
    description="Store or update a user's Slack connector",
)
async def store_slack_connector(
    payload: SlackConnectorRequest,
    x_connector_secret: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
):
    return await store_connector("slack", "Slack", payload, x_connector_secret, session)


@connector_router.post(
    "/gmail",
    tags=["connectors"],
    description="Store or update a user's Gmail connector",
)
async def store_gmail_connector(
    payload: GmailConnectorRequest,
    x_connector_secret: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
):
    return await store_connector("gmail", "Gmail", payload, x_connector_secret, session)


@connector_router.post(
    "/gmail/send",
    tags=["connectors"],
    description="Send an email the user confirmed in the chat",
)
async def send_gmail(
    payload: GmailSendRequest,
    x_connector_secret: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
):
    check_connector_secret(x_connector_secret)

    try:
        client = await get_gmail_client(session, payload.userId)
        sent = await client.send(payload.to, payload.subject, payload.body)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    except Exception as e:
        logger.exception("Failed to send Gmail message", user_id=payload.userId)
        raise HTTPException(status_code=502, detail="Failed to send email") from e

    logger.info("Gmail message sent", user_id=payload.userId)
    return {"status": "success", "id": sent.get("id")}


def check_connector_secret(x_connector_secret: str | None) -> None:
    if not x_connector_secret or not secrets.compare_digest(
        x_connector_secret,
        settings.CONNECTOR_SECRET,
    ):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )


async def store_connector(
    provider: str,
    label: str,
    payload: GitHubConnectorRequest | SlackConnectorRequest | GmailConnectorRequest,
    x_connector_secret: str | None,
    session: AsyncSession,
):
    check_connector_secret(x_connector_secret)

    try:
        stmt = select(UserConnectors).where(
            UserConnectors.user_id == payload.userId,
            UserConnectors.provider == provider,
        )

        result = await session.execute(stmt)
        connector = result.scalar_one_or_none()

        if connector:
            connector.provider_user_id = payload.providerUserId
            connector.provider_username = payload.providerUsername
            connector.access_token = payload.accessToken
            connector.status = "connected"
            connector.updated_at = datetime.utcnow()

            logger.info(
                f"{label} connector updated",
                user_id=payload.userId,
            )

        else:
            connector = UserConnectors(
                user_id=payload.userId,
                provider=provider,
                provider_user_id=payload.providerUserId,
                provider_username=payload.providerUsername,
                access_token=payload.accessToken,
                status="connected",
            )

            session.add(connector)

            logger.info(
                f"{label} connector created",
                user_id=payload.userId,
            )

        if isinstance(payload, GmailConnectorRequest):
            connector.refresh_token = payload.refreshToken or connector.refresh_token
            connector.token_expires_at = datetime.utcnow() + timedelta(
                seconds=payload.expiresIn
            )

        await session.commit()

        return {
            "status": "success",
            "message": f"{label} connector stored successfully",
            "code": 200,
        }

    except DatabaseError as e:
        await session.rollback()

        logger.exception(
            f"Failed to store {label} connector",
            user_id=payload.userId,
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to store {label} connector",
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
    check_connector_secret(x_connector_secret)

    try:
        stmt = select(UserConnectors).where(
            UserConnectors.user_id == user_id,
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
