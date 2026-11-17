import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClubHeritageTimeline } from './clubHeritageHistory';
import { buildTrophyCollectionSummary } from './courtsideStats';
import { ALL_CLUBS } from '../data/clubsData';

test('buildClubHeritageTimeline reconstructs pre-arrival seasons and silverware when joining a club late without mutating manager career history', () => {
  const formerClub = ALL_CLUBS.find((c) => c.name === 'TBV Lemgo Lippe') || ALL_CLUBS[0];
  const joinedClub = ALL_CLUBS.find((c) => c.name === 'THW Kiel') || ALL_CLUBS[1];

  const state: any = {
    year: 2029,
    startYear: 2026,
    club: { ...joinedClub, tier: 1 },
    history: [
      {
        year: 2026,
        clubId: formerClub.id,
        clubName: formerClub.name,
        country: 'GER',
        tier: 1,
        pos: 6,
        pts: 36,
        wins: 17,
        draws: 2,
        losses: 15,
        gf: 980,
        ga: 960,
        att: 4500,
        util: 94,
      },
      {
        year: 2027,
        clubId: formerClub.id,
        clubName: formerClub.name,
        country: 'GER',
        tier: 1,
        pos: 5,
        pts: 40,
        wins: 19,
        draws: 2,
        losses: 13,
        gf: 1010,
        ga: 955,
        att: 4650,
        util: 97,
      },
      {
        year: 2028,
        clubId: joinedClub.id,
        clubName: joinedClub.name,
        country: 'GER',
        tier: 1,
        pos: 2,
        pts: 54,
        wins: 26,
        draws: 2,
        losses: 6,
        gf: 1095,
        ga: 920,
        att: 10285,
        util: 100,
        trophiesThisYear: { dfb: 1 },
      },
    ],
    universeMovements: [
      {
        id: '2026-champ-ger-1',
        year: 2026,
        clubId: String(joinedClub.id),
        clubName: joinedClub.name,
        country: 'GER',
        type: 'champion',
        fromTier: 1,
        toTier: 1,
        pos: 1,
      },
      {
        id: '2027-cup-cl',
        year: 2027,
        clubId: String(joinedClub.id),
        clubName: joinedClub.name,
        country: 'GER',
        type: 'intl_cup',
        cupTitle: 'EHF Champions League',
      },
    ],
  };

  const timeline = buildClubHeritageTimeline(state, joinedClub);

  // Should cover 2026 (pre-arrival), 2027 (pre-arrival), and 2028 (managed)
  assert.equal(timeline.length, 3);
  assert.deepEqual(
    timeline.map((h) => h.year),
    [2026, 2027, 2028]
  );
  assert.equal(timeline[0].isPreTenureClubArchive, true);
  assert.equal(timeline[0].pos, 1, '2026 champion movement must resolve to 1st place');
  assert.equal(timeline[0].trophiesThisYear?.bl, 1);

  assert.equal(timeline[1].isPreTenureClubArchive, true);
  assert.equal(timeline[1].trophiesThisYear?.cl, 1);

  assert.equal(timeline[2].isPreTenureClubArchive, false);
  assert.equal(timeline[2].pos, 2);
  assert.equal(timeline[2].trophiesThisYear?.dfb, 1);

  // Manager career history remains strictly untouched
  assert.equal(state.history.length, 3);
  assert.equal(state.history[0].clubName, formerClub.name);

  // Trophy summary separates Club Heritage (3 trophies: 2026 BL + 2027 CL + 2028 DFB) from Manager Career (1 trophy: 2028 DFB)
  const trophySummary = buildTrophyCollectionSummary(state);
  assert.equal(trophySummary.clubTotal, 3);
  assert.equal(trophySummary.careerTotal, 1);
  assert.equal(trophySummary.hasSeparateCareer, true);
});
