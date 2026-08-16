# AI QA Engineer Agent — Development-Ready Master Prompt

## 1. Mission

Build a production-quality hackathon prototype called **AI QA Engineer Agent**.

The product must behave like an AI Quality Engineer, not a chatbot.

It must validate the quality of requirements before testing, design tests, validate the quality of generated automation code, execute tests, analyze failures, safely propose self-healing fixes, and produce traceable QA reports.

The core quality pipeline is:

Requirement Source
→ Requirement Normalization
→ Requirement Quality Gate
→ Test Design Quality Gate
→ Gherkin / Test Cases
→ Automation Generation
→ Automation Code Quality Gate
→ Test Execution
→ Failure Analysis
→ Safe Self-Healing
→ Re-execution
→ QA Report

The system must support requirements from:
1. Manual text input
2. PDF/DOCX/TXT/Markdown documents
3. Jira
4. Azure DevOps

The architecture must keep source connectors, AI agents, execution engines, and quality rules modular.

---

## 2. Primary Product Goals

### Requirement Quality
Answer:

> Is this requirement ready for QA?

Detect:
- Ambiguity
- Missing information
- Incomplete acceptance criteria
- Missing inputs
- Missing expected results
- Missing error handling
- Missing boundary conditions
- Missing authorization behavior
- Missing dependencies
- Contradictions
- Untestable statements
- Non-measurable wording
- Requirement-to-document/Jira/Azure mismatches

Produce a quality score with evidence and clarification questions.

### Test Quality
Answer:

> Do the generated tests adequately cover the requirement?

Detect:
- Missing positive scenarios
- Missing negative scenarios
- Missing boundary scenarios
- Missing validation scenarios
- Duplicate scenarios
- Tests with no traceability
- Tests that do not validate the expected outcome
- Requirement coverage gaps

### Automation Quality
Answer:

> Is the generated automation reliable, secure, maintainable, and aligned with the requirement?

Detect:
- Hard waits
- Weak locators
- Generic selectors
- Missing assertions
- Hardcoded credentials
- Hardcoded URLs
- Duplicate code
- Poor naming
- Unnecessary complexity
- Poor synchronization
- Missing test isolation
- Missing reusable fixtures/page objects where appropriate
- Sensitive information in source/logs
- Tests that do not verify business outcomes

Use both deterministic static checks and AI review. Never rely only on an LLM.

### Execution Quality
Answer:

> Did the application behave as expected?

Classify failures as:
- APPLICATION_DEFECT
- AUTOMATION_DEFECT
- ENVIRONMENT_FAILURE
- TEST_DATA_FAILURE
- UNKNOWN

Provide evidence and confidence.

---

## 3. Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- WebSocket or Server-Sent Events

### Backend
- Python
- FastAPI
- Pydantic
- AsyncIO

### AI
Create an LLM provider abstraction supporting:
- OpenAI
- Ollama
- OpenAI-compatible endpoints

Environment variables:
AI_PROVIDER=
AI_MODEL=
AI_BASE_URL=
AI_API_KEY=

Never hardcode secrets.

### Browser
- Playwright
- TypeScript

### API
- Bruno CLI

### Database
- PostgreSQL
- SQLAlchemy or equivalent
- Alembic migrations

### Infrastructure
- Docker
- Docker Compose

### Quality tooling
- ESLint
- TypeScript compiler
- Playwright
- Optional Semgrep/security rules
- Custom QA quality rules engine

---

## 4. Agent Architecture

Implement these agents:

1. Requirement Normalizer
2. Requirement Quality Agent
3. Test Design Agent
4. Test Quality Agent
5. Exploration Agent
6. Automation Agent
7. Automation Quality Agent
8. Execution Agent
9. Failure Analysis Agent
10. Self-Healing Agent
11. Reporting Agent

Agents must have explicit inputs, outputs, tools, and responsibilities.

Do not expose hidden chain-of-thought. Store only concise actions, decisions, evidence, confidence, and results.

---

## 5. Requirement Sources

Create a common normalized requirement model.

Example:

{
  "source": "jira",
  "source_id": "PROJ-123",
  "title": "Password Reset",
  "description": "...",
  "acceptance_criteria": [],
  "attachments": [],
  "comments": [],
  "metadata": {}
}

Supported source types:
- manual
- document
- jira
- azure_devops

### Document ingestion

Support:
- PDF
- DOCX
- TXT
- Markdown

Pipeline:
Document → parser → text extraction → requirement identification → normalized requirement.

