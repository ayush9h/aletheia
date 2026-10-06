from fastapi import HTTPException, status
from throttled.asyncio import RateLimiterType, Throttled, store

from app.schemas.user_pref import UserPref
from app.utils.config import settings

USER_PREFS_READ_RATE_LIMIT = "60/m"
USER_PREFS_WRITE_RATE_LIMIT = "30/m"


user_prefs_read_throttle = Throttled(
    using=RateLimiterType.TOKEN_BUCKET.value,
    quota=USER_PREFS_READ_RATE_LIMIT,
    timeout=-1,
    store=store.RedisStore(
        server=settings.REDIS_URL,
        options={},
    ),
    key_prefix="aletheia:rate-limit",
)


user_prefs_write_throttle = Throttled(
    using=RateLimiterType.TOKEN_BUCKET.value,
    quota=USER_PREFS_WRITE_RATE_LIMIT,
    timeout=-1,
    store=store.RedisStore(
        server=settings.REDIS_URL,
        options={},
    ),
    key_prefix="aletheia:rate-limit",
)


async def user_preferences_read_rate_limit(
    user_id: str,
) -> None:
    result = await user_prefs_read_throttle.limit(f"user-preferences:read:{user_id}")

    if result.limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many user preference requests. Please try again later.",
        )

async def user_preferences_write_rate_limit(
    payload: UserPref,
) -> None:
    result = await user_prefs_write_throttle.limit(
        f"user-preferences:write:{payload.userId}"
    )

    if result.limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many user preference updates. Please try again later.",
        )
