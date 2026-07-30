import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  Layers,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_NOA_API_KEY || '';
const SESSION_ID = 'dashboard_session';

async function apiRequest(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (API_KEY) headers['X-API-Key'] = API_KEY;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Request failed with status ${response.status}.`);
  }
  return payload;
}

function formatDate(epochSeconds) {
  if (!epochSeconds) return 'Not scheduled';
  return new Date(epochSeconds * 1000).toLocaleString();
}

function StatusPill({ tone = 'neutral', children }) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Noa 2.0 is ready. I use validated plans, consent-based memory, provider failover, and safety-scoped tools.',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [health, setHealth] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [providers, setProviders] = useState([]);
  const [memory, setMemory] = useState(null);
  const [tools, setTools] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedTool, setSelectedTool] = useState('');
  const [toolParams, setToolParams] = useState('{}');
  const [toolOutput, setToolOutput] = useState(null);
  const [memoryLayer, setMemoryLayer] = useState('long_term');
  const [memorySubject, setMemorySubject] = useState('');
  const [memoryValue, setMemoryValue] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState('reminder');
  const [taskSchedule, setTaskSchedule] = useState('daily');
  const messagesEndRef = useRef(null);

  const configuredProviderCount = useMemo(
    () => providers.filter((provider) => provider.configured).length,
    [providers],
  );

  const refreshDashboard = async (showNotice = false) => {
    setIsRefreshing(true);
    setError('');
    try {
      const healthResult = await fetch(`${API_BASE}/health`).then(async (response) => {
        if (!response.ok) throw new Error('The API health endpoint is unavailable.');
        return response.json();
      });
      setHealth(healthResult);

      const [runtimeResult, providerResult, memoryResult, toolsResult, taskResult] = await Promise.all([
        apiRequest('/runtime'),
        apiRequest('/providers'),
        apiRequest(`/memory?session_id=${SESSION_ID}`),
        apiRequest('/tools'),
        apiRequest('/autonomous/tasks'),
      ]);
      setRuntime(runtimeResult);
      setProviders(providerResult.providers || []);
      setMemory(memoryResult);
      setTools(toolsResult || []);
      setTasks(taskResult || []);
      setSelectedTool((previous) => previous || toolsResult?.[0]?.name || '');
      if (showNotice) setNotice('Dashboard state refreshed.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const message = inputQuery.trim();
    if (!message || isLoading) return;

    setMessages((previous) => [...previous, { role: 'user', content: message }]);
    setInputQuery('');
    setIsLoading(true);
    setError('');
    try {
      const response = await apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, session_id: SESSION_ID, remember }),
      });
      setMessages((previous) => [
        ...previous,
        { role: 'assistant', content: response.response, plan: response.plan, provider: response.provider?.used },
      ]);
      setCurrentPlan(response.plan);
      const freshMemory = await apiRequest(`/memory?session_id=${SESSION_ID}`);
      setMemory(freshMemory);
    } catch (requestError) {
      setError(requestError.message);
      setMessages((previous) => [
        ...previous,
        { role: 'assistant', content: `I could not complete that request: ${requestError.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTool = async () => {
    let params;
    try {
      params = JSON.parse(toolParams || '{}');
    } catch {
      setToolOutput({ success: false, error: 'Tool parameters must be valid JSON.' });
      return;
    }
    try {
      const result = await apiRequest('/tools/execute', {
        method: 'POST',
        body: JSON.stringify({ name: selectedTool, params }),
      });
      setToolOutput(result);
    } catch (requestError) {
      setToolOutput({ success: false, error: requestError.message });
    }
  };

  const addMemory = async (event) => {
    event.preventDefault();
    if (!memorySubject.trim() || !memoryValue.trim()) return;
    try {
      await apiRequest('/memory/add', {
        method: 'POST',
        body: JSON.stringify({
          layer: memoryLayer,
          category_or_subject: memorySubject.trim(),
          key_or_fact: memoryValue.trim(),
          value: memoryValue.trim(),
        }),
      });
      setMemorySubject('');
      setMemoryValue('');
      setMemory(await apiRequest(`/memory?session_id=${SESSION_ID}`));
      setNotice('Memory entry saved.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const clearSession = async () => {
    try {
      await apiRequest(`/memory/session/${SESSION_ID}`, { method: 'DELETE' });
      setMemory(await apiRequest(`/memory?session_id=${SESSION_ID}`));
      setMessages((previous) => previous.slice(0, 1));
      setCurrentPlan(null);
      setNotice('This browser session’s working memory was cleared.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!taskName.trim()) return;
    try {
      await apiRequest('/autonomous/tasks', {
        method: 'POST',
        body: JSON.stringify({
          name: taskName.trim(),
          task_type: taskType,
          schedule: taskSchedule.trim(),
          parameters: taskType === 'news_monitor' ? { topic: taskName.trim() } : {},
        }),
      });
      setTaskName('');
      setTasks(await apiRequest('/autonomous/tasks'));
      setNotice('Autonomous task created.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateTask = async (taskId, status) => {
    try {
      await apiRequest(`/autonomous/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setTasks(await apiRequest('/autonomous/tasks'));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeTask = async (taskId) => {
    try {
      await apiRequest(`/autonomous/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((previous) => previous.filter((task) => task.id !== taskId));
      setNotice('Autonomous task removed.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const selectedToolDetails = tools.find((tool) => tool.name === selectedTool);
  const navigation = [
    ['chat', 'Command', Sparkles],
    ['providers', 'Providers', Cloud],
    ['memory', 'Memory', Brain],
    ['planner', 'Execution', Cpu],
    ['tools', 'Tools', Wrench],
    ['agents', 'Agents', Activity],
  ];

  return (
    <div className="app-shell">
      <aside className="rail">
        <div className="brand-mark" aria-label="Noa AI Engine">
          <Bot size={25} />
          <span>NOA</span>
        </div>
        <nav className="rail-nav" aria-label="Application sections">
          {navigation.map(([id, label, Icon]) => (
            <button
              className={`nav-item ${activeTab === id ? 'nav-item--active' : ''}`}
              key={id}
              onClick={() => setActiveTab(id)}
              title={label}
              type="button"
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-footer">
          <StatusPill tone={health?.status === 'online' ? 'success' : 'warning'}>
            <span className="status-dot" /> {health?.status === 'online' ? 'ONLINE' : 'OFFLINE'}
          </StatusPill>
          <button className="icon-button" onClick={() => refreshDashboard(true)} type="button" title="Refresh dashboard">
            <RefreshCw size={17} className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AUTONOMOUS OPERATIONS CONSOLE</p>
            <h1>{navigation.find(([id]) => id === activeTab)?.[1] || 'Noa'}</h1>
          </div>
          <div className="topbar-status">
            <StatusPill tone={runtime?.unsafe_tools_enabled ? 'warning' : 'success'}>
              {runtime?.unsafe_tools_enabled ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
              {runtime?.unsafe_tools_enabled ? 'Unsafe tools enabled' : 'Safety policy active'}
            </StatusPill>
            <StatusPill tone="neutral">{configuredProviderCount} providers configured</StatusPill>
          </div>
        </header>

        {(error || notice) && (
          <div className={`banner ${error ? 'banner--error' : 'banner--notice'}`} role="status">
            {error ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            <span>{error || notice}</span>
            <button type="button" onClick={() => { setError(''); setNotice(''); }} aria-label="Dismiss message">×</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <section className="command-layout">
            <div className="panel chat-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">SESSION · {SESSION_ID}</p>
                  <h2>Command stream</h2>
                </div>
                <div className="panel-heading__actions">
                  <label className="memory-toggle">
                    <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                    <span>Remember preferences</span>
                  </label>
                  <button className="quiet-button" type="button" onClick={clearSession}>Clear session</button>
                </div>
              </div>
              <div className="message-list">
                {messages.map((message, index) => (
                  <article className={`message message--${message.role}`} key={`${message.role}-${index}`}>
                    <div className="message-meta">
                      {message.role === 'assistant' ? 'NOA' : 'YOU'}
                      {message.provider && <span>via {message.provider}</span>}
                    </div>
                    <p>{message.content}</p>
                    {message.plan && (
                      <details className="inline-plan">
                        <summary>{message.plan.status} · {message.plan.steps.length} planned steps</summary>
                        <ol>
                          {message.plan.steps.map((step) => (
                            <li key={step.step_number}>
                              <code>{step.tool_name}</code> {step.description}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </article>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="command-form" onSubmit={handleSendMessage}>
                <textarea
                  value={inputQuery}
                  onChange={(event) => setInputQuery(event.target.value)}
                  placeholder="Give Noa a goal. Plans can only use approved tools."
                  rows={3}
                />
                <button className="primary-button" disabled={isLoading} type="submit">
                  {isLoading ? <RefreshCw size={17} className="spin" /> : <Send size={17} />}
                  {isLoading ? 'Executing' : 'Run request'}
                </button>
              </form>
            </div>
            <aside className="stacked-panels">
              <div className="panel compact-panel">
                <p className="eyebrow">PROVIDER MODE</p>
                <h3>{health?.provider_mode || 'Loading'}</h3>
                <p>Last response: <strong>{health?.last_provider || 'none'}</strong></p>
                <button className="quiet-button" type="button" onClick={() => setActiveTab('providers')}>Configure providers</button>
              </div>
              <div className="panel compact-panel">
                <p className="eyebrow">MEMORY CONSENT</p>
                <h3>{remember ? 'Persistence enabled' : 'Session-only'}</h3>
                <p>{remember ? 'Preference phrases may be stored in long-term memory.' : 'Conversation stays in volatile and episodic session state.'}</p>
              </div>
              <div className="panel compact-panel metric-panel">
                <div><Layers size={18} /><span>Working turns</span></div>
                <strong>{memory?.working?.turn_count ?? 0}</strong>
              </div>
            </aside>
          </section>
        )}

        {activeTab === 'providers' && (
          <section className="provider-page">
            <div className="panel provider-intro">
              <div>
                <p className="eyebrow">MULTI-PROVIDER ROUTING</p>
                <h2>Keys stay server-side.</h2>
                <p>Set provider credentials in the root <code>.env</code> using <code>.env.example</code>, then choose one provider with <code>NOA_LLM_PROVIDER</code> or use ordered <code>auto</code> failover.</p>
              </div>
              <div className="security-callout"><ShieldAlert size={20} /><span>Never put a production key in <code>VITE_*</code>; browser variables are public.</span></div>
            </div>
            <div className="provider-grid">
              {providers.map((provider) => (
                <article className="provider-card" key={provider.id}>
                  <div className="provider-card__head">
                    <Cloud size={19} />
                    <StatusPill tone={provider.configured ? 'success' : 'neutral'}>{provider.configured ? 'Configured' : 'Needs setup'}</StatusPill>
                  </div>
                  <h3>{provider.label}</h3>
                  <code>{provider.model || 'Model not configured'}</code>
                  <p>{provider.free_tier}</p>
                  <div className="provider-card__footer">
                    {provider.active && <span>Active route</span>}
                    <span>{provider.requires_api_key ? 'API key required' : 'Local / keyless'}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="panel setup-grid">
              <div><h3>OpenRouter</h3><p><code>OPENROUTER_API_KEY</code>, <code>OPENROUTER_MODEL</code></p></div>
              <div><h3>NVIDIA NIM</h3><p><code>NVIDIA_API_KEY</code> or a local <code>NVIDIA_NIM_BASE_URL</code></p></div>
              <div><h3>Cloudflare</h3><p><code>CLOUDFLARE_API_TOKEN</code>, <code>CLOUDFLARE_ACCOUNT_ID</code></p></div>
              <div><h3>NaraRouter</h3><p><code>NARA_ROUTER_API_KEY</code>, model <code>auto/bynara</code></p></div>
            </div>
          </section>
        )}

        {activeTab === 'memory' && (
          <section className="memory-page">
            <form className="panel memory-form" onSubmit={addMemory}>
              <div><p className="eyebrow">EXPLICIT MEMORY ENTRY</p><h2>Store verified context</h2></div>
              <select value={memoryLayer} onChange={(event) => setMemoryLayer(event.target.value)} aria-label="Memory layer">
                <option value="long_term">Long-term preference</option>
                <option value="semantic">Semantic fact</option>
              </select>
              <input value={memorySubject} onChange={(event) => setMemorySubject(event.target.value)} placeholder={memoryLayer === 'semantic' ? 'Subject' : 'Preference key'} />
              <input value={memoryValue} onChange={(event) => setMemoryValue(event.target.value)} placeholder="Value or fact" />
              <button className="primary-button" type="submit"><Plus size={16} /> Save</button>
            </form>
            <div className="memory-grid">
              <MemoryPanel icon={Layers} title="Working" accent="cyan" items={memory?.working?.history || []} render={(item) => <><strong>{item.role}</strong> {item.content}</>} />
              <MemoryPanel icon={Calendar} title="Short-term" accent="lime" items={memory?.short_term?.recent_tasks || []} render={(item) => <><strong>{item.key}</strong> {item.value}</>} />
              <MemoryPanel icon={Database} title="Long-term" accent="orange" items={memory?.long_term || []} render={(item) => <><strong>{item.key}</strong> {item.value}</>} />
              <MemoryPanel icon={Brain} title="Semantic" accent="pink" items={memory?.semantic || []} render={(item) => <><strong>{item.subject}</strong> {item.fact}</>} />
              <MemoryPanel icon={Activity} title="Episodic" accent="purple" items={memory?.episodic || []} render={(item) => <><strong>{item.event_type}</strong> {item.summary}</>} />
            </div>
          </section>
        )}

        {activeTab === 'planner' && (
          <section className="panel execution-page">
            <div className="panel-heading"><div><p className="eyebrow">VALIDATED EXECUTION TRACE</p><h2>Plan timeline</h2></div><StatusPill tone={currentPlan?.status === 'completed' ? 'success' : 'neutral'}>{currentPlan?.status || 'No plan'}</StatusPill></div>
            {currentPlan ? (
              <>
                <div className="goal-banner"><span>GOAL</span><h3>{currentPlan.goal}</h3><p>{currentPlan.thought}</p></div>
                {currentPlan.warnings?.length > 0 && <div className="warning-list">{currentPlan.warnings.map((warning) => <p key={warning}><AlertTriangle size={15} /> {warning}</p>)}</div>}
                <div className="timeline">
                  {currentPlan.steps.map((step) => {
                    const result = currentPlan.results?.find((item) => item.step_number === step.step_number);
                    return <article className="timeline-item" key={step.step_number}>
                      <span>{step.step_number}</span><div><code>{step.tool_name}</code><h3>{step.description}</h3>{result && <pre className={result.success ? '' : 'result-error'}>{String(result.output)}</pre>}<small>{result ? `${result.duration_ms ?? 0}ms · ${result.success ? 'succeeded' : 'failed'}` : 'awaiting execution'}</small></div>
                    </article>;
                  })}
                </div>
              </>
            ) : <EmptyState icon={Cpu} text="Submit a request from Command to inspect its validated execution plan." />}
          </section>
        )}

        {activeTab === 'tools' && (
          <section className="tools-page">
            <aside className="panel tool-list"><p className="eyebrow">REGISTERED TOOLS</p>{tools.map((tool) => <button type="button" key={tool.name} onClick={() => { setSelectedTool(tool.name); setToolOutput(null); }} className={`tool-choice ${selectedTool === tool.name ? 'tool-choice--selected' : ''}`}><span><Wrench size={15} /> {tool.name}</span><StatusPill tone={tool.enabled ? 'success' : 'neutral'}>{tool.enabled ? 'Enabled' : 'Disabled'}</StatusPill><small>{tool.planner_allowed ? 'Planner approved' : tool.risk_level}</small></button>)}</aside>
            <div className="panel tool-console">
              <div className="panel-heading"><div><p className="eyebrow">DIRECT TOOL CONSOLE</p><h2>{selectedTool || 'Choose a tool'}</h2></div>{selectedToolDetails && <StatusPill tone={selectedToolDetails.enabled ? 'success' : 'warning'}>{selectedToolDetails.enabled ? 'Available' : 'Blocked by policy'}</StatusPill>}</div>
              <p className="muted">{selectedToolDetails?.description || 'Select a registered tool to view its contract.'}</p>
              <label>Parameters (JSON)<textarea value={toolParams} onChange={(event) => setToolParams(event.target.value)} spellCheck="false" /></label>
              <button className="primary-button" onClick={executeTool} disabled={!selectedToolDetails?.enabled} type="button"><Play size={16} /> Execute safely</button>
              {toolOutput && <pre className={`tool-result ${toolOutput.success ? '' : 'result-error'}`}>{JSON.stringify(toolOutput, null, 2)}</pre>}
              {selectedToolDetails?.risk_level === 'sensitive' && <div className="security-callout"><ShieldAlert size={18} /> This tool needs <code>NOA_ENABLE_UNSAFE_TOOLS=true</code> and is never planner-approved.</div>}
            </div>
          </section>
        )}

        {activeTab === 'agents' && (
          <section className="agents-page">
            <form className="panel task-form" onSubmit={createTask}>
              <div><p className="eyebrow">PERSISTENT SCHEDULER</p><h2>Create an autonomous task</h2></div>
              <input value={taskName} onChange={(event) => setTaskName(event.target.value)} placeholder="Task name or topic" />
              <select value={taskType} onChange={(event) => setTaskType(event.target.value)}><option value="reminder">Reminder</option><option value="news_monitor">News monitor</option><option value="file_organizer">Workspace check</option></select>
              <input value={taskSchedule} onChange={(event) => setTaskSchedule(event.target.value)} placeholder="daily, hourly, every 30m, or ISO date/time" />
              <button className="primary-button" type="submit"><Plus size={16} /> Create task</button>
            </form>
            <div className="task-list">
              {tasks.map((task) => <article className="panel task-card" key={task.id}><div><p className="eyebrow">{task.task_type.replace('_', ' ')}</p><h3>{task.task_name}</h3><p>{task.cron_or_interval} · Next: {formatDate(task.next_run)}</p></div><div className="task-actions"><StatusPill tone={task.status === 'active' ? 'success' : 'neutral'}>{task.status}</StatusPill>{task.status === 'active' ? <button type="button" className="icon-button" title="Pause" onClick={() => updateTask(task.id, 'paused')}><Pause size={17} /></button> : <button type="button" className="icon-button" title="Resume" onClick={() => updateTask(task.id, 'active')}><Play size={17} /></button>}<button type="button" className="icon-button icon-button--danger" title="Delete" onClick={() => removeTask(task.id)}><Trash2 size={17} /></button></div></article>)}
              {!tasks.length && <EmptyState icon={Calendar} text="No scheduled tasks yet. The scheduler starts only while the API is running." />}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MemoryPanel({ icon: Icon, title, accent, items, render }) {
  return <article className={`panel memory-panel memory-panel--${accent}`}><div className="memory-panel__head"><Icon size={18} /><h3>{title}</h3><span>{items.length}</span></div><div className="memory-panel__items">{items.length ? items.map((item, index) => <p key={`${title}-${index}`}>{render(item)}</p>) : <p className="muted">No entries in this session.</p>}</div></article>;
}

function EmptyState({ icon: Icon, text }) {
  return <div className="empty-state"><Icon size={38} /><p>{text}</p></div>;
}
