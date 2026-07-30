import asyncio
import base64
import binascii
import hmac
import logging
import sys
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Lock
from typing import Any, Deque, Dict, List, Literal, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import Depends, FastAPI, Header, HTTPException, Request, WebSocket, WebSocketDisconnect, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError

from agents.autonomous_agent import autonomous_agent
from agents.scheduler import scheduler
from config.settings import settings
from core.orchestrator import orchestrator
from database.sqlite_db import db
from memory.manager import memory_manager
from models.llm import llm_provider
from tools.base import tool_registry
from vision.vision_engine import vision_engine
from voice.voice_engine import voice_engine

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL, logging.INFO))
logger = logging.getLogger(__name__)


class RateLimiter:
    """Small in-memory request limiter suitable for a single-process deployment."""

    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self._requests: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def enforce(self, request: Request) -> None:
        if self.requests_per_minute <= 0:
            return
        client_id = request.client.host if request.client else "unknown"
        now = time.monotonic()
        with self._lock:
            requests = self._requests[client_id]
            while requests and now - requests[0] >= 60:
                requests.popleft()
            if len(requests) >= self.requests_per_minute:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Retry in one minute.",
                )
            requests.append(now)


rate_limiter = RateLimiter(settings.RATE_LIMIT_PER_MINUTE)


def _is_api_key_valid(api_key: Optional[str]) -> bool:
    """Use the same constant-time key check for HTTP and WebSocket clients."""
    if not settings.API_AUTH_ENABLED:
        return True
    return bool(settings.API_KEY and api_key and hmac.compare_digest(api_key, settings.API_KEY))


def require_api_key(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")) -> None:
    if not settings.API_AUTH_ENABLED:
        return
    if not settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API authentication is enabled but NOA_API_KEY is not configured.",
        )
    if not _is_api_key_valid(x_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API key.")


@asynccontextmanager
async def lifespan(_: FastAPI):
    scheduler.start()
    try:
        yield
    finally:
        scheduler.stop()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Secure API for the Noa Autonomous AI Engine",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-API-Key"],
)


@app.middleware("http")
async def add_api_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Noa-Api-Version"] = settings.VERSION
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={"error": {"code": "request_error", "message": str(exc.detail)}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"code": "validation_error", "message": "Request validation failed.", "details": exc.errors()}},
    )


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=settings.MAX_REQUEST_CHARS)
    session_id: str = Field(default="default_session", min_length=1, max_length=64)
    remember: bool = False


class MemoryAddRequest(BaseModel):
    layer: Literal["long_term", "semantic"]
    category_or_subject: str = Field(min_length=1, max_length=120)
    key_or_fact: str = Field(min_length=1, max_length=2000)
    value: Optional[str] = Field(default=None, max_length=2000)


class ToolExecuteRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    params: Dict[str, Any] = Field(default_factory=dict)


class AutonomousTaskRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    task_type: Literal["reminder", "news_monitor", "file_organizer"]
    schedule: str = Field(min_length=1, max_length=80)
    parameters: Dict[str, Any] = Field(default_factory=dict)


class TaskStatusRequest(BaseModel):
    status: Literal["active", "paused", "completed"]


class VisionRequest(BaseModel):
    image_data: str = Field(min_length=1, max_length=10_000_000)
    prompt: str = Field(default="Describe this image", max_length=2000)


class VoiceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class VoiceTranscriptionRequest(BaseModel):
    audio_base64: str = Field(min_length=1, max_length=15_000_000)
    mime_type: str = Field(default="audio/m4a", max_length=100)


protected: List[Any] = [Depends(require_api_key), Depends(rate_limiter.enforce)]


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "provider_mode": settings.DEFAULT_PROVIDER,
        "last_provider": llm_provider.last_provider,
        "tools_count": len(tool_registry.list_tools()),
        "memory_layers": ["working", "short_term", "long_term", "semantic", "episodic"],
        "security": {
            "api_key_auth_enabled": settings.API_AUTH_ENABLED,
            "unsafe_tools_enabled": settings.ENABLE_UNSAFE_TOOLS,
        },
    }


