import { describe, it } from 'node:test';
import assert from 'node:assert';
import { useGameStore } from '../store/useGameStore';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { ALL_CLUBS } from '../data/clubsData';
import { Club } from '../types';

console.log('--- RUNNING GHOST TROPHIES & COACH OVERVIEW AUDIT ---');

// Test 1: User eliminated in Domestic Cup Quarter-Final (won: false) does NOT receive ghost trophy
const testUserClub = { ...ALL_CLUBS[0], baseOvr: 84, tier: 1 };

useGameStore.setState({
    club: testUserClub,
    year: 2025,
    budget: 5000000,
    history: [],
    trophies: [],
    totals: { matches: 0, wins: 0, att: 0, trophies: 0, domTrophies: 0, intTrophies: 0 },
    cupRunResults: [
        {
            year: 2025,
            id: 'nat_cup',
            nameEn: 'National Cup',
            nameDe: 'Nationaler Pokal',
            won: false,
            exitRound: 'Quarter-Final'
        }
    ],
    cupQualifiedForSf: false
});

const simResult = useGameStore.getState().simulateSeason();
const endStoreState = useGameStore.getState();
const lastHist = endStoreState.history[endStoreState.history.length - 1];

assert.strictEqual(
    lastHist.trophiesThisYear?.dfb,
    undefined,
    'histItem.trophiesThisYear.dfb must be undefined when eliminated in QF'
);

assert.strictEqual(
    endStoreState.totals.domTrophies,
    0,
    'domTrophies must be 0 when user finished mid-table and was eliminated from cup'
);

// Verify universe movements do not crown the user for domestic cup
const userCupMovement = (endStoreState.universeMovements || []).find(m => 
    m.type === 'intl_cup' && 
    (String(m.clubId) === String(testUserClub.id) || m.clubName === testUserClub.name) &&
    (m.cupTitle?.toLowerCase().includes('pokal') || m.cupTitle?.toLowerCase().includes('cup') || m.cupTitle?.toLowerCase().includes('national'))
);
assert.strictEqual(userCupMovement, undefined, 'Universe movements must never crown an eliminated user club with a cup title');

console.log('✓ Test 1 Passed: Eliminated user in QF is strictly stripped of domestic cup ghost trophies and movements.');

// Test 2: simulateGlobalLeagues directly tested with eliminated user club
const dummyClubsMap: Record<string, Club> = {};
ALL_CLUBS.forEach(c => { dummyClubsMap[c.id] = { ...c }; });
const globalResult = simulateGlobalLeagues(
    dummyClubsMap,
    testUserClub,
    1,
    2025,
    5, // finished 5th (no league title)
    {}, // no trophies
    undefined,
    undefined,
    undefined,
    [
        {
            year: 2025,
            id: 'nat_cup',
            nameEn: 'National Cup',
            nameDe: 'Nationaler Pokal',
            won: false,
            exitRound: 'Quarter-Final'
        }
    ]
);

const crownedUserCup = globalResult.movements.find(m => 
    m.type === 'intl_cup' && 
    (String(m.clubId) === String(testUserClub.id) || m.clubName.trim().toLowerCase() === testUserClub.name.trim().toLowerCase())
);
assert.strictEqual(crownedUserCup, undefined, 'simulateGlobalLeagues must not generate intl_cup movement crowning eliminated user');

console.log('✓ Test 2 Passed: simulateGlobalLeagues verified - eliminated user is never crowned cup winner.');

console.log('========================================================================');
console.log('ALL GHOST TROPHY AUDIT TESTS PASSED SUCCESSFULLY (2/2)');
console.log('========================================================================');
