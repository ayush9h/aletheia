from __future__ import annotations

from dataclasses import dataclass

from app.utils.rate_limiters.core import (RateLimitPolicy,
                                          RedisSlidingWindowLimiter)


@dataclass(frozen=True)
class GroqModelLimit:
    rpm: int
    tpm: int


class GroqRateLimitExceeded(Exception):
    def __init__(
        self,
        *,
        model: str,
        retry_after_seconds: int,
    ) -> None:
        self.model = model
        self.retry_after_seconds = retry_after_seconds

        super().__init__(f"Groq rate limit exceeded for model {model}")


class GroqGuard:
    def __init__(
        self,
        *,
        limiter: RedisSlidingWindowLimiter,
        organization_id: str,
        model_limits: dict[str, GroqModelLimit],
    ) -> None:
        self.limiter = limiter
        self.organization_id = organization_id
        self.model_limits = model_limits

    async def acquire(self, *, model: str, input_tokens: int, max_output_tokens: int):
        model_limit = self.model_limits.get(model)
        if model_limit is None:
            raise ValueError(f"No groq limit mentioned for the model:{model}")

        res_tokens = input_tokens + max_output_tokens
        if res_tokens > model_limit.tpm:
            raise ValueError(
                f"Request reserves {res_tokens} tokens, "
                f"but {model} has a TPM limit of "
                f"{model_limit.tpm}"
            )

        decision = await self.limiter.acquire(
            group=(f"groq:" f"{self.organization_id}:" f"{model}"),
            policies=[
                RateLimitPolicy(
                    name="rpm",
                    limit=model_limit.rpm,
                    window_seconds=60,
                    cost=1,
                ),
                RateLimitPolicy(
                    name="tpm",
                    limit=model_limit.tpm,
                    window_seconds=60,
                    cost=res_tokens,
                ),
            ],
        )

        if not decision.allowed:
            raise GroqRateLimitExceeded(
                model=model, retry_after_seconds=max(1, decision.retry_after_seconds)
            )


_guard: GroqGuard | None = None


def set_groq_guard(
    guard: GroqGuard | None,
) -> None:
    global _guard
    _guard = guard


def get_groq_guard() -> GroqGuard:
    if _guard is None:
        raise RuntimeError("Groq rate guard has not been initialized")

    return _guard
