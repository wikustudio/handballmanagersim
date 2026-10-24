import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { LOCAL_EXTENSIONS, VERIFIED_LOCAL_ASSET_IDS, hasVerifiedLocalAsset } from '../data/teams';

console.log('Running Mod Logos Full Coverage Audit...');

// Load handball_base_database.json
const dbPath = path.join(process.cwd(), 'src/mod-data/handball_base_database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Test 1: Verify all 666 clubs have local logo assets
console.log('Test 1: Verifying all 666 clubs have physical asset files on disk...');
let missingAssets = 0;
for (const club of db) {
  const cid = club.id;
  const ext = LOCAL_EXTENSIONS[cid] || 'svg';
  const filePath = path.join(process.cwd(), 'public/assets/logos', `club_${cid}.${ext}`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing asset: club_${cid}.${ext}`);
    missingAssets++;
  }
}
assert.strictEqual(missingAssets, 0, 'All 666 clubs must have physical files in public/assets/logos/');
console.log('✓ Test 1 passed: 666/666 physical logo assets exist on disk.');

// Test 2: Verify VERIFIED_LOCAL_ASSET_IDS coverage
console.log('Test 2: Verifying VERIFIED_LOCAL_ASSET_IDS contains all 666 clubs...');
let missingVerified = 0;
for (const club of db) {
  if (!hasVerifiedLocalAsset(club.id)) {
    console.error(`Club ${club.id} not verified in teams.ts`);
    missingVerified++;
  }
}
assert.strictEqual(missingVerified, 0, 'All 666 clubs must be in VERIFIED_LOCAL_ASSET_IDS');
console.log('✓ Test 2 passed: All 666 clubs verified in teams.ts.');

// Test 3: Verify mod database canonicalization
console.log('Test 3: Verifying all clubs in database point to /assets/logos/...');
let nonLocalLogos = 0;
for (const club of db) {
  if (!club.logo || !club.logo.startsWith('/assets/logos/')) {
    console.error(`Club ${club.id} does not point to local logo: ${club.logo}`);
    nonLocalLogos++;
  }
}
assert.strictEqual(nonLocalLogos, 0, 'All 666 clubs must point to /assets/logos/ in database');
console.log('✓ Test 3 passed: 100% of mod clubs point directly to local assets.');

// Test 4: German football-associated clubs verification
console.log('Test 4: Verifying German football-associated handball clubs...');
const footballClubs = [
  { id: 152, name: '1. FC Köln' },
  { id: 174, name: 'SC Paderborn 07' },
  { id: 160, name: 'OSC Dortmund' },
  { id: 183, name: 'FC Bayern München' }
];

for (const fc of footballClubs) {
  const club = db.find((c: any) => c.id === fc.id);
  assert.ok(club, `Club ${fc.name} must exist in database`);
  assert.ok(club.logo.startsWith('/assets/logos/'), `Club ${fc.name} logo must be local`);
  assert.ok(hasVerifiedLocalAsset(fc.id), `Club ${fc.name} must be verified local asset`);
}
console.log('✓ Test 4 passed: German football-associated clubs properly verified.');

console.log('=============================================');
console.log('All Mod Logo Audit Tests Passed Successfully!');
console.log('=============================================');
