from datetime import date, datetime

from sqlmodel import Field, SQLModel


# ============== User Token Usage ==================
class UserTokenUsage(SQLModel, table=True):
    __tablename__ = "user_token_usage"  # type: ignore

    user_id: str = Field(primary_key=True)
    # First day of the UTC month this row counts tokens for
    period: date = Field(primary_key=True)
    tokens_used: int = Field(default=0)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
