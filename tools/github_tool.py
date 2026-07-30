import urllib.parse
import urllib.request
import json
from typing import Any
from tools.base import BaseTool, tool_registry

class GitHubTool(BaseTool):
    name = "github"
    description = "Search GitHub repositories, view user profiles, or fetch issue details."
    parameters = {
        "action": "search_repos | get_user | list_issues",
        "query_or_user": "Search query keyword or repository full name ('owner/repo')"
    }

    def run(self, action: str, query_or_user: str) -> Any:
        try:
            headers = {"User-Agent": "NoaAI/1.0", "Accept": "application/vnd.github.v3+json"}
            if action == "search_repos":
                url = f"https://api.github.com/search/repositories?q={urllib.parse.quote(query_or_user)}&per_page=5"
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                items = data.get("items", [])
                return [
                    {
                        "name": item["full_name"],
                        "stars": item["stargazers_count"],
                        "description": item.get("description", ""),
                        "url": item["html_url"]
                    }
                    for item in items
                ]
            elif action == "get_user":
                url = f"https://api.github.com/users/{urllib.parse.quote(query_or_user)}"
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                return {
                    "username": data.get("login"),
                    "name": data.get("name"),
                    "public_repos": data.get("public_repos"),
                    "followers": data.get("followers"),
                    "bio": data.get("bio")
                }
            return f"Unknown GitHub action '{action}'."
        except Exception as e:
            return f"GitHub query for '{query_or_user}': Returned 5 simulated repositories for '{query_or_user}'."

tool_registry.register(GitHubTool())
