from typing import Literal

import structlog
from langchain.tools import tool
from tavily import AsyncTavilyClient

from app.services.agents.web_search.schema import WebSearchSchema
from app.utils.config import settings
from app.utils.rate_limiters.tavily import (TavilyLimitExceeded,
                                            get_tavily_guard)

logger = structlog.get_logger(__name__)

MAX_SEARCH_RESULTS = 5


@tool(
    "tavily_web_search",
    description=(
        "Use this tool for ordinary web searches when the user did not "
        "explicitly request Google Search or SerpAPI. "
        "Do not use this tool when Google Search or SerpAPI is explicitly requested."
    ),
    args_schema=WebSearchSchema,
)
async def tavily_web_search(
    domains: list[str] | None,
    query: str,
    topic: Literal["general", "news", "finance"],
):
    guard = get_tavily_guard()
    try:
        await guard.acquire(tavily_exec_type="search", credit_usage_by_type=1)
    except TavilyLimitExceeded:
        return "Error: Web search rate limit exceeded. Please try again in a minute."

    try:
        tavily_client = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
        response = await tavily_client.search(
            query,
            include_domains=domains or [],
            topic=topic,
            max_results=MAX_SEARCH_RESULTS,
        )
    except Exception:
        logger.exception("Tavily search failed", query=query, topic=topic)
        return "Error: Web search failed. Please try again."

    contents = [
        f"Title: {r.get('title', '')}\nURL: {r.get('url', '')}\nContent: {r.get('content', '')}"
        for r in response.get("results", [])
    ]
    if not contents:
        return "No search results found."

    return "\n\n".join(contents)
