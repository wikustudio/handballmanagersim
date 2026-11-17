import assert from 'node:assert';
import { 
  COUNTRIES, 
  getMaxTier, 
  getLeagueInfo, 
  getDomesticCupInfo, 
  getFAInfo, 
  getCountryEconomicProfile, 
  calculateClubFinancials, 
  formatMoney, 
  normalizeCountry 
} from '../data/gameConstants';
import { getLeagueSize, calculateProbabilisticSeason } from '../engine/engine';
import { generateLeagueTable } from '../utils/leagueTableGenerator';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs } from '../utils/modManager';

console.log('======================================================');
console.log('--- RUNNING FULL HANDBALL REALISM WORLD AUDIT ---');
console.log('======================================================\n');

const activeClubs = getActiveClubs();
const countryCodes = Object.keys(COUNTRIES);

// ----------------------------------------------------------------------------
// TEST 1: All 18 Playable Nations - League Pyramids & Federation Integrity
// ----------------------------------------------------------------------------
console.log('Running Test 1: All 18 Nations Pyramids, Federations & Domestic Cups...');
assert(countryCodes.length >= 18, `Must have at least 18 playable nations, found: ${countryCodes.length}`);

countryCodes.forEach(code => {
  const norm = normalizeCountry(code);
  const maxTier = getMaxTier(norm);
  assert(maxTier >= 1, `${norm} maxTier must be at least 1, got ${maxTier}`);

  const fa = getFAInfo(norm);
  assert(fa && fa.name && fa.cup && fa.arenaFinal, `${norm} must have authentic FA info with cup and final arena`);
  assert(fa.name !== 'NAT' && fa.cup !== 'National Cup', `${norm} must have authentic specific federation and cup, got ${fa.name}/${fa.cup}`);

  const cup = getDomesticCupInfo(norm, 1);
  assert(cup && cup.name, `${norm} must have domestic cup name`);

  const econ = getCountryEconomicProfile(norm);
  assert(econ && econ.tier && econ.tvScale > 0 && econ.sponsorScale > 0, `${norm} must have explicit economic profile`);

  // Verify all tiers in pyramid
  for (let t = 1; t <= maxTier; t++) {
    const lInfo = getLeagueInfo(t, norm);
    assert(lInfo && lInfo.name, `${norm} Tier ${t} must have league info`);
    const lSize = getLeagueSize(t, norm, 0, t, norm, activeClubs);
    assert(lSize >= 4 && lSize <= 20, `${norm} Tier ${t} league size must be realistic (4-20), got ${lSize}`);
  }
});
console.log(`✓ Test 1 Passed: 100% of all ${countryCodes.length} playable nations verified with authentic pyramids, federations, cups, and arenas.\n`);

// ----------------------------------------------------------------------------
// TEST 2: Core Handball Scoring Realism (2-1-0 Points System & Goal Ranges)
// ----------------------------------------------------------------------------
console.log('Running Test 2: Handball 2-1-0 Points System & Match Scoreline Bounds...');

let sampleMatches = 0;
let totalGoals = 0;
let totalWins = 0;
let totalDraws = 0;
let totalLosses = 0;

for (let i = 0; i < 200; i++) {
  const testClub = activeClubs[i % activeClubs.length];
  const numTeams = getLeagueSize(testClub.tier, testClub.country || 'GER', testClub.id, testClub.tier, testClub.country || 'GER', activeClubs);
  const res = calculateProbabilisticSeason(testClub, 75, testClub.tier, 'Fast Break', numTeams, 100);

  sampleMatches += res.played;
  totalGoals += res.gf;
  totalWins += res.wins;
  totalDraws += res.draws;
  totalLosses += res.losses;

  // 2-1-0 Rule strictly enforced
  const expectedPts = res.wins * 2 + res.draws;
  assert.strictEqual(res.pts, expectedPts, `Points must strictly equal wins*2 + draws (2-1-0 system). Expected ${expectedPts}, got ${res.pts}`);

  // Matches played consistency
  assert.strictEqual(res.played, res.wins + res.draws + res.losses, 'Matches played must equal W + D + L');

  // Realistic goals per game bounds (handball: 20 to 36 goals per team per game)
  const gpg = res.gf / res.played;
  assert(gpg >= 20 && gpg <= 36, `Goals per game must be authentic handball range (20-36), got ${gpg.toFixed(1)}`);
}

