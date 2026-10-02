import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.models import UserConnectors


class GitHubClient:
    BASE_URL = "https://api.github.com"

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
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def user_reauth(self) -> None:
        statement = select(UserConnectors).where(
            UserConnectors.user_id == self.user_id,
            UserConnectors.provider == "github",
        )

        result = await self.session.execute(statement)

        connector = result.scalar_one_or_none()

        if not connector:
            return

        connector.status = "reauth"

        await self.session.commit()

    async def get(
        self,
        path: str,
        params: dict | None = None,
    ):
        async with httpx.AsyncClient(
            base_url=self.BASE_URL,
            timeout=30,
        ) as client:
            response = await client.get(
                path,
                headers=self.headers,
                params=params,
            )

        if response.status_code == 401:
            await self.user_reauth()

        elif response.is_error:
            raise RuntimeError(
                f"GitHub API error: "
                f"status={response.status_code}, "
                f"body={response.text}"
            )

        return response.json()


async def get_github_client(
    session: AsyncSession,
    user_id: str,
) -> GitHubClient:
    statement = select(UserConnectors).where(
        UserConnectors.user_id == user_id,
        UserConnectors.provider == "github",
        UserConnectors.status == "connected",
    )

    result = await session.execute(statement)

    connector = result.scalar_one_or_none()

    if not connector:
        raise ValueError("GitHub is not connected.")

    if not connector.access_token:
        raise ValueError("GitHub access token is missing.")

    return GitHubClient(
        access_token=connector.access_token,
        session=session,
        user_id=user_id,
    )
