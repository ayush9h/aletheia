import asyncio
import base64
import json
import re

from langchain_core.tools import tool

from app.schemas.connectors.gmail import EMAIL_PATTERN
from app.services.agents.gmail.client import get_gmail_client

MAX_BODY_LENGTH = 4000
HEADERS = ["From", "To", "Subject", "Date"]


def header_map(payload: dict) -> dict[str, str]:
    return {
        h["name"]: h["value"]
        for h in payload.get("headers", [])
        if h.get("name") in HEADERS
    }


def decode(data: str) -> str:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)).decode(
        "utf-8", errors="replace"
    )


def extract_text(payload: dict) -> str:
    parts = [payload]
    html = ""
    while parts:
        part = parts.pop(0)
        data = (part.get("body") or {}).get("data")
        mime = part.get("mimeType", "")
        if data and mime == "text/plain":
            return decode(data)
        if data and mime == "text/html" and not html:
            html = re.sub(r"<[^>]+>", " ", decode(data))
        parts.extend(part.get("parts", []))
    return re.sub(r"\s+", " ", html).strip()


def create_email_tools(session, user_id: str):

    @tool
    async def gmail_search_emails(query: str = "", limit: int = 10) -> str:
        """
        Search the connected user's Gmail. Supports Gmail search syntax such as
        from:alice@x.com, subject:invoice, is:unread, newer_than:7d.
        An empty query returns the latest emails.
        """
        client = await get_gmail_client(session, user_id)
        listing = await client.request(
            "GET", "/messages", params={"q": query, "maxResults": min(limit, 20)}
        )
        ids = [m["id"] for m in listing.get("messages", [])]

        details = await asyncio.gather(
            *(
                client.request(
                    "GET",
                    f"/messages/{mid}",
                    params={"format": "metadata", "metadataHeaders": HEADERS},
                )
                for mid in ids
            )
        )
        emails = [
            {
                "id": d["id"],
                **header_map(d.get("payload", {})),
                "snippet": d.get("snippet", ""),
            }
            for d in details
        ]
        return json.dumps(
            {"query": query, "count": len(emails), "emails": emails},
            ensure_ascii=False,
        )

    @tool
    async def gmail_read_email(message_id: str) -> str:
        """
        Read the full text of one email by the id returned from gmail_search_emails.
        """
        client = await get_gmail_client(session, user_id)
        message = await client.request(
            "GET", f"/messages/{message_id}", params={"format": "full"}
        )
        payload = message.get("payload", {})
        return json.dumps(
            {
                "id": message_id,
                **header_map(payload),
                "body": extract_text(payload)[:MAX_BODY_LENGTH],
            },
            ensure_ascii=False,
        )

    @tool(response_format="content_and_artifact")
    async def gmail_draft_email(
        to: str, subject: str, body: str
    ) -> tuple[str, dict | None]:
        """
        Prepare an email for the user to review. This does NOT send it: the user
        sees the draft in the chat and sends it with a confirmation button.
        Use the exact recipient address the user gave; never guess one.
        """
        if not re.match(EMAIL_PATTERN, to):
            return (
                "Error: the recipient is not a valid email address. Ask the user for it.",
                None,
            )

        draft = {"to": to, "subject": " ".join(subject.split()), "body": body}
        return "Draft shown to the user for confirmation. It has NOT been sent yet.", draft

    return [gmail_search_emails, gmail_read_email, gmail_draft_email]
