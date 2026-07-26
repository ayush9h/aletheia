from datetime import datetime

import structlog
from langchain.agents import create_agent
from langchain_core.messages import SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph

from app.memory.manager import MemoryManager
from app.prompts.orchestrator_prompt import ORCHESTRATOR_BASE_PROMPT
from app.services.agent_state import AgentState
from app.services.tools.web_search import web_search
from app.services.workflows.planner_node import planner_node
from app.utils.config import settings
from app.utils.rate_limiters.llm import GroqRateLimitExceeded, get_groq_guard

logger = structlog.get_logger(__name__)
memory_manager = MemoryManager(
    llm_client=ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="llama-3.3-70b-versatile",
    )
)


def _estimate_input_tokens(messages: list) -> int:
    total_chars = sum(len(str(getattr(m, "content", ""))) for m in messages)
    return max(10, total_chars // 4)


async def memory_retrieve(state: AgentState) -> AgentState:
    query_text = state["user_input"][-1].content

    memories = memory_manager.search(
        query=str(query_text),
        user_id=state["user_id"],
        session_id=state["session_id"],
        k=5,
    )

    state["memory_context"] = "\n".join(
        [f"{m['content']} (context:{m['context']})" for m in memories]
    )

    return state


def route_memory(state: AgentState) -> str:
    if state.get("use_memory", False):
        return "memory_retrieve"
    return "planner_node"


def route_memory_store(state: AgentState) -> str:
    if state.get("use_memory", False):
        return "memory_store"
    return "__end__"


async def generate_session_title(state: AgentState) -> AgentState:
    model_name = state.get("user_model", "llama-3.3-70b-versatile")
    groq_guard = get_groq_guard()

    input_tokens = _estimate_input_tokens(state["user_input"])
    max_output_tokens = 50

    try:
        await groq_guard.acquire(
            model=model_name,
            input_tokens=input_tokens,
            max_output_tokens=max_output_tokens,
        )
    except GroqRateLimitExceeded as e:
        logger.error(f"Rate limit hit for model due to: {e}")
        state["session_title"] = "New Session"
        return state

    client = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=model_name,
    )

    response = await client.ainvoke(
        state["user_input"]
        + [SystemMessage(content="Generate a short session title max 15 words")]
    )

    state["session_title"] = str(response.content)
    return state


async def orchestrator(state: AgentState) -> AgentState:
    model_name = state["user_model"]
    groq_guard = get_groq_guard()

    memory_block = f"""
Relevant past memories:
{state.get("memory_context", "")}
"""

    pref_block = f"""
User Custom Instruction: {state["user_preference"].userCustomInstruction}
User Hobbies: {state["user_preference"].userHobbies}
User Nickname: {state["user_preference"].nickname}
User occupation: {state["user_preference"].occupation}
"""

    plan_block = f"""
Plan to follow for fulfilling the user query:
{state.get("plan", "")}
"""

    available_tools = [web_search]

    full_messages = state["user_input"] + [
        SystemMessage(content=memory_block),
        SystemMessage(content=pref_block),
        SystemMessage(content=plan_block),
        SystemMessage(
            content=f"Respond back in {state['user_preference'].baseTone} fashion manner."
        ),
        SystemMessage(
            content=f"Available tools for this request: {available_tools if available_tools else 'None'}"
        ),
    ]

    input_tokens = _estimate_input_tokens(full_messages)
    max_output_tokens = 2048

    try:
        await groq_guard.acquire(
            model=model_name,
            input_tokens=input_tokens,
            max_output_tokens=max_output_tokens,
        )
    except GroqRateLimitExceeded as exc:
        logger.error(
            f"Rate limit hit for model {exc.model}. Retry in {exc.retry_after_seconds}s"
        )
        raise RuntimeError(
            f"Rate limit hit for model {exc.model}. Retry in {exc.retry_after_seconds}s"
        ) from exc

    agent = create_agent(
        model=ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model=model_name,
            reasoning_effort=None,
            streaming=True,
            max_tokens=2048,
        ),
        system_prompt=SystemMessage(content=ORCHESTRATOR_BASE_PROMPT),
        tools=available_tools,
    )

    agent_input = {"messages": full_messages}
    result = await agent.ainvoke(agent_input)  # type:ignore

    final_msg = result["messages"][-1]

    state["reasoning_kwargs"] = final_msg.additional_kwargs.get("reasoning_content", "")
    state["response_content"] = final_msg.content

    state["tokens_consumed"] = final_msg.response_metadata.get("token_usage", {}).get(
        "total_tokens", 0
    )

    state["duration"] = final_msg.response_metadata.get("token_usage", {}).get(
        "total_time", 0.0
    )

    state["user_input"].append(final_msg)

    return state


async def memory_store(state: AgentState) -> AgentState:
    user_msg = state["user_input"][-2].content
    assistant_msg = state["user_input"][-1].content

    content = f"""
User: {user_msg}
Assistant: {assistant_msg}
"""

    await memory_manager.add_note(
        content=content,
        time=str(datetime.utcnow()),
        user_id=state["user_id"],
        session_id=state["session_id"],
    )

    return state


# ---------- GRAPH ----------

builder = StateGraph(AgentState)

builder.add_node("memory_retrieve", memory_retrieve)
builder.add_node("planner_node", planner_node)
builder.add_node("orchestrator", orchestrator)
builder.add_node("generate_session_title", generate_session_title)
builder.add_node("memory_store", memory_store)

builder.add_conditional_edges(
    START,
    route_memory,
    {
        "memory_retrieve": "memory_retrieve",
        "planner_node": "planner_node",
    },
)

builder.add_edge("memory_retrieve", "planner_node")
builder.add_edge("planner_node", "orchestrator")
builder.add_edge("orchestrator", "generate_session_title")

builder.add_conditional_edges(
    "generate_session_title",
    route_memory_store,
    {
        "memory_store": "memory_store",
        "__end__": END,
    },
)

builder.add_edge("memory_store", END)

graph = builder.compile()
