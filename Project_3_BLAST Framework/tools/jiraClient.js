/**
 * jiraClient.js — Fetch and normalize Jira issues
 * Layer 3: Atomic tool for retrieving Jira data
 * 
 * Usage:
 *   import jiraClient from './jiraClient.js';
 *   const issue = await jiraClient.fetch(config, jiraId);
 */

import https from 'https';
import { URL } from 'url';

/**
 * Flatten ADF (Atlassian Document Format) to plain text
 * Simple implementation: extract all text nodes
 */
function flattenAdf(adfJson) {
  if (!adfJson || !adfJson.content) return '';
  
  let text = '';
  const extractText = (node) => {
    if (node.type === 'text') {
      text += node.text || '';
    } else if (node.type === 'paragraph' || node.type === 'heading') {
      if (node.content) node.content.forEach(extractText);
      text += '\n';
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      if (node.content) node.content.forEach(extractText);
    } else if (node.type === 'listItem') {
      if (node.content) node.content.forEach(extractText);
      text += '\n';
    } else if (node.content) {
      node.content.forEach(extractText);
    }
  };
  
  adfJson.content.forEach(extractText);
  return text.trim();
}

/**
 * Make HTTPS request to Jira API
 */
function fetchFromJira(url, auth) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Authorization': auth,
        'Accept': 'application/json',
        'User-Agent': 'TestPlanBuddy/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } else {
          reject({
            status: res.statusCode,
            statusText: res.statusMessage,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Normalize Jira issue response to standardized schema
 */
function normalizeIssue(jiraResponse) {
  const fields = jiraResponse.fields || {};
  
  return {
    key: jiraResponse.key,
    summary: fields.summary || 'TBD',
    description: fields.description ? flattenAdf(fields.description) : 'TBD',
    issueType: fields.issuetype?.name || 'Task',
    status: fields.status?.name || 'TBD',
    priority: fields.priority?.name || 'Medium',
    components: (fields.components || []).map(c => c.name),
    labels: fields.labels || [],
    fixVersions: (fields.fixVersions || []).map(v => v.name),
    reporter: fields.reporter?.emailAddress || null,
    assignee: fields.assignee?.emailAddress || null,
    created: fields.created || new Date().toISOString(),
    updated: fields.updated || new Date().toISOString()
  };
}

/**
 * Main: Fetch and normalize a Jira issue
 */
async function fetch(config, jiraId) {
  if (!config.jiraUrl || !config.jiraEmail || !config.jiraToken) {
    throw new Error('Missing Jira configuration: jiraUrl, jiraEmail, jiraToken');
  }
  
  if (!jiraId) {
    throw new Error('Missing jiraId parameter');
  }
  
  // Create Basic Auth header
  const credentials = `${config.jiraEmail}:${config.jiraToken}`;
  const encodedAuth = Buffer.from(credentials).toString('base64');
  const authHeader = `Basic ${encodedAuth}`;
  
  // Construct endpoint
  const endpoint = `${config.jiraUrl}/rest/api/3/issue/${jiraId}`;
  
  try {
    const response = await fetchFromJira(endpoint, authHeader);
    const normalized = normalizeIssue(response.body);
    return normalized;
  } catch (error) {
    // error can be a plain object {status, statusText, body} or an Error instance
    if (error && error.status) {
      throw new Error(`Jira fetch failed (HTTP ${error.status} ${error.statusText || ''}): ${error.body}`);
    }
    throw new Error(`Jira fetch failed: ${error.message || JSON.stringify(error)}`);
  }
}

export default { fetch, normalizeIssue, flattenAdf };
