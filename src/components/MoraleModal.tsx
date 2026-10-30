import React from 'react';
import { motion } from 'motion/react';

import { GameState } from '../types';

interface MoraleModalProps {
  state: GameState;
  lang: 'en' | 'de';
  onClose: () => void;
}

export const MoraleModal: React.FC<MoraleModalProps> = ({ state, lang, onClose }) => {
  const isDe = lang === 'de';
  const morale = state.club.morale ?? 100;

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.1, ease: 'linear'}} className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose}></div>
      <motion.div initial={{scale: 0.98, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.98, opacity: 0}} transition={{duration: 0.12, ease: [0.16, 1, 0.3, 1]}} className="bg-[#12141c]/95 w-full max-w-md rounded-[28px] border border-white/10 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-white/5 bg-gradient-to-br from-indigo-900/30 to-[#1c1c1e] flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <h2 className="text-lg font-black text-white flex items-center gap-2 relative z-10">
            <i className="fas fa-users text-indigo-400"></i>
            {isDe ? 'Kader-Moral' : 'Squad Morale'}
          </h2>
          <button aria-label="Close modal" onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition relative z-10 cursor-pointer">
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain flex flex-col gap-4">
          <div className="bg-black/40 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                {isDe ? 'Aktuelle Moral' : 'Current Morale'}
              </span>
              <span className={`text-xl font-black ${morale < 40 ? 'text-red-400' : morale < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>{morale}%</span>
            </div>
            
            <div className="w-full bg-[#1c1c1e] h-2 rounded-full overflow-hidden mb-3 border border-white/5">
              <div className={`h-full rounded-full transition-all duration-500 ${morale < 40 ? 'bg-gradient-to-r from-red-600 to-red-400' : morale < 70 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`} style={{ width: `${Math.min(100, morale)}%` }}></div>
            </div>

            <p className="text-xs text-[#8e8e93] leading-relaxed">
              {isDe 
                ? 'Die Kader-Moral repraesentiert die Stimmung in der Kabine. Sie sinkt durch schwache Ergebnisse auf dem Platz oder durch den Umgang mit den riesigen Egos von Superstar-Spielern (>80 GES). Faellt die Moral unter 40%, weigern sich neue Stars, zu deinem Verein zu wechseln (Key-Transfers sind blockiert). Steigere die Moral durch Siege oder ein Team-Building-Camp im Menue Kader & Transfers.'
                : 'Squad Morale represents the dressing room atmosphere. It drops due to poor results on the pitch or when dealing with the massive egos of superstar players (>85 OVR). If morale drops below 40%, new stars will refuse to join your club (Key Transfers will be locked). You can restore morale by winning matches or organizing a Team Bonding camp in the Squad & Transfers menu.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40">
          <button aria-label="Close modal" onClick={onClose} className="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white font-bold py-3 rounded-xl transition">
            {isDe ? 'Schliessen' : 'Close'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
