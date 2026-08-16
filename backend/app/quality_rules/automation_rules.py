from typing import List, Dict, Any
from app.models.schemas import QualityFinding, QualityStatus, RequirementScore

class AutomationQualityRulesEngine:

    FORBIDDEN_PATTERNS = [
        ("page.waitForTimeout", "CRITICAL", "Hardcoded wait detected (`page.waitForTimeout`). Use auto-waiting locators or state assertions instead."),
        ("//*", "HIGH", "Generic XPath selector detected (`//*`). Use stable Playwright locators: role, label, or data-testid."),
        ("http://", "HIGH", "Insecure HTTP URL detected. Use environment-configured HTTPS endpoints."),
        ("admin123", "CRITICAL", "Hardcoded credential detected in automation script."),
        ("password123", "CRITICAL", "Hardcoded credential detected in automation script."),
        ("secret", "HIGH", "Potential hardcoded secret or token found in script source.")
    ]

    def evaluate(self, code: str, framework: str) -> RequirementScore:
        findings: List[QualityFinding] = []
        critical_issues: List[QualityFinding] = []
        evidence: List[str] = []
        total_score = 100.0

        lines = code.split("\n")
        
        # Check 1: Static forbidden patterns
        for idx, line in enumerate(lines, 1):
            for pattern, severity, msg in self.FORBIDDEN_PATTERNS:
                if pattern in line:
                    finding = QualityFinding(
                        id=f"AUTO-{severity}-{idx}",
                        rule_id=f"RULE_{pattern.upper().replace('.', '_').replace('/', '_')}",
                        category="Automation Quality",
                        severity=severity,
                        title=f"Static Code Violation at Line {idx}",
                        description=msg,
                        impact="Flaky execution, security risk, or poor maintainability.",
                        recommendation="Refactor using Playwright best practices and environment variables.",
                        location=f"Line {idx}: {line.strip()}"
                    )
                    findings.append(finding)
                    if severity == "CRITICAL":
                        critical_issues.append(finding)
                        total_score -= 30.0
                    else:
                        total_score -= 15.0
                    evidence.append(f"Line {idx} failed rule: {msg}")

        # Check 2: Assertions presence check
        has_assertion = "expect(" in code or "assert " in code or "response.status" in code
        if not has_assertion:
            finding = QualityFinding(
                id="AUTO-CRIT-NO-ASSERT",
                rule_id="RULE_MISSING_ASSERTIONS",
                category="Test Completeness",
                severity="CRITICAL",
                title="Missing Test Outcome Assertions",
                description="The generated script contains no `expect()` assertions to verify business results.",
                impact="Test will always pass regardless of application behavior.",
                recommendation="Add explicit Playwright assertions verifying visual or state changes."
            )
            critical_issues.append(finding)
            findings.append(finding)
            total_score -= 35.0
            evidence.append("Rule RULE_MISSING_ASSERTIONS failed: No assertion keywords (`expect`, `assert`) found.")

        score = max(0.0, round(total_score, 1))

        if critical_issues or score < 50:
            status = QualityStatus.NOT_READY
        elif score < 75:
            status = QualityStatus.NEEDS_CLARIFICATION
        elif score < 90:
            status = QualityStatus.REVIEW_RECOMMENDED
        else:
            status = QualityStatus.READY

        return RequirementScore(
            score=score,
            status=status,
            critical_issues=critical_issues,
            findings=findings,
            evidence=evidence,
            clarification_questions=[]
        )
