import assert from 'node:assert';
import {
  getDomesticSupercupInfo,
  getEuropeanSupercupInfo,
  getQualifiedSupercupMatches,
  COUNTRY_LEAGUES,
} from '../data/gameConstants';
import { getBroadcastingPackage } from '../data/broadcastingPackages';
import { ALL_CLUBS } from '../data/clubsData';

const ALL_20_COUNTRIES = [
  'GER', 'FRA', 'ESP', 'POL', 'DEN', 'HUN', 'CRO', 'SWE', 'POR', 'NOR',
  'ISL', 'AUT', 'SUI', 'ROU', 'MKD', 'SLO', 'ITA', 'ENG', 'USA', 'ECU',
];

console.log('--- RUNNING DOMESTIC & EUROPEAN SUPERCUP OPENER AUDIT ---');

// Test 1: All 20 countries customized in Mod ON and Mod OFF
console.log('Test 1: Verifying Domestic Supercup customization across all 20 countries...');
assert.ok(Object.keys(COUNTRY_LEAGUES).length >= 20, 'Should support all 20 countries');
for (const code of ALL_20_COUNTRIES) {
  const modOn = getDomesticSupercupInfo(code, true);
  const modOff = getDomesticSupercupInfo(code, false);

  assert.strictEqual(modOn.country, code);
  assert.strictEqual(modOff.country, code);
  assert.ok(modOn.name.length > 3, `Mod ON name missing for ${code}`);
  assert.ok(modOff.name.length > 3, `Mod OFF name missing for ${code}`);
  assert.ok(modOn.arena.length > 3, `Mod ON arena missing for ${code}`);
  assert.ok(modOff.arena.length > 3, `Mod OFF arena missing for ${code}`);
  assert.ok(modOn.capacity >= 2000, `Capacity should be realistic for ${code}`);
  assert.ok(modOn.prizeMoney > modOn.runnerUpMoney, `Winner prize should exceed runner-up for ${code}`);

  if (code === 'GER') {
    assert.strictEqual(modOn.name, 'HBL Supercup');
    assert.ok(modOn.arena.includes('PSD Bank Dome, Düsseldorf'));
    assert.strictEqual(modOff.name, 'German Supercup');
  }
  if (code === 'FRA') {
    assert.strictEqual(modOn.name, 'Trophée des Champions');
    assert.ok(modOn.arena.includes('Poitiers'));
    assert.strictEqual(modOff.name, 'French Supercup');
  }
  if (code === 'ESP') {
    assert.strictEqual(modOn.name, 'Supercopa Ibérica');
    assert.strictEqual(modOff.name, 'Spanish Supercup');
  }
  if (code === 'DEN') {
    assert.strictEqual(modOn.name, 'Bambusa Super Cup');
    assert.strictEqual(modOff.name, 'Danish Supercup');
  }
  if (code === 'POL') {
    assert.strictEqual(modOn.name, 'Superpuchar Polski');
    assert.strictEqual(modOff.name, 'Polish Supercup');
  }
}
console.log('✓ Test 1 Passed: All 20 countries verified for Mod ON and Mod OFF.');

// Test 2: European Supercup & Broadcasters
console.log('Test 2: Verifying European Supercup info and broadcasting...');
const euroModOn = getEuropeanSupercupInfo(true);
const euroModOff = getEuropeanSupercupInfo(false);

assert.strictEqual(euroModOn.name, 'EHF European Supercup');
assert.strictEqual(euroModOn.arena, 'Lanxess Arena, Cologne');
assert.strictEqual(euroModOff.name, 'Continental Supercup');
assert.strictEqual(euroModOff.arena, 'Continental Supercup Arena, Cologne');

const pkgModOnEven = getBroadcastingPackage('GER', true, {
  type: 'euro_supercup',
  title: euroModOn.name,
  year: 2026,
  isModActive: true,
});
const pkgModOnOdd = getBroadcastingPackage('GER', true, {
  type: 'euro_supercup',
  title: euroModOn.name,
  year: 2027,
  isModActive: true,
});
assert.ok(['DAZN', 'EHF TV'].includes(pkgModOnEven.networkName), 'Euro Supercup Mod ON should use DAZN or EHF TV');
assert.ok(['DAZN', 'EHF TV'].includes(pkgModOnOdd.networkName), 'Euro Supercup Mod ON should use DAZN or EHF TV');