Do not blindly send entire documents to the LLM.

### Jira

Support fetching:
- Summary
- Description
- Acceptance Criteria
- Comments
- Labels
- Priority
- Attachments
- Linked issues

### Azure DevOps

Support fetching:
- Work item title
- Description
- Acceptance Criteria where present
- Tags
- Priority
- Area
- Iteration
- Attachments
- Links
- Comments

Keep connector implementations isolated.

---

## 6. Requirement Quality Gate

Create a deterministic + AI hybrid quality engine.

Dimensions:

- Clarity
- Completeness
- Testability
- Consistency
- Business rules
- Inputs
- Expected result
- Error handling
- Boundary conditions
- Authorization
- Dependencies
- Ambiguity
- Acceptance criteria quality
- Coverage potential

Score:

90–100 = READY
75–89 = REVIEW_RECOMMENDED
50–74 = NEEDS_CLARIFICATION
0–49 = NOT_READY

Do not rely only on score.

Critical issues must be able to block progression even when the numerical score is high.

Example:
Score 91 + missing expected behavior = NOT_READY.

Output:

{
  "score": 78,
  "status": "NEEDS_CLARIFICATION",
  "dimensions": {},
  "issues": [],
  "clarification_questions": [],
  "evidence": [],
  "critical_issues": []
}

Never invent facts.

Example:
Requirement: "Search companies quickly."
AI must flag "quickly" as non-measurable.

---

## 7. Requirement Comparison

Allow comparison between:
- Jira vs BRD
- Azure DevOps vs BRD
- Jira vs Azure DevOps
- Any two normalized requirement sources

Detect:
- Missing functionality
- Conflicting behavior
- Different acceptance criteria
- Missing business rules
- Different actors
- Different constraints

Show:
- Source A
- Source B
- Difference
- Risk
- Recommendation

---

## 8. Test Design

Generate:
- Positive
- Negative
- Validation
- Boundary
- Authorization
- Integration
- Error handling

Do not invent features.

Every test must trace to:
Requirement → Acceptance Criteria → Test Case

Test model:

{
  "id": "TC-001",
  "title": "",
  "type": "positive",
  "priority": "high",
  "preconditions": [],
  "steps": [],
  "expected_result": "",
  "source_requirement": "",
  "source_ac": ""
}

---

## 9. Gherkin

Generate concise Gherkin.

Rules:
- Maximum 10 scenarios by default
- Mix positive, negative, validation, and boundary scenarios
- Descriptive scenario titles
- One concise sentence per Given/When/Then
- No hallucinated behavior
- Preserve traceability

---

## 10. Test Quality Gate

Before automation generation, evaluate generated test cases.

Check:
- Requirement coverage
- Acceptance criteria coverage
- Positive coverage
- Negative coverage
- Boundary coverage
- Validation coverage
- Duplicate scenarios
- Missing expected results
- Weak assertions
- Untraceable tests
- Irrelevant tests
- Overlapping tests

Output:

{
  "score": 88,
  "status": "PASS",
  "coverage": {},
  "duplicates": [],
  "gaps": [],
  "recommendations": []
}

Provide a coverage matrix:

Requirement → AC → Test Case → Automation → Execution.

---

## 11. Exploration Agent

Use Playwright.

Inputs:
- Target URL
- Credentials if required
- Requirement
- Test objective

Actions:
- Open application
- Inspect page
- Identify controls
- Navigate relevant workflows
- Perform safe exploratory actions
- Capture screenshots
- Capture DOM evidence
- Capture console errors
- Capture network failures
- Capture response status

Never perform destructive actions unless explicitly enabled.

---

## 12. Automation Generation

### Playwright

Generate TypeScript.

Prefer:
1. getByRole
2. getByLabel
3. getByTestId
4. stable CSS
5. XPath only when necessary

Use:
- Page Object Model where appropriate
- Fixtures
- Environment configuration
- External test data
- Explicit assertions
- Reusable utilities

Avoid:
- page.waitForTimeout()
- hardcoded credentials
- hardcoded environment URLs
- generic selectors
- unnecessary XPath

### Bruno

Generate executable Bruno requests and test scripts where API testing applies.

Keep execution engine interfaces pluggable.

---

## 13. Automation Code Quality Gate

Every generated automation script must pass:

### Layer 1 — Static Analysis
- TypeScript compiler
- ESLint
- Security scanning where configured

