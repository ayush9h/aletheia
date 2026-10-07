from typing import Any, Literal

from pydantic import BaseModel, Field


class Evidence(BaseModel):
    id: str | None = Field(
        default=None,
        description=(
            "Identifier of the evidence in the form of #E1, #E2 etc. "
            "Null before execution."
        ),
    )
    content: str | None = Field(
        default=None,
        description="Result produced by the agent during execution.",
    )


class Step(BaseModel):
    step_id: int = Field(
        description="Step number.",
    )
    plan: str = Field(
        description="Instruction describing what the agent should accomplish.",
    )
    agent_name: str | None = Field(
        default=None,
        description=(
            "Name of the specialist agent to execute, such as "
            "github_agent or web_search_agent. "
            "Null when no agent is required."
        ),
    )
    agent_input: dict[str, Any] = Field(
        default_factory=dict,
        description="Input provided to the selected specialist agent.",
    )
    evidence: Evidence = Field(
        default_factory=Evidence,
        description="Execution result produced by the agent.",
    )
    status: Literal[
        "pending",
        "running",
        "success",
        "failed",
        "pending_human_approval",
    ] = Field(
        default="pending",
        description="Current execution status of the step.",
    )

    depends_on: list[int] = Field(
        default_factory=list,
        description=(
            "step_ids that must finish before this step starts. "
            "Empty list if the step needs no other step's output."
        ),
    )

class Plan(BaseModel):
    steps: list[Step] = Field(
        description="Ordered list of execution steps for the task.",
    )
