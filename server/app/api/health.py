import asyncio
import logging

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.db_service.db import engine
from app.utils.config import settings
from app.utils.core.redis import create_redis_client

logger = logging.getLogger(__name__)

health_router = APIRouter(prefix="/v1")


async def check_database_connectivity() -> str:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))

        return "up"

    except Exception:
        logger.exception("Database health check failed")
        return "down"


async def check_redis_connectivity() -> str:
    try:
        redis_client = create_redis_client()
        await redis_client.ping()
        return "up"

    except Exception:
        logger.exception("Redis health check failed")
        return "down"


async def check_papertrail_connectivity() -> str:
    try:
        if not settings.PAPERTRAIL_ENDPOINT:
            return "down"

        if not settings.PAPERTRAIL_TOKEN:
            return "down"

        return "up"

    except Exception:
        logger.exception("PaperTrail health check failed")
        return "down"


async def perform_health_checks() -> dict:
    database, redis, papertrail = await asyncio.gather(
        check_database_connectivity(),
        check_redis_connectivity(),
        check_papertrail_connectivity(),
    )

    checks = {
        "app": "up",
        "database": database,
        "redis": redis,
        "papertrail": papertrail,
    }

    healthy = all(value == "up" for value in checks.values())

    return {
        "status": "healthy" if healthy else "unhealthy",
        "checks": checks,
    }


@health_router.head(
    "/health",
    tags=["backend_health_check"],
    summary="Backend health check",
)
async def health_check():

    result = await perform_health_checks()

    status_code = (
        status.HTTP_200_OK
        if result["status"] == "healthy"
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    return Response(status_code=status_code)
