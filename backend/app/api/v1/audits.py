from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import (
    Audit, AuditResult, Violation, ClaimVerification, AiSuggestion,
    ContentSubmission, RevisionHistory
)
from app.services.audit_service import run_audit

router = APIRouter()

class AuditRequest(BaseModel):
    run_ai: bool = True

class SuggestionUpdate(BaseModel):
    state: str # accepted, rejected

@router.post("/submissions/{submission_id}/audits")
def trigger_audit(submission_id: str, payload: AuditRequest = None, db: Session = Depends(get_db)):
    sub = db.query(ContentSubmission).filter(ContentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    latest_rev = db.query(RevisionHistory).filter(RevisionHistory.submission_id == sub.id).order_by(RevisionHistory.revision_no.desc()).first()
    if not latest_rev:
        raise HTTPException(status_code=400, detail="Submission has no revisions to audit")

    run_ai = payload.run_ai if payload else True
    audit = run_audit(db, submission_id=sub.id, revision_id=latest_rev.id, run_ai=run_ai)

    return {
        "audit_id": audit.id,
        "status": audit.status,
        "submission_id": sub.id,
        "revision_id": latest_rev.id,
        "current_band": sub.current_band
    }

@router.get("/submissions/{submission_id}/latest-audit")
def get_latest_audit(submission_id: str, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.submission_id == submission_id).order_by(Audit.started_at.desc()).first()
    if not audit:
        return None
    return get_audit_results(audit.id, db)

@router.get("/audits/{audit_id}/results")
def get_audit_results(audit_id: str, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    result = db.query(AuditResult).filter(AuditResult.audit_id == audit.id).first()
    violations = db.query(Violation).filter(Violation.audit_id == audit.id).all()
    claims = db.query(ClaimVerification).filter(ClaimVerification.audit_id == audit.id).all()
    suggestions = db.query(AiSuggestion).filter(AiSuggestion.revision_id == audit.revision_id).all()
    revision = db.query(RevisionHistory).filter(RevisionHistory.id == audit.revision_id).first()

    return {
        "audit": {
            "id": audit.id,
            "submission_id": audit.submission_id,
            "revision_id": audit.revision_id,
            "status": audit.status,
            "ai_mode": audit.ai_mode,
            "completed_at": audit.completed_at.isoformat() if audit.completed_at else None
        },
        "content": {
            "body_text": revision.body_text if revision else "",
            "revision_no": revision.revision_no if revision else 1,
            "content_hash": revision.content_hash if revision else ""
        },
        "risk": {
            "risk_band": result.risk_band if result else "PENDING",
            "points": result.points if result else 0,
            "breakdown": result.breakdown if result else [],
            "category_counts": result.category_counts if result else {}
        },
        "violations": [{
            "id": v.id,
            "issue_code": v.issue_code,
            "category": v.category,
            "severity": v.severity,
            "submitted_text": v.submitted_text,
            "span": {"start": v.span_start, "end": v.span_end},
            "explanation": v.explanation,
            "guideline_ref": v.guideline_ref,
            "evidence_text": v.evidence_text,
            "suggested_correction": v.suggested_correction,
            "confidence": v.confidence,
            "status": v.status
        } for v in violations],
        "claims": [{
            "id": c.id,
            "claim_text": c.claim_text,
            "claim_type": c.claim_type,
            "normalized_value": c.normalized_value,
            "status": c.status,
            "evidence_quote": c.evidence_quote,
            "source_ref": c.source_ref,
            "confidence": c.confidence,
            "suggested_correction": c.suggested_correction
        } for c in claims],
        "suggestions": [{
            "id": s.id,
            "violation_id": s.violation_id,
            "original_text": s.original_text,
            "replacement_text": s.replacement_text,
            "rationale": s.rationale,
            "span": {"start": s.span_start, "end": s.span_end},
            "state": s.state
        } for s in suggestions]
    }

@router.patch("/suggestions/{suggestion_id}")
def update_suggestion_state(suggestion_id: str, payload: SuggestionUpdate, db: Session = Depends(get_db)):
    sugg = db.query(AiSuggestion).filter(AiSuggestion.id == suggestion_id).first()
    if not sugg:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    sugg.state = payload.state
    db.commit()
    db.refresh(sugg)
    return {
        "id": sugg.id,
        "state": sugg.state
    }
