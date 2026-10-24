import assert from 'assert';
import { getDomesticCupInfo } from '../data/gameConstants';
import { UniverseMovement } from '../types';

console.log('Running Universe Cup Sync to Dashboard & Header Audit...\n');

// Replicate the exact trophy derivation logic used in DashboardHeader.tsx
function computeHeaderTrophies(state: {
  club: { id?: number | string; name: string; country?: string; tier?: number };
  history?: any[];
  universeMovements?: UniverseMovement[];
}) {
  const currentClubHistory = (state.history || []).filter(
    h => (h.clubName && state.club?.name && h.clubName.trim().toLowerCase() === state.club.name.trim().toLowerCase()) ||
         (state.club?.id !== undefined && h.clubId !== undefined && (String(h.clubId) === String(state.club.id) || Number(h.clubId) === Number(state.club.id)))
  );

  const allRecordedMovements: UniverseMovement[] = [];
  const seenMovementIds = new Set<string>();

  const addMovementIfNew = (m: UniverseMovement) => {
    if (!m) return;
    const key = m.id || `${m.year}-${m.clubId || m.clubName}-${m.type}-${m.cupTitle || ''}`;
    if (!seenMovementIds.has(key)) {
      seenMovementIds.add(key);
      allRecordedMovements.push(m);
    }
  };

  (state.universeMovements || []).forEach(addMovementIfNew);
  (state.history || []).forEach(h => {
    (h.universeMovements || []).forEach(addMovementIfNew);
  });

  const isCurrentClubMovement = (m: UniverseMovement) => {
    if (!m) return false;
    const nameMatch = Boolean(
      m.clubName && state.club?.name &&
      m.clubName.trim().toLowerCase() === state.club.name.trim().toLowerCase()
    );
    const idMatch = Boolean(
      state.club?.id !== undefined && m.clubId !== undefined &&
      (String(m.clubId) === String(state.club.id) || Number(m.clubId) === Number(state.club.id))
    );
    return nameMatch || idMatch;
  };

  const universeCupsThisClub = allRecordedMovements.filter(
    m => isCurrentClubMovement(m) && m.type === 'intl_cup'
  );

  let extraDfb = 0;
  let extraReg = 0;
  let extraCl = 0;
  let extraEl = 0;
  let extraEcl = 0;
  let extraCwc = 0;

  const countedCupYears = {
    cwc: new Set<number>(),
    cl: new Set<number>(),
    el: new Set<number>(),
    ecl: new Set<number>(),
    dfb: new Set<number>(),
    reg: new Set<number>(),
  };

  currentClubHistory.forEach(h => {
    if (h.trophiesThisYear?.cwc) countedCupYears.cwc.add(h.year);
    if (h.trophiesThisYear?.cl) countedCupYears.cl.add(h.year);
    if (h.trophiesThisYear?.el) countedCupYears.el.add(h.year);
    if (h.trophiesThisYear?.ecl) countedCupYears.ecl.add(h.year);
    if (h.trophiesThisYear?.dfb) countedCupYears.dfb.add(h.year);
    if (h.trophiesThisYear?.reg) countedCupYears.reg.add(h.year);
  });

  universeCupsThisClub.forEach(m => {
    const title = (m.cupTitle || '').toLowerCase();
    const yr = m.year;
    if (title.includes('super globe')) {
      if (!countedCupYears.cwc.has(yr)) {
        countedCupYears.cwc.add(yr);
        extraCwc++;
      }
    } else if (title.includes('champions league')) {
      if (!countedCupYears.cl.has(yr)) {
        countedCupYears.cl.add(yr);
        extraCl++;
      }
    } else if (title.includes('european league')) {
      if (!countedCupYears.el.has(yr)) {
        countedCupYears.el.add(yr);
        extraEl++;
      }
    } else if (title.includes('european cup')) {
      if (!countedCupYears.ecl.has(yr)) {
        countedCupYears.ecl.add(yr);
        extraEcl++;
      }
    } else if ((title.includes('pokal') || title.includes('cup') || title.includes('copa') || title.includes('coupe') || title.includes('puchar')) && !title.includes('amateur') && !title.includes('regional')) {
      if (!countedCupYears.dfb.has(yr)) {
        countedCupYears.dfb.add(yr);
        extraDfb++;
      }
    } else if (title.includes('amateur') || title.includes('regional')) {
      if (!countedCupYears.reg.has(yr)) {
        countedCupYears.reg.add(yr);
        extraReg++;
      }
    }
  });

  const clubTrophies = {
    cwc: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.cwc || 0), 0) + extraCwc,
    cl: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.cl || 0), 0) + extraCl,
    el: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.el || 0), 0) + extraEl,
    ecl: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.ecl || 0), 0) + extraEcl,
    bl: currentClubHistory.reduce((sum, h) => {
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      return sum + ((!isLower && h.trophiesThisYear?.bl) ? (h.trophiesThisYear.bl || 1) : 0);
    }, 0),
    dfb: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.dfb || 0), 0) + extraDfb,
    reg: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.reg || 0), 0) + extraReg,
    lower: currentClubHistory.reduce((sum, h) => {
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      const val = (h.trophiesThisYear?.lower || 0) + (isLower ? (h.trophiesThisYear?.bl || 0) : 0);
      return sum + val;
    }, 0),
  };

  const totalClubSilverware = Object.values(clubTrophies).reduce((a, b) => a + b, 0);
  const domCupTitle = getDomesticCupInfo(state.club.country, 1).name || 'National Cup';
  const regCupTitle = state.club.country === 'GER' ? 'DHB-Amateurpokal' : 'Regional Cup';

  const earnedTrophyBadges = [
    { key: 'cwc', label: 'Super Globe', count: clubTrophies.cwc },
    { key: 'cl', label: 'Champions League', count: clubTrophies.cl },
    { key: 'el', label: 'European League', count: clubTrophies.el },
    { key: 'ecl', label: 'European Cup', count: clubTrophies.ecl },
    { key: 'bl', label: 'League Champions', count: clubTrophies.bl },
    { key: 'dfb', label: domCupTitle, count: clubTrophies.dfb },
    { key: 'reg', label: regCupTitle, count: clubTrophies.reg },
    { key: 'lower', label: 'Lower Div', count: clubTrophies.lower },
  ].filter(t => t.count > 0);

  return { clubTrophies, totalClubSilverware, earnedTrophyBadges };
}

