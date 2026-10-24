import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Language } from '../types';
import { 
  formatNum, 
  formatMoney, 
  getLeagueMaxAttendance, 
  isReserveClub, 
  getLeagueInfo, 
  getClubHomeArena, 
  getClubCatchmentCeiling, 
  getCountryMult, 
  getPinnacleArenaCapacity, 
  getCountryEconomicProfile, 
  formatOrganicAttendance, 
  getClubStartingAttendance, 
  getCalibratedStartingFanbase,
  getCreditLimit,
  calculateClubFinancials
} from '../data/gameConstants';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs } from '../utils/modManager';
import { useGameStore } from '../store/useGameStore';
import { ClubLogo } from './ClubLogo';
import { useModalDismiss } from '../utils/modalUtils';
import { getIncrementalOptions } from './StadiumModal';

interface ArenaOverviewModalProps {
  state: GameState;
  lang: Language;
  onClose: () => void;
  creditLimit?: number;
  onExpand?: (cost: number, seats: number, fanBoost?: number) => void;
  onOpenUpgrades?: () => void;
  initialTab?: 'market' | 'trend' | 'strategy' | 'expansion';
}

interface YearlyAttendanceRecord {
  year: number;
  attendance: number;
  capacity: number;
  utilization: number;
  isManagerSeason: boolean;
}

type TabKey = 'market' | 'trend' | 'strategy' | 'expansion';
type FanStrategyKey = 'ultras' | 'community' | 'corporate' | 'balanced';

