from langchain.agents import create_agent
from langchain.agents.middleware import ModelFallbackMiddleware

from app.prompts.orchestrator_prompt import CHART_PROMPT
from app.services.gemini import gemini_llm


def create_visualize_agent(llm):
    return create_agent(
        model=llm,
        tools=[],
        middleware=[ModelFallbackMiddleware(gemini_llm(max_tokens=2048))],
        system_prompt=CHART_PROMPT,
    )
