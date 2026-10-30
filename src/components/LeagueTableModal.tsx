import React, { useState, useMemo } from 'react';
import { Club, GameState, Language, SeasonHistory, UniverseMovement } from '../types';
import { getLeagueInfo, isReserveClub, getMinAllowedTierForReserve, getMaxTier, COUNTRIES, sanitizePlayerName, isCanadianMLSClub } from '../data/gameConstants';
import { getContinentalCupNames, getRegion, getRegionalQualificationLegend } from '../utils/regionHelpers';
import { ClubLogo } from './ClubLogo';
import { REAL_CLUB_ALIASES, simplifyClubName } from '../engine/moddingEngine';
import { autoRepairClubsDb, autoRepairSingleClub } from '../utils/modSafeguards';
import { t as tr } from '../data/translations';
import { getAllUniverseMovements, isMajorUniverseHeadline, getHeadlineCategory } from '../utils/universeMovements';
import { getParentClub } from '../engine/simulateAiLeagues';

interface TableRow {
  pos: number;
  id?: number | string;
  name: string;
  color: string;
  logo?: string;
  mp: number; // Matches Played
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
  gd: string;
  isUser: boolean;
  isRival?: boolean;
  isReserve?: boolean;
  pointsDeducted?: number;
  form: ('W' | 'D' | 'L')[];
  status?: 'C' | 'P' | 'R';
}

