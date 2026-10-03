from langchain.agents import create_agent

from app.services.agents.github.tools import (
    create_pull_request_tools,
    create_repository_tools,
)


def create_github_agent(
    llm,
    session,
    user_id: str,
):

    tools = [
        create_repository_tools(
            session,
            user_id,
        ),
        create_pull_request_tools(
            session,
            user_id,
        ),
    ]

    return create_agent(
        model=llm,
        tools=tools,
        system_prompt="""
You are a GitHub specialist.
You can work with the user's connected GitHub account.
Use GitHub tools when the user asks about:
- repositories
- pull requests

Never invent GitHub information.
Use tools to retrieve current information.
""",
    )