### Layer 2 — Framework Rules
Rules include:
- NO_PAGE_WAIT_FOR_TIMEOUT
- NO_HARDCODED_PASSWORD
- NO_HARDCODED_API_KEY
- NO_HARDCODED_ENVIRONMENT_URL
- PREFER_ROLE_LOCATOR
- PREFER_LABEL_LOCATOR
- AVOID_GENERIC_LOCATOR
- REQUIRE_ASSERTION
- AVOID_DUPLICATE_LOGIN
- REQUIRE_TEST_ISOLATION
- AVOID_UNNECESSARY_SLEEP
- REQUIRE_EXPECTED_OUTCOME

### Layer 3 — AI Review
AI evaluates:
- Requirement alignment
- Business assertion quality
- Maintainability
- Readability
- Locator quality
- Test isolation
- Reusability
- Risk

Output:

{
  "score": 91,
  "status": "PASS",
  "static_findings": [],
  "framework_findings": [],
  "ai_findings": [],
  "recommendations": []
}

The LLM must not override deterministic critical findings.

---

## 14. Automation Refactoring

If automation quality fails:

1. Generate a proposed patch.
2. Explain why.
3. Show before/after.
4. Run static checks.
5. Run the test.
6. Show result.
7. Require human approval before source-code modification/commit.

Example:

Bad:
await page.waitForTimeout(5000);

Proposed:
await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

Never silently modify source code.

---

## 15. Execution Agent

Playwright:
npx playwright test

Bruno:
bru run <collection>

Capture:
- Test ID
- Framework
- Status
- Duration
- Error
- Screenshot
- Trace
- Video where enabled
- Console errors
- Network errors
- API response

Normalize results.

---

## 16. Failure Analysis

Analyze:
- Test code
- Error
- Screenshot
- DOM
- Trace
- Console
- Network
- API response
- Execution history

Return:
- Classification
- Confidence
- Root cause
- Evidence
- Recommendation

Never claim certainty without evidence.

---

## 17. Self-Healing

Only support safe automation repairs such as:
- Changed locator
- Minor selector change
- Stable alternative locator discovery

Do not self-heal:
- Business behavior changes
- Expected result changes
- Authentication failures
- Environment outages
- Test-data failures
- Low-confidence situations

Flow:
Failure → Analyze → Proposed Patch → Validate → Re-run → Human Approval → Optional Apply

---

## 18. Defect Generation

Generate:
- Title
- Severity
- Priority
- Environment
- Steps
- Expected result
- Actual result
- Evidence
- Root cause
- Related requirement
- Related test

Initially generate a defect payload. Keep Jira/Azure ticket creation as an extension point.

---

## 19. UI Pages

Build:

1. Dashboard
2. Requirements
3. Requirement Analysis
4. Acceptance Criteria
5. Test Cases
6. AI Exploration
7. Automation
8. Execution
9. Failure Analysis
10. Self-Healing
11. Defects
12. Reports
13. Traceability
14. Settings
15. Agent Control Center

Primary hackathon flow:
Dashboard → Requirement → Quality Gate → Test Design → Automation Quality → Execution → Failure Analysis → Healing → Report.

---

## 20. Dashboard

Show:
- Total tests
- Passed
- Failed
- Healed
- Defects
- Requirement Quality
- Test Quality
- Automation Quality
- Overall Risk
- Recent Agent Activity

Provide a prominent:
**Run AI QA Demo**

---

## 21. Agent Activity

Show concise events only:

Requirement received
Requirement analyzed
Quality gate completed
Tests generated
Test quality checked
Exploration started
Automation generated
Automation quality checked
Execution started
Failure detected
Failure classified
Healing proposal generated
Validation completed
Report generated

Never show hidden reasoning.

---

## 22. Traceability

Implement:

Requirement
→ Acceptance Criteria
→ Test Case
→ Automation
→ Execution
→ Failure
→ Defect

Allow navigation between linked artifacts.

---

## 23. Demo Application

Build an internal demo application containing:
- Login
- Dashboard
- Customer Search
- Customer Details
- Password Reset

Intentionally introduce:
1. Locator-related automation failure.
2. Application/API defect.

The demo must run locally and not depend on production systems.

---

## 24. Security

Mandatory:
- Environment-based secrets
- Secret masking
- No credentials in generated source
- No credentials in logs
- No unrestricted shell access
- Destructive action approval
- Human approval before code modification
- Tool allowlist
- Input validation
- Output validation

---

## 25. Database

