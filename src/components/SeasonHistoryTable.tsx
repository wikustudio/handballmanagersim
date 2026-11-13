import React, { useEffect, useRef } from 'react';
import { GameState, Language, TrophiesObj } from '../types';
import { formatOrganicAttendance, getMaxTier, isReserveClub } from '../data/gameConstants';
import { getLeagueSize } from '../engine/engine';
import { ClubLogo } from './ClubLogo';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, isAnyModActive } from '../utils/modManager';

interface SeasonHistoryTableProps {
  state: GameState;
  lang: Language;
}

export const SeasonHistoryTable: React.FC<SeasonHistoryTableProps> = ({ state }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);
  const [showAllMobile, setShowAllMobile] = React.useState(false);

  useEffect(() => {
    if (activeRowRef.current && containerRef.current && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      containerRef.current.scrollTop =
        activeRowRef.current.offsetTop - containerRef.current.clientHeight / 2;
    }
  }, [state?.history?.length]);

  const renderTrophyBadges = (trophiesObj?: TrophiesObj) => {
    if (!trophiesObj) return null;
    const badges: React.ReactNode[] = [];

    const hasBl = (trophiesObj.bl || 0) > 0;
    const hasDfb = (trophiesObj.dfb || 0) > 0;
    const hasCl = (trophiesObj.cl || 0) > 0;
    const hasEl = (trophiesObj.el || 0) > 0;
    const hasEcl = (trophiesObj.ecl || 0) > 0;
    const hasCwc = (trophiesObj.cwc || 0) > 0;

    if (hasBl && hasDfb && hasCl && hasCwc) {
      badges.push(
        <span key="quadruple" className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded">
          <span>🏆</span>
          <span>QUADRUPLE</span>
        </span>
      );
    } else if (hasBl && hasDfb && hasCl) {
      badges.push(
        <span key="triple" className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
          <span>🏆</span>
          <span>TREBLE</span>
        </span>
      );
    } else if (hasBl && hasDfb && hasEl) {
      badges.push(
        <span key="euro-triple" className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
          <span>🏆</span>
          <span>EURO TREBLE</span>
        </span>
      );
    }

    if (hasBl) {
      badges.push(<span key="bl" className="text-xs leading-none" title="League Champions">🏆</span>);
    }
    if (trophiesObj.lower) {
      badges.push(<span key="lower" className="text-xs leading-none" title="Division Champions">🥈</span>);
    }
    if (hasCl) {
      badges.push(<span key="cl" className="text-xs leading-none" title="Champions League">⭐</span>);
    }
    if (hasEl) {
      badges.push(<span key="el" className="text-xs leading-none" title="European League">🏆</span>);
    }
    if (hasEcl) {
      badges.push(<span key="ecl" className="text-xs leading-none" title="European Cup">🏅</span>);
    }
    if (hasCwc) {
      badges.push(<span key="cwc" className="text-xs leading-none" title="IHF Super Globe">🌐</span>);
    }
    if (hasDfb) {
      badges.push(<span key="dfb" className="text-xs leading-none" title="National Cup">🏆</span>);
    }
    if (trophiesObj.sc) {
      badges.push(<span key="sc" className="text-xs leading-none" title="Supercup">⚡</span>);
    }
    if (trophiesObj.reg) {
      badges.push(<span key="reg" className="text-xs leading-none" title="Regional Cup">🛡️</span>);
    }

    if (badges.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
          HONOURS:
        </span>
        <div className="flex items-center gap-1 flex-wrap">{badges}</div>
      </div>
    );
  };

  const hasWorldOrEuroArchive = Boolean(
    (state.totals?.intTrophies || 0) > 0 ||
    (state.history || []).some(h => h.trophiesThisYear?.cwc || h.trophiesThisYear?.cl)
  );

  return (
    <div className="bg-[#12141c] border border-white/[0.06] shadow-[0_16px_40px_rgba(0,0,0,0.45)] rounded-[24px] flex flex-col overflow-hidden h-auto lg:h-full w-full flex-1">
      {/* Table Header Bar (Matches Reference) */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            SEASON / CLUB
          </span>
          {hasWorldOrEuroArchive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] font-bold uppercase tracking-wider">
              <i className="fas fa-trophy text-[8px]" />
              <span>WC ARCHIVE</span>
            </span>
          )}
        </div>

        {/* Column Headers: OVR | POS | GF | GA | ATT | UTIL */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 pr-0.5 sm:pr-1">
          <span className="w-6 sm:w-8 text-center">OVR</span>
          <span className="w-6 sm:w-8 text-center">POS</span>
          <span className="hidden sm:inline-block w-8 text-center">GF</span>
          <span className="hidden sm:inline-block w-8 text-center">GA</span>
          <span className="w-11 sm:w-14 text-right">ATT</span>
          <span className="w-8 sm:w-10 text-right">UTIL</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-auto lg:h-full overflow-visible lg:overflow-y-auto px-3 sm:px-4 py-3 custom-scrollbar flex flex-col gap-2"
      >
        {/* Active Current Season Row (Matches Reference Top Row) */}
        <div className="bg-[#111d2b]/90 border border-sky-500/25 rounded-2xl px-3 sm:px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-[#15263a] border border-sky-500/30 text-sky-400 font-mono text-xs font-bold tabular-nums shrink-0">
              {state.year}
            </span>
            <div className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center text-[8px] shrink-0">
              <i className="fas fa-play ml-0.5" />
            </div>
            <span className="text-xs sm:text-[13px] font-medium text-zinc-200 truncate">
              Current season underway...
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
            <span>ACTIVE</span>
          </span>
        </div>

        {/* Completed Season History Rows */}
        {(!state.history || state.history.length === 0) ? (
          <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#161922]/50 border border-white/[0.04]">
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 text-xs">
              <i className="fas fa-calendar-day" />
            </div>
            <span className="text-xs font-medium text-zinc-300">No completed seasons yet</span>
            <span className="text-[11px] text-zinc-500 max-w-xs">
              Simulate the current campaign to record league finishes, goal differentials, and attendance logs.
            </span>
          </div>
        ) : (
          ([...state.history].reverse()).map((h, reversedIndex) => {
            const historyLength = state.history.length;
            const originalIndex = historyLength - 1 - reversedIndex;
            const isLast = originalIndex === historyLength - 1;

            let nextTier = h.tier;
            let sameClubNextSeason = false;

            if (isLast) {
              sameClubNextSeason = state.club.name === h.clubName;
              if (sameClubNextSeason) {
                nextTier = state.club.tier;
              }
            } else {
              const nextHistoryItem = state.history[originalIndex + 1];
              sameClubNextSeason = nextHistoryItem.clubName === h.clubName;
              if (sameClubNextSeason) {
                nextTier = nextHistoryItem.tier;
              }
            }

            let isPromoted = Boolean(h.promoted);
            let isRelegated = Boolean(h.relegated);

            if (sameClubNextSeason) {
              isPromoted = isPromoted || nextTier < h.tier;
              isRelegated = isRelegated || nextTier > h.tier;
            } else {
              const histCountry = h.country || state.club?.country || 'GER';
              const leagueSize = (h as any).leagueSize || getLeagueSize(h.tier, histCountry);
              const maxTierForCountry = getMaxTier(histCountry);
              const dropCutoff = Math.max(1, leagueSize - 1);
              const isReservePromoBarred = h.tier === 2 && isReserveClub(h.clubName);
              if (h.tier > 1 && !isReservePromoBarred && (h.pos <= 2 || (h.pos === 3 && h.promoted))) {
                isPromoted = true;
              } else if (h.tier < maxTierForCountry && h.pos >= dropCutoff && !(h as any).survived && h.relegated !== false) {
                isRelegated = true;
              }
            }

            const cleanHistoryName = (h.clubName || '').toLowerCase().replace(/[\.\s\-]/g, '');
            const isCurrentClub = Boolean(state.club && (
              state.club.name === h.clubName ||
              (state.club.name || '').toLowerCase().replace(/[\.\s\-]/g, '') === cleanHistoryName ||
              ((h as any).clubId && (String(state.club.id) === String((h as any).clubId) || Number(state.club.id) === Number((h as any).clubId)))
            ));
            const modActive = isAnyModActive();
            const activeClubsList = getActiveClubs(h.country || state.club?.country);
            const clubData = isCurrentClub
              ? state.club
              : (activeClubsList.find(c => {
                  if ((h as any).clubId && (String(c.id) === String((h as any).clubId) || Number(c.id) === Number((h as any).clubId))) return true;
                  if (c.name === h.clubName) return true;
                  const cleanC = (c.name || '').toLowerCase().replace(/[\.\s\-]/g, '');
                  return cleanC === cleanHistoryName;
                }) || ALL_CLUBS.find(c => {
                  if ((h as any).clubId && (String(c.id) === String((h as any).clubId) || Number(c.id) === Number((h as any).clubId))) return true;
                  if (c.name === h.clubName) return true;
                  const cleanC = (c.name || '').toLowerCase().replace(/[\.\s\-]/g, '');
                  if (cleanC === cleanHistoryName) return true;
                  return false;
                }));
            const countryKey = (h.country || clubData?.country || (isCurrentClub ? state.club.country : 'GER') || 'GER').toUpperCase();
            const attRaw = h.att || (h as any).attendance || 0;
            const cap = h.stadium || clubData?.stadium || state.club?.stadium || 2000;
            const organicAtt = attRaw > 0 ? formatOrganicAttendance(attRaw, cap, h.year || 2024) : 0;
            const utilPct = organicAtt > 0 && cap > 0 ? Math.min(100, Math.round((organicAtt / cap) * 100)) : 0;

            const isChampion = Boolean(!h.bankrupt && h.pos === 1);
            const tierBadgeText = h.tier === 3 && countryKey === 'GER' ? '3. LIGA' : `${countryKey.slice(0, 3)} ${h.tier || 1}`;
            const tierBadgeClass =
              h.tier === 1
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : h.tier === 2
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';

            const ovrColorClass =
              (h.ovr || 0) >= 92
                ? 'text-purple-400'
                : (h.ovr || 0) >= 82
                ? 'text-amber-400'
                : 'text-emerald-400';

            return (
              <div
                key={`${h.year}-${h.clubName}-${originalIndex}`}
                ref={isLast ? activeRowRef : undefined}
                className={`items-center justify-between py-3 px-3 sm:px-3.5 bg-[#161922]/85 hover:bg-[#1b1f2b] border border-white/[0.04] transition-colors rounded-2xl group ${
                  reversedIndex >= 8 && !showAllMobile ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {/* Left: Year Pill + Club Crest + Name + Division/Champion Badges + Honours */}
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 pr-2 flex-1">
                  <span className="px-2.5 py-1 rounded-lg bg-[#152232] border border-sky-500/25 text-sky-400 font-mono text-xs font-bold tabular-nums shrink-0 mt-0.5">
                    {h.year}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <ClubLogo
                        name={h.clubName}
                        clubId={(h as any).clubId || clubData?.id}
                        club={clubData}
                        color={h.color || clubData?.color}
                        color2={(h as any).color2 || clubData?.color2}
                        logo={modActive ? (h.logo || clubData?.logo) : undefined}
                        fallbackLogo={modActive ? clubData?.fallbackLogo : undefined}
                        className="w-5 h-5 rounded-md object-contain shrink-0"
                      />
                      <span className="text-xs sm:text-[13px] font-bold text-white tracking-tight truncate leading-tight">
                        {h.clubName}
                      </span>
                    </div>

                    {/* Division Pill + Champion C Pill + Promotion/Relegation */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase tracking-wider ${tierBadgeClass}`}>
                        {tierBadgeText}
                      </span>
                      {isChampion && (
                        <span
                          className="px-1.5 py-0.2 rounded bg-amber-400 text-zinc-950 text-[9px] font-black uppercase leading-tight"
                          title="League Champion"
                        >
                          C
                        </span>
                      )}
                      {isPromoted && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold uppercase">
                          ↑ PROMOTED
                        </span>
                      )}
                      {isRelegated && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[9px] font-bold uppercase">
                          ↓ RELEGATED
                        </span>
                      )}
                      {h.bankrupt && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-bold uppercase">
                          INSOLVENT
                        </span>
                      )}
                    </div>

                    {/* Honours Row */}
                    {renderTrophyBadges(h.trophiesThisYear)}
                  </div>
                </div>

                {/* Right: Stats Columns (OVR | POS | GF | GA | ATT | UTIL) */}
                <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0 text-[11px] sm:text-xs tabular-nums">
                  {/* OVR */}
                  <span className={`w-6 sm:w-8 text-center font-bold ${h.bankrupt ? 'text-zinc-500' : ovrColorClass}`}>
                    {h.bankrupt ? '—' : h.ovr}
                  </span>

                  {/* POS */}
                  <span className="w-6 sm:w-8 text-center font-bold text-white">
                    {h.bankrupt ? '—' : `${h.pos}.`}
                  </span>

                  {/* GF */}
                  <span className="hidden sm:inline-block w-8 text-center font-semibold text-emerald-400">
                    {h.bankrupt ? '—' : (h.gf ?? 0)}
                  </span>

                  {/* GA */}
                  <span className="hidden sm:inline-block w-8 text-center font-semibold text-rose-400">
                    {h.bankrupt ? '—' : (h.ga ?? 0)}
                  </span>

                  {/* ATT */}
                  <span className="w-11 sm:w-14 text-right text-zinc-300 font-medium">
                    {h.bankrupt || organicAtt <= 0 ? '—' : organicAtt.toLocaleString()}
                  </span>

                  {/* UTIL */}
                  <span className="w-8 sm:w-10 text-right font-semibold text-emerald-400">
                    {h.bankrupt || utilPct <= 0 ? '—' : `${utilPct}%`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {state.history && state.history.length > 8 && (
        <div className="p-2.5 pt-2 flex justify-center lg:hidden border-t border-white/[0.04] bg-transparent">
          <button
            onClick={() => setShowAllMobile(prev => !prev)}
            className="w-full text-xs font-semibold text-sky-300 hover:text-white bg-sky-500/[0.05] hover:bg-sky-500/10 active:scale-[0.98] border border-sky-500/20 py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <i className={`fas ${showAllMobile ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px] text-sky-400`} />
            <span>{showAllMobile ? 'Collapse to Recent 8 Seasons' : `Show All ${state.history.length} Seasons (+${state.history.length - 8} more)`}</span>
          </button>
        </div>
      )}
    </div>
  );
};
