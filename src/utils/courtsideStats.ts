import { Club, GameState, UniverseMovement } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import {
  getLeagueInfo,
  normalizeCountry,
  formatOrganicAttendance,
  calculateClubFinancials,
  calculateClubReputation,
  getClubHistoricContext,
  getClubHomeArena,
  getCountryFlag,
  getDomesticCupInfo,
  getDomesticSupercupInfo,
  COUNTRIES,
} from '../data/gameConstants';
import { getLeagueSize } from '../engine/engine';
import { generateLeagueTable, buildLiveLeagueStandings, TableRow } from './leagueTableGenerator';
import { ArenaDesignId, ArenaColorScheme } from './arenaArchitecture';
export type { ArenaColorScheme };
import { getContinentalCupNames } from './regionHelpers';
import { buildClubHeritageTimeline } from './clubHeritageHistory';

export interface FormBadge {
  result: 'W' | 'D' | 'L';
}

export interface NextFixtureItem {
  id: string;
  opponentId?: number | string;
  opponentName: string;
  opponentShort: string;
  opponentCode: string;
  opponentColor: string;
  opponentColor2?: string;
  opponentLogo?: string;
  opponentFallbackLogo?: string;
  opponentOvr: number;
  isHome: boolean;
  dayLabel: string;
  timeLabel: string;
  contextLabel: string;
  competition: string;
}

export interface AdjacentStandingItem {
  pos: number;
  id?: number | string;
  name: string;
  shortName: string;
  color: string;
  color2?: string;
  logo?: string;
  fallbackLogo?: string;
  played: number;
  w: number;
  d: number;
  l: number;
  gd: string;
  pts: number;
  isUser: boolean;
  statusMarker?: string;
}


export interface ShotMarker {
  id: string;
  x: number; // 0..100 court width
  y: number; // 0..100 half-court depth (0 = goal line, 100 = near midcourt)
  made: boolean;
  zone: 'crease' | 'backcourt' | 'wing';
  unit: 'Backcourt' | 'Wings & Pivot' | 'Fast Break';
}

export interface ScoringTrendPoint {
  month: string;
  fullMonth: string;
  scored: number;
  allowed: number;
  loadBars: [number, number, number];
}

export interface SpotlightFigure {
  initials: string;
  name: string;
  roleTag: string;
  subline: string;
  stats: [
    { label: string; value: string },
    { label: string; value: string },
    { label: string; value: string },
    { label: string; value: string }
  ];
}

export type FormSlot = 'W' | 'D' | 'L' | '—';

export interface LiveSeasonProgress {
  matchday: number;
  targetEnd: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  lastFive: ('W' | 'D' | 'L')[];
  latestFixture?: {
    opponentId?: number | string;
    opponentName: string;
    opponentColor?: string;
    opponentColor2?: string;
    opponentLogo?: string;
    opponentFallbackLogo?: string;
    opponentOvr: number;
    userGoals: number;
    oppGoals: number;
  };
}

export interface ClubContextSummary {
  clubName: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  tier: number;
  leagueName: string;
  homeArena: string;
  statureLabel: string;
  clubReputation: number;
  narrative: string;
}

export type TrophyIconKind = 'league' | 'cup' | 'supercup' | 'champions' | 'euro' | 'globe' | 'division';

export interface TrophyPedestalSlot {
  id: string;
  shortLabel: string;
  fullName: string;
  count: number;
  category: 'domestic' | 'international' | 'division';
  iconKind: TrophyIconKind;
}

export interface TrophyScopeBreakdown {
  total: number;
  domesticTotal: number;
  internationalTotal: number;
  divisionTotal: number;
  pedestals: TrophyPedestalSlot[];
}

export interface TrophyCollectionSummary {
  clubTotal: number;
  careerTotal: number;
  hasSeparateCareer: boolean;
  club: TrophyScopeBreakdown;
  career: TrophyScopeBreakdown;
}

export interface CourtsideAnalytics {
  selectedYear: number;
  availableYears: number[];
  clubId?: number | string;
  clubFullName: string;
  clubShortName: string;
  clubCode: string;
  clubColor: string;
  clubColor2?: string;
  clubLogo?: string;
  clubFallbackLogo?: string;
  arenaColors: ArenaColorScheme;
  arenaDesign: ArenaDesignId;
  arenaName: string;
  stadiumCapacity: number;
  leagueName: string;
  gamesPlayed: number;
  winRatePct: string;
  recordLabel: string;
  standingLabel: string;
  rankPos: number;
  leagueSize: number;
  lastFive: FormSlot[];
  adjacentStandings: AdjacentStandingItem[];
  executiveRatings: {
    ovr: number;
    maxOvrCap: number;
    seasonOvrDelta: number;
    impactScore: number;
    reputation: number;
    mediaPressure: number;
    immunityShields: number;
    fanBase: number;
  };
  coachSummary: {
    gmName: string;
    gmInitials: string;
    gmArchetype: string;
    coachName: string;
    coachInitials: string;
    archetype: string;
    tactic: string;
    philosophy: string;
    careerWinRate: number;
    tenureYears: number;
    coachHeat: number;
    skillPoints: number;
  };
  splits: {
    sixMeterPct: number;
    nineMeterPct: number;
    sevenMeterPct: number;
    goalsPerGame: string;
    allowedPerGame: string;
    savesPerGame: string;
  };
  nextFixtures: NextFixtureItem[];
  featuredMatch: {
    opponentId?: number | string;
    opponentName: string;
    opponentShort: string;
    opponentCode: string;
    opponentColor: string;
    opponentColor2?: string;
    opponentLogo?: string;
    opponentFallbackLogo?: string;
    opponentRecord: string;
    userScore: number;
    opponentScore: number;
    userHalf1: number;
    userHalf2: number;
    oppHalf1: number;
    oppHalf2: number;
    halfLabel: string;
    phaseBadge: string;
    clockBadge: string;
    attendanceNumeric: number;
    attendanceFormatted: string;
    utilizationPct: number;
    leadChanges: number;
    paceRating: string;
  };
  shotChart: {
    markers: ShotMarker[];
    creasePct: number;
    backcourtPct: number;
    wingPct: number;
    shotsLogged: number;
    isPreSeason: boolean;
  };
  scoringTrend: ScoringTrendPoint[];
  spotlight: SpotlightFigure;
  clubContext: ClubContextSummary;
  trophyCollection: TrophyCollectionSummary;
}

function getClubStatureLabel(rep: number): string {
  if (rep >= 90) return 'Global Superpower';
  if (rep >= 80) return 'Elite Club';
  if (rep >= 70) return 'Continental Contender';
  if (rep >= 60) return 'National Heavyweight';
  if (rep >= 50) return 'Established Pro Club';
  if (rep >= 40) return 'Solid Competitor';
  if (rep >= 30) return 'Regional Force';
  if (rep >= 20) return 'Local Contender';
  return 'Grassroots Club';
}

export function buildClubContextSummary(state: GameState): ClubContextSummary {
  const club = state?.club || ALL_CLUBS[0];
  const clubName = club?.name || 'SC Magdeburg';
  const countryCode = normalizeCountry(club?.country || 'GER');
  const tier = Math.max(1, club?.tier || 1);
  const ovr = club?.baseOvr || 75;
  const countryData = COUNTRIES[countryCode];
  const countryName = countryData?.name || countryCode;
  const countryFlag = getCountryFlag(countryCode);
  const leagueInfo = getLeagueInfo(tier, countryCode);
  const homeArena = getClubHomeArena(club) || deriveArenaName(clubName, countryCode, club);
  const clubReputation = Math.min(100, Math.max(1, calculateClubReputation(ovr, tier)));
  const statureLabel = getClubStatureLabel(clubReputation);
  const narrative = getClubHistoricContext(clubName, tier, false, countryCode, club);

  return {
    clubName,
    countryCode,
    countryName,
    countryFlag,
    tier,
    leagueName: leagueInfo?.name || '1. Bundesliga',
    homeArena,
    statureLabel,
    clubReputation,
    narrative,
  };
}

