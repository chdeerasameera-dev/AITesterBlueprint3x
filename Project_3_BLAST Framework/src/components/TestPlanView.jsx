// src/components/TestPlanView.jsx — Renders Test Plan or Test Strategy output
import React, { useState } from 'react';

const SECTION_META = {
  objective:        { icon: '🎯', label: 'Objective' },
  scope:            { icon: '📐', label: 'Scope' },
  inclusions:       { icon: '✅', label: 'Inclusions' },
  testEnvironments: { icon: '🖥️', label: 'Test Environments' },
  defectReporting:  { icon: '🐛', label: 'Defect Reporting' },
  testStrategy:     { icon: '🗺️', label: 'Test Strategy' },
  schedule:         { icon: '📅', label: 'Schedule' },
  deliverables:     { icon: '📦', label: 'Deliverables' },
  entryCriteria:    { icon: '🔑', label: 'Entry Criteria' },
  exitCriteria:     { icon: '🏁', label: 'Exit Criteria' },
  tools:            { icon: '🔧', label: 'Tools' },
  risks:            { icon: '⚠️', label: 'Risks & Mitigations' },
  approvals:        { icon: '✍️', label: 'Approvals' },
};

function TestPlanView({ testPlan, mode = 'testPlan' }) {
  const initialExpanded = { objective: true, scope: true, testStrategy: true };
  const [expandedSections, setExpandedSections] = useState(initialExpanded);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderArray = (items) => {
    if (!items || items.length === 0) return <p style={{ color: 'var(--text-muted)' }}>TBD</p>;
    return (
      <ul>
        {items.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    );
  };

  const renderTable = (rows, cols) => {
    if (!rows || rows.length === 0) return <p style={{ color: 'var(--text-muted)' }}>None identified</p>;
    return (
      <table className="data-table">
        <thead>
          <tr>{cols.map(col => <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {cols.map(col => <td key={col}>{row[col] || 'TBD'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const SectionBlock = ({ id, children }) => {
    const meta = SECTION_META[id] || { icon: '📄', label: id };
    const isOpen = !!expandedSections[id];
    return (
      <div className="section">
        <div className="section-header" onClick={() => toggleSection(id)} role="button" tabIndex={0}
             onKeyDown={e => e.key === 'Enter' && toggleSection(id)}>
          <span className="section-icon">{meta.icon}</span>
          {meta.label}
          <span className={`section-chevron${isOpen ? ' open' : ''}`}>▼</span>
        </div>
        {isOpen && <div className="section-content">{children}</div>}
      </div>
    );
  };

  const docType = mode === 'testStrategy' ? 'Test Strategy' : 'Test Plan';

  return (
    <div className="test-plan-view">
      {/* Header */}
      <div className="test-plan-header">
        <div className="plan-badge">
          {mode === 'testStrategy' ? '🎯 Test Strategy' : '📋 Test Plan'}
        </div>
        <h2>{testPlan.title}</h2>
        <div className="plan-meta">
          <span><strong>ID:</strong> {testPlan.testPlanId}</span>
          <span><strong>Source:</strong> {testPlan.sourceIssue}</span>
          <span><strong>Generated:</strong> {new Date().toLocaleDateString()}</span>
          <span><strong>Status:</strong> Draft</span>
        </div>
      </div>

      {/* Sections */}
      <div className="test-plan-sections">

        {/* Objective — always shown */}
        <SectionBlock id="objective">
          <p>{testPlan.objective || 'TBD'}</p>
        </SectionBlock>

        {/* Test Strategy — always shown */}
        {testPlan.testStrategy && (
          <SectionBlock id="testStrategy">
            {renderArray(testPlan.testStrategy)}
          </SectionBlock>
        )}

        {/* Test Environments — always shown */}
        {testPlan.testEnvironments && (
          <SectionBlock id="testEnvironments">
            {renderArray(testPlan.testEnvironments)}
          </SectionBlock>
        )}

        {/* Tools — always shown */}
        {testPlan.tools && (
          <SectionBlock id="tools">
            {renderArray(testPlan.tools)}
          </SectionBlock>
        )}

        {/* Risks — always shown */}
        {testPlan.risks && testPlan.risks.length > 0 && (
          <SectionBlock id="risks">
            {renderTable(testPlan.risks, ['risk', 'mitigation'])}
          </SectionBlock>
        )}

        {/* ── Test Plan ONLY sections ── */}
        {mode === 'testPlan' && (
          <>
            {testPlan.scope && (
              <SectionBlock id="scope">
                <h4>In Scope</h4>
                {renderArray(testPlan.scope.inScope)}
                <h4>Out of Scope</h4>
                {renderArray(testPlan.scope.outOfScope)}
              </SectionBlock>
            )}

            {testPlan.inclusions && (
              <SectionBlock id="inclusions">
                {renderArray(testPlan.inclusions)}
              </SectionBlock>
            )}

            {testPlan.defectReporting && (
              <SectionBlock id="defectReporting">
                <p>{testPlan.defectReporting}</p>
              </SectionBlock>
            )}

            {testPlan.schedule && (
              <SectionBlock id="schedule">
                {renderTable(testPlan.schedule, ['phase', 'owner', 'dates'])}
              </SectionBlock>
            )}

            {testPlan.deliverables && (
              <SectionBlock id="deliverables">
                {renderArray(testPlan.deliverables)}
              </SectionBlock>
            )}

            {testPlan.entryCriteria && (
              <SectionBlock id="entryCriteria">
                {renderArray(testPlan.entryCriteria)}
              </SectionBlock>
            )}

            {testPlan.exitCriteria && (
              <SectionBlock id="exitCriteria">
                {renderArray(testPlan.exitCriteria)}
              </SectionBlock>
            )}

            {testPlan.approvals && (
              <SectionBlock id="approvals">
                {renderTable(testPlan.approvals, ['role', 'name'])}
              </SectionBlock>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default TestPlanView;
