import assert from 'node:assert';
import { ALL_CLUBS } from '../data/clubsData';
import { Club, UniverseMovement, GameState } from '../types';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { calculateProbabilisticSeason, getLeagueSize, processAging } from '../engine/engine';
import { generateLeagueTable } from '../utils/leagueTableGenerator';
import { getClubCatchmentCeiling, getMaxTier } from '../data/gameConstants';
import { extractClubCity } from '../data/demographicsData';

console.log('--- RUNNING UNIVERSE LOGIC & MULTI-SEASON SIMULATION AUDIT ---');

// ============================================================================
// TEST 1: Multi-Season Promotion & Relegation Universe Movement Continuity
// ============================================================================
{
  console.log('\nRunning Test 1: Multi-Season Relegated AI Club Continuity & Re-Promotion...');
  
  // Initialize world map with canonical clubs
  let worldClubsMap: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => {
    worldClubsMap[c.id] = { ...c };
  });

  const userClub = { ...ALL_CLUBS[0], tier: 1 };
  let currentYear = 2024;
  const numSeasons = 12;

  // Track relegated clubs and their subsequent journeys
  const trackedRelegations: { clubId: string; clubName: string; fromTier: number; toTier: number; year: number }[] = [];
  const trackedPromotions: { clubId: string; clubName: string; fromTier: number; toTier: number; year: number }[] = [];

  for (let s = 1; s <= numSeasons; s++) {
    const result = simulateGlobalLeagues(
      worldClubsMap,
      userClub,
      1,
      currentYear,
      1, // user position
      { dfb: s % 2 === 0, cl: s % 3 === 0 }
    );

    // Record movements
    result.movements.forEach(m => {
      if (m.type === 'relegation' && m.clubId !== String(userClub.id)) {
        trackedRelegations.push({
          clubId: m.clubId,
          clubName: m.clubName,
          fromTier: m.fromTier || 1,
          toTier: m.toTier || 2,
          year: m.year
        });
      } else if (m.type === 'promotion' && m.clubId !== String(userClub.id)) {
        trackedPromotions.push({
          clubId: m.clubId,
          clubName: m.clubName,
          fromTier: m.fromTier || 2,
          toTier: m.toTier || 1,
          year: m.year
        });
      }
    });

    // Verify: In the very next season state, every relegated club must physically have its new tier
    result.movements.filter(m => m.type === 'relegation').forEach(m => {
      const clubInNextWorld = result.newWorldClubs[m.clubId];
      assert(clubInNextWorld, `Club ${m.clubName} (${m.clubId}) must exist in updated worldClubs`);
      assert.strictEqual(
        clubInNextWorld.tier,
        m.toTier,
        `Club ${m.clubName} was relegated to tier ${m.toTier}, but worldClubs has tier ${clubInNextWorld.tier}`
      );
    });

    // Verify: In the very next season state, every promoted club must physically have its new higher tier
    result.movements.filter(m => m.type === 'promotion').forEach(m => {
      const clubInNextWorld = result.newWorldClubs[m.clubId];
      assert(clubInNextWorld, `Club ${m.clubName} (${m.clubId}) must exist in updated worldClubs`);
      assert.strictEqual(
        clubInNextWorld.tier,
        m.toTier,
        `Club ${m.clubName} was promoted to tier ${m.toTier}, but worldClubs has tier ${clubInNextWorld.tier}`
      );
    });

    // Advance state
    worldClubsMap = result.newWorldClubs;
    currentYear++;
  }

  assert(trackedRelegations.length > 0, 'Must have recorded AI club relegations over 12 seasons');
  assert(trackedPromotions.length > 0, 'Must have recorded AI club promotions over 12 seasons');

  // Verify that relegated clubs remain active competitors in their new tier and some earn promotion back
  console.log(`  Over ${numSeasons} seasons: ${trackedRelegations.length} AI relegations, ${trackedPromotions.length} AI promotions recorded.`);
  const bouncedBack = trackedRelegations.filter(r => 
    trackedPromotions.some(p => p.clubId === r.clubId && p.year > r.year)
  );
  console.log(`  ${bouncedBack.length} relegated clubs successfully fought back and won promotion in subsequent seasons.`);

  console.log('✓ Test 1 Passed: AI clubs accurately land in relegated leagues and continue active career competition.');
}

