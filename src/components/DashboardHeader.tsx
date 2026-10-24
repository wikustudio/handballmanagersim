import React, { useState, useEffect, useRef } from 'react';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { GameState, Language, UniverseMovement } from '../types';
import {
  COUNTRIES,
  getCountryFlag,
  getLeagueInfo,
  getDynamicLeagueAvgOvr,
  getOvrTierConfig,
  getDomesticCupInfo,
  getDomesticSupercupInfo,
  getEuropeanSupercupInfo,
  getMonogramHex,
  getClubHistoricContext,
  formatMoney,
  calculateClubFinancials,
  calculateLiveScore,
} from '../data/gameConstants';
import { CountUp } from './CountUp';
import { ClubLogo } from './ClubLogo';
import { t as tr } from '../data/translations';
import { useGameStore } from '../store/useGameStore';

interface DashboardHeaderProps {
  state: GameState;
  lang: Language;
  financials: {
    wages: number;
    estRevenue: number;
    net: number;
  };
  onShowTable: () => void;
  onShowLedger: () => void;
  onShowYouth?: () => void;
  onOpenPhilosophyModal?: () => void;
  onOpenSkillsModal?: () => void;
  onOpenCustomization?: () => void;
  onShowNewBuild?: () => void;
  onShowCareerHistory?: () => void;
  onOpenProfile?: () => void;
  onOpenClubProfile?: () => void;
  onShowImpact?: () => void;
  onOpenMoraleModal?: () => void;
  onOpenOvrModal?: () => void;
  onOpenShieldsModal?: () => void;
  onShowLeaderboard?: () => void;
  onCoachMarket?: () => void;
  onOpenCoachDossier?: () => void;
}