// TEST 1: User scenario - ASV Hamm-Westfalen in 2041 with DHB-Pokal win in history.universeMovements
console.log('Test 1: ASV Hamm-Westfalen 2041 DHB-Pokal win reconciliation');
const userState = {
  club: {
    id: 125,
    name: 'ASV Hamm-Westfalen',
    country: 'GER',
    tier: 1
  },
  history: [
    {
      year: 2038,
      clubName: 'ASV Hamm-Westfalen',
      clubId: 125,
      tier: 2,
      pos: 1,
      promoted: true,
      trophiesThisYear: { lower: 1 }
    },
    {
      year: 2041,
      clubName: 'ASV Hamm-Westfalen',
      clubId: 125,
      tier: 1,
      pos: 4,
      promoted: false,
      trophiesThisYear: {},
      universeMovements: [
        {
          id: '125-2041-cup-dfb',
          year: 2041,
          clubId: '125',
          clubName: 'ASV Hamm-Westfalen',
          country: 'GER',
          type: 'intl_cup' as const,
          cupTitle: 'DHB-Pokal',
          isKey: true
        }
      ]
    }
  ],
  universeMovements: [] // simulate case where state.universeMovements was purged/empty
};

const result = computeHeaderTrophies(userState);
console.log('Resulting clubTrophies:', result.clubTrophies);
console.log('Resulting earnedTrophyBadges:', result.earnedTrophyBadges);
console.log('Resulting totalClubSilverware:', result.totalClubSilverware);

