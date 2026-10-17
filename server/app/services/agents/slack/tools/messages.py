import json

from langchain_core.tools import tool

from app.services.agents.slack.client import get_slack_client

MAX_TEXT_LENGTH = 500


def create_message_tools(
    session,
    user_id: str,
):

    @tool
    async def slack_search_messages(query: str) -> str:
        """
        Search messages across the connected user's Slack workspace.
        Supports Slack search modifiers such as in:#channel and from:@user.
        """

        client = await get_slack_client(
            session,
            user_id,
        )

        response = await client.get(
            "search.messages",
            params={
                "query": query,
                "count": 10,
            },
        )

        matches = (response.get("messages") or {}).get("matches", [])

        messages = [
            {
                "channel": (match.get("channel") or {}).get("name"),
                "user": match.get("username"),
                "text": (match.get("text") or "")[:MAX_TEXT_LENGTH],
                "ts": match.get("ts"),
                "url": match.get("permalink"),
            }
            for match in matches
        ]

        return json.dumps(
            {
                "query": query,
                "count": len(messages),
                "messages": messages,
            },
            ensure_ascii=False,
        )

    @tool
    async def slack_get_channel_history(
        channel_id: str,
        limit: int = 20,
    ) -> str:
        """
        Get recent messages from a Slack channel by its channel ID.
        """

        client = await get_slack_client(
            session,
            user_id,
        )

        response = await client.get(
            "conversations.history",
            params={
                "channel": channel_id,
                "limit": min(limit, 50),
            },
        )

        messages = [
            {
                "user": message.get("user"),
                "text": (message.get("text") or "")[:MAX_TEXT_LENGTH],
                "ts": message.get("ts"),
                "reply_count": message.get("reply_count", 0),
            }
            for message in response.get("messages", [])
        ]

        return json.dumps(
            {
                "channel_id": channel_id,
                "count": len(messages),
                "messages": messages,
            },
            ensure_ascii=False,
        )

    return [slack_search_messages, slack_get_channel_history]