const CircularRing: React.FC<{
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
  children?: React.ReactNode;
}> = ({
  value,
  max = 100,
  size = 110,
  strokeWidth = 8,
  color = '#10b981',
  glowColor = 'rgba(16, 185, 129, 0.45)',
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(max, Math.max(0, value)) / max;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  state: propState,
  lang,
  financials: propFinancials,
  onShowTable,
  onShowLedger,
  onShowYouth,
  onOpenPhilosophyModal,
  onOpenSkillsModal,
  onOpenCustomization,
  onOpenProfile,
  onOpenClubProfile,
  onShowImpact,
  onShowCareerHistory,
  onShowLeaderboard,
  onShowNewBuild,
  onOpenMoraleModal,
  onOpenOvrModal,
  onOpenShieldsModal,
  onCoachMarket,
  onOpenCoachDossier,
}) => {
  const storeState = useGameStore();
  const state = (storeState && storeState.club?.name) ? storeState : propState;
  const financials = calculateClubFinancials(state);
  const countryFlag = getCountryFlag(state.club?.country);
  const leagueName = getLeagueInfo(state.club.tier, state.club.country || 'GER')?.name || `League ${state.club.tier}`;
  const historicContext = getClubHistoricContext(state.club.name, state.club.tier, false, state.club.country || 'GER', state.club);

  const safeBaseOvr = typeof state.club.baseOvr !== 'number' || Number.isNaN(state.club.baseOvr) ? 60 : state.club.baseOvr;
  const currentSeason = state.year;
  const changesThisSeason = (state.ovrHistory || [])
    .filter(h => h.season === currentSeason)
    .reduce((sum, h) => sum + h.change, 0);

  const prevOvrRaw = state.lastOvr !== undefined ? state.lastOvr : state.history && state.history.length > 0 ? state.history[state.history.length - 1].ovr : safeBaseOvr;
  const previousOvr = typeof prevOvrRaw !== 'number' || Number.isNaN(prevOvrRaw) ? safeBaseOvr : prevOvrRaw;
  
  // Honor changesThisSeason from ovrHistory if present, matching the OvrModal breakdown
  const hasSeasonOvrLogs = (state.ovrHistory || []).some(h => h.season === currentSeason);
  const ovrDiff = hasSeasonOvrLogs ? changesThisSeason : (safeBaseOvr - previousOvr);
  const ovrColorClass = ovrDiff > 0 ? 'text-[#10b981]' : ovrDiff < 0 ? 'text-[#f43f5e]' : 'text-zinc-400';
  const ovrIcon = ovrDiff > 0 ? 'fa-arrow-up' : ovrDiff < 0 ? 'fa-arrow-down' : 'fa-minus';

  const leagueAvgOvr = getDynamicLeagueAvgOvr(state);
  const impactVal = Math.min(100, Math.max(0, Math.round(Number(state.clubImpactScore !== undefined ? state.clubImpactScore : 50))));
  const impactScore = impactVal;

  const bankruptcyRisk = (state.seasonsInDebt || 0) > 0 || (state.budget || 0) < 0;
  const isStructuredDebt = bankruptcyRisk && financials.net >= 0;

  const coachDisplayName = state.managerName || state.currentCoach?.name || 'Head Coach';

  const currentClubHistory = (state.history || []).filter(
    h => (h.clubName && state.club?.name && h.clubName.trim().toLowerCase() === state.club.name.trim().toLowerCase()) ||
         (state.club?.id !== undefined && h.clubId !== undefined && (String(h.clubId) === String(state.club.id) || Number(h.clubId) === Number(state.club.id))) ||
         (!h.clubName && (state.history || []).length === 1)
  );

  // Gather all recorded universe movements across global state and individual season histories
  const allRecordedMovements: UniverseMovement[] = [];
  const seenMovementIds = new Set<string>();

  const addMovementIfNew = (m: UniverseMovement) => {
    if (!m) return;
    const key = m.id || `${m.year}-${m.clubId || m.clubName}-${m.type}-${m.cupTitle || ''}`;
    if (!seenMovementIds.has(key)) {
      seenMovementIds.add(key);
      allRecordedMovements.push(m);
    }
  };

  (state.universeMovements || []).forEach(addMovementIfNew);
  (state.history || []).forEach(h => {
    (h.universeMovements || []).forEach(addMovementIfNew);
  });
  (propState?.universeMovements || []).forEach(addMovementIfNew);
  (propState?.history || []).forEach(h => {
    (h.universeMovements || []).forEach(addMovementIfNew);
  });

  const isCurrentClubMovement = (m: UniverseMovement) => {
    if (!m) return false;
    const nameMatch = Boolean(
      m.clubName && state.club?.name &&
      m.clubName.trim().toLowerCase() === state.club.name.trim().toLowerCase()
    );
    const idMatch = Boolean(
      state.club?.id !== undefined && m.clubId !== undefined &&
      (String(m.clubId) === String(state.club.id) || Number(m.clubId) === Number(state.club.id))
    );
    return nameMatch || idMatch;
  };

  // Check universe movements for any cup titles won by current club that might not be recorded in h.trophiesThisYear
  const universeCupsThisClub = allRecordedMovements.filter(
    m => isCurrentClubMovement(m) && m.type === 'intl_cup'
  );

  let extraDfb = 0;
  let extraReg = 0;
  let extraCl = 0;
  let extraEl = 0;
  let extraEcl = 0;
  let extraCwc = 0;
  let extraSc = 0;
  let extraEsc = 0;

  const countedCupYears = {
    cwc: new Set<number>(),
    cl: new Set<number>(),
    el: new Set<number>(),
    ecl: new Set<number>(),
    esc: new Set<number>(),
    dfb: new Set<number>(),
    sc: new Set<number>(),
    reg: new Set<number>(),
  };

  currentClubHistory.forEach(h => {
    if (h.trophiesThisYear?.cwc) countedCupYears.cwc.add(h.year);
    if (h.trophiesThisYear?.cl) countedCupYears.cl.add(h.year);
    if (h.trophiesThisYear?.el) countedCupYears.el.add(h.year);
    if (h.trophiesThisYear?.ecl) countedCupYears.ecl.add(h.year);
    if (h.trophiesThisYear?.dfb) countedCupYears.dfb.add(h.year);
    if (h.trophiesThisYear?.sc) countedCupYears.sc.add(h.year);
    if (h.trophiesThisYear?.reg) countedCupYears.reg.add(h.year);
  });

  // Also synchronize directly won cup runs from store / props
  const allCupRuns = [...(state.cupRunResults || []), ...(propState?.cupRunResults || [])];
  allCupRuns.forEach(r => {
    if (r.won) {
      const yr = r.year;
      const name = (r.nameEn || '').toLowerCase();
      if (r.id === 'nat_cup' || name.includes('national') || name.includes('pokal')) {
        if (!countedCupYears.dfb.has(yr)) {
          countedCupYears.dfb.add(yr);
          extraDfb++;
        }
      } else if (r.id === 'reg_cup' || name.includes('regional') || name.includes('amateur')) {
        if (!countedCupYears.reg.has(yr)) {
          countedCupYears.reg.add(yr);
          extraReg++;
        }
      } else if (r.id === 'euro_cup' || r.id === 'cl') {
        if (name.includes('champions league')) {
          if (!countedCupYears.cl.has(yr)) { countedCupYears.cl.add(yr); extraCl++; }
        } else if (name.includes('european league') || name.includes('euro league')) {
          if (!countedCupYears.el.has(yr)) { countedCupYears.el.add(yr); extraEl++; }
        } else if (name.includes('european cup') || name.includes('ecl')) {
          if (!countedCupYears.ecl.has(yr)) { countedCupYears.ecl.add(yr); extraEcl++; }
        }
      }
    }
  });

  universeCupsThisClub.forEach(m => {
    const title = (m.cupTitle || '').toLowerCase();
    const mId = String(m.id || '');
    const yr = m.year;
    if (title.includes('super globe')) {
      if (!countedCupYears.cwc.has(yr)) {
        countedCupYears.cwc.add(yr);
        extraCwc++;
      }
    } else if (mId.endsWith('-cup-esc') || title.includes('european supercup') || title.includes('continental supercup') || title.includes('ehf supercup')) {
      // Ignore international supercup
    } else if (
      mId.endsWith('-cup-sc') ||
      title.includes('supercup') ||
      title.includes('super cup') ||
      title.includes('supercopa') ||
      title.includes('superpuchar') ||
      title.includes('szuperkupa') ||
      title.includes('supertaça') ||
      title.includes('supertaca') ||
      title.includes('superkup') ||
      title.includes('superpokal') ||
      title.includes('supercoppa') ||
      title.includes('trophée des champions') ||
      title.includes('meistarakeppni')
    ) {
      if (!countedCupYears.sc.has(yr)) {
        countedCupYears.sc.add(yr);
        extraSc++;
      }
    } else if (title.includes('champions league')) {
      if (!countedCupYears.cl.has(yr)) {
        countedCupYears.cl.add(yr);
        extraCl++;
      }
    } else if (title.includes('european league')) {
      if (!countedCupYears.el.has(yr)) {
        countedCupYears.el.add(yr);
        extraEl++;
      }
    } else if (title.includes('european cup')) {
      if (!countedCupYears.ecl.has(yr)) {
        countedCupYears.ecl.add(yr);
        extraEcl++;
      }
    } else if (title.includes('amateur') || title.includes('regional')) {
      if (!countedCupYears.reg.has(yr)) {
        countedCupYears.reg.add(yr);
        extraReg++;
      }
    } else if (
      title.includes('pokal') || title.includes('cup') || title.includes('copa') ||
      title.includes('coupe') || title.includes('puchar') || title.includes('kupa') ||
      title.includes('kup') || title.includes('coppa') || title.includes('cupa') ||
      title.includes('cupen') || title.includes('taça') || title.includes('taca') ||
      title.includes('bikar') || title.includes('nm') || m.type === 'intl_cup'
    ) {
      if (!countedCupYears.dfb.has(yr)) {
        countedCupYears.dfb.add(yr);
        extraDfb++;
      }
    }
  });

  const clubTrophies = {
    cwc: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.cwc || 0), 0) + extraCwc,
    cl: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.cl || 0), 0) + extraCl,
    el: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.el || 0), 0) + extraEl,
    ecl: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.ecl || 0), 0) + extraEcl,
    bl: currentClubHistory.reduce((sum, h) => {
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      return sum + ((!isLower && h.trophiesThisYear?.bl) ? (h.trophiesThisYear.bl || 1) : 0);
    }, 0),
    dfb: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.dfb || 0), 0) + extraDfb,
    sc: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.sc || 0), 0) + extraSc,
    reg: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.reg || 0), 0) + extraReg,
    lower: currentClubHistory.reduce((sum, h) => {
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      const val = (h.trophiesThisYear?.lower || 0) + (isLower ? (h.trophiesThisYear?.bl || 0) : 0);
      return sum + val;
    }, 0),
  };
  const totalClubSilverware = Object.values(clubTrophies).reduce((a, b) => a + b, 0);

  const domCupTitle = getDomesticCupInfo(state.club.country, 1).name || 'National Cup';
  const domSupercupTitle = getDomesticSupercupInfo(state.club.country).name || 'Supercup';
  const regCupTitle = state.club.country === 'GER' ? 'DHB-Amateurpokal' : 'Regional Cup';

  const earnedTrophyBadges = [
    { key: 'cwc', label: 'Super Globe', count: clubTrophies.cwc },
    { key: 'cl', label: 'Champions League', count: clubTrophies.cl },
    { key: 'el', label: 'European League', count: clubTrophies.el },
    { key: 'ecl', label: 'European Cup', count: clubTrophies.ecl },
    { key: 'bl', label: 'League Champions', count: clubTrophies.bl },
    { key: 'dfb', label: domCupTitle, count: clubTrophies.dfb },
    { key: 'sc', label: domSupercupTitle, count: clubTrophies.sc },
    { key: 'reg', label: regCupTitle, count: clubTrophies.reg },
    { key: 'lower', label: 'Lower Div', count: clubTrophies.lower },
  ].filter(t => t.count > 0);

  const topTrophy = earnedTrophyBadges[0] || null;

  // Interactive OVR dynamic incoming/outgoing changes & radiant glow
  const [floatingDelta, setFloatingDelta] = useState<number | null>(null);
  const [isOvrPulsing, setIsOvrPulsing] = useState(false);
  const prevOvrRef = useRef(safeBaseOvr);

  useEffect(() => {
    if (prevOvrRef.current !== safeBaseOvr) {
      const delta = safeBaseOvr - prevOvrRef.current;
      prevOvrRef.current = safeBaseOvr;
      if (delta !== 0) {
        setFloatingDelta(delta);
        setIsOvrPulsing(true);
        const timer = setTimeout(() => {
          setFloatingDelta(null);
          setIsOvrPulsing(false);
        }, 2600);
        return () => clearTimeout(timer);
      }
    }
  }, [safeBaseOvr]);

  const clubColor = state.club?.color || '#3b82f6';
  const displayOvr = safeBaseOvr;
  const ovrTierConfig = getOvrTierConfig(safeBaseOvr, leagueAvgOvr);
  const ovrDelta = safeBaseOvr - leagueAvgOvr;
  const ovrRingColor = ovrTierConfig.hex;
  const ovrRingGlow = ovrTierConfig.ringGlow;
  const ovrCardBorder = isOvrPulsing
    ? 'border-emerald-400/60 shadow-[0_0_24px_rgba(16,185,129,0.35)]'
    : ovrTierConfig.cardBorder;
  const ovrBadgeColor = ovrTierConfig.valueText;
  const ovrDeltaText = ovrDelta > 0
    ? `+${ovrDelta} vs Lg`
    : ovrDelta === 0
    ? '= Lg Benchmark'
    : `${ovrDelta} vs Lg`;

  // Reputation & Leaderboard metrics
  const repVal = state.club.rep || 50;
  const liveScore = calculateLiveScore(state);

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 mb-6 w-full">
      {/* ========================================================================= */}
      {/* 1. STATUS & WARNING BANNER (Shown on real debt / insolvency warnings)      */}
      {/* ========================================================================= */}
      {bankruptcyRisk && (
        <div className="w-full bg-[#10121a]/90 border border-white/[0.06] backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-xs text-zinc-300">
              <i className={`fas ${isStructuredDebt ? 'fa-shield-halved' : 'fa-triangle-exclamation'}`} />
            </span>
            <span className="font-normal truncate">
              Insolvency Risk (Year {Math.min(3, state.seasonsInDebt || 1)}/3): -€${Math.abs((state.budget || 0) / 1000000).toFixed(2)}M deficit. 3 consecutive years triggers sack.
              {isStructuredDebt && (
                <span className="ml-2 font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-[10px]">
                  Structured
                </span>
              )}
            </span>
          </div>
          <button
            onClick={onShowLedger}
            className="text-xs font-medium text-zinc-300 hover:text-white transition ml-2 shrink-0 cursor-pointer underline underline-offset-4"
          >
            Audit Treasury →
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP BENTO ROW: CLUB IDENTITY (2-COL) + OVR RING + IMPACT               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
        {/* CARD 1: CLUB IDENTITY & DOSSIER (SPANS 2 COLS ON DESKTOP & TABLET) */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 w-full bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-2xl p-4.5 sm:p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-200">
          <div className="relative z-10 flex flex-col">
            {/* Top Row: League Navigation Pill Button & Board Expectation */}
            <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onShowTable}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-300 hover:text-white text-xs font-medium uppercase tracking-wider transition active:scale-95 cursor-pointer group"
                  title="View League Standings"
                >
                  <i className="fas fa-list-ol text-[11px] group-hover:scale-110 transition-transform" />
                  <span>{leagueName}</span>
                  <i className="fas fa-chevron-right text-[9px] opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Board Expectation with Player Taunt when Trophy Drought exceeds 4 seasons */}
                {state.club.tier === 1 && (state.trophyDrought || 0) > 4 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-zinc-300 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{state.trophyDrought}-Year Trophy Drought: The fanbase is losing patience.</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-400 font-normal px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] hidden sm:inline-flex items-center gap-1">
                    <span className="text-zinc-500">Board:</span>
                    <span>{state.boardExpectation || `Top ${state.boardTargetPos || 10} Finish`}</span>
                  </span>
                )}
              </div>

              {/* Action Shield icon button on the right */}
              <button
                type="button"
                onClick={onOpenCustomization}
                className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                title="Customize club"
                aria-label="Customize club"
              >
                <i className="fas fa-shield-halved text-xs" />
              </button>
            </div>

            {/* Crest + Title */}
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div
                onClick={onOpenCustomization}
                className="relative cursor-pointer group shrink-0"
                title="Customize club"
              >
                {state.club && (
                  <ClubLogo
                    club={state.club}
                    clubId={state.club.id}
                    name={state.club.name}
                    color={state.club.color}
                    color2={state.club.color2}
                    logo={state.club.logo}
                    fallbackLogo={state.club.fallbackLogo}
                    className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl border border-white/10 group-hover:border-white/30 transition-all duration-200"
                  />
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    onClick={onOpenClubProfile || onOpenCustomization}
                    className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight truncate cursor-pointer hover:text-zinc-300 transition duration-200"
                    title="View Club Profile & History"
                  >
                    {state.club.name}
                  </h1>
                  <span className="text-base shrink-0" title={state.club.country}>
                    {countryFlag}
                  </span>
                </div>
              </div>
            </div>

            {/* Historic Context quote */}
            {historicContext && (
              <p
                onClick={onOpenClubProfile}
                className="text-xs sm:text-[13px] text-zinc-400 font-normal leading-relaxed line-clamp-2 max-w-xl mt-2.5 italic cursor-pointer hover:text-zinc-200 transition"
                title="View full club heritage & dossier"
              >
                "{historicContext}"
              </p>
            )}
          </div>

          {/* Bottom Divider Row: Trophy Badge */}
          <div
            onClick={onOpenClubProfile}
            className="relative z-10 pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400 cursor-pointer group"
            title="View Club Trophies & Silverware"
          >
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <i className="fas fa-trophy text-zinc-400 text-xs shrink-0 mr-0.5" />
              {earnedTrophyBadges.length > 0 ? (
                earnedTrophyBadges.map((t) => (
                  <span
                    key={`header-trophy-${t.key}`}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-zinc-300 text-[11px] font-medium truncate"
                  >
                    <span>{t.label}</span>
                    <span className="text-zinc-400 font-mono text-[10px]">{t.count}x</span>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-zinc-500 italic">No silverware won yet</span>
              )}
            </div>

            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition flex items-center gap-1.5 shrink-0 ml-2">
              <span className="tabular-nums">{totalClubSilverware}</span>
              <i className="fas fa-chevron-right text-[10px] opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* CARD 2: OVR CIRCULAR RING & NUMBER (CLICK TO OPEN OVR MODAL) */}
        <div
          onClick={() => {
            if (onOpenOvrModal) onOpenOvrModal();
          }}
          className="col-span-1 sm:col-span-1 lg:col-span-1 w-full bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-2xl p-4.5 sm:p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 group active:scale-[0.99]"
          title="Click to open squad rating breakdown"
        >
          {/* Floating Delta Badge for incoming/outgoing rating updates */}
          {floatingDelta !== null && (
            <span className="absolute top-2.5 right-8 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.06] border border-white/[0.1] text-zinc-200 z-20">
              {floatingDelta > 0 ? `+${floatingDelta} OVR` : `${floatingDelta} OVR`}
            </span>
          )}

          {/* Top Label */}
          <div className="relative z-10 flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                OVR
              </span>
              {ovrTierConfig.tier === 'relegation' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Squad in severe relegation risk." />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium font-mono uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                {lang === 'de' ? ovrTierConfig.statusLabelDe : ovrTierConfig.statusLabelEn}
              </span>
              <span className="text-zinc-500 group-hover:text-zinc-300 p-0.5 rounded transition text-xs">
                <i className="fas fa-arrow-up-right-from-square text-[10px]" />
              </span>
            </div>
          </div>

          {/* Center: Glowing Circular Ring with Number Inside */}
          <div className="relative z-10 my-auto py-2 flex items-center justify-center">
            <CircularRing
              value={displayOvr}
              max={100}
              size={110}
              strokeWidth={7}
              color={ovrRingColor}
              glowColor="rgba(255,255,255,0.1)"
            >
              <span className="text-3xl sm:text-[34px] font-semibold text-white tracking-tight leading-none tabular-nums">
                <CountUp value={displayOvr} duration={850} />
              </span>
              <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest leading-none mt-1">
                Squad
              </span>
            </CircularRing>
          </div>

          {/* Footer Subline: League Average Benchmark & Delta */}
          <div className="relative z-10 pt-2.5 mt-2 border-t border-white/[0.06] flex items-center justify-between text-xs min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-[11px] font-normal text-zinc-500 truncate">
                Avg: {leagueAvgOvr} OVR
              </span>
              {(state.youthDevQueue || 0) > 0 && (
                <span className="text-[9px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1 py-0.5 rounded shrink-0" title={`+${state.youthDevQueue} OVR banked from youth call-ups, matures next season`}>
                  ⏳ +{state.youthDevQueue}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium shrink-0 flex items-center gap-1 text-zinc-400">
              <span>{ovrDeltaText}</span>
            </span>
          </div>
        </div>

        {/* CARD 3: IMPACT BENTO (TOP ROW NEXT TO OVR) */}
        <div
          onClick={onShowImpact || onOpenMoraleModal}
          className="col-span-1 sm:col-span-1 lg:col-span-1 w-full bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-2xl p-4.5 sm:p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 group active:scale-[0.99]"
          title="Show club impact & governance details"
        >
          {/* Top Label */}
          <div className="relative z-10 flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              IMPACT
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium font-mono uppercase bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                {impactScore >= 80 ? (lang === 'de' ? 'Dominant' : 'Dominant') : impactScore >= 50 ? (lang === 'de' ? 'Stabil' : 'Stable') : (lang === 'de' ? 'Kritisch' : 'Volatile')}
              </span>
              <span className="text-zinc-500 group-hover:text-zinc-300 p-0.5 rounded transition text-xs">
                <i className="fas fa-arrow-up-right-from-square text-[10px]" />
              </span>
            </div>
          </div>

          {/* Center: Glowing Circular Ring with Number Inside */}
          <div className="relative z-10 my-auto py-2 flex items-center justify-center">
            <CircularRing
              value={impactScore}
              max={100}
              size={110}
              strokeWidth={7}
              color={impactScore >= 80 ? '#10b981' : impactScore >= 50 ? '#fbbf24' : '#f43f5e'}
              glowColor="rgba(255,255,255,0.1)"
            >
              <span className="text-3xl sm:text-[34px] font-semibold text-white tracking-tight leading-none tabular-nums">
                <CountUp value={impactScore} duration={850} />
              </span>
              <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest leading-none mt-1">
                Score
              </span>
            </CircularRing>
          </div>

          {/* Footer Subline: Governance & Benchmark */}
          <div className="relative z-10 pt-2.5 mt-2 border-t border-white/[0.06] flex items-center justify-between text-xs min-w-0">
            <span className="text-[11px] font-normal text-zinc-500 truncate">
              {lang === 'de' ? 'Governance-Index' : 'Governance Index'}
            </span>
            <span className="text-[10px] font-medium shrink-0 flex items-center gap-1 text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${impactScore >= 80 ? 'bg-emerald-400' : impactScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} />
              <span>{impactScore >= 80 ? 'Optimal' : impactScore >= 50 ? 'Stable' : 'Deficit'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM BENTO ROW: TREASURY, COACH, REPUTATION, LEADERBOARD             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
        {/* CARD 1: TREASURY */}
        <div
          onClick={onShowLedger}
          className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-2xl p-4.5 sm:p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 group active:scale-[0.99]"
          title="Open club ledger"
        >
          {/* Header row: Treasury title */}
          <div className="relative z-10 flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              TREASURY
            </span>
          </div>

          {/* Large Balance */}
          <div className="relative z-10 my-auto py-2">
            <span className="text-xl sm:text-2xl font-medium text-zinc-100 tracking-tight truncate tabular-nums block">
              <CountUp value={state.budget} formatValue={formatMoney} duration={950} />
            </span>
          </div>

          {/* Context subline: Net balance */}
          <div className="relative z-10 pt-2.5 mt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
            <span className="text-[11px] font-normal text-zinc-500">
              Net:
            </span>
            <span className={`text-[11px] font-medium tabular-nums ${financials.net < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
              {financials.net >= 0 ? '+' : ''}<CountUp value={financials.net} formatValue={formatMoney} duration={950} />
            </span>
          </div>
        </div>

        {/* CARD 2: COACH */}
        <div
          onClick={() => {
            if (onCoachMarket) onCoachMarket();
            else if (onOpenPhilosophyModal) onOpenPhilosophyModal();
            else if (onOpenCoachDossier) onOpenCoachDossier();
          }}
          className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-2xl p-4.5 sm:p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 group active:scale-[0.99]"
          title="Open Coach Overview & Tactical Philosophy"
        >
          {/* Top Row: Label */}
          <div className="relative z-10 flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              COACH
            </span>
          </div>

          {/* Center: Head Coach Name */}
          <div className="relative z-10 my-auto py-2 flex flex-col justify-center min-w-0">
            <span className="text-xl sm:text-2xl font-medium text-zinc-100 tracking-tight truncate block">
              {coachDisplayName}
            </span>
          </div>
        </div>

        {/* CARD 3: REPUTATION */}
        <div
          onClick={() => {
            if (onOpenClubProfile) onOpenClubProfile();
            else if (onShowCareerHistory) onShowCareerHistory();
          }}
          className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-2xl p-4.5 sm:p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 group active:scale-[0.99]"
          title="View club reputation details"
        >
          {/* Top Row: Label */}
          <div className="relative z-10 flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              REPUTATION
            </span>
          </div>

          {/* Center: REP number */}
          <div className="relative z-10 my-auto py-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-medium text-zinc-100 tracking-tight tabular-nums">
              {repVal}
            </span>
            <span className="text-xs font-medium text-zinc-400 tracking-wider">
              REP
            </span>
          </div>
        </div>

        {/* CARD 4: LEADERBOARD */}
        <div
          onClick={() => {
            if (onShowLeaderboard) onShowLeaderboard();
            else if (onShowCareerHistory) onShowCareerHistory();
          }}
          className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-2xl p-4.5 sm:p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 group active:scale-[0.99]"
          title="Open leaderboards & career standing"
        >
          {/* Top Row: Label */}
          <div className="relative z-10 flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              LEADERBOARD
            </span>
          </div>

          {/* Center: Total Points */}
          <div className="relative z-10 my-auto py-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-medium text-zinc-100 tracking-tight tabular-nums">
              {liveScore.toLocaleString()}
            </span>
            <span className="text-[11px] font-medium text-zinc-400 tracking-wider">
              PTS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
