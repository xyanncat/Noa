import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Brain, Cpu, Wrench, Sparkles, Terminal, Calendar, 
  Mail, GitBranch, Globe, Cloud, Search, CheckCircle2, Clock, 
  Activity, Layers, Database, ShieldAlert, Mic, Image, RefreshCw, Plus, Play, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Greetings, Traveler. I am **Noa** (ノア), an autonomous reasoning AI engine. I operate with 5-layer persistent memory, live web research capabilities, an autonomous planner, and a 12-tool ecosystem. How shall I assist you?"
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [memoryState, setMemoryState] = useState(null);
  const [toolsList, setToolsList] = useState([]);
  const [autonomousTasks, setAutonomousTasks] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // Tools carousel & execution state
  const [selectedToolIdx, setSelectedToolIdx] = useState(0);
  const [toolParams, setToolParams] = useState('{}');
  const [toolOutput, setToolOutput] = useState(null);

  // Memory add state
  const [newMemLayer, setNewMemLayer] = useState('long_term');
  const [newMemSubject, setNewMemSubject] = useState('');
  const [newMemFact, setNewMemFact] = useState('');

  // Autonomous task state
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
    } catch (e) {}
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/autonomous/tasks`);
      setAutonomousTasks(await res.json());
    } catch (e) {}
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    const userText = inputQuery;
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
        content: "Network exception: Ensure Noa backend server is online at port 8000." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTool = async (toolName) => {
    try {
      let paramsObj = {};
      try { paramsObj = JSON.parse(toolParams); } catch (err) {}
      
      const res = await fetch(`${API_BASE}/tools/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: toolName, params: paramsObj })
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
      
      {/* KAMUI Shrine Header */}
      <header className="kamui-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.75rem', borderBottom: '2px solid rgba(251, 191, 36, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #e11d48, #9333ea, #fbbf24)', 
            padding: '0.65rem', 
            borderRadius: '14px',
            boxShadow: '0 0 20px rgba(225, 29, 72, 0.5)'
          }}>
            <Bot size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 className="font-cinzel gradient-gold-text" style={{ fontSize: '1.5rem', fontWeight: '900' }}>NOA CORE</h1>
              <span className="font-cinzel" style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', background: 'rgba(168,85,247,0.15)', padding: '0.1rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.3)' }}>
                ノア ・ 記憶
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Autonomous AI Reasoning Engine with 5 Memory Decks</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', gap: '0.4rem', background: 'rgba(8, 4, 16, 0.7)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-purple)' }}>
          {[
            { id: 'chat', label: 'Chat Engine', jp: '対話', icon: Sparkles },
            { id: 'memory', label: 'Memory Deck', jp: '記憶', icon: Brain },
            { id: 'planner', label: 'Planner Arena', jp: '計画', icon: Cpu },
            { id: 'tools', label: 'Tools Deck', jp: '道具', icon: Wrench },
            { id: 'agents', label: 'Autonomous', jp: '自動', icon: Activity }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: active ? '1px solid var(--accent-gold)' : '1px solid transparent',
                  background: active ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.3), rgba(147, 51, 234, 0.4))' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: active ? '700' : '500',
                  fontSize: '0.82rem',
                  boxShadow: active ? '0 0 15px rgba(251, 191, 36, 0.3)' : 'none',
                  transition: 'all 0.25s'
                }}
              >
                <Icon size={15} color={active ? 'var(--accent-gold)' : 'currentColor'} />
                <span>{t.label}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{t.jp}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            background: 'rgba(251, 191, 36, 0.15)', 
            color: 'var(--accent-gold)', 
            padding: '0.35rem 0.75rem', 
            borderRadius: '20px',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            fontSize: '0.78rem',
            fontWeight: '600'
          }}>
            <Zap size={14} color="var(--accent-gold)" />
            {systemHealth?.status === 'online' ? 'Engine Online' : 'Connecting...'}
          </span>
        </div>
      </header>

      {/* Main Body Content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        
        {/* TAB 1: CHAT ENGINE */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', width: '100%', gap: '1rem' }}>
            
            {/* Conversation Window */}
            <div className="kamui-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((m, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' 
                  }}>
                    <div className="kamui-card" style={{
                      maxWidth: '82%',
                      padding: '1rem 1.25rem',
                      borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: m.role === 'user' 
                        ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.4), rgba(147, 51, 234, 0.4))' 
                        : 'var(--card-bg)',
                      border: m.role === 'user' ? '1px solid var(--accent-crimson)' : '1px solid var(--border-purple)',
                      color: '#ffffff',
                      lineHeight: '1.6',
                      fontSize: '0.92rem'
                    }}>
                      {m.content}

                      {/* Display Plan Summary */}
                      {m.plan && (
                        <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(251,191,36,0.2)', fontSize: '0.82rem' }}>
                          <div style={{ fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Cpu size={15} /> Goal: {m.plan.goal}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {m.plan.steps.map((s, sIdx) => (
                              <div key={sIdx} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <CheckCircle2 size={13} color="var(--accent-gold)" />
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

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-purple)', display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Ask Noa anything... (e.g. 'Search for French AI news and check weather in Paris')"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(8, 4, 16, 0.6)',
                    border: '1px solid var(--border-purple)',
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
                    background: 'linear-gradient(135deg, var(--accent-crimson), var(--accent-gold))',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.85rem 1.5rem',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 0 15px rgba(225, 29, 72, 0.4)'
                  }}
                >
                  {isLoading ? <RefreshCw size={18} className="pulse-animation" /> : <Send size={18} />}
                  Execute
                </button>
              </form>
            </div>

            {/* Quick Context Card Panel */}
            <div className="kamui-panel" style={{ width: '320px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-cinzel gradient-gold-text" style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Brain size={18} color="var(--accent-gold)" />
                ACTIVE MEMORY DECK
              </h3>
              
              <div className="kamui-card">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Working Memory Turns</span>
                <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-purple)' }}>
                  {memoryState?.working?.turn_count || 0} Turns Active
                </p>
              </div>

              <div className="kamui-card" style={{ flex: 1, overflowY: 'auto' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.5rem', fontWeight: '700' }}>Long-Term Memories</span>
                {memoryState?.long_term?.length > 0 ? (
                  memoryState.long_term.map((m, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.8rem', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--accent-crimson)', fontWeight: '700' }}>[{m.category}]</span> {m.key}: {m.value}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No persistent memories stored.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 5-LAYER MEMORY CAROUSEL DECK */}
        {activeTab === 'memory' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            
            {/* Memory Add Form */}
            <form onSubmit={handleAddMemory} className="kamui-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className="font-cinzel gradient-gold-text" style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={16} /> Add Memory Card:
              </span>
              <select 
                value={newMemLayer} 
                onChange={(e) => setNewMemLayer(e.target.value)}
                style={{ background: 'rgba(8, 4, 16, 0.8)', color: '#fff', border: '1px solid var(--border-purple)', padding: '0.5rem', borderRadius: '8px' }}
              >
                <option value="long_term">Long-Term Memory</option>
                <option value="semantic">Semantic Memory (Vectorized)</option>
              </select>
              <input
                type="text"
                placeholder="Category / Subject"
                value={newMemSubject}
                onChange={(e) => setNewMemSubject(e.target.value)}
                style={{ background: 'rgba(8, 4, 16, 0.8)', color: '#fff', border: '1px solid var(--border-purple)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}
              />
              <input
                type="text"
                placeholder="Fact or Preference details..."
                value={newMemFact}
                onChange={(e) => setNewMemFact(e.target.value)}
                style={{ flex: 1, background: 'rgba(8, 4, 16, 0.8)', color: '#fff', border: '1px solid var(--border-purple)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}
              />
              <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-crimson))', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Embed Card
              </button>
            </form>

            {/* 3D Memory Card Carousel */}
            <div className="card-carousel-container">
              {[
                { title: 'Working Memory', jp: '作業記憶', count: memoryState?.working?.history?.length || 0, color: 'var(--accent-cyan)', items: memoryState?.working?.history },
                { title: 'Short-Term', jp: '短期記憶', count: memoryState?.short_term?.recent_tasks?.length || 0, color: 'var(--accent-indigo)', items: memoryState?.short_term?.recent_tasks },
                { title: 'Long-Term', jp: '長期記憶', count: memoryState?.long_term?.length || 0, color: 'var(--accent-purple)', items: memoryState?.long_term },
                { title: 'Semantic (Vector)', jp: '知識記憶', count: memoryState?.semantic?.length || 0, color: 'var(--accent-crimson)', items: memoryState?.semantic },
                { title: 'Episodic Logs', jp: '体験記憶', count: memoryState?.episodic?.length || 0, color: 'var(--accent-gold)', items: memoryState?.episodic }
              ].map((card, idx) => (
                <div key={idx} className="carousel-card-3d">
                  <div>
                    <span className="card-badge" style={{ color: card.color, borderColor: card.color }}>{card.jp}</span>
                    <h3 className="font-cinzel" style={{ fontSize: '1.05rem', fontWeight: '700', marginTop: '0.4rem', color: '#ffffff' }}>{card.title}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{card.count} Cards Stored</p>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', margin: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {card.items?.slice(0, 4).map((item, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.35rem 0.5rem', borderRadius: '6px', borderLeft: `2px solid ${card.color}` }}>
                        {item.fact || item.key || item.summary || item.content?.slice(0, 30)}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: card.color, textAlign: 'center', fontWeight: '700' }}>
                    Layer {idx + 1} Active
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: PLANNER ARENA */}
        {activeTab === 'planner' && (
          <div className="kamui-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            <h2 className="font-cinzel gradient-gold-text" style={{ fontSize: '1.3rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={24} color="var(--accent-gold)" /> AUTONOMOUS PLANNER ARENA
            </h2>

            {currentPlan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="kamui-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: '700' }}>Target Goal</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.2rem' }}>{currentPlan.goal}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{currentPlan.thought}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 className="font-cinzel" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-purple)' }}>Execution Cards</h4>
                  {currentPlan.steps.map((step, idx) => {
                    const result = currentPlan.results?.find(r => r.step_number === step.step_number);
                    return (
                      <div key={idx} className="kamui-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ 
                          background: 'linear-gradient(135deg, var(--accent-crimson), var(--accent-gold))', 
                          color: '#fff', 
                          fontWeight: '800', 
                          borderRadius: '50%', 
                          width: 32, 
                          height: 32, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          boxShadow: '0 0 10px rgba(225,29,72,0.4)'
                        }}>
                          {step.step_number}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{step.description}</h5>
                          <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginTop: '0.1rem' }}>
                            Tool: <code>{step.tool_name}</code>
                          </p>
                          {result && (
                            <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', color: '#34d399' }}>
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
                <Cpu size={56} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ fontSize: '1rem' }}>No active plan execution loaded. Ask Noa a multi-step query in the Chat Engine!</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: 3D TOOLS CAROUSEL DECK */}
        {activeTab === 'tools' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
            
            {/* 3D Tools Cards Carousel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
              <h3 className="font-cinzel gradient-gold-text" style={{ fontSize: '1.2rem', fontWeight: '800' }}>12 TOOL SYSTEM DECK</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setSelectedToolIdx(prev => Math.max(0, prev - 1))}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-purple)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer' }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setSelectedToolIdx(prev => Math.min(toolsList.length - 1, prev + 1))}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-purple)', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer' }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="card-carousel-container" style={{ overflowX: 'auto', padding: '1rem 0' }}>
              {toolsList.map((t, idx) => {
                const isSelected = selectedToolIdx === idx;
                return (
                  <div
                    key={idx}
                    className="carousel-card-3d"
                    onClick={() => setSelectedToolIdx(idx)}
                    style={{
                      borderColor: isSelected ? 'var(--accent-gold)' : 'var(--border-purple)',
                      transform: isSelected ? 'translateY(-12px) scale(1.06)' : 'scale(0.95)',
                      boxShadow: isSelected ? 'var(--glow-gold)' : 'none'
                    }}
                  >
                    <div>
                      <span className="card-badge">TOOL {idx + 1}</span>
                      <h3 className="font-cinzel" style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '0.5rem', color: isSelected ? 'var(--accent-gold)' : '#fff' }}>
                        {t.name}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: '1.4' }}>
                        {t.description}
                      </p>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: '700', textAlign: 'center' }}>
                      {isSelected ? 'ACTIVE SELECTION' : 'CLICK TO TEST'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Tool Execution Box */}
            {toolsList[selectedToolIdx] && (
              <div className="kamui-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                  Execute Tool: {toolsList[selectedToolIdx].name}
                </h4>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Parameters (JSON):</label>
                  <textarea
                    rows={3}
                    value={toolParams}
                    onChange={(e) => setToolParams(e.target.value)}
                    style={{ width: '100%', background: 'rgba(8, 4, 16, 0.8)', color: '#fff', border: '1px solid var(--border-purple)', borderRadius: '8px', padding: '0.75rem', fontFamily: 'monospace' }}
                  />
                </div>
                <button
                  onClick={() => handleExecuteTool(toolsList[selectedToolIdx].name)}
                  style={{ background: 'linear-gradient(135deg, var(--accent-crimson), var(--accent-gold))', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Play size={16} /> Execute Tool Card
                </button>

                {toolOutput && (
                  <pre style={{ background: 'rgba(0,0,0,0.6)', padding: '1rem', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem' }}>
                    {JSON.stringify(toolOutput, null, 2)}
                  </pre>
                )}
              </div>
            )}

          </div>
        )}

        {/* TAB 5: AUTONOMOUS SHRINE */}
        {activeTab === 'agents' && (
          <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
            <div className="kamui-panel" style={{ width: '360px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-cinzel gradient-gold-text" style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={18} /> Schedule Task
              </h3>
              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Task title (e.g. Check AI News)"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  style={{ background: 'rgba(8, 4, 16, 0.8)', color: '#fff', border: '1px solid var(--border-purple)', padding: '0.65rem', borderRadius: '8px' }}
                />
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  style={{ background: 'rgba(8, 4, 16, 0.8)', color: '#fff', border: '1px solid var(--border-purple)', padding: '0.65rem', borderRadius: '8px' }}
                >
                  <option value="reminder">Reminder Alert</option>
                  <option value="news_monitor">Topic News Monitor</option>
                  <option value="file_organizer">File Organizer</option>
                </select>
                <input
                  type="text"
                  placeholder="Schedule / Interval (e.g. daily, hourly)"
                  value={taskSchedule}
                  onChange={(e) => setTaskSchedule(e.target.value)}
                  style={{ background: 'rgba(8, 4, 16, 0.8)', color: '#fff', border: '1px solid var(--border-purple)', padding: '0.65rem', borderRadius: '8px' }}
                />
                <button type="submit" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-gold))', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                  Schedule Autonomous Task
                </button>
              </form>
            </div>

            <div className="kamui-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 className="font-cinzel gradient-gold-text" style={{ fontSize: '1.1rem', fontWeight: '800' }}>Active Background Tasks</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                {autonomousTasks.map((t, idx) => (
                  <div key={idx} className="kamui-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{t.task_name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Type: <span style={{ color: 'var(--accent-gold)' }}>{t.task_type}</span> | Schedule: {t.cron_or_interval}
                      </p>
                    </div>
                    <span className="card-badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
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
