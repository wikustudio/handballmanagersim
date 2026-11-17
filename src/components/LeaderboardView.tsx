import React, { useState, useEffect, useMemo } from 'react';
import { GameState } from '../types';
import { fetchHighscores, calculateLiveScore, getReconciledTrophies } from '../utils/leaderboard';

interface LeaderboardViewProps {
  state: GameState;
  lang?: 'en' | 'de' | 'es';
  isCourtside?: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  state,
  isCourtside = false,
}) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'top50' | 'all' | 'my'>('top50');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = () => {
    setLoading(true);
    fetchHighscores()
      .then((data) => {
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

  const hasActiveCareer = Boolean(state.managerName && state.club?.name);
  const liveScore = useMemo(
    () => (hasActiveCareer ? calculateLiveScore(state) : 0),
    [hasActiveCareer, state]
  );
  const liveTrophies = useMemo(
    () => (hasActiveCareer ? getReconciledTrophies(state) : 0),
    [hasActiveCareer, state]
  );
  const liveSeasons = state.history?.length || 0;

  const displayedEntries = useMemo(() => {
    let list = [...entries];

    if (filterTab === 'my') {
      const myName = (state.managerName || '').trim().toLowerCase();
      list = list.filter((e) => {
        const entryName = (e.managerName || e.manager_name || '').trim().toLowerCase();
        return myName && entryName.includes(myName);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) => {
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
    <div
      className={`w-full flex flex-col gap-4 ${
        isCourtside ? 'text-[#14161D]' : 'text-neutral-200'
      }`}
    >
      {/* Category Header & Top Navigation Toolbar */}
      <div
        className={`flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b ${
          isCourtside ? 'border-black/[0.06]' : 'border-white/[0.06]'
        }`}
      >
        <div>
          <div
            className={`text-xs font-semibold mb-1 ${
              isCourtside ? 'text-[#DF642A]' : 'text-amber-400'
            }`}
          >
            Official Global Rankings · Top 50 All-Time Head Coaches &amp; GMs
          </div>
          <h3
            className={`text-xl sm:text-2xl font-bold tracking-tight leading-tight ${
              isCourtside ? 'text-[#14161D]' : 'text-white'
            }`}
          >
            All-Time Leaderboard
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isCourtside ? 'text-[#525866]' : 'text-zinc-400'
            }`}
          >
            Verified 35-season and dynasty career scores from managers worldwide.
          </p>
        </div>

        {/* Toolbar: Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div
            className={`p-1 rounded-full flex items-center gap-1 ${
              isCourtside
                ? 'bg-white border border-black/[0.06]'
                : 'bg-[#10121a] border border-white/[0.06]'
            }`}
          >
            {(
              [
                { id: 'top50', label: 'Top 50' },
                { id: 'all', label: 'All Runs' },
                { id: 'my', label: 'My Careers' },
              ] as const
            ).map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    active
                      ? isCourtside
                        ? 'bg-[#18191F] text-white'
                        : 'bg-amber-500/15 text-amber-300'
                      : isCourtside
                      ? 'text-[#686D7B] hover:text-[#14161D]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 min-w-[140px] sm:w-52">
            <i
              aria-hidden="true"
              className={`fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs ${
                isCourtside ? 'text-[#5C6270]' : 'text-zinc-500'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coach or club..."
              aria-label="Search leaderboard"
              className={`w-full rounded-full pl-8 pr-3 py-1.5 text-xs outline-none transition border ${
                isCourtside
                  ? 'bg-white border-black/[0.07] focus:border-[#18191F] text-[#14161D] placeholder-[#5C6270]'
                  : 'bg-[#10121a] border-white/[0.06] focus:border-amber-400/40 text-white placeholder-zinc-500'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            title="Refresh Leaderboard"
            aria-label="Refresh Leaderboard"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer active:scale-95 border ${
              isCourtside
                ? 'bg-white hover:bg-[#F5F4F0] border-black/[0.06] text-[#525866] hover:text-[#14161D]'
                : 'bg-[#10121a] hover:bg-white/[0.05] border-white/[0.06] text-zinc-400 hover:text-white'
            }`}
          >
            <i
              aria-hidden="true"
              className={`fas fa-rotate-right text-xs ${
                loading ? 'animate-spin text-[#DF642A]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Active Career Benchmark Strip */}
      {hasActiveCareer && (
        <div
          className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
            isCourtside
              ? 'bg-white border-black/[0.06] shadow-[0_6px_20px_rgba(15,23,42,0.04)]'
              : 'bg-[#10121a] border-white/[0.06]'
          }`}
        >
          <div className="min-w-0">
            <span
              className={`text-[11px] font-semibold block ${
                isCourtside ? 'text-[#6E7381]' : 'text-zinc-400'
              }`}
            >
              Active Career Benchmark
            </span>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span
                className={`text-sm font-bold ${
                  isCourtside ? 'text-[#14161D]' : 'text-white'
                }`}
              >
                {state.managerName}
              </span>
              <span className={isCourtside ? 'text-[#5C6270]' : 'text-zinc-600'}>·</span>
              <span
                className={`text-xs font-medium ${
                  isCourtside ? 'text-[#525866]' : 'text-zinc-300'
                }`}
              >
                {state.club?.name} (Tier {state.club?.tier || 1})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 tabular-nums shrink-0">
            <div>
              <span
                className={`text-[10px] font-medium block ${
                  isCourtside ? 'text-[#525866]' : 'text-zinc-500'
                }`}
              >
                Campaigns &amp; Titles
              </span>
              <span
                className={`text-xs font-bold ${
                  isCourtside ? 'text-[#14161D]' : 'text-zinc-200'
                }`}
              >
                {liveSeasons} seasons · {liveTrophies} trophies
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-[10px] font-medium block ${
                  isCourtside ? 'text-[#525866]' : 'text-zinc-500'
                }`}
              >
                Live Career Score
              </span>
              <span
                className={`text-lg font-extrabold ${
                  isCourtside ? 'text-[#DF642A]' : 'text-amber-400'
                }`}
              >
                {liveScore.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div
        className={`w-full rounded-2xl overflow-hidden border ${
          isCourtside
            ? 'bg-white border-black/[0.06] shadow-[0_8px_24px_rgba(15,23,42,0.04)]'
            : 'bg-[#10121a] border-white/[0.05]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-[11px] font-semibold ${
                  isCourtside
                    ? 'border-black/[0.06] text-[#686D7B] bg-[#F6F5F1]'
                    : 'border-white/[0.05] text-zinc-400 bg-white/[0.02]'
                }`}
              >
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Head Coach / GM</th>
                <th className="py-3 px-4">Club</th>
                <th className="py-3 px-4 text-center">Trophies</th>
                <th className="py-3 px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y text-xs ${
                isCourtside ? 'divide-black/[0.05]' : 'divide-white/[0.04]'
              }`}
            >
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className={`py-14 text-center ${
                      isCourtside ? 'text-[#6E7381]' : 'text-zinc-400'
                    }`}
                  >
                    <i
                      aria-hidden="true"
                      className={`fas fa-circle-notch fa-spin text-xl mb-2 block ${
                        isCourtside ? 'text-[#DF642A]' : 'text-amber-400'
                      }`}
                    />
                    <span className="text-xs font-medium">
                      Loading global career rankings...
                    </span>
                  </td>
                </tr>
              ) : displayedEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className={`py-14 text-center ${
                      isCourtside ? 'text-[#6E7381]' : 'text-zinc-500'
                    }`}
                  >
                    <span
                      className={`font-semibold block text-sm ${
                        isCourtside ? 'text-[#14161D]' : 'text-zinc-300'
                      }`}
                    >
                      No matching career records found.
                    </span>
                    <span className="text-xs mt-1 max-w-sm mx-auto block leading-relaxed">
                      Complete seasons or finish your 35-year managerial tenure to post your official score to the worldwide Hall of Fame.
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

                  const isCurrentUser = Boolean(
                    state.managerName &&
                      managerName.trim().toLowerCase() === state.managerName.trim().toLowerCase()
                  );

                  return (
                    <tr
                      key={`rank-${idx}-${managerName}`}
                      className={`transition-colors ${
                        isCurrentUser
                          ? isCourtside
                            ? 'bg-[#FDF4EF]'
                            : 'bg-sky-500/[0.08]'
                          : isCourtside
                          ? 'hover:bg-[#F8F7F4]'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <td className="py-3 px-4 tabular-nums">
                        <span
                          className={`inline-flex w-7 h-7 rounded-full items-center justify-center font-bold text-xs ${
                            rank === 1
                              ? isCourtside
                                ? 'bg-[#18191F] text-white'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                              : rank <= 3
                              ? isCourtside
                                ? 'bg-[#F2EFE8] text-[#14161D]'
                                : 'bg-white/[0.08] text-zinc-200'
                              : isCourtside
                              ? 'text-[#686D7B]'
                              : 'text-zinc-400'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-4 font-semibold ${
                          isCourtside ? 'text-[#14161D]' : 'text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="truncate">{managerName}</span>
                          {isCurrentUser && (
                            <span
                              className={`text-[10px] font-semibold shrink-0 ${
                                isCourtside ? 'text-[#DF642A]' : 'text-sky-300'
                              }`}
                            >
                              · You
                            </span>
                          )}
                        </div>
                      </td>

                      <td
                        className={`py-3 px-4 ${
                          isCourtside ? 'text-[#525866]' : 'text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-medium truncate">{clubName}</span>
                          <span
                            className={`text-[11px] tabular-nums shrink-0 ${
                              isCourtside ? 'text-[#525866]' : 'text-zinc-500'
                            }`}
                          >
                            · Tier {tier}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center tabular-nums">
                        <span
                          className={`font-semibold ${
                            isCourtside ? 'text-[#14161D]' : 'text-zinc-200'
                          }`}
                        >
                          {trophyCount}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums">
                        <span
                          className={`font-extrabold text-sm ${
                            isCourtside ? 'text-[#14161D]' : 'text-amber-400'
                          }`}
                        >
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

      {/* Sister Sports Management Sims Network */}
      <div
        className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
          isCourtside
            ? 'bg-white border-black/[0.06]'
            : 'bg-[#10121a] border-white/[0.05]'
        }`}
      >
        <div>
          <span
            className={`text-xs font-bold block ${
              isCourtside ? 'text-[#14161D]' : 'text-white'
            }`}
          >
            Explore Our Sports Management Universe
          </span>
          <span
            className={`text-[11px] ${
              isCourtside ? 'text-[#6E7381]' : 'text-zinc-400'
            }`}
          >
            Build dynasties across European football pitches and pro basketball arenas.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="https://footballmanagersim.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3.5 py-2 rounded-full text-xs font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
              isCourtside
                ? 'bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08]'
            }`}
          >
            <span>Football Manager Sim</span>
            <i aria-hidden="true" className="fas fa-arrow-up-right-from-square text-[10px] opacity-70" />
          </a>
          <a
            href="https://basketballmanagersim.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3.5 py-2 rounded-full text-xs font-semibold transition inline-flex items-center gap-1.5 whitespace-nowrap ${
              isCourtside
                ? 'bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08]'
            }`}
          >
            <span>Basketball Manager Sim</span>
            <i aria-hidden="true" className="fas fa-arrow-up-right-from-square text-[10px] opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
};