export const ArenaOverviewModal: React.FC<ArenaOverviewModalProps> = ({ 
  state, 
  lang, 
  onClose, 
  creditLimit,
  onExpand,
  onOpenUpgrades,
  initialTab = 'market'
}) => {
  useModalDismiss(onClose);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [isCatchmentOpen, setIsCatchmentOpen] = useState<boolean>(true);
  const [recentExpansionMessage, setRecentExpansionMessage] = useState<string | null>(null);

  const cap = state.club.stadium || 2000;
  const fans = state.club.fanBase || 1000;
  const country = state.club.country || 'GER';
  const pinnacleCap = getPinnacleArenaCapacity(country);
  const profile = getCountryEconomicProfile(country);
  const tier = state.club.tier || 1;
  const isReserve = isReserveClub(state.club.name);
  const league = getLeagueInfo(tier, country);
  const arenaName = getClubHomeArena(state.club);

  const effectiveCreditLimit = creditLimit ?? getCreditLimit(tier, country);

  const catchment = useMemo(() => getClubCatchmentCeiling(state.club, state), [state.club, state]);

  const baseClub = useMemo(() => {
    const activePool = getActiveClubs(country);
    return (
      activePool.find(c => c.id === state.club.id || (c.name && c.name.toLowerCase() === state.club.name.toLowerCase())) ||
      ALL_CLUBS.find(c => c.id === state.club.id || (c.name && c.name.toLowerCase() === state.club.name.toLowerCase()))
    );
  }, [state.club.id, state.club.name, country]);

  const baseStadium = baseClub?.stadium || Math.min(cap, 2000);

  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(4);

  // Strategy state
  const currentStrategy: FanStrategyKey = (state.club.fanStrategy || state.fanStrategy || 'balanced') as FanStrategyKey;
  const [selectedStrategy, setSelectedStrategy] = useState<FanStrategyKey>(currentStrategy);
  const setFanStrategy = useGameStore((s) => s.setFanStrategy);

  const handleSelectStrategy = (strat: FanStrategyKey) => {
    setSelectedStrategy(strat);
    if (setFanStrategy) {
      setFanStrategy(strat);
    } else {
      useGameStore.getState().updateState({
        fanStrategy: strat,
        club: { ...state.club, fanStrategy: strat },
        worldClubs: {
          ...(state.worldClubs || {}),
          [state.club.id]: {
            ...(state.worldClubs?.[state.club.id] || state.club),
            fanStrategy: strat
          }
        }
      });
    }
  };

  // Calculate 5-year historical attendance respecting past pre-expansion stadium capacity
  const fiveYearHistory = useMemo<YearlyAttendanceRecord[]>(() => {
    const currentYear = state.year;
    const records: YearlyAttendanceRecord[] = [];
    const leagueMax = getLeagueMaxAttendance(tier, isReserve, country, state.club.name, cap, fans, catchment.isMegaClub);

    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const histMatch = state.history?.find((h) => h.year === year && h.clubName === state.club.name);

      if (year === currentYear) {
        // Current season uses the canonical calculateClubFinancials engine so Arena Overview, Top Header, and Ledger match 100%
        const fin = calculateClubFinancials({
          ...state,
          club: { ...state.club, fanStrategy: selectedStrategy }
        } as any);
        const finalAtt = fin.expectedAtt;
        const util = Math.min(100, Math.round((finalAtt / cap) * 100));
        records.push({
          year,
          attendance: finalAtt,
          capacity: cap,
          utilization: util,
          isManagerSeason: true,
        });
      } else if (histMatch && histMatch.att) {
        let att = histMatch.att;
        // Determine capacity in that historical year (strictly preserve known stadium size):
        let recordedCap = (histMatch as any).stadium || cap || baseStadium;
        if (!recordedCap || recordedCap < att) {
          recordedCap = Math.max(cap, baseStadium, att);
        }
        // Heal display for past records that suffered from previous clamp artifacts
        if (recordedCap >= 15000 && fans >= 60000 && (att === 7500 || att === 14000 || att <= 8000)) {
          const pseudoRand = Math.abs(Math.sin(year * 31.415 + Number(state.club.id || 1) * 17.13 + state.club.baseOvr)) % 1;
          const variance = 0.94 + pseudoRand * 0.12;
          const demand = Math.round(fans * 0.16 * 1.15 * variance);
          att = Math.min(recordedCap, Math.max(Math.round(recordedCap * 0.90), demand));
        }
        att = formatOrganicAttendance(att, recordedCap, year);
        const util = Math.min(100, Math.round((att / recordedCap) * 100));
        records.push({
          year,
          attendance: att,
          capacity: recordedCap,
          utilization: util,
          isManagerSeason: true,
        });
      } else {
        // Pre-tenure or intervening archive years: check if the club had already been expanded in a prior tenure
        const pastClubTenures = (state.history || []).filter((h) => 
          (h.clubId !== undefined && (String(h.clubId) === String(state.club.id) || Number(h.clubId) === Number(state.club.id))) ||
          (h.clubName && state.club.name && h.clubName.trim().toLowerCase() === state.club.name.trim().toLowerCase())
        );
        const priorExpansions = pastClubTenures.filter(h => h.year <= year && (h.stadium || 0) > 0);
        const earliestTenureYear = pastClubTenures.length > 0 ? Math.min(...pastClubTenures.map(h => h.year)) : 9999;
        const pastYearCap = priorExpansions.length > 0 
          ? Math.max(...priorExpansions.map(h => h.stadium || 0))
          : (year >= earliestTenureYear ? cap : baseStadium);

        const baseStartAtt = getClubStartingAttendance({ ...state.club, stadium: pastYearCap });
        const pseudoRand = Math.abs(Math.sin(year * 31.415 + Number(state.club.id || 1) * 17.13 + (state.club.baseOvr || 70))) % 1;
        const variance = 0.95 + pseudoRand * 0.10;
        let modeledAtt = Math.round(baseStartAtt * variance);
        modeledAtt = Math.max(80, Math.min(pastYearCap, modeledAtt));
        modeledAtt = formatOrganicAttendance(modeledAtt, pastYearCap, year);
        const util = Math.min(100, Math.round((modeledAtt / pastYearCap) * 100));
        records.push({
          year,
          attendance: modeledAtt,
          capacity: pastYearCap,
          utilization: util,
          isManagerSeason: false,
        });
      }
    }
    return records;
  }, [state.year, state.club, state.history, tier, country, isReserve, cap, fans, baseStadium, selectedStrategy, catchment.isMegaClub]);

  const currentYearAtt = fiveYearHistory[fiveYearHistory.length - 1]?.attendance || Math.min(fans, cap);
  const currentUtil = Math.min(100, Math.round((currentYearAtt / cap) * 100));
  const fiveYearAvg = Math.round(fiveYearHistory.reduce((sum, r) => sum + r.attendance, 0) / fiveYearHistory.length);

  // Net ticket yield based on country economic profile, league tier, manager skills, and fan strategy (matching calculateClubFinancials)
  const cMult = getCountryMult(country);
  const baseNetYield = profile.baseTicketYield[tier] || 3;
  const hasUltraliebling = (state.managerSkills || []).includes('ultraliebling');
  const hasSalesmaster = (state.managerSkills || []).includes('salesmaster') || (state.managerSkills || []).includes('sponsor_boost');
  let matchdayMult = hasUltraliebling ? 1.12 : 1.0;
  if (hasSalesmaster) matchdayMult *= 1.08;
  if (selectedStrategy === 'corporate') matchdayMult *= 1.20;
  else if (selectedStrategy === 'ultras') matchdayMult *= 0.94;
  const effectiveTicketPrice = Math.max(2, Math.round(baseNetYield * matchdayMult));
  const avgMatchdayRev = currentYearAtt * effectiveTicketPrice;
  const annualMatchdayRev = avgMatchdayRev * 17;

  // Addressable Market Analytics
  const demandRate = useMemo(() => {
    let rate = 0.14; // 14% baseline matchday demand
    if (selectedStrategy === 'ultras') rate = 0.18;
    else if (selectedStrategy === 'community') rate = 0.16;
    else if (selectedStrategy === 'corporate') rate = 0.11;
    else if (selectedStrategy === 'balanced') rate = 0.14;

    if (tier === 1) rate += 0.02;
    return Math.min(0.20, Math.max(0.10, rate));
  }, [selectedStrategy, tier]);

  const isPinnacleArena = cap >= pinnacleCap;
  const isGiant = catchment.isMegaClub || ['Magdeburg', 'Kiel', 'Flensburg', 'Füchse Berlin', 'Barcelona', 'Veszprém', 'Veszprem', 'Kielce', 'Montpellier', 'Nantes', 'Aalborg', 'Pick Szeged'].some(n => state.club.name.includes(n));
  const perfMod = Math.max(-0.20, Math.min(0.25, ((state.club.baseOvr || 70) - (tier === 1 ? 80 : tier === 2 ? 69 : 60)) * 0.02));
  const megaMod = isGiant ? 1.15 : 1.0;

  // Matchday ticket demand: At minimum, equal to verified spectators inside the arena!
  // If the arena is at or near sellout (>= 95% utilization), excess demand turns fans away.
  const excessDemandRate = currentUtil >= 98 ? (0.12 + (isGiant ? 0.08 : 0.04)) : currentUtil >= 94 ? 0.04 : 0;
  const theoreticalFanDemand = Math.round(fans * (0.35 + demandRate * 1.5) * (1 + perfMod) * megaMod);
  const matchdayDemand = Math.max(
    currentYearAtt,
    Math.round(currentYearAtt * (1 + excessDemandRate)),
    Math.min(cap + Math.round(fans * 0.15), theoreticalFanDemand)
  );
  const lockedOutFans = Math.max(0, matchdayDemand - cap);
  const effectiveDemandRatePct = Math.round((matchdayDemand / Math.max(1, fans)) * 100);
  const addressableDemandRatio = Math.round((matchdayDemand / Math.max(1, cap)) * 100);
  const unrealizedRevenueAnnual = lockedOutFans * effectiveTicketPrice * 17;
  const isSelloutBottleneck = !isPinnacleArena && lockedOutFans > 0 && matchdayDemand > cap;

  // Market context descriptors and human-centered narrative for all European cities
  const marketCategory = catchment.cityCategory || 'mid';
  const marketTypeLabel = useMemo(() => {
    if (isReserve) return 'Academy Development Squad';
    if (catchment.isMegaClub && marketCategory === 'metro') return 'Metropolitan European Titan';
    if (catchment.isMegaClub) return 'European Handball Stronghold';
    if (marketCategory === 'stronghold') return 'Historic Handball Bastion';
    if (marketCategory === 'metro') return 'Metropolitan Sports Center';
    if (marketCategory === 'town' || tier >= 5) return 'Grassroots Community Market';
    return 'Regional Handball Hub';
  }, [isReserve, catchment.isMegaClub, marketCategory, tier]);

  const marketNarrative = useMemo(() => {
    if (isReserve) {
      return `Operating as the official youth development incubator in ${catchment.cityName} (~${formatNum(catchment.populationEstimate)} pop). While matchday gates are modest and attendance is capped by reserve squad limits, the club benefits from the immense prestige, infrastructure, and scouting gravity of its parent organization.`;
    }
    if (catchment.isMegaClub && marketCategory === 'metro') {
      return `A continental handball titan embedded in the world-class sports metropolis of ${catchment.cityName} (~${formatNum(catchment.populationEstimate)} pop). Competing alongside elite football and basketball giants, international silverware expands your supporter reach (~${formatNum(catchment.maxCeiling)} potential fans) across global broadcast markets while maintaining substantial urban expansion headroom (${catchment.saturation}% local saturation).`;
    }
    if (catchment.isMegaClub || (marketCategory === 'stronghold' && tier === 1)) {
      return `As an iconic handball powerhouse in ${catchment.cityName}, handball is the civic heartbeat. Decades of European silverware and domestic dominance expand your active supporter ceiling (~${formatNum(catchment.maxCeiling)} fans) far beyond municipal boundaries (~${formatNum(catchment.populationEstimate)} citizens), drawing devoted commuter caravans and regional purists.`;
    }
    if (marketCategory === 'stronghold') {
      return `Rooted in the historic handball shrine of ${catchment.cityName} (~${formatNum(catchment.populationEstimate)} pop). In this community, handball is the premier sporting religion, uniting local citizens and district commuters with generational loyalty and packed matchday atmospheres.`;
    }
    if (marketCategory === 'metro') {
      return `${catchment.cityName} is a premier metropolitan center of ~${formatNum(catchment.populationEstimate)} residents. In a crowded sports landscape with elite competition, consistent top-flight performance provides immense long-term commercial upside and untapped supporter headroom (${catchment.saturation}% current market penetration).`;
    }
    if (marketCategory === 'town' || tier >= 4) {
      return `Operating as a close-knit grassroots anchor in ${catchment.cityName} (~${formatNum(catchment.populationEstimate)} pop). Deep civic pride, volunteer stewardship, and passionate family roots foster honest community solidarity, drawing loyal fans from the immediate municipality and neighboring villages.`;
    }
    return `${catchment.cityName} represents an established regional sports hub (~${formatNum(catchment.populationEstimate)} pop) with a dedicated local core (~${catchment.cityCoreFans.toLocaleString()} supporters) and regular commuter interest across the district.`;
  }, [isReserve, catchment, marketCategory, tier]);

  // Expansion options
  const expansionOptions = useMemo(() => {
    return getIncrementalOptions(tier, country, cap);
  }, [tier, country, cap]);

  const fillPercentage = Math.min(100, (cap / pinnacleCap) * 100);
  const hasExpandedThisSeason = (state.stadiumExpandedThisSeason || 0) >= 1;

  const handleExecuteExpansion = (cost: number, seats: number, fanBoost?: number) => {
    const prevCap = state.club.stadium || 0;
    if (onExpand) {
      onExpand(cost, seats, fanBoost);
    } else if (state.expandStadium) {
      state.expandStadium(cost, seats, fanBoost);
    }
    const newCap = useGameStore.getState().club.stadium || 0;
    if (newCap > prevCap) {
      setRecentExpansionMessage(`Successfully added +${formatNum(newCap - prevCap)} seats to ${arenaName}!`);
      setTimeout(() => {
        setRecentExpansionMessage(null);
      }, 4500);
    }
  };

  // SVG Line Chart Dimensions
  const chartWidth = 540;
  const chartHeight = 150;
  const padLeft = 46;
  const padRight = 36;
  const padTop = 26;
  const padBottom = 26;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const maxDataAtt = Math.max(...fiveYearHistory.map((r) => r.attendance), cap);
  const maxYScale = Math.ceil(maxDataAtt * 1.08);

  const points = fiveYearHistory.map((rec, i) => {
    const x = padLeft + (i / Math.max(1, fiveYearHistory.length - 1)) * plotW;
    const y = padTop + (1 - rec.attendance / maxYScale) * plotH;
    return { ...rec, x, y, index: i };
  });

  const capY = Math.max(padTop - 6, padTop + (1 - cap / maxYScale) * plotH);

  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) * 0.2;
      const cp1y = p1.y + (p2.y - p0.y) * 0.2;
      const cp2x = p2.x - (p3.x - p1.x) * 0.2;
      const cp2y = p2.y - (p3.y - p1.y) * 0.2;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = createSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
    : '';

  const activeRecord = points[selectedYearIndex] || points[points.length - 1];

  // Fan Strategy Options Data
  const STRATEGIES: {
    id: FanStrategyKey;
    titleEn: string;
    icon: string;
    ovrBadge: string;
    revBadge: string;
    growthBadge: string;
    descEn: string;
    pillColor: string;
  }[] = [
    {
      id: 'ultras',
      titleEn: 'Acoustic Cauldron & Fan Clubs',
      icon: 'fa-drum',
      ovrBadge: '+2 Home OVR Boost',
      revBadge: '-8% Ticket Yield',
      growthBadge: 'High Intensity',
      descEn: 'Discount student & standing terraces, marching bass drums, and synchronized fan club choreos. Deafening arena noise (Hexenkessel) rattles visiting opponents in crunch home fixtures.',
      pillColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
    {
      id: 'community',
      titleEn: 'Grassroots & Family Movement',
      icon: 'fa-people-roof',
      ovrBadge: 'Neutral OVR',
      revBadge: '100% Base Rev',
      growthBadge: '+25% Fanbase Growth',
      descEn: 'Family sectors, school clinic visits, and regional grassroots partnerships. Accelerates long-term addressable market expansion and youth pull.',
      pillColor: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
    },
    {
      id: 'corporate',
      titleEn: 'VIP & Corporate Hospitality',
      icon: 'fa-champagne-glasses',
      ovrBadge: '-1 Home OVR',
      revBadge: '+30% Matchday Rev',
      growthBadge: 'Steady Growth',
      descEn: 'Executive lounges, premium corporate boxes, and high-margin catering. Generates maximum cashflow for player signings and arena debt.',
      pillColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    },
    {
      id: 'balanced',
      titleEn: 'Balanced Sporting Standard',
      icon: 'fa-scale-balanced',
      ovrBadge: '+0 OVR',
      revBadge: 'Standard Yield',
      growthBadge: 'Organic Growth',
      descEn: 'Traditional European handball ticketing and community engagement. Solid, steady performance across atmosphere, growth, and finances.',
      pillColor: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-300',
    },
  ];

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl cursor-pointer">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-[#14151e] rounded-[28px] border border-white/[0.04] w-full max-w-2xl relative z-10 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] cursor-default pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/40 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <ClubLogo
              name={state.club.name}
              color={state.club.color}
              logo={state.club.logo}
              className="w-11 h-11 rounded-xl border border-white/10 shrink-0 shadow-md"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/[0.08] px-2 py-0.5 rounded-md border border-sky-500/20">
                  {arenaName}
                </span>
                <span className="text-xs text-zinc-400 font-normal">
                  {league.name} · Tier {tier}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">
                {state.club.name} Arena & Operations Hub
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Persistent 4-Metric KPI Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:px-5 sm:py-3 bg-[#10121a] border-b border-white/[0.04] shrink-0">
          <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-2.5 flex flex-col">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
              Capacity
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-white tracking-tight tabular-nums">
                {formatNum(cap)}
              </span>
              <span className="text-[10px] text-zinc-500">seats</span>
            </div>
            <span className="text-[10px] text-zinc-500 truncate tabular-nums">
              Max: {formatNum(pinnacleCap)}
            </span>
          </div>

          <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-2.5 flex flex-col">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
              Active Fans
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-sky-300 tracking-tight tabular-nums">
                {formatNum(fans)}
              </span>
              <span className="text-[10px] text-zinc-500">base</span>
            </div>
            <span className="text-[10px] text-zinc-500 truncate tabular-nums">
              {effectiveDemandRatePct}% match demand
            </span>
          </div>

          <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-2.5 flex flex-col">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
              Season Fill
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-semibold tracking-tight tabular-nums ${currentUtil >= 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currentUtil}%
              </span>
              <span className="text-[10px] text-zinc-500">util</span>
            </div>
            <span className="text-[10px] text-zinc-500 truncate">
              {currentUtil >= 98 ? 'Consistently Sold Out' : 'Current Avg'}
            </span>
          </div>

          <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-2.5 flex flex-col">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
              Matchday Rev
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-emerald-400 tracking-tight tabular-nums truncate">
                {formatMoney(annualMatchdayRev)}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 truncate tabular-nums">
              ~{formatMoney(effectiveTicketPrice, country)} / ticket
            </span>
          </div>
        </div>

        {/* Tabbed Navigation Bar */}
        <div className="px-3 sm:px-5 pt-3 pb-2 shrink-0">
          <div className="bg-[#10121a] p-1 rounded-2xl border border-white/[0.04] grid grid-cols-4 gap-1">
            <button
              onClick={() => setActiveTab('market')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'market'
                  ? 'bg-sky-500/[0.08] text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              <i className="fas fa-chart-pie text-xs" />
              <span className="hidden sm:inline">Market & Demand</span>
              <span className="sm:hidden">Market</span>
            </button>

            <button
              onClick={() => setActiveTab('trend')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'trend'
                  ? 'bg-sky-500/[0.08] text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              <i className="fas fa-chart-line text-xs" />
              <span className="hidden sm:inline">5-Year Trend</span>
              <span className="sm:hidden">Trend</span>
            </button>

            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'strategy'
                  ? 'bg-sky-500/[0.08] text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              <i className="fas fa-bullhorn text-xs" />
              <span className="hidden sm:inline">Fan Strategy</span>
              <span className="sm:hidden">Strategy</span>
            </button>

            <button
              onClick={() => setActiveTab('expansion')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'expansion'
                  ? 'bg-sky-500/[0.08] text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              <i className="fas fa-hammer text-xs" />
              <span className="hidden sm:inline">Expansion</span>
              <span className="sm:hidden">Expand</span>
              {isSelloutBottleneck && !hasExpandedThisSeason && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content Viewport */}
        <div className="p-4 sm:p-5 pt-2 overflow-y-auto custom-scrollbar flex flex-col gap-4 flex-1 min-h-0">
          
          {/* Notification feedback for actions */}
          <AnimatePresence>
            {recentExpansionMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300 shrink-0"
              >
                <div className="flex items-center gap-2">
                  <i className="fas fa-circle-check text-emerald-400 text-sm" />
                  <span className="font-semibold">{recentExpansionMessage}</span>
                </div>
                <button
                  onClick={() => setRecentExpansionMessage(null)}
                  className="text-emerald-400/70 hover:text-emerald-300 cursor-pointer text-xs"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: MARKET & DEMAND ANALYTICS */}
          {activeTab === 'market' && (
            <div className="flex flex-col gap-4">
              {/* 1. METROPOLITAN MARKET & REGIONAL FAN CATCHMENT */}
              <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-4 sm:p-5 shadow-sm">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/[0.08] text-sky-300 border border-sky-500/20 flex items-center justify-center text-sm shrink-0 shadow-inner">
                      <i className="fas fa-city" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-none">
                          Market & Supporter Base
                        </h3>
                        <span className="text-[10px] font-semibold text-sky-300 bg-sky-500/[0.08] border border-sky-400/20 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                          <i className="fas fa-location-dot text-[9px]" /> {catchment.cityName}
                        </span>
                        <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/[0.08] border border-amber-500/20 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                          {marketTypeLabel}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>{league.name}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-300 font-medium">
                          {profile.tierName.includes(':') ? profile.tierName.split(':')[1].trim() : profile.tierName}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Market Saturation Meter Badge */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider block">
                        Market Penetration
                      </span>
                      <span className={`text-xs sm:text-sm font-semibold tabular-nums ${
                        catchment.saturation >= 90 ? 'text-emerald-400' : catchment.saturation >= 60 ? 'text-sky-300' : 'text-amber-300'
                      }`}>
                        {catchment.saturation}% of Local Ceiling
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 border ${
                      catchment.saturation >= 90
                        ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400'
                        : catchment.saturation >= 60
                        ? 'bg-sky-500/[0.08] border-sky-500/20 text-sky-400'
                        : 'bg-amber-500/[0.08] border-amber-500/20 text-amber-400'
                    }`}>
                      <i className={`fas ${catchment.saturation >= 90 ? 'fa-check-double' : catchment.saturation >= 60 ? 'fa-chart-pie' : 'fa-seedling'}`} />
                    </div>
                  </div>
                </div>

                {/* Streamlined Sporting & Regional Market Context */}
                <div className="bg-sky-500/[0.03] border border-sky-500/20 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2 mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fas fa-compass text-sky-400 text-xs" />
                      <span>Civic Profile</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {country} · Tier {tier}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                    {marketNarrative}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-white/[0.04] text-[11px]">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <i className="fas fa-city text-sky-400 text-xs shrink-0" />
                      <span>City Population: <strong className="text-white font-medium">~{formatNum(catchment.populationEstimate)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <i className="fas fa-users text-emerald-400 text-xs shrink-0" />
                      <span>Active Supporters: <strong className="text-white font-medium tabular-nums">{fans.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <i className="fas fa-ticket text-amber-400 text-xs shrink-0" />
                      <span>Matchday Crowd: <strong className="text-white font-medium tabular-nums">{currentYearAtt.toLocaleString()}</strong> ({currentUtil}%)</span>
                    </div>
                  </div>
                </div>

                {/* 4-Stage Visual Market-to-Matchday Conversion Funnel */}
                <div className="pt-3.5">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <i className="fas fa-filter text-sky-400 text-xs" />
                      <span>Market Conversion Pipeline</span>
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Metro Pool → Fanbase → Matchday Gate
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* Stage 1: Metro Population */}
                    <div className="bg-[#10121a] p-3 rounded-2xl border border-white/[0.04] flex flex-col justify-between relative overflow-hidden group hover:border-white/[0.1] transition">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                        <span className="font-medium text-zinc-300 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-semibold text-white">1</span>
                          <span>Metro Population</span>
                        </span>
                        <i className="fas fa-city text-zinc-500" />
                      </div>
                      <div>
                        <span className="font-semibold text-white tabular-nums text-sm sm:text-base block tracking-tight">
                          ~{formatNum(catchment.populationEstimate)}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                          {catchment.cityName} metro pool
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-2.5">
                        <div className="h-full bg-slate-400 rounded-full w-full" />
                      </div>
                    </div>

                    {/* Stage 2: Fan Catchment Ceiling */}
                    <div className="bg-[#10121a] p-3 rounded-2xl border border-white/[0.04] flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/30 transition">
                      <div className="flex items-center justify-between text-[10px] text-sky-300 mb-1">
                        <span className="font-medium text-sky-200 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[9px] font-semibold">2</span>
                          <span>Fan Catchment</span>
                        </span>
                        <i className="fas fa-users-rays text-sky-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-sky-300 tabular-nums text-sm sm:text-base block tracking-tight">
                          ~{formatNum(catchment.maxCeiling)}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                          Regional fan ceiling
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-2.5">
                        <div
                          className="h-full bg-sky-400 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((catchment.maxCeiling / Math.max(catchment.populationEstimate, catchment.maxCeiling)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Stage 3: Current Fanbase */}
                    <div className="bg-[#10121a] p-3 rounded-2xl border border-white/[0.04] flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition">
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 mb-1">
                        <span className="font-medium text-emerald-300 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-semibold">3</span>
                          <span>Club Fanbase</span>
                        </span>
                        <i className="fas fa-users text-emerald-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-400 tabular-nums text-sm sm:text-base block tracking-tight">
                          {fans.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                          {catchment.saturation}% local penetration
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-2.5">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, catchment.saturation)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stage 4: Matchday Gate & Demand */}
                    <div className="bg-[#10121a] p-3 rounded-2xl border border-white/[0.04] flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/30 transition">
                      <div className="flex items-center justify-between text-[10px] text-amber-300 mb-1">
                        <span className="font-medium text-amber-200 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px] font-semibold">4</span>
                          <span>Matchday Gate</span>
                        </span>
                        <i className="fas fa-ticket text-amber-400" />
                      </div>
                      <div>
                        <span className="font-semibold text-amber-300 tabular-nums text-sm sm:text-base block tracking-tight">
                          {currentYearAtt.toLocaleString()} <span className="text-[10px] font-normal text-zinc-400">/{cap.toLocaleString()}</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                          {currentUtil}% arena utilization
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-2.5">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, currentUtil)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. MATCHDAY DEMAND VS ARENA CAPACITY CARD */}
              <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                isSelloutBottleneck
                  ? 'bg-[#14151e] border-amber-500/25 shadow-[0_4px_24px_rgba(245,158,11,0.08)]'
                  : 'bg-[#14151e] border-white/[0.04]'
              }`}>
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      isSelloutBottleneck ? 'bg-amber-500/[0.08] text-amber-300 border border-amber-500/20' : 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <i className={`fas ${isSelloutBottleneck ? 'fa-fire' : 'fa-ticket'}`} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-none">
                        Matchday Gate & Physical Capacity
                      </h3>
                      <span className="text-[11px] text-zinc-400">
                        {arenaName} · {cap.toLocaleString()} Total Seats
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                    addressableDemandRatio > 105
                      ? 'bg-rose-500/[0.08] border-rose-500/20 text-rose-300'
                      : addressableDemandRatio >= 90
                      ? 'bg-amber-500/[0.08] border-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300'
                  }`}>
                    {currentUtil}% Utilization
                  </span>
                </div>

                {/* Visual Demand vs Capacity Bar */}
                <div className="flex flex-col gap-1.5 pt-3.5">
                  <div className="flex justify-between text-xs text-zinc-300 flex-wrap gap-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Seats Filled: <strong className="text-white font-medium tabular-nums">{currentYearAtt.toLocaleString()}</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Matchday Demand: <strong className="text-amber-300 font-medium tabular-nums">{matchdayDemand.toLocaleString()}</strong></span>
                      {lockedOutFans > 0 && (
                        <span className="text-[10px] text-rose-400 font-medium">(+{lockedOutFans.toLocaleString()} locked out)</span>
                      )}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white/[0.06] rounded-full overflow-hidden flex relative">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full"
                      style={{ width: `${Math.min(100, (currentYearAtt / Math.max(cap, matchdayDemand)) * 100)}%` }}
                    />
                    {lockedOutFans > 0 && (
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-r-full"
                        style={{ width: `${Math.min(100, (lockedOutFans / Math.max(cap, matchdayDemand)) * 100)}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Strategic Context Status Alert */}
                {isPinnacleArena ? (
                  <div className="mt-3.5 bg-sky-500/[0.04] border border-sky-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs">
                    <span className="text-sky-400 text-sm mt-0.5">🏆</span>
                    <p className="text-zinc-200 leading-relaxed font-normal">
                      <strong className="text-sky-300 font-medium">Pinnacle European Fortress:</strong> Your <strong className="text-white font-medium">{cap.toLocaleString()}-seat</strong> venue has reached the maximum national stadium limit for {country}. Matchday demand is <strong className="text-white font-medium">{matchdayDemand.toLocaleString()} spectators</strong> with <strong className="text-emerald-400 font-medium">{currentUtil}% utilization</strong>.
                    </p>
                  </div>
                ) : isSelloutBottleneck ? (
                  <div className="mt-3.5 bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
                      <p className="text-zinc-200 leading-relaxed font-normal">
                        <strong className="text-amber-300 font-medium">Capacity Bottleneck:</strong> Matchday ticket demand is <strong className="text-white font-medium">{matchdayDemand.toLocaleString()}</strong>, exceeding your <strong className="text-white font-medium">{cap.toLocaleString()}-seat</strong> capacity and turning away <strong className="text-white font-medium">{lockedOutFans.toLocaleString()} fans</strong> every match. Expanding unlocks up to <strong className="text-emerald-300 font-medium">+{formatMoney(unrealizedRevenueAnnual)}</strong> in ticket revenue annually.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('expansion')}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition cursor-pointer shadow-sm active:scale-95 text-center flex items-center justify-center gap-1.5"
                    >
                      <i className="fas fa-hammer text-xs" />
                      <span>Review Expansion →</span>
                    </button>
                  </div>
                ) : cap >= 12000 && currentUtil < 55 ? (
                  <div className="mt-3.5 bg-rose-500/[0.04] border border-rose-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs">
                    <span className="text-rose-400 text-sm mt-0.5">⚠️</span>
                    <p className="text-zinc-200 leading-relaxed font-normal">
                      <strong className="text-rose-300 font-medium">Oversized Arena Drag:</strong> Your venue operates at only <strong className="text-rose-300 font-medium">{currentUtil}% utilization</strong> ({Math.max(0, cap - currentYearAtt).toLocaleString()} empty seats). Fixed overhead creates financial pressure until winning results expand your supporter base.
                    </p>
                  </div>
                ) : addressableDemandRatio >= 75 ? (
                  <div className="mt-3.5 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs">
                    <span className="text-emerald-400 text-sm mt-0.5">🏟️</span>
                    <p className="text-zinc-200 leading-relaxed font-normal">
                      <strong className="text-emerald-300 font-medium">Optimal Arena Utilization:</strong> With matchday ticket demand at <strong className="text-white font-medium">{matchdayDemand.toLocaleString()} spectators</strong> ({currentYearAtt.toLocaleString()} attending), your venue operates at an optimal <strong className="text-emerald-300 font-medium">{currentUtil}% fill rate</strong>.
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-zinc-400 leading-relaxed border-t border-white/[0.04] pt-2 font-normal">
                    <i className="fas fa-check-circle text-emerald-400 mr-1.5" />
                    Current capacity ({cap.toLocaleString()} seats) comfortably accommodates average matchday crowds ({currentYearAtt.toLocaleString()} attendees, {currentUtil}% fill rate). Room to grow as your {fans.toLocaleString()} supporter base expands across {catchment.cityName} (metro population ~{formatNum(catchment.populationEstimate)}).
                  </p>
                )}
              </div>

              {/* 3. PROGRESSIVE DISCLOSURE DRAWER: Demographic Catchment Details */}
              <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsCatchmentOpen(!isCatchmentOpen)}
                  className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/[0.08] text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs shrink-0">
                      <i className="fas fa-map-location-dot" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white tracking-tight">
                          Demographic Catchment Ceiling: {catchment.cityName}
                        </span>
                        <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/[0.08] border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                          {marketTypeLabel}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-0.5 font-normal">
                        {catchment.saturation}% Supporter Saturation · Metro Population: ~{formatNum(catchment.populationEstimate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[11px] font-semibold text-sky-400 hidden sm:inline">
                      {isCatchmentOpen ? 'Hide Breakdown' : 'Inspect Catchment Composition'}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 text-xs">
                      <i className={`fas fa-chevron-${isCatchmentOpen ? 'up' : 'down'}`} />
                    </div>
                  </div>
                </button>

                {isCatchmentOpen && (
                  <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 border-t border-white/[0.04] flex flex-col gap-3">
                    {/* Catchment Composition Visual Stacked Bar */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>Regional Ceiling Build-up (~{catchment.maxCeiling.toLocaleString()} Potential Supporters)</span>
                        <span className="font-semibold text-zinc-300">{catchment.saturation}% Saturated</span>
                      </div>
                      <div className="h-2.5 w-full bg-white/[0.06] rounded-full overflow-hidden flex gap-0.5">
                        <div
                          className="h-full bg-indigo-500 rounded-l-full"
                          style={{ width: `${Math.round((catchment.cityCoreFans / Math.max(1, catchment.maxCeiling)) * 100)}%` }}
                          title={`City Core Base: ${catchment.cityCoreFans.toLocaleString()}`}
                        />
                        <div
                          className="h-full bg-sky-400"
                          style={{ width: `${Math.round((catchment.regionalPerimeterFans / Math.max(1, catchment.maxCeiling)) * 100)}%` }}
                          title={`Regional Perimeter: ${catchment.regionalPerimeterFans.toLocaleString()}`}
                        />
                        {catchment.isMegaClub && catchment.megaStatusFans > 0 && (
                          <div
                            className="h-full bg-amber-400 rounded-r-full"
                            style={{ width: `${Math.round((catchment.megaStatusFans / Math.max(1, catchment.maxCeiling)) * 100)}%` }}
                            title={`Mega Club Silverware Prestige: ${catchment.megaStatusFans.toLocaleString()}`}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>City Core ({Math.round((catchment.cityCoreFans / Math.max(1, catchment.maxCeiling)) * 100)}%)</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          <span>Regional Commuters ({Math.round((catchment.regionalPerimeterFans / Math.max(1, catchment.maxCeiling)) * 100)}%)</span>
                        </span>
                        {catchment.isMegaClub && catchment.megaStatusFans > 0 && (
                          <span className="flex items-center gap-1 text-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span>Prestige & Silverware ({Math.round((catchment.megaStatusFans / Math.max(1, catchment.maxCeiling)) * 100)}%)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4 Detail Metric Boxes */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="bg-[#10121a] p-2.5 rounded-2xl border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-400 block font-medium">City Core Base</span>
                        <span className="font-semibold text-white tabular-nums text-sm">{catchment.cityCoreFans.toLocaleString()}</span>
                        <span className="text-[9px] text-zinc-500 block mt-0.5">{catchment.cityName} municipal core</span>
                      </div>
                      <div className="bg-[#10121a] p-2.5 rounded-2xl border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-400 block font-medium">Regional Perimeter</span>
                        <span className="font-semibold text-sky-300 tabular-nums text-sm">+{catchment.regionalPerimeterFans.toLocaleString()}</span>
                        <span className="text-[9px] text-zinc-500 block mt-0.5">Commuter belt & transit reach</span>
                      </div>
                      <div className="bg-[#10121a] p-2.5 rounded-2xl border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-400 block font-medium">Mega Club Status</span>
                        <span className={`font-semibold tabular-nums text-sm ${catchment.isMegaClub ? 'text-amber-300' : 'text-zinc-500'}`}>
                          {catchment.isMegaClub ? `+${catchment.megaStatusFans.toLocaleString()}` : 'Standard'}
                        </span>
                        <span className="text-[9px] text-zinc-500 block mt-0.5">{catchment.isMegaClub ? 'Silverware prestige reach' : 'Requires elite silverware'}</span>
                      </div>
                      <div className="bg-[#10121a] p-2.5 rounded-2xl border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-400 block font-medium">Absolute Fan Ceiling</span>
                        <span className="font-semibold text-emerald-400 tabular-nums text-sm">{catchment.maxCeiling.toLocaleString()}</span>
                        <span className="text-[9px] text-zinc-500 block mt-0.5">Max addressable fan pool</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-1.5 border-t border-white/[0.04] leading-relaxed font-normal">
                      <span>
                        Supporter ceiling combines immediate {catchment.cityName} municipal fans with regional district commuters{catchment.isMegaClub ? ' and European silverware prestige' : ''}.
                      </span>
                      <span className="font-semibold text-zinc-300 tabular-nums shrink-0 ml-2">{catchment.saturation}% saturated</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 5-YEAR ATTENDANCE TREND */}
          {activeTab === 'trend' && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-sky-500/[0.08] border border-sky-500/20 text-sky-400 flex items-center justify-center text-xs shrink-0">
                      <i className="fas fa-chart-line" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-none">
                        5-Year Attendance Trend
                      </h3>
                      <span className="text-[10px] text-zinc-400">
                        {state.year - 4} – {state.year} (Click any season to inspect)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block">
                      5-Yr Average
                    </span>
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {fiveYearAvg.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* SVG Line Chart */}
                <div className="w-full relative bg-[#10121a] rounded-2xl border border-white/[0.04] p-1 overflow-hidden select-none">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto overflow-visible"
                  >
                    <defs>
                      <linearGradient id="arenaAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                        <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>

                      <linearGradient id="arenaLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="50%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>

                      <filter id="arenaGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.5" />
                      </filter>
                    </defs>

                    {/* Horizontal Baseline and Grid Lines */}
                    <line
                      x1={padLeft}
                      y1={padTop + plotH}
                      x2={chartWidth - padRight}
                      y2={padTop + plotH}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />

                    <line
                      x1={padLeft}
                      y1={padTop + plotH * 0.5}
                      x2={chartWidth - padRight}
                      y2={padTop + plotH * 0.5}
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />

                    {/* Capacity Guideline */}
                    <line
                      x1={padLeft}
                      y1={capY}
                      x2={chartWidth - padRight}
                      y2={capY}
                      stroke="#fbbf24"
                      strokeOpacity="0.55"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={chartWidth - padRight}
                      y={Math.max(14, capY - 4)}
                      textAnchor="end"
                      fill="#fbbf24"
                      fontSize="9"
                      fontWeight="600"
                      opacity="0.9"
                    >
                      Cap: {cap.toLocaleString()}
                    </text>

                    {/* Gradient Area Fill */}
                    <path d={areaPath} fill="url(#arenaAreaGrad)" />

                    {/* Curved Attendance Line */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#arenaLineGrad)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      filter="url(#arenaGlow)"
                    />

                    {/* Data Points */}
                    {points.map((pt, i) => {
                      const isSelected = selectedYearIndex === i;
                      const isCurrent = pt.year === state.year;

                      return (
                        <g
                          key={`pt-${pt.year}-${i}`}
                          className="cursor-pointer transition-all duration-200"
                          onClick={() => setSelectedYearIndex(i)}
                        >
                          {isSelected && (
                            <line
                              x1={pt.x}
                              y1={pt.y}
                              x2={pt.x}
                              y2={padTop + plotH}
                              stroke="#38bdf8"
                              strokeOpacity="0.5"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                          )}

                          {(isSelected || isCurrent) && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isSelected ? 10 : 7}
                              fill="#38bdf8"
                              fillOpacity={isSelected ? 0.3 : 0.15}
                            />
                          )}

                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isSelected ? 5.5 : 4}
                            fill={isCurrent ? '#38bdf8' : isSelected ? '#10b981' : '#0f172a'}
                            stroke={isCurrent ? '#ffffff' : isSelected ? '#34d399' : '#38bdf8'}
                            strokeWidth="2.2"
                          />

                          <g transform={`translate(${pt.x}, ${Math.max(16, pt.y - 12)})`}>
                            <rect
                              x="-23"
                              y="-10"
                              width="46"
                              height="14"
                              rx="4"
                              fill={isSelected ? '#0284c7' : '#14151e'}
                              stroke={isSelected ? '#38bdf8' : 'rgba(255,255,255,0.06)'}
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="1"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="8.5"
                              fontWeight={isSelected ? '600' : '500'}
                              dominantBaseline="middle"
                            >
                              {pt.attendance.toLocaleString()}
                            </text>
                          </g>

                          <text
                            x={pt.x}
                            y={chartHeight - 8}
                            textAnchor="middle"
                            fill={isSelected ? '#38bdf8' : isCurrent ? '#67e8f9' : '#94a3b8'}
                            fontSize="9.5"
                            fontWeight={isSelected || isCurrent ? '600' : '500'}
                          >
                            {pt.year}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Interactive 5-Season Data Strip */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {fiveYearHistory.map((rec, i) => {
                    const isSelected = selectedYearIndex === i;
                    const isCurrent = rec.year === state.year;

                    return (
                      <button
                        key={`strip-yr-${rec.year}-${i}`}
                        onClick={() => setSelectedYearIndex(i)}
                        className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/[0.08] border-sky-500/40 shadow-sm'
                            : isCurrent
                            ? 'bg-white/[0.03] border-sky-500/25 hover:bg-white/[0.06]'
                            : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className={`text-[10px] font-semibold tabular-nums ${isSelected ? 'text-sky-300' : isCurrent ? 'text-sky-400' : 'text-zinc-400'}`}>
                          {rec.year}
                        </span>
                        <span className="text-[11px] font-semibold text-white tabular-nums tracking-tight mt-0.5">
                          {rec.attendance.toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full mt-1 ${
                          rec.utilization >= 90
                            ? 'text-amber-300 bg-amber-500/15'
                            : rec.utilization >= 75
                            ? 'text-emerald-300 bg-emerald-500/15'
                            : 'text-zinc-400 bg-white/[0.04]'
                        }`}>
                          {rec.utilization}% cap
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Year Detail Callout */}
                {activeRecord && (
                  <div className="bg-[#10121a] rounded-2xl p-3 border border-white/[0.04] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="font-semibold text-white">
                        {activeRecord.year} {activeRecord.year === state.year ? '(Current Season)' : ''}:
                      </span>
                      <span className="text-zinc-300 font-normal tabular-nums">
                        {activeRecord.attendance.toLocaleString()} / {activeRecord.capacity.toLocaleString()} seats
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-[11px]">
                        {activeRecord.isManagerSeason ? 'Under Your Tenure' : 'Club Archive'}
                      </span>
                      <span className={`font-semibold tabular-nums ${activeRecord.utilization >= 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {activeRecord.utilization}% Fill
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FAN & COMMERCIAL STRATEGY */}
          {activeTab === 'strategy' && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs shrink-0">
                      <i className="fas fa-bullhorn" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-none">
                        Fan & Commercial Strategy
                      </h3>
                      <span className="text-[10px] text-zinc-400">
                        Directly impacts Home OVR, Matchday Revenue, and Fan Growth
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/[0.08] px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Live Impact
                  </span>
                </div>

                {/* Strategy Selection Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STRATEGIES.map((strat) => {
                    const isSelected = selectedStrategy === strat.id;

                    return (
                      <div
                        key={strat.id}
                        onClick={() => handleSelectStrategy(strat.id)}
                        className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                          isSelected
                            ? 'bg-sky-500/[0.06] border-sky-400/30 shadow-sm ring-1 ring-sky-400/20'
                            : 'bg-[#10121a] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]'
                        }`}
                      >
                        {/* Top Row: Icon + Title + Selected Indicator */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] shrink-0 ${
                              isSelected ? 'bg-sky-400 text-slate-950 font-semibold' : 'bg-white/[0.05] text-zinc-400'
                            }`}>
                              <i className={`fas ${strat.icon}`} />
                            </span>
                            <span className="text-xs font-semibold text-white tracking-tight truncate">
                              {strat.titleEn}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center text-[10px] font-semibold shrink-0">
                              ✓
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-white/20 group-hover:border-white/40 shrink-0" />
                          )}
                        </div>

                        {/* Impact Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${strat.pillColor}`}>
                            {strat.ovrBadge}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-300">
                            {strat.revBadge}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                            {strat.growthBadge}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                          {strat.descEn}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTEGRATED ARENA EXPANSION */}
          {activeTab === 'expansion' && (
            <div className="flex flex-col gap-3.5">
              {/* Capacity Progress Bento */}
              <div className="bg-[#14151e] rounded-2xl border border-white/[0.04] p-4 flex flex-col gap-2.5 shrink-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fas fa-building text-sky-400 text-xs" />
                    <span>Arena Capacity Progress</span>
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                      {formatNum(cap)}
                    </span>
                    <span className="text-xs text-zinc-500 font-normal">/ {formatNum(pinnacleCap)} seats</span>
                  </div>
                </div>

                {/* Progress Bar with Gradient Glow */}
                <div className="w-full bg-white/[0.06] h-2.5 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${fillPercentage}%` }} 
                  />
                </div>

                <div className="flex justify-between text-[11px] text-zinc-400 font-normal">
                  <span>{Math.round(fillPercentage)}% of national pinnacle potential</span>
                  <span className="text-sky-400 font-semibold tabular-nums">{profile.tierName}</span>
                </div>
              </div>

              {/* Maximum Mega Capacity Alert */}
              {cap >= pinnacleCap && (
                <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <i className="fas fa-crown text-base" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">Maximum Pinnacle Capacity Achieved ({formatNum(pinnacleCap)} Seats)</h3>
                    <p className="text-xs text-zinc-300 mt-0.5 leading-snug font-normal">
                      Your arena has achieved the pinnacle stadium capacity for {country}&apos;s handball sporting landscape ({formatNum(pinnacleCap)} seats). No further expansions are permitted.
                    </p>
                  </div>
                </div>
              )}

              {/* Expansion Options Packages */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <i className="fas fa-layer-group text-zinc-400 text-[10px]" />
                    <span>{cap >= pinnacleCap ? 'Expansion Closed' : 'Available Expansion Packages'}</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Budget Available: <strong className="text-emerald-400 tabular-nums font-semibold">{formatMoney(state.budget + effectiveCreditLimit)}</strong>
                  </span>
                </div>

                {expansionOptions.map((opt, i) => {
                  const affordable = state.budget + effectiveCreditLimit >= opt.cost;
                  const effectiveMaxCap = isReserve ? 1500 : pinnacleCap;
                  const seatsToAdd = Math.min(opt.seats, Math.max(0, effectiveMaxCap - cap));
                  const targetCapacity = cap + seatsToAdd;
                  const isReserveBlocked = isReserve && (cap >= 1500 || targetCapacity > 1500);
                  const isMaxed = cap >= effectiveMaxCap || seatsToAdd <= 0 || isReserveBlocked;
                  const isCranesLocked = ((state.facilitiesUpgradedThisSeason || 0) + (state.infraActionsThisSeason || 0)) >= 2;
                  const isBlockedBySeasonQuota = hasExpandedThisSeason || isCranesLocked;

                  return (
                    <div
                      key={`stad-opt-${i}`}
                      className={`relative overflow-hidden p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        affordable && !isMaxed && !isBlockedBySeasonQuota
                          ? 'bg-[#10121a] hover:bg-white/[0.03] border-white/[0.04] hover:border-sky-500/30 shadow-sm'
                          : 'bg-white/[0.015] border-white/[0.04] opacity-50'
                      }`}
                    >
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border text-xs font-semibold mt-0.5 sm:mt-0 ${
                            affordable && !isMaxed && !isBlockedBySeasonQuota
                              ? 'bg-sky-500/[0.08] text-sky-400 border-sky-500/20' 
                              : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
                          }`}>
                            <i className="fas fa-plus text-xs" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white text-sm tracking-tight">{opt.label}</span>
                              <span className="text-[10px] font-semibold text-sky-400/90 bg-sky-500/[0.08] border border-sky-500/20 px-1.5 py-0.5 rounded">
                                {opt.tag}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 font-normal leading-snug">
                              {opt.desc}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1 font-medium flex items-center gap-1.5">
                              <span>New Total:</span>
                              <strong className="text-zinc-300 font-semibold tabular-nums">
                                {formatNum(targetCapacity)} seats {isReserve ? '(Reserve Cap: 1,500)' : targetCapacity >= pinnacleCap ? '(Pinnacle Cap)' : ''}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                          <div className="text-left sm:text-right">
                            <div className="font-semibold text-white text-sm tabular-nums">
                              {formatMoney(opt.cost)}
                            </div>
                            {isReserveBlocked ? (
                              <div className="text-[10px] font-semibold text-amber-400 mt-0.5">
                                Reserve Cap (1,500)
                              </div>
                            ) : !affordable ? (
                              <div className="text-[10px] font-semibold text-rose-400 mt-0.5">
                                Insufficient Funds
                              </div>
                            ) : isBlockedBySeasonQuota ? (
                              <div className="text-[10px] font-semibold text-amber-400 mt-0.5">
                                {isCranesLocked && !hasExpandedThisSeason ? 'Cranes Used (2/2)' : 'Quota Used (1/1)'}
                              </div>
                            ) : null}
                          </div>

                          <button
                            disabled={!affordable || isMaxed || isBlockedBySeasonQuota}
                            onClick={() => handleExecuteExpansion(opt.cost, seatsToAdd, opt.fanBoost)}
                            className={`px-4 py-2 rounded-xl font-semibold text-xs tracking-wide transition cursor-pointer active:scale-95 ${
                              affordable && !isMaxed && !isBlockedBySeasonQuota
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] border border-blue-400/30'
                                : 'bg-white/[0.04] text-zinc-500 cursor-not-allowed border border-white/[0.04]'
                            }`}
                          >
                            Expand
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Action Button Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.04] bg-[#14151e] flex items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-medium">
              Expansion Season Status:
            </span>
            <span className="text-xs font-semibold text-zinc-300">
              {hasExpandedThisSeason
                ? '1/1 Expansion completed this season'
                : 'Expansion project available'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'expansion' && !isPinnacleArena && (
              <button
                onClick={() => setActiveTab('expansion')}
                className="py-2 px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-sky-300 font-semibold text-xs transition cursor-pointer border border-sky-400/20 flex items-center gap-1.5"
              >
                <i className="fas fa-hammer text-xs" />
                <span>Expansion</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-medium text-xs transition cursor-pointer border border-white/[0.04]"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
