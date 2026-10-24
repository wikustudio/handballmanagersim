import assert from 'assert';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { TOURNAMENT_LOGOS } from '../data/gameConstants';

// Helper mimicking the competition title resolution from KeyMatchModal
function resolveMatchBanner(matchData: {
  type: string;
  cupName?: string;
  subtitle?: string;
  title?: string;
  isEuroCup?: boolean;
}) {
  const isIhfMatch =
    matchData.type === 'ihf_final' ||
    Boolean(matchData.subtitle?.toUpperCase().includes('IHF')) ||
    Boolean(matchData.subtitle?.toUpperCase().includes('SUPER GLOBE')) ||
    Boolean(matchData.cupName?.toUpperCase().includes('IHF')) ||
    Boolean(matchData.cupName?.toUpperCase().includes('SUPER GLOBE'));

  const isEuroMatch =
    !isIhfMatch && (
      matchData.type === 'cl_sf' ||
      matchData.type === 'euro_cup_sf' ||
      matchData.type === 'cl_qf' ||
      matchData.type === 'euro_cup_qf' ||
      matchData.type === 'cl_final' ||
      matchData.type === 'euro_cup_final' ||
      Boolean(matchData.isEuroCup)
    );

  const trophyGraphicType = isIhfMatch ? 'globe' : isEuroMatch ? 'euro' : matchData.type === 'championship_decider' ? 'league' : 'cup';

  const badgeCategory = isIhfMatch
    ? 'WORLD CHAMPIONSHIP'
    : isEuroMatch
    ? 'EUROPEAN CROWN'
    : matchData.type === 'championship_decider'
    ? 'TITLE RACE'
    : matchData.type === 'playoff'
    ? 'PROMOTION PLAYOFF'
    : 'NATIONAL CUP';

  const competitionTitle = (
    matchData.cupName ||
    (isIhfMatch
      ? 'IHF Super Globe · Club World Championship'
      : (matchData.type === 'cl_sf' || matchData.type === 'cl_final'
        ? 'EHF Champions League'
        : (isEuroMatch
          ? (matchData.subtitle?.toUpperCase().includes('EUROPEAN CUP') ? 'EHF European Cup' : 'EHF European League')
          : matchData.title)))
  );

  return { isIhfMatch, isEuroMatch, trophyGraphicType, badgeCategory, competitionTitle };
}

// Helper mimicking SeasonFinishModal trophyList generation
function generateSeasonTrophyList(trophiesThisYear: any, country = 'GER', leagueName = '1. Bundesliga', cupName = 'DHB-Pokal') {
  const trophyList: { name: string; count: number }[] = [];
  const { cl, el, ecl } = getContinentalCupNames(country);

  if (trophiesThisYear?.cwc) trophyList.push({ name: 'IHF Super Globe · Club World Championship', count: Number(trophiesThisYear.cwc) || 1 });
  if (trophiesThisYear?.cl) trophyList.push({ name: cl, count: Number(trophiesThisYear.cl) || 1 });
  if (trophiesThisYear?.el) trophyList.push({ name: el, count: Number(trophiesThisYear.el) || 1 });
  if (trophiesThisYear?.ecl) trophyList.push({ name: ecl, count: Number(trophiesThisYear.ecl) || 1 });
  if (trophiesThisYear?.bl) trophyList.push({ name: leagueName, count: Number(trophiesThisYear.bl) || 1 });
  if (trophiesThisYear?.lower) trophyList.push({ name: `${leagueName} Champion`, count: Number(trophiesThisYear.lower) || 1 });
  if (trophiesThisYear?.dfb) trophyList.push({ name: cupName, count: Number(trophiesThisYear.dfb) || 1 });
  if (trophiesThisYear?.reg) trophyList.push({ name: 'Regional Cup', count: Number(trophiesThisYear.reg) || 1 });

  return trophyList;
}

console.log('Running IHF Super Globe & Silverware Tests...\n');

// -----------------------------------------------------------------------------
// TEST 1: IHF Super Globe Final Match Identity & Title Resolution
// -----------------------------------------------------------------------------
console.log('Test 1: IHF Super Globe against Barcelona');
const ihfMatch = {
  type: 'ihf_final',
  title: 'FINAL',
  subtitle: 'IHF SUPER GLOBE · CLUB WORLD CHAMPIONSHIP',
  opponentName: 'Barça',
  cupName: 'IHF Super Globe · Club World Championship'
};

