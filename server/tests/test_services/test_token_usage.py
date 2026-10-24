from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.dialects import postgresql

from app.services.token_usage import add_tokens_used, current_period, get_tokens_used


def test_current_period_is_first_of_month():
    assert current_period().day == 1


@pytest.mark.asyncio
async def test_get_tokens_used_defaults_to_zero():
    session = MagicMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    session.execute = AsyncMock(return_value=result)

    assert await get_tokens_used(session, "user-1") == 0


@pytest.mark.asyncio
async def test_add_tokens_used_is_single_atomic_upsert():
    session = MagicMock()
    result = MagicMock()
    result.scalar_one.return_value = 1500
    session.execute = AsyncMock(return_value=result)

    with patch(
        "app.services.token_usage.current_period", return_value=date(2026, 10, 1)
    ):
        total = await add_tokens_used(session, "user-1", 500)

    assert total == 1500
    session.execute.assert_awaited_once()
    sql = str(session.execute.call_args.args[0].compile(dialect=postgresql.dialect()))
    assert "ON CONFLICT (user_id, period) DO UPDATE" in sql
    assert "tokens_used = (user_token_usage.tokens_used +" in sql
    assert "RETURNING user_token_usage.tokens_used" in sql
