import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameState, BoardRoadmap } from '../types';
import { getOrGenerateRoadmap } from '../utils/roadmapManager';
import { formatMoney } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';
import { useGameStore } from '../store/useGameStore';
import { ClubLogo } from './ClubLogo';

interface BoardRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  lang?: string;
}

export const BoardRoadmapModal: React.FC<BoardRoadmapModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  useModalDismiss(onClose, isOpen);

  const club = state.club;
  const clubWithBudget = { ...club, currentBudget: state.budget ?? club.currentBudget ?? 0 };
  const currentYear = state.year || 2024;
  const roadmap: BoardRoadmap = getOrGenerateRoadmap(state.boardRoadmap, clubWithBudget, currentYear, state.history);

  // Retroactively persist validated roadmap goals and award any missing rewards
  useEffect(() => {
    if (!isOpen) return;
    const store = useGameStore.getState();
    const storedRoadmap = store.boardRoadmap;

    let newlyCompletedMp = 0;
    let newlyCompletedCash = 0;

    const claimedGoals = roadmap.goals.map(syncedGoal => {
      const storedGoal = storedRoadmap?.goals?.find(g => g.id === syncedGoal.id || g.targetType === syncedGoal.targetType);
      if (syncedGoal.completed && (!storedGoal || (!storedGoal.completed && !storedGoal.rewardClaimed))) {
        newlyCompletedMp += syncedGoal.rewardMp || 0;
        newlyCompletedCash += syncedGoal.rewardCash || 0;
        return { ...syncedGoal, rewardClaimed: true };
      }
      return {
        ...syncedGoal,
        rewardClaimed: Boolean(syncedGoal.rewardClaimed || storedGoal?.rewardClaimed),
      };
    });

    const updatedRoadmap: BoardRoadmap = {
      ...roadmap,
      goals: claimedGoals,
    };

    const isDifferent = !storedRoadmap || JSON.stringify(storedRoadmap.goals) !== JSON.stringify(updatedRoadmap.goals);
    if (isDifferent) {
      store.updateState({
        boardRoadmap: updatedRoadmap,
        ...(newlyCompletedMp > 0 ? {
          skillPoints: (store.skillPoints || 0) + newlyCompletedMp,
        } : {}),
        ...(newlyCompletedCash > 0 ? {
          budget: store.budget + newlyCompletedCash,
        } : {}),
      });
    }
  }, [roadmap, isOpen]);

  if (!isOpen) return null;

  const completedCount = roadmap.goals.filter(g => g.completed).length;
  const totalGoals = roadmap.goals.length;
  const elapsedYears = Math.min(roadmap.horizonYears, Math.max(1, currentYear - roadmap.startYear + 1));
  const confidenceColor =
    roadmap.boardConfidence >= 75
      ? 'text-emerald-400'
      : roadmap.boardConfidence >= 50
      ? 'text-amber-400'
      : 'text-rose-400';

  const confidenceBg =
    roadmap.boardConfidence >= 75
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : roadmap.boardConfidence >= 50
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-rose-500/10 border-rose-500/30';

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl cursor-pointer">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#14151e] border border-white/[0.04] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh] cursor-default relative"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/25 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 pb-4 border-b border-white/[0.04] bg-[#14151e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#10121a] border border-white/[0.06] flex items-center justify-center shrink-0 p-1.5 shadow-sm overflow-hidden">
              <ClubLogo
                club={club}
                clubId={club.id}
                name={club.name}
                color={club.color}
                color2={club.color2}
                logo={club.logo}
                fallbackLogo={club.fallbackLogo}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                  Strategic Board Roadmap
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  {roadmap.horizonYears} Year Horizon
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                {club.name} · Season {currentYear} (Year {elapsedYears}/{roadmap.horizonYears})
              </p>
            </div>
          </div>

          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center text-sm transition cursor-pointer border border-white/[0.06] active:scale-95"
          >
            <i className="fas fa-xmark text-xs" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Main Roadmap Banner */}
          <div className="p-4 rounded-2xl bg-[#10121a] border border-white/[0.04] flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-medium tracking-wider text-sky-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Active Strategic Directive
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight mt-0.5">
                  {roadmap.titleEn || roadmap.titleDe}
                </h3>
              </div>

              {/* Board Confidence Meter */}
              <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2.5 shrink-0 ${confidenceBg}`}>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] uppercase font-medium text-zinc-400">
                    Board Confidence
                  </span>
                  <span className={`text-sm font-semibold tabular-nums ${confidenceColor}`}>
                    {roadmap.boardConfidence}%
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/40 border border-white/[0.04]">
                  <i className={`fas fa-handshake text-xs ${confidenceColor}`} />
                </div>
              </div>
            </div>

            {/* Context Narrative */}
            <p className="text-xs text-zinc-300 leading-relaxed bg-black/25 p-3 rounded-xl border border-white/[0.04]">
              <i className="fas fa-quote-left text-sky-400/40 mr-1.5" />
              {roadmap.narrativeEn || roadmap.narrativeDe}
            </p>

            {/* Horizon Timeline Bar */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                <span className="tabular-nums">Start: {roadmap.startYear}</span>
                <span className="text-sky-400 font-semibold tabular-nums">
                  Progress: {completedCount}/{totalGoals} Goals Met
                </span>
                <span className="tabular-nums">Target Horizon: {roadmap.endYear}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((elapsedYears / roadmap.horizonYears) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Contextual Roadmap Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Roadmap Milestones & Rewards
              </h4>
              <span className="text-[10px] text-zinc-500">
                Dynamically tailored to club tier & stature
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {roadmap.goals.map((goal, idx) => {
                const isComplete = Boolean(
                  goal.completed ||
                  (goal.targetType === 'arena_expansion' && (club.stadium || 0) >= goal.targetValue) ||
                  (goal.targetType === 'academy_growth' && (club.academyLevel || 1) >= goal.targetValue) ||
                  (goal.targetType === 'medical_growth' && (club.medicalLevel || 1) >= goal.targetValue) ||
                  (goal.targetType === 'promotion_tier' && (club.tier || 1) <= goal.targetValue) ||
                  (goal.targetType === 'fanbase_growth' && (club.fanBase || 0) >= goal.targetValue)
                );

                return (
                  <div
                    key={`roadmap-goal-${goal.id || idx}-${idx}`}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col gap-2.5 relative ${
                      isComplete
                        ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-sm'
                        : 'bg-[#10121a] border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                            isComplete
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                              : 'bg-white/[0.04] text-zinc-400 border border-white/[0.04] font-medium'
                          }`}
                        >
                          {isComplete ? '✓' : idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                              {goal.titleEn || goal.titleDe}
                            </h5>
                            {isComplete && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed font-normal">
                            {goal.descriptionEn || goal.descriptionDe}
                          </p>
                        </div>
                      </div>

                      {/* Goal Rewards Pill */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold text-[11px] tabular-nums flex items-center gap-1 shadow-sm">
                          <span>⭐</span>
                          <span>+{goal.rewardMp} MP</span>
                        </span>
                        {goal.rewardCash && (
                          <span className="text-[10px] font-medium text-emerald-400 tabular-nums">
                            +{formatMoney(goal.rewardCash)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-white/[0.04]">
                      <span>
                        Status:{' '}
                        <strong className={`font-semibold tabular-nums ${isComplete ? 'text-emerald-400' : 'text-zinc-200'}`}>
                          {isComplete
                            ? 'Achieved'
                            : goal.targetType === 'promotion_tier'
                            ? `Current Tier ${club.tier} → Target Tier ${goal.targetValue}`
                            : goal.targetType === 'championship_dominance'
                            ? `${goal.currentValue} / ${goal.targetValue} Titles`
                            : goal.targetType === 'european_glory'
                            ? `${goal.currentValue > 0 ? '1 Trophy Won' : '0 / 1 Trophy'}`
                            : goal.targetType === 'arena_expansion'
                            ? `${(club.stadium || 0).toLocaleString()} / ${goal.targetValue.toLocaleString()} Seats`
                            : goal.targetType === 'fanbase_growth'
                            ? `${(club.fanBase || goal.currentValue || 0).toLocaleString()} / ${goal.targetValue.toLocaleString()} Supporters`
                            : goal.targetType === 'academy_growth'
                            ? `Level ${club.academyLevel || 1} / ${goal.targetValue}`
                            : goal.targetType === 'medical_growth'
                            ? `Level ${club.medicalLevel || 1} / ${goal.targetValue}`
                            : goal.targetType === 'financial_surplus'
                            ? `${formatMoney(club.currentBudget || state.budget || 0)} / ${formatMoney(goal.targetValue)}`
                            : goal.targetType === 'solidify_tier'
                            ? `${goal.currentValue} / ${goal.targetValue} Seasons Survived`
                            : `${goal.currentValue} / ${goal.targetValue}`}
                        </strong>
                      </span>
                      <span className="text-zinc-500 font-normal">
                        {isComplete
                          ? 'MP & cash awarded'
                          : 'Evaluated upon season finish'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manager Points (MP) Calculation & System Explainer */}
          <div className="p-4 rounded-2xl bg-purple-500/[0.03] border border-purple-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-sm">⭐</span>
                <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                  How Manager Points (MP) Are Calculated
                </span>
              </div>
              <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 tabular-nums">
                {state.skillPoints || 0} MP Available
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
              Manager Points (MP) reward elite managerial performance and unlock game-changing tactical talents:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
              <div className="p-2 rounded-xl bg-black/30 border border-white/[0.04] flex flex-col">
                <span className="text-zinc-400">League Title</span>
                <span className="font-semibold text-purple-300 tabular-nums">+3 to +4 MP</span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/[0.04] flex flex-col">
                <span className="text-zinc-400">Cup Glory</span>
                <span className="font-semibold text-purple-300 tabular-nums">+3 MP</span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/[0.04] flex flex-col">
                <span className="text-zinc-400">EHF Champ. League</span>
                <span className="font-semibold text-purple-300 tabular-nums">+5 MP</span>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/[0.04] flex flex-col">
                <span className="text-zinc-400">Roadmap Goals</span>
                <span className="font-semibold text-purple-300 tabular-nums">+2 to +5 MP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <i className="fas fa-circle-info text-sky-400 text-xs" />
            <span>
              Roadmap refreshes dynamically upon cycle completion.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-[0_8px_25px_rgba(37,99,235,0.35)] border border-blue-400/30 active:scale-[0.99]"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
};
