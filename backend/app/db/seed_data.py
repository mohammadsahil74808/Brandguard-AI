from sqlalchemy.orm import Session
from app.db.models import (
    Organization, Role, User, OrgMember, Guideline, GuidelineVersion,
    GuidelineChunk, ApprovedFact, Terminology, ToneProfile, RiskPolicy,
    ContentSubmission, RevisionHistory, ActivityLog
)
import hashlib

def seed_roles(db: Session):
    roles_data = [
        ("10000000-0000-0000-0000-000000000001", "org_admin", "Organization Admin"),
        ("10000000-0000-0000-0000-000000000002", "brand_manager", "Brand Manager"),
        ("10000000-0000-0000-0000-000000000003", "creator", "Content Creator"),
        ("10000000-0000-0000-0000-000000000004", "marketing_manager", "Marketing Manager"),
        ("10000000-0000-0000-0000-000000000005", "compliance_reviewer", "Compliance Reviewer"),
        ("10000000-0000-0000-0000-000000000006", "agency", "Agency Contributor"),
    ]
    for r_id, key, label in roles_data:
        existing = db.query(Role).filter(Role.key == key).first()
        if not existing:
            db.add(Role(id=r_id, key=key, label=label))
    db.commit()

def seed_acme_audio(db: Session):
    org_id = "00000000-0000-0000-0000-000000000001"
    existing_org = db.query(Organization).filter(Organization.id == org_id).first()
    if not existing_org:
        org = Organization(
            id=org_id,
            name="Acme Audio",
            slug="acme-audio",
            industry="Consumer Electronics",
            external_ai_enabled=True,
            retention_days=365
        )
        db.add(org)

    # Users & Members
    users_data = [
        ("20000000-0000-0000-0000-000000000001", "aarav@acmeaudio.demo", "Aarav Patel", "10000000-0000-0000-0000-000000000001", "IT & Governance"),
        ("20000000-0000-0000-0000-000000000002", "meera@acmeaudio.demo", "Meera Rao", "10000000-0000-0000-0000-000000000002", "Brand Strategy"),
        ("20000000-0000-0000-0000-000000000003", "rohan@acmeaudio.demo", "Rohan Sharma", "10000000-0000-0000-0000-000000000003", "Content Production"),
        ("20000000-0000-0000-0000-000000000004", "priya@acmeaudio.demo", "Priya Iyer", "10000000-0000-0000-0000-000000000004", "Growth Marketing"),
        ("20000000-0000-0000-0000-000000000005", "kabir@acmeaudio.demo", "Kabir Verma", "10000000-0000-0000-0000-000000000005", "Legal & Compliance"),
        ("20000000-0000-0000-0000-000000000006", "sana@externalagency.demo", "Sana Khan", "10000000-0000-0000-0000-000000000006", "Creative Agency"),
    ]
    for u_id, email, name, role_id, team in users_data:
        existing_u = db.query(User).filter(User.id == u_id).first()
        if not existing_u:
            db.add(User(id=u_id, email=email, full_name=name))
        existing_m = db.query(OrgMember).filter(OrgMember.user_id == u_id, OrgMember.org_id == org_id).first()
        if not existing_m:
            db.add(OrgMember(org_id=org_id, user_id=u_id, role_id=role_id, team=team))

    # Guidelines
    g_id = "30000000-0000-0000-0000-000000000001"
    gv_id = "30000000-0000-0000-0000-000000000002"
    if not db.query(Guideline).filter(Guideline.id == g_id).first():
        db.add(Guideline(
            id=g_id,
            org_id=org_id,
            title="Acme Audio Brand Guidelines v4",
            category="Corporate Identity",
            department="Global Marketing",
            status="approved"
        ))
    if not db.query(GuidelineVersion).filter(GuidelineVersion.id == gv_id).first():
        db.add(GuidelineVersion(
            id=gv_id,
            org_id=org_id,
            guideline_id=g_id,
            version_no=4,
            page_count=18,
            status="ready"
        ))

    chunks_data = [
        ("40000000-0000-0000-0000-000000000001", "Acme Audio Guidelines v4 > Claims Policy > Pricing Standards", 2, 1, "Official promotional and retail pricing for Acme Buds Pro is fixed at ₹799 for Q4 (effective Oct 1 to Dec 31). Prior pricing of ₹999 expired on September 30. Any promotional copy quoting ₹999 is outdated and prohibited."),
        ("40000000-0000-0000-0000-000000000002", "Acme Audio Guidelines v4 > Technical Specifications > Battery Life", 4, 2, "Acme Buds Pro feature a verified lab-tested battery endurance of 30 hours total playback with charging case. Claims citing 40 hours or more contradict technical certifications and must be rejected."),
        ("40000000-0000-0000-0000-000000000003", "Acme Audio Guidelines v4 > Claims Policy > Superlatives & Guarantees", 6, 3, "Superlative claims including 'world's best', '#1 audio brand', or 'unbeatable sound' require explicit, accredited independent lab benchmarks. Unverified superlatives damage brand integrity and are strictly unsupported."),
        ("40000000-0000-0000-0000-000000000004", "Acme Audio Guidelines v4 > Brand Voice > Tone and Punctuation", 8, 4, "Acme Audio communicates with a warm, confident, and concise voice. Avoid juvenile slang greetings such as 'Hey guys!!!'. Restrict exclamation marks to a maximum of one per post. Do not use all-caps urgency words such as 'NOW'.")
    ]
    for c_id, sec, page, idx, content in chunks_data:
        if not db.query(GuidelineChunk).filter(GuidelineChunk.id == c_id).first():
            db.add(GuidelineChunk(id=c_id, org_id=org_id, version_id=gv_id, section_path=sec, page_start=page, chunk_index=idx, content=content))

    # Facts
    facts_data = [
        ("50000000-0000-0000-0000-000000000001", "product.acme_buds_pro.price", "Acme Buds Pro", "price", "₹799", 799.0, "INR", "Pricing Sheet Q4, Page 2", "2026-10-01", "2026-12-31", "approved"),
        ("50000000-0000-0000-0000-000000000002", "product.acme_buds_pro.price_old", "Acme Buds Pro", "price", "₹999", 999.0, "INR", "Pricing Sheet Q3, Page 2", "2026-07-01", "2026-09-30", "expired"),
        ("50000000-0000-0000-0000-000000000003", "product.acme_buds_pro.battery", "Acme Buds Pro", "battery_life", "30 hours", 30.0, "hours", "Tech Spec Sheet v2, Page 4", "2026-01-01", None, "approved"),
    ]
    for f_id, key, ent, attr, v_text, v_num, curr, sec, vf, vt, st in facts_data:
        if not db.query(ApprovedFact).filter(ApprovedFact.id == f_id).first():
            db.add(ApprovedFact(id=f_id, org_id=org_id, fact_key=key, entity=ent, attribute=attr, value_text=v_text, value_numeric=v_num, currency=curr, source_section=sec, valid_from=vf, valid_to=vt, status=st))

    # Terminology
    terms_data = [
        ("60000000-0000-0000-0000-000000000001", "cheapest", "prohibited", "affordable", "Use premium yet accessible phrasing", "medium", "approved"),
        ("60000000-0000-0000-0000-000000000002", "world's best", "prohibited", "critically acclaimed", "Superlatives require verified evidence", "high", "approved"),
    ]
    for t_id, term, kind, rep, note, sev, st in terms_data:
        if not db.query(Terminology).filter(Terminology.id == t_id).first():
            db.add(Terminology(id=t_id, org_id=org_id, term=term, kind=kind, replacement=rep, context_note=note, severity=sev, status=st))

    # Tone Profile
    if not db.query(ToneProfile).filter(ToneProfile.id == "70000000-0000-0000-0000-000000000001").first():
        db.add(ToneProfile(
            id="70000000-0000-0000-0000-000000000001",
            org_id=org_id,
            name="Acme Global Social Tone",
            descriptors=["warm", "confident", "concise"],
            do_examples=["Experience pristine acoustic balance with 30-hour playback.", "Refined design crafted for everyday focus."],
            dont_examples=["Hey guys!!! Grab the cheapest earbuds NOW!!!", "Unbeatable sound that will blow your mind."],
            formality="balanced",
            channel="social"
        ))

    # Risk Policy
    if not db.query(RiskPolicy).filter(RiskPolicy.id == "80000000-0000-0000-0000-000000000001").first():
        db.add(RiskPolicy(
            id="80000000-0000-0000-0000-000000000001",
            org_id=org_id,
            version_no=1,
            severity_points={"info": 0, "low": 1, "medium": 3, "high": 7, "critical": 15},
            band_rules={"critical_threshold": 25, "high_threshold": 12, "medium_threshold": 4},
            is_active=True
        ))

    # Initial Sample Draft
    sample_sub_id = "90000000-0000-0000-0000-000000000001"
    sample_rev_id = "90000000-0000-0000-0000-000000000002"
    if not db.query(ContentSubmission).filter(ContentSubmission.id == sample_sub_id).first():
        sample_text = "Hey guys!!! Grab the Acme Buds Pro NOW for just ₹999 – the cheapest and world's best earbuds with 40-hour battery! #Sale"
        sample_hash = hashlib.sha256(sample_text.encode("utf-8")).hexdigest()

        db.add(ContentSubmission(
            id=sample_sub_id,
            org_id=org_id,
            title="Acme Buds Pro - Instagram Launch Caption",
            content_type="caption",
            channel="instagram",
            campaign="Buds Pro Global Launch",
            created_by="20000000-0000-0000-0000-000000000003",
            workflow_status="draft",
            current_band="PENDING"
        ))
        db.add(RevisionHistory(
            id=sample_rev_id,
            org_id=org_id,
            submission_id=sample_sub_id,
            revision_no=1,
            body_text=sample_text,
            content_hash=sample_hash,
            change_summary="Initial copy created by Rohan",
            created_by="20000000-0000-0000-0000-000000000003"
        ))

    db.commit()

