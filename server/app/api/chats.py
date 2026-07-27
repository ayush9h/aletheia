import json
from collections.abc import AsyncGenerator
from sqlite3 import DatabaseError

import structlog
from fastapi import APIRouter, Depends, Request
from fastapi.exceptions import HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from langchain_core.tracers.schemas import Run
from langfuse import propagate_attributes
from langfuse.langchain import CallbackHandler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from starlette import status

from app.db_service.db import get_session
from app.db_service.models import UserChats, UserSessions
from app.schemas.chat_schema import ChatRequest
from app.services.agent import graph
from app.utils.config import settings
from app.utils.core.dependencies import get_rate_limiter
from app.utils.rate_limiters.core import RateLimitPolicy, RedisSlidingWindowLimiter

chat_router = APIRouter(prefix="/v1")
logger = structlog.get_logger(__name__)


def sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def serialize_plan(plan) -> str | None:
    """Render the Plan object as a JSON string for DB storage."""
    if plan is None:
        return None
    plan_dict = plan.model_dump() if hasattr(plan, "model_dump") else plan
    return json.dumps(plan_dict)


@chat_router.post(
    "/chat/stream",
    tags=["test the agentic flow of queries"],
    description="Streams the agent's plan and final answer via SSE",
)
async def chat_stream(
    request: Request,
    payload: ChatRequest,
    session: AsyncSession = Depends(get_session),
    rate_limiter: RedisSlidingWindowLimiter = Depends(get_rate_limiter),
):
    user_id = str(payload.userId)
    langfuse = request.app.state.langfuse

    # Check for rate limit
    try:
        rate_limit = await rate_limiter.acquire(
            group=f"user:{user_id}:chat-stream",
            policies=[
                RateLimitPolicy(
                    name="rpm",
                    limit=settings.CHAT_STREAM_REQUESTS_PER_MINUTE,
                    window_seconds=60,
                ),
                RateLimitPolicy(
                    name="rph",
                    limit=settings.CHAT_STREAM_REQUESTS_PER_HOUR,
                    window_seconds=3600,
                ),
            ],
        )
    except Exception as exc:
        logger.exception(
            "Redis rate limiter is unavailable",
            extra={
                "user_id": user_id,
                "route": "/chat/stream",
            },
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The chat service is temporarily unavailable",
            headers={
                "Retry-After": "1",
            },
        ) from exc

    if not rate_limit.allowed:
        retry_after = max(
            1,
            rate_limit.retry_after_seconds,
        )

        logger.warning(
            "Chat stream rate limit exceeded",
            extra={
                "user_id": user_id,
                "retry_after_seconds": retry_after,
                "rpm_used": rate_limit.used["rpm"],
                "rph_used": rate_limit.used["rph"],
            },
        )

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Chat rate limit exceeded",
                "retry_after_seconds": retry_after,
            },
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(rate_limit.limits["rpm"]),
                "X-RateLimit-Remaining": str(rate_limit.remaining["rpm"]),
            },
        )

    if payload.selectedSessionId:
        stmt = select(UserSessions).where(
            UserSessions.session_id == payload.selectedSessionId,
            UserSessions.user_id == payload.userId,
        )
        result = await session.execute(stmt)
        chat_session = result.scalar_one()
        is_new_session = False
    else:
        chat_session = UserSessions(
            user_id=payload.userId,
            session_title="New Chat",
        )
        session.add(chat_session)
        await session.commit()
        await session.refresh(chat_session)
        is_new_session = True

    logger.info("Verified session generation")

    input_state = {
        "user_input": [HumanMessage(content=payload.query)],
        "user_model": payload.model,
        "user_preference": payload.userPref,
        "user_id": payload.userId,
        "session_id": chat_session.session_id,
        "tools": payload.tools,
        "use_memory": payload.userPref.memoryEnabled if payload.userPref else False,
    }

    async def event_generator() -> AsyncGenerator[str, None]:
        final_state: dict = {}
        duration = 0.0

        async def capture_graph_duration(run: Run) -> None:
            nonlocal duration

            if run.end_time is not None:
                duration = (run.end_time - run.start_time).total_seconds()

        instrumented_graph = graph.with_alisteners(on_end=capture_graph_duration)
        try:
            with langfuse.start_as_current_observation(
                as_type="span",
                name="chat-flow",
                input={
                    "query": payload.query,
                    "model": str(payload.model),
                    "session_id": str(chat_session.session_id),
                },
            ) as r_span:
                with propagate_attributes(
                    trace_name="chat-flow",
                    user_id=user_id,
                    session_id=str(chat_session.session_id),
                    tags=[
                        "chat",
                        "sse",
                        "langgraph",
                    ],
                    metadata={
                        "route": "/chat/stream",
                        "model": str(payload.model),
                        "newSession": str(is_new_session),
                    },
                ):
                    langfuse_handler = CallbackHandler()

                    async for event in instrumented_graph.astream_events(
                        input_state,
                        version="v2",
                        config={
                            "callbacks": [langfuse_handler],
                            "run_name": "chat-stream-graph",
                        },
                    ):
                        kind = event["event"]
                        node_name = event.get("metadata", {}).get("langgraph_node")
                        checkpoint_ns = event.get("metadata", {}).get(
                            "langgraph_checkpoint_ns", ""
                        )
                        parent_ids = event.get("parent_ids", [])

                        if kind == "on_chain_end" and node_name == "planner_node":
                            output = event["data"].get("output", {})
                            plan = output.get("plan")
                            if plan is not None:
                                plan_payload = (
                                    plan.model_dump()
                                    if hasattr(plan, "model_dump")
                                    else plan
                                )
                                yield sse_event("plan", {"plan": plan_payload})

                        elif (
                            kind == "on_chat_model_stream"
                            and checkpoint_ns.startswith("orchestrator:")
                        ):
                            chunk = event["data"]["chunk"]  # type:ignore
                            token = getattr(chunk, "content", "")
                            if token:
                                yield sse_event("token", {"token": token})

                        elif kind == "on_chain_end":
                            output = event["data"].get("output", {})

                            if not isinstance(output, dict):
                                continue

                            if node_name in {
                                "orchestrator",
                                "generate_session_title",
                                "memory_store",
                            }:
                                final_state.update(output)

                            if not parent_ids:
                                final_state.clear()
                                final_state.update(output)

                    final_state["duration"] = duration
                    if is_new_session:
                        chat_session.session_title = final_state.get(
                            "session_title", ""
                        )
                        await session.commit()

                    chat = UserChats(
                        session_id=chat_session.session_id,
                        user_query=payload.query,
                        assistant_response=final_state.get("response_content", ""),
                        assistant_reasoning=serialize_plan(final_state.get("plan")),
                        tokens_consumed=final_state.get("tokens_consumed", 0),
                        duration=round(final_state.get("duration", 0.0), 2),
                    )
                    session.add(chat)
                    await session.commit()
                    logger.info("Stored the details in DB")

                    final_payload = {
                        "service_output": {
                            "response_content": final_state.get(
                                "response_content",
                                "",
                            ),
                            "duration": round(
                                final_state.get("duration", 0.0),
                                2,
                            ),
                            "tokens_consumed": final_state.get(
                                "tokens_consumed",
                                0,
                            ),
                        },
                        "session": {
                            "session_id": chat_session.session_id,
                            "session_title": chat_session.session_title,
                        },
                    }
                    r_span.update(output=final_payload)

                    yield sse_event("final", final_payload)

        except (DatabaseError, HTTPException) as e:
            logger.error(f"Error occurred in chat streaming due to {e}")
            yield sse_event(
                "error", {"message": "Oops something went wrong. Try Again Later."}
            )
        finally:
            langfuse.flush()
            logger.info("Langfuse flush called")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@chat_router.get(
    "/chats",
    tags=["Chats in a session"],
    description="List of chats for a given session_id",
)
async def chats(
    session_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    try:
        stmt = (
            select(UserChats)
            .where(UserChats.session_id == session_id)
            .order_by(UserChats.created_at.asc())  # type:ignore
        )

        result = await session.execute(stmt)
        chats = result.scalars().all()

        logger.info("Fetched chats for session")

        response: list[dict] = []

        for c in chats:
            response.append(
                {
                    "id": f"{c.chat_id}-user",
                    "role": "user",
                    "text": c.user_query,
                }
            )

            parsed_plan = None
            if c.assistant_reasoning:
                try:
                    parsed_plan = json.loads(c.assistant_reasoning)
                except (TypeError, ValueError):
                    parsed_plan = None

            response.append(
                {
                    "id": f"{c.chat_id}-assistant",
                    "role": "assistant",
                    "text": c.assistant_response,
                    "plan": parsed_plan,
                    "duration": c.duration,
                    "tokens_consumed": c.tokens_consumed,
                }
            )
        return response

    except (DatabaseError, HTTPException) as e:
        await session.rollback()
        logger.error(f"Error occured during fetching chats: {e}")
        return []
