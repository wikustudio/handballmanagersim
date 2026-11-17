import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateMidSeasonStanding,
  evaluateMidSeasonPressure,
  evaluatePostSeasonPressure,
  generatePressureMoment,
  getPressureTier,
  resolvePressureResponse,
} from './pressureEngine';

test('getPressureTier maps numeric index to explicit tier labels and tones', () => {
  assert.equal(getPressureTier(10).id, 'calm');
  assert.equal(getPressureTier(35).id, 'watchlist');
  assert.equal(getPressureTier(58).id, 'storm');
  assert.equal(getPressureTier(76).id, 'siege');
  assert.equal(getPressureTier(92).id, 'crisis');
});

test('evaluateMidSeasonPressure triggers championship_collapse when title contender falls far short', () => {
  const res = evaluateMidSeasonPressure({
    clubId: 1,
    clubName: 'THW Kiel',
    country: 'GER',
    year: 2027,
    tier: 1,
    maxTier: 4,
    numTeams: 18,
    baseOvr: 88,
    leagueAvgOvr: 81,
    morale: 42,
    targetPos: 1,
    boardExpectsSuccess: true,
    trophyDrought: 3,
    currentMediaPressure: 25,
    currentCoachHeat: 22,
    currentGmHeat: 20,
    midSeasonPosOverride: 9, // Chasing championship (#1) but sitting #9!
  });

  assert.equal(res.context, 'championship_collapse');
  assert.equal(res.shouldTriggerMoment, true);
  assert.ok(res.mediaPressure >= 65, `Expected heavy pressure >= 65, got ${res.mediaPressure}`);
  assert.ok(res.coachHeat > 50, 'Coach heat should surge during title collapse');
  assert.ok(res.gmHeat > 45, 'GM heat should surge during title collapse');
  assert.match(res.headline, /TITLE COLLAPSE SCRUTINY/i);
});

test('evaluateMidSeasonPressure triggers relegation_spiral when trapped in relegation drop zone', () => {
  const res = evaluateMidSeasonPressure({
    clubId: 12,
    clubName: 'HBW Balingen',
    country: 'GER',
    year: 2027,
    tier: 1,
    maxTier: 4,
    numTeams: 18,
    baseOvr: 73,
    leagueAvgOvr: 80,
    morale: 38,
    targetPos: 14,
    boardExpectsSuccess: false,
    currentMediaPressure: 30,
    currentCoachHeat: 28,
    currentGmHeat: 25,
    midSeasonPosOverride: 17, // Relegation zone
  });

  assert.equal(res.context, 'relegation_spiral');
  assert.equal(res.shouldTriggerMoment, true);
  assert.ok(res.mediaPressure >= 65, `Expected relegation crisis pressure >= 65, got ${res.mediaPressure}`);
  assert.match(res.headline, /RELEGATION ALARM/i);
});

test('evaluateMidSeasonPressure cools pressure when club meets or beats mandate', () => {
  const res = evaluateMidSeasonPressure({
    clubId: 1,
    clubName: 'SC Magdeburg',
    country: 'GER',
    year: 2027,
    tier: 1,
    maxTier: 4,
    numTeams: 18,
    baseOvr: 89,
    leagueAvgOvr: 81,
    morale: 88,
    targetPos: 2,
    boardExpectsSuccess: true,
    currentMediaPressure: 52,
    currentCoachHeat: 48,
    currentGmHeat: 44,
    midSeasonPosOverride: 1,
  });

  assert.equal(res.context, 'steady');
  assert.equal(res.shouldTriggerMoment, false);
  assert.ok(res.mediaPressure < 52, 'Meeting/exceeding target must relieve media pressure');
  assert.ok(res.coachHeat < 48);
  assert.ok(res.gmHeat < 44);
});

