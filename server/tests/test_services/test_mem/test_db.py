from unittest.mock import MagicMock, patch

import pytest

from app.db_service.retriever import PineconeRetriever


@pytest.fixture
def pinecone_setup():
    pc = MagicMock()
    voyage = MagicMock()
    index = MagicMock()

    pc.list_indexes.return_value = [
        {"name": "aletheiamemories"},
    ]
    pc.Index.return_value = index

    return pc, voyage, index


@pytest.fixture
def retriever(pinecone_setup):
    pc, voyage, index = pinecone_setup

    with (
        patch("app.db_service.retriever.Pinecone", return_value=pc),
        patch("app.db_service.retriever.Client", return_value=voyage),
    ):
        retriever = PineconeRetriever(api_key="test-api-key")

    retriever.pc = pc
    retriever.voyage = voyage
    retriever.index = index

    return retriever


def test_init_existing_index(pinecone_setup):
    pc, voyage, index = pinecone_setup

    with (
        patch("app.db_service.retriever.Pinecone", return_value=pc),
        patch("app.db_service.retriever.Client", return_value=voyage),
    ):
        retriever = PineconeRetriever(
            api_key="test-api-key",
            index_name="aletheiamemories",
        )

    assert retriever.pc is pc
    assert retriever.voyage is voyage
    assert retriever.model_name == "voyage-4-lite"
    assert retriever.index is index

    pc.create_index.assert_not_called()
    pc.Index.assert_called_once_with("aletheiamemories")


def test_init_creates_missing_index():
    pc = MagicMock()
    voyage = MagicMock()
    index = MagicMock()

    pc.list_indexes.return_value = [
        {"name": "other-index"},
    ]
    pc.Index.return_value = index

    with (
        patch("app.db_service.retriever.Pinecone", return_value=pc),
        patch("app.db_service.retriever.Client", return_value=voyage),
        patch("app.db_service.retriever.ServerlessSpec") as mock_spec,
    ):
        retriever = PineconeRetriever(
            api_key="test-api-key",
            index_name="test-index",
            dimension=512,
        )

    mock_spec.assert_called_once_with(
        cloud="aws",
        region="us-east-1",
    )

    pc.create_index.assert_called_once_with(
        name="test-index",
        dimension=512,
        metric="cosine",
        spec=mock_spec.return_value,
    )

    pc.Index.assert_called_once_with("test-index")
    assert retriever.index is index


def test_embed(retriever):
    embedding = [0.1, 0.2, 0.3]

    response = MagicMock()
    response.embeddings = [embedding]
    retriever.voyage.embed.return_value = response

    result = retriever._embed("hello world")

    assert result == embedding

    retriever.voyage.embed.assert_called_once_with(
        texts=["hello world"],
        model="voyage-4-lite",
    )


def test_add_document_with_metadata_lists(retriever):
    retriever._embed = MagicMock(return_value=[0.1, 0.2])

    metadata = {
        "id": "memory-1",
        "content": "Python project",
        "context": "programming",
        "keywords": ["python", "fastapi"],
        "tags": ["coding"],
        "retrieval_count": 2,
    }

    retriever.add_document(
        document="Python project",
        metadata=metadata,
        doc_id="memory-1",
        user_id="user-1",
        session_id="session-1",
    )

    retriever._embed.assert_called_once_with(
        "Python project context: programming keywords: python, fastapi tags: coding"
    )

    retriever.index.upsert.assert_called_once()

    vectors = retriever.index.upsert.call_args.kwargs["vectors"]

    assert len(vectors) == 1

    doc_id, vector, processed_metadata = vectors[0]

    assert doc_id == "memory-1"
    assert vector == [0.1, 0.2]

    assert processed_metadata["id"] == "memory-1"
    assert processed_metadata["content"] == "Python project"
    assert processed_metadata["context"] == "programming"
    assert processed_metadata["keywords"] == '["python", "fastapi"]'
    assert processed_metadata["tags"] == '["coding"]'
    assert processed_metadata["retrieval_count"] == "2"
    assert processed_metadata["user_id"] == "user-1"
    assert processed_metadata["session_id"] == "session-1"


