import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Club, GameState, Language } from '../types';
import { calculateClubReputation, COUNTRIES, getLeagueInfo, getMaxTier, isCanadianMLSClub } from '../data/gameConstants';
import { ALL_CLUBS } from '../data/clubsData';
import { ClubLogo } from './ClubLogo';
import { calculateClubLeagueHistory, isTopOvrClub } from '../engine/clubProgressionEngine';

interface ClubProfileModalProps {
  state: GameState;
  lang: Language;
  clubsDb?: Club[];
  isModActive?: boolean;
  onClose: () => void;
  onOpenWorldCupHistory?: () => void;
  onSelectIdentity?: (identity: 'balanced' | 'wonderkid' | 'galactico' | 'moneyball' | 'heritage') => void;
}

const getReputationTier = (rep: number, isDe: boolean) => {
  if (rep >= 90) return { title: isDe ? 'Weltklasse' : 'World Class', desc: isDe ? 'Globales Flaggschiff des Weltfussballs mit uneingeschränkter Strahlkraft.' : 'Global flagship in world football with unquestioned market pull.' };
  if (rep >= 80) return { title: isDe ? 'Internationales Schwergewicht' : 'Global Powerhouse', desc: isDe ? 'Kontinental gefürchtet mit regelmässigen Titelfavoriten-Ambitionen.' : 'Continentally feared contender with perennial title aspirations.' };
  if (rep >= 70) return { title: isDe ? 'Kontinentale Kraft' : 'Continental Force', desc: isDe ? 'Fester Bestandteil europäischer Wettbewerbe und Top-Talentschmiede.' : 'Staple of continental tournaments and destination for high-tier talent.' };
  if (rep >= 60) return { title: isDe ? 'Nationale Grösse' : 'National Power', desc: isDe ? 'Etablierte Kraft im Spitzenfussball mit stolzer Tradition.' : 'Established force in elite domestic football with proud tradition.' };
  if (rep >= 50) return { title: isDe ? 'Etablierter Proficlub' : 'Established Pro Club', desc: isDe ? 'Solider Profibetrieb mit treuer Anhängerschaft und stabiler Basis.' : 'Solid professional outfit with loyal following and stable foundation.' };
  if (rep >= 40) return { title: isDe ? 'Aufstrebender Herausforderer' : 'Emerging Contender', desc: isDe ? 'Ambitionierter Klub mit Ambitionen auf höhere Spielklassen.' : 'Ambitious outfit actively knocking on the door of the top flights.' };
  if (rep >= 30) return { title: isDe ? 'Regionaler Traditionsverein' : 'Regional Traditionalist', desc: isDe ? 'Feste regionale Verankerung mit hungriger Fanbasis.' : 'Deep regional roots with a dedicated, passionate grassroots community.' };
  if (rep >= 20) return { title: isDe ? 'Aufstrebender Halbprofi' : 'Rising Semi-Pro', desc: isDe ? 'Aufbauphase im semi-professionellen Ligensystem.' : 'Building competitive infrastructure within the semi-pro divisions.' };
  return { title: isDe ? 'Amateurverein' : 'Amateur Club', desc: isDe ? 'Lokale Graswurzel-Gemeinschaft mit ehrlichem Fussballherz.' : 'Local grassroots community driven by pure football passion.' };
};

