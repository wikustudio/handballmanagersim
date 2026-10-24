import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { t } from '../data/translations';
import { Language, GameState } from '../types';
import { useGameStore } from '../store/useGameStore';
import { getLeagueSize } from '../engine/engine';
import { ALL_CLUBS } from '../data/clubsData';
import { getLeagueInfo, getDynamicLeagueAvgOvr, getDomesticCupInfo, isReserveClub, getMaxTier, getLeagueScaledVal, formatMoney, getDynamicSponsorPitchTerms } from '../data/gameConstants';
import { getContinentalCupNames } from '../utils/regionHelpers';
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
  category: string;
  badge: string;
  badgeColor: string;
  icon: string;
  logo?: string;
  status: string;
  detail: string;
  target?: string;
  isEliminated?: boolean;
}

export const WinterBreakModal: React.FC<WinterBreakModalProps> = ({
  state,
  lang,
  cupQualifiedForSf,
  euroQualifiedForSf,
  isSubModalOpen = false,
  onContinue,
  onReturnToDashboard,
  onMakeTransfers,
  onTeamBonding,
  onRevampSystem
}) => {
  useModalScrollLock(true);
  const [tournamentName, setTournamentName] = useState('');
  const [ovrChange, setOvrChange] = useState(0);
  const [playersInvolved, setPlayersInvolved] = useState(0);
  const [tournamentStory, setTournamentStory] = useState('');
  const [isStoryDismissed, setIsStoryDismissed] = useState(false);
  
  const [midSeasonPos, setMidSeasonPos] = useState(1);
  const [numLeagueTeams, setNumLeagueTeams] = useState(18);
  const [statusText, setStatusText] = useState('');
  const [statusColor, setStatusColor] = useState('text-neutral-300');

  const country = state.club.country || 'GER';
  const tier = state.club.tier || 1;
  const isReserve = isReserveClub(state.club.name);

  const initializedYearRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Calculate projected mid-season standing (deterministic per season, reactive to OVR/morale changes)
    const numTeams = getLeagueSize(tier, country, state.club.id, tier, country);
    setNumLeagueTeams(numTeams);
    const leagueAvgOvr = getDynamicLeagueAvgOvr(state, tier, country);
    let ovrDiff = state.club.baseOvr - leagueAvgOvr;
    
    // Add morale influence
    const morale = state.club.morale ?? 100;
    if (morale <= 30) ovrDiff -= 3;
    else if (morale <= 50) ovrDiff -= 1;
    else if (morale >= 90) ovrDiff += 1;
    
    const diffMultiplier = (numTeams / 18) * 1.2;
    const seed = ((state.year || 2026) * 131 + Number(state.club.id || 1) * 37) % 997;
    const deterministicOffset = ((seed / 997) * 2) - 1; // [-1, 1]
    const rawPos = (numTeams / 2 + 0.5) - (ovrDiff * diffMultiplier) + deterministicOffset; 
    const approxPos = Math.max(1, Math.min(numTeams, Math.round(rawPos)));
    
    setMidSeasonPos(approxPos);
    
    // Determine risk/advantage
    const targetPos = state.boardTargetPos || Math.floor(numTeams / 2);
    const diff = targetPos - approxPos;
    
    const maxTier = getMaxTier(state.club.country || 'GER');
    if (approxPos === 1) {
       setStatusText(t(lang, 'Title Race Leader', 'Tabellenführung'));
       setStatusColor('text-emerald-400');
    } else if (approxPos >= numTeams - 2 && tier < maxTier) {
       setStatusText(t(lang, 'Relegation Danger', 'Abstiegsgefahr'));
       setStatusColor('text-rose-400');
    } else if (approxPos >= numTeams - 2 && tier >= maxTier) {
       setStatusText(t(lang, 'Basement Threat', 'Tabellenkeller'));
       setStatusColor('text-rose-400');
    } else if (diff >= 3) {
       setStatusText(t(lang, 'Overachieving', 'Über den Erwartungen'));
       setStatusColor('text-emerald-400');
    } else if (diff <= -3) {
       setStatusText(t(lang, 'Underperforming', 'Unter den Erwartungen'));
       setStatusColor('text-amber-400');
    } else {
       setStatusText(t(lang, 'On Target', 'Im Soll'));
       setStatusColor('text-sky-400');
    }
  }, [state.year, tier, country, state.club.id, state.club.baseOvr, state.club.morale, state.boardTargetPos, lang]);

  useEffect(() => {
    if (initializedYearRef.current === state.year) {
      return;
    }
    initializedYearRef.current = state.year;

    // 2. International Tournament Logic
    const isWorldCupYear = state.year % 4 === 2;
    const isEuroYear = state.year % 4 === 0;
    
    let tName = t(lang, 'International Friendlies', 'Internationale Testspiele');
    if (isWorldCupYear) tName = t(lang, 'World Championship', 'Weltmeisterschaft');
    else if (isEuroYear) tName = t(lang, 'European Championship', 'Europameisterschaft');
    
    setTournamentName(tName);
    
    // Determine impact based on OVR
    if (state.club.baseOvr >= 80) {
        const numPlayers = Math.max(1, Math.floor((state.club.baseOvr - 65) / 5) + Math.floor(Math.random() * 3));
        setPlayersInvolved(numPlayers);
        
        const performance = Math.random();
        let change = 0;
        let story = '';
        
        if (performance < 0.2) {
            change = -1;
            story = t(lang, `Disaster! Your players returned exhausted and injured from the ${tName}.`, `Katastrophe! Deine Spieler kehrten erschöpft und verletzt von der ${tName} zurück.`);
        } else if (performance < 0.6) {
            change = 0;
            story = t(lang, `Your ${numPlayers} internationals had a solid showing at the ${tName} and returned safely.`, `Deine ${numPlayers} Nationalspieler zeigten solide Leistungen bei der ${tName} und kehrten gesund zurück.`);
        } else if (performance < 0.9) {
            change = 1;
            story = t(lang, `Great success! Your ${numPlayers} players gained valuable experience and confidence at the ${tName}.`, `Großer Erfolg! Deine ${numPlayers} Spieler sammelten wertvolle Erfahrung und Selbstvertrauen bei der ${tName}.`);
        } else {
            change = 2;
            story = t(lang, `Incredible! Your players were the stars of the ${tName}, returning in peak form!`, `Unglaublich! Deine Spieler waren die Stars der ${tName} und kehrten in Höchstform zurück!`);
        }
        setOvrChange(change);
        setTournamentStory(story);
    } else {
        setPlayersInvolved(0);
        setOvrChange(0);
        
        const rnd = Math.random();
        if (rnd < 0.3) {
           setTournamentStory(t(lang, 'Your squad completed a focused recovery program during the winter break.', 'Deine Mannschaft hat sich in der Winterpause optimal erholt und regeneriert.'));
        } else if (rnd < 0.7) {
           setTournamentStory(t(lang, 'The squad played several competitive club friendlies to maintain match fitness.', 'Das Team absolvierte einige Testspiele, um optimal im Rhythmus zu bleiben.'));
        } else {
           setTournamentStory(t(lang, 'The winter break provided valuable training time to refine tactical nuances and recover.', 'Die Winterpause bot wertvolle Zeit, um taktische Feinheiten einzustudieren und Kräfte zu sammeln.'));
        }
    }
  }, [state.year, tier, country, state.club.id, state.boardTargetPos, lang]);

  // Build active competitions dynamically
  const activeCompetitions: ActiveCompetition[] = [];

  // 1. Domestic League
  const leagueInfo = getLeagueInfo(tier, country);
  activeCompetitions.push({
    id: 'league',
    name: leagueInfo.name,
    category: t(lang, 'Domestic League', 'Ligabetrieb'),
    badge: `TIER ${tier}`,
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    icon: 'fa-trophy',
    logo: leagueInfo.logo,
    status: `${midSeasonPos}. ${t(lang, 'Place', 'Platz')} (${midSeasonPos}/${numLeagueTeams})`,
    detail: statusText,
    target: `${t(lang, 'Target', 'Ziel')}: Top ${state.boardTargetPos || Math.floor(numLeagueTeams / 2)}`,
  });

  // Cup run results check for current season
  const cupRuns = state.cupRunResults || [];
  const domesticExit = cupRuns.find(
    r => r.year === state.year && (r.id === 'nat_cup' || r.id === 'reg_cup') && !r.won
  );
  const isDomesticEliminated = cupQualifiedForSf === false || (cupQualifiedForSf !== true && Boolean(domesticExit));

  // 2. Domestic / Regional Cup (excluded for reserve teams)
  if (!isReserve) {
    const lastHistWb = state.history.length > 0 ? state.history[state.history.length - 1] : null;
    const isSameClubWb = Boolean(lastHistWb && (!lastHistWb.clubName || lastHistWb.clubName === state.club.name));
    const wonDfbCupLastYear = isSameClubWb && (lastHistWb.trophiesThisYear?.dfb || 0) === 1;
    const wonRegCupLastYear = tier > 1 && isSameClubWb && (lastHistWb.trophiesThisYear?.reg || 0) === 1;
    const isInNationalCup = tier <= 2 || wonRegCupLastYear || wonDfbCupLastYear;
    
    if (isInNationalCup) {
      const cupInfo = getDomesticCupInfo(country, 1);
      if (isDomesticEliminated) {
        const exitRound = 'Quarter-Final';
        activeCompetitions.push({
          id: 'national_cup',
          name: cupInfo.name,
          category: t(lang, 'National Cup', 'Nationaler Pokal'),
          badge: t(lang, 'QF EXIT', 'VF AUS'),
          badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
          icon: 'fa-shield-halved',
          logo: cupInfo.logo,
          status: `${t(lang, 'Eliminated', 'Ausgeschieden')} · ${exitRound}`,
          detail: t(lang, 'Knocked out in Quarter-Final', 'Im Viertelfinale ausgeschieden'),
          target: t(lang, 'Focus on League', 'Fokus auf Ligabetrieb'),
          isEliminated: true,
        });
      } else {
        const badgeText = wonDfbCupLastYear 
          ? t(lang, 'DEFENDING CHAMPIONS', 'TITELVERTEIDIGER') 
          : wonRegCupLastYear 
          ? t(lang, 'CUP QUALIFIER', 'POKAL-QUALIFIKANT') 
          : 'CUP';
        const badgeColor = wonDfbCupLastYear
          ? 'bg-amber-400/20 text-amber-300 border-amber-400/35 font-bold'
          : 'bg-amber-500/15 text-amber-400 border-amber-500/25';

        activeCompetitions.push({
          id: 'national_cup',
          name: cupInfo.name,
          category: t(lang, 'National Cup', 'Nationaler Pokal'),
          badge: badgeText,
          badgeColor: badgeColor,
          icon: 'fa-shield-halved',
          logo: cupInfo.logo,
          status: cupQualifiedForSf === true ? t(lang, 'Final Four', 'Final Four') : t(lang, 'Active Knockouts', 'Aktiv · K.o.-Phase'),
          detail: cupQualifiedForSf === true
            ? t(lang, 'Quarter-Final victory seals Semi-Final clash', 'Viertelfinalsieg sichert Halbfinaleinzug')
            : (wonDfbCupLastYear
              ? t(lang, 'Reigning champions seeking repeat', 'Als Pokalsieger auf Titelkurs')
              : wonRegCupLastYear
              ? t(lang, 'Qualified via Regional Cup', 'Als Vorjahressieger qualifiziert')
              : tier === 1
                ? t(lang, 'Contender for Final Four', 'Rennen um das Final Four')
                : t(lang, 'Underdog cup run in progress', 'Pokal-Außenseiter auf Kurs')),
          target: tier === 1 ? t(lang, 'Final Four', 'Titelkandidat') : t(lang, 'Upset Hunt', 'Pokalsensation'),
          isEliminated: false,
        });
      }
    } else {
      const isGer = country === 'GER';
      const regName = isGer ? 'Regionalpokal' : t(lang, 'Regional Cup', 'Regionalpokal');
      if (isDomesticEliminated) {
        const exitRound = 'Quarter-Final';
        activeCompetitions.push({
          id: 'regional_cup',
          name: regName,
          category: t(lang, 'Regional Cup', 'Regionalpokal'),
          badge: t(lang, 'QF EXIT', 'VF AUS'),
          badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
          icon: 'fa-award',
          status: `${t(lang, 'Eliminated', 'Ausgeschieden')} · ${exitRound}`,
          detail: t(lang, 'Knocked out before winter break', 'Vor der Pause ausgeschieden'),
          target: t(lang, 'Focus on League', 'Fokus auf Ligabetrieb'),
          isEliminated: true,
        });
      } else {
        const badgeText = wonRegCupLastYear 
          ? t(lang, 'DEFENDING CHAMPIONS', 'TITELVERTEIDIGER') 
          : 'REGIONAL';
        activeCompetitions.push({
          id: 'regional_cup',
          name: regName,
          category: t(lang, 'Regional Cup', 'Regionalpokal'),
          badge: badgeText,
          badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
          icon: 'fa-award',
          status: cupQualifiedForSf === true ? t(lang, 'Semi-Final', 'Halbfinale') : t(lang, 'Semi-Final', 'Halbfinale'),
          detail: cupQualifiedForSf === true
            ? t(lang, 'Quarter-Final victory seals Semi-Final', 'Viertelfinalsieg sichert Halbfinale')
            : (wonRegCupLastYear
              ? t(lang, 'Aiming to defend trophy', 'Titelverteidigung angestrebt')
              : t(lang, 'Semi-Final in spring', 'Halbfinalspiel in Rückrunde')),
          target: t(lang, 'Cup Title & Ticket', 'Regionalmeister & Pokal-Ticket'),
          isEliminated: false,
        });
      }
    }
  }

  // 3. Continental / European Competitions
  if (state.euroStatus && !isReserve) {
    const euroNames = getContinentalCupNames(country);
    const euroKey = state.euroStatus.toUpperCase();
    const euroExit = cupRuns.find(
      r => r.year === state.year && r.id === 'euro_cup' && !r.won
    );
    const isEuroEliminated = euroQualifiedForSf === false || (euroQualifiedForSf !== true && Boolean(euroExit));

    if (isEuroEliminated) {
      const euroCupName = euroKey === 'CL' ? euroNames.cl : euroKey === 'EL' ? euroNames.el : euroNames.ecl;
      const exitRound = 'Quarter-Final';
      activeCompetitions.push({
        id: 'euro_eliminated',
        name: euroCupName,
        category: euroKey === 'CL' ? t(lang, 'Continental Elite', 'Königsklasse') : t(lang, 'European Cup', 'Europapokal'),
        badge: t(lang, 'QF EXIT', 'VF AUS'),
        badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
        icon: 'fa-star',
        status: `${t(lang, 'Eliminated', 'Ausgeschieden')} · ${exitRound}`,
        detail: t(lang, 'European campaign ended in Quarter-Final', 'Europapokal-Reise im Viertelfinale beendet'),
        target: t(lang, 'Domestic Focus', 'Nationaler Fokus'),
        isEliminated: true,
      });
    } else if (euroKey === 'CL') {
      activeCompetitions.push({
        id: 'euro_cl',
        name: euroNames.cl,
        category: t(lang, 'Continental Elite', 'Königsklasse'),
        badge: 'EHF CL',
        badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
        icon: 'fa-star',
        status: euroQualifiedForSf === true ? t(lang, 'Final Four Cologne', 'Final Four Köln') : t(lang, 'Spring Knockouts', 'Frühjahrs-K.o.-Phase'),
        detail: euroQualifiedForSf === true ? t(lang, 'Elite place booked in Cologne', 'Final Four Einzug gesichert') : t(lang, 'Europe’s ultimate club competition', 'Europas Krone'),
        target: t(lang, 'Final Four Contender', 'Final Four Einzug'),
        isEliminated: false,
      });
    } else if (euroKey === 'EL') {
      activeCompetitions.push({
        id: 'euro_el',
        name: euroNames.el,
        category: t(lang, 'European League', 'Europapokal'),
        badge: 'EHF EL',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
        icon: 'fa-trophy',
        status: euroQualifiedForSf === true ? t(lang, 'Semi-Final', 'Halbfinale') : t(lang, 'Knockout Stage', 'K.o.-Phase'),
        detail: t(lang, 'High-stakes continental stage', 'Europäische K.o.-Duelle'),
        target: t(lang, 'European Silverware', 'Europapokalsieg'),
        isEliminated: false,
      });
    } else if (euroKey === 'ECL') {
      activeCompetitions.push({
        id: 'euro_ecl',
        name: euroNames.ecl,
        category: t(lang, 'European Cup', 'Europapokal'),
        badge: 'EHF EC',
        badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
        icon: 'fa-award',
        status: euroQualifiedForSf === true ? t(lang, 'Semi-Final', 'Halbfinale') : t(lang, 'Round of 16', 'Achtelfinale'),
        detail: t(lang, 'Chasing international glory', 'Titeljagd im European Cup'),
        target: t(lang, 'European Title', 'Europapokalsieg'),
        isEliminated: false,
      });
    }
  }

  // Pre-calculate Boardroom Assessment stakes
  const targetPos = state.boardTargetPos || Math.floor(numLeagueTeams / 2);
  const posGap = midSeasonPos - targetPos;
  const isInDropZone = midSeasonPos >= numLeagueTeams - 2;

  // Pre-calculate Action limits and costs
  const bondingCost = Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country));
  const isBondingLimitReached = (state.teamBondingThisSeason || 0) >= 1;
  const currentMorale = state.club.morale ?? 100;
  const hasTacticalGenius = (state.managerSkills || []).includes('tactical_mastermind');
  const skillPoints = state.skillPoints || 0;
  const currentTactic = state.tactic || 'Balanced 6-0';

  const [hasAppliedOvr, setHasAppliedOvr] = useState(false);

  const applyOvrAndProceed = (action: () => void) => {
    if (!hasAppliedOvr) {
      setHasAppliedOvr(true);
      if (ovrChange !== 0) {
        const oldOvr = state.club.baseOvr;
        const newOvr = Math.min(100, Math.max(30, oldOvr + ovrChange));
        const actualDelta = newOvr - oldOvr;
        const updatedWorldClubs = { ...state.worldClubs };
        if (updatedWorldClubs[state.club.id]) {
          updatedWorldClubs[state.club.id] = { ...updatedWorldClubs[state.club.id], baseOvr: newOvr };
        }
        useGameStore.getState().updateState({
          club: { ...state.club, baseOvr: newOvr },
          worldClubs: updatedWorldClubs,
          startOfSeasonOvr: typeof (state as any).startOfSeasonOvr === 'number' ? (state as any).startOfSeasonOvr : oldOvr,
          lastOvr: typeof (state as any).lastOvr === 'number' ? (state as any).lastOvr : oldOvr,
          ...(actualDelta > 0
            ? { eventOvrGainThisSeason: ((state as any).eventOvrGainThisSeason || 0) + actualDelta }
            : { signingFlopLossThisSeason: ((state as any).signingFlopLossThisSeason || 0) + Math.abs(actualDelta) }),
          ovrHistory: [
            {
              id: Math.random().toString(36).substring(7),
              season: state.year,
              change: actualDelta,
              reason: `Winter Break: ${tournamentName}`,
              reasonDe: `Winterpause: ${tournamentName}`
            },
            ...(state.ovrHistory || [])
          ].slice(0, 30)
        });
      }
    }
    action();
  };

  // Power User Keyboard Shortcuts: Spacebar or Escape triggers start second half
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubModalOpen) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space' || e.key === 'Escape') {
        e.preventDefault();
        applyOvrAndProceed(onContinue);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue, hasAppliedOvr, ovrChange, isSubModalOpen]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-5 z-[100] backdrop-blur-xl bg-black/85"
    >
      <motion.div 
         initial={{ scale: 0.95, y: 16, opacity: 0 }}
         animate={{ scale: 1, y: 0, opacity: 1 }}
         transition={{ type: 'spring', damping: 28, stiffness: 350 }}
         className="w-full max-w-2xl bg-[#14151e] rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] cursor-default"
         onClick={(e) => e.stopPropagation()}
      >
        {/* Mid-Season War Room Header */}
        <div className="p-4 sm:p-5 pb-3.5 relative overflow-hidden shrink-0 border-b border-white/[0.04]">
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-amber-400/90 tracking-widest uppercase">
                {t(lang, 'MID-SEASON WAR ROOM', 'STRATEGISCHES LAGEZENTRUM')}
              </span>
            </div>
            <div className="px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.04] text-xs font-medium text-zinc-300 truncate max-w-[160px]">
              {state.club.name}
            </div>
          </div>

          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
              {t(lang, 'Winter Break Review', 'Winterpausen-Briefing')}
            </h2>
            <div className="text-xs text-zinc-400 font-mono tabular-nums">
              {t(lang, 'Season', 'Saison')} {state.year} · {midSeasonPos}. {t(lang, 'Place', 'Platz')}
            </div>
          </div>
        </div>
        
        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3.5 min-h-0">
          
          {/* 1. Dynamic Boardroom Assessment Hook Banner */}
          {posGap > 2 || isInDropZone ? (
            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-triangle-exclamation" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white truncate">
                    {t(lang, 'Underachieving · High Board Pressure', 'Unter den Erwartungen · Hoher Vorstandsdruck')}
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    {t(
                      lang,
                      `Board demands a Top ${targetPos} finish. Currently ${posGap > 0 ? `+${posGap}` : posGap} spots behind target. A fierce second half is mandatory.`,
                      `Vorstand fordert Platz ${targetPos}. Aktuell ${posGap > 0 ? `+${posGap}` : posGap} Plätze hinter Ziel. Eine starke Rückrunde ist Pflicht!`
                    )}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-medium text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                CRITICAL
              </span>
            </div>
          ) : posGap <= 0 ? (
            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-trophy" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white truncate">
                    {t(lang, 'Exceeding Expectations · Push for Silverware', 'Über den Erwartungen · Trophäenjagd')}
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    {t(
                      lang,
                      `The boardroom is thrilled with #${midSeasonPos} (Target: Top ${targetPos}). Maintain momentum and push for silverware.`,
                      `Der Vorstand ist begeistert von Platz #${midSeasonPos} (Ziel: Top ${targetPos}). Schwung mitnehmen und Pokale anvisieren!`
                    )}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                EXCELLENT
              </span>
            </div>
          ) : (
            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-bullseye" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white truncate">
                    {t(lang, 'On Target · Striking Distance', 'Im Soll · In Schlagdistanz')}
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    {t(
                      lang,
                      `Within striking distance of board goals (#${midSeasonPos}, Target: Top ${targetPos}). Full focus needed in the second half.`,
                      `In Schlagdistanz zu den Saisonzielen (#${midSeasonPos}, Ziel: Top ${targetPos}). Volle Konzentration auf die Rückrunde.`
                    )}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-medium text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20 shrink-0">
                ON TRACK
              </span>
            </div>
          )}

          {/* 2. Mid-Season Quick Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                {t(lang, 'Standing', 'Position')}
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight tabular-nums">{midSeasonPos}</span>
                <span className="text-xs text-zinc-400 font-normal tabular-nums">/ {numLeagueTeams}</span>
              </div>
              <span className="text-[11px] font-medium truncate text-zinc-300">
                {statusText}
              </span>
            </div>

            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                {t(lang, 'Target', 'Ziel')}
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight tabular-nums">
                  Top {targetPos}
                </span>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 truncate">
                {t(lang, 'Board Mandate', 'Vorstandsziel')}
              </span>
            </div>

            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                {t(lang, 'Squad Strength', 'Kaderstärke')}
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight tabular-nums">{state.club.baseOvr}</span>
                <span className="text-xs text-zinc-400 font-normal">OVR</span>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 truncate">
                {tier === 1 ? 'Top Flight Tier' : `Tier ${tier}`}
              </span>
            </div>

            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                {t(lang, 'Morale', 'Moral')}
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-xl sm:text-2xl font-semibold tracking-tight tabular-nums text-white">
                  {currentMorale}%
                </span>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 truncate">
                {currentMorale >= 80 ? t(lang, 'Harmonious', 'Harmonisch') : t(lang, 'Under Pressure', 'Angespannt')}
              </span>
            </div>
          </div>

          {/* 3. Active Competitions Horizontal Ribbon */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <i className="fas fa-layer-group text-sky-400 text-xs" />
                <span>{t(lang, 'Active Competitions', 'Aktive Wettbewerbe')}</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {activeCompetitions.filter(c => !c.isEliminated).length} {t(lang, 'Active in Contention', 'Aktiv im Rennen')}
              </span>
            </div>

            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 custom-scrollbar snap-x">
              {activeCompetitions.map((comp, compIdx) => (
                <div 
                  key={`comp-${comp.id}-${compIdx}`}
                  className={`snap-start shrink-0 min-w-[200px] sm:min-w-[220px] max-w-[240px] p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-sm ${
                    comp.isEliminated
                      ? 'bg-[#181924]/60 border-white/[0.03] opacity-65'
                      : 'bg-[#181924] hover:bg-white/[0.03] border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center shrink-0 overflow-hidden">
                      {comp.logo ? (
                        <img 
                          src={comp.logo} 
                          alt={comp.name} 
                          className="w-5 h-5 object-contain drop-shadow" 
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <i className={`fas ${comp.icon} text-xs text-zinc-300`} />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold text-white tracking-tight truncate" title={comp.name}>
                        {comp.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {comp.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[11px] pt-1 border-t border-white/[0.04]">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                      comp.isEliminated 
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' 
                        : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                    }`}>
                      {comp.badge}
                    </span>
                    <span className={`text-[11px] font-medium truncate ${
                      comp.isEliminated ? 'text-zinc-500' : 'text-zinc-200'
                    }`}>
                      {comp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {isReserve && (
              <p className="text-[11px] text-zinc-400/80 italic px-1">
                <i className="fas fa-circle-info mr-1 text-zinc-500" />
                {t(lang, 'Reserve squads are restricted to league play and do not participate in cup tournaments.', 'Zweitvertretungen sind auf den Ligabetrieb beschränkt und nehmen an keinen Pokalwettbewerben teil.')}
              </p>
            )}
          </div>

          {/* 4. Compact Dismissible International Break Narrative Toast */}
          {!isStoryDismissed && tournamentStory && (
            <div className="relative bg-sky-500/[0.04] border border-sky-500/20 rounded-2xl p-3 flex items-start justify-between gap-2.5 shadow-sm">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <i className={`fas ${state.club.baseOvr >= 80 ? 'fa-globe' : 'fa-campground'}`} />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white tracking-tight">
                      {state.club.baseOvr >= 80 ? tournamentName : t(lang, 'Winter Break Activity', 'Pausenaktivität')}
                    </span>
                    {playersInvolved > 0 && (
                      <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 tabular-nums">
                        {playersInvolved} {t(lang, 'Internationals', 'Nationalspieler')}
                      </span>
                    )}
                    {ovrChange !== 0 && (
                      <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border tabular-nums ${
                        ovrChange > 0 
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}>
                        {ovrChange > 0 ? `+${ovrChange}` : ovrChange} OVR
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">
                    {tournamentStory}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStoryDismissed(true)}
                className="text-zinc-500 hover:text-zinc-300 p-1 -mr-1 -mt-1 transition cursor-pointer shrink-0"
                title={t(lang, 'Dismiss', 'Ausblenden')}
              >
                <i className="fas fa-xmark text-xs" />
              </button>
            </div>
          )}
          
          {/* 5. Quick Preparation Actions with Live Costs & Action Limits */}
          {(() => {
            const sponsorTerms = getDynamicSponsorPitchTerms(state);
            const pitchedCount = state.sponsorsPitchedThisSeason || 0;
            const remainingPitches = Math.max(0, 3 - pitchedCount);
            const activeSponsorNames = [
              sponsorTerms.standardBrand.name,
              sponsorTerms.megaBrand.name,
              sponsorTerms.perfBrand.name,
            ].filter(n => n && n !== 'Empty').join(' · ');

            return (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-zinc-300 px-0.5">
                  {t(lang, 'Winter Preparations', 'Vorbereitungsmaßnahmen')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                   {/* Button 1: Transfer Market */}
                   <button 
                      type="button"
                      onClick={() => applyOvrAndProceed(onMakeTransfers)}
                      className="w-full p-3 sm:p-3.5 rounded-2xl bg-[#181924] hover:bg-white/[0.03] text-left transition-all border border-white/[0.04] hover:border-sky-500/20 flex flex-col justify-between gap-2.5 cursor-pointer shadow-sm active:scale-[0.98] group"
                   >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                          <i className="fas fa-store text-xs" />
                        </div>
                        <span className="text-[10px] font-mono font-medium text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full tabular-nums">
                          {formatMoney(state.budget)}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                          {t(lang, 'Transfer Market', 'Transfermarkt')}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-normal truncate mt-0.5 tabular-nums">
                          {t(lang, `Available: ${formatMoney(state.budget)}`, `Verfügbar: ${formatMoney(state.budget)}`)}
                        </span>
                      </div>
                   </button>

                   {/* Button 2: Commercial Sponsors (2nd Half Pitching) */}
                   <button 
                      type="button"
                      onClick={() => applyOvrAndProceed(onReturnToDashboard || onContinue)}
                      className="w-full p-3 sm:p-3.5 rounded-2xl bg-[#181924] hover:bg-white/[0.03] text-left transition-all border border-white/[0.04] hover:border-emerald-500/20 flex flex-col justify-between gap-2.5 cursor-pointer shadow-sm active:scale-[0.98] group"
                   >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <i className="fas fa-handshake text-xs" />
                        </div>
                        <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border tabular-nums ${
                          remainingPitches > 0
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                        }`}>
                          {remainingPitches > 0 ? `${remainingPitches}/3 Open` : `${pitchedCount}/3 Pitched`}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                          {t(lang, 'Commercial Sponsors', 'Sponsoren-Pitches')}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-normal truncate mt-0.5" title={activeSponsorNames}>
                          {activeSponsorNames || t(lang, 'Manage club sponsors', 'Sponsoren verwalten')}
                        </span>
                      </div>
                   </button>
                   
                   {/* Button 3: Training Camp (Team Bonding) with native limit check */}
                   <button 
                      type="button"
                      disabled={isBondingLimitReached}
                      onClick={() => {
                        if (!isBondingLimitReached) applyOvrAndProceed(onTeamBonding);
                      }}
                      className={`w-full p-3 sm:p-3.5 rounded-2xl bg-[#181924] text-left transition-all border flex flex-col justify-between gap-2.5 shadow-sm ${
                        isBondingLimitReached
                          ? 'opacity-60 border-white/[0.03] cursor-not-allowed'
                          : 'hover:bg-white/[0.03] border-white/[0.04] hover:border-amber-500/20 cursor-pointer active:scale-[0.98] group'
                      }`}
                   >
                      <div className="flex items-center justify-between w-full">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isBondingLimitReached 
                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/40' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <i className="fas fa-campground text-xs" />
                        </div>
                        <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border tabular-nums ${
                          isBondingLimitReached
                            ? 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {isBondingLimitReached ? t(lang, 'Limit (1/1)', 'Limit (1/1)') : formatMoney(bondingCost)}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs sm:text-sm font-semibold tracking-tight transition-colors ${
                          isBondingLimitReached ? 'text-zinc-400' : 'text-white group-hover:text-amber-300'
                        }`}>
                          {t(lang, 'Training Camp', 'Trainingslager')}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-normal truncate mt-0.5 tabular-nums">
                          {isBondingLimitReached
                            ? t(lang, `Limit Reached · Morale: ${currentMorale}%`, `Limit erreicht · Moral: ${currentMorale}%`)
                            : t(lang, `Cost: ${formatMoney(bondingCost)} · Morale: ${currentMorale}%`, `Kosten: ${formatMoney(bondingCost)} · Moral: ${currentMorale}%`)}
                        </span>
                      </div>
                   </button>
                   
                   {/* Button 4: Tactical Revamp */}
                   <button 
                      type="button"
                      onClick={() => applyOvrAndProceed(onRevampSystem)}
                      className="w-full p-3 sm:p-3.5 rounded-2xl bg-[#181924] hover:bg-white/[0.03] text-left transition-all border border-white/[0.04] hover:border-purple-500/20 flex flex-col justify-between gap-2.5 cursor-pointer shadow-sm active:scale-[0.98] group"
                   >
                      <div className="flex items-center justify-between w-full">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <i className="fas fa-chess-board text-xs" />
                        </div>
                        <span className="text-[10px] font-mono font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full tabular-nums">
                          {hasTacticalGenius ? t(lang, 'Free', 'Kostenlos') : `${skillPoints} MP`}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                          {t(lang, 'Tactical Revamp', 'Taktik-Anpassung')}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">
                          {currentTactic} · {hasTacticalGenius ? t(lang, 'Free (Genius)', 'Kostenlos') : t(lang, 'Costs 5 MP', 'Kostet 5 MP')}
                        </span>
                      </div>
                   </button>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Action Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.04] bg-[#14151e] shrink-0 flex flex-col sm:flex-row items-center gap-2.5">
          {onReturnToDashboard && (
            <button
              type="button"
              onClick={() => applyOvrAndProceed(onReturnToDashboard)}
              className="w-full sm:w-auto sm:flex-1 py-3.5 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-[0.99] cursor-pointer border border-white/[0.08] flex items-center justify-center gap-2"
            >
              <i className="fas fa-sliders text-xs text-sky-400" />
              <span>{t(lang, 'Club Dashboard (Pitch Sponsors & 2nd Half Prep)', 'Vereins-Dashboard (Sponsoren & Rückrunden-Vorbereitung)')}</span>
            </button>
          )}
          <button 
             type="button"
             onClick={() => applyOvrAndProceed(onContinue)}
             className="w-full sm:w-auto sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-[0_8px_25px_rgba(37,99,235,0.35)] border border-blue-400/30 flex items-center justify-center gap-2 group"
          >
             <span>{t(lang, 'Simulate Second Half of Season', 'Rückrunde direkt simulieren')}</span>
             <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
