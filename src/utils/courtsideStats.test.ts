import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCourtsideAnalytics,
  buildClubContextSummary,
  buildTrophyCollectionSummary,
  deriveArenaName,
  LiveSeasonProgress,
  resolveArenaColorScheme,
} from './courtsideStats';
import { ALL_CLUBS } from '../data/clubsData';
import { getClubHomeArena, getPinnacleArenaCapacity, MAX_ARENA_CAPACITY } from '../data/gameConstants';
import { buildArenaArchitectureModel } from './arenaArchitecture';

function createMockGameState(overrides: Record<string, any> = {}): any {
  const club = ALL_CLUBS.find((c) => c.country === 'DEN' && c.tier === 1) || ALL_CLUBS[0];
  return {
    year: 2027,
    managerName: 'Mikkel Hansen',
    directorArchetype: 'Tactician',
    tactic: 'Fast Break',
    club: {
      ...club,
      baseOvr: 84,
      stadium: 5500,
      morale: 78,
    },
    budget: 2500000,
    clubImpactScore: 68,
    reputation: 74,
    mediaPressure: 42,
    skillPoints: 5,
    history: [
      {
        year: 2026,
        clubId: club.id,
        clubName: club.name,
        country: club.country,
        tier: 1,
        pos: 1,
        pts: 48,
        wins: 23,
        draws: 2,
        losses: 1,
        gf: 858,
        ga: 690,
        stadium: 5500,
        att: 5350,
      },
    ],
    ...overrides,
  };
}

test('pre-season / Supercup start resets Season Snapshot, Scoreboard, and Shot Chart to zero', () => {
  const state = createMockGameState();
  const supercupMatch = {
    title: 'Sparekassen Danmark Super Cup',
    opponentName: 'Bjerringbro-Silkeborg',
    opponentOvr: 81,
  };

  const analytics = buildCourtsideAnalytics(state, ALL_CLUBS, 2027, true, supercupMatch, null);

  assert.equal(analytics.gamesPlayed, 0);
  assert.equal(analytics.winRatePct, '0.0');
  assert.equal(analytics.recordLabel, '0–0–0');
  assert.deepEqual(analytics.lastFive, ['—', '—', '—', '—', '—']);
  assert.equal(analytics.featuredMatch.halfLabel, 'First half');
  assert.equal(analytics.featuredMatch.userScore, 0);
  assert.equal(analytics.featuredMatch.opponentScore, 0);
  assert.equal(analytics.featuredMatch.opponentRecord, '0–0–0');
  assert.equal(analytics.shotChart.isPreSeason, true);
  assert.equal(analytics.shotChart.markers.length, 0);
  assert.equal(analytics.shotChart.creasePct, 0);
  assert.equal(analytics.coachSummary.gmName, 'Mikkel Hansen');
  assert.equal(analytics.executiveRatings.mediaPressure, 42);
});

test('live simulation progress updates Season Snapshot, Standings, Scoreboard, and Shot Chart dynamically', () => {
  const state = createMockGameState();
  const liveProgress: LiveSeasonProgress = {
    matchday: 6,
    targetEnd: 13,
    wins: 5,
    draws: 0,
    losses: 1,
    gf: 198,
    ga: 162,
    lastFive: ['W', 'W', 'L', 'W', 'W'],
    latestFixture: {
      opponentName: 'GOG',
      opponentOvr: 82,
      userGoals: 34,
      oppGoals: 29,
    },
  };

  const analytics = buildCourtsideAnalytics(state, ALL_CLUBS, 2027, true, undefined, liveProgress);

  assert.equal(analytics.gamesPlayed, 6);
  assert.equal(analytics.recordLabel, '5–0–1');
  assert.equal(analytics.winRatePct, '83.3');
  assert.deepEqual(analytics.lastFive, ['W', 'W', 'L', 'W', 'W']);
  assert.equal(analytics.featuredMatch.userScore, 34);
  assert.equal(analytics.featuredMatch.opponentScore, 29);
  assert.equal(analytics.featuredMatch.halfLabel, 'First half');
  assert.notEqual(analytics.featuredMatch.opponentRecord, '0–0–0');
  assert.equal(analytics.shotChart.isPreSeason, false);
  assert.ok(analytics.shotChart.markers.length >= 3);
  assert.ok(analytics.shotChart.creasePct > 55);

  const userStanding = analytics.adjacentStandings.find((r) => r.isUser);
  assert.ok(userStanding);
  assert.equal(userStanding?.pts, 10);
});

