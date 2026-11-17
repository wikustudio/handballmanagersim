import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CareerSummary } from './CareerSummary';
import { LeaderboardView } from './LeaderboardView';
import { GameState } from '../types';
import { useModalDismiss } from '../utils/modalUtils';

interface LeaderboardModalProps {
  onClose: () => void;
  onReset?: () => void;
  state: GameState;
  lang?: 'en' | 'de' | 'es';
  isCourtside?: boolean;
  initialTab?: 'summary' | 'leaderboard';
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  onClose,
  onReset,
  state,
  lang = 'en',
  isCourtside = false,
  initialTab,
}) => {
  useModalDismiss(onClose);
  const hasActiveCareer = Boolean(state.managerName && state.club?.name);
  const [activeTab, setActiveTab] = useState<'summary' | 'leaderboard'>(
    initialTab ?? 'leaderboard'
  );

  if (activeTab === 'summary' && hasActiveCareer) {
    return (
      <CareerSummary
        state={state}
        lang={lang as any}
        onClose={onClose}
        onReset={onReset || (() => {})}
        onShowLeaderboard={() => setActiveTab('leaderboard')}
      />
    );
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-3 sm:p-5 z-[10050] backdrop-blur-xl animate-in fade-in duration-150 overflow-y-auto cursor-pointer ${
        isCourtside ? 'bg-black/45' : 'bg-black/80'
      }`}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[92vh] my-auto cursor-default pointer-events-auto rounded-3xl ${
          isCourtside
            ? 'bg-[#ECEAE4] border border-black/[0.08] shadow-[0_28px_70px_rgba(15,23,42,0.24)] text-[#14161D]'
            : 'bg-[#14151e] border border-white/[0.06] shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white'
        }`}
      >
        {/* Modal Top Bar */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
            isCourtside ? 'bg-white border-black/[0.06]' : 'border-white/[0.05]'
          }`}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`font-bold text-sm sm:text-base tracking-tight ${
                isCourtside ? 'text-[#14161D]' : 'text-white'
              }`}
            >
              Global Hall of Fame Leaderboard
            </span>
            {hasActiveCareer && (
              <div
                className={`flex items-center gap-1 p-1 rounded-full ${
                  isCourtside ? 'bg-[#F2F0EB]' : 'bg-[#10121a] border border-white/[0.05]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'leaderboard'
                      ? isCourtside
                        ? 'bg-[#18191F] text-white'
                        : 'bg-white/15 text-white'
                      : isCourtside
                      ? 'text-[#686D7B] hover:text-[#14161D]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Rankings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'summary'
                      ? isCourtside
                        ? 'bg-[#18191F] text-white'
                        : 'bg-white/15 text-white'
                      : isCourtside
                      ? 'text-[#686D7B] hover:text-[#14161D]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Career Summary
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0 ${
              isCourtside
                ? 'bg-[#F2F0EB] hover:bg-[#E5E2DA] text-[#525866] hover:text-[#14161D]'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] text-zinc-400 hover:text-white'
            }`}
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto custom-scrollbar p-4 sm:p-6 flex-1">
          <LeaderboardView state={state} lang={lang} isCourtside={isCourtside} />
        </div>
      </motion.div>
    </div>
  );
};
