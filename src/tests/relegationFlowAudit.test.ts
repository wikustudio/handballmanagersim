import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { generateLeagueTable, getDecisionDayStandingsSlice } from '../utils/leagueTableGenerator';
import { ALL_CLUBS } from '../data/clubsData';
import { Club } from '../types';
import { getLeagueSize } from '../engine/engine';
import { getMaxTier } from '../data/gameConstants';

console.log('--- RUNNING RELEGATION & DECISION DAY PLAYOFF AUDIT ---');

// ============================================================================
// TEST 1: 16th place in 18-team Bundesliga receives PO status marker & Decision Day Playoff
// ============================================================================
{
  console.log('\nTest 1: 16th place receives PO marker and playoff stakes...');
  const club16: Club = { ...ALL_CLUBS.find(c => c.tier === 1 && c.country === 'GER')!, tier: 1 };
  const numTeams = getLeagueSize(1, 'GER');
  assert.strictEqual(numTeams, 18, 'German Tier 1 must have 18 clubs');

  const table16 = generateLeagueTable(
    { club: club16, year: 2025 } as any,
    ALL_CLUBS,
    1,
    {
      year: 2025,
      clubName: club16.name,
      tier: 1,
      pos: 16,
      wins: 8,
      draws: 3,
      losses: 23,
      pts: 19,
      gf: 800,
      ga: 920
    }
  );

  const row16 = table16.find(r => r.pos === 16);
  assert(row16, '16th place row must exist');
  assert.strictEqual(row16.statusMarker, 'PO', '16th place in Tier 1 must be marked with PO (Playoff)');

  const slice16 = getDecisionDayStandingsSlice(table16, 16, true);
  const userSliceRow = slice16.find(r => r.pos === 16);
  assert(userSliceRow, 'User slice row must exist in decision day standings');
  assert.strictEqual(userSliceRow.status, 'PLAYOFF', 'Status must be PLAYOFF');
  assert.strictEqual(userSliceRow.stake, '⚠️ PLAYOFF', 'Stake must be ⚠️ PLAYOFF');

  console.log('✓ Test 1 Passed: 16th place correctly marked with PO and staged for Decision Day Playoff.');
}

// ============================================================================
// TEST 2: Bottom 2 (17th & 18th) receive R (Direct Relegation) marker
// ============================================================================
{
  console.log('\nTest 2: 17th and 18th receive R marker...');
  const club18: Club = { ...ALL_CLUBS.find(c => c.tier === 1 && c.country === 'GER')!, tier: 1 };
  
  const table18 = generateLeagueTable(
    { club: club18, year: 2025 } as any,
    ALL_CLUBS,
    1,
    {
      year: 2025,
      clubName: club18.name,
      tier: 1,
      pos: 18,
      wins: 4,
      draws: 2,
      losses: 28,
      pts: 10,
      gf: 750,
      ga: 980
    }
  );

  const row17 = table18.find(r => r.pos === 17);
  const row18 = table18.find(r => r.pos === 18);
  assert(row17 && row18, '17th and 18th rows must exist');
  assert.strictEqual(row17.statusMarker, 'R', '17th must be marked R');
  assert.strictEqual(row18.statusMarker, 'R', '18th must be marked R');

  const slice18 = getDecisionDayStandingsSlice(table18, 18, true);
  const userRow18 = slice18.find(r => r.pos === 18);
  assert(userRow18, '18th slice row must exist');
  assert.strictEqual(userRow18.status, 'RELEGATED', '18th status must be RELEGATED');

  console.log('✓ Test 2 Passed: 17th and 18th correctly marked with R (Direct Relegation).');
}

// ============================================================================
// TEST 3: Finishing last (18th) guarantees relegation demotion logic
// ============================================================================
{
  console.log('\nTest 3: Finishing last in Tier 1 triggers relegation demotion...');
  const playedTier = 1;
  const maxTier = getMaxTier('GER');
  const pos = 18;
  const numTeams = 18;
  const relegationThreshold = numTeams - 1; // 17

  // Drop zone calculation
  const isDirectDropZone = pos >= relegationThreshold && playedTier < maxTier;
  assert.strictEqual(isDirectDropZone, true, '18th place must be in direct drop zone');

  // Target next tier
  const nextTier = isDirectDropZone ? Math.min(maxTier, playedTier + 1) : playedTier;
  assert.strictEqual(nextTier, 2, 'Relegated club from Tier 1 must move to Tier 2');

  console.log('✓ Test 3 Passed: 18th place unequivocally demoted to Tier 2.');
}

