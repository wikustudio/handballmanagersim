import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { useGameStore } from '../store/useGameStore';
import { calculateProbabilisticSeason } from '../engine/engine';
import { ALL_CLUBS } from '../data/clubsData';

console.log('========================================================================');
console.log('RUNNING MANAGER SKILLS, OVERLAY SYNC & YOUTH SLOT AUDIT TESTS');
console.log('========================================================================');

// ----------------------------------------------------------------------------
// TEST 1: Free School Trialist Not Blocked By Paid Scouting Quota
// ----------------------------------------------------------------------------
{
  console.log('\nRunning Test 1: Free school trialist recruitment when paid scouting quota is full...');
  const store = useGameStore.getState();
  store.resetGame();
  const baseClub = ALL_CLUBS.find(c => c.tier === 3) || ALL_CLUBS[0];
  useGameStore.getState().updateState({
    club: { ...baseClub, tier: 3, academyLevel: 1, country: 'GER' },
    budget: 500000,
    youthPipeline: [],
    youthScoutsThisSeason: 1, // Full paid scouting quota for Level 1 academy (1/1)
    schoolTrialistsThisSeason: 0,
  });

  // Normal paid scout should be blocked
  const paidRes = useGameStore.getState().recruitYouth(15000);
  assert.strictEqual(paidRes.success, false, 'Paid scout should be blocked when youthScoutsThisSeason >= academyLevel');

  // Free school trialist should succeed despite paid scouting quota being full
  const trialistRes = useGameStore.getState().recruitYouth(0, {
    id: 'trialist_1',
    name: 'Lukas Trialist',
    age: 16,
    position: 'CB',
    boost: 1,
    timer: 2,
    type: 'local',
    isTrialist: true,
  });
  assert.strictEqual(trialistRes.success, true, 'Free school trialist must NOT be blocked by paid scouting quota');
  assert.strictEqual(useGameStore.getState().schoolTrialistsThisSeason, 1, 'schoolTrialistsThisSeason should increment to 1');
  assert.strictEqual(useGameStore.getState().youthScoutsThisSeason, 1, 'youthScoutsThisSeason should remain 1');
  console.log('✓ Test 1 Passed: Free school trialist bypasses paid scouting network quota cleanly.');
}

// ----------------------------------------------------------------------------
// TEST 2: Untouchable Skill Prevents False Sacking Toasts & Preserves Tenure
// ----------------------------------------------------------------------------
{
  console.log('\nRunning Test 2: Untouchable skill prevents false sacking toast & preserves tenure...');
  const store = useGameStore.getState();
  store.resetGame();
  const tier1Club = ALL_CLUBS.find(c => c.tier === 1 && c.country === 'GER') || ALL_CLUBS[0];
  useGameStore.getState().updateState({
    club: { ...tier1Club, tier: 1, country: 'GER', baseOvr: 70 },
    managerSkills: ['untouchable'],
    immunityShields: 0,
    tenureYears: 4,
    clubImpactScore: 20,
    history: [
      {
        year: 2024,
        clubName: tier1Club.name,
        tier: 1,
        nextTier: 2,
        relegated: true,
        promoted: false,
        pos: 18,
        pts: 8,
        wins: 4,
        draws: 0,
        losses: 30,
        gf: 700,
        ga: 900,
        ovr: 70,
        att: 2000,
      } as any,
    ],
  });

  // Test applyRelegationPenalty with untouchable and 0 shields
  const penaltyRes = useGameStore.getState().applyRelegationPenalty();
  assert.strictEqual(penaltyRes.isSacked, false, 'Untouchable manager must not be sacked by applyRelegationPenalty');
  assert.ok(
    !penaltyRes.toast?.message?.includes('You have been sacked!'),
    `Untouchable manager should not receive "You have been sacked!" toast, got: ${penaltyRes.toast?.message}`
  );
  assert.ok(
    penaltyRes.toast?.message?.includes('Untouchable Status'),
    'Untouchable manager should receive Untouchable Status toast'
  );

  // Test simulateSeason relegation with untouchable and 0 shields
  useGameStore.getState().updateState({
    club: { ...tier1Club, tier: 1, country: 'GER', baseOvr: 65 },
    managerSkills: ['untouchable'],
    immunityShields: 0,
    tenureYears: 4,
    clubImpactScore: 15,
    pendingSeasonState: {
      pos: 18,
      pts: 6,
      wins: 3,
      draws: 0,
      losses: 31,
      gf: 720,
      ga: 940,
    },
  });

  const simRes = useGameStore.getState().simulateSeason();
  const afterState = useGameStore.getState();
  assert.strictEqual(afterState.isSacked, false, 'Untouchable manager must not be sacked in simulateSeason');
  assert.strictEqual(afterState.tenureYears, 5, 'Untouchable manager tenure must increment instead of resetting to 0');
  assert.ok(
    !simRes.boardToast?.message?.includes('You have been sacked!'),
    `Untouchable manager boardToast must not say sacked, got: ${simRes.boardToast?.message}`
  );
  console.log('✓ Test 2 Passed: Untouchable skill prevents false sacking toast and preserves manager tenure.');
}

