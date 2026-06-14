/**
 * groqService.js — Groq API integration for AI-powered job search insights.
 * Uses the Llama 3.1 model via Groq's OpenAI-compatible endpoint.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

/**
 * Calls the Groq API with a structured prompt and returns the AI response text.
 * @param {string} systemPrompt - The system role context
 * @param {string} userPrompt   - The specific user query with job data
 * @returns {Promise<string>}   - AI-generated insights text
 */
export const callGroq = async (systemPrompt, userPrompt) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY_MISSING');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response received.';
};

// ── Prompt builders (one per tile type) ──────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert career coach and job search strategist with 15+ years 
of experience helping QA engineers and tech professionals land their dream jobs. 
Provide concise, actionable insights in a professional yet encouraging tone.
Format your response with clear bullet points or short paragraphs. Keep it under 200 words.`;

/**
 * Builds a Groq prompt based on the tile type and filtered job data.
 * @param {string} tileType - The metric tile identifier
 * @param {Array}  jobs     - Filtered job records relevant to this tile
 * @param {Object} metrics  - Full metrics object
 */
export const buildPrompt = (tileType, jobs, metrics) => {
  const companies = jobs.map(j => `${j.companyName} (${j.status})`).join(', ');
  const companyDetails = jobs
    .map(j => `• ${j.companyName}: ${j.jobTitle} — Status: ${j.status}, Profile Matched: ${j.profileMatched ? 'Yes' : 'No'}, Follow-up: ${j.followUp ? 'Yes' : 'No'}`)
    .join('\n');

  const prompts = {
    jobsApplied: `I have applied to ${jobs.length} job(s) in the last 14 days:\n${companyDetails}\n\nPlease provide:
1. Tips to optimise my job application strategy
2. Recommendations for improving my application hit rate
3. Any patterns or concerns you notice in my applications`,

    profileMatched: `My profile matched ${jobs.length} job(s) out of ${metrics.jobsApplied} total applications:\n${companyDetails}\n\nPlease provide:
1. Insights on what may make my profile match more roles
2. Suggestions for improving profile-to-job alignment
3. Key skills or keywords I should highlight`,

    interviewed: `I attended interviews at ${jobs.length} company(ies):\n${companyDetails}\n\nInterview details:\n${jobs.map(j => `• ${j.companyName}: ${j.interviewDetails || 'No details recorded'}`).join('\n')}\n\nPlease provide:
1. Tips for performing better in upcoming interviews
2. Common patterns in the companies that interviewed me
3. Preparation strategies based on these experiences`,

    rejected: `I was rejected by ${jobs.length} company(ies):\n${companyDetails}\n\nPlease provide:
1. Common reasons for rejection and how to address them
2. Strategies to bounce back and stay motivated
3. Tips to improve my chances in future applications`,

    followup: `I have ${jobs.length} pending follow-up(s):\n${companyDetails}\n\nPlease provide:
1. The ideal timing and tone for follow-up messages
2. Template ideas for professional follow-up emails
3. When to move on if there's no response`,

    selected: `I was successfully selected by ${jobs.length} company(ies):\n${companyDetails}\n\nPlease provide:
1. Tips for negotiating the offer effectively
2. How to evaluate and compare these opportunities
3. Suggestions for making a great start in the new role`,

    feedback: `I received interview feedback/captured questions from ${jobs.length} session(s):\n${jobs.map(j => `• ${j.companyName}:\n  Questions: ${j.questionsAsked || 'None recorded'}`).join('\n\n')}\n\nPlease provide:
1. Analysis of these interview questions and what they reveal about job requirements
2. Specific preparation tips for each type of question
3. Recommended resources to sharpen these skills`,

    successRate: `My interview success rate is ${metrics.successRate}% (${metrics.successes} selected out of ${metrics.interviewsAttended} interviews attended).\n\nCompanies: ${companies}\n\nPlease provide:
1. Assessment of my interview performance
2. Specific strategies to improve my success rate
3. Focus areas for interview preparation`,
  };

  return prompts[tileType] || `Please provide career coaching insights based on these job records:\n${companyDetails}`;
};
