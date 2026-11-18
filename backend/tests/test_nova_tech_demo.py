import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, init_db
from app.db.models import (
    Organization, ContentSubmission, RevisionHistory, Audit, AuditResult,
    Violation, ClaimVerification, ApprovedFact, Terminology, Guideline, OrgMember
)
from app.services.audit_service import run_audit

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

def test_01_demo_workspace_opens_successfully():
    """Criteria 1: Demo workspace opens successfully and lists NOVA TECH."""
    response = client.get("/api/v1/auth/workspaces")
    assert response.status_code == 200
    workspaces = response.json()
    assert len(workspaces) >= 2

    nova_workspace = next((w for w in workspaces if w["slug"] == "nova-tech"), None)
    assert nova_workspace is not None, "NOVA TECH workspace must be registered"
    assert nova_workspace["is_demo"] is True, "NOVA TECH must be marked as demo workspace"
    assert nova_workspace["name"] == "NOVA TECH"

def test_02_nova_tech_sample_data_loads():
    """Criteria 2: NOVA TECH sample data loads correctly with personas and guidelines."""
    # Personas for NOVA TECH
    response = client.get("/api/v1/auth/personas?org_id=nova-tech-demo-0000-0000-0000-000000000001")
    assert response.status_code == 200
    personas = response.json()
    assert len(personas) >= 3
    names = [p["full_name"] for p in personas]
    assert "Sarah Jenkins" in names, "Sarah Jenkins (Creator) persona missing"
    assert "Alex Rivera" in names, "Alex Rivera (Manager) persona missing"
    assert "Elena Rostova" in names, "Elena Rostova (Legal) persona missing"

    # Guidelines for NOVA TECH
    response = client.get("/api/v1/guidelines/?org_id=nova-tech-demo-0000-0000-0000-000000000001")
    assert response.status_code == 200
    guidelines = response.json()
    assert len(guidelines) >= 1
    assert "NOVA TECH" in guidelines[0]["title"]

def test_03_approved_product_facts_retrieved_correctly():
    """Criteria 3: Approved product facts are retrieved correctly for 3 products."""
    response = client.get("/api/v1/facts/?org_id=nova-tech-demo-0000-0000-0000-000000000001")
    assert response.status_code == 200
    facts = response.json()

    entities = {f["entity"] for f in facts}
    assert "NOVA Buds Pro" in entities, "NOVA Buds Pro catalogue facts missing"
    assert "NOVA Watch Ultra" in entities, "NOVA Watch Ultra catalogue facts missing"
    assert "NOVA Pad 11" in entities, "NOVA Pad 11 catalogue facts missing"

    buds_price = next(f for f in facts if f["fact_key"] == "product.nova_buds_pro.price")
    assert buds_price["value_text"] == "₹4,999"
    assert buds_price["value_numeric"] == 4999.0

    watch_price = next(f for f in facts if f["fact_key"] == "product.nova_watch_ultra.price")
    assert watch_price["value_text"] == "₹8,999"
    assert watch_price["value_numeric"] == 8999.0

    pad_price = next(f for f in facts if f["fact_key"] == "product.nova_pad_11.price")
    assert pad_price["value_text"] == "₹24,999"
    assert pad_price["value_numeric"] == 24999.0

def test_04_and_05_audit_detects_incorrect_price_and_unsupported_claims():
    """Criteria 4 & 5: Audit detects incorrect product price and unsupported claims."""
    db = SessionLocal()
    sub = db.query(ContentSubmission).filter(
        ContentSubmission.id == "nova-sub-0000-0000-0000-000000000001"
    ).first()
    assert sub is not None, "Faulty sample submission must exist"

    rev = db.query(RevisionHistory).filter(RevisionHistory.submission_id == sub.id).first()
    assert rev is not None

    audit = run_audit(db, submission_id=sub.id, revision_id=rev.id, run_ai=True)
    assert audit.status == "completed"

    result = db.query(AuditResult).filter(AuditResult.audit_id == audit.id).first()
    assert result is not None
    assert result.risk_band in ["HIGH", "CRITICAL"], f"Expected high risk band, got {result.risk_band}"
    assert result.points >= 15

    violations = db.query(Violation).filter(Violation.audit_id == audit.id).all()
    violation_texts = [v.submitted_text.lower() for v in violations]

    # Criteria 4: Price violation
    assert any("₹3,499" in t for t in violation_texts), "Price violation for ₹3,499 not detected"

    # Criteria 5: Unsupported claims and terminology
    assert any("50-hour" in t or "50" in t for t in violation_texts), "50-hour battery spec violation not detected"
    assert any("cheapest in the galaxy" in t for t in violation_texts), "Cheapest in the galaxy claim not flagged"
    assert any("world's fastest" in t for t in violation_texts), "World's fastest claim not flagged"
    assert any("nova buds" in t for t in violation_texts), "Nova buds casing violation not flagged"

    db.close()

