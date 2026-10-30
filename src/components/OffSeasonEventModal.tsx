import React from 'react';
import { motion } from 'motion/react';

export interface OffSeasonEvent {
  id: 'wonderkid' | 'stadium' | 'billionaire';
  titleEn: string;
  titleDe: string;
  descEn: string;
  descDe: string;
  options: { labelEn: string; labelDe: string; action: () => void; bgClass?: string }[];
}

interface Props {
  event: OffSeasonEvent;
}

export const OffSeasonEventModal: React.FC<Props> = ({ event }) => {
  const isGold = event.id === 'billionaire';

  const [isProcessing, setIsProcessing] = React.useState(false);
  const handleAction = (action: () => void) => {
    if (isProcessing) return;
    setIsProcessing(true);
    action();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-2xl overflow-y-auto overscroll-contain"
    >
      <motion.div 
        role="dialog"
        aria-modal="true"
        aria-label={event.titleEn}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-md max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-y-auto custom-scrollbar overscroll-contain rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.7)] backdrop-blur-3xl text-center cursor-default bg-[#12141c]/90 border ${
          isGold ? 'border-amber-400/35 shadow-[0_20px_60px_rgba(245,158,11,0.2)]' : 'border-white/[0.08]'
        }`}
      >
        {/* Subtle Ambient Glow */}
        <div 
          className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            isGold ? 'bg-amber-500/15' : 'bg-sky-500/10'
          }`} 
        />

        <div className="relative z-10 mb-5">
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-inner border ${
            isGold 
              ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' 
              : 'bg-white/[0.04] border-white/[0.08] text-sky-400'
          }`}>
            {event.id === 'wonderkid' && <i className="fa-solid fa-star text-xl" />}
            {event.id === 'stadium' && <i className="fa-solid fa-hammer text-xl" />}
            {event.id === 'billionaire' && <i className="fa-solid fa-coins text-xl" />}
          </div>

          <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
            isGold ? 'text-amber-300/90' : 'text-sky-400/90'
          }`}>
            Off-Season Opportunity
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 leading-tight">
            {event.titleEn}
          </h2>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed mt-3">
            {event.descEn}
          </div>
        </div>
        
        <div className="space-y-2.5 relative z-10">
          {event.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAction(opt.action)}
              className={`w-full py-3.5 px-5 rounded-2xl font-semibold text-xs tracking-wide transition active:scale-[0.99] cursor-pointer shadow-sm ${
                i === 0
                  ? isGold
                    ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_4px_20px_rgba(245,158,11,0.25)]'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-[0_4px_20px_rgba(14,165,233,0.3)]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white'
              }`}
            >
              {opt.labelEn}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
