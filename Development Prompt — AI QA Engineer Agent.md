# Build an AI QA Engineer Agent

## 1. Objective

Build a production-quality prototype called **AI QA Engineer Agent**.

The system must behave like an autonomous QA engineer rather than a simple chatbot.

Given a User Story or requirement, the agent must:

1. Analyze the requirement.
2. Identify functional, negative, boundary, validation, and integration scenarios.
3. Generate Gherkin Acceptance Criteria.
4. Generate detailed test cases.
5. Explore the target application through browser/API tools.
6. Generate executable Playwright UI tests and Bruno API tests where applicable.
7. Execute the generated tests.
8. Analyze failures.
9. Determine whether a failure is caused by:
   - Application defect
   - Automation/test defect
   - Environment/infrastructure issue
   - Test-data issue
10. Attempt safe automation self-healing when the failure is caused by a changed locator or similar non-functional automation issue.
11. Re-execute the corrected test.
12. Generate a final QA execution report.
13. Clearly show the complete AI decision trail.

The primary goal is to demonstrate an **AI-powered autonomous QA workflow** from requirement → testing → execution → failure analysis → reporting.

---

# 2. Important Design Principle

Do NOT build this as a simple:

User → LLM → Response

Build it as an agentic system:

User Story
→ Requirement Analysis Agent
→ Test Design Agent
→ Exploration Agent
→ Automation Agent
→ Execution Agent
→ Failure Analysis Agent
→ Self-Healing Agent
→ Reporting Agent

Each agent must have a clearly defined responsibility.

Use deterministic tools wherever possible and use the LLM for reasoning, classification, planning, and generation.

Do not allow the LLM to directly perform unrestricted system operations.

---

# 3. Recommended Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- WebSocket or Server-Sent Events for live execution updates

## Backend

- Python
- FastAPI
- Pydantic
- AsyncIO

## AI

Create an abstraction layer so the application can support:

- OpenAI
- Ollama
- Other OpenAI-compatible providers

The provider must be configurable through environment variables.

Example:

AI_PROVIDER=openai
AI_MODEL=<configured-model>
AI_BASE_URL=<optional>
AI_API_KEY=<configured-key>

Never hardcode API keys.

## Browser Automation

Use:

- Playwright

## API Automation

Use:

- Bruno CLI

The architecture must allow additional execution engines later.

## Database

Use:

- PostgreSQL

Store:

- Projects
- Requirements
- Test scenarios
- Generated test cases
- Generated automation
- Test executions
- Test results
- Failure analysis
- Agent execution history

## Containerization

Provide:

- Dockerfile
- docker-compose.yml

The complete application should be runnable locally with Docker Compose.

---

# 4. High-Level Architecture

Implement the following architecture:

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     FastAPI API     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Agent Manager    │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
 Requirement Agent      Test Design Agent     Exploration Agent
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                     Automation Agent
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
                Playwright             Bruno
                    │                     │
                    └──────────┬──────────┘
                               ▼
                       Execution Agent
                               │
                               ▼
                     Failure Analyzer
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
             Self-Healing              Defect Analysis
                  │                         │
                  └────────────┬────────────┘
                               ▼
                         Report Agent
                               │
                               ▼
                          QA Dashboard
