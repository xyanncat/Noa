from typing import Any, Dict, List

from config.settings import settings


class WorkingMemory:
    """In-memory conversation state for exactly one session."""

    def __init__(self, max_turns: int = None):
        self.max_turns = max_turns or settings.MAX_WORKING_MEMORY_TURNS
        self.history: List[Dict[str, str]] = []
        self.scratchpad: Dict[str, Any] = {}

    def add_message(self, role: str, content: str):
        self.history.append({"role": role, "content": content})
        maximum_messages = self.max_turns * 2
        if len(self.history) > maximum_messages:
            self.history = self.history[-maximum_messages:]

    def get_history(self) -> List[Dict[str, str]]:
        return list(self.history)

    def clear(self):
        self.history.clear()
        self.scratchpad.clear()

    def set_scratchpad(self, key: str, value: Any):
        self.scratchpad[key] = value

    def get_scratchpad(self, key: str, default=None) -> Any:
        return self.scratchpad.get(key, default)
