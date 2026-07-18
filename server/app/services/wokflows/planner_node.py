"""
Implementation of the planner agent node
"""

from langchain_core.messages import SystemMessage

from config.llm import planner_llm
from prompts.planner import planner_prompt_parser
from schemas.agent_schema import AgentState

from langchain_groq import ChatGroq

planner_llm = MemoryManager(
    llm_client=ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="llama-3.3-70b-versatile",
    )
)



async def planner_node(state: AgentState) -> AgentState:

    tools_for_prompt = [
        {
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["input_schema"],
            "depends_on": t["depends_on"],
            "next_tool_call": t["next_tool"],
        }
        for t in TOOL_REGISTRY.values()
    ]

    planner_prompt, planner_parser = planner_prompt_parser()

    planner_prompt = planner_prompt.format(
        query=state.get("query")[-1].content,
        tools=tools_for_prompt,
    )

    messages = [
        SystemMessage(content=planner_prompt),
        *state.get("query", ""),
    ]

    output = await planner_llm.ainvoke(messages)
    generated_plan = planner_parser.parse(output.content)  # type:ignore

    state["plan"] = generated_plan
    return state
