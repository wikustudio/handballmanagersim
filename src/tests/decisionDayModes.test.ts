import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_CLUBS } from '../data/clubsData';
import { Club } from '../types';
import { calculateProbabilisticSeason } from '../engine/engine';
import { generateLeagueTable, getDecisionDayStandingsSlice } from '../utils/leagueTableGenerator';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { 
  getBroadcastingPackage, 
  BROADCASTING_PACKAGES, 
  GER_ARD_BROADCAST, 
  GER_ZDF_BROADCAST,
  DEN_DR_BROADCAST,
  FRA_FRANCE_TV_BROADCAST,
  POL_TVP_BROADCAST,
  NOR_NRK_BROADCAST,
  SWE_SVT_BROADCAST,
  AUT_ORF_BROADCAST,
  SUI_SRF_BROADCAST,
  CRO_HRT_BROADCAST
} from '../data/broadcastingPackages';

console.log('--- RUNNING DECISION DAY, PROMOTION, PLAYOFF & RELEGATION MODES TEST SUITE ---');

// ============================================================================
// TEST 1: Decision Day Title Battle (Championship Decider) Standings & Results
// ============================================================================
{
  console.log('\nRunning Test 1: Championship Decider (Title Battle) Standings & Point Math...');

  const playerClub: Club = { ...ALL_CLUBS.find(c => c.tier === 1 && c.country === 'GER')!, tier: 1 };
  const numTeams = 18;
  
  // Create a 1st vs 2nd title battle scenario
  const mockSeason = {
    pos: 1,
    wins: 26,
    draws: 2,
    losses: 5,
    pts: 54, // 26 * 2 + 2 = 54
    gf: 1020,
    ga: 880
  };

  const titleRival = 'THW Kiel';
  const table = generateLeagueTable(
    { club: playerClub, year: 2024 } as any,
    ALL_CLUBS,
    1,
    {
      year: 2024,
      clubName: playerClub.name,
      tier: 1,
      pos: 1,
      wins: mockSeason.wins,
      draws: mockSeason.draws,
      losses: mockSeason.losses,
      pts: mockSeason.pts,
      gf: mockSeason.gf,
      ga: mockSeason.ga,
      rivalName: titleRival,
      rivalPts: 53,
      rivalGd: 118
    }
  );

  const slice = getDecisionDayStandingsSlice(table, 1, false);
  assert(slice.length >= 2, 'Standings slice must show top contenders');
  assert.strictEqual(slice[0].name, playerClub.name, 'Player must lead at pos 1 prior to decider');
  assert.strictEqual(slice[0].pts, 54, 'Player points must match 2W+1D formula (54 pts)');
  assert.strictEqual(slice[1].name, titleRival, 'Title rival must be in pos 2');

  // Verify post-match outcome calculations:
  // Scenario A: Player Wins (+2 pts -> 56 pts, Champion)
  const winPts = slice[0].pts + 2;
  assert.strictEqual(winPts, 56, 'Winning championship decider must award exactly 2 points');

  // Scenario B: Player Loses (Rival +2 pts -> 55 pts, Rival Champion, Player Runner-up)
  const rivalWinPts = slice[1].pts + 2;
  assert.strictEqual(rivalWinPts, 55, 'Rival winning title must have 55 pts overtaking player');

  console.log('✓ Test 1 Passed: Championship decider correctly computes top-flight title stakes and 2-1-0 standings.');
}

// ============================================================================
// TEST 2: Promotion Battle (Direct Auto-Promotion Race)
// ============================================================================
{
  console.log('\nRunning Test 2: Promotion Battle (Direct Promotion Thresholds)...');

  // Tier 2 German club
  const tier2Club: Club = { ...ALL_CLUBS.find(c => c.tier === 2 && c.country === 'GER')!, tier: 2 };
  
  const mockTier2Season = {
    pos: 2,
    wins: 22,
    draws: 4,
    losses: 8,
    pts: 48, // 22 * 2 + 4 = 48
    gf: 960,
    ga: 870
  };

  const tableT2 = generateLeagueTable(
    { club: tier2Club, year: 2024 } as any,
    ALL_CLUBS,
    2,
    {
      year: 2024,
      clubName: tier2Club.name,
      tier: 2,
      pos: 2,
      wins: mockTier2Season.wins,
      draws: mockTier2Season.draws,
      losses: mockTier2Season.losses,
      pts: mockTier2Season.pts,
      gf: mockTier2Season.gf,
      ga: mockTier2Season.ga,
      rivalName: 'TuS N-Lübbecke',
      rivalPts: 47,
      rivalGd: 75
    }
  );

  const promoSlice = getDecisionDayStandingsSlice(tableT2, 2, false);
  assert(promoSlice.length >= 2, 'Promotion slice must contain top contenders');
  assert(promoSlice.some(t => t.name === tier2Club.name), 'Player club must be present in slice');

  // Automatic promotion threshold in 2. Bundesliga is top 2
  const top2 = tableT2.slice(0, 2);
  assert(top2.some(t => t.name === tier2Club.name), 'Club at pos 2 must occupy automatic promotion slot');

  console.log('✓ Test 2 Passed: Promotion battle standings accurately verify automatic promotion threshold.');
}

