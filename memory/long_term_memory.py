from typing import Any, Dict, List, Optional

from database.sqlite_db import db


class LongTermMemory:
    """Persistent preferences, goals, and project context."""

    def add_preference(self, key: str, value: str, confidence: float = 1.0) -> int:
        return db.upsert_long_term("preference", key, value, confidence)

    def add_goal(self, key: str, value: str, confidence: float = 1.0) -> int:
        return db.upsert_long_term("goal", key, value, confidence)

    def add_project(self, key: str, value: str, confidence: float = 1.0) -> int:
        return db.upsert_long_term("project", key, value, confidence)

    def get_all(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        return db.get_long_term_memories(category)

    def format_summary(self, limit: int = 20) -> str:
        memories = self.get_all()[:limit]
        if not memories:
            return "No long-term memories recorded yet."
        return "\n".join(f"- [{memory['category'].upper()}] {memory['key']}: {memory['value']}" for memory in memories)
