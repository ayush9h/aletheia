# tests/services/agents/test_init.py

from unittest.mock import MagicMock, patch

from app.services.agents import AGENT_REGISTRY, AgentContext, build_agents


def test_agent_registry_contains_expected_agents() -> None:
    assert "github_agent" in AGENT_REGISTRY
    assert "web_search_agent" in AGENT_REGISTRY


@patch("app.services.agents.create_github_agent")
def test_build_github_agent(
    mock_create_github_agent: MagicMock,
) -> None:
    context = AgentContext(
        llm=MagicMock(),
        session=MagicMock(),
        user_id="user-123",
    )

    expected_agent = MagicMock()
    mock_create_github_agent.return_value = expected_agent

    result = build_agents({"github_agent"}, context)

    assert result == {"github_agent": expected_agent}

    mock_create_github_agent.assert_called_once_with(
        llm=context.llm,
        session=context.session,
        user_id=context.user_id,
    )


@patch("app.services.agents.create_web_search_agent")
def test_build_web_search_agent(
    mock_create_web_search_agent: MagicMock,
) -> None:
    context = AgentContext(
        llm=MagicMock(),
        session=MagicMock(),
        user_id="user-123",
    )

    expected_agent = MagicMock()
    mock_create_web_search_agent.return_value = expected_agent

    result = build_agents({"web_search_agent"}, context)

    assert result == {"web_search_agent": expected_agent}

    mock_create_web_search_agent.assert_called_once_with(
        llm=context.llm,
    )


def test_unknown_agent_is_ignored() -> None:
    context = AgentContext(
        llm=MagicMock(),
        session=MagicMock(),
        user_id="user-123",
    )

    result = build_agents({"unknown_agent"}, context)

    assert result == {}


def test_empty_agent_names_returns_empty_dict() -> None:
    context = AgentContext(
        llm=MagicMock(),
        session=MagicMock(),
        user_id="user-123",
    )

    result = build_agents(set(), context)

    assert result == {}
