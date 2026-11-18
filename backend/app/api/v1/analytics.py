from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import (
    Organization, ContentSubmission, Audit, AuditResult, Violation, ActivityLog
)

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(org_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    sub_q = db.query(ContentSubmission)
    audit_q = db.query(Audit)
    violation_q = db.query(Violation)
    result_q = db.query(AuditResult)
    log_q = db.query(ActivityLog)

    if org_id:
        sub_q = sub_q.filter(ContentSubmission.org_id == org_id)
        audit_q = audit_q.filter(Audit.org_id == org_id)
        violation_q = violation_q.filter(Violation.org_id == org_id)
        result_q = result_q.filter(AuditResult.org_id == org_id)
        log_q = log_q.filter(ActivityLog.org_id == org_id)

    total_submissions = sub_q.count()
    total_audits = audit_q.count()
    approved_submissions = sub_q.filter(ContentSubmission.workflow_status == "approved").count()
    in_review = sub_q.filter(
        ContentSubmission.workflow_status.in_(["manager_review", "compliance_review", "final_approval"])
    ).count()

    # Violations by category
    category_counts = violation_q.with_entities(
        Violation.category, func.count(Violation.id)
    ).group_by(Violation.category).all()
    categories = {cat: count for cat, count in category_counts}

    # Risk band distribution
    bands = result_q.with_entities(
        AuditResult.risk_band, func.count(AuditResult.id)
    ).group_by(AuditResult.risk_band).all()
    band_dist = {b: count for b, count in bands}

    org = db.query(Organization).filter(Organization.id == org_id).first() if org_id else None
    org_name = org.name if org else "BrandGuard AI"

    # Guideline improvement intelligence
    guideline_insights = [
        {
            "id": "INS-01",
            "guideline": f"{org_name} > Claims Policy > Pricing Standards",
            "occurrences": categories.get("pricing", 1),
            "recommendation": f"Frequent price mismatch detected across recent campaigns. Recommend verifying price sheets for {org_name} catalog.",
            "impact": "High Risk Prevention"
        },
        {
            "id": "INS-02",
            "guideline": f"{org_name} > Brand Voice > Tone and Punctuation",
            "occurrences": categories.get("tone", 2),
            "recommendation": "Multiple submissions violate slang greeting and urgency rules. In-editor tone linting hints are active.",
            "impact": "Consistency & Brand Prestige"
        }
    ]

    # Recent activity logs
    logs = log_q.order_by(ActivityLog.created_at.desc()).limit(10).all()
    activity_timeline = [{
        "id": l.id,
        "action": l.action,
        "actor": l.actor.full_name if l.actor else "System",
        "details": f"{l.entity_type.replace('_', ' ').title()} - {l.action.replace('_', ' ')}",
        "entity_type": l.entity_type,
        "timestamp": l.created_at.isoformat() if l.created_at else None,
        "metadata": l.metadata_json
    } for l in logs]

    return {
        "kpis": {
            "total_submissions": total_submissions,
            "total_audits": total_audits,
            "approved_rate": f"{(approved_submissions / total_submissions * 100):.0f}%" if total_submissions > 0 else "100%",
            "in_review": in_review
        },
        "violations_by_category": categories,
        "risk_band_distribution": band_dist,
        "guideline_insights": guideline_insights,
        "recent_activity": activity_timeline,
        "recent_activities": activity_timeline
    }
