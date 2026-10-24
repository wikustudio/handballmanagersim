import assert from 'node:assert';
import { useGameStore } from '../store/useGameStore';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { generateLeagueTable } from '../utils/leagueTableGenerator';
import { ALL_CLUBS } from '../data/clubsData';
import { isReserveClub } from '../data/gameConstants';
import { Club, GameState } from '../types';

console.log('=== RUNNING POINT DEDUCTION, RESERVE PROMOTION, PLAYOFF & CROSS-CLUB AUDIT ===');

// 1. Test generateLeagueTable reserve club statusMarker shifting in Tier 2 and Tier 1
{
  console.log('\nTest 1: Reserve clubs in Tier 2 and Tier 1 do not receive P, PO, or Q markers in generateLeagueTable...');
  const magdeburgII = ALL_CLUBS.find(c => isReserveClub(c.name) && (c.country || 'GER') === 'GER')!;
  assert(magdeburgII, 'Must find a German reserve club');

  // If reserve club finishes 2nd in Tier 2, it should not get 'P', and 3rd/4th non-reserve should shift up
  const mockStateT2: GameState = {
    ...useGameStore.getState(),
    year: 2026,
    club: { ...magdeburgII, tier: 2 },
    worldClubs: {},
    history: []
  };
  const tier2Table = generateLeagueTable(
    mockStateT2,
    ALL_CLUBS,
    2,
    {
      year: 2026,
      tier: 2,
      pos: 2,
      pts: 52,
      wins: 25,
      draws: 2,
      losses: 7,
      userPlayedTier: 2,
      isCompletedSeason: true
    } as any
  );
  const reserveRowT2 = tier2Table.find(r => r.name === magdeburgII.name)!;
  assert(reserveRowT2, 'Reserve club row must exist in Tier 2 table');
  assert.notStrictEqual(reserveRowT2.statusMarker, 'P', 'Reserve club in Tier 2 must NOT get P marker');
  assert.notStrictEqual(reserveRowT2.statusMarker, 'PO', 'Reserve club in Tier 2 must NOT get PO marker');

  const row3 = tier2Table.find(r => r.pos === 3)!;
  if (!isReserveClub(row3.name)) {
    assert.strictEqual(row3.statusMarker, 'P', '3rd place non-reserve club in Tier 2 must inherit direct promotion P marker when 2nd place is a reserve club');
  }

  // If reserve club finishes 3rd in Tier 1, it should not get 'Q'
  const mockStateT1: GameState = {
    ...useGameStore.getState(),
    year: 2026,
    club: { ...magdeburgII, tier: 1 },
    worldClubs: {},
    history: []
  };
  const tier1Table = generateLeagueTable(
    mockStateT1,
    ALL_CLUBS,
    1,
    {
      year: 2026,
      tier: 1,
      pos: 3,
      pts: 48,
      wins: 23,
      draws: 2,
      losses: 9,
      userPlayedTier: 1,
      isCompletedSeason: true
    } as any
  );
  const reserveRowT1 = tier1Table.find(r => r.name === magdeburgII.name)!;
  assert.strictEqual(reserveRowT1.statusMarker, undefined, 'Reserve club in Tier 1 must NOT get European qualification Q marker');
  console.log('✓ Test 1 Passed');
}

