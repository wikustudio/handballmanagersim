import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateProbabilisticSeason, generateYouthProspect, processAging, getLeagueSize } from '../engine/engine';
import { simulateGlobalLeagues } from '../engine/leagueSimulation';
import { calculateClubFinancials, getLeagueScaledVal, getStartingBudget, getCreditLimit, formatMoney, isReserveClub, getMaxTier, calculateInitialReputation, getLeagueInfo, getRegionalTourCost, getClubHistoricContext, getLeagueMaxAttendance, normalizeCountry, getRequiredAcademyLevelForYouthPull, getMaxYouthPullsPerSeason, getClubCatchmentCeiling, getCalibratedStartingFanbase, getCountryEconomicProfile, MAX_ARENA_CAPACITY, getCountryMult, getPinnacleArenaCapacity, formatOrganicAttendance, getFAInfo, setActiveCountryCode, MANAGER_SKILLS, getDynamicSponsorPitchTerms, getSponsorBrandForClub } from '../data/gameConstants';
import { generateLeagueTable } from '../utils/leagueTableGenerator';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, mergeClubWithWorldState } from '../utils/modManager';
import { saveHighscore, calculateLiveScore } from '../utils/leaderboard';
import { GameState, Club, YouthProspect, SeasonHistory, getAcademySlotLimit } from '../types';
import { trackEvent } from '../utils/analytics';
import { generateBoardRoadmap, evaluateRoadmapProgress, getOrGenerateRoadmap, isEuropeanPowerhouseClub } from '../utils/roadmapManager';
import { createClubLoan, getBaseLoanPrincipal } from '../utils/loanManager';
import { getLocalAssetPath } from '../data/teams';

export const getInitialBoardExpectations = (club?: Club, worldClubsArg: Record<string, Club> = {}) => {
    const cClub = club || defaultFallbackClub;
    const allClubs = (getActiveClubs && getActiveClubs()) || (ALL_CLUBS || []);
    const mergedAllClubsInit = allClubs.map(c => worldClubsArg?.[c.id] ? { ...c, ...worldClubsArg[c.id] } : { ...c });
    const normInitCountry = normalizeCountry(cClub.country || 'GER');
    const sameTierClubs = mergedAllClubsInit.filter(c => c.tier === cClub.tier && normalizeCountry(c.country || 'GER') === normInitCountry);
    const effectiveClubs = sameTierClubs.length >= 4 ? sameTierClubs : mergedAllClubsInit.filter(c => c.tier === cClub.tier);
    const w = getLeagueSize(cClub.tier, cClub.country || 'GER', cClub.id, cClub.tier, cClub.country || 'GER', mergedAllClubsInit);
    const nextLeagueAvg = effectiveClubs.length > 0
        ? effectiveClubs.reduce((sum, c) => sum + (c.baseOvr || 70), 0) / effectiveClubs.length
        : (cClub.tier === 1 ? 84 : cClub.tier === 2 ? 73 : cClub.tier === 3 ? 63 : 55);
    const isGiant = isEuropeanPowerhouseClub(cClub);
    let boardExpectsSuccess = isGiant || (cClub.tier === 1 && (cClub.baseOvr || 70) >= 83);
    
    const defaultMid = Math.max(1, Math.round(w * 0.65));
    const defaultUpperHalf = Math.max(1, Math.round(w * 0.44));
    const defaultAvoidReleg = Math.max(1, w - 3);
    const defaultTop4 = Math.min(4, Math.max(2, Math.round(w * 0.25)));
    
    let boardTargetPos = defaultMid;
    let boardExpectation = "Mid-table finish";
    
    if (cClub.tier === 1 && (cClub.baseOvr >= 85 || isGiant || (boardExpectsSuccess && cClub.baseOvr >= 80))) {
        boardTargetPos = 1;
        boardExpectation = "Win Championships & European Silverware";
    } else if (cClub.tier > 1 && cClub.baseOvr >= nextLeagueAvg + 6) {
        boardTargetPos = 1;
        boardExpectation = "Win League Title & Direct Promotion";
    } else if (cClub.tier === 1 && (boardExpectsSuccess || cClub.baseOvr >= nextLeagueAvg + 4)) {
        boardTargetPos = defaultTop4;
        boardExpectation = "EHF Champions League / Title Push";
    } else if (cClub.tier > 1 && cClub.baseOvr >= nextLeagueAvg + 3) {
        boardTargetPos = 2;
        boardExpectation = "Promotion Battle / Top 2 Finish";
    } else if (cClub.baseOvr < nextLeagueAvg - 4) {
        boardTargetPos = defaultAvoidReleg;
        boardExpectation = "Avoid Relegation";
    } else if (cClub.baseOvr >= nextLeagueAvg + 4) {
        boardTargetPos = defaultUpperHalf;
        boardExpectation = "Upper Half Finish";
    } else {
        boardTargetPos = defaultMid;
        boardExpectation = "Mid-Table";
    }
    return { boardTargetPos, boardExpectation, boardExpectsSuccess };
};

export const defaultFallbackClub: Club = (ALL_CLUBS && ALL_CLUBS[0]) ? ALL_CLUBS[0] : {
    id: 1,
    name: 'Default Club',
    tier: 1,
    baseOvr: 60,
    squadSize: 18,
    morale: 75,
    country: 'GER',
    stadium: 3000,
    fanBase: 10000,
    color: '#0054a6',
    color2: '#ffffff',
    academyLevel: 1,
    medicalLevel: 1
};

export const POSTSEASON_CHECKPOINT_KEY = 'handball-postseason-checkpoint';

export const pruneCareerHistoryForStorage = (history: SeasonHistory[]): SeasonHistory[] => {
    if (!Array.isArray(history)) return [];
    const len = history.length;
    return history.map((h, idx) => {
        if (!h || typeof h !== 'object') return h;
        const isRecent = idx >= len - 4;
        const targetYear = h.year;
        const histCountry = normalizeCountry(h.country || 'GER');
        const histClubNorm = (h.clubName || '').trim().toLowerCase();

        // Always scope h.universeMovements strictly to h.year to prevent multi-season movement duplication bloat
        let scopedMovements = Array.isArray(h.universeMovements)
            ? h.universeMovements.filter((m: any) => m && (m.year === undefined || m.year === targetYear))
            : undefined;

        if (!isRecent && scopedMovements) {
            // For seasons >4 years old, keep all champions, cups, takeovers, insolvencies, user-country moves, and user-club moves
            scopedMovements = scopedMovements.filter((m: any) =>
                m.isKey ||
                m.type === 'champion' ||
                m.type === 'intl_cup' ||
                m.type === 'takeover' ||
                m.type === 'insolvency_relegation' ||
                normalizeCountry(m.country || 'GER') === histCountry ||
                (m.clubName && m.clubName.trim().toLowerCase() === histClubNorm)
            );
        }

        if (!isRecent) {
            const { divisionTables: _dt, finalTable: _ft, resolvedMatchContext: _rmc, ...stripped } = h as any;
            return {
                ...stripped,
                ...(scopedMovements ? { universeMovements: scopedMovements } : {})
            };
        }

        return {
            ...h,
            ...(scopedMovements ? { universeMovements: scopedMovements } : {})
        };
    });
};

const initialState: GameState = {
    careerId: 'career_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9),
    isCareerEnded: false,

    skillPoints: 0,
    managerSkills: [],
    score: 0,
    careerScore: 0,
    sponsorIncome: 0,
    performanceSponsorSignedThisSeason: false,
    performanceSponsorBlockedNextSeason: false,
    lastInsolventGiantNotice: undefined,
    cupRunResults: [],
    resolvedMatchContext: undefined,
    activeCupTournament: undefined,
    activeEuroTournament: undefined,
    cupQualifiedForSf: null,
    euroQualifiedForSf: null,
    activeLoan: null,
    endlessModeActive: false,
    simPhase: 'idle',
    pendingSeasonState: null,
    activeMatch: null,
    worldClubs: {},
    universeMovements: [],
    notifications: [],
    isSacked: false,
    youthPipeline: [],
    boardExpectation: '',
    boardTargetPos: 18,
    bankruptcyPending: false,
    sponsorDealsThisSeason: 0,
    winterBreakSeenYear: -1,
    winterTransfersOpenedYear: -1,

    year: 2024,
    managerName: '',
    tactic: 'Balanced',
    mode: 'standard',
    club: defaultFallbackClub,
    budget: 500000,
    euroStatus: null,
    history: [],
    totals: { matches: 0, wins: 0, att: 0, trophies: 0, domTrophies: 0, intTrophies: 0 },
    reputation: calculateInitialReputation(defaultFallbackClub?.baseOvr || 60),
    trophies: [],
    lastJobOfferYear: 2024,
    maxOvrCap: 100,
    clubImpactScore: 50,
    transferSpend: 0,
    facilitySpend: 0,
    youthSpend: 0,
    immunityShields: 1,
    tenureYears: 0,
    investmentsThisSeason: 0,
    sponsorsPitchedThisSeason: 0,
    activePerformanceDeal: false,
    seasonSponsorDeals: {},
    seasonSponsorDealsYear: 2024,
    stadiumExpandedThisSeason: 0,
    infraActionsThisSeason: 0,
    academyUpgradedThisSeason: 0,
    medicalUpgradedThisSeason: 0,
    regTransfersThisSeason: 0,
    keyTransfersThisSeason: 0,
    galacticosThisSeason: 0,
    squadSalesThisSeason: 0,
    loansThisSeason: 0,
    veteranRingerSignedThisSeason: false,
    veteranRingerOvrGain: 0,
    veteranRingerWageCost: 0,
    veteranRingerName: undefined,
    youthPullsThisSeason: 0,
    youthSalesThisSeason: 0,
    youthSalesSeasonYear: 2024,
    youthScoutsThisSeason: 0,
    schoolTrialistsThisSeason: 0,
    lastGenerationalTurnoverYear: undefined,
    lastGenerationalRebuildYear: undefined,
    rebuildImmunity: false,
    rebuildWageDiscountSeasons: 0,
    rebuildYouthAccelSeasons: 0,
    headCoachArchetype: 'Standard',
    directorArchetype: 'Standard',
    clubVision: 'Standard',
    youthDevQueue: 0,
    jobMarketSearchesThisSeason: 0,
    regionalToursThisSeason: 0,
    brandCampaignsThisSeason: 0,
    teamBondingThisSeason: 0,
    isNewSeasonRender: false,
    initialRenderDone: false,
    clWins: 0,
    consecutiveTitles: 0,
    trophyDrought: 0,
    activePromise: false,
    boardWarning: false,
    boardExpectsSuccess: false,
    boardGracePeriod: 0,
    boardUltimatum: false,
    seasonsInDebt: 0,
    lang: 'en'
};

interface GameStore extends GameState {
    updateState: (updates: Partial<GameState>) => void;
    setLang: (lang: any) => void;
    initGame: (teamId: string, headCoachName: string, startYear: number, philosophy: string, mode: string) => void;
    setPhilosophy: (key: string) => void;
    acceptJobOffer: (club: Club) => void;
    buyPlayer: (cost: number, ovrGain: number, sizeDelta: number, type: 'reg' | 'key' | 'superstar' | 'loan' | 'sell') => void;
    signVeteranRinger: (customFee?: number, customGain?: number, customWage?: number, customName?: string) => { success: boolean; message: string; name?: string; gain?: number; fee?: number; wage?: number };
    expandArena: (cost: number, fanGain: number, seats: number, isAbsolute?: boolean) => void;
    expandStadium: (cost: number, seats: number, fanGain?: number) => void;
    structureArenaFinancing: (
        downPayment: number,
        principal: number,
        termYears: 10 | 15 | 25,
        seats: number,
        opt: any,
        annualPayment: number,
        monthlyPayment: number,
        totalRepayment: number
    ) => void;
    setFanStrategy: (strategy: 'ultras' | 'community' | 'corporate' | 'balanced') => void;
    teamBonding: (cost: number) => void;
    recruitYouth: (cost: number, customProspect?: any) => { success: boolean; message: string; prospect?: any };
    protectYouth: (id: string, cost: number) => void;
    pitchSponsor: (type: 0 | 1 | 2) => void;
    conductRegionalTour: () => any;
    launchBrandCampaign: (campaignType?: 1 | 2 | 3) => any;
    launchIPO: (offeringPrice: number) => void;
    simulateSeason: () => any;
    applyPlayoffTierChange: (newTier: number, swapOpponentName?: string) => void;
    applyRelegationPenalty: () => { isSacked: boolean; toast: any };
    resolveBankruptcy: (choice: 'insolvency' | 'firesale' | 'resign') => void;
    resetGame: () => void;
    endCareer: () => void;
    dismissNotification: (id: string) => void;
    unlockManagerSkill: (skillId: string) => void;
    upgradeFacility: (type: "academy" | "medical", cost: number) => void;
    logOvrChange: (change: number, reason: string, reasonDe: string) => void;
    takeClubLoan: (termYears: 10 | 15 | 25, customPrincipal?: number) => { success: boolean; message: string };
    repayClubLoanEarly: (customAmount?: number, mode?: 'reduce_installment' | 'shorten_term') => { success: boolean; message: string };
    applyPatronRescuePackage: () => { success: boolean; amountCleared: number; message: string };
    terminateContractMutual: () => { success: boolean; message: string };
    pullYouthPlayer: (prospectId?: string) => { success: boolean; message: string; prospectName?: string };
    loanYouthProspect: (prospectId: string) => { success: boolean; message: string; prospectName?: string };
    sellYouthProspect: (prospectId: string) => { success: boolean; fee: number; message: string };
    executeGenerationalRebuild: () => { success: boolean; message: string; windfall?: number; ovrDrop?: number };
    setHeadCoachArchetype: (archetype: 'Youth Developer' | 'Scout' | 'Continental Legend' | 'Tactician' | 'Motivator' | 'Standard') => void;
    setDirectorArchetype: (archetype: 'Scout / Youth Developer' | 'Financial Mogul' | 'Brand Ambassador' | 'Standard') => void;
    setClubVision: (vision: any) => void;
}

