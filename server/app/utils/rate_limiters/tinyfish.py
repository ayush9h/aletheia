from __future__ import annotations

from dataclasses import dataclass

from app.utils.rate_limiters.core import (RateLimitPolicy,
                                          RedisSlidingWindowLimiter)


@dataclass(frozen=True)
class TinyFishLimit:
    rpm: int


class TinyFishLimitExceeded(Exception):
    def __init__(self, message: str = "TinyFish Limit exceeded") -> None:
        super().__init__(message)


class TinyFishGuard:
    def __init__(
        self,
        *,
        limiter: RedisSlidingWindowLimiter,
        model_limits: dict[str, TinyFishLimit],
    ) -> None:
        self.limiter = limiter
        self.model_limits = model_limits

    async def acquire(
        self,
        *,
        tinyfish_exec_type: str,
        credit_usage_by_type: int = 1,
        project_id: str = "default",
    ) -> None:
        limit = self.model_limits.get(tinyfish_exec_type)

        if limit is None:
            raise ValueError(
                f"No rate limit configured for execution type '{tinyfish_exec_type}'"
            )

        if credit_usage_by_type > limit.rpm:
            raise ValueError(
                f"Request requires {credit_usage_by_type} credits, "
                f"but '{tinyfish_exec_type}' has an RPM limit of {limit.rpm}"
            )

        decision = await self.limiter.acquire(
            group=f"tinyfish:{project_id}:{tinyfish_exec_type}",
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
            raise TinyFishLimitExceeded(
                f"Rate limit exceeded for TinyFish '{tinyfish_exec_type}' operation."
            )


_guard: TinyFishGuard | None = None


def set_tinyfish_guard(
    guard: TinyFishGuard | None,
) -> None:
    global _guard
    _guard = guard


def get_tinyfish_guard() -> TinyFishGuard:
    if _guard is None:
        raise RuntimeError("TinyFish guard has not been initialized")

    return _guard
