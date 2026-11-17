import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBoardroomArchitectureModel } from './boardroomArchitecture';

test('buildBoardroomArchitectureModel scales seats, trophies, and board mood from live game state', () => {
  const confidentClub = buildBoardroomArchitectureModel({
    tier: 1,
    isPublic: true,
    impactScore: 84,
    mediaPressure: 18,
    signedSponsorCount: 2,
    trophyTotal: 9,
    completedGoals: 2,
    totalGoals: 3,
    clubColor: '#FFFFFF',
    clubColor2: '#D92626',
  });

  const tenseClub = buildBoardroomArchitectureModel({
    tier: 3,
    isPublic: false,
    impactScore: 32,
    mediaPressure: 74,
    signedSponsorCount: 0,
    trophyTotal: 0,
    completedGoals: 0,
    totalGoals: 3,
  });

  assert.equal(confidentClub.directorCount, 8);
  assert.equal(confidentClub.boardMood, 'confident');
  assert.equal(confidentClub.mediaStatusLabel, 'Calm');
  assert.equal(confidentClub.trophyDisplayCount, 3);
  assert.equal(confidentClub.hasShareholderWing, true);
  assert.equal(confidentClub.primaryHex, '#D92626');

  assert.equal(tenseClub.directorCount, 4);
  assert.equal(tenseClub.boardMood, 'tense');
  assert.equal(tenseClub.mediaStatusLabel, 'Hot Seat');
  assert.equal(tenseClub.trophyDisplayCount, 0);
  assert.equal(tenseClub.hasShareholderWing, false);
});
