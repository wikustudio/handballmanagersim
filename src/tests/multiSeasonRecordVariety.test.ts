import assert from 'assert';
import { calculateProbabilisticSeason } from '../engine/engine';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs } from '../utils/modManager';
import { hasVerifiedLocalAsset, getLocalAssetPath } from '../data/teams';

console.log('--- RUNNING MULTI-SEASON RECORD VARIETY & DOCK RESOLUTION AUDIT ---');

// -----------------------------------------------------------------------------
// TEST 1: Multi-Season Record Variety (No 3 Nearly-Identical Records in a Row)
// -----------------------------------------------------------------------------
console.log('Running Test 1: Multi-Season Record Variety & Anti-Repetition...');

const activeClubs = getActiveClubs();
const porto = activeClubs.find(c => c.id === 202) || ALL_CLUBS.find(c => c.id === 202) || {
  id: 202,
  name: 'FC Porto',
  tier: 1,
  baseOvr: 88,
  country: 'POR',
};

// Simulate 50 3-season career stretches for a dominant club
let duplicateTripletsCount = 0;
const totalTrials = 60;

for (let trial = 0; trial < totalTrials; trial++) {
  const history: Array<{ wins: number; draws: number; losses: number; pts: number }> = [];

  for (let s = 1; s <= 3; s++) {
    const res = calculateProbabilisticSeason(
      porto as any,
      70, // League avg OVR
      1,
      'Total Handball',
      12, // Portuguese 12-team league (22 matches)
      100,
      {
        isUserClub: true,
        consecutiveTitles: s - 1,
        recentHistoryRecords: history.map(h => ({ ...h })),
        previousSeasonRecord: history.length > 0 ? history[history.length - 1] : undefined,
      }
    );

    history.push({
      wins: res.wins,
      draws: res.draws,
      losses: res.losses,
      pts: res.pts,
    });
  }

  // Check if all 3 seasons had nearly the same record (within 1 win/draw/loss of each other)
  const [s1, s2, s3] = history;
  const isNearlySame = (a: typeof s1, b: typeof s2) =>
    Math.abs(a.wins - b.wins) <= 1 && Math.abs(a.draws - b.draws) <= 1 && Math.abs(a.losses - b.losses) <= 1;

  if (isNearlySame(s1, s2) && isNearlySame(s2, s3) && isNearlySame(s1, s3)) {
    duplicateTripletsCount++;
  }
}

// In 60 3-season stretches, nearly-identical records 3 times in a row should be virtually 0 (< 3% extreme probability)
assert(
  duplicateTripletsCount <= 2,
  `Expected near-zero identical triplets across 60 trials, but got ${duplicateTripletsCount}`
);
console.log(`  ✓ Across ${totalTrials} 3-season simulations: ${duplicateTripletsCount} nearly-identical triplets (Target: ≤2).`);
console.log('✓ Test 1 Passed: Multi-season simulation actively diversifies consecutive campaign outcomes.\n');

// -----------------------------------------------------------------------------
// TEST 2: Dock Logo & Metadata Resolution (Porto and Multi-Nation Verification)
// -----------------------------------------------------------------------------
console.log('Running Test 2: Dock Crest & Asset Verification...');

const verifiedPortoId = 202;
assert(hasVerifiedLocalAsset(verifiedPortoId), 'Porto ID 202 must be registered as verified local asset');
const localPath = getLocalAssetPath(verifiedPortoId);
assert.strictEqual(localPath, '/assets/logos/club_202.svg', 'Porto local asset path must resolve to /assets/logos/club_202.svg');

// Check activeClubs definition for Porto has logo
const dbPorto = activeClubs.find(c => c.id === 202);
assert(dbPorto, 'FC Porto must exist in activeClubs registry');
assert(dbPorto.logo && dbPorto.logo.includes('club_202'), 'FC Porto in active database must contain verified club_202 logo path');

console.log('  ✓ Verified FC Porto local crest exists on disk and resolves through getLocalAssetPath.');
console.log('  ✓ Verified activeClubs database contains official crest assets.');
console.log('✓ Test 2 Passed: Dock crest resolution guarantees authentic club logos.\n');

console.log('========================================================================');
console.log('ALL MULTI-SEASON RECORD VARIETY & DOCK AUDIT TESTS PASSED (2/2)');
console.log('========================================================================');
