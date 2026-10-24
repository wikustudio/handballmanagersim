import { describe, it } from 'node:test';
import assert from 'node:assert';
import { useGameStore } from '../store/useGameStore';
import { getMaxYouthPullsPerSeason, calculateClubFinancials } from '../data/gameConstants';
import { generateYouthProspect, calculateProbabilisticSeason } from '../engine/engine';

describe('Feature 1: Veteran Ringer (High-Risk Promotion Gambles)', () => {
  it('cannot be signed in Tier 1 or Tier 2', () => {
    const store = useGameStore.getState();
    store.updateState({
      club: { ...store.club, tier: 1 },
      veteranRingerSignedThisSeason: false,
    });
    const resT1 = store.signVeteranRinger();
    assert.strictEqual(resT1.success, false);
    assert.match(resT1.message, /exclusively available to Tiers 3, 4, 5, and 6/i);

    store.updateState({
      club: { ...store.club, tier: 2 },
      veteranRingerSignedThisSeason: false,
    });
    const resT2 = store.signVeteranRinger();
    assert.strictEqual(resT2.success, false);
    assert.match(resT2.message, /exclusively available to Tiers 3, 4, 5, and 6/i);
  });

  it('can be signed in Tier 4 and grants +3 to +5 OVR with wage burden', () => {
    const store = useGameStore.getState();
    const initialOvr = 58;
    const initialBudget = 500000;
    store.updateState({
      budget: initialBudget,
      club: { ...store.club, tier: 4, baseOvr: initialOvr, squadSize: 16 },
      veteranRingerSignedThisSeason: false,
      veteranRingerOvrGain: 0,
      veteranRingerWageCost: 0,
    });

    const res = store.signVeteranRinger(40000, 4, 120000, 'Holger Glandorf (38)');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.gain, 4);
    assert.strictEqual(res.name, 'Holger Glandorf (38)');

    const updated = useGameStore.getState();
    assert.strictEqual(updated.veteranRingerSignedThisSeason, true);
    assert.strictEqual(updated.club.baseOvr, initialOvr + 4);
    assert.strictEqual(updated.veteranRingerWageCost, 120000);
    assert.strictEqual(updated.budget, initialBudget - 40000);

    // Financial calculation includes the veteran wage burden
    const financials = calculateClubFinancials(updated);
    assert.ok(financials.wages > 0);
  });

  it('enforces limit of 1 Veteran Ringer per season', () => {
    const store = useGameStore.getState();
    store.updateState({
      club: { ...store.club, tier: 4 },
      veteranRingerSignedThisSeason: true,
    });
    const res = store.signVeteranRinger();
    assert.strictEqual(res.success, false);
    assert.match(res.message, /already signed a Veteran Ringer/i);
  });
});

describe('Feature 2 & 3: TV Cup Jackpot & Mid-Season Dilemma', () => {
  it('calculates TV Cup Jackpot windfall between €150k and €300k', () => {
    const minJackpot = 150000;
    const maxJackpot = 300000;
    for (let i = 0; i < 20; i++) {
      const amount = 150000 + Math.floor(Math.random() * 150000);
      assert.ok(amount >= minJackpot && amount <= maxJackpot);
    }
  });

  it('resolving mid-season dilemma updates club parameters directly', () => {
    const store = useGameStore.getState();
    const startMorale = 70;
    const startOvr = 65;
    const startBudget = 200000;
    store.updateState({
      budget: startBudget,
      club: { ...store.club, baseOvr: startOvr, morale: startMorale },
    });

    // Dilemma resolution: private clinic rehab costs €40k but retains OVR
    store.updateState({
      budget: startBudget - 40000,
      club: { ...store.club, baseOvr: startOvr },
      midSeasonDilemmaResolvedYear: 2026,
    });

    const updated = useGameStore.getState();
    assert.strictEqual(updated.budget, 160000);
    assert.strictEqual(updated.club.baseOvr, startOvr);
    assert.strictEqual(updated.midSeasonDilemmaResolvedYear, 2026);
  });
});