```

---

# 5. Agent 1 — Requirement Analysis Agent

Input:

```text
User Story
Acceptance Criteria
Additional requirements
```

Output structured JSON.

Example:

```json
{
  "summary": "User can reset password using registered email",
  "actors": ["Registered User"],
  "business_rules": [
    "Email must be registered",
    "Reset link must be generated",
    "Invalid email must return an appropriate validation message"
  ],
  "dependencies": [
    "Authentication service",
    "Email service"
  ],
  "risks": [
    "Token expiration",
    "Invalid email",
    "Multiple reset requests"
  ],
  "ambiguities": []
}
```

Rules:

- Do not invent functionality.
- Do not assume undocumented business rules.
- Explicitly identify missing or ambiguous information.
- Separate facts from assumptions.
- Preserve traceability to the original requirement.

---

# 6. Agent 2 — Test Design Agent

Generate test scenarios based ONLY on the requirement and identified business rules.

Include:

- Positive scenarios
- Negative scenarios
- Boundary scenarios
- Validation scenarios
- Error handling
- Authorization where applicable
- Integration scenarios where applicable

Each scenario must contain:

```json
{
  "id": "TC-001",
  "title": "Registered user can reset password",
  "type": "positive",
  "priority": "high",
  "preconditions": [],
  "steps": [],
  "expected_result": "",
  "source_requirement": ""
}
```

Do not generate scenarios for functionality that does not exist in the requirement.

---

# 7. Gherkin Generation

Generate Gherkin Acceptance Criteria.

Example:

```gherkin
Feature: Password Reset

Scenario: Registered user resets password successfully
  Given the user has a registered email address
  When the user requests a password reset
  Then a password reset link should be generated
```

Rules:

- Maximum 10 scenarios per requirement by default.
- Mix positive, negative, and validation scenarios.
- Every scenario must have a descriptive title.
- Given/When/Then should be concise.
- Do not hallucinate features.

Allow the user to change the maximum number through configuration.

---

# 8. Agent 3 — Exploration Agent

The Exploration Agent must interact with a configured target application.

Inputs:

```text
Application URL
Credentials if required
User Story
Test objective
```

Use Playwright for browser interaction.

The agent should:

1. Open the application.
2. Inspect the page.
3. Identify available controls.
4. Identify forms.
5. Identify navigation.
6. Identify relevant workflows.
7. Execute safe exploratory actions.
8. Capture:
   - Screenshots
   - DOM information
   - URLs
   - Network failures
   - Console errors
   - Response codes
9. Compare observed behavior against requirements.

The exploration agent must NEVER perform destructive actions unless explicitly enabled by the user.

Examples of destructive actions:

- Delete
- Cancel production data
- Submit irreversible transaction
- Modify production configuration

---

# 9. Agent 4 — Automation Agent

Generate executable automation.

## UI

Generate Playwright TypeScript tests.

Use:

- Page Object Model where appropriate
- Stable locators
- Explicit assertions
- Reusable fixtures
- Environment configuration
- Test data separation

Example:

```typescript
test('registered user can reset password', async ({ page }) => {
  await page.goto('/forgot-password');

  await page.getByLabel('Email').fill(testUser.email);
  await page.getByRole('button', { name: 'Reset Password' }).click();

  await expect(
    page.getByText('Password reset link sent')
  ).toBeVisible();
});
```

Do not blindly use XPath.

Prefer:

1. getByRole
2. getByLabel
3. getByTestId
4. CSS
5. XPath only when necessary

## API

Generate Bruno request/test scripts where API testing is applicable.

Generated scripts must be executable using Bruno CLI.

---

# 10. MCP Architecture

Design the system so external capabilities can be exposed through MCP-style tools.

Create a tool abstraction such as:

```text
browser.open
browser.click
browser.fill
browser.inspect
browser.screenshot
browser.get_console_errors

api.request
api.inspect_response

test.generate
test.execute
test.get_result

filesystem.read
filesystem.write

