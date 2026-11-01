import pytest

from app.api.agents import list_agents
from app.services.agents import AGENT_REGISTRY


@pytest.mark.asyncio
async def test_list_agents_returns_only_selectable_agents() -> None:
    result = await list_agents()

    assert result["agents"] == [
        {"name": "web_search_agent", "label": "Web search"},
        {"name": "visualize_agent", "label": "Visualize data"},
    ]


def test_hidden_agents_stay_available_to_the_planner() -> None:
    assert "github_agent" in AGENT_REGISTRY
    assert "slack_agent" in AGENT_REGISTRY
