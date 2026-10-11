from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage

from app.services.workflows.orch import consolidator


@pytest.fixture
def base_state():
    return {
        "user_input": [
            HumanMessage(content="What is Python?"),
        ],
        "user_model": "qwen/qwen3.8-27b",
        "user_id": "user-123",
        "session_id": "session-123",
    }


@pytest.mark.asyncio
@patch("app.services.workflows.orch.ChatGroq")
@patch("app.services.workflows.orch.get_groq_guard")
@patch("app.services.workflows.orch.tokens_from_string")
async def test_consolidator_success(
    mock_tokens,
    mock_get_guard,
    mock_chat_groq,
    base_state,
):
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_tokens.return_value = 25

    final_message = AIMessage(
        content="Python is a programming language.",
        additional_kwargs={
            "reasoning_content": "The user asked for an explanation.",
        },
    )
    final_message.usage_metadata = {
        "total_tokens": 100,
    }
    final_message.response_metadata = {
        "token_usage": {
            "total_time": 1.5,
        }
    }

    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=final_message)
    mock_chat_groq.return_value = llm

    result = await consolidator(base_state)

    assert result["response_content"] == ("Python is a programming language.")
    assert result["reasoning_kwargs"] == ("The user asked for an explanation.")
    assert result["tokens_consumed"] == 100
    assert result["duration"] == 1.5
    assert result["user_input"] == [final_message]

    mock_tokens.assert_called_once()

    guard.acquire.assert_awaited_once_with(
        model="qwen/qwen3.8-27b",
        input_tokens=25,
        max_output_tokens=2048,
    )

    mock_chat_groq.assert_called_once_with(
        api_key=mock_chat_groq.call_args.kwargs["api_key"],
        model="qwen/qwen3.8-27b",
        reasoning_effort=None,
        streaming=True,
        max_tokens=2048,
    )

    llm.ainvoke.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.services.workflows.orch.ChatGroq")
@patch("app.services.workflows.orch.get_groq_guard")
@patch("app.services.workflows.orch.tokens_from_string")
async def test_consolidator_with_user_preferences(
    mock_tokens,
    mock_get_guard,
    mock_chat_groq,
    base_state,
):
    preference = MagicMock()
    preference.userCustomInstruction = "Be concise"
    preference.userHobbies = "AI"
    preference.nickname = "Alex"
    preference.occupation = "Developer"

    base_state["user_preference"] = preference
    base_state["tool_results"] = ["Search result"]

    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_tokens.return_value = 50

    final_message = AIMessage(
        content="Response",
    )

    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=final_message)
    mock_chat_groq.return_value = llm

    result = await consolidator(base_state)

    assert result["response_content"] == "Response"

    messages = llm.ainvoke.call_args.args[0]

    assert "Be concise" in messages[0].content
    assert "AI" in messages[0].content
    assert "Alex" in messages[0].content
    assert "Developer" in messages[0].content
    assert "Search result" in messages[1].content


@pytest.mark.asyncio
@patch("app.services.workflows.orch.ChatGroq")
@patch("app.services.workflows.orch.get_groq_guard")
@patch("app.services.workflows.orch.tokens_from_string")
async def test_consolidator_empty_preferences_and_tools(
    mock_tokens,
    mock_get_guard,
    mock_chat_groq,
    base_state,
):
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_tokens.return_value = 10

    final_message = AIMessage(
        content="Response",
    )

    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=final_message)
    mock_chat_groq.return_value = llm

    await consolidator(base_state)

    messages = llm.ainvoke.call_args.args[0]

    assert "None" in messages[0].content
    assert "No tool results." in messages[1].content


@pytest.mark.asyncio
@patch("app.services.workflows.orch.get_groq_guard")
async def test_consolidator_rate_limit(mock_get_guard, base_state):
    from app.utils.rate_limiters.llm import GroqRateLimitExceeded

    guard = MagicMock()

    error = GroqRateLimitExceeded(
        model="qwen/qwen3.8-27b",
        retry_after_seconds=30,
    )

    guard.acquire = AsyncMock(side_effect=error)
    mock_get_guard.return_value = guard

    with pytest.raises(
        RuntimeError,
        match=r"Rate limit hit for model qwen/qwen3\.8-27b\. Retry in 30s",
    ):
        await consolidator(base_state)

    guard.acquire.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.services.workflows.orch.ChatGroq")
@patch("app.services.workflows.orch.get_groq_guard")
@patch("app.services.workflows.orch.tokens_from_string")
async def test_consolidator_non_base_message(
    mock_tokens,
    mock_get_guard,
    mock_chat_groq,
    base_state,
):
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_tokens.return_value = 10

    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value="invalid response")
    mock_chat_groq.return_value = llm

    with pytest.raises(
        TypeError,
        match="Orchestrator final response is not a BaseMessage",
    ):
        await consolidator(base_state)


@pytest.mark.asyncio
@patch("app.services.workflows.orch.ChatGroq")
@patch("app.services.workflows.orch.get_groq_guard")
@patch("app.services.workflows.orch.tokens_from_string")
async def test_consolidator_non_string_content(
    mock_tokens,
    mock_get_guard,
    mock_chat_groq,
    base_state,
):
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_tokens.return_value = 10

    final_message = AIMessage(
        content=[
            {"type": "text", "text": "Generated response"},
        ],
    )

    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=final_message)
    mock_chat_groq.return_value = llm

    result = await consolidator(base_state)

    assert result["response_content"] == str(final_message.content)


@pytest.mark.asyncio
@patch("app.services.workflows.orch.ChatGroq")
@patch("app.services.workflows.orch.get_groq_guard")
@patch("app.services.workflows.orch.tokens_from_string")
async def test_consolidator_missing_usage_metadata(
    mock_tokens,
    mock_get_guard,
    mock_chat_groq,
    base_state,
):
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_tokens.return_value = 10

    final_message = AIMessage(
        content="Response",
    )

    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=final_message)
    mock_chat_groq.return_value = llm

    result = await consolidator(base_state)

    assert result["response_content"] == "Response"
    assert result["tokens_consumed"] == 0
    assert result["duration"] == 0.0
    assert result["reasoning_kwargs"] == ""