assert.strictEqual(result.clubTrophies.dfb, 1, 'DHB-Pokal trophy count must be 1');
assert.strictEqual(result.clubTrophies.lower, 1, 'Lower division title count must be 1');
assert.strictEqual(result.totalClubSilverware, 2, 'Total silverware must be exactly 2');
assert.strictEqual(result.earnedTrophyBadges.length, 2, 'Must render exactly 2 trophy badges');
assert.strictEqual(result.earnedTrophyBadges[0].key, 'dfb', 'First badge must be DHB-Pokal');
assert.strictEqual(result.earnedTrophyBadges[0].label, 'DHB-Pokal', 'First badge label must be DHB-Pokal');
assert.strictEqual(result.earnedTrophyBadges[0].count, 1, 'DHB-Pokal count must be 1x');
assert.strictEqual(result.earnedTrophyBadges[1].key, 'lower', 'Second badge must be Lower Div');
assert.strictEqual(result.earnedTrophyBadges[1].count, 1, 'Lower Div count must be 1x');
console.log('✓ Test 1 passed: DHB-Pokal properly recognized and displayed in dashboard header!\n');

// TEST 2: Movement in state.universeMovements AND h.universeMovements does not duplicate
console.log('Test 2: Deduplication across global and season universe movements');
const stateWithDup = {
  ...userState,
  universeMovements: [
    {
      id: '125-2041-cup-dfb',
      year: 2041,
      clubId: '125',
      clubName: 'ASV Hamm-Westfalen',
      country: 'GER',
      type: 'intl_cup' as const,
      fromTier: 1,
      toTier: 1,
      cupTitle: 'DHB-Pokal',
      isKey: true
    }
  ]
};

const resDup = computeHeaderTrophies(stateWithDup);
assert.strictEqual(resDup.clubTrophies.dfb, 1, 'Must not duplicate dfb count across stores');
assert.strictEqual(resDup.totalClubSilverware, 2, 'Total silverware remains 2');
console.log('✓ Test 2 passed: No double counting on duplicate movement records.\n');

// TEST 3: Spanish club with Copa del Rey
console.log('Test 3: Spanish club Copa del Rey resolution');
const espState = {
  club: {
    id: 201,
    name: 'FC Barcelona',
    country: 'ESP',
    tier: 1
  },
  history: [
    {
      year: 2030,
      clubName: 'FC Barcelona',
      clubId: 201,
      tier: 1,
      pos: 1,
      trophiesThisYear: { bl: 1 },
      universeMovements: [
        {
          id: '201-2030-cup-dfb',
          year: 2030,
          clubId: '201',
          clubName: 'FC Barcelona',
          country: 'ESP',
          type: 'intl_cup' as const,
          cupTitle: 'Copa del Rey',
          isKey: true
        }
      ]
    }
  ]
};

const resEsp = computeHeaderTrophies(espState);
assert.strictEqual(resEsp.clubTrophies.dfb, 1, 'Copa del Rey must be counted as 1');
assert.strictEqual(resEsp.clubTrophies.bl, 1, 'League championship must be counted as 1');
assert.strictEqual(resEsp.totalClubSilverware, 2, 'Total must be 2');
const copaBadge = resEsp.earnedTrophyBadges.find(b => b.key === 'dfb');
assert(copaBadge, 'Must have Copa del Rey badge');
assert.strictEqual(copaBadge.label, 'Copa del Rey', 'Badge label must be Copa del Rey');
console.log('✓ Test 3 passed: Authentic domestic cup titles resolved correctly.\n');

console.log('========================================================================');
console.log('ALL UNIVERSE CUP TO DASHBOARD SYNC TESTS PASSED SUCCESSFULLY (3/3)');
console.log('========================================================================\n');
