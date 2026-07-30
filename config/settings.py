import os
from pathlib import Path
from typing import List, Tuple

from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


def _load_local_env(path: Path) -> None:
    """Load simple KEY=VALUE pairs without requiring a runtime dependency."""
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.removeprefix("export ").strip()
        if key:
            os.environ.setdefault(key, value.strip().strip('"').strip("'"))


_load_local_env(BASE_DIR / ".env")


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_csv(name: str, default: str) -> Tuple[str, ...]:
    value = os.getenv(name, default)
    return tuple(item.strip() for item in value.split(",") if item.strip())


class Settings(BaseModel):
    """Runtime configuration loaded from environment variables only.

    Keep credentials out of source control. Copy ``.env.example`` locally and
    export only the provider credentials you intend to use.
    """

    APP_NAME: str = os.getenv("NOA_APP_NAME", "Noa Autonomous AI Engine")
    VERSION: str = "2.0.0"
    DEBUG: bool = _env_bool("NOA_DEBUG", True)
    LOG_LEVEL: str = os.getenv("NOA_LOG_LEVEL", "INFO").upper()

    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = DATA_DIR
    DB_PATH: Path = DATA_DIR / "noa_memory.db"

    # API security. Keep auth disabled only for an explicitly local development setup.
    API_AUTH_ENABLED: bool = _env_bool("NOA_API_AUTH_ENABLED", False)
    API_KEY: str = os.getenv("NOA_API_KEY", "")
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: list(
            _env_csv("NOA_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        )
    )
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("NOA_RATE_LIMIT_PER_MINUTE", "60"))
    MAX_REQUEST_CHARS: int = int(os.getenv("NOA_MAX_REQUEST_CHARS", "12000"))

    # Tool and planner safety. Dangerous tools are opt-in and excluded from LLM plans.
    ENABLE_UNSAFE_TOOLS: bool = _env_bool("NOA_ENABLE_UNSAFE_TOOLS", False)
    ALLOWED_TERMINAL_COMMANDS: Tuple[str, ...] = _env_csv(
        "NOA_ALLOWED_TERMINAL_COMMANDS", "python,pytest,git"
    )
    TOOL_TIMEOUT_SECONDS: int = int(os.getenv("NOA_TOOL_TIMEOUT_SECONDS", "15"))
    MAX_TOOL_OUTPUT_CHARS: int = int(os.getenv("NOA_MAX_TOOL_OUTPUT_CHARS", "12000"))
    SAFE_PLANNER_TOOLS: Tuple[str, ...] = _env_csv(
        "NOA_SAFE_PLANNER_TOOLS", "web_search,read_article,weather,check_news,github"
    )

    # Memory and execution limits.
    MAX_WORKING_MEMORY_TURNS: int = int(os.getenv("NOA_MAX_WORKING_MEMORY_TURNS", "20"))
    SEMANTIC_SEARCH_TOP_K: int = int(os.getenv("NOA_SEMANTIC_SEARCH_TOP_K", "5"))
    VECTOR_DIM: int = int(os.getenv("NOA_VECTOR_DIM", "384"))
    MAX_PLAN_STEPS: int = int(os.getenv("NOA_MAX_PLAN_STEPS", "6"))
    AUTO_EXECUTE_TOOLS: bool = _env_bool("NOA_AUTO_EXECUTE_TOOLS", True)

    # Provider selection. `auto` tries configured providers in this order then local fallback.
    DEFAULT_PROVIDER: str = os.getenv("NOA_LLM_PROVIDER", "auto").strip().lower()
    PROVIDER_FALLBACK_ORDER: Tuple[str, ...] = _env_csv(
        "NOA_PROVIDER_FALLBACK_ORDER",
        "ollama,nara_router,openrouter,nvidia_nim,cloudflare,gemini,openai",
    )
    LLM_TIMEOUT_SECONDS: int = int(os.getenv("NOA_LLM_TIMEOUT_SECONDS", "45"))
    LLM_TEMPERATURE: float = float(os.getenv("NOA_LLM_TEMPERATURE", "0.3"))
    LLM_MAX_TOKENS: int = int(os.getenv("NOA_LLM_MAX_TOKENS", "1200"))

    # Google Gemini.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # OpenAI.
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

    # Local Ollama is the no-key / free local option.
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")

    # OpenRouter supports OpenAI-compatible chat completions.
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openrouter/free")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    OPENROUTER_SITE_URL: str = os.getenv("OPENROUTER_SITE_URL", "")
    OPENROUTER_APP_NAME: str = os.getenv("OPENROUTER_APP_NAME", "Noa AI Engine")

    # NVIDIA NIM can target a hosted endpoint or a local/self-hosted NIM server.
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    NVIDIA_NIM_MODEL: str = os.getenv("NVIDIA_NIM_MODEL", "meta/llama-3.1-8b-instruct")
    NVIDIA_NIM_BASE_URL: str = os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")

    # Cloudflare Workers AI / AI Gateway OpenAI-compatible endpoint.
    CLOUDFLARE_API_TOKEN: str = os.getenv("CLOUDFLARE_API_TOKEN", "")
    CLOUDFLARE_ACCOUNT_ID: str = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    CLOUDFLARE_MODEL: str = os.getenv("CLOUDFLARE_MODEL", "@cf/meta/llama-3.1-8b-instruct")
    CLOUDFLARE_BASE_URL: str = os.getenv("CLOUDFLARE_BASE_URL", "")

    # NaraRouter is an OpenAI-compatible router. A custom endpoint covers similar providers.
    NARA_ROUTER_API_KEY: str = os.getenv("NARA_ROUTER_API_KEY", "")
    NARA_ROUTER_MODEL: str = os.getenv("NARA_ROUTER_MODEL", "auto/bynara")
    NARA_ROUTER_BASE_URL: str = os.getenv("NARA_ROUTER_BASE_URL", "https://router.bynara.id/v1")
    CUSTOM_OPENAI_API_KEY: str = os.getenv("CUSTOM_OPENAI_API_KEY", "")
    CUSTOM_OPENAI_MODEL: str = os.getenv("CUSTOM_OPENAI_MODEL", "")
    CUSTOM_OPENAI_BASE_URL: str = os.getenv("CUSTOM_OPENAI_BASE_URL", "")

    ENABLE_VOICE: bool = _env_bool("NOA_ENABLE_VOICE", True)
    ENABLE_VISION: bool = _env_bool("NOA_ENABLE_VISION", True)

    def cloudflare_endpoint(self) -> str:
        """Return a configured Cloudflare OpenAI-compatible base URL."""
        if self.CLOUDFLARE_BASE_URL:
            return self.CLOUDFLARE_BASE_URL.rstrip("/")
        if not self.CLOUDFLARE_ACCOUNT_ID:
            return ""
        return f"https://api.cloudflare.com/client/v4/accounts/{self.CLOUDFLARE_ACCOUNT_ID}/ai/v1"


settings = Settings()
