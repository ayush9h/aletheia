from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.agents.github.client import GitHubClient, get_github_client


def test_github_client_headers() -> None:
    client = GitHubClient(
        access_token="token-123",
        session=MagicMock(),
        user_id="user-123",
    )

    assert client.headers == {
        "Authorization": "Bearer token-123",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


@pytest.mark.asyncio
async def test_user_reauth_no_connector() -> None:
    session = MagicMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    session.execute = AsyncMock(return_value=result)
    session.commit = AsyncMock()
    client = GitHubClient(
        access_token="token",
        session=session,
        user_id="user-123",
    )

    await client.user_reauth()

    session.execute.assert_awaited_once()
    session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_user_reauth_updates_connector() -> None:
    session = MagicMock()
    connector = MagicMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = connector
    session.execute = AsyncMock(return_value=result)
    session.commit = AsyncMock()

    client = GitHubClient(
        access_token="token",
        session=session,
        user_id="user-123",
    )

    await client.user_reauth()

    assert connector.status == "reauth"
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.services.agents.github.client.httpx.AsyncClient")
async def test_github_client_get_success(
    mock_async_client: MagicMock,
) -> None:
    response = MagicMock()
    response.status_code = 200
    response.is_error = False
    response.json.return_value = {"items": ["repo"]}

    http_client = MagicMock()
    http_client.get = AsyncMock(return_value=response)

    context_manager = MagicMock()
    context_manager.__aenter__ = AsyncMock(return_value=http_client)
    context_manager.__aexit__ = AsyncMock(return_value=None)

    mock_async_client.return_value = context_manager

    client = GitHubClient(
        access_token="token-123",
        session=MagicMock(),
        user_id="user-123",
    )

    result = await client.get(
        "/search/repositories",
        params={"q": "python"},
    )

    assert result == {"items": ["repo"]}

    mock_async_client.assert_called_once_with(
        base_url="https://api.github.com",
        timeout=30,
    )

    http_client.get.assert_awaited_once_with(
        "/search/repositories",
        headers=client.headers,
        params={"q": "python"},
    )


@pytest.mark.asyncio
@patch("app.services.agents.github.client.httpx.AsyncClient")
@patch.object(GitHubClient, "user_reauth", new_callable=AsyncMock)
async def test_github_client_get_unauthorized(
    mock_user_reauth: AsyncMock,
    mock_async_client: MagicMock,
) -> None:
    response = MagicMock()
    response.status_code = 401
    response.is_error = True
    response.json.return_value = {"message": "Bad credentials"}

    http_client = MagicMock()
    http_client.get = AsyncMock(return_value=response)

    context_manager = MagicMock()
    context_manager.__aenter__ = AsyncMock(return_value=http_client)
    context_manager.__aexit__ = AsyncMock(return_value=None)

    mock_async_client.return_value = context_manager

    client = GitHubClient(
        access_token="token",
        session=MagicMock(),
        user_id="user-123",
    )

    result = await client.get("/user")

    assert result == {"message": "Bad credentials"}
    mock_user_reauth.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.services.agents.github.client.httpx.AsyncClient")
async def test_github_client_get_api_error(
    mock_async_client: MagicMock,
) -> None:
    response = MagicMock()
    response.status_code = 500
    response.is_error = True
    response.text = "Internal Server Error"

    http_client = MagicMock()
    http_client.get = AsyncMock(return_value=response)

    context_manager = MagicMock()
    context_manager.__aenter__ = AsyncMock(return_value=http_client)
    context_manager.__aexit__ = AsyncMock(return_value=None)

    mock_async_client.return_value = context_manager

    client = GitHubClient(
        access_token="token",
        session=MagicMock(),
        user_id="user-123",
    )

    with pytest.raises(
        RuntimeError,
        match="GitHub API error: status=500",
    ):
        await client.get("/repositories")


@pytest.mark.asyncio
async def test_get_github_client() -> None:
    session = MagicMock()

    connector = MagicMock()
    connector.access_token = "github-token"

    result = MagicMock()
    result.scalar_one_or_none.return_value = connector
    session.execute = AsyncMock(return_value=result)

    client = await get_github_client(
        session=session,
        user_id="user-123",
    )

    assert isinstance(client, GitHubClient)
    assert client.access_token == "github-token"
    assert client.session is session
    assert client.user_id == "user-123"
