from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate

from app.prompts.workflows.planner_prompt import planner_prompt_parser
from app.schemas.workflows.planner_schema import Plan


def test_planner_prompt_parser() -> None:
    prompt, parser = planner_prompt_parser()

    assert isinstance(prompt, PromptTemplate)
    assert isinstance(parser, PydanticOutputParser)

    assert prompt.input_variables == [
        "agents",
        "memory_context",
        "query",
    ]

    assert prompt.partial_variables["format_instructions"]

    assert "STRICT planning agent" in prompt.template
    assert "User Query:" in prompt.template
    assert "Relevant Memory:" in prompt.template
    assert "Available Agents:" in prompt.template
    assert "Do NOT execute agents." in prompt.template
    assert "Do NOT execute tools." in prompt.template

    # Confirm the parser is configured for the expected schema.
    assert parser.pydantic_object is Plan