interface LeagueTableModalProps {
  state: GameState;
  clubsDb: Club[];
  lang: Language;
  isModActive?: boolean;
  onClose: () => void;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const seededRand = (seed: number, min: number, max: number) => {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
};

const getHistoryOutcome = (
  h: any,
  nextSeasonH?: any,
  archive?: Record<number, Record<number, any[]>>
): 'C' | 'P' | 'R' | undefined => {
  if (h.status === 'C' || h.status === 'P' || h.status === 'R') return h.status;
  if (h.pos === 1) return 'C';
  if (archive?.[h.year]?.[h.tier]) {
    const rows = archive[h.year][h.tier];
    if (Array.isArray(rows)) {
      const userRow = rows.find(
        (r: any) =>
          r.isUser ||
          (r.id != null && (r.id === h.clubId || String(r.id) === String(h.clubId))) ||
          (r.name && h.clubName && r.name.toLowerCase().trim() === h.clubName.toLowerCase().trim())
      );
      if (userRow?.status) return userRow.status;
    }
  }
  const isSameClubNext = nextSeasonH && (
    (h.clubId != null && nextSeasonH.clubId === h.clubId) ||
    (h.clubName && nextSeasonH.clubName?.toLowerCase().trim() === h.clubName.toLowerCase().trim())
  );
  if (isSameClubNext && nextSeasonH.tier < h.tier) return 'P';
  if (isSameClubNext && nextSeasonH.tier > h.tier) return 'R';
  if (h.tier > 1 && h.pos <= 2 && !isReserveClub(h.clubName)) return 'P';
  return undefined;
};

export const LeagueTableModal: React.FC<LeagueTableModalProps> = ({
  state,
  clubsDb,
  lang,
  isModActive,
  onClose,
}) => {
  const t = (en: string, _de?: string) => en;

  const sanitizedClubsDb = useMemo(() => autoRepairClubsDb(clubsDb, Boolean(isModActive), state), [clubsDb, isModActive, state]);
  const effectiveUserClub = useMemo(() => autoRepairSingleClub(state.club, Boolean(isModActive)), [state.club, isModActive]);

  // Primary Tab: 'standings' (The Local Table) or 'universe' (The Living World)
  const [activeTab, setActiveTab] = useState<'standings' | 'universe'>('standings');

  // Universe Movements Filter (defaults to 'headlines' for high-impact world events)
  const [movementFilter, setMovementFilter] = useState<'headlines' | 'domestic' | 'cups' | 'career' | 'all'>('headlines');
  const [cupRegionFilter, setCupRegionFilter] = useState<'ALL' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'UEFA' | 'WORLD'>('ALL');
  const [universeSeasonFilter, setUniverseSeasonFilter] = useState<'latest' | 'all' | number>('latest');

  const history = state.history || [];
  
  // View selector: 'current' (active ongoing campaign) or index in history (0..history.length-1)
  const [selectedSeason, setSelectedSeason] = useState<'current' | number>('current');

  // Determine active inspect context
  const isCurrentView = selectedSeason === 'current';
  const inspectedHist: SeasonHistory | null = !isCurrentView && typeof selectedSeason === 'number'
    ? history[selectedSeason]
    : null;

  const userActiveTier = inspectedHist ? inspectedHist.tier : effectiveUserClub.tier;
  const currentCountry = inspectedHist ? (inspectedHist.country || effectiveUserClub.country || 'GER') : (effectiveUserClub.country || 'GER');
  const maxTierForCountry = getMaxTier(currentCountry, sanitizedClubsDb);

  // Selected Tier Pill (managers can scout Tier 1, Tier 2, Tier 3, etc.)
  const [selectedTier, setSelectedTier] = useState<number>(Math.min(userActiveTier, maxTierForCountry));
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const universeScrollRef = React.useRef<HTMLDivElement>(null);

  // Synchronize and clamp tier if max tier changes, but DO NOT force reset when season changes to allow free navigation
  React.useEffect(() => {
    setSelectedTier((prev) => Math.min(prev, maxTierForCountry));
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [maxTierForCountry, selectedSeason]);

  React.useEffect(() => {
    if (universeScrollRef.current) {
      universeScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [movementFilter, universeSeasonFilter, cupRegionFilter]);

  const effectiveSelectedTier = Math.min(Math.max(1, selectedTier), maxTierForCountry);
  const currentLeagueInfo = getLeagueInfo(effectiveSelectedTier, currentCountry);
  const yearTag = inspectedHist ? `${inspectedHist.year}` : `${state.year}`;
  const leagueTag = currentLeagueInfo.tag || `Tier ${effectiveSelectedTier}`;

  const isReserveTeam = (name: string) => {
    if (name === 'SSV Jeddeloh II' || name.toLowerCase().includes('jeddeloh ii')) return false;
    return isReserveClub(name);
  };

  const canPromoteReserve = (clubName: string, projectedOffset: number = 0): boolean => {
    const targetTier = effectiveSelectedTier - 1;
    if (targetTier < 1) return false;
    if (!isReserveTeam(clubName)) return true;

    // Rule 1: Country-specific reserve ceiling (POR/ESP/ECU/USA: max Tier 2; GER & others: max Tier 3)
    const minAllowedTier = getMinAllowedTierForReserve(currentCountry);
    if (targetTier < minAllowedTier) return false;

    // Rule 2: Separation from senior parent club (must stay at least 1 tier below parent)
    const parent = getParentClub(clubName, sanitizedClubsDb, currentCountry);
    if (parent && targetTier <= parent.tier) return false;

    // Rule 3: Max 4 reserves per division cap
    const reservesInTargetTier = sanitizedClubsDb.filter(
      c => (c.country || 'GER') === currentCountry && c.tier === targetTier && isReserveTeam(c.name)
    ).length;
    
    if (reservesInTargetTier + projectedOffset >= 4) return false;

    return true;
  };

  const isTier1Only = maxTierForCountry === 1;
  const isBottomTier = effectiveSelectedTier >= maxTierForCountry;
  const regionalLegend = getRegionalQualificationLegend(currentCountry);

  const isUserInCurrentTier = (effectiveUserClub.tier === effectiveSelectedTier) && ((effectiveUserClub.country || 'GER') === currentCountry);
  const hasPromotionPlayoffs = (currentCountry === 'ENG' || currentCountry === 'USA' || currentCountry === 'SCO' || currentCountry === 'ESP' || currentCountry === 'ITA' || currentCountry === 'FRA') && effectiveSelectedTier > 1;

  // Retrieve clubs residing in this tier
  const minReserveTier = getMinAllowedTierForReserve(currentCountry);
  let leagueClubs = sanitizedClubsDb
    .filter((c) => c.tier === effectiveSelectedTier && (c.country || 'GER') === currentCountry && (isUserInCurrentTier ? c.id !== effectiveUserClub.id : true) && !(effectiveSelectedTier < minReserveTier && isReserveTeam(c.name)))
    .map((c) => ({ ...c }));

  // Deduplicate clubs by canonical identity & name (e.g. prune duplicate unmodded Dortmund II when mod is active)
  const getCanonicalDedupeKey = (clubName: string): string => {
    const lower = clubName.toLowerCase().trim();
    if (REAL_CLUB_ALIASES[lower] != null) {
      return `alias_${REAL_CLUB_ALIASES[lower]}`;
    }
    const lowerNoRes = lower.replace(/\s+res\.?$/i, '').replace(/\s+reserve$/i, '').trim();
    if (REAL_CLUB_ALIASES[lowerNoRes] != null) {
      return `alias_${REAL_CLUB_ALIASES[lowerNoRes]}`;
    }
    const isReserve = isReserveTeam(clubName);
    const cleanParent = clubName
      .replace(/\s+Res\.?$/i, '')
      .replace(/\s+Reserve$/i, '')
      .replace(/\s+II$/, '')
      .replace(/\s+\(?B\)?$/, '')
      .replace(/\s+Castilla$/, '')
      .replace(/\s+B$/, '')
      .replace(/\s+2$/, '')
      .trim()
      .toLowerCase();
    const parentAlias = REAL_CLUB_ALIASES[cleanParent];
    if (parentAlias != null) {
      return `parent_${parentAlias}_${isReserve}`;
    }
    return `simp_${simplifyClubName(cleanParent)}_${isReserve}`;
  };

  if (isModActive) {
    leagueClubs.sort((a, b) => {
      const aLower = a.name.toLowerCase().trim();
      const bLower = b.name.toLowerCase().trim();
      const aIsFallback = aLower.startsWith('prussia') || aLower.startsWith('bavaria') || aLower.startsWith('baden');
      const bIsFallback = bLower.startsWith('prussia') || bLower.startsWith('bavaria') || bLower.startsWith('baden');
      if (!aIsFallback && bIsFallback) return -1;
      if (aIsFallback && !bIsFallback) return 1;
      return 0;
    });
  }

  const isMajorPyramid = ['GER', 'ENG', 'ESP', 'ITA', 'FRA'].includes(currentCountry);

  const seenIdentities = new Set<string>();
  const seenClubIds = new Set<number | string>();
  if (isUserInCurrentTier) {
    seenIdentities.add(getCanonicalDedupeKey(effectiveUserClub.name));
    if (effectiveUserClub.id != null) seenClubIds.add(effectiveUserClub.id);
  }
  leagueClubs = leagueClubs.filter(c => {
    if (c.id != null && seenClubIds.has(c.id)) return false;
    // For smaller non-major leagues with custom IDs, avoid aggressive regex stripping collisions
    const key = isMajorPyramid ? getCanonicalDedupeKey(c.name) : c.name.toLowerCase().trim();
    if (seenIdentities.has(key)) return false;
    seenIdentities.add(key);
    if (c.id != null) seenClubIds.add(c.id);
    return true;
  });

  const authenticCount = sanitizedClubsDb.filter(c => 
    (c.country || 'GER') === currentCountry && 
    c.tier === effectiveSelectedTier && 
    (effectiveSelectedTier < minReserveTier ? !isReserveTeam(c.name) : true)
  ).length;

  const targetTotalClubs = 18;
  const targetAiCount = isUserInCurrentTier ? Math.max(0, targetTotalClubs - 1) : targetTotalClubs;

  if (leagueClubs.length > targetAiCount) {
    leagueClubs = leagueClubs.slice(0, targetAiCount);
  }

  // Sourcing candidate clubs: Strictly query immediate adjacent tier (T+1) sorted by baseOvr DESC
  const existingClubIds = new Set([effectiveUserClub.id, ...leagueClubs.map((c) => c.id)]);
  if (leagueClubs.length < targetAiCount) {
    const rivalNameLower = (state.currentRival?.name || '').toLowerCase().trim();
    const sameCountryOtherClubs = sanitizedClubsDb
      .filter(
        (c) =>
          (c.country || 'GER') === currentCountry &&
          !existingClubIds.has(c.id) &&
          c.id !== state.currentRival?.id &&
          (!rivalNameLower || c.name.toLowerCase().trim() !== rivalNameLower) &&
          c.tier === effectiveSelectedTier + 1 &&
          (effectiveSelectedTier < minReserveTier ? !isReserveTeam(c.name) : true) &&
          (effectiveSelectedTier === 1 ? c.baseOvr >= 70 : true)
      )
      .sort((a, b) => b.baseOvr - a.baseOvr);

    for (const c of sameCountryOtherClubs) {
      if (leagueClubs.length >= targetAiCount) break;
      existingClubIds.add(c.id);
      leagueClubs.push({
        ...c,
        tier: effectiveSelectedTier,
      });
    }
  }

  // Country authentic fallbacks for extra fillers
  const engFallbackNames = effectiveSelectedTier === 1 ? [
    'Leeds United', 'Leicester City', 'Southampton', 'Norwich City', 'West Bromwich Albion',
    'Middlesbrough', 'Coventry City', 'Sunderland', 'Watford', 'Stoke City'
  ] : [
    'Scunthorpe United', 'Torquay United', 'Yeovil Town', 'Rochdale', 'Oldham Athletic',
    'Southend United', 'Maidstone United', 'Kidderminster Harriers', 'Dorking Wanderers', 'York City'
  ];

  const gerFallbackNames = effectiveSelectedTier === 1 ? [
    'FC Schalke 04', 'Hertha BSC', '1. FC Nürnberg', 'Hannover 96', 'Fortuna Düsseldorf',
    'Hamburger SV', 'SpVgg Greuther Fürth', 'SC Paderborn 07', '1. FC Magdeburg', 'Eintracht Braunschweig'
  ] : [
    'VfR Aalen', 'Kickers Offenbach', 'Wuppertaler SV', 'FC Homburg', 'Chemnitzer FC',
    'Carl Zeiss Jena', 'SV Meppen', 'FSV Zwickau', 'Fortuna Köln', 'Alemannia Aachen'
  ];

  const espFallbackNames = effectiveSelectedTier === 1 ? [
    'RCD Espanyol', 'Real Valladolid', 'Levante UD', 'Sporting Gijón', 'Real Oviedo',
    'Real Zaragoza', 'Elche CF', 'CD Tenerife', 'SD Eibar', 'Albacete Balompié'
  ] : [
    'CE Europa', 'UE Sant Andreu', 'Marbella FC', 'SD Logroñés', 'Real Avilés Industrial',
    'CD Guadalajara', 'Yeclano Deportivo', 'CD Tudelano', 'CF Talavera', 'CF Badalona'
  ];

  const itaFallbackNames = effectiveSelectedTier === 1 ? [
    'Parma Calcio', 'Palermo', 'Sampdoria', 'Bari', 'Brescia',
    'Venezia', 'Spezia', 'Cremonese', 'Modena', 'Catanzaro'
  ] : [
    'Virtus Entella', 'Pro Vercelli', 'Triestina', 'Vicenza Calcio', 'Lucchese',
    'Pescara', 'Foggia', 'SPAL', 'Novara', 'Ancona'
  ];

  const fraFallbackNames = effectiveSelectedTier === 1 ? [
    'Girondins de Bordeaux', 'AS Saint-Étienne', 'AJ Auxerre', 'Angers SCO', 'SM Caen',
    'EA Guingamp', 'Paris FC', 'Grenoble Foot', 'Rodez AF', 'Pau FC'
  ] : [
    'Le Mans FC', 'FC Villefranche', 'LB Chateuroux', 'SAS Épinal', 'GOAL FC',
    'FC Rouen', 'Red Star FC', 'US Avranches', 'SO Cholet', 'Nîmes Olympique'
  ];

  const fallbackList =
    currentCountry === 'ENG' ? engFallbackNames :
    currentCountry === 'ESP' ? espFallbackNames :
    currentCountry === 'ITA' ? itaFallbackNames :
    currentCountry === 'FRA' ? fraFallbackNames :
    currentCountry === 'GER' ? gerFallbackNames :
    [];

  const neededFillers = Math.max(0, targetAiCount - leagueClubs.length);
  const allKnownDbNames = new Set([
    ...sanitizedClubsDb.map((c) => c.name.toLowerCase().trim()),
    effectiveUserClub.name.toLowerCase().trim(),
    ...(state.currentRival?.name ? [state.currentRival.name.toLowerCase().trim()] : []),
  ]);
  for (let i = 0; i < neededFillers; i++) {
    const existingNames = new Set([
      ...allKnownDbNames,
      ...leagueClubs.map((c) => c.name.toLowerCase().trim()),
    ]);
    const availableFallback =
      fallbackList.find((n) => !existingNames.has(n.toLowerCase().trim())) ||
      `${COUNTRIES[currentCountry]?.name || currentCountry} Club ${i + 1}`;

    leagueClubs.push({
      id: 9900 + i,
      name: availableFallback,
      tier: effectiveSelectedTier,
      baseOvr: currentLeagueInfo.avgOvr + seededRand((state.year || 2024) + i, -4, 4),
      color: '#' + Math.floor(seededRandom((state.year || 2024) * 10 + i) * 16777215).toString(16).padStart(6, '0'),
      stadium: 15000,
      country: currentCountry,
    });
  }

  // Ensure minimum size
  while (leagueClubs.length < targetAiCount) {
    const idx = leagueClubs.length;
    leagueClubs.push({
      id: 9900 + idx,
      name: `${COUNTRIES[currentCountry]?.name || currentCountry} Club ${idx + 1}`,
      tier: effectiveSelectedTier,
      baseOvr: currentLeagueInfo.avgOvr + seededRand((state.year || 2024) + idx, -4, 4),
      color: '#' + Math.floor(seededRandom((state.year || 2024) * 10 + idx) * 16777215).toString(16).padStart(6, '0'),
      stadium: 15000,
      country: currentCountry,
    });
  }

  // Check for insolvent giant clubs in this tier
  const insolventClubInTable = leagueClubs.find(c => c.isInsolventGiant) || 
    (state.lastInsolventGiantNotice && state.lastInsolventGiantNotice.tier === effectiveSelectedTier && state.lastInsolventGiantNotice.country === currentCountry
      ? { name: state.lastInsolventGiantNotice.clubName }
      : null);

  // Generate synthetic Form string (e.g. W, D, L)
  const generateForm = (seedNum: number, wins: number, draws: number, losses: number): ('W' | 'D' | 'L')[] => {
    const total = wins + draws + losses;
    if (total === 0) return [];
    const form: ('W' | 'D' | 'L')[] = [];
    const pool: ('W' | 'D' | 'L')[] = [];
    for (let k = 0; k < wins; k++) pool.push('W');
    for (let k = 0; k < draws; k++) pool.push('D');
    for (let k = 0; k < losses; k++) pool.push('L');
    
    for (let i = 0; i < Math.min(5, total); i++) {
      const idx = Math.floor(seededRandom(seedNum + i * 17) * pool.length);
      form.push(pool[idx] || (i % 2 === 0 ? 'W' : 'D'));
    }
    return form;
  };

  const tableData: TableRow[] = [];

  // Identify rival (only if the rival genuinely belongs to effectiveSelectedTier)
  const isRivalMatch = (clubName: string, clubId?: number | string) => {
    if (!state.currentRival) return false;
    const matchesIdentity =
      clubName === state.currentRival.name ||
      (clubId != null && clubId === state.currentRival.id);
    if (!matchesIdentity) return false;
    const rivalNameLower = (state.currentRival.name || '').toLowerCase().trim();
    const rivalInDb = sanitizedClubsDb.find(
      (c) => c.id === state.currentRival?.id || (rivalNameLower && c.name.toLowerCase().trim() === rivalNameLower)
    );
    if (rivalInDb && rivalInDb.tier !== effectiveSelectedTier) return false;
    return true;
  };

  if (isCurrentView) {
    const isMidSeason = state.seasonPhase === 'mid';

    if (!isMidSeason) {
      // PRE-SEASON TABLE (0 MATCHES PLAYED)
      const userDebtDeduction = (state.seasonsInDebt || 0) > 0
        ? ((state.seasonsInDebt || 0) === 1 ? Math.min(5, Math.max(2, Math.floor(Math.abs(state.budget) / 2000))) : Math.min(15, Math.max(3, Math.floor(Math.abs(state.budget) / 2000) * (state.seasonsInDebt || 1))))
        : (state.budget < -500 ? Math.min(2, Math.max(1, Math.floor(Math.abs(state.budget) < 500000 ? 1 : 2))) : undefined);

      const allClubs = [
        ...(isUserInCurrentTier ? [{
          id: effectiveUserClub.id,
          name: effectiveUserClub.name,
          color: effectiveUserClub.color,
          logo: effectiveUserClub.logo,
          baseOvr: effectiveUserClub.baseOvr,
          isUser: true,
          isReserve: isReserveTeam(effectiveUserClub.name),
          pointsDeducted: userDebtDeduction
        }] : []),
        ...leagueClubs.map((c) => {
          const isDebtPenalized = insolventClubInTable && c.name === insolventClubInTable.name;
          return {
            id: c.id,
            name: c.name,
            color: c.color,
            logo: c.logo,
            baseOvr: c.baseOvr,
            isUser: false,
            isReserve: isReserveTeam(c.name),
            pointsDeducted: isDebtPenalized ? 2 : undefined
          };
        }),
      ];

      allClubs.sort((a, b) => {
        const bEff = b.baseOvr + seededRand(state.year * 10 + (typeof b.id === 'number' ? b.id : 0), -4, 4);
        const aEff = a.baseOvr + seededRand(state.year * 10 + (typeof a.id === 'number' ? a.id : 0), -4, 4);
        return bEff - aEff;
      });

      allClubs.slice(0, targetTotalClubs).forEach((c, idx) => {
        tableData.push({
          pos: idx + 1,
          id: c.id,
          name: c.name,
          color: c.color,
          logo: isModActive ? c.logo : undefined,
          mp: 0,
          w: 0,
          d: 0,
          l: 0,
          gf: 0,
          ga: 0,
          pts: 0,
          gd: '0',
          isUser: c.isUser,
          isReserve: c.isReserve,
          isRival: isRivalMatch(c.name, c.id),
          pointsDeducted: c.pointsDeducted,
          form: []
        });
      });
    } else {
      // MID-SEASON PROGRESSION (MATCHDAY 17)
      const midRows: TableRow[] = [];

      const userDebtDeduction = (state.seasonsInDebt || 0) > 0
        ? ((state.seasonsInDebt || 0) === 1 ? Math.min(5, Math.max(2, Math.floor(Math.abs(state.budget) / 2000))) : Math.min(15, Math.max(3, Math.floor(Math.abs(state.budget) / 2000) * (state.seasonsInDebt || 1))))
        : (state.budget < -500 ? Math.min(2, Math.max(1, Math.floor(Math.abs(state.budget) < 500000 ? 1 : 2))) : undefined);

      // 1. Sort AI clubs by strength
      const sortedAi = [...leagueClubs].sort((a, b) => {
        const aScore = a.baseOvr + seededRand(state.year * 10 + (typeof a.id === 'number' ? a.id : 1), -4, 4);
        const bScore = b.baseOvr + seededRand(state.year * 10 + (typeof b.id === 'number' ? b.id : 1), -4, 4);
        return bScore - aScore;
      });

      // Realistic 17-game points distribution curve
      const baseCurve = [40, 37, 34, 31, 29, 27, 25, 24, 23, 22, 20, 19, 18, 16, 15, 13, 11, 8];
      const aiLimit = targetAiCount;
      const aiSlice = sortedAi.slice(0, aiLimit);

      if (isUserInCurrentTier) {
        const meta = state.pendingSeasonState?._meta;
        const hasLockedFirstHalf = meta?.firstHalfOutcomes?.length === 17;
        const rawUserMidPts = hasLockedFirstHalf && typeof meta.firstHalfPts === 'number'
          ? meta.firstHalfPts
          : (meta?.midPts ?? state.midSeasonPts ?? 22);
        const netUserMidPts = userDebtDeduction ? Math.max(0, rawUserMidPts - userDebtDeduction) : rawUserMidPts;
        const rawMidPos = typeof meta?.midPos === 'number'
          ? meta.midPos
          : Math.max(1, Math.min(18, Math.round(18 - ((rawUserMidPts - 8) / 36) * 17)));
        const targetMidPos = Math.max(1, Math.min(18, rawMidPos + (userDebtDeduction ? Math.floor(userDebtDeduction / 2.5) : 0)));

        let userWins = hasLockedFirstHalf && typeof meta.firstHalfWins === 'number'
          ? meta.firstHalfWins
          : Math.min(17, Math.max(0, Math.floor(rawUserMidPts / 3)));
        let userDraws = hasLockedFirstHalf && typeof meta.firstHalfDraws === 'number'
          ? meta.firstHalfDraws
          : Math.min(17 - userWins, Math.max(0, rawUserMidPts - userWins * 3));
        let userLosses = hasLockedFirstHalf && typeof meta.firstHalfLosses === 'number'
          ? meta.firstHalfLosses
          : Math.max(0, 17 - userWins - userDraws);
        let userGf = hasLockedFirstHalf && typeof meta.firstHalfGf === 'number'
          ? meta.firstHalfGf
          : Math.max(10, Math.round(userWins * 1.8 + userDraws * 1.0 + seededRand(state.year, 3, 8)));
        let userGa = hasLockedFirstHalf && typeof meta.firstHalfGa === 'number'
          ? meta.firstHalfGa
          : Math.max(8, Math.round(userLosses * 1.7 + userDraws * 0.9 + seededRand(state.year, 2, 6)));
        let userGd = userGf - userGa;
        const userForm = hasLockedFirstHalf && meta.firstHalfOutcomes
          ? meta.firstHalfOutcomes.slice(-5).map((m) => m.result)
          : generateForm(state.year * 100, userWins, userDraws, userLosses);

        const posMidPts: number[] = new Array(19).fill(0);
        posMidPts[targetMidPos] = netUserMidPts;
        for (let p = targetMidPos - 1; p >= 1; p--) {
          const curveVal = (baseCurve[p - 1] || 22) + seededRand(state.year * 7 + p, -1, 1);
          posMidPts[p] = Math.min(49, Math.max(posMidPts[p + 1] + 1, curveVal));
        }
        for (let p = targetMidPos + 1; p <= 18; p++) {
          const curveVal = (baseCurve[p - 1] || 12) + seededRand(state.year * 7 + p, -1, 1);
          posMidPts[p] = Math.max(2, Math.min(posMidPts[p - 1] - 1, curveVal));
        }

        let aiIdx = 0;
        for (let p = 1; p <= 18; p++) {
          if (p === targetMidPos) {
            tableData.push({
              pos: p,
              id: effectiveUserClub.id,
              name: effectiveUserClub.name,
              color: effectiveUserClub.color,
              logo: isModActive ? effectiveUserClub.logo : undefined,
              mp: 17,
              w: userWins,
              d: userDraws,
              l: userLosses,
              gf: userGf,
              ga: userGa,
              pts: netUserMidPts,
              gd: userGd > 0 ? `+${userGd}` : `${userGd}`,
              isUser: true,
              isReserve: isReserveTeam(effectiveUserClub.name),
              isRival: false,
              pointsDeducted: userDebtDeduction,
              form: userForm
            });
          } else {
            const c = aiSlice[aiIdx++] || { id: 9900 + p, name: `Club ${p}`, color: '#64748b', baseOvr: 65 };
            const isDebtPenalized = insolventClubInTable && c.name === insolventClubInTable.name;
            const aiDeduction = isDebtPenalized ? 2 : undefined;
            const pts = posMidPts[p] || 18;
            const rawPts = aiDeduction ? pts + aiDeduction : pts;
            let w = Math.min(17, Math.max(0, Math.floor(rawPts / 3)));
            let d = Math.min(17 - w, Math.max(0, rawPts - w * 3));
            let l = Math.max(0, 17 - w - d);
            let gf = Math.max(10, Math.round(w * 1.7 + d * 1.0 + seededRand(state.year * 3 + (typeof c.id === 'number' ? c.id : p), 3, 8)));
            let ga = Math.max(8, Math.round(l * 1.6 + d * 0.9 + seededRand(state.year * 3 + (typeof c.id === 'number' ? c.id : p), 2, 7)));
            let gd = gf - ga;

            tableData.push({
              pos: p,
              id: c.id,
              name: c.name,
              color: c.color,
              logo: isModActive ? (c as any).logo : undefined,
              mp: 17,
              w,
              d,
              l,
              gf,
              ga,
              pts,
              gd: gd > 0 ? `+${gd}` : `${gd}`,
              isUser: false,
              isReserve: isReserveTeam(c.name),
              isRival: isRivalMatch(c.name, c.id),
              pointsDeducted: aiDeduction,
              form: generateForm((typeof c.id === 'number' ? c.id : 1) + state.year * 7, w, d, l)
            });
          }
        }
      } else {
        aiSlice.forEach((c, idx) => {
          const isDebtPenalized = insolventClubInTable && c.name === insolventClubInTable.name;
          const aiDeduction = isDebtPenalized ? 2 : undefined;
          const rawTarget = (baseCurve[idx] || 15) + seededRand(state.year * 7 + (typeof c.id === 'number' ? c.id : idx), -2, 2);
          const rawPts = Math.max(4, Math.min(48, rawTarget));
          const pts = aiDeduction ? Math.max(0, rawPts - aiDeduction) : rawPts;
          let w = Math.min(17, Math.max(0, Math.floor(rawPts / 3)));
          let d = Math.min(17 - w, Math.max(0, rawPts - w * 3));
          let l = Math.max(0, 17 - w - d);
          let gf = Math.max(10, Math.round(w * 1.7 + d * 1.0 + seededRand(state.year * 3 + (typeof c.id === 'number' ? c.id : idx), 3, 8)));
          let ga = Math.max(8, Math.round(l * 1.6 + d * 0.9 + seededRand(state.year * 3 + (typeof c.id === 'number' ? c.id : idx), 2, 7)));
          let gd = gf - ga;

          midRows.push({
            pos: idx + 1,
            id: c.id,
            name: c.name,
            color: c.color,
            logo: isModActive ? c.logo : undefined,
            mp: 17,
            w,
            d,
            l,
            gf,
            ga,
            pts,
            gd: gd > 0 ? `+${gd}` : `${gd}`,
            isUser: false,
            isReserve: isReserveTeam(c.name),
            isRival: isRivalMatch(c.name, c.id),
            pointsDeducted: aiDeduction,
            form: generateForm((typeof c.id === 'number' ? c.id : 1) + state.year * 7, w, d, l)
          });
        });

        midRows.sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          const bGd = parseInt(b.gd, 10);
          const aGd = parseInt(a.gd, 10);
          if (bGd !== aGd) return bGd - aGd;
          if (b.gf !== a.gf) return b.gf - a.gf;
          if (b.w !== a.w) return b.w - a.w;
          return a.name.localeCompare(b.name);
        });

        midRows.forEach((r, idx) => {
          r.pos = idx + 1;
          tableData.push(r);
        });
      }
    }
  } else if (inspectedHist) {
    // 1. Direct retrieval from permanent season standings archive if available
    const archivedTierRows = state.seasonStandingsArchive?.[inspectedHist.year]?.[effectiveSelectedTier];
    if (archivedTierRows && archivedTierRows.length > 0) {
      archivedTierRows.slice(0, targetTotalClubs).forEach((r, idx) => {
        const matchesHistClub =
          (inspectedHist.clubId != null && r.id === inspectedHist.clubId) ||
          (inspectedHist.clubName && r.name?.toLowerCase().trim() === inspectedHist.clubName.toLowerCase().trim());
        const isArchivedUser = Boolean(matchesHistClub || (inspectedHist.clubId == null && !inspectedHist.clubName && r.isUser));
        const isArchivedRival = !isArchivedUser && Boolean(
          state.currentRival &&
          ((r.id != null && r.id === state.currentRival.id) ||
            (r.name && state.currentRival.name && r.name.toLowerCase().trim() === state.currentRival.name.toLowerCase().trim()))
        );
        tableData.push({
          ...r,
          pos: idx + 1,
          isUser: isArchivedUser,
          isRival: isArchivedRival,
        });
      });
    } else {
      // 2. Fallback: Intelligent historical table reconstruction
      const isUserInInspectedTier = inspectedHist.tier === effectiveSelectedTier;
      const userPos = Math.max(1, Math.min(18, inspectedHist.pos || 1));
      const userWins = inspectedHist.wins;
      const userDraws = inspectedHist.draws ?? Math.max(0, 34 - userWins - 8);
      const userLosses = inspectedHist.losses ?? Math.max(0, 34 - userWins - userDraws);
      const userPts = inspectedHist.pts ?? (userWins * 3 + userDraws);
      const userGf = Math.max(18, inspectedHist.gf || Math.round(userWins * 2.0 + userDraws * 1.1 + seededRand(inspectedHist.year, 4, 10)));
      const userGa = Math.max(14, inspectedHist.ga || Math.round(userLosses * 1.9 + userDraws * 0.9 + seededRand(inspectedHist.year + 1, 3, 8)));
      const rawGd = userGf - userGa;
      const userGDStr = rawGd > 0 ? '+' + rawGd : `${rawGd}`;

      // Retrieve movements from this season to account for promotions & relegations accurately
      const seasonMoves = (state.universeMovements || []).filter(
        m => (Number(m.year) || 2024) === inspectedHist.year && (m.country || 'GER') === currentCountry
      );

      const inspectedUserClubId = inspectedHist.clubId ?? state.club.id;
      const inspectedUserClubName = (inspectedHist.clubName || state.club.name || '').toLowerCase().trim();
      const isInspectedUserClub = (cid?: number | string, cname?: string) => {
        if (!isUserInInspectedTier) return false;
        if (cid != null && inspectedUserClubId != null && String(cid) === String(inspectedUserClubId)) return true;
        if (cname && inspectedUserClubName && cname.toLowerCase().trim() === inspectedUserClubName) return true;
        return false;
      };

      // Clubs that earned promotion/relegation FROM this tier in that season were actually competing in this tier!
      const movedFromThisTier = seasonMoves
        .filter(m => m.fromTier === effectiveSelectedTier && !isInspectedUserClub(m.clubId, m.clubName))
        .map(m => {
          const matched = sanitizedClubsDb.find(c => c.id === m.clubId || (m.clubName && c.name.toLowerCase().trim() === m.clubName.toLowerCase().trim()));
          return {
            club: matched || {
              id: m.clubId,
              name: m.clubName,
              tier: effectiveSelectedTier,
              baseOvr: 70,
              color: m.clubColor || '#0284c7',
              stadium: 20000,
              country: currentCountry
            },
            forcedPos: m.pos
          };
        });

      // Clubs that arrived IN this tier at the end of that season did NOT compete in this tier yet!
      const movedToThisTierKeys = new Set(
        seasonMoves
          .filter(m => m.toTier === effectiveSelectedTier && m.fromTier !== effectiveSelectedTier)
          .map(m => m.clubId != null ? String(m.clubId) : (m.clubName || '').toLowerCase().trim())
      );

      // Filter leagueClubs by excluding clubs that only arrived at the end of this season (and user club if competing in this tier)
      const historicalClubs = leagueClubs.filter(c => {
        if (isInspectedUserClub(c.id, c.name)) return false;
        const idKey = String(c.id);
        const nameKey = (c.name || '').toLowerCase().trim();
        return !movedToThisTierKeys.has(idKey) && !movedToThisTierKeys.has(nameKey);
      });

      // Add clubs that were in this tier during that season and promoted/relegated out
      movedFromThisTier.forEach(item => {
        if (!historicalClubs.some(c => c.id === item.club.id || (item.club.name && c.name.toLowerCase().trim() === item.club.name.toLowerCase().trim()))) {
          historicalClubs.push(item.club as any);
        }
      });

      const forcedPosClubs = new Map<number, any>();
      movedFromThisTier.forEach(item => {
        if (item.forcedPos && item.forcedPos >= 1 && item.forcedPos <= 18) {
          if (isUserInInspectedTier && item.forcedPos === userPos) return;
          if (!forcedPosClubs.has(item.forcedPos)) {
            forcedPosClubs.set(item.forcedPos, item.club);
          }
        }
      });

      const clubsPool = historicalClubs
        .filter(c => !Array.from(forcedPosClubs.values()).some(fc => fc.id === c.id || fc.name === c.name))
        .sort((a, b) => {
          const bEff = b.baseOvr + seededRand(inspectedHist.year * 10 + (typeof b.id === 'number' ? b.id : 1), -4, 4);
          const aEff = a.baseOvr + seededRand(inspectedHist.year * 10 + (typeof a.id === 'number' ? a.id : 1), -4, 4);
          return bEff - aEff;
        });

      const basePtsMap: Record<number, number> = {
        1: 82, 2: 74, 3: 66, 4: 60, 5: 55, 6: 51,
        7: 48, 8: 45, 9: 42, 10: 40, 11: 37, 12: 35,
        13: 33, 14: 31, 15: 28, 16: 25, 17: 21, 18: 16
      };
      const getRealisticBasePoints = (p: number) => basePtsMap[p] || 40;

      const posPts: number[] = new Array(19).fill(0);
      if (isUserInInspectedTier) {
        posPts[userPos] = userPts;
        for (let p = userPos - 1; p >= 1; p--) {
          let ideal = getRealisticBasePoints(p) + seededRand(inspectedHist.year * 70 + p, -1, 1);
          const targetMin = posPts[p + 1] + 1;
          const targetMax = posPts[p + 1] + 4;
          ideal = Math.min(targetMax, Math.max(targetMin, ideal));
          posPts[p] = Math.min(95, ideal);
        }
        for (let p = userPos + 1; p <= 18; p++) {
          let ideal = getRealisticBasePoints(p) + seededRand(inspectedHist.year * 70 + p, -1, 1);
          const targetMax = posPts[p - 1] - 1;
          const targetMin = posPts[p - 1] - 4;
          ideal = Math.max(targetMin, Math.min(targetMax, ideal));
          posPts[p] = Math.max(4, ideal);
        }
      } else {
        for (let p = 1; p <= 18; p++) {
          posPts[p] = getRealisticBasePoints(p) + seededRand(inspectedHist.year * 70 + p, -2, 2);
        }
      }

      for (let p = 1; p <= 18; p++) {
        if (isUserInInspectedTier && p === userPos) {
          const histClubName = inspectedHist.clubName || state.club.name;
          tableData.push({
            pos: userPos,
            id: inspectedHist.clubId ?? state.club.id,
            name: histClubName,
            color: inspectedHist.color || state.club.color,
            logo: isModActive ? (inspectedHist.logo || state.club.logo) : undefined,
            mp: 34,
            w: userWins,
            d: userDraws,
            l: userLosses,
            gf: userGf,
            ga: userGa,
            pts: userPts,
            gd: userGDStr,
            isUser: true,
            isReserve: isReserveTeam(histClubName),
            isRival: false,
            pointsDeducted: inspectedHist.pointsDeducted,
            form: generateForm(inspectedHist.year * 10, userWins, userDraws, userLosses)
          });
        } else {
          const club = forcedPosClubs.get(p) || clubsPool.shift() || { id: 9900 + p, name: `Club ${p}`, color: '#64748b' };
          const pts = posPts[p] || 40;
          const isDebtPenalized = Boolean(insolventClubInTable && club.name === insolventClubInTable.name);
          const netPts = isDebtPenalized
            ? (isUserInInspectedTier && p < userPos ? Math.max(userPts + 1, pts - 2) : Math.max(0, pts - 2))
            : pts;
          const rawPtsForRecord = isDebtPenalized ? netPts + 2 : netPts;
          let w = Math.min(34, Math.max(1, Math.floor(rawPtsForRecord / 3)));
          let d = Math.max(0, rawPtsForRecord - w * 3);
          while (d < 4 && w > 2 && w + d < 34) {
            w -= 1;
            d += 3;
          }
          const l = Math.max(0, 34 - w - d);
          const gf = Math.max(18, Math.round(w * 1.9 + d * 1.1 + seededRand(inspectedHist.year * 10 + p, 4, 12)));
          const ga = Math.max(14, Math.round(l * 1.8 + d * 0.9 + seededRand(inspectedHist.year * 10 + p + 50, 4, 12)));
          const gdVal = gf - ga;
          tableData.push({
            pos: p,
            id: typeof club.id === 'number' ? club.id : undefined,
            name: club.name,
            color: club.color,
            logo: isModActive ? club.logo : undefined,
            mp: 34,
            w,
            d,
            l,
            gf,
            ga,
            pts: netPts,
            gd: gdVal > 0 ? `+${gdVal}` : `${gdVal}`,
            isUser: false,
            isReserve: isReserveTeam(club.name),
            isRival: isRivalMatch(club.name, club.id),
            pointsDeducted: isDebtPenalized ? 2 : undefined,
            form: generateForm(inspectedHist.year * 20 + p, w, d, l)
          });
        }
      }

      if (!isUserInInspectedTier) {
        tableData.sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          const bGd = parseInt(b.gd, 10);
          const aGd = parseInt(a.gd, 10);
          if (bGd !== aGd) return bGd - aGd;
          if (b.gf !== a.gf) return b.gf - a.gf;
          if (b.w !== a.w) return b.w - a.w;
          return a.name.localeCompare(b.name);
        });
      }

      tableData.forEach((r, idx) => {
        r.pos = idx + 1;
      });
    }
  }

