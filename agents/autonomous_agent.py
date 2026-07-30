from typing import Any, Dict, List

from agents.scheduler import scheduler
from database.sqlite_db import db
from internet.news import news_module
from memory.manager import memory_manager


class AutonomousAgent:
    """Background-capable agent for reminders, monitored topics, and workspace checks."""

    VALID_TASK_TYPES = {"reminder", "news_monitor", "file_organizer"}

    def __init__(self):
        self._setup_handlers()

    def _setup_handlers(self):
        scheduler.register_handler("reminder", self._handle_reminder)
        scheduler.register_handler("news_monitor", self._handle_news_monitor)
        scheduler.register_handler("file_organizer", self._handle_file_organizer)

    def _handle_reminder(self, task: Dict[str, Any]):
        memory_manager.episodic.log_event(
            "agent_session",
            "reminder_alert",
            f"Reminder triggered: '{task['task_name']}'",
            task,
        )

    def _handle_news_monitor(self, task: Dict[str, Any]):
        topic = task.get("parameters", {}).get("topic", task["task_name"])
        news = news_module.get_news(topic)
        summary = f"News monitor updated for '{topic}': found {len(news)} updates."
        memory_manager.semantic.add_fact(f"news_monitor:{topic}", summary, source="autonomous_agent")
        memory_manager.episodic.log_event("agent_session", "news_digest", summary, {"news": news})

    def _handle_file_organizer(self, task: Dict[str, Any]):
        memory_manager.episodic.log_event(
            "agent_session",
            "file_organizer",
            "File organizer check completed without modifying workspace files.",
            task,
        )

    def create_task(self, name: str, task_type: str, schedule: str, parameters: Dict[str, Any] | None = None) -> int:
        if task_type not in self.VALID_TASK_TYPES:
            raise ValueError(f"Unsupported task type '{task_type}'.")
        if not name.strip() or not schedule.strip():
            raise ValueError("Task name and schedule are required.")
        return db.add_autonomous_task(name.strip(), task_type, schedule.strip(), parameters or {})

    def create_reminder(self, title: str, schedule: str) -> int:
        return self.create_task(title, "reminder", schedule, {"datetime": schedule})

    def create_topic_monitor(self, topic: str, schedule: str = "daily") -> int:
        return self.create_task(f"Monitor: {topic}", "news_monitor", schedule, {"topic": topic})

    def get_all_autonomous_jobs(self) -> List[Dict[str, Any]]:
        return db.get_all_tasks()


autonomous_agent = AutonomousAgent()
