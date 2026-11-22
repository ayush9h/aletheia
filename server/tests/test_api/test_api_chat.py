import json
from contextlib import ExitStack
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.api.chats import chat_stream
from app.utils.rate_limiters.core import RateLimitDecision


CONSOLIDATOR_EVENTS = [
    {
        "event": "on_chat_model_stream",
        "name": "consolidator",
        "metadata": {"langgraph_checkpoint_ns": "consolidator:1"},
        "data": {"chunk": SimpleNamespace(text="hi")},
    },
    {
        "event": "on_chain_end",
        "name": "consolidator",
        "metadata": {"langgraph_node": "consolidator"},
        "data": {"output": {"response_content": "hi there", "tokens_consumed": 42}},
    },
]


def allowed_limiter():
    rate_limiter = MagicMock()
    rate_limiter.acquire = AsyncMock(
        return_value=RateLimitDecision(
            allowed=True, retry_after_seconds=0, limits={}, used={}, remaining={}
        )
    )
    return rate_limiter


def fake_graph(events, captured=None):
    async def astream_events(state, *args, **kwargs):
        if captured is not None:
            captured.update(state)
        for event in events:
            yield event

    graph = MagicMock()
    graph.with_alisteners.return_value.astream_events = astream_events
    return graph


def make_payload(**overrides):
    fields = {
        "ghost": True,
        "query": "secret question",
        "model": "llama-3.1-8b-instant",
        "selectedSessionId": None,
        "tools": None,
        "userPref": None,
        "userId": "user-1",
    }
    fields.update(overrides)
    return MagicMock(**fields)


def make_db_session():
    return MagicMock(
        add=MagicMock(),
        commit=AsyncMock(),
        execute=AsyncMock(),
        refresh=AsyncMock(),
    )


def read_final(chunks):
    for chunk in chunks:
        if chunk.startswith("event: final"):
            return json.loads(chunk.split("data: ", 1)[1].strip())

    raise AssertionError("no final event was streamed")


async def run_stream(payload, session, graph, patch_sessions=True):
    request = MagicMock()
    add_tokens = AsyncMock(return_value=42)

    with ExitStack() as stack:
        enter = stack.enter_context
        enter(patch("app.api.chats.get_tokens_used", AsyncMock(return_value=0)))
        enter(patch("app.api.chats.settings.MONTHLY_TOKEN_CAP", 20_000))
        enter(patch("app.api.chats.graph", graph))
        enter(patch("app.api.chats.add_tokens_used", add_tokens))
        enter(patch("app.api.chats.propagate_attributes", MagicMock()))
        callback_handler = enter(patch("app.api.chats.CallbackHandler"))
        user_chats = enter(patch("app.api.chats.UserChats"))
        # select(UserSessions) needs the real model, so only patch it when asserted
        user_sessions = (
            enter(patch("app.api.chats.UserSessions")) if patch_sessions else None
        )

        response = await chat_stream(
            request, payload, session, allowed_limiter(), user_id="user-1"
        )
        chunks = [chunk async for chunk in response.body_iterator]

    return SimpleNamespace(
        chunks=chunks,
        final=read_final(chunks),
        add_tokens=add_tokens,
        callback_handler=callback_handler,
        user_chats=user_chats,
        user_sessions=user_sessions,
        span=request.app.state.langfuse,
    )


@pytest.mark.asyncio
async def test_chat_stream_rejects_when_monthly_cap_reached():
    rate_limiter = MagicMock()
    rate_limiter.acquire = AsyncMock(
        return_value=RateLimitDecision(
            allowed=True, retry_after_seconds=0, limits={}, used={}, remaining={}
        )
    )
    payload = MagicMock(userId="user-1")
    session = MagicMock()
    session.add = MagicMock()

    with (
        patch("app.api.chats.get_tokens_used", AsyncMock(return_value=20_000)),
        patch("app.api.chats.settings.MONTHLY_TOKEN_CAP", 20_000),
    ):
        with pytest.raises(HTTPException) as exc:
            await chat_stream(MagicMock(), payload, session, rate_limiter, user_id="user-1")

    assert exc.value.status_code == 429
    assert exc.value.detail["token_limit"] == 20_000
    session.add.assert_not_called()


@pytest.mark.asyncio
async def test_ghost_chat_writes_nothing_to_postgres_but_meters_tokens():
    session = make_db_session()

    result = await run_stream(make_payload(), session, fake_graph(CONSOLIDATOR_EVENTS))

    session.add.assert_not_called()
    result.user_chats.assert_not_called()
    result.user_sessions.assert_not_called()
    result.add_tokens.assert_awaited_once_with(session, "user-1", 42)
    assert "session" not in result.final
    assert result.final["service_output"]["response_content"] == "hi there"


@pytest.mark.asyncio
async def test_ghost_chat_forces_memory_and_tools_off():
    captured: dict = {}
    payload = make_payload(
        selectedSessionId=99,
        tools=["gmail_agent"],
        userPref=MagicMock(memoryEnabled=True),
    )

    await run_stream(
        payload, make_db_session(), fake_graph(CONSOLIDATOR_EVENTS, captured)
    )

    assert captured["ghost"] is True
    assert captured["use_memory"] is False
    assert not captured["tools"]
    assert captured["session_id"] is None
    assert captured["is_new_session"] is False


@pytest.mark.asyncio
async def test_ghost_chat_sends_no_content_to_langfuse():
    result = await run_stream(
        make_payload(), make_db_session(), fake_graph(CONSOLIDATOR_EVENTS)
    )

    observation = result.span.start_as_current_observation
    span_input = observation.call_args.kwargs["input"]
    r_span = observation.return_value.__enter__.return_value

    result.callback_handler.assert_not_called()
    r_span.update.assert_not_called()
    assert "secret question" not in json.dumps(span_input)
    assert span_input["ghost"] is True


@pytest.mark.asyncio
async def test_normal_chat_persists_chat_row():
    session = make_db_session()
    session.execute = AsyncMock(
        return_value=MagicMock(
            scalar_one=MagicMock(
                return_value=MagicMock(session_id=5, session_title="Existing")
            )
        )
    )

    result = await run_stream(
        make_payload(ghost=False, selectedSessionId=5),
        session,
        fake_graph(CONSOLIDATOR_EVENTS),
        patch_sessions=False,
    )

    session.add.assert_called_once()
    assert result.user_chats.call_args.kwargs["user_query"] == "secret question"
    assert result.final["session"]["session_id"] == 5
    result.add_tokens.assert_awaited_once_with(session, "user-1", 42)
    observation = result.span.start_as_current_observation
    observation.return_value.__enter__.return_value.update.assert_called_once()
