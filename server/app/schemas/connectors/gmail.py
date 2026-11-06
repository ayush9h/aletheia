from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$"


class GmailConnectorRequest(BaseModel):
    userId: str
    providerUserId: str
    providerUsername: str
    accessToken: str
    refreshToken: str | None = None
    expiresIn: int


class GmailSendRequest(BaseModel):
    userId: str
    to: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    subject: str = Field(max_length=500, pattern=r"^[^\r\n]*$")
    body: str = Field(min_length=1, max_length=50_000)