report.generate
```

The agent should interact with tools through a controlled tool registry.

Never give the LLM unrestricted shell access.

---

# 11. Execution Agent

The Execution Agent must execute generated tests.

For Playwright:

```bash
npx playwright test
```

For Bruno:

```bash
bru run <collection>
```

Capture:

- Test name
- Status
- Duration
- Error
- Screenshot
- Trace
- Video where enabled
- Console errors
- API response
- HTTP status
- Execution environment

Normalize results into a common structure:

```json
{
  "test_id": "TC-001",
  "framework": "playwright",
  "status": "failed",
  "duration_ms": 2450,
  "error": "",
  "artifacts": []
}
```

---

# 12. Failure Analysis Agent

This is one of the most important features.

When a test fails, analyze:

```text
Test code
+
Test step
+
Error message
+
Screenshot
+
DOM
+
Playwright trace
+
Console errors
+
Network errors
+
API response
+
Execution history
```

Classify the failure as:

```text
APPLICATION_DEFECT
AUTOMATION_DEFECT
ENVIRONMENT_FAILURE
TEST_DATA_FAILURE
UNKNOWN
```

Return:

```json
{
  "classification": "AUTOMATION_DEFECT",
  "confidence": 0.94,
  "root_cause": "The button locator changed from #submit to data-testid=submit-order",
  "evidence": [
    "Expected locator was not found",
    "Equivalent button exists in current DOM"
  ],
  "recommended_action": "Update locator"
}
```

Never claim 100% confidence unless the evidence is deterministic.

---

# 13. Self-Healing Agent

Implement safe self-healing only for clearly identifiable automation problems.

Examples:

### Locator change

Old:

```typescript
page.locator('#submit')
```

Current DOM:

```html
<button data-testid="submit-order">
```

AI can propose:

```typescript
page.getByTestId('submit-order')
```

Then:

1. Create proposed patch.
2. Show patch in UI.
3. Validate the patch.
4. Re-run the test.
5. If successful, mark the test as healed.
6. Do not automatically commit changes without user approval.

### Do NOT self-heal when:

- Application behavior changed.
- Expected result changed.
- Business logic changed.
- Authentication failed.
- Environment is unavailable.
- Test data is invalid.
- The AI is uncertain.

---

# 14. Defect Analysis

When the Failure Analyzer determines that the application is probably defective, generate:

```json
{
  "title": "",
  "severity": "High",
  "priority": "High",
  "environment": "",
  "steps_to_reproduce": [],
  "actual_result": "",
  "expected_result": "",
  "evidence": [],
  "probable_root_cause": "",
  "related_test": ""
}
```

Provide a button:

**Create Defect**

For the prototype, initially generate the defect payload rather than automatically creating a Jira/Azure DevOps ticket.

Design the backend so Jira/Azure DevOps integration can be added later.

---

# 15. QA Dashboard

Create a professional dashboard.

Display:

```text
Total Scenarios
Generated Tests
Executed Tests
Passed
Failed
Blocked
Healed
Defects
Execution Duration
Risk Score
```

Example:

```text
┌───────────────────────────────────────────┐
│ AI QA Engineer                            │
├───────────────────────────────────────────┤
│ Tests     Passed     Failed     Healed    │
│  24        19          3          2        │
├───────────────────────────────────────────┤
│ Requirement Analysis                      │
│ ✓ Completed                               │
│                                           │
│ Test Generation                           │
│ ✓ 24 scenarios                            │
│                                           │
│ Exploration                               │
│ ✓ 18 pages/actions                       │
│                                           │
│ Execution                                 │
│ ✓ 19 Passed                               │
│ ✕ 3 Failed                                │
│                                           │
│ AI Failure Analysis                       │
│ ✓ 2 Automation defects                    │
│ ⚠ 1 Application defect                   │
└───────────────────────────────────────────┘
```

---

# 16. Agent Activity Timeline

The UI must show the agent's reasoning as a safe, concise activity log.

Example:

```text
12:01:01  Requirement received
12:01:03  Requirement analysis completed
12:01:05  8 test scenarios generated
12:01:08  Starting browser exploration
12:01:15  Login page identified
12:01:22  Password reset workflow identified
12:01:30  Playwright test generated
12:01:35  Test execution started
12:01:39  Test failed
12:01:41  Failure classified as automation defect
12:01:43  Locator alternative identified
12:01:45  Self-healing patch generated
12:01:50  Re-execution started
12:01:54  Test passed
```

Do NOT expose hidden chain-of-thought.

Show only concise actions, decisions, evidence, and results.

---

# 17. Requirement Traceability

Every generated test must trace back to the original requirement.

Example:

```text
US-101
 ↓
AC-003
 ↓
TC-007
 ↓
PW-007
 ↓
Execution-2026-001
 ↓
