from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import DatabaseError

from app.api.sessions import (
    all_chats,
    delete_session,
    users_session,
)


def make_session_result(*, scalar=None, scalars=None):
    result = MagicMock()

    if scalars is not None:
        result.scalars.return_value.all.return_value = scalars
    else:
        result.scalar_one_or_none.return_value = scalar

    return result


@pytest.mark.asyncio
async def test_users_session_returns_sessions():
    db_session_1 = MagicMock()
    db_session_1.session_id = 1
    db_session_1.session_title = "First Chat"
    db_session_1.created_at = datetime(2026, 10, 1, 10, 0)
    db_session_1.is_pinned = True

    db_session_2 = MagicMock()
    db_session_2.session_id = 2
    db_session_2.session_title = "Second Chat"
    db_session_2.created_at = datetime(2026, 10, 2, 10, 0)
    db_session_2.is_pinned = False

    session = AsyncMock()
    session.execute.return_value = make_session_result(
        scalars=[db_session_1, db_session_2]
    )

    result = await users_session(
        user_id="user-123",
        session=session,
    )

    assert result == [
        {
            "session_id": 1,
            "session_title": "First Chat",
            "created_at": datetime(2026, 10, 1, 10, 0),
            "is_pinned": True,
        },
        {
            "session_id": 2,
            "session_title": "Second Chat",
            "created_at": datetime(2026, 10, 2, 10, 0),
            "is_pinned": False,
        },
    ]

    session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_users_session_returns_empty_list_when_no_sessions():
    session = AsyncMock()
    session.execute.return_value = make_session_result(scalars=[])

    result = await users_session(
        user_id="user-123",
        session=session,
    )

    assert result == []
    session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_users_session_handles_database_error():
    session = AsyncMock()
    session.execute.side_effect = DatabaseError(
        "database error",
        None,
        None,
    )

    result = await users_session(
        user_id="user-123",
        session=session,
    )

    assert result == []
    session.rollback.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_session_success():
    db_session = MagicMock()
    db_session.session_id = 123
    db_session.user_id = "user-123"

    session = AsyncMock()
    session.execute.return_value = make_session_result(scalar=db_session)

    result = await delete_session(
        session_id=123,
        user_id="user-123",
        session=session,
    )

    assert result == {
        "status": "success",
        "message": "Session deleted successfully",
    }

    session.delete.assert_awaited_once_with(db_session)
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_session_returns_not_found():
    session = AsyncMock()
    session.execute.return_value = make_session_result(scalar=None)

    result = await delete_session(
        session_id=123,
        user_id="user-123",
        session=session,
    )

    assert result == {
        "status": "Exception",
        "message": "Exception occurred : Session not found",
        "code": 404,
    }

    session.delete.assert_not_awaited()
    session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_delete_session_handles_database_error():
    session = AsyncMock()
    session.execute.side_effect = DatabaseError(
        "database error",
        None,
        None,
    )

    result = await delete_session(
        session_id=123,
        user_id="user-123",
        session=session,
    )

    assert result == {
        "status": "error",
        "message": "Unable to delete session",
    }

    session.rollback.assert_awaited_once()


@pytest.mark.asyncio
async def test_pin_session_pins_unpinned_session():
    db_session = MagicMock()
    db_session.session_id = 123
    db_session.is_pinned = False
    db_session.pinned_at = None

    session = AsyncMock()

    # First execute is the session lookup.
    session.execute.side_effect = [
        make_session_result(scalar=db_session),
        make_session_result(scalars=[db_session]),
    ]

    result = await __import__(
        "app.api.sessions",
        fromlist=["pin_session"],
    ).pin_session(
        session_id=123,
        user_id="user-123",
        session=session,
    )

    assert db_session.is_pinned is True
    assert db_session.pinned_at is not None

    assert result == [
        {
            "session_id": 123,
            "session_title": db_session.session_title,
            "created_at": db_session.created_at,
            "is_pinned": True,
        }
    ]

    session.commit.assert_awaited_once()
    assert session.execute.await_count == 2


@pytest.mark.asyncio
async def test_pin_session_unpins_pinned_session():
    db_session = MagicMock()
    db_session.session_id = 123
    db_session.is_pinned = True
    db_session.pinned_at = datetime(2026, 10, 1, 10, 0)

    session = AsyncMock()

    session.execute.side_effect = [
        make_session_result(scalar=db_session),
        make_session_result(scalars=[db_session]),
    ]

    result = await __import__(
        "app.api.sessions",
        fromlist=["pin_session"],
    ).pin_session(
        session_id=123,
        user_id="user-123",
        session=session,
    )

    assert db_session.is_pinned is False
    assert db_session.pinned_at is None

    assert result == [
        {
            "session_id": 123,
            "session_title": db_session.session_title,
            "created_at": db_session.created_at,
            "is_pinned": False,
        }
    ]

    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_pin_session_returns_empty_list_when_session_not_found():
    session = AsyncMock()
    session.execute.return_value = make_session_result(scalar=None)

    result = await __import__(
        "app.api.sessions",
        fromlist=["pin_session"],
    ).pin_session(
        session_id=123,
        user_id="user-123",
        session=session,
    )

    assert result == []
    session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_pin_session_handles_database_error():
    session = AsyncMock()
    session.execute.side_effect = DatabaseError(
        "database error",
        None,
        None,
    )

    result = await __import__(
        "app.api.sessions",
        fromlist=["pin_session"],
    ).pin_session(
        session_id=123,
        user_id="user-123",
        session=session,
    )

    assert result == []
    session.rollback.assert_awaited_once()


@pytest.mark.asyncio
async def test_all_chats_returns_no_sessions_message():
    session = AsyncMock()
    session.execute.return_value = make_session_result(scalars=[])

    result = await all_chats(
        user_id="user-123",
        session=session,
    )

    assert result == {
        "message": "No sessions found",
    }

    assert session.execute.await_count == 1
    session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_all_chats_deletes_sessions_and_chats():
    session = AsyncMock()

    session.execute.side_effect = [
        make_session_result(scalars=[1, 2, 3]),
        MagicMock(),
        MagicMock(),
    ]

    result = await all_chats(
        user_id="user-123",
        session=session,
    )

    assert result == {
        "message": "All chats deleted successfully",
    }

    assert session.execute.await_count == 3
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_all_chats_handles_database_error():
    session = AsyncMock()
    session.execute.side_effect = DatabaseError(
        "database error",
        None,
        None,
    )

    result = await all_chats(
        user_id="user-123",
        session=session,
    )

    assert result == {
        "message": "Unable to delete chats",
    }

    session.rollback.assert_awaited_once()
