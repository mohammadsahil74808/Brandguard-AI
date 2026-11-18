import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle, Zap, UploadCloud, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import type { Persona } from '../types';

interface AuditWorkspacePageProps {
  currentPersona: Persona | null;
  onAuditComplete: (subId: string) => void;
  activeOrgId?: string;
  activeOrgSlug?: 'acme-audio' | 'nova-tech';
}

export const AuditWorkspacePage: React.FC<AuditWorkspacePageProps> = ({
  currentPersona,
  onAuditComplete,
  activeOrgId = 'nova-tech-demo-0000-0000-0000-000000000001',
  activeOrgSlug = 'nova-tech'
}) => {
  const isNovaDemo = activeOrgSlug === 'nova-tech';
  const [activeTab, setActiveTab] = useState<'sample' | 'editor' | 'upload'>('sample');

  // Editor State
  const [title, setTitle] = useState(
    isNovaDemo ? 'NOVA Buds Pro - Launch Social Ad' : 'Acme Buds Pro - Social Launch Caption'
  );
  const [channel, setChannel] = useState('instagram');
  const [bodyText, setBodyText] = useState(
    isNovaDemo
      ? "Hey everyone! Get the all-new Nova buds pro today for only ₹3,499! It features an unbelievable 50-hour battery life and is the cheapest in the galaxy! Don't miss the world's fastest charging audio gear with unlimited battery!"
      : "Hey guys!!! Grab the Acme Buds Pro NOW for just ₹999 – the cheapest and world's best earbuds with 40-hour battery! #Sale"
  );
  const [isAuditing, setIsAuditing] = useState(false);

  // File Upload State (Option B)
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Option A Presets
  const handleLoadFaultyAd = () => {
    setActiveTab('editor');
    if (isNovaDemo) {
      setTitle('NOVA Buds Pro - Launch Social Ad');
      setChannel('instagram');
      setBodyText(
        "Hey everyone! Get the all-new Nova buds pro today for only ₹3,499! It features an unbelievable 50-hour battery life and is the cheapest in the galaxy! Don't miss the world's fastest charging audio gear with unlimited battery!"
      );
    } else {
      setTitle('Acme Buds Pro - Social Launch Caption');
      setChannel('instagram');
      setBodyText(
        "Hey guys!!! Grab the Acme Buds Pro NOW for just ₹999 – the cheapest and world's best earbuds with 40-hour battery! #Sale"
      );
    }
  };

  const handleLoadCompliantAd = () => {
    setActiveTab('editor');
    if (isNovaDemo) {
      setTitle('NOVA Buds Pro - Official Launch Campaign');
      setChannel('instagram');
      setBodyText(
        "Experience pure audio clarity with the all-new NOVA Buds Pro for ₹4,999. Featuring 42dB Active Noise Cancellation, 36 hours of total playtime, and IPX5 water resistance. Crafted for creators who demand exceptional value."
      );
    } else {
      setTitle('Acme Buds Pro - Verified Launch Post');
      setChannel('instagram');
      setBodyText(
        "Introducing Acme Buds Pro for ₹799 with 32-hour playback and 35dB Active Noise Cancellation. Backed by standard 1-year domestic warranty."
      );
    }
  };

  const handleRunAudit = async () => {
    if (!bodyText.trim() || isAuditing) return;

    setIsAuditing(true);

    try {
      const sub = await api.createSubmission({
        title,
        body_text: bodyText,
        channel,
        content_type: 'caption',
        created_by: currentPersona?.id,
        org_id: activeOrgId
      });

      await api.triggerAudit(sub.id, true);
      setIsAuditing(false);
      onAuditComplete(sub.id);
    } catch (err) {
      console.error(err);
      setIsAuditing(false);
    }
  };

  // Option B: Handle Document Upload (.txt, .md, .pdf, .docx)
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a document (.txt, .md, .pdf, .docx) to upload.');
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('channel', channel);
      formData.append('content_type', 'document');
      if (currentPersona?.id) formData.append('created_by', currentPersona.id);
      if (activeOrgId) formData.append('org_id', activeOrgId);

      const sub = await api.uploadContentSubmission(formData);
      
      // Automatically trigger audit on the uploaded file's extracted text
      setIsAuditing(true);
      setUploading(false);
      await api.triggerAudit(sub.id, true);
      setIsAuditing(false);
      onAuditComplete(sub.id);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'File upload failed. Supported formats: .txt, .md, .pdf, .docx (Max 10MB)');
      setUploading(false);
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-black">
      {/* Page Header (Featuring employee_workspace.png) */}
      <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-black">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-popYellow border-2 border-black shadow-brutal-sm text-black">
              <Zap className="w-5 h-5 fill-current" />
            </span>
            <h2 className="text-2xl font-black text-black tracking-tight">
              {isNovaDemo ? 'NOVA TECH Compliance Audit Station' : 'Post Safety Scanner'}
            </h2>
          </div>
          <p className="text-xs font-bold text-neutral-800">
            {isNovaDemo
              ? 'Test actual AI-powered brand audits on preloaded advertisements (Option A) or upload your own files (Option B). All audits evaluate against NOVA TECH brand rules!'
              : 'Paste your draft below. We check prices, product claims, and banned words in seconds!'}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-[11px] font-mono font-bold bg-cream-100 text-black px-2.5 py-1 rounded-lg border border-black">
              Author: {currentPersona?.full_name || (isNovaDemo ? 'Sarah Jenkins' : 'Rohan Sharma')}
            </span>
            <span className="text-[11px] font-mono font-bold bg-popYellow text-black px-2.5 py-1 rounded-lg border border-black">
              Org: {isNovaDemo ? 'NOVA TECH (Demo)' : 'Acme Audio'}
            </span>
          </div>
        </div>

        {/* Employee Workspace Illustration */}
        <div className="hidden sm:flex shrink-0 items-center justify-center p-2 bg-cream-100 rounded-xl border-2 border-black shadow-brutal-sm">
          <img
            src="/illustrations/employee_workspace.png"
            alt="Employee Workspace Drafting Station"
            className="h-28 w-auto object-contain"
          />
        </div>
      </div>

      {/* Option Navigation Tabs (Option A: Sample vs Option B: Upload vs Custom Editor) */}
      <div className="flex border-b-2 border-black gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('sample')}
          className={`btn-3d-sm px-4 py-2 text-xs font-black gap-1.5 cursor-pointer ${
            activeTab === 'sample' ? 'btn-3d-yellow' : 'btn-3d-white btn-3d-alt'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Option A: Sample Test Ads</span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`btn-3d-sm px-4 py-2 text-xs font-black gap-1.5 cursor-pointer ${
            activeTab === 'editor' ? 'btn-3d-yellow' : 'btn-3d-white btn-3d-alt'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Write / Paste Text</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`btn-3d-sm px-4 py-2 text-xs font-black gap-1.5 cursor-pointer ${
            activeTab === 'upload' ? 'btn-3d-yellow' : 'btn-3d-white btn-3d-alt'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Option B: Upload Document (.pdf, .docx, .txt)</span>
        </button>
      </div>

      {/* TAB 1: OPTION A - SAMPLE ADS */}
      {activeTab === 'sample' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Faulty Ad Card */}
          <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-popCoral text-black border border-black shadow-brutal-sm">
                  <AlertTriangle className="w-3 h-3 text-black" />
                  Contains Violations
                </span>
                <span className="text-[11px] font-mono font-bold text-neutral-600">Sample Ad #1</span>
              </div>
              <h3 className="text-base font-black text-black">
                {isNovaDemo ? 'NOVA Buds Pro (Unapproved Claims & Pricing)' : 'Acme Buds Pro (Faulty Launch Post)'}
              </h3>
              <p className="text-xs font-mono font-bold p-3 bg-cream-50 border border-black rounded-xl text-neutral-800 leading-relaxed">
                {isNovaDemo
                  ? '"Hey everyone! Get the all-new Nova buds pro today for only ₹3,499! It features an unbelievable 50-hour battery life and is the cheapest in the galaxy! Don\'t miss the world\'s fastest charging audio gear with unlimited battery!"'
                  : '"Hey guys!!! Grab the Acme Buds Pro NOW for just ₹999 – the cheapest and world\'s best earbuds with 40-hour battery! #Sale"'}
              </p>
              <div className="space-y-1 text-[11px] font-bold text-neutral-700">
                <p className="text-crimson font-black">Expected Audit Findings:</p>
                <ul className="list-disc list-inside space-y-0.5 text-neutral-800 text-[10px]">
                  <li>Wrong price (₹3,499 vs approved ₹4,999)</li>
                  <li>Lab spec violation (50h vs approved 36h battery)</li>
                  <li>Prohibited superlative ("cheapest in the galaxy")</li>
                  <li>Unsupported claim ("world\'s fastest", "unlimited battery")</li>
                  <li>Incorrect capitalization ("Nova buds")</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleLoadFaultyAd}
              className="btn-3d btn-3d-crimson w-full py-3 text-xs gap-2 cursor-pointer mt-2"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span className="text-white font-black">Load & Inspect Faulty Ad ➜</span>
            </button>
          </div>

          {/* Compliant Ad Card */}
          <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-popGreen text-black border border-black shadow-brutal-sm">
                  <CheckCircle2 className="w-3 h-3 text-black" />
                  100% Compliant Copy
                </span>
                <span className="text-[11px] font-mono font-bold text-neutral-600">Sample Ad #2</span>
              </div>
              <h3 className="text-base font-black text-black">
                {isNovaDemo ? 'NOVA Buds Pro (Approved Specs & Pricing)' : 'Acme Buds Pro (Approved Launch Post)'}
              </h3>
              <p className="text-xs font-mono font-bold p-3 bg-cream-50 border border-black rounded-xl text-neutral-800 leading-relaxed">
                {isNovaDemo
                  ? '"Experience pure audio clarity with the all-new NOVA Buds Pro for ₹4,999. Featuring 42dB Active Noise Cancellation, 36 hours of total playtime, and IPX5 water resistance. Crafted for creators who demand exceptional value."'
                  : '"Introducing Acme Buds Pro for ₹799 with 32-hour playback and 35dB Active Noise Cancellation. Backed by standard 1-year domestic warranty."'}
              </p>
              <div className="space-y-1 text-[11px] font-bold text-neutral-700">
                <p className="text-emerald-700 font-black">Expected Audit Findings:</p>
                <ul className="list-disc list-inside space-y-0.5 text-neutral-800 text-[10px]">
                  <li>0 fabricated violations</li>
                  <li>Passes in LOW risk band (0 penalty points)</li>
                  <li>Accurate ₹4,999 pricing & 36h verified battery</li>
                  <li>Eligible for 1-click human manager approval</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleLoadCompliantAd}
              className="btn-3d btn-3d-green w-full py-3 text-xs gap-2 cursor-pointer mt-2"
            >
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span className="text-black font-black">Load & Inspect Compliant Ad ➜</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: OPTION B - DOCUMENT UPLOAD */}
      {activeTab === 'upload' && (
        <div className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 shadow-brutal space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-popYellow border-2 border-black shadow-brutal-sm text-black">
                <UploadCloud className="w-5 h-5 text-black" />
              </span>
              <h3 className="text-lg font-black text-black">Option B: Upload Your Own Content</h3>
            </div>
            <p className="text-xs font-bold text-neutral-800 mt-1">
              Upload marketing briefs, product one-pagers, or promotional scripts (.txt, .md, .pdf, .docx, max 10MB). Text is extracted securely and audited against NOVA TECH rules.
            </p>
          </div>

          {uploadError && (
            <div className="p-3.5 bg-popCoral text-black border-2 border-black rounded-xl text-xs font-bold">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-black">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Q4 Social Campaign Brief"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full text-xs font-bold px-4 py-3 bg-cream-50 border-2 border-black text-black rounded-xl focus:outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-black">Target Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full text-xs font-bold px-4 py-3 bg-cream-50 border-2 border-black text-black rounded-xl focus:outline-none focus:bg-white"
              >
                <option value="instagram" className="bg-white text-black font-bold">📱 Instagram</option>
                <option value="linkedin" className="bg-white text-black font-bold">💼 LinkedIn</option>
                <option value="ad" className="bg-white text-black font-bold">🎯 Digital Ad Campaign</option>
                <option value="blog" className="bg-white text-black font-bold">📝 Blog / Web Article</option>
                <option value="press_release" className="bg-white text-black font-bold">📰 Press Release</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase text-black">Select File (.txt, .md, .pdf, .docx)</label>
              <div className="p-6 border-2 border-dashed border-black rounded-xl bg-cream-50 flex flex-col items-center justify-center gap-3 text-center">
                <UploadCloud className="w-8 h-8 text-neutral-600" />
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                  }}
                  className="text-xs font-bold file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-2 file:border-black file:text-xs file:font-black file:bg-popYellow file:text-black cursor-pointer"
                />
                {uploadFile && (
                  <span className="text-xs font-mono font-bold text-neutral-800">
                    Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || isAuditing}
              className="btn-3d btn-3d-yellow w-full py-3.5 text-sm gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-black fill-current" />
              <span className="text-black font-black">
                {uploading ? 'Extracting & Uploading...' : isAuditing ? 'Auditing with AI...' : 'Upload & Run AI Compliance Audit ➜'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CUSTOM TEXT EDITOR */}
      {activeTab === 'editor' && (
        <div className="bg-white border-2 border-black rounded-2xl shadow-brutal overflow-hidden text-black">
          {/* Retro Window Titlebar */}
          <div className="bg-cream-200 border-b-2 border-black px-5 py-2.5 flex items-center justify-between text-black">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black bg-[#C50337] shadow-[1px_1px_0px_0px_#121212]" style={{ backgroundColor: '#C50337' }} title="Signature Red" />
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black bg-[#FBF8F3] shadow-[1px_1px_0px_0px_#121212]" style={{ backgroundColor: '#FBF8F3' }} title="Warm Creme" />
              <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black bg-[#FFDE59] shadow-[1px_1px_0px_0px_#121212]" style={{ backgroundColor: '#FFDE59' }} title="Pop Yellow" />
              <span className="font-mono text-xs font-black text-black ml-2">
                Post_Editor.txt — Ready for Safety Check
              </span>
            </div>
            <span className="text-[10px] font-mono font-black text-neutral-800">UTF-8</span>
          </div>

          <div className="p-6 sm:p-8 space-y-6 text-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-black uppercase tracking-wider">
                  Post Title / Campaign
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-bold px-4 py-3 bg-cream-50 border-2 border-black text-black rounded-xl focus:outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-black uppercase tracking-wider">
                  Platform / Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full text-xs font-bold px-4 py-3 bg-cream-50 border-2 border-black text-black rounded-xl focus:outline-none focus:bg-white"
                >
                  <option value="instagram" className="bg-white text-black font-bold">📱 Instagram</option>
                  <option value="linkedin" className="bg-white text-black font-bold">💼 LinkedIn</option>
                  <option value="ad" className="bg-white text-black font-bold">🎯 Digital Ad Campaign</option>
                  <option value="blog" className="bg-white text-black font-bold">📝 Blog / Web Article</option>
                  <option value="press_release" className="bg-white text-black font-bold">📰 Press Release</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-black uppercase tracking-wider">
                  Your Post Copy
                </label>
                <span className="text-xs text-neutral-800 font-mono font-bold">
                  {bodyText.length} characters · {bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0} words
                </span>
              </div>
              <div className="relative">
                <textarea
                  rows={5}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className={`w-full text-sm font-sans font-bold p-5 bg-cream-50 border-2 border-black text-black rounded-xl focus:outline-none focus:bg-white leading-relaxed shadow-inner transition-all ${
                    isAuditing ? 'border-crimson bg-cream-100 ring-2 ring-crimson/30 opacity-70' : ''
                  }`}
                  placeholder="Paste or type your caption here..."
                />
              </div>
            </div>

            {/* Action Area (Featuring content_audit.png badge) */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cream-100 border-2 border-black p-1 flex items-center justify-center shrink-0 shadow-brutal-sm">
                  <img
                    src="/illustrations/content_audit.png"
                    alt="Content Audit Engine"
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <span className="text-xs text-neutral-800 font-bold">
                  Checks actual approved pricing facts and verified lab reports.
                </span>
              </div>

              <button
                onClick={handleRunAudit}
                disabled={isAuditing || !bodyText.trim()}
                className="btn-3d btn-3d-crimson w-full sm:w-auto px-8 py-3.5 text-sm gap-2"
              >
                <span className="text-white font-black">{isAuditing ? 'Scanning your post...' : 'Scan Post for Errors ➜'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
