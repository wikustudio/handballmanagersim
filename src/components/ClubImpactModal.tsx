import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { calculateClubFinancials, getLeagueScaledVal, getCreditLimit, formatMoney } from '../data/gameConstants';
import { useGameStore } from '../store/useGameStore';
import { getOrGenerateRoadmap } from '../utils/roadmapManager';
import { useModalDismiss } from '../utils/modalUtils';

interface ClubImpactModalProps {
  state: GameState;
  lang: Language;
  onClose: () => void;
  onOpenTeamBonding?: () => void;
  onOpenClubProfile?: () => void;
  onBack?: () => void;
}

export const ClubImpactModal: React.FC<ClubImpactModalProps> = ({
  state,
  onClose,
  onBack,
}) => {
  useModalDismiss(onClose);

  const impactScore = Math.round(state.clubImpactScore ?? 50);
  const morale = state.club.morale ?? 100;
  const shields = state.immunityShields ?? 0;

  const targetPos = state.boardTargetFinish || state.boardTargetPos || 15;
  const roadmap = getOrGenerateRoadmap(state.boardRoadmap, state.club, state.year || 2024, state.history);
  const completedGoalsCount = roadmap.goals.filter(g => g.completed).length;

  // Pillar 1: Financial Health
  const stableThreshold = Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country));
  let finPercent = 85;
  if (state.budget < 0) {
    finPercent = Math.max(12, Math.round(40 - Math.min(28, (Math.abs(state.budget) / 1000000) * 10)));
  } else {
    finPercent = 70;
    if (state.budget > 1000000) finPercent += 15;
    if ((state.seasonsInDebt || 0) === 0) finPercent += 10;
    finPercent = Math.min(100, finPercent);
  }
  const finStatus = state.budget < 0 ? 'Deficit' : state.budget < stableThreshold ? 'Stable' : 'Surplus';
  const finDotClass =
    state.budget < 0 ? 'bg-rose-400' : state.budget < stableThreshold ? 'bg-amber-400' : 'bg-emerald-400';
  const finBarClass =
    state.budget < 0 ? 'bg-rose-500' : state.budget < stableThreshold ? 'bg-amber-400' : 'bg-emerald-400';

  // Pillar 2: Squad Morale
  const harmonyPercent = Math.min(100, Math.max(10, Math.round(morale)));
  const moraleStatus = morale < 45 ? 'Critical' : morale <= 80 ? 'Stable' : 'Optimal';
  const moraleDotClass = morale < 45 ? 'bg-rose-400' : morale <= 80 ? 'bg-amber-400' : 'bg-emerald-400';
  const moraleBarClass = morale < 45 ? 'bg-rose-500' : morale <= 80 ? 'bg-amber-400' : 'bg-emerald-400';

  // Pillar 3: Fan Support & Arena
  const stadiumCap = state.club.stadium || 2000;
  const financials = calculateClubFinancials(state);
  const expectedAtt = financials.expectedAtt || Math.min(stadiumCap, state.club.fanBase || 500);
  const fanApproval = stadiumCap > 0 ? Math.min(100, Math.round((expectedAtt / stadiumCap) * 100)) : 50;
  const fanStatus = fanApproval < 40 ? 'Restless' : fanApproval <= 75 ? 'Content' : 'Electric';
  const fanDotClass = fanApproval < 40 ? 'bg-rose-400' : fanApproval <= 75 ? 'bg-sky-400' : 'bg-emerald-400';
  const fanBarClass = fanApproval < 40 ? 'bg-rose-500' : fanApproval <= 75 ? 'bg-sky-400' : 'bg-emerald-400';

  const bondingCost = Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country));
  const creditLimit = getCreditLimit(state.club.tier || 1, state.club.country || 'GER');
  const isBondingLimitReached = (state.teamBondingThisSeason || 0) >= 1;
  const canAffordBonding = state.budget + creditLimit >= bondingCost;

  const handleBondTeamInPlace = () => {
    if (isBondingLimitReached || !canAffordBonding || morale >= 100) return;
    useGameStore.getState().teamBonding(bondingCost);
    useGameStore.getState().updateState({
      notifications: [
        {
          id: Math.random().toString(),
          type: 'success',
          message: 'Successful Team Bonding! Squad morale increased by +30%.',
          read: false,
        },
        ...(useGameStore.getState().notifications || []),
      ],
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Ring geometry matching DashboardHeader CircularRing
  const ringSize = 68;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.max(0, Math.min(100, impactScore));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;
  const ringColor = impactScore >= 80 ? '#34d399' : impactScore <= 30 ? '#f43f5e' : '#f59e0b';

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-[10050] backdrop-blur-2xl"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] w-full max-w-2xl rounded-[28px] flex flex-col max-h-[90vh] shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/[0.04] relative overflow-hidden cursor-default"
      >
        {/* Top Ambient Hairline */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center p-5 pb-3 border-b border-white/[0.04] shrink-0 bg-[#14151e]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition text-zinc-400 hover:text-white cursor-pointer border border-white/[0.04] active:scale-95 shrink-0"
                title="Back"
              >
                <i className="fas fa-arrow-left text-xs" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-base border border-amber-500/20 shrink-0">
              <i className="fas fa-bolt" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 leading-none mb-1">
                GOVERNANCE & BOARD TRUST
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none">
                Club Impact & Mandate
              </h2>
            </div>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition text-zinc-400 hover:text-white cursor-pointer border border-white/[0.04] active:scale-95"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {/* Top Bento Grid matching DashboardHeader */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. IMPACT Ring Card */}
            <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  IMPACT
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      impactScore >= 80 ? 'bg-emerald-400' : impactScore <= 30 ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                  />
                  {impactScore >= 80 ? 'Delighted' : impactScore <= 30 ? 'At Risk' : 'Stable'}
                </span>
              </div>

              <div className="flex items-center gap-3.5 my-3">
                <div className="relative flex items-center justify-center shrink-0" style={{ width: ringSize, height: ringSize }}>
                  <svg className="transform -rotate-90" width={ringSize} height={ringSize}>
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke={ringColor}
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-semibold text-white tracking-tight tabular-nums leading-none">
                      {impactScore}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">Board Confidence</div>
                  <div className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                    Safe above <span className="text-zinc-300 font-mono">30</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Dismissal Floor</span>
                <span className="font-mono text-zinc-300 tabular-nums">30 / 100</span>
              </div>
            </div>

            {/* 2. SEASON MANDATE Card */}
            <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  SEASON TARGET
                </span>
                <i className="fas fa-crosshairs text-zinc-600 text-xs" />
              </div>

              <div className="my-3">
                <div className="text-lg sm:text-xl font-semibold text-white tracking-tight tabular-nums">
                  {state.boardTargetPos
                    ? `Place ${state.boardTargetPos} or better`
                    : state.boardExpectation || `Place ${targetPos} or better`}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Meeting the league target maintains board trust at season end.
                </p>
              </div>

              <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">League Tier</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 tabular-nums">
                  Tier {state.club.tier || 1}
                </span>
              </div>
            </div>

            {/* 3. IMMUNITY SHIELDS Card */}
            <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  JOB SECURITY
                </span>
                <i className="fas fa-shield-halved text-zinc-600 text-xs" />
              </div>

              <div className="my-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight tabular-nums">
                    {shields}
                  </span>
                  <span className="text-xs font-medium text-emerald-400">
                    {shields === 1 ? 'Shield Active' : 'Shields Active'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                  Each shield blocks one board dismissal if confidence drops below 30.
                </p>
              </div>

              <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Protection</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                  {shields > 0 ? 'Protected' : 'Unshielded'}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Core Pillars */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                CORE IMPACT PILLARS
              </span>
              <span className="text-[11px] text-zinc-500">
                Direct drivers of board confidence
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Financial Health */}
              <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      FINANCES
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${finDotClass}`} />
                      {finStatus}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                    {finPercent}%
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden my-3">
                    <div
                      className={`h-full rounded-full ${finBarClass}`}
                      style={{ width: `${finPercent}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] tabular-nums">
                  <span className="text-zinc-500">Treasury</span>
                  <span className="text-zinc-300 font-mono">
                    {state.budget >= 0
                      ? formatMoney(state.budget)
                      : `-${formatMoney(Math.abs(state.budget))}`}
                  </span>
                </div>
              </div>

              {/* 2. Squad Morale */}
              <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      MORALE
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${moraleDotClass}`} />
                      {moraleStatus}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                    {harmonyPercent}%
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden my-3">
                    <div
                      className={`h-full rounded-full ${moraleBarClass}`}
                      style={{ width: `${harmonyPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/[0.04]">
                  {morale < 100 && !isBondingLimitReached ? (
                    <button
                      onClick={handleBondTeamInPlace}
                      disabled={!canAffordBonding}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-[#181924] hover:bg-white/[0.06] border border-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>Team Bonding (+30%)</span>
                      <span className="tabular-nums font-mono text-emerald-400">
                        -{formatMoney(bondingCost)}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Locker Room</span>
                      <span className="text-zinc-300 font-mono">
                        {morale >= 100 ? '100% Max' : '1/1 Used'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Fan Support */}
              <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      FAN SUPPORT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${fanDotClass}`} />
                      {fanStatus}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                    {fanApproval}%
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden my-3">
                    <div
                      className={`h-full rounded-full ${fanBarClass}`}
                      style={{ width: `${fanApproval}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] tabular-nums">
                  <span className="text-zinc-500">Attendance</span>
                  <span className="text-zinc-300 font-mono">
                    {expectedAtt.toLocaleString()} / {stadiumCap.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Board Roadmap Checklist */}
          <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                BOARD OBJECTIVES ({roadmap.startYear}–{roadmap.endYear})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 tabular-nums">
                {completedGoalsCount}/{roadmap.goals.length} Completed
              </span>
            </div>

            <div className="space-y-2">
              {roadmap.goals.map((g, idx) => (
                <div
                  key={`impact-goal-${g.id || idx}-${idx}`}
                  className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                    g.completed
                      ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                      : 'bg-[#181924] border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        g.completed
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-white/[0.05] text-zinc-400'
                      }`}
                    >
                      {g.completed ? '✓' : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">{g.titleEn}</div>
                      <div className="text-[11px] text-zinc-500 truncate">{g.descriptionEn}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-amber-400 shrink-0 tabular-nums">
                    +{g.rewardMp} MP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