  // Universe Movements Data & Filtering
  const allMovements = useMemo(() => getAllUniverseMovements(state, sanitizedClubsDb, isModActive), [state, sanitizedClubsDb, isModActive]);
  
  const availableUniverseYears = useMemo(() => {
    return Array.from(new Set(allMovements.map(m => Number(m.year) || 2024))).sort((a: number, b: number) => b - a);
  }, [allMovements]);

  const latestUniverseYear = useMemo(() => {
    if (availableUniverseYears.length > 0) {
      return availableUniverseYears[0];
    }
    return Math.max(2024, Number(state.year) || 2026);
  }, [availableUniverseYears, state.year]);

  const filteredMovements = useMemo(() => {
    const list = allMovements.filter((m) => {
      const mYear = Number(m.year) || 2024;
      // Seasonal scope filter
      if (universeSeasonFilter === 'latest' && mYear !== latestUniverseYear) return false;
      if (typeof universeSeasonFilter === 'number' && mYear !== universeSeasonFilter) return false;

      // Category filters
      if (movementFilter === 'headlines') return isMajorUniverseHeadline(m, currentCountry);
      if (movementFilter === 'domestic') return m.country === currentCountry;
      if (movementFilter === 'cups') {
        if (m.type !== 'cup_champion') return false;
        if (cupRegionFilter === 'ALL') return true;
        const league = (m.fromLeagueName || '').toLowerCase();
        const region = getRegion(m.country || 'GER');
        if (cupRegionFilter === 'CONMEBOL') {
          return region === 'CONMEBOL' || league.includes('libertadores') || league.includes('sudamericana') || league.includes('recopa');
        }
        if (cupRegionFilter === 'CONCACAF') {
          return region === 'CONCACAF' || league.includes('concacaf') || league.includes('north american') || league.includes('leagues');
        }
        if (cupRegionFilter === 'AFC') {
          return region === 'AFC' || league.includes('afc') || league.includes('asian');
        }
        if (cupRegionFilter === 'UEFA') {
          // Exclude Concacaf Champions Cup
          const isConcacaf = league.includes('concacaf') || region === 'CONCACAF';
          if (isConcacaf) return false;

          return region === 'UEFA' || league.includes('euro') || league.includes('uefa') || (league.includes('champions cup') && !isConcacaf);
        }
        if (cupRegionFilter === 'WORLD') {
          return league.includes('world') || league.includes('global') || league.includes('cwc');
        }
        return true;
      }
      if (movementFilter === 'career') return m.isUserClub || m.isPastManagerClub;
      return true;
    });

    // Chronological & Relevance Sort:
    // 1. Year (descending) -> newest events always take precedence!
    // 2. Within the same season:
    //    0: Current Manager Club
    //    1: Former Manager Clubs
    //    2: Domestic Country being managed
    //    3: Other continental headlines
    // 3. League position
    return list.sort((a, b) => {
      const aYr = Number(a.year) || 2024;
      const bYr = Number(b.year) || 2024;
      if (bYr !== aYr) return bYr - aYr;
      const getPriority = (m: UniverseMovement) => {
        if (m.isUserClub) return 0;
        if (m.isPastManagerClub) return 1;
        if (m.country === currentCountry) return 2;
        return 3;
      };
      const pDiff = getPriority(a) - getPriority(b);
      if (pDiff !== 0) return pDiff;
      return (a.pos || 99) - (b.pos || 99);
    });
  }, [allMovements, movementFilter, currentCountry, cupRegionFilter, universeSeasonFilter, latestUniverseYear]);

