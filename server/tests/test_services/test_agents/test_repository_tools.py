import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.agents.github.tools.pull_requests import (
    create_pull_request_tools,
)
from app.services.agents.github.tools.repositories import (
    create_repository_tools,
)


@pytest.mark.asyncio
@patch("app.services.agents.github.tools.pull_requests.get_github_client")
async def test_github_list_pull_requests(
    mock_get_github_client: MagicMock,
) -> None:
    client = MagicMock()
    client.get = AsyncMock(
        return_value=[
            {
                "number": 42,
                "title": "Fix authentication",
                "state": "open",
                "html_url": "https://github.com/test/repo/pull/42",
                "user": {"login": "octocat"},
                "draft": False,
                "created_at": "2026-10-01T10:00:00Z",
                "updated_at": "2026-10-02T10:00:00Z",
            }
        ]
    )
    mock_get_github_client.return_value = client

    tool = create_pull_request_tools(
        session=MagicMock(),
        user_id="user-123",
    )

    result = await tool.ainvoke(
        {
            "owner": "test",
            "repo": "repo",
            "state": "open",
        }
    )

    data = json.loads(result)

    assert data["owner"] == "test"
    assert data["repo"] == "repo"
    assert data["state"] == "open"
    assert data["count"] == 1
    assert data["pull_requests"][0]["number"] == 42
    assert data["pull_requests"][0]["title"] == "Fix authentication"
    assert data["pull_requests"][0]["user"] == "octocat"

    client.get.assert_awaited_once_with(
        "/repos/test/repo/pulls",
        params={
            "state": "open",
            "per_page": 5,
        },
    )


@pytest.mark.asyncio
@patch("app.services.agents.github.tools.repositories.get_github_client")
async def test_github_search_repositories(
    mock_get_github_client: MagicMock,
) -> None:
    client = MagicMock()
    client.get = AsyncMock(
        return_value={
            "total_count": 1,
            "items": [
                {
                    "name": "test-repo",
                    "full_name": "octocat/test-repo",
                    "description": "A test repository",
                    "html_url": "https://github.com/octocat/test-repo",
                    "owner": {"login": "octocat"},
                    "language": "Python",
                    "stargazers_count": 100,
                    "forks_count": 20,
                    "updated_at": "2026-10-01T10:00:00Z",
                }
            ],
        }
    )
    mock_get_github_client.return_value = client

    tool = create_repository_tools(
        session=MagicMock(),
        user_id="user-123",
    )

    result = await tool.ainvoke({"query": "test repository"})

    data = json.loads(result)

    assert data["query"] == "test repository"
    assert data["total_count"] == 1
    assert data["returned_count"] == 1

    repository = data["repositories"][0]

    assert repository["name"] == "test-repo"
    assert repository["full_name"] == "octocat/test-repo"
    assert repository["description"] == "A test repository"
    assert repository["owner"] == "octocat"
    assert repository["language"] == "Python"
    assert repository["stars"] == 100
    assert repository["forks"] == 20

    client.get.assert_awaited_once_with(
        "/search/repositories",
        params={
            "q": "test repository",
            "per_page": 5,
        },
    )
