from typing import Annotated, TypedDict

from langgraph.graph.message import BaseMessage, add_messages

from app.schemas.chat_schema import UserPref
from app.schemas.workflows.planner_schema import Plan


class AgentState(TypedDict):
    user_input: Annotated[list[BaseMessage], add_messages]
    session_title: str
    user_model: str
    user_id: str
    session_id: str
    reasoning_kwargs: str
    response_content: str
    user_preference: UserPref
    tokens_consumed: int | None
    duration: float | None
    memory_context: str | None
    tools: list[str] | None
    plan: Plan
    use_memory: bool
