import json
import re
import sqlite3
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

from config.settings import settings


class Database:
    def __init__(self, db_path=None):
        self.db_path = str(db_path or settings.DB_PATH)
        self._init_db()

    def get_connection(self):
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_db(self):
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS long_term_memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    confidence REAL DEFAULT 1.0,
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS semantic_memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subject TEXT NOT NULL,
                    fact TEXT NOT NULL,
                    embedding TEXT,
                    source TEXT DEFAULT 'user_interaction',
                    created_at REAL NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS episodic_memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    details TEXT,
                    timestamp REAL NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS short_term_memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    ttl REAL,
                    created_at REAL NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS autonomous_tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_name TEXT NOT NULL,
                    task_type TEXT NOT NULL,
                    cron_or_interval TEXT NOT NULL,
                    parameters TEXT,
                    last_run REAL,
                    next_run REAL,
                    status TEXT DEFAULT 'active',
                    created_at REAL NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_episodic_session_time ON episodic_memory(session_id, timestamp DESC)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_short_term_session_key ON short_term_memory(session_id, key, created_at DESC)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status_next_run ON autonomous_tasks(status, next_run)")
            connection.commit()

    def health_check(self) -> bool:
        try:
            with self.get_connection() as connection:
                connection.execute("SELECT 1")
            return True
        except sqlite3.Error:
            return False

    # Long-term memory -------------------------------------------------
    def upsert_long_term(self, category: str, key: str, value: str, confidence: float = 1.0) -> int:
        now = time.time()
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                "SELECT id FROM long_term_memory WHERE category = ? AND key = ? ORDER BY updated_at DESC LIMIT 1",
                (category, key),
            )
            row = cursor.fetchone()
            if row:
                cursor.execute(
                    "UPDATE long_term_memory SET value = ?, confidence = ?, updated_at = ? WHERE id = ?",
                    (value, confidence, now, row["id"]),
                )
                connection.commit()
                return int(row["id"])
            cursor.execute(
                """INSERT INTO long_term_memory (category, key, value, confidence, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (category, key, value, confidence, now, now),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def insert_long_term(self, category: str, key: str, value: str, confidence: float = 1.0):
        return self.upsert_long_term(category, key, value, confidence)

    def get_long_term_memories(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.get_connection() as connection:
            cursor = connection.cursor()
            if category:
                cursor.execute("SELECT * FROM long_term_memory WHERE category = ? ORDER BY updated_at DESC", (category,))
            else:
                cursor.execute("SELECT * FROM long_term_memory ORDER BY updated_at DESC")
            return [dict(row) for row in cursor.fetchall()]

    # Semantic memory --------------------------------------------------
    def insert_semantic(self, subject: str, fact: str, embedding: Optional[List[float]] = None, source: str = "user_interaction"):
        now = time.time()
        embedding_json = json.dumps(embedding) if embedding is not None else None
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                """INSERT INTO semantic_memory (subject, fact, embedding, source, created_at)
                   VALUES (?, ?, ?, ?, ?)""",
                (subject, fact, embedding_json, source, now),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def get_all_semantic_memories(self) -> List[Dict[str, Any]]:
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM semantic_memory ORDER BY created_at DESC")
            memories = []
            for row in cursor.fetchall():
                item = dict(row)
                if item["embedding"]:
                    item["embedding"] = json.loads(item["embedding"])
                memories.append(item)
            return memories

    # Episodic memory --------------------------------------------------
    def insert_episodic(self, session_id: str, event_type: str, summary: str, details: Optional[Dict[str, Any]] = None):
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                """INSERT INTO episodic_memory (session_id, event_type, summary, details, timestamp)
                   VALUES (?, ?, ?, ?, ?)""",
                (session_id, event_type, summary, json.dumps(details) if details else None, time.time()),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def get_episodic_memories(self, limit: int = 50, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.get_connection() as connection:
            cursor = connection.cursor()
            if session_id:
                cursor.execute(
                    "SELECT * FROM episodic_memory WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?",
                    (session_id, limit),
                )
            else:
                cursor.execute("SELECT * FROM episodic_memory ORDER BY timestamp DESC LIMIT ?", (limit,))
            memories = []
            for row in cursor.fetchall():
                item = dict(row)
                if item["details"]:
                    item["details"] = json.loads(item["details"])
                memories.append(item)
            return memories

    # Short-term memory ------------------------------------------------
    def purge_expired_short_term(self, session_id: Optional[str] = None) -> int:
        query = "DELETE FROM short_term_memory WHERE ttl IS NOT NULL AND ttl < ?"
        arguments: List[Any] = [time.time()]
        if session_id:
            query += " AND session_id = ?"
            arguments.append(session_id)
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(query, arguments)
            connection.commit()
            return cursor.rowcount

    # Autonomous task scheduling --------------------------------------
    @staticmethod
    def schedule_next_run(schedule: str, now: Optional[float] = None, initial: bool = False) -> float:
        now = now or time.time()
        value = (schedule or "hourly").strip().lower()
        match = re.fullmatch(r"every\s+(\d+)\s*([mhd])", value)
        if match:
            amount, unit = int(match.group(1)), match.group(2)
            multiplier = {"m": 60, "h": 3600, "d": 86400}[unit]
            return now + amount * multiplier
        intervals = {"hourly": 3600, "daily": 86400, "weekly": 604800}
        if value in intervals:
            return now + intervals[value]
        if value in {"now", "immediate"}:
            return now
        try:
            parsed = datetime.fromisoformat(schedule.replace("Z", "+00:00"))
            timestamp = parsed.timestamp()
            return timestamp if initial else now
        except (TypeError, ValueError):
            # Preserve a predictable fallback for unrecognized legacy schedules.
            return now + 3600

    @staticmethod
    def is_one_time_schedule(schedule: str) -> bool:
        value = (schedule or "").strip().lower()
        if value in {"now", "immediate", "hourly", "daily", "weekly"} or value.startswith("every "):
            return False
        try:
            datetime.fromisoformat(schedule.replace("Z", "+00:00"))
            return True
        except (TypeError, ValueError):
            return False

    def add_autonomous_task(self, name: str, task_type: str, schedule: str, params: Optional[Dict[str, Any]] = None):
        now = time.time()
        next_run = self.schedule_next_run(schedule, now=now, initial=True)
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                """INSERT INTO autonomous_tasks
                   (task_name, task_type, cron_or_interval, parameters, next_run, status, created_at)
                   VALUES (?, ?, ?, ?, ?, 'active', ?)""",
                (name, task_type, schedule, json.dumps(params or {}), next_run, now),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def get_active_tasks(self) -> List[Dict[str, Any]]:
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM autonomous_tasks WHERE status = 'active' ORDER BY next_run ASC")
            return self._deserialize_tasks(cursor.fetchall())

    def get_all_tasks(self) -> List[Dict[str, Any]]:
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT * FROM autonomous_tasks ORDER BY created_at DESC")
            return self._deserialize_tasks(cursor.fetchall())

    def _deserialize_tasks(self, rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
        tasks = []
        for row in rows:
            item = dict(row)
            item["parameters"] = json.loads(item["parameters"]) if item.get("parameters") else {}
            tasks.append(item)
        return tasks

    def update_task_after_run(self, task: Dict[str, Any], ran_at: Optional[float] = None) -> None:
        ran_at = ran_at or time.time()
        completed = self.is_one_time_schedule(task["cron_or_interval"])
        with self.get_connection() as connection:
            cursor = connection.cursor()
            if completed:
                cursor.execute(
                    "UPDATE autonomous_tasks SET last_run = ?, status = 'completed' WHERE id = ?",
                    (ran_at, task["id"]),
                )
            else:
                cursor.execute(
                    "UPDATE autonomous_tasks SET last_run = ?, next_run = ? WHERE id = ?",
                    (ran_at, self.schedule_next_run(task["cron_or_interval"], now=ran_at), task["id"]),
                )
            connection.commit()

    def update_task_status(self, task_id: int, status: str) -> bool:
        if status not in {"active", "paused", "completed"}:
            raise ValueError("Invalid task status")
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("UPDATE autonomous_tasks SET status = ? WHERE id = ?", (status, task_id))
            connection.commit()
            return cursor.rowcount > 0

    def delete_task(self, task_id: int) -> bool:
        with self.get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("DELETE FROM autonomous_tasks WHERE id = ?", (task_id,))
            connection.commit()
            return cursor.rowcount > 0


db = Database()
