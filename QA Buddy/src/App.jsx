import React, { useState, useEffect, useRef } from 'react'
import {
  Bot, User, Send, Settings, HelpCircle, FileText, Code,
  AlertTriangle, RefreshCw, Search, Terminal, Database,
  ArrowRight, Filter, CheckCircle2, FileCode,
  Share2, Layers, Network, Brain,
  AlertCircle, Zap, Shield, GitBranch, Users, Activity
} from 'lucide-react'

// ─── Source metadata ──────────────────────────────────────────────
const SOURCE_INFO = {
  "01_selenium_framework":  { name: "Selenium POM",    icon: FileCode,    color: "#8B5E3C" },
  "02_playwright_framework":{ name: "Playwright Spec", icon: Code,        color: "#C47A2B" },
  "03_test_cases":          { name: "Test Cases",      icon: Database,    color: "#6B4226" },
  "04_jira_tickets":        { name: "JIRA Tickets",    icon: AlertTriangle,color:"#A64028" },
  "05_company_docs":        { name: "Company Docs",    icon: FileText,    color: "#8B5E3C" },
  "06_figma_designs":       { name: "Figma Guides",    icon: FileText,    color: "#C47A2B" },
  "07_meeting_notes":       { name: "Transcripts",     icon: HelpCircle,  color: "#6B4226" },
  "08_lucid_charts":        { name: "Lucid Charts",    icon: Share2,      color: "#A0714F" },
  "09_prd_srs":             { name: "PRDs",            icon: FileText,    color: "#8B5E3C" },
  "10_jenkins_logs":        { name: "Jenkins Logs",    icon: Terminal,    color: "#5C3317" }
}

const SUGGESTIONS = [
  { text: "Why did build 482 fail?",                              filter: "10_jenkins_logs" },
  { text: "How does multi-factor authentication work in the PRD?",filter: "09_prd_srs"     },
  { text: "What is the POM wait strategy guidelines?",            filter: "05_company_docs" },
  { text: "What is POM pattern guidelines?",                      filter: "01_selenium_framework" }
]

// ─── RAG Pipeline stages ───────────────────────────────────────────
const PIPELINE_STAGES = [
  { id: 1, label: "Query Expansion",       sub: "LLM rewrite (3 variants)",       color: "#8B5E3C", icon: GitBranch },
  { id: 2, label: "Dual Embed (BGE-M3)",   sub: "1024d Dense + Sparse Weights",   color: "#C47A2B", icon: Layers   },
  { id: 3, label: "Qdrant Retrieval",      sub: "Semantic search on localhost:6333",color: "#6B4226", icon: Database },
  { id: 4, label: "Cross-Rerank",          sub: "bge-reranker-v2-m3",             color: "#A64028", icon: Filter   },
  { id: 5, label: "Gating Threshold",      sub: "Min Score: 0.22",                color: "#5C3317", icon: Shield   },
  { id: 6, label: "LLM Generation",        sub: "Groq / llama-3.3-70b",           color: "#4A7C59", icon: Brain    },
]

