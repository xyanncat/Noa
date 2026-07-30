from collections.abc import Callable
from typing import Any, Dict, Optional

import tools
from core.brain import brain
from memory.manager import memory_manager
from models.llm import llm_provider
from planner.plan_models import PlanExecution
from planner.planner import autonomous_planner

tools.register_default_tools()


ExecutionEventHandler = Callable[[str, Dict[str, Any]], None]


class Orchestrator:
    """End-to-end request pipeline with session-scoped memory and execution audit events."""

    def process_request(
        self,
        user_query: str,
        session_id: str = "default_session",
        persist_preferences: bool = False,
        event_handler: Optional[ExecutionEventHandler] = None,
    ) -> Dict[str, Any]:
        plan: PlanExecution = brain.reason_and_plan(user_query, session_id)
        self._emit(event_handler, "plan.created", {"plan": plan.dict()})
        executed_plan = autonomous_planner.execute_plan(plan, on_event=event_handler)
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
            "provider": {"used": llm_provider.last_provider},
            "plan": executed_plan.dict(),
        }

    @staticmethod
    def _emit(
        event_handler: Optional[ExecutionEventHandler],
        event_type: str,
        data: Dict[str, Any],
    ) -> None:
        if event_handler:
            event_handler(event_type, data)


orchestrator = Orchestrator()
