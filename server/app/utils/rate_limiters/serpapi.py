from __future__ import annotations

from dataclasses import dataclass

from app.utils.rate_limiters.core import (RateLimitPolicy,
                                          RedisSlidingWindowLimiter)


@dataclass(frozen=True)
class SerpApiLimit:
    rpm: int


class SerpAPILimitExceeded(Exception):
    def __init__(self, message: str = "SerpAPI Limit exceeded") -> None:
        super().__init__(message)


class SerpApiGuard:
    def __init__(
        self,
        *,
        limiter: RedisSlidingWindowLimiter,
        model_limits: dict[str, SerpApiLimit],
    ) -> None:
        self.limiter = limiter
        self.model_limits = model_limits

    async def acquire(
        self,
        *,
        serp_type: str,
        credit_usage_by_type: int = 1,
        project_id: str = "default",
    ) -> None:
        limit = self.model_limits.get(serp_type)

        if limit is None:
            raise ValueError(
                f"No rate limit configured for execution type '{serp_type}'"
            )

        if credit_usage_by_type > limit.rpm:
            raise ValueError(
                f"Request requires {credit_usage_by_type} credits, "
                f"but '{serp_type}' has an RPM limit of {limit.rpm}"
            )

        decision = await self.limiter.acquire(
            group=f"serpapi:{project_id}:{serp_type}",
            policies=[
                RateLimitPolicy(
                    name="rpm",
                    limit=limit.rpm,
                    window_seconds=60,
                    cost=credit_usage_by_type,
                ),
            ],
        )

        if not decision.allowed:
            raise SerpAPILimitExceeded(
                f"Rate limit exceeded for SerpAPI '{serp_type}' operation."
            )


_guard: SerpApiGuard | None = None


def set_serp_guard(
    guard: SerpApiGuard | None,
) -> None:
    global _guard
    _guard = guard


def get_serp_guard() -> SerpApiGuard:
    if _guard is None:
        raise RuntimeError("Tavily guard has not been initialized")

    return _guard
