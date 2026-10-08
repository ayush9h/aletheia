from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import DatabaseError

from app.api.user_settings import get_user_pref, store_user_pref
from app.schemas.user_pref import UserPref


def make_payload() -> UserPref:
    return UserPref(
        userId="user-123",
        userCustomInstruction="Be concise",
        nickname="Alex",
        userHobbies="Coding",
        occupation="Developer",
        baseTone="professional",
        memoryEnabled=True,
    )


@pytest.mark.asyncio
async def test_store_user_pref_updates_existing_preferences():
    session = MagicMock()

    existing_pref = MagicMock()
    existing_pref.user_id = "user-123"

    result = MagicMock()
    result.scalar_one_or_none.return_value = existing_pref

    session.execute = AsyncMock(return_value=result)
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    response = await store_user_pref(
        payload=make_payload(),
        session=session,
    )

    assert response == {
        "status": "success",
        "message": "User preferences updated successfully",
        "code": 200,
    }

    assert existing_pref.assistant_behavior == "Be concise"
    assert existing_pref.nickname == "Alex"
    assert existing_pref.user_personal_description == "Coding"
    assert existing_pref.memory_enabled is True
    assert existing_pref.occupation == "Developer"
    assert existing_pref.baseTone == "professional"

    session.execute.assert_awaited_once()
    session.commit.assert_awaited_once()
    session.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_store_user_pref_creates_new_preferences():
    session = MagicMock()

    result = MagicMock()
    result.scalar_one_or_none.return_value = None

    session.execute = AsyncMock(return_value=result)
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    response = await store_user_pref(
        payload=make_payload(),
        session=session,
    )

    assert response == {
        "status": "success",
        "message": "User preferences updated successfully",
        "code": 200,
    }

    session.add.assert_called_once()

    created_pref = session.add.call_args.args[0]

    assert created_pref.user_id == "user-123"
    assert created_pref.assistant_behavior == "Be concise"
    assert created_pref.nickname == "Alex"
    assert created_pref.user_personal_description == "Coding"
    assert created_pref.occupation == "Developer"
    assert created_pref.baseTone == "professional"
    assert created_pref.memory_enabled is True

    session.commit.assert_awaited_once()
    session.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_store_user_pref_handles_database_error():
    session = MagicMock()

    session.execute = AsyncMock(
        side_effect=DatabaseError(
            "SELECT",
            {},
            Exception("database unavailable"),
        )
    )
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    response = await store_user_pref(
        payload=make_payload(),
        session=session,
    )

    assert response == {
        "status": "failure",
        "message": "Unable to update user preferences",
        "code": 500,
    }

    session.rollback.assert_awaited_once()
    session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_user_pref_returns_existing_preferences():
    session = MagicMock()

    existing_pref = MagicMock()
    existing_pref.user_id = "user-123"
    existing_pref.assistant_behavior = "Be concise"
    existing_pref.nickname = "Alex"
    existing_pref.user_personal_description = "Coding"
    existing_pref.occupation = "Developer"
    existing_pref.baseTone = "professional"
    existing_pref.memory_enabled = True

    result = MagicMock()
    result.scalar_one_or_none.return_value = existing_pref

    session.execute = AsyncMock(return_value=result)
    session.rollback = AsyncMock()

    response = await get_user_pref(
        user_id="user-123",
        session=session,
    )

    assert response == {
        "userId": "user-123",
        "userCustomInstruction": "Be concise",
        "nickname": "Alex",
        "userHobbies": "Coding",
        "occupation": "Developer",
        "baseTone": "professional",
        "memoryEnabled": True,
    }

    session.execute.assert_awaited_once()
    session.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_user_pref_returns_defaults_when_not_found():
    session = MagicMock()

    result = MagicMock()
    result.scalar_one_or_none.return_value = None

    session.execute = AsyncMock(return_value=result)
    session.rollback = AsyncMock()

    response = await get_user_pref(
        user_id="user-123",
        session=session,
    )

    assert response == {
        "userId": "user-123",
        "userCustomInstruction": "",
        "nickname": "",
        "userHobbies": "",
        "occupation": "",
        "baseTone": "",
        "memoryEnabled": False,
    }

    session.execute.assert_awaited_once()
    session.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_get_user_pref_handles_database_error():
    session = MagicMock()

    session.execute = AsyncMock(
        side_effect=DatabaseError(
            "SELECT",
            {},
            Exception("database unavailable"),
        )
    )
    session.rollback = AsyncMock()

    response = await get_user_pref(
        user_id="user-123",
        session=session,
    )

    assert response == {
        "status": "failure",
        "message": "Unable to fetch user preferences",
        "code": 500,
    }

    session.rollback.assert_awaited_once()
