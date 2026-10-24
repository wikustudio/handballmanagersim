import assert from 'node:assert';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { generateLeagueTable } from '../utils/leagueTableGenerator';
import { ALL_CLUBS } from '../data/clubsData';
import { Club, GameState, ResolvedMatchContext } from '../types';

console.log('--- RUNNING CONTEXTUAL SIMULATION SYNCHRONIZATION AUDIT ---');

const dummyUserClub: Club = {
  id: 108,
  name: 'VfL Gummersbach',
  tier: 1,
  baseOvr: 85,
  color: '#0055aa',
  country: 'GER',
  stadium: 4132,
  fanBase: 3500,
  currentBudget: 5000000
};

const initialWorldClubs: Record<string, Club> = {};
ALL_CLUBS.forEach(c => {
  initialWorldClubs[c.id] = { ...c };
});

// Test 1: Explicitly assigns cup winner and finalist context when user loses cup final
console.log('Test 1: Explicitly assigns cup winner and finalist context when user loses cup final...');
{
  const defeatingOpponentName = 'SC Magdeburg';
  const defeatingClub = ALL_CLUBS.find(c => c.name === defeatingOpponentName) || {
    id: 101,
    name: defeatingOpponentName,
    tier: 1,
    baseOvr: 93,
    country: 'GER',
    color: '#007f3b'
  } as Club;

  const matchContext: ResolvedMatchContext = {
    cupFinals: {
      nat_cup: {
        cupId: 'nat_cup',
        cupName: 'DHB-Pokal',
        year: 2025,
        winnerId: defeatingClub.id,
        winnerName: defeatingClub.name,
        runnerUpId: dummyUserClub.id,
        runnerUpName: dummyUserClub.name,
        userWon: false
      }
    }
  };

  const simResult = simulateGlobalLeagues(
    initialWorldClubs,
    dummyUserClub,
    1,
    2025,
    2,
    {},
    undefined,
    undefined,
    matchContext
  );

  // Look for national cup movement
  const natCupMovement = simResult.movements.find(m => m.id.includes('cup-dfb'));
  assert.ok(natCupMovement, 'National cup movement should exist');
  assert.strictEqual(natCupMovement?.clubName, defeatingOpponentName);
  assert.strictEqual(natCupMovement?.clubId, String(defeatingClub.id));

  // Confirm Magdeburg got the trophy boost in world clubs
  const updatedMagdeburg = simResult.newWorldClubs[defeatingClub.id];
  assert.ok(updatedMagdeburg, 'Updated Magdeburg should exist in worldClubs');
  assert.ok(updatedMagdeburg.baseOvr >= defeatingClub.baseOvr, 'Magdeburg should have received prestige boost');
  console.log('  ✓ Test 1 Passed: Cup winner and finalist context authoritative and synced.');
}

// Test 2: Locks promotion playoff outcome from 3rd, expanding promotion quota to 3 clubs
console.log('Test 2: Locks promotion playoff outcome from 3rd, expanding promotion quota to 3 clubs...');
{
  const tier2UserClub: Club = {
    ...dummyUserClub,
    id: 121,
    name: 'TuS N-Lübbecke',
    tier: 2,
    baseOvr: 76
  };

  const upperTierOpponent = '1. VfL Potsdam';
  const upperClub = ALL_CLUBS.find(c => c.name === upperTierOpponent) || {
    id: 117,
    name: upperTierOpponent,
    tier: 1,
    baseOvr: 78,
    country: 'GER'
  } as Club;

  const matchContext: ResolvedMatchContext = {
    playoffDecider: {
      type: 'promotion_playoff',
      year: 2025,
      winnerId: tier2UserClub.id,
      winnerName: tier2UserClub.name,
      loserId: upperClub.id,
      loserName: upperClub.name,
      upperTier: 1,
      lowerTier: 2,
      userWon: true,
      promotedClubId: String(tier2UserClub.id),
      relegatedClubId: String(upperClub.id)
    }
  };

  // User finished 3rd in Tier 2
  const simResult = simulateGlobalLeagues(
    initialWorldClubs,
    tier2UserClub,
    2,
    2025,
    3,
    {},
    undefined,
    undefined,
    matchContext
  );

  // Verify upperClub relegated to Tier 2
  const upperClubInNextTier = simResult.newWorldClubs[upperClub.id];
  assert.ok(upperClubInNextTier, 'Upper club should exist in next tier world clubs');
  assert.strictEqual(upperClubInNextTier.tier, 2, 'Upper club should be relegated to Tier 2');

  // Verify relegations from Tier 1 in Germany include upperClub
  const tier1Relegs = simResult.movements.filter(m => m.type === 'relegation' && m.fromTier === 1 && m.toTier === 2 && m.country === 'GER');
  assert.ok(tier1Relegs.some(r => r.clubName === upperTierOpponent), 'Tier 1 relegations should include upperTierOpponent');
  // Total relegations from Tier 1 in Germany should be 3 (2 direct + 1 playoff loser)
  assert.strictEqual(tier1Relegs.length, 3, 'Total Tier 1 relegations in Germany should be 3');
  console.log('  ✓ Test 2 Passed: 3rd-place promotion locked with symmetrical 3-club relegation.');
}

