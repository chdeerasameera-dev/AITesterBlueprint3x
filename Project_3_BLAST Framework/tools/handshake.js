/**
 * handshake.js — End-to-end connectivity verification
 * Layer 3: Verification tool
 * 
 * Usage:
 *   node tools/handshake.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jiraClient from './jiraClient.js';
import groqClient from './groqClient.js';
import testPlanRenderer from './testPlan.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpDir = path.join(__dirname, '..', '.tmp');
const outputDir = path.join(__dirname, '..', 'output');

// Ensure directories exist
[tmpDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function runHandshake() {
  console.log('🔌 Test Plan Buddy — Handshake Protocol');
  console.log('----------------------------------------\n');
  
  const config = {
    jiraUrl: process.env.JIRA_URL,
    jiraEmail: process.env.JIRA_EMAIL,
    jiraToken: process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN,
    groqKey: process.env.GROQ_KEY
  };
  
  const jiraId = process.env.JIRA_ID || 'SCRUM-1';
  
  try {
    // Step 1: Verify environment variables
    console.log('[1] Checking environment variables...');
    if (!config.jiraUrl) throw new Error('JIRA_URL not set');
    if (!config.jiraEmail) throw new Error('JIRA_EMAIL not set');
    if (!config.jiraToken) throw new Error('JIRA_TOKEN not set');
    if (!config.groqKey) throw new Error('GROQ_KEY not set');
    console.log('✅ All environment variables present\n');
    
    // Step 2: Fetch Jira issue
    console.log(`[2] Fetching Jira issue: ${jiraId}...`);
    const issue = await jiraClient.fetch(config, jiraId);
    console.log(`✅ Issue fetched: ${issue.summary}\n`);
    
    // Step 3: Generate test plan
    console.log('[3] Generating test plan via GROQ...');
    const testPlan = await groqClient.generate(config, issue);
    console.log('✅ Test plan generated\n');
    
    // Step 4: Render to Markdown
    console.log('[4] Rendering to Markdown...');
    const markdown = testPlanRenderer.toMarkdown(testPlan);
    console.log('✅ Markdown rendered\n');
    
    // Step 5: Save outputs
    console.log('[5] Saving outputs...');
    const filename = testPlanRenderer.getSafeFilename(jiraId);
    const outputPath = path.join(outputDir, filename);
    
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    fs.writeFileSync(
      path.join(tmpDir, 'handshake-output.json'),
      JSON.stringify(testPlan, null, 2),
      'utf-8'
    );
    console.log(`✅ Output saved to: ${outputPath}\n`);
    
    // Summary
    console.log('----------------------------------------');
    console.log('✅ HANDSHAKE COMPLETE — All systems ready!\n');
    console.log('Summary:');
    console.log(`  Jira Issue: ${issue.key} — ${issue.summary}`);
    console.log(`  Test Plan ID: ${testPlan.testPlanId}`);
    console.log(`  Output: ${outputPath}`);
    console.log('----------------------------------------\n');
    
  } catch (error) {
    console.error('❌ HANDSHAKE FAILED\n');
    console.error(`Error: ${error.message}\n`);
    
    fs.writeFileSync(
      path.join(tmpDir, 'handshake-error.log'),
      `${new Date().toISOString()}\n${error.stack}\n`,
      'utf-8'
    );
    
    process.exit(1);
  }
}

runHandshake();