const ihfRes = resolveMatchBanner(ihfMatch);
assert.strictEqual(ihfRes.isIhfMatch, true, 'ihf_final must be recognized as IHF match');
assert.strictEqual(ihfRes.isEuroMatch, false, 'IHF match must NOT be classified as European match');
assert.strictEqual(ihfRes.trophyGraphicType, 'globe', 'Trophy graphic must be globe for IHF championship');
assert.strictEqual(ihfRes.badgeCategory, 'WORLD CHAMPIONSHIP', 'Pill badge must be WORLD CHAMPIONSHIP');
assert.strictEqual(ihfRes.competitionTitle, 'IHF Super Globe · Club World Championship');
assert(!ihfRes.competitionTitle.toLowerCase().includes('euro champions cup'), 'Must never say Euro Champions Cup for IHF match');
console.log('✓ Test 1 passed: IHF Super Globe renders correct world title, globe trophy, and badge\n');

// -----------------------------------------------------------------------------
// TEST 2: Fallback when cupName is omitted on IHF match
// -----------------------------------------------------------------------------
console.log('Test 2: IHF Match without explicit cupName fallback');
const ihfMatchNoCupName = {
  type: 'ihf_final',
  title: 'FINAL',
  subtitle: 'IHF SUPER GLOBE · CLUB WORLD CHAMPIONSHIP',
};

const ihfFallbackRes = resolveMatchBanner(ihfMatchNoCupName);
assert.strictEqual(ihfFallbackRes.isIhfMatch, true);
assert.strictEqual(ihfFallbackRes.competitionTitle, 'IHF Super Globe · Club World Championship');
assert.strictEqual(ihfFallbackRes.trophyGraphicType, 'globe');
console.log('✓ Test 2 passed: Fallback correctly defaults to IHF Super Globe · Club World Championship\n');

// -----------------------------------------------------------------------------
// TEST 3: Continental European Matches do NOT say "Euro Champions Cup"
// -----------------------------------------------------------------------------
console.log('Test 3: EHF Champions League and European League naming');
const clMatch = {
  type: 'cl_final',
  title: 'FINAL',
  subtitle: 'EHF CHAMPIONS LEAGUE FINAL4',
};
const clRes = resolveMatchBanner(clMatch);
assert.strictEqual(clRes.competitionTitle, 'EHF Champions League');
assert.strictEqual(clRes.trophyGraphicType, 'euro');
assert.strictEqual(clRes.badgeCategory, 'EUROPEAN CROWN');

const elMatch = {
  type: 'euro_cup_final',
  title: 'FINAL',
  subtitle: 'EHF EURO LEAGUE · ROAD TO FINAL4',
};
const elRes = resolveMatchBanner(elMatch);
assert.strictEqual(elRes.competitionTitle, 'EHF European League');
assert.strictEqual(elRes.trophyGraphicType, 'euro');

const eclMatch = {
  type: 'euro_cup_final',
  title: 'FINAL',
  subtitle: 'EHF EUROPEAN CUP · ROAD TO GLORY',
};
const eclRes = resolveMatchBanner(eclMatch);
assert.strictEqual(eclRes.competitionTitle, 'EHF European Cup');
console.log('✓ Test 3 passed: All European competitions resolve accurate EHF tournament names\n');

// -----------------------------------------------------------------------------
// TEST 4: Individual Silverware Badges for that Season
// -----------------------------------------------------------------------------
console.log('Test 4: Individual season silverware breakdown');
// Multi-trophy season: League + Cup + Champions League + Super Globe (Quadruple)
const seasonTrophies = {
  bl: 1,
  dfb: 1,
  cl: 1,
  cwc: 1
};

const individualBadges = generateSeasonTrophyList(seasonTrophies, 'GER', '1. Bundesliga', 'DHB-Pokal');
assert.strictEqual(individualBadges.length, 4, 'Quadruple season must yield exactly 4 individual silverware badges');
assert.deepStrictEqual(
  individualBadges.map(b => b.name),
  [
    'IHF Super Globe · Club World Championship',
    'EHF Champions League',
    '1. Bundesliga',
    'DHB-Pokal'
  ],
  'Each silverware item must be individually named for that season'
);
console.log('✓ Test 4 passed: Multi-title season yields 4 distinct individual silverware badges\n');

// -----------------------------------------------------------------------------
// TEST 5: Season with No Silverware
// -----------------------------------------------------------------------------
console.log('Test 5: Season with zero silverware');
const trophylessSeason = {};
const zeroBadges = generateSeasonTrophyList(trophylessSeason);
assert.strictEqual(zeroBadges.length, 0, 'Trophyless season must produce 0 individual season badges');
console.log('✓ Test 5 passed: No misleading trophies rendered for trophyless seasons\n');

console.log('=============================================');
console.log('All Super Globe & Silverware Tests Passed Successfully!');
console.log('=============================================');
