import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateIPOEligibility } from './ipoEligibility';
import { ALL_CLUBS } from '../data/clubsData';
import { useGameStore } from '../store/useGameStore';

test('IPO eligibility approves solvent Tier-1 flagship clubs', () => {
  const thw = ALL_CLUBS.find((c) => c.name === 'THW Kiel')!;
  const res = evaluateIPOEligibility({
    club: { ...thw, tier: 1, baseOvr: 88, fanBase: 60000, isPublic: false },
    budget: 1_200_000,
    seasonsInDebt: 0,
    bankruptcyPending: false,
  });
  assert.equal(res.eligible, true);
  assert.equal(res.primaryBlocker, null);
  assert.equal(res.checks.every((c) => c.passed), true);
});

test('IPO eligibility blocks reserve squads regardless of tier or cash', () => {
  const res = evaluateIPOEligibility({
    club: {
      id: 9999,
      name: 'SC Magdeburg II',
      tier: 1,
      baseOvr: 82,
      fanBase: 12000,
      stadium: 2000,
      country: 'GER',
      isPublic: false,
    },
    budget: 2_000_000,
    seasonsInDebt: 0,
    bankruptcyPending: false,
  });
  assert.equal(res.eligible, false);
  assert.equal(res.isReserve, true);
  assert.equal(res.primaryBlocker, 'Reserve Subsidiary');
});

test('IPO eligibility blocks Tier 2 and lower clubs', () => {
  const tier2Club = ALL_CLUBS.find((c) => c.tier === 2 && !c.name.endsWith('II'))!;
  const res = evaluateIPOEligibility({
    club: { ...tier2Club, baseOvr: 78, fanBase: 9000, isPublic: false },
    budget: 800_000,
    seasonsInDebt: 0,
    bankruptcyPending: false,
  });
  assert.equal(res.eligible, false);
  assert.equal(res.primaryBlocker, 'Tier 1 Required');
});

test('IPO eligibility blocks clubs in deficit or debt strike', () => {
  const thw = ALL_CLUBS.find((c) => c.name === 'THW Kiel')!;
  const deficit = evaluateIPOEligibility({
    club: { ...thw, tier: 1, baseOvr: 88, fanBase: 50000, isPublic: false },
    budget: -250_000,
    seasonsInDebt: 0,
    bankruptcyPending: false,
  });
  assert.equal(deficit.eligible, false);
  assert.equal(deficit.primaryBlocker, 'Restore Solvency');

  const debtStrike = evaluateIPOEligibility({
    club: { ...thw, tier: 1, baseOvr: 88, fanBase: 50000, isPublic: false },
    budget: 100_000,
    seasonsInDebt: 1,
    bankruptcyPending: false,
  });
  assert.equal(debtStrike.eligible, false);
  assert.equal(debtStrike.primaryBlocker, 'Restore Solvency');
});

test('IPO eligibility blocks Tier-1 clubs below minimum OVR or fanbase scale', () => {
  const thw = ALL_CLUBS.find((c) => c.name === 'THW Kiel')!;
  const lowFan = evaluateIPOEligibility({
    club: { ...thw, tier: 1, baseOvr: 78, fanBase: 3600, isPublic: false },
    budget: 400_000,
    seasonsInDebt: 0,
    bankruptcyPending: false,
  });
  assert.equal(lowFan.eligible, false);
  assert.equal(lowFan.primaryBlocker, 'Need 5,000+ Fans');

  const lowOvr = evaluateIPOEligibility({
    club: { ...thw, tier: 1, baseOvr: 73, fanBase: 8500, isPublic: false },
    budget: 400_000,
    seasonsInDebt: 0,
    bankruptcyPending: false,
  });
  assert.equal(lowOvr.eligible, false);
  assert.equal(lowOvr.primaryBlocker, 'Need 75+ OVR');
});

test('store launchIPO enforces IPO eligibility and rejects Tier-2 clubs', () => {
  const store = useGameStore.getState();
  store.resetGame();
  const tier2Club = ALL_CLUBS.find((c) => c.tier === 2 && !c.name.endsWith('II'))!;
  useGameStore.setState({
    budget: 1_000_000,
    club: { ...tier2Club, baseOvr: 78, fanBase: 9000, isPublic: false },
    seasonsInDebt: 0,
    bankruptcyPending: false,
    notifications: [],
  });

  useGameStore.getState().launchIPO(12.0);
  const after = useGameStore.getState();
  assert.equal(Boolean(after.club.isPublic), false);
  assert.equal(after.budget, 1_000_000);
  assert.equal(
    after.notifications.some((n) => n.type === 'error' && (n.title || '').includes('IPO')),
    true
  );
});