@app.get("/api/ready")
def readiness_check():
    if not db.health_check():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database is unavailable.")
    return {"status": "ready", "database": "available", "scheduler_running": scheduler._running}


@app.get("/api/runtime", dependencies=protected)
def runtime_configuration():
    return {
        "api_key_auth_enabled": settings.API_AUTH_ENABLED,
        "unsafe_tools_enabled": settings.ENABLE_UNSAFE_TOOLS,
        "rate_limit_per_minute": settings.RATE_LIMIT_PER_MINUTE,
        "cors_origins": settings.CORS_ORIGINS,
        "provider_mode": settings.DEFAULT_PROVIDER,
        "planner_safe_tools": list(settings.SAFE_PLANNER_TOOLS),
    }


@app.get("/api/providers", dependencies=protected)
def list_providers():
    return {"active_mode": settings.DEFAULT_PROVIDER, "last_used": llm_provider.last_provider, "providers": llm_provider.provider_statuses()}


@app.post("/api/chat", dependencies=protected)
def chat_endpoint(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty.")
    return orchestrator.process_request(
        request.message.strip(),
        request.session_id,
        persist_preferences=request.remember,
    )


@app.websocket("/api/ws")
async def websocket_chat_endpoint(websocket: WebSocket):
    """Authenticated, event-oriented chat channel for desktop and mobile clients.

    Authentication is sent as the first WebSocket message instead of a query
    parameter so API keys do not end up in URLs, proxy logs, or deep links.
    """
    await websocket.accept()
    session_id = "default_session"
    try:
        try:
            authentication = await asyncio.wait_for(websocket.receive_json(), timeout=10)
        except TimeoutError:
            await websocket.send_json({"type": "error", "data": {"code": "auth_timeout", "message": "Authenticate within 10 seconds."}})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        if not isinstance(authentication, dict) or authentication.get("type") != "authenticate":
            await websocket.send_json({"type": "error", "data": {"code": "authentication_required", "message": "The first WebSocket message must authenticate."}})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        if settings.API_AUTH_ENABLED and not _is_api_key_valid(authentication.get("api_key")):
            await websocket.send_json({"type": "error", "data": {"code": "unauthorized", "message": "Invalid or missing API key."}})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        proposed_session = authentication.get("session_id")
        if isinstance(proposed_session, str) and proposed_session.strip():
            session_id = proposed_session[:64]
        await websocket.send_json(
            {"type": "connection.ready", "data": {"protocol_version": "1.0", "session_id": session_id}}
        )

        while True:
            incoming = await websocket.receive_json()
            if not isinstance(incoming, dict):
                await websocket.send_json({"type": "error", "data": {"code": "invalid_message", "message": "WebSocket messages must be JSON objects."}})
                continue
            if incoming.get("type") == "ping":
                await websocket.send_json({"type": "pong", "data": {"timestamp": time.time()}})
                continue
            if incoming.get("type") != "chat.request":
                await websocket.send_json({"type": "error", "data": {"code": "unknown_message", "message": "Supported messages are chat.request and ping."}})
                continue

            request_id = str(incoming.get("request_id") or uuid.uuid4().hex)[:128]
            try:
                chat_request = ChatRequest(
                    message=incoming.get("message", ""),
                    session_id=incoming.get("session_id") or session_id,
                    remember=bool(incoming.get("remember", False)),
                )
            except ValidationError as exc:
                await websocket.send_json(
                    {"type": "error", "request_id": request_id, "data": {"code": "validation_error", "message": "Chat request validation failed.", "details": exc.errors()}}
                )
                continue

            await websocket.send_json({"type": "chat.accepted", "request_id": request_id, "data": {"session_id": chat_request.session_id}})
            loop = asyncio.get_running_loop()

            def forward_event(event_type: str, data: Dict[str, Any]) -> None:
                future = asyncio.run_coroutine_threadsafe(
                    websocket.send_json({"type": event_type, "request_id": request_id, "data": data}),
                    loop,
                )
                future.result(timeout=settings.LLM_TIMEOUT_SECONDS + 15)

            try:
                response = await asyncio.to_thread(
                    orchestrator.process_request,
                    chat_request.message.strip(),
                    chat_request.session_id,
                    chat_request.remember,
                    forward_event,
                )
                await websocket.send_json({"type": "chat.completed", "request_id": request_id, "data": response})
            except Exception:
                logger.exception("WebSocket chat request failed", extra={"request_id": request_id})
                await websocket.send_json({"type": "error", "request_id": request_id, "data": {"code": "chat_failed", "message": "Noa could not complete this chat request."}})
    except WebSocketDisconnect:
        logger.info("Noa WebSocket disconnected")


@app.get("/api/memory", dependencies=protected)
def get_memory_snapshot(session_id: str = "default_session"):
    return memory_manager.inspect_all(session_id)


@app.post("/api/memory/add", dependencies=protected)
def add_memory_entry(request: MemoryAddRequest):
    if request.layer == "long_term":
        entry_id = memory_manager.long_term.add_preference(
            request.category_or_subject.strip(),
            (request.value or request.key_or_fact).strip(),
        )
    else:
        entry_id = memory_manager.semantic.add_fact(request.category_or_subject.strip(), request.key_or_fact.strip())
    return {"success": True, "entry_id": entry_id, "layer": request.layer}


@app.delete("/api/memory/session/{session_id}", dependencies=protected)
def clear_session_memory(session_id: str):
    memory_manager.clear_session(session_id)
    return {"success": True, "message": "Working memory cleared for this session."}


@app.get("/api/tools", dependencies=protected)
def list_tools():
    return tool_registry.list_tools()


@app.post("/api/tools/execute", dependencies=protected)
def execute_tool(request: ToolExecuteRequest):
    result = tool_registry.execute(request.name, **request.params)
    if not result.get("success"):
        error = result.get("error", "Tool execution failed.")
        status_code = status.HTTP_403_FORBIDDEN if "safety policy" in error else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=error)
    return result


