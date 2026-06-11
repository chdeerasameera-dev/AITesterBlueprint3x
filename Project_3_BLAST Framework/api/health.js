/**
 * api/health.js — Vercel Serverless Health Check
 * Testing Buddy
 */

export default (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Testing Buddy',
    configStatus: {
      hasJiraUrl:   !!process.env.JIRA_URL,
      hasJiraEmail: !!process.env.JIRA_EMAIL,
      hasJiraToken: !!(process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN),
      hasGroqKey:   !!process.env.GROQ_KEY,
    },
  });
};
