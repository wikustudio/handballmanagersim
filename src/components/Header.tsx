import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { Language, ViewMode } from '../types';
import { ConfirmResetModal } from './ConfirmResetModal';
import { HandballSimLogo } from './HandballSimLogo';
import { isRealDataModActive, getCustomDb } from '../utils/modManager';
import { openConsentBanner } from '../utils/consentManager';
import { SaveBackupModal } from './SaveBackupModal';
import { FeedbackModal } from './FeedbackModal';
import { FeedbackType } from '../utils/crashReporter';
import { useGameStore } from '../store/useGameStore';

interface HeaderProps {
  onShowLeaderboard?: () => void;
  onOpenMods?: () => void;
  lang?: Language;
  viewMode: ViewMode;
  onToggleViewMode: (v: ViewMode) => void;
  onResetGame: () => void;
  hasActiveGame: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang = 'en',
  viewMode,
  onToggleViewMode,
  onResetGame,
  hasActiveGame,
  onShowLeaderboard,
  onOpenMods,
}) => {
  const state = useGameStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSaveBackup, setShowSaveBackup] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackInitialType, setFeedbackInitialType] = useState<FeedbackType | undefined>(undefined);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isModActive, setIsModActive] = useState<boolean>(() => {
    return isRealDataModActive() || Boolean(getCustomDb());
  });

  useEffect(() => {
    const handleModChange = () => {
      setIsModActive(isRealDataModActive() || Boolean(getCustomDb()));
    };
    const handleOpenFeedback = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setFeedbackInitialType(detail?.type);
      setShowFeedback(true);
    };
    window.addEventListener('mod-state-change', handleModChange);
    window.addEventListener('storage', handleModChange);
    window.addEventListener('open-feedback-modal', handleOpenFeedback);
    return () => {
      window.removeEventListener('mod-state-change', handleModChange);
      window.removeEventListener('storage', handleModChange);
      window.removeEventListener('open-feedback-modal', handleOpenFeedback);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tr = (en: string, _de?: string) => en;

  const activeModName = (() => {
    if (getCustomDb()) return 'Custom Community Mod';
    return isRealDataModActive() ? 'Handball Manager Database' : null;
  })();

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 border-b border-white/[0.06] bg-[#090a0f]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-2.5">
          {/* Left: Brand Logo & Title */}
          <button
            onClick={() => {
              if (viewMode === 'about') {
                onToggleViewMode('game');
              } else if (hasActiveGame) {
                setShowConfirm(true);
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition text-left select-none min-w-0"
            title="Handball Manager Sim"
          >
            <HandballSimLogo className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" />
            <span className="font-semibold tracking-tight text-white text-xs xs:text-sm sm:text-[15px] truncate">
              {tr('Handball Manager', 'Handball Manager')}
            </span>
          </button>

          {/* Right: Command Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {hasActiveGame && (
              <button
                onClick={() => setShowConfirm(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-white/[0.04]"
                title={tr('Start Over', 'Neustart')}
              >
                <i className="fas fa-rotate-right text-[10px] text-zinc-500" />
                <span className="font-medium">{tr('Reset', 'Neustart')}</span>
              </button>
            )}

            <button
              onClick={() => {
                setFeedbackInitialType(undefined);
                setShowFeedback(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.14] text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer active:scale-95"
              title={tr('Submit Feedback, Bug Fix, or Crash Report', 'Feedback, Bug oder Absturz melden')}
            >
              <i className="fas fa-comment-dots text-zinc-400 text-[11px]" />
              <span className="hidden sm:inline">{tr('Feedback', 'Feedback')}</span>
            </button>

            {onShowLeaderboard && (
              <button
                onClick={onShowLeaderboard}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.14] text-zinc-200 hover:text-white text-xs font-medium transition cursor-pointer active:scale-95"
                title={tr('Global Leaderboard', 'Globale Bestenliste')}
              >
                <i className="fas fa-trophy text-amber-400 text-[11px]" />
                <span>{tr('Leaderboard', 'Bestenliste')}</span>
              </button>
            )}

            {/* More Menu Dropdown Trigger */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                aria-expanded={showMenu}
                aria-label="More Menu"
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer active:scale-95 border ${
                  showMenu
                    ? 'bg-white/[0.1] text-white border-white/20'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] hover:border-white/[0.14] text-zinc-300 hover:text-white'
                }`}
              >
                <i className="fas fa-bars text-[11px] text-zinc-400" />
                <span>{tr('More', 'Mehr')}</span>
                {isModActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                <i
                  className={`fas ${showMenu ? 'fa-chevron-up' : 'fa-chevron-down'} text-[9px] text-zinc-500 transition-transform duration-200`}
                />
              </button>

              {/* Dropdown Menu Popup */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 6 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    className="absolute top-full right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-76 rounded-2xl bg-[#0e1018] border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.9)] p-2 flex flex-col gap-0.5 z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onToggleViewMode(viewMode === 'about' ? 'game' : 'about');
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.05] transition text-left cursor-pointer w-full group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center justify-center shrink-0">
                        <i className="fas fa-circle-info text-xs" />
                      </div>
                      <span className="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm">
                        {tr('About & Rules', 'Über das Spiel & Regeln')}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setFeedbackInitialType(undefined);
                        setShowFeedback(true);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition text-left cursor-pointer w-full group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center justify-center shrink-0">
                          <i className="fas fa-bug text-xs" />
                        </div>
                        <span className="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm">
                          {tr('Report Crash / Feature Request', 'Absturz melden / Vorschlag')}
                        </span>
                      </div>
                      <i className="fas fa-chevron-right text-zinc-600 text-[10px] group-hover:text-zinc-300" />
                    </button>

                    {onOpenMods && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onOpenMods();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition text-left cursor-pointer w-full group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center justify-center shrink-0">
                            <i className="fas fa-layer-group text-xs" />
                          </div>
                          <span className="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm truncate">
                            {isModActive
                              ? (activeModName || tr('Handball Manager Database', 'Handball Manager Datenbank'))
                              : tr('User Databases', 'Benutzer-Datenbanken')}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                            isModActive
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                              : 'bg-white/[0.03] text-zinc-500 border-white/[0.06]'
                          }`}
                        >
                          {isModActive ? 'Active' : 'Off'}
                        </span>
                      </button>
                    )}

                    <a
                      href="https://buymeacoffee.com/willykuhne"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition text-left cursor-pointer w-full group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center justify-center shrink-0">
                          <i className="fas fa-mug-hot text-xs" />
                        </div>
                        <span className="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm">
                          {tr('Buy Me a Coffee', 'Kaffee spendieren')}
                        </span>
                      </div>
                      <i className="fas fa-arrow-up-right-from-square text-zinc-600 text-[10px] group-hover:text-zinc-300" />
                    </a>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowSaveBackup(true);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition text-left cursor-pointer w-full group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center justify-center shrink-0">
                          <i className="fas fa-cloud-arrow-down text-xs" />
                        </div>
                        <span className="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm">
                          {tr('Save Backup & Transfer', 'Spielstand-Sicherung & Transfer')}
                        </span>
                      </div>
                      <i className="fas fa-arrow-right-arrow-left text-zinc-600 text-[10px] group-hover:text-zinc-300" />
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        openConsentBanner();
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition text-left cursor-pointer w-full group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center justify-center shrink-0">
                          <i className="fas fa-shield-halved text-xs" />
                        </div>
                        <span className="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm">
                          {tr('Privacy & Cookies', 'Datenschutz & Cookies')}
                        </span>
                      </div>
                      <i className="fas fa-sliders text-zinc-600 text-[10px] group-hover:text-zinc-300" />
                    </button>

                    <div className="px-2.5 pt-2 pb-1 mt-1 border-t border-white/[0.05] text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      {tr('Other Games', 'Weitere Spiele')}
                    </div>
                    <a
                      href="https://footballmanagersim.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition text-left cursor-pointer w-full group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center justify-center shrink-0">
                          <i className="fas fa-futbol text-xs" />
                        </div>
                        <span className="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm">
                          Football Manager Sim
                        </span>
                      </div>
                      <i className="fas fa-arrow-up-right-from-square text-zinc-600 text-[10px] group-hover:text-zinc-300" />
                    </a>
                    <a
                      href="https://basketballmanagersim.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition text-left cursor-pointer w-full group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center justify-center shrink-0">
                          <i className="fas fa-basketball text-xs" />
                        </div>
                        <span className="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm">
                          Basketball Manager Sim
                        </span>
                      </div>
                      <i className="fas fa-arrow-up-right-from-square text-zinc-600 text-[10px] group-hover:text-zinc-300" />
                    </a>

                    {hasActiveGame && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowConfirm(true);
                        }}
                        className="flex sm:hidden items-center gap-3 p-2.5 rounded-xl hover:bg-rose-500/10 transition text-left cursor-pointer w-full group text-rose-400 mt-1 border-t border-white/[0.06]"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                          <i className="fas fa-rotate-right text-xs" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm text-rose-300 group-hover:text-rose-200">
                          {tr('Start Over', 'Neustart')}
                        </span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <SaveBackupModal
        isOpen={showSaveBackup}
        onClose={() => setShowSaveBackup(false)}
        state={state}
        lang={lang}
      />

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        lang={lang}
        initialType={feedbackInitialType}
      />

      <AnimatePresence>
        {showConfirm && (
          <ConfirmResetModal
            lang={lang}
            onClose={() => setShowConfirm(false)}
            onConfirm={() => {
              setShowConfirm(false);
              onResetGame();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};
