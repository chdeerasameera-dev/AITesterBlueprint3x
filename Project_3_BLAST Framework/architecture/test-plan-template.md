# Architecture SOP: Test Plan Template

**Purpose:** Transform GROQ JSON output into a professional, downloadable Markdown test plan.

---

## Goal

Render a structured test plan JSON into formatted Markdown that is:
- Professional and compliant with ISO/IEEE standards
- Readable on screen
- Downloadable as `.md` file
- Deterministic (no random elements)

---

## Inputs

| Field | Type | Required |
|-------|------|----------|
| `testPlan` | object | Yes |
| `format` | string | No | `markdown` (default), `json`, `html` |

Test Plan object structure (from groq-generate.md output).

---

## Process

1. **Validate test plan JSON** against schema
2. **Build Markdown sections** in order:
   - Header (title, ID, source issue)
   - Objective
   - Scope (in/out)
   - Inclusions
   - Test Environments
   - Defect Reporting
   - Test Strategy
   - Schedule
   - Deliverables
   - Entry/Exit Criteria
   - Tools
   - Risks & Mitigations
   - Approvals
3. **Format for readability:** use headers, lists, tables
4. **Return Markdown string** or write to file

---

## Output Template (Markdown)

```markdown
# Test Plan — VWO-48: Implement User Authentication Flow

**Test Plan ID:** TP-VWO-48  
**Source Issue:** VWO-48  
**Generated:** 2026-06-06T14:30:00Z  
**Status:** Draft

---

## Objective

Verify that the user authentication flow is secure, reliable, and meets functional requirements...

---

## Scope

### In Scope
- Login page
- Password reset
- 2FA

### Out of Scope
- OAuth
- SSO

---

## Inclusions

- Functional testing of all authentication endpoints
- Security testing (SQL injection, XSS)
- Performance testing under load

---

## Test Environments

- Staging
- Production (read-only tests only)

---

[... continue for each section ...]

---

## Approvals

| Role | Name | Date |
|------|------|------|
| QA Lead | TBD | TBD |

```

---

## File Output

- **Filename:** `output/test-plan-{jiraId}.md`
- **Example:** `output/test-plan-VWO-48.md`
- **Encoding:** UTF-8
- **Line endings:** LF (Unix)

---

## Edge Cases

| Scenario | Action |
|----------|--------|
| Missing section in JSON | Emit section with "TBD" |
| Empty arrays (e.g., risks) | Omit section or emit "None identified" |
| Null/undefined fields | Use "TBD" placeholder |
| HTML special chars in text | Escape for Markdown |

---

## Testing Checklist

- [ ] Generate test plan from GROQ output
- [ ] Verify Markdown is valid and renders correctly
- [ ] Test download functionality
- [ ] Verify filename is URL-safe
- [ ] Test with special characters in issue summary
- [ ] Verify file encoding is UTF-8

