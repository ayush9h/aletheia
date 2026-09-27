from pydantic import BaseModel


class GitHubConnectorRequest(BaseModel):
    userId: str
    providerUserId: str
    providerUsername: str
    accessToken: str
