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
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  onClose,
  onReset,
  state,
  lang = 'en',
}) => {
  useModalDismiss(onClose);
  const hasActiveCareer = Boolean(state.managerName && state.club?.name);
  const [activeTab, setActiveTab] = useState<'summary' | 'leaderboard'>(
    hasActiveCareer ? 'summary' : 'leaderboard'
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
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-5 z-[10050] backdrop-blur-2xl animate-in fade-in duration-150 overflow-y-auto cursor-pointer"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] rounded-2xl border border-white/[0.04] w-full max-w-4xl relative z-10 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] my-auto cursor-default pointer-events-auto"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-white/[0.04] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {hasActiveCareer && (
              <button
                onClick={() => setActiveTab('summary')}
                className="px-3 py-1.5 rounded-xl bg-sky-500/[0.05] hover:bg-sky-500/[0.1] border border-sky-500/20 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <i className="fas fa-arrow-left text-[10px]" />
                <span>Career Summary</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <span className="text-amber-400">🏆</span>
              <span className="font-semibold text-white tracking-tight">Worldwide Highscores</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center transition text-zinc-400 hover:text-white cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto custom-scrollbar p-5 sm:p-6 flex-1">
          <LeaderboardView 
            state={state} 
            lang={lang} 
          />
        </div>
      </motion.div>
    </div>
  );
};
