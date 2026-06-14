/**
 * Speedometer — Pure SVG gauge showing Interview Success Rate (0–100%).
 * Needle rotates from leftmost (0%) through top (50%) to rightmost (100%).
 *
 * Colour ranges:
 *   Low  (0–33%)   → Red    #E53E3E
 *   Mid  (34–66%)  → Orange #DD6B20
 *   High (67–100%) → Green  #38A169
 */
import React, { useEffect, useRef, useState } from 'react';
import './Speedometer.css';

/** Get the colour for the current rate based on range thresholds */
const getRangeColour = (rate) => {
  if (rate <= 33) return '#E53E3E';
  if (rate <= 66) return '#DD6B20';
  return '#38A169';
};

/** SVG speedometer gauge for interview success rate */
const Speedometer = ({ rate = 0 }) => {
  const [animatedRate, setAnimatedRate] = useState(0);
  const rafRef = useRef(null);

  // Animate needle on mount / rate change
  useEffect(() => {
    const target = Math.max(0, Math.min(100, rate));
    const start  = performance.now();
    const duration = 1000; // ms

    const step = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedRate(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rate]);

  // ── SVG geometry ──────────────────────────────────────────────────────────
  const cx = 150;
  const cy = 130;
  const r  = 100;

  // Semicircle arc from LEFT (cx-r, cy) through TOP to RIGHT (cx+r, cy)
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // ── Needle angle (CORRECTED) ──────────────────────────────────────────────
  // Maps:  0% → 180° (left)  |  50% → 270° (top in SVG y-down)  |  100% → 360°/0° (right)
  const angleDeg = 180 + (animatedRate / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleX  = cx + 85 * Math.cos(angleRad);
  const needleY  = cy + 85 * Math.sin(angleRad);

  const displayRate = Math.round(animatedRate);
  const colour      = getRangeColour(displayRate);

  return (
    <div className="speedometer-wrapper" aria-label={`Interview success rate: ${rate}%`}>
      <svg
        viewBox="0 0 300 190"
        className="speedometer-svg"
        role="img"
        aria-hidden="true"
      >
        <defs>
          {/* Arc gradient: Red (0%) → Orange (50%) → Green (100%) */}
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#E53E3E" />
            <stop offset="33%"  stopColor="#E53E3E" />
            <stop offset="50%"  stopColor="#DD6B20" />
            <stop offset="67%"  stopColor="#DD6B20" />
            <stop offset="100%" stopColor="#38A169" />
          </linearGradient>

          <filter id="needleShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Background arc track */}
        <path d={arcPath} fill="none" stroke="#E2E8F0" strokeWidth="20" strokeLinecap="round" />

        {/* Coloured gradient arc */}
        <path d={arcPath} fill="none" stroke="url(#arcGrad)" strokeWidth="20" strokeLinecap="round" opacity="0.9" />

        {/* Tick marks at 0%, 25%, 50%, 75%, 100% */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const tDeg = 180 + (tick / 100) * 180;
          const tRad = (tDeg * Math.PI) / 180;
          return (
            <line
              key={tick}
              x1={cx + 92 * Math.cos(tRad)} y1={cy + 92 * Math.sin(tRad)}
              x2={cx + 108 * Math.cos(tRad)} y2={cy + 108 * Math.sin(tRad)}
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Arc end labels */}
        <text x={cx - r - 14} y={cy + 16} textAnchor="middle" fontSize="11" fill="#64748B" fontFamily="Inter,sans-serif" fontWeight="600">0%</text>
        <text x={cx}          y={cy - r - 14} textAnchor="middle" fontSize="11" fill="#64748B" fontFamily="Inter,sans-serif" fontWeight="600">50%</text>
        <text x={cx + r + 14} y={cy + 16} textAnchor="middle" fontSize="11" fill="#64748B" fontFamily="Inter,sans-serif" fontWeight="600">100%</text>

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={needleX} y2={needleY}
          stroke={colour}
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#needleShadow)"
        />

        {/* Hub */}
        <circle cx={cx} cy={cy} r="9" fill={colour} />
        <circle cx={cx} cy={cy} r="4" fill="#fff" />

        {/* Score display */}
        <text
          x={cx} y={cy + 42}
          textAnchor="middle"
          fontSize="24"
          fontWeight="800"
          fill={colour}
          fontFamily="Inter,sans-serif"
        >
          {displayRate}%
        </text>
        <text
          x={cx} y={cy + 58}
          textAnchor="middle"
          fontSize="10"
          fill="#94A3B8"
          fontFamily="Inter,sans-serif"
          letterSpacing="0.06em"
        >
          SUCCESS RATE
        </text>
      </svg>

      {/* Legend */}
      <div className="speedometer-legend">
        <span className="legend-item legend-red">Low (0–33%)</span>
        <span className="legend-item legend-amber">Mid (34–66%)</span>
        <span className="legend-item legend-green">High (67–100%)</span>
      </div>
    </div>
  );
};

export default Speedometer;