export const ClubProfileModal: React.FC<ClubProfileModalProps> = ({ state, lang, clubsDb, isModActive: isModActiveProp, onClose, onOpenWorldCupHistory, onSelectIdentity }) => {
  const isDe = lang === 'de';
  const [activeTab, setActiveTab] = useState<'league' | 'dossier'>('league');
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number | null>(null);
  const [activeIdentity, setActiveIdentity] = useState<'balanced' | 'wonderkid' | 'galactico' | 'moneyball' | 'heritage'>(
    state.clubIdentity || 'balanced'
  );
  const [currentDp, setCurrentDp] = useState<number>(state.skillPoints || 0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIdentity(state.clubIdentity || 'balanced');
    setCurrentDp(state.skillPoints || 0);
  }, [state.clubIdentity, state.skillPoints]);

  const handleTabChange = (tab: 'league' | 'dossier') => {
    setActiveTab(tab);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Dynamically resolve live club data, respecting active mod database
  const isModActive = isModActiveProp !== undefined 
    ? isModActiveProp 
    : (typeof window !== 'undefined' && localStorage.getItem('fms_real_mod_active') === 'true');

  const defaultClub = ALL_CLUBS.find(c => c.id === state.club.id || String(c.id) === String(state.club.id));
  const liveDbClub = isModActive 
    ? (clubsDb?.find(c => c.id === state.club.id || String(c.id) === String(state.club.id)) || 
       clubsDb?.find(c => c.name.toLowerCase().trim() === state.club.name.toLowerCase().trim()) ||
       defaultClub)
    : defaultClub;

  const resolvedClub = liveDbClub || state.club;
  const clubName = isModActive ? (liveDbClub?.name || state.club.name) : (defaultClub?.name || state.club.name);
  const clubLogo = isModActive ? (liveDbClub?.logo || state.club.logo) : undefined;
  const clubFallbackLogo = isModActive ? (liveDbClub?.fallbackLogo || state.club.fallbackLogo) : undefined;
  const clubColor = state.club.color || (isModActive ? liveDbClub?.color : defaultClub?.color) || '1d4ed8';
  const clubCountry = state.club.country || (isModActive ? liveDbClub?.country : defaultClub?.country) || 'GER';
  const hexColor = clubColor.startsWith('#') ? clubColor : `#${clubColor}`;

  const safeBaseOvr = typeof state.club.baseOvr === 'number' && !Number.isNaN(state.club.baseOvr) ? state.club.baseOvr : 65;
  const clubRep = Math.min(100, Math.max(1, calculateClubReputation(safeBaseOvr, state.club.tier)));
  const tierInfo = getReputationTier(clubRep, isDe);

  const countryInfo = COUNTRIES[clubCountry];
  const leagueInfo = getLeagueInfo(state.club.tier, clubCountry);
  const narrative = isModActive 
    ? (liveDbClub?.historicContext || liveDbClub?.narrative || state.club.historicContext || state.club.narrative)
    : undefined;

  // Calculate or retrieve dynamic league development history
  const leagueHistory = useMemo(() => {
    return calculateClubLeagueHistory(
      resolvedClub,
      state.startYear || 2026,
      state.year || 2026,
      state.history,
      state.clubLeagueHistories,
      state.universeMovements
    );
  }, [resolvedClub, state.startYear, state.year, state.history, state.clubLeagueHistories, state.universeMovements]);

  const { minHistoryTier, maxHistoryTier } = useMemo(() => {
    const tiers = leagueHistory.map((r) => r.tier || 1);
    return {
      minHistoryTier: tiers.length > 0 ? Math.min(...tiers) : 1,
      maxHistoryTier: tiers.length > 0 ? Math.max(...tiers) : 1,
    };
  }, [leagueHistory]);

  const isStableGiant = isTopOvrClub(resolvedClub);

  // Format large numbers cleanly
  const formatFanbase = (fans?: number) => {
    if (!fans) return isDe ? 'Lokal' : 'Local';
    if (fans >= 1_000_000) return `${(fans / 1_000_000).toFixed(1)}M`;
    if (fans >= 1_000) return `${(fans / 1_000).toFixed(0)}K`;
    return fans.toLocaleString();
  };

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clubRep / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-2xl overflow-y-auto overscroll-contain"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#12141c]/95 text-white w-full max-w-xl rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden relative z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto backdrop-blur-3xl shrink-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Club Accent Ambient Glow */}
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 transition-opacity"
          style={{ backgroundColor: hexColor }}
        />

        {/* Boardroom Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/[0.08] flex items-start justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {/* Club Crest with glowing plate */}
            <div className="relative shrink-0 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-2.5 shadow-xl overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none blur-sm"
                style={{ backgroundColor: hexColor }}
              />
              <ClubLogo
                name={clubName}
                id={state.club.id}
                color={clubColor}
                logo={clubLogo}
                fallbackLogo={clubFallbackLogo}
                isModActive={isModActive}
                className="w-full h-full object-contain drop-shadow-md relative z-10"
                fallbackClassName="w-full h-full rounded-xl flex items-center justify-center font-black text-white text-xl"
              />
            </div>

            {/* Club Title & Unboxed Metadata */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-sky-400 uppercase">
                <span>{leagueInfo?.name || `Tier ${state.club.tier}`}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-300">
                  {isCanadianMLSClub(clubName, state.club.id, clubCountry) 
                    ? 'Canada 🇨🇦 (MLS)' 
                    : `${countryInfo?.name || clubCountry} ${countryInfo?.flag || '🇩🇪'}`}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words leading-tight mt-0.5">
                {clubName}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">{tierInfo.title}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{isDe ? 'Vereins-Dossier & Historie' : 'Boardroom Dossier & Trajectory'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label={isDe ? 'Schliessen' : 'Close'}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition shrink-0 ml-2 cursor-pointer active:scale-95"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Apple-inspired Segmented Tab Control */}
        <div className="px-6 pt-3 pb-1 shrink-0">
          <div className="bg-white/[0.04] p-1 rounded-2xl border border-white/[0.06] flex gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('league')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'league'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <i className="fa-solid fa-chart-line text-[11px]"></i>
              <span>{isDe ? 'Liga-Entwicklung' : 'League Development'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-zinc-300 font-mono">
                {leagueHistory.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('dossier')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'dossier'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <i className="fa-solid fa-shield-halved text-[11px]"></i>
              <span>{isDe ? 'Ansehen & Vision' : 'Prestige & Vision'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Body */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 custom-scrollbar">
          {activeTab === 'league' ? (
            /* ================= LEAGUE FINISHES LINE CHART VIEW ================= */
            <div className="space-y-4">
              {/* League Trajectory Overview Capsule */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {isDe ? 'Liga-Entwicklung & Platzierungen' : 'League Development & Finishes'}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                      <span>{isStableGiant ? (isDe ? 'Stabiler Spitzenverein' : 'Stable Elite Powerhouse') : (isDe ? 'Dynamischer Ligawettbewerber' : 'Dynamic Division Contender')}</span>
                      {isStableGiant ? (
                        <span className="text-[10px] font-medium text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25">
                          {isDe ? 'Konstant Top 4' : 'Consistent Top 4'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/25">
                          {minHistoryTier === maxHistoryTier
                            ? `Tier ${minHistoryTier}`
                            : isDe
                            ? `Tier ${maxHistoryTier} ➔ Tier ${minHistoryTier} Aufstieg`
                            : `Tier ${maxHistoryTier} ➔ Tier ${minHistoryTier} Climb`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400 text-sm shrink-0">
                    <i className="fa-solid fa-chart-line"></i>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-white/[0.06] text-center">
                  <div className="p-2 rounded-xl bg-white/[0.02]">
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                      {isDe ? 'Aktuelle Liga' : 'Current Tier'}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 font-mono">
                      Tier {state.club.tier}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.02]">
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                      {isDe ? 'Beste Platzierung' : 'Peak Finish'}
                    </div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5 font-mono">
                      #{Math.min(...leagueHistory.map(r => r.position))} {Math.min(...leagueHistory.map(r => r.position)) === 1 ? '🏆' : ''}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.02]">
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                      {isDe ? 'Erfasste Jahre' : 'Seasons'}
                    </div>
                    <div className="text-sm font-bold text-sky-400 mt-0.5 font-mono">
                      {leagueHistory.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Apple-style Interactive Line Chart Card */}
              {(() => {
                const activeIdx = selectedSeasonIdx !== null && selectedSeasonIdx < leagueHistory.length
                  ? selectedSeasonIdx
                  : leagueHistory.length - 1;
                const activeRecord = leagueHistory[activeIdx] || leagueHistory[leagueHistory.length - 1];
                
                const tiers = leagueHistory.map((r) => r.tier || 1);
                const minTier = tiers.length > 0 ? Math.min(...tiers) : 1;
                const maxTier = tiers.length > 0 ? Math.max(...tiers) : 1;
                const tierCount = Math.max(1, maxTier - minTier + 1);
                const hasLowerTier = tierCount > 1;

                const paddingLeft = 52;
                const paddingRight = 24;
                const chartTop = 24;
                const chartBottom = 196;
                const totalHeight = chartBottom - chartTop;
                const width = 460 - paddingLeft - paddingRight;

                const bandHeight = totalHeight / tierCount;
                const bandTopPad = tierCount > 4 ? 2 : 4;
                const bandBottomPad = tierCount > 4 ? 3 : 6;
                const usableBandHeight = Math.max(6, bandHeight - bandTopPad - bandBottomPad);

                const maxPosInHistory = Math.max(18, ...leagueHistory.map((r) => Number(r.position) || 1));
                const posDivisor = Math.max(1, maxPosInHistory - 1);

                const getY = (pos: number, tier: number = minTier) => {
                  const safeTier = tier || minTier;
                  const clampedPos = Math.min(maxPosInHistory, Math.max(1, pos));
                  if (tierCount === 1) {
                    return chartTop + ((clampedPos - 1) / posDivisor) * totalHeight;
                  }
                  const tierIdx = Math.max(0, Math.min(tierCount - 1, safeTier - minTier));
                  const bandTop = chartTop + tierIdx * bandHeight + bandTopPad;
                  return bandTop + ((clampedPos - 1) / posDivisor) * usableBandHeight;
                };

                const getX = (idx: number) => {
                  if (leagueHistory.length <= 1) return paddingLeft + width / 2;
                  return paddingLeft + (idx / (leagueHistory.length - 1)) * width;
                };

                const points = leagueHistory.map((d, i) => ({
                  x: getX(i),
                  y: getY(d.position, d.tier || minTier),
                  d,
                  idx: i
                }));

                const linePath = points.length > 1
                  ? points.reduce((acc, pt, i) => {
                      if (i === 0) return `M ${pt.x},${pt.y}`;
                      const prev = points[i - 1];
                      const cx = (prev.x + pt.x) / 2;
                      return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
                    }, '')
                  : '';

                const areaBottomY = hasLowerTier ? 204 : chartBottom + 4;
                const areaPath = points.length > 1
                  ? `${linePath} L ${points[points.length - 1].x},${areaBottomY} L ${points[0].x},${areaBottomY} Z`
                  : '';

                const activeTiersInHistory = Array.from(new Set(leagueHistory.map((r) => Number(r.tier) || 1))).sort((a: number, b: number) => a - b);

                const gridLines = (() => {
                  if (tierCount === 1) {
                    return minTier === 1 ? [
                      { label: '1st', pos: 1, tier: 1, color: 'text-amber-400/80', border: 'stroke-amber-400/25' },
                      { label: '4th', pos: 4, tier: 1, color: 'text-sky-400/80', border: 'stroke-sky-400/20' },
                      { label: '10th', pos: 10, tier: 1, color: 'text-zinc-500', border: 'stroke-white/[0.08]' },
                      { label: '16th', pos: 16, tier: 1, color: 'text-rose-500/80', border: 'stroke-rose-500/25' },
                    ] : [
                      { label: `T${minTier} 1st`, pos: 1, tier: minTier, color: 'text-emerald-400 font-bold', border: 'stroke-emerald-400/30' },
                      { label: `T${minTier} 5th`, pos: 5, tier: minTier, color: 'text-zinc-500', border: 'stroke-white/[0.06]' },
                      { label: `T${minTier} 10th`, pos: 10, tier: minTier, color: 'text-zinc-600', border: 'stroke-white/[0.04]' },
                    ];
                  }

                  if (tierCount === 2) {
                    return [
                      { label: `T${minTier} 1st`, pos: 1, tier: minTier, color: minTier === 1 ? 'text-amber-400/80' : 'text-emerald-400 font-bold', border: 'stroke-amber-400/25' },
                      { label: `T${minTier} 4th`, pos: 4, tier: minTier, color: 'text-sky-400/80', border: 'stroke-sky-400/20' },
                      { label: `T${minTier} 10th`, pos: 10, tier: minTier, color: 'text-zinc-500', border: 'stroke-white/[0.08]' },
                      { label: `T${minTier} 16th`, pos: 16, tier: minTier, color: 'text-rose-500/80', border: 'stroke-rose-500/25' },
                      { label: `T${maxTier} 1st`, pos: 1, tier: maxTier, color: 'text-emerald-400 font-bold', border: 'stroke-emerald-400/30' },
                      { label: `T${maxTier} 5th`, pos: 5, tier: maxTier, color: 'text-zinc-500', border: 'stroke-white/[0.06]' },
                      { label: `T${maxTier} 10th`, pos: 10, tier: maxTier, color: 'text-zinc-600', border: 'stroke-white/[0.04]' },
                    ];
                  }

                  // 3 or more tiers (e.g. up to Tier 11 in Germany)
                  const lines: { label: string; pos: number; tier: number; color: string; border: string }[] = [];
                  for (let t = minTier; t <= maxTier; t++) {
                    const isTopFlight = t === 1;
                    const isPresent = activeTiersInHistory.includes(t);
                    if (tierCount > 6 && !isPresent && t !== minTier && t !== maxTier) {
                      continue; // Avoid crowding in deep pyramids by focusing on active tiers
                    }
                    const league = getLeagueInfo(t, clubCountry);
                    const tag = league?.tag || `T${t}`;
                    lines.push({
                      label: `${tag} 1st`,
                      pos: 1,
                      tier: t,
                      color: isTopFlight ? 'text-amber-400/80' : 'text-emerald-400/90 font-bold',
                      border: isTopFlight ? 'stroke-amber-400/25' : 'stroke-emerald-400/20',
                    });
                    if (isTopFlight && tierCount <= 5) {
                      lines.push({
                        label: `${tag} 4th`,
                        pos: 4,
                        tier: t,
                        color: 'text-sky-400/70',
                        border: 'stroke-sky-400/15',
                      });
                    }
                  }
                  return lines;
                })();

                const isJapan = clubCountry === 'JPN' || clubCountry.toUpperCase() === 'JAPAN';
                const maxAllowedTier = isJapan ? 2 : getMaxTier(clubCountry, clubsDb);
                const safeTier = Math.min(maxAllowedTier, Math.max(1, activeRecord?.tier || 1));
                const rawLeagueName = activeRecord?.leagueName || '';
                const safeLeagueName = (isJapan && (activeRecord?.tier > 2 || rawLeagueName.includes('Division 3')))
                  ? 'J2 League'
                  : (rawLeagueName || `Tier ${safeTier}`);

                const isChamp = activeRecord?.position === 1;
                const isPromoRecord = !isChamp && safeTier > 1 && (
                  (activeIdx < leagueHistory.length - 1 && (leagueHistory[activeIdx + 1].tier || 1) < safeTier) ||
                  activeRecord?.position <= 2
                );
                const isPromoted = !isChamp && safeTier > 1 && (isPromoRecord || activeRecord?.position <= 3);
                const isTop4 = !isChamp && safeTier === 1 && activeRecord?.position <= 4;
                const isRelegated = !isChamp && (
                  (activeIdx < leagueHistory.length - 1 && (leagueHistory[activeIdx + 1].tier || 1) > safeTier) ||
                  (activeRecord?.position >= 16 && safeTier < getMaxTier(clubCountry, clubsDb))
                );
                const isSafe = !isChamp && !isPromoted && !isTop4 && !isRelegated && (activeRecord?.position >= 13 && activeRecord?.position <= 15);

                let statusBadgeText = isDe ? 'Mittelfeld' : 'Mid-Table';
                let statusBadgeStyle = 'bg-white/[0.06] text-zinc-300 border-white/[0.08]';
                if (isChamp) {
                  if (safeTier === 1) {
                    statusBadgeText = isDe ? 'Meister 🏆' : 'League Champions 🏆';
                    statusBadgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
                  } else {
                    statusBadgeText = isDe ? `Meister & Aufstieg 🏆 ⬆` : `Tier ${safeTier} Champions & Promoted 🏆 ⬆`;
                    statusBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
                  }
                } else if (isPromoted) {
                  const targetTier = Math.max(1, safeTier - 1);
                  const targetLeague = getLeagueInfo(targetTier, clubCountry);
                  const targetName = targetLeague?.tag || `Tier ${targetTier}`;
                  statusBadgeText = isDe ? `Aufstieg in ${targetName} ⬆` : `Promoted to ${targetName} ⬆`;
                  statusBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
                } else if (isTop4) {
                  statusBadgeText = isDe ? 'Top 4 / Europa' : 'Top 4 / Continental';
                  statusBadgeStyle = 'bg-sky-500/20 text-sky-300 border-sky-400/30';
                } else if (isRelegated) {
                  statusBadgeText = isDe ? 'Abstieg' : 'Relegated';
                  statusBadgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-400/30';
                } else if (isSafe) {
                  statusBadgeText = isDe ? 'Klassenerhalt' : 'Safe';
                  statusBadgeStyle = 'bg-amber-500/15 text-amber-200 border-amber-500/25';
                }

                return (
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden backdrop-blur-md">
                    {/* Header with active inspected record highlight */}
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06] flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-lg border border-sky-400/30">
                          {activeRecord?.year}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          #{activeRecord?.position} {isDe ? 'Platz' : 'Place'}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeStyle}`}>
                          {statusBadgeText}
                        </span>
                        <span className="text-[11px] text-zinc-400 truncate max-w-[130px] sm:max-w-[180px]">
                          Tier {safeTier} · {safeLeagueName}
                        </span>
                      </div>

                      <div className="text-[11px] tabular-nums font-semibold text-zinc-300">
                        {activeRecord?.points} Pts · {activeRecord?.ovr} OVR
                      </div>
                    </div>

                    {/* SVG Line Chart */}
                    <div className="w-full relative">
                      <svg viewBox={hasLowerTier ? "0 0 460 238" : "0 0 460 215"} className="w-full h-auto overflow-visible select-none">
                        <defs>
                          <linearGradient id="finishGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
                            <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                          </linearGradient>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <filter id="promoGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Benchmark horizontal grid lines */}
                        {gridLines.map((gl, gIdx) => {
                          const y = getY(gl.pos, gl.tier);
                          return (
                            <g key={`grid-${gl.label}-${gIdx}`}>
                              <line
                                x1={paddingLeft}
                                y1={y}
                                x2={paddingLeft + width}
                                y2={y}
                                className={`${gl.border}`}
                                strokeDasharray={gl.pos === 1 ? 'none' : '3 3'}
                                strokeWidth="1"
                              />
                              <text
                                x={paddingLeft - 8}
                                y={y + 3.5}
                                textAnchor="end"
                                className={`text-[10px] tabular-nums font-semibold fill-current ${gl.color}`}
                              >
                                {gl.label}
                              </text>
                            </g>
                          );
                        })}

                        {/* Shaded Area fill under line */}
                        {areaPath && (
                          <path d={areaPath} fill="url(#finishGrad)" />
                        )}

                        {/* Single season dashed horizontal benchmark indicator */}
                        {points.length === 1 && (
                          <line
                            x1={paddingLeft}
                            y1={points[0].y}
                            x2={paddingLeft + width}
                            y2={points[0].y}
                            className="stroke-sky-400/40"
                            strokeDasharray="4 4"
                            strokeWidth="2"
                          />
                        )}

                        {/* Main Line path */}
                        {linePath && (
                          <path
                            d={linePath}
                            fill="none"
                            className="stroke-sky-400 stroke-[3]"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                          />
                        )}

                        {/* Interactive Data Nodes */}
                        {points.map((pt) => {
                          const nodeTier = pt.d.tier || minTier;
                          const isNodeChamp = pt.d.position === 1;
                          const isNodeTop4 = nodeTier === 1 && pt.d.position <= 4;
                          const isNodePromoted = nodeTier > 1 && (
                            (pt.idx < leagueHistory.length - 1 && (leagueHistory[pt.idx + 1].tier || minTier) < nodeTier) ||
                            pt.d.position <= 2
                          );
                          const isNodeRelegated = !isNodeChamp && pt.d.position >= 16;
                          const isSelected = pt.idx === activeIdx;
                          
                          let nodeColor = '#38bdf8';
                          if (isNodeChamp) {
                            nodeColor = nodeTier === 1 ? '#f59e0b' : '#10b981';
                          } else if (isNodePromoted) {
                            nodeColor = '#10b981';
                          } else if (isNodeRelegated) {
                            nodeColor = '#f43f5e';
                          } else if (nodeTier > 1) {
                            nodeColor = '#34d399';
                          } else if (!isNodeTop4) {
                            nodeColor = '#e4e4e7';
                          }

                          const nodeRadius = isSelected 
                            ? (tierCount > 5 ? 5.5 : 7.5) 
                            : isNodeChamp 
                            ? (tierCount > 5 ? 4.5 : 6.5) 
                            : isNodePromoted 
                            ? (tierCount > 5 ? 4.5 : 6) 
                            : (tierCount > 5 ? 3.5 : 4.5);

                          const ringRadius = isSelected ? (tierCount > 5 ? 9 : 13) : 0;
                          const haloRadius = isSelected 
                            ? (isNodePromoted ? (tierCount > 5 ? 10 : 13) : (tierCount > 5 ? 8 : 11))
                            : (isNodePromoted ? (tierCount > 5 ? 8 : 11) : (tierCount > 5 ? 6 : 9));

                          return (
                            <g
                              key={`node-${pt.d.year}-${pt.idx}`}
                              className="group cursor-pointer"
                              onClick={() => setSelectedSeasonIdx(pt.idx)}
                              onMouseEnter={() => setSelectedSeasonIdx(pt.idx)}
                            >
                              {/* Selected Steady Accent Ring */}
                              {isSelected && (
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={ringRadius}
                                  fill="none"
                                  stroke={nodeColor}
                                  strokeWidth="1.5"
                                  opacity="0.55"
                                />
                              )}

                              {/* Outer Halo with special promotion green glow */}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={haloRadius}
                                fill={nodeColor}
                                opacity={isSelected ? "0.4" : (isNodePromoted ? "0.35" : "0.15")}
                                filter={isNodePromoted ? "url(#promoGlow)" : undefined}
                                className="transition-all duration-200"
                              />

                              {/* Main Node */}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={nodeRadius}
                                fill={nodeColor}
                                stroke={isNodePromoted ? "#064e3b" : "#12141c"}
                                strokeWidth={tierCount > 5 ? "1.8" : "2.5"}
                                className="transition-all duration-200"
                              />

                              {/* Node Finish Label above node (with green upward arrow on promotion) */}
                              <text
                                x={pt.x}
                                y={pt.y - (tierCount > 5 ? 7 : 11)}
                                textAnchor="middle"
                                className={`text-[10px] tabular-nums font-bold transition-opacity ${
                                  isNodePromoted 
                                    ? 'fill-emerald-300 font-extrabold'
                                    : isSelected 
                                    ? 'fill-white opacity-100 font-bold' 
                                    : 'fill-zinc-300 opacity-80'
                                }`}
                              >
                                {isNodePromoted && <tspan fill="#34d399">↑ </tspan>}#{pt.d.position}
                              </text>

                              {/* X-Axis Year label */}
                              <text
                                x={pt.x}
                                y={hasLowerTier ? 228 : 206}
                                textAnchor="middle"
                                className={`text-[10px] tabular-nums font-medium transition-colors ${isSelected ? 'fill-sky-400 font-bold' : 'fill-zinc-400'}`}
                              >
                                {pt.d.year}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Legend / Key Footer */}
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>{isDe ? 'Meister' : 'Champions'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                          <span>{isDe ? 'Aufstieg (↑)' : 'Promoted (↑)'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                          <span>{isDe ? 'Top 4' : 'Top 4'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                          <span>{isDe ? 'Abstieg' : 'Relegated'}</span>
                        </span>
                      </div>

                      {activeRecord?.isManagerTenure && (
                        <div className="text-[10px] text-sky-300 font-medium flex items-center gap-1">
                          <i className="fa-solid fa-user-tie text-[9px]"></i>
                          <span>{isDe ? 'Unter deiner Regie' : 'Director Tenure'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Managerial Tenure & Stint Breakdown Card */}
              {(() => {
                const managedSeasons = leagueHistory.filter(r => r.isManagerTenure);
                if (managedSeasons.length === 0) return null;

                // Group into distinct stints / spells
                const stints: { startYear: number; endYear: number; count: number; trophies: number; wins: number; draws: number; losses: number }[] = [];
                let currentStint: { startYear: number; endYear: number; count: number; trophies: number; wins: number; draws: number; losses: number } | null = null;

                // Sort ascending by year to compute chronological stints
                const sortedAsc = [...leagueHistory].sort((a, b) => a.year - b.year);
                sortedAsc.forEach((rec) => {
                  if (rec.isManagerTenure) {
                    if (!currentStint) {
                      currentStint = {
                        startYear: rec.year,
                        endYear: rec.year,
                        count: 1,
                        trophies: rec.wonTrophy ? 1 : 0,
                        wins: rec.wins || 0,
                        draws: rec.draws || 0,
                        losses: rec.losses || 0,
                      };
                    } else {
                      currentStint.endYear = rec.year;
                      currentStint.count += 1;
                      if (rec.wonTrophy) currentStint.trophies += 1;
                      currentStint.wins += rec.wins || 0;
                      currentStint.draws += rec.draws || 0;
                      currentStint.losses += rec.losses || 0;
                    }
                  } else {
                    if (currentStint) {
                      stints.push(currentStint);
                      currentStint = null;
                    }
                  }
                });
                if (currentStint) stints.push(currentStint);

                const totalW = managedSeasons.reduce((sum, r) => sum + (r.wins || 0), 0);
                const totalD = managedSeasons.reduce((sum, r) => sum + (r.draws || 0), 0);
                const totalL = managedSeasons.reduce((sum, r) => sum + (r.losses || 0), 0);
                const totalMatches = totalW + totalD + totalL;
                const winRate = totalMatches > 0 ? Math.round((totalW / totalMatches) * 100) : 0;
                const bestFinish = Math.min(...managedSeasons.map(r => r.position));
                const isCurrentlyHere = Boolean(state.club.id === resolvedClub.id || (resolvedClub.name && state.club.name.toLowerCase().trim() === resolvedClub.name.toLowerCase().trim()));

                return (
                  <div className="bg-gradient-to-r from-sky-950/40 via-purple-950/20 to-black/40 border border-sky-400/25 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center text-xs">
                          <i className="fa-solid fa-user-tie"></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white tracking-tight">
                              {isDe ? 'Deine Historie bei diesem Verein' : 'Your Managerial Heritage at this Club'}
                            </span>
                            {stints.length > 1 && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                {stints.length} {isDe ? 'Amtszeiten' : 'Distinct Spells'}
                              </span>
                            )}
                            {isCurrentlyHere && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>{isDe ? 'Aktueller Verein' : 'Active Club'}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {isCurrentlyHere
                              ? (stints.length > 1 ? (isDe ? 'Rückkehr als Sportdirektor nach vorheriger Amtszeit' : 'Returned as Sporting Director · Second spell at the club') : (isDe ? 'Laufende Amtszeit' : 'Current Sporting Director Tenure'))
                              : (isDe ? 'Ehemaliger Verein deiner Trainerlaufbahn' : 'Former club directed earlier in your career')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <div className="bg-black/30 px-2.5 py-1 rounded-xl border border-white/5">
                          <div className="text-[9px] text-zinc-400 font-semibold uppercase">{isDe ? 'Spiele & Bilanz' : 'Record'}</div>
                          <div className="text-xs font-mono font-bold text-white">
                            {totalW}W-{totalD}D-{totalL}L <span className="text-sky-300 font-normal">({winRate}%)</span>
                          </div>
                        </div>
                        <div className="bg-black/30 px-2.5 py-1 rounded-xl border border-white/5">
                          <div className="text-[9px] text-zinc-400 font-semibold uppercase">{isDe ? 'Bester Platz' : 'Best Finish'}</div>
                          <div className="text-xs font-mono font-bold text-amber-300">
                            #{bestFinish} {bestFinish === 1 ? '🏆' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stints list if user left and returned */}
                    {stints.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        {stints.map((st, idx) => (
                          <div key={idx} className="bg-black/25 rounded-xl p-2.5 border border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="font-bold text-white text-[11px]">
                                  {isDe ? `Amtszeit ${idx + 1}:` : `Spell ${idx + 1}:`} {st.startYear === st.endYear ? st.startYear : `${st.startYear}–${st.endYear}`}
                                </div>
                                <div className="text-[9px] text-zinc-400">
                                  {st.count} {st.count === 1 ? (isDe ? 'Saison' : 'Season') : (isDe ? 'Saisons' : 'Seasons')} · {st.wins}W-{st.draws}D-{st.losses}L
                                </div>
                              </div>
                            </div>
                            {st.trophies > 0 && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <i className="fa-solid fa-trophy text-[9px]"></i>
                                <span>{st.trophies} {isDe ? 'Titel' : 'Titles'}</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Season-by-Season Chronicle Table */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <i className="fa-solid fa-timeline text-sky-400 text-[10px]"></i>
                    <span>{isDe ? 'Saison-Chronik des Vereins' : 'Club Season Chronicle'}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {leagueHistory.length} {isDe ? 'Saisons erfasst' : 'Recorded Seasons'}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-white/[0.04]">
                  {[...leagueHistory].sort((a, b) => b.year - a.year).map((r) => {
                    const isChamp = r.position === 1;
                    const isPromo = r.tier > 1 && r.position <= 3;
                    const isReleg = r.position >= 16;
                    
                    return (
                      <div
                        key={r.year}
                        className={`py-2 px-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition ${
                          r.isManagerTenure ? 'bg-sky-500/[0.07] border border-sky-400/20 my-1' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono font-bold text-zinc-300 text-[11px] shrink-0">
                            {r.year}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                            isChamp ? 'bg-amber-400 text-black' : isPromo ? 'bg-emerald-500/20 text-emerald-300' : isReleg ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-zinc-300'
                          }`}>
                            #{r.position}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-white truncate flex items-center gap-1.5">
                              <span>Tier {r.tier}</span>
                              <span className="text-zinc-500">·</span>
                              <span className="text-zinc-300 truncate">{r.leagueName}</span>
                            </div>
                            <div className="text-[9px] text-zinc-400 font-mono">
                              {r.points} pts · {r.wins || 0}W-{r.draws || 0}D-{r.losses || 0}L
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {r.wonTrophy && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <i className="fa-solid fa-trophy text-[8px]"></i>
                              <span>{isDe ? 'Titel' : 'Champs'}</span>
                            </span>
                          )}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            r.isManagerTenure
                              ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                              : 'bg-white/5 text-zinc-500 border-white/5'
                          }`}>
                            <i className={`fa-solid ${r.isManagerTenure ? 'fa-user-tie text-sky-400' : 'fa-landmark text-zinc-500'} text-[8px]`}></i>
                            <span>{r.isManagerTenure ? (isDe ? 'Unter dir' : 'Your Tenure') : (isDe ? 'Interim' : 'Interim Era')}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ================= DOSSIER & PRESTIGE VIEW ================= */
            <div className="space-y-4">
              {/* Main Reputation Score Card */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                      {isDe ? 'Globale Strahlkraft & Ansehen' : 'Global Standing & Prestige'}
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight">
                      {tierInfo.title}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                      {tierInfo.desc}
                    </p>
                  </div>

                  {/* Radial Meter */}
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        className="stroke-white/5 fill-none"
                        strokeWidth="8"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        className="fill-none transition-all duration-1000 ease-out"
                        stroke={hexColor}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white tracking-tight leading-none">
                        {clubRep}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                        / 100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Standing & Infrastructure Bar */}
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {isDe ? 'Kader (GES)' : 'Squad (OVR)'}
                    </div>
                    <div className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">
                      {safeBaseOvr}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {isDe ? 'Stadion' : 'Capacity'}
                    </div>
                    <div className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">
                      {(resolvedClub.stadium || state.club.stadium || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {isDe ? 'Jugendakademie' : 'Academy'}
                    </div>
                    <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 font-mono">
                      Lvl {resolvedClub.academyLevel || state.club.academyLevel || 1}<span className="text-zinc-500 text-xs font-normal">/5</span>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {isDe ? 'Med. Zentrum' : 'Medical'}
                    </div>
                    <div className="text-sm sm:text-base font-black text-sky-400 mt-0.5 font-mono">
                      Lvl {resolvedClub.medicalLevel || state.club.medicalLevel || 1}<span className="text-zinc-500 text-xs font-normal">/5</span>
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {isDe ? 'Fanbasis' : 'Fanbase'}
                    </div>
                    <div className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">
                      {formatFanbase(resolvedClub.fanBase || state.club.fanBase)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Corporate Restructuring & Club Identities */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider mb-1 flex items-center gap-1.5">
                <i className="fa-solid fa-sitemap"></i>
                <span>Corporate Restructuring</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Macro Club Identity & Business Model
              </h3>
            </div>
            
            <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 rounded-xl shrink-0 self-start sm:self-auto">
              <span className="text-xs text-zinc-400 font-medium">Available DP:</span>
              <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-mono font-bold text-xs border border-sky-400/30">
                {currentDp} DP
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">(20 DP to change)</span>
            </div>
          </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'balanced' as const,
                      title: 'BALANCED MODEL',
                      subtitle: isDe ? 'Ausgewogenes Standardmodell' : 'Standard Balanced Framework',
                      icon: 'fa-scale-balanced',
                      color: 'border-zinc-500/30 text-zinc-300',
                      badgeColor: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
                      desc: isDe 
                        ? '🟩 Ausgewogenes Risiko-Ertrags-Verhältnis in allen Abteilungen. 🟥 Keine strukturellen Department-Boni.' 
                        : '🟩 Balanced risk-reward across all departments. 🟥 Zero structural trade-offs or specialized department modifiers.',
                    },
                    {
                      id: 'wonderkid' as const,
                      title: 'WONDERKID FACTORY',
                      subtitle: isDe ? 'Talentschmiede & Jugend-Export' : 'Youth Academy & Talent Export',
                      icon: 'fa-seedling',
                      color: 'border-emerald-500/30 text-emerald-300',
                      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                      desc: '🟩 +15% Academy Odds, +35% Sale Profit. 🟥 Auto-sells highest OVR player end-of-season.',
                    },
                    {
                      id: 'galactico' as const,
                      title: 'GALACTICO ENTERPRISE',
                      subtitle: isDe ? 'Weltstars & Kommerzielle Strahlkraft' : 'Superstars & Commercial Stature',
                      icon: 'fa-crown',
                      color: 'border-amber-500/30 text-amber-300',
                      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      desc: '🟩 1.5x Fan/Commercial Growth, +1 OVR on Stars. 🟥 Must sign 1 player > Squad Avg yearly or face severe board penalties.',
                    },
                    {
                      id: 'moneyball' as const,
                      title: 'MONEYBALL SYNDICATE',
                      subtitle: isDe ? 'Datengetriebene Effizienz & Synergie' : 'Data-Driven Efficiency & Synergy',
                      icon: 'fa-chart-line',
                      color: 'border-cyan-500/30 text-cyan-300',
                      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                      desc: '🟩 5% Flop Rate on Regular Transfers, +4 OVR Coach Synergy. 🟥 Locked out of Key/Galactico signings.',
                    },
                    {
                      id: 'heritage' as const,
                      title: 'HERITAGE FORTRESS',
                      subtitle: isDe ? 'Tradition, Vereinstreue & Stabilität' : 'Tradition, Loyalty & Stability',
                      icon: 'fa-shield-halved',
                      color: 'border-purple-500/30 text-purple-300',
                      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                      desc: '🟩 Morale decay halved, +20% Wage Relief (Loyalty). 🟥 Regular transfers cost 2x budget.',
                    },
                  ].map((card) => {
                    const isActive = activeIdentity === card.id;
                    const canAfford = currentDp >= 20;

                    return (
                      <div
                        key={card.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 text-left relative overflow-hidden ${
                          isActive
                            ? 'bg-sky-500/[0.08] border-sky-400/50 shadow-md ring-1 ring-sky-400/30'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <i className={`fa-solid ${card.icon} text-xs shrink-0 ${card.color}`}></i>
                              <span className="font-black text-xs text-white tracking-wide leading-tight">
                                {card.title}
                              </span>
                            </div>
                            {isActive && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                                {isDe ? 'Aktiv' : 'Active'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-medium">
                            {card.subtitle}
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans pt-1">
                            {card.desc}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                          {isActive ? (
                            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                              <i className="fa-solid fa-check text-[9px]"></i>
                              <span>{isDe ? 'Aktives Geschäftsmodell' : 'Current Model Enacted'}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (canAfford) {
                                  const newId = card.id;
                                  setActiveIdentity(newId);
                                  setCurrentDp(prev => Math.max(0, prev - 20));
                                  if (onSelectIdentity) {
                                    onSelectIdentity(newId);
                                  } else {
                                    state.clubIdentity = newId;
                                    state.skillPoints = Math.max(0, (state.skillPoints || 0) - 20);
                                  }
                                }
                              }}
                              disabled={!canAfford}
                              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                canAfford
                                  ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30'
                                  : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed opacity-60'
                              }`}
                            >
                              <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
                              <span>{isDe ? 'Aktivieren (20 DP)' : 'Enact Model (20 DP)'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Historical Lore & Boardroom Context */}
              {narrative && (
                <div className="bg-[#18181b] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 w-1.5 h-full"
                    style={{ backgroundColor: hexColor }}
                  />
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                    <i className="fas fa-book-bookmark text-zinc-400 text-xs"></i>
                    <span>{isDe ? 'Vereinshistorie & Leitbild' : 'Heritage & Vision'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed pl-1">
                    "{narrative}"
                  </p>
                </div>
              )}

              {/* Prestige Strategic Drivers */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {isDe ? 'Einflussfaktoren im Spielbetrieb' : 'Strategic Governance Drivers'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 text-zinc-200 font-semibold mb-1">
                      <i className="fa-solid fa-user-plus text-sky-400 text-xs"></i>
                      <span>{isDe ? 'Transfer-Anziehung' : 'Transfer Pull'}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {clubRep >= 75
                        ? (isDe ? 'Internationale Hochkaräter und 5-Sterne Talente lassen sich mühelos anlocken.' : 'Elite international stars and 5-star prodigies readily sign.')
                        : (isDe ? 'Verhandlungen erfordern kluges Scouting und wettbewerbsfähige Verträge.' : 'Signings require savvy scouting and competitive incentive structures.')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center gap-2 text-zinc-200 font-semibold mb-1">
                      <i className="fa-solid fa-handshake text-emerald-400 text-xs"></i>
                      <span>{isDe ? 'Sponsoren-Erlöse' : 'Commercial Yields'}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {isDe
                        ? 'Höheres Ansehen maximiert Trikotsponsoring und erhöht die weltweiten Merchandising-Umsätze.'
                        : 'Elevated reputation maximizes kit sponsorship deals and scales worldwide merchandise reach.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* World Cup - Interactive row, opens World Cup History Archive */}
              {Boolean(
                state.hasBeenWorldCupInvited ||
                (state.worldCupInvitationsReceived && state.worldCupInvitationsReceived > 0) ||
                (state.worldCupTournamentsPlayed && state.worldCupTournamentsPlayed > 0) ||
                (state.internationalTournamentsPlayed && state.internationalTournamentsPlayed > 0) ||
                (state.worldCupMatchesPlayed && state.worldCupMatchesPlayed > 0) ||
                (state.worldCupCampaigns && state.worldCupCampaigns.length > 0)
              ) && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenWorldCupHistory?.();
                  }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 transition cursor-pointer text-xs group active:scale-[0.99] shadow-sm"
                  title="Click to view full World Cup Managerial History Archive"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded text-[10px] font-bold font-mono shrink-0">
                      WC
                    </div>
                    <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 text-xs shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-globe text-[11px]"></i>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <div className="font-semibold text-white truncate text-xs flex items-center gap-1.5 py-0.5 leading-normal">
                        <span>{state.worldCupLastTeam || (isDe ? 'Nationalmannschaft' : 'World Cup')}</span>
                        {(state.worldCupTrophies || state.internationalTrophies || 0) > 0 && (
                          <span className="text-yellow-400 text-[10px]" title="World Cup Champion">🏆</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 leading-none">
                          World Cup
                        </span>
                        <span className="truncate">
                          {state.worldCupBestFinish || ((state.worldCupTrophies || state.internationalTrophies || 0) > 0 ? (isDe ? 'Weltmeister' : 'Champion') : (state.worldCupMatchesPlayed ? (isDe ? 'Teilnehmer' : 'Contender') : (isDe ? 'Eingeladen' : 'Invited')))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-right shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-300 font-mono">
                        {state.worldCupMatchesPlayed || 0} {isDe ? 'Spiele' : 'GP'}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {state.worldCupMatchesWon || 0}W-{state.worldCupMatchesDrawn || 0}D-{state.worldCupMatchesLost || 0}L
                      </div>
                    </div>
                    {(state.worldCupTrophies || state.internationalTrophies || 0) > 0 && (
                      <div className="text-xs font-black text-yellow-400 pl-2 border-l border-white/10 flex items-center gap-1">
                        <span>{state.worldCupTrophies || state.internationalTrophies}</span>
                        <span className="text-[10px]">🏆</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 pl-2 border-l border-white/10 text-[10px] font-semibold text-amber-300/80 group-hover:text-amber-300">
                      <span className="hidden sm:inline">Archive</span>
                      <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-0.5 transition-transform"></i>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Boardroom Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs rounded-xl border border-white/[0.08] transition active:scale-95 cursor-pointer shadow-sm"
          >
            {isDe ? 'Schliessen' : 'Close'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
