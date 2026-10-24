import assert from 'assert';
import { useGameStore } from '../store/useGameStore';
import { ALL_CLUBS } from '../data/clubsData';
import { calculateClubFinancials } from '../data/gameConstants';

console.log('--- RUNNING DASHBOARD HEADER BENTO REACTIVITY AUDIT ---');

// Reset store to known state with Tier 1 German club
const baseClub = { ...ALL_CLUBS[0], tier: 1, country: 'GER', baseOvr: 75, fanBase: 12000, academyLevel: 1, medicalLevel: 1 };
useGameStore.setState({
  club: baseClub,
  budget: 5000000,
  sponsorsPitchedThisSeason: 0,
  regionalToursThisSeason: 0,
  managerSkills: [],
  history: [],
  ovrHistory: [],
  year: 2026,
});

// Test 1: Pitching Standard Commercial Sponsor
console.log('Test 1: Pitching commercial sponsor updates budget immediately...');
const budgetBeforeSponsor = useGameStore.getState().budget;
useGameStore.getState().pitchSponsor(0); // 100% guaranteed standard sponsor
const budgetAfterSponsor = useGameStore.getState().budget;
assert.ok(
  budgetAfterSponsor > budgetBeforeSponsor,
  `Budget must increase on standard commercial deal: before ${budgetBeforeSponsor}, after ${budgetAfterSponsor}`
);
console.log(`✓ Test 1 Passed: Commercial deal added €${budgetAfterSponsor - budgetBeforeSponsor} directly to treasury.`);

// Test 2: Buying a Player Updates Treasury and OVR
console.log('Test 2: Buying player deducts fee from treasury and updates base OVR...');
const budgetBeforeBuy = useGameStore.getState().budget;
const ovrBeforeBuy = useGameStore.getState().club.baseOvr || 75;
useGameStore.getState().buyPlayer(500000, 2, 1, 'reg');
const budgetAfterBuy = useGameStore.getState().budget;
const ovrAfterBuy = useGameStore.getState().club.baseOvr || 75;
assert.strictEqual(budgetAfterBuy, budgetBeforeBuy - 500000, 'Budget must decrease by exact transfer fee');
assert.strictEqual(ovrAfterBuy, ovrBeforeBuy + 2, 'OVR must increase by ovrGain');
console.log(`✓ Test 2 Passed: Player acquisition updated treasury (€${budgetBeforeBuy} -> €${budgetAfterBuy}) and OVR (${ovrBeforeBuy} -> ${ovrAfterBuy}).`);

// Test 3: Selling a Player Injects Cash into Treasury
console.log('Test 3: Selling player injects fee into treasury and adjusts squad...');
const budgetBeforeSell = useGameStore.getState().budget;
useGameStore.getState().buyPlayer(-350000, -1, -1, 'sell');
const budgetAfterSell = useGameStore.getState().budget;
assert.strictEqual(budgetAfterSell, budgetBeforeSell + 350000, 'Budget must increase by sell fee');
console.log(`✓ Test 3 Passed: Player sale credited +€350,000 to treasury.`);

// Test 4: Live Financials Recalculation
console.log('Test 4: Financials net cashflow dynamically recalculates on state changes...');
const finInitial = calculateClubFinancials(useGameStore.getState());
useGameStore.setState({
  club: { ...useGameStore.getState().club, academyLevel: 3, medicalLevel: 3 }
});
const finUpgraded = calculateClubFinancials(useGameStore.getState());
assert.ok(
  (finUpgraded.academyOp + finUpgraded.medicalOp) > (finInitial.academyOp + finInitial.medicalOp),
  'Facility upkeep must reflect level upgrades'
);
console.log(`✓ Test 4 Passed: Upkeep dynamically adjusted from €${finInitial.academyOp + finInitial.medicalOp} to €${finUpgraded.academyOp + finUpgraded.medicalOp}.`);

console.log('========================================================================');
console.log('ALL DASHBOARD HEADER REACTIVITY TESTS PASSED SUCCESSFULLY (4/4)');
console.log('========================================================================');
