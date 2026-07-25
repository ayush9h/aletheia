from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chats import chat_router
from app.api.sessions import session_router
from app.api.user_settings import user_router
from app.db_service.db import engine

origins = [
    "*",
]


@asynccontextmanager
async def lifespan(app: FastAPI):

    try:
        yield
    finally:
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
