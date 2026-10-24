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
// TEST 6: v2.2 Release Badge & Version History Integrity
// ----------------------------------------------------------------------------
console.log('Running Test 6: v2.2 Release Badge & v2.1/v2.0/v1.9 History...');

import fs from 'node:fs';
import path from 'node:path';

const onboardingSrc = fs.readFileSync(path.resolve('./src/components/Onboarding.tsx'), 'utf-8');
const modModalSrc = fs.readFileSync(path.resolve('./src/components/ModSelectionModal.tsx'), 'utf-8');

assert(onboardingSrc.includes('v 2.2'), 'Onboarding.tsx must display v 2.2 badge');
assert(onboardingSrc.includes('Sponsors, Supercup &amp; World Updates'), 'Onboarding.tsx must display Sponsors, Supercup & World Updates title');

assert(modModalSrc.includes('v 2.2') && modModalSrc.includes('Sponsors, Supercup &amp; World Updates'), 'ModSelectionModal must contain v2.2 active release');
assert(modModalSrc.includes('v 2.1') && modModalSrc.includes('Game Logic Updates'), 'ModSelectionModal must preserve v2.1 in milestone history');
assert(modModalSrc.includes('v 2.0') && modModalSrc.includes('Comprehensive Handball Realism World Audit'), 'ModSelectionModal must preserve v2.0 in milestone history');
assert(modModalSrc.includes('v 1.9') && modModalSrc.includes('Editor, Design, Mods & European Cups'), 'ModSelectionModal must preserve v1.9 Editor, Design, Mods & European Cups in milestone history');
assert(modModalSrc.includes('isV21Expanded') && modModalSrc.includes('setIsV21Expanded'), 'ModSelectionModal must support collapsible accordion for v2.1 milestone archive');

console.log('✓ Test 6 Passed: v2.2 active release badge and v2.1/v2.0/v1.9 milestone history verified.\n');

console.log('======================================================');
console.log('ALL HANDBALL REALISM BLINDSPOT AUDIT TESTS PASSED (6/6)');
console.log('======================================================');

