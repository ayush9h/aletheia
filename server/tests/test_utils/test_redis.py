from unittest.mock import MagicMock, patch

from app.utils.core.redis import create_redis_client, settings


def test_create_redis_client():
    mock_redis = MagicMock()

    with patch(
        "app.utils.core.redis.Redis.from_url",
        return_value=mock_redis,
    ) as mock_from_url:
        result = create_redis_client()

    assert result is mock_redis

    mock_from_url.assert_called_once_with(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=1,
        health_check_interval=30,
        retry_on_timeout=True,
        max_connections=50,
    )
