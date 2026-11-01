from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.agents.web_search.tools.scrape_links import (scrape_links,
                                                               scrape_reports)
from app.utils.config import settings

MODULE = "app.services.agents.web_search.tools.scrape_links"


def mock_session(
    mock_client: MagicMock, mock_session_cls: MagicMock, result
) -> MagicMock:
    mock_client.return_value.__aenter__ = AsyncMock(
        return_value=(MagicMock(), MagicMock(), MagicMock())
    )
    mock_client.return_value.__aexit__ = AsyncMock(return_value=False)

    session = MagicMock()
    session.initialize = AsyncMock()
    session.call_tool = AsyncMock(return_value=result)
    mock_session_cls.return_value.__aenter__ = AsyncMock(return_value=session)
    mock_session_cls.return_value.__aexit__ = AsyncMock(return_value=False)
    return session


def tool_result(links=None, error: str | None = None) -> SimpleNamespace:
    return SimpleNamespace(
        isError=error is not None,
        content=[SimpleNamespace(text=error)] if error else [],
        structuredContent=None if links is None else {"links": links},
    )


@pytest.mark.asyncio
@patch(f"{MODULE}.ClientSession")
@patch(f"{MODULE}.streamable_http_client")
async def test_scrape_links_returns_links(
    mock_client: MagicMock,
    mock_session_cls: MagicMock,
) -> None:
    session = mock_session(
        mock_client, mock_session_cls, tool_result(["https://a.com/report.pdf"])
    )

    result = await scrape_links.ainvoke(
        {"url": "https://a.com/investors", "wait_for": ".reports a"}
    )

    assert result == "Total links on the page: 1\n\n- https://a.com/report.pdf"
    assert session.call_tool.await_args.args == (
        "scrape_links",
        {"url": "https://a.com/investors", "wait_for": ".reports a"},
    )


@pytest.mark.asyncio
@patch(f"{MODULE}.ClientSession")
@patch(f"{MODULE}.streamable_http_client")
async def test_scrape_links_client_sends_token_and_outlasts_scrape(
    mock_client: MagicMock,
    mock_session_cls: MagicMock,
) -> None:
    mock_session(mock_client, mock_session_cls, tool_result(["https://a.com"]))

    await scrape_links.ainvoke({"url": "https://a.com"})

    http_client = mock_client.call_args.kwargs["http_client"]
    assert http_client.headers["Authorization"] == (
        f"Bearer {settings.FINANCE_MCP_TOKEN}"
    )
    assert http_client.timeout.read == 90


@pytest.mark.asyncio
@patch(f"{MODULE}.ClientSession")
@patch(f"{MODULE}.streamable_http_client")
async def test_scrape_reports_calls_reports_tool(
    mock_client: MagicMock,
    mock_session_cls: MagicMock,
) -> None:
    session = mock_session(
        mock_client, mock_session_cls, tool_result(["https://a.com/annual-report.pdf"])
    )

    result = await scrape_reports.ainvoke({"url": "https://a.com/investors"})

    assert result == "Total links on the page: 1\n\n- https://a.com/annual-report.pdf"
    assert session.call_tool.await_args.args == (
        "scrape_reports",
        {"url": "https://a.com/investors"},
    )


@pytest.mark.asyncio
@patch(f"{MODULE}.ClientSession")
@patch(f"{MODULE}.streamable_http_client")
async def test_scrape_links_caps_links_and_keeps_total(
    mock_client: MagicMock,
    mock_session_cls: MagicMock,
) -> None:
    links = [f"https://a.com/{i}" for i in range(205)]
    mock_session(mock_client, mock_session_cls, tool_result(links))

    result = await scrape_links.ainvoke({"url": "https://a.com"})

    assert result.startswith("Total links on the page: 205\n\n")
    assert len([line for line in result.splitlines() if line.startswith("- ")]) == 200


@pytest.mark.asyncio
@patch(f"{MODULE}.ClientSession")
@patch(f"{MODULE}.streamable_http_client")
async def test_scrape_links_returns_server_error_text(
    mock_client: MagicMock,
    mock_session_cls: MagicMock,
) -> None:
    mock_session(
        mock_client,
        mock_session_cls,
        tool_result(error="url must be http or https: file:///etc/passwd"),
    )

    result = await scrape_links.ainvoke({"url": "file:///etc/passwd"})

    assert result == "Error: url must be http or https: file:///etc/passwd"


@pytest.mark.asyncio
@patch(f"{MODULE}.streamable_http_client")
async def test_scrape_links_connection_failure_returns_error_text(
    mock_client: MagicMock,
) -> None:
    mock_client.return_value.__aenter__ = AsyncMock(side_effect=OSError("refused"))
    mock_client.return_value.__aexit__ = AsyncMock(return_value=False)

    result = await scrape_links.ainvoke({"url": "https://a.com"})

    assert result == "Error: Link scrape failed. Please try again."
