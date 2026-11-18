from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, OrgMember, Organization, Role

router = APIRouter()

# Default session user ID (defaults to Rohan - Content Creator for Acme Audio)
CURRENT_USER_ID = "20000000-0000-0000-0000-000000000003"

@router.get("/workspaces")
def list_workspaces(db: Session = Depends(get_db)):
    """List available workspaces (Acme Audio production and NOVA TECH interactive demo)."""
    orgs = db.query(Organization).all()
    results = []
    for org in orgs:
        is_demo = (org.slug == "nova-tech")
        results.append({
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "industry": org.industry,
            "is_demo": is_demo,
            "tagline": "Fictional Demo Workspace for Hackathon Judges" if is_demo else "Corporate Audio Production Workspace",
            "created_at": org.created_at.isoformat() if org.created_at else None
        })
    return results

@router.get("/me")
def get_current_user_profile(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    target_id = user_id or CURRENT_USER_ID
    member = db.query(OrgMember).filter(OrgMember.user_id == target_id).first()
    if not member:
        member = db.query(OrgMember).first()
        if not member:
            raise HTTPException(status_code=404, detail="No users found in database")

    org = db.query(Organization).filter(Organization.id == member.org_id).first()

    return {
        "user": {
            "id": member.user.id,
            "email": member.user.email,
            "full_name": member.user.full_name,
            "avatar_url": member.user.avatar_url
        },
        "org": {
            "id": member.org_id,
            "name": org.name if org else "Acme Audio",
            "slug": org.slug if org else "acme-audio",
            "is_demo": (org.slug == "nova-tech") if org else False
        },
        "role": {
            "key": member.role.key,
            "label": member.role.label
        },
        "team": member.team
    }

@router.get("/personas")
def list_demo_personas(org_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(OrgMember)
    if org_id:
        query = query.filter(OrgMember.org_id == org_id)

    members = query.all()
    personas = []
    for m in members:
        org = db.query(Organization).filter(Organization.id == m.org_id).first()
        personas.append({
            "id": m.user.id,
            "email": m.user.email,
            "full_name": m.user.full_name,
            "role_key": m.role.key,
            "role_label": m.role.label,
            "team": m.team,
            "org_id": m.org_id,
            "org_name": org.name if org else "Unknown",
            "is_demo": (org.slug == "nova-tech") if org else False
        })
    return personas
