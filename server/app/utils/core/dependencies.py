from __future__ import annotations

from typing import cast

from fastapi import Request
from redis.asyncio import Redis

from app.utils.rate_limiters.core import RedisSlidingWindowLimiter


def get_redis(request: Request) -> Redis:
    redis_client = getattr(
        request.app.state,
        "redis",
        None,
    )

    if redis_client is None:
        raise RuntimeError("Redis client has not been initialized")

    return cast(Redis, redis_client)


def get_rate_limiter(
    request: Request,
) -> RedisSlidingWindowLimiter:
    rate_limiter = getattr(
        request.app.state,
        "rate_limiter",
        None,
    )

    if rate_limiter is None:
        raise RuntimeError("Rate limiter has not been initialized")

    return cast(
        RedisSlidingWindowLimiter,
        rate_limiter,
    )
