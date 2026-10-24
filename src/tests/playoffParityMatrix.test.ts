import assert from 'node:assert';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { ALL_CLUBS } from '../data/clubsData';
import { getLeagueSize } from '../engine/engine';
import { Club } from '../types';

console.log('--- RUNNING PLAYOFF PARITY MATRIX & DYNAMIC LEAGUE BALANCE AUDIT ---');

// TEST 1: Germany (18/18) - User T1 Playoff Loss
{
  console.log('\nTest 1: Germany (18/18) - User T1 finishes 16th and loses playoff...');
  const kiel = ALL_CLUBS.find(c => c.name.includes('Kiel') && c.tier === 1)!;
  const potsdam = ALL_CLUBS.find(c => c.country === 'GER' && c.tier === 2)!;

  const userClubReleg = { ...kiel, tier: 2 };
  const playoffContext = {
    playoffDecider: {
      type: 'relegation_playoff',
      year: 2024,
      userWon: false,
      winnerName: potsdam.name,
      winnerId: potsdam.id,
      loserName: kiel.name,
      loserId: kiel.id,
      upperTier: 1,
      lowerTier: 2
    }
  };

  const res = simulateGlobalLeagues({}, userClubReleg, 1, 2024, 16, {}, undefined, undefined, playoffContext as any);
  const counts: Record<string, number> = {};
  (Object.values(res.newWorldClubs) as Club[]).forEach(c => {
    const k = (c.country || 'GER') + '-T' + c.tier;
    counts[k] = (counts[k] || 0) + 1;
  });

  const expectedT1 = getLeagueSize(1, 'GER', userClubReleg.id, userClubReleg.tier, userClubReleg.country);
  const expectedT2 = getLeagueSize(2, 'GER', userClubReleg.id, userClubReleg.tier, userClubReleg.country);

  assert.strictEqual(counts['GER-T1'], expectedT1, `GER-T1 must have exactly ${expectedT1} clubs after playoff`);
  assert.strictEqual(counts['GER-T2'], expectedT2, `GER-T2 must have exactly ${expectedT2} clubs after playoff`);
  console.log(`✓ Test 1 Passed: GER T1 (${counts['GER-T1']}) and T2 (${counts['GER-T2']}) perfectly balanced.`);
}

// TEST 2: France (16/14) - User T1 Playoff Loss
{
  console.log('\nTest 2: France (16/14) - User T1 finishes 14th and loses playoff...');
  const psg = ALL_CLUBS.find(c => c.country === 'FRA' && c.tier === 1)!;
  const saran = ALL_CLUBS.find(c => c.country === 'FRA' && c.tier === 2)!;

  const userClubReleg = { ...psg, tier: 2 };
  const playoffContext = {
    playoffDecider: {
      type: 'relegation_playoff',
      year: 2024,
      userWon: false,
      winnerName: saran.name,
      winnerId: saran.id,
      loserName: psg.name,
      loserId: psg.id,
      upperTier: 1,
      lowerTier: 2
    }
  };

  const res = simulateGlobalLeagues({}, userClubReleg, 1, 2024, 14, {}, undefined, undefined, playoffContext as any);
  const counts: Record<string, number> = {};
  (Object.values(res.newWorldClubs) as Club[]).forEach(c => {
    const k = (c.country || 'GER') + '-T' + c.tier;
    counts[k] = (counts[k] || 0) + 1;
  });

  const expectedT1 = getLeagueSize(1, 'FRA', userClubReleg.id, userClubReleg.tier, userClubReleg.country);
  const expectedT2 = getLeagueSize(2, 'FRA', userClubReleg.id, userClubReleg.tier, userClubReleg.country);

  assert.strictEqual(counts['FRA-T1'], expectedT1, `FRA-T1 must have exactly ${expectedT1} clubs after playoff`);
  assert.strictEqual(counts['FRA-T2'], expectedT2, `FRA-T2 must have exactly ${expectedT2} clubs after playoff`);
  console.log(`✓ Test 2 Passed: FRA T1 (${counts['FRA-T1']}) and T2 (${counts['FRA-T2']}) perfectly balanced.`);
}

// TEST 3: Germany (18/18) - User T2 finishes 3rd and wins Promotion Playoff
{
  console.log('\nTest 3: Germany (18/18) - User T2 finishes 3rd and wins Promotion Playoff...');
  const potsdam = ALL_CLUBS.find(c => c.country === 'GER' && c.tier === 2)!;
  const kiel = ALL_CLUBS.find(c => c.name.includes('Kiel') && c.tier === 1)!;

  const userClubPromo = { ...potsdam, tier: 1 };
  const playoffContext = {
    playoffDecider: {
      type: 'promotion_playoff',
      year: 2024,
      userWon: true,
      winnerName: potsdam.name,
      winnerId: potsdam.id,
      loserName: kiel.name,
      loserId: kiel.id,
      upperTier: 1,
      lowerTier: 2
    }
  };

  const res = simulateGlobalLeagues({}, userClubPromo, 2, 2024, 3, {}, undefined, undefined, playoffContext as any);
  const counts: Record<string, number> = {};
  (Object.values(res.newWorldClubs) as Club[]).forEach(c => {
    const k = (c.country || 'GER') + '-T' + c.tier;
    counts[k] = (counts[k] || 0) + 1;
  });

  const expectedT1 = getLeagueSize(1, 'GER', userClubPromo.id, userClubPromo.tier, userClubPromo.country);
  const expectedT2 = getLeagueSize(2, 'GER', userClubPromo.id, userClubPromo.tier, userClubPromo.country);

  assert.strictEqual(counts['GER-T1'], expectedT1, `GER-T1 must have exactly ${expectedT1} clubs`);
  assert.strictEqual(counts['GER-T2'], expectedT2, `GER-T2 must have exactly ${expectedT2} clubs`);
  console.log(`✓ Test 3 Passed: GER T1 (${counts['GER-T1']}) and T2 (${counts['GER-T2']}) promotion parity strictly preserved.`);
}
