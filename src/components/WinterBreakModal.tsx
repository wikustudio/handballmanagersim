import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { t } from '../data/translations';
import { Language, GameState } from '../types';
import { useGameStore } from '../store/useGameStore';
import { getLeagueSize } from '../engine/engine';
import { getLeagueInfo, getDynamicLeagueAvgOvr, getDomesticCupInfo, isReserveClub, getMaxTier, getLeagueScaledVal, formatMoney } from '../data/gameConstants';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { getBroadcastingPackage } from '../data/broadcastingPackages';
import { isAnyModActive } from '../utils/modManager';
import { BroadcastLogo } from './BroadcastLogo';
import { CountUp } from './CountUp';
import { ClubLogo } from './ClubLogo';
import { useModalScrollLock } from '../utils/modalUtils';

interface WinterBreakModalProps {
  state: GameState;
  lang: Language;
  cupQualifiedForSf?: boolean | null;
  euroQualifiedForSf?: boolean | null;
  isSubModalOpen?: boolean;
  onContinue: () => void;
  onReturnToDashboard?: () => void;
  onMakeTransfers: () => void;
  onTeamBonding: () => void;
  onRevampSystem: () => void;
}

interface ActiveCompetition {
  id: string;
  name: string;
  icon: string;
  logo?: string;
  status: string;
  subtext: string;
  accentColor: string;
  isEliminated?: boolean;
}

