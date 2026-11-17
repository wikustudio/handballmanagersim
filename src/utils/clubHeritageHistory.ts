import { Club, GameState, SeasonHistory, TrophiesObj, UniverseMovement } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import {
  formatOrganicAttendance,
  getClubStartingAttendance,
  getLeagueInfo,
  getMaxTier,
  normalizeCountry,
} from '../data/gameConstants';

function hashDeterministic(seedStr: string, year: number): number {
  let h = (year * 2654435761) >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 2246822519) >>> 0;
  }
  return ((h ^ (h >>> 15)) >>> 0) / 4294967295;
}

export function isMatchingClubIdentity(
  candidate: { id?: string | number; clubId?: string | number; name?: string; clubName?: string } | null | undefined,
  targetClub: Partial<Club> | null | undefined
): boolean {
  if (!candidate || !targetClub) return false;
  const candName = (candidate.clubName || candidate.name || '').trim().toLowerCase();
  const targetName = (targetClub.name || '').trim().toLowerCase();
  if (candName && targetName && candName === targetName) return true;

  const candId = candidate.clubId ?? candidate.id;
  const targetId = targetClub.id;
  if (
    candId !== undefined &&
    targetId !== undefined &&
    candId !== null &&
    targetId !== null &&
    String(candId) === String(targetId)
  ) {
    // Guard against cross-country numeric ID collisions if both names exist and differ
    if (candName && targetName && candName !== targetName) return false;
    return true;
  }
  return false;
}

