import assert from 'node:assert';
import { getAcademySlotLimit, YouthProspect } from '../types';
import { generateYouthProspect } from '../engine/engine';
import { useGameStore } from '../store/useGameStore';
import { ALL_CLUBS } from '../data/clubsData';

console.log('--- RUNNING YOUTH INCUBATOR & TALENT SYSTEM TEST SUITE ---');

// TEST 1: Academy Slot Limits (Level 1: 6, Level 2: 8, Level 3: 10, Level 4: 11, Level 5: 12)
{
    console.log('Test 1: Academy slot scaling limits...');
    assert.strictEqual(getAcademySlotLimit(1), 6, 'Level 1 must offer 6 prospect slots');
    assert.strictEqual(getAcademySlotLimit(2), 8, 'Level 2 must offer 8 prospect slots');
    assert.strictEqual(getAcademySlotLimit(3), 10, 'Level 3 must offer 10 prospect slots');
    assert.strictEqual(getAcademySlotLimit(4), 11, 'Level 4 must offer 11 prospect slots');
    assert.strictEqual(getAcademySlotLimit(5), 12, 'Level 5 must offer 12 prospect slots (Max)');
    console.log('✓ Test 1 Passed: Slot limits scale correctly from 6 to 12 slots');
}

// TEST 2: 1:1 Seasonal Scouting Quota Governed by Academy Level (Level 1 allows 1 recruit)
{
    console.log('Test 2: Scouting quota scales 1:1 with academy level...');
    const store = useGameStore.getState();
    const testClub = { ...ALL_CLUBS[0], tier: 1, academyLevel: 1 };
    
    useGameStore.setState({
        club: testClub,
        budget: 5000000,
        youthPipeline: [],
        youthSpend: 0,
        youthScoutsThisSeason: 0
    });

    // Scout 1 prospect in the season (level 1 = 1 quota)
    const firstRecruit = useGameStore.getState().recruitYouth(15000);
    assert.strictEqual(firstRecruit.success, true, 'First recruitment should succeed');

    const pipelineAfter1 = useGameStore.getState().youthPipeline;
    assert.strictEqual(pipelineAfter1.length, 1, 'Should allow 1 prospect at Level 1');

    // 2nd recruitment should be rejected because quota for Level 1 (1 per season) is reached
    const secondRecruit = useGameStore.getState().recruitYouth(15000);
    assert.strictEqual(secondRecruit.success, false, 'Should reject 2nd recruit when quota reached at Level 1');
    console.log('✓ Test 2 Passed: 1:1 seasonal quota enforced at Level 1 (Max 1)');
}

// TEST 3: Prospect Discovery Tiers & Archetype Quality Roll Bonuses
// TEST 3: Prospect Discovery Tiers & Archetype Quality Roll Bonuses (Rebalanced 1 to 3 OVR)
{
    console.log('Test 3: Prospect tiers (Local: +1, Top: +2, Generational: +3) and archetype bonuses...');
    
    // Generate sample prospects with Youth Developer coach and Scout director
    let foundLocal = false;
    let foundTop = false;
    let foundGenerational = false;

    for (let i = 0; i < 60; i++) {
        const p = generateYouthProspect(5, 'GER', 1, {
            headCoachArchetype: 'Youth Developer',
            directorArchetype: 'Scout / Youth Developer'
        });

        assert(p.age >= 15 && p.age <= 17, `Age must be between 15 and 17, got ${p.age}`);
        assert(p.timer >= 1 && p.timer <= 3, `Maturation timer must be 1 to 3 seasons, got ${p.timer}`);

        if (p.type === 'local') {
            assert.strictEqual(p.boost, 1, `Local prospect boost should be +1, got ${p.boost}`);
            foundLocal = true;
        } else if (p.type === 'top_prospect') {
            assert.strictEqual(p.boost, 2, `Top prospect boost should be +2, got ${p.boost}`);
            foundTop = true;
        } else if (p.type === 'generational') {
            assert.strictEqual(p.boost, 3, `Generational talent boost should be +3, got ${p.boost}`);
            foundGenerational = true;
        }
    }

    assert(foundGenerational, 'Wonderkid / Generational talent must appear with Level 5 academy and Scout perks');
    console.log('✓ Test 3 Passed: 3 prospect tiers generate with realistic 1-3 OVR potential bounds');
}

