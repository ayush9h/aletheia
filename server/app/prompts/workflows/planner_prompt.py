from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate

from app.schemas.workflows.planner_schema import Plan


def planner_prompt_parser():
    """
    Planner Prompt setup
    """
    parser = PydanticOutputParser(pydantic_object=Plan)
    prompt = PromptTemplate(
        template="""
You are a **STRICT** planning agent in a ReWOO system.
Your job is **ONLY** to generate a structured execution plan.

User Query:
{query}

Available Tools:
{tools}

Rules:
- Use ONLY the tools listed above
- Use exact tool names
- Fill tool_input strictly as per schema
- Do NOT hallucinate tools and follow the tools description, it is their **ROLE**
- Evidence content must be empty
- Minimize steps
- Respect dependencies and carefully the `depends_on` parameter in the tool definition, if it is None, then it can be executed then depends_on = [] else fill the list with the depends_on based on the depends_on parameter defined in the tool
- If a tool is called, check the `next_tool_call` parameters. If it is not None, then call the tool, else do not call the tool

CRITICAL OUTPUT RULE:
- You must ALWAYS return a single valid JSON object matching the schema below.
- NEVER return plain text, apologies, questions, or refusals.
- NEVER say you lack information — if the query is ambiguous, still return a valid
  JSON plan with a single step that best addresses the query as-is, or a step that
  uses a "no-op"/direct-answer approach if no tool clearly applies.
- Output ONLY the JSON object. No preamble, no markdown fences, no commentary.

{format_instructions}
""",
        input_variables=["query", "tools"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    return prompt, parser
