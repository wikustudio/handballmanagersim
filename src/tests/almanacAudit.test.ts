import test from 'node:test';
import assert from 'node:assert/strict';
import { getAlmanacEntries, getAlmanacAvailableYears, getCareerStartYear } from '../data/almanacHistory';
import { ALL_CLUBS } from '../data/clubsData';
import { GameState } from '../types';

function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    year: 2026,
    startYear: 2026,
    careerId: 'test-career-123',
    managerName: 'Ernst Bauer',
    tactic: 'Balanced',
    mode: 'standard',
    club: ALL_CLUBS[0],
    budget: 5000000,
    euroStatus: 'CL',
    history: [],
    totals: { matches: 0, wins: 0, att: 0, trophies: 0, domTrophies: 0, intTrophies: 0 },
    reputation: 80,
    youthPipeline: [],
    trophies: [],
    lastJobOfferYear: 2026,
    maxOvrCap: 100,
    investmentsThisSeason: 0,
    sponsorsPitchedThisSeason: 0,
    stadiumExpandedThisSeason: 0,
    regTransfersThisSeason: 0,
    keyTransfersThisSeason: 0,
    jobMarketSearchesThisSeason: 0,
    isNewSeasonRender: false,
    initialRenderDone: true,
    clWins: 0,
    consecutiveTitles: 0,
    trophyDrought: 0,
    activePromise: false,
    boardWarning: false,
    boardExpectsSuccess: false,
    boardGracePeriod: 0,
    boardUltimatum: false,
    seasonsInDebt: 0,
    ...overrides,
  };
}

test('Almanac populates Tier 1 and Tier 2 realistic historic lore back to 1950 when starting in 2026', () => {
  const state = createMockState({ startYear: 2026, year: 2026, history: [] });

  const gerTier1 = getAlmanacEntries({
    state,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 'all',
    competition: 'league',
  });

  // 1950 to 2025 inclusive = 76 historical Lore seasons
  assert.equal(gerTier1.length, 76);
  assert.equal(gerTier1[0].year, 2025);
  assert.equal(gerTier1[gerTier1.length - 1].year, 1950);
  assert.ok(gerTier1.every((e) => e.source === 'Lore'));
  assert.ok(gerTier1.every((e) => typeof e.points === 'number' && e.points > 20));

  // Verify authentic German Tier 1 champions (e.g., 2024 SC Magdeburg, 2023 THW Kiel, 1954 Frisch Auf Göppingen)
  const y2024 = gerTier1.find((e) => e.year === 2024);
  const y2023 = gerTier1.find((e) => e.year === 2023);
  const y1954 = gerTier1.find((e) => e.year === 1954);
  assert.equal(y2024?.clubName, 'SC Magdeburg');
  assert.equal(y2023?.clubName, 'THW Kiel');
  assert.equal(y1954?.clubName, 'Frisch Auf Göppingen');

  // Verify German Tier 2 back to 1950
  const gerTier2 = getAlmanacEntries({
    state,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 2,
    year: 'all',
    competition: 'league',
  });
  assert.equal(gerTier2.length, 76);
  const t2_2024 = gerTier2.find((e) => e.year === 2024);
  assert.equal(t2_2024?.clubName, '1. VfL Potsdam');
});

