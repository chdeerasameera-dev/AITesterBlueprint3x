/**
 * server.js — Express proxy and routing
 * Layer 2: Navigation logic
 * 
 * Handles:
 * - Jira API proxying (CORS bypass)
 * - GROQ API calls
 * - Test plan generation pipeline
 * - Static frontend serving
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jiraClient from './tools/jiraClient.js';
import groqClient from './tools/groqClient.js';
import testPlanRenderer from './tools/testPlan.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// --- API Routes ---

/**
 * GET /api/health — Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Testing Buddy',
    configStatus: {
      hasJiraUrl: !!process.env.JIRA_URL,
      hasJiraEmail: !!process.env.JIRA_EMAIL,
      hasJiraToken: !!(process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN),
      hasGroqKey: !!process.env.GROQ_KEY
    }
  });
});

/**
 * POST /api/generate — Generate test plan from Jira issue
 * 
 * Request body:
 * {
 *   "jiraId": "VWO-48",
 *   "config": {
 *     "jiraUrl": "...",
 *     "jiraEmail": "...",
 *     "jiraToken": "...",
 *     "groqKey": "..."
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "testPlan": { ... },
 *   "markdown": "# Test Plan...",
 *   "filename": "test-plan-VWO-48.md"
 * }
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { jiraId, mode = 'testPlan', config: userConfig } = req.body;

    if (!jiraId) {
      return res.status(400).json({ success: false, error: 'Missing jiraId in request' });
    }

    const validModes = ['testPlan', 'testStrategy'];
    const outputMode = validModes.includes(mode) ? mode : 'testPlan';

    // Merge provided config with environment variables
    const config = {
      jiraUrl:   (userConfig && userConfig.jiraUrl)   || process.env.JIRA_URL,
      jiraEmail: (userConfig && userConfig.jiraEmail) || process.env.JIRA_EMAIL,
      jiraToken: (userConfig && userConfig.jiraToken) || process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN,
      groqKey:   (userConfig && userConfig.groqKey)   || process.env.GROQ_KEY,
    };

    console.log(`[Generate] Mode: ${outputMode} | Jira: ${jiraId} | URL: ${config.jiraUrl}`);

    if (!config.jiraUrl || !config.jiraEmail || !config.jiraToken) {
      return res.status(400).json({ success: false, error: 'Missing Jira credentials (jiraUrl, jiraEmail, jiraToken)' });
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

    res.json({ success: true, testPlan, markdown, filename });

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ success: false, error: error.message || 'Generation failed' });
  }
});

/**
 * POST /api/save — Save test plan to file (local only)
 * Disabled on Vercel (serverless has no persistent fs)
 */
app.post('/api/save', (req, res) => {
  if (process.env.VERCEL) {
    return res.status(501).json({
      success: false,
      error: 'Save not available on serverless. Use browser Download instead.'
    });
  }
  
  try {
    const { markdown, filename } = req.body;
    
    if (!markdown || !filename) {
      return res.status(400).json({
        success: false,
        error: 'Missing markdown or filename'
      });
    }
    
    const outputDir = path.join(__dirname, 'output');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, markdown, 'utf-8');
    
    res.json({
      success: true,
      message: `Saved to ${filepath}`,
      path: filepath
    });
    
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Save failed'
    });
  }
});

// --- SPA Fallback ---
// For React SPA routing, serve index.html for any unmatched routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Testing Buddy server running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/`);
  console.log(`💻 Frontend: http://localhost:${PORT}/\n`);
});