PASS
```

Allow the user to click through the chain.

This is important for enterprise QA usage.

---

# 18. AI Guardrails

Implement strict rules.

The AI must:

- Never invent requirements.
- Never invent application behavior.
- Clearly distinguish observed behavior from assumptions.
- Never expose API keys.
- Never expose passwords.
- Mask sensitive values in logs.
- Never execute destructive operations without permission.
- Never modify automation silently.
- Never automatically commit code.
- Never claim a defect without evidence.
- Provide confidence levels.
- Record the tools used for each action.

---

# 19. Secrets Management

Use environment variables.

Example:

```env
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=

TARGET_BASE_URL=

TEST_USERNAME=
TEST_PASSWORD=

DATABASE_URL=
```

Never store secrets in generated test code.

Mask secrets in UI and logs.

---

# 20. API Endpoints

Implement at least:

```text
POST /api/projects

POST /api/requirements/analyze

POST /api/tests/generate

POST /api/gherkin/generate

POST /api/exploration/start

POST /api/automation/generate

POST /api/execution/start

GET  /api/execution/{id}

GET  /api/execution/{id}/results

POST /api/failure/analyze

POST /api/self-healing/propose

POST /api/self-healing/validate

POST /api/reports/generate

GET  /api/projects/{id}/traceability
```

Use Pydantic models for request/response validation.

---

# 21. Database Models

Create tables/models for:

```text
Project
Requirement
AcceptanceCriteria
TestScenario
AutomationScript
TestExecution
TestResult
FailureAnalysis
HealingProposal
Defect
AgentExecution
Artifact
```

Use UUID identifiers.

Add created_at and updated_at fields.

---

# 22. Logging and Observability

Every agent action must generate structured logs.

Example:

```json
{
  "execution_id": "exec-123",
  "agent": "failure-analyzer",
  "action": "classify_failure",
  "status": "completed",
  "duration_ms": 850,
  "result": "AUTOMATION_DEFECT"
}
```

Use correlation IDs so the complete execution can be traced.

---

# 23. Demo Mode

Create a built-in demo application or mock target application.

This is mandatory.

The hackathon demo must NOT depend on an external production system.

Create a small application containing:

```text
Login
Dashboard
Customer Search
Customer Details
Password Reset
```

Intentionally introduce at least two defects.

Example:

1. Changed locator causing automation failure.
2. API returning an incorrect response for a specific condition.

The AI should detect these during the demo.

---

# 24. Demo Scenario

Create a button:

**Run AI QA Demo**

When clicked:

```text
1. Load predefined user story.

2. Analyze requirement.

3. Generate acceptance criteria.

4. Generate test scenarios.

5. Explore demo application.

6. Generate Playwright tests.

7. Execute tests.

8. Intentionally encounter failures.

9. Analyze failures.

10. Identify locator problem.

11. Generate healing proposal.

12. Validate healing.

13. Re-run test.

14. Identify actual application defect.

15. Generate defect report.

16. Generate final QA summary.
```

The entire process should be visible in the UI.

---

# 25. Final QA Report

Generate an HTML report containing:

```text
Executive Summary

Requirement

Acceptance Criteria

Test Scenarios

Automation Coverage

Execution Summary

Passed Tests

Failed Tests

Healed Tests

Defects

Root Cause Analysis

Evidence

Traceability

AI Recommendations
```

Example summary:

```text
AI QA Execution Summary

Requirement: Password Reset

Total Tests: 12

Passed: 9
Failed: 2
Healed: 1

Application Defects: 1
Automation Defects: 1

Automation Coverage: 100%