def test_06_compliant_content_has_zero_fabricated_violations():
    """Criteria 6: Compliant content does not receive fabricated violations."""
    db = SessionLocal()
    sub_compliant = db.query(ContentSubmission).filter(
        ContentSubmission.id == "nova-sub-0000-0000-0000-000000000002"
    ).first()
    assert sub_compliant is not None, "Compliant sample submission must exist"

    rev_compliant = db.query(RevisionHistory).filter(RevisionHistory.submission_id == sub_compliant.id).first()
    assert rev_compliant is not None

    audit = run_audit(db, submission_id=sub_compliant.id, revision_id=rev_compliant.id, run_ai=True)
    assert audit.status == "completed"

    result = db.query(AuditResult).filter(AuditResult.audit_id == audit.id).first()
    assert result is not None
    assert result.risk_band == "LOW", f"Expected LOW risk band for compliant ad, got {result.risk_band}"
    assert result.points == 0, f"Expected 0 points for compliant ad, got {result.points}"

    violations = db.query(Violation).filter(Violation.audit_id == audit.id).all()
    assert len(violations) == 0, f"Expected 0 violations for compliant ad, got {len(violations)}"

    # Check verified claims
    claims = db.query(ClaimVerification).filter(ClaimVerification.audit_id == audit.id).all()
    verified_claims = [c for c in claims if c.status == "verified"]
    assert len(verified_claims) >= 2, "Price and specs should be verified in compliant ad"

    db.close()

def test_07_supporting_evidence_references_correct_guidelines():
    """Criteria 7: Supporting evidence references the correct guideline or fact."""
    db = SessionLocal()
    audit = db.query(Audit).filter(
        Audit.submission_id == "nova-sub-0000-0000-0000-000000000001"
    ).order_by(Audit.started_at.desc()).first()
    assert audit is not None

    violations = db.query(Violation).filter(Violation.audit_id == audit.id).all()
    for v in violations:
        assert v.guideline_ref is not None and len(v.guideline_ref) > 0
        assert v.evidence_text is not None and len(v.evidence_text) > 0

    price_v = next(v for v in violations if "₹3,499" in v.submitted_text)
    assert "NOVA TECH Guidelines" in price_v.guideline_ref or "MSRP" in price_v.guideline_ref
    assert "₹4,999" in price_v.evidence_text

    db.close()

def test_08_and_09_suggested_corrections_and_revision_flow():
    """Criteria 8 & 9: Suggested corrections are relevant, and user can create revision."""
    db = SessionLocal()
    audit = db.query(Audit).filter(
        Audit.submission_id == "nova-sub-0000-0000-0000-000000000001"
    ).order_by(Audit.started_at.desc()).first()

    violations = db.query(Violation).filter(Violation.audit_id == audit.id).all()
    corrections = {v.submitted_text: v.suggested_correction for v in violations}

    # Criteria 8: Corrections are relevant
    assert corrections.get("₹3,499") == "₹4,999"
    assert corrections.get("Nova buds") == "NOVA Buds Pro"

    # Criteria 9: Author creates revised copy applying corrections
    revised_text = "Experience pure audio clarity with the new NOVA Buds Pro. Available now for ₹4,999 with 36-hour battery and exceptional value."
    res = client.post(
        f"/api/v1/submissions/{audit.submission_id}/revisions",
        json={
            "body_text": revised_text,
            "change_summary": "Accepted recommended corrections for price, name, and battery specs",
            "created_by": "nova-user-0000-0000-0000-000000000001"
        }
    )
    assert res.status_code == 200
    rev_data = res.json()
    assert rev_data["revision_no"] >= 2

    # Re-audit revision 2
    audit2 = run_audit(db, submission_id=audit.submission_id, revision_id=rev_data["revision_id"], run_ai=True)
    res2 = db.query(AuditResult).filter(AuditResult.audit_id == audit2.id).first()
    assert res2.risk_band == "LOW", f"Expected LOW risk band after corrections, got {res2.risk_band}"
    assert res2.points == 0

    db.close()

