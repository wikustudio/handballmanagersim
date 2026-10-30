import React from 'react';
import { motion } from 'motion/react';

import { GameState } from '../types';

interface ShieldsModalProps {
  state: GameState;
  lang: 'en' | 'de';
  onClose: () => void;
}

export const ShieldsModal: React.FC<ShieldsModalProps> = ({ state, lang, onClose }) => {
  const isDe = lang === 'de';
  
  const shields = state.immunityShields || 0;

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.1, ease: 'linear'}} className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose}></div>
      <motion.div initial={{scale: 0.98, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.98, opacity: 0}} transition={{duration: 0.12, ease: [0.16, 1, 0.3, 1]}} className="bg-[#12141c]/95 w-full max-w-md rounded-[28px] border border-white/10 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-br from-amber-900/30 to-[#1c1c1e] flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <h2 className="text-lg font-black text-white flex items-center gap-2 relative z-10">
            <i className="fas fa-shield-virus text-amber-400"></i>
            {(isDe ? 'Vorstands-Immunitaet' : 'Board Immunity')}
          </h2>
          <button aria-label="Close modal" onClick={onClose} className="text-[#8e8e93] hover:text-white transition relative z-10 cursor-pointer">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain flex flex-col gap-4">
          <div className="bg-[#2c2c2e]/60 rounded-xl p-4 border border-white/5 flex flex-col items-center gap-2 text-center">
             <div className="flex gap-2 mb-2">
                {[1, 2, 3].map(i => (
                   <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg border-2 border-[#1c1c1e] transition-all ${i <= shields ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' : 'bg-[#1c1c1e] text-zinc-600 border-dashed border-white/10'}`}>
                      <i className="fas fa-shield-virus"></i>
                   </div>
                ))}
             </div>
             <div>
               <div className="text-xl font-black text-amber-400 leading-tight">{shields} / 3</div>
               <div className="text-sm font-bold text-white">{(isDe ? 'Aktive Vorstands-Schilde' : 'Active Board Shields')}</div>
             </div>
          </div>

          <div className="bg-black/40 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-[#8e8e93] leading-relaxed mb-3">
              The WHYDFML Protocol (What Have You Done For Me Lately) dictates board patience. The board expects you to match or beat your highest ever finish in this tier. Missing that target consumes an Immunity Shield. If you fail with zero shields, you will be sacked!
            </p>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              {(isDe
                ? 'Mit Vorstands-Schilden kannst du eine Entlassung verhindern. Du hast maximal 3 Vorstands-Schilde (Chancen). Du erhaeltst verlorene Vorstands-Schilde durch den Gewinn von Trophaeen zurueck. Alternativ kannst du auch Management-Punkte in den "Unkuendbar"-Bonus investieren.'
                : 'Board Shields prevent you from being fired. You can hold a maximum of 3 shields (chances). You recover lost shields by winning trophies. Alternatively, you can spend Management Points on the "Board Darling" perk to become completely immune to sackings.')}
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
