from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from langchain_core.language_models import BaseChatModel
from sqlalchemy.ext.asyncio import AsyncSession

from .github.agent import create_github_agent
from .slack.agent import create_slack_agent
from .visualize.agent import create_visualize_agent
from .web_search.agent import create_web_search_agent


@dataclass(frozen=True)
class AgentContext:
    llm: BaseChatModel
    session: AsyncSession
    user_id: str


@dataclass(frozen=True)
class AgentSpec:
    name: str
    label: str
    description: str
    factory: Callable[[AgentContext], Any]
    include_query: bool = False
    selectable: bool = True


AGENT_REGISTRY: dict[str, AgentSpec] = {
    spec.name: spec
    for spec in (
        AgentSpec(
            name="github_agent",
            label="GitHub",
            selectable=False,
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
            name="slack_agent",
            label="Slack",
            selectable=False,
            description=(
                "Interacts with the user's connected Slack workspace. "
                "Can list channels, read channel history, and search messages."
            ),
            factory=lambda ctx: create_slack_agent(
                llm=ctx.llm, session=ctx.session, user_id=ctx.user_id
            ),
        ),
        AgentSpec(
            name="web_search_agent",
            label="Web search",
            description=(
                "Searches the public web for current information. "
                "Answers questions about facts, news, prices and financial "
                "results from search results. Only lists a page's links or "
                "report files when the user explicitly gives a URL or asks "
                "for documents such as an annual report PDF."
            ),
            factory=lambda ctx: create_web_search_agent(llm=ctx.llm),
        ),
        AgentSpec(
            name="visualize_agent",
            label="Visualize data",
            description=(
                "Turns data into a chart (bar, line, area or pie). "
                "Use when the user asks to visualize, chart, plot or graph "
                "data they pasted or data returned by an earlier step."
            ),
            factory=lambda ctx: create_visualize_agent(llm=ctx.llm),
            include_query=True,
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
