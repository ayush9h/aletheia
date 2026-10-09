from unittest.mock import patch

from app.memory.note import MemoryNote


@patch("app.memory.note.datetime")
def test_memory_note_defaults(mock_datetime) -> None:
    mock_datetime.now.return_value.strftime.return_value = "202610092359"

    note = MemoryNote("Test memory")

    assert note.content == "Test memory"
    assert note.id
    assert note.timestamp == "202610092359"
    assert note.last_accessed == "202610092359"
    assert note.keywords == []
    assert note.links == []
    assert note.context == "General"
    assert note.category == "Uncategorized"
    assert note.tags == []
    assert note.retrieval_count == 0
    assert note.evolution_history == []


def test_memory_note_explicit_values() -> None:
    note = MemoryNote(
        content="Python project",
        id="note-123",
        keywords=["python", "testing"],
        links={"github": "repo"},
        retrieval_count=5,
        timestamp="202601010000",
        last_accessed="202601020000",
        context="Work",
        evolution_history=["created", "updated"],
        category="Development",
        tags=["backend"],
    )

    assert note.content == "Python project"
    assert note.id == "note-123"
    assert note.keywords == ["python", "testing"]
    assert note.links == {"github": "repo"}
    assert note.retrieval_count == 5
    assert note.timestamp == "202601010000"
    assert note.last_accessed == "202601020000"
    assert note.context == "Work"
    assert note.evolution_history == ["created", "updated"]
    assert note.category == "Development"
    assert note.tags == ["backend"]
