import urllib.request
import re
from typing import Any
from tools.base import BaseTool, tool_registry

class WebReaderModule:
    """
    Internet Module - Web Reader & Summarizer.
    Reads articles, extracts plain text, and summarizes web documentation.
    """
    def __init__(self):
        pass

    def read_and_summarize(self, url: str) -> str:
        if not url.startswith("http"):
            url = "https://" + url

        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode("utf-8", errors="ignore")

            text = re.sub(r'<script.*?>.*?</script>', '', html, flags=re.DOTALL)
            text = re.sub(r'<style.*?>.*?</style>', '', text, flags=re.DOTALL)
            text = re.sub(r'<.*?>', ' ', text)
            clean_text = ' '.join(text.split())

            snippet = clean_text[:600]
            return f"Summary of {url}:\n{snippet}..."
        except Exception as e:
            return f"Failed to fetch content from {url}: {e}"

web_reader = WebReaderModule()

class WebReaderTool(BaseTool):
    name = "read_article"
    description = "Fetch, read, and summarize online documentation or articles."
    parameters = {
        "url": "Article or webpage URL"
    }

    def run(self, url: str) -> Any:
        return web_reader.read_and_summarize(url)

tool_registry.register(WebReaderTool())