// ----------------------------------------------------------------------------
// TEST 3: Tactical Mastermind (+2 OVR in Matches) Applied in Engine
// ----------------------------------------------------------------------------
{
  console.log('\nRunning Test 3: tactical_mastermind (+2 OVR) boosts probabilistic season performance...');
  const testClub = { ...ALL_CLUBS[0], baseOvr: 78, medicalLevel: 1, academyLevel: 1 };
  let totalPtsWithout = 0;
  let totalPtsWith = 0;
  const iterations = 250;

  for (let i = 0; i < iterations; i++) {
    const resWithout = calculateProbabilisticSeason(testClub, 78, 1, 'Total Handball', 18, 80, {
      isUserClub: true,
      hasTacticalMastermind: false,
    });
    const resWith = calculateProbabilisticSeason(testClub, 78, 1, 'Total Handball', 18, 80, {
      isUserClub: true,
      hasTacticalMastermind: true,
    });
    totalPtsWithout += resWithout.pts;
    totalPtsWith += resWith.pts;
  }

  const avgWithout = totalPtsWithout / iterations;
  const avgWith = totalPtsWith / iterations;
  assert.ok(
    avgWith > avgWithout + 1.5,
    `Expected tactical_mastermind (+2 OVR) to yield significantly higher average points (With: ${avgWith.toFixed(2)}, Without: ${avgWithout.toFixed(2)})`
  );
  console.log(`✓ Test 3 Passed: tactical_mastermind increased avg points from ${avgWithout.toFixed(1)} to ${avgWith.toFixed(1)}.`);
}

// ----------------------------------------------------------------------------
// TEST 4: Generational Rebuild Preserves Loaned-Out Prospects
// ----------------------------------------------------------------------------
{
  console.log('\nRunning Test 4: executeGenerationalRebuild preserves loaned-out youth prospects...');
  const store = useGameStore.getState();
  store.resetGame();
  const eliteClub = ALL_CLUBS.find(c => c.tier === 1) || ALL_CLUBS[0];
  useGameStore.getState().updateState({
    year: 2030,
    lastGenerationalRebuildYear: 2020,
    club: { ...eliteClub, baseOvr: 88, squadSize: 18, academyLevel: 1, country: 'GER', tier: 1 },
    youthPipeline: [
      { id: 'loan_1', name: 'Loaned Star 1', age: 18, position: 'LB', boost: 3, timer: 1, type: 'top_prospect', isLoanedOut: true, loanReturnSeason: 2031 },
      { id: 'loan_2', name: 'Loaned Star 2', age: 18, position: 'RB', boost: 3, timer: 1, type: 'top_prospect', isLoanedOut: true, loanReturnSeason: 2031 },
      { id: 'active_1', name: 'Active Kid 1', age: 16, position: 'CB', boost: 2, timer: 2, type: 'local', isLoanedOut: false },
    ],
  });

  const rebuildRes = useGameStore.getState().executeGenerationalRebuild();
  assert.strictEqual(rebuildRes.success, true, 'Generational rebuild should succeed');
  const pipelineAfter = useGameStore.getState().youthPipeline;
  const loanedAfter = pipelineAfter.filter(p => p.isLoanedOut);
  const activeAfter = pipelineAfter.filter(p => !p.isLoanedOut);
  assert.strictEqual(loanedAfter.length, 2, 'Both loaned-out prospects must be preserved during generational rebuild');
  assert.strictEqual(activeAfter.length, 3, 'Level 1 academy (3 active slots) should hold 1 existing active prospect + 2 newly recruited rebuild wonderkids');
  console.log('✓ Test 4 Passed: Loaned-out youth prospects are preserved during Generational Rebuild.');
}

// ----------------------------------------------------------------------------
// TEST 5: SimulatingOverlay Merges worldClubs & Passes tacticTenure / hasTacticalMastermind
// ----------------------------------------------------------------------------
{
  console.log('\nRunning Test 5: SimulatingOverlay source verification for worldClubs merge & options...');
  const overlaySrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SimulatingOverlay.tsx'), 'utf-8');
  assert.ok(overlaySrc.includes('state?.worldClubs'), 'SimulatingOverlay must merge getActiveClubs() with state.worldClubs');
  assert.ok(overlaySrc.includes('tacticTenure: currentTacticTenure'), 'SimulatingOverlay must pass tacticTenure to calculateProbabilisticSeason');
  assert.ok(overlaySrc.includes('hasTacticalMastermind'), 'SimulatingOverlay must pass hasTacticalMastermind to calculateProbabilisticSeason');
  console.log('✓ Test 5 Passed: SimulatingOverlay merges worldClubs and passes full simulation options.');
}

console.log('\n========================================================================');
console.log('ALL MANAGER SKILLS, OVERLAY SYNC & YOUTH SLOT AUDIT TESTS PASSED (5/5)');
console.log('========================================================================');
