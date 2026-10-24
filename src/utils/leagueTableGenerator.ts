import { Club, GameState, SeasonHistory } from '../types';
import { getLeagueInfo, isReserveClub, getMaxTier, normalizeCountry } from '../data/gameConstants';
import { getLeagueSize } from '../engine/engine';
import { ALL_CLUBS } from '../data/clubsData';
import { mergeClubWithWorldState } from './modManager';

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const seededRand = (seed: number, min: number, max: number) => {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
};

export interface TableRow {
  pos: number;
  name: string;
  color: string;
  logo?: string;
  fallbackLogo?: string;
  w: number;
  d: number;
  l: number;
  pts: number;
  gd: string;
  gf?: number;
  ga?: number;
  isUser: boolean;
  pointsDeducted?: number;
  statusMarker?: string;
  id?: number | string;
}

export const generateLeagueTable = (
  state: GameState,
  clubsDb: Club[],
  targetTier?: number,
  overrideHist?: Partial<SeasonHistory>
): TableRow[] => {
  const history = state.history || [];
  // CRITICAL PROMOTION/RELEGATION INTEGRITY:
  // A historical season record should ONLY be used if overrideHist was explicitly provided,
  // OR if querying a completed season that has an entry in state.history matching targetYear.
  // For the active current season, no history entry exists yet for that year, so lastHist is null.
  const targetYear = overrideHist?.year ?? state.year;
  const matchedHist = history.find(h => h.year === targetYear) || null;
  const hasExplicitStats =
    overrideHist?.pos !== undefined ||
    overrideHist?.pts !== undefined ||
    overrideHist?.wins !== undefined ||
    Boolean((overrideHist as any)?.isCompletedSeason);
  const isSeasonCompleted = Boolean(matchedHist || hasExplicitStats);
  const lastHist = isSeasonCompleted
    ? (matchedHist ? { ...matchedHist, ...overrideHist } : (overrideHist || null))
    : null;
  const simYear = overrideHist?.year ?? lastHist?.year ?? state.year ?? 2024;

  const currentTier = targetTier ?? overrideHist?.tier ?? (lastHist ? lastHist.tier : state.club.tier);
  const rawCountry = overrideHist?.country ?? ((lastHist ? (lastHist.country || state.club.country) : state.club.country) || 'GER');
  const currentCountry = normalizeCountry(rawCountry);
  const currentLeagueInfo = getLeagueInfo(currentTier, currentCountry);

  const userPlayedTier = (overrideHist as any)?.userPlayedTier ?? (matchedHist ? matchedHist.tier : (lastHist ? lastHist.tier : state.club.tier));
  const isUserInThisTier = userPlayedTier === currentTier && normalizeCountry(state.club.country || 'GER') === currentCountry;

  // Helper to verify if a cached final table is consistent with the desired position and rival
  const isTableConsistent = (hist: Partial<SeasonHistory> | null | undefined): boolean => {
    if (!hist?.finalTable || !Array.isArray(hist.finalTable) || hist.finalTable.length === 0) return false;
    const requiredPos = overrideHist?.pos ?? hist.pos;
    const requiredPts = overrideHist?.pts ?? hist.pts;
    if (requiredPos !== undefined) {
      const userRow = hist.finalTable.find(r => r.isUser || r.name === (hist.clubName || state.club.name));
      if (!userRow || userRow.pos !== requiredPos) {
        return false;
      }
      if (requiredPts !== undefined && userRow.pts !== requiredPts) {
        return false;
      }
    }
    const reqRival = overrideHist?.rivalName ?? hist.rivalName;
    const reqRivalPts = overrideHist?.rivalPts ?? hist.rivalPts;
    if (reqRival && reqRivalPts !== undefined) {
      const rivalRow = hist.finalTable.find(r => r.name === reqRival);
      if (!rivalRow) return false;
      if (requiredPos === 2 && rivalRow.pos !== 1) return false;
      if (requiredPos === 1 && rivalRow.pos !== 2) return false;
      const tblLen = hist.finalTable.length;
      if (requiredPos !== undefined && requiredPos >= tblLen - 2 && Math.abs(rivalRow.pos - requiredPos) > 2) {
        return false;
      }
      if ((rivalRow.pts ?? 0) !== reqRivalPts) {
        return false;
      }
    }
    return true;
  };

  // If the historical record already has the verified complete final table for this exact tier & country, return it directly!
  if (isUserInThisTier && overrideHist?.finalTable && isTableConsistent(overrideHist)) {
    return overrideHist.finalTable;
  }
  if (isUserInThisTier && lastHist && lastHist.year === targetYear && isTableConsistent(lastHist)) {
    return (lastHist as any).finalTable;
  }
  const cachedDivTable = overrideHist?.divisionTables?.[currentTier] ?? matchedHist?.divisionTables?.[currentTier];
  if (!isUserInThisTier && currentCountry === normalizeCountry(matchedHist?.country || state.club.country || 'GER') && Array.isArray(cachedDivTable) && cachedDivTable.length > 0) {
    return cachedDivTable;
  }

  const clubsPool = clubsDb.map(c => mergeClubWithWorldState(c, state.worldClubs?.[c.id]));
  let leagueClubs: Club[];
  let cameFromCachedDivTable = false;
  if (isSeasonCompleted && Array.isArray(cachedDivTable) && cachedDivTable.length > 0 && currentCountry === normalizeCountry(matchedHist?.country || state.club.country || 'GER')) {
    cameFromCachedDivTable = true;
    const historyClubNameNorm = (lastHist?.clubName || state.club.name || '').trim().toLowerCase();
    leagueClubs = cachedDivTable
      .filter((r: any) => !r.isUser && (!isUserInThisTier || (r.name || '').trim().toLowerCase() !== historyClubNameNorm))
      .map((r: any) => {
        const normName = (r.name || '').trim().toLowerCase();
        const found = clubsPool.find(c => (r.id !== undefined && String(c.id) === String(r.id)) || (c.name && c.name.trim().toLowerCase() === normName));
        return (found ? { ...found, tier: currentTier, _cachedRow: r } : {
          id: r.id ?? Math.floor(Math.random() * 10000),
          name: r.name || 'Club',
          color: r.color || '#666666',
          logo: r.logo,
          fallbackLogo: r.fallbackLogo,
          tier: currentTier,
          baseOvr: currentLeagueInfo.avgOvr,
          stadium: 3000,
          country: currentCountry,
          _cachedRow: r,
        }) as unknown as Club;
      });
  } else if (isSeasonCompleted && lastHist) {
    const histYear = lastHist.year ?? targetYear;
    const yearMoves = (lastHist.universeMovements || state.universeMovements || []).filter(
      (m: any) => m.year === histYear && normalizeCountry(m.country || 'GER') === currentCountry &&
      (m.type === 'champion' || m.type === 'promotion' || m.type === 'relegation' || m.type === 'insolvency_relegation')
    );
    const movedFromThisTier = new Set(
      yearMoves.filter((m: any) => m.fromTier === currentTier).map((m: any) => String(m.clubName || '').trim().toLowerCase())
    );
    const movedFromOtherTierToHere = new Set(
      yearMoves.filter((m: any) => m.fromTier !== currentTier && m.toTier === currentTier).map((m: any) => String(m.clubName || '').trim().toLowerCase())
    );
    leagueClubs = clubsPool
      .filter((c) => {
        if (normalizeCountry(c.country || 'GER') !== currentCountry) return false;
        if (isUserInThisTier && c.id === state.club.id) return false;
        const cNameNorm = (c.name || '').trim().toLowerCase();
        if (movedFromThisTier.has(cNameNorm)) return true;
        if (movedFromOtherTierToHere.has(cNameNorm)) return false;
        return c.tier === currentTier;
      })
      .map((c) => ({ ...c, tier: currentTier }));
  } else {
    leagueClubs = clubsPool
      .filter((c) => c.tier === currentTier && normalizeCountry(c.country || 'GER') === currentCountry && (isUserInThisTier ? c.id !== state.club.id : true))
      .map((c) => ({ ...c }));
  }

  const calculatedTotalClubs = getLeagueSize(currentTier, currentCountry, state.club.id, currentTier, currentCountry, clubsDb);
  const minClubsNeeded = lastHist?.pos ? lastHist.pos : 1;
  const targetTotalClubs = Math.max(calculatedTotalClubs, minClubsNeeded);
  const targetAiCount = isUserInThisTier ? targetTotalClubs - 1 : targetTotalClubs;

  // Pull other clubs in the same country from clubsPool if we need more teams
  const heavyweightSet = new Set([
    'Kiel', 'Flensburg', 'Magdeburg', 'Rhein-Neckar', 'Berlin Foxes',
    'Paris HB', 'Montpellier', 'Veszprem', 'Szeged', 'Kielce', 'Barcelona HB'
  ]);
  const existingClubIds = new Set([
    ...(isUserInThisTier ? [state.club.id] : []),
    ...leagueClubs.map((c) => c.id)
  ]);
  if (leagueClubs.length < targetAiCount) {
    const sameCountryOtherClubs = clubsPool.filter(
      (c) =>
        (c.country || 'GER') === currentCountry &&
        !existingClubIds.has(c.id) &&
        c.tier > currentTier &&
        c.baseOvr < 78 &&
        !heavyweightSet.has(c.name)
    );
    for (const c of sameCountryOtherClubs) {
      if (leagueClubs.length >= targetAiCount) break;
      existingClubIds.add(c.id);
      leagueClubs.push({
        ...c,
        tier: currentTier,
      });
    }
  }

  // Country-specific authentic fallback lists for extra fillers
  const gerFallbackNames = [
    'HC Essen', 'VfL Gummersbach', 'TBV Lemgo', 'HSG Wetzlar', 'TSV Hannover',
    'Frisch Auf Göppingen', 'MT Melsungen', 'SC DHfK Leipzig', 'TVB Stuttgart', 'Bergischer HC',
    'HBW Balingen', 'ASV Hamm', 'TuS N-Lübbecke', 'ThSV Eisenach'
  ];

  const espFallbackNames = [
    'BM Granollers', 'BM Leon', 'BM Cuenca', 'BM Logroño', 'BM Huesca',
    'BM Benidorm', 'BM Valladolid', 'BM Nava', 'BM Puente Genil', 'BM Cangas'
  ];

  const fraFallbackNames = [
    'HBC Nantes', 'Chambéry Savoie HB', 'Fenix Toulouse HB', 'USAM Nîmes Gard', 'Saint-Raphaël VHB',
    'Dunkerque HGL', 'Pays d\'Aix UC', 'Cesson Rennes MHB', 'US Ivry', 'Saran HB'
  ];

  const islFallbackNames = [
    'Haukar', 'Valur', 'Afturelding', 'Stjarnan', 'Fram',
    'FH', 'ÍBV', 'KA', 'HK', 'Grótta'
  ];

  const intlFallbackNames = [
    'HC Bjerringbro', 'Aalborg Håndbold', 'GOG Håndbold', 'Skjern Håndbold', 'Elverum Håndball',
    'Kolstad Håndball', 'Celje Pivovarna', 'RK Zagreb'
  ];

  const fallbackList =
    currentCountry === 'GER' ? gerFallbackNames :
    currentCountry === 'ESP' ? espFallbackNames :
    currentCountry === 'FRA' ? fraFallbackNames :
    currentCountry === 'ISL' ? islFallbackNames :
    intlFallbackNames;

  const neededFillers = Math.max(0, targetAiCount - leagueClubs.length);
  for (let i = 0; i < neededFillers; i++) {
    const existingNames = new Set([
      ...leagueClubs.map((c) => c.name),
      ...(isUserInThisTier ? [state.club.name] : [])
    ]);
    const availableFallback =
      fallbackList.find((n) => !existingNames.has(n)) || `HC City ${i + 1}`;

    leagueClubs.push({
      id: 9900 + i,
      name: availableFallback,
      tier: currentTier,
      baseOvr: currentLeagueInfo.avgOvr + seededRand(simYear + i, -5, 5),
      color: '#' + Math.floor(seededRandom(simYear * 10 + i) * 16777215).toString(16).padStart(6, '0'),
      stadium: 3000,
      country: currentCountry,
    });
  }

  const totalMatches = (targetTotalClubs - 1) * 2;

  if (!lastHist) {
    // FRESH SEASON BEFORE SIMULATION: Show 0 for all stats!
    const allClubs = [
      ...(isUserInThisTier ? [{
        id: state.club.id,
        name: state.club.name,
        color: state.club.color,
        logo: state.club.logo,
        fallbackLogo: state.club.fallbackLogo,
        baseOvr: state.club.baseOvr,
        isUser: true,
      }] : []),
      ...leagueClubs.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        logo: c.logo,
        fallbackLogo: c.fallbackLogo,
        baseOvr: c.baseOvr,
        isUser: false,
      })),
    ];

    allClubs.sort((a, b) => b.baseOvr - a.baseOvr);

    const freshData: TableRow[] = [];
    allClubs.slice(0, targetTotalClubs).forEach((c, idx) => {
      freshData.push({
        id: c.id,
        pos: idx + 1,
        name: c.name,
        color: c.color,
        logo: c.logo,
        fallbackLogo: c.fallbackLogo,
        w: 0,
        d: 0,
        l: 0,
        pts: 0,
        gd: '0',
        gf: 0,
        ga: 0,
        isUser: c.isUser,
      });
    });
    return freshData;
  }

  // COMPLETED SEASON HISTORY
  const userPos = Math.max(1, Math.min(targetTotalClubs, lastHist.pos || 1));
  const historyClubName = lastHist.clubName || state.club.name;
  const historyRivalName = lastHist.rivalName;
  // A specific rival should ONLY be forced into an adjacent contention spot if they actually contested a close championship, promotion, or relegation decider
  const isRelegationZonePos = lastHist.pos !== undefined && lastHist.pos >= targetTotalClubs - 2;
  const isCloseDecider = Boolean(
    lastHist.championshipDecider || 
    (lastHist.rivalPts !== undefined && (
      (lastHist.pos !== undefined && lastHist.pos <= 3 && Math.abs((lastHist.pts || 0) - lastHist.rivalPts) <= 3) ||
      (isRelegationZonePos && Math.abs((lastHist.pts || 0) - lastHist.rivalPts) <= 3)
    ))
  );
  let hasSpecificRivalDecider = Boolean(historyRivalName && isCloseDecider);
  if (hasSpecificRivalDecider && isUserInThisTier) {
    const rivalInLeague = leagueClubs.some(c => c.name === historyRivalName);
    if (!rivalInLeague) {
      const foundInPool = clubsPool.find(c => c.name === historyRivalName);
      const wasInCachedDiv = Array.isArray(cachedDivTable) && cachedDivTable.length > 0
        ? cachedDivTable.some((r: any) => r.name === historyRivalName)
        : (!foundInPool || foundInPool.tier === currentTier);
      if (!wasInCachedDiv) {
        hasSpecificRivalDecider = false;
      }
    }
  }
  const fallbackRivalPts = (lastHist.pos === 1) ? Math.max(0, (lastHist.pts || 0) - 1) : (lastHist.pts || 0) + 1;
  const fallbackRivalGd = (lastHist.pos === 1) ? Math.max(10, ((lastHist.gf || 0) - (lastHist.ga || 0)) - 5) : ((lastHist.gf || 0) - (lastHist.ga || 0)) + 5;
  const resolvedRivalPts = lastHist.rivalPts !== undefined ? lastHist.rivalPts : fallbackRivalPts;
  const resolvedRivalGd = lastHist.rivalGd !== undefined ? lastHist.rivalGd : fallbackRivalGd;

  let rivalClub: any = null;
  let rivalPos = -1;

  // Remove user (and designated decider rival) from AI pool
  if (isUserInThisTier) {
    for (let i = leagueClubs.length - 1; i >= 0; i--) {
      if (leagueClubs[i].name === historyClubName || (hasSpecificRivalDecider && leagueClubs[i].name === historyRivalName)) {
        if (hasSpecificRivalDecider && leagueClubs[i].name === historyRivalName) {
          rivalClub = leagueClubs[i];
        }
        leagueClubs.splice(i, 1);
      }
    }
  }

  // Calculate User's verified European handball numbers
  const userPointsDeducted = lastHist.pointsDeducted || 0;
  let userWins = lastHist.wins ?? Math.max(0, Math.floor(((lastHist.pts || 0) * 0.85) / 2));
  let userDraws = lastHist.draws ?? Math.max(0, (lastHist.pts || 0) - userWins * 2);
  while (userWins + userDraws > totalMatches && userDraws > 1) {
    userWins += 1;
    userDraws -= 2;
  }
  if (userWins + userDraws > totalMatches) {
    userDraws = Math.max(0, totalMatches - userWins);
  }
  const userLosses = Math.max(0, totalMatches - userWins - userDraws);
  const userPts = Math.max(0, (userWins * 2 + userDraws) - userPointsDeducted);
  
  const rawGf = lastHist.gf ?? Math.round(totalMatches * 29);
  const rawGa = lastHist.ga ?? Math.round(totalMatches * 28);
  const rawGd = rawGf - rawGa;
  const userGDStr = rawGd > 0 ? '+' + rawGd : `${rawGd}`;

  const getClubSeedHash = (c: { id?: number | string; name?: string }) => {
    const str = `${c.id ?? ''}_${c.name ?? ''}`;
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  };

  // Sort AI league clubs deterministically with authentic seasonal form & breakout/slump variance
  const recordedChampMove = !isUserInThisTier && lastHist
    ? (lastHist.universeMovements || state.universeMovements || []).find(
        (m: any) => m.year === (lastHist.year ?? simYear) &&
        m.type === 'champion' &&
        normalizeCountry(m.country || 'GER') === currentCountry &&
        (m.fromTier ?? 1) === currentTier
      )
    : undefined;
  const recordedChampNameNorm = recordedChampMove?.clubName ? String(recordedChampMove.clubName).trim().toLowerCase() : undefined;

  if (!cameFromCachedDivTable) {
    leagueClubs.sort((a, b) => {
      if (recordedChampNameNorm) {
        const aIsChamp = (a.name || '').trim().toLowerCase() === recordedChampNameNorm || String(a.id) === String(recordedChampMove?.clubId);
        const bIsChamp = (b.name || '').trim().toLowerCase() === recordedChampNameNorm || String(b.id) === String(recordedChampMove?.clubId);
        if (aIsChamp && !bIsChamp) return -1;
        if (bIsChamp && !aIsChamp) return 1;
      }
      const getEffectiveSeasonRating = (c: any) => {
        const h = getClubSeedHash(c);
        const baseNoise = (seededRandom(simYear * 97 + currentTier * 31 + (h % 9973)) - 0.5) * 9; // -4.5 to +4.5
        const specialRoll = seededRandom(simYear * 193 + currentTier * 53 + (h % 7919));
        let narrativeSwing = 0;
        if ((c as any).isCinderellaActive || (c as any).isNemesisActive) {
          narrativeSwing += 3.5; // Active Cinderella or Investor Takeover momentum
        }
        if (specialRoll > 0.90 && c.baseOvr < currentLeagueInfo.avgOvr + 6) {
          // Dark-horse breakout campaign (~10% chance)
          narrativeSwing += 5.5;
        } else if (specialRoll < 0.08 && c.baseOvr > currentLeagueInfo.avgOvr) {
          // Injury-hit / crisis campaign (~8% chance)
          narrativeSwing -= 4.5;
        }
        return c.baseOvr + baseNoise + narrativeSwing;
      };
      return getEffectiveSeasonRating(b) - getEffectiveSeasonRating(a);
    });
  }

  // Rival club setup
  if (hasSpecificRivalDecider) {
    if (!rivalClub) {
      const found = clubsPool.find(c => c.name === historyRivalName) || clubsDb.find(c => c.name === historyRivalName);
      rivalClub = found ? { ...found } : {
        id: 'rival',
        name: historyRivalName,
        color: '#999999',
        tier: currentTier,
        baseOvr: 85,
        stadium: 5000,
        country: currentCountry
      };
    }

    const dropThresh = Math.max(1, targetTotalClubs - 1);
    const playoffSpot = dropThresh - 1;
    const safeSpot = playoffSpot - 1;

    const rivalGdVal = lastHist.rivalGd ?? (rawGd - 1);
    const isRivalAhead = (resolvedRivalPts > userPts) || (resolvedRivalPts === userPts && rivalGdVal > rawGd);

    if (userPos === 1) rivalPos = 2;
    else if (userPos === 2) rivalPos = 1;
    else if (userPos === safeSpot) rivalPos = playoffSpot;
    else if (userPos === playoffSpot) rivalPos = isRivalAhead ? safeSpot : dropThresh;
    else if (userPos >= dropThresh) rivalPos = playoffSpot;
    else if (userPos === 3) rivalPos = 4;
    else if (userPos === 4) rivalPos = 3;
    else if (userPos === 5) rivalPos = 6;
    else if (userPos === 6) rivalPos = 5;
    else rivalPos = userPos - 1 > 0 ? userPos - 1 : 2;
  }

  // Base point curves for European handball leagues with deterministic year-to-year campaign spread
  const getRealisticBasePoints = (p: number) => {
    const norm = (p - 1) / Math.max(1, targetTotalClubs - 1); // 0.0 at 1st, 1.0 at last
    const maxPts = totalMatches * 2;
    const seasonPaceShift = (seededRandom(simYear * 73 + currentTier * 19) - 0.5) * 0.06; // Champion pace varies ~82% to 88%
    const championPts = Math.round(maxPts * (0.85 + seasonPaceShift));
    const bottomPts = Math.round(maxPts * (0.12 + (seededRandom(simYear * 41 + currentTier * 11) - 0.5) * 0.04));
    const rawCurve = Math.round(championPts - norm * (championPts - bottomPts));
    const rowJitter = seededRand(simYear * 109 + currentTier * 23 + p * 37, -1, 1);
    return Math.max(2, Math.min(maxPts - 2, rawCurve + rowJitter));
  };

  const rows: TableRow[] = [];
  let lastPts = totalMatches * 2;
  let lastGd = 999;

  for (let p = 1; p <= targetTotalClubs; p++) {
    if (isUserInThisTier && p === userPos) {
      rows.push({
        id: (state.club.name === historyClubName ? state.club.id : lastHist?.clubId) || state.club.id,
        pos: userPos,
        name: historyClubName,
        color: (state.club.name === historyClubName ? state.club.color : lastHist?.color) || clubsDb.find(c => c.name === historyClubName)?.color || '#ffffff',
        logo: (state.club.name === historyClubName ? state.club.logo : lastHist?.logo) || clubsDb.find(c => c.name === historyClubName)?.logo || undefined,
        fallbackLogo: (state.club.name === historyClubName ? state.club.fallbackLogo : lastHist?.fallbackLogo) || clubsDb.find(c => c.name === historyClubName)?.fallbackLogo || undefined,
        w: userWins,
        d: userDraws,
        l: userLosses,
        pts: userPts,
        gd: userGDStr,
        gf: rawGf,
        ga: rawGa,
        isUser: true,
        pointsDeducted: userPointsDeducted > 0 ? userPointsDeducted : undefined,
      });
      lastPts = userPts;
      lastGd = rawGd;
    } else if (isUserInThisTier && hasSpecificRivalDecider && p === rivalPos && rivalClub) {
      let rPts = Math.min(lastPts, resolvedRivalPts);
      let rGd = rPts === lastPts ? Math.min(lastGd - 1, resolvedRivalGd) : resolvedRivalGd;
      
      // If rival is placed above the user (rivalPos < userPos), rival must have >= userPts (and if tied, superior GD)
      if (rivalPos < userPos) {
        rPts = Math.min(lastPts, Math.max(userPts + 1, rPts));
        if (rPts === userPts) {
          rGd = Math.max(rawGd + 2, rGd);
        } else if (userPos === 2 && rivalPos === 1) {
          rGd = Math.max(rawGd + 4, rGd);
        }
      } else if (userPos === 1 && rivalPos === 2) {
        // User is champion (userPos === 1) and rival is runner-up (rivalPos === 2):
        rPts = Math.max(0, Math.min(userPts - 1, rPts));
        rGd = Math.min(rawGd - 4, rGd);
      } else if (rivalPos > userPos) {
        rPts = Math.max(0, Math.min(userPts - (rivalPos - userPos), rPts));
        if (rPts === userPts) {
          rGd = Math.min(rawGd - 2, rGd);
        }
      }
      
      rPts = Math.max(0, rPts);
      const cachedRivalRow = (rivalClub as any)._cachedRow;
      let w: number;
      let d: number;
      let l: number;
      let actualPts: number;
      let gf: number;
      let ga: number;
      if (cachedRivalRow && cachedRivalRow.pts === rPts && typeof cachedRivalRow.w === 'number') {
        w = cachedRivalRow.w;
        d = cachedRivalRow.d;
        l = cachedRivalRow.l;
        actualPts = cachedRivalRow.pts;
        const cachedGdNum = parseInt(String(cachedRivalRow.gd), 10);
        if (!isNaN(cachedGdNum) && (actualPts < lastPts || cachedGdNum < lastGd) && !(rivalPos < userPos && actualPts === userPts && cachedGdNum <= rawGd) && !(rivalPos > userPos && actualPts === userPts && cachedGdNum >= rawGd)) {
          rGd = cachedGdNum;
        }
        const baseGoals = Math.round(totalMatches * (28.5 + (targetTotalClubs / 2 - p) * 0.15));
        gf = cachedRivalRow.gf ?? Math.round(baseGoals + rGd / 2);
        ga = gf - rGd;
      } else {
        w = Math.min(totalMatches, Math.max(0, Math.floor(rPts / 2)));
        d = Math.max(0, rPts - w * 2);
        while (d < 4 && w > 1 && w + d + 1 <= totalMatches) {
          w -= 1;
          d += 2;
        }
        if (w + d > totalMatches) {
          d = totalMatches - w;
        }
        l = totalMatches - w - d;
        actualPts = w * 2 + d;

        const baseGoals = Math.round(totalMatches * (28.5 + (targetTotalClubs / 2 - p) * 0.15));
        gf = Math.round(baseGoals + rGd / 2);
        ga = gf - rGd;
      }

      rows.push({
        id: rivalClub.id,
        pos: rivalPos,
        name: rivalClub.name,
        color: rivalClub.color,
        logo: rivalClub.logo,
        fallbackLogo: rivalClub.fallbackLogo,
        w,
        d,
        l,
        pts: actualPts,
        gd: rGd > 0 ? '+' + rGd : `${rGd}`,
        gf,
        ga,
        isUser: false,
      });
      lastPts = actualPts;
      lastGd = rGd;
    } else {
      const club = leagueClubs.shift() || { id: 9990 + p, name: `Unknown HC ${p}`, color: '#555555', logo: undefined, fallbackLogo: undefined };
      const cachedRow = (club as any)._cachedRow;
      let ptsTarget = (cachedRow && typeof cachedRow.pts === 'number')
        ? cachedRow.pts
        : getRealisticBasePoints(p);

      if (isUserInThisTier) {
        if (p < userPos) {
          if (hasSpecificRivalDecider && rivalPos > 0 && p > rivalPos) {
            ptsTarget = userPts;
          } else {
            ptsTarget = Math.max(userPts + (userPos - p) * 1, ptsTarget);
          }
        } else {
          ptsTarget = Math.min(userPts - (p - userPos), ptsTarget);
        }
      }
      ptsTarget = Math.min(lastPts, Math.max(0, ptsTarget));

      // Realistic Goal Difference descent
      const cachedGdNum = cachedRow && cachedRow.gd !== undefined ? parseInt(String(cachedRow.gd), 10) : NaN;
      const gdBase = (!isNaN(cachedGdNum) && cachedRow?.pts === ptsTarget)
        ? cachedGdNum
        : Math.round(((targetTotalClubs + 1) / 2 - p) * (totalMatches * 0.6));
      let gd = ptsTarget === lastPts ? Math.min(lastGd - 1, gdBase) : gdBase;
      if (isUserInThisTier && p < userPos && ptsTarget === userPts) {
        gd = Math.max(gd, rawGd + (userPos - p));
      }

      let w: number;
      let d: number;
      let l: number;
      let actualPts: number;
      let gf: number;
      let ga: number;
      if (cachedRow && cachedRow.pts === ptsTarget && typeof cachedRow.w === 'number') {
        w = cachedRow.w;
        d = cachedRow.d;
        l = cachedRow.l;
        actualPts = cachedRow.pts;
        const goalsPerMatch = 28 + (targetTotalClubs - p) * 0.15 + (seededRandom(simYear * 31 + p) * 2 - 1);
        const baseGoals = Math.round(totalMatches * goalsPerMatch);
        gf = (gd === cachedGdNum && typeof cachedRow.gf === 'number') ? cachedRow.gf : Math.round(baseGoals + gd / 2);
        ga = gf - gd;
      } else {
        w = Math.min(totalMatches, Math.floor(ptsTarget / 2));
        d = ptsTarget - w * 2;
        if (d < 4 && w > 2 && w + d + 1 <= totalMatches) {
          w -= 1;
          d += 2;
        }
        if (w + d > totalMatches) {
          d = totalMatches - w;
        }
        if (d < 0) d = 0;
        l = Math.max(0, totalMatches - w - d);
        actualPts = w * 2 + d;

        // Handball Goal Counts (~26.5 to 33.5 goals/match average)
        const goalsPerMatch = 28 + (targetTotalClubs - p) * 0.15 + (seededRandom(simYear * 31 + p) * 2 - 1);
        const baseGoals = Math.round(totalMatches * goalsPerMatch);
        gf = Math.round(baseGoals + gd / 2);
        ga = gf - gd;
      }

      rows.push({
        id: club.id,
        pos: p,
        name: club.name,
        color: club.color,
        logo: club.logo,
        fallbackLogo: club.fallbackLogo,
        w,
        d,
        l,
        pts: actualPts,
        gd: gd > 0 ? '+' + gd : `${gd}`,
        gf,
        ga,
        isUser: false,
      });

      lastPts = actualPts;
      lastGd = gd;
    }
  }

  // Assign status markers ('C', 'P', 'PO', 'R', 'Q')
  const relegationThreshold = Math.max(1, targetTotalClubs - 1);
  const isTier1 = currentTier === 1;
  const isMaxTier = currentTier >= getMaxTier(currentCountry);

  const excludedEclCountries = new Set(['GER', 'ESP', 'HUN', 'POR']);
  const maxEuroPos = isTier1 ? (excludedEclCountries.has(currentCountry) ? 5 : 6) : 0;

  const targetSeasonYear = lastHist?.year ?? state?.year;
  const cupFinalsCtx = (lastHist as any)?.resolvedMatchContext?.cupFinals || state?.resolvedMatchContext?.cupFinals || {};
  const seasonMovements = (lastHist?.universeMovements || state?.universeMovements || []).filter(
    (m: any) => m.year === targetSeasonYear && m.type === 'intl_cup'
  );
  const euroQualifyingCupWinners = new Set<string>();
  Object.entries(cupFinalsCtx).forEach(([k, val]: [string, any]) => {
    if (k !== 'reg_cup' && k !== 'reg' && k !== 'cwc' && val?.winnerName && (!val.year || val.year === targetSeasonYear)) {
      euroQualifyingCupWinners.add(String(val.winnerName).trim().toLowerCase());
    }
  });
  seasonMovements.forEach((m: any) => {
    const title = String(m.cupTitle || '').toLowerCase();
    const isRegOrWorld = title.includes('amateur') || title.includes('regional') || title.includes('super globe');
    if (!isRegOrWorld && m.clubName) {
      euroQualifyingCupWinners.add(String(m.clubName).trim().toLowerCase());
    }
  });
  const histTrophies = lastHist?.trophiesThisYear;
  const userWonQualifyingCup = Boolean(
    histTrophies?.dfb || histTrophies?.cl || histTrophies?.el || histTrophies?.ecl
  );

  let eligiblePromoCount = 0;
  let eligibleEuroCount = 0;
  rows.forEach((row) => {
    let statusMarker: string | undefined = undefined;
    const isRowReserve = isReserveClub(row.name);
    const isReservePromoBarred = isRowReserve && currentTier === 2;
    if (!isReservePromoBarred) {
      eligiblePromoCount++;
    }
    if (isTier1 && !isRowReserve && row.pos >= 2) {
      eligibleEuroCount++;
    }

    const isCupQualifier = isTier1 && !isRowReserve && (
      (row.isUser && userWonQualifyingCup) ||
      euroQualifyingCupWinners.has(row.name.trim().toLowerCase())
    );

    const rawPlayoff = (lastHist as any)?.resolvedMatchContext?.playoffDecider || state?.resolvedMatchContext?.playoffDecider;
    const playoff = rawPlayoff && (!rawPlayoff.year || rawPlayoff.year === targetSeasonYear) ? rawPlayoff : undefined;
    const isExactPlayoffPromoted = Boolean(
      !isTier1 && !isReservePromoBarred && (
        (row.isUser && (lastHist?.promoted || (playoff?.type === 'promotion_playoff' && playoff?.userWon))) ||
        (playoff && playoff.lowerTier === currentTier && playoff.promotedClubId && (row.name.trim().toLowerCase() === (playoff.winnerName || '').trim().toLowerCase() || String(row.id) === String(playoff.promotedClubId)))
      )
    );
    const isExactPlayoffRelegated = Boolean(
      !isMaxTier && (
        (row.isUser && (lastHist?.relegated || (playoff?.type === 'relegation_playoff' && !playoff?.userWon))) ||
        (playoff && playoff.upperTier === currentTier && playoff.relegatedClubId && (row.name.trim().toLowerCase() === (playoff.loserName || '').trim().toLowerCase() || String(row.id) === String(playoff.relegatedClubId)))
      )
    );

    if (row.pos === 1) {
      statusMarker = 'C';
    } else if (!isTier1 && !isReservePromoBarred && (eligiblePromoCount === 1 || eligiblePromoCount === 2 || isExactPlayoffPromoted)) {
      statusMarker = 'P';
    } else if (!isTier1 && !isReservePromoBarred && eligiblePromoCount === 3) {
      statusMarker = isExactPlayoffPromoted ? 'P' : 'PO';
    } else if (row.pos >= relegationThreshold || isExactPlayoffRelegated) {
      statusMarker = 'R';
    } else if (!isMaxTier && row.pos === relegationThreshold - 1) {
      statusMarker = isExactPlayoffRelegated ? 'R' : 'PO';
    } else if (isTier1 && !isRowReserve && row.pos >= 2 && (eligibleEuroCount <= maxEuroPos - 1 || isCupQualifier)) {
      statusMarker = 'Q';
    }
    if (statusMarker) row.statusMarker = statusMarker;
  });

  return rows.slice(0, targetTotalClubs);
};

