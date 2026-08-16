from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from enum import Enum

class QualityStatus(str, Enum):
    READY = "READY"
    REVIEW_RECOMMENDED = "REVIEW_RECOMMENDED"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"
    NOT_READY = "NOT_READY"

class RequirementSource(str, Enum):
    MANUAL = "manual"
    DOCUMENT = "document"
    JIRA = "jira"
    AZURE = "azure"

class AITestRequest(BaseModel):
    provider: str = "openai"
    base_url: str = "https://api.openai.com/v1"
    api_key: Optional[str] = ""
    model: str = "gpt-4o"

class QualityFinding(BaseModel):
    id: str
    rule_id: str
    category: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    title: str
    description: str
    impact: str
    recommendation: Optional[str] = None
    location: Optional[str] = None

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    target_field: str
    reason: str
    suggested_options: List[str] = []

class RequirementScore(BaseModel):
    score: float = Field(..., ge=0, le=100)
    status: QualityStatus
    critical_issues: List[QualityFinding] = []
    findings: List[QualityFinding] = []
    evidence: List[str] = []
    clarification_questions: List[ClarificationQuestion] = []

class NormalizedRequirement(BaseModel):
    id: str
    source: RequirementSource
    source_id: Optional[str] = None
    title: str
    description: str
    acceptance_criteria: List[str] = []
    inputs: List[Dict[str, Any]] = []
    expected_results: List[str] = []
    dependencies: List[str] = []
    security_auth_rules: List[str] = []
    boundary_conditions: List[str] = []
    error_handling_rules: List[str] = []
    raw_payload: Optional[Dict[str, Any]] = None

class TestCase(BaseModel):
    id: str
    requirement_id: str
    title: str
    type: Literal["POSITIVE", "NEGATIVE", "BOUNDARY", "SECURITY", "VALIDATION"]
    gherkin: str
    steps: List[str]
    expected_outcome: str
    traceability_tag: str

class AutomationScript(BaseModel):
    id: str
    test_case_id: str
    framework: Literal["PLAYWRIGHT", "BRUNO_API"]
    language: Literal["TYPESCRIPT", "JSON"]
    code: str
    page_objects: List[Dict[str, str]] = []

class ExecutionResult(BaseModel):
    execution_id: str
    test_case_id: str
    status: Literal["PASSED", "FAILED", "SKIPPED", "ERROR"]
    duration_ms: float
    stdout: str = ""
    stderr: str = ""
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None
    screenshot_path: Optional[str] = None
    video_path: Optional[str] = None

class FailureAnalysisResult(BaseModel):
    execution_id: str
    classification: Literal["APPLICATION_DEFECT", "AUTOMATION_DEFECT", "ENVIRONMENT_FAILURE", "TEST_DATA_FAILURE", "UNKNOWN"]
    confidence: float
    root_cause: str
    evidence: List[str]
    suggested_fix: Optional[str] = None
    can_self_heal: bool = False

class HealingProposal(BaseModel):
    proposal_id: str
    execution_id: str
    automation_script_id: str
    original_code: str
    proposed_code: str
    diff: str
    explanation: str
    validation_status: Optional[str] = None
