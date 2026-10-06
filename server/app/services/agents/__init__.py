from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from langchain_core.language_models import BaseChatModel
from sqlalchemy.ext.asyncio import AsyncSession

from .github.agent import create_github_agent
from .web_search.agent import create_web_search_agent


@dataclass(frozen=True)
class AgentContext:
    llm: BaseChatModel
    session: AsyncSession
    user_id: str


@dataclass(frozen=True)
class AgentSpec:
    name: str
    description: str
    factory: Callable[[AgentContext], Any]


AGENT_REGISTRY: dict[str, AgentSpec] = {
    spec.name: spec
    for spec in (
        AgentSpec(
            name="github_agent",
            description=(
                "Interacts with the user's connected GitHub account. "
                "Can search repositories, inspect repositories, and work "
                "with pull requests."
            ),
            factory=lambda ctx: create_github_agent(
                llm=ctx.llm, session=ctx.session, user_id=ctx.user_id
            ),
        ),
        AgentSpec(
            name="web_search_agent",
            description=(
                "Searches the public web for current information. "
                "Can use supported search providers such as SerpAPI or Tavily. "
                "Use SerpAPI when the user asks for Google Search or SerpAPI, "
                "otherwise use Tavily. "
                "Call only one provider per query; do not call both SerpAPI "
                "and Tavily at the same time."
            ),
            factory=lambda ctx: create_web_search_agent(llm=ctx.llm),
        ),
    )
}


def build_agents(names: set[str], ctx: AgentContext) -> dict[str, Any]:
    """
    Build only the agents the plan actually needs.

    Params:
        - names: set[str] =  unique list of agents to be initialized as by the Planner
        - ctx: AgentContext = Base params for agent init

    Returns:
        - dict: initialized agents as by the Planner
    """

    return {
        name: AGENT_REGISTRY[name].factory(ctx)
        for name in names
        if name in AGENT_REGISTRY
    }


__all__ = [
    "AGENT_REGISTRY",
    "build_agents",
]
