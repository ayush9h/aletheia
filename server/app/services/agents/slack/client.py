import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.models import UserConnectors

REAUTH_ERRORS = {"invalid_auth", "token_revoked", "token_expired", "account_inactive"}


class SlackClient:
    BASE_URL = "https://slack.com/api"

    def __init__(
        self,
        access_token: str,
        session: AsyncSession,
        user_id: str,
    ):
        self.access_token = access_token
        self.session = session
        self.user_id = user_id

    @property
    def headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.access_token}"}

    async def user_reauth(self) -> None:
        statement = select(UserConnectors).where(
            UserConnectors.user_id == self.user_id,
            UserConnectors.provider == "slack",
        )

        result = await self.session.execute(statement)

        connector = result.scalar_one_or_none()

        if not connector:
            return

        connector.status = "reauth"

        await self.session.commit()

    async def get(
        self,
        method: str,
        params: dict | None = None,
    ):
        async with httpx.AsyncClient(
            base_url=self.BASE_URL,
            timeout=30,
        ) as client:
            response = await client.get(
                f"/{method}",
                headers=self.headers,
                params=params,
            )

        response.raise_for_status()
        data = response.json()

        if data.get("ok"):
            return data

        error = data.get("error")

        if error in REAUTH_ERRORS:
            await self.user_reauth()

        raise RuntimeError(f"Slack API error: method={method}, error={error}")


async def get_slack_client(
    session: AsyncSession,
    user_id: str,
) -> SlackClient:
    statement = select(UserConnectors).where(
        UserConnectors.user_id == user_id,
        UserConnectors.provider == "slack",
        UserConnectors.status == "connected",
    )

    result = await session.execute(statement)

    connector = result.scalar_one_or_none()

    if not connector:
        raise ValueError("Slack is not connected.")

    if not connector.access_token:
        raise ValueError("Slack access token is missing.")

    return SlackClient(
        access_token=connector.access_token,
        session=session,
        user_id=user_id,
    )