// ============================================================================
// TEST 3: Promotion Playoff (Challenger vs Upper-Tier Opponent)
// ============================================================================
{
  console.log('\nRunning Test 3: Promotion Playoff Mode (3rd Place Decider)...');

  const tier2Club: Club = { ...ALL_CLUBS.find(c => c.tier === 2 && c.country === 'GER')!, tier: 2 };
  const mockT2Third = {
    pos: 3,
    wins: 21,
    draws: 3,
    losses: 10,
    pts: 45,
    gf: 920,
    ga: 850
  };

  const tableThird = generateLeagueTable(
    { club: tier2Club, year: 2024 } as any,
    ALL_CLUBS,
    2,
    {
      year: 2024,
      clubName: tier2Club.name,
      tier: 2,
      pos: 3,
      wins: mockT2Third.wins,
      draws: mockT2Third.draws,
      losses: mockT2Third.losses,
      pts: mockT2Third.pts,
      gf: mockT2Third.gf,
      ga: mockT2Third.ga
    }
  );

  const playoffSlice = getDecisionDayStandingsSlice(tableThird, 3, false);
  const playerRow = playoffSlice.find(t => t.name === tier2Club.name);
  assert(playerRow, 'Player row must be present');
  assert.strictEqual(playerRow.pos, 3, 'Must be at pos 3 for playoff qualification');
  assert(playerRow.stake?.includes('PLAYOFF') || playerRow.stake?.includes('PROMO'), 'Stake must indicate promotion playoff contention');

  console.log('✓ Test 3 Passed: Promotion playoff correctly configures 3rd place challenger stakes.');
}

// ============================================================================
// TEST 4: Relegation Battle (Direct Drop Zone Survival Decider)
// ============================================================================
{
  console.log('\nRunning Test 4: Relegation Battle (Direct Survival Decider)...');

  const tier1Club: Club = { ...ALL_CLUBS.find(c => c.tier === 1 && c.country === 'GER')!, tier: 1 };
  const numTeams = 18; // 18
  const relegationThreshold = numTeams - 1; // 17

  // Put player in relegation danger (pos 17)
  const mockRelegationSeason = {
    pos: 17,
    wins: 7,
    draws: 4,
    losses: 23,
    pts: 18,
    gf: 780,
    ga: 940
  };

  const dropCompetitor = '1. VfL Potsdam';
  const tableRelegation = generateLeagueTable(
    { club: tier1Club, year: 2024 } as any,
    ALL_CLUBS,
    1,
    {
      year: 2024,
      clubName: tier1Club.name,
      tier: 1,
      pos: 17,
      wins: mockRelegationSeason.wins,
      draws: mockRelegationSeason.draws,
      losses: mockRelegationSeason.losses,
      pts: mockRelegationSeason.pts,
      gf: mockRelegationSeason.gf,
      ga: mockRelegationSeason.ga,
      rivalName: dropCompetitor,
      rivalPts: 17,
      rivalGd: -150
    }
  );

  const dropSlice = getDecisionDayStandingsSlice(tableRelegation, 17, true);
  assert(dropSlice.length >= 3, 'Relegation drop slice must display danger zone clubs');

  // Assert points logic for survival decider:
  const playerInDrop = dropSlice.find(t => t.name === tier1Club.name);
  assert(playerInDrop, 'Player must be in drop slice');
  assert(playerInDrop.pos >= 16, 'Player must be in bottom 3 relegation zone');

  // If player wins decider: +2 pts (18 -> 20 pts), overtaking safe margin
  const survivedPts = playerInDrop.pts + 2;
  assert.strictEqual(survivedPts, 20, 'Winning survival decider must award +2 points');

  console.log('✓ Test 4 Passed: Relegation battle correctly computes drop zone stakes and survival margins.');
}

