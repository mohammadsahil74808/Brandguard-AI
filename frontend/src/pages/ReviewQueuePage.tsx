import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  Clock
} from 'lucide-react';
import { api } from '../api/client';
import { ContentSubmission, ApprovalRecord, Persona } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';

interface ReviewQueuePageProps {
  currentPersona: Persona | null;
  onOpenAudit: (subId: string) => void;
  activeOrgId?: string;
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({ currentPersona, onOpenAudit, activeOrgId }) => {
  const [items, setItems] = useState<ContentSubmission[]>([]);
  const [selectedSub, setSelectedSub] = useState<ContentSubmission | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [decisionReason, setDecisionReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, [activeOrgId]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const queue = await api.getReviewQueue(undefined, activeOrgId);
      setItems(queue);
      if (queue.length > 0) {
        setSelectedSub(queue[0]);
        const apprs = await api.getApprovals(queue[0].id);
        setApprovals(apprs);
      } else {
        setSelectedSub(null);
        setApprovals([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSub = async (sub: ContentSubmission) => {
    setSelectedSub(sub);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const apprs = await api.getApprovals(sub.id);
      setApprovals(apprs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMakeDecision = async (decision: 'approved' | 'revision_requested' | 'rejected') => {
    if (!selectedSub || !currentPersona) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    // Determine target stage based on current status
    let stage = 'manager';
    if (selectedSub.workflow_status === 'compliance_review') stage = 'compliance';
    if (selectedSub.workflow_status === 'final_approval') stage = 'final';

    try {
      const res = await api.makeDecision(selectedSub.id, {
        user_id: currentPersona.id,
        stage,
        decision,
        reason: decisionReason || (decision === 'approved' ? 'Verified against brand guidelines and evidence.' : undefined)
      });

      setSuccessMsg(`Decision '${decision.toUpperCase()}' recorded! New status: ${res.workflow_status.toUpperCase()}`);
      setDecisionReason('');

      // Refresh list
      loadQueue();
    } catch (err: any) {
      setErrorMsg(err.message || 'Decision failed');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-neutral-800 font-mono font-bold">Loading Review Queue...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-black">
      {/* Header (Featuring human_approval.png) */}
      <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-5 text-black">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-popYellow border-2 border-black shadow-brutal-sm text-black">
              <CheckSquare className="w-5 h-5 text-black" />
            </span>
            <h2 className="text-2xl font-black text-black tracking-tight">Team Review & Approvals</h2>
          </div>
          <p className="text-xs font-bold text-neutral-800">
            2-Step Sign Off: 1. Manager Review (Priya) ➜ 2. Legal Review (Kabir).
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs bg-cream-100 px-3.5 py-1.5 rounded-xl border-2 border-black text-black font-bold shadow-brutal-sm">
              Current Reviewer: <strong className="text-crimson font-black">{currentPersona?.full_name}</strong> ({currentPersona?.role_label})
            </span>
          </div>
        </div>

        {/* Human Approval Illustration */}
        <div className="hidden sm:flex shrink-0 p-2 bg-cream-100 rounded-xl border-2 border-black shadow-brutal-sm">
          <img
            src="/illustrations/human_approval.png"
            alt="Human Approval and Review"
            className="h-24 w-auto object-contain"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
        {/* Left: Queue Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black rounded-xl shadow-brutal-sm text-xs font-black uppercase tracking-wider text-black">
              <Clock className="w-3.5 h-3.5 text-crimson" />
              <span>Posts Waiting ({items.length})</span>
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-popGreen text-black border border-black shadow-brutal-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-800 animate-pulse" />
              Real-time
            </span>
          </div>

          {items.length === 0 ? (
            <div className="p-8 bg-white border-2 border-black rounded-2xl shadow-brutal text-center space-y-3">
              <div className="w-20 h-20 bg-cream-100 rounded-xl border-2 border-black p-2 mx-auto flex items-center justify-center">
                <img
                  src="/illustrations/human_approval.png"
                  alt="No Pending Approvals"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="text-xs font-bold text-neutral-800">
                No posts waiting in line! Submit a scanned draft to test the review pipeline.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isSelected = selectedSub?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSub(item)}
                    className={`p-5 rounded-2xl border-2 border-black cursor-pointer transition-all space-y-2.5 ${isSelected
                      ? 'bg-crimson text-white shadow-brutal -translate-x-0.5 -translate-y-0.5'
                      : 'bg-white hover:bg-cream-100 text-black shadow-brutal-sm hover:shadow-brutal'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-black line-clamp-1 ${isSelected ? 'text-white' : 'text-black'}`}>
                        {item.title}
                      </h4>
                      <RiskBadge band={item.current_band} size="sm" showPoints={false} />
                    </div>
                    <p className={`text-xs line-clamp-2 italic font-bold leading-relaxed ${isSelected ? 'text-white/90' : 'text-neutral-800'}`}>
                      "{item.body_snippet}"
                    </p>
                    <div className={`flex items-center justify-between text-xs font-bold pt-2 border-t-2 ${isSelected ? 'border-white/20 text-white' : 'border-black/10 text-black'}`}>
                      <span>Author: <strong className={isSelected ? 'text-white font-black' : 'text-black font-black'}>{item.creator_name}</strong></span>
                      <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded border ${isSelected
                        ? 'bg-popYellow text-black border-black shadow-brutal-sm font-black'
                        : 'bg-crimson-50 text-crimson border-crimson font-black'
                        }`}>
                        {item.workflow_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Review & Decision Card */}
        {selectedSub && (
          <div className="lg:col-span-2 space-y-5 text-black">
            <div className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 shadow-brutal space-y-6 text-black">
              {/* Submission Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
                <div>
                  <h3 className="text-lg font-black text-black">{selectedSub.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-800 font-bold mt-1">
                    <span>Channel: <strong className="uppercase text-crimson font-black">{selectedSub.channel}</strong></span>
                    <span>•</span>
                    <span>Campaign: <strong className="text-black">{selectedSub.campaign}</strong></span>
                    <span>•</span>
                    <span>Author: <strong className="text-black">{selectedSub.creator_name}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge band={selectedSub.current_band} size="md" />
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-popYellow text-black font-black uppercase border-2 border-black shadow-brutal-sm">
                    {selectedSub.workflow_status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-popCoral border-2 border-black text-xs text-black font-bold flex items-start gap-3 shadow-brutal-sm">
                  <ShieldAlert className="w-5 h-5 text-crimson shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block text-crimson">Rule Check Failed:</span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="p-4 rounded-xl bg-popGreen border-2 border-black text-xs text-black font-bold flex items-center gap-3 shadow-brutal-sm">
                  <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Content Body Preview */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-800">
                  Post Content Ready for Review
                </label>
                <div className="p-4 bg-cream-50 rounded-xl text-xs font-sans leading-relaxed text-black border-2 border-black/20 font-bold">
                  {selectedSub.body_snippet}
                </div>
              </div>

              {/* Separation of Duties Explanation Notice */}
              <div className="p-4 bg-popYellow rounded-xl border-2 border-black text-xs text-black space-y-1.5 shadow-brutal-sm">
                <p className="font-black text-black flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-black" />
                  Simple Approval Rules:
                </p>
                <p className="font-bold text-black">
                  1. <strong>Writers Cannot Self-Approve</strong>: The person who wrote the post (Rohan) cannot approve their own post.
                </p>
                <p className="font-bold text-black">
                  2. <strong>Two Different Reviewers</strong>: Manager (Priya) and Legal (Kabir) must be two different people.
                </p>
              </div>

              {/* Review History Trail */}
              <div className="space-y-3 border-t-2 border-black/10 pt-4">
                <h4 className="text-xs font-black text-black uppercase tracking-wider">
                  Audit Trail History ({approvals.length})
                </h4>
                {approvals.length === 0 ? (
                  <p className="text-xs text-neutral-800 font-bold italic">No approvals stamped yet.</p>
                ) : (
                  <div className="space-y-2">
                    {approvals.map((a) => (
                      <div key={a.id} className="p-3.5 rounded-xl bg-cream-50 border-2 border-black flex items-center justify-between text-xs text-black">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span className="font-black uppercase text-black">Stage: {a.stage}</span>
                          <span className="text-neutral-500">•</span>
                          <span className="text-black font-bold">Approved by <strong>{a.decided_by_name}</strong></span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-neutral-800">
                          {new Date(a.decided_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Decision Form */}
              <div className="border-t-2 border-black/10 pt-4 space-y-3">
                {selectedSub && currentPersona && (selectedSub.creator_name === currentPersona.full_name || selectedSub.creator_id === currentPersona.id) && (
                  <div className="p-3 bg-popYellow text-black border-2 border-black rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-brutal-sm">
                    <UserCheck className="w-4 h-4 text-black shrink-0" />
                    <span>
                      Notice: You are currently viewing as the Author (<strong>{currentPersona.full_name}</strong>). To test signing off this stage, switch persona to <strong>Priya (Manager)</strong> or <strong>Kabir (Legal)</strong> in the top bar!
                    </span>
                  </div>
                )}

                <label className="text-xs font-black uppercase tracking-wider text-neutral-800 block">
                  Reviewer Notes (Optional for approval, required for changes/rejection)
                </label>
                <textarea
                  rows={2}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Add approval comment or notes..."
                  className="w-full text-xs font-bold p-3.5 bg-cream-50 border-2 border-black rounded-xl text-black placeholder-neutral-500 focus:outline-none focus:bg-white"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => onOpenAudit(selectedSub.id)}
                    className="text-xs font-black text-crimson hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Inspect Scan Report & Citations ➜</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMakeDecision('revision_requested')}
                      className="btn-3d-sm btn-3d-yellow px-4 py-2.5 text-xs gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-black" />
                      <span className="text-black font-black">Request Changes</span>
                    </button>
                    <button
                      onClick={() => handleMakeDecision('rejected')}
                      className="btn-3d-sm btn-3d-coral btn-3d-alt px-4 py-2.5 text-xs gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-black" />
                      <span className="text-black font-black">Reject</span>
                    </button>
                    <button
                      onClick={() => handleMakeDecision('approved')}
                      className="btn-3d-sm btn-3d-green px-5 py-2.5 text-xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                      <span className="text-black font-black">Approve Stage ✅</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
