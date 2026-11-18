import React from 'react';
import { UserCheck, Shield, ChevronDown, Sparkles, Menu, X, Building2, ExternalLink, LogOut } from 'lucide-react';
import type { Persona } from '../../types';

interface TopBarProps {
  currentPersona: Persona | null;
  personas: Persona[];
  onPersonaChange: (persona: Persona) => void;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
  activeOrgSlug?: 'acme-audio' | 'nova-tech';
  onSwitchWorkspace?: (slug: 'acme-audio' | 'nova-tech') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPersona,
  personas,
  onPersonaChange,
  onToggleMobileNav,
  isMobileNavOpen = false,
  activeOrgSlug = 'nova-tech',
  onSwitchWorkspace
}) => {
  const isNovaDemo = activeOrgSlug === 'nova-tech';

  return (
    <header className="h-16 bg-white border-b-2 border-black fixed top-0 right-0 md:left-64 left-0 z-20 px-3 sm:px-6 flex items-center justify-between shadow-[0px_4px_0px_0px_#121212] text-black">
      {/* Mobile Hamburger & Workspace Brand Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden btn-3d-sm btn-3d-yellow p-2 text-black cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5 text-black" /> : <Menu className="w-5 h-5 text-black" />}
          </button>
        )}

        {/* Workspace Switcher / Demo Indicator */}
        {isNovaDemo ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-popYellow text-black border-2 border-black shadow-brutal-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-black fill-current" />
              <span className="font-black text-black">🧪 NOVA TECH</span>
              <span className="hidden sm:inline font-bold text-neutral-800">· Fictional Demo Workspace</span>
            </span>

            {onSwitchWorkspace && (
              <button
                onClick={() => onSwitchWorkspace('acme-audio')}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black rounded-lg bg-cream-100 hover:bg-cream-200 text-black border border-black cursor-pointer transition-all"
                title="Switch back to Acme Audio production workspace"
              >
                <LogOut className="w-3 h-3 text-neutral-700" />
                <span>Exit Demo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white text-black border-2 border-black shadow-brutal-sm">
              <Building2 className="w-3.5 h-3.5 text-crimson" />
              <span>Acme Audio</span>
              <span className="hidden sm:inline text-neutral-600 font-bold">· Production</span>
            </span>

            {onSwitchWorkspace && (
              <button
                onClick={() => onSwitchWorkspace('nova-tech')}
                className="btn-3d-sm btn-3d-yellow px-3 py-1 text-xs gap-1 cursor-pointer"
                title="Explore pre-configured fictional demo workspace for judges"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span className="font-black text-black">Try Interactive Demo</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Demo Persona Switcher & Role Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-cream-100 border border-black/30 px-2.5 py-1 rounded-lg shadow-brutal-sm">
          <span>✍️ Creator drafts</span>
          <span className="text-neutral-400">➜</span>
          <span>🛡️ Manager approves</span>
        </span>

        <div className="flex items-center gap-2 bg-cream-100 border-2 border-black px-2.5 sm:px-3 py-1 rounded-xl shadow-brutal-sm text-black">
          <UserCheck className="w-4 h-4 text-crimson" />
          <div className="text-left">
            <span className="block text-[8px] uppercase font-black text-neutral-800 tracking-wider">
              {isNovaDemo ? 'Demo Persona' : 'Viewing As'}
            </span>
            <div className="relative inline-block">
              <select
                aria-label="Active Persona"
                className="bg-transparent text-xs font-black text-black cursor-pointer focus:outline-none pr-5 appearance-none font-sans"
                value={currentPersona?.id || ''}
                onChange={(e) => {
                  const p = personas.find(item => item.id === e.target.value);
                  if (p) onPersonaChange(p);
                }}
              >
                {personas.map((p, idx) => (
                  <option key={`${p.id}-${idx}`} value={p.id} className="bg-white text-black font-bold">
                    {p.full_name} ({p.role_label})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-black absolute right-0 top-0.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Role Pill */}
        {currentPersona && (
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-crimson text-white border-2 border-black shadow-brutal-sm">
            <Shield className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-black">{currentPersona.role_label}</span>
          </span>
        )}
      </div>
    </header>
  );
};
