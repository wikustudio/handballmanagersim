import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { Language, ViewMode } from '../types';
import { ConfirmResetModal } from './ConfirmResetModal';
import { HandballSimLogo } from './HandballSimLogo';
import { ClubLogo } from './ClubLogo';
import { isRealDataModActive, getCustomDb } from '../utils/modManager';
import { openConsentBanner } from '../utils/consentManager';
import { SaveBackupModal } from './SaveBackupModal';
import { FeedbackModal } from './FeedbackModal';
import { FeedbackType } from '../utils/crashReporter';
import { useGameStore } from '../store/useGameStore';
import { CourtsideNavTab } from './CourtsideWorkspace';
import { buildNotificationBellFeed } from '../utils/notificationFeed';

interface HeaderProps {
  onShowLeaderboard?: () => void;
  onOpenMods?: () => void;
  lang?: Language;
  viewMode: ViewMode;
  onToggleViewMode: (v: ViewMode) => void;
  onResetGame: () => void;
  hasActiveGame: boolean;
  isCourtside?: boolean;
  activeTab?: CourtsideNavTab;
  onSelectTab?: (tab: CourtsideNavTab) => void;
}

const QUICK_COMMANDS = [
  { id: 'simulate', label: 'Simulate Half / Matchday', category: 'Overview' },
  { id: 'standings', label: 'League Standings Table', category: 'Overview' },
  { id: 'sponsors', label: 'Sponsorship Deals', category: 'Commercial' },
  { id: 'ipo', label: 'Stock Market & IPO', category: 'Commercial' },
  { id: 'ledger', label: 'Financial Ledger', category: 'Commercial' },
  { id: 'transfers', label: 'Transfer Market & Signings', category: 'Squad' },
  { id: 'youth', label: 'Youth Academy & Scouting', category: 'Squad' },
  { id: 'tactics', label: 'Coach & Tactical System', category: 'Squad' },
  { id: 'arena', label: 'Arena Expansion & Attendance', category: 'Infrastructure' },
  { id: 'impact', label: 'Club Impact & Reputation', category: 'Board & Manager' },
  { id: 'press', label: 'Press Room & Media Scrutiny', category: 'Board & Manager' },
  { id: 'skills', label: 'Manager Skills (MP)', category: 'Board & Manager' },
  { id: 'jobs', label: 'European Job Market', category: 'Board & Manager' },
];

