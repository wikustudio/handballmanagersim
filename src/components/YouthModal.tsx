import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { GameState, Language, getAcademySlotLimit, calculateCohortRating } from '../types';
import { useGameStore } from '../store/useGameStore';
import { formatMoney, getLeagueScaledVal } from '../data/gameConstants';
import { generateYouthProspect } from '../engine/engine';
import { YouthChampionshipModal } from './YouthChampionshipModal';
import { CountUp } from './CountUp';
import { ClubLogo } from './ClubLogo';
import { TrophyGraphic } from './TrophyGraphic';
import { useModalDismiss } from '../utils/modalUtils';

interface YouthModalProps {
  onGachaReveal?: (data: any) => void;
  protectionCost?: number;
  creditLimit?: number;
  state: GameState;
  lang: Language;
  actionCost: number;
  financials: { wages: number; estRevenue: number; net: number };
  onRecruitYouth: (customCost?: number, customProspect?: any) => { success: boolean; message?: string; prospect?: any } | void;
  onProtectYouth?: (id: string) => void;
  canAfford: boolean;
  onClose: () => void;
}

export const YouthModal: React.FC<YouthModalProps> = ({
  state: propState,
  onRecruitYouth,
  onProtectYouth,
  onClose,
  canAfford,
  protectionCost = 25000,
  creditLimit = 0,
}) => {
  useModalDismiss(onClose);
  const storeState = useGameStore();
  const state = (storeState && storeState.club?.name) ? storeState : propState;
  const t = (en: string, _de?: string, _ignoredEs?: string) => en;
  const [showChampionship, setShowChampionship] = useState(false);
  const [isScouting, setIsScouting] = useState(false);
  const isScoutingRef = useRef(false);

  useEffect(() => {
    return () => {
      isScoutingRef.current = false;
    };
  }, []);

  const [scoutNotice, setScoutNotice] = useState<{
    type: 'success' | 'rejection';
    text: string;
  } | null>(null);

  const pipeline = state.youthPipeline || [];
  const academyLvl = state.club.academyLevel || 1;
  const maxSlots = getAcademySlotLimit(academyLvl);
  const activeCohort = pipeline.filter(p => !p.isLoanedOut);
  const activeProspects = activeCohort.length;
  const isAcademyFull = activeProspects >= maxSlots;
  const isSquadFull = (state.club.squadSize || 18) >= 22;
  const hasPlayedTournamentThisSeason = state.youthChampionshipSimulatedYear === state.year;
  const tier = state.club.tier || 1;
  const cleanCountry = (state.club.country || 'GER').trim().toUpperCase();
  const isExportPowerhouse = ['ARG', 'BRA', 'COL', 'URU', 'CHI', 'ECU'].includes(cleanCountry);
  const trialistsRecruitedThisSeason = pipeline.filter(p => p.isTrialist && (p.enrolledYear === state.year || !p.enrolledYear)).length;
  const isTrialistLimitReached = trialistsRecruitedThisSeason >= 1 || (state.schoolTrialistsThisSeason || 0) >= 1;
  const maxScoutingThisSeason = academyLvl;
  const scoutsUsedThisSeason = state.youthScoutsThisSeason || 0;
  const isScoutingLimitReached = scoutsUsedThisSeason >= maxScoutingThisSeason;

  const smallAcquisitionFee = Math.round(
    getLeagueScaledVal(state.club.tier || 1, 15000, state.club.country || 'GER')
  );

  const u19Rating = calculateCohortRating(
    state.club.baseOvr || 70,
    state.club.academyLevel || state.club.youthAcademy || 1,
    pipeline
  );

  const handleScoutNewTalent = () => {
    if (isAcademyFull || isScouting || isScoutingRef.current) return;
    isScoutingRef.current = true;
    setIsScouting(true);
    setScoutNotice(null);

    const options = {
      headCoachArchetype: state.headCoachArchetype || state.tactic,
      directorArchetype: state.directorArchetype,
      managerSkills: state.managerSkills,
      clubVision: state.clubVision,
    };
    const prospect = generateYouthProspect(academyLvl, state.club.country || 'GER', state.club.tier || 1, options);
    const result = onRecruitYouth(smallAcquisitionFee, prospect) as { success: boolean; message?: string; prospect?: any } | undefined;

    if (result && result.success === false) {
      setScoutNotice({
        type: 'rejection',
        text: result.message || t('Cannot recruit prospect right now.', 'Aufnahme nicht möglich.'),
      });
      setTimeout(() => {
        isScoutingRef.current = false;
        setIsScouting(false);
      }, 300);
      return;
    }

    if (prospect.boost < 3 && prospect.type !== 'generational') {
      setScoutNotice({
        type: 'success',
        text: `${prospect.name} (${prospect.position}, +${prospect.boost} OVR) signed`,
      });
    }

    setTimeout(() => {
      isScoutingRef.current = false;
      setIsScouting(false);
    }, 300);
  };

  const handleScoutSchoolTrialist = () => {
    if (isAcademyFull || isScouting || isScoutingRef.current || isTrialistLimitReached) return;
    isScoutingRef.current = true;
    setIsScouting(true);
    setScoutNotice(null);

    const options = {
      headCoachArchetype: state.headCoachArchetype || state.tactic,
      directorArchetype: state.directorArchetype,
      managerSkills: state.managerSkills,
      clubVision: state.clubVision,
    };
    const prospect = generateYouthProspect(academyLvl, state.club.country || 'GER', state.club.tier || 1, options);
    prospect.type = 'local';
    prospect.tierType = 'local';
    prospect.boost = 1;
    prospect.age = 15;
    prospect.timer = Math.max(2, prospect.timer || 2);
    prospect.isTrialist = true;
    prospect.enrolledYear = state.year;

    const result = onRecruitYouth(0, prospect) as { success: boolean; message?: string; prospect?: any } | undefined;

    if (result && result.success === false) {
      setScoutNotice({
        type: 'rejection',
        text: result.message || t('Trialist unavailable.', 'Probetraining nicht möglich.'),
      });
      setTimeout(() => {
        isScoutingRef.current = false;
        setIsScouting(false);
      }, 300);
      return;
    }

    setScoutNotice({
      type: 'success',
      text: `${prospect.name} (${prospect.position}, +1 OVR) joined on free trial`,
    });

    setTimeout(() => {
      isScoutingRef.current = false;
      setIsScouting(false);
    }, 300);
  };

  const handleScoutForeignImport = () => {
    if (isAcademyFull || isScouting || isScoutingRef.current || academyLvl < 4 || isScoutingLimitReached) return;
    isScoutingRef.current = true;
    setIsScouting(true);
    setScoutNotice(null);

    const options = {
      headCoachArchetype: state.headCoachArchetype || state.tactic,
      directorArchetype: state.directorArchetype,
      managerSkills: state.managerSkills,
      clubVision: state.clubVision,
      isForeignImport: true,
    };
    const prospect = generateYouthProspect(academyLvl, state.club.country || 'GER', state.club.tier || 1, options);
    const result = onRecruitYouth(smallAcquisitionFee, prospect) as { success: boolean; message?: string; prospect?: any } | undefined;

    if (result && result.success === false) {
      setScoutNotice({
        type: 'rejection',
        text: result.message || t('Cannot recruit prospect right now.', 'Aufnahme nicht möglich.'),
      });
      setTimeout(() => {
        isScoutingRef.current = false;
        setIsScouting(false);
      }, 300);
      return;
    }

    setScoutNotice({
      type: 'success',
      text: `${prospect.name} (${prospect.nationality || 'INT'}, +${prospect.boost} OVR) signed`,
    });

    setTimeout(() => {
      isScoutingRef.current = false;
      setIsScouting(false);
    }, 300);
  };

  const getProspectSaleFee = (p: any) => {
    const boostVal = p.boost || 1;
    if (isExportPowerhouse) {
      if (p.type === 'generational' || boostVal >= 3) {
        return 1800000 + (boostVal >= 3 ? 400000 : 0);
      } else if (p.type === 'top_prospect' || boostVal >= 2) {
        return 600000 + boostVal * 150000;
      } else {
        return 150000 + boostVal * 50000;
      }
    } else {
      const tier1BaseFee: Record<number, number> = {
        1: 75000,
        2: 220000,
        3: 650000
      };
      const rawBase = tier1BaseFee[Math.min(3, Math.max(1, boostVal))] || 75000;
      let fee = Math.round(getLeagueScaledVal(tier, rawBase, cleanCountry));
      if (p.type === 'generational') fee = Math.round(fee * 1.25);
      else if (p.type === 'top_prospect') fee = Math.round(fee * 1.15);
      return fee;
    }
  };

  if (showChampionship) {
    return (
      <YouthChampionshipModal
        state={state}
        onClose={() => setShowChampionship(false)}
        onComplete={(wonTitle) => {
          const store = useGameStore.getState();
          const currentNotifications = store.notifications || [];
          if (wonTitle) {
            const prevOvr = store.club.baseOvr || 60;
            const nextOvr = Math.min(store.maxOvrCap || 100, prevOvr + 1);
            const actualGain = Math.max(0, nextOvr - prevOvr);
            const nextMorale = Math.min(100, (store.club.morale ?? 100) + 15);
            const newHistory = actualGain > 0
              ? [{ id: Math.random().toString(36).substring(7), season: store.year, change: actualGain, reason: 'Youth Champions', reasonDe: 'Jugendmeister' }, ...(store.ovrHistory || [])].slice(0, 30)
              : (store.ovrHistory || []);
            const updatedClub = {
              ...store.club,
              morale: nextMorale,
              baseOvr: nextOvr
            };
            store.updateState({
              youthTitlesWon: (store.youthTitlesWon || 0) + 1,
              youthChampionshipSimulatedYear: store.year,
              lastOvr: typeof store.lastOvr === 'number' ? store.lastOvr : prevOvr,
              startOfSeasonOvr: typeof store.startOfSeasonOvr === 'number' ? store.startOfSeasonOvr : prevOvr,
              ovrHistory: newHistory,
              eventOvrGainThisSeason: (store.eventOvrGainThisSeason || 0) + actualGain,
              club: updatedClub,
              worldClubs: {
                ...(store.worldClubs || {}),
                [store.club.id]: {
                  ...(store.worldClubs?.[store.club.id] || store.club),
                  morale: nextMorale,
                  baseOvr: nextOvr
                },
                [String(store.club.id)]: {
                  ...(store.worldClubs?.[String(store.club.id)] || store.club),
                  morale: nextMorale,
                  baseOvr: nextOvr
                }
              },
              notifications: [{
                id: Math.random().toString(),
                type: 'celebration',
                title: '🏆 U19 Youth Champions!',
                message: 'Youth Champions! The U19 golden generation gives your senior squad a permanent +1 OVR and +15 Morale boost.',
                read: false
              }, ...currentNotifications]
            });
          } else {
            store.updateState({
              youthChampionshipSimulatedYear: store.year,
              notifications: [{
                id: Math.random().toString(),
                type: 'info',
                title: 'U19 Championship',
                message: 'Your U19 team was eliminated from the championship.',
                read: false
              }, ...currentNotifications]
            });
          }
        }}
      />
    );
  }

  const canEnterCup = activeProspects >= 6 && !hasPlayedTournamentThisSeason;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-[100] backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#14151e] rounded-[28px] border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] overflow-hidden cursor-default pointer-events-auto"
      >
        {/* Top Ambient Hairline */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-white/[0.04] shrink-0 bg-[#14151e]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base border border-emerald-500/20 shrink-0">
              <i className="fas fa-seedling" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 leading-none">
                  {t(`ACADEMY LEVEL ${academyLvl}/5`, `AKADEMIE STUFE ${academyLvl}/5`)}
                </span>
                <div className="flex items-center gap-0.5 text-[9px] text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i key={`star-${i}`} className={`fas fa-star ${i < academyLvl ? 'text-amber-400' : 'text-white/10'}`} />
                  ))}
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none truncate">
                {t('Youth Academy', 'Jugendakademie')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-[#10121a] border border-white/[0.04] px-3 py-1.5 rounded-xl">
              <ClubLogo
                name={state.club.name}
                logo={state.club.logo}
                fallbackLogo={state.club.fallbackLogo}
                color={state.club.color}
                className="w-4 h-4 object-contain shrink-0"
                fallbackClassName="w-4 h-4 text-[7px] rounded flex items-center justify-center font-bold text-white shrink-0"
              />
              <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">
                {state.club.name}
              </span>
            </div>
            <button
              aria-label="Close modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center transition active:scale-95 text-zinc-400 hover:text-white cursor-pointer"
            >
              <i className="fas fa-xmark text-sm" />
            </button>
          </div>
        </div>

        {/* Top 3-Column Metrics Bento + U19 Championship Card */}
        <div className="px-5 pt-4 shrink-0 flex flex-col gap-3">
          <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-3.5 sm:p-4 grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('TREASURY', 'BUDGET')}
              </span>
              <span className={`text-lg sm:text-xl font-semibold tracking-tight tabular-nums ${state.budget < 0 ? 'text-rose-400' : 'text-white'}`}>
                <CountUp value={state.budget} formatValue={formatMoney} duration={600} />
              </span>
            </div>

            <div className="border-l border-white/[0.04] pl-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('U19 STRENGTH', 'U19-STÄRKE')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-semibold tracking-tight tabular-nums text-white">
                  {u19Rating}
                </span>
                <span className="text-xs font-medium text-emerald-400">OVR</span>
              </div>
            </div>

            <div className="border-l border-white/[0.04] pl-3 text-right">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('ACADEMY SLOTS', 'PLÄTZE')}
              </span>
              <span className="text-lg sm:text-xl font-semibold tracking-tight tabular-nums text-white">
                {activeProspects}<span className="text-xs sm:text-sm font-normal text-zinc-500">/{maxSlots}</span>
              </span>
            </div>
          </div>

          {/* U19 National Cup Card */}
          <div className={`rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
            canEnterCup
              ? 'bg-[#10121a] border-amber-500/25'
              : 'bg-[#10121a] border-white/[0.04]'
          }`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-11 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                <TrophyGraphic size="sm" type="league" showStars={false} className="scale-75" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">
                    {t('U19 National Cup', 'U19-Meisterschaft')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-amber-400">
                    +1 OVR · +15 Morale
                  </span>
                  {(state.youthTitlesWon || 0) > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
                      · {state.youthTitlesWon}x Won
                    </span>
                  )}
                </div>

                {/* 6-Player Squad Readiness Segments */}
                <div className="flex items-center gap-1.5 mt-2">
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const filled = idx < activeProspects;
                    return (
                      <div
                        key={`u19-dot-${idx}`}
                        className={`h-1.5 flex-1 max-w-[28px] rounded-full transition-all ${
                          filled
                            ? canEnterCup
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                            : 'bg-white/[0.06]'
                        }`}
                      />
                    );
                  })}
                  <span className="text-[10px] font-mono text-zinc-400 tabular-nums ml-1">
                    {Math.min(6, activeProspects)}/6 U19 Squad
                  </span>
                </div>
              </div>
            </div>

            {!hasPlayedTournamentThisSeason ? (
              activeProspects >= 6 ? (
                <button
                  onClick={() => setShowChampionship(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#181924] hover:bg-white/[0.08] border border-amber-500/30 text-amber-300 font-medium text-xs transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1.5"
                >
                  <i className="fas fa-play text-[10px]" />
                  <span>{t('Play Cup', 'Spielen')}</span>
                </button>
              ) : (
                <span className="px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-[11px] text-zinc-500 font-medium shrink-0 whitespace-nowrap tabular-nums">
                  {t(`Need ${6 - activeProspects} more`, `Noch ${6 - activeProspects}`)}
                </span>
              )
            ) : (
              <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium shrink-0 whitespace-nowrap flex items-center gap-1.5">
                <i className="fas fa-check text-[10px]" />
                <span>{t('Played', 'Gespielt')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Roster Body */}
        <div className="flex-1 overflow-y-auto p-5 pt-3.5 space-y-2.5 custom-scrollbar">
          {/* Brief Feedback Toast */}
          {scoutNotice && (
            <div className={`px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs ${
              scoutNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            }`}>
              <span className="truncate font-medium">{scoutNotice.text}</span>
              <button onClick={() => setScoutNotice(null)} className="text-zinc-400 hover:text-white ml-2 cursor-pointer">
                <i className="fas fa-xmark text-xs" />
              </button>
            </div>
          )}

          {pipeline.length === 0 ? (
            <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-8 text-center flex flex-col items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                <i className="fas fa-user-graduate" />
              </div>
              <div className="text-white font-semibold text-sm">{t('No Youth Players Yet', 'Noch keine Talente')}</div>
              <div className="text-zinc-500 text-xs max-w-xs leading-relaxed">
                {t('Scout 6 players below to enter the National U19 Cup and develop future starters.', 'Scoute unten 6 Talente für die U19-Meisterschaft und deinen Profikader.')}
              </div>
            </div>
          ) : (
            pipeline.map((p, idx) => {
              const isGenerational = p.type === 'generational' || (p.boost || 1) >= 3;
              const isTop = p.type === 'top_prospect' || (p.boost || 1) === 2;
              const isMature = (p.timer || 0) <= 0 && !p.isLoanedOut;
              const fee = getProspectSaleFee(p);
              const rawBoost = p.boost || 1;

              const badgeColors = isGenerational
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                : isTop
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-sky-500/10 border-sky-500/25 text-sky-400';

              const tierLabel = isGenerational
                ? t('Generational', 'Jahrhunderttalent')
                : isTop
                ? t('Top Prospect', 'Top-Talent')
                : t('Prospect', 'Talent');

              return (
                <div
                  key={`${p.id}-${idx}`}
                  className={`rounded-2xl p-3.5 border transition-all flex flex-col gap-2.5 ${
                    isMature
                      ? 'bg-[#10121a] border-emerald-500/25'
                      : 'bg-[#10121a] border-white/[0.04] hover:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Position Avatar + Name + 1-line status */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center shrink-0 font-mono ${badgeColors}`}>
                        <span className="text-[10px] font-bold leading-none">{p.position || 'U19'}</span>
                        <span className="text-[10px] font-semibold leading-none mt-1">+{rawBoost}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-xs sm:text-sm truncate">
                            {p.name || `Talent #${idx + 1}`}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                            {tierLabel}
                          </span>
                          {p.isForeignImport && (
                            <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded shrink-0">
                              {p.nationality}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-1">
                          <span className="tabular-nums font-medium text-zinc-300">{p.age}y</span>
                          <span className="text-zinc-600">·</span>
                          {p.isLoanedOut ? (
                            <span className="text-sky-400 font-medium flex items-center gap-1">
                              <i className="fas fa-repeat text-[9px]" />
                              <span>{t('On Loan (+1 OVR next season)', 'Ausgeliehen (+1 GES)')}</span>
                            </span>
                          ) : isMature ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <i className="fas fa-circle-check text-[10px]" />
                              <span>{t('Graduate Ready · Choose Action', 'Bereit für Profikader')}</span>
                            </span>
                          ) : (
                            <span className="tabular-nums">
                              {p.timer === 1 ? t('1 season left in U19', 'Noch 1 Saison') : t(`${p.timer} seasons left in U19`, `Noch ${p.timer} Saisons`)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Potential Badge (& Protected Icon) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      {!isMature && !p.isLoanedOut && p.isProtected && (
                        <span
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs"
                          title="Protected from rival poachers"
                        >
                          <i className="fas fa-shield-halved" />
                        </span>
                      )}

                      <div className="px-2.5 py-1 rounded-xl bg-[#181924] border border-white/[0.04] text-right tabular-nums">
                        <span className={`text-xs font-semibold font-mono ${
                          rawBoost >= 3 ? 'text-amber-400' : rawBoost === 2 ? 'text-emerald-400' : 'text-zinc-300'
                        }`}>
                          +{rawBoost} OVR
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Row for Developing U19 Prospects (Loan / Protect Contract) */}
                  {!isMature && !p.isLoanedOut && (!p.loanBonusEarned || (academyLvl >= 3 && !p.isProtected)) && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                      {!p.loanBonusEarned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const res = useGameStore.getState().loanYouthProspect(p.id);
                            setScoutNotice({
                              type: res.success ? 'success' : 'rejection',
                              text: res.message
                            });
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#181924] hover:bg-sky-500/15 text-zinc-200 hover:text-white border border-white/[0.06] hover:border-sky-500/30 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap"
                          title={t('Send on 1-season affiliate loan (+1 OVR bonus)', 'Für 1 Saison verleihen (+1 GES Bonus)')}
                        >
                          <i className="fas fa-repeat text-[10px] text-sky-400" />
                          <span>{t('Farm Loan', 'Leihe')}</span>
                          <span className="font-mono text-sky-400 tabular-nums">+1 OVR</span>
                        </button>
                      )}

                      {academyLvl >= 3 && !p.isProtected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onProtectYouth?.(p.id);
                            setScoutNotice({
                              type: 'success',
                              text: `${p.name} contract shielded (-${formatMoney(protectionCost)})`
                            });
                          }}
                          disabled={state.budget < -creditLimit + protectionCost}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#181924] hover:bg-emerald-500/15 text-zinc-200 hover:text-white border border-white/[0.06] hover:border-emerald-500/30 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 whitespace-nowrap active:scale-95"
                          title={`Shield from poachers (-${formatMoney(protectionCost)})`}
                        >
                          <i className="fas fa-shield-halved text-[10px] text-emerald-400" />
                          <span>{t('Shield', 'Schützen')}</span>
                          <span className="tabular-nums font-mono text-emerald-400">-{formatMoney(protectionCost)}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Clean 3-Button Row for Mature Graduates */}
                  {isMature && (
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2.5 border-t border-white/[0.04]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSquadFull) return;
                          const res = useGameStore.getState().pullYouthPlayer(p.id);
                          setScoutNotice({
                            type: res.success ? 'success' : 'rejection',
                            text: res.message
                          });
                        }}
                        disabled={isSquadFull}
                        className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0 ${
                          isSquadFull
                            ? 'bg-white/[0.02] text-zinc-500 border border-white/[0.04] cursor-not-allowed'
                            : 'bg-[#181924] hover:bg-emerald-500/15 text-white border border-emerald-500/25 cursor-pointer active:scale-95'
                        }`}
                      >
                        <i className="fas fa-arrow-up text-[10px] text-emerald-400 shrink-0" />
                        <span className="truncate">{isSquadFull ? t('Squad Full', 'Kader voll') : t('Promote', 'Profis')}</span>
                        <span className="font-mono text-emerald-400 tabular-nums shrink-0">+{rawBoost}</span>
                      </button>

                      {!p.loanBonusEarned ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const res = useGameStore.getState().loanYouthProspect(p.id);
                            setScoutNotice({
                              type: res.success ? 'success' : 'rejection',
                              text: res.message
                            });
                          }}
                          className="py-2 px-2 sm:px-3 rounded-xl bg-[#181924] hover:bg-sky-500/15 text-white border border-white/[0.06] text-xs font-medium transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap min-w-0"
                        >
                          <i className="fas fa-repeat text-[10px] text-sky-400 shrink-0" />
                          <span className="truncate">{t('Loan', 'Leihe')}</span>
                          <span className="font-mono text-sky-400 tabular-nums shrink-0">+1 OVR</span>
                        </button>
                      ) : (
                        <div className="py-2 px-2 sm:px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-zinc-500 text-xs font-medium flex items-center justify-center whitespace-nowrap min-w-0">
                          <span className="truncate">{t('Loaned Out', 'Verliehen')}</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const res = useGameStore.getState().sellYouthProspect(p.id);
                          setScoutNotice({
                            type: res.success ? 'success' : 'rejection',
                            text: res.message
                          });
                        }}
                        className="py-2 px-2 sm:px-3 rounded-xl bg-[#181924] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.06] text-xs font-medium transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap min-w-0"
                      >
                        <span className="truncate">{t('Sell', 'Verkauf')}</span>
                        <span className="font-mono text-emerald-400 tabular-nums shrink-0">+{formatMoney(fee)}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer: Clean Scouting Controls */}
        <div className="p-4 border-t border-white/[0.04] bg-[#10121a] flex flex-col gap-2.5 shrink-0">
          {!isAcademyFull && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              {canAfford && (
                <button
                  onClick={handleScoutNewTalent}
                  disabled={isScouting || isScoutingRef.current || isScoutingLimitReached}
                  className="flex-1 min-w-[140px] py-2.5 px-3 sm:px-3.5 rounded-xl bg-[#181924] hover:bg-white/[0.06] text-white border border-white/[0.06] text-xs font-medium transition active:scale-[0.99] cursor-pointer flex items-center justify-between gap-2 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <i className="fas fa-magnifying-glass text-emerald-400 text-xs" />
                    <span>{t('Scout Talent', 'Talent scouten')}</span>
                    <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                      ({scoutsUsedThisSeason}/{maxScoutingThisSeason})
                    </span>
                  </span>
                  <span className="font-mono text-emerald-400 tabular-nums">
                    -{formatMoney(smallAcquisitionFee)}
                  </span>
                </button>
              )}

              {canAfford && academyLvl >= 4 && (
                <button
                  onClick={handleScoutForeignImport}
                  disabled={isScouting || isScoutingRef.current || isScoutingLimitReached}
                  className="flex-1 min-w-[120px] py-2.5 px-3 sm:px-3.5 rounded-xl bg-[#181924] hover:bg-white/[0.06] text-white border border-white/[0.06] text-xs font-medium transition active:scale-[0.99] cursor-pointer flex items-center justify-between gap-2 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <i className="fas fa-earth-europe text-sky-400 text-xs" />
                    <span>{t('Foreign', 'Ausland')}</span>
                  </span>
                  <span className="font-mono text-sky-400 tabular-nums">
                    -{formatMoney(smallAcquisitionFee)}
                  </span>
                </button>
              )}

              <button
                onClick={handleScoutSchoolTrialist}
                disabled={isScouting || isScoutingRef.current || isTrialistLimitReached}
                className="flex-1 sm:flex-initial py-2.5 px-3 sm:px-3.5 rounded-xl bg-[#181924] hover:bg-white/[0.06] text-zinc-200 border border-white/[0.06] text-xs font-medium transition active:scale-[0.99] cursor-pointer flex items-center justify-center sm:justify-start gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
              >
                <i className="fas fa-seedling text-emerald-400 text-xs" />
                <span>{t('Free Trial', 'Schultalent')}</span>
                <span className="font-mono text-emerald-400 tabular-nums">0 €</span>
              </button>
            </div>
          )}

          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-full py-2.5 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition active:scale-[0.99] border border-white/[0.06] cursor-pointer"
          >
            {t('Close Window', 'Fenster schließen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
