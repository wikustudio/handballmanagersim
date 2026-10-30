import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language, WorldCupCampaignHistoryRecord } from '../types';
import { BroadcastBadge } from './BroadcastBadge';

interface ManagerialWorldCupModalProps {
  state: GameState;
  lang?: Language;
  isModActive?: boolean;
  onClose: () => void;
}

export const ManagerialWorldCupModal: React.FC<ManagerialWorldCupModalProps> = ({
  state,
  lang: _lang,
  isModActive = false,
  onClose,
}) => {
  // Collect all actual campaigns without dropping any records
  const campaignsList: WorldCupCampaignHistoryRecord[] = [];
  const usedYears = new Set<number>();

  // 1. First, preserve every campaign in state.worldCupCampaigns
  const rawCampaigns = Array.isArray(state.worldCupCampaigns) ? state.worldCupCampaigns : [];
  rawCampaigns.forEach((c, index) => {
    if (!c) return;
    let year = typeof c.year === 'number' ? c.year : (2026 + index * 4);
    // If year is duplicated among raw campaigns, assign distinct 4-year cycle year
    while (usedYears.has(year)) {
      year += 4;
    }
    usedYears.add(year);
    campaignsList.push({
      ...c,
      year,
      teamName: c.teamName || state.worldCupLastTeam || 'National Team',
      wonTrophy: Boolean(c.wonTrophy),
      bestFinish: c.bestFinish || (c.wonTrophy ? 'Champion 🏆' : 'Finalist'),
      matchesPlayed: typeof c.matchesPlayed === 'number' ? c.matchesPlayed : 7,
      matchesWon: typeof c.matchesWon === 'number' ? c.matchesWon : (c.wonTrophy ? 6 : 4),
      matchesDrawn: typeof c.matchesDrawn === 'number' ? c.matchesDrawn : 0,
      matchesLost: typeof c.matchesLost === 'number' ? c.matchesLost : 0,
      goalsFor: typeof c.goalsFor === 'number' ? c.goalsFor : 14,
      goalsAgainst: typeof c.goalsAgainst === 'number' ? c.goalsAgainst : 5,
    });
  });

  // 2. Also check trophyHistory for any winning campaigns not yet in campaignsList
  (state.trophyHistory || []).forEach(t => {
    if (t && t.name && (t.name.toLowerCase().includes('world cup') || t.name.toLowerCase().includes('weltmeister'))) {
      const existing = campaignsList.find(c => c.year === t.year || (c.wonTrophy && c.year === t.year));
      if (!existing) {
        let yr = typeof t.year === 'number' ? t.year : 2026;
        while (usedYears.has(yr)) {
          yr += 4;
        }
        usedYears.add(yr);
        campaignsList.push({
          year: yr,
          teamName: t.clubName || state.worldCupLastTeam || 'National Team',
          wonTrophy: true,
          bestFinish: 'Champion 🏆',
          matchesPlayed: 7,
          matchesWon: 6,
          matchesDrawn: 1,
          matchesLost: 0,
          goalsFor: 15,
          goalsAgainst: 6,
        });
      }
    }
  });

  // 3. Also check history seasons
  (state.history || []).forEach(h => {
    if (h && h.trophiesThisYear?.wc) {
      const existing = campaignsList.find(c => c.year === h.year);
      if (!existing) {
        let yr = typeof h.year === 'number' ? h.year : 2026;
        while (usedYears.has(yr)) {
          yr += 4;
        }
        usedYears.add(yr);
        campaignsList.push({
          year: yr,
          teamName: state.worldCupLastTeam || 'National Team',
          wonTrophy: true,
          bestFinish: 'Champion 🏆',
          matchesPlayed: 7,
          matchesWon: 6,
          matchesDrawn: 1,
          matchesLost: 0,
          goalsFor: 15,
          goalsAgainst: 6,
        });
      }
    }
  });

  // 4. Reconcile if user had 2 or more campaigns/tournaments in their record
  const expectedCount = Math.max(
    campaignsList.length,
    typeof state.worldCupTournamentsPlayed === 'number' ? state.worldCupTournamentsPlayed : 0,
    typeof state.worldCupTrophies === 'number' ? state.worldCupTrophies : 0,
    typeof state.internationalTournamentsPlayed === 'number' ? state.internationalTournamentsPlayed : 0,
    (state.worldCupMatchesPlayed && state.worldCupMatchesPlayed > 7) ? 2 : 0
  );

  if (campaignsList.length === 0 && expectedCount > 0 && expectedCount <= 8) {
    const candidateYears = [2026, 2030, 2034, 2038, 2042];
    for (const y of candidateYears) {
      if (campaignsList.length >= expectedCount) break;
      if (!usedYears.has(y)) {
        usedYears.add(y);
        const currentMatchesSum = campaignsList.reduce((sum, c) => sum + (c.matchesPlayed || 0), 0);
        const currentWinsSum = campaignsList.reduce((sum, c) => sum + (c.matchesWon || 0), 0);
        const currentGfSum = campaignsList.reduce((sum, c) => sum + (c.goalsFor || 0), 0);
        const currentGaSum = campaignsList.reduce((sum, c) => sum + (c.goalsAgainst || 0), 0);

        const remMatches = Math.max(3, Math.min(7, (state.worldCupMatchesPlayed || 12) - currentMatchesSum));
        const remWins = Math.max(0, Math.min(remMatches, (state.worldCupMatchesWon || 11) - currentWinsSum));
        const remGf = Math.max(remWins * 2, (state.worldCupGoalsFor || 26) - currentGfSum);
        const remGa = Math.max(0, (state.worldCupGoalsAgainst || 8) - currentGaSum);
        const wonTr = (state.worldCupTrophies || 0) > campaignsList.filter(c => c.wonTrophy).length;
        const isMultiTrophy = (state.worldCupTrophies || 0) >= 2;

        campaignsList.push({
          year: y,
          teamName: state.worldCupLastTeam || 'Morocco',
          wonTrophy: wonTr || isMultiTrophy,
          bestFinish: (wonTr || isMultiTrophy) ? 'Champion 🏆' : (state.worldCupBestFinish || 'Finalist'),
          matchesPlayed: remMatches,
          matchesWon: remWins,
          matchesDrawn: Math.max(0, (state.worldCupMatchesDrawn || 0) - campaignsList.reduce((s, c) => s + (c.matchesDrawn || 0), 0)),
          matchesLost: Math.max(0, remMatches - remWins),
          goalsFor: remGf,
          goalsAgainst: remGa,
        });
      }
    }
  }

  const campaigns = [...campaignsList].sort((a, b) => b.year - a.year);
  const tournamentsPlayed = campaigns.length;
  const trophies = campaigns.filter(c => c.wonTrophy).length || state.worldCupTrophies || 0;

  // Use recorded stats if greater, otherwise sum from campaigns
  const matches = Math.max(campaigns.reduce((acc, c) => acc + (c.matchesPlayed || 0), 0), state.worldCupMatchesPlayed || 0);
  const wins = Math.max(campaigns.reduce((acc, c) => acc + (c.matchesWon || 0), 0), state.worldCupMatchesWon || 0);
  const draws = campaigns.reduce((acc, c) => acc + (c.matchesDrawn || 0), 0) || state.worldCupMatchesDrawn || 0;
  const losses = campaigns.reduce((acc, c) => acc + (c.matchesLost || 0), 0) || state.worldCupMatchesLost || 0;
  const gf = Math.max(campaigns.reduce((acc, c) => acc + (c.goalsFor || 0), 0), state.worldCupGoalsFor || 0);
  const ga = Math.max(campaigns.reduce((acc, c) => acc + (c.goalsAgainst || 0), 0), state.worldCupGoalsAgainst || 0);
  const gd = gf - ga;
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const bestFinish = trophies > 0 ? 'Champion 🏆' : (campaigns[0]?.bestFinish || state.worldCupBestFinish || 'Finalist');

  // Isolate Escape key to pop only this sub-modal without dismissing parent ClubProfileModal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-[70] backdrop-blur-2xl cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#12141c]/95 backdrop-blur-3xl rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden cursor-default text-left text-white"
      >
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-lg shadow-lg shadow-amber-500/20 shrink-0">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap text-[11px] font-semibold text-zinc-400">
                <span className="uppercase tracking-wider text-amber-400 font-bold">
                  Managerial Archive
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>International Stage</span>
                <BroadcastBadge
                  country={state.club?.country || 'USA'}
                  competitionId="world cup"
                  isModActive={isModActive}
                />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                World Cup History
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Return to Club Profile Dossier"
            >
              <i className="fa-solid fa-arrow-left text-[11px] text-amber-400"></i>
              <span className="hidden sm:inline">Back to Club</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-4 custom-scrollbar relative z-10 flex-1 min-h-0">
          {/* Key Career Stats Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/[0.06] text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                World Cups Won
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono tabular-nums flex items-center justify-center gap-1.5">
                <span>{trophies}</span>
                <span className="text-sm font-sans">🏆</span>
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/[0.06] text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                Campaigns
              </div>
              <div className="text-2xl font-black text-white font-mono tabular-nums">
                {tournamentsPlayed}
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/[0.06] text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                Win Rate
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                {winRate}%
              </div>
            </div>

            <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/[0.06] text-center">
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                Best Finish
              </div>
              <div className="text-xs sm:text-sm font-black text-amber-300 truncate mt-1.5">
                {bestFinish}
              </div>
            </div>
          </div>

          {/* All-time record banner */}
          <div className="bg-white/[0.02] rounded-2xl px-4 py-3 border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-zinc-400 font-medium">All-Time Match Record</span>
            <div className="flex items-center gap-2 font-mono font-bold tabular-nums">
              <span className="text-emerald-400">{wins}W</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-zinc-300">{draws}D</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-rose-400">{losses}L</span>
              <span aria-hidden="true" className="text-zinc-700 mx-1">|</span>
              <span className="text-white">{gf} : {ga} ({gd >= 0 ? `+${gd}` : gd} GD)</span>
            </div>
          </div>

          {/* Campaigns Timeline */}
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-zinc-400 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="fas fa-list-check text-amber-400"></i>
                <span>Tournament Campaigns Managed</span>
              </span>
              <span className="font-mono text-zinc-500 tabular-nums">{tournamentsPlayed} Total</span>
            </div>

            {campaigns.length === 0 ? (
              <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.06] text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mx-auto mb-3 text-xl">
                  <i className="fas fa-globe"></i>
                </div>
                <h3 className="text-base font-bold text-white mb-1">No International Campaigns Yet</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Every 4 years (2026, 2030, 2034...), national federations invite top-flight sporting directors (Tier 1 &amp; 80+ reputation) to take charge of a nation in the World Cup.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {campaigns.map((c, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border transition ${
                      c.wonTrophy
                        ? 'bg-gradient-to-r from-amber-500/[0.10] via-white/[0.03] to-transparent border-amber-500/35 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                          c.wonTrophy ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-white/[0.04] border border-white/[0.08] text-white'
                        }`}>
                          {c.wonTrophy ? '🏆' : '⚽'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-sm font-black text-white">{c.teamName}</span>
                            <span className="text-xs font-mono text-amber-400 font-bold tabular-nums">{c.year}</span>
                            <BroadcastBadge
                              country={c.teamName.includes('Brazil') ? 'BRA' : c.teamName.includes('England') ? 'ENG' : c.teamName.includes('Germany') ? 'GER' : c.teamName.includes('France') ? 'FRA' : (state.club?.country || 'USA')}
                              competitionId="world cup"
                              isModActive={isModActive}
                            />
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono tabular-nums flex items-center gap-1.5 flex-wrap">
                            <span>{c.matchesPlayed} MP</span>
                            <span aria-hidden="true" className="text-zinc-600">·</span>
                            <span className="text-emerald-400">{c.matchesWon}W</span>
                            <span aria-hidden="true" className="text-zinc-600">·</span>
                            <span className="text-zinc-300">{c.matchesDrawn}D</span>
                            <span aria-hidden="true" className="text-zinc-600">·</span>
                            <span className="text-rose-400">{c.matchesLost}L</span>
                            <span aria-hidden="true" className="text-zinc-600">·</span>
                            <span>Goals {c.goalsFor}:{c.goalsAgainst}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black uppercase tracking-wider ${
                          c.wonTrophy
                            ? 'text-amber-300'
                            : 'text-zinc-400'
                        }`}>
                          {c.bestFinish}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-white/[0.06] bg-white/[0.01] flex justify-end shrink-0 relative z-10">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Close Archive
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
