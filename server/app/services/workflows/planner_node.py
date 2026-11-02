import json

import structlog
from langchain_core.messages import SystemMessage
from langchain_groq import ChatGroq

from app.prompts.workflows.planner_prompt import planner_prompt_parser
from app.schemas.workflows.planner_schema import Plan, PlannerOutput, Step
from app.services.agent_state import AgentState
from app.services.agents import AGENT_REGISTRY
from app.utils.config import settings
from app.utils.rate_limiters.llm import get_groq_guard
from app.utils.token_estimator import tokens_from_string

logger = structlog.get_logger(__name__)

PLANNER_MODEL = "qwen/qwen3.8-27b"
PLANNER_MAX_TOKENS = 512

planner_llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=PLANNER_MODEL,
    max_tokens=PLANNER_MAX_TOKENS,
)

planner_prompt, planner_parser = planner_prompt_parser()

PLANNER_SYSTEM_PROMPT = planner_prompt.format(
    agents=json.dumps(
        [
            {
                "name": agent.name,
                "description": agent.description,
            }
            for agent in AGENT_REGISTRY.values()
        ]
    ),
)


def to_plan(output: PlannerOutput) -> Plan:
    return Plan(
        steps=[
            Step(
                step_id=step.step_id,
                plan=step.plan,
                agent_name=step.agent_name,
                agent_input={"task": step.task} if step.task else {},
                depends_on=step.depends_on,
            )
            for step in output.steps
        ]
    )


def add_missing_agents(plan: Plan, required: list[str], task: str) -> None:
    planned = {step.agent_name for step in plan.steps}
    missing = [name for name in required if name not in planned]

    if not missing:
        return

    plan.steps = [step for step in plan.steps if step.agent_name]
    first_id = max((step.step_id for step in plan.steps), default=0) + 1

    for step_id, name in enumerate(missing, start=first_id):
        plan.steps.append(
            Step(
                step_id=step_id,
                plan=f"Use {AGENT_REGISTRY[name].label} for this request.",
                agent_name=name,
                agent_input={"task": task},
            )
        )


async def planner_node(
    state: AgentState,
) -> AgentState:
    user_input = state.get("user_input", [])

    if not user_input:
        raise ValueError("Planner received empty user_input.")

    user_message = user_input[-1]

    # Client input reaches the prompt, so keep only names we registered
    required_agents = [
        name
        for name in dict.fromkeys(state.get("tools") or [])
        if name in AGENT_REGISTRY
    ]

    memory_context = state.get(
        "memory_context",
        "",
    )

    request_context = (
        f"Relevant Memory:\n{memory_context or 'None'}\n\n"
        f"Required Agents:\n{json.dumps(required_agents)}"
    )

    messages = [
        SystemMessage(
            content=PLANNER_SYSTEM_PROMPT,
        ),
        SystemMessage(
            content=request_context,
        ),
        user_message,
    ]

    groq_guard = get_groq_guard()

    await groq_guard.acquire(
        model=PLANNER_MODEL,
        input_tokens=tokens_from_string(
            "\n".join(str(message.content) for message in messages)
        ),
        max_output_tokens=PLANNER_MAX_TOKENS,
    )

    output = await planner_llm.ainvoke(messages)

    generated_plan = to_plan(
        planner_parser.parse(
            output.content,  # type: ignore
        )
    )

    # The LLM can skip the prompt rule, so a user's selection is enforced here
    add_missing_agents(generated_plan, required_agents, str(user_message.content))

    logger.info(
        "Generated execution plan",
        plan=generated_plan.model_dump(),
    )

    state["plan"] = generated_plan

    return state