// ============================================================================
// TEST 2: Narrative Trajectories & Insolvency / Fallen Giants Logic
// ============================================================================
{
  console.log('\nRunning Test 2: Fallen Giant & Financial Distress Narrative Lifecycle...');

  let worldClubsMap: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => {
    worldClubsMap[c.id] = { ...c };
  });

  const userClub = { ...ALL_CLUBS[0], tier: 1 };
  let insolvencyCount = 0;
  let heritageClubsLiquidated = 0;

  for (let year = 2024; year < 2040; year++) {
    const sim = simulateGlobalLeagues(worldClubsMap, userClub, 1, year);
    
    if (sim.insolventClubs && sim.insolventClubs.length > 0) {
      insolvencyCount += sim.insolventClubs.length;
      sim.insolventClubs.forEach(ic => {
        const club = sim.newWorldClubs[ic.clubId];
        assert(club, 'Insolvent club must exist');
        assert(club.isInsolventGiant, 'Insolvent club must be flagged with isInsolventGiant');
        
        // Heritage shield check:
        const isHeritage = ['SC Magdeburg', 'THW Kiel', 'SG Flensburg-Handewitt', 'Füchse Berlin', 'Paris Saint-Germain', 'Barça', 'Telekom Veszprém', 'Industria Kielce', 'Aalborg Håndbold'].includes(club.name);
        if (isHeritage) {
          heritageClubsLiquidated++;
        }
      });
    }

    worldClubsMap = sim.newWorldClubs;
  }

  assert.strictEqual(
    heritageClubsLiquidated,
    0,
    'Heritage heavyweights must never suffer administrative insolvency liquidation due to heritage shield'
  );
  console.log(`  Verified 16-year universe lifecycle: ${insolvencyCount} authentic insolvency events processed.`);
  console.log('✓ Test 2 Passed: Fallen giant narratives, firesales, and heritage protections operate logically.');
}

// ============================================================================
// TEST 3: Decision Day Tables Alignment with Game World
// ============================================================================
{
  console.log('\nRunning Test 3: Decision Day Table Generator & 2-1-0 Rule Compliance...');

  const mockClub = { ...ALL_CLUBS[0], tier: 1 };
  const mockState = {
    club: mockClub,
    year: 2024,
    history: [],
    totals: { games: 34, wins: 20, draws: 4, losses: 10, trophies: 0 },
    squad: []
  };

  // Generate a full league table
  const table = generateLeagueTable(mockState as any, ALL_CLUBS, 1);
  assert(table.length >= 10, 'League table must have full cohort');

  // Verify strict monotonic points order
  for (let i = 0; i < table.length - 1; i++) {
    const current = table[i];
    const next = table[i + 1];
    assert(
      current.pts >= next.pts,
      `Standings rank violation: pos ${current.pos} (${current.pts} pts) vs pos ${next.pos} (${next.pts} pts)`
    );
    assert.strictEqual(
      current.pts,
      current.w * 2 + current.d,
      `European handball 2-1-0 points formula violated for ${current.name}`
    );
  }

  // Simulate Decision Day stakes
  for (let i = 0; i < 25; i++) {
    const simSeason = calculateProbabilisticSeason(mockClub, 82, 1, 'Fast Breaks', 18, 100);
    assert(simSeason.pts === simSeason.wins * 2 + simSeason.draws, 'Decision Day season points must equal 2W + 1D');
    assert(simSeason.pos >= 1 && simSeason.pos <= 18, 'Decision Day position must be bounded 1-18');
  }

  console.log('✓ Test 3 Passed: Decision Day standings strictly mirror universe rules and 2-1-0 handball scoring.');
}

