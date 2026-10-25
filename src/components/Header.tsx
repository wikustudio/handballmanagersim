import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { Language, ViewMode } from '../types';
import { t } from '../data/translations';
import { ConfirmResetModal } from './ConfirmResetModal';
import { HandballSimLogo } from './HandballSimLogo';
import { isRealDataModActive, getCustomDb } from '../utils/modManager';
import { openConsentBanner } from '../utils/consentManager';
import { SaveBackupModal } from './SaveBackupModal';
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
  const menuRef = useRef<HTMLDivElement>(null);

  const [isModActive, setIsModActive] = useState<boolean>(() => {
    return isRealDataModActive() || Boolean(getCustomDb());
  });

  useEffect(() => {
    const handleModChange = () => {
      setIsModActive(isRealDataModActive() || Boolean(getCustomDb()));
    };
    window.addEventListener('mod-state-change', handleModChange);
    window.addEventListener('storage', handleModChange);
    return () => {
      window.removeEventListener('mod-state-change', handleModChange);
      window.removeEventListener('storage', handleModChange);
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
    <header className="fixed top-0 inset-x-0 z-40 border-b border-white/[0.08] bg-[#090a0f]/90 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5">
        {/* Left: Brand Logo & Title */}
        <button
          onClick={() => {
            if (viewMode === 'about') {
              onToggleViewMode('game');
            } else if (hasActiveGame) {
              setShowConfirm(true);
            }
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-85 transition text-left select-none min-w-0"
          title="Handball Manager Sim"
        >
          <HandballSimLogo className="w-8 h-8 rounded-xl shrink-0 border border-white/20 p-0.5 bg-zinc-900" />
          <span className="font-bold tracking-tight text-white font-sans text-xs xs:text-sm sm:text-base truncate">
            {tr('Handball Manager Sim', 'Handball Manager Sim')}
          </span>
        </button>

        {/* Right side navigation matching clean design */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Start Over button (visible when game is active on desktop) */}
          {hasActiveGame && (
            <button
              onClick={() => setShowConfirm(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition cursor-pointer py-1.5 px-2 rounded-lg hover:bg-white/[0.05]"
              title={tr('Start Over', 'Neustart')}
            >
              <i className="fas fa-rotate-right text-[11px]" />
              <span className="font-medium">{tr('Start Over', 'Neustart')}</span>
            </button>
          )}

          {/* Leaderboard button */}
          {onShowLeaderboard && (
            <button
              onClick={onShowLeaderboard}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 hover:border-white/20 text-zinc-200 hover:text-white text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
              title={tr('Global Leaderboard', 'Globale Bestenliste')}
            >
              <i className="fas fa-trophy text-amber-400 text-xs" />
              <span>{tr('Leaderboard', 'Bestenliste')}</span>
            </button>
          )}

          {/* More Menu Dropdown Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              aria-expanded={showMenu}
              aria-label="More Menu"
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer active:scale-95 shadow-sm ${
                showMenu
                  ? 'bg-zinc-800 text-white border-sky-400 ring-2 ring-sky-400/30'
                  : 'bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/15 hover:border-white/25 text-zinc-200 hover:text-white'
              }`}
            >
              <i className="fas fa-bars text-xs text-zinc-300" />
              <span>{tr('More', 'Mehr')}</span>
              {isModActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
              )}
              <i
                className={`fas ${showMenu ? 'fa-chevron-up' : 'fa-chevron-down'} text-[9px] text-zinc-400 transition-transform duration-200`}
              />
            </button>

            {/* Dropdown Menu Popup */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-80 rounded-2xl bg-[#0f111a] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2.5 sm:p-3 flex flex-col gap-1 z-50 overflow-hidden"
                >
                  {/* Item 1: About & Rules */}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onToggleViewMode(viewMode === 'about' ? 'game' : 'about');
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition text-left cursor-pointer w-full group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/20 text-sky-400 flex items-center justify-center shrink-0">
                      <i className="fas fa-circle-info text-sm" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-zinc-200 group-hover:text-white font-medium text-sm">
                        {tr('About & Rules', 'Über das Spiel & Regeln')}
                      </span>
                    </div>
                  </button>

                  {/* Item 2: Database Mod with Active Badge */}
                  {onOpenMods && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onOpenMods();
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] transition text-left cursor-pointer w-full group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <i className="fas fa-layer-group text-sm" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-zinc-200 group-hover:text-white font-medium text-sm truncate">
                            {isModActive
                              ? (activeModName || tr('Handball Manager Database', 'Handball Manager Datenbank'))
                              : tr('User Databases', 'Benutzer-Datenbanken')}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                          isModActive
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {isModActive ? 'Active' : 'Off'}
                      </span>
                    </button>
                  )}



                  {/* Item 4: Buy Me a Coffee */}
                  <a
                    href="https://buymeacoffee.com/willykuhne"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] transition text-left cursor-pointer w-full group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                        <i className="fas fa-mug-hot text-sm" />
                      </div>
                      <span className="text-zinc-200 group-hover:text-white font-medium text-sm">
                        {tr('Buy Me a Coffee', 'Kaffee spendieren')}
                      </span>
                    </div>
                    <i className="fas fa-arrow-up-right-from-square text-zinc-500 text-xs group-hover:text-zinc-300 transition-transform" />
                  </a>


                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowSaveBackup(true);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] transition text-left cursor-pointer w-full group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/20 text-sky-400 flex items-center justify-center shrink-0">
                        <i className="fas fa-cloud-arrow-down text-sm" />
                      </div>
                      <span className="text-zinc-200 group-hover:text-white font-medium text-sm">
                        {tr('Save Backup & Transfer', 'Spielstand-Sicherung & Transfer')}
                      </span>
                    </div>
                    <i className="fas fa-arrow-right-arrow-left text-zinc-500 text-xs group-hover:text-zinc-300" />
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      openConsentBanner();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] transition text-left cursor-pointer w-full group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/20 text-sky-400 flex items-center justify-center shrink-0">
                        <i className="fas fa-shield-halved text-sm" />
                      </div>
                      <span className="text-zinc-200 group-hover:text-white font-medium text-sm">
                        {tr('Privacy & Cookies', 'Datenschutz & Cookies')}
                      </span>
                    </div>
                    <i className="fas fa-sliders text-zinc-500 text-xs group-hover:text-zinc-300" />
                  </button>

                  {/* Other Games */}
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                    {tr('OTHER GAMES', 'WEITERE SPIELE')}
                  </div>
                  <a
                    href="https://footballmanagersim.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] transition text-left cursor-pointer w-full group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <i className="fas fa-futbol text-sm" />
                      </div>
                      <span className="text-zinc-200 group-hover:text-white font-medium text-sm">
                        Football Manager Sim
                      </span>
                    </div>
                    <i className="fas fa-arrow-up-right-from-square text-zinc-500 text-xs group-hover:text-zinc-300 transition-transform" />
                  </a>

                  {/* Start Over Button when career active (mobile fallback in menu) */}
                  {hasActiveGame && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowConfirm(true);
                      }}
                      className="flex sm:hidden items-center gap-3 p-2.5 rounded-xl hover:bg-rose-500/10 transition text-left cursor-pointer w-full group text-rose-400 mt-1 border-t border-white/[0.08]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <i className="fas fa-rotate-right text-xs" />
                      </div>
                      <span className="font-medium text-sm text-rose-300 group-hover:text-rose-200">
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

      {/* Save Backup & Transfer Modal */}
      <SaveBackupModal
        isOpen={showSaveBackup}
        onClose={() => setShowSaveBackup(false)}
        state={state}
        lang={lang}
      />

      {/* Confirmation Modal for Reset */}
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
