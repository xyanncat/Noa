import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Compass,
  Cpu,
  Database,
  Download,
  Menu,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_NOA_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_NOA_API_KEY;
const SESSION_ID = 'web_console';

const navigation = [
  { id: 'chat', label: 'Command', icon: Compass, hint: 'Give Noa a goal' },
  { id: 'memory', label: 'Memory', icon: Brain, hint: 'Inspect & save context' },
  { id: 'planner', label: 'Planner', icon: Cpu, hint: 'Review execution plans' },
  { id: 'tools', label: 'Tools', icon: Wrench, hint: 'Run a registered tool' },
  { id: 'tasks', label: 'Tasks', icon: Activity, hint: 'Schedule safe automation' },
];

const quickPrompts = [
  { label: 'Plan my work', prompt: 'Create a concise prioritized plan for my work today.' },
  { label: 'Research a topic', prompt: 'Research the latest practical developments in autonomous AI agents.' },
  { label: 'Review memory', prompt: 'Summarize the long-term goals and preferences you know about me.' },
];

function getErrorMessage(payload, fallback) {
  if (typeof payload === 'string') return payload;
  return payload?.error?.message || payload?.detail || payload?.message || fallback;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (API_KEY) headers.set('X-API-Key', API_KEY);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(getErrorMessage(payload, `Request failed (${response.status})`));
  return payload;
}

