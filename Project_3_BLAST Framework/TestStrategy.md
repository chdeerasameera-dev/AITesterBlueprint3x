# Test Strategy — Test Plan Buddy (SCRUM)

**Project:** Test Plan Buddy — Jira to Test Plan Generator  
**Build Date:** 2026-06-06  
**Framework:** B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger)  
**Version:** 1.0.0  

---

## 1. Executive Summary

**Test Plan Buddy** is a React + Express web application that automates the generation of formal QA Test Plans from Jira issues using AI (GROQ LLM). This document outlines the comprehensive test strategy to verify all components work correctly in isolation and end-to-end.

**Scope:** All 3 layers of the A.N.T. architecture (SOPs, Navigation, Tools) + React frontend  
**Success Criteria:** Automated test plan generation from Jira issue to downloadable Markdown  

---

## 2. Test Objectives

1. ✅ Verify Layer 1 (Architecture SOPs) — Technical documentation is accurate
2. ✅ Verify Layer 2 (Navigation) — Express proxy routes requests correctly
3. ✅ Verify Layer 3 (Tools) — Atomic scripts execute deterministically
4. ✅ Verify Frontend — React UI accepts input and displays results
5. ✅ Verify End-to-End — Full pipeline: Jira → GROQ → Markdown → Download
6. ✅ Verify Security — Credentials stored locally, never logged

---

## 3. Test Scope

### In Scope
- ✅ Jira API integration (fetch issue, normalize data)
- ✅ GROQ API integration (generate test plan JSON)
- ✅ Test plan rendering (JSON to Markdown)
- ✅ React UI functionality (form submission, display, download)
- ✅ Express proxy endpoints (`/api/generate`, `/api/health`)
- ✅ Error handling and recovery
- ✅ Credential configuration and storage
- ✅ Local file operations (output directory)
- ✅ Browser file download

### Out of Scope
- ❌ Vercel deployment testing (covered in separate deployment checklist)
- ❌ Performance load testing (not required for MVP)
- ❌ Cross-browser compatibility (scope to Chrome/Firefox/Safari basic)
- ❌ Mobile responsiveness (covered by CSS, not automated testing)

---

## 4. Test Environments

| Environment | Purpose | Credentials | Status |
|-------------|---------|-------------|--------|
| **Local Dev** | Development & unit testing | From `.env` file | Ready |
| **Production** | Final release candidate | Vercel env vars | Pending deployment |

---

## 5. Test Inclusions

### 5.1 Functional Testing
- Jira issue fetching with valid/invalid issue IDs
- GROQ API response parsing and validation
- Test plan JSON schema compliance
- Markdown rendering accuracy
- React form submission and state management
- File download functionality

### 5.2 Error Handling Testing
- Invalid Jira credentials (401 Unauthorized)
- Invalid GROQ API key (401 Unauthorized)
- Non-existent Jira issue (404 Not Found)
- Network timeouts
- Malformed API responses
- Missing required fields

### 5.3 Security Testing
- Credentials never logged to console
- API tokens not sent to third-party services
- Local storage of Jira URL and email (token not stored)
- GROQ key only sent via HTTPS
- No secrets in error messages

### 5.4 Integration Testing
- Jira Client → GROQ Client pipeline
- GROQ Client → TestPlan Renderer pipeline
- Express proxy → React frontend communication
- localStorage → Form auto-fill functionality

---

## 6. Test Environments & Setup

### Prerequisites
```bash
# Node.js 18+ installed
node --version

# npm installed
npm --version

# .env file configured
cat .env  # Should have JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN, GROQ_KEY
```

### Test Data
| Jira Issue | Description | Status |
|-----------|-------------|--------|
| `SCRUM-1` | User story (primary test) | Active |
| `SCRUM-2` | Bug (error scenario) | Optional |
| `INVALID-0` | Non-existent issue | For error testing |

---

## 7. Test Cases

### **Layer 3: Tool Testing (Unit Tests)**

#### TC-001: jiraClient.js — Fetch Valid Issue
- **Objective:** Verify Jira issue fetching works
- **Steps:**
  1. Call `jiraClient.fetch(config, 'SCRUM-1')`
  2. Verify response has key, summary, description, issueType
  3. Verify no secrets in response
- **Expected Result:** Issue normalized to schema, no errors
- **Pass Criteria:** JSON schema matches, all required fields present

#### TC-002: jiraClient.js — Fetch Invalid Issue
- **Objective:** Verify error handling for non-existent issue
- **Steps:**
  1. Call `jiraClient.fetch(config, 'INVALID-0')`
  2. Verify error thrown
  3. Check error message
- **Expected Result:** Error: "Not Found" (404)
- **Pass Criteria:** Error caught, no crash

