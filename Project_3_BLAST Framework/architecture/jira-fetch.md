# Architecture SOP: Jira Fetch

**Purpose:** Securely fetch a Jira issue by ID and normalize the response.

---

## Goal

Retrieve a single Jira Cloud issue (e.g., `VWO-48`) via the REST API and return a deterministic, normalized JSON object safe for downstream processing.

---

## Inputs

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `jiraUrl` | string | Yes | `https://your-domain.atlassian.net` |
| `jiraEmail` | string | Yes | `you@example.com` |
| `jiraToken` | string | Yes | `ATATT...` (API token) |
| `jiraId` | string | Yes | `VWO-48` |

---

## Process

1. **Construct endpoint:** `{jiraUrl}/rest/api/3/issue/{jiraId}`
2. **Create Basic Auth header:** `Authorization: Basic {base64(email:token)}`
3. **Fetch issue JSON** from Jira Cloud API
4. **Normalize response** (flatten ADF descriptions, extract fields)
5. **Return normalized object** or error

---

## Output (Normalized Issue)

```json
{
  "key": "VWO-48",
  "summary": "Implement user authentication flow",
  "description": "Plain text description (ADF flattened)",
  "issueType": "Story",
  "status": "In Progress",
  "priority": "High",
  "components": ["Frontend", "Auth"],
  "labels": ["security", "critical"],
  "fixVersions": ["2.0.0"],
  "reporter": "john.doe@example.com",
  "assignee": "jane.smith@example.com",
  "created": "2026-05-01T10:00:00Z",
  "updated": "2026-06-06T14:30:00Z"
}
```

---

## Edge Cases & Error Handling

| Scenario | Action |
|----------|--------|
| Invalid credentials | Return `{ error: "Unauthorized" }` (401) |
| Issue not found | Return `{ error: "Not Found" }` (404) |
| Network timeout | Retry once, then return error |
| Missing field (e.g., assignee) | Emit `null` (not TBD) |
| ADF description | Flatten to plain text; omit markup |

---

## Tools & Dependencies

- **Node.js:** `node-fetch` or built-in `fetch` (Node 18+)
- **Encoding:** `btoa()` for Base64
- **JSON:** Native `JSON.parse()` / `JSON.stringify()`

---

## Testing Checklist

- [ ] Fetch real Jira issue (with valid credentials)
- [ ] Verify all fields are normalized
- [ ] Test with missing optional fields (assignee, components)
- [ ] Test error: invalid token
- [ ] Test error: issue not found
- [ ] Verify no secrets in logs

