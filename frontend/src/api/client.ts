const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Trans-Type': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || errorData.message || 'API request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {
  // Workspaces & Auth
  getWorkspaces: () => request<any[]>('/auth/workspaces'),
  getProfile: (userId?: string) => request<any>(`/auth/me${userId ? `?user_id=${userId}` : ''}`),
  getPersonas: (orgId?: string) => request<any[]>(`/auth/personas${orgId ? `?org_id=${orgId}` : ''}`),

  // Brand Knowledge Hub
  getGuidelines: (orgId?: string) => request<any[]>(`/guidelines/${orgId ? `?org_id=${orgId}` : ''}`),
  getGuidelineChunks: (id: string) => request<any[]>(`/guidelines/${id}/chunks`),
  getFacts: (orgId?: string) => request<any[]>(`/facts/${orgId ? `?org_id=${orgId}` : ''}`),
  getTerminology: (orgId?: string) => request<any[]>(`/facts/terminology${orgId ? `?org_id=${orgId}` : ''}`),
  getToneProfile: (orgId?: string) => request<any>(`/facts/tone${orgId ? `?org_id=${orgId}` : ''}`),
  uploadGuideline: async (formData: FormData) => {
    const response = await fetch(`${API_BASE}/guidelines/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return response.json();
  },

  // Submissions & Audits
  getSubmissions: (orgId?: string) => request<any[]>(`/submissions/${orgId ? `?org_id=${orgId}` : ''}`),
  getSubmissionDetail: (id: string) => request<any>(`/submissions/${id}`),
  createSubmission: (payload: { title: string; body_text: string; content_type?: string; channel?: string; campaign?: string; created_by?: string; org_id?: string }) =>
    request<any>('/submissions/', { method: 'POST', body: JSON.stringify(payload) }),
  createNewRevision: (submissionId: string, payload: { body_text: string; change_summary?: string; created_by?: string }) =>
    request<any>(`/submissions/${submissionId}/revisions`, { method: 'POST', body: JSON.stringify(payload) }),
  uploadContentSubmission: async (formData: FormData) => {
    const response = await fetch(`${API_BASE}/submissions/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Document upload failed' }));
      throw new Error(err.detail || 'Document upload failed');
    }
    return response.json();
  },

  triggerAudit: (submissionId: string, runAi: boolean = true) =>
    request<any>(`/submissions/${submissionId}/audits`, { method: 'POST', body: JSON.stringify({ run_ai: runAi }) }),
  getLatestAudit: (submissionId: string) => request<any>(`/submissions/${submissionId}/latest-audit`),
  getAuditResults: (auditId: string) => request<any>(`/audits/${auditId}/results`),
  updateSuggestion: (suggestionId: string, state: 'accepted' | 'rejected') =>
    request<any>(`/suggestions/${suggestionId}`, { method: 'PATCH', body: JSON.stringify({ state }) }),

  // Human Review & Approvals
  getReviewQueue: (stage?: string, orgId?: string) => {
    const params = new URLSearchParams();
    if (stage) params.append('stage', stage);
    if (orgId) params.append('org_id', orgId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/reviews/queue${qs}`);
  },
  submitForReview: (submissionId: string, userId?: string) =>
    request<any>(`/reviews/submissions/${submissionId}/submit`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  makeDecision: (submissionId: string, payload: { user_id: string; stage: string; decision: string; reason?: string; content_hash?: string }) =>
    request<any>(`/reviews/submissions/${submissionId}/decisions`, { method: 'POST', body: JSON.stringify(payload) }),
  getApprovals: (submissionId: string) => request<any[]>(`/reviews/submissions/${submissionId}/approvals`),

  // Analytics
  getAnalytics: (orgId?: string) => request<any>(`/analytics/overview${orgId ? `?org_id=${orgId}` : ''}`)
};
