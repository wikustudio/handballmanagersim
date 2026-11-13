import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_CLUBS } from '../data/clubsData';
import { processAging, getLeagueSize } from '../engine/engine';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';

test('Tailwind v4 @theme defines --breakpoint-xs so xs: responsive utilities activate', () => {
  const cssSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
  assert.ok(
    cssSrc.includes('--breakpoint-xs:'),
    'src/index.css must declare --breakpoint-xs inside @theme so xs: classes render on mobile/desktop'
  );
});

test('Active Nemesis never triggers duplicate Hostile Rival Takeover spam across 40 consecutive rolls', () => {
  const baseClub = ALL_CLUBS[0];
  const userClub = { ...baseClub, id: 9999, name: 'User HC', tier: 1, country: 'GER', baseOvr: 75 };
  const rivalClub = ALL_CLUBS.find(c => c.country === 'GER' && c.tier === 1 && c.id !== userClub.id)!;

  for (let i = 0; i < 40; i++) {
    const incomingMapAlreadyNemesis: Record<string, any> = {
      [rivalClub.id]: { ...rivalClub, baseOvr: 90, isNemesisActive: true },
    };

    const res = simulateGlobalLeagues(
      incomingMapAlreadyNemesis,
      userClub,
      1,
      2026 + i,
      5 // User finished 5th (userWonLeague === false)
    );

    const spamMovements = res.movements.filter(
      m => (m as any).type === 'takeover' || (m as any).type === 'rival_takeover'
    );
    assert.equal(
      spamMovements.length,
      0,
      `Iteration ${i}: takeover must NEVER fire when an active nemesis already existed in the league`
    );
  }
});

test('processAging applies Champions Hangover only when wasNemesisChampion is true', () => {
  const sample = ALL_CLUBS.filter(c => c.country === 'GER' && c.tier === 1).map(c => ({ ...c }));
  const user = sample[0];
  const nonChampNemesis = { ...sample[1], baseOvr: 89, isNemesisActive: true, wasNemesisChampion: false };
  const champNemesis = { ...sample[2], baseOvr: 91, isNemesisActive: true, wasNemesisChampion: true };
  sample[1] = nonChampNemesis;
  sample[2] = champNemesis;

  const aged = processAging(sample, user.id, {
    userClubName: user.name,
    userTier: 1,
    userCountry: 'GER',
    userOvr: 85,
    consecutiveTitles: 0,
    userWonLeague: false,
    currentYear: 2028,
  });

  const afterNonChamp = aged.find(c => c.id === nonChampNemesis.id)!;
  const afterChamp = aged.find(c => c.id === champNemesis.id)!;

  assert.equal(Boolean(afterNonChamp.isNemesisActive), true, 'Non-champion nemesis must retain active status');
  assert.equal(Boolean(afterChamp.isNemesisActive), false, 'Champion nemesis must clear active status via Champions Hangover');
});

test('Dynamic league sizes map to authentic handball matchday halves (34, 30, 26)', () => {
  const gerSize = getLeagueSize(1, 'GER');
  const fraSize = getLeagueSize(1, 'FRA');
  const denSize = getLeagueSize(1, 'DEN');

  assert.equal((gerSize - 1) * 2, 34, '18-team German 1. HBL has 34 matchdays (1-17 / 18-34)');
  assert.equal((fraSize - 1) * 2, 30, '16-team French Starligue has 30 matchdays (1-15 / 16-30)');
  assert.equal((denSize - 1) * 2, 26, '14-team Danish Herreligaen has 26 matchdays (1-13 / 14-26)');

  const dockSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/MatchdayActionDock.tsx'), 'utf8');
  assert.ok(dockSrc.includes('halfMatchdays'), 'MatchdayActionDock must compute dynamic halfMatchdays');
  assert.ok(!dockSrc.includes("'MD 1–17'"), 'MatchdayActionDock must not hardcode MD 1–17 for non-18-team leagues');
});

test('WinterBreakModal wires onReturnToDashboard to Escape & Manage Club, and Dashboard guards SponsorModal + Retire', () => {
  const wbSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/WinterBreakModal.tsx'), 'utf8');
  assert.ok(wbSrc.includes('onReturnToDashboard'), 'WinterBreakModal must destructure and wire onReturnToDashboard');
  assert.ok(wbSrc.includes('Manage Club'), 'WinterBreakModal must expose a Manage Club button to return to Dashboard');

  const dashSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Dashboard.tsx'), 'utf8');
  assert.ok(dashSrc.includes('showSponsors'), 'Dashboard must track showSponsors state in modal guards');
  assert.ok(dashSrc.includes('showConfirmRetire'), 'Dashboard must guard Retire from Management behind confirmation');
  assert.ok(dashSrc.includes('preSeasonSupercupQueue.length > 0'), 'Dashboard anyModalOpen must guard preSeasonSupercupQueue');

  const dockSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/MatchdayActionDock.tsx'), 'utf8');
  assert.ok(dockSrc.includes('invisible'), 'Disabled MatchdayActionDock must apply invisible so background controls do not leak into accessibility tree');
  assert.ok(dockSrc.includes('aria-hidden={disabled || undefined}'), 'Disabled MatchdayActionDock must mark aside aria-hidden');

  const consentSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ConsentBanner.tsx'), 'utf8');
  assert.ok(!consentSrc.includes('fixed bottom-20 sm:bottom-3 left-3 z-40'), 'ConsentBanner re-open button must not float fixed over Dashboard HUD cards');
});

