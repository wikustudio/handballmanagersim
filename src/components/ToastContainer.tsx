import React, { useEffect, useState, useRef } from 'react';
import { GameState } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import { mergeNotificationsIntoHistory } from '../utils/notificationFeed';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export const ToastContainer = ({ state }: { state: GameState }) => {
  const unreadNotifs = (state.notifications || []).filter((n: any) => !n.read);
  const { width, height } = useWindowSize();
  const [celebrating, setCelebrating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const recordedIdsRef = useRef<Set<string>>(new Set());

  // Immediately clear previous backlog when multiple unread notifications arrive/exist
  useEffect(() => {
    const rawNotifs = (state.notifications || []).filter((n: any) => !n.read);
    const currentHistory = useGameStore.getState().notificationHistory || [];
    if (recordedIdsRef.current.size > 200) {
      recordedIdsRef.current = new Set(Array.from(recordedIdsRef.current).slice(-60));
    }

    if (rawNotifs.length > 1) {
      const newlyAdded = rawNotifs.filter((n: any) => n.id && !prevIdsRef.current.has(n.id));
      const latest = newlyAdded.length > 0
        ? newlyAdded[newlyAdded.length - 1]
        : rawNotifs[rawNotifs.length - 1];
      prevIdsRef.current = new Set(latest?.id ? [latest.id] : []);
      rawNotifs.forEach((n: any) => {
        if (n?.id) recordedIdsRef.current.add(String(n.id));
      });
      if (latest) {
        const nextHistory = mergeNotificationsIntoHistory(currentHistory, rawNotifs, state.year);
        useGameStore.getState().updateState({
          notifications: [latest],
          ...(nextHistory !== currentHistory ? { notificationHistory: nextHistory } : {}),
        });
      }
    } else {
      prevIdsRef.current = new Set(rawNotifs.map((n: any) => n.id).filter(Boolean));
      if (rawNotifs.length === 1) {
        const single = rawNotifs[0];
        const singleId = String(single?.id || '');
        const alreadyRecorded =
          !singleId ||
          recordedIdsRef.current.has(singleId) ||
          currentHistory.some((h) => h.id === singleId);
        if (!alreadyRecorded) {
          recordedIdsRef.current.add(singleId);
          const nextHistory = mergeNotificationsIntoHistory(currentHistory, rawNotifs, state.year);
          if (nextHistory !== currentHistory) {
            useGameStore.getState().updateState({
              notificationHistory: nextHistory,
            });
          }
        }
      }
    }
  }, [state.notifications, state.year]);

  // Pick the single newest active notification (latest incoming)
  const activeNotif = unreadNotifs.length > 0 ? unreadNotifs[unreadNotifs.length - 1] : null;
  const visibleNotifs = activeNotif ? [activeNotif] : [];

  // Confetti triggers synchronously for celebrations and cancels immediately if replaced
  useEffect(() => {
    if (activeNotif?.type === 'celebration') {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 2800);
      return () => clearTimeout(t);
    } else {
      setCelebrating(false);
    }
  }, [activeNotif?.id, activeNotif?.type]);

  // Fast 2.8s auto-close timer on active notification (resets and cancels instantly if a new popup arrives)
  useEffect(() => {
    if (activeNotif && !isHovered) {
      const timer = setTimeout(() => {
        useGameStore.getState().dismissNotification(activeNotif.id);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [activeNotif?.id, isHovered]);

  return (
    <>
      {celebrating && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={160}
          recycle={false}
          gravity={0.22}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000010, pointerEvents: 'none' }}
        />
      )}
      <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] sm:top-5 left-1/2 -translate-x-1/2 z-[1000005] flex flex-col gap-2 pointer-events-none w-[calc(100%-1.25rem)] max-w-sm sm:max-w-md px-0.5">
        <AnimatePresence mode="popLayout">
          {visibleNotifs.map((notif: any, nIdx: number) => {
            const isSuccess = notif.type === 'success';
            const isCelebration = notif.type === 'celebration';
            const isError = notif.type === 'danger' || notif.type === 'error';
            const isWarning = notif.type === 'warning';
            const isInfo = notif.type === 'info';

            let iconClass = 'fa-bell';
            let iconBoxStyle = 'bg-sky-50 text-sky-700 border-sky-200';
            let categoryLabel = 'Official Wire';
            let progressBarColor = 'bg-sky-600';

            if (isCelebration) {
              iconClass = 'fa-trophy';
              iconBoxStyle = 'bg-amber-50 text-amber-700 border-amber-200';
              categoryLabel = 'Decision Day · Triumph';
              progressBarColor = 'bg-amber-500';
            } else if (isSuccess) {
              iconClass = 'fa-check';
              iconBoxStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              categoryLabel = 'Dispatch · Confirmed';
              progressBarColor = 'bg-emerald-600';
            } else if (isError) {
              iconClass = 'fa-triangle-exclamation';
              iconBoxStyle = 'bg-rose-50 text-rose-700 border-rose-200';
              categoryLabel = 'Critical · Alert';
              progressBarColor = 'bg-rose-600';
            } else if (isWarning) {
              iconClass = 'fa-bolt';
              iconBoxStyle = 'bg-amber-50 text-amber-800 border-amber-200';
              categoryLabel = 'Boardroom · Notice';
              progressBarColor = 'bg-amber-600';
            } else if (isInfo) {
              iconClass = 'fa-newspaper';
              iconBoxStyle = 'bg-[#F5F4F0] text-[#14161D] border-black/[0.08]';
              categoryLabel = 'Broadcast · Feed';
              progressBarColor = 'bg-[#18191F]';
            }

            return (
              <motion.div
                key={`toast-${notif.id || 'notif'}-${nIdx}`}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="pointer-events-auto relative overflow-hidden flex items-center gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-[20px] bg-white/96 backdrop-blur-xl border border-black/[0.08] shadow-[0_18px_46px_rgba(15,23,42,0.16)] text-[#14161D] group touch-manipulation"
              >
                {/* Auto-close Progress Bar (2.8s linear countdown) */}
                <motion.div
                  key={`progress-${notif.id}`}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 2.8, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                  className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${progressBarColor} pointer-events-none opacity-85`}
                />

                {/* Status Icon Pillar */}
                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border text-xs relative z-10 transition-transform group-hover:scale-105 ${iconBoxStyle}`}>
                  {isCelebration ? (
                    <svg width="20" height="22" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id={`toast-cup-${notif.id}`} x1="20" y1="15" x2="80" y2="75" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#fef08a" />
                          <stop offset="40%" stopColor="#facc15" />
                          <stop offset="75%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#ca8a04" />
                        </linearGradient>
                        <linearGradient id={`toast-base-${notif.id}`} x1="25" y1="85" x2="75" y2="115" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#fde047" />
                          <stop offset="100%" stopColor="#854d0e" />
                        </linearGradient>
                      </defs>
                      <path d="M32 24 C14 24 10 42 16 56 C21 68 33 68 36 67 C34 62 26 59 23 51 C20 42 22 32 32 30 Z" fill={`url(#toast-cup-${notif.id})`} stroke="#ca8a04" strokeWidth="1.5" />
                      <path d="M68 24 C86 24 90 42 84 56 C79 68 67 68 64 67 C66 62 74 59 77 51 C80 42 78 32 68 30 Z" fill={`url(#toast-cup-${notif.id})`} stroke="#ca8a04" strokeWidth="1.5" />
                      <path d="M28 16 H72 L66 64 C64 74 57 82 50 82 C43 82 36 74 34 64 Z" fill={`url(#toast-cup-${notif.id})`} stroke="#ca8a04" strokeWidth="1.5" />
                      <ellipse cx="50" cy="16" rx="22" ry="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                      <path d="M46 82 H54 V95 H46 Z" fill={`url(#toast-cup-${notif.id})`} />
                      <path d="M36 95 H64 L67 106 H33 Z" fill={`url(#toast-base-${notif.id})`} />
                      <rect x="30" y="106" width="40" height="7" rx="2" fill="#ca8a04" />
                    </svg>
                  ) : (
                    <i className={`fas ${iconClass}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center min-w-0 pr-1 relative z-10">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold tracking-tight text-[#686D7B]">
                      {notif.title ? notif.title : categoryLabel}
                    </span>
                  </div>
                  <div className="text-xs sm:text-[13px] font-semibold text-[#14161D] leading-snug tracking-tight line-clamp-2">
                    {notif.message}
                  </div>
                  {notif.subtitle && (
                    <div className="text-[11px] text-[#525866] font-normal leading-snug tracking-tight line-clamp-1 sm:line-clamp-2 mt-0.5">
                      {notif.subtitle}
                    </div>
                  )}
                </div>

                {/* Dismiss button with comfortable mobile touch target */}
                <button
                  onClick={() => useGameStore.getState().dismissNotification(notif.id)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#F2F0EB] hover:bg-[#E5E2DA] border border-black/[0.05] text-[#525866] hover:text-[#14161D] flex items-center justify-center transition-colors shrink-0 cursor-pointer active:scale-90 relative z-10 touch-manipulation"
                  title="Close"
                  aria-label="Dismiss notification"
                >
                  <i className="fas fa-xmark text-xs" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
};