test('Historic Start Year (e.g. 1954) does NOT pre-populate 1954+ and overwrites with Live simulated seasons', () => {
  // User starts in 1954 (pre-season 1954, 0 completed seasons)
  const state1954 = createMockState({
    startYear: 1954,
    year: 1954,
    history: [],
  });

  assert.equal(getCareerStartYear(state1954), 1954);
  const availYears = getAlmanacAvailableYears(state1954);
  assert.deepEqual(availYears, [1953, 1952, 1951, 1950]);

  const entriesAtStart = getAlmanacEntries({
    state: state1954,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 'all',
    competition: 'league',
  });

  // Only 1950, 1951, 1952, 1953 are populated as Lore; 1954+ are NOT pre-populated!
  assert.equal(entriesAtStart.length, 4);
  assert.deepEqual(
    entriesAtStart.map((e) => e.year),
    [1953, 1952, 1951, 1950]
  );
  assert.ok(entriesAtStart.every((e) => e.source === 'Lore'));

  // Now simulate 1954 finishing with the user's club winning 1. Bundesliga with 64 PTS
  const stateAfter1954 = createMockState({
    startYear: 1954,
    year: 1955,
    managerName: 'Ernst Bauer',
    history: [
      {
        year: 1954,
        clubName: 'THW Kiel',
        clubId: 104,
        country: 'GER',
        tier: 1,
        ovr: 91,
        wins: 32,
        draws: 0,
        losses: 2,
        pts: 64,
        pos: 1,
        gf: 1020,
        ga: 880,
        att: 10000,
        util: 98,
        finalTable: [
          { pos: 1, id: 104, name: 'THW Kiel', pts: 64 },
          { pos: 2, id: 111, name: 'Frisch Auf Göppingen', pts: 58 },
        ],
      },
    ],
  });

  const entriesAfter1954 = getAlmanacEntries({
    state: stateAfter1954,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 'all',
    competition: 'league',
  });

  assert.equal(entriesAfter1954.length, 5);
  assert.equal(entriesAfter1954[0].year, 1954);
  assert.equal(entriesAfter1954[0].source, 'Live');
  assert.equal(entriesAfter1954[0].clubName, 'THW Kiel');
  assert.equal(entriesAfter1954[0].coachName, 'Ernst Bauer');
  assert.equal(entriesAfter1954[0].points, 64);
  assert.equal(entriesAfter1954[0].subtitle, 'Tier 1 • Live');
  assert.equal(entriesAfter1954[1].year, 1953);
  assert.equal(entriesAfter1954[1].source, 'Lore');
});

test('Almanac supports all Competition sub-filters and Tier 3+ seeded population', () => {
  const state = createMockState({ startYear: 2026, year: 2026, history: [] });

  // Lower tier (Tier 4 Germany) populated realistically at game start
  const tier4Entries = getAlmanacEntries({
    state,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 4,
    year: 2025,
    competition: 'league',
  });
  assert.equal(tier4Entries.length, 1);
  assert.equal(tier4Entries[0].tier, 4);
  assert.equal(tier4Entries[0].subtitle, 'Tier 4 • Lore');

  // Champions Cup filter (1957–2025 = 69 editions)
  const clEntries = getAlmanacEntries({
    state,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 'all',
    competition: 'cl',
  });
  assert.equal(clEntries.length, 69);
  assert.equal(clEntries[0].year, 2025);
  assert.equal(clEntries[clEntries.length - 1].year, 1957);

  // Euro Cup filter (1982–2025 = 44 editions)
  const euroEntries = getAlmanacEntries({
    state,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 'all',
    competition: 'euro_cup',
  });
  assert.equal(euroEntries.length, 44);

  // Global Club Cup filter (1997–2025 = 29 editions)
  const cwcEntries = getAlmanacEntries({
    state,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 'all',
    competition: 'cwc',
  });
  assert.equal(cwcEntries.length, 29);

  // National Cup and Regional Cup filters
  const natCupEntries = getAlmanacEntries({
    state,
    clubsDb: ALL_CLUBS as any,
    country: 'ESP',
    tier: 1,
    year: 2024,
    competition: 'nat_cup',
  });
  assert.equal(natCupEntries.length, 1);
  assert.equal(natCupEntries[0].competitionName, 'Copa del Rey');

  const regCupEntries = getAlmanacEntries({
    state,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 2024,
    competition: 'reg_cup',
  });
  assert.equal(regCupEntries.length, 1);
  assert.equal(regCupEntries[0].competitionName, 'Regional Cup');
});