@app.get("/api/autonomous/tasks", dependencies=protected)
def list_autonomous_tasks():
    return autonomous_agent.get_all_autonomous_jobs()


@app.post("/api/autonomous/tasks", dependencies=protected, status_code=status.HTTP_201_CREATED)
def create_autonomous_task(request: AutonomousTaskRequest):
    try:
        task_id = autonomous_agent.create_task(
            request.name,
            request.task_type,
            request.schedule,
            request.parameters,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"success": True, "task_id": task_id}


@app.patch("/api/autonomous/tasks/{task_id}", dependencies=protected)
def update_autonomous_task(task_id: int, request: TaskStatusRequest):
    if not db.update_task_status(task_id, request.status):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task was not found.")
    return {"success": True, "task_id": task_id, "status": request.status}


@app.delete("/api/autonomous/tasks/{task_id}", dependencies=protected)
def delete_autonomous_task(task_id: int):
    if not db.delete_task(task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task was not found.")
    return {"success": True, "task_id": task_id}


@app.post("/api/vision/analyze", dependencies=protected)
def analyze_image_endpoint(request: VisionRequest):
    return vision_engine.analyze_image(request.image_data, request.prompt)


@app.post("/api/voice/synthesize", dependencies=protected)
def synthesize_voice_endpoint(request: VoiceRequest):
    return voice_engine.synthesize_speech(request.text)


@app.post("/api/voice/transcribe", dependencies=protected)
def transcribe_voice_endpoint(request: VoiceTranscriptionRequest):
    try:
        audio_bytes = base64.b64decode(request.audio_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="audio_base64 must be valid base64 audio data.") from exc
    if not audio_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audio data cannot be empty.")
    return {
        "success": True,
        "transcript": voice_engine.transcribe_audio(audio_bytes),
        "mime_type": request.mime_type,
        "transcription_mode": "stub",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
