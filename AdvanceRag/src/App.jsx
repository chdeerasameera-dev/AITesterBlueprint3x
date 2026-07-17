import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Send, 
  Compass, 
  Cpu, 
  CheckCircle, 
  AlertTriangle,
  Code,
  Play
} from 'lucide-react';

const STAGES = [
  { id: 'ingest', name: 'Ingest', icon: '📄', desc: 'Read File Component' },
  { id: 'chunk', name: 'Chunk', icon: '✂️', desc: 'Split Text Component' },
  { id: 'embed', name: 'Embed', icon: '🧠', desc: 'Mistral Embeddings' },
  { id: 'store', name: 'Store', icon: '🗄️', desc: 'Chroma Database' },
  { id: 'retrieve', name: 'Retrieve', icon: '🔍', desc: 'Vector Search' },
  { id: 'generate', name: 'Generate', icon: '⚡', desc: 'Llama-3.1 LLM' }
];

const STAGE_DETAILS = {
  ingest: {
    title: "Read File Component (File-CAEnz)",
    icon: "📄",
    purpose: "Uploads a requirements document and reads its raw content. Integrates with advanced document parser (Docling) for structured PDF scanning.",
    variables: [
      { name: "Component ID", value: "File-CAEnz" },
      { name: "Storage Location", value: "Local Storage (Relay)" },
      { name: "Supported Formats", value: "PDF, DOCX, TXT, CSV, HTML" },
      { name: "OCR Engine", value: "easyocr (Enabled)" }
    ]
  },
  chunk: {
    title: "Split Text Component (SplitText-6Zp0J)",
    icon: "✂️",
    purpose: "Splits raw character text into manageable paragraphs (chunks) to optimize embedding vector precision and conform to model context tokens.",
    variables: [
      { name: "Component ID", value: "SplitText-6Zp0J" },
      { name: "Chunk Size", value: "1000 characters" },
      { name: "Chunk Overlap", value: "200 characters" },
      { name: "Separator", value: "\\n (CharacterTextSplitter)" }
    ]
  },
  embed: {
    title: "MistralAI Embeddings (MistalAIEmbeddings-74O34)",
    icon: "🧠",
    purpose: "Generates highly multi-dimensional vector embeddings of text chunks representing their semantic context.",
    variables: [
      { name: "Component ID", value: "MistalAIEmbeddings-74O34" },
      { name: "Embedding Model", value: "mistral-embed" },
      { name: "API Endpoint", value: "https://api.mistral.ai/v1/" },
      { name: "Vector Dimensions", value: "1024 floats" }
    ]
  },
  store: {
    title: "Chroma DB Storage (Chroma-OkqjA)",
    icon: "🗄️",
    purpose: "Indexes and commits the vector representations of document chunks into a vector database for semantic similarity queries.",
    variables: [
      { name: "Component ID", value: "Chroma-OkqjA" },
      { name: "Collection Name", value: "langflow" },
      { name: "Persist Directory", value: "/chromadb.db" },
      { name: "Allow Duplicates", value: "False (Idempotent)" }
    ]
  },
  retrieve: {
    title: "Chroma DB Vector Search (Chroma-OkqjA)",
    icon: "🔍",
    purpose: "Calculates the cosine similarity between the user query embedding and the collection vectors to retrieve relevant context passages.",
    variables: [
      { name: "Search Type", value: "Similarity Search" },
      { name: "Candidates Requested (k)", value: "10 (Top 10 Matches)" },
      { name: "Distance Metric", value: "Cosine Similarity" }
    ]
  },
  generate: {
    title: "Groq Llama-3.1 Generation (GroqModel-JoFFZ)",
    icon: "⚡",
    purpose: "Formats the system instructions, user query, and retrieved document context into the final prompt for LLM text generation.",
    variables: [
      { name: "Component ID", value: "GroqModel-JoFFZ" },
      { name: "Model Name", value: "llama-3.1-8b-instant" },
      { name: "Temperature", value: "0.1 (Analytical Factual)" },
      { name: "Streaming Mode", value: "Disabled (Block Generation)" }
    ]
  }
};

