/** localStorage helpers — read/write job records safely */

const STORAGE_KEY = 'mja_jobs';

/**
 * Load all job records from localStorage.
 * Returns an empty array if nothing is stored or data is corrupted.
 */
export const loadJobs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    console.error('[storage] Failed to parse stored jobs');
    return [];
  }
};

/**
 * Persist the full jobs array to localStorage.
 * Returns true on success, false if the quota is exceeded.
 */
export const saveJobs = (jobs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('[storage] localStorage quota exceeded');
      return false;
    }
    throw err;
  }
};

/**
 * Clear all stored job records (use with caution).
 */
export const clearJobs = () => {
  localStorage.removeItem(STORAGE_KEY);
};