const avgGoalsPerMatch = totalGoals / sampleMatches;
console.log(`  Audited ${sampleMatches} simulated matches across European leagues.`);
console.log(`  Average goals scored per team per game: ${avgGoalsPerMatch.toFixed(2)} goals.`);
console.log(`  Draw frequency: ${((totalDraws / sampleMatches) * 100).toFixed(1)}% (authentic handball range ~8-14%).`);
assert(avgGoalsPerMatch >= 24 && avgGoalsPerMatch <= 32, 'Handball average goals must sit between 24 and 32 per team');
console.log('✓ Test 2 Passed: 2-1-0 points system strictly verified and goal distributions sit perfectly within authentic handball world standards.\n');

// ----------------------------------------------------------------------------
// TEST 3: Lowest Tier Visual Relegation & Direct Manager Sacking Integrity
// ----------------------------------------------------------------------------
console.log('Running Test 3: Lowest Tier Floor Retention & Direct Sacking Rule...');

for (const country of ['GER', 'FRA', 'ESP', 'DEN', 'SWE', 'CRO', 'POR', 'HUN']) {
  const maxT = getMaxTier(country);
  const lowestClub = activeClubs.find(c => (c.country || 'GER') === country && c.tier === maxT) || {
    id: 99991,
    name: `${country} Grassroots HC`,
    tier: maxT,
    baseOvr: 42,
    color: '3b82f6',
    stadium: 1000,
    country: country
  };

  const lSize = getLeagueSize(maxT, country, lowestClub.id, maxT, country, activeClubs);

  // Simulate club finishing in last place in the lowest division
  const bottomHist = {
    year: 2026,
    tier: maxT,
    playedTier: maxT,
    pos: lSize,
    pts: 6,
    gf: 650,
    ga: 850,
    won: 2,
    drawn: 2,
    lost: lSize * 2 - 6,
    clubName: lowestClub.name
  };

  const mockState = {
    club: lowestClub,
    year: 2026,
    history: [bottomHist],
    worldClubs: {}
  };

  const table = generateLeagueTable(mockState as any, activeClubs, maxT);
  assert(table && table.length >= 2, `Table for ${country} T${maxT} must generate`);
  
  // Last placed team must receive visual 'R' marker
  const lastRow = table[table.length - 1];
  assert.strictEqual(lastRow.statusMarker, 'R', `${country} lowest tier bottom club must have visual 'R' marker for visual parity`);

  // Floor retention: Multi-season simulation must NOT relegate below maxTier
  let worldMap: Record<string, any> = {};
  activeClubs.forEach(c => { worldMap[c.id] = { ...c }; });
  
  const sim = simulateGlobalLeagues(
    worldMap,
    lowestClub,
    maxT,
    2026,
    lSize,
    {},
    table,
    { [maxT]: table }
  );

  const updatedClub = sim.newWorldClubs[lowestClub.id] || lowestClub;
  assert(updatedClub.tier <= maxT, `${country} club in bottom tier must NOT relegate into tier ${updatedClub.tier} (max is ${maxT})`);
  assert.strictEqual(updatedClub.tier, maxT, `${country} club must remain in floor tier ${maxT}`);
}
console.log('✓ Test 3 Passed: Lowest tier floor retention verified across multiple nations; teams remain at floor with visual drop markers intact.\n');

// ----------------------------------------------------------------------------
// TEST 4: European Handball Financial Reality Audit (Zero NaNs & Sensible Scales)
// ----------------------------------------------------------------------------
console.log('Running Test 4: Financial Structure, Budget Realism & Zero-NaN Integrity...');

