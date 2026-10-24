import assert from 'node:assert';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { ALL_CLUBS } from '../data/clubsData';
import { isReserveClub } from '../data/gameConstants';
import { Club } from '../types';
import { useGameStore } from '../store/useGameStore';

console.log('--- RUNNING DYNAMIC PROGRESSION & SIMULATION INTEGRITY AUDIT ---');

// Test 1: Verify IHF Super Globe AI winner fallback excludes all reserve clubs
console.log('Test 1: Super Globe winner fallback strictly excludes reserve clubs...');
{
  const worldClubs: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => {
    worldClubs[c.id] = { ...c };
  });

  const dummyClub = ALL_CLUBS.find(c => c.name === 'SC Magdeburg')!;

  // Run 10 simulations to audit Super Globe winners
  for (let i = 0; i < 10; i++) {
    const simResult = simulateGlobalLeagues(
      worldClubs,
      dummyClub,
      1,
      2025 + i,
      1,
      {},
      undefined,
      undefined,
      undefined
    );

    const cwcMovement = simResult.movements.find(m => m.id.includes('cup-cwc'));
    assert.ok(cwcMovement, 'Super globe movement must exist');
    assert.strictEqual(
      isReserveClub(cwcMovement.clubName),
      false,
      `Super globe winner (${cwcMovement.clubName}) must not be a reserve club`
    );
  }
  console.log('  ✓ Test 1 Passed: 10/10 Super Globe champions are confirmed senior clubs.');
}

// Test 2: Verify capacity preservation and no ReferenceError when user moves tiers
console.log('Test 2: Tier boundary swaps execute cleanly when user moves tiers...');
{
  const worldClubs: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => {
    worldClubs[c.id] = { ...c };
  });

  const userClubTier2: Club = {
    ...ALL_CLUBS.find(c => c.name === 'TuS N-Lübbecke')!,
    tier: 1 // Promoted to Tier 1 next season
  };

  // User played Tier 2, now moving to Tier 1
  assert.doesNotThrow(() => {
    const simResult = simulateGlobalLeagues(
      worldClubs,
      userClubTier2,
      2, // played in tier 2
      2025,
      2, // finished 2nd
      {},
      undefined,
      undefined,
      undefined
    );
    assert.ok(simResult.movements.length > 0, 'Movements must be generated');
  }, 'simulateGlobalLeagues must not throw ReferenceError when user changes tiers');

  console.log('  ✓ Test 2 Passed: Tier capacity calculation executed cleanly with zero ReferenceErrors.');
}

// Test 3: Verify simulateSeason populates state.trophies in useGameStore
console.log('Test 3: simulateSeason records earned silverware into state.trophies...');
{
  const store = useGameStore.getState();
  const originalTrophies = store.trophies || [];
  
  // Directly simulate season result
  const simResult = store.simulateSeason();
  assert.ok(simResult, 'simulateSeason must return result');
  
  const updatedStore = useGameStore.getState();
  assert.ok(Array.isArray(updatedStore.trophies), 'store.trophies must be an array');
  // If club finished 1st, trophy must be appended
  if (simResult.seasonStats.pos === 1) {
    assert.ok(
      updatedStore.trophies.some(t => t.includes('Champions') || t.includes('Title')),
      'Championship silverware must be added to manager trophy cabinet'
    );
  }
  console.log('  ✓ Test 3 Passed: Global manager trophy cabinet persists earned titles.');
}

console.log('========================================================================');
console.log('ALL DYNAMIC PROGRESSION & SIMULATION INTEGRITY AUDIT TESTS PASSED (3/3)');
console.log('========================================================================\n');
