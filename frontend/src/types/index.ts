export type RiskBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'PENDING';

export type ViolationSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface Persona {
  id: string;
  email: string;
  full_name: string;
  role_key: string;
  role_label: string;
  team: string;
}

export interface UserProfile {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  org: {
    id: string;
    name: string;
    slug: string;
  };
  role: {
    key: string;
    label: string;
  };
  team: string;
}

export interface Guideline {
  id: string;
  title: string;
  category: string;
  department: string;
  status: string;
  agency_visible: boolean;
  versions_count: number;
  chunks_count: number;
  created_at: string;
}

export interface GuidelineChunk {
  id: string;
  section_path: string;
  page_start: number;
  chunk_index: number;
  content: string;
}

export interface ApprovedFact {
  id: string;
  fact_key: string;
  entity: string;
  attribute: string;
  value_text: string;
  value_numeric?: number;
  currency?: string;
  source_section?: string;
  valid_from: string;
  valid_to?: string;
  status: 'approved' | 'expired' | 'pending';
}

export interface TerminologyItem {
  id: string;
  term: string;
  kind: 'approved' | 'prohibited' | 'preferred';
  replacement?: string;
  context_note?: string;
  severity: ViolationSeverity;
  status: string;
}

export interface ToneProfile {
  id: string;
  name: string;
  descriptors: string[];
  do_examples: string[];
  dont_examples: string[];
  formality: string;
  channel: string;
}

export interface ContentSubmission {
  id: string;
  title: string;
  content_type: string;
  channel: string;
  campaign: string;
  workflow_status: string;
  current_band: RiskBand;
  creator_id?: string;
  creator_name: string;
  body_snippet: string;
  revision_no: number;
  created_at: string;
}

export interface Violation {
  id: string;
  issue_code: string;
  category: string;
  severity: ViolationSeverity;
  submitted_text: string;
  span: { start: number; end: number };
  explanation: string;
  guideline_ref?: string;
  evidence_text?: string;
  suggested_correction?: string;
  confidence: string;
  status: string;
}

export interface ClaimVerification {
  id: string;
  claim_text: string;
  claim_type: string;
  normalized_value?: string;
  status: 'verified' | 'contradicted' | 'unsupported' | 'outdated' | 'needs_review';
  evidence_quote?: string;
  source_ref?: string;
  confidence: string;
  suggested_correction?: string;
}

export interface AiSuggestion {
  id: string;
  violation_id: string;
  original_text: string;
  replacement_text: string;
  rationale?: string;
  span: { start: number; end: number };
  state: 'pending' | 'accepted' | 'rejected';
}

export interface AuditResultData {
  audit: {
    id: string;
    submission_id: string;
    revision_id: string;
    status: string;
    ai_mode: string;
    completed_at: string;
  };
  content: {
    body_text: string;
    revision_no: number;
    content_hash: string;
  };
  risk: {
    risk_band: RiskBand;
    points: number;
    breakdown: Array<{
      issue_code: string;
      category: string;
      severity: string;
      points: number;
      explanation: string;
      guideline_ref: string;
    }>;
    category_counts: Record<string, number>;
  };
  violations: Violation[];
  claims: ClaimVerification[];
  suggestions: AiSuggestion[];
}

export interface ApprovalRecord {
  id: string;
  stage: string;
  decision: string;
  reason?: string;
  decided_by_name: string;
  decided_at: string;
}
