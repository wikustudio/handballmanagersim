import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { formatMoney } from '../data/gameConstants';
import { t as tr } from '../data/translations';

interface TeamBondingModalProps {
  state: GameState;
  lang: Language;
  cost: number;
  onClose: () => void;
  onConfirm: () => void;
  canAfford: boolean;
}

export const TeamBondingModal: React.FC<TeamBondingModalProps> = ({ state, lang, cost, onClose, onConfirm, canAfford }) => {
  const isDe = lang === 'de';
  const t = (en: string, de?: string) => tr(lang, en, de);

  const currentMorale = state.club.morale ?? 100;
  const isAlreadyDone = Boolean(state.teamBondingThisSeason);
  const costScaleInfo = t(`Tier ${state.club.tier} football pricing`, `Skaliert für Liga ${state.club.tier}`);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-2xl text-left cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/90 backdrop-blur-3xl border border-white/[0.08] w-full max-w-md rounded-[28px] sm:rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden relative cursor-default"
      >
        {/* Subtle Ambient Sky-Blue Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 text-base shadow-inner shrink-0">
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90">
                  {t('Squad Dynamics', 'Kadermoral')}
                </span>
                <span className="text-zinc-600 text-xs">·</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isAlreadyDone ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {isAlreadyDone ? t('Held This Season', 'Bereits genutzt') : t('1x Per Season', '1x pro Saison')}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                {t('Team Bonding Retreat', 'Team-Building Klausur')}
              </h2>
            </div>
          </div>
          <button 
            aria-label="Close modal" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.08] cursor-pointer shrink-0"
          >
            <i className="fas fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 custom-scrollbar relative z-10">
          {/* Narrative description */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3 sm:p-3.5 text-xs text-zinc-300 leading-relaxed font-normal">
            {t(
              'Organize an off-site squad retreat to boost dressing-room morale (1x per season).',
              'Organisiere einen Ausflug für die Mannschaft, um die Kabinenmoral zu stärken (1x pro Saison).'
            )}
          </div>

          {/* Gamble Outcome Probabilities Bento */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                {t('Gamble Outcome Spectrum', 'Mögliche Spannbreite')}
              </span>
              <span className="font-mono text-xs font-bold text-sky-400">
                0% – 40% {t('Morale', 'Moral')}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/[0.04] text-center">
                <div className="text-[9px] text-zinc-500 font-semibold uppercase">{t('Flop', 'Flop')}</div>
                <div className="text-sm font-bold text-zinc-400 font-mono mt-0.5">0%</div>
                <div className="text-[9px] text-zinc-600 mt-0.5">{t('No effect', 'Kein Effekt')}</div>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/[0.04] text-center">
                <div className="text-[9px] text-zinc-500 font-semibold uppercase">{t('Modest', 'Gering')}</div>
                <div className="text-sm font-bold text-sky-300 font-mono mt-0.5">+5-10%</div>
                <div className="text-[9px] text-zinc-500 mt-0.5">{t('Small spark', 'Etwas Moral')}</div>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/[0.04] text-center">
                <div className="text-[9px] text-zinc-500 font-semibold uppercase">{t('Solid', 'Solide')}</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">+15-25%</div>
                <div className="text-[9px] text-emerald-400/80 mt-0.5">{t('Good spirit', 'Guter Geist')}</div>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 border border-amber-400/20 text-center">
                <div className="text-[9px] text-amber-400 font-semibold uppercase">{t('Jackpot', 'Jackpot')}</div>
                <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">+30-40%</div>
                <div className="text-[9px] text-amber-300/80 mt-0.5">{t('Camaraderie', 'Mega-Schub')}</div>
              </div>
            </div>

            {/* Current Morale Bar */}
            <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[11px] text-zinc-400">{t('Current Squad Morale', 'Aktuelle Kadermoral')}</span>
                <span className="font-mono font-bold text-white">{currentMorale}%</span>
              </div>
              <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    currentMorale < 40 ? 'bg-rose-500' : currentMorale < 70 ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${currentMorale}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
              <span className="text-zinc-400">{t('Required Investment', 'Erforderliche Investition')}</span>
              <div className="text-right">
                <span className="font-mono font-bold text-white">{formatMoney(cost)}</span>
                <span className="text-[10px] text-zinc-500 ml-1.5 font-normal">· {costScaleInfo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={onConfirm}
            disabled={!canAfford || currentMorale >= 100 || isAlreadyDone}
            className={`flex-1 py-3.5 px-5 rounded-2xl font-semibold text-xs tracking-wide transition shadow-sm ${
              isAlreadyDone
                ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                : currentMorale >= 100
                ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                : !canAfford
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 cursor-not-allowed'
                : 'bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white cursor-pointer'
            }`}
          >
            {isAlreadyDone
              ? t('Already Held This Season (1x/Season)', 'Diese Saison bereits genutzt (1x/Saison)')
              : currentMorale >= 100
              ? t('Morale Already Maxed (100%)', 'Moral bereits bei 100%')
              : !canAfford 
              ? t('Insufficient Funds', 'Nicht genügend Budget') 
              : t('Roll The Dice · Authorize Retreat', 'Wagnis eingehen · Klausur starten')}
          </button>
          
          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="py-3.5 px-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs transition border border-white/[0.08] cursor-pointer"
          >
            {t('Decline', 'Abbrechen')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
