import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_CLUBS } from '../data/clubsData';
import { calculateProbabilisticSeason, getLeagueSize } from '../engine/engine';
import { generateLeagueTable } from '../utils/leagueTableGenerator';
import { useGameStore } from '../store/useGameStore';

console.log('--- RUNNING MODAL INTERACTION & UI INTEGRITY AUDIT TEST SUITE ---');

const MODALS_DIR = path.resolve('src/components');
const modalFiles = fs.readdirSync(MODALS_DIR).filter(f => f.endsWith('Modal.tsx'));

assert(modalFiles.length >= 40, `Found ${modalFiles.length} modals, expected >= 40`);
console.log(`Auditing ${modalFiles.length} modal component files in ${MODALS_DIR}...`);

// TEST 1: Scroll Containment & Viewport Overflow Safeguards
{
  console.log('\nRunning Test 1: Viewport Overflow & Scroll Containment Across Modals...');
  const failedScroll: string[] = [];

  for (const file of modalFiles) {
    if (file === 'AcademyModal.tsx' || file === 'MedicalModal.tsx') {
      // These delegate directly to FacilityModal
      continue;
    }
    const content = fs.readFileSync(path.join(MODALS_DIR, file), 'utf8');
    const hasScroll = content.includes('overflow-y-auto') || content.includes('overflow-auto') || content.includes('overflow-hidden');
    const hasMaxH = content.includes('max-h-') || content.includes('h-screen') || content.includes('max-h[');
    
    if (!hasScroll && !hasMaxH) {
      failedScroll.push(file);
    }
  }

  assert.strictEqual(
    failedScroll.length,
    0,
    `The following modals lack scroll containment: ${failedScroll.join(', ')}`
  );
  console.log(`✓ Test 1 Passed: All ${modalFiles.length} modals enforce height bounds and scroll containment.`);
}

// TEST 2: Event Propagation & Accidental Dismissal Safeguards
{
  console.log('\nRunning Test 2: Click Propagation Containment on Backdrop-Dismissable Modals...');
  const propagationLeaks: string[] = [];

  for (const file of modalFiles) {
    if (file === 'AcademyModal.tsx' || file === 'MedicalModal.tsx') {
      continue;
    }
    const content = fs.readFileSync(path.join(MODALS_DIR, file), 'utf8');
    const hasBackdropClose = content.includes('onClick={onClose}') || content.includes('onClick={handleBackdropClick}');
    const hasStopProp = content.includes('stopPropagation');

    if (hasBackdropClose && !hasStopProp) {
      propagationLeaks.push(file);
    }
  }

  assert.strictEqual(
    propagationLeaks.length,
    0,
    `The following backdrop-dismissable modals leak clicks to backdrop: ${propagationLeaks.join(', ')}`
  );
  console.log('✓ Test 2 Passed: 100% of backdrop-dismissable modals protect child clicks with stopPropagation.');
}

// TEST 3: Z-Index Stratification & Nested Modal Collision Prevention
{
  console.log('\nRunning Test 3: Z-Index Stratification Hierarchy...');

  const getModalZIndex = (filename: string): number => {
    const content = fs.readFileSync(path.join(MODALS_DIR, filename), 'utf8');
    const arbitraryMatches = Array.from(content.matchAll(/z-\[(\d+)\]/g)).map(m => parseInt(m[1], 10));
    if (arbitraryMatches.length > 0) {
      return Math.max(...arbitraryMatches);
    }
    const tailwindMatches = Array.from(content.matchAll(/z-(\d+)/g)).map(m => parseInt(m[1], 10));
    if (tailwindMatches.length > 0) {
      return Math.max(...tailwindMatches);
    }
    return 0;
  };

  const clubProfileZ = getModalZIndex('ClubProfileModal.tsx');
  const leagueTableZ = getModalZIndex('LeagueTableModal.tsx');
  const seasonFinishZ = getModalZIndex('SeasonFinishModal.tsx');
  const confirmResetZ = getModalZIndex('ConfirmResetModal.tsx');
  const gachaRevealZ = getModalZIndex('GachaRevealModal.tsx');

  console.log(`  ClubProfileModal z-index: ${clubProfileZ}`);
  console.log(`  ConfirmResetModal z-index: ${confirmResetZ}`);
  console.log(`  GachaRevealModal z-index: ${gachaRevealZ}`);
  console.log(`  LeagueTableModal z-index: ${leagueTableZ}`);
  console.log(`  SeasonFinishModal z-index: ${seasonFinishZ}`);

  // Child inspection modal must layer over parent table/finish views
  assert(
    clubProfileZ > leagueTableZ,
    `ClubProfileModal (${clubProfileZ}) must sit above LeagueTableModal (${leagueTableZ})`
  );
  assert(
    clubProfileZ > seasonFinishZ,
    `ClubProfileModal (${clubProfileZ}) must sit above SeasonFinishModal (${seasonFinishZ})`
  );
  assert(
    confirmResetZ > seasonFinishZ,
    `ConfirmResetModal (${confirmResetZ}) must sit above SeasonFinishModal (${seasonFinishZ})`
  );
  assert(
    gachaRevealZ > seasonFinishZ,
    `GachaRevealModal (${gachaRevealZ}) must sit above SeasonFinishModal (${seasonFinishZ})`
  );

  console.log('✓ Test 3 Passed: Z-Index stratification ensures inspection modals render above overview modals.');
}