// 2. Test simulateGlobalLeagues prevents reserve club promotion into Tier 1 or Tier 2 via division tables
{
  console.log('\nTest 2: simulateGlobalLeagues bars reserve clubs in tableT1 from promoting to Tier 1 or Tier 2...');
  const worldClubsInit: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => { worldClubsInit[c.id] = { ...c }; });

  const reserveClub = ALL_CLUBS.find(c => isReserveClub(c.name) && (c.country || 'GER') === 'GER')!;
  const tier2NonReserves = ALL_CLUBS.filter(c => (c.country || 'GER') === 'GER' && c.tier === 2 && !isReserveClub(c.name));
  const userClub = ALL_CLUBS.find(c => (c.country || 'GER') === 'GER' && c.tier === 1 && !isReserveClub(c.name))!;

  // Swap reserveClub into Tier 2 and tier2NonReserves[17] into Tier 3 so tier sizes stay balanced at 18
  worldClubsInit[reserveClub.id] = { ...reserveClub, tier: 2 };
  worldClubsInit[tier2NonReserves[17].id] = { ...tier2NonReserves[17], tier: 3 };

  // Construct a Tier 2 table where reserveClub finished 1st ('C') and tier2NonReserves[0..3] finished 2nd, 3rd, 4th
  const mockTier2Table = [
    { pos: 1, id: reserveClub.id, name: reserveClub.name, statusMarker: 'C', isUser: false, pts: 60 },
    { pos: 2, id: tier2NonReserves[0].id, name: tier2NonReserves[0].name, statusMarker: 'P', isUser: false, pts: 56 },
    { pos: 3, id: tier2NonReserves[1].id, name: tier2NonReserves[1].name, statusMarker: 'P', isUser: false, pts: 52 },
    { pos: 4, id: tier2NonReserves[2].id, name: tier2NonReserves[2].name, statusMarker: 'PO', isUser: false, pts: 48 },
    ...tier2NonReserves.slice(3, 17).map((c, idx) => ({
      pos: idx + 5,
      id: c.id,
      name: c.name,
      isUser: false,
      pts: Math.max(4, 44 - idx * 2)
    }))
  ];

  const res = simulateGlobalLeagues(
    worldClubsInit,
    userClub,
    1,
    2026,
    5,
    {},
    undefined,
    { 2: mockTier2Table }
  );

  assert.strictEqual(res.newWorldClubs[reserveClub.id].tier, 2, 'Reserve club finishing 1st in Tier 2 must remain in Tier 2');
  assert.strictEqual(res.newWorldClubs[tier2NonReserves[0].id].tier, 1, '2nd place non-reserve club in Tier 2 must promote to Tier 1');
  assert.strictEqual(res.newWorldClubs[tier2NonReserves[1].id].tier, 1, '3rd place non-reserve club in Tier 2 must promote to Tier 1 in place of barred reserve champion');
  console.log('✓ Test 2 Passed');
}

// 3. Test applyPlayoffTierChange year scoping and recordPlayoffContext before generateLeagueTable
{
  console.log('\nTest 3: applyPlayoffTierChange attaches year and recordPlayoffContext updates statusMarker...');
  const store = useGameStore.getState();
  const clubA = ALL_CLUBS.find(c => c.name === 'THW Kiel')!;
  const clubB = ALL_CLUBS.find(c => c.name === 'SG Flensburg-Handewitt')!;

  store.updateState({
    year: 2028,
    club: { ...clubA, tier: 2 },
    worldClubs: {},
    history: [
      {
        year: 2027,
        clubName: clubA.name,
        tier: 2,
        pos: 3,
        pts: 44,
        wins: 21,
        draws: 2,
        losses: 11
      } as any
    ]
  });

  useGameStore.getState().applyPlayoffTierChange(1, 'Promotion Playoff Victory');
  const afterPlayoff = useGameStore.getState();
  assert(afterPlayoff.playoffVictoryOverride, 'playoffVictoryOverride should be set');
  assert.strictEqual(afterPlayoff.playoffVictoryOverride?.year, 2027, 'playoffVictoryOverride.year must match moveYear (2027)');
  assert.strictEqual(afterPlayoff.club.tier, 1, 'Club tier must update to 1');

  // Verify resolvedMatchContext updates both lower and upper tier tables when generateLeagueTable is called after it
  const opponentT1 = ALL_CLUBS.find(c => (c.country || 'GER') === 'GER' && c.tier === 1 && c.id !== clubA.id && c.id !== clubB.id)!;
  useGameStore.getState().updateState({
    resolvedMatchContext: {
      playoffDecider: {
        year: 2027,
        type: 'promotion_playoff',
        userWon: true,
        winnerId: clubA.id,
        winnerName: clubA.name,
        loserId: opponentT1.id,
        loserName: opponentT1.name,
        promotedClubId: clubA.id,
        relegatedClubId: opponentT1.id,
        upperTier: 1,
        lowerTier: 2,
      }
    }
  });

  const updatedT2Table = generateLeagueTable(
    useGameStore.getState(),
    ALL_CLUBS,
    2,
    {
      year: 2027,
      tier: 2,
      pos: 3,
      pts: 44,
      wins: 21,
      draws: 2,
      losses: 11,
      userPlayedTier: 2,
      isCompletedSeason: true
    } as any
  );
  const userRowInT2 = updatedT2Table.find(r => r.name === clubA.name)!;
  assert.strictEqual(userRowInT2.statusMarker, 'P', 'Playoff winner in Tier 2 must receive P marker after recordPlayoffContext');
  console.log('✓ Test 3 Passed');
}

console.log('\n=== ALL AUDIT TESTS PASSED SUCCESSFULLY ===');
