import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  DollarSign,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Clock,
  Palette
} from 'lucide-react';
import { api } from '../api/client';
import type { Guideline, ApprovedFact, TerminologyItem, ToneProfile, GuidelineChunk } from '../types';

interface BrandHubPageProps {
  activeOrgId?: string;
  activeOrgSlug?: 'acme-audio' | 'nova-tech';
}

export const BrandHubPage: React.FC<BrandHubPageProps> = ({
  activeOrgId = 'nova-tech-demo-0000-0000-0000-000000000001',
  activeOrgSlug = 'nova-tech'
}) => {
  const isNovaDemo = activeOrgSlug === 'nova-tech';
  const [activeTab, setActiveTab] = useState<'guidelines' | 'facts' | 'terminology' | 'tone' | 'assets' | 'upload'>('guidelines');
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [selectedGuideline, setSelectedGuideline] = useState<Guideline | null>(null);
  const [chunks, setChunks] = useState<GuidelineChunk[]>([]);
  const [facts, setFacts] = useState<ApprovedFact[]>([]);
  const [terms, setTerms] = useState<TerminologyItem[]>([]);
  const [tone, setTone] = useState<ToneProfile | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Product Guidelines');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeOrgId]);

  const loadData = async () => {
    try {
      const [gList, fList, tList, toneData] = await Promise.all([
        api.getGuidelines(activeOrgId),
        api.getFacts(activeOrgId),
        api.getTerminology(activeOrgId),
        api.getToneProfile(activeOrgId)
      ]);
      setGuidelines(gList);
      if (gList.length > 0) {
        setSelectedGuideline(gList[0]);
        const cList = await api.getGuidelineChunks(gList[0].id);
        setChunks(cList);
      } else {
        setSelectedGuideline(null);
        setChunks([]);
      }
      setFacts(fList);
      setTerms(tList);
      setTone(toneData);
    } catch (err) {
      console.error('Failed to load Brand Hub data:', err);
    }
  };

  const handleSelectGuideline = async (g: Guideline) => {
    setSelectedGuideline(g);
    try {
      const cList = await api.getGuidelineChunks(g.id);
      setChunks(cList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) {
      setUploadMsg({ type: 'error', text: 'Please provide a guideline title and select a file.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('category', uploadCategory);
    if (activeOrgId) {
      formData.append('org_id', activeOrgId);
    }

    try {
      const res = await api.uploadGuideline(formData);
      setUploadMsg({
        type: 'success',
        text: `Successfully ingested "${res.title}". Parsed ${res.sections_parsed} sections with status: ${res.status.toUpperCase()}.`
      });
      loadData();
      setUploadTitle('');
      setUploadFile(null);
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err.message || 'Upload failed' });
    }
  };

  return (
    <div className="space-y-6 text-black">
      {/* Page Header */}
      <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-popYellow border-2 border-black shadow-brutal-sm text-black">
              <BookOpen className="w-5 h-5 text-black" />
            </span>
            <h2 className="text-2xl font-black text-black tracking-tight">Brand Cheat Sheet & Rules</h2>
          </div>
          <p className="text-xs font-bold text-neutral-800 mt-1">
            Real brand facts: Verified prices, active specs, banned words, and writing tone — no guesswork!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-popGreen text-black border-2 border-black shadow-brutal-sm">
            {isNovaDemo ? '🧪 NOVA TECH · Fictional Brand Hub Active' : 'Acme Audio v4 Active'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-black gap-2 overflow-x-auto pb-2 text-black">
        {[
          { id: 'guidelines', label: '📖 Official Rules', icon: BookOpen },
          { id: 'facts', label: '💰 Prices & Specs', icon: DollarSign },
          { id: 'terminology', label: '🚫 Banned Words', icon: AlertTriangle },
          { id: 'tone', label: '🎙️ Brand Voice', icon: FileText },
          { id: 'assets', label: '🎨 Colors & Assets', icon: Palette },
          { id: 'upload', label: '📤 Upload Rulebook', icon: Upload }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`btn-3d-sm flex items-center gap-2 px-4 py-2.5 text-xs whitespace-nowrap ${isActive
                ? 'btn-3d-crimson'
                : 'btn-3d-white'
                }`}
            >
              <span className={isActive ? 'text-white font-black' : 'text-black font-black'}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GUIDELINES & SECTIONS (Featuring brand_guidelines.png) */}
      {activeTab === 'guidelines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-black">
          {/* Left: Guideline List */}
          <div className="space-y-3 text-black">
            {/* Brand Guidelines Illustration Card */}
            <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-brutal-sm flex items-center gap-4">
              <div className="w-20 h-20 bg-cream-100 rounded-xl border-2 border-black p-1 shrink-0 flex items-center justify-center">
                <img
                  src="/illustrations/brand_guidelines.png"
                  alt="Brand Guidelines Rulebook"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-crimson bg-crimson-50 px-2 py-0.5 rounded border border-crimson">
                  Official Rulebook
                </span>
                <h4 className="text-xs font-black text-black">Acme Audio v4 Guidelines</h4>
                <p className="text-[11px] font-bold text-neutral-700">16 indexed rules verified by brand council.</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black rounded-xl shadow-brutal-sm text-xs font-black uppercase tracking-wider text-black">
                <BookOpen className="w-3.5 h-3.5 text-crimson" />
                <span>Brand Rulebooks ({guidelines.length})</span>
              </span>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-popYellow text-black border border-black shadow-brutal-sm">
                Official Sources
              </span>
            </div>
            {guidelines.map((g) => {
              const isSelected = selectedGuideline?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => handleSelectGuideline(g)}
                  className={`p-5 rounded-2xl border-2 border-black cursor-pointer transition-all ${isSelected
                    ? 'bg-crimson text-white shadow-brutal -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white hover:bg-cream-100 text-black shadow-brutal-sm hover:shadow-brutal'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className={`text-sm font-black ${isSelected ? 'text-white' : 'text-black'}`}>{g.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase border border-black ${isSelected ? 'bg-popYellow text-black' : 'bg-popGreen text-black'
                      }`}>
                      {g.status}
                    </span>
                  </div>
                  <p className={`text-xs font-bold mt-1 ${isSelected ? 'text-white/90' : 'text-neutral-700'}`}>{g.category} · {g.department}</p>
                  <div className={`flex items-center justify-between text-xs font-bold mt-4 pt-3 border-t-2 ${isSelected ? 'border-white/30 text-white' : 'border-black/10 text-black'
                    }`}>
                    <span className="font-mono">{g.chunks_count} Evidence Citations</span>
                    <span className={`flex items-center gap-1 font-black ${isSelected ? 'text-popYellow' : 'text-crimson'
                      }`}>
                      Inspect ➜
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Section Tree / Chunks */}
          <div className="lg:col-span-2 bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-4 text-black">
            <div className="border-b-2 border-black/10 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-black">{selectedGuideline?.title || 'Sections'}</h3>
                <p className="text-xs font-bold text-neutral-800">Exact paragraphs used to check your copy for errors</p>
              </div>
              <span className="text-xs font-mono font-bold bg-cream-200 text-black border-2 border-black px-2.5 py-1 rounded-lg">
                {chunks.length} sections indexed
              </span>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
              {chunks.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-cream-50 border-2 border-black space-y-2 text-black">
                  <div className="flex items-center justify-between">
                    {/* High contrast section pill (Fix for Image 2) */}
                    <span className="text-xs font-mono font-black text-crimson bg-crimson-50 px-2.5 py-1 rounded-lg border-2 border-crimson">
                      {c.section_path}
                    </span>
                    <span className="text-[11px] text-neutral-800 font-bold">Page {c.page_start}</span>
                  </div>
                  <p className="text-xs text-black leading-relaxed font-bold">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FACTS (Featuring knowledge_base.png) */}
      {activeTab === 'facts' && (
        <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-brutal text-black">
          <div className="p-5 border-b-2 border-black bg-cream-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="text-[10px] font-black uppercase text-black bg-popGreen px-2.5 py-0.5 rounded-full border border-black">
                🧠 Knowledge Base
              </span>
              <h3 className="text-base font-black text-black">Approved Facts Knowledge Base</h3>
              <p className="text-xs font-bold text-neutral-800">
                Current active Q4 prices vs expired Q3 prices. All facts are cross-referenced with lab tests and official price sheets.
              </p>
            </div>
            <div className="hidden sm:flex shrink-0 p-1.5 bg-white rounded-xl border-2 border-black shadow-brutal-sm">
              <img
                src="/illustrations/knowledge_base.png"
                alt="Knowledge Base Repository"
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>
          <div className="overflow-x-auto text-black">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200 text-black uppercase font-black border-b-2 border-black">
                <tr>
                  <th className="px-5 py-3.5">Product & Feature</th>
                  <th className="px-5 py-3.5">Attribute</th>
                  <th className="px-5 py-3.5">Approved Value</th>
                  <th className="px-5 py-3.5">Source Doc</th>
                  <th className="px-5 py-3.5">Dates Valid</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {facts.map((f) => (
                  <tr key={f.id} className="hover:bg-cream-50 transition-colors font-bold text-black">
                    <td className="px-5 py-4 font-bold text-black">
                      <div className="font-mono text-crimson font-black">{f.fact_key}</div>
                      <div className="text-[11px] text-neutral-800">{f.entity}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-black">{f.attribute}</td>
                    <td className="px-5 py-4 font-black text-black text-sm bg-popYellow">
                      {f.value_text}
                    </td>
                    <td className="px-5 py-4 text-neutral-800 font-bold">{f.source_section || 'Acme Spec Sheet'}</td>
                    <td className="px-5 py-4 text-neutral-800 font-mono text-[11px]">
                      {f.valid_from} to {f.valid_to || 'Ongoing'}
                    </td>
                    <td className="px-5 py-4">
                      {f.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-popGreen text-black border-2 border-black shadow-brutal-sm">
                          <CheckCircle2 className="w-3 h-3 text-black" /> ACTIVE NOW ✅
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-popCoral text-black border-2 border-black shadow-brutal-sm">
                          <Clock className="w-3 h-3 text-black" /> EXPIRED ❌
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TERMINOLOGY */}
      {activeTab === 'terminology' && (
        <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-brutal text-black">
          <div className="p-5 border-b-2 border-black bg-cream-100">
            <h3 className="text-base font-black text-black">Banned Words & Allowed Alternatives</h3>
            <p className="text-xs font-bold text-neutral-800">
              Words like "cheapest" and "world's best" create legal trouble. Here is what to say instead:
            </p>
          </div>
          <div className="overflow-x-auto text-black">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200 text-black uppercase font-black border-b-2 border-black">
                <tr>
                  <th className="px-5 py-3.5">Banned Word / Slang</th>
                  <th className="px-5 py-3.5">Why It's Flagged</th>
                  <th className="px-5 py-3.5">What to Say Instead</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {terms.map((t) => (
                  <tr key={t.id} className="hover:bg-cream-50 transition-colors font-bold text-black">
                    <td className="px-5 py-4 font-black font-mono text-crimson bg-crimson-50 border-r border-black/10">
                      "{t.term}"
                    </td>
                    <td className="px-5 py-4">
                      <span className="uppercase text-[10px] font-black px-2 py-0.5 rounded bg-popYellow text-black border border-black">
                        {t.kind}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black font-mono text-black bg-popGreen">
                      "{t.replacement || 'Remove term'}"
                    </td>
                    <td className="px-5 py-4 uppercase font-mono text-[11px] font-bold text-black">{t.severity}</td>
                    <td className="px-5 py-4 text-neutral-800 font-bold">{t.context_note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TONE */}
      {activeTab === 'tone' && tone && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
          <div className="bg-white border-2 border-black p-6 rounded-2xl shadow-brutal space-y-4 text-black">
            <h3 className="text-base font-black text-black">Brand Voice Profile: {tone.name}</h3>
            <div className="flex flex-wrap gap-2">
              {tone.descriptors.map((d, i) => (
                <span key={i} className="px-3 py-1 bg-popYellow text-black text-xs font-black rounded-full border-2 border-black shadow-brutal-sm">
                  {d}
                </span>
              ))}
            </div>
            <p className="text-xs font-bold text-neutral-800">
              Formality: <span className="font-black text-black uppercase">{tone.formality}</span> · Channel: <span className="font-black text-black uppercase">{tone.channel}</span>
            </p>
          </div>

          <div className="bg-white border-2 border-black p-6 rounded-2xl shadow-brutal space-y-4 text-black">
            <h3 className="text-base font-black text-black">Do & Don't Guidelines</h3>
            <div className="space-y-3 text-xs">
              <p className="font-black text-emerald-800 flex items-center gap-1.5">✓ APPROVED DO EXAMPLES:</p>
              <ul className="list-disc list-inside text-black font-bold space-y-1">
                {tone.do_examples.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="font-black text-crimson flex items-center gap-1.5 mt-3">✕ PROHIBITED DON'T EXAMPLES:</p>
              <ul className="list-disc list-inside text-black font-bold space-y-1">
                {tone.dont_examples.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BRAND ASSETS (Featuring brand_assets.png) */}
      {activeTab === 'assets' && (
        <div className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 shadow-brutal space-y-6 text-black">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b-2 border-black/10">
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-crimson bg-crimson-50 px-2.5 py-0.5 rounded-full border border-crimson">
                {isNovaDemo ? '🧪 Fictional Company Design System' : 'Official Design Tokens'}
              </span>
              <h3 className="text-2xl font-black text-black">
                {isNovaDemo ? 'NOVA TECH Brand Asset & Design Kit' : 'Acme Audio Brand Asset Kit'}
              </h3>
              <p className="text-xs font-bold text-neutral-800 leading-relaxed">
                {isNovaDemo
                  ? 'Approved identity elements for NOVA TECH: Electric Indigo, Neon Mint, Midnight Slate, approved product fact sheets, and verified claim boundaries.'
                  : 'Verified identity elements: official logo lockups, primary color formulas, approved typography hierarchies, and social banner templates.'}
              </p>
            </div>

            <div className="p-3 bg-cream-100 rounded-2xl border-2 border-black shadow-brutal flex items-center justify-center shrink-0">
              <img
                src="/illustrations/brand_assets.png"
                alt="Official Brand Assets"
                className="h-36 sm:h-44 w-auto object-contain"
              />
            </div>
          </div>

          {/* Palette & Tokens Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {isNovaDemo ? (
              <>
                <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-2">
                  <div className="h-12 w-full rounded-lg bg-[#4F46E5] border-2 border-black" />
                  <p className="text-xs font-black text-black">Electric Indigo</p>
                  <span className="font-mono text-[11px] font-bold text-neutral-700">#4F46E5 · Primary</span>
                </div>
                <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-2">
                  <div className="h-12 w-full rounded-lg bg-[#10B981] border-2 border-black" />
                  <p className="text-xs font-black text-black">Neon Mint</p>
                  <span className="font-mono text-[11px] font-bold text-neutral-700">#10B981 · Accent</span>
                </div>
                <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-2">
                  <div className="h-12 w-full rounded-lg bg-[#0F172A] border-2 border-black" />
                  <p className="text-xs font-black text-black">Midnight Slate</p>
                  <span className="font-mono text-[11px] font-bold text-neutral-700">#0F172A · Dark Base</span>
                </div>
                <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-2">
                  <div className="h-12 w-full rounded-lg bg-[#F8FAFC] border-2 border-black" />
                  <p className="text-xs font-black text-black">Clean Canvas</p>
                  <span className="font-mono text-[11px] font-bold text-neutral-700">#F8FAFC · Canvas Light</span>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-2">
                  <div className="h-12 w-full rounded-lg bg-crimson border-2 border-black" />
                  <p className="text-xs font-black text-black">Signature Crimson</p>
                  <span className="font-mono text-[11px] font-bold text-neutral-700">#C50337 · Primary</span>
                </div>
                <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-2">
                  <div className="h-12 w-full rounded-lg bg-popYellow border-2 border-black" />
                  <p className="text-xs font-black text-black">Pop Yellow</p>
                  <span className="font-mono text-[11px] font-bold text-neutral-700">#FFDE59 · Accent</span>
                </div>
                <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-2">
                  <div className="h-12 w-full rounded-lg bg-[#02060E] border-2 border-black" />
                  <p className="text-xs font-black text-black">Crimson Noir</p>
                  <span className="font-mono text-[11px] font-bold text-neutral-700">#02060E · Dark Base</span>
                </div>
                <div className="p-4 rounded-xl border-2 border-black bg-white shadow-brutal-sm space-y-2">
                  <div className="h-12 w-full rounded-lg bg-[#FBF8F3] border-2 border-black" />
                  <p className="text-xs font-black text-black">Warm Cream</p>
                  <span className="font-mono text-[11px] font-bold text-neutral-700">#FBF8F3 · Canvas</span>
                </div>
              </>
            )}
          </div>

          {/* Product Portfolio Showcase */}
          {isNovaDemo && (
            <div className="pt-4 border-t-2 border-black/10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-black">
                Official NOVA TECH Product Catalogue (3 Hardware Lines)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border-2 border-black bg-cream-50 shadow-brutal-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-black">NOVA Buds Pro</span>
                    <span className="text-xs font-mono font-black text-crimson">₹4,999</span>
                  </div>
                  <p className="text-[11px] font-bold text-neutral-700">
                    Category: Wireless Earbuds · 36h total battery, 42dB ANC, IPX5 water resistance.
                  </p>
                </div>

                <div className="p-4 rounded-xl border-2 border-black bg-cream-50 shadow-brutal-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-black">NOVA Watch Ultra</span>
                    <span className="text-xs font-mono font-black text-crimson">₹8,999</span>
                  </div>
                  <p className="text-[11px] font-bold text-neutral-700">
                    Category: Smartwatch · 1.96" AMOLED display, 7-day battery life, titanium bezel.
                  </p>
                </div>

                <div className="p-4 rounded-xl border-2 border-black bg-cream-50 shadow-brutal-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-black">NOVA Pad 11</span>
                    <span className="text-xs font-mono font-black text-crimson">₹24,999</span>
                  </div>
                  <p className="text-[11px] font-bold text-neutral-700">
                    Category: Tablet · 11" 2.5K 120Hz display, 8,000mAh battery, quad stereo speakers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: UPLOAD */}
      {activeTab === 'upload' && (
        <div className="max-w-xl mx-auto bg-white border-2 border-black p-8 rounded-2xl shadow-brutal space-y-5 text-black">
          <div>
            <h3 className="text-lg font-black text-black">Add a New Rulebook (PDF or DOCX)</h3>
            <p className="text-xs font-bold text-neutral-800">
              Upload brand guidelines or pricing sheets. Our system reads headings, extracts paragraphs, and uses them to check marketing drafts.
            </p>
          </div>

          {uploadMsg && (
            <div className={`p-4 rounded-xl border-2 border-black text-xs font-bold ${uploadMsg.type === 'success' ? 'bg-popGreen text-black' : 'bg-popCoral text-black'
              }`}>
              {uploadMsg.text}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-black">
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-black">Rulebook Title</label>
              <input
                type="text"
                placeholder="e.g. Q4 2026 Festive Season Guidelines"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full text-xs font-bold p-3 bg-cream-50 border-2 border-black rounded-xl text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-black">Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full text-xs font-bold p-3 bg-cream-50 border-2 border-black rounded-xl text-black focus:outline-none focus:bg-white"
              >
                <option value="Product Guidelines" className="bg-white text-black font-bold">Product Guidelines</option>
                <option value="Tone & Voice" className="bg-white text-black font-bold">Tone & Voice</option>
                <option value="Legal & Regulatory" className="bg-white text-black font-bold">Legal & Regulatory</option>
                <option value="Promotional Pricing" className="bg-white text-black font-bold">Promotional Pricing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-black">Upload Document (.txt, .md, .pdf)</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs font-bold p-2.5 bg-cream-50 border-2 border-black rounded-xl text-black file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-2 file:border-black file:text-xs file:font-black file:bg-popYellow file:text-black hover:file:bg-popYellow-dark cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="btn-3d btn-3d-crimson w-full py-3.5 text-xs"
            >
              <span className="text-white font-black">Ingest & Index Document ➜</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
