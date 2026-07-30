import re
from typing import Any, Dict, List

from memory.episodic_memory import EpisodicMemory
from memory.long_term_memory import LongTermMemory
from memory.semantic_memory import SemanticMemory
from memory.short_term_memory import ShortTermMemory
from memory.working_memory import WorkingMemory


class MemoryManager:
    """Coordinates five memory layers while isolating volatile state by session."""

    def __init__(self):
        self._working_sessions: Dict[str, WorkingMemory] = {}
        self.short_term = ShortTermMemory()
        self.long_term = LongTermMemory()
        self.semantic = SemanticMemory()
        self.episodic = EpisodicMemory()

    @property
    def working(self) -> WorkingMemory:
        """Backward-compatible access to the default session's working memory."""
        return self._working_for("default_session")

    def _working_for(self, session_id: str) -> WorkingMemory:
        normalized = self._normalize_session_id(session_id)
        if normalized not in self._working_sessions:
            self._working_sessions[normalized] = WorkingMemory()
        return self._working_sessions[normalized]

    @staticmethod
    def _normalize_session_id(session_id: str) -> str:
        safe_id = re.sub(r"[^a-zA-Z0-9_.-]", "_", session_id or "default_session")
        return safe_id[:64] or "default_session"

    def get_working_history(self, session_id: str) -> List[Dict[str, str]]:
        return self._working_for(session_id).get_history()

    def get_unified_context(self, user_query: str, session_id: str = "default_session") -> str:
        session_id = self._normalize_session_id(session_id)
        sections: List[str] = []
        working_history = self._working_for(session_id).get_history()[-6:]
        if working_history:
            formatted_history = "\n".join(
                f"- {item['role']}: {item['content'][:500]}" for item in working_history
            )
            sections.append(f"=== Working Memory (Current Session) ===\n{formatted_history}")

        long_term_summary = self.long_term.format_summary()
        if long_term_summary:
            sections.append(f"=== Long-Term Memory (Consent-Based) ===\n{long_term_summary}")

        relevant_facts = self.semantic.search_facts(user_query, top_k=3)
        if relevant_facts:
            facts = "\n".join(
                f"- [{fact['subject']}] {fact['fact']} (relevance: {fact['score']:.2f})"
                for fact in relevant_facts
            )
            sections.append(f"=== Semantic Memory ===\n{facts}")

        recent_events = self.episodic.get_recent_events(limit=3, session_id=session_id)
        if recent_events:
            events = "\n".join(f"- [{event['event_type']}] {event['summary']}" for event in recent_events)
            sections.append(f"=== Recent Episodic Events ===\n{events}")

        return "\n\n".join(sections) if sections else "No relevant memory is available."

    def store_interaction(
        self,
        session_id: str,
        user_msg: str,
        noa_msg: str,
        persist_preferences: bool = False,
    ) -> None:
        session_id = self._normalize_session_id(session_id)
        working = self._working_for(session_id)
        working.add_message("user", user_msg)
        working.add_message("assistant", noa_msg)
        self.episodic.log_event(
            session_id,
            "user_chat",
            f"User asked: '{user_msg[:80]}' -> Noa responded.",
            {"user_msg": user_msg, "noa_msg": noa_msg, "memory_consent": persist_preferences},
        )
        if persist_preferences:
            self._extract_persistent_memory(user_msg)

    def _extract_persistent_memory(self, user_msg: str) -> None:
        lower = user_msg.lower()
        name_match = re.search(r"(?:my name is|call me)\s+(.+)", user_msg, flags=re.IGNORECASE)
        if name_match:
            name = name_match.group(1).strip(" .!?")[:80]
            if name:
                self.long_term.add_preference("user_name", name)
        elif "i prefer" in lower or "my favorite" in lower:
            self.long_term.add_preference("user_preference", user_msg[:500])
        elif "my goal is" in lower or "i want to achieve" in lower:
            self.long_term.add_goal("user_goal", user_msg[:500])

    def record_plan_execution(self, session_id: str, plan: Any) -> None:
        session_id = self._normalize_session_id(session_id)
        successful_steps = sum(1 for result in plan.results if result.success)
        summary = f"Plan '{plan.goal[:80]}' finished with status {plan.status}."
        self.episodic.log_event(
            session_id,
            "plan_execution",
            summary,
            {
                "execution_id": plan.execution_id,
                "status": plan.status,
                "successful_steps": successful_steps,
                "total_steps": len(plan.results),
                "warnings": plan.warnings,
            },
        )
        self.short_term.store(
            session_id,
            "last_plan",
            {"execution_id": plan.execution_id, "goal": plan.goal, "status": plan.status},
            ttl_seconds=3600,
        )

    def clear_session(self, session_id: str) -> None:
        self._working_for(session_id).clear()

    def inspect_all(self, session_id: str = "default_session") -> Dict[str, Any]:
        session_id = self._normalize_session_id(session_id)
        working = self._working_for(session_id)
        return {
            "session_id": session_id,
            "working": {
                "turn_count": len(working.get_history()) // 2,
                "history": working.get_history(),
                "scratchpad": working.scratchpad,
            },
            "short_term": {"recent_tasks": self.short_term.get_recent_tasks(session_id)},
            "long_term": self.long_term.get_all(),
            "semantic": self.semantic.get_all(),
            "episodic": self.episodic.get_recent_events(limit=20, session_id=session_id),
        }


memory_manager = MemoryManager()
