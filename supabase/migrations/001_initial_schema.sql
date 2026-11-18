-- BrandGuard AI Database Schema (PostgreSQL + pgvector)
-- Supports Supabase with Row Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Identity and Tenant Management
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    industry TEXT,
    external_ai_enabled BOOLEAN DEFAULT FALSE,
    retention_days INT DEFAULT 365,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL, -- org_admin, brand_manager, creator, marketing_manager, compliance_reviewer, agency
    label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active', -- invited, active, suspended
    team TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_role ON org_members(org_id, role_id);

-- 2. Brand Knowledge Hub
CREATE TABLE IF NOT EXISTS guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT,
    department TEXT,
    campaign TEXT,
    agency_visible BOOLEAN DEFAULT FALSE,
    current_version_id UUID,
    status TEXT NOT NULL DEFAULT 'approved', -- approved, expired, pending
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guidelines_org_status ON guidelines(org_id, status);

CREATE TABLE IF NOT EXISTS guideline_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    guideline_id UUID NOT NULL REFERENCES guidelines(id) ON DELETE CASCADE,
    version_no INT NOT NULL,
    storage_path TEXT,
    file_hash TEXT,
    page_count INT DEFAULT 1,
    valid_from DATE,
    valid_to DATE,
    status TEXT NOT NULL DEFAULT 'ready', -- processing, ready, failed, superseded
    parse_error TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (guideline_id, version_no)
);

CREATE TABLE IF NOT EXISTS guideline_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES guideline_versions(id) ON DELETE CASCADE,
    section_path TEXT NOT NULL,
    page_start INT DEFAULT 1,
    page_end INT DEFAULT 1,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT DEFAULT 0,
    embedding vector(1536),
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);

CREATE INDEX IF NOT EXISTS idx_guideline_chunks_org_ver ON guideline_chunks(org_id, version_id);
CREATE INDEX IF NOT EXISTS idx_guideline_chunks_tsv ON guideline_chunks USING GIN(tsv);

CREATE TABLE IF NOT EXISTS approved_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    fact_key TEXT NOT NULL,
    entity TEXT NOT NULL,
    attribute TEXT NOT NULL,
    value_text TEXT NOT NULL,
    value_numeric NUMERIC,
    unit TEXT,
    currency TEXT,
    source_guideline_id UUID REFERENCES guidelines(id) ON DELETE SET NULL,
    source_section TEXT,
    valid_from DATE NOT NULL,
    valid_to DATE,
    status TEXT NOT NULL DEFAULT 'approved', -- approved, expired, pending
    superseded_by UUID REFERENCES approved_facts(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facts_org_key_status ON approved_facts(org_id, fact_key, status);

CREATE TABLE IF NOT EXISTS terminology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    kind TEXT NOT NULL, -- approved, prohibited, preferred
    replacement TEXT,
    context_note TEXT,
    severity TEXT DEFAULT 'medium', -- info, low, medium, high, critical
    source_guideline_id UUID REFERENCES guidelines(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    UNIQUE (org_id, term, kind)
);

CREATE TABLE IF NOT EXISTS tone_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    descriptors JSONB DEFAULT '[]',
    do_examples JSONB DEFAULT '[]',
    dont_examples JSONB DEFAULT '[]',
    formality TEXT DEFAULT 'medium',
    channel TEXT DEFAULT 'all',
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- logo, image, font, color
    name TEXT NOT NULL,
    variant TEXT,
    storage_path TEXT,
    hex_value TEXT,
    phash TEXT,
    width INT,
    height INT,
    min_size_px INT,
    clear_space_rule JSONB,
    status TEXT DEFAULT 'active',
    agency_visible BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version_no INT NOT NULL,
    severity_points JSONB NOT NULL,
    band_rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (org_id, version_no)
);

-- 3. Content Submissions, Audits, Findings
CREATE TABLE IF NOT EXISTS content_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL, -- caption, ad, blog, document, image, other
    channel TEXT,
    campaign TEXT,
    department TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    current_revision_id UUID,
    workflow_status TEXT NOT NULL DEFAULT 'draft',
    current_band TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_org_status ON content_submissions(org_id, workflow_status);

CREATE TABLE IF NOT EXISTS revision_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
    revision_no INT NOT NULL,
    body_text TEXT NOT NULL,
    storage_path TEXT,
    content_hash TEXT NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'author', -- author, ai_applied, import
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (submission_id, revision_no)
);

CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL REFERENCES revision_history(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, running, completed, partial, failed
    ai_mode TEXT DEFAULT 'full', -- full, rules_only
    policy_id UUID REFERENCES risk_policies(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error TEXT
);

CREATE TABLE IF NOT EXISTS audit_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_id UUID NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
    risk_band TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    points INT NOT NULL DEFAULT 0,
    breakdown JSONB DEFAULT '[]',
    category_counts JSONB DEFAULT '{}',
    evidence_gaps JSONB DEFAULT '[]',
    model_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    issue_code TEXT NOT NULL,
    category TEXT NOT NULL, -- pricing, terminology, tone, claim, messaging, grammar, accessibility, visual, other
    severity TEXT NOT NULL, -- info, low, medium, high, critical
    detection_method TEXT DEFAULT 'hybrid', -- rule, ai, hybrid
    submitted_text TEXT NOT NULL,
    span_start INT NOT NULL,
    span_end INT NOT NULL,
    explanation TEXT NOT NULL,
    guideline_id UUID REFERENCES guidelines(id) ON DELETE SET NULL,
    guideline_version_id UUID REFERENCES guideline_versions(id) ON DELETE SET NULL,
    chunk_id UUID REFERENCES guideline_chunks(id) ON DELETE SET NULL,
    evidence_text TEXT,
    suggested_correction TEXT,
    confidence TEXT DEFAULT 'high', -- high, medium, low
    status TEXT DEFAULT 'open', -- open, accepted, rejected, dismissed
    dismissed_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    claim_type TEXT NOT NULL, -- price, discount, spec, availability, superlative, guarantee
    normalized_value TEXT,
    status TEXT NOT NULL, -- verified, contradicted, unsupported, outdated, needs_review
    fact_id UUID REFERENCES approved_facts(id) ON DELETE SET NULL,
    chunk_id UUID REFERENCES guideline_chunks(id) ON DELETE SET NULL,
    evidence_quote TEXT,
    confidence TEXT DEFAULT 'high',
    suggested_correction TEXT
);

CREATE TABLE IF NOT EXISTS ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    violation_id UUID NOT NULL REFERENCES violations(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL REFERENCES revision_history(id) ON DELETE CASCADE,
    span_start INT NOT NULL,
    span_end INT NOT NULL,
    original_text TEXT NOT NULL,
    replacement_text TEXT NOT NULL,
    rationale TEXT,
    introduces_new_info BOOLEAN DEFAULT FALSE,
    state TEXT DEFAULT 'pending', -- pending, accepted, rejected, superseded
    decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ
);

-- 4. Workflow Approvals, Collaboration & Audit Trail
CREATE TABLE IF NOT EXISTS review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
    stage TEXT NOT NULL, -- manager, compliance, final
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, revision_requested, rejected, reassigned
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
    revision_id UUID REFERENCES revision_history(id) ON DELETE SET NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    span_start INT,
    span_end INT,
    body TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL REFERENCES revision_history(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    stage TEXT NOT NULL, -- manager, compliance, final
    decision TEXT NOT NULL, -- approved, revision_requested, rejected
    reason TEXT,
    decided_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decided_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    ip INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_org_date ON activity_logs(org_id, created_at DESC);
