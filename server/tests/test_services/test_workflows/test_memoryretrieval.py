from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from app.services.workflows.memory_retrieval import (
    memory_retrieve,
    memory_store,
    route_memory_retrieve,
    route_memory_store,
)


@pytest.mark.asyncio
async def test_memory_retrieve_no_input():
    state = {}

    result = await memory_retrieve(state)

    assert result["memory_context"] == ""


@pytest.mark.asyncio
@patch("app.services.workflows.memory_retrieval.memory_manager")
async def test_memory_retrieve(mock_memory_manager):
    mock_memory_manager.search.return_value = [
        {"content": "User likes Python", "context": "programming"},
        {"content": "User is building Aletheia", "context": "project"},
    ]

    state = {
        "user_input": [HumanMessage(content="What do I like?")],
        "user_id": "user-123",
        "session_id": "session-123",
    }

    result = await memory_retrieve(state)

    assert result["memory_context"] == (
        "User likes Python (context:programming)\n"
        "User is building Aletheia (context:project)"
    )

    mock_memory_manager.search.assert_called_once_with(
        query="What do I like?",
        user_id="user-123",
        session_id="session-123",
        k=5,
    )


@pytest.mark.parametrize(
    ("use_memory", "expected"),
    [
        (True, "memory_retriever"),
        (False, "planner_node"),
    ],
)
def test_route_memory_retrieve(use_memory, expected):
    assert route_memory_retrieve({"use_memory": use_memory}) == expected


@pytest.mark.parametrize(
    ("use_memory", "expected"),
    [
        (True, "memory_store"),
        (False, "__end__"),
    ],
)
def test_route_memory_store(use_memory, expected):
    assert route_memory_store({"use_memory": use_memory}) == expected


@pytest.mark.asyncio
@patch("app.services.workflows.memory_retrieval.memory_manager")
async def test_memory_store_insufficient_messages(mock_memory_manager):
    state = {
        "user_input": [HumanMessage(content="Hello")],
        "user_id": "user-123",
        "session_id": "session-123",
    }

    result = await memory_store(state)

    assert result is state
    mock_memory_manager.add_note.assert_not_called()


@pytest.mark.asyncio
@patch("app.services.workflows.memory_retrieval.memory_manager")
async def test_memory_store(mock_memory_manager):
    mock_memory_manager.add_note = AsyncMock()

    state = {
        "user_input": [
            HumanMessage(content="What is Python?"),
            HumanMessage(content="Python is a programming language."),
        ],
        "user_id": "user-123",
        "session_id": "session-123",
    }

    result = await memory_store(state)

    assert result is state

    mock_memory_manager.add_note.assert_awaited_once()
    kwargs = mock_memory_manager.add_note.call_args.kwargs

    assert kwargs["content"] == (
        "User: What is Python?\n\nAssistant: Python is a programming language."
    )
    assert kwargs["user_id"] == "user-123"
    assert kwargs["session_id"] == "session-123"
