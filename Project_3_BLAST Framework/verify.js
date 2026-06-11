#!/usr/bin/env node

/**
 * verify.js — Standalone verification script
 * Tests all API integrations without npm dependencies
 * Usage: node verify.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '.tmp');
const RESULTS = {
  tests: [],
  passed: 0,
  failed: 0,
  startTime: new Date(),
  endTime: null
};

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}`;
  console.log(logMessage);
}

function test(name, fn) {
  return new Promise(async (resolve) => {
    try {
      log(`Starting: ${name}`, 'TEST');
      await fn();
      RESULTS.passed++;
      RESULTS.tests.push({ name, status: 'PASS', error: null });
      log(`✅ PASS: ${name}`, 'SUCCESS');
      resolve(true);
    } catch (error) {
      RESULTS.failed++;
      RESULTS.tests.push({ name, status: 'FAIL', error: error.message });
      log(`❌ FAIL: ${name} — ${error.message}`, 'ERROR');
      resolve(false);
    }
  });
}

async function verifyEnvVars() {
  const required = ['JIRA_URL', 'JIRA_EMAIL', 'GROQ_KEY'];
  const tokenKey = process.env.JIRA_TOKEN ? 'JIRA_TOKEN' : 'JIRA_API_TOKEN';
  
  if (!process.env.JIRA_TOKEN && !process.env.JIRA_API_TOKEN) {
    throw new Error('Missing JIRA_TOKEN or JIRA_API_TOKEN');
  }
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

async function verifyJiraConnectivity() {
  const jiraUrl = process.env.JIRA_URL;
  const jiraEmail = process.env.JIRA_EMAIL;
  const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;
  
  const credentials = `${jiraEmail}:${jiraToken}`;
  const encodedAuth = Buffer.from(credentials).toString('base64');
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${jiraUrl}/rest/api/3/myself`);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      } else {
        reject(new Error(`Jira API returned ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Jira request timeout')));
    req.end();
  });
}

async function verifyGroqConnectivity() {
  const groqKey = process.env.GROQ_KEY;
  
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
      max_tokens: 100
    });
    
    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      } else {
        reject(new Error(`GROQ API returned ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('GROQ request timeout')));
    req.write(payload);
    req.end();
  });
}

async function verifyToolsExist() {
  const tools = [
    './tools/jiraClient.js',
    './tools/groqClient.js',
    './tools/testPlan.js'
  ];
  
  for (const tool of tools) {
    if (!fs.existsSync(tool)) {
      throw new Error(`Tool not found: ${tool}`);
    }
  }
}

async function verifySrcExists() {
  const src = [
    './src/App.jsx',
    './src/components/Generator.jsx',
    './src/components/Settings.jsx',
    './src/components/TestPlanView.jsx'
  ];
  
  for (const file of src) {
    if (!fs.existsSync(file)) {
      throw new Error(`Source file not found: ${file}`);
    }
  }
}

async function runAllTests() {
  console.log('\n🔌 TEST PLAN BUDDY — VERIFICATION SCRIPT');
  console.log('========================================\n');
  
  log('Starting verification suite', 'START');
  
  // Test 1: Environment variables
  await test('Check environment variables', verifyEnvVars);
  
  // Test 2: Jira connectivity
  await test('Verify Jira API connectivity', verifyJiraConnectivity);
  
  // Test 3: GROQ connectivity
  await test('Verify GROQ API connectivity', verifyGroqConnectivity);
  
  // Test 4: Tools exist
  await test('Verify all tools exist', verifyToolsExist);
  
  // Test 5: Source files exist
  await test('Verify source files exist', verifySrcExists);
  
  // Summary
  RESULTS.endTime = new Date();
  const duration = (RESULTS.endTime - RESULTS.startTime) / 1000;
  
  console.log('\n========================================');
  console.log(`📊 TEST SUMMARY\n`);
  console.log(`  Total Tests: ${RESULTS.passed + RESULTS.failed}`);
  console.log(`  ✅ Passed: ${RESULTS.passed}`);
  console.log(`  ❌ Failed: ${RESULTS.failed}`);
  console.log(`  ⏱️  Duration: ${duration.toFixed(2)}s\n`);
  
  if (RESULTS.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Application is ready.\n');
  } else {
    console.log('⚠️  Some tests failed. See details above.\n');
  }
  
  // Save results
  const resultsPath = path.join(LOG_DIR, 'verification-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(RESULTS, null, 2));
  log(`Results saved to: ${resultsPath}`, 'INFO');
  
  process.exit(RESULTS.failed > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  log(`Fatal error: ${err.message}`, 'FATAL');
  process.exit(1);
});
