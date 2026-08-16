import pytest
from app.quality_rules.requirement_rules import RequirementQualityRulesEngine
from app.quality_rules.automation_rules import AutomationQualityRulesEngine

def test_requirement_rules_missing_ac():
    engine = RequirementQualityRulesEngine()
    req = {
        "title": "User Registration",
        "description": "User registers on the portal",
        "acceptance_criteria": [],
        "expected_results": []
    }
    score = engine.evaluate(req)
    assert score.status == "NOT_READY"
    assert any(f.rule_id == "RULE_MISSING_AC" for f in score.critical_issues)

def test_automation_rules_hardcoded_wait():
    engine = AutomationQualityRulesEngine()
    code = """
    test('test', async ({ page }) => {
      await page.waitForTimeout(5000);
      expect(page).toBeDefined();
    });
    """
    score = engine.evaluate(code, "PLAYWRIGHT")
    assert any(f.rule_id == "RULE_PAGE_WAITFORTIMEOUT" for f in score.findings)
