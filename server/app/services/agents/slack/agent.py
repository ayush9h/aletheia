from langchain.agents import create_agent
from langchain.agents.middleware import (ModelFallbackMiddleware,
                                         ToolCallLimitMiddleware)

from app.services.gemini import gemini_llm
from app.services.agents.slack.tools import (create_channel_tools,
                                             create_message_tools)


def create_slack_agent(
    llm,
    session,
    user_id: str,
):

    tools = [
        create_channel_tools(
            session,
            user_id,
        ),
        *create_message_tools(
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
You are a Slack specialist.
You can work with the user's connected Slack workspace.
Use Slack tools when the user asks about:
- channels
- messages and conversations

Use slack_list_channels to resolve a channel name to its ID before reading history.
Never invent Slack information.
Use tools to retrieve current information.
""",
    )
