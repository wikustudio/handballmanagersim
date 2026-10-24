import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { useModalDismiss } from '../utils/modalUtils';

interface SeasonPrepInfoModalProps {
  lang?: Language;
  onClose: () => void;
}

export const SeasonPrepInfoModal: React.FC<SeasonPrepInfoModalProps> = ({ onClose }) => {
  useModalDismiss(onClose);
  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] border border-white/[0.04] rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] cursor-default relative"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

        <div className="p-5 sm:p-6 pb-4 border-b border-white/[0.04] flex justify-between items-center shrink-0">
          <div>
            <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Management Briefing</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
              <i className="fas fa-circle-info text-sky-400 text-base" />
              Season Preparation Protocol
            </h2>
          </div>
          <button 
            aria-label="Close modal"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.06] active:scale-95 cursor-pointer"
          >
            <i className="fas fa-xmark text-xs" />
          </button>
        </div>
        
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-3.5 text-xs sm:text-sm text-zinc-300 flex-1 min-h-0">
          <p className="leading-relaxed text-zinc-300 font-normal">
            During pre-season, you calibrate squad composition, facilities, and commercial budgets before official fixtures commence. Balancing competitive quality against wage sustainability determines survival.
          </p>
          
          <div className="flex flex-col gap-1.5 bg-[#10121a] p-4 rounded-2xl border border-white/[0.04]">
            <h3 className="font-semibold text-white flex items-center gap-2 text-xs sm:text-sm">
              <i className="fas fa-users text-emerald-400 text-xs" /> Roster & Transfers
            </h3>
            <p className="leading-relaxed text-zinc-400 text-xs font-normal">
              Roster limits: Minimum <span className="text-white font-medium tabular-nums">13</span>, maximum <span className="text-white font-medium tabular-nums">22</span> players. Additions bolster overall rating (OVR), while departures create space. Squads exceeding 22 will release fringe prospects without compensation.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 bg-[#10121a] p-4 rounded-2xl border border-white/[0.04]">
            <h3 className="font-semibold text-white flex items-center gap-2 text-xs sm:text-sm">
              <i className="fas fa-landmark text-amber-400 text-xs" /> Commercial & Treasury
            </h3>
            <p className="leading-relaxed text-zinc-400 text-xs font-normal">
              Pitch commercial partners to fund acquisitions. Conservative packages carry reliable approval, whereas High-Stakes partnerships carry risk. Failing a proposal lowers board confidence.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 bg-[#10121a] p-4 rounded-2xl border border-white/[0.04]">
            <h3 className="font-semibold text-white flex items-center gap-2 text-xs sm:text-sm">
              <i className="fas fa-hourglass-half text-rose-400 text-xs" /> Natural Aging & Development
            </h3>
            <p className="leading-relaxed text-zinc-400 text-xs font-normal">
              Each campaign introduces natural physiological aging, development curves, and eventual retirements. Investing into your Youth Academy and Medical Center counteracts structural squad decay.
            </p>
          </div>
        </div>
        
        <div className="p-4 sm:p-5 border-t border-white/[0.04] flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-3 px-5 rounded-xl bg-sky-500/[0.05] hover:bg-sky-500/10 text-sky-300 border border-sky-500/20 font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer"
          >
            Understood
          </button>
        </div>
      </motion.div>
    </div>
  );
};
