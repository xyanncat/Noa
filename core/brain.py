from config.prompts import SYSTEM_PERSONA
from memory.manager import memory_manager
from models.llm import llm_provider
from planner.plan_models import PlanExecution
from planner.planner import autonomous_planner


class Brain:
    """Central reasoning engine that combines session context, plans, and provider output."""

    def __init__(self):
        self.persona = SYSTEM_PERSONA

    def reason_and_plan(
        self,
        user_query: str,
        session_id: str = "default_session",
        effort: str = "standard",
    ) -> PlanExecution:
        memory_context = memory_manager.get_unified_context(user_query, session_id)
        return autonomous_planner.create_plan(user_query, memory_context, effort)

    def synthesize_response(
        self,
        user_query: str,
        plan: PlanExecution,
        session_id: str,
        effort: str = "standard",
    ) -> str:
        results = "\n".join(
            f"Step {result.step_number} ({result.tool_name}, {'success' if result.success else 'failed'}): {result.output}"
            for result in plan.results
        )
        warning_text = "\n".join(f"- {warning}" for warning in plan.warnings) or "None"
        prompt = f"""User request: {user_query}

Plan goal: {plan.goal}
Plan status: {plan.status}
Execution results:
{results}

Safety or validation notes:
{warning_text}

Give a concise, helpful answer. Be transparent about failed or blocked steps and do not claim an action was completed if it was not."""
        return llm_provider.generate(
            system_prompt=self.persona,
            user_prompt=prompt,
            history=memory_manager.get_working_history(session_id),
            effort=effort,
        )


brain = Brain()
