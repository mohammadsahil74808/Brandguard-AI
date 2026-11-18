import io
import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ContentSubmission, RevisionHistory, User, OrgMember, ActivityLog
import fitz # PyMuPDF
import docx

router = APIRouter()

class SubmissionCreate(BaseModel):
    title: str
    body_text: str
    content_type: str = "caption"
    channel: str = "instagram"
    campaign: Optional[str] = "General"
    created_by: Optional[str] = "20000000-0000-0000-0000-000000000003"
    org_id: Optional[str] = None

class RevisionCreate(BaseModel):
    body_text: str
    change_summary: str = "Updated copy via Correction Studio"
    created_by: Optional[str] = "20000000-0000-0000-0000-000000000003"

@router.get("/")
def list_submissions(org_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ContentSubmission)
    if org_id:
        query = query.filter(ContentSubmission.org_id == org_id)

    submissions = query.order_by(ContentSubmission.created_at.desc()).all()
    results = []
    for s in submissions:
        latest_rev = db.query(RevisionHistory).filter(RevisionHistory.submission_id == s.id).order_by(RevisionHistory.revision_no.desc()).first()
        creator = db.query(User).filter(User.id == s.created_by).first()
        results.append({
            "id": s.id,
            "org_id": s.org_id,
            "title": s.title,
            "content_type": s.content_type,
            "channel": s.channel,
            "campaign": s.campaign,
            "workflow_status": s.workflow_status,
            "current_band": s.current_band,
            "creator_name": creator.full_name if creator else "Unknown",
            "body_snippet": latest_rev.body_text[:120] if latest_rev else "",
            "revision_no": latest_rev.revision_no if latest_rev else 1,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return results

@router.post("/")
def create_submission(payload: SubmissionCreate, db: Session = Depends(get_db)):
    target_org_id = payload.org_id
    if not target_org_id and payload.created_by:
        member = db.query(OrgMember).filter(OrgMember.user_id == payload.created_by).first()
        if member:
            target_org_id = member.org_id
    if not target_org_id:
        target_org_id = "00000000-0000-0000-0000-000000000001"

    sub_id = str(uuid.uuid4())
    rev_id = str(uuid.uuid4())
    content_hash = hashlib.sha256(payload.body_text.encode("utf-8")).hexdigest()

    submission = ContentSubmission(
        id=sub_id,
        org_id=target_org_id,
        title=payload.title,
        content_type=payload.content_type,
        channel=payload.channel,
        campaign=payload.campaign,
        created_by=payload.created_by,
        workflow_status="draft",
        current_band="PENDING"
    )
    db.add(submission)

    revision = RevisionHistory(
        id=rev_id,
        org_id=target_org_id,
        submission_id=sub_id,
        revision_no=1,
        body_text=payload.body_text,
        content_hash=content_hash,
        change_summary="Initial copy created",
        created_by=payload.created_by
    )
    db.add(revision)

    db.add(ActivityLog(
        org_id=target_org_id,
        actor_id=payload.created_by,
        action="SUBMISSION_CREATED",
        entity_type="submission",
        entity_id=sub_id,
        metadata_json={"title": payload.title}
    ))

    db.commit()
    db.refresh(submission)
    return {
        "id": submission.id,
        "org_id": submission.org_id,
        "title": submission.title,
        "workflow_status": submission.workflow_status,
        "revision_id": rev_id
    }

@router.post("/upload")
async def upload_content_submission(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    channel: str = Form("instagram"),
    campaign: str = Form("General"),
    created_by: Optional[str] = Form("nova-user-0000-0000-0000-000000000001"),
    org_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Secure document upload for Option B testing (.txt, .md, .pdf, .docx)."""
    # 1. Validate file extension
    filename = file.filename.lower()
    allowed_extensions = (".txt", ".md", ".pdf", ".docx")
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Allowed formats: .txt, .md, .pdf, .docx"
        )

    # 2. Read and validate file size (max 10MB)
    content_bytes = await file.read()
    if len(content_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum allowed limit (10MB)"
        )
    if len(content_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    # 3. Extract text
    extracted_text = ""
    try:
        if filename.endswith(".pdf"):
            doc = fitz.open(stream=content_bytes, filetype="pdf")
            extracted_text = "\n\n".join([page.get_text() for page in doc if page.get_text().strip()])
            doc.close()
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content_bytes))
            extracted_text = "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        elif filename.endswith(".txt") or filename.endswith(".md"):
            extracted_text = content_bytes.decode("utf-8", errors="ignore").strip()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process document content: {str(e)}"
        )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Document contained no readable text"
        )

    # 4. Determine Org ID
    target_org_id = org_id
    if not target_org_id and created_by:
        member = db.query(OrgMember).filter(OrgMember.user_id == created_by).first()
        if member:
            target_org_id = member.org_id
    if not target_org_id:
        target_org_id = "nova-tech-demo-0000-0000-0000-000000000001"

    sub_title = title or f"Uploaded File: {file.filename}"
    sub_id = str(uuid.uuid4())
    rev_id = str(uuid.uuid4())
    content_hash = hashlib.sha256(extracted_text.encode("utf-8")).hexdigest()

    submission = ContentSubmission(
        id=sub_id,
        org_id=target_org_id,
        title=sub_title,
        content_type="document_upload",
        channel=channel,
        campaign=campaign,
        created_by=created_by,
        workflow_status="draft",
        current_band="PENDING"
    )
    db.add(submission)

    revision = RevisionHistory(
        id=rev_id,
        org_id=target_org_id,
        submission_id=sub_id,
        revision_no=1,
        body_text=extracted_text,
        content_hash=content_hash,
        change_summary=f"Extracted from uploaded document '{file.filename}'",
        created_by=created_by
    )
    db.add(revision)

    db.add(ActivityLog(
        org_id=target_org_id,
        actor_id=created_by,
        action="DOCUMENT_UPLOADED",
        entity_type="submission",
        entity_id=sub_id,
        metadata_json={"filename": file.filename, "size_bytes": len(content_bytes)}
    ))

    db.commit()
    db.refresh(submission)

    return {
        "id": submission.id,
        "org_id": submission.org_id,
        "title": submission.title,
        "extracted_snippet": extracted_text[:160],
        "workflow_status": submission.workflow_status,
        "revision_id": rev_id
    }

@router.get("/{submission_id}")
def get_submission_detail(submission_id: str, db: Session = Depends(get_db)):
    sub = db.query(ContentSubmission).filter(ContentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    revisions = db.query(RevisionHistory).filter(RevisionHistory.submission_id == sub.id).order_by(RevisionHistory.revision_no.desc()).all()
    creator = db.query(User).filter(User.id == sub.created_by).first()

    return {
        "id": sub.id,
        "org_id": sub.org_id,
        "title": sub.title,
        "content_type": sub.content_type,
        "channel": sub.channel,
        "campaign": sub.campaign,
        "workflow_status": sub.workflow_status,
        "current_band": sub.current_band,
        "created_by": sub.created_by,
        "creator_name": creator.full_name if creator else "Unknown",
        "created_at": sub.created_at.isoformat() if sub.created_at else None,
        "latest_revision": {
            "id": revisions[0].id if revisions else None,
            "revision_no": revisions[0].revision_no if revisions else 1,
            "body_text": revisions[0].body_text if revisions else "",
            "content_hash": revisions[0].content_hash if revisions else "",
            "change_summary": revisions[0].change_summary if revisions else ""
        },
        "revisions_count": len(revisions)
    }

@router.post("/{submission_id}/revisions")
def create_new_revision(submission_id: str, payload: RevisionCreate, db: Session = Depends(get_db)):
    sub = db.query(ContentSubmission).filter(ContentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    latest_rev = db.query(RevisionHistory).filter(RevisionHistory.submission_id == sub.id).order_by(RevisionHistory.revision_no.desc()).first()
    next_no = (latest_rev.revision_no + 1) if latest_rev else 1

    rev_id = str(uuid.uuid4())
    content_hash = hashlib.sha256(payload.body_text.encode("utf-8")).hexdigest()

    new_rev = RevisionHistory(
        id=rev_id,
        org_id=sub.org_id,
        submission_id=sub.id,
        revision_no=next_no,
        body_text=payload.body_text,
        content_hash=content_hash,
        change_summary=payload.change_summary,
        created_by=payload.created_by or sub.created_by
    )
    db.add(new_rev)

    # Invalidate previous approvals and reset status to revision (PRD Section 11.1)
    sub.workflow_status = "revision"
    db.commit()
    db.refresh(new_rev)

    return {
        "revision_id": new_rev.id,
        "revision_no": new_rev.revision_no,
        "body_text": new_rev.body_text,
        "workflow_status": sub.workflow_status
    }
