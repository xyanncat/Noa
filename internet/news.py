from typing import List, Dict, Any
from internet.search import web_search_engine
from tools.base import BaseTool, tool_registry

class NewsModule:
    """
    Internet Module - News & Topic Monitoring Engine.
    Fetches tech news, trending topics, and creates concise summaries.
    """
    def __init__(self):
        pass

    def get_news(self, topic: str = "technology AI news") -> List[Dict[str, str]]:
        return web_search_engine.search(f"{topic} news today", max_results=5)

news_module = NewsModule()

class NewsTool(BaseTool):
    name = "check_news"
    description = "Check trending news and topic updates on any topic."
    parameters = {
        "topic": "Topic of interest (e.g. 'Artificial Intelligence', 'Space', 'Tech')"
    }

    def run(self, topic: str = "technology AI news") -> Any:
        return news_module.get_news(topic)

tool_registry.register(NewsTool())
