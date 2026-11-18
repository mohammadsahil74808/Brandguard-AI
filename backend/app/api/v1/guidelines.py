import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Guideline, GuidelineVersion, GuidelineChunk
import fitz # PyMuPDF
import docx

router = APIRouter()

@router.get("/")
def list_guidelines(org_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Guideline)
    if org_id:
        query = query.filter(Guideline.org_id == org_id)
    guidelines = query.all()
    results = []
    for g in guidelines:
        versions = db.query(GuidelineVersion).filter(GuidelineVersion.guideline_id == g.id).all()
        chunks = db.query(GuidelineChunk).filter(GuidelineChunk.org_id == g.org_id).count()
        results.append({
            "id": g.id,
            "org_id": g.org_id,
            "title": g.title,
            "category": g.category,
            "department": g.department,
            "status": g.status,
            "agency_visible": g.agency_visible,
            "versions_count": len(versions),
            "chunks_count": chunks,
            "created_at": g.created_at.isoformat() if g.created_at else None
        })
    return results

@router.get("/{guideline_id}/chunks")
def list_guideline_chunks(guideline_id: str, db: Session = Depends(get_db)):
    version = db.query(GuidelineVersion).filter(GuidelineVersion.guideline_id == guideline_id).order_by(GuidelineVersion.version_no.desc()).first()
    if not version:
        return []
    chunks = db.query(GuidelineChunk).filter(GuidelineChunk.version_id == version.id).order_by(GuidelineChunk.chunk_index).all()
    return [{
        "id": c.id,
        "section_path": c.section_path,
        "page_start": c.page_start,
        "chunk_index": c.chunk_index,
        "content": c.content
    } for c in chunks]

@router.post("/upload")
async def upload_guideline(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("General"),
    department: str = Form("Marketing"),
    org_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    target_org_id = org_id or "00000000-0000-0000-0000-000000000001"
    content_bytes = await file.read()
    filename = file.filename.lower()

    extracted_sections = []
    page_count = 1

    if filename.endswith(".pdf"):
        doc = fitz.open(stream=content_bytes, filetype="pdf")
        page_count = len(doc)
        for page_num in range(page_count):
            page = doc[page_num]
            text = page.get_text()
            if text.strip():
                extracted_sections.append({
                    "section_path": f"{title} > Page {page_num+1}",
                    "page_start": page_num + 1,
                    "content": text.strip()
                })
        doc.close()
    elif filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content_bytes))
        full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        extracted_sections.append({
            "section_path": f"{title} > Full Document",
            "page_start": 1,
            "content": full_text
        })
    elif filename.endswith(".txt") or filename.endswith(".md"):
        text = content_bytes.decode("utf-8", errors="ignore")
        extracted_sections.append({
            "section_path": f"{title} > Content",
            "page_start": 1,
            "content": text
        })
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, TXT, or MD.")

    if not extracted_sections:
        raise HTTPException(status_code=400, detail="Could not extract text from document")

    g_id = str(uuid.uuid4())
    gv_id = str(uuid.uuid4())

    guideline = Guideline(
        id=g_id,
        org_id=target_org_id,
        title=title,
        category=category,
        department=department,
        status="approved"
    )
    db.add(guideline)

    version = GuidelineVersion(
        id=gv_id,
        org_id=target_org_id,
        guideline_id=g_id,
        version_no=1,
        page_count=page_count,
        status="ready"
    )
    db.add(version)

    for idx, sec in enumerate(extracted_sections):
        chunk = GuidelineChunk(
            id=str(uuid.uuid4()),
            org_id=target_org_id,
            version_id=gv_id,
            section_path=sec["section_path"],
            page_start=sec["page_start"],
            chunk_index=idx,
            content=sec["content"]
        )
        db.add(chunk)

    db.commit()
    db.refresh(guideline)

    return {
        "id": guideline.id,
        "title": guideline.title,
        "sections_parsed": len(extracted_sections),
        "status": guideline.status
    }
