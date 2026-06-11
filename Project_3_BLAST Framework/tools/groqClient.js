/**
 * groqClient.js — Generate test plans / test strategies via GROQ LLM API
 * Layer 3: Atomic tool for LLM-based generation
 * 
 * Supports two modes:
 *   - 'testPlan'     → Full test plan (all sections)
 *   - 'testStrategy' → Focused strategy (objective, approach, environments, tools, risks)
 */

import https from 'https';

/* ──────────────────────────────────────────────────────────────
   PROMPT BUILDERS
────────────────────────────────────────────────────────────── */

/**
 * Full Test Plan prompt
 */
function buildTestPlanPrompt(issue) {
  return `You are a senior QA architect. Generate a formal, professional Test Plan for the following Jira issue.

Issue: ${issue.key}
Summary: ${issue.summary}
Description: ${issue.description}
Type: ${issue.issueType}
Priority: ${issue.priority}

Output a VALID JSON object (no markdown, no comments, no extra text) with this exact structure:
{
  "testPlanId": "TP-${issue.key}",
  "sourceIssue": "${issue.key}",
  "title": "Test Plan — ${issue.summary}",
  "objective": "<1-2 sentence description of test objective>",
  "scope": {
    "inScope": ["<item1>", "<item2>"],
    "outOfScope": ["<item1>"]
  },
  "inclusions": ["<requirement1>"],
  "testEnvironments": ["Staging", "Production"],
  "defectReporting": "<process description>",
  "testStrategy": ["<strategy1>", "<strategy2>"],
  "schedule": [
    {"phase": "Planning",   "owner": "QA Lead",  "dates": "TBD"},
    {"phase": "Execution",  "owner": "QA Team",  "dates": "TBD"},
    {"phase": "Reporting",  "owner": "QA Lead",  "dates": "TBD"}
  ],
  "deliverables": ["Test cases", "Test report", "Defect summary"],
  "entryCriteria": ["Requirements approved", "Test environment ready"],
  "exitCriteria": ["All tests passed", "Defects reviewed"],
  "tools": ["Selenium", "JIRA", "TestRail"],
  "risks": [
    {"risk": "<risk description>", "mitigation": "<mitigation>"}
  ],
  "approvals": [
    {"role": "QA Lead", "name": "TBD"}
  ]
}

Rules:
- Use formal QA language and professional tone
- Where data is unknown, use "TBD"
- Do not fabricate data not present in the issue
- Return ONLY valid JSON, no extra text or markdown
- Ensure JSON is parseable (valid syntax)`;
}

/**
 * Focused Test Strategy prompt — only core strategy sections
 */
function buildTestStrategyPrompt(issue) {
  return `You are a senior QA architect. Generate a focused, professional Test Strategy for the following Jira issue.

Issue: ${issue.key}
Summary: ${issue.summary}
Description: ${issue.description}
Type: ${issue.issueType}
Priority: ${issue.priority}

Output a VALID JSON object (no markdown, no comments, no extra text) with this exact structure:
{
  "testPlanId": "TS-${issue.key}",
  "sourceIssue": "${issue.key}",
  "title": "Test Strategy — ${issue.summary}",
  "objective": "<1-2 sentence description of the testing objective>",
  "testStrategy": [
    "<strategy approach 1 — e.g. Functional Testing using black-box techniques>",
    "<strategy approach 2 — e.g. Regression testing on affected modules>",
    "<strategy approach 3 — e.g. Boundary value and equivalence partitioning>"
  ],
  "testEnvironments": ["<env1>", "<env2>"],
  "tools": ["<tool1>", "<tool2>"],
  "risks": [
    {"risk": "<risk>", "mitigation": "<mitigation>"},
    {"risk": "<risk>", "mitigation": "<mitigation>"}
  ]
}

Rules:
- Focus ONLY on the strategy-level content — do NOT include schedule, approvals, or detailed scope
- Make the testStrategy array rich and specific to the issue (at least 3 approaches)
- Use formal QA language
- Where data is unknown, use "TBD"
- Return ONLY valid JSON, no extra text or markdown
- Ensure JSON is parseable (valid syntax)`;
}

/* ──────────────────────────────────────────────────────────────
   HTTP CLIENT
────────────────────────────────────────────────────────── */

function callGroqApi(payload, groqKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'BLASTFramework/1.0',
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } else {
          reject({ status: res.statusCode, statusText: res.statusMessage, body: responseData });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('GROQ request timeout')); });
    req.write(data);
    req.end();
  });
}

/* ──────────────────────────────────────────────────────────────
   JSON EXTRACTOR
────────────────────────────────────────────────────────── */

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        throw new Error('Could not parse JSON from response');
      }
    }
    // Try to find raw JSON object in text
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch (e3) {
        throw new Error('Could not extract JSON object from response');
      }
    }
    throw new Error('Invalid JSON response from GROQ');
  }
}

/* ──────────────────────────────────────────────────────────────
   MAIN GENERATE FUNCTION
────────────────────────────────────────────────────────── */

/**
 * Generate test plan or test strategy from a Jira issue.
 * @param {object} config     - { groqKey, ... }
 * @param {object} issue      - Normalized Jira issue
 * @param {string} mode       - 'testPlan' | 'testStrategy'
 */
async function generate(config, issue, mode = 'testPlan') {
  if (!config.groqKey) throw new Error('Missing GROQ API key in config');
  if (!issue || !issue.key) throw new Error('Invalid issue object provided');

  const prompt = mode === 'testStrategy'
    ? buildTestStrategyPrompt(issue)
    : buildTestPlanPrompt(issue);

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 2048,
  };

  try {
    const response = await callGroqApi(payload, config.groqKey);

    if (!response.body.choices || !response.body.choices[0]) {
      throw new Error('Invalid GROQ response structure');
    }

    const responseText = response.body.choices[0].message?.content || '';
    return extractJson(responseText);

  } catch (error) {
    if (error && error.status) {
      throw new Error(`GROQ generation failed (Status ${error.status} ${error.statusText || ''}): ${error.body}`);
    }
    throw new Error(`GROQ generation failed: ${error.message || JSON.stringify(error)}`);
  }
}

export default { generate, buildTestPlanPrompt, buildTestStrategyPrompt, extractJson };
