-- BrandGuard AI Row Level Security (RLS) Policies
-- Strict multi-tenant isolation by organization (org_id)

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE guideline_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guideline_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE tone_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's org_id
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.org_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Generic Org Isolation Policies
CREATE POLICY "org_isolation_guidelines" ON guidelines
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_guideline_versions" ON guideline_versions
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_guideline_chunks" ON guideline_chunks
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_approved_facts" ON approved_facts
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_terminology" ON terminology
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_tone_profiles" ON tone_profiles
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_brand_assets" ON brand_assets
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_risk_policies" ON risk_policies
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_content_submissions" ON content_submissions
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_revision_history" ON revision_history
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_audits" ON audits
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_audit_results" ON audit_results
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_violations" ON violations
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_claim_verifications" ON claim_verifications
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_ai_suggestions" ON ai_suggestions
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_review_assignments" ON review_assignments
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_comments" ON comments
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_approvals" ON approvals
  FOR ALL USING (org_id = get_current_org_id());

CREATE POLICY "org_isolation_activity_logs" ON activity_logs
  FOR ALL USING (org_id = get_current_org_id());
