/**
 * Jobs — Page 3: Full job list with URL-param based filtering.
 * Reads ?filter= from URL to pre-filter the job list (driven by tile clicks).
 */
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List, Filter } from 'lucide-react';
import JobList from '../components/jobs/JobList';
import JobDetailModal from '../components/jobs/JobDetailModal';
import './Jobs.css';

// Human-readable labels for each filter key
const FILTER_LABELS = {
  all:            'All Applications',
  profileMatched: 'Profile Matched',
  interviewed:    'Interviews Attended',
  rejected:       'Jobs Rejected',
  followup:       'Follow-ups Pending',
  selected:       'Successes (Selected)',
  feedback:       'Feedback Captured',
};

/** Page 3: All job applications — filterable from URL params */
const Jobs = () => {
  const [searchParams] = useSearchParams();
  const filterKey = searchParams.get('filter') || 'all';
  const filterLabel = FILTER_LABELS[filterKey] || 'All Applications';

  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <main className="page-wrapper" id="jobs-page">
      <div className="container">

        {/* Page header */}
        <div className="jobs-header">
          <div className="jobs-header-icon" aria-hidden="true">
            <List size={24} />
          </div>
          <div>
            <h1 className="jobs-title">Job Applications</h1>
            <p className="jobs-subtitle">
              Click any row to view full details.
            </p>
          </div>
        </div>

        {/* Active filter badge */}
        {filterKey && filterKey !== 'all' && (
          <div className="filter-badge" role="status" aria-live="polite">
            <Filter size={13} aria-hidden="true" />
            Filtered by: <strong>{filterLabel}</strong>
          </div>
        )}

        {/* Table card */}
        <div className="card jobs-card">
          <JobList onSelect={setSelectedJob} filterKey={filterKey} />
        </div>
      </div>

      {/* Detail drawer */}
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </main>
  );
};

export default Jobs;
