import asyncio
import re
from collections.abc import Iterator

import structlog
from langchain_core.callbacks.manager import adispatch_custom_event
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain_groq import ChatGroq

from app.db_service.db import get_session
from app.schemas.workflows.planner_schema import Step
from app.services.agent_state import AgentState
from app.services.agents import AgentContext, build_agents
from app.utils.config import settings

logger = structlog.get_logger(__name__)


def layers(steps: list[Step]) -> Iterator[list[Step]]:
    """
    Group steps into layers based on their dependencies.

    Params:
        steps (list[Step]): List of steps to group into layers.

    Yields:
        list[Step]: A list of steps which are independent of each other.
    """
    remaining = {s.step_id: s for s in steps}
    known = set(remaining)
    done: set[int] = set()

    for s in steps:
        missing = set(s.depends_on) - known
        if missing:
            raise ValueError(f"Step {s.step_id} depends on unknown steps {missing}")

    while remaining:
        ready = [s for s in remaining.values() if set(s.depends_on) <= done]
        if not ready:
            raise ValueError("Cycle detected in plan dependencies")
        yield ready
        for s in ready:
            done.add(s.step_id)
            del remaining[s.step_id]


async def emit(config: RunnableConfig, name: str, payload: dict) -> None:
    await adispatch_custom_event(name, payload, config=config)


async def run_step(
    step: Step,
    outputs: dict[int, str],
    failed: set[int],
    llm: ChatGroq,
    user_id: str,
    sem: asyncio.Semaphore,
    config: RunnableConfig,
) -> dict:
    """
    Execute a step.

    Params:
        - step: Step = the step to execute
        - outputs: dict[int, str] = the outputs of previous steps
        - failed: set[int] = the set of failed step IDs
        - llm: ChatGroq = the language model to use
        - user_id: str = the ID of the user executing the step
        - sem: asyncio.Semaphore = the semaphore to use for rate limiting
        - config: RunnableConfig = the configuration to use for the step

    Returns:
        - dict: the result of the step execution
    """
    sid, agent_name = step.step_id, step.agent_name
    step.evidence.id = f"#E{sid}"

    if not agent_name:
        return {"step_id": sid, "agent_name": None, "status": "skipped", "result": None}

    bad_deps = [d for d in step.depends_on if d in failed]
    if bad_deps:
        step.status = "failed"
        return {
            "step_id": sid,
            "agent_name": agent_name,
            "status": "dependency_failed",
            "result": None,
            "error": f"Dependencies failed: {bad_deps}",
        }

    task = (step.agent_input or {}).get("task")
    if not task:
        step.status = "failed"
        return {
            "step_id": sid,
            "agent_name": agent_name,
            "status": "failed",
            "result": None,
            "error": "Missing task in agent_input",
        }

    task = re.compile(r"#E(\d+)").sub(
        lambda m: outputs.get(int(m.group(1)), m.group(0)), task
    )

    async with sem:
        step.status = "running"
        await emit(
            config,
            "agent_start",
            {"step_id": sid, "agent_name": agent_name, "task": task},
        )
        logger.info("Executing agent", step_id=sid, agent_name=agent_name)

        try:
            result = None
            async for session in get_session():
                ctx = AgentContext(llm=llm, session=session, user_id=user_id)
                agents = build_agents({agent_name}, ctx)
                agent = agents.get(agent_name)

                if agent is None:
                    step.status = "failed"
                    await emit(
                        config,
                        "agent_end",
                        {"step_id": sid, "agent_name": agent_name, "status": "failed"},
                    )
                    return {
                        "step_id": sid,
                        "agent_name": agent_name,
                        "status": "unsupported",
                        "result": None,
                        "error": f"Unsupported agent: {agent_name}",
                    }

                response = await agent.ainvoke(
                    {"messages": [{"role": "user", "content": task}]}
                )
                messages = response.get("messages", [])
                if not messages:
                    raise RuntimeError("Agent returned no messages")

                last = messages[-1]
                content = last.content if isinstance(last, BaseMessage) else last
                result = str(content)

            if result is None:
                raise RuntimeError("No DB session available")

            step.status = "success"
            step.evidence.content = result
            await emit(
                config,
                "agent_end",
                {"step_id": sid, "agent_name": agent_name, "status": "success"},
            )
            return {
                "step_id": sid,
                "agent_name": agent_name,
                "status": "success",
                "result": result,
            }

        except Exception as exc:
            step.status = "failed"
            logger.exception(
                "Agent execution failed", step_id=sid, agent_name=agent_name
            )
            await emit(
                config,
                "agent_end",
                {"step_id": sid, "agent_name": agent_name, "status": "failed"},
            )
            return {
                "step_id": sid,
                "agent_name": agent_name,
                "status": "failed",
                "result": None,
                "error": str(exc),
            }


async def executor_node(state: AgentState, config: RunnableConfig) -> AgentState:
    plan = state.get("plan")

    if not plan or not plan.steps:
        logger.info("No executable plan found")
        state["tool_results"] = []
        return state

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="openai/gpt-oss-20b",
        max_tokens=2048,
        max_retries=3,
    )

    sem = asyncio.Semaphore(5)
    user_id = state.get("user_id", "")
    outputs: dict[int, str] = {}
    failed: set[int] = set()
    results: list[dict] = []

    try:
        for layer in layers(plan.steps):
            layer_results = await asyncio.gather(
                *(
                    run_step(s, outputs, failed, llm, user_id, sem, config)
                    for s in layer
                )
            )
            for r in layer_results:
                if r["status"] == "success":
                    outputs[r["step_id"]] = r["result"]
                elif r["status"] in {"failed", "unsupported", "dependency_failed"}:
                    failed.add(r["step_id"])
                results.append(r)
    except ValueError as exc:
        logger.error("Invalid plan", error=str(exc))
        results.append(
            {
                "step_id": None,
                "agent_name": None,
                "status": "failed",
                "result": None,
                "error": f"Invalid plan: {exc}",
            }
        )

    results.sort(key=lambda r: (r["step_id"] is None, r["step_id"] or 0))
    state["tool_results"] = results
    return state