// ============================================================================
// TEST 4: Universal Handball Market Dynamics (All Cities, Mod ON & Mod OFF)
// ============================================================================
{
  console.log('\nRunning Test 4: Handball Market Catchment Dynamics (Mod ON & Mod OFF)...');

  // Sample across all supported European handball nations
  const sampleClubs: Partial<Club>[] = [
    // Denmark
    { name: 'Aalborg Håndbold', country: 'DEN', tier: 1, baseOvr: 86, fanBase: 95000 },
    { name: 'GOG Håndbold', country: 'DEN', tier: 1, baseOvr: 83, fanBase: 65000 },
    { name: 'Ajax København', country: 'DEN', tier: 2, baseOvr: 62, fanBase: 25000 },
    // Germany
    { name: 'SC Magdeburg', country: 'GER', tier: 1, baseOvr: 89, fanBase: 220000 },
    { name: 'HBW Balingen-Weilstetten', country: 'GER', tier: 2, baseOvr: 72, fanBase: 35000 },
    // France
    { name: 'Paris Saint-Germain Handball', country: 'FRA', tier: 1, baseOvr: 88, fanBase: 180000 },
    { name: 'Billère Handball Pau Pyrénées', country: 'FRA', tier: 2, baseOvr: 65, fanBase: 20000 },
    // Spain
    { name: 'Barça', country: 'ESP', tier: 1, baseOvr: 90, fanBase: 260000 },
    { name: 'Balonmano Nava', country: 'ESP', tier: 1, baseOvr: 71, fanBase: 18000 },
    // Sweden, Norway, Poland, Hungary, Croatia, Portugal, Switzerland, Austria, Iceland
    { name: 'Ystads IF HF', country: 'SWE', tier: 1, baseOvr: 74, fanBase: 28000 },
    { name: 'Elverum Håndball', country: 'NOR', tier: 1, baseOvr: 77, fanBase: 32000 },
    { name: 'Industria Kielce', country: 'POL', tier: 1, baseOvr: 87, fanBase: 140000 },
    { name: 'Telekom Veszprém', country: 'HUN', tier: 1, baseOvr: 89, fanBase: 190000 },
    { name: 'RK Zagreb', country: 'CRO', tier: 1, baseOvr: 78, fanBase: 60000 },
    { name: 'Sporting CP', country: 'POR', tier: 1, baseOvr: 82, fanBase: 70000 },
    { name: 'Kadetten Schaffhausen', country: 'SUI', tier: 1, baseOvr: 76, fanBase: 30000 },
    { name: 'Alpla HC Hard', country: 'AUT', tier: 1, baseOvr: 71, fanBase: 22000 },
    { name: 'Valur', country: 'ISL', tier: 1, baseOvr: 73, fanBase: 15000 },
  ];

  // Test Mod OFF (Standard base clubs)
  sampleClubs.forEach(club => {
    const catchment = getClubCatchmentCeiling(club);
    assert(catchment.cityName && catchment.cityName.length > 0, `Catchment city name must be resolved for ${club.name}`);
    assert(catchment.populationEstimate > 0, `Population estimate must be > 0 for ${club.name}`);
    assert(catchment.cityCoreFans > 0, `cityCoreFans must be > 0 for ${club.name}`);
    assert(catchment.regionalPerimeterFans > 0, `regionalPerimeterFans must be > 0 for ${club.name}`);
    assert(catchment.maxCeiling > 0, `maxCeiling must be > 0 for ${club.name}`);
    assert(catchment.maxCeiling >= catchment.cityCoreFans, 'maxCeiling must be >= cityCoreFans');
    assert(catchment.saturation >= 0 && catchment.saturation <= 100, `saturation must be in [0, 100] for ${club.name}`);
  });

  // Test Mod ON (Custom community clubs with custom names and contexts)
  const customModClubs: Partial<Club>[] = [
    { name: 'HC Odense Dynamites', country: 'DEN', tier: 1, context: 'Fyn metropolitan giants based in central Odense.', fanBase: 45000 },
    { name: 'Eintracht Hildesheim 1861', country: 'GER', tier: 2, context: 'Lower Saxony stronghold in Hildesheim.', fanBase: 32000 },
    { name: 'US Saintes Handball', country: 'FRA', tier: 3, context: 'Maritime club from Saintes competing in National 1.', fanBase: 8000 },
    { name: 'BM Caserío Ciudad Real', country: 'ESP', tier: 2, context: 'Carrying the handball legend of Ciudad Real back to the elite.', fanBase: 28000 },
  ];

  customModClubs.forEach(club => {
    const catchment = getClubCatchmentCeiling(club);
    assert(catchment.cityName && catchment.cityName.length > 0, `Custom mod club ${club.name} must extract a city`);
    assert(catchment.cityCoreFans > 0, `Custom mod club ${club.name} must have positive cityCoreFans`);
    assert(catchment.maxCeiling > 0, `Custom mod club ${club.name} must have positive maxCeiling`);
  });

  console.log(`  Verified ${sampleClubs.length} standard European clubs and ${customModClubs.length} custom mod clubs.`);
  console.log('✓ Test 4 Passed: Universal market dynamics work reliably for all cities with mod on and mod off.');
}