function buildPedestalList(
  counts: {
    bl: number;
    dfb: number;
    sc: number;
    cl: number;
    el: number;
    ecl: number;
    cwc: number;
    lower: number;
    reg: number;
  },
  tier: number,
  countryCode: string
): TrophyScopeBreakdown {
  const leagueName = getLeagueInfo(1, countryCode)?.name || 'Top-Flight League';
  const domesticCupName = getDomesticCupInfo(countryCode, 1)?.name || 'National Cup';
  const supercupName = getDomesticSupercupInfo(countryCode)?.name || 'Supercup';
  const continental = getContinentalCupNames(countryCode);

  const euroCount = counts.el + counts.ecl;
  const divisionRegCount = counts.lower + counts.reg;

  const pedestals: TrophyPedestalSlot[] = [
    {
      id: 'league',
      shortLabel: 'League',
      fullName: leagueName,
      count: counts.bl,
      category: 'domestic',
      iconKind: 'league',
    },
    {
      id: 'cup',
      shortLabel: 'Nat. Cup',
      fullName: domesticCupName,
      count: counts.dfb,
      category: 'domestic',
      iconKind: 'cup',
    },
    {
      id: 'supercup',
      shortLabel: 'Supercup',
      fullName: supercupName,
      count: counts.sc,
      category: 'domestic',
      iconKind: 'supercup',
    },
    {
      id: 'cl',
      shortLabel: 'Champ. Lg',
      fullName: continental.cl,
      count: counts.cl,
      category: 'international',
      iconKind: 'champions',
    },
    {
      id: 'euro',
      shortLabel: 'Euro Cup',
      fullName: `${continental.el} & ${continental.ecl}`,
      count: euroCount,
      category: 'international',
      iconKind: 'euro',
    },
  ];

  // Ensure the 6th (and if needed 7th) pedestal preserves exact total silverware sum
  if (counts.cwc > 0 && divisionRegCount > 0) {
    pedestals.push(
      {
        id: 'cwc',
        shortLabel: 'Super Globe',
        fullName: 'IHF Super Globe',
        count: counts.cwc,
        category: 'international',
        iconKind: 'globe',
      },
      {
        id: 'division',
        shortLabel: 'Div. & Reg.',
        fullName: 'Division & Regional Honours',
        count: divisionRegCount,
        category: 'division',
        iconKind: 'division',
      }
    );
  } else if (divisionRegCount > 0 || (tier > 1 && counts.cwc === 0)) {
    pedestals.push({
      id: 'division',
      shortLabel: 'Div. & Reg.',
      fullName: 'Division & Regional Honours',
      count: divisionRegCount,
      category: 'division',
      iconKind: 'division',
    });
  } else {
    pedestals.push({
      id: 'cwc',
      shortLabel: 'Super Globe',
      fullName: 'IHF Super Globe',
      count: counts.cwc,
      category: 'international',
      iconKind: 'globe',
    });
  }

  const domesticTotal = counts.bl + counts.dfb + counts.sc;
  const internationalTotal = counts.cl + counts.el + counts.ecl + counts.cwc;
  const divisionTotal = divisionRegCount;
  const total = domesticTotal + internationalTotal + divisionTotal;

  return {
    total,
    domesticTotal,
    internationalTotal,
    divisionTotal,
    pedestals,
  };
}

