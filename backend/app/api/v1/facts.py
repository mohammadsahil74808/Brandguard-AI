import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ApprovedFact, Terminology, ToneProfile

router = APIRouter()

class FactCreate(BaseModel):
    fact_key: str
    entity: str
    attribute: str
    value_text: str
    value_numeric: Optional[float] = None
    currency: Optional[str] = None
    source_section: Optional[str] = None
    valid_from: str
    valid_to: Optional[str] = None
    status: str = "approved"
    org_id: Optional[str] = None

class TerminologyCreate(BaseModel):
    term: str
    kind: str # approved, prohibited, preferred
    replacement: Optional[str] = None
    context_note: Optional[str] = None
    severity: str = "medium"
    org_id: Optional[str] = None

@router.get("/")
def list_facts(org_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ApprovedFact)
    if org_id:
        query = query.filter(ApprovedFact.org_id == org_id)
    facts = query.all()
    return [{
        "id": f.id,
        "fact_key": f.fact_key,
        "entity": f.entity,
        "attribute": f.attribute,
        "value_text": f.value_text,
        "value_numeric": f.value_numeric,
        "currency": f.currency,
        "source_section": f.source_section,
        "valid_from": f.valid_from,
        "valid_to": f.valid_to,
        "status": f.status,
        "org_id": f.org_id
    } for f in facts]

@router.post("/")
def create_fact(payload: FactCreate, db: Session = Depends(get_db)):
    org_id = payload.org_id or "00000000-0000-0000-0000-000000000001"
    fact = ApprovedFact(
        id=str(uuid.uuid4()),
        org_id=org_id,
        fact_key=payload.fact_key,
        entity=payload.entity,
        attribute=payload.attribute,
        value_text=payload.value_text,
        value_numeric=payload.value_numeric,
        currency=payload.currency,
        source_section=payload.source_section,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        status=payload.status
    )
    db.add(fact)
    db.commit()
    db.refresh(fact)
    return fact

@router.get("/terminology")
def list_terminology(org_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Terminology)
    if org_id:
        query = query.filter(Terminology.org_id == org_id)
    terms = query.all()
    return [{
        "id": t.id,
        "term": t.term,
        "kind": t.kind,
        "replacement": t.replacement,
        "context_note": t.context_note,
        "severity": t.severity,
        "status": t.status,
        "org_id": t.org_id
    } for t in terms]

@router.post("/terminology")
def create_terminology(payload: TerminologyCreate, db: Session = Depends(get_db)):
    org_id = payload.org_id or "00000000-0000-0000-0000-000000000001"
    term = Terminology(
        id=str(uuid.uuid4()),
        org_id=org_id,
        term=payload.term,
        kind=payload.kind,
        replacement=payload.replacement,
        context_note=payload.context_note,
        severity=payload.severity,
        status="approved"
    )
    db.add(term)
    db.commit()
    db.refresh(term)
    return term

@router.get("/tone")
def get_tone_profile(org_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ToneProfile)
    if org_id:
        query = query.filter(ToneProfile.org_id == org_id)
    tone = query.first()
    if not tone:
        return {"name": "Default", "descriptors": [], "do_examples": [], "dont_examples": []}
    return {
        "id": tone.id,
        "org_id": tone.org_id,
        "name": tone.name,
        "descriptors": tone.descriptors,
        "do_examples": tone.do_examples,
        "dont_examples": tone.dont_examples,
        "formality": tone.formality,
        "channel": tone.channel
    }