export const WinterBreakModal: React.FC<WinterBreakModalProps> = ({
  state,
  lang,
  cupQualifiedForSf,
  euroQualifiedForSf,
  isSubModalOpen = false,
  onContinue,
  onMakeTransfers,
  onTeamBonding,
  onRevampSystem
}) => {
  useModalScrollLock(true);
  const [tournamentName, setTournamentName] = useState('');
  const [ovrChange, setOvrChange] = useState(0);
  const [playersInvolved, setPlayersInvolved] = useState(0);
  const [tournamentStory, setTournamentStory] = useState('');

  const [midSeasonPos, setMidSeasonPos] = useState(1);
  const [numLeagueTeams, setNumLeagueTeams] = useState(18);
  const [leagueAvg, setLeagueAvg] = useState(70);
  const [statusText, setStatusText] = useState('');
  const [statusTone, setStatusTone] = useState<'emerald' | 'sky' | 'amber' | 'rose'>('sky');

  const country = state.club.country || 'GER';
  const tier = state.club.tier || 1;
  const isReserve = isReserveClub(state.club.name);

  // Resolve tier-aware broadcast partner (Media Sponsor)
  // Lower tiers (tier >= 3) strictly use local/regional broadcasters and NEVER DYN or DAZN
  const [modTick, setModTick] = useState(0);
  useEffect(() => {
    const onModChange = () => setModTick(prev => prev + 1);
    window.addEventListener('mod-state-change', onModChange);
    return () => window.removeEventListener('mod-state-change', onModChange);
  }, []);

  const isModActive = useMemo(() => isAnyModActive(), [modTick]);
  const broadcastPackage = useMemo(() => {
    return getBroadcastingPackage(country, false, {
      type: 'winter_break',
      tier,
      year: state.year || 2024,
      clubName: state.club.name,
      isModActive,
    });
  }, [country, tier, state.year, state.club.name, isModActive]);

  const initializedYearRef = useRef<number | null>(null);

  useEffect(() => {
    const numTeams = getLeagueSize(tier, country, state.club.id, tier, country);
    setNumLeagueTeams(numTeams);
    const computedLeagueAvg = Math.round(getDynamicLeagueAvgOvr(state, tier, country));
    setLeagueAvg(computedLeagueAvg);
    let ovrDiff = state.club.baseOvr - computedLeagueAvg;

    const morale = state.club.morale ?? 100;
    if (morale <= 30) ovrDiff -= 3;
    else if (morale <= 50) ovrDiff -= 1;
    else if (morale >= 90) ovrDiff += 1;

    const diffMultiplier = (numTeams / 18) * 1.2;
    const seed = ((state.year || 2026) * 131 + Number(state.club.id || 1) * 37) % 997;
    const deterministicOffset = ((seed / 997) * 2) - 1;
    const rawPos = (numTeams / 2 + 0.5) - (ovrDiff * diffMultiplier) + deterministicOffset;
    const approxPos = Math.max(1, Math.min(numTeams, Math.round(rawPos)));

    setMidSeasonPos(approxPos);

    const targetPos = state.boardTargetPos || Math.floor(numTeams / 2);
    const diff = targetPos - approxPos;
    const maxTier = getMaxTier(state.club.country || 'GER');

    if (approxPos === 1) {
      setStatusText(t(lang, '1st Place Leader', 'Tabellenführer'));
      setStatusTone('emerald');
    } else if (approxPos >= numTeams - 2 && tier < maxTier) {
      setStatusText(t(lang, 'Relegation Zone', 'Abstiegsgefahr'));
      setStatusTone('rose');
    } else if (approxPos >= numTeams - 2 && tier >= maxTier) {
      setStatusText(t(lang, 'Bottom Zone', 'Tabellenkeller'));
      setStatusTone('rose');
    } else if (diff >= 2) {
      setStatusText(t(lang, 'Ahead of Target', 'Über dem Soll'));
      setStatusTone('emerald');
    } else if (diff <= -3) {
      setStatusText(t(lang, 'Behind Target', 'Unter dem Soll'));
      setStatusTone('amber');
    } else {
      setStatusText(t(lang, 'On Target', 'Im Soll'));
      setStatusTone('sky');
    }
  }, [state.year, tier, country, state.club.id, state.club.baseOvr, state.club.morale, state.boardTargetPos, lang]);

  useEffect(() => {
    if (initializedYearRef.current === state.year) {
      return;
    }
    initializedYearRef.current = state.year;

    const latestStore = useGameStore.getState() as any;
    if (latestStore.winterBreakTournamentYear === state.year) {
      setTournamentName(latestStore.winterBreakTournamentName || '');
      setPlayersInvolved(latestStore.winterBreakPlayersInvolved || 0);
      setOvrChange(latestStore.winterBreakOvrChange || 0);
      setTournamentStory(latestStore.winterBreakTournamentStory || '');
      return;
    }

    const isWorldCupYear = state.year % 4 === 2;
    const isEuroYear = state.year % 4 === 0;

    let tName = t(lang, 'January International Window', 'Januar-Länderspielpause');
    if (isWorldCupYear) tName = t(lang, 'IHF World Championship', 'IHF-Weltmeisterschaft');
    else if (isEuroYear) tName = t(lang, 'EHF European Championship', 'EHF-Europameisterschaft');

    setTournamentName(tName);

    const currentBaseOvr = latestStore.club?.baseOvr ?? state.club.baseOvr;
    let numPlayers = 0;
    let change = 0;
    let story = '';

    if (currentBaseOvr >= 74) {
      numPlayers = Math.max(1, Math.floor((currentBaseOvr - 68) / 4) + Math.floor(Math.random() * 3));
      setPlayersInvolved(numPlayers);

      const performance = Math.random();
      if (performance < 0.2) {
        change = -1;
        story = t(
          lang,
          `${numPlayers} squad players featured heavily at the ${tName}, returning with minor fatigue and knocks.`,
          `${numPlayers} Spieler standen bei der ${tName} im Dauereinsatz und kehrten überspielt zurück.`
        );
      } else if (performance < 0.6) {
        change = 0;
        story = t(
          lang,
          `${numPlayers} internationals represented their countries at the ${tName} and returned at full match fitness.`,
          `${numPlayers} Nationalspieler vertraten ihre Länder bei der ${tName} und kehrten topfit zurück.`
        );
      } else if (performance < 0.9) {
        change = 1;
        story = t(
          lang,
          `Strong international showing! Your ${numPlayers} call-ups gained valuable tournament momentum at the ${tName}.`,
          `Starkes Turnier! Deine ${numPlayers} Nationalspieler kehrten mit viel Selbstvertrauen von der ${tName} zurück.`
        );
      } else {
        change = 2;
        story = t(
          lang,
          `Breakout tournament! Your ${numPlayers} internationals starred at the ${tName} and returned in peak form.`,
          `Überragendes Turnier! Deine ${numPlayers} Nationalspieler glänzten bei der ${tName} in absoluter Topform.`
        );
      }
      setOvrChange(change);
      setTournamentStory(story);
    } else {
      setPlayersInvolved(0);
      setOvrChange(0);
      story = t(
        lang,
        `No players called up for the ${tName}. The entire squad stayed together for a focused winter training block.`,
        `Keine Abstellungen für die ${tName}. Der gesamte Kader absolvierte eine intensive Wintervorbereitung im Verein.`
      );
      setTournamentStory(story);
    }

    const freshStore = useGameStore.getState() as any;
    const oldOvr = freshStore.club?.baseOvr ?? currentBaseOvr;
    const newOvr = Math.min(100, Math.max(30, oldOvr + change));
    const actualDelta = newOvr - oldOvr;
    const updatedWorldClubs = { ...(freshStore.worldClubs || {}) };
    if (freshStore.club?.id && updatedWorldClubs[freshStore.club.id]) {
      updatedWorldClubs[freshStore.club.id] = { ...updatedWorldClubs[freshStore.club.id], baseOvr: newOvr };
    }

    freshStore.updateState({
      winterBreakTournamentYear: state.year,
      winterBreakTournamentName: tName,
      winterBreakPlayersInvolved: numPlayers,
      winterBreakOvrChange: actualDelta,
      winterBreakTournamentStory: story,
      ...(actualDelta !== 0 ? {
        club: { ...freshStore.club, baseOvr: newOvr },
        worldClubs: updatedWorldClubs,
        startOfSeasonOvr: typeof freshStore.startOfSeasonOvr === 'number' ? freshStore.startOfSeasonOvr : oldOvr,
        lastOvr: typeof freshStore.lastOvr === 'number' ? freshStore.lastOvr : oldOvr,
        ...(actualDelta > 0
          ? { eventOvrGainThisSeason: (freshStore.eventOvrGainThisSeason || 0) + actualDelta }
          : { signingFlopLossThisSeason: (freshStore.signingFlopLossThisSeason || 0) + Math.abs(actualDelta) }),
        ovrHistory: [
          {
            id: Math.random().toString(36).substring(7),
            season: state.year,
            change: actualDelta,
            reason: `Winter Break: ${tName}`,
            reasonDe: `Winterpause: ${tName}`
          },
          ...(freshStore.ovrHistory || [])
        ].slice(0, 30)
      } : {})
    });
  }, [state.year, tier, country, state.club.id, state.boardTargetPos, lang]);

  const targetPos = state.boardTargetPos || Math.floor(numLeagueTeams / 2);
  const ovrVsAvg = (state.club.baseOvr || 60) - leagueAvg;

  // Build active competitions
  const activeCompetitions: ActiveCompetition[] = [];

  const leagueInfo = getLeagueInfo(tier, country);
  activeCompetitions.push({
    id: 'league',
    name: leagueInfo.name,
    icon: 'fa-trophy',
    logo: leagueInfo.logo,
    status: `#${midSeasonPos} of ${numLeagueTeams}`,
    subtext: `${t(lang, 'Target', 'Ziel')}: Top ${targetPos}`,
    accentColor: 'text-sky-300 bg-sky-400/15 border-sky-300/30',
  });

  const cupRuns = state.cupRunResults || [];
  const domesticExit = cupRuns.find(
    r => r.year === state.year && (r.id === 'nat_cup' || r.id === 'reg_cup') && !r.won
  );
  const isDomesticEliminated = cupQualifiedForSf === false || (cupQualifiedForSf !== true && Boolean(domesticExit));

  if (!isReserve) {
    const lastHistWb = state.history.length > 0 ? state.history[state.history.length - 1] : null;
    const isSameClubWb = Boolean(lastHistWb && (!lastHistWb.clubName || lastHistWb.clubName === state.club.name));
    const wonDfbCupLastYear = isSameClubWb && (lastHistWb.trophiesThisYear?.dfb || 0) === 1;
    const wonRegCupLastYear = tier > 1 && isSameClubWb && (lastHistWb.trophiesThisYear?.reg || 0) === 1;
    const isInNationalCup = tier <= 2 || wonRegCupLastYear || wonDfbCupLastYear;

    if (isInNationalCup) {
      const cupInfo = getDomesticCupInfo(country, 1);
      activeCompetitions.push({
        id: 'national_cup',
        name: cupInfo.name,
        icon: 'fa-shield-halved',
        logo: cupInfo.logo,
        status: isDomesticEliminated ? t(lang, 'Knocked Out (QF)', 'VF Aus') : (cupQualifiedForSf === true ? 'Final Four' : t(lang, 'Semi-Final', 'Halbfinale')),
        subtext: isDomesticEliminated ? t(lang, 'Eliminated', 'Ausgeschieden') : t(lang, 'In Contention', 'Im Pokalrennen'),
        accentColor: isDomesticEliminated ? 'text-rose-300 bg-rose-400/15 border-rose-300/25' : 'text-amber-300 bg-amber-400/15 border-amber-300/30',
        isEliminated: isDomesticEliminated,
      });
    } else {
      const regName = t(lang, 'Regional Cup', 'Regional Cup');
      activeCompetitions.push({
        id: 'regional_cup',
        name: regName,
        icon: 'fa-award',
        status: isDomesticEliminated ? t(lang, 'Knocked Out', 'Ausgeschieden') : t(lang, 'Semi-Final', 'Halbfinale'),
        subtext: isDomesticEliminated ? t(lang, 'Eliminated', 'Ausgeschieden') : t(lang, 'Cup Ticket Race', 'Pokal-Ticket'),
        accentColor: isDomesticEliminated ? 'text-rose-300 bg-rose-400/15 border-rose-300/25' : 'text-amber-300 bg-amber-400/15 border-amber-300/30',
        isEliminated: isDomesticEliminated,
      });
    }
  }

  if (state.euroStatus && !isReserve) {
    const euroNames = getContinentalCupNames(country);
    const euroKey = state.euroStatus.toUpperCase();
    const euroExit = cupRuns.find(
      r => r.year === state.year && r.id === 'euro_cup' && !r.won
    );
    const isEuroEliminated = euroQualifiedForSf === false || (euroQualifiedForSf !== true && Boolean(euroExit));
    const euroCupName = euroKey === 'CL' ? euroNames.cl : euroKey === 'EL' ? euroNames.el : euroNames.ecl;

    activeCompetitions.push({
      id: 'euro',
      name: euroCupName,
      icon: 'fa-star',
      status: isEuroEliminated
        ? t(lang, 'Knocked Out (QF)', 'VF Aus')
        : (euroQualifiedForSf === true ? 'Final Four' : t(lang, 'Spring Knockouts', 'K.o.-Phase')),
      subtext: isEuroEliminated ? t(lang, 'Eliminated', 'Ausgeschieden') : t(lang, 'European Stage', 'Europapokal'),
      accentColor: isEuroEliminated ? 'text-rose-300 bg-rose-400/15 border-rose-300/25' : 'text-cyan-300 bg-cyan-400/15 border-cyan-300/30',
      isEliminated: isEuroEliminated,
    });
  }

  const bondingCost = Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country));
  const isBondingLimitReached = (state.teamBondingThisSeason || 0) >= 1;
  const currentMorale = state.club.morale ?? 100;
  const hasTacticalGenius = (state.managerSkills || []).includes('tactical_mastermind');
  const currentTactic = state.tactic || 'Balanced 6-0';

  const seasonOvrLogs = (state.ovrHistory || []).filter(h => h.season === state.year);
  const seasonOvrDelta = seasonOvrLogs.length > 0
    ? seasonOvrLogs.reduce((sum, h) => sum + h.change, 0)
    : (typeof state.startOfSeasonOvr === 'number' ? state.club.baseOvr - state.startOfSeasonOvr : 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubModalOpen) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space' || e.key === 'Escape') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue, isSubModalOpen]);

  const toneBadgeClasses = {
    emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    sky: 'bg-sky-400/15 text-sky-200 border-sky-300/30',
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    rose: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
  }[statusTone];

  const standingPct = Math.max(8, Math.min(100, Math.round(((numLeagueTeams - midSeasonPos + 1) / Math.max(1, numLeagueTeams)) * 100)));
  const strengthPct = Math.max(12, Math.min(100, Math.round(50 + ovrVsAvg * 5)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-5 z-[100] backdrop-blur-2xl bg-black/75"
    >
      <motion.div
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-[620px] bg-gradient-to-b from-[#141824]/95 via-[#10131c]/96 to-[#0b0d14]/98 backdrop-blur-3xl rounded-3xl border border-white/[0.12] shadow-[0_32px_100px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] overflow-hidden flex flex-col max-h-[92vh] relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Frosted Ambient Lighting */}
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[420px] h-40 bg-sky-400/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Media Sponsor / Broadcast Partner Suite Bar */}
        <div className="w-full px-5 py-2.5 bg-white/[0.03] border-b border-white/[0.08] backdrop-blur-2xl flex items-center justify-between gap-3 relative z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            </span>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 truncate">
              {t(lang, 'Winter Break Summary by', 'Winterpausen-Bilanz von')}
            </span>
          </div>

          <div className="flex items-center shrink-0">
            <BroadcastLogo packageOrKey={broadcastPackage} size="xs" isModActive={isModActive} />
          </div>
        </div>

        {/* Hero Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.06] text-sky-300 flex items-center justify-center text-base border border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] shrink-0">
              <i className="fas fa-snowflake" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 leading-none">
                  {t(lang, `SEASON ${state.year} · MID-SEASON REVIEW`, `SAISON ${state.year} · HALBZEIT-BILANZ`)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight truncate">
                {t(lang, 'Winter Break', 'Winterpause')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] px-3 py-1.5 rounded-2xl shrink-0">
            <ClubLogo
              name={state.club.name}
              logo={state.club.logo}
              fallbackLogo={state.club.fallbackLogo}
              color={state.club.color}
              className="w-5 h-5 object-contain shrink-0"
              fallbackClassName="w-5 h-5 text-[8px] rounded-md flex items-center justify-center font-bold text-white shrink-0"
            />
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-white truncate max-w-[130px] leading-tight">
                {state.club.name}
              </span>
              <span className="text-[10px] text-zinc-400 leading-tight truncate max-w-[130px]">
                {leagueInfo.name}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 min-h-0 relative z-10">
          {/* 1. Performance & League Context Bento (3 Frosted Columns) */}
          <div className="bg-white/[0.035] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Column 1: Standing out of Total Teams + Board Target */}
            <div className="flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  {t(lang, 'LEAGUE STANDING', 'TABELLENPLATZ')}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${toneBadgeClasses}`}>
                  {statusText}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-2xl font-bold tracking-tight tabular-nums text-white">
                  #{midSeasonPos}
                </span>
                <span className="text-xs font-medium text-zinc-400 tabular-nums">
                  / {numLeagueTeams} {t(lang, 'teams', 'Teams')}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    statusTone === 'emerald' ? 'bg-emerald-400' : statusTone === 'rose' ? 'bg-rose-400' : statusTone === 'amber' ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${standingPct}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center justify-between tabular-nums">
                <span>{t(lang, 'Board Goal:', 'Vorstandsziel:')}</span>
                <strong className="text-white font-semibold">Top {targetPos}</strong>
              </div>
            </div>

            {/* Column 2: Squad OVR vs. League Average */}
            <div className="flex flex-col justify-between sm:border-l sm:border-white/[0.08] sm:pl-4">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  {t(lang, 'SQUAD STRENGTH', 'KADERSTÄRKE')}
                </span>
                {seasonOvrDelta !== 0 ? (
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md border tabular-nums ${
                    seasonOvrDelta > 0
                      ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30'
                      : 'bg-rose-400/15 text-rose-300 border-rose-400/30'
                  }`}>
                    {seasonOvrDelta > 0 ? `+${seasonOvrDelta}` : seasonOvrDelta} {t(lang, 'Season', 'Saison')}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                    ±0 {t(lang, 'Season', 'Saison')}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-bold tracking-tight tabular-nums text-white">
                  <CountUp value={state.club.baseOvr || 60} duration={400} />
                </span>
                <span className="text-xs font-medium text-zinc-400">OVR</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    ovrVsAvg > 0 ? 'bg-emerald-400' : ovrVsAvg < 0 ? 'bg-rose-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center justify-between tabular-nums">
                <span>{t(lang, 'League Avg:', 'Liga-Ø:')} <strong className="text-white font-mono">{leagueAvg}</strong></span>
                <span className={`font-mono font-semibold ${ovrVsAvg > 0 ? 'text-emerald-300' : ovrVsAvg < 0 ? 'text-rose-300' : 'text-zinc-400'}`}>
                  {ovrVsAvg > 0 ? `+${ovrVsAvg} vs Avg` : `${ovrVsAvg} vs Avg`}
                </span>
              </div>
            </div>

            {/* Column 3: Squad Morale & Atmosphere */}
            <div className="flex flex-col justify-between sm:border-l sm:border-white/[0.08] sm:pl-4">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  {t(lang, 'SQUAD MORALE', 'TEAM-MORAL')}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                  currentMorale >= 75
                    ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30'
                    : currentMorale >= 45
                    ? 'bg-white/[0.06] text-zinc-200 border-white/[0.12]'
                    : 'bg-rose-400/15 text-rose-300 border-rose-400/30'
                }`}>
                  {currentMorale >= 75 ? t(lang, 'Superb', 'Top') : currentMorale >= 45 ? t(lang, 'Steady', 'Stabil') : t(lang, 'Low', 'Niedrig')}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className={`text-2xl font-bold tracking-tight tabular-nums ${
                  currentMorale >= 75 ? 'text-emerald-300' : currentMorale >= 45 ? 'text-white' : 'text-rose-300'
                }`}>
                  {currentMorale}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentMorale >= 75 ? 'bg-emerald-400' : currentMorale >= 45 ? 'bg-sky-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${Math.max(5, Math.min(100, currentMorale))}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center justify-between truncate">
                <span>{t(lang, 'System:', 'System:')}</span>
                <strong className="text-white font-medium truncate ml-1">{currentTactic}</strong>
              </div>
            </div>
          </div>

          {/* 2. Active Competitions Strip */}
          <div className={`grid gap-2.5 ${activeCompetitions.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : activeCompetitions.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {activeCompetitions.map((comp) => (
              <div
                key={comp.id}
                className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden ${
                  comp.isEliminated ? 'opacity-60' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden shadow-sm ${comp.accentColor}`}>
                  {comp.logo ? (
                    <img
                      src={comp.logo}
                      alt={comp.name}
                      className="w-5 h-5 object-contain"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <i className={`fas ${comp.icon} text-xs`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {comp.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] mt-0.5 truncate">
                    <span className={`font-semibold tabular-nums ${comp.isEliminated ? 'text-rose-300' : 'text-zinc-200'}`}>
                      {comp.status}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400 truncate">{comp.subtext}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Broadcast Studio Report: International Window & Winter Break Impact */}
          <div className="bg-white/[0.035] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] rounded-2xl p-4 flex flex-col gap-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sky-300 flex items-center justify-center text-xs shrink-0">
                  <i className={`fas ${playersInvolved > 0 ? 'fa-earth-europe' : 'fa-dumbbell'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                      {t(lang, 'WINTER BREAK REPORT', 'WINTERPAUSEN-ANALYSE')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {tournamentName || t(lang, 'Winter Break Report', 'Winterpausen-Bericht')}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-300 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md tabular-nums">
                      {playersInvolved > 0
                        ? `${playersInvolved} ${t(lang, 'National Team Players', 'Nationalspieler')}`
                        : t(lang, '0 Call-Ups · Full Squad at Club', '0 Abstellungen · Kompletter Kader')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {ovrChange !== 0 ? (
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border tabular-nums shadow-sm ${
                    ovrChange > 0
                      ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/35'
                      : 'bg-rose-400/20 text-rose-300 border-rose-400/35'
                  }`}>
                    {ovrChange > 0 ? `+${ovrChange}` : ovrChange} OVR
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium text-zinc-200 bg-white/[0.05] border border-white/[0.1] tabular-nums">
                    ±0 OVR · 100% Fit
                  </span>
                )}
              </div>
            </div>

            {tournamentStory && (
              <p className="text-xs text-zinc-300 leading-relaxed pl-12">
                {tournamentStory}
              </p>
            )}
          </div>

          {/* 4. Winter Preparation Actions (3-Column Frosted Cards) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {t(lang, 'WINTER PREPARATIONS', 'WINTER-VORBEREITUNG')}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                {t(lang, 'Budget:', 'Budget:')} <strong className="text-zinc-200">{formatMoney(state.budget)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Transfers */}
              <button
                type="button"
                onClick={onMakeTransfers}
                className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-left transition flex sm:flex-col items-center sm:items-start justify-between gap-2.5 cursor-pointer active:scale-[0.98] group"
              >
                <div className="flex items-center gap-2.5 sm:w-full sm:justify-between">
                  <div className="w-9 h-9 rounded-xl bg-sky-400/15 text-sky-300 border border-sky-400/25 flex items-center justify-center shrink-0">
                    <i className="fas fa-arrows-rotate text-xs" />
                  </div>
                  <span className="font-semibold text-white text-xs sm:text-sm sm:hidden group-hover:text-sky-200 transition-colors">
                    {t(lang, 'Transfers', 'Transfers')}
                  </span>
                </div>
                <div className="text-right sm:text-left">
                  <div className="hidden sm:block font-semibold text-white text-sm group-hover:text-sky-200 transition-colors">
                    {t(lang, 'Transfers', 'Transfers')}
                  </div>
                  <div className="text-[11px] font-mono text-sky-300 tabular-nums mt-0.5">
                    {formatMoney(state.budget)}
                  </div>
                </div>
              </button>

              {/* Option 2: Training Camp */}
              <button
                type="button"
                disabled={isBondingLimitReached}
                onClick={() => {
                  if (!isBondingLimitReached) onTeamBonding();
                }}
                className={`p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-left transition flex sm:flex-col items-center sm:items-start justify-between gap-2.5 ${
                  isBondingLimitReached
                    ? 'opacity-50 border-white/[0.06] cursor-not-allowed'
                    : 'hover:bg-white/[0.07] border-white/[0.08] hover:border-amber-300/35 cursor-pointer active:scale-[0.98] group'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:w-full sm:justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/25 flex items-center justify-center shrink-0">
                    <i className="fas fa-campground text-xs" />
                  </div>
                  <span className="font-semibold text-white text-xs sm:text-sm sm:hidden group-hover:text-amber-200 transition-colors">
                    {t(lang, 'Training Camp', 'Trainingslager')}
                  </span>
                </div>
                <div className="text-right sm:text-left">
                  <div className="hidden sm:block font-semibold text-white text-sm group-hover:text-amber-200 transition-colors">
                    {t(lang, 'Training Camp', 'Trainingslager')}
                  </div>
                  <div className="text-[11px] font-mono text-amber-300 tabular-nums mt-0.5">
                    {isBondingLimitReached ? t(lang, 'Completed', 'Absolviert') : `+30% · -${formatMoney(bondingCost)}`}
                  </div>
                </div>
              </button>

              {/* Option 3: Tactics */}
              <button
                type="button"
                onClick={onRevampSystem}
                className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] hover:border-cyan-300/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-left transition flex sm:flex-col items-center sm:items-start justify-between gap-2.5 cursor-pointer active:scale-[0.98] group"
              >
                <div className="flex items-center gap-2.5 sm:w-full sm:justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/25 flex items-center justify-center shrink-0">
                    <i className="fas fa-chess-board text-xs" />
                  </div>
                  <span className="font-semibold text-white text-xs sm:text-sm sm:hidden group-hover:text-cyan-200 transition-colors">
                    {t(lang, 'Tactics', 'Taktik')}
                  </span>
                </div>
                <div className="text-right sm:text-left min-w-0">
                  <div className="hidden sm:block font-semibold text-white text-sm group-hover:text-cyan-200 transition-colors">
                    {t(lang, 'Tactics', 'Taktik')}
                  </div>
                  <div className="text-[11px] text-cyan-200 truncate mt-0.5">
                    {currentTactic} {hasTacticalGenius ? '(Free)' : '(5 MP)'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Single Primary Action Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/40 backdrop-blur-2xl shrink-0 relative z-10">
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-[0.99] cursor-pointer shadow-[0_8px_24px_rgba(14,165,233,0.25),inset_0_1px_0_rgba(255,255,255,0.22)] border border-sky-400/30 flex items-center justify-center gap-2 group"
          >
            <span>{t(lang, 'Start Second Half of Season', 'Rückrunde starten')}</span>
            <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
