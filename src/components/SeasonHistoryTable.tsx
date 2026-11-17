import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameState, Language, TrophiesObj } from '../types';
import { formatOrganicAttendance, getMaxTier, isReserveClub } from '../data/gameConstants';
import { getLeagueSize } from '../engine/engine';
import { ClubLogo } from './ClubLogo';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, isAnyModActive } from '../utils/modManager';
import {
  buildClubContextSummary,
  buildTrophyCollectionSummary,
  ClubContextSummary,
  TrophyCollectionSummary,
  TrophyIconKind,
} from '../utils/courtsideStats';
import { buildClubHeritageTimeline } from '../utils/clubHeritageHistory';

interface SeasonHistoryTableProps {
  state: GameState;
  lang: Language;
  variant?: 'courtside' | 'dark';
  clubContext?: ClubContextSummary;
  trophyCollection?: TrophyCollectionSummary;
  onOpenStandings?: () => void;
  onOpenTeamModal?: (clubObj?: any) => void;
  onOpenClubContext?: () => void;
  onOpenTrophyCabinet?: () => void;
}

const TrophySilhouetteIcon: React.FC<{ kind: TrophyIconKind; won: boolean }> = ({ kind, won }) => {
  const stroke = won ? '#B45309' : '#686D7B';
  const fill = won ? '#F59E0B' : '#CBD5E1';
  const highlight = won ? '#FEF3C7' : '#F1F5F9';

  switch (kind) {
    case 'league':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <circle cx="12" cy="11" r="7.5" fill={fill} fillOpacity={won ? 0.25 : 0.35} stroke={stroke} strokeWidth="1.6" />
          <circle cx="12" cy="11" r="4.2" fill={highlight} stroke={stroke} strokeWidth="1.2" />
          <path d="M9 20h6M10.5 18.5h3" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'cup':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" fill={fill} fillOpacity={won ? 0.28 : 0.35} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7 6H4.5a2 2 0 0 0 0 4H7M17 6h2.5a2 2 0 0 1 0 4H17" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 14v4M8.5 20h7" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'supercup':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <polygon points="12,3 15.5,10 14,17 10,17 8.5,10" fill={fill} fillOpacity={won ? 0.28 : 0.35} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8.5 20h7M10 17h4" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'champions':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <path d="M8 5h8l-1 8a3 3 0 0 1-6 0L8 5Z" fill={fill} fillOpacity={won ? 0.28 : 0.35} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 6C5 6 4.5 9.5 7.2 11M16 6c3 0 3.5 3.5.8 5" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 15.5v3M8.5 20h7" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'euro':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <path d="M7.5 4h9l-1.5 9.5a3 3 0 0 1-6 0L7.5 4Z" fill={fill} fillOpacity={won ? 0.28 : 0.35} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 15.5v3M9 20h6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'globe':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <circle cx="12" cy="9.5" r="5.2" fill={fill} fillOpacity={won ? 0.28 : 0.35} stroke={stroke} strokeWidth="1.6" />
          <path d="M7 9.5h10M12 4.3a7.5 7.5 0 0 1 0 10.4M12 4.3a7.5 7.5 0 0 0 0 10.4" fill="none" stroke={stroke} strokeWidth="1.2" />
          <path d="M10 15l-1 3.5h6L14 15M8.5 20h7" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'division':
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
          <path d="M12 3.5 18.5 6v5.5c0 4.2-2.8 7.4-6.5 9-3.7-1.6-6.5-4.8-6.5-9V6L12 3.5Z" fill={fill} fillOpacity={won ? 0.25 : 0.35} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9.5 12l1.8 1.8 3.4-3.6" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

export const SeasonHistoryTable: React.FC<SeasonHistoryTableProps> = ({
  state,
  variant = 'dark',
  clubContext,
  trophyCollection,
  onOpenStandings,
  onOpenTeamModal,
  onOpenClubContext,
  onOpenTrophyCabinet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const [trophyScope, setTrophyScope] = useState<'club' | 'career'>('club');
  const [archiveScope, setArchiveScope] = useState<'club' | 'career'>('club');

  const isLight = variant === 'courtside';

  const clubHeritageTimeline = useMemo(
    () => buildClubHeritageTimeline(state, state.club),
    [state]
  );
  const careerTimeline = useMemo(() => state.history || [], [state.history]);
  const hasSeparateArchiveScopes = useMemo(() => {
    const hasPreArrival = clubHeritageTimeline.some((h) => h.isPreTenureClubArchive);
    const hasOtherClubs = careerTimeline.some((h) => h.clubName !== state.club?.name);
    return hasPreArrival || hasOtherClubs;
  }, [clubHeritageTimeline, careerTimeline, state.club?.name]);

  const activeHistoryRows =
    archiveScope === 'career' || !hasSeparateArchiveScopes
      ? hasSeparateArchiveScopes && archiveScope === 'career'
        ? careerTimeline
        : clubHeritageTimeline.length > 0
        ? clubHeritageTimeline
        : careerTimeline
      : clubHeritageTimeline;

  const resolvedContext = useMemo(
    () => clubContext || buildClubContextSummary(state),
    [clubContext, state]
  );
  const resolvedTrophies = useMemo(
    () => trophyCollection || buildTrophyCollectionSummary(state),
    [trophyCollection, state]
  );

  const activeTrophyBreakdown =
    trophyScope === 'career' && resolvedTrophies.hasSeparateCareer
      ? resolvedTrophies.career
      : resolvedTrophies.club;

  const handleInspectContext = () => {
    if (onOpenClubContext) {
      onOpenClubContext();
    } else {
      onOpenTeamModal?.(state.club);
    }
  };

  const handleInspectTrophies = () => {
    if (onOpenTrophyCabinet) {
      onOpenTrophyCabinet();
    } else if (onOpenClubContext) {
      onOpenClubContext();
    } else {
      onOpenTeamModal?.(state.club);
    }
  };

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
        <span
          key="quadruple"
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
            isLight
              ? 'text-purple-700 bg-purple-50 border-purple-200'
              : 'text-purple-300 bg-purple-500/15 border-purple-500/30'
          }`}
        >
          <span>🏆</span>
          <span>QUADRUPLE</span>
        </span>
      );
    } else if (hasBl && hasDfb && hasCl) {
      badges.push(
        <span
          key="triple"
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
            isLight
              ? 'text-amber-800 bg-amber-50 border-amber-200'
              : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
          }`}
        >
          <span>🏆</span>
          <span>TREBLE</span>
        </span>
      );
    } else if (hasBl && hasDfb && hasEl) {
      badges.push(
        <span
          key="euro-triple"
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
            isLight
              ? 'text-amber-800 bg-amber-50 border-amber-200'
              : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
          }`}
        >
          <span>🏆</span>
          <span>EURO TREBLE</span>
        </span>
      );
    }

    if (hasBl) badges.push(<span key="bl" className="text-xs leading-none" title="League Champions">🏆</span>);
    if (trophiesObj.lower) badges.push(<span key="lower" className="text-xs leading-none" title="Division Champions">🥈</span>);
    if (hasCl) badges.push(<span key="cl" className="text-xs leading-none" title="Champions League">⭐</span>);
    if (hasEl) badges.push(<span key="el" className="text-xs leading-none" title="European League">🏆</span>);
    if (hasEcl) badges.push(<span key="ecl" className="text-xs leading-none" title="European Cup">🏅</span>);
    if (hasCwc) badges.push(<span key="cwc" className="text-xs leading-none" title="IHF Super Globe">🌐</span>);
    if (hasDfb) badges.push(<span key="dfb" className="text-xs leading-none" title="National Cup">🏆</span>);
    if (trophiesObj.sc) badges.push(<span key="sc" className="text-xs leading-none" title="Supercup">⚡</span>);
    if (trophiesObj.reg) badges.push(<span key="reg" className="text-xs leading-none" title="Regional Cup">🛡️</span>);

    if (badges.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className={`text-[10px] font-semibold uppercase tracking-widest ${
            isLight ? 'text-[#525866]' : 'text-zinc-400'
          }`}
        >
          HONOURS:
        </span>
        <div className="flex items-center gap-1 flex-wrap">{badges}</div>
      </div>
    );
  };

  const hasWorldOrEuroArchive = Boolean(
    (state.totals?.intTrophies || 0) > 0 ||
      (state.history || []).some((h) => h.trophiesThisYear?.cwc || h.trophiesThisYear?.cl)
  );

  const modActive = isAnyModActive();

  return (
    <div
      className={
        isLight
          ? 'courtside-card flex flex-col overflow-hidden w-full flex-1'
          : 'bg-[#12141c] border border-white/[0.06] shadow-[0_16px_40px_rgba(0,0,0,0.45)] rounded-[24px] flex flex-col overflow-hidden h-auto lg:h-full w-full flex-1'
      }
    >
      {/* Table Header Bar */}
      <div
        className={`flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b shrink-0 ${
          isLight ? 'border-black/[0.05]' : 'border-white/[0.05]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isLight ? (
            <h2 className="text-[15px] font-bold tracking-tight text-[#14161D] truncate">
              Season &amp; Club History
            </h2>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              SEASON / CLUB
            </span>
          )}
          {!isLight && hasWorldOrEuroArchive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <i className="fas fa-trophy text-[10px]" />
              <span>WC ARCHIVE</span>
            </span>
          )}
        </div>

        {isLight ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInspectContext}
              className="min-h-[32px] px-2.5 py-1 rounded-full bg-[#F2F0EB] hover:bg-[#E6E3DB] text-[#14161D] text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
            >
              Club Context
            </button>
            <button
              type="button"
              onClick={handleInspectTrophies}
              className="min-h-[32px] px-2.5 py-1 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-[11px] font-semibold transition cursor-pointer whitespace-nowrap tabular-nums"
            >
              Trophies · {activeTrophyBreakdown.total}
            </button>
          </div>
        ) : (
          /* Column Headers: OVR | POS | GF | GA | ATT | UTIL */
          <div className="flex items-center gap-1.5 sm:gap-3.5 text-[10px] font-semibold uppercase tracking-wider pr-0.5 sm:pr-1 tabular-nums shrink-0 text-zinc-400">
            <span className="w-6 sm:w-8 text-center">OVR</span>
            <span className="w-6 sm:w-8 text-center">POS</span>
            <span className="hidden sm:inline-block w-8 text-center">GF</span>
            <span className="hidden sm:inline-block w-8 text-center">GA</span>
            <span className="w-11 sm:w-14 text-right">ATT</span>
            <span className="w-8 sm:w-10 text-right">UTIL</span>
          </div>
        )}
      </div>

      {/* Courtside Overview: Club Context + Trophy Collections Showcase */}
      {isLight && (
        <>
          {/* 1. Club Context Strip */}
          <button
            type="button"
            onClick={handleInspectContext}
            aria-label={`Open Club Context for ${resolvedContext.clubName}`}
            className="w-full text-left px-4 sm:px-5 py-3 border-b border-black/[0.05] hover:bg-[#FAF9F6] transition cursor-pointer group shrink-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <ClubLogo
                  club={state.club}
                  clubId={state.club?.id}
                  name={resolvedContext.clubName}
                  color={state.club?.color}
                  color2={state.club?.color2}
                  logo={modActive ? state.club?.logo : undefined}
                  fallbackLogo={modActive ? state.club?.fallbackLogo : undefined}
                  className="w-7 h-7 rounded-md object-contain shrink-0 mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                    <span className="text-[13px] font-bold text-[#14161D] group-hover:underline">
                      {resolvedContext.clubName}
                    </span>
                    <span className="text-xs leading-none" aria-hidden="true">
                      {resolvedContext.countryFlag}
                    </span>
                    <span className="text-[11px] text-[#525866]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[11px] font-medium text-[#686D7B]">
                      {resolvedContext.leagueName}
                    </span>
                    <span className="text-[11px] text-[#525866]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[11px] text-[#686D7B] truncate max-w-[180px] sm:max-w-[240px]">
                      {resolvedContext.homeArena}
                    </span>
                    <span className="text-[11px] text-[#525866]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[11px] font-medium text-[#525866]">
                      {resolvedContext.statureLabel}
                    </span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-[#525866] mt-1 line-clamp-2">
                    {resolvedContext.narrative}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#686D7B] group-hover:text-[#14161D] whitespace-nowrap shrink-0 mt-0.5">
                Dossier →
              </span>
            </div>
          </button>

          {/* 2. Trophy Collections Strip */}
          <div className="px-4 sm:px-5 py-3 border-b border-black/[0.05] shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[#686D7B] tabular-nums min-w-0 flex-wrap">
                <span className="text-[12px] font-bold text-[#14161D]">Trophy collection</span>
                <span aria-hidden="true">·</span>
                <span>{activeTrophyBreakdown.domesticTotal} domestic</span>
                <span aria-hidden="true">·</span>
                <span>{activeTrophyBreakdown.internationalTotal} international</span>
                {activeTrophyBreakdown.divisionTotal > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{activeTrophyBreakdown.divisionTotal} division</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {resolvedTrophies.hasSeparateCareer && (
                  <div className="inline-flex items-center bg-[#F2F0EB] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setTrophyScope('club')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition cursor-pointer whitespace-nowrap tabular-nums ${
                        trophyScope === 'club'
                          ? 'bg-white text-[#14161D] shadow-2xs'
                          : 'text-[#686D7B] hover:text-[#14161D]'
                      }`}
                    >
                      Club ({resolvedTrophies.clubTotal})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrophyScope('career')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition cursor-pointer whitespace-nowrap tabular-nums ${
                        trophyScope === 'career'
                          ? 'bg-white text-[#14161D] shadow-2xs'
                          : 'text-[#686D7B] hover:text-[#14161D]'
                      }`}
                    >
                      Career ({resolvedTrophies.careerTotal})
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleInspectTrophies}
                  className="text-[11px] font-semibold text-[#686D7B] hover:text-[#14161D] transition cursor-pointer whitespace-nowrap"
                >
                  Cabinet →
                </button>
              </div>
            </div>

            <div
              className={`grid grid-cols-3 ${
                activeTrophyBreakdown.pedestals.length >= 7 ? 'sm:grid-cols-7' : 'sm:grid-cols-6'
              } gap-1.5`}
            >
              {activeTrophyBreakdown.pedestals.map((slot) => {
                const won = slot.count > 0;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={handleInspectTrophies}
                    title={`${slot.fullName}: ${slot.count} won`}
                    aria-label={`${slot.fullName}: ${slot.count} won`}
                    className={`min-h-[58px] rounded-[12px] px-1.5 py-2 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                      won
                        ? 'bg-[#FDF8EC] hover:bg-[#F9EED2]'
                        : 'bg-[#F5F4F0] hover:bg-[#ECEAE2]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <TrophySilhouetteIcon kind={slot.iconKind} won={won} />
                      <span
                        className={`text-[13px] font-extrabold tabular-nums leading-none ${
                          won ? 'text-[#14161D]' : 'text-[#525866]'
                        }`}
                      >
                        {slot.count}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium truncate max-w-full leading-tight ${
                        won ? 'text-[#78350F]' : 'text-[#525866]'
                      }`}
                    >
                      {slot.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Campaign Archive Column Legend Row */}
          <div className="flex items-center justify-between gap-2 px-4 sm:px-5 pt-2.5 pb-0.5 text-[10px] font-semibold text-[#525866] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">Campaign archive</span>
              {hasSeparateArchiveScopes && (
                <div className="inline-flex items-center bg-[#F2F0EB] rounded-lg p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setArchiveScope('club')}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition cursor-pointer whitespace-nowrap tabular-nums ${
                      archiveScope === 'club'
                        ? 'bg-white text-[#14161D] shadow-2xs'
                        : 'text-[#686D7B] hover:text-[#14161D]'
                    }`}
                  >
                    Club ({clubHeritageTimeline.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveScope('career')}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition cursor-pointer whitespace-nowrap tabular-nums ${
                      archiveScope === 'career'
                        ? 'bg-white text-[#14161D] shadow-2xs'
                        : 'text-[#686D7B] hover:text-[#14161D]'
                    }`}
                  >
                    Career ({careerTimeline.length})
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3.5 pr-0.5 sm:pr-1 tabular-nums shrink-0">
              <span className="w-6 sm:w-8 text-center">OVR</span>
              <span className="w-6 sm:w-8 text-center">POS</span>
              <span className="hidden sm:inline-block w-8 text-center">GF</span>
              <span className="hidden sm:inline-block w-8 text-center">GA</span>
              <span className="w-11 sm:w-14 text-right">ATT</span>
              <span className="w-8 sm:w-10 text-right">UTIL</span>
            </div>
          </div>
        </>
      )}

      <div
        ref={containerRef}
        className={`${
          isLight ? 'flex-1 max-h-[476px] overflow-y-auto' : 'h-auto lg:h-full overflow-visible lg:overflow-y-auto'
        } px-3 sm:px-4 py-2.5 custom-scrollbar flex flex-col gap-2`}
      >
        {/* Active Current Season Row with Embedded ClubLogo */}
        <div
          className={
            isLight
              ? 'bg-[#F5F4F0] border border-black/[0.05] rounded-2xl px-3 sm:px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0'
              : 'bg-[#111d2b]/90 border border-sky-500/25 rounded-2xl px-3 sm:px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0'
          }
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span
              className={
                isLight
                  ? 'px-2.5 py-1 rounded-lg bg-white border border-black/[0.06] text-[#14161D] font-mono text-xs font-bold tabular-nums shrink-0'
                  : 'px-2.5 py-1 rounded-lg bg-[#15263a] border border-sky-500/30 text-sky-400 font-mono text-xs font-bold tabular-nums shrink-0'
              }
            >
              {state.year}
            </span>
            <button
              type="button"
              onClick={() => onOpenTeamModal?.(state.club)}
              disabled={!onOpenTeamModal}
              className={`flex items-center gap-2.5 min-w-0 text-left ${
                onOpenTeamModal ? 'cursor-pointer hover:opacity-85 transition' : ''
              }`}
              title={state.club?.name ? `Inspect ${state.club.name}` : undefined}
            >
              <ClubLogo
                club={state.club}
                clubId={state.club?.id}
                name={state.club?.name}
                color={state.club?.color}
                color2={state.club?.color2}
                logo={modActive ? state.club?.logo : undefined}
                fallbackLogo={modActive ? state.club?.fallbackLogo : undefined}
                className="w-6 h-6 rounded-md object-contain shrink-0"
              />
              <div className="flex flex-col min-w-0 leading-tight">
                <span
                  className={`text-xs sm:text-[13px] font-bold truncate ${
                    onOpenTeamModal ? 'hover:underline' : ''
                  } ${isLight ? 'text-[#14161D]' : 'text-zinc-200'}`}
                >
                  {state.club?.name || 'Current Club'}
                </span>
                <span className={`text-[10px] truncate ${isLight ? 'text-[#525866]' : 'text-zinc-400'}`}>
                  Current campaign in progress · Tier {state.club?.tier || 1}
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLight && onOpenStandings && (
              <button
                type="button"
                onClick={onOpenStandings}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-[#EAE8E1] border border-black/[0.06] text-[#14161D] text-[10px] font-semibold transition cursor-pointer"
              >
                Table →
              </button>
            )}
            <span
              className={
                isLight
                  ? 'px-2.5 py-1 rounded-full bg-[#18191F] text-white text-[10px] font-bold uppercase tracking-wider shrink-0'
                  : 'px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0'
              }
            >
              ACTIVE
            </span>
          </div>
        </div>

        {/* Completed Season History Rows */}
        {!activeHistoryRows || activeHistoryRows.length === 0 ? (
          <div
            className={
              isLight
                ? 'flex-1 py-6 px-5 text-center flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#FAF9F6] border border-black/[0.04]'
                : 'py-12 px-6 text-center flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#161922]/50 border border-white/[0.04]'
            }
          >
            <span className={`text-xs font-semibold ${isLight ? 'text-[#14161D]' : 'text-zinc-300'}`}>
              Inaugural season archive ready
            </span>
            <span className={`text-[11px] max-w-sm ${isLight ? 'text-[#525866]' : 'text-zinc-500'}`}>
              Complete your first campaign to log club finishes, silverware, goal differential, and arena attendance here.
            </span>
          </div>
        ) : (
          ([...activeHistoryRows].reverse()).map((h, reversedIndex) => {
            const historyLength = activeHistoryRows.length;
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
              const nextHistoryItem = activeHistoryRows[originalIndex + 1];
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
              } else if (
                h.tier < maxTierForCountry &&
                h.pos >= dropCutoff &&
                !(h as any).survived &&
                h.relegated !== false
              ) {
                isRelegated = true;
              }
            }

            const cleanHistoryName = (h.clubName || '').toLowerCase().replace(/[\.\s\-]/g, '');
            const isCurrentClub = Boolean(
              state.club &&
                (state.club.name === h.clubName ||
                  (state.club.name || '').toLowerCase().replace(/[\.\s\-]/g, '') === cleanHistoryName ||
                  ((h as any).clubId &&
                    (String(state.club.id) === String((h as any).clubId) ||
                      Number(state.club.id) === Number((h as any).clubId))))
            );
            const activeClubsList = getActiveClubs(h.country || state.club?.country);
            const clubData = isCurrentClub
              ? state.club
              : activeClubsList.find((c) => {
                  if (
                    (h as any).clubId &&
                    (String(c.id) === String((h as any).clubId) ||
                      Number(c.id) === Number((h as any).clubId))
                  )
                    return true;
                  if (c.name === h.clubName) return true;
                  const cleanC = (c.name || '').toLowerCase().replace(/[\.\s\-]/g, '');
                  return cleanC === cleanHistoryName;
                }) ||
                ALL_CLUBS.find((c) => {
                  if (
                    (h as any).clubId &&
                    (String(c.id) === String((h as any).clubId) ||
                      Number(c.id) === Number((h as any).clubId))
                  )
                    return true;
                  if (c.name === h.clubName) return true;
                  const cleanC = (c.name || '').toLowerCase().replace(/[\.\s\-]/g, '');
                  return cleanC === cleanHistoryName;
                });

            const countryKey = (
              h.country ||
              clubData?.country ||
              (isCurrentClub ? state.club.country : 'GER') ||
              'GER'
            ).toUpperCase();
            const attRaw = h.att || (h as any).attendance || 0;
            const cap = h.stadium || clubData?.stadium || state.club?.stadium || 2000;
            const organicAtt = attRaw > 0 ? formatOrganicAttendance(attRaw, cap, h.year || 2024) : 0;
            const utilPct =
              organicAtt > 0 && cap > 0 ? Math.min(100, Math.round((organicAtt / cap) * 100)) : 0;

            const isChampion = Boolean(!h.bankrupt && h.pos === 1);
            const tierBadgeText =
              h.tier === 3 && countryKey === 'GER'
                ? '3. LIGA'
                : `${countryKey.slice(0, 3)} ${h.tier || 1}`;
            const tierBadgeClass = isLight
              ? h.tier === 1
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : h.tier === 2
                ? 'bg-sky-50 border-sky-200 text-sky-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : h.tier === 1
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : h.tier === 2
              ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';

            const ovrColorClass = isLight
              ? (h.ovr || 0) >= 92
                ? 'text-purple-700'
                : (h.ovr || 0) >= 82
                ? 'text-[#B54716]'
                : 'text-emerald-700'
              : (h.ovr || 0) >= 92
              ? 'text-purple-400'
              : (h.ovr || 0) >= 82
              ? 'text-amber-400'
              : 'text-emerald-400';

            return (
              <div
                key={`${h.year}-${h.clubName}-${originalIndex}`}
                ref={isLast ? activeRowRef : undefined}
                className={`items-center justify-between py-2.5 px-3 sm:px-3.5 transition-colors rounded-2xl group border ${
                  isLight
                    ? 'bg-[#FAF9F6] hover:bg-[#F2F0EB] border-black/[0.05]'
                    : 'bg-[#161922]/85 hover:bg-[#1b1f2b] border-white/[0.04]'
                } ${reversedIndex >= 6 && !showAllMobile ? 'hidden lg:flex' : 'flex'}`}
              >
                {/* Left: Year + ClubLogo + Name + Division/Champion Badges + Honours */}
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 pr-2 flex-1">
                  <span
                    className={
                      isLight
                        ? 'px-2.5 py-1 rounded-lg bg-white border border-black/[0.06] text-[#14161D] font-mono text-xs font-bold tabular-nums shrink-0 mt-0.5'
                        : 'px-2.5 py-1 rounded-lg bg-[#152232] border border-sky-500/25 text-sky-400 font-mono text-xs font-bold tabular-nums shrink-0 mt-0.5'
                    }
                  >
                    {h.year}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTeamModal?.(
                          clubData || {
                            id: (h as any).clubId,
                            name: h.clubName,
                            country: h.country,
                            tier: h.tier,
                            baseOvr: h.ovr,
                            stadium: h.stadium,
                            color: h.color,
                          }
                        )
                      }
                      disabled={!onOpenTeamModal}
                      className={`flex items-center gap-2 min-w-0 text-left ${
                        onOpenTeamModal ? 'cursor-pointer hover:opacity-85 transition' : ''
                      }`}
                      title={`Inspect ${h.clubName}`}
                    >
                      <ClubLogo
                        name={h.clubName}
                        clubId={(h as any).clubId || clubData?.id}
                        club={clubData}
                        color={h.color || clubData?.color}
                        color2={(h as any).color2 || clubData?.color2}
                        logo={modActive ? h.logo || clubData?.logo : undefined}
                        fallbackLogo={modActive ? clubData?.fallbackLogo : undefined}
                        className="w-5 h-5 rounded-md object-contain shrink-0"
                      />
                      <span
                        className={`text-xs sm:text-[13px] font-bold tracking-tight truncate leading-tight ${
                          onOpenTeamModal ? 'hover:underline' : ''
                        } ${isLight ? 'text-[#14161D]' : 'text-white'}`}
                      >
                        {h.clubName}
                      </span>
                    </button>

                    {/* Division Pill + Champion C Pill + Promotion/Relegation */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`px-1.5 py-0.2 rounded border text-[10px] font-bold uppercase tracking-wider ${tierBadgeClass}`}
                      >
                        {tierBadgeText}
                      </span>
                      {isChampion && (
                        <span
                          className="px-1.5 py-0.2 rounded bg-amber-400 text-zinc-950 text-[10px] font-black uppercase leading-tight"
                          title="League Champion"
                        >
                          C
                        </span>
                      )}
                      {isPromoted && (
                        <span
                          className={`px-1.5 py-0.2 rounded border text-[10px] font-bold uppercase ${
                            isLight
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          ↑ PROMOTED
                        </span>
                      )}
                      {isRelegated && (
                        <span
                          className={`px-1.5 py-0.2 rounded border text-[10px] font-bold uppercase ${
                            isLight
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          ↓ RELEGATED
                        </span>
                      )}
                      {h.bankrupt && (
                        <span
                          className={`px-1.5 py-0.2 rounded border text-[10px] font-bold uppercase ${
                            isLight
                              ? 'bg-rose-100 border-rose-300 text-rose-800'
                              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          INSOLVENT
                        </span>
                      )}
                      {h.isPreTenureClubArchive && (
                        <span
                          className={`text-[10px] font-medium ${
                            isLight ? 'text-[#686D7B]' : 'text-zinc-400'
                          }`}
                        >
                          · Pre-Arrival
                        </span>
                      )}
                    </div>

                    {/* Honours Row */}
                    {renderTrophyBadges(h.trophiesThisYear)}
                  </div>
                </div>

                {/* Right: Stats Columns (OVR | POS | GF | GA | ATT | UTIL) */}
                <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0 text-[11px] sm:text-xs tabular-nums">
                  <span
                    className={`w-6 sm:w-8 text-center font-bold ${
                      h.bankrupt ? 'text-[#525866]' : ovrColorClass
                    }`}
                  >
                    {h.bankrupt ? '—' : h.ovr}
                  </span>

                  <span
                    className={`w-6 sm:w-8 text-center font-bold ${
                      isLight ? 'text-[#14161D]' : 'text-white'
                    }`}
                  >
                    {h.bankrupt ? '—' : `${h.pos}.`}
                  </span>

                  <span
                    className={`hidden sm:inline-block w-8 text-center font-semibold ${
                      isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}
                  >
                    {h.bankrupt ? '—' : h.gf ?? 0}
                  </span>

                  <span
                    className={`hidden sm:inline-block w-8 text-center font-semibold ${
                      isLight ? 'text-rose-700' : 'text-rose-400'
                    }`}
                  >
                    {h.bankrupt ? '—' : h.ga ?? 0}
                  </span>

                  <span
                    className={`w-11 sm:w-14 text-right font-medium ${
                      isLight ? 'text-[#525866]' : 'text-zinc-300'
                    }`}
                  >
                    {h.bankrupt || organicAtt <= 0 ? '—' : organicAtt.toLocaleString()}
                  </span>

                  <span
                    className={`w-8 sm:w-10 text-right font-semibold ${
                      isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}
                  >
                    {h.bankrupt || utilPct <= 0 ? '—' : `${utilPct}%`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeHistoryRows && activeHistoryRows.length > 6 && (
        <div
          className={`p-2.5 pt-2 flex justify-center lg:hidden border-t bg-transparent ${
            isLight ? 'border-black/[0.05]' : 'border-white/[0.04]'
          }`}
        >
          <button
            onClick={() => setShowAllMobile((prev) => !prev)}
            className={
              isLight
                ? 'w-full text-xs font-semibold text-[#14161D] bg-[#F5F4F0] hover:bg-[#EAE8E1] border border-black/[0.06] py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer'
                : 'w-full text-xs font-semibold text-sky-300 hover:text-white bg-sky-500/[0.05] hover:bg-sky-500/10 active:scale-[0.98] border border-sky-500/20 py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm'
            }
          >
            <i className={`fas ${showAllMobile ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`} />
            <span>
              {showAllMobile
                ? 'Collapse to Recent 6 Seasons'
                : `Show All ${activeHistoryRows.length} Seasons (+${activeHistoryRows.length - 6} more)`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