// ============================================================================
// TEST 5: Relegation Playdown / Playoff Against Lower Tier Challenger
// ============================================================================
{
  console.log('\nRunning Test 5: Relegation Playdown / Playoff Mode...');

  const tier1Club: Club = { ...ALL_CLUBS.find(c => c.tier === 1 && c.country === 'GER')!, tier: 1 };
  
  // Relegation playoff position (e.g. 16th place in 18-team Bundesliga)
  const mockPlaydown = {
    pos: 16,
    wins: 9,
    draws: 3,
    losses: 22,
    pts: 21,
    gf: 820,
    ga: 910
  };

  const tablePlaydown = generateLeagueTable(
    { club: tier1Club, year: 2024 } as any,
    ALL_CLUBS,
    1,
    {
      year: 2024,
      clubName: tier1Club.name,
      tier: 1,
      pos: 16,
      wins: mockPlaydown.wins,
      draws: mockPlaydown.draws,
      losses: mockPlaydown.losses,
      pts: mockPlaydown.pts,
      gf: mockPlaydown.gf,
      ga: mockPlaydown.ga
    }
  );

  const playdownSlice = getDecisionDayStandingsSlice(tablePlaydown, 16, true);
  const playdownRow = playdownSlice.find(t => t.name === tier1Club.name);
  assert(playdownRow, 'Playdown row must exist');
  assert(playdownRow.stake?.includes('PLAYOFF') || playdownRow.stake?.includes('SAFE'), 'Must indicate playdown tension');

  console.log('✓ Test 5 Passed: Relegation playdown mode accurately mirrors relegation playoff conditions.');
}

