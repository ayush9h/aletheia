from typing import Annotated, List, Optional, TypedDict

from app.schemas.chat_schema import UserPref
from langgraph.graph.message import BaseMessage, add_messages


class AgentState(TypedDict):
    user_input: Annotated[List[BaseMessage], add_messages]
    session_title: str
    user_model: str
    user_id: str
    session_id: str
    reasoning_kwargs: str
    response_content: str
    user_preference: UserPref
    tokens_consumed: Optional[int]
    duration: Optional[float]
    memory_context: Optional[str]
    tools: Optional[List[str]]