export function collectDeduplicatedMovements(
  state: Pick<GameState, 'universeMovements' | 'history'>
): UniverseMovement[] {
  const all: UniverseMovement[] = [];
  const seen = new Set<string>();
  const add = (m?: UniverseMovement) => {
    if (!m) return;
    const key = m.id || `${m.year}-${m.clubId || m.clubName}-${m.type}-${m.cupTitle || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      all.push(m);
    }
  };
  (state.universeMovements || []).forEach(add);
  (state.history || []).forEach((h) => {
    (h.universeMovements || []).forEach(add);
  });
  return all;
}

function resolveTrophiesFromClubMovements(
  yearMovements: UniverseMovement[],
  tierInYear: number
): TrophiesObj {
  const trophies: TrophiesObj = {};
  for (const m of yearMovements) {
    if (m.type === 'champion') {
      if (tierInYear === 1) {
        trophies.bl = (trophies.bl || 0) + 1;
      } else {
        trophies.lower = (trophies.lower || 0) + 1;
      }
    } else if (m.type === 'intl_cup') {
      const title = String(m.cupTitle || '').toLowerCase();
      const mId = String(m.id || '').toLowerCase();
      if (
        mId.includes('-cup-sc') ||
        title.includes('supercup') ||
        title.includes('super cup') ||
        title.includes('supercopa') ||
        title.includes('superpokal') ||
        title.includes('trophée des champions') ||
        title.includes('trophee des champions')
      ) {
        trophies.sc = (trophies.sc || 0) + 1;
      } else if (title.includes('super globe') || title.includes('club world')) {
        trophies.cwc = (trophies.cwc || 0) + 1;
      } else if (title.includes('champions league')) {
        trophies.cl = (trophies.cl || 0) + 1;
      } else if (title.includes('european league') || title.includes('euro league')) {
        trophies.el = (trophies.el || 0) + 1;
      } else if (title.includes('european cup')) {
        trophies.ecl = (trophies.ecl || 0) + 1;
      } else if (title.includes('regional') || title.includes('amateur')) {
        trophies.reg = (trophies.reg || 0) + 1;
      } else {
        trophies.dfb = (trophies.dfb || 0) + 1;
      }
    }
  }
  return trophies;
}

/**
 * Builds the complete Club Heritage Season Timeline for `targetClub` across all completed
 * seasons of the save (`startYear .. state.year - 1`), seamlessly bridging seasons BEFORE
 * the manager arrived (or after the manager left) with personally managed seasons!
 *
 * Importantly, this does NOT mutate `state.history` or manager career stats.
 */
export function buildClubHeritageTimeline(
  state: Pick<
    GameState,
    'year' | 'startYear' | 'history' | 'universeMovements' | 'worldClubs' | 'club'
  >,
  targetClub?: Partial<Club> | null
): SeasonHistory[] {
  const club = targetClub || state.club;
  if (!club || !club.name) return [];

  const allHistory = state.history || [];
  const managedClubByYear = new Map<number, SeasonHistory>();
  const globalHistoryByYear = new Map<number, SeasonHistory>();

  for (const h of allHistory) {
    globalHistoryByYear.set(h.year, h);
    if (isMatchingClubIdentity(h, club)) {
      managedClubByYear.set(h.year, h);
    }
  }

  const earliestHistoryYear =
    allHistory.length > 0 ? Math.min(...allHistory.map((h) => h.year)) : undefined;
  const startYear =
    typeof state.startYear === 'number' && state.startYear > 1900
      ? Math.min(state.startYear, earliestHistoryYear ?? state.startYear)
      : earliestHistoryYear ?? state.year;

  const lastCompletedYear = (state.year || startYear) - 1;
  if (lastCompletedYear < startYear) {
    return Array.from(managedClubByYear.values()).sort((a, b) => a.year - b.year);
  }

  const country = normalizeCountry(club.country || state.club?.country || 'GER');
  const maxTier = getMaxTier(country);
  const dbClub = ALL_CLUBS.find((c) => isMatchingClubIdentity(c, club));

  const clubMovements = collectDeduplicatedMovements(state).filter((m) =>
    isMatchingClubIdentity(m, club)
  );
  const movementsByYear = new Map<number, UniverseMovement[]>();
  for (const m of clubMovements) {
    const arr = movementsByYear.get(m.year) || [];
    arr.push(m);
    movementsByYear.set(m.year, arr);
  }

  // Reconstruct the club's tier for every completed year by anchoring to known tiers and stepping backwards from current club.tier
  const tierByYear = new Map<number, number>();
  let runningNextYearStartTier = Math.max(1, Math.min(maxTier, club.tier || dbClub?.tier || 1));

  for (let yr = lastCompletedYear; yr >= startYear; yr--) {
    const managed = managedClubByYear.get(yr);
    if (managed && typeof managed.tier === 'number') {
      tierByYear.set(yr, managed.tier);
      runningNextYearStartTier = managed.tier;
      continue;
    }

    const yrMoves = movementsByYear.get(yr) || [];
    const promoOrReleg = yrMoves.find(
      (m) =>
        m.type === 'promotion' ||
        m.type === 'relegation' ||
        m.type === 'insolvency_relegation'
    );

    if (promoOrReleg) {
      if (typeof promoOrReleg.fromTier === 'number') {
        tierByYear.set(yr, promoOrReleg.fromTier);
        runningNextYearStartTier = promoOrReleg.fromTier;
        continue;
      }
      if (promoOrReleg.type === 'promotion') {
        const inferredFrom = Math.min(maxTier, runningNextYearStartTier + 1);
        tierByYear.set(yr, inferredFrom);
        runningNextYearStartTier = inferredFrom;
        continue;
      }
      const inferredFrom = Math.max(1, runningNextYearStartTier - 1);
      tierByYear.set(yr, inferredFrom);
      runningNextYearStartTier = inferredFrom;
      continue;
    }

    tierByYear.set(yr, runningNextYearStartTier);
  }

  const timeline: SeasonHistory[] = [];
  const baseCap = Math.max(
    400,
    dbClub?.stadium || club.stadium || getLeagueInfo(club.tier || 1, country)?.stadBase || 2500
  );
  const baseOvrAnchor = dbClub?.baseOvr || club.baseOvr || 72;

  for (let yr = startYear; yr <= lastCompletedYear; yr++) {
    const managed = managedClubByYear.get(yr);
    if (managed) {
      timeline.push({ ...managed, isPreTenureClubArchive: false });
      continue;
    }

    const tierInYr = tierByYear.get(yr) || dbClub?.tier || club.tier || 1;
    const leagueInfo = getLeagueInfo(tierInYr, country);
    const numTeams = Math.max(8, (leagueInfo as any)?.teams || 18);
    const totalGames = (numTeams - 1) * 2;
    const yrMoves = movementsByYear.get(yr) || [];

    // Check if that year's global SeasonHistory saved the exact division table for this club's country & tier
    const globalHist = globalHistoryByYear.get(yr);
    let savedRow: any = null;
    if (globalHist && normalizeCountry(globalHist.country || '') === country) {
      const tableCandidate =
        globalHist.divisionTables?.[tierInYr] ||
        (globalHist.tier === tierInYr ? globalHist.finalTable : undefined);
      if (Array.isArray(tableCandidate)) {
        savedRow = tableCandidate.find((r: any) => isMatchingClubIdentity(r, club));
      }
    }

    const isChampMove = yrMoves.some((m) => m.type === 'champion');
    const promoMove = yrMoves.find((m) => m.type === 'promotion');
    const relegMove = yrMoves.find(
      (m) => m.type === 'relegation' || m.type === 'insolvency_relegation'
    );

    const rand = hashDeterministic(club.name, yr);
    const leagueAvgOvr =
      leagueInfo?.avgOvr || (tierInYr === 1 ? 80 : tierInYr === 2 ? 69 : tierInYr === 3 ? 62 : 54);
    const estimatedOvr = Math.max(
      38,
      Math.min(
        94,
        Math.round(
          baseOvrAnchor + (dbClub?.tier ? (dbClub.tier - tierInYr) * 4 : 0) + (rand - 0.5) * 3
        )
      )
    );

    let pos: number;
    let wins: number;
    let draws: number;
    let losses: number;
    let gf: number;
    let ga: number;
    let pts: number;

    if (savedRow && typeof savedRow.pos === 'number') {
      pos = savedRow.pos;
      wins = savedRow.w ?? savedRow.wins ?? Math.round(totalGames * 0.5);
      draws = savedRow.d ?? savedRow.draws ?? 2;
      losses = savedRow.l ?? savedRow.losses ?? Math.max(0, totalGames - wins - draws);
      pts = savedRow.pts ?? wins * 2 + draws;
      gf = savedRow.gf ?? totalGames * 29;
      ga = savedRow.ga ?? totalGames * 28;
    } else {
      if (isChampMove) {
        pos = 1;
      } else if (promoMove) {
        pos = promoMove.pos && promoMove.pos >= 1 ? promoMove.pos : rand < 0.45 ? 1 : 2;
      } else if (relegMove) {
        pos = relegMove.pos && relegMove.pos >= 1 ? relegMove.pos : rand < 0.5 ? numTeams : numTeams - 1;
      } else {
        // Organic finish anchored to club OVR vs division average
        const strengthNorm = Math.max(
          0.08,
          Math.min(0.92, 0.5 + (estimatedOvr - leagueAvgOvr) * 0.032 + (rand - 0.5) * 0.22)
        );
        const minSafePos = tierInYr > 1 ? 3 : 2;
        const maxSafePos = Math.max(minSafePos + 1, numTeams - 2);
        pos = Math.round(maxSafePos - strengthNorm * (maxSafePos - minSafePos));
        pos = Math.max(minSafePos, Math.min(maxSafePos, pos));
      }

      const finishRatio = 1 - (pos - 1) / Math.max(1, numTeams - 1); // 1.0 = 1st, 0.0 = last
      const winShare = Math.max(0.12, Math.min(0.86, 0.16 + finishRatio * 0.68));
      draws = Math.max(1, Math.min(5, 1 + Math.floor(rand * 4)));
      wins = Math.max(0, Math.min(totalGames - draws, Math.round((totalGames - draws) * winShare)));
      losses = Math.max(0, totalGames - wins - draws);
      pts = wins * 2 + draws;

      const avgGoalsPerMatch = 28 + Math.round((finishRatio - 0.5) * 5);
      const gdTotal = Math.round((finishRatio - 0.48) * totalGames * 4.4);
      gf = Math.max(totalGames * 21, totalGames * avgGoalsPerMatch + Math.round(gdTotal * 0.5));
      ga = Math.max(totalGames * 20, gf - gdTotal);
    }

    const trophiesThisYear = resolveTrophiesFromClubMovements(yrMoves, tierInYr);
    if (pos === 1 && !trophiesThisYear.bl && !trophiesThisYear.lower) {
      if (tierInYr === 1) trophiesThisYear.bl = 1;
      else trophiesThisYear.lower = 1;
    }

    const rawBaseAtt = getClubStartingAttendance({
      ...(dbClub || club),
      name: club.name,
      country,
      tier: tierInYr,
      baseOvr: estimatedOvr,
      stadium: baseCap,
    } as any);
    const finishAttMod = 0.92 + (1 - (pos - 1) / Math.max(1, numTeams - 1)) * 0.14;
    const att = formatOrganicAttendance(
      Math.min(baseCap, Math.round(rawBaseAtt * finishAttMod)),
      baseCap,
      yr
    );
    const util = Math.min(100, Math.round((att / Math.max(1, baseCap)) * 100));

    timeline.push({
      year: yr,
      clubName: club.name,
      clubId: typeof club.id === 'number' ? club.id : Number(club.id) || undefined,
      color: club.color || dbClub?.color,
      color2: club.color2 || dbClub?.color2,
      logo: club.logo || dbClub?.logo,
      fallbackLogo: club.fallbackLogo || dbClub?.fallbackLogo,
      ovr: estimatedOvr,
      tier: tierInYr,
      nextTier: promoMove
        ? Math.max(1, tierInYr - 1)
        : relegMove
        ? Math.min(maxTier, tierInYr + 1)
        : tierInYr,
      wins,
      draws,
      losses,
      pts,
      pos,
      gf,
      ga,
      played: totalGames,
      att,
      util,
      stadium: baseCap,
      country,
      promoted: Boolean(promoMove),
      relegated: Boolean(relegMove),
      financialRelegation: relegMove?.type === 'insolvency_relegation',
      trophiesThisYear,
      isPreTenureClubArchive: true,
    });
  }

  return timeline.sort((a, b) => a.year - b.year);
}