// ─── Use Case Data ─────────────────────────────────────────────────
const USE_CASES = [
  {
    id: "uc1",
    label: "Ask About Test Failures",
    actor: "QA Engineer",
    icon: "🧪",
    roleColor: "#8B5E3C",
    desc: "Query Jenkins build logs and test execution histories to diagnose failure stack traces.",
    inputs: "Build numbers, stack trace snippets, test method names",
    output: "Root cause analysis with line citations"
  },
  {
    id: "uc2",
    label: "Query JIRA Tickets & Bugs",
    actor: "QA Engineer",
    icon: "🎫",
    roleColor: "#8B5E3C",
    desc: "Search past bug reports, resolution steps, and comment threads across sprint histories.",
    inputs: "Bug keywords, component names, defect IDs",
    output: "Relevant tickets with status & comment summaries"
  },
  {
    id: "uc3",
    label: "Search POM Framework Code",
    actor: "Developer",
    icon: "💻",
    roleColor: "#4A6E8A",
    desc: "Retrieve Selenium Java or Playwright TypeScript page objects, locators, and spec files.",
    inputs: "Page names, locator strategies, helper method queries",
    output: "Exact code snippets with repo & line references"
  },
  {
    id: "uc4",
    label: "Ingest & Index Documents",
    actor: "Admin",
    icon: "⚙️",
    roleColor: "#C47A2B",
    desc: "Process repos, PRDs, and logs into Qdrant vector store running at http://localhost:6333.",
    inputs: "Directory paths, file types, metadata tags",
    output: "Indexed vector collection with point counts"
  },
  {
    id: "uc5",
    label: "Review Grounded Citations",
    actor: "QA Engineer",
    icon: "🛡️",
    roleColor: "#8B5E3C",
    desc: "Verify generated answers against source files using bracketed [1], [2] metadata tags.",
    inputs: "LLM generated answer token stream",
    output: "Clickable file cards with exact line & page numbers"
  },
  {
    id: "uc6",
    label: "Filter by QA Source Type",
    actor: "QA Engineer",
    icon: "🎯",
    roleColor: "#8B5E3C",
    desc: "Restrict semantic search to specific repositories like POM frameworks, PRDs, or JIRA.",
    inputs: "Source category chip selection",
    output: "Filtered candidate set in Qdrant query"
  },
  {
    id: "uc7",
    label: "Inspect RAG Pipeline & Vectors",
    actor: "Developer",
    icon: "🔍",
    roleColor: "#4A6E8A",
    desc: "Analyze vector retrieval scores, reranking candidate lists, and gating thresholds.",
    inputs: "Visual RAG pipeline stage click",
    output: "Live stage inspection & candidate relevance scores"
  },
  {
    id: "uc8",
    label: "Configure Qdrant & Embeddings",
    actor: "Admin",
    icon: "🔧",
    roleColor: "#C47A2B",
    desc: "Manage Qdrant server connection, vector dimensions, chunk size, and Groq API keys.",
    inputs: "Environment variables (.env), chunk parameters",
    output: "Updated store configuration & status metrics"
  }
]

