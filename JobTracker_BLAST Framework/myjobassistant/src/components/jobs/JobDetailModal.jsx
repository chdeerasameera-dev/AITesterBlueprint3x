/**
 * JobDetailModal — Full-detail slide-in drawer for a single job record.
 */
import React from 'react';
import { X, Building2, Calendar, User, Phone, Bookmark, MessageSquare, FileText } from 'lucide-react';
import Badge from '../ui/Badge';
import './JobDetailModal.css';

/** Full-detail drawer for a single job record */
const JobDetailModal = ({ job, onClose }) => {
  if (!job) return null;

  const fmt = (val) => val || <span className="detail-empty">—</span>;
  const boolFmt = (val) => (val ? '✅ Yes' : '❌ No');

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-drawer animate-slideInRight" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-company-icon">
              <Building2 size={22} />
            </div>
            <div>
              <h2 id="modal-title" className="modal-title">{job.jobTitle}</h2>
              <p className="modal-company">{job.companyName}</p>
            </div>
          </div>
          <div className="modal-header-meta">
            <Badge status={job.status} />
            <button className="modal-close" onClick={onClose} aria-label="Close detail panel">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Key facts */}
          <div className="detail-row-grid">
            <div className="detail-fact">
              <Calendar size={15} aria-hidden="true" />
              <span className="fact-label">Date Applied</span>
              <span className="fact-value">
                {new Date(job.dateApplied).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
            <div className="detail-fact">
              <User size={15} aria-hidden="true" />
              <span className="fact-label">Profile Matched</span>
              <span className="fact-value">{boolFmt(job.profileMatched)}</span>
            </div>
            <div className="detail-fact">
              <Phone size={15} aria-hidden="true" />
              <span className="fact-label">Follow-up Required</span>
              <span className="fact-value">{boolFmt(job.followUp)}</span>
            </div>
            <div className="detail-fact">
              <Bookmark size={15} aria-hidden="true" />
              <span className="fact-label">Created At</span>
              <span className="fact-value">
                {new Date(job.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Job Description */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <FileText size={16} aria-hidden="true" />
              Job Description
            </h3>
            <p className="detail-text">{fmt(job.jobDescription)}</p>
          </div>

          {/* Interview Details */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <MessageSquare size={16} aria-hidden="true" />
              Interview Details
            </h3>
            <p className="detail-text">{fmt(job.interviewDetails)}</p>
          </div>

          {/* Questions Asked */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <MessageSquare size={16} aria-hidden="true" />
              Questions Asked
            </h3>
            <p className="detail-text">{fmt(job.questionsAsked)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} id="modal-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
