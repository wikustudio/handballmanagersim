import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ToastContainerProps {
  toasts: ToastItem[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  const seenToasts = useRef<Set<string>>(new Set());

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.type === 'success' && !seenToasts.current.has(toast.id)) {
        seenToasts.current.add(toast.id);
        
        const msg = toast.message.toLowerCase();
        let particleColors = ['#38bdf8', '#0284c7', '#34d399', '#ffffff'];
        let count = 45;
        let spread = 60;
        
        if (msg.includes('champion') || msg.includes('meister') || msg.includes('trophy') || msg.includes('pokal') || msg.includes('cup') || msg.includes('world cup')) {
          particleColors = ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff'];
          count = 100;
          spread = 90;
        } else if (msg.includes('runner-up') || msg.includes('vizemeister')) {
          particleColors = ['#38bdf8', '#e0e7ff', '#94a3b8', '#ffffff', '#60a5fa'];
          count = 85;
          spread = 85;
        } else if (msg.includes('promoted') || msg.includes('aufstieg')) {
          particleColors = ['#38bdf8', '#0284c7', '#60a5fa', '#ffffff'];
          count = 75;
          spread = 75;
        }

        confetti({
          particleCount: count,
          spread,
          origin: { y: 0.05 },
          colors: particleColors,
          disableForReducedMotion: true,
          zIndex: 999999,
          ticks: 150,
          gravity: 0.8,
          scalar: 0.85
        });
      } else if (!seenToasts.current.has(toast.id)) {
        seenToasts.current.add(toast.id);
      }
    });
  }, [toasts]);

  if (toasts.length === 0) return null;

  const cleanMessage = (raw: string) => {
    // Strip leading gaming emojis and clean up whitespace
    return raw.replace(/^[\s🏆🥈🚀👑⭐✨🔥💥⚡🎉👏🎖️\-–—]+/u, '').trim();
  };

  const renderFormattedMessage = (msg: string) => {
    const cleaned = cleanMessage(msg);
    // Regex to capture OVR/GES boosts or losses, money gains or losses
    const parts = cleaned.split(/([+-]\s*€?\s*[\d.,]*\d(?:\s*(?:Mio\.|[MKkB]\b))?(?:\s*(?:OVR|GES|Budget|Fans|Einnahmen|Reputation|Rep|Ansehen|MP|Siegchance|Win|Lose|Loss|Sieg|Niederlage|Verlust|Plaetze|Seats|Kapazitaet|Capacity|Zuschauer|Morale|Moral|Youth|Jugend|Squad|Team))?)/gi);

    return parts.map((part, i) => {
      if (/^\+\s*€?\s*[\d.,]/i.test(part)) {
        return (
          <span key={i} className="text-emerald-400 font-semibold tracking-tight">
            {part}
          </span>
        );
      }
      if (/^-\s*€?\s*[\d.,]/i.test(part)) {
        return (
          <span key={i} className="text-rose-400 font-semibold tracking-tight">
            {part}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="fixed top-3 sm:top-6 pt-safe left-1/2 -translate-x-1/2 z-[99999] pointer-events-none grid place-items-center w-full px-3 sm:px-4">
      {toasts.map((toast, index) => {
        const revIndex = toasts.length - 1 - index;
        const msg = toast.message;
        const lower = msg.toLowerCase();

        // Specific toast classifications for winning a league or getting promoted as runner-up
        const isLeagueChampion = lower.includes('champion') || lower.includes('meister') || lower.includes('league title');
        const isRunnerUpPromotion = lower.includes('runner-up') || lower.includes('vizemeister');
        const isGeneralPromotion = !isLeagueChampion && !isRunnerUpPromotion && (lower.includes('promoted') || lower.includes('aufstieg'));

        let icon = 'fa-circle-info text-sky-400';
        let badgeBg = 'bg-sky-500/10 border-sky-400/20 text-sky-400';
        let containerBorder = 'border-white/[0.08]';
        let containerBg = 'bg-[#12141c]/85';
        let containerGlow = 'shadow-[0_20px_50px_rgba(0,0,0,0.6)]';
        let kicker: string | null = null;
        let kickerClass = 'text-sky-400/90';

        if (isLeagueChampion) {
          icon = 'fa-trophy text-amber-300';
          badgeBg = 'bg-amber-400/10 border-amber-400/30 text-amber-300';
          containerBorder = 'border-amber-400/35';
          containerBg = 'bg-gradient-to-r from-amber-500/[0.08] via-[#12141c]/90 to-sky-500/[0.06]';
          containerGlow = 'shadow-[0_20px_60px_rgba(245,158,11,0.22)]';
          kicker = 'League Champions · Domestic Crown';
          kickerClass = 'text-amber-300/90';
        } else if (isRunnerUpPromotion) {
          icon = 'fa-medal text-sky-300';
          badgeBg = 'bg-sky-400/10 border-sky-400/30 text-sky-300';
          containerBorder = 'border-sky-400/35';
          containerBg = 'bg-gradient-to-r from-sky-500/[0.1] via-[#12141c]/90 to-sky-400/[0.05]';
          containerGlow = 'shadow-[0_20px_60px_rgba(56,189,248,0.22)]';
          kicker = 'Runner-Up Promotion · Top 2 Ascent';
          kickerClass = 'text-sky-400';
        } else if (isGeneralPromotion) {
          icon = 'fa-arrow-trend-up text-sky-300';
          badgeBg = 'bg-sky-400/10 border-sky-400/25 text-sky-300';
          containerBorder = 'border-sky-400/25';
          containerBg = 'bg-gradient-to-r from-sky-500/[0.08] via-[#12141c]/90 to-emerald-500/[0.05]';
          containerGlow = 'shadow-[0_20px_50px_rgba(56,189,248,0.18)]';
          kicker = 'Promotion Secured · Division Ascent';
          kickerClass = 'text-sky-300/90';
        } else if (toast.type === 'success') {
          icon = 'fa-check text-emerald-400';
          badgeBg = 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300';
          containerBorder = 'border-emerald-500/40';
          containerBg = 'bg-gradient-to-r from-emerald-950/80 via-[#12141c]/95 to-emerald-950/60';
          containerGlow = 'shadow-[0_20px_50px_rgba(16,185,129,0.25)]';
        } else if (toast.type === 'error') {
          icon = 'fa-xmark text-rose-400';
          badgeBg = 'bg-rose-500/20 border-rose-400/40 text-rose-300';
          containerBorder = 'border-rose-500/40';
          containerBg = 'bg-gradient-to-r from-rose-950/80 via-[#12141c]/95 to-rose-950/60';
          containerGlow = 'shadow-[0_20px_50px_rgba(244,63,94,0.25)]';
        } else if (toast.type === 'warning') {
          icon = 'fa-exclamation text-amber-400';
          badgeBg = 'bg-amber-500/10 border-amber-400/20 text-amber-400';
          containerBorder = 'border-amber-400/25';
        }

        return (
          <div
            key={toast.id}
            style={{ 
              transform: `translateY(${revIndex * 8}px) scale(${1 - revIndex * 0.035})`, 
              zIndex: toasts.length - index,
              opacity: revIndex > 2 ? 0 : 1
            }}
            className={`row-start-1 col-start-1 flex items-center gap-3.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl sm:rounded-[24px] ${containerBg} backdrop-blur-2xl border ${containerBorder} ${containerGlow} toast-enter pointer-events-auto w-[92vw] sm:w-auto max-w-[95vw] sm:max-w-lg mx-auto transition-all duration-300 ease-out`}
          >
            {/* Frosted Icon Badge */}
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${badgeBg} border flex items-center justify-center shrink-0 shadow-inner`}>
              <i className={`fas ${icon} text-sm sm:text-base`}></i>
            </div>

            {/* Content Text */}
            <div className="flex flex-col min-w-0 flex-1">
              {kicker && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${kickerClass} mb-0.5 break-words`}>
                  {kicker}
                </span>
              )}
              <span className="text-xs sm:text-[13px] font-medium text-white/95 tracking-tight leading-snug break-words">
                {renderFormattedMessage(toast.message)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
