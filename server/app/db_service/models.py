from datetime import datetime

from sqlmodel import Field, SQLModel


# ==============User Prefs====================
class UserPrefs(SQLModel, table=True):
    __tablename__ = "user_prefs"  # type: ignore

    user_id: str | None = Field(primary_key=True, index=True)
    nickname: str
    assistant_behavior: str
    user_personal_description: str
    occupation: str
    baseTone: str



# ==================User Chats================
class UserChats(SQLModel, table=True):
    __tablename__ = "user_chats"  # type: ignore

    chat_id: int | None = Field(default=None, primary_key=True)
    session_id: int | None = Field(index=True)

    user_query: str
    assistant_response: str
    assistant_reasoning: str | None
    tokens_consumed: int
    duration: float

    created_at: datetime = Field(default_factory=datetime.utcnow)


# ================== User Sessions ==============
class UserSessions(SQLModel, table=True):
    __tablename__ = "user_sessions"  # type: ignore

    session_id: int | None = Field(default=None, primary_key=True)
    user_id: str | None
    session_title: str

    is_pinned: bool = Field(default=False, index=True)
    pinned_at: datetime | None = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
