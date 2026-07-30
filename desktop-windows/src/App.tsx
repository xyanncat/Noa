import { useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { Activity, CircleDotDashed, Command, Send, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { NoaClient, NoaSocket, type NoaSocketEvent } from '@noa/api-client';

const API_BASE_URL = import.meta.env.VITE_NOA_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_KEY = import.meta.env.VITE_NOA_API_KEY || '';
const SESSION_ID = 'desktop_overlay';

export default function App() {
  const client = useMemo(() => new NoaClient({ baseUrl: API_BASE_URL, apiKey: API_KEY }), []);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('Press Alt + Space anywhere to focus Noa.');
  const [status, setStatus] = useState<'ready' | 'working' | 'offline'>('ready');
  const [trace, setTrace] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const installShortcut = async () => {
      try {
        await register('Alt+Space', async () => {
          await invoke('toggle_overlay');
          setTimeout(() => inputRef.current?.focus(), 80);
        });
      } catch {
        setTrace((items) => [...items, 'Global shortcut registration failed. Check Tauri capabilities.']);
      }
    };
    void installShortcut();
    return () => { void unregisterAll(); };
  }, []);

  const notify = async (title: string, body: string) => {
    try {
      let granted = await isPermissionGranted();
      if (!granted) granted = (await requestPermission()) === 'granted';
      if (granted) sendNotification({ title, body });
    } catch {
      // Notifications are an enhancement; the chat response remains visible.
    }
  };

  const handleSocketEvent = (event: NoaSocketEvent) => {
    if (event.type === 'plan.created') {
      setTrace(event.data.plan.steps.map((step) => `${step.step_number}. ${step.description}`));
    }
    if (event.type === 'plan.step_completed') {
      setTrace((items) => [...items, `${event.data.result.tool_name}: ${event.data.result.success ? 'done' : 'failed'}`]);
    }
    if (event.type === 'chat.completed') {
      setResponse(event.data.response);
      setStatus('ready');
      void notify('Noa completed a request', event.data.response.slice(0, 160));
    }
    if (event.type === 'error') {
      setStatus('offline');
      setResponse(event.data.message);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = query.trim();
    if (!message || status === 'working') return;
    setQuery('');
    setStatus('working');
    setTrace(['Connecting to Noa…']);
    const socket = new NoaSocket({ apiBaseUrl: API_BASE_URL, apiKey: API_KEY, sessionId: SESSION_ID });
    const unsubscribe = socket.onEvent(handleSocketEvent);
    try {
      await socket.connect();
      socket.sendChat({ requestId: crypto.randomUUID(), message, sessionId: SESSION_ID });
    } catch {
      try {
        const result = await client.chat({ message, session_id: SESSION_ID });
        setResponse(result.response);
        setTrace(result.plan.steps.map((step) => `${step.step_number}. ${step.description}`));
        setStatus('ready');
      } catch (requestError) {
        setStatus('offline');
        setResponse(requestError instanceof Error ? requestError.message : 'Noa is unavailable.');
      }
    } finally {
      window.setTimeout(() => { unsubscribe(); socket.close(); }, 90_000);
    }
  };

  return (
    <main className="overlay-shell" data-tauri-drag-region>
      <header className="overlay-header" data-tauri-drag-region>
        <div className="brand"><CircleDotDashed size={18} /> NOA</div>
        <div className={`connection connection--${status}`}>{status === 'offline' ? <WifiOff size={13} /> : <Wifi size={13} />}{status}</div>
      </header>
      <form className="query-form" onSubmit={submit} data-tauri-drag-region="false">
        <Command size={20} />
        <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask Noa anything…" autoFocus />
        <button type="submit" disabled={status === 'working'} aria-label="Send request"><Send size={17} /></button>
      </form>
      <section className="result" data-tauri-drag-region="false">
        <div className="result-meta"><ShieldCheck size={13} /> safe plan · {status === 'working' ? <><Activity size={13} /> executing</> : 'stream ready'}</div>
        <p>{response}</p>
        {trace.length > 0 && <ol>{trace.slice(-4).map((item) => <li key={item}>{item}</li>)}</ol>}
      </section>
    </main>
  );
}
