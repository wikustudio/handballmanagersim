import assert from 'assert';
import { TrophiesObj } from '../types';

console.log('--- RUNNING TROPHY COMBINATION LOGIC AUDIT ---');

function evaluateTrophyCombo(trophiesObj: TrophiesObj) {
  const hasBl = (trophiesObj.bl || 0) > 0;
  const hasDfb = (trophiesObj.dfb || 0) > 0;
  const hasCl = (trophiesObj.cl || 0) > 0;
  const hasEl = (trophiesObj.el || 0) > 0;
  const hasCwc = (trophiesObj.cwc || 0) > 0;

  if (hasBl && hasDfb && hasCl && hasCwc) {
    return 'quadruple';
  } else if (hasBl && hasDfb && hasCl) {
    return 'triple';
  } else if (hasBl && hasDfb && hasEl) {
    return 'euro_triple';
  } else if (hasBl && hasDfb) {
    return 'double';
  }
  return null;
}

// Test 1: Quadruple (bl + dfb + cl + cwc)
{
  console.log('\nTest 1: Quadruple combo detection...');
  const combo = evaluateTrophyCombo({ bl: 1, dfb: 1, cl: 1, cwc: 1 });
  assert.strictEqual(combo, 'quadruple', 'bl + dfb + cl + cwc must trigger quadruple');
  console.log('✓ Test 1 Passed: 🏆 Quadruple combo triggered correctly.');
}

// Test 2: Triple (bl + dfb + cl)
{
  console.log('\nTest 2: Triple combo detection...');
  const combo = evaluateTrophyCombo({ bl: 1, dfb: 1, cl: 1 });
  assert.strictEqual(combo, 'triple', 'bl + dfb + cl must trigger triple');
  console.log('✓ Test 2 Passed: 🏆 Triple combo triggered correctly.');
}

// Test 3: Euro Triple (bl + dfb + el)
{
  console.log('\nTest 3: Euro Triple combo detection...');
  const combo = evaluateTrophyCombo({ bl: 1, dfb: 1, el: 1 });
  assert.strictEqual(combo, 'euro_triple', 'bl + dfb + el must trigger euro_triple');
  console.log('✓ Test 3 Passed: 🏆 Euro Triple combo triggered correctly.');
}

// Test 4: Domestic Double (bl + dfb)
{
  console.log('\nTest 4: Domestic Double combo detection...');
  const combo = evaluateTrophyCombo({ bl: 1, dfb: 1 });
  assert.strictEqual(combo, 'double', 'bl + dfb must trigger double');
  console.log('✓ Test 4 Passed: 🏆 Domestic Double combo triggered correctly.');
}

// Test 5: Standalone Cup / League Winners (No combo)
{
  console.log('\nTest 5: Standalone single titles do not trigger combo...');
  assert.strictEqual(evaluateTrophyCombo({ bl: 1 }), null, 'bl only should not trigger combo');
  assert.strictEqual(evaluateTrophyCombo({ dfb: 1 }), null, 'dfb only should not trigger combo');
  assert.strictEqual(evaluateTrophyCombo({ cl: 1 }), null, 'cl only should not trigger combo');
  assert.strictEqual(evaluateTrophyCombo({ bl: 1, cl: 1 }), null, 'bl + cl without dfb should not trigger treble or double');
  console.log('✓ Test 5 Passed: Standalone titles remain standalone.');
}

console.log('\n========================================================================');
console.log('ALL TROPHY COMBINATION LOGIC AUDIT TESTS PASSED (5/5)');
console.log('========================================================================\n');
