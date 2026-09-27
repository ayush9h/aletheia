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
    memory_enabled: bool = Field(default=True)