export interface LeagueStakesSummary {
  leaderRow?: TableRow;
  secondRow?: TableRow;
  thirdRow?: TableRow;
  safetyRow?: TableRow;
  dropZoneRow?: TableRow;
  userRow?: TableRow;
  marginToSafety?: number;
  gapToSafety?: number;
  marginToLead?: number;
  marginToPromo?: number;
  isUserInDropZone?: boolean;
  isUserClinchedSafe?: boolean;
}

export function calculateLeagueStakes(
  table: TableRow[],
  currentTier: number,
  currentCountry: string,
  userClubName?: string
): LeagueStakesSummary {
  if (!table || table.length === 0) return {};
  const isTier1 = currentTier === 1;
  const isMaxTier = currentTier >= getMaxTier(currentCountry);
  const targetTotalClubs = table.length;
  const relegationThreshold = Math.max(1, targetTotalClubs - 1);

  const leaderRow = table[0];
  const secondRow = table.length > 1 ? table[1] : undefined;
  const thirdRow = table.length > 2 ? table[2] : undefined;
  const safetyRow = (!isMaxTier && relegationThreshold > 1) ? table[relegationThreshold - 2] : undefined;
  const dropZoneRow = (!isMaxTier && relegationThreshold <= table.length) ? table[relegationThreshold - 1] : undefined;
  const userRow = userClubName ? table.find(r => r.isUser || r.name === userClubName) : undefined;

  let marginToSafety: number | undefined = undefined;
  let gapToSafety: number | undefined = undefined;
  let isUserInDropZone = false;
  let isUserClinchedSafe = false;

  if (userRow && dropZoneRow && safetyRow) {
    if (userRow.pos >= relegationThreshold) {
      isUserInDropZone = true;
      gapToSafety = safetyRow.pts - userRow.pts;
    } else {
      marginToSafety = userRow.pts - dropZoneRow.pts;
      if (marginToSafety > 2) {
        isUserClinchedSafe = true;
      }
    }
  }

  let marginToLead = userRow && leaderRow ? leaderRow.pts - userRow.pts : undefined;
  let marginToPromo = userRow && secondRow && !isTier1 ? secondRow.pts - userRow.pts : undefined;

  return {
    leaderRow,
    secondRow,
    thirdRow,
    safetyRow,
    dropZoneRow,
    userRow,
    marginToSafety,
    gapToSafety,
    marginToLead,
    marginToPromo,
    isUserInDropZone,
    isUserClinchedSafe
  };
}

