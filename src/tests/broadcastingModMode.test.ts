import assert from 'node:assert';
import {
  getBroadcastingPackage,
  cleanBroadcastBadge,
  BROADCASTING_PACKAGES,
  FICTIONAL_COURTVISION_PACKAGE,
  FICTIONAL_HANDBALL_LIVE_PACKAGE,
  FICTIONAL_COURTVISION_EURO_PACKAGE,
  FICTIONAL_COURTSTREAM_PACKAGE
} from '../data/broadcastingPackages';

console.log('--- RUNNING BROADCASTING REAL DATA MOD & VECTOR LOGOS TEST SUITE ---');

// ============================================================================
// TEST 1: Mod ON produces authentic licensed broadcasters & vector logo keys
// ============================================================================
{
  console.log('\nTest 1: Authentic Broadcasters & Vector Logo Keys (Mod ON)...');

  const countries = ['GER', 'DEN', 'FRA', 'ESP', 'SWE', 'CRO', 'POR', 'NOR', 'POL', 'AUT', 'SUI'];

  countries.forEach(country => {
    const pkg = getBroadcastingPackage(country, false, { isModActive: true });
    assert(pkg.networkName && pkg.networkName.length > 0, `Package for ${country} must have networkName`);
    assert(pkg.logoKey && pkg.logoKey.length > 0, `Package for ${country} must have logoKey`);
    assert.strictEqual(pkg.isFictional, undefined, `Package for ${country} with mod ON must not be fictional`);
  });

  // Verify Germany domestic host broadcaster is Dyn Sport
  const gerPkg = getBroadcastingPackage('GER', false, { isModActive: true });
  assert.strictEqual(gerPkg.networkName, 'Dyn Sport');
  assert.strictEqual(gerPkg.logoKey, 'DYN');
  assert.strictEqual(gerPkg.primaryColor, '#ff5500');

  // Verify Germany Cup Final resolves ARD or ZDF
  const gerCup2024 = getBroadcastingPackage('GER', false, { isCupFinal: true, year: 2024, isModActive: true });
  assert(gerCup2024.networkName.includes('ARD'), 'Even years in Germany cup final should broadcast on ARD');
  assert.strictEqual(gerCup2024.logoKey, 'ARD');

  const gerCup2025 = getBroadcastingPackage('GER', false, { isCupFinal: true, year: 2025, isModActive: true });
  assert(gerCup2025.networkName.includes('ZDF'), 'Odd years in Germany cup final should broadcast on ZDF');
  assert.strictEqual(gerCup2025.logoKey, 'ZDF');

  // Verify European competition broadcast in Germany is DAZN
  const gerEuroPkg = getBroadcastingPackage('GER', true, { isModActive: true });
  assert.strictEqual(gerEuroPkg.networkName, 'DAZN');
  assert.strictEqual(gerEuroPkg.logoKey, 'DAZN');

  // Verify French and Danish authentic broadcasters
  const fraPkg = getBroadcastingPackage('FRA', false, { isModActive: true });
  assert.strictEqual(fraPkg.networkName, 'beIN SPORTS');
  assert.strictEqual(fraPkg.logoKey, 'BEIN');

  const denPkg = getBroadcastingPackage('DEN', false, { isModActive: true });
  assert.strictEqual(denPkg.networkName, 'TV 2 Sport');
  assert.strictEqual(denPkg.logoKey, 'TV2');

  console.log('✓ Test 1 Passed: Authentic broadcasters and vector logo keys verified across all nations when mod is ON.');
}

