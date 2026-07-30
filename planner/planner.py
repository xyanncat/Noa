import json
import time
from collections.abc import Callable
from typing import Any, Dict, List, Optional

from config.prompts import PLANNING_PROMPT_TEMPLATE
from config.settings import settings
from models.llm import llm_provider
from planner.plan_models import PlanExecution, PlanStep, StepResult
from tools.base import tool_registry


PlanEventHandler = Callable[[str, Dict[str, Any]], None]


class AutonomousPlanner:
    """Create validated, safety-scoped plans and execute their approved tool calls."""

    def create_plan(self, user_request: str, memory_context: str) -> PlanExecution:
        tools_info = [tool for tool in tool_registry.list_tools() if tool["planner_allowed"]]
        tools_desc = "\n".join(
            f"- {tool['name']}: {tool['description']} (params: {tool['parameters']})" for tool in tools_info
        ) or "- No external tools are available; use tool_name 'none'."
        response_text = llm_provider.generate(
            system_prompt=(
                "You are a precise autonomous planner. Return only valid JSON matching the plan schema. "
                "Use only the listed tools. Keep 'thought' to a short, non-sensitive planning rationale."
            ),
            user_prompt=PLANNING_PROMPT_TEMPLATE.format(
                user_request=user_request,
                context=memory_context,
                tools_description=tools_desc,
            ),
        )

        try:
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1
            if start_idx < 0 or end_idx <= start_idx:
                raise ValueError("provider response did not contain a JSON object")
            data = json.loads(response_text[start_idx:end_idx])
            return self._validated_plan(data, user_request)
        except (TypeError, ValueError, json.JSONDecodeError) as exc:
            return self._fallback_plan(user_request, f"Planner response was not usable: {exc}")

    def _validated_plan(self, data: Dict[str, Any], user_request: str) -> PlanExecution:
        warnings: List[str] = []
        steps: List[PlanStep] = []
        raw_steps = data.get("steps", [])
        if not isinstance(raw_steps, list):
            raw_steps = []
            warnings.append("Planner returned an invalid steps value; using a reasoning-only response.")

        for raw_step in raw_steps[: settings.MAX_PLAN_STEPS]:
            if not isinstance(raw_step, dict):
                warnings.append("Ignored a malformed plan step.")
                continue
            requested_tool = str(raw_step.get("tool_name", "none"))
            if requested_tool != "none" and not tool_registry.is_planner_allowed(requested_tool):
                warnings.append(f"Blocked unapproved planner tool '{requested_tool}'.")
                requested_tool = "none"
            tool_input = raw_step.get("tool_input", {})
            if not isinstance(tool_input, dict):
                warnings.append(f"Ignored invalid input for step {len(steps) + 1}.")
                tool_input = {}
            steps.append(
                PlanStep(
                    step_number=len(steps) + 1,
                    description=str(raw_step.get("description", "Analyze this part of the request."))[:500],
                    tool_name=requested_tool,
                    tool_input=tool_input,
                )
            )

        if not steps:
            steps = [PlanStep(step_number=1, description="Synthesize a direct response.", tool_name="none")]

        return PlanExecution(
            goal=str(data.get("goal", f"Fulfill user request: {user_request}"))[:500],
            thought=str(data.get("thought", "Created a safety-scoped execution plan."))[:500],
            steps=steps,
            warnings=warnings,
        )

    def _fallback_plan(self, user_request: str, warning: str) -> PlanExecution:
        return PlanExecution(
            goal=user_request[:500],
            thought="Used a direct, reasoning-only fallback plan.",
            steps=[PlanStep(step_number=1, description="Formulate a helpful direct response.", tool_name="none")],
            warnings=[warning],
        )

    def execute_plan(
        self,
        plan: PlanExecution,
        on_event: Optional[PlanEventHandler] = None,
    ) -> PlanExecution:
        plan.status = "executing"
        failures = 0
        for step in plan.steps:
            started = time.perf_counter()
            if on_event:
                on_event(
                    "plan.step_started",
                    {"execution_id": plan.execution_id, "step": step.dict()},
                )
            if step.tool_name == "none":
                result = StepResult(
                    step_number=step.step_number,
                    tool_name="none",
                    success=True,
                    output=f"Reasoning completed: {step.description}",
                    duration_ms=round((time.perf_counter() - started) * 1000),
                )
            elif not settings.AUTO_EXECUTE_TOOLS:
                result = StepResult(
                    step_number=step.step_number,
                    tool_name=step.tool_name,
                    success=False,
                    output="Automatic tool execution is disabled by configuration.",
                    duration_ms=round((time.perf_counter() - started) * 1000),
                )
                failures += 1
            else:
                response = tool_registry.execute(step.tool_name, **step.tool_input)
                succeeded = bool(response.get("success"))
                if not succeeded:
                    failures += 1
                result = StepResult(
                    step_number=step.step_number,
                    tool_name=step.tool_name,
                    success=succeeded,
                    output=response.get("result", response.get("error", "Tool failed.")),
                    duration_ms=round((time.perf_counter() - started) * 1000),
                )
            plan.results.append(result)
            if on_event:
                on_event(
                    "plan.step_completed",
                    {"execution_id": plan.execution_id, "result": result.dict()},
                )

        plan.completed_at = time.time()
        plan.status = "completed" if failures == 0 else "completed_with_errors"
        return plan


autonomous_planner = AutonomousPlanner()