export function buildTrophyCollectionSummary(state: GameState): TrophyCollectionSummary {
  const club = state?.club || ALL_CLUBS[0];
  const clubName = club?.name || 'SC Magdeburg';
  const countryCode = normalizeCountry(club?.country || 'GER');
  const tier = Math.max(1, club?.tier || 1);
  const allHistory = Array.isArray(state?.history) ? state.history : [];

  const isSameClubHistory = (h: any): boolean => {
    if (!h) return false;
    if (
      club?.id !== undefined &&
      h.clubId !== undefined &&
      String(h.clubId) === String(club.id)
    ) {
      return true;
    }
    const cleanTarget = clubName.trim().toLowerCase();
    const cleanHist = String(h.clubName || '').trim().toLowerCase();
    return Boolean(cleanTarget && cleanHist === cleanTarget);
  };

  const currentClubHistory = allHistory.filter(isSameClubHistory);
  const clubHeritageHistory = buildClubHeritageTimeline(state, club);

  // Gather universe movements for extra cup reconciliation (matching ClubProfileModal)
  const allRecordedMovements: UniverseMovement[] = [];
  const seenMovementIds = new Set<string>();
  const addMovementIfNew = (m?: UniverseMovement) => {
    if (!m) return;
    const key = m.id || `${m.year}-${m.clubId || m.clubName}-${m.type}-${m.cupTitle || ''}`;
    if (!seenMovementIds.has(key)) {
      seenMovementIds.add(key);
      allRecordedMovements.push(m);
    }
  };

  (state?.universeMovements || []).forEach(addMovementIfNew);
  allHistory.forEach((h) => {
    (h?.universeMovements || []).forEach(addMovementIfNew);
  });

  const isCurrentClubMovement = (m: UniverseMovement): boolean => {
    if (!m) return false;
    const nameMatch = Boolean(
      m.clubName &&
        clubName &&
        m.clubName.trim().toLowerCase() === clubName.trim().toLowerCase()
    );
    const idMatch = Boolean(
      club?.id !== undefined &&
        m.clubId !== undefined &&
        String(m.clubId) === String(club.id)
    );
    return nameMatch || idMatch;
  };

  let extraDfb = 0;
  let extraReg = 0;
  let extraCl = 0;
  let extraEl = 0;
  let extraEcl = 0;
  let extraCwc = 0;
  let extraSc = 0;

  let careerExtraDfb = 0;
  let careerExtraReg = 0;
  let careerExtraCl = 0;
  let careerExtraEl = 0;
  let careerExtraEcl = 0;
  let careerExtraCwc = 0;

  const countedCupYears = {
    cwc: new Set<number>(),
    cl: new Set<number>(),
    el: new Set<number>(),
    ecl: new Set<number>(),
    dfb: new Set<number>(),
    sc: new Set<number>(),
    reg: new Set<number>(),
  };

  const countedCareerCupYears = {
    cwc: new Set<number>(),
    cl: new Set<number>(),
    el: new Set<number>(),
    ecl: new Set<number>(),
    dfb: new Set<number>(),
    sc: new Set<number>(),
    reg: new Set<number>(),
  };

  clubHeritageHistory.forEach((h) => {
    if (h.trophiesThisYear?.cwc) countedCupYears.cwc.add(h.year);
    if (h.trophiesThisYear?.cl) countedCupYears.cl.add(h.year);
    if (h.trophiesThisYear?.el) countedCupYears.el.add(h.year);
    if (h.trophiesThisYear?.ecl) countedCupYears.ecl.add(h.year);
    if (h.trophiesThisYear?.dfb) countedCupYears.dfb.add(h.year);
    if (h.trophiesThisYear?.sc) countedCupYears.sc.add(h.year);
    if (h.trophiesThisYear?.reg) countedCupYears.reg.add(h.year);
  });

  currentClubHistory.forEach((h) => {
    if (h.trophiesThisYear?.cwc) countedCareerCupYears.cwc.add(h.year);
    if (h.trophiesThisYear?.cl) countedCareerCupYears.cl.add(h.year);
    if (h.trophiesThisYear?.el) countedCareerCupYears.el.add(h.year);
    if (h.trophiesThisYear?.ecl) countedCareerCupYears.ecl.add(h.year);
    if (h.trophiesThisYear?.dfb) countedCareerCupYears.dfb.add(h.year);
    if (h.trophiesThisYear?.sc) countedCareerCupYears.sc.add(h.year);
    if (h.trophiesThisYear?.reg) countedCareerCupYears.reg.add(h.year);
  });

  const currentClubYears = new Set(currentClubHistory.map((h) => h.year));

  (state?.cupRunResults || []).forEach((r) => {
    if (r?.won && currentClubYears.has(r.year)) {
      const yr = r.year;
      const name = String(r.nameEn || '').toLowerCase();
      if (r.id === 'cwc' || name.includes('super globe') || name.includes('club world')) {
        if (!countedCupYears.cwc.has(yr)) {
          countedCupYears.cwc.add(yr);
          extraCwc++;
        }
        if (!countedCareerCupYears.cwc.has(yr)) {
          countedCareerCupYears.cwc.add(yr);
          careerExtraCwc++;
        }
      } else if (r.id === 'reg_cup' || name.includes('regional') || name.includes('amateur')) {
        if (!countedCupYears.reg.has(yr)) {
          countedCupYears.reg.add(yr);
          extraReg++;
        }
        if (!countedCareerCupYears.reg.has(yr)) {
          countedCareerCupYears.reg.add(yr);
          careerExtraReg++;
        }
      } else if (
        r.id === 'euro_cup' ||
        r.id === 'cl' ||
        r.id === 'el' ||
        r.id === 'ecl' ||
        name.includes('champions league') ||
        name.includes('european league') ||
        name.includes('euro league') ||
        name.includes('european cup')
      ) {
        if (name.includes('champions league') || r.id === 'cl') {
          if (!countedCupYears.cl.has(yr)) {
            countedCupYears.cl.add(yr);
            extraCl++;
          }
          if (!countedCareerCupYears.cl.has(yr)) {
            countedCareerCupYears.cl.add(yr);
            careerExtraCl++;
          }
        } else if (name.includes('european league') || name.includes('euro league') || r.id === 'el') {
          if (!countedCupYears.el.has(yr)) {
            countedCupYears.el.add(yr);
            extraEl++;
          }
          if (!countedCareerCupYears.el.has(yr)) {
            countedCareerCupYears.el.add(yr);
            careerExtraEl++;
          }
        } else if (name.includes('european cup') || name.includes('ecl') || r.id === 'ecl') {
          if (!countedCupYears.ecl.has(yr)) {
            countedCupYears.ecl.add(yr);
            extraEcl++;
          }
          if (!countedCareerCupYears.ecl.has(yr)) {
            countedCareerCupYears.ecl.add(yr);
            careerExtraEcl++;
          }
        }
      } else {
        if (!countedCupYears.dfb.has(yr)) {
          countedCupYears.dfb.add(yr);
          extraDfb++;
        }
        if (!countedCareerCupYears.dfb.has(yr)) {
          countedCareerCupYears.dfb.add(yr);
          careerExtraDfb++;
        }
      }
    }
  });

  const isSupercupMovement = (m: any): boolean => {
    const mId = String(m?.id || '').toLowerCase();
    const title = String(m?.cupTitle || '').toLowerCase();
    return (
      mId.endsWith('-cup-sc') ||
      mId.includes('-cup-sc') ||
      mId.endsWith('-cup-esc') ||
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
      title.includes('supercupa') ||
      title.includes('supercupen') ||
      title.includes('trophée des champions') ||
      title.includes('trophee des champions') ||
      title.includes('meistarakeppni')
    );
  };

  allRecordedMovements
    .filter((m) => isCurrentClubMovement(m) && m.type === 'intl_cup')
    .forEach((m) => {
      const title = String(m.cupTitle || '').toLowerCase();
      const yr = m.year;
      const isManagedYear = currentClubYears.has(yr);
      if (isSupercupMovement(m)) {
        if (!isManagedYear && !countedCupYears.sc.has(yr)) {
          countedCupYears.sc.add(yr);
          extraSc++;
        }
        return;
      }
      if (title.includes('super globe')) {
        if (!countedCupYears.cwc.has(yr)) {
          countedCupYears.cwc.add(yr);
          extraCwc++;
        }
        if (isManagedYear && !countedCareerCupYears.cwc.has(yr)) {
          countedCareerCupYears.cwc.add(yr);
          careerExtraCwc++;
        }
      } else if (title.includes('champions league')) {
        if (!countedCupYears.cl.has(yr)) {
          countedCupYears.cl.add(yr);
          extraCl++;
        }
        if (isManagedYear && !countedCareerCupYears.cl.has(yr)) {
          countedCareerCupYears.cl.add(yr);
          careerExtraCl++;
        }
      } else if (title.includes('european league')) {
        if (!countedCupYears.el.has(yr)) {
          countedCupYears.el.add(yr);
          extraEl++;
        }
        if (isManagedYear && !countedCareerCupYears.el.has(yr)) {
          countedCareerCupYears.el.add(yr);
          careerExtraEl++;
        }
      } else if (title.includes('european cup')) {
        if (!countedCupYears.ecl.has(yr)) {
          countedCupYears.ecl.add(yr);
          extraEcl++;
        }
        if (isManagedYear && !countedCareerCupYears.ecl.has(yr)) {
          countedCareerCupYears.ecl.add(yr);
          careerExtraEcl++;
        }
      } else if (title.includes('amateur') || title.includes('regional')) {
        if (!countedCupYears.reg.has(yr)) {
          countedCupYears.reg.add(yr);
          extraReg++;
        }
        if (isManagedYear && !countedCareerCupYears.reg.has(yr)) {
          countedCareerCupYears.reg.add(yr);
          careerExtraReg++;
        }
      } else if (
        title.includes('pokal') ||
        title.includes('cup') ||
        title.includes('copa') ||
        title.includes('coupe') ||
        title.includes('puchar') ||
        title.includes('kupa') ||
        title.includes('kup') ||
        title.includes('coppa') ||
        title.includes('cupa') ||
        title.includes('cupen') ||
        title.includes('taça') ||
        title.includes('taca') ||
        title.includes('bikar') ||
        title.includes('nm') ||
        m.type === 'intl_cup'
      ) {
        if (!countedCupYears.dfb.has(yr)) {
          countedCupYears.dfb.add(yr);
          extraDfb++;
        }
        if (isManagedYear && !countedCareerCupYears.dfb.has(yr)) {
          countedCareerCupYears.dfb.add(yr);
          careerExtraDfb++;
        }
      }
    });

  const pendingSc = state?.pendingSupercupTrophies?.sc || 0;

  const sumTopLeague = (rows: any[]) =>
    rows.reduce((sum, h) => {
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      const isChamp = h.pos === undefined || h.pos === 1;
      return sum + (!isLower && isChamp && h.trophiesThisYear?.bl ? h.trophiesThisYear.bl || 1 : 0);
    }, 0);

  const sumLowerLeague = (rows: any[]) =>
    rows.reduce((sum, h) => {
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      const isChamp = h.pos === undefined || h.pos === 1;
      if (!isChamp) return sum;
      return sum + (h.trophiesThisYear?.lower || 0) + (isLower ? h.trophiesThisYear?.bl || 0 : 0);
    }, 0);

  const clubCounts = {
    cwc: clubHeritageHistory.reduce((s, h) => s + (h.trophiesThisYear?.cwc || 0), 0) + extraCwc,
    cl: clubHeritageHistory.reduce((s, h) => s + (h.trophiesThisYear?.cl || 0), 0) + extraCl,
    el: clubHeritageHistory.reduce((s, h) => s + (h.trophiesThisYear?.el || 0), 0) + extraEl,
    ecl: clubHeritageHistory.reduce((s, h) => s + (h.trophiesThisYear?.ecl || 0), 0) + extraEcl,
    bl: sumTopLeague(clubHeritageHistory),
    lower: sumLowerLeague(clubHeritageHistory),
    dfb: clubHeritageHistory.reduce((s, h) => s + (h.trophiesThisYear?.dfb || 0), 0) + extraDfb,
    sc: clubHeritageHistory.reduce((s, h) => s + (h.trophiesThisYear?.sc || 0), 0) + extraSc + pendingSc,
    reg: clubHeritageHistory.reduce((s, h) => s + (h.trophiesThisYear?.reg || 0), 0) + extraReg,
  };

  const careerCounts = {
    cwc: allHistory.reduce((s, h) => s + (h.trophiesThisYear?.cwc || 0), 0) + careerExtraCwc,
    cl: allHistory.reduce((s, h) => s + (h.trophiesThisYear?.cl || 0), 0) + careerExtraCl,
    el: allHistory.reduce((s, h) => s + (h.trophiesThisYear?.el || 0), 0) + careerExtraEl,
    ecl: allHistory.reduce((s, h) => s + (h.trophiesThisYear?.ecl || 0), 0) + careerExtraEcl,
    bl: sumTopLeague(allHistory),
    lower: sumLowerLeague(allHistory),
    dfb: allHistory.reduce((s, h) => s + (h.trophiesThisYear?.dfb || 0), 0) + careerExtraDfb,
    sc: allHistory.reduce((s, h) => s + (h.trophiesThisYear?.sc || 0), 0) + pendingSc,
    reg: allHistory.reduce((s, h) => s + (h.trophiesThisYear?.reg || 0), 0) + careerExtraReg,
  };

  const clubBreakdown = buildPedestalList(clubCounts, tier, countryCode);
  const careerBreakdown = buildPedestalList(careerCounts, tier, countryCode);

  return {
    clubTotal: clubBreakdown.total,
    careerTotal: careerBreakdown.total,
    hasSeparateCareer:
      careerBreakdown.total !== clubBreakdown.total ||
      allHistory.some((h) => !isSameClubHistory(h)),
    club: clubBreakdown,
    career: careerBreakdown,
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function seededRand(seed: number, step: number): number {
  const x = Math.sin(seed * 0.0017 + step * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function parseHexRgb(hex?: string, fallback: [number, number, number] = [223, 100, 42]): [number, number, number] {
  if (!hex || typeof hex !== 'string') return fallback;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return fallback;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

function getLuminance([r, g, b]: [number, number, number]): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function shadeRgb([r, g, b]: [number, number, number], factor: number): string {
  if (factor >= 0) {
    return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
  }
  const m = 1 + factor;
  return rgbToHex(r * m, g * m, b * m);
}

export function resolveArenaColorScheme(
  homeColor?: string,
  homeColor2?: string,
  awayColor?: string,
  awayColor2?: string
): ArenaColorScheme {
  const rawHome = parseHexRgb(homeColor, [223, 100, 42]);
  const rawHome2 = homeColor2 ? parseHexRgb(homeColor2, [30, 38, 56]) : null;
  const homeLum = getLuminance(rawHome);

  // Pick a rich, visible court paint color (if primary is near-white, try color2 or royal slate)
  let paintRgb: [number, number, number] = rawHome;
  if (homeLum > 0.8) {
    if (rawHome2 && getLuminance(rawHome2) <= 0.78 && getLuminance(rawHome2) >= 0.06) {
      paintRgb = rawHome2;
    } else {
      paintRgb = [30, 58, 138]; // Classic indoor handball court royal blue for all-white clubs
    }
  } else if (homeLum < 0.07) {
    if (rawHome2 && getLuminance(rawHome2) >= 0.12 && getLuminance(rawHome2) <= 0.8) {
      paintRgb = rawHome2;
    } else {
      paintRgb = [35, 48, 74]; // Deep slate court paint for pure-black clubs
    }
  }

  // Avoid blending into maple hardwood (#CA8B4E ~ [202, 139, 78])
  if (colorDistance(paintRgb, [202, 139, 78]) < 52) {
    paintRgb = [212, 84, 34];
  }

  const courtPaintColor = rgbToHex(paintRgb[0], paintRgb[1], paintRgb[2]);
  const courtApronColor = shadeRgb(paintRgb, -0.22);

  let ledRibbonColor = shadeRgb(paintRgb, 0.16);
  if (rawHome2) {
    const lum2 = getLuminance(rawHome2);
    if (lum2 >= 0.15 && lum2 <= 0.88 && colorDistance(rawHome2, paintRgb) > 45) {
      ledRibbonColor = rgbToHex(rawHome2[0], rawHome2[1], rawHome2[2]);
    }
  }

  // Home Jersey & Shorts
  let homeJerseyRgb = rawHome;
  if (homeLum > 0.9 && rawHome2 && getLuminance(rawHome2) < 0.75) {
    // Keep white home jersey if club is iconic white (e.g. THW Kiel / Real), with dark shorts
    homeJerseyRgb = [248, 250, 252];
  }
  const homeJerseyColor = rgbToHex(homeJerseyRgb[0], homeJerseyRgb[1], homeJerseyRgb[2]);
  const homeShortsColor =
    rawHome2 && colorDistance(rawHome2, homeJerseyRgb) > 55
      ? rgbToHex(rawHome2[0], rawHome2[1], rawHome2[2])
      : getLuminance(homeJerseyRgb) > 0.65
      ? '#181C2A'
      : '#1E2434';

  // Away Jersey & Shorts (guaranteed contrast against Home Jersey!)
  const rawAway = parseHexRgb(awayColor, [248, 250, 252]);
  const rawAway2 = awayColor2 ? parseHexRgb(awayColor2, [51, 65, 85]) : null;
  let awayJerseyRgb = rawAway;

  if (colorDistance(awayJerseyRgb, homeJerseyRgb) < 95) {
    if (rawAway2 && colorDistance(rawAway2, homeJerseyRgb) >= 95) {
      awayJerseyRgb = rawAway2;
    } else if (getLuminance(homeJerseyRgb) < 0.6) {
      awayJerseyRgb = [248, 250, 252]; // Crisp white change kit
    } else {
      awayJerseyRgb = [30, 41, 59]; // Crisp dark navy change kit against light home kit
    }
  }

  const awayJerseyColor = rgbToHex(awayJerseyRgb[0], awayJerseyRgb[1], awayJerseyRgb[2]);
  const awayShortsColor =
    getLuminance(awayJerseyRgb) > 0.65 ? '#334155' : '#F1F5F9';

  return {
    courtPaintColor,
    courtApronColor,
    ledRibbonColor,
    homeJerseyColor,
    homeShortsColor,
    awayJerseyColor,
    awayShortsColor,
    accentHex: courtPaintColor,
  };
}

export function getShortClubLabel(name: string): string {
  if (!name) return 'Club';
  let cleaned = name.trim();
  const prefixPattern =
    /^(SC|THW|SG|BBM|MT|TBV|TVB|VfL|HC|HBW|HSG|TSV|TuS|DJK|FRISCH AUF!|Rhein-Neckar|Füchse|BM|FC|Paris|RK|KS|GOG|OTP Bank-PICK|Telekom|Industria|Orlen)\s+/i;
  while (prefixPattern.test(cleaned)) {
    const next = cleaned.replace(prefixPattern, '').trim();
    if (next.length < 3 || /^(h[aå]ndbold|handball|sport|club|hc|hk|hb)$/i.test(next)) break;
    cleaned = next;
  }
  const suffixPattern = /\s+(Håndbold|Handbold|Handball|HB|HK|HC)$/i;
  if (suffixPattern.test(cleaned)) {
    const withoutSuffix = cleaned.replace(suffixPattern, '').trim();
    if (withoutSuffix.length >= 3) cleaned = withoutSuffix;
  }
  if (cleaned.length > 13 && cleaned.includes('-')) {
    const hyphParts = cleaned.split('-').filter(Boolean);
    cleaned = hyphParts[0].length >= 4 ? hyphParts[0] : hyphParts[hyphParts.length - 1];
  }
  if (cleaned.length >= 3 && cleaned.length <= 13) return cleaned;
  const parts = cleaned.split(/\s+/);
  return parts[parts.length - 1] || name.slice(0, 12);
}

export function getClubTriCode(name: string): string {
  if (!name) return 'HBL';
  const alpha = name.replace(/[^A-Za-zÄÖÜäöüß]/g, '').toUpperCase();
  const words = name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }
  if (words.length === 2 && words[0].length <= 3) {
    return (words[0].slice(0, 2) + words[1][0]).toUpperCase().slice(0, 3);
  }
  if (words.length === 2) {
    return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  }
  return (alpha.slice(0, 3) || 'CLB').padEnd(3, 'X');
}

export function deriveArenaName(
  clubName: string,
  country: string,
  club?: Partial<Club> | null
): string {
  if (club?.customArenaName && String(club.customArenaName).trim()) {
    return String(club.customArenaName).trim();
  }
  const lower = (clubName || '').toLowerCase();
  if (lower.includes('magdeburg') && (lower.includes('youngsters') || /\b(ii|2)\b/i.test(lower))) {
    return 'Wolfgang-Lakenmacher-Halle';
  }
  const matchedDbClub =
    club ||
    ALL_CLUBS.find(
      (c) => c.name && clubName && c.name.trim().toLowerCase() === clubName.trim().toLowerCase()
    );
  const resolved = getClubHomeArena(matchedDbClub || { name: clubName, country });
  const genericFallback = `${clubName || 'Club'} Arena`;
  if (resolved && resolved !== genericFallback && resolved !== 'Club Arena') {
    // Strip trailing ", City" location suffix so pitch stenciling shows the pure venue name (e.g. "Werner-Aßmann-Halle")
    return resolved.replace(/,\s*[^,]+$/, '').trim();
  }
  if (lower.includes('magdeburg')) return 'GETEC Arena';
  if (lower.includes('kiel')) return 'Wunderino Arena';
  if (lower.includes('flensburg')) return 'GP JOULE Arena';
  if (lower.includes('berlin') || lower.includes('füchse')) return 'Max-Schmeling-Halle';
  if (lower.includes('löwen') || lower.includes('mannheim')) return 'SAP Arena';
  if (lower.includes('melsungen')) return 'Rothenbach-Halle';
  if (lower.includes('barcelona') || lower.includes('barça')) return 'Palau Blaugrana';
  if (lower.includes('paris')) return 'Stade Pierre de Coubertin';
  if (lower.includes('veszprém') || lower.includes('veszprem')) return 'Veszprém Aréna';
  if (lower.includes('aalborg')) return 'Sparekassen Danmark Arena';
  if (lower.includes('kielce')) return 'Hala Legionów';
  const short = getShortClubLabel(clubName);
  return country === 'GER' ? `${short} Sporthalle` : `${short} Handball Arena`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const STAR_SURNAMES_BY_COUNTRY: Record<string, string[]> = {
  GER: ['Knorr', 'Golla', 'Köster', 'Uščins', 'Wolff', 'Mertens'],
  DEN: ['Gidsel', 'Pytlick', 'Jakobsen', 'Saugstrup', 'Landin'],
  FRA: ['Mem', 'Prandi', 'Remili', 'Fabregas', 'Desbonnet'],
  ESP: ['Dujshebaev', 'Gómez', 'Casado', 'Pérez de Vargas', 'Serdio'],
  POL: ['Sićko', 'Moryto', 'Syprzak', 'Olejniczak'],
  SWE: ['Gottfridsson', 'Claar', 'Wanne', 'Palicka'],
};

export function sliceAdjacentStandings(
  fullTable: TableRow[],
  clubRegistry: any[],
  windowSize: number = 9
): AdjacentStandingItem[] {
  if (!Array.isArray(fullTable) || fullTable.length === 0) return [];
  const count = Math.min(windowSize, fullTable.length);
  const userIdx = fullTable.findIndex((r) => r.isUser);
  const anchorIdx = userIdx >= 0 ? userIdx : 0;
  const half = Math.floor(count / 2);
  const start = Math.max(0, Math.min(fullTable.length - count, anchorIdx - half));
  const slice = fullTable.slice(start, start + count);

  return slice.map((row) => {
    const matched =
      clubRegistry.find(
        (c) =>
          (row.id !== undefined && String(c.id) === String(row.id)) ||
          (c.name && row.name && c.name.toLowerCase() === row.name.toLowerCase())
      ) ||
      ALL_CLUBS.find(
        (c) =>
          (row.id !== undefined && String(c.id) === String(row.id)) ||
          (c.name && row.name && c.name.toLowerCase() === row.name.toLowerCase())
      );

    return {
      pos: row.pos,
      id: row.id ?? matched?.id,
      name: row.name,
      shortName: getShortClubLabel(row.name),
      color: row.color || matched?.color || '#334155',
      color2: matched?.color2,
      logo: row.logo || matched?.logo,
      fallbackLogo: row.fallbackLogo || matched?.fallbackLogo,
      played: (row.w || 0) + (row.d || 0) + (row.l || 0),
      w: row.w || 0,
      d: row.d || 0,
      l: row.l || 0,
      gd: row.gd || '0',
      pts: row.pts || 0,
      isUser: Boolean(row.isUser),
      statusMarker: row.statusMarker,
    };
  });
}

function buildPartialStandingsTable(
  state: GameState,
  registryPool: any[],
  effectiveTier: number,
  year: number,
  played: number,
  userStats: { wins: number; draws: number; losses: number; gf: number; ga: number },
  fallbackZeroTable: TableRow[]
): TableRow[] {
  if (played <= 0) return fallbackZeroTable;
  try {
    return buildLiveLeagueStandings(state, registryPool, effectiveTier, played, userStats, year);
  } catch {
    return fallbackZeroTable;
  }
}

export function buildCourtsideAnalytics(
  state: GameState,
  activeClubs: any[] = ALL_CLUBS,
  selectedYearOverride?: number,
  isFirstHalf: boolean = true,
  supercupMatch?: any,
  liveProgress?: LiveSeasonProgress | null
): CourtsideAnalytics {
  const club = state?.club || ALL_CLUBS[0];
  const clubName = club?.name || 'SC Magdeburg';
  const country = normalizeCountry(club?.country || 'GER');
  const tier = club?.tier || 1;
  const ovr = club?.baseOvr || 75;
  const morale = (club as any)?.morale ?? (state as any)?.morale ?? 75;
  const tactic = state?.tactic || 'Balanced 6-0';
  const philosophy = (club as any)?.philosophy || (state as any)?.philosophy || 'Total Handball';
  const currentYear = state?.year || 2026;

  const history = Array.isArray(state?.history) ? state.history : [];
  const historyYears = history.map((h) => h.year).filter((y): y is number => typeof y === 'number');
  const availableYears = Array.from(new Set([currentYear, ...historyYears])).sort((a, b) => b - a);
  const selectedYear =
    selectedYearOverride && availableYears.includes(selectedYearOverride)
      ? selectedYearOverride
      : currentYear;

  const matchedHistory = history.find((h) => h.year === selectedYear);
  const isCurrentActiveSeason = !matchedHistory && selectedYear === currentYear;
  const effectiveTier = matchedHistory?.tier || tier;
  const leagueInfo = getLeagueInfo(effectiveTier, country);
  const leagueName = leagueInfo?.name || '1. Bundesliga';

  const registryPool = activeClubs && activeClubs.length > 0 ? activeClubs : ALL_CLUBS;
  const pool = registryPool.filter(
    (c) => normalizeCountry(c.country || 'GER') === country && (c.tier || 1) === effectiveTier
  );
  const peerClubs = pool.length >= 4 ? pool : ALL_CLUBS.filter((c) => (c.tier || 1) === effectiveTier);
  const leagueSize = matchedHistory
    ? ((matchedHistory as any).leagueSize || getLeagueSize(effectiveTier, country))
    : Math.max(4, peerClubs.length || getLeagueSize(effectiveTier, country));
  const totalGames = Math.max(10, (leagueSize - 1) * 2);
  const halfMatchdays = Math.floor(totalGames / 2);

  const avgPeerOvr =
    peerClubs.length > 0
      ? peerClubs.reduce((acc, c) => acc + (c.baseOvr || 72), 0) / peerClubs.length
      : effectiveTier === 1
      ? 82
      : 70;

  const seed = hashSeed(`${clubName}-${selectedYear}-${tactic}-${ovr}`);

  // Generate Base Division Table
  let fullLeagueTable: TableRow[] = [];
  try {
    fullLeagueTable = matchedHistory
      ? generateLeagueTable(state, registryPool, effectiveTier, matchedHistory)
      : generateLeagueTable(state, registryPool, effectiveTier);
  } catch {
    fullLeagueTable = [];
  }

  // Determine exact campaign progress (Pre-season 0-0-0 -> Live Tick -> Mid-Season -> Full Season)
  let gamesPlayed = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let seasonGf = 0;
  let seasonGa = 0;
  let rankPos = fullLeagueTable.find((r) => r.isUser)?.pos || 1;
  let lastFive: FormSlot[] = ['—', '—', '—', '—', '—'];

  if (matchedHistory) {
    const userRow = fullLeagueTable.find((r) => r.isUser);
    rankPos = matchedHistory.pos || userRow?.pos || 1;
    if (
      typeof matchedHistory.wins === 'number' &&
      typeof matchedHistory.draws === 'number' &&
      typeof matchedHistory.losses === 'number' &&
      matchedHistory.wins + matchedHistory.draws + matchedHistory.losses > 0
    ) {
      wins = matchedHistory.wins;
      draws = matchedHistory.draws;
      losses = matchedHistory.losses;
    } else if (userRow && userRow.w + userRow.d + userRow.l > 0) {
      wins = userRow.w;
      draws = userRow.d;
      losses = userRow.l;
    } else {
      const strengthRatio = Math.max(0.12, Math.min(0.92, 1 - (rankPos - 1) / Math.max(1, leagueSize - 1)));
      wins = Math.round(totalGames * (0.2 + strengthRatio * 0.68));
      draws = Math.min(4, Math.max(0, Math.round((1 - Math.abs(strengthRatio - 0.5)) * 3)));
      losses = Math.max(0, totalGames - wins - draws);
    }
    gamesPlayed = wins + draws + losses;
    seasonGf = matchedHistory.gf || Math.round(gamesPlayed * (28.5 + (ovr - 75) * 0.22));
    seasonGa = matchedHistory.ga || Math.round(gamesPlayed * (28.0 - (ovr - avgPeerOvr) * 0.18));

    const winRateRatio = gamesPlayed > 0 ? (wins + draws * 0.5) / gamesPlayed : 0.5;
    const histForm: FormSlot[] = [];
    for (let i = 0; i < 5; i++) {
      const r = seededRand(seed + wins * 13 + losses * 7, i + 1);
      if (r < winRateRatio - 0.04) histForm.push('W');
      else if (r < winRateRatio + 0.06) histForm.push('D');
      else histForm.push('L');
    }
    lastFive = histForm;
  } else if (isCurrentActiveSeason && liveProgress && liveProgress.matchday >= 1) {
    wins = liveProgress.wins;
    draws = liveProgress.draws;
    losses = liveProgress.losses;
    gamesPlayed = Math.max(1, wins + draws + losses);
    seasonGf = liveProgress.gf;
    seasonGa = liveProgress.ga;

    const recent = liveProgress.lastFive.slice(-5);
    lastFive = [...recent, ...Array(Math.max(0, 5 - recent.length)).fill('—')] as FormSlot[];

    fullLeagueTable = buildPartialStandingsTable(
      state,
      registryPool,
      effectiveTier,
      selectedYear,
      gamesPlayed,
      { wins, draws, losses, gf: seasonGf, ga: seasonGa },
      fullLeagueTable
    );
    rankPos = fullLeagueTable.find((r) => r.isUser)?.pos || rankPos;
  } else if (isCurrentActiveSeason && !isFirstHalf) {
    // Mid-season (Winter Break completed, awaiting 2nd half simulation)
    const pendingMeta = (state?.pendingSeasonState as any)?._meta;
    const fhOutcomes: ('W' | 'D' | 'L')[] | undefined = pendingMeta?.firstHalfOutcomes;
    const midStats = (state as any)?.midSeasonStats;

    if (Array.isArray(fhOutcomes) && fhOutcomes.length > 0) {
      wins = fhOutcomes.filter((o) => o === 'W').length;
      draws = fhOutcomes.filter((o) => o === 'D').length;
      losses = fhOutcomes.filter((o) => o === 'L').length;
      gamesPlayed = fhOutcomes.length;
      const rawGf = pendingMeta?.initialRawGf ?? (state?.pendingSeasonState as any)?.gf;
      const rawGa = pendingMeta?.initialRawGa ?? (state?.pendingSeasonState as any)?.ga;
      seasonGf = rawGf
        ? Math.round(rawGf * (gamesPlayed / Math.max(1, totalGames)))
        : Math.round(gamesPlayed * (28.5 + (ovr - 75) * 0.22));
      seasonGa = rawGa
        ? Math.round(rawGa * (gamesPlayed / Math.max(1, totalGames)))
        : Math.round(gamesPlayed * (28.0 - (ovr - avgPeerOvr) * 0.18));
      const tail = fhOutcomes.slice(-5);
      lastFive = [...tail, ...Array(Math.max(0, 5 - tail.length)).fill('—')] as FormSlot[];
    } else if (midStats && typeof midStats.played === 'number' && midStats.played > 0) {
      gamesPlayed = midStats.played;
      const pts = midStats.pts ?? Math.round(gamesPlayed * 1.1);
      wins = Math.min(gamesPlayed, Math.max(0, Math.floor(pts / 2)));
      draws = Math.min(gamesPlayed - wins, Math.max(0, pts - wins * 2));
      losses = Math.max(0, gamesPlayed - wins - draws);
      seasonGf = Math.round(gamesPlayed * (28.5 + (ovr - 75) * 0.22));
      seasonGa = Math.round(gamesPlayed * (28.0 - (ovr - avgPeerOvr) * 0.18));
      const winRateRatio = (wins + draws * 0.5) / Math.max(1, gamesPlayed);
      lastFive = Array.from({ length: 5 }, (_, i) => {
        const r = seededRand(seed, i + 1);
        return r < winRateRatio - 0.04 ? 'W' : r < winRateRatio + 0.06 ? 'D' : 'L';
      });
    } else {
      gamesPlayed = halfMatchdays;
      const ovrDelta = ovr - avgPeerOvr + (morale - 70) * 0.12;
      const winProb = Math.max(0.18, Math.min(0.88, 0.52 + ovrDelta * 0.028));
      wins = Math.round(gamesPlayed * winProb);
      draws = Math.min(gamesPlayed - wins, ovrDelta > -4 && ovrDelta < 4 ? 2 : 1);
      losses = Math.max(0, gamesPlayed - wins - draws);
      seasonGf = Math.round(gamesPlayed * (28.5 + (ovr - 75) * 0.22));
      seasonGa = Math.round(gamesPlayed * (28.0 - (ovr - avgPeerOvr) * 0.18));
      const winRateRatio = (wins + draws * 0.5) / Math.max(1, gamesPlayed);
      lastFive = Array.from({ length: 5 }, (_, i) => {
        const r = seededRand(seed, i + 1);
        return r < winRateRatio - 0.04 ? 'W' : r < winRateRatio + 0.06 ? 'D' : 'L';
      });
    }

    fullLeagueTable = buildPartialStandingsTable(
      state,
      registryPool,
      effectiveTier,
      selectedYear,
      gamesPlayed,
      { wins, draws, losses, gf: seasonGf, ga: seasonGa },
      fullLeagueTable
    );
    rankPos = fullLeagueTable.find((r) => r.isUser)?.pos || rankPos;
  } else {
    // START OF NEW SEASON (Pre-Supercup / Pre-Matchday 1): Reset cleanly to 0!
    gamesPlayed = 0;
    wins = 0;
    draws = 0;
    losses = 0;
    seasonGf = 0;
    seasonGa = 0;
    lastFive = ['—', '—', '—', '—', '—'];
    rankPos = fullLeagueTable.find((r) => r.isUser)?.pos || 1;
  }

  const adjacentStandings = sliceAdjacentStandings(fullLeagueTable, registryPool, 9);

  const winRateNum = gamesPlayed > 0 ? ((wins + draws * 0.5) / gamesPlayed) * 100 : 0;
  const winRatePct = gamesPlayed > 0 ? winRateNum.toFixed(1) : '0.0';
  const recordLabel = `${wins}–${draws}–${losses}`;
  const standingLabel =
    gamesPlayed > 0 ? `${ordinal(rankPos)} in ${leagueName}` : `Season opener · ${leagueName}`;

  // 2. Handball Shooting & Efficiency Splits (Adapted to Actual Season Outcomes!)
  const fastBreakBoost = tactic.toLowerCase().includes('fast') ? 3.2 : 0;
  const sevenSixBoost = tactic.includes('7v6') ? 2.6 : 0;
  const defenseBoost = tactic.includes('6-0') || tactic.includes('6:0') ? 1.8 : 0;

  const actualGfPerGame =
    gamesPlayed > 0
      ? seasonGf / gamesPlayed
      : 28.4 + (ovr - 75) * 0.22 + fastBreakBoost * 0.45 + sevenSixBoost * 0.5;
  const actualGaPerGame =
    gamesPlayed > 0
      ? seasonGa / gamesPlayed
      : 28.2 - (ovr - avgPeerOvr) * 0.19 - defenseBoost * 0.45 + (tactic.includes('7v6') ? 1.1 : 0);

  // Outcome efficiency modifier based on real goals/game and actual win rate vs expected
  const scoringEfficiencyDelta = gamesPlayed > 0 ? (actualGfPerGame - 28.5) * 1.15 : 0;
  const outcomeWinDelta = gamesPlayed > 0 ? (winRateNum - 50) * 0.11 : 0;

  const sixMeterPct = Number(
    Math.min(
      82.0,
      Math.max(
        48.0,
        60.5 + (ovr - 75) * 0.26 + fastBreakBoost + sevenSixBoost * 0.8 + scoringEfficiencyDelta + outcomeWinDelta
      )
    ).toFixed(1)
  );
  const nineMeterPct = Number(
    Math.min(
      58.0,
      Math.max(
        30.0,
        40.5 + (ovr - 75) * 0.22 + sevenSixBoost * 0.6 + scoringEfficiencyDelta * 0.85 + outcomeWinDelta * 0.8
      )
    ).toFixed(1)
  );
  const sevenMeterPct = Number(
    Math.min(
      91.0,
      Math.max(68.0, 77.8 + (ovr - 75) * 0.2 + (morale - 70) * 0.05 + outcomeWinDelta * 0.6)
    ).toFixed(1)
  );

  const goalsPerGame = gamesPlayed > 0 ? Math.max(18.0, Math.min(42.0, actualGfPerGame)).toFixed(1) : '0.0';
  const allowedPerGame = gamesPlayed > 0 ? Math.max(18.0, Math.min(42.0, actualGaPerGame)).toFixed(1) : '0.0';
  const savesPerGame =
    gamesPlayed > 0
      ? Math.max(7.5, Math.min(17.5, 11.4 + (30 - actualGaPerGame) * 0.32 + defenseBoost * 0.4)).toFixed(1)
      : '0.0';

  // 3. Opponents & Next Games Queue
  const rivals = peerClubs
    .filter((c) => String(c.id) !== String(club?.id) && c.name !== clubName)
    .sort((a, b) => Math.abs((b.baseOvr || 75) - ovr) - Math.abs((a.baseOvr || 75) - ovr));

  const fallbackRivals = ALL_CLUBS.filter((c) => c.name !== clubName).slice(0, 6);
  const candidateRivals = rivals.length >= 3 ? rivals : [...rivals, ...fallbackRivals];

  const days = [
    { day: 'Sat', time: '19:00' },
    { day: 'Wed', time: '20:30' },
    { day: 'Sun', time: '16:30' },
  ];

  const nextFixtures: NextFixtureItem[] = [];
  if (supercupMatch && isFirstHalf && isCurrentActiveSeason) {
    const scOppName = supercupMatch.opponent || supercupMatch.opponentName || candidateRivals[0]?.name || 'THW Kiel';
    const scClub =
      registryPool.find((c) => c.name && c.name.toLowerCase() === scOppName.toLowerCase()) ||
      ALL_CLUBS.find((c) => c.name && c.name.toLowerCase() === scOppName.toLowerCase());
    nextFixtures.push({
      id: 'fix-supercup',
      opponentId: scClub?.id,
      opponentName: scOppName,
      opponentShort: getShortClubLabel(scOppName),
      opponentCode: getClubTriCode(scOppName),
      opponentColor: supercupMatch.opponentColor || scClub?.color || '#1E293B',
      opponentColor2: scClub?.color2,
      opponentLogo: scClub?.logo,
      opponentFallbackLogo: scClub?.fallbackLogo,
      opponentOvr: supercupMatch.opponentOvr || scClub?.baseOvr || ovr,
      isHome: true,
      dayLabel: 'Fri',
      timeLabel: '20:00',
      contextLabel: 'Final',
      competition: supercupMatch.title || 'Supercup',
    });
  }

  for (let i = 0; nextFixtures.length < 3 && i < candidateRivals.length; i++) {
    const rClub = candidateRivals[(i + (seed % 3)) % candidateRivals.length] || candidateRivals[i];
    if (!rClub || nextFixtures.some((f) => f.opponentName === rClub.name)) continue;
    const peerRank =
      [...peerClubs]
        .sort((a, b) => (b.baseOvr || 70) - (a.baseOvr || 70))
        .findIndex((c) => c.name === rClub.name) + 1;
    const slot = days[nextFixtures.length] || days[0];
    const isEuro = nextFixtures.length === 1 && Boolean(state?.euroStatus);
    nextFixtures.push({
      id: `fix-${i}-${rClub.id}`,
      opponentId: rClub.id,
      opponentName: rClub.name,
      opponentShort: getShortClubLabel(rClub.name),
      opponentCode: getClubTriCode(rClub.name),
      opponentColor: rClub.color || (i === 0 ? '#2E5A44' : i === 1 ? '#5B3E96' : '#2563EB'),
      opponentColor2: rClub.color2,
      opponentLogo: rClub.logo,
      opponentFallbackLogo: rClub.fallbackLogo,
      opponentOvr: rClub.baseOvr || 76,
      isHome: nextFixtures.length !== 1,
      dayLabel: slot.day,
      timeLabel: slot.time,
      contextLabel: isEuro
        ? state.euroStatus === 'CL'
          ? 'EHF CL'
          : 'Euro Cup'
        : `${ordinal(peerRank > 0 ? peerRank : i + 2)} ${country}`,
      competition: isEuro ? 'EHF Champions League' : leagueName,
    });
  }

  // 4. Featured Matchup, Scoreboard & Color Matching
  const liveFix = isCurrentActiveSeason ? liveProgress?.latestFixture : undefined;
  const primaryOpp = liveFix
    ? {
        id: `fix-live-${liveProgress?.matchday}`,
        opponentId: liveFix.opponentId,
        opponentName: liveFix.opponentName,
        opponentShort: getShortClubLabel(liveFix.opponentName),
        opponentCode: getClubTriCode(liveFix.opponentName),
        opponentColor: liveFix.opponentColor || '#1E293B',
        opponentColor2: liveFix.opponentColor2,
        opponentLogo: liveFix.opponentLogo,
        opponentFallbackLogo: liveFix.opponentFallbackLogo,
        opponentOvr: liveFix.opponentOvr || avgPeerOvr,
        isHome: true,
        dayLabel: 'Live',
        timeLabel: 'Live',
        contextLabel: `MD ${liveProgress?.matchday}`,
        competition: leagueName,
      }
    : nextFixtures[0] || {
        id: 'fix-default',
        opponentId: 104,
        opponentName: 'THW Kiel',
        opponentShort: 'Kiel',
        opponentCode: 'KIE',
        opponentColor: '#1E293B',
        opponentColor2: '#FFFFFF',
        opponentLogo: undefined,
        opponentFallbackLogo: undefined,
        opponentOvr: 84,
        isHome: true,
        dayLabel: 'Sat',
        timeLabel: '19:00',
        contextLabel: '2nd GER',
        competition: leagueName,
      };

  const arenaColors = resolveArenaColorScheme(
    club?.color,
    club?.color2,
    primaryOpp.opponentColor,
    primaryOpp.opponentColor2
  );

  let userHalf1 = 0;
  let userHalf2 = 0;
  let oppHalf1 = 0;
  let oppHalf2 = 0;
  let userScore = 0;
  let opponentScore = 0;
  let opponentRecord = '0–0–0';
  let halfLabel = isFirstHalf ? 'First half' : 'Second half';

  const oppTableRow = fullLeagueTable.find(
    (r) =>
      (primaryOpp.opponentId !== undefined && String(r.id) === String(primaryOpp.opponentId)) ||
      (r.name && primaryOpp.opponentName && r.name.toLowerCase() === primaryOpp.opponentName.toLowerCase())
  );

  if (gamesPlayed > 0) {
    if (oppTableRow && oppTableRow.w + oppTableRow.d + oppTableRow.l > 0) {
      opponentRecord = `${oppTableRow.w}–${oppTableRow.d}–${oppTableRow.l}`;
    } else {
      const oppW = Math.max(
        0,
        Math.min(
          gamesPlayed,
          Math.round(gamesPlayed * Math.max(0.2, Math.min(0.82, 0.48 + (primaryOpp.opponentOvr - avgPeerOvr) * 0.025)))
        )
      );
      const oppD = Math.min(gamesPlayed - oppW, gamesPlayed >= 6 ? 1 : 0);
      const oppL = Math.max(0, gamesPlayed - oppW - oppD);
      opponentRecord = `${oppW}–${oppD}–${oppL}`;
    }
  }

  if (liveFix) {
    userScore = liveFix.userGoals;
    opponentScore = liveFix.oppGoals;
    userHalf1 = Math.floor(userScore * 0.48);
    userHalf2 = userScore - userHalf1;
    oppHalf1 = Math.floor(opponentScore * 0.48);
    oppHalf2 = opponentScore - oppHalf1;
    halfLabel = (liveProgress?.matchday || 1) <= halfMatchdays ? 'First half' : 'Second half';
  } else if (matchedHistory) {
    userHalf1 = Math.max(11, Math.min(20, Math.round(actualGfPerGame * 0.49 + (seededRand(seed, 11) - 0.5) * 2)));
    userHalf2 = Math.max(11, Math.min(21, Math.round(actualGfPerGame * 0.51 + (seededRand(seed, 12) - 0.5) * 2)));
    const oppStrengthGap = (primaryOpp.opponentOvr - ovr) * 0.14;
    oppHalf1 = Math.max(10, Math.min(19, Math.round(actualGaPerGame * 0.49 + oppStrengthGap)));
    oppHalf2 = Math.max(10, Math.min(20, Math.round(actualGaPerGame * 0.51 + oppStrengthGap)));
    userScore = userHalf1 + userHalf2;
    opponentScore = oppHalf1 + oppHalf2;
    halfLabel = 'Full time';
  } else {
    // Active season when idle (Pre-Supercup / Pre-1st Half OR awaiting 2nd Half kickoff):
    // Upcoming match hasn't kicked off yet -> 0–0 on Scoreboard!
    userScore = 0;
    opponentScore = 0;
    userHalf1 = 0;
    userHalf2 = 0;
    oppHalf1 = 0;
    oppHalf2 = 0;
    halfLabel = isFirstHalf ? 'First half' : 'Second half';
  }

  const stadiumCap = Math.max(100, matchedHistory?.stadium || club?.stadium || 4500);
  let estAtt = 0;
  if (matchedHistory && (matchedHistory.att || (matchedHistory as any).attendance)) {
    const rawHistAtt = matchedHistory.att || (matchedHistory as any).attendance || 0;
    estAtt = formatOrganicAttendance(rawHistAtt, stadiumCap, selectedYear);
  } else {
    try {
      const liveFin = calculateClubFinancials(state as any);
      if (liveFin && typeof liveFin.expectedAtt === 'number' && liveFin.expectedAtt > 0) {
        estAtt = Math.min(stadiumCap, liveFin.expectedAtt);
      }
    } catch {
      estAtt = 0;
    }
    if (estAtt <= 0) {
      estAtt = formatOrganicAttendance(
        Math.round(stadiumCap * (effectiveTier === 1 ? 0.92 : effectiveTier === 2 ? 0.76 : 0.58)),
        stadiumCap,
        selectedYear
      );
    }
    if (liveFix && liveProgress) {
      // Dynamic match-by-match crowd flex: marquee rivals & winning runs draw surges toward sellout,
      // while cold form against lower-table sides leaves realistic empty seats in the bowl
      const oppPrestigeFactor = (liveFix.opponentOvr - avgPeerOvr) * 0.014;
      const formFactor = gamesPlayed >= 2 ? ((winRateNum - 50) / 100) * 0.14 : 0;
      const mdJitter = (seededRand(seed, liveProgress.matchday * 19) - 0.45) * 0.06;
      const liveFlexMult = Math.max(0.76, Math.min(1.16, 1 + oppPrestigeFactor + formFactor + mdJitter));
      estAtt = formatOrganicAttendance(
        Math.min(stadiumCap, Math.max(120, Math.round(estAtt * liveFlexMult))),
        stadiumCap,
        selectedYear + liveProgress.matchday
      );
    }
  }
  const utilizationPct = Math.min(100, Math.max(0, Math.round((estAtt / Math.max(1, stadiumCap)) * 100)));
  const arenaDesign: ArenaDesignId =
    (club as any)?.arenaDesign || 'terracotta_courtside';

  const phaseBadge = supercupMatch && isFirstHalf && isCurrentActiveSeason
    ? 'Supercup Final'
    : matchedHistory
    ? `Final · ${totalGames} MD`
    : isFirstHalf
    ? `First half · MD 1–${halfMatchdays}`
    : `Second half · MD ${halfMatchdays + 1}–${totalGames}`;

  // 5. Shot Chart Markers & Splits — Adapted to Actual Season Progress & Outcomes!
  const markers: ShotMarker[] = [];
  const isPreSeason = gamesPlayed === 0;
  const targetShotMarkers = isPreSeason
    ? 0
    : Math.min(24, Math.max(3, Math.round((gamesPlayed / Math.max(1, totalGames)) * 24)));

  const creasePct = isPreSeason ? 0 : Math.round(sixMeterPct);
  const backcourtPct = isPreSeason ? 0 : Math.round(nineMeterPct);
  const wingPct = isPreSeason
    ? 0
    : Math.round(
        Math.min(
          78,
          Math.max(44, sixMeterPct - 5 + (fastBreakBoost > 0 ? 2.5 : 0))
        )
      );

  const outcomeSeed = hashSeed(
    `${clubName}-${selectedYear}-${tactic}-${gamesPlayed}-${wins}-${draws}-${losses}-${seasonGf}`
  );

  for (let i = 0; i < targetShotMarkers; i++) {
    const r1 = seededRand(outcomeSeed, 30 + i * 3);
    const r2 = seededRand(outcomeSeed, 31 + i * 3);
    const r3 = seededRand(outcomeSeed, 32 + i * 3);

    let zone: 'crease' | 'backcourt' | 'wing';
    let x = 50;
    let y = 30;
    let unit: 'Backcourt' | 'Wings & Pivot' | 'Fast Break';

    const mod = i % 6;
    if (mod === 0 || mod === 3) {
      zone = 'crease';
      x = 34 + r1 * 32;
      y = 14 + r2 * 22;
      unit = fastBreakBoost > 0 && i % 2 === 0 ? 'Fast Break' : 'Wings & Pivot';
    } else if (mod === 1 || mod === 4) {
      zone = 'backcourt';
      x = 22 + r1 * 56;
      y = 44 + r2 * 34;
      unit = 'Backcourt';
    } else {
      zone = 'wing';
      const isLeft = i % 2 === 0;
      x = isLeft ? 8 + r1 * 16 : 76 + r1 * 16;
      y = 12 + r2 * 28;
      unit = i % 3 === 0 ? 'Fast Break' : 'Wings & Pivot';
    }

    const prob =
      zone === 'crease' ? creasePct / 100 : zone === 'wing' ? wingPct / 100 : backcourtPct / 100;
    const made = r3 < prob;
    markers.push({
      id: `shot-${i}`,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      made,
      zone,
      unit,
    });
  }

  const shotsLogged = gamesPlayed > 0 ? Math.round(seasonGf / Math.max(0.45, (creasePct * 0.45 + backcourtPct * 0.35 + wingPct * 0.2) / 100)) : 0;

  // 6. Scoring Trend (7 Campaign Months: Oct – Apr)
  const months = [
    { short: 'Oct', full: 'October' },
    { short: 'Nov', full: 'November' },
    { short: 'Dec', full: 'December' },
    { short: 'Jan', full: 'January' },
    { short: 'Feb', full: 'February' },
    { short: 'Mar', full: 'March' },
    { short: 'Apr', full: 'April' },
  ];
  const baseScored = actualGfPerGame;
  const baseAllowed = actualGaPerGame;

  const scoringTrend: ScoringTrendPoint[] = months.map((m, idx) => {
    const wave1 = Math.sin((idx + (seed % 5)) * 1.05) * 1.6;
    const wave2 = Math.cos((idx + (seed % 7)) * 0.95) * 1.3;
    const scored = Number(Math.max(21, Math.min(39, baseScored + wave1 + idx * 0.18)).toFixed(1));
    const allowed = Number(Math.max(20, Math.min(37, baseAllowed + wave2 - idx * 0.08)).toFixed(1));
    const b1 = Math.round(40 + seededRand(seed, 90 + idx * 3) * 52);
    const b2 = Math.round(42 + seededRand(seed, 91 + idx * 3) * 54);
    const b3 = Math.round(38 + seededRand(seed, 92 + idx * 3) * 55);
    return {
      month: m.short,
      fullMonth: m.full,
      scored,
      allowed,
      loadBars: [b1, b2, b3],
    };
  });

  // 7. Executive Ratings (Club Health: OVR, Impact, Reputation, Media Heat) & GM/Tactics Summary
  const seasonStartOvr = typeof state?.startOfSeasonOvr === 'number' ? state.startOfSeasonOvr : ovr;
  const executiveRatings = {
    ovr,
    maxOvrCap: state?.maxOvrCap || 99,
    seasonOvrDelta: ovr - seasonStartOvr,
    impactScore: Math.round(state?.clubImpactScore ?? 50),
    reputation: Math.round(state?.reputation ?? 50),
    mediaPressure: Math.round(state?.mediaPressure ?? 22),
    immunityShields: state?.immunityShields ?? 0,
    fanBase: club?.fanBase || 2000,
  };

  const gmName = state?.managerName || 'General Manager';
  const gmWords = gmName.trim().split(/\s+/).filter(Boolean);
  const gmInitials =
    gmWords.length >= 2
      ? (gmWords[0][0] + gmWords[gmWords.length - 1][0]).toUpperCase()
      : gmName.slice(0, 2).toUpperCase();

  const coachName = state?.currentCoach?.name || gmName;
  const coachWords = coachName.trim().split(/\s+/).filter(Boolean);
  const coachInitials =
    coachWords.length >= 2
      ? (coachWords[0][0] + coachWords[coachWords.length - 1][0]).toUpperCase()
      : coachName.slice(0, 2).toUpperCase();
  const totalCareerMatches = state?.totals?.matches || 0;
  const totalCareerWins = state?.totals?.wins || 0;
  const careerWinRate =
    totalCareerMatches > 0
      ? Math.round((totalCareerWins / totalCareerMatches) * 100)
      : gamesPlayed > 0
      ? Math.round(winRateNum)
      : 0;

  const coachSummary = {
    gmName,
    gmInitials,
    gmArchetype: state?.directorArchetype || 'General Manager',
    coachName,
    coachInitials,
    archetype:
      state?.currentCoach?.archetype ||
      state?.headCoachArchetype ||
      state?.directorArchetype ||
      'Tactician',
    tactic,
    philosophy,
    careerWinRate,
    tenureYears: state?.tenureYears || 1,
    coachHeat: Math.round(state?.coachHeat ?? 18),
    skillPoints: state?.skillPoints || 0,
  };

  // 8. Star Player Spotlight (retained for compatibility)
  const topYouth = (state?.youthPipeline || []).find((p) => !p.isLoanedOut);
  const countryNames = STAR_SURNAMES_BY_COUNTRY[country] || STAR_SURNAMES_BY_COUNTRY.GER;
  const firstNames = ['Lukas', 'Mathias', 'Julian', 'Emil', 'Nikola', 'Dika', 'Felix'];
  const starName = topYouth?.name
    ? topYouth.name
    : `${firstNames[seed % firstNames.length]} ${countryNames[(seed >> 3) % countryNames.length]}`;
  const nameParts = starName.trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : starName.slice(0, 2).toUpperCase();

  const roles = ['#10 · Playmaker (CB)', '#19 · Right Back (RB)', '#7 · Left Wing (LW)', '#1 · Goalkeeper (GK)'];
  const roleTag = roles[seed % roles.length];
  const starGoals = Math.max(5, Math.min(13, Math.round(baseScored * 0.27)));
  const starAssists = Math.max(3, Math.min(9, Math.round(baseScored * 0.18)));
  const starSteals = Math.max(1, Math.min(4, Math.round(1 + (ovr - 65) / 14)));

  const spotlight: SpotlightFigure = {
    initials,
    name: starName,
    roleTag,
    subline: `52 min · +${Math.max(2, Math.round(baseScored - baseAllowed + 3))} on court · ${tactic}`,
    stats: [
      { label: 'GLS', value: String(starGoals) },
      { label: 'AST', value: String(starAssists) },
      { label: '7M', value: `${Math.min(5, Math.max(1, Math.round(starGoals * 0.35)))}` },
      { label: 'STL', value: String(starSteals) },
    ],
  };

  return {
    selectedYear,
    availableYears,
    clubId: club?.id,
    clubFullName: clubName,
    clubShortName: getShortClubLabel(clubName),
    clubCode: getClubTriCode(clubName),
    clubColor: club?.color || '#DF642A',
    clubColor2: club?.color2,
    clubLogo: club?.logo,
    clubFallbackLogo: club?.fallbackLogo,
    arenaColors,
    arenaDesign,
    arenaName: deriveArenaName(clubName, country, club),
    stadiumCapacity: stadiumCap,
    leagueName,
    gamesPlayed,
    winRatePct,
    recordLabel,
    standingLabel,
    rankPos,
    leagueSize,
    lastFive,
    adjacentStandings,
    executiveRatings,
    coachSummary,
    splits: {
      sixMeterPct,
      nineMeterPct,
      sevenMeterPct,
      goalsPerGame,
      allowedPerGame,
      savesPerGame,
    },
    nextFixtures,
    featuredMatch: {
      opponentId: primaryOpp.opponentId,
      opponentName: primaryOpp.opponentName,
      opponentShort: primaryOpp.opponentShort,
      opponentCode: primaryOpp.opponentCode,
      opponentColor: primaryOpp.opponentColor,
      opponentColor2: primaryOpp.opponentColor2,
      opponentLogo: primaryOpp.opponentLogo,
      opponentFallbackLogo: primaryOpp.opponentFallbackLogo,
      opponentRecord,
      userScore,
      opponentScore,
      userHalf1,
      userHalf2,
      oppHalf1,
      oppHalf2,
      halfLabel,
      phaseBadge,
      clockBadge: isFirstHalf ? '1H · 00:00' : '2H · 30:00',
      attendanceNumeric: estAtt,
      attendanceFormatted: estAtt.toLocaleString(),
      utilizationPct,
      leadChanges: gamesPlayed > 0 ? 5 + (seed % 7) : 0,
      paceRating: (56.5 + (ovr - 75) * 0.22 + (fastBreakBoost > 0 ? 4.2 : 0)).toFixed(1),
    },
    shotChart: {
      markers,
      creasePct,
      backcourtPct,
      wingPct,
      shotsLogged,
      isPreSeason,
    },
    scoringTrend,
    spotlight,
    clubContext: buildClubContextSummary(state),
    trophyCollection: buildTrophyCollectionSummary(state),
  };
}
