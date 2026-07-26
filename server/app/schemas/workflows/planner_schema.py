from typing import Any, Literal

from pydantic import BaseModel, Field


class Evidence(BaseModel):
    id: str | None = Field(
        default=None,
        description=(
            "Identifier of the evidence in the form of #E1, #E2 etc. "
            "Null if this step does not produce any evidence (e.g. no tool used)."
        ),
    )
    content: str | None = Field(
        default=None,
        description="Output from the worker after running the tool if present",
    )
    tool_name: str | None = Field(
        default=None,
        description="Name of the tool to execute (must match TOOL_REGISTRY)",
    )
    tool_input: dict[str, Any] = Field(
        default_factory=dict,
        description="Inputs valid for the tool execution",
    )


class Step(BaseModel):
    step_id: int = Field(
        description="Step number",
    )
    plan: str = Field(
        description="Instruction for the worker to execute itself",
    )
    evidence: Evidence = Field(description="Placeholder for the result")
    depends_on: list[int] = Field(
        default_factory=list,
        description="List of step_ids that this step is depended on before its execution",
    )
    next_tool_call: list[str] = Field(
        default_factory=list,
        description="List of tool names to be called next if the current tool succeeds",
    )
    status: Literal[
        "pending", "running", "success", "failed", "pending_human_approval"
    ] = "pending"


class Plan(BaseModel):
    steps: list[Step] = Field(
        description="Ordered list of execution steps for the completion of the task",
    )
