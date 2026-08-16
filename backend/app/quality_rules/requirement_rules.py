import re
from typing import List, Dict, Any
from app.models.schemas import QualityFinding, ClarificationQuestion, QualityStatus, RequirementScore

class RequirementQualityRulesEngine:

    AMBIGUOUS_WORDS = [
        "fast", "quick", "slow", "easy", "user-friendly", "flexible", "robust",
        "efficient", "seamless", "scalable", "secure", "adequate", "as appropriate",
        "etc", "and so on", "tbd", "todo", "should ideally", "preferably"
    ]

    def evaluate(self, requirement: Dict[str, Any]) -> RequirementScore:
        findings: List[QualityFinding] = []
        critical_issues: List[QualityFinding] = []
        clarifications: List[ClarificationQuestion] = []
        evidence: List[str] = []
        
        title = requirement.get("title", "")
        description = requirement.get("description", "")
        acceptance_criteria = requirement.get("acceptance_criteria", [])
        expected_results = requirement.get("expected_results", [])
        inputs = requirement.get("inputs", [])
        error_handling = requirement.get("error_handling_rules", [])
        boundary_conditions = requirement.get("boundary_conditions", [])
        security_rules = requirement.get("security_auth_rules", [])

        total_score = 100.0

        # Check 1: Missing Acceptance Criteria
        if not acceptance_criteria:
            finding = QualityFinding(
                id="REQ-CRIT-001",
                rule_id="RULE_MISSING_AC",
                category="Completeness",
                severity="CRITICAL",
                title="Missing Acceptance Criteria",
                description="The requirement lacks explicit acceptance criteria required to define pass/fail conditions.",
                impact="Cannot design verifiable automated test suites.",
                recommendation="Specify clear, bulleted acceptance criteria."
            )
            critical_issues.append(finding)
            findings.append(finding)
            total_score -= 30.0
            evidence.append("Rule RULE_MISSING_AC failed: acceptance_criteria list is empty.")

        # Check 2: Missing Expected Results
        if not expected_results:
            finding = QualityFinding(
                id="REQ-HIGH-002",
                rule_id="RULE_MISSING_EXPECTED_RESULTS",
                category="Testability",
                severity="HIGH",
                title="Missing Explicit Expected Results",
                description="No explicit expected outcomes were detailed in the normalized requirement.",
                impact="High risk of incorrect assertions during test automation generation.",
                recommendation="Document expected system outcomes for each workflow."
            )
            findings.append(finding)
            total_score -= 15.0
            evidence.append("Rule RULE_MISSING_EXPECTED_RESULTS failed: expected_results list is empty.")

        # Check 3: Ambiguous or non-measurable wording
        text_to_scan = f"{title} {description} {' '.join(acceptance_criteria)}".lower()
        found_ambiguous = [w for w in self.AMBIGUOUS_WORDS if re.search(r'\b' + re.escape(w) + r'\b', text_to_scan)]
        if found_ambiguous:
            finding = QualityFinding(
                id="REQ-MED-003",
                rule_id="RULE_AMBIGUOUS_LANGUAGE",
                category="Ambiguity",
                severity="MEDIUM",
                title="Ambiguous or Non-Measurable Language Detected",
                description=f"Requirement contains non-verifiable words: {', '.join(found_ambiguous)}",
                impact="Tests derived from ambiguous requirements may lead to subjective or flaky assertions.",
                recommendation="Replace vague quality descriptors with measurable SLA/functional numbers."
            )
            findings.append(finding)
            total_score -= 10.0
            evidence.append(f"Rule RULE_AMBIGUOUS_LANGUAGE flagged terms: {found_ambiguous}")

            clarifications.append(ClarificationQuestion(
                id="CLAR-001",
                question=f"What specific measurable threshold or criteria defines '{found_ambiguous[0]}' in this feature?",
                target_field="acceptance_criteria",
                reason="Non-measurable words cannot be verified via automated Playwright assertions.",
                suggested_options=["Define specific timeout in seconds", "Define exact expected status message"]
            ))

        # Check 4: Missing Error Handling
        if not error_handling:
            finding = QualityFinding(
                id="REQ-MED-004",
                rule_id="RULE_MISSING_ERROR_HANDLING",
                category="Completeness",
                severity="MEDIUM",
                title="Missing Error Handling & Edge Cases",
                description="No explicit error handling rules or failure modes specified.",
                impact="Negative test coverage will be incomplete.",
                recommendation="Specify behavior when invalid inputs or network errors occur."
            )
            findings.append(finding)
            total_score -= 10.0
            evidence.append("Rule RULE_MISSING_ERROR_HANDLING failed: error_handling_rules empty.")

        # Check 5: Security / Auth check for sensitive operations
        sensitive_keywords = ["login", "password", "reset", "auth", "token", "payment", "delete", "admin"]
        is_sensitive = any(kw in text_to_scan for kw in sensitive_keywords)
        if is_sensitive and not security_rules:
            finding = QualityFinding(
                id="REQ-CRIT-005",
                rule_id="RULE_MISSING_SECURITY_RULES",
                category="Security",
                severity="CRITICAL",
                title="Missing Security & Authorization Behavior",
                description="Requirement involves sensitive operations but provides no authorization/security constraints.",
                impact="Security vulnerability risks and missing role-based access control tests.",
                recommendation="Define required permissions, encryption, or authentication rules."
            )
            critical_issues.append(finding)
            findings.append(finding)
            total_score -= 25.0
            evidence.append("Rule RULE_MISSING_SECURITY_RULES failed: sensitive requirement lacks security_auth_rules.")

        # Determine Final Quality Status based on rules (Ready, Review Recommended, Needs Clarification, Not Ready)
        score = max(0.0, round(total_score, 1))
        
        if critical_issues or score < 50:
            status = QualityStatus.NOT_READY
        elif score < 75 or len(clarifications) > 0:
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
            clarification_questions=clarifications
        )
