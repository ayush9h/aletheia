from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langfuse import Langfuse, get_client

from app.api.chats import chat_router
from app.api.sessions import session_router
from app.api.user_settings import user_router
from app.db_service.db import engine
from app.utils.config import settings
from app.utils.core.redis import create_redis_client
from app.utils.logger import setup_logging, shutdown_logging
from app.utils.rate_limiters.core import RedisSlidingWindowLimiter
from app.utils.rate_limiters.llm import GroqGuard, GroqModelLimit, set_groq_guard
from app.utils.rate_limiters.tavily import TavilyGuard, TavilyLimit, set_tavily_guard

logger = structlog.get_logger(__name__)
origins = [
    "*",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("application starting and redis init", status="startup")

    redis_client = create_redis_client()
    await redis_client.ping()

    app.state.redis = redis_client
    Langfuse(
        public_key=settings.LANGFUSE_PUBLIC_KEY,
        secret_key=settings.LANGFUSE_SECRET_KEY,
        host=settings.LANGFUSE_BASE_URL,
    )
    langfuse_client = get_client()
    auth_ok = langfuse_client.auth_check()
    logger.info("langfuse auth check", status="startup", auth_ok=auth_ok)

    app.state.langfuse = langfuse_client
    rate_limiter = RedisSlidingWindowLimiter(
        redis=redis_client,  # type:ignore
        key_prefix="agent-api:rate-limit",
    )

    logger.info("groq guard init", status="startup")
    groq_guard = GroqGuard(
        limiter=rate_limiter,
        organization_id=settings.GROQ_ORG_ID,
        model_limits={
            "llama-3.1-8b-instant": GroqModelLimit(
                rpm=settings.GROQ_META_RPM, tpm=settings.GROQ_META_TPM
            ),
            "llama-3.3-70b-versatile": GroqModelLimit(
                rpm=settings.GROQ_META_RPM, tpm=settings.GROQ_META_TPM
            ),
            "openai/gpt-oss-120b": GroqModelLimit(
                rpm=settings.GROQ_OPENAI_RPM, tpm=settings.GROQ_OPENAI_TPM
            ),
            "openai/gpt-oss-20b": GroqModelLimit(
                rpm=settings.GROQ_OPENAI_RPM, tpm=settings.GROQ_OPENAI_TPM
            ),
        },
    )

    logger.info("tavily guard init", status="startup")
    tavily_guard = TavilyGuard(
        limiter=rate_limiter,
        model_limits={
            "search": TavilyLimit(rpm=settings.TAVILY_SEARCH_RPM),
        },
    )

    app.state.rate_limiter = rate_limiter
    app.state.groq_guard = groq_guard
    app.state.tavily_guard = tavily_guard

    set_groq_guard(groq_guard)
    set_tavily_guard(tavily_guard)
    try:
        yield
    finally:
        shutdown_logging()
        set_groq_guard(None)
        set_tavily_guard(None)
        await redis_client.aclose()
        await engine.dispose()


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chat_router)
app.include_router(user_router)
app.include_router(session_router)