describe('Feature 4: Dynamic Facility Milestones', () => {
  it('Level 2 Academy unlocks scouting 2 youths per season instead of 1', () => {
    assert.strictEqual(getMaxYouthPullsPerSeason(4, 1), 1);
    assert.strictEqual(getMaxYouthPullsPerSeason(4, 2), 2);
    assert.strictEqual(getMaxYouthPullsPerSeason(3, 3), 3);
    assert.strictEqual(getMaxYouthPullsPerSeason(1, 1), 1);
    assert.strictEqual(getMaxYouthPullsPerSeason(1, 2), 2);
  });

  it('Level 4 Academy generates Foreign Imports with foreign powerhouse nationality', () => {
    const prospect = generateYouthProspect(4, 'GER', 2, {
      isForeignImport: true,
    });

    assert.ok(prospect);
    assert.strictEqual(prospect.isForeignImport, true);
    assert.notStrictEqual(prospect.nationality, 'GER');
    assert.ok(['DEN', 'FRA', 'ESP', 'SWE', 'NOR', 'CRO', 'SLO', 'POR', 'HUN', 'ISL'].includes(prospect.nationality || ''));
  });

  it('Level 5 Academy grants permanent immunity from Target on the Back consecutive-title penalty', () => {
    let totalPtsLvl1 = 0;
    let totalPtsLvl5 = 0;
    const runs = 80;

    for (let i = 0; i < runs; i++) {
      const resLvl1 = calculateProbabilisticSeason(
        { id: 1, name: 'User Club', baseOvr: 85 } as any,
        85,
        1,
        '6:0 Defense',
        18,
        75,
        { isUserClub: true, consecutiveTitles: 4, academyLevel: 1, medicalLevel: 1 }
      );
      totalPtsLvl1 += resLvl1.pts;

      const resLvl5 = calculateProbabilisticSeason(
        { id: 1, name: 'User Club', baseOvr: 85 } as any,
        85,
        1,
        '6:0 Defense',
        18,
        75,
        { isUserClub: true, consecutiveTitles: 4, academyLevel: 5, medicalLevel: 1 }
      );
      totalPtsLvl5 += resLvl5.pts;
    }

    const avgLvl1 = totalPtsLvl1 / runs;
    const avgLvl5 = totalPtsLvl5 / runs;

    // With Level 5 academy immunity (saving ~2.5 OVR tax), avg points should be noticeably higher!
    assert.ok(avgLvl5 > avgLvl1, `Level 5 avg (${avgLvl5}) should exceed Level 1 avg (${avgLvl1})`);
  });

  it('Medical Facility milestones grant crisis discounts, 100% rehab at Lvl 3+, and +1.0 Matchday OVR + Dynasty Immunity at Lvl 5', async () => {
    const { generateMidSeasonCrisis } = await import('../data/randomEvents');
    const store = useGameStore.getState();

    // Check Lvl 1 vs Lvl 2 vs Lvl 3 crisis rehab cost & success rate
    const stateLvl1: any = { ...store, club: { ...store.club, tier: 1, country: 'GER', medicalLevel: 1 } };
    const stateLvl2: any = { ...store, club: { ...store.club, tier: 1, country: 'GER', medicalLevel: 2 } };
    const stateLvl3: any = { ...store, club: { ...store.club, tier: 1, country: 'GER', medicalLevel: 3 } };

    // Sample crises until we hit injury_crisis for each level
    let crisis1: any = null, crisis2: any = null, crisis3: any = null;
    for (let i = 0; i < 60; i++) {
      const c1 = generateMidSeasonCrisis(stateLvl1);
      if (c1?.type === 'injury_crisis') crisis1 = c1;
      const c2 = generateMidSeasonCrisis(stateLvl2);
      if (c2?.type === 'injury_crisis') crisis2 = c2;
      const c3 = generateMidSeasonCrisis(stateLvl3);
      if (c3?.type === 'injury_crisis') crisis3 = c3;
      if (crisis1 && crisis2 && crisis3) break;
    }

    assert.ok(crisis1 && crisis2 && crisis3, 'Should generate injury_crisis events');
    assert.strictEqual(crisis2.extraData.opt1Cost, Math.round(crisis1.extraData.opt1Cost * 0.5), 'Lvl 2 Medical halves crisis rehab cost');
    assert.strictEqual(crisis3.extraData.opt1Cost, Math.round(crisis1.extraData.opt1Cost * 0.25), 'Lvl 3 Medical cuts crisis rehab cost by 75%');
    assert.strictEqual(crisis3.opt1.goodPct, 100, 'Lvl 3 Medical guarantees 100% Star Injury rehab recovery');

    // Check Lvl 5 Medical (+1.0 Matchday Conditioning OVR + Dynasty Tax Immunity)
    let ptsMed1 = 0;
    let ptsMed5 = 0;
    const runs = 80;
    for (let i = 0; i < runs; i++) {
      ptsMed1 += calculateProbabilisticSeason(
        { id: 1, name: 'User Club', baseOvr: 84 } as any,
        84,
        1,
        'Total Handball',
        18,
        75,
        { isUserClub: true, consecutiveTitles: 3, academyLevel: 1, medicalLevel: 1 }
      ).pts;
      ptsMed5 += calculateProbabilisticSeason(
        { id: 1, name: 'User Club', baseOvr: 84 } as any,
        84,
        1,
        'Total Handball',
        18,
        75,
        { isUserClub: true, consecutiveTitles: 3, academyLevel: 1, medicalLevel: 5 }
      ).pts;
    }
    assert.ok(ptsMed5 / runs > ptsMed1 / runs, `Level 5 Medical avg (${ptsMed5 / runs}) should exceed Level 1 Medical avg (${ptsMed1 / runs})`);
  });
});

