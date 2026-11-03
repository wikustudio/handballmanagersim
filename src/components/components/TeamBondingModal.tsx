import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { formatMoney } from '../data/gameConstants';
import { t as tr } from '../data/translations';
import { useModalDismiss } from '../utils/modalUtils';

interface TeamBondingModalProps {
  state: GameState;
  lang: Language;
  cost: number;
  onClose: () => void;
  onConfirm: () => void;
  canAfford: boolean;
}

export const TeamBondingModal: React.FC<TeamBondingModalProps> = ({ state, lang, cost, onClose, onConfirm, canAfford }) => {
  const t = (en: string, _de?: string) => en;
  
  useModalDismiss(onClose);

  const hasBonded = (state.teamBondingThisSeason || 0) >= 1;
  const currentMorale = state.club.morale ?? 100;
  const newMorale = Math.min(100, currentMorale + 30);
  const costScaleInfo = `Camp costs scale based on league tier (Tier ${state.club.tier}).`;

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] border border-white/[0.04] rounded-2xl max-w-sm w-full p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />

        <button 
          aria-label="Close modal" 
          onClick={onClose}
          className="active:scale-95 absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer z-10"
        >
          <i className="fas fa-xmark text-sm" />
        </button>

        <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1 -mr-1">

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-xl mb-3">
            <i className="fas fa-handshake" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-medium uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            {t('Squad Chemistry', 'Teammoral & Zusammenhalt')}
          </div>

          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
            {t('Team Bonding Camp', 'Team-Building Camp')}
          </h3>
          
          <p className="text-xs text-zinc-400 leading-relaxed mb-4 max-w-xs">
            {t(
              'Organize a focused training retreat to restore squad morale, unify big personalities, and arrest negative momentum.',
              'Organisiere ein intensives Teamevent, um die Stimmung zu heben, Egos zu einen und Negativspiralen zu stoppen.'
            )}
          </p>
        </div>

        {/* Morale Delta Bento Card */}
        <div className="bg-[#181924] rounded-2xl p-4 mb-4 border border-white/[0.04] flex flex-col gap-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Squad Morale</span>
            <div className="flex items-center gap-2 font-medium text-sm tabular-nums">
              <span className={currentMorale < 40 ? 'text-rose-400' : currentMorale < 70 ? 'text-amber-400' : 'text-zinc-300'}>
                {currentMorale}%
              </span>
              <i className="fas fa-arrow-right text-zinc-600 text-[10px]" />
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                +{newMorale - currentMorale}% ({newMorale}%)
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Camp Cost</span>
            <span className="font-medium text-white text-sm tabular-nums">{formatMoney(cost)}</span>
          </div>
          
          <div className="text-[10px] text-zinc-500 text-right tabular-nums">
            {costScaleInfo}
          </div>
        </div>

        {/* Benefits Note */}
        <div className="bg-purple-500/[0.05] border border-purple-500/20 rounded-xl p-3 mb-5 flex gap-2.5 items-start">
          <i className="fas fa-sparkles text-purple-400 mt-0.5 text-xs shrink-0" />
          <p className="text-[11px] text-purple-200/90 leading-relaxed font-normal">
            <strong className="text-purple-300 font-semibold mr-1">{t('Immediate Effect:', 'Soforteffekt:')}</strong>
            {t('Instantly restores up to +30% Squad Morale, directly strengthening matchday resilience.', 'Stellt sofort bis zu +30% Moral wieder her und stärkt die mentale Spielstärke.')}
          </p>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            disabled={hasBonded || !canAfford || currentMorale === 100}
            className={`w-full py-3.5 px-5 rounded-2xl font-semibold text-sm transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
              hasBonded || currentMorale === 100
                ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                : !canAfford
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_8px_25px_rgba(168,85,247,0.35)] border border-purple-400/30'
            }`}
          >
            {hasBonded
              ? t('Limit Reached (1 per season)', 'Limit erreicht (1 pro Saison)')
              : currentMorale === 100
              ? t('Morale Already Maxed (100%)', 'Moral bereits maximal (100%)')
              : !canAfford 
              ? t('Insufficient Funds', 'Nicht genügend Budget') 
              : t('Authorize Camp', 'Camp veranstalten')}
          </button>
          
          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white transition active:scale-[0.99] cursor-pointer"
          >
            {t('Decline', 'Abbrechen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
