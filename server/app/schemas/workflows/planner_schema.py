from typing import Any, Literal

from pydantic import BaseModel, Field


class Evidence(BaseModel):
    id: str | None = Field(
        default=None,
        description=(
            "Identifier of the evidence in the form of #E1, #E2 etc. "
            "Null if this step does not produce any evidence."
        ),
    )
    content: str | None = Field(
        default=None,
        description="Output from the worker after running the tool, if present.",
    )


class Step(BaseModel):
    step_id: int = Field(
        description="Step number.",
    )
    plan: str = Field(
        description="Instruction for the worker to execute.",
    )
    tool_name: str | None = Field(
        default=None,
        description="Name of the tool or agent to execute. Null when no tool is required.",
    )
    tool_input: dict[str, Any] = Field(
        default_factory=dict,
        description="Input arguments for the selected tool or agent.",
    )
    evidence: Evidence = Field(
        default_factory=Evidence,
        description="Placeholder for the execution result.",
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


class Plan(BaseModel):
    steps: list[Step] = Field(
        description="Ordered list of execution steps for the task.",
    )
