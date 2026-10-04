from datetime import datetime

import structlog
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph

from app.memory.manager import MemoryManager
from app.services.agent_state import AgentState
from app.services.workflows.executor_node import executor_node
from app.services.workflows.planner_node import planner_node
from app.utils.config import settings
from app.utils.rate_limiters.llm import GroqRateLimitExceeded, get_groq_guard

logger = structlog.get_logger(__name__)

memory_manager = MemoryManager(
    llm_client=ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="qwen/qwen3.8-27b",
    )
)


def _estimate_input_tokens(messages: list[BaseMessage]) -> int:
    total_chars = sum(len(str(getattr(message, "content", ""))) for message in messages)

    return max(10, total_chars // 4)


def _validate_messages(
    messages: list[BaseMessage],
    context: str,
) -> None:
    invalid = [
        (
            index,
            type(message).__name__,
            type(message).__module__,
        )
        for index, message in enumerate(messages)
        if not isinstance(message, BaseMessage)
    ]

    if invalid:
        logger.error(
            "Invalid message list",
            context=context,
            invalid=invalid,
        )

        raise TypeError(f"Invalid {context} message list: {invalid}")


async def memory_retrieve(
    state: AgentState,
) -> AgentState:
    user_input = state.get("user_input", [])

    _validate_messages(
        user_input,
        "memory retrieval",
    )

    if not user_input:
        state["memory_context"] = ""
        return state

    query_text = user_input[-1].content

    memories = memory_manager.search(
        query=str(query_text),
        user_id=state["user_id"],
        session_id=state["session_id"],
        k=5,
    )

    state["memory_context"] = "\n".join(
        [
            f"{memory['content']} " f"(context:{memory['context']})"
            for memory in memories
        ]
    )

    return state


def route_memory(
    state: AgentState,
) -> str:
    if state.get("use_memory", False):
        return "memory_retrieve"

    return "planner_node"


async def orchestrator(
    state: AgentState,
) -> AgentState:
    model_name = state.get(
        "user_model",
        "qwen/qwen3.8-27b",
    )

    user_input = state.get("user_input", [])

    if not user_input:
        raise ValueError("orchestrator received empty user_input")

    _validate_messages(
        user_input,
        "orchestrator user_input",
    )

    user_message = user_input[-1]

    memory_context = state.get(
        "memory_context",
        "",
    )

    memory_block = "Relevant past memories:\n" f"{memory_context or 'None'}"

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

    plan = state.get("plan")

    plan_block = (
        "Plan to follow for fulfilling the user query:\n"
        f"{plan if plan else 'No plan was generated.'}"
    )

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
            content=memory_block,
        ),
        SystemMessage(
            content=pref_block,
        ),
        SystemMessage(
            content=plan_block,
        ),
        SystemMessage(
            content=tool_results_block,
        ),
        user_message,
    ]

    _validate_messages(
        full_messages,
        "orchestrator",
    )

    groq_guard = get_groq_guard()

    input_tokens = _estimate_input_tokens(
        full_messages,
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
            f"Rate limit hit for model {exc.model}. "
            f"Retry in {exc.retry_after_seconds}s"
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
            "Orchestrator final response is not "
            f"a BaseMessage: {type(final_message)}"
        )

    final_content = final_message.content

    if isinstance(final_content, str):
        response_content = final_content
    else:
        response_content = str(final_content)

    state["reasoning_kwargs"] = final_message.additional_kwargs.get(
        "reasoning_content",
        "",
    )

    state["response_content"] = response_content

    usage_metadata = (
        getattr(
            final_message,
            "usage_metadata",
            None,
        )
        or {}
    )

    total_tokens = usage_metadata.get(
        "total_tokens",
        0,
    )

    state["tokens_consumed"] = int(total_tokens or 0)

    response_metadata = (
        getattr(
            final_message,
            "response_metadata",
            None,
        )
        or {}
    )

    token_usage = (
        response_metadata.get(
            "token_usage",
            {},
        )
        or {}
    )

    state["duration"] = float(
        token_usage.get(
            "total_time",
            0.0,
        )
        or 0.0
    )

    state["user_input"].append(final_message)

    return state


async def generate_session_title(
    state: AgentState,
) -> AgentState:
    user_input = state.get(
        "user_input",
        [],
    )

    _validate_messages(
        user_input,
        "session title",
    )

    user_message = next(
        (message for message in user_input if isinstance(message, HumanMessage)),
        None,
    )

    if user_message is None:
        state["session_title"] = "New Chat"
        return state

    title_messages: list[BaseMessage] = [
        SystemMessage(
            content=(
                "Generate a concise title for the user's request.\n"
                "Maximum 8 words.\n"
                "Use the actual subject of the request.\n"
                "Do not use generic titles such as "
                "'New Chat', 'New Session', 'Chat', or 'Conversation'.\n"
                "Return only the title.\n"
                "Do not use quotes."
            ),
        ),
        HumanMessage(
            content=str(user_message.content),
        ),
    ]

    input_tokens = _estimate_input_tokens(
        title_messages,
    )

    max_output_tokens = 50

    groq_guard = get_groq_guard()

    try:
        await groq_guard.acquire(
            model="qwen/qwen3.8-27b",
            input_tokens=input_tokens,
            max_output_tokens=max_output_tokens,
        )

        client = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model="qwen/qwen3.8-27b",
            max_tokens=max_output_tokens,
        )

        response = await client.ainvoke(
            title_messages,
        )

        title = str(response.content).strip()
        state["session_title"] = title
        logger.info(
            "Generated session title",
            title=title,
            session_id=state["session_id"],
        )

    except GroqRateLimitExceeded as exc:
        logger.warning(
            "Session title generation rate limited",
            model=exc.model,
            retry_after_seconds=exc.retry_after_seconds,
        )

        state["session_title"] = "New Chat"

    except Exception as exc:
        logger.exception(
            "Session title generation failed",
            error=str(exc),
        )
        state["session_title"] = "New Chat"

    return state


async def memory_store(
    state: AgentState,
) -> AgentState:
    user_input = state.get(
        "user_input",
        [],
    )

    _validate_messages(
        user_input,
        "memory store",
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

    await memory_manager.add_note(
        content=content,
        time=str(datetime.utcnow()),
        user_id=state["user_id"],
        session_id=state["session_id"],
    )

    return state


def route_memory_store(
    state: AgentState,
) -> str:
    if state.get("use_memory", False):
        return "memory_store"

    return "__end__"


def route_session_title(
    state: AgentState,
) -> str:
    if state.get("is_new_session", False):
        return "generate_session_title"

    return "memory_store" if state.get("use_memory", False) else "__end__"


builder = StateGraph(AgentState)

builder.add_node(
    "memory_retrieve",
    memory_retrieve,
)

builder.add_node(
    "planner_node",
    planner_node,
)

builder.add_node(
    "executor_node",
    executor_node,
)

builder.add_node(
    "orchestrator",
    orchestrator,
)

builder.add_node(
    "generate_session_title",
    generate_session_title,
)

builder.add_node(
    "memory_store",
    memory_store,
)

builder.add_conditional_edges(
    START,
    route_memory,
    {
        "memory_retrieve": "memory_retrieve",
        "planner_node": "planner_node",
    },
)

builder.add_edge(
    "memory_retrieve",
    "planner_node",
)

builder.add_edge(
    "planner_node",
    "executor_node",
)

builder.add_edge(
    "executor_node",
    "orchestrator",
)

builder.add_conditional_edges(
    "orchestrator",
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
