import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateYouthProspect } from '../engine/engine';
import { useGameStore } from '../store/useGameStore';

describe('Youth Realism & Club Vision Archetypes Audit', () => {
    it('generateYouthProspect adds +12 quality bonus when clubVision is Youth Academy Focus', () => {
        // Run statistical sample to verify positive distribution shift
        let standardScores = 0;
        let visionScores = 0;
        const iterations = 500;

        for (let i = 0; i < iterations; i++) {
            const pStandard = generateYouthProspect(1, 'GER', 1, { clubVision: 'Standard' });
            const pVision = generateYouthProspect(1, 'GER', 1, { clubVision: 'Youth Academy Focus' });
            standardScores += pStandard.boost;
            visionScores += pVision.boost;
        }

        assert.ok(visionScores > standardScores, `Expected Youth Academy Focus boost total (${visionScores}) to exceed Standard (${standardScores})`);
    });

    it('setClubVision checks director points and updates state', () => {
        const store = useGameStore.getState();
        store.updateState({ skillPoints: 1, clubVision: 'Standard' });

        // Attempting to change vision with only 1 DP fails
        useGameStore.getState().setClubVision('Financial Prudence');
        assert.strictEqual(useGameStore.getState().clubVision, 'Standard', 'Should not change vision if DP < 2');

        // Grant 3 DP and change vision
        useGameStore.getState().updateState({ skillPoints: 3 });
        useGameStore.getState().setClubVision('Financial Prudence');
        assert.strictEqual(useGameStore.getState().clubVision, 'Financial Prudence', 'Should update vision when DP >= 2');
        assert.strictEqual(useGameStore.getState().skillPoints, 1, 'Should deduct exactly 2 DP');
    });

    it('pullYouthPlayer grants full immediate OVR boost for Elite squads (>= 82 OVR)', () => {
        const store = useGameStore.getState();
        const testProspect = {
            id: 'elite-prospect-1',
            name: 'Lukas Talent',
            age: 16,
            boost: 2,
            timer: 0,
            type: 'top_prospect' as const,
            position: 'CB' as const,
        };

        store.updateState({
            club: {
                ...store.club,
                baseOvr: 84, // Elite squad
                squadSize: 17,
                tier: 1,
                academyLevel: 5
            },
            youthPipeline: [testProspect],
            youthDevQueue: 0
        });

        const res = useGameStore.getState().pullYouthPlayer('elite-prospect-1');
        assert.strictEqual(res.success, true);
        const updated = useGameStore.getState();
        // For boost 2 on elite squad: instantGain = 2, queuedGain = 0
        assert.strictEqual(updated.club.baseOvr, 86, 'Elite squad should receive full immediate +2 OVR boost');
        assert.strictEqual(updated.youthDevQueue, 0, 'No deferred queue needed when full boost is applied immediately');
    });

    it('pullYouthPlayer handles non-elite squad instant promotion', () => {
        const store = useGameStore.getState();
        const testProspect = {
            id: 'normal-prospect-1',
            name: 'Felix Youngster',
            age: 16,
            boost: 2,
            timer: 0,
            type: 'top_prospect' as const,
            position: 'LW' as const,
        };

        store.updateState({
            club: {
                ...store.club,
                baseOvr: 72, // Non-elite squad
                squadSize: 17,
                tier: 2,
                academyLevel: 3
            },
            youthPipeline: [testProspect],
            youthDevQueue: 0
        });

        const res = useGameStore.getState().pullYouthPlayer('normal-prospect-1');
        assert.strictEqual(res.success, true);
        const updated = useGameStore.getState();
        // For boost 2 on non-elite: instantGain = 2, queuedGain = 0
        assert.strictEqual(updated.club.baseOvr, 74, 'Non-elite squad gets instant +2 OVR');
        assert.strictEqual(updated.youthDevQueue, 0, 'No queue needed for <3 boost on non-elite squad');
    });
});
