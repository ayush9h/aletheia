from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from app.services.workflows.planner_node import planner_node


@pytest.mark.asyncio
async def test_planner_node_empty_user_input() -> None:
    with pytest.raises(
        ValueError,
        match="Planner received empty user_input.",
    ):
        await planner_node({})


@pytest.mark.asyncio
@patch("app.services.workflows.planner_node.tokens_from_string")
@patch("app.services.workflows.planner_node.get_groq_guard")
@patch("app.services.workflows.planner_node.planner_prompt_parser")
@patch("app.services.workflows.planner_node.planner_llm")
async def test_planner_node(
    mock_planner_llm: MagicMock,
    mock_prompt_parser: MagicMock,
    mock_get_guard: MagicMock,
    mock_tokens: MagicMock,
) -> None:
    user_message = HumanMessage(content="Find my GitHub repositories")

    prompt = MagicMock()
    parser = MagicMock()
    generated_plan = MagicMock()

    prompt.format.return_value = "formatted planner prompt"
    parser.parse.return_value = generated_plan
    generated_plan.model_dump.return_value = {
        "steps": [],
    }

    mock_prompt_parser.return_value = (prompt, parser)

    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_tokens.return_value = 100

    llm_response = MagicMock()
    llm_response.content = '{"steps": []}'
    mock_planner_llm.ainvoke = AsyncMock(return_value=llm_response)

    state = {
        "user_input": [user_message],
        "memory_context": "Previous GitHub context",
    }

    result = await planner_node(state)

    assert result is state
    assert result["plan"] is generated_plan

    mock_prompt_parser.assert_called_once()

    prompt.format.assert_called_once()
    format_kwargs = prompt.format.call_args.kwargs

    assert format_kwargs["query"] == "Find my GitHub repositories"
    assert format_kwargs["memory_context"] == "Previous GitHub context"
    assert format_kwargs["agents"]

    mock_tokens.assert_called_once()

    guard.acquire.assert_awaited_once_with(
        model="qwen/qwen3.8-27b",
        input_tokens=100,
        max_output_tokens=512,
    )

    mock_planner_llm.ainvoke.assert_awaited_once()

    messages = mock_planner_llm.ainvoke.call_args.args[0]

    assert len(messages) == 2
    assert messages[0].content == "formatted planner prompt"
    assert messages[1] is user_message

    parser.parse.assert_called_once_with(
        '{"steps": []}',
    )
