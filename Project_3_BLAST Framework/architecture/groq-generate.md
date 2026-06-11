# Architecture SOP: GROQ Generate

**Purpose:** Send normalized Jira issue to GROQ LLM and generate a structured Test Plan JSON.

---

## Goal

Use the free GROQ API (model `openai/gpt-oss-120b`) to generate a formal, deterministic QA Test Plan from a Jira issue.

---

## Inputs

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `groqKey` | string | Yes | `gsk_...` |
| `jiraIssue` | object | Yes | Normalized issue (from jira-fetch.md) |

---

## Process

1. **Prepare prompt:** Inject Jira issue data into a test plan template
2. **Call GROQ API:** `POST https://api.groq.com/openai/v1/chat/completions`
3. **Request JSON output:** Force structured response via prompt engineering
4. **Parse JSON response:** Validate against expected schema
5. **Return Test Plan object** or error

---

## Prompt Template

```
You are a senior QA architect. Generate a formal, professional Test Plan for the following Jira issue.

Issue: {issue.key}
Summary: {issue.summary}
Description: {issue.description}
Type: {issue.issueType}
Priority: {issue.priority}

Output a VALID JSON object (no markdown, no comments) with this structure:
{
  "testPlanId": "TP-{issue.key}",
  "sourceIssue": "{issue.key}",
  "title": "Test Plan — {issue.summary}",
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
    {"phase": "Planning", "owner": "QA Lead", "dates": "TBD"}
  ],
  "deliverables": ["Test cases", "Test report"],
  "entryCriteria": ["Requirements approved"],
  "exitCriteria": ["All tests pass"],
  "tools": ["Selenium", "JIRA", "TestRail"],
  "risks": [
    {"risk": "<risk description>", "mitigation": "<mitigation>"}
  ],
  "approvals": [
    {"role": "QA Lead", "name": "TBD"}
  ]
}

Rules:
- Use formal QA language
- Where data is unknown, use "TBD"
- Do not fabricate data
- Return ONLY valid JSON, no extra text
```

---

## Output (Test Plan JSON)

```json
{
  "testPlanId": "TP-VWO-48",
  "sourceIssue": "VWO-48",
  "title": "Test Plan — Implement user authentication flow",
  "objective": "Verify that the user authentication flow is secure, reliable, and meets functional requirements.",
  "scope": {
    "inScope": ["Login page", "Password reset", "2FA"],
    "outOfScope": ["OAuth", "SSO"]
  },
  ...
}
```

---

## GROQ API Request

```javascript
POST https://api.groq.com/openai/v1/chat/completions
Authorization: Bearer {groqKey}
Content-Type: application/json

{
  "model": "mixtral-8x7b-32768",
  "messages": [
    {
      "role": "user",
      "content": "<filled prompt template>"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}
```

---

## Edge Cases & Error Handling

| Scenario | Action |
|----------|--------|
| Invalid GROQ key | Return `{ error: "Unauthorized" }` (401) |
| Rate limit exceeded | Return `{ error: "Rate Limited" }` (429) |
| Invalid JSON in response | Parse error, retry once |
| Empty or null response | Return `{ error: "No content from GROQ" }` |
| Network timeout | Retry once, then return error |

---

## Testing Checklist

- [ ] Call GROQ with valid test credentials
- [ ] Verify JSON is valid and matches schema
- [ ] Test with different Jira issue types (Story, Bug, Task)
- [ ] Test error: invalid API key
- [ ] Test error: malformed request
- [ ] Verify no secrets in logs

