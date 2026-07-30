from typing import Any, Dict

import tools
tools.register_default_tools()

from core.brain import brain
from memory.manager import memory_manager
from planner.plan_models import PlanExecution
from planner.planner import autonomous_planner


class Orchestrator:
    """End-to-end request pipeline with session-scoped memory and execution audit events."""

    def process_request(
        self,
        user_query: str,
        session_id: str = "default_session",
        persist_preferences: bool = False,
    ) -> Dict[str, Any]:
        plan: PlanExecution = brain.reason_and_plan(user_query, session_id)
        executed_plan = autonomous_planner.execute_plan(plan)
        final_response = brain.synthesize_response(user_query, executed_plan, session_id)
        executed_plan.final_response = final_response
        memory_manager.record_plan_execution(session_id, executed_plan)
        memory_manager.store_interaction(
            session_id,
            user_query,
            final_response,
            persist_preferences=persist_preferences,
        )
        return {
            "query": user_query,
            "session_id": session_id,
            "response": final_response,
            "provider": {
                "used": getattr(__import__("models.llm", fromlist=["llm_provider"]), "llm_provider").last_provider,
            },
            "plan": executed_plan.dict(),
        }


orchestrator = Orchestrator()
