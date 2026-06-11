// src/App.jsx — Main React application
import React, { useState, useEffect } from 'react';
import Generator from './components/Generator';
import Settings from './components/Settings';
import TestPlanView from './components/TestPlanView';
import ThemeSwitcher from './components/ThemeSwitcher';
import './styles.css';

function App() {
  const [currentView, setCurrentView] = useState('generator');

  // ── Theme: light | dark | ocean ──
  const [theme, setTheme] = useState(
    () => localStorage.getItem('blast-theme') || 'light'
  );

  // ── Output mode: testPlan | testStrategy ──
  const [outputMode, setOutputMode] = useState('testPlan');

  // ── Config ──
  const [config, setConfig] = useState({
    jiraUrl:   localStorage.getItem('jiraUrl')   || '',
    jiraEmail: localStorage.getItem('jiraEmail') || '',
    jiraToken: localStorage.getItem('jiraToken') || '',
    groqKey:   localStorage.getItem('groqKey')   || '',
  });

  const [serverConfigStatus, setServerConfigStatus] = useState({
    hasJiraUrl: false, hasJiraEmail: false,
    hasJiraToken: false, hasGroqKey: false,
  });

  const [testPlan, setTestPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Persist theme and apply to <html>
  useEffect(() => {
    localStorage.setItem('blast-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch server config status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => { if (data.configStatus) setServerConfigStatus(data.configStatus); })
      .catch(err => console.error('Health check failed:', err));
  }, []);

  // ── Generate handler ──
  const handleGeneratePlan = async (jiraId, mode) => {
    setLoading(true);
    setError(null);
    setOutputMode(mode);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraId,
          mode,
          config: {
            jiraUrl:   config.jiraUrl   || undefined,
            jiraEmail: config.jiraEmail || undefined,
            jiraToken: config.jiraToken || undefined,
            groqKey:   config.groqKey   || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Generation failed');

      setTestPlan({ ...data.testPlan, markdown: data.markdown, filename: data.filename });
      setCurrentView('generator'); // stay on generator view to show result below

    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Config save ──
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('jiraUrl',   newConfig.jiraUrl);
    localStorage.setItem('jiraEmail', newConfig.jiraEmail);
    localStorage.setItem('jiraToken', newConfig.jiraToken);
    localStorage.setItem('groqKey',   newConfig.groqKey);
  };

  // ── Download markdown ──
  const handleDownloadMarkdown = () => {
    if (!testPlan) return;
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(testPlan.markdown));
    el.setAttribute('download', testPlan.filename);
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const handleNewGeneration = () => {
    setTestPlan(null);
    setError(null);
  };

  return (
    <div className="app" data-theme={theme}>
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-top">
          <div className="header-brand">
            <h1>🧪 Testing Buddy</h1>
            <span className="header-subtitle">AI-Powered QA Document Generator</span>
          </div>
          <div className="header-controls">
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
            <nav className="app-nav">
              <button
                id="nav-generate"
                className={`nav-btn${currentView === 'generator' ? ' active' : ''}`}
                onClick={() => setCurrentView('generator')}
              >
                Generate
              </button>
              <button
                id="nav-settings"
                className={`nav-btn${currentView === 'settings' ? ' active' : ''}`}
                onClick={() => setCurrentView('settings')}
              >
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="app-main">
        {currentView === 'generator' && (
          <div className="view-container">
            {/* Show generator only when no result yet */}
            {!testPlan && (
              <Generator
                onGenerate={handleGeneratePlan}
                loading={loading}
                config={config}
                serverConfigStatus={serverConfigStatus}
              />
            )}

            {/* Loading state */}
            {loading && (
              <div className="loading-wrap">
                <div className="spinner" />
                <span>Connecting to Jira & generating with GROQ AI…</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: 520, width: '100%' }}>
                  <div className="error-box">⚠️ {error}</div>
                  <button className="btn btn-secondary" onClick={handleNewGeneration} style={{ marginTop: 8 }}>
                    ← Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {testPlan && !loading && (
              <div className="result-container">
                <TestPlanView testPlan={testPlan} mode={outputMode} />
                <div className="action-buttons" style={{ marginTop: '2rem' }}>
                  <button
                    id="download-btn"
                    className="btn btn-primary"
                    onClick={handleDownloadMarkdown}
                  >
                    ⬇️ Download Markdown
                  </button>
                  <button
                    id="new-generation-btn"
                    className="btn btn-secondary"
                    onClick={handleNewGeneration}
                  >
                    ✨ New Generation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'settings' && (
          <Settings config={config} onSave={handleSaveConfig} />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="app-footer">
        <p>🧪 Testing Buddy &nbsp;•&nbsp; Powered by GROQ LLaMA 3 &nbsp;•&nbsp; Jira Integration</p>
      </footer>
    </div>
  );
}

export default App;