#### TC-003: jiraClient.js — Invalid Credentials
- **Objective:** Verify authentication failure handling
- **Steps:**
  1. Call with JIRA_TOKEN = "invalid_token"
  2. Verify error thrown
- **Expected Result:** Error: "Unauthorized" (401)
- **Pass Criteria:** Error caught, no crash

#### TC-004: groqClient.js — Generate Valid Test Plan
- **Objective:** Verify GROQ generates valid JSON
- **Steps:**
  1. Prepare normalized Jira issue
  2. Call `groqClient.generate(config, issue)`
  3. Parse response JSON
  4. Validate schema
- **Expected Result:** Valid test plan JSON returned
- **Pass Criteria:** JSON parseable, all required fields present

#### TC-005: groqClient.js — Invalid GROQ Key
- **Objective:** Verify GROQ auth error handling
- **Steps:**
  1. Call with GROQ_KEY = "invalid_key"
  2. Verify error thrown
- **Expected Result:** Error: "Unauthorized" (401)
- **Pass Criteria:** Error caught, no crash

#### TC-006: testPlan.js — Render to Markdown
- **Objective:** Verify test plan JSON renders to valid Markdown
- **Steps:**
  1. Prepare test plan JSON
  2. Call `testPlan.toMarkdown(testPlanJson)`
  3. Verify Markdown structure
  4. Check all sections present
- **Expected Result:** Valid Markdown with headers, lists, tables
- **Pass Criteria:** Markdown renders without syntax errors

#### TC-007: testPlan.js — Handle Missing Fields
- **Objective:** Verify TBD placeholders for missing data
- **Steps:**
  1. Prepare test plan with null/undefined fields
  2. Call `testPlan.toMarkdown(testPlanJson)`
  3. Check output for "TBD"
- **Expected Result:** Missing fields show "TBD"
- **Pass Criteria:** No null/undefined in output

### **Layer 2: Navigation Testing (API Tests)**

#### TC-008: /api/health Endpoint
- **Objective:** Verify health check endpoint
- **Steps:**
  1. Call `GET /api/health`
  2. Verify response structure
- **Expected Result:** `{ status: "ok", timestamp: "...", service: "Test Plan Buddy" }`
- **Pass Criteria:** 200 status, valid JSON

#### TC-009: /api/generate — Valid Request
- **Objective:** Verify full end-to-end API call
- **Steps:**
  1. Call `POST /api/generate` with valid jiraId
  2. Verify response structure
  3. Check testPlan, markdown, filename
- **Expected Result:** Valid response with all fields
- **Pass Criteria:** 200 status, valid JSON, markdown file ready

#### TC-010: /api/generate — Missing jiraId
- **Objective:** Verify error handling for missing input
- **Steps:**
  1. Call `POST /api/generate` with empty jiraId
  2. Verify error response
- **Expected Result:** 400 status, error message
- **Pass Criteria:** Proper error response

#### TC-011: /api/generate — Missing Credentials
- **Objective:** Verify error handling for missing config
- **Steps:**
  1. Call with config missing jiraToken
  2. Verify error response
- **Expected Result:** 400 status with "Missing Jira credentials"
- **Pass Criteria:** Clear error message

### **Layer 1: Frontend Testing (Component Tests)**

#### TC-012: Generator Component — Form Submission
- **Objective:** Verify form accepts input and submits
- **Steps:**
  1. Render Generator component
  2. Enter "SCRUM-1" in input
  3. Click "Generate Plan" button
  4. Verify API call made
- **Expected Result:** Form submitted, API call triggered
- **Pass Criteria:** No validation errors, API called

#### TC-013: Settings Component — Credential Storage
- **Objective:** Verify credentials saved to localStorage
- **Steps:**
  1. Render Settings component
  2. Enter Jira URL, email, token, GROQ key
  3. Click "Save Settings"
  4. Verify localStorage updated
  5. Reload page, verify fields populated
- **Expected Result:** Credentials persisted and restored
- **Pass Criteria:** localStorage contains all 4 fields

#### TC-014: TestPlanView Component — Display Rendering
- **Objective:** Verify test plan displays correctly
- **Steps:**
  1. Pass test plan JSON to component
  2. Verify all sections render
  3. Click collapsible headers
  4. Verify expand/collapse works
- **Expected Result:** All sections visible, toggling works
- **Pass Criteria:** UI interactive, all content visible

#### TC-015: App Component — Navigation
- **Objective:** Verify tab switching works
- **Steps:**
  1. Load app
  2. Click "Generate" tab
  3. Click "Settings" tab
  4. Click "Generate" again
  5. Verify state preserved
