from typing import Any, Dict
import time
from tools.base import BaseTool, tool_registry
from database.sqlite_db import db

class CalendarTool(BaseTool):
    name = "calendar"
    description = "Schedule events, set reminders, and view calendar entries."
    parameters = {
        "action": "create | list | delete",
        "title": "Title of event/reminder",
        "datetime_str": "Date/time string (e.g. '2026-08-01 10:00')",
        "event_id": "Event ID for deletion"
    }

    def run(self, action: str, title: str = "", datetime_str: str = "", event_id: int = 0) -> Any:
        if action == "create":
            task_id = db.add_autonomous_task(
                name=title,
                task_type="reminder",
                schedule=datetime_str or "one-time",
                params={"datetime": datetime_str}
            )
            return f"Scheduled event '{title}' for {datetime_str or 'now'} (Event ID: {task_id})."

        elif action == "list":
            tasks = db.get_active_tasks()
            reminders = [t for t in tasks if t["task_type"] == "reminder"]
            if not reminders:
                return "No upcoming calendar events found."
            return [
                f"ID {r['id']}: {r['task_name']} at {r['parameters'].get('datetime', 'scheduled')}"
                for r in reminders
            ]

        return f"Unknown action '{action}'."

tool_registry.register(CalendarTool())