  const seasonScopedMovements = useMemo(() => {
    return allMovements.filter((m) => {
      const mYear = Number(m.year) || 2024;
      if (universeSeasonFilter === 'latest') return mYear === latestUniverseYear;
      if (typeof universeSeasonFilter === 'number') return mYear === universeSeasonFilter;
      return true; // 'all'
    });
  }, [allMovements, universeSeasonFilter, latestUniverseYear]);

  const headlineCount = useMemo(() => seasonScopedMovements.filter(m => isMajorUniverseHeadline(m, currentCountry)).length, [seasonScopedMovements, currentCountry]);
  const domesticCount = useMemo(() => seasonScopedMovements.filter(m => m.country === currentCountry).length, [seasonScopedMovements, currentCountry]);
  const cupCount = useMemo(() => seasonScopedMovements.filter(m => m.type === 'cup_champion').length, [seasonScopedMovements]);
  const careerCount = useMemo(() => seasonScopedMovements.filter(m => m.isUserClub || m.isPastManagerClub).length, [seasonScopedMovements]);

  const cupRegionCounts = useMemo(() => {
    const cups = seasonScopedMovements.filter(m => m.type === 'cup_champion');
    let conmebol = 0, concacaf = 0, afc = 0, uefa = 0, world = 0;
    cups.forEach(m => {
      const league = (m.fromLeagueName || '').toLowerCase();
      const region = getRegion(m.country || 'GER');
      if (league.includes('world') || league.includes('global') || league.includes('cwc')) {
        world++;
      } else if (region === 'CONMEBOL' || league.includes('libertadores') || league.includes('sudamericana') || league.includes('recopa')) {
        conmebol++;
      } else if (region === 'CONCACAF' || league.includes('concacaf') || league.includes('north american') || league.includes('leagues')) {
        concacaf++;
      } else if (region === 'AFC' || league.includes('afc') || league.includes('asian')) {
        afc++;
      } else if (region === 'UEFA' || league.includes('euro') || league.includes('uefa') || league.includes('champions cup')) {
        uefa++;
      }
    });
    return { total: cups.length, conmebol, concacaf, afc, uefa, world };
  }, [seasonScopedMovements]);