for (const code of countryCodes) {
  const norm = normalizeCountry(code);
  const maxT = getMaxTier(norm);

  for (let t = 1; t <= maxT; t++) {
    const mockClub = {
      id: 99500 + t,
      name: `${norm} T${t} HC`,
      tier: t,
      baseOvr: Math.max(38, 85 - (t - 1) * 9),
      color: '3b82f6',
      stadium: Math.max(800, 10000 - (t - 1) * 2000),
      country: norm,
      fanBase: Math.max(5000, 150000 - (t - 1) * 30000),
      currentBudget: 2000000
    };

    const mockState = {
      club: mockClub,
      year: 2026,
      euroStatus: t === 1 ? 'CL' : 'none',
      managerSkills: [],
      fanStrategy: 'balanced',
      pricingStrategy: 'standard',
      arenaFacilities: {},
      sponsorIncome: 0,
      worldClubs: {}
    };

    const fin = calculateClubFinancials(mockState as any);

    // Assert strictly zero NaNs
    assert(!isNaN(fin.estRevenue), `${norm} T${t} estRevenue is NaN`);
    assert(!isNaN(fin.operatingExpenses), `${norm} T${t} operatingExpenses is NaN`);
    assert(!isNaN(fin.net), `${norm} T${t} net is NaN`);
    assert(!isNaN(fin.wages), `${norm} T${t} wages is NaN`);
    assert(!isNaN(fin.expectedAtt), `${norm} T${t} expectedAtt is NaN`);

    // Handball financial sanity: Top tier clubs revenue in €1M-€15M, lower tiers €20k-€2M
    if (t === 1) {
      assert(fin.estRevenue >= 800000 && fin.estRevenue <= 16000000, `${norm} T1 revenue outside handball scale: ${formatMoney(fin.estRevenue)}`);
      assert(fin.wages >= 500000 && fin.wages <= 15000000, `${norm} T1 wages outside handball scale: ${formatMoney(fin.wages)}`);
    } else if (t >= 4) {
      assert(fin.estRevenue <= 2000000, `${norm} T${t} lower tier revenue too high for handball: ${formatMoney(fin.estRevenue)}`);
    }

    // Attendance bounds check
    assert(fin.expectedAtt <= mockClub.stadium, `${norm} T${t} attendance (${fin.expectedAtt}) exceeded stadium capacity (${mockClub.stadium})`);
  }
}
console.log('✓ Test 4 Passed: 100% of financial calculations across all 18 nations and tiers yield authentic, NaN-free handball budgets and operations.\n');

// ----------------------------------------------------------------------------
// TEST 5: Multi-Year Simulation Macro-Stability (Pyramid Integrity & Talent Aging)
// ----------------------------------------------------------------------------
console.log('Running Test 5: 12-Year Macro Simulation Stability Across European Pyramids...');

let worldClubsMap: Record<string, any> = {};
activeClubs.forEach(c => { worldClubsMap[c.id] = { ...c }; });

const userClub = activeClubs[0]; // SC Magdeburg
let totalInsolvencies = 0;

for (let y = 2026; y <= 2037; y++) {
  const sim = simulateGlobalLeagues(
    worldClubsMap,
    userClub,
    userClub.tier,
    y,
    1,
    { champions: true },
    undefined,
    undefined
  );

  worldClubsMap = sim.newWorldClubs;
  if (sim.insolventClubs) {
    totalInsolvencies += sim.insolventClubs.length;
    assert(sim.insolventClubs.length <= 2, `Insolvencies in single season must be max 2, got ${sim.insolventClubs.length}`);
  }

  // Verify Bundesliga Tier 1 stays at canonical 18 clubs
  const gerT1Clubs = Object.values(worldClubsMap).filter(c => normalizeCountry(c.country || 'GER') === 'GER' && c.tier === 1);
  assert.strictEqual(gerT1Clubs.length, 18, `German Bundesliga must maintain exactly 18 clubs in year ${y}, got ${gerT1Clubs.length}`);

  // Verify ratings are bounded
  Object.values(worldClubsMap).forEach((c: any) => {
    assert(c.baseOvr >= 25 && c.baseOvr <= 96, `Club ${c.name} OVR escaped handball bounds: ${c.baseOvr}`);
  });
}

console.log(`  Successfully simulated 12 macro seasons with ${totalInsolvencies} rare insolvency restructurings.`);
console.log('✓ Test 5 Passed: Multi-year pyramid sizes and OVR bounds remained perfectly stable over 12 seasons.\n');

// ----------------------------------------------------------------------------
// TEST 6: v3.0 Release Badge & Version History Integrity
// ----------------------------------------------------------------------------
console.log('Running Test 6: v3.0 Release Badge & v2.4-v1.9 Milestone History...');

import fs from 'node:fs';
import path from 'node:path';
import {
  REAL_LIFE_START_ATTENDANCES,
  getRealLifeStartingAttendance,
  isReserveClubName,
  getClubStartingAttendance,
  getCalibratedStartingFanbase,
} from '../data/realLifeAttendance';
import { useGameStore } from '../store/useGameStore';

