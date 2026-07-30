import urllib.request
import re
from typing import Any
from tools.base import BaseTool, tool_registry

class BrowserTool(BaseTool):
    name = "browser_automation"
    description = "Automate web browsing, inspect webpage DOM content, or extract text."
    parameters = {
        "url": "Target web page URL to open and inspect"
    }

    def run(self, url: str) -> Any:
        if not url.startswith("http"):
            url = "https://" + url
            
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                
            # Strip tags for readable DOM summary
            text = re.sub(r'<script.*?>.*?</script>', '', html, flags=re.DOTALL)
            text = re.sub(r'<style.*?>.*?</style>', '', text, flags=re.DOTALL)
            text = re.sub(r'<.*?>', ' ', text)
            clean_text = ' '.join(text.split())
            
            return f"Page loaded successfully: {url}\nTitle/Snippet: {clean_text[:400]}..."
        except Exception as e:
            return f"Browser Automation error for '{url}': {str(e)}"

tool_registry.register(BrowserTool())
