import React, { useState, useMemo } from 'react';
import { Club, GameState, Language } from '../types';
import { formatNum } from '../data/gameConstants';
import { LeaderboardEntry } from '../lib/supabaseClient';

export type { LeaderboardEntry };

interface GlobalLeaderboardProps {
  highscores: LeaderboardEntry[];
  gameState?: GameState | null;
  clubsDb?: Club[];
  lang?: Language;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
}

type TabType = 'top_managers' | 'all_runs' | 'my_career';

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  highscores,
  gameState,
  clubsDb = [],
  lang = 'en',
  onRefresh,
  isRefreshing = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('top_managers');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  // Current active career stats
  const currentCareerScore = gameState?.careerScore || 0;
  const currentManagerName = gameState?.managerName || 'Current Manager';
  const currentClubName = gameState?.club?.name || 'Current Club';
  const currentTrophies = gameState?.totals?.trophies || 0;
  const currentSeasons = gameState?.history?.length || 0;

  // Filtered and sorted list based on active tab and search query
  const displayedList = useMemo(() => {
    let list: LeaderboardEntry[] = [];

    if (activeTab === 'top_managers') {
      // Deduplicate by manager to display each manager's all-time personal best career
      const bestByManager = new Map<string, LeaderboardEntry>();
      for (const entry of highscores) {
        const key = (entry.managerName || '').toLowerCase().trim();
        if (!key) continue;
        const existing = bestByManager.get(key);
        if (!existing || (entry.score || 0) > (existing.score || 0)) {
          bestByManager.set(key, entry);
        }
      }
      list = Array.from(bestByManager.values());
    } else if (activeTab === 'all_runs') {
      // All recorded career runs worldwide
      list = [...highscores];
    } else if (activeTab === 'my_career') {
      list = highscores.filter(
        (e) => (e.managerName || '').toLowerCase().trim() === currentManagerName.toLowerCase().trim()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.managerName || '').toLowerCase().includes(q) ||
          (e.clubName || '').toLowerCase().includes(q) ||
          (e.startTier && `tier ${e.startTier}`.includes(q))
      );
    }

    // Sort descending by score and deliver top 50
    return list.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 50);
  }, [activeTab, highscores, currentManagerName, searchQuery]);

  // Projected rank for active career among the Top 50
  const projectedRank = useMemo(() => {
    if (!currentCareerScore) return null;
    const higherCount = highscores.filter((e) => (e.score || 0) > currentCareerScore).length;
    return higherCount + 1;
  }, [highscores, currentCareerScore]);

  return (
    <div className="w-full bg-[#0c0e15] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="p-5 sm:p-7 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-trophy"></i>
              Official Global Rankings
            </span>
            <span className="text-zinc-500 text-xs">·</span>
            <span className="text-zinc-400 text-xs font-mono">
              Top 50 All-Time Managers Worldwide
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            All-Time Leaderboard
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Verified managerial career highscores from all players worldwide.
          </p>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center p-1 bg-black/50 border border-white/[0.08] rounded-2xl">
            <button
              onClick={() => setActiveTab('top_managers')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'top_managers'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Top 50 Managers
            </button>
            <button
              onClick={() => setActiveTab('all_runs')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'all_runs'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Runs
            </button>
            <button
              onClick={() => setActiveTab('my_career')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'my_career'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              My Careers
            </button>
          </div>

          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manager or club..."
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-black/50 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition flex items-center justify-center cursor-pointer shrink-0"
              title="Refresh Leaderboard from Supabase"
            >
              <i className={`fa-solid fa-rotate-right text-xs ${isRefreshing ? 'fa-spin text-amber-400' : ''}`}></i>
            </button>
          )}
        </div>
      </div>

      {/* Active Manager Benchmark Ribbon */}
      {gameState && currentCareerScore > 0 && (
        <div className="px-5 sm:px-7 py-3.5 bg-gradient-to-r from-sky-500/10 via-amber-500/5 to-transparent border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold shrink-0">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
                  Current Career In Progress
                </span>
                {projectedRank && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                    Projected #{projectedRank}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{currentManagerName}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300 text-xs">{currentClubName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:justify-end">
            <div>
              <div className="text-[9px] uppercase font-bold text-zinc-500">Seasons & Silverware</div>
              <div className="text-xs font-semibold text-zinc-300">
                {currentSeasons} yrs · {currentTrophies} 🏆
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase font-bold text-zinc-500">Live Career Score</div>
              <div className="text-lg font-mono font-black text-amber-400 tabular-nums">
                {formatNum(currentCareerScore)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Content (Top 50 Managers) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-black/25">
              <th className="py-3 px-4 sm:px-6 w-14 text-center">Rank</th>
              <th className="py-3 px-4">Manager</th>
              <th className="py-3 px-4 hidden sm:table-cell">Club / Entity</th>
              <th className="py-3 px-4 text-center w-24">Trophies</th>
              <th className="py-3 px-4 text-right sm:pr-8 w-28">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {displayedList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs">
                  <i className="fa-solid fa-inbox text-2xl mb-2 text-zinc-600 block"></i>
                  No manager records found matching criteria.
                </td>
              </tr>
            ) : (
              displayedList.map((entry, idx) => {
                const rank = idx + 1;
                const isCurrentManager =
                  (entry.managerName || '').toLowerCase().trim() === currentManagerName.toLowerCase().trim();
                const isExpanded = expandedId === entry.id;

                const medalColor =
                  rank === 1
                    ? 'text-amber-400 bg-amber-400/10 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : rank === 2
                    ? 'text-zinc-200 bg-zinc-300/10 border-zinc-300/30'
                    : rank === 3
                    ? 'text-amber-600 bg-amber-600/10 border-amber-600/30'
                    : 'text-zinc-500 bg-white/[0.02] border-white/[0.05]';

                return (
                  <React.Fragment key={entry.id || idx}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className={`hover:bg-white/[0.035] transition-colors cursor-pointer text-xs ${
                        isCurrentManager ? 'bg-sky-500/[0.07]' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 sm:px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold font-mono border ${medalColor}`}
                        >
                          {rank}
                        </span>
                      </td>

                      {/* Manager */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                            {rank === 1 ? (
                              <i className="fa-solid fa-crown text-amber-400 text-xs"></i>
                            ) : (
                              <i className="fa-solid fa-user text-zinc-400 text-xs"></i>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white flex items-center gap-1.5 truncate">
                              <span className="truncate">{entry.managerName}</span>
                              {isCurrentManager && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase bg-sky-400/20 text-sky-300 shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 sm:hidden truncate">
                              {entry.clubName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Club */}
                      <td className="py-3 px-4 hidden sm:table-cell text-zinc-300 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{entry.clubName}</span>
                          {entry.startTier && (
                            <span className="text-[10px] font-mono text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.06]">
                              Tier {entry.startTier}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trophies */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-zinc-300">
                          <i className="fa-solid fa-trophy text-amber-400 text-[10px]"></i>
                          <span className="font-mono">{entry.trophies || 0}</span>
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 text-right sm:pr-8">
                        <span className="font-mono font-black text-amber-400 text-sm tabular-nums">
                          {formatNum(entry.score)}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable row */}
                    {isExpanded && (
                      <tr className="bg-black/40 border-b border-white/[0.04]">
                        <td colSpan={5} className="py-3 px-6 sm:px-12 text-zinc-400 text-[11px]">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                              <span>
                                <strong className="text-zinc-300">Club:</strong> {entry.clubName}
                              </span>
                              {entry.startTier && (
                                <span>
                                  <strong className="text-zinc-300">Starting Tier:</strong> Tier {entry.startTier}
                                </span>
                              )}
                              <span>
                                <strong className="text-zinc-300">Silverware:</strong> {entry.trophies} Titles
                              </span>
                            </div>
                            <div className="text-zinc-500 font-mono text-[10px]">
                              {entry.date ? `Recorded: ${entry.date}` : 'Verified'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GlobalLeaderboard;