- **Expected Result:** Tabs switch, view updates
- **Pass Criteria:** Correct component displayed

#### TC-016: Download Functionality
- **Objective:** Verify Markdown file download works
- **Steps:**
  1. Generate test plan
  2. Click "Download Markdown"
  3. Verify file downloaded
  4. Check file content
- **Expected Result:** .md file downloaded with correct content
- **Pass Criteria:** File name correct, content valid Markdown

### **End-to-End Testing (Integration Tests)**

#### TC-017: Complete Flow — Jira to Download
- **Objective:** Full end-to-end test of entire pipeline
- **Steps:**
  1. Start app: `npm run dev`
  2. Go to Settings, verify credentials saved
  3. Go to Generate, enter "SCRUM-1"
  4. Click "Generate Plan"
  5. Wait for plan to render
  6. Click "Download Markdown"
  7. Verify file downloaded and readable
- **Expected Result:** Test plan successfully generated and downloaded
- **Pass Criteria:** All steps complete without errors, Markdown valid

#### TC-018: Handshake Test — Full Verification
- **Objective:** Verify all systems ready for production
- **Steps:**
  1. Run: `npm run handshake`
  2. Verify all 5 steps pass:
     - ✅ Env vars present
     - ✅ Jira issue fetched
     - ✅ GROQ test passed
     - ✅ Test plan generated
     - ✅ Output file written
- **Expected Result:** All systems ready (no errors)
- **Pass Criteria:** Exit code 0, output files created

#### TC-019: Error Recovery — Invalid Credentials
- **Objective:** Verify graceful error handling and recovery
- **Steps:**
  1. Start with invalid JIRA_TOKEN in .env
  2. Run handshake
  3. Verify error logged (not crashed)
  4. Fix token
  5. Run handshake again
  6. Verify success
- **Expected Result:** Error handled, recoverable
- **Pass Criteria:** No crash, clear error message

---

## 8. Test Execution Plan

### Phase 1: Unit Testing (Tools Layer)
```bash
# Manual test each tool in isolation
node -e "
const jiraClient = require('./tools/jiraClient.js');
const config = {
  jiraUrl: process.env.JIRA_URL,
  jiraEmail: process.env.JIRA_EMAIL,
  jiraToken: process.env.JIRA_API_TOKEN,
  groqKey: process.env.GROQ_KEY
};
jiraClient.fetch(config, 'SCRUM-1')
  .then(issue => console.log('✅ TC-001 PASS:', issue.key))
  .catch(err => console.error('❌ TC-001 FAIL:', err.message));
"
```

### Phase 2: API Testing (Navigation Layer)
```bash
# Start server and test endpoints
npm run server &
sleep 2

# Test health endpoint
curl http://localhost:3000/api/health

# Test generate endpoint
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"jiraId":"SCRUM-1"}'
```

### Phase 3: Frontend Testing (Component Layer)
```bash
# Start dev server and test in browser
npm run dev
# Open http://localhost:5173
# Manually test UI: fill form, submit, verify display, download
```

### Phase 4: End-to-End Testing
```bash
# Run complete verification
npm run handshake
```

---

## 9. Defect Reporting

### Severity Levels
| Level | Definition | Example |
|-------|-----------|---------|
| **Critical** | App crashes, data lost | API returns 500 error |
| **High** | Core feature broken | Test plan not generated |
| **Medium** | Feature partially works | Download button sometimes fails |
| **Low** | Minor UI issue | Spacing incorrect |

### Defect Log Template
```
ID: DEF-001
Title: [Description]
Severity: [Critical/High/Medium/Low]
Steps to Reproduce: [Step-by-step]
Expected: [Expected behavior]
Actual: [What happened]
Environment: [Browser, OS, Node version]
Attachments: [Screenshots, logs]
Status: [Open/In Progress/Fixed/Closed]
```

---

## 10. Exit Criteria (Test Pass)

### ✅ Required Passing
- [ ] All 19 test cases pass
- [ ] No critical or high severity defects
- [ ] Handshake script completes without errors
- [ ] Test plan Markdown is valid and readable
- [ ] No credentials logged or exposed
- [ ] Download functionality works

### ⚠️ Conditional Pass
- [ ] Medium severity defects documented and accepted
- [ ] Low severity defects may be deferred to v1.1

### ❌ Test Failure
- [ ] Any critical defect identified
- [ ] Handshake script fails
- [ ] Credentials exposed in logs
- [ ] API returns 500+ errors

---

## 11. Entry Criteria (Before Testing)

- ✅ All source code committed
- ✅ `.env` file configured with valid credentials
- ✅ `npm install` completed successfully
- ✅ No build errors in console
- ✅ Project structure verified (`src/`, `tools/`, `architecture/`)