// ─── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'architecture'
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([{
    sender: 'ai',
    text: 'Hello! I am QABuddy.AI — your grounded QA copilot powered by Qdrant (http://localhost:6333) and Groq. Ask me anything about POM frameworks, test cases, JIRA tickets, PRDs, or Jenkins build logs.',
    isFirst: true
  }])
  const [activeFilter, setActiveFilter] = useState(null)
  const [isQuerying, setIsQuerying] = useState(false)
  const [activeStage, setActiveStage] = useState(0)
  const [currentTrace, setCurrentTrace] = useState(null)
  const [selectedInspectStage, setSelectedInspectStage] = useState(1)
  const [status, setStatus] = useState(null)
  const [selectedRole, setSelectedRole] = useState('All')
  const [selectedUsecase, setSelectedUsecase] = useState(null)

  const chatEndRef = useRef(null)
  const backendUrl = window.location.origin

  useEffect(() => { fetchStatus() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/status`)
      if (res.ok) {
        const ct = res.headers.get('content-type')
        if (ct?.includes('application/json')) {
          const data = await res.json()
          setStatus(data)
        }
      }
    } catch (err) {
      console.error('Status fetch error:', err)
    }
  }

  const handleQuery = async (queryText, filterSource = activeFilter) => {
    if (!queryText.trim() || isQuerying) return
    setIsQuerying(true)
    setQuery('')
    const userMsg = { sender: 'user', text: queryText, filter: filterSource }
    setMessages(prev => [...prev, userMsg])
    const aiMsgId = Date.now()
    setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '', isStreaming: true }])
    setActiveStage(1)
    setCurrentTrace(null)
    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, source_filter: filterSource })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let aiResponseText = ''
      let citationsList = []
      let traceData = null
      let modelUsed = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.trim()) continue
          if (line.startsWith('event:')) {
            const eventType = line.replace('event:', '').trim()
            if (eventType === 'pipeline') {
              const nextLine = lines[lines.indexOf(line) + 1]
              if (nextLine?.startsWith('data:')) {
                const data = JSON.parse(nextLine.replace('data:', '').trim())
                if (data.status === 'searching') setActiveStage(2)
                else if (data.status === 'reranked') { setActiveStage(4); traceData = data; setCurrentTrace(data) }
                else if (data.status === 'generating') setActiveStage(6)
                else if (data.status === 'gated') setActiveStage(5)
              }
            } else if (eventType === 'done') {
              const nextLine = lines[lines.indexOf(line) + 1]
              if (nextLine?.startsWith('data:')) {
                const data = JSON.parse(nextLine.replace('data:', '').trim())
                citationsList = data.citations
                modelUsed = data.model
              }
            }
          } else if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.replace('data:', '').trim())
              if (data.token) {
                aiResponseText += data.token
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiResponseText } : m))
              }
            } catch (e) {}
          }
        }
      }
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiResponseText, isStreaming: false, citations: citationsList, model: modelUsed, trace: traceData } : m))
      setActiveStage(0)
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `Error: ${error.message}. Please check GROQ_API_KEY and backend logs.`, isStreaming: false, isError: true } : m))
      setActiveStage(0)
    } finally {
      setIsQuerying(false)
    }
  }

  const getSourceDisplay = (sourceType) => SOURCE_INFO[sourceType] || { name: sourceType, icon: FileText, color: "#8B5E3C" }

  // ─── Render Left Panel ───────────────────────────────────────────
  const renderLeftPanel = () => (
    <div style={{ margin: '12px 6px 12px 12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border-color)' }} className="glass">

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#FDF8F0" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="text-gradient-warm">
              QABuddy.AI
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grounded QA Copilot</p>
          </div>
        </div>
        <div className="tab-bar">
          {[
            { id: 'chat',         icon: Bot,      label: 'QA Chat' },
            { id: 'architecture', icon: Network,  label: 'Architecture' },
          ].map(t => (
            <button key={t.id} className={`tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Left panel content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'chat' ? renderChatLeftPanel() : renderArchLeftPanel()}
      </div>
    </div>
  )

  const renderChatLeftPanel = () => (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Visual RAG Pipeline</h2>
      {PIPELINE_STAGES.map((stage, idx) => {
        const isActive = activeStage === stage.id
        const isSelected = selectedInspectStage === stage.id
        return (
          <React.Fragment key={stage.id}>
            <div
              onClick={() => setSelectedInspectStage(stage.id)}
              className={`pipeline-step ${isSelected ? 'selected' : ''} ${isActive ? 'node-active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${stage.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${stage.color}`, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: stage.color }}>{stage.id}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-color)' }}>{stage.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stage.sub}</div>
                </div>
                {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }} />}
              </div>
            </div>
            {idx < PIPELINE_STAGES.length - 1 && <div className="pipeline-connector" />}
          </React.Fragment>
        )
      })}

      {/* Stage Inspector */}
      <div style={{ marginTop: 8, padding: '14px', background: 'rgba(139,94,60,0.06)', borderRadius: 12, border: '1px solid var(--border-color)', minHeight: 100 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Stage {selectedInspectStage} Inspector
        </div>
        <StageInspector stage={selectedInspectStage} trace={currentTrace} />
      </div>

      {/* Server Status info */}
      <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(139,94,60,0.04)', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: '0.74rem' }}>
        <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Qdrant Vector Server</div>
        <div style={{ color: 'var(--text-muted)' }}>URL: <code style={{ color: 'var(--secondary)' }}>http://localhost:6333</code></div>
        <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>Points Count: <strong style={{ color: 'var(--text-color)' }}>{status?.qdrant?.points_count || 0}</strong></div>
      </div>
    </div>
  )

  const renderArchLeftPanel = () => (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>System Overview</h2>
      <div style={{ padding: '12px', background: 'rgba(139,94,60,0.05)', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>Architecture Spec</div>
        <p style={{ lineHeight: 1.5, fontSize: '0.76rem' }}>QABuddy.AI provides grounded answers over software testing repositories using dual dense + sparse retrieval and relevance gating.</p>
      </div>

      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Filter Use Cases by Role:</div>
      {['All', 'QA Engineer', 'Developer', 'Admin'].map((role) => (
        <button
          key={role}
          onClick={() => setSelectedRole(role)}
          className={`btn-secondary ${selectedRole === role ? 'active' : ''}`}
          style={{
            justify: 'flex-start',
            padding: '8px 12px',
            fontSize: '0.78rem',
            background: selectedRole === role ? 'var(--primary)' : 'rgba(139,94,60,0.06)',
            color: selectedRole === role ? '#FDF8F0' : 'var(--text-color)',
            border: selectedRole === role ? 'none' : '1px solid var(--border-color)',
            fontWeight: selectedRole === role ? 700 : 500
          }}
        >
          {role === 'QA Engineer' ? '🧪 ' : role === 'Developer' ? '💻 ' : role === 'Admin' ? '⚙️ ' : '🌐 '}{role}
        </button>
      ))}

      <a href="/docs/architecture.html" target="_blank" className="btn-primary" style={{ marginTop: 10, textDecoration: 'none', justifyContent: 'center' }}>
        <FileText size={14} /> Open Full Tech Docs
      </a>
    </div>
  )

  // ─── Right pane: Chat or Architecture ─────────────────────────────
  const renderRightPane = () => {
    if (activeTab === 'chat') return renderChatPane()
    if (activeTab === 'architecture') return renderArchitecturePage()
    return null
  }

  const renderChatPane = () => (
    <div style={{ margin: '12px 12px 12px 6px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 24px)', overflow: 'hidden' }}>

      {/* Chat header */}
      <div className="glass" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 38, height: 38, borderRadius: '11px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px var(--primary-glow)' }}>
            <Bot size={20} color="#FDF8F0" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              QABuddy.AI
              <span className="badge badge-amber">Grounded QA</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={11} style={{ color: 'var(--success)' }} />
              Qdrant (localhost:6333) + Groq Active
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href="/docs/architecture.html" target="_blank" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', textDecoration: 'none', color: 'var(--text-color)' }}>
            <FileText size={12} /> Tech Spec
          </a>
        </div>
      </div>

      {/* Source filter chips */}
      <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px', minHeight: '36px' }}>
        <div onClick={() => setActiveFilter(null)} className={`source-chip ${activeFilter === null ? 'active' : ''}`}>All Sources</div>
        {Object.entries(SOURCE_INFO).map(([key, info]) => {
          const Icon = info.icon
          return (
            <div key={key} onClick={() => setActiveFilter(activeFilter === key ? null : key)} className={`source-chip ${activeFilter === key ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon size={11} style={{ color: activeFilter === key ? '#FDF8F0' : info.color }} />
              {info.name}
            </div>
          )
        })}
      </div>

      {/* Messages */}
      <div className="glass" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '10px' }}>
        {messages.map((msg, i) => {
          const isAi = msg.sender === 'ai'
          return (
            <div key={i} style={{ display: 'flex', gap: '12px', alignSelf: isAi ? 'flex-start' : 'flex-end', maxWidth: '88%', animation: `slideInUp 0.3s ease` }}>
              {isAi && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,94,60,0.12)', border: '1.5px solid rgba(139,94,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} style={{ color: 'var(--primary)' }} />
                </div>
              )}
              <div>
                <div className={isAi ? 'bubble-ai' : 'bubble-user'} style={{ padding: '14px 18px', fontSize: '0.9rem', lineHeight: '1.55', whiteSpace: 'pre-wrap', color: msg.isError ? 'var(--danger)' : 'var(--text-color)' }}>
                  {msg.text}
                  {msg.isStreaming && <span style={{ display: 'inline-block', width: '2px', height: '13px', background: 'var(--primary)', marginLeft: '4px', animation: 'pulseGlow 1s infinite' }} />}
                </div>
                {isAi && msg.citations?.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Citations:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {msg.citations.map((c, idx) => {
                        const pl = c.payload
                        const display = getSourceDisplay(pl.source_type)
                        const Icon = display.icon
                        let label = `[${idx+1}] `
                        if (pl.path) label += osPathBasename(pl.path)
                        if (pl.line_start) label += `:L${pl.line_start}`
                        if (pl.page) label += `:P${pl.page}`
                        if (pl.ticket_key) label += pl.ticket_key
                        if (pl.tc_id) label += pl.tc_id
                        return (
                          <div key={idx} className="citation-badge" title={pl.text} style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setSelectedInspectStage(6)}>
                            <Icon size={9} style={{ color: display.color }} />{label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {isAi && msg.model && (
                  <div style={{ marginTop: '6px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    via <span style={{ color: 'var(--primary)' }}>{msg.model}</span>
                  </div>
                )}
              </div>
              {!isAi && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(196,122,43,0.12)', border: '1.5px solid rgba(196,122,43,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={16} style={{ color: 'var(--secondary)' }} />
                </div>
              )}
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          {SUGGESTIONS.map((s, idx) => (
            <div key={idx} onClick={() => { setActiveFilter(s.filter); handleQuery(s.text, s.filter) }} className="glass" style={{ padding: '11px 14px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease', border: '1px solid var(--border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text-color)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
              <span>{s.text}</span>
              <ArrowRight size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={e => { e.preventDefault(); handleQuery(query) }} className="glass" style={{ padding: '11px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={activeFilter ? `Ask in ${getSourceDisplay(activeFilter).name}…` : "Ask a grounded question across all QA sources…"}
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '0.9rem', outline: 'none' }}
          disabled={isQuerying} />
        <button type="submit" disabled={isQuerying || !query.trim()} style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 14px var(--primary-glow)', opacity: (isQuerying || !query.trim()) ? 0.45 : 1, transition: 'opacity 0.2s' }}>
          {isQuerying ? <RefreshCw size={14} color="#FDF8F0" className="spin" /> : <Send size={14} color="#FDF8F0" />}
        </button>
      </form>
    </div>
  )

  // ─── Architecture View ───────────────────────────────────────────
  const renderArchitecturePage = () => {
    const filteredUseCases = selectedRole === 'All'
      ? USE_CASES
      : USE_CASES.filter(uc => uc.actor === selectedRole)

    return (
      <div className="arch-container" style={{ margin: '12px 12px 12px 6px', height: 'calc(100vh - 24px)', overflowY: 'auto' }}>

        {/* Top title card */}
        <div className="arch-card" style={{ animation: 'slideInUp 0.35s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-brown" style={{ marginBottom: 8 }}>System Architecture & Use Cases</span>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }} className="text-gradient-warm">
                QABuddy.AI Architecture Specifications
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Multi-source QA copilot powered by Qdrant (http://localhost:6333) vector retrieval and Groq LLMs
              </p>
            </div>
            <a href="/docs/architecture.html" target="_blank" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <FileText size={14} /> Open Full HTML Specs
            </a>
          </div>
        </div>

        {/* Clean Use Case Mapping Section */}
        <div className="arch-card" style={{ animation: 'slideInUp 0.4s ease 0.1s backwards' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2>🎯 Use Case & Actor Directory</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                System interaction boundary for QA Engineers, Developers, and Admins
              </p>
            </div>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'QA Engineer', 'Developer', 'Admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className="source-chip"
                  style={{
                    background: selectedRole === r ? 'var(--primary)' : 'rgba(139,94,60,0.06)',
                    color: selectedRole === r ? '#FDF8F0' : 'var(--text-muted)',
                    fontWeight: selectedRole === r ? 700 : 500
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Actor Role Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { role: 'QA Engineer', emoji: '🧪', col: '#8B5E3C', desc: 'Queries test results, JIRA bugs, requirements, and checks grounded citations.' },
              { role: 'Developer',   emoji: '💻', col: '#4A6E8A', desc: 'Searches Selenium/Playwright POM code and inspects vector retrieval scores.' },
              { role: 'Admin',       emoji: '⚙️', col: '#C47A2B', desc: 'Indexes QA documents and manages Qdrant vector server (http://localhost:6333).' },
            ].map(a => (
              <div
                key={a.role}
                onClick={() => setSelectedRole(selectedRole === a.role ? 'All' : a.role)}
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  border: `1.5px solid ${selectedRole === a.role || selectedRole === 'All' ? a.col : 'var(--border-color)'}`,
                  background: selectedRole === a.role ? `${a.col}12` : 'rgba(255,250,244,0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.3rem' }}>{a.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: a.col }}>{a.role}</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{a.desc}</div>
              </div>
            ))}
          </div>

          {/* System Boundary Container */}
          <div className="usecase-system-box" style={{ background: 'rgba(255,250,244,0.6)', padding: '24px 20px 20px' }}>
            <div className="usecase-system-label">QABuddy.AI System Boundary</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {filteredUseCases.map((uc) => {
                const isSelected = selectedUsecase?.id === uc.id
                return (
                  <div
                    key={uc.id}
                    onClick={() => setSelectedUsecase(isSelected ? null : uc)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? uc.roleColor : 'var(--border-color)'}`,
                      background: isSelected ? `${uc.roleColor}10` : '#fff',
                      boxShadow: isSelected ? `0 4px 16px ${uc.roleColor}20` : '0 2px 8px rgba(44,26,14,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-color)' }}>
                        <span>{uc.icon}</span> {uc.label}
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${uc.roleColor}15`, color: uc.roleColor, border: `1px solid ${uc.roleColor}30` }}>
                        {uc.actor}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {uc.desc}
                    </div>

                    {isSelected && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-color)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <div>📥 <strong>Inputs:</strong> {uc.inputs}</div>
                        <div style={{ marginTop: 4 }}>📤 <strong>Output:</strong> {uc.output}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Data Flow Architecture */}
        <div className="arch-card" style={{ animation: 'slideInUp 0.5s ease 0.2s backwards' }}>
          <h2>🏗️ Data Flow Architecture</h2>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>📥 Ingestion Pipeline (Local CLI)</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
            {[
              { label: 'PDF Files',      color: '#8B5E3C', icon: '📄' },
              { label: 'PDF Parser',     color: '#C47A2B', icon: '🔍' },
              { label: 'Chunking',       color: '#6B4226', icon: '✂️'  },
              { label: 'Nomic Embed',    color: '#5C3317', icon: '🔢' },
              { label: 'Qdrant Store',   color: '#4A7C59', icon: '💾' },
            ].map((node, i, arr) => (
              <React.Fragment key={node.label}>
                <div style={{ padding: '8px 14px', borderRadius: '8px', background: `${node.color}12`, border: `1.5px solid ${node.color}40`, fontSize: '0.78rem', fontWeight: 600, color: node.color, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                  {node.icon} {node.label}
                </div>
                {i < arr.length - 1 && <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </React.Fragment>
            ))}
          </div>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>🔎 Query Pipeline (Live Server)</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'User Query',      color: '#8B5E3C', icon: '👤' },
              { label: 'Query Embed',     color: '#C47A2B', icon: '🔢' },
              { label: 'Qdrant Search',   color: '#6B4226', icon: '🔍' },
              { label: 'Top-K Chunks',    color: '#5C3317', icon: '📋' },
              { label: 'Groq LLM',        color: '#4A7C59', icon: '🧠' },
              { label: 'Cited Answer',    color: '#8B5E3C', icon: '✅' },
            ].map((node, i, arr) => (
              <React.Fragment key={node.label}>
                <div style={{ padding: '8px 14px', borderRadius: '8px', background: `${node.color}12`, border: `1.5px solid ${node.color}40`, fontSize: '0.78rem', fontWeight: 600, color: node.color, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                  {node.icon} {node.label}
                </div>
                {i < arr.length - 1 && <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Data Sources Table */}
        <div className="arch-card" style={{ animation: 'slideInUp 0.5s ease 0.3s backwards' }}>
          <h2>📁 Data Sources & Chunking Strategies</h2>
          <table className="arch-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Source Name</th>
                <th>Format</th>
                <th>Chunking Strategy</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['01', 'Selenium POM Repo',    'Java (.java)',   'Class/Method scope parsing. Separate chunks per method block with header paths.'],
                ['02', 'Playwright POM Repo',  'TS/JS (.ts)',    'Block scope parsing. Splits by spec definitions (describe / test blocks).'],
                ['03', 'Test Cases Database',  'CSV',            '1 row = 1 chunk. Key-value field serialization preserving column associations.'],
                ['04', 'JIRA Tickets',          'JSON',           '1 ticket = 1 chunk. Bundles description, status, and comment threads.'],
                ['05', 'Company Guidelines',    'Markdown / PDF', 'Heading-aware recursive splitter. 512 token blocks with 15% overlap.'],
                ['06', 'Figma Layout Specs',    'Markdown',       'Section-based guidelines mapping elements and color tokens.'],
                ['07', 'Meeting Transcripts',   'Text Dialogue',  '15-line speaker turn sliding windows with 3-line overlaps.'],
                ['08', 'Lucid Flowcharts',      'Text Exports',   'Element link and connection flow-based text splitting.'],
                ['09', 'PRDs / Requirements',   'PDF / MD',       'Page-by-page PDF text extraction. Citations carry original PDF page numbers.'],
                ['10', 'Jenkins Build Logs',    'Log Files',      'Error block extractors capturing stack traces + 5 context lines.'],
              ].map(([num, name, fmt, strategy]) => (
                <tr key={num}>
                  <td>{num}</td>
                  <td style={{ color: 'var(--text-color)', fontWeight: 600 }}>{name}</td>
                  <td><code>{fmt}</code></td>
                  <td>{strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hyperparameters */}
        <div className="arch-card" style={{ animation: 'slideInUp 0.5s ease 0.4s backwards' }}>
          <h2>⚙️ Key Pipeline Hyperparameters</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Embedding Model',    value: 'nomic-embed-text-v1.5 / BGE-M3', icon: '🔢' },
              { label: 'Vector Server',      value: 'Qdrant (http://localhost:6333)',  icon: '📦' },
              { label: 'Similarity Metric',  value: 'Cosine distance',                 icon: '📏' },
              { label: 'Chunk Size',         value: '500 chars (configurable)',        icon: '✂️'  },
              { label: 'Chunk Overlap',      value: '100 chars (configurable)',        icon: '🔗' },
              { label: 'Top-K Retrieval',    value: '4 nearest chunks',                icon: '🎯' },
              { label: 'LLM Provider',       value: 'Groq (llama-3.3-70b)',           icon: '🧠' },
              { label: 'Context Budget',     value: '~3k tokens per request',          icon: '💬' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'rgba(139,94,60,0.04)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-color)', fontWeight: 600, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="dashboard-grid">
      {renderLeftPanel()}
      {renderRightPane()}
    </div>
  )
}

// ─── Stage Inspector Component ─────────────────────────────────────
function StageInspector({ stage, trace }) {
  const info = {
    1: { desc: 'Query expansion rewrites queries using LLM to improve recall via 3 semantic variations.' },
    2: { desc: 'Nomic embed encodes text into dense vectors for semantic similarity search.' },
    3: { desc: 'Qdrant server at http://localhost:6333 executes cosine similarity search over collection.' },
    4: { desc: 'Cross-encoder re-ranks fused outputs by precise context alignment. Sorts top-12.' },
    5: { desc: 'Threshold gating filters out chunks with relevance scores below 0.22.' },
    6: { desc: 'Groq LLM generates final answer citing valid contexts with bracketed indices [1], [2].' },
  }
  const d = info[stage]
  return (
    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.55' }}>
      <p>{d?.desc}</p>
      {trace && stage === 4 && trace.all_candidates && (
        <div style={{ marginTop: '8px', overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '3px 6px', color: 'var(--text-muted)' }}>Source</th>
                <th style={{ padding: '3px 6px', color: 'var(--text-muted)' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {trace.all_candidates.slice(0, 4).map((c, i) => (
                <tr key={i}>
                  <td style={{ padding: '3px 6px', color: 'var(--text-secondary)' }}>{c.payload?.source_type}</td>
                  <td style={{ padding: '3px 6px', color: 'var(--primary)', fontWeight: 700 }}>{c.relevance_score?.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {trace && stage === 5 && trace.all_candidates?.[0] && (
        <div style={{ marginTop: '8px' }}>
          Top score: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{trace.all_candidates[0].relevance_score?.toFixed(4)}</span> vs threshold 0.22 →{' '}
          <span style={{ color: trace.all_candidates[0].relevance_score >= 0.22 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
            {trace.all_candidates[0].relevance_score >= 0.22 ? 'PASSED ✓' : 'GATED ✗'}
          </span>
        </div>
      )}
      {!trace && <p style={{ fontStyle: 'italic', marginTop: '6px', fontSize: '0.72rem' }}>No active query trace. Ask a question to see live data.</p>}
    </div>
  )
}

function osPathBasename(pathStr) {
  if (!pathStr) return ''
  const parts = pathStr.split(/[\\\/]/)
  return parts[parts.length - 1]
}
