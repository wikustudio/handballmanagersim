import React, { useState, useEffect, useMemo } from 'react';
import { GameState } from '../types';
import { fetchHighscores } from '../utils/leaderboard';

interface LeaderboardViewProps {
  state: GameState;
  lang?: 'en' | 'de' | 'es';
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ state, lang = 'en' }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'top50' | 'all' | 'my'>('top50');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = () => {
    setLoading(true);
    fetchHighscores()
      .then(data => {
        setEntries(data || []);
      })
      .catch(() => {
        setEntries([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered and searched entries
  const displayedEntries = useMemo(() => {
    let list = [...entries];

    if (filterTab === 'my') {
      const myName = (state.managerName || '').trim().toLowerCase();
      list = list.filter(e => {
        const entryName = (e.managerName || e.manager_name || '').trim().toLowerCase();
        return myName && entryName.includes(myName);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(e => {
        const m = (e.managerName || e.manager_name || '').toLowerCase();
        const c = (e.clubName || e.club_name || '').toLowerCase();
        return m.includes(q) || c.includes(q);
      });
    }

    if (filterTab === 'top50') {
      list = list.slice(0, 50);
    }

    return list;
  }, [entries, filterTab, searchQuery, state.managerName]);

  return (
    <div className="w-full flex flex-col gap-4 text-neutral-200">
      {/* Category Header & Top Navigation Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-white/[0.04] pb-4">
        <div>
          <div className="text-[11px] font-mono font-medium tracking-wider text-amber-400 uppercase flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>OFFICIAL GLOBAL RANKINGS · Top 50 All-Time Managers Worldwide</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
            All-Time Leaderboard
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">
            Verified managerial career highscores from all players worldwide.
          </p>
        </div>

        {/* Toolbar: Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Segmented Filter Pills */}
          <div className="bg-[#10121a] p-1 rounded-xl border border-white/[0.04] flex items-center gap-1">
            <button
              onClick={() => setFilterTab('top50')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterTab === 'top50'
                  ? 'bg-amber-500/[0.1] text-amber-300 border border-amber-500/25 shadow-sm'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              Top 50 Managers
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-amber-500/[0.1] text-amber-300 border border-amber-500/25 shadow-sm'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              All Runs
            </button>
            <button
              onClick={() => setFilterTab('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterTab === 'my'
                  ? 'bg-amber-500/[0.1] text-amber-300 border border-amber-500/25 shadow-sm'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              My Careers
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 min-w-[140px] sm:w-60">
            <i className="fas fa-magnifying-glass text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#10121a] border border-white/[0.04] focus:border-amber-400/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            title="Refresh"
            className="w-8 h-8 rounded-xl bg-[#10121a] hover:bg-white/[0.04] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition shrink-0 cursor-pointer active:scale-95"
          >
            <i className={`fas fa-rotate-right text-xs ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table (Matching Screenshot) */}
      <div className="w-full bg-[#10121a] border border-white/[0.04] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.04] text-[10px] font-semibold text-zinc-400 uppercase tracking-wider bg-white/[0.02]">
                <th className="py-3 px-4 w-16">RANK</th>
                <th className="py-3 px-4">MANAGER</th>
                <th className="py-3 px-4">CLUB / ENTITY</th>
                <th className="py-3 px-4 text-center">TROPHIES</th>
                <th className="py-3 px-4 text-right">SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-400">
                    <i className="fas fa-circle-notch fa-spin text-2xl text-amber-400 mb-2.5 block" />
                    <span className="text-xs font-medium">
                      Fetching verified Supabase rankings...
                    </span>
                  </td>
                </tr>
              ) : displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-500">
                    <i className="fas fa-trophy text-3xl text-zinc-600 mb-2.5 block opacity-30" />
                    <span className="font-semibold block text-zinc-300 text-sm">
                      No verified careers posted yet.
                    </span>
                    <span className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto block leading-relaxed">
                      Complete a managerial campaign or finish Season 35 to post your official score to the global Supabase leaderboard!
                    </span>
                  </td>
                </tr>
              ) : (
                displayedEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const managerName = entry.managerName || entry.manager_name || 'Anonymous';
                  const clubName = entry.clubName || entry.club_name || 'Handball Club';
                  const tier = entry.start_tier ?? entry.startTier ?? entry.tier ?? 1;
                  const trophyCount = entry.trophies ?? 0;
                  const scoreVal = Number(entry.score || 0);

                  const isCurrentUser =
                    state.managerName &&
                    managerName.trim().toLowerCase() === state.managerName.trim().toLowerCase();

                  return (
                    <tr
                      key={`rank-${idx}-${managerName}`}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-sky-500/[0.08] hover:bg-sky-500/[0.12] border-l-2 border-sky-400'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-4">
                        {rank === 1 ? (
                          <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center font-semibold text-xs shadow-sm">
                            <span className="text-[11px] tabular-nums">1</span>
                          </div>
                        ) : rank === 2 ? (
                          <div className="w-7 h-7 rounded-full bg-amber-500/[0.08] border border-amber-500/20 text-amber-200 flex items-center justify-center font-semibold text-xs">
                            <span className="text-[11px] tabular-nums">2</span>
                          </div>
                        ) : rank === 3 ? (
                          <div className="w-7 h-7 rounded-full bg-amber-600/[0.08] border border-amber-500/20 text-amber-200/90 flex items-center justify-center font-semibold text-xs">
                            <span className="text-[11px] tabular-nums">3</span>
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/[0.04] text-zinc-400 flex items-center justify-center font-medium text-xs">
                            <span className="tabular-nums">{rank}</span>
                          </div>
                        )}
                      </td>

                      {/* Manager Column */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                            rank === 1
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : isCurrentUser
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-400/20'
                              : 'bg-white/[0.04] text-zinc-400'
                          }`}>
                            {rank === 1 ? <i className="fas fa-crown text-[10px]" /> : <i className="fas fa-user text-[10px]" />}
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="uppercase tracking-tight truncate">{managerName}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20 px-1.5 py-0.2 rounded shrink-0">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Club / Entity Column */}
                      <td className="py-3.5 px-4 text-zinc-300">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-medium truncate">{clubName}</span>
                          <span className="text-[10px] font-medium bg-white/[0.03] border border-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                            Tier {tier}
                          </span>
                        </div>
                      </td>

                      {/* Trophies Column */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-medium text-zinc-200">
                          <span className="text-amber-400 text-xs">🏆</span>
                          <span className="tabular-nums">{trophyCount}</span>
                        </div>
                      </td>

                      {/* Score Column */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-amber-400 tabular-nums text-sm sm:text-base">
                          {scoreVal.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