test('Almanac Tier selector does not include All Tiers option', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const modalSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/LeagueTableModal.tsx'),
    'utf8'
  );
  assert.ok(!modalSource.includes('All Tiers'), 'LeagueTableModal must not include All Tiers option');
  assert.ok(modalSource.includes('aria-label="Almanac Tier"'), 'Almanac Tier selector must exist');
});

test('Almanac coach assignment, 1950 start year edge case, Live table sync, and Lore immutability', async () => {
  const { generateLeagueTable } = await import('../utils/leagueTableGenerator');

  // 1. Industria Kielce must get Talant Dujshebaev, not THW Kiel's Filip Jícha
  const state2026 = createMockState({ startYear: 2026, year: 2026, history: [] });
  const pol2023 = getAlmanacEntries({
    state: state2026,
    clubsDb: ALL_CLUBS as any,
    country: 'POL',
    tier: 1,
    year: 2023,
    competition: 'league',
  });
  assert.equal(pol2023.length, 1);
  assert.equal(pol2023[0].clubName, 'Industria Kielce');
  assert.equal(pol2023[0].coachName, 'Talant Dujshebaev');

  // 2. Starting in 1950 with 0 completed seasons must have empty available years & 0 entries
  const state1950 = createMockState({ startYear: 1950, year: 1950, history: [] });
  assert.deepEqual(getAlmanacAvailableYears(state1950), []);
  const entries1950 = getAlmanacEntries({
    state: state1950,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 'all',
    competition: 'league',
  });
  assert.equal(entries1950.length, 0);

  // 3. Live season foreign league champion and points match generateLeagueTable exactly
  const stateLiveForeign = createMockState({
    startYear: 2026,
    year: 2027,
    history: [
      {
        year: 2026,
        clubName: 'THW Kiel',
        clubId: 104,
        country: 'GER',
        tier: 1,
        ovr: 90,
        wins: 30,
        draws: 0,
        losses: 4,
        pts: 60,
        pos: 1,
        gf: 980,
        ga: 850,
        att: 10000,
        util: 95,
      },
    ],
  });
  const fraLiveAlmanac = getAlmanacEntries({
    state: stateLiveForeign,
    clubsDb: ALL_CLUBS as any,
    country: 'FRA',
    tier: 1,
    year: 2026,
    competition: 'league',
  });
  const fraStandingsTable = generateLeagueTable(stateLiveForeign, ALL_CLUBS as any, 1, {
    ...stateLiveForeign.history[0],
    year: 2026,
    country: 'FRA',
  });
  assert.equal(fraLiveAlmanac.length, 1);
  assert.equal(fraLiveAlmanac[0].source, 'Live');
  assert.equal(fraLiveAlmanac[0].clubName, fraStandingsTable[0].name);
  assert.equal(fraLiveAlmanac[0].points, fraStandingsTable[0].pts);

  // 4. Mutating club tiers in clubsDb during a career does not alter historic 1950–2025 Lore champions
  const mutatedClubsDb = ALL_CLUBS.map((c) => ({ ...c, tier: c.tier === 1 ? 2 : 1 }));
  const loreBaseline = getAlmanacEntries({
    state: state2026,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 3,
    year: 2020,
    competition: 'league',
  });
  const loreAfterTierMutations = getAlmanacEntries({
    state: state2026,
    clubsDb: mutatedClubsDb as any,
    country: 'GER',
    tier: 3,
    year: 2020,
    competition: 'league',
  });
  assert.equal(loreBaseline[0].clubId, loreAfterTierMutations[0].clubId);

  // 5. Pruned season in user's own tier where user finished below 1st keeps Standings & Almanac champion in sync
  const statePrunedUserTier = createMockState({
    startYear: 2026,
    year: 2032,
    club: ALL_CLUBS[0], // SC Magdeburg (GER Tier 1)
    history: [
      {
        year: 2026,
        clubName: 'SC Magdeburg',
        clubId: 101,
        country: 'GER',
        tier: 1,
        ovr: 90,
        wins: 24,
        draws: 2,
        losses: 8,
        pts: 50,
        pos: 4,
        gf: 940,
        ga: 880,
        att: 6600,
        util: 100,
        // finalTable stripped by pruneCareerHistoryForStorage, but champion movement preserved:
        universeMovements: [
          {
            id: '102-2026-champ-t1',
            year: 2026,
            clubId: '102',
            clubName: 'Füchse Berlin',
            country: 'GER',
            type: 'champion',
            fromTier: 1,
            toTier: 1,
            isKey: true,
          },
        ],
      },
    ],
  });
  const gerPrunedAlmanac = getAlmanacEntries({
    state: statePrunedUserTier,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 2026,
    competition: 'league',
  });
  const gerPrunedStandings = generateLeagueTable(statePrunedUserTier, ALL_CLUBS as any, 1, {
    ...statePrunedUserTier.history[0],
    year: 2026,
    country: 'GER',
  });
  assert.equal(gerPrunedAlmanac[0].clubName, 'Füchse Berlin');
  assert.equal(gerPrunedStandings[0].name, 'Füchse Berlin');
  assert.equal(gerPrunedAlmanac[0].points, gerPrunedStandings[0].pts);

  // 6. Authentic Tier 2 and National Cup lore across European leagues
  const fraT2_2024 = getAlmanacEntries({
    state: state2026,
    clubsDb: ALL_CLUBS as any,
    country: 'FRA',
    tier: 2,
    year: 2024,
    competition: 'league',
  });
  assert.equal(fraT2_2024[0].clubName, 'Tremblay Handball');

  const gerCup2023 = getAlmanacEntries({
    state: state2026,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 2023,
    competition: 'nat_cup',
  });
  assert.equal(gerCup2023[0].clubName, 'Rhein-Neckar Löwen');

  // 7. 1-tier country Regional Cup excludes top CL giant (e.g. Kadetten Schaffhausen in SUI)
  const suiReg2024 = getAlmanacEntries({
    state: state2026,
    clubsDb: ALL_CLUBS as any,
    country: 'SUI',
    tier: 1,
    year: 2024,
    competition: 'reg_cup',
  });
  assert.notEqual(suiReg2024[0].clubName, 'Kadetten Schaffhausen');
});