Overall Risk: MEDIUM
```

---

# 26. Project Structure

Use a clean monorepo:

```text
ai-qa-engineer/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── hooks/
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── requirement_agent.py
│   │   │   ├── test_design_agent.py
│   │   │   ├── exploration_agent.py
│   │   │   ├── automation_agent.py
│   │   │   ├── execution_agent.py
│   │   │   ├── failure_agent.py
│   │   │   ├── healing_agent.py
│   │   │   └── reporting_agent.py
│   │   │
│   │   ├── tools/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   ├── database/
│   │   └── config/
│   │
│   └── tests/
│
├── automation/
│   ├── playwright/
│   └── bruno/
│
├── demo-app/
│
├── reports/
│
├── docker-compose.yml
├── README.md
└── .env.example
```

---

# 27. Testing the AI QA Agent

The AI QA Agent itself must be tested.

Create automated tests for:

### Unit Tests

- Requirement parsing
- Test generation
- Failure classification
- Locator healing
- Report generation

### Integration Tests

- LLM provider
- PostgreSQL
- Playwright
- Bruno
- Agent orchestration

### End-to-End Test

Run:

```text
User Story
→ Generate Tests
→ Execute
→ Failure
→ Analyze
→ Heal
→ Re-execute
→ Report
```

The entire workflow must be automated.

---

# 28. Acceptance Criteria for the Project

The project is complete only when all of the following work:

- User can create a project.
- User can enter a User Story.
- AI analyzes the User Story.
- AI generates Gherkin.
- AI generates test scenarios.
- AI explores the demo application.
- AI generates Playwright automation.
- AI generates Bruno automation when applicable.
- Tests can be executed.
- Execution results are displayed.
- Failures are automatically analyzed.
- Failures are classified.
- Locator failures can produce a healing proposal.
- Healing proposal can be validated.
- Tests can be re-executed.
- Application defects generate defect reports.
- Complete requirement-to-test traceability is available.
- HTML QA report can be generated.
- Sensitive information is masked.
- AI actions are logged.
- Application runs through Docker Compose.
- README contains complete setup and execution instructions.

---

# 29. Development Approach

Do not attempt to implement the entire system in one step.

Build incrementally:

### Phase 1

Create:

- Project structure
- React UI
- FastAPI backend
- PostgreSQL
- Docker Compose
- AI provider abstraction

### Phase 2

Implement:

- Requirement Agent
- Gherkin generation
- Test Design Agent

### Phase 3

Implement:

- Playwright integration
- Exploration Agent
- Automation Agent

### Phase 4

Implement:

- Test execution
- Result collection
- Execution dashboard

### Phase 5

Implement:

- Failure Analysis Agent
- Root cause classification

### Phase 6

Implement:

- Self-Healing Agent
- Healing validation

### Phase 7

Implement:

- Defect generation
- Traceability
- HTML reporting

### Phase 8

Implement:

- Demo application
- Demo defects
- One-click AI QA Demo

### Phase 9

Add:

- Unit tests
- Integration tests
- E2E tests
- Security checks
- Documentation

---

# 30. Coding Standards

Follow these rules:

- TypeScript strict mode.
- Python type hints.
- Pydantic validation.
- Async FastAPI where appropriate.
- No hardcoded credentials.
- No hardcoded API URLs.
- No duplicated business logic.
- Modular services.
- Clear error handling.
- Structured logging.
- Meaningful variable names.
- Automated tests for critical functionality.
- Avoid unnecessary dependencies.
- Keep LLM provider-specific code isolated.
- Keep browser automation isolated from agent logic.
- Keep execution engines pluggable.

---

# 31. Most Important Requirement

The final application must demonstrate this concept:

> **The AI should not merely tell the QA engineer what to test. The AI should actually plan, explore, generate, execute, analyze, and improve the tests.**

The system should therefore be able to complete the following loop:

```text
PLAN
 ↓
ACT
 ↓
OBSERVE
 ↓
REASON
 ↓
EXECUTE
 ↓
ANALYZE
 ↓
HEAL / REPORT
 ↓
RETEST
```

Build the application so this loop is clearly visible during the hackathon demonstration.

Start by creating the complete repository structure, Docker configuration, database schema, backend skeleton, frontend skeleton, AI provider abstraction, and README.

Then implement the phases sequentially.

Do not skip error handling, testing, security, or documentation just to make the demo work.