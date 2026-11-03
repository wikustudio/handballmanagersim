import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, PhilosophyInfo, GameState } from '../types';
import { PHILOSOPHIES, getCountryFlag, formatMoney, getCountryMult } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';
import { useGameStore } from '../store/useGameStore';
import { CountUp } from './CountUp';

interface PhilosophyModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentPhilosophyKey: string;
  onSelectPhilosophy: (philosophyKey: string) => void;
  skillPoints?: number;
  hasTacticalGenius?: boolean;
  lang: Language;
  state?: GameState;
  initialTab?: 'overview' | 'philosophy' | 'rebuild';
}

export const PhilosophyModal: React.FC<PhilosophyModalProps> = ({
  isOpen = true,
  onClose,
  currentPhilosophyKey,
  onSelectPhilosophy,
  skillPoints = 0,
  hasTacticalGenius = false,
  lang,
  state: propState,
  initialTab = 'overview',
}) => {
  useModalDismiss(onClose, isOpen);
  const storeState = useGameStore();
  const state = propState || storeState;
  const [activeTab, setActiveTab] = useState<'overview' | 'philosophy' | 'rebuild'>(initialTab);
  const [expandedRebuild, setExpandedRebuild] = useState<'squad' | 'finance' | 'staff' | 'infra' | null>('squad');
  const [showConfirmGenerationalRebuild, setShowConfirmGenerationalRebuild] = useState(false);
  const [rebuildFeedback, setRebuildFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [repayFeedback, setRepayFeedback] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const t = (en: string, de?: string) => (lang === 'de' ? (de || en) : en);

  // Coach & career metrics (The user is the coach)
  const coachName = state.managerName || state.currentCoach?.name || 'Head Coach';
  const totalMatches = state.totals?.matches || 0;
  const totalWins = state.totals?.wins || 0;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const totalTrophies = (state.totals?.trophies || 0) || (state.trophies?.length || 0);
  const domTrophies = state.totals?.domTrophies || 0;
  const intTrophies = state.totals?.intTrophies || 0;
  const tenure = state.tenureYears || 1;
  const countryFlag = getCountryFlag(state.nationality || state.club?.country || 'GER');

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110] flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 14 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 14 }} 
        transition={{ type: 'spring', damping: 28, stiffness: 350 }} 
        className="bg-[#14151e] w-full max-w-3xl rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative my-auto max-h-[92vh] flex flex-col overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/[0.04] shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-base shadow-sm shrink-0 ${
              activeTab === 'overview'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                : activeTab === 'philosophy'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <i className={activeTab === 'overview' ? 'fas fa-user-tie' : activeTab === 'philosophy' ? 'fas fa-chess' : 'fas fa-arrows-rotate'} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight leading-tight truncate">
                {activeTab === 'overview' 
                  ? t('Coach Profile & Overview', 'Trainerprofil & Übersicht') 
                  : activeTab === 'philosophy' 
                  ? t('Tactical System & Philosophy', 'Taktiksystem & Spielphilosophie')
                  : t('Club Rebuild & Directives', 'Vereins-Rebuild & Führungsdirektiven')}
              </h2>
              <p className="text-[11px] text-zinc-500 font-normal truncate">
                {activeTab === 'overview' 
                  ? `${coachName} · ${t('Head Coach Record & Stats', 'Trainer-Bilanz & Statistiken')}` 
                  : activeTab === 'philosophy'
                  ? (hasTacticalGenius
                      ? t('Define your tactical identity. System switches are free (Tactical Genius).', 'Taktische Identität wählen. Wechsel sind kostenlos (Taktikgenie).')
                      : t('Define your tactical identity. Adapting system costs 5 Manager Points.', 'Taktische Identität wählen. Wechsel kostet 5 MP.'))
                  : t('Strategic multi-pillar rebuilds: Squad renewal, austerity rebalancing, staff pivots & facility immunity.', 'Strategische Rebuild-Säulen: Generationswechsel, Gehaltssanierung, Führungswechsel & Infrastruktur-Immunität.')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto flex-wrap">
            {/* Pill Navigation between Overview, Philosophy and Rebuild Directives */}
            <div className="flex items-center p-1 bg-black/40 border border-white/[0.04] rounded-xl text-xs font-medium gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <i className="fas fa-user-tie text-[10px]" />
                <span>{t('Overview', 'Übersicht')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('philosophy')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'philosophy'
                    ? 'bg-amber-500/[0.05] text-amber-300 border border-amber-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <i className="fas fa-chess text-[10px]" />
                <span>{t('Philosophy', 'Philosophie')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rebuild')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'rebuild'
                    ? 'bg-emerald-500/[0.05] text-emerald-300 border border-emerald-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <i className="fas fa-arrows-rotate text-[10px]" />
                <span>{t('Rebuild Directives', 'Rebuild-Säulen')}</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              aria-label="Close"
            >
              <i className="fas fa-xmark text-sm" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div ref={contentRef} className="overflow-y-auto custom-scrollbar p-4 sm:p-5 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div
                key="coach-overview-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3.5 sm:gap-4"
              >
                {/* Coach Profile Card */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-300 flex items-center justify-center text-base font-semibold shrink-0">
                      {coachName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-semibold text-white tracking-tight leading-tight truncate">
                          {coachName}
                        </span>
                        <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-300 shrink-0">
                          Head Coach
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{countryFlag} {state.nationality || state.club?.country || 'GER'}</span>
                        <span>•</span>
                        <span className="text-zinc-300 font-medium">{state.club?.name}</span>
                        <span>•</span>
                        <span>Season {state.year} ({tenure} yrs tenure)</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => setActiveTab('philosophy')}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <i className="fas fa-chess text-[10px] text-zinc-400" />
                      <span>Change Philosophy</span>
                    </button>
                  </div>
                </div>

                {/* Key Metrics Bento Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Win Percentage */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex flex-col justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                      WIN PERCENTAGE
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-2xl sm:text-3xl font-medium tracking-tight tabular-nums text-white flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${winRate >= 50 ? 'bg-emerald-500' : winRate >= 35 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        <CountUp value={winRate} duration={850} />%
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">Competitive Efficiency</span>
                  </div>

                  {/* Matches Supervised */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex flex-col justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                      TOTAL MATCHES
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-2xl sm:text-3xl font-medium text-white tracking-tight tabular-nums">
                        <CountUp value={totalMatches} duration={850} />
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium">{totalWins} Wins Recorded</span>
                  </div>

                  {/* Trophies Captured */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex flex-col justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                      HONOURS & TITLES
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-2xl sm:text-3xl font-medium text-white tracking-tight tabular-nums">
                        <CountUp value={totalTrophies} duration={850} />
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">{domTrophies} Dom · {intTrophies} Intl</span>
                  </div>

                  {/* Reputation / Impact */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex flex-col justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                      COACH IMPACT
                    </span>
                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-2xl sm:text-3xl font-medium text-white tracking-tight tabular-nums">
                        {state.clubImpactScore ?? 75}/100
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">Board & Fan Trust</span>
                  </div>
                </div>

                {/* 2-Column Detail Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Tactical Setup & Philosophy Card */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          ACTIVE TACTICAL IDENTITY
                        </span>
                        <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
                          {currentPhilosophyKey}
                        </span>
                      </div>
                      <div className="text-base font-semibold text-white tracking-tight mb-1">
                        System: {state.tactic || 'Balanced 6-0'}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                        {PHILOSOPHIES[currentPhilosophyKey]?.perkEn || 'Tactical system governs offensive scoring output, transition pace, and backline defensive solidity.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500">Offensive Modifier:</span>
                        <span className="text-zinc-200 font-medium tabular-nums">GF ×{PHILOSOPHIES[currentPhilosophyKey]?.gfMod || '1.00'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500">Defensive Modifier:</span>
                        <span className="text-zinc-200 font-medium tabular-nums">GA ×{PHILOSOPHIES[currentPhilosophyKey]?.gaMod || '1.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Career Honours & Silverware Cabinet */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          TROPHY CABINET & REPUTATION
                        </span>
                        <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
                          {totalTrophies} Honours
                        </span>
                      </div>
                      <div className="text-base font-semibold text-white tracking-tight mb-1">
                        Silverware Achievements
                      </div>
                    </div>

                    {totalTrophies > 0 ? (
                      <div className="flex flex-wrap gap-2 my-1">
                        {domTrophies > 0 && (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs">
                            <i className="fas fa-trophy text-zinc-400 text-[10px]" />
                            <span className="text-zinc-200 font-medium">Domestic Titles: {domTrophies}</span>
                          </div>
                        )}
                        {intTrophies > 0 && (
                          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs">
                            <i className="fas fa-earth-americas text-zinc-400 text-[10px]" />
                            <span className="text-zinc-200 font-medium">Continental Titles: {intTrophies}</span>
                          </div>
                        )}
                        {(state.trophies || []).slice(0, 4).map((trName, idx) => (
                          <div key={`trophy-badge-${idx}`} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] text-zinc-300 flex items-center gap-1.5 font-normal">
                            <span className="text-[10px]">🏆</span>
                            <span className="truncate">{trName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] text-center text-xs text-zinc-500">
                        Searching for first career silverware. Guide {state.club?.name} to championship glory!
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500">Manager Skill Points:</span>
                        <span className="text-zinc-200 font-medium flex items-center gap-1 tabular-nums">
                          +{skillPoints} SP
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-500">Job Security Status:</span>
                        <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${state.isSacked ? 'bg-rose-500' : state.boardWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          {state.isSacked ? 'Dismissed' : state.boardWarning ? 'Warning Issued' : 'High Trust'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'philosophy' ? (
              /* Tactical Philosophy Grid */
              <motion.div
                key="philosophy-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                {Object.entries(PHILOSOPHIES).map(([key, info]: [string, PhilosophyInfo]) => {
                  const isActive = currentPhilosophyKey === key;

                  return (
                    <div
                      key={key}
                      className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-[#10121a]/90 border-white/[0.15]'
                          : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.05] hover:border-white/[0.1]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-300 text-xs shrink-0"
                            >
                              <info.icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white tracking-tight leading-tight flex items-center gap-1.5">
                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                                {key}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                                {info.en}
                              </div>
                            </div>
                          </div>
                          {isActive && (
                            <span className="bg-white/[0.03] text-zinc-300 border border-white/[0.06] text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                              {t('Active', 'Aktiv')}
                            </span>
                          )}
                        </div>

                        {/* Stat Modifiers */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-white/[0.02] border border-white/[0.05] text-zinc-300 text-[11px] font-normal px-2.5 py-1 rounded-lg tabular-nums">
                            <i className="fas fa-bullseye text-zinc-400 mr-1.5 text-[10px]" />GF ×{info.gfMod}
                          </span>
                          <span className="bg-white/[0.02] border border-white/[0.05] text-zinc-300 text-[11px] font-normal px-2.5 py-1 rounded-lg tabular-nums">
                            <i className="fas fa-shield text-zinc-400 mr-1.5 text-[10px]" />GA ×{info.gaMod}
                          </span>
                        </div>

                        {/* Tactical Advantage */}
                        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] mb-3">
                          <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                            <i className="fas fa-bolt text-[9px] text-zinc-500" />
                            <span>Tactical Advantage</span>
                          </div>
                          <p className="text-xs text-zinc-300 font-normal leading-relaxed">
                            {info.perkEn}
                          </p>
                        </div>

                        {!isActive && (
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-white/[0.02] border border-white/[0.04] px-2 py-1 rounded-lg mb-3">
                            <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                            <span>{t('Transition Friction: -15 Morale on system switch.', 'Umstellungsreibung: -15 Moral beim Systemwechsel.')}</span>
                          </div>
                        )}
                      </div>

                      {/* Selection Button */}
                      <button
                        onClick={() => {
                          onSelectPhilosophy(key);
                          onClose();
                        }}
                        disabled={isActive || (!hasTacticalGenius && skillPoints < 5)}
                        className={`w-full py-2.5 rounded-xl font-medium text-xs transition cursor-pointer ${
                          isActive
                            ? 'bg-white/[0.03] text-zinc-500 border border-white/[0.05] cursor-default'
                            : (hasTacticalGenius || skillPoints >= 5)
                            ? 'bg-white text-black hover:bg-zinc-200 shadow-sm active:scale-[0.98]'
                            : 'bg-white/[0.02] text-zinc-600 border border-white/[0.04] cursor-not-allowed'
                        }`}
                      >
                        {isActive
                          ? t('Current System', 'Aktive Philosophie')
                          : hasTacticalGenius
                          ? `${t('Adopt System', 'System übernehmen')} (Free)`
                          : skillPoints >= 5
                          ? `${t('Adopt System', 'System übernehmen')} (5 MP)`
                          : `${t('Requires 5 MP', '5 MP benötigt')} (${skillPoints}/5)`}
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              /* Club Rebuild Directives Hub */
              <motion.div
                key="rebuild-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4"
              >
                {/* Rebuild Feedback Notification */}
                {rebuildFeedback && (
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    rebuildFeedback.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <i className={`fas ${rebuildFeedback.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`} />
                      <span>{rebuildFeedback.message}</span>
                    </div>
                    <button 
                      onClick={() => setRebuildFeedback(null)}
                      className="text-zinc-400 hover:text-white ml-2 text-sm"
                    >
                      <i className="fas fa-xmark" />
                    </button>
                  </div>
                )}

                {/* ============================================================== */}
                {/* MINIMALIST 4-STEP REBUILD DIRECTIVES NAV & STATUS STRIP        */}
                {/* ============================================================== */}
                {(() => {
                  const clubOvr = state.club?.baseOvr || 70;
                  const squadSize = state.club?.squadSize || 18;
                  const isEligibleSquad = clubOvr >= 82 && squadSize >= 15 && (state.year - (state.lastGenerationalRebuildYear || 0) >= 5);
                  const isSquadTransitionActive = (state.rebuildWageDiscountSeasons || 0) > 0;
                  const treasury = state.budget;
                  const activeLoan = state.activeLoan;
                  const loanBalance = activeLoan ? (activeLoan.remainingBalance ?? (activeLoan as any).principalRemaining ?? 0) : 0;
                  const currentCoachArchetype = state.headCoachArchetype || 'Standard';
                  const academyLevel = state.club?.academyLevel || 1;
                  const medicalLevel = state.club?.medicalLevel || 1;
                  const hasImmunity = academyLevel >= 5 || medicalLevel >= 5;

                  const stepCards = [
                    {
                      id: 'squad' as const,
                      stepNum: '01',
                      category: t('Squad', 'Kader'),
                      title: t('Squad Cycle', 'Generationswechsel'),
                      icon: 'fa-users-gear',
                      accentText: 'text-emerald-400',
                      dotColor: 'bg-emerald-400',
                      status: isSquadTransitionActive
                        ? `${state.rebuildWageDiscountSeasons}y ${t('Active', 'Aktiv')}`
                        : `${clubOvr} OVR · ${isEligibleSquad ? t('Eligible', 'Möglich') : t('Interval', 'Intervall')}`,
                      isPositive: isSquadTransitionActive || isEligibleSquad,
                    },
                    {
                      id: 'finance' as const,
                      stepNum: '02',
                      category: t('Finance', 'Finanzen'),
                      title: t('Finance & Debt', 'Finanz-Sanierung'),
                      icon: 'fa-scale-balanced',
                      accentText: 'text-sky-400',
                      dotColor: 'bg-sky-400',
                      status: `${formatMoney(treasury)} · ${(loanBalance > 0 || treasury < 0) ? t('In Debt', 'Verschuldet') : t('Debt Free', 'Schuldenfrei')}`,
                      isPositive: treasury >= 10000000 || (loanBalance === 0 && treasury >= 0),
                    },
                    {
                      id: 'staff' as const,
                      stepNum: '03',
                      category: t('Leadership', 'Führung'),
                      title: t('Leadership Pivot', 'Führungsprofil'),
                      icon: 'fa-user-gear',
                      accentText: 'text-purple-400',
                      dotColor: 'bg-purple-400',
                      status: currentCoachArchetype,
                      isPositive: currentCoachArchetype !== 'Standard',
                    },
                    {
                      id: 'infra' as const,
                      stepNum: '04',
                      category: t('Facilities', 'Anlagen'),
                      title: t('Infrastructure', 'Infrastruktur'),
                      icon: 'fa-landmark-dome',
                      accentText: 'text-amber-400',
                      dotColor: 'bg-amber-400',
                      status: hasImmunity
                        ? t('Immunity Shield', 'Dynastie-Schutz')
                        : `Lvl ${academyLevel}/${medicalLevel}`,
                      isPositive: hasImmunity,
                    },
                  ];

                  return (
                    <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-3 sm:p-4 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                            {t('4-Pillar Rebuild Protocol', '4-Säulen Rebuild-Protokoll')}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-normal">
                          {t('Select a directive below to inspect parameters', 'Wähle eine Direktive zum Bearbeiten')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {stepCards.map((card) => {
                          const isActive = expandedRebuild === card.id;
                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => setExpandedRebuild(isActive ? null : card.id)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                isActive
                                  ? 'bg-white/[0.04] border-white/[0.12] shadow-sm'
                                  : 'bg-[#181924]/60 hover:bg-[#181924] border-white/[0.03] hover:border-white/[0.08]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-semibold tabular-nums ${card.accentText}`}>
                                    {card.stepNum}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                    {card.category}
                                  </span>
                                </div>
                                <i className={`fas ${card.icon} text-[11px] ${isActive ? card.accentText : 'text-zinc-600'}`} />
                              </div>

                              <div>
                                <div className="text-xs font-medium text-white tracking-tight truncate">
                                  {card.title}
                                </div>
                                <div className="text-[11px] text-zinc-400 font-normal tabular-nums flex items-center gap-1.5 mt-0.5 truncate">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.dotColor}`} />
                                  <span className="truncate">{card.status}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ============================================================== */}
                {/* PILLAR 1: GENERATIONAL SQUAD CYCLE                             */}
                {/* ACCENT: EMERALD                                                */}
                {/* ============================================================== */}
                {(() => {
                  const clubOvr = state.club?.baseOvr || 70;
                  const squadSize = state.club?.squadSize || 18;
                  const cMult = getCountryMult(state.club?.country || 'GER');
                  const isEligible = clubOvr >= 82 && squadSize >= 15 && (state.year - (state.lastGenerationalRebuildYear || 0) >= 5);
                  const veteransSold = Math.min(3, Math.max(2, squadSize - 13));
                  const windfall = Math.round(veteransSold * (clubOvr * 32000) * cMult);
                  const ovrDrop = Math.min(6, veteransSold * 2);
                  const isTransitionActive = (state.rebuildWageDiscountSeasons || 0) > 0;
                  const isExpanded = expandedRebuild === 'squad';

                  return (
                    <div className={`bg-[#14151e] border rounded-2xl transition-colors flex flex-col overflow-hidden ${
                      isExpanded ? 'border-white/[0.1]' : 'border-white/[0.04] hover:border-white/[0.08]'
                    }`}>
                      <div
                        onClick={() => setExpandedRebuild(isExpanded ? null : 'squad')}
                        className="p-4 sm:p-5 flex justify-between items-center cursor-pointer select-none gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] text-emerald-400 flex items-center justify-center text-sm shrink-0">
                            <i className="fas fa-users-gear" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                {t('01 · Squad Renewal', '01 · Kader-Verjüngung')}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-white tracking-tight truncate">
                              {t('Generational Squad Cycle', 'Generationswechsel (Kader)')}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate">
                              {t('Liquidate aging stars at peak · Wonderkid incubation · Wage discount relief', 'Stars am Höhepunkt verkaufen · Wonderkid-Aufbau · Gehaltserleichterung')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isTransitionActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                              <span>{state.rebuildWageDiscountSeasons}y {t('Active', 'Aktiv')}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 font-medium tabular-nums bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-lg">
                              {clubOvr} OVR · {isEligible ? t('Eligible', 'Möglich') : t('Interval Lock', 'Wartezeit')}
                            </span>
                          )}
                          <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-zinc-500 text-xs transition-transform`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-white/[0.04] flex flex-col gap-3.5 mt-1">
                          {isTransitionActive && (
                            <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
                              <div className="flex items-center gap-2 text-xs text-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                                <span>
                                  {t('Active Rebuild Transition Period:', 'Aktive Übergangsphase:')}{' '}
                                  <strong className="text-white font-medium">{state.rebuildWageDiscountSeasons}</strong> {t('season(s) 25% wage discount', 'Saison(s) 25% Gehaltserleichterung')}
                                  {state.rebuildYouthAccelSeasons ? ` · ${state.rebuildYouthAccelSeasons} ${t('season(s) +30% youth maturation', 'Saison(s) +30% Jugendförderung')}` : ''}
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                                {t('Active', 'Aktiv')}
                              </span>
                            </div>
                          )}

                          {/* Payoff Grid */}
                          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs ${isTransitionActive ? '' : 'mt-3'}`}>
                            <div className="bg-[#181924]/80 rounded-xl p-3 border border-white/[0.04] flex flex-col justify-between">
                              <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider block mb-1">{t('Transfer Windfall', 'Ablöse-Erlös')}</span>
                              <span className="text-emerald-400 font-semibold text-sm sm:text-base tabular-nums">+{formatMoney(windfall)}</span>
                            </div>
                            <div className="bg-[#181924]/80 rounded-xl p-3 border border-white/[0.04] flex flex-col justify-between">
                              <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider block mb-1">{t('Planned OVR Dip', 'Kalkulierter Knick')}</span>
                              <span className="text-rose-400 font-semibold text-sm sm:text-base tabular-nums">-{ovrDrop} OVR</span>
                            </div>
                            <div className="bg-[#181924]/80 rounded-xl p-3 border border-white/[0.04] flex flex-col justify-between">
                              <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider block mb-1">{t('Wage Discount', 'Gehaltsnachlass')}</span>
                              <span className="text-zinc-200 font-semibold text-sm sm:text-base tabular-nums">-25% (3 Yrs)</span>
                            </div>
                            <div className="bg-[#181924]/80 rounded-xl p-3 border border-white/[0.04] flex flex-col justify-between">
                              <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider block mb-1">{t('Wonderkids Added', 'Neue Talente')}</span>
                              <span className="text-zinc-200 font-semibold text-sm sm:text-base tabular-nums">+2 Wonderkids</span>
                            </div>
                          </div>

                          {/* Trigger / Confirmation */}
                          {!isTransitionActive && (
                            <div>
                              {showConfirmGenerationalRebuild ? (
                                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
                                  <div className="text-xs text-white font-medium flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    <span>{t('Confirm Generational Squad Liquidation & Youth Transition?', 'Generationswechsel & Veteranen-Verkauf bestätigen?')}</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                                    {t(
                                      `This will immediately sell ${veteransSold} veterans for +${formatMoney(windfall)}, lower base squad OVR by ${ovrDrop}, enroll 2 top prospects, and lock in 25% lower wages for 3 seasons.`,
                                      `Verkauft ${veteransSold} Stars für +${formatMoney(windfall)}, senkt Kader-GES um ${ovrDrop}, beruft 2 Top-Talente und reduziert Gehälter 3 Jahre lang um 25%.`
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = useGameStore.getState().executeGenerationalRebuild();
                                        setShowConfirmGenerationalRebuild(false);
                                        if (res.success) {
                                          setRebuildFeedback({ type: 'success', message: res.message });
                                        } else {
                                          setRebuildFeedback({ type: 'error', message: res.message });
                                        }
                                      }}
                                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition cursor-pointer active:scale-[0.99]"
                                    >
                                      {t('Confirm Rebuild Transition', 'Übergang jetzt vollziehen')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmGenerationalRebuild(false)}
                                      className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 text-xs transition cursor-pointer border border-white/[0.06]"
                                    >
                                      {t('Cancel', 'Abbrechen')}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isEligible) {
                                      setShowConfirmGenerationalRebuild(true);
                                    } else {
                                      setRebuildFeedback({
                                        type: 'error',
                                        message: clubOvr < 82
                                          ? t('Squad requires at least 82 OVR to execute a generational rebuild.', 'Kader benötigt mindestens 82 GES.')
                                          : squadSize < 15
                                          ? t('Squad requires at least 15 players.', 'Kader benötigt mindestens 15 Spieler.')
                                          : t('A generational rebuild requires at least 5 seasons between overhauls.', 'Generationswechsel erfordert mindestens 5 Saisons Abstand.')
                                      });
                                    }
                                  }}
                                  disabled={!isEligible}
                                  className={`w-full py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                                    isEligible
                                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold active:scale-[0.99]'
                                      : 'bg-white/[0.02] text-zinc-600 border border-white/[0.04] cursor-not-allowed font-medium'
                                  }`}
                                >
                                  <i className="fas fa-arrows-spin text-[10px]" />
                                  <span>
                                    {isEligible
                                      ? t('Trigger Generational Squad Transition', 'Generationswechsel einleiten')
                                      : t('Requires 82+ OVR & Veteran Roster Core (5-Yr Interval)', 'Erfordert 82+ GES & Veteranenkern (5-Jahres-Abstand)')}
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ============================================================== */}
                {/* PILLAR 2: FINANCIAL & WAGE RESTRUCTURING                       */}
                {/* ACCENT: SKY                                                    */}
                {/* ============================================================== */}
                {(() => {
                  const treasury = state.budget;
                  const isTreasuryPrudent = treasury >= 10000000;
                  const activeLoan = state.activeLoan;
                  const currentStrat = state.fanStrategy || state.club?.fanStrategy || 'balanced';
                  const isExpanded = expandedRebuild === 'finance';

                  return (
                    <div className={`bg-[#14151e] border rounded-2xl transition-colors flex flex-col overflow-hidden ${
                      isExpanded ? 'border-white/[0.1]' : 'border-white/[0.04] hover:border-white/[0.08]'
                    }`}>
                      <div
                        onClick={() => setExpandedRebuild(isExpanded ? null : 'finance')}
                        className="p-4 sm:p-5 flex justify-between items-center cursor-pointer select-none gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sky-400 flex items-center justify-center text-sm shrink-0">
                            <i className="fas fa-scale-balanced" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                {t('02 · Financial Austerity', '02 · Finanz-Sanierung')}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-white tracking-tight truncate">
                              {t('Financial & Wage Restructuring', 'Finanzielle Konsolidierung')}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate">
                              {t('Hospitality pivot · Debt clearance · €10M+ reserve yields', 'Hospitality-Fokus · Schuldendienst tilgen · €10M+ Zinsdividende')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-zinc-300 font-medium tabular-nums bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-lg">
                            {formatMoney(treasury)}
                          </span>
                          <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-zinc-500 text-xs transition-transform`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-white/[0.04] flex flex-col gap-3.5 mt-1">
                          {/* Repay Feedback */}
                          {repayFeedback && (
                            <div className="p-3 rounded-xl bg-sky-500/[0.05] border border-sky-500/20 text-sky-300 text-xs flex items-center justify-between mt-3">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                {repayFeedback}
                              </span>
                              <button onClick={() => setRepayFeedback(null)} className="text-zinc-400 hover:text-white">
                                <i className="fas fa-xmark text-xs" />
                              </button>
                            </div>
                          )}

                          {/* Financial Balance Indicators */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                            {/* Treasury Status */}
                            <div className="rounded-xl p-3.5 border border-white/[0.04] bg-[#181924]/80 flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">{t('Treasury Target (€10M+)', 'Reserve-Ziel (€10M+)')}</span>
                                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isTreasuryPrudent ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                                  <i className="fas fa-vault text-[10px] text-zinc-500" />
                                </span>
                              </div>
                              <div className="text-base font-semibold text-white my-1 tabular-nums">
                                {formatMoney(treasury)} <span className="text-xs text-zinc-500 font-normal">/ €10.0M</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-snug">
                                {isTreasuryPrudent
                                  ? t(`Prudent Reserve Active: +2% annual dividend (+${formatMoney(Math.min(2500000, Math.floor(treasury * 0.02)))}/yr).`, `Prämienrendite aktiv: +2% Jahresdividende (+${formatMoney(Math.min(2500000, Math.floor(treasury * 0.02)))}/Jahr).`)
                                  : t('Maintain €10M+ in cash treasury to unlock 2% annual interest yield.', 'Ab €10M Barreserve werden 2% Zinsdividende p.a. ausgeschüttet.')}
                              </p>
                            </div>

                            {/* Debt Status */}
                            <div className="bg-[#181924]/80 rounded-xl p-3.5 border border-white/[0.04] flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">{t('Annual Debt Service', 'Bank-Schuldendienst')}</span>
                                <i className="fas fa-building-columns text-zinc-500 text-[10px]" />
                              </div>
                              {(() => {
                                const loanBalance = activeLoan ? (activeLoan.remainingBalance ?? (activeLoan as any).principalRemaining ?? 0) : 0;
                                const payoffAmount = Math.round(loanBalance * 0.92);

                                return activeLoan && loanBalance > 0 ? (
                                  <div>
                                    <div className="text-sm font-semibold text-amber-300 my-1 tabular-nums flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                      -{formatMoney(activeLoan.annualPayment)}/yr ({formatMoney(loanBalance)} left)
                                    </div>
                                    <p className="text-[11px] text-zinc-500 mb-2.5">
                                      {activeLoan.yearsRemaining} {t('years remaining on credit facility.', 'Jahre Restlaufzeit.')}
                                    </p>
                                    {treasury >= payoffAmount ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const res = useGameStore.getState().repayClubLoanEarly();
                                          if (res?.success) {
                                            setRepayFeedback(t('Bank debt retired early! Annual debt service eliminated.', 'Kredit vorzeitig getilgt! Schuldendienst eliminiert.'));
                                          }
                                        }}
                                        className="w-full py-2 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-300 font-medium text-xs transition cursor-pointer active:scale-[0.99]"
                                      >
                                        {t('Repay Debt in Full (8% Discount)', 'Vorzeitig tilgen (8% Rabatt)')}
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-zinc-500 block">
                                        {t(`Requires ${formatMoney(payoffAmount)} to repay in full.`, `Erfordert ${formatMoney(payoffAmount)} zur Volltilgung.`)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-sm font-medium text-emerald-400 my-1 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                      {t('€0 Debt Service (Debt Free)', '€0 Schuldendienst (Schuldenfrei)')}
                                    </div>
                                    <p className="text-[11px] text-zinc-500">
                                      {t('Balance sheet unencumbered by bank liabilities.', 'Keine Bankzinslasten belasten den Etat.')}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Commercial Strategy Selector */}
                          <div className="flex flex-col gap-2 pt-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                              <i className="fas fa-ticket text-xs text-sky-400" />
                              <span>{t('Commercial & Ticketing Strategy Pivot', 'Kommerzielle Ticketing-Strategie')}</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                              {[
                                { key: 'corporate', label: 'Corporate Hospitality', desc: 'VIP Suites & High Margins', icon: 'fa-champagne-glasses' },
                                { key: 'balanced', label: 'Balanced Commercial', desc: 'Standard League Mix', icon: 'fa-scale-balanced' },
                                { key: 'community', label: 'Community Low-Margin', desc: 'Accessible Local Tickets', icon: 'fa-hands-holding-child' },
                                { key: 'ultras', label: 'Ultras Terracing', desc: 'Standing Fan Cauldron', icon: 'fa-bullhorn' },
                              ].map((strat) => {
                                const isCurrent = currentStrat === strat.key;
                                return (
                                  <button
                                    key={strat.key}
                                    type="button"
                                    onClick={() => {
                                      useGameStore.getState().setFanStrategy(strat.key as any);
                                    }}
                                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                                      isCurrent
                                        ? 'bg-sky-500/[0.06] border-sky-500/30 text-white'
                                        : 'bg-[#181924]/60 hover:bg-[#181924] border-white/[0.03] hover:border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium truncate flex items-center gap-1.5 text-white">
                                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />}
                                        {strat.label}
                                      </span>
                                      <i className={`fas ${strat.icon} text-xs ${isCurrent ? 'text-sky-400' : 'text-zinc-600'}`} />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 leading-tight block">{strat.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ============================================================== */}
                {/* PILLAR 3: BACKROOM STAFF & LEADERSHIP PIVOT                    */}
                {/* ACCENT: PURPLE                                                 */}
                {/* ============================================================== */}
                {(() => {
                  const currentCoachArchetype = state.headCoachArchetype || 'Standard';
                  const currentDirectorArchetype = state.directorArchetype || 'Standard';

                  const coachArchetypes: { id: any; name: string; desc: string; icon: string }[] = [
                    { id: 'Youth Developer', name: 'Youth Developer', desc: 'Accelerates youth timer maturation and wonderkid development (+30% progression chance).', icon: 'fa-seedling' },
                    { id: 'Scout', name: 'Talent Scout', desc: 'Lowers generational recruitment thresholds and identifies raw European gems.', icon: 'fa-magnifying-glass' },
                    { id: 'Continental Legend', name: 'Continental Legend', desc: 'Maximizes matchday win variance in European knockout ties.', icon: 'fa-trophy' },
                    { id: 'Tactician', name: 'Tactician', desc: 'Strengthens defensive positioning and counter-attack solidity.', icon: 'fa-chess-board' },
                    { id: 'Motivator', name: 'Motivator', desc: 'Sustains locker room morale floor during transition adversity.', icon: 'fa-fire' },
                    { id: 'Standard', name: 'Standard Coach', desc: 'Balanced tactical leadership across all phases.', icon: 'fa-user-tie' },
                  ];

                  const directorArchetypes: { id: any; name: string; desc: string; icon: string }[] = [
                    { id: 'Scout / Youth Developer', name: 'Scout & Developer', desc: 'Reduces elite wonderkid threshold from 80 to 70 OVR for youth academy prospects.', icon: 'fa-user-graduate' },
                    { id: 'Financial Mogul', name: 'Financial Mogul', desc: 'Master commercial negotiator — secures lucrative corporate sponsorship tiers.', icon: 'fa-coins' },
                    { id: 'Brand Ambassador', name: 'Brand Ambassador', desc: 'Expands spectator catchment and domestic ticket demand.', icon: 'fa-bullhorn' },
                    { id: 'Standard', name: 'Standard Director', desc: 'Balanced front-office administration.', icon: 'fa-briefcase' },
                  ];

                  const currentClubVision = state.clubVision || 'Standard';
                  const clubVisions: { id: any; name: string; desc: string; icon: string }[] = [
                    { id: 'Standard', name: t('Standard Vision', 'Standard-Vision'), desc: t('Traditional European club operations with balanced objectives.', 'Klassische Vereinsführung mit ausgewogener Balance aller Bereiche.'), icon: 'fa-scale-balanced' },
                    { id: 'Youth Academy Focus', name: t('Youth Academy Focus', 'Nachwuchs-Inkubator'), desc: t('+12 quality bonus on youth prospect rolls. Maximizes wonderkid emergence.', '+12 Scouting-Qualitätsbonus auf Jugendtalente. Fördert Jahrhunderttalente.'), icon: 'fa-seedling' },
                    { id: 'Galactico Builder', name: t('Galactico Builder', 'Galactico-Dynastie'), desc: t('Prioritizes international star power, aggressive commercial reach, and brand prestige.', 'Fokus auf Weltstars, globale Reichweite und maximale Markenstrahlkraft.'), icon: 'fa-crown' },
                    { id: 'Financial Prudence', name: t('Financial Prudence', 'Finanzielle Solidität'), desc: t('+15% operating surplus bonus to net financials every season.', '+15% operativer Überschuss-Bonus auf das Nettoergebnis jeder Saison.'), icon: 'fa-piggy-bank' },
                    { id: 'Local Heritage', name: t('Local Heritage', 'Regionale Verwurzelung'), desc: t('Organically adds +800 dedicated supporters to the club fanbase every season.', 'Fügt der Fanbasis jede Saison organisch +800 treue Anhänger hinzu.'), icon: 'fa-users-rays' },
                  ];

                  const isExpanded = expandedRebuild === 'staff';

                  return (
                    <div className={`bg-[#14151e] border rounded-2xl transition-colors flex flex-col overflow-hidden ${
                      isExpanded ? 'border-white/[0.1]' : 'border-white/[0.04] hover:border-white/[0.08]'
                    }`}>
                      <div
                        onClick={() => setExpandedRebuild(isExpanded ? null : 'staff')}
                        className="p-4 sm:p-5 flex justify-between items-center cursor-pointer select-none gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] text-purple-400 flex items-center justify-center text-sm shrink-0">
                            <i className="fas fa-user-gear" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                {t('03 · Leadership Pivot', '03 · Führungs-Strategie')}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-white tracking-tight truncate">
                              {t('Backroom Staff & Leadership Pivot', 'Führungspersonal & Kurswechsel')}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate">
                              {t('Leadership identity · Coach & Director archetypes · Vision alignment', 'Führungsprofil · Trainer- & Direktor-Archetypen · Vision')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-zinc-300 font-medium tabular-nums bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-lg truncate max-w-[130px] sm:max-w-none">
                            {currentCoachArchetype}
                          </span>
                          <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-zinc-500 text-xs transition-transform`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-white/[0.04] flex flex-col gap-4 mt-1">
                          {/* Head Coach Archetype Section */}
                          <div className="flex flex-col gap-2 mt-3">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <i className="fas fa-clipboard-user text-xs text-purple-400" />
                                <span>{t('Head Coach Philosophy Archetype', 'Cheftrainer-Archetyp')}</span>
                              </span>
                              <span className="text-zinc-500 normal-case font-normal text-[11px]">
                                {t('Current', 'Aktiv')}: <strong className="text-purple-300 font-medium">{currentCoachArchetype}</strong>
                              </span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {coachArchetypes.map((arch) => {
                                const isCurrent = currentCoachArchetype === arch.id;
                                return (
                                  <button
                                    key={arch.id}
                                    type="button"
                                    onClick={() => {
                                      useGameStore.getState().setHeadCoachArchetype(arch.id);
                                      setRebuildFeedback({
                                        type: 'success',
                                        message: t(`Appointed ${arch.name} coaching philosophy.`, `${arch.name} als Trainerphilosophie übernommen.`)
                                      });
                                    }}
                                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                                      isCurrent
                                        ? 'bg-purple-500/[0.06] border-purple-500/30 text-white'
                                        : 'bg-[#181924]/60 hover:bg-[#181924] border-white/[0.03] hover:border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium truncate text-white flex items-center gap-1.5">
                                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
                                        {arch.name}
                                      </span>
                                      <i className={`fas ${arch.icon} text-xs ${isCurrent ? 'text-purple-400' : 'text-zinc-600'}`} />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 leading-tight block">{arch.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Director of Handball Archetype Section */}
                          <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-3">
                            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <i className="fas fa-briefcase text-xs text-purple-400" />
                                <span>{t('Director of Handball Archetype', 'Sportdirektor-Archetyp')}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                {state.lastDirectorChangeYear === state.year && (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-amber-300 font-medium">
                                    🔒 {t('Season Locked', 'Saisonsperre')}
                                  </span>
                                )}
                                <span className="text-zinc-500 normal-case font-normal text-[11px]">
                                  {t('Current', 'Aktiv')}: <strong className="text-purple-300 font-medium">{currentDirectorArchetype}</strong>
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {directorArchetypes.map((arch) => {
                                const isCurrent = currentDirectorArchetype === arch.id;
                                const isDirectorLocked = state.lastDirectorChangeYear === state.year && !isCurrent;
                                return (
                                  <button
                                    key={arch.id}
                                    type="button"
                                    disabled={isDirectorLocked}
                                    onClick={() => {
                                      if (isDirectorLocked) {
                                        setRebuildFeedback({
                                          type: 'error',
                                          message: t(`Director position locked for ${state.year}. Requires 1 season tenure.`, `Sportdirektor für ${state.year} gesperrt. Erfordert 1 Saison Amtszeit.`)
                                        });
                                        return;
                                      }
                                      useGameStore.getState().setDirectorArchetype(arch.id);
                                      setRebuildFeedback({
                                        type: 'success',
                                        message: t(`Appointed ${arch.name} as Director of Handball.`, `${arch.name} als Sportdirektor ernannt.`)
                                      });
                                    }}
                                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                                      isCurrent
                                        ? 'bg-purple-500/[0.06] border-purple-500/30 text-white'
                                        : isDirectorLocked
                                        ? 'bg-black/20 border-white/[0.03] text-zinc-600 opacity-50 cursor-not-allowed'
                                        : 'bg-[#181924]/60 hover:bg-[#181924] border-white/[0.03] hover:border-white/[0.08] text-zinc-400 hover:text-zinc-200 cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium truncate text-white flex items-center gap-1.5">
                                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
                                        {arch.name}
                                      </span>
                                      <i className={`fas ${arch.icon} text-xs ${isCurrent ? 'text-purple-400' : isDirectorLocked ? 'text-zinc-700' : 'text-zinc-600'}`} />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 leading-tight block">{arch.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Club Vision Archetype Section */}
                          <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-3">
                            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <i className="fas fa-compass text-xs text-purple-400" />
                                <span>{t('Strategic Club Vision Identity', 'Strategische Vereinsvision & Identität')}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 font-mono font-medium bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
                                  2 DP {t('Cost', 'Kosten')}
                                </span>
                                <span className="text-zinc-500 normal-case font-normal text-[11px]">
                                  {t('Active', 'Aktiv')}: <strong className="text-purple-300 font-medium">{currentClubVision}</strong>
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {clubVisions.map((vision) => {
                                const isCurrent = currentClubVision === vision.id;
                                return (
                                  <button
                                    key={vision.id}
                                    type="button"
                                    onClick={() => {
                                      if (isCurrent) return;
                                      if ((state.skillPoints || 0) < 2) {
                                        setRebuildFeedback({
                                          type: 'error',
                                          message: t('Requires 2 DP (Director Points) to restructure club vision.', 'Erfordert 2 DP (Direktorenpunkte) zur Neuausrichtung der Vereinsvision.')
                                        });
                                        return;
                                      }
                                      useGameStore.getState().setClubVision(vision.id);
                                      setRebuildFeedback({
                                        type: 'success',
                                        message: t(`Club vision restructured to: ${vision.name}.`, `Vereinsvision neu ausgerichtet auf: ${vision.name}.`)
                                      });
                                    }}
                                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                                      isCurrent
                                        ? 'bg-purple-500/[0.06] border-purple-500/30 text-white'
                                        : 'bg-[#181924]/60 hover:bg-[#181924] border-white/[0.03] hover:border-white/[0.08] text-zinc-400 hover:text-zinc-200 cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium truncate text-white flex items-center gap-1.5">
                                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />}
                                        {vision.name}
                                      </span>
                                      <i className={`fas ${vision.icon} text-xs ${isCurrent ? 'text-purple-400' : 'text-zinc-600'}`} />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 leading-tight block">{vision.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ============================================================== */}
                {/* PILLAR 4: INFRASTRUCTURE & FACILITY MATURATION                 */}
                {/* ACCENT: AMBER                                                  */}
                {/* ============================================================== */}
                {(() => {
                  const academyLevel = state.club?.academyLevel || 1;
                  const medicalLevel = state.club?.medicalLevel || 1;
                  const hasImmunity = academyLevel >= 5 || medicalLevel >= 5;
                  const hasFullMaturation = academyLevel >= 5 && medicalLevel >= 5;
                  const isExpanded = expandedRebuild === 'infra';

                  return (
                    <div className={`bg-[#14151e] border rounded-2xl transition-colors flex flex-col overflow-hidden ${
                      isExpanded ? 'border-white/[0.1]' : 'border-white/[0.04] hover:border-white/[0.08]'
                    }`}>
                      <div
                        onClick={() => setExpandedRebuild(isExpanded ? null : 'infra')}
                        className="p-4 sm:p-5 flex justify-between items-center cursor-pointer select-none gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] text-amber-400 flex items-center justify-center text-sm shrink-0">
                            <i className="fas fa-landmark-dome" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                {t('04 · Facility Maturation', '04 · Infrastruktur-Reife')}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-white tracking-tight truncate">
                              {t('Infrastructure & Facility Maturation', 'Infrastruktur & Reifegrad')}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate">
                              {t('Level 5 facilities · Halves dynasty taxes · Wonderkid incubator', 'Stufe 5 Anlagen · Dynastie-Immunität · Talent-Inkubator')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {hasImmunity ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                              <span>{t('Immunity Active', 'Immunität Aktiv')}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 font-medium tabular-nums bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-lg">
                              Lvl {academyLevel} / {medicalLevel}
                            </span>
                          )}
                          <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-zinc-500 text-xs transition-transform`} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-white/[0.04] flex flex-col gap-3.5 mt-1">
                          {/* Facilities Status Gauges */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                            {/* Academy Level */}
                            <div className="bg-[#181924]/80 rounded-xl p-3.5 border border-white/[0.04] flex flex-col justify-between gap-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-white flex items-center gap-2">
                                  <i className="fas fa-graduation-cap text-amber-400 text-xs" />
                                  <span>{t('Youth Academy Maturation', 'Jugendakademie-Reife')}</span>
                                </span>
                                <span className="text-xs font-medium text-zinc-300 tabular-nums">
                                  Level {academyLevel} / 5
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 my-0.5">
                                {[1, 2, 3, 4, 5].map((lvl) => (
                                  <div
                                    key={`acad-${lvl}`}
                                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                                      lvl <= academyLevel ? 'bg-amber-400' : 'bg-white/[0.06]'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-snug">
                                {academyLevel >= 5
                                  ? t('Pinnacle Incubator: 65% accelerated wonderkid generation & tax immunity.', 'Elite-Incubator: 65% Wonderkid-Beschleunigung & Steuer-Immunität.')
                                  : t(`Level ${academyLevel}: Upgrade to Level 5 to unlock permanent dynasty protection.`, `Stufe ${academyLevel}: Auf Stufe 5 ausbauen für dauerhafte Dynastie-Immunität.`)}
                              </p>
                            </div>

                            {/* Medical Center */}
                            <div className="bg-[#181924]/80 rounded-xl p-3.5 border border-white/[0.04] flex flex-col justify-between gap-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-white flex items-center gap-2">
                                  <i className="fas fa-heart-pulse text-amber-400 text-xs" />
                                  <span>{t('Medical & Recovery Center', 'Medizinisches Zentrum')}</span>
                                </span>
                                <span className="text-xs font-medium text-zinc-300 tabular-nums">
                                  Level {medicalLevel} / 5
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 my-0.5">
                                {[1, 2, 3, 4, 5].map((lvl) => (
                                  <div
                                    key={`med-${lvl}`}
                                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                                      lvl <= medicalLevel ? 'bg-amber-400' : 'bg-white/[0.06]'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-snug">
                                {medicalLevel >= 5
                                  ? t('Elite Performance Hub: Veteran decline suppressed & tax immunity.', 'Elite-Zentrum: Veteranen-Verschleiß gestoppt & Steuer-Immunität.')
                                  : t(`Level ${medicalLevel}: Upgrade to Level 5 to mitigate title-defense penalties.`, `Stufe ${medicalLevel}: Auf Stufe 5 ausbauen für Dynastie-Abzugshalbierung.`)}
                              </p>
                            </div>
                          </div>

                          {/* Immunity Shield Summary Box */}
                          <div className="p-3.5 rounded-xl border border-white/[0.04] bg-[#181924]/60 flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center shrink-0 text-amber-400">
                              <i className={`fas ${hasImmunity ? 'fa-shield-halved' : 'fa-shield'} text-sm`} />
                            </div>
                            <div className="text-xs min-w-0">
                              <div className="font-medium text-white flex items-center gap-2">
                                {hasImmunity && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                                <span>
                                  {hasFullMaturation
                                    ? t('Complete Infrastructure Maturation Achieved', 'Vollständige Infrastruktur-Reife erreicht')
                                    : hasImmunity
                                    ? t('Systemic Dynasty Immunity Shield Engaged', 'Systemische Dynastie-Immunität aktiv')
                                    : t('Standard Vulnerability to Dynasty Penalty', 'Standard-Verwundbarkeit gegen Dynastie-Abzüge')}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug font-normal">
                                {hasImmunity
                                  ? t('Target on the Back penalty on consecutive titles is halved from -0.5 to -0.25.', 'Target-on-the-Back-Steuer bei Titelverteidigungen ist von -0,5 auf -0,25 halbiert.')
                                  : t('Consecutive title defenses suffer -0.5 OVR penalty per title until a Level 5 facility is achieved.', 'Titelverteidigungen kosten -0,5 GES pro Folgetitel ohne Stufe-5-Infrastruktur.')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-[#0c0d12] flex items-center justify-between shrink-0">
          <p className="text-xs text-zinc-400 font-normal hidden sm:block">
            {activeTab === 'overview'
              ? 'Tactical identity and managerial record update dynamically as competitive seasons conclude.'
              : t(
                  'Board and supporters may demand philosophical shifts during challenging periods.',
                  'Vorstand und Fans können bei Krisen Anpassungen der Spielphilosophie anmahnen.'
                )}
          </p>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold rounded-xl transition cursor-pointer border border-white/[0.08]"
          >
            {t('Close', 'Schließen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
