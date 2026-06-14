/**
 * Dashboard — Page 1: 8 clickable metric tiles + animated SVG speedometer.
 * Each tile opens an InsightsModal with filtered jobs + Groq AI insights.
 * Success Rate tile scrolls to the speedometer section.
 * All metrics are scoped to the last 14 calendar days.
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  UserCheck, Briefcase, Mic, XCircle,
  Bell, Trophy, TrendingUp, MessageCircle
} from 'lucide-react';
import MetricTile from '../components/dashboard/MetricTile';
import Speedometer from '../components/dashboard/Speedometer';
import InsightsModal from '../components/ui/InsightsModal';
import { useJobs } from '../hooks/useJobs';
import { getRecentJobs } from '../utils/metrics';
import './Dashboard.css';

/** Dashboard page — 8 clickable metric tiles + Success Rate speedometer */
const Dashboard = () => {
  const { jobs, metrics, initialized } = useJobs();
  const speedometerRef = useRef(null);

  // InsightsModal state
  const [modal, setModal] = useState(null); // { tileType, title, icon, colour, jobs, filterKey }

  // ── Scroll to speedometer ─────────────────────────────────────────────────
  const scrollToSpeedometer = useCallback(() => {
    speedometerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // ── Filter functions per tile ─────────────────────────────────────────────
  const recentJobs = getRecentJobs(jobs);

  const filterMap = {
    jobsApplied:      recentJobs,
    profileMatched:   recentJobs.filter((j) => j.profileMatched),
    interviewed:      recentJobs.filter((j) => j.interviewDetails?.trim()),
    rejected:         recentJobs.filter((j) => j.status === 'Rejected'),
    followup:         recentJobs.filter((j) => j.followUp && j.status !== 'Selected' && j.status !== 'Rejected'),
    selected:         recentJobs.filter((j) => j.status === 'Selected'),
    feedback:         recentJobs.filter((j) => j.questionsAsked?.trim()),
    successRate:      recentJobs.filter((j) => j.interviewDetails?.trim()),
  };

  const openModal = useCallback((tileType, title, icon, colour) => {
    setModal({
      tileType,
      title,
      icon,
      colour,
      jobs: filterMap[tileType] || [],
      filterKey: tileType === 'jobsApplied' ? 'all' : tileType,
    });
  }, [recentJobs]);

  // ── Tile definitions ──────────────────────────────────────────────────────
  const tiles = [
    {
      label: 'Profile Matched',
      value: metrics.profileMatched,
      icon: UserCheck,
      colour: '#1A6B8A',
      subtitle: `${metrics.profileMatched} of ${metrics.jobsApplied} applications`,
      tileType: 'profileMatched',
    },
    {
      label: 'Jobs Applied',
      value: metrics.jobsApplied,
      icon: Briefcase,
      colour: '#2EBFA5',
      subtitle: 'Last 14 days',
      tileType: 'jobsApplied',
    },
    {
      label: 'Interviews Attended',
      value: metrics.interviewsAttended,
      icon: Mic,
      colour: '#3182CE',
      subtitle: 'Interview details recorded',
      tileType: 'interviewed',
    },
    {
      label: 'Jobs Rejected',
      value: metrics.jobsRejected,
      icon: XCircle,
      colour: '#E53E3E',
      subtitle: 'Status = Rejected',
      tileType: 'rejected',
    },
    {
      label: 'Follow-ups Pending',
      value: metrics.followUpsPending,
      icon: Bell,
      colour: '#D69E2E',
      subtitle: 'Awaiting response',
      tileType: 'followup',
    },
    {
      label: 'Successes',
      value: metrics.successes,
      icon: Trophy,
      colour: '#38A169',
      subtitle: 'Status = Selected',
      tileType: 'selected',
    },
    {
      label: 'Success Rate',
      value: `${metrics.successRate}%`,
      icon: TrendingUp,
      colour: '#38A169', // Always green per requirement
      subtitle: '↓ See speedometer',
      tileType: 'successRate',
      isSpeedometerLink: true,
    },
    {
      label: 'Feedback',
      value: metrics.feedback,
      icon: MessageCircle,
      colour: '#805AD5',
      subtitle: 'Interview questions recorded',
      tileType: 'feedback',
    },
  ];

  if (!initialized) {
    return (
      <div className="dashboard-loading" aria-live="polite">
        <div className="loading-spinner" aria-label="Loading dashboard…" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <main className="page-wrapper" id="dashboard-page">
      <div className="container">

        {/* ── Page header ── */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              Your job search metrics for the last <strong>14 days</strong> — click any tile for details &amp; AI insights
            </p>
          </div>
          <div className="window-badge" aria-label="Data window: last 14 days">
            📅 Last 14 Days
          </div>
        </div>

        {/* ── Metric tiles grid ── */}
        <section aria-label="Job search metrics" className="tiles-section">
          <div className="tiles-grid" role="list">
            {tiles.map((tile, i) => (
              <div key={tile.label} role="listitem">
                <MetricTile
                  icon={tile.icon}
                  label={tile.label}
                  value={tile.value}
                  colour={tile.colour}
                  subtitle={tile.subtitle}
                  index={i}
                  onClick={() => {
                    if (tile.isSpeedometerLink) {
                      scrollToSpeedometer();
                    } else {
                      openModal(tile.tileType, tile.label, tile.icon, tile.colour);
                    }
                  }}
                  onSubtitleClick={tile.isSpeedometerLink ? scrollToSpeedometer : undefined}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Speedometer card ── */}
        <section
          ref={speedometerRef}
          id="speedometer-section"
          className="speedometer-section animate-fadeInUp"
          style={{ animationDelay: '0.5s' }}
          aria-label="Interview success rate gauge"
        >
          <div className="card speedometer-card">
            <div className="speedometer-card-header">
              <div>
                <h2 className="speedometer-card-title">Interview Success Rate</h2>
                <p className="speedometer-card-desc">
                  Measures the proportion of interviews attended that resulted in a job offer.
                </p>
              </div>
              <div
                className="speedometer-rate-badge"
                style={{ color: metrics.successRateColour, borderColor: metrics.successRateColour }}
                aria-label={`Success rate: ${metrics.successRate}%`}
              >
                {metrics.successRate}%
              </div>
            </div>

            <Speedometer rate={metrics.successRate} />

            {/* Stats row */}
            <div className="speedometer-stats">
              <div className="stat-item">
                <span className="stat-val">{metrics.interviewsAttended}</span>
                <span className="stat-lbl">Interviews</span>
              </div>
              <div className="stat-divider" aria-hidden="true" />
              <div className="stat-item">
                <span className="stat-val" style={{ color: '#38A169' }}>{metrics.successes}</span>
                <span className="stat-lbl">Selected</span>
              </div>
              <div className="stat-divider" aria-hidden="true" />
              <div className="stat-item">
                <span className="stat-val" style={{ color: metrics.successRateColour }}>
                  {metrics.successRate}%
                </span>
                <span className="stat-lbl">Success Rate</span>
              </div>
            </div>

            {/* Range legend */}
            <div className="speedometer-range-legend">
              <span className="range-item range-red">🔴 Low (0–33%): Needs Improvement</span>
              <span className="range-item range-orange">🟠 Mid (34–66%): Moderate Performance</span>
              <span className="range-item range-green">🟢 High (67–100%): Excellent</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Insights Modal ── */}
      {modal && (
        <InsightsModal
          {...modal}
          metrics={metrics}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
};

export default Dashboard;
