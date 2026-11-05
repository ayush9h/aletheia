from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.agents.web_search.tools.tinyfish import tinyfish_web_search
from app.utils.rate_limiters.tinyfish import TinyFishLimitExceeded


def mock_http_client(mock_client_cls: MagicMock, *, json=None, error=None):
    client = MagicMock()
    response = MagicMock()
    response.json.return_value = json
    client.get = AsyncMock(return_value=response, side_effect=error)
    mock_client_cls.return_value.__aenter__.return_value = client
    return client


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.tinyfish.httpx.AsyncClient")
@patch("app.services.agents.web_search.tools.tinyfish.get_tinyfish_guard")
async def test_tinyfish_web_search(
    mock_get_guard: MagicMock,
    mock_client_cls: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    client = mock_http_client(
        mock_client_cls,
        json={
            "results": [
                {"title": "First", "url": "https://a.com", "snippet": "First result"},
                {"title": "Second", "url": "https://b.com", "snippet": "Second result"},
            ]
        },
    )

    result = await tinyfish_web_search.ainvoke(
        {
            "domains": ["example.com", "b.com"],
            "query": "test query",
            "topic": "news",
        }
    )

    assert result == (
        "Title: First\nURL: https://a.com\nContent: First result\n\n"
        "Title: Second\nURL: https://b.com\nContent: Second result"
    )

    guard.acquire.assert_awaited_once_with(
        tinyfish_exec_type="search",
        credit_usage_by_type=1,
    )

    client.get.assert_awaited_once()
    assert client.get.call_args.kwargs["params"] == {
        "query": "test query",
        "domain_type": "news",
        "include_domains": "example.com,b.com",
    }
    assert "X-API-Key" in client.get.call_args.kwargs["headers"]


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.tinyfish.httpx.AsyncClient")
@patch("app.services.agents.web_search.tools.tinyfish.get_tinyfish_guard")
async def test_tinyfish_web_search_failure_returns_error_text(
    mock_get_guard: MagicMock,
    mock_client_cls: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock()
    mock_get_guard.return_value = guard

    mock_http_client(mock_client_cls, error=RuntimeError("boom"))

    result = await tinyfish_web_search.ainvoke(
        {"domains": None, "query": "test query", "topic": "general"}
    )

    assert result == "Error: Web search failed. Please try again."


@pytest.mark.asyncio
@patch("app.services.agents.web_search.tools.tinyfish.get_tinyfish_guard")
async def test_tinyfish_web_search_rate_limit(
    mock_get_guard: MagicMock,
) -> None:
    guard = MagicMock()
    guard.acquire = AsyncMock(side_effect=TinyFishLimitExceeded())
    mock_get_guard.return_value = guard

    result = await tinyfish_web_search.ainvoke(
        {"domains": None, "query": "test query", "topic": "general"}
    )

    assert result == (
        "Error: Web search rate limit exceeded. Please try again in a minute."
    )
