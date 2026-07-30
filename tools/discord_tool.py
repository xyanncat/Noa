import json
import urllib.request
from typing import Any

from tools.base import BaseTool, tool_registry


class DiscordTool(BaseTool):
    name = "discord"
    description = "Send a Discord webhook notification in a trusted, explicitly enabled deployment."
    parameters = {
        "webhook_url": "Discord webhook URL",
        "message": "Message text to broadcast to Discord",
    }
    is_sensitive = True

    def run(self, message: str, webhook_url: str = "") -> Any:
        if not webhook_url.startswith("https://"):
            return "A valid HTTPS Discord webhook URL is required."
        try:
            payload = json.dumps({"content": f"Noa AI: {message}"}).encode("utf-8")
            request = urllib.request.Request(
                webhook_url,
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(request, timeout=5) as response:
                return f"Discord notification posted (HTTP {response.status})."
        except Exception as exc:
            return f"Discord webhook request failed: {exc}"


tool_registry.register(DiscordTool())