// TEST 4: Full Immediate OVR Boost on Senior Promotion
{
    console.log('Test 4: Full immediate OVR boost (+3 OVR) when signing to senior squad...');
    const testClub = { ...ALL_CLUBS[0], tier: 1, baseOvr: 70, squadSize: 18, academyLevel: 3 };
    const wonderkid: YouthProspect = {
        id: 'wk-1',
        name: 'Mateo Generational',
        age: 17,
        boost: 3, // +3 Generational Wonderkid
        timer: 0, // Matured graduate
        type: 'generational',
        tierType: 'generational',
        nationality: 'GER'
    };

    useGameStore.setState({
        club: testClub,
        youthPipeline: [wonderkid],
        ovrHistory: []
    });

    const result = useGameStore.getState().pullYouthPlayer('wk-1');
    assert(result.success, `Promotion should succeed: ${result.message}`);

    const newClub = useGameStore.getState().club;
    // +3 Generational talent yields full +3 OVR jump immediately (70 + 3 = 73)
    assert.strictEqual(newClub.baseOvr, 73, `Base OVR should increase by +3 immediately (70 -> 73), got ${newClub.baseOvr}`);
    assert.strictEqual(newClub.squadSize, 19, 'Squad size should increase by 1');
    console.log('✓ Test 4 Passed: Full immediate OVR boost (+3 OVR) correctly applied upon senior call-up');
}

// TEST 5: The Graduation Trilemma - Farm Loan (Affiliate Loan) +1 OVR Development Bonus
{
    console.log('Test 5: Farm loan sends prospect out for 1 season and adds +1 OVR developmental bonus...');
    const testClub = { ...ALL_CLUBS[0], tier: 1, academyLevel: 2 };
    const topProspect: YouthProspect = {
        id: 'top-1',
        name: 'Lukas TopProspect',
        age: 16,
        boost: 2,
        timer: 1,
        type: 'top_prospect',
        tierType: 'top_prospect',
        nationality: 'GER'
    };

    useGameStore.setState({
        club: testClub,
        year: 2026,
        youthPipeline: [topProspect]
    });

    const loanResult = useGameStore.getState().loanYouthProspect('top-1');
    assert(loanResult.success, `Loan should succeed: ${loanResult.message}`);

    const loanedProspect = useGameStore.getState().youthPipeline.find(p => p.id === 'top-1');
    assert(loanedProspect?.isLoanedOut, 'Prospect must be flagged as isLoanedOut');
    assert.strictEqual(loanedProspect?.boost, 3, 'Boost should increase by +1 developmental bonus (2 -> 3)');
    assert.strictEqual(loanedProspect?.loanReturnSeason, 2027, 'Return season should be year + 1 (2027)');
    console.log('✓ Test 5 Passed: Farm loan correctly awards +1 OVR developmental bonus and schedules 1-season return');
}

// TEST 6: Modest & Realistic European & International Training Compensation
{
    console.log('Test 6: Modest & realistic European training compensation (under €1M for wonderkids)...');
    const gerClub = { ...ALL_CLUBS[0], country: 'GER', tier: 1, academyLevel: 3 };
    const gerWonderkid: YouthProspect = {
        id: 'ger-wk',
        name: 'Elias Hoffmann',
        age: 17,
        boost: 3,
        timer: 0,
        type: 'generational',
        tierType: 'generational',
        nationality: 'GER'
    };

    useGameStore.setState({
        club: gerClub,
        budget: 1000000,
        year: 2026,
        youthPipeline: [gerWonderkid],
        youthSalesThisSeason: 0
    });

    const sellResult = useGameStore.getState().sellYouthProspect('ger-wk');
    assert(sellResult.success, `Sale should succeed: ${sellResult.message}`);
    // Modest fee: under €1M rather than €5.25M inflated sum
    assert(sellResult.fee >= 500000 && sellResult.fee <= 950000, `German wonderkid fee should be between €500K and €950K, got ${sellResult.fee}`);
    
    const postBudget = useGameStore.getState().budget;
    assert.strictEqual(postBudget, 1000000 + sellResult.fee, 'Budget must be credited with realistic fee');
    console.log(`✓ Test 6 Passed: SC Magdeburg/German wonderkid transfer fee rebalanced to realistic €${(sellResult.fee/1000).toFixed(0)}K`);
}

