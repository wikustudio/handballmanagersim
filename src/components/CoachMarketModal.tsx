import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Coach } from '../types';
const t = (lang: string, en: string, de?: string) => en;
import { formatMoney, TACTICS, getCreditLimit, PHILOSOPHIES, isTacticalSynergy, normalizeTactic } from '../data/gameConstants';
import { generateCoachMarket, getCoachTraitInfo, getCoachWeaknessInfo, getCoachArchetypeConfig } from '../engine/coachEngine';
import { CoachDossierModal } from './CoachDossierModal';

interface CoachMarketModalProps {
  state: GameState;
  lang: string;
  onHire: (coach: Coach) => void;
  onFire: () => void;
  onClose: () => void;
  onRenew?: (years: number) => void;
  onScout?: (coachId: string) => void;
  onInitMarket?: (pool: Coach[]) => void;
  onSelectPhilosophy?: (philosophyKey: string) => void;
  initialTab?: 'staff' | 'market' | 'philosophy';
}

type MarketSortOption = 'synergy' | 'ovr' | 'wage' | 'rep';
type MarketFilterOption = 'all' | 'synergy' | 'youth' | 'reserve' | 'scouted';

export const CoachMarketModal: React.FC<CoachMarketModalProps> = ({ 
  state, 
  lang, 
  onHire, 
  onFire, 
  onClose, 
  onRenew, 
  onScout,
  onInitMarket,
  onSelectPhilosophy,
  initialTab = 'staff'
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'market' | 'philosophy'>(() => {
    // If no coach appointed and opened without explicit initialTab, default to job market
    if (!state.currentCoach && initialTab === 'staff') return 'market';
    return initialTab;
  });

  const [market, setMarket] = useState<Coach[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmFire, setConfirmFire] = useState(false);
  const [renewYears, setRenewYears] = useState(2);
  const [dossierCoach, setDossierCoach] = useState<Coach | null>(null);
  const [pendingMismatchCoach, setPendingMismatchCoach] = useState<Coach | null>(null);

  // Job Market View Mode: Condensed Shortlist (default) vs Expanded Cards
  const [marketViewMode, setMarketViewMode] = useState<'condensed' | 'cards'>('condensed');
  const [expandedCoachId, setExpandedCoachId] = useState<string | null>(null);

  // Job Market Filter & Sort State
  const [selectedFilter, setSelectedFilter] = useState<MarketFilterOption>('all');
  const [sortBy, setSortBy] = useState<MarketSortOption>('synergy');

  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  const directorRep = state.reputation || 50;
  const creditLimit = getCreditLimit(state.club.tier, state.club.country || 'GER');
  const hasMutualConsent = (state.managerSkills || []).includes('mutual_consent');

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // If game state already has an established candidate pool for this season, use it!
    if (state.coachMarketPool && state.coachMarketPool.length > 0) {
      const scoutedSet = new Set(state.scoutedCoachIds || []);
      setMarket(state.coachMarketPool.map(c => ({
        ...c,
        isScouted: Boolean(c.isScouted || scoutedSet.has(c.id))
      })));
      return;
    }

    const rep = state.reputation || 50;
    const tier = state.club.tier;
    const country = state.club.country || 'GER';
    const rawMarket = generateCoachMarket(tier, country, rep, state.firedCoachesCount || 0, state.seasonPhase, state.clubIdentity);
    const scoutedSet = new Set(state.scoutedCoachIds || []);
    const initialPool = rawMarket.map(c => ({
      ...c,
      isScouted: Boolean(c.isScouted || scoutedSet.has(c.id))
    }));
    setMarket(initialPool);
    if (onInitMarket) {
      onInitMarket(initialPool);
    }
  }, [state.club.tier, state.club.country, state.seasonPhase, state.coachMarketPool, state.scoutedCoachIds, state.clubIdentity]);

  const handleTabChange = (tab: 'staff' | 'market' | 'philosophy') => {
    setActiveTab(tab);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleFilterChange = (filter: MarketFilterOption) => {
    setSelectedFilter(filter);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleRenew = () => {
    setIsProcessing(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (onRenew) onRenew(renewYears);
      setIsProcessing(false);
    }, 500);
  };

  const executeHire = (coach: Coach) => {
    setIsProcessing(true);
    setPendingMismatchCoach(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onHire(coach);
      setIsProcessing(false);
      // Smart Auto-Routing: Instantly route user to 'staff' tab to see their new hire!
      setActiveTab('staff');
    }, 400);
  };

  const handleHire = (coach: Coach) => {
    // Synergy Mismatch Intercept
    if (!isTacticalSynergy(coach.style, state.tactic)) {
      setPendingMismatchCoach(coach);
      return;
    }
    executeHire(coach);
  };

  const isCoachScouted = (c: Coach) => {
    return Boolean(
      c.isScouted || 
      (state.scoutedCoachIds && state.scoutedCoachIds.includes(c.id))
    );
  };

  const getOvrImpactInfo = (coach: Coach) => {
    const isScouted = isCoachScouted(coach);
    const boost = coach.ovrBoost ?? 0;
    const currentBoost = state.currentCoach ? (state.currentCoach.ovrBoost ?? 0) : -4;
    const netDelta = boost - currentBoost;
    const currentClubOvr = state.club.baseOvr ?? 75;
    const projectedClubOvr = state.currentCoach 
      ? (currentClubOvr - currentBoost + boost)
      : (currentClubOvr + boost);

    return {
      isScouted,
      boost,
      formattedBoost: `${boost >= 0 ? '+' : ''}${boost} OVR`,
      netDelta,
      formattedNetDelta: `${netDelta >= 0 ? '+' : ''}${netDelta}`,
      currentClubOvr,
      projectedClubOvr,
    };
  };

  const toggleExpand = (coachId: string) => {
    setExpandedCoachId((prev) => (prev === coachId ? null : coachId));
  };

  const handleScout = (coachId: string) => {
    if ((state.skillPoints || 0) < 1) return;
    if (onScout) {
      onScout(coachId);
    }
    setMarket((prev) =>
      prev.map((c) => (c.id === coachId ? { ...c, isScouted: true } : c))
    );
  };

  const handleFire = () => {
    setIsProcessing(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onFire();
      setConfirmFire(false);
      setIsProcessing(false);
      // Smart Auto-Routing: Instantly route user to 'market' tab to find replacement!
      setActiveTab('market');
    }, 400);
  };

  const isYouthCoach = (c: Coach) => {
    return c.strength === 'Youth Focus' || 
      c.strength === 'Youth Whisperer' || 
      c.coachArchetype === 'youth_visionary' || 
      c.name.toLowerCase().includes('youth');
  };

  const isReserveCoach = (c: Coach) => {
    return Boolean(c.isReserveCoach) ||
      c.strength === 'Reserve Focus' ||
      c.name.toLowerCase().includes('reserve') ||
      /\s+(ii|castilla)$/i.test(c.name.trim());
  };

  const currentCoachArch = state.currentCoach 
    ? getCoachArchetypeConfig(state.currentCoach.coachArchetype || state.currentCoach.archetype) 
    : null;

  const currentCoachHasSynergy = state.currentCoach 
    ? isTacticalSynergy(state.currentCoach.style, state.tactic) 
    : false;

  // Counts for filter chips
  const synergyCount = useMemo(() => market.filter(c => isTacticalSynergy(c.style, state.tactic)).length, [market, state.tactic]);
  const youthCount = useMemo(() => market.filter(isYouthCoach).length, [market]);
  const reserveCount = useMemo(() => market.filter(isReserveCoach).length, [market]);
  const scoutedCount = useMemo(() => market.filter(c => isCoachScouted(c)).length, [market, state.scoutedCoachIds]);

  // Filtered & Sorted Market Candidates
  const filteredAndSortedMarket = useMemo(() => {
    const list = market.filter(coach => {
      if (selectedFilter === 'synergy' && !isTacticalSynergy(coach.style, state.tactic)) return false;
      if (selectedFilter === 'youth' && !isYouthCoach(coach)) return false;
      if (selectedFilter === 'reserve' && !isReserveCoach(coach)) return false;
      if (selectedFilter === 'scouted' && !isCoachScouted(coach)) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'synergy') {
        const aSyn = isTacticalSynergy(a.style, state.tactic) ? 1 : 0;
        const bSyn = isTacticalSynergy(b.style, state.tactic) ? 1 : 0;
        if (aSyn !== bSyn) return bSyn - aSyn;
        return (b.ovrBoost || 0) - (a.ovrBoost || 0);
      }
      if (sortBy === 'ovr') {
        return (b.ovrBoost || 0) - (a.ovrBoost || 0);
      }
      if (sortBy === 'wage') {
        return a.cost - b.cost;
      }
      if (sortBy === 'rep') {
        return a.repReq - b.repReq;
      }
      return 0;
    });
  }, [market, selectedFilter, sortBy, state.tactic]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-2xl flex flex-col items-center justify-center p-2.5 sm:p-5 z-50 cursor-pointer text-left overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.98, opacity: 0 }} 
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/95 text-white w-full max-w-4xl rounded-[28px] sm:rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-white/[0.08] backdrop-blur-3xl relative cursor-default max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto flex flex-col overflow-hidden shrink-0"
      >
        {/* Subtle Ambient Sky Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] shrink-0 relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-sky-400 text-base shadow-inner shrink-0">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5">
                  {t(lang, 'Director Office · Tactical Leadership & Staff', 'Direktor-Büro · Taktische Führung & Stab')}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                  {t(lang, 'Coaching Staff & Tactical Desk', 'Trainerstab & Taktik-Zentrale')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Director Stats Status Strip */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-xl">
                <span>{t(lang, 'Reputation:', 'Ansehen:')} <strong className="text-sky-300 font-semibold tabular-nums">{directorRep}</strong></span>
                <span className="text-zinc-600">·</span>
                <span>{t(lang, 'DP Balance:', 'DP:')} <strong className="text-amber-400 font-semibold tabular-nums">{state.skillPoints || 0} DP</strong></span>
              </div>

              <button 
                aria-label="Close modal"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/[0.08] shrink-0"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl w-full sm:w-auto">
              {/* Tab 1: My Staff */}
              <button
                type="button"
                onClick={() => handleTabChange('staff')}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'staff'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <i className="fa-solid fa-id-badge text-[11px]"></i>
                <span>{t(lang, 'My Staff', 'Mein Stab')}</span>
                {state.currentCoach ? (
                  currentCoachHasSynergy ? (
                    <i className={`fa-solid fa-bolt text-[10px] ${activeTab === 'staff' ? 'text-amber-200' : 'text-sky-400'}`} title="Synergy Active"></i>
                  ) : null
                ) : (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${activeTab === 'staff' ? 'bg-black/30 text-rose-200' : 'bg-rose-500/20 text-rose-300'}`}>
                    -4 OVR
                  </span>
                )}
              </button>

              {/* Tab 2: Job Market */}
              <button
                type="button"
                onClick={() => handleTabChange('market')}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'market'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <i className="fa-solid fa-briefcase text-[11px]"></i>
                <span>{t(lang, 'Job Market', 'Trainermarkt')}</span>
                <span className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded ${
                  activeTab === 'market' ? 'bg-black/25 text-white' : 'bg-white/[0.06] text-zinc-300'
                }`}>
                  {market.length}
                </span>
              </button>

              {/* Tab 3: Philosophy */}
              <button
                type="button"
                onClick={() => handleTabChange('philosophy')}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'philosophy'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <i className="fa-solid fa-chess text-[11px]"></i>
                <span>{t(lang, 'Philosophy', 'Philosophie')}</span>
                <span className={`text-[10px] hidden md:inline font-semibold px-1.5 py-0.2 rounded truncate max-w-[90px] ${
                  activeTab === 'philosophy' ? 'bg-black/25 text-white' : 'bg-white/[0.06] text-zinc-300'
                }`}>
                  {state.tactic || 'Total Football'}
                </span>
              </button>
            </div>

            {/* Mobile Director Stats */}
            <div className="flex sm:hidden items-center gap-2 text-[11px] text-zinc-400 shrink-0">
              <span className="font-semibold text-sky-300">{directorRep} Rep</span>
              <span className="text-zinc-600">·</span>
              <span className="font-semibold text-amber-400">{state.skillPoints || 0} DP</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar relative z-10 space-y-5">
          
          {/* ========================================================================= */}
          {/* TAB 1: MY STAFF (CURRENT COACH HUD & CONTRACT ACTIONS)                    */}
          {/* ========================================================================= */}
          {activeTab === 'staff' && (
            <div className="space-y-5">
              {state.currentCoach ? (
                <>
                  {/* Current Head Coach Bento Card */}
                  <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.07] rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-sm">
                    {currentCoachHasSynergy && (
                      <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                    )}

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 relative z-10">
                      <div className="flex-1 min-w-0">
                        {/* Kicker metadata */}
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-2 flex-wrap">
                          <span className="font-semibold uppercase tracking-wider text-sky-400">
                            {t(lang, 'Current Head Coach', 'Aktueller Cheftrainer')}
                          </span>
                          <span className="text-zinc-600">·</span>
                          <span className="text-zinc-300 font-medium">
                            {t(lang, `Years at Club: ${state.coachTenure || 0}`, `Jahre im Verein: ${state.coachTenure || 0}`)}
                          </span>
                          {currentCoachArch && (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-300 flex items-center gap-1.5">
                                <i className={`fa-solid ${currentCoachArch.icon} text-[10px] text-sky-400`}></i>
                                <span>{currentCoachArch.labelEn}</span>
                              </span>
                            </>
                          )}
                          {state.currentCoach.nationality && (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-400">{state.currentCoach.nationality}</span>
                            </>
                          )}
                        </div>

                        {/* Coach Name & Tactical Style */}
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            {state.currentCoach.name}
                          </h3>

                          <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-xl">
                            <i className={`fas ${TACTICS[state.currentCoach.style]?.icon || 'fa-chess-board'} text-sky-400 text-xs`}></i>
                            <span>{state.currentCoach.style}</span>
                            {currentCoachHasSynergy && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <i className="fa-solid fa-bolt text-[9px]"></i>
                                {t(lang, 'Aligned', 'Harmonisch')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Lifecycle Badges: Stale Voice / New Manager Bounce */}
                        {((state.coachTenure || 0) >= 3 || state.hasNewManagerBounce) && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {(state.coachTenure || 0) >= 3 && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                                <i className="fa-solid fa-triangle-exclamation text-rose-400 text-xs"></i>
                                <span>{t(lang, 'Stale Voice: Squad is tuning out the manager.', 'Abnutzungseffekt: Die Mannschaft hört nicht mehr auf den Trainer.')}</span>
                                {state.currentCoach.strength === 'Continental Legend' ? (
                                  <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                                    {t(lang, 'Legend Immune', 'Legende Immun')}
                                  </span>
                                ) : (
                                  <span className="ml-1 px-1.5 py-0.5 rounded-md bg-rose-500/30 text-rose-200 text-[10px] font-bold uppercase tracking-wider">
                                    -1 OVR
                                  </span>
                                )}
                              </div>
                            )}

                            {state.hasNewManagerBounce && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                                <i className="fa-solid fa-sparkles text-emerald-400 text-xs"></i>
                                <span>{t(lang, 'New Manager Bounce: Honeymoon phase active (+2 OVR)', 'Trainereffekt aktiv: Flitterwochen (+2 GES)')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* System Synergy Status Banner */}
                        <div className={`mt-4 p-3.5 rounded-2xl border flex items-start gap-3 ${
                          currentCoachHasSynergy
                            ? 'bg-emerald-500/[0.08] border-emerald-500/30'
                            : 'bg-amber-500/[0.08] border-amber-500/25'
                        }`}>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            currentCoachHasSynergy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            <i className={`fa-solid ${currentCoachHasSynergy ? 'fa-bolt' : 'fa-arrows-split-up-and-left'} text-sm`}></i>
                          </div>
                          <div className="text-xs leading-relaxed">
                            <div className={`font-bold ${currentCoachHasSynergy ? 'text-emerald-300' : 'text-amber-300'}`}>
                              {currentCoachHasSynergy 
                                ? (state.currentCoach.weakness === 'Tactical Rigidity'
                                    ? t(lang, 'Tactical System Synergy Active (+3 OVR Dogmatist Boost)', 'Taktische System-Synergie aktiv (+3 GES Dogmatiker-Bonus)')
                                    : t(lang, 'Tactical System Synergy Active (+2 OVR Match Boost)', 'Taktische System-Synergie aktiv (+2 GES Bonus)'))
                                : t(lang, 'Tactical Philosophy Mismatch', 'Taktische System-Divergenz')
                              }
                            </div>
                            <p className="text-zinc-300 mt-0.5">
                              {currentCoachHasSynergy ? (
                                t(
                                  lang,
                                  `Both head coach (${state.currentCoach.style}) and club DNA (${state.tactic}) operate with harmonious tactical synergy. First-team squad unlocked the authentic ${state.currentCoach.weakness === 'Tactical Rigidity' ? '+3' : '+2'} OVR system bonus.`,
                                  `Sowohl Cheftrainer (${state.currentCoach.style}) als auch Vereins-DNA (${state.tactic}) spielen in perfekter taktischer Harmonie. Die Mannschaft erhält den authentischen ${state.currentCoach.weakness === 'Tactical Rigidity' ? '+3' : '+2'} GES System-Bonus.`
                                )
                              ) : (
                                <span>
                                  {t(
                                    lang,
                                    `Coach prefers ${state.currentCoach.style}, but active club DNA is ${state.tactic}. `,
                                    `Trainer favorisiert ${state.currentCoach.style}, die Vereins-DNA ist jedoch ${state.tactic}. `
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleTabChange('philosophy')}
                                    className="text-sky-300 hover:text-white underline font-semibold cursor-pointer ml-1 inline-flex items-center gap-1"
                                  >
                                    <span>{t(lang, 'Align in Philosophy Tab', 'Im Philosophie-Tab anpassen')}</span>
                                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                                  </button>
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Trait & Downside Breakdown */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {state.currentCoach.strength && (() => {
                            const traitInfo = getCoachTraitInfo(state.currentCoach.strength);
                            return (
                              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                <div className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider flex items-center gap-1.5 mb-1">
                                  <i className={`fas ${traitInfo.icon} text-xs`}></i>
                                  <span>{t(lang, 'Specialty Trait', 'Spezial-Fähigkeit')}</span>
                                </div>
                                <div className="text-xs font-bold text-white">{traitInfo.name}</div>
                                <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{traitInfo.desc}</div>
                              </div>
                            );
                          })()}

                          {state.currentCoach.weakness && (() => {
                            const weakInfo = getCoachWeaknessInfo(state.currentCoach.weakness);
                            const isDogmatist = state.currentCoach.weakness === 'Tactical Rigidity';

                            return (
                              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                                <div>
                                  <div className="text-[10px] uppercase font-semibold text-rose-400 tracking-wider flex items-center gap-1.5 mb-1">
                                    <i className={`fas ${weakInfo.icon} text-xs`}></i>
                                    <span>{t(lang, 'Vulnerability / Downside', 'Schwachstelle')}</span>
                                  </div>
                                  <div className="text-xs font-bold text-white">{weakInfo.name}</div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{weakInfo.desc}</div>
                                </div>

                                {isDogmatist && (
                                  <div className={`mt-2.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 border ${
                                    currentCoachHasSynergy
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  }`}>
                                    <i className={`fa-solid ${currentCoachHasSynergy ? 'fa-circle-check text-emerald-400' : 'fa-triangle-exclamation text-rose-400'} text-[11px] shrink-0`}></i>
                                    <span>
                                      {currentCoachHasSynergy
                                        ? t(lang, 'Dogmatist Satisfied · Mutiny Averted · +3 OVR Bonus Active!', 'Dogmatiker zufrieden · Meuterei abgewendet · +3 GES Bonus aktiv!')
                                        : t(lang, 'Dogmatist Incompatible · Active Mutiny: -5 OVR & -25 Morale!', 'Dogmatiker unvereinbar · Aktive Meuterei: -5 GES & -25 Moral!')
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right Pillar: Metric Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-1 gap-2.5 shrink-0 md:w-48">
                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-left md:text-right">
                          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                            {t(lang, 'OVR Impact', 'Einfluss')}
                          </div>
                          <div className={`text-2xl font-black tabular-nums tracking-tight mt-0.5 ${
                            (state.currentCoach.ovrBoost || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(state.currentCoach.ovrBoost || 0) >= 0 ? '+' : ''}{state.currentCoach.ovrBoost || 0} <span className="text-xs font-normal text-zinc-400">OVR</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {currentCoachHasSynergy ? t(lang, 'Synergy active', 'Synergie aktiv') : t(lang, 'Base squad impact', 'Basis-Einfluss')}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-left md:text-right">
                          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                            {t(lang, 'Years at Club', 'Dienstzeit')}
                          </div>
                          <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                            {state.coachTenure || 0} {t(lang, ((state.coachTenure || 0) === 1 ? 'yr' : 'yrs'), ((state.coachTenure || 0) === 1 ? 'Jahr' : 'Jahre'))}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {(state.coachTenure || 0) >= 3 ? (
                              <span className="text-rose-400 font-semibold">{t(lang, 'Stale Voice (-1 OVR)', 'Abnutzung (-1 GES)')}</span>
                            ) : state.hasNewManagerBounce ? (
                              <span className="text-emerald-400 font-semibold">{t(lang, 'Bounce (+2 OVR)', 'Effekt (+2 GES)')}</span>
                            ) : (
                              <span>{t(lang, 'Tenure secured', 'Im Verein')}</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-left md:text-right">
                          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                            {t(lang, 'Contract Left', 'Restvertrag')}
                          </div>
                          <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                            {state.currentCoach.contractYearsLeft ?? 1} {t(lang, (state.currentCoach.contractYearsLeft === 1 ? 'yr' : 'yrs'), (state.currentCoach.contractYearsLeft === 1 ? 'Jahr' : 'Jahre'))}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {state.currentCoach.contractYearsLeft === 0 ? (
                              <span className="text-rose-400 font-semibold">{t(lang, 'Expires this year', 'Läuft aus')}</span>
                            ) : state.currentCoach.contractYearsLeft === 1 ? (
                              <span className="text-amber-400 font-semibold">{t(lang, 'Final contract year', 'Letztes Vertragsjahr')}</span>
                            ) : (
                              <span>{state.currentCoach.contractYearsLeft} {t(lang, 'seasons secured', 'Saisons gesichert')}</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-left md:text-right">
                          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                            {t(lang, 'Annual Wage', 'Jahresgehalt')}
                          </div>
                          <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                            {formatMoney(state.currentCoach.cost)}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {t(lang, 'Per season', 'Pro Saison')}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-left md:text-right">
                          <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                            {t(lang, 'Win Rate', 'Siegquote')}
                          </div>
                          <div className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
                            {state.currentCoach.winRate !== undefined ? `${state.currentCoach.winRate}%` : '—'}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {t(lang, 'Career average', 'Karriereschnitt')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Staff Actions & Contract Renewal / Sacking Row */}
                    <div className="mt-5 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs">
                      {/* Left: Confidential Dossier & Severance Info */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setDossierCoach(state.currentCoach || null)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-sky-400/30 text-sky-300 hover:text-white transition cursor-pointer font-semibold"
                        >
                          <i className="fa-solid fa-fingerprint text-xs text-sky-400"></i>
                          <span>{t(lang, 'Inspect Scouting Dossier', 'Scouting-Dossier ansehen')}</span>
                        </button>

                        <div className="text-zinc-400">
                          {hasMutualConsent ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                              <i className="fa-solid fa-handshake text-[11px]"></i>
                              <span>{t(lang, 'Mutual Consent active · Zero severance penalty.', 'Einvernehmliche Trennung aktiv · Keine Abfindung.')}</span>
                            </span>
                          ) : state.currentCoach.contractYearsLeft !== undefined && state.currentCoach.contractYearsLeft > 0 ? (
                            <span className="text-rose-400/90 font-medium flex items-center gap-1.5">
                              <i className="fa-solid fa-triangle-exclamation text-[11px]"></i>
                              <span>
                                {t(
                                  lang,
                                  `Severance penalty: ${formatMoney(state.currentCoach.cost)}/yr for ${state.currentCoach.contractYearsLeft} yr(s).`,
                                  `Abfindung: ${formatMoney(state.currentCoach.cost)}/Jahr für ${state.currentCoach.contractYearsLeft} Jahr(e).`
                                )}
                              </span>
                            </span>
                          ) : (
                            <span>{t(lang, 'Expiring contract · Zero severance on parting.', 'Auslaufender Vertrag · Keine Abfindung.')}</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions (Renew Contract / Sack) */}
                      <div className="flex items-center gap-2.5 justify-end">
                        {/* Extension Widget */}
                        {state.currentCoach.strength !== 'Limited Tenure' && (() => {
                          const currentYears = state.currentCoach.contractYearsLeft ?? 1;
                          const maxAdd = Math.max(0, 5 - currentYears);
                          const isMaxed = maxAdd <= 0;

                          if (isMaxed) {
                            return (
                              <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                                <i className="fa-solid fa-lock text-[10px] text-zinc-500"></i>
                                <span>{t(lang, 'Max Contract (5 Yrs)', 'Max. Vertrag (5 J.)')}</span>
                              </div>
                            );
                          }

                          const availableYears = [1, 2, 3].filter(y => y <= maxAdd);
                          const selectedYears = Math.min(renewYears, maxAdd) || 1;

                          return (
                            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-2 py-1">
                              <select
                                value={selectedYears}
                                onChange={(e) => setRenewYears(Number(e.target.value))}
                                disabled={isProcessing}
                                className="bg-transparent text-emerald-400 font-semibold outline-none text-xs py-1 cursor-pointer"
                              >
                                {availableYears.map((y) => (
                                  <option key={y} value={y} className="bg-zinc-900 text-white">
                                    +{y} {t(lang, y === 1 ? 'Yr' : 'Yrs', y === 1 ? 'Jahr' : 'Jahre')} ({currentYears + y} {t(lang, 'total', 'ges.')})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsProcessing(true);
                                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                                  timeoutRef.current = setTimeout(() => {
                                    if (onRenew) onRenew(selectedYears);
                                    setIsProcessing(false);
                                  }, 500);
                                }}
                                disabled={isProcessing || ((state.budget - state.currentCoach.cost < -creditLimit) && state.currentCoach.strength !== 'Reserve Focus' && state.currentCoach.strength !== 'Youth Integration')}
                                className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs py-1 px-3 transition border-l border-white/[0.08] cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : t(lang, 'Extend', 'Verlängern')}
                              </button>
                            </div>
                          );
                        })()}

                        {/* Sacking Action with Safe Confirmation */}
                        {!confirmFire ? (
                          <button
                            type="button"
                            onClick={() => setConfirmFire(true)}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 text-rose-400 border border-white/[0.08] hover:border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                          >
                            {t(lang, 'Sack Coach', 'Trainer entlassen')}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-1 px-2">
                            <span className="text-xs text-rose-400 font-semibold">{t(lang, 'Confirm termination?', 'Wirklich entlassen?')}</span>
                            <button
                              type="button"
                              onClick={() => setConfirmFire(false)}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs font-semibold transition cursor-pointer"
                            >
                              {t(lang, 'Cancel', 'Abbrechen')}
                            </button>
                            <button
                              type="button"
                              onClick={handleFire}
                              disabled={isProcessing}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition cursor-pointer active:scale-[0.98]"
                            >
                              {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : t(lang, 'Confirm Sack', 'Entlassen')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Interim Management State */
                <div className="bg-rose-500/[0.04] border border-rose-500/20 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                      {t(lang, 'Tactical Vacancy Alert', 'Offene Trainerposition')}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {t(lang, 'Interim Caretaker Management (-4 OVR)', 'Interims-Führung (-4 GES)')}
                    </h3>
                    <p className="text-xs text-zinc-300 max-w-md mx-auto mt-2 leading-relaxed">
                      {t(
                        lang,
                        'Your squad is currently led by temporary caretaker staff. Without permanent leadership, the team suffers a severe -4 OVR handicap and forfeits system synergies.',
                        'Die Mannschaft wird vorübergehend interimistisch betreut. Ohne Cheftrainer leidet der Kader unter einem -4 GES Abzug und kann keine System-Synergien nutzen.'
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => handleTabChange('market')}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs tracking-wide transition shadow-lg shadow-sky-500/20 cursor-pointer flex items-center gap-2"
                    >
                      <i className="fa-solid fa-briefcase"></i>
                      <span>{t(lang, 'Browse Job Market (Hire Coach)', 'Trainermarkt durchsuchen (Einstellen)')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange('philosophy')}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] font-semibold text-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <i className="fa-solid fa-chess"></i>
                      <span>{t(lang, 'Review Club Philosophy', 'Vereins-Philosophie prüfen')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: JOB MARKET (SEARCH, FILTER TOGGLES, DOSSIERS, HIRE)                */}
          {/* ========================================================================= */}
          {activeTab === 'market' && (
            <div className="space-y-4">
              {/* Filter & Sort Toolbar */}
              <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Filter Toggles */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      selectedFilter === 'all'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <span>{t(lang, 'All Candidates', 'Alle')}</span>
                    <span className="text-[10px] tabular-nums opacity-70">({market.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterChange('synergy')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      selectedFilter === 'synergy'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <i className="fa-solid fa-bolt text-[10px] text-sky-400"></i>
                    <span>{t(lang, 'Synergy Match', 'Synergie-Treffer')}</span>
                    <span className="text-[10px] tabular-nums opacity-70">({synergyCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterChange('youth')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      selectedFilter === 'youth'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <i className="fa-solid fa-graduation-cap text-[10px] text-emerald-400"></i>
                    <span>{t(lang, 'Youth Focus', 'Nachwuchs-Fokus')}</span>
                    <span className="text-[10px] tabular-nums opacity-70">({youthCount})</span>
                  </button>

                  {reserveCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleFilterChange('reserve')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        selectedFilter === 'reserve'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                          : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <i className="fa-solid fa-seedling text-[10px] text-amber-400"></i>
                      <span>{t(lang, 'Reserve Focus', 'Reserve-Fokus')}</span>
                      <span className="text-[10px] tabular-nums opacity-70">({reserveCount})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleFilterChange('scouted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      selectedFilter === 'scouted'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <i className="fa-solid fa-fingerprint text-[10px]"></i>
                    <span>{t(lang, 'Scouted Only', 'Gescoutet')}</span>
                    <span className="text-[10px] tabular-nums opacity-70">({scoutedCount})</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 shrink-0 justify-end flex-wrap">
                  {/* View Mode Toggle: Condensed Shortlist vs Expanded Cards */}
                  <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setMarketViewMode('condensed')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        marketViewMode === 'condensed'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title={t(lang, 'Condensed Shortlist View', 'Kompakte Listenansicht')}
                    >
                      <i className="fa-solid fa-list text-[10px]"></i>
                      <span className="hidden sm:inline">{t(lang, 'Condensed', 'Kompakt')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarketViewMode('cards')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        marketViewMode === 'cards'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title={t(lang, 'Expanded Cards View', 'Große Kacheln')}
                    >
                      <i className="fa-solid fa-grip text-[10px]"></i>
                      <span className="hidden sm:inline">{t(lang, 'Cards', 'Kacheln')}</span>
                    </button>
                  </div>

                  {/* Sort Option Control */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400 hidden sm:inline">{t(lang, 'Sort:', 'Sortierung:')}</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as MarketSortOption)}
                      className="bg-white/[0.04] border border-white/[0.08] text-white text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:border-white/20"
                    >
                      <option value="synergy" className="bg-[#12141c] text-white">{t(lang, 'Synergy Match First', 'Zuerst Synergie-Treffer')}</option>
                      <option value="ovr" className="bg-[#12141c] text-white">{t(lang, 'Highest OVR Boost', 'Höchster GES-Bonus')}</option>
                      <option value="wage" className="bg-[#12141c] text-white">{t(lang, 'Lowest Annual Wage', 'Niedrigstes Gehalt')}</option>
                      <option value="rep" className="bg-[#12141c] text-white">{t(lang, 'Reputation Requirement', 'Ansehen-Anforderung')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Toxic Turnover Warning */}
              {(state.firedCoachesCount || 0) > 2 && (
                <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3">
                  <i className="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 text-xs shrink-0"></i>
                  <div className="text-xs text-amber-200/90 leading-relaxed">
                    <strong className="text-amber-300 font-semibold mr-1.5">
                      {t(lang, 'High Manager Turnover:', 'Hohe Trainerfluktuation:')}
                    </strong>
                    {t(
                      lang,
                      'Repeated sackings have harmed club stability. Elite candidates demand premium wages or hesitate to accept offers.',
                      'Wiederholte Entlassungen belasten das Ansehen. Spitzen-Kandidaten verlangen höhere Gehälter oder zögern bei Angeboten.'
                    )}
                  </div>
                </div>
              )}

              {/* Candidate Shortlist / Grid */}
              {filteredAndSortedMarket.length > 0 ? (
                marketViewMode === 'condensed' ? (
                  /* CONDENSED SHORTLIST TABLE VIEW (Default) */
                  <div className="space-y-2">
                    {/* Header Row on Tablet & Desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                      <div className="col-span-4">{t(lang, 'Coach / Profile', 'Trainer / Profil')}</div>
                      <div className="col-span-2">{t(lang, 'Tactical Style', 'Taktikstil')}</div>
                      <div className="col-span-2 text-center">{t(lang, 'OVR Impact', 'OVR-Einfluss')}</div>
                      <div className="col-span-2 text-right">{t(lang, 'Contract & Wage', 'Vertrag & Gehalt')}</div>
                      <div className="col-span-2 text-right">{t(lang, 'Actions', 'Aktionen')}</div>
                    </div>

                    {filteredAndSortedMarket.map((coach) => {
                      const isScouted = isCoachScouted(coach);
                      const hasSynergy = isTacticalSynergy(coach.style, state.tactic);
                      const isExpanded = expandedCoachId === coach.id;
                      const isCurrent = state.currentCoach?.id === coach.id;
                      const canAfford = state.budget - coach.cost >= -creditLimit || coach.isReserveCoach || coach.name.includes('Youth') || coach.name.includes('Reserve');
                      const meetsRep = directorRep >= coach.repReq;
                      const canHire = canAfford && meetsRep;
                      const archConfig = getCoachArchetypeConfig(coach.coachArchetype || coach.archetype);
                      const ovrImpact = getOvrImpactInfo(coach);

                      return (
                        <div
                          key={coach.id}
                          className={`bg-white/[0.025] hover:bg-white/[0.04] border rounded-2xl transition-all duration-200 overflow-hidden ${
                            hasSynergy
                              ? 'border-sky-500/25 shadow-[0_0_18px_rgba(56,189,248,0.04)]'
                              : 'border-white/[0.06] hover:border-white/[0.12]'
                          } ${isCurrent ? 'ring-1 ring-emerald-400/40 bg-emerald-500/[0.02]' : ''} ${
                            isExpanded ? 'ring-1 ring-sky-400/40 bg-white/[0.04]' : ''
                          }`}
                        >
                          {/* Main Condensed Row */}
                          <div className="p-3 sm:px-4 sm:py-3 flex flex-col md:grid md:grid-cols-12 gap-3 items-center">
                            {/* Col 1: Coach Name & Profile Badges (col-span-4) */}
                            <div className="w-full md:col-span-4 flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleExpand(coach.id)}
                                className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-sky-400 shrink-0 transition-transform active:scale-95 cursor-pointer"
                                title={t(lang, 'Click to expand coach dossier & tactical stats', 'Klicken für Details und Scouting-Bericht')}
                              >
                                <i className={`fa-solid ${isExpanded ? 'fa-chevron-up text-sky-300' : 'fa-id-card-clip text-zinc-400'} text-xs`}></i>
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(coach.id)}
                                    className="text-left font-bold text-sm sm:text-base text-white hover:text-sky-300 transition-colors truncate cursor-pointer flex items-center gap-1.5 group"
                                    title={t(lang, 'Click to toggle full manager details', 'Klicken für Manager-Details')}
                                  >
                                    <span className="truncate group-hover:underline underline-offset-2 decoration-sky-400/50">
                                      {coach.name}
                                    </span>
                                    <i className={`fa-solid fa-chevron-down text-[10px] text-zinc-500 group-hover:text-sky-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-sky-400' : ''}`}></i>
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5 flex-wrap">
                                  <span className="text-sky-400/90 font-medium">
                                    {archConfig.labelEn}
                                  </span>
                                  {coach.nationality && (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span>{coach.nationality}</span>
                                    </>
                                  )}
                                  {coach.winRate !== undefined && !coach.isReserveCoach && (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span className="text-emerald-400 tabular-nums font-semibold">{coach.winRate}% {t(lang, 'Win', 'Siege')}</span>
                                    </>
                                  )}
                                  {coach.isReserveCoach && (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span className="text-amber-400 font-semibold">{t(lang, 'Reserve', 'Reserve')}</span>
                                    </>
                                  )}
                                  {isCurrent && (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span className="text-emerald-400 font-semibold">{t(lang, 'Current Coach', 'Im Amt')}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Col 2: Tactical Style & Synergy (col-span-2) */}
                            <div className="w-full md:col-span-2 flex md:flex-col items-center md:items-start justify-between md:justify-center gap-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                                <i className={`fas ${TACTICS[coach.style]?.icon || 'fa-chess-board'} text-sky-400 text-xs shrink-0`}></i>
                                <span className="truncate">{coach.style}</span>
                              </div>
                              {hasSynergy ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 shrink-0">
                                  <i className="fa-solid fa-check text-[9px] text-emerald-400"></i>
                                  <span>{t(lang, 'DNA Synergy', 'DNA-Synergie')}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500 shrink-0">
                                  {t(lang, 'Differs from DNA', 'Weicht von DNA ab')}
                                </span>
                              )}
                            </div>

                            {/* Col 3: OVR Impact (col-span-2) */}
                            <div className="w-full md:col-span-2 flex items-center justify-between md:justify-center">
                              <span className="text-[11px] text-zinc-400 md:hidden font-medium">{t(lang, 'OVR Impact:', 'OVR-Einfluss:')}</span>
                              {isScouted ? (
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold tabular-nums flex items-center gap-1 ${
                                      ovrImpact.boost >= 0
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    }`}
                                  >
                                    <i className={`fa-solid ${ovrImpact.boost >= 0 ? 'fa-arrow-trend-up text-emerald-400' : 'fa-arrow-trend-down text-rose-400'} text-[10px]`}></i>
                                    <span>{ovrImpact.formattedBoost}</span>
                                  </div>
                                  <span
                                    className="text-[10px] text-zinc-400 mt-0.5 tabular-nums font-mono"
                                    title={t(lang, 'Current Club OVR -> Projected Club OVR with this coach', 'Aktuelle Club-GES -> Voraussichtliche Club-GES')}
                                  >
                                    {ovrImpact.currentClubOvr} → <strong className="text-white font-bold">{ovrImpact.projectedClubOvr}</strong>
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleScout(coach.id);
                                    }}
                                    disabled={(state.skillPoints || 0) < 1}
                                    className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                                    title={t(lang, 'Spend 1 DP to reveal tactical OVR impact and hidden traits', '1 DP ausgeben, um taktischen OVR-Einfluss und Eigenschaften aufzudecken')}
                                  >
                                    <i className="fa-solid fa-magnifying-glass text-[10px] text-amber-400"></i>
                                    <span>? OVR · 1 DP</span>
                                  </button>
                                  <span className="text-[9px] text-zinc-500 hidden sm:inline">
                                    {t(lang, 'Click to reveal', 'Klicken zum Enthüllen')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Col 4: Contract & Wage (col-span-2) */}
                            <div className="w-full md:col-span-2 flex md:flex-col items-center md:items-end justify-between md:justify-center min-w-0 pr-1">
                              <span className="text-[11px] text-zinc-400 md:hidden font-medium">{t(lang, 'Contract & Wage:', 'Vertrag & Gehalt:')}</span>
                              <div className="text-right">
                                <div className={`text-xs font-bold tabular-nums ${canAfford ? 'text-white' : 'text-rose-400'}`}>
                                  {formatMoney(coach.cost)}<span className="text-[10px] font-normal text-zinc-400">/{t(lang, 'yr', 'J')}</span>
                                </div>
                                <div className="text-[10px] text-zinc-400 tabular-nums whitespace-nowrap mt-0.5">
                                  {coach.contractLength || 2} {t(lang, (coach.contractLength === 1 ? 'yr deal' : 'yrs deal'), (coach.contractLength === 1 ? 'Jahr' : 'Jahre'))}
                                </div>
                              </div>
                            </div>

                            {/* Col 5: Actions (col-span-2) */}
                            <div className="w-full md:col-span-2 flex items-center justify-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.05] shrink-0">
                              {/* Hire / Contract Button */}
                              <button
                                type="button"
                                onClick={() => handleHire(coach)}
                                disabled={isProcessing || !canHire || isCurrent}
                                className={`flex-1 md:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                                  isCurrent
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 cursor-default'
                                    : canHire
                                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm'
                                    : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                                }`}
                              >
                                {isProcessing ? (
                                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                                ) : isCurrent ? (
                                  <>
                                    <i className="fa-solid fa-check text-xs"></i>
                                    <span className="hidden sm:inline">{t(lang, 'Appointed', 'Im Amt')}</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-file-signature text-xs"></i>
                                    <span>
                                      {coach.isReserveCoach
                                        ? t(lang, 'Promote', 'Befördern')
                                        : t(lang, 'Appoint', 'Verpflichten')}
                                    </span>
                                  </>
                                )}
                              </button>

                              {/* Toggle Details Chevron */}
                              <button
                                type="button"
                                onClick={() => toggleExpand(coach.id)}
                                className={`w-7 h-7 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                                  isExpanded
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.08]'
                                }`}
                                title={isExpanded ? t(lang, 'Collapse details', 'Details schließen') : t(lang, 'Expand details', 'Details anzeigen')}
                              >
                                <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180 text-sky-400' : ''}`}></i>
                              </button>
                            </div>
                          </div>

                          {/* Reputation Warning Notice if Locked */}
                          {!meetsRep && (
                            <div className="px-4 py-2 bg-rose-500/[0.05] border-t border-rose-500/20 text-[11px] text-rose-400 flex items-center gap-1.5">
                              <i className="fa-solid fa-lock text-[10px]"></i>
                              <span>
                                {t(lang, 'Requires Director Reputation:', 'Erfordert Direktor-Ansehen:')} <strong className="tabular-nums">{coach.repReq}</strong> ({t(lang, 'Current:', 'Aktuell:')} {directorRep})
                              </span>
                            </div>
                          )}

                          {/* INLINE EXPANDED DETAILS PANEL (Shown upon clicking Coach Name or Details) */}
                          {isExpanded && (
                            <div className="border-t border-white/[0.08] bg-[#0c0e14]/95 p-4 sm:p-5 space-y-4">
                              {/* 1. Tactical OVR Impact & Squad Rating Preview Box */}
                              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                                  <div>
                                    <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                                      {t(lang, 'Tactical & Squad OVR Impact', 'Taktischer & Kader-OVR Einfluss')}
                                    </div>
                                    <div className="text-xs text-zinc-300 mt-0.5">
                                      {isScouted ? (
                                        <span>
                                          {t(lang, 'Hiring this coach will adjust the first-team tactical baseline by ', 'Die Verpflichtung dieses Trainers verändert das Taktik-Rating um ')}
                                          <strong className={ovrImpact.boost >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                            {ovrImpact.formattedBoost}
                                          </strong>.
                                        </span>
                                      ) : (
                                        <span>
                                          {t(lang, 'Exact tactical OVR modifier is hidden. Spend 1 DP to scout profile.', 'Der exakte OVR-Einfluss ist verborgen. Scoute mit 1 DP für Details.')}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5 text-center">
                                      <div className="text-[9px] uppercase font-semibold text-zinc-400">
                                        {t(lang, 'Current Squad', 'Aktueller Kader')}
                                      </div>
                                      <div className="text-sm font-extrabold text-white tabular-nums">
                                        {ovrImpact.currentClubOvr} OVR
                                      </div>
                                    </div>

                                    <i className="fa-solid fa-arrow-right text-zinc-500 text-xs"></i>

                                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5 text-center">
                                      <div className="text-[9px] uppercase font-semibold text-zinc-400">
                                        {t(lang, 'Projected Squad', 'Mit diesem Trainer')}
                                      </div>
                                      <div className={`text-sm font-extrabold tabular-nums ${
                                        !isScouted
                                          ? 'text-amber-400'
                                          : ovrImpact.netDelta >= 0
                                          ? 'text-emerald-400'
                                          : 'text-rose-400'
                                      }`}>
                                        {isScouted ? `${ovrImpact.projectedClubOvr} OVR` : '? OVR'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
                                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="text-[10px] font-semibold text-zinc-400">{t(lang, 'Preferred System', 'Bevorzugtes System')}</div>
                                    <div className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5">
                                      <i className={`fas ${TACTICS[coach.style]?.icon || 'fa-chess-board'} text-sky-400 text-xs`}></i>
                                      <span>{coach.style} ({coach.preferredFormation || '4-3-3'})</span>
                                    </div>
                                  </div>

                                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="text-[10px] font-semibold text-zinc-400">{t(lang, 'Club DNA Synergy', 'Club-DNA Synergie')}</div>
                                    <div className={`text-xs font-bold mt-0.5 flex items-center gap-1.5 ${hasSynergy ? 'text-sky-300' : 'text-zinc-400'}`}>
                                      <i className={`fa-solid ${hasSynergy ? 'fa-circle-check text-sky-400' : 'fa-circle-xmark text-zinc-500'} text-xs`}></i>
                                      <span>{hasSynergy ? t(lang, 'Matches Active DNA', 'Passt zur aktiven DNA') : t(lang, 'System Mismatch', 'System-Abweichung')}</span>
                                    </div>
                                  </div>

                                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="text-[10px] font-semibold text-zinc-400">{t(lang, 'Trophy Pedigree', 'Titelerfolge')}</div>
                                    <div className="text-xs font-bold text-amber-300 mt-0.5 flex items-center gap-1.5">
                                      <i className="fa-solid fa-trophy text-amber-400 text-xs"></i>
                                      <span>{coach.trophyPedigree ? `${coach.trophyPedigree} ${t(lang, 'Honours', 'Titel')}` : t(lang, 'Developing Manager', 'Aufstrebender Trainer')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Signature Strength & Weakness Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Strength Card */}
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3.5 space-y-1.5">
                                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                                    <i className="fa-solid fa-shield-halved text-xs"></i>
                                    <span>{t(lang, 'Signature Specialty Trait', 'Spezial-Eigenschaft')}</span>
                                  </div>
                                  {coach.strength ? (() => {
                                    const traitInfo = getCoachTraitInfo(coach.strength);
                                    return (
                                      <div>
                                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                          <i className={`fas ${traitInfo.icon} text-emerald-400 text-xs`}></i>
                                          <span>{traitInfo.name}</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                          {traitInfo.desc}
                                        </p>
                                      </div>
                                    );
                                  })() : (
                                    <div className="text-xs text-zinc-500 italic">{t(lang, 'No special trait recorded', 'Keine Spezialeigenschaft hinterlegt')}</div>
                                  )}
                                </div>

                                {/* Weakness / Vulnerability Card */}
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3.5 space-y-1.5">
                                  <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                                    <i className="fa-solid fa-triangle-exclamation text-xs"></i>
                                    <span>{t(lang, 'Downside / Vulnerability', 'Schwachstelle / Risiko')}</span>
                                  </div>
                                  {isScouted ? (
                                    coach.weakness ? (() => {
                                      const weakInfo = getCoachWeaknessInfo(coach.weakness);
                                      return (
                                        <div>
                                          <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                                            <i className={`fas ${weakInfo.icon} text-rose-400 text-xs`}></i>
                                            <span>{weakInfo.name}</span>
                                          </div>
                                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                            {weakInfo.desc}
                                          </p>
                                        </div>
                                      );
                                    })() : (
                                      <div className="text-xs text-zinc-500 italic">{t(lang, 'No major vulnerability detected', 'Keine signifikante Schwachstelle')}</div>
                                    )
                                  ) : (
                                    <div className="flex flex-col justify-between h-full pt-1">
                                      <div className="text-xs text-zinc-400 flex items-center gap-2">
                                        <i className="fa-solid fa-lock text-amber-400 text-xs"></i>
                                        <span>{t(lang, 'Hidden until scouted. Unlock downside traits with 1 DP.', 'Verborgene Schwachstelle. Für 1 DP aufdecken.')}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleScout(coach.id)}
                                        disabled={(state.skillPoints || 0) < 1}
                                        className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
                                        <span>{t(lang, 'Scout Downside (1 DP)', 'Schwachstelle aufdecken (1 DP)')}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 3. Tactical Promise & Bio */}
                              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3.5 space-y-2">
                                {coach.promise && (
                                  <div className="flex items-center justify-between text-xs text-zinc-300">
                                    <div className="flex items-center gap-1.5">
                                      <i className="fa-solid fa-comment-dots text-sky-400"></i>
                                      <span>
                                        {t(lang, 'Board Promise: ', 'Vorstandsversprechen: ')}
                                        <strong className="text-white">
                                          {coach.promise === 'title' ? t(lang, 'Title Contention', 'Titelkampf') : coach.promise === 'survival' ? t(lang, 'Relegation Survival', 'Klassenerhalt') : t(lang, 'Cup Success', 'Pokalerfolg')}
                                        </strong>
                                      </span>
                                    </div>
                                    {isScouted && (
                                      <span className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg ${coach.isDeceiving ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                                        <i className={`fa-solid ${coach.isDeceiving ? 'fa-triangle-exclamation' : 'fa-circle-check'} text-[9px]`}></i>
                                        <span>{coach.isDeceiving ? t(lang, 'Deceiving Claim!', 'Täuscht den Vorstand!') : t(lang, 'Honest & Authentic', 'Ehrlich & Verlässlich')}</span>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {coach.bio && (
                                  <p className="text-xs text-zinc-400 italic leading-relaxed pt-1 border-t border-white/[0.04]">
                                    "{coach.bio}"
                                  </p>
                                )}
                              </div>

                              {/* 4. Action Bar in Expanded View */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <div className="text-xs text-zinc-400">
                                  <span>{t(lang, 'Buyout Clause:', 'Ablöseklausel:')} </span>
                                  <strong className="text-white tabular-nums">{formatMoney(coach.cost * 1.5)}</strong>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setDossierCoach(coach)}
                                    className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sky-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                                  >
                                    <i className="fa-solid fa-fingerprint text-xs text-sky-400"></i>
                                    <span>{t(lang, 'Full Dossier Modal', 'Vollständiges Dossier')}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleHire(coach)}
                                    disabled={isProcessing || !canHire || isCurrent}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center gap-1.5 ${
                                      isCurrent
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 cursor-default'
                                        : canHire
                                        ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm'
                                        : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                                    }`}
                                  >
                                    {isProcessing ? (
                                      <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                                    ) : isCurrent ? (
                                      <>
                                        <i className="fa-solid fa-check text-xs"></i>
                                        <span>{t(lang, 'Currently Appointed', 'Aktuell im Amt')}</span>
                                      </>
                                    ) : (
                                      <>
                                        <i className="fa-solid fa-file-signature text-xs"></i>
                                        <span>
                                          {coach.isReserveCoach
                                            ? t(lang, 'Promote to Head Coach', 'Zum Cheftrainer befördern')
                                            : t(lang, 'Appoint Head Coach', 'Cheftrainer verpflichten')}
                                        </span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* EXPANDED CARDS GRID VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                    {filteredAndSortedMarket.map((coach) => {
                      const canAfford = state.budget - coach.cost >= -creditLimit || coach.isReserveCoach || coach.name.includes('Youth') || coach.name.includes('Reserve');
                      const meetsRep = directorRep >= coach.repReq;
                      const canHire = canAfford && meetsRep;
                      const isCurrent = state.currentCoach?.id === coach.id;
                      const hasSynergy = isTacticalSynergy(coach.style, state.tactic);
                      const archConfig = getCoachArchetypeConfig(coach.coachArchetype || coach.archetype);
                      const isScouted = isCoachScouted(coach);
                      const ovrImpact = getOvrImpactInfo(coach);

                      return (
                        <div
                          key={coach.id}
                          className={`bg-white/[0.03] hover:bg-white/[0.05] border rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-sm relative group ${
                            hasSynergy 
                              ? 'border-sky-400/30 bg-sky-500/[0.02] shadow-[0_0_24px_rgba(56,189,248,0.06)]' 
                              : 'border-white/[0.06] hover:border-white/[0.12]'
                          } ${isCurrent ? 'ring-1 ring-emerald-400/40 bg-emerald-500/[0.03]' : ''}`}
                        >
                          <div className="space-y-3">
                            {/* Card Header: Archetype, Nat, Win Rate */}
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-1 flex-wrap">
                                <span className="text-sky-400/90">{archConfig.labelEn}</span>
                                {coach.nationality && (
                                  <>
                                    <span className="text-zinc-600">·</span>
                                    <span>{coach.nationality}</span>
                                  </>
                                )}
                                {coach.winRate !== undefined && !coach.isReserveCoach && (
                                  <>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-emerald-400 tabular-nums">{coach.winRate}% {t(lang, 'Win', 'Siege')}</span>
                                  </>
                                )}
                                {coach.isReserveCoach && (
                                  <>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-amber-400 font-semibold">{t(lang, 'Internal Promotion', 'Interne Beförderung')}</span>
                                  </>
                                )}
                                {isCurrent && (
                                  <>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-emerald-400 font-semibold">{t(lang, 'Current Coach', 'Aktueller Trainer')}</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-baseline justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(coach.id)}
                                  className="text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors truncate text-left cursor-pointer flex items-center gap-1.5"
                                  title={t(lang, 'Click for full coach details', 'Klicken für Trainer-Details')}
                                >
                                  <span className="truncate">{coach.name}</span>
                                  <i className="fa-solid fa-chevron-right text-[10px] text-zinc-500 group-hover:text-sky-400"></i>
                                </button>

                                {/* Tactic & Synergy indicator */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                                    <i className={`fas ${TACTICS[coach.style]?.icon || 'fa-chess-board'} text-xs text-sky-400`}></i>
                                    <span>{coach.style}</span>
                                  </div>
                                  {hasSynergy && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
                                      <i className="fa-solid fa-check text-[9px] text-emerald-400"></i>
                                      <span>{t(lang, 'DNA Synergy', 'DNA-Synergie')}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Traits & Downsides */}
                            <div className="space-y-1.5 text-xs">
                              {coach.strength && (() => {
                                const traitInfo = getCoachTraitInfo(coach.strength);
                                return (
                                  <div className="flex items-start gap-2 text-zinc-300">
                                    <i className={`fas ${traitInfo.icon} text-emerald-400 text-xs mt-0.5 shrink-0`}></i>
                                    <div>
                                      <strong className="text-emerald-300 font-semibold">{traitInfo.name}</strong>
                                      <span className="text-zinc-400 text-[11px] block leading-snug">{traitInfo.desc}</span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {isScouted ? (
                                coach.weakness && (() => {
                                  const weakInfo = getCoachWeaknessInfo(coach.weakness);
                                  return (
                                    <div className="flex items-start gap-2 text-zinc-300">
                                      <i className={`fas ${weakInfo.icon} text-rose-400 text-xs mt-0.5 shrink-0`}></i>
                                      <div>
                                        <strong className="text-rose-300 font-semibold">{t(lang, 'Downside:', 'Schwachstelle:')} {weakInfo.name}</strong>
                                        <span className="text-zinc-400 text-[11px] block leading-snug">{weakInfo.desc}</span>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 italic">
                                  <i className="fa-solid fa-lock text-[10px]"></i>
                                  <span>{t(lang, 'Downside: Hidden until scouted (1 DP)', 'Schwachstelle: Bis zum Scouting verborgen (1 DP)')}</span>
                                </div>
                              )}
                            </div>

                            {/* Tactical Promise */}
                            {coach.promise && (
                              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-zinc-300 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 truncate">
                                  <i className="fa-solid fa-comment-dots text-sky-400 text-[11px] shrink-0"></i>
                                  <span className="truncate">
                                    {t(lang, 'Promises: ', 'Verspricht: ')}
                                    <strong className="text-white">
                                      {coach.promise === 'title' ? t(lang, 'Title Contention', 'Titelkampf') : coach.promise === 'survival' ? t(lang, 'Relegation Survival', 'Klassenerhalt') : t(lang, 'Cup Success', 'Pokalerfolg')}
                                    </strong>
                                  </span>
                                </div>

                                {isScouted && (
                                  <span className={`text-[10px] font-semibold shrink-0 flex items-center gap-1 ${coach.isDeceiving ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    <i className={`fa-solid ${coach.isDeceiving ? 'fa-triangle-exclamation' : 'fa-circle-check'} text-[9px]`}></i>
                                    <span>{coach.isDeceiving ? t(lang, 'Deceiving!', 'Täuscht!') : t(lang, 'Honest', 'Ehrlich')}</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Bento Stat Strip */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider">
                                  {t(lang, 'Annual Wage', 'Jahresgehalt')}
                                </div>
                                <div className={`text-xs font-bold tabular-nums mt-0.5 ${canAfford ? 'text-white' : 'text-rose-400'}`}>
                                  {formatMoney(coach.cost)}
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider">
                                  {t(lang, 'Contract', 'Vertrag')}
                                </div>
                                <div className="text-xs font-bold text-white tabular-nums mt-0.5">
                                  {coach.contractLength || 2} {t(lang, (coach.contractLength === 1 ? 'Yr Deal' : 'Yrs Deal'), (coach.contractLength === 1 ? 'Jahr Vertrag' : 'Jahre Vertrag'))}
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider">
                                  {t(lang, 'OVR Impact', 'Einfluss')}
                                </div>
                                <div className="mt-0.5">
                                  {isScouted ? (
                                    <div className="flex items-center gap-1">
                                      <span className={`text-xs font-bold tabular-nums ${ovrImpact.boost >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {ovrImpact.formattedBoost}
                                      </span>
                                      <span className="text-[9px] text-zinc-400 font-mono">
                                        ({ovrImpact.currentClubOvr}→{ovrImpact.projectedClubOvr})
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleScout(coach.id)}
                                      disabled={(state.skillPoints || 0) < 1}
                                      className="text-xs font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                                      title={t(lang, 'Spend 1 DP to reveal tactical OVR impact and hidden traits', '1 DP ausgeben um OVR-Einfluss aufzudecken')}
                                    >
                                      <i className="fa-solid fa-magnifying-glass text-[9px]"></i>
                                      <span>? OVR · 1 DP</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reputation Lock Notice */}
                            {!meetsRep && (
                              <div className="text-[11px] text-rose-400 flex items-center gap-1.5 pt-0.5">
                                <i className="fa-solid fa-lock text-[10px]"></i>
                                <span>
                                  {t(lang, 'Requires Director Reputation:', 'Erfordert Direktor-Ansehen:')} <strong className="tabular-nums">{coach.repReq}</strong> ({t(lang, 'Current:', 'Aktuell:')} {directorRep})
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons Row */}
                          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDossierCoach(coach)}
                              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sky-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                              title={t(lang, 'Inspect full scouting dossier & hidden attributes', 'Vollständiges Scouting-Dossier ansehen')}
                            >
                              <i className="fa-solid fa-fingerprint text-[11px] text-sky-400"></i>
                              <span>{t(lang, 'Dossier', 'Dossier')}</span>
                            </button>

                            {/* Scout Profile (Cost 1 DP) */}
                            {!isScouted && !coach.isReserveCoach && (
                              <button
                                type="button"
                                onClick={() => handleScout(coach.id)}
                                disabled={(state.skillPoints || 0) < 1}
                                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 hover:text-amber-200 border border-white/[0.08] text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                                title={t(lang, 'Reveal hidden traits and tactical impact (1 DP)', 'Verborgene Eigenschaften und Taktikeinfluss aufdecken (1 DP)')}
                              >
                                <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
                                <span>1 DP</span>
                              </button>
                            )}

                            {/* Hire / Contract Button */}
                            <button
                              type="button"
                              onClick={() => handleHire(coach)}
                              disabled={isProcessing || !canHire || isCurrent}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                                isCurrent
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 cursor-default'
                                  : canHire
                                  ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm'
                                  : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                              }`}
                            >
                              {isProcessing ? (
                                <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                              ) : isCurrent ? (
                                <>
                                  <i className="fa-solid fa-check text-xs"></i>
                                  <span>{t(lang, 'Appointed', 'Im Amt')}</span>
                                </>
                              ) : (
                                <>
                                  <i className="fa-solid fa-file-signature text-xs"></i>
                                  <span>
                                    {coach.isReserveCoach
                                      ? t(lang, 'Promote to Head Coach', 'Zum Cheftrainer befördern')
                                      : t(lang, 'Appoint Head Coach', 'Cheftrainer verpflichten')}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-3">
                    <i className="fa-solid fa-magnifying-glass text-xl"></i>
                  </div>
                  <div className="text-white font-bold text-sm mb-1">
                    {t(lang, 'No Candidates Found', 'Keine Kandidaten gefunden')}
                  </div>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                    {t(
                      lang,
                      'No candidates match your current filter settings. Reset filters to view all profiles.',
                      'Keine Kandidaten entsprechen deinen Filtern. Setze die Filter zurück, um alle Profile zu sehen.'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('all')}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sky-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition cursor-pointer"
                  >
                    {t(lang, 'Show All Candidates', 'Alle Kandidaten anzeigen')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PHILOSOPHY (TACTICAL DNA & SYSTEM SELECTION)                        */}
          {/* ========================================================================= */}
          {activeTab === 'philosophy' && (
            <div className="space-y-5">
              {/* Tactical Obsolescence & Staleness Warning Banner */}
              {state.staleTactic && state.tactic === state.staleTactic && (
                <div className="bg-gradient-to-r from-rose-950/50 via-red-900/40 to-amber-950/40 border border-rose-500/50 rounded-2xl p-4 flex items-start gap-3.5 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-lg shrink-0 mt-0.5">
                    <i className="fa-solid fa-triangle-exclamation animate-bounce"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                      <span>{t(lang, 'Tactical Obsolescence Active', 'Taktische Entschlüsselung Aktiv')}</span>
                      {((state.club.medicalLevel || 1) >= 5 && (state.club.academyLevel || 1) >= 5) ? (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px]">
                          {t(lang, '-2 OVR (Facility Immunity)', '-2 GES (Infrastruktur-Schutz)')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.2 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 text-[9px]">
                          -4 OVR Penalty
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {t(lang, 'The League Has Figured Out Your System!', 'Die Liga hat dein System durchschaut!')}
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      {t(
                        lang,
                        'Select any different tactical philosophy below for 5 DP to evolve your tactical identity, catch opposing managers off-guard, and immediately eliminate this penalty.',
                        'Wähle unten eine andere Spielphilosophie für 5 DP, um deine Taktik zu erneuern und den Malus sofort aufzuheben.'
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Tactical Surveillance Notice */}
              {!(state.staleTactic && state.tactic === state.staleTactic) && (state.consecutiveTitlesWithSameTactic || 0) >= 1 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 text-sm shrink-0">
                    <i className="fa-solid fa-crosshairs"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-0.5">
                      {t(lang, 'Tactical Blueprint Under Surveillance', 'Taktischer Blueprint unter Beobachtung')}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {t(
                        lang,
                        `You have won consecutive titles with ${state.tactic}. Winning another title with this exact system will make it stale. Adapting your philosophy now keeps opponents guessing.`,
                        `Du hast Serientitel mit ${state.tactic} gewonnen. Ein weiterer Titel mit diesem System führt zur Entschlüsselung.`
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Active Philosophy Highlight Banner */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.07] rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 text-xl shrink-0 shadow-inner">
                      <i className={`fas ${PHILOSOPHIES[state.tactic]?.icon || 'fa-chess-board'}`}></i>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-0.5">
                        {t(lang, 'Active Tactical DNA', 'Aktive Vereins-DNA')}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        {state.tactic || 'Total Football'}
                      </h3>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        {PHILOSOPHIES[state.tactic]?.en}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end text-xs">
                    <div className="text-zinc-400">{t(lang, 'Philosophy Adaptation Fee:', 'Wechselgebühr:')}</div>
                    <div className="text-base font-bold text-amber-400 mt-0.5">
                      5 {t(lang, 'Director Points (DP)', 'Direktor-Punkte (DP)')}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {t(lang, 'Available:', 'Verfügbar:')} <strong className="text-white">{state.skillPoints || 0} DP</strong>
                    </div>
                  </div>
                </div>

                {/* Tactical Perk Spotlight */}
                {PHILOSOPHIES[state.tactic] && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wider mb-1">
                        {t(lang, 'System Match Benefit', 'System-Vorteil')}
                      </div>
                      <div className="text-zinc-200 leading-relaxed">
                        {PHILOSOPHIES[state.tactic].perkEn}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[10px] font-semibold uppercase text-sky-400 tracking-wider mb-1">
                        {t(lang, 'Tactical Identity', 'Taktische Identität')}
                      </div>
                      <div className="text-zinc-300 leading-relaxed">
                        {PHILOSOPHIES[state.tactic].effectDescEn}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Backroom Staff & Philosophical Pivot Strategic Guide */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-sky-950/30 to-slate-900/40 border border-sky-400/25 rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 text-base shrink-0">
                      <i className="fa-solid fa-arrows-spin"></i>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                        {t(lang, 'Rebuild & Dynastic Transition', 'Umbruch & Dynastie-Erneuerung')}
                      </div>
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {t(lang, 'Backroom Staff & Philosophical Pivot', 'Trainerstab & Philosophischer Pivot')}
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('market')}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-sky-300 border border-white/[0.1] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <i className="fa-solid fa-user-tie text-[10px]"></i>
                    <span>{t(lang, 'Browse Job Market', 'Trainermarkt öffnen')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Left Column: Tactical DNA Alignment & Staleness */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-400 mb-1 flex items-center justify-between">
                        <span>{t(lang, 'Philosophical Pivot (5 DP)', 'Philosophischer Pivot (5 DP)')}</span>
                        <span className={`px-2 py-0.2 rounded-full font-bold text-[9px] ${
                          state.staleTactic && state.tactic === state.staleTactic
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                            : (state.consecutiveTitlesWithSameTactic || 0) >= 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        }`}>
                          {state.staleTactic && state.tactic === state.staleTactic
                            ? t(lang, 'Stale Tactic (-4 OVR)', 'Entschlüsselt (-4 GES)')
                            : (state.consecutiveTitlesWithSameTactic || 0) >= 1
                            ? t(lang, 'Under Surveillance', 'Unter Beobachtung')
                            : t(lang, 'Tactically Fresh', 'Taktisch Unberechenbar')}
                        </span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed mt-1">
                        {t(
                          lang,
                          'Spending 5 DP to evolve your philosophy resets the Stale Tactic penalty immediately. Opponents lose their scouting edge, restoring full tactical surprise in match simulation.',
                          'Ein Wechsel für 5 DP setzt den Malus der entschlüsselten Taktik sofort zurück. Gegner verlieren ihren Scouting-Vorteil.'
                        )}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/[0.04] text-[11px] text-sky-300 flex items-center gap-1.5 font-medium">
                      <i className="fa-solid fa-chess-knight text-[10px]"></i>
                      <span>{t(lang, 'Select any new philosophy below to pivot.', 'Wähle unten eine neue Spielphilosophie zum Wechseln.')}</span>
                    </div>
                  </div>

                  {/* Right Column: Backroom Archetype Rebuild */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-400 mb-1 flex items-center justify-between">
                        <span>{t(lang, 'Backroom Staff Archetypes', 'Trainerstab-Archetypen')}</span>
                        <span className="text-zinc-400 font-mono text-[10px]">
                          {state.currentCoach ? state.currentCoach.style : t(lang, 'No Coach', 'Kein Trainer')}
                        </span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed mt-1">
                        {t(
                          lang,
                          'In rebuild seasons, shift away from a win-now Continental Legend to a Youth Whisperer or Scout to accelerate incubator graduation timers and lower wonderkid recruitment thresholds.',
                          'Wechsle in Umbruchjahren von Legenden-Trainern zu Jugendförderern / Scouts, um Reifezeiten im Inkubator zu verkürzen.'
                        )}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">
                        {t(lang, 'Staff Synergy Status:', 'Synergie-Status:')}
                      </span>
                      <span className={`font-bold ${isTacticalSynergy(state.currentCoach?.style, state.tactic) ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {isTacticalSynergy(state.currentCoach?.style, state.tactic)
                          ? t(lang, '+2 OVR Synergy Active ✓', '+2 GES Synergie Aktiv ✓')
                          : t(lang, 'No Synergy (0 OVR)', 'Keine Synergie (0 GES)')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Philosophy Catalog Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white tracking-tight uppercase text-zinc-400">
                    {t(lang, 'Available Tactical Philosophies', 'Verfügbare Spielphilosophien')}
                  </h4>
                  <span className="text-xs text-zinc-500">
                    {t(lang, 'Select to adapt DNA (5 DP)', 'Auswählen zum Wechseln (5 DP)')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {['Total Football', 'Gegenpressing', 'Tiki-Taka', 'Defensive', 'Direct Counter'].map((key) => {
                    const info = PHILOSOPHIES[key];
                    if (!info) return null;
                    const isActive = isTacticalSynergy(state.tactic, key) || state.tactic === key;
                    const matchesCurrentCoach = isTacticalSynergy(state.currentCoach?.style, key);
                    const canAfford = (state.skillPoints || 0) >= 5;

                    return (
                      <div
                        key={key}
                        className={`rounded-3xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                          isActive
                            ? 'bg-sky-500/[0.04] border-sky-400/40 shadow-[0_0_24px_rgba(56,189,248,0.06)]'
                            : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.06]'
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Header: Icon, Name & Status Badges */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border ${
                                isActive 
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 shadow-inner'
                                  : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                              }`}>
                                <i className={`fas ${info.icon || 'fa-chess-board'}`}></i>
                              </div>
                              <div>
                                <h5 className="text-base font-bold text-white tracking-tight leading-tight">
                                  {key === 'Defensive' ? 'Defensive (Catenaccio)' : key}
                                </h5>
                                <div className="text-[11px] text-zinc-400">
                                  {info.en}
                                </div>
                              </div>
                            </div>

                            {isActive && (
                              <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                {t(lang, 'Active DNA', 'Aktiv')}
                              </span>
                            )}
                          </div>

                          {/* Synergy with current coach notice */}
                          {matchesCurrentCoach && (
                            <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-xs text-emerald-300">
                              <i className="fa-solid fa-bolt text-emerald-400 text-xs shrink-0"></i>
                              <span>
                                {t(
                                  lang,
                                  state.currentCoach?.weakness === 'Tactical Rigidity'
                                    ? `Preferred by current coach (${state.currentCoach?.name}) · Unlocks +3 OVR Dogmatist Synergy!`
                                    : `Preferred by current coach (${state.currentCoach?.name}) · Unlocks +2 OVR Synergy!`,
                                  state.currentCoach?.weakness === 'Tactical Rigidity'
                                    ? `Favorit deines Trainers (${state.currentCoach?.name}) · Schaltet +3 GES Dogmatiker-Synergie frei!`
                                    : `Favorit deines Trainers (${state.currentCoach?.name}) · Schaltet +2 GES Synergie frei!`
                                )}
                              </span>
                            </div>
                          )}

                          {/* Tactical Impact description */}
                          <div className="text-xs text-zinc-300 leading-relaxed">
                            {info.effectDescEn}
                          </div>

                          {/* Perk Badge */}
                          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-emerald-300">
                            <strong>{t(lang, 'Perk:', 'Vorteil:')}</strong> {info.perkEn}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-4 pt-3 border-t border-white/[0.05]">
                          {isActive && !(state.staleTactic === state.tactic || (state.consecutiveTitlesWithSameTactic || 0) >= 1) ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2 px-3 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-400/20 text-xs font-semibold cursor-default flex items-center justify-center gap-1.5"
                            >
                              <i className="fa-solid fa-check text-xs"></i>
                              <span>{t(lang, 'Current System (Fresh)', 'Aktives System (Frisch)')}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPhilosophy) {
                                  onSelectPhilosophy(key);
                                }
                              }}
                              disabled={!canAfford}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                canAfford
                                  ? isActive
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm active:scale-[0.98]'
                                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm active:scale-[0.98]'
                                  : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                              }`}
                            >
                              <i className="fa-solid fa-arrows-rotate text-xs"></i>
                              <span>
                                {canAfford 
                                  ? isActive
                                    ? t(lang, 'Reinvent Current System (5 DP · Keep Coach Synergy)', 'System neu erfinden (5 DP · Synergie behalten)')
                                    : t(lang, 'Adopt Philosophy (5 DP)', 'Philosophie übernehmen (5 DP)')
                                  : t(lang, 'Requires 5 DP (Insufficient)', 'Erfordert 5 DP (Zu wenig DP)')
                                }
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="text-xs text-zinc-400 truncate max-w-sm hidden sm:block">
            {activeTab === 'staff' && t(lang, 'Review coach traits, manage contracts, or dismiss personnel.', 'Prüfe Trainereigenschaften, verlängere Verträge oder trenne dich vom Stab.')}
            {activeTab === 'market' && t(lang, 'Scout profiles with DP, review weaknesses, and appoint leaders.', 'Scoute Profile mit DP, decke Schwächen auf und verpflichte Trainer.')}
            {activeTab === 'philosophy' && t(lang, 'Harmonize club DNA with head coach tactics for +2 OVR synergy.', 'Harmonisiere Vereins-DNA mit dem Trainer für +2 GES Synergie.')}
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs transition border border-white/[0.08] cursor-pointer text-center"
          >
            {t(lang, 'Close Desk', 'Büro schließen')}
          </button>
        </div>
      </motion.div>

      {/* Coach Dossier Modal Integration */}
      <AnimatePresence>
        {dossierCoach && (
          <CoachDossierModal
            coach={dossierCoach}
            lang={lang as any}
            clubTactic={state.tactic}
            isCurrentCoach={state.currentCoach?.id === dossierCoach.id}
            coachTenure={state.coachTenure}
            hasNewManagerBounce={state.hasNewManagerBounce}
            canHire={
              (state.budget - dossierCoach.cost >= -creditLimit || dossierCoach.isReserveCoach) &&
              directorRep >= dossierCoach.repReq &&
              state.currentCoach?.id !== dossierCoach.id
            }
            hireDisabledReason={
              state.currentCoach?.id === dossierCoach.id
                ? 'Already Head Coach'
                : directorRep < dossierCoach.repReq
                  ? `Requires Reputation ${dossierCoach.repReq}`
                  : 'Exceeds Credit Limit'
            }
            onHire={(c) => {
              handleHire(c);
              setDossierCoach(null);
            }}
            onFire={() => {
              handleFire();
              setDossierCoach(null);
            }}
            onRenew={() => {
              handleRenew();
              setDossierCoach(null);
            }}
            onClose={() => setDossierCoach(null)}
          />
        )}
      </AnimatePresence>

      {/* Tactical Synergy Mismatch Intercept Prompt */}
      <AnimatePresence>
        {pendingMismatchCoach && (
          <div 
            onClick={() => setPendingMismatchCoach(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#161822] border border-amber-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg shrink-0">
                  <i className="fa-solid fa-arrows-split-up-and-left"></i>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                    {t(lang, 'Tactical Synergy Mismatch', 'Taktische Synergie-Divergenz')}
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {t(lang, 'System Compatibility Warning', 'System-Kompatibilität Warnung')}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                {pendingMismatchCoach.weakness === 'Tactical Rigidity' 
                  ? t(
                      lang,
                      `WARNING: This coach is a Dogmatist who prefers ${pendingMismatchCoach.style}. Your club's DNA is ${state.tactic}. Appointing them will trigger an immediate DRESSING ROOM MUTINY (-25 Morale, -5 OVR) until you align the club philosophy!`,
                      `WARNUNG: Dieser Dogmatiker bevorzugt ${pendingMismatchCoach.style}. Deine Vereins-DNA ist ${state.tactic}. Eine Verpflichtung löst eine sofortige KABINEN-MEUTEREI aus (-25 Moral, -5 GES)!`
                    )
                  : t(
                      lang,
                      `This coach prefers ${pendingMismatchCoach.style}, but your club's active DNA is ${state.tactic}. Appointing them will forgo the +2 OVR system synergy bonus until philosophy is aligned. Appoint anyway?`,
                      `Dieser Trainer bevorzugt ${pendingMismatchCoach.style}, die Vereins-DNA ist jedoch ${state.tactic}. Bei einer Verpflichtung entfällt der +2 GES Synergie-Bonus. Trotzdem verpflichten?`
                    )
                }
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingMismatchCoach(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 font-semibold text-xs transition cursor-pointer"
                >
                  {t(lang, 'Cancel', 'Abbrechen')}
                </button>
                <button
                  type="button"
                  onClick={() => executeHire(pendingMismatchCoach)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer shadow-md"
                >
                  {t(lang, 'Appoint Anyway', 'Trotzdem verpflichten')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