const onboardingSrc = fs.readFileSync(path.resolve('./src/components/Onboarding.tsx'), 'utf-8');
const modModalSrc = fs.readFileSync(path.resolve('./src/components/ModSelectionModal.tsx'), 'utf-8');
const aboutSrc = fs.readFileSync(path.resolve('./src/components/AboutPage.tsx'), 'utf-8');

assert(onboardingSrc.includes('v 3.0'), 'Onboarding.tsx must display v 3.0 badge');
assert(onboardingSrc.includes('Courtside Edition'), 'Onboarding.tsx must display Courtside Edition release title');
assert(aboutSrc.includes('v 3.0 Courtside Edition') && aboutSrc.includes('Version 3.0'), 'AboutPage.tsx must display v3.0');

assert(
  modModalSrc.includes('v 3.0') &&
  modModalSrc.includes('v3.0 Changelog') &&
  modModalSrc.includes('Courtside Edition'),
  'ModSelectionModal must contain v3.0 Courtside Edition active release'
);
assert(
  modModalSrc.includes('v 2.4') &&
  modModalSrc.includes('isV24Expanded') &&
  modModalSrc.includes('Courtside Foundation'),
  'ModSelectionModal must preserve v2.4 in collapsible milestone history'
);
assert(
  modModalSrc.includes('v 2.3') &&
  (modModalSrc.includes('Multi-Year Sponsors, UI Overhaul &amp; Logic Polish') || modModalSrc.includes('Multi-Year Sponsors, UI Overhaul & Logic Polish')),
  'ModSelectionModal must preserve v2.3 in milestone history'
);
assert(
  modModalSrc.includes('v 2.2') &&
  (modModalSrc.includes('Sponsors, Supercup &amp; World Updates') || modModalSrc.includes('Sponsors, Supercup & World Updates')),
  'ModSelectionModal must preserve v2.2 in milestone history'
);
assert(modModalSrc.includes('v 2.1') && modModalSrc.includes('Game Logic Updates'), 'ModSelectionModal must preserve v2.1 in milestone history');
assert(modModalSrc.includes('v 2.0') && modModalSrc.includes('Comprehensive Handball Realism World Audit'), 'ModSelectionModal must preserve v2.0 in milestone history');
assert(modModalSrc.includes('v 1.9') && modModalSrc.includes('Editor, Design, Mods & European Cups'), 'ModSelectionModal must preserve v1.9 Editor, Design, Mods & European Cups in milestone history');
assert(modModalSrc.includes('isV23Expanded') && modModalSrc.includes('isV21Expanded') && modModalSrc.includes('setIsV21Expanded'), 'ModSelectionModal must support collapsible accordions for milestone archives');

console.log('✓ Test 6 Passed: v3.0 active release badge and v2.4-v1.9 milestone history verified.\n');

// ----------------------------------------------------------------------------
// TEST 7: Real-Life European Attendance Calibration Across All Tiers (T1–T6 & Reserves)
// ----------------------------------------------------------------------------
console.log('Running Test 7: Multi-Tier Real-Life Attendance Accuracy Across European Pyramids...');

// 7a. Every Tier-1 and Tier-2 non-reserve club in activeClubs must have an explicit documented attendance <= stadium
const tier1And2Clubs = activeClubs.filter(
  c => (c.tier === 1 || c.tier === 2) && !isReserveClubName(c.name)
);
tier1And2Clubs.forEach(c => {
  const realAtt = getRealLifeStartingAttendance(c.name, c.id);
  assert(
    realAtt !== null && realAtt > 0,
    `Tier ${c.tier} club ${c.country}:${c.name} must have explicit REAL_LIFE_START_ATTENDANCES entry`
  );
  assert(
    realAtt <= c.stadium,
    `${c.name} documented real attendance (${realAtt}) must not exceed stadium capacity (${c.stadium})`
  );
});