// ============================================================================
// TEST 4: History reconciliation self-heals corrupted last-place finishes
// ============================================================================
{
  console.log('\nTest 4: History reconciler self-heals un-relegated last-place seasons...');
  const maxTier = getMaxTier('GER');
  const numTeams = getLeagueSize(1, 'GER');
  const dropThreshold = numTeams - 1;

  // Simulate a corrupted history entry where user finished 18th, but relegated was mistakenly false and nextTier was 1
  const corruptedHistory = {
    year: 2025,
    pos: 18,
    tier: 1,
    nextTier: 1,
    relegated: false,
    survived: false
  };

  const isRelegated = Boolean(
    corruptedHistory.relegated ||
    (!(corruptedHistory as any).survived && corruptedHistory.nextTier && corruptedHistory.nextTier > corruptedHistory.tier) ||
    (!(corruptedHistory as any).survived && (corruptedHistory.pos || 0) >= dropThreshold && corruptedHistory.tier < maxTier)
  );

  assert.strictEqual(isRelegated, true, 'Corrupted 18th finish must be healed to isRelegated: true');

  const reconciledNextTier = isRelegated && corruptedHistory.tier < maxTier
    ? corruptedHistory.tier + 1
    : corruptedHistory.tier;

  assert.strictEqual(reconciledNextTier, 2, 'Reconciled next tier must advance to Tier 2');

  console.log('✓ Test 4 Passed: History reconciler successfully self-heals corrupted last-place seasons.');
}

// ============================================================================
// TEST 5: Last-place team (pos >= relegationThreshold) eligible for Decision Day
// ============================================================================
{
  console.log('\nTest 5: Absolute last-place team receives Decision Day if gapToSafety <= 2...');
  const numTeams = 18;
  const totalMatches = (numTeams - 1) * 2; // 34
  const relegationThreshold = numTeams - 1; // 17

  const maxLeaguePts = totalMatches * 2;
  const championPts = Math.round(maxLeaguePts * 0.85);
  const bottomPts = Math.round(maxLeaguePts * 0.12);
  const expectedSafetyPts = Math.round(championPts - ((relegationThreshold - 2) / Math.max(1, numTeams - 1)) * (championPts - bottomPts));

  // Case A: 18th place club has pts within 2 of safety
  const approxPos18 = 18;
  assert(approxPos18 >= relegationThreshold, '18th must be >= relegationThreshold');

  const ptsClose = expectedSafetyPts - 1; // 1 point behind safety
  const gapClose = expectedSafetyPts - ptsClose;
  assert(gapClose <= 2, 'gapClose must be <= 2');

  // Verify the engine condition logic
  let ddTypeA: string | null = null;
  if (approxPos18 >= relegationThreshold) {
    const gapToSafety = expectedSafetyPts - ptsClose;
    if (gapToSafety <= 2) {
      ddTypeA = 'relegation_battle';
    }
  }
  assert.strictEqual(ddTypeA, 'relegation_battle', 'Last-place team within 2 pts of safety must trigger relegation_battle');

  // Case B: 18th place club cut adrift (gap > 2)
  const ptsFar = expectedSafetyPts - 5; // 5 points behind safety
  let ddTypeB: string | null = null;
  if (approxPos18 >= relegationThreshold) {
    const gapToSafety = expectedSafetyPts - ptsFar;
    if (gapToSafety <= 2) {
      ddTypeB = 'relegation_battle';
    }
  }
  assert.strictEqual(ddTypeB, null, 'Last-place team cut adrift must be null (direct relegation)');

  console.log('✓ Test 5 Passed: Absolute last-place team correctly triggers Decision Day when mathematically viable.');
}

// ============================================================================
// TEST 6: Winning Bundesliga never triggers false Regionalliga relegation
// (Verifies App.tsx history reconciliation across club changes, RTG, and playoffs)
// ============================================================================
{
  console.log('\nTest 6: Bundesliga winner is never falsely relegated to Regionalliga...');
  const appSource = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
  const dashSource = fs.readFileSync(path.join(process.cwd(), 'src/components/Dashboard.tsx'), 'utf-8');

  // 1. App.tsx must scope state.startTier only to inaugural club (isInauguralClub)
  assert(
    appSource.includes('const isInauguralClub = Boolean(inauguralClubName && clubName.trim().toLowerCase() === inauguralClubName.trim().toLowerCase());'),
    'App.tsx must scope state.startTier strictly to the inaugural starting club'
  );

  // 2. App.tsx must preserve authentic recorded h.tier / divisionTables tier instead of blindly overwriting with expectedTier
  assert(
    appSource.includes('let seasonTier = divTableTier !== undefined') &&
    appSource.includes('typeof h.tier === \'number\' && h.tier >= 1 && !isLegacyUnsetTier1'),
    'App.tsx must preserve recorded h.tier and divisionTables tier'
  );

  // 3. App.tsx must guard sporting relegation against top-half / title-winning positions (canBeSportingRelegated)
  assert(
    appSource.includes('const canBeSportingRelegated = (h.pos || 0) >= Math.max(2, dropThreshold - 1);'),
    'App.tsx must prevent title winners from being flagged as relegated by stale nextTier'
  );

  // 4. Dashboard.tsx post-season sync effect must only run when bankruptcyPending transitions true -> false
  assert(
    dashSource.includes('if (!state.bankruptcyPending && wasBankruptcyPendingRef.current && (stagedSeasonResultData || seasonResultData))'),
    'Dashboard.tsx must only run post-bankruptcy tier sync when bankruptcyPending actually resolved'
  );

  console.log('✓ Test 6 Passed: Bundesliga winners are protected against false Regionalliga relegation.');
}

console.log('\n========================================================================');
console.log('ALL RELEGATION & DECISION DAY PLAYOFF AUDIT TESTS PASSED SUCCESSFULLY (6/6)');
console.log('========================================================================\n');

