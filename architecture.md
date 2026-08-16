# AI QA Engineer Agent — Architecture

## 1. Overview

AI QA Engineer is an agentic Quality Engineering platform.

It provides four quality gates:

1. Requirement Quality
2. Test Quality
3. Automation Quality
4. Execution Quality

## 2. Logical architecture

```text
Requirement Sources
  ├── Manual
  ├── PDF/DOCX/TXT/MD
  ├── Jira
  └── Azure DevOps
          |
          v
Requirement Normalizer
          |
          v
Requirement Quality Engine
  ├── Deterministic Rules
  └── AI Analysis
          |
          +----> Quality Score
          +----> Issues
          +----> Clarification Questions
          +----> Source Comparison
          |
          v
Test Design Agent
          |
          v
Test Quality Engine
  ├── Coverage Rules
  ├── Duplicate Detection
  └── AI Semantic Review
          |
          v
Automation Agent
  ├── Playwright
  └── Bruno
          |
          v
Automation Quality Engine
  ├── TypeScript/ESLint
  ├── Security Rules
  ├── Playwright Rules
  └── AI Code Review
          |
          v
Execution Agent
          |
          v
Failure Analysis Agent
          |
     +----+----+
     |         |
     v         v
Defect     Self-Healing
              |
              v
          Re-execution
              |
              v
         Reporting Agent
              |
              v
       Dashboard / Reports
```

## 3. Component responsibilities

### Frontend
Displays:
- requirements
- quality scores
- tests
- automation
- execution
- evidence
- defects
- traceability
- agent activity

### API layer
Provides authenticated application APIs and orchestrates long-running jobs.

### Agent Manager
Controls agent lifecycle and tool permissions.

### Quality Engine
Runs deterministic and AI quality evaluations.

### Tool Registry
Exposes allowlisted capabilities:
- browser
- API
- file parsing
- static analysis
- test execution
- reporting

### Connectors
Jira and Azure DevOps integrations implement a common requirement-source interface.

### Execution Engines
Playwright and Bruno implement a common execution result interface.

## 4. Data flow

```text
Source
  |
  v
Normalized Requirement
  |
  v
Requirement Analysis
  |
  v
Requirement Quality Evaluation
  |
  v
Test Cases
  |
  v
Test Quality Evaluation
  |
  v
Automation
  |
  v
Automation Quality Evaluation
  |
  v
Execution
  |
  v
Normalized Result
  |
  v
Failure Analysis
  |
  +--> Defect
  |
  +--> Healing Proposal
          |
          v
       Validation
          |
          v
       Re-execution
```

## 5. Security boundaries

```text
User
 |
 v
Frontend
 |
 v
FastAPI
 |
 v
Agent Manager
 |
 +---- Tool Allowlist ----+
 |                        |
 v                        v
Safe Tools             Restricted Tools
Browser                Shell
API                    Filesystem
Documents              Code modification
```

No agent gets unrestricted shell access.

Secrets are loaded server-side and masked before logs/reports.

## 6. Quality scoring

Do not use one opaque LLM score.

Each quality result contains:

```json
{
  "score": 91,
  "status": "PASS",
  "critical": [],
  "findings": [],
  "evidence": [],
  "recommendations": []
}
```

Scores are advisory; critical findings can override score.

## 7. Traceability model

```text
Requirement
    |
    +--> Acceptance Criteria
            |
            +--> Test Case
                    |
                    +--> Automation
                            |
                            +--> Execution
                                    |
                                    +--> Failure
                                            |
                                            +--> Defect
                                            |
                                            +--> Healing Proposal
```

## 8. Persistence

PostgreSQL stores:
- projects
- requirements
- source metadata
- analysis results
- acceptance criteria
- tests
- quality evaluations
- automation
- executions
- failures
- healing proposals
- defects
- artifacts
- agent events

Artifacts such as screenshots and traces should be stored outside relational tables with metadata references.

## 9. Long-running execution

Use background jobs or an async task mechanism for:
- document ingestion
- requirement analysis
- browser exploration
- test generation
- test execution
- failure analysis
- report generation

Frontend receives progress via WebSocket or Server-Sent Events.

## 10. Failure handling

Every agent action should be idempotent where practical.

Failures should produce:
- execution ID
- agent
- action
- error
- retryability
- timestamp

Never silently swallow errors.

## 11. Extensibility

Future adapters should be possible for:
- GitHub
- GitLab
- Confluence
- TestRail
- Zephyr
- Jira Xray
- Azure Test Plans
- Selenium
- Cypress
- JMeter
- k6

Do not couple the core agents to a single vendor.