test('evaluatePostSeasonPressure escalates pressure, consecutive streak, and board warning on championship shortfall', () => {
  const res = evaluatePostSeasonPressure({
    clubName: 'Füchse Berlin',
    country: 'GER',
    year: 2027,
    playedTier: 1,
    maxTier: 4,
    numTeams: 18,
    finalPos: 8, // Fell short by 7 places from #1 title goal
    targetPos: 1,
    boardExpectsSuccess: true,
    isGiant: true,
    wonLeague: false,
    wonAnyTrophy: false,
    relegated: false,
    promoted: false,
    currentMediaPressure: 48,
    currentCoachHeat: 45,
    currentGmHeat: 42,
    consecutivePressureSeasons: 1,
  });

  assert.equal(res.context, 'championship_collapse');
  assert.equal(res.consecutivePressureSeasons, 2);
  assert.equal(res.issueBoardWarning, true);
  assert.equal(res.issueBoardUltimatum, true);
  assert.equal(res.shouldTriggerMoment, true);
  assert.ok(res.mediaPressure >= 80, `Expected crisis pressure >= 80, got ${res.mediaPressure}`);
  assert.ok(res.impactDelta < 0);
});

test('evaluatePostSeasonPressure resets pressure streak when club wins title', () => {
  const res = evaluatePostSeasonPressure({
    clubName: 'THW Kiel',
    country: 'GER',
    year: 2028,
    playedTier: 1,
    maxTier: 4,
    numTeams: 18,
    finalPos: 1,
    targetPos: 1,
    boardExpectsSuccess: true,
    isGiant: true,
    wonLeague: true,
    wonAnyTrophy: true,
    relegated: false,
    promoted: false,
    currentMediaPressure: 75,
    currentCoachHeat: 72,
    currentGmHeat: 68,
    consecutivePressureSeasons: 2,
  });

  assert.equal(res.context, 'steady');
  assert.equal(res.consecutivePressureSeasons, 0);
  assert.equal(res.issueBoardWarning, false);
  assert.ok(res.mediaPressure <= 40);
});

test('generatePressureMoment & resolvePressureResponse apply dual Coach/GM heat trade-offs cleanly', () => {
  const moment = generatePressureMoment({
    clubName: 'SG Flensburg-Handewitt',
    country: 'GER',
    year: 2027,
    tier: 1,
    phase: 'midseason',
    context: 'championship_collapse',
    mediaPressure: 74,
    coachHeat: 78,
    gmHeat: 64,
    targetPos: 1,
    currentPos: 7,
    numTeams: 18,
    coachName: 'Nicolej Krickau',
    gmName: 'Alex Mercer',
    tactic: 'Fast Break',
  });

  assert.equal(moment.choices.length, 3);
  assert.ok(moment.journalistQuestions.some(q => q.question.includes('Nicolej Krickau')));
  assert.ok(moment.journalistQuestions.some(q => q.question.includes('Alex Mercer')));

  const backOutcome = resolvePressureResponse(
    moment,
    'back_coach',
    {
      mediaPressure: 74,
      coachHeat: 78,
      gmHeat: 64,
      morale: 52,
      reputation: 70,
      clubImpactScore: 55,
    },
    'en'
  );
  assert.ok(backOutcome);
  assert.ok(backOutcome.coachHeat < 78, 'Backing coach reduces coach heat');
  assert.ok(backOutcome.gmHeat > 64, 'Backing coach shifts scrutiny onto GM');
  assert.ok(backOutcome.morale > 52, 'Backing coach boosts dressing room morale');

  const ultimatumOutcome = resolvePressureResponse(
    moment,
    'public_ultimatum',
    {
      mediaPressure: 74,
      coachHeat: 78,
      gmHeat: 64,
      morale: 52,
      reputation: 70,
      clubImpactScore: 55,
    },
    'en'
  );
  assert.ok(ultimatumOutcome);
  assert.ok(ultimatumOutcome.coachHeat > 78, 'Ultimatum spikes coach heat');
  assert.ok(ultimatumOutcome.gmHeat < 64, 'Ultimatum relieves GM heat');
  assert.ok(ultimatumOutcome.morale < 52, 'Ultimatum introduces dressing room friction');
  assert.equal(ultimatumOutcome.secondHalfMod.ovrEffect, 1);
});

