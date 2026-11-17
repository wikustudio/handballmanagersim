import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARENA_DESIGN_LIST,
  buildArenaArchitectureModel,
  resolveArenaScaleTier,
} from './arenaArchitecture';
import { resolveArenaColorScheme } from './courtsideStats';

const sampleColors = resolveArenaColorScheme('#007A3D', '#E30613', '#1E293B', '#FFFFFF');

test('resolveArenaScaleTier scales monotonically across all 5 handball venue sizes', () => {
  const capacities = [1800, 4800, 8800, 13800, 19500];
  const tiers = capacities.map((c) => resolveArenaScaleTier(c));

  assert.equal(tiers[0].id, 'sportshalle');
  assert.equal(tiers[1].id, 'municipal_bowl');
  assert.equal(tiers[2].id, 'bundesliga_cauldron');
  assert.equal(tiers[3].id, 'champions_palace');
  assert.equal(tiers[4].id, 'pinnacle_dome');

  for (let i = 1; i < tiers.length; i++) {
    const prevTotalRows = tiers[i - 1].lowerRows + tiers[i - 1].upperRows;
    const currTotalRows = tiers[i].lowerRows + tiers[i].upperRows;
    assert.ok(
      currTotalRows >= prevTotalRows,
      `Expected rows at ${capacities[i]} (${currTotalRows}) >= ${capacities[i - 1]} (${prevTotalRows})`
    );
    assert.ok(tiers[i].sidelineCols > tiers[i - 1].sidelineCols);
  }
});

test('buildArenaArchitectureModel scales empty vs occupied seats accurately with attendance', () => {
  const emptyModel = buildArenaArchitectureModel({
    capacity: 10000,
    attendance: 0,
    designId: 'terracotta_courtside',
    clubColors: sampleColors,
  });
  assert.equal(emptyModel.occupiedVisualSeats, 0);
  assert.equal(emptyModel.emptySeats, 10000);

  const sparseModel = buildArenaArchitectureModel({
    capacity: 10000,
    attendance: 2800,
    designId: 'terracotta_courtside',
    clubColors: sampleColors,
  });
  const halfModel = buildArenaArchitectureModel({
    capacity: 10000,
    attendance: 5500,
    designId: 'terracotta_courtside',
    clubColors: sampleColors,
  });
  const selloutModel = buildArenaArchitectureModel({
    capacity: 10000,
    attendance: 10000,
    designId: 'terracotta_courtside',
    clubColors: sampleColors,
  });

  assert.ok(
    sparseModel.occupiedVisualSeats < halfModel.occupiedVisualSeats,
    '28% attendance should leave more empty seats than 55% attendance'
  );
  assert.ok(
    halfModel.occupiedVisualSeats < selloutModel.occupiedVisualSeats,
    '55% attendance should leave more empty seats than 100% sellout'
  );
  assert.equal(selloutModel.occupiedVisualSeats, selloutModel.totalVisualSeats);
  assert.equal(selloutModel.utilizationPct, 100);
});

test('all 4 arena design presets resolve valid painted 6m goal creases including terracotta default', () => {
  assert.equal(ARENA_DESIGN_LIST.length, 4);

  const terracotta = buildArenaArchitectureModel({
    capacity: 6600,
    attendance: 6200,
    designId: 'terracotta_courtside',
    clubColors: sampleColors,
  });
  assert.equal(terracotta.resolvedCreaseHex, '#D9632B');

  const heritage = buildArenaArchitectureModel({
    capacity: 6600,
    attendance: 6200,
    designId: 'club_heritage',
    clubColors: sampleColors,
  });
  assert.equal(heritage.resolvedCreaseHex, sampleColors.courtPaintColor);
});

test('14,000+ arenas enable luxury architectural finish while smaller arenas do not', () => {
  assert.equal(resolveArenaScaleTier(13900).hasLuxuryFinish, false);
  assert.equal(resolveArenaScaleTier(14000).hasLuxuryFinish, true);
  assert.equal(resolveArenaScaleTier(24000).hasLuxuryFinish, true);
});

