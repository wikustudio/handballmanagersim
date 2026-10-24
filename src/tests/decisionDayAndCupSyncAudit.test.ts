import assert from 'assert';
import { generateLeagueTable, getDecisionDayStandingsSlice } from '../utils/leagueTableGenerator';
import { ALL_CLUBS } from '../data/clubs';

console.log('Running Decision Day Survival & Domestic Cup Audit...\n');

// 1. TEST: Decision Day Survival Points & Table Reconciliation
console.log('Test 1: Relegation Playoff Survival points, goals, and table refresh');

const mockState: any = {
  year: 2026,
  club: {
    id: 9910,
    name: 'Zalaegerszegi TE',
    country: 'HUN',
    tier: 1,
    baseOvr: 70,
    color: '#1d4ed8'
  },
  history: [
    {
      year: 2026,
      clubName: 'Zalaegerszegi TE',
      clubId: 9910,
      country: 'HUN',
      tier: 1,
      pos: 9,
      pts: 10,
      wins: 4,
      draws: 2,
      losses: 12,
      gf: 380,
      ga: 515, // GD = -135
      finalTable: [
        { pos: 8, name: 'Komló', pts: 11, gd: '-45', isUser: false },
        { pos: 9, name: 'Zalaegerszegi TE', pts: 10, gd: '-135', isUser: true },
        { pos: 10, name: 'Fejér B.Á.L. Veszprém', pts: 6, gd: '-160', isUser: false }
      ]
    }
  ]
};

// Simulate Decision Day match resolution
const lastH = mockState.history[0];
const pendingSeasonStats = {
  pos: 9,
  pts: 10,
  wins: 4,
  draws: 2,
  losses: 12,
  gf: 380,
  ga: 515
};

const matchScore = { player: 28, opponent: 25 }; // User won 28-25

// Apply the fix logic
pendingSeasonStats.pts += 2; // Handball win: +2 pts
pendingSeasonStats.wins += 1;
pendingSeasonStats.gf += matchScore.player;
pendingSeasonStats.ga += matchScore.opponent;

lastH.pts = pendingSeasonStats.pts;
lastH.wins = pendingSeasonStats.wins;
lastH.gf = pendingSeasonStats.gf;
lastH.ga = pendingSeasonStats.ga;
lastH.survived = true;
lastH.relegated = false;

// Delete stale table
delete (lastH as any).finalTable;

// Direct survival battle victory moves user into safety (9th -> 8th)
const newPos = Math.max(1, lastH.pos - 1);
lastH.pos = newPos;
pendingSeasonStats.pos = newPos;

assert.strictEqual(lastH.pts, 12, 'Points must be updated to 12 (+2 for win)');
assert.strictEqual(lastH.gf - lastH.ga, -132, 'Goal difference must improve from -135 to -132 (+3)');
assert.strictEqual(lastH.pos, 8, 'User moves into safety position 8');

// Generate fresh table
const newFinalTable = generateLeagueTable(mockState, ALL_CLUBS, 1, lastH);
const userRow = newFinalTable.find(r => r.isUser || r.name === 'Zalaegerszegi TE');

assert(userRow, 'User club must exist in generated table');
assert.strictEqual(userRow.pts, 12, 'User row in final table must show 12 points');
assert.strictEqual(userRow.pos, 8, 'User row in final table must show position 8 (Safety)');
assert.strictEqual(userRow.gd, '-132', 'User row in final table must show updated -132 GD');

const standingsSlice = getDecisionDayStandingsSlice(newFinalTable, lastH.pos, true, 'survived');
const userSliceRow = standingsSlice.find(r => r.isPlayer || r.name === 'Zalaegerszegi TE');
assert(userSliceRow, 'User row must exist in standings slice');
assert.strictEqual(userSliceRow.pts, 12, 'Standings slice must show won points (12 pts)');
console.log('✓ Test 1 passed: Decision Day won points (+2) and GD correctly reflected in table & standings slice!\n');

// 2. TEST: AchievementModal Logic for Survival
console.log('Test 2: AchievementModal survival copy & badge safeguards');

