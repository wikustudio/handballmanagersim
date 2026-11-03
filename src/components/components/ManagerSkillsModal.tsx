import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { MANAGER_SKILLS } from '../data/gameConstants';
import { t } from '../data/translations';
import { useModalDismiss } from '../utils/modalUtils';

interface ManagerSkillsModalProps {
  state: GameState;
  lang: Language;
  onClose: () => void;
  onUnlockSkill: (skillId: string) => void;
}

export const ManagerSkillsModal: React.FC<ManagerSkillsModalProps> = ({
  state,
  onClose,
  onUnlockSkill,
}) => {
  useModalDismiss(onClose);
  const tr = (en: string, _de?: string, _ignoredEs?: string) => en;

  const skillPoints = state.skillPoints || 0;
  const activeSkills = state.managerSkills || [];
  const activeCount = activeSkills.length;
  const isUnlockingRef = useRef(false);

  const handleUnlock = (skillId: string) => {
    if (isUnlockingRef.current) return;
    if (activeSkills.includes(skillId)) return;
    isUnlockingRef.current = true;
    onUnlockSkill(skillId);
    setTimeout(() => {
      isUnlockingRef.current = false;
    }, 350);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }} 
        exit={{ scale: 0.95, y: 10, opacity: 0 }} 
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] border border-white/[0.04] rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative my-auto max-h-[92vh] flex flex-col overflow-hidden cursor-default pointer-events-auto"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.04] shrink-0 gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg shrink-0 shadow-sm">
              <i className="fas fa-graduation-cap" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                  {tr('Manager Skills & Perks', 'Trainerfähigkeiten & Perks')}
                </h2>
                <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md tabular-nums">
                  {activeCount} {tr('Active', 'Aktiv')}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                {tr('Unlock permanent tactical and managerial abilities to elevate your club dynasty.', 'Schalte permanente taktische und organisatorische Fähigkeiten frei.')}
              </p>
            </div>
          </div>
          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.04] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Manager Points Bento Card */}
        <div className="bg-[#10121a] border border-purple-500/20 rounded-2xl p-4 my-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-3 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-base shrink-0">
              <i className="fas fa-bolt" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-medium text-purple-300/80">
                {tr('Available Manager Points', 'Verfügbare Trainerpunkte')}
              </span>
              <span className="text-2xl font-semibold text-purple-300 tracking-tight tabular-nums leading-none mt-0.5">
                {skillPoints} MP
              </span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 leading-snug sm:text-right max-w-sm font-normal">
            {tr('⚡ Earn MP via trophies (+3), promotions (+3), and 5-year coaching milestones (+2).', '⚡ Erhalte MP durch Titel (+3), Aufstiege (+3) und 5-Jahres-Jubiläen (+2).')}
          </div>
        </div>

        {/* Skills Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
            {Object.values(MANAGER_SKILLS).map((skill) => {
              const isUnlocked = activeSkills.includes(skill.id);
              const getSkillCost = (count: number) => {
                if (count === 0) return 10;
                if (count === 1) return 15;
                if (count === 2) return 25;
                if (count === 3) return 50;
                return 100;
              };
              const cost = skill.cost ?? getSkillCost(activeCount);
              const canAfford = skillPoints >= cost;

              return (
                <div
                  key={`sk-${skill.id}`}
                  className={`rounded-2xl p-4 border transition-all flex flex-col justify-between relative overflow-hidden ${
                    isUnlocked
                      ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                      : 'bg-[#10121a] border-white/[0.04] hover:border-white/[0.08]'
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 ${
                          isUnlocked
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        <skill.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-white tracking-tight leading-tight">
                            {skill.nameEn}
                          </h3>
                          {isUnlocked && (
                            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                              {tr('Active', 'Aktiv')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-normal">
                          {skill.descEn}
                        </p>
                      </div>
                    </div>

                    {/* Effect Line */}
                    <div className="w-full bg-[#14151e] border border-white/[0.04] rounded-xl px-3 py-2 flex items-start gap-2">
                      <i className="fas fa-bolt text-purple-400 text-xs mt-0.5 shrink-0" />
                      <span className="text-xs font-medium text-purple-300/90 leading-snug flex-1">
                        {skill.effectEn}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-white/[0.04]">
                    {isUnlocked ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 font-medium text-xs border border-emerald-500/20 flex items-center justify-center gap-1.5">
                        <i className="fas fa-check text-xs" />
                        <span>{tr('Permanently Unlocked', 'Dauerhaft Freigeschaltet')}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUnlock(skill.id)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                          canAfford
                            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 shadow-sm'
                            : 'bg-white/[0.03] text-zinc-500 cursor-not-allowed border border-white/[0.04]'
                        }`}
                      >
                        <i className="fas fa-unlock text-xs" />
                        <span>
                          {canAfford
                            ? `${tr('Unlock Ability', 'Fähigkeit freischalten')} (${cost} MP)`
                            : `${tr('Requires', 'Benötigt')} ${cost} MP (${skillPoints}/${cost})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-white/[0.04] flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-400">
            {tr('Active Perks:', 'Aktive Perks:')}{' '}
            <strong className="text-fuchsia-400 font-semibold tabular-nums">{activeCount}</strong>
          </div>
          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium px-5 py-2.5 rounded-2xl text-xs transition border border-white/[0.06] cursor-pointer active:scale-[0.99]"
          >
            {tr('Done', 'Fertig')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
