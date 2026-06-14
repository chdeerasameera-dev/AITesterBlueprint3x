/**
 * Badge — Colour-coded status badge for job application status.
 */
import React from 'react';

const STATUS_STYLES = {
  Applied:     'badge badge-applied',
  Selected:    'badge badge-selected',
  Rejected:    'badge badge-rejected',
  'In Progress': 'badge badge-progress',
};

/** Colour-coded status badge */
const Badge = ({ status }) => (
  <span className={STATUS_STYLES[status] || 'badge badge-applied'} aria-label={`Status: ${status}`}>
    {status}
  </span>
);

export default Badge;