const pkgModOff = getBroadcastingPackage('GER', true, {
  type: 'euro_supercup',
  title: euroModOff.name,
  year: 2026,
  isModActive: false,
});
assert.strictEqual(pkgModOff.isFictional, true);
assert.strictEqual(pkgModOff.networkName, 'CourtVision Euro');
console.log('✓ Test 2 Passed: European Supercup info and broadcasting verified.');

// Test 3: Season 1 Qualification
console.log('Test 3: Verifying Season 1 Supercup Curtain-Raiser qualification...');
const gerTier1 = ALL_CLUBS
  .filter(c => (c.country || 'GER') === 'GER' && c.tier === 1 && !c.isReserve)
  .sort((a, b) => (b.baseOvr || 0) - (a.baseOvr || 0) || (b.rep || 0) - (a.rep || 0) || String(a.id).localeCompare(String(b.id)));

const topClub = gerTier1[0];
const secondClub = gerTier1[1];
const midTableClub = gerTier1[6];

const matchesTop = getQualifiedSupercupMatches({ year: 2024, club: topClub, history: [] }, ALL_CLUBS, true);
assert.strictEqual(matchesTop.length, 1);
assert.strictEqual(matchesTop[0].type, 'domestic_supercup');
assert.strictEqual(matchesTop[0].title, 'HBL Supercup');
assert.strictEqual(matchesTop[0].opponent, secondClub.name);
assert.strictEqual(matchesTop[0].hostArena, 'PSD Bank Dome, Düsseldorf');

const matchesMid = getQualifiedSupercupMatches({ year: 2024, club: midTableClub, history: [] }, ALL_CLUBS, true);
assert.strictEqual(matchesMid.length, 0);
console.log('✓ Test 3 Passed: Season 1 top-2 clubs qualify for the inaugural Supercup Opener.');

// Test 4: Subsequent Season Domestic Double + Champions League Winner
console.log('Test 4: Verifying Domestic Double + Champions League winner qualification...');
const stateDoubleAndCl = {
  year: 2025,
  club: topClub,
  history: [
    {
      year: 2024,
      clubId: topClub.id,
      clubName: topClub.name,
      tier: 1,
      pos: 1,
      rivalName: secondClub.name,
      trophiesThisYear: { bl: 1, dfb: 1, cl: 1 },
      finalTable: [
        { pos: 1, name: topClub.name },
        { pos: 2, name: secondClub.name },
      ],
      resolvedMatchContext: {
        cupFinals: {
          nat_cup: {
            cupId: 'nat_cup',
            cupName: 'DHB-Pokal',
            year: 2024,
            winnerName: topClub.name,
            runnerUpName: secondClub.name,
            userWon: true,
          },
          cl: {
            cupId: 'cl',
            cupName: 'EHF Champions League',
            year: 2024,
            winnerName: topClub.name,
            runnerUpName: 'FC Barcelona',
            userWon: true,
          },
        },
      },
    },
  ],
};

const matchesDouble = getQualifiedSupercupMatches(stateDoubleAndCl, ALL_CLUBS, true);
assert.strictEqual(matchesDouble.length, 1);
assert.strictEqual(matchesDouble[0].type, 'domestic_supercup');
assert.strictEqual(matchesDouble[0].title, 'HBL Supercup');
assert.strictEqual(matchesDouble[0].userQualificationRole, 'Domestic Double Winner');
assert.strictEqual(matchesDouble[0].opponentQualificationRole, 'League Runner-Up');
assert.strictEqual(matchesDouble[0].opponent, secondClub.name);

const matchesAfterPlayed = getQualifiedSupercupMatches({ ...stateDoubleAndCl, supercupPlayedYear: 2025 }, ALL_CLUBS, true);
assert.strictEqual(matchesAfterPlayed.length, 0);
console.log('✓ Test 4 Passed: Double + CL winners qualify strictly for the Domestic Supercup and lock after completion.');
console.log('========================================================================');
console.log('ALL SUPERCUP OPENER AUDIT TESTS PASSED SUCCESSFULLY (4/4)');
console.log('========================================================================');
