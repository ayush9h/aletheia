from typing import List

from app.db_service.db import get_session
from app.db_service.models import UserChats, UserSessions
from app.schemas.chat_schema import ChatRequest
from app.services.agent import graph
from fastapi import APIRouter, Depends
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

chat_router = APIRouter(prefix="/v1")


@chat_router.post(
    "/chat",
    tags=["test the agentic flow of queries"],
    description="Answers the question related to the query",
)
async def chat(payload: ChatRequest, session: AsyncSession = Depends(get_session)):


    # Check if it is a new session or a pre-existing session
    if payload.selectedSessionId:
        stmt = select(UserSessions).where(
            UserSessions.session_id == payload.selectedSessionId,
            UserSessions.user_id == payload.userId,
        )
        result = await session.execute(stmt)
        chat_session = result.scalar_one()
    else:
        chat_session = UserSessions(
            user_id=payload.userId,
            session_title="New Chat",
        )
        session.add(chat_session)
        await session.commit()
        await session.refresh(chat_session)

    input_state = {
        "user_input": [HumanMessage(content=payload.query)],
        "user_model": payload.model,
        "user_preference": payload.userPref,
        "user_id": payload.userId,
        "session_id": chat_session.session_id,
    }

    response = await graph.ainvoke(input=input_state)  # type: ignore

    # Update the session title
    if not payload.selectedSessionId:
        chat_session.session_title = response.get("session_title", "")
        await session.commit()

    chat = UserChats(
        session_id=chat_session.session_id,
        user_query=payload.query,
        assistant_response=response.get("response_content", ""),
        assistant_reasoning=response.get("reasoning_kwargs"),
        tokens_consumed=response.get("tokens_consumed", 0),
        duration=round(response.get("duration", 0.0), 2),
    )

    session.add(chat)
    await session.commit()

    return {
        "service_output": {
            "reasoning_content": response.get("reasoning_kwargs", ""),
            "response_content": response.get("response_content", ""),
            "duration": round(response.get("duration", 0.0), 2),
            "tokens_consumed": response.get("tokens_consumed", ""),
        },
        "session": {
            "session_id": chat_session.session_id,
            "session_title": chat_session.session_title,
        },
    }


@chat_router.get(
    "/chats",
    tags=["Chats in a session"],
    description="List of chats for a given session_id",
)
async def chats(
    session_id: int,
    session: AsyncSession = Depends(get_session),
) -> List[dict]:
    
    stmt = (
        select(UserChats)
        .where(UserChats.session_id == session_id)
        .order_by(UserChats.created_at.asc())  # type:ignore
    )

    result = await session.execute(stmt)
    chats = result.scalars().all()

    response: List[dict] = []

    for c in chats:
        response.append(
            {
                "role": "user",
                "text": c.user_query,
            }
        )

        response.append(
            {
                "role": "assistant",
                "text": c.assistant_response,
                "reasoning": c.assistant_reasoning,
                "duration": c.duration,
                "tokens_consumed": c.tokens_consumed,
            }
        )
    return response
