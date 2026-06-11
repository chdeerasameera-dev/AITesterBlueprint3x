/**
 * testPlan.js — Render test plans / test strategies to Markdown
 * Layer 3: Atomic tool for deterministic formatting
 *
 * Supports two modes:
 *   - 'testPlan'     → Full test plan markdown
 *   - 'testStrategy' → Strategy-focused markdown (5 core sections)
 */

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────── */

function validateSchema(testPlan) {
  const required = ['testPlanId', 'sourceIssue', 'title', 'objective'];
  for (const field of required) {
    if (!testPlan[field]) throw new Error(`Missing required field: ${field}`);
  }
}

function formatField(value) {
  if (value === null || value === undefined) return 'TBD';
  if (typeof value === 'string') return value || 'TBD';
  if (Array.isArray(value)) return value.length > 0 ? value : ['TBD'];
  if (typeof value === 'object') return value;
  return String(value);
}

function bulletSection(title, items) {
  const header = title ? `### ${title}\n` : '';
  if (!items || items.length === 0) return `${header}- TBD\n\n`;
  return header + items.map(i => `- ${i}`).join('\n') + '\n\n';
}

function tableSection(title, rows, col1, col2) {
  const header = title ? `### ${title}\n\n` : '';
  if (!rows || rows.length === 0) return `${header}*None identified*\n\n`;
  const cap1 = col1.charAt(0).toUpperCase() + col1.slice(1);
  const cap2 = col2.charAt(0).toUpperCase() + col2.slice(1);
  let md = `${header}| ${cap1} | ${cap2} |\n|${'-'.repeat(cap1.length + 2)}|${'-'.repeat(cap2.length + 2)}|\n`;
  for (const row of rows) {
    md += `| ${formatField(row[col1])} | ${formatField(row[col2])} |\n`;
  }
  return md + '\n';
}

/* ──────────────────────────────────────────────────────────────
   MARKDOWN RENDERERS
────────────────────────────────────────────────────────── */

/**
 * Full Test Plan → Markdown
 */
function testPlanToMarkdown(testPlan) {
  const now = new Date().toISOString();
  let md = '';

  md += `# ${testPlan.title || 'Test Plan'}\n\n`;
  md += `**Document Type:** Test Plan\n`;
  md += `**Test Plan ID:** ${testPlan.testPlanId}\n`;
  md += `**Source Issue:** ${testPlan.sourceIssue}\n`;
  md += `**Generated:** ${now}\n`;
  md += `**Status:** Draft\n\n---\n\n`;

  md += `## Objective\n\n${formatField(testPlan.objective)}\n\n---\n\n`;

  if (testPlan.scope) {
    md += `## Scope\n\n`;
    md += bulletSection('In Scope',     testPlan.scope.inScope);
    md += bulletSection('Out of Scope', testPlan.scope.outOfScope);
    md += `---\n\n`;
  }

  if (testPlan.inclusions) {
    md += `## Inclusions\n\n`;
    md += bulletSection('', testPlan.inclusions);
    md += `---\n\n`;
  }

  if (testPlan.testEnvironments) {
    md += `## Test Environments\n\n`;
    md += bulletSection('', testPlan.testEnvironments);
    md += `---\n\n`;
  }

  if (testPlan.defectReporting) {
    md += `## Defect Reporting\n\n${formatField(testPlan.defectReporting)}\n\n---\n\n`;
  }

  if (testPlan.testStrategy) {
    md += `## Test Strategy\n\n`;
    md += bulletSection('', testPlan.testStrategy);
    md += `---\n\n`;
  }

  if (testPlan.schedule) {
    md += `## Schedule\n\n| Phase | Owner | Dates |\n|-------|-------|-------|\n`;
    for (const phase of testPlan.schedule) {
      md += `| ${formatField(phase.phase)} | ${formatField(phase.owner)} | ${formatField(phase.dates)} |\n`;
    }
    md += `\n---\n\n`;
  }

  if (testPlan.deliverables) {
    md += `## Deliverables\n\n`;
    md += bulletSection('', testPlan.deliverables);
    md += `---\n\n`;
  }

  if (testPlan.entryCriteria) {
    md += `## Entry Criteria\n\n`;
    md += bulletSection('', testPlan.entryCriteria);
    md += `---\n\n`;
  }

  if (testPlan.exitCriteria) {
    md += `## Exit Criteria\n\n`;
    md += bulletSection('', testPlan.exitCriteria);
    md += `---\n\n`;
  }

  if (testPlan.tools) {
    md += `## Tools\n\n`;
    md += bulletSection('', testPlan.tools);
    md += `---\n\n`;
  }

  if (testPlan.risks) {
    md += `## Risks & Mitigations\n\n`;
    md += tableSection('', testPlan.risks, 'risk', 'mitigation');
    md += `---\n\n`;
  }

  if (testPlan.approvals) {
    md += `## Approvals\n\n| Role | Name | Date |\n|------|------|------|\n`;
    for (const approval of testPlan.approvals) {
      md += `| ${formatField(approval.role)} | ${formatField(approval.name)} | TBD |\n`;
    }
    md += '\n';
  }

  return md;
}

/**
 * Test Strategy → Markdown (5 focused sections)
 */
function testStrategyToMarkdown(testPlan) {
  const now = new Date().toISOString();
  let md = '';

  md += `# ${testPlan.title || 'Test Strategy'}\n\n`;
  md += `**Document Type:** Test Strategy\n`;
  md += `**Strategy ID:** ${testPlan.testPlanId}\n`;
  md += `**Source Issue:** ${testPlan.sourceIssue}\n`;
  md += `**Generated:** ${now}\n`;
  md += `**Status:** Draft\n\n---\n\n`;

  md += `## Objective\n\n${formatField(testPlan.objective)}\n\n---\n\n`;

  if (testPlan.testStrategy) {
    md += `## Test Strategy\n\n`;
    md += bulletSection('', testPlan.testStrategy);
    md += `---\n\n`;
  }

  if (testPlan.testEnvironments) {
    md += `## Test Environments\n\n`;
    md += bulletSection('', testPlan.testEnvironments);
    md += `---\n\n`;
  }

  if (testPlan.tools) {
    md += `## Tools\n\n`;
    md += bulletSection('', testPlan.tools);
    md += `---\n\n`;
  }

  if (testPlan.risks) {
    md += `## Risks & Mitigations\n\n`;
    md += tableSection('', testPlan.risks, 'risk', 'mitigation');
  }

  return md;
}

/* ──────────────────────────────────────────────────────────────
   PUBLIC API
────────────────────────────────────────────────────────── */

/**
 * Convert test plan/strategy JSON to Markdown.
 * @param {object} testPlan
 * @param {string} mode - 'testPlan' | 'testStrategy'
 */
function toMarkdown(testPlan, mode = 'testPlan') {
  validateSchema(testPlan);
  return mode === 'testStrategy'
    ? testStrategyToMarkdown(testPlan)
    : testPlanToMarkdown(testPlan);
}

/**
 * Generate safe filename based on Jira ID and mode.
 * @param {string} jiraId
 * @param {string} mode - 'testPlan' | 'testStrategy'
 */
function getSafeFilename(jiraId, mode = 'testPlan') {
  const safe = jiraId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const prefix = mode === 'testStrategy' ? 'test-strategy' : 'test-plan';
  return `${prefix}-${safe}.md`;
}

export default { toMarkdown, validateSchema, formatField, getSafeFilename };