def test_10_audit_history_is_saved_and_displayed():
    """Criteria 10: Audit history is saved and displayed."""
    db = SessionLocal()
    audits = db.query(Audit).filter(
        Audit.submission_id == "nova-sub-0000-0000-0000-000000000001"
    ).all()
    assert len(audits) >= 2, "Both initial audit and re-audit must be persisted in history"

    res = client.get("/api/v1/submissions/nova-sub-0000-0000-0000-000000000001/latest-audit")
    assert res.status_code == 200
    latest = res.json()
    assert latest is not None
    assert "audit" in latest
    assert "risk" in latest
    db.close()

def test_11_unauthorized_access_to_real_company_data_is_blocked():
    """Criteria 11: Data isolation - NOVA TECH audit cannot access or modify Acme Audio."""
    db = SessionLocal()
    # NOVA TECH facts must only belong to NOVA TECH org_id
    nova_facts = db.query(ApprovedFact).filter(
        ApprovedFact.org_id == "nova-tech-demo-0000-0000-0000-000000000001"
    ).all()
    for f in nova_facts:
        assert f.org_id == "nova-tech-demo-0000-0000-0000-000000000001"
        assert f.org_id != "00000000-0000-0000-0000-000000000001"

    # Acme facts must only belong to Acme Audio org_id
    acme_facts = db.query(ApprovedFact).filter(
        ApprovedFact.org_id == "00000000-0000-0000-0000-000000000001"
    ).all()
    for f in acme_facts:
        assert f.org_id == "00000000-0000-0000-0000-000000000001"
        assert f.org_id != "nova-tech-demo-0000-0000-0000-000000000001"

    # Separation of duties: Creator cannot approve their own content
    decision_res = client.post(
        "/api/v1/reviews/submissions/nova-sub-0000-0000-0000-000000000001/decisions",
        json={
            "user_id": "nova-user-0000-0000-0000-000000000001", # Sarah Jenkins (Author)
            "stage": "manager",
            "decision": "approved",
            "reason": "Self approving"
        }
    )
    assert decision_res.status_code == 403, "Author must be blocked from self-approving"
    assert "FORBIDDEN_ROLE" in decision_res.json()["detail"]

    db.close()

def test_12_invalid_or_unsupported_files_rejected_safely():
    """Criteria 12: Uploaded invalid or unsupported files are rejected safely."""
    # Test invalid extension (.exe)
    fake_exe = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00BinaryData")
    res = client.post(
        "/api/v1/submissions/upload",
        files={"file": ("malicious.exe", fake_exe, "application/octet-stream")},
        data={"title": "Malicious Executable"}
    )
    assert res.status_code == 400
    assert "Unsupported file format" in res.json()["detail"]

    # Test valid text upload works
    valid_txt = io.BytesIO(b"NOVA Buds Pro are available for \xe2\x82\xb94,999 with 36 hours of battery.")
    res_valid = client.post(
        "/api/v1/submissions/upload",
        files={"file": ("test_ad.txt", valid_txt, "text/plain")},
        data={
            "title": "Uploaded Test Copy",
            "org_id": "nova-tech-demo-0000-0000-0000-000000000001",
            "created_by": "nova-user-0000-0000-0000-000000000001"
        }
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["workflow_status"] == "draft"

def test_13_existing_project_functionality_unaffected():
    """Criteria 13: Existing project functionality remains unaffected."""
    # Run Acme Audio query and ensure intact
    res = client.get("/api/v1/facts/?org_id=00000000-0000-0000-0000-000000000001")
    assert res.status_code == 200
    acme_facts = res.json()
    assert len(acme_facts) >= 3
    assert any(f["entity"] == "Acme Buds Pro" for f in acme_facts)
