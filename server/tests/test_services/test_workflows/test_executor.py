import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.workflows.executor_node import emit, executor_node, layers, run_step


@pytest.mark.asyncio
@patch(
    "app.services.workflows.executor_node.adispatch_custom_event",
    new_callable=AsyncMock,
)
async def test_emit(mock_dispatch: AsyncMock) -> None:
    config = MagicMock()
    payload = {"step_id": 1}

    await emit(config, "agent_start", payload)

    mock_dispatch.assert_awaited_once_with(
        "agent_start",
        payload,
        config=config,
    )


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.build_agents")
@patch("app.services.workflows.executor_node.get_session")
@patch("app.services.workflows.executor_node.emit", new_callable=AsyncMock)
async def test_run_step_no_messages(
    mock_emit: AsyncMock,
    mock_get_session: MagicMock,
    mock_build_agents: MagicMock,
) -> None:
    session = MagicMock()

    async def sessions():
        yield session

    mock_get_session.return_value = sessions()

    agent = MagicMock()
    agent.ainvoke = AsyncMock(return_value={"messages": []})
    mock_build_agents.return_value = {"test_agent": agent}

    step = make_step()
    result = await run_step(
        step=step,
        outputs={},
        failed=set(),
        llm=MagicMock(),
        user_id="user-123",
        sem=asyncio.Semaphore(1),
        config=MagicMock(),
    )

    assert result["status"] == "failed"
    assert result["error"] == "Agent returned no messages"
    assert step.status == "failed"


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.get_session")
@patch("app.services.workflows.executor_node.emit", new_callable=AsyncMock)
async def test_run_step_no_db_session(
    mock_emit: AsyncMock,
    mock_get_session: MagicMock,
) -> None:
    async def sessions():
        return
        yield  # make this an async generator

    mock_get_session.return_value = sessions()

    step = make_step()

    result = await run_step(
        step=step,
        outputs={},
        failed=set(),
        llm=MagicMock(),
        user_id="user-123",
        sem=asyncio.Semaphore(1),
        config=MagicMock(),
    )

    assert result["status"] == "failed"
    assert result["error"] == "No DB session available"
    assert step.status == "failed"


def make_step(
    step_id: int = 1,
    agent_name: str | None = "test_agent",
    depends_on: list[int] | None = None,
    task: str | None = "do something",
) -> SimpleNamespace:
    return SimpleNamespace(
        step_id=step_id,
        agent_name=agent_name,
        depends_on=depends_on or [],
        agent_input={"task": task} if task is not None else {},
        status="pending",
        evidence=SimpleNamespace(
            id=None,
            content=None,
        ),
    )


def test_layers_groups_independent_steps() -> None:
    steps = [
        make_step(1),
        make_step(2),
        make_step(3, depends_on=[1]),
    ]

    result = list(layers(steps))

    assert [[step.step_id for step in layer] for layer in result] == [
        [1, 2],
        [3],
    ]


def test_layers_rejects_unknown_dependency() -> None:
    steps = [make_step(1, depends_on=[99])]

    with pytest.raises(ValueError, match="depends on unknown steps"):
        list(layers(steps))


def test_layers_rejects_cycle() -> None:
    steps = [
        make_step(1, depends_on=[2]),
        make_step(2, depends_on=[1]),
    ]

    with pytest.raises(ValueError, match="Cycle detected"):
        list(layers(steps))


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.run_step", new_callable=AsyncMock)
@patch("app.services.workflows.executor_node.ChatGroq")
async def test_executor_node_tracks_failed_steps(
    mock_chatgroq: MagicMock,
    mock_run_step: AsyncMock,
) -> None:
    step = make_step()

    plan = SimpleNamespace(steps=[step])

    state = {
        "plan": plan,
        "user_id": "user-123",
    }

    mock_run_step.return_value = {
        "step_id": 1,
        "agent_name": "test_agent",
        "status": "failed",
        "result": None,
        "error": "agent failed",
    }

    result = await executor_node(
        state,
        MagicMock(),
    )

    assert result["tool_results"] == [
        {
            "step_id": 1,
            "agent_name": "test_agent",
            "status": "failed",
            "result": None,
            "error": "agent failed",
        }
    ]

    mock_run_step.assert_awaited_once()


@pytest.mark.asyncio
async def test_run_step_skips_step_without_agent() -> None:
    step = make_step(agent_name=None)

    result = await run_step(
        step,
        {},
        set(),
        MagicMock(),
        "user-123",
        MagicMock(),
        MagicMock(),
    )

    assert result == {
        "step_id": 1,
        "agent_name": None,
        "status": "skipped",
        "result": None,
    }


@pytest.mark.asyncio
async def test_run_step_fails_when_dependency_failed() -> None:
    step = make_step(depends_on=[2])

    result = await run_step(
        step,
        {},
        {2},
        MagicMock(),
        "user-123",
        MagicMock(),
        MagicMock(),
    )

    assert result["status"] == "dependency_failed"
    assert result["error"] == "Dependencies failed: [2]"
    assert step.status == "failed"


