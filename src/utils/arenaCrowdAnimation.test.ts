import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFanAnimationPose, resolveSpectatorHeadColor } from './arenaCrowdAnimation';

test('empty seats and prefersReducedMotion produce zero crowd motion', () => {
  const emptyPose = computeFanAnimationPose({
    occupant: 'empty',
    standIndex: 0,
    tierIndex: 0,
    rowIndex: 0,
    colIndex: 4,
    totalCols: 28,
    timestampMs: 2400,
    scene: 'goal_celebration',
    cyclePhase: 0.35,
    celebrationIntensity: 1,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });
  assert.equal(emptyPose.dyNormalized, 0);
  assert.equal(emptyPose.armRaise, 0);
  assert.equal(emptyPose.holdingScarf, false);

  const reducedPose = computeFanAnimationPose({
    occupant: 'home_primary',
    standIndex: 1,
    tierIndex: 0,
    rowIndex: 0,
    colIndex: 6,
    totalCols: 20,
    timestampMs: 2400,
    scene: 'goal_celebration',
    cyclePhase: 0.35,
    celebrationIntensity: 1,
    isSimulatingLive: false,
    prefersReducedMotion: true,
  });
  assert.equal(reducedPose.dyNormalized, 0);
  assert.equal(reducedPose.swayXNormalized, 0);
  assert.equal(reducedPose.armRaise, 0);
  assert.equal(reducedPose.topDownPulse, 1);
});

test('home fans jump and raise arms during goal_celebration while away fans stay seated', () => {
  const homePose = computeFanAnimationPose({
    occupant: 'home_primary',
    standIndex: 1,
    tierIndex: 0,
    rowIndex: 0,
    colIndex: 5,
    totalCols: 18,
    timestampMs: 1350,
    scene: 'goal_celebration',
    cyclePhase: 0.34,
    celebrationIntensity: 0.95,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });

  const awayPose = computeFanAnimationPose({
    occupant: 'away_fan',
    standIndex: 2,
    tierIndex: 1,
    rowIndex: 1,
    colIndex: 14,
    totalCols: 18,
    timestampMs: 1350,
    scene: 'goal_celebration',
    cyclePhase: 0.34,
    celebrationIntensity: 0.95,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });

  assert.ok(homePose.dyNormalized < -0.5, 'Home supporter should jump upward during goal celebration');
  assert.ok(homePose.armRaise > 0.5, 'Home supporter should raise arms during goal celebration');
  assert.equal(awayPose.armRaise, 0, 'Away supporter should not cheer home goals');
  assert.ok(Math.abs(awayPose.dyNormalized) < 0.15, 'Away supporter should stay seated during home goal');
});

test('away fans animate actively during counter_transition attack and home endzone reacts to GK save', () => {
  const awayAttackPose = computeFanAnimationPose({
    occupant: 'away_fan',
    standIndex: 2,
    tierIndex: 1,
    rowIndex: 0,
    colIndex: 12,
    totalCols: 18,
    timestampMs: 1820,
    scene: 'counter_transition',
    cyclePhase: 0.56, // Mid counter-attack before save
    celebrationIntensity: 0,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });

  const homeSaveRoarPose = computeFanAnimationPose({
    occupant: 'home_primary',
    standIndex: 1, // Behind Home GK
    tierIndex: 0,
    rowIndex: 0,
    colIndex: 6,
    totalCols: 18,
    timestampMs: 1820,
    scene: 'counter_transition',
    cyclePhase: 0.70, // Right after Home GK save (ctT > 0.72)
    celebrationIntensity: 0,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });

  assert.ok(awayAttackPose.armRaise >= 0.45, 'Away block should cheer their counter-attack');
  assert.ok(homeSaveRoarPose.armRaise >= 0.5, 'Home endzone should cheer goalkeeper save');
  assert.ok(homeSaveRoarPose.dyNormalized < -0.4, 'Home endzone should bounce on goalkeeper save');
});

test('spectators evolve smoothly over time and avoid uniform column-striped head colors', () => {
  const t1 = computeFanAnimationPose({
    occupant: 'home_primary',
    standIndex: 0,
    tierIndex: 0,
    rowIndex: 1,
    colIndex: 8,
    totalCols: 30,
    timestampMs: 1000,
    scene: 'set_play',
    cyclePhase: 0.12,
    celebrationIntensity: 0,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });
  const t2 = computeFanAnimationPose({
    occupant: 'home_primary',
    standIndex: 0,
    tierIndex: 0,
    rowIndex: 1,
    colIndex: 8,
    totalCols: 30,
    timestampMs: 1320,
    scene: 'set_play',
    cyclePhase: 0.14,
    celebrationIntensity: 0,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });
  assert.notEqual(t1.dyNormalized, t2.dyNormalized, 'Spectator vertical bounce must vary over time');

  const rowColors = [0, 1, 2, 3].map((r) => resolveSpectatorHeadColor(0, 0, r, 4));
  const uniqueColors = new Set(rowColors);
  assert.ok(uniqueColors.size >= 3, 'Same column across rows must not have identical striped head colors');
});

test('home supporters include deterministic team flag-bearers whose flags wave smoothly over time', () => {
  let flagBearerCols: number[] = [];
  for (let col = 0; col < 30; col++) {
    const pose = computeFanAnimationPose({
      occupant: 'home_primary',
      standIndex: 1,
      tierIndex: 0,
      rowIndex: 1,
      colIndex: col,
      totalCols: 30,
      timestampMs: 1200,
      scene: 'set_play',
      cyclePhase: 0.25,
      celebrationIntensity: 0,
      isSimulatingLive: false,
      prefersReducedMotion: false,
    });
    if (pose.wavingFlag) flagBearerCols.push(col);
  }
  assert.ok(flagBearerCols.length >= 2, 'Endzone stand should include home flag-bearers');

  const col = flagBearerCols[0];
  const f1 = computeFanAnimationPose({
    occupant: 'home_primary',
    standIndex: 1,
    tierIndex: 0,
    rowIndex: 1,
    colIndex: col,
    totalCols: 30,
    timestampMs: 1000,
    scene: 'goal_celebration',
    cyclePhase: 0.35,
    celebrationIntensity: 0.9,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });
  const f2 = computeFanAnimationPose({
    occupant: 'home_primary',
    standIndex: 1,
    tierIndex: 0,
    rowIndex: 1,
    colIndex: col,
    totalCols: 30,
    timestampMs: 1220,
    scene: 'goal_celebration',
    cyclePhase: 0.36,
    celebrationIntensity: 0.9,
    isSimulatingLive: false,
    prefersReducedMotion: false,
  });
  assert.notEqual(f1.flagWaveAngle, f2.flagWaveAngle, 'Flag wave angle must animate dynamically');
});

