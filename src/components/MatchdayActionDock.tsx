import React, { useEffect } from 'react';
import { GameState, Language } from '../types';
import { getLeagueInfo } from '../data/gameConstants';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { useGameStore } from '../store/useGameStore';
import { ClubLogo } from './ClubLogo';
import { getClubOvr } from './SimulatingOverlay';

interface MatchdayActionDockProps {
  state: GameState;
  lang: Language;
  isModActive?: boolean;
  isHidden?: boolean;
  onSimulate: () => void;
}

export const MatchdayActionDock: React.FC<MatchdayActionDockProps> = ({
  state,
  lang,
  isModActive = false,
  isHidden = false,
  onSimulate,
}) => {
  // Isolated Store Selector so simulation ticks never cause full-store re-renders or React 19 snapshot loops
  const storeClub = useGameStore((s) => s.club);
  const activeClub = state.club || storeClub;

  const isDe = lang === 'de';
  const isSecondHalf = state.seasonPhase === 'mid';

  const country = activeClub?.country || 'GER';
  const tier = activeClub?.tier || 1;
  const league = getLeagueInfo(tier, country);
  const leagueName = league?.name || `Tier ${tier}`;
  const avgOvr = getClubOvr({ baseOvr: league?.avgOvr }, 70);
  const baseOvr = getClubOvr(activeClub, avgOvr);

  const totalMatchdays = state.pendingSeasonState?.totalMatchdays || 34;
  const halfwayMd = Math.max(1, Math.floor(totalMatchdays / 2));

  // Determine campaign stakes & exclude newly relegated or proven top-half teams from false relegation alerts
  const history = state.history || [];
  const lastHist = history.length > 0 ? history[history.length - 1] : undefined;
  const isNewlyRelegated = Boolean(
    lastHist && ((lastHist as any).relegated || lastHist.status === 'R')
  );
  const isProvenTopHalf = Boolean(lastHist && lastHist.pos <= 9);

  const ovrDelta = baseOvr - avgOvr;
  const isRelegationFight =
    !isNewlyRelegated && !isProvenTopHalf && ovrDelta <= -3;
  const isTitleContender = tier === 1 && ovrDelta >= 2;
  const isPromotionHunt = tier > 1 && ovrDelta >= 1;

  const continentalNames = getContinentalCupNames(country);
  const isInChampionsLeague =
    tier === 1 && Boolean(lastHist && lastHist.tier === 1 && lastHist.pos <= 4);

  // Context stake label
  let stakeLabel = `${leagueName} · ${isDe ? 'Mittelfeld-Kampf' : 'Mid-Table Push'}`;
  if (isRelegationFight) {
    stakeLabel = `${leagueName} · ${isDe ? 'Abstiegskampf' : 'Fight for Survival'}`;
  } else if (isTitleContender) {
    stakeLabel = isInChampionsLeague
      ? continentalNames.cl
      : `${leagueName} · ${isDe ? 'Titelrennen' : 'Title Hunt'}`;
  } else if (isPromotionHunt) {
    stakeLabel = `${leagueName} · ${isDe ? 'Aufstiegsrennen' : 'Promotion Race'}`;
  } else if (isInChampionsLeague) {
    stakeLabel = continentalNames.cl;
  }

  // Dynamic Color Themes
  const theme = isRelegationFight
    ? {
        shellBorder: 'border-rose-500/35 shadow-[0_16px_48px_rgba(225,29,72,0.28)]',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]',
        button:
          'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:via-red-500 hover:to-rose-600 border-rose-400/40 shadow-[0_4px_20px_rgba(225,29,72,0.4)]',
        formText: '- Form',
        formBadge: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
      }
    : isTitleContender
    ? {
        shellBorder: 'border-sky-500/35 shadow-[0_16px_48px_rgba(14,165,233,0.26)]',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
        button:
          'bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:via-blue-500 hover:to-sky-500 border-sky-300/40 shadow-[0_4px_20px_rgba(14,165,233,0.4)]',
        formText: '+ Form',
        formBadge: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
      }
    : isPromotionHunt
    ? {
        shellBorder: 'border-emerald-500/35 shadow-[0_16px_48px_rgba(16,185,129,0.26)]',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
        button:
          'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:via-teal-500 hover:to-emerald-500 border-emerald-300/40 shadow-[0_4px_20px_rgba(16,185,129,0.4)]',
        formText: '+ Form',
        formBadge: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
      }
    : {
        shellBorder: 'border-indigo-500/30 shadow-[0_16px_48px_rgba(79,70,229,0.25)]',
        dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
        button:
          'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 border-indigo-400/40 shadow-[0_4px_20px_rgba(79,70,229,0.38)]',
        formText: '±0 Form',
        formBadge: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
      };

  // Spacebar shortcut handler when dock is visible and no input is focused
  useEffect(() => {
    if (isHidden) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'BUTTON' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      onSimulate();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHidden, onSimulate]);

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[95vw] max-w-2xl select-none transition-all duration-300 ${
        isHidden ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div
        className={`bg-[#0e1018]/92 backdrop-blur-2xl border rounded-full p-1.5 sm:p-2 flex items-center justify-between gap-2 sm:gap-3 ${theme.shellBorder}`}
      >
        {/* Left Capsule: Club Logo + Pulsing Dot + Half & Matchday Range */}
        <div className="flex items-center gap-2.5 pl-1.5 sm:pl-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
            <ClubLogo club={activeClub} size={24} isModActive={isModActive} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${theme.dot}`} />
              <span className="text-xs font-extrabold text-white tracking-tight whitespace-nowrap">
                {isSecondHalf
                  ? isDe
                    ? 'Rückrunde'
                    : '2nd Half'
                  : isDe
                  ? 'Hinrunde'
                  : '1st Half'}
              </span>
            </div>
            <div className="text-[10px] font-mono font-semibold text-zinc-400 tabular-nums whitespace-nowrap">
              {isSecondHalf
                ? `MD ${halfwayMd + 1}–${totalMatchdays}`
                : `MD 1–${halfwayMd}`}
            </div>
          </div>
        </div>

        {/* Center Capsule: League/Continental Stakes + OVR Badge + Form Badge */}
        <div className="flex-1 min-w-0 px-2.5 sm:px-3.5 py-1 border-x border-white/10 flex flex-col items-center justify-center text-center">
          <div className="text-[10px] sm:text-[11px] font-bold text-zinc-200 truncate w-full mb-1">
            {stakeLabel}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[9px] sm:text-[10px] font-mono font-bold text-zinc-200 tabular-nums whitespace-nowrap">
              OVR {baseOvr}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-md border text-[9px] sm:text-[10px] font-mono font-bold whitespace-nowrap ${theme.formBadge}`}
            >
              {theme.formText}
            </span>
          </div>
        </div>

        {/* Right CTA Button: Simulate 1st/2nd Half + Space Badge */}
        <button
          type="button"
          onClick={onSimulate}
          className={`shrink-0 rounded-full px-3.5 sm:px-5 py-2.5 sm:py-3 text-white font-extrabold text-xs sm:text-sm tracking-tight border flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${theme.button}`}
        >
          <i className="fa-solid fa-play text-[10px] sm:text-xs" />
          <span className="whitespace-nowrap">
            {isSecondHalf
              ? isDe
                ? 'Rückrunde simulieren'
                : 'Simulate 2nd Half'
              : isDe
              ? 'Hinrunde simulieren'
              : 'Simulate 1st Half'}
          </span>
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-black/30 border border-white/15 text-[9px] font-mono font-semibold text-white/85 uppercase tracking-wider">
            Space
          </span>
        </button>
      </div>
    </div>
  );
};
