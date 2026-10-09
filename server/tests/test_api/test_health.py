from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.api.health import (
    check_database_connectivity,
    check_papertrail_connectivity,
    check_redis_connectivity,
    health_check,
    perform_health_checks,
)


@pytest.mark.asyncio
@patch("app.api.health.engine")
async def test_check_database_connectivity_up(mock_engine: MagicMock) -> None:
    connection = MagicMock()
    connection.execute = AsyncMock()

    context_manager = MagicMock()
    context_manager.__aenter__ = AsyncMock(return_value=connection)
    context_manager.__aexit__ = AsyncMock(return_value=None)

    mock_engine.connect.return_value = context_manager

    result = await check_database_connectivity()

    assert result == "up"
    connection.execute.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.api.health.engine")
async def test_check_database_connectivity_down(mock_engine: MagicMock) -> None:
    mock_engine.connect.side_effect = RuntimeError("Database unavailable")

    result = await check_database_connectivity()

    assert result == "down"


@pytest.mark.asyncio
@patch("app.api.health.create_redis_client")
async def test_check_redis_connectivity_up(
    mock_create_redis_client: MagicMock,
) -> None:
    redis_client = MagicMock()
    redis_client.ping = AsyncMock()
    mock_create_redis_client.return_value = redis_client

    result = await check_redis_connectivity()

    assert result == "up"
    redis_client.ping.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.api.health.create_redis_client")
async def test_check_redis_connectivity_down(
    mock_create_redis_client: MagicMock,
) -> None:
    mock_create_redis_client.side_effect = RuntimeError("Redis unavailable")

    result = await check_redis_connectivity()

    assert result == "down"


@pytest.mark.asyncio
@patch("app.api.health.settings")
async def test_check_papertrail_connectivity_up(
    mock_settings: MagicMock,
) -> None:
    mock_settings.PAPERTRAIL_ENDPOINT = "https://papertrail.example.com"
    mock_settings.PAPERTRAIL_TOKEN = "token"

    result = await check_papertrail_connectivity()

    assert result == "up"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("endpoint", "token"),
    [
        (None, "token"),
        ("https://papertrail.example.com", None),
        ("", "token"),
        ("https://papertrail.example.com", ""),
    ],
)
@patch("app.api.health.settings")
async def test_check_papertrail_connectivity_down(
    mock_settings: MagicMock,
    endpoint: str | None,
    token: str | None,
) -> None:
    mock_settings.PAPERTRAIL_ENDPOINT = endpoint
    mock_settings.PAPERTRAIL_TOKEN = token

    result = await check_papertrail_connectivity()

    assert result == "down"


@pytest.mark.asyncio
@patch("app.api.health.check_papertrail_connectivity")
@patch("app.api.health.check_redis_connectivity")
@patch("app.api.health.check_database_connectivity")
async def test_perform_health_checks_healthy(
    mock_database: AsyncMock,
    mock_redis: AsyncMock,
    mock_papertrail: AsyncMock,
) -> None:
    mock_database.return_value = "up"
    mock_redis.return_value = "up"
    mock_papertrail.return_value = "up"

    result = await perform_health_checks()

    assert result == {
        "status": "healthy",
        "checks": {
            "app": "up",
            "database": "up",
            "redis": "up",
            "papertrail": "up",
        },
    }


@pytest.mark.asyncio
@patch("app.api.health.check_papertrail_connectivity")
@patch("app.api.health.check_redis_connectivity")
@patch("app.api.health.check_database_connectivity")
async def test_perform_health_checks_unhealthy(
    mock_database: AsyncMock,
    mock_redis: AsyncMock,
    mock_papertrail: AsyncMock,
) -> None:
    mock_database.return_value = "down"
    mock_redis.return_value = "up"
    mock_papertrail.return_value = "up"

    result = await perform_health_checks()

    assert result["status"] == "unhealthy"
    assert result["checks"]["database"] == "down"


@pytest.mark.asyncio
@patch("app.api.health.perform_health_checks")
async def test_health_check_healthy(mock_perform: AsyncMock) -> None:
    mock_perform.return_value = {
        "status": "healthy",
        "checks": {
            "app": "up",
            "database": "up",
            "redis": "up",
            "papertrail": "up",
        },
    }

    response = await health_check()

    assert response.status_code == 200


@pytest.mark.asyncio
@patch("app.api.health.perform_health_checks")
async def test_health_check_unhealthy(mock_perform: AsyncMock) -> None:
    mock_perform.return_value = {
        "status": "unhealthy",
        "checks": {
            "app": "up",
            "database": "down",
            "redis": "up",
            "papertrail": "up",
        },
    }

    response = await health_check()

    assert response.status_code == 503
