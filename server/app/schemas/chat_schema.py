from typing import List, Literal, Optional

from app.schemas.user_pref import UserPref
from pydantic import BaseModel, Field


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
    selectedSessionId: Optional[int] = Field(
        None,
        description="Existing session ID. Null means create new session.",
    )

    userPref: Optional[UserPref] = Field(
        None,
        description="User preferences that influence assistant responses",
    )
    userId: Optional[str] = Field(
        ..., description="The id of the user asking the question"
    )
    tools: Optional[List[str]] = Field(
        ..., description="List of tools selected by the user"
    )
