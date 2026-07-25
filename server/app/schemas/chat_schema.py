from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.user_pref import UserPref


class ChatRequest(BaseModel):
    model: Literal[
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.1-8b-instant",
    ] = Field(
        ...,
        description="The user requested model",
    )
    query: str = Field(
        ...,
        description="The user's query",
    )
    selectedSessionId: int | None = Field(
        None,
        description="Existing session ID. Null means create new session.",
    )

    userPref: UserPref | None = Field(
        None,
        description="User preferences that influence assistant responses",
    )
    userId: str | None = Field(
        ..., description="The id of the user asking the question"
    )
    tools: list[str] | None = Field(
        None, description="List of tools selected by the user"
    )
