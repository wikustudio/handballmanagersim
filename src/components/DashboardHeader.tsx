import React, { useState, useEffect, useRef } from 'react';
import { GameState, Language, UniverseMovement } from '../types';
import {
  getCountryFlag,
  getLeagueInfo,
  getDynamicLeagueAvgOvr,
  getOvrTierConfig,
  getDomesticCupInfo,
  getDomesticSupercupInfo,
  getClubHistoricContext,
  formatMoney,
  calculateClubFinancials,
  calculateLiveScore,
} from '../data/gameConstants';
import { CountUp } from './CountUp';
import { ClubLogo } from './ClubLogo';
import { useGameStore } from '../store/useGameStore';
import { openFeedbackModal } from '../utils/crashReporter';

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
  trackColor?: string;
  glowColor?: string;
  children?: React.ReactNode;
}> = ({
  value,
  max = 100,
  size = 96,
  strokeWidth = 8,
  color = '#10b981',
  trackColor = 'rgba(255, 255, 255, 0.07)',
  glowColor,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(max, Math.max(0, value)) / max;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
        style={glowColor ? { filter: `drop-shadow(0 0 8px ${glowColor})` } : undefined}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
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
  onShowTable,
  onShowLedger,
  onOpenPhilosophyModal,
  onOpenSkillsModal,
  onOpenCustomization,
  onOpenProfile,
  onOpenClubProfile,
  onShowImpact,
  onShowCareerHistory,
  onShowLeaderboard,
  onOpenMoraleModal,
  onOpenOvrModal,
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
  const leagueAvgOvr = getDynamicLeagueAvgOvr(state);
  const impactVal = Math.min(100, Math.max(0, Math.round(Number(state.clubImpactScore !== undefined ? state.clubImpactScore : 50))));
  const impactScore = impactVal;

  const bankruptcyRisk = (state.seasonsInDebt || 0) > 0 || (state.budget || 0) < 0;
  const isStructuredDebt = bankruptcyRisk && financials.net >= 0;

  const directorDisplayName = state.managerName || 'DIRECTOR';
  const coachDisplayName =
    state.currentCoach?.name ||
    (state.headCoachArchetype && state.headCoachArchetype !== 'Standard'
      ? `${state.managerName || 'Head Coach'} · ${state.headCoachArchetype}`
      : state.managerName || 'Head Coach');
  const currentClubHistory = (state.history || []).filter(
    h => (h.clubName && state.club?.name && h.clubName.trim().toLowerCase() === state.club.name.trim().toLowerCase()) ||
         (state.club?.id !== undefined && h.clubId !== undefined && (String(h.clubId) === String(state.club.id) || Number(h.clubId) === Number(state.club.id))) ||
         (!h.clubName && (state.history || []).length === 1)
  );

  const activeTacticKey = state.tactic || 'Total Handball';
  let consecutiveTacticSeasons = 0;
  for (let i = currentClubHistory.length - 1; i >= 0; i--) {
    if ((currentClubHistory[i] as any).tactic === activeTacticKey) {
      consecutiveTacticSeasons++;
    } else {
      break;
    }
  }
  const recentTacticSeasons = currentClubHistory.slice(-4).filter((h: any) => h.tactic === activeTacticKey).length;
  const computedTacticTenure = Math.max(consecutiveTacticSeasons + 1, recentTacticSeasons + 1);
  const tacticTenure = (state as any).tacticTenure || computedTacticTenure;
  const isTacticStale = Boolean(tacticTenure >= 3 || (state.staleTactic && state.staleTactic === activeTacticKey));

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
  const regCupTitle = 'Regional Cup';

  const earnedTrophyBadges = [
    { key: 'cwc', label: 'Club World Cup', count: clubTrophies.cwc, icon: 'fa-globe', theme: 'amber' },
    { key: 'cl', label: 'Euro Champions Cup', count: clubTrophies.cl, icon: 'fa-star', theme: 'amber' },
    { key: 'el', label: 'Euro Cup', count: clubTrophies.el, icon: 'fa-trophy', theme: 'orange' },
    { key: 'ecl', label: 'European Cup', count: clubTrophies.ecl, icon: 'fa-medal', theme: 'orange' },
    { key: 'bl', label: leagueName, count: clubTrophies.bl, icon: 'fa-trophy', theme: 'amber' },
    { key: 'dfb', label: domCupTitle, count: clubTrophies.dfb, icon: 'fa-award', theme: 'slate' },
    { key: 'sc', label: domSupercupTitle, count: clubTrophies.sc, icon: 'fa-bolt', theme: 'amber' },
    { key: 'reg', label: regCupTitle, count: clubTrophies.reg, icon: 'fa-shield-halved', theme: 'slate' },
    { key: 'lower', label: 'Lower Div', count: clubTrophies.lower, icon: 'fa-medal', theme: 'slate' },
  ].filter(t => t.count > 0);

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

  const displayOvr = safeBaseOvr;
  const ovrTierConfig = getOvrTierConfig(safeBaseOvr, leagueAvgOvr);

  // Match the bright emerald OVR ring from the reference design (rose when in relegation danger)
  const ovrRingStroke = ovrTierConfig.tier === 'relegation' ? '#f43f5e' : '#10b981';
  const ovrRingGlow = ovrTierConfig.tier === 'relegation' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)';

  const repVal = Math.min(100, Math.max(1, Math.round(state.reputation ?? state.club.rep ?? 50)));
  const liveScore = calculateLiveScore(state);

  const innerCardClass =
    'bg-[#161922] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all duration-200';

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* ========================================================================= */}
      {/* 0. TOP FEEDBACK STRIP                                                     */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#11131a] border border-white/[0.06] rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2 min-w-0">
          <i className="fas fa-comment-dots text-sky-400 text-xs shrink-0" />
          <span className="leading-relaxed">
            Help shape this game — report{' '}
            <button
              type="button"
              onClick={() => openFeedbackModal()}
              className="text-sky-400 hover:text-sky-300 underline underline-offset-2 font-medium cursor-pointer transition-colors"
            >
              feedback, wishes &amp; crashes
            </button>
            . Feedback is implemented weekly.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INSOLVENCY WARNING BANNER (Shown on real debt / insolvency warnings)   */}
      {/* ========================================================================= */}
      {bankruptcyRisk && (
        <div className="w-full bg-[#141720] border border-rose-500/30 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-300">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-xs text-rose-400 mt-0.5 sm:mt-0">
              <i className={`fas ${isStructuredDebt ? 'fa-shield-halved' : 'fa-triangle-exclamation'}`} />
            </span>
            <span className="font-normal leading-snug">
              Insolvency Risk (Year {Math.min(3, state.seasonsInDebt || 1)}/3): -€{Math.abs((state.budget || 0) / 1000000).toFixed(2)}M deficit.
              {isStructuredDebt && (
                <span className="ml-2 font-mono text-zinc-300 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded text-[10px]">
                  Structured
                </span>
              )}
            </span>
          </div>
          <button
            onClick={onShowLedger}
            className="text-xs font-medium text-zinc-200 hover:text-white transition sm:ml-2 shrink-0 cursor-pointer flex items-center gap-1 self-end sm:self-auto"
          >
            <span>Audit Treasury</span>
            <i className="fas fa-arrow-right text-[10px]" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OUTER EXECUTIVE CONTAINER (WRAPS ROW 1 + ROW 2 LIKE REFERENCE)         */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#12141c] border border-white/[0.06] rounded-[28px] p-3.5 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.55)] flex flex-col gap-3.5 sm:gap-4">
        {/* TOP BENTO ROW: CLUB IDENTITY (6-COL) + OVR (3-COL) + IMPACT (3-COL) */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 w-full">
          {/* CARD 1: CLUB IDENTITY */}
          <div className={`col-span-2 lg:col-span-6 w-full ${innerCardClass} p-4 sm:p-5 flex flex-col justify-between`}>
            <div className="flex flex-col gap-3">
              {/* Top Pill: League Standings Trigger */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onShowTable}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:text-sky-300 text-[10px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer group"
                  title="View League Standings"
                >
                  <i className="fas fa-list-ul text-[9px]" />
                  <span>{leagueName}</span>
                  <i className="fas fa-chevron-right text-[8px] opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {state.club.tier === 1 && (state.trophyDrought || 0) > 4 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{state.trophyDrought}yr Drought</span>
                  </span>
                )}
              </div>

              {/* Club Logo + Bold Large Name + Flag */}
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 mt-0.5">
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
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <h1
                    onClick={onOpenClubProfile || onOpenCustomization}
                    className="text-2xl sm:text-3xl md:text-[32px] font-bold text-white tracking-tight leading-normal py-0.5 truncate cursor-pointer hover:text-zinc-200 transition"
                    title="View Club Profile & History"
                  >
                    {state.club.name}
                  </h1>
                  <span className="text-base sm:text-lg shrink-0" title={state.club.country}>
                    {countryFlag}
                  </span>
                </div>
              </div>

              {/* Historic Description + Right Shield Customize Button */}
              <div className="flex items-center justify-between gap-3">
                <p
                  onClick={onOpenClubProfile}
                  className="text-xs sm:text-[13px] text-zinc-400 font-normal leading-relaxed cursor-pointer hover:text-zinc-300 transition flex-1"
                  title={historicContext}
                >
                  {historicContext || `Competing in the ${leagueName} (${state.year}/${String((state.year + 1) % 100).padStart(2, '0')} campaign).`}
                </p>

                <button
                  type="button"
                  onClick={onOpenCustomization}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.15] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                  title="Customize club"
                  aria-label="Customize club"
                >
                  <i className="fas fa-shield-halved text-xs" />
                </button>
              </div>
            </div>

            {/* Bottom Divider: Coloured Trophy Pills + Total Count */}
            <div
              onClick={onOpenClubProfile}
              className="pt-3 mt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs cursor-pointer group"
              title="View Club Trophies & Silverware"
            >
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <i className="fas fa-trophy text-amber-400 text-xs shrink-0 mr-1" />
                {earnedTrophyBadges.length > 0 ? (
                  earnedTrophyBadges.slice(0, 6).map((t) => {
                    const pillColors =
                      t.theme === 'amber'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : t.theme === 'orange'
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                        : 'bg-white/[0.05] border-white/[0.1] text-zinc-300';
                    const countColors =
                      t.theme === 'amber'
                        ? 'bg-amber-950/80 text-amber-200'
                        : t.theme === 'orange'
                        ? 'bg-orange-950/80 text-orange-200'
                        : 'bg-black/40 text-zinc-300';

                    return (
                      <span
                        key={`header-trophy-${t.key}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium truncate ${pillColors}`}
                      >
                        <i className={`fas ${t.icon} text-[9px] opacity-90`} />
                        <span>{t.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold tabular-nums ${countColors}`}>
                          {t.count}x
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[11px] text-zinc-500">No major honours recorded yet</span>
                )}
              </div>

              <span className="text-xs font-mono font-bold text-amber-400 group-hover:text-amber-300 transition flex items-center gap-1 shrink-0 tabular-nums">
                <span>{totalClubSilverware}</span>
                <i className="fas fa-chevron-right text-[9px] opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* CARD 2: OVR GAUGE CARD */}
          <div
            onClick={() => {
              if (onOpenOvrModal) onOpenOvrModal();
            }}
            className={`col-span-1 lg:col-span-3 w-full ${innerCardClass} ${isOvrPulsing ? 'border-emerald-400/50' : ''} p-4 sm:p-5 relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group active:scale-[0.99]`}
            title="Click to open squad rating breakdown"
          >
            {floatingDelta !== null && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 z-20 tabular-nums">
                {floatingDelta > 0 ? `+${floatingDelta}` : `${floatingDelta}`}
              </span>
            )}

            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
              OVR
            </span>

            <CircularRing
              value={displayOvr}
              max={100}
              size={98}
              strokeWidth={8.5}
              color={ovrRingStroke}
              glowColor={ovrRingGlow}
            >
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none tabular-nums">
                <CountUp value={displayOvr} duration={850} />
              </span>
            </CircularRing>

            {(state.youthDevQueue || 0) > 0 && (
              <span
                className="mt-2.5 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full tabular-nums"
                title={`+${state.youthDevQueue} OVR matures next season`}
              >
                +{state.youthDevQueue} Next Season
              </span>
            )}
          </div>

          {/* CARD 3: IMPACT GAUGE CARD */}
          <div
            onClick={onShowImpact || onOpenMoraleModal}
            className={`col-span-1 lg:col-span-3 w-full ${innerCardClass} p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer group active:scale-[0.99]`}
            title="Show club impact & governance details"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                IMPACT
              </span>
            </div>

            <div className="my-auto flex items-center justify-end pr-1 sm:pr-2">
              <CircularRing
                value={impactScore}
                max={100}
                size={56}
                strokeWidth={5}
                color="#0ea5e9"
                glowColor="rgba(14, 165, 233, 0.3)"
              >
                <i className="fas fa-bolt text-sky-400 text-sm" />
              </CircularRing>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none tabular-nums">
                <CountUp value={impactScore} duration={850} />
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECOND ROW INSIDE OUTER CONTAINER: 4 EXECUTIVE CARDS                  */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
          {/* SUB-CARD 1: SPORTING DIRECTOR */}
          <div
            onClick={() => {
              if (onOpenProfile) onOpenProfile();
              else if (onOpenSkillsModal) onOpenSkillsModal();
            }}
            className={`${innerCardClass} p-3.5 sm:p-5 flex flex-col justify-between min-h-[92px] sm:min-h-[108px] cursor-pointer group active:scale-[0.99]`}
            title="Open Manager Profile & Career Overview"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
              SPORTING DIRECTOR
            </span>

            <div className="mt-2 sm:mt-4">
              <span className="text-base sm:text-xl font-bold text-white uppercase tracking-tight leading-snug py-0.5 truncate block">
                {directorDisplayName}
              </span>
            </div>
          </div>

          {/* SUB-CARD 2: COACH & TACTICS */}
          <div
            onClick={() => {
              if (onCoachMarket) onCoachMarket();
              else if (onOpenPhilosophyModal) onOpenPhilosophyModal();
              else if (onOpenCoachDossier) onOpenCoachDossier();
            }}
            className={`${innerCardClass} p-3.5 sm:p-5 flex flex-col justify-between min-h-[92px] sm:min-h-[108px] cursor-pointer group active:scale-[0.99]`}
            title="Open Coach Dossier & Tactical Philosophy"
          >
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
                <span className="sm:hidden">COACH</span>
                <span className="hidden sm:inline">COACH &amp; TACTICS</span>
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCoachMarket) onCoachMarket();
                  else if (onOpenCoachDossier) onOpenCoachDossier();
                }}
                className="px-2 sm:px-2.5 py-0.5 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-[9px] sm:text-[10px] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
              >
                <i className="fas fa-user-astronaut text-[8px] sm:text-[9px]" />
                <span className="hidden xs:inline">Dossier</span>
              </span>
            </div>

            <div className="mt-1.5 sm:mt-2 min-w-0">
              <span className="text-sm sm:text-[17px] font-bold text-white tracking-tight leading-snug py-0.5 truncate block">
                {coachDisplayName}
              </span>
              <div
                onClick={(e) => {
                  if (onOpenPhilosophyModal) {
                    e.stopPropagation();
                    onOpenPhilosophyModal();
                  }
                }}
                className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 flex-wrap hover:text-sky-300 transition-colors"
                title="Change Tactical System"
              >
                <i className="fas fa-compass text-sky-400 text-[10px] sm:text-[11px] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-300 truncate">
                  {state.tactic || 'Total Handball'}
                </span>
                {isTacticStale && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[8px] sm:text-[9px] font-mono font-bold uppercase tabular-nums">
                    STALE (-{Math.min(4, tacticTenure)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SUB-CARD 3: REPUTATION */}
          <div
            onClick={() => {
              if (onOpenClubProfile) onOpenClubProfile();
              else if (onShowCareerHistory) onShowCareerHistory();
            }}
            className={`${innerCardClass} p-3.5 sm:p-5 flex items-center justify-between gap-2 sm:gap-3 min-h-[92px] sm:min-h-[108px] cursor-pointer group active:scale-[0.99]`}
            title="View club reputation details"
          >
            <div className="flex flex-col justify-between h-full min-w-0">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
                REPUTATION
              </span>

              <div className="mt-1.5 sm:mt-2">
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="text-xl sm:text-3xl font-bold text-white tracking-tight leading-none tabular-nums">
                    {repVal}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    REP
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-1 text-[10px] sm:text-[11px] text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                  <span className="truncate">
                    {repVal >= 85 ? 'Global Elite' : repVal >= 70 ? 'Continental Elite' : repVal >= 50 ? 'Established' : 'Emerging'}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <CircularRing
                value={repVal}
                max={100}
                size={42}
                strokeWidth={4}
                color="#f59e0b"
                glowColor="rgba(245, 158, 11, 0.25)"
              >
                <i className="fas fa-medal text-amber-400 text-[11px]" />
              </CircularRing>
            </div>
          </div>

          {/* SUB-CARD 4: SCORE / LEADERBOARD */}
          <div
            onClick={() => {
              if (onShowLeaderboard) onShowLeaderboard();
              else if (onShowCareerHistory) onShowCareerHistory();
            }}
            className={`${innerCardClass} p-3.5 sm:p-5 flex flex-col justify-between min-h-[92px] sm:min-h-[108px] cursor-pointer group active:scale-[0.99]`}
            title="Open leaderboards & career standing"
          >
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
                <span className="sm:hidden">SCORE</span>
                <span className="hidden sm:inline">SCORE / LEADERBOARD</span>
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] sm:text-[10px] font-bold tabular-nums shrink-0">
                +{state.skillPoints || 0} MP
              </span>
            </div>

            <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 min-w-0">
              <i className="fas fa-trophy text-amber-400 text-sm sm:text-lg shrink-0" />
              <span className="text-xl sm:text-3xl font-bold text-amber-400 tracking-tight leading-snug py-0.5 tabular-nums truncate">
                {liveScore.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
