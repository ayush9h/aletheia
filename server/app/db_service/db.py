from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker,
                                    create_async_engine)

from app.utils.config import settings

engine = create_async_engine(
    settings.DB_POSTGRES_URL,
    pool_size=20,
    max_overflow=30,
    pool_timeout=60,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
)


# ============== Dependency ===================
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
