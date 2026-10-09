from unittest.mock import MagicMock, patch

from app.services.agents.web_search.agent import create_web_search_agent
from app.services.agents.web_search.tools import (
    serpapi_web_search,
    tavily_web_search,
)


@patch("app.services.agents.web_search.agent.create_agent")
def test_create_web_search_agent(mock_create_agent: MagicMock) -> None:
    llm = MagicMock()
    expected_agent = MagicMock()
    mock_create_agent.return_value = expected_agent

    result = create_web_search_agent(llm)

    assert result is expected_agent

    mock_create_agent.assert_called_once()

    kwargs = mock_create_agent.call_args.kwargs

    assert kwargs["model"] is llm
    assert kwargs["tools"] == [
        serpapi_web_search,
        tavily_web_search,
    ]
    assert isinstance(kwargs["system_prompt"], str)
    assert "Use SerpAPI" in kwargs["system_prompt"]
    assert "Use Tavily" in kwargs["system_prompt"]
