import base64
import json
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.connectors import send_gmail
from app.db_service.models import UserConnectors
from app.schemas.connectors.gmail import GmailSendRequest
from app.services.agents import AGENT_REGISTRY
from app.services.agents.gmail.client import GmailClient
from app.services.agents.gmail.tools import create_email_tools
from app.services.agents.gmail.tools.emails import extract_text
from app.services.workflows.orch import route_after_executor


def b64(text: str) -> str:
    return base64.urlsafe_b64encode(text.encode()).decode().rstrip("=")


def mock_http(payload: dict, status_code: int = 200) -> MagicMock:
    response = MagicMock(status_code=status_code)
    response.json.return_value = payload
    http = MagicMock()
    http.post = AsyncMock(return_value=response)
    http.request = AsyncMock(return_value=response)
    http.__aenter__ = AsyncMock(return_value=http)
    http.__aexit__ = AsyncMock(return_value=None)
    return http


def connector(**kwargs) -> UserConnectors:
    return UserConnectors(
        user_id="user-123",
        provider="gmail",
        access_token="old-token",
        refresh_token="refresh",
        **kwargs,
    )


def test_gmail_agent_registered() -> None:
    assert "gmail_agent" in AGENT_REGISTRY


def test_extract_text_prefers_plain_part() -> None:
    payload = {
        "mimeType": "multipart/alternative",
        "parts": [
            {"mimeType": "text/html", "body": {"data": b64("<p>Hi html</p>")}},
            {"mimeType": "text/plain", "body": {"data": b64("Hi plain")}},
        ],
    }
    assert extract_text(payload) == "Hi plain"


def test_extract_text_falls_back_to_html() -> None:
    payload = {"mimeType": "text/html", "body": {"data": b64("<p>Hello <b>you</b></p>")}}
    assert extract_text(payload) == "Hello you"


@pytest.mark.asyncio
async def test_client_refreshes_expired_token() -> None:
    session = AsyncMock()
    client = GmailClient(connector(token_expires_at=datetime.utcnow()), session)

    with patch(
        "app.services.agents.gmail.client.httpx.AsyncClient",
        return_value=mock_http({"access_token": "new-token", "expires_in": 3600}),
    ):
        assert await client.access_token() == "new-token"

    assert client.connector.token_expires_at > datetime.utcnow() + timedelta(minutes=50)
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_client_marks_reauth_when_refresh_rejected() -> None:
    session = AsyncMock()
    client = GmailClient(connector(token_expires_at=datetime.utcnow()), session)

    with patch(
        "app.services.agents.gmail.client.httpx.AsyncClient",
        return_value=mock_http({"error": "invalid_grant"}, status_code=400),
    ):
        with pytest.raises(ValueError, match="Reconnect Gmail"):
            await client.access_token()

    assert client.connector.status == "reauth"


@pytest.mark.asyncio
async def test_client_send_builds_raw_message() -> None:
    fresh = connector(token_expires_at=datetime.utcnow() + timedelta(hours=1))
    client = GmailClient(fresh, AsyncMock())
    http = mock_http({"id": "sent-1"})

    with patch("app.services.agents.gmail.client.httpx.AsyncClient", return_value=http):
        assert await client.send("a@b.com", "Hello", "Body text") == {"id": "sent-1"}

    raw = http.request.call_args.kwargs["json"]["raw"]
    message = base64.urlsafe_b64decode(raw).decode()
    assert "To: a@b.com" in message
    assert "Subject: Hello" in message
    assert "Body text" in message


def draft_call(args: dict) -> dict:
    return {"name": "gmail_draft_email", "args": args, "id": "call-1", "type": "tool_call"}


@pytest.mark.asyncio
async def test_draft_tool_returns_artifact_and_does_not_send() -> None:
    tools = {t.name: t for t in create_email_tools(MagicMock(), "user-123")}

    with patch("app.services.agents.gmail.tools.emails.get_gmail_client") as get_client:
        message = await tools["gmail_draft_email"].ainvoke(
            draft_call({"to": "a@b.com", "subject": "Hi\nthere", "body": "Body"})
        )

    assert "NOT been sent" in message.content
    assert message.artifact == {"to": "a@b.com", "subject": "Hi there", "body": "Body"}
    get_client.assert_not_called()


@pytest.mark.asyncio
async def test_draft_tool_rejects_invalid_recipient() -> None:
    tools = {t.name: t for t in create_email_tools(MagicMock(), "user-123")}

    message = await tools["gmail_draft_email"].ainvoke(
        draft_call({"to": "not-an-email", "subject": "Hi", "body": "Body"})
    )

    assert message.content.startswith("Error")
    assert message.artifact is None


def test_route_after_executor_skips_consolidator_for_drafts() -> None:
    state = {"email_drafts": [{"to": "a@b.com"}], "is_new_session": False}
    assert route_after_executor(state) == "__end__"
    assert route_after_executor({"email_drafts": []}) == "consolidator"


@pytest.mark.asyncio
async def test_search_tool_returns_compact_emails() -> None:
    client = MagicMock()
    client.request = AsyncMock(
        side_effect=[
            {"messages": [{"id": "m1"}]},
            {
                "id": "m1",
                "snippet": "See you",
                "payload": {"headers": [{"name": "Subject", "value": "Lunch"}]},
            },
        ]
    )
    tools = {t.name: t for t in create_email_tools(MagicMock(), "user-123")}

    with patch(
        "app.services.agents.gmail.tools.emails.get_gmail_client",
        new=AsyncMock(return_value=client),
    ):
        result = json.loads(await tools["gmail_search_emails"].ainvoke({"query": "lunch"}))

    assert result["emails"] == [{"id": "m1", "Subject": "Lunch", "snippet": "See you"}]


def test_send_request_rejects_header_injection() -> None:
    with pytest.raises(ValidationError):
        GmailSendRequest(
            userId="u", to="a@b.com", subject="Hi\r\nBcc: x@y.com", body="Body"
        )
    with pytest.raises(ValidationError):
        GmailSendRequest(userId="u", to="a@b.com, c@d.com", subject="Hi", body="Body")


@pytest.mark.asyncio
async def test_send_endpoint_requires_secret() -> None:
    payload = GmailSendRequest(userId="u", to="a@b.com", subject="Hi", body="Body")

    with patch("app.api.connectors.settings.CONNECTOR_SECRET", "secret"):
        with pytest.raises(HTTPException) as exc_info:
            await send_gmail(payload=payload, x_connector_secret="wrong", session=AsyncMock())

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_send_endpoint_reports_disconnected_gmail() -> None:
    payload = GmailSendRequest(userId="u", to="a@b.com", subject="Hi", body="Body")

    with (
        patch("app.api.connectors.settings.CONNECTOR_SECRET", "secret"),
        patch(
            "app.api.connectors.get_gmail_client",
            new=AsyncMock(side_effect=ValueError("Gmail is not connected.")),
        ),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await send_gmail(payload=payload, x_connector_secret="secret", session=AsyncMock())

    assert exc_info.value.status_code == 409
