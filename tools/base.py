from abc import ABC, abstractmethod
from typing import Any, Dict, List

from config.settings import settings


class BaseTool(ABC):
    name: str
    description: str
    parameters: Dict[str, Any]
    is_sensitive: bool = False

    @abstractmethod
    def run(self, **kwargs) -> Any:
        """Execute the tool request."""

    def is_request_safe(self, **kwargs: Any) -> bool:
        """Allow subclasses to restrict individual actions (for example file writes)."""
        return not self.is_sensitive


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def is_enabled(self, name: str, **kwargs: Any) -> bool:
        tool = self.get_tool(name)
        if not tool:
            return False
        return settings.ENABLE_UNSAFE_TOOLS or tool.is_request_safe(**kwargs)

    def is_planner_allowed(self, name: str) -> bool:
        return name in settings.SAFE_PLANNER_TOOLS and self.is_enabled(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
                "risk_level": "sensitive" if tool.is_sensitive else "standard",
                "enabled": self.is_enabled(tool.name),
                "planner_allowed": self.is_planner_allowed(tool.name),
            }
            for tool in self._tools.values()
        ]

    def execute(self, name: str, **kwargs: Any) -> Dict[str, Any]:
        tool = self.get_tool(name)
        if not tool:
            return {"success": False, "error": f"Tool '{name}' was not found."}
        if not self.is_enabled(name, **kwargs):
            return {
                "success": False,
                "error": (
                    f"Tool '{name}' is disabled by the runtime safety policy. "
                    "Set NOA_ENABLE_UNSAFE_TOOLS=true only in a trusted environment."
                ),
            }

        try:
            result = tool.run(**kwargs)
            return {"success": True, "result": result}
        except Exception as exc:
            return {"success": False, "error": f"{type(exc).__name__}: {exc}"}


tool_registry = ToolRegistry()
