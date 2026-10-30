import React from 'react';
import { motion } from 'motion/react';
import { formatNum } from '../data/gameConstants';

interface MatchResult {
  opponent: string;
  ourScore: number;
  theirScore: number;
}

export interface GlobalTourSummaryData {
  matches: MatchResult[];
  fansGained: number;
  moraleChange?: number;
  ovrChange: number;
  cost: number;
  clubName: string;
}

interface GlobalTourModalProps {
  summary: GlobalTourSummaryData;
  lang: 'en' | 'de';
  onClose: () => void;
}

export const GlobalTourModal: React.FC<GlobalTourModalProps> = ({ summary, lang, onClose }) => {
  const isDe = lang === 'de';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 bg-black/75 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#12141c]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[28px] sm:rounded-[32px] w-full max-w-md overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 text-left"
      >
        {/* Subtle Ambient Sky-Blue Accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 text-base shadow-inner shrink-0">
              <i className="fas fa-plane-departure"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5">
                {isDe ? 'Saisonvorbereitung' : 'Pre-Season Expedition'}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                {isDe ? 'Tour Zusammenfassung' : 'Global Tour Summary'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.08] cursor-pointer shrink-0"
          >
            <i className="fas fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain custom-scrollbar flex-1 min-h-0 space-y-4 relative z-10">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 text-center">
            <div className="text-xs font-semibold text-white tracking-tight">
              {summary.clubName} {isDe ? 'Globale Tour' : 'Global Tour'}
            </div>
            <p className="text-xs text-zinc-400 font-normal mt-0.5">
              {isDe ? 'Drei internationale Vorbereitungsspiele erfolgreich absolviert.' : 'Three international exhibition fixtures completed.'}
            </p>
          </div>

          {/* Fixtures list */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
              {isDe ? 'Spielergebnisse' : 'Match Results'}
            </div>
            {summary.matches.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-3 border border-white/[0.05] transition-colors">
                <div className="w-2/5 text-right text-xs font-semibold text-white truncate">{summary.clubName}</div>
                <div className="w-1/5 flex justify-center items-center gap-1.5 font-mono">
                  <span className={`text-sm font-bold ${m.ourScore > m.theirScore ? 'text-emerald-400' : m.ourScore < m.theirScore ? 'text-rose-400' : 'text-zinc-300'}`}>
                    {m.ourScore}
                  </span>
                  <span className="text-zinc-600 text-xs">:</span>
                  <span className={`text-sm font-bold ${m.theirScore > m.ourScore ? 'text-emerald-400' : m.theirScore < m.ourScore ? 'text-rose-400' : 'text-zinc-300'}`}>
                    {m.theirScore}
                  </span>
                </div>
                <div className="w-2/5 text-left text-xs font-medium text-zinc-400 truncate">{m.opponent}</div>
              </div>
            ))}
          </div>

          {/* Outcome Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
             <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] text-center">
               <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                 {isDe ? 'Fans Gewonnen' : 'Fans Gained'}
               </div>
               <div className={`text-xl font-bold font-mono ${summary.moraleChange && summary.moraleChange < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                 {`+${(summary.fansGained || 0).toLocaleString()}`}
               </div>
             </div>
             <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] text-center">
               <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                 {isDe ? 'OVR Einfluss' : 'OVR Impact'}
               </div>
               <div className={`text-xl font-bold font-mono ${summary.ovrChange < 0 ? 'text-rose-400' : summary.ovrChange > 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                 {summary.ovrChange > 0 ? `+${summary.ovrChange}` : summary.ovrChange < 0 ? summary.ovrChange : (isDe ? '0' : '0')}
               </div>
             </div>
          </div>
          
          {summary.ovrChange < 0 && (
             <div className="text-xs text-rose-300 font-medium bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20 flex items-center gap-2">
               <i className="fas fa-triangle-exclamation text-rose-400 shrink-0"></i>
               <span>{isDe ? 'Die Spieler sind von den Reisen erschöpft!' : 'The squad is exhausted from the demanding travel schedule.'}</span>
             </div>
          )}
          {summary.ovrChange > 0 && (
             <div className="text-xs text-emerald-300 font-medium bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 flex items-center gap-2">
               <i className="fas fa-circle-check text-emerald-400 shrink-0"></i>
               <span>{isDe ? 'Die Tour war ein voller Erfolg für die Teammoral!' : 'The tour was a massive success for team cohesion and sharpness.'}</span>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] shrink-0 relative z-10">
          <button 
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-semibold text-sm tracking-wide transition-all shadow-sm cursor-pointer"
          >
            {isDe ? 'Weiter' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
