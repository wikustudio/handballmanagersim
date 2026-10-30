import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Club, GameState, MatchdayOutcome, PendingSeasonState } from '../types';
import { getLeagueInfo } from '../data/gameConstants';
import { calculateProbabilisticSeason } from '../engine/seasonSimEngine';
import { ClubLogo } from './ClubLogo';

export const getClubOvr = (c: any, fallback = 70): number => {
  const val = Number(c?.baseOvr ?? c?.ovr ?? c?.rating ?? c?.overall);
  return Number.isFinite(val) && val > 0 ? Math.round(val) : fallback;
};

interface SimulatingOverlayProps {
  isOpen: boolean;
  gameState: GameState;
  clubsDb?: Club[];
  isModActive?: boolean;
  onSyncPendingSeason?: (synced: PendingSeasonState) => void;
  onComplete: () => void;
  onTriggerMidSeasonDilemma?: () => void;
}

export const SimulatingOverlay: React.FC<SimulatingOverlayProps> = ({
  isOpen,
  gameState,
  clubsDb = [],
  isModActive = false,
  onSyncPendingSeason,
  onComplete,
  onTriggerMidSeasonDilemma,
}) => {
  const isSecondHalf = gameState.seasonPhase === 'mid';
  const country = gameState.club?.country || 'GER';
  const tier = gameState.club?.tier || 1;
  const league = getLeagueInfo(tier, country);
  const tierBenchmarkOvr = getClubOvr({ baseOvr: league?.avgOvr }, 70);
  const playerOvr = getClubOvr(gameState?.club, 65);

  // 2-Half Dynamic Outcome Sync:
  // Lock 1st-half outcomes in pendingSeasonState._meta.
  // When entering second_half, if playerOvr, morale, or tactic changed during a Mid-Season Dilemma or Winter Break transfers,
  // dynamically recalculate the 2nd-half outcomes and blend them with the locked 1st-half outcomes.
  const activePending = useMemo<PendingSeasonState>(() => {
    const existing = gameState.pendingSeasonState;
    const currentMorale = Number.isFinite(Number(gameState.club?.morale))
      ? Number(gameState.club.morale)
      : 100;
    const currentTactic = gameState.tactic || 'Total Football';
    const currentCoachId = gameState.currentCoach?.id || 'none';
    const currentCoachStyle = gameState.currentCoach?.style || 'none';
    const currentHasBounce = Boolean(gameState.hasNewManagerBounce);
    const currentSkillsKey = (gameState.managerSkills || []).slice().sort().join(',');
    const currentStadium = gameState.club?.stadium || 0;
    const currentStadiumPolicy = gameState.stadiumPolicy || 'balanced';

    if (!existing || !Array.isArray(existing.matchdaySchedule) || existing.matchdaySchedule.length === 0) {
      return calculateProbabilisticSeason(gameState, clubsDb, isModActive);
    }

    if (
      isSecondHalf &&
      existing._meta &&
      (existing._meta.ovrAtCalculation !== playerOvr ||
        existing._meta.moraleAtCalculation !== currentMorale ||
        existing._meta.tacticAtCalculation !== currentTactic ||
        (existing._meta.coachIdAtCalculation ?? currentCoachId) !== currentCoachId ||
        (existing._meta.coachStyleAtCalculation ?? currentCoachStyle) !== currentCoachStyle ||
        (existing._meta.hasBounceAtCalculation ?? currentHasBounce) !== currentHasBounce ||
        (existing._meta.skillsKeyAtCalculation ?? currentSkillsKey) !== currentSkillsKey ||
        (existing._meta.stadiumAtCalculation ?? currentStadium) !== currentStadium ||
        (existing._meta.stadiumPolicyAtCalculation ?? currentStadiumPolicy) !== currentStadiumPolicy)
    ) {
      return calculateProbabilisticSeason(gameState, clubsDb, isModActive, {
        lockFirstHalfFrom: existing,
        dilemmaChoice: existing.dilemmaChoice,
      });
    }

    return existing;
  }, [
    gameState.pendingSeasonState,
    isSecondHalf,
    playerOvr,
    gameState.club?.morale,
    gameState.tactic,
    gameState.currentCoach?.id,
    gameState.currentCoach?.style,
    gameState.hasNewManagerBounce,
    gameState.managerSkills,
    gameState.club?.stadium,
    gameState.stadiumPolicy,
    clubsDb,
    isModActive,
  ]);

  const schedule: MatchdayOutcome[] = activePending?.matchdaySchedule || activePending?.schedule || [];
  const totalMatchdays = activePending?.totalMatchdays || schedule.length || 34;
  const halfwayMatchday = activePending?.dilemmaMatchday || Math.max(1, Math.floor(totalMatchdays / 2));

  const startIdx = isSecondHalf
    ? Math.min(Math.max(0, halfwayMatchday), Math.max(0, schedule.length - 1))
    : 0;
  const targetEndIdx = isSecondHalf
    ? Math.max(0, schedule.length - 1)
    : Math.min(Math.max(0, halfwayMatchday - 1), Math.max(0, schedule.length - 1));
  const targetEnd = isSecondHalf ? totalMatchdays : halfwayMatchday;

  const [currentIdx, setCurrentIdx] = useState<number>(startIdx);
  const [isFastMode, setIsFastMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('fms_sim_fast') === '1';
    } catch {
      return false;
    }
  });
  const completedRef = useRef(false);

  const toggleFastMode = () => {
    setIsFastMode((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('fms_sim_fast', next ? '1' : '0');
      } catch {
        // ignore storage restrictions
      }
      return next;
    });
  };

  const onSyncRef = useRef(onSyncPendingSeason);
  onSyncRef.current = onSyncPendingSeason;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onTriggerMidSeasonDilemmaRef = useRef(onTriggerMidSeasonDilemma);
  onTriggerMidSeasonDilemmaRef.current = onTriggerMidSeasonDilemma;

  const handleSkipSim = () => {
    if (completedRef.current) return;
    setCurrentIdx(targetEndIdx);
    completedRef.current = true;
    if (!isSecondHalf && onTriggerMidSeasonDilemmaRef.current) {
      onTriggerMidSeasonDilemmaRef.current();
    } else {
      onCompleteRef.current();
    }
  };

  // Sync the exact sum of visual userGoals (gf) and oppGoals (ga) and 3-1-0 points back to pendingSeasonState
  useEffect(() => {
    if (!isOpen || schedule.length === 0) return;

    const totalVisualGf = schedule.reduce((sum, m) => sum + (Number(m.userGoals) || 0), 0);
    const totalVisualGa = schedule.reduce((sum, m) => sum + (Number(m.oppGoals) || 0), 0);
    const totalWins = schedule.filter((m) => m.result === 'W').length;
    const totalDraws = schedule.filter((m) => m.result === 'D').length;
    const totalLosses = schedule.filter((m) => m.result === 'L').length;
    const totalPts = totalWins * 3 + totalDraws;
    const firstHalfSlice = schedule.slice(0, halfwayMatchday);

    if (gameState.pendingSeasonState) {
      gameState.pendingSeasonState.gf = totalVisualGf;
      gameState.pendingSeasonState.ga = totalVisualGa;
      gameState.pendingSeasonState.gd = totalVisualGf - totalVisualGa;
      gameState.pendingSeasonState.wins = totalWins;
      gameState.pendingSeasonState.draws = totalDraws;
      gameState.pendingSeasonState.losses = totalLosses;
      gameState.pendingSeasonState.pts = totalPts;
      gameState.pendingSeasonState.schedule = schedule;
      gameState.pendingSeasonState.matchdaySchedule = schedule;
      if (gameState.pendingSeasonState._meta) {
        gameState.pendingSeasonState._meta.firstHalfOutcomes = firstHalfSlice;
      }
    }

    if (onSyncRef.current && activePending !== gameState.pendingSeasonState) {
      onSyncRef.current({
        ...activePending,
        gf: totalVisualGf,
        ga: totalVisualGa,
        gd: totalVisualGf - totalVisualGa,
        wins: totalWins,
        draws: totalDraws,
        losses: totalLosses,
        pts: totalPts,
        schedule,
        matchdaySchedule: schedule,
      });
    }
  }, [isOpen, activePending, schedule, halfwayMatchday]);

  // Reset index when opening or switching season half
  useEffect(() => {
    if (!isOpen) {
      completedRef.current = false;
      return;
    }
    completedRef.current = false;
    setCurrentIdx(startIdx);
  }, [isOpen, startIdx]);

  // Matchday tick loop
  useEffect(() => {
    if (!isOpen) return;

    if (schedule.length === 0) {
      const fallbackTimer = setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current();
        }
      }, 450);
      return () => clearTimeout(fallbackTimer);
    }

    if (currentIdx >= targetEndIdx) {
      const finishTimer = setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          if (!isSecondHalf && onTriggerMidSeasonDilemmaRef.current) {
            onTriggerMidSeasonDilemmaRef.current();
          } else {
            onCompleteRef.current();
          }
        }
      }, isFastMode ? 220 : 520);
      return () => clearTimeout(finishTimer);
    }

    const tickTimer = setTimeout(() => {
      setCurrentIdx((prev) => Math.min(targetEndIdx, prev + 1));
    }, isFastMode ? 38 : 95);

    return () => clearTimeout(tickTimer);
  }, [isOpen, currentIdx, targetEndIdx, schedule.length, isSecondHalf, isFastMode]);

  if (!isOpen) return null;

  const safeIdx = Math.min(Math.max(0, currentIdx), Math.max(0, schedule.length - 1));
  const currentMatch: MatchdayOutcome | undefined = schedule[safeIdx];
  const matchday = currentMatch?.matchday || safeIdx + 1;

  // Cumulative stats up to current matchday (strictly 3-1-0 scoring)
  const playedUpToNow = schedule.slice(0, safeIdx + 1);
  const cumulativeStats = {
    wins: playedUpToNow.filter((m) => m.result === 'W').length,
    draws: playedUpToNow.filter((m) => m.result === 'D').length,
    losses: playedUpToNow.filter((m) => m.result === 'L').length,
    pts: 0,
  };
  cumulativeStats.pts = cumulativeStats.wins * 3 + cumulativeStats.draws;

  const userGoals = Number.isFinite(Number(currentMatch?.userGoals)) ? Number(currentMatch?.userGoals) : 1;
  const oppGoals = Number.isFinite(Number(currentMatch?.oppGoals)) ? Number(currentMatch?.oppGoals) : 0;
  const result: 'W' | 'D' | 'L' =
    currentMatch?.result || (userGoals > oppGoals ? 'W' : userGoals === oppGoals ? 'D' : 'L');

  const oppOvr = getClubOvr({ baseOvr: currentMatch?.opponentOvr }, tierBenchmarkOvr);
  const oppName = currentMatch?.opponentName || 'Division Rival';
  const oppClubObj = {
    id: currentMatch?.opponentId || 9999,
    name: oppName,
    logo: currentMatch?.opponentLogo,
    fallbackLogo: currentMatch?.opponentFallbackLogo,
    color: currentMatch?.opponentColor || '38bdf8',
    baseOvr: oppOvr,
  };

  // Relegation struggle check (excluding newly relegated or top-half clubs)
  const lastHist =
    gameState.history && gameState.history.length > 0
      ? gameState.history[gameState.history.length - 1]
      : undefined;
  const isNewlyRelegated = Boolean(lastHist && (lastHist as any).relegated);
  const isProvenTopHalf = Boolean(lastHist && lastHist.pos <= 9);
  const isRelegationSeason =
    !isNewlyRelegated &&
    !isProvenTopHalf &&
    (playerOvr < tierBenchmarkOvr - 2 || (activePending?.approxPos || 9) >= 15);

  // Bidirectional Momentum Calculation [-50, +50], strictly guarded against NaN
  const rawOvrDelta = playerOvr - oppOvr;
  const goalDiff = userGoals - oppGoals;
  const rawMomentum =
    result === 'W'
      ? Math.min(48, Math.max(12, 22 + goalDiff * 10 - rawOvrDelta * 1.2))
      : result === 'L'
      ? Math.max(-48, Math.min(-12, -22 + goalDiff * 10 - rawOvrDelta * 1.2))
      : Math.max(-8, Math.min(8, -rawOvrDelta * 0.8));
  const liveMomentumPercent = Number.isFinite(rawMomentum) ? Math.round(rawMomentum) : 0;

  // Progress fraction within the current half
  const halfSpan = Math.max(1, targetEndIdx - startIdx + 1);
  const rawProgressFraction = (safeIdx - startIdx + 1) / halfSpan;
  const progressFraction = Number.isFinite(rawProgressFraction)
    ? Math.max(0, Math.min(1, rawProgressFraction))
    : 1;
  const progressPct = Number.isFinite(progressFraction) ? Math.round(progressFraction * 100) : 100;
  const isFinishing = safeIdx >= targetEndIdx;

  // Ambient glow & status dot colors
  const ambientGlowClass =
    result === 'W'
      ? 'bg-emerald-500/20'
      : result === 'D'
      ? 'bg-amber-500/10'
      : 'bg-rose-500/20';

  const statusDotClass =
    result === 'W'
      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
      : result === 'D'
      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
      : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]';

  // Outcome pill under score
  const outcomePill =
    result === 'W'
      ? {
          text: 'FT · WIN (+3P)',
          cls: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        }
      : result === 'D'
      ? {
          text: 'FT · DRAW (+1P)',
          cls: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        }
      : {
          text: 'FT · LOSS',
          cls: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
        };

  // Dynamic Form Pill in Momentum Swings header
  const formPill =
    result === 'W'
      ? {
          text: playerOvr < oppOvr - 2 ? '+3 FORM · UPSET VICTORY!' : '+2 FORM · MATCHDAY WIN',
          cls: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        }
      : result === 'D'
      ? {
          text: '±0 FORM · LEVEL PEGGING',
          cls: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
        }
      : {
          text: isRelegationSeason ? '-3 FORM · RELEGATION STRUGGLE' : '-2 FORM · UNDER PRESSURE',
          cls: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
        };

  // Active soundwave bars calculation (0..11 left/negative, 12..23 right/positive)
  const posActiveBars =
    liveMomentumPercent > 0 ? Math.min(12, Math.max(2, Math.round((liveMomentumPercent / 50) * 12))) : 0;
  const negActiveBars =
    liveMomentumPercent < 0 ? Math.min(12, Math.max(2, Math.round((Math.abs(liveMomentumPercent) / 50) * 12))) : 0;

  return (
    <div className="fixed inset-0 z-[9995] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-[fadeIn_0.18s_ease-out]">
      <div className="w-full max-w-[380px] sm:max-w-[420px] bg-[#0e1018]/95 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
        {/* Dynamic Ambient Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${ambientGlowClass}`}
        />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${statusDotClass}`} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 truncate">
              {isSecondHalf
                ? '2ND HALF FINALE · CHAMPIONSHIP DECIDERS'
                : '1ST HALF CAMPAIGN · AUTUMN FIXTURES'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleFastMode}
              title={isFastMode ? 'Switch to 1x Speed' : 'Switch to 2x Fast-Forward'}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                isFastMode
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/[0.06] border-white/10 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {isFastMode ? '2X' : '1X'}
            </button>
            <button
              type="button"
              onClick={handleSkipSim}
              title="Skip to End of Half"
              className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-[10px] font-mono font-bold text-zinc-200 transition-colors cursor-pointer"
            >
              SKIP
            </button>
            <span className="px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/10 text-[10px] font-mono font-bold text-zinc-200 tabular-nums">
              MD {matchday}/{targetEnd}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
              {cumulativeStats.pts} PTS
            </span>
          </div>
        </div>

        {/* 5-Column Matchup Box (Cols 1-2 ALWAYS User Club, Col 3 Score, Cols 4-5 Opponent) */}
        <div className="relative z-10 grid grid-cols-5 items-center gap-2 bg-black/40 rounded-2xl p-4 border border-white/[0.08] mb-5">
          {/* Left: Cols 1-2 — ALWAYS User Club */}
          <div className="col-span-2 flex flex-col items-center text-center min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-1.5 mb-2 shadow-inner">
              <ClubLogo club={gameState.club} size={32} isModActive={isModActive} />
            </div>
            <div className="text-xs font-bold text-white truncate w-full px-1">
              {gameState.club?.name || 'Your Club'}
            </div>
            <div className="text-[10px] font-mono font-semibold text-zinc-400 mt-0.5 tabular-nums">
              OVR {playerOvr}
            </div>
          </div>

          {/* Center: Col 3 — Live Score & Outcome Badge */}
          <div className="col-span-1 flex flex-col items-center justify-center text-center">
            <div className="text-2xl sm:text-3xl font-mono font-black tracking-tight tabular-nums flex items-center justify-center gap-1 leading-none mb-2">
              <span
                className={
                  result === 'W'
                    ? 'text-emerald-400'
                    : result === 'L'
                    ? 'text-rose-400'
                    : 'text-amber-300'
                }
              >
                {userGoals}
              </span>
              <span className="text-zinc-600">:</span>
              <span className="text-white">{oppGoals}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap ${outcomePill.cls}`}
            >
              {outcomePill.text}
            </span>
          </div>

          {/* Right: Cols 4-5 — Opponent Club */}
          <div className="col-span-2 flex flex-col items-center text-center min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-1.5 mb-2 shadow-inner">
              <ClubLogo club={oppClubObj} size={32} isModActive={isModActive} />
            </div>
            <div className="text-xs font-bold text-white truncate w-full px-1">
              {oppName}
            </div>
            <div className="text-[10px] font-mono font-semibold text-zinc-400 mt-0.5 tabular-nums">
              OVR {oppOvr}
            </div>
          </div>
        </div>

        {/* Momentum Swings Section */}
        <div className="relative z-10 space-y-2.5 mb-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-zinc-400">
              Momentum Swings
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase tracking-wider ${formPill.cls}`}
            >
              {formPill.text}
            </span>
          </div>

          {/* Center-Anchored Bidirectional Momentum Bar */}
          <div className="h-2.5 bg-black/60 rounded-full relative overflow-hidden border border-white/[0.06]">
            <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-white/30 z-10" />
            {liveMomentumPercent >= 0 ? (
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-sky-500 to-emerald-400 rounded-r-full transition-all duration-150"
                style={{
                  left: '50%',
                  width: `${Math.min(50, Math.max(result === 'D' ? 3 : 6, liveMomentumPercent))}%`,
                }}
              />
            ) : (
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-l from-rose-500 to-amber-500 rounded-l-full transition-all duration-150"
                style={{
                  right: '50%',
                  width: `${Math.min(50, Math.max(6, Math.abs(liveMomentumPercent)))}%`,
                }}
              />
            )}
          </div>

          {/* 24-Bar Soundwave Visualizer */}
          <div className="flex items-center justify-between h-4 px-1 gap-1">
            {Array.from({ length: 24 }).map((_, i) => {
              const isRightSide = i >= 12;
              const distFromCenter = isRightSide ? i - 12 : 11 - i;
              const isPosLit = isRightSide && result === 'W' && distFromCenter < posActiveBars;
              const isNegLit = !isRightSide && result === 'L' && distFromCenter < negActiveBars;
              const isDrawPulse = result === 'D' && distFromCenter < 3;

              const barHeights = [35, 55, 75, 95, 65, 85, 100, 70, 50, 80, 60, 45];
              const hPct = barHeights[distFromCenter % barHeights.length];

              let colorCls = 'bg-white/10';
              if (isPosLit) {
                colorCls = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]';
              } else if (isNegLit) {
                colorCls = 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.6)]';
              } else if (isDrawPulse || result === 'D') {
                colorCls = distFromCenter < 4 ? 'bg-amber-400/60 animate-pulse' : 'bg-amber-400/40 animate-pulse';
              }

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-150 ${colorCls}`}
                  style={{
                    height: isPosLit || isNegLit ? `${hPct}%` : result === 'D' ? '45%' : '28%',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Footer Strip */}
        <div className="relative z-10 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <i
              className={`fa-solid fa-chess-knight text-xs ${
                result === 'W'
                  ? 'text-emerald-400'
                  : result === 'D'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            />
            <span className="font-semibold text-zinc-300 truncate">
              {gameState.tactic || '4-3-3 Gegenpressing'}
            </span>
          </div>

          <div className="font-mono font-bold text-zinc-400 tabular-nums shrink-0">
            {isFinishing
              ? `${cumulativeStats.pts} Pts (${cumulativeStats.wins}W ${cumulativeStats.draws}D ${cumulativeStats.losses}L)`
              : `${cumulativeStats.wins}W ${cumulativeStats.draws}D ${cumulativeStats.losses}L · ${progressPct}%`}
          </div>
        </div>
      </div>
    </div>
  );
};