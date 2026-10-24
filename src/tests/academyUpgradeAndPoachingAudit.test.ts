import assert from 'node:assert';
import { useGameStore } from '../store/useGameStore';
import { ALL_CLUBS } from '../data/clubsData';
import { YouthProspect } from '../types';

console.log('--- RUNNING ACADEMY UPGRADE & YOUTH RETENTION AUDIT ---');

// ============================================================================
// TEST 1: Facility Upgrade Allotment (Double Upgrade Allowed) & Prospect Potential Elevation
// ============================================================================
{
  console.log('\nRunning Test 1: Youth Academy double upgrade & enrolled prospect potential elevation...');
  const store = useGameStore.getState();
  store.resetGame();

  const initialProspects: YouthProspect[] = [
    { id: 'yp_init_1', name: 'Talent One', age: 16, position: 'CB', boost: 2, timer: 2, type: 'local', isProtected: false },
    { id: 'yp_init_2', name: 'Talent Two', age: 15, position: 'LB', boost: 1, timer: 3, type: 'local', isProtected: false }
  ];

  useGameStore.setState({
    budget: 5000000,
    club: {
      ...ALL_CLUBS[0],
      stadium: 3000,
      academyLevel: 2,
      medicalLevel: 1,
      tier: 1,
      country: 'GER'
    },
    facilitiesUpgradedThisSeason: 0,
    infraActionsThisSeason: 0,
    academyUpgradedThisSeason: 0,
    medicalUpgradedThisSeason: 0,
    youthScoutsThisSeason: 4,
    youthPipeline: [...initialProspects]
  });

  // Upgrade academy first time (Lvl 2 -> Lvl 3, using 1st crane)
  useGameStore.getState().upgradeFacility('academy', 600000);
  let state = useGameStore.getState();
  assert.strictEqual(state.club.academyLevel, 3, 'Academy level should be 3');
  assert.strictEqual(state.infraActionsThisSeason, 1, 'infraActionsThisSeason should be 1');
  assert.strictEqual(state.youthPipeline[0].boost, 3, 'Talent One boost should elevate from 2 to 3 under Level 3 academy');
  assert.strictEqual(state.youthPipeline[1].boost, 2, 'Talent Two boost should elevate from 1 to 2 under Level 3 academy');

  // Upgrade academy second time (Lvl 3 -> Lvl 4, with new season permit)
  useGameStore.setState({ academyUpgradedThisSeason: 0 });
  useGameStore.getState().upgradeFacility('academy', 800000);
  state = useGameStore.getState();
  assert.strictEqual(state.club.academyLevel, 4, 'Academy level should be 4');
  assert.strictEqual(state.infraActionsThisSeason, 2, 'infraActionsThisSeason should be 2 (both cranes used)');
  assert.strictEqual(state.youthPipeline[0].boost, 4, 'Talent One boost should elevate from 3 to 4 under Level 4 academy');
  assert.strictEqual(state.youthPipeline[1].boost, 3, 'Talent Two boost should elevate from 2 to 3 under Level 4 academy');

  console.log('✓ Test 1 Passed: Double academy upgrade executed seamlessly using both cranes, and existing enrolled prospects automatically elevated (+1 OVR potential per upgrade).');
}

// ============================================================================
// TEST 2: Cohort Poaching Cap (Max 1 per season, never wiping 3-4 talents to 0)
// ============================================================================
{
  console.log('\nRunning Test 2: Cohort poaching cap (max 1 per season)...');
  const store = useGameStore.getState();
  store.resetGame();

  const mockCohort: YouthProspect[] = [
    { id: 'yp_1', name: 'Prospect Alpha', age: 16, position: 'CB', boost: 2, timer: 2, type: 'local', isProtected: false },
    { id: 'yp_2', name: 'Prospect Beta', age: 15, position: 'GK', boost: 2, timer: 3, type: 'local', isProtected: false },
    { id: 'yp_3', name: 'Prospect Gamma', age: 16, position: 'RW', boost: 3, timer: 2, type: 'top_prospect', isProtected: false },
    { id: 'yp_4', name: 'Prospect Delta', age: 17, position: 'LB', boost: 1, timer: 1, type: 'local', isProtected: false }
  ];

  useGameStore.setState({
    budget: 1000000,
    club: {
      ...ALL_CLUBS[0],
      tier: 4, // Low tier with high poaching pressure
      academyLevel: 2,
      baseOvr: 60
    },
    youthPipeline: [...mockCohort]
  });

  const simResult = useGameStore.getState().simulateSeason();
  const stateAfterSim = useGameStore.getState();
  const pipelineAfter = stateAfterSim.youthPipeline || [];
  const departed = simResult.departedYouths || [];

  assert(pipelineAfter.length >= 3, `Cohort must retain at least 3 of 4 prospects (max 1 poached), got ${pipelineAfter.length}`);
  assert(departed.length <= 1, `At most 1 prospect can be poached per season, got ${departed.length}`);

  console.log(`✓ Test 2 Passed: Retained ${pipelineAfter.length}/4 prospects. Departed: ${departed.length}/4 (strictly <= 1).`);
}

// ============================================================================
// TEST 3: Level 5 Academy Permanent Immunity (Zero Poaching)
// ============================================================================
{
  console.log('\nRunning Test 3: Level 5 Academy permanent dynasty immunity...');
  const store = useGameStore.getState();
  store.resetGame();

  const mockStarCohort: YouthProspect[] = [
    { id: 'yp_star1', name: 'Wonderkid A', age: 16, position: 'CB', boost: 4, timer: 2, type: 'generational', isProtected: false },
    { id: 'yp_star2', name: 'Wonderkid B', age: 15, position: 'GK', boost: 5, timer: 3, type: 'generational', isProtected: false },
    { id: 'yp_star3', name: 'Wonderkid C', age: 16, position: 'RW', boost: 3, timer: 2, type: 'top_prospect', isProtected: false }
  ];

  useGameStore.setState({
    budget: 1000000,
    club: {
      ...ALL_CLUBS[0],
      tier: 4,
      academyLevel: 5, // Max level incubator
      baseOvr: 70
    },
    youthPipeline: [...mockStarCohort]
  });

  const simResultLvl5 = useGameStore.getState().simulateSeason();
  const stateAfterLvl5 = useGameStore.getState();
  const departedLvl5 = simResultLvl5.departedYouths || [];

  assert.strictEqual(departedLvl5.length, 0, 'Level 5 academy must have 0 poached prospects');
  assert.strictEqual((stateAfterLvl5.youthPipeline || []).length, 3, 'Level 5 academy must retain 100% of prospects');

  console.log('✓ Test 3 Passed: Level 5 academy has 100% permanent dynasty protection against poaching.');
}

console.log('\n========================================================================');
console.log('ALL ACADEMY UPGRADE & YOUTH RETENTION AUDIT TESTS PASSED (3/3)');
console.log('========================================================================');
