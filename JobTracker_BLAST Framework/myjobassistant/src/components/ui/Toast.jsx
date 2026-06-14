/**
 * Toast — Snackbar notification component.
 * Supports success, error, and info variants.
 */
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
};

const COLOURS = {
  success: '#38A169',
  error:   '#E53E3E',
  info:    '#3182CE',
};

/** Snackbar notification with auto-dismiss */
const Toast = ({ message, type = 'success', onClose }) => {
  const Icon = ICONS[type] || Info;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`toast toast--${type}`}
      role="alert"
      aria-live="assertive"
      style={{ '--toast-colour': COLOURS[type] }}
    >
      <Icon size={18} className="toast-icon" aria-hidden="true" />
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

/** ToastContainer manages a list of toasts */
export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="toast-container" aria-label="Notifications">
    {toasts.map((t) => (
      <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
    ))}
  </div>
);

export default Toast;
