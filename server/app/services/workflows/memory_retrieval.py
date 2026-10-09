from datetime import datetime

import structlog
from langchain_groq.chat_models import ChatGroq

from app.memory.manager import MemoryManager
from app.services.agent_state import AgentState
from app.utils.config import settings

logger = structlog.getLogger(__name__)

memory_manager: MemoryManager | None = None


def get_memory_manager() -> MemoryManager:
    global memory_manager

    if memory_manager is None:
        memory_manager = MemoryManager(
            llm_client=ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model="qwen/qwen3.8-27b",
            )
        )

    return memory_manager


# Node to retrieve relevant memories
async def memory_retrieve(state: AgentState) -> AgentState:
    user_input = state.get("user_input", [])

    # Checks if user input is NULL
    if not user_input:
        state["memory_context"] = ""
        return state

    query = user_input[-1].content

    # Search for relevant memories
    memories = get_memory_manager().search(
        query=str(query),
        user_id=state["user_id"],
        session_id=state["session_id"],
        k=5,
    )

    # Update the state
    state["memory_context"] = "\n".join(
        [f"{memory['content']} (context:{memory['context']})" for memory in memories]
    )

    return state


# Conditional check to retrieve memory based on user preferences
def route_memory_retrieve(
    state: AgentState,
) -> str:
    if state.get("use_memory", False):
        return "memory_retriever"

    return "planner_node"


# Conditional check to store memory based on user preferences
def route_memory_store(
    state: AgentState,
) -> str:
    if state.get("use_memory", False):
        return "memory_store"

    return "__end__"


# Node to store new memories
async def memory_store(
    state: AgentState,
) -> AgentState:
    user_input = state.get(
        "user_input",
        [],
    )

    if len(user_input) < 2:
        logger.warning("Not enough messages for memory storage")
        return state

    user_msg = user_input[-2]
    assistant_msg = user_input[-1]

    content = f"""
User: {user_msg.content}

Assistant: {assistant_msg.content}
""".strip()

    await get_memory_manager().add_note(
        content=content,
        time=str(datetime.now),
        user_id=state["user_id"],
        session_id=state["session_id"],
    )

    return state