test('Coaches from the 1950s, 1960s, 1970s, 1980s, 1990s, 2000s, 2010s, and 2020s never resurface in later eras', () => {
  const state = createMockState({ startYear: 2026, year: 2026, history: [] });
  const testCountries = [
    'GER', 'ESP', 'FRA', 'DEN', 'HUN', 'POL', 'SWE', 'NOR', 'POR', 'CRO',
    'ISL', 'AUT', 'SUI', 'ROU', 'SLO', 'MKD', 'SRB', 'GRE', 'ITA', 'NED'
  ];

  const coachesByDecade = new Map<number, Set<string>>();
  // Track per-club chronological coach sequence to ensure once replaced, a coach never resurfaces at that club
  const clubCoachTimeline = new Map<string, { year: number; coach: string }[]>();

  for (const country of testCountries) {
    const entries = getAlmanacEntries({
      state,
      clubsDb: ALL_CLUBS as any,
      country,
      tier: 'all',
      year: 'all',
      competition: 'all',
    });

    for (const entry of entries) {
      const decade = Math.floor(entry.year / 10) * 10;
      if (!coachesByDecade.has(decade)) {
        coachesByDecade.set(decade, new Set());
      }
      coachesByDecade.get(decade)!.add(entry.coachName);

      const clubKey = `${entry.country}:${entry.clubName}`;
      if (!clubCoachTimeline.has(clubKey)) {
        clubCoachTimeline.set(clubKey, []);
      }
      clubCoachTimeline.get(clubKey)!.push({ year: entry.year, coach: entry.coachName });
    }
  }

  // 1. Verify zero cross-decade resurfacing across 1950s, 1960s, 1970s, 1980s, 1990s, 2000s, 2010s, 2020s
  const decades = Array.from(coachesByDecade.keys()).sort((a, b) => a - b);
  assert.deepEqual(decades, [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]);

  for (let i = 0; i < decades.length; i++) {
    for (let j = i + 1; j < decades.length; j++) {
      const decA = decades[i];
      const decB = decades[j];
      const setA = coachesByDecade.get(decA)!;
      const setB = coachesByDecade.get(decB)!;
      for (const coach of setA) {
        assert.equal(
          setB.has(coach),
          false,
          `Coach "${coach}" from the ${decA}s resurfaced in the ${decB}s!`
        );
      }
    }
  }

  // 2. Verify within each club's chronological timeline (1950 -> 2025) that once a coach is replaced, they never resurface
  for (const [clubKey, timeline] of clubCoachTimeline.entries()) {
    const sortedAsc = [...timeline].sort((a, b) => a.year - b.year);
    const retiredCoaches = new Set<string>();
    let currentCoach: string | null = null;
    for (const item of sortedAsc) {
      if (currentCoach !== null && item.coach !== currentCoach) {
        retiredCoaches.add(currentCoach);
      }
      assert.equal(
        retiredCoaches.has(item.coach),
        false,
        `Coach "${item.coach}" resurfaced at ${clubKey} in ${item.year} after being replaced!`
      );
      currentCoach = item.coach;
    }
  }
});