// ============================================================================
// TEST 2: Mod OFF strictly replaces real networks with fictional networks
// ============================================================================
{
  console.log('\nTest 2: Fictional Networks with Zero Real Broadcasters (Mod OFF)...');

  const bannedRealBrands = [
    'DYN', 'DAZN', 'BEIN', 'TV 2', 'ARD', 'ZDF', 'SPORTSTUDIO', 'SPORTSCHAU',
    'TELEDEPORTE', 'RTVE', 'SVT', 'ARENA SPORT', 'SPORT TV', 'POLSAT', 'TVP',
    'ORF', 'SRF', 'DR 1', 'EHFTV'
  ];

  const testScenarios = [
    { country: 'GER', isEuro: false, ctx: { isModActive: false } },
    { country: 'DEN', isEuro: false, ctx: { isModActive: false } },
    { country: 'FRA', isEuro: false, ctx: { isModActive: false } },
    { country: 'ESP', isEuro: false, ctx: { isModActive: false } },
    { country: 'SWE', isEuro: false, ctx: { isModActive: false } },
    { country: 'GER', isEuro: true, ctx: { isModActive: false } },
    { country: 'DEN', isEuro: true, ctx: { isModActive: false } },
    { country: 'GER', isEuro: false, ctx: { isCupFinal: true, isModActive: false } },
    { country: 'GER', isEuro: false, ctx: { isRelegation: true, isModActive: false } },
  ];

  testScenarios.forEach(({ country, isEuro, ctx }) => {
    const pkg = getBroadcastingPackage(country, isEuro, ctx);
    assert.strictEqual(pkg.isFictional, true, `Package for ${country} with mod OFF must be flagged as isFictional`);

    const upperName = pkg.networkName.toUpperCase();
    const upperBadge = pkg.networkBadge.toUpperCase();
    const upperTag = pkg.networkTag.toUpperCase();
    const upperBug = pkg.lowerThirdBug.toUpperCase();

    // Verify none of the banned real-world brands appear
    bannedRealBrands.forEach(banned => {
      assert(!upperName.includes(banned), `Network name "${pkg.networkName}" must not contain real brand "${banned}"`);
      assert(!upperBadge.includes(banned), `Network badge "${pkg.networkBadge}" must not contain real brand "${banned}"`);
      assert(!upperTag.includes(banned), `Network tag "${pkg.networkTag}" must not contain real brand "${banned}"`);
      assert(!upperBug.includes(banned), `Lower third "${pkg.lowerThirdBug}" must not contain real brand "${banned}"`);
    });
  });

  // Verify generic fictional network identities
  const leagueDefault = getBroadcastingPackage('GER', false, { isModActive: false });
  assert.strictEqual(leagueDefault.networkName, 'CourtVision');
  assert.strictEqual(leagueDefault.logoKey, 'COURTVISION');

  const cupDefault = getBroadcastingPackage('GER', false, { isCupFinal: true, isModActive: false });
  assert.strictEqual(cupDefault.networkName, 'Handball Live');
  assert.strictEqual(cupDefault.logoKey, 'HANDBALL_LIVE');

  const euroDefault = getBroadcastingPackage('GER', true, { isModActive: false });
  assert.strictEqual(euroDefault.networkName, 'CourtVision Euro');
  assert.strictEqual(euroDefault.logoKey, 'COURTVISION_EURO');

  const relegationDefault = getBroadcastingPackage('GER', false, { isRelegation: true, isModActive: false });
  assert.strictEqual(relegationDefault.networkName, 'CourtStream');
  assert.strictEqual(relegationDefault.logoKey, 'COURTSTREAM');

  console.log('✓ Test 2 Passed: 100% of real broadcasters replaced by CourtVision / Handball Live when mod is OFF.');
}

// ============================================================================
// TEST 3: cleanBroadcastBadge behavior under Mod ON and Mod OFF
// ============================================================================
{
  console.log('\nTest 3: cleanBroadcastBadge mod sensitivity...');

  // Fallback with mod ON should resolve DAZN LIVE
  assert.strictEqual(cleanBroadcastBadge(undefined, true), 'DAZN LIVE');
  
  // Fallback with mod OFF must resolve COURTVISION LIVE
  assert.strictEqual(cleanBroadcastBadge(undefined, false), 'COURTVISION LIVE');

  // Normalization removes duplicated tokens
  assert.strictEqual(cleanBroadcastBadge('LIVE LIVE', true), 'LIVE');
  assert.strictEqual(cleanBroadcastBadge('COURTVISION LIVE LIVE', false), 'COURTVISION LIVE');

  console.log('✓ Test 3 Passed: cleanBroadcastBadge handles mod on and mod off fallbacks cleanly.');
}

// ============================================================================
// TEST 4: German Regional Cup (Landespokal) Authentic Rights Holders
// ============================================================================
{
  console.log('\nTest 4: German Regional Cup (Landespokal) authentic rights holders and badges...');

  const regionalBroadcasters = [
    { network: 'MDR' as const, expectedName: 'MDR Sport im Osten', expectedBadge: 'LANDESPOKAL' },
    { network: 'WDR' as const, expectedName: 'WDR Sport im Westen', expectedBadge: 'LANDESPOKAL' },
    { network: 'BR' as const, expectedName: 'BR Sport', expectedBadge: 'LANDESPOKAL' },
    { network: 'SWR' as const, expectedName: 'SWR Sport', expectedBadge: 'LANDESPOKAL' },
    { network: 'SPORT1' as const, expectedName: 'Sport1', expectedBadge: 'POKAL LIVE' },
    { network: 'SPORTTOTAL' as const, expectedName: 'Sporttotal.tv', expectedBadge: 'LANDESPOKAL' },
  ];

  regionalBroadcasters.forEach(rb => {
    const pkg = getBroadcastingPackage('GER', false, { preferredNetwork: rb.network, isModActive: true });
    assert.strictEqual(pkg.networkName, rb.expectedName, `Network name for ${rb.network} must be ${rb.expectedName}`);
    assert.strictEqual(pkg.networkBadge, rb.expectedBadge, `Network badge for ${rb.network} must be ${rb.expectedBadge}`);
  });

  // Verify contextual regional cup detection in Germany
  const regCupPkg = getBroadcastingPackage('GER', false, { isRegionalCup: true, isModActive: true });
  assert(
    ['LANDESPOKAL', 'POKAL LIVE'].includes(regCupPkg.networkBadge),
    'German regional cup must resolve authentic Landespokal or Pokal Live badge'
  );

  console.log('✓ Test 4 Passed: 6/6 German regional cup rights holders & badges verified.');
}

console.log('\n======================================================');
console.log('ALL BROADCASTING REAL DATA MOD & LOGOS TESTS PASSED (4/4)');
console.log('======================================================\n');
