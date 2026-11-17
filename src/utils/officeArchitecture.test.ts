import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOfficeArchitectureModel } from './officeArchitecture';

test('buildOfficeArchitectureModel scales HQ Level 1-5 by average of Youth Academy and Medical levels', () => {
  const lv1 = buildOfficeArchitectureModel({
    tier: 1,
    baseOvr: 88,
    academyLevel: 1,
    medicalLevel: 1,
    budget: 250000,
    fanBase: 2500,
  });
  const lv2 = buildOfficeArchitectureModel({
    academyLevel: 2,
    medicalLevel: 2,
  });
  const lv3 = buildOfficeArchitectureModel({
    academyLevel: 5,
    medicalLevel: 1,
  });
  const lv4 = buildOfficeArchitectureModel({
    academyLevel: 4,
    medicalLevel: 4,
    fanBase: 5000,
  });
  const lv5 = buildOfficeArchitectureModel({
    tier: 1,
    baseOvr: 93,
    budget: 4500000,
    fanBase: 14000,
    country: 'GER',
    isPublic: true,
    ipoPrice: 18.5,
    stockPrice: 22.2,
    signedSponsorCount: 3,
    academyLevel: 5,
    medicalLevel: 5,
  });

  assert.equal(lv1.hqLevel, 1);
  assert.equal(lv1.tierId, 'clubhouse_pavilion');
  assert.equal(lv1.stories, 2);

  assert.equal(lv2.hqLevel, 2);
  assert.equal(lv2.tierId, 'modern_sport_hq');
  assert.equal(lv2.stories, 3);

  assert.equal(lv3.hqLevel, 3);
  assert.equal(lv3.tierId, 'executive_atrium');
  assert.equal(lv3.stories, 4);
  assert.equal(lv3.hasPlazaWaterFeature, true);

  assert.equal(lv4.hqLevel, 4);
  assert.equal(lv4.tierId, 'corporate_campus');
  assert.equal(lv4.stories, 5);
  assert.equal(lv4.hasRooftopTerrace, true);

  assert.equal(lv5.hqLevel, 5);
  assert.equal(lv5.tierId, 'global_plaza_tower');
  assert.equal(lv5.stories, 6);
  assert.equal(lv5.wingCount, 3);
  assert.equal(lv5.hasStockTickerFascia, true);
  assert.ok(lv5.trueValuation > lv4.trueValuation);
  assert.equal(lv5.stockDeltaPct, 20);
});

test('buildOfficeArchitectureModel normalizes white club primary colors so facade signage stays legible', () => {
  const whiteClub = buildOfficeArchitectureModel({
    tier: 1,
    baseOvr: 88,
    reputation: 80,
    clubColor: '#FFFFFF',
    clubColor2: '#D92626',
  });

  assert.equal(whiteClub.primaryHex, '#D92626');
  assert.equal(whiteClub.secondaryHex, '#1E2638');
});

test('buildOfficeArchitectureModel enables Team Bus at all HQ levels and preserves two-tone club colors', () => {
  const eisenachHq = buildOfficeArchitectureModel({
    tier: 1,
    baseOvr: 77,
    academyLevel: 1,
    medicalLevel: 1,
    clubColor: '#0054A6',
    clubColor2: '#FFFFFF',
  });

  assert.equal(eisenachHq.hasTeamBus, true);
  assert.equal(eisenachHq.busBodyHex, '#0054A6');
  assert.equal(eisenachHq.busStripeHex, '#FFFFFF');
  assert.equal(eisenachHq.clubTrimHex, '#FFFFFF');

  const bareHexHq = buildOfficeArchitectureModel({
    tier: 1,
    baseOvr: 79,
    academyLevel: 2,
    medicalLevel: 2,
    clubColor: '0055a4',
    clubColor2: 'ffffff',
  });
  assert.equal(bareHexHq.primaryHex, '#0055A4');
  assert.equal(bareHexHq.busBodyHex, '#0055A4');
  assert.equal(bareHexHq.busStripeHex, '#FFFFFF');
  assert.equal(bareHexHq.clubTrimHex, '#FFFFFF');
});


