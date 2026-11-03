import React from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import { formatMoney, getCreditLimit } from '../data/gameConstants';
import { useModalScrollLock } from '../utils/modalUtils';

export function BankruptcyModal() {
  const { resolveBankruptcy, club, budget } = useGameStore();
  useModalScrollLock(true);
  const country = club?.country || 'GER';
  const threshold = -getCreditLimit(club?.tier || 1, country);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-2xl z-[100] p-3 sm:p-5">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] border border-rose-500/20 rounded-[28px] p-5 sm:p-7 max-w-lg w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col max-h-[min(92dvh,92vh)] custom-scrollbar"
      >
        {/* Top Radiant Rose Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center text-lg shrink-0">
            <i className="fas fa-triangle-exclamation" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Emergency Hearing
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Financial Liquidation Threat
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
          Your club's treasury (<span className="text-rose-400 font-semibold tabular-nums">{formatMoney(budget || 0, country)}</span>) has breached its statutory credit facility (<span className="text-rose-400 font-semibold tabular-nums">{formatMoney(threshold, country)}</span>) or accumulated 3 consecutive years of expanding debt. The supervisory board demands immediate restructuring to stave off license revocation.
        </p>

        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1 -mr-1">
          <button
            onClick={() => resolveBankruptcy('insolvency')}
            className="w-full text-left p-4 bg-sky-500/[0.03] hover:bg-sky-500/[0.06] border border-white/[0.05] hover:border-sky-500/30 rounded-xl transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="font-semibold text-sm text-white group-hover:text-sky-300 transition-colors mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              File Protective Insolvency
            </div>
            <div className="text-xs text-zinc-400 leading-relaxed pl-3.5">
              Debts are wiped clean by court order. Senior squad quality resets to 40 OVR and the club accepts administrative demotion.
            </div>
          </button>

          <button
            onClick={() => resolveBankruptcy('firesale')}
            className="w-full text-left p-4 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] border border-white/[0.05] hover:border-amber-500/30 rounded-xl transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="font-semibold text-sm text-white group-hover:text-amber-300 transition-colors mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Sanction Emergency Firesale
            </div>
            <div className="text-xs text-zinc-400 leading-relaxed pl-3.5">
              Sell high-wage starters and commercial contracts immediately to clear debt. Base squad quality degrades, but league status is retained.
            </div>
          </button>

          <button
            onClick={() => resolveBankruptcy('resign')}
            className="w-full text-left p-4 bg-rose-500/[0.04] hover:bg-rose-500/[0.08] border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all active:scale-[0.99] cursor-pointer shadow-sm group"
          >
            <div className="font-semibold text-sm text-rose-400 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Resign Head Coach Role
            </div>
            <div className="text-xs text-rose-300/80 leading-relaxed pl-3.5">
              Step down immediately. Your tenure concludes and final career performance metrics are archived.
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
