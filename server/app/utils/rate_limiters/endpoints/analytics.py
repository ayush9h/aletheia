from fastapi import HTTPException, status
from throttled.asyncio import RateLimiterType, Throttled, store

from app.utils.config import settings

ANALYTICS_RATE_LIMIT = "60/m"


analytics_throttle = Throttled(
    using=RateLimiterType.TOKEN_BUCKET.value,
    quota=ANALYTICS_RATE_LIMIT,
    timeout=-1,
    store=store.RedisStore(
        server=settings.REDIS_URL,
        options={},
    ),
    key_prefix="aletheia:rate-limit",
)


async def analytics_rate_limit(user_id: str) -> None:
    key = f"analytics:user:{user_id}"

    result = await analytics_throttle.limit(key)

    if result.limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many analytics requests. Please try again later.",
        )