test('mid-season and completed historical seasons adapt shot efficiency to actual goals and outcomes', () => {
  const highScoringState = createMockGameState({
    pendingSeasonState: {
      gf: 1120,
      ga: 860,
      _meta: {
        initialRawGf: 1120,
        initialRawGa: 860,
        firstHalfOutcomes: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'D', 'W', 'W', 'W'],
      },
    },
  });
  const lowScoringState = createMockGameState({
    pendingSeasonState: {
      gf: 720,
      ga: 980,
      _meta: {
        initialRawGf: 720,
        initialRawGa: 980,
        firstHalfOutcomes: ['L', 'L', 'L', 'D', 'L', 'L', 'L', 'L', 'W', 'L', 'L', 'L', 'L'],
      },
    },
  });

  const highMid = buildCourtsideAnalytics(highScoringState, ALL_CLUBS, 2027, false);
  const lowMid = buildCourtsideAnalytics(lowScoringState, ALL_CLUBS, 2027, false);

  assert.equal(highMid.recordLabel, '12–1–0');
  assert.equal(lowMid.recordLabel, '1–1–11');
  assert.equal(highMid.featuredMatch.halfLabel, 'Second half');
  assert.equal(highMid.featuredMatch.userScore, 0);
  assert.equal(highMid.featuredMatch.opponentScore, 0);
  assert.ok(highMid.shotChart.creasePct > lowMid.shotChart.creasePct);
  assert.ok(highMid.shotChart.backcourtPct > lowMid.shotChart.backcourtPct);

  // Selecting completed 2026 season loads full-season archive stats
  const archive2026 = buildCourtsideAnalytics(highScoringState, ALL_CLUBS, 2026, true);
  assert.equal(archive2026.recordLabel, '23–2–1');
  assert.equal(archive2026.shotChart.markers.length, 24);
  assert.equal(archive2026.featuredMatch.halfLabel, 'Full time');
});

test('Club Context and Trophy Collections reconcile immediate Supercup wins, club titles, and career silverware', () => {
  const currentClub = ALL_CLUBS.find((c) => c.name.includes('Magdeburg')) || ALL_CLUBS[0];
  const formerClub = ALL_CLUBS.find((c) => c.id !== currentClub.id && c.tier === 1) || ALL_CLUBS[1];

  // 1. Fresh career state -> 0 trophies, authentic Club Context populated
  const freshState = createMockGameState({
    club: currentClub,
    history: [],
    pendingSupercupTrophies: undefined,
  });
  const ctx = buildClubContextSummary(freshState);
  assert.equal(ctx.clubName, currentClub.name);
  assert.ok(ctx.narrative.length > 20);
  assert.ok(ctx.homeArena.length > 2);
  assert.ok(ctx.leagueName.length > 2);
  assert.ok(ctx.statureLabel.length > 2);

  const zeroTrophies = buildTrophyCollectionSummary(freshState);
  assert.equal(zeroTrophies.clubTotal, 0);
  assert.equal(zeroTrophies.careerTotal, 0);
  assert.equal(zeroTrophies.hasSeparateCareer, false);
  assert.equal(zeroTrophies.club.pedestals.length, 6);

  // 2. Multi-club career with current-club Supercup pending + Champions League + former club League title
  const trophyRichState = createMockGameState({
    club: currentClub,
    pendingSupercupTrophies: { sc: 1 },
    history: [
      {
        year: 2025,
        clubId: formerClub.id,
        clubName: formerClub.name,
        country: formerClub.country,
        tier: 1,
        pos: 1,
        trophiesThisYear: { bl: 1, dfb: 1 },
      },
      {
        year: 2026,
        clubId: currentClub.id,
        clubName: currentClub.name,
        country: currentClub.country,
        tier: 1,
        pos: 1,
        trophiesThisYear: { bl: 1, cl: 1, cwc: 1 },
      },
    ],
  });

  const summary = buildTrophyCollectionSummary(trophyRichState);
  // Current club: 1 League (bl) + 1 Pending Supercup (sc) + 1 Champions League (cl) + 1 Super Globe (cwc) = 4
  assert.equal(summary.clubTotal, 4);
  assert.equal(summary.club.domesticTotal, 2);
  assert.equal(summary.club.internationalTotal, 2);
  const pedestalSum = summary.club.pedestals.reduce((acc, p) => acc + p.count, 0);
  assert.equal(pedestalSum, summary.clubTotal);

  // Career across both clubs: +1 former League + 1 former National Cup = 6 total
  assert.equal(summary.careerTotal, 6);
  assert.equal(summary.hasSeparateCareer, true);
  const careerPedestalSum = summary.career.pedestals.reduce((acc, p) => acc + p.count, 0);
  assert.equal(careerPedestalSum, summary.careerTotal);
});

