from langchain.agents import create_agent
from langchain.agents.middleware import (ModelFallbackMiddleware,
                                         ToolCallLimitMiddleware)

from app.services.gemini import gemini_llm
from app.services.agents.github.tools import (create_pull_request_tools,
                                              create_repository_tools)


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
        # Caps tool calls per run so the agent can't loop on the same tool
        middleware=[
            ToolCallLimitMiddleware(run_limit=2),
            ModelFallbackMiddleware(gemini_llm(max_tokens=2048)),
        ],
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
