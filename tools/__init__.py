from tools.base import BaseTool, tool_registry


_registered = False


def register_default_tools() -> None:
    """Load built-in tools after the registry is available.

    Internet tools import ``tools.base`` themselves, so importing them while
    this package initializes would create a circular import for API entry
    points that load an internet module first.
    """
    global _registered
    if _registered:
        return

    from tools.file_manager import FileManagerTool
    from tools.terminal import TerminalTool
    from tools.weather import WeatherTool
    from tools.calendar_tool import CalendarTool
    from tools.email_tool import EmailTool
    from tools.github_tool import GitHubTool
    from tools.discord_tool import DiscordTool
    from tools.drive_tool import GoogleDriveTool
    from tools.browser_tool import BrowserTool
    from internet.search import WebSearchTool
    from internet.web_reader import WebReaderTool
    from internet.news import NewsTool

    _registered = True


__all__ = ["tool_registry", "BaseTool", "register_default_tools"]