export const Header: React.FC<HeaderProps> = ({
  lang = 'en',
  viewMode,
  onToggleViewMode,
  onResetGame,
  hasActiveGame,
  onShowLeaderboard,
  onOpenMods,
  isCourtside = false,
  activeTab = 'overview',
  onSelectTab,
}) => {
  const state = useGameStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSaveBackup, setShowSaveBackup] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackInitialType, setFeedbackInitialType] = useState<FeedbackType | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
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

  const dispatchCommand = (cmd: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('courtside-command', { detail: cmd }));
    }
  };

  const filteredCommands = QUICK_COMMANDS.filter((c) =>
    !searchQuery.trim()
      ? true
      : c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6);

  const managerInitials = (state.managerName || 'DR')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const mediaScore = state.club?.name ? state.mediaPressure ?? 22 : 20;
  const bellFeed = buildNotificationBellFeed(state);

  return (
    <>
      <header
        className={
          isCourtside
            ? 'fixed top-0 inset-x-0 z-40 bg-[#ECEAE4]/96 border-b border-black/[0.05]'
            : 'fixed top-0 inset-x-0 z-40 border-b border-white/[0.06] bg-[#090a0f]/92'
        }
      >
        <div
          className={`${
            isCourtside
              ? 'max-w-[1440px] flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr]'
              : 'max-w-7xl flex items-center justify-between'
          } mx-auto w-full gap-2.5 px-3 sm:px-6 py-2 sm:py-2.5`}
        >
          {/* Zone 1 (Left): Brand & Active Club Crest (Clicks to Team Modal in Courtside) */}
          <button
            onClick={() => {
              if (viewMode === 'about') {
                onToggleViewMode('game');
              } else if (isCourtside && hasActiveGame && state.club?.name) {
                dispatchCommand('club-profile');
              } else if (isCourtside && onSelectTab) {
                onSelectTab('overview');
              } else if (hasActiveGame) {
                setShowConfirm(true);
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition text-left select-none min-w-0 justify-self-start"
            title={
              isCourtside && hasActiveGame && state.club?.name
                ? `Inspect ${state.club.name}`
                : 'Handball Manager Sim'
            }
          >
            {isCourtside && hasActiveGame && state.club?.name ? (
              <ClubLogo
                club={state.club}
                clubId={state.club.id}
                name={state.club.name}
                color={state.club.color}
                color2={state.club.color2}
                logo={state.club.logo}
                fallbackLogo={state.club.fallbackLogo}
                className="w-8 h-8 rounded-lg object-contain shrink-0"
              />
            ) : (
              <HandballSimLogo className="w-8 h-8 rounded-xl shrink-0" />
            )}
            <span
              className={`font-bold tracking-tight text-[13px] sm:text-[15px] truncate max-w-[165px] sm:max-w-none whitespace-nowrap ${
                isCourtside ? 'text-[#14161D]' : 'text-white'
              }`}
            >
              {isCourtside && hasActiveGame && state.club?.name
                ? state.club.name
                : tr('Handball Manager', 'Handball Manager')}
            </span>
          </button>

          {/* Zone 2 (Mathematically Centered): 5-Item Courtside Menu (Active Career Only) */}
          {isCourtside && hasActiveGame && onSelectTab ? (
            <nav
              aria-label="Workspace Sections"
              className="hidden md:flex items-center gap-0.5 bg-white rounded-full p-1 shadow-[0_4px_18px_rgba(15,23,42,0.05)] border border-black/[0.05] shrink-0 justify-self-center"
            >
              {(
                [
                  { id: 'overview', label: 'Overview', icon: 'fa-border-all' },
                  { id: 'commercial', label: 'Commercial', icon: 'fa-coins' },
                  { id: 'squad', label: 'Squad', icon: 'fa-user-group' },
                  { id: 'infrastructure', label: 'Infrastructure', icon: 'fa-building-columns' },
                  { id: 'board', label: 'Board & Manager', icon: 'fa-user-tie' },
                ] as { id: CourtsideNavTab; label: string; icon: string }[]
              ).map((tab) => {
                const isActive = viewMode === 'game' && activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (viewMode !== 'game') {
                        onToggleViewMode('game');
                      }
                      onSelectTab(tab.id);
                    }}
                    className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#18191F] text-white shadow-xs'
                        : 'text-[#686D7B] hover:text-[#14161D]'
                    }`}
                  >
                    <i aria-hidden="true" className={`fas ${tab.icon} text-[10px]`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : isCourtside ? (
            <div className="hidden md:block" aria-hidden="true" />
          ) : null}

          {/* Zone 3 (Right): Command Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-self-end">
            {isCourtside && hasActiveGame ? (
              <>
                {/* Search / Quick Command Input */}
                <div className="relative hidden 2xl:block" ref={searchRef}>
                  <div className="flex items-center gap-2 bg-white rounded-full px-3.5 py-1.5 w-[185px] border border-black/[0.05] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
                    <i className="fas fa-magnifying-glass text-[11px] text-[#5C6270]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => setSearchFocused(true)}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchFocused(true);
                      }}
                      placeholder="Search actions..."
                      aria-label="Search actions and modals"
                      className="w-full bg-transparent text-xs text-[#14161D] placeholder-[#5C6270] outline-none !text-[12px]"
                    />
                  </div>
                  {searchFocused && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-black/[0.08] shadow-[0_18px_40px_rgba(15,23,42,0.14)] p-1.5 z-50">
                      {filteredCommands.map((cmd) => (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => {
                            dispatchCommand(cmd.id);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-3 py-2 rounded-xl hover:bg-[#F5F4F0] flex items-center justify-between text-left transition cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-[#14161D]">{cmd.label}</span>
                          <span className="text-[10px] font-medium text-[#525866]">{cmd.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notification Center Bell (Latest 5 Popups + Missed Important Updates) */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    aria-expanded={showNotifications}
                    aria-label="Notifications and Missed Updates"
                    onClick={() => {
                      const nextOpen = !showNotifications;
                      setShowNotifications(nextOpen);
                      setShowMenu(false);
                      if (nextOpen) {
                        state.markBellNotificationsSeen?.();
                      }
                    }}
                    title="Notifications & Important Club Updates"
                    className={`relative w-[40px] h-[40px] xl:w-[38px] xl:h-[38px] rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 touch-manipulation ${
                      showNotifications
                        ? 'bg-[#18191F] text-white border-[#18191F]'
                        : 'bg-white hover:bg-[#F7F6F2] border-black/[0.05] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-[#14161D]'
                    }`}
                  >
                    <i aria-hidden="true" className="far fa-bell text-[13px]" />
                    {bellFeed.badgeCount > 0 && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold tabular-nums flex items-center justify-center border border-white ${
                          bellFeed.missedUpdates.some((u) => u.severity === 'high') || mediaScore >= 68
                            ? 'bg-rose-600 text-white'
                            : 'bg-[#DF642A] text-white'
                        }`}
                      >
                        {Math.min(9, bellFeed.badgeCount)}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 6 }}
                        transition={{ duration: 0.14, ease: 'easeOut' }}
                        className="fixed sm:absolute right-3 sm:right-0 top-[56px] sm:top-full sm:mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 rounded-[22px] bg-white border border-black/[0.08] shadow-[0_24px_60px_rgba(15,23,42,0.18)] p-3.5 flex flex-col gap-3 z-50 max-h-[80vh] overflow-y-auto custom-scrollbar"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.06]">
                          <div>
                            <h3 className="text-sm font-bold text-[#14161D] tracking-tight">
                              Club Notifications
                            </h3>
                            <span className="text-[11px] text-[#6E7381]">
                              Missed updates &amp; last 5 alerts · Season {state.year}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNotifications(false);
                              if (viewMode !== 'game') onToggleViewMode('game');
                              dispatchCommand('press');
                            }}
                            className="px-2.5 py-1 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            Press Room ({Math.round(mediaScore)})
                          </button>
                        </div>

                        {/* Section 1: Important & Missed Club Updates */}
                        {bellFeed.missedUpdates.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-[#686D7B]">
                              Actionable &amp; Missed Updates
                            </span>
                            {bellFeed.missedUpdates.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setShowNotifications(false);
                                  if (viewMode !== 'game') {
                                    onToggleViewMode('game');
                                  }
                                  onSelectTab?.(item.targetTab);
                                  setTimeout(() => dispatchCommand(item.command), 20);
                                }}
                                className="w-full p-2.5 rounded-2xl bg-[#F6F5F1] hover:bg-[#ECE9E1] border border-black/[0.04] text-left transition cursor-pointer flex items-start justify-between gap-2.5"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-xs font-bold truncate ${
                                        item.severity === 'high'
                                          ? 'text-rose-700'
                                          : 'text-[#14161D]'
                                      }`}
                                    >
                                      {item.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#525866] leading-snug mt-0.5 line-clamp-2">
                                    {item.detail}
                                  </p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-white text-[#14161D] border border-black/[0.06] text-[10px] font-semibold shrink-0 whitespace-nowrap mt-0.5">
                                  {item.actionLabel}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Section 2: Latest 5 Popup Notifications */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#686D7B]">
                              Latest Popup Notifications (Last 5)
                            </span>
                            <span className="text-[10px] text-[#525866] tabular-nums">
                              {bellFeed.recentPopups.length}/5
                            </span>
                          </div>
                          {bellFeed.recentPopups.length === 0 ? (
                            <div className="p-3 rounded-2xl bg-[#F6F5F1] text-[11px] text-[#525866] text-center">
                              No popup notifications recorded yet this season. Decisions, signings, and match alerts appear here.
                            </div>
                          ) : (
                            bellFeed.recentPopups.map((notif) => (
                              <div
                                key={notif.id}
                                className="p-2.5 rounded-2xl bg-white border border-black/[0.06] flex flex-col gap-0.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-semibold text-[#525866] truncate">
                                    {notif.title ||
                                      (notif.type === 'celebration'
                                        ? 'Trophy Triumph'
                                        : notif.type === 'error' || notif.type === 'danger'
                                        ? 'Club Alert'
                                        : notif.type === 'success'
                                        ? 'Confirmed'
                                        : 'Club Dispatch')}
                                  </span>
                                  {notif.seasonYear && (
                                    <span className="text-[10px] text-[#5C6270] tabular-nums shrink-0">
                                      {notif.seasonYear}/{String((notif.seasonYear + 1) % 100).padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-[#14161D] leading-snug">
                                  {notif.message}
                                </p>
                                {notif.subtitle && (
                                  <p className="text-[11px] text-[#6E7381] leading-snug">
                                    {notif.subtitle}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Manager Profile Pill */}
                <button
                  type="button"
                  onClick={() => dispatchCommand('profile')}
                  className="hidden sm:flex items-center gap-2 bg-white hover:bg-[#F7F6F2] rounded-full pl-1.5 pr-3 py-1 border border-black/[0.05] shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition cursor-pointer text-left shrink-0"
                  title="Open Manager Profile & Legacy"
                >
                  <span className="w-7 h-7 rounded-full bg-[#1E2638] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {managerInitials}
                  </span>
                  <span className="hidden lg:flex flex-col leading-tight">
                    <span className="text-[12px] font-bold text-[#14161D] max-w-[96px] truncate">
                      {state.managerName || 'Director'}
                    </span>
                    <span className="text-[10px] text-[#525866] max-w-[96px] truncate">
                      {state.directorArchetype || 'Sporting Director'}
                    </span>
                  </span>
                </button>
              </>
            ) : isCourtside ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackInitialType(undefined);
                    setShowFeedback(true);
                  }}
                  aria-label={tr('Feedback', 'Feedback')}
                  className="h-[40px] xl:h-[38px] px-3 sm:px-3.5 rounded-full bg-white hover:bg-[#F7F6F2] border border-black/[0.06] text-[#525866] hover:text-[#14161D] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                  title={tr('Submit Feedback, Bug Fix, or Crash Report', 'Feedback, Bug oder Absturz melden')}
                >
                  <i aria-hidden="true" className="fas fa-comment-dots text-[11px] text-[#525866]" />
                  <span className="hidden sm:inline">{tr('Feedback', 'Feedback')}</span>
                </button>

                {onShowLeaderboard && (
                  <button
                    type="button"
                    onClick={onShowLeaderboard}
                    className="h-[40px] xl:h-[38px] px-3 sm:px-3.5 rounded-full bg-white hover:bg-[#F7F6F2] border border-black/[0.06] text-[#14161D] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                    title={tr('Global Leaderboard', 'Globale Bestenliste')}
                  >
                    <i aria-hidden="true" className="fas fa-trophy text-[#B45309] text-[11px]" />
                    <span>{tr('Leaderboard', 'Bestenliste')}</span>
                  </button>
                )}
              </>
            ) : (
              <>
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
              </>
            )}

            {/* More Menu Dropdown Trigger */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                aria-expanded={showMenu}
                aria-label="More Menu"
                className={`rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 border whitespace-nowrap touch-manipulation ${
                  isCourtside
                    ? `w-[40px] h-[40px] xl:w-auto xl:h-[38px] xl:px-3.5 ${
                        showMenu
                          ? 'bg-[#18191F] text-white border-[#18191F]'
                          : 'bg-white hover:bg-[#F7F6F2] border-black/[0.06] text-[#14161D] shadow-[0_2px_10px_rgba(15,23,42,0.04)]'
                      }`
                    : `min-h-[38px] px-3 py-1.5 ${
                        showMenu
                          ? 'bg-white/[0.1] text-white border-white/20'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] hover:border-white/[0.14] text-zinc-300 hover:text-white'
                      }`
                }`}
              >
                <i aria-hidden="true" className={`fas fa-bars text-[12px] ${isCourtside ? 'opacity-85' : 'text-zinc-400'}`} />
                <span className={isCourtside ? 'hidden xl:inline font-semibold' : ''}>
                  {tr('More', 'Mehr')}
                </span>
              </button>

              {/* Dropdown Menu Popup (Courtside Light Matched when in Courtside!) */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 6 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    className={`absolute top-full right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-76 rounded-2xl p-2 flex flex-col gap-0.5 z-50 overflow-hidden ${
                      isCourtside
                        ? 'bg-white border border-black/[0.08] shadow-[0_24px_60px_rgba(15,23,42,0.16)]'
                        : 'bg-[#0e1018] border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.9)]'
                    }`}
                  >
                    {isCourtside && onShowLeaderboard && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onShowLeaderboard();
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F5F4F0] transition text-left cursor-pointer w-full group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-700 flex items-center justify-center shrink-0">
                          <i className="fas fa-trophy text-xs" />
                        </div>
                        <span className="text-[#14161D] font-semibold text-xs sm:text-sm">
                          {tr('Global Leaderboard', 'Globale Bestenliste')}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onToggleViewMode(viewMode === 'about' ? 'game' : 'about');
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition text-left cursor-pointer w-full group ${
                        isCourtside ? 'hover:bg-[#F5F4F0]' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isCourtside
                            ? 'bg-[#F5F4F0] border border-black/[0.06] text-[#525866]'
                            : 'bg-white/[0.04] border border-white/[0.07] text-zinc-300'
                        }`}
                      >
                        <i className="fas fa-circle-info text-xs" />
                      </div>
                      <span
                        className={`font-medium text-xs sm:text-sm ${
                          isCourtside ? 'text-[#14161D]' : 'text-zinc-200 group-hover:text-white'
                        }`}
                      >
                        {tr('About & Rules', 'Über das Spiel & Regeln')}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setFeedbackInitialType(undefined);
                        setShowFeedback(true);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer w-full group ${
                        isCourtside ? 'hover:bg-[#F5F4F0]' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCourtside
                              ? 'bg-[#F5F4F0] border border-black/[0.06] text-[#525866]'
                              : 'bg-white/[0.04] border border-white/[0.07] text-zinc-300'
                          }`}
                        >
                          <i className="fas fa-bug text-xs" />
                        </div>
                        <span
                          className={`font-medium text-xs sm:text-sm ${
                            isCourtside ? 'text-[#14161D]' : 'text-zinc-200 group-hover:text-white'
                          }`}
                        >
                          {tr('Report Crash / Feature Request', 'Absturz melden / Vorschlag')}
                        </span>
                      </div>
                      <i
                        className={`fas fa-chevron-right text-[10px] ${
                          isCourtside ? 'text-[#5C6270]' : 'text-zinc-600 group-hover:text-zinc-300'
                        }`}
                      />
                    </button>

                    {onOpenMods && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onOpenMods();
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer w-full group ${
                          isCourtside ? 'hover:bg-[#F5F4F0]' : 'hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isCourtside
                                ? 'bg-[#F5F4F0] border border-black/[0.06] text-[#525866]'
                                : 'bg-white/[0.04] border border-white/[0.07] text-zinc-300'
                            }`}
                          >
                            <i className="fas fa-layer-group text-xs" />
                          </div>
                          <span
                            className={`font-medium text-xs sm:text-sm truncate ${
                              isCourtside ? 'text-[#14161D]' : 'text-zinc-200 group-hover:text-white'
                            }`}
                          >
                            {isModActive
                              ? (activeModName || tr('Handball Manager Database', 'Handball Manager Datenbank'))
                              : tr('User Databases', 'Benutzer-Datenbanken')}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                            isModActive
                              ? isCourtside
                                ? 'bg-emerald-500/12 text-emerald-700 border-emerald-500/25'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                              : isCourtside
                              ? 'bg-[#F5F4F0] text-[#525866] border-black/[0.06]'
                              : 'bg-white/[0.03] text-zinc-500 border-white/[0.06]'
                          }`}
                        >
                          {isModActive ? 'Active' : 'Off'}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowSaveBackup(true);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer w-full group ${
                        isCourtside ? 'hover:bg-[#F5F4F0]' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCourtside
                              ? 'bg-[#F5F4F0] border border-black/[0.06] text-[#525866]'
                              : 'bg-white/[0.04] border border-white/[0.07] text-zinc-300'
                          }`}
                        >
                          <i className="fas fa-cloud-arrow-down text-xs" />
                        </div>
                        <span
                          className={`font-medium text-xs sm:text-sm ${
                            isCourtside ? 'text-[#14161D]' : 'text-zinc-200 group-hover:text-white'
                          }`}
                        >
                          {tr('Save Backup & Transfer', 'Spielstand-Sicherung & Transfer')}
                        </span>
                      </div>
                      <i
                        className={`fas fa-arrow-right-arrow-left text-[10px] ${
                          isCourtside ? 'text-[#5C6270]' : 'text-zinc-600 group-hover:text-zinc-300'
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        openConsentBanner();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer w-full group ${
                        isCourtside ? 'hover:bg-[#F5F4F0]' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCourtside
                              ? 'bg-[#F5F4F0] border border-black/[0.06] text-[#525866]'
                              : 'bg-white/[0.04] border border-white/[0.07] text-zinc-300'
                          }`}
                        >
                          <i className="fas fa-shield-halved text-xs" />
                        </div>
                        <span
                          className={`font-medium text-xs sm:text-sm ${
                            isCourtside ? 'text-[#14161D]' : 'text-zinc-200 group-hover:text-white'
                          }`}
                        >
                          {tr('Privacy & Cookies', 'Datenschutz & Cookies')}
                        </span>
                      </div>
                      <i
                        className={`fas fa-sliders text-[10px] ${
                          isCourtside ? 'text-[#5C6270]' : 'text-zinc-600 group-hover:text-zinc-300'
                        }`}
                      />
                    </button>

                    {/* Sister Sports Management Sims */}
                    <div
                      className={`mt-1 pt-2 border-t flex flex-col gap-1 ${
                        isCourtside ? 'border-black/[0.06]' : 'border-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`px-2.5 text-[10px] font-semibold ${
                          isCourtside ? 'text-[#525866]' : 'text-zinc-500'
                        }`}
                      >
                        More Sports Management Sims
                      </span>
                      <a
                        href="https://footballmanagersim.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowMenu(false)}
                        className={`flex items-center justify-between p-2 rounded-xl transition text-left w-full ${
                          isCourtside
                            ? 'hover:bg-[#F5F4F0] text-[#14161D]'
                            : 'hover:bg-white/[0.05] text-zinc-200 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-medium">Football Manager Sim</span>
                        <i
                          aria-hidden="true"
                          className={`fas fa-arrow-up-right-from-square text-[10px] ${
                            isCourtside ? 'text-[#5C6270]' : 'text-zinc-500'
                          }`}
                        />
                      </a>
                      <a
                        href="https://basketballmanagersim.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowMenu(false)}
                        className={`flex items-center justify-between p-2 rounded-xl transition text-left w-full ${
                          isCourtside
                            ? 'hover:bg-[#F5F4F0] text-[#14161D]'
                            : 'hover:bg-white/[0.05] text-zinc-200 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-medium">Basketball Manager Sim</span>
                        <i
                          aria-hidden="true"
                          className={`fas fa-arrow-up-right-from-square text-[10px] ${
                            isCourtside ? 'text-[#5C6270]' : 'text-zinc-500'
                          }`}
                        />
                      </a>
                    </div>

                    {hasActiveGame && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowConfirm(true);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition text-left cursor-pointer w-full group mt-1 border-t ${
                          isCourtside
                            ? 'hover:bg-rose-50 text-rose-600 border-black/[0.06]'
                            : 'hover:bg-rose-500/10 text-rose-400 border-white/[0.06]'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCourtside
                              ? 'bg-rose-50 border border-rose-200 text-rose-600'
                              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          }`}
                        >
                          <i className="fas fa-rotate-right text-xs" />
                        </div>
                        <span
                          className={`font-semibold text-xs sm:text-sm ${
                            isCourtside ? 'text-rose-600' : 'text-rose-300 group-hover:text-rose-200'
                          }`}
                        >
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
