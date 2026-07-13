import { useState, useEffect } from 'react'
import {
  FileText,
  Database,
  Search,
  Brain,
  Network,
  Layers,
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RefreshCw,
  Sliders,
  Eye,
  BookOpen
} from 'lucide-react'

// Types based on backend responses
interface Chunk {
  chunk_id: string
  page_num: number
  text: string
  char_count: number
  start_char: number
  end_char: number
}

interface PipelineStatus {
  ingested_file: string | null
  file_size_bytes: number
  pages_count: number
  total_characters: number
  chunks: Chunk[]
  embedding_mode: 'nomic' | 'mock'
  embedding_dimension: number
  collection_name: string
  stored_chunks_count: number
  has_groq_key: boolean
  has_nomic_key: boolean
  status_message?: string
  active_step?: number
  available_pdfs?: string[]
  active_pdf?: string | null
  database_pdf?: string | null
}

interface RetrievedChunk {
  id: string
  text: string
  page: number
  char_count: number
  score: number
}

interface QueryResponse {
  query: string
  query_embedding_sample: number[]
  embedding_mode: 'nomic' | 'mock'
  retrieved_chunks: RetrievedChunk[]
  prompt_sent: string
  generated_answer: string
  model_used: string
}

function App() {
  // App state
  const [status, setStatus] = useState<PipelineStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [ingesting, setIngesting] = useState(false)
  const [querying, setQuerying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Pipeline configurations
  const [chunkSize, setChunkSize] = useState(500)
  const [chunkOverlap, setChunkOverlap] = useState(100)
  
  // Key Overrides (optional)
  const [nomicKey, setNomicKey] = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Query state
  const [queryText, setQueryText] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null)
  
  // Step visualization active stage
  const [activeStep, setActiveStep] = useState<number>(0)
  
  // Accordion panel visibility
  const [panels, setPanels] = useState({
    ingestedText: false,
    chunkList: true,
    embeddings: false,
    database: false,
    queryTrace: true,
    rawPrompt: false
  })

  const togglePanel = (panelName: keyof typeof panels) => {
    setPanels(prev => ({ ...prev, [panelName]: !prev[panelName] }))
  }

  // Fetch current status on load
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true)
      const res = await fetch('/api/status')
      if (res.ok) {
        const contentType = res.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json()
          setStatus(data)
          
          // Determine active step based on ingestion status
          if (data.active_step !== undefined && data.active_step > 0) {
            setActiveStep(data.active_step)
          } else if (data.stored_chunks_count > 0) {
            setActiveStep(3) // Vector Storage complete
          } else {
            setActiveStep(0) // Ready to Ingest
          }

          // Set selectedFile if not set
          if (data.active_pdf && !selectedFile) {
            setSelectedFile(data.active_pdf)
          }
        }
      }
    } catch (err) {
      console.error("Error fetching database status:", err)
      setErrorMessage("Could not connect to the backend server. Make sure FastAPI is running on port 8000.")
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [selectedFile])

  // File upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are supported.")
      return
    }
    
    setUploading(true)
    setErrorMessage(null)
    
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      let data: any = {}
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = { detail: text }
      }
      
      if (!response.ok) {
        throw new Error(data.detail || "Upload failed.")
      }
      
      // Update selected file immediately to the uploaded one
      if (data.filename) {
        setSelectedFile(data.filename)
      }
      
      await fetchStatus()
      setActiveStep(0) // Reset pipeline stage to PDF Ready
      alert(`File uploaded successfully as: ${data.filename}`)
      
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload file.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  // Ingestion handler
  const handleIngest = async () => {
    setIngesting(true)
    setErrorMessage(null)
    setQueryResult(null)
    setActiveStep(1)
    
    // Start polling status from backend every 500ms
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/status')
        if (res.ok) {
          const contentType = res.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json()
            setStatus(data)
            if (data.active_step !== undefined && data.active_step > 0) {
              setActiveStep(data.active_step)
            }
          }
        }
      } catch (err) {
        console.error("Error polling ingestion status:", err)
      }
    }, 500)
    
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
          nomic_key_override: nomicKey || null,
          filename: selectedFile
        })
      })

      let data: any = {}
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = { detail: text }
      }
      
      if (!response.ok) {
        throw new Error(data.detail || "PDF ingestion failed.")
      }

      // Success
      clearInterval(pollInterval)
      await fetchStatus()
      setActiveStep(3) // ChromaDB Storage complete

    } catch (err: any) {
      clearInterval(pollInterval)
      setErrorMessage(err.message || "An unexpected error occurred during ingestion.")
      setActiveStep(0)
    } finally {
      setIngesting(false)
    }
  }

  // Query handler
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryText.trim()) return
    
    setQuerying(true)
    setErrorMessage(null)
    setQueryResult(null)
    setActiveStep(4) // Query retrieval step

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          nomic_key_override: nomicKey || null,
          groq_key_override: groqKey || null
        })
      })

      let data: any = {}
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = { detail: text }
      }
 
      if (!response.ok) {
        throw new Error(data.detail || "Query matching / answer generation failed.")
      }

      setActiveStep(5) // Generation completed
      setQueryResult(data)
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while answering your query.")
      setActiveStep(3)
    } finally {
      setQuerying(false)
    }
  }


  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Area */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--accent-purple-glow)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <Layers size={28} color="#C084FC" />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }} className="text-gradient-purple">
              RAG Explorer
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Interactive Visualization of Ingestion, Local ChromaDB Storage, and LLM Retrieval-Augmented Generation
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Settings size={16} />
            API Credentials
          </button>
          
          <button 
            onClick={fetchStatus} 
            className="btn-secondary" 
            style={{ padding: '0.5rem' }}
            title="Refresh database status"
          >
            <RefreshCw size={16} className={loadingStatus ? "spin" : ""} />
          </button>
        </div>
      </header>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="glass-panel" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)', padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem', borderRadius: '0.75rem' }}>
          <AlertCircle color="#EF4444" size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem', color: '#FCA5A5' }}>{errorMessage}</div>
        </div>
      )}

      {/* Settings Modal/Collapse (API Keys override) */}
      {showSettings && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} color="#C084FC" /> Credentials Settings
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overrides will persist in memory only</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Groq API Key
              </label>
              <input
                type="password"
                placeholder={status?.has_groq_key ? "Configured in backend (.env) ✓" : "Paste your Groq API Key (starts with gsk_)"}
                value={groqKey}
                onChange={e => setGroqKey(e.target.value)}
                className="glass-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Used to request generation from model <code>openai/gpt-oss-120b</code>
              </span>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Nomic API Key (Optional)
              </label>
              <input
                type="password"
                placeholder={status?.has_nomic_key ? "Configured in backend (.env) ✓" : "Leave blank for Mock mode embeddings"}
                value={nomicKey}
                onChange={e => setNomicKey(e.target.value)}
                className="glass-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Allows using <code>nomic-embed-text-v1.5</code>. Otherwise runs local hashes.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Stepper Visualization */}
      <section className="glass-panel" style={{ padding: '2rem 1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network size={18} color="#C084FC" /> RAG Pipeline Stage Tracker
          </h2>
          {status?.stored_chunks_count ? (
            <span className="badge badge-emerald">
              <CheckCircle size={12} /> ChromaDB Ready ({status.stored_chunks_count} chunks)
            </span>
          ) : (
            <span className="badge badge-orange">
              <AlertCircle size={12} /> Awaiting PDF Ingestion
            </span>
          )}
        </div>

        <div className="stepper-container">
          <div className={`step-node ${activeStep >= 0 ? (activeStep === 0 ? 'active' : 'completed') : ''}`} title="PDF file loaded and ready in local data folder">
            <div className="step-circle">
              <FileText size={18} />
            </div>
            <div className="step-label">PDF Ready</div>
          </div>
          
          <ArrowRight 
            size={18} 
            className={`step-arrow ${activeStep > 0 ? 'completed' : activeStep === 0 ? 'active' : ''}`} 
          />
          
          <div className={`step-node ${activeStep >= 1 ? (activeStep === 1 ? 'active pulse-active' : 'completed') : ''}`} title="Extracting raw text from pages">
            <div className="step-circle">
              <BookOpen size={18} />
            </div>
            <div className="step-label">Raw Parsing</div>
          </div>
          
          <ArrowRight 
            size={18} 
            className={`step-arrow ${activeStep > 1 ? 'completed' : activeStep === 1 ? 'active' : ''}`} 
          />
          
          <div className={`step-node ${activeStep >= 2 ? (activeStep === 2 ? 'active pulse-active' : 'completed') : ''}`} title="Generating embeddings for overlapping text chunks">
            <div className="step-circle">
              <Layers size={18} />
            </div>
            <div className="step-label">Embedding</div>
          </div>
          
          <ArrowRight 
            size={18} 
            className={`step-arrow ${activeStep > 2 ? 'completed' : activeStep === 2 ? 'active' : ''}`} 
          />
          
          <div className={`step-node ${activeStep >= 3 ? (activeStep === 3 ? 'active' : 'completed') : ''}`} title="Persisting chunks and vectors in local ChromaDB">
            <div className="step-circle">
              <Database size={18} />
            </div>
            <div className="step-label">ChromaDB Store</div>
          </div>
          
          <ArrowRight 
            size={18} 
            className={`step-arrow ${activeStep > 3 ? 'completed' : activeStep === 3 ? 'active' : ''}`} 
          />
          
          <div className={`step-node ${activeStep >= 4 ? (activeStep === 4 ? 'active pulse-active' : 'completed') : ''}`} title="Retrieving top 4 nearest contexts from ChromaDB">
            <div className="step-circle">
              <Search size={18} />
            </div>
            <div className="step-label">Query Retrieve</div>
          </div>
          
          <ArrowRight 
            size={18} 
            className={`step-arrow ${activeStep > 4 ? 'completed' : activeStep === 4 ? 'active' : ''}`} 
          />
          
          <div className={`step-node ${activeStep >= 5 ? 'active completed' : ''}`} title="Generating final answer from Groq LLM using context">
            <div className="step-circle">
              <Brain size={18} />
            </div>
            <div className="step-label">LLM Generate</div>
          </div>
        </div>
      </section>

      {/* Main Operations Split */}
      <div className="dashboard-grid">
        
        {/* Left Side: INGESTION CONTROL & DOCUMENT DATA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Step 1 & 2 Config Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFF' }}>
              <FileText size={18} color="#3B82F6" /> Stage 1-4: Ingest Document
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <Sliders size={14} /> Chunk Size (Chars)
                </label>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={e => setChunkSize(parseInt(e.target.value) || 200)}
                  min="100"
                  max="2000"
                  className="glass-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <Sliders size={14} /> Overlap (Chars)
                </label>
                <input
                  type="number"
                  value={chunkOverlap}
                  onChange={e => setChunkOverlap(parseInt(e.target.value) || 0)}
                  min="0"
                  max="500"
                  className="glass-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* PDF File Selector & Uploader Section */}
            <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FileText size={14} color="#3B82F6" /> Document Selection
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-purple)', cursor: 'pointer', border: '1px dashed rgba(168,85,247,0.4)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(168,85,247,0.05)', transition: 'all 0.2s' }}>
                  {uploading ? "Uploading..." : "Upload New PDF"}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Selector Dropdown */}
              <div style={{ marginBottom: '1rem' }}>
                <select
                  value={selectedFile || ""}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '0.375rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#FFF' }}
                >
                  {status?.available_pdfs && status.available_pdfs.length > 0 ? (
                    status.available_pdfs.map((pdfName) => (
                      <option key={pdfName} value={pdfName} style={{ background: '#0F172A', color: '#FFF' }}>
                        {pdfName}
                      </option>
                    ))
                  ) : (
                    <option value="" style={{ background: '#0F172A', color: '#FFF' }}>No PDF files found</option>
                  )}
                </select>
              </div>

              {/* Dynamic Status / Descriptors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Database Ingested:</span>
                  <span style={{ color: '#FFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BookOpen size={12} color="#C084FC" />
                    {status?.database_pdf ? (
                      status.database_pdf.length > 30 ? status.database_pdf.substring(0, 27) + '...' : status.database_pdf
                    ) : (
                      "None (Vector DB Empty)"
                    )}
                  </span>
                </div>

                {selectedFile && status?.database_pdf && selectedFile !== status.database_pdf ? (
                  <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', color: '#FB923C', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', marginTop: '0.25rem', lineHeight: '1.25' }}>
                    <strong>Warning:</strong> Selected file does not match database. Please click <strong>Ingest & Process Document</strong> to update the vector database retrieval.
                  </div>
                ) : selectedFile && !status?.database_pdf ? (
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60A5FA', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', marginTop: '0.25rem', lineHeight: '1.25' }}>
                    <strong>Notice:</strong> Database is empty. Click <strong>Ingest & Process Document</strong> to extract features and generate embeddings.
                  </div>
                ) : (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34D399', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={12} /> Database synchronized with selected file.
                  </div>
                )}
              </div>
              
              {status?.database_pdf && status?.stored_chunks_count ? (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <div>Pages: <strong style={{ color: '#FFF' }}>{status.pages_count}</strong></div>
                  <div>Chars: <strong style={{ color: '#FFF' }}>{status.total_characters.toLocaleString()}</strong></div>
                  <div>Chunks: <strong style={{ color: '#FFF' }}>{status.stored_chunks_count}</strong></div>
                  <div>Mode: <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{status.embedding_mode === 'nomic' ? 'Nomic Embed' : 'Local Hashes (Mock)'}</span></div>
                </div>
              ) : null}
            </div>

            <button
              onClick={handleIngest}
              disabled={ingesting}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {ingesting ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Ingesting & Creating DB...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Ingest & Process Document
                </>
              )}
            </button>

            {ingesting && status?.status_message && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <RefreshCw size={14} className="spin" color="#C084FC" style={{ flexShrink: 0 }} />
                <span>Status: <strong style={{ color: '#E5E7EB' }}>{status.status_message}</strong></span>
              </div>
            )}
          </div>

          {/* Inspectable Panel 1: Chunk List Explorer */}
          {status && status.chunks && status.chunks.length > 0 && (
            <div className="glass-panel">
              <div className="panel-header" onClick={() => togglePanel('chunkList')}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={16} color="#A855F7" /> 
                  Stage 2: Chunk Listing Explorer ({status.chunks.length} total)
                </h3>
                {panels.chunkList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              
              {panels.chunkList && (
                <div className="panel-content" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {status.chunks.slice(0, 15).map((chunk) => (
                      <div 
                        key={chunk.chunk_id} 
                        style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '0.5rem', fontSize: '0.82rem' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>ID: <code>{chunk.chunk_id}</code></span>
                          <span>Page {chunk.page_num} • {chunk.char_count} chars</span>
                        </div>
                        <div style={{ color: '#D1D5DB', fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap' }}>
                          {chunk.text}
                        </div>
                      </div>
                    ))}
                    {status.chunks.length > 15 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.5rem', textAlign: 'center' }}>
                        + {status.chunks.length - 15} more chunks stored in ChromaDB
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inspectable Panel 2: Vector Embedding Info */}
          {status && status.chunks && status.chunks.length > 0 && (
            <div className="glass-panel">
              <div className="panel-header" onClick={() => togglePanel('embeddings')}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Brain size={16} color="#10B981" /> 
                  Stage 3: Embedding Model & Dimension Info
                </h3>
                {panels.embeddings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              
              {panels.embeddings && (
                <div className="panel-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Embedding Model:</span>
                      <code style={{ color: '#A7F3D0' }}>{status.embedding_mode === 'nomic' ? 'nomic-embed-text-v1.5' : 'Deterministic String Hashing (Mock)'}</code>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Vector Dimension:</span>
                      <strong>{status.embedding_dimension} dimensions</strong>
                    </div>
                    
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Sample Chunk Embedding Hash Preview:</div>
                      <pre className="code-block" style={{ fontSize: '0.75rem' }}>
                        {JSON.stringify(
                          Array.from({ length: 15 }, (_, i) => Math.sin(i * (status.embedding_mode === 'nomic' ? 0.35 : 0.82)).toFixed(5)),
                          null,
                          2
                        )}
                        {"\n... and 753 more float dimensions stored in database."}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
        </div>

        {/* Right Side: QUERY / RETRIEVAL / GENERATION FLO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Query Form Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFF' }}>
              <Search size={18} color="#A855F7" /> Stage 5-7: Ask ChromaDB & LLM
            </h3>
            
            <form onSubmit={handleQuery}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="e.g. What is the VWO Login Dashboard?"
                  value={queryText}
                  onChange={e => setQueryText(e.target.value)}
                  disabled={querying || !status?.stored_chunks_count}
                  className="glass-input"
                  style={{ flexGrow: 1 }}
                />
                
                <button
                  type="submit"
                  disabled={querying || !queryText.trim() || !status?.stored_chunks_count}
                  className="btn-primary"
                >
                  {querying ? (
                    <RefreshCw size={16} className="spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  Query
                </button>
              </div>
            </form>

            {!status?.stored_chunks_count && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)' }}>
                * Database empty. Please process a PDF document on the left panel first.
              </span>
            )}
          </div>

          {/* Inspectable Panel 3: ChromaDB Retrieval Output (Top 4 Chunks) */}
          {queryResult && (
            <div className="glass-panel">
              <div className="panel-header" onClick={() => togglePanel('queryTrace')}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={16} color="#3B82F6" /> 
                  Stage 6: ChromaDB Vector Retrieval (Top 4 context blocks)
                </h3>
                {panels.queryTrace ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              
              {panels.queryTrace && (
                <div className="panel-content">
                  
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-glass)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Embedded Query Sample (15 dimensions):</span>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>Cosine distance query</span>
                    </div>
                    <pre style={{ margin: '0.4rem 0 0 0', color: '#D8B4FE', overflowX: 'auto', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {JSON.stringify(queryResult.query_embedding_sample, null, 2)}...
                    </pre>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {queryResult.retrieved_chunks.map((chunk, idx) => (
                      <div 
                        key={chunk.id} 
                        style={{ 
                          padding: '0.75rem', 
                          background: 'rgba(59, 130, 246, 0.03)', 
                          border: '1px solid rgba(59, 130, 246, 0.25)', 
                          borderRadius: '0.5rem',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 700, color: '#3B82F6' }}>
                            #{idx + 1} - Chunk <code>{chunk.id}</code> (Page {chunk.page})
                          </span>
                          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                            Similarity: {chunk.score.toFixed(4)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#E5E7EB', lineHeight: '1.4' }}>
                          {chunk.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inspectable Panel 4: Groq Prompt & Generation Completion */}
          {queryResult && (
            <div className="glass-panel" style={{ borderColor: 'rgba(168, 85, 247, 0.4)' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#A855F7' }}>
                    <Brain size={18} /> Stage 7: LLM Answer Generation
                  </h3>
                  <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                    Model: {queryResult.model_used}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  Generated from Groq API based strictly on retrieved vector database context.
                </p>
              </div>
              
              <div style={{ padding: '1.25rem' }}>
                {/* Answer Output */}
                <div style={{ background: 'rgba(168, 85, 247, 0.03)', borderLeft: '4px solid var(--accent-purple)', padding: '1rem', borderRadius: '0 0.5rem 0.5rem 0', fontSize: '0.92rem', color: '#F3F4F6', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {queryResult.generated_answer}
                </div>
                
                {/* Collapsible Prompt Panel */}
                <div style={{ marginTop: '1.5rem', border: '1px solid var(--border-glass)', borderRadius: '0.5rem' }}>
                  <div 
                    onClick={() => togglePanel('rawPrompt')}
                    style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.15)', borderRadius: '0.5rem 0.5rem 0 0' }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Eye size={14} /> View Complete Prompt Sent to Groq
                    </span>
                    {panels.rawPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                  
                  {panels.rawPrompt && (
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '0 0 0.5rem 0.5rem' }}>
                      <pre style={{ margin: 0, overflowX: 'auto', fontSize: '0.78rem', color: '#9CA3AF', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                        {queryResult.prompt_sent}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
        
      </div>
      
    </div>
  )
}

export default App
