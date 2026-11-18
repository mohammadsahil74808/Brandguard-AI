import React from 'react';
import {
  FileCheck,
  Clock,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Zap,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { ContentSubmission, RiskBand } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Tilt3DCard } from '../components/ui/Tilt3DCard';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';

interface DashboardPageProps {
  submissions: ContentSubmission[];
  onOpenAudit: (subId: string) => void;
  onNavigate: (tab: string) => void;
  onRunDemoAudit: (customSubId?: string) => void;
  activeOrgSlug?: 'acme-audio' | 'nova-tech';
  onSwitchWorkspace?: (slug: 'acme-audio' | 'nova-tech') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  submissions,
  onOpenAudit,
  onNavigate,
  onRunDemoAudit,
  activeOrgSlug = 'nova-tech',
  onSwitchWorkspace
}) => {
  const isNovaDemo = activeOrgSlug === 'nova-tech';
  const reviewItems = submissions.filter(s =>
    ['manager_review', 'compliance_review', 'final_approval'].includes(s.workflow_status)
  );

  return (
    <div className="space-y-6 text-black">
      {/* Neubrutalism Hero Card (Featuring brand_protection.png) */}
      <div className="bg-crimson text-white border-2 border-black rounded-2xl shadow-brutal-lg overflow-hidden">
        {/* Retro Window Bar */}
        <div className="bg-black/20 border-b-2 border-black px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black bg-[#C50337] shadow-[1px_1px_0px_0px_#121212]" style={{ backgroundColor: '#C50337' }} title="Signature Red" />
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black bg-[#FBF8F3] shadow-[1px_1px_0px_0px_#121212]" style={{ backgroundColor: '#FBF8F3' }} title="Warm Creme" />
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black bg-[#FFDE59] shadow-[1px_1px_0px_0px_#121212]" style={{ backgroundColor: '#FFDE59' }} title="Pop Yellow" />
            <span className="text-[11px] font-mono font-bold text-white ml-2">
              BrandGuard AI v1.0 — {isNovaDemo ? 'NOVA TECH Interactive Demo Console' : 'Post Safety Inspector'}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-popYellow text-black px-2.5 py-0.5 rounded border border-black shadow-brutal-sm">
            {isNovaDemo ? '🧪 Fictional Demo Workspace' : '★ Easy Mode Active'}
          </span>
        </div>

        {/* Hero Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 8 Cols: Value Prop & Actions */}
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-white text-crimson border-2 border-black shadow-brutal-sm">
                  {isNovaDemo ? '⚡ ZERO CONFIG NEEDED' : '✨ SIMPLE & EASY TO USE'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-popYellow text-black border-2 border-black shadow-brutal-sm">
                  100% REAL BRAND FACTS
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-popGreen text-black border-2 border-black shadow-brutal-sm">
                  NO FAKE CLAIMS
                </span>
              </div>

              <div className="space-y-2 max-w-2xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
                  {isNovaDemo ? (
                    <>
                      Test Live Brand Audits <br />
                      <span className="text-popYellow underline decoration-black decoration-4 underline-offset-[14px] inline-block pb-1">
                        With NOVA TECH Demo!
                      </span>
                    </>
                  ) : (
                    <>
                      Check Your Marketing Posts <br />
                      <span className="text-popYellow underline decoration-black decoration-4 underline-offset-[14px] inline-block pb-1">
                        Before You Post Them!
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-sm sm:text-base text-white font-bold leading-relaxed">
                  {isNovaDemo
                    ? 'Explore pre-configured brand rules for NOVA Buds Pro, Watch Ultra & Pad 11. Run an AI safety scan to catch price mismatches, fake battery specs, and banned superlatives in 3 seconds.'
                    : 'Catches expired prices (like ₹999 instead of ₹799), wrong specs (32h vs 40h battery), and banned words in seconds — with 1-click automatic fixes!'}
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isNovaDemo ? (
                  <>
                    <button
                      onClick={() => onRunDemoAudit('nova-sub-0000-0000-0000-000000000001')}
                      className="btn-3d btn-3d-yellow px-5 py-3 text-sm gap-2 cursor-pointer"
                      title="Run live AI audit on a post with 5 deliberate violations (price, battery spec, banned claims)"
                    >
                      <AlertTriangle className="w-4 h-4 text-crimson fill-current" />
                      <span className="text-black font-black">Audit Faulty Ad (5 Errors)</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>

                    <button
                      onClick={() => onRunDemoAudit('nova-sub-0000-0000-0000-000000000002')}
                      className="btn-3d btn-3d-green px-5 py-3 text-sm gap-2 cursor-pointer"
                      title="Run live AI audit on a 100% compliant post"
                    >
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span className="text-black font-black">Audit Compliant Ad (Clean)</span>
                    </button>

                    <button
                      onClick={() => onNavigate('audit-workspace')}
                      className="btn-3d btn-3d-white btn-3d-alt px-4 py-3 text-sm gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-black" />
                      <span className="text-black font-black">Upload / Test Own Copy</span>
                    </button>

                    <button
                      onClick={() => onNavigate('brand-hub')}
                      className="btn-3d btn-3d-white btn-3d-alt px-4 py-3 text-sm gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-black" />
                      <span className="text-black font-black">View NOVA Guidelines</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onRunDemoAudit()}
                      className="btn-3d btn-3d-yellow px-6 py-3.5 text-sm gap-2 cursor-pointer"
                    >
                      <Zap className="w-5 h-5 text-black fill-current" />
                      <span className="text-black font-black">Try Instant Test Post</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>

                    <button
                      onClick={() => onNavigate('audit-workspace')}
                      className="btn-3d btn-3d-white btn-3d-alt px-5 py-3.5 text-sm gap-2 cursor-pointer"
                    >
                      <span className="text-black font-black">✍️ Write Your Own Post</span>
                    </button>

                    {onSwitchWorkspace && (
                      <button
                        onClick={() => onSwitchWorkspace('nova-tech')}
                        className="btn-3d btn-3d-yellow px-5 py-3.5 text-sm gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-black" />
                        <span className="text-black font-black">Switch to NOVA TECH Demo</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right 4 Cols: Brand Protection 3D Tilt Illustration Card */}
            <div className="hidden lg:flex lg:col-span-4 justify-center">
              <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="w-full max-w-[250px]">
                <div className="bg-white rounded-2xl border-2 border-black p-4 shadow-brutal flex flex-col items-center text-center w-full">
                  <div className="w-full bg-cream-100 rounded-xl border-2 border-black p-3 flex items-center justify-center">
                    <img
                      src="/illustrations/brand_protection.png"
                      alt="Brand Protection AI Engine"
                      className="h-44 w-auto object-contain animate-float-3d"
                    />
                  </div>
                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-crimson bg-crimson-50 px-2.5 py-0.5 rounded-full border border-crimson inline-block shadow-brutal-sm">
                      🛡️ AI Brand Shield
                    </span>
                    <p className="text-xs font-black text-black">{isNovaDemo ? 'NOVA TECH AI Guard' : 'Acme Audio AI Guard'}</p>
                    <p className="text-[10px] font-bold text-neutral-600">Active Policy Defense</p>
                  </div>
                </div>
              </Tilt3DCard>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step Simple How It Works Guide */}
      <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-5 shadow-brutal text-black">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="p-2.5 rounded-xl bg-popYellow border-2 border-black shadow-brutal-sm text-black">
              <Sparkles className="w-5 h-5 text-black fill-current" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-600">How to use in 60 seconds</p>
              <h3 className="text-sm font-black text-black">3 Simple Steps to 100% Brand Safety</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="p-2.5 rounded-xl bg-cream-50 border-2 border-black flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-black text-white font-mono font-black text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <p className="text-xs font-black text-black">Pick or Paste Copy</p>
                <p className="text-[11px] font-bold text-neutral-600">Click a test ad or upload doc</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-cream-50 border-2 border-black flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-popYellow text-black font-mono font-black text-xs flex items-center justify-center shrink-0 border border-black">2</span>
              <div>
                <p className="text-xs font-black text-black">AI Scans Violations</p>
                <p className="text-[11px] font-bold text-neutral-600">Finds price, spec & tone issues</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-cream-50 border-2 border-black flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-popGreen text-black font-mono font-black text-xs flex items-center justify-center shrink-0 border border-black">3</span>
              <div>
                <p className="text-xs font-black text-black">1-Click Fix & Approve</p>
                <p className="text-[11px] font-bold text-neutral-600">Accept fixes & submit to manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Premium Neubrutalist 3D Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Submissions */}
        <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="h-full">
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal flex flex-col justify-between h-full space-y-4 hover:shadow-brutal-lg transition-all text-black">
            <div className="flex items-center justify-between text-black tilt-depth-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">Posts Checked</span>
              <span className="p-2 rounded-xl bg-popYellow border-2 border-black shadow-brutal-sm text-black">
                <FileCheck className="w-4 h-4 text-black" />
              </span>
            </div>
            <div className="tilt-depth-2">
              <p className="text-4xl sm:text-5xl font-black font-mono text-black tracking-tight">
                <AnimatedCounter value={submissions.length} />
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold tilt-depth-1">
              <span className="text-neutral-700">Acme Audio Campaign</span>
              <span className="font-mono text-[11px] font-black bg-cream-200 text-black px-2 py-0.5 rounded border border-black shadow-brutal-sm">
                Live
              </span>
            </div>
          </div>
        </Tilt3DCard>

        {/* Card 2: Needs Review */}
        <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="h-full">
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal flex flex-col justify-between h-full space-y-4 hover:shadow-brutal-lg transition-all text-black">
            <div className="flex items-center justify-between text-black tilt-depth-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">Waiting Approval</span>
              <span className="p-2 rounded-xl bg-popCoral border-2 border-black shadow-brutal-sm text-black">
                <Clock className="w-4 h-4 text-black" />
              </span>
            </div>
            <div className="tilt-depth-2">
              <p className="text-4xl sm:text-5xl font-black font-mono text-black tracking-tight">
                <AnimatedCounter value={reviewItems.length} />
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold tilt-depth-1">
              <span className="text-neutral-700">Manager & Legal checks</span>
              <span className="font-mono text-[11px] font-black bg-popYellow text-black px-2 py-0.5 rounded border border-black shadow-brutal-sm">
                {reviewItems.length > 0 ? 'Pending' : 'Done'}
              </span>
            </div>
          </div>
        </Tilt3DCard>

        {/* Card 3: Brand Rules */}
        <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="h-full">
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal flex flex-col justify-between h-full space-y-4 hover:shadow-brutal-lg transition-all text-black">
            <div className="flex items-center justify-between text-black tilt-depth-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">Official Rules</span>
              <span className="p-2 rounded-xl bg-popGreen border-2 border-black shadow-brutal-sm text-black">
                <BookOpen className="w-4 h-4 text-black" />
              </span>
            </div>
            <div className="tilt-depth-2">
              <p className="text-4xl sm:text-5xl font-black font-mono text-black tracking-tight">
                <AnimatedCounter value="1 Pack" />
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold tilt-depth-1">
              <span className="text-neutral-700 truncate">Acme Audio v4 (Q4)</span>
              <span className="font-mono text-[11px] font-black bg-popGreen text-black px-2 py-0.5 rounded border border-black shadow-brutal-sm">
                Approved
              </span>
            </div>
          </div>
        </Tilt3DCard>

        {/* Card 4: Citations */}
        <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="h-full">
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal flex flex-col justify-between h-full space-y-4 hover:shadow-brutal-lg transition-all text-black">
            <div className="flex items-center justify-between text-black tilt-depth-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">Fact Accuracy</span>
              <span className="p-2 rounded-xl bg-crimson text-white border-2 border-black shadow-brutal-sm">
                <ShieldCheck className="w-4 h-4 text-white" />
              </span>
            </div>
            <div className="tilt-depth-2">
              <p className="text-4xl sm:text-5xl font-black font-mono text-crimson tracking-tight">
                <AnimatedCounter value="100%" />
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold tilt-depth-1">
              <span className="text-neutral-700">Verified Evidence</span>
              <span className="font-mono text-[11px] font-black bg-crimson-50 text-crimson px-2 py-0.5 rounded border border-crimson shadow-brutal-sm">
                Zero Guesswork
              </span>
            </div>
          </div>
        </Tilt3DCard>
      </div>

      {/* Active Posts & Scans List */}
      <div className="bg-white border-2 border-black rounded-2xl shadow-brutal overflow-hidden text-black">
        {/* Section Header */}
        <div className="bg-cream-200 border-b-2 border-black px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-black">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-crimson border border-black animate-pulse" />
              <h3 className="text-base font-black text-black">
                Recent Posts in Your Drafts ({submissions.length})
              </h3>
            </div>
            <p className="text-xs font-bold text-neutral-800">
              Check results, review warnings, or open the 1-click fix studio
            </p>
          </div>

          <button
            onClick={() => onNavigate('audit-workspace')}
            className="btn-3d-sm btn-3d-yellow px-3.5 py-2 text-xs gap-1.5 self-start sm:self-auto"
          >
            <span className="text-black font-black">+ Scan New Post</span>
          </button>
        </div>

        {/* Posts List */}
        <div className="divide-y-2 divide-black/10">
          {submissions.length === 0 ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-cream-100 rounded-xl border-2 border-black p-2 mx-auto flex items-center justify-center shadow-brutal-sm">
                <img
                  src="/illustrations/employee_workspace.png"
                  alt="No Submissions"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-xs font-bold text-neutral-800">
                No draft posts yet! Start by testing the golden demo post or pasting your own caption.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => onRunDemoAudit()}
                  className="btn-3d-sm btn-3d-yellow px-4 py-2.5 text-xs"
                >
                  ⚡ Try Instant Test Post
                </button>
                <button
                  onClick={() => onNavigate('audit-workspace')}
                  className="btn-3d-sm btn-3d-white btn-3d-alt px-4 py-2.5 text-xs"
                >
                  ✏️ Paste New Caption
                </button>
              </div>
            </div>
          ) : (
            submissions.map((sub, idx) => (
            <div
              key={sub.id}
              className="p-6 hover:bg-cream-100 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5 text-black"
            >
              <div className="space-y-2 max-w-2xl text-black">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black bg-cream-200 text-black px-2 py-0.5 rounded border border-black">
                    #{idx + 1}
                  </span>
                  <h4 className="text-base font-black text-black">{sub.title}</h4>
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-popPurple text-black border border-black uppercase">
                    📱 {sub.channel}
                  </span>
                  <span className="text-xs font-bold text-neutral-800">
                    Campaign: {sub.campaign}
                  </span>
                </div>

                {/* Speech Bubble Snippet */}
                <div className="p-3 bg-cream-50 rounded-xl border-2 border-black/20 text-xs font-bold text-black leading-relaxed">
                  "{sub.body_snippet}"
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-neutral-800">
                  <span>Created by: <strong className="text-black">{sub.creator_name}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="uppercase text-crimson font-black">{sub.workflow_status.replace('_', ' ')}</strong></span>
                  <span>•</span>
                  <span>Revision #{sub.revision_no}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <RiskBadge band={sub.current_band as RiskBand} size="md" />
                <button
                  onClick={() => onOpenAudit(sub.id)}
                  className="btn-3d-sm btn-3d-crimson px-4 py-2.5 text-xs gap-1.5"
                >
                  <span className="text-white font-black">See Scan Report</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
};
