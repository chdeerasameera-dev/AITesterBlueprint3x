/**
 * useJobs — Custom hook for all CRUD operations on job records.
 * Syncs automatically with localStorage via the JobContext.
 */
import { useContext } from 'react';
import { JobContext } from '../context/JobContext';

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};