test('estimateMidSeasonStanding respects firstHalfOutcomes from SimulatingOverlay', () => {
  const est = estimateMidSeasonStanding({
    clubId: 5,
    year: 2027,
    numTeams: 18,
    baseOvr: 86,
    leagueAvgOvr: 80,
    morale: 40,
    targetPos: 1,
    boardExpectsSuccess: true,
    tier: 1,
    maxTier: 4,
    pendingSeasonState: {
      pos: 10,
      _meta: {
        firstHalfOutcomes: ['L', 'L', 'D', 'L', 'W', 'L', 'L', 'D', 'L', 'W', 'L', 'L', 'L', 'D', 'L', 'W', 'L'],
      },
    },
  });

  assert.ok(est.midSeasonPos >= 9, `Expected sluggish mid-season standing >= 9, got ${est.midSeasonPos}`);
  assert.equal(est.firstHalfWins, 3);
  assert.equal(est.shortfall, est.midSeasonPos - 1);
});

test('evaluatePostSeasonPressure triggers relegation inquest & ultimatum on drop', () => {
  const res = evaluatePostSeasonPressure({
    clubName: 'TBV Lemgo',
    country: 'GER',
    year: 2028,
    playedTier: 1,
    maxTier: 4,
    numTeams: 18,
    finalPos: 17,
    targetPos: 13,
    boardExpectsSuccess: false,
    isGiant: false,
    wonLeague: false,
    wonAnyTrophy: false,
    relegated: true,
    promoted: false,
    currentMediaPressure: 55,
    currentCoachHeat: 50,
    currentGmHeat: 45,
    consecutivePressureSeasons: 0,
  });

  assert.equal(res.context, 'relegation_spiral');
  assert.equal(res.shouldTriggerMoment, true);
  assert.equal(res.issueBoardWarning, true);
  assert.equal(res.issueBoardUltimatum, true);
  assert.ok(res.mediaPressure >= 85);
  assert.match(res.headline, /RELEGATION INQUEST/i);
});

test('reserve clubs stay insulated from crisis moments and cap heat', () => {
  const mid = evaluateMidSeasonPressure({
    clubName: 'THW Kiel II',
    year: 2027,
    tier: 3,
    maxTier: 4,
    numTeams: 16,
    baseOvr: 55,
    leagueAvgOvr: 65,
    morale: 30,
    targetPos: 8,
    boardExpectsSuccess: false,
    isReserve: true,
    currentMediaPressure: 40,
    midSeasonPosOverride: 16,
  });

  assert.equal(mid.context, 'steady');
  assert.equal(mid.shouldTriggerMoment, false);
  assert.ok(mid.mediaPressure <= 35);
});

test('resolvePressureResponse clamps boundaries and outputs German copy when lang=de', () => {
  const moment = generatePressureMoment({
    clubName: 'THW Kiel',
    country: 'GER',
    year: 2027,
    tier: 1,
    phase: 'midseason',
    context: 'relegation_spiral',
    mediaPressure: 96,
    coachHeat: 96,
    gmHeat: 96,
    targetPos: 1,
    currentPos: 17,
    numTeams: 18,
    coachName: 'F. Jícha',
    gmName: 'V. Szilágyi',
    tactic: '7v6 Empty Net',
  });

  const outcome = resolvePressureResponse(
    moment,
    'siege_mentality',
    {
      mediaPressure: 98,
      coachHeat: 98,
      gmHeat: 98,
      morale: 96,
      reputation: 1,
      clubImpactScore: 50,
    },
    'de'
  );

  assert.ok(outcome);
  assert.equal(outcome.mediaPressure, 100);
  assert.equal(outcome.morale, 100);
  assert.equal(outcome.reputation, 1);
  assert.match(outcome.resolvedMoment.resolvedReactionHeadline || '', /Wagenburg/i);
});

