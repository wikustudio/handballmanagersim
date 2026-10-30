import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { GameState, Language, BoardVision } from '../types';
import { calculateClubReputation } from '../data/gameConstants';
import { generateBoardVision } from '../engine/boardVisionEngine';

interface ClubImpactModalProps {
  state: GameState;
  lang: Language;
  initialTab?: 'roadmap' | 'dressing_room';
  onClose: () => void;
  onOpenTeamBonding: () => void;
  onOpenClubProfile: () => void;
}

export const ClubImpactModal: React.FC<ClubImpactModalProps> = ({
  state,
  initialTab = 'roadmap',
  onClose,
  onOpenTeamBonding,
  onOpenClubProfile
}) => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'dressing_room'>(initialTab);

  const impactScore = state.clubImpactScore ?? 50;
  const morale = state.club.morale ?? 100;
  const shields = state.immunityShields ?? 0;
  const rep = Math.min(100, calculateClubReputation(state.club.baseOvr, state.club.tier));
  
  const targetPos = state.boardTargetFinish || 15;
  const targetText = `Top ${targetPos} Finish`;

  // Board confidence categorization
  let impactStatus = {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Untouchable Authority',
    desc: 'The board has absolute confidence in your managerial vision. Full backing guaranteed.'
  };
  if (impactScore < 20) {
    impactStatus = {
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse',
      title: 'Job at Risk (Critical)',
      desc: 'Board patience has worn out. Sacking is imminent unless results and morale improve immediately.'
    };
  } else if (impactScore < 40) {
    impactStatus = {
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      title: 'Board Warning',
      desc: 'Board confidence is fragile. Another dip in performance could trigger an ultimatum.'
    };
  } else if (impactScore < 65) {
    impactStatus = {
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      title: 'Stable & Supported',
      desc: 'The board respects your steady hand. Meeting seasonal milestones will increase trust.'
    };
  } else if (impactScore < 85) {
    impactStatus = {
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      title: 'Strong Command',
      desc: 'High managerial authority. The board grants leeway in key financial and sporting calls.'
    };
  }

  // Morale categorization
  let moraleStatus = {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    label: 'Euphoric & United',
    icon: 'fa-face-laugh-beam'
  };
  if (morale < 40) {
    moraleStatus = {
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      label: 'Dressing Room Mutiny',
      icon: 'fa-face-frown'
    };
  } else if (morale < 65) {
    moraleStatus = {
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      label: 'Subdued & Anxious',
      icon: 'fa-face-meh'
    };
  } else if (morale < 85) {
    moraleStatus = {
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      label: 'Focused & Driven',
      icon: 'fa-face-smile'
    };
  }

  // Board Roadmap computation
  const boardVision: BoardVision = useMemo(() => {
    const raw = state.boardVision || generateBoardVision(state.club, state.year || 2026);
    const totalProjectsDone = (state.stadiumExpandedThisSeason || 0) + (state.academyUpgradedThisSeason || 0) + (state.medicalUpgradedThisSeason || 0);
    const effectiveUpgrades = Math.max(state.facilitiesUpgradedThisSeason || 0, totalProjectsDone);

    return {
      ...raw,
      objectives: raw.objectives.map(obj => {
        if (obj.id === 'obj_upgrade_facs') {
          const val = Math.min(obj.targetValue, Math.max(obj.currentValue || 0, effectiveUpgrades));
          return { ...obj, currentValue: val, isCompleted: val >= obj.targetValue };
        }
        if (obj.id === 'obj_academy_lvl') {
          const val = Math.max(obj.currentValue || 0, state.club.academyLevel || 1);
          return { ...obj, currentValue: val, isCompleted: val >= obj.targetValue };
        }
        return {
          ...obj,
          isCompleted: obj.isCompleted || (obj.currentValue >= obj.targetValue)
        };
      })
    };
  }, [state.boardVision, state.club, state.year, state.facilitiesUpgradedThisSeason, state.stadiumExpandedThisSeason, state.academyUpgradedThisSeason, state.medicalUpgradedThisSeason]);

  const completedMilestones = boardVision.objectives.filter(o => o.isCompleted || o.currentValue >= o.targetValue).length;
  const totalMilestones = boardVision.objectives.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-2xl bg-black/75 overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#12141c]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[28px] sm:rounded-[32px] w-full max-w-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col max-h-[92vh] relative text-left"
      >
        {/* Subtle Ambient Sky-Blue Accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 text-base shrink-0 shadow-inner">
              <i className="fas fa-landmark"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5">
                Executive Brief
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                Boardroom & Dressing Room
              </h2>
              <p className="text-xs text-zinc-400 font-normal mt-0.5">
                Club Authority, Strategic Vision & First-Team Harmony
              </p>
            </div>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition border border-white/[0.08] cursor-pointer"
          >
            <i className="fas fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Executive Cockpit Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-5 bg-white/[0.01] border-b border-white/[0.06] shrink-0 relative z-10">
          {/* Tile 1: Board Trust */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <span>Board Trust</span>
              <i className="fas fa-shield-halved text-sky-400"></i>
            </div>
            <div className="flex items-baseline gap-1 my-1.5 tabular-nums">
              <span className="text-2xl sm:text-3xl font-bold text-white">{impactScore}</span>
              <span className="text-xs text-zinc-500 font-normal">/100</span>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border text-center truncate ${impactStatus.badge}`}>
              {impactStatus.title}
            </span>
          </div>

          {/* Tile 2: Squad Morale */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <span>Squad Morale</span>
              <i className="fas fa-users text-sky-400"></i>
            </div>
            <div className="flex items-baseline gap-1 my-1.5 tabular-nums">
              <span className="text-2xl sm:text-3xl font-bold text-sky-300">{morale}%</span>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border text-center truncate ${moraleStatus.badge}`}>
              {moraleStatus.label}
            </span>
          </div>

          {/* Tile 3: Immunity Shields */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <span>Job Security</span>
              <i className="fas fa-award text-amber-300"></i>
            </div>
            <div className="flex items-baseline gap-1 my-1.5 tabular-nums">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{shields}</span>
              <span className="text-xs text-zinc-500 font-normal">Shields</span>
            </div>
            <span className="text-[10px] font-normal text-zinc-400 truncate">
              {shields > 0 ? 'Protected from sack' : 'Standard review'}
            </span>
          </div>

          {/* Tile 4: Club Reputation */}
          <div
            onClick={() => {
              onClose();
              onOpenClubProfile();
            }}
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-400/30 transition cursor-pointer flex flex-col justify-between group"
            title="Click to view full Club Details"
          >
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200">
              <span>Club Prestige</span>
              <i className="fas fa-arrow-up-right-from-square text-[9px] text-sky-400 opacity-60 group-hover:opacity-100"></i>
            </div>
            <div className="flex items-baseline gap-1 my-1.5 tabular-nums">
              <span className="text-2xl sm:text-3xl font-bold text-white">{rep}</span>
              <span className="text-xs text-zinc-500 font-normal">/100</span>
            </div>
            <span className="text-[10px] font-normal text-zinc-400 truncate">
              Tier {state.club.tier} · {state.club.baseOvr} OVR
            </span>
          </div>
        </div>

        {/* Apple Segmented Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-3 sm:px-6 sm:py-3 bg-white/[0.01] border-b border-white/[0.06] shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'roadmap'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                : 'bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <i className="fas fa-compass text-xs"></i>
            <span>Boardroom & Vision ({completedMilestones}/{totalMilestones})</span>
          </button>
          <button
            onClick={() => setActiveTab('dressing_room')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'dressing_room'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                : 'bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <i className="fas fa-users-viewfinder text-xs"></i>
            <span>Dressing Room & Culture</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 relative z-10">
          {activeTab === 'roadmap' ? (
            /* TAB 1: BOARDROOM & VISION */
            <div className="space-y-4">
              {/* Board Stance & Strategic Philosophy Card */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/[0.06] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-sky-400 border border-white/[0.08] flex items-center justify-center text-sm shadow-inner shrink-0">
                      <i className="fas fa-scroll"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{boardVision.title}</h3>
                      <div className="text-xs text-zinc-400 font-normal">
                        {boardVision.durationYears || 3}-Year Strategic Club Mandate
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/25 flex items-center gap-1.5">
                      <i className="fas fa-clock text-[10px]"></i>
                      Season {boardVision.currentYearOfVision || 1} of {boardVision.durationYears || 3}
                    </span>
                  </div>
                </div>


                {/* Boardroom Assessment Summary */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
                  <i className="fas fa-circle-info text-sky-400 text-xs mt-0.5 shrink-0"></i>
                  <div className="text-xs text-zinc-300 leading-snug">
                    <span className="font-semibold text-white mr-1.5">{impactStatus.title}:</span>
                    {impactStatus.desc}
                  </div>
                </div>
              </div>

              {/* Strategic Milestones */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Strategic Milestones
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      Progress toward 3-Year Vision Completion
                    </div>
                  </div>
                  <span className="text-xs tabular-nums font-semibold text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-400/25">
                    {completedMilestones} / {totalMilestones} Completed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {boardVision.objectives.map((obj) => {
                    const isDone = obj.isCompleted || obj.currentValue >= obj.targetValue;
                    return (
                      <div
                        key={obj.id}
                        className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                          isDone
                            ? 'bg-emerald-500/[0.06] border-emerald-400/30'
                            : 'bg-white/[0.02] border-white/[0.06]'
                        }`}
                      >
                        {/* Step Checkbox / Icon */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                            isDone
                              ? 'bg-emerald-500 text-black shadow-sm'
                              : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06]'
                          }`}
                        >
                          {isDone ? <i className="fas fa-check text-[11px]"></i> : <i className="fas fa-hourglass-half text-[10px]"></i>}
                        </div>

                        {/* Objective Content */}
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-white leading-snug block">
                            {obj.desc}
                          </span>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05] text-[11px]">
                            <span className="text-zinc-400">Status</span>
                            {isDone ? (
                              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                <i className="fas fa-circle-check text-[10px]"></i>
                                Achieved
                              </span>
                            ) : (
                              <span className="tabular-nums font-medium text-sky-300">
                                {obj.currentValue} of {obj.targetValue} {obj.unit || ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stakes & Annual Target Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vision Reward */}
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 flex items-center justify-center shrink-0 text-xs">
                    <i className="fas fa-gift"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Full Vision Reward
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {boardVision.reward.desc}
                    </div>
                  </div>
                </div>

                {/* Annual Target */}
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-400/20 flex items-center justify-center shrink-0 text-xs">
                    <i className="fas fa-bullseye"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Current Season Board Target
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {targetText}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: DRESSING ROOM & CULTURE */
            <div className="space-y-4">
              {/* Dressing Room Sentiment Card */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/[0.06]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-400/20 flex items-center justify-center text-sm">
                      <i className={`fas ${moraleStatus.icon}`}></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Squad Harmony & Vibe</h3>
                      <div className="text-xs text-zinc-400 font-normal">
                        First-Team Cohesion, Morale & Dressing Room Atmosphere
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenTeamBonding();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <i className="fas fa-beer-mug-empty text-xs"></i>
                    <span>Team Bonding Event</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-[10px] uppercase font-semibold text-zinc-400">Dressing Room Spirit</div>
                    <div className="text-sm font-bold text-white mt-1">{moraleStatus.label}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-[10px] uppercase font-semibold text-zinc-400">Tactical Compliance</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1">High Buy-In</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="text-[10px] uppercase font-semibold text-zinc-400">Squad Fitness & Health</div>
                    <div className="text-sm font-bold text-sky-300 mt-1">
                      Lvl {state.club.medicalLevel || 1} Medical Dept
                    </div>
                  </div>
                </div>
              </div>

              {/* Head Coach Fit & Tactical Boost */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/[0.06]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  Tactical Leadership
                </div>
                <div className="text-sm font-bold text-white mb-3">
                  Head Coach Dressing Room Assessment
                </div>

                {state.currentCoach ? (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-sky-400 border border-white/[0.08] flex items-center justify-center text-sm font-semibold">
                        <i className="fas fa-user-tie"></i>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{state.currentCoach.name}</div>
                        <div className="text-xs text-zinc-400 font-normal">
                          Style: <span className="text-sky-300 font-medium">{state.currentCoach.style}</span> · {state.currentCoach.contractYearsLeft || 0} Yrs Remaining
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                        state.currentCoach.ovrBoost >= 0
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-400/25'
                      }`}>
                        {state.currentCoach.ovrBoost >= 0 ? `+${state.currentCoach.ovrBoost}` : state.currentCoach.ovrBoost} OVR Tactical Boost
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center text-xs text-zinc-400 italic">
                    No head coach currently appointed. Tactical synergy is unboosted.
                  </div>
                )}
              </div>

              {/* Dynamic Arch Rivalry Record */}
              {state.currentRival && (
                <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.06] overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-400/20 flex items-center justify-center text-sm">
                          <i className="fas fa-fire"></i>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-semibold tracking-wider text-rose-400">
                            Arch Rival Derby
                          </div>
                          <div className="text-base font-bold text-white">
                            {state.currentRival.name}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-medium text-zinc-400 uppercase bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                        Head-to-Head Derby
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 italic mt-3 leading-relaxed">
                      "{state.currentRival.descEn || state.currentRival.descDe || 'Fierce regional competitors contesting local bragging rights.'}"
                    </p>
                  </div>

                  {/* Head-to-head score row */}
                  <div className="p-4 bg-white/[0.01] flex items-center justify-around text-center">
                    <div>
                      <div className="text-2xl font-bold text-emerald-400 leading-none tabular-nums">
                        {state.currentRival.wins}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-400 mt-1">Wins</div>
                    </div>
                    <div className="text-zinc-600 text-base font-light">·</div>
                    <div>
                      <div className="text-2xl font-bold text-zinc-300 leading-none tabular-nums">
                        {state.currentRival.draws}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-400 mt-1">Draws</div>
                    </div>
                    <div className="text-zinc-600 text-base font-light">·</div>
                    <div>
                      <div className="text-2xl font-bold text-rose-400 leading-none tabular-nums">
                        {state.currentRival.losses}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-zinc-400 mt-1">Losses</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