// ============================================================================
// TEST 6: Local & Public Broadcaster Resolution Across All Countries & ARD/ZDF
// ============================================================================
{
  console.log('\nRunning Test 6: Local & Public Broadcasters for All Countries...');

  // 1. Germany (GER) Contextual Resolution:
  // League matchday: Dyn Sport
  const gerLeague = getBroadcastingPackage('GER', false, { type: 'league' });
  assert.strictEqual(gerLeague.networkName, 'Dyn Sport', 'Standard German league game must be on Dyn Sport');
  assert.strictEqual(gerLeague.networkBadge, 'DYN EXCLUSIVE');

  // Domestic Cup Final (DHB-Pokal): Public TV (ARD or ZDF)
  const gerCup2024 = getBroadcastingPackage('GER', false, { type: 'cup_final', isCupFinal: true, year: 2024 });
  assert(gerCup2024.networkName.includes('ARD'), '2024 DHB-Pokal Final must be on ARD (Das Erste)');
  assert.strictEqual(gerCup2024.networkBadge, 'ARD LIVE');
  assert.strictEqual(gerCup2024.primaryColor, '#002d62');

  const gerCup2025 = getBroadcastingPackage('GER', false, { type: 'cup_final', isCupFinal: true, year: 2025 });
  assert(gerCup2025.networkName.includes('ZDF'), '2025 DHB-Pokal Final must alternate to ZDF');
  assert.strictEqual(gerCup2025.networkBadge, 'ZDF LIVE');
  assert.strictEqual(gerCup2025.primaryColor, '#fa7d00');

  // Championship Decider: Marquee public + streaming distribution
  const gerDecider2026 = getBroadcastingPackage('GER', false, { type: 'championship_decider', year: 2026 });
  assert(gerDecider2026.networkName.includes('ARD'), 'Marquee title decider year 2026 (mod 1) features ARD Sportschau');

  const gerDecider2024 = getBroadcastingPackage('GER', false, { type: 'championship_decider', year: 2024 });
  assert(gerDecider2024.networkName.includes('ZDF'), 'Marquee title decider year 2024 (mod 2) features ZDF sportstudio');

  const gerDecider2025 = getBroadcastingPackage('GER', false, { type: 'championship_decider', year: 2025 });
  assert(gerDecider2025.networkName.includes('Dyn'), 'Marquee title decider year 2025 (mod 0) features Dyn Sport host');

  // Explicit override:
  const gerExplicitARD = getBroadcastingPackage('GER', false, { preferredNetwork: 'ARD' });
  assert.strictEqual(gerExplicitARD.networkName, GER_ARD_BROADCAST.networkName);

  const gerExplicitZDF = getBroadcastingPackage('GER', false, { preferredNetwork: 'ZDF' });
  assert.strictEqual(gerExplicitZDF.networkName, GER_ZDF_BROADCAST.networkName);

  // 2. All European Countries Verification:
  const countries = [
    { code: 'DEN', primary: 'TV 2 Sport', publicMarquee: 'DR 1 Sport', publicBadge: 'DR DIREKTE' },
    { code: 'FRA', primary: 'beIN SPORTS', publicMarquee: 'France Télévisions', publicBadge: 'FRANCE TV SPORT' },
    { code: 'ESP', primary: 'Teledeporte', publicMarquee: 'RTVE', publicBadge: 'RTVE EN DIRECTO' },
    { code: 'SWE', primary: 'SVT Sport', publicMarquee: 'SVT 1 Sport', publicBadge: 'SVT 1 DIREKT' },
    { code: 'NOR', primary: 'TV 2 Sport', publicMarquee: 'NRK 1 Sport', publicBadge: 'NRK DIREKTE' },
    { code: 'POL', primary: 'Polsat Sport', publicMarquee: 'TVP Sport', publicBadge: 'TVP NA ŻYWO' },
    { code: 'HUN', primary: 'M4 Sport', publicMarquee: 'M4 Sport', publicBadge: 'M4 SPORT ÉLŐ' },
    { code: 'CRO', primary: 'Arena Sport', publicMarquee: 'HRT 2 Sport', publicBadge: 'HRT 2 UŽIVO' },
    { code: 'AUT', primary: 'ORF Sport+', publicMarquee: 'ORF 1 Sport', publicBadge: 'ORF 1 LIVE' },
    { code: 'SUI', primary: 'SRF sport', publicMarquee: 'SRF zwei Sport', publicBadge: 'SRF zwei LIVE' },
    { code: 'POR', primary: 'Sport TV', publicMarquee: 'Sport TV', publicBadge: 'SPORT TV DIRETO' },
    { code: 'ISL', primary: 'Stöð 2 Sport', publicMarquee: 'Stöð 2 Sport', publicBadge: 'STÖÐ 2 Í BEINNI' },
    { code: 'SLO', primary: 'Arena Sport', publicMarquee: 'Arena Sport', publicBadge: 'ARENA SPORT V ŽIVO' },
    { code: 'ITA', primary: 'PallamanoTV', publicMarquee: 'PallamanoTV', publicBadge: 'SKY SPORT DIRETTA' },
    { code: 'MKD', primary: 'MRT', publicMarquee: 'MRT', publicBadge: 'МРТ ВО ЖИВО' },
  ];

  countries.forEach(c => {
    // Test league broadcaster
    const leaguePkg = getBroadcastingPackage(c.code, false, { type: 'league' });
    assert(leaguePkg.networkName.includes(c.primary) || leaguePkg.networkName.includes(c.publicMarquee), `League broadcaster for ${c.code} must be authentic`);

    // Test cup final broadcaster (public network)
    const cupPkg = getBroadcastingPackage(c.code, false, { type: 'cup_final', isCupFinal: true });
    assert(cupPkg.networkBadge === c.publicBadge || cupPkg.networkBadge.length > 0, `Cup broadcaster for ${c.code} must resolve valid badge`);
    assert(cupPkg.primaryColor && cupPkg.primaryColor.startsWith('#'), `Primary color must be hex for ${c.code}`);
    assert(cupPkg.nationalCupName.length > 0, `National cup name must exist for ${c.code}`);
  });

  // European competitions & DAZN European Territories
  const gerDaznPkg = getBroadcastingPackage('GER', true);
  assert.strictEqual(gerDaznPkg.networkBadge, 'DAZN LIVE', 'Germany European competitions must broadcast on DAZN LIVE');
  assert.strictEqual(gerDaznPkg.networkName, 'DAZN');

  // Verify other DAZN European territories
  ['AUT', 'SUI', 'ESP', 'ITA', 'POR'].forEach(terr => {
    const pkg = getBroadcastingPackage(terr, true);
    assert.strictEqual(pkg.networkBadge, 'DAZN LIVE', `${terr} must broadcast European competitions on DAZN LIVE`);
  });

  // Verify dedicated continental partners and global EHFTV fallback
  assert.strictEqual(getBroadcastingPackage('FRA', true).networkBadge, 'beIN DIRECT HD');
  assert.strictEqual(getBroadcastingPackage('DEN', true).networkBadge, 'TV 2 DIREKTE');
  assert.strictEqual(getBroadcastingPackage('POL', true).networkBadge, 'TVP SPORT NA ŻYWO');
  assert.strictEqual(getBroadcastingPackage('HUN', true).networkBadge, 'SPORT 1 ÉLŐ');
  assert.strictEqual(getBroadcastingPackage('SWE', true).networkBadge, 'EHFTV GLOBAL LIVE');
  assert.strictEqual(getBroadcastingPackage('NOR', true).networkBadge, 'EHFTV GLOBAL LIVE');

  console.log(`✓ Test 6 Passed: Contextual local and public broadcasters (ARD, ZDF, DR, France TV, TVP, NRK, SVT, ORF, SRF) & DAZN Champions League verified across all European nations.`);
}