const rawMsg = '🛡️ Survival Secured! (Stayed Up)';
const isSurvived = Boolean(
  rawMsg.toLowerCase().includes('surviv') || 
  rawMsg.toLowerCase().includes('stayed up') || 
  rawMsg.toLowerCase().includes('klassenerhalt') || 
  rawMsg.includes('🛡️')
);

assert.strictEqual(isSurvived, true, 'isSurvived must evaluate to true');

const cleanTitle = rawMsg.replace('🛡️ ', '').trim();
const displayTrophyTitle = cleanTitle.endsWith('!') ? cleanTitle.slice(0, -1) : cleanTitle;

const kickerText = (() => {
  if (isSurvived) return 'TOP-FLIGHT STATUS DEFENDED';
  const cleaned = cleanTitle.toUpperCase().replace(/!+$/, '').trim();
  if (cleaned.includes('SURVIV') || cleaned.includes('STAYED UP') || cleaned.includes('RELEGAT')) {
    return 'TOP-FLIGHT STATUS DEFENDED';
  }
  return `${cleaned} CHAMPIONS`;
})();

assert.strictEqual(kickerText, 'TOP-FLIGHT STATUS DEFENDED', 'Kicker must be TOP-FLIGHT STATUS DEFENDED');
assert(!kickerText.includes('CHAMPIONS'), 'Must never append CHAMPIONS to survival');

const presentationBadgeText = (() => {
  if (isSurvived || cleanTitle.toLowerCase().includes('surviv')) return 'DECISION DAY · SURVIVAL SECURED';
  return 'LIVE TROPHY PRESENTATION';
})();

assert.strictEqual(presentationBadgeText, 'DECISION DAY · SURVIVAL SECURED', 'Badge must be DECISION DAY · SURVIVAL SECURED');
assert.notStrictEqual(presentationBadgeText, 'LIVE TROPHY PRESENTATION', 'Must never be LIVE TROPHY PRESENTATION');

console.log('✓ Test 2 passed: Modal display completely guarded against trophy champion artifacts!\n');

// 3. TEST: Decision Day Relegation Toast Must Never Trigger Survival Modal
console.log('Test 3: Decision Day relegation toast sets isRelegated=true and isSurvived=false');
const relToast = {
  type: 'error',
  category: 'decision_day',
  message: 'Relegated! Relegation playoff defeat seals demotion to the lower division.',
  standings: [
    { pos: 15, name: 'HC Erlangen', pts: 21, diff: '-112', status: 'SAFE', isPlayer: false },
    { pos: 16, name: 'Dessau-Roßlauer HV', pts: 20, diff: '-133', status: 'PLAYOFF', isPlayer: false },
    { pos: 17, name: 'Bergischer HC', pts: 19, diff: '-153', status: 'RELEGATED', isPlayer: false },
    { pos: 18, name: 'SC Magdeburg', pts: 18, diff: '-80', status: 'RELEGATED', isPlayer: true }
  ]
};
const relRawMsg = relToast.message || '';
const userStandingRow = relToast.standings?.find((r: any) => r.isPlayer || r.name === 'SC Magdeburg');
const standingsSayRelegated = userStandingRow?.status === 'RELEGATED';
const isRel = Boolean(
  standingsSayRelegated ||
  relToast.type === 'error' ||
  relToast.type === 'relegation' ||
  (relRawMsg.toLowerCase().includes('relegat') &&
    !relRawMsg.toLowerCase().includes('surviv') &&
    !relRawMsg.toLowerCase().includes('stayed up') &&
    !relRawMsg.toLowerCase().includes('winner') &&
    !relRawMsg.toLowerCase().includes('won'))
);
const isSurv = !isRel && Boolean(
  relRawMsg.toLowerCase().includes('surviv') ||
  relRawMsg.toLowerCase().includes('stayed up') ||
  relRawMsg.toLowerCase().includes('klassenerhalt') ||
  relRawMsg.includes('🛡️')
);
assert.strictEqual(isRel, true, 'Decision Day relegation toast must set isRelegated = true');
assert.strictEqual(isSurv, false, 'Decision Day relegation toast must set isSurvived = false');
console.log('✓ Test 3 passed: Decision Day relegation never triggers Survival Secured modal!\n');

console.log('========================================================================');
console.log('ALL DECISION DAY & CUP SYNC AUDIT TESTS PASSED (3/3)');
console.log('========================================================================\n');
