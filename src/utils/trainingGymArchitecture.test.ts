import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrainingGymModel, computeWarmupFrame } from './trainingGymArchitecture';
import { resolveArenaColorScheme } from './courtsideStats';

test('buildTrainingGymModel scales warmup runner count with squad size and respects court design', () => {
  const clubColors = resolveArenaColorScheme('#CC1F2F', '#FFFFFF', '#1D4ED8', '#FFFFFF');
  const smallSquad = buildTrainingGymModel({
    squadSize: 13,
    morale: 65,
    tactic: 'Balanced 6-0',
    designId: 'nordic_birch',
    clubColors,
  });
  const deepSquad = buildTrainingGymModel({
    squadSize: 22,
    morale: 92,
    tactic: 'Fast-Break',
    designId: 'championship_taraflex',
    clubColors,
  });

  assert.equal(smallSquad.design.id, 'nordic_birch');
  assert.equal(deepSquad.design.id, 'championship_taraflex');
  assert.ok(deepSquad.runnerCount > smallSquad.runnerCount);
  assert.ok(deepSquad.tempoFactor > smallSquad.tempoFactor);
  assert.equal(deepSquad.conePositions.length, 10);
});

test('computeWarmupFrame keeps all runners and balls within 40x20m court and traverses end-to-end', () => {
  let minFieldU = 1;
  let maxFieldU = -1;

  for (let step = 0; step < 50; step++) {
    const phase = step / 50;
    const frame = computeWarmupFrame(phase, 12);
    // 12 field runners + 2 goalkeepers = 14 athletes
    assert.equal(frame.runners.length, 14);
    assert.ok(frame.balls.length >= 1);

    for (const r of frame.runners) {
      assert.ok(r.u >= -0.95 && r.u <= 0.95, `Runner u out of bounds: ${r.u}`);
      assert.ok(r.v >= -0.9 && r.v <= 0.9, `Runner v out of bounds: ${r.v}`);
      assert.ok(r.strideZ >= 0 && r.strideZ <= 0.1, `Runner strideZ invalid: ${r.strideZ}`);
      if (!r.isGK && r.id === 0) {
        minFieldU = Math.min(minFieldU, r.u);
        maxFieldU = Math.max(maxFieldU, r.u);
      }
    }

    for (const b of frame.balls) {
      assert.ok(b.u >= -0.95 && b.u <= 0.95);
      assert.ok(b.v >= -0.9 && b.v <= 0.9);
      assert.ok(b.z > 0.2);
    }
  }

  assert.ok(minFieldU < -0.55, `Expected runners to reach left court end, got ${minFieldU}`);
  assert.ok(maxFieldU > 0.55, `Expected runners to reach right court end, got ${maxFieldU}`);
});
