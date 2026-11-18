import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import (
    ContentSubmission, RevisionHistory, Approval, ReviewAssignment,
    User, ActivityLog, OrgMember, Role
)

router = APIRouter()

class SubmitForReviewRequest(BaseModel):
    user_id: Optional[str] = "20000000-0000-0000-0000-000000000003"

class DecisionRequest(BaseModel):
    user_id: str
    stage: str # manager, compliance, final
    decision: str # approved, revision_requested, rejected
    reason: Optional[str] = None
    content_hash: Optional[str] = None

@router.get("/queue")
def get_review_queue(stage: Optional[str] = Query(None), org_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ContentSubmission).filter(
        ContentSubmission.workflow_status.in_(["manager_review", "compliance_review", "final_approval", "approved", "rejected"])
    )
    if org_id:
        query = query.filter(ContentSubmission.org_id == org_id)
    if stage:
        query = query.filter(ContentSubmission.workflow_status == f"{stage}_review")

    submissions = query.order_by(ContentSubmission.created_at.desc()).all()
    results = []
    for s in submissions:
        creator = db.query(User).filter(User.id == s.created_by).first()
        latest_rev = db.query(RevisionHistory).filter(RevisionHistory.submission_id == s.id).order_by(RevisionHistory.revision_no.desc()).first()
        approvals = db.query(Approval).filter(Approval.submission_id == s.id).all()
        results.append({
            "id": s.id,
            "org_id": s.org_id,
            "title": s.title,
            "channel": s.channel,
            "campaign": s.campaign,
            "workflow_status": s.workflow_status,
            "current_band": s.current_band,
            "creator_name": creator.full_name if creator else "Unknown",
            "body_snippet": latest_rev.body_text[:120] if latest_rev else "",
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "approvals_count": len(approvals)
        })
    return results

@router.post("/submissions/{submission_id}/submit")
def submit_for_review(submission_id: str, payload: SubmitForReviewRequest = None, db: Session = Depends(get_db)):
    sub = db.query(ContentSubmission).filter(ContentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    user_id = payload.user_id if payload else sub.created_by
    sub.workflow_status = "manager_review"

    db.add(ActivityLog(
        org_id=sub.org_id,
        actor_id=user_id,
        action="SUBMITTED_FOR_REVIEW",
        entity_type="submission",
        entity_id=sub.id,
        metadata_json={"target_stage": "manager_review"}
    ))

    db.commit()
    db.refresh(sub)
    return {
        "id": sub.id,
        "workflow_status": sub.workflow_status,
        "message": "Submission forwarded to Manager Review stage"
    }

@router.post("/submissions/{submission_id}/decisions")
def make_review_decision(submission_id: str, payload: DecisionRequest, db: Session = Depends(get_db)):
    sub = db.query(ContentSubmission).filter(ContentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    latest_rev = db.query(RevisionHistory).filter(RevisionHistory.submission_id == sub.id).order_by(RevisionHistory.revision_no.desc()).first()
    if not latest_rev:
        raise HTTPException(status_code=400, detail="Submission has no active revision")

    # Stale version check (PRD Section 11.5 & 15.1)
    if payload.content_hash and payload.content_hash != latest_rev.content_hash:
        raise HTTPException(
            status_code=409,
            detail="STALE_VERSION: Content changed since review. Re-audit required before decision."
        )

    # Separation of Duties Rule 1: Author cannot approve their own content (PRD Section 6.2)
    if payload.decision == "approved" and payload.user_id == sub.created_by:
        raise HTTPException(
            status_code=403,
            detail="FORBIDDEN_ROLE: Separation of duties violation. A creator cannot approve their own content."
        )

    # Separation of Duties Rule 2: Compliance reviewer cannot be the same person as Manager approver
    if payload.stage == "compliance" and payload.decision == "approved":
        prior_manager_approval = db.query(Approval).filter(
            Approval.submission_id == sub.id,
            Approval.stage == "manager",
            Approval.decision == "approved"
        ).first()
        if prior_manager_approval and prior_manager_approval.decided_by == payload.user_id:
            raise HTTPException(
                status_code=403,
                detail="FORBIDDEN_ROLE: Separation of duties violation. Compliance approval must be performed by a different reviewer than manager approval."
            )

    # Mandatory reason on reject or revision request
    if payload.decision in ("revision_requested", "rejected") and not payload.reason:
        raise HTTPException(status_code=400, detail="A mandatory reason is required for rejection or revision requests.")

    # Record append-only approval
    approval = Approval(
        id=str(uuid.uuid4()),
        org_id=sub.org_id,
        submission_id=sub.id,
        revision_id=latest_rev.id,
        stage=payload.stage,
        decision=payload.decision,
        decided_by=payload.user_id,
        reason=payload.reason,
        content_hash=latest_rev.content_hash
    )
    db.add(approval)

    # Advance or reject workflow status
    if payload.decision == "rejected":
        sub.workflow_status = "rejected"
    elif payload.decision == "revision_requested":
        sub.workflow_status = "revision"
    elif payload.decision == "approved":
        if payload.stage == "manager":
            sub.workflow_status = "compliance_review"
        elif payload.stage == "compliance":
            sub.workflow_status = "final_approval"
        elif payload.stage == "final":
            sub.workflow_status = "approved"

    db.add(ActivityLog(
        org_id=sub.org_id,
        actor_id=payload.user_id,
        action=f"REVIEW_{payload.decision.upper()}",
        entity_type="approval",
        entity_id=approval.id,
        metadata_json={
            "submission_id": sub.id,
            "stage": payload.stage,
            "decision": payload.decision,
            "new_status": sub.workflow_status
        }
    ))

    db.commit()
    db.refresh(sub)
    return {
        "submission_id": sub.id,
        "workflow_status": sub.workflow_status,
        "approval_id": approval.id,
        "stage": payload.stage,
        "decision": payload.decision
    }

@router.get("/submissions/{submission_id}/approvals")
def get_submission_approvals(submission_id: str, db: Session = Depends(get_db)):
    approvals = db.query(Approval).filter(Approval.submission_id == submission_id).order_by(Approval.decided_at.desc()).all()
    results = []
    for a in approvals:
        reviewer = db.query(User).filter(User.id == a.decided_by).first()
        results.append({
            "id": a.id,
            "stage": a.stage,
            "decision": a.decision,
            "decided_by": a.decided_by,
            "reviewer_name": reviewer.full_name if reviewer else "Reviewer",
            "reason": a.reason,
            "decided_at": a.decided_at.isoformat() if a.decided_at else None
        })
    return results
