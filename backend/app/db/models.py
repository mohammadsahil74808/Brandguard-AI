import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    industry = Column(String(100), default="General")
    external_ai_enabled = Column(Boolean, default=True)
    retention_days = Column(Integer, default=365)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Role(Base):
    __tablename__ = "roles"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    key = Column(String(50), unique=True, nullable=False)
    label = Column(String(100), nullable=False)

class OrgMember(Base):
    __tablename__ = "org_members"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False)
    status = Column(String(50), default="active")
    team = Column(String(100), default="General")
    joined_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    role = relationship("Role")

class Guideline(Base):
    __tablename__ = "guidelines"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="General")
    department = Column(String(100), default="Marketing")
    campaign = Column(String(100), nullable=True)
    status = Column(String(50), default="approved") # approved, expired, pending
    agency_visible = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class GuidelineVersion(Base):
    __tablename__ = "guideline_versions"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    guideline_id = Column(String(36), ForeignKey("guidelines.id"), nullable=False)
    version_no = Column(Integer, default=1)
    page_count = Column(Integer, default=1)
    status = Column(String(50), default="ready")
    created_at = Column(DateTime, default=datetime.utcnow)

class GuidelineChunk(Base):
    __tablename__ = "guideline_chunks"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    version_id = Column(String(36), ForeignKey("guideline_versions.id"), nullable=False)
    section_path = Column(String(500), nullable=False)
    page_start = Column(Integer, default=1)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    embedding_json = Column(JSON, nullable=True) # JSON list for portable cosine similarity

class ApprovedFact(Base):
    __tablename__ = "approved_facts"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    fact_key = Column(String(255), nullable=False)
    entity = Column(String(255), nullable=False)
    attribute = Column(String(100), nullable=False)
    value_text = Column(Text, nullable=False)
    value_numeric = Column(Float, nullable=True)
    currency = Column(String(20), nullable=True)
    source_section = Column(String(255), nullable=True)
    valid_from = Column(String(50), nullable=False)
    valid_to = Column(String(50), nullable=True)
    status = Column(String(50), default="approved") # approved, expired, pending

class Terminology(Base):
    __tablename__ = "terminology"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    term = Column(String(255), nullable=False)
    kind = Column(String(50), nullable=False) # approved, prohibited, preferred
    replacement = Column(String(255), nullable=True)
    context_note = Column(Text, nullable=True)
    severity = Column(String(50), default="medium")
    status = Column(String(50), default="approved")

class ToneProfile(Base):
    __tablename__ = "tone_profiles"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    descriptors = Column(JSON, default=list)
    do_examples = Column(JSON, default=list)
    dont_examples = Column(JSON, default=list)
    formality = Column(String(50), default="balanced")
    channel = Column(String(50), default="all")

class RiskPolicy(Base):
    __tablename__ = "risk_policies"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    version_no = Column(Integer, default=1)
    severity_points = Column(JSON, default=dict)
    band_rules = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)

class ContentSubmission(Base):
    __tablename__ = "content_submissions"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content_type = Column(String(50), default="caption")
    channel = Column(String(50), default="instagram")
    campaign = Column(String(100), default="General")
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    workflow_status = Column(String(50), default="draft") # draft, audited, revision, manager_review, compliance_review, final_approval, approved, rejected
    current_band = Column(String(50), default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User")

class RevisionHistory(Base):
    __tablename__ = "revision_history"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    submission_id = Column(String(36), ForeignKey("content_submissions.id"), nullable=False)
    revision_no = Column(Integer, default=1)
    body_text = Column(Text, nullable=False)
    content_hash = Column(String(100), nullable=False)
    change_summary = Column(Text, default="Initial draft")
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Audit(Base):
    __tablename__ = "audits"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    submission_id = Column(String(36), ForeignKey("content_submissions.id"), nullable=False)
    revision_id = Column(String(36), ForeignKey("revision_history.id"), nullable=False)
    status = Column(String(50), default="completed") # queued, running, completed, failed
    ai_mode = Column(String(50), default="full")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.utcnow)

class AuditResult(Base):
    __tablename__ = "audit_results"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    audit_id = Column(String(36), ForeignKey("audits.id"), unique=True, nullable=False)
    risk_band = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    points = Column(Integer, default=0)
    breakdown = Column(JSON, default=list)
    category_counts = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

class Violation(Base):
    __tablename__ = "violations"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    audit_id = Column(String(36), ForeignKey("audits.id"), nullable=False)
    issue_code = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False) # pricing, terminology, tone, claim, messaging, grammar, accessibility, security
    severity = Column(String(50), nullable=False) # info, low, medium, high, critical
    submitted_text = Column(Text, nullable=False)
    span_start = Column(Integer, default=0)
    span_end = Column(Integer, default=0)
    explanation = Column(Text, nullable=False)
    guideline_ref = Column(String(255), nullable=True)
    evidence_text = Column(Text, nullable=True)
    suggested_correction = Column(Text, nullable=True)
    confidence = Column(String(50), default="high")
    status = Column(String(50), default="open") # open, accepted, rejected, dismissed

class ClaimVerification(Base):
    __tablename__ = "claim_verifications"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    audit_id = Column(String(36), ForeignKey("audits.id"), nullable=False)
    claim_text = Column(Text, nullable=False)
    claim_type = Column(String(50), nullable=False) # price, spec, superlative, date
    normalized_value = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False) # verified, contradicted, unsupported, outdated, needs_review
    evidence_quote = Column(Text, nullable=True)
    source_ref = Column(String(255), nullable=True)
    confidence = Column(String(50), default="high")
    suggested_correction = Column(Text, nullable=True)

class AiSuggestion(Base):
    __tablename__ = "ai_suggestions"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    violation_id = Column(String(36), ForeignKey("violations.id"), nullable=False)
    revision_id = Column(String(36), ForeignKey("revision_history.id"), nullable=False)
    span_start = Column(Integer, default=0)
    span_end = Column(Integer, default=0)
    original_text = Column(Text, nullable=False)
    replacement_text = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    state = Column(String(50), default="pending") # pending, accepted, rejected

class ReviewAssignment(Base):
    __tablename__ = "review_assignments"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    submission_id = Column(String(36), ForeignKey("content_submissions.id"), nullable=False)
    stage = Column(String(50), nullable=False) # manager, compliance, final
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    reviewer = relationship("User")

class Approval(Base):
    __tablename__ = "approvals"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    submission_id = Column(String(36), ForeignKey("content_submissions.id"), nullable=False)
    revision_id = Column(String(36), ForeignKey("revision_history.id"), nullable=False)
    content_hash = Column(String(100), nullable=False)
    stage = Column(String(50), nullable=False)
    decision = Column(String(50), nullable=False) # approved, revision_requested, rejected
    reason = Column(Text, nullable=True)
    decided_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    decided_at = Column(DateTime, default=datetime.utcnow)

    decided_by_user = relationship("User")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User")
