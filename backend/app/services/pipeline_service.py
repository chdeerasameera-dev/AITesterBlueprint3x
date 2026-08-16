import os
import json
import uuid
import asyncio
import random
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from app.models.schemas import (
    NormalizedRequirement, TestCase, AutomationScript, ExecutionResult,
    FailureAnalysisResult, HealingProposal, RequirementScore, QualityStatus, RequirementSource
)
from app.quality_rules.requirement_rules import RequirementQualityRulesEngine
from app.quality_rules.automation_rules import AutomationQualityRulesEngine
from app.core.llm_provider import LLMProvider

req_rules = RequirementQualityRulesEngine()
auto_rules = AutomationQualityRulesEngine()
llm = LLMProvider()


class AgentPipelineService:

    # ─── Normalize ────────────────────────────────────────────────────────────
    async def normalize_requirement(
        self,
        raw_input: Dict[str, Any],
        source: RequirementSource
    ) -> NormalizedRequirement:
        title = raw_input.get("title", "Untitled Requirement")
        description = raw_input.get("description", raw_input.get("text", ""))
        ac = raw_input.get("acceptance_criteria", [])
        if isinstance(ac, str):
            ac = [line.strip("- ") for line in ac.split("\n") if line.strip()]

        # Derive inputs from description keywords
        inputs: List[Dict[str, Any]] = raw_input.get("inputs", [])
        if not inputs:
            desc_lower = description.lower()
            if any(k in desc_lower for k in ["login", "email", "username"]):
                inputs = [{"name": "email", "type": "string"}, {"name": "password", "type": "string"}]
            elif any(k in desc_lower for k in ["search", "query", "filter"]):
                inputs = [{"name": "query", "type": "string"}, {"name": "filters", "type": "object"}]
            elif any(k in desc_lower for k in ["register", "signup", "create account"]):
                inputs = [{"name": "name", "type": "string"}, {"name": "email", "type": "string"}, {"name": "password", "type": "string"}]
            else:
                inputs = [{"name": "input_data", "type": "object"}]

        # Auto-derive expected results from ACs
        expected_results = raw_input.get("expected_results", [])
        if not expected_results and ac:
            expected_results = [ac[0]] if ac else ["Operation completes successfully"]

        # Auto-derive boundary conditions
        boundaries = raw_input.get("boundary_conditions", [])
        if not boundaries:
            desc_lower = description.lower()
            if "password" in desc_lower:
                boundaries = ["Password must be 8–128 characters", "Empty password rejected"]
            elif "email" in desc_lower:
                boundaries = ["Email must match RFC5322 format", "Empty email rejected"]
            else:
                boundaries = ["Empty input is rejected", "Maximum field length enforced"]

        # Auto-derive error handling
        error_rules = raw_input.get("error_handling_rules", [])
        if not error_rules:
            error_rules = [
                "HTTP 400 returned for invalid input with descriptive message",
                "HTTP 401 returned for authentication failure",
                "HTTP 500 triggers fallback error page, not raw stack trace"
            ]

        return NormalizedRequirement(
            id=f"REQ-{uuid.uuid4().hex[:6].upper()}",
            source=source,
            source_id=raw_input.get("source_id", f"{source.value.upper()}-01"),
            title=title,
            description=description,
            acceptance_criteria=[
                f"Given a user visits the target page, when valid inputs are provided, then {raw_input.get('title', 'the feature')} completes successfully.",
                f"Given invalid or missing inputs, when the action is submitted, then a clear validation error is displayed.",
                f"Given an unauthorized session, when the user attempts access, then the system redirects to login."
            ],
            inputs=inputs,
            expected_results=expected_results or ["Operation completes with expected outcome"],
            dependencies=raw_input.get("dependencies", ["Authentication Service", "Backend API"]),
            security_auth_rules=raw_input.get("security_auth_rules", []),
            boundary_conditions=boundaries,
            error_handling_rules=error_rules,
            raw_payload=raw_input
        )

    # ─── Requirement Quality Gate ─────────────────────────────────────────────
    async def evaluate_requirement_quality(self, req: NormalizedRequirement) -> RequirementScore:
        return req_rules.evaluate(req.model_dump())

    # ─── Test Suite Generation ────────────────────────────────────────────────
    async def generate_test_suite(self, req: NormalizedRequirement) -> List[TestCase]:
        """Generate a rich test suite covering positive, negative, boundary, validation, and auth scenarios."""
        tests: List[TestCase] = []
        req_ref = f"REQ_REF:{req.id}"

        # Pull first AC for traceability
        ac0 = req.acceptance_criteria[0] if req.acceptance_criteria else "System handles request"
        ac1 = req.acceptance_criteria[1] if len(req.acceptance_criteria) > 1 else "Input is validated"

        # Infer scenario context from title/description
        desc_lower = (req.title + " " + req.description).lower()
        is_login = any(k in desc_lower for k in ["login", "sign in", "authenticate"])
        is_password = any(k in desc_lower for k in ["password", "reset", "forgot"])
        is_search = any(k in desc_lower for k in ["search", "find", "filter", "query"])
        is_register = any(k in desc_lower for k in ["register", "signup", "create account"])

        def make_gherkin(scenario: str, steps: List[Tuple[str, str]]) -> str:
            lines = [f"Feature: {req.title}", f"  Scenario: {scenario}"]
            for keyword, step in steps:
                lines.append(f"    {keyword} {step}")
            return "\n".join(lines)

        # ── TC-01 Positive ─────────────────────────────────────────────────
        if is_login:
            steps_01 = [("Given", "the user is on the login page"), ("When", "the user enters valid credentials"), ("Then", "the user is redirected to the dashboard")]
            expected_01 = "User is authenticated and lands on the dashboard"
        elif is_password:
            steps_01 = [("Given", "the user has a registered email address"), ("When", "the user submits a password reset request"), ("Then", "a reset link is sent to the registered email")]
            expected_01 = "Password reset email sent; confirmation message displayed"
        elif is_search:
            steps_01 = [("Given", "the user is on the search page"), ("When", "the user enters a valid search term"), ("Then", "relevant results are displayed")]
            expected_01 = "Search results matching the query are returned"
        elif is_register:
            steps_01 = [("Given", "the user is on the registration page"), ("When", "the user fills all required fields correctly"), ("Then", "the account is created and a welcome email is sent")]
            expected_01 = "User account created; welcome email dispatched"
        else:
            steps_01 = [("Given", "the system is in a ready state"), ("When", "the user performs the primary action"), ("Then", f"the expected outcome is achieved: {req.expected_results[0] if req.expected_results else 'Success'}")]
            expected_01 = req.expected_results[0] if req.expected_results else "Primary workflow succeeds"

        tests.append(TestCase(
            id=f"TC-{uuid.uuid4().hex[:4].upper()}-01",
            requirement_id=req.id,
            title=f"[POSITIVE] Happy path — {req.title}",
            type="POSITIVE",
            gherkin=make_gherkin("Happy path — valid input succeeds", steps_01),
            steps=[s for _, s in steps_01],
            expected_outcome=expected_01,
            traceability_tag=f"{req_ref} | AC: {ac0[:60]}"
        ))

        # ── TC-02 Negative ─────────────────────────────────────────────────
        if is_login:
            steps_02 = [("Given", "the user is on the login page"), ("When", "the user enters an incorrect password"), ("Then", "an error message 'Invalid credentials' is displayed")]
            expected_02 = "Login is denied; error message shown; no session created"
        elif is_password:
            steps_02 = [("Given", "the user enters an email not registered in the system"), ("When", "the user submits a password reset request"), ("Then", "a generic message is shown without revealing account existence")]
            expected_02 = "Generic 'If this email exists, you will receive a reset link' message shown"
        elif is_search:
            steps_02 = [("Given", "the user is on the search page"), ("When", "the user enters a query that matches no records"), ("Then", "an empty state with a helpful message is displayed")]
            expected_02 = "Empty state with 'No results found' message displayed"
        else:
            steps_02 = [("Given", "the system is ready"), ("When", "the user submits invalid or malformed input"), ("Then", "a descriptive validation error is returned")]
            expected_02 = "HTTP 400 with descriptive error message; no data modified"

        tests.append(TestCase(
            id=f"TC-{uuid.uuid4().hex[:4].upper()}-02",
            requirement_id=req.id,
            title=f"[NEGATIVE] Invalid input rejected — {req.title}",
            type="NEGATIVE",
            gherkin=make_gherkin("Invalid input is rejected with appropriate error", steps_02),
            steps=[s for _, s in steps_02],
            expected_outcome=expected_02,
            traceability_tag=f"{req_ref} | AC: {ac1[:60]}"
        ))

        # ── TC-03 Boundary ─────────────────────────────────────────────────
        boundary = req.boundary_conditions[0] if req.boundary_conditions else "Maximum allowed input length"
        tests.append(TestCase(
            id=f"TC-{uuid.uuid4().hex[:4].upper()}-03",
            requirement_id=req.id,
            title=f"[BOUNDARY] Edge case input — {req.title}",
            type="BOUNDARY",
            gherkin=make_gherkin("Boundary input is handled correctly", [
                ("Given", "the system accepts input at its boundary limit"),
                ("When", f"the user submits input at the boundary: {boundary}"),
                ("Then", "the system accepts or rejects the input per specification")
            ]),
            steps=[f"Submit input at boundary: {boundary}", "Verify system response matches specification"],
            expected_outcome=f"System enforces boundary: {boundary}",
            traceability_tag=f"{req_ref} | Boundary: {boundary[:60]}"
        ))

        # ── TC-04 Validation ───────────────────────────────────────────────
        tests.append(TestCase(
            id=f"TC-{uuid.uuid4().hex[:4].upper()}-04",
            requirement_id=req.id,
            title=f"[VALIDATION] Required field enforcement — {req.title}",
            type="VALIDATION",
            gherkin=make_gherkin("Empty required fields are rejected", [
                ("Given", "the user is on the relevant form"),
                ("When", "the user submits the form without filling required fields"),
                ("Then", "validation messages appear for each empty required field")
            ]),
            steps=["Navigate to form", "Leave required fields empty", "Click submit", "Assert validation messages visible"],
            expected_outcome="Form submission blocked; inline validation messages displayed for each empty required field",
            traceability_tag=f"{req_ref} | Validation"
        ))

        # ── TC-05 Security/Auth (if sensitive operation) ───────────────────
        desc_all = (req.title + req.description).lower()
        if any(k in desc_all for k in ["login", "password", "reset", "auth", "token", "delete", "admin"]):
            tests.append(TestCase(
                id=f"TC-{uuid.uuid4().hex[:4].upper()}-05",
                requirement_id=req.id,
                title=f"[SECURITY] Unauthorized access blocked — {req.title}",
                type="SECURITY",
                gherkin=make_gherkin("Unauthenticated access is blocked", [
                    ("Given", "the user is not authenticated"),
                    ("When", "the user attempts to access the protected resource"),
                    ("Then", "the user is redirected to the login page with HTTP 401")
                ]),
                steps=["Clear session/cookies", "Navigate directly to protected URL", "Assert HTTP 401 or redirect to login"],
                expected_outcome="Access denied; user redirected to login; no sensitive data exposed",
                traceability_tag=f"{req_ref} | Security"
            ))

        return tests

    # ─── Automation Code Generation ────────────────────────────────────────────
    async def generate_automation_code(
        self,
        test_case: TestCase,
        target_url: str = "http://localhost:3000"
    ) -> AutomationScript:
        desc_lower = test_case.title.lower()
        tc_type = test_case.type
        req_id = test_case.requirement_id
        base_url = target_url.rstrip("/") if target_url else "http://localhost:3000"

        # Choose scenario-specific Playwright script
        if tc_type == "POSITIVE":
            if "login" in desc_lower or "authenticate" in desc_lower:
                code = f"""\
import {{ test, expect }} from '@playwright/test';

// Traceability: {test_case.traceability_tag}
test('{test_case.title}', async ({{ page }}) => {{
  await page.goto(process.env.BASE_URL || '{base_url}');

  // Navigate to login
  await page.getByRole('link', {{ name: /login|sign in/i }}).click();

  // Fill credentials from env
  await page.getByLabel(/email|username/i).fill(process.env.TEST_USER_EMAIL || 'testuser@example.com');
  await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || '');

  // Submit
  await page.getByRole('button', {{ name: /login|sign in/i }}).click();

  // Assert: user lands on dashboard
  await expect(page.getByRole('heading', {{ name: /dashboard|welcome/i }})).toBeVisible();
  await expect(page).not.toHaveURL(/login/i);
}});"""
            elif "password" in desc_lower or "reset" in desc_lower:
                code = f"""\
import {{ test, expect }} from '@playwright/test';

// Traceability: {test_case.traceability_tag}
test('{test_case.title}', async ({{ page }}) => {{
  await page.goto(process.env.BASE_URL || '{base_url}');

  // Navigate to password reset
  await page.getByRole('link', {{ name: /forgot|reset password/i }}).click();

  // Enter registered email
  await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'registered@example.com');
  await page.getByRole('button', {{ name: /send|reset|submit/i }}).click();

  // Assert: confirmation message visible
  await expect(page.getByText(/reset link|email sent|check your inbox/i)).toBeVisible();
}});"""
            else:
                code = f"""\
import {{ test, expect }} from '@playwright/test';

// Traceability: {test_case.traceability_tag}
test('{test_case.title}', async ({{ page }}) => {{
  await page.goto(process.env.BASE_URL || '{base_url}');

  // Primary happy-path workflow
  await page.getByRole('button', {{ name: /submit|continue|proceed/i }}).click();

  // Assert expected outcome: {test_case.expected_outcome}
  await expect(page.getByRole('status')).toContainText(/success|complete|confirmed/i);
}});"""

        elif tc_type == "NEGATIVE":
            code = f"""\
import {{ test, expect }} from '@playwright/test';

// Traceability: {test_case.traceability_tag}
test('{test_case.title}', async ({{ page }}) => {{
  await page.goto(process.env.BASE_URL || '{base_url}');

  // Submit with invalid/wrong data
  await page.getByLabel(/email|username/i).fill('invalid-input@bad.com');
  await page.getByLabel(/password/i).fill('wrongpassword');
  await page.getByRole('button', {{ name: /submit|login|send/i }}).click();

  // Assert: error message displayed, no navigation to protected area
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(/invalid|error|incorrect|not found/i);
  await expect(page).toHaveURL(/(login|reset|error)/i);
}});"""

        elif tc_type == "BOUNDARY":
            code = f"""\
import {{ test, expect }} from '@playwright/test';

// Traceability: {test_case.traceability_tag}
test('{test_case.title}', async ({{ page }}) => {{
  await page.goto(process.env.BASE_URL || '{base_url}');

  const boundaryInput = 'A'.repeat(128); // max boundary value

  const inputField = page.getByRole('textbox').first();
  await inputField.fill(boundaryInput);
  await page.getByRole('button', {{ name: /submit|save|continue/i }}).click();

  // Assert: boundary enforced — either accepted or rejected with clear message
  const alert = page.getByRole('alert');
  const isError = await alert.isVisible().catch(() => false);
  if (isError) {{
    await expect(alert).toContainText(/too long|maximum|limit/i);
  }} else {{
    await expect(page.getByRole('status')).toContainText(/success|saved/i);
  }}
}});"""

        elif tc_type == "VALIDATION":
            code = f"""\
import {{ test, expect }} from '@playwright/test';

// Traceability: {test_case.traceability_tag}
test('{test_case.title}', async ({{ page }}) => {{
  await page.goto(process.env.BASE_URL || '{base_url}');

  // Submit empty form without filling required fields
  await page.getByRole('button', {{ name: /submit|save|continue/i }}).click();

  // Assert: validation messages appear for each required field
  const validationMessages = page.locator('[aria-invalid="true"], .error-message, [role="alert"]');
  await expect(validationMessages.first()).toBeVisible();
  await expect(page).toHaveURL(/(form|register|login|reset)/i); // still on same page
}});"""

        else:  # SECURITY
            code = f"""\
import {{ test, expect }} from '@playwright/test';

// Traceability: {test_case.traceability_tag}
test('{test_case.title}', async ({{ page }}) => {{
  // Clear all cookies and session storage
  await page.context().clearCookies();

  // Attempt direct navigation to a protected resource
  const protectedUrl = `${{process.env.BASE_URL || '{base_url}'}}/dashboard`;
  await page.goto(protectedUrl);

  // Assert: redirected to login or receives 401
  await expect(page).toHaveURL(/login|signin|unauthorized/i);
  await expect(page.getByRole('heading', {{ name: /login|sign in/i }})).toBeVisible();
}});"""

        return AutomationScript(
            id=f"AUTO-{uuid.uuid4().hex[:6].upper()}",
            test_case_id=test_case.id,
            framework="PLAYWRIGHT",
            language="TYPESCRIPT",
            code=code,
            page_objects=[
                {"name": "LoginPage", "locators": "getByRole('button'), getByLabel('email'), getByLabel('password')"},
                {"name": "DashboardPage", "locators": "getByRole('heading'), getByRole('navigation')"}
            ]
        )

    # ─── Automation Quality Gate ───────────────────────────────────────────────
    async def evaluate_automation_quality(self, script: AutomationScript) -> RequirementScore:
        return auto_rules.evaluate(script.code, script.framework)

    # ─── Bruno API Test Generation ─────────────────────────────────────────────
    async def generate_bruno_api_test(self, req: NormalizedRequirement) -> AutomationScript:
        from app.services.bruno_executor import bruno_executor
        bruno_code = bruno_executor.generate_bruno_collection(req.title, "{{BASE_URL}}/api/v1/auth/reset")
        return AutomationScript(
            id=f"BRUNO-{uuid.uuid4().hex[:6].upper()}",
            test_case_id=req.id,
            framework="BRUNO_API",
            language="JSON",
            code=bruno_code,
            page_objects=[]
        )

    # ─── Test Execution (with detailed steps) ─────────────────────────────────
    async def execute_playwright_test(
        self,
        script: AutomationScript,
        test_case: Optional[TestCase] = None,
        target_url: str = "http://localhost:3000"
    ) -> ExecutionResult:
        """
        Simulate realistic Playwright execution with step-level detail.
        Returns rich execution result including stdout steps, timings, and classification.
        """
        await asyncio.sleep(0.1)  # simulate async execution delay
        base_url = target_url.rstrip("/") if target_url else "http://localhost:3000"

        tc_type = ""
        if test_case:
            tc_type = test_case.type
            steps = test_case.steps
        else:
            steps = ["Navigate to application", "Perform action", "Assert outcome"]

        # Deterministic outcome per test type for demo
        # POSITIVE → PASSED, NEGATIVE → PASSED, BOUNDARY → PASSED, VALIDATION → PASSED, SECURITY → FAILED (demo defect)
        if tc_type == "SECURITY":
            status = "FAILED"
            error_msg = f"Expected URL to match /login|signin|unauthorized/i but navigated to {base_url}/dashboard — APPLICATION DEFECT detected"
            stderr = f"Error: expect(page).toHaveURL(expected)\n  Expected pattern: /login|signin|unauthorized/i\n  Received: '{base_url}/dashboard'"
            duration = round(random.uniform(1200, 2500), 1)
            stdout = self._build_stdout(steps, status, tc_type)
        elif tc_type == "NEGATIVE":
            status = "PASSED"
            error_msg = None
            stderr = ""
            duration = round(random.uniform(800, 1600), 1)
            stdout = self._build_stdout(steps, status, tc_type)
        elif tc_type == "BOUNDARY":
            # Simulate a flaky automation defect (wrong locator)
            status = "FAILED"
            error_msg = "Locator 'getByRole('textbox').first()' timed out after 5000ms — element not found. AUTOMATION_DEFECT: locator may need update."
            stderr = "TimeoutError: locator.fill: Timeout 5000ms exceeded.\nCall log:\n  - waiting for getByRole('textbox').first()"
            duration = round(random.uniform(5000, 6500), 1)
            stdout = self._build_stdout(steps, status, tc_type)
        else:
            status = "PASSED"
            error_msg = None
            stderr = ""
            duration = round(random.uniform(600, 1800), 1)
            stdout = self._build_stdout(steps, status, tc_type)

        return ExecutionResult(
            execution_id=f"EXEC-{uuid.uuid4().hex[:6].upper()}",
            test_case_id=script.test_case_id,
            status=status,
            duration_ms=duration,
            stdout=stdout,
            stderr=stderr,
            error_message=error_msg,
            screenshot_path=f"screenshots/{script.test_case_id}.png" if status == "FAILED" else None,
            video_path=None
        )

    def _build_stdout(self, steps: List[str], status: str, tc_type: str) -> str:
        """Build realistic Playwright stdout with step-level logs."""
        lines = [
            f"  Running Playwright tests...",
            f"  Browser: chromium (headless)",
            f"  Workers: 1",
            f"",
        ]
        t = 0
        for i, step in enumerate(steps):
            t += random.randint(80, 400)
            lines.append(f"  [{t}ms] ▶ Step {i+1}: {step}")
            if status == "FAILED" and i == len(steps) - 1:
                lines.append(f"  [{t + 200}ms] ✗ FAILED — see error details below")
            else:
                lines.append(f"  [{t + 50}ms] ✓ OK")
        lines += [
            "",
            f"  1 test {'passed' if status == 'PASSED' else 'failed'} ({t + 200}ms)",
        ]
        return "\n".join(lines)

    # ─── Failure Analysis ─────────────────────────────────────────────────────
    async def analyze_failure_and_heal(
        self,
        execution: ExecutionResult,
        script: AutomationScript,
        test_case: Optional[TestCase] = None
    ) -> Tuple[FailureAnalysisResult, Optional[HealingProposal]]:

        is_locator_issue = "locator" in (execution.error_message or "").lower() or \
                           "TimeoutError" in (execution.stderr or "")
        is_app_defect = "APPLICATION_DEFECT" in (execution.error_message or "")

        if is_locator_issue:
            classification = "AUTOMATION_DEFECT"
            confidence = 0.93
            root_cause = "A Playwright locator timed out — the DOM element was not found using the current selector. Likely caused by a UI change in the application."
            can_heal = True
            fix = "Replace generic locator with a more stable semantic locator (getByTestId or getByRole)."
        elif is_app_defect:
            classification = "APPLICATION_DEFECT"
            confidence = 0.89
            root_cause = "Application does not enforce authentication guard on protected route — unauthenticated user accessed /dashboard without redirect."
            can_heal = False
            fix = "Application bug — requires developer fix. Add authentication middleware to /dashboard route."
        else:
            classification = "UNKNOWN"
            confidence = 0.5
            root_cause = "Insufficient evidence to classify failure. Review full trace."
            can_heal = False
            fix = "Gather more evidence — enable Playwright trace and screenshot."

        analysis = FailureAnalysisResult(
            execution_id=execution.execution_id,
            classification=classification,
            confidence=confidence,
            root_cause=root_cause,
            evidence=[
                execution.error_message or "No error message",
                execution.stderr[:300] if execution.stderr else "No stderr",
                f"Test type: {test_case.type if test_case else 'UNKNOWN'}",
                f"Duration: {execution.duration_ms}ms"
            ],
            suggested_fix=fix,
            can_self_heal=can_heal
        )

        proposal: Optional[HealingProposal] = None
        if can_heal:
            original = script.code
            healed = original.replace(
                "page.getByRole('textbox').first()",
                "page.getByTestId('main-input')"
            )
            proposal = HealingProposal(
                proposal_id=f"HEAL-{uuid.uuid4().hex[:6].upper()}",
                execution_id=execution.execution_id,
                automation_script_id=script.id,
                original_code=original,
                proposed_code=healed,
                diff="- page.getByRole('textbox').first()\n+ page.getByTestId('main-input')",
                explanation="Replaced runtime-unstable 'first() positional selector' with a stable data-testid attribute selector.",
                validation_status="PENDING_APPROVAL"
            )

        return analysis, proposal


pipeline_service = AgentPipelineService()
