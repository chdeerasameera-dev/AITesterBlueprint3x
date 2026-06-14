/**
 * AddJob — Page 2: Job application entry form.
 */
import React, { useState, useCallback } from 'react';
import { PlusCircle } from 'lucide-react';
import JobForm from '../components/jobs/JobForm';
import { ToastContainer } from '../components/ui/Toast';
import './AddJob.css';

/** Page 2: Add a new job application */
const AddJob = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <main className="page-wrapper" id="add-job-page">
      <div className="container">
        {/* Page header */}
        <div className="addjob-header">
          <div className="addjob-header-icon" aria-hidden="true">
            <PlusCircle size={26} />
          </div>
          <div>
            <h1 className="addjob-title">Add Job Application</h1>
            <p className="addjob-subtitle">
              Track a new application — all fields marked <span className="req-star">*</span> are required.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="card addjob-card">
          <JobForm onSuccess={(msg) => addToast(msg, 'success')} />
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </main>
  );
};

export default AddJob;
