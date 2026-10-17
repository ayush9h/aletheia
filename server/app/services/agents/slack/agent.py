from langchain.agents import create_agent

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
