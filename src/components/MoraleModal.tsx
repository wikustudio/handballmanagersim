import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { useModalDismiss } from '../utils/modalUtils';

interface MoraleModalProps {
  state: GameState;
  lang?: Language;
  onClose: () => void;
}

export const MoraleModal: React.FC<MoraleModalProps> = ({ state, onClose }) => {
  useModalDismiss(onClose);
  const morale = Math.round(state.club.morale ?? 100);

  const moraleStatus =
    morale < 40 ? 'Dressing Room Unrest' : morale < 70 ? 'Subdued Atmosphere' : 'Harmonious & Unified';
  const moraleColor =
    morale < 40 ? 'text-rose-400' : morale < 70 ? 'text-amber-400' : 'text-emerald-400';
  const glowAccent =
    morale < 40 ? 'via-rose-500/25' : morale < 70 ? 'via-amber-400/25' : 'via-emerald-400/25';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-0 cursor-pointer" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 8, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] w-full max-w-md rounded-[28px] border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden relative z-10 flex flex-col max-h-[90vh] cursor-default text-white"
      >
        {/* Top Ambient Hairline */}
        <div
          className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent ${glowAccent} to-transparent pointer-events-none`}
        />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-white/[0.04] flex justify-between items-center shrink-0 bg-[#14151e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-base shrink-0">
              <i className="fas fa-users" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 leading-none mb-1">
                SQUAD PSYCHOLOGY
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none">
                Squad Morale
              </h2>
            </div>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-white/[0.04] active:scale-95 cursor-pointer"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <div className="bg-[#10121a] rounded-2xl p-4 sm:p-5 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">
                  CURRENT MORALE
                </span>
                <div className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300 inline-flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      morale < 40 ? 'bg-rose-400' : morale < 70 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>{moraleStatus}</span>
                </div>
              </div>
              <span className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${moraleColor}`}>
                {morale}%
              </span>
            </div>

            <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-colors ${
                  morale < 40 ? 'bg-rose-500' : morale < 70 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, morale))}%` }}
              />
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-normal pt-3 border-t border-white/[0.04]">
              Squad Morale measures dressing room cohesion and competitive resilience. Disappointing runs on court or friction with superstar players (&gt;85 OVR) lowers morale. When morale sinks below{' '}
              <span className="text-rose-400 font-semibold tabular-nums">40%</span>, elite transfer targets will refuse to sign. Victories and dedicated Team Retreat camps restore spirits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.04] bg-[#10121a] shrink-0">
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-full py-2.5 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-colors active:scale-[0.99] border border-white/[0.06] cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
