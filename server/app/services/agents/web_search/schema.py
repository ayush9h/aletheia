from typing import Literal

from pydantic import BaseModel, Field


class WebSearchSchema(BaseModel):
    """Input for the web search."""

    domains: list[str] | None = Field(
        default=None,
        description=(
            "User's requested domains mentioned in the query. "
            "Only include domains explicitly requested by the user."
        ),
    )
    query: str = Field(description="Original query of the user for the web search")
    topic: Literal["general", "news", "finance"] = Field(
        description="Analyze the query and select one search topic"
    )
