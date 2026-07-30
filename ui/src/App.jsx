import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Cpu, Brain, Wrench, Activity, Send, CheckCircle2, 
  Clock, Database, Layers, RefreshCw, Play, Plus, Zap, AlertTriangle, ShieldCheck
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "NOA OS v1.0.0 [REASONING ENGINE INITIALIZED]\n5-Layer Memory Matrix: ACTIVE\n12-Tool Pipeline: ONLINE\nReady for input telemetry."
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [memoryState, setMemoryState] = useState(null);
  const [toolsList, setToolsList] = useState([]);
  const [autonomousTasks, setAutonomousTasks] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // Selected tool testing state
  const [selectedTool, setSelectedTool] = useState('');
  const [toolParams, setToolParams] = useState('{}');
  const [toolOutput, setToolOutput] = useState(null);

  // Memory add state
  const [newMemLayer, setNewMemLayer] = useState('long_term');
  const [newMemSubject, setNewMemSubject] = useState('');
  const [newMemFact, setNewMemFact] = useState('');

  // Autonomous task create state
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState('reminder');
  const [taskSchedule, setTaskSchedule] = useState('daily');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchHealth();
    fetchMemory();
    fetchTools();
    fetchTasks();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      setSystemHealth(await res.json());
    } catch (e) {}
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch(`${API_BASE}/memory`);
      setMemoryState(await res.json());
    } catch (e) {}
  };

  const fetchTools = async () => {
    try {
      const res = await fetch(`${API_BASE}/tools`);
      const data = await res.json();
      setToolsList(data);
      if (data.length > 0 && !selectedTool) setSelectedTool(data[0].name);
    } catch (e) {}
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/autonomous/tasks`);
      setAutonomousTasks(await res.json());
    } catch (e) {}
  };

  const handleSendMessage = async (queryText = inputQuery) => {
    if (!queryText.trim() || isLoading) return;

    const userText = queryText;
    setInputQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, session_id: 'default_session' })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        plan: data.plan 
      }]);
      setCurrentPlan(data.plan);
      fetchMemory();
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "SYS_ERR: Connection to backend engine timed out or port 8000 unreachable." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTool = async () => {
    try {
      let paramsObj = {};
      try { paramsObj = JSON.parse(toolParams); } catch (err) {}
      
      const res = await fetch(`${API_BASE}/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedTool, params: paramsObj })
      });
      setToolOutput(await res.json());
    } catch (e) {
      setToolOutput({ error: String(e) });
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newMemSubject || !newMemFact) return;
    try {
      await fetch(`${API_BASE}/memory/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layer: newMemLayer,
          category_or_subject: newMemSubject,
          key_or_fact: newMemFact
        })
      });
      setNewMemSubject('');
      setNewMemFact('');
      fetchMemory();
    } catch (e) {}
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskName) return;
    try {
      await fetch(`${API_BASE}/autonomous/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          task_type: taskType,
          schedule: taskSchedule
        })
      });
      setTaskName('');
      fetchTasks();
    } catch (e) {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', gap: '1rem' }}>
      
      {/* HUD Header Bar */}
      <header className="hud-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ background: 'rgba(0, 255, 157, 0.1)', border: '1px solid var(--neon-mint)', padding: '0.4rem 0.6rem' }}>
            <Terminal size={20} color="var(--neon-mint)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 className="font-hud" style={{ fontSize: '1.2rem', color: 'var(--text-head)', margin: 0 }}>NOA_OS // TERMINAL</h1>
              <span className="badge-mint">SYS_ONLINE</span>
            </div>
            <p className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>REASONING ENGINE // 5-LAYER MEMORY MATRIX</p>
          </div>
        </div>

        {/* Tactical Navigation */}
        <nav style={{ display: 'flex', gap: '0.35rem', background: '#07090e', padding: '0.25rem', border: '1px solid var(--border-muted)' }}>
          {[
            { id: 'chat', label: 'EXECUTION_REPL', icon: Terminal },
            { id: 'memory', label: 'MEMORY_MATRIX', icon: Brain },
            { id: 'planner', label: 'PLANNER_ARENA', icon: Cpu },
            { id: 'tools', label: 'TOOL_SYSTEMS', icon: Wrench },
            { id: 'agents', label: 'AUTONOMOUS_CRON', icon: Activity }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`hud-tab-btn ${active ? 'active' : ''}`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Telemetry Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge-cyan">TOOLS: {systemHealth?.tools_count || 12} ACTIVE</span>
          <span className="badge-mint">PORT: 8000</span>
        </div>
      </header>

      {/* Main Tactical Workspace */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        
        {/* TAB 1: EXECUTION REPL (CHAT) */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', width: '100%', gap: '1rem' }}>
            
            {/* Terminal Stream */}
            <div className="hud-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '0.85rem 1.15rem',
                      background: m.role === 'user' ? 'rgba(0, 229, 255, 0.08)' : '#0d1117',
                      border: m.role === 'user' ? '1px solid var(--neon-cyan)' : '1px solid var(--border-muted)',
                      borderLeft: m.role === 'assistant' ? '3px solid var(--neon-mint)' : 'none',
                      color: m.role === 'user' ? 'var(--neon-cyan)' : 'var(--text-head)',
                      lineHeight: '1.6',
                      fontSize: '0.88rem'
                    }} className="font-mono">
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginBottom: '0.3rem' }}>
                        [{m.role === 'user' ? 'USER_INPUT' : 'NOA_RESPONSE'}]
                      </div>
                      {m.content}

                      {/* Display Plan Summary */}
                      {m.plan && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.78rem' }}>
                          <div style={{ color: 'var(--neon-amber)', fontWeight: '600', marginBottom: '0.25rem' }}>
                            // PLAN: {m.plan.goal}
                          </div>
                          {m.plan.steps.map((s, sIdx) => (
                            <div key={sIdx} style={{ color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CheckCircle2 size={12} color="var(--neon-mint)" />
                              <span>STEP_{s.step_number}: {s.description} {s.tool_name !== 'none' && `[TOOL:${s.tool_name}]`}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Telemetry Commands */}
              <div style={{ padding: '0.5rem 1rem', background: '#080a0e', borderTop: '1px solid var(--border-muted)', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                {[
                  "☀️ weather: San Francisco",
                  "📰 search: AI technology news",
                  "📅 reminder: Review code at 5pm",
                  "📁 files: list workspace"
                ].map((cmd, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => handleSendMessage(cmd)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-muted)',
                      color: 'var(--text-body)',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
                      fontFamily: 'IBM Plex Mono, monospace',
                      cursor: 'pointer'
                    }}
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {/* Input Command Line */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ padding: '0.85rem', background: '#050608', borderTop: '1px solid var(--border-muted)', display: 'flex', gap: '0.75rem' }}>
                <span className="font-mono" style={{ color: 'var(--neon-mint)', alignSelf: 'center' }}>&gt;</span>
                <input
                  type="text"
                  placeholder="Enter command or query telemetry..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-head)',
                    fontSize: '0.9rem',
                    fontFamily: 'IBM Plex Mono, monospace',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: 'rgba(0, 255, 157, 0.1)',
                    border: '1px solid var(--neon-mint)',
                    color: 'var(--neon-mint)',
                    padding: '0.5rem 1.25rem',
                    fontFamily: 'Chakra Petch, sans-serif',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {isLoading ? <RefreshCw size={14} className="pulse-animation" /> : <Send size={14} />}
                  RUN
                </button>
              </form>
            </div>

            {/* Sidebar Context */}
            <div className="hud-panel" style={{ width: '320px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-hud" style={{ fontSize: '0.95rem', color: 'var(--neon-mint)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Brain size={16} /> CONTEXT_SCRATCHPAD
              </h3>

              <div style={{ background: '#080a0e', border: '1px solid var(--border-muted)', padding: '0.75rem' }}>
                <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>// WORKING MEMORY TURNS</span>
                <p className="font-mono" style={{ fontSize: '1.1rem', color: 'var(--neon-cyan)', marginTop: '0.2rem' }}>
                  {memoryState?.working?.turn_count || 0} ACTIVE TURNS
                </p>
              </div>

              <div style={{ background: '#080a0e', border: '1px solid var(--border-muted)', padding: '0.75rem', flex: 1, overflowY: 'auto' }}>
                <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--neon-mint)', display: 'block', marginBottom: '0.5rem' }}>// LONG_TERM PREFERENCES</span>
                {memoryState?.long_term?.length > 0 ? (
                  memoryState.long_term.map((m, idx) => (
                    <div key={idx} className="font-mono" style={{ fontSize: '0.78rem', marginBottom: '0.4rem', borderBottom: '1px dashed var(--border-muted)', paddingBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--neon-amber)' }}>[{m.category}]</span> {m.key}: {m.value}
                    </div>
                  ))
                ) : (
                  <p className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>No long-term memories saved.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: 5-LAYER MEMORY MATRIX */}
        {activeTab === 'memory' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            
            {/* Add Record Form */}
            <form onSubmit={handleAddMemory} className="hud-panel" style={{ padding: '0.85rem 1.15rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className="font-hud" style={{ fontSize: '0.85rem', color: 'var(--neon-mint)' }}>+ INJECT RECORD:</span>
              <select 
                value={newMemLayer} 
                onChange={(e) => setNewMemLayer(e.target.value)}
                style={{ background: '#050608', color: '#fff', border: '1px solid var(--border-muted)', padding: '0.4rem', fontFamily: 'IBM Plex Mono' }}
              >
                <option value="long_term">Long-Term Memory</option>
                <option value="semantic">Semantic Memory (Vectorized)</option>
              </select>
              <input
                type="text"
                placeholder="Category / Subject"
                value={newMemSubject}
                onChange={(e) => setNewMemSubject(e.target.value)}
                style={{ background: '#050608', color: '#fff', border: '1px solid var(--border-muted)', padding: '0.4rem 0.6rem', fontFamily: 'IBM Plex Mono' }}
              />
              <input
                type="text"
                placeholder="Fact / Record details..."
                value={newMemFact}
                onChange={(e) => setNewMemFact(e.target.value)}
                style={{ flex: 1, background: '#050608', color: '#fff', border: '1px solid var(--border-muted)', padding: '0.4rem 0.6rem', fontFamily: 'IBM Plex Mono' }}
              />
              <button type="submit" style={{ background: 'rgba(0, 255, 157, 0.1)', border: '1px solid var(--neon-mint)', color: 'var(--neon-mint)', padding: '0.4rem 1rem', fontFamily: 'Chakra Petch', fontWeight: '600', cursor: 'pointer' }}>
                SAVE
              </button>
            </form>

            {/* 5 Layer Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              
              {/* Layer 1: Working Memory */}
              <div className="hud-panel" style={{ padding: '1rem', height: '260px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-hud" style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: '0.6rem' }}>L1 // WORKING_MEMORY</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }} className="font-mono">
                  {memoryState?.working?.history?.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', background: '#080a0e', padding: '0.35rem', borderLeft: '2px solid var(--neon-cyan)' }}>
                      <strong>{h.role}:</strong> {h.content.slice(0, 65)}...
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 2: Short-Term Memory */}
              <div className="hud-panel" style={{ padding: '1rem', height: '260px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-hud" style={{ fontSize: '0.9rem', color: 'var(--neon-mint)', marginBottom: '0.6rem' }}>L2 // SHORT_TERM_TASK_TTL</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }} className="font-mono">
                  {memoryState?.short_term?.recent_tasks?.map((t, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', background: '#080a0e', padding: '0.35rem', borderLeft: '2px solid var(--neon-mint)' }}>
                      {t.key}: {t.value}
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 3: Long-Term Memory */}
              <div className="hud-panel" style={{ padding: '1rem', height: '260px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-hud" style={{ fontSize: '0.9rem', color: 'var(--neon-amber)', marginBottom: '0.6rem' }}>L3 // LONG_TERM_PERSISTENT</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }} className="font-mono">
                  {memoryState?.long_term?.map((lt, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', background: '#080a0e', padding: '0.35rem', borderLeft: '2px solid var(--neon-amber)' }}>
                      [{lt.category}] {lt.key}: {lt.value}
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 4: Semantic Memory */}
              <div className="hud-panel" style={{ padding: '1rem', height: '260px', display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                <h3 className="font-hud" style={{ fontSize: '0.9rem', color: 'var(--neon-red)', marginBottom: '0.6rem' }}>L4 // SEMANTIC_VECTOR_KNOWLEDGE</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }} className="font-mono">
                  {memoryState?.semantic?.map((sm, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', background: '#080a0e', padding: '0.4rem', borderLeft: '2px solid var(--neon-red)', display: 'flex', justifyContent: 'space-between' }}>
                      <div><strong>{sm.subject}:</strong> {sm.fact}</div>
                      <span style={{ color: 'var(--text-sub)' }}>{sm.source}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 5: Episodic Memory */}
              <div className="hud-panel" style={{ padding: '1rem', height: '260px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-hud" style={{ fontSize: '0.9rem', color: '#c084fc', marginBottom: '0.6rem' }}>L5 // EPISODIC_EVENT_LOG</h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }} className="font-mono">
                  {memoryState?.episodic?.map((ep, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', background: '#080a0e', padding: '0.35rem', borderLeft: '2px solid #c084fc' }}>
                      [{ep.event_type}] {ep.summary}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: PLANNER ARENA */}
        {activeTab === 'planner' && (
          <div className="hud-panel" style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            <h2 className="font-hud" style={{ fontSize: '1.1rem', color: 'var(--neon-mint)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={18} /> TELEMETRY_PLANNER // EXECUTION ARENA
            </h2>

            {currentPlan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="font-mono">
                <div style={{ background: '#080a0e', border: '1px solid var(--neon-mint)', padding: '0.85rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--neon-mint)' }}>// TARGET GOAL</span>
                  <h3 style={{ fontSize: '1rem', color: '#fff', marginTop: '0.2rem' }}>{currentPlan.goal}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '0.2rem' }}>{currentPlan.thought}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {currentPlan.steps.map((step, idx) => {
                    const result = currentPlan.results?.find(r => r.step_number === step.step_number);
                    return (
                      <div key={idx} style={{ background: '#080a0e', border: '1px solid var(--border-muted)', padding: '0.75rem', display: 'flex', gap: '0.85rem' }}>
                        <div style={{ background: 'var(--neon-mint)', color: '#000', fontWeight: '700', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                          {step.step_number}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ fontSize: '0.88rem', color: '#fff' }}>{step.description}</h5>
                          <p style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', marginTop: '0.1rem' }}>ALLOCATED TOOL: {step.tool_name}</p>
                          {result && (
                            <div style={{ marginTop: '0.4rem', background: '#030406', padding: '0.5rem', border: '1px solid rgba(0,255,157,0.2)', fontSize: '0.78rem', color: 'var(--neon-mint)' }}>
                              OUTPUT: {JSON.stringify(result.output)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-sub)' }} className="font-mono">
                <Cpu size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>NO ACTIVE PLAN EXECUTED. INPUT QUERY IN REPL TO GENERATE TELEMETRY PLAN.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TOOLS CONSOLE */}
        {activeTab === 'tools' && (
          <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
            <div className="hud-panel" style={{ width: '300px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 className="font-hud" style={{ fontSize: '0.9rem', color: 'var(--neon-mint)' }}>REGISTERED_TOOLS ({toolsList.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto' }}>
                {toolsList.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTool(t.name)}
                    style={{
                      textAlign: 'left',
                      padding: '0.6rem',
                      background: selectedTool === t.name ? 'rgba(0, 255, 157, 0.1)' : 'transparent',
                      border: selectedTool === t.name ? '1px solid var(--neon-mint)' : '1px solid var(--border-muted)',
                      color: selectedTool === t.name ? 'var(--neon-mint)' : 'var(--text-body)',
                      fontFamily: 'IBM Plex Mono',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="hud-panel" style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-hud" style={{ fontSize: '1rem', color: 'var(--neon-cyan)' }}>TEST_SANDBOX // {selectedTool}</h3>
              <div>
                <label className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'block', marginBottom: '0.3rem' }}>// PARAMETERS (JSON):</label>
                <textarea
                  rows={4}
                  value={toolParams}
                  onChange={(e) => setToolParams(e.target.value)}
                  style={{ width: '100%', background: '#050608', color: '#fff', border: '1px solid var(--border-muted)', padding: '0.65rem', fontFamily: 'IBM Plex Mono' }}
                />
              </div>
              <button
                onClick={handleExecuteTool}
                style={{ background: 'rgba(0, 255, 157, 0.1)', border: '1px solid var(--neon-mint)', color: 'var(--neon-mint)', padding: '0.6rem', fontFamily: 'Chakra Petch', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Play size={14} /> EXECUTE TOOL
              </button>

              {toolOutput && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <label className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'block', marginBottom: '0.3rem' }}>// EXECUTION OUTPUT:</label>
                  <pre style={{ background: '#030406', padding: '0.85rem', border: '1px solid var(--border-muted)', color: 'var(--neon-mint)', fontSize: '0.8rem', fontFamily: 'IBM Plex Mono' }}>
                    {JSON.stringify(toolOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUTONOMOUS TASK MANAGER */}
        {activeTab === 'agents' && (
          <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
            <div className="hud-panel" style={{ width: '340px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h3 className="font-hud" style={{ fontSize: '0.9rem', color: 'var(--neon-mint)' }}>+ SCHEDULE_CRON_TASK</h3>
              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  style={{ background: '#050608', color: '#fff', border: '1px solid var(--border-muted)', padding: '0.5rem', fontFamily: 'IBM Plex Mono' }}
                />
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  style={{ background: '#050608', color: '#fff', border: '1px solid var(--border-muted)', padding: '0.5rem', fontFamily: 'IBM Plex Mono' }}
                >
                  <option value="reminder">Reminder Alert</option>
                  <option value="news_monitor">Topic News Monitor</option>
                  <option value="file_organizer">File Organizer</option>
                </select>
                <input
                  type="text"
                  placeholder="Interval (e.g. daily, hourly)"
                  value={taskSchedule}
                  onChange={(e) => setTaskSchedule(e.target.value)}
                  style={{ background: '#050608', color: '#fff', border: '1px solid var(--border-muted)', padding: '0.5rem', fontFamily: 'IBM Plex Mono' }}
                />
                <button type="submit" style={{ background: 'rgba(0, 255, 157, 0.1)', border: '1px solid var(--neon-mint)', color: 'var(--neon-mint)', padding: '0.6rem', fontFamily: 'Chakra Petch', fontWeight: '600', cursor: 'pointer' }}>
                  SCHEDULE JOB
                </button>
              </form>
            </div>

            <div className="hud-panel" style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-hud" style={{ fontSize: '1rem', color: 'var(--neon-amber)' }}>ACTIVE_CRON_JOBS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflowY: 'auto' }} className="font-mono">
                {autonomousTasks.map((t, idx) => (
                  <div key={idx} style={{ background: '#080a0e', border: '1px solid var(--border-muted)', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.88rem', color: '#fff' }}>{t.task_name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                        TYPE: <span style={{ color: 'var(--neon-mint)' }}>{t.task_type}</span> | SCHEDULE: {t.cron_or_interval}
                      </p>
                    </div>
                    <span className="badge-mint">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
