import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFittedBoardFontPx,
  formatSponsorBoardText,
  normalizeReadableBoardAngle,
  resolveActiveSponsorBrands,
} from './sponsorBranding';

test('resolveActiveSponsorBrands returns empty array when no sponsor deals are signed', () => {
  assert.deepEqual(resolveActiveSponsorBrands(null), []);
  assert.deepEqual(
    resolveActiveSponsorBrands({
      year: 2026,
      seasonSponsorDealsYear: 2026,
      seasonSponsorDeals: {
        0: { status: 'available', brandName: 'Arla', brandLogo: '🥛' },
        1: { status: 'failed', brandName: 'Empty', brandLogo: '' },
        2: { status: 'available', brandName: 'JYSK', brandLogo: '🛏️' },
      },
    }),
    []
  );
});

test('resolveActiveSponsorBrands ignores stale deals from a different season year', () => {
  const stale = resolveActiveSponsorBrands({
    year: 2027,
    seasonSponsorDealsYear: 2026,
    seasonSponsorDeals: {
      0: { status: 'signed', brandName: 'Arla', brandLogo: '🥛' },
    },
  });
  assert.deepEqual(stale, []);
});

test('resolveActiveSponsorBrands prioritizes Megadeal, Partner, Performance, and Stadium Naming cleanly', () => {
  const oneSigned = resolveActiveSponsorBrands({
    year: 2026,
    seasonSponsorDealsYear: 2026,
    seasonSponsorDeals: {
      0: { status: 'signed', brandName: 'Nordic Bank', brandLogo: '🏦' },
      1: { status: 'available', brandName: 'Vestas', brandLogo: '⚡' },
    },
  });
  assert.deepEqual(oneSigned, [{ slot: 0, name: 'Nordic Bank', tierTag: 'Partner' }]);

  const withNaming = resolveActiveSponsorBrands({
    year: 2026,
    seasonSponsorDealsYear: 2026,
    seasonSponsorDeals: {
      0: { status: 'signed', brandName: 'Nordic Bank', brandLogo: '🏦' },
      1: { status: 'signed', brandName: 'Vestas Energy', brandLogo: '⚡' },
      2: { status: 'signed', brandName: 'Aalborg Portland', brandLogo: '🏗️' },
    },
    namingRightsDeal: {
      brandName: 'Würth',
      arenaName: 'Würth Arena',
      suffix: 'Arena',
      annualPayout: 450000,
      contractYears: 3,
      yearsRemaining: 3,
      signedYear: 2026,
    },
  });
  assert.deepEqual(
    withNaming.map((s) => s.name),
    ['Vestas Energy', 'Nordic Bank', 'Aalborg Portland', 'Würth']
  );

  const replaced = resolveActiveSponsorBrands({
    year: 2027,
    seasonSponsorDealsYear: 2027,
    seasonSponsorDeals: {
      0: { status: 'signed', brandName: 'Carlsberg', brandLogo: '🍺' },
      1: { status: 'signed', brandName: 'Vestas Energy', brandLogo: '⚡' },
    },
  });
  assert.deepEqual(
    replaced.map((s) => s.name),
    ['Vestas Energy', 'Carlsberg']
  );
});

test('formatSponsorBoardText preserves up to 28 chars by default and computeFittedBoardFontPx scales down long names', () => {
  assert.equal(formatSponsorBoardText('  Arla Foods  '), 'ARLA FOODS');
  assert.equal(
    formatSponsorBoardText('Sparkassen-Finanzgruppe'),
    'SPARKASSEN-FINANZGRUPPE'
  );
  assert.equal(formatSponsorBoardText('Very Long Corporate Sponsor Holdings GmbH', 14), 'VERY LONG COR…');

  const shortFont = computeFittedBoardFontPx({
    text: 'WÜRTH',
    panelSpanPx: 120,
    maxFontPx: 12,
    minFontPx: 6,
  });
  const longFont = computeFittedBoardFontPx({
    text: 'SPARKASSEN-FINANZGRUPPE',
    panelSpanPx: 120,
    maxFontPx: 12,
    minFontPx: 6,
  });
  assert.equal(shortFont, 12);
  assert.ok(longFont < shortFont && longFont >= 6, `Expected scaled font (${longFont}) < ${shortFont}`);
});

test('normalizeReadableBoardAngle flips upside-down left-goal isometric angles (~150 deg) right-side up', () => {
  const leftEndzoneIsoAngle = (150 * Math.PI) / 180; // ~2.618 rad -> upside down without normalization!
  const normalized = normalizeReadableBoardAngle(leftEndzoneIsoAngle);
  assert.ok(
    normalized > -Math.PI / 2 && normalized <= Math.PI / 2,
    `Expected angle in (-PI/2, PI/2], got ${normalized}`
  );
  assert.ok(Math.abs(normalized - (-30 * Math.PI) / 180) < 1e-6);

  const normalSidelineAngle = (28 * Math.PI) / 180;
  assert.ok(Math.abs(normalizeReadableBoardAngle(normalSidelineAngle) - normalSidelineAngle) < 1e-6);
});

test('getDynamicSponsorPitchTerms computes boosted payouts and 3 Stadium Naming Rights offers across tiers', async () => {
  const { getDynamicSponsorPitchTerms } = await import('../data/gameConstants');
  const tier1Terms = getDynamicSponsorPitchTerms({
    club: { name: 'ThSV Eisenach', tier: 1, country: 'GER', stadium: 3100, baseOvr: 78 },
    year: 2026,
  });
  const tier4Terms = getDynamicSponsorPitchTerms({
    club: { name: 'HC Elbflorenz II', tier: 4, country: 'GER', stadium: 1200, baseOvr: 60 },
    year: 2026,
  });

  assert.equal(tier1Terms.namingOffers.length, 3);
  assert.ok(tier1Terms.namingBaseAnnual > 200000);
  assert.ok(tier1Terms.standardPayout > 120000);
  assert.equal(tier4Terms.namingOffers.length, 3);
  assert.ok(tier4Terms.namingBaseAnnual > 0);
  assert.ok(tier4Terms.standardPayout > 0);
});

