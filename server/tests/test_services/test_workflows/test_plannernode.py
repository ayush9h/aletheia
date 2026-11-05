from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from app.schemas.workflows.planner_schema import Plan, Step
from app.services.workflows.planner_node import (PLANNER_SYSTEM_PROMPT,
                                                 add_missing_agents,
                                                 planner_node)


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
@patch("app.services.workflows.planner_node.planner_llm")
async def test_planner_node(
    mock_planner_llm: MagicMock,
    mock_get_guard: MagicMock,
    mock_tokens: MagicMock,
) -> None:
    user_message = HumanMessage(content="Find my GitHub repositories")

    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_tokens.return_value = 100

    llm_response = MagicMock()
    llm_response.text = (
        '{"steps": [{"step_id": 1, "plan": "Search repos.", '
        '"agent_name": "github_agent", "task": "List my repos.", "depends_on": []}]}'
    )
    mock_planner_llm.ainvoke = AsyncMock(return_value=llm_response)

    state = {
        "user_input": [user_message],
        "memory_context": "Previous GitHub context",
    }

    result = await planner_node(state)

    assert result is state
    step = result["plan"].steps[0]
    assert step.agent_name == "github_agent"
    assert step.agent_input == {"task": "List my repos."}
    assert step.status == "pending"
    assert step.evidence.id is None

    guard.acquire.assert_awaited_once_with(
        model="qwen/qwen3.8-27b",
        input_tokens=100,
        max_output_tokens=512,
    )

    messages = mock_planner_llm.ainvoke.call_args.args[0]

    assert len(messages) == 3
    assert messages[0].content == PLANNER_SYSTEM_PROMPT
    assert "Find my GitHub repositories" not in messages[0].content
    assert "Previous GitHub context" in messages[1].content
    assert messages[2] is user_message


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
    llm_response.text = (
        '{"steps": [{"step_id": 1, "plan": "Answer directly.", "agent_name": null}]}'
    )
    mock_planner_llm.ainvoke = AsyncMock(return_value=llm_response)

    state = {
        "user_input": [HumanMessage(content="Latest Tesla news")],
        "tools": ["web_search_agent", "web_search_agent", "ignore_all_rules"],
    }

    result = await planner_node(state)

    assert [step.agent_name for step in result["plan"].steps] == ["web_search_agent"]

    prompt = mock_planner_llm.ainvoke.call_args.args[0][1].content
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
