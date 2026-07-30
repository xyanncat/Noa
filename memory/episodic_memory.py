from typing import Any, Dict, List, Optional

from database.sqlite_db import db


class EpisodicMemory:
    """Temporal event traces, tool executions, and interaction summaries."""

    def log_event(
        self,
        session_id: str,
        event_type: str,
        summary: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> int:
        return db.insert_episodic(session_id, event_type, summary, details)

    def get_recent_events(self, limit: int = 20, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return db.get_episodic_memories(limit=limit, session_id=session_id)