export const useGameStore = create<GameStore>()(persist((set, get) => ({
    ...initialState,
    updateState: (updates) => set((state) => {
        let updatedClub = updates.club ? { ...updates.club } : undefined;
        if (updatedClub && updatedClub.baseOvr !== undefined) {
            updatedClub.baseOvr = Math.min(100, Math.max(30, updatedClub.baseOvr));
        }
        return {
            ...state,
            ...updates,
            ...(updatedClub ? { club: updatedClub } : {})
        };
    }),
    setLang: (_lang) => set({ lang: 'en' }),
    initGame: (teamId, headCoachName, startYear, philosophy, mode) => {
        const activeClubs = getActiveClubs();
        const baseClub = activeClubs.find(u => String(u.id) === String(teamId)) || ALL_CLUBS.find(u => String(u.id) === String(teamId)) || activeClubs[0];
        const userIsReserve = isReserveClub(baseClub.name);
        const normBaseCountry = normalizeCountry(baseClub.country || 'GER');
        const possibleRivals = activeClubs.filter(rc => rc.tier === baseClub.tier && normalizeCountry(rc.country || 'GER') === normBaseCountry && rc.id !== baseClub.id && (userIsReserve || !isReserveClub(rc.name)));
        const rivalClubName = possibleRivals.length > 0 ? possibleRivals[Math.floor(Math.random() * possibleRivals.length)].name : "City Rivals";

        const resolvedContext = baseClub.historicContext || baseClub.context || getClubHistoricContext(baseClub.name, baseClub.tier, false, baseClub.country || 'GER', baseClub);
        const initEconProfile = getCountryEconomicProfile(baseClub.country || 'GER');
        const initCalibratedFans = getCalibratedStartingFanbase(baseClub);
        const rawInitFans = baseClub.fanBase || initCalibratedFans;
        const normalizedInitFans = (initEconProfile.tier === 4 && rawInitFans > initCalibratedFans * 2.5)
            ? initCalibratedFans
            : baseClub.fanBase;
        const freshClub: Club = {
            ...baseClub,
            tier: baseClub.tier,
            originalStartLeague: baseClub.tier,
            stadium: baseClub.stadium || 2000,
            fanBase: normalizedInitFans,
            historicContext: resolvedContext,
            context: resolvedContext,
            academyLevel: baseClub.academyLevel || 1,
            medicalLevel: baseClub.medicalLevel || 1,
            squadSize: baseClub.squadSize || 18,
            morale: 75,
        };

        setActiveCountryCode(freshClub.country || 'GER');
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(POSTSEASON_CHECKPOINT_KEY);
            }
        } catch {
            // ignore
        }

        set({
            ...initialState,
            startTier: baseClub.tier,
            startClubName: freshClub.name,
            year: startYear,
            managerName: headCoachName,
            tactic: philosophy,
            mode: mode as any,
            club: freshClub,
            worldClubs: {},
            history: [],
            ovrHistory: [],
            youthPipeline: [],
            stadiumExpandedThisSeason: 0,
            infraActionsThisSeason: 0,
            facilitySpend: 0,
            transferSpend: 0,
            youthSpend: 0,
            regTransfersThisSeason: 0,
            keyTransfersThisSeason: 0,
            galacticosThisSeason: 0,
            loansThisSeason: 0,
            squadSalesThisSeason: 0,
            veteranRingerSignedThisSeason: false,
            veteranRingerOvrGain: 0,
            veteranRingerWageCost: 0,
            veteranRingerName: undefined,
            winterBreakSeenYear: -1,
            winterTransfersOpenedYear: -1,
            youthPullsThisSeason: 0,
            youthPullsSeasonYear: startYear,
            youthSalesThisSeason: 0,
            youthSalesSeasonYear: startYear,
            youthScoutsThisSeason: 0,
            schoolTrialistsThisSeason: 0,
            sponsorsPitchedThisSeason: 0,
            regionalToursThisSeason: 0,
            brandCampaignsThisSeason: 0,
            teamBondingThisSeason: 0,
            investmentsThisSeason: 0,
            academyUpgradedThisSeason: 0,
            medicalUpgradedThisSeason: 0,
            activePerformanceDeal: false,
            seasonSponsorDeals: {},
            seasonSponsorDealsYear: startYear,
            supercupPlayedYear: undefined,
            pendingSupercupTrophies: undefined,
            budget: getStartingBudget(freshClub.tier, freshClub.country || 'GER'),
            reputation: calculateInitialReputation(freshClub.baseOvr),
            lastOvr: freshClub.baseOvr,
            startOfSeasonOvr: freshClub.baseOvr,
            signingOvrGainThisSeason: 0,
            signingFlopLossThisSeason: 0,
            clubImpactScore: 50,
            immunityShields: 1,
            tenureYears: 0,
            isSacked: false,
            rivalClubName,
            rivalH2HWins: 0,
            rivalH2HDraws: 0,
            rivalH2HLosses: 0,
            youthTitlesWon: 0,
            youthChampionshipSimulatedYear: undefined,
            activeCupTournament: undefined,
            activeEuroTournament: undefined,
            cupQualifiedForSf: null,
            euroQualifiedForSf: null,
            boardRoadmap: generateBoardRoadmap(freshClub, startYear, []),
            ...getInitialBoardExpectations(freshClub, {})
        });
    },
    setPhilosophy: (n) => set((r) => {
        const cost = ((r.managerSkills || []).includes('tactical_mastermind') || (r.managerSkills || []).includes('tactical_genius')) ? 0 : 5;
        if ((r.skillPoints || 0) < cost || !r.club) return r;
        if (r.tactic === n) return r;

        // Tactical Transition Friction: Switching philosophy shakes dressing room rhythm (-15 Morale)
        const currentMorale = r.club.morale !== undefined ? r.club.morale : 100;
        const newMorale = Math.max(0, currentMorale - 15);
        const updatedClub = { ...r.club, morale: newMorale };

        const frictionNotice = {
            id: Math.random().toString(),
            type: 'warning',
            category: 'tactical',
            title: 'TACTICAL TRANSITION FRICTION',
            message: `⚠️ System Pivot (${r.tactic || 'Default'} ➔ ${n}): Adapting to a brand new playbook triggers squad friction (-15 Morale). Dressing room chemistry must readjust to the new tactical triggers.`,
            read: false
        };

        return {
            skillPoints: (r.skillPoints || 0) - cost,
            tactic: n,
            club: updatedClub,
            worldClubs: {
                ...(r.worldClubs || {}),
                [r.club.id]: {
                    ...(r.worldClubs?.[r.club.id] || r.club),
                    morale: newMorale
                }
            },
            notifications: [frictionNotice, ...(r.notifications || [])]
        };
    }),
    acceptJobOffer: (n) => {
        if (!n) return;
        trackEvent('job_accepted', { new_club: n.name, tier: n.tier });
        set((r) => {
        const i = { ...(r.worldClubs || {}) };
        
        // Purge any polluted legacy NaN or undefined keys
        delete i['NaN'];
        delete i['undefined'];
        delete (i as any)[NaN];

        // Expire temporary loans and 1-season veteran ringers on departing club so baseOvr is not permanently inflated
        if (r.club && r.club.id !== undefined && !Number.isNaN(Number(r.club.id))) {
            let departingClub = { ...r.club };
            const activeLoans = r.loansThisSeason || departingClub.activeLoansCount || 0;
            const tempBoost = departingClub.temporaryOvrBoost || 0;
            if (activeLoans > 0 || tempBoost > 0) {
                const loanPenalty = tempBoost > 0 ? tempBoost : Math.ceil(activeLoans * 0.75);
                departingClub.baseOvr = Math.max(30, (departingClub.baseOvr || 60) - loanPenalty);
                departingClub.squadSize = Math.max(13, (departingClub.squadSize || 18) - activeLoans);
                departingClub.temporaryOvrBoost = 0;
                departingClub.activeLoansCount = 0;
            }
            if (r.veteranRingerSignedThisSeason) {
                const rawRingerGain = r.veteranRingerOvrGain || 4;
                const retainedRingerOvr = (departingClub.medicalLevel || 1) >= 4 ? Math.floor(rawRingerGain / 2) : 0;
                const ringerDrop = Math.max(1, rawRingerGain - retainedRingerOvr);
                departingClub.baseOvr = Math.max(30, (departingClub.baseOvr || 60) - ringerDrop);
                departingClub.squadSize = Math.max(13, (departingClub.squadSize || 18) - 1);
            }
            i[String(departingClub.id)] = departingClub;
            i[Number(departingClub.id)] = departingClub;
        }

        // Generate robust fallback ID and resolve canonical database club so stadium capacity (e.g. 350 in Iceland) is never overwritten with 2000
        const activeClubsForJob = getActiveClubs(n.country || r.club?.country);
        const matchedDbClub = activeClubsForJob.find(c => c.name && n.name && c.name.trim().toLowerCase() === n.name.trim().toLowerCase()) ||
                              ALL_CLUBS.find(c => c.name && n.name && c.name.trim().toLowerCase() === n.name.trim().toLowerCase()) ||
                              activeClubsForJob.find(c => n.id !== undefined && !Number.isNaN(Number(n.id)) && Number(c.id) === Number(n.id)) ||
                              ALL_CLUBS.find(c => n.id !== undefined && !Number.isNaN(Number(n.id)) && Number(c.id) === Number(n.id));
        let targetId = n.id;
        if (targetId === undefined || targetId === null || Number.isNaN(Number(targetId))) {
            targetId = matchedDbClub?.id ?? Math.floor(Date.now() + Math.random() * 1000);
        }

        const rawWorldEntry = targetId !== undefined ? (i[String(targetId)] || i[Number(targetId)]) : undefined;
        const worldClubEntry = (rawWorldEntry && (!n.name || !rawWorldEntry.name || rawWorldEntry.name.trim().toLowerCase() === n.name.trim().toLowerCase()))
            ? rawWorldEntry
            : undefined;
        const isRawStaticRef = ALL_CLUBS.includes(n);
        const clubWithValidId = isRawStaticRef
            ? { ...(matchedDbClub || {}), ...n, ...(worldClubEntry || {}), id: targetId }
            : { ...(matchedDbClub || {}), ...(worldClubEntry || {}), ...n, id: targetId };
        const a = clubWithValidId;
        setActiveCountryCode(a.country || 'GER');
        const o = getStartingBudget(a.tier, a.country || 'GER');
        
        // Preserve prior arena expansions and infrastructure from career history and world registry
        const pastClubSeasons = (r.history || []).filter(h => 
            (h.clubId !== undefined && (String(h.clubId) === String(targetId) || Number(h.clubId) === Number(targetId)) && (!h.clubName || !a.name || h.clubName.trim().toLowerCase() === a.name.trim().toLowerCase())) ||
            (h.clubName && a.name && h.clubName.trim().toLowerCase() === a.name.trim().toLowerCase())
        );
        const highestHistoricalCapacity = Math.max(
            0,
            ...pastClubSeasons.map(h => h.stadium || 0)
        );
        const highestHistoricalFans = Math.max(
            0,
            ...pastClubSeasons.map(h => (h as any).fanBase || 0)
        );
        const preservedStadium = Math.max(
            n.stadium || 0,
            matchedDbClub?.stadium || 0,
            a.stadium || 0,
            highestHistoricalCapacity,
            worldClubEntry?.stadium || 0
        );
        const jobEconProfile = getCountryEconomicProfile(a.country || 'GER');
        const jobCalibratedFans = getCalibratedStartingFanbase(a);
        const rawJobDbFans = a.fanBase || matchedDbClub?.fanBase || jobCalibratedFans;
        const normalizedJobDbFans = (jobEconProfile.tier === 4 && rawJobDbFans > jobCalibratedFans * 2.5)
            ? jobCalibratedFans
            : rawJobDbFans;
        const rawWorldFans = worldClubEntry?.fanBase || 0;
        const normalizedWorldFans = (jobEconProfile.tier === 4 && matchedDbClub?.fanBase && matchedDbClub.fanBase > jobCalibratedFans * 2.5 && rawWorldFans >= matchedDbClub.fanBase * 0.6)
            ? jobCalibratedFans + Math.max(0, rawWorldFans - matchedDbClub.fanBase)
            : rawWorldFans;
        const preservedFans = Math.max(
            normalizedJobDbFans,
            highestHistoricalFans,
            normalizedWorldFans
        );

        const userIsReserve = isReserveClub(a.name);
        const normJobCountry = normalizeCountry(a.country || 'GER');
        const mergedJobClubs = getActiveClubs(normJobCountry).map(rc => mergeClubWithWorldState(rc, i[String(rc.id)] || i[Number(rc.id)]));
        const possibleRivals = mergedJobClubs.filter(rc => rc.tier === a.tier && normalizeCountry(rc.country || 'GER') === normJobCountry && String(rc.id) !== String(targetId) && (userIsReserve || !isReserveClub(rc.name)));
        const rivalClubName = possibleRivals.length > 0 ? possibleRivals[Math.floor(Math.random() * possibleRivals.length)].name : "City Rivals";

        const resolvedContext = getClubHistoricContext(a.name, a.tier, false, a.country || 'GER', a);
        const highestHistoricalAcademy = Math.max(
            1,
            ...pastClubSeasons.map(h => (h as any).academyLevel || 1)
        );
        const highestHistoricalMedical = Math.max(
            1,
            ...pastClubSeasons.map(h => (h as any).medicalLevel || 1)
        );
        let preservedAcademy = Math.max(
            1,
            n.academyLevel || 1,
            matchedDbClub?.academyLevel || 1,
            a.academyLevel || 1,
            highestHistoricalAcademy,
            worldClubEntry?.academyLevel || 1
        );
        let preservedMedical = Math.max(
            1,
            n.medicalLevel || 1,
            matchedDbClub?.medicalLevel || 1,
            a.medicalLevel || 1,
            highestHistoricalMedical,
            worldClubEntry?.medicalLevel || 1
        );

        const seasonsProgressed = Math.max(
            (r.history || []).length,
            Math.max(0, (r.year || 2024) - (r.history?.[0]?.year || 2024))
        );
        const clubOvr = a.baseOvr || 50;
        const clubTier = a.tier || 5;
        const isPowerhouse = isEuropeanPowerhouseClub(a) || (clubTier === 1 && clubOvr >= 84);
        const isTopClub = isPowerhouse || (clubTier === 1 && clubOvr >= 78);

        if (!userIsReserve && seasonsProgressed >= 3 && isTopClub) {
            if (seasonsProgressed >= 5) {
                preservedAcademy = Math.max(2, preservedAcademy);
                preservedMedical = Math.max(2, preservedMedical);
                const seed = typeof targetId === 'number' ? targetId : String(a.name || '').length;
                if (isPowerhouse && preservedAcademy < 3 && preservedMedical < 3) {
                    if (seed % 3 === 0) {
                        preservedAcademy = 3;
                        preservedMedical = 3;
                    } else if (seed % 2 === 0) {
                        preservedAcademy = 3;
                    } else {
                        preservedMedical = 3;
                    }
                } else if (!isPowerhouse && clubOvr >= 81 && preservedAcademy === 2 && preservedMedical === 2 && seed % 2 === 0) {
                    preservedAcademy = 3;
                }
            } else {
                // 3-4 seasons into career: top clubs have at least Level 2 facilities
                preservedAcademy = Math.max(2, preservedAcademy);
                preservedMedical = Math.max(2, preservedMedical);
            }
        }

        const finalClub: Club = {
            ...a,
            fanBase: preservedFans,
            stadium: preservedStadium > 0 ? preservedStadium : (matchedDbClub?.stadium || a.stadium || getLeagueInfo(a.tier || 5, a.country || 'GER').stadBase || 2000),
            baseOvr: clubOvr,
            tier: clubTier,
            academyLevel: preservedAcademy,
            medicalLevel: preservedMedical,
            id: targetId,
            name: a.name,
            color: a.color,
            historicContext: resolvedContext,
            context: resolvedContext,
            temporaryOvrBoost: 0,
            activeLoansCount: 0
        };
        const expectations = getInitialBoardExpectations(finalClub, r.worldClubs || {});

        const notifications = [
            {
                id: Math.random().toString(),
                type: 'celebration',
                message: `🤝 Welcome to ${a.name}! The board expects: "${expectations.boardExpectation || 'Mid-table finish'}".`,
                read: false
            },
            ...(r.notifications || [])
        ];
        if (targetId !== undefined && !Number.isNaN(Number(targetId))) {
            i[String(targetId)] = finalClub;
            i[Number(targetId)] = finalClub;
        } else if (targetId !== undefined && typeof targetId === 'string' && targetId !== 'NaN' && targetId !== 'undefined') {
            i[targetId] = finalClub;
        }
        delete i['NaN'];
        delete i['undefined'];
        delete (i as any)[NaN];

        const penalty = r.activeLoan ? 25 : (r.budget < 0 ? 15 : 0);

        const resolvedJobEuroStatus: 'CL' | 'EL' | 'ECL' | null = (() => {
            if ((a.tier === 1 || (a.tier === 2 && (a as any).euroStatus === 'EL')) && (a as any).euroStatus) {
                return (a as any).euroStatus;
            }
            if (finalClub.tier !== 1 || userIsReserve) return null;

            const lastHist = (r.history || []).length > 0 ? r.history[r.history.length - 1] : null;
            const latestMoves = lastHist?.universeMovements || r.universeMovements || [];
            const wonDomTitle = latestMoves.some(
                (m: any) => m.type === 'champion' && m.fromTier === 1 && normalizeCountry(m.country || 'GER') === normJobCountry && m.clubName === finalClub.name
            );
            const wonCl = latestMoves.some(
                (m: any) => m.type === 'intl_cup' && (String(m.id || '').endsWith('-cup-cl') || String(m.cupTitle || '').toLowerCase().includes('champions league')) && m.clubName === finalClub.name
            );
            if (wonDomTitle || wonCl) return 'CL';

            const wonElOrDomCup = latestMoves.some(
                (m: any) =>
                    m.type === 'intl_cup' &&
                    m.clubName === finalClub.name &&
                    (String(m.id || '').endsWith('-cup-el') ||
                        String(m.id || '').endsWith('-cup-dfb') ||
                        String(m.cupTitle || '').toLowerCase().includes('european league'))
            );
            if (wonElOrDomCup) return 'EL';

            const tier1DomClubs = mergedJobClubs
                .filter(rc => rc.tier === 1 && normalizeCountry(rc.country || 'GER') === normJobCountry && !isReserveClub(rc.name))
                .sort((x, y) => (y.baseOvr || 0) - (x.baseOvr || 0) || (y.rep || 0) - (x.rep || 0) || String(x.id).localeCompare(String(y.id)));
            const rankIdx = tier1DomClubs.findIndex(
                rc => String(rc.id) === String(finalClub.id) || rc.name === finalClub.name
            );
            if (rankIdx === 0 || rankIdx === 1) return 'CL';
            if (rankIdx >= 2 && rankIdx <= 4) return 'EL';
            if (rankIdx === 5 && !['HUN', 'GER', 'ESP', 'POR'].includes(normJobCountry)) return 'ECL';
            return null;
        })();

        return {
            worldClubs: i,
            club: finalClub,
            budget: o,
            lastOvr: finalClub.baseOvr,
            startOfSeasonOvr: finalClub.baseOvr,
            signingOvrGainThisSeason: 0,
            signingFlopLossThisSeason: 0,
            eventOvrGainThisSeason: 0,
            facilitySpend: 0,
            transferSpend: 0,
            youthSpend: 0,
            contractRenewalSpend: 0,
            marketingSpend: 0,
            sponsorIncome: 0,
            failedSponsorTargetNextSeason: false,
            reputation: Math.max(1, (r.reputation || 50) - penalty),
            youthScoutsThisSeason: 0,
            schoolTrialistsThisSeason: 0,
            jobMarketSearchesThisSeason: (r.jobMarketSearchesThisSeason || 0) + 1,
            clubImpactScore: 50,
            immunityShields: 1,
            tenureYears: 0,
            isSacked: false,
            seasonsInDebt: 0,
            bankruptcyPending: false,
            activeLoan: null,
            rivalClubName,
            rivalH2HWins: 0,
            rivalH2HDraws: 0,
            rivalH2HLosses: 0,
            euroStatus: resolvedJobEuroStatus,
            activeEuroTournament: undefined,
            euroQualifiedForSf: null,
            youthPullsThisSeason: 0,
            youthPullsSeasonYear: r.year,
            youthSalesThisSeason: 0,
            youthSalesSeasonYear: r.year,
            youthDevQueue: 0,
            youthTitlesWon: 0,
            youthChampionshipSimulatedYear: undefined,
            investmentsThisSeason: 0,
            sponsorsPitchedThisSeason: 0,
            activePerformanceDeal: false,
            seasonSponsorDeals: {},
            seasonSponsorDealsYear: r.year,
            pendingSupercupTrophies: undefined,
            stadiumExpandedThisSeason: 0,
            infraActionsThisSeason: 0,
            facilitiesUpgradedThisSeason: 0,
            academyUpgradedThisSeason: 0,
            medicalUpgradedThisSeason: 0,
            regTransfersThisSeason: 0,
            youthPipeline: [],
            ovrHistory: [],
            keyTransfersThisSeason: 0,
            galacticosThisSeason: 0,
            squadSalesThisSeason: 0,
            loansThisSeason: 0,
            veteranRingerSignedThisSeason: false,
            veteranRingerOvrGain: 0,
            veteranRingerWageCost: 0,
            veteranRingerName: undefined,
            winterBreakSeenYear: -1,
            winterTransfersOpenedYear: -1,
            regionalToursThisSeason: 0,
            brandCampaignsThisSeason: 0,
            teamBondingThisSeason: 0,
            consecutiveTitles: 0,
            trophyDrought: 0,
            rebuildWageDiscountSeasons: 0,
            relegationWageReliefSeasons: 0,
            rebuildYouthAccelSeasons: 0,
            lastGenerationalRebuildYear: undefined,
            lastGenerationalTurnoverYear: undefined,
            lastPatronRescueYear: undefined,
            lastDirectorChangeYear: undefined,
            rebuildImmunity: false,
            activeCupTournament: undefined,
            cupQualifiedForSf: null,
            cupRunResults: (r.postSeasonPending ? (r.cupRunResults || []) : []),
            midSeasonCrisisTriggered: false,
            resolvedMatchContext: undefined,
            playoffVictoryOverride: undefined,
            pendingSeasonState: null,
            notifications,
            boardRoadmap: generateBoardRoadmap(finalClub, r.year || 2024, r.history || []),
            ...expectations
        };
    });
    },
    buyPlayer: (n, r, i, a) => set((o) => {
        const maxSpendingPower = o.budget + getCreditLimit(o.club.tier, o.club.country);
        if (maxSpendingPower < n) return o;
        const currentSquad = o.club.squadSize || 18;
        if (currentSquad + i > 22) return o;
        if (currentSquad + i < 13) return o;
        const winterBonusReg = o.winterTransfersOpenedYear === o.year ? 3 : 0;
        const winterBonusKey = o.winterTransfersOpenedYear === o.year ? 1 : 0;
        const limitReg = ((o.managerSkills || []).includes('scouting_network') ? 5 : 3) + winterBonusReg;
        const limitKey = ((o.managerSkills || []).includes('star_magnet') ? 3 : 2) + winterBonusKey;
        if (a === 'reg' && (o.regTransfersThisSeason || 0) >= limitReg) return o;
        if (a === 'key' && (o.keyTransfersThisSeason || 0) >= limitKey) return o;
        if (a === 'superstar' && (o.galacticosThisSeason || 0) >= 1) return o;
        if (a === 'loan' && (o.loansThisSeason || 0) >= 2) return o;
        if (n > 0 && o.budget - n < -getCreditLimit(o.club.tier, o.club.country)) return o;
        const preservedLastOvr = typeof o.lastOvr === 'number' ? o.lastOvr : (o.club.baseOvr || 60);
        let c = Math.min(100, Math.max(30, (o.club.baseOvr || 60) + r));
        const actualChange = c - (o.club.baseOvr || 60);
        let ovrHistory = o.ovrHistory || [];
        if (actualChange !== 0) {
            let reason = 'Transfer';
            let reasonDe = 'Transfer';
            if (a === 'reg') { reason = 'Signed Player'; reasonDe = 'Spieler verpflichtet'; }
            if (a === 'key') { reason = 'Signed Key Player'; reasonDe = 'Schlüsselspieler verpflichtet'; }
            if (a === 'superstar') { reason = 'Signed Superstar'; reasonDe = 'Superstar verpflichtet'; }
            if (a === 'loan') { reason = 'Loaned Player'; reasonDe = 'Spieler ausgeliehen'; }
            if (a === 'sell') { reason = 'Sold Player'; reasonDe = 'Spieler verkauft'; }
            const newLog = { id: Math.random().toString(36).substring(7), season: o.year, change: actualChange, reason, reasonDe };
            ovrHistory = [newLog, ...ovrHistory].slice(0, 30);
        }
        let updatedFanBase = o.club.fanBase || 0;
        let updatedGlobalFans = o.club.globalFans || 0;
        if (a === 'superstar') {
            const catchment = getClubCatchmentCeiling(o.club, o);
            const effectiveCeiling = Math.max(catchment.maxCeiling, updatedFanBase + 5000);
            updatedFanBase = Math.min(effectiveCeiling, updatedFanBase + 5000);
            const actualFanGain = Math.max(0, updatedFanBase - (o.club.fanBase || 0));
            updatedGlobalFans = (o.club.globalFans || 0) + actualFanGain;
        }
        const updatedSquadSize = Math.max(13, Math.min(22, (o.club.squadSize || 18) + i));
        const updatedLoanBoost = a === 'loan' ? ((o.club.temporaryOvrBoost || 0) + actualChange) : (o.club.temporaryOvrBoost || 0);
        const updatedLoansCount = a === 'loan' ? ((o.club.activeLoansCount || 0) + 1) : (o.club.activeLoansCount || 0);
        const updatedClub = { 
            ...o.club, 
            baseOvr: c, 
            squadSize: updatedSquadSize, 
            fanBase: updatedFanBase,
            globalFans: updatedGlobalFans,
            temporaryOvrBoost: updatedLoanBoost,
            activeLoansCount: updatedLoansCount
        };
        const updatedWorldClubs = {
            ...(o.worldClubs || {}),
            [o.club.id]: {
                ...(o.worldClubs?.[o.club.id] || o.club),
                baseOvr: c,
                squadSize: updatedSquadSize,
                fanBase: updatedFanBase,
                globalFans: updatedGlobalFans,
                temporaryOvrBoost: updatedLoanBoost,
                activeLoansCount: updatedLoansCount
            }
        };
        const isSigning = i > 0 && a !== 'sell';
        const prevSigningGain = (o as any).signingOvrGainThisSeason || 0;
        const prevSigningFlop = (o as any).signingFlopLossThisSeason || 0;
        const nextSigningGain = isSigning && actualChange > 0 ? prevSigningGain + actualChange : prevSigningGain;
        const nextSigningFlop = isSigning && actualChange < 0 ? prevSigningFlop + Math.abs(actualChange) : prevSigningFlop;
        trackEvent(a === 'sell' ? 'player_sold' : 'player_signed', {
            transfer_type: a,
            fee: Math.abs(n),
            ovr_delta: actualChange,
            new_ovr: c,
            squad_size: updatedSquadSize,
            club_name: o.club.name,
            club_tier: o.club.tier,
            season_year: o.year
        });
        return {
            budget: o.budget - n,
            transferSpend: (o.transferSpend || 0) + n,
            lastOvr: preservedLastOvr,
            startOfSeasonOvr: typeof o.startOfSeasonOvr === 'number' ? o.startOfSeasonOvr : preservedLastOvr,
            signingOvrGainThisSeason: nextSigningGain,
            signingFlopLossThisSeason: nextSigningFlop,
            club: updatedClub,
            worldClubs: updatedWorldClubs,
            ovrHistory,
            regTransfersThisSeason: a === 'reg' ? (o.regTransfersThisSeason || 0) + 1 : o.regTransfersThisSeason,
            keyTransfersThisSeason: a === 'key' ? (o.keyTransfersThisSeason || 0) + 1 : o.keyTransfersThisSeason,
            galacticosThisSeason: a === 'superstar' ? (o.galacticosThisSeason || 0) + 1 : o.galacticosThisSeason,
            loansThisSeason: a === 'loan' ? (o.loansThisSeason || 0) + 1 : o.loansThisSeason,
            squadSalesThisSeason: a === 'sell' ? (o.squadSalesThisSeason || 0) + 1 : o.squadSalesThisSeason
        };
    }),
    signVeteranRinger: (customFee?: number, customGain?: number, customWage?: number, customName?: string) => {
        const state = get();
        const tier = state.club.tier || 1;
        if (tier < 3) {
            return { success: false, message: 'Veteran Ringers are exclusively available to Tiers 3, 4, 5, and 6.' };
        }
        if (state.veteranRingerSignedThisSeason) {
            return { success: false, message: 'You have already signed a Veteran Ringer for this campaign (1 per season limit).' };
        }
        const currentSquad = state.club.squadSize || 18;
        if (currentSquad >= 22) {
            return { success: false, message: 'Squad is at maximum capacity (22 players).' };
        }
        const country = state.club.country || 'GER';
        const cMult = getCountryMult(country);
        const baseFee = Math.round(getLeagueScaledVal(tier, 50000, country));
        const fee = customFee !== undefined ? customFee : baseFee;
        const creditLimit = getCreditLimit(tier, country);
        if (state.budget + creditLimit < fee) {
            return { success: false, message: `Insufficient funds to sign Veteran Ringer (Cost: ${formatMoney(fee)}).` };
        }

        const gain = customGain !== undefined ? customGain : (Math.floor(Math.random() * 3) + 3); // +3, +4, or +5
        const baseWage = Math.round(getLeagueScaledVal(tier, 150000, country));
        const wage = customWage !== undefined ? customWage : baseWage;

        const veteranPool: Record<string, string[]> = {
            GER: ['Holger Glandorf (38)', 'Pascal Hens (38)', 'Stefan Lövgren (38)', 'Lars Christiansen (38)', 'Uwe Gensheimer (38)', 'Carsten Lichtlein (39)'],
            ESP: ['Julen Aguinagalde (38)', 'Raúl Entrerríos (39)', 'Víctor Tomás (37)', 'Alberto Entrerríos (38)', 'Daniel Sarmiento (38)'],
            FRA: ['Jérôme Fernandez (38)', 'Daniel Narcisse (38)', 'Thierry Omeyer (39)', 'Michaël Guigou (39)', 'Luc Abalo (37)'],
            DEN: ['Lars Christiansen (38)', 'Bo Spellerberg (39)', 'Kasper Hvidt (38)', 'Hans Lindberg (39)', 'Lasse Svan (38)'],
            SWE: ['Staffan Olsson (38)', 'Magnus Wislander (39)', 'Ljubomir Vranjes (37)', 'Jonas Källman (38)', 'Kim Andersson (38)'],
            CRO: ['Ivano Balić (37)', 'Petar Metličić (38)', 'Igor Vori (38)', 'Mirko Alilović (38)', 'Blaženko Lacković (38)'],
            POR: ['Carlos Resende (38)', 'Tiago Rocha (37)', 'Hugo Figueira (38)', 'Gilberto Duarte (36)'],
            POL: ['Karol Bielecki (38)', 'Grzegorz Tkaczyk (38)', 'Sławomir Szmal (39)', 'Krzysztof Lijewski (37)'],
            HUN: ['László Nagy (38)', 'Nándor Fazekas (39)', 'Ferenc Ilyés (38)', 'Gergő Iváncsik (37)'],
            AUT: ['Viktor Szilágyi (38)', 'Konrad Wilczynski (38)', 'Roland Schlinger (37)'],
            SUI: ['Andy Schmid (38)', 'Manuel Liniger (38)', 'Pascal Jenny (37)']
        };
        const countryPool = veteranPool[country] || veteranPool['GER'];
        const ringerName = customName || countryPool[Math.floor(Math.random() * countryPool.length)];

        const newOvr = Math.min(state.maxOvrCap || 100, (state.club.baseOvr || 60) + gain);
        const newSquadSize = currentSquad + 1;

        const ovrHistory = [
            {
                id: Math.random().toString(36).substring(7),
                season: state.year,
                change: gain,
                reason: `Veteran Ringer: ${ringerName}`,
                reasonDe: `Altstar-Verpflichtung: ${ringerName}`
            },
            ...(state.ovrHistory || [])
        ].slice(0, 30);

        const updatedClub = {
            ...state.club,
            baseOvr: newOvr,
            squadSize: newSquadSize
        };

        const updatedWorldClubs = {
            ...(state.worldClubs || {}),
            [state.club.id]: {
                ...(state.worldClubs?.[state.club.id] || state.club),
                baseOvr: newOvr,
                squadSize: newSquadSize
            }
        };

        const actualRingerChange = newOvr - (state.club.baseOvr || 60);
        set({
            budget: state.budget - fee,
            transferSpend: (state.transferSpend || 0) + fee,
            lastOvr: typeof state.lastOvr === 'number' ? state.lastOvr : (state.club.baseOvr || 60),
            startOfSeasonOvr: typeof state.startOfSeasonOvr === 'number' ? state.startOfSeasonOvr : (state.club.baseOvr || 60),
            signingOvrGainThisSeason: ((state as any).signingOvrGainThisSeason || 0) + Math.max(0, actualRingerChange),
            veteranRingerSignedThisSeason: true,
            veteranRingerOvrGain: gain,
            veteranRingerWageCost: wage,
            veteranRingerName: ringerName,
            club: updatedClub,
            worldClubs: updatedWorldClubs,
            ovrHistory,
            notifications: [
                {
                    id: Math.random().toString(),
                    type: 'celebration',
                    title: 'VETERAN RINGER SIGNED',
                    message: `Signed legendary star ${ringerName}! Immediate +${gain} OVR boost secured (+${gain} team rating). WARNING: Exorbitant wages committed. He retires after this season—earn promotion or risk financial crisis!`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        });

        return {
            success: true,
            name: ringerName,
            gain,
            fee,
            wage,
            message: `Signed ${ringerName} (+${gain} OVR).`
        };
    },
    conductRegionalTour: () => {
        const state = get();
        const cost = getRegionalTourCost(state.club.tier || 1, state.club.country || 'GER');
        if (state.budget < cost) {
            return { success: false, message: 'Insufficient funds for regional tour.' };
        }
        if ((state.regionalToursThisSeason || 0) >= 1) {
            return { success: false, message: 'Only 1 regional tour permitted per season.' };
        }
        const opponents = ['Local Select', 'Regional All-Stars', 'Academy Squad'];
        const matches = opponents.map(opp => {
            const paceRoll = Math.random();
            const baseGoals = paceRoll < 0.15 
                ? (20 + Math.floor(Math.random() * 4)) 
                : paceRoll < 0.80 
                ? (24 + Math.floor(Math.random() * 6)) 
                : (30 + Math.floor(Math.random() * 6));

            const spreadRoll = Math.random();
            let spread = 1;
            if (spreadRoll < 0.10) spread = 0;
            else if (spreadRoll < 0.45) spread = 1 + Math.floor(Math.random() * 2); // 1-2
            else if (spreadRoll < 0.85) spread = 3 + Math.floor(Math.random() * 4); // 3-6
            else spread = 7 + Math.floor(Math.random() * 6); // 7-12

            const playerWins = spread === 0 ? false : Math.random() < 0.68;
            let winnerScore = Math.round(baseGoals + spread / 2);
            let loserScore = winnerScore - spread;
            
            if (loserScore < 15) {
                winnerScore += (15 - loserScore);
                loserScore = 15;
            }
            if (winnerScore > 46) {
                loserScore = Math.max(15, loserScore - (winnerScore - 46));
                winnerScore = 46;
            }
            
            const playerGoals = spread === 0 ? baseGoals : (playerWins ? winnerScore : loserScore);
            const oppGoals = spread === 0 ? baseGoals : (playerWins ? loserScore : winnerScore);
            
            return { opp, playerGoals, oppGoals, won: playerGoals > oppGoals, draw: playerGoals === oppGoals };
        });
        const fansGained = Math.floor(Math.random() * 800) + 500;
        set(n => {
            const catchment = getClubCatchmentCeiling(n.club, n);
            const currentClubFans = n.club.fanBase || 1000;
            const updatedFans = Math.min(Math.max(catchment.maxCeiling, currentClubFans), currentClubFans + fansGained);
            const updatedClub = {
                ...n.club,
                fanBase: updatedFans
            };
            const updatedWorldClubs = {
                ...(n.worldClubs || {}),
                [n.club.id]: {
                    ...(n.worldClubs?.[n.club.id] || n.club),
                    fanBase: updatedFans
                }
            };
            trackEvent('regional_tour_completed', {
                cost,
                fans_gained: updatedFans - (n.club.fanBase || 1000),
                club_name: n.club.name,
                club_tier: n.club.tier,
                season_year: n.year
            });
            return {
                budget: n.budget - cost,
                marketingSpend: ((n as any).marketingSpend || 0) + cost,
                regionalToursThisSeason: (n.regionalToursThisSeason || 0) + 1,
                club: updatedClub,
                worldClubs: updatedWorldClubs
            };
        });
        return { success: true, matches, fansGained };
    },
    expandArena: (n, r, i, a = false) => set((o) => {
        if ((o.stadiumExpandedThisSeason || 0) >= 1) {
            return {
                notifications: [...(o.notifications || []), { id: Math.random().toString(36).substring(7), type: 'error', message: `Only 1 arena expansion or construction project is permitted per season.`, read: false }]
            };
        }
        if (((o.facilitiesUpgradedThisSeason || 0) + (o.infraActionsThisSeason || 0)) >= 2) {
            return {
                notifications: [...(o.notifications || []), { id: Math.random().toString(36).substring(7), type: 'error', message: `All construction cranes are in use this season (2/2 infrastructure limit reached).`, read: false }]
            };
        }
        const country = o.club.country || 'GER';
        const creditLimit = getCreditLimit(o.club.tier || 1, country);
        if (o.budget + creditLimit < n) {
            return {
                notifications: [...(o.notifications || []), { id: Math.random().toString(36).substring(7), type: 'error', message: `Insufficient funds and credit facility exhausted for arena project (${formatMoney(n)} required).`, read: false }]
            };
        }
        const maxCap = getPinnacleArenaCapacity(country);
        if ((o.club.stadium || 0) >= maxCap) {
            return {
                notifications: [...(o.notifications || []), { id: Math.random().toString(36).substring(7), type: 'error', message: `Maximum pinnacle capacity (${maxCap.toLocaleString()} seats in ${country}) already achieved. No further commissioning permitted.`, read: false }]
            };
        }
        const u = Math.min(maxCap, a ? i : (o.club.stadium || 0) + i);
        if (isReserveClub(o.club.name) && u > 1500) {
            return {
                notifications: [
                    ...(o.notifications || []),
                    {
                        id: Math.random().toString(36).substring(7),
                        type: 'error',
                        message: `Reserve clubs cannot expand arena capacity beyond 1,500 seats. Expansion blocked to avoid structural bankruptcy.`,
                        read: false
                    }
                ]
            };
        }
        const catchment = getClubCatchmentCeiling(o.club, o);
        const currentArenaFans = o.club.fanBase || 0;
        const newFanBase = Math.min(Math.max(catchment.maxCeiling, currentArenaFans), currentArenaFans + (r || 0));
        const updatedClub = { ...o.club, stadium: u, fanBase: newFanBase };
        const updatedWorldClubs = {
            ...(o.worldClubs || {}),
            [o.club.id]: {
                ...(o.worldClubs?.[o.club.id] || o.club),
                stadium: u,
                fanBase: newFanBase
            },
            [String(o.club.id)]: {
                ...(o.worldClubs?.[String(o.club.id)] || o.club),
                stadium: u,
                fanBase: newFanBase
            }
        };
        trackEvent('arena_expanded', {
            seats_added: i,
            new_capacity: u,
            cost: n,
            is_new_build: a,
            club_name: o.club.name,
            club_tier: o.club.tier,
            season_year: o.year
        });
        return {
            budget: o.budget - n,
            stadiumExpandedThisSeason: (o.stadiumExpandedThisSeason || 0) + 1,
            infraActionsThisSeason: (o.infraActionsThisSeason || 0) + 1,
            notifications: [...(o.notifications||[]), { id: Math.random().toString(36).substring(7), type: 'success', message: `Arena expansion completed (+${i.toLocaleString()} seats). -€${(n/1000000).toFixed(1)}M deducted from Treasury.`, read: false }],
            facilitySpend: (o.facilitySpend || 0) + n,
            club: updatedClub,
            worldClubs: updatedWorldClubs
        };
    }),
    expandStadium: (n, r, fanGain = 0) => get().expandArena(n, fanGain, r, false),
    structureArenaFinancing: (downPayment, principal, termYears, seats, opt, annualPayment, monthlyPayment, totalRepayment) => set((o) => {
        if ((o.stadiumExpandedThisSeason || 0) >= 1) {
            return {
                notifications: [...(o.notifications || []), { id: Math.random().toString(36).substring(7), type: 'error', message: `Only 1 arena expansion or construction project is permitted per season.`, read: false }]
            };
        }
        if (((o.facilitiesUpgradedThisSeason || 0) + (o.infraActionsThisSeason || 0)) >= 2) {
            return {
                notifications: [...(o.notifications || []), { id: Math.random().toString(36).substring(7), type: 'error', message: `All construction cranes are in use this season (2/2 infrastructure limit reached).`, read: false }]
            };
        }
        const country = o.club.country || 'GER';
        const creditLimit = getCreditLimit(o.club.tier || 1, country);
        if (o.budget + creditLimit < downPayment) {
            return {
                notifications: [...(o.notifications || []), { id: Math.random().toString(36).substring(7), type: 'error', message: `Insufficient funds and credit facility exhausted for structured arena down payment (${formatMoney(downPayment)} required).`, read: false }]
            };
        }
        const maxCap = getPinnacleArenaCapacity(country);
        const cappedSeats = Math.min(maxCap, seats);
        if (isReserveClub(o.club.name) && cappedSeats > 1500) {
            return {
                notifications: [
                    ...(o.notifications || []),
                    {
                        id: Math.random().toString(36).substring(7),
                        type: 'error',
                        message: `Reserve clubs cannot expand arena capacity beyond 1,500 seats. Financing blocked to avoid structural bankruptcy.`,
                        read: false
                    }
                ]
            };
        }
        const catchment = getClubCatchmentCeiling(o.club, o);
        const currentArenaFans = o.club.fanBase || 0;
        const fanBoost = opt?.fanBoost || 0;
        const newFanBase = Math.min(Math.max(catchment.maxCeiling, currentArenaFans), currentArenaFans + fanBoost);
        const updatedClub = { ...o.club, stadium: cappedSeats, fanBase: newFanBase };
        const updatedWorldClubs = {
            ...(o.worldClubs || {}),
            [o.club.id]: {
                ...(o.worldClubs?.[o.club.id] || o.club),
                stadium: cappedSeats,
                fanBase: newFanBase
            },
            [String(o.club.id)]: {
                ...(o.worldClubs?.[String(o.club.id)] || o.club),
                stadium: cappedSeats,
                fanBase: newFanBase
            }
        };

        const existingRemaining = o.activeLoan && o.activeLoan.yearsRemaining > 0 
            ? o.activeLoan.remainingBalance 
            : 0;
        const combinedTotalRepayment = existingRemaining + totalRepayment;
        const combinedAnnualPayment = Math.round(combinedTotalRepayment / termYears);
        const combinedMonthlyPayment = Math.round(combinedAnnualPayment / 12);

        const newLoan: any = {
            id: `arena_syndicate_${Date.now()}_${termYears}y`,
            principal: principal + existingRemaining,
            remainingBalance: combinedTotalRepayment,
            termYears,
            yearsRemaining: termYears,
            interestRate: 0.045,
            annualPayment: combinedAnnualPayment,
            totalRepayment: combinedTotalRepayment,
            takenInYear: o.year,
            loanType: 'arena_syndicate',
            monthlyPayment: combinedMonthlyPayment
        };

        const currentImpact = o.clubImpactScore ?? 50;
        const currentShields = o.immunityShields ?? 1;

        return {
            budget: o.budget - downPayment,
            activeLoan: newLoan,
            club: updatedClub,
            worldClubs: updatedWorldClubs,
            stadiumExpandedThisSeason: (o.stadiumExpandedThisSeason || 0) + 1,
            infraActionsThisSeason: (o.infraActionsThisSeason || 0) + 1,
            facilitySpend: (o.facilitySpend || 0) + downPayment,
            clubImpactScore: Math.min(100, currentImpact + 12),
            immunityShields: currentShields + 1,
            notifications: [
                {
                    id: Math.random().toString(36).substring(7),
                    type: 'celebration',
                    category: 'arena',
                    title: `🏟️ ${opt?.label || 'Grand Arena'} Structured Financing Approved!`,
                    message: `Deal Closed: ${seats.toLocaleString()} seats. -€${(downPayment/1000000).toFixed(1)}M down payment. Credit: €${(principal/1000000).toFixed(1)}M financed over ${termYears} years (${formatMoney(combinedMonthlyPayment)}/mo, ${formatMoney(combinedAnnualPayment)}/season).`,
                    subtitle: `Deal Closed: ${seats.toLocaleString()} seats. -€${(downPayment/1000000).toFixed(1)}M down payment. Credit: €${(principal/1000000).toFixed(1)}M financed over ${termYears} years (${formatMoney(combinedMonthlyPayment)}/mo, ${formatMoney(combinedAnnualPayment)}/season).`,
                    read: false
                },
                ...(o.notifications || [])
            ]
        };
    }),
    setFanStrategy: (strategy: 'ultras' | 'community' | 'corporate' | 'balanced') => set((o) => {
        const updatedClub = { ...o.club, fanStrategy: strategy };
        const updatedWorldClubs = {
            ...(o.worldClubs || {}),
            [o.club.id]: {
                ...(o.worldClubs?.[o.club.id] || o.club),
                fanStrategy: strategy
            }
        };
        const strategyNames: Record<string, string> = {
            ultras: 'Acoustic Hexenkessel (Fan Clubs & Standing Terraces: +2 Home OVR)',
            community: 'Grassroots & Family Movement (+25% Fan Growth & Youth Pull)',
            corporate: 'VIP & Corporate Hospitality (+30% Matchday Revenue)',
            balanced: 'Balanced Sporting Standard'
        };
        return {
            fanStrategy: strategy,
            club: updatedClub,
            worldClubs: updatedWorldClubs,
            notifications: [...(o.notifications||[]), {
                id: Math.random().toString(36).substring(7),
                type: 'info',
                message: `Club Fan Strategy updated: ${strategyNames[strategy] || strategy}`,
                read: false
            }]
        };
    }),
    teamBonding: (n) => set((r) => {
        if ((r.teamBondingThisSeason || 0) >= 1) return r;
        const creditLimit = getCreditLimit(r.club.tier || 1, r.club.country || 'GER');
        if (r.budget + creditLimit < n) return r;
        let i = (r.club.morale !== undefined ? r.club.morale : 50) + 30;
        if (i > 100) i = 100;
        const updatedClub = { ...r.club, morale: i };
        const updatedWorldClubs = {
            ...(r.worldClubs || {}),
            [r.club.id]: {
                ...(r.worldClubs?.[r.club.id] || r.club),
                morale: i
            }
        };
        return { budget: r.budget - n, club: updatedClub, worldClubs: updatedWorldClubs, teamBondingThisSeason: (r.teamBondingThisSeason || 0) + 1 };
    }),
    recruitYouth: (cost: number, customProspect?: any) => {
        const state = get();
        const level = state.club.academyLevel || 1;
        const tier = state.club.tier || 1;
        const country = state.club.country || "GER";
        const r = [...(state.youthPipeline || [])];
        const maxSlots = getAcademySlotLimit(level);
        const activeProspects = r.filter(p => !p.isLoanedOut).length;
        const isTrialist = Boolean(customProspect?.isTrialist);
        
        const maxScoutsThisSeason = level;
        if (!isTrialist && (state.youthScoutsThisSeason || 0) >= maxScoutsThisSeason) {
            return {
                success: false,
                message: `Scouting network capacity reached (Max ${maxScoutsThisSeason} per season).`
            };
        }

        if (activeProspects >= maxSlots) {
            return {
                success: false,
                message: `Youth Academy is at maximum capacity (${activeProspects}/${maxSlots} slots). Upgrade facility or graduate/release players.`
            };
        }

        const creditLimit = getCreditLimit(tier, country);
        const maxSpendingPower = state.budget + creditLimit;
        if (cost > 0 && maxSpendingPower < cost) {
            return {
                success: false,
                message: `Insufficient funds and credit facility exhausted to recruit youth talent (Cost: ${formatMoney(cost)}, Available: ${formatMoney(maxSpendingPower)}).`
            };
        }

        if (isTrialist && (state.schoolTrialistsThisSeason || 0) >= 1) {
            return {
                success: false,
                message: 'Only 1 free school trialist permitted per season.'
            };
        }

        const options = {
            headCoachArchetype: state.headCoachArchetype || state.tactic,
            directorArchetype: state.directorArchetype,
            managerSkills: state.managerSkills,
            clubVision: state.clubVision
        };
        const prospectRaw = customProspect ? { ...customProspect } : generateYouthProspect(level, country, tier, options);
        const prospect = { ...prospectRaw, enrolledYear: state.year };

        r.push(prospect);
        set({
            budget: state.budget - cost,
            youthPipeline: r,
            youthSpend: (state.youthSpend || 0) + cost,
            youthScoutsThisSeason: isTrialist ? (state.youthScoutsThisSeason || 0) : (state.youthScoutsThisSeason || 0) + 1,
            schoolTrialistsThisSeason: isTrialist ? (state.schoolTrialistsThisSeason || 0) + 1 : (state.schoolTrialistsThisSeason || 0)
        });

        return {
            success: true,
            message: `Successfully enrolled ${prospect.name} into the youth academy (${activeProspects + 1}/${maxSlots} slots).`,
            prospect
        };
    },
    protectYouth: (id, cost) => set((n) => {
        const creditLimit = getCreditLimit(n.club.tier || 1, n.club.country || 'GER');
        if (n.budget + creditLimit < cost) return n;
        const target = (n.youthPipeline || []).find(p => p.id === id);
        if (!target || target.isProtected) return n;
        const level = n.club.academyLevel || 1;
        const defenseChance = Math.min(99, 45 + 10 * level);
        return {
            budget: n.budget - cost,
            youthSpend: (n.youthSpend || 0) + cost,
            youthPipeline: (n.youthPipeline || []).map(p => p.id === id ? { 
                ...p, 
                isProtected: true,
                protectionDefenseChance: defenseChance 
            } : p)
        };
    }),
    pitchSponsor: (type) => set((n) => {
        const currentCommercial = (n.sponsorsPitchedThisSeason || 0);
        const limitCommercial = 3;
        if (currentCommercial >= limitCommercial) {
            return {
                notifications: [...(n.notifications || []), {
                    id: Math.random().toString(36).substring(7),
                    type: 'error',
                    message: `Commercial pitch quota reached (${limitCommercial} sponsor pitches per season).`,
                    read: false
                }]
            };
        }

        const prevDeals = (n.seasonSponsorDeals && n.seasonSponsorDealsYear === n.year) ? n.seasonSponsorDeals : {};
        if (prevDeals[type]?.status === 'signed' || prevDeals[type]?.status === 'failed' || (type === 2 && n.activePerformanceDeal)) {
            return {
                notifications: [...(n.notifications || []), {
                    id: Math.random().toString(36).substring(7),
                    type: 'error',
                    message: prevDeals[type]?.status === 'failed'
                        ? `Negotiations for this sponsorship tier already collapsed this season.`
                        : `This sponsorship package has already been finalized for the current season.`,
                    read: false
                }]
            };
        }

        const hasSalesmaster = (n.managerSkills || []).includes('sponsor_boost') || (n.managerSkills || []).includes('salesmaster');
        const hasPlaymakerPhilosophy = n.tactic === 'Playmaker Focus' || n.tactic === 'Total Handball';
        const terms = getDynamicSponsorPitchTerms(n);

        const prob = type === 0 ? 1.0 : type === 1 ? terms.megaSuccessProb : 1.0;
        const success = Math.random() < prob;
        let income = 0;

        if (type === 0) income = terms.standardPayout;
        else if (type === 1 && success) income = terms.megaPayout;
        else if (type === 2 && success) income = terms.performanceUpfront;

        const partnerBrand = type === 0
            ? terms.standardBrand
            : type === 1
            ? terms.megaBrand
            : terms.perfBrand;

        const prevSlot = prevDeals[type];
        const nextSlot = success
            ? {
                status: 'signed' as const,
                brandName: partnerBrand.name,
                brandLogo: partnerBrand.logo,
                payout: income,
                ...(type === 2 ? { bonus: terms.performanceBonus } : {})
            }
            : (prevSlot?.status === 'signed'
                ? prevSlot
                : { status: 'failed' as const, brandName: 'Empty', brandLogo: '' });

        const lockedDeals: Record<number, { status: 'signed' | 'failed' | 'available'; brandName: string; brandLogo: string; payout?: number; bonus?: number }> = {
            0: prevDeals[0] || { status: 'available', brandName: terms.standardBrand.name, brandLogo: terms.standardBrand.logo, payout: terms.standardPayout },
            1: prevDeals[1] || { status: 'available', brandName: terms.megaBrand.name, brandLogo: terms.megaBrand.logo, payout: terms.megaPayout },
            2: prevDeals[2] || { status: 'available', brandName: terms.perfBrand.name, brandLogo: terms.perfBrand.logo, payout: terms.performanceUpfront, bonus: terms.performanceBonus },
            ...prevDeals,
            [type]: nextSlot
        };

        const message = success 
            ? `${partnerBrand.logo} ${partnerBrand.name} (${type === 0 ? "Standard Partner" : type === 1 ? "Anchor Megadeal" : "Performance Contract"}) signed! ${hasSalesmaster ? '(+10% Commercial Negotiator) ' : ''}${hasPlaymakerPhilosophy ? '(+15% Playmaker Focus) ' : ''}+${formatMoney(income)} added to budget.` 
            : `${partnerBrand.logo} ${partnerBrand.name} ${type === 1 ? "Megadeal" : "Performance"} negotiations broke down (${terms.megaSuccessPct}% odds). The board is not pleased.`;
            
        trackEvent('sponsor_pitched', {
            pitch_type: type === 0 ? 'standard' : type === 1 ? 'megadeal' : 'performance',
            sponsor_brand: partnerBrand.name,
            success,
            income,
            club_name: n.club.name,
            club_tier: n.club.tier,
            season_year: n.year
        });

        return {
            notifications: [...(n.notifications||[]), { id: Math.random().toString(36).substring(7), type: success ? 'success' : 'error', message, read: false }],
            sponsorsPitchedThisSeason: (n.sponsorsPitchedThisSeason || 0) + 1,
            budget: n.budget + income,
            sponsorIncome: (n.sponsorIncome || 0) + income,
            activePerformanceDeal: type === 2 && success ? true : n.activePerformanceDeal,
            seasonSponsorDeals: lockedDeals,
            seasonSponsorDealsYear: n.year
        };
    }),
    launchIPO: (offeringPrice: number) => set((state) => {
        if (state.club.isPublic) return state;

        // Calculate the authentic "Fair Market Value" of the club's stock (assuming 1M shares issued)
        // Hardened valuation formula nerfed by 40% to curb early IPO snowballing
        const cashValuation = Math.max(0, state.budget);
        const trueValuation = (cashValuation + (state.club.fanBase || 0) * 60 + ((state.club.baseOvr || 60) * 150000)) * getCountryMult(state.club.country || 'GER');
        const fairStockPrice = Math.max(1.00, Math.round((trueValuation / 1000000) * 100) / 100);
        const maxSafePrice = Math.round(fairStockPrice * 1.15 * 100) / 100;

        let raisedCapital = 0;
        let resultingStockPrice = 0;
        let toastTitle = '';
        let toastMessage = '';
        let toastType: 'success' | 'error' = 'success';

        // The Gamble: Did the user get greedy?
        if (offeringPrice <= maxSafePrice + 0.001) {
            // Fully subscribed. The market accepts the valuation.
            raisedCapital = Math.floor(offeringPrice * 1000000);
            resultingStockPrice = offeringPrice; // Surges slightly or stabilizes
            toastTitle = '📈 SUCCESSFUL IPO';
            toastMessage = `Initial Public Offering fully subscribed! Club raised ${formatMoney(raisedCapital)} at €${offeringPrice.toFixed(2)}/share.`;
            toastType = 'success';
        } else {
            // Market backlash! The offering was overvalued.
            // Underwriters penalize the greedy offering with a much harsher drop (plummets to 40% floor).
            const discountPenalty = Math.max(0.40, 1 - (offeringPrice - fairStockPrice) / fairStockPrice);
            resultingStockPrice = Math.max(0.40, Math.round(fairStockPrice * discountPenalty * 100) / 100);
            raisedCapital = Math.floor(resultingStockPrice * 1000000 * 0.70); // only 70% subscribed at discount
            toastTitle = '📉 IPO VALUATION FLOP';
            toastMessage = `The market rejected your inflated IPO valuation (€${offeringPrice.toFixed(2)}/share)! Institutional underwriters dumped shares, stock plummeted to €${resultingStockPrice.toFixed(2)}/share, raising only ${formatMoney(raisedCapital)}.`;
            toastType = 'error';
        }

        const newNotifications = [
            ...(state.notifications || []),
            {
                id: Math.random().toString(),
                type: toastType,
                title: toastTitle,
                message: toastMessage,
                read: false
            }
        ];

        return {
            budget: state.budget + raisedCapital,
            club: {
                ...state.club,
                isPublic: true,
                ipoPrice: offeringPrice,
                stockPrice: resultingStockPrice,
                currentBudget: state.budget + raisedCapital
            },
            worldClubs: {
                ...(state.worldClubs || {}),
                [state.club.id]: {
                    ...(state.worldClubs?.[state.club.id] || state.club),
                    isPublic: true,
                    ipoPrice: offeringPrice,
                    stockPrice: resultingStockPrice,
                    currentBudget: state.budget + raisedCapital
                }
            },
            notifications: newNotifications
        };
    }),
    launchBrandCampaign: (campaignType: 1 | 2 | 3 = 1) => {
        const state = get();
        if ((state.brandCampaignsThisSeason || 0) >= 1) {
            return { success: false, message: 'You can only launch one marketing & PR campaign per season.' };
        }

        // Campaign specs:
        // Option 1: Regional Fan Promo | Cost: €250,000 | DP: 0
        // Odds: 60% Success (+15k Fans), 30% Break Even (+5k Fans), 10% Flop (-2k Fans).
        // Option 2: Continental Summer Tour | Cost: €1,000,000 | DP: 1
        // Odds: 20% Smash Hit (+80k Fans, +5 Morale), 50% Success (+40k Fans), 30% Logistical Nightmare (-10k Fans, -5 Morale).
        // Option 3: Global "Viral" PR Campaign | Cost: €3,000,000 | DP: 3
        // Odds: 10% Viral Jackpot (+350k Fans, +2 Rep, +10 Morale), 40% Solid ROI (+100k Fans), 30% Lukewarm (+25k Fans), 20% PR Disaster (-40k Fans, -10 Trust, -5 Morale).

        const cost = campaignType === 1 ? 250000 : campaignType === 2 ? 1000000 : 3000000;
        const dpCost = campaignType === 1 ? 0 : campaignType === 2 ? 1 : 3;

        if (state.budget < cost) {
            return { success: false, message: `Insufficient treasury funds (requires ${formatMoney(cost)}).` };
        }
        if ((state.skillPoints || 0) < dpCost) {
            return { success: false, message: `Insufficient Director/Skill Points (requires ${dpCost} DP).` };
        }

        const roll = Math.random();
        let outcomeKey: string = '';
        let label: string = '';
        let fanGain = 0;
        let moraleDelta = 0;
        let repDelta = 0;
        let trustDelta = 0;
        let segmentIndex = 0; // index on wheel
        let toastType: 'success' | 'celebration' | 'warning' | 'error' = 'success';
        let title = '';
        let message = '';

        if (campaignType === 1) {
            // Option 1: Regional Fan Promo (€250k)
            // 60% Success (+15k Fans) -> segment 0
            // 30% Break Even (+5k Fans) -> segment 1
            // 10% Flop (-2k Fans) -> segment 2
            if (roll < 0.60) {
                outcomeKey = 'success';
                label = 'Regional Success';
                fanGain = 15000;
                segmentIndex = 0;
                toastType = 'success';
                title = '📣 REGIONAL PROMO SUCCESS';
                message = `Targeted regional grassroots campaign clicked! +15,000 Fans expanded your local supporter ceiling.`;
            } else if (roll < 0.90) {
                outcomeKey = 'breakeven';
                label = 'Break Even';
                fanGain = 5000;
                segmentIndex = 1;
                toastType = 'success';
                title = '🤝 STEADY PROMO RETURN';
                message = `Modest community engagement. +5,000 Fans added to your supporter base.`;
            } else {
                outcomeKey = 'flop';
                label = 'Promo Flop';
                fanGain = -2000;
                segmentIndex = 2;
                toastType = 'error';
                title = '📉 PROMO FLOP';
                message = `Flyers ignored and local fan club apathy. -2,000 disaffected supporters drifted away.`;
            }
        } else if (campaignType === 2) {
            // Option 2: Continental Summer Tour (€1M + 1 DP)
            // 20% Smash Hit (+80k Fans, +5 Morale) -> segment 0
            // 50% Success (+40k Fans) -> segment 1
            // 30% Logistical Nightmare (-10k Fans, -5 Morale) -> segment 2
            if (roll < 0.20) {
                outcomeKey = 'smash_hit';
                label = 'Smash Hit!';
                fanGain = 80000;
                moraleDelta = 5;
                segmentIndex = 0;
                toastType = 'celebration';
                title = '🔥 CONTINENTAL TOUR SMASH HIT';
                message = `Packed overseas exhibition arenas! +80,000 Fans added to your brand reach and +5 Squad Morale.`;
            } else if (roll < 0.70) {
                outcomeKey = 'success';
                label = 'Tour Success';
                fanGain = 40000;
                segmentIndex = 1;
                toastType = 'success';
                title = '✈️ SUCCESSFUL CONTINENTAL TOUR';
                message = `Smooth European tour fixtures with strong ticket sales. +40,000 Fans permanently expanded your supporter ceiling.`;
            } else {
                outcomeKey = 'nightmare';
                label = 'Logistical Nightmare';
                fanGain = -10000;
                moraleDelta = -5;
                segmentIndex = 2;
                toastType = 'error';
                title = '✈️💥 TOUR LOGISTICAL NIGHTMARE';
                message = `Cancelled flights, travel exhaustion, and hostile match scheduling. -10,000 Fans and -5 Squad Morale.`;
            }
        } else {
            // Option 3: Global "Viral" PR Campaign (€3M + 3 DP)
            // 10% Viral Jackpot (+350k Fans, +2 Rep, +10 Morale) -> segment 0
            // 40% Solid ROI (+100k Fans) -> segment 1
            // 30% Lukewarm (+25k Fans) -> segment 2
            // 20% PR Disaster (-40k Fans, -10 Trust, -5 Morale) -> segment 3
            if (roll < 0.10) {
                outcomeKey = 'viral_jackpot';
                label = 'Viral Jackpot!';
                fanGain = 350000;
                repDelta = 2;
                moraleDelta = 10;
                segmentIndex = 0;
                toastType = 'celebration';
                title = '🎰 GLOBAL VIRAL JACKPOT';
                message = `Internet sensation! The viral documentary trended #1 worldwide: +350,000 Fans, +2 Coach Reputation, and +10 Squad Morale!`;
            } else if (roll < 0.50) {
                outcomeKey = 'solid_roi';
                label = 'Solid ROI';
                fanGain = 100000;
                segmentIndex = 1;
                toastType = 'success';
                title = '📈 SOLID GLOBAL ROI';
                message = `Strong digital syndication partnership across major sporting networks. +100,000 Fans added to your addressable ceiling.`;
            } else if (roll < 0.80) {
                outcomeKey = 'lukewarm';
                label = 'Lukewarm Return';
                fanGain = 25000;
                segmentIndex = 2;
                toastType = 'warning';
                title = '😐 LUKEWARM PR REACH';
                message = `Moderate digital traffic but low conversion. +25,000 Fans secured for an expensive media spend.`;
            } else {
                outcomeKey = 'pr_disaster';
                label = 'PR Disaster';
                fanGain = -40000;
                trustDelta = -10;
                moraleDelta = -5;
                segmentIndex = 3;
                toastType = 'error';
                title = '🚨 PR DISASTER & BACKLASH';
                message = `Embarrassing commercial faux pas sparked public ridicule! -40,000 Fans, -10 Board Trust, and -5 Squad Morale.`;
            }
        }

        // Continental Summer Tour: generate 3 European exhibition match results
        let matches: { opp: string; playerGoals: number; oppGoals: number; won: boolean; draw: boolean }[] | undefined;
        if (campaignType === 2) {
            const normTourCountry = normalizeCountry(state.club.country || 'GER');
            const candidates = getActiveClubs()
                .map(c => mergeClubWithWorldState(c, state.worldClubs?.[String(c.id)] || state.worldClubs?.[Number(c.id)]))
                .filter(c => c.name !== state.club.name && normalizeCountry(c.country || 'GER') !== normTourCountry && !isReserveClub(c.name));
            const pool = [...candidates];
            const opponents: string[] = [];
            for (let i = 0; i < 3; i++) {
                if (pool.length > 0) {
                    const rndIdx = Math.floor(Math.random() * pool.length);
                    opponents.push(pool[rndIdx].name);
                    pool.splice(rndIdx, 1);
                } else {
                    opponents.push('European Selection XI');
                }
            }
            matches = opponents.map(opp => {
                // Centered authentic variance: 22 to 34 goals mostly, with occasional spikes
                const baseGoals = 22 + Math.floor(Math.random() * 11) + (Math.random() > 0.85 ? Math.floor(Math.random() * 5) : 0);
                
                // Spreads: 0 to 9 goals
                const spread = Math.floor(Math.random() * 10);
                const isWon = outcomeKey === 'smash_hit' ? true : outcomeKey === 'success' ? (Math.random() < 0.65) : false;
                const isDraw = !isWon && spread === 0;
                
                const playerGoals = isWon ? baseGoals + Math.max(1, spread) : isDraw ? baseGoals : baseGoals - Math.max(1, spread);
                const oppGoals = baseGoals;
                
                return {
                    opp,
                    playerGoals: Math.min(46, Math.max(15, playerGoals)),
                    oppGoals: Math.min(46, Math.max(15, oppGoals)),
                    won: playerGoals > oppGoals,
                    draw: playerGoals === oppGoals
                };
            });
        }

        const catchment = getClubCatchmentCeiling(state.club, state);
        const currentFanBase = state.club.fanBase || 1000;
        const effectiveCampaignCeiling = fanGain > 0
            ? Math.max(catchment.maxCeiling + fanGain, currentFanBase + fanGain)
            : catchment.maxCeiling;
        const newFanBase = Math.min(effectiveCampaignCeiling, Math.max(200, currentFanBase + fanGain));
        const actualFanDelta = newFanBase - currentFanBase;
        const currentGlobalFans = state.club.globalFans || 0;
        const newGlobalFans = Math.min(newFanBase, Math.max(0, currentGlobalFans + actualFanDelta));
        const currentMorale = state.club.morale !== undefined ? state.club.morale : 100;
        const newMorale = Math.max(0, Math.min(100, currentMorale + moraleDelta));
        const currentImpact = state.clubImpactScore !== undefined ? state.clubImpactScore : 50;
        const newImpact = Math.max(0, Math.min(100, currentImpact + trustDelta));
        const currentRep = state.reputation || 50;
        const newRep = Math.max(1, Math.min(100, currentRep + repDelta));

        trackEvent('marketing_campaign_launched', {
            campaign_type: campaignType,
            outcome_key: outcomeKey,
            cost,
            dp_cost: dpCost,
            fan_gain: actualFanDelta,
            new_fanbase: newFanBase,
            club_name: state.club.name,
            club_tier: state.club.tier,
            season_year: state.year
        });

        set({
            budget: state.budget - cost,
            marketingSpend: ((state as any).marketingSpend || 0) + cost,
            skillPoints: Math.max(0, (state.skillPoints || 0) - dpCost),
            brandCampaignsThisSeason: 1,
            clubImpactScore: newImpact,
            reputation: newRep,
            club: {
                ...state.club,
                globalFans: newGlobalFans,
                fanBase: newFanBase,
                morale: newMorale
            },
            worldClubs: {
                ...(state.worldClubs || {}),
                [state.club.id]: {
                    ...(state.worldClubs?.[state.club.id] || state.club),
                    globalFans: newGlobalFans,
                    fanBase: newFanBase,
                    morale: newMorale
                }
            },
            notifications: [
                { id: Math.random().toString(), type: toastType, category: 'commercial', title, message, read: false },
                ...(state.notifications || [])
            ]
        });

        return {
            success: true,
            outcomeKey,
            label,
            campaignType,
            segmentIndex,
            fanGain,
            moraleDelta,
            repDelta,
            trustDelta,
            cost,
            dpCost,
            title,
            message,
            matches
        };
    },
    applyRelegationPenalty: () => {
        const state = get();
        let clubImpact = Math.min(25, Math.max(0, (state.clubImpactScore || 50) - 40));
        let shields = state.immunityShields !== undefined ? state.immunityShields : 1;
        let isSacked = false;
        let toast = null;

        // Exclude the current season (last history item) and filter to the active club's previous 2 seasons
        const previousClubSeasons = (state.history || [])
            .slice(0, -1)
            .filter(h => !h.clubName || h.clubName === state.club.name)
            .slice(-2);
        const pastRelegationsCount = previousClubSeasons.filter(h => h.relegated || (h.nextTier && h.tier && h.nextTier > h.tier)).length;
        const isMultipleRelegationCrisis = pastRelegationsCount >= 1;
        
        const hasUntouchable = (state.managerSkills || []).includes('untouchable');
        if (isMultipleRelegationCrisis) {
            if (hasUntouchable) {
                toast = { id: Math.random().toString(), type: "warning", message: "Untouchable Status: Despite multiple relegations, your iconic standing prevents the Board from terminating your contract.", read: false };
                clubImpact = Math.max(15, clubImpact);
                shields = 0;
                isSacked = false;
            } else {
                toast = { id: Math.random().toString(), type: "error", message: "You have been sacked! Suffering two relegations in three seasons is intolerable, regardless of earlier silverware.", read: false };
                clubImpact = 10;
                shields = 0;
                isSacked = true;
            }
        } else if (shields > 0) {
            shields -= 1;
            toast = { id: Math.random().toString(), type: "error", message: "Relegated! The board has stripped your Immunity Shield. Another relegation or collapse will result in immediate termination.", read: false };
        } else if (hasUntouchable) {
            toast = { id: Math.random().toString(), type: "warning", message: "Untouchable Status: Despite relegation, your iconic standing prevents the Board from terminating your contract.", read: false };
            clubImpact = Math.max(15, clubImpact);
            shields = 0;
            isSacked = false;
        } else {
            toast = { id: Math.random().toString(), type: "error", message: "You have been sacked! The board lost all confidence in your project following relegation.", read: false };
            clubImpact = 10;
            shields = 0;
            isSacked = true;
        }
        
        set({ clubImpactScore: clubImpact, immunityShields: shields, isSacked });
        return { isSacked, toast };
    },
    applyPlayoffTierChange: (newTier: number, swapOpponentName?: string) => set((state) => {
        const club = { ...state.club };
        const history = [...(state.history || [])];
        const lastHist = history.length > 0 ? history[history.length - 1] : null;
        const playedSeasonTier = lastHist ? lastHist.tier : club.tier;
        const prevSimulatedNextTier = club.tier;
        const oldTier = playedSeasonTier;
        club.tier = newTier;
        
        const newWorldClubs: Record<string, Club> = { ...(state.worldClubs || {}) };
        newWorldClubs[club.id] = { ...(newWorldClubs[club.id] || club), tier: newTier };
        
        let updatedMovements = [...(state.universeMovements || [])];
        const moveYear = lastHist ? lastHist.year : (state.year - 1);

        // If the playoff or survival battle changed the user's next-season tier compared to what simulateGlobalLeagues assumed,
        // swap the counterparty AI club's tier so division sizes remain 100% balanced.
        if (newTier !== prevSimulatedNextTier && swapOpponentName) {
            const normOpp = swapOpponentName.trim().toLowerCase();
            const userCountryNorm = normalizeCountry(club.country || 'GER');
            const oppEntry = Object.values(newWorldClubs).find(c =>
                c && String(c.id) !== String(club.id) &&
                c.name && c.name.trim().toLowerCase() === normOpp &&
                normalizeCountry(c.country || 'GER') === userCountryNorm
            ) || ALL_CLUBS.find(c =>
                String(c.id) !== String(club.id) &&
                c.name && c.name.trim().toLowerCase() === normOpp &&
                normalizeCountry(c.country || 'GER') === userCountryNorm
            );

            if (oppEntry) {
                const oppTargetTier = prevSimulatedNextTier;
                const oppCurrentTier = newWorldClubs[oppEntry.id]?.tier ?? oppEntry.tier;
                newWorldClubs[oppEntry.id] = {
                    ...(newWorldClubs[oppEntry.id] || oppEntry),
                    tier: oppTargetTier
                };
                updatedMovements = updatedMovements.filter(m => !(String(m.clubId) === String(oppEntry.id) && (m.year === moveYear || m.year === state.year) && (m.type === 'promotion' || m.type === 'relegation')));
                if (oppTargetTier < oppCurrentTier) {
                    updatedMovements.unshift({
                        id: `${oppEntry.id}-${moveYear}-playoff-promo`,
                        year: moveYear,
                        clubId: String(oppEntry.id),
                        clubName: oppEntry.name,
                        clubLogo: oppEntry.logo,
                        clubColor: oppEntry.color,
                        country: userCountryNorm,
                        type: 'promotion',
                        fromTier: oppCurrentTier,
                        toTier: oppTargetTier,
                        isKey: oppTargetTier === 1
                    });
                } else if (oppTargetTier > oppCurrentTier) {
                    updatedMovements.unshift({
                        id: `${oppEntry.id}-${moveYear}-playoff-releg`,
                        year: moveYear,
                        clubId: String(oppEntry.id),
                        clubName: oppEntry.name,
                        clubLogo: oppEntry.logo,
                        clubColor: oppEntry.color,
                        country: userCountryNorm,
                        type: 'relegation',
                        fromTier: oppCurrentTier,
                        toTier: oppTargetTier,
                        isKey: oppCurrentTier === 1
                    });
                }
            }
        }

        const expectations = getInitialBoardExpectations(club, newWorldClubs);
        let boardTargetPos = expectations.boardTargetPos;
        let boardExpectation = expectations.boardExpectation;
        if (newTier < oldTier) {
            const targetLeagueSize = getLeagueSize(newTier, club.country || 'GER', club.id);
            boardTargetPos = Math.max(1, targetLeagueSize - 3);
            boardExpectation = "Avoid Relegation";
            if (newTier === 1 && club.baseOvr >= 80 && state.boardExpectsSuccess) {
                boardTargetPos = 1;
                boardExpectation = "Win Championships & European Silverware";
            }
        }

        if (newTier < oldTier) {
            updatedMovements = updatedMovements.filter(m => !(m.clubId === String(club.id) && (m.year === moveYear || m.year === state.year) && (m.type === 'promotion' || m.type === 'relegation')));
            updatedMovements.unshift({
                id: `${club.id}-${moveYear}-playoff-promo`,
                year: moveYear,
                clubId: String(club.id),
                clubName: club.name,
                clubLogo: club.logo,
                clubColor: club.color,
                country: club.country || 'GER',
                type: 'promotion',
                fromTier: oldTier,
                toTier: newTier,
                isKey: true
            });
        } else if (newTier > oldTier) {
            updatedMovements = updatedMovements.filter(m => !(m.clubId === String(club.id) && (m.year === moveYear || m.year === state.year) && (m.type === 'promotion' || m.type === 'relegation')));
            updatedMovements.unshift({
                id: `${club.id}-${moveYear}-playoff-releg`,
                year: moveYear,
                clubId: String(club.id),
                clubName: club.name,
                clubLogo: club.logo,
                clubColor: club.color,
                country: club.country || 'GER',
                type: 'relegation',
                fromTier: oldTier,
                toTier: newTier,
                isKey: true
            });
        } else {
            updatedMovements = updatedMovements.filter(m => !(m.clubId === String(club.id) && (m.year === moveYear || m.year === state.year) && m.type === 'relegation'));
        }

        if (history.length > 0) {
            const updatedLastHist = { ...history[history.length - 1] };
            updatedLastHist.nextTier = newTier;
            updatedLastHist.universeMovements = updatedMovements;
            if (newTier > oldTier) {
                updatedLastHist.relegated = true;
                updatedLastHist.promoted = false;
                updatedLastHist.survived = false;
            } else if (newTier < oldTier) {
                updatedLastHist.relegated = false;
                updatedLastHist.promoted = true;
                updatedLastHist.survived = false;
            } else {
                updatedLastHist.relegated = false;
                updatedLastHist.promoted = false;
                updatedLastHist.survived = true;
            }
            const userUpdatedMarker = newTier < oldTier ? 'P' : (newTier > oldTier ? 'R' : undefined);
            if (Array.isArray(updatedLastHist.finalTable)) {
                updatedLastHist.finalTable = updatedLastHist.finalTable.map((row: any) => {
                    if (!row) return row;
                    if (row.isUser || (row.name && row.name.trim().toLowerCase() === club.name.trim().toLowerCase())) {
                        return { ...row, statusMarker: userUpdatedMarker };
                    }
                    if (swapOpponentName && row.name && row.name.trim().toLowerCase() === swapOpponentName.trim().toLowerCase()) {
                        const updatedMarker = (newTier < oldTier || (newTier === oldTier && prevSimulatedNextTier > oldTier))
                            ? 'R'
                            : (newTier > oldTier ? 'P' : row.statusMarker);
                        return { ...row, statusMarker: updatedMarker };
                    }
                    return row;
                });
            }
            if (updatedLastHist.divisionTables) {
                const normSwap = swapOpponentName ? swapOpponentName.trim().toLowerCase() : '';
                const newDivTables: Record<number, any[]> = { ...updatedLastHist.divisionTables };
                Object.keys(newDivTables).forEach(tKey => {
                    const tNum = Number(tKey);
                    if (Array.isArray(newDivTables[tNum])) {
                        newDivTables[tNum] = newDivTables[tNum].map(row => {
                            if (!row) return row;
                            if (tNum === oldTier && (row.isUser || (row.name && row.name.trim().toLowerCase() === club.name.trim().toLowerCase()))) {
                                return { ...row, statusMarker: userUpdatedMarker };
                            }
                            if (normSwap && row.name && row.name.trim().toLowerCase() === normSwap) {
                                const updatedMarker = (newTier < oldTier || (newTier === oldTier && prevSimulatedNextTier > oldTier && tNum === oldTier))
                                    ? 'R'
                                    : (newTier > oldTier ? 'P' : row.statusMarker);
                                return { ...row, statusMarker: updatedMarker };
                            }
                            return row;
                        });
                    }
                });
                updatedLastHist.divisionTables = newDivTables;
            }
            history[history.length - 1] = updatedLastHist;
        }

        const playoffVictoryOverride = {
            active: true,
            year: moveYear,
            oldTier,
            newTier,
            userWon: newTier <= oldTier
        };

        const validEuroStatus = (newTier === 1 || (newTier === 2 && state.euroStatus === 'EL' && lastHist?.trophiesThisYear?.dfb))
            ? state.euroStatus
            : null;
        
        return { 
            club, 
            worldClubs: newWorldClubs, 
            boardTargetPos, 
            boardExpectation,
            boardExpectsSuccess: expectations.boardExpectsSuccess,
            euroStatus: validEuroStatus,
            universeMovements: updatedMovements, 
            history,
            playoffVictoryOverride,
            relegationWageReliefSeasons: newTier > oldTier ? 1 : 0
        };
    }),
    simulateSeason: () => {
        const state = get();
        const club = { ...state.club };
        
        let newSquadSize = club.squadSize || 18;
        let ee = club.baseOvr;
        let fe: string[] = [];
        let graduatedYouths: string[] = [];
        let pipeline = [...(state.youthPipeline || [])];
        
        let localOvrHistory = [...(state.ovrHistory || [])];
        let extraNotifications: any[] = [];
        const pushOvrLog = (change: number, reason: string, reasonDe: string) => {
            if (change !== 0 || reason.includes('Affiliates')) {
                localOvrHistory.unshift({ id: Math.random().toString(36).substring(7), season: state.year, change, reason, reasonDe });
            }
        };
        
        const playedTier = club.tier;
        const academyLevel = club.academyLevel || 1;
        const returningLoans: string[] = [];
        const hasAcademyImmunity = academyLevel >= 5;
        let poachedThisSeason = 0;
        let poachedSolidarityCompensation = 0;
        
        pipeline = pipeline.map(te => {
            if (te.isLoanedOut && (state.year + 1 >= (te.loanReturnSeason || 0))) {
                returningLoans.push(te.name);
                return { ...te, isLoanedOut: false, loanBonusEarned: true, timer: Math.max(0, (te.timer || 0) - 1) };
            }
            if (te.isLoanedOut) {
                return te; 
            }
            const isYouthCoach = state.headCoachArchetype === 'Youth Developer' || (state.managerSkills || []).includes('talentscout');
            const coachAccel = isYouthCoach ? 0.20 : 0;
            const rebuildBonus = (state.rebuildYouthAccelSeasons || 0) > 0 ? 0.30 : 0;
            const accelChance = Math.min(0.95, (academyLevel >= 5 ? 0.65 : academyLevel >= 4 ? 0.45 : academyLevel >= 3 ? 0.25 : 0) + coachAccel + rebuildBonus);
            const progress = (te.timer > 1 && Math.random() < accelChance) ? 2 : 1;
            return { ...te, timer: Math.max(0, te.timer - progress) };
        }).filter(te => {
            if (te.isLoanedOut) return true;
            if (hasAcademyImmunity) return true; // Level 5 academy permanent dynasty immunity
            if (poachedThisSeason >= 1) return true; // Hard cap: Max 1 prospect poached per season across entire cohort

            const isStarProspect = (te.boost || 1) >= 3;
            const hasTalentScout = (state.managerSkills || []).includes('talentscout');
            if (!te.isProtected) {
                let Ae = isStarProspect ? 0.35 + Math.random() * 0.15 : 0.10 + Math.random() * 0.10;
                if ((te.boost || 1) >= 5) Ae = 0.50;
                // Academy facility level provides retention defense (better coaching, facilities, contracts)
                const academyShield = (academyLevel - 1) * 0.08;
                Ae = Math.max(0.04, Ae - academyShield);
                // In lower leagues (playedTier > 1), predatory poaching by top-flight giants intensifies
                if (playedTier > 1) {
                    const tierVulnerability = (playedTier - 1) * 0.10;
                    const starMultiplier = isStarProspect ? 0.14 : 0.04;
                    Ae = Math.min(0.80, Ae + tierVulnerability + starMultiplier);
                }
                if (hasTalentScout) {
                    Ae *= 0.5;
                }
                if (Math.random() < Ae) {
                    poachedThisSeason += 1;
                    const comp = Math.round(getLeagueScaledVal(playedTier, 50000 + (te.boost || 1) * 25000, club.country || 'GER'));
                    poachedSolidarityCompensation += comp;
                    fe.push(`${te.name} (+${formatMoney(comp)} solidarity comp)`);
                    return false;
                }
            } else {
                // Base legal shield protection provided by academy facilities
                const baseDefenseRate = (te.protectionDefenseChance || (45 + 10 * academyLevel)) / 100;
                let effectiveDefenseRate = baseDefenseRate;
                // Lower leagues (playedTier > 1) suffer aggressive raids from top tiers despite level 3, 4, 5 academy
                if (playedTier > 1) {
                    // Tier penalty: each tier below Tier 1 weakens legal defense hold by 9%
                    const tierPenalty = (playedTier - 1) * 0.09;
                    // Elite >2 OVR talents face aggressive statutory buyout / tapping-up pressure from Champions League giants
                    const starTargetPenalty = isStarProspect ? 0.12 : 0.04;
                    effectiveDefenseRate = Math.max(0.15, baseDefenseRate - tierPenalty - starTargetPenalty);
                }
                if (hasTalentScout) {
                    effectiveDefenseRate = 1 - (1 - effectiveDefenseRate) * 0.5;
                }
                if (Math.random() > effectiveDefenseRate) {
                    poachedThisSeason += 1;
                    const comp = Math.round(getLeagueScaledVal(playedTier, 75000 + (te.boost || 1) * 35000, club.country || 'GER'));
                    poachedSolidarityCompensation += comp;
                    fe.push(`${te.name} (+${formatMoney(comp)} buyout compensation)`);
                    return false;
                }
            }
            return true;
        });

        if (returningLoans.length > 0) {
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'success',
                title: 'LOAN RETURN',
                message: `🌟 Loan Returns: ${returningLoans.join(', ')} returned from 1-year affiliate loan with +1 OVR developmental bonus, ready for first team call-up!`,
                read: false
            });
        }

        const matureCount = pipeline.filter(p => p.timer <= 0 && !p.isLoanedOut).length;
        if (matureCount > 0) {
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'info',
                title: 'ACADEMY GRADUATION READY',
                message: `🎓 Academy Graduation: ${matureCount} prospect(s) have matured! Visit Youth Academy to decide their path (Senior Squad, Farm Loan, or Training Compensation).`,
                read: false
            });
        }
        
        let H: any = null;
        if (fe.length > 0) {
            H = { 
                id: Math.random().toString(), 
                type: "warning", 
                message: `Rival top-flight club signed youth talent: ${fe.join(', ')}. Training compensation credited to club treasury.`, 
                read: false 
            };
        }
        
        const hasRebuildImmunity = Boolean(state.rebuildImmunity || state.lastGenerationalRebuildYear === state.year);
        const currentMedLevel = state.club.medicalLevel || 1;
        // Medical Level 4 Milestone (Cryo & Biomechanics): Caps annual off-season retirements at max 1 player
        const maxRetirementsPerYear = currentMedLevel >= 4 ? 1 : 3;
        const pe = hasRebuildImmunity ? 0 : (Math.floor(Math.random() * maxRetirementsPerYear) + 1);
        if (pe > 0) {
            newSquadSize -= pe;
        }
        
        let retirementPenalty = hasRebuildImmunity ? 0 : Math.ceil(pe * 0.5);
        let naturalDecay = ee > 85 ? Math.floor(Math.random() * 2) + 1 : (ee > 60 ? Math.floor(Math.random() * 2) : 0);
        
        const medicalMitigationChance = (currentMedLevel - 1) * 0.12;
        if (Math.random() < medicalMitigationChance) {
            naturalDecay = 0;
            if (Math.random() < 0.5 || currentMedLevel >= 2) {
                retirementPenalty = Math.max(0, Math.floor(retirementPenalty / 2));
            }
        }
        
        let dramaticDecay = 0;
        const isBondingOff = (state.teamBondingThisSeason || 0) === 0;
        const isMedicalLow = (state.club.medicalLevel || 1) < 3;
        
        if (isBondingOff && isMedicalLow) {
            dramaticDecay = Math.floor(Math.random() * 3) + 2; 
        } else {
            retirementPenalty = Math.max(0, Math.floor(retirementPenalty / 2));
            if (naturalDecay > 1) naturalDecay = 1;
        }

        if (ee >= 96) {
            naturalDecay = Math.max(naturalDecay, ee >= 98 ? 2 : 1);
            if (ee >= 99 && Math.random() < 0.6) naturalDecay = 3;
            retirementPenalty = Math.max(1, retirementPenalty);
        }

        ee -= (retirementPenalty + naturalDecay + dramaticDecay);
        if (hasRebuildImmunity) {
            pushOvrLog(0, 'Rebuild Immunity (No Retirements)', 'Umbau-Immunität (Keine Rücktritte)');
        } else {
            pushOvrLog(-retirementPenalty, `Retirements (${pe} player${pe > 1 ? 's' : ''})`, `Retirements (${pe} player${pe > 1 ? 's' : ''})`);
        }
        pushOvrLog(-(naturalDecay + dramaticDecay), 'Squad Decay (Aging/Morale)', 'Squad Decay (Aging/Morale)');

        const youthMaturation = state.youthDevQueue || 0;
        if (youthMaturation > 0) {
            ee += youthMaturation;
            pushOvrLog(youthMaturation, `Youth Maturation (+${youthMaturation})`, `Jugend-Entwicklung (+${youthMaturation})`);
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'success',
                title: 'YOUTH PROSPECT MATURATION',
                message: `🌱 Development Cycle: Integrated youth prospects have matured into first-team regulars, adding +${youthMaturation} OVR to the squad!`,
                read: false
            });
        }

        const clubSpecificHistory = (state.history || []).filter(h => !h.clubName || h.clubName === club.name);
        const lastGenYear = state.lastGenerationalTurnoverYear ?? (clubSpecificHistory[0]?.year ? (clubSpecificHistory[0].year - 1) : (state.year - 1));
        const seasonsSinceGenTurnover = state.year - lastGenYear;
        const isGenerationalTurnover = seasonsSinceGenTurnover >= 6 && (seasonsSinceGenTurnover >= 7 || Math.random() < 0.5);
        let triggeredGenerationalYear = state.lastGenerationalTurnoverYear;

        if (isGenerationalTurnover && ee >= 78 && !hasRebuildImmunity) {
            triggeredGenerationalYear = state.year;
            const medLevel = state.club.medicalLevel || 1;
            // Medical Level 5 Milestone (Peak Performance Institute): Caps generational departures at 1 and halves OVR drop
            const extraRetirements = medLevel >= 5 ? 1 : (Math.floor(Math.random() * 2) + 2); 
            newSquadSize = Math.max(13, newSquadSize - extraRetirements);
            const baseGenDecay = ee >= 95 ? 7 : ee >= 90 ? 6 : 5;
            const generationalTurnoverDecay = medLevel >= 5
                ? Math.max(2, Math.floor(baseGenDecay / 2))
                : Math.max(4, baseGenDecay - (medLevel >= 4 ? 1 : 0));
            ee -= generationalTurnoverDecay;
            pushOvrLog(-generationalTurnoverDecay, `Generational Turnover (${extraRetirements} Key Vet${extraRetirements > 1 ? 's' : ''} Retired)`, `Generationswechsel (${extraRetirements} Leistungsträger Karriereende)`);
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'warning',
                title: 'GENERATIONAL SQUAD TURNOVER',
                message: medLevel >= 5
                    ? `⏳ Generational Transition Mitigated: Peak Performance Institute (Lvl 5) cushioned the golden-generation retirement wave (-${generationalTurnoverDecay} OVR instead of -${baseGenDecay} OVR)!`
                    : `⏳ Generational Squad Transition: An era comes to an end as golden-generation veterans retire (-${generationalTurnoverDecay} OVR). Squad rebuild required to forge the next dynasty!`,
                read: false
            });
        }

        let bloatDepartures = 0;
        if (newSquadSize > 22) {
            bloatDepartures = newSquadSize - 22;
            newSquadSize = 22;
        }
        let V = 0, q = 0;
        if (newSquadSize < 13) {
            V = 13 - newSquadSize;
            if (!isReserveClub(club.name)) {
                // Standard clubs are punished for failing to maintain a legal roster
                q = V * 1;
                ee -= q;
                pushOvrLog(-q, `Emergency Callups (${V})`, `Notfall-Amateure (${V})`);
            } else {
                // Reserve clubs organically cycle parent academy players without penalty
                pushOvrLog(0, `Academy Affiliates Rotated (${V})`, `Akademie-Aushilfen (${V})`);
            }
            newSquadSize = 13;
        }
        
        let loanExpirationPenalty = 0;
        const expiringLoans = state.loansThisSeason || club.activeLoansCount || 0;
        if (expiringLoans > 0) {
            loanExpirationPenalty = (club.temporaryOvrBoost && club.temporaryOvrBoost > 0)
                ? club.temporaryOvrBoost
                : Math.ceil(expiringLoans * 0.75);
            ee -= loanExpirationPenalty;
            pushOvrLog(-loanExpirationPenalty, `Loan Expirations (${expiringLoans})`, `Leih-Rückkehrer (${expiringLoans})`);
            newSquadSize -= expiringLoans;
            
            if (newSquadSize < 13) {
                const additionalEmergency = 13 - newSquadSize;
                V += additionalEmergency;
                if (!isReserveClub(club.name)) {
                    const additionalQ = additionalEmergency * 1;
                    q += additionalQ;
                    ee -= additionalQ;
                    pushOvrLog(-additionalQ, `Emergency Callups (${additionalEmergency})`, `Notfall-Amateure (${additionalEmergency})`);
                } else {
                    pushOvrLog(0, `Academy Affiliates Rotated (${additionalEmergency})`, `Akademie-Aushilfen (${additionalEmergency})`);
                }
                newSquadSize = 13;
            }
        }
        
        // High-Risk Veteran Ringer: Hard-coded 1-season retirement (Medical Lvl 4 preserves 50% of OVR gain!)
        if (state.veteranRingerSignedThisSeason) {
            const rawRingerGain = state.veteranRingerOvrGain || 4;
            const retainedRingerOvr = (state.club.medicalLevel || 1) >= 4 ? Math.floor(rawRingerGain / 2) : 0;
            const ringerDrop = Math.max(1, rawRingerGain - retainedRingerOvr);
            ee -= ringerDrop;
            if (retainedRingerOvr > 0) {
                pushOvrLog(-ringerDrop, `Veteran Ringer Retired (Cryo Lvl 4 Retained +${retainedRingerOvr} OVR)`, `Altstar Karriereende (Kryo Stufe 4 erhielt +${retainedRingerOvr} GES)`);
            } else {
                pushOvrLog(-ringerDrop, `Veteran Ringer Retired (${state.veteranRingerName || 'Veteran Star'})`, `Altstar Karriereende (${state.veteranRingerName || 'Altstar'})`);
            }
            newSquadSize -= 1;
            if (newSquadSize < 13) {
                const ringerEmergency = 13 - newSquadSize;
                V += ringerEmergency;
                if (!isReserveClub(club.name)) {
                    const ringerQ = ringerEmergency * 1;
                    q += ringerQ;
                    ee -= ringerQ;
                    pushOvrLog(-ringerQ, `Emergency Callups (${ringerEmergency})`, `Notfall-Amateure (${ringerEmergency})`);
                } else {
                    pushOvrLog(0, `Academy Affiliates Rotated (${ringerEmergency})`, `Akademie-Aushilfen (${ringerEmergency})`);
                }
                newSquadSize = 13;
            }
        }
        
        club.baseOvr = Math.min(state.maxOvrCap || 100, Math.max(30, ee));
        club.temporaryOvrBoost = 0;
        club.activeLoansCount = 0;
        
        const changeFromCap = club.baseOvr - ee;
        if (changeFromCap !== 0) {
            pushOvrLog(changeFromCap, 'OVR Cap / Floor Adjust', 'OVR Limit Korrektur');
        }
        club.squadSize = newSquadSize;
        
        const tier = club.tier;
        const activeClubsList = getActiveClubs();
        const mergedAllClubsSim = activeClubsList.map(c => state.worldClubs?.[c.id] ? { ...c, ...state.worldClubs[c.id] } : { ...c });
        const w = getLeagueSize(tier, club.country || 'GER', club.id, club.tier, club.country || 'GER', mergedAllClubsSim);
        const S = (w - 1) * 2;
        const normClubCountry = normalizeCountry(club.country || 'GER');
        const leagueClubs = mergedAllClubsSim.filter(te => te.tier === tier && normalizeCountry(te.country || 'GER') === normClubCountry);
        const leagueAvgOvr = leagueClubs.length > 0 
          ? leagueClubs.reduce((sum, c) => sum + c.baseOvr, 0) / leagueClubs.length
          : 60;
        
        const simulationClub = { ...club, baseOvr: state.club.baseOvr };
        
        let mBonus = 0;
        let rivalClubName = state.rivalClubName;
        let rivalClub = rivalClubName 
          ? mergedAllClubsSim.find(c => c.name.trim().toLowerCase() === rivalClubName.trim().toLowerCase() && normalizeCountry(c.country || 'GER') === normClubCountry)
          : null;
        
        const sameTierRivals = leagueClubs.filter(rc => rc.id !== club.id && rc.name !== club.name && !isReserveClub(rc.name));
        const activeNemesis = sameTierRivals.find(rc => (rc as any).isNemesisActive);

        if (activeNemesis && (!rivalClub || rivalClub.tier !== tier || !(rivalClub as any).isNemesisActive)) {
            // Prioritize investor-backed nemesis club in your division as rival
            rivalClub = activeNemesis;
            rivalClubName = activeNemesis.name;
        } else if (!rivalClub || rivalClub.tier !== tier) {
            if (sameTierRivals.length > 0) {
                rivalClub = sameTierRivals[Math.floor(Math.random() * sameTierRivals.length)];
                rivalClubName = rivalClub.name;
            } else {
                const anyTierRivals = mergedAllClubsSim.filter(rc => rc.id !== club.id && rc.name !== club.name && rc.tier === tier);
                if (anyTierRivals.length > 0) {
                    rivalClub = anyTierRivals[0];
                    rivalClubName = rivalClub.name;
                }
            }
        }

        const rivalChanged = Boolean(state.rivalClubName && rivalClubName && state.rivalClubName !== rivalClubName);
        const isSameTier = Boolean(rivalClub && rivalClub.tier === tier);

        let rivalWins = 0;
        let rivalDraws = 0;
        let rivalLosses = 0;
        let rivalToastMessage = '';

        if (rivalClub && isSameTier) {
            const rivalOvr = rivalClub.baseOvr || leagueAvgOvr;
            for (let i = 0; i < 2; i++) {
                const pWin = Math.min(0.85, Math.max(0.15, ((state.club.baseOvr - rivalOvr) * 0.025) + 0.45));
                const rand = Math.random();
                if (rand < pWin) rivalWins++;
                else if (rand < pWin + 0.22) rivalDraws++;
                else rivalLosses++;
            }
            
            if (rivalWins === 2) { mBonus += 10; rivalToastMessage = `Double over ${rivalClub.name}! (+10 Morale)`; }
            else if (rivalWins === 1 && rivalDraws === 1) { mBonus += 5; rivalToastMessage = `Undefeated vs ${rivalClub.name}. (+5 Morale)`; }
            else if (rivalLosses === 2) { mBonus -= 15; rivalToastMessage = `Swept by ${rivalClub.name}. (-15 Morale)`; }
            else if (rivalLosses === 1 && rivalDraws === 1) { mBonus -= 5; rivalToastMessage = `Winless vs ${rivalClub.name}. (-5 Morale)`; }
            else { rivalToastMessage = `Split results vs ${rivalClub.name}.`; }
        } else if (rivalClubName && !isSameTier) {
            rivalToastMessage = `League rivalry paused. Different tiers.`;
        }
        
        let currentTacticTenure = 1;
        const currentHist = (state.history || []).filter(h => !h.clubName || h.clubName === club.name);
        for (let i = currentHist.length - 1; i >= 0; i--) {
            if ((currentHist[i] as any).tactic === state.tactic) {
                currentTacticTenure++;
            } else {
                break;
            }
        }

        // Safely deep-clone the pending state to prevent Zustand Strict Mode mutation crashes
        const seasonStats = state.pendingSeasonState 
          ? JSON.parse(JSON.stringify(state.pendingSeasonState)) 
          : calculateProbabilisticSeason(
            simulationClub, 
            leagueAvgOvr, 
            tier, 
            state.tactic, 
            w, 
            (club.morale ?? 100) + mBonus,
            {
                isUserClub: true,
                consecutiveTitles: state.consecutiveTitles || 0,
                medicalLevel: club.medicalLevel || 1,
                academyLevel: club.academyLevel || 1,
                tacticTenure: currentTacticTenure,
                hasTacticalMastermind: (state.managerSkills || []).includes('tactical_mastermind'),
                previousSeasonRecord: currentHist.length > 0 ? {
                    wins: currentHist[currentHist.length - 1].wins,
                    draws: currentHist[currentHist.length - 1].draws,
                    losses: currentHist[currentHist.length - 1].losses,
                    gf: currentHist[currentHist.length - 1].gf,
                    ga: currentHist[currentHist.length - 1].ga
                } : undefined,
                recentHistoryRecords: currentHist.slice(-3).map(h => ({
                    wins: h.wins,
                    draws: h.draws,
                    losses: h.losses,
                    pts: h.pts,
                    gf: h.gf,
                    ga: h.ga
                })),
                clubsPool: mergedAllClubsSim
            }
        );
        
        let clubImpact = state.clubImpactScore !== undefined ? state.clubImpactScore : 50;
        
        let A: any[] = [];
        const isReserve = isReserveClub(club.name);
        const isPromoDenied = isReserve && club.tier === 2;

        const tierCeiling = getMaxTier(club.country || 'GER');
        const relegationThreshold = Math.max(1, w - 1);

        const financials = calculateClubFinancials({
            ...state,
            club: { ...state.club, tier: playedTier },
            budget: state.budget,
            euroStatus: state.euroStatus,
            sponsorIncome: state.sponsorIncome,
            managerSkills: state.managerSkills,
            keyTransfersThisSeason: state.keyTransfersThisSeason,
            galacticosThisSeason: state.galacticosThisSeason,
            veteranRingerSignedThisSeason: state.veteranRingerSignedThisSeason,
            veteranRingerWageCost: state.veteranRingerWageCost,
            failedSponsorTargetNextSeason: state.failedSponsorTargetNextSeason,
            year: state.year,
            activeLoan: state.activeLoan,
            history: state.history,
            rebuildWageDiscountSeasons: state.rebuildWageDiscountSeasons,
            tactic: state.tactic,
            headCoachArchetype: state.headCoachArchetype
        } as any);

        if (state.clubVision === 'Financial Prudence' && financials.net > 0) {
            const prudenceBonus = Math.round(financials.net * 0.15);
            financials.net += prudenceBonus;
            financials.estRevenue += prudenceBonus;
        }
        if (state.clubVision === 'Local Heritage') {
            const catchment = getClubCatchmentCeiling(club, state);
            const curHeritageFans = club.fanBase || 1000;
            club.fanBase = Math.min(Math.max(catchment.maxCeiling, curHeritageFans), curHeritageFans + 800);
        }
        
        if (!financials.expectedAtt) {
            financials.expectedAtt = formatOrganicAttendance(
                Math.floor(club.fanBase || 200),
                club.stadium || 2000,
                state.year
            );
        }
        
        let performancePayout = 0;
        let performanceDealResult: any = null;
        if (state.activePerformanceDeal) {
            const targetPos = Math.floor(w / 2);
            if (seasonStats.pos <= targetPos) {
                const lockedBonus = state.seasonSponsorDealsYear === state.year ? state.seasonSponsorDeals?.[2]?.bonus : undefined;
                const dynamicPerfTerms = getDynamicSponsorPitchTerms({
                    ...state,
                    club: { ...club, tier: playedTier }
                });
                performancePayout = lockedBonus ?? dynamicPerfTerms.performanceBonus;
                performanceDealResult = { success: true, payout: performancePayout, pos: seasonStats.pos };
            } else {
                performanceDealResult = { success: false, payout: 0, pos: seasonStats.pos, target: targetPos };
            }
        }
        
        const alreadyCreditedSponsorIncome = state.sponsorIncome || 0;
        let budget = state.budget + (financials.net - alreadyCreditedSponsorIncome) + performancePayout + poachedSolidarityCompensation;
        let leaguePrize = 0;
        if (seasonStats.pos === 1) {
            const tierPrizeMap: Record<number, number> = { 1: 350000, 2: 120000, 3: 45000, 4: 15000, 5: 5000 };
            const basePrize = tierPrizeMap[playedTier] || 5000;
            leaguePrize = getLeagueScaledVal(playedTier, basePrize, club.country || 'GER');
            budget += leaguePrize;
            
            extraNotifications.push({ 
                id: Math.random().toString(), 
                type: "celebration", 
                title: "LEAGUE CHAMPIONS!",
                message: `Prize Money Awarded: +${formatMoney(leaguePrize)}`, 
                read: false 
            });
        }
        const totalBonusIncome = performancePayout + poachedSolidarityCompensation + leaguePrize;
        if (totalBonusIncome > 0) {
            financials.estRevenue += totalBonusIncome;
            financials.net += totalBonusIncome;
        }

        if (financials.luxuryTax && financials.luxuryTax > 0) {
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'info',
                title: 'LUXURY & SOLIDARITY TAX',
                message: `🏛️ Competitive Balance Levy: -${formatMoney(financials.luxuryTax)} assessed under league parity regulations (Surplus Treasury: ${formatMoney((financials as any).treasuryLuxuryTax || 0)}, Excess Payroll: ${formatMoney((financials as any).payrollLuxuryTax || 0)}).`,
                read: false
            });
        }

        let updatedActiveLoan = state.activeLoan ? { ...state.activeLoan } : null;
        if (updatedActiveLoan && updatedActiveLoan.yearsRemaining > 0) {
            const installment = updatedActiveLoan.annualPayment;
            updatedActiveLoan.yearsRemaining -= 1;
            updatedActiveLoan.remainingBalance = Math.max(0, updatedActiveLoan.remainingBalance - installment);

            if (updatedActiveLoan.yearsRemaining <= 0 || updatedActiveLoan.remainingBalance <= 0) {
                updatedActiveLoan = null;
                extraNotifications.push({
                    id: Math.random().toString(),
                    type: 'celebration',
                    title: 'BANK LOAN RETIRED!',
                    message: `🏆 Your club has fully repaid its ${state.activeLoan?.termYears}-year institutional bank loan!`,
                    read: false
                });
            } else {
                extraNotifications.push({
                    id: Math.random().toString(),
                    type: 'info',
                    title: 'LOAN AMORTIZATION',
                    message: `Bank Loan Payment: -${formatMoney(installment)} deducted (${updatedActiveLoan.yearsRemaining} of ${updatedActiveLoan.termYears} years remaining).`,
                    read: false
                });
            }
        }

        let seasonsInDebt = state.seasonsInDebt || 0;
        let bankruptcyPending = state.bankruptcyPending || false;
        const isOperatingSurplus = financials.net >= 0;
        
        if (budget < 0) {
            if (isOperatingSurplus) {
                seasonsInDebt = Math.max(0, seasonsInDebt - 1);
                extraNotifications.push({
                    id: Math.random().toString(),
                    type: 'info',
                    title: 'HBL LICENSING COMPLIANT',
                    message: `Financial Turnaround: Operating surplus of +${formatMoney(financials.net)} applied to debt reduction. Club remains compliant under the HBL debt recovery agreement.`,
                    read: false
                });
            } else {
                seasonsInDebt = Math.min(3, seasonsInDebt + 1);
            }
        } else {
            seasonsInDebt = 0;

            const infrastructureCapThreshold = tier === 1 ? 12000000 : 5000000;
            const countryCap = isReserveClub(club.name) ? 1500 : getPinnacleArenaCapacity(club.country || 'GER');
            const currentAcademy = club.academyLevel || 1;
            const currentMedical = club.medicalLevel || 1;
            const currentStad = club.stadium || 2000;
            const allFacilitiesMaxed = currentAcademy >= 5 && currentMedical >= 5 && currentStad >= countryCap;

            if (budget > infrastructureCapThreshold && !allFacilitiesMaxed) {
                const surplus = budget - infrastructureCapThreshold;
                const reinvestmentAmount = Math.min(2500000, Math.round(surplus * 0.35));
                
                let upgradeType: 'arena' | 'academy' | 'medical' | 'vip' = 'arena';
                
                if (currentAcademy < 5 && (Math.random() < 0.4 || (currentStad >= countryCap && currentMedical >= 5))) {
                    upgradeType = 'academy';
                    club.academyLevel = currentAcademy + 1;
                } else if (currentMedical < 5 && (Math.random() < 0.3 || currentStad >= countryCap)) {
                    upgradeType = 'medical';
                    club.medicalLevel = currentMedical + 1;
                } else if (currentStad < countryCap) {
                    upgradeType = 'arena';
                    const addedSeats = Math.round(reinvestmentAmount / 2500);
                    const addedFans = Math.round(addedSeats * 2.2);
                    club.stadium = Math.min(countryCap, currentStad + addedSeats);
                    const catchment = getClubCatchmentCeiling(club, state);
                    const curReinvestFans = club.fanBase || 1000;
                    club.fanBase = Math.min(Math.max(catchment.maxCeiling, curReinvestFans), curReinvestFans + addedFans);
                } else if (currentAcademy < 5) {
                    upgradeType = 'academy';
                    club.academyLevel = currentAcademy + 1;
                } else {
                    upgradeType = 'vip';
                    const catchment = getClubCatchmentCeiling(club, state);
                    const curVipFans = club.fanBase || 1000;
                    club.fanBase = Math.min(Math.max(catchment.maxCeiling, curVipFans), curVipFans + 500);
                }

                budget -= reinvestmentAmount;

                const modernMessage = upgradeType === 'arena'
                    ? `🏛️ Mandatory Arena Modernization: In compliance with elite licensing regulations for cash-surplus clubs, the league mandated an infrastructure reinvestment (-${formatMoney(reinvestmentAmount)}) from surplus treasury into arena seating and hospitality!`
                    : upgradeType === 'academy'
                    ? `🏛️ Mandatory Academy Overhaul: In compliance with elite licensing regulations, the league mandated an infrastructure reinvestment (-${formatMoney(reinvestmentAmount)}) upgrading your Youth Academy to Level ${club.academyLevel}!`
                    : upgradeType === 'medical'
                    ? `🏛️ Mandatory Medical Center Overhaul: In compliance with elite licensing regulations, the league mandated an infrastructure reinvestment (-${formatMoney(reinvestmentAmount)}) upgrading your Sports Science & Medical Center to Level ${club.medicalLevel}!`
                    : `🏛️ Mandatory VIP & Hospitality Upgrade: In compliance with elite licensing regulations for maximum-capacity venues, the league mandated a facility upgrade (-${formatMoney(reinvestmentAmount)}) expanding VIP lounge and media suites!`;

                extraNotifications.push({
                    id: Math.random().toString(),
                    type: 'info',
                    title: 'MANDATORY INFRASTRUCTURE REINVESTMENT',
                    message: modernMessage,
                    read: false
                });
            }
        }

        let debtPenaltyText = "";
        let pointsDeducted = 0;
        if (budget < 0 && !isOperatingSurplus) {
            if (seasonsInDebt === 1) {
                pointsDeducted = 2;
                debtPenaltyText = " (2 Pts Deducted for Expanding Deficit)";
            } else if (seasonsInDebt === 2) {
                pointsDeducted = 4;
                debtPenaltyText = " (4 Pts Deducted for Expanding Deficit)";
            } else if (seasonsInDebt >= 3) {
                pointsDeducted = 6;
                debtPenaltyText = " (6 Pts Deducted for Expanding Deficit)";
                bankruptcyPending = true;
            }
        }
        
        seasonStats.pts = Math.max(0, seasonStats.pts - pointsDeducted);
        if (pointsDeducted > 0) {
            seasonStats.pointsDeducted = pointsDeducted;
            const prevPosBeforeDeduction = seasonStats.pos;
            const posPenalty = Math.max(1, Math.ceil(pointsDeducted / 2));
            seasonStats.pos = Math.min(w, seasonStats.pos + posPenalty);
            if (seasonStats.decisionDay?.type === 'title' && seasonStats.pos > 2) {
                seasonStats.decisionDay = null;
            }
            if (prevPosBeforeDeduction === 1 && seasonStats.pos > 1 && leaguePrize > 0) {
                budget -= leaguePrize;
                financials.estRevenue -= leaguePrize;
                financials.net -= leaguePrize;
                leaguePrize = 0;
                const champIdx = extraNotifications.findIndex(n => n.title === 'LEAGUE CHAMPIONS!');
                if (champIdx !== -1) extraNotifications.splice(champIdx, 1);
            }
            const perfTargetPos = Math.floor(w / 2);
            if (state.activePerformanceDeal && performancePayout > 0 && seasonStats.pos > perfTargetPos) {
                budget -= performancePayout;
                financials.estRevenue -= performancePayout;
                financials.net -= performancePayout;
                performancePayout = 0;
                performanceDealResult = { success: false, payout: 0, pos: seasonStats.pos, target: perfTargetPos };
            }
            A.push({ id: Math.random().toString(), type: 'error', message: `FINANCIAL CRISIS: ${pointsDeducted} Points deducted due to expanding operating deficit under debt!`, read: false });
        }

        if (seasonStats.pos === 1 && club.tier === 1) {
            trackEvent("title_win", { title: "league_champion", club_name: club.name });
        }

        if ((seasonStats.pos === 1 || seasonStats.pos === 2) && playedTier > 1) {
            if (isReserveClub(club.name) && playedTier === 2) {
                H = { id: Math.random().toString(), type: 'error', message: 'Promotion Denied! Reserve teams cannot enter Tier 1. Top players left for first-team handball (-5 OVR).', read: false };
                club.baseOvr = Math.max(30, club.baseOvr - 5);
                pushOvrLog(-5, 'Top players recalled (Reserve limit)', 'Stammspieler abgezogen (Zweitmannschaft)');
            } else {
                trackEvent('promotion', { club_name: club.name, new_tier: playedTier - 1 });
            }
        } else if (seasonStats.pos >= relegationThreshold && playedTier < tierCeiling) {
            trackEvent('relegation', { club_name: club.name, new_tier: playedTier + 1 });
            A.push({ id: Math.random().toString(), type: "error", message: `⬇️ Relegated to ${getLeagueInfo(playedTier + 1, club.country).name}`, read: false });
        }
        
        let oldTarget = state.boardTargetPos || 10;
        let oldExpectsSuccess = state.boardExpectsSuccess || false;
        
        let shields = state.immunityShields !== undefined ? state.immunityShields : 2;
        let tenure = (state.tenureYears || 0) + 1;
        let rep = state.reputation || 0;
        let managerSkills = state.managerSkills || [];
        
        // Cross-reference cupRunResults and resolvedMatchContext for authentic cup status
        const cupRunsThisYear = (state.cupRunResults || []).filter(r => r.year === state.year || !r.year || String(r.year) === String(state.year));
        const resolvedCupFinalsEarly = state.resolvedMatchContext?.cupFinals || {};
        
        const isDomesticCup = (r: any) => {
            const id = (r.id || '').toLowerCase();
            const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
            return id === 'nat_cup' || id === 'dfb' || id === 'cup' || id === 'domestic_cup' || (
                (title.includes('national') || title.includes('pokal') || title.includes('cup') || title.includes('copa') || title.includes('coupe') || title.includes('puchar') || title.includes('kupa') || title.includes('kup') || title.includes('coppa') || title.includes('cupa') || title.includes('cupen') || title.includes('taça') || title.includes('taca') || title.includes('bikar') || title.includes('nm')) &&
                !title.includes('amateur') && !title.includes('regional') && !title.includes('euro') && !title.includes('champions') && !title.includes('super globe') && !id.includes('reg') && !id.includes('euro') && !id.includes('cl')
            );
        };
        const isRegionalCup = (r: any) => {
            const id = (r.id || '').toLowerCase();
            const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
            return id === 'reg_cup' || id === 'regional_cup' || title.includes('regional') || title.includes('amateur');
        };
        const isClCup = (r: any) => {
            const id = (r.id || '').toLowerCase();
            const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
            return id === 'cl' || (title.includes('champions league') || (title.includes('champions') && !title.includes('super globe')));
        };
        const isElCup = (r: any) => {
            const id = (r.id || '').toLowerCase();
            const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
            return id === 'el' || title.includes('european league') || title.includes('euro league');
        };
        const isEclCup = (r: any) => {
            const id = (r.id || '').toLowerCase();
            const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
            return id === 'ecl' || title.includes('european cup') || title.includes('europapokal');
        };
        const isCwcCup = (r: any) => {
            const id = (r.id || '').toLowerCase();
            const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
            return id === 'cwc' || title.includes('super globe') || title.includes('club world');
        };
        const isEuroCup = (r: any) => {
            const id = (r.id || '').toLowerCase();
            const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
            return isClCup(r) || isElCup(r) || isEclCup(r) || id === 'euro_cup' || (title.includes('euro') && !title.includes('super globe'));
        };

        const confirmedNatEarly = resolvedCupFinalsEarly['nat_cup'];
        const natCupEliminated = Boolean(
            state.cupQualifiedForSf === false ||
            cupRunsThisYear.some(r => isDomesticCup(r) && r.won === false) ||
            (confirmedNatEarly && (confirmedNatEarly.year === state.year || !confirmedNatEarly.year) && !confirmedNatEarly.userWon)
        );
        const natCupWon = !natCupEliminated && Boolean(
            cupRunsThisYear.some(r => isDomesticCup(r) && r.won === true) ||
            (confirmedNatEarly && (confirmedNatEarly.year === state.year || !confirmedNatEarly.year) && confirmedNatEarly.userWon)
        );

        const confirmedRegEarly = resolvedCupFinalsEarly['reg_cup'];
        const regCupEliminated = Boolean(
            cupRunsThisYear.some(r => isRegionalCup(r) && r.won === false) ||
            (confirmedRegEarly && (confirmedRegEarly.year === state.year || !confirmedRegEarly.year) && !confirmedRegEarly.userWon)
        );
        const regCupWon = !regCupEliminated && Boolean(
            cupRunsThisYear.some(r => isRegionalCup(r) && r.won === true) ||
            (confirmedRegEarly && (confirmedRegEarly.year === state.year || !confirmedRegEarly.year) && confirmedRegEarly.userWon)
        );

        const confirmedClEarly = resolvedCupFinalsEarly['cl'];
        const clEliminated = Boolean(
            (state.euroQualifiedForSf === false && cupRunsThisYear.some(isClCup)) ||
            cupRunsThisYear.some(r => isClCup(r) && r.won === false) ||
            (confirmedClEarly && (confirmedClEarly.year === state.year || !confirmedClEarly.year) && !confirmedClEarly.userWon)
        );
        const clWon = !clEliminated && Boolean(
            cupRunsThisYear.some(r => isClCup(r) && r.won === true) ||
            (confirmedClEarly && (confirmedClEarly.year === state.year || !confirmedClEarly.year) && confirmedClEarly.userWon)
        );

        const confirmedElEarly = resolvedCupFinalsEarly['el'];
        const elEliminated = Boolean(
            (state.euroQualifiedForSf === false && cupRunsThisYear.some(isElCup)) ||
            cupRunsThisYear.some(r => isElCup(r) && r.won === false) ||
            (confirmedElEarly && (confirmedElEarly.year === state.year || !confirmedElEarly.year) && !confirmedElEarly.userWon)
        );
        const elWon = !elEliminated && Boolean(
            cupRunsThisYear.some(r => isElCup(r) && r.won === true) ||
            (confirmedElEarly && (confirmedElEarly.year === state.year || !confirmedElEarly.year) && confirmedElEarly.userWon)
        );

        const confirmedEclEarly = resolvedCupFinalsEarly['ecl'];
        const eclEliminated = Boolean(
            (state.euroQualifiedForSf === false && cupRunsThisYear.some(isEclCup)) ||
            cupRunsThisYear.some(r => isEclCup(r) && r.won === false) ||
            (confirmedEclEarly && (confirmedEclEarly.year === state.year || !confirmedEclEarly.year) && !confirmedEclEarly.userWon)
        );
        const eclWon = !eclEliminated && Boolean(
            cupRunsThisYear.some(r => isEclCup(r) && r.won === true) ||
            (confirmedEclEarly && (confirmedEclEarly.year === state.year || !confirmedEclEarly.year) && confirmedEclEarly.userWon)
        );

        const confirmedCwcEarly = resolvedCupFinalsEarly['cwc'] || resolvedCupFinalsEarly['super_globe'];
        const cwcEliminated = Boolean(
            cupRunsThisYear.some(r => isCwcCup(r) && r.won === false) ||
            (confirmedCwcEarly && (confirmedCwcEarly.year === state.year || !confirmedCwcEarly.year) && !confirmedCwcEarly.userWon)
        );
        const cwcWon = !cwcEliminated && Boolean(
            cupRunsThisYear.some(r => isCwcCup(r) && r.won === true) ||
            (confirmedCwcEarly && (confirmedCwcEarly.year === state.year || !confirmedCwcEarly.year) && confirmedCwcEarly.userWon)
        );

        const confirmedEuroEarly = resolvedCupFinalsEarly['euro_cup'];
        const euroCupEliminated = clEliminated || elEliminated || eclEliminated || Boolean(
            state.euroQualifiedForSf === false ||
            cupRunsThisYear.some(r => isEuroCup(r) && r.won === false) ||
            (confirmedEuroEarly && (confirmedEuroEarly.year === state.year || !confirmedEuroEarly.year) && !confirmedEuroEarly.userWon)
        );
        const euroCupWon = clWon || elWon || eclWon || (!euroCupEliminated && Boolean(
            cupRunsThisYear.some(r => isEuroCup(r) && r.won === true) ||
            (confirmedEuroEarly && (confirmedEuroEarly.year === state.year || !confirmedEuroEarly.year) && confirmedEuroEarly.userWon)
        ));

        let wonLeague = (seasonStats.pos === 1);
        let hasEuroTrophy = (!clEliminated && clWon) || (!elEliminated && elWon) || (!eclEliminated && eclWon) || (!cwcEliminated && cwcWon) || (!euroCupEliminated && euroCupWon) || A.some(toast => (toast.category === 'euro' || toast.category === 'cup') && (toast.message.includes('Champions League Winners') || toast.message.includes('European League Winners') || toast.message.includes('European Cup Winners') || toast.message.includes('Super Globe')));
        let hasDomesticCup = !natCupEliminated && (natCupWon || A.some(toast => toast.category === 'cup' && (toast.message.includes('Domestic Cup Winners') || toast.message.includes('National Cup Winners') || toast.message.includes('Pokalsieger'))));
        let wonMajorSilverware = wonLeague || hasEuroTrophy;
        let wonAnyTrophy = wonLeague || hasDomesticCup || hasEuroTrophy || (!regCupEliminated && regCupWon);
        let promoted = (seasonStats.pos === 1 || seasonStats.pos === 2) && tier > 1 && !isPromoDenied;
        let relegated = seasonStats.pos >= Math.max(1, w - 1) && tier < getMaxTier(club.country || 'GER');
        const isGiant = isEuropeanPowerhouseClub(club) || (playedTier === 1 && (club.baseOvr >= 83 || rep >= 85));
        
        let newMorale = club.morale ?? 100;

        const catchment = getClubCatchmentCeiling(club, {
            ...state,
            history: [...state.history, { pos: seasonStats.pos, trophiesThisYear: wonMajorSilverware ? { bl: 1 } : {} }]
        });
        const currentFanBase = club.fanBase || 1000;
        const headroom = Math.max(0, catchment.maxCeiling - currentFanBase);
        const headroomRatio = headroom / Math.max(1, catchment.maxCeiling);

        let growthMult = 1.0;
        if (seasonStats.pos === 1) growthMult += 0.15 * headroomRatio;
        else if (seasonStats.pos <= 3) growthMult += 0.08 * headroomRatio;
        else if (seasonStats.pos <= 6) growthMult += 0.03 * headroomRatio;
        if (hasDomesticCup || hasEuroTrophy || (!regCupEliminated && regCupWon)) {
            growthMult += 0.10 * headroomRatio;
        }
        if (state.tactic === 'Fast Break') {
            growthMult += 0.12 * headroomRatio;
        }
        if (relegated) growthMult *= 0.90;
        
        let newFanBase = Math.round(currentFanBase * growthMult);
        const effectiveSeasonCeiling = growthMult >= 1.0 ? Math.max(catchment.maxCeiling, currentFanBase) : catchment.maxCeiling;
        newFanBase = Math.min(effectiveSeasonCeiling, Math.max(100, newFanBase));
        club.fanBase = newFanBase;
        
        if (wonMajorSilverware || promoted) {
            clubImpact += 25;
            newMorale += 25;
            
            const prevHist = currentHist.length > 0 ? currentHist[currentHist.length - 1] : null;
            const isBackToBackTitle = Boolean(prevHist && prevHist.pos === 1 && seasonStats.pos === 1 && prevHist.tier >= playedTier);
            const isBackToBackPromo = Boolean(prevHist && (prevHist.pos === 1 || prevHist.pos === 2 || prevHist.promoted) && prevHist.tier > playedTier && promoted);

            if (isBackToBackTitle) {
                A.push({ id: Math.random().toString(), type: "celebration", category: "decision_day", title: "DECISION DAY · CHAMPIONS", message: `🏆 BACK TO BACK CHAMPIONS!`, subtitle: 'Back-to-back league titles! An extraordinary dynasty in the making.', read: false });
                clubImpact += 15;
            } else if (wonLeague) {
                const leagueName = getLeagueInfo(tier, club.country || 'GER').name;
                A.push({ 
                    id: Math.random().toString(), 
                    type: "celebration", 
                    category: "decision_day", 
                    title: "DECISION DAY · CHAMPIONS", 
                    message: `🏆 ${tier === 1 ? leagueName + ' Champions!' : !isPromoDenied ? leagueName + ' Winners! (Promoted)' : leagueName + ' Winners!'}`, 
                    subtitle: `Crowned champions of ${leagueName}! A triumph etched in club folklore.`, 
                    read: false 
                });
            } else if (isBackToBackPromo) {
                A.push({ id: Math.random().toString(), type: "celebration", category: "league", message: `🔥 BACK TO BACK PROMOTIONS!`, subtitle: 'Ascending the leagues with consecutive promotions!', read: false });
                clubImpact += 10;
            } else if (promoted) {
                const leagueName = getLeagueInfo(tier, club.country || 'GER').name;
                A.push({ id: Math.random().toString(), type: "celebration", category: "league", message: `🏆 Promotion Secured to Higher Division!`, subtitle: `Outstanding season finishes in promotion from ${leagueName}!`, read: false });
            }
        } else if (wonAnyTrophy) {
            if (isGiant && tenure >= 4) {
                clubImpact += 10;
                newMorale += 10;
                A.push({
                    id: Math.random().toString(),
                    type: "warning",
                    category: "board",
                    message: `🥈 CUP CONSOLATION (Tenure Year ${tenure})`,
                    subtitle: `Domestic cup won, but the Board expects League supremacy and European contention.`,
                    read: false
                });
            } else {
                clubImpact += 20;
                newMorale += 20;
            }
        }
        
        let _wasSacked = false;
        const recentHistory = currentHist.slice(-3);
        const pastRelegationsCount = recentHistory.filter(h => h.relegated || (h.nextTier && h.tier && h.nextTier > h.tier)).length;
        const isMultipleRelegationCrisis = pastRelegationsCount >= 1;
        const hasUntouchableSkill = managerSkills.includes('untouchable');
        const hasBoardDarlingSkill = managerSkills.includes('vorstandsliebling');
        let finishedInBottomTierRelegationZone = seasonStats.pos >= Math.max(1, w - 1) && tier === getMaxTier(club.country || 'GER');
        let bankruptInBottomTier = bankruptcyPending && tier === getMaxTier(club.country || 'GER');
        const canUntouchableSave = hasUntouchableSkill && !finishedInBottomTierRelegationZone && !bankruptInBottomTier;

        if (relegated) {
            clubImpact = Math.min(25, Math.max(0, clubImpact - 40));
            newMorale -= 40;
            if (isMultipleRelegationCrisis) {
                if (canUntouchableSave) {
                    H = { id: Math.random().toString(), type: 'warning', message: 'Untouchable Status: Despite multiple relegations, your iconic standing prevents the Board from terminating your contract.', read: false };
                    clubImpact = Math.max(15, clubImpact);
                    shields = 0;
                } else {
                    H = { id: Math.random().toString(), type: 'error', message: 'You have been sacked! Suffering two relegations in three seasons is intolerable, regardless of earlier silverware.', read: false };
                    clubImpact = 10;
                    shields = 0;
                    tenure = 0;
                    _wasSacked = true;
                }
            } else if (shields > 0) {
                shields -= 1;
                H = { id: Math.random().toString(), type: 'error', message: 'Relegated! The board has stripped your Immunity Shield. Another relegation or collapse will result in immediate termination.', read: false };
            } else if (canUntouchableSave) {
                H = { id: Math.random().toString(), type: 'warning', message: 'Untouchable Status: Despite relegation, your iconic standing prevents the Board from terminating your contract.', read: false };
                clubImpact = Math.max(15, clubImpact);
                shields = 0;
            } else {
                H = { id: Math.random().toString(), type: 'error', message: 'You have been sacked! The board lost all confidence in your project following relegation.', read: false };
                clubImpact = 10;
                shields = 0;
                tenure = 0;
                _wasSacked = true;
            }
        } else {
            if (seasonStats.pos <= oldTarget) {
                clubImpact += 10;
            } else {
                clubImpact -= (10 + ((seasonStats.pos - oldTarget) * 2));
            }
        }
        
        const tenureScrutiny = Math.min(14, Math.max(0, Math.floor((tenure - 3) * 0.9)));

        if (!wonAnyTrophy && !promoted && !relegated) {
            let decay = 5 + (Math.min(tenure, 20) * 1.1);
            newMorale -= Math.round(decay);
            
            const metBoardTarget = seasonStats.pos <= oldTarget;
            if (metBoardTarget) {
                decay = Math.min(decay, 5 + Math.min(tenure, 10) * 0.4);
            } else {
                if (rep > 80) decay *= 1.4;
                else if (rep < 40) decay *= 0.6;
            }
            
            if (managerSkills.includes('board_darling') || hasUntouchableSkill || hasBoardDarlingSkill) {
                decay *= 0.5;
            }
            clubImpact -= decay;

            if (isGiant && tenure >= 4) {
                A.push({
                    id: Math.random().toString(),
                    type: "warning",
                    category: "board",
                    message: `⚠️ DYNASTY SCRUTINY (Tenure Year ${tenure}): Season ended without silverware!`,
                    subtitle: `As an established European heavyweight, the Board expects title challenges every season. Job security has tightened.`,
                    read: false
                });
            }
        } else if (isGiant && tenure >= 5 && !wonMajorSilverware) {
            let dynastyDecay = Math.round(tenureScrutiny * 0.7);
            if (managerSkills.includes('board_darling') || hasUntouchableSkill || hasBoardDarlingSkill) {
                dynastyDecay = Math.round(dynastyDecay * 0.5);
            }
            clubImpact -= dynastyDecay;
        }
        
        if (hasBoardDarlingSkill && !_wasSacked) {
            clubImpact = Math.max(15, clubImpact);
        }
        
        if (!_wasSacked) {
            if (finishedInBottomTierRelegationZone || bankruptInBottomTier) {
                H = { 
                    id: Math.random().toString(), 
                    type: 'error', 
                    message: bankruptInBottomTier 
                        ? 'You have been sacked immediately! Bankrupting the club in the bottom tier is unforgivable.' 
                        : 'You have been sacked immediately! Finishing in the relegation drop zone of the bottom tier is unacceptable.', 
                    read: false 
                };
                clubImpact = 20;
                shields = 0;
                tenure = 0;
                _wasSacked = true;
                bankruptcyPending = false;
            } else if (clubImpact < 30) {
                newMorale -= 15;
                // vorstandsliebling ("Board Darling"): Board Satisfaction Floor is 15% and sacking warnings delayed by 1 season
                const sackingCrisisTriggered = hasBoardDarlingSkill ? (clubImpact <= 15 && tenure > 1) : (clubImpact < 20);
                if (sackingCrisisTriggered) {
                    if (shields > 0) {
                        shields -= 1;
                        H = { id: Math.random().toString(), type: 'error', message: 'Crisis! The board has stripped you of one Immunity Shield. Improve results immediately.', read: false };
                    } else if (canUntouchableSave) {
                        H = { id: Math.random().toString(), type: 'warning', message: 'Untouchable Status: Despite low board confidence, your iconic standing prevents the Board from terminating your contract.', read: false };
                        clubImpact = Math.max(20, clubImpact);
                    } else {
                        H = { id: Math.random().toString(), type: 'error', message: 'You have been sacked! The board lost all confidence in your project.', read: false };
                        clubImpact = 20;
                        shields = 2;
                        tenure = 0;
                        _wasSacked = true;
                    }
                }
            }
        }
        
        if (hasBoardDarlingSkill) {
            clubImpact = Math.max(15, clubImpact);
        }
        clubImpact = Math.round(Math.max(0, Math.min(100, clubImpact)));
        club.morale = Math.round(Math.max(0, Math.min(100, newMorale)));
        
        const nextTier = relegated ? Math.min(getMaxTier(club.country || 'GER'), playedTier + 1) : (promoted ? Math.max(1, playedTier - 1) : playedTier);
        club.tier = nextTier;

        const normSimCountry = normalizeCountry(club.country || 'GER');
        const nextLeagueSize = getLeagueSize(nextTier, normSimCountry, club.id, nextTier, normSimCountry, mergedAllClubsSim);
        const sameTierSimClubs = mergedAllClubsSim.filter(c => c.tier === club.tier && normalizeCountry(c.country || 'GER') === normSimCountry);
        const effectiveSimClubs = sameTierSimClubs.length >= 4 ? sameTierSimClubs : mergedAllClubsSim.filter(c => c.tier === club.tier);
        let nextLeagueAvg = effectiveSimClubs.length > 0
            ? effectiveSimClubs.reduce((sum, c) => sum + (c.baseOvr || 70), 0) / effectiveSimClubs.length
            : (club.tier === 1 ? 84 : club.tier === 2 ? 73 : club.tier === 3 ? 63 : 55);
        
        const defaultMid = Math.max(1, Math.round(nextLeagueSize * 0.65));
        const defaultUpperHalf = Math.max(1, Math.round(nextLeagueSize * 0.44));
        const defaultAvoidReleg = Math.max(1, nextLeagueSize - 3);
        const defaultTop4 = Math.min(4, Math.max(2, Math.round(nextLeagueSize * 0.25)));

        let boardTargetPos = defaultMid;
        let boardExpectation = "Mid-table finish";
        let boardExpectsSuccess = oldExpectsSuccess;
        if (club.tier === 1 && (isGiant || club.baseOvr >= 83 || (seasonStats.pos === 1 && currentHist.length > 0 && currentHist[currentHist.length - 1].pos === 1))) {
            boardExpectsSuccess = true;
        }
        
        if (club.tier === 1 && (club.baseOvr >= 85 || isGiant || (boardExpectsSuccess && club.baseOvr >= 80))) {
            boardTargetPos = 1;
            boardExpectation = "Win Championships & European Silverware";
        } else if (relegated && club.baseOvr >= nextLeagueAvg + 2) {
            // Relegated teams that retained a strong core must bounce back
            boardTargetPos = 2;
            boardExpectation = "Immediate Promotion Bounce-Back";
        } else if (club.tier > 1 && club.baseOvr >= nextLeagueAvg + 6) {
            boardTargetPos = 1;
            boardExpectation = "Win League Title & Direct Promotion";
        } else if (promoted) { 
            // Promoted teams fight for survival
            boardTargetPos = defaultAvoidReleg;
            boardExpectation = "Avoid Relegation";
        } else if (club.tier === 1 && (boardExpectsSuccess || club.baseOvr >= nextLeagueAvg + 4)) {
            boardTargetPos = defaultTop4;
            boardExpectation = "EHF Champions League / Title Push";
        } else if (club.tier > 1 && club.baseOvr >= nextLeagueAvg + 3) {
            boardTargetPos = 2;
            boardExpectation = "Promotion Battle / Top 2 Finish";
        } else if (club.baseOvr >= nextLeagueAvg + 4) {
            boardTargetPos = defaultUpperHalf;
            boardExpectation = "Upper Half Finish";
        } else if (club.baseOvr < nextLeagueAvg - 4) {
            boardTargetPos = defaultAvoidReleg;
            boardExpectation = "Avoid Relegation";
        } else {
            boardTargetPos = defaultMid;
            const projectedDrought = wonAnyTrophy ? 0 : (state.trophyDrought || 0) + 1;
            if (club.tier === 1 && projectedDrought > 4) {
                boardExpectation = `${projectedDrought}-Year Trophy Drought: The fanbase is losing patience.`;
            } else {
                boardExpectation = "Mid-Table";
            }
        }

        const dd = seasonStats.decisionDay;
        const ddRivalGd = dd
            ? (seasonStats.pos === 1 ? dd.trailerGd : dd.leaderGd)
            : Math.max(20, Math.round((seasonStats.gf - seasonStats.ga) * 0.85));

        const userFinalTable = generateLeagueTable(
            { ...state, club: simulationClub },
            mergedAllClubsSim,
            playedTier,
            {
                year: state.year,
                clubName: club.name,
                country: club.country || 'GER',
                tier: playedTier,
                wins: seasonStats.wins,
                draws: seasonStats.draws,
                losses: seasonStats.losses,
                pts: seasonStats.pts,
                pos: seasonStats.pos,
                gf: seasonStats.gf,
                ga: seasonStats.ga,
                pointsDeducted: pointsDeducted > 0 ? pointsDeducted : undefined,
                rivalName: dd?.rivalName || rivalClubName,
                rivalPts: dd ? dd.rivalPts : undefined,
                rivalGd: ddRivalGd,
                userPlayedTier: playedTier,
            }
        );

        const userCountryNorm = normalizeCountry(club.country || 'GER');
        const maxCountryTier = getMaxTier(userCountryNorm);
        const divisionTables: Record<number, any[]> = {
            [playedTier]: userFinalTable
        };
        for (let t = 1; t <= maxCountryTier; t++) {
            if (t !== playedTier) {
                divisionTables[t] = generateLeagueTable(
                    { ...state, club: simulationClub },
                    mergedAllClubsSim,
                    t,
                    { year: state.year, country: userCountryNorm, tier: t, userPlayedTier: playedTier, isCompletedSeason: true } as any
                );
            }
        }

        const trophiesThisYear: any = (() => {
            let t: any = (seasonStats.pos === 1) ? ((playedTier === 1 && !promoted && !isReserveClub(club.name)) ? { bl: 1 } : { lower: 1 }) : {};
            if (state.pendingSupercupTrophies?.sc) t.sc = state.pendingSupercupTrophies.sc;
            A.forEach(toast => {
                if (toast.category === 'cup' || toast.category === 'euro') {
                    if (toast.message.includes('Champions League') && !clEliminated) t.cl = 1;
                    else if ((toast.message.includes('Euro League') || toast.message.includes('European League')) && !elEliminated) t.el = 1;
                    else if (toast.message.includes('European Cup') && !eclEliminated) t.ecl = 1;
                    else if (toast.message.includes('Super Globe') && !cwcEliminated) t.cwc = 1;
                    else if ((toast.message.includes('Regional') || toast.message.includes('Amateurpokal')) && !regCupEliminated) t.reg = 1;
                    else if ((toast.message.includes('National Cup Winners') || toast.message.includes('Domestic Cup Winners') || toast.message.includes('Pokalsieger')) && !natCupEliminated) t.dfb = 1;
                }
            });
            if (natCupWon && !natCupEliminated) t.dfb = 1;
            if (regCupWon && !regCupEliminated) t.reg = 1;
            if (clWon && !clEliminated) t.cl = 1;
            if (elWon && !elEliminated) t.el = 1;
            if (eclWon && !eclEliminated) t.ecl = 1;
            if (cwcWon && !cwcEliminated) t.cwc = 1;
            if (euroCupWon) {
                const matchedEuroRun = cupRunsThisYear.find(isEuroCup);
                const title = (matchedEuroRun?.nameEn || '').toLowerCase();
                if (title.includes('champions') && !clEliminated) t.cl = 1;
                else if (title.includes('european cup') && !eclEliminated) t.ecl = 1;
                else if (!elEliminated) t.el = 1;
            }
            if (natCupEliminated) delete t.dfb;
            if (regCupEliminated) delete t.reg;
            if (clEliminated) delete t.cl;
            if (elEliminated) delete t.el;
            if (eclEliminated) delete t.ecl;
            if (cwcEliminated) delete t.cwc;
            return t;
        })();

        const earnedTrophyStrings: string[] = [];
        if (trophiesThisYear.cl) earnedTrophyStrings.push('EHF Champions League');
        if (trophiesThisYear.el) earnedTrophyStrings.push('EHF European League');
        if (trophiesThisYear.ecl) earnedTrophyStrings.push('EHF European Cup');
        if (trophiesThisYear.cwc) earnedTrophyStrings.push('IHF Super Globe');
        if (trophiesThisYear.bl) earnedTrophyStrings.push('League Champions');
        if (trophiesThisYear.lower) earnedTrophyStrings.push('Lower League Title');
        if (trophiesThisYear.dfb) earnedTrophyStrings.push('National Cup');
        if (trophiesThisYear.sc) earnedTrophyStrings.push('National Supercup');
        if (trophiesThisYear.reg) earnedTrophyStrings.push('Regional Cup');

        const numericClubId = typeof club.id === 'number' ? club.id : Number(club.id);
        const histItem: SeasonHistory = {
            year: state.year,
            clubName: club.name,
            clubId: !isNaN(numericClubId) ? numericClubId : undefined,
            color: club.color,
            color2: club.color2,
            logo: club.logo || (!isNaN(numericClubId) ? getLocalAssetPath(numericClubId) : undefined),
            country: club.country || 'GER',
            ovr: club.baseOvr,
            tier: playedTier,
            nextTier: nextTier,
            relegated: Boolean(relegated),
            promoted: Boolean(promoted),
            wins: seasonStats.wins,
            draws: seasonStats.draws,
            losses: seasonStats.losses,
            pts: seasonStats.pts,
            pos: seasonStats.pos,
            gf: seasonStats.gf,
            ga: seasonStats.ga,
            att: formatOrganicAttendance(financials.expectedAtt || 500, club.stadium || 2000, state.year),
            stadium: club.stadium,
            academyLevel: club.academyLevel || 1,
            medicalLevel: club.medicalLevel || 1,
            pointsDeducted: pointsDeducted > 0 ? pointsDeducted : undefined,
            util: club.stadium ? Math.min(100, Math.round(((financials.expectedAtt||0) / club.stadium) * 100)) : 80,
            trophiesThisYear,
            finalTable: userFinalTable,
            divisionTables,
            tactic: state.tactic,
            rivalName: dd?.rivalName || rivalClubName,
            rivalPts: dd ? dd.rivalPts : undefined,
            rivalGd: ddRivalGd,
            championshipDecider: dd?.type === 'title'
        };

        let earnedPoints = 0;
        if (seasonStats.pos === 1) {
            earnedPoints += (tier === 1 ? 4 : 3);
        }
        if (promoted) earnedPoints += 3;
        if (state.year > 0 && state.year % 5 === 0) earnedPoints += 2;

        const clubWithBudget: Club = {
            ...club,
            currentBudget: budget
        };
        const activeRoadmap = getOrGenerateRoadmap(state.boardRoadmap, clubWithBudget, state.year, state.history);
        const preSimRoadmapSnapshot = JSON.parse(JSON.stringify(activeRoadmap));
        const evalResult = evaluateRoadmapProgress(
            activeRoadmap,
            clubWithBudget,
            state.year,
            seasonStats,
            [...state.history, histItem],
            histItem.trophiesThisYear
        );

        earnedPoints += evalResult.earnedMp;
        let nextRoadmap = evalResult.updatedRoadmap;

        if (evalResult.completedGoals.length > 0) {
            evalResult.completedGoals.forEach(g => {
                A.push({
                    id: Math.random().toString(),
                    type: "celebration",
                    category: "board_roadmap",
                    message: `🎯 ROADMAP GOAL ACHIEVED: ${g.titleEn}! (+${g.rewardMp} MP)`,
                    subtitle: `Strategic board milestone reached! Rewarded +${g.rewardMp} Manager Points${g.rewardCash ? ` and +${formatMoney(g.rewardCash)} budget` : ''}.`,
                    read: false
                });
            });
        }

        if (evalResult.roadmapFinished) {
            if (evalResult.success) {
                A.push({
                    id: Math.random().toString(),
                    type: "celebration",
                    category: "board_roadmap",
                    message: `🏆 STRATEGIC ROADMAP COMPLETED! (+3 MP Bonus)`,
                    subtitle: `Outstanding managerial execution! The Board approves the next multi-year roadmap.`,
                    read: false
                });
            }
            nextRoadmap = generateBoardRoadmap(
                { ...clubWithBudget, currentBudget: budget + (evalResult.earnedCash || 0) },
                state.year + 1,
                [...state.history, histItem]
            );
        }

        const newSkillPoints = (state.skillPoints || 0) + earnedPoints;
        const roadmapCashBonus = evalResult.earnedCash || 0;
        
        if (seasonStats.pos === 1) {
            if (tier === 1) {
                rep += 8;
                if (currentHist.length > 0 && currentHist[currentHist.length - 1].pos === 1) rep += 6; 
            } else {
                rep += 5;
            }
        } else if (seasonStats.pos === 2 && playedTier > 1 && !isPromoDenied) {
            rep += 3;
        }
        
        if (histItem.trophiesThisYear?.cl) rep += 12;
        else if (histItem.trophiesThisYear?.el) rep += 7;
        else if (histItem.trophiesThisYear?.ecl) rep += 5;
        if (histItem.trophiesThisYear?.cwc) rep += 8;
        if (histItem.trophiesThisYear?.dfb) rep += 5;
        else if (histItem.trophiesThisYear?.reg) rep += 2;

        if (relegated) rep -= 8;
        if (seasonStats.pos <= oldTarget) rep += 2;
        else if (seasonStats.pos > oldTarget + 2) rep -= 3;

        let isSacked = _wasSacked;
        if (managerSkills.includes('untouchable') && !finishedInBottomTierRelegationZone && !bankruptInBottomTier) {
            isSacked = false;
        }
        if (isSacked) {
            isSacked = true;
            rep -= 10;
            const domTrophies = (state.totals?.domTrophies || 0);
            const intTrophies = (state.totals?.intTrophies || 0);
            const clWins = state.history.filter(h => h.trophiesThisYear?.cl).length; 
            const repFloor = Math.max(25, Math.min(85, 25 + (clWins * 18) + (intTrophies * 10) + (domTrophies * 4)));
            rep = Math.max(repFloor, rep);
        }

        rep = Math.max(1, Math.min(100, rep));

        let euroStatus: 'CL' | 'EL' | 'ECL' | null = null;
        if (tier === 1 && club.tier === 1 && !isReserveClub(club.name)) {
            if (seasonStats.pos <= 2 || histItem.trophiesThisYear?.cl) {
                euroStatus = 'CL';
            } else if (seasonStats.pos <= 5 || histItem.trophiesThisYear?.dfb || histItem.trophiesThisYear?.el) {
                euroStatus = 'EL';
            } else if (seasonStats.pos <= 6) {
                const excludedCountries = ['HUN', 'GER', 'ESP', 'POR'];
                if (!excludedCountries.includes(club.country || 'GER')) {
                    euroStatus = 'ECL';
                }
            }
        } else if (!isReserveClub(club.name) && histItem.trophiesThisYear?.dfb) {
            if (tier === 2) {
                if (Math.random() < 0.02) {
                    euroStatus = 'EL';
                    extraNotifications.push({
                        id: Math.random().toString(),
                        type: 'celebration',
                        title: 'EHF CONTINENTAL LICENSING MIRACLE! (2%)',
                        message: `🏆 HISTORIC EHF EXEMPTION: Following your Tier 2 Domestic Cup triumph, the EHF has granted an extraordinary 2% miracle license for the EHF European League!`,
                        read: false
                    });
                } else {
                    extraNotifications.push({
                        id: Math.random().toString(),
                        type: 'info',
                        title: 'EHF Continental Regulations',
                        message: `Domestic Cup Champions: European League spots for non-Tier-1 clubs require an exceptional EHF exemption (2% chance for Tier 2). Exemption was not granted for next season.`,
                        read: false
                    });
                }
            } else if (tier >= 3) {
                if (Math.random() < 0.0001) {
                    euroStatus = 'EL';
                    extraNotifications.push({
                        id: Math.random().toString(),
                        type: 'celebration',
                        title: '0.01% CONTINENTAL MIRACLE QUALIFICATION!',
                        message: `🏆 UNPRECEDENTED EHF LICENSE: Following your lower-tier Domestic Cup triumph, the EHF has awarded an astonishing 0.01% miracle wildcard to enter the EHF European League!`,
                        read: false
                    });
                } else {
                    extraNotifications.push({
                        id: Math.random().toString(),
                        type: 'info',
                        title: 'EHF Continental Regulations',
                        message: `Domestic Cup Champions: Lower-tier clubs require an unprecedented EHF exemption (0.01% chance) to enter the European League. Standard Tier 1 entry rules applied.`,
                        read: false
                    });
                }
            }
        }

        // Veteran Ringer Gamble Outcome
        if (state.veteranRingerSignedThisSeason) {
            if (promoted) {
                extraNotifications.push({
                    id: Math.random().toString(),
                    type: 'celebration',
                    title: 'VETERAN RINGER GAMBLE PAID OFF!',
                    message: `🎉 PROMOTION ACHIEVED! 38-year-old star ${state.veteranRingerName || 'Veteran Ringer'} hangs up his boots on a historic high! The massive TV rights and prize money of the higher tier save your club from financial crisis.`,
                    read: false
                });
            } else {
                extraNotifications.push({
                    id: Math.random().toString(),
                    type: 'danger',
                    title: 'THE VETERAN RINGER TRAP!',
                    message: `⚠️ PROMOTION MISSED! 38-year-old star ${state.veteranRingerName || 'Veteran Ringer'} retires (-${state.veteranRingerOvrGain || 4} OVR). Without promotion TV money, his exorbitant wages push the club towards financial austerity!`,
                    read: false
                });
            }
        }

        const remainingRebuildWageDiscount = Math.max(0, (state.rebuildWageDiscountSeasons || 0) - 1);
        const remainingRebuildYouthAccel = Math.max(0, (state.rebuildYouthAccelSeasons || 0) - 1);
        const nextRelegationWageReliefSeasons = relegated ? 1 : 0;
        if (relegated) {
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'info',
                title: 'RELEGATION CONTRACT CLAUSES ACTIVATED',
                message: `📉 Statutory Relegation Wage Adjustment: Standard division-drop contract clauses activated (-18% squad wage relief for the upcoming rebuild campaign).`,
                read: false
            });
        }
        if ((state.rebuildWageDiscountSeasons || 0) > 0) {
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'info',
                title: 'REBUILD WAGE RELIEF APPLIED',
                message: `💸 Generational Rebuild Payroll Relief: 25% lower squad wage expense applied (${remainingRebuildWageDiscount} season(s) remaining).`,
                read: false
            });
        }
        if ((financials.treasuryReserveYield || 0) > 0) {
            const treasuryDiv = financials.treasuryReserveYield;
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'success',
                title: 'AUSTERITY TREASURY DIVIDEND',
                message: `💼 Prudent Treasury Yield: Earned +${formatMoney(treasuryDiv)} annual interest dividend from maintaining €10M+ cash reserves.`,
                read: false
            });
        }
        const updatedConsecutiveTitles = (seasonStats.pos === 1 && playedTier === 1 && !isReserveClub(club.name)) ? (state.consecutiveTitles || 0) + 1 : 0;
        if (currentTacticTenure >= 2) {
            extraNotifications.push({
                id: Math.random().toString(),
                type: 'warning',
                title: currentTacticTenure >= 3 ? 'TACTICAL SYSTEM CRITICALLY STALE' : 'TACTICAL SYSTEM BECOMING STALE',
                message: currentTacticTenure >= 3
                    ? `⚠️ Stagnation Alert (Yr ${currentTacticTenure}): Opponents have thoroughly scouted your ${state.tactic} setup (-1.0 OVR drag). Evolving the philosophy in the Rebuild hub is strongly advised.`
                    : `⚠️ Video Analysts Adapting (Yr 2): Opponent scouting departments have begun anticipating your ${state.tactic} transition triggers (-0.5 OVR drag). System is becoming stale.`,
                read: false
            });
        }
        if (updatedConsecutiveTitles > 0) {
            const rawTax = Math.min(4.0, updatedConsecutiveTitles >= 4 ? Math.max(2.5, updatedConsecutiveTitles * 0.75) : updatedConsecutiveTitles * 0.5);
            const hasImmunity = (club.medicalLevel || 1) >= 5 || (club.academyLevel || 1) >= 5;
            const hasHalfShield = !hasImmunity && ((club.morale ?? 100) > 90 || (club.medicalLevel || 1) >= 3);
            const effTax = hasImmunity ? 0 : hasHalfShield ? rawTax / 2 : rawTax;
            extraNotifications.push({
                id: Math.random().toString(),
                type: hasImmunity ? 'info' : 'warning',
                title: updatedConsecutiveTitles > 1 ? `🚨 MOUNTING DYNASTY PRESSURE (${updatedConsecutiveTitles} TITLES)` : '🎯 TITLE DEFENSE TARGET ON BACK',
                message: hasImmunity
                    ? `As reigning champions, opponents target you with peak intensity, but your Level 5 facilities grant permanent Dynasty Immunity (0.0 OVR penalty)!`
                    : `As reigning champions, opponents treat matches against you with peak intensity. Target on the Back tax: -${effTax.toFixed(1)} OVR${hasHalfShield ? ' (halved by Lvl 3+ Medical / High Morale)' : ' (upgrade Academy or Medical to Lvl 5 for full immunity)'}.`,
                read: false
            });
        }

        const updatedTrophyDrought = wonAnyTrophy ? 0 : (state.trophyDrought || 0) + 1;

        let updatedStockPrice = club.stockPrice;
        if (club.isPublic && club.stockPrice && club.ipoPrice) {
            let stockPctChange = 0;
            if (wonAnyTrophy || seasonStats.pos === 1) {
                stockPctChange = 0.25;
            } else if (promoted || (seasonStats.pos <= 3 && playedTier === 1)) {
                stockPctChange = 0.15;
            } else if (seasonStats.pos <= (boardTargetPos || 8)) {
                stockPctChange = 0.05;
            } else if (relegated) {
                stockPctChange = -0.35;
            } else {
                stockPctChange = -0.12;
            }

            // Financial health impact
            if (financials.net > 0) {
                stockPctChange += 0.05;
            } else {
                stockPctChange -= 0.08;
            }

            updatedStockPrice = Math.max(0.10, Math.round(club.stockPrice * (1 + stockPctChange) * 100) / 100);
            
            const diffFromIpo = ((updatedStockPrice - club.ipoPrice) / club.ipoPrice) * 100;
            extraNotifications.push({
                id: Math.random().toString(),
                type: stockPctChange >= 0 ? 'success' : 'warning',
                title: stockPctChange >= 0 ? '📈 STOCK SURGE: ANNUAL SHAREHOLDER REPORT' : '📉 STOCK DIP: ANNUAL SHAREHOLDER REPORT',
                message: `Capital Markets & Stock Exchange Update: Share price recalibrated to €${updatedStockPrice.toFixed(2)} (${diffFromIpo >= 0 ? '+' : ''}${diffFromIpo.toFixed(1)}% vs IPO). Annual shareholder dividend: -${formatMoney(financials.shareholderDividend || 0)}.`,
                read: false
            });
        }

        const currentSeasonTerms = getDynamicSponsorPitchTerms({
            ...state,
            club: { ...club, tier: playedTier }
        });
        const rawCurDeals = (state.seasonSponsorDeals && state.seasonSponsorDealsYear === state.year)
            ? state.seasonSponsorDeals
            : {};
        const completedSeasonSponsorDeals: Record<number, { status: 'signed' | 'failed' | 'available'; brandName: string; brandLogo: string; payout?: number; bonus?: number }> = {
            0: rawCurDeals[0] || { status: 'available', brandName: currentSeasonTerms.standardBrand.name, brandLogo: currentSeasonTerms.standardBrand.logo, payout: currentSeasonTerms.standardPayout },
            1: rawCurDeals[1] || { status: 'available', brandName: currentSeasonTerms.megaBrand.name, brandLogo: currentSeasonTerms.megaBrand.logo, payout: currentSeasonTerms.megaPayout },
            2: rawCurDeals[2] || { status: 'available', brandName: currentSeasonTerms.perfBrand.name, brandLogo: currentSeasonTerms.perfBrand.logo, payout: currentSeasonTerms.performanceUpfront, bonus: currentSeasonTerms.performanceBonus }
        };
        (histItem as any).seasonSponsorDeals = completedSeasonSponsorDeals;

        // Carry over unpitched sponsor brands to next season if staying in the same tier so unpitched sponsors never vanish;
        // if a slot was pitched ('signed' or 'failed') or the club changed division tier, assign a fresh tier-scaled brand for next season.
        const nextSeasonSponsorDeals: Record<number, { status: 'signed' | 'failed' | 'available'; brandName: string; brandLogo: string; payout?: number; bonus?: number }> = {};
        ([0, 1, 2] as const).forEach((slotIdx) => {
            const curSlot = completedSeasonSponsorDeals[slotIdx];
            const wasPitched = curSlot && (curSlot.status === 'signed' || curSlot.status === 'failed');
            if (!wasPitched && playedTier === nextTier && curSlot?.brandName && curSlot.brandName !== 'Empty') {
                nextSeasonSponsorDeals[slotIdx] = {
                    status: 'available',
                    brandName: curSlot.brandName,
                    brandLogo: curSlot.brandLogo || ''
                };
            } else {
                let nextBrand = getSponsorBrandForClub(club.country || 'GER', slotIdx, state.year + 1, club.name, 0, nextTier);
                if (wasPitched && nextBrand.name === curSlot?.brandName) {
                    nextBrand = getSponsorBrandForClub(club.country || 'GER', slotIdx, state.year + 1, club.name, 1, nextTier);
                }
                nextSeasonSponsorDeals[slotIdx] = {
                    status: 'available',
                    brandName: nextBrand.name,
                    brandLogo: nextBrand.logo || ''
                };
            }
        });

        const ue = {
            ...state,
            rebuildWageDiscountSeasons: remainingRebuildWageDiscount,
            rebuildYouthAccelSeasons: remainingRebuildYouthAccel,
            relegationWageReliefSeasons: nextRelegationWageReliefSeasons,
            consecutiveTitles: updatedConsecutiveTitles,
            trophyDrought: updatedTrophyDrought,
            skillPoints: newSkillPoints,
            extraNotifications,
            performanceDealResult,
            euroStatus,
            reputation: rep,
            year: state.year + 1,
            ovrHistory: localOvrHistory.slice(0, 50),
            cupRunResults: (state.cupRunResults || []).filter(r => r && (r.won || r.year >= state.year - 1)),
            budget: budget + roadmapCashBonus,
            club: { ...club, currentBudget: budget + roadmapCashBonus, stockPrice: updatedStockPrice },
            youthPipeline: pipeline,
            totals: {
                matches: (state.totals?.matches || 0) + S,
                wins: (state.totals?.wins || 0) + seasonStats.wins,
                att: (state.totals?.att || 0) + (financials.expectedAtt * S),
                trophies: (state.totals?.trophies || 0) + earnedTrophyStrings.length,
                domTrophies: (state.totals?.domTrophies || 0) + (trophiesThisYear.dfb ? 1 : 0) + ((seasonStats.pos === 1 && playedTier === 1 && !isReserveClub(club.name)) || trophiesThisYear.bl ? 1 : 0),
                intTrophies: (state.totals?.intTrophies || 0) + (trophiesThisYear.cl ? 1 : 0) + (trophiesThisYear.el ? 1 : 0) + (trophiesThisYear.ecl ? 1 : 0) + (trophiesThisYear.cwc ? 1 : 0),
            },
            trophies: [...(state.trophies || []), ...earnedTrophyStrings],
            history: [...state.history, histItem],
            notifications: [
                ...(state.notifications || []).filter(n => !n.read),
                ...(H ? [H] : []),
                ...extraNotifications
            ],
            lastOvr: state.club.baseOvr,
            startOfSeasonOvr: club.baseOvr,
            signingOvrGainThisSeason: 0,
            signingFlopLossThisSeason: 0,
            eventOvrGainThisSeason: 0,
            boardToast: H,
            clubImpactScore: clubImpact,
            immunityShields: shields,
            tenureYears: tenure,
            boardExpectsSuccess,
            boardTargetPos,
            boardExpectation,
            boardRoadmap: nextRoadmap,
            isSacked,
            seasonsInDebt,
            bankruptcyPending,
            activeLoan: updatedActiveLoan,
            rivalClubName,
            rivalH2HWins: (rivalChanged ? 0 : (state.rivalH2HWins || 0)) + rivalWins,
            rivalH2HLosses: (rivalChanged ? 0 : (state.rivalH2HLosses || 0)) + rivalLosses,
            rivalH2HDraws: (rivalChanged ? 0 : (state.rivalH2HDraws || 0)) + rivalDraws,
            midSeasonCrisisTriggered: false, 
            infraActionsThisSeason: 0,
            stadiumExpandedThisSeason: 0,
            academyUpgradedThisSeason: 0,
            medicalUpgradedThisSeason: 0,
            regTransfersThisSeason: 0,
            keyTransfersThisSeason: 0,
            galacticosThisSeason: 0,
            loansThisSeason: 0,
            veteranRingerSignedThisSeason: false,
            veteranRingerOvrGain: 0,
            veteranRingerWageCost: 0,
            veteranRingerName: undefined,
            rebuildImmunity: false,
            youthDevQueue: 0,
            youthPullsThisSeason: 0,
            youthPullsSeasonYear: state.year + 1,
            graduatedYouthsThisSeason: [],
            graduatedYouthsSeasonYear: state.year + 1,
            youthSalesThisSeason: 0,
            youthSalesSeasonYear: state.year + 1,
            youthScoutsThisSeason: 0,
            schoolTrialistsThisSeason: 0,
            lastGenerationalTurnoverYear: triggeredGenerationalYear,
            squadSalesThisSeason: 0,
            sponsorsPitchedThisSeason: 0,
            activePerformanceDeal: false,
            failedSponsorTargetNextSeason: false,
            seasonSponsorDeals: nextSeasonSponsorDeals,
            seasonSponsorDealsYear: state.year + 1,
            pendingSupercupTrophies: undefined,
            regionalToursThisSeason: 0,
            brandCampaignsThisSeason: 0,
            teamBondingThisSeason: 0,
            sponsorIncome: 0,
            investmentsThisSeason: 0,
            jobMarketSearchesThisSeason: 0,
            transferSpend: 0,
            youthSpend: 0,
            facilitySpend: 0,
            contractRenewalSpend: 0,
            marketingSpend: 0,
            cupQualifiedForSf: state.cupQualifiedForSf,
            euroQualifiedForSf: state.euroQualifiedForSf,
            activeCupTournament: state.activeCupTournament,
            activeEuroTournament: state.activeEuroTournament,
            resolvedMatchContext: undefined,
            playoffVictoryOverride: undefined,
            winterBreakSeenYear: -1,
            winterTransfersOpenedYear: -1,
            pendingSeasonState: null
        };
        
        trackEvent('season_finish', { 
            club_name: club.name,
            country: club.country || 'GER',
            tier: histItem.tier,
            next_tier: club.tier,
            year: state.year,
            pos: seasonStats.pos,
            pts: seasonStats.pts,
            avg_attendance: financials.expectedAtt,
            net_profit: financials.net,
            ending_budget: budget + roadmapCashBonus,
            fanbase: club.fanBase
        });

        // Career score and 35-season highscore submission are calculated after global simulation & trophy reconciliation below

        const filteredCupFinals = state.resolvedMatchContext?.cupFinals
            ? (Object.fromEntries(
                  Object.entries(state.resolvedMatchContext.cupFinals).filter(([_, c]: [string, any]) => c && c.year === state.year)
              ) as Record<string, any>)
            : undefined;
        const validMatchContext = (
            (state.resolvedMatchContext?.playoffDecider && state.resolvedMatchContext.playoffDecider.year === state.year) ||
            (filteredCupFinals && Object.keys(filteredCupFinals).length > 0)
        ) ? {
            ...(state.resolvedMatchContext?.playoffDecider?.year === state.year ? { playoffDecider: state.resolvedMatchContext.playoffDecider } : {}),
            ...(filteredCupFinals && Object.keys(filteredCupFinals).length > 0 ? { cupFinals: filteredCupFinals } : {})
        } : undefined;

        const validPlayoffOverride = state.playoffVictoryOverride && (
            !(state.playoffVictoryOverride as any).year || (state.playoffVictoryOverride as any).year === state.year
        ) ? state.playoffVictoryOverride : undefined;

        const simGlobalResult = simulateGlobalLeagues(
            state.worldClubs || {},
            club,
            playedTier,
            state.year,
            seasonStats.pos,
            histItem.trophiesThisYear,
            userFinalTable,
            divisionTables,
            validMatchContext,
            state.cupRunResults,
            updatedConsecutiveTitles,
            validPlayoffOverride
        );

        // Takeover notifications are pushed via simGlobalResult.movements (type === 'takeover') below

        // Intercept AI false-positive cup assignments if the user was eliminated
        simGlobalResult.movements = (simGlobalResult.movements || []).map(m => {
            if (m.type === 'intl_cup') {
                const isClubMatch = Boolean(
                    (m.clubName && club.name && m.clubName.trim().toLowerCase() === club.name.trim().toLowerCase()) ||
                    (club.id !== undefined && m.clubId !== undefined && (String(m.clubId) === String(club.id) || Number(m.clubId) === Number(club.id)))
                );
                if (isClubMatch) {
                    const title = (m.cupTitle || '').toLowerCase();
                    const isSupercup = Boolean(m.id?.endsWith('-cup-sc') || m.id?.endsWith('-cup-esc') || title.includes('supercup') || title.includes('super cup') || title.includes('supercopa') || title.includes('trophée des champions'));
                    const isNat = !isSupercup && (title.includes('pokal') || title.includes('cup') || title.includes('copa') || title.includes('coupe') || title.includes('puchar') || title.includes('kupa') || title.includes('kup') || title.includes('coppa') || title.includes('cupa') || title.includes('cupen') || title.includes('taça') || title.includes('taca') || title.includes('bikar') || title.includes('nm')) && !title.includes('amateur') && !title.includes('regional') && !title.includes('super globe') && !title.includes('champions league') && !title.includes('european');
                    const isReg = title.includes('amateur') || title.includes('regional');
                    const isCwc = title.includes('super globe') || title.includes('club world');
                    const isCl = title.includes('champions league') || (title.includes('champions') && !title.includes('super globe') && !isSupercup);
                    const isEl = title.includes('european league') || title.includes('euro league');
                    const isEcl = title.includes('european cup');
                    
                    const shouldReroll = (isNat && (natCupEliminated || !natCupWon)) ||
                        (isReg && (regCupEliminated || !regCupWon)) ||
                        (isCwc && (cwcEliminated || !cwcWon)) ||
                        (isCl && (clEliminated || !clWon)) ||
                        (isEl && (elEliminated || !elWon)) ||
                        (isEcl && (eclEliminated || !eclWon));

                    if (shouldReroll) {
                        // Re-roll to an authentic AI club from the appropriate competition tier to correct the false positive
                        const validAiClubs = activeClubsList.filter(c => 
                            (isReg ? (c.tier || 1) > 1 : isNat ? (c.tier || 1) <= 2 : c.tier === 1) && 
                            normalizeCountry(c.country || 'GER') === normalizeCountry(m.country || club.country || 'GER') && 
                            String(c.id) !== String(club.id) &&
                            c.name.trim().toLowerCase() !== club.name.trim().toLowerCase() && 
                            !isReserveClub(c.name)
                        );
                        const fallbackClub = validAiClubs[Math.floor(Math.random() * validAiClubs.length)] || 
                            activeClubsList.find(c => String(c.id) !== String(club.id) && c.name.trim().toLowerCase() !== club.name.trim().toLowerCase() && !isReserveClub(c.name) && (isReg ? (c.tier || 1) > 1 : true)) || 
                            activeClubsList.find(c => String(c.id) !== String(club.id)) || 
                            activeClubsList[0];
                        return {
                            ...m,
                            clubId: String(fallbackClub.id),
                            clubName: fallbackClub.name,
                            clubLogo: fallbackClub.logo,
                            clubColor: fallbackClub.color,
                            country: normalizeCountry(fallbackClub.country || m.country || 'GER'),
                            fromTier: fallbackClub.tier || 1,
                            toTier: fallbackClub.tier || 1
                        };
                    }
                }
            }
            return m;
        });

        ue.worldClubs = simGlobalResult.newWorldClubs;
        ue.universeMovements = [...simGlobalResult.movements, ...(state.universeMovements || [])].slice(0, 250);
        ue.resolvedMatchContext = validMatchContext;
        histItem.universeMovements = simGlobalResult.movements;
        histItem.resolvedMatchContext = validMatchContext;
        histItem.insolventClubs = simGlobalResult.insolventClubs;

        // Refresh Tier 1 status markers so AI cup winners receive their European qualification ('Q') marker
        if (Array.isArray(divisionTables[1])) {
            const cupQualifiers = new Set<string>();
            if (validMatchContext?.cupFinals) {
                Object.entries(validMatchContext.cupFinals).forEach(([k, val]: [string, any]) => {
                    if (k !== 'reg_cup' && k !== 'reg' && k !== 'cwc' && val?.winnerName && (!val.year || val.year === state.year)) {
                        cupQualifiers.add(String(val.winnerName).trim().toLowerCase());
                    }
                });
            }
            (simGlobalResult.movements || []).forEach(m => {
                if (m.year === state.year && m.type === 'intl_cup' && m.clubName) {
                    const title = String(m.cupTitle || '').toLowerCase();
                    if (!title.includes('amateur') && !title.includes('regional') && !title.includes('super globe')) {
                        cupQualifiers.add(String(m.clubName).trim().toLowerCase());
                    }
                }
            });
            divisionTables[1] = divisionTables[1].map((row: any) => {
                if (row && !row.statusMarker && row.pos >= 2 && !isReserveClub(row.name) && cupQualifiers.has(String(row.name).trim().toLowerCase())) {
                    return { ...row, statusMarker: 'Q' };
                }
                return row;
            });
            if (playedTier === 1) {
                histItem.finalTable = divisionTables[1];
            }
        }

        (simGlobalResult.movements || []).forEach(m => {
            if (m.type === 'intl_cup') {
                const isClubMatch = Boolean(
                    (m.clubName && club.name && m.clubName.trim().toLowerCase() === club.name.trim().toLowerCase()) ||
                    (club.id !== undefined && m.clubId !== undefined && (String(m.clubId) === String(club.id) || Number(m.clubId) === Number(club.id)))
                );
                if (isClubMatch) {
                    histItem.trophiesThisYear = histItem.trophiesThisYear || {};
                    const title = (m.cupTitle || '').toLowerCase();
                    const isEuroSc = Boolean(m.id?.endsWith('-cup-esc') || title.includes('european supercup') || title.includes('euro supercup'));
                    const isDomSc = Boolean(!isEuroSc && (m.id?.endsWith('-cup-sc') || title.includes('supercup') || title.includes('super cup') || title.includes('supercopa') || title.includes('trophée des champions')));
                    if (isEuroSc) {
                        // No international supercup
                    } else if (isDomSc) histItem.trophiesThisYear.sc = 1;
                    else if (title.includes('super globe') && !cwcEliminated && cwcWon) histItem.trophiesThisYear.cwc = 1;
                    else if (title.includes('champions league') && !clEliminated && clWon) histItem.trophiesThisYear.cl = 1;
                    else if (title.includes('european league') && !elEliminated && elWon) histItem.trophiesThisYear.el = 1;
                    else if (title.includes('european cup') && !eclEliminated && eclWon) histItem.trophiesThisYear.ecl = 1;
                    else if ((title.includes('pokal') || title.includes('cup') || title.includes('copa') || title.includes('coupe') || title.includes('puchar') || title.includes('kupa') || title.includes('kup') || title.includes('coppa') || title.includes('cupa') || title.includes('cupen') || title.includes('taça') || title.includes('taca') || title.includes('bikar') || title.includes('nm')) && !title.includes('amateur') && !title.includes('regional')) {
                        if (!natCupEliminated && natCupWon) {
                            histItem.trophiesThisYear.dfb = 1;
                        }
                    } else if (title.includes('amateur') || title.includes('regional')) {
                        if (!regCupEliminated && regCupWon) {
                            histItem.trophiesThisYear.reg = 1;
                        }
                    }
                }
            }
        });

        if (natCupEliminated && histItem.trophiesThisYear?.dfb) {
            delete histItem.trophiesThisYear.dfb;
        }
        if (regCupEliminated && histItem.trophiesThisYear?.reg) {
            delete histItem.trophiesThisYear.reg;
        }
        if (clEliminated && histItem.trophiesThisYear?.cl) {
            delete histItem.trophiesThisYear.cl;
        }
        if (elEliminated && histItem.trophiesThisYear?.el) {
            delete histItem.trophiesThisYear.el;
        }
        if (eclEliminated && histItem.trophiesThisYear?.ecl) {
            delete histItem.trophiesThisYear.ecl;
        }
        if (cwcEliminated && histItem.trophiesThisYear?.cwc) {
            delete histItem.trophiesThisYear.cwc;
        }
        if (natCupEliminated) {
            A = A.filter(t => !(
                (t.category === 'cup' || t.category === 'celebration') &&
                typeof t.message === 'string' &&
                (t.message.includes('Domestic Cup Winners') || t.message.includes('National Cup Winners') || t.message.includes('Pokalsieger') || t.message.includes('Cup Winners'))
            ));
        }
        if (regCupEliminated) {
            A = A.filter(t => !(
                (t.category === 'cup' || t.category === 'celebration') &&
                typeof t.message === 'string' &&
                (t.message.includes('Regional') || t.message.includes('Amateurpokal'))
            ));
        }
        if (clEliminated) {
            A = A.filter(t => !(
                (t.category === 'euro' || t.category === 'cup' || t.category === 'celebration') &&
                typeof t.message === 'string' &&
                t.message.includes('Champions League')
            ));
        }
        if (elEliminated) {
            A = A.filter(t => !(
                (t.category === 'euro' || t.category === 'cup' || t.category === 'celebration') &&
                typeof t.message === 'string' &&
                (t.message.includes('European League') || t.message.includes('Euro League'))
            ));
        }
        if (eclEliminated) {
            A = A.filter(t => !(
                (t.category === 'euro' || t.category === 'cup' || t.category === 'celebration') &&
                typeof t.message === 'string' &&
                t.message.includes('European Cup')
            ));
        }
        if (cwcEliminated) {
            A = A.filter(t => !(
                (t.category === 'euro' || t.category === 'cup' || t.category === 'celebration') &&
                typeof t.message === 'string' &&
                t.message.includes('Super Globe')
            ));
        }

        // Re-synchronize ue.trophies, ue.totals, and ue.history with verified histItem.trophiesThisYear
        const finalTrophyStrings: string[] = [];
        if (histItem.trophiesThisYear?.cl) finalTrophyStrings.push('EHF Champions League');
        if (histItem.trophiesThisYear?.el) finalTrophyStrings.push('EHF European League');
        if (histItem.trophiesThisYear?.ecl) finalTrophyStrings.push('EHF European Cup');
        if (histItem.trophiesThisYear?.cwc) finalTrophyStrings.push('IHF Super Globe');
        if (histItem.trophiesThisYear?.bl) finalTrophyStrings.push('League Champions');
        if (histItem.trophiesThisYear?.lower) finalTrophyStrings.push('Lower League Title');
        if (histItem.trophiesThisYear?.dfb) finalTrophyStrings.push('National Cup');
        if (histItem.trophiesThisYear?.sc) finalTrophyStrings.push('National Supercup');
        if (histItem.trophiesThisYear?.reg) finalTrophyStrings.push('Regional Cup');

        ue.trophies = [...(state.trophies || []), ...finalTrophyStrings];
        
        // Note: state.pendingSupercupTrophies were already added to state.totals in handleResolvePreSeasonSupercup
        const alreadyCreditedSc = state.pendingSupercupTrophies?.sc ? 1 : 0;
        const finalDomCount = (histItem.trophiesThisYear?.dfb ? 1 : 0) + ((histItem.trophiesThisYear?.bl || (seasonStats.pos === 1 && playedTier === 1 && !isReserveClub(club.name))) ? 1 : 0) + ((histItem.trophiesThisYear?.sc ? 1 : 0) - alreadyCreditedSc);
        const finalIntCount = (histItem.trophiesThisYear?.cl ? 1 : 0) + (histItem.trophiesThisYear?.el ? 1 : 0) + (histItem.trophiesThisYear?.ecl ? 1 : 0) + (histItem.trophiesThisYear?.cwc ? 1 : 0);
        const netNewTrophiesCount = Math.max(0, finalTrophyStrings.length - alreadyCreditedSc);
        ue.totals = {
            matches: (state.totals?.matches || 0) + S,
            wins: (state.totals?.wins || 0) + seasonStats.wins,
            att: (state.totals?.att || 0) + (financials.expectedAtt * S),
            trophies: (state.totals?.trophies || 0) + netNewTrophiesCount,
            domTrophies: (state.totals?.domTrophies || 0) + finalDomCount,
            intTrophies: (state.totals?.intTrophies || 0) + finalIntCount,
        };
        const fullHistory = [...state.history, histItem];
        ue.history = pruneCareerHistoryForStorage(fullHistory);

        const liveScore = calculateLiveScore(ue);
        ue.careerScore = liveScore;
        ue.score = liveScore;

        if (!state.endlessModeActive && ue.history.length === 35) {
            saveHighscore(ue);
        }

        if (simGlobalResult.insolventClubs && simGlobalResult.insolventClubs.length > 0) {
            const userCountryNorm = normalizeCountry(club.country || 'GER');
            const domesticInsolvents = simGlobalResult.insolventClubs.filter(ic => normalizeCountry(ic.country || 'GER') === userCountryNorm);
            if (domesticInsolvents.length > 0) {
                ue.lastInsolventGiantNotice = domesticInsolvents[0];
                const insolvencyToasts = domesticInsolvents.map(ic => {
                    const normC = normalizeCountry(ic.country || 'GER');
                    const destLeague = getLeagueInfo(ic.tier, normC);
                    return {
                        id: Math.random().toString(),
                        type: 'warning',
                        category: 'insolvency',
                        message: `⚠️ Financial Insolvency: ${ic.clubName} Demoted!`,
                        subtitle: `${ic.clubName} failed licensing audit and suffered administrative demotion to ${destLeague.name}. Star players liquidated.`,
                        read: false
                    };
                });
                A.push(...insolvencyToasts);
            }
        }

        const cinderellaMovements = simGlobalResult.movements.filter(m => 
            m.isCinderella && 
            m.type === 'promotion' && 
            (normalizeCountry(m.country) === userCountryNorm || ['GER', 'FRA', 'ESP', 'DEN', 'HUN'].includes(normalizeCountry(m.country)))
        );
        cinderellaMovements.forEach(cm => {
            A.push({
                id: Math.random().toString(),
                type: 'celebration',
                category: 'cinderella_run',
                message: `✨ Cinderella Story: ${cm.clubName} Breakthrough!`,
                subtitle: `Powered by a golden generation surge, ${cm.clubName} has won sensational promotion to ${getLeagueInfo(cm.toTier, cm.country).name}!`,
                read: false
            });
        });

        const takeoverMovements = simGlobalResult.movements.filter(m => m.type === 'takeover');
        takeoverMovements.forEach(tm => {
            const tClub = simGlobalResult.newWorldClubs[tm.clubId];
            A.push({
                id: Math.random().toString(),
                type: 'warning',
                category: 'takeover',
                message: `🚨 Hostile Rival Takeover: ${tm.clubName}!`,
                subtitle: `Private commercial benefactors acquired ${tm.clubName} (+3 to +5 OVR surge, reaching ${tClub?.baseOvr || 88} OVR). An aggressive arms race has begun in ${getLeagueInfo(tm.fromTier, tm.country).name}!`,
                read: false
            });
        });

        ue.notifications = [...A, ...(ue.notifications || [])].slice(0, 50);

        set(ue);
        
        return {
            boardToast: H,
            year: state.year,
            newYear: state.year + 1,
            club,
            startOvr: state.startOfSeasonOvr || state.lastOvr || state.club.baseOvr,
            preSimOvr: state.club.baseOvr,
            clubTier: playedTier,
            nextTier: club.tier,
            numTeams: w,
            relegated: Boolean(relegated),
            survived: Boolean(!relegated && playedTier < getMaxTier(club.country || 'GER') && seasonStats.pos === Math.max(1, w - 2)),
            promoted: Boolean(promoted),
            isSacked: Boolean(isSacked),
            consecutiveTitles: updatedConsecutiveTitles,
            seasonStats,
            financials,
            avgAttendance: financials.expectedAtt,
            newBudget: budget + roadmapCashBonus,
            cupToasts: A,
            extraNotifications,
            performanceDealResult,
            seasonSponsorDeals: completedSeasonSponsorDeals,
            rosterUpdates: { retirements: pe, retirementPenalty, naturalDecay, dramaticDecay, bloatDepartures, emergencyCallups: V, callupPenalty: q, loanExpirationPenalty },
            worldClubs: simGlobalResult.newWorldClubs,
            universeMovements: simGlobalResult.movements,
            insolventClubs: simGlobalResult.insolventClubs,
            trophiesThisYear: histItem.trophiesThisYear,
            euroStatus,
            euroThisSeason: state.euroStatus,
            oldTarget,
            graduatedYouths,
            departedYouths: fe,
            skillPoints: newSkillPoints,
            earnedPoints,
            evaluatedRoadmap: evalResult.updatedRoadmap,
            _preSimRoadmap: preSimRoadmapSnapshot,
            _simRoadmapEarnedMp: evalResult.earnedMp || 0,
            _simRoadmapEarnedCash: evalResult.earnedCash || 0,
            rivalryThisSeason: {
                name: rivalClubName,
                wins: rivalWins,
                draws: rivalDraws,
                losses: rivalLosses,
                message: rivalToastMessage,
            }
        };
    },
    resolveBankruptcy: (choice) => {
        trackEvent('bankruptcy_resolved', { choice });
        set((r) => {
            const i = [...(r.history || [])];
            let newClub = { ...r.club };
            let newWorldClubs = { ...(r.worldClubs || {}) };
            let newIsSacked = choice === 'resign' ? true : r.isSacked;
            
            let ovrHistory = [...(r.ovrHistory || [])];
            const logChange = (change: number, reason: string, reasonDe: string) => {
                if (change !== 0) {
                    ovrHistory.unshift({ id: Math.random().toString(36).substring(7), season: r.year, change, reason, reasonDe });
                }
            };

            let newClubImpact = r.clubImpactScore || 50;
            let shields = r.immunityShields !== undefined ? r.immunityShields : 2;

            const lastHistEntry = i.length > 0 ? { ...i[i.length - 1] } : null;
            if (choice === 'insolvency') {
                const change = 40 - newClub.baseOvr;
                newClub.baseOvr = 40;
                logChange(change, 'Insolvency Reset', 'Zwangsabstieg & Neustart');
                const maxTier = getMaxTier(newClub.country || 'GER');
                const playedTier = lastHistEntry ? (lastHistEntry.tier || newClub.tier) : newClub.tier;
                const targetTier = Math.min(maxTier, Math.max(newClub.tier, playedTier + 1));
                if (targetTier > newClub.tier) {
                    const oldTier = newClub.tier;
                    newClub.tier = targetTier;
                    const normClubCountry = normalizeCountry(newClub.country || 'GER');
                    for (let stepT = oldTier; stepT < targetTier; stepT++) {
                        const targets = getActiveClubs(normClubCountry).map(c => mergeClubWithWorldState(c, newWorldClubs[c.id]))
                            .filter(c => c.tier === stepT + 1 && c.id !== newClub.id && normalizeCountry(c.country || 'GER') === normClubCountry && !(stepT <= 2 && isReserveClub(c.name)));
                        targets.sort((a, b) => b.baseOvr - a.baseOvr);
                        if (targets.length > 0) {
                            newWorldClubs[targets[0].id] = { ...targets[0], tier: stepT };
                        }
                    }
                }
                if (lastHistEntry) {
                    lastHistEntry.bankrupt = true;
                    lastHistEntry.nextTier = newClub.tier;
                    lastHistEntry.financialRelegation = newClub.tier > playedTier;
                    if (newClub.tier > playedTier) {
                        lastHistEntry.relegated = true;
                        lastHistEntry.promoted = false;
                        lastHistEntry.survived = false;
                    } else if (newClub.tier === playedTier) {
                        lastHistEntry.promoted = false;
                    }
                    delete (lastHistEntry as any).finalTable;
                    i[i.length - 1] = lastHistEntry;
                }
                
                newClubImpact = 25;
                if (shields > 0) {
                    shields -= 1;
                } else if (!(r.managerSkills || []).includes('untouchable')) {
                    newIsSacked = true;
                }
            } else if (choice === 'firesale') {
                const change = Math.max(35, newClub.baseOvr - 15) - newClub.baseOvr;
                newClub.baseOvr = Math.max(35, newClub.baseOvr - 15);
                logChange(change, 'Emergency Firesale', 'Notverkauf (Finanzkrise)');
                newClubImpact = Math.min(30, newClubImpact - 20);
                if (lastHistEntry) {
                    i[i.length - 1] = lastHistEntry;
                }
            }
            
            if (newClub && newClub.id) {
                newWorldClubs[newClub.id] = { ...newClub };
            }

            const newExpectations = getInitialBoardExpectations(newClub, newWorldClubs);

            const notifications = [
                {
                    id: Math.random().toString(),
                    type: choice === 'insolvency' ? 'warning' : 'info',
                    message: choice === 'insolvency'
                        ? `⚠️ Total Insolvency processed: Debts cleared, squad reset to 40 OVR. Club placed in ${getLeagueInfo(newClub.tier, newClub.country).name} (Tier ${newClub.tier}).`
                        : choice === 'firesale'
                        ? `📉 Emergency Firesale completed: Key assets liquidated to clear debts. Squad OVR reduced by 15. Division status maintained.`
                        : `Resignation confirmed.`,
                    read: false
                },
                ...(r.notifications || [])
            ];

            return { 
                seasonsInDebt: 0, 
                bankruptcyPending: false, 
                history: i, 
                budget: 0, 
                activeLoan: null,
                isSacked: newIsSacked,
                club: newClub,
                worldClubs: newWorldClubs,
                boardTargetPos: newExpectations.boardTargetPos,
                boardExpectation: newExpectations.boardExpectation,
                boardExpectsSuccess: newExpectations.boardExpectsSuccess,
                euroStatus: choice === 'insolvency' ? null : r.euroStatus,
                lastOvr: newClub.baseOvr,
                startOfSeasonOvr: newClub.baseOvr,
                signingOvrGainThisSeason: 0,
                signingFlopLossThisSeason: 0,
                eventOvrGainThisSeason: 0,
                relegationWageReliefSeasons: choice === 'insolvency' && newClub.tier > (r.club?.tier || 1) ? 1 : (r.relegationWageReliefSeasons || 0),
                clubImpactScore: newClubImpact,
                immunityShields: shields,
                ovrHistory,
                notifications
            };
        });
    },
    endCareer: () => {
        const state = get();
        if (state.isCareerEnded) return;

        const finalScore = calculateLiveScore(state);
        
        const newState = {
            ...state,
            isCareerEnded: true,
            careerScore: finalScore,
            score: finalScore
        };
        saveHighscore(newState);
        set(newState);
    },
    resetGame: () => {
        trackEvent('career_reset');
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(POSTSEASON_CHECKPOINT_KEY);
            }
        } catch {
            // ignore
        }
        set({
            ...initialState,
            careerId: 'career_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9),
            managerName: '',
            worldClubs: {},
            history: [],
            ovrHistory: [],
            youthPipeline: [],
            stadiumExpandedThisSeason: 0,
            infraActionsThisSeason: 0,
            facilitySpend: 0,
            transferSpend: 0,
            youthSpend: 0,
            contractRenewalSpend: 0,
            marketingSpend: 0,
            sponsorIncome: 0,
            signingOvrGainThisSeason: 0,
            signingFlopLossThisSeason: 0,
            eventOvrGainThisSeason: 0,
            youthPullsThisSeason: 0,
            cupRunResults: [],
            resolvedMatchContext: undefined,
            playoffVictoryOverride: undefined,
            pendingSeasonState: null,
            supercupPlayedYear: undefined,
            pendingSupercupTrophies: undefined,
        });
    },
    dismissNotification: (n) => set((r) => ({ notifications: (r.notifications || []).filter(i => i.id !== n) })),
    unlockManagerSkill: (n) => set((r) => {
        if ((r.managerSkills || []).includes(n)) return r;
        const count = (r.managerSkills || []).length;
        const skillDef = MANAGER_SKILLS[n];
        let cost = skillDef ? skillDef.cost : 100;
        if (!skillDef) {
            if (count === 0) cost = 10;
            else if (count === 1) cost = 15;
            else if (count === 2) cost = 25;
            else if (count === 3) cost = 50;
        }
        if ((r.skillPoints || 0) < cost) return r;
        return { 
            managerSkills: [...(r.managerSkills||[]), n],
            skillPoints: (r.skillPoints || 0) - cost
        };
    }),
    upgradeFacility: (n, cost) => set((i) => {
        const o = { ...i.club };
        const creditLimit = getCreditLimit(o.tier || 1, o.country || 'GER');
        if (i.budget + creditLimit < cost) return {};
        if (((i.facilitiesUpgradedThisSeason || 0) + (i.infraActionsThisSeason || 0)) >= 2) return {};
        if (n === 'academy' && ((o.academyLevel || 1) >= 5 || (i.academyUpgradedThisSeason || 0) >= 1)) return {};
        if (n === 'medical' && ((o.medicalLevel || 1) >= 5 || (i.medicalUpgradedThisSeason || 0) >= 1)) return {};
        let academyUpgraded = i.academyUpgradedThisSeason || 0;
        let medicalUpgraded = i.medicalUpgradedThisSeason || 0;
        let updatedPipeline = i.youthPipeline || [];
        let successMessage = `${n === 'academy' ? 'Academy' : 'Medical Center'} upgraded! -${formatMoney(cost)} deducted.`;
        
        if (n === 'academy') {
            const newLvl = Math.min(5, (o.academyLevel || 1) + 1);
            o.academyLevel = newLvl;
            academyUpgraded += 1;

            // Existing enrolled prospects develop under the new state-of-the-art facility!
            // Their potential ceiling increases and developing prospects get an immediate +1 potential boost
            const tierCeiling = newLvl >= 4 ? 5 : newLvl >= 3 ? 4 : ((o.tier || 1) >= 4 ? 2 : (o.tier || 1) === 3 ? 3 : 5);
            const academyCeiling = Math.max(1, newLvl);
            const maxBoostAllowed = Math.min(academyCeiling, tierCeiling);
            
            updatedPipeline = (i.youthPipeline || []).map((p) => {
                if (p.isLoanedOut) return p;
                if ((p.boost || 1) < maxBoostAllowed) {
                    const newBoost = Math.min(maxBoostAllowed, (p.boost || 1) + 1);
                    const newType: 'local' | 'top_prospect' | 'generational' = newBoost >= 3 
                        ? (p.type === 'generational' ? 'generational' : 'top_prospect') 
                        : (p.type || 'local');
                    return {
                        ...p,
                        boost: newBoost,
                        type: newType,
                        tierType: newType
                    };
                }
                return p;
            });

            successMessage = `Youth Academy upgraded to Level ${newLvl}! Existing prospects received facility training upgrades (+1 OVR potential), and scouting network expanded to ${newLvl} missions/season. -${formatMoney(cost)} deducted.`;
        } else {
            const newMedLvl = Math.min(5, (o.medicalLevel || 1) + 1);
            o.medicalLevel = newMedLvl;
            medicalUpgraded += 1;
            const milestoneUnlockMsg =
                newMedLvl === 2
                    ? 'Unlocked In-House Rehab Suite (Free mid-season injury dilemma rehab & -50% crisis rehab cost)!'
                    : newMedLvl === 3
                    ? 'Unlocked Sports Science Lab (Permanent immunity from Dramatic Squad Decay & free 100% Star Injury recovery)!'
                    : newMedLvl === 4
                    ? 'Unlocked Cryo & Biomechanics Center (Caps annual retirements at max 1 player & retains 50% of Veteran Ringer OVR upon retirement)!'
                    : 'Unlocked Peak Performance Institute (+1.0 Matchday Conditioning OVR, -50% Generational Turnover Shield & permanent Dynasty Immunity)!';
            successMessage = `Medical Center upgraded to Level ${newMedLvl}! ${milestoneUnlockMsg} -${formatMoney(cost)} deducted.`;
        }
        
        return { 
            club: o, 
            worldClubs: {
                ...(i.worldClubs || {}),
                [o.id]: {
                    ...(i.worldClubs?.[o.id] || o),
                    academyLevel: o.academyLevel,
                    medicalLevel: o.medicalLevel
                },
                [String(o.id)]: {
                    ...(i.worldClubs?.[String(o.id)] || o),
                    academyLevel: o.academyLevel,
                    medicalLevel: o.medicalLevel
                }
            },
            budget: i.budget - cost,
            youthPipeline: updatedPipeline,
            infraActionsThisSeason: (i.infraActionsThisSeason || 0) + 1,
            academyUpgradedThisSeason: academyUpgraded,
            medicalUpgradedThisSeason: medicalUpgraded,
            notifications: [...(i.notifications||[]), { id: Math.random().toString(36).substring(7), type: 'success', message: successMessage, read: false }],
            facilitySpend: (i.facilitySpend || 0) + cost
        };
    }),
    logOvrChange: (change, reason, reasonDe) => set((state) => {
        if (change === 0) return {};
        const newLog = { id: Math.random().toString(36).substring(7), season: state.year, change, reason, reasonDe };
        return { ovrHistory: [newLog, ...(state.ovrHistory || [])].slice(0, 30) };
    }),
    takeClubLoan: (termYears: 10 | 15 | 25, customPrincipal?: number) => {
        const state = get();
        if (state.activeLoan && state.activeLoan.yearsRemaining > 0) {
            return { success: false, message: 'Your club already has an active bank loan. You cannot contract another loan until the current balance is fully retired.' };
        }

        const defaultPrincipal = getBaseLoanPrincipal(state.club.tier, state.club.country);
        const maxAllowed = defaultPrincipal * 3;
        const minAllowed = 10000;
        let principal = defaultPrincipal;
        if (typeof customPrincipal === 'number' && !isNaN(customPrincipal) && isFinite(customPrincipal) && customPrincipal > 0) {
            principal = Math.round(Math.min(maxAllowed, Math.max(minAllowed, customPrincipal)));
        } else if (customPrincipal !== undefined) {
            return { success: false, message: 'Invalid loan principal requested.' };
        }

        const newLoan = createClubLoan(principal, termYears, state.year);
        const newBudget = state.budget + principal;

        set({
            activeLoan: newLoan,
            budget: newBudget,
            seasonsInDebt: newBudget >= 0 ? 0 : state.seasonsInDebt,
            notifications: [
                {
                    id: Math.random().toString(),
                    type: 'success',
                    title: 'INSTITUTIONAL LOAN CONTRACTED',
                    message: `Commercial bank loan secured: +${formatMoney(principal)} deposited into treasury. Repayment: ${formatMoney(newLoan.annualPayment)}/season over ${termYears} years.`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        });

        return { success: true, message: `Loan approved! +${formatMoney(principal)} added to treasury.` };
    },
    repayClubLoanEarly: (customAmount?: number, mode: 'reduce_installment' | 'shorten_term' = 'reduce_installment') => {
        const state = get();
        if (!state.activeLoan) {
            return { success: false, message: 'No active bank loan found.' };
        }

        if (customAmount !== undefined && (typeof customAmount !== 'number' || isNaN(customAmount) || !isFinite(customAmount) || customAmount <= 0)) {
            return { success: false, message: 'Invalid payment amount specified.' };
        }
        
        const remainingBal = state.activeLoan.remainingBalance;
        const fullPayoffDiscounted = Math.round(remainingBal * 0.92);
        
        let payoffAmount = customAmount && customAmount > 0 
            ? Math.round(customAmount) 
            : fullPayoffDiscounted;

        if (state.budget < payoffAmount) {
            return { success: false, message: `Insufficient treasury. Payment requires ${formatMoney(payoffAmount)}.` };
        }

        if (payoffAmount <= 0) {
            return { success: false, message: 'Invalid payment amount.' };
        }

        const isFullPayoff = payoffAmount >= fullPayoffDiscounted;

        if (isFullPayoff) {
            const actualCashCharged = Math.min(payoffAmount, fullPayoffDiscounted);
            const interestSaved = remainingBal - actualCashCharged;
            set({
                budget: state.budget - actualCashCharged,
                activeLoan: null,
                seasonsInDebt: 0,
                notifications: [
                    {
                        id: Math.random().toString(),
                        type: 'celebration',
                        title: 'LOAN RETIRED EARLY & RESTRUCTURING EXITED',
                        message: `🏆 Outstanding bank loan fully repaid (-${formatMoney(actualCashCharged)}) with an 8% early settlement discount (+${formatMoney(interestSaved)} saved in unaccrued interest)! Zero debt remaining. All board transfer vetos, wage ceilings, and financial restructuring covenants are officially terminated!`,
                        read: false
                    },
                    ...(state.notifications || [])
                ]
            });
            return { success: true, message: `Bank loan fully retired (-${formatMoney(actualCashCharged)})! Saved ${formatMoney(interestSaved)} in unearned interest rebate. Restructuring covenants lifted.` };
        } else {
            const rebateBonus = Math.round(payoffAmount * 0.08);
            const effectiveDebtCleared = payoffAmount + rebateBonus;
            const newRemainingBalance = Math.max(0, remainingBal - effectiveDebtCleared);
            
            if (newRemainingBalance === 0) {
                set({
                    budget: state.budget - payoffAmount,
                    activeLoan: null,
                    seasonsInDebt: 0,
                    notifications: [
                        {
                            id: Math.random().toString(),
                            type: 'celebration',
                            title: 'LOAN RETIRED EARLY',
                            message: `🏆 Outstanding debt balance fully paid off with early rebate! Zero debt remaining.`,
                            read: false
                        },
                        ...(state.notifications || [])
                    ]
                });
                return { success: true, message: `Bank loan fully retired with rebate bonus! Zero debt remaining.` };
            }

            if (mode === 'shorten_term') {
                const currentAnnual = Math.max(1000, state.activeLoan.annualPayment);
                const oldYears = state.activeLoan.yearsRemaining;
                const newYears = Math.max(1, Math.ceil(newRemainingBalance / currentAnnual));
                const yearsSaved = Math.max(1, oldYears - newYears);
                const newAnnualPayment = Math.max(1000, Math.round(newRemainingBalance / newYears));
                const newMonthlyPayment = Math.round(newAnnualPayment / 12);

                set({
                    budget: state.budget - payoffAmount,
                    activeLoan: {
                        ...state.activeLoan,
                        remainingBalance: newRemainingBalance,
                        yearsRemaining: newYears,
                        annualPayment: newAnnualPayment,
                        monthlyPayment: newMonthlyPayment
                    },
                    notifications: [
                        {
                            id: Math.random().toString(),
                            type: 'info',
                            title: 'LOAN DURATION SHORTENED',
                            message: `Early loan payment applied (-${formatMoney(payoffAmount)} + ${formatMoney(rebateBonus)} rebate discount). Remaining debt reduced to ${formatMoney(newRemainingBalance)}. Loan duration shortened from ${oldYears} to ${newYears} years (${yearsSaved} years shaved off)!`,
                            read: false
                        },
                        ...(state.notifications || [])
                    ]
                });
                return { success: true, message: `Applied ${formatMoney(payoffAmount)} (+${formatMoney(rebateBonus)} early interest rebate)! Term shortened by ${yearsSaved} years (new duration: ${newYears} years).` };
            } else {
                const remainingYears = Math.max(1, state.activeLoan.yearsRemaining);
                const newAnnualPayment = Math.max(1000, Math.round(newRemainingBalance / remainingYears));

                set({
                    budget: state.budget - payoffAmount,
                    activeLoan: {
                        ...state.activeLoan,
                        remainingBalance: newRemainingBalance,
                        annualPayment: newAnnualPayment
                    },
                    notifications: [
                        {
                            id: Math.random().toString(),
                            type: 'info',
                            title: 'EARLY LOAN REPAYMENT',
                            message: `Early loan payment applied (-${formatMoney(payoffAmount)} + ${formatMoney(rebateBonus)} rebate discount). Remaining balance reduced to ${formatMoney(newRemainingBalance)}, lowering annual installment to -${formatMoney(newAnnualPayment)}/season.`,
                            read: false
                        },
                        ...(state.notifications || [])
                    ]
                });
                return { success: true, message: `Partial payment of ${formatMoney(payoffAmount)} applied (+${formatMoney(rebateBonus)} rebate)! New installment: -${formatMoney(newAnnualPayment)}/year.` };
            }
        }
    },
    terminateContractMutual: () => {
        const state = get();
        const currentSquadSize = state.club.squadSize || 18;
        if (currentSquadSize <= 13) {
            return { success: false, message: 'Cannot reduce squad below minimum size of 13 players.' };
        }
        
        // Scale OVR penalty with roster caliber to prevent "OVR Laundering" exploits
        const preservedLastOvr = typeof state.lastOvr === 'number' ? state.lastOvr : (state.club.baseOvr || 60);
        const loss = -Math.max(1, Math.floor((state.club.baseOvr || 60) / 35));
        const newOvr = Math.max(30, (state.club.baseOvr || 60) + loss);
        const actualChange = newOvr - (state.club.baseOvr || 60);

        let ovrHistory = state.ovrHistory || [];
        if (actualChange !== 0) {
            const newLog = {
                id: Math.random().toString(36).substring(7),
                season: state.year,
                change: actualChange,
                reason: 'Mutual Termination',
                reasonDe: 'Einvernehmliche Vertragsauflösung'
            };
            ovrHistory = [newLog, ...ovrHistory].slice(0, 30);
        }

        trackEvent('contract_terminated_mutual', {
            ovr_delta: actualChange,
            new_ovr: newOvr,
            squad_size: currentSquadSize - 1,
            club_name: state.club.name,
            club_tier: state.club.tier,
            season_year: state.year
        });

        set({
            lastOvr: preservedLastOvr,
            startOfSeasonOvr: typeof state.startOfSeasonOvr === 'number' ? state.startOfSeasonOvr : preservedLastOvr,
            club: {
                ...state.club,
                squadSize: currentSquadSize - 1,
                baseOvr: newOvr
            },
            worldClubs: {
                ...(state.worldClubs || {}),
                [state.club.id]: {
                    ...(state.worldClubs?.[state.club.id] || state.club),
                    squadSize: currentSquadSize - 1,
                    baseOvr: newOvr
                }
            },
            ovrHistory,
            squadSalesThisSeason: (state.squadSalesThisSeason || 0) + 1,
            notifications: [
                {
                    id: Math.random().toString(),
                    type: 'info',
                    title: 'MUTUAL CONTRACT TERMINATION',
                    message: `🤝 Mutual Termination Approved: Released player contract by mutual consent (${actualChange} OVR). Squad size reduced to ${currentSquadSize - 1}, relieving squad wage liability!`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        });

        return {
            success: true,
            message: `Mutual termination finalized! Released player contract (${actualChange} OVR).`
        };
    },
    applyPatronRescuePackage: () => {
        const state = get();
        if (state.budget >= 0) {
            return { success: false, amountCleared: 0, message: 'Your club is not in debt deficit.' };
        }
        if (state.lastPatronRescueYear && state.year - state.lastPatronRescueYear < 3) {
            const yearsWait = 3 - (state.year - state.lastPatronRescueYear);
            return { success: false, amountCleared: 0, message: `The Patron Council can only convene once every 3 years. Available in ${yearsWait} season(s).` };
        }

        const debt = Math.abs(state.budget);
        const amountCleared = Math.round(debt * 0.50); 
        const newBudget = state.budget + amountCleared;

        set({
            budget: newBudget,
            lastPatronRescueYear: state.year,
            seasonsInDebt: newBudget >= 0 ? 0 : state.seasonsInDebt,
            notifications: [
                {
                    id: Math.random().toString(),
                    type: 'celebration',
                    title: 'PATRON RESCUE PACKAGE APPROVED',
                    message: `🤝 Regional Patron & Sponsor Consortium: Local business council injected +${formatMoney(amountCleared)} to absorb 50% of legacy debt!`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        });

        return {
            success: true,
            amountCleared,
            message: `Emergency patron package approved! Local sponsors injected +${formatMoney(amountCleared)} to eliminate 50% of outstanding debt.`
        };
    },
    pullYouthPlayer: (prospectId?: string) => {
        const state = get();
        const pipeline = [...(state.youthPipeline || [])];

        if (pipeline.length === 0) {
            return {
                success: false,
                message: 'No players currently enrolled in the Youth Academy to promote. Scout or enroll prospects first.'
            };
        }

        if ((state.club.baseOvr || 60) >= 100) {
            return {
                success: false,
                message: 'Squad has reached the maximum rating of 100 OVR. A team can never exceed 100 OVR.'
            };
        }

        const prospectIndex = prospectId 
            ? pipeline.findIndex(p => p.id === prospectId)
            : pipeline.findIndex(p => !p.isLoanedOut);

        if (prospectIndex === -1) {
            return { success: false, message: 'Selected youth prospect not found or currently out on affiliate loan.' };
        }

        const candidate = pipeline[prospectIndex];
        if (candidate.isLoanedOut) {
            return { success: false, message: 'Prospect is currently out on affiliate loan until next season.' };
        }
        const isMature = (candidate.timer || 0) <= 0;

        if (!isMature) {
            const minAcademyLvl = getRequiredAcademyLevelForYouthPull(state.club.tier || 1);
            if ((state.club.academyLevel || 1) < minAcademyLvl) {
                return {
                    success: false,
                    message: `Tier ${state.club.tier} requires Academy Level ${minAcademyLvl}+ to promote developing youth prospects (Current: Level ${state.club.academyLevel || 1}). Upgrade your academy facility first or wait until graduation.`
                };
            }

            const maxYouthPulls = getMaxYouthPullsPerSeason(state.club.tier || 1, state.club.academyLevel || 1);
            const currentPulls = (state.youthPullsSeasonYear === state.year) ? (state.youthPullsThisSeason || 0) : 0;
            if (currentPulls >= maxYouthPulls) {
                return { 
                    success: false, 
                    message: state.club.tier === 1 
                      ? `Season limit reached: Maximum ${maxYouthPulls} youth promotion per season in Tier 1 (Academy Level 5 unlocks a 2nd promotion).` 
                      : `Season limit reached: Maximum ${maxYouthPulls} youth promotions per season.` 
                };
            }
        }

        const currentSquadSize = state.club.squadSize || 18;
        if (currentSquadSize >= 22) {
            return { success: false, message: 'Squad limit reached: Cannot exceed maximum roster size of 22 players.' };
        }

        const [promoted] = pipeline.splice(prospectIndex, 1);
        const prospectName = promoted.name;
        const rawBoost = promoted.boost || 1;

        const instantGain = rawBoost;
        const queuedGain = 0;

        let newOvr = Math.min(state.maxOvrCap || 100, Math.max(30, (state.club.baseOvr || 60) + instantGain));
        const actualChange = newOvr - (state.club.baseOvr || 60);

        let ovrHistory = state.ovrHistory || [];
        if (actualChange !== 0) {
            const labelEn = isMature ? `Academy Graduate (${prospectName})` : `Youth Promotion (${prospectName})`;
            const labelDe = isMature ? `Akademie-Absolvent (${prospectName})` : `Jugend-Beförderung (${prospectName})`;
            const newLog = {
                id: Math.random().toString(36).substring(7),
                season: state.year,
                change: actualChange,
                reason: labelEn,
                reasonDe: labelDe
            };
            ovrHistory = [newLog, ...ovrHistory].slice(0, 30);
        }
        const newMorale = Math.min(100, (state.club.morale ?? 75) + 2);

        const prevYouthPulls = (state.youthPullsSeasonYear === state.year) ? (state.youthPullsThisSeason || 0) : 0;
        const prevGraduates = (state as any).graduatedYouthsSeasonYear === state.year ? [...((state as any).graduatedYouthsThisSeason || [])] : [];
        prevGraduates.push(`${prospectName} (+${actualChange} OVR)`);

        const notifMsg = isMature
            ? `🎓 Academy Graduate Signed: ${prospectName} promoted to the senior squad (+${actualChange} OVR immediate boost)!`
            : `🌱 Youth Call-Up: ${prospectName} promoted to first team (+${actualChange} OVR immediate boost).`;

        set({
            youthPullsThisSeason: !isMature ? prevYouthPulls + 1 : prevYouthPulls,
            youthPullsSeasonYear: state.year,
            graduatedYouthsThisSeason: prevGraduates,
            graduatedYouthsSeasonYear: state.year,
            youthPipeline: pipeline,
            youthDevQueue: (state.youthDevQueue || 0) + queuedGain,
            lastOvr: typeof state.lastOvr === 'number' ? state.lastOvr : (state.club.baseOvr || 60),
            startOfSeasonOvr: typeof state.startOfSeasonOvr === 'number' ? state.startOfSeasonOvr : (state.club.baseOvr || 60),
            signingOvrGainThisSeason: ((state as any).signingOvrGainThisSeason || 0) + (actualChange > 0 ? actualChange : 0),
            signingFlopLossThisSeason: ((state as any).signingFlopLossThisSeason || 0) + (actualChange < 0 ? Math.abs(actualChange) : 0),
            club: {
                ...state.club,
                squadSize: currentSquadSize + 1,
                baseOvr: newOvr,
                morale: newMorale
            },
            worldClubs: {
                ...(state.worldClubs || {}),
                [state.club.id]: {
                    ...(state.worldClubs?.[state.club.id] || state.club),
                    squadSize: currentSquadSize + 1,
                    baseOvr: newOvr,
                    morale: newMorale
                }
            },
            ovrHistory,
            notifications: [
                {
                    id: Math.random().toString(),
                    type: isMature || actualChange > 0 ? 'success' : 'info',
                    title: isMature ? 'ACADEMY GRADUATE SIGNED' : 'YOUTH ACADEMY CALL-UP',
                    message: notifMsg,
                    read: false
                },
                ...(state.notifications || [])
            ]
        });

        return {
            success: true,
            prospectName,
            message: notifMsg
        };
    },
    loanYouthProspect: (prospectId: string) => {
        const state = get();
        const pipeline = state.youthPipeline || [];
        const prospect = pipeline.find(p => p.id === prospectId);
        if (!prospect) {
            return { success: false, message: 'Prospect not found in academy pipeline.' };
        }
        if (prospect.isLoanedOut) {
            return { success: false, message: 'Prospect is already out on affiliate loan.' };
        }
        if (prospect.loanBonusEarned) {
            return { success: false, message: 'Prospect has already completed an affiliate farm loan and cannot be loaned out again.' };
        }

        const updatedPipeline = pipeline.map(p => {
            if (p.id === prospectId) {
                return {
                    ...p,
                    isLoanedOut: true,
                    loanReturnSeason: state.year + 1,
                    boost: Math.min(5, (p.boost || 1) + 1)
                };
            }
            return p;
        });

        set({
            youthPipeline: updatedPipeline,
            notifications: [
                {
                    id: Math.random().toString(),
                    type: 'info',
                    title: 'FARM LOAN AGREEMENT',
                    message: `📋 Farm Loan: ${prospect.name} sent on affiliate loan for 1 season to gain regular match minutes (+1 OVR developmental bonus upon return).`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        });

        return {
            success: true,
            prospectName: prospect.name,
            message: `${prospect.name} sent on affiliate loan (+1 OVR developmental bonus upon return next season)!`
        };
    },
    sellYouthProspect: (prospectId: string) => {
        const state = get();
        const pipeline = state.youthPipeline || [];
        const prospect = pipeline.find(p => p.id === prospectId);
        if (!prospect) {
            return { success: false, fee: 0, message: 'Prospect not found in academy pipeline.' };
        }
        if (prospect.isLoanedOut) {
            return { success: false, fee: 0, message: 'Prospect is currently out on affiliate loan until next season.' };
        }

        const cleanCountry = (state.club.country || 'GER').trim().toUpperCase();
        const isExportPowerhouse = ['ARG', 'BRA', 'COL', 'URU', 'CHI', 'ECU'].includes(cleanCountry);
        const isMature = (prospect.timer || 0) <= 0;
        const tier = state.club.tier || 1;
        const academyLvl = state.club.academyLevel || 1;
        const maxSales = isExportPowerhouse
            ? 4
            : (tier >= 4
                ? (academyLvl >= 2 ? 1 : 0)
                : (academyLvl >= 4 ? 2 : 1));
        const salesThisSeason = (state.youthSalesSeasonYear === state.year) ? (state.youthSalesThisSeason || 0) : 0;

        if (!isMature) {
            if (!isExportPowerhouse) {
                if (maxSales === 0) {
                    return {
                        success: false,
                        fee: 0,
                        message: 'Amateur club restriction: Level 1 academies in lower tiers cannot sell youth players for transfer fees. Upgrade facility to Level 2 first or await graduation.'
                    };
                }

                if (salesThisSeason >= maxSales) {
                    return {
                        success: false,
                        fee: 0,
                        message: `Season limit reached: Maximum ${maxSales} academy talent sale${maxSales > 1 ? 's' : ''} permitted per season.`
                    };
                }
            } else {
                if (salesThisSeason >= maxSales) {
                    return {
                        success: false,
                        fee: 0,
                        message: `Export quota reached: Maximum ${maxSales} academy talent sales permitted per season.`
                    };
                }

                if (prospect.enrolledYear === state.year || !prospect.enrolledYear) {
                    return {
                        success: false,
                        fee: 0,
                        message: 'Development required: Newly recruited prospects must train in your academy for at least one season before European clubs negotiate transfer fees.'
                    };
                }
            }
        }

        if (prospect.isTrialist && (prospect.enrolledYear === state.year || !prospect.enrolledYear) && !isMature) {
            return {
                success: false,
                fee: 0,
                message: 'Training solidarity rules: Free school trialists must train in your academy for at least one full season before being eligible for transfer fees.'
            };
        }

        const boostVal = prospect.boost || 1;

        let fee = 0;
        let buyer = '';

        if (isExportPowerhouse) {
            if (prospect.type === 'generational' || boostVal >= 3) {
                fee = 1800000 + (boostVal >= 3 ? 400000 : 0);
            } else if (prospect.type === 'top_prospect' || boostVal >= 2) {
                fee = 600000 + boostVal * 150000;
            } else {
                fee = 150000 + boostVal * 50000;
            }
            const euroGiants = ['FC Barcelona', 'Paris Saint-Germain', 'THW Kiel', 'SC Magdeburg', 'Telekom Veszprém', 'Industria Kielce', 'Aalborg Håndbold', 'Füchse Berlin'];
            buyer = euroGiants[Math.floor(Math.random() * euroGiants.length)];
        } else {
            const effBoost = Math.min(3, Math.max(1, boostVal));
            const tier1BaseFee: Record<number, number> = {
                1: 75000,
                2: 220000,
                3: 650000
            };
            const rawBase = tier1BaseFee[effBoost] || 75000;
            fee = Math.round(getLeagueScaledVal(tier, rawBase, cleanCountry));
            if (prospect.type === 'generational') fee = Math.round(fee * 1.25);
            else if (prospect.type === 'top_prospect') fee = Math.round(fee * 1.15);

            const buyerClubsByTier: Record<number, string[]> = {
                1: ['THW Kiel', 'SC Magdeburg', 'SG Flensburg-Handewitt', 'Füchse Berlin', 'FC Barcelona', 'Telekom Veszprém', 'Industria Kielce', 'Paris Saint-Germain', 'Aalborg Håndbold'],
                2: ['VfL Potsdam', 'TuS N-Lübbecke', 'HBW Balingen', 'Eintracht Hagen', 'Billère Handball', 'Dijon Métropole', 'BM Guadalajara'],
                3: ['HC Empor Rostock', 'EHV Aue', 'HSG Krefeld', 'TuS Ferndorf', 'MTV Braunschweig', 'Sélestat Alsace'],
                4: ['Regional Academy League', 'Upper Tier Scout Pool', 'State Handball Federation Center', 'Youth Olympic Training Hub']
            };
            const buyerList = buyerClubsByTier[Math.min(4, tier)] || buyerClubsByTier[4];
            buyer = buyerList[Math.floor(Math.random() * buyerList.length)];
        }

        const newPipeline = pipeline.filter(p => p.id !== prospectId);
        const newBudget = state.budget + fee;
        const newSalesCount = !isMature ? salesThisSeason + 1 : salesThisSeason;

        set({
            budget: newBudget,
            youthPipeline: newPipeline,
            youthSalesThisSeason: newSalesCount,
            youthSalesSeasonYear: state.year,
            notifications: [
                {
                    id: Math.random().toString(36).substring(7),
                    type: 'celebration',
                    title: 'ACADEMY TRANSFER COMPLETED',
                    message: `🤝 Sold academy talent ${prospect.name} (${prospect.position || 'Talent'}, ${prospect.age} yrs, +${prospect.boost} OVR) to ${buyer} for +${formatMoney(fee)}!${!isMature ? ` (Sales this season: ${newSalesCount}/${maxSales})` : ' (Graduate sale: quota-exempt)'}`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        });

        return {
            success: true,
            fee,
            message: `Sold ${prospect.name} to ${buyer} for +${formatMoney(fee)}!`
        };
    },
    executeGenerationalRebuild: () => {
        const state = get();
        const club = { ...state.club };
        const currentOvr = club.baseOvr || 70;
        const squadSize = club.squadSize || 18;

        if (currentOvr < 82) {
            return { success: false, message: 'Your squad has not reached peak veteran maturity (requires at least 82 OVR).' };
        }
        if (squadSize < 15) {
            return { success: false, message: 'Squad roster too thin to liquidate veteran core (minimum 15 players required).' };
        }
        if (state.year - (state.lastGenerationalRebuildYear || 0) < 5) {
            return { success: false, message: 'A generational rebuild requires at least 5 seasons between overhauls.' };
        }

        const veteransSold = Math.min(3, Math.max(2, squadSize - 13));
        const cMult = getCountryMult(club.country || 'GER');
        const windfall = Math.round(veteransSold * (currentOvr * 32000) * cMult);
        const ovrDrop = Math.min(6, veteransSold * 2);
        const newOvr = Math.max(60, currentOvr - ovrDrop);
        const newSquadSize = Math.max(13, squadSize - veteransSold);

        // Recruit 2 top-tier next-gen wonderkids for the new generation
        const lvl = club.academyLevel || 1;
        const cty = club.country || 'GER';
        const tr = club.tier || 1;
        const opt = {
            headCoachArchetype: state.headCoachArchetype || state.tactic,
            directorArchetype: state.directorArchetype,
            managerSkills: state.managerSkills,
            clubVision: state.clubVision
        };
        const p1 = generateYouthProspect(lvl, cty, tr, opt);
        const p2 = generateYouthProspect(lvl, cty, tr, opt);
        p1.boost = Math.max(2, p1.boost);
        p2.boost = Math.max(2, p2.boost);
        p1.timer = Math.min(2, p1.timer);
        p2.timer = Math.min(2, p2.timer);
        p1.enrolledYear = state.year;
        p2.enrolledYear = state.year;
        if (p1.boost >= 2 && p1.type === 'local') {
            p1.type = 'top_prospect';
            p1.tierType = 'top_prospect';
        }
        if (p2.boost >= 2 && p2.type === 'local') {
            p2.type = 'top_prospect';
            p2.tierType = 'top_prospect';
        }

        const slotLimit = getAcademySlotLimit(club.academyLevel || 1);
        const loanedOutProspects = (state.youthPipeline || []).filter(p => p.isLoanedOut);
        const sortedActive = (state.youthPipeline || []).filter(p => !p.isLoanedOut).sort((a, b) => {
            if ((a.timer || 0) !== (b.timer || 0)) return (a.timer || 0) - (b.timer || 0);
            return (b.boost || 1) - (a.boost || 1);
        });
        const newPipeline = [...loanedOutProspects, ...sortedActive.slice(0, Math.max(0, slotLimit - 2)), p1, p2];

        club.baseOvr = newOvr;
        club.squadSize = newSquadSize;

        const newLog = {
            id: Math.random().toString(36).substring(7),
            season: state.year,
            change: -ovrDrop,
            reason: `Generational Transition (-${ovrDrop} OVR, +${formatMoney(windfall)} fees)`,
            reasonDe: `Generationswechsel (-${ovrDrop} GES, +${formatMoney(windfall)} Ablösen)`
        };

        set({
            club,
            worldClubs: {
                ...(state.worldClubs || {}),
                [club.id]: {
                    ...(state.worldClubs?.[club.id] || club),
                    baseOvr: newOvr,
                    squadSize: newSquadSize
                }
            },
            lastOvr: typeof state.lastOvr === 'number' ? state.lastOvr : currentOvr,
            startOfSeasonOvr: typeof state.startOfSeasonOvr === 'number' ? state.startOfSeasonOvr : currentOvr,
            squadSalesThisSeason: (state.squadSalesThisSeason || 0) + veteransSold,
            budget: state.budget + windfall,
            youthPipeline: newPipeline,
            lastGenerationalTurnoverYear: state.year,
            lastGenerationalRebuildYear: state.year,
            rebuildImmunity: true,
            rebuildWageDiscountSeasons: 3,
            rebuildYouthAccelSeasons: 2,
            ovrHistory: [newLog, ...(state.ovrHistory || [])].slice(0, 30),
            notifications: [
                {
                    id: Math.random().toString(),
                    type: 'success',
                    title: 'GENERATIONAL SQUAD REBUILD EXECUTED',
                    message: `🏆 Generational Transition: Liquidated ${veteransSold} aging superstar veterans at peak valuation (+${formatMoney(windfall)}). Slashed squad wage bill by 25% for 3 seasons and enrolled 2 next-gen wonderkids into the incubator (-${ovrDrop} OVR intentional transition dip).`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        });

        return { success: true, message: `Generational Rebuild complete: +${formatMoney(windfall)} transfer windfall secured!`, windfall, ovrDrop };
    },
    setHeadCoachArchetype: (archetype) => set((state) => {
        if ((state.headCoachArchetype || 'Standard') === archetype) return state;
        const descriptions: Record<string, string> = {
            'Continental Legend': 'Maximizes matchday win variance in European knockout ties.',
            'Youth Developer': 'Accelerates youth prospect timer maturation and talent readiness.',
            'Scout': 'Sharpens eye for wonderkids and lowers generational recruitment threshold.',
            'Tactician': 'Strengthens defensive positioning and counter-attack solidity.',
            'Motivator': 'Sustains locker room morale floor during adversity.',
            'Standard': 'Balanced tactical leadership.'
        };
        const isSwitching = Boolean(state.headCoachArchetype && state.headCoachArchetype !== 'Standard' && state.headCoachArchetype !== archetype);
        const restructuringCost = isSwitching ? Math.round(getLeagueScaledVal(state.club?.tier || 1, 80000, state.club?.country || 'GER')) : 0;
        const creditLimit = getCreditLimit(state.club?.tier || 1, state.club?.country || 'GER');
        if (restructuringCost > 0 && state.budget + creditLimit < restructuringCost) {
            return {
                notifications: [
                    {
                        id: Math.random().toString(),
                        type: 'error',
                        title: 'INSUFFICIENT FUNDS FOR STAFF BUYOUT',
                        message: `Cannot afford coaching staff buyout fee (${formatMoney(restructuringCost)}).`,
                        read: false
                    },
                    ...(state.notifications || [])
                ]
            };
        }
        const newBudget = restructuringCost > 0 ? (state.budget - restructuringCost) : state.budget;
        return {
            headCoachArchetype: archetype,
            budget: newBudget,
            notifications: [
                {
                    id: Math.random().toString(),
                    type: 'info',
                    title: 'HEAD COACH PHILOSOPHY PIVOT',
                    message: `👔 Leadership Pivot: Appointed ${archetype} coaching philosophy.${restructuringCost > 0 ? ` Coaching staff buyout fee: -${formatMoney(restructuringCost)}.` : ''} ${descriptions[archetype] || ''}`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        };
    }),
    setDirectorArchetype: (archetype) => set((state) => {
        if ((state.directorArchetype || 'Standard') === archetype) return state;
        if (state.lastDirectorChangeYear === state.year && state.directorArchetype && state.directorArchetype !== archetype) {
            return {
                notifications: [
                    {
                        id: Math.random().toString(),
                        type: 'warning',
                        title: 'DIRECTOR TENURE LOCKED',
                        message: `🔒 Contractual Mandate: The Director of Handball position has already been reorganized for the ${state.year} season. Board policy requires at least 1 full season tenure before another front office restructuring.`,
                        read: false
                    },
                    ...(state.notifications || [])
                ]
            };
        }
        const descriptions: Record<string, string> = {
            'Scout / Youth Developer': 'Reduces wonderkid threshold from 80 to 70 for elite generational talents.',
            'Financial Mogul': 'Commercial negotiation master — maximizes corporate sponsorships.',
            'Brand Ambassador': 'Expands spectator catchment and home ticket demand.',
            'Standard': 'Balanced administrative direction.'
        };
        const isSwitching = Boolean(state.directorArchetype && state.directorArchetype !== 'Standard' && state.directorArchetype !== archetype);
        const restructuringCost = isSwitching ? Math.round(getLeagueScaledVal(state.club?.tier || 1, 100000, state.club?.country || 'GER')) : 0;
        const creditLimit = getCreditLimit(state.club?.tier || 1, state.club?.country || 'GER');
        if (restructuringCost > 0 && state.budget + creditLimit < restructuringCost) {
            return {
                notifications: [
                    {
                        id: Math.random().toString(),
                        type: 'error',
                        title: 'INSUFFICIENT FUNDS FOR DIRECTOR BUYOUT',
                        message: `Cannot afford front office restructuring fee (${formatMoney(restructuringCost)}).`,
                        read: false
                    },
                    ...(state.notifications || [])
                ]
            };
        }
        const newBudget = restructuringCost > 0 ? (state.budget - restructuringCost) : state.budget;
        return {
            directorArchetype: archetype,
            lastDirectorChangeYear: state.year,
            budget: newBudget,
            notifications: [
                {
                    id: Math.random().toString(),
                    type: 'info',
                    title: 'DIRECTOR OF HANDBALL PIVOT',
                    message: `🏛️ Front Office Pivot: Appointed ${archetype} as Director of Handball.${restructuringCost > 0 ? ` Contract buyout & restructuring fee: -${formatMoney(restructuringCost)}.` : ''} ${descriptions[archetype] || ''}`,
                    read: false
                },
                ...(state.notifications || [])
            ]
        };
    }),
    setClubVision: (vision) => set((state) => {
        const cost = 2; // Costs 2 Director Points
        if ((state.skillPoints || 0) < cost) {
            return { notifications: [...(state.notifications || []), { id: Math.random().toString(), type: 'error', message: `Requires ${cost} DP to restructure club vision.`, read: false }] };
        }
        return {
            clubVision: vision,
            skillPoints: (state.skillPoints || 0) - cost,
            notifications: [...(state.notifications || []), { id: Math.random().toString(), type: 'info', title: 'CLUB VISION UPDATED', message: `Club board identity restructured to: ${vision}.`, read: false }]
        };
    })
}), {
    name: 'handball-manager-storage',
    version: 5,
    migrate: (persistedState: any, version: number) => {
        if (!persistedState || typeof persistedState !== 'object') {
            return initialState;
        }
        return persistedState;
    },
    merge: (persistedState: any, currentState: any) => {
        if (!persistedState || typeof persistedState !== 'object') {
            return currentState;
        }
        const merged = { ...currentState, ...persistedState };
        // Guard against missing or corrupted club object
        if (!merged.club || typeof merged.club !== 'object' || !merged.club.name) {
            merged.club = currentState.club || defaultFallbackClub;
        }
        // Guard arrays
        if (!Array.isArray(merged.history)) merged.history = [];
        if (!Array.isArray(merged.youthPipeline)) merged.youthPipeline = [];
        if (!Array.isArray(merged.trophies)) merged.trophies = [];
        if (!Array.isArray(merged.notifications)) merged.notifications = [];
        // Sanitize pendingSeasonState if corrupted
        if (merged.pendingSeasonState && (typeof merged.pendingSeasonState !== 'object' || typeof merged.pendingSeasonState.pts !== 'number')) {
            merged.pendingSeasonState = null;
        }
        return merged;
    },
    onRehydrateStorage: () => (state) => {
        if (state) {
            let hasValidPostSeasonCheckpoint = false;
            try {
                if (typeof localStorage !== 'undefined') {
                    const rawCp = localStorage.getItem(POSTSEASON_CHECKPOINT_KEY);
                    if (rawCp) {
                        const parsedCp = JSON.parse(rawCp);
                        if (parsedCp && parsedCp.careerId === state.careerId && parsedCp.year === state.year) {
                            hasValidPostSeasonCheckpoint = true;
                        }
                    }
                }
            } catch {
                hasValidPostSeasonCheckpoint = false;
            }

            if (hasValidPostSeasonCheckpoint) {
                state.postSeasonPending = true;
            } else {
                if (state.postSeasonPending && state.club && Array.isArray(state.history) && state.history.length > 0) {
                    // Fallback safety reconciliation if post-season was interrupted without a checkpoint
                    const lastHist = state.history[state.history.length - 1];
                    state.startOfSeasonOvr = state.club.baseOvr;
                    if (state.boardRoadmap && state.boardRoadmap.goals) {
                        const evalFallback = evaluateRoadmapProgress(
                            state.boardRoadmap,
                            { ...state.club, currentBudget: state.budget },
                            lastHist.year ?? (state.year - 1),
                            { pos: lastHist.pos || 1, pts: lastHist.pts || 0 },
                            state.history,
                            lastHist.trophiesThisYear || {}
                        );
                        if (evalFallback.earnedMp > 0 || (evalFallback.earnedCash || 0) > 0) {
                            state.skillPoints = (state.skillPoints || 0) + evalFallback.earnedMp;
                            state.budget = (state.budget || 0) + (evalFallback.earnedCash || 0);
                            state.club.currentBudget = state.budget;
                        }
                        state.boardRoadmap = evalFallback.roadmapFinished
                            ? generateBoardRoadmap({ ...state.club, currentBudget: state.budget }, state.year, state.history)
                            : evalFallback.updatedRoadmap;
                    }
                }
                state.postSeasonPending = false;
                if (state.activeCupTournament && state.activeCupTournament.year !== state.year) {
                    state.activeCupTournament = undefined;
                    state.cupQualifiedForSf = null;
                }
                if (state.activeEuroTournament && state.activeEuroTournament.year !== state.year) {
                    state.activeEuroTournament = undefined;
                    state.euroQualifiedForSf = null;
                }
            }

            if (!state.club || typeof state.club !== 'object' || !state.club.name) {
                state.club = defaultFallbackClub;
            }
            if (state.lang !== 'en') {
                state.lang = 'en';
            }
            if (Array.isArray(state.notifications)) {
                state.notifications = state.notifications.map((n: any) => {
                    if (n && typeof n.message === 'string' && n.message.includes('Wall Street & Börse Update:')) {
                        return {
                            ...n,
                            message: n.message.replace('Wall Street & Börse Update:', 'Capital Markets & Stock Exchange Update:')
                        };
                    }
                    return n;
                });
            }
            if (state.club) {
                const isGermanText = (txt?: string) => txt && /(Erstligist|Zweitligist|Drittligist|Regionalligist|Traditionsverein|Nachwuchsmannschaft|fuer die Profis|kaempft|Aufstieg|Oberhaus|Jugendarbeit|Anhaengerschaft|ehrenamtlich|Stufe|Verein|Plaetze|Halle)/i.test(txt);
                if (isGermanText(state.club.historicContext) || isGermanText(state.club.context)) {
                    const clean = getClubHistoricContext(state.club.name, state.club.tier, false, state.club.country || 'GER', state.club);
                    state.club.historicContext = clean;
                    state.club.context = clean;
                }

                if (typeof state.lastOvr !== 'number' && typeof state.club.baseOvr === 'number') {
                    state.lastOvr = state.club.baseOvr;
                }
            }
            if (state.history && Array.isArray(state.history)) {
                state.history.forEach((h: any) => {
                    const stad = h.stadium || (h.clubName === state.club?.name ? state.club?.stadium : 0) || 0;
                    const fans = (h.clubName === state.club?.name ? state.club?.fanBase : 0) || 0;
                    if (stad >= 15000 && fans >= 60000 && (h.att === 7500 || h.att === 14000 || (h.att && h.att <= 8000))) {
                        const demand = Math.round(fans * 0.16 * 1.15);
                        const fixedAtt = Math.min(stad, Math.max(Math.round(stad * 0.92), demand));
                        h.att = formatOrganicAttendance(fixedAtt, stad, h.year || 2024);
                        h.util = Math.min(100, Math.round((h.att / stad) * 100));
                    } else if (h.att && stad > 0 && h.att < stad && (h.att % 10 === 0 || h.att === 800 || h.att === 900)) {
                        h.att = formatOrganicAttendance(h.att, stad, (h.year || 2024) + (state.club?.id || 1));
                        h.util = Math.min(100, Math.round((h.att / stad) * 100));
                    }
                });
                state.history = pruneCareerHistoryForStorage(state.history);
            }
            if (Array.isArray(state.ovrHistory) && state.ovrHistory.length > 50) {
                state.ovrHistory = state.ovrHistory.slice(0, 50);
            }
            if (Array.isArray(state.universeMovements) && state.universeMovements.length > 250) {
                state.universeMovements = state.universeMovements.slice(0, 250);
            }
            if (Array.isArray(state.cupRunResults)) {
                state.cupRunResults = state.cupRunResults.filter((r: any) => r && (r.won || r.year >= (state.year || 2024) - 2));
            }
            if (state.worldClubs && typeof state.worldClubs === 'object') {
                const userClubIdStr = String(state.club?.id ?? '');
                Object.keys(state.worldClubs).forEach((k) => {
                    if (k !== userClubIdStr && state.worldClubs[k]) {
                        delete (state.worldClubs[k] as any).historicContext;
                        delete (state.worldClubs[k] as any).context;
                    }
                });
            }
            const rehydratedScore = calculateLiveScore(state);
            state.careerScore = rehydratedScore;
            state.score = rehydratedScore;

            if (state.youthPipeline && Array.isArray(state.youthPipeline)) {
                const tier = state.club?.tier || 1;
                const academyLvl = state.club?.academyLevel || 1;
                // Premier academies (Lvl 3-5) can nurture >2 OVR talents regardless of lower league tier,
                // and prospects can legitimately roll up to +3 (generational) or reach up to +5 via farm loans.
                const tierCeiling = academyLvl >= 4 ? 5 : academyLvl >= 3 ? 4 : (tier >= 4 ? 3 : tier === 3 ? 3 : 5);
                const academyCeiling = Math.max(3, academyLvl);
                state.youthPipeline.forEach((p: any) => {
                    const maxCap = (p.isLoanedOut || p.loanBonusEarned) ? 5 : Math.max(3, Math.min(academyCeiling, tierCeiling));
                    p.boost = Math.max(1, Math.min(p.boost || 1, maxCap));
                });
            }
            if (typeof state.youthSalesSeasonYear !== 'number') {
                state.youthSalesSeasonYear = state.year || 2024;
            }
            if (typeof state.youthSalesThisSeason !== 'number') {
                state.youthSalesThisSeason = 0;
            }
            if (typeof state.youthScoutsThisSeason !== 'number') {
                state.youthScoutsThisSeason = 0;
            }
        }
    }
}));

export const useHasHydrated = () => {
    const [hasHydrated, setHasHydrated] = useState(() => {
        if (typeof window === 'undefined') return true;
        try {
            return Boolean(localStorage.getItem('handball-manager-storage'));
        } catch {
            return true;
        }
    });

    useEffect(() => {
        const unsub = (useGameStore as any).persist?.onFinishHydration?.(() => {
            setHasHydrated(true);
        });
        setHasHydrated(true);
        return () => unsub?.();
    }, []);

    return hasHydrated;
};

useGameStore.subscribe((state) => {
    if (state.club?.country) {
        setActiveCountryCode(state.club.country);
    }
});

if (typeof window !== 'undefined') {
    try {
        const initialClub = useGameStore.getState().club;
        if (initialClub?.country) {
            setActiveCountryCode(initialClub.country);
        }
    } catch {
        // ignore during ssr/pre-hydration
    }
}