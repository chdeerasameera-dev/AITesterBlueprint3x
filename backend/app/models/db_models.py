from sqlalchemy import Column, String, Float, Text, JSON, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class RequirementRecord(Base):
    __tablename__ = "requirements"

    id = Column(String, primary_key=True, default=generate_uuid)
    source = Column(String, nullable=False)
    source_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    normalized_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    quality_evaluations = relationship("QualityGateRecord", back_populates="requirement")
    test_cases = relationship("TestCaseRecord", back_populates="requirement")

class QualityGateRecord(Base):
    __tablename__ = "quality_gate_evaluations"

    id = Column(String, primary_key=True, default=generate_uuid)
    requirement_id = Column(String, ForeignKey("requirements.id"), nullable=False)
    gate_type = Column(String, nullable=False) # REQUIREMENT, TEST_DESIGN, AUTOMATION, EXECUTION
    score = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    findings = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    requirement = relationship("RequirementRecord", back_populates="quality_evaluations")

class TestCaseRecord(Base):
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    requirement_id = Column(String, ForeignKey("requirements.id"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    gherkin = Column(Text, nullable=False)
    steps = Column(JSON, nullable=False)
    expected_outcome = Column(Text, nullable=False)
    traceability_tag = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    requirement = relationship("RequirementRecord", back_populates="test_cases")
    automation = relationship("AutomationScriptRecord", back_populates="test_case")

class AutomationScriptRecord(Base):
    __tablename__ = "automation_scripts"

    id = Column(String, primary_key=True, default=generate_uuid)
    test_case_id = Column(String, ForeignKey("test_cases.id"), nullable=False)
    framework = Column(String, nullable=False)
    language = Column(String, nullable=False)
    code = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    test_case = relationship("TestCaseRecord", back_populates="automation")
    executions = relationship("ExecutionRecord", back_populates="automation_script")

class ExecutionRecord(Base):
    __tablename__ = "executions"

    id = Column(String, primary_key=True, default=generate_uuid)
    automation_script_id = Column(String, ForeignKey("automation_scripts.id"), nullable=False)
    status = Column(String, nullable=False)
    duration_ms = Column(Float, nullable=False)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    screenshot_path = Column(String, nullable=True)
    video_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    automation_script = relationship("AutomationScriptRecord", back_populates="executions")
    failure_analysis = relationship("FailureAnalysisRecord", back_populates="execution", uselist=False)

class FailureAnalysisRecord(Base):
    __tablename__ = "failure_analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("executions.id"), nullable=False)
    classification = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    root_cause = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=False)
    suggested_fix = Column(Text, nullable=True)
    can_self_heal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    execution = relationship("ExecutionRecord", back_populates="failure_analysis")