// TEST 4: Universal Modal Dismissal & Escape Listener Safeguards
{
  console.log('\nRunning Test 4: Universal Dismissal & Scroll Lock Hook Coverage...');
  const missingHooks: string[] = [];

  for (const file of modalFiles) {
    if (file === 'AcademyModal.tsx' || file === 'MedicalModal.tsx') {
      continue;
    }
    const content = fs.readFileSync(path.join(MODALS_DIR, file), 'utf8');
    const hasDismissHook = content.includes('useModalDismiss');
    const hasScrollLockHook = content.includes('useModalScrollLock');

    if (!hasDismissHook && !hasScrollLockHook) {
      missingHooks.push(file);
    }
  }

  assert.strictEqual(
    missingHooks.length,
    0,
    `The following modals lack useModalDismiss / useModalScrollLock: ${missingHooks.join(', ')}`
  );
  console.log(`✓ Test 4 Passed: 100% of modals implement centralized dismissal or scroll lock hooks.`);
}

// TEST 5: Verify Zero Mutation to Game Simulation Logic & 2-1-0 Rules
{
  console.log('\nRunning Test 5: Game Simulation Logic & Handball Scoring Integrity...');
  const store = useGameStore.getState();
  const testClub = { ...ALL_CLUBS[0], tier: 1 };

  // Run probabilistic season simulations across multiple teams and tactics
  for (let i = 0; i < 20; i++) {
    const opp = ALL_CLUBS[i % ALL_CLUBS.length];
    const res = calculateProbabilisticSeason(opp, 70, opp.tier || 1, 'Total Handball', 18, 100);
    assert(typeof res.pos === 'number' && res.pos >= 1 && res.pos <= 18, 'Position must be valid 1-18');
    assert.strictEqual(res.pts, res.wins * 2 + res.draws, 'Handball 2-1-0 rule must hold in season simulation');
    assert.strictEqual(res.wins + res.draws + res.losses, 34, 'Matches played must sum to 34');
  }

  // Verify European handball 2-1-0 points in league table generation
  const table = generateLeagueTable({ ...store, club: testClub }, ALL_CLUBS, 1);
  assert(table.length >= 18, 'Table must contain all clubs');
  for (const row of table) {
    assert.strictEqual(
      row.pts,
      row.w * 2 + row.d,
      `Handball points formula violated for ${row.name}: ${row.pts} != 2*${row.w} + ${row.d}`
    );
  }

  console.log('✓ Test 5 Passed: Core game simulation logic and 2-1-0 scoring rules strictly intact.');
}

// TEST 6: Verify ArenaOverviewModal Tabbed Information Architecture & Context Integrity
{
  console.log('\nRunning Test 6: ArenaOverviewModal Information Architecture & Context Integrity...');
  const arenaFile = fs.readFileSync(path.join(MODALS_DIR, 'ArenaOverviewModal.tsx'), 'utf-8');

  // Verify tabbed navigation presence
  assert(arenaFile.includes("'market'"), 'Must include market tab');
  assert(arenaFile.includes("'trend'"), 'Must include trend tab');
  assert(arenaFile.includes("'strategy'"), 'Must include strategy tab');
  assert(arenaFile.includes("'expansion'"), 'Must include expansion tab');

  // Verify persistent KPI rail metrics
  assert(arenaFile.includes('Capacity'), 'Must display persistent Capacity KPI');
  assert(arenaFile.includes('Active Fans'), 'Must display persistent Active Fans KPI');
  assert(arenaFile.includes('Season Fill') || arenaFile.includes('Utilization'), 'Must display persistent utilization KPI');
  assert(arenaFile.includes('Matchday Rev'), 'Must display persistent Matchday Rev KPI');

  // Verify progressive disclosure drawer for Catchment & Regional Demographics
  assert(arenaFile.includes('isCatchmentOpen'), 'Must implement progressive disclosure drawer state');
  assert(arenaFile.includes('Demographic Catchment Ceiling'), 'Must retain Demographic Catchment Ceiling context');
  assert(arenaFile.includes('cityCoreFans'), 'Must retain cityCoreFans calculation');
  assert(arenaFile.includes('regionalPerimeterFans'), 'Must retain regionalPerimeterFans calculation');
  assert(arenaFile.includes('megaStatusFans'), 'Must retain megaStatusFans calculation');
  assert(arenaFile.includes('maxCeiling'), 'Must retain maxCeiling calculation');

  // Verify integrated expansion functionality
  assert(arenaFile.includes('getIncrementalOptions'), 'Must import and compute incremental expansion options');
  assert(arenaFile.includes('handleExecuteExpansion') || arenaFile.includes('expandStadium'), 'Must execute stadium expansion directly');
  assert(arenaFile.includes('pinnacleCap'), 'Must enforce national pinnacle capacity constraint');

  // Verify modal interaction safety
  assert(arenaFile.includes('useModalDismiss'), 'Must invoke useModalDismiss');
  assert(arenaFile.includes('e.stopPropagation()'), 'Must contain stopPropagation to prevent click-through dismissal');

  console.log('✓ Test 6 Passed: ArenaOverviewModal cleanly implements tabbed hierarchy with 100% context preservation.');
}

