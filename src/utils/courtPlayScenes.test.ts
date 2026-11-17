import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCourtPlayFrame, CourtSceneType } from './courtPlayScenes';

test('cycles through all 4 distinct handball cut scenes across a full loop', () => {
  const seen = new Set<CourtSceneType>();
  for (let i = 0; i < 40; i++) {
    const phase = i / 40;
    const frame = computeCourtPlayFrame('Balanced 6-0', phase);
    seen.add(frame.scene);

    assert.equal(frame.home.length, 7, 'home must always render 7 players');
    assert.equal(frame.away.length, 7, 'away must always render 7 players');
    assert.ok(Number.isFinite(frame.ballPos[0]) && Number.isFinite(frame.ballPos[1]), 'ball coordinates must be finite');
    assert.ok(Number.isFinite(frame.ballZ) && frame.ballZ >= 0, 'ball height must be finite and non-negative');

    for (const p of [...frame.home, ...frame.away]) {
      assert.ok(p.u >= -1 && p.u <= 1, `player u=${p.u} out of bounds`);
      assert.ok(p.v >= -1 && p.v <= 1, `player v=${p.v} out of bounds`);
      assert.ok(p.z >= 0 && p.z <= 1, `player z=${p.z} out of bounds`);
      assert.ok(p.armRaise >= 0 && p.armRaise <= 1, `armRaise=${p.armRaise} out of bounds`);
    }
  }

  assert.deepEqual(
    Array.from(seen).sort(),
    ['counter_transition', 'fast_break', 'goal_celebration', 'set_play']
  );
});

test('goal celebration scene elevates teammates with raised arms and celebration intensity', () => {
  const frame = computeCourtPlayFrame('Fast Break', 0.34);
  assert.equal(frame.scene, 'goal_celebration');
  assert.ok(frame.celebrationIntensity > 0.3, 'celebrationIntensity must be elevated during goal celebration');

  const raisedCount = frame.home.filter((p) => p.armRaise >= 0.75).length;
  assert.ok(raisedCount >= 5, `expected celebrating teammates with raised arms, got ${raisedCount}`);
  assert.ok(frame.ballPos[0] > 0.9, `ball should start inside right goal net, got u=${frame.ballPos[0]}`);
});

test('fast break scene launches full-court sprint from defense into attacking goal zone', () => {
  const start = computeCourtPlayFrame('Balanced 6-0', 0.73);
  const end = computeCourtPlayFrame('Balanced 6-0', 0.99);

  assert.equal(start.scene, 'fast_break');
  assert.equal(end.scene, 'fast_break');
  // Right wing (index 5) sprints from deep own half (-0.7 range) into opponent goal mouth (+0.7 range)
  assert.ok(start.home[5].u < -0.3, `wing should start sprint in own half, got u=${start.home[5].u}`);
  assert.ok(end.home[5].u > 0.55, `wing should finish breakaway near 6m crease, got u=${end.home[5].u}`);
  assert.ok(end.ballPos[0] > 0.9, `breakaway shot should reach goal mouth, got u=${end.ballPos[0]}`);
});

test('counter transition pushes play into left defensive half', () => {
  const midCounter = computeCourtPlayFrame('3-2-1', 0.65);
  assert.equal(midCounter.scene, 'counter_transition');
  assert.ok(midCounter.ballPos[0] < -0.25, `counter attack must drive ball toward left goal, got u=${midCounter.ballPos[0]}`);
});