---

## 12. Test Deliverables

| Deliverable | Format | Location |
|-------------|--------|----------|
| Test Plan | This document | `TestStrategy.md` |
| Test Results | Log file | `.tmp/test-results.log` |
| Defect Report | JIRA issues | Link to SCRUM project |
| Code Coverage | JSON report | `coverage/` (if using Jest) |
| Performance Report | CSV | `.tmp/performance.csv` |

---

## 13. Test Tools & Technologies

| Tool | Purpose | Status |
|------|---------|--------|
| **Node.js** | Runtime for tools | ✅ Required |
| **npm** | Package manager | ✅ Required |
| **Postman** | API testing | ⏸️ Optional |
| **Jest** | Unit testing framework | ⏸️ Future (v1.1) |
| **Selenium** | Frontend automation | ⏸️ Future (v1.1) |
| **cURL** | HTTP testing | ✅ Quick testing |

---

## 14. Test Schedule

| Phase | Timeline | Owner | Status |
|-------|----------|-------|--------|
| **Preparation** | Day 1 | QA | ✅ Complete |
| **Unit Testing** | Day 2 | QA | ⏳ In Progress |
| **API Testing** | Day 2-3 | QA | 🔄 Pending |
| **UI Testing** | Day 3 | QA | 🔄 Pending |
| **E2E Testing** | Day 4 | QA | 🔄 Pending |
| **Regression** | Day 5 | QA | 🔄 Pending |
| **Sign-off** | Day 5 | Lead | 🔄 Pending |

---

## 15. Test Metrics & Success Indicators

### Quantitative Metrics
- **Test Pass Rate:** Target ≥ 95%
- **Defect Density:** Target < 2 defects per 1000 LOC
- **Code Coverage:** Target ≥ 80%
- **Response Time:** Avg < 2 seconds for test plan generation

### Qualitative Metrics
- ✅ User can generate test plan in < 1 minute
- ✅ Error messages are clear and actionable
- ✅ No crashes during normal operation
- ✅ Documentation is complete and accurate

---

## 16. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| GROQ API downtime | Cannot generate plans | Low | Use fallback template |
| Jira API rate limiting | Slow response | Medium | Implement caching |
| Invalid JSON from GROQ | Parse error | Medium | Validate schema |
| Browser storage quota exceeded | Settings lost | Low | Clear old data |
| Network connectivity | API call fails | Medium | Implement retry logic |

---

## 17. Test Roles & Responsibilities

| Role | Responsibility | Owner |
|------|---------------|-|
| **QA Engineer** | Execute tests, report defects | Assigned |
| **Developer** | Fix defects, update code | Dev Team |
| **Tech Lead** | Review test results, approve release | Tech Lead |
| **Product Manager** | Verify business requirements | PM |

---

## 18. Approval & Sign-Off

| Stakeholder | Role | Status | Signature |
|-------------|------|--------|-----------|
| QA Lead | Verify test execution | 🔄 Pending | _____ |
| Dev Lead | Confirm fixes applied | 🔄 Pending | _____ |
| Product Owner | Approve for release | 🔄 Pending | _____ |

---

## 19. Test Evidence & Documentation

### Evidence to Collect
- ✅ Handshake test output
- ✅ API response logs
- ✅ Browser console logs
- ✅ Downloaded Markdown files
- ✅ Screenshots of UI
- ✅ Error traces (if any)

### Documentation
- ✅ This Test Strategy (TestStrategy.md)
- ✅ Architecture SOPs (in `architecture/` folder)
- ✅ README.md with setup instructions
- ✅ Inline code comments

---

## 20. Appendix: Quick Test Commands

```bash
# Full end-to-end verification
npm run handshake

# Start development server
npm run dev

# Start production server
npm run server

# Build for production
npm run build

# View generated test plan
cat output/test-plan-SCRUM-1.md

# Check error logs
cat .tmp/handshake-error.log
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-06-06 | Initial test strategy | QA Team |
| 1.1 | TBD | Add Jest unit tests | Dev Team |
| 1.2 | TBD | Add E2E Selenium tests | QA Team |

---

**Status:** 📋 **READY FOR EXECUTION**

**Next Steps:**
1. Execute Phase 1 (Unit Testing) - TC-001 through TC-007
2. Execute Phase 2 (API Testing) - TC-008 through TC-011
3. Execute Phase 3 (Frontend Testing) - TC-012 through TC-016
4. Execute Phase 4 (E2E Testing) - TC-017, TC-018, TC-019
5. Collect evidence and sign-off

---

*Last Updated: 2026-06-06 | Framework: B.L.A.S.T. | Version: 1.0*
