from redis.asyncio import Redis

from app.utils.config import settings


def create_redis_client() -> Redis:
    return Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=1,
        health_check_interval=30,
        retry_on_timeout=True,
        max_connections=50,
    )
