import os
from pathlib import Path
from typing import Any

from config.settings import settings
from tools.base import BaseTool, tool_registry


class FileManagerTool(BaseTool):
    name = "file_manager"
    description = "List, read, write, or search files within the configured workspace."
    parameters = {
        "action": "list | read | write | search",
        "path": "Relative path to a file or directory",
        "content": "Content to write when action='write'",
        "query": "Filename search query when action='search'",
    }

    def is_request_safe(self, **kwargs: Any) -> bool:
        # Reads remain available; mutation is opt-in with unsafe tools.
        return kwargs.get("action", "list") != "write"

    def _resolve_workspace_path(self, path: str) -> Path:
        root = settings.BASE_DIR.resolve()
        target = (root / path).resolve()
        try:
            target.relative_to(root)
        except ValueError as exc:
            raise ValueError("Access outside the workspace is prohibited.") from exc
        return target

    def run(self, action: str, path: str = ".", content: str = "", query: str = "") -> Any:
        target_path = self._resolve_workspace_path(path)

        if action == "list":
            if not target_path.exists():
                return f"Path '{path}' does not exist."
            if target_path.is_file():
                return [target_path.name]
            return [
                f"{'[DIR]' if child.is_dir() else '[FILE]'} {child.name}"
                for child in sorted(target_path.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower()))
            ]

        if action == "read":
            if not target_path.is_file():
                return f"File '{path}' was not found."
            if target_path.stat().st_size > settings.MAX_TOOL_OUTPUT_CHARS * 4:
                return "File is too large to read through this tool."
            return target_path.read_text(encoding="utf-8", errors="ignore")[: settings.MAX_TOOL_OUTPUT_CHARS]

        if action == "write":
            if not settings.ENABLE_UNSAFE_TOOLS:
                return "Writing files is disabled by the safety policy."
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(content, encoding="utf-8")
            return f"Wrote {len(content)} characters to '{path}'."

        if action == "search":
            if not query.strip():
                return "A filename search query is required."
            results = []
            for root, _, files in os.walk(settings.BASE_DIR):
                for filename in files:
                    if query.lower() in filename.lower():
                        results.append(os.path.relpath(os.path.join(root, filename), settings.BASE_DIR))
            return results[:20]

        return f"Unknown action '{action}'."


tool_registry.register(FileManagerTool())
