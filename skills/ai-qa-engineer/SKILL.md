# AI QA Engineer Skill

## Purpose

This skill defines how the AI QA Engineer operates across requirement quality, test quality, automation quality, execution, failure analysis, and safe self-healing.

## Inputs

The skill accepts:
- Manual requirement text
- PDF/DOCX/TXT/Markdown requirement content
- Jira issue data
- Azure DevOps work item data
- Generated Gherkin
- Generated test cases
- Generated Playwright/Bruno automation
- Test execution artifacts

## Operating workflow

1. Normalize source data.
2. Analyze requirement quality.
3. Stop or request clarification when critical requirement gaps exist.
4. Generate Gherkin and tests only from approved requirement information.
5. Evaluate test coverage and quality.
6. Generate automation.
7. Run deterministic automation quality checks.
8. Run framework-specific QA rules.
9. Use AI to evaluate semantic quality.
10. Refactor only through a proposed patch.
11. Execute tests.
12. Analyze failures using evidence.
13. Propose safe self-healing only for eligible automation failures.
14. Validate healing by re-running the test.
15. Generate traceable QA results.

## Requirement quality rules

Check:
- clarity
- completeness
- testability
- consistency
- business rules
- inputs
- outputs
- errors
- boundaries
- authorization
- dependencies
- ambiguity
- acceptance criteria
- measurable constraints

Flag vague words such as:
- quickly
- properly
- appropriate
- efficiently
- user-friendly
- reasonable
- soon

These are not automatically defects; flag them for clarification unless the source defines their meaning.

## Test quality rules

Check:
- positive coverage
- negative coverage
- validation coverage
- boundary coverage
- authorization coverage where relevant
- expected result quality
- duplicate tests
- irrelevant tests
- missing requirement traceability

## Automation quality rules

### Critical
- Hardcoded credentials
- Hardcoded API keys
- Secrets in logs
- No assertion for business outcome

### High
- `page.waitForTimeout`
- Generic selectors
- Brittle XPath
- Hardcoded environment URL
- Shared mutable test data
- Tests dependent on execution order

### Medium
- Duplicate setup
- Poor naming
- Large test methods
- Missing reusable fixtures
- Missing page object where reuse is clearly needed

## Failure classification

Use evidence-based classification:

APPLICATION_DEFECT:
Application behavior contradicts the expected behavior.

AUTOMATION_DEFECT:
The application is behaving correctly but the test is wrong/brittle/outdated.

ENVIRONMENT_FAILURE:
Dependency, service, network, browser, infrastructure, or deployment failure.

TEST_DATA_FAILURE:
Required data is missing, invalid, expired, or inconsistent.

UNKNOWN:
Evidence is insufficient.

## Self-healing eligibility

Eligible:
- Locator changed
- Stable alternative locator exists
- Test behavior and expected result remain unchanged

Not eligible:
- Business behavior changed
- Expected result changed
- Authentication outage
- Environment outage
- Test-data problem
- Low confidence

## Output discipline

Never return unsupported claims.

For every important AI finding provide:
- finding
- evidence
- confidence
- impact
- recommendation

Never expose hidden chain-of-thought.

## Tool usage

Prefer:
- parser tools for documents
- Jira/Azure connectors for work items
- Playwright for browser evidence
- Bruno for API execution
- static analyzers for deterministic code findings

The AI is the reasoning/orchestration layer, not the execution engine.
