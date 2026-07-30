import contextlib
import io
import shlex
import subprocess
from pathlib import Path
from typing import Any

from config.settings import settings
from tools.base import BaseTool, tool_registry


class TerminalTool(BaseTool):
    """Opt-in terminal access for a trusted, locally controlled deployment."""

    name = "terminal"
    description = "Execute restricted local Python snippets or allowlisted commands in a trusted workspace."
    parameters = {
        "mode": "python | command",
        "code_or_command": "Python code block or a single allowlisted command line",
    }
    is_sensitive = True

    def run(self, mode: str, code_or_command: str) -> Any:
        if not settings.ENABLE_UNSAFE_TOOLS:
            return "Terminal execution is disabled by the safety policy."

        if mode == "python":
            output_buffer = io.StringIO()
            # This mode remains intentionally opt-in; it is not a sandbox.
            global_scope = {"__name__": "__main__"}
            try:
                with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(output_buffer):
                    exec(code_or_command, global_scope)
                output = output_buffer.getvalue() or "Python code completed with no output."
                return output[: settings.MAX_TOOL_OUTPUT_CHARS]
            except Exception as exc:
                return f"Python execution error: {exc}"

        if mode == "command":
            try:
                command_parts = shlex.split(code_or_command, posix=False)
                if not command_parts:
                    return "Command cannot be empty."

                executable = Path(command_parts[0]).name.lower().removesuffix(".exe")
                allowed = {item.lower().removesuffix(".exe") for item in settings.ALLOWED_TERMINAL_COMMANDS}
                if executable not in allowed:
                    return f"Command '{executable}' is not in NOA_ALLOWED_TERMINAL_COMMANDS."

                result = subprocess.run(
                    command_parts,
                    shell=False,
                    cwd=str(settings.BASE_DIR),
                    capture_output=True,
                    text=True,
                    timeout=settings.TOOL_TIMEOUT_SECONDS,
                )
                output = result.stdout
                if result.stderr:
                    output += f"\n[STDERR]\n{result.stderr}"
                if not output.strip():
                    output = f"Command finished with exit code {result.returncode}."
                return output[: settings.MAX_TOOL_OUTPUT_CHARS]
            except subprocess.TimeoutExpired:
                return f"Command timed out after {settings.TOOL_TIMEOUT_SECONDS} seconds."
            except ValueError as exc:
                return f"Command parsing error: {exc}"
            except Exception as exc:
                return f"Execution error: {exc}"

        return "Invalid mode. Use 'python' or 'command'."


tool_registry.register(TerminalTool())