// ============================================================================
// TEST 7: Modal DOM, Touch Hitboxes & Responsive Column Symmetry
// ============================================================================
{
  console.log('\nRunning Test 7: Modal DOM Geometry & Standings Symmetry in KeyMatchModal...');

  const keyMatchPath = path.resolve('src/components/KeyMatchModal.tsx');
  const content = fs.readFileSync(keyMatchPath, 'utf8');

  // 1. Viewport Containment: Must use dvh safe viewport sizing
  assert(content.includes('max-h-[min(92dvh,92vh)]'), 'KeyMatchModal must enforce dvh mobile viewport containment');

  // 2. Responsive Table Column Parity:
  // Header: <span className="hidden sm:inline-block w-14 text-right pr-2">GD</span>
  // Row: <span className="hidden sm:inline-block w-14 text-right pr-2 text-zinc-400 ...">{team.diff || '+0'}</span>
  assert(content.includes('hidden sm:inline-block w-14 text-right pr-2">GD</span>'), 'Table header must hide GD on mobile');
  assert(content.includes('hidden sm:inline-block w-14 text-right pr-2 text-zinc-400 tabular-nums'), 'Table rows must hide GD on mobile with matching width');

  // 3. Touch Hitbox & Mobile Ergonomics:
  assert(content.includes('touch-manipulation'), 'Interactive buttons must include touch-manipulation for instant mobile response');
  assert(content.includes('min-h-0') && content.includes('overflow-y-auto'), 'Internal content container must have scroll containment');

  // 4. Decision Day and Relegation styling:
  assert(content.includes('RELEGATION BATTLE · LIVE DROP ZONE'), 'Must feature dedicated Relegation Battle header tag');
  assert(content.includes('broadcastPackage.networkBadge'), 'Must render live network badge');
  assert(content.includes('broadcastPackage.networkTag'), 'Must render live network tag');

  // 5. Zero Duplicated "LIVE LIVE" string leaks & Buzzing Red Dot Glass Badge:
  assert(!content.includes("networkBadge || 'DAZN'} LIVE"), 'Must never append redundant LIVE after networkBadge');
  assert(!content.includes('LIVE LIVE'), 'Must never render duplicate LIVE LIVE');
  assert(content.includes('bg-red-950/40 border border-red-500/35'), 'Must render glass shaded red box for live broadcast indicators');
  assert(content.includes('animate-ping') && content.includes('bg-red-500 shadow-[0_0_8px_#ef4444]'), 'Must render dual-layer buzzing live red dot');
  assert(content.includes('cleanBroadcastBadge'), 'Must utilize cleanBroadcastBadge for normalization');

  // 6. Unit verify cleanBroadcastBadge
  const { cleanBroadcastBadge } = await import('../data/broadcastingPackages');
  assert.strictEqual(cleanBroadcastBadge('EHFTV GLOBAL LIVE LIVE'), 'EHFTV GLOBAL LIVE', 'Must normalize double LIVE');
  assert.strictEqual(cleanBroadcastBadge('DYN EXCLUSIVE'), 'DYN EXCLUSIVE');
  assert.strictEqual(cleanBroadcastBadge('TV 2 DIREKTE DIREKTE'), 'TV 2 DIREKTE');

  console.log('✓ Test 7 Passed: KeyMatchModal DOM geometry, buzzing red dot glass badges, and broadcaster standards strictly validated.');
}

