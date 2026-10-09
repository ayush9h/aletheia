from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from app.services.workflows.session_title import (
    generate_session_title,
    route_session_title,
)
from app.utils.rate_limiters.llm import GroqRateLimitExceeded


@pytest.mark.asyncio
async def test_generate_session_title_without_human_message() -> None:
    state = {"user_input": []}

    result = await generate_session_title(state)

    assert result == {"session_title": "New Chat"}


@pytest.mark.asyncio
@patch("app.services.workflows.session_title.ChatGroq")
@patch("app.services.workflows.session_title.get_groq_guard")
@patch("app.services.workflows.session_title.tokens_from_string")
async def test_generate_session_title_success(
    mock_tokens: MagicMock,
    mock_get_guard: MagicMock,
    mock_chat_groq: MagicMock,
) -> None:
    mock_tokens.return_value = 10

    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    client = MagicMock()
    client.ainvoke = AsyncMock(
        return_value=MagicMock(content="Python Project Planning")
    )
    mock_chat_groq.return_value = client

    state = {
        "user_input": [
            HumanMessage(content="Help me plan my Python project"),
        ],
        "session_id": "session-123",
    }

    result = await generate_session_title(state)

    assert result == {"session_title": "Python Project Planning"}

    guard.acquire.assert_awaited_once_with(
        model="qwen/qwen3.8-27b",
        input_tokens=10,
        max_output_tokens=50,
    )

    mock_chat_groq.assert_called_once_with(
        api_key=mock_chat_groq.call_args.kwargs["api_key"],
        model="qwen/qwen3.8-27b",
        max_tokens=50,
    )

    client.ainvoke.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.services.workflows.session_title.ChatGroq")
@patch("app.services.workflows.session_title.get_groq_guard")
@patch("app.services.workflows.session_title.tokens_from_string")
async def test_generate_session_title_rate_limited(
    mock_tokens: MagicMock,
    mock_get_guard: MagicMock,
    mock_chat_groq: MagicMock,
) -> None:
    mock_tokens.return_value = 10

    guard = MagicMock()
    guard.acquire = AsyncMock(
        side_effect=GroqRateLimitExceeded(
            model="qwen/qwen3.8-27b",
            retry_after_seconds=30,
        )
    )
    mock_get_guard.return_value = guard

    state = {
        "user_input": [
            HumanMessage(content="Plan my day"),
        ],
        "session_id": "session-123",
    }

    result = await generate_session_title(state)

    assert result == {"session_title": "New Chat"}
    mock_chat_groq.assert_not_called()


@pytest.mark.asyncio
@patch("app.services.workflows.session_title.ChatGroq")
@patch("app.services.workflows.session_title.get_groq_guard")
@patch("app.services.workflows.session_title.tokens_from_string")
async def test_generate_session_title_llm_failure(
    mock_tokens: MagicMock,
    mock_get_guard: MagicMock,
    mock_chat_groq: MagicMock,
) -> None:
    mock_tokens.return_value = 10

    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    client = MagicMock()
    client.ainvoke = AsyncMock(side_effect=RuntimeError("LLM failed"))
    mock_chat_groq.return_value = client

    state = {
        "user_input": [
            HumanMessage(content="Plan my day"),
        ],
        "session_id": "session-123",
    }

    result = await generate_session_title(state)

    assert result == {"session_title": "New Chat"}


def test_route_session_title_new_session() -> None:
    state = {"is_new_session": True}

    assert route_session_title(state) == "generate_session_title"


def test_route_session_title_existing_session_with_memory() -> None:
    state = {
        "is_new_session": False,
        "use_memory": True,
    }

    assert route_session_title(state) == "memory_store"


def test_route_session_title_existing_session_without_memory() -> None:
    state = {
        "is_new_session": False,
        "use_memory": False,
    }

    assert route_session_title(state) == "__end__"
