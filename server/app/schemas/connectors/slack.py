from pydantic import BaseModel


class SlackConnectorRequest(BaseModel):
    userId: str
    providerUserId: str
    providerUsername: str
    accessToken: str