// 7b. Every Reserve / II / U21 / Atlètic / FA club across ALL tiers must strictly respect <= 300 cap
const reserveClubs = activeClubs.filter(c => isReserveClubName(c.name));
assert(reserveClubs.length > 0, 'Dataset must contain reserve teams');
reserveClubs.forEach(rc => {
  const startAtt = getClubStartingAttendance(rc);
  assert(startAtt <= 300, `Reserve club ${rc.name} startAtt (${startAtt}) exceeded 300 cap`);
  const fin = calculateClubFinancials({
    club: { ...rc, fanBase: getCalibratedStartingFanbase(rc), fanCalibrated: true },
    year: 2026,
    history: [],
  } as any);
  assert(fin.expectedAtt <= 300, `Reserve club ${rc.name} expectedAtt (${fin.expectedAtt}) exceeded 300 cap`);
});

// 7c. Multi-tier monotonic scaling: In every pyramid with multiple tiers, Avg(Tier N) > Avg(Tier N+1)
const pyramidCountries = Array.from(new Set(activeClubs.map(c => normalizeCountry(c.country || 'GER'))));
pyramidCountries.forEach(ctry => {
  const clubsInCountry = activeClubs.filter(
    c => normalizeCountry(c.country || 'GER') === ctry && !isReserveClubName(c.name)
  );
  const tiersPresent = Array.from(new Set(clubsInCountry.map(c => c.tier || 1))).sort((a, b) => a - b);
  for (let i = 0; i < tiersPresent.length - 1; i++) {
    const upperTier = tiersPresent[i];
    const lowerTier = tiersPresent[i + 1];
    const upperClubs = clubsInCountry.filter(c => c.tier === upperTier);
    const lowerClubs = clubsInCountry.filter(c => c.tier === lowerTier);
    if (upperClubs.length === 0 || lowerClubs.length === 0) continue;
    const upperAvg = upperClubs.reduce((s, c) => s + getClubStartingAttendance(c), 0) / upperClubs.length;
    const lowerAvg = lowerClubs.reduce((s, c) => s + getClubStartingAttendance(c), 0) / lowerClubs.length;
    assert(
      upperAvg > lowerAvg,
      `${ctry} Tier ${upperTier} avg attendance (${Math.round(upperAvg)}) must strictly exceed Tier ${lowerTier} (${Math.round(lowerAvg)})`
    );
  }
});

// 7d. Sample non-sellout & sellout Tier-1 and Tier-2 European clubs via initGame -> calculateClubFinancials
const realLifeChecks = [
  { name: 'SC Magdeburg', target: 6600, maxPctDiff: 0.01, mustNotSellOut: false },
  { name: 'SC DHfK Leipzig', target: 4850, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'Rhein-Neckar Löwen', target: 8400, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'TSV Hannover-Burgdorf', target: 9169, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'Bergischer HC', target: 2720, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'Caen HB', target: 2250, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'FC Barcelona', target: 2680, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'Nordsjælland Håndbold', target: 1550, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'ORLEN Wisła Płock', target: 2850, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'OTP Bank - Pick Szeged', target: 5150, maxPctDiff: 0.05, mustNotSellOut: true },
  { name: 'HBC Nantes', target: 5902, maxPctDiff: 0.01, mustNotSellOut: false },
  { name: 'Aalborg Håndbold', target: 5145, maxPctDiff: 0.05, mustNotSellOut: true },
];

realLifeChecks.forEach(chk => {
  const c = activeClubs.find(x => x.name === chk.name);
  assert(c, `Missing club ${chk.name}`);
  useGameStore.getState().initGame(String(c!.id), 'Coach', 2024, 'Balanced', 'standard');
  const fin = calculateClubFinancials(useGameStore.getState() as any);
  const diffRatio = Math.abs(fin.expectedAtt - chk.target) / chk.target;
  assert(
    diffRatio <= chk.maxPctDiff,
    `${chk.name} expectedAtt (${fin.expectedAtt}) deviated too far from real-life ${chk.target}`
  );
  if (chk.mustNotSellOut) {
    assert(
      fin.expectedAtt < c!.stadium,
      `${chk.name} (${fin.expectedAtt}/${c!.stadium}) must NOT falsely sell out 100% on Day 1`
    );
  }
});

console.log('✓ Test 7 Passed: All Tier-1 & Tier-2 clubs, lower-tier curves (T3–T6), and reserve caps verified across all nations.\n');

console.log('======================================================');
console.log('ALL HANDBALL REALISM BLINDSPOT AUDIT TESTS PASSED (7/7)');
console.log('======================================================');


