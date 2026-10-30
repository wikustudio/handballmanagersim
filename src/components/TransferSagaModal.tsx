import React from 'react';
import { TransferSaga, TransferSagaOption } from '../types';
import { formatMoney } from '../data/gameConstants';

interface TransferSagaModalProps {
  saga: TransferSaga;
  onSelectOption: (option: TransferSagaOption) => void;
  onClose?: () => void;
}

export const TransferSagaModal: React.FC<TransferSagaModalProps> = ({ saga, onSelectOption, onClose }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSelectOption = (opt: TransferSagaOption) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onSelectOption(opt);
    // Auto-unlock after 400ms so validation returns (e.g. credit/squad limit) do not permanently brick the UI
    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1c1c1e] border border-amber-500/40 rounded-3xl max-w-xl w-full p-4 sm:p-6 text-white shadow-2xl relative flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto overflow-hidden text-left shrink-0 cursor-default"
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header - Pinned at top */}
        <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4 shrink-0 relative z-10">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg sm:text-xl shadow-lg shrink-0 mt-0.5">
              <i className="fas fa-handshake-simple"></i>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                High-Stakes Transfer Saga
              </span>
              <h2 className="text-base sm:text-xl font-black text-white leading-tight break-words">{saga.title}</h2>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close transfer saga"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition border border-white/10 shrink-0 cursor-pointer"
            >
              <i className="fas fa-xmark text-xs"></i>
            </button>
          )}
        </div>

        {/* Scrollable Body with single-thumb scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain pr-0.5 space-y-3 sm:space-y-4 relative z-10">
          {/* Player & Suitor Badge */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-xs sm:text-sm shrink-0">
                {saga.playerPos}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm sm:text-base text-white break-words">{saga.playerName}</div>
                <div className="text-[11px] sm:text-xs text-white/60">
                  Overall Rating: <span className="font-mono font-bold text-amber-300">{saga.playerOvr} OVR</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 max-w-[45%]">
              <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider block">Interested Party</span>
              <span className="text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-1 justify-end truncate">
                <i className="fas fa-landmark text-[9px] sm:text-[10px] shrink-0"></i> <span className="truncate">{saga.suitorClub}</span>
              </span>
            </div>
          </div>

          {/* Narrative Description */}
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed bg-white/5 p-3 sm:p-3.5 rounded-xl border border-white/5">
            {saga.narrative}
          </p>

          {/* Options */}
          <div className="space-y-2.5 sm:space-y-3 pb-1">
            {saga.options.map((opt, idx) => (
              <button
                key={idx}
                disabled={isSubmitting}
                onClick={() => handleSelectOption(opt)}
                className="w-full text-left p-3 sm:p-3.5 rounded-2xl bg-[#2c2c2e] hover:bg-[#3c3c3e] border border-white/10 hover:border-amber-400/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group flex items-start gap-3 active:scale-[0.99]"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-300 text-xs sm:text-sm mt-0.5 shrink-0 transition">
                  <i className={`fas ${opt.icon}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition">
                    {opt.title}
                  </div>
                  <div className="text-[11px] sm:text-xs text-white/60 mt-0.5 leading-snug">{opt.desc}</div>
                  {/* Consequence tags */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                    {opt.budgetChange !== 0 && (
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          opt.budgetChange > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {opt.budgetChange > 0 ? '+' : ''}
                        {formatMoney(opt.budgetChange)}
                      </span>
                    )}
                    {opt.ovrChange !== 0 && (
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          opt.ovrChange > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {opt.ovrChange > 0 ? '+' : ''}
                        {opt.ovrChange} Squad OVR
                      </span>
                    )}
                    {opt.moraleChange !== 0 && (
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          opt.moraleChange > 0
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {opt.moraleChange > 0 ? '+' : ''}
                        {opt.moraleChange} Morale
                      </span>
                    )}
                    {opt.successRate !== undefined && (
                      <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {Math.round(opt.successRate * 100)}% Success Odds
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