  // Headline Bulletin: The winner of the biggest trophy in Europe, South America, North America, or APAC depending on the country/club chosen
  const topBreakingStory = useMemo(() => {
    const activeYear = universeSeasonFilter === 'latest'
      ? latestUniverseYear
      : (typeof universeSeasonFilter === 'number' ? universeSeasonFilter : latestUniverseYear);

    // 0. Priority: If the manager's own club achieved a major universe milestone THIS season
    const thisSeasonUserMove = allMovements.find((m) => m.isUserClub && (Number(m.year) || 2024) === activeYear);
    if (thisSeasonUserMove && isMajorUniverseHeadline(thisSeasonUserMove, currentCountry)) return thisSeasonUserMove;

    const region = getRegion(currentCountry);

    // Regex identifying the premier/biggest continental cup per region
    let premierCupRegex: RegExp;
    switch (region) {
      case 'AFC':
        premierCupRegex = /asian.*champion|asia.*champion|afc.*champion|afc.*league/i;
        break;
      case 'CONMEBOL':
        premierCupRegex = /libertadores/i;
        break;
      case 'CONCACAF':
        premierCupRegex = /concacaf.*champion|north american.*champion/i;
        break;
      case 'UEFA':
      default:
        premierCupRegex = /(euro.*champion|uefa.*champion|^champions cup)/i;
        break;
    }

    // Filter to current season movements so breaking news reflects the active campaign
    const currentSeasonMovements = allMovements.filter(m => (Number(m.year) || 2024) === activeYear);
    const pool = currentSeasonMovements.length > 0 ? currentSeasonMovements : allMovements;

    // 1. The winner of the biggest continental trophy for the manager's chosen region
    const regionalPremierWinner = pool.find(
      (m) => m.type === 'cup_champion' && premierCupRegex.test(m.fromLeagueName || '')
    );
    if (regionalPremierWinner) return regionalPremierWinner;

    // 2. Secondary fallback: Any continental cup champion in the manager's region
    const anyRegionalCupWinner = pool.find(
      (m) => m.type === 'cup_champion' && getRegion(m.country || 'GER') === region
    );
    if (anyRegionalCupWinner) return anyRegionalCupWinner;

    // 3. Next fallback: Global Club Cup
    const globalCupWinner = pool.find(
      (m) => m.type === 'cup_champion' && /world|global/i.test(m.fromLeagueName || '')
    );
    if (globalCupWinner) return globalCupWinner;

    // 4. Default fallback: Any major headline from the latest pool
    return pool.find((m) => isMajorUniverseHeadline(m, currentCountry)) || allMovements[0];
  }, [allMovements, currentCountry, universeSeasonFilter, latestUniverseYear]);

  // Available Tiers in this Country
  const availableTiers = Array.from({ length: maxTierForCountry }, (_, i) => i + 1);

  // Arch-Rival info in this tier
  const rivalInfo = state.currentRival;
  const isRivalInThisTier = tableData.some(r => r.isRival);

