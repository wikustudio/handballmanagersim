import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { formatMoney } from '../data/gameConstants';
import { ClubLogo } from './ClubLogo';
import { useModalDismiss } from '../utils/modalUtils';

interface TeamBondingModalProps {
  state: GameState;
  lang: Language;
  cost: number;
  onClose: () => void;
  onConfirm: () => void;
  canAfford: boolean;
}

export const TeamBondingModal: React.FC<TeamBondingModalProps> = ({
  state,
  cost,
  onClose,
  onConfirm,
  canAfford,
}) => {
  const t = (en: string, _de?: string) => en;

  useModalDismiss(onClose);

  const hasBonded = (state.teamBondingThisSeason || 0) >= 1;
  const currentMorale = Math.round(state.club.morale ?? 100);
  const newMorale = Math.min(100, currentMorale + 30);
  const moraleDelta = Math.max(0, newMorale - currentMorale);
  const costScaleInfo = `Camp costs scale based on league tier (Tier ${state.club.tier}).`;

  const moraleStatus =
    currentMorale < 40
      ? t('Critical Unrest', 'Kabinenkrise')
      : currentMorale < 75
      ? t('Stable Cohesion', 'Stabile Stimmung')
      : t('Optimal Harmony', 'Optimale Harmonie');

  const moraleColorClass =
    currentMorale < 40
      ? 'text-rose-400'
      : currentMorale < 75
      ? 'text-amber-400'
      : 'text-emerald-400';

  const moraleDotClass =
    currentMorale < 40
      ? 'bg-rose-400'
      : currentMorale < 75
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  const canExecute = !hasBonded && canAfford && currentMorale < 100;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#14151e] border border-white/[0.04] rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col max-h-[90vh] cursor-default text-white"
      >
        {/* Top Ambient Hairline */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-white/[0.04] flex items-center justify-between gap-3 shrink-0 bg-[#14151e]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-base shrink-0">
              <i className="fas fa-handshake" />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 leading-none">
                  {t('SQUAD & TRANSFERS', 'KADER & TRANSFERS')}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-zinc-400 tabular-nums leading-none">
                  {state.teamBondingThisSeason || 0} / 1
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none truncate">
                {t('Team Retreat', 'Team-Trainingslager')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-[#10121a] border border-white/[0.04] px-3 py-1.5 rounded-xl">
              <ClubLogo
                name={state.club.name}
                logo={state.club.logo}
                fallbackLogo={state.club.fallbackLogo}
                color={state.club.color}
                className="w-4 h-4 object-contain shrink-0"
                fallbackClassName="w-4 h-4 text-[7px] rounded flex items-center justify-center font-bold text-white shrink-0"
              />
              <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">
                {state.club.name}
              </span>
            </div>
            <button
              aria-label="Close modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer active:scale-95"
            >
              <i className="fas fa-xmark text-sm" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* 3-Column KPI Bento Box */}
          <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-3.5 sm:p-4 grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('CURRENT MORALE', 'AKTUELLE MORAL')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-lg sm:text-xl font-semibold tracking-tight tabular-nums ${moraleColorClass}`}>
                  {currentMorale}%
                </span>
              </div>
            </div>

            <div className="border-l border-white/[0.04] pl-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('PROJECTED', 'PROGNOSE')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-semibold tracking-tight tabular-nums text-white">
                  {newMorale}%
                </span>
                {moraleDelta > 0 && (
                  <span className="text-xs font-mono font-medium text-emerald-400 tabular-nums">
                    +{moraleDelta}%
                  </span>
                )}
              </div>
            </div>

            <div className="border-l border-white/[0.04] pl-3 text-right">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('CAMP COST', 'KOSTEN')}
              </span>
              <span className={`text-lg sm:text-xl font-semibold tracking-tight tabular-nums ${canAfford ? 'text-white' : 'text-rose-400'}`}>
                {formatMoney(cost)}
              </span>
            </div>
          </div>

          {/* Retreat Progression & Locker Room Status Card */}
          <div className="rounded-2xl bg-[#10121a] border border-white/[0.04] p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {t('DRESSING ROOM ATMOSPHERE', 'KABINENSTIMMUNG')}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${moraleDotClass}`} />
                {moraleStatus}
              </span>
            </div>

            {/* Dual-Stage Progress Bar (Current + Projected Recovery) */}
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden flex">
                <div
                  className={`h-full transition-colors ${
                    currentMorale < 40 ? 'bg-rose-500' : currentMorale < 75 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, currentMorale))}%` }}
                />
                {moraleDelta > 0 && !hasBonded && (
                  <div
                    className="h-full bg-emerald-400/35 border-l border-black/40"
                    style={{ width: `${moraleDelta}%` }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 tabular-nums">
                <span>{t('40% Star Transfer Threshold', '40% Mindestmoral für Top-Transfers')}</span>
                <span className="font-mono text-zinc-400">
                  {currentMorale}% → {newMorale}%
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed pt-2 border-t border-white/[0.04]">
              {t(
                'Organize a focused training retreat to restore squad morale, unify big personalities, and arrest negative momentum.',
                'Organisiere ein intensives Teamevent, um die Stimmung zu heben, Egos zu einen und Negativspiralen zu stoppen.'
              )}
            </p>
          </div>

          {/* Operational Impact Breakdown */}
          <div className="rounded-2xl bg-[#10121a] border border-white/[0.04] p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-emerald-400 text-xs shrink-0">
                <i className="fas fa-arrow-trend-up" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {t('Immediate Effect: +30% Squad Morale', 'Soforteffekt: +30% Team-Moral')}
                </div>
                <div className="text-[11px] text-zinc-500 truncate tabular-nums">
                  {costScaleInfo}
                </div>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-[#181924] border border-white/[0.06] text-[10px] font-mono text-emerald-400 shrink-0 tabular-nums">
              +30% MAX
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.04] bg-[#10121a] flex items-center justify-between gap-3 shrink-0">
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            {t('Decline', 'Abbrechen')}
          </button>

          <button
            onClick={onConfirm}
            disabled={!canExecute}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 tabular-nums ${
              hasBonded
                ? 'bg-white/[0.03] text-zinc-500 border border-white/[0.04] cursor-not-allowed'
                : currentMorale === 100
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 cursor-default'
                : !canAfford
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 cursor-not-allowed'
                : 'bg-[#181924] hover:bg-white/[0.08] text-white border border-white/[0.1] cursor-pointer active:scale-[0.99]'
            }`}
          >
            {hasBonded ? (
              <>
                <i className="fas fa-check text-xs text-zinc-500" />
                <span>{t('Limit Reached (1 per season)', 'Limit erreicht (1 pro Saison)')}</span>
              </>
            ) : currentMorale === 100 ? (
              <>
                <i className="fas fa-check text-xs text-emerald-400" />
                <span>{t('Morale Already Maxed (100%)', 'Moral bereits maximal (100%)')}</span>
              </>
            ) : !canAfford ? (
              <>
                <i className="fas fa-triangle-exclamation text-xs text-rose-400" />
                <span>{t('Insufficient Funds', 'Nicht genügend Budget')}</span>
              </>
            ) : (
              <>
                <i className="fas fa-campground text-xs text-emerald-400" />
                <span>{t('Authorize Camp', 'Camp veranstalten')}</span>
                <span className="font-mono text-emerald-400">-{formatMoney(cost)}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
