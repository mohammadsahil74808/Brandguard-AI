import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { api } from '../api/client';
import { Tilt3DCard } from '../components/ui/Tilt3DCard';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';

interface AnalyticsPageProps {
  activeOrgId?: string;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ activeOrgId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [activeOrgId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics(activeOrgId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-16 text-center text-xs text-neutral-800 flex flex-col items-center justify-center gap-3 font-bold">
        <div className="w-8 h-8 rounded-full border-2 border-crimson border-t-transparent animate-spin" />
        <span>Loading Governance Analytics & Intelligence...</span>
      </div>
    );
  }

  const kpis = data.kpis || {
    total_submissions: 0,
    total_audits: 0,
    approved_rate: '100%',
    in_review: 0
  };
  const violations_by_category = data.violations_by_category || {};
  const risk_band_distribution = data.risk_band_distribution || {};
  const guideline_insights = data.guideline_insights || [];
  const recent_activities = data.recent_activities || data.recent_activity || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-black">
      {/* Header (Featuring quality_scorecard.png) */}
      <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-5 text-black">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-popYellow border-2 border-black shadow-brutal-sm text-black">
              <BarChart3 className="w-5 h-5 text-black" />
            </span>
            <h2 className="text-2xl font-black text-black tracking-tight">Post Quality & Safety Scorecard</h2>
          </div>
          <p className="text-xs font-bold text-neutral-800">
            Track common mistakes, see which errors happen most often, and view auto-generated tips to improve copy.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs bg-cream-100 px-3.5 py-1.5 rounded-xl border-2 border-black text-black font-mono font-bold shadow-brutal-sm">
              {activeOrgId?.includes('nova') ? '🧪 Brand Profile: NOVA TECH (Fictional Hardware Org)' : 'Brand Profile: Acme Audio Global (Q4 Pricing)'}
            </span>
          </div>
        </div>

        {/* Quality Scorecard Illustration */}
        <div className="hidden sm:flex shrink-0 p-2 bg-cream-100 rounded-xl border-2 border-black shadow-brutal-sm">
          <img
            src="/illustrations/quality_scorecard.png"
            alt="Brand Quality Scorecard"
            className="h-24 w-auto object-contain animate-float-3d"
          />
        </div>
      </div>

      {/* 4 Premium Neubrutalist 3D KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-black">
        {/* Card 1: Total Posts Checked */}
        <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="h-full">
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal flex flex-col justify-between h-full space-y-4 hover:shadow-brutal-lg transition-all">
            <div className="flex items-center justify-between tilt-depth-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">
                Total Posts Checked
              </span>
              <span className="p-2 rounded-xl bg-popYellow border-2 border-black shadow-brutal-sm text-black">
                <FileCheck2 className="w-4 h-4 text-black" />
              </span>
            </div>
            <div className="tilt-depth-2">
              <p className="text-4xl sm:text-5xl font-black font-mono text-black tracking-tight">
                <AnimatedCounter value={kpis.total_submissions} />
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold tilt-depth-1">
              <span className="text-neutral-700">Acme Audio campaign</span>
              <span className="font-mono text-[11px] font-black bg-cream-200 text-black px-2 py-0.5 rounded border border-black shadow-brutal-sm">
                Live Feed
              </span>
            </div>
          </div>
        </Tilt3DCard>

        {/* Card 2: Pass Rate */}
        <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="h-full">
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal flex flex-col justify-between h-full space-y-4 hover:shadow-brutal-lg transition-all">
            <div className="flex items-center justify-between tilt-depth-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">
                Pass Rate
              </span>
              <span className="p-2 rounded-xl bg-popGreen border-2 border-black shadow-brutal-sm text-black">
                <CheckCircle2 className="w-4 h-4 text-black" />
              </span>
            </div>
            <div className="tilt-depth-2">
              <p className="text-4xl sm:text-5xl font-black font-mono text-emerald-800 tracking-tight">
                <AnimatedCounter value={kpis.approved_rate} />
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold tilt-depth-1">
              <span className="text-neutral-700">Ready to publish</span>
              <span className={`font-mono text-[11px] font-black px-2 py-0.5 rounded border border-black shadow-brutal-sm ${
                kpis.approved_rate === '100%' ? 'bg-popGreen text-black' : 'bg-popCoral text-black'
              }`}>
                {kpis.approved_rate === '100%' ? 'Cleared' : 'Needs Fixes'}
              </span>
            </div>
          </div>
        </Tilt3DCard>

        {/* Card 3: Waiting for Approval */}
        <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="h-full">
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal flex flex-col justify-between h-full space-y-4 hover:shadow-brutal-lg transition-all">
            <div className="flex items-center justify-between tilt-depth-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">
                Waiting for Approval
              </span>
              <span className="p-2 rounded-xl bg-popCoral border-2 border-black shadow-brutal-sm text-black">
                <Clock className="w-4 h-4 text-black" />
              </span>
            </div>
            <div className="tilt-depth-2">
              <p className="text-4xl sm:text-5xl font-black font-mono text-black tracking-tight">
                <AnimatedCounter value={kpis.in_review} />
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold tilt-depth-1">
              <span className="text-neutral-700">In approval line</span>
              <span className="font-mono text-[11px] font-black bg-popYellow text-black px-2 py-0.5 rounded border border-black shadow-brutal-sm">
                {kpis.in_review > 0 ? `${kpis.in_review} Pending` : 'All Caught Up'}
              </span>
            </div>
          </div>
        </Tilt3DCard>

