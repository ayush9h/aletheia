from typing import Literal

from langchain.tools import tool
from pydantic import BaseModel, Field
from tavily import AsyncTavilyClient

from app.utils.config import settings
from app.utils.rate_limiters.tavily import (TavilyLimitExceeded,
                                            get_tavily_guard)


class WebSearchSchema(BaseModel):
    """Input for the web search"""

    domains: list[str] | None = Field(
        description="User's requested domains mentioned in the query to be included in the domains fetching",
    )
    query: str = Field(description="Original query of the user for the web search")
    topic: Literal["general", "news", "finance"] = Field(
        description="Analyse the query and get one topic"
    )


@tool(
    "web_search",
    description="Performs web search when tools params includes web_search and is in the input state",
    args_schema=WebSearchSchema,
)
async def web_search(
    domains: list[str] | None,
    query: str,
    topic: Literal["general", "news", "finance"],
):
    guard = get_tavily_guard()
    try:
        await guard.acquire(tavily_exec_type="search", credit_usage_by_type=1)
    except TavilyLimitExceeded:
        return "Error: Web search rate limit exceeded. Please try again in a minute."

    tavily_client = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
    response = await tavily_client.search(
        query,
        include_domains=domains or [],
        topic=topic,
    )

    contents = [r.get("content", "") for r in response.get("results", [])]
    return "\n\n".join(contents)
