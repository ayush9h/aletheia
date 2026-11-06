from typing import Literal

import httpx
import structlog
from langchain.tools import tool

from app.services.agents.web_search.schema import WebSearchSchema
from app.utils.config import settings
from app.utils.rate_limiters.tinyfish import (TinyFishLimitExceeded,
                                              get_tinyfish_guard)

logger = structlog.get_logger(__name__)

TINYFISH_SEARCH_URL = "https://api.search.tinyfish.ai"
MAX_SEARCH_RESULTS = 5


@tool(
    "tinyfish_web_search",
    description="Search the public web for current information.",
    args_schema=WebSearchSchema,
)
async def tinyfish_web_search(
    domains: list[str] | None,
    query: str,
    topic: Literal["general", "news", "finance"],
):
    guard = get_tinyfish_guard()
    try:
        await guard.acquire(tinyfish_exec_type="search", credit_usage_by_type=1)
    except TinyFishLimitExceeded:
        return "Error: Web search rate limit exceeded. Please try again in a minute."

    params = {
        "query": query,
        "domain_type": "news" if topic == "news" else "web",
    }
    if domains:
        params["include_domains"] = ",".join(domains)

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                TINYFISH_SEARCH_URL,
                params=params,
                headers={"X-API-Key": settings.TINYFISH_API_KEY},
            )
            response.raise_for_status()
            results = response.json().get("results", [])
    except Exception:
        logger.exception("TinyFish search failed", query=query, topic=topic)
        return "Error: Web search failed. Please try again."

    contents = [
        f"Title: {r.get('title', '')}\nURL: {r.get('url', '')}\nContent: {r.get('snippet', '')}"
        for r in results[:MAX_SEARCH_RESULTS]
    ]
    if not contents:
        return "No search results found."

    return "\n\n".join(contents)
