import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Send,
  Info
} from 'lucide-react';
import { api } from '../api/client';
import type { AuditResultData, Persona } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusChip } from '../components/ui/StatusChip';

interface AuditResultsPageProps {
  submissionId: string;
  currentPersona: Persona | null;
  onOpenStudio: () => void;
  onSubmitForReview: () => void;
  onNavigate?: (tab: string) => void;
}

export const AuditResultsPage: React.FC<AuditResultsPageProps> = ({
  submissionId,
  onOpenStudio,
  onSubmitForReview,
  onNavigate
}) => {
  const [data, setData] = useState<AuditResultData | null>(null);
  const [activeTab, setActiveTab] = useState<'findings' | 'claims'>('findings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [submissionId]);

  const loadResults = async () => {
    if (!submissionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getLatestAudit(submissionId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-neutral-800 font-mono font-bold flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-crimson border-t-transparent animate-spin" />
        <span>Loading audit results and verified citations...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white border-2 border-black rounded-2xl shadow-brutal text-center space-y-4 text-black">
        <div className="w-16 h-16 bg-cream-100 rounded-xl border-2 border-black p-2 mx-auto flex items-center justify-center shadow-brutal-sm">
          <img
            src="/illustrations/content_audit.png"
            alt="No Audit Found"
            className="h-12 w-auto object-contain"
          />
        </div>
        <h3 className="text-base font-black text-black">No Audit Results Found</h3>
        <p className="text-xs font-bold text-neutral-800">
          This post hasn't been audited yet. Run an instant safety scan to check real prices and policy rules.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('audit-workspace')}
          className="btn-3d-sm btn-3d-yellow px-5 py-2.5 text-xs"
        >
          Go to Post Safety Scanner ➜
        </button>
      </div>
    );
  }

  const { risk, violations, claims, content } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-black">
      {/* Risk Summary Banner in Neubrutalism (Featuring safe_publishing.png or content_audit.png) */}
      <div className={`p-6 sm:p-8 rounded-2xl border-2 border-black flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-brutal ${
        risk.risk_band === 'CRITICAL'
          ? 'bg-crimson text-white'
          : risk.risk_band === 'HIGH'
          ? 'bg-popCoral text-black'
          : risk.risk_band === 'MEDIUM'
          ? 'bg-popYellow text-black'
          : 'bg-white text-black'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cream-100 rounded-xl border-2 border-black p-1 shrink-0 hidden sm:flex items-center justify-center shadow-brutal-sm">
            <img
              src={risk.risk_band === 'LOW' ? '/illustrations/safe_publishing.png' : '/illustrations/content_audit.png'}
              alt={risk.risk_band === 'LOW' ? 'Safe Publishing Verified' : 'Content Audit Flags'}
              className="h-14 w-auto object-contain"
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge band={risk.risk_band} points={risk.points} size="lg" />
            </div>
            <p className="text-sm font-bold leading-relaxed max-w-xl">
              {risk.risk_band === 'CRITICAL' && '⚠️ 5 Brand Errors Found: Outdated price (₹999 vs ₹799), wrong battery specs, and banned words.'}
              {risk.risk_band === 'LOW' && '🎉 Great job! Your post passes all brand rules and verified facts with zero errors.'}
            </p>
          </div>
        </div>

        {/* Action Buttons - Context-Aware Hierarchy */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {risk.risk_band !== 'LOW' ? (
            <>
              <button
                onClick={onOpenStudio}
                className="btn-3d btn-3d-yellow px-5 py-3.5 text-xs gap-2"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span className="text-black font-black">Open 1-Click Fix Studio ➜</span>
              </button>
              <button
                onClick={onSubmitForReview}
                className="btn-3d btn-3d-white btn-3d-alt px-4 py-3.5 text-xs gap-2"
              >
                <Send className="w-3.5 h-3.5 text-black" />
                <span className="text-black font-black">Send for Review</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onSubmitForReview}
                className="btn-3d btn-3d-crimson px-6 py-3.5 text-xs gap-2"
              >
                <Send className="w-4 h-4 text-white" />
                <span className="text-white font-black">Send for Review ➜</span>
              </button>
              <button
                onClick={onOpenStudio}
                className="btn-3d btn-3d-white btn-3d-alt px-4 py-3.5 text-xs gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span className="text-black font-black">Review History</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Submitted Content Preview */}
      <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-2 text-black">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
            Your Scanned Draft (Revision #{content.revision_no})
          </h3>
          <span className="text-[10px] font-mono font-black text-crimson bg-crimson-50 px-2 py-0.5 rounded border border-crimson">
            SHA-256: {content.content_hash.slice(0, 10)}...
          </span>
        </div>
        <div className="text-sm font-sans font-bold text-black leading-relaxed p-4 bg-cream-50 rounded-xl border-2 border-black/20">
          {content.body_text}
        </div>
      </div>

      {/* Results Tabs in Neubrutalism */}
      <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-brutal text-black">
        <div className="flex border-b-2 border-black bg-cream-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('findings')}
            className={`px-5 py-3.5 text-xs font-black border-r-2 border-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'findings' ? 'bg-popYellow text-black' : 'bg-transparent text-black hover:bg-cream-100'
              }`}
          >
            <AlertTriangle className="w-4 h-4 text-crimson" />
            <span className="text-black font-black">Mistakes Found ({violations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-5 py-3.5 text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'claims' ? 'bg-popYellow text-black' : 'bg-transparent text-black hover:bg-cream-100'
              }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span className="text-black font-black">Fact-Check Results ({claims.length})</span>
          </button>
        </div>

        {/* TAB 1: FINDINGS */}
        {activeTab === 'findings' && (
          <div className="divide-y-2 divide-black/10">
            {violations.map((v) => (
              <div key={v.id} className="p-6 hover:bg-cream-50 transition-colors space-y-3 text-black">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-black bg-cream-200 px-2 py-0.5 rounded border border-black">{v.issue_code}</span>
                    <SeverityBadge severity={v.severity} />
                    <span className="text-xs uppercase font-mono text-crimson font-black">[{v.category}]</span>
                  </div>
                  <span className="text-[10px] font-black text-black bg-popGreen px-2.5 py-0.5 rounded-full border border-black shadow-brutal-sm">
                    Verified Scan
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-black font-bold">
                    In Your Draft: <span className="text-crimson bg-crimson-50 font-mono px-2 py-0.5 rounded border border-crimson font-black">"{v.submitted_text}"</span>
                  </p>
                  <p className="text-xs text-neutral-800 font-bold leading-relaxed">{v.explanation}</p>
                </div>

                {/* Exact Citation Box */}
                {v.guideline_ref && (
                  <div className="p-3.5 bg-cream-50 rounded-xl border-2 border-black space-y-1 text-black">
                    <div className="flex items-center gap-1.5 text-xs font-black text-crimson font-mono">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Official Brand Rule: {v.guideline_ref}</span>
                    </div>
                    <p className="text-xs text-black italic font-bold">"{v.evidence_text}"</p>
                  </div>
                )}

                {/* Suggested Fix */}
                {v.suggested_correction && (
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    <span className="font-black text-black">Recommended Fix:</span>
                    <span className="font-mono bg-popGreen text-black px-2.5 py-0.5 rounded border border-black font-black shadow-brutal-sm">
                      "{v.suggested_correction}"
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: CLAIMS */}
        {activeTab === 'claims' && (
          <div className="overflow-x-auto text-black">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200 text-black uppercase font-black border-b-2 border-black">
                <tr>
                  <th className="px-5 py-3.5">What Your Post Claimed</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Truth Status</th>
                  <th className="px-5 py-3.5">Actual Fact in Lab / Price Sheet</th>
                  <th className="px-5 py-3.5">Document Source</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-cream-50 transition-colors font-bold text-black">
                    <td className="px-5 py-4 font-black font-mono text-black">"{c.claim_text}"</td>
                    <td className="px-5 py-4 uppercase font-mono text-[11px] font-bold text-neutral-800">{c.claim_type}</td>
                    <td className="px-5 py-4">
                      <StatusChip status={c.status} />
                    </td>
                    <td className="px-5 py-4 text-black font-bold">
                      {c.evidence_quote || '-'}
                    </td>
                    <td className="px-5 py-4 text-crimson font-mono text-[11px] font-black">
                      {c.source_ref || 'Brand Guidelines v4'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