@pytest.mark.asyncio
async def test_run_step_fails_when_task_missing() -> None:
    step = make_step(task=None)

    result = await run_step(
        step,
        {},
        set(),
        MagicMock(),
        "user-123",
        MagicMock(),
        MagicMock(),
    )

    assert result["status"] == "failed"
    assert result["error"] == "Missing task in agent_input"
    assert step.status == "failed"


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.emit", new_callable=AsyncMock)
@patch("app.services.workflows.executor_node.build_agents")
@patch("app.services.workflows.executor_node.get_session")
async def test_run_step_success(
    mock_get_session: MagicMock,
    mock_build_agents: MagicMock,
    mock_emit: AsyncMock,
) -> None:
    session = MagicMock()

    async def sessions():
        yield session

    mock_get_session.return_value = sessions()

    agent = MagicMock()
    agent.ainvoke = AsyncMock(
        return_value={
            "messages": ["agent result"],
        }
    )
    mock_build_agents.return_value = {"test_agent": agent}

    semaphore = MagicMock()
    semaphore.__aenter__ = AsyncMock()
    semaphore.__aexit__ = AsyncMock(return_value=None)

    step = make_step(task="Use #E2 to continue")

    result = await run_step(
        step,
        {2: "previous output"},
        set(),
        MagicMock(),
        "user-123",
        semaphore,
        MagicMock(),
    )

    assert result == {
        "step_id": 1,
        "agent_name": "test_agent",
        "status": "success",
        "result": "agent result",
    }

    assert step.status == "success"
    assert step.evidence.id == "#E1"
    assert step.evidence.content == "agent result"

    agent.ainvoke.assert_awaited_once_with(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "Use previous output to continue",
                }
            ]
        }
    )

    assert mock_emit.await_count == 2


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.emit", new_callable=AsyncMock)
@patch("app.services.workflows.executor_node.build_agents")
@patch("app.services.workflows.executor_node.get_session")
async def test_run_step_unsupported_agent(
    mock_get_session: MagicMock,
    mock_build_agents: MagicMock,
    mock_emit: AsyncMock,
) -> None:
    session = MagicMock()

    async def sessions():
        yield session

    mock_get_session.return_value = sessions()
    mock_build_agents.return_value = {}

    semaphore = MagicMock()
    semaphore.__aenter__ = AsyncMock()
    semaphore.__aexit__ = AsyncMock(return_value=None)

    step = make_step()

    result = await run_step(
        step,
        {},
        set(),
        MagicMock(),
        "user-123",
        semaphore,
        MagicMock(),
    )

    assert result["status"] == "unsupported"
    assert result["error"] == "Unsupported agent: test_agent"
    assert step.status == "failed"


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.emit", new_callable=AsyncMock)
@patch("app.services.workflows.executor_node.build_agents")
@patch("app.services.workflows.executor_node.get_session")
async def test_run_step_handles_agent_error(
    mock_get_session: MagicMock,
    mock_build_agents: MagicMock,
    mock_emit: AsyncMock,
) -> None:
    session = MagicMock()

    async def sessions():
        yield session

    mock_get_session.return_value = sessions()

    agent = MagicMock()
    agent.ainvoke = AsyncMock(side_effect=RuntimeError("agent failed"))
    mock_build_agents.return_value = {"test_agent": agent}

    semaphore = MagicMock()
    semaphore.__aenter__ = AsyncMock()
    semaphore.__aexit__ = AsyncMock(return_value=None)

    step = make_step()

    result = await run_step(
        step,
        {},
        set(),
        MagicMock(),
        "user-123",
        semaphore,
        MagicMock(),
    )

    assert result["status"] == "failed"
    assert result["error"] == "agent failed"
    assert step.status == "failed"


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.ChatGroq")
async def test_executor_node_without_plan(
    mock_chat_groq: MagicMock,
) -> None:
    state = {
        "plan": None,
        "tool_results": ["old"],
    }

    result = await executor_node(state, MagicMock())

    assert result["tool_results"] == []
    mock_chat_groq.assert_not_called()


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.ChatGroq")
async def test_executor_node_with_empty_plan(
    mock_chat_groq: MagicMock,
) -> None:
    state = {
        "plan": SimpleNamespace(steps=[]),
        "tool_results": ["old"],
    }

    result = await executor_node(state, MagicMock())

    assert result["tool_results"] == []
    mock_chat_groq.assert_not_called()


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.run_step")
@patch("app.services.workflows.executor_node.ChatGroq")
async def test_executor_node_executes_plan(
    mock_chat_groq: MagicMock,
    mock_run_step: AsyncMock,
) -> None:
    step1 = make_step(1)
    step2 = make_step(2, depends_on=[1])

    mock_run_step.side_effect = [
        {
            "step_id": 1,
            "agent_name": "test_agent",
            "status": "success",
            "result": "first result",
        },
        {
            "step_id": 2,
            "agent_name": "test_agent",
            "status": "success",
            "result": "second result",
        },
    ]

    state = {
        "plan": SimpleNamespace(
            steps=[step1, step2],
        ),
        "user_id": "user-123",
    }

    result = await executor_node(state, MagicMock())

    assert result["tool_results"] == [
        {
            "step_id": 1,
            "agent_name": "test_agent",
            "status": "success",
            "result": "first result",
        },
        {
            "step_id": 2,
            "agent_name": "test_agent",
            "status": "success",
            "result": "second result",
        },
    ]

    assert mock_run_step.await_count == 2


@pytest.mark.asyncio
@patch("app.services.workflows.executor_node.run_step")
@patch("app.services.workflows.executor_node.ChatGroq")
async def test_executor_node_handles_invalid_plan(
    mock_chat_groq: MagicMock,
    mock_run_step: AsyncMock,
) -> None:
    step = make_step(
        1,
        depends_on=[99],
    )

    state = {
        "plan": SimpleNamespace(
            steps=[step],
        ),
        "user_id": "user-123",
    }

    result = await executor_node(state, MagicMock())

    assert len(result["tool_results"]) == 1
    assert result["tool_results"][0]["status"] == "failed"
    assert result["tool_results"][0]["step_id"] is None
    assert "Invalid plan" in result["tool_results"][0]["error"]

    mock_run_step.assert_not_awaited()