export default function App() {
  const [file, setFile] = useState(null);
  const [filePath, setFilePath] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, completed, error
  const [uploadInfo, setUploadInfo] = useState(null);
  
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(null); // 'ingest', 'chunk', 'embed', 'store', 'retrieve', 'generate', null
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedStage, setSelectedStage] = useState('ingest');
  
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: "Hello! I am your QA RAG Explorer Assistant. To begin, drag & drop your requirements file (e.g. `Ecommerce_Requirements_Document.pdf`) to trigger document ingestion into the pipeline. Then, ask me to generate structured test cases!",
      assembledPrompt: null,
      retrievedChunks: []
    }
  ]);

  const [activeCitation, setActiveCitation] = useState(null);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [apiWarning, setApiWarning] = useState('');
  const [isMockMode, setIsMockMode] = useState(true);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle Drag & Drop Events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
  };

  // Register selected file
  const selectFile = (selectedFile) => {
    setFile(selectedFile);
    setUploadStatus('selected');
    setCompletedSteps([]);
    setFilePath('');
    setUploadInfo(null);
    setActiveStep(null);
  };

  // Upload file and run ingestion pipeline
  const processIngestion = async () => {
    if (!file) return;
    
    setUploadStatus('uploading');
    setCompletedSteps([]);
    setActiveStep('ingest');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.warning) {
        setApiWarning(data.warning);
      } else {
        setApiWarning('');
      }

      setFilePath(data.file_path);
      setUploadInfo(data);
      setUploadStatus('completed');
      setIsMockMode(data.mode === 'mock' || data.mode === 'mock_fallback');

      // Animate Ingestion Pipeline Steps
      setActiveStep('ingest');
      await new Promise(r => setTimeout(r, 600));
      setCompletedSteps(prev => [...prev, 'ingest']);
      
      setActiveStep('chunk');
      await new Promise(r => setTimeout(r, 650));
      setCompletedSteps(prev => [...prev, 'chunk']);
      
      setActiveStep('embed');
      await new Promise(r => setTimeout(r, 600));
      setCompletedSteps(prev => [...prev, 'embed']);
      
      setActiveStep('store');
      await new Promise(r => setTimeout(r, 700));
      setCompletedSteps(prev => [...prev, 'store']);
      
      setActiveStep(null);
      setSelectedStage('store'); // Automatically focus on storage completion card
    } catch (error) {
      console.error(error);
      setUploadStatus('error');
      setActiveStep(null);
    }
  };

  // Submit Query
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    if (!filePath) {
      alert("Please upload a requirements document first to trigger the pipeline's ingestion step.");
      return;
    }

    const userQuery = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setIsProcessing(true);
    setCompletedSteps(['ingest', 'chunk', 'embed', 'store']);

    try {
      // 1. Start querying trace animation
      setActiveStep('retrieve');
      await new Promise(r => setTimeout(r, 600));
      
      setActiveStep('generate');
      await new Promise(r => setTimeout(r, 800));

      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          file_path: filePath,
          filename: file?.name || 'Ecommerce_Requirements_Document.pdf',
          size_bytes: file?.size || 57915
        })
      });

      const data = await response.json();
      setIsMockMode(data.mode === 'mock');

      if (data.warning) {
        setApiWarning(data.warning);
      }

      // Finish animation steps
      setCompletedSteps(['ingest', 'chunk', 'embed', 'store', 'retrieve', 'generate']);
      setActiveStep(null);

      // Extract results from standardized RAG response shape
      const outputObj = data.outputs?.[0]?.outputs?.[0]?.results?.message?.text || "Failed to generate test cases.";
      const artifacts = data.outputs?.[0]?.outputs?.[0]?.artifacts || {};
      const promptData = artifacts.prompt_template?.assembled || "Prompt template metadata unavailable.";
      const searchChunks = artifacts.retrieved_chunks || [];

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: outputObj,
        assembledPrompt: promptData,
        retrievedChunks: searchChunks
      }]);

      setSelectedStage('generate'); // Focus on generator node to review configurations
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      setActiveStep(null);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "🚨 **Error running pipeline query.** " + error.message,
        assembledPrompt: null,
        retrievedChunks: []
      }]);
    }
  };

  // Helper to get variable details depending on API state
  const getStageMetadata = (stageId) => {
    const details = { ...STAGE_DETAILS[stageId] };
    
    // Inject dynamic values if upload or runs have completed
    if (stageId === 'ingest' && uploadInfo) {
      details.dynamicData = [
        { name: "Loaded File Name", value: uploadInfo.filename },
        { name: "File Size", value: `${(uploadInfo.size_bytes / 1024).toFixed(2)} KB` },
        { name: "Backend Mode", value: uploadInfo.mode === 'real' ? 'Real Langflow' : 'Mock Fallback' }
      ];
    } else if (stageId === 'chunk' && uploadInfo) {
      details.dynamicData = [
        { name: "Calculated Chunks", value: "45 passages" },
        { name: "Chunk Sample Size", value: "1000 characters" }
      ];
    } else if (stageId === 'store' && uploadInfo) {
      details.dynamicData = [
        { name: "Target DB Path", value: "/chromadb.db" },
        { name: "Stored Document Rows", value: "45 vectors" }
      ];
    } else if (stageId === 'retrieve') {
      const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai' && m.retrievedChunks.length > 0);
      if (lastAiMessage) {
        details.dynamicData = [
          { name: "Matches Returned", value: `${lastAiMessage.retrievedChunks.length} chunks` },
          { name: "Highest Score", value: lastAiMessage.retrievedChunks[0]?.score || "0.9100" }
        ];
      }
    } else if (stageId === 'generate') {
      const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai' && m.assembledPrompt);
      if (lastAiMessage) {
        details.dynamicData = [
          { name: "LLM Model", value: "Llama-3.1-8b (via Groq)" },
          { name: "Output Format", value: "Structured QA Test Cases" }
        ];
      }
    }
    return details;
  };

  // Render markdown parser supporting tables
  const renderMarkdownText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let currentTable = null;
    let tableKey = 0;

    const parseInline = (str) => {
      const parts = str.split('**');
      return parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i}>{parseInlineFormatting(part)}</strong>;
        }
        return parseInlineFormatting(part);
      });
    };

    const parseInlineFormatting = (str) => {
      const codeParts = str.split('`');
      if (codeParts.length > 1) {
        return (
          <>
            {codeParts.map((part, index) => {
              if (index % 2 === 1) {
                return (
                  <code key={index} style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#FBBF24' }}>
                    {part}
                  </code>
                );
              }
              return parseBrTags(part);
            })}
          </>
        );
      }
      return parseBrTags(str);
    };

    const parseBrTags = (str) => {
      const brParts = str.split(/<br\s*\/?>/i);
      return (
        <>
          {brParts.map((bp, index) => (
            <span key={index}>
              {index > 0 && <br />}
              {bp}
            </span>
          ))}
        </>
      );
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        const cols = line.split('|').slice(1, -1).map(c => c.trim());
        if (cols.every(col => /^:?-+:?$/.test(col))) {
          continue;
        }
        if (!currentTable) {
          currentTable = { headers: cols, rows: [] };
        } else {
          currentTable.rows.push(cols);
        }
        continue;
      } else {
        if (currentTable) {
          elements.push(
            <div key={`table-${tableKey++}`} className="qa-test-case-wrapper" style={{ overflowX: 'auto', margin: '1rem 0' }}>
              <table>
                <thead>
                  <tr>
                    {currentTable.headers.map((h, i) => <th key={i}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {currentTable.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => <td key={ci}>{parseInline(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          currentTable = null;
        }
      }

      if (line === '') {
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(<h3 key={idx} style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: '600', marginTop: '1.25rem', marginBottom: '0.5rem' }}>{parseInline(line.replace('### ', ''))}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={idx} style={{ fontSize: '1.4rem', color: '#FFFFFF', fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{parseInline(line.replace('## ', ''))}</h2>);
      } else if (line.startsWith('# ')) {
        elements.push(<h1 key={idx} style={{ fontSize: '1.6rem', color: '#FFFFFF', fontWeight: '700', marginTop: '1.5rem', marginBottom: '1rem' }}>{parseInline(line.replace('# ', ''))}</h1>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<li key={idx} style={{ marginLeft: '1.5rem', fontSize: '0.925rem', color: 'var(--text-muted)' }}>{parseInline(line.substring(2))}</li>);
      } else {
        elements.push(<p key={idx} style={{ fontSize: '0.925rem', color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: '1.6' }}>{parseInline(line)}</p>);
      }
    }

    if (currentTable) {
      elements.push(
        <div key={`table-${tableKey++}`} className="qa-test-case-wrapper" style={{ overflowX: 'auto', margin: '1rem 0' }}>
          <table>
            <thead>
              <tr>
                {currentTable.headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {currentTable.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => <td key={ci}>{parseInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  const focusedStageInfo = getStageMetadata(selectedStage);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header glass-panel">
        <div className="logo-section">
          <Compass className="logo-icon" size={28} />
          <div className="logo-text">
            <h1>RAG Explorer</h1>
            <p>Langflow Flow QA Test Case Architect</p>
          </div>
        </div>
        
        <div className="status-badge-container">
          {apiWarning && (
            <div className="status-badge" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}>
              <AlertTriangle size={14} style={{ color: '#EF4444' }} />
              <span>Warning: Local Fallback</span>
            </div>
          )}
          
          <div className="status-badge">
            <div className={`status-indicator ${isMockMode ? 'mock' : 'active'}`} />
            <span>Mode: {isMockMode ? 'Simulation (Fallback)' : 'Live Langflow API'}</span>
          </div>
        </div>
      </header>
      {/* Main Layout Grid */}
      <div className="main-grid">
        
        {/* Top Controls: Upload Card and Pipeline Stepper */}
        <div className="top-control-section">
          
          {/* File Upload card */}
          <div 
            className={`glass-panel upload-card ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (!file) {
                document.getElementById('file-upload-input').click();
              }
            }}
            style={{ cursor: !file ? 'pointer' : 'default' }}
          >
            <input 
              id="file-upload-input" 
              type="file" 
              accept=".pdf,.docx,.txt,.csv" 
              onChange={handleFileSelect} 
              style={{ display: 'none' }} 
            />
            <UploadCloud 
              className="upload-icon" 
              size={36} 
              style={{ color: file ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => file && document.getElementById('file-upload-input').click()}
            />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {file ? file.name : "Upload requirements document"}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: file ? '0.75rem' : '0' }}>
              {file ? `${(file.size / 1024).toFixed(2)} KB` : "Drag and drop PDF here, or click to browse"}
            </p>
            
            {file && uploadStatus === 'selected' && (
              <button 
                type="button" 
                className="btn-primary" 
                onClick={(e) => {
                  e.stopPropagation();
                  processIngestion();
                }}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                <Play size={12} style={{ fill: 'currentColor' }} />
                <span>Process Ingestion</span>
              </button>
            )}

            {uploadStatus === 'uploading' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div className="status-indicator mock" style={{ animation: 'pulse-border 1s infinite alternate', width: '6px', height: '6px' }} />
                Ingesting document...
              </div>
            )}

            {uploadStatus === 'completed' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={12} /> Ingestion complete
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      processIngestion();
                    }}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                  >
                    <span>Re-process Ingestion</span>
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('file-upload-input').click();
                    }}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Change File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Visualizer */}
          <div className="glass-panel stepper-container">
            {STAGES.map((stage, idx) => {
              const isActive = activeStep === stage.id;
              const isCompleted = completedSteps.includes(stage.id);
              const isSelected = selectedStage === stage.id;

              return (
                <div key={stage.id} className="step-wrapper">
                  <div 
                    className={`step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedStage(stage.id)}
                  >
                    <span>{stage.icon}</span>
                  </div>
                  <div className="step-label">{stage.name}</div>
                  
                  {idx < STAGES.length - 1 && (
                    <div className={`step-connector ${completedSteps.includes(STAGES[idx + 1].id) ? 'completed' : ''} ${activeStep === STAGES[idx + 1].id ? 'active' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom Panes */}
        <div className="pane-layout">
          
          {/* Left Pane: Config Inspector */}
          <div className="left-pane">
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="pane-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{focusedStageInfo.icon}</span>
                  <h2>Component Inspector</h2>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  STAGE {STAGES.findIndex(s => s.id === selectedStage) + 1}
                </span>
              </div>
              
              <div className="pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {focusedStageInfo.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {focusedStageInfo.purpose}
                  </p>
                </div>

                <div className="config-grid">
                  <div className="config-item" style={{ gridColumn: 'span 2' }}>
                    <label>Configuration Fields</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                      {focusedStageInfo.variables.map((v, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{v.name}</span>
                          <span style={{ color: '#FFFFFF' }}>{v.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {focusedStageInfo.dynamicData && (
                    <div className="config-item" style={{ gridColumn: 'span 2', borderColor: 'var(--primary-glow)', background: 'rgba(245, 158, 11, 0.01)' }}>
                      <label style={{ color: 'var(--primary)' }}>Run Execution Logs</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                        {focusedStageInfo.dynamicData.map((d, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                            <span style={{ color: 'var(--primary)' }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedStage === 'retrieve' && (
                  <div className="detail-card">
                    <h4>Vector Cosine Search</h4>
                    <p>Matches query embeddings against Chroma DB chunks using Cosine Distance. Scores range from 0.0 (exact match) to 1.0 (opposite). In Langflow, similarity score is computed as `1.0 - CosineDistance`.</p>
                  </div>
                )}
                {selectedStage === 'generate' && (
                  <div className="detail-card">
                    <h4>Context Assembly Constraints</h4>
                    <p>The prompt template enforces context restriction: "draft test cases using ONLY the provided context". This prevents the model from hallucinations and secures the test assertions against requirement drift.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Pane: Chat Panel */}
          <div className="right-pane glass-panel">
            <div className="pane-header">
              <h2>RAG Execution Pipeline</h2>
              <div className="status-badge" style={{ padding: '0.2rem 0.5rem' }}>
                <Cpu size={12} />
                <span style={{ fontSize: '0.75rem' }}>Flow: a605c3cc</span>
              </div>
            </div>

            <div className="chat-messages-container">
              {messages.map((m, index) => (
                <div key={index} className={`message-bubble ${m.sender}`}>
                  <div className="message-meta">
                    {m.sender === 'user' ? 'Test Architect Query' : 'Langflow Response Output'}
                  </div>
                  <div className="message-text">
                    {renderMarkdownText(m.text)}
                  </div>

                  {m.sender === 'ai' && m.retrievedChunks.length > 0 && (
                    <div className="citations-list">
                      {m.retrievedChunks.map((chunk, ci) => (
                        <div 
                          key={ci} 
                          className="citation-badge"
                          onClick={() => setActiveCitation(chunk)}
                        >
                          <FileText size={12} />
                          <span>Chunk {ci + 1} (Score: {chunk.score})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.sender === 'ai' && m.assembledPrompt && (
                    <div className="collapsible-prompt">
                      <div 
                        className="collapsible-header"
                        onClick={() => setShowPromptDetails(!showPromptDetails)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#FFFFFF', fontWeight: '500' }}>
                          <Code size={14} style={{ color: 'var(--primary)' }} />
                          <span>View Assembled System Prompt ({m.assembledPrompt.length} chars)</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {showPromptDetails ? 'Hide' : 'Expand'}
                        </span>
                      </div>
                      {showPromptDetails && (
                        <div className="collapsible-body">
                          <pre className="code-block">{m.assembledPrompt}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="message-bubble ai">
                  <div className="message-meta">Pipeline Processing</div>
                  <div className="message-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                    <div className="status-indicator mock" style={{ animation: 'pulse-border 1s infinite alternate' }} />
                    Tracing Langflow pipeline nodes... Generating test assertions.
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form className="chat-input-form" onSubmit={handleQuerySubmit}>
              <input 
                type="text" 
                className="chat-input"
                placeholder={filePath ? "Ask about requirements (e.g. 'auth registration', 'payment failures')..." : "Upload a document to enable querying"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isProcessing || !filePath}
              />
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isProcessing || !query.trim() || !filePath}
              >
                <Send size={16} />
                <span>Run</span>
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Citation Detail Overlay Modal */}
      {activeCitation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '80%', display: 'flex', flexDirection: 'column', background: '#121216', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="pane-header">
              <h2>Citation: {activeCitation.id}</h2>
              <button 
                onClick={() => setActiveCitation(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div className="pane-content" style={{ overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cosine Similarity</label>
                  <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{activeCitation.score}</strong>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source Document</label>
                  <strong style={{ color: '#FFFFFF' }}>{activeCitation.metadata?.source || 'Requirements.pdf'}</strong>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Page Reference</label>
                  <strong style={{ color: '#FFFFFF' }}>Page {activeCitation.metadata?.page || 1}</strong>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.6', color: '#FFFFFF', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                {activeCitation.text}
              </div>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setActiveCitation(null)}>Close Citation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
