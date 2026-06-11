import https from 'https';
import { URL } from 'url';

const email = process.env.JIRA_EMAIL || 'your-email@example.com';
const token = process.env.JIRA_API_TOKEN || process.env.JIRA_TOKEN || 'your-jira-token-here';
const jiraUrl = 'https://deerasameerach.atlassian.net';
const jiraId = 'SCRUM-5';

const auth = Buffer.from(`${email}:${token}`).toString('base64');
const url = new URL(`${jiraUrl}/rest/api/3/issue/${jiraId}`);

console.log(`Testing Jira API for issue: ${jiraId}`);
console.log(`URL: ${url.href}`);
console.log(`Auth: Basic ${auth.substring(0, 20)}...`);

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
    'User-Agent': 'TestPlanBuddy'
  },
  timeout: 10000
};

https.request(url, options, (res) => {
  let data = '';
  
  console.log(`\n✅ Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📦 Response (${data.length} bytes):`);
    console.log(data.substring(0, 200) + '...');
    
    try {
      const json = JSON.parse(data);
      console.log(`\n✅ Valid JSON!`);
      console.log(`Issue Key: ${json.key}`);
      console.log(`Summary: ${json.fields?.summary}`);
      console.log(`Status: ${json.fields?.status?.name}`);
    } catch (e) {
      console.log(`\n❌ Invalid JSON: ${e.message}`);
    }
  });
  
}).on('error', (e) => {
  console.error(`\n❌ Request Error: ${e.message}`);
}).on('timeout', () => {
  console.error(`\n❌ Request Timeout`);
}).end();
