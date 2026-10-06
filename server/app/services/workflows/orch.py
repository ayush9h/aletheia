import structlog
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_groq.chat_models import ChatGroq
from langgraph.graph.state import END, START, StateGraph

from app.services.agent_state import AgentState
from app.services.workflows.executor_node import executor_node
from app.services.workflows.memory_retrieval import (
    memory_retrieve,
    memory_store,
    route_memory_retrieve,
    route_memory_store,
)
from app.services.workflows.planner_node import planner_node
from app.services.workflows.session_title import (
    generate_session_title,
    route_session_title,
)
from app.utils.config import settings
from app.utils.rate_limiters.llm import GroqRateLimitExceeded, get_groq_guard
from app.utils.token_estimator import tokens_from_string

logger = structlog.getLogger(__name__)


async def consolidator(
    state: AgentState,
) -> dict:
    model_name = state.get(
        "user_model",
        "qwen/qwen3.8-27b",
    )

    user_input = state.get("user_input", [])

    user_message = user_input[-1]
    preference = state.get("user_preference")

    if preference:
        user_custom_instruction = (
            getattr(
                preference,
                "userCustomInstruction",
                "",
            )
            or ""
        )

        user_hobbies = (
            getattr(
                preference,
                "userHobbies",
                "",
            )
            or ""
        )

        nickname = (
            getattr(
                preference,
                "nickname",
                "",
            )
            or ""
        )

        occupation = (
            getattr(
                preference,
                "occupation",
                "",
            )
            or ""
        )
    else:
        user_custom_instruction = ""
        user_hobbies = ""
        nickname = ""
        occupation = ""

    pref_block = f"""
User Custom Instruction:
{user_custom_instruction or "None"}

User Hobbies:
{user_hobbies or "None"}

User Nickname:
{nickname or "None"}

User Occupation:
{occupation or "None"}
""".strip()

    tool_results = state.get(
        "tool_results",
        [],
    )

    tool_results_block = (
        "Results from executed plan:\n"
        f"{tool_results if tool_results else 'No tool results.'}"
    )

    full_messages: list[BaseMessage] = [
        SystemMessage(
            content=pref_block,
        ),
        SystemMessage(
            content=tool_results_block,
        ),
        user_message,
    ]

    groq_guard = get_groq_guard()

    input_tokens = tokens_from_string(
        "\n".join(str(message.content) for message in full_messages)
    )

    max_output_tokens = 2048

    try:
        await groq_guard.acquire(
            model=model_name,
            input_tokens=input_tokens,
            max_output_tokens=max_output_tokens,
        )

    except GroqRateLimitExceeded as exc:
        logger.error(
            "Groq rate limit exceeded",
            model=exc.model,
            retry_after_seconds=exc.retry_after_seconds,
        )

        raise RuntimeError(
            f"Rate limit hit for model {exc.model}. Retry in {exc.retry_after_seconds}s"
        ) from exc

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=model_name,
        reasoning_effort=None,
        streaming=True,
        max_tokens=max_output_tokens,
    )

    final_message = await llm.ainvoke(full_messages)

    if not isinstance(final_message, BaseMessage):
        raise TypeError(
            f"Orchestrator final response is not a BaseMessage: {type(final_message)}"
        )

    final_content = final_message.content

    if isinstance(final_content, str):
        response_content = final_content
    else:
        response_content = str(final_content)

    usage_metadata = getattr(final_message, "usage_metadata", None) or {}
    total_tokens = usage_metadata.get("total_tokens", 0)

    response_metadata = getattr(final_message, "response_metadata", None) or {}
    token_usage = response_metadata.get("token_usage", {}) or {}
    duration = float(token_usage.get("total_time", 0.0) or 0.0)

    return {
        "reasoning_kwargs": final_message.additional_kwargs.get(
            "reasoning_content", ""
        ),
        "response_content": response_content,
        "tokens_consumed": int(total_tokens or 0),
        "duration": duration,
        "user_input": [final_message],
    }


builder = StateGraph(AgentState)

builder.add_node("memory_retriever", memory_retrieve)
builder.add_node("planner_node", planner_node)
builder.add_node("consolidator", consolidator)
builder.add_node("generate_session_title", generate_session_title)
builder.add_node("executor_node", executor_node)
builder.add_node("memory_store", memory_store)

builder.add_conditional_edges(
    START,
    route_memory_retrieve,
    {"memory_retriever": "memory_retriever", "planner_node": "planner_node"},
)

builder.add_edge(
    "planner_node",
    "executor_node",
)

builder.add_edge(
    "executor_node",
    "consolidator",
)

builder.add_conditional_edges(
    "consolidator",
    route_session_title,
    {
        "generate_session_title": "generate_session_title",
        "memory_store": "memory_store",
        "__end__": END,
    },
)

builder.add_conditional_edges(
    "generate_session_title",
    route_memory_store,
    {
        "memory_store": "memory_store",
        "__end__": END,
    },
)

builder.add_edge(
    "memory_store",
    END,
)

graph = builder.compile()