  // Pre-calculate authentic promotion and playoff eligibility (strictly skipping reserve squads)
  const promoStatusMap = useMemo(() => {
    const map = new Map<number, 'champion' | 'champions_league' | 'euro_quali' | 'auto_promo' | 'playoff' | 'relegation'>();
    
    if (effectiveSelectedTier === 1) {
      // Tier 1: Gold for Domestic Champion (1st) & Primary Continental Cup spots
      // Sky Blue for Secondary/Tertiary Continental cup spots
      const region = getRegion(currentCountry);
      const isTop5Uefa = ['GER', 'ENG', 'ESP', 'ITA', 'FRA'].includes(currentCountry);
      const clCutoff = region === 'CONMEBOL' ? 4 : region === 'AFC' ? 2 : region === 'CONCACAF' ? 4 : isTop5Uefa ? 4 : 1;
      const euroCutoff = region === 'CONMEBOL' ? 8 : region === 'AFC' ? 6 : region === 'CONCACAF' ? 7 : isTop5Uefa ? 7 : 6;
      tableData.forEach((_, idx) => {
        if (idx === 0) map.set(idx, 'champion');
        else if (idx < clCutoff) map.set(idx, 'champions_league');
        else if (idx < euroCutoff) map.set(idx, 'euro_quali');
      });
    } else {
      // Lower Tiers: Top 2 non-reserve teams earn automatic promotion (Emerald Green)
      // Playoff spots earn Sky Blue
      let autoPromoCount = 0;
      let playoffCount = 0;
      const targetAutoPromos = 2;
      const targetPlayoffs = hasPromotionPlayoffs ? 4 : 1;

      tableData.forEach((row, idx) => {
        if (row.isReserve && !canPromoteReserve(row.name)) {
          // Reserve squads barred from promotion due to ceiling, parent tier, or division quota
          return;
        }
        if (autoPromoCount < targetAutoPromos) {
          map.set(idx, 'auto_promo');
          autoPromoCount++;
        } else if (playoffCount < targetPlayoffs) {
          map.set(idx, 'playoff');
          playoffCount++;
        }
      });
    }

    // Relegation drop zone (Rose Red)
    // Applies to all tiers: in upper tiers, clubs relegate downwards.
    // In bottom tier (tier 1 in single-tier countries, or tier 6 in Germany):
    // we show they finish in the sporting relegation zone, but clubs re-enter the bottom tier next season!
    const numRelegationSpots = (currentCountry === 'TUR' && effectiveSelectedTier === 3) ? 2 : 3;
    for (let idx = Math.max(0, tableData.length - numRelegationSpots); idx < tableData.length; idx++) {
      map.set(idx, 'relegation');
    }

    return map;
  }, [tableData, effectiveSelectedTier, hasPromotionPlayoffs, currentCountry]);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-1 sm:p-5 backdrop-blur-2xl text-left cursor-pointer animate-in fade-in duration-100 overflow-hidden"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-[#121520]/95 rounded-2xl sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-3xl flex flex-col overflow-hidden h-[96dvh] sm:h-auto max-h-[96dvh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 relative text-white animate-in zoom-in-98 duration-100 ease-out cursor-default"
      >
        {/* Subtle Ambient Lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* ──────────────────────────────────────────────────────────
            1. Clean Header with Dual Window Tab Switcher
            ────────────────────────────────────────────────────────── */}
        <div className="p-2 sm:p-5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-2 sm:gap-4 shrink-0 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center p-1 sm:p-2 shadow-inner shrink-0">
              {currentLeagueInfo?.logo ? (
                <img
                  src={currentLeagueInfo.logo}
                  alt={`${currentLeagueInfo.name} logo`}
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  className="w-5 h-5 sm:w-7 sm:h-7 object-contain drop-shadow"
                />
              ) : (
                <i className={`fas ${activeTab === 'standings' ? 'fa-list-ol' : 'fa-arrows-up-down'} text-sm sm:text-base text-sky-400`}></i>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 border border-sky-400/20 px-1.5 py-0.2 rounded-md tracking-wider shrink-0">
                  {leagueTag}
                </span>
                <span className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate hidden sm:inline">
                  {currentLeagueInfo.name}
                </span>
              </div>
              <h2 className="text-xs sm:text-xl font-black text-white tracking-tight mt-0.5 truncate py-0.5 leading-normal">
                {activeTab === 'standings'
                  ? (isCurrentView 
                      ? (state.seasonPhase === 'mid' 
                          ? `${yearTag} Mid-Season Standings` 
                          : `${yearTag} Pre-Season`)
                      : `${yearTag} Final Standings`)
                  : 'Universe Movements'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Primary Tab Switcher: Standings vs Universe Movements */}
            <div className="bg-black/40 border border-white/[0.08] rounded-xl p-0.5 sm:p-1 flex items-center gap-0.5 sm:gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('standings')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'standings'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <i className="fa-solid fa-table-list text-[11px]"></i>
                <span className="hidden sm:inline">Standings</span>
                <span className="sm:hidden">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('universe')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                  activeTab === 'universe'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <i className="fa-solid fa-arrows-up-down text-[11px]"></i>
                <span>Movements</span>
                <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white/20 text-white">
                  {allMovements.length}
                </span>
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────
            PART 1: THE STANDINGS TAB (THE LOCAL TABLE)
            ────────────────────────────────────────────────────────── */}
        {activeTab === 'standings' ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Unified Divisions & Season Archive Bar (Dropdowns for Mobile/Immersive) */}
            <div className="px-2 sm:px-6 py-1.5 sm:py-2 bg-white/[0.02] border-b border-white/[0.06] flex flex-row flex-wrap items-center gap-x-4 gap-y-2 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <label className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-500 whitespace-nowrap shrink-0">
                  <i className="fa-solid fa-layer-group text-sky-400 mr-1"></i> Div
                </label>
                <div className="relative inline-flex items-center">
                  {/* Visually rendered, font-accurate Jakarta pill */}
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 text-white font-sans text-[11px] font-bold rounded-md pl-2.5 pr-6 py-1 pointer-events-none whitespace-nowrap">
                    <span>
                      {(() => {
                        const info = getLeagueInfo(effectiveSelectedTier, currentCountry);
                        const isUserTier = effectiveSelectedTier === userActiveTier;
                        return `T${effectiveSelectedTier}: ${info.tag || info.name}${isUserTier ? ' (You)' : ''}`;
                      })()}
                    </span>
                    <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 pointer-events-none"></i>
                  </div>
                  {/* Invisible Select catching taps and opening native wheel */}
                  <select
                    value={effectiveSelectedTier}
                    onChange={(e) => setSelectedTier(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
                    aria-label="Select Division"
                  >
                    {availableTiers.map((tierNum) => {
                      const info = getLeagueInfo(tierNum, currentCountry);
                      const isUserTier = tierNum === userActiveTier;
                      return (
                        <option key={tierNum} value={tierNum}>
                          T{tierNum}: {info.tag || info.name} {isUserTier ? '(You)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {history.length > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="hidden sm:block h-3 w-px bg-white/10 shrink-0 mx-0.5" />
                  <label className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-500 whitespace-nowrap shrink-0">
                    <i className="fa-solid fa-clock-rotate-left text-zinc-400 mr-1"></i> Season
                  </label>
                  <div className="relative inline-flex items-center">
                    {/* Visually rendered, font-accurate Jakarta pill */}
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 text-white font-sans text-[11px] font-bold rounded-md pl-2.5 pr-6 py-1 pointer-events-none whitespace-nowrap">
                      <span>
                        {selectedSeason === 'current'
                          ? `Current (${state.year})`
                          : typeof selectedSeason === 'number' && history[selectedSeason]
                          ? `${history[selectedSeason].year} (P${history[selectedSeason].pos})`
                          : `Season (${state.year})`}
                      </span>
                      {selectedSeason !== 'current' && typeof selectedSeason === 'number' && history[selectedSeason] && (() => {
                        const h = history[selectedSeason];
                        const outcome = getHistoryOutcome(h, history[selectedSeason + 1], state.seasonStandingsArchive);
                        if (!outcome) return null;
                        return (
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase shrink-0 shadow-sm ${
                            outcome === 'C'
                              ? 'bg-amber-400 text-black'
                              : outcome === 'P'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-600 text-white'
                          }`}>
                            {outcome}
                          </span>
                        );
                      })()}
                      <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 pointer-events-none"></i>
                    </div>
                    {/* Invisible Select catching taps */}
                    <select
                      value={selectedSeason === 'current' ? 'current' : selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value === 'current' ? 'current' : Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
                      aria-label="Select Season Archive"
                    >
                      <option value="current">Current ({state.year})</option>
                      {[...history].map((h, idx) => ({ h, originalIndex: idx })).reverse().map(({ h, originalIndex }) => {
                        const outcome = getHistoryOutcome(h, history[originalIndex + 1], state.seasonStandingsArchive);
                        return (
                          <option key={originalIndex} value={originalIndex}>
                            {h.year} (P{h.pos}{outcome ? ` · ${outcome}` : ''})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Insolvent Club Notice Banner */}
            {insolventClubInTable && (
              <div className="px-3 sm:px-6 pt-2 shrink-0">
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 text-left flex items-start gap-2 shadow-sm">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-xs">
                    <i className="fas fa-triangle-exclamation"></i>
                  </div>
                  <div className="flex-1 text-[11px] text-amber-200/90 leading-relaxed">
                    <span className="font-bold text-amber-300">{insolventClubInTable.name}</span>{' '}
                    faced financial administration and was relegated by decree.
                  </div>
                </div>
              </div>
            )}

            {/* Standings Table Container - Centered and Max Width for Compactness */}
            <div className="p-0 sm:p-4 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="w-full max-w-[760px] mx-auto flex flex-col h-fit max-h-full mb-auto bg-white/[0.02] sm:border border-white/[0.08] sm:rounded-2xl overflow-hidden shadow-sm">
                
                {/* Table Header */}
                <div className="flex items-center py-2 px-2 sm:px-3.5 bg-white/[0.03] border-b border-white/[0.06] text-[10px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0">
                  <div className="w-6 sm:w-8 text-center shrink-0">#</div>
                  <div className="flex-1 px-1.5 sm:px-2 text-left min-w-0">Club</div>
                  <div className="w-7 sm:w-8 text-center shrink-0">MP</div>
                  <div className="w-12 sm:w-14 text-center shrink-0 hidden sm:block">W-D-L</div>
                  <div className="w-10 sm:w-12 text-center shrink-0 hidden sm:block">GF:GA</div>
                  <div className="w-8 sm:w-10 text-center shrink-0">GD</div>
                  <div className="w-8 sm:w-10 text-center shrink-0 font-bold text-white">Pts</div>
                  <div className="w-16 text-center shrink-0 hidden lg:block">Form</div>
                </div>

                {/* Scrollable Rows with Consequence Lines */}
                <div ref={tableScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar divide-y divide-white/[0.02]">
                  {tableData.map((r, i) => {
                    const status = promoStatusMap.get(i);
                    let consequenceBorder = 'border-l-4 border-transparent';
                    let consequenceTitle = '';
                    const cannotPromote = r.isReserve && !canPromoteReserve(r.name);
                    if (!cannotPromote) {
                      if (status === 'champion') {
                        consequenceBorder = 'border-l-4 border-amber-400 bg-amber-400/[0.06] shadow-[inset_4px_0_12px_rgba(251,191,36,0.18)]';
                        consequenceTitle = regionalLegend.champTooltip;
                      } else if (status === 'champions_league') {
                        consequenceBorder = 'border-l-4 border-amber-400/90 bg-amber-400/[0.03]';
                        consequenceTitle = regionalLegend.primaryTooltip;
                      } else if (status === 'auto_promo') {
                        consequenceBorder = 'border-l-4 border-emerald-400 bg-emerald-500/[0.04] shadow-[inset_4px_0_12px_rgba(52,211,153,0.18)]';
                        consequenceTitle = 'Automatic Promotion';
                      } else if (status === 'euro_quali') {
                        consequenceBorder = 'border-l-4 border-sky-400 bg-sky-500/[0.04]';
                        consequenceTitle = regionalLegend.secondaryTooltip;
                      } else if (status === 'playoff') {
                        consequenceBorder = 'border-l-4 border-sky-400 bg-sky-500/[0.04]';
                        consequenceTitle = 'Promotion Playoff';
                      }
                    }
                    if (status === 'relegation') {
                      consequenceBorder = 'border-l-4 border-rose-500 bg-rose-500/[0.05]';
                      consequenceTitle = regionalLegend.relegation;
                    }

                    const rowBg = r.isUser
                      ? 'bg-sky-500/15 border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.22)] ring-1 ring-sky-400/40 relative z-10'
                      : r.isRival
                      ? 'bg-rose-500/10'
                      : i % 2 === 0
                      ? 'bg-transparent'
                      : 'bg-white/[0.015]';

                    return (
                      <div
                        key={r.id || r.name}
                        title={consequenceTitle || undefined}
                        className={`flex items-center py-2 px-2 sm:px-3 text-xs transition-colors ${consequenceBorder} ${rowBg}`}
                      >
                        {/* Position */}
                        <div className="w-6 sm:w-8 text-center shrink-0 font-mono font-bold text-zinc-400">
                          {r.pos}
                        </div>

                        {/* Club Crest & Name */}
                        <div className="flex-1 px-1.5 sm:px-2 flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <ClubLogo
                            name={r.name}
                            id={typeof r.id === 'number' ? r.id : undefined}
                            color={r.color}
                            logo={r.logo}
                            isModActive={isModActive}
                            className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 object-contain"
                          />
                          <span className={`truncate font-semibold py-0.5 leading-normal ${r.isUser ? 'text-sky-300 font-bold' : 'text-zinc-200'}`}>
                            {sanitizePlayerName(r.name) || r.name}
                          </span>

                          {/* Canadian Flag Indicator for Canadian MLS Clubs */}
                          {currentCountry === 'USA' && isCanadianMLSClub(r.name, typeof r.id === 'number' ? r.id : undefined, currentCountry) && (
                            <span 
                              className="text-[12px] leading-none shrink-0 select-none" 
                              title="Canadian Club (Major League) • Competes in the Voyageurs Cup"
                            >
                              🇨🇦
                            </span>
                          )}

                          {/* "YOU" Badge */}
                          {r.isUser && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase bg-sky-400 text-black tracking-wider shrink-0 shadow-sm">
                              YOU
                            </span>
                          )}

                          {/* FM-style Outcome Badge (C / P / R) */}
                          {(() => {
                            const rawOutcome = (r as any).status || (
                              inspectedHist ? (
                                r.pos === 1 ? 'C' :
                                (effectiveSelectedTier > 1 && r.pos === 2 && !r.isReserve && canPromoteReserve(r.name)) ? 'P' :
                                undefined
                              ) : undefined
                            );
                            const outcome = (rawOutcome === 'R' && (isTier1Only || isBottomTier)) ? undefined : rawOutcome;
                            if (!outcome) return null;
                            return (
                              <span 
                                className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0 shadow-sm ${
                                  outcome === 'C'
                                    ? 'bg-amber-400 text-black'
                                    : outcome === 'P'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                                title={
                                  outcome === 'C'
                                    ? (effectiveSelectedTier > 1 ? "Division Champion & Promoted" : "League Champion")
                                    : outcome === 'P'
                                    ? "Promoted to higher division"
                                    : "Relegated to lower division"
                                }
                              >
                                {outcome}
                              </span>
                            );
                          })()}

                          {/* Reserve Team Regulation Badge */}
                          {r.isReserve && (
                            <span 
                              className={`px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase border shrink-0 tracking-wider ${
                                canPromoteReserve(r.name) && effectiveSelectedTier > 1
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                              title={
                                canPromoteReserve(r.name) && effectiveSelectedTier > 1
                                  ? `Reserve team: Eligible for promotion to ${getLeagueInfo(effectiveSelectedTier - 1, currentCountry).name} (within ceiling & division quota)`
                                  : 'Reserve team: Legally barred from promotion under league regulations (division ceiling, parent club tier, or max 4 reserve cap)'
                              }
                            >
                              {canPromoteReserve(r.name) && effectiveSelectedTier > 1 ? 'Res. (Eligible)' : 'Res.'}
                            </span>
                          )}

                          {/* Financial Penalty */}
                          {r.pointsDeducted && r.pointsDeducted > 0 && (
                            <span 
                              className="px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/25 font-mono shrink-0"
                              title={`Financial penalty: -${r.pointsDeducted} points deducted by league association due to licensing or financial deficit`}
                            >
                              (-{r.pointsDeducted} Pts)
                            </span>
                          )}

                          {/* Pyramid Floor: Relegation Zone Retained Badge */}
                          {isBottomTier && status === 'relegation' && (
                            <span 
                              className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[8px] font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/25 shrink-0"
                              title="Pyramid floor: Finished in sporting relegation zone, but retained in this division next season as no lower national tier exists. Manager is immediately relieved of duties for sporting failure."
                            >
                              Sporting Relegation (Pyramid Floor)
                            </span>
                          )}
                        </div>

                        {/* Matches Played */}
                        <div className="w-7 sm:w-8 text-center shrink-0 font-mono text-zinc-400">
                          {r.mp}
                        </div>

                        {/* W-D-L */}
                        <div className="w-12 sm:w-14 text-center shrink-0 font-mono text-zinc-400 hidden sm:block text-[10px] sm:text-[11px]">
                          <span className="text-emerald-400">{r.w}</span>-
                          <span>{r.d}</span>-
                          <span className="text-rose-400">{r.l}</span>
                        </div>

                        {/* GF:GA */}
                        <div className="w-10 sm:w-12 text-center shrink-0 font-mono text-zinc-400 hidden sm:block text-[10px] sm:text-[11px]">
                          {r.gf}:{r.ga}
                        </div>

                        {/* GD */}
                        <div className="w-8 sm:w-10 text-center shrink-0 font-mono font-medium text-zinc-300 text-[10px] sm:text-[11px]">
                          {r.gd}
                        </div>

                        {/* Pts */}
                        <div className="w-8 sm:w-10 text-center shrink-0 font-mono font-bold text-white text-[11px] sm:text-xs">
                          {r.pts}
                        </div>

                        {/* Form */}
                        <div className="w-16 flex items-center justify-center gap-0.5 shrink-0 hidden lg:flex">
                          {r.form && r.form.length > 0 ? (
                            r.form.map((res, fIdx) => (
                              <span
                                key={fIdx}
                                className={`w-3 h-3 rounded-[3px] flex items-center justify-center text-[7px] font-black text-black ${
                                  res === 'W'
                                    ? 'bg-emerald-400'
                                    : res === 'D'
                                    ? 'bg-zinc-400'
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {res}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 font-mono text-[10px]">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Table Footer Consequence Legend */}
                <div className="px-3.5 py-2.5 bg-white/[0.02] border-t border-white/[0.06] text-[10px] text-zinc-400 flex items-center gap-4 flex-wrap justify-between shrink-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    {effectiveSelectedTier === 1 ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.6)]"></span>
                          <span>{regionalLegend.primary}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 shrink-0"></span>
                          <span>{regionalLegend.secondary}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0"></span>
                          <span>
                            {isTier1Only
                              ? 'Sporting Relegation Zone (Floor: clubs return next season)'
                              : regionalLegend.relegation}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></span>
                          <span>Automatic Promotion</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 shrink-0"></span>
                          <span>Playoff</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0"></span>
                          <span>
                            {isBottomTier
                              ? 'Relegation Zone (Pyramid Floor)'
                              : 'Relegation Drop Zone'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1 sm:mt-0 flex-wrap">
                    {inspectedHist && (
                      <span className="flex items-center gap-1.5 mr-2">
                        <span className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-400 text-black">C</span>
                        <span>Champion</span>
                        {effectiveSelectedTier > 1 && (
                          <>
                            <span className="px-1 py-0.2 rounded text-[7px] font-black bg-emerald-500 text-white">P</span>
                            <span>Promoted</span>
                          </>
                        )}
                        {!isTier1Only && !isBottomTier && (
                          <>
                            <span className="px-1 py-0.2 rounded text-[7px] font-black bg-rose-500 text-white">R</span>
                            <span>Relegated</span>
                          </>
                        )}
                      </span>
                    )}
                    <span className="italic">Res. = B-Teams legally barred from promotion to senior division</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ──────────────────────────────────────────────────────────
              PART 2: THE UNIVERSE MOVEMENTS TAB (THE LIVING WORLD)
              ────────────────────────────────────────────────────────── */
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Unified Filter Toolbar for Universe Movements */}
            <div className="px-3 sm:px-6 py-2 bg-white/[0.02] border-b border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              
              {/* Quick Filter Pills (Scrollable horizontally) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setMovementFilter('headlines')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    movementFilter === 'headlines'
                      ? 'bg-sky-500 text-white shadow-sm ring-1 ring-sky-400/30'
                      : 'bg-black/40 text-zinc-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  <i className="fa-solid fa-fire text-amber-400 text-[10px]"></i>
                  <span>Headlines ({headlineCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMovementFilter('domestic')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    movementFilter === 'domestic'
                      ? 'bg-sky-500 text-white shadow-sm ring-1 ring-sky-400/30'
                      : 'bg-black/40 text-zinc-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  <span>{COUNTRIES[currentCountry]?.flag || '🏳️'}</span>
                  <span>Domestic ({domesticCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMovementFilter('cups')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    movementFilter === 'cups'
                      ? 'bg-amber-400 text-black shadow-md font-extrabold ring-1 ring-amber-300'
                      : 'bg-black/40 text-amber-400/80 hover:text-amber-300 border border-amber-500/20'
                  }`}
                >
                  <i className="fa-solid fa-trophy text-[10px]"></i>
                  <span>Cups ({cupCount})</span>
                </button>

                {careerCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setMovementFilter('career')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      movementFilter === 'career'
                        ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/30'
                        : 'bg-black/40 text-purple-400/80 hover:bg-purple-500/10 border border-purple-500/20'
                    }`}
                  >
                    <i className="fa-solid fa-user-tie text-[10px]"></i>
                    <span>Career ({careerCount})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setMovementFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                    movementFilter === 'all'
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'bg-black/40 text-zinc-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  <span>All ({seasonScopedMovements.length})</span>
                </button>
              </div>

              {/* Dropdowns Container for Seasons & Regions */}
              <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 shrink-0 sm:ml-auto mt-1 sm:mt-0">
                {/* Year Dropdown */}
                {availableUniverseYears.length > 1 && (
                  <div className="relative inline-flex items-center">
                    <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 text-white font-sans text-[11px] font-bold rounded-lg pl-2.5 pr-6 py-1 pointer-events-none whitespace-nowrap">
                      <span>
                        {universeSeasonFilter === 'all'
                          ? 'All Years'
                          : universeSeasonFilter === 'latest'
                          ? `Latest (${latestUniverseYear})`
                          : String(universeSeasonFilter)}
                      </span>
                      <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 pointer-events-none"></i>
                    </div>
                    <select
                      value={universeSeasonFilter}
                      onChange={(e) => setUniverseSeasonFilter(e.target.value === 'latest' || e.target.value === 'all' ? e.target.value : Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
                      aria-label="Select Season Filter"
                    >
                      <option value="all">All Years</option>
                      <option value="latest">Latest ({latestUniverseYear})</option>
                      {availableUniverseYears.filter(yr => yr !== latestUniverseYear).map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Region Dropdown (Only when Cups is active) */}
                {movementFilter === 'cups' && (
                  <div className="relative inline-flex items-center">
                    <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/20 text-amber-400 font-sans text-[11px] font-bold rounded-lg pl-2.5 pr-6 py-1 pointer-events-none whitespace-nowrap">
                      <span>
                        {(() => {
                          const labels: Record<string, string> = {
                            ALL: `All (${cupRegionCounts.total})`,
                            CONMEBOL: `Libertadores (${cupRegionCounts.conmebol})`,
                            CONCACAF: `Concacaf (${cupRegionCounts.concacaf})`,
                            AFC: `Asia (${cupRegionCounts.afc})`,
                            UEFA: `Europe (${cupRegionCounts.uefa})`,
                            WORLD: `World (${cupRegionCounts.world})`,
                          };
                          return labels[cupRegionFilter] || cupRegionFilter;
                        })()}
                      </span>
                      <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-amber-500/70 pointer-events-none"></i>
                    </div>
                    <select
                      value={cupRegionFilter}
                      onChange={(e) => setCupRegionFilter(e.target.value as any)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
                      aria-label="Select Tournament Region"
                    >
                      <option value="ALL">All ({cupRegionCounts.total})</option>
                      <option value="CONMEBOL">Libertadores ({cupRegionCounts.conmebol})</option>
                      <option value="CONCACAF">Concacaf ({cupRegionCounts.concacaf})</option>
                      <option value="AFC">Asia ({cupRegionCounts.afc})</option>
                      <option value="UEFA">Europe ({cupRegionCounts.uefa})</option>
                      <option value="WORLD">World ({cupRegionCounts.world})</option>
                    </select>
                  </div>
                )}
              </div>

            </div>

            {/* Universe Movements Feed Cards */}
            <div
              ref={universeScrollRef}
              className="flex-1 min-h-0 p-2.5 sm:p-6 overflow-y-auto overscroll-contain custom-scrollbar space-y-2 touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Top Breaking Story Banner - Hero Card inside scrollable feed */}
              {topBreakingStory && (() => {
                const cat = getHeadlineCategory(topBreakingStory);
                const isCup = topBreakingStory.type === 'cup_champion';
                return (
                  <div
                    className={`bg-gradient-to-r ${
                      isCup
                        ? 'from-amber-500/20 via-yellow-500/10 to-transparent border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                        : 'from-sky-500/15 via-indigo-500/10 to-transparent border-sky-400/30 shadow-md'
                    } border rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl ${
                          isCup
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                            : 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                        } border flex items-center justify-center shrink-0 text-sm shadow-sm`}
                      >
                        <i className={`fa-solid ${isCup ? cat.icon : 'fa-newspaper'} ${isCup ? 'text-amber-400' : 'text-sky-400'}`}></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider ${
                              isCup
                                ? 'text-amber-300 bg-amber-400/15 border-amber-400/30'
                                : 'text-sky-400 bg-sky-400/15 border-sky-400/25'
                            } px-2 py-0.5 rounded-full border flex items-center gap-1`}
                          >
                            <span>Headline Bulletin</span>
                            <span>·</span>
                            <span>{cat.label}</span>
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">{topBreakingStory.year} Season</span>
                        </div>
                        <div className="text-sm font-bold text-white truncate mt-0.5 flex items-center gap-1.5">
                          <span className={isCup ? 'text-amber-300' : 'text-sky-300'}>{topBreakingStory.clubName}</span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-200 font-medium truncate">{topBreakingStory.reason}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isCup ? 'text-amber-300 border-amber-400/25' : 'text-zinc-300 border-white/10'
                        } bg-black/40 px-2.5 py-1 rounded-lg border flex items-center gap-1.5`}
                      >
                        {isCup && <i className="fa-solid fa-trophy text-amber-400 text-[10px]"></i>}
                        <span>{topBreakingStory.fromLeagueName}</span>
                        <span className="text-zinc-500">➔</span>
                        <span className={isCup ? 'text-amber-200' : 'text-zinc-200'}>{topBreakingStory.toLeagueName}</span>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {filteredMovements.length > 0 ? (
                filteredMovements.map((move) => {
                  const isUser = move.isUserClub;
                  const isPastClub = move.isPastManagerClub;
                  // Strictly ensure champions/title-winners can NEVER be tagged as relegated, and transfers NEVER trigger championship banners
                  const isTransfer = move.type === 'transfer_saga';
                  const isCupChamp = move.type === 'cup_champion';
                  const isPromo = move.type === 'promotion';
                  const isInsolv = move.type === 'insolvency_drop';
                  const isCinderella = move.type === 'cinderella_surge';
                  const isContQual = (move as any).type === 'continental_qual' || (move.pos != null && move.pos > 1 && /continental|qualification/i.test(move.reason || ''));
                  const isChamp = !isTransfer && !isContQual && (move.pos === 1 || move.type === 'title_won' || (typeof move.reason === 'string' && /(?:^|\b)(?:champion|meister|winner|trophy|glory|triumph)(?:\b|$)/i.test(move.reason)));
                  const isTitleWon = !isTransfer && !isContQual && (move.type === 'title_won' || (isChamp && !isCupChamp && !isInsolv && !isPromo));
                  const isReleg = move.type === 'relegation' && !isChamp && move.pos !== 1 && !isTransfer;
                  const cat = getHeadlineCategory(move);

                  let statusBadge = null;
                  if (isTransfer) {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 shrink-0">
                        <span>🔄 Transfer</span>
                      </span>
                    );
                  } else if (isContQual) {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 shrink-0">
                        <span>🌍 Continental Qual.</span>
                      </span>
                    );
                  } else if (isTitleWon || (isChamp && !isCupChamp && !isPromo)) {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                        <span>👑 Champions</span>
                      </span>
                    );
                  } else if (isCupChamp) {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                        <span>🏆 Cup Champion</span>
                      </span>
                    );
                  } else if (isInsolv) {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                        <span>⚠️ Insolvency Drop</span>
                      </span>
                    );
                  } else if (isCinderella) {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 shrink-0">
                        <span>✨ Cinderella Run</span>
                      </span>
                    );
                  } else if (isPromo) {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <span>{isChamp || move.pos === 1 ? '👑 Champions' : '⬆️ Promoted'}</span>
                      </span>
                    );
                  } else if (isReleg) {
                    statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 shrink-0">
                        <span>⬇️ Relegated</span>
                      </span>
                    );
                  }

                  const cardBorder = isUser
                    ? 'border-sky-400/50 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-sky-400/30'
                    : isPastClub
                    ? 'border-purple-400/50 bg-purple-500/[0.07] hover:bg-purple-500/15 shadow-[0_0_20px_rgba(192,132,252,0.15)] ring-1 ring-purple-400/30'
                    : isTransfer
                    ? 'border-sky-500/30 bg-sky-500/[0.04] hover:bg-sky-500/[0.08] shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                    : isContQual
                    ? 'border-sky-400/30 bg-sky-500/[0.05] hover:bg-sky-500/[0.08] shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                    : isCupChamp || isTitleWon || isChamp
                    ? 'border-amber-400/40 bg-amber-500/[0.05] hover:bg-amber-500/[0.08] shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                    : isPromo
                    ? 'border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]'
                    : isCinderella
                    ? 'border-purple-500/25 bg-purple-500/[0.03] hover:bg-purple-500/[0.06]'
                    : isInsolv
                    ? 'border-amber-500/25 bg-amber-500/[0.03] hover:bg-amber-500/[0.06]'
                    : isReleg
                    ? 'border-rose-500/20 bg-rose-500/[0.02] hover:bg-rose-500/[0.05]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]';

                  return (
                    <div
                      key={move.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBorder}`}
                    >
                      {/* Left: Club, Category & Headline info */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 shrink-0 aspect-square rounded-xl overflow-hidden flex items-center justify-center bg-black/40 border border-white/10 shadow-sm mt-0.5 sm:mt-0">
                          <ClubLogo
                            name={move.clubName}
                            id={typeof move.clubId === 'number' ? move.clubId : undefined}
                            color={move.clubColor || '#38bdf8'}
                            logo={move.clubLogo}
                            isModActive={isModActive}
                            className="w-10 h-10 shrink-0 aspect-square p-1 object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${cat.color}`}>
                              <i className={`fa-solid ${cat.icon} text-[8px]`}></i>
                              <span>{cat.label}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">{move.year}</span>
                            {isUser && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-sky-400 text-black shadow-sm tracking-wider">
                                YOUR CLUB
                              </span>
                            )}
                            {isPastClub && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-500/30 text-purple-300 border border-purple-400/40 shadow-sm tracking-wider">
                                FORMER CLUB
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="text-sm font-bold text-white leading-normal py-0.5">
                              {move.clubName}
                            </span>
                            <span className="text-xs shrink-0" title={COUNTRIES[move.country]?.name || move.country}>
                              {COUNTRIES[move.country]?.flag || '🏳️'}
                            </span>
                            {move.country === currentCountry && !isUser && !isPastClub && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 font-mono shrink-0">
                                Domestic
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-300 mt-1 font-medium leading-relaxed">
                            {getRegion(move.country || 'GER') !== 'UEFA' && move.reason
                              ? move.reason.replace(/European Continental Qualification/gi, `${getContinentalCupNames(move.country || 'GER').cl} Qualification`)
                              : move.reason}
                          </div>
                        </div>
                      </div>

                      {/* Right: Pathway & Status Tag */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-white/[0.06] pt-2 sm:pt-0">
                        {/* The Pathway: e.g. 2. Bundesliga ➔ 1. Bundesliga */}
                        <div className="flex items-center gap-2 text-xs font-mono font-bold bg-black/40 px-3 py-1.5 rounded-xl border border-white/[0.08]">
                          <span className="text-zinc-400">{move.fromLeagueName}</span>
                          <i
                            className={`fa-solid ${
                              isContQual
                                ? 'fa-globe text-sky-400'
                                : isTitleWon || isChamp
                                ? 'fa-crown text-amber-400'
                                : isCupChamp
                                ? 'fa-trophy text-amber-400'
                                : isPromo
                                ? 'fa-arrow-right text-emerald-400'
                                : isCinderella
                                ? 'fa-wand-magic-sparkles text-purple-400'
                                : isTransfer
                                ? 'fa-arrow-right-arrow-left text-sky-400'
                                : isInsolv
                                ? 'fa-arrow-down text-amber-400'
                                : isReleg
                                ? 'fa-arrow-right text-rose-400'
                                : 'fa-arrow-right text-zinc-400'
                            } text-[10px]`}
                          ></i>
                          <span
                            className={
                              isContQual
                                ? 'text-sky-300 font-bold'
                                : isTitleWon || isCupChamp || isChamp
                                ? 'text-amber-300 font-bold'
                                : isPromo
                                ? 'text-emerald-300 font-bold'
                                : isCinderella
                                ? 'text-purple-300 font-bold'
                                : isTransfer
                                ? 'text-sky-300 font-bold'
                                : isInsolv
                                ? 'text-amber-300 font-bold'
                                : isReleg
                                ? 'text-rose-300'
                                : 'text-zinc-300'
                            }
                          >
                            {move.toLeagueName}
                          </span>
                        </div>

                        {statusBadge}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  <i className="fa-solid fa-filter text-lg text-zinc-600 mb-2 block"></i>
                  <span>No movements found for the selected filter.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueTableModal;