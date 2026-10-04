from __future__ import annotations

from dataclasses import dataclass

from app.utils.rate_limiters.core import (RateLimitPolicy,
                                          RedisSlidingWindowLimiter)


@dataclass(frozen=True)
class TavilyLimit:
    rpm: int


class TavilyLimitExceeded(Exception):
    def __init__(self, message: str = "Tavily Limit exceeded") -> None:
        super().__init__(message)


class TavilyGuard:
    def __init__(
        self,
        *,
        limiter: RedisSlidingWindowLimiter,
        model_limits: dict[str, TavilyLimit],
    ) -> None:
        self.limiter = limiter
        self.model_limits = model_limits

    async def acquire(
        self,
        *,
        tavily_exec_type: str,
        credit_usage_by_type: int = 1,
        project_id: str = "default",
    ) -> None:
        limit = self.model_limits.get(tavily_exec_type)

        if limit is None:
            raise ValueError(
                f"No rate limit configured for execution type '{tavily_exec_type}'"
            )

        if credit_usage_by_type > limit.rpm:
            raise ValueError(
                f"Request requires {credit_usage_by_type} credits, "
                f"but '{tavily_exec_type}' has an RPM limit of {limit.rpm}"
            )

        decision = await self.limiter.acquire(
            group=f"tavily:{project_id}:{tavily_exec_type}",
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
            raise TavilyLimitExceeded(
                f"Rate limit exceeded for Tavily '{tavily_exec_type}' operation."
            )


_guard: TavilyGuard | None = None


def set_tavily_guard(
    guard: TavilyGuard | None,
) -> None:
    global _guard
    _guard = guard


def get_tavily_guard() -> TavilyGuard:
    if _guard is None:
        raise RuntimeError("Tavily guard has not been initialized")

    return _guard
