from typing import List, Literal, Optional

from app.utils.config import settings
from langchain.tools import tool
from pydantic import BaseModel, Field
from tavily import TavilyClient


class WebSearchSchema(BaseModel):
    """Input for the web search"""

    domains: Optional[List[str]] = Field(
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
    domains: Optional[List[str]],
    query: str,
    topic: Literal["general", "news", "finance"],
):
    tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY)

    response = tavily_client.search(
        query,
        include_domains=domains or [],
        topic=topic,
    )

    contents = [r.get("content", "") for r in response.get("results", [])]
    return "\n\n".join(contents)
