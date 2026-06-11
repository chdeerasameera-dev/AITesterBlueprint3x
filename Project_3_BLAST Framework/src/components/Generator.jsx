// src/components/Generator.jsx — Test plan/strategy generation form
import React, { useState } from 'react';

const MODES = [
  { id: 'testPlan',     label: '📋 Test Plan',     desc: 'Full test plan with scope, schedule, approvals & more' },
  { id: 'testStrategy', label: '🎯 Test Strategy',  desc: 'Focused strategy: objective, approach, environments & risks' },
];

function Generator({ onGenerate, loading, config, serverConfigStatus = {} }) {
  const [jiraId, setJiraId] = useState('');
  const [mode, setMode] = useState('testPlan');

  const hasJira = (config.jiraUrl && config.jiraEmail && config.jiraToken) ||
                  (serverConfigStatus.hasJiraUrl && serverConfigStatus.hasJiraEmail && serverConfigStatus.hasJiraToken);
  const hasGroq = config.groqKey || serverConfigStatus.hasGroqKey;

  const isUsingServerConfig = (!config.jiraToken || !config.groqKey) &&
                              (serverConfigStatus.hasJiraToken && serverConfigStatus.hasGroqKey);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jiraId.trim()) {
      alert('Please enter a Jira issue ID');
      return;
    }
    onGenerate(jiraId.trim(), mode);
  };

  const activeMode = MODES.find(m => m.id === mode);

  return (
    <div className="generator-container">
      <div className="generator-card">
        <h2>Generate Document</h2>
        <p className="subtitle">Select a mode, enter a Jira ID, and let AI do the work</p>

        {/* ── Mode Toggle ── */}
        <div className="mode-toggle" role="group" aria-label="Output mode">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              id={`mode-btn-${id}`}
              className={`mode-btn${mode === id ? ' active' : ''}`}
              onClick={() => setMode(id)}
              type="button"
              aria-pressed={mode === id}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mode description */}
        {activeMode && (
          <div className="info-box" style={{ marginBottom: '1.5rem', fontSize: '0.82rem' }}>
            {activeMode.desc}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="jiraId">Jira Issue ID</label>
            <input
              id="jiraId"
              type="text"
              placeholder="e.g., SCRUM-5, VWO-48, PROJ-123"
              value={jiraId}
              onChange={(e) => setJiraId(e.target.value.toUpperCase())}
              disabled={loading}
              className="form-input"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Credential status */}
          {(!hasJira || !hasGroq) ? (
            <div className="warning-box">
              ⚠️ Configure credentials in <strong>Settings</strong> first
            </div>
          ) : isUsingServerConfig ? (
            <div className="info-box">
              ⚙️ Using server-configured credentials (override in Settings anytime)
            </div>
          ) : null}

          <button
            id="generate-btn"
            type="submit"
            disabled={loading || !hasJira || !hasGroq}
            className="btn btn-primary btn-large"
          >
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generating…</>
              : `🚀 Generate ${activeMode?.label.split(' ').slice(1).join(' ')}`
            }
          </button>
        </form>
      </div>
    </div>
  );
}

export default Generator;
