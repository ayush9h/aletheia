from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.utils.core.dependencies import (
    get_rate_limiter,
    get_redis,
)


def make_request(
    *,
    redis=None,
    rate_limiter=None,
):
    return SimpleNamespace(
        app=SimpleNamespace(
            state=SimpleNamespace(
                redis=redis,
                rate_limiter=rate_limiter,
            )
        )
    )


def test_get_redis_returns_initialized_redis():
    redis = MagicMock()
    request = make_request(redis=redis)

    result = get_redis(request)

    assert result is redis


def test_get_redis_raises_when_not_initialized():
    request = make_request(redis=None)

    with pytest.raises(
        RuntimeError,
        match="^Redis client has not been initialized$",
    ):
        get_redis(request)


def test_get_rate_limiter_returns_initialized_limiter():
    rate_limiter = MagicMock()
    request = make_request(rate_limiter=rate_limiter)

    result = get_rate_limiter(request)

    assert result is rate_limiter


def test_get_rate_limiter_raises_when_not_initialized():
    request = make_request(rate_limiter=None)

    with pytest.raises(
        RuntimeError,
        match="^Rate limiter has not been initialized$",
    ):
        get_rate_limiter(request)