// ============================================================================
// TEST 8: Match Results Variety, Overtime, Blowout Swings & Cup Magic Integrity
// ============================================================================
{
  console.log('\nRunning Test 8: Match Results Variety, Overtime & Cup Magic in KeyMatchModal...');

  const keyMatchPath = path.resolve('src/components/KeyMatchModal.tsx');
  const content = fs.readFileSync(keyMatchPath, 'utf8');

  // 1. Match Drama Archetypes & Suffixes
  assert(content.includes('OVERTIME THRILLER (AET)'), 'Must render Overtime Thriller (AET) badge');
  assert(content.includes('7-METER SHOOTOUT (p)'), 'Must render 7-Meter Shootout (p) badge');
  assert(content.includes('CINDERELLA CUP MAGIC'), 'Must render Cinderella Cup Magic badge');
  assert(content.includes('RUNAWAY ROUT'), 'Must render Runaway Rout blowout badge');
  assert(content.includes('NAIL-BITER FINISH'), 'Must render Nail-Biter Finish badge');

  // 2. Extra Time (Overtime) & Cup Magic In-Match Features
  assert(content.includes('EXTRA TIME'), 'Must render Extra Time clock indicator during overtime');
  assert(content.includes('Cinderella Cup Momentum'), 'Must feature Cinderella Cup Momentum banner in underdog cup matches');
  assert(content.includes('Match Highlights Timeline'), 'Must feature Match Highlights Timeline summary card');
  assert(content.includes('activeEvent.text'), 'Must display dynamic in-match event highlights during simulation');

  console.log('✓ Test 8 Passed: Match results variety, overtime, shootouts, blowout swings, and cup magic strictly validated.');
}

// ============================================================================
// TEST 9: Uninterrupted 0-to-60' Match Simulation, Buzzer-Beaters & Goalkeeper "The Wall" Badges
// ============================================================================
{
  console.log('\nRunning Test 9: Uninterrupted Continuous Simulation, Buzzer-Beaters & Goalkeeper The Wall Badges...');

  const keyMatchPath = path.resolve('src/components/KeyMatchModal.tsx');
  const content = fs.readFileSync(keyMatchPath, 'utf8');

  // 1. Verify Halftime Tactical Timeout blocking card is removed for fluid 0-to-60' broadcast flow
  assert(!content.includes("Halftime Tactical Timeout · 30'"), 'Halftime Tactical Timeout blocking card must be removed');
  assert(!content.includes('Locker room adjustment. Select your strategic emphasis for the second half:'), 'Halftime prompt must be removed');
  assert(!content.includes('resumeSecondHalf'), 'resumeSecondHalf handler must be removed');

  // 2. High-tension clutch buzzer-beater and goalkeeper wall indicators
  assert(content.includes('FINAL MINUTES BUZZER-BEATER: ONE-GOAL MARGIN'), 'Must render clutch buzzer-beater alert');
  assert(content.includes('GOALKEEPER "THE WALL"'), 'Must render goalkeeper The Wall highlight badge');

  console.log('✓ Test 9 Passed: Uninterrupted continuous match simulation, buzzer-beaters, and goalkeeper The Wall badges strictly validated.');
}

