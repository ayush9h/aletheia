from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.db_service.db import get_session


@pytest.mark.asyncio
async def test_get_session_yields_session():
    mock_session = MagicMock()

    mock_session_maker = MagicMock()
    mock_session_maker.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_maker.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch(
        "app.db_service.db.async_session_maker",
        mock_session_maker,
    ):
        generator = get_session()

        session = await generator.__anext__()

        assert session is mock_session

        await generator.aclose()

    mock_session_maker.assert_called_once()