test('continuous seat expansion (+1,000 seats) scales visual seat count and elevation smoothly, and VIP mode activates suites on <5,000 arenas', () => {
  const base3100 = buildArenaArchitectureModel({
    capacity: 3100,
    attendance: 3000,
    designId: 'terracotta_courtside',
    clubColors: sampleColors,
    vipEnabled: false,
  });
  const expanded4600 = buildArenaArchitectureModel({
    capacity: 4600,
    attendance: 4400,
    designId: 'terracotta_courtside',
    clubColors: sampleColors,
    vipEnabled: false,
  });
  const vip3100 = buildArenaArchitectureModel({
    capacity: 3100,
    attendance: 3000,
    designId: 'terracotta_courtside',
    clubColors: sampleColors,
    vipEnabled: true,
  });

  assert.ok(
    expanded4600.totalVisualSeats > base3100.totalVisualSeats,
    `Expected 4,600-seat bowl (${expanded4600.totalVisualSeats}) > 3,100-seat bowl (${base3100.totalVisualSeats})`
  );
  assert.ok(
    expanded4600.tier.standElevationScale > base3100.tier.standElevationScale,
    'Stand elevation scale should grow smoothly within a tier when adding seats'
  );
  assert.equal(base3100.tier.hasVipBoxes, false);
  assert.equal(vip3100.tier.hasVipBoxes, true, 'VIP fan strategy must activate VIP skybox suites even on 3,100-seat arenas');
  assert.ok(vip3100.tier.vipSuiteCount >= 4);
});

test('attendance scales to center line and directly behind goal first, leaving corners last to fill', async () => {
  const { evaluateArenaSeat } = await import('./arenaArchitecture');
  const ratios = [0.25, 0.5, 0.75];

  for (const occ of ratios) {
    // Sideline: center line vs corners
    let sidelineCenterOccupied = 0;
    let sidelineCornerOccupied = 0;
    const totalCols = 40;
    for (let r = 0; r < 6; r++) {
      for (let dc = -3; dc <= 3; dc++) {
        if (
          evaluateArenaSeat({
            standIndex: 0,
            tierIndex: 0,
            rowIndex: r,
            totalRowsInTier: 6,
            colIndex: Math.floor(totalCols / 2) + dc,
            totalCols,
            occupancyRatio: occ,
          }) !== 'empty'
        ) {
          sidelineCenterOccupied++;
        }
      }
      for (const cornerCol of [0, 1, 2, 3, totalCols - 4, totalCols - 3, totalCols - 2, totalCols - 1]) {
        if (
          evaluateArenaSeat({
            standIndex: 0,
            tierIndex: 0,
            rowIndex: r,
            totalRowsInTier: 6,
            colIndex: cornerCol,
            totalCols,
            occupancyRatio: occ,
          }) !== 'empty'
        ) {
          sidelineCornerOccupied++;
        }
      }
    }

    assert.ok(
      sidelineCenterOccupied > sidelineCornerOccupied,
      `At ${Math.round(occ * 100)}% occupancy, sideline center (${sidelineCenterOccupied}) must fill ahead of corners (${sidelineCornerOccupied})`
    );

    // Endzone: behind goal vs corners
    let behindGoalOccupied = 0;
    let ezCornerOccupied = 0;
    const ezCols = 20;
    for (let r = 0; r < 5; r++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (
          evaluateArenaSeat({
            standIndex: 1,
            tierIndex: 0,
            rowIndex: r,
            totalRowsInTier: 5,
            colIndex: Math.floor(ezCols / 2) + dc,
            totalCols: ezCols,
            occupancyRatio: occ,
          }) !== 'empty'
        ) {
          behindGoalOccupied++;
        }
      }
      for (const cornerCol of [0, 1, ezCols - 2, ezCols - 1]) {
        if (
          evaluateArenaSeat({
            standIndex: 1,
            tierIndex: 0,
            rowIndex: r,
            totalRowsInTier: 5,
            colIndex: cornerCol,
            totalCols: ezCols,
            occupancyRatio: occ,
          }) !== 'empty'
        ) {
          ezCornerOccupied++;
        }
      }
    }

    assert.ok(
      behindGoalOccupied > ezCornerOccupied,
      `At ${Math.round(occ * 100)}% occupancy, behind-goal (${behindGoalOccupied}) must fill ahead of endzone corners (${ezCornerOccupied})`
    );
  }
});