def test_add_document_with_json_string_metadata(retriever):
    retriever._embed = MagicMock(return_value=[0.1])

    metadata = {
        "context": "work",
        "keywords": '["python", "ai"]',
        "tags": '["project", "backend"]',
    }

    retriever.add_document(
        document="Aletheia project",
        metadata=metadata,
        doc_id="memory-1",
        user_id="user-1",
        session_id="session-1",
    )

    retriever._embed.assert_called_once_with(
        "Aletheia project context: work keywords: python, ai tags: project, backend"
    )


def test_add_document_general_context_without_keywords_or_tags(retriever):
    retriever._embed = MagicMock(return_value=[0.1])

    metadata = {
        "context": "General",
    }

    retriever.add_document(
        document="Some memory",
        metadata=metadata,
        doc_id="memory-1",
        user_id="user-1",
        session_id="session-1",
    )

    retriever._embed.assert_called_once_with("Some memory")


def test_add_document_generates_id_when_missing(retriever):
    retriever._embed = MagicMock(return_value=[0.1])

    metadata = {
        "content": "test",
    }

    with patch(
        "app.db_service.retriever.uuid.uuid4",
        return_value="generated-id",
    ):
        retriever.add_document(
            document="test",
            metadata=metadata,
            doc_id="",
            user_id="user-1",
            session_id="session-1",
        )

    vectors = retriever.index.upsert.call_args.kwargs["vectors"]

    assert vectors[0][0] == "generated-id"


def test_delete_document(retriever):
    retriever.delete_document("memory-1")

    retriever.index.delete.assert_called_once_with(ids=["memory-1"])


def test_search_with_session_filter(retriever):
    retriever._embed = MagicMock(return_value=[0.1, 0.2])

    results = {
        "matches": [
            {
                "id": "memory-1",
                "score": 0.95,
                "metadata": {
                    "id": "memory-1",
                    "keywords": '["python", "ai"]',
                    "tags": '["coding"]',
                    "context": "work",
                },
            }
        ]
    }

    retriever.index.query.return_value = results

    result = retriever.search(
        query="python",
        user_id="user-1",
        session_id="session-1",
        k=5,
    )

    assert result is results

    retriever._embed.assert_called_once_with("python")

    retriever.index.query.assert_called_once_with(
        vector=[0.1, 0.2],
        top_k=5,
        include_metadata=True,
        filter={
            "user_id": {"$eq": "user-1"},
            "session_id": {"$eq": "session-1"},
        },
    )

    metadata = result["matches"][0]["metadata"]

    assert metadata["keywords"] == ["python", "ai"]
    assert metadata["tags"] == ["coding"]


def test_search_without_session_filter(retriever):
    retriever._embed = MagicMock(return_value=[0.1])

    results = {
        "matches": [
            {
                "metadata": {
                    "id": "memory-1",
                    "content": "test",
                }
            }
        ]
    }

    retriever.index.query.return_value = results

    result = retriever.search(
        query="test",
        user_id="user-1",
        session_id=None,
        k=3,
    )

    assert result is results

    retriever.index.query.assert_called_once_with(
        vector=[0.1],
        top_k=3,
        include_metadata=True,
        filter={
            "user_id": {"$eq": "user-1"},
        },
    )


def test_search_invalid_json_metadata_is_ignored(retriever):
    retriever._embed = MagicMock(return_value=[0.1])

    results = {
        "matches": [
            {
                "metadata": {
                    "keywords": "[invalid-json",
                    "tags": '{"invalid":',
                    "normal": "value",
                }
            }
        ]
    }

    retriever.index.query.return_value = results

    result = retriever.search(
        query="test",
        user_id="user-1",
    )

    metadata = result["matches"][0]["metadata"]

    assert metadata["keywords"] == "[invalid-json"
    assert metadata["tags"] == '{"invalid":'
    assert metadata["normal"] == "value"


def test_fetch(retriever):
    expected = {
        "vectors": {
            "memory-1": {
                "metadata": {
                    "content": "Python project",
                }
            }
        }
    }

    retriever.index.fetch.return_value = expected

    result = retriever.fetch("memory-1")

    assert result is expected

    retriever.index.fetch.assert_called_once_with(ids=["memory-1"])
