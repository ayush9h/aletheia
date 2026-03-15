from datetime import datetime

from app.memory.manager import MemoryManager
from app.prompts.orchestrator_prompt import ORCHESTRATOR_BASE_PROMPT
from app.services.agent_state import AgentState
from app.utils.config import settings
from langchain.agents import create_agent
from langchain_core.messages import SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph

memory_manager = MemoryManager(
    llm_client=ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="llama-3.3-70b-versatile",
    )
)


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


async def generate_session_title(state: AgentState) -> AgentState:

    client = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=state["user_model"],
    )

    response = await client.ainvoke(
        state["user_input"]
        + [SystemMessage(content="Generate a short session title max 15 words")]
    )

    state["session_title"] = str(response.content)
    return state


async def orchestrator(state: AgentState) -> AgentState:

    memory_block = f"""
Relevant past memories:
{state.get("memory_context","")}
"""

    pref_block = f"""
User Custom Instruction: {state["user_preference"].userCustomInstruction}
User Hobbies: {state["user_preference"].userHobbies}
User Nickname: {state["user_preference"].nickname}
User occupation: {state["user_preference"].occupation}
"""
    agent = agent = create_agent(
        model=ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model=state["user_model"],
        ),
        system_prompt=SystemMessage(content=ORCHESTRATOR_BASE_PROMPT),
    )

    agent_input = {
        "messages": state["user_input"]
        + [
            SystemMessage(content=memory_block),
            SystemMessage(content=pref_block),
            SystemMessage(
                content=f"Respond back in {state['user_preference'].baseTone} fashion manner."
            ),
        ]
    }
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

builder.add_node("generate_session_title", generate_session_title)
builder.add_node("memory_retrieve", memory_retrieve)
builder.add_node("orchestrator", orchestrator)
builder.add_node("memory_store", memory_store)

builder.add_edge(START, "generate_session_title")
builder.add_edge("generate_session_title", "memory_retrieve")
builder.add_edge("memory_retrieve", "orchestrator")
builder.add_edge("orchestrator", "memory_store")
builder.add_edge("memory_store", END)

graph = builder.compile()
