import assert from 'node:assert';
import fs from 'node:fs';
import { generateLeagueTable } from '../utils/leagueTableGenerator';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { ALL_CLUBS } from '../data/clubs';
import { Club } from '../types';

console.log('--- RUNNING UNIVERSE INTEGRITY & UNDERFLOW AUDIT ---');

// ============================================================================
// TEST 1: Endless Rival Takeover Spam Prevention
// ============================================================================
{
  console.log('\nTest 1: Rival Takeover Spam Suppression...');
  const baseClub = ALL_CLUBS[0];
  const userClub: Club = { ...baseClub, id: 9999, name: 'User HC', tier: 1, country: 'GER', baseOvr: 75 };
  const nemesisClub: Club = {
    ...ALL_CLUBS.find(c => c.tier === 1 && c.country === 'GER' && c.id !== userClub.id)!,
    isNemesisActive: true,
  };

  // Case A: Club was already nemesis in previous season (worldClubsMap has isNemesisActive = true)
  const incomingMapAlreadyNemesis: Record<string, Club> = {
    [nemesisClub.id]: { ...nemesisClub, isNemesisActive: true }
  };
  const resultAlready = simulateGlobalLeagues(
    incomingMapAlreadyNemesis,
    userClub,
    1,
    2026,
    5
  );
  const takeoverMovementsAlready = resultAlready.movements.filter(m => (m as any).type === 'takeover');
  assert.strictEqual(
    takeoverMovementsAlready.length,
    0,
    'Takeover event must NOT be spammed if the rival was already an active nemesis'
  );

  // Case B: Rival freshly became nemesis this season (worldClubsMap does NOT have isNemesisActive)
  const incomingMapFreshNemesis: Record<string, Club> = {
    [nemesisClub.id]: { ...nemesisClub, isNemesisActive: false }
  };
  const dominantUserClub: Club = { ...userClub, baseOvr: 93 };
  const resultFresh = simulateGlobalLeagues(
    incomingMapFreshNemesis,
    dominantUserClub,
    1,
    2026,
    1,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    2 // 2 consecutive titles triggers arms race / nemesis activation
  );
  const takeoverMovementsFresh = resultFresh.movements.filter(m => (m as any).type === 'takeover');
  assert.strictEqual(
    takeoverMovementsFresh.length,
    1,
    'Takeover event must be triggered exactly once upon initial activation'
  );

  console.log('✓ Test 1 Passed: Hostile takeover movements trigger only on fresh activation, eliminating multi-season spam.');
}

// ============================================================================
// TEST 2: Americas Continental Blackout Resolution
// ============================================================================
{
  console.log('\nTest 2: European and International Cup Simulation when managing in Americas...');
  const userClubUSA: Club = {
    id: 9988,
    name: 'New York City HC',
    tier: 1,
    country: 'USA',
    baseOvr: 70,
    color: '#1d4ed8'
  };

  const resultUSA = simulateGlobalLeagues(
    {},
    userClubUSA,
    1,
    2025,
    3
  );

  const clMovement = resultUSA.movements.find(m => m.type === 'intl_cup' && m.cupTitle === 'EHF Champions League');
  const cwcMovement = resultUSA.movements.find(m => m.type === 'intl_cup' && m.cupTitle === 'IHF Super Globe');

  assert.ok(clMovement, 'EHF Champions League winner must be simulated even when user manages in the Americas');
  assert.ok(cwcMovement, 'IHF Super Globe winner must be simulated even when user manages in the Americas');
  assert.notStrictEqual(clMovement.clubName, '', 'EHF Champions League winner must have a valid club name');

  console.log('✓ Test 2 Passed: European/International tournaments simulate independently across global universe regardless of user location.');
}

// ============================================================================
// TEST 3: Negative Win/Point Underflow Clamp
// ============================================================================
{
  console.log('\nTest 3: Zero-point tanking and negative win/point prevention in league table generator...');
  const userClub: Club = { ...ALL_CLUBS[0], id: 1001, name: 'Relegation Battler', tier: 1, country: 'GER', baseOvr: 50 };
  const rivalName = 'Direct Relegation Rival';

  // User finished with 0 points (actively tanked or point deduction)
  const historyWithZeroPts = {
    year: 2024,
    tier: 1,
    country: 'GER',
    pos: 17,
    pts: 0,
    wins: 0,
    draws: 0,
    losses: 34,
    gf: 600,
    ga: 1000,
    rivalName,
    rivalPts: 0,
    championshipDecider: false
  };

  const table = generateLeagueTable(
    { club: userClub } as any,
    ALL_CLUBS,
    1,
    historyWithZeroPts as any
  );

  for (const row of table) {
    assert.ok(row.pts >= 0, `Club ${row.name} must never have negative points (found ${row.pts})`);
    assert.ok(row.w >= 0, `Club ${row.name} must never have negative wins (found ${row.w})`);
    assert.ok(row.d >= 0, `Club ${row.name} must never have negative draws (found ${row.d})`);
    assert.ok(row.l >= 0, `Club ${row.name} must never have negative losses (found ${row.l})`);
  }

  console.log('✓ Test 3 Passed: Clamped points and wins strictly prevent negative underflows when user has 0 points.');
}

