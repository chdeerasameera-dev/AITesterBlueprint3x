/**
 * 14-day rolling window metrics calculator — MyJobAssistant
 * All calculations are scoped to records within the last 14 calendar days.
 */

/**
 * Returns the colour for a given success rate based on range thresholds.
 * Low  (0–33%)  → Red    — needs improvement
 * Mid  (34–66%) → Orange — moderate
 * High (67–100%)→ Green  — performing well
 */
export const getSuccessRateColour = (rate) => {
  if (rate <= 33) return '#E53E3E';  // Red
  if (rate <= 66) return '#DD6B20';  // Orange
  return '#38A169';                   // Green
};

/**
 * Returns the start of the 14-day window (today − 14 days at midnight).
 */
const getWindowStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Filters job records to those within the last 14 calendar days.
 * @param {Array} jobs - Full array of JobRecord objects
 */
export const getRecentJobs = (jobs) => {
  const cutoff = getWindowStart();
  return jobs.filter((j) => new Date(j.dateApplied) >= cutoff);
};

/**
 * Computes all 8 dashboard metrics from the provided jobs array.
 * Automatically scopes to the 14-day window.
 *
 * Success Rate = (Successes / Interviews Attended) × 100, rounded.
 * Colour: 0–33% = Red | 34–66% = Orange | 67–100% = Green
 *
 * @param {Array} jobs - Full array of JobRecord objects
 * @returns {Object} Metrics object with all tile values + colour
 */
export const computeMetrics = (jobs) => {
  const recent = getRecentJobs(jobs);

  const interviewsAttended = recent.filter((j) => j.interviewDetails?.trim()).length;
  const successes          = recent.filter((j) => j.status === 'Selected').length;

  // Success Rate: how many interviewed candidates were selected
  const successRate =
    interviewsAttended > 0
      ? Math.round((successes / interviewsAttended) * 100)
      : 0;

  const successRateColour = getSuccessRateColour(successRate);

  return {
    profileMatched:   recent.filter((j) => j.profileMatched).length,
    jobsApplied:      recent.length,
    interviewsAttended,
    jobsRejected:     recent.filter((j) => j.status === 'Rejected').length,
    followUpsPending: recent.filter(
      (j) => j.followUp && j.status !== 'Selected' && j.status !== 'Rejected'
    ).length,
    successes,
    successRate,
    successRateColour,
    feedback:         recent.filter((j) => j.questionsAsked?.trim()).length,
  };
};
