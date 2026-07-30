import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Brain, Cpu, Wrench, Sparkles, Terminal, Calendar, 
  Mail, Globe, Search, CheckCircle2, Clock, 
  Activity, Layers, Database, Plus, RefreshCw, Paperclip, 
  Compass, Folder, History as HistoryIcon, ArrowUpRight, Lightbulb, Image, Mic, ChevronDown, MoreHorizontal, Link2, Download, HelpCircle
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [memoryState, setMemoryState] = useState(null);
  const [toolsList, setToolsList] = useState([]);
  const [autonomousTasks, setAutonomousTasks] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // Selected tool state
  const [selectedTool, setSelectedTool] = useState('');
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
        content: "I encountered an issue connecting to Noa backend engine." 
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
    <div className="cortex-shell">
      
      {/* LEFT SIDEBAR (Matching Cortex UI) */}
      <aside className="cortex-sidebar">
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #c084fc, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>
              ✦
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-dark)' }}>Noa</span>
          </div>
          <button style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <Layers size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={() => setMessages([])}
          style={{
            background: 'var(--btn-black)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            padding: '0.75rem',
            fontWeight: '600',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}
        >
          <Plus size={18} /> New chat
        </button>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search"
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--text-light)', border: '1px solid #e2e8f0', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>⌘</span>
        </div>

        {/* Primary Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { id: 'chat', label: 'Explore', icon: Compass },
            { id: 'memory', label: 'Memory Deck', icon: Brain },
            { id: 'planner', label: 'Planner Arena', icon: Cpu },
            { id: 'tools', label: 'Tools Deck', icon: Wrench },
            { id: 'agents', label: 'Autonomous Tasks', icon: Activity }
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
                  gap: '0.65rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: active ? '#ede9fe' : 'transparent',
                  color: active ? '#7c3aed' : 'var(--text-muted)',
                  fontWeight: active ? '700' : '500',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon size={18} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* History Stream List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.82rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Today</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {["Create a detailed 7-day plan...", "Draft a concise email to...", "Analyze Eisenhower Matrix..."].map((item, idx) => (
                <div key={idx} style={{ color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0.2rem 0' }}>{item}</div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Yesterday</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {["Summarize main differences...", "Need to negotiate an extension..."].map((item, idx) => (
                <div key={idx} style={{ color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0.2rem 0' }}>{item}</div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase' }}>7 days</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {["Generate 5 effective morning...", "As a non-technical PM, list...", "Help me allocate 8 hours..."].map((item, idx) => (
                <div key={idx} style={{ color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0.2rem 0' }}>{item}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Profile Pill */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#c084fc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem' }}>
              N
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-dark)' }}>Noa User</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>noa@ai-engine.io</div>
            </div>
          </div>
          <ArrowUpRight size={16} color="var(--text-muted)" />
        </div>

      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Workspace Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.75rem', borderBottom: '1px solid #f1f0f7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#f8f6fc', padding: '0.35rem 0.75rem', borderRadius: '10px' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem' }}>✦</div>
            <span style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-dark)' }}>Noa Core v1.0</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><MoreHorizontal size={18} /></button>
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><Link2 size={18} /></button>
            <button style={{ border: '1px solid #e2e8f0', background: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--text-dark)' }}>
              <Download size={14} /> Export chat
            </button>
            <button style={{ background: 'var(--btn-black)', color: '#ffffff', border: 'none', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}>
              Upgrade
            </button>
          </div>
        </header>

        {/* MAIN DISPLAY CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
          
          {/* TAB 1: EXPLORE CHAT INTERFACE */}
          {activeTab === 'chat' && (
            <>
              {messages.length === 0 ? (
                /* Hero Section matching Cortex UI Image */
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <div className="purple-orb" />
                  <div style={{ fontSize: '1.25rem', color: '#a855f7', fontWeight: '600', marginTop: '1.25rem' }}>Hello, User</div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '0.2rem' }}>How can I assist you today?</h1>
                </div>
              ) : (
                /* Active Chat Stream */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  {messages.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '80%',
                        padding: '1rem 1.25rem',
                        borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: m.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#f8f6fc',
                        color: m.role === 'user' ? '#ffffff' : 'var(--text-dark)',
                        lineHeight: '1.6',
                        fontSize: '0.92rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                      }}>
                        {m.content}
                        {m.plan && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(0,0,0,0.08)', fontSize: '0.82rem' }}>
                            <strong style={{ color: '#7c3aed' }}>Goal:</strong> {m.plan.goal}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Floating Prompt Input Console (Cortex Style) */}
              <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
                <div className="cortex-prompt-box">
                  <textarea
                    rows={2}
                    placeholder="Ask me anything..."
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', fontSize: '0.95rem', fontFamily: 'inherit' }}
                  />

                  {/* Input Tools & Actions Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button className="pill-button pill-purple">
                        ⚛️ Deeper Research
                      </button>
                      <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><Image size={18} /></button>
                      <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><Lightbulb size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><Brain size={18} /></button>
                      <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><Globe size={18} /></button>
                      <button 
                        onClick={() => handleSendMessage()}
                        style={{ width: 36, height: 36, borderRadius: '50%', background: '#a855f7', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)' }}
                      >
                        <Mic size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Sub Action Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f0f7', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>✦ Saved prompts</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}><Paperclip size={14} /> Attach file</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Cards Grid matching Cortex UI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '850px', margin: '1rem auto 0 auto', width: '100%' }}>
                <div className="cortex-card" onClick={() => handleSendMessage("Synthesize my notes into 5 key bullet points for the team.")}>
                  <Clock size={18} color="var(--text-muted)" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--text-dark)' }}>Synthesize Data</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Turn meeting notes into 5 key bullet points for the team.</p>
                </div>

                <div className="cortex-card" onClick={() => handleSendMessage("Generate 3 creative taglines for a new AI project.")}>
                  <Lightbulb size={18} color="var(--text-muted)" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--text-dark)' }}>Creative Brainstorm</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Generate 3 taglines for a new sustainable brand or project.</p>
                </div>

                <div className="cortex-card" onClick={() => handleSendMessage("Check facts and vector memory for latest AI documentation.")}>
                  <Wrench size={18} color="var(--text-muted)" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--text-dark)' }}>Check Facts & Tools</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Compare key differences between memory facts & documentation.</p>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MEMORY DECK */}
          {activeTab === 'memory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }}>5-Layer Memory Deck</h2>
                <span style={{ fontSize: '0.82rem', color: '#7c3aed', background: '#ede9fe', padding: '0.3rem 0.75rem', borderRadius: '12px', fontWeight: '700' }}>Active Vector Sync</span>
              </div>

              {/* Memory Add Form */}
              <form onSubmit={handleAddMemory} style={{ background: '#f8f6fc', padding: '1rem', borderRadius: '16px', display: 'flex', gap: '0.75rem' }}>
                <select value={newMemLayer} onChange={(e) => setNewMemLayer(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <option value="long_term">Long-Term Memory</option>
                  <option value="semantic">Semantic Memory (Vector)</option>
                </select>
                <input type="text" placeholder="Subject / Category" value={newMemSubject} onChange={(e) => setNewMemSubject(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <input type="text" placeholder="Fact details..." value={newMemFact} onChange={(e) => setNewMemFact(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <button type="submit" style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: '700', cursor: 'pointer' }}>Save Card</button>
              </form>

              {/* Memory Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="cortex-card">
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#7c3aed' }}>1. Working Memory</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {memoryState?.working?.history?.map((h, i) => (
                      <div key={i} style={{ padding: '0.3rem 0', borderBottom: '1px solid #f1f0f7' }}><strong>{h.role}:</strong> {h.content.slice(0, 70)}...</div>
                    ))}
                  </div>
                </div>

                <div className="cortex-card">
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#7c3aed' }}>2. Long-Term Preferences</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {memoryState?.long_term?.map((lt, i) => (
                      <div key={i} style={{ padding: '0.3rem 0', borderBottom: '1px solid #f1f0f7' }}><strong>[{lt.category}]</strong> {lt.key}: {lt.value}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLANNER ARENA */}
          {activeTab === 'planner' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '1rem' }}>Autonomous Multi-Step Planner</h2>
              {currentPlan ? (
                <div className="cortex-card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#7c3aed' }}>Goal: {currentPlan.goal}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{currentPlan.thought}</p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No active plan loaded. Execute a query in Explore tab!</p>
              )}
            </div>
          )}

          {/* TAB 4: TOOLS DECK */}
          {activeTab === 'tools' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }}>12 Tool Execution Deck</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {toolsList.map((t, idx) => (
                  <div key={idx} className="cortex-card" onClick={() => setSelectedTool(t.name)}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#7c3aed' }}>{t.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUTONOMOUS TASKS */}
          {activeTab === 'agents' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '1rem' }}>Scheduled Background Tasks</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {autonomousTasks.map((t, idx) => (
                  <div key={idx} className="cortex-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: '700' }}>{t.task_name}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.task_type} | {t.cron_or_interval}</p>
                    </div>
                    <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '0.25rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700' }}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Sub-bar matching Cortex UI */}
          <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f0f7', paddingTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <div>Join the Noa community for more insights <a href="#" style={{ color: '#7c3aed', fontWeight: '700', textDecoration: 'none' }}>Join Discord</a></div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>文A</button>
              <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}><HelpCircle size={16} /></button>
            </div>
          </footer>

        </div>
      </div>

    </div>
  );
}