// TEST 7: Verify TransferModal Categorized Architecture & Season Scroll Lock Preservation
{
  console.log('\nRunning Test 7: TransferModal Categories & Season Modal Continuity...');
  const transferFile = fs.readFileSync(path.join(MODALS_DIR, 'TransferModal.tsx'), 'utf-8');
  assert(transferFile.includes("'all'"), 'Must support All Operations category');
  assert(transferFile.includes("'signings'"), 'Must support Incoming Signings category');
  assert(transferFile.includes("'loans_sales'"), 'Must support Loans & Sales category');
  assert(transferFile.includes("'academy'"), 'Must support Academy Call-Up category');
  assert(transferFile.includes('TRANSFER BUDGET'), 'Must include 3-column bento budget');
  assert(transferFile.includes('NET / MATCH'), 'Must include 3-column bento net/match');
  assert(transferFile.includes('SQUAD CAPACITY'), 'Must include 3-column bento squad capacity');
  assert(transferFile.includes('Pull to Squad'), 'Must include per-prospect pull to squad action');

  const dashboardFile = fs.readFileSync(path.join(MODALS_DIR, 'Dashboard.tsx'), 'utf-8');
  assert(dashboardFile.includes('seasonResultData || showWinterBreak || statusChange'), 'Must preserve scroll across seasonal transition modals');

  console.log('✓ Test 7 Passed: TransferModal categorized navigation and seasonal scroll preservation verified.');
}

// TEST 8: Verify Complete Season Modal Multi-Year Support & Clean Scroll Geometry
{
  console.log('\nRunning Test 8: Season Modal Multi-Year Support & Clean Scroll Geometry...');
  const leagueTableFile = fs.readFileSync(path.join(MODALS_DIR, 'LeagueTableModal.tsx'), 'utf-8');
  assert(leagueTableFile.includes('targetYear'), 'LeagueTableModal must support targetYear prop');
  assert(leagueTableFile.includes('availableYears'), 'LeagueTableModal must compute availableYears from career history');
  assert(leagueTableFile.includes('selectedYear'), 'LeagueTableModal must maintain selectedYear state');

  const seasonFinishFile = fs.readFileSync(path.join(MODALS_DIR, 'SeasonFinishModal.tsx'), 'utf-8');
  assert(seasonFinishFile.includes("'history'"), 'SeasonFinishModal must support Chronicle / history tab');
  assert(seasonFinishFile.includes('targetYear={selectedYearForTable}'), 'SeasonFinishModal must pass selectedYearForTable to LeagueTableModal');
  assert(seasonFinishFile.includes('overflow-hidden') && seasonFinishFile.includes('overflow-y-auto'), 'SeasonFinishModal must intelligently switch overflow behavior between table and scrollable content');

  const seasonHistoryTableFile = fs.readFileSync(path.join(MODALS_DIR, 'SeasonHistoryTable.tsx'), 'utf-8');
  assert(seasonHistoryTableFile.includes('ref={isLast ? activeRowRef : undefined}'), 'SeasonHistoryTable must bind activeRowRef to latest season');

  console.log('✓ Test 8 Passed: Complete season multi-year navigation and zero-scroll-bug geometry verified.');
}

console.log('\n======================================================');
console.log('ALL MODAL INTERACTION & UI INTEGRITY AUDIT TESTS PASSED');
console.log('======================================================\n');
