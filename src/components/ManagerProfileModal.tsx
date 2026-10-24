import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../types';
import { t } from '../data/translations';
import { ClubLogo } from './ClubLogo';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { LeaderboardView } from './LeaderboardView';
import { calculateLiveScore, getReconciledTrophies } from '../utils/leaderboard';
import { CountUp } from './CountUp';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { getLeagueInfo, getDomesticCupInfo } from '../data/gameConstants';
import { getActiveClubs } from '../utils/modManager';
import { ALL_CLUBS } from '../data/clubsData';
import { useModalDismiss } from '../utils/modalUtils';

interface ManagerProfileModalProps {
  state: GameState;
  lang: 'en' | 'de' | 'es';
  onClose: () => void;
  onOpenImpact?: () => void;
  initialTab?: 'card' | 'leaderboard' | 'progression' | 'clubs';
}

export const ManagerProfileModal: React.FC<ManagerProfileModalProps> = ({ state, lang, onClose, onOpenImpact, initialTab = 'card' }) => {
  useModalDismiss(onClose);
  const isDe = false; // Strictly English as requested by user
  const tr = (en: string, de?: string, _ignoredEs?: string) => t(lang, en, de);
  
  const [activeTab, setActiveTab] = useState<'card' | 'leaderboard' | 'progression' | 'clubs'>(initialTab);
  const seasons = state.history?.length || 0;
  const wins = state.totals?.wins || 0;
  const trophies = getReconciledTrophies(state);
  const winRate = state.totals?.matches > 0 ? Math.round((wins / state.totals.matches) * 100) : 0;
  const repScore = Math.min(100, Math.max(0, Math.round(state.reputation || 50)));
  const impactScore = Math.min(100, Math.max(0, Math.round(state.clubImpactScore || 50)));
  const liveScore = calculateLiveScore(state);

  // Prepare progression data (dynamically scales for custom 6+ tier databases)
  const progressionData = (state.history || []).map(h => ({
    year: h.year,
    tier: h.tier || 1,
    label: `Tier ${h.tier || 1}`,
    club: h.clubName
  }));
  const maxProgressionTier = Math.max(5, ...progressionData.map(d => d.tier || 1));
  const progressionTicks = Array.from({ length: maxProgressionTier }, (_, i) => i + 1);
  const activeModClubs = getActiveClubs();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-5 z-[10050] backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
      onClick={handleBackdropClick}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] w-full max-w-4xl rounded-2xl flex flex-col max-h-[92vh] shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-white/[0.04] relative overflow-hidden my-auto cursor-default"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/[0.04] bg-[#14151e] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                {state.managerName || 'Manager Profile'}
              </h2>
              <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                Profile
              </span>
            </div>
            <p className="text-zinc-400 font-normal text-xs mt-0.5">
              {Number.isInteger(seasons) ? seasons : seasons.toFixed(1)} seasons managed · {wins} wins · {trophies} trophies · <span className="text-amber-400 font-semibold tabular-nums">{liveScore.toLocaleString()} pts</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              aria-label="Close modal" 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.04] flex items-center justify-center transition text-zinc-400 hover:text-white cursor-pointer active:scale-95"
            >
              <i className="fas fa-xmark text-sm" />
            </button>
          </div>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div className="px-3 sm:px-6 pt-3 pb-2 shrink-0">
          <div className="bg-[#10121a] p-1 rounded-xl border border-white/[0.04] grid grid-cols-4 gap-1 w-full max-w-xl">
            <button 
              onClick={() => setActiveTab('card')}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activeTab === 'card' 
                  ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <i className="fas fa-id-card text-[11px] shrink-0" />
              <span className="truncate">Manager Card</span>
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activeTab === 'leaderboard' 
                  ? 'bg-amber-500/[0.05] text-amber-300 border border-amber-500/20 shadow-sm' 
                  : 'text-zinc-400 hover:text-amber-300 border border-transparent'
              }`}
            >
              <i className="fas fa-trophy text-[11px] text-amber-400 shrink-0" />
              <span className="truncate">Leaderboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('progression')}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activeTab === 'progression' 
                  ? 'bg-emerald-500/[0.05] text-emerald-300 border border-emerald-500/20 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <i className="fas fa-chart-line text-[11px] shrink-0" />
              <span className="truncate">Progression</span>
            </button>
            <button 
              onClick={() => setActiveTab('clubs')}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                activeTab === 'clubs' 
                  ? 'bg-purple-500/[0.05] text-purple-300 border border-purple-500/20 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <i className="fas fa-shield-halved text-[11px] shrink-0" />
              <span className="truncate">Clubs</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'card' && (
              <motion.div 
                key="card" 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                transition={{ duration: 0.15 }} 
                className="w-full flex justify-center py-2"
              >
                <div className="bg-[#10121a] w-full max-w-md rounded-2xl border border-white/[0.04] p-6 flex flex-col items-center relative overflow-hidden shadow-2xl">
                  {/* Spotlight */}
                  <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent pointer-events-none" />

                  {/* Header Tag */}
                  <div className="text-[10px] font-mono font-medium tracking-widest text-sky-400 uppercase mb-3 flex items-center gap-1.5 relative z-10">
                    <i className="fas fa-certificate" />
                    <span>{isDe ? 'OFFIZIELLES TRAINERPROFIL' : 'OFFICIAL MANAGER LICENSE'}</span>
                  </div>

                  {/* Manager Name */}
                  <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight uppercase mb-4 text-center relative z-10">
                    {state.managerName}
                  </h3>

                  {/* Club Logo & Name */}
                  <div className="relative z-10 flex flex-col items-center mb-5">
                    <ClubLogo 
                      name={state.club.name} 
                      color={state.club.color} 
                      logo={state.club.logo} 
                      fallbackLogo={state.club.fallbackLogo} 
                      className="w-16 h-16 rounded-2xl shadow-xl border border-white/10 mb-2" 
                    />
                    <div className="text-sm font-semibold text-white text-center">{state.club.name}</div>
                  </div>

                  {/* Rep & Impact Cards */}
                  <div className="grid grid-cols-2 gap-2.5 w-full mb-3.5 relative z-10">
                    <div 
                      onClick={onOpenImpact} 
                      className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] rounded-xl p-3 flex flex-col items-center text-center cursor-pointer transition"
                    >
                      <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                        {isDe ? 'Trainer-Rep' : 'Coach Rep'}
                      </span>
                      <span className="text-lg font-semibold text-sky-400 tabular-nums">{repScore}/100</span>
                    </div>

                    <div 
                      onClick={onOpenImpact} 
                      className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] rounded-xl p-3 flex flex-col items-center text-center cursor-pointer transition"
                    >
                      <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                        {isDe ? 'Club Impact' : 'Club Impact'}
                      </span>
                      <span className="text-lg font-semibold text-emerald-400 tabular-nums">{impactScore}/100</span>
                    </div>
                  </div>

                  {/* Live Career Highscore Banner */}
                  <div 
                    onClick={() => setActiveTab('leaderboard')}
                    className="w-full bg-amber-500/[0.04] border border-amber-500/20 hover:border-amber-400/35 rounded-xl p-3 mb-5 flex items-center justify-between cursor-pointer transition group relative z-10 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-400 flex items-center justify-center text-sm font-semibold shrink-0">
                        <i className="fas fa-trophy" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-amber-300 font-medium uppercase tracking-wider">
                          {isDe ? 'Karriere-Gesamtpunktzahl' : 'Live Career Score'}
                        </div>
                        <div className="text-lg font-semibold text-amber-400 tabular-nums">
                          <CountUp value={liveScore} formatValue={(v) => v.toLocaleString()} duration={900} />
                          <span className="text-xs font-medium text-amber-400/70 ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-300/80 group-hover:text-amber-200 flex items-center gap-1.5 shrink-0">
                      <span>{isDe ? 'Rangliste ansehen' : 'View Leaderboard'}</span>
                      <i className="fas fa-chevron-right text-[10px]" />
                    </span>
                  </div>

                  {/* Career Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t border-white/[0.06] text-center relative z-10">
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-medium">{isDe ? 'Saisons' : 'Seasons'}</div>
                      <div className="text-xl font-semibold text-white tabular-nums mt-0.5">{Number.isInteger(seasons) ? seasons : seasons.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-medium">{isDe ? 'Siege' : 'Wins'}</div>
                      <div className="text-xl font-semibold text-white tabular-nums mt-0.5">{wins}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-medium">{isDe ? 'Quote' : 'Win %'}</div>
                      <div className="text-xl font-semibold text-emerald-400 tabular-nums mt-0.5">{winRate}%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'leaderboard' && (
              <motion.div 
                key="leaderboard" 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                transition={{ duration: 0.15 }} 
                className="w-full"
              >
                <LeaderboardView 
                  state={state} 
                  lang={lang} 
                />
              </motion.div>
            )}

            {activeTab === 'progression' && (
              <motion.div 
                key="progression" 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                transition={{ duration: 0.15 }} 
                className="w-full"
              >
                <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-5 sm:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <i className="fas fa-chart-line text-sky-400" />
                      <span>League Tier Progression Over Time</span>
                    </h4>
                    <span className="text-xs text-zinc-400 tabular-nums">
                      {seasons} years
                    </span>
                  </div>

                  <div className="w-full h-[280px]">
                    {progressionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressionData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="year" stroke="rgba(255,255,255,0.2)" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickMargin={10} axisLine={false} />
                          <YAxis 
                            reversed={true} 
                            domain={[1, maxProgressionTier]} 
                            stroke="rgba(255,255,255,0.2)" 
                            tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 'bold' }} 
                            axisLine={false}
                            tickFormatter={(val) => `Tier ${val}`}
                            width={55}
                            ticks={progressionTicks}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0d0e14', borderColor: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px' }}
                            itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                            labelStyle={{ color: '#a1a1aa', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
                            formatter={(value: number, name: string, props: any) => [props.payload.club, props.payload.label]}
                            labelFormatter={(label) => `Season ${label}`}
                          />
                          <Line type="monotone" dataKey="tier" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: '#38bdf8', stroke: '#0d0e14', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                        {isDe ? 'Noch keine Saisondaten vorhanden.' : 'No seasonal progression data available yet.'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'clubs' && (
              <motion.div 
                key="clubs" 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }} 
                transition={{ duration: 0.15 }} 
                className="w-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {Array.from(new Set([
                    ...(state.history || []).map(h => h.clubName),
                    state.club.name
                  ])).filter(Boolean).map((clubName, cIdx) => {
                    const isCurrentClub = state.club.name === clubName;
                    const clubSeasons = (state.history || []).filter(h => h.clubName === clubName);
                    const clubWins = clubSeasons.reduce((acc, h) => acc + (h.wins || 0), 0);
                    const clubDraws = clubSeasons.reduce((acc, h) => acc + (h.draws || 0), 0);
                    const clubLosses = clubSeasons.reduce((acc, h) => acc + (h.losses || 0), 0);
                    const clubMatches = clubWins + clubDraws + clubLosses;
                    const clubWinRate = clubMatches > 0 ? Math.round((clubWins / clubMatches) * 100) : 0;
                    const clubPoints = (clubWins * 2) + clubDraws;
                    const latestSeason = clubSeasons.length > 0 ? clubSeasons[clubSeasons.length - 1] : null;

                    const normClubName = String(clubName || '').trim().toLowerCase();
                    const dbMatchClub = activeModClubs.find(c => c.name && c.name.trim().toLowerCase() === normClubName)
                      || ALL_CLUBS.find(c => c.name && c.name.trim().toLowerCase() === normClubName)
                      || (Object.values(state.worldClubs || {}).find((c: any) => c?.name && c.name.trim().toLowerCase() === normClubName) as any);

                    const clubCountry = latestSeason?.country || dbMatchClub?.country || (isCurrentClub ? (state.club.country || 'GER') : 'GER');
                    const cupNames = getContinentalCupNames(clubCountry);
                    const domCupInfo = getDomesticCupInfo(clubCountry, 1);
                    const leagueInfo = getLeagueInfo(1, clubCountry);

                    const clubYears = new Set(clubSeasons.map(h => h.year));
                    const clubTrophies = clubSeasons.reduce((acc, h) => {
                      if (h.trophiesThisYear) {
                        const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
                        const isChamp = h.pos === undefined || h.pos === 1;
                        acc.cwc = (acc.cwc || 0) + (h.trophiesThisYear.cwc || 0);
                        acc.cl = (acc.cl || 0) + (h.trophiesThisYear.cl || 0);
                        acc.el = (acc.el || 0) + (h.trophiesThisYear.el || 0);
                        acc.ecl = (acc.ecl || 0) + (h.trophiesThisYear.ecl || 0);
                        acc.bl = (acc.bl || 0) + ((!isLower && isChamp && h.trophiesThisYear.bl) ? (h.trophiesThisYear.bl || 1) : 0);
                        acc.lower = (acc.lower || 0) + (isChamp ? (h.trophiesThisYear.lower || 0) + (isLower ? (h.trophiesThisYear.bl || 0) : 0) : 0);
                        acc.dfb = (acc.dfb || 0) + (h.trophiesThisYear.dfb || 0);
                        acc.reg = (acc.reg || 0) + (h.trophiesThisYear.reg || 0);
                      }
                      return acc;
                    }, {} as any);

                    // Reconcile any custom/modded cup titles won in state.cupRunResults during this club's tenure
                    const countedDfbYears = new Set(clubSeasons.filter(h => h.trophiesThisYear?.dfb).map(h => h.year));
                    (state.cupRunResults || []).forEach(r => {
                      if (r.won && clubYears.has(r.year) && !['cwc', 'reg_cup', 'cl', 'el', 'ecl', 'euro_cup'].includes(r.id)) {
                        const rName = (r.nameEn || '').toLowerCase();
                        if (!rName.includes('regional') && !rName.includes('amateur') && !countedDfbYears.has(r.year)) {
                          countedDfbYears.add(r.year);
                          clubTrophies.dfb = (clubTrophies.dfb || 0) + 1;
                        }
                      }
                    });

                    const trophyList = [
                      { key: 'cwc', name: 'IHF Super Globe', count: clubTrophies.cwc || 0, icon: 'fa-globe', color: 'text-amber-400', border: 'border-amber-500/25 bg-amber-500/5' },
                      { key: 'cl', name: cupNames.cl, count: clubTrophies.cl || 0, icon: 'fa-trophy', color: 'text-amber-300', border: 'border-amber-400/25 bg-amber-400/5' },
                      { key: 'el', name: cupNames.el, count: clubTrophies.el || 0, icon: 'fa-trophy', color: 'text-orange-400', border: 'border-orange-500/25 bg-orange-500/5' },
                      { key: 'ecl', name: cupNames.ecl, count: clubTrophies.ecl || 0, icon: 'fa-trophy', color: 'text-emerald-400', border: 'border-emerald-500/25 bg-emerald-500/5' },
                      { key: 'bl', name: `${leagueInfo.name} Champions`, count: clubTrophies.bl || 0, icon: 'fa-medal', color: 'text-amber-300', border: 'border-amber-400/25 bg-amber-400/5' },
                      { key: 'lower', name: isDe ? 'Liga-Meister (Aufstieg)' : 'Division Champions', count: clubTrophies.lower || 0, icon: 'fa-award', color: 'text-sky-300', border: 'border-sky-500/25 bg-sky-500/5' },
                      { key: 'dfb', name: domCupInfo.name, count: clubTrophies.dfb || 0, icon: 'fa-shield-halved', color: 'text-amber-400', border: 'border-amber-500/25 bg-amber-500/5' },
                      { key: 'reg', name: isDe ? 'Regionalpokal' : 'Regional Cup', count: clubTrophies.reg || 0, icon: 'fa-shield-cat', color: 'text-amber-500', border: 'border-amber-600/25 bg-amber-600/5' },
                    ].filter(t => t.count > 0);

                    const totalTrophies = trophyList.reduce((sum, item) => sum + item.count, 0);

                    return (
                      <div key={`club-${clubName}-${cIdx}`} className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
                        <div>
                          {/* Club Header */}
                          <div className="flex items-center justify-between gap-3 mb-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <ClubLogo 
                                name={clubName} 
                                color={latestSeason?.color || dbMatchClub?.color || (isCurrentClub ? state.club.color : undefined)} 
                                logo={latestSeason?.logo || dbMatchClub?.logo || (isCurrentClub ? state.club.logo : undefined)} 
                                fallbackLogo={dbMatchClub?.fallbackLogo || (clubName as string).substring(0, 2).toUpperCase()} 
                                className="w-11 h-11 rounded-xl shrink-0" 
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-white text-base truncate">{clubName}</span>
                                  {isCurrentClub && (
                                    <span className="text-[9px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20 px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wider">
                                      {isDe ? 'Aktuell' : 'Current'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-400 font-normal">
                                  {clubSeasons.length} {clubSeasons.length === 1 ? (isDe ? 'Saison' : 'season') : (isDe ? 'Saisons' : 'seasons')}
                                  {clubMatches > 0 && ` · ${clubPoints} ${isDe ? 'Pkt' : 'pts'}`}
                                </div>
                              </div>
                            </div>

                            {/* Total Silverware Badge */}
                            <div className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 border ${
                              totalTrophies > 0 
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 shadow-sm' 
                                : 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
                            }`}>
                              <span>🏆</span>
                              <span>{totalTrophies} {totalTrophies === 1 ? (isDe ? 'Titel' : 'Trophy') : (isDe ? 'Titel' : 'Trophies')}</span>
                            </div>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-4 gap-1.5 bg-black/35 rounded-xl p-2.5 border border-white/5 text-center mb-3">
                            <div>
                              <div className="text-[9px] text-zinc-400 font-medium uppercase">{isDe ? 'Siege' : 'Wins'}</div>
                              <div className="text-xs sm:text-sm font-semibold text-emerald-400 tabular-nums">{clubWins}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-zinc-400 font-medium uppercase">{isDe ? 'Remis' : 'Draws'}</div>
                              <div className="text-xs sm:text-sm font-semibold text-zinc-300 tabular-nums">{clubDraws}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-zinc-400 font-medium uppercase">{isDe ? 'Niederl.' : 'Losses'}</div>
                              <div className="text-xs sm:text-sm font-semibold text-rose-400 tabular-nums">{clubLosses}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-zinc-400 font-medium uppercase">{isDe ? 'Quote' : 'Win %'}</div>
                              <div className="text-xs sm:text-sm font-semibold text-sky-400 tabular-nums">{clubWinRate}%</div>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Trophy Cabinet with Quantities */}
                        <div className="pt-2 border-t border-white/[0.06]">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                              <i className="fas fa-trophy text-[9px]" />
                              <span>{isDe ? 'Trophäenschrank' : 'Trophy Cabinet'}</span>
                            </span>
                            <span className="text-[10px] font-normal text-zinc-400">
                              {totalTrophies} {isDe ? 'Gewonnen' : 'Won'}
                            </span>
                          </div>

                          {totalTrophies > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {trophyList.map((item) => (
                                <div 
                                  key={item.key} 
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl border ${item.border} shadow-sm`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                                      <i className={`fas ${item.icon} ${item.color} text-xs`} />
                                    </div>
                                    <span className="text-xs font-semibold text-zinc-200 truncate" title={item.name}>
                                      {item.name}
                                    </span>
                                  </div>
                                  <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold text-[11px] px-2 py-0.5 rounded-full tabular-nums shrink-0">
                                    x{item.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl py-3 px-4 text-center flex items-center justify-center gap-2 text-zinc-500 text-xs italic">
                              <i className="fas fa-trophy opacity-25 text-xs" />
                              <span>{isDe ? 'Noch keine Vereinstitel errungen' : 'No silverware won with this club yet'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
