import React, { useEffect, useRef } from 'react';
import { GameState, Language, TrophiesObj } from '../types';
import { getLeagueInfo, COUNTRIES, getCountryFlag, getOvrColor, formatOrganicAttendance, getMaxTier, isReserveClub } from '../data/gameConstants';
import { getLeagueSize } from '../engine/engine';
import { ClubLogo } from './ClubLogo';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, isAnyModActive } from '../utils/modManager';

interface SeasonHistoryTableProps {
  state: GameState;
  lang: Language;
}

export const SeasonHistoryTable: React.FC<SeasonHistoryTableProps> = ({ state, lang }) => {
  const isDe = false;
  const t = (en: string, de: string) => en;
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

    // Quadruple / Triple Logic
    const hasBl = (trophiesObj.bl || 0) > 0;
    const hasDfb = (trophiesObj.dfb || 0) > 0;
    const hasCl = (trophiesObj.cl || 0) > 0;
    const hasEl = (trophiesObj.el || 0) > 0;
    const hasEcl = (trophiesObj.ecl || 0) > 0;
    const hasCwc = (trophiesObj.cwc || 0) > 0;

    if (hasBl && hasDfb && hasCl && hasCwc) {
      badges.push(
        <span key="quadruple" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
          🏆 Quadruple
        </span>
      );
    } else if (hasBl && hasDfb && hasCl) {
      badges.push(
        <span key="triple" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
          🏆 Triple
        </span>
      );
    } else if (hasBl && hasDfb && hasEl) {
      badges.push(
        <span key="euro-triple" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
          🏆 Euro Triple
        </span>
      );
    } else if (hasBl && hasDfb) {
      badges.push(
        <span key="double" className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded">
          🏆 Double
        </span>
      );
    }

    if (hasBl) {
      badges.push(<span key="bl" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded" title="League Champions">🥇 Champions</span>);
    }
    if (trophiesObj.lower) {
      badges.push(<span key="lower" className="text-[10px] font-medium text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded" title="Division Champions">🥇 Champion</span>);
    }
    if (hasCl) {
      badges.push(<span key="cl" className="text-[10px] font-medium text-sky-300 bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 rounded" title="Champions League">⭐ CL</span>);
    }
    if (hasEl) {
      badges.push(<span key="el" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded" title="European League">🏆 EL</span>);
    }
    if (hasEcl) {
      badges.push(<span key="ecl" className="text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded" title="European Cup">🏅 EC</span>);
    }
    if (hasCwc) {
      badges.push(<span key="cwc" className="text-[10px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/25 px-1.5 py-0.5 rounded" title="IHF Super Globe">🌐 World</span>);
    }
    if (hasDfb && !(hasBl && hasDfb)) {
      badges.push(<span key="dfb" className="text-[10px] font-medium text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded" title="National Cup">🛡️ Cup</span>);
    }
    if (trophiesObj.sc) {
      badges.push(<span key="sc" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded" title="Supercup">⚡ Supercup</span>);
    }
    if (trophiesObj.reg) {
      badges.push(<span key="reg" className="text-[10px] font-medium text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded" title="Regional Cup">🏆 Reg-Cup</span>);
    }

    if (badges.length === 0) return null;
    return <div className="flex items-center gap-1 flex-wrap">{badges}</div>;
  };

  const renderAttendanceWithUtil = (att?: number, cap?: number, year?: number) => {
    if (!att || att <= 0) return '—';
    const organic = cap ? formatOrganicAttendance(att, cap, year || 2024) : att;
    const util = cap && cap > 0 ? Math.min(100, Math.round((organic / cap) * 100)) : null;
    return (
      <span className="inline-flex items-baseline justify-end gap-1">
        <span>{organic.toLocaleString()}</span>
        {util !== null && (
          <span className="text-zinc-400 font-mono text-[10px]">({util}%)</span>
        )}
      </span>
    );
  };

  return (
    <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl flex flex-col overflow-hidden h-auto lg:h-full w-full flex-1">
      {/* Modern Minimalistic Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] shrink-0 bg-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 text-xs">
            <i className="fas fa-clock-rotate-left text-[11px]" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-white">
            Career History
          </span>
        </div>
        
        {/* Table Column Headers */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] font-normal text-zinc-500 pr-1">
          <span className="w-8 text-center">OVR</span>
          <span className="w-8 text-center">POS</span>
          <span className="hidden md:inline-block w-14 text-center">RECORD</span>
          <span className="hidden sm:inline-block w-16 text-center">GOALS</span>
          <span className="w-24 sm:w-28 text-right">ATT (FILL)</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-auto lg:h-full overflow-visible lg:overflow-y-auto px-2 py-2 custom-scrollbar divide-y divide-white/[0.04]"
      >
        {(!state.history || state.history.length === 0) ? (
          <div className="p-8 text-center text-xs text-zinc-500 leading-relaxed">
            No seasons recorded yet. Simulate matchdays to build career history.
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
                  if (cleanHistoryName.includes('paderborn') && c.id === 174) return true;
                  if ((cleanHistoryName.includes('köln') || cleanHistoryName.includes('koeln')) && c.id === 152) return true;
                  if (cleanHistoryName.includes('wiesbaden') && c.id === 171) return true;
                  return false;
                }));
            const countryKey = h.country || clubData?.country || (isCurrentClub ? state.club.country : undefined);
            const flag = getCountryFlag(countryKey);
            const leagueAvgOvr = getLeagueInfo(h.tier, countryKey).avgOvr || 40;
            const att = h.att || (h as any).attendance;
            const goalDiff = (h.gf ?? 0) - (h.ga ?? 0);

            const hasCup = Boolean(
              h.trophiesThisYear?.dfb ||
              h.trophiesThisYear?.reg ||
              h.trophiesThisYear?.cl ||
              h.trophiesThisYear?.el ||
              h.trophiesThisYear?.ecl ||
              h.trophiesThisYear?.cwc ||
              h.trophiesThisYear?.sc
            );
            const cupLabel = h.trophiesThisYear?.dfb
              ? 'National Cup Winners'
              : h.trophiesThisYear?.reg
              ? 'Regional Cup Winners'
              : h.trophiesThisYear?.cl
              ? 'Champions League Winners'
              : h.trophiesThisYear?.el
              ? 'European League Winners'
              : h.trophiesThisYear?.ecl
              ? 'European Cup Winners'
              : h.trophiesThisYear?.cwc
              ? 'World Cup Winners'
              : h.trophiesThisYear?.sc
              ? 'Supercup Winners'
              : 'Cup Winners';

            return (
              <div
                key={`${h.year}-${h.clubName}-${originalIndex}`}
                ref={isLast ? activeRowRef : undefined}
                className={`items-center justify-between py-2.5 px-2.5 hover:bg-sky-500/[0.03] transition-colors rounded-xl group min-h-[52px] ${reversedIndex >= 8 && !showAllMobile ? 'hidden lg:flex' : 'flex'}`}
              >
                {/* Left: Season Year, Club, Tier & Honours */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                  <span className="text-xs font-normal text-zinc-400 w-10 shrink-0 tabular-nums">
                    {h.year}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ClubLogo
                        name={h.clubName}
                        clubId={(h as any).clubId || clubData?.id}
                        club={clubData}
                        color={h.color || clubData?.color}
                        color2={(h as any).color2 || clubData?.color2}
                        logo={modActive ? (h.logo || clubData?.logo) : undefined}
                        fallbackLogo={modActive ? clubData?.fallbackLogo : undefined}
                        className="w-5 h-5 rounded-md object-contain shrink-0 border border-white/10"
                      />
                      <span className="text-xs sm:text-[13px] font-normal text-zinc-200 tracking-tight truncate leading-tight">
                        {h.clubName}
                      </span>
                      {/* Honours right next to Club Name */}
                      {renderTrophyBadges(h.trophiesThisYear)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-normal text-zinc-500 mt-0.5 flex-wrap">
                      <span>{flag}</span>
                      <span className="inline-flex items-center gap-1">
                        <span>{h.leagueTag || `Tier ${h.tier}`}</span>
                        {hasCup && (
                          <span title={cupLabel} className="text-zinc-400 inline-flex items-center" aria-label={cupLabel}>
                            <i className="fas fa-trophy text-[10px]" />
                          </span>
                        )}
                      </span>
                      {isPromoted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300 px-1.5 py-0.5 bg-white/[0.03] rounded border border-white/[0.06]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>↑ Promoted</span>
                        </span>
                      )}
                      {isRelegated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300 px-1.5 py-0.5 bg-white/[0.03] rounded border border-white/[0.06]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>↓ Relegated</span>
                        </span>
                      )}
                      {h.bankrupt && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300 px-1.5 py-0.5 bg-white/[0.03] rounded border border-white/[0.06]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>Insolvent</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Game Stats Columns (OVR, POS, Record, Goals GF:GA, Attendance) */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-xs tabular-nums font-normal text-zinc-300">
                  {/* OVR */}
                  <span className="w-8 text-center text-zinc-300 font-normal">
                    {h.bankrupt ? '—' : h.ovr}
                  </span>

                  {/* POS */}
                  <span className={`w-8 text-center ${h.bankrupt ? 'text-zinc-500 font-normal' : h.pos === 1 ? 'text-amber-300 font-medium' : 'text-zinc-300 font-normal'}`}>
                    {h.bankrupt ? '—' : (h.pos === 1 ? '🏆 1.' : `${h.pos}.`)}
                  </span>

                  {/* Record (Wins-Draws-Losses) */}
                  <span className="hidden md:inline-block w-14 text-center text-zinc-300 font-normal text-[11px]">
                    {h.bankrupt ? '—' : `${h.wins}-${h.draws}-${h.losses}`}
                  </span>

                  {/* Goals For : Goals Against & Diff */}
                  <div className="hidden sm:flex flex-col items-center w-16">
                    {h.bankrupt ? (
                      <span className="text-zinc-500 text-[11px] font-normal">—</span>
                    ) : (
                      <>
                        <span className="text-zinc-300 text-[11px] font-normal leading-none">
                          {h.gf ?? 0}:{h.ga ?? 0}
                        </span>
                        <span className="text-[10px] font-normal text-zinc-500 leading-tight mt-0.5">
                          {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="w-24 sm:w-28 text-right text-zinc-300 text-[11px] font-normal tabular-nums">
                    {h.bankrupt ? '—' : renderAttendanceWithUtil(att, h.stadium || clubData?.stadium || state.club?.stadium, h.year)}
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