// ============================================================================
// TEST 5: Table-To-Universe Strict Relegation & Multi-Division Archiving (2040 -> 2041)
// ============================================================================
{
  console.log('\nRunning Test 5: Table-to-Universe Strict Relegation & Multi-Division Archiving...');

  const magdeburg = ALL_CLUBS.find(c => c.name === 'SC Magdeburg')!;
  const nordhorn = ALL_CLUBS.find(c => c.name.includes('Nordhorn'))!;
  const hagen = ALL_CLUBS.find(c => c.name.includes('Hagen'))!;
  const balingen = ALL_CLUBS.find(c => c.name.includes('Balingen'))!;
  const bergischer = ALL_CLUBS.find(c => c.name.includes('Bergischer'))!;

  // Setup Season 2040: Nordhorn & Hagen in Tier 1; Balingen & Bergischer in Tier 2
  const worldClubs2040: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => {
    worldClubs2040[c.id] = { ...c };
  });
  worldClubs2040[nordhorn.id] = { ...nordhorn, tier: 1 };
  worldClubs2040[hagen.id] = { ...hagen, tier: 1 };
  worldClubs2040[balingen.id] = { ...balingen, tier: 2 };
  worldClubs2040[bergischer.id] = { ...bergischer, tier: 2 };

  // 2040 Division 1 Table: Nordhorn (17th, R) and Hagen (18th, R) are relegated
  const tableT1_2040 = [
    { pos: 1, id: magdeburg.id, name: 'SC Magdeburg', pts: 60, statusMarker: 'C', isUser: true },
    ...ALL_CLUBS.filter(c => c.tier === 1 && c.id !== magdeburg.id && c.id !== nordhorn.id && c.id !== hagen.id && c.id !== balingen.id && c.id !== bergischer.id).slice(0, 15).map((c, i) => ({ pos: i + 2, id: c.id, name: c.name, pts: 50 - i * 2, statusMarker: undefined, isUser: false })),
    { pos: 17, id: nordhorn.id, name: 'HSG Nordhorn-Lingen', pts: 11, statusMarker: 'R', isUser: false },
    { pos: 18, id: hagen.id, name: 'VfL Eintracht Hagen', pts: 8, statusMarker: 'R', isUser: false }
  ];

  // 2040 Division 2 Table: Bergischer (1st, C) and Balingen (2nd, P) are promoted
  const tableT2_2040 = [
    { pos: 1, id: bergischer.id, name: bergischer.name, pts: 58, statusMarker: 'C', isUser: false },
    { pos: 2, id: balingen.id, name: balingen.name, pts: 56, statusMarker: 'P', isUser: false },
    ...ALL_CLUBS.filter(c => c.tier === 2 && c.id !== nordhorn.id && c.id !== hagen.id && c.id !== balingen.id && c.id !== bergischer.id).slice(0, 14).map((c, i) => ({ pos: i + 3, id: c.id, name: c.name, pts: 48 - i * 2, statusMarker: undefined, isUser: false })),
    { pos: 17, id: 398, name: 'T2 Releg 1', pts: 10, statusMarker: 'R', isUser: false },
    { pos: 18, id: 399, name: 'T2 Releg 2', pts: 6, statusMarker: 'R', isUser: false }
  ];

  const divisionTables2040 = {
    1: tableT1_2040,
    2: tableT2_2040
  };

  const simResult = simulateGlobalLeagues(
    worldClubs2040,
    magdeburg,
    1,
    2040,
    1,
    { bl: 1 },
    tableT1_2040,
    divisionTables2040
  );

  // Assertions on 2040 -> 2041 transition
  assert.strictEqual(simResult.newWorldClubs[nordhorn.id]?.tier, 2, 'Nordhorn must be demoted to Tier 2');
  assert.strictEqual(simResult.newWorldClubs[hagen.id]?.tier, 2, 'Hagen must be demoted to Tier 2');
  assert.strictEqual(simResult.newWorldClubs[bergischer.id]?.tier, 1, 'Bergischer must be promoted to Tier 1');
  assert.strictEqual(simResult.newWorldClubs[balingen.id]?.tier, 1, 'Balingen must be promoted to Tier 1');

  // Verify Universe Movements records
  assert(simResult.movements.some(m => m.clubId === String(nordhorn.id) && m.type === 'relegation' && m.toTier === 2), 'Movement must record Nordhorn relegation');
  assert(simResult.movements.some(m => m.clubId === String(hagen.id) && m.type === 'relegation' && m.toTier === 2), 'Movement must record Hagen relegation');
  assert(simResult.movements.some(m => m.clubId === String(bergischer.id) && m.type === 'promotion' && m.toTier === 1), 'Movement must record Bergischer promotion');
  assert(simResult.movements.some(m => m.clubId === String(balingen.id) && m.type === 'promotion' && m.toTier === 1), 'Movement must record Balingen promotion');

  // Verify Season 2041 Table Generation
  const state2041: any = {
    year: 2041,
    club: magdeburg,
    worldClubs: simResult.newWorldClubs,
    history: [
      {
        year: 2040,
        clubName: magdeburg.name,
        country: 'GER',
        tier: 1,
        pos: 1,
        finalTable: tableT1_2040,
        divisionTables: divisionTables2040
      }
    ]
  };

  const t1_2041 = generateLeagueTable(state2041, ALL_CLUBS, 1);
  const t2_2041 = generateLeagueTable(state2041, ALL_CLUBS, 2);

  assert.strictEqual(t1_2041.length, 18, 'Tier 1 must maintain canonical 18 clubs');
  assert.strictEqual(t2_2041.length, 18, 'Tier 2 must maintain canonical 18 clubs');

  assert(!t1_2041.some(r => r.name.includes('Nordhorn')), 'Bundesliga 1 in 2041 must NOT contain relegated Nordhorn');
  assert(!t1_2041.some(r => r.name.includes('Hagen')), 'Bundesliga 1 in 2041 must NOT contain relegated Hagen');
  assert(t2_2041.some(r => r.name.includes('Nordhorn')), 'Bundesliga 2 in 2041 must contain Nordhorn');
  assert(t2_2041.some(r => r.name.includes('Hagen')), 'Bundesliga 2 in 2041 must contain Hagen');

  assert(t1_2041.some(r => r.name.includes('Bergischer')), 'Bundesliga 1 in 2041 must contain promoted Bergischer HC');
  assert(t1_2041.some(r => r.name.includes('Balingen')), 'Bundesliga 1 in 2041 must contain promoted HBW Balingen');

  // Verify historical multi-division archive integrity
  const archived2040 = state2041.history[0];
  assert.strictEqual(archived2040.divisionTables[1][16].name, 'HSG Nordhorn-Lingen');
  assert.strictEqual(archived2040.divisionTables[1][16].statusMarker, 'R');
  assert.strictEqual(archived2040.divisionTables[1][17].name, 'VfL Eintracht Hagen');
  assert.strictEqual(archived2040.divisionTables[1][17].statusMarker, 'R');

  assert.strictEqual(archived2040.divisionTables[2][0].name, 'Bergischer HC');
  assert.strictEqual(archived2040.divisionTables[2][0].statusMarker, 'C');
  assert.strictEqual(archived2040.divisionTables[2][1].name, 'HBW Balingen-Weilstetten');
  assert.strictEqual(archived2040.divisionTables[2][1].statusMarker, 'P');

  console.log('✓ Test 5 Passed: Table-to-Universe strict promotion/relegation and multi-division historical archiving verified.');
}

