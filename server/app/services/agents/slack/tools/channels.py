import json

from langchain_core.tools import tool

from app.services.agents.slack.client import get_slack_client

MAX_PURPOSE_LENGTH = 200


def create_channel_tools(
    session,
    user_id: str,
):

    @tool
    async def slack_list_channels(limit: int = 20) -> str:
        """
        List Slack channels the connected user is a member of.
        """

        client = await get_slack_client(
            session,
            user_id,
        )

        response = await client.get(
            "users.conversations",
            params={
                "types": "public_channel,private_channel",
                "exclude_archived": "true",
                "limit": min(limit, 50),
            },
        )

        channels = [
            {
                "id": channel.get("id"),
                "name": channel.get("name"),
                "is_private": channel.get("is_private", False),
                "purpose": ((channel.get("purpose") or {}).get("value") or "")[
                    :MAX_PURPOSE_LENGTH
                ],
            }
            for channel in response.get("channels", [])
        ]

        return json.dumps(
            {
                "count": len(channels),
                "channels": channels,
            },
            ensure_ascii=False,
        )

    return slack_list_channels
