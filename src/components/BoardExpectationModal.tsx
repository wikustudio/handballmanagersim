import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ClubLogo } from './ClubLogo';
import { Club, GameState, BoardRoadmap } from '../types';
import { getOrGenerateRoadmap } from '../utils/roadmapManager';
import { formatMoney } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';
import { useGameStore } from '../store/useGameStore';

interface BoardExpectationModalProps {
  state: GameState;
  onClose: () => void;
  welcomeClub?: Club | null;
}

export const BoardExpectationModal: React.FC<BoardExpectationModalProps> = ({ state, onClose, welcomeClub }) => {
  useModalDismiss(onClose);
  const rawClub = welcomeClub || state.club;
  const isNewAppointment = Boolean(welcomeClub);
  const currentClub = isNewAppointment
    ? rawClub
    : { ...rawClub, currentBudget: state.budget ?? rawClub.currentBudget ?? 0 };
  const currentYear = state.year || 2024;

  const roadmap: BoardRoadmap = getOrGenerateRoadmap(
    isNewAppointment ? null : state.boardRoadmap,
    currentClub,
    currentYear,
    state.history
  );

  // Retroactively persist validated roadmap goals and award any missing rewards
  useEffect(() => {
    if (isNewAppointment) return;
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
  }, [roadmap, isNewAppointment]);

  const completedGoalsCount = roadmap.goals.filter(g => g.completed).length;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl cursor-pointer">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#14151e] rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col p-4 sm:p-7 relative max-h-[min(92dvh,92vh)] overflow-y-auto custom-scrollbar cursor-default"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

        {/* Header with Club Emblem */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#10121a] border border-white/[0.06] flex items-center justify-center shadow-lg mb-3 p-2 overflow-hidden">
            <ClubLogo
              club={currentClub}
              clubId={currentClub.id}
              name={currentClub.name}
              color={currentClub.color}
              color2={currentClub.color2}
              logo={currentClub.logo}
              fallbackLogo={currentClub.fallbackLogo}
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="flex items-center gap-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-sky-400">
            <span>{isNewAppointment ? 'New Appointment' : 'Board Directives'}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-sky-300 font-semibold">{roadmap.horizonYears} Years</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
            {isNewAppointment ? `Welcome to ${currentClub.name}` : roadmap.titleEn}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-normal">
            Strategic Cycle: <span className="tabular-nums">{roadmap.startYear} – {roadmap.endYear}</span> · <span className="tabular-nums">{roadmap.boardConfidence}%</span> Confidence
          </p>
        </div>

        {/* Strategic Narrative Bento */}
        <div className="w-full bg-[#10121a] border border-white/[0.04] rounded-2xl p-4 flex flex-col gap-3 mb-4">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-sky-500/[0.08] text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 mt-0.5 text-xs">
              <i className="fas fa-map-location-dot" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider mb-0.5">
                Club Context & Vision
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                {roadmap.narrativeEn}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic 1-2 Goals */}
        <div className="w-full space-y-2.5 mb-5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
            <span>Roadmap Milestones</span>
            <span className="text-sky-400 font-semibold">
              {completedGoalsCount}/{roadmap.goals.length} Completed
            </span>
          </div>

          {roadmap.goals.map((g, idx) => {
            const isGoalComplete = !isNewAppointment && Boolean(
              g.completed ||
              (g.targetType === 'arena_expansion' && (currentClub.stadium || 0) >= g.targetValue) ||
              (g.targetType === 'academy_growth' && (currentClub.academyLevel || 1) >= g.targetValue) ||
              (g.targetType === 'medical_growth' && (currentClub.medicalLevel || 1) >= g.targetValue) ||
              (g.targetType === 'promotion_tier' && (currentClub.tier || 1) <= g.targetValue) ||
              (g.targetType === 'fanbase_growth' && (currentClub.fanBase || 0) >= g.targetValue)
            );

            return (
            <div
              key={`exp-goal-${g.id || idx}-${idx}`}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                isGoalComplete
                  ? 'bg-emerald-500/[0.05] border-emerald-500/25'
                  : 'bg-[#10121a] border-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${
                      isGoalComplete ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-sky-400'
                    }`}
                  >
                    {isGoalComplete ? '✓' : idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white tracking-tight truncate">
                      {g.titleEn}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed font-normal">
                      {g.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-fuchsia-500/[0.08] border border-fuchsia-500/25 text-fuchsia-300 font-semibold text-[11px] tabular-nums">
                    +{g.rewardMp} MP
                  </span>
                  {g.rewardCash && (
                    <span className="text-[10px] font-semibold text-emerald-400 tabular-nums">
                      +{formatMoney(g.rewardCash)}
                    </span>
                  )}
                </div>
              </div>

              {/* Status details */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-white/[0.04]">
                <span>
                  Status:{' '}
                  <strong className={isGoalComplete ? 'text-emerald-400 font-medium' : 'text-zinc-200 font-medium'}>
                    {isGoalComplete
                      ? 'Achieved'
                      : g.targetType === 'promotion_tier'
                      ? `Tier ${currentClub.tier} → Target Tier ${g.targetValue}`
                      : g.targetType === 'championship_dominance'
                      ? `${g.currentValue} / ${g.targetValue} Titles`
                      : g.targetType === 'european_glory'
                      ? `${g.currentValue > 0 ? '1 Trophy Won' : '0 / 1 Trophy'}`
                      : g.targetType === 'arena_expansion'
                      ? `${(currentClub.stadium || 0).toLocaleString()} / ${g.targetValue.toLocaleString()} Seats`
                      : g.targetType === 'fanbase_growth'
                      ? `${(currentClub.fanBase || g.currentValue || 0).toLocaleString()} / ${g.targetValue.toLocaleString()} Supporters`
                      : g.targetType === 'academy_growth'
                      ? `Level ${currentClub.academyLevel || 1} / ${g.targetValue}`
                      : g.targetType === 'medical_growth'
                      ? `Level ${currentClub.medicalLevel || 1} / ${g.targetValue}`
                      : g.targetType === 'financial_surplus'
                      ? `${formatMoney(currentClub.currentBudget || state.budget || 0)} / ${formatMoney(g.targetValue)}`
                      : g.targetType === 'solidify_tier'
                      ? `${g.currentValue} / ${g.targetValue} Seasons Survived`
                      : `${g.currentValue} / ${g.targetValue}`}
                  </strong>
                </span>
                <span className="text-zinc-500">
                  {g.completed ? 'Reward granted' : 'Evaluated annually'}
                </span>
              </div>
            </div>
          );
        })}
        </div>

        {/* Board Confidence & Shields Footer strip */}
        <div className="w-full bg-[#10121a] border border-white/[0.04] rounded-2xl p-3 flex items-center justify-between text-xs mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-400">Job Security:</span>
            <span className="text-white font-semibold tabular-nums">{Math.round(state.clubImpactScore ?? 50)}/100</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-semibold tabular-nums">🛡️ {state.immunityShields ?? 1} Shields</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-5 rounded-2xl transition-all shadow-[0_4px_20px_rgba(37,99,235,0.25)] border border-blue-400/30 active:scale-[0.99] text-xs sm:text-sm cursor-pointer tracking-wide"
        >
          {isNewAppointment ? 'Accept Challenge & Begin' : 'Understood'}
        </button>
      </motion.div>
    </div>
  );
};