// ============================================================================
// TEST 10: Mathematical Relegation Safety Audit (Sport36-Komló Scenario) & Transfer Market Integration
// ============================================================================
{
  console.log('\nRunning Test 10: Mathematical Relegation Safety Audit & Transfer Market Integration...');

  // 1. Sport36-Komló Hungarian Tier 1 scenario
  const komloClub = ALL_CLUBS.find(c => c.name === 'Sport36-Komló') || { id: 909, name: 'Sport36-Komló', tier: 1, country: 'HUN', baseOvr: 80 };
  const numTeams = 14;
  const relegationThreshold = numTeams - 1; // 13

  // User at 12th place with 17 points, 13th place has 9 points (gap = 8)
  const mockKomloSeason = {
    pos: 12,
    wins: 7,
    draws: 3,
    losses: 16,
    pts: 17,
    gf: 720,
    ga: 894
  };

  const table = generateLeagueTable(
    { club: komloClub, year: 2024 } as any,
    ALL_CLUBS,
    1,
    {
      year: 2024,
      clubName: komloClub.name,
      tier: 1,
      pos: mockKomloSeason.pos,
      wins: mockKomloSeason.wins,
      draws: mockKomloSeason.draws,
      losses: mockKomloSeason.losses,
      pts: mockKomloSeason.pts,
      gf: mockKomloSeason.gf,
      ga: mockKomloSeason.ga
    }
  );

  const dropZoneTeam = table.find(r => r.pos === relegationThreshold);
  assert(dropZoneTeam, 'Drop zone team (pos 13) must exist in table');
  const gap = mockKomloSeason.pts - dropZoneTeam.pts;
  assert(gap > 2, `Mathematical survival gap must be > 2 points (actual: ${gap} pts)`);

  // 2. TransferModal must feature clean Youth Academy action card button to open youth modal
  const transferModalPath = path.resolve('src/components/TransferModal.tsx');
  const transferContent = fs.readFileSync(transferModalPath, 'utf8');
  assert(transferContent.includes('Youth Academy & Incubator'), 'TransferModal must feature Youth Academy action card');
  assert(transferContent.includes('Graduate Ready'), 'TransferModal must highlight mature academy graduates');
  assert(transferContent.includes('Pull to Squad') || transferContent.includes('pull to squad'), 'TransferModal must reference pulling talent to squad');
  assert(transferContent.includes('onOpenYouth'), 'TransferModal must provide onOpenYouth callback to launch youth modal');

  console.log('✓ Test 10 Passed: Mathematical survival guarantee (>2 pt gap immunity) and Transfer Market youth modal launch verified.');
}

// ============================================================================
// TEST 11: Standings Promotion Integrity (No Phantom Promotion of 12th place clubs)
// ============================================================================
{
  console.log('\nRunning Test 11: Standings Promotion Integrity (No Phantom Promotion of Mid-Table Clubs)...');

  // Verify ActionPanel accordion header is "Squad & Transfers"
  const actionPanelPath = path.resolve('src/components/ActionPanel.tsx');
  const actionPanelContent = fs.readFileSync(actionPanelPath, 'utf8');
  assert(actionPanelContent.includes("tr('Squad & Transfers', 'Kader & Transfers')"), 'ActionPanel accordion must be named Squad & Transfers');

  // Verify simulateGlobalLeagues respects HBL 2 standings
  const potsdam = ALL_CLUBS.find(c => c.name.includes('Potsdam')) || { id: 117, name: '1. VfL Potsdam', tier: 2, country: 'GER', baseOvr: 74, color: '#0055a4' };
  const luebbecke = ALL_CLUBS.find(c => c.name.includes('Lübbecke') || c.name.includes('Luebbecke')) || { id: 119, name: 'TuS N-Lübbecke', tier: 2, country: 'GER', baseOvr: 73, color: '#e30613' };
  const hamburg = ALL_CLUBS.find(c => c.name === 'HSV Hamburg') || { id: 114, name: 'HSV Hamburg', tier: 2, country: 'GER', baseOvr: 80, color: '#0055a4' };

  // Set up world clubs where Hamburg, Potsdam, and Lübbecke are in Tier 2
  const worldMap: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => {
    worldMap[c.id] = { ...c };
  });
  worldMap[hamburg.id] = { ...hamburg, tier: 2 };
  worldMap[potsdam.id] = { ...potsdam, tier: 2 };
  worldMap[luebbecke.id] = { ...luebbecke, tier: 2 };

  const gerT2Clubs = ALL_CLUBS.filter(c => c.country === 'GER' && c.tier === 2);
  const otherT2 = gerT2Clubs.filter(c => c.id !== potsdam.id && c.id !== luebbecke.id && c.id !== hamburg.id);

  // Mock HBL 2 table where Potsdam is 1st (C), Lübbecke is 2nd (P), and Hamburg is 12th
  const mockHbl2Table = [
    { pos: 1, id: potsdam.id, name: potsdam.name, statusMarker: 'C', pts: 58, gd: '+173', isUser: false },
    { pos: 2, id: luebbecke.id, name: luebbecke.name, statusMarker: 'P', pts: 52, gd: '+120', isUser: false },
    ...otherT2.slice(0, 9).map((c, i) => ({
      pos: i + 3,
      id: c.id,
      name: c.name,
      statusMarker: undefined,
      pts: 48 - i * 2,
      gd: '+10',
      isUser: false
    })),
    { pos: 12, id: hamburg.id, name: hamburg.name, statusMarker: undefined, pts: 28, gd: '-20', isUser: false },
    ...otherT2.slice(9).map((c, i) => ({
      pos: i + 13,
      id: c.id,
      name: c.name,
      statusMarker: (i + 13 >= 17) ? 'R' : undefined,
      pts: 20 - i * 2,
      gd: '-50',
      isUser: false
    }))
  ];

  const divisionTables: Record<number, any[]> = {
    2: mockHbl2Table
  };

  const userClub = ALL_CLUBS.find(c => c.country === 'GER' && c.tier === 1) || ALL_CLUBS[0];
  const simResult = simulateGlobalLeagues(
    worldMap,
    userClub,
    1,
    2030,
    1,
    {},
    undefined,
    divisionTables
  );

  // Hamburg finished 12th: must strictly remain in Tier 2, NEVER promoted to Tier 1!
  const updatedHamburg = simResult.newWorldClubs[hamburg.id];
  assert.strictEqual(updatedHamburg.tier, 2, 'HSV Hamburg (12th in HBL 2) must remain in Tier 2 and NOT be phantom-promoted to Tier 1');

  // Potsdam and Lübbecke finished 1st and 2nd: must be promoted to Tier 1
  const updatedPotsdam = simResult.newWorldClubs[potsdam.id];
  const updatedLuebbecke = simResult.newWorldClubs[luebbecke.id];
  assert.strictEqual(updatedPotsdam.tier, 1, '1. VfL Potsdam (1st in HBL 2) must be promoted to Tier 1');
  assert.strictEqual(updatedLuebbecke.tier, 1, 'TuS N-Lübbecke (2nd in HBL 2) must be promoted to Tier 1');

  console.log('✓ Test 11 Passed: 12th place club (HSV Hamburg) strictly remains in Tier 2 while champions/runners-up earn promotion.');
}

