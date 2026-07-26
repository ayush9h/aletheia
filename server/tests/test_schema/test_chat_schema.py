from app.schemas.chat_schema import ChatRequest


def test_chat_request():
    payload = {
        "model": "openai/gpt-oss-120b",
        "query": "Hello",
        "userId": "user-123",
    }

    req = ChatRequest(**payload)  # type: ignore

    assert req.model == "openai/gpt-oss-120b"
    assert req.query == "Hello"
    assert req.userId == "user-123"
    assert req.selectedSessionId is None
    assert req.userPref is None
    assert req.userPref is None