test('Almanac Regional Cups can never be won by reserve teams in Lore or Live seasons', async () => {
  const { isReserveClub, COUNTRIES } = await import('../data/gameConstants');

  // 1. Verify all reserve team naming conventions (including mid-string II, Icelandic U, Veszprém FA) are caught
  assert.equal(isReserveClub('SC DHfK Leipzig II'), true);
  assert.equal(isReserveClub('SC Magdeburg Youngsters'), true);
  assert.equal(isReserveClub('SMS ZPRP II Kielce'), true);
  assert.equal(isReserveClub('Haukar U'), true);
  assert.equal(isReserveClub('Valur U'), true);
  assert.equal(isReserveClub('FH U'), true);
  assert.equal(isReserveClub('Veszprém FA'), true);
  assert.equal(isReserveClub('Barça Atlètic'), true);
  assert.equal(isReserveClub('BM Granollers B'), true);

  // 2. Verify across all countries and all 1950–2025 Lore years that no reserve team ever wins a Regional Cup
  const stateLore = createMockState({ startYear: 2026, year: 2026, history: [] });
  for (const ctry of Object.keys(COUNTRIES)) {
    const regEntries = getAlmanacEntries({
      state: stateLore,
      clubsDb: ALL_CLUBS as any,
      country: ctry,
      tier: 'all',
      year: 'all',
      competition: 'reg_cup',
    });
    for (const entry of regEntries) {
      assert.equal(
        isReserveClub(entry.clubName),
        false,
        `Reserve team "${entry.clubName}" won ${ctry} Regional Cup in ${entry.year}!`
      );
    }
  }

  // 3. Verify that even if a Live season history contains a reserve team in trophiesThisYear.reg, cupFinals, or universeMovements, Almanac rejects it
  const stateLiveReserve = createMockState({
    startYear: 2026,
    year: 2027,
    history: [
      {
        year: 2026,
        clubName: 'SC DHfK Leipzig II',
        clubId: 154,
        country: 'GER',
        tier: 4,
        ovr: 65,
        wins: 20,
        draws: 2,
        losses: 4,
        pts: 42,
        pos: 1,
        gf: 750,
        ga: 680,
        att: 900,
        util: 80,
        trophiesThisYear: { reg: 1 } as any,
        resolvedMatchContext: {
          cupFinals: {
            reg_cup: {
              cupId: 'reg_cup',
              cupName: 'Regional Cup',
              winnerName: 'SC DHfK Leipzig II',
              winnerId: 154,
              userWon: true,
              year: 2026,
            },
          },
        } as any,
        universeMovements: [
          {
            id: '1137-2026-cup-reg',
            year: 2026,
            clubId: '1137',
            clubName: 'SMS ZPRP II Kielce',
            country: 'POL',
            type: 'intl_cup',
            fromTier: 3,
            toTier: 3,
            cupTitle: 'Regional Cup',
            isKey: true,
          },
        ],
      },
    ],
  });

  const gerLiveReg = getAlmanacEntries({
    state: stateLiveReserve,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 'all',
    year: 2026,
    competition: 'reg_cup',
  });
  assert.equal(gerLiveReg.length, 1);
  assert.equal(isReserveClub(gerLiveReg[0].clubName), false);
  assert.notEqual(gerLiveReg[0].clubName, 'SC DHfK Leipzig II');

  const polLiveReg = getAlmanacEntries({
    state: stateLiveReserve,
    clubsDb: ALL_CLUBS as any,
    country: 'POL',
    tier: 'all',
    year: 2026,
    competition: 'reg_cup',
  });
  assert.equal(polLiveReg.length, 1);
  assert.equal(isReserveClub(polLiveReg[0].clubName), false);
  assert.notEqual(polLiveReg[0].clubName, 'SMS ZPRP II Kielce');

  // 4. Verify across all countries that all competitions (all) in Lore and Live seasons never crown reserve teams
  for (const ctry of ['GER', 'ESP', 'FRA', 'HUN', 'POL', 'ISL', 'DEN']) {
    const allLore = getAlmanacEntries({
      state: stateLore,
      clubsDb: ALL_CLUBS as any,
      country: ctry,
      tier: 'all',
      year: 'all',
      competition: 'all',
    });
    for (const entry of allLore) {
      if (entry.competitionType !== 'league' || !(ctry === 'ESP' && entry.tier === 2)) {
        assert.equal(
          isReserveClub(entry.clubName),
          false,
          `Reserve team "${entry.clubName}" crowned in ${ctry} ${entry.competitionType} (${entry.year})!`
        );
      }
    }

    const allLive = getAlmanacEntries({
      state: stateLiveReserve,
      clubsDb: ALL_CLUBS as any,
      country: ctry,
      tier: 'all',
      year: 2026,
      competition: 'all',
    });
    for (const entry of allLive) {
      if (entry.competitionType !== 'league' || !(ctry === 'GER' && entry.tier === 4)) {
        assert.equal(
          isReserveClub(entry.clubName),
          false,
          `Reserve team "${entry.clubName}" crowned in Live ${ctry} ${entry.competitionType} (2026)!`
        );
      }
    }
  }
});

