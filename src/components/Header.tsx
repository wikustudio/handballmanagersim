import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, ViewMode } from '../types';
import { t } from '../data/translations';

interface HeaderProps {
  lang: Language;
  viewMode: ViewMode;
  onToggleLang?: (l: Language) => void;
  onToggleViewMode: (v: ViewMode) => void;
  onResetGame: () => void;
  hasActiveGame: boolean;
  onOpenModModal?: () => void;
  isModActive?: boolean;
  onOpenFeedbackModal?: () => void;
  unreadCrashCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  viewMode,
  onToggleLang,
  onToggleViewMode,
  onResetGame,
  hasActiveGame,
  onOpenModModal,
  isModActive,
  onOpenFeedbackModal,
  unreadCrashCount = 0,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    // Idle prefetch Leaderboard chunk in background so opening it is instantaneous (0ms)
    const prefetchTimer = setTimeout(() => {
      import('./LeaderboardPage').catch(() => {});
    }, 1200);

    return () => {
      clearTimeout(prefetchTimer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const tr = (en: string, de: string) => t(lang, en, de);

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#0c0e15]/90 backdrop-blur-2xl border-b border-white/[0.08] transition-colors">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-3 sm:px-6 py-2.5">
        {/* Brand / Logo */}
        <button
          onClick={() => {
            if (viewMode === 'about' || viewMode === 'leaderboard') {
              onToggleViewMode('game');
            } else {
              onResetGame();
            }
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-90 transition text-left group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm shrink-0 border border-white/[0.15] bg-white/[0.05]">
            <img src="/assets/a_footballsim_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm sm:text-base font-extrabold tracking-tight text-white group-hover:text-amber-300 transition-colors">
            <span className="sm:hidden">FM Sim</span>
            <span className="hidden sm:inline">Football Manager Sim</span>
          </span>
        </button>

        {/* Clean, Streamlined Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Dugout / Career Button */}
          {hasActiveGame ? (
            <button
              onClick={() => {
                if (viewMode !== 'game') {
                  onToggleViewMode('game');
                } else {
                  onResetGame();
                }
              }}
              className={`transition px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0 ${
                viewMode === 'game'
                  ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                  : 'text-sky-300 bg-sky-500/15 border border-sky-400/30'
              }`}
              title={viewMode !== 'game' ? 'Return to Career Dugout' : tr('Start Over', 'Neustart')}
            >
              <i className={`fa-solid ${viewMode !== 'game' ? 'fa-arrow-left text-sky-400' : 'fa-rotate-right text-zinc-400'} text-xs`}></i>
              <span className="hidden sm:inline">{viewMode !== 'game' ? 'Dugout' : tr('Start Over', 'Neustart')}</span>
            </button>
          ) : viewMode !== 'game' && (
            <button
              onClick={() => onToggleViewMode('game')}
              className="text-zinc-300 hover:text-white hover:bg-white/[0.06] transition px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <i className="fa-solid fa-play text-xs text-sky-400"></i>
              <span>Play</span>
            </button>
          )}

          {/* Leaderboard Button */}
          <button
            onClick={() => onToggleViewMode(viewMode === 'leaderboard' ? 'game' : 'leaderboard')}
            onMouseEnter={() => import('./LeaderboardPage').catch(() => {})}
            onTouchStart={() => import('./LeaderboardPage').catch(() => {})}
            className={`transition px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0 ${
              viewMode === 'leaderboard'
                ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
            }`}
            title="Leaderboard & Press Conference Wall"
          >
            <i className="fa-solid fa-trophy text-xs text-amber-400"></i>
            <span>Leaderboard</span>
          </button>

          {/* Feedback & Crash Report Button */}
          {onOpenFeedbackModal && (
            <button
              onClick={onOpenFeedbackModal}
              className={`relative transition px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0 ${
                unreadCrashCount > 0
                  ? 'text-rose-200 bg-rose-500/20 border border-rose-400/40 shadow-[0_0_14px_rgba(244,63,94,0.25)]'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
              title="Submit Crash Report, Bug Fix, or Feature Request"
            >
              <i className={`fa-solid ${unreadCrashCount > 0 ? 'fa-bug text-rose-400 animate-pulse' : 'fa-comment-dots text-emerald-400'} text-xs`}></i>
              <span className="hidden md:inline">Feedback</span>
              {unreadCrashCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black leading-tight">
                  {unreadCrashCount}
                </span>
              )}
            </button>
          )}

          {/* Consolidated "More" Dropdown Menu */}
          <div ref={moreMenuRef} className="relative shrink-0">
            <button
              onClick={() => setMoreMenuOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition text-xs font-bold cursor-pointer active:scale-95 ${
                moreMenuOpen
                  ? 'border-white/30 bg-white/[0.12] text-white shadow-md'
                  : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="More options & community"
            >
              <i className="fa-solid fa-bars text-xs"></i>
              <span>More</span>
              {isModActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
              <i className={`fa-solid fa-chevron-down text-[9px] opacity-60 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {/* Dropdown Drawer */}
            <AnimatePresence>
              {moreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-64 max-w-[calc(100vw-1.5rem)] max-h-[calc(100svh-4.5rem)] overflow-y-auto custom-scrollbar overscroll-contain bg-[#10121a]/98 border border-white/[0.12] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl transform origin-top-right p-2 z-50 text-left"
                >
                {/* Section 1: Game Features */}
                <div className="p-1 space-y-1">
                  <button
                    onClick={() => {
                      onToggleViewMode(viewMode === 'about' ? 'game' : 'about');
                      setMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer text-left"
                  >
                    <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-circle-info text-xs"></i>
                    </div>
                    <span className="truncate">{tr('About & Rules', 'Über & Regeln')}</span>
                  </button>

                  {onOpenFeedbackModal && (
                    <button
                      onClick={() => {
                        onOpenFeedbackModal();
                        setMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer text-left gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-bug text-xs"></i>
                        </div>
                        <span className="truncate">Report Bug / Feedback</span>
                      </div>
                      {unreadCrashCount > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                          {unreadCrashCount} Log{unreadCrashCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-normal shrink-0">Email</span>
                      )}
                    </button>
                  )}

                  {onOpenModModal && (
                    <button
                      onClick={() => {
                        onOpenModModal();
                        setMoreMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer text-left gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-layer-group text-xs"></i>
                        </div>
                        <span className="truncate">CR27 Database Mod</span>
                      </div>
                      {isModActive ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-normal shrink-0">Off</span>
                      )}
                    </button>
                  )}
                </div>

                <div className="h-[1px] bg-white/[0.08] my-1"></div>

                {/* Section 2: Creator Support */}
                <div className="p-1">
                  <a
                    href="https://buymeacoffee.com/willykuhne"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/20 text-amber-300 hover:text-amber-200 text-xs font-bold transition cursor-pointer gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-mug-hot text-xs"></i>
                      </div>
                      <span className="truncate">Buy Me a Coffee</span>
                    </div>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70 shrink-0"></i>
                  </a>
                </div>

                <div className="h-[1px] bg-white/[0.08] my-1"></div>

                {/* Section 3: Community */}
                <div className="p-1 space-y-1">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-0.5">
                    Community
                  </div>
                  <a
                    href="https://www.reddit.com/r/FootballManagerSim/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#ff4500]/15 text-[#ff4500] flex items-center justify-center shrink-0">
                        <i className="fa-brands fa-reddit text-xs"></i>
                      </div>
                      <span className="truncate">Reddit</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">r/FootballManagerSim</span>
                  </a>
                </div>

                <div className="h-[1px] bg-white/[0.08] my-1"></div>

                {/* Section 4: Other Sim Games */}
                <div className="p-1 space-y-1">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-0.5">
                    Other Games
                  </div>
                  <a
                    href="https://handballmanagersim.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-volleyball text-xs"></i>
                      </div>
                      <span className="truncate">Handball Manager Sim</span>
                    </div>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-50 shrink-0"></i>
                  </a>
                </div>

                {/* Section 5: Language Switcher */}
                {onToggleLang && (
                  <>
                    <div className="h-[1px] bg-white/[0.08] my-1"></div>
                    <div className="p-1.5 flex items-center justify-between bg-black/30 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                        Language
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onToggleLang('en');
                            setMoreMenuOpen(false);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            lang === 'en'
                              ? 'bg-white/20 text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          English
                        </button>
                        <button
                          onClick={() => {
                            onToggleLang('de');
                            setMoreMenuOpen(false);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            lang === 'de'
                              ? 'bg-white/20 text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Deutsch
                        </button>
                      </div>
                    </div>
                  </>
                )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>
    </header>
  );
};
