from typing import Optional

from pydantic import BaseModel, Field


class UserPref(BaseModel):
    userId: Optional[str] = Field("", description="Unique ID of user")
    userCustomInstruction: str = Field(
        "",
        description="Custom system instructions provided by the user",
    )
    nickname: str = Field(
        "",
        description="User nickname or pronouns",
    )
    occupation: str = Field(
        "",
        description="User's occupation",
    )
    baseTone: str = Field(
        "",
        description="Assistant tone to be responded back",
    )
    userHobbies: str = Field(
        "",
        description="Additional personal context about the user",
    )
