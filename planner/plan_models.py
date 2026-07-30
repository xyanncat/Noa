import time
import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PlanStep(BaseModel):
    step_number: int
    description: str
    tool_name: str = "none"
    tool_input: Dict[str, Any] = Field(default_factory=dict)


class StepResult(BaseModel):
    step_number: int
    tool_name: str
    success: bool
    output: Any
    duration_ms: Optional[int] = None
    timestamp: float = Field(default_factory=time.time)


class PlanExecution(BaseModel):
    execution_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    goal: str
    thought: str
    steps: List[PlanStep]
    results: List[StepResult] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    status: str = "created"  # created, executing, completed, completed_with_errors, failed
    created_at: float = Field(default_factory=time.time)
    completed_at: Optional[float] = None
    final_response: Optional[str] = None
