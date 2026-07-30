import type { NoaSocketEvent, NoaSocketRequest } from './types.js';

export interface WebSocketLike {
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

export interface NoaSocketConfig {
  apiBaseUrl: string;
  apiKey?: string;
  sessionId?: string;
  webSocketFactory?: WebSocketFactory;
}

export class NoaSocket {
  private readonly config: NoaSocketConfig;
  private readonly listeners = new Set<(event: NoaSocketEvent) => void>();
  private socket?: WebSocketLike;

  constructor(config: NoaSocketConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    if (this.socket?.readyState === 1) return Promise.resolve();
    const factory = this.config.webSocketFactory ?? ((url: string) => new WebSocket(url));
    const url = deriveWebSocketUrl(this.config.apiBaseUrl);

    return new Promise((resolve, reject) => {
      const socket = factory(url);
      this.socket = socket;
      socket.onopen = () => {
        this.send({ type: 'authenticate', api_key: this.config.apiKey, session_id: this.config.sessionId });
        resolve();
      };
      socket.onmessage = (event) => {
        try {
          this.publish(JSON.parse(event.data) as NoaSocketEvent);
        } catch {
          this.publish({ type: 'error', data: { code: 'invalid_event', message: 'Noa sent an invalid WebSocket event.' } });
        }
      };
      socket.onerror = () => reject(new Error('Noa WebSocket connection failed.'));
      socket.onclose = (event) => {
        if (event.code !== 1000 && event.code !== 1005) {
          this.publish({ type: 'error', data: { code: 'socket_closed', message: event.reason || `Socket closed (${event.code}).` } });
        }
      };
    });
  }

  onEvent(listener: (event: NoaSocketEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  sendChat(input: { requestId: string; message: string; sessionId?: string; remember?: boolean }): void {
    this.send({
      type: 'chat.request',
      request_id: input.requestId,
      message: input.message,
      session_id: input.sessionId ?? this.config.sessionId,
      remember: input.remember,
    });
  }

  ping(): void { this.send({ type: 'ping' }); }
  close(): void { this.socket?.close(1000, 'Client closed connection'); }

  private send(message: NoaSocketRequest): void {
    if (!this.socket || this.socket.readyState !== 1) {
      throw new Error('Noa WebSocket is not connected.');
    }
    this.socket.send(JSON.stringify(message));
  }

  private publish(event: NoaSocketEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}

export function deriveWebSocketUrl(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}/ws`;
  url.search = '';
  url.hash = '';
  return url.toString();
}
