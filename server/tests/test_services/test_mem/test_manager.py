from unittest.mock import AsyncMock, MagicMock

import pytest

from app.memory.manager import MemoryManager
from app.memory.note import MemoryNote


@pytest.fixture
def manager():
    """Create MemoryManager without initializing Pinecone."""
    llm = MagicMock()

    instance = MemoryManager.__new__(MemoryManager)
    instance.llm_client = llm
    instance.retriever = MagicMock()
    instance.evo_threshold = 100
    instance.memories = {}
    instance.evo_cnt = 0

    return instance


def test_init(monkeypatch):
    retriever = MagicMock()

    monkeypatch.setattr(
        "app.memory.manager.PineconeRetriever",
        MagicMock(return_value=retriever),
    )

    llm = MagicMock()
    manager = MemoryManager(llm_client=llm, evo_threshold=10)

    assert manager.llm_client is llm
    assert manager.retriever is retriever
    assert manager.evo_threshold == 10
    assert manager.memories == {}
    assert manager.evo_cnt == 0


@pytest.mark.asyncio
async def test_analyze_content_success(manager, monkeypatch):
    response = MagicMock()
    response.content = '{"keywords": ["python"], "context": "work", "tags": ["coding"]}'

    manager.llm_client.ainvoke = AsyncMock(return_value=response)

    parsed = MagicMock()
    parsed.model_dump.return_value = {
        "keywords": ["python"],
        "context": "work",
        "tags": ["coding"],
    }

    monkeypatch.setattr(
        "app.memory.manager.NoteSchema.model_validate_json",
        lambda _: parsed,
    )

    result = await manager.analyze_content("Python project")

    assert result == {
        "keywords": ["python"],
        "context": "work",
        "tags": ["coding"],
    }

    manager.llm_client.ainvoke.assert_awaited_once()


@pytest.mark.asyncio
async def test_analyze_content_failure(manager, monkeypatch):
    manager.llm_client.ainvoke = AsyncMock(side_effect=RuntimeError("LLM failure"))

    result = await manager.analyze_content("some content")

    assert result == {
        "keywords": [],
        "context": "General",
        "tags": [],
    }


@pytest.mark.asyncio
async def test_add_note_analyzes_missing_metadata(manager, monkeypatch):
    manager.analyze_content = AsyncMock(
        return_value={
            "keywords": ["python"],
            "context": "work",
            "tags": ["coding"],
        }
    )

    manager.process_memory = AsyncMock(side_effect=lambda note, **kwargs: (False, note))

    manager.retriever.add_document = MagicMock()

    note_id = await manager.add_note(
        content="Python project",
        time="2026-10-09",
        user_id="user-1",
        session_id="session-1",
    )

    manager.analyze_content.assert_awaited_once_with("Python project")
    manager.process_memory.assert_awaited_once()

    stored_note = manager.memories[note_id]

    assert stored_note.keywords == ["python"]
    assert stored_note.context == "work"
    assert stored_note.tags == ["coding"]
    assert stored_note.timestamp == "2026-10-09"

    manager.retriever.add_document.assert_called_once()


@pytest.mark.asyncio
async def test_add_note_skips_analysis_when_metadata_complete(manager):
    manager.analyze_content = AsyncMock()

    manager.process_memory = AsyncMock(side_effect=lambda note, **kwargs: (False, note))

    manager.retriever.add_document = MagicMock()

    note_id = await manager.add_note(
        content="Python project",
        time="2026-10-09",
        user_id="user-1",
        session_id="session-1",
        keywords=["python"],
        context="work",
        tags=["coding"],
    )

    manager.analyze_content.assert_not_awaited()
    manager.process_memory.assert_awaited_once()

    assert note_id in manager.memories
    assert manager.memories[note_id].keywords == ["python"]


@pytest.mark.asyncio
async def test_add_note_evolution_threshold(manager):
    manager.evo_threshold = 2

    manager.process_memory = AsyncMock(side_effect=lambda note, **kwargs: (True, note))

    manager.consolidate_memories = MagicMock()
    manager.retriever.add_document = MagicMock()

    await manager.add_note(
        content="memory one",
        time="2026-10-09",
        user_id="user-1",
        session_id="session-1",
        keywords=["one"],
        context="work",
        tags=["test"],
    )

    manager.consolidate_memories.assert_not_called()
    assert manager.evo_cnt == 1

    await manager.add_note(
        content="memory two",
        time="2026-10-09",
        user_id="user-1",
        session_id="session-1",
        keywords=["two"],
        context="work",
        tags=["test"],
    )

    assert manager.evo_cnt == 2
    manager.consolidate_memories.assert_called_once_with(
        user_id="user-1",
        session_id="session-1",
    )


