from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import DatabaseError

from app.api.connectors import (
    get_user_connectors,
    store_github_connector,
)
from app.schemas.connectors.github import GitHubConnectorRequest


@pytest.fixture
def github_payload():
    return GitHubConnectorRequest(
        userId="user-123",
        providerUserId="github-456",
        providerUsername="test-user",
        accessToken="github-token",
    )


@pytest.fixture
def connector_secret():
    return "test-connector-secret"


@pytest.mark.asyncio
async def test_store_github_connector_unauthorized_when_secret_missing(
    github_payload,
):
    session = AsyncMock()

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        with pytest.raises(HTTPException) as exc_info:
            await store_github_connector(
                payload=github_payload,
                x_connector_secret=None,
                session=session,
            )

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Unauthorized"
    session.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_store_github_connector_unauthorized_when_secret_invalid(
    github_payload,
):
    session = AsyncMock()

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        with pytest.raises(HTTPException) as exc_info:
            await store_github_connector(
                payload=github_payload,
                x_connector_secret="wrong-secret",
                session=session,
            )

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Unauthorized"
    session.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_store_github_connector_creates_new_connector(
    github_payload,
):
    session = AsyncMock()

    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    session.execute.return_value = result

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        response = await store_github_connector(
            payload=github_payload,
            x_connector_secret="test-connector-secret",
            session=session,
        )

    assert response == {
        "status": "success",
        "message": "GitHub connector stored successfully",
        "code": 200,
    }

    session.add.assert_called_once()
    connector = session.add.call_args.args[0]

    assert connector.user_id == "user-123"
    assert connector.provider == "github"
    assert connector.provider_user_id == "github-456"
    assert connector.provider_username == "test-user"
    assert connector.access_token == "github-token"
    assert connector.status == "connected"

    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_store_github_connector_updates_existing_connector(
    github_payload,
):
    connector = MagicMock()
    connector.provider_user_id = "old-id"
    connector.provider_username = "old-user"
    connector.access_token = "old-token"
    connector.status = "disconnected"

    session = AsyncMock()

    result = MagicMock()
    result.scalar_one_or_none.return_value = connector
    session.execute.return_value = result

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        response = await store_github_connector(
            payload=github_payload,
            x_connector_secret="test-connector-secret",
            session=session,
        )

    assert response == {
        "status": "success",
        "message": "GitHub connector stored successfully",
        "code": 200,
    }

    assert connector.provider_user_id == "github-456"
    assert connector.provider_username == "test-user"
    assert connector.access_token == "github-token"
    assert connector.status == "connected"

    session.add.assert_not_called()
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_store_github_connector_handles_database_error(
    github_payload,
):
    session = AsyncMock()
    session.execute.side_effect = DatabaseError(
        "database error",
        None,
        None,
    )

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        with pytest.raises(HTTPException) as exc_info:
            await store_github_connector(
                payload=github_payload,
                x_connector_secret="test-connector-secret",
                session=session,
            )

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Failed to store GitHub connector"
    session.rollback.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_user_connectors_unauthorized_when_secret_missing():
    session = AsyncMock()

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        with pytest.raises(HTTPException) as exc_info:
            await get_user_connectors(
                user_id="user-123",
                x_connector_secret=None,
                session=session,
            )

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Unauthorized"
    session.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_user_connectors_unauthorized_when_secret_invalid():
    session = AsyncMock()

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        with pytest.raises(HTTPException) as exc_info:
            await get_user_connectors(
                user_id="user-123",
                x_connector_secret="wrong-secret",
                session=session,
            )

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Unauthorized"
    session.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_user_connectors_returns_connectors():
    connector_1 = MagicMock()
    connector_1.provider = "github"
    connector_1.provider_user_id = "github-123"
    connector_1.provider_username = "test-user"
    connector_1.status = "connected"

    connector_2 = MagicMock()
    connector_2.provider = "slack"
    connector_2.provider_user_id = "slack-456"
    connector_2.provider_username = "slack-user"
    connector_2.status = "connected"

    session = AsyncMock()

    result = MagicMock()
    result.scalars.return_value.all.return_value = [
        connector_1,
        connector_2,
    ]
    session.execute.return_value = result

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        response = await get_user_connectors(
            user_id="user-123",
            x_connector_secret="test-connector-secret",
            session=session,
        )

    assert response == {
        "status": "success",
        "connectors": [
            {
                "provider": "github",
                "providerUserId": "github-123",
                "providerUsername": "test-user",
                "status": "connected",
            },
            {
                "provider": "slack",
                "providerUserId": "slack-456",
                "providerUsername": "slack-user",
                "status": "connected",
            },
        ],
    }

    session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_user_connectors_returns_empty_list():
    session = AsyncMock()

    result = MagicMock()
    result.scalars.return_value.all.return_value = []
    session.execute.return_value = result

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        response = await get_user_connectors(
            user_id="user-123",
            x_connector_secret="test-connector-secret",
            session=session,
        )

    assert response == {
        "status": "success",
        "connectors": [],
    }


@pytest.mark.asyncio
async def test_get_user_connectors_handles_database_error():
    session = AsyncMock()
    session.execute.side_effect = DatabaseError(
        "database error",
        None,
        None,
    )

    with patch(
        "app.api.connectors.settings.CONNECTOR_SECRET",
        "test-connector-secret",
    ):
        with pytest.raises(HTTPException) as exc_info:
            await get_user_connectors(
                user_id="user-123",
                x_connector_secret="test-connector-secret",
                session=session,
            )

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Failed to fetch connectors"
    session.rollback.assert_awaited_once()