        {/* Card 4: Total Scans Run */}
        <Tilt3DCard maxTilt={8} scale={1.03} glare={true} className="h-full">
          <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal flex flex-col justify-between h-full space-y-4 hover:shadow-brutal-lg transition-all">
            <div className="flex items-center justify-between tilt-depth-1">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-800">
                Total Scans Run
              </span>
              <span className="p-2 rounded-xl bg-crimson text-white border-2 border-black shadow-brutal-sm">
                <Zap className="w-4 h-4 text-white fill-current" />
              </span>
            </div>
            <div className="tilt-depth-2">
              <p className="text-4xl sm:text-5xl font-black font-mono text-crimson tracking-tight">
                <AnimatedCounter value={kpis.total_audits} />
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t-2 border-black/10 text-xs font-bold tilt-depth-1">
              <span className="text-neutral-700">Full rule checks</span>
              <span className="font-mono text-[11px] font-black bg-crimson-50 text-crimson px-2 py-0.5 rounded border border-crimson shadow-brutal-sm">
                100% Real Facts
              </span>
            </div>
          </div>
        </Tilt3DCard>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
        {/* Violations by Category */}
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-4 text-black">
          <h3 className="text-base font-black text-black flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-crimson" />
            <span>Mistakes by Category</span>
          </h3>
          <div className="space-y-4">
            {Object.entries(violations_by_category).map(([cat, count]: [string, any]) => (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="capitalize text-black">{cat}</span>
                  <span className="font-mono text-crimson font-black text-sm">{count} issues</span>
                </div>
                <div className="h-3 w-full bg-cream-200 rounded-full overflow-hidden border-2 border-black">
                  <div
                    className="h-full bg-crimson rounded-full"
                    style={{ width: `${Math.min(100, (count / 5) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-4 text-black">
          <h3 className="text-base font-black text-black flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-800" />
            <span>Risk Level Distribution</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-crimson-50 border-2 border-crimson rounded-xl shadow-brutal-sm">
              <span className="text-xs font-black uppercase text-crimson block">Critical</span>
              <p className="text-3xl font-black text-crimson mt-1 font-mono">{risk_band_distribution['CRITICAL'] || 0}</p>
              <span className="text-[10px] text-neutral-800 font-bold mt-1 block">&ge; 25 pts (Blocker)</span>
            </div>
            <div className="p-4 bg-popCoral border-2 border-black rounded-xl shadow-brutal-sm">
              <span className="text-xs font-black uppercase text-black block">High</span>
              <p className="text-3xl font-black text-black mt-1 font-mono">{risk_band_distribution['HIGH'] || 0}</p>
              <span className="text-[10px] text-neutral-800 font-bold mt-1 block">12 - 24 pts (Major)</span>
            </div>
            <div className="p-4 bg-popYellow border-2 border-black rounded-xl shadow-brutal-sm">
              <span className="text-xs font-black uppercase text-black block">Medium</span>
              <p className="text-3xl font-black text-black mt-1 font-mono">{risk_band_distribution['MEDIUM'] || 0}</p>
              <span className="text-[10px] text-neutral-800 font-bold mt-1 block">4 - 11 pts (Minor)</span>
            </div>
            <div className="p-4 bg-popGreen border-2 border-black rounded-xl shadow-brutal-sm">
              <span className="text-xs font-black uppercase text-black block">Low (Clean)</span>
              <p className="text-3xl font-black text-black mt-1 font-mono">{risk_band_distribution['LOW'] || 0}</p>
              <span className="text-[10px] text-neutral-800 font-bold mt-1 block">0 - 3 pts (Safe)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Tips & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
        {/* Continuous Learning Insights */}
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-4 text-black">
          <h3 className="text-base font-black text-black flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-popYellow-dark" />
            <span>Helpful Writing Tips for Creators</span>
          </h3>
          <div className="space-y-3">
            {guideline_insights.length === 0 ? (
              <p className="text-xs font-bold text-neutral-600 p-4 bg-cream-50 rounded-xl border border-black">
                No recurring guideline issues detected. Your copy compliance is in great shape!
              </p>
            ) : (
              guideline_insights.map((insight: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-cream-50 border-2 border-black space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-crimson font-mono">Tip #{i + 1}</span>
                    <span className="text-[10px] uppercase font-black text-black bg-popYellow px-2 py-0.5 rounded border border-black shadow-brutal-sm">
                      {insight.type || insight.impact || 'Rule Insight'}
                    </span>
                  </div>
                  <p className="text-xs text-black font-bold leading-relaxed">
                    {insight.insight || insight.recommendation || insight.guideline}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Trail Timeline */}
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-4 text-black">
          <h3 className="text-base font-black text-black flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Recent System Activity</span>
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {recent_activities.length === 0 ? (
              <p className="text-xs font-bold text-neutral-600 p-4 bg-cream-50 rounded-xl border border-black">
                No recent system logs recorded yet.
              </p>
            ) : (
              recent_activities.map((act: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-cream-50 border-2 border-black flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono text-black font-bold block">{act.action}</span>
                    <span className="text-[11px] text-neutral-800 font-bold">{act.details || (act.actor ? `By ${act.actor} (${act.entity_type})` : 'Audit Event')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-800">
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
