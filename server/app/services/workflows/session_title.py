import structlog
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_groq.chat_models import ChatGroq

from app.services.agent_state import AgentState
from app.utils.rate_limiters.llm import GroqRateLimitExceeded, get_groq_guard
from app.utils.token_estimator import tokens_from_string

logger = structlog.get_logger(__name__)

from app.utils.config import settings


async def generate_session_title(
    state: AgentState,
) -> dict:
    user_input = state.get(
        "user_input",
        [],
    )
    user_message = next(
        (message for message in user_input if isinstance(message, HumanMessage)),
        None,
    )

    if user_message is None:
        return {"session_title": "New Chat"}

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

    input_tokens = tokens_from_string(
        "\n".join(str(message.content) for message in title_messages)
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

        logger.info(
            "Generated session title",
            title=title,
            session_id=state["session_id"],
        )
        return {"session_title": title}

    except GroqRateLimitExceeded as exc:
        logger.warning(
            "Session title generation rate limited",
            model=exc.model,
            retry_after_seconds=exc.retry_after_seconds,
        )

    except Exception as exc:
        logger.exception(
            "Session title generation failed",
            error=str(exc),
        )

    return {"session_title": "New Chat"}


def route_session_title(
    state: AgentState,
) -> str:
    if state.get("is_new_session", False):
        return "generate_session_title"

    return "memory_store" if state.get("use_memory", False) else "__end__"