Models:
- Project
- Requirement
- RequirementSource
- RequirementAnalysis
- AcceptanceCriteria
- TestScenario
- TestQualityEvaluation
- AutomationScript
- AutomationQualityEvaluation
- TestExecution
- TestResult
- FailureAnalysis
- HealingProposal
- Defect
- AgentExecution
- Artifact

Use UUIDs and timestamps.

---

## 26. APIs

Implement at minimum:

POST /api/projects
POST /api/requirements/import
POST /api/requirements/analyze
POST /api/requirements/compare
POST /api/gherkin/generate
POST /api/tests/generate
POST /api/tests/evaluate
POST /api/exploration/start
POST /api/automation/generate
POST /api/automation/evaluate
POST /api/automation/refactor
POST /api/execution/start
GET /api/execution/{id}
POST /api/failure/analyze
POST /api/self-healing/propose
POST /api/self-healing/validate
POST /api/reports/generate
GET /api/traceability/{requirement_id}

---

## 27. Evaluation Framework

The AI QA Agent itself must be testable.

Create a golden dataset containing:
- Good requirements
- Ambiguous requirements
- Incomplete requirements
- Contradictory requirements
- Requirements with irrelevant information
- Good automation
- Bad automation
- Security-violating automation
- Weak locator examples
- Missing assertion examples

Measure:
- Requirement extraction accuracy
- Requirement issue detection precision/recall
- Hallucination rate
- Ambiguity detection
- Requirement quality score consistency
- Test coverage
- Duplicate detection
- Automation quality detection
- Security finding detection
- Failure classification accuracy
- Healing validation success rate

Do not use subjective "looks good" evaluation as the only metric.

---

## 28. Testing Strategy

### Unit
Test:
- Parsers
- Normalizers
- Quality rules
- Scoring
- Schemas
- Agent routing

### Integration
Test:
- LLM provider
- Jira connector
- Azure connector
- PostgreSQL
- Playwright
- Bruno

### E2E
Run:
Requirement → Quality Gate → Test Design → Automation → Quality Gate → Execute → Failure → Analyze → Heal → Re-execute → Report

### Security
Test:
- Secret leakage
- Prompt injection resistance
- Tool authorization
- Destructive action blocking
- Input validation

---

## 29. Project Structure

ai-qa-engineer/
├── frontend/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── connectors/
│   │   ├── quality/
│   │   ├── tools/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   ├── database/
│   │   └── config/
│   └── tests/
├── automation/
│   ├── playwright/
│   └── bruno/
├── demo-app/
├── test-data/
│   ├── requirements/
│   └── automation/
├── skills/
│   └── ai-qa-engineer/
│       └── SKILL.md
├── .cursor/
│   └── rules/
│       └── ai-qa-engineer.mdc
├── architecture.md
├── README.md
├── docker-compose.yml
├── .env.example
└── DEVELOPMENT_PROMPT.md

---

## 30. Development Order

Do not build everything at once.

Phase 1:
Repository, Docker, DB, frontend shell, backend shell, AI provider.

Phase 2:
Requirement ingestion + normalization.

Phase 3:
Requirement Quality Agent + quality rules.

Phase 4:
Test Design + Test Quality Agent.

Phase 5:
Playwright exploration.

Phase 6:
Automation generation + Automation Quality Engine.

Phase 7:
Execution.

Phase 8:
Failure Analysis.

Phase 9:
Self-Healing.

Phase 10:
Reports + Traceability.

Phase 11:
Jira/Azure integrations.

Phase 12:
Demo application + end-to-end demo.

---

## 31. Definition of Done

The project is complete when:

- Requirements can be imported from text/document/Jira/Azure.
- Requirements are normalized.
- Requirement quality is scored and explained.
- Critical requirement issues can block progression.
- Clarification questions are generated.
- Requirement sources can be compared.
- Gherkin is generated.
- Test cases are generated.
- Test quality is evaluated.
- Coverage gaps are identified.
- Playwright automation is generated.
- Bruno automation is generated where applicable.
- Automation code is statically checked.
- Framework-specific quality rules run.
- AI reviews automation quality.
- Low-quality automation receives a proposed refactor.
- Tests execute.
- Failures are classified.
- Evidence is displayed.
- Safe locator healing works.
- Re-execution works.
- Defect reports are generated.
- Requirement-to-execution traceability works.
- HTML report is generated.
- Demo works locally.
- Docker Compose starts the system.
- README provides complete setup.
- Unit/integration/E2E tests exist.
- Secrets are protected.

Start implementation with Phase 1 only. After completing Phase 1, verify the application builds and starts successfully before moving to Phase 2.
