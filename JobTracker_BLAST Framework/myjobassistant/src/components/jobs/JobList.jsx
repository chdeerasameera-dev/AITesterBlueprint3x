/**
 * JobList — Sortable, searchable, filterable table of all job applications.
 * filterKey prop (from URL param) pre-filters the list based on tile context.
 */
import React, { useState, useMemo } from 'react';
import { Eye, Trash2, ChevronUp, ChevronDown, Search } from 'lucide-react';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useJobs } from '../../hooks/useJobs';
import { getRecentJobs } from '../../utils/metrics';
import './JobList.css';

/** Pre-filter functions keyed by filterKey URL param */
const FILTER_FNS = {
  all:            () => true,
  profileMatched: (j) => j.profileMatched,
  interviewed:    (j) => !!j.interviewDetails?.trim(),
  rejected:       (j) => j.status === 'Rejected',
  followup:       (j) => j.followUp && j.status !== 'Selected' && j.status !== 'Rejected',
  selected:       (j) => j.status === 'Selected',
  feedback:       (j) => !!j.questionsAsked?.trim(),
};

/** Sortable, filterable table of job applications */
const JobList = ({ onSelect, filterKey = 'all' }) => {
  const { jobs, deleteJob } = useJobs();
  const [sortKey, setSortKey]   = useState('dateApplied');
  const [sortDir, setSortDir]   = useState('desc');
  const [search, setSearch]     = useState('');
  const [confirmId, setConfirmId] = useState(null);

  // Apply URL filter + search + sort
  const filtered = useMemo(() => {
    const preFilter = FILTER_FNS[filterKey] || FILTER_FNS.all;
    const q = search.toLowerCase();

    return jobs
      .filter(preFilter)
      .filter((j) => {
        if (!q) return true;
        return (
          j.companyName.toLowerCase().includes(q) ||
          j.jobTitle.toLowerCase().includes(q) ||
          j.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let aVal = a[sortKey];
        let bVal = b[sortKey];
        if (typeof aVal === 'boolean') aVal = aVal ? 1 : 0;
        if (typeof bVal === 'boolean') bVal = bVal ? 1 : 0;
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [jobs, filterKey, search, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleDelete = (id) => setConfirmId(id);
  const confirmDelete = () => { deleteJob(confirmId); setConfirmId(null); };

  const SortIcon = ({ k }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      : <ChevronUp size={14} style={{ opacity: 0.3 }} />;

  if (jobs.length === 0) {
    return (
      <div className="joblist-empty">
        <p>No job applications yet. <a href="/add">Add your first one →</a></p>
      </div>
    );
  }

  return (
    <>
      {/* Search + count */}
      <div className="joblist-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            id="job-search"
            className="form-control search-input"
            placeholder="Search by company, title or status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search job applications"
          />
        </div>
        <span className="joblist-count">{filtered.length} of {jobs.length} records</span>
      </div>

      {/* Table */}
      <div className="joblist-table-wrap">
        <table className="joblist-table" role="grid" aria-label="Job applications">
          <thead>
            <tr>
              {[
                { key: 'companyName',    label: 'Company' },
                { key: 'jobTitle',       label: 'Job Title' },
                { key: 'profileMatched', label: 'Profile' },
                { key: 'status',         label: 'Status' },
                { key: 'dateApplied',    label: 'Date Applied' },
                { key: 'followUp',       label: 'Follow-up' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="sortable-th"
                  aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <span>{label}</span>
                  <SortIcon k={key} />
                </th>
              ))}
              <th className="actions-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id} className="joblist-row">
                <td className="td-company"><span className="company-name">{job.companyName}</span></td>
                <td className="td-title">{job.jobTitle}</td>
                <td className="td-profile">{job.profileMatched ? '✅ Yes' : '❌ No'}</td>
                <td><Badge status={job.status} /></td>
                <td className="td-date">
                  {new Date(job.dateApplied).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>
                <td className="td-followup">
                  {job.followUp ? <span className="follow-yes">🔔 Yes</span> : <span className="follow-no">— No</span>}
                </td>
                <td className="td-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => onSelect(job)}
                    aria-label={`View details for ${job.jobTitle} at ${job.companyName}`}
                    title="View Details"
                    id={`view-btn-${job.id}`}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(job.id)}
                    aria-label={`Delete ${job.jobTitle} at ${job.companyName}`}
                    title="Delete"
                    id={`delete-btn-${job.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="joblist-no-results">
          {search ? `No results for "${search}"` : 'No records match this filter.'}
        </p>
      )}

      {confirmId && (
        <ConfirmDialog
          title="Delete Job Application"
          message="Are you sure you want to delete this job application? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
          confirmLabel="Delete"
        />
      )}
    </>
  );
};

export default JobList;