def seed_nova_tech(db: Session):
    nova_org_id = "nova-tech-demo-0000-0000-0000-000000000001"
    existing_org = db.query(Organization).filter(Organization.id == nova_org_id).first()
    if not existing_org:
        org = Organization(
            id=nova_org_id,
            name="NOVA TECH",
            slug="nova-tech",
            industry="Smart Hardware & Consumer Electronics",
            external_ai_enabled=True,
            retention_days=365
        )
        db.add(org)

    # Personas for NOVA TECH (Separation of Duties)
    nova_users = [
        ("nova-user-0000-0000-0000-000000000001", "sarah.jenkins@novatech.demo", "Sarah Jenkins", "10000000-0000-0000-0000-000000000003", "Content Studio (Author)"),
        ("nova-user-0000-0000-0000-000000000002", "alex.rivera@novatech.demo", "Alex Rivera", "10000000-0000-0000-0000-000000000004", "Product Marketing (Manager)"),
        ("nova-user-0000-0000-0000-000000000003", "elena.rostova@novatech.demo", "Elena Rostova", "10000000-0000-0000-0000-000000000005", "Legal & Regulatory Counsel"),
    ]
    for u_id, email, name, role_id, team in nova_users:
        if not db.query(User).filter(User.id == u_id).first():
            db.add(User(id=u_id, email=email, full_name=name))
        if not db.query(OrgMember).filter(OrgMember.user_id == u_id, OrgMember.org_id == nova_org_id).first():
            db.add(OrgMember(org_id=nova_org_id, user_id=u_id, role_id=role_id, team=team))

    # Guidelines
    g_id = "nova-guide-0000-0000-0000-000000000001"
    gv_id = "nova-guide-v-000-0000-000000000001"
    if not db.query(Guideline).filter(Guideline.id == g_id).first():
        db.add(Guideline(
            id=g_id,
            org_id=nova_org_id,
            title="NOVA TECH Brand Voice & Compliance Standard v2.0",
            category="Corporate Identity & Product Governance",
            department="Global Marketing & Legal",
            status="approved"
        ))
    if not db.query(GuidelineVersion).filter(GuidelineVersion.id == gv_id).first():
        db.add(GuidelineVersion(
            id=gv_id,
            org_id=nova_org_id,
            guideline_id=g_id,
            version_no=2,
            page_count=24,
            status="ready"
        ))

    nova_chunks = [
        ("nova-chunk-0000-0000-0000-000000000001", "NOVA TECH Guidelines > Brand Voice > Tone and Communication Principles", 2, 1, "NOVA TECH communicates with professional, friendly, and trustworthy authority. Avoid juvenile internet slang, sensationalism, and aggressive urgency cues such as 'BUY NOW'. All marketing copy must inspire confidence and highlight precision engineering."),
        ("nova-chunk-0000-0000-0000-000000000002", "NOVA TECH Guidelines > Product Catalogue > Authorized Pricing Policy", 5, 2, "All marketing copy must strictly quote authorized retail MSRP: NOVA Buds Pro is ₹4,999. NOVA Watch Ultra is ₹8,999. NOVA Pad 11 is ₹24,999. Quoting unauthorized discounts or expired pricing (such as ₹3,499 for Buds Pro or ₹6,999 for Watch Ultra) is strictly prohibited across all channels."),
        ("nova-chunk-0000-0000-0000-000000000003", "NOVA TECH Guidelines > Hardware Specifications > Battery & Endurance", 8, 3, "Battery endurance figures must reflect certified lab testing standards: NOVA Buds Pro provides up to 36 hours total playback with charging case (42dB ANC enabled). NOVA Watch Ultra delivers up to 7 days of typical battery life. NOVA Pad 11 features an 8,000mAh battery providing up to 14 hours video streaming. Unsubstantiated claims claiming '50 hours playback' or 'unlimited battery life' contradict lab certifications and are strictly forbidden."),
        ("nova-chunk-0000-0000-0000-000000000004", "NOVA TECH Guidelines > Communications Policy > Claims & Superlatives", 12, 4, "Unsupported superlatives such as 'cheapest in the galaxy', 'world's fastest', '#1 brand', or 'unbeatable' are prohibited under consumer protection regulations. Use accredited comparative phrasing like 'exceptional value' or 'flagship-tier performance'."),
        ("nova-chunk-0000-0000-0000-000000000005", "NOVA TECH Guidelines > Brand Identity & Naming Conventions", 15, 5, "Always capitalize product names with exact trademark casing: 'NOVA Buds Pro', 'NOVA Watch Ultra', and 'NOVA Pad 11'. Writing 'Nova buds' or 'Nova Pad' is prohibited. Brand color palette comprises Electric Indigo (#4F46E5), Neon Mint (#10B981), and Midnight Slate (#0F172A).")
    ]
    for c_id, sec, page, idx, content in nova_chunks:
        if not db.query(GuidelineChunk).filter(GuidelineChunk.id == c_id).first():
            db.add(GuidelineChunk(id=c_id, org_id=nova_org_id, version_id=gv_id, section_path=sec, page_start=page, chunk_index=idx, content=content))

    # Approved Facts (Catalogue of 3 Products)
    nova_facts = [
        # Product 1: NOVA Buds Pro
        ("nova-fact-0000-0000-0000-000000000001", "product.nova_buds_pro.price", "NOVA Buds Pro", "price", "₹4,999", 4999.0, "INR", "Official MSRP Q4 Price Index, Page 3", "2026-10-01", "2026-12-31", "approved"),
        ("nova-fact-0000-0000-0000-000000000002", "product.nova_buds_pro.battery", "NOVA Buds Pro", "battery_life", "36 hours", 36.0, "hours", "Acoustic Hardware Lab Report #NB-42, Page 7", "2026-01-01", None, "approved"),
        ("nova-fact-0000-0000-0000-000000000003", "product.nova_buds_pro.anc", "NOVA Buds Pro", "noise_cancellation", "42dB Active Noise Cancellation", 42.0, "dB", "Acoustic Hardware Lab Report #NB-42, Page 9", "2026-01-01", None, "approved"),
        ("nova-fact-0000-0000-0000-000000000004", "product.nova_buds_pro.water_resistance", "NOVA Buds Pro", "water_resistance", "IPX5 water and sweat resistant", None, None, "IPX Ingress Certification, Page 2", "2026-01-01", None, "approved"),

        # Product 2: NOVA Watch Ultra
        ("nova-fact-0000-0000-0000-000000000005", "product.nova_watch_ultra.price", "NOVA Watch Ultra", "price", "₹8,999", 8999.0, "INR", "Official MSRP Q4 Price Index, Page 4", "2026-10-01", "2026-12-31", "approved"),
        ("nova-fact-0000-0000-0000-000000000006", "product.nova_watch_ultra.battery", "NOVA Watch Ultra", "battery_life", "7 days", 7.0, "days", "Wearables Power Lab Report #NW-7, Page 5", "2026-01-01", None, "approved"),
        ("nova-fact-0000-0000-0000-000000000007", "product.nova_watch_ultra.display", "NOVA Watch Ultra", "display", "1.96-inch AMOLED 1000 nits display", None, None, "Display Tech Spec Sheet, Page 1", "2026-01-01", None, "approved"),
        ("nova-fact-0000-0000-0000-000000000008", "product.nova_watch_ultra.casing", "NOVA Watch Ultra", "casing", "Aerospace-grade Titanium frame", None, None, "Materials Certification, Page 3", "2026-01-01", None, "approved"),

        # Product 3: NOVA Pad 11
        ("nova-fact-0000-0000-0000-000000000009", "product.nova_pad_11.price", "NOVA Pad 11", "price", "₹24,999", 24999.0, "INR", "Official MSRP Q4 Price Index, Page 5", "2026-10-01", "2026-12-31", "approved"),
        ("nova-fact-0000-0000-0000-000000000010", "product.nova_pad_11.battery", "NOVA Pad 11", "battery_capacity", "8,000mAh battery", 8000.0, "mAh", "Battery Safety Certification, Page 6", "2026-01-01", None, "approved"),
        ("nova-fact-0000-0000-0000-000000000011", "product.nova_pad_11.display", "NOVA Pad 11", "display", "11-inch 2.5K 120Hz Ultra-smooth display", 120.0, "Hz", "Panel Spec Sheet, Page 2", "2026-01-01", None, "approved"),
        ("nova-fact-0000-0000-0000-000000000012", "product.nova_pad_11.chipset", "NOVA Pad 11", "chipset", "8-Core NovaSilicon X1 Processor", None, None, "Architecture Whitepaper, Page 1", "2026-01-01", None, "approved"),
    ]
    for f_id, key, ent, attr, v_text, v_num, curr, sec, vf, vt, st in nova_facts:
        if not db.query(ApprovedFact).filter(ApprovedFact.id == f_id).first():
            db.add(ApprovedFact(id=f_id, org_id=nova_org_id, fact_key=key, entity=ent, attribute=attr, value_text=v_text, value_numeric=v_num, currency=curr, source_section=sec, valid_from=vf, valid_to=vt, status=st))

    # Terminology
    nova_terms = [
        ("nova-term-0000-0000-0000-000000000001", "cheapest in the galaxy", "prohibited", "exceptional value", "Unsupported cosmic superlative violates compliance", "high", "approved"),
        ("nova-term-0000-0000-0000-000000000002", "world's fastest", "prohibited", "flagship-tier performance", "Superlative requires verified third-party laboratory evidence", "high", "approved"),
        ("nova-term-0000-0000-0000-000000000003", "unlimited battery", "prohibited", "up to 36 hours total playback", "Scientifically inaccurate claim contradicts lab certification", "high", "approved"),
        ("nova-term-0000-0000-0000-000000000004", "Nova buds", "prohibited", "NOVA Buds Pro", "Trademark naming must follow exact uppercase capitalization", "medium", "approved"),
    ]
    for t_id, term, kind, rep, note, sev, st in nova_terms:
        if not db.query(Terminology).filter(Terminology.id == t_id).first():
            db.add(Terminology(id=t_id, org_id=nova_org_id, term=term, kind=kind, replacement=rep, context_note=note, severity=sev, status=st))

    # Tone Profile
    if not db.query(ToneProfile).filter(ToneProfile.id == "nova-tone-0000-0000-0000-000000000001").first():
        db.add(ToneProfile(
            id="nova-tone-0000-0000-0000-000000000001",
            org_id=nova_org_id,
            name="NOVA TECH Global Brand Voice",
            descriptors=["professional", "friendly", "trustworthy"],
            do_examples=[
                "Experience acoustic fidelity with the all-new NOVA Buds Pro.",
                "Precision engineered with up to 36 hours of total playback."
            ],
            dont_examples=[
                "Hey tech lovers! Grab the cheapest earbuds in the galaxy for just ₹3,499 NOW!",
                "Unlimited battery that will blow your mind!"
            ],
            formality="balanced",
            channel="omnichannel"
        ))

    # Risk Policy
    if not db.query(RiskPolicy).filter(RiskPolicy.id == "nova-risk-0000-0000-0000-000000000001").first():
        db.add(RiskPolicy(
            id="nova-risk-0000-0000-0000-000000000001",
            org_id=nova_org_id,
            version_no=1,
            severity_points={"info": 0, "low": 1, "medium": 3, "high": 7, "critical": 15},
            band_rules={"critical_threshold": 25, "high_threshold": 12, "medium_threshold": 4},
            is_active=True
        ))

    # Preloaded Submissions
    sub_a_id = "nova-sub-0000-0000-0000-000000000001"
    rev_a_id = "nova-rev-0000-0000-0000-000000000001"
    if not db.query(ContentSubmission).filter(ContentSubmission.id == sub_a_id).first():
        sub_a_text = "Hey tech lovers! Grab the new Nova buds for just ₹3,499! It has unlimited battery life with 50-hour playback and is the cheapest in the galaxy with world's fastest bluetooth pairing. Buy now!"
        sub_a_hash = hashlib.sha256(sub_a_text.encode("utf-8")).hexdigest()

        db.add(ContentSubmission(
            id=sub_a_id,
            org_id=nova_org_id,
            title="NOVA Buds Pro - Launch Social Ad (Contains 4 Violations)",
            content_type="caption",
            channel="instagram",
            campaign="NOVA Buds Pro Q4 Launch",
            created_by="nova-user-0000-0000-0000-000000000001",
            workflow_status="draft",
            current_band="PENDING"
        ))
        db.add(RevisionHistory(
            id=rev_a_id,
            org_id=nova_org_id,
            submission_id=sub_a_id,
            revision_no=1,
            body_text=sub_a_text,
            content_hash=sub_a_hash,
            change_summary="Preloaded sample ad for demo audit testing",
            created_by="nova-user-0000-0000-0000-000000000001"
        ))

    sub_b_id = "nova-sub-0000-0000-0000-000000000002"
    rev_b_id = "nova-rev-0000-0000-0000-000000000002"
    if not db.query(ContentSubmission).filter(ContentSubmission.id == sub_b_id).first():
        sub_b_text = "Experience pure acoustic fidelity with the all-new NOVA Buds Pro. Featuring 42dB Active Noise Cancellation and up to 36 hours of total playback with the wireless charging case. Available now for ₹4,999 with IPX5 water resistance. Thoughtfully engineered for creators."
        sub_b_hash = hashlib.sha256(sub_b_text.encode("utf-8")).hexdigest()

        db.add(ContentSubmission(
            id=sub_b_id,
            org_id=nova_org_id,
            title="NOVA Buds Pro - Official Launch Campaign (100% Compliant)",
            content_type="caption",
            channel="instagram",
            campaign="NOVA Buds Pro Q4 Launch",
            created_by="nova-user-0000-0000-0000-000000000001",
            workflow_status="draft",
            current_band="PENDING"
        ))
        db.add(RevisionHistory(
            id=rev_b_id,
            org_id=nova_org_id,
            submission_id=sub_b_id,
            revision_no=1,
            body_text=sub_b_text,
            content_hash=sub_b_hash,
            change_summary="Preloaded verified compliant ad",
            created_by="nova-user-0000-0000-0000-000000000001"
        ))

    db.commit()

def seed_db(db: Session):
    seed_roles(db)
    seed_acme_audio(db)
    seed_nova_tech(db)
