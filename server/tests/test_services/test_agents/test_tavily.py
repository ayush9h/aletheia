from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.agents.web_search.tools.tavily import tavily_web_search
from app.utils.rate_limiters.tavily import TavilyLimitExceeded


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.tavily.AsyncTavilyClient")
@patch("app.services.agents.web_search.tools.tavily.get_tavily_guard")
async def test_tavily_web_search(
    mock_get_guard: MagicMock,
    mock_client: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    client = MagicMock()
    client.search = AsyncMock(
        return_value={
            "results": [
                {"content": "First result"},
                {"content": "Second result"},
            ]
        }
    )
    mock_client.return_value = client

    result = await tavily_web_search.ainvoke(
        {
            "domains": ["example.com"],
            "query": "test query",
            "topic": "general",
        }
    )

    assert result == "First result\n\nSecond result"

    guard.acquire.assert_awaited_once_with(
        tavily_exec_type="search",
        credit_usage_by_type=1,
    )

    client.search.assert_awaited_once_with(
        "test query",
        include_domains=["example.com"],
        topic="general",
    )


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.tavily.get_tavily_guard")
async def test_tavily_web_search_rate_limit(
    mock_get_guard: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock(side_effect=TavilyLimitExceeded())
    mock_get_guard.return_value = guard

    result = await tavily_web_search.ainvoke(
        {
            "domains": None,
            "query": "test query",
            "topic": "general",
        }
    )

    assert result == (
        "Error: Web search rate limit exceeded. Please try again in a minute."
    )

    guard.acquire.assert_awaited_once_with(
        tavily_exec_type="search",
        credit_usage_by_type=1,
    )
