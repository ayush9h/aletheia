import json
from datetime import timedelta

import structlog
from langchain.tools import tool
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from app.services.agents.web_search.schema import ScrapeLinksSchema
from app.utils.config import settings

logger = structlog.get_logger(__name__)

MAX_LINKS = 200
SCRAPE_TIMEOUT = timedelta(seconds=90)


async def call_scrape_tool(name: str, url: str, wait_for: str | None) -> str:
    arguments = {"url": url}
    if wait_for:
        arguments["wait_for"] = wait_for

    headers = {"Authorization": f"Bearer {settings.FINANCE_MCP_TOKEN}"}

    try:
        async with streamablehttp_client(
            settings.FINANCE_MCP_URL, headers=headers
        ) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(
                    name,
                    arguments,
                    read_timeout_seconds=SCRAPE_TIMEOUT,
                )
    except Exception:
        logger.exception("Link scrape failed", tool=name, url=url)
        return "Error: Link scrape failed. Please try again."

    if result.isError:
        error = result.content[0].text if result.content else "unknown error"
        logger.warning("Link scrape rejected", tool=name, url=url, error=error)
        return f"Error: {error}"

    links = (result.structuredContent or {}).get("links") or []
    if not links:
        return "No links found."

    return json.dumps({"total": len(links), "links": links[:MAX_LINKS]})


@tool(
    "scrape_links",
    description=(
        "Open a specific web page in a browser and list every link on it. "
        "Use this to find documents on a known page."
    ),
    args_schema=ScrapeLinksSchema,
)
async def scrape_links(url: str, wait_for: str | None = None) -> str:
    return await call_scrape_tool("scrape_links", url, wait_for)


@tool(
    "scrape_reports",
    description=(
        "Open a specific web page in a browser and list only the links whose "
        "URL or title mentions report. Use this to find annual or quarterly "
        "reports on a company's investor relations page."
    ),
    args_schema=ScrapeLinksSchema,
)
async def scrape_reports(url: str, wait_for: str | None = None) -> str:
    return await call_scrape_tool("scrape_reports", url, wait_for)
