from typing import Literal

import serpapi
import structlog
from langchain.tools import tool

from app.services.agents.web_search.schema import WebSearchSchema
from app.utils.config import settings
from app.utils.rate_limiters.serpapi import (SerpAPILimitExceeded,
                                             get_serp_guard)

logger = structlog.get_logger(__name__)

MAX_SEARCH_RESULTS = 5


@tool(
    "serpapi_web_search",
    description=(
        "Use this tool for Google Search or SerpAPI searches. "
        "MUST be used when the user's original request explicitly "
        "mentions Google Search, Google search, SerpAPI, or Serp API. "
        "Do not use this tool for ordinary web searches."
    ),
    args_schema=WebSearchSchema,
)
async def serpapi_web_search(
    domains: list[str] | None,
    query: str,
    topic: Literal["general", "news", "finance"],
) -> str:
    guard = get_serp_guard()

    try:
        await guard.acquire(
            serp_type="search",
            credit_usage_by_type=1,
        )
    except SerpAPILimitExceeded:
        return "Error: Web search rate limit exceeded. " "Please try again in a minute."

    engine_map = {
        "general": "google",
        "news": "google_news",
        "finance": "google_finance",
    }

    params = {
        "engine": engine_map[topic],
        "q": query,
        "num": MAX_SEARCH_RESULTS,
    }

    if domains:
        params["q"] = f"{query} " + " ".join(f"site:{domain}" for domain in domains)

    try:
        client = serpapi.Client(
            api_key=settings.SERPAPI_API_KEY,
            timeout=20,
        )

        response = client.search(params)

    except serpapi.HTTPError as exc:
        logger.exception(
            "SerpAPI request failed",
            query=query,
            topic=topic,
            status_code=exc.status_code,
        )

        return f"Error: SerpAPI search failed: {exc}"

    except serpapi.TimeoutError:
        logger.exception(
            "SerpAPI request timed out",
            query=query,
            topic=topic,
        )

        return "Error: SerpAPI search timed out."

    results = response.get("organic_results", [])[:MAX_SEARCH_RESULTS]

    contents = []

    for result in results:
        title = result.get("title", "")
        snippet = result.get("snippet", "")
        link = result.get("link", "")

        contents.append(f"Title: {title}\n" f"URL: {link}\n" f"Content: {snippet}")

    if not contents:
        return "No search results found."

    return "\n\n".join(contents)
