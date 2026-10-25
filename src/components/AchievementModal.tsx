import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { triggerRealisticConfetti } from '../utils/confettiHelper';
import { ClubLogo } from './ClubLogo';
import { TrophyGraphic } from './TrophyGraphic';
import { GameState } from '../types';
import { formatMoney, COUNTRIES, getCountryFlag, getLeagueInfo, getMaxTier } from '../data/gameConstants';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, isAnyModActive, mergeClubWithWorldState } from '../utils/modManager';
import { generateLeagueTable, getDecisionDayStandingsSlice } from '../utils/leagueTableGenerator';
import { useModalDismiss } from '../utils/modalUtils';
import { getBroadcastingPackage, cleanBroadcastBadge } from '../data/broadcastingPackages';
import { BroadcastLogo } from './BroadcastLogo';

interface AchievementModalProps {
  state: GameState;
  toast: {
    id?: string;
    type?: string;
    message: string;
    prizeMoney?: number;
    subtitle?: string;
    category?: 'league' | 'cup' | 'euro' | 'decision_day';
    standings?: any[];
    opponentName?: string;
  };
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ state, toast, onClose }) => {
  useModalDismiss(onClose);
  const rawMsg = toast.message || '';
  const userStandingRow = toast.standings?.find((r: any) => r.isPlayer || r.name === state?.club?.name);
  const standingsSayRelegated = userStandingRow?.status === 'RELEGATED';

  const isRelegated = Boolean(
    standingsSayRelegated ||
    toast.type === 'error' ||
    toast.type === 'relegation' ||
    (rawMsg.toLowerCase().includes('relegat') &&
      !rawMsg.toLowerCase().includes('surviv') &&
      !rawMsg.toLowerCase().includes('stayed up') &&
      !rawMsg.toLowerCase().includes('winner') &&
      !rawMsg.toLowerCase().includes('won'))
  );

  const isSurvived = !isRelegated && Boolean(
    rawMsg.toLowerCase().includes('surviv') || 
    rawMsg.toLowerCase().includes('stayed up') || 
    rawMsg.toLowerCase().includes('klassenerhalt') || 
    rawMsg.includes('🛡️') ||
    (toast.title && (toast.title.toLowerCase().includes('surviv') || toast.title.toLowerCase().includes('stayed up'))) ||
    (toast.subtitle && (toast.subtitle.toLowerCase().includes('surviv') || toast.subtitle.toLowerCase().includes('stayed up')))
  );
  const isSuperGlobe = !isSurvived && !isRelegated && rawMsg.includes('Super Globe');
  const isChampionsLeague = !isSurvived && !isRelegated && rawMsg.includes('Champions League');
  const isEuroLeague = !isSurvived && !isRelegated && (rawMsg.includes('Euro League') || rawMsg.includes('European League'));
  const isEuropeanCup = !isSurvived && !isRelegated && (rawMsg.includes('European Cup') || rawMsg.includes('ECL'));
  const isPlatinum = !isSurvived && !isRelegated && (isSuperGlobe || isChampionsLeague || isEuroLeague || isEuropeanCup || toast.category === 'euro');
  const isCup = !isSurvived && !isRelegated && (toast.category === 'cup' || (!isPlatinum && (rawMsg.includes('Pokal') || rawMsg.includes('Amateurcup') || rawMsg.includes('Cup') || rawMsg.includes('CUP'))));
  const isMagicCup = Boolean(toast.subtitle?.includes('Magic Cup') || rawMsg.includes('Magic Cup'));
  const isPlayoffDefeat = !isRelegated && !isSurvived && Boolean(
    rawMsg.toLowerCase().includes('defeat') ||
    rawMsg.toLowerCase().includes('stays in tier') ||
    rawMsg.toLowerCase().includes('missed out') ||
    (toast.subtitle && (toast.subtitle.toLowerCase().includes('missed out') || toast.subtitle.toLowerCase().includes('remains in current tier')))
  );
  const isRunnerUp = !isRelegated && !isPlayoffDefeat && (rawMsg.includes('🥈') || rawMsg.toLowerCase().includes('runner-up') || rawMsg.includes('Vizemeister'));
  const isWinner = !isRelegated && !isPlayoffDefeat && (rawMsg.includes('🏆') || rawMsg.includes('Champions') || rawMsg.includes('Winners') || rawMsg.includes('Meister')) && !isRunnerUp && !isSurvived;
  const isPromotion = !isRelegated && !isPlayoffDefeat && (rawMsg.includes('Promoted') || rawMsg.includes('Aufstieg') || rawMsg.includes('Promotion')) && !isSurvived;

  // ONLY domestic league events should ever show the league standings table
  const showLeagueStandingsTable = !isPlatinum && !isCup && !isMagicCup && !isRelegated && (
    toast.category === 'league' || 
    toast.category === 'decision_day' || 
    rawMsg.includes('Decision Day') ||
    Boolean(toast.subtitle?.includes('Decision Day')) ||
    isWinner || isPromotion || isRunnerUp || isSurvived || isPlayoffDefeat
  );

  useEffect(() => {
    if (!isRelegated && !isPlayoffDefeat && (isWinner || isPromotion || isSurvived || isRunnerUp || isCup || isPlatinum)) {
      triggerRealisticConfetti();
    }
  }, [isWinner, isPromotion, isSurvived, isRunnerUp, isCup, isPlatinum, isRelegated, isPlayoffDefeat]);

  const countryFlag = getCountryFlag(state?.club?.country);
  const maxTier = getMaxTier(state?.club?.country || 'GER');

  const isModActive = isAnyModActive();
  const broadcastPkg = useMemo(() => {
    return getBroadcastingPackage(state?.club?.country || 'GER', isPlatinum, {
      isCupFinal: isMagicCup || isCup,
      year: state?.seasonYear,
      isModActive,
    });
  }, [state?.club?.country, isPlatinum, isMagicCup, isCup, state?.seasonYear, isModActive]);
  const history = state?.history || [];
  const lastHist = history.length > 0 ? history[history.length - 1] : null;
  const playedTier = lastHist?.tier || state?.club?.tier || 1;
  let targetDestTier = lastHist?.nextTier || (isRelegated ? playedTier + 1 : playedTier);
  if (isRelegated && targetDestTier <= playedTier) {
    targetDestTier = playedTier + 1;
  }
  const currentLeague = getLeagueInfo(playedTier, state?.club?.country || 'GER');
  let nextLeague = getLeagueInfo(targetDestTier, state?.club?.country || 'GER');
  if (isRelegated && nextLeague.name === currentLeague.name) {
    nextLeague = getLeagueInfo(playedTier + 1, state?.club?.country || 'GER');
  }

  // Format clean title
  const cleanTitle = rawMsg
    .replace('🏆 ', '')
    .replace('🥈 ', '')
    .replace('🔥 ', '')
    .replace('🛡️ ', '')
    .replace('✨ ', '')
    .trim();

  const displayTrophyTitle = cleanTitle.endsWith('!') ? cleanTitle.slice(0, -1) : cleanTitle;

  const formattedTrophyName = useMemo(() => {
    const raw = displayTrophyTitle.replace(/!+$/, '').trim();
    if (isSurvived || raw.toLowerCase().includes('surviv') || raw.toLowerCase().includes('stayed up') || raw.toLowerCase().includes('klassenerhalt')) {
      return playedTier === 1 ? 'Top-Flight Status Defended' : `${currentLeague.name} Status Defended`;
    }
    if (raw.toUpperCase().includes('BACK TO BACK CHAMPIONS')) {
      return 'Back-to-Back League Championship';
    }
    if (raw.toUpperCase().includes('BACK TO BACK PROMOTIONS')) {
      return 'Back-to-Back Promotion Shield';
    }
    if (raw.toUpperCase().endsWith('CHAMPIONS')) {
      const base = raw.slice(0, -9).trim();
      return `${base} Championship`;
    }
    if (raw.toUpperCase().endsWith('WINNERS')) {
      const base = raw.slice(0, -7).trim();
      return `${base} Trophy`;
    }
    return raw;
  }, [displayTrophyTitle]);

  // Generate or read authentic Decision Day standings table using REAL clubs
  const standings = useMemo(() => {
    const history = state?.history || [];
    const lastHist = history.length > 0 ? history[history.length - 1] : null;
    const expectedPos = isRunnerUp ? 2 : (isWinner ? 1 : isPlayoffDefeat ? 3 : isSurvived ? (lastHist?.pos || 8) : isRelegated ? (lastHist?.pos || 18) : (lastHist?.pos || 1));
    const outcome = isRunnerUp ? 'runner_up' : (isWinner ? 'champion' : isPromotion ? 'promoted' : isSurvived ? 'survived' : isRelegated ? 'relegated' : undefined);

    if (toast.standings && toast.standings.length > 0) {
      // Validate that toast.standings does not place the user at #1 when they finished as Runner-up
      const userRow = toast.standings.find((r: any) => r.isPlayer || r.name === state?.club?.name);
      if (!(isRunnerUp && userRow && userRow.pos === 1)) {
        return toast.standings;
      }
    }

    if (lastHist?.finalTable && Array.isArray(lastHist.finalTable) && lastHist.finalTable.length > 0) {
      const userRowInTable = lastHist.finalTable.find((r: any) => r.isUser || r.name === state?.club?.name);
      if (userRowInTable && userRowInTable.pos === expectedPos) {
        return getDecisionDayStandingsSlice(lastHist.finalTable, expectedPos, isRelegated, outcome);
      }
    }

    const allClubs = getActiveClubs(state?.club?.country).map(c => mergeClubWithWorldState(c, state?.worldClubs?.[c.id]));
    const fullTable = generateLeagueTable(state, allClubs, playedTier, {
      ...(lastHist || {}),
      pos: expectedPos,
      clubName: state?.club?.name,
      tier: playedTier,
      finalTable: undefined // Force fresh generation
    });
    return getDecisionDayStandingsSlice(fullTable, expectedPos, isRelegated, outcome);
  }, [toast.standings, state, playedTier, isRelegated, isRunnerUp, isWinner, isPromotion, isSurvived, isPlayoffDefeat]);

  // Determine theme colors based on achievement type
  let accentGradient = 'from-amber-400 via-amber-300 to-yellow-400';
  let ambientGlow = 'via-amber-400/30';

  if (isPlatinum) {
    accentGradient = 'from-indigo-300 via-sky-200 to-indigo-400';
    ambientGlow = 'via-indigo-400/35';
  } else if (isCup && !isPromotion && !isRunnerUp) {
    accentGradient = 'from-rose-400 via-amber-300 to-rose-300';
    ambientGlow = 'via-amber-400/35';
  } else if (isRunnerUp || isPlayoffDefeat) {
    accentGradient = 'from-slate-300 via-zinc-200 to-slate-400';
    ambientGlow = 'via-slate-400/35';
  } else if (isPromotion || isSurvived) {
    accentGradient = 'from-emerald-400 via-teal-300 to-emerald-300';
    ambientGlow = 'via-emerald-400/35';
  }

  // 1. RELEGATION MODAL
  if (isRelegated) {
    const shieldsLeft = state?.immunityShields !== undefined ? state.immunityShields : 1;

    return (
      <div onClick={onClose} className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl cursor-pointer">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-lg bg-[#14151e] border border-rose-500/30 rounded-[28px] overflow-hidden flex flex-col relative shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-h-[min(92dvh,92vh)] cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/80 to-transparent pointer-events-none" />
          <div className="absolute -top-16 inset-x-0 h-36 bg-gradient-to-b from-rose-500/20 to-transparent blur-3xl pointer-events-none" />

          <div className="p-4 sm:p-7 flex flex-col items-center text-center relative z-10 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {/* Live Broadcast Pills Row */}
            <div className="flex items-center justify-center gap-2 mb-3.5 flex-wrap">
              <BroadcastLogo packageOrKey={broadcastPkg} size="xs" isModActive={isModActive} />
              {/* Live buzzing broadcast badge in glass shaded red box with rounded corners */}
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-red-950/40 border border-red-500/35 backdrop-blur-md shadow-[0_0_14px_rgba(239,68,68,0.25)] text-[10px] font-mono font-semibold text-red-100">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_#ef4444]" />
                </span>
                <span>LIVE</span>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/[0.08] border border-rose-400/30 text-[10px] font-mono font-semibold text-rose-300 tracking-wider uppercase shadow-sm">
                DECISION DAY · HEARTBREAK
              </span>
            </div>

            {/* Subtitle / Kicker */}
            <div className="flex items-center justify-center gap-1.5 text-rose-400 font-semibold text-[11px] sm:text-xs tracking-wider uppercase mb-1">
              <span>⚠️</span>
              <span>RELEGATION CONFIRMED · FINAL MATCHDAY</span>
              <span>⚠️</span>
            </div>

            {/* Headline Title */}
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight uppercase leading-tight my-1">
              SEASON HEARTBREAK
            </h2>

            {/* Demotion Transition Banner */}
            <div className="w-full my-2.5 p-3 bg-[#10121a] border border-white/[0.04] rounded-2xl flex items-center justify-between gap-2 text-xs">
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">From Division</span>
                <span className="font-semibold text-zinc-300 truncate w-full text-left">{currentLeague.name}</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 font-semibold">
                ↓
              </div>
              <div className="flex flex-col items-end min-w-0 flex-1">
                <span className="text-[10px] uppercase font-semibold text-rose-400">Demoted To</span>
                <span className="font-semibold text-rose-300 truncate w-full text-right">{nextLeague.name}</span>
              </div>
            </div>

            {/* Standings Table on Decision Day (Drop Zone) with perfect column alignment */}
            <div className="w-full mt-2.5 bg-[#10121a] rounded-2xl p-3 border border-white/[0.04] text-left shadow-inner">
              <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 flex items-center justify-between pb-2 mb-2 border-b border-white/[0.04]">
                <span className="font-semibold flex items-center gap-1.5">
                  <i className="fas fa-table-list text-rose-400 text-xs" />
                  <span>FINAL TABLE · DROP ZONE</span>
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">DECISION DAY</span>
              </div>

              {/* Column Headers matching row alignment on mobile and desktop */}
              <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 px-2.5 sm:px-3 py-1 mb-1 border-b border-white/[0.04]">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="w-5 text-center shrink-0">#</span>
                  <span>Club</span>
                </div>
                <div className="flex items-center shrink-0 font-mono">
                  <span className="hidden sm:inline-block w-14 text-right pr-2">GD</span>
                  <span className="w-14 sm:w-20 text-right pr-1.5 sm:pr-2">PTS</span>
                  <span className="w-20 sm:w-28 text-right">Status</span>
                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-1.5 text-xs">
                {standings.map((t: any, idx: number) => {
                  const isPlayer = t.isPlayer || t.name === state?.club?.name;
                  return (
                    <div
                      key={`${t.name}-${idx}`}
                      className={`flex items-center justify-between py-2 px-3 rounded-xl border text-[11px] sm:text-xs ${
                        isPlayer
                          ? 'bg-rose-500/[0.06] border-rose-500/30 text-rose-200 font-semibold'
                          : 'bg-white/[0.02] border-white/[0.04] text-zinc-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className={`w-5 text-center font-mono font-semibold shrink-0 tabular-nums ${isPlayer ? 'text-rose-400' : 'text-zinc-500'}`}>
                          {t.pos}.
                        </span>
                        <span className={`truncate font-medium ${isPlayer ? 'text-white' : 'text-zinc-200'}`}>
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center shrink-0 font-mono">
                        <span className="hidden sm:inline-block w-14 text-right pr-2 text-zinc-400 tabular-nums text-xs font-medium">
                          {t.diff}
                        </span>
                        <span className={`w-14 sm:w-20 text-right pr-1.5 sm:pr-2 tabular-nums text-xs font-semibold ${isPlayer ? 'text-rose-300' : 'text-white'}`}>
                          {t.pts} <span className="hidden sm:inline text-[10px] font-medium text-zinc-400">PTS</span>
                        </span>
                        <div className="w-20 sm:w-28 flex justify-end">
                          <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md font-semibold tracking-tight shrink-0 border ${
                            isPlayer 
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/30' 
                              : 'bg-white/5 text-zinc-400 border-white/10'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Boardroom Shield Notice */}
            <div className="w-full mt-2.5 p-2.5 rounded-2xl bg-[#10121a] border border-white/[0.04] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <i className="fas fa-shield-halved text-amber-400 text-sm" />
                <span className="text-zinc-300 font-medium text-[11px] sm:text-xs">Boardroom Status:</span>
              </div>
              <span className={`font-semibold text-[11px] ${shieldsLeft > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {shieldsLeft > 0 ? `🛡️ ${shieldsLeft} Immunity Shield Remaining` : '⚠️ Final Ultimatum · Zero Shields'}
              </span>
            </div>

            {/* Narrative Body */}
            <p className="text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed max-w-md mx-auto my-2.5">
              Devastation for <strong className="text-white font-semibold">{state?.club?.name}</strong>! Despite relentless effort on Decision Day, the team could not overcome the deficit and has been officially relegated from <strong className="text-rose-300 font-semibold">{currentLeague.name}</strong> to <strong className="text-zinc-200 font-semibold">{nextLeague.name}</strong>.
            </p>
          </div>

          {/* Sticky Bottom Action Footer */}
          <div className="p-3 sm:p-4 border-t border-white/[0.04] bg-[#14151e]/95 backdrop-blur-md flex items-center justify-center shrink-0 z-20">
            <button
              onClick={onClose}
              className="w-full sm:w-auto min-w-[240px] py-3.5 px-8 rounded-2xl font-semibold text-sm tracking-wide text-white bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-[0_4px_20px_rgba(225,29,72,0.3)] border border-rose-400/30 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group touch-manipulation"
            >
              <span>Accept Fate & Continue</span>
              <i className="fas fa-chevron-right text-xs group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. HEADLINE & KICKER TEXT
  const headlineText = (() => {
    if (isPlayoffDefeat) return 'PLAYOFF HEARTBREAK';
    if (isSurvived) return 'SURVIVAL SECURED!';
    if (isMagicCup) return 'MAGIC CUP RUN!';
    if (isSuperGlobe) return 'WORLD CHAMPIONS!';
    if (isChampionsLeague) return 'CHAMPIONS OF EUROPE!';
    if (isEuroLeague || isEuropeanCup) return 'EUROPEAN GLORY!';
    if (isCup) return 'CUP GLORY!';
    if (isRunnerUp) return 'RUNNER UP';
    if (isPromotion && !isWinner) return 'PROMOTION TRIUMPH!';
    if (rawMsg.includes('BACK TO BACK CHAMPIONS')) return 'DYNASTY SECURED!';
    if (rawMsg.includes('BACK TO BACK PROMOTIONS')) return 'BACK-TO-BACK PROMOTIONS!';
    if (isWinner) return 'TITLE GLORY!';
    return 'SEASON CONCLUSION';
  })();

  const kickerText = (() => {
    if (isPlayoffDefeat) return `PROMOTION PLAYOFF · STAYS IN ${currentLeague.name.toUpperCase()}`;
    if (isSurvived) return playedTier === 1 ? 'TOP-FLIGHT STATUS DEFENDED' : `${currentLeague.name.toUpperCase()} STATUS DEFENDED`;
    if (isMagicCup) return 'MAGIC CUP RUN CHAMPIONS';
    if (isSuperGlobe) return 'IHF SUPER GLOBE WINNERS';
    if (isChampionsLeague) return 'EHF CHAMPIONS LEAGUE WINNERS';
    if (isEuroLeague) return 'EHF EUROPEAN LEAGUE WINNERS';
    if (isEuropeanCup) return 'EHF EUROPEAN CUP WINNERS';
    if (isCup) return `${formattedTrophyName.toUpperCase()} WINNERS`;
    if (isRunnerUp) return isPromotion ? 'PROMOTED AS RUNNER-UP' : `${currentLeague.name.toUpperCase()} RUNNER-UP`;
    const cleaned = cleanTitle.toUpperCase().replace(/!+$/, '').trim();
    if (cleaned.includes('SURVIV') || cleaned.includes('STAYED UP') || cleaned.includes('KLASSENERHALT')) {
      return playedTier === 1 ? 'TOP-FLIGHT STATUS DEFENDED' : `${currentLeague.name.toUpperCase()} STATUS DEFENDED`;
    }
    if (cleaned.includes('CHAMPION') || cleaned.includes('MEISTER') || cleaned.includes('RUNNER-UP') || cleaned.includes('PROMOTED') || cleaned.includes('WINNERS')) {
      return cleaned;
    }
    return `${cleaned} CHAMPIONS`;
  })();

  const presentationBadgeText = (() => {
    if (isPlayoffDefeat) return 'DECISION DAY · PLAYOFF DEFEAT';
    if (isSurvived || cleanTitle.toLowerCase().includes('surviv') || cleanTitle.toLowerCase().includes('stayed up')) return 'DECISION DAY · SURVIVAL SECURED';
    if (isMagicCup) return 'MAGIC CUP RUN · GLORY';
    if (isSuperGlobe) return 'IHF WORLD SHOWPIECE · FINAL';
    if (isChampionsLeague) return 'EHF CHAMPIONS LEAGUE · FINAL';
    if (isEuroLeague || isEuropeanCup) return 'EUROPEAN SHOWPIECE · FINAL';
    if (isCup) return 'NATIONAL CUP · FINAL FOUR';
    if (isRunnerUp) return isPromotion ? 'PROMOTION CONFIRMED · RUNNER-UP' : 'OFFICIAL RUNNER-UP';
    return 'LIVE TROPHY PRESENTATION';
  })();

  const trophyGraphicType = isSuperGlobe ? 'globe' : isPlatinum ? 'euro' : isCup ? 'cup' : 'league';

  return (
    <div onClick={onClose} className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl cursor-pointer">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full max-w-lg bg-[#14151e] border border-white/[0.04] rounded-[28px] overflow-hidden flex flex-col relative shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-h-[min(92dvh,92vh)] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ambient Glow matching category */}
        <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent ${ambientGlow} to-transparent pointer-events-none`} />
        <div className={`absolute -top-16 inset-x-0 h-36 bg-gradient-to-b ${ambientGlow} to-transparent blur-3xl pointer-events-none`} />

        <div className="p-3.5 sm:p-7 flex flex-col items-center text-center relative z-10 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* Trophy Illustration Graphic or Survival / Playoff Shield */}
          {isSurvived || isPlayoffDefeat ? (
            <div className="relative my-2 sm:my-3 flex items-center justify-center">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border flex items-center justify-center relative overflow-hidden group ${
                isPlayoffDefeat
                  ? 'bg-slate-500/[0.08] border-slate-500/25 shadow-[0_0_35px_rgba(148,163,184,0.2)]'
                  : 'bg-emerald-500/[0.08] border-emerald-500/25 shadow-[0_0_35px_rgba(16,185,129,0.25)]'
              }`}>
                <i className={`fas ${isPlayoffDefeat ? 'fa-shield text-slate-300' : 'fa-shield-halved text-emerald-400'} text-3xl sm:text-4xl`} />
              </div>
            </div>
          ) : (
            <div className="relative my-1 sm:my-2 transform hover:scale-105 transition-transform duration-300">
              <TrophyGraphic
                size={isMagicCup ? "md" : "lg"}
                showStars={true}
                type={trophyGraphicType}
                className="drop-shadow-[0_15px_35px_rgba(56,189,248,0.35)]"
              />
            </div>
          )}

          {/* Badges Row matching broadcast standard */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 mb-1.5 flex-wrap">
            <BroadcastLogo packageOrKey={broadcastPkg} size="xs" isModActive={isModActive} />
            {/* Live buzzing broadcast badge in glass shaded red box with rounded corners */}
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-red-950/40 border border-red-500/35 backdrop-blur-md shadow-[0_0_14px_rgba(239,68,68,0.25)] text-[10px] font-mono font-semibold text-red-100">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_#ef4444]" />
              </span>
              <span>LIVE</span>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border text-[10px] font-mono font-semibold tracking-wider uppercase shadow-sm ${
              isMagicCup 
                ? 'bg-rose-500/[0.08] border-rose-400/30 text-rose-300' 
                : isPlatinum
                ? 'bg-indigo-500/[0.08] border-indigo-400/30 text-indigo-300'
                : isRunnerUp || isPlayoffDefeat
                ? 'bg-slate-500/[0.08] border-slate-400/30 text-slate-300'
                : isSurvived
                ? 'bg-emerald-500/[0.08] border-emerald-400/30 text-emerald-300'
                : 'bg-amber-500/[0.08] border-amber-400/30 text-amber-300'
            }`}>
              {presentationBadgeText}
            </span>
          </div>

          {/* Golden / Silver / Shield Kicker */}
          <div className={`flex items-center justify-center gap-1.5 font-semibold text-[11px] sm:text-xs tracking-wider uppercase mt-0.5 mb-1 ${
            isSurvived ? 'text-emerald-300' : isRunnerUp || isPlayoffDefeat ? 'text-slate-300' : isPlatinum ? 'text-indigo-300' : 'text-amber-400'
          }`}>
            <span>{isSurvived ? '🛡️' : isPlayoffDefeat ? '⚔️' : '★'}</span>
            <span className="truncate max-w-[280px] sm:max-w-none">{kickerText}</span>
            <span>{isSurvived ? '🛡️' : isPlayoffDefeat ? '⚔️' : '★'}</span>
          </div>

          {/* Headline Title */}
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight uppercase leading-tight my-1">
            {headlineText}
          </h2>

          {/* Magic Cup Run: Knockout Journey Tracker Strip */}
          {isMagicCup && (
            <div className="w-full mt-2 mb-1 p-2 sm:p-2.5 rounded-2xl bg-[#10121a] border border-white/[0.04] flex items-center justify-around text-[9px] sm:text-xs font-mono">
              <div className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0">
                <span>QF</span>
                <i className="fas fa-check text-[9px]" />
              </div>
              <span className="text-zinc-600 shrink-0">→</span>
              <div className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0">
                <span>SEMI</span>
                <i className="fas fa-check text-[9px]" />
              </div>
              <span className="text-zinc-600 shrink-0">→</span>
              <div className="flex items-center gap-1 text-amber-300 font-semibold bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded-lg border border-amber-500/20 shrink-0">
                <span>CHAMPIONS</span>
                <span>🏆</span>
              </div>
            </div>
          )}

          {/* Narrative Body Prose */}
          <p className="text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed max-w-md mx-auto my-2">
            {isPlayoffDefeat ? (
              <>
                {toast.subtitle || `Fought valiantly in the promotion decider, but missed out on promotion. ${state?.club?.name} remains in ${currentLeague.name} for the upcoming campaign.`}
              </>
            ) : isSurvived ? (
              <>
                Dramatic Decision Day survival! <strong className="text-white font-semibold">{state?.club?.name}</strong> stands firm under maximum pressure to defend their status in <strong className="text-emerald-300 font-semibold">{currentLeague.name}</strong>, securing {playedTier === 1 ? 'top-flight' : currentLeague.name} handball for next season to the roaring relief of supporters!
              </>
            ) : isRunnerUp ? (
              <>
                {playedTier === 1 ? (
                  <>
                    A valiant league campaign! <strong className="text-white font-semibold">{state?.club?.name}</strong> claims the silver medal as official <strong className="text-slate-200 font-semibold">{currentLeague.name} Runner-Up</strong> and secures automatic qualification for next season's <strong className="text-amber-300 font-semibold">EHF Champions League</strong> in front of roaring fans!
                  </>
                ) : (
                  <>
                    A sensational promotion triumph! <strong className="text-white font-semibold">{state?.club?.name}</strong> claims the silver medal as official <strong className="text-slate-200 font-semibold">{currentLeague.name} Runner-Up</strong> and secures promotion to next season's <strong className="text-emerald-400 font-semibold">{getLeagueInfo(Math.max(1, playedTier - 1), state?.club?.country || 'GER').name}</strong> in front of roaring fans!
                  </>
                )}
              </>
            ) : isSuperGlobe ? (
              <>
                An extraordinary global achievement! <strong className="text-white font-semibold">{state?.club?.name}</strong> conquers the world to hoist the prestigious <strong className="text-amber-300 font-semibold">IHF Super Globe Trophy</strong> into the sky in front of roaring fans!
              </>
            ) : isChampionsLeague ? (
              <>
                The pinnacle of European club handball! <strong className="text-white font-semibold">{state?.club?.name}</strong> ascends to continental glory, conquering Europe to hoist the prestigious <strong className="text-amber-300 font-semibold">EHF Champions League Trophy</strong> into the sky!
              </>
            ) : isPlatinum ? (
              <>
                European silverware raised high! <strong className="text-white font-semibold">{state?.club?.name}</strong> triumphs on the continental stage, hoisting the prestigious <strong className="text-amber-300 font-semibold">{formattedTrophyName}</strong> in front of ecstatic fans!
              </>
            ) : isCup ? (
              <>
                Cup final triumph! <strong className="text-white font-semibold">{state?.club?.name}</strong> captures silverware in the showpiece event, hoisting the prestigious <strong className="text-amber-300 font-semibold">{formattedTrophyName}</strong> in front of ecstatic travelling supporters!
              </>
            ) : isMagicCup ? (
              <>
                An unforgettable giant-killing campaign etched into history! <strong className="text-white font-semibold">{state?.club?.name}</strong> completes a breathtaking Magic Cup Run to hoist the prestigious <strong className="text-amber-300 font-semibold">{displayTrophyTitle.replace(/!+$/, '')}</strong> trophy into the arena rafters!
              </>
            ) : (
              <>
                A commendable season! <strong className="text-white font-semibold">{state?.club?.name}</strong> completes the campaign in <strong className="text-slate-200 font-semibold">{currentLeague.name}</strong> with pride and determination in front of roaring supporters!
              </>
            )}
          </p>

          {/* Continental / World Tournament Final Showcase Card */}
          {isPlatinum && (
            <div className="w-full mt-2 mb-2 bg-indigo-500/[0.04] rounded-2xl p-3 sm:p-3.5 border border-indigo-500/20 text-center shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-semibold flex items-center justify-center gap-1.5 pb-1 mb-1 border-b border-white/[0.04]">
                <i className="fas fa-star text-amber-400" />
                <span>{isSuperGlobe ? 'IHF CLUB WORLD CHAMPIONSHIP' : 'EHF CONTINENTAL SHOWPIECE'}</span>
                <i className="fas fa-star text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-semibold text-white tracking-tight py-1">
                {state?.club?.name} {isSuperGlobe ? 'World Champions' : 'European Champions'}!
              </div>
              <div className="text-xs text-indigo-200/90 font-normal">
                {toast.subtitle || 'Historic final victory on the international stage'}
              </div>
            </div>
          )}

          {/* Domestic Cup Final Showcase Card */}
          {isCup && !isMagicCup && !isSurvived && (
            <div className="w-full mt-2 mb-2 bg-amber-500/[0.04] rounded-2xl p-3 sm:p-3.5 border border-amber-500/20 text-center shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-semibold flex items-center justify-center gap-1.5 pb-1 mb-1 border-b border-white/[0.04]">
                <i className="fas fa-shield-halved text-amber-400" />
                <span>FINAL FOUR · CUP TRIUMPH</span>
                <i className="fas fa-shield-halved text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-semibold text-white tracking-tight py-1">
                {state?.club?.name}
              </div>
              <div className="text-xs text-amber-200/90 font-normal">
                {toast.subtitle || 'Silverware secured in the national cup final'}
              </div>
            </div>
          )}

          {/* Decision Day / League Standings Table (ONLY for domestic league finishes) */}
          {showLeagueStandingsTable && (
            <div className="w-full mt-2 mb-2 bg-[#10121a] rounded-2xl p-2.5 sm:p-3 border border-white/[0.04] text-left shadow-inner">
              {/* Header Bar */}
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center justify-between pb-2 mb-2 border-b border-white/[0.04]">
                <span className="flex items-center gap-1.5 font-semibold">
                  <i className="fas fa-table-list text-amber-400 text-xs" />
                  <span>OFFICIAL LIVE STANDINGS · FINAL TABLE</span>
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">DECISION DAY</span>
              </div>

              {/* Table Column Headers */}
              <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 px-2.5 sm:px-3 py-1 mb-1 border-b border-white/[0.04]">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="w-5 text-center shrink-0">#</span>
                  <span>Club</span>
                </div>
                <div className="flex items-center shrink-0 font-mono">
                  <span className="hidden sm:inline-block w-14 text-right pr-2">GD</span>
                  <span className="w-14 sm:w-20 text-right pr-1.5 sm:pr-2">PTS</span>
                  <span className="w-20 sm:w-28 text-right">Status</span>
                </div>
              </div>

              {/* Table Rows with aligned columns */}
              <div className="flex flex-col gap-1.5 text-xs">
                {standings.map((t: any, idx: number) => {
                  const isPlayer = t.isPlayer || t.name === state?.club?.name;
                  return (
                    <div
                      key={`${t.name}-${idx}`}
                      className={`flex items-center justify-between py-2 px-2.5 sm:px-3 rounded-xl border text-[11px] sm:text-xs transition ${
                        isPlayer
                          ? isRunnerUp
                            ? 'bg-slate-400/[0.08] border-slate-400/30 text-slate-100 font-semibold shadow-sm'
                            : 'bg-amber-500/[0.06] border-amber-500/30 text-amber-200 font-semibold shadow-sm'
                          : 'bg-white/[0.02] border-white/[0.04] text-zinc-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className={`w-5 text-center font-mono font-semibold shrink-0 tabular-nums ${isPlayer ? (isRunnerUp ? 'text-slate-200' : 'text-amber-300') : 'text-zinc-500'}`}>
                          {t.pos}.
                        </span>
                        <span className={`truncate font-medium ${isPlayer ? 'text-white' : 'text-zinc-200'}`}>
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center shrink-0 font-mono">
                        <span className="hidden sm:inline-block w-14 text-right pr-2 text-zinc-400 tabular-nums text-xs font-medium">
                          {t.diff}
                        </span>
                        <span className={`w-14 sm:w-20 text-right pr-1.5 sm:pr-2 tabular-nums text-xs font-semibold ${isPlayer ? (isRunnerUp ? 'text-slate-200' : 'text-amber-300') : 'text-white'}`}>
                          {t.pts} <span className="hidden sm:inline text-[10px] font-medium text-zinc-400">PTS</span>
                        </span>
                        <div className="w-20 sm:w-28 flex justify-end">
                          <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md font-semibold tracking-tight shrink-0 border ${
                            isPlayer 
                              ? isRunnerUp
                                ? 'bg-slate-400/20 text-slate-200 border-slate-400/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-400/30' 
                              : 'bg-white/5 text-zinc-400 border-white/10'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Complete Season / Continue Button Footer */}
        <div className="p-3 sm:p-4 border-t border-white/[0.04] bg-[#14151e]/95 backdrop-blur-md flex items-center justify-center shrink-0 w-full z-20">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-w-[240px] py-3.5 px-10 rounded-2xl font-semibold text-sm tracking-wide text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-[0_4px_20px_rgba(37,99,235,0.3)] border border-sky-300/30 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group touch-manipulation"
          >
            <span>Complete Season</span>
            <i className="fas fa-chevron-right text-xs group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};