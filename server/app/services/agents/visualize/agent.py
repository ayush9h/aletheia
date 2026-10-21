from langchain.agents import create_agent

from app.prompts.orchestrator_prompt import CHART_PROMPT


def create_visualize_agent(llm):
    return create_agent(
        model=llm,
        tools=[],
        system_prompt=CHART_PROMPT,
    )