function shortText(value, fallback = 'No details available.') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function formatTime(value) {
  if (!value) return 'Not scheduled';
  const timestamp = typeof value === 'number' ? value * 1000 : value;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function MemoryCard({ title, eyebrow, entries, renderEntry }) {
  return (
    <section className="memory-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <span className="count-badge">{entries.length}</span>
      </div>
      {entries.length ? (
        <div className="memory-list">
          {entries.slice(0, 8).map((entry, index) => <div className="memory-row" key={`${title}-${index}`}>{renderEntry(entry)}</div>)}
        </div>
      ) : <p className="empty-copy">No entries yet.</p>}
    </section>
  );
}

function EmptyState({ icon: Icon, title, copy, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [effort, setEffort] = useState('standard');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [health, setHealth] = useState(null);
  const [memory, setMemory] = useState(null);
  const [tools, setTools] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selectedTool, setSelectedTool] = useState('');
  const [toolParams, setToolParams] = useState('{\n  \n}');
  const [toolOutput, setToolOutput] = useState(null);
  const [toolBusy, setToolBusy] = useState(false);
  const [memoryLayer, setMemoryLayer] = useState('long_term');
  const [memorySubject, setMemorySubject] = useState('');
  const [memoryFact, setMemoryFact] = useState('');
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState('reminder');
  const [taskSchedule, setTaskSchedule] = useState('daily');
  const [taskBusy, setTaskBusy] = useState(false);
  const messagesEndRef = useRef(null);

  const notify = (message, tone = 'success') => setNotice({ message, tone });

  const refreshWorkspace = async ({ silent = false } = {}) => {
    if (!silent) setIsRefreshing(true);
    const results = await Promise.allSettled([
      request('/health'),
      request(`/memory?session_id=${SESSION_ID}`),
      request('/tools'),
      request('/autonomous/tasks'),
    ]);
    const [healthResult, memoryResult, toolsResult, tasksResult] = results;
    if (healthResult.status === 'fulfilled') setHealth(healthResult.value);
    if (memoryResult.status === 'fulfilled') setMemory(memoryResult.value);
    if (toolsResult.status === 'fulfilled') {
      setTools(toolsResult.value);
      setSelectedTool((current) => current || toolsResult.value[0]?.name || '');
    }
    if (tasksResult.status === 'fulfilled') setTasks(tasksResult.value);
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length && !silent) notify('Some live data could not be loaded. Start the API on port 8000 and try again.', 'error');
    setIsRefreshing(false);
  };

  useEffect(() => { void refreshWorkspace(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, isSending]);

  const openTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    setNotice(null);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentPlan(null);
    setPrompt('');
    openTab('chat');
  };

  const sendMessage = async (draft = prompt) => {
    const message = draft.trim();
    if (!message || isSending) return;
    setMessages((items) => [...items, { id: `user-${Date.now()}`, role: 'user', content: message }]);
    setPrompt('');
    setIsSending(true);
    setNotice(null);
    try {
      const response = await request('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, session_id: SESSION_ID, effort }),
      });
      setMessages((items) => [...items, { id: response.plan?.execution_id || `noa-${Date.now()}`, role: 'assistant', content: response.response, plan: response.plan }]);
      setCurrentPlan(response.plan || null);
      void refreshWorkspace({ silent: true });
    } catch (error) {
      setMessages((items) => [...items, { id: `error-${Date.now()}`, role: 'assistant', content: error.message || 'Noa could not complete this request.', error: true }]);
      notify(error.message || 'Noa could not complete this request.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const saveMemory = async (event) => {
    event.preventDefault();
    if (!memorySubject.trim() || !memoryFact.trim()) {
      notify('Add both a subject and a value before saving memory.', 'error');
      return;
    }
    setMemoryBusy(true);
    try {
      await request('/memory/add', {
        method: 'POST',
        body: JSON.stringify({
          layer: memoryLayer,
          category_or_subject: memorySubject.trim(),
          key_or_fact: memoryFact.trim(),
          value: memoryFact.trim(),
        }),
      });
      setMemorySubject('');
      setMemoryFact('');
      notify('Memory saved to Noa.');
      const snapshot = await request(`/memory?session_id=${SESSION_ID}`);
      setMemory(snapshot);
    } catch (error) {
      notify(error.message || 'Memory could not be saved.', 'error');
    } finally {
      setMemoryBusy(false);
    }
  };

  const executeTool = async () => {
    if (!selectedTool) return notify('Choose a registered tool first.', 'error');
    let params;
    try {
      params = JSON.parse(toolParams || '{}');
    } catch {
      notify('Tool parameters must be valid JSON.', 'error');
      return;
    }
    if (!params || Array.isArray(params) || typeof params !== 'object') {
      notify('Tool parameters must be a JSON object.', 'error');
      return;
    }
    setToolBusy(true);
    setToolOutput(null);
    try {
      const result = await request('/tools/execute', { method: 'POST', body: JSON.stringify({ name: selectedTool, params }) });
      setToolOutput(result);
      notify(`${selectedTool} completed.`);
    } catch (error) {
      setToolOutput({ success: false, error: error.message });
      notify(error.message || 'Tool execution failed.', 'error');
    } finally {
      setToolBusy(false);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!taskName.trim()) return notify('Name the task before scheduling it.', 'error');
    setTaskBusy(true);
    try {
      await request('/autonomous/tasks', {
        method: 'POST',
        body: JSON.stringify({ name: taskName.trim(), task_type: taskType, schedule: taskSchedule.trim() || 'daily', parameters: {} }),
      });
      setTaskName('');
      notify('Task scheduled.');
      setTasks(await request('/autonomous/tasks'));
    } catch (error) {
      notify(error.message || 'Task could not be created.', 'error');
    } finally {
      setTaskBusy(false);
    }
  };

  const updateTask = async (task, status) => {
    try {
      await request(`/autonomous/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setTasks(await request('/autonomous/tasks'));
      notify(`Task ${status}.`);
    } catch (error) {
      notify(error.message || 'Task status could not be updated.', 'error');
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete “${task.task_name}”? This cannot be undone.`)) return;
    try {
      await request(`/autonomous/tasks/${task.id}`, { method: 'DELETE' });
      setTasks(await request('/autonomous/tasks'));
      notify('Task deleted.');
    } catch (error) {
      notify(error.message || 'Task could not be deleted.', 'error');
    }
  };

  const exportConversation = () => {
    if (!messages.length) return notify('Start a conversation before exporting it.', 'error');
    const transcript = ['NOA CONVERSATION', `Exported ${new Date().toLocaleString()}`, ''].concat(messages.map((message) => `${message.role === 'user' ? 'YOU' : 'NOA'}\n${message.content}`)).join('\n\n');
    const url = URL.createObjectURL(new Blob([transcript], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `noa-conversation-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Conversation exported.');
  };

  const visibleNavigation = navigation.filter((item) => item.label.toLowerCase().includes(filter.toLowerCase()));
  const recentPrompts = messages.filter((message) => message.role === 'user').slice(-4).reverse();
  const memoryHistory = Array.isArray(memory?.working?.history) ? memory.working.history : [];
  const shortTerm = Array.isArray(memory?.short_term?.recent_tasks) ? memory.short_term.recent_tasks : [];
  const longTerm = Array.isArray(memory?.long_term) ? memory.long_term : [];
  const semantic = Array.isArray(memory?.semantic) ? memory.semantic : [];
  const episodic = Array.isArray(memory?.episodic) ? memory.episodic : [];

  return (
    <div className="app-frame">
      {sidebarOpen && <button className="drawer-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Workspace navigation">
        <div className="brand-row">
          <button type="button" className="brand" onClick={startNewChat} aria-label="Start a new chat">
            <span className="brand-mark"><Sparkles size={16} /></span>
            <span><strong>Noa</strong><small>AI operations</small></span>
          </button>
          <button type="button" className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <button type="button" className="new-chat" onClick={startNewChat}><Plus size={17} />New command</button>
        <label className="nav-search"><Search size={15} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Find a workspace" aria-label="Find a workspace" /><kbd>/</kbd></label>

        <nav className="primary-nav">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} type="button" className={activeTab === item.id ? 'nav-item active' : 'nav-item'} onClick={() => openTab(item.id)}><Icon size={17} /><span>{item.label}</span><small>{item.hint}</small></button>;
          })}
          {!visibleNavigation.length && <p className="empty-nav">No workspace found.</p>}
        </nav>

        <div className="sidebar-history">
          <div className="sidebar-label"><span>Recent commands</span><Terminal size={14} /></div>
          {recentPrompts.length ? recentPrompts.map((item) => <button className="history-item" type="button" key={item.id} onClick={() => { setPrompt(item.content); openTab('chat'); }}>{item.content}</button>) : <p>Commands you send will appear here.</p>}
        </div>

        <div className="connection-card">
          <span className={health?.status === 'online' ? 'connection-dot online' : 'connection-dot'} />
          <div><strong>{health?.status === 'online' ? 'Core connected' : 'Core status unknown'}</strong><small>{health?.provider_mode ? `${health.provider_mode} provider` : 'Refresh to retry'}</small></div>
          <button type="button" className="icon-button" onClick={() => void refreshWorkspace()} disabled={isRefreshing} aria-label="Refresh core status"><RefreshCw size={15} className={isRefreshing ? 'spin' : ''} /></button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button type="button" className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <div><p className="eyebrow">NOA CORE <span>•</span> {health?.version || 'LOCAL'}</p><h1>{navigation.find((item) => item.id === activeTab)?.label}</h1></div>
          </div>
          <div className="topbar-actions">
            <button type="button" className="status-button" onClick={() => void refreshWorkspace()} disabled={isRefreshing}><span className={health?.status === 'online' ? 'status-dot online' : 'status-dot'} />{isRefreshing ? 'Checking' : health?.status === 'online' ? 'Online' : 'Offline'}<ChevronDown size={14} /></button>
            <button type="button" className="secondary-button export-button" onClick={exportConversation}><Download size={15} />Export</button>
          </div>
        </header>

        {notice && <div className={`notice ${notice.tone}`} role="status"><CheckCircle2 size={17} /><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={15} /></button></div>}

        <div className="workspace-body">
          {activeTab === 'chat' && <section className="chat-view">
            {!messages.length ? <div className="chat-welcome"><div className="welcome-orb"><Bot size={34} /></div><p className="eyebrow">AUTONOMOUS WORKSPACE</p><h2>Turn intent into<br /><em>executed work.</em></h2><p>Noa plans safe steps, calls connected tools, and retains the context you explicitly choose to save.</p><div className="quick-prompts">{quickPrompts.map((item) => <button key={item.label} type="button" onClick={() => void sendMessage(item.prompt)}><Sparkles size={15} /><span><strong>{item.label}</strong><small>{item.prompt}</small></span><Send size={14} /></button>)}</div></div> : <div className="message-stream" aria-live="polite">{messages.map((message) => <article className={`message ${message.role} ${message.error ? 'error' : ''}`} key={message.id}><div className="message-avatar">{message.role === 'user' ? 'YOU' : <Bot size={17} />}</div><div className="message-copy"><p className="message-label">{message.role === 'user' ? 'Your command' : message.error ? 'Connection issue' : 'Noa response'}</p><p>{message.content}</p>{message.plan?.goal && <div className="message-plan"><Cpu size={14} /><span>Plan created: {message.plan.goal}</span></div>}</div></article>)}{isSending && <article className="message assistant pending"><div className="message-avatar"><Bot size={17} /></div><div className="typing"><i /><i /><i /><span>Planning a safe response…</span></div></article>}<div ref={messagesEndRef} /></div>}

            <div className="composer-wrap">
              <div className="composer">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Describe the outcome you want…"
                  rows={3}
                  disabled={isSending}
                  aria-label="Message Noa"
                />
                <div className="composer-footer">
                  <fieldset className="effort-selector">
                    <legend>Conversation effort</legend>
                    <div className="effort-options">
                      {['low', 'standard', 'high'].map((level) => (
                        <label className={effort === level ? 'is-selected' : ''} key={level} title={`${level === 'standard' ? 'Standard' : level[0].toUpperCase() + level.slice(1)} conversation effort`}>
                          <input type="radio" name="conversation-effort" value={level} checked={effort === level} onChange={(event) => setEffort(event.target.value)} disabled={isSending} />
                          <span>{level === 'standard' ? 'Standard' : level[0].toUpperCase() + level.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="composer-actions">
                    <span className="key-hint">↵ Send</span>
                    <button type="button" className="send-button" onClick={() => void sendMessage()} disabled={!prompt.trim() || isSending} aria-label="Send command"><Send size={17} /></button>
                  </div>
                </div>
              </div>
              <p className="composer-note">Conversation effort controls planning and response depth. Noa still follows your local safety policy.</p>
            </div>
          </section>}

          {activeTab === 'memory' && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">CONTEXT CONTROL</p><h2>Five-layer memory</h2><p>Review what Noa retains and add only deliberate, durable context.</p></div><button type="button" className="secondary-button" onClick={() => void refreshWorkspace()}><RefreshCw size={15} />Refresh memory</button></div><form className="memory-form" onSubmit={saveMemory}><div className="form-heading"><Database size={18} /><div><strong>Save explicit memory</strong><span>Stored facts and preferences are separate from the conversation stream.</span></div></div><label><span>Memory layer</span><select value={memoryLayer} onChange={(event) => setMemoryLayer(event.target.value)}><option value="long_term">Long-term preference</option><option value="semantic">Semantic fact</option></select></label><label><span>{memoryLayer === 'semantic' ? 'Subject' : 'Category'}</span><input value={memorySubject} onChange={(event) => setMemorySubject(event.target.value)} placeholder="e.g. communication_style" maxLength={120} /></label><label className="form-wide"><span>{memoryLayer === 'semantic' ? 'Verified fact' : 'Preference value'}</span><input value={memoryFact} onChange={(event) => setMemoryFact(event.target.value)} placeholder="e.g. Prefers concise, structured updates" maxLength={2000} /></label><button className="primary-button" type="submit" disabled={memoryBusy}>{memoryBusy ? 'Saving…' : 'Save memory'}</button></form><div className="memory-grid"><MemoryCard eyebrow="LAYER 1" title="Working" entries={memoryHistory} renderEntry={(item) => <><strong>{shortText(item.role, 'message')}</strong><span>{shortText(item.content)}</span></>} /><MemoryCard eyebrow="LAYER 2" title="Short-term" entries={shortTerm} renderEntry={(item) => <><strong>{shortText(item.key)}</strong><span>{shortText(item.value)}</span></>} /><MemoryCard eyebrow="LAYER 3" title="Long-term" entries={longTerm} renderEntry={(item) => <><strong>{shortText(item.category)} · {shortText(item.key)}</strong><span>{shortText(item.value)}</span></>} /><MemoryCard eyebrow="LAYER 4" title="Semantic" entries={semantic} renderEntry={(item) => <><strong>{shortText(item.subject)}</strong><span>{shortText(item.fact)}</span></>} /><MemoryCard eyebrow="LAYER 5" title="Episodic" entries={episodic} renderEntry={(item) => <><strong>{shortText(item.event_type)}</strong><span>{shortText(item.summary)}</span></>} /></div></section>}

          {activeTab === 'planner' && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">EXECUTION TRACE</p><h2>Planner</h2><p>Every request is decomposed before Noa takes a tool action.</p></div><button type="button" className="secondary-button" onClick={() => openTab('chat')}><Compass size={15} />New command</button></div>{currentPlan ? <div className="plan-card"><div className="plan-card-header"><div><span className="plan-status">{currentPlan.status || 'ready'}</span><h3>{currentPlan.goal || 'Untitled goal'}</h3><p>{currentPlan.thought || 'No additional planner reasoning was returned.'}</p></div><Cpu size={26} /></div><div className="plan-steps">{(currentPlan.steps || []).map((step, index) => <div className="plan-step" key={step.step_number || index}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{step.description || step.tool_name || 'Planned action'}</strong><small>{step.tool_name ? `Tool: ${step.tool_name}` : 'Planner action'} {step.status ? ` · ${step.status}` : ''}</small></div></div>)}</div></div> : <EmptyState icon={Cpu} title="No plan in focus" copy="Send a command from the Command workspace to see Noa’s step-by-step plan here." action={<button type="button" className="primary-button" onClick={() => openTab('chat')}>Go to command</button>} />}</section>}

          {activeTab === 'tools' && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">REGISTERED CAPABILITIES</p><h2>Tools</h2><p>Choose a tool, supply a valid JSON object, and inspect the exact result.</p></div><span className="count-badge large">{tools.length} available</span></div><div className="tools-layout"><div className="tool-list">{tools.length ? tools.map((tool) => <button type="button" key={tool.name} className={selectedTool === tool.name ? 'tool-card selected' : 'tool-card'} onClick={() => { setSelectedTool(tool.name); setToolOutput(null); }}><Wrench size={17} /><span><strong>{tool.name}</strong><small>{tool.description || 'No description available.'}</small></span><ChevronDown size={15} /></button>) : <EmptyState icon={Wrench} title="No tools loaded" copy="Refresh once the local API is running." action={<button type="button" className="secondary-button" onClick={() => void refreshWorkspace()}>Retry</button>} />}</div><aside className="tool-runner"><div className="runner-heading"><Terminal size={17} /><div><strong>{selectedTool || 'Choose a tool'}</strong><span>Parameters must be a JSON object.</span></div></div><label><span>Parameters</span><textarea value={toolParams} onChange={(event) => setToolParams(event.target.value)} spellCheck="false" rows={9} disabled={!selectedTool || toolBusy} /></label><button type="button" className="primary-button runner-button" onClick={() => void executeTool()} disabled={!selectedTool || toolBusy}>{toolBusy ? 'Executing…' : <><Play size={15} />Execute safely</>}</button>{toolOutput && <div className="tool-result"><div><span>RESULT</span><span className={toolOutput.success === false ? 'result-error' : 'result-success'}>{toolOutput.success === false ? 'FAILED' : 'COMPLETE'}</span></div><pre>{JSON.stringify(toolOutput, null, 2)}</pre></div>}</aside></div></section>}

          {activeTab === 'tasks' && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">BACKGROUND WORK</p><h2>Autonomous tasks</h2><p>Schedule Noa for bounded reminders, news monitoring, or safe workspace checks.</p></div><button type="button" className="secondary-button" onClick={() => void refreshWorkspace()}><RefreshCw size={15} />Refresh tasks</button></div><div className="tasks-layout"><form className="task-form" onSubmit={createTask}><div className="form-heading"><Calendar size={18} /><div><strong>Schedule a task</strong><span>Tasks remain visible and controllable here.</span></div></div><label><span>Task name</span><input value={taskName} onChange={(event) => setTaskName(event.target.value)} placeholder="e.g. Review product brief" maxLength={200} /></label><label><span>Task type</span><select value={taskType} onChange={(event) => setTaskType(event.target.value)}><option value="reminder">Reminder</option><option value="news_monitor">News monitor</option><option value="file_organizer">Workspace check</option></select></label><label><span>Schedule</span><input value={taskSchedule} onChange={(event) => setTaskSchedule(event.target.value)} placeholder="daily, hourly, or YYYY-MM-DD HH:mm" maxLength={80} /></label><button type="submit" className="primary-button" disabled={taskBusy}>{taskBusy ? 'Scheduling…' : 'Schedule task'}</button></form><div className="task-list">{tasks.length ? tasks.map((task) => <article className="task-card" key={task.id}><div className="task-title"><span className={`task-type ${task.task_type}`}>{task.task_type.replace('_', ' ')}</span><h3>{task.task_name}</h3><p>Next run {formatTime(task.next_run)} · {task.cron_or_interval}</p></div><div className="task-actions"><span className={`task-status ${task.status}`}>{task.status}</span>{task.status === 'active' ? <button type="button" className="icon-button" onClick={() => void updateTask(task, 'paused')} aria-label={`Pause ${task.task_name}`}><Pause size={16} /></button> : <button type="button" className="icon-button" onClick={() => void updateTask(task, 'active')} aria-label={`Activate ${task.task_name}`}><Play size={16} /></button>}<button type="button" className="icon-button danger" onClick={() => void deleteTask(task)} aria-label={`Delete ${task.task_name}`}><Trash2 size={16} /></button></div></article>) : <EmptyState icon={Calendar} title="No tasks scheduled" copy="Create a bounded task to make Noa useful between conversations." />}</div></div></section>}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile workspace navigation">{navigation.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => openTab(item.id)}><Icon size={18} /><span>{item.label}</span></button>; })}</nav>
    </div>
  );
}
