import https from 'https';

async function testJira() {
  return new Promise((resolve, reject) => {
    const email = process.env.JIRA_EMAIL || 'your-email@example.com';
    const token = process.env.JIRA_API_TOKEN || process.env.JIRA_TOKEN || 'your-jira-token-here';
    
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const options = {
      hostname: 'deerasameerach.atlassian.net',
      path: '/rest/api/3/issue/SCRUM-5',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };
    
    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Data length: ${data.length}`);
        console.log(`First 200 chars: ${data.substring(0, 200)}`);
        resolve(data);
      });
    }).on('error', reject).end();
  });
}

testJira().then(data => {
  try {
    const json = JSON.parse(data);
    console.log(`✅ SUCCESS! Got issue: ${json.key}`);
  } catch(e) {
    console.log(`❌ Failed to parse JSON: ${e.message}`);
  }
}).catch(err => {
  console.log(`❌ Error: ${err.message}`);
});
