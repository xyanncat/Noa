export type JsonObject = Record<string, unknown>;

export interface HealthStatus {
  status: 'online' | string;
  app_name: string;
  version: string;
  provider_mode: string;
  last_provider: string;
  tools_count: number;
  memory_layers: string[];
  security: {
    api_key_auth_enabled: boolean;
    unsafe_tools_enabled: boolean;
  };
}

export interface RuntimeConfiguration {
  api_key_auth_enabled: boolean;
  unsafe_tools_enabled: boolean;
  rate_limit_per_minute: number;
  cors_origins: string[];
  provider_mode: string;
  planner_safe_tools: string[];
}

export interface PlanStep {
  step_number: number;
  description: string;
  tool_name: string;
  tool_input: JsonObject;
}

export interface StepResult {
  step_number: number;
  tool_name: string;
  success: boolean;
  output: unknown;
  duration_ms: number | null;
  timestamp: number;
}

export interface PlanExecution {
  execution_id: string;
  goal: string;
  thought: string;
  steps: PlanStep[];
  results: StepResult[];
  warnings: string[];
  status: 'created' | 'executing' | 'completed' | 'completed_with_errors' | 'failed' | string;
  created_at: number;
  completed_at: number | null;
  final_response: string | null;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  remember?: boolean;
}

export interface ChatResponse {
  query: string;
  session_id: string;
  response: string;
  provider: { used: string };
  plan: PlanExecution;
}

export interface MemoryItem {
  id?: number;
  category?: string;
  key?: string;
  value?: string;
  subject?: string;
  fact?: string;
  confidence?: number;
  source?: string;
  created_at?: number;
  updated_at?: number;
  [key: string]: unknown;
}

export interface MemorySnapshot {
  session_id: string;
  working: { turn_count: number; history: Array<{ role: string; content: string }>; scratchpad: JsonObject };
  short_term: { recent_tasks: MemoryItem[] };
  long_term: MemoryItem[];
  semantic: MemoryItem[];
  episodic: MemoryItem[];
}

export interface MemoryAddRequest {
  layer: 'long_term' | 'semantic';
  category_or_subject: string;
  key_or_fact: string;
  value?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JsonObject;
  risk_level: 'standard' | 'sensitive' | string;
  enabled: boolean;
  planner_allowed: boolean;
}

export interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export type TaskType = 'reminder' | 'news_monitor' | 'file_organizer';
export type TaskStatus = 'active' | 'paused' | 'completed';

export interface TaskSchedule {
  id: number;
  task_name: string;
  task_type: TaskType;
  cron_or_interval: string;
  parameters: JsonObject;
  last_run: number | null;
  next_run: number | null;
  status: TaskStatus;
  created_at: number;
}

export interface CreateTaskRequest {
  name: string;
  task_type: TaskType;
  schedule: string;
  parameters?: JsonObject;
}

export interface ProviderStatus {
  id: string;
  label: string;
  configured: boolean;
  active: boolean;
  model: string;
  free_tier: string;
  requires_api_key: boolean;
}

export interface ProvidersResponse {
  active_mode: string;
  last_used: string;
  providers: ProviderStatus[];
}

export interface VisionAnalysisRequest {
  image_data: string;
  prompt?: string;
}

export interface VisionAnalysisResponse {
  success: boolean;
  description: string;
  prompt: string;
  detected_objects: string[];
}

export interface VoiceSynthesisResponse {
  success: boolean;
  text: string;
  voice_name: string;
  audio_format: string;
  audio_url: string;
}

export interface VoiceTranscriptionRequest {
  audio_base64: string;
  mime_type?: string;
}

export interface VoiceTranscriptionResponse {
  success: boolean;
  transcript: string;
  mime_type: string;
  transcription_mode: 'stub' | string;
}

export interface ApiErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

export type NoaSocketEvent =
  | { type: 'connection.ready'; data: { protocol_version: string; session_id: string } }
  | { type: 'chat.accepted'; request_id: string; data: { session_id: string } }
  | { type: 'plan.created'; request_id?: string; data: { plan: PlanExecution } }
  | { type: 'plan.step_started'; request_id?: string; data: { execution_id: string; step: PlanStep } }
  | { type: 'plan.step_completed'; request_id?: string; data: { execution_id: string; result: StepResult } }
  | { type: 'chat.completed'; request_id: string; data: ChatResponse }
  | { type: 'pong'; data: { timestamp: number } }
  | { type: 'error'; request_id?: string; data: { code: string; message: string; details?: unknown } };

export type NoaSocketRequest =
  | { type: 'authenticate'; api_key?: string; session_id?: string }
  | { type: 'chat.request'; request_id: string; message: string; session_id?: string; remember?: boolean }
  | { type: 'ping' };
