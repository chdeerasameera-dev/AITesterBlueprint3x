# Architecture SOP: Handshake (Verification)

**Purpose:** Test end-to-end connectivity and credentials before full deployment.

---

## Goal

Verify that:
1. Jira API credentials are valid
2. GROQ API credentials are valid
3. Both APIs are reachable and responding
4. A test Jira issue can be fetched
5. A test test plan can be generated

---

## Handshake Sequence

```
START
  ↓
[1] Test Jira Connectivity
  ├─ Fetch config from .env
  ├─ Construct Jira Auth header
  ├─ Call GET {JIRA_URL}/rest/api/3/myself
  └─ ✓ If 200 OK → Jira credentials valid
      ✗ If error → HALT, report error
  ↓
[2] Fetch Test Issue
  ├─ Use JIRA_ID (e.g., VWO-48) from .env or default
  ├─ Call jiraClient.fetch()
  └─ ✓ If normalized issue returned → GROQ ready
      ✗ If error → HALT, report error
  ↓
[3] Test GROQ Connectivity
  ├─ Fetch GROQ_KEY from .env
  ├─ Call POST https://api.groq.com/openai/v1/chat/completions
  ├─ Simple model test (no test plan yet)
  └─ ✓ If 200 OK → GROQ credentials valid
      ✗ If error → HALT, report error
  ↓
[4] Generate Test Plan (Full Flow)
  ├─ Call groqClient.generate(jiraIssue)
  └─ ✓ If valid JSON returned → Full flow works
      ✗ If error → HALT, report error
  ↓
[5] Save & Report
  ├─ Write test plan to .tmp/handshake-output.json
  ├─ Print summary to console
  └─ COMPLETE: All systems ready
END
```

---

## Environment Variables Required

```
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_TOKEN=ATATT...
JIRA_ID=VWO-48 (optional, defaults to a standard test issue)
GROQ_KEY=gsk_...
```

---

## Success Criteria

All 5 steps complete without error:
- ✅ Jira credentials valid
- ✅ Test issue fetched
- ✅ GROQ credentials valid
- ✅ GROQ generates plan
- ✅ Output file written

---

## Failure Handling

If any step fails:
1. Print descriptive error message to console
2. Write error log to `.tmp/handshake-error.log`
3. Exit with non-zero status code
4. Do NOT proceed to next step

---

## Output Files

- **Success:** `.tmp/handshake-output.json` (normalized test plan)
- **Error:** `.tmp/handshake-error.log` (stack trace)

---

## Running the Handshake

```bash
node tools/handshake.js
```

---

## Testing Checklist

- [ ] Run with valid credentials → should PASS
- [ ] Run with invalid JIRA_TOKEN → should FAIL at step 1
- [ ] Run with invalid GROQ_KEY → should FAIL at step 3
- [ ] Verify output file is created on success
- [ ] Verify error log is created on failure

