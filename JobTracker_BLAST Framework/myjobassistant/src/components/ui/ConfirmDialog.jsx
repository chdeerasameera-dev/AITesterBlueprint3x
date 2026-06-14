/**
 * ConfirmDialog — Modal confirmation dialog for destructive actions.
 */
import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmDialog.css';

/** Confirmation modal for delete / destructive actions */
const ConfirmDialog = ({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', cancelLabel = 'Cancel' }) => {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="dialog-overlay animate-fadeIn" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={onCancel} aria-label="Cancel">
          <X size={18} />
        </button>
        <div className="dialog-icon">
          <AlertTriangle size={28} />
        </div>
        <h3 id="dialog-title" className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel} id="dialog-cancel-btn">
            {cancelLabel}
          </button>
          <button className="btn btn-danger" onClick={onConfirm} id="dialog-confirm-btn">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
