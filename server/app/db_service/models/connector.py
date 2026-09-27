from datetime import datetime

from sqlmodel import Field, SQLModel


# ================== User Connectors ==================
class UserConnectors(SQLModel, table=True):
    __tablename__ = "user_connectors" #type:ignore

    id: int | None = Field(default=None, primary_key=True)

    user_id: str = Field(index=True)

    provider: str = Field(index=True)

    provider_user_id: str | None = None
    provider_username: str | None = None

    access_token: str | None = None

    status: str = Field(default="connected")

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow
    )
