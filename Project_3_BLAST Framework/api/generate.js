/**
 * api/generate.js — Vercel Serverless Function
 * Testing Buddy — AI-Powered QA Document Generator
 *
 * Handles POST /api/generate with mode support:
 *   mode = 'testPlan'     → Full Test Plan
 *   mode = 'testStrategy' → Focused Test Strategy
 */

import jiraClient from '../tools/jiraClient.js';
import groqClient from '../tools/groqClient.js';
import testPlanRenderer from '../tools/testPlan.js';

export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { jiraId, mode = 'testPlan', config: userConfig } = req.body;

    if (!jiraId) {
      return res.status(400).json({ success: false, error: 'Missing jiraId in request' });
    }

    const validModes = ['testPlan', 'testStrategy'];
    const outputMode = validModes.includes(mode) ? mode : 'testPlan';

    // Merge user config with environment variables
    const config = {
      jiraUrl:   (userConfig && userConfig.jiraUrl)   || process.env.JIRA_URL,
      jiraEmail: (userConfig && userConfig.jiraEmail) || process.env.JIRA_EMAIL,
      jiraToken: (userConfig && userConfig.jiraToken) || process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN,
      groqKey:   (userConfig && userConfig.groqKey)   || process.env.GROQ_KEY,
    };

    if (!config.jiraUrl || !config.jiraEmail || !config.jiraToken) {
      return res.status(400).json({ success: false, error: 'Missing Jira credentials' });
    }
    if (!config.groqKey) {
      return res.status(400).json({ success: false, error: 'Missing GROQ API key' });
    }

    // Step 1: Fetch Jira issue
    const issue = await jiraClient.fetch(config, jiraId);

    // Step 2: Generate document via GROQ (mode-aware)
    const testPlan = await groqClient.generate(config, issue, outputMode);

    // Step 3: Render to Markdown (mode-aware)
    const markdown = testPlanRenderer.toMarkdown(testPlan, outputMode);
    const filename = testPlanRenderer.getSafeFilename(jiraId, outputMode);

    return res.status(200).json({ success: true, testPlan, markdown, filename });

  } catch (error) {
    console.error('Generate error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Generation failed' });
  }
};
