import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { GameState, Language, getAcademySlotLimit, calculateCohortRating } from '../types';
import { useGameStore } from '../store/useGameStore';
import { 
  formatMoney, 
  getLeagueScaledVal, 
  getRequiredAcademyLevelForYouthPull, 
  getMaxYouthPullsPerSeason 
} from '../data/gameConstants';
import { generateYouthProspect } from '../engine/engine';
import { YouthChampionshipModal } from './YouthChampionshipModal';
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
  state,
  lang,
  actionCost,
  onRecruitYouth,
  onProtectYouth,
  onClose,
  canAfford,
  protectionCost = 25000,
  creditLimit = 0,
  financials,
  onGachaReveal,
}) => {
  useModalDismiss(onClose);
  const t = (en: string, _de?: string, _ignoredEs?: string) => en;
  const [activeTab, setActiveTab] = useState<'pipeline' | 'championship'>('pipeline');
  const [protectConfirmId, setProtectConfirmId] = useState<string | null>(null);
  const [showChampionship, setShowChampionship] = useState(false);
  const [isScouting, setIsScouting] = useState(false);
  const isScoutingRef = useRef(false);

  useEffect(() => {
    return () => {
      isScoutingRef.current = false;
    };
  }, []);
  
  // Instant Notice for action feedback
  const [scoutNotice, setScoutNotice] = useState<{
    type: 'success' | 'rejection';
    title: string;
    message: string;
  } | null>(null);
  
  const pipeline = state.youthPipeline || [];
  const academyLvl = state.club.academyLevel || 1;
  const maxSlots = getAcademySlotLimit(academyLvl);
  const activeProspects = pipeline.filter(p => !p.isLoanedOut).length;
  const isAcademyFull = activeProspects >= maxSlots;
  const isSquadFull = (state.club.squadSize || 18) >= 22;
  const hasPlayedTournamentThisSeason = state.youthChampionshipSimulatedYear === state.year;
  const tier = state.club.tier || 1;
  const cleanCountry = (state.club.country || 'GER').trim().toUpperCase();
  const isExportPowerhouse = ['ARG', 'BRA', 'COL', 'URU', 'CHI', 'ECU'].includes(cleanCountry);
  const trialistsRecruitedThisSeason = pipeline.filter(p => p.isTrialist && (p.enrolledYear === state.year || !p.enrolledYear)).length;
  const isTrialistLimitReached = trialistsRecruitedThisSeason >= 1 || (state.schoolTrialistsThisSeason || 0) >= 1;
  // Scale scouting limit directly 1:1 with the academy level
  const maxScoutingThisSeason = academyLvl;
  const scoutsUsedThisSeason = state.youthScoutsThisSeason || 0;
  const isScoutingLimitReached = scoutsUsedThisSeason >= maxScoutingThisSeason;

  // Coach and Director synergies
  const coachArchetype = state.headCoachArchetype || state.tactic || '';
  const hasYouthCoach = coachArchetype === 'Youth Developer' || 
                        coachArchetype === 'Scout' || 
                        coachArchetype === 'Continental Legend' ||
                        (state.managerSkills || []).includes('talentscout');
  const isScoutDirector = state.directorArchetype === 'Scout / Youth Developer';

  // Small acquisition fee scaled to league tier and national economy
  const smallAcquisitionFee = Math.round(
    getLeagueScaledVal(state.club.tier || 1, 15000, state.club.country || 'GER')
  );

  const u19Rating = calculateCohortRating(
    state.club.baseOvr || 70,
    state.club.academyLevel || state.club.youthAcademy || 1,
    pipeline
  );

  const handleSimulateChampionship = () => {
    if (activeProspects < 6) return;
    setShowChampionship(true);
  };

  // Direct Scouting Action: Discover 15-17yo talent using facility quality rolls & archetype perks
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
        title: t('Recruitment Failed', 'Aufnahme fehlgeschlagen'),
        message: result.message || t('Cannot recruit prospect at this time.', 'Talent kann derzeit nicht aufgenommen werden.'),
      });
      setTimeout(() => {
        isScoutingRef.current = false;
        setIsScouting(false);
      }, 400);
      return;
    }

    const tierName = prospect.type === 'generational'
      ? t('Generational Wonderkid', 'Ausnahmetalent')
      : prospect.type === 'top_prospect'
      ? t('Top Prospect', 'Top-Talent')
      : t('Local Prospect', 'Regionales Talent');

    if (prospect.boost < 3 && prospect.type !== 'generational') {
      setScoutNotice({
        type: 'success',
        title: t('Talent Enrolled', 'Talent aufgenommen'),
        message: t(
          `${prospect.name} (${prospect.position}, ${prospect.age} yrs, +${prospect.boost} OVR potential) enrolled into the academy for -${formatMoney(smallAcquisitionFee)}. (${activeProspects + 1}/${maxSlots} slots occupied)`,
          `${prospect.name} (${prospect.position}, ${prospect.age} J., +${prospect.boost} GES-Potenzial) aufgenommen für -${formatMoney(smallAcquisitionFee)}. (${activeProspects + 1}/${maxSlots} belegt)`
        ),
      });
    }

    setTimeout(() => {
      isScoutingRef.current = false;
      setIsScouting(false);
    }, 400);
  };

  // Free School Trialist: 0 € fee, recruited directly (max 1 per season, 15yo, timer >= 2)
  const handleScoutSchoolTrialist = () => {
    if (isAcademyFull || isScouting || isScoutingRef.current) return;
    if (isTrialistLimitReached) {
      setScoutNotice({
        type: 'rejection',
        title: t('Trialist Quota Reached', 'Kontingent erschöpft'),
        message: t('Only 1 free school trialist permitted per season.', 'Nur 1 freies Schultalent pro Saison erlaubt.'),
      });
      return;
    }
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
        title: t('Recruitment Failed', 'Aufnahme fehlgeschlagen'),
        message: result.message || t('Cannot recruit trialist at this time.', 'Probetraining derzeit nicht möglich.'),
      });
      setTimeout(() => {
        isScoutingRef.current = false;
        setIsScouting(false);
      }, 400);
      return;
    }

    setScoutNotice({
      type: 'success',
      title: t('School Trialist Enrolled', 'Schultalent aufgenommen'),
      message: t(
        `${prospect.name} (${prospect.position}, ${prospect.age} yrs, +${prospect.boost} OVR) enrolled for free (0 €). (${activeProspects + 1}/${maxSlots} slots occupied)`,
        `${prospect.name} (${prospect.position}, ${prospect.age} J., +${prospect.boost} GES) kostenlos aufgenommen. (${activeProspects + 1}/${maxSlots} belegt)`
      ),
    });

    setTimeout(() => {
      isScoutingRef.current = false;
      setIsScouting(false);
    }, 400);
  };

  // Foreign Imports: Level 4 Milestone (Continental Setup)
  const handleScoutForeignImport = () => {
    if (isAcademyFull || isScouting || isScoutingRef.current) return;
    if (academyLvl < 4) return;
    if (isScoutingLimitReached) return;
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
        title: t('Recruitment Failed', 'Aufnahme fehlgeschlagen'),
        message: result.message || t('Cannot recruit prospect at this time.', 'Talent kann derzeit nicht aufgenommen werden.'),
      });
      setTimeout(() => {
        isScoutingRef.current = false;
        setIsScouting(false);
      }, 400);
      return;
    }

    setScoutNotice({
      type: 'success',
      title: t('Continental Wonderkid Enrolled!', 'Internationales Talent aufgenommen!'),
      message: t(
        `🌍 ${prospect.name} (${prospect.nationality || 'DEN'}, ${prospect.position}, ${prospect.age} yrs, +${prospect.boost} OVR potential) enrolled via Continental Scouting network!`,
        `🌍 ${prospect.name} (${prospect.nationality || 'DEN'}, ${prospect.position}, ${prospect.age} J., +${prospect.boost} GES-Potenzial) über kontinentales Scouting aufgenommen!`
      ),
    });

    setTimeout(() => {
      isScoutingRef.current = false;
      setIsScouting(false);
    }, 400);
  };

  // Helper to calculate realistic training compensation
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

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-5 z-[100] backdrop-blur-2xl cursor-pointer"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }} 
        exit={{ scale: 0.95, y: 10, opacity: 0 }} 
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] w-full max-w-lg rounded-2xl border border-white/[0.04] flex flex-col max-h-[90vh] overflow-hidden cursor-default pointer-events-auto relative shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
      >
        {/* Top Ambient Highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-white/[0.04] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base border border-emerald-500/20 shrink-0">
              <i className="fas fa-seedling" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                {t('Youth Academy', 'Jugendakademie')}
              </h2>
              <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <span className="font-medium text-zinc-300 tabular-nums">Level {academyLvl}</span>
                <span className="text-zinc-600">·</span>
                <span className="tabular-nums font-normal text-zinc-400">
                  {activeProspects} / {maxSlots} {t('Capacity Slots', 'Plätze belegt')}
                </span>
                {(state.youthDevQueue || 0) > 0 && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-medium bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>+{state.youthDevQueue} OVR {t('Banked', 'Reifend')}</span>
                    </span>
                  </>
                )}
                {state.clubVision === 'Youth Academy Focus' && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="inline-flex items-center gap-1 text-sky-300 font-medium bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                      <span>{t('Academy Vision', 'Akademie-Vision')} (+12)</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button 
            aria-label="Close modal" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex flex-col gap-3.5 flex-1 min-h-0">
          
          {/* Tab Selector */}
          <div className="flex p-1 bg-white/[0.02] rounded-xl border border-white/[0.04] shrink-0 gap-1 mb-0.5">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-emerald-500/[0.08] text-emerald-300 border border-emerald-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <i className="fas fa-graduation-cap text-xs" />
              <span>{t('Talent Pipeline', 'Talent-Förderung')}</span>
              <span className="text-[10px] tabular-nums font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
                {activeProspects}/{maxSlots}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('championship')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'championship'
                  ? 'bg-amber-500/[0.08] text-amber-300 border border-amber-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <i className="fas fa-trophy text-xs" />
              <span>{t('U19 Championship', 'U19-Meisterschaft')}</span>
              <span className="text-[10px] tabular-nums font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
                {activeProspects}/6
              </span>
              {!hasPlayedTournamentThisSeason && activeProspects >= 6 && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              )}
            </button>
          </div>

          {/* Tab 1: Academy Pipeline */}
          {activeTab === 'pipeline' && (
            <>
              {/* Sleek Academy Status Bar */}
              <div className="bg-[#181924] border border-white/[0.04] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="text-zinc-300 font-medium">Lvl {academyLvl}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400 font-mono text-[11px] tabular-nums">{maxSlots} Slots Max</span>
                  {hasYouthCoach && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400 text-[11px] font-normal">+15 Coach Quality</span>
                    </>
                  )}
                  {isScoutDirector && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400 text-[11px] font-normal">-35% Upgrades</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                  {pipeline.length} Enrolled
                </span>
              </div>

              {/* Dynamic Facility Milestones Bento (Unlocking Capabilities) */}
              <div className="bg-[#12131d] border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-cubes text-[10px]" />
                    <span>{t('Academy Facility Milestones & Capabilities', 'Akademie-Meilensteine & Freigeschaltete Features')}</span>
                  </span>
                  <span className="text-zinc-400 font-mono">Lvl {academyLvl}/5</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  {/* Lvl 2 */}
                  <div className={`p-2 rounded-lg border flex flex-col gap-0.5 ${academyLvl >= 2 ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-black/20 border-white/[0.04] text-zinc-500'}`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>Lvl 2 · Regional</span>
                      {academyLvl >= 2 ? <i className="fas fa-check text-[9px] text-emerald-400" /> : <i className="fas fa-lock text-[9px]" />}
                    </div>
                    <span className="leading-tight text-[9px] opacity-90">{t('2 Youths / Season', '2 Talente pro Saison')}</span>
                  </div>

                  {/* Lvl 3 */}
                  <div className={`p-2 rounded-lg border flex flex-col gap-0.5 ${academyLvl >= 3 ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-black/20 border-white/[0.04] text-zinc-500'}`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>Lvl 3 · NLZ</span>
                      {academyLvl >= 3 ? <i className="fas fa-check text-[9px] text-emerald-400" /> : <i className="fas fa-lock text-[9px]" />}
                    </div>
                    <span className="leading-tight text-[9px] opacity-90">{t('Anti-Poaching Shield', 'Abwerbungsschutz')}</span>
                  </div>

                  {/* Lvl 4 */}
                  <div className={`p-2 rounded-lg border flex flex-col gap-0.5 ${academyLvl >= 4 ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-black/20 border-white/[0.04] text-zinc-500'}`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>Lvl 4 · Continental</span>
                      {academyLvl >= 4 ? <i className="fas fa-check text-[9px] text-purple-400" /> : <i className="fas fa-lock text-[9px]" />}
                    </div>
                    <span className="leading-tight text-[9px] opacity-90">{t('Foreign Imports 🌍', 'Internationale Talente')}</span>
                  </div>

                  {/* Lvl 5 */}
                  <div className={`p-2 rounded-lg border flex flex-col gap-0.5 ${academyLvl >= 5 ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-black/20 border-white/[0.04] text-zinc-500'}`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>Lvl 5 · Dynasty</span>
                      {academyLvl >= 5 ? <i className="fas fa-crown text-[9px] text-amber-400" /> : <i className="fas fa-lock text-[9px]" />}
                    </div>
                    <span className="leading-tight text-[9px] opacity-90">{t('Target Immunity 🛡️', 'Titel-Steuer Immunität')}</span>
                  </div>
                </div>
              </div>

              {/* Banked Youth Development Banner */}
              {(state.youthDevQueue || 0) > 0 && (
                <div className="bg-[#181924] border border-white/[0.04] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-zinc-300 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-sm">
                      ⏳
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-white tracking-tight flex items-center gap-1.5">
                        <span>{t('Banked Rookie Development', 'Reifende Nachwuchs-Entwicklung')}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono font-medium tabular-nums">
                          +{state.youthDevQueue} OVR
                        </span>
                      </span>
                      <span className="text-[11px] font-normal text-zinc-400 leading-tight">
                        {t(
                          `Integrated rookie potential is banked and will mature into the senior squad (+${state.youthDevQueue} OVR) during season simulation.`,
                          `Integriertes Nachwuchspotenzial ist angespart und reift bei der Saisonsimulation (+${state.youthDevQueue} GES) in den Profikader.`
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shrink-0 ml-2 hidden sm:inline">
                    {t('Active Queue', 'Warteschlange aktiv')}
                  </span>
                </div>
              )}

              {/* Action Notification */}
              {scoutNotice && (
                <div className={`p-3 rounded-xl border shrink-0 flex items-start gap-2.5 transition-all text-xs ${
                  scoutNotice.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                }`}>
                  <i className={`fas mt-0.5 ${scoutNotice.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-amber-400'}`} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-white">{scoutNotice.title}</span>
                    <p className="text-[11px] mt-0.5 opacity-90 leading-tight">{scoutNotice.message}</p>
                  </div>
                  <button onClick={() => setScoutNotice(null)} className="text-zinc-400 hover:text-white p-0.5 cursor-pointer">
                    <i className="fas fa-xmark text-xs" />
                  </button>
                </div>
              )}

              {/* Prospects List */}
              <div className="flex flex-col gap-2 shrink-0">
                {pipeline.length === 0 ? (
                  <div className="text-center py-7 px-4 border border-white/[0.04] rounded-2xl bg-[#181924] flex flex-col items-center gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.04] text-zinc-500 flex items-center justify-center text-lg mb-0.5">
                      <i className="fas fa-user-graduate" />
                    </div>
                    <div className="text-white font-semibold text-xs">{t('No Prospects in Academy', 'Keine Talente in der Akademie')}</div>
                    <div className="text-zinc-500 text-[11px] max-w-xs">{t('Scout talent below to enroll prospects into your incubator.', 'Scoute unten neue Talente, um sie in der Akademie auszubilden.')}</div>
                  </div>
                ) : (
                  pipeline.map((p, idx) => {
                    const isGenerational = p.type === 'generational';
                    const isTop = p.type === 'top_prospect';
                    const isMature = (p.timer || 0) <= 0 && !p.isLoanedOut;
                    const fee = getProspectSaleFee(p);
                    const rawBoost = p.boost || 1;
                    const instantGain = rawBoost;
                    const queuedGain = 0;
                    const baseDefenseChance = p.protectionDefenseChance || Math.min(99, 45 + 10 * academyLvl);
                    const isStar = (p.boost || 1) >= 3;
                    const defenseChance = tier > 1
                      ? Math.max(15, Math.round(baseDefenseChance - (tier - 1) * 9 - (isStar ? 12 : 4)))
                      : baseDefenseChance;
                    
                    return (
                      <div
                        key={`${p.id}-${idx}`}
                        className={`bg-[#181924] border rounded-2xl p-3.5 flex flex-col gap-2.5 transition shrink-0 ${
                          isMature 
                            ? 'border-emerald-500/20' 
                            : p.isLoanedOut 
                            ? 'border-white/[0.04]' 
                            : 'border-white/[0.04] hover:border-emerald-500/20'
                        }`}
                      >
                        {/* Prospect Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="text-white font-semibold text-xs sm:text-[13px] flex items-center gap-2">
                              <span className="truncate max-w-[170px] sm:max-w-[210px]">{p.name || `Talent #${idx + 1}`}</span>
                              {p.position && (
                                <span className="text-[10px] text-zinc-400 font-normal">
                                  · {p.position}
                                </span>
                              )}
                              {p.nationality && (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  ({p.nationality})
                                </span>
                              )}
                            </div>
                            
                            {/* Meta & Tier */}
                            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5 font-normal flex-wrap">
                              {isGenerational ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                  <span>{t('Generational Wonderkid', 'Ausnahmetalent')}</span>
                                </span>
                              ) : isTop ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                  <span>{t('Top Prospect', 'Top-Talent')}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                  <span>{t('Local Prospect', 'Regionales Talent')}</span>
                                </span>
                              )}
                              {p.isForeignImport && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded">
                                  <span>🌍 {p.nationality || 'DEN'}</span>
                                </span>
                              )}
                              <span className="text-zinc-600">·</span>
                              <span className="tabular-nums text-zinc-400">{p.age} {t('yrs', 'J.')}</span>
                              {p.playstyle && (
                                <>
                                  <span className="text-zinc-600">·</span>
                                  <span className="text-zinc-500 italic text-[10px]">{p.playstyle}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Right Side: Boost & Status */}
                          <div className="flex flex-col items-end tabular-nums shrink-0">
                            <span className="font-medium text-xs sm:text-sm text-zinc-200">
                              +{p.boost || 1} {t('OVR Potential', 'GES-Potenzial')}
                            </span>
                            <div className="mt-0.5">
                              {p.isLoanedOut ? (
                                <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.04] px-1.5 py-0.5 rounded">
                                  {t('On Loan', 'Ausgeliehen')}
                                </span>
                              ) : isMature ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                    <span>{t('Graduate Ready', 'Graduierung bereit')}</span>
                                  </span>
                                  {queuedGain > 0 && (
                                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                      <span>⏳ {t(`Matures Next Season (+${queuedGain} OVR)`, `Reift nächste Saison (+${queuedGain} GES)`)}</span>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-normal">
                                  ⏳ {p.timer === 1 ? t('Matures next season', 'Reift nächste Saison') : t(`In ${p.timer} seasons`, `In ${p.timer} Saisons`)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* On Loan Status Banner */}
                        {p.isLoanedOut && (
                          <div className="bg-[#14151e] border border-white/[0.04] rounded-xl px-3 py-2 flex items-center justify-between text-xs text-zinc-300">
                            <span className="text-[11px] text-zinc-400">
                              {t('Developing off-site on affiliate loan · Returns next season with +1 OVR bonus', 'Sammelt Spielpraxis beim Partnerklub · Kehrt nächste Saison mit +1 GES-Bonus zurück')}
                            </span>
                            <span className="text-[10px] font-mono font-medium text-zinc-300 tabular-nums">
                              S{p.loanReturnSeason || (state.year + 1)}
                            </span>
                          </div>
                        )}

                        {/* Developing Prospect Protection Toggle */}
                        {!isMature && !p.isLoanedOut && (
                          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[11px]">
                            {p.isProtected ? (
                              <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-[10px] flex-wrap">
                                <i className="fas fa-shield-halved text-emerald-400 text-xs" />
                                <span>{t(`Protected (${defenseChance}% Shield)`, `Geschützt (${defenseChance}% Schutz)`)}</span>
                                {tier > 1 && defenseChance < baseDefenseChance && (
                                  <span className="text-[9px] text-zinc-500 font-normal tabular-nums">
                                    {t(`(T${tier} pressure: -${baseDefenseChance - defenseChance}%)`, `(L${tier}-Druck: -${baseDefenseChance - defenseChance}%)`)}
                                  </span>
                                )}
                              </div>
                            ) : academyLvl < 3 ? (
                              <span className="text-[10px] text-zinc-500 font-normal">
                                {t('Anti-poaching shield unlocks at Level 3', 'Abwerbungsschutz ab Stufe 3')}
                              </span>
                            ) : protectConfirmId === p.id ? (
                              <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProtectConfirmId(null);
                                  }}
                                  className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  {t('Cancel', 'Abbrechen')}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onProtectYouth?.(p.id);
                                    setProtectConfirmId(null);
                                  }}
                                  disabled={state.budget < -creditLimit + protectionCost}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium text-[10px] cursor-pointer tabular-nums"
                                >
                                  {t('Shield', 'Schützen')} (-{formatMoney(protectionCost)})
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProtectConfirmId(p.id);
                                }}
                                className="text-zinc-400 hover:text-white text-[10px] font-medium flex items-center gap-1 transition ml-auto cursor-pointer"
                              >
                                <i className="fas fa-shield-halved text-[10px]" />
                                <span>{t('Protect from poachers', 'Vor Abwerbung schützen')}</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Graduation Trilemma */}
                        {isMature && (
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.04]">
                            <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-0.5">
                              <span>{t('Graduation Choice', 'Graduierungs-Auswahl')}</span>
                              <span className="text-[9px] text-zinc-500 font-normal">Choose 1 of 3 pathways</span>
                            </div>

                            {/* Option 1: Sign to Senior Squad (Promotion) */}
                            {!isSquadFull ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const res = useGameStore.getState().pullYouthPlayer(p.id);
                                  if (res.success) {
                                    setScoutNotice({
                                      type: 'success',
                                      title: t('Promoted to Senior Squad', 'In Profikader befördert'),
                                      message: res.message
                                    });
                                  } else {
                                    setScoutNotice({
                                      type: 'rejection',
                                      title: t('Promotion Blocked', 'Beförderung nicht möglich'),
                                      message: res.message
                                    });
                                  }
                                }}
                                className="w-full bg-[#14151e] hover:bg-emerald-500/[0.05] text-zinc-200 border border-white/[0.04] hover:border-emerald-500/20 py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between"
                              >
                                <div className="flex items-center gap-1.5">
                                  <i className="fas fa-arrow-up-from-bracket text-emerald-400 text-xs" />
                                  <span>{t('1. Sign to Senior Squad', '1. In Profikader übernehmen')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[11px] font-normal tabular-nums">
                                  {instantGain !== 0 && (
                                    <span className="text-zinc-300">
                                      {instantGain > 0 ? `+${instantGain}` : instantGain} {t('Instant', 'Sofort')}
                                    </span>
                                  )}
                                  {queuedGain > 0 && (
                                    <span className="text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">
                                      ⏳ {t(`+${queuedGain} OVR Matures Next Season`, `+${queuedGain} GES Reift nächste Saison`)}
                                    </span>
                                  )}
                                  {instantGain === 0 && queuedGain === 0 && (
                                    <span className="text-zinc-500">+0 Team OVR</span>
                                  )}
                                </div>
                              </button>
                            ) : (
                              <div className="w-full bg-[#14151e] border border-white/[0.04] text-zinc-500 py-1 px-3 rounded-xl text-[10px]">
                                Senior roster full (22/22 players).
                              </div>
                            )}

                            {/* Option 2: Farm Loan (Affiliate Loan) */}
                            {!p.loanBonusEarned && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const res = useGameStore.getState().loanYouthProspect(p.id);
                                  if (res.success) {
                                    setScoutNotice({
                                      type: 'success',
                                      title: t('Farm Loan Finalized', 'Farm-Leihe vereinbart'),
                                      message: res.message
                                    });
                                  } else {
                                    setScoutNotice({
                                      type: 'rejection',
                                      title: t('Loan Not Available', 'Leihe nicht möglich'),
                                      message: res.message
                                    });
                                  }
                                }}
                                className="w-full bg-[#14151e] hover:bg-sky-500/[0.05] text-zinc-200 border border-white/[0.04] hover:border-sky-500/20 py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between"
                              >
                                <div className="flex items-center gap-1.5">
                                  <i className="fas fa-handshake-angle text-sky-400 text-xs" />
                                  <span>{t('2. Farm Loan (1 Season)', '2. Farm-Leihe (1 Saison)')}</span>
                                </div>
                                <span className="font-mono text-zinc-400 font-normal text-[10px] tabular-nums">
                                  +1 OVR on Return
                                </span>
                              </button>
                            )}

                            {/* Option 3: Release for Training Compensation (Cash Windfall) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const res = useGameStore.getState().sellYouthProspect(p.id);
                                if (res.success) {
                                  setScoutNotice({
                                    type: 'success',
                                    title: t('Training Compensation Realized', 'Ablöse erhalten'),
                                    message: res.message
                                  });
                                } else {
                                  setScoutNotice({
                                    type: 'rejection',
                                    title: t('Transfer Blocked', 'Transfer nicht möglich'),
                                    message: res.message
                                  });
                                }
                              }}
                              className="w-full bg-[#14151e] hover:bg-emerald-500/[0.05] text-zinc-200 border border-white/[0.04] hover:border-emerald-500/20 py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5">
                                <i className="fas fa-sack-dollar text-emerald-400 text-xs" />
                                <span>{t('3. Release for Compensation', '3. Gegen Ablöse freigeben')}</span>
                              </div>
                              <span className="font-mono text-emerald-400 font-medium text-[11px] tabular-nums">
                                +{formatMoney(fee)}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* Tab 2: National Championship */}
          {activeTab === 'championship' && (
            <div className="flex flex-col gap-3.5 shrink-0">
              {/* U19 Honors */}
              {(state.youthTitlesWon || 0) > 0 && (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl w-full shrink-0">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-trophy text-amber-400 text-xs" />
                    <span className="text-xs font-medium text-white">{t('U19 Honors', 'U19-Erfolge')}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium tabular-nums">
                    {state.youthTitlesWon} {t('Titles Won', 'Titel gewonnen')}
                  </span>
                </div>
              )}

              {/* U19 Championship Card */}
              <div className="bg-[#181924] border border-white/[0.04] hover:border-amber-500/20 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base shrink-0">
                      <i className="fas fa-trophy" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                        <span>{t('National U19 Championship', 'Nationale U19-Meisterschaft')}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full tabular-nums">
                          {state.year}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5 font-normal">
                        <span>{t('Cohort Rating:', 'Kaderstärke:')} <strong className="text-zinc-200 font-medium tabular-nums">{u19Rating} OVR</strong></span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-500">{t('Annual Tournament', 'Jährlich')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  {t(
                    'Compete through a knockout bracket against rival academies for silverware, prize money, and cohort progression. Higher Academy facility levels grant direct OVR competitive advantages in every round.',
                    'Kämpfe im K.o.-Turnier gegen rivalisierende Akademien um Trophäen, Preisgeld und Entwicklungsschübe. Höhere Akademie-Stufen gewähren direkte Stärkevorteile in jeder Runde.'
                  )}
                </p>

                {/* Championship Trigger Button or Cohort Requirement */}
                {!hasPlayedTournamentThisSeason ? (
                  activeProspects >= 6 ? (
                    <button
                      onClick={handleSimulateChampionship}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs sm:text-sm border border-white/[0.06] flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                    >
                      <i className="fas fa-play text-xs text-amber-400" />
                      <span>{t('Enter National U19 Championship', 'U19-Meisterschaft spielen')}</span>
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-[#14151e] border border-white/[0.04] flex flex-col items-center gap-1 text-center">
                      <div className="flex items-center gap-2 text-zinc-300 font-medium text-xs">
                        <i className="fas fa-lock text-xs text-zinc-400" />
                        <span>{t(`6-Prospect Cohort Required (${activeProspects}/6 enrolled)`, `Vollständiger 6er-Kader erforderlich (${activeProspects}/6)`)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-normal">
                        {t(
                          'Entry unlocks once your academy holds at least 6 prospects.',
                          'Die Teilnahme wird freigeschaltet, sobald deine Akademie mindestens 6 Talente umfasst.'
                        )}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-[#14151e] text-zinc-400 text-xs font-normal border border-white/[0.04] flex items-center justify-center gap-2">
                    <i className="fas fa-check-circle text-emerald-400 text-xs" />
                    <span>{t(`Concluded for Season ${state.year} · Returns Next Season`, `Für Saison ${state.year} beendet · Nächste Saison wieder spielbar`)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] flex flex-col gap-2 shrink-0">

          {/* Scouting Actions */}
          {isAcademyFull ? (
            <div className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-[#181924] text-zinc-400 border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-300">
                <i className="fas fa-warehouse text-xs text-zinc-400" />
                <span>{t(`Academy at Full Capacity (${activeProspects}/${maxSlots})`, `Akademie voll ausgelastet (${activeProspects}/${maxSlots})`)}</span>
              </div>
              <span className="text-[11px] text-zinc-400">
                {academyLvl < 5 ? t(`Upgrade to Lvl ${academyLvl + 1}`, `Ausbau auf Stufe ${academyLvl + 1}`) : t('Max Level', 'Höchste Stufe')}
              </span>
            </div>
          ) : !canAfford ? (
            <button
              onClick={handleScoutSchoolTrialist}
              disabled={isScouting || isScoutingRef.current || isTrialistLimitReached}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs transition active:scale-[0.99] flex items-center justify-between cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.04] disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <i className="fas fa-seedling text-xs text-zinc-400" />
                <span>{isTrialistLimitReached ? t('Trialist Quota Used (1/1 this season)', 'Schultalent-Kontingent belegt (1/1)') : t('Scout Free School Trialist', 'Freies Schultalent scouten')}</span>
              </div>
              <span className="text-xs text-zinc-300 font-medium tabular-nums">
                {isTrialistLimitReached ? '1/1' : `0 € (${activeProspects}/${maxSlots})`}
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleScoutNewTalent}
                  disabled={isScouting || isScoutingRef.current || isScoutingLimitReached}
                  className={`flex-1 py-2.5 px-3.5 rounded-xl font-medium text-xs transition active:scale-[0.99] flex items-center justify-between cursor-pointer border ${
                    isScoutingLimitReached
                      ? 'bg-white/[0.02] text-zinc-500 border-white/[0.04] cursor-not-allowed opacity-60'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.06] disabled:opacity-50'
                  }`}
                  title={isScoutingLimitReached ? t(`Annual scouting network limit reached (${scoutsUsedThisSeason}/${maxScoutingThisSeason})`, `Jährliches Scouting-Limit erreicht (${scoutsUsedThisSeason}/${maxScoutingThisSeason})`) : undefined}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <i className="fas fa-magnifying-glass text-xs text-zinc-400" />
                    <span className="truncate">
                      {isScoutingLimitReached
                        ? t(`Cap (${scoutsUsedThisSeason}/${maxScoutingThisSeason})`, `Limit (${scoutsUsedThisSeason}/${maxScoutingThisSeason})`)
                        : t('Scout Domestic', 'Inland scouten')}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-300 font-mono font-medium tabular-nums shrink-0">
                    {isScoutingLimitReached ? '' : `-${formatMoney(smallAcquisitionFee)}`}
                  </span>
                </button>

                {academyLvl >= 4 && (
                  <button
                    onClick={handleScoutForeignImport}
                    disabled={isScouting || isScoutingRef.current || isScoutingLimitReached}
                    className={`flex-1 py-2.5 px-3.5 rounded-xl font-medium text-xs transition active:scale-[0.99] flex items-center justify-between cursor-pointer border ${
                      isScoutingLimitReached
                        ? 'bg-white/[0.02] text-zinc-500 border-white/[0.04] cursor-not-allowed opacity-60'
                        : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border-purple-500/30 shadow-sm disabled:opacity-50'
                    }`}
                    title={t('Scout non-domestic wonderkid (Denmark, France, Spain, etc.)', 'Internationales Talent scouten (Dänemark, Frankreich, Spanien etc.)')}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs">🌍</span>
                      <span className="truncate">{t('Foreign Import', 'Auslands-Talent')}</span>
                    </div>
                    <span className="text-[11px] text-purple-300 font-mono font-medium tabular-nums shrink-0">
                      {isScoutingLimitReached ? '' : `-${formatMoney(smallAcquisitionFee)}`}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleScoutSchoolTrialist}
                  disabled={isScouting || isScoutingRef.current || isTrialistLimitReached}
                  className="py-2.5 px-3 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title={isTrialistLimitReached ? "1 free school trialist quota reached for this season" : "Free trialist recruitment"}
                >
                  <i className="fas fa-seedling text-xs text-zinc-400" />
                  <span>{isTrialistLimitReached ? '1/1' : '0 €'}</span>
                </button>
              </div>

              {academyLvl < 4 && (
                <div className="text-[10px] text-zinc-500 text-center font-normal">
                  <span>{t('Continental Scouting (Foreign Imports) unlocks at Academy Level 4', 'Auslands-Scouting (internationale Talente) schaltet sich auf Stufe 4 frei')}</span>
                </div>
              )}
            </div>
          )}

          <button 
            aria-label="Close modal" 
            onClick={onClose} 
            className="w-full py-2 rounded-xl text-xs font-normal text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
          >
            {t('Close', 'Schließen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
