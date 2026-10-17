import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.agents import AGENT_REGISTRY
from app.services.agents.slack.client import SlackClient
from app.services.agents.slack.tools import (create_channel_tools,
                                             create_message_tools)


def mock_http(payload: dict) -> MagicMock:
    response = MagicMock()
    response.json.return_value = payload
    http = MagicMock()
    http.get = AsyncMock(return_value=response)
    http.__aenter__ = AsyncMock(return_value=http)
    http.__aexit__ = AsyncMock(return_value=None)
    return http


def test_slack_agent_registered() -> None:
    assert "slack_agent" in AGENT_REGISTRY


@pytest.mark.asyncio
async def test_slack_client_returns_data_when_ok() -> None:
    client = SlackClient("token", MagicMock(), "user-123")

    with patch(
        "app.services.agents.slack.client.httpx.AsyncClient",
        return_value=mock_http({"ok": True, "channels": []}),
    ):
        assert await client.get("users.conversations") == {
            "ok": True,
            "channels": [],
        }


@pytest.mark.asyncio
async def test_slack_client_marks_reauth_on_invalid_auth() -> None:
    client = SlackClient("token", MagicMock(), "user-123")
    client.user_reauth = AsyncMock()

    with patch(
        "app.services.agents.slack.client.httpx.AsyncClient",
        return_value=mock_http({"ok": False, "error": "invalid_auth"}),
    ):
        with pytest.raises(RuntimeError):
            await client.get("auth.test")

    client.user_reauth.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.services.agents.slack.tools.channels.get_slack_client")
async def test_slack_list_channels(mock_get_client: MagicMock) -> None:
    client = MagicMock()
    client.get = AsyncMock(
        return_value={
            "channels": [
                {"id": "C1", "name": "general", "purpose": {"value": "Team"}}
            ]
        }
    )
    mock_get_client.return_value = client

    tool = create_channel_tools(MagicMock(), "user-123")
    data = json.loads(await tool.ainvoke({}))

    assert data["count"] == 1
    assert data["channels"][0] == {
        "id": "C1",
        "name": "general",
        "is_private": False,
        "purpose": "Team",
    }


@pytest.mark.asyncio
@patch("app.services.agents.slack.tools.messages.get_slack_client")
async def test_slack_search_and_history(mock_get_client: MagicMock) -> None:
    client = MagicMock()
    client.get = AsyncMock(
        side_effect=[
            {
                "messages": {
                    "matches": [
                        {
                            "channel": {"name": "general"},
                            "username": "ayush",
                            "text": "deploy done",
                            "ts": "1",
                            "permalink": "https://slack.com/p1",
                        }
                    ]
                }
            },
            {"messages": [{"user": "U1", "text": "hi", "ts": "2"}]},
        ]
    )
    mock_get_client.return_value = client

    search, history = create_message_tools(MagicMock(), "user-123")

    search_data = json.loads(await search.ainvoke({"query": "deploy"}))
    history_data = json.loads(await history.ainvoke({"channel_id": "C1"}))

    assert search_data["messages"][0]["channel"] == "general"
    assert history_data["messages"][0]["text"] == "hi"
    client.get.assert_any_await(
        "conversations.history",
        params={"channel": "C1", "limit": 20},
    )
