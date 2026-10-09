from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import serpapi

from app.services.agents.web_search.tools.serpapi import serpapi_web_search
from app.utils.rate_limiters.serpapi import SerpAPILimitExceeded


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.serpapi.serpapi.Client")
@patch("app.services.agents.web_search.tools.serpapi.get_serp_guard")
async def test_serpapi_web_search(
    mock_get_guard: MagicMock,
    mock_client: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    client = MagicMock()
    client.search.return_value = {
        "organic_results": [
            {
                "title": "First result",
                "snippet": "First snippet",
                "link": "https://example.com/1",
            },
            {
                "title": "Second result",
                "snippet": "Second snippet",
                "link": "https://example.com/2",
            },
        ]
    }
    mock_client.return_value = client

    result = await serpapi_web_search.ainvoke(
        {
            "domains": None,
            "query": "test query",
            "topic": "general",
        }
    )

    assert result == (
        "Title: First result\n"
        "URL: https://example.com/1\n"
        "Content: First snippet\n\n"
        "Title: Second result\n"
        "URL: https://example.com/2\n"
        "Content: Second snippet"
    )

    guard.acquire.assert_awaited_once_with(
        serp_type="search",
        credit_usage_by_type=1,
    )

    client.search.assert_called_once_with(
        {
            "engine": "google",
            "q": "test query",
            "num": 5,
        }
    )


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.serpapi.serpapi.Client")
@patch("app.services.agents.web_search.tools.serpapi.get_serp_guard")
async def test_serpapi_web_search_with_domains(
    mock_get_guard: MagicMock,
    mock_client: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    client = MagicMock()
    client.search.return_value = {
        "organic_results": [
            {
                "title": "Result",
                "snippet": "Snippet",
                "link": "https://example.com",
            }
        ]
    }
    mock_client.return_value = client

    result = await serpapi_web_search.ainvoke(
        {
            "domains": ["github.com", "stackoverflow.com"],
            "query": "python async",
            "topic": "general",
        }
    )

    assert "Title: Result" in result

    client.search.assert_called_once_with(
        {
            "engine": "google",
            "q": "python async site:github.com site:stackoverflow.com",
            "num": 5,
        }
    )


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.serpapi.get_serp_guard")
async def test_serpapi_web_search_rate_limit(
    mock_get_guard: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock(side_effect=SerpAPILimitExceeded())
    mock_get_guard.return_value = guard

    result = await serpapi_web_search.ainvoke(
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
        serp_type="search",
        credit_usage_by_type=1,
    )


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.serpapi.serpapi.Client")
@patch("app.services.agents.web_search.tools.serpapi.get_serp_guard")
async def test_serpapi_web_search_timeout(
    mock_get_guard: MagicMock,
    mock_client: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_client.return_value.search.side_effect = serpapi.TimeoutError()

    result = await serpapi_web_search.ainvoke(
        {
            "domains": None,
            "query": "test query",
            "topic": "general",
        }
    )

    assert result == "Error: SerpAPI search timed out."


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.serpapi.serpapi.Client")
@patch("app.services.agents.web_search.tools.serpapi.get_serp_guard")
async def test_serpapi_web_search_no_results(
    mock_get_guard: MagicMock,
    mock_client: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_client.return_value.search.return_value = {"organic_results": []}

    result = await serpapi_web_search.ainvoke(
        {
            "domains": None,
            "query": "nothing",
            "topic": "general",
        }
    )

    assert result == "No search results found."
