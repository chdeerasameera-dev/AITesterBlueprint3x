/**
 * InsightsModal — Popup modal for tile click insights.
 * Shows filtered job list + AI-generated career coaching from Groq.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ExternalLink, AlertCircle, Loader2, Building2, CheckCircle, XCircle, Clock, Bell } from 'lucide-react';
import Badge from './Badge';
import { callGroq, buildPrompt } from '../../services/groqService';
import './InsightsModal.css';

const STATUS_ICON = {
  Selected:    <CheckCircle size={13} style={{ color: '#38A169' }} />,
  Rejected:    <XCircle size={13} style={{ color: '#E53E3E' }} />,
  Applied:     <Clock size={13} style={{ color: '#3182CE' }} />,
  'In Progress': <Loader2 size={13} style={{ color: '#D69E2E' }} />,
};

/** AI Insights popup modal for dashboard metric tiles */
const InsightsModal = ({ tileType, title, icon: Icon, colour, jobs, filterKey, metrics, onClose }) => {
  const navigate = useNavigate();
  const [insights, setInsights]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const hasApiKey = import.meta.env.VITE_GROQ_API_KEY &&
                    import.meta.env.VITE_GROQ_API_KEY !== 'your_groq_api_key_here';

  const handleGenerateInsights = async () => {
    setLoading(true);
    setError('');
    setInsights('');
    try {
      const userPrompt = buildPrompt(tileType, jobs, metrics);
      const systemPrompt = `You are an expert career coach helping a Senior QA Engineer / Test Automation professional with 12+ years of experience. Be specific, actionable, and encouraging.`;
      const result = await callGroq(systemPrompt, userPrompt);
      setInsights(result);
    } catch (err) {
      if (err.message === 'GROQ_API_KEY_MISSING') {
        setError('api_key_missing');
      } else {
        setError(err.message || 'Failed to generate insights. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullList = () => {
    if (filterKey) {
      navigate(`/jobs?filter=${filterKey}`);
    } else {
      navigate('/jobs');
    }
    onClose();
  };

  // Close on Escape
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="insights-overlay animate-fadeIn" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="insights-title">
      <div className="insights-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="insights-header" style={{ '--tile-colour': colour }}>
          <div className="insights-header-left">
            <div className="insights-header-icon">
              {Icon && <Icon size={22} aria-hidden="true" />}
            </div>
            <div>
              <h2 id="insights-title" className="insights-title">{title}</h2>
              <p className="insights-subtitle">{jobs.length} record{jobs.length !== 1 ? 's' : ''} in the last 14 days</p>
            </div>
          </div>
          <button className="insights-close" onClick={onClose} aria-label="Close insights panel">
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="insights-body">

          {/* Jobs list */}
          <div className="insights-jobs-section">
            <h3 className="insights-section-label">📋 Job Records</h3>
            {jobs.length === 0 ? (
              <div className="insights-empty">
                <p>No records found for this metric in the last 14 days.</p>
              </div>
            ) : (
              <div className="insights-jobs-list">
                {jobs.map((job) => (
                  <div key={job.id} className="insights-job-card">
                    <div className="ijc-top">
                      <div className="ijc-company">
                        <Building2 size={14} aria-hidden="true" />
                        <strong>{job.companyName}</strong>
                      </div>
                      <Badge status={job.status} />
                    </div>
                    <div className="ijc-title">{job.jobTitle}</div>
                    <div className="ijc-meta">
                      <span>📅 {new Date(job.dateApplied).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span>👤 {job.profileMatched ? 'Profile ✅' : 'Profile ❌'}</span>
                      <span>{job.followUp ? '🔔 Follow-up' : ''}</span>
                    </div>
                    {job.interviewDetails && (
                      <div className="ijc-interview">
                        <strong>Interview:</strong> {job.interviewDetails.substring(0, 120)}{job.interviewDetails.length > 120 ? '…' : ''}
                      </div>
                    )}
                    {job.questionsAsked && (
                      <div className="ijc-questions">
                        <strong>Questions:</strong> {job.questionsAsked.substring(0, 100)}{job.questionsAsked.length > 100 ? '…' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="insights-ai-section">
            <h3 className="insights-section-label">
              <Sparkles size={15} aria-hidden="true" /> AI Career Insights
            </h3>

            {!hasApiKey && (
              <div className="insights-api-missing">
                <AlertCircle size={18} />
                <div>
                  <strong>Groq API Key Required</strong>
                  <p>Add your Groq API key to <code>.env</code> to unlock AI-powered career coaching insights.</p>
                  <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="insights-link">
                    Get a free key at console.groq.com <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {hasApiKey && !insights && !loading && error !== 'api_key_missing' && (
              <div className="insights-generate-area">
                <p className="insights-generate-hint">
                  Click below to get personalised AI coaching based on your {title.toLowerCase()} data.
                </p>
                <button
                  className="btn btn-primary insights-generate-btn"
                  onClick={handleGenerateInsights}
                  id="generate-insights-btn"
                >
                  <Sparkles size={16} aria-hidden="true" />
                  Generate AI Insights
                </button>
              </div>
            )}

            {loading && (
              <div className="insights-loading">
                <Loader2 size={24} className="spin-icon" aria-hidden="true" />
                <p>Analysing your data with AI…</p>
              </div>
            )}

            {error && error !== 'api_key_missing' && (
              <div className="insights-error">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button className="btn btn-ghost" onClick={handleGenerateInsights}>Retry</button>
              </div>
            )}

            {insights && (
              <div className="insights-result">
                <div className="insights-result-text">
                  {insights.split('\n').map((line, i) => (
                    <p key={i} className={line.startsWith('•') || line.startsWith('-') || line.match(/^\d\./) ? 'insight-bullet' : ''}>
                      {line || <br />}
                    </p>
                  ))}
                </div>
                <button
                  className="btn btn-ghost insights-refresh-btn"
                  onClick={handleGenerateInsights}
                  title="Regenerate insights"
                >
                  <Sparkles size={14} /> Regenerate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="insights-footer">
          <button className="btn btn-ghost" onClick={onClose} id="insights-close-btn">
            Close
          </button>
          {filterKey && (
            <button className="btn btn-primary" onClick={handleViewFullList} id="insights-view-list-btn">
              <ExternalLink size={15} aria-hidden="true" />
              View Full List
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsModal;