test('SuperCup is captured in Lore and Live Almanac and AI-generated filler teams never duplicate Tier 1 clubs or win titles', async () => {
  const { generateLeagueTable } = await import('../utils/leagueTableGenerator');
  const { simulateGlobalLeagues } = await import('../engine/leagueSimulation');
  const { isReserveClub } = await import('../data/gameConstants');

  // 1. Lore Supercup entries (1950–2025)
  const stateLore = createMockState({ startYear: 2026, year: 2026, history: [] });
  const gerScLore = getAlmanacEntries({
    state: stateLore,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 'all',
    competition: 'supercup',
  });
  assert.equal(gerScLore.length, 76);
  assert.ok(gerScLore.every((e) => e.competitionType === 'supercup' && e.source === 'Lore' && !isReserveClub(e.clubName)));

  // 2. simulateGlobalLeagues records Domestic Supercup (-cup-sc) and Almanac Live captures it
  const simRes = simulateGlobalLeagues(
    {},
    ALL_CLUBS[0] as any, // SC Magdeburg
    1,
    2026,
    1,
    { bl: 1, sc: 1 },
    undefined,
    undefined,
    {
      cupFinals: {
        dom_supercup: {
          cupId: 'dom_supercup',
          cupName: 'DHB-Supercup',
          winnerName: 'SC Magdeburg',
          winnerId: 101,
          userWon: true,
          year: 2026,
        },
      },
    } as any
  );
  const scMove = simRes.movements.find((m) => String(m.id).endsWith('-cup-sc'));
  assert.ok(scMove, 'simulateGlobalLeagues must record a -cup-sc movement');
  assert.equal(scMove?.clubName, 'SC Magdeburg');

  const stateLiveSc = createMockState({
    startYear: 2026,
    year: 2027,
    history: [
      {
        year: 2026,
        clubName: 'SC Magdeburg',
        clubId: 101,
        country: 'GER',
        tier: 1,
        ovr: 90,
        wins: 30,
        draws: 2,
        losses: 2,
        pts: 62,
        pos: 1,
        gf: 1020,
        ga: 880,
        att: 6600,
        util: 100,
        trophiesThisYear: { bl: 1, sc: 1 } as any,
        universeMovements: simRes.movements,
      },
    ],
  });
  const gerScLive = getAlmanacEntries({
    state: stateLiveSc,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 2026,
    competition: 'supercup',
  });
  assert.equal(gerScLive.length, 1);
  assert.equal(gerScLive[0].source, 'Live');
  assert.equal(gerScLive[0].clubName, 'SC Magdeburg');

  // 2b. Pre-Season Supercup played at the start of state.year (before state.year is in state.history) is immediately visible in Almanac
  const statePreSeasonSc = createMockState({
    startYear: 2026,
    year: 2026,
    supercupPlayedYear: 2026,
    pendingSupercupTrophies: { sc: 1 },
    resolvedMatchContext: {
      cupFinals: {
        dom_supercup: {
          cupId: 'dom_supercup',
          cupName: 'German Supercup',
          winnerId: 101,
          winnerName: 'SC Magdeburg',
          userWon: true,
          year: 2026,
        },
      },
    },
    history: [],
  } as any);
  const availYearsPreSeason = getAlmanacAvailableYears(statePreSeasonSc);
  assert.ok(availYearsPreSeason.includes(2026), 'Available Almanac years must include 2026 once Pre-Season Supercup is resolved');
  const preSeasonScEntries = getAlmanacEntries({
    state: statePreSeasonSc,
    clubsDb: ALL_CLUBS as any,
    country: 'GER',
    tier: 1,
    year: 2026,
    competition: 'supercup',
  });
  assert.equal(preSeasonScEntries.length, 1);
  assert.equal(preSeasonScEntries[0].year, 2026);
  assert.equal(preSeasonScEntries[0].source, 'Live');
  assert.equal(preSeasonScEntries[0].clubName, 'SC Magdeburg');

  // 3. AI-generated filler teams in sparse divisions never duplicate Tier 1 clubs or win 1st place ahead of real clubs
  const sparsePolClubs = ALL_CLUBS.filter((c) => c.country === 'POL').slice(0, 6);
  const polTier2Table = generateLeagueTable(stateLiveSc, sparsePolClubs as any, 2, {
    year: 2026,
    country: 'POL',
    tier: 2,
    userPlayedTier: 1,
  } as any);
  assert.ok(polTier2Table.length > 0);
  // Ensure no Danish/foreign fallback clubs ('Aalborg Håndbold', 'HC Bjerringbro') were injected into Poland
  assert.ok(!polTier2Table.some((r) => r.name.includes('Aalborg') || r.name.includes('Bjerringbro')));
  // Ensure no existing POL Tier 1 club in sparsePolClubs was duplicated as a 9900+ filler
  const fillerRows = polTier2Table.filter((r) => Number(r.id) >= 9900);
  const realIdsOrNames = new Set(sparsePolClubs.map((c) => c.name.toLowerCase()));
  assert.ok(fillerRows.every((r) => !realIdsOrNames.has(r.name.toLowerCase())));
});

