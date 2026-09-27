from datetime import datetime

from sqlmodel import Field, SQLModel


class UserChats(SQLModel, table=True):
    __tablename__ = "user_chats"

    chat_id: int | None = Field(default=None, primary_key=True)
    session_id: int | None = Field(index=True)
    user_query: str
    assistant_response: str
    assistant_reasoning: str | None
    tokens_consumed: int
    duration: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
