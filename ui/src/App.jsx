import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Brain, Cpu, Wrench, Sparkles, Terminal, Calendar, 
  Mail, GitBranch, Globe, Cloud, Search, CheckCircle2, Clock, 
  Activity, Layers, Database, ShieldAlert, Mic, Image, RefreshCw, Plus, Play, ChevronRight, Zap, Trash2
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am **Noa**, your autonomous AI assistant. I have access to internet search, a 5-layer memory engine, an autonomous multi-step planner, and 12 execution tools. How can I assist you today?"
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
        content: "Error connecting to Noa Engine backend (localhost:8000)." 
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.25rem', gap: '1.25rem' }}>
      
      {/* Clean Navbar Header */}
      <header className="clean-glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))', 
            padding: '0.55rem', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
          }}>
            <Bot size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 className="font-outfit gradient-text-primary" style={{ fontSize: '1.35rem', fontWeight: '800', lineHeight: 1 }}>NOA CORE</h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: '600' }}>
                v1.0.0
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Autonomous AI Engine with 5-Layer Memory</p>
          </div>
        </div>

        {/* Tab Selector Pills */}
        <nav style={{ display: 'flex', gap: '0.35rem', background: 'rgba(7, 9, 14, 0.6)', padding: '0.3rem', borderRadius: '14px', border: '1px solid var(--card-border)' }}>
          {[
            { id: 'chat', label: 'Chat Engine', icon: Sparkles },
            { id: 'memory', label: '5-Layer Memory', icon: Brain },
            { id: 'planner', label: 'Planner & Execution', icon: Cpu },
            { id: 'tools', label: 'Tools Console', icon: Wrench },
            { id: 'agents', label: 'Autonomous Tasks', icon: Activity }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`nav-pill-btn ${active ? 'active' : ''}`}
              >
                <Icon size={16} color={active ? 'var(--accent-cyan)' : 'currentColor'} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            background: 'rgba(16, 185, 129, 0.12)', 
            color: 'var(--accent-emerald)', 
            padding: '0.35rem 0.75rem', 
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            <span className="pulse-dot" />
            {systemHealth?.status === 'online' ? 'Engine Active' : 'Connecting...'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
            12 Tools Loaded
          </span>
        </div>
      </header>

      {/* Main View Area */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        
        {/* TAB 1: CHAT ENGINE */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', width: '100%', gap: '1.25rem' }}>
            
            {/* Conversation Stream Column */}
            <div className="clean-glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {messages.map((m, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' 
                  }}>
                    <div className="clean-card" style={{
                      maxWidth: '82%',
                      padding: '1rem 1.25rem',
                      borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: m.role === 'user' 
                        ? 'linear-gradient(135deg, var(--accent-primary), #3b82f6)' 
                        : 'rgba(18, 26, 42, 0.7)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--card-border)',
                      color: '#ffffff',
                      lineHeight: '1.6',
                      fontSize: '0.92rem'
                    }}>
                      {m.content}

                      {/* Display Plan Summary if generated */}
                      {m.plan && (
                        <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.82rem' }}>
                          <div style={{ fontWeight: '600', color: 'var(--accent-cyan)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Cpu size={15} /> Goal: {m.plan.goal}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {m.plan.steps.map((s, sIdx) => (
                              <div key={sIdx} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <CheckCircle2 size={13} color="var(--accent-emerald)" />
                                <span>Step {s.step_number}: {s.description} {s.tool_name !== 'none' && `[${s.tool_name}]`}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Action Suggestion Pills */}
              <div style={{ padding: '0.5rem 1.25rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', borderTop: '1px solid var(--card-border)' }}>
                {[
                  "☀️ Check weather in San Francisco",
                  "📰 Search latest AI news",
                  "📅 Remind me to review code at 5 PM",
                  "📁 List workspace files"
                ].map((promptText, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(promptText)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '16px',
                      padding: '0.35rem 0.75rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ padding: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Ask Noa anything..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(7, 9, 14, 0.6)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    padding: '0.85rem 1.25rem',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.85rem 1.5rem',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  {isLoading ? <RefreshCw size={18} className="pulse-animation" /> : <Send size={18} />}
                  Send
                </button>
              </form>
            </div>

            {/* Memory Sidebar Panel */}
            <div className="clean-glass-panel" style={{ width: '330px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-outfit" style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Brain size={18} color="var(--accent-purple)" />
                Working Context
              </h3>
              
              <div className="clean-card">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Working Memory Turns</span>
                <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-cyan)', marginTop: '0.1rem' }}>
                  {memoryState?.working?.turn_count || 0} Active Turns
                </p>
              </div>

              <div className="clean-card" style={{ flex: 1, overflowY: 'auto' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Long-Term Memories</span>
                {memoryState?.long_term?.length > 0 ? (
                  memoryState.long_term.map((m, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.8rem', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>[{m.category}]</span> {m.key}: {m.value}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No persistent long-term memories saved.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: 5-LAYER MEMORY INSPECTOR */}
        {activeTab === 'memory' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
            
            {/* Add Memory Form */}
            <form onSubmit={handleAddMemory} className="clean-glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className="font-outfit" style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}>
                <Plus size={16} /> Insert Memory Record:
              </span>
              <select 
                value={newMemLayer} 
                onChange={(e) => setNewMemLayer(e.target.value)}
                style={{ background: 'rgba(7, 9, 14, 0.8)', color: '#fff', border: '1px solid var(--card-border)', padding: '0.55rem', borderRadius: '8px' }}
              >
                <option value="long_term">Long-Term Memory</option>
                <option value="semantic">Semantic Memory (Vectorized)</option>
              </select>
              <input
                type="text"
                placeholder="Category / Subject"
                value={newMemSubject}
                onChange={(e) => setNewMemSubject(e.target.value)}
                style={{ background: 'rgba(7, 9, 14, 0.8)', color: '#fff', border: '1px solid var(--card-border)', padding: '0.55rem 0.75rem', borderRadius: '8px' }}
              />
              <input
                type="text"
                placeholder="Fact or Preference details..."
                value={newMemFact}
                onChange={(e) => setNewMemFact(e.target.value)}
                style={{ flex: 1, background: 'rgba(7, 9, 14, 0.8)', color: '#fff', border: '1px solid var(--card-border)', padding: '0.55rem 0.75rem', borderRadius: '8px' }}
              />
              <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Save Entry
              </button>
            </form>

            {/* 5 Layer Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              
              {/* Layer 1: Working Memory */}
              <div className="clean-glass-panel" style={{ padding: '1.25rem', height: '270px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-outfit" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={16} /> 1. Working Memory
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {memoryState?.working?.history?.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <strong style={{ color: h.role === 'user' ? 'var(--accent-cyan)' : 'var(--accent-purple)' }}>{h.role}:</strong> {h.content.slice(0, 70)}...
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 2: Short-Term Memory */}
              <div className="clean-glass-panel" style={{ padding: '1.25rem', height: '270px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-outfit" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} /> 2. Short-Term Memory
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {memoryState?.short_term?.recent_tasks?.map((t, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--accent-primary)' }}>{t.key}:</span> {t.value}
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 3: Long-Term Memory */}
              <div className="clean-glass-panel" style={{ padding: '1.25rem', height: '270px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-outfit" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-purple)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Database size={16} /> 3. Long-Term Memory
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {memoryState?.long_term?.map((lt, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--accent-purple)', fontWeight: '700' }}>[{lt.category}]</span> {lt.key}: {lt.value}
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 4: Semantic Memory */}
              <div className="clean-glass-panel" style={{ padding: '1.25rem', height: '270px', display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                <h3 className="font-outfit" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-rose)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Brain size={16} /> 4. Semantic Memory (Vector Search Base)
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {memoryState?.semantic?.map((sm, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: 'var(--accent-rose)' }}>{sm.subject}:</strong> {sm.fact}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {sm.source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 5: Episodic Memory */}
              <div className="clean-glass-panel" style={{ padding: '1.25rem', height: '270px', display: 'flex', flexDirection: 'column' }}>
                <h3 className="font-outfit" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={16} /> 5. Episodic Memory
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {memoryState?.episodic?.map((ep, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>[{ep.event_type}]</span> {ep.summary}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: PLANNER ARENA */}
        {activeTab === 'planner' && (
          <div className="clean-glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
            <h2 className="font-outfit gradient-text-primary" style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={22} color="var(--accent-cyan)" /> Autonomous Planner Pipeline
            </h2>

            {currentPlan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="clean-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Goal</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.2rem' }}>{currentPlan.goal}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>{currentPlan.thought}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Step Execution Pipeline</h4>
                  {currentPlan.steps.map((step, idx) => {
                    const result = currentPlan.results?.find(r => r.step_number === step.step_number);
                    return (
                      <div key={idx} className="clean-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ 
                          background: 'var(--accent-primary)', 
                          color: '#fff', 
                          fontWeight: '800', 
                          borderRadius: '50%', 
                          width: 30, 
                          height: 30, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.85rem'
                        }}>
                          {step.step_number}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ fontSize: '0.92rem', fontWeight: '700' }}>{step.description}</h5>
                          <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.1rem' }}>
                            Tool: <code>{step.tool_name}</code>
                          </p>
                          {result && (
                            <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent-emerald)' }}>
                              <strong>Result:</strong> {JSON.stringify(result.output)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <Cpu size={52} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                <p style={{ fontSize: '0.95rem' }}>No active plan execution loaded. Ask Noa a multi-step query in the Chat Engine!</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TOOLS CONSOLE */}
        {activeTab === 'tools' && (
          <div style={{ flex: 1, display: 'flex', gap: '1.25rem' }}>
            <div className="clean-glass-panel" style={{ width: '320px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 className="font-outfit" style={{ fontSize: '1rem', fontWeight: '700' }}>Registered Tools ({toolsList.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto' }}>
                {toolsList.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTool(t.name)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: selectedTool === t.name ? '1px solid var(--accent-primary)' : '1px solid var(--card-border)',
                      background: selectedTool === t.name ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.description.slice(0, 45)}...</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="clean-glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-outfit" style={{ fontSize: '1.1rem', fontWeight: '700' }}>Execute Tool: {selectedTool}</h3>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Parameters (JSON):</label>
                <textarea
                  rows={4}
                  value={toolParams}
                  onChange={(e) => setToolParams(e.target.value)}
                  style={{ width: '100%', background: 'rgba(7, 9, 14, 0.8)', color: '#fff', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '0.75rem', fontFamily: 'monospace' }}
                />
              </div>
              <button
                onClick={handleExecuteTool}
                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Play size={16} /> Execute Tool Sandbox
              </button>

              {toolOutput && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Output:</label>
                  <pre style={{ background: 'rgba(0,0,0,0.6)', padding: '1rem', borderRadius: '10px', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
                    {JSON.stringify(toolOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUTONOMOUS TASK MANAGER */}
        {activeTab === 'agents' && (
          <div style={{ flex: 1, display: 'flex', gap: '1.25rem' }}>
            <div className="clean-glass-panel" style={{ width: '360px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-outfit" style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={18} /> Schedule Task
              </h3>
              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Task title (e.g. Check AI News)"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  style={{ background: 'rgba(7, 9, 14, 0.8)', color: '#fff', border: '1px solid var(--card-border)', padding: '0.65rem', borderRadius: '8px' }}
                />
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  style={{ background: 'rgba(7, 9, 14, 0.8)', color: '#fff', border: '1px solid var(--card-border)', padding: '0.65rem', borderRadius: '8px' }}
                >
                  <option value="reminder">Reminder Alert</option>
                  <option value="news_monitor">Topic News Monitor</option>
                  <option value="file_organizer">File Organizer</option>
                </select>
                <input
                  type="text"
                  placeholder="Schedule (e.g. daily, hourly)"
                  value={taskSchedule}
                  onChange={(e) => setTaskSchedule(e.target.value)}
                  style={{ background: 'rgba(7, 9, 14, 0.8)', color: '#fff', border: '1px solid var(--card-border)', padding: '0.65rem', borderRadius: '8px' }}
                />
                <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Create Task
                </button>
              </form>
            </div>

            <div className="clean-glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-outfit" style={{ fontSize: '1.1rem', fontWeight: '700' }}>Active Background Tasks</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                {autonomousTasks.map((t, idx) => (
                  <div key={idx} className="clean-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{t.task_name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Type: <span style={{ color: 'var(--accent-cyan)' }}>{t.task_type}</span> | Schedule: {t.cron_or_interval}
                      </p>
                    </div>
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                      {t.status}
                    </span>
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
