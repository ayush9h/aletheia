import base64
from datetime import datetime, timedelta
from email.message import EmailMessage

import httpx
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.models import UserConnectors
from app.utils.config import settings

logger = structlog.get_logger(__name__)

TOKEN_URL = "https://oauth2.googleapis.com/token"
REAUTH_MESSAGE = "Gmail access expired. Reconnect Gmail in Connectors."


class GmailClient:
    BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me"

    def __init__(self, connector: UserConnectors, session: AsyncSession):
        self.connector = connector
        self.session = session

    async def user_reauth(self) -> None:
        self.connector.status = "reauth"
        await self.session.commit()

    async def access_token(self) -> str:
        expires_at = self.connector.token_expires_at
        if expires_at and expires_at > datetime.utcnow() + timedelta(minutes=1):
            return self.connector.access_token or ""

        if not self.connector.refresh_token:
            await self.user_reauth()
            raise ValueError(REAUTH_MESSAGE)

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET.get_secret_value(),
                    "refresh_token": self.connector.refresh_token,
                },
            )

        if response.status_code in (400, 401):
            logger.warning(
                "Gmail token refresh rejected", user_id=self.connector.user_id
            )
            await self.user_reauth()
            raise ValueError(REAUTH_MESSAGE)
        response.raise_for_status()

        data = response.json()
        self.connector.access_token = data["access_token"]
        self.connector.token_expires_at = datetime.utcnow() + timedelta(
            seconds=int(data.get("expires_in", 3600))
        )
        self.connector.updated_at = datetime.utcnow()
        await self.session.commit()
        return self.connector.access_token

    async def request(self, method: str, path: str, **kwargs) -> dict:
        token = await self.access_token()
        async with httpx.AsyncClient(base_url=self.BASE_URL, timeout=30) as client:
            response = await client.request(
                method,
                path,
                headers={"Authorization": f"Bearer {token}"},
                **kwargs,
            )

        if response.status_code == 401:
            await self.user_reauth()
            raise ValueError(REAUTH_MESSAGE)
        if response.status_code >= 400:
            raise RuntimeError(
                f"Gmail API error: path={path}, status={response.status_code}"
            )
        return response.json()

    async def send(self, to: str, subject: str, body: str) -> dict:
        message = EmailMessage()
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return await self.request("POST", "/messages/send", json={"raw": raw})


async def get_gmail_client(session: AsyncSession, user_id: str) -> GmailClient:
    statement = select(UserConnectors).where(
        UserConnectors.user_id == user_id,
        UserConnectors.provider == "gmail",
        UserConnectors.status == "connected",
    )
    result = await session.execute(statement)
    connector = result.scalar_one_or_none()

    if not connector or not connector.access_token:
        raise ValueError("Gmail is not connected.")

    return GmailClient(connector, session)
