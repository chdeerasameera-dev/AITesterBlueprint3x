/**
 * JobContext — Global state management for job records.
 * Provides CRUD operations and auto-syncs to localStorage.
 */
import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import { loadJobs, saveJobs } from '../utils/storage';
import { SEED_RECORDS } from '../utils/seedData';
import { computeMetrics } from '../utils/metrics';

export const JobContext = createContext(null);

// ── Reducer ──────────────────────────────────────────────────────────────────
const jobReducer = (state, action) => {
  switch (action.type) {
    case 'INIT':
      return { ...state, jobs: action.payload, initialized: true };

    case 'ADD_JOB':
      return { ...state, jobs: [action.payload, ...state.jobs] };

    case 'DELETE_JOB':
      return { ...state, jobs: state.jobs.filter((j) => j.id !== action.payload) };

    case 'UPDATE_JOB':
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === action.payload.id ? action.payload : j)),
      };

    default:
      return state;
  }
};

// ── Provider ─────────────────────────────────────────────────────────────────
export const JobProvider = ({ children }) => {
  const [state, dispatch] = useReducer(jobReducer, {
    jobs: [],
    initialized: false,
  });

  // On mount: load from localStorage; inject seed data if empty
  useEffect(() => {
    const stored = loadJobs();
    if (stored.length === 0) {
      saveJobs(SEED_RECORDS);
      dispatch({ type: 'INIT', payload: SEED_RECORDS });
    } else {
      dispatch({ type: 'INIT', payload: stored });
    }
  }, []);

  // Sync to localStorage whenever jobs change (after init)
  useEffect(() => {
    if (state.initialized) {
      saveJobs(state.jobs);
    }
  }, [state.jobs, state.initialized]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const addJob = useCallback((job) => {
    dispatch({ type: 'ADD_JOB', payload: job });
  }, []);

  const deleteJob = useCallback((id) => {
    dispatch({ type: 'DELETE_JOB', payload: id });
  }, []);

  const updateJob = useCallback((job) => {
    dispatch({ type: 'UPDATE_JOB', payload: job });
  }, []);

  const getJobById = useCallback(
    (id) => state.jobs.find((j) => j.id === id),
    [state.jobs]
  );

  // Derived: metrics auto-computed from current jobs
  const metrics = computeMetrics(state.jobs);

  const value = {
    jobs: state.jobs,
    metrics,
    initialized: state.initialized,
    addJob,
    deleteJob,
    updateJob,
    getJobById,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
