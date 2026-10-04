# app/utils/rate_limiters/sessions.py

from fastapi import HTTPException, status

from throttled.asyncio import RateLimiterType, Throttled, store

from app.utils.config import settings


SESSION_RATE_LIMIT = "60/m"


session_throttle = Throttled(
    using=RateLimiterType.TOKEN_BUCKET.value,
    quota=SESSION_RATE_LIMIT,
    timeout=-1,
    store=store.RedisStore(
        server=settings.REDIS_URL,
        options={},
    ),
    key_prefix="aletheia:rate-limit",
)


async def session_rate_limit(user_id: str) -> None:
    result = await session_throttle.limit(
        f"sessions:user:{user_id}"
    )

    if result.limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many session requests. Please try again later.",
        )
