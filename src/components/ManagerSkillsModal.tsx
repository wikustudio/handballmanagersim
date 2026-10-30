import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { MANAGER_SKILLS } from '../data/gameConstants';
import { t as tr } from '../data/translations';

interface ManagerSkillsModalProps {
  state: GameState;
  lang: Language;
  onClose: () => void;
  onUnlockSkill: (skillId: string) => void;
}

export const ManagerSkillsModal: React.FC<ManagerSkillsModalProps> = ({
  state,
  lang,
  onClose,
  onUnlockSkill,
}) => {
  const isDe = lang === 'de';
  const t = (en: string, de?: string, _ignoredEs?: string) => tr(lang, en, de);

  const skillPoints = state.skillPoints || 0;
  const activeSkills = state.managerSkills || [];
  const activeCount = activeSkills.length;

  const getSkillCost = (count: number) => {
    if (count === 0) return 10;
    if (count === 1) return 15;
    if (count === 2) return 25;
    if (count === 3) return 50;
    return 100;
  };
  const nextCost = getSkillCost(activeCount);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-2xl flex flex-col items-center justify-center p-2.5 sm:p-5 z-50 cursor-pointer text-left overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.98, opacity: 0 }} 
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/90 text-white w-full max-w-4xl rounded-[28px] sm:rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-white/[0.08] backdrop-blur-3xl relative cursor-default max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto flex flex-col overflow-hidden shrink-0"
      >
        {/* Subtle Ambient Sky Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-sky-400 text-base shadow-inner shrink-0">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5 flex items-center gap-2">
                <span>{t('Sporting Director Competencies', 'Sportdirektor Kompetenzen')}</span>
                <span>·</span>
                <span className="text-zinc-400 font-normal">{activeCount} {t('Active Perks', 'Aktive Boni')}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                {t('Director Skills & Perks', 'Direktor-Fähigkeiten & Boni')}
              </h2>
            </div>
          </div>

          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/[0.08] shrink-0"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 custom-scrollbar relative z-10 space-y-5">
          {/* Executive Director Points Bento */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400 text-xl shrink-0">
                <i className="fa-solid fa-star"></i>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  {t('Available Director Points', 'Verfügbare Direktor-Punkte')}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight mt-0.5 flex items-baseline gap-2">
                  <span>{skillPoints}</span>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">DP</span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-xs text-zinc-300 leading-relaxed max-w-md">
              <div className="text-[10px] uppercase font-semibold text-amber-400/90 mb-1 flex items-center gap-1.5">
                <i className="fa-solid fa-trophy text-[9px]"></i>
                <span>{t('Points Acquisition Guidelines', 'Punkte-Erwerb')}</span>
              </div>
              <span>
                {t(
                  `Earn +3 to +12 DP for Trophies, +5 DP for Promotion, and +3 DP for Top Finishes & 5-Year Milestones. Next perk: `,
                  `Verdiene +3 bis +12 DP für Titel, +5 DP für Aufstieg und +3 DP für Top-Platzierungen & 5-Jahres-Jubiläen. Nächster Perk: `
                )}
                <strong className="text-white tabular-nums">{nextCost} DP</strong>.
              </span>
            </div>
          </div>

          {/* Perks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {Object.values(MANAGER_SKILLS).map((skill) => {
              const isUnlocked = activeSkills.includes(skill.id);
              const cost = nextCost;
              const canAfford = skillPoints >= cost;

              return (
                <div
                  key={skill.id}
                  className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-sm relative ${
                    isUnlocked
                      ? 'bg-emerald-500/[0.03] border-emerald-400/30 shadow-[0_0_24px_rgba(16,185,129,0.06)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/[0.06]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 shadow-sm ${
                          isUnlocked
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/25'
                            : 'bg-white/[0.04] text-amber-400 border border-white/[0.08]'
                        }`}
                      >
                        <i className={`fas ${skill.icon}`}></i>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h3 className="text-base font-bold text-white tracking-tight break-words">
                            {isDe ? skill.nameDe : skill.nameEn}
                          </h3>
                          {isUnlocked && (
                            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                              <i className="fa-solid fa-check text-[9px]"></i>
                              <span>{t('Active', 'Aktiv')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Effect Card */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2 flex items-start gap-2.5 text-xs">
                      <i className="fa-solid fa-bolt text-amber-400 mt-0.5 text-xs shrink-0"></i>
                      <span className="text-amber-200/95 font-medium leading-snug">
                        {isDe ? skill.effectDe : skill.effectEn}
                      </span>
                    </div>
                  </div>

                  {/* Action Slot */}
                  <div className="mt-4 pt-3 border-t border-white/[0.05]">
                    {isUnlocked ? (
                      <div className="w-full py-2.5 rounded-xl bg-white/[0.02] border border-emerald-400/20 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2">
                        <i className="fa-solid fa-shield-check text-xs text-emerald-400"></i>
                        <span>{t('Permanently Activated', 'Dauerhaft freigeschaltet')}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onUnlockSkill(skill.id)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                          canAfford
                            ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm'
                            : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                        }`}
                      >
                        <i className="fa-solid fa-lock-open text-xs"></i>
                        <span className="tabular-nums">
                          {canAfford
                            ? `${t('Unlock Perk', 'Perk freischalten')} · ${cost} DP`
                            : `${t('Requires', 'Benötigt')} ${cost} DP (${skillPoints}/${cost})`}
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
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="text-xs text-zinc-400">
            <span>{t('Unlocked perks remain permanent across club changes.', 'Freigeschaltete Boni bleiben auch bei Vereinswechseln dauerhaft aktiv.')}</span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs transition border border-white/[0.08] cursor-pointer"
          >
            {t('Close', 'Schließen')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
