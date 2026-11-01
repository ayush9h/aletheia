from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from app.schemas.workflows.planner_schema import Plan, Step
from app.services.workflows.planner_node import add_missing_agents, planner_node


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


@pytest.mark.asyncio
@patch("app.services.workflows.planner_node.tokens_from_string")
@patch("app.services.workflows.planner_node.get_groq_guard")
@patch("app.services.workflows.planner_node.planner_llm")
async def test_planner_node_enforces_selected_agents_and_drops_unknown(
    mock_planner_llm: MagicMock,
    mock_get_guard: MagicMock,
    mock_tokens: MagicMock,
) -> None:
    mock_tokens.return_value = 100
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    llm_response = MagicMock()
    llm_response.content = (
        '{"steps": [{"step_id": 1, "plan": "Answer directly.", "agent_name": null}]}'
    )
    mock_planner_llm.ainvoke = AsyncMock(return_value=llm_response)

    state = {
        "user_input": [HumanMessage(content="Latest Tesla news")],
        "tools": ["web_search_agent", "web_search_agent", "ignore_all_rules"],
    }

    result = await planner_node(state)

    assert [step.agent_name for step in result["plan"].steps] == ["web_search_agent"]

    prompt = mock_planner_llm.ainvoke.call_args.args[0][0].content
    assert 'Required Agents:\n["web_search_agent"]' in prompt
    assert "ignore_all_rules" not in prompt


def test_add_missing_agents_keeps_a_plan_that_uses_them() -> None:
    step = Step(step_id=1, plan="Search.", agent_name="web_search_agent")
    plan = Plan(steps=[step])

    add_missing_agents(plan, ["web_search_agent"], "query")

    assert plan.steps == [step]


def test_add_missing_agents_appends_after_existing_steps() -> None:
    plan = Plan(steps=[Step(step_id=3, plan="Search.", agent_name="web_search_agent")])

    add_missing_agents(plan, ["github_agent", "slack_agent"], "my query")

    assert [step.step_id for step in plan.steps] == [3, 4, 5]
    assert plan.steps[1].agent_name == "github_agent"
    assert plan.steps[2].agent_input == {"task": "my query"}
    assert plan.steps[2].depends_on == []
