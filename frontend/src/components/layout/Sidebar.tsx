import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  Sparkles,
  CheckSquare,
  BarChart3,
  ChevronRight,
  Star,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingReviewsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  pendingReviewsCount = 0,
  isOpen = false,
  onClose
}) => {
  const navItems = [
    { id: 'dashboard', num: '01', label: 'Dashboard', desc: 'Home & Quick Demo', icon: LayoutDashboard },
    { id: 'brand-hub', num: '02', label: 'Brand Guidelines', desc: 'Official Prices & Rules', icon: BookOpen },
    { id: 'audit-workspace', num: '03', label: 'Check a Post', desc: 'Paste or Upload Copy', icon: FileCheck2 },
    { id: 'studio', num: '04', label: '1-Click Fix Studio', desc: 'Review & Apply Fixes', icon: Sparkles },
    { id: 'review-queue', num: '05', label: 'Manager Approvals', desc: 'Final Sign-off Queue', icon: CheckSquare, badge: pendingReviewsCount },
    { id: 'analytics', num: '06', label: 'Quality Scorecard', desc: 'Error Trends & Stats', icon: BarChart3 }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`w-64 bg-cream-50 text-black flex flex-col h-screen fixed left-0 top-0 border-r-2 border-black z-40 shadow-[4px_0px_0px_0px_#121212] transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header with Neubrutalist Star & Crimson Box */}
        <div className="p-5 border-b-2 border-black bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crimson border-2 border-black shadow-brutal-sm flex items-center justify-center text-white font-black text-lg">
              BG
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight text-black flex items-center gap-1">
                BrandGuard<span className="text-crimson font-black">.AI</span>
              </h1>
              <p className="text-[10px] font-extrabold text-neutral-800 uppercase tracking-wider">
                Smart Brand Checker
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-popYellow border-2 border-black shadow-brutal-sm">
              <Star className="w-3.5 h-3.5 text-black fill-current" />
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden btn-3d-sm btn-3d-white p-1 text-black cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            )}
          </div>
        </div>

      {/* Navigation with Neubrutalist Chunky Buttons */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-neutral-500">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onClose) onClose();
              }}
              className={`w-full group btn-3d-sm flex items-center justify-between px-3 py-2 text-xs transition-all cursor-pointer ${
                isActive
                  ? 'btn-3d-crimson sidebar-nav-btn-active'
                  : 'btn-3d-white hover:btn-3d-yellow sidebar-nav-btn-inactive'
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border-2 border-black font-black shrink-0 ${
                  isActive ? 'bg-black text-white' : 'bg-popYellow text-black'
                }`}>
                  {item.num}
                </span>
                <div className="leading-tight">
                  <span className={`block tracking-tight font-black text-xs ${isActive ? 'text-white' : 'text-black'}`}>
                    {item.label}
                  </span>
                  <span className={`block text-[10px] font-bold ${isActive ? 'text-cream-100' : 'text-neutral-500'}`}>
                    {item.desc}
                  </span>
                </div>
              </div>

              {item.badge !== undefined && item.badge > 0 ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-black bg-popYellow text-black border-2 border-black shadow-brutal-sm shrink-0">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isActive ? 'text-white translate-x-0.5' : 'text-black group-hover:translate-x-0.5'
                }`} />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
    </>
  );
};
