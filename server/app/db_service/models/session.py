from datetime import datetime

from sqlmodel import Field, SQLModel


class UserSessions(SQLModel, table=True):
    __tablename__ = "user_sessions"

    session_id: int | None = Field(default=None, primary_key=True)
    user_id: str | None
    session_title: str
    is_pinned: bool = Field(default=False, index=True)
    pinned_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
