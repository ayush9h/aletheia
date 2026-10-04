import json

import structlog
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_groq import ChatGroq

from app.prompts.workflows.planner_prompt import planner_prompt_parser
from app.services.agent_state import AgentState
from app.services.agents import AGENT_REGISTRY
from app.utils.config import settings
from app.utils.rate_limiters.llm import get_groq_guard

logger = structlog.get_logger(__name__)

PLANNER_MODEL = "qwen/qwen3.8-27b"
PLANNER_MAX_TOKENS = 512

planner_llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=PLANNER_MODEL,
    max_tokens=PLANNER_MAX_TOKENS,
)


def estimate_tokens(
    messages: list[BaseMessage],
) -> int:
    total_characters = sum(len(str(message.content)) for message in messages)

    return (
        max(
            1,
            total_characters // 3,
        )
        + 128
    )


async def planner_node(
    state: AgentState,
) -> AgentState:
    user_input = state.get("user_input", [])

    if not user_input:
        raise ValueError("Planner received empty user_input.")

    user_message = user_input[-1]

    agents_for_prompt = [
        {
            "name": agent["name"],
            "description": agent["description"],
        }
        for agent in AGENT_REGISTRY.values()
    ]

    planner_prompt, planner_parser = planner_prompt_parser()

    memory_context = state.get(
        "memory_context",
        "",
    )

    formatted_prompt = planner_prompt.format(
        query=user_message.content,
        agents=json.dumps(
            agents_for_prompt,
            indent=2,
        ),
        memory_context=memory_context or "None",
    )

    messages = [
        SystemMessage(
            content=formatted_prompt,
        ),
        user_message,
    ]

    groq_guard = get_groq_guard()

    await groq_guard.acquire(
        model=PLANNER_MODEL,
        input_tokens=estimate_tokens(messages),
        max_output_tokens=PLANNER_MAX_TOKENS,
    )

    output = await planner_llm.ainvoke(messages)

    generated_plan = planner_parser.parse(
        output.content,
    )

    logger.info(
        "Generated execution plan",
        plan=generated_plan.model_dump(),
    )

    state["plan"] = generated_plan

    return state
