// src/components/Settings.jsx — Configuration panel
import React, { useState } from 'react';

function Settings({ config, onSave }) {
  const [formData, setFormData] = useState(config);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setSaved(false);
  };

  const handleSave = () => {
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2>⚙️ Settings</h2>
        <p className="subtitle">Configure your Jira and GROQ API credentials</p>

        {/* ── Jira Section ── */}
        <div className="settings-section">
          <h3>🔗 Jira Configuration</h3>

          <div className="form-group">
            <label htmlFor="jiraUrl">Jira URL</label>
            <input
              id="jiraUrl"
              type="url"
              placeholder="https://your-domain.atlassian.net"
              value={formData.jiraUrl}
              onChange={(e) => handleChange('jiraUrl', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="jiraEmail">Jira Email</label>
            <input
              id="jiraEmail"
              type="email"
              placeholder="you@example.com"
              value={formData.jiraEmail}
              onChange={(e) => handleChange('jiraEmail', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="jiraToken">Jira API Token</label>
            <input
              id="jiraToken"
              type="password"
              placeholder="ATATT…"
              value={formData.jiraToken}
              onChange={(e) => handleChange('jiraToken', e.target.value)}
              className="form-input"
            />
            <small>
              📖 Get your token from{' '}
              <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer">
                Atlassian API Tokens
              </a>
            </small>
          </div>
        </div>

        {/* ── GROQ Section ── */}
        <div className="settings-section">
          <h3>🤖 GROQ Configuration</h3>

          <div className="form-group">
            <label htmlFor="groqKey">GROQ API Key</label>
            <input
              id="groqKey"
              type="password"
              placeholder="gsk_…"
              value={formData.groqKey}
              onChange={(e) => handleChange('groqKey', e.target.value)}
              className="form-input"
            />
            <small>
              📖 Get a free key from{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                Groq Console
              </a>
            </small>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="action-buttons">
          <button id="save-settings-btn" onClick={handleSave} className="btn btn-primary">
            💾 Save Settings
          </button>
          {saved && <span className="success-message">✅ Saved successfully!</span>}
        </div>

        <div className="info-box" style={{ marginTop: '1.5rem' }}>
          <strong>🔒 Privacy:</strong> Credentials are stored locally in your browser only — never sent to our servers.
        </div>
      </div>
    </div>
  );
}

export default Settings;
