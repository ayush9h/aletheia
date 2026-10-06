import structlog
from langchain_core.callbacks.manager import adispatch_custom_event
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain_groq import ChatGroq

from app.db_service.db import get_session
from app.services.agent_state import AgentState
from app.services.agents import AgentContext, build_agents
from app.utils.config import settings

logger = structlog.get_logger(__name__)


async def executor_node(
    state: AgentState,
    config: RunnableConfig,
) -> AgentState:
    plan = state.get("plan")

    if not plan or not plan.steps:
        logger.info("No executable plan found")
        state["tool_results"] = []
        return state

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="openai/gpt-oss-20b",
        max_tokens=2048,
    )

    results = []

    required_agents = {step.agent_name for step in plan.steps if step.agent_name}

    async for session in get_session():
        ctx = AgentContext(llm=llm, session=session, user_id=state.get("user_id", ""))
        agents = build_agents(required_agents, ctx)

        for step in plan.steps:
            agent_name = step.agent_name

            if not agent_name:
                results.append(
                    {
                        "step_id": step.step_id,
                        "agent_name": None,
                        "status": "skipped",
                        "result": None,
                    }
                )
                continue

            agent = agents.get(agent_name)

            if agent is None:
                results.append(
                    {
                        "step_id": step.step_id,
                        "agent_name": agent_name,
                        "status": "unsupported",
                        "result": None,
                        "error": f"Unsupported agent: {agent_name}",
                    }
                )
                continue

            agent_input = step.agent_input or {}
            task = agent_input.get("task")

            if not task:
                results.append(
                    {
                        "step_id": step.step_id,
                        "agent_name": agent_name,
                        "status": "failed",
                        "result": None,
                        "error": "Missing task in agent_input",
                    }
                )
                continue

            step.status = "running"

            await adispatch_custom_event(
                "agent_start",
                {
                    "step_id": step.step_id,
                    "agent_name": agent_name,
                    "task": task,
                },
                config=config,
            )

            logger.info(
                "Executing agent",
                step_id=step.step_id,
                agent_name=agent_name,
            )

            try:
                response = await agent.ainvoke(
                    {
                        "messages": [
                            {
                                "role": "user",
                                "content": task,
                            }
                        ]
                    }
                )

                messages = response.get(
                    "messages",
                    [],
                )

                if not messages:
                    raise RuntimeError("Agent returned no messages")

                final_message = messages[-1]

                if isinstance(
                    final_message,
                    BaseMessage,
                ):
                    content = final_message.content
                else:
                    content = str(final_message)

                result = str(content)

                step.status = "success"
                step.evidence.content = result

                results.append(
                    {
                        "step_id": step.step_id,
                        "agent_name": agent_name,
                        "status": "success",
                        "result": result,
                    }
                )

                await adispatch_custom_event(
                    "agent_end",
                    {
                        "step_id": step.step_id,
                        "agent_name": agent_name,
                        "status": "success",
                    },
                    config=config,
                )

            except Exception as exc:
                step.status = "failed"

                logger.exception(
                    "Agent execution failed",
                    step_id=step.step_id,
                    agent_name=agent_name,
                    error=str(exc),
                )

                results.append(
                    {
                        "step_id": step.step_id,
                        "agent_name": agent_name,
                        "status": "failed",
                        "result": None,
                        "error": str(exc),
                    }
                )

                await adispatch_custom_event(
                    "agent_end",
                    {
                        "step_id": step.step_id,
                        "agent_name": agent_name,
                        "status": "failed",
                    },
                    config=config,
                )

    state["tool_results"] = results

    return state
