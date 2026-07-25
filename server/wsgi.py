from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chats import chat_router
from app.api.sessions import session_router
from app.api.user_settings import user_router
from app.db_service.db import engine
from app.utils.config import settings
from app.utils.core.redis import create_redis_client
from app.utils.rate_limiters.core import RedisSlidingWindowLimiter
from app.utils.rate_limiters.llm import (GroqGuard, GroqModelLimit,
                                         set_groq_guard)
from app.utils.rate_limiters.tavily import (TavilyGuard, TavilyLimit,
                                            set_tavily_guard)

origins = [
    "*",
]


@asynccontextmanager
async def lifespan(app: FastAPI):

    redis_client = create_redis_client()
    await redis_client.ping()

    app.state.redis = redis_client
    rate_limiter = RedisSlidingWindowLimiter(
        redis=redis_client,  # type:ignore
        key_prefix="agent-api:rate-limit",
    )
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
