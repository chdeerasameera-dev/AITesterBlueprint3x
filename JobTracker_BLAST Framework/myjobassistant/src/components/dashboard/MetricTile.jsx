/**
 * MetricTile — A single dashboard metric card with icon, value, and label.
 * When onClick is provided the tile becomes interactive (pointer cursor + hover ring).
 */
import React from 'react';
import './MetricTile.css';

/** Reusable dashboard metric tile card */
const MetricTile = ({ icon: Icon, label, value, colour, subtitle, index = 0, onClick, onSubtitleClick }) => {
  const isClickable = !!onClick;

  return (
    <div
      className={`metric-tile animate-fadeInUp${isClickable ? ' metric-tile--clickable' : ''}`}
      style={{
        animationDelay: `${index * 0.06}s`,
        '--tile-colour': colour || 'var(--ocean-bright)',
      }}
      role={isClickable ? 'button' : 'article'}
      aria-label={`${label}: ${value}${isClickable ? '. Click to view details.' : ''}`}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="tile-icon-wrap">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="tile-body">
        <div className="tile-value" style={{ color: colour || 'var(--text-primary)' }}>
          {value}
        </div>
        <div className="tile-label">{label}</div>
        {subtitle && (
          <div
            className={`tile-subtitle${onSubtitleClick ? ' tile-subtitle--link' : ''}`}
            onClick={onSubtitleClick ? (e) => { e.stopPropagation(); onSubtitleClick(); } : undefined}
            role={onSubtitleClick ? 'button' : undefined}
            tabIndex={onSubtitleClick ? 0 : undefined}
            onKeyDown={onSubtitleClick ? (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onSubtitleClick(); } } : undefined}
          >
            {subtitle}
          </div>
        )}
      </div>
      {isClickable && <div className="tile-arrow" aria-hidden="true">›</div>}
    </div>
  );
};

export default MetricTile;
