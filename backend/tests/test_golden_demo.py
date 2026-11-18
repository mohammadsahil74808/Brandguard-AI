import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.db.database import SessionLocal, init_db
from app.db.models import ContentSubmission, RevisionHistory, AuditResult, Violation, ClaimVerification
from app.services.audit_service import run_audit

def test_golden_demo_audit_and_correction_flow():
    init_db()
    db = SessionLocal()

    # 1. Fetch the seeded sample submission
    sub = db.query(ContentSubmission).filter(ContentSubmission.id == "90000000-0000-0000-0000-000000000001").first()
    assert sub is not None, "Seeded submission must exist"

    rev = db.query(RevisionHistory).filter(RevisionHistory.submission_id == sub.id, RevisionHistory.revision_no == 1).first()
    assert rev is not None, "Initial revision must exist"

    # 2. Run initial audit
    audit = run_audit(db, submission_id=sub.id, revision_id=rev.id, run_ai=True)
    assert audit.status == "completed"

    result = db.query(AuditResult).filter(AuditResult.audit_id == audit.id).first()
    assert result is not None

    # Expected: CRITICAL band (Points >= 25)
    print(f"Initial Audit Risk Band: {result.risk_band}, Points: {result.points}")
    assert result.risk_band == "CRITICAL", f"Expected CRITICAL but got {result.risk_band}"
    assert result.points >= 25, f"Expected points >= 25 but got {result.points}"

    # Verify all 5 seeded violations exist
    violations = db.query(Violation).filter(Violation.audit_id == audit.id).all()
    violation_texts = [v.submitted_text.lower() for v in violations]
    assert any("₹999" in t for t in violation_texts), "Outdated price violation missing"
    assert any("40-hour" in t or "40" in t for t in violation_texts), "Contradicted battery spec violation missing"
    assert any("world's best" in t for t in violation_texts), "Unsupported superlative violation missing"
    assert any("cheapest" in t for t in violation_texts), "Prohibited term violation missing"
    assert any("hey guys" in t for t in violation_texts), "Tone slang violation missing"

    # Verify claims
    claims = db.query(ClaimVerification).filter(ClaimVerification.audit_id == audit.id).all()
    claim_statuses = {c.claim_type: c.status for c in claims}
    assert claim_statuses.get("price") == "outdated", f"Price claim status should be outdated, got {claim_statuses.get('price')}"
    assert claim_statuses.get("spec") == "contradicted", f"Spec claim status should be contradicted, got {claim_statuses.get('spec')}"
    assert claim_statuses.get("superlative") == "unsupported", f"Superlative status should be unsupported, got {claim_statuses.get('superlative')}"

    # 3. Creator applies fixes in Correction Studio -> Revision 2
    corrected_text = "Experience the new Acme Buds Pro for just ₹799 – the affordable and critically acclaimed earbuds with 30-hour battery! #AcmeAudio"
    rev2 = RevisionHistory(
        id="90000000-0000-0000-0000-000000000099",
        org_id=sub.org_id,
        submission_id=sub.id,
        revision_no=2,
        body_text=corrected_text,
        content_hash="mock_hash_rev2",
        change_summary="Accepted price, battery, and terminology corrections",
        created_by=sub.created_by
    )
    # Check if rev2 already exists
    existing_rev2 = db.query(RevisionHistory).filter(RevisionHistory.id == rev2.id).first()
    if not existing_rev2:
        db.add(rev2)
        db.commit()

    # 4. Re-audit Revision 2
    audit2 = run_audit(db, submission_id=sub.id, revision_id=rev2.id, run_ai=True)
    result2 = db.query(AuditResult).filter(AuditResult.audit_id == audit2.id).first()
    print(f"Re-Audit Risk Band: {result2.risk_band}, Points: {result2.points}")

    # Expected: LOW band (Points <= 3, clean claims)
    assert result2.risk_band == "LOW", f"Expected LOW risk band after corrections but got {result2.risk_band}"
    assert result2.points <= 3, f"Expected points <= 3 but got {result2.points}"

    db.close()
    print("ALL GOLDEN DEMO TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_golden_demo_audit_and_correction_flow()
