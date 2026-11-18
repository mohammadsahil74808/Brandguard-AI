import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  X,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import type { AuditResultData, AiSuggestion, Persona } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';

interface CorrectionStudioPageProps {
  submissionId: string;
  currentPersona: Persona | null;
  onReAuditComplete: (subId: string) => void;
  onSubmitForReview: () => void;
  onNavigate?: (tab: string) => void;
}

export const CorrectionStudioPage: React.FC<CorrectionStudioPageProps> = ({
  submissionId,
  currentPersona,
  onReAuditComplete,
  onSubmitForReview,
  onNavigate
}) => {
  const [data, setData] = useState<AuditResultData | null>(null);
  const [decisions, setDecisions] = useState<Record<string, 'accepted' | 'rejected' | 'pending'>>({});
  const [correctedText, setCorrectedText] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [reAuditDone, setReAuditDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [submissionId]);

  const loadData = async () => {
    if (!submissionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getLatestAudit(submissionId);
      setData(res);

      const initialDecisions: Record<string, 'accepted' | 'rejected' | 'pending'> = {};
      res.suggestions.forEach((s: AiSuggestion) => {
        initialDecisions[s.id] = 'pending';
      });
      setDecisions(initialDecisions);
      setCorrectedText(res.content.body_text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateCorrectedText = (newDecs: Record<string, 'accepted' | 'rejected' | 'pending'>) => {
    if (!data) return;
    let text = data.content.body_text;

    data.suggestions.forEach((s) => {
      const decision = newDecs[s.id];
      if (decision === 'accepted') {
        text = text.replace(s.original_text, s.replacement_text);
      }
    });

    setCorrectedText(text);
  };

  const handleDecision = async (suggId: string, state: 'accepted' | 'rejected') => {
    const updated = { ...decisions, [suggId]: state };
    setDecisions(updated);
    updateCorrectedText(updated);
    try {
      await api.updateSuggestion(suggId, state);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptAll = () => {
    if (!data) return;
    const updated: Record<string, 'accepted' | 'rejected' | 'pending'> = {};
    let text = data.content.body_text;
    data.suggestions.forEach((s) => {
      updated[s.id] = 'accepted';
      text = text.replace(s.original_text, s.replacement_text);
    });
    setDecisions(updated);
    setCorrectedText(text);
  };

  const handleApplyAndReAudit = async () => {
    setIsApplying(true);
    try {
      await api.createNewRevision(submissionId, {
        body_text: correctedText,
        change_summary: 'Applied accepted brand corrections via Correction Studio',
        created_by: currentPersona?.id
      });

      await api.triggerAudit(submissionId, true);
      setReAuditDone(true);
      setIsApplying(false);
      onReAuditComplete(submissionId);
      loadData();
    } catch (err) {
      console.error(err);
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-neutral-800 font-mono font-bold flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-crimson border-t-transparent animate-spin" />
        <span>Loading 1-Click Fix Studio...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white border-2 border-black rounded-2xl shadow-brutal text-center space-y-4 text-black">
        <div className="w-16 h-16 bg-cream-100 rounded-xl border-2 border-black p-2 mx-auto flex items-center justify-center shadow-brutal-sm">
          <img
            src="/illustrations/correction_workflow.png"
            alt="No Draft for Correction"
            className="h-12 w-auto object-contain"
          />
        </div>
        <h3 className="text-base font-black text-black">No Active Draft for Corrections</h3>
        <p className="text-xs font-bold text-neutral-800">
          Run a safety scan on a post first to view AI-generated 1-click fixes and suggestions.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('audit-workspace')}
          className="btn-3d-sm btn-3d-yellow px-5 py-2.5 text-xs"
        >
          Scan a Post Now ➜
        </button>
      </div>
    );
  }

  const acceptedCount = Object.values(decisions).filter(d => d === 'accepted').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-black">
      {/* Studio Header (Featuring correction_workflow.png) */}
      <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-5 text-black">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-popYellow border-2 border-black shadow-brutal-sm text-black">
              <Sparkles className="w-5 h-5 text-black" />
            </span>
            <h2 className="text-2xl font-black text-black tracking-tight">1-Click Fix Studio</h2>
          </div>
          <p className="text-xs font-bold text-neutral-800">
            Review suggestions, click Accept to fix errors, and preview your compliant post in real time!
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <RiskBadge band={data.risk.risk_band} points={data.risk.points} size="md" />
            <button
              onClick={handleAcceptAll}
              className="btn-3d-sm btn-3d-yellow px-4 py-2 text-xs gap-1.5"
            >
              <span className="text-black font-black">⚡ Accept All 5 Fixes at Once</span>
            </button>
          </div>
        </div>

        {/* Correction Workflow Illustration */}
        <div className="hidden sm:flex shrink-0 p-2 bg-cream-100 rounded-xl border-2 border-black shadow-brutal-sm">
          <img
            src="/illustrations/correction_workflow.png"
            alt="1-Click Correction Workflow"
            className="h-28 w-auto object-contain"
          />
        </div>
      </div>

      {/* Success banner if re-audit passed (Featuring safe_publishing.png) */}
      {reAuditDone && (
        <div className="p-6 sm:p-7 rounded-2xl bg-white text-black border-2 border-black shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-cream-100 rounded-xl border-2 border-black p-1 shrink-0 flex items-center justify-center shadow-brutal-sm">
              <img
                src="/illustrations/safe_publishing.png"
                alt="Safe Publishing Cleared"
                className="h-14 w-auto object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-black bg-popGreen px-2.5 py-0.5 rounded-full border border-black shadow-brutal-sm inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-pulse" />
                🚀 Safe to Publish
              </span>
              <h4 className="text-lg font-black text-black tracking-tight">All Errors Fixed! Risk Dropped to 0 (LOW)</h4>
              <p className="text-xs font-bold text-neutral-700 leading-relaxed">
                Revision #{data.content.revision_no} has passed all brand checks and is ready to send for team approval!
              </p>
            </div>
          </div>
          <button
            onClick={onSubmitForReview}
            className="btn-3d btn-3d-crimson px-6 py-3.5 text-xs gap-2 self-start sm:self-auto shrink-0"
          >
            <span className="text-white font-black">Send for Review ➜</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Split-Diff View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-black">
        {/* Left Pane: Original Draft */}
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-3 text-black">
          <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-crimson flex items-center gap-1.5">
              <span>Original Draft (Before Fixes)</span>
            </h3>
            <span className="text-[11px] font-mono font-bold bg-cream-200 text-black px-2 py-0.5 rounded border border-black">
              Rev #{data.content.revision_no}
            </span>
          </div>
          <div className="p-4 bg-cream-50 rounded-xl text-xs font-bold leading-relaxed text-black border-2 border-black/20 min-h-[140px]">
            {data.content.body_text}
          </div>
          <p className="text-[11px] text-neutral-800 font-bold">
            🔒 Original draft is saved in history so you can always compare changes.
          </p>
        </div>

        {/* Right Pane: Corrected Draft */}
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-3 border-emerald-700 text-black">
          <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <span>Updated Draft (After Fixes)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-popGreen text-black border border-black font-black">
                {acceptedCount} changes applied
              </span>
            </h3>
            <span className="text-[11px] font-mono font-black text-black">Live Editor</span>
          </div>
          <textarea
            rows={5}
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
            className="w-full text-xs font-sans font-bold p-4 bg-cream-50 rounded-xl text-black border-2 border-emerald-700 focus:outline-none focus:bg-white leading-relaxed"
          />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-neutral-800 font-bold">You can also edit this text manually before saving.</span>
            <button
              onClick={handleApplyAndReAudit}
              disabled={isApplying}
              className="btn-3d-sm btn-3d-crimson px-5 py-2.5 text-xs gap-2"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
              <span className="text-white font-black">{isApplying ? 'Re-Checking...' : 'Save Fixes & Check Again ➜'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggestion Cards */}
      <div className="space-y-4 text-black">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black rounded-xl shadow-brutal-sm text-xs font-black uppercase tracking-wider text-black">
            <Sparkles className="w-3.5 h-3.5 text-crimson" />
            <span>Individual Fix Recommendations ({data.suggestions.length})</span>
          </span>
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-popYellow text-black border border-black shadow-brutal-sm">
            ⚡ 1-Click Fixes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.suggestions.map((s) => {
            const currentDec = decisions[s.id] || 'pending';
            return (
              <div
                key={s.id}
                className={`relative p-5 rounded-2xl border-2 border-black transition-all text-black overflow-hidden ${
                  currentDec === 'accepted'
                    ? 'bg-cream-100 border-2 border-emerald-700 shadow-brutal'
                    : currentDec === 'rejected'
                    ? 'bg-cream-100 opacity-60'
                    : 'bg-white shadow-brutal-sm hover:shadow-brutal'
                }`}
              >
                {/* Visual Rubber Stamp Badge */}
                {currentDec === 'accepted' && (
                  <div className="stamp-bounce absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-popGreen text-black font-mono font-black text-[10px] uppercase tracking-wider rounded-lg border-2 border-black shadow-brutal-sm flex items-center gap-1 z-10">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>CORRECTED ✅</span>
                  </div>
                )}
                {currentDec === 'rejected' && (
                  <div className="stamp-bounce absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-cream-300 text-neutral-800 font-mono font-black text-[10px] uppercase tracking-wider rounded-lg border-2 border-black shadow-brutal-sm flex items-center gap-1 z-10">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                    <span>REJECTED ❌</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 text-black">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono line-through text-crimson bg-crimson-50 px-2 py-0.5 rounded border border-crimson font-black">
                        "{s.original_text}"
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-black" />
                      <span className="text-xs font-mono font-black text-black bg-popGreen px-2 py-0.5 rounded border border-black shadow-brutal-sm">
                        "{s.replacement_text || '[Remove]'}"
                      </span>
                    </div>
                    <p className="text-xs text-black font-bold leading-relaxed pt-1">{s.rationale}</p>
                  </div>

                  {/* Accept / Reject Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleDecision(s.id, 'accepted')}
                      className={`btn-3d-sm px-3.5 py-1.5 text-xs gap-1.5 ${
                        currentDec === 'accepted'
                          ? 'btn-3d-green'
                          : 'btn-3d-white hover:btn-3d-green'
                      }`}
                      title="Accept this correction"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-black font-black">Accept</span>
                    </button>
                    <button
                      onClick={() => handleDecision(s.id, 'rejected')}
                      className={`btn-3d-sm btn-3d-alt px-3.5 py-1.5 text-xs gap-1.5 ${
                        currentDec === 'rejected'
                          ? 'bg-cream-300 text-black'
                          : 'btn-3d-white'
                      }`}
                      title="Keep original text"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="text-black font-black">Keep Original</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
