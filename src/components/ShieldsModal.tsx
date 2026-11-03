import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '../types';
import { useModalDismiss } from '../utils/modalUtils';

interface ShieldsModalProps {
  state: GameState;
  lang?: 'en' | 'de';
  onClose: () => void;
}

export const ShieldsModal: React.FC<ShieldsModalProps> = ({ state, onClose }) => {
  useModalDismiss(onClose);
  const shields = state.immunityShields ?? 1;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] w-full max-w-md rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden relative z-10 flex flex-col max-h-[88vh] cursor-default"
      >
        {/* Top Ambient Highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-5 pb-4 border-b border-white/[0.04] flex justify-between items-center relative shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs shadow-sm">
              <i className="fas fa-shield-virus" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Board Immunity Shields
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium">Board Confidence Lifeline</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition border border-white/[0.06] cursor-pointer"
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[#10121a] rounded-2xl p-5 border border-white/[0.04] flex flex-col items-center gap-3 text-center">
             <div className="flex gap-2.5 my-1">
                {[1, 2, 3].map(i => (
                   <div 
                     key={`shield-${i}`} 
                     className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all ${
                       i <= shields 
                         ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                         : 'bg-black/40 text-zinc-600 border border-white/[0.04]'
                     }`}
                   >
                      <i className="fas fa-shield-virus" />
                   </div>
                ))}
             </div>
             <div>
               <div className="text-2xl font-semibold text-amber-300 tracking-tight tabular-nums">{shields} / 3</div>
               <div className="text-xs font-medium text-zinc-400 mt-0.5">Active Board Lifelines</div>
             </div>
          </div>

          <div className="bg-[#10121a] rounded-2xl p-4 border border-white/[0.04] space-y-3">
            <p className="text-xs text-zinc-300 font-normal leading-relaxed">
              Immunity shields protect your managerial tenure against sudden dismissal when season targets are missed or when suffering a single relegation setback.
            </p>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 leading-snug">
              <strong className="font-semibold text-rose-200 flex items-center gap-1.5 mb-1">
                <i className="fas fa-triangle-exclamation text-rose-400 text-xs" />
                <span>Multiple Relegation Rule</span>
              </strong>
              Suffering two relegations within any three-season span is deemed an intolerable club crisis and triggers immediate dismissal by the board, regardless of available shields or past trophies.
            </div>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed pt-2 border-t border-white/[0.04]">
              Trophies and promotions replenish consumed shields. Alternatively, manager perks can unlock unconditional tenure.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.04] flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-2.5 bg-amber-500/[0.05] hover:bg-amber-500/10 text-amber-300 font-semibold text-xs rounded-xl transition cursor-pointer border border-amber-500/20 shadow-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
