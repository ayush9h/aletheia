from datetime import timedelta

import httpx
import structlog
from langchain.tools import tool
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from app.services.agents.web_search.schema import ScrapeLinksSchema
from app.utils.config import settings

logger = structlog.get_logger(__name__)


async def call_scrape_tool(name: str, url: str, wait_for: str | None) -> str:
    arguments = {"url": url}
    if wait_for:
        arguments["wait_for"] = wait_for

    headers = {"Authorization": f"Bearer {settings.FINANCE_MCP_TOKEN}"}
    timeout = httpx.Timeout(30, read=90)

    try:
        async with httpx.AsyncClient(headers=headers, timeout=timeout) as http_client:
            async with streamable_http_client(
                settings.FINANCE_MCP_URL, http_client=http_client
            ) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(
                        name,
                        arguments,
                        read_timeout_seconds=timedelta(seconds=90),
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

    markdown = "\n".join(f"- {link}" for link in links[:200])

    return f"Total links on the page: {len(links)}\n\n{markdown}"


@tool(
    "scrape_links",
    description=(
        "List every link on a specific web page. Returns links only, never "
        "the page text, so it cannot read articles. Use only when the user "
        "asks for the links or documents on a given page."
    ),
    args_schema=ScrapeLinksSchema,
)
async def scrape_links(url: str, wait_for: str | None = None) -> str:
    return await call_scrape_tool("scrape_links", url, wait_for)


@tool(
    "scrape_reports",
    description=(
        "List only the report links on a company's investor relations page. "
        "Returns links only, never the page text. Use only when the user "
        "asks for report files or documents, not for questions about "
        "financial results."
    ),
    args_schema=ScrapeLinksSchema,
)
async def scrape_reports(url: str, wait_for: str | None = None) -> str:
    return await call_scrape_tool("scrape_reports", url, wait_for)
