import logging
import threading
from typing import Any, Callable, Dict

from database.sqlite_db import db

logger = logging.getLogger(__name__)


class Scheduler:
    """Single-process task scheduler for persistent reminders and monitoring jobs."""

    def __init__(self):
        self._running = False
        self._thread: threading.Thread | None = None
        self._wake_event = threading.Event()
        self.handlers: Dict[str, Callable[[Dict[str, Any]], None]] = {}

    def register_handler(self, task_type: str, handler: Callable[[Dict[str, Any]], None]):
        self.handlers[task_type] = handler

    def start(self):
        if self._running:
            return
        self._running = True
        self._wake_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True, name="noa-scheduler")
        self._thread.start()
        logger.info("Noa scheduler started")

    def stop(self):
        if not self._running:
            return
        self._running = False
        self._wake_event.set()
        if self._thread and self._thread.is_alive() and self._thread is not threading.current_thread():
            self._thread.join(timeout=2)
        self._thread = None
        logger.info("Noa scheduler stopped")

    def _loop(self):
        while self._running:
            try:
                self._run_due_tasks()
            except Exception:
                logger.exception("Scheduler loop failed")
            self._wake_event.wait(timeout=5)

    def _run_due_tasks(self):
        import time

        now = time.time()
        for task in db.get_active_tasks():
            if now < float(task.get("next_run") or 0):
                continue
            handler = self.handlers.get(task["task_type"])
            if not handler:
                logger.warning("No handler registered for autonomous task", extra={"task_type": task["task_type"]})
                db.update_task_after_run(task, now)
                continue
            try:
                handler(task)
            except Exception:
                logger.exception("Autonomous task failed", extra={"task_id": task["id"], "task_type": task["task_type"]})
            finally:
                # Advance failed tasks as well to avoid a tight repeated-failure loop.
                db.update_task_after_run(task, now)


scheduler = Scheduler()
