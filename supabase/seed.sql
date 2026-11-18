-- Acme Audio Seed Data for BrandGuard AI Hackathon Demonstration
-- Organization
INSERT INTO organizations (id, name, slug, industry, external_ai_enabled, retention_days)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Audio', 'acme-audio', 'Consumer Electronics', TRUE, 365)
ON CONFLICT (id) DO NOTHING;

-- Roles
INSERT INTO roles (id, key, label) VALUES
('10000000-0000-0000-0000-000000000001', 'org_admin', 'Organization Admin'),
('10000000-0000-0000-0000-000000000002', 'brand_manager', 'Brand Manager'),
('10000000-0000-0000-0000-000000000003', 'creator', 'Content Creator'),
('10000000-0000-0000-0000-000000000004', 'marketing_manager', 'Marketing Manager'),
('10000000-0000-0000-0000-000000000005', 'compliance_reviewer', 'Compliance Reviewer'),
('10000000-0000-0000-0000-000000000006', 'agency', 'Agency Contributor')
ON CONFLICT (key) DO NOTHING;

-- Users
INSERT INTO users (id, email, full_name) VALUES
('20000000-0000-0000-0000-000000000001', 'aarav@acmeaudio.demo', 'Aarav Patel (Org Admin)'),
('20000000-0000-0000-0000-000000000002', 'meera@acmeaudio.demo', 'Meera Rao (Brand Manager)'),
('20000000-0000-0000-0000-000000000003', 'rohan@acmeaudio.demo', 'Rohan Sharma (Content Creator)'),
('20000000-0000-0000-0000-000000000004', 'priya@acmeaudio.demo', 'Priya Iyer (Marketing Manager)'),
('20000000-0000-0000-0000-000000000005', 'kabir@acmeaudio.demo', 'Kabir Verma (Compliance Reviewer)'),
('20000000-0000-0000-0000-000000000006', 'sana@externalagency.demo', 'Sana Khan (Agency Contributor)')
ON CONFLICT (email) DO NOTHING;

-- Org Members
INSERT INTO org_members (org_id, user_id, role_id, team) VALUES
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'IT & Governance'),
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Brand Strategy'),
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Content Production'),
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Growth Marketing'),
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Legal & Compliance'),
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'Creative Agency')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Guideline
INSERT INTO guidelines (id, org_id, title, category, department, status)
VALUES ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Acme Audio Brand Guidelines v4', 'Corporate Identity', 'Global Marketing', 'approved')
ON CONFLICT (id) DO NOTHING;

INSERT INTO guideline_versions (id, org_id, guideline_id, version_no, page_count, status)
VALUES ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 4, 18, 'ready')
ON CONFLICT (guideline_id, version_no) DO NOTHING;

-- Guideline Chunks (Evidence Sources)
INSERT INTO guideline_chunks (id, org_id, version_id, section_path, page_start, chunk_index, content) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Acme Audio Guidelines v4 > Claims Policy > Pricing Standards', 2, 1, 'Official promotional and retail pricing for Acme Buds Pro is fixed at ₹799 for Q4 (effective Oct 1 to Dec 31). Prior pricing of ₹999 expired on September 30. Any promotional copy quoting ₹999 is outdated and prohibited.'),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Acme Audio Guidelines v4 > Technical Specifications > Battery Life', 4, 2, 'Acme Buds Pro feature a verified lab-tested battery endurance of 30 hours total playback with charging case. Claims citing 40 hours or more contradict technical certifications and must be rejected.'),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Acme Audio Guidelines v4 > Claims Policy > Superlatives & Guarantees', 6, 3, 'Superlative claims including "world''s best", "#1 audio brand", or "unbeatable sound" require explicit, accredited independent lab benchmarks. Unverified superlatives damage brand integrity and are strictly unsupported.'),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Acme Audio Guidelines v4 > Brand Voice > Tone and Punctuation', 8, 4, 'Acme Audio communicates with a warm, confident, and concise voice. Avoid juvenile slang greetings such as "Hey guys!!!". Restrict exclamation marks to a maximum of one per post. Do not use all-caps urgency words such as "NOW".')
ON CONFLICT (id) DO NOTHING;

-- Approved Facts
INSERT INTO approved_facts (id, org_id, fact_key, entity, attribute, value_text, value_numeric, currency, source_section, valid_from, valid_to, status) VALUES
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'product.acme_buds_pro.price', 'Acme Buds Pro', 'price', '₹799', 799, 'INR', 'Pricing Sheet Q4, Page 2', '2026-10-01', '2026-12-31', 'approved'),
('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'product.acme_buds_pro.price_old', 'Acme Buds Pro', 'price', '₹999', 999, 'INR', 'Pricing Sheet Q3, Page 2', '2026-07-01', '2026-09-30', 'expired'),
('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'product.acme_buds_pro.battery', 'Acme Buds Pro', 'battery_life', '30 hours', 30, 'hours', 'Tech Spec Sheet v2, Page 4', '2026-01-01', NULL, 'approved')
ON CONFLICT (id) DO NOTHING;

-- Terminology
INSERT INTO terminology (id, org_id, term, kind, replacement, context_note, severity, status) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'cheapest', 'prohibited', 'affordable', 'Use premium yet accessible phrasing', 'medium', 'approved'),
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'world''s best', 'prohibited', 'critically acclaimed', 'Superlatives require verified evidence', 'high', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Tone Profile
INSERT INTO tone_profiles (id, org_id, name, descriptors, do_examples, dont_examples, formality, channel)
VALUES (
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Acme Global Social Tone',
  '["warm", "confident", "concise"]',
  '["Experience pristine acoustic balance with 30-hour playback.", "Refined design crafted for everyday focus."]',
  '["Hey guys!!! Grab the cheapest earbuds NOW!!!", "Unbeatable sound that will blow your mind."]',
  'balanced',
  'social'
)
ON CONFLICT (id) DO NOTHING;

-- Risk Policy
INSERT INTO risk_policies (id, org_id, version_no, severity_points, band_rules, is_active)
VALUES (
  '80000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  1,
  '{"info": 0, "low": 1, "medium": 3, "high": 7, "critical": 15}',
  '{"critical_threshold": 25, "high_threshold": 12, "medium_threshold": 4}',
  TRUE
)
ON CONFLICT (org_id, version_no) DO NOTHING;
