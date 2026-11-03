import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '../types';
import { formatMoney } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';

export const PerformanceDealModal: React.FC<{
  state: GameState;
  result: any;
  onClose: () => void;
}> = ({ state, result, onClose }) => {
  useModalDismiss(onClose);
  const isSuccess = Boolean(result.success);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[10020] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#14151e] border border-white/[0.04] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar cursor-default relative p-6 sm:p-7"
      >
        {/* Top Ambient Glow */}
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${isSuccess ? 'via-emerald-400/30' : 'via-rose-500/30'} to-transparent pointer-events-none`} />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className={`mb-4 flex items-center justify-center w-14 h-14 rounded-2xl ${
            isSuccess 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          } text-2xl`}>
            <i className={`fas ${isSuccess ? 'fa-check' : 'fa-xmark'}`} />
          </div>

          <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>Commercial Clause</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
             {isSuccess ? 'Incentive Unlocked!' : 'Target Not Reached'}
          </h2>
          
          <div className="text-zinc-300 font-normal text-xs sm:text-sm mb-6 leading-relaxed">
             {isSuccess ? (
                <>
                  Finished in Top Half at Pos <span className="font-semibold text-white tabular-nums">{result.pos}</span>.<br/>
                  <span className="text-emerald-400 font-semibold tabular-nums">+{formatMoney(result.payout)}</span> performance bonus transferred!
                </>
             ) : (
                <>
                  Finished Pos <span className="font-semibold text-white tabular-nums">{result.pos}</span> (Target: <span className="tabular-nums">{result.target}</span>).<br/>
                  The contractual qualification threshold was missed.
                </>
             )}
          </div>
          
          <button 
            onClick={onClose}
            className={`w-full font-semibold py-3.5 px-5 rounded-2xl transition-all active:scale-[0.99] text-xs sm:text-sm cursor-pointer border ${
              isSuccess 
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20 shadow-sm' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.06]'
            }`}
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
};
