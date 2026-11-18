import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import { Persona, ContentSubmission } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';

import { DashboardPage } from './pages/DashboardPage';
import { BrandHubPage } from './pages/BrandHubPage';
import { AuditWorkspacePage } from './pages/AuditWorkspacePage';
import { AuditResultsPage } from './pages/AuditResultsPage';
import { CorrectionStudioPage } from './pages/CorrectionStudioPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { AnalyticsPage } from './pages/AnalyticsPage';

const NOVA_TECH_ORG_ID = 'nova-tech-demo-0000-0000-0000-000000000001';
const ACME_AUDIO_ORG_ID = '00000000-0000-0000-0000-000000000001';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeOrgSlug, setActiveOrgSlug] = useState<'nova-tech' | 'acme-audio'>('nova-tech');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('nova-sub-0000-0000-0000-000000000001');
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  const activeOrgId = activeOrgSlug === 'nova-tech' ? NOVA_TECH_ORG_ID : ACME_AUDIO_ORG_ID;

  useEffect(() => {
    initApp(activeOrgSlug);
  }, [activeOrgSlug]);

  const initApp = async (orgSlug: 'nova-tech' | 'acme-audio' = activeOrgSlug) => {
    setLoading(true);
    const orgId = orgSlug === 'nova-tech' ? NOVA_TECH_ORG_ID : ACME_AUDIO_ORG_ID;
    try {
      const [pList, subList] = await Promise.all([
        api.getPersonas(orgId),
        api.getSubmissions(orgId)
      ]);
      setPersonas(pList);
      if (pList.length > 0) {
        if (orgSlug === 'nova-tech') {
          // Default to Sarah Jenkins (Content Author) for NOVA TECH
          const author = pList.find(p => p.email.includes('sarah') || p.role_name === 'author') || pList[0];
          setCurrentPersona(author);
        } else {
          // Default to Rohan Sharma (Content Creator) for Acme Audio
          const rohan = pList.find(p => p.email.includes('rohan')) || pList[0];
          setCurrentPersona(rohan);
        }
      }
      setSubmissions(subList);
      if (subList.length > 0) {
        setSelectedSubId(subList[0].id);
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchWorkspace = (slug: 'nova-tech' | 'acme-audio') => {
    setActiveOrgSlug(slug);
    setCurrentTab('dashboard');
  };

  const handleOpenAudit = (subId: string) => {
    setSelectedSubId(subId);
    setCurrentTab('studio');
  };

  const handleRunDemoAudit = async (customSubId?: string) => {
    const targetSubId = customSubId || (activeOrgSlug === 'nova-tech' 
      ? 'nova-sub-0000-0000-0000-000000000001' 
      : '90000000-0000-0000-0000-000000000001');
    try {
      await api.triggerAudit(targetSubId, true);
      const updatedList = await api.getSubmissions(activeOrgId);
      setSubmissions(updatedList);
      setSelectedSubId(targetSubId);
      setCurrentTab('studio');
    } catch (err) {
      console.error(err);
      setSelectedSubId(targetSubId);
      setCurrentTab('studio');
    }
  };

  const handleAuditComplete = (subId: string) => {
    setSelectedSubId(subId);
    api.getSubmissions(activeOrgId).then(setSubmissions);
    setCurrentTab('studio');
  };

  const handleReAuditComplete = (subId: string) => {
    setSelectedSubId(subId);
    api.getSubmissions(activeOrgId).then(setSubmissions);
  };

  const handleSubmitForReview = async () => {
    try {
      await api.submitForReview(selectedSubId, currentPersona?.id);
      const updatedList = await api.getSubmissions(activeOrgId);
      setSubmissions(updatedList);
      setCurrentTab('review-queue');
    } catch (err) {
      console.error(err);
      setCurrentTab('review-queue');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center text-ink font-sans gap-4">
        <div className="w-12 h-12 rounded-2xl bg-crimson border-2 border-black shadow-brutal animate-bounce flex items-center justify-center text-white font-black text-xl">
          BG
        </div>
        <span className="font-extrabold text-sm text-ink px-4 py-1.5 rounded-full bg-popYellow border-2 border-black shadow-brutal-sm">
          Loading BrandGuard AI...
        </span>
      </div>
    );
  }

  const pendingReviewsCount = submissions.filter(s =>
    ['manager_review', 'compliance_review', 'final_approval'].includes(s.workflow_status)
  ).length;

  return (
    <div className="min-h-screen bg-canvas flex text-ink font-sans selection:bg-crimson selection:text-white">
      {/* Sidebar (Responsive Slide-in Drawer on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        pendingReviewsCount={pendingReviewsCount}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 ml-0 flex flex-col min-h-screen transition-all">
        <TopBar
          currentPersona={currentPersona}
          personas={personas}
          onPersonaChange={(p) => setCurrentPersona(p)}
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
          isMobileNavOpen={mobileNavOpen}
          activeOrgSlug={activeOrgSlug}
          onSwitchWorkspace={handleSwitchWorkspace}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 mt-16 max-w-7xl w-full mx-auto">
          <div key={`${currentTab}-${activeOrgSlug}`} className="animate-page-enter">
            {currentTab === 'dashboard' && (
              <DashboardPage
                submissions={submissions}
                onOpenAudit={handleOpenAudit}
                onNavigate={(tab) => setCurrentTab(tab)}
                onRunDemoAudit={handleRunDemoAudit}
                activeOrgSlug={activeOrgSlug}
                onSwitchWorkspace={handleSwitchWorkspace}
              />
            )}

            {currentTab === 'brand-hub' && (
              <BrandHubPage
                activeOrgId={activeOrgId}
                activeOrgSlug={activeOrgSlug}
              />
            )}

            {currentTab === 'audit-workspace' && (
              <AuditWorkspacePage
                currentPersona={currentPersona}
                onAuditComplete={handleAuditComplete}
                activeOrgId={activeOrgId}
                activeOrgSlug={activeOrgSlug}
              />
            )}

            {currentTab === 'results' && (
              <AuditResultsPage
                submissionId={selectedSubId}
                currentPersona={currentPersona}
                onOpenStudio={() => setCurrentTab('studio')}
                onSubmitForReview={handleSubmitForReview}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'studio' && (
              <CorrectionStudioPage
                submissionId={selectedSubId}
                currentPersona={currentPersona}
                onReAuditComplete={handleReAuditComplete}
                onSubmitForReview={handleSubmitForReview}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'review-queue' && (
              <ReviewQueuePage
                currentPersona={currentPersona}
                onOpenAudit={handleOpenAudit}
                activeOrgId={activeOrgId}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsPage activeOrgId={activeOrgId} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