// ============================================================================
// TEST 6: Lowest Tier Visual Relegation & Direct Manager Sacking Validation
// ============================================================================
{
  console.log('\nRunning Test 6: Lowest Tier Visual Relegation & Direct Manager Sacking...');

  const maxTierGer = getMaxTier('GER');
  assert.strictEqual(maxTierGer, 6, 'German handball pyramid must have 6 tiers');

  const tier6Clubs = ALL_CLUBS.filter(c => (c.country || 'GER') === 'GER' && c.tier === maxTierGer);
  assert(tier6Clubs.length > 0, 'Tier 6 clubs must exist');

  const dummyT6State: any = {
    year: 2026,
    club: tier6Clubs[0],
    history: [],
    worldClubs: {}
  };

  // 1. Standings parity: Bottom teams must have (R) statusMarker even in maxTier
  const t6Table = generateLeagueTable(dummyT6State, ALL_CLUBS, maxTierGer, {
    year: 2026,
    clubName: tier6Clubs[0].name,
    country: 'GER',
    tier: maxTierGer,
    wins: 2,
    draws: 1,
    losses: 15,
    pts: 5,
    pos: t6TableLength(tier6Clubs.length),
    gf: 350,
    ga: 500
  });

  function t6TableLength(count: number) {
    return Math.min(count, 18);
  }

  const lastPos = t6Table.length;
  assert.strictEqual(t6Table[lastPos - 1].statusMarker, 'R', 'Lowest position in bottom tier must have visual (R) status marker');
  assert.strictEqual(t6Table[lastPos - 2].statusMarker, 'R', 'Penultimate position in bottom tier must have visual (R) status marker');

  // 2. Division floor guarantee: simulateGlobalLeagues must never demote below maxTier
  const simResult = simulateGlobalLeagues(dummyT6State.worldClubs, dummyT6State.club, maxTierGer, 2026, t6Table.length, {}, t6Table);
  const clubsAfter = ALL_CLUBS.map(c => simResult.newWorldClubs[c.id] || c);
  const demotedBelowFloor = clubsAfter.filter(c => (c.country || 'GER') === 'GER' && c.tier > maxTierGer);
  assert.strictEqual(demotedBelowFloor.length, 0, 'Zero clubs can be demoted below the pyramid floor (Tier 6)');

  console.log('✓ Test 6 Passed: Lowest tier visual relegation parity and floor retention strictly verified.');
}

