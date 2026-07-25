import json

from langchain_core.messages import SystemMessage
from langchain_groq import ChatGroq

from app.prompts.workflows.planner_prompt import planner_prompt_parser
from app.services.agent_state import AgentState
from app.services.tools import TOOL_REGISTRY
from app.utils.config import settings

planner_llm = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model="llama-3.3-70b-versatile",
)


async def planner_node(state: AgentState) -> AgentState:
    """
    Returns Plan Object with list of steps for an llm to take to fulfill the user query

    Input:
        - state: AgentState

    Return:
        - state: AgentState with Plan Object generated
    """

    # Load the tools
    # TODO: Instead of loading all the tools at once, load based on the query
    tools_for_prompt = [
        {
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["input_schema"],
        }
        for t in TOOL_REGISTRY.values()
    ]

    # Define the planner prompt
    planner_prompt, planner_parser = planner_prompt_parser()

    # Format the prompt
    planner_prompt = planner_prompt.format(
        query=(
            state.get("user_input")[-1].content
            if isinstance(state.get("user_input"), list)
            else ""
        ),
        tools=json.dumps(tools_for_prompt, indent=2),
    )

    # list of messages
    messages = [
        SystemMessage(content=planner_prompt),
        *state.get("user_input", ""),
    ]

    output = await planner_llm.ainvoke(messages)
    generated_plan = planner_parser.parse(output.content)  # type:ignore

    # store the generated plan in the global state
    state["plan"] = generated_plan
    return state
