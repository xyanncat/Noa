import type {
  ApiErrorEnvelope,
  ChatRequest,
  ChatResponse,
  CreateTaskRequest,
  HealthStatus,
  MemoryAddRequest,
  MemorySnapshot,
  ProvidersResponse,
  RuntimeConfiguration,
  TaskSchedule,
  TaskStatus,
  ToolDefinition,
  ToolExecutionResult,
  VisionAnalysisRequest,
  VisionAnalysisResponse,
  VoiceSynthesisResponse,
  VoiceTranscriptionRequest,
  VoiceTranscriptionResponse,
} from './types.js';

export class NoaApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'NoaApiError';
    this.status = status;
    this.details = details;
  }
}

export interface NoaClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class NoaClient {
  readonly baseUrl: string;
  readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: NoaClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 60_000;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  health(): Promise<HealthStatus> { return this.request<HealthStatus>('/health'); }
  readiness(): Promise<{ status: string; database: string; scheduler_running: boolean }> { return this.request('/ready'); }
  runtime(): Promise<RuntimeConfiguration> { return this.request('/runtime'); }
  providers(): Promise<ProvidersResponse> { return this.request('/providers'); }

  chat(input: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', { method: 'POST', body: input });
  }

  memory(sessionId = 'default_session'): Promise<MemorySnapshot> {
    return this.request<MemorySnapshot>(`/memory?session_id=${encodeURIComponent(sessionId)}`);
  }

  addMemory(input: MemoryAddRequest): Promise<{ success: boolean; entry_id: number; layer: string }> {
    return this.request('/memory/add', { method: 'POST', body: input });
  }

  clearSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/memory/session/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  }

  tools(): Promise<ToolDefinition[]> { return this.request('/tools'); }

  executeTool(name: string, params: Record<string, unknown>): Promise<ToolExecutionResult> {
    return this.request('/tools/execute', { method: 'POST', body: { name, params } });
  }

  tasks(): Promise<TaskSchedule[]> { return this.request('/autonomous/tasks'); }

  createTask(input: CreateTaskRequest): Promise<{ success: boolean; task_id: number }> {
    return this.request('/autonomous/tasks', { method: 'POST', body: input });
  }

  updateTask(taskId: number, status: TaskStatus): Promise<{ success: boolean; task_id: number; status: TaskStatus }> {
    return this.request(`/autonomous/tasks/${taskId}`, { method: 'PATCH', body: { status } });
  }

  deleteTask(taskId: number): Promise<{ success: boolean; task_id: number }> {
    return this.request(`/autonomous/tasks/${taskId}`, { method: 'DELETE' });
  }

  analyzeImage(input: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
    return this.request('/vision/analyze', { method: 'POST', body: input });
  }

  synthesizeSpeech(text: string): Promise<VoiceSynthesisResponse> {
    return this.request('/voice/synthesize', { method: 'POST', body: { text } });
  }

  transcribeAudio(input: VoiceTranscriptionRequest): Promise<VoiceTranscriptionResponse> {
    return this.request('/voice/transcribe', { method: 'POST', body: input });
  }

  async request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const controller = typeof AbortController === 'undefined' ? undefined : new AbortController();
    const timeout = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : undefined;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller?.signal,
      });
      const contentType = response.headers.get('content-type') ?? '';
      const payload: unknown = contentType.includes('application/json') ? await response.json() : undefined;
      if (!response.ok) {
        const apiError = payload as Partial<ApiErrorEnvelope> | undefined;
        throw new NoaApiError(
          apiError?.error?.message ?? `Noa API request failed with HTTP ${response.status}.`,
          response.status,
          apiError?.error?.details,
        );
      }
      return payload as T;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