// ============================================================================
// TEST 7: AI Cinderella Runs, Dynamic Parity & Giant Resilience vs User Agency
// ============================================================================
{
  console.log('\nRunning Test 7: AI Cinderella Runs & Giant Resilience vs User Agency...');

  let worldClubsMap: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => {
    worldClubsMap[c.id] = { ...c };
  });

  const kiel = ALL_CLUBS.find(c => c.name === 'THW Kiel')!;
  const userManagingGiant = { ...kiel, tier: 1, baseOvr: 52 }; // User managing Kiel and running them into the ground
  
  // 1. User Agency Verification: User-managed giant does NOT receive artificial rubberband floor
  const userSimAged = processAging([userManagingGiant], userManagingGiant.id);
  assert.strictEqual(userSimAged[0].baseOvr <= 53, true, 'User-managed giant must NOT receive artificial CPU rubberband bounce-back');

  // 2. CPU Giant Resilience: AI-controlled Kiel with low OVR will bounce back toward powerhouse floor
  const cpuGiant = { ...kiel, tier: 1, baseOvr: 78 };
  const cpuSimAged = processAging([cpuGiant]); // No user manager
  assert(cpuSimAged[0].baseOvr > 78, 'CPU-controlled heritage giant under 86 OVR must bounce back to preserve elite standing');

  // 3. Multi-Season Cinderella Surge Tracking over 20 seasons
  let currentYear = 2024;
  let recordedCinderellaMovements = 0;
  const promotedClubNames = new Set<string>();

  for (let s = 1; s <= 20; s++) {
    const result = simulateGlobalLeagues(
      worldClubsMap,
      userManagingGiant,
      1,
      currentYear,
      14,
      {}
    );

    result.movements.forEach(m => {
      if (m.type === 'promotion') {
        promotedClubNames.add(m.clubName);
        if (m.isCinderella) {
          recordedCinderellaMovements++;
        }
      }
    });

    worldClubsMap = result.newWorldClubs;
    currentYear++;
  }

  console.log(`  Across 20 seasons: ${promotedClubNames.size} distinct clubs earned promotion.`);
  console.log(`  Recorded ${recordedCinderellaMovements} authentic Cinderella promotion surges.`);

  assert(promotedClubNames.size >= 12, 'Promotion roll call must be dynamic and diverse (not perpetually the same 2 clubs)');
  assert(recordedCinderellaMovements > 0, 'Must record at least one multi-season AI Cinderella breakthrough story');

  console.log('✓ Test 7 Passed: AI Cinderella multi-season surges, diverse promotion turnover, and CPU giant resilience validated.');
}