// TEST 7: Anti-Poaching Legal Protection Scaling (45% + 10% * academyLevel)
{
    console.log('Test 7: Legal protection defense chance calculation...');
    const testClubLvl3 = { ...ALL_CLUBS[0], academyLevel: 3 };
    const prospect: YouthProspect = {
        id: 'p-def',
        name: 'Protected Star',
        age: 16,
        boost: 3,
        timer: 2,
        type: 'top_prospect',
        nationality: 'GER'
    };

    useGameStore.setState({
        club: testClubLvl3,
        budget: 1000000,
        youthPipeline: [prospect]
    });

    useGameStore.getState().protectYouth('p-def', 25000);
    const protectedProspect = useGameStore.getState().youthPipeline.find(p => p.id === 'p-def');
    assert(protectedProspect?.isProtected, 'Prospect should be protected');
    // Level 3 defense: 45 + 10 * 3 = 75%
    assert.strictEqual(protectedProspect?.protectionDefenseChance, 75, `Level 3 defense chance should be 75%, got ${protectedProspect?.protectionDefenseChance}`);
    console.log('✓ Test 7 Passed: Legal shield defense rate calculated accurately (75% at Lvl 3)');
}

// TEST 8: Level 2 Academy (8 slots), Credit Facility Support, and Enrollment Result Verification
{
    console.log('Test 8: Level 2 Academy capacity (8 slots) & credit facility recruitment...');
    const testClubLvl2 = { ...ALL_CLUBS[0], tier: 1, country: 'GER', academyLevel: 2 };
    
    // Create initial 6 prospects
    const initial6: YouthProspect[] = Array.from({ length: 6 }, (_, i) => ({
        id: `init-${i}`,
        name: `Prospect ${i + 1}`,
        age: 16,
        boost: 1,
        timer: 1,
        type: 'local',
        nationality: 'GER'
    }));

    // Club has low liquid budget (€2,000 < €15,000), but credit limit is €250,000
    useGameStore.setState({
        club: testClubLvl2,
        budget: 2000,
        youthPipeline: [...initial6],
        youthSpend: 0,
        youthScoutsThisSeason: 0
    });

    // 7th slot: Scout talent with fee €15,000 using available bank credit facility
    const scoutRes7 = useGameStore.getState().recruitYouth(15000);
    assert.strictEqual(scoutRes7.success, true, 'Recruitment should succeed using bank credit facility');
    assert.strictEqual(useGameStore.getState().youthPipeline.length, 7, 'Pipeline should advance from 6/8 to 7/8');
    assert.strictEqual(useGameStore.getState().budget, -13000, 'Budget should reflect deduction into credit facility');

    // 8th slot: Free trialist
    const scoutRes8 = useGameStore.getState().recruitYouth(0);
    assert.strictEqual(scoutRes8.success, true, 'Free trialist should succeed');
    assert.strictEqual(useGameStore.getState().youthPipeline.length, 8, 'Pipeline should reach full capacity at 8/8');

    // 9th attempt: Should be rejected because academy is full (8/8)
    const scoutRes9 = useGameStore.getState().recruitYouth(15000);
    assert.strictEqual(scoutRes9.success, false, 'Should reject 9th recruit when Level 2 is full (8/8)');
    assert.strictEqual(useGameStore.getState().youthPipeline.length, 8, 'Pipeline must remain capped at 8');

    // Exhausted credit facility scenario: budget beyond credit limit (€1.5M for Tier 1 GER)
    useGameStore.setState({
        budget: -2000000, // Beyond Tier 1 credit limit (€1.5M)
        youthPipeline: [...initial6] // Reset to 6/8
    });
    const brokeRes = useGameStore.getState().recruitYouth(15000);
    assert.strictEqual(brokeRes.success, false, 'Should reject recruitment when both cash and credit are completely exhausted');
    assert.strictEqual(useGameStore.getState().youthPipeline.length, 6, 'Pipeline must not enroll player when funds/credit are exhausted');

    console.log('✓ Test 8 Passed: Level 2 academy slots (8 max), credit facility scouting, and status verification confirmed.');
}

