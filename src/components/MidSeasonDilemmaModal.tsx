import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '../types';
import { getManagerialDilemmas, ManagerialDilemma } from '../engine/seasonSimEngine';
import { playSound } from '../utils/audio';

interface MidSeasonDilemmaModalProps {
  isOpen: boolean;
  gameState: GameState;
  dilemmaId: string;
  onResolveDilemma: (choice: 'A' | 'B', dilemma: ManagerialDilemma) => void;
}

export const MidSeasonDilemmaModal: React.FC<MidSeasonDilemmaModalProps> = ({
  isOpen,
  gameState,
  dilemmaId,
  onResolveDilemma,
}) => {
  const lang = gameState.language || 'en';
  const dilemmas = getManagerialDilemmas(gameState);
  const dilemma = dilemmas.find((d) => d.id === dilemmaId) || dilemmas[0];

  React.useEffect(() => {
    if (isOpen && !dilemma) {
      onResolveDilemma('B', {
        id: 'fallback',
        title: { en: 'Standard Preparation', de: 'Standard-Vorbereitung' },
        desc: { en: '', de: '' },
        optionA: { label: { en: 'Continue', de: 'Weiter' }, subtext: { en: '', de: '' }, effects: {}, badge: { en: '', de: '' }, tone: 'emerald' },
        optionB: { label: { en: 'Continue', de: 'Weiter' }, subtext: { en: '', de: '' }, effects: {}, badge: { en: '', de: '' }, tone: 'sky' },
      });
    }
  }, [isOpen, dilemma, onResolveDilemma]);

  if (!isOpen || !dilemma) return null;

  const pending = gameState.pendingSeasonState;
  const currentMd = pending?.dilemmaMatchday || 17;
  const totalMd = pending?.totalMatchdays || 34;
  const halfwaySnapshot =
    pending?.matchdaySchedule?.[Math.min(currentMd - 1, (pending?.matchdaySchedule?.length || 1) - 1)];

  const formatBudget = (valK: number) => {
    const absK = Math.abs(valK);
    const sign = valK < 0 ? '-' : '';
    if (absK >= 1000) return `${sign}€${(absK / 1000).toFixed(2)}M`;
    return `${sign}€${Math.round(absK)}k`;
  };

  const getToneClasses = (tone: 'emerald' | 'sky' | 'amber' | 'rose') => {
    switch (tone) {
      case 'emerald':
        return {
          border: 'border-emerald-500/35 hover:border-emerald-400/70',
          bg: 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.11]',
          accent: 'text-emerald-400',
        };
      case 'sky':
        return {
          border: 'border-sky-500/35 hover:border-sky-400/70',
          bg: 'bg-sky-500/[0.06] hover:bg-sky-500/[0.11]',
          accent: 'text-sky-400',
        };
      case 'amber':
        return {
          border: 'border-amber-500/35 hover:border-amber-400/70',
          bg: 'bg-amber-500/[0.06] hover:bg-amber-500/[0.11]',
          accent: 'text-amber-400',
        };
      case 'rose':
      default:
        return {
          border: 'border-rose-500/35 hover:border-rose-400/70',
          bg: 'bg-rose-500/[0.06] hover:bg-rose-500/[0.11]',
          accent: 'text-rose-400',
        };
    }
  };

  const toneA = getToneClasses(dilemma.optionA.tone);
  const toneB = getToneClasses(dilemma.optionB.tone);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-2xl flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain text-left"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] my-auto bg-[#12141c]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[28px] sm:rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative overflow-y-auto custom-scrollbar flex flex-col"
      >
        {/* Subtle Ambient Accent Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400 text-base shadow-inner shrink-0">
              <i className={`fa-solid ${dilemma.icon}`} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 mb-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {lang === 'de' ? dilemma.categoryDe : dilemma.categoryEn}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                {lang === 'de' ? dilemma.titleDe : dilemma.titleEn}
              </h2>
            </div>
          </div>
          <div className="text-right shrink-0 text-xs font-extrabold tracking-tight text-zinc-400 tabular-nums">
            MD {currentMd}/{totalMd}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 relative z-10">
          {/* Live Halfway Telemetry Banner */}
          <div className="grid grid-cols-4 gap-2 bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3 text-center">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
                {lang === 'de' ? 'Platz' : 'Live Pos'}
              </div>
              <div className="text-sm font-extrabold tracking-tight text-white tabular-nums">
                #{halfwaySnapshot?.runningPosition || 9}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
                {lang === 'de' ? 'Punkte' : 'Points'}
              </div>
              <div className="text-sm font-extrabold tracking-tight text-emerald-400 tabular-nums">
                {halfwaySnapshot?.runningPoints || 0} PTS
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
                {lang === 'de' ? 'Kader-GES' : 'Squad OVR'}
              </div>
              <div className="text-sm font-extrabold tracking-tight text-sky-400 tabular-nums">
                {Math.round(gameState.club.baseOvr)} OVR
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
                {lang === 'de' ? 'Budget' : 'Treasury'}
              </div>
              <div
                className={`text-sm font-extrabold tracking-tight tabular-nums ${
                  gameState.budget < 0 ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                {formatBudget(gameState.budget)}
              </div>
            </div>
          </div>

          {/* Scenario Narrative */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              {lang === 'de' ? dilemma.descDe : dilemma.descEn}
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5 text-[11px] text-zinc-400">
              <i className="fa-solid fa-bolt text-amber-400 text-[10px]" />
              <span>
                {lang === 'de'
                  ? `Deine Entscheidung berechnet sofort die Rückrunde (Spieltage ${currentMd + 1}–${totalMd}) neu.`
                  : `Your decision immediately recalculates the second half of the season (MD ${currentMd + 1}–${totalMd}).`}
              </span>
            </div>
          </div>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {/* Option A */}
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onResolveDilemma('A', dilemma);
              }}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 group cursor-pointer active:scale-[0.99] ${toneA.border} ${toneA.bg}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-extrabold tracking-tight text-white shrink-0">
                    A
                  </span>
                  <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    {lang === 'de' ? dilemma.optionA.labelDe : dilemma.optionA.labelEn}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider tabular-nums ${toneA.accent}`}>
                  {lang === 'de' ? dilemma.optionA.badgeDe : dilemma.optionA.badgeEn}
                </span>
              </div>
              <p className="text-xs text-zinc-400 pl-8.5 leading-snug">
                {lang === 'de' ? dilemma.optionA.subDe : dilemma.optionA.subEn}
              </p>
            </button>

            {/* Option B */}
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onResolveDilemma('B', dilemma);
              }}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 group cursor-pointer active:scale-[0.99] ${toneB.border} ${toneB.bg}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-extrabold tracking-tight text-white shrink-0">
                    B
                  </span>
                  <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                    {lang === 'de' ? dilemma.optionB.labelDe : dilemma.optionB.labelEn}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider tabular-nums ${toneB.accent}`}>
                  {lang === 'de' ? dilemma.optionB.badgeDe : dilemma.optionB.badgeEn}
                </span>
              </div>
              <p className="text-xs text-zinc-400 pl-8.5 leading-snug">
                {lang === 'de' ? dilemma.optionB.subDe : dilemma.optionB.subEn}
              </p>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