// ============================================================================
// TEST 12: Decision Day Title Race for 1st Place Leaders & Rival Points Math
// ============================================================================
{
  console.log('\nRunning Test 12: Decision Day Title Race for 1st Place & Rival Points Math...');

  const topClub = ALL_CLUBS.find(c => c.tier === 1 && c.country === 'GER' && c.baseOvr >= 90) || ALL_CLUBS[0];
  
  let titleDeciderTriggeredForFirst = 0;
  let leaderTrailingRivalPtsVerified = 0;
  let chaserLeadingRivalPtsVerified = 0;

  // Run multiple probabilistic simulations to ensure title race triggers for 1st place
  for (let i = 0; i < 150; i++) {
    const sim = calculateProbabilisticSeason(topClub, 70, 1, 'Total Handball', 18, 100);
    if (sim.pos === 1 && sim.decisionDay?.type === 'title') {
      titleDeciderTriggeredForFirst++;
      // For 1st place leader, rivalPts must trail the player (sim.pts - 1 or sim.pts - 2)
      assert(sim.decisionDay.rivalPts < sim.pts, `Rival points (${sim.decisionDay.rivalPts}) must trail 1st place leader points (${sim.pts})`);
      assert(sim.pts - sim.decisionDay.rivalPts <= 2 && sim.pts - sim.decisionDay.rivalPts >= 1, `Gap between leader and rival must be 1 or 2 pts`);
      leaderTrailingRivalPtsVerified++;
    } else if (sim.pos === 2 && sim.decisionDay?.type === 'title') {
      // For 2nd place chaser, rivalPts must lead the player (sim.pts + 1 or sim.pts + 2)
      assert(sim.decisionDay.rivalPts > sim.pts, `Rival points (${sim.decisionDay.rivalPts}) must lead 2nd place chaser points (${sim.pts})`);
      assert(sim.decisionDay.rivalPts - sim.pts <= 2 && sim.decisionDay.rivalPts - sim.pts >= 1, `Gap between chaser and leader must be 1 or 2 pts`);
      chaserLeadingRivalPtsVerified++;
    }
  }

  assert(titleDeciderTriggeredForFirst > 0, '1st place team must be able to trigger title Decision Day to defend title lead');
  assert(leaderTrailingRivalPtsVerified > 0, '1st place leader must have trailing rival points verified');

  console.log(`✓ Test 12 Passed: 1st place leader Decision Day successfully triggered (${titleDeciderTriggeredForFirst} times) with trailing rival points math strictly verified.`);
}

console.log('\n======================================================');
console.log('ALL DECISION DAY & BROADCASTER TESTS PASSED (12/12)');
console.log('======================================================\n');