test('extended standings, 30,000 max arena capacity, and 3D arena flexible attendance scale accurately', () => {
  const state = createMockGameState();
  const analytics = buildCourtsideAnalytics(state, ALL_CLUBS, 2027, true);

  // Extended left-side standings displays 9 adjacent teams for a 14-team league
  assert.equal(analytics.adjacentStandings.length, 9);

  // Denmark (Aalborg) and Germany both unlock full 30,000 max arena capacity
  assert.equal(MAX_ARENA_CAPACITY, 30000);
  assert.equal(getPinnacleArenaCapacity('DEN'), 30000);
  assert.equal(getPinnacleArenaCapacity('GER'), 30000);
  assert.equal(getPinnacleArenaCapacity('ESP'), 30000);

  // 3D arena structural bowl scales up to 30,000 seats and dynamically populates seats by attendance
  const aalborgColors = resolveArenaColorScheme('#CC141E', '#FFFFFF', '#1D4ED8', '#FFFFFF');
  const midBowl = buildArenaArchitectureModel({
    capacity: 14000,
    attendance: 7000,
    designId: 'terracotta_courtside',
    clubColors: aalborgColors,
  });
  const empty30k = buildArenaArchitectureModel({
    capacity: 30000,
    attendance: 0,
    designId: 'terracotta_courtside',
    clubColors: aalborgColors,
  });
  const half30k = buildArenaArchitectureModel({
    capacity: 30000,
    attendance: 15000,
    designId: 'terracotta_courtside',
    clubColors: aalborgColors,
  });
  const full30k = buildArenaArchitectureModel({
    capacity: 30000,
    attendance: 30000,
    designId: 'terracotta_courtside',
    clubColors: aalborgColors,
  });

  assert.equal(full30k.tier.label, '30K World Cathedral');
  assert.ok(full30k.totalVisualSeats > midBowl.totalVisualSeats);
  assert.equal(empty30k.occupiedVisualSeats, 0);
  assert.ok(half30k.occupiedVisualSeats > 0 && half30k.occupiedVisualSeats < full30k.totalVisualSeats);
  assert.equal(full30k.occupiedVisualSeats, full30k.totalVisualSeats);
});

test('SC Magdeburg Youngsters resolves to Wolfgang-Lakenmacher-Halle rather than GETEC Arena', () => {
  const scmFirstTeam = ALL_CLUBS.find((c) => c.name === 'SC Magdeburg')!;
  const scmYoungsters = ALL_CLUBS.find((c) => c.name === 'SC Magdeburg Youngsters')!;

  assert.ok(scmFirstTeam, 'SC Magdeburg must exist in ALL_CLUBS');
  assert.ok(scmYoungsters, 'SC Magdeburg Youngsters must exist in ALL_CLUBS');

  assert.equal(deriveArenaName('SC Magdeburg', 'GER'), 'GETEC Arena');
  assert.equal(deriveArenaName('SC Magdeburg Youngsters', 'GER'), 'Wolfgang-Lakenmacher-Halle');
  assert.equal(deriveArenaName('SC Magdeburg II', 'GER'), 'Wolfgang-Lakenmacher-Halle');

  assert.equal(getClubHomeArena(scmFirstTeam), 'GETEC Arena, Magdeburg');
  assert.equal(getClubHomeArena(scmYoungsters), 'Wolfgang-Lakenmacher-Halle, Magdeburg');
  assert.equal(getClubHomeArena({ name: 'SC Magdeburg II', country: 'GER' }), 'Wolfgang-Lakenmacher-Halle, Magdeburg');

  const youngstersState = createMockGameState({ club: scmYoungsters, history: [] });
  const youngstersContext = buildClubContextSummary(youngstersState);
  const youngstersAnalytics = buildCourtsideAnalytics(youngstersState, ALL_CLUBS, 2027, true);

  assert.equal(youngstersContext.homeArena, 'Wolfgang-Lakenmacher-Halle, Magdeburg');
  assert.equal(youngstersAnalytics.arenaName, 'Wolfgang-Lakenmacher-Halle');
});

test('deriveArenaName resolves ThSV Eisenach to Werner-Aßmann-Halle and respects customArenaName', () => {
  const eisenach = ALL_CLUBS.find((c) => c.name === 'ThSV Eisenach')!;
  assert.ok(eisenach, 'ThSV Eisenach must exist in ALL_CLUBS');

  assert.equal(deriveArenaName('ThSV Eisenach', 'GER', eisenach), 'Werner-Aßmann-Halle');

  const namedEisenach = { ...eisenach, customArenaName: 'Würth Arena' };
  assert.equal(deriveArenaName('ThSV Eisenach', 'GER', namedEisenach), 'Würth Arena');
  assert.equal(getClubHomeArena(namedEisenach), 'Würth Arena');

  const namedState = createMockGameState({ club: namedEisenach, history: [] });
  const analytics = buildCourtsideAnalytics(namedState, ALL_CLUBS, 2027, true);
  assert.equal(analytics.arenaName, 'Würth Arena');
});