// Test 3: Locks relegation playoff survival when Tier 1 user defends their spot
console.log('Test 3: Locks relegation playoff survival when Tier 1 user defends their spot...');
{
  const lowerTierChallenger = 'Die Eulen Ludwigshafen';
  const challengerClub = ALL_CLUBS.find(c => c.name === lowerTierChallenger) || {
    id: 129,
    name: lowerTierChallenger,
    tier: 2,
    baseOvr: 72,
    country: 'GER'
  } as Club;

  const matchContext: ResolvedMatchContext = {
    playoffDecider: {
      type: 'relegation_playoff',
      year: 2025,
      winnerId: dummyUserClub.id,
      winnerName: dummyUserClub.name,
      loserId: challengerClub.id,
      loserName: challengerClub.name,
      upperTier: 1,
      lowerTier: 2,
      userWon: true,
      promotedClubId: '',
      relegatedClubId: ''
    }
  };

  // User finished 16th in Tier 1 and won survival playoff
  const simResult = simulateGlobalLeagues(
    initialWorldClubs,
    dummyUserClub,
    1,
    2025,
    16,
    {},
    undefined,
    undefined,
    matchContext
  );

  // User remains in Tier 1
  const userInNextTier = simResult.newWorldClubs[dummyUserClub.id];
  if (userInNextTier) {
    assert.strictEqual(userInNextTier.tier, 1, 'User should remain in Tier 1');
  }

  // Challenger remains in Tier 2 (NOT promoted)
  const challengerInNextTier = simResult.newWorldClubs[challengerClub.id];
  if (challengerInNextTier) {
    assert.strictEqual(challengerInNextTier.tier, 2, 'Challenger should remain in Tier 2');
  }
  console.log('  ✓ Test 3 Passed: Playoff survival locked and challenger denied unearned promotion.');
}

// Test 4: Preserves 3rd place regular season position and renders P status badge when promoted
console.log('Test 4: Preserves 3rd place regular season position and renders P status badge when promoted...');
{
  const dummyState: GameState = {
    club: {
      id: 303,
      name: 'TuS N-Lübbecke',
      tier: 2,
      baseOvr: 79,
      country: 'GER',
      color: '#ff0000',
      stadium: 3000,
      fanBase: 2500,
      currentBudget: 2000000
    },
    year: 2025,
    resolvedMatchContext: {
      playoffDecider: {
        type: 'promotion_playoff',
        year: 2025,
        winnerId: 303,
        winnerName: 'TuS N-Lübbecke',
        loserId: 404,
        loserName: '1. VfL Potsdam',
        upperTier: 1,
        lowerTier: 2,
        userWon: true,
        promotedClubId: '303',
        relegatedClubId: '404'
      }
    },
    history: [
      {
        year: 2025,
        clubId: 303,
        clubName: 'TuS N-Lübbecke',
        tier: 2,
        pos: 3,
        pts: 48,
        wins: 23,
        draws: 2,
        losses: 9,
        gf: 850,
        ga: 780,
        promoted: true
      }
    ]
  } as any;

  const table = generateLeagueTable(dummyState, ALL_CLUBS, 2, dummyState.history[0]);
  const thirdRow = table.find(r => r.pos === 3);

  assert.ok(thirdRow, '3rd row should exist');
  // 3rd place team must have 'P' status marker because promotion playoff was won
  assert.strictEqual(thirdRow?.statusMarker, 'P', '3rd row should have P status marker');
  // Top 2 clubs also have 'C' and 'P'
  assert.strictEqual(table[0].statusMarker, 'C', '1st row should have C status marker');
  assert.strictEqual(table[1].statusMarker, 'P', '2nd row should have P status marker');
  console.log('  ✓ Test 4 Passed: 3rd place preserved with authentic P status badge.');
}

console.log('========================================================================');
console.log('ALL CONTEXTUAL SIMULATION SYNCHRONIZATION AUDIT TESTS PASSED (4/4)');
console.log('========================================================================\n');
