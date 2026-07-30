import json
import logging
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from config.settings import settings

logger = logging.getLogger(__name__)


class ProviderRequestError(RuntimeError):
    """A configured provider rejected or could not complete a request."""


@dataclass(frozen=True)
class ProviderSpec:
    name: str
    label: str
    model: str
    base_url: str
    api_key: str
    free_tier: str
    kind: str = "openai_compatible"

    @property
    def configured(self) -> bool:
        if self.kind == "ollama":
            return os.getenv("NOA_ENABLE_OLLAMA", "false").lower() in {"1", "true", "yes", "on"}
        if self.name == "nvidia_nim" and self.base_url.startswith(("http://localhost", "http://127.0.0.1")):
            return bool(self.model)
        return bool(self.api_key and self.model and self.base_url)


class LLMProvider:
    """Provider-agnostic LLM client with safe, observable fallbacks.

    Most hosted providers in this project expose the OpenAI Chat Completions
    contract, so they share a single validated HTTP implementation. Provider
    status intentionally never exposes API keys.
    """

    def __init__(self):
        self.last_provider = "local_fallback"
        self.last_error: Optional[str] = None

    def _specs(self) -> Dict[str, ProviderSpec]:
        return {
            "openai": ProviderSpec(
                "openai", "OpenAI", settings.OPENAI_MODEL, settings.OPENAI_BASE_URL,
                settings.OPENAI_API_KEY, "Paid API key", "openai_compatible",
            ),
            "openrouter": ProviderSpec(
                "openrouter", "OpenRouter", settings.OPENROUTER_MODEL, settings.OPENROUTER_BASE_URL,
                settings.OPENROUTER_API_KEY, "Provider-managed free-model routing is available", "openai_compatible",
            ),
            "nvidia_nim": ProviderSpec(
                "nvidia_nim", "NVIDIA NIM", settings.NVIDIA_NIM_MODEL, settings.NVIDIA_NIM_BASE_URL,
                settings.NVIDIA_API_KEY, "Self-hosted NIM can run locally; hosted access uses an API key", "openai_compatible",
            ),
            "cloudflare": ProviderSpec(
                "cloudflare", "Cloudflare Workers AI", settings.CLOUDFLARE_MODEL, settings.cloudflare_endpoint(),
                settings.CLOUDFLARE_API_TOKEN, "Cloudflare account plan / Workers AI allocation", "openai_compatible",
            ),
            "nara_router": ProviderSpec(
                "nara_router", "NaraRouter", settings.NARA_ROUTER_MODEL, settings.NARA_ROUTER_BASE_URL,
                settings.NARA_ROUTER_API_KEY, "NaraRouter free tier is provider-managed", "openai_compatible",
            ),
            "custom_openai": ProviderSpec(
                "custom_openai", "Custom OpenAI-compatible endpoint", settings.CUSTOM_OPENAI_MODEL,
                settings.CUSTOM_OPENAI_BASE_URL, settings.CUSTOM_OPENAI_API_KEY, "Depends on the configured provider", "openai_compatible",
            ),
            "ollama": ProviderSpec(
                "ollama", "Ollama (local)", settings.OLLAMA_MODEL, settings.OLLAMA_HOST,
                "", "Local models do not require an API key", "ollama",
            ),
        }

    def provider_statuses(self) -> List[Dict[str, Any]]:
        active = settings.DEFAULT_PROVIDER
        result = []
        for spec in self._specs().values():
            result.append(
                {
                    "id": spec.name,
                    "label": spec.label,
                    "configured": spec.configured,
                    "active": active == spec.name or (active == "auto" and spec.configured),
                    "model": spec.model,
                    "free_tier": spec.free_tier,
                    "requires_api_key": spec.name not in {"ollama"} and not (
                        spec.name == "nvidia_nim" and spec.base_url.startswith(("http://localhost", "http://127.0.0.1"))
                    ),
                }
            )
        result.insert(
            0,
            {
                "id": "gemini",
                "label": "Google Gemini",
                "configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_MODEL),
                "active": active == "gemini" or (active == "auto" and bool(settings.GEMINI_API_KEY)),
                "model": settings.GEMINI_MODEL,
                "free_tier": "Provider-managed free tier may be available",
                "requires_api_key": True,
            },
        )
        return result

    @staticmethod
    def normalize_effort(effort: str) -> str:
        normalized = effort.strip().lower() if isinstance(effort, str) else ""
        return normalized if normalized in {"low", "standard", "high"} else "standard"

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        effort: str = "standard",
    ) -> str:
        effort = self.normalize_effort(effort)
        effort_instruction = {
            "low": "Favor direct solutions and concise explanations. Do not skip safety checks or required validation.",
            "standard": "Use balanced planning, checking relevant constraints and providing enough detail to act.",
            "high": "Use thorough planning: assess relevant requirements, constraints, risks, and alternatives before answering. Include useful supporting detail without revealing private reasoning.",
        }[effort]
        scoped_system_prompt = f"{system_prompt}\n\nConversation effort: {effort}. {effort_instruction}"
        self.last_error = None
        candidates = self._candidate_providers()
        for provider_name in candidates:
            try:
                response = self._call_provider(provider_name, scoped_system_prompt, user_prompt, history or [])
                self.last_provider = provider_name
                return response
            except ProviderRequestError as exc:
                self.last_error = f"{provider_name}: {exc}"
                logger.warning("LLM provider failed; trying fallback", extra={"provider": provider_name})

        self.last_provider = "local_fallback"
        return self._local_reasoning_fallback(scoped_system_prompt, user_prompt, history)

    def _candidate_providers(self) -> List[str]:
        requested = settings.DEFAULT_PROVIDER
        known = set(self._specs()) | {"gemini"}
        if requested != "auto":
            return [requested] if requested in known else []

        candidates: List[str] = []
        for name in settings.PROVIDER_FALLBACK_ORDER:
            if name == "gemini":
                configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_MODEL)
            else:
                spec = self._specs().get(name)
                configured = bool(spec and spec.configured)
            if configured:
                candidates.append(name)
        return candidates

    def _call_provider(
        self,
        provider_name: str,
        system_prompt: str,
        user_prompt: str,
        history: List[Dict[str, str]],
    ) -> str:
        if provider_name == "gemini":
            return self._call_gemini(system_prompt, user_prompt, history)
        spec = self._specs().get(provider_name)
        if not spec:
            raise ProviderRequestError("unknown provider")
        if not spec.configured:
            raise ProviderRequestError("provider is not configured")
        if spec.kind == "ollama":
            return self._call_ollama(system_prompt, user_prompt, history)
        return self._call_openai_compatible(spec, system_prompt, user_prompt, history)

    def _call_openai_compatible(
        self,
        spec: ProviderSpec,
        system_prompt: str,
        user_prompt: str,
        history: List[Dict[str, str]],
    ) -> str:
        base_url = spec.base_url.rstrip("/")
        url = base_url if base_url.endswith("/chat/completions") else f"{base_url}/chat/completions"
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(
            {"role": item.get("role", "user"), "content": item.get("content", "")} for item in history[-12:]
        )
        messages.append({"role": "user", "content": user_prompt})
        headers = {"Content-Type": "application/json", "User-Agent": "Noa-AI-Engine/2.0"}
        if spec.api_key:
            headers["Authorization"] = f"Bearer {spec.api_key}"
        if spec.name == "openrouter":
            if settings.OPENROUTER_SITE_URL:
                headers["HTTP-Referer"] = settings.OPENROUTER_SITE_URL
            headers["X-Title"] = settings.OPENROUTER_APP_NAME

        data = {
            "model": spec.model,
            "messages": messages,
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_TOKENS,
        }
        payload = self._post_json(url, data, headers)
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderRequestError("response did not include choices[0].message.content") from exc
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part) for part in content
            )
        if not isinstance(content, str) or not content.strip():
            raise ProviderRequestError("provider returned an empty response")
        return content

    def _call_gemini(self, system_prompt: str, user_prompt: str, history: List[Dict[str, str]]) -> str:
        if not settings.GEMINI_API_KEY:
            raise ProviderRequestError("GEMINI_API_KEY is missing")
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        )
        contents = [{"role": "user", "parts": [{"text": system_prompt}]}]
        for item in history[-12:]:
            role = "model" if item.get("role") == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": item.get("content", "")} ]})
        contents.append({"role": "user", "parts": [{"text": user_prompt}]})
        payload = self._post_json(url, {"contents": contents}, {"Content-Type": "application/json"})
        try:
            return payload["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderRequestError("Gemini response did not include generated text") from exc

    def _call_ollama(self, system_prompt: str, user_prompt: str, history: List[Dict[str, str]]) -> str:
        prompt_lines = [f"System: {system_prompt}"]
        for item in history[-12:]:
            prompt_lines.append(f"{item.get('role', 'user').title()}: {item.get('content', '')}")
        prompt_lines.append(f"User: {user_prompt}")
        payload = self._post_json(
            f"{settings.OLLAMA_HOST.rstrip('/')}/api/generate",
            {"model": settings.OLLAMA_MODEL, "prompt": "\n".join(prompt_lines), "stream": False},
            {"Content-Type": "application/json"},
        )
        response = payload.get("response")
        if not isinstance(response, str) or not response.strip():
            raise ProviderRequestError("Ollama returned an empty response")
        return response

    def _post_json(self, url: str, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=settings.LLM_TIMEOUT_SECONDS) as response:
                decoded = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            raise ProviderRequestError(f"HTTP {exc.code}: {detail}") from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise ProviderRequestError(str(exc)) from exc
        except json.JSONDecodeError as exc:
            raise ProviderRequestError("provider returned invalid JSON") from exc
        if not isinstance(decoded, dict):
            raise ProviderRequestError("provider returned a non-object response")
        return decoded

    def _local_reasoning_fallback(
        self,
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[Dict[str, str]]],
    ) -> str:
        """Offline, deterministic fallback for setup and degraded-mode operation."""
        lower = user_prompt.lower()
        if "json plan" in system_prompt.lower() or "planning engine" in user_prompt.lower():
            request = user_prompt.split("User Request:", 1)[-1].split("Relevant Context", 1)[0].strip()
            steps: List[Dict[str, Any]] = []
            if "weather" in request.lower():
                steps.append({"step_number": 1, "description": "Retrieve the requested weather information.", "tool_name": "weather", "tool_input": {"location": "the requested location"}})
            elif any(word in request.lower() for word in ("news", "search", "find", "latest")):
                steps.append({"step_number": 1, "description": "Search current public sources.", "tool_name": "web_search", "tool_input": {"query": request}})
            else:
                steps.append({"step_number": 1, "description": "Analyze the request and provide a direct answer.", "tool_name": "none", "tool_input": {}})
            return json.dumps({"goal": request[:300], "thought": "Used the local fallback planner.", "steps": steps})
        return (
            "No external LLM provider is currently available. Configure a provider in .env "
            "or enable a local Ollama instance; the request was recorded in session memory."
        )


llm_provider = LLMProvider()