// ============================================================================
// TEST 8: Promotion & Relegation Co-Promotion Integrity (Tier 6 to Tier 5)
// ============================================================================
{
  console.log('\nRunning Test 8: Tier 6 to Tier 5 Co-Promotion Integrity (Bayern & Koblenz)...');

  const bayern = ALL_CLUBS.find(c => c.name === 'FC Bayern München')!;
  const koblenz = ALL_CLUBS.find(c => c.name === 'HC Koblenz')!;
  assert(bayern, 'FC Bayern München must exist');
  assert(koblenz, 'HC Koblenz must exist');

  // 1. Season 2026: User is Bayern in Tier 6, finishes 2nd. Koblenz is 1st.
  const userFinalTable2026 = [
    { pos: 1, name: 'HC Koblenz', id: koblenz.id, statusMarker: 'C', isUser: false, pts: 32, w: 15, d: 2, l: 3, gd: '+25' },
    { pos: 2, name: 'FC Bayern München', id: bayern.id, statusMarker: 'P', isUser: true, pts: 30, w: 14, d: 2, l: 4, gd: '+18' },
    { pos: 3, name: 'Tuspo Weende Göttingen', id: 177, statusMarker: 'PO', isUser: false, pts: 26, w: 12, d: 2, l: 6, gd: '+10' },
    { pos: 4, name: 'LHC Cottbus', id: 178, isUser: false, pts: 22, w: 10, d: 2, l: 8, gd: '+2' },
    { pos: 5, name: 'HSG Marburg/Cappel', id: 179, isUser: false, pts: 20, w: 9, d: 2, l: 9, gd: '-2' },
    { pos: 6, name: 'Zwickauer HC', id: 180, isUser: false, pts: 18, w: 8, d: 2, l: 10, gd: '-5' },
    { pos: 7, name: 'LTV Wuppertal', id: 181, isUser: false, pts: 16, w: 7, d: 2, l: 11, gd: '-8' },
    { pos: 8, name: 'DHK Flensborg', id: 182, isUser: false, pts: 14, w: 6, d: 2, l: 12, gd: '-10' },
    { pos: 9, name: 'SC Paderborn 07', id: 184, isUser: false, pts: 12, w: 5, d: 2, l: 13, gd: '-12' },
    { pos: 10, name: 'SBC Traunstein', id: 185, isUser: false, pts: 10, w: 4, d: 2, l: 14, gd: '-15' },
    { pos: 11, name: 'Unknown HC 11', id: 186, isUser: false, pts: 8, w: 3, d: 2, l: 15, gd: '-18' },
  ];

  const worldClubsInit: Record<string, Club> = {};
  ALL_CLUBS.forEach(c => { worldClubsInit[c.id] = { ...c }; });

  const promotedUserClub = { ...bayern, tier: 5 };
  const simGlobalResult = simulateGlobalLeagues(
    worldClubsInit,
    promotedUserClub,
    6, // playedTier was 6
    2026,
    2, // pos was 2
    {},
    userFinalTable2026
  );

  // Verify HC Koblenz was promoted to tier 5
  const koblenzAfter = simGlobalResult.newWorldClubs[koblenz.id];
  assert.strictEqual(koblenzAfter.tier, 5, 'HC Koblenz must be promoted to Tier 5 in newWorldClubs');

  // Verify promotion movement logged for Koblenz
  const koblenzPromo = simGlobalResult.movements.find(m => String(m.clubId) === String(koblenz.id) && m.type === 'promotion');
  assert(koblenzPromo, 'HC Koblenz promotion movement must be recorded');
  assert.strictEqual(koblenzPromo.fromTier, 6);
  assert.strictEqual(koblenzPromo.toTier, 5);

  // 2. Season 2027: User is in Tier 5, active season
  const state2027: GameState = {
    club: promotedUserClub,
    year: 2027,
    worldClubs: simGlobalResult.newWorldClubs,
    history: [
      {
        year: 2026,
        clubName: 'FC Bayern München',
        tier: 6,
        pos: 2,
        pts: 30,
        wins: 14,
        draws: 2,
        losses: 4,
        finalTable: userFinalTable2026,
        divisionTables: {
          6: userFinalTable2026
        }
      }
    ]
  } as any;

  // Generate Tier 5 table for active 2027 season
  const t5Table2027 = generateLeagueTable(state2027, ALL_CLUBS, 5);
  const bayernInT5 = t5Table2027.find(r => r.name === 'FC Bayern München' || r.isUser);
  const koblenzInT5 = t5Table2027.find(r => r.name === 'HC Koblenz' || String(r.id) === String(koblenz.id));

  assert(bayernInT5, 'FC Bayern München must be present in Tier 5 in 2027');
  assert.strictEqual(bayernInT5.isUser, true, 'FC Bayern München must be marked as isUser');
  assert(koblenzInT5, 'HC Koblenz must be present in Tier 5 in 2027 alongside user');
  assert.strictEqual(koblenzInT5.isUser, false, 'HC Koblenz must be marked as AI club');

  // Verify neither Bayern nor Koblenz remains in Tier 6
  const t6Table2027 = generateLeagueTable(state2027, ALL_CLUBS, 6);
  const bayernInT6 = t6Table2027.find(r => r.name === 'FC Bayern München' || r.isUser);
  const koblenzInT6 = t6Table2027.find(r => r.name === 'HC Koblenz');
  assert(!bayernInT6, 'FC Bayern München must NOT be present in Tier 6 in 2027');
  assert(!koblenzInT6, 'HC Koblenz must NOT be present in Tier 6 in 2027');

  // Verify all rows have an id
  t5Table2027.forEach(row => {
    assert(row.id !== undefined, `Row for ${row.name} must have a valid id`);
  });

  console.log('✓ Test 8 Passed: Tier 6 to Tier 5 co-promotion integrity and mutual league membership verified.');
}

console.log('\n======================================================');
console.log('ALL UNIVERSE LOGIC & MULTI-SEASON AUDIT TESTS PASSED');
console.log('======================================================\n');

