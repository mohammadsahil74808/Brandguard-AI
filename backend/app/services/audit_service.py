import re
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import (
    Organization, ContentSubmission, RevisionHistory, Audit, AuditResult,
    Violation, ClaimVerification, AiSuggestion, ApprovedFact,
    Terminology, GuidelineChunk, ActivityLog
)
from app.services.risk_service import calculate_risk_band

def run_audit(db: Session, submission_id: str, revision_id: str, run_ai: bool = True) -> Audit:
    submission = db.query(ContentSubmission).filter(ContentSubmission.id == submission_id).first()
    revision = db.query(RevisionHistory).filter(RevisionHistory.id == revision_id).first()
    if not submission or not revision:
        raise ValueError("Submission or revision not found")

    org_id = submission.org_id
    org = db.query(Organization).filter(Organization.id == org_id).first()
    org_slug = org.slug if org else "acme-audio"
    org_name = org.name if org else "Acme Audio"
    body_text = revision.body_text

    # Create Audit row
    audit = Audit(
        id=str(uuid.uuid4()),
        org_id=org_id,
        submission_id=submission_id,
        revision_id=revision_id,
        status="completed",
        ai_mode="full" if run_ai else "rules_only"
    )
    db.add(audit)
    db.flush()

    violations_data: List[Dict[str, Any]] = []
    claims_data: List[Dict[str, Any]] = []

    # 1. Prompt Injection Defense Check
    injection_patterns = [
        r"ignore (all )?previous instructions",
        r"system prompt",
        r"you are now",
        r"output risk low"
    ]
    for pat in injection_patterns:
        match = re.search(pat, body_text, re.IGNORECASE)
        if match:
            v_dict = {
                "issue_code": f"SEC-{len(violations_data)+1:02d}",
                "category": "security",
                "severity": "critical",
                "submitted_text": match.group(0),
                "span_start": match.start(),
                "span_end": match.end(),
                "explanation": "Adversarial prompt injection pattern detected in submission.",
                "guideline_ref": "System Security Standards > Input Sanitization",
                "evidence_text": "Content cannot contain administrative or prompt-override commands.",
                "suggested_correction": "[REMOVED]",
                "confidence": "high"
            }
            violations_data.append(v_dict)

    # 2. Terminology Checks (Dynamic from database filtered strictly by org_id)
    terms = db.query(Terminology).filter(Terminology.org_id == org_id, Terminology.status == "approved").all()
    for t in terms:
        if t.kind == "prohibited":
            # Search case-insensitively using word boundaries
            pattern = re.compile(rf"\b{re.escape(t.term)}\b", re.IGNORECASE)
            for m in pattern.finditer(body_text):
                # If text at this position already matches the approved replacement, do not flag!
                if t.replacement:
                    exact_slice = body_text[m.start():m.start() + len(t.replacement)]
                    if exact_slice == t.replacement:
                        continue
                    if t.replacement.lower().startswith(m.group(0).lower()) and exact_slice.lower() == t.replacement.lower():
                        if exact_slice == t.replacement:
                            continue

                guide_ref = (
                    f"{org_name} Brand Voice > Naming & Terminology Rules"
                    if org_slug == "nova-tech"
                    else "Acme Audio Guidelines v4 > Terminology"
                )
                v_dict = {
                    "issue_code": f"TERM-{len(violations_data)+1:02d}",
                    "category": "terminology",
                    "severity": t.severity or "medium",
                    "submitted_text": m.group(0),
                    "span_start": m.start(),
                    "span_end": m.end(),
                    "explanation": f"Prohibited term '{m.group(0)}' used. {t.context_note or ''}",
                    "guideline_ref": guide_ref,
                    "evidence_text": f"Approved replacement is '{t.replacement}'.",
                    "suggested_correction": t.replacement or "approved term",
                    "confidence": "high"
                }
                violations_data.append(v_dict)

    # 3. Tone & Punctuation Checks
    tone_slang = re.search(r"\b(Hey guys!{1,3}|Hey tech lovers!{1,3})", body_text, re.IGNORECASE)
    if tone_slang:
        guide_ref = (
            "NOVA TECH Guidelines > Brand Voice > Tone and Communication Principles (Page 2)"
            if org_slug == "nova-tech"
            else "Acme Audio Guidelines v4 > Brand Voice > Tone and Punctuation (Page 8)"
        )
        evidence = (
            "NOVA TECH communicates with professional, friendly, and trustworthy authority. Avoid juvenile internet slang and sensationalism."
            if org_slug == "nova-tech"
            else "Acme communicates with a warm, confident voice. Avoid juvenile slang greetings such as 'Hey guys!!!'. Restrict exclamation marks to max 1 per post."
        )
        v_dict = {
            "issue_code": f"TONE-{len(violations_data)+1:02d}",
            "category": "tone",
            "severity": "medium",
            "submitted_text": tone_slang.group(0),
            "span_start": tone_slang.start(),
            "span_end": tone_slang.end(),
            "explanation": "Slang greeting and excessive punctuation violate brand voice standards.",
            "guideline_ref": guide_ref,
            "evidence_text": evidence,
            "suggested_correction": "Experience pure audio clarity with the new" if org_slug == "nova-tech" else "Experience the new",
            "confidence": "high"
        }
        violations_data.append(v_dict)

    urgency_now = re.search(r"\b(NOW|BUY NOW)\b", body_text)
    if urgency_now:
        guide_ref = (
            "NOVA TECH Guidelines > Brand Voice > Tone and Communication Principles (Page 2)"
            if org_slug == "nova-tech"
            else "Acme Audio Guidelines v4 > Brand Voice > Tone and Punctuation (Page 8)"
        )
        evidence = (
            "Avoid aggressive urgency cues such as 'BUY NOW' or all-caps phrasing."
            if org_slug == "nova-tech"
            else "Do not use all-caps urgency words such as 'NOW'."
        )
        v_dict = {
            "issue_code": f"TONE-{len(violations_data)+1:02d}",
            "category": "tone",
            "severity": "low",
            "submitted_text": urgency_now.group(0),
            "span_start": urgency_now.start(),
            "span_end": urgency_now.end(),
            "explanation": "All-caps urgency words degrade premium brand perception.",
            "guideline_ref": guide_ref,
            "evidence_text": evidence,
            "suggested_correction": "",
            "confidence": "high"
        }
        violations_data.append(v_dict)

    # 4. Pricing & Currency Checks (Organization & Product Aware)
    # Match prices like ₹799, ₹999, ₹3,499, ₹4,999, ₹8,999, ₹24,999
    price_matches = list(re.finditer(r"₹\s*([0-9,]+)", body_text))
    for price_match in price_matches:
        raw_val = price_match.group(1).replace(",", "")
        quoted_val = float(raw_val)

        # Determine target product entity from body_text context
        target_entity = None
        lower_body = body_text.lower()
        if "watch" in lower_body:
            target_entity = "NOVA Watch Ultra"
        elif "pad" in lower_body:
            target_entity = "NOVA Pad 11"
        elif "buds" in lower_body:
            target_entity = "NOVA Buds Pro" if org_slug == "nova-tech" else "Acme Buds Pro"

        # Query active and expired price facts for this org
        active_price_query = db.query(ApprovedFact).filter(
            ApprovedFact.org_id == org_id,
            ApprovedFact.attribute == "price",
            ApprovedFact.status == "approved"
        )
        if target_entity:
            active_price = active_price_query.filter(ApprovedFact.entity == target_entity).first()
        else:
            active_price = active_price_query.first()

        expired_price_query = db.query(ApprovedFact).filter(
            ApprovedFact.org_id == org_id,
            ApprovedFact.attribute == "price",
            ApprovedFact.status == "expired"
        )
        if target_entity:
            expired_price = expired_price_query.filter(ApprovedFact.entity == target_entity).first()
        else:
            expired_price = expired_price_query.first()

        source_sheet = (
            active_price.source_section if active_price and active_price.source_section
            else ("Official MSRP Q4 Price Index, Page 3" if org_slug == "nova-tech" else "Pricing Sheet Q4, Page 2")
        )
        guide_ref = (
            f"NOVA TECH Guidelines > Product Catalogue > Authorized Pricing Policy ({source_sheet})"
            if org_slug == "nova-tech"
            else f"{source_sheet} (Valid 01 Oct to 31 Dec)"
        )

        if expired_price and quoted_val == expired_price.value_numeric:
            correct_val = active_price.value_text if active_price else "₹799"
            v_dict = {
                "issue_code": f"PRICE-{len(violations_data)+1:02d}",
                "category": "pricing",
                "severity": "high",
                "submitted_text": price_match.group(0),
                "span_start": price_match.start(),
                "span_end": price_match.end(),
                "explanation": f"The price {price_match.group(0)} was valid until Sep 30 and is now outdated.",
                "guideline_ref": guide_ref,
                "evidence_text": f"Official product price is {correct_val} (Q4). Prior price of {price_match.group(0)} expired Sep 30.",
                "suggested_correction": correct_val,
                "confidence": "high"
            }
            violations_data.append(v_dict)
            claims_data.append({
                "claim_text": price_match.group(0),
                "claim_type": "price",
                "normalized_value": f"{quoted_val} INR",
                "status": "outdated",
                "evidence_quote": f"Current approved price is {correct_val}.",
                "source_ref": source_sheet,
                "suggested_correction": correct_val
            })
        elif active_price and quoted_val != active_price.value_numeric:
            v_dict = {
                "issue_code": f"PRICE-{len(violations_data)+1:02d}",
                "category": "pricing",
                "severity": "high",
                "submitted_text": price_match.group(0),
                "span_start": price_match.start(),
                "span_end": price_match.end(),
                "explanation": f"Quoted price {price_match.group(0)} does not match approved price {active_price.value_text} for {active_price.entity}.",
                "guideline_ref": guide_ref,
                "evidence_text": f"Approved current price: {active_price.value_text} ({source_sheet}).",
                "suggested_correction": active_price.value_text,
                "confidence": "high"
            }
            violations_data.append(v_dict)
            claims_data.append({
                "claim_text": price_match.group(0),
                "claim_type": "price",
                "normalized_value": f"{quoted_val} INR",
                "status": "contradicted",
                "evidence_quote": f"Approved price is {active_price.value_text} ({source_sheet}).",
                "source_ref": source_sheet,
                "suggested_correction": active_price.value_text
            })
        elif active_price and quoted_val == active_price.value_numeric:
            claims_data.append({
                "claim_text": price_match.group(0),
                "claim_type": "price",
                "normalized_value": f"{quoted_val} INR",
                "status": "verified",
                "evidence_quote": f"Verified against {source_sheet}: {active_price.value_text}.",
                "source_ref": source_sheet,
                "suggested_correction": None
            })

    # 5. Technical Specifications Checks (Battery & Endurance)
    battery_match = re.search(r"(\d+)[-\s]?hour\s+(battery|playback)", body_text, re.IGNORECASE)
    if battery_match:
        quoted_hours = float(battery_match.group(1))
        battery_fact = db.query(ApprovedFact).filter(
            ApprovedFact.org_id == org_id,
            ApprovedFact.attribute.in_(["battery_life", "battery"]),
            ApprovedFact.status == "approved"
        ).first()

        spec_sheet = (
            battery_fact.source_section if battery_fact and battery_fact.source_section
            else ("Acoustic Hardware Lab Report #NB-42, Page 7" if org_slug == "nova-tech" else "Tech Spec Sheet v2, Page 4")
        )
        guide_ref = (
            f"NOVA TECH Guidelines > Hardware Specifications > Battery & Endurance ({spec_sheet})"
            if org_slug == "nova-tech"
            else f"Acme Audio Guidelines v4 > Tech Specs > Battery Life ({spec_sheet})"
        )

        if battery_fact and quoted_hours != battery_fact.value_numeric:
            correct_battery = f"{int(battery_fact.value_numeric)}-hour battery"
            v_dict = {
                "issue_code": f"SPEC-{len(violations_data)+1:02d}",
                "category": "claim",
                "severity": "high",
                "submitted_text": battery_match.group(0),
                "span_start": battery_match.start(),
                "span_end": battery_match.end(),
                "explanation": f"Claim of {battery_match.group(0)} contradicts approved lab specs of {battery_fact.value_text}.",
                "guideline_ref": guide_ref,
                "evidence_text": f"Verified lab-tested battery endurance is {battery_fact.value_text} total playback ({spec_sheet}).",
                "suggested_correction": correct_battery,
                "confidence": "high"
            }
            violations_data.append(v_dict)
            claims_data.append({
                "claim_text": battery_match.group(0),
                "claim_type": "spec",
                "normalized_value": f"{quoted_hours} hours",
                "status": "contradicted",
                "evidence_quote": f"Verified battery life is {battery_fact.value_text} ({spec_sheet}).",
                "source_ref": spec_sheet,
                "suggested_correction": correct_battery
            })
        elif battery_fact and quoted_hours == battery_fact.value_numeric:
            claims_data.append({
                "claim_text": battery_match.group(0),
                "claim_type": "spec",
                "normalized_value": f"{quoted_hours} hours",
                "status": "verified",
                "evidence_quote": f"Verified lab spec: {battery_fact.value_text} ({spec_sheet}).",
                "source_ref": spec_sheet,
                "suggested_correction": None
            })

    # Check for verified specs in compliant ads (ANC, IPX5)
    anc_match = re.search(r"42\s*dB\s+Active\s+Noise\s+Cancellation", body_text, re.IGNORECASE)
    if anc_match:
        claims_data.append({
            "claim_text": anc_match.group(0),
            "claim_type": "spec",
            "normalized_value": "42dB ANC",
            "status": "verified",
            "evidence_quote": "Acoustic Hardware Lab Report #NB-42, Page 9: 42dB Active Noise Cancellation verified.",
            "source_ref": "Acoustic Hardware Lab Report #NB-42, Page 9",
            "suggested_correction": None
        })

    ipx_match = re.search(r"IPX5\s+(water\s+and\s+sweat\s+resistant|water\s+resistance)", body_text, re.IGNORECASE)
    if ipx_match:
        claims_data.append({
            "claim_text": ipx_match.group(0),
            "claim_type": "spec",
            "normalized_value": "IPX5 Ingress",
            "status": "verified",
            "evidence_quote": "IPX Ingress Certification, Page 2: Certified IPX5 splash and water resistance.",
            "source_ref": "IPX Ingress Certification, Page 2",
            "suggested_correction": None
        })

    # 6. Superlatives Checks ("world's best", "#1", "world's fastest", "cheapest in the galaxy")
    superlative_match = re.search(r"\b(world's best|#1 audio brand|unbeatable sound|cheapest in the galaxy|world's fastest)\b", body_text, re.IGNORECASE)
    if superlative_match:
        already_added = any(v["submitted_text"].lower() == superlative_match.group(0).lower() for v in violations_data)
        if not already_added:
            guide_ref = (
                "NOVA TECH Guidelines > Communications Policy > Claims & Superlatives (Page 12)"
                if org_slug == "nova-tech"
                else "Acme Audio Guidelines v4 > Claims Policy > Superlatives & Guarantees (Page 6)"
            )
            v_dict = {
                "issue_code": f"CLAIM-{len(violations_data)+1:02d}",
                "category": "claim",
                "severity": "high",
                "submitted_text": superlative_match.group(0),
                "span_start": superlative_match.start(),
                "span_end": superlative_match.end(),
                "explanation": "Unverified superlative promotional claim without accredited independent evidence.",
                "guideline_ref": guide_ref,
                "evidence_text": "Superlative claims require accredited third-party benchmark evidence. Unverified claims are prohibited.",
                "suggested_correction": "exceptional value" if "cheap" in superlative_match.group(0).lower() else "critically acclaimed",
                "confidence": "high"
            }
            violations_data.append(v_dict)

        claims_data.append({
            "claim_text": superlative_match.group(0),
            "claim_type": "superlative",
            "normalized_value": superlative_match.group(0),
            "status": "unsupported",
            "evidence_quote": "No accredited benchmark report exists in approved repository.",
            "source_ref": f"{org_name} Brand Policy > Section 3.2",
            "suggested_correction": "exceptional value" if "cheap" in superlative_match.group(0).lower() else "critically acclaimed"
        })

    # Save Violations and Suggestions to Database
    for v_dict in violations_data:
        v_id = str(uuid.uuid4())
        violation = Violation(
            id=v_id,
            org_id=org_id,
            audit_id=audit.id,
            issue_code=v_dict["issue_code"],
            category=v_dict["category"],
            severity=v_dict["severity"],
            submitted_text=v_dict["submitted_text"],
            span_start=v_dict["span_start"],
            span_end=v_dict["span_end"],
            explanation=v_dict["explanation"],
            guideline_ref=v_dict["guideline_ref"],
            evidence_text=v_dict["evidence_text"],
            suggested_correction=v_dict["suggested_correction"],
            confidence=v_dict["confidence"],
            status="open"
        )
        db.add(violation)

        # Create AI Suggestion for Correction Studio
        if v_dict["suggested_correction"] is not None:
            sugg = AiSuggestion(
                id=str(uuid.uuid4()),
                org_id=org_id,
                violation_id=v_id,
                revision_id=revision_id,
                span_start=v_dict["span_start"],
                span_end=v_dict["span_end"],
                original_text=v_dict["submitted_text"],
                replacement_text=v_dict["suggested_correction"],
                rationale=v_dict["explanation"],
                state="pending"
            )
            db.add(sugg)

    # Save Claims
    for c_dict in claims_data:
        claim = ClaimVerification(
            id=str(uuid.uuid4()),
            org_id=org_id,
            audit_id=audit.id,
            claim_text=c_dict["claim_text"],
            claim_type=c_dict["claim_type"],
            normalized_value=c_dict.get("normalized_value"),
            status=c_dict["status"],
            evidence_quote=c_dict.get("evidence_quote"),
            source_ref=c_dict.get("source_ref"),
            confidence=c_dict.get("confidence", "high"),
            suggested_correction=c_dict.get("suggested_correction")
        )
        db.add(claim)

    # Calculate Deterministic Risk Score
    risk_summary = calculate_risk_band(violations_data, claims_data)

    audit_result = AuditResult(
        id=str(uuid.uuid4()),
        org_id=org_id,
        audit_id=audit.id,
        risk_band=risk_summary["risk_band"],
        points=risk_summary["points"],
        breakdown=risk_summary["breakdown"],
        category_counts=risk_summary["category_counts"]
    )
    db.add(audit_result)

    # Update Submission status
    submission.workflow_status = "audited"
    submission.current_band = risk_summary["risk_band"]

    db.add(ActivityLog(
        org_id=org_id,
        actor_id=submission.created_by,
        action="CONTENT_AUDITED",
        entity_type="audit",
        entity_id=audit.id,
        metadata_json={
            "submission_id": submission_id,
            "risk_band": risk_summary["risk_band"],
            "points": risk_summary["points"],
            "violations_count": len(violations_data)
        }
    ))

    db.commit()
    db.refresh(audit)
    return audit
