import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HighscoreEntry } from '../App';
import { Club, GameState, Language } from '../types';
import { HISTORICAL_DIRECTORS, formatNum } from '../data/gameConstants';
import { ClubLogo } from './ClubLogo';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highscores: HighscoreEntry[];
  gameState?: GameState | null;
  clubsDb?: Club[];
  lang?: Language;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
}

type TabType = 'all' | 'hall_of_fame' | 'my_career';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  highscores,
  gameState,
  clubsDb,
  lang = 'en',
  onRefresh,
  isRefreshing = false,
}) => {
  const isDe = lang === 'de';
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setExpandedId(null);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Current active career stats
  const currentCareerScore = gameState?.careerScore || 0;
  const currentManagerName = gameState?.managerName || (isDe ? 'Aktueller Manager' : 'Current Manager');
  const currentClubName = gameState?.club?.name || (isDe ? 'Aktueller Club' : 'Current Club');
  const currentTrophies = gameState?.totals?.trophies || 0;
  const currentSeasons = gameState?.history?.length || 0;

  // Filtered and normalized highscores
  const allEntries = useMemo(() => {
    return (highscores || []).map((hs, idx) => ({
      id: hs.id || `hs-${idx}-${hs.score}`,
      managerName: hs.managerName || (hs as any).manager_name || 'Manager',
      clubName: hs.clubName || (hs as any).club_name || 'Club',
      score: typeof hs.score === 'number' ? hs.score : parseInt(String(hs.score), 10) || 0,
      trophies: typeof hs.trophies === 'number' ? hs.trophies : parseInt(String(hs.trophies), 10) || 0,
      date: hs.date || (hs as any).created_at || '',
      startTier: hs.start_tier || (hs as any).startTier,
      isHistorical: false,
    }));
  }, [highscores]);

  // Hall of Fame entries
  const hofEntries = useMemo(() => {
    return HISTORICAL_DIRECTORS.map((m, idx) => ({
      id: `hof-${m.id || idx}`,
      managerName: m.name,
      clubName: isDe ? 'Historische Legende' : 'Historical Legend',
      score: m.score,
      trophies: m.trophies,
      date: 'All-Time',
      startTier: 1,
      isHistorical: true,
    }));
  }, [isDe]);

  // Combined and sorted lists depending on active tab
  const displayedList = useMemo(() => {
    let list: Array<{
      id: string | number;
      managerName: string;
      clubName: string;
      score: number;
      trophies: number;
      date: string;
      startTier?: number;
      isHistorical?: boolean;
    }> = [];

    if (activeTab === 'all') {
      list = [...allEntries];
    } else if (activeTab === 'hall_of_fame') {
      list = [...hofEntries];
    } else if (activeTab === 'my_career') {
      list = allEntries.filter(
        (e) => e.managerName.toLowerCase() === currentManagerName.toLowerCase()
      );
    }

    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.managerName.toLowerCase().includes(q) ||
          e.clubName.toLowerCase().includes(q) ||
          (e.startTier && `tier ${e.startTier}`.includes(q))
      );
    }

    return list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [activeTab, allEntries, hofEntries, currentManagerName, searchQuery]);

  // Projected rank for active career
  const projectedRank = useMemo(() => {
    if (!currentCareerScore) return null;
    const higherCount = allEntries.filter((e) => (e.score || 0) > currentCareerScore).length;
    return higherCount + 1;
  }, [allEntries, currentCareerScore]);

  // Next legend to beat in Hall of Fame
  const nextTargetLegend = useMemo(() => {
    const sortedLegends = [...HISTORICAL_DIRECTORS].sort((a, b) => a.score - b.score);
    return sortedLegends.find((m) => m.score > currentCareerScore);
  }, [currentCareerScore]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="leaderboard-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1, ease: "linear" }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-6 bg-black/80 backdrop-blur-2xl overflow-y-auto overscroll-contain"
        onClick={onClose}
      >
        <motion.div
          key="leaderboard-modal-card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#0c0e14]/95 border border-white/[0.08] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto overflow-hidden backdrop-blur-2xl shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient subtle glow */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Section */}
          <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-start justify-between gap-4 relative z-10">
            <div>
              <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 flex items-center gap-2 mb-1">
                <i className="fa-solid fa-trophy text-[11px] text-sky-400" />
                <span>{isDe ? 'Rangliste & Hall of Fame' : 'Global Ranking & Hall of Fame'}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400 font-normal">
                  {allEntries.length} {isDe ? 'Karrieren erfasst' : 'Careers Recorded'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isDe ? 'Weltweite Bestenliste' : 'Global Leaderboard'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal leading-relaxed">
                {isDe
                  ? 'Historische Rekorde, legendäre Sportdirektoren und weltweite Karriere-Höchstwerte.'
                  : 'Verified managerial achievements, legendary sporting directors, and all-time scores.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onRefresh && (
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  disabled={isRefreshing}
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition flex items-center justify-center cursor-pointer disabled:opacity-40"
                  title={isDe ? 'Aktualisieren' : 'Refresh'}
                >
                  <i className={`fas fa-rotate text-xs ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition flex items-center justify-center cursor-pointer"
                title={isDe ? 'Schließen' : 'Close'}
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
          </div>

          {/* Active Career Benchmark Ribbon (Shows current session score in context) */}
          {gameState && currentCareerScore > 0 && (
            <div className="px-5 sm:px-6 pt-4 pb-3 border-b border-white/[0.06] bg-gradient-to-r from-sky-500/[0.07] via-white/[0.02] to-transparent relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400 text-sm font-bold shrink-0">
                    <i className="fa-solid fa-user-tie" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 flex items-center gap-1.5">
                      <span>{isDe ? 'Deine Aktive Karriere' : 'Your Active Career'}</span>
                      {projectedRank && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="text-white font-bold">
                            {isDe ? `Rang #${projectedRank}` : `Rank #${projectedRank}`}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{currentManagerName}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-xs text-zinc-300 font-medium">{currentClubName}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
                      {currentSeasons} {isDe ? 'Saisons absolviert' : 'Seasons Completed'}
                      <span className="mx-1 text-zinc-600">·</span>
                      {currentTrophies} {isDe ? 'Titel' : 'Trophies'}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 bg-white/[0.03] sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-xl border sm:border-0 border-white/[0.06]">
                  <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold sm:text-right">
                    {isDe ? 'Karriere-Punkte' : 'Career Score'}
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-sky-400 tabular-nums">
                    {formatNum(currentCareerScore)}
                  </div>
                  {nextTargetLegend && (
                    <div className="text-[10px] text-zinc-400 hidden sm:block">
                      {isDe ? 'Nächstes Ziel:' : 'Next milestone:'}{' '}
                      <span className="text-zinc-300 font-medium">{nextTargetLegend.name}</span>{' '}
                      <span className="font-mono text-zinc-400">({formatNum(nextTargetLegend.score)})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar: Segmented Tabs & Search Bar */}
          <div className="px-5 sm:px-6 py-3 border-b border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
            {/* Apple-style Segmented Control */}
            <div className="flex items-center p-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                {isDe ? 'Alle Rekorde' : 'All Records'} ({allEntries.length})
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('hall_of_fame')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'hall_of_fame'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                {isDe ? 'Hall of Fame' : 'Hall of Fame'} ({hofEntries.length})
              </button>
              {allEntries.some((e) => e.managerName.toLowerCase() === currentManagerName.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => handleTabChange('my_career')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'my_career'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  {isDe ? 'Meine Karrieren' : 'My Careers'}
                </button>
              )}
            </div>

            {/* Clean Minimalist Search Input */}
            <div className="relative flex-1 max-w-full sm:max-w-xs">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isDe ? 'Suche nach Manager oder Club...' : 'Filter manager or club...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] focus:border-sky-400/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  <i className="fa-solid fa-circle-xmark" />
                </button>
              )}
            </div>
          </div>

          {/* Leaderboard Entries List */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-4 sm:p-6 space-y-2.5 relative z-10">
            {displayedList.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-zinc-500 text-lg">
                  <i className="fa-solid fa-trophy" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {isDe ? 'Keine Einträge gefunden' : 'No records found'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? isDe
                      ? `Keine Einträge für "${searchQuery}" vorhanden.`
                      : `No entries matching "${searchQuery}".`
                    : isDe
                    ? 'Schließe Saisons ab, um deine Punktzahl auf der Bestenliste zu verewigen!'
                    : 'Complete managerial seasons to cement your career score on the global leaderboard!'}
                </p>
              </div>
            ) : (
              displayedList.map((entry, idx) => {
                const rank = idx + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;
                const isCurrentActive =
                  entry.managerName.toLowerCase() === currentManagerName.toLowerCase() &&
                  entry.clubName.toLowerCase() === currentClubName.toLowerCase();
                const isExpanded = expandedId === entry.id;

                // Matched club for visual branding
                const matchedClub = clubsDb?.find(
                  (c) =>
                    c.name.toLowerCase().trim() === entry.clubName.toLowerCase().trim() ||
                    c.name.toLowerCase().includes(entry.clubName.toLowerCase()) ||
                    entry.clubName.toLowerCase().includes(c.name.toLowerCase())
                );

                return (
                  <div
                    key={entry.id}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                      isTop1
                        ? 'bg-gradient-to-r from-amber-500/[0.08] via-white/[0.02] to-transparent border-amber-400/30 hover:border-amber-400/50 shadow-[0_4px_20px_rgba(245,158,11,0.06)]'
                        : isTop2
                        ? 'bg-gradient-to-r from-slate-400/[0.06] via-white/[0.02] to-transparent border-slate-300/30 hover:border-slate-300/50'
                        : isTop3
                        ? 'bg-gradient-to-r from-amber-700/[0.05] via-white/[0.02] to-transparent border-amber-700/30 hover:border-amber-700/50'
                        : isCurrentActive
                        ? 'bg-sky-500/[0.08] border-sky-400/30 hover:border-sky-400/50 shadow-[0_4px_20px_rgba(56,189,248,0.06)]'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                    }`}
                  >
                    {/* Primary Row */}
                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 tabular-nums ${
                            isTop1
                              ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                              : isTop2
                              ? 'bg-slate-200 text-black shadow-[0_0_10px_rgba(226,232,240,0.3)]'
                              : isTop3
                              ? 'bg-amber-700/60 text-amber-200 border border-amber-600/40'
                              : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06]'
                          }`}
                        >
                          #{rank}
                        </div>

                        {/* Club Monogram / Logo if available */}
                        {matchedClub && (
                          <div className="shrink-0 hidden xs:block">
                            <ClubLogo
                              name={matchedClub.name}
                              id={matchedClub.id}
                              color={matchedClub.color}
                              logo={matchedClub.logo}
                              fallbackLogo={matchedClub.fallbackLogo}
                              className="w-7 h-7 object-contain drop-shadow-sm"
                              fallbackClassName="w-7 h-7 text-[10px] rounded-lg flex items-center justify-center font-bold text-white"
                            />
                          </div>
                        )}

                        {/* Manager & Club Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isTop1 ? 'text-amber-200' : isCurrentActive ? 'text-sky-300' : 'text-white'
                              }`}
                            >
                              {entry.managerName}
                            </h4>
                            {isCurrentActive && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-400/30 shrink-0">
                                {isDe ? 'Du' : 'You'}
                              </span>
                            )}
                            {entry.isHistorical && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/25 shrink-0">
                                Legend
                              </span>
                            )}
                          </div>

                          {/* Quiet, unboxed metadata */}
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-normal mt-0.5 truncate">
                            <span className="text-zinc-300 truncate py-0.5 leading-normal">{entry.clubName}</span>
                            {entry.startTier && (
                              <>
                                <span className="text-zinc-600">·</span>
                                <span>Tier {entry.startTier}</span>
                              </>
                            )}
                            {entry.trophies > 0 && (
                              <>
                                <span className="text-zinc-600">·</span>
                                <span className="text-amber-400/90 font-medium">
                                  {entry.trophies} {isDe ? 'Titel' : 'Trophies'}
                                </span>
                              </>
                            )}
                            {entry.date && entry.date !== 'All-Time' && (
                              <>
                                <span className="text-zinc-600 hidden sm:inline">·</span>
                                <span className="text-zinc-500 hidden sm:inline">
                                  {(() => {
                                    const d = new Date(entry.date);
                                    return isNaN(d.getTime()) ? String(entry.date) : d.toLocaleDateString();
                                  })()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score on Right */}
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <div
                            className={`text-sm sm:text-base font-bold font-mono tabular-nums tracking-tight ${
                              isTop1 ? 'text-amber-300' : isCurrentActive ? 'text-sky-400' : 'text-white'
                            }`}
                          >
                            {formatNum(entry.score)}
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                            {isDe ? 'Punkte' : 'Points'}
                          </div>
                        </div>

                        {/* Disclosure chevron */}
                        <div className="text-zinc-500 text-xs pl-1">
                          <i
                            className={`fa-solid fa-chevron-down transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-sky-400' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Progressive Disclosure: Expanded Career Breakdown */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 pt-1 border-t border-white/[0.05] bg-black/30"
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2">
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5">
                              <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                                {isDe ? 'Start-Liga' : 'Starting Tier'}
                              </div>
                              <div className="text-xs font-bold text-white mt-0.5">
                                {entry.startTier ? `Tier ${entry.startTier}` : 'Top Tier'}
                              </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5">
                              <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                                {isDe ? 'Trophäen' : 'Silverware'}
                              </div>
                              <div className="text-xs font-bold text-amber-300 mt-0.5 flex items-center justify-center gap-1">
                                <i className="fa-solid fa-trophy text-[10px]" />
                                <span>{entry.trophies}</span>
                              </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5">
                              <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                                {isDe ? 'Status' : 'Verification'}
                              </div>
                              <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                                <i className="fa-solid fa-circle-check text-[10px]" />
                                <span>{entry.isHistorical ? 'Hall of Fame' : 'Verified'}</span>
                              </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5">
                              <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                                {isDe ? 'Erreicht am' : 'Logged Date'}
                              </div>
                              <div className="text-xs font-medium text-zinc-300 mt-0.5 truncate">
                                {entry.date && entry.date !== 'All-Time'
                                  ? (() => {
                                      const d = new Date(entry.date);
                                      return isNaN(d.getTime()) ? String(entry.date) : d.toLocaleDateString();
                                    })()
                                  : 'All-Time'}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isDe
                  ? 'Offiziell synchronisiert mit der globalen Hall of Fame'
                  : 'Cloud-synced with global highscore registries'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-semibold transition cursor-pointer self-stretch sm:self-auto"
            >
              {isDe ? 'Schließen' : 'Close'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
