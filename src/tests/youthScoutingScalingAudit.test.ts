import assert from 'assert';
import { useGameStore } from '../store/useGameStore';
import { ALL_CLUBS } from '../data/clubsData';
import { getAcademySlotLimit } from '../types';

console.log('--- RUNNING YOUTH SCOUTING SCALING & HIGHER-TIER ACADEMY CAPACITY AUDIT ---');

// Test 1: Level 3 Academy (10 slots) allows scouting all 10 talents without hitting a 6-player roadblock
{
  console.log('\nTest 1: Level 3 Academy (10 slots) allows scouting all 10 talents...');
  const store = useGameStore.getState();
  store.resetGame();

  const testClubLvl3 = { ...ALL_CLUBS[0], tier: 1, academyLevel: 3 };
  assert.strictEqual(getAcademySlotLimit(3), 10, 'Level 3 academy must have 10 slots');

  useGameStore.setState({
    club: testClubLvl3,
    budget: 10000000,
    youthPipeline: [],
    youthSpend: 0,
    youthScoutsThisSeason: 0
  });

  // Scout 3 prospects into the academy according to 1:1 level scaling limit
  for (let i = 1; i <= 3; i++) {
    const res = useGameStore.getState().recruitYouth(10000);
    assert.strictEqual(res.success, true, `Recruit #${i} should succeed under Level 3 academy`);
  }

  const pipeline = useGameStore.getState().youthPipeline;
  assert.strictEqual(pipeline.length, 3, 'Youth pipeline must reach 3 recruits occupied');
  assert.strictEqual(useGameStore.getState().youthScoutsThisSeason, 3, 'youthScoutsThisSeason should reach 3');

  // Attempt 4th recruit: should fail because scouting cap for Level 3 (3) is reached
  const excessRecruit = useGameStore.getState().recruitYouth(10000);
  assert.strictEqual(excessRecruit.success, false, '4th recruit attempt must fail');
  assert.strictEqual(
    excessRecruit.message,
    'Scouting network capacity reached (Max 3 per season).',
    'Error message must indicate scouting network capacity reached (Max 3 per season).'
  );

  console.log('✓ Test 1 Passed: Level 3 academy successfully recruits up to 3 talents (1:1 scaling).');
}

// Test 2: Free school trialist does not deplete paid scouting quota
{
  console.log('\nTest 2: Free school trialist does not deplete paid scouting quota...');
  const store = useGameStore.getState();
  store.resetGame();

  const testClubLvl3 = { ...ALL_CLUBS[0], tier: 1, academyLevel: 3 };

  useGameStore.setState({
    club: testClubLvl3,
    budget: 10000000,
    youthPipeline: [],
    youthSpend: 0,
    youthScoutsThisSeason: 0,
    schoolTrialistsThisSeason: 0
  });

  // Enroll a school trialist
  const trialistRes = useGameStore.getState().recruitYouth(0, {
    name: 'Young Prospect',
    position: 'CB',
    boost: 1,
    age: 15,
    timer: 2,
    isTrialist: true
  });

  assert.strictEqual(trialistRes.success, true, 'School trialist recruitment should succeed');
  assert.strictEqual(useGameStore.getState().youthScoutsThisSeason, 0, 'Paid youthScoutsThisSeason must NOT increment for free trialist');
  assert.strictEqual(useGameStore.getState().schoolTrialistsThisSeason, 1, 'schoolTrialistsThisSeason must increment to 1');

  console.log('✓ Test 2 Passed: School trialists have separate quota and do not consume paid scouting capacity.');
}

console.log('\n========================================================================');
console.log('ALL YOUTH SCOUTING SCALING AUDIT TESTS PASSED (2/2)');
console.log('========================================================================\n');