def test_search_success(manager):
    manager.retriever.search.return_value = {
        "matches": [
            {
                "score": 0.95,
                "metadata": {
                    "id": "memory-1",
                    "content": "Python project",
                    "context": "work",
                    "keywords": ["python"],
                    "tags": ["coding"],
                },
            },
            {
                "score": 0.85,
                "metadata": {
                    "id": "memory-2",
                    "content": "FastAPI project",
                },
            },
        ]
    }

    result = manager.search(
        query="python",
        user_id="user-1",
        session_id="session-1",
        k=5,
    )

    assert result == [
        {
            "id": "memory-1",
            "content": "Python project",
            "context": "work",
            "keywords": ["python"],
            "tags": ["coding"],
            "score": 0.95,
        },
        {
            "id": "memory-2",
            "content": "FastAPI project",
            "context": None,
            "keywords": [],
            "tags": [],
            "score": 0.85,
        },
    ]

    manager.retriever.search.assert_called_once_with(
        "python",
        user_id="user-1",
        session_id="session-1",
        k=5,
    )


def test_search_failure(manager):
    manager.retriever.search.side_effect = RuntimeError("Pinecone error")

    result = manager.search(
        query="python",
        user_id="user-1",
        session_id="session-1",
    )

    assert result == []


def test_consolidate_memories(manager):
    note = MemoryNote(
        content="Python project",
        keywords=["python"],
        links=["memory-1"],
        context="work",
        tags=["coding"],
    )

    manager.memories[note.id] = note

    manager.consolidate_memories(
        user_id="user-1",
        session_id="session-1",
    )

    manager.retriever.add_document.assert_called_once_with(
        note.content,
        {
            "id": note.id,
            "content": note.content,
            "keywords": note.keywords,
            "links": note.links,
            "retrieval_count": note.retrieval_count,
            "timestamp": note.timestamp,
            "last_accessed": note.last_accessed,
            "context": note.context,
            "evolution_history": note.evolution_history,
            "category": note.category,
            "tags": note.tags,
        },
        note.id,
        "user-1",
        "session-1",
    )


def test_find_related_memories_success(manager):
    manager.retriever.search.return_value = {
        "matches": [
            {
                "metadata": {
                    "id": "memory-1",
                    "timestamp": "2026-10-09",
                    "content": "Python project",
                    "context": "work",
                    "keywords": ["python"],
                    "tags": ["coding"],
                }
            },
            {
                "metadata": {
                    "id": "memory-2",
                    "content": "FastAPI project",
                }
            },
        ]
    }

    memory_str, memory_ids = manager.find_related_memories(
        query="python",
        user_id="user-1",
        session_id="session-1",
    )

    assert memory_ids == ["memory-1", "memory-2"]
    assert "memory_id:memory-1" in memory_str
    assert "content:Python project" in memory_str
    assert "context:work" in memory_str
    assert "memory_id:memory-2" in memory_str


def test_find_related_memories_failure(manager):
    manager.retriever.search.side_effect = RuntimeError("search failed")

    memory_str, memory_ids = manager.find_related_memories(
        query="python",
        user_id="user-1",
        session_id="session-1",
    )

    assert memory_str == ""
    assert memory_ids == []


@pytest.mark.asyncio
async def test_process_memory_no_neighbors(manager):
    note = MemoryNote(content="new memory")

    manager.find_related_memories = MagicMock(return_value=("", []))

    evolved, result = await manager.process_memory(
        note,
        user_id="user-1",
        session_id="session-1",
    )

    assert evolved is False
    assert result is note
    manager.llm_client.ainvoke.assert_not_called()


@pytest.mark.asyncio
async def test_process_memory_llm_failure(manager):
    note = MemoryNote(content="new memory")

    manager.find_related_memories = MagicMock(
        return_value=("neighbor memory", ["memory-1"])
    )

    manager.llm_client.ainvoke = AsyncMock(side_effect=RuntimeError("LLM failure"))

    evolved, result = await manager.process_memory(
        note,
        user_id="user-1",
        session_id="session-1",
    )

    assert evolved is False
    assert result is note


@pytest.mark.asyncio
async def test_process_memory_should_not_evolve(manager, monkeypatch):
    note = MemoryNote(content="new memory")

    manager.find_related_memories = MagicMock(
        return_value=("neighbor memory", ["memory-1"])
    )

    response = MagicMock()
    response.content = '{"should_evolve": false}'

    manager.llm_client.ainvoke = AsyncMock(return_value=response)

    parsed = MagicMock()
    parsed.model_dump.return_value = {
        "should_evolve": False,
        "actions": [],
    }

    monkeypatch.setattr(
        "app.memory.manager.EvolveSchema.model_validate_json",
        lambda _: parsed,
    )

    evolved, result = await manager.process_memory(
        note,
        user_id="user-1",
        session_id="session-1",
    )

    assert evolved is False
    assert result is note
    manager.retriever.fetch.assert_not_called()
    manager.retriever.add_document.assert_not_called()
