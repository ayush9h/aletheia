from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    user_id: str


class RenameSessionRequest(BaseModel):
    session_title: str = Field(min_length=1, max_length=200)
