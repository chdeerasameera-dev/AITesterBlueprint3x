/**
 * JobForm — Add Job form with full validation (9 fields).
 * Saves to JobContext on submit and redirects to Dashboard.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle } from 'lucide-react';
import { useJobs } from '../../hooks/useJobs';
import './JobForm.css';

const STATUS_OPTIONS = ['Applied', 'In Progress', 'Selected', 'Rejected'];

const today = () => new Date().toISOString().split('T')[0];

const INITIAL_STATE = {
  jobTitle: '',
  companyName: '',
  jobDescription: '',
  profileMatched: '',
  interviewDetails: '',
  followUp: '',
  status: 'Applied',
  questionsAsked: '',
  dateApplied: today(),
};

/** Add Job form with 9 fields and inline validation */
const JobForm = ({ onSuccess }) => {
  const { addJob } = useJobs();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── Field change handlers ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};

    if (!form.jobTitle.trim())
      errs.jobTitle = 'Job Title is required (max 255 characters)';
    else if (form.jobTitle.length > 255)
      errs.jobTitle = `Job Title must be 255 characters or fewer (currently ${form.jobTitle.length})`;

    if (!form.companyName.trim())
      errs.companyName = 'Company Name is required (max 100 characters)';
    else if (form.companyName.length > 100)
      errs.companyName = `Company Name must be 100 characters or fewer (currently ${form.companyName.length})`;

    if (form.profileMatched === '')
      errs.profileMatched = 'Please select whether your profile matched';

    if (form.followUp === '')
      errs.followUp = 'Please select whether a follow-up is needed';

    if (!form.status)
      errs.status = 'Status is required';

    if (!form.dateApplied)
      errs.dateApplied = 'Date Applied is required';
    else if (new Date(form.dateApplied) > new Date())
      errs.dateApplied = 'Date Applied cannot be in the future';

    if (form.jobDescription.length > 10000)
      errs.jobDescription = `Job Description must be 10,000 characters or fewer (currently ${form.jobDescription.length})`;

    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    const record = {
      id: uuidv4(),
      ...form,
      profileMatched: form.profileMatched === 'true',
      followUp: form.followUp === 'true',
      createdAt: new Date().toISOString(),
    };

    addJob(record);
    onSuccess?.('Job application added successfully.');
    navigate('/');
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setForm(INITIAL_STATE);
    setErrors({});
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fieldProps = (name) => ({
    name,
    id: `field-${name}`,
    value: form[name],
    onChange: handleChange,
    className: `form-control${errors[name] ? ' error' : ''}`,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `err-${name}` : undefined,
  });

  const FieldError = ({ name }) =>
    errors[name] ? (
      <span className="form-error" id={`err-${name}`} role="alert">
        <AlertCircle size={13} aria-hidden="true" />
        {errors[name]}
      </span>
    ) : null;

  return (
    <form className="job-form" onSubmit={handleSubmit} noValidate aria-label="Add Job Application">
      <div className="job-form-grid">

        {/* Job Title */}
        <div className="form-group form-group--full">
          <label className="form-label" htmlFor="field-jobTitle">
            Job Title <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            maxLength={260}
            placeholder="e.g. Senior QA Engineer"
            {...fieldProps('jobTitle')}
          />
          <div className="field-footer">
            <FieldError name="jobTitle" />
            <span className={`char-counter${form.jobTitle.length > 255 ? ' over-limit' : ''}`}>
              {form.jobTitle.length} / 255
            </span>
          </div>
        </div>

        {/* Company Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="field-companyName">
            Company Name <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            maxLength={105}
            placeholder="e.g. Infosys"
            {...fieldProps('companyName')}
          />
          <div className="field-footer">
            <FieldError name="companyName" />
            <span className={`char-counter${form.companyName.length > 100 ? ' over-limit' : ''}`}>
              {form.companyName.length} / 100
            </span>
          </div>
        </div>

        {/* Date Applied */}
        <div className="form-group">
          <label className="form-label" htmlFor="field-dateApplied">
            Date Applied <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            type="date"
            max={today()}
            {...fieldProps('dateApplied')}
          />
          <FieldError name="dateApplied" />
        </div>

        {/* Status */}
        <div className="form-group">
          <label className="form-label" htmlFor="field-status">
            Status <span className="required" aria-hidden="true">*</span>
          </label>
          <select {...fieldProps('status')}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FieldError name="status" />
        </div>

        {/* Profile Matched */}
        <div className="form-group">
          <fieldset className="radio-fieldset">
            <legend className="form-label">
              Profile Matched? <span className="required" aria-hidden="true">*</span>
            </legend>
            <div className="radio-group">
              {['true', 'false'].map((val) => (
                <label key={val} className="radio-label" htmlFor={`field-profileMatched-${val}`}>
                  <input
                    type="radio"
                    id={`field-profileMatched-${val}`}
                    name="profileMatched"
                    value={val}
                    checked={form.profileMatched === val}
                    onChange={handleChange}
                    className="radio-input"
                    aria-invalid={!!errors.profileMatched}
                  />
                  <span className="radio-custom" aria-hidden="true" />
                  {val === 'true' ? '✅ Yes' : '❌ No'}
                </label>
              ))}
            </div>
            <FieldError name="profileMatched" />
          </fieldset>
        </div>

        {/* Follow-up */}
        <div className="form-group">
          <fieldset className="radio-fieldset">
            <legend className="form-label">
              Follow-up Required? <span className="required" aria-hidden="true">*</span>
            </legend>
            <div className="radio-group">
              {['true', 'false'].map((val) => (
                <label key={val} className="radio-label" htmlFor={`field-followUp-${val}`}>
                  <input
                    type="radio"
                    id={`field-followUp-${val}`}
                    name="followUp"
                    value={val}
                    checked={form.followUp === val}
                    onChange={handleChange}
                    className="radio-input"
                    aria-invalid={!!errors.followUp}
                  />
                  <span className="radio-custom" aria-hidden="true" />
                  {val === 'true' ? '✅ Yes' : '❌ No'}
                </label>
              ))}
            </div>
            <FieldError name="followUp" />
          </fieldset>
        </div>

        {/* Job Description */}
        <div className="form-group form-group--full">
          <label className="form-label" htmlFor="field-jobDescription">
            Job Description <span className="optional">(optional)</span>
          </label>
          <textarea
            rows={4}
            placeholder="Paste the job description here..."
            {...fieldProps('jobDescription')}
          />
          <div className="field-footer">
            <FieldError name="jobDescription" />
            <span className={`char-counter${form.jobDescription.length > 10000 ? ' over-limit' : ''}`}>
              {form.jobDescription.length} / 10,000
            </span>
          </div>
        </div>

        {/* Interview Details */}
        <div className="form-group form-group--full">
          <label className="form-label" htmlFor="field-interviewDetails">
            Interview Details <span className="optional">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Round 1: Technical; Round 2: HR..."
            {...fieldProps('interviewDetails')}
          />
        </div>

        {/* Questions Asked */}
        <div className="form-group form-group--full">
          <label className="form-label" htmlFor="field-questionsAsked">
            Questions Asked <span className="optional">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. 1. Explain POM. 2. Handle dynamic elements..."
            {...fieldProps('questionsAsked')}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleReset}
          id="reset-form-btn"
        >
          Reset
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          id="submit-job-btn"
        >
          {submitting ? 'Saving…' : '+ Add Job'}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