export const getDecisionDayStandingsSlice = (
  fullTable: TableRow[],
  userPos: number,
  isRelegationScenario = false,
  outcomeResolved?: 'survived' | 'relegated' | 'promoted' | 'champion' | 'runner_up'
): Array<{ pos: number; name: string; pts: number; diff: string; status: string; stake?: string; isPlayer: boolean }> => {
  if (isRelegationScenario || userPos >= fullTable.length - 2) {
    // Drop zone / relegation battle slice (centered around user and bottom teams to ensure user is always visible)
    let dropZone: TableRow[];
    const userIdx = fullTable.findIndex(r => r.isUser || r.pos === userPos);
    if (userIdx !== -1) {
      const startIdx = Math.max(0, Math.min(userIdx - 1, fullTable.length - 4));
      dropZone = fullTable.slice(startIdx, Math.min(fullTable.length, startIdx + 4));
      if (!dropZone.some(r => r.isUser || r.pos === userPos)) {
        dropZone = fullTable.slice(Math.max(0, fullTable.length - 4));
      }
    } else {
      dropZone = fullTable.slice(Math.max(0, fullTable.length - 4));
    }
    return dropZone.map((r) => {
      const isRelegated = r.pos >= fullTable.length - 1;
      const isPlayoff = r.pos === fullTable.length - 2;

      let status = isRelegated ? 'RELEGATED' : isPlayoff ? 'PLAYOFF' : 'SAFE';
      let stake = isRelegated ? '⬇️ DROP' : isPlayoff ? '⚠️ PLAYOFF' : '🛡️ SAFE';

      if (r.isUser) {
        if (outcomeResolved === 'survived') {
          status = 'SAFE';
          stake = '🛡️ SURVIVED';
        } else if (outcomeResolved === 'relegated') {
          status = 'RELEGATED';
          stake = '⬇️ RELEGATED';
        }
      }

      return {
        pos: r.pos,
        name: r.name,
        pts: r.pts,
        diff: r.gd,
        status,
        stake,
        isPlayer: r.isUser
      };
    });
  }

  // Championship / Promotion / Top 3 slice
  let topSlice = fullTable.slice(0, 3);
  if (outcomeResolved === 'runner_up') {
    const userIdx = topSlice.findIndex(r => r.isUser);
    if (userIdx === 0 && topSlice.length > 1) {
      // User was mistakenly in 1st row of slice; swap with 2nd row so champion is #1 and user is #2
      const userRow = { ...topSlice[0], pos: 2, isUser: true };
      const champRow = { ...topSlice[1], pos: 1, isUser: false };
      // Ensure champion points >= user points
      if (champRow.pts <= userRow.pts) {
        champRow.pts = userRow.pts + 1;
      }
      topSlice = [champRow, userRow, ...topSlice.slice(2)];
    }
  }

  return topSlice.map((r) => {
    const isChamp = r.pos === 1;
    const isRunnerUp = r.pos === 2;
    let status = isChamp ? '🏆 CHAMPIONS' : isRunnerUp ? '🥈 RUNNER-UP' : (userPos === 3 ? '⚠️ PLAYOFF' : '🥉 3RD');
    let stake = isChamp ? '🏆 TITLE' : isRunnerUp ? '🥈 2ND' : (userPos === 3 ? '⚠️ PLAYOFF' : '🥉 3RD');

    if (r.isUser) {
      if (outcomeResolved === 'champion') {
        status = '🏆 CHAMPIONS';
        stake = '🏆 CHAMPIONS';
      } else if (outcomeResolved === 'promoted') {
        status = '🏆 PROMOTED';
        stake = '🏆 PROMOTED';
      } else if (outcomeResolved === 'runner_up') {
        status = '🥈 RUNNER-UP';
        stake = '🥈 2ND';
      }
    }

    return {
      pos: r.pos,
      name: r.name,
      pts: r.pts,
      diff: r.gd,
      status,
      stake,
      isPlayer: r.isUser
    };
  });
};
