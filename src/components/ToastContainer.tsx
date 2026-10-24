import React, { useEffect, useState, useRef } from 'react';
import { GameState } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export const ToastContainer = ({ state }: { state: GameState }) => {
  const unreadNotifs = (state.notifications || []).filter((n: any) => !n.read);
  const { width, height } = useWindowSize();
  const [celebrating, setCelebrating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const prevIdsRef = useRef<Set<string>>(new Set());

  // Immediately clear previous backlog when multiple unread notifications arrive/exist
  useEffect(() => {
    const rawNotifs = (state.notifications || []).filter((n: any) => !n.read);
    if (rawNotifs.length > 1) {
      // Identify newly added notifications regardless of whether caller prepended or appended
      const newlyAdded = rawNotifs.filter((n: any) => n.id && !prevIdsRef.current.has(n.id));
      const latest = newlyAdded.length > 0
        ? newlyAdded[newlyAdded.length - 1]
        : rawNotifs[rawNotifs.length - 1];
      prevIdsRef.current = new Set(latest?.id ? [latest.id] : []);
      if (latest) {
        useGameStore.getState().updateState({
          notifications: [latest]
        });
      }
    } else {
      prevIdsRef.current = new Set(rawNotifs.map((n: any) => n.id).filter(Boolean));
    }
  }, [state.notifications]);

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
            let topHairline = 'via-sky-400/60';
            let iconBoxStyle = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
            let pulseDotColor = 'bg-sky-400';
            let categoryLabel = 'OFFICIAL · WIRE';

            if (isCelebration) {
              iconClass = 'fa-trophy';
              topHairline = 'via-amber-400/70';
              iconBoxStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
              pulseDotColor = 'bg-amber-400';
              categoryLabel = 'DECISION DAY · TRIUMPH';
            } else if (isSuccess) {
              iconClass = 'fa-check';
              topHairline = 'via-emerald-400/65';
              iconBoxStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
              pulseDotColor = 'bg-emerald-400';
              categoryLabel = 'DISPATCH · CONFIRMED';
            } else if (isError) {
              iconClass = 'fa-triangle-exclamation';
              topHairline = 'via-rose-500/70';
              iconBoxStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
              pulseDotColor = 'bg-rose-400';
              categoryLabel = 'CRITICAL · ALERT';
            } else if (isWarning) {
              iconClass = 'fa-bolt';
              topHairline = 'via-amber-400/65';
              iconBoxStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.12)]';
              pulseDotColor = 'bg-amber-400';
              categoryLabel = 'BOARDROOM · NOTICE';
            } else if (isInfo) {
              iconClass = 'fa-newspaper';
              topHairline = 'via-sky-400/60';
              iconBoxStyle = 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.12)]';
              pulseDotColor = 'bg-sky-400';
              categoryLabel = 'BROADCAST · FEED';
            }

            let progressBarColor = 'bg-sky-400/80';
            if (isCelebration) progressBarColor = 'bg-amber-400/90';
            else if (isSuccess) progressBarColor = 'bg-emerald-400/90';
            else if (isError) progressBarColor = 'bg-rose-400/90';
            else if (isWarning) progressBarColor = 'bg-amber-400/85';

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
                className="pointer-events-auto relative overflow-hidden flex items-center gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-[#14151e]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white group touch-manipulation"
              >
                {/* Decision Day / Broadcast ambient glowing hairline */}
                <div className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${topHairline} to-transparent pointer-events-none`} />

                {/* Auto-close Progress Bar (2.8s linear countdown) */}
                <motion.div
                  key={`progress-${notif.id}`}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 2.8, ease: 'linear' }}
                  style={{ transformOrigin: 'left' }}
                  className={`absolute bottom-0 left-0 right-0 h-[2px] ${progressBarColor} pointer-events-none opacity-80`}
                />

                {/* Status Icon Pillar with Trophy Vector design for Silverware / Celebrations */}
                <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border text-xs relative z-10 transition-transform group-hover:scale-105 ${iconBoxStyle}`}>
                  {isCelebration ? (
                    <svg width="20" height="22" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
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
                    <span className="flex items-center gap-1.5 text-[9px] font-mono font-medium uppercase tracking-wider text-zinc-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${pulseDotColor} animate-pulse shrink-0`} />
                      {notif.title ? notif.title.toUpperCase() : categoryLabel}
                    </span>
                  </div>
                  <div className="text-xs sm:text-[13px] font-medium text-white/95 leading-snug tracking-tight line-clamp-2">
                    {notif.message}
                  </div>
                  {notif.subtitle && (
                    <div className="text-[11px] text-zinc-300 font-normal leading-snug tracking-tight line-clamp-1 sm:line-clamp-2 mt-0.5">
                      {notif.subtitle}
                    </div>
                  )}
                </div>
                
                {/* Dismiss button with comfortable mobile touch target */}
                <button 
                  onClick={() => useGameStore.getState().dismissNotification(notif.id)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] text-zinc-300 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer active:scale-90 relative z-10 touch-manipulation"
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
