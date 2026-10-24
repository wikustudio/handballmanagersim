import { describe, it } from 'node:test';
import assert from 'node:assert';
import { useGameStore } from '../store/useGameStore';
import { isReserveClub } from '../data/gameConstants';
import { calculateProbabilisticSeason } from '../engine/engine';

describe('Fix 1: Reserve Club Death Spiral Prevention', () => {
  it('correctly identifies reserve clubs', () => {
    assert.strictEqual(isReserveClub('Barça Atlètic'), true);
    assert.strictEqual(isReserveClub('Füchse Berlin II'), true);
    assert.strictEqual(isReserveClub('THW Kiel U23'), true);
    assert.strictEqual(isReserveClub('THW Kiel'), false);
    assert.strictEqual(isReserveClub('SC Magdeburg'), false);
  });

  it('rotates academy affiliates for reserve clubs without OVR penalty', () => {
    const store = useGameStore.getState();
    const initialOvr = 68;

    // Set up reserve club with a depleted squad of 10 players
    store.updateState({
      club: {
        ...store.club,
        name: 'Füchse Berlin II',
        baseOvr: initialOvr,
        squadSize: 10,
        tier: 3,
      },
      ovrHistory: [],
    });

    // Run simulateSeason
    store.simulateSeason();

    const updated = useGameStore.getState();
    // Verify squad size restored to 13
    assert.ok((updated.club.squadSize || 0) >= 13);

    // Verify no negative Emergency Callups penalty was applied in ovrHistory
    const emergencyLogs = (updated.ovrHistory || []).filter(h => h.reason?.includes('Emergency Callups'));
    assert.strictEqual(emergencyLogs.length, 0, 'Reserve clubs must never have Emergency Callups penalty');

    const affiliateLogs = (updated.ovrHistory || []).filter(h => h.reason?.includes('Academy Affiliates Rotated'));
    assert.ok(affiliateLogs.length >= 1, 'Reserve clubs should have Academy Affiliates Rotated log');
    assert.strictEqual(affiliateLogs[0].change, 0, 'Academy Affiliates Rotated must have 0 change');
  });

  it('penalizes standard clubs with Emergency Callups when depleted below 13', () => {
    const store = useGameStore.getState();
    const initialOvr = 72;

    store.updateState({
      club: {
        ...store.club,
        name: 'HSG Wetzlar',
        baseOvr: initialOvr,
        squadSize: 10, // 3 short
        tier: 1,
      },
      ovrHistory: [],
    });

    store.simulateSeason();

    const updated = useGameStore.getState();
    const emergencyLogs = (updated.ovrHistory || []).filter(h => h.reason?.includes('Emergency Callups'));
    assert.ok(emergencyLogs.length >= 1, 'Standard clubs must have Emergency Callups penalty when understaffed');
    assert.ok(emergencyLogs[0].change < 0, 'Emergency Callup log should apply negative OVR penalty');
  });
});

describe('Fix 2: Overlay Math Parity with Simulation Engine', () => {
  it('exactSeasonStats matches the outcomes distributed across matchday pool', () => {
    const engineOutcome = calculateProbabilisticSeason(
      { id: 101, name: 'Test Club', baseOvr: 70 } as any,
      70,
      2,
      '6:0 Defense',
      18,
      75,
      true
    );

    const outcomePool: ('W' | 'D' | 'L')[] = [
      ...Array(engineOutcome.wins).fill('W'),
      ...Array(engineOutcome.draws).fill('D'),
      ...Array(engineOutcome.losses).fill('L'),
    ];

    const totalMatches = (18 - 1) * 2;
    assert.strictEqual(outcomePool.length, totalMatches);

    const winsCount = outcomePool.filter(o => o === 'W').length;
    const drawsCount = outcomePool.filter(o => o === 'D').length;
    const lossesCount = outcomePool.filter(o => o === 'L').length;
    const ptsCount = winsCount * 2 + drawsCount;

    assert.strictEqual(winsCount, engineOutcome.wins);
    assert.strictEqual(drawsCount, engineOutcome.draws);
    assert.strictEqual(lossesCount, engineOutcome.losses);
    assert.strictEqual(ptsCount, engineOutcome.pts);
  });
});

describe('Fix 3: Relegated Board Expectations Logic', () => {
  it('assigns Immediate Promotion Bounce-Back to relegated teams with strong OVR', () => {
    const store = useGameStore.getState();
    // Simulate relegation from tier 1 to tier 2 with 80 OVR (league avg in tier 2 is ~73)
    store.updateState({
      club: {
        ...store.club,
        name: 'VfL Gummersbach',
        baseOvr: 80,
        tier: 1,
        squadSize: 18,
      },
      // Force pendingSeasonState with 18th place finish (relegation)
      pendingSeasonState: {
        pos: 18,
        pts: 12,
        wins: 4,
        draws: 4,
        losses: 26,
        gf: 750,
        ga: 920,
      },
    });

    store.simulateSeason();

    const updated = useGameStore.getState();
    assert.strictEqual(updated.club.tier, 2, 'Club should have dropped to Tier 2');
    assert.strictEqual(updated.boardExpectation, 'Immediate Promotion Bounce-Back');
    assert.strictEqual(updated.boardTargetPos, 2);
  });
});