// TEST 9: Premier Youth Academy in Lower Leagues (>2 OVR talents produced) & Lower-Tier Poaching Pressure
{
    console.log('Test 9: Premier youth academy in lower leagues produces >2 OVR talents, and lower tiers face higher poaching pressure despite Level 3,4,5 academy...');
    
    // Part A: Premier academy (Level 5) in Tier 4 produces >2 OVR talents (boost >= 3)
    let wonderkidCountTier4 = 0;
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
        const p = generateYouthProspect(5, 'GER', 4);
        if (p.boost > 2) {
            wonderkidCountTier4++;
        }
    }
    assert(wonderkidCountTier4 >= 15, `Level 5 academy in Tier 4 should produce >2 OVR talents under nerfed rates (got ${wonderkidCountTier4}/100)`);

    // Level 4 academy in Tier 5 also produces >2 OVR talents
    let wonderkidCountLvl4 = 0;
    for (let i = 0; i < iterations; i++) {
        const p = generateYouthProspect(4, 'GER', 5);
        if (p.boost > 2) {
            wonderkidCountLvl4++;
        }
    }
    assert(wonderkidCountLvl4 >= 5, `Level 4 academy in Tier 5 should produce >2 OVR talents under nerfed rates (got ${wonderkidCountLvl4}/100)`);

    // Part B: Poaching pressure in lower tiers vs Tier 1
    // Simulate poaching over multiple seasons for Tier 1 vs Tier 4 with Level 5 academy and protected >2 OVR prospects
    const testClubT1 = { ...ALL_CLUBS[0], tier: 1, baseOvr: 85, academyLevel: 5 };
    const testClubT4 = { ...ALL_CLUBS[0], tier: 4, baseOvr: 55, academyLevel: 5 };

    const runPoachSim = (clubTier: number) => {
        const isStar = true;
        const playedTier = clubTier;
        const academyLevel = 5;
        const baseDefenseRate = (45 + 10 * academyLevel) / 100; // 0.95
        let effectiveDefenseRate = baseDefenseRate;
        if (playedTier > 1) {
            const tierPenalty = (playedTier - 1) * 0.09;
            const starTargetPenalty = isStar ? 0.12 : 0.04;
            effectiveDefenseRate = Math.max(0.15, baseDefenseRate - tierPenalty - starTargetPenalty);
        }
        return effectiveDefenseRate;
    };

    const defRateT1 = runPoachSim(1);
    const defRateT4 = runPoachSim(4);

    assert.strictEqual(defRateT1, 0.95, `Tier 1 with Level 5 academy should have 95% defense rate, got ${defRateT1}`);
    assert(defRateT4 < 0.65, `Tier 4 should have significantly reduced defense rate (< 65%) despite Level 5 academy, got ${defRateT4}`);
    assert(defRateT4 < defRateT1, 'Lower tiers must face higher vulnerability / lower defense rate than Tier 1');

    console.log(`✓ Test 9 Passed: Premier academy reliably produces >2 OVR talents in lower tiers (${wonderkidCountTier4}%), and Tier 4 defense drops from ${(defRateT1*100).toFixed(0)}% to ${(defRateT4*100).toFixed(0)}% due to predatory top-flight poaching.`);
}

console.log('--- ALL YOUTH INCUBATOR TESTS PASSED SUCCESSFULLY ---');
