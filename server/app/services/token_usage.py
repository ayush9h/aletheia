from datetime import date, datetime

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db_service.models import UserTokenUsage


def current_period() -> date:
    return datetime.utcnow().date().replace(day=1)


async def get_tokens_used(session: AsyncSession, user_id: str) -> int:
    result = await session.execute(
        select(UserTokenUsage.tokens_used).where(
            UserTokenUsage.user_id == user_id,
            UserTokenUsage.period == current_period(),
        )
    )
    return result.scalar_one_or_none() or 0


async def add_tokens_used(session: AsyncSession, user_id: str, tokens: int) -> int:
    # Atomic upsert
    stmt = (
        insert(UserTokenUsage)
        .values(
            user_id=user_id,
            period=current_period(),
            tokens_used=tokens,
            updated_at=datetime.utcnow(),
        )
        .on_conflict_do_update(
            index_elements=["user_id", "period"],
            set_={
                "tokens_used": UserTokenUsage.tokens_used + tokens,
                "updated_at": func.now(),
            },
        )
        .returning(UserTokenUsage.tokens_used)
    )
    result = await session.execute(stmt)
    return result.scalar_one()
