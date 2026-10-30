import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameState } from '../types';
import { formatMoney } from '../data/gameConstants';
import { t } from '../data/translations';

interface FanBondingModalProps {
  state: GameState;
  lang: string;
  cost: number;
  onConfirm: () => void;
  onClose: () => void;
  creditLimit?: number;
}

export const FanBondingModal: React.FC<FanBondingModalProps> = ({ state, lang, cost, onConfirm, onClose, creditLimit }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const canAfford = state.budget - cost >= -(creditLimit || 0);
  const isAlreadyDone = Boolean(state.fanBondingThisSeason);

  const handleConfirm = () => {
    if (isProcessing || isAlreadyDone || !canAfford) return;
    setIsProcessing(true);
    onConfirm();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col justify-center items-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-[400px] max-h-[92vh] sm:max-h-[88vh] min-h-0 shrink-0 overflow-y-auto custom-scrollbar overscroll-contain my-auto bg-[#1c1c1e] rounded-3xl border border-white/10 shadow-2xl p-5 sm:p-6 text-left">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center text-3xl mb-4 border border-amber-500/30">
            <i className='fas fa-bullhorn'></i>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isAlreadyDone ? 'text-amber-400' : 'text-zinc-400'}`}>
              {isAlreadyDone ? t(lang, 'Held This Season', 'Bereits genutzt') : t(lang, '1x Per Season', '1x pro Saison')}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t(lang, 'Fan Bonding Event', 'Fan-Bindungs-Event')}</h2>
          <p className="text-sm text-[#8e8e93] mt-2">
            {t(lang, 'Host an open training session, meet & greet, or fan festival to appease hardcore supporters and boost reputation.', 'Veranstalte ein offenes Training, Meet & Greet oder Fan-Fest, um die Fans zu beruhigen und Ansehen zu gewinnen.')}
          </p>
        </div>

        <div className="bg-[#2c2c2e]/60 rounded-xl p-4 border border-white/5 mb-6 text-center">
          <div className="text-[10px] text-[#8e8e93] font-bold uppercase tracking-widest mb-1">{t(lang, 'Event Cost', 'Event-Kosten')}</div>
          <div className="text-xl font-black text-white">{formatMoney(cost)}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="text-emerald-400 font-bold mb-1">+2 to +5</div>
            <div className="text-[10px] text-emerald-400/80 uppercase tracking-wider">{t(lang, 'Reputation', 'Ansehen')}</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <div className="text-amber-400 font-bold mb-1">+5,000</div>
            <div className="text-[10px] text-amber-400/80 uppercase tracking-wider">{t(lang, 'Fans', 'Fans')}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-[#2c2c2e] text-white font-bold py-3 rounded-xl hover:bg-[#3c3c3e] transition cursor-pointer">
            {t(lang, 'Cancel', 'Abbrechen')}
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isProcessing || isAlreadyDone || !canAfford}
            className={`flex-1 font-bold py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 ${
              isAlreadyDone
                ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed opacity-60'
                : !canAfford
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : isAlreadyDone ? (
              <i className="fas fa-lock text-xs"></i>
            ) : (
              <i className="fas fa-check"></i>
            )}
            {isAlreadyDone
              ? t(lang, 'Already Held This Season (1x/Season)', 'Diese Saison bereits genutzt (1x/Saison)')
              : !canAfford
              ? t(lang, 'Insufficient Funds', 'Nicht genügend Budget')
              : t(lang, 'Host Event', 'Veranstalten')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
