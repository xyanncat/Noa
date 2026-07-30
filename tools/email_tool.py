from typing import Any

from memory.manager import memory_manager
from tools.base import BaseTool, tool_registry


class EmailTool(BaseTool):
    name = "email"
    description = "Record a drafted or simulated email action for a trusted, configured integration."
    parameters = {
        "recipient": "Email address of recipient",
        "subject": "Email subject line",
        "body": "Email content body text",
    }
    is_sensitive = True

    def run(self, recipient: str, subject: str, body: str) -> Any:
        memory_manager.episodic.log_event(
            session_id="system",
            event_type="email_simulated",
            summary=f"Email action requested for {recipient} with subject '{subject}'",
            details={"recipient": recipient, "subject": subject, "body": body},
        )
        return f"Email action recorded for {recipient}. Configure a trusted mail provider before sending externally."


tool_registry.register(EmailTool())
