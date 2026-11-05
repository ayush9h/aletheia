from unittest.mock import MagicMock, patch

from app.services.agents.web_search.agent import create_web_search_agent
from app.services.agents.web_search.tools import (scrape_links, scrape_reports,
                                                  tinyfish_web_search)


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
        tinyfish_web_search,
        scrape_links,
        scrape_reports,
    ]
    assert isinstance(kwargs["system_prompt"], str)
    limit, fallback = kwargs["middleware"]
    assert limit.run_limit == 2
    assert type(fallback).__name__ == "ModelFallbackMiddleware"