// ============================================================================
// TEST 4: AI Final Standings Desync Resolution
// ============================================================================
{
  console.log('\nTest 4: AI lastSeasonPos synchronization with visual divisionTables...');
  const userClub: Club = { ...ALL_CLUBS[0], id: 1001, name: 'User HC', tier: 1, country: 'GER', baseOvr: 75 };

  // Create mock division tables for Tier 1 where visual position differs from raw OVR ranking
  const gerTier1Clubs = ALL_CLUBS.filter(c => c.tier === 1 && c.country === 'GER' && c.id !== userClub.id);
  assert.ok(gerTier1Clubs.length >= 3, 'Must have at least 3 AI clubs for test');

  // Deliberately place a lower OVR club at position 1 in the division table
  const underdogClub = gerTier1Clubs[gerTier1Clubs.length - 1]; // lowest OVR
  const favoriteClub = gerTier1Clubs[0]; // highest OVR

  const mockDivisionTables: Record<number, any[]> = {
    1: [
      { id: underdogClub.id, name: underdogClub.name, pos: 1, pts: 60, statusMarker: 'C' },
      { id: userClub.id, name: userClub.name, pos: 2, pts: 58 },
      { id: favoriteClub.id, name: favoriteClub.name, pos: 3, pts: 56 },
      ...gerTier1Clubs.slice(1, -1).map((c, i) => ({ id: c.id, name: c.name, pos: i + 4, pts: 50 - i }))
    ]
  };

  const result = simulateGlobalLeagues(
    {},
    userClub,
    1,
    2025,
    2,
    undefined,
    mockDivisionTables[1],
    mockDivisionTables
  );

  const updatedUnderdog = result.newWorldClubs[underdogClub.id];
  const updatedFavorite = result.newWorldClubs[favoriteClub.id];

  assert.strictEqual(
    updatedUnderdog?.lastSeasonPos,
    1,
    `Underdog club must record lastSeasonPos = 1 matching the division table (was ${updatedUnderdog?.lastSeasonPos})`
  );
  assert.strictEqual(
    updatedFavorite?.lastSeasonPos,
    3,
    `Favorite club must record lastSeasonPos = 3 matching the division table (was ${updatedFavorite?.lastSeasonPos})`
  );

  console.log('✓ Test 4 Passed: AI lastSeasonPos dynamically synced with visual division tables, resolving standing desyncs.');
}

// ============================================================================
// TEST 5: Duplicate Promotion/Relegation Event Spam Prevention (Playoff Override)
// ============================================================================
{
  console.log('\nTest 5: Duplicate Promotion/Relegation Event Spam Prevention with playoffOverride...');
  const userClubPromoted: Club = { ...ALL_CLUBS[0], id: 9999, name: 'Promoted User HC', tier: 1, country: 'GER', baseOvr: 75 };
  
  // Case A: With playoffOverride active, simulateGlobalLeagues should NOT push duplicate user promo/releg movement
  const resultWithOverride = simulateGlobalLeagues(
    {},
    userClubPromoted, // tier is now 1
    2, // playedTier was 2
    2025,
    3,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    { oldTier: 2, newTier: 1, userWon: true, active: true } // playoffOverride active
  );

  const userPromoMovements = resultWithOverride.movements.filter(
    m => String(m.clubId) === String(userClubPromoted.id) && (m.type === 'promotion' || m.type === 'relegation')
  );
  assert.strictEqual(
    userPromoMovements.length,
    0,
    'simulateGlobalLeagues must NOT push duplicate user promotion movement when playoffOverride is provided'
  );

  // Case B: Without playoffOverride, normal direct league promotion pushes the movement
  const resultWithoutOverride = simulateGlobalLeagues(
    {},
    userClubPromoted,
    2, // playedTier was 2
    2025,
    1 // won league direct promotion
  );

  const directUserPromoMovements = resultWithoutOverride.movements.filter(
    m => String(m.clubId) === String(userClubPromoted.id) && m.type === 'promotion'
  );
  assert.strictEqual(
    directUserPromoMovements.length,
    1,
    'simulateGlobalLeagues must push user promotion movement when playoffOverride is not present'
  );

  console.log('✓ Test 5 Passed: Playoff override strictly suppresses duplicate promotion/relegation movements.');
}

// ============================================================================
// TEST 6: Static Code Integrity Audit (Keydown, Playoff Guard, rPts Clamp)
// ============================================================================
{
  console.log('\nTest 6: Static Code Integrity Audit...');
  const dashboardSource = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
  assert.ok(
    !dashboardSource.includes('if (showWinterBreak)') && !dashboardSource.includes('showWinterBreak && setSimulationPhase'),
    'Dashboard.tsx keydown listener must NOT intercept showWinterBreak'
  );

  const leagueSimSource = fs.readFileSync('src/engine/leagueSimulation.ts', 'utf-8');
  assert.ok(
    leagueSimSource.includes('!playoffOverride?.active'),
    'leagueSimulation.ts must guard user promo/relegation with !playoffOverride?.active'
  );

  const tableGenSource = fs.readFileSync('src/utils/leagueTableGenerator.ts', 'utf-8');
  assert.ok(
    tableGenSource.includes('rPts = Math.max(0, rPts);'),
    'leagueTableGenerator.ts must clamp rPts = Math.max(0, rPts); before win/draw calculation'
  );

  console.log('✓ Test 6 Passed: Code integrity checks validated for keydown, playoffOverride, and rPts clamping.');
}

console.log('\n=============================================');
console.log('All Universe Integrity & Underflow Tests Passed Successfully!');
console.log('=============================================\n');


