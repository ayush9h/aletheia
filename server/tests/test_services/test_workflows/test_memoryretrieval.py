from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from app.services.workflows.memory_retrieval import (
    memory_retrieve,
    memory_store,
    route_memory_retrieve,
    route_memory_store,
)


@patch("app.services.workflows.memory_retrieval.MemoryManager")
@patch("app.services.workflows.memory_retrieval.ChatGroq")
def test_get_memory_manager_initializes(mock_chat_groq, mock_memory_manager):
    import app.services.workflows.memory_retrieval as memory_module

    memory_module.memory_manager = None

    llm = MagicMock()
    manager = MagicMock()

    mock_chat_groq.return_value = llm
    mock_memory_manager.return_value = manager

    result = memory_module.get_memory_manager()

    assert result is manager

    mock_chat_groq.assert_called_once_with(
        api_key=memory_module.settings.GROQ_API_KEY,
        model="qwen/qwen3.8-27b",
    )

    mock_memory_manager.assert_called_once_with(
        llm_client=llm,
    )

    assert memory_module.memory_manager is manager

@pytest.mark.asyncio
async def test_memory_retrieve_no_input():
    state = {}

    result = await memory_retrieve(state)

    assert result["memory_context"] == ""


@pytest.mark.asyncio
@patch("app.services.workflows.memory_retrieval.get_memory_manager")
async def test_memory_retrieve(mock_get_memory_manager):
    memory_manager = MagicMock()
    memory_manager.search.return_value = [
        {"content": "User likes Python", "context": "programming"},
    ]
    mock_get_memory_manager.return_value = memory_manager

    state = {
        "user_input": [HumanMessage(content="What do I like?")],
        "user_id": "user-123",
        "session_id": "session-123",
    }

    result = await memory_retrieve(state)

    assert result["memory_context"] == ("User likes Python (context:programming)")

    memory_manager.search.assert_called_once_with(
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
@patch("app.services.workflows.memory_retrieval.get_memory_manager")
async def test_memory_store(mock_get_memory_manager):
    memory_manager = MagicMock()
    memory_manager.add_note = AsyncMock()
    mock_get_memory_manager.return_value = memory_manager

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

    memory_manager.add_note.assert_awaited_once()
