import asyncio

from langchain_core.rate_limiters import BaseRateLimiter
from langchain_google_genai import ChatGoogleGenerativeAI

from app.utils.config import settings
from app.utils.rate_limiters.core import RateLimitPolicy, RedisSlidingWindowLimiter

MAX_WAIT_SECONDS = 15


class GeminiRateLimitExceeded(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        self.retry_after_seconds = retry_after_seconds
        super().__init__(
            f"Gemini free-tier limit reached. Retry in {retry_after_seconds}s"
        )


class GeminiFreeTierLimiter(BaseRateLimiter):
    """Enforces the Gemini free-tier RPM and RPD caps across workers via Redis."""

    limiter: RedisSlidingWindowLimiter | None = None

    def acquire(self, *, blocking: bool = True) -> bool:
        raise NotImplementedError("Gemini is only called asynchronously")

    async def aacquire(self, *, blocking: bool = True) -> bool:
        if self.limiter is None:
            raise RuntimeError("Gemini rate limiter has not been initialized")

        while True:
            decision = await self.limiter.acquire(
                group=f"gemini:{settings.GEMINI_MODEL}",
                policies=[
                    RateLimitPolicy(
                        name="rpm", limit=settings.GEMINI_RPM, window_seconds=60
                    ),
                    RateLimitPolicy(
                        name="rpd", limit=settings.GEMINI_RPD, window_seconds=86_400
                    ),
                ],
            )
            if decision.allowed:
                return True

            wait = max(1, decision.retry_after_seconds)
            if not blocking or wait > MAX_WAIT_SECONDS:
                raise GeminiRateLimitExceeded(wait)
            await asyncio.sleep(wait)


gemini_rate_limiter = GeminiFreeTierLimiter()


def set_gemini_limiter(limiter: RedisSlidingWindowLimiter | None) -> None:
    gemini_rate_limiter.limiter = limiter


def gemini_llm(*, max_tokens: int | None = None, streaming: bool = False):
    """Gemini fallback model, used when Groq rate-limits or fails."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        api_key=settings.GEMINI_API_KEY,
        max_output_tokens=max_tokens,
        streaming=streaming,
        max_retries=1,
        rate_limiter=gemini_rate_limiter,
    )
