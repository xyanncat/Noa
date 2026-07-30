import json
import time
from typing import Any, Dict, List

from database.sqlite_db import db


class ShortTermMemory:
    """Database-backed temporary state, isolated by session and TTL."""

    def store(self, session_id: str, key: str, value: Any, ttl_seconds: float = 3600):
        value_string = value if isinstance(value, str) else json.dumps(value, default=str)
        now = time.time()
        expires_at = now + ttl_seconds if ttl_seconds else None
        with db.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                """INSERT INTO short_term_memory (session_id, key, value, ttl, created_at)
                   VALUES (?, ?, ?, ?, ?)""",
                (session_id, key, value_string, expires_at, now),
            )
            connection.commit()

    def get(self, session_id: str, key: str) -> str | None:
        db.purge_expired_short_term(session_id)
        with db.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                """SELECT value FROM short_term_memory
                   WHERE session_id = ? AND key = ? ORDER BY created_at DESC LIMIT 1""",
                (session_id, key),
            )
            row = cursor.fetchone()
            return row["value"] if row else None

    def get_recent_tasks(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        db.purge_expired_short_term(session_id)
        with db.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                """SELECT * FROM short_term_memory
                   WHERE session_id = ? ORDER BY created_at DESC LIMIT ?""",
                (session_id, limit),
            )
            return [dict(row) for row in cursor.fetchall()]
