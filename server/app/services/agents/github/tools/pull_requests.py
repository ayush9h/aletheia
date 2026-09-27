import json

from langchain_core.tools import tool

from app.services.agents.github.client import get_github_client

MAX_TITLE_LENGTH = 200


def create_pull_request_tools(
    session,
    user_id: str,
):

    @tool
    async def github_list_pull_requests(
        owner: str,
        repo: str,
        state: str = "open",
    ) -> str:
        """
        List pull requests from a GitHub repository.
        """

        client = await get_github_client(
            session,
            user_id,
        )

        response = await client.get(
            f"/repos/{owner}/{repo}/pulls",
            params={
                "state": state,
                "per_page": 5,
            },
        )

        pull_requests = []

        for pr in response[:5]:
            title = pr.get("title") or ""

            pull_requests.append(
                {
                    "number": pr.get("number"),
                    "title": title[:MAX_TITLE_LENGTH],
                    "state": pr.get("state"),
                    "url": pr.get("html_url"),
                    "user": (pr.get("user") or {}).get("login"),
                    "draft": pr.get("draft", False),
                    "created_at": pr.get("created_at"),
                    "updated_at": pr.get("updated_at"),
                }
            )

        return json.dumps(
            {
                "owner": owner,
                "repo": repo,
                "state": state,
                "count": len(pull_requests),
                "pull_requests": pull_requests,
            },
            ensure_ascii=False,
        )

    return github_list_pull_requests
