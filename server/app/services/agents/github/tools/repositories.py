from typing import Any

from langchain_core.tools import tool

from app.services.agents.github.client import get_github_client

import json

MAX_DESCRIPTION_LENGTH = 300


def create_repository_tools(
    session,
    user_id: str,
):

    @tool
    async def github_search_repositories(
        query: str,
    ) -> str:
        """
        Search GitHub repositories accessible to the connected user.

        Returns compact repository metadata optimized for agent reasoning.
        """

        client = await get_github_client(
            session,
            user_id,
        )

        response = await client.get(
            "/search/repositories",
            params={
                "q": query,
                "per_page": 5,
            },
        )

        repositories = []

        for repo in response.get("items", [])[:5]:
            owner = repo.get("owner") or {}

            description = repo.get("description")

            if description:
                description = description[:MAX_DESCRIPTION_LENGTH]

            repositories.append(
                {
                    "name": repo.get("name"),
                    "full_name": repo.get("full_name"),
                    "description": description,
                    "url": repo.get("html_url"),
                    "owner": owner.get("login"),
                    "language": repo.get("language"),
                    "stars": repo.get("stargazers_count", 0),
                    "forks": repo.get("forks_count", 0),
                    "updated_at": repo.get("updated_at"),
                }
            )

        return json.dumps(
            {
                "query": query,
                "total_count": response.get("total_count", 0),
                "returned_count": len(repositories),
                "repositories": repositories,
            },
            ensure_ascii=False,
        )

    return github_search_repositories
