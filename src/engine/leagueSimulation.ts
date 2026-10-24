import { Club, UniverseMovement, ResolvedMatchContext } from '../types';
import { getMaxTier, isReserveClub, normalizeCountry, getFAInfo } from '../data/gameConstants';
import { getLeagueSize } from './engine';
import { processAging } from './engine';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, mergeClubWithWorldState } from '../utils/modManager';

export interface LeagueSimulationResult {
    newWorldClubs: Record<string, Club>;
    movements: UniverseMovement[];
    insolventClubs?: { clubId: string; clubName: string; tier: number; country: string }[];
}

export function simulateGlobalLeagues(
    worldClubsMap: Record<string, Club>,
    userClub: Club,
    playedTier: number,
    currentYear: number = 2024,
    userPos?: number,
    userTrophiesThisYear?: any,
    userFinalTable?: any[],
    divisionTables?: Record<number, any[]>,
    resolvedMatchContext?: ResolvedMatchContext,
    cupRunResults?: any[],
    userConsecutiveTitles?: number,
    playoffOverride?: { oldTier: number; newTier: number; userWon: boolean; active?: boolean }
): LeagueSimulationResult {
    
    // Convert to array of full club data using active database with world state overlay
    const baseList = getActiveClubs(userClub?.country);
    const allClubs = baseList.map(c => mergeClubWithWorldState(c, worldClubsMap[c.id]));
    
    // 1. Process Aging & OVR fluctuations (pass userClub.id so user club has zero artificial CPU floors)
    const agedClubs = processAging(allClubs, userClub.id, {
        userClubId: userClub.id,
        userClubOvr: userClub.baseOvr,
        userTier: playedTier,
        userCountry: normalizeCountry(userClub.country || 'GER'),
        userWonLeague: userPos === 1,
        consecutiveTitles: userConsecutiveTitles,
        currentYear
    });

    // Rehabilitate clubs that finished their financial restructuring from previous seasons
    // (Insolvency demotion applies for the season it occurred; afterwards clubs recover and can fight back)
    agedClubs.forEach(c => {
        if (c.isInsolventGiant) {
            c.isInsolventGiant = false;
        }
    });

    // Track initial and upcoming tier changes to avoid cascading relegations/promotions in a single loop
    const startingTiers = new Map<number | string, number>();
    const nextTiers = new Map<number | string, number>();
    agedClubs.forEach(c => {
        startingTiers.set(c.id, c.tier);
        nextTiers.set(c.id, c.tier);
    });

    const movements: UniverseMovement[] = [];
    const insolventClubs: { clubId: string; clubName: string; tier: number; country: string }[] = [];

    // Record any Hostile Rival Takeovers & Arms Race surges
    const activeNemeses = agedClubs.filter(c => Boolean(c.isNemesisActive) && !worldClubsMap[c.id]?.isNemesisActive && normalizeCountry(c.country || 'GER') === normalizeCountry(userClub.country || 'GER'));
    activeNemeses.forEach(activeNemesis => {
        movements.push({
            id: `${activeNemesis.id}-${currentYear}-takeover`,
            year: currentYear,
            clubId: String(activeNemesis.id),
            clubName: activeNemesis.name,
            clubLogo: activeNemesis.logo,
            clubColor: activeNemesis.color,
            country: normalizeCountry(activeNemesis.country || userClub.country || 'GER'),
            type: 'takeover' as any,
            fromTier: activeNemesis.tier,
            toTier: activeNemesis.tier,
            isKey: true
        });
    });

    // 2. Financial Distress & Restructuring / Insolvency (Handball Parity)
    // Rate tuned strictly to: rare, 1-2 clubs max per every 2-3 seasons
    // Probability per season: 60% chance 0 insolvencies, 30% chance 1 insolvency, 10% chance 2 insolvencies (strictly max 2)
    const insolvencyRoll = Math.random();
    const insolvencyQuota = insolvencyRoll < 0.60 ? 0 : insolvencyRoll < 0.90 ? 1 : 2;
    const selectedForInsolvency: Club[] = [];

    if (insolvencyQuota > 0) {
        const userNormCountry = normalizeCountry(userClub.country || 'GER');
        // Vulnerable candidate clubs: Domestic top 3 division clubs with heavy wage burdens in user's country
        const candidates = agedClubs.filter(c => {
            if (c.id === userClub.id) return false;
            if (isReserveClub(c.name)) return false;
            const normCountry = normalizeCountry(c.country || 'GER');
            if (normCountry !== userNormCountry) return false; // Strictly restrict to active domestic ecosystem!
            const maxT = getMaxTier(normCountry);
            if (c.tier >= maxT) return false;
            if (c.tier > 3) return false;
            const isHeritage = (c.fanBase && c.fanBase > 200000) || [
                'SC Magdeburg', 'THW Kiel', 'SG Flensburg-Handewitt', 'Füchse Berlin',
                'Paris Saint-Germain', 'Barça', 'Telekom Veszprém', 'Industria Kielce', 'Aalborg Håndbold'
            ].includes(c.name);
            if (isHeritage) return false;

            // Do not select clubs already facing sporting relegation or having earned promotion in the final division tables
            const isSportingRelegated = (userFinalTable && userFinalTable.some((r: any) => (String(r.id) === String(c.id) || r.name === c.name) && (r.statusMarker === 'R' || r.pos >= userFinalTable.length - 1)))
                || (divisionTables && divisionTables[c.tier] && divisionTables[c.tier].some((r: any) => (String(r.id) === String(c.id) || r.name === c.name) && (r.statusMarker === 'R' || r.pos >= divisionTables[c.tier].length - 1)));
            if (isSportingRelegated) return false;

            const isSportingPromoted = (userFinalTable && userFinalTable.some((r: any) => (String(r.id) === String(c.id) || r.name === c.name) && (r.statusMarker === 'C' || r.statusMarker === 'P' || (r.pos && r.pos <= 2))))
                || (divisionTables && divisionTables[c.tier] && divisionTables[c.tier].some((r: any) => (String(r.id) === String(c.id) || r.name === c.name) && (r.statusMarker === 'C' || r.statusMarker === 'P' || (r.pos && r.pos <= 2))));
            if (isSportingPromoted) return false;

            // Do not select clubs in a tier with an already-resolved cross-tier playoff decider
            if (resolvedMatchContext?.playoffDecider) {
                const pd = resolvedMatchContext.playoffDecider;
                if (c.tier === pd.upperTier ||
                    String(c.id) === String(pd.winnerId) || String(c.id) === String(pd.loserId) ||
                    (pd.winnerName && c.name.trim().toLowerCase() === pd.winnerName.trim().toLowerCase()) ||
                    (pd.loserName && c.name.trim().toLowerCase() === pd.loserName.trim().toLowerCase())) {
                    return false;
                }
            }

            return c.baseOvr >= 58;
        });

        // Randomly pick up to insolvencyQuota
        candidates.sort(() => 0.5 - Math.random());
        selectedForInsolvency.push(...candidates.slice(0, insolvencyQuota));

        selectedForInsolvency.forEach(c => {
            const normCountry = normalizeCountry(c.country || 'GER');
            const maxT = getMaxTier(normCountry);
            // Administrative demotion: 1 or 2 tiers down (licensing withdrawal)
            const dropAmount = (c.tier + 2 <= maxT && Math.random() < 0.4) ? 2 : 1;
            const resetTier = Math.min(maxT, c.tier + dropAmount);
            nextTiers.set(c.id, resetTier);

            // Liquidation / Firesale: Shed 8-12 OVR
            const ovrDrop = Math.floor(Math.random() * 5) + 8;
            c.baseOvr = Math.max(38, c.baseOvr - ovrDrop);
            c.isInsolventGiant = true;

            // Macro-economic talent reallocation: Top tier liquid buyers absorb key players
            const liquidBuyers = agedClubs.filter(b => b.tier === 1 && b.id !== c.id && normalizeCountry(b.country || 'GER') === normCountry && b.baseOvr >= 68);
            if (liquidBuyers.length > 0) {
                const buyer = liquidBuyers[Math.floor(Math.random() * liquidBuyers.length)];
                buyer.baseOvr = Math.min(95, buyer.baseOvr + 1);
            }

            movements.push({
                id: `${c.id}-${currentYear}-insolvency`,
                year: currentYear,
                clubId: String(c.id),
                clubName: c.name,
                clubLogo: c.logo,
                clubColor: c.color,
                country: normCountry,
                type: 'insolvency_relegation',
                fromTier: c.tier,
                toTier: resetTier,
                isKey: true,
            });

            insolventClubs.push({
                clubId: String(c.id),
                clubName: c.name,
                tier: resetTier,
                country: normCountry
            });
        });
    }

    // Minor consolidation for other distressed clubs without forced relegation (Patron Council rescue)
    agedClubs.forEach(c => {
        if (c.id === userClub.id || nextTiers.get(c.id) !== c.tier) return;
        const isHeritage = (c.fanBase && c.fanBase > 20000) || c.baseOvr >= 85;
        if (Math.random() < 0.02 && c.baseOvr > 68 && !isHeritage && !isReserveClub(c.name)) {
            // Regional Patron Council absorbs deficit: slight temporary consolidation (-1 to -3 OVR)
            c.baseOvr = Math.max(45, c.baseOvr - (Math.floor(Math.random() * 3) + 1));
        }
    });

    // Determine working sizes after insolvencies (so we can balance properly)
    const workingSizes = new Map<string, Map<number, number>>();
    const availablePools = new Map<string, Map<number, Club[]>>();

    const countries = Array.from(new Set(agedClubs.map(c => normalizeCountry(c.country || 'GER'))));

    countries.forEach(country => {
        workingSizes.set(country, new Map());
        availablePools.set(country, new Map());
        const maxT = getMaxTier(country);
        for (let t = 1; t <= maxT; t++) {
            workingSizes.get(country)!.set(t, 0);
            availablePools.get(country)!.set(t, []);
        }
    });

    agedClubs.forEach(c => {
        if (c.id === userClub.id) return;
        const country = normalizeCountry(c.country || 'GER');
        const t = nextTiers.get(c.id) || c.tier;
        
        const pools = availablePools.get(country);
        if (pools && pools.has(t)) {
            pools.get(t)!.push(c);
        }
    });

    // 3. Record Champions and Process Boundaries layer by layer to strictly preserve division sizes
    countries.forEach(country => {
        const maxT = getMaxTier(country);
        const pools = availablePools.get(country)!;

        // Record Champions for each tier (Tier 1 of user country or marquee leagues & User Tier are marked as key champions)
        const uNormCountry = normalizeCountry(userClub.country || 'GER');
        const isMarqueeCountry = ['GER', 'FRA', 'ESP', 'DEN', 'HUN'].includes(country);
        for (let t = 1; t <= maxT; t++) {
            const isUserHereThisYear = uNormCountry === country && playedTier === t;
            const userWonThisTier = isUserHereThisYear && userPos === 1;
            const isKeyChamp = isUserHereThisYear || ((country === uNormCountry || isMarqueeCountry) && t === 1);

            if (userWonThisTier) {
                movements.push({
                    id: `${userClub.id}-${currentYear}-champ-t${t}`,
                    year: currentYear,
                    clubId: String(userClub.id),
                    clubName: userClub.name,
                    clubLogo: userClub.logo,
                    clubColor: userClub.color,
                    country: country,
                    type: 'champion',
                    fromTier: t,
                    toTier: t,
                    isKey: true,
                });
                const poolT = pools.get(t) || [];
                if (poolT.length > 0) {
                    const sortedT = [...poolT].sort((a, b) => b.baseOvr - a.baseOvr);
                    const tableT = (country === uNormCountry && divisionTables && divisionTables[t] && Array.isArray(divisionTables[t]) && divisionTables[t].length > 0)
                        ? divisionTables[t]
                        : (t === playedTier && country === uNormCountry && userFinalTable && Array.isArray(userFinalTable) && userFinalTable.length > 0 ? userFinalTable : null);

                    poolT.forEach(c => {
                        const row = tableT ? tableT.find((r: any) => 
                            (r.id !== undefined && (String(r.id) === String(c.id) || Number(r.id) === Number(c.id))) ||
                            (r.name && c.name && r.name.trim().toLowerCase() === c.name.trim().toLowerCase())
                        ) : null;
                        if (row && typeof row.pos === 'number') {
                            c.lastSeasonPos = row.pos;
                        } else {
                            const idx = sortedT.indexOf(c);
                            c.lastSeasonPos = idx >= 0 ? idx + 2 : 2;
                        }
                    });
                }
            } else {
                const poolT = pools.get(t) || [];
                if (poolT.length > 0) {
                    const seededRandomSim = (seed: number) => {
                        const x = Math.sin(seed + 1) * 10000;
                        return x - Math.floor(x);
                    };
                    const getClubSeedHashSim = (c: { id?: number | string; name?: string }) => {
                        const str = `${c.id ?? ''}_${c.name ?? ''}`;
                        let h = 0;
                        for (let i = 0; i < str.length; i++) {
                            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
                        }
                        return Math.abs(h);
                    };
                    const tierAvgOvr = t === 1 ? 81 : t === 2 ? 73 : t === 3 ? 66 : t === 4 ? 60 : 54;
                    const getSeasonContentionScore = (c: Club) => {
                        const h = getClubSeedHashSim(c);
                        const baseNoise = (seededRandomSim(currentYear * 97 + t * 31 + (h % 9973)) - 0.5) * 9; // -4.5 to +4.5
                        const specialRoll = seededRandomSim(currentYear * 193 + t * 53 + (h % 7919));
                        let narrativeSwing = 0;
                        if (c.isCinderellaActive || c.isNemesisActive) {
                            narrativeSwing += 3.5;
                        }
                        if (specialRoll > 0.90 && c.baseOvr < tierAvgOvr + 6) {
                            narrativeSwing += 5.5; // Dark-horse breakout campaign
                        } else if (specialRoll < 0.08 && c.baseOvr > tierAvgOvr) {
                            narrativeSwing -= 4.5; // Injury-hit / crisis campaign
                        }
                        return c.baseOvr + baseNoise + narrativeSwing;
                    };
                    const contentionScores = new Map<string | number, number>();
                    poolT.forEach(c => contentionScores.set(c.id, getSeasonContentionScore(c)));
                    const sortedT = [...poolT].sort((a, b) => (contentionScores.get(b.id) || b.baseOvr) - (contentionScores.get(a.id) || a.baseOvr));
                    const tableT = (country === uNormCountry && divisionTables && divisionTables[t] && Array.isArray(divisionTables[t]) && divisionTables[t].length > 0)
                        ? divisionTables[t]
                        : (t === playedTier && country === uNormCountry && userFinalTable && Array.isArray(userFinalTable) && userFinalTable.length > 0 ? userFinalTable : null);

                    let champ: Club = sortedT[0];
                    if (tableT) {
                        const champRow = tableT.find((r: any) => r.pos === 1) || tableT[0];
                        const foundChamp = champRow ? poolT.find(c => 
                            (champRow.id !== undefined && (String(c.id) === String(champRow.id) || Number(c.id) === Number(champRow.id))) ||
                            (champRow.name && c.name && c.name.trim().toLowerCase() === champRow.name.trim().toLowerCase())
                        ) : null;
                        if (foundChamp) {
                            champ = foundChamp;
                        }

                        poolT.forEach(c => {
                            const row = tableT.find((r: any) => 
                                (r.id !== undefined && (String(r.id) === String(c.id) || Number(r.id) === Number(c.id))) ||
                                (r.name && c.name && r.name.trim().toLowerCase() === c.name.trim().toLowerCase())
                            );
                            if (row && typeof row.pos === 'number') {
                                c.lastSeasonPos = row.pos;
                            } else {
                                const idx = sortedT.indexOf(c);
                                c.lastSeasonPos = idx >= 0 ? idx + 1 : 2;
                            }
                        });
                    } else {
                        champ.lastSeasonPos = 1;
                        sortedT.slice(1).forEach((c, idx) => {
                            c.lastSeasonPos = idx + 2;
                        });
                    }

                    if (champ.isNemesisActive) {
                        champ.wasNemesisChampion = true;
                    }
                    if (t === 1 && champ.id !== userClub.id) {
                        champ.baseOvr = Math.min(93, champ.baseOvr + 1); // +1 OVR domestic title momentum (capped at 93)
                    }
                    movements.push({
                        id: `${champ.id}-${currentYear}-champ-t${t}`,
                        year: currentYear,
                        clubId: String(champ.id),
                        clubName: champ.name,
                        clubLogo: champ.logo,
                        clubColor: champ.color,
                        country: country,
                        type: 'champion',
                        fromTier: t,
                        toTier: t,
                        isKey: isKeyChamp,
                    });
                }
            }
        }

        // Pre-calculate target AI sizes for each tier in this country
        const targetSizes = new Map<number, number>();
        for (let t = 1; t <= maxT; t++) {
            const canonicalSize = getLeagueSize(t, country, undefined, undefined, undefined, baseList) || baseList.filter(c => normalizeCountry(c.country || 'GER') === country && c.tier === t).length || 10;
            const isUserInT = (userClub.tier === t && normalizeCountry(userClub.country || 'GER') === country);
            targetSizes.set(t, isUserInT ? canonicalSize - 1 : canonicalSize);
        }

        // Process boundary swaps between tier t and t+1
        for (let t = 1; t < maxT; t++) {
            const reqAiInT = targetSizes.get(t) || 10;
            const poolT = pools.get(t) || [];
            const poolT1 = pools.get(t + 1) || [];

            const getScore = (c: Club) => c.baseOvr + (Math.random() * 8 - 4);
            poolT.sort((a, b) => getScore(b) - getScore(a)); // Best to worst
            poolT1.sort((a, b) => getScore(b) - getScore(a)); // Best to worst

            let eligiblePromos = poolT1.filter(c => 
                !(t === 1 && isReserveClub(c.name)) && 
                !selectedForInsolvency.some(ic => ic.id === c.id) &&
                startingTiers.get(c.id) === t + 1 &&
                nextTiers.get(c.id) === t + 1
            );

            // Standard baseline promotion/relegation quota (2 direct spots; playoff decider expands to 3 when lower tier wins)
            const targetSpots = reqAiInT >= 12 ? 2 : 1;
            const isUserCountry = country === uNormCountry;
            const userPromotedAcrossBoundary = isUserCountry && playedTier === t + 1 && userClub.tier === t;
            const userRelegatedAcrossBoundary = isUserCountry && playedTier === t && userClub.tier === t + 1;

            // If user earned one of the direct promotion spots from t+1 to t, AI clubs take the remaining direct spot(s)
            let promos = Math.max(0, targetSpots - (userPromotedAcrossBoundary ? 1 : 0));
            if (poolT.length + promos < reqAiInT) {
                promos = Math.min(eligiblePromos.length, reqAiInT - poolT.length);
            }
            // Exact AI relegations from tier t needed to reach reqAiInT after promotions (also accounts for user relegation or insolvency demotions)
            let relegs = Math.max(0, poolT.length + promos - reqAiInT);

            let eligibleRelegs = poolT.filter(c => 
                !selectedForInsolvency.some(ic => ic.id === c.id) &&
                startingTiers.get(c.id) === t &&
                nextTiers.get(c.id) === t &&
                !(resolvedMatchContext?.playoffDecider && 
                  resolvedMatchContext.playoffDecider.lowerTier === t && 
                  (String(resolvedMatchContext.playoffDecider.winnerId) === String(c.id) || 
                   String(resolvedMatchContext.playoffDecider.loserId) === String(c.id) ||
                   (resolvedMatchContext.playoffDecider.winnerName && c.name.trim().toLowerCase() === resolvedMatchContext.playoffDecider.winnerName.trim().toLowerCase()) ||
                   (resolvedMatchContext.playoffDecider.loserName && c.name.trim().toLowerCase() === resolvedMatchContext.playoffDecider.loserName.trim().toLowerCase())
                  )
                )
            );

            // Fallback pools if strict filters left fewer candidates than needed (strictly forbid cascading double-moves and reserve leaks)
            if (eligiblePromos.length < promos) {
                const fallback = poolT1.filter(c => 
                    !(t === 1 && isReserveClub(c.name)) &&
                    !selectedForInsolvency.some(ic => ic.id === c.id) &&
                    !eligiblePromos.some(ep => ep.id === c.id) &&
                    startingTiers.get(c.id) === t + 1 &&
                    nextTiers.get(c.id) === t + 1
                );
                eligiblePromos = [...eligiblePromos, ...fallback];
            }
            if (eligibleRelegs.length < relegs) {
                const fallback = poolT.filter(c => 
                    !selectedForInsolvency.some(ic => ic.id === c.id) &&
                    !eligibleRelegs.some(er => er.id === c.id) &&
                    startingTiers.get(c.id) === t &&
                    nextTiers.get(c.id) === t &&
                    !(resolvedMatchContext?.playoffDecider && 
                      resolvedMatchContext.playoffDecider.lowerTier === t && 
                      (String(resolvedMatchContext.playoffDecider.winnerId) === String(c.id) || 
                       String(resolvedMatchContext.playoffDecider.loserId) === String(c.id) ||
                       (resolvedMatchContext.playoffDecider.winnerName && c.name.trim().toLowerCase() === resolvedMatchContext.playoffDecider.winnerName.trim().toLowerCase()) ||
                       (resolvedMatchContext.playoffDecider.loserName && c.name.trim().toLowerCase() === resolvedMatchContext.playoffDecider.loserName.trim().toLowerCase())
                      )
                    )
                );
                eligibleRelegs = [...eligibleRelegs, ...fallback];
            }

            // Cap at candidate availability while maintaining surplus delta
            if (relegs > eligibleRelegs.length) {
                const excess = relegs - eligibleRelegs.length;
                relegs = eligibleRelegs.length;
                promos = Math.max(0, promos - excess);
            }
            if (promos > eligiblePromos.length) {
                const excess = promos - eligiblePromos.length;
                promos = eligiblePromos.length;
                relegs = Math.max(0, relegs - excess);
            }

            // Authenticate exact relegated and promoted teams from division tables if available
            const isCountryTable = (tbl: any[] | undefined) => Boolean(tbl && tbl.length > 0 && (
                country === uNormCountry || tbl.some((r: any) => poolT.some(c => c.name === r.name || String(c.id) === String(r.id)) || poolT1.some(c => c.name === r.name || String(c.id) === String(r.id)))
            ));
            const tableT = (divisionTables && isCountryTable(divisionTables[t])) ? divisionTables[t] : (t === playedTier && country === uNormCountry ? userFinalTable : null);
            const tableT1 = (divisionTables && isCountryTable(divisionTables[t + 1])) ? divisionTables[t + 1] : (t + 1 === playedTier && country === uNormCountry ? userFinalTable : null);

            let promotingTeams: Club[] = [];
            let relegatingTeams: Club[] = [];

            if (tableT1 && tableT1.length > 0) {
                // Teams marked with 'C' or 'P' or finishing in top 2 positions of the lower division (excluding reserve clubs barred from Tier 1)
                const tablePromoClubs = tableT1.filter((r: any) => !r.isUser && !(t === 1 && isReserveClub(r.name || '')) && (r.statusMarker === 'C' || r.statusMarker === 'P' || r.pos <= 2));
                tablePromoClubs.sort((a: any, b: any) => (a.pos || 0) - (b.pos || 0));
                const directPromos: Club[] = [];
                tablePromoClubs.forEach((tp: any) => {
                    const normName = (tp.name || '').trim().toLowerCase();
                    const match = eligiblePromos.find(c => c.name.trim().toLowerCase() === normName || String(c.id) === String(tp.id))
                        || poolT1.find(c => !(t === 1 && isReserveClub(c.name)) && !selectedForInsolvency.some(ic => ic.id === c.id) && startingTiers.get(c.id) === t + 1 && nextTiers.get(c.id) === t + 1 && (c.name.trim().toLowerCase() === normName || String(c.id) === String(tp.id)));
                    if (match && !directPromos.some(d => d.id === match.id)) {
                        directPromos.push(match);
                    }
                });

                // Fill any remaining promotion quota (e.g. if a reserve club finished top 2, playoff winner promoted, or insolvency vacancy in upper tier) from highest eligible finishers
                let extraTablePromos: Club[] = [];
                if (promos > directPromos.length) {
                    const reserveBlockedCount = tableT1.filter((r: any) => !r.isUser && (r.pos || 99) <= 2 && t === 1 && isReserveClub(r.name || '')).length;
                    const maxEligiblePos = Math.max(3, promos + 1) + reserveBlockedCount;
                    const tableT1Remaining = tableT1
                        .filter((r: any) => !r.isUser && !(t === 1 && isReserveClub(r.name || '')) && (r.statusMarker === 'P' || (r.pos && r.pos <= maxEligiblePos)))
                        .sort((a: any, b: any) => (a.pos || 0) - (b.pos || 0));
                    for (const candidate of tableT1Remaining) {
                        if (extraTablePromos.length + directPromos.length >= promos) break;
                        const normName = (candidate.name || '').trim().toLowerCase();
                        const match = eligiblePromos.find(c => c.name.trim().toLowerCase() === normName || String(c.id) === String(candidate.id))
                            || poolT1.find(c => !(t === 1 && isReserveClub(c.name)) && !selectedForInsolvency.some(ic => ic.id === c.id) && startingTiers.get(c.id) === t + 1 && nextTiers.get(c.id) === t + 1 && (c.name.trim().toLowerCase() === normName || String(c.id) === String(candidate.id)));
                        if (match && !directPromos.some(d => d.id === match.id) && !extraTablePromos.some(e => e.id === match.id)) {
                            extraTablePromos.push(match);
                        }
                    }
                }
                promotingTeams = [...directPromos, ...extraTablePromos].slice(0, Math.max(promos, directPromos.length));
                
                // Recalculate relegs to strictly preserve tier size balance without forcing unearned promotions
                const hasInsolvencyVacancyInT = poolT.length + promotingTeams.length <= reqAiInT;
                const minAiRelegs = (userRelegatedAcrossBoundary || hasInsolvencyVacancyInT) ? 0 : 1;
                relegs = Math.max(minAiRelegs, Math.min(eligibleRelegs.length, poolT.length + promotingTeams.length - reqAiInT));
            } else {
                promotingTeams = promos > 0 ? eligiblePromos.slice(0, promos) : [];
            }

            if (tableT && tableT.length > 0) {
                // Teams marked with 'R' or finishing in the bottom positions of the table
                const tableRelegClubs = tableT.filter((r: any) => !r.isUser && (r.statusMarker === 'R' || r.pos >= tableT.length - 1));
                tableRelegClubs.sort((a: any, b: any) => (b.pos || 0) - (a.pos || 0));
                const directRelegs: Club[] = [];
                tableRelegClubs.forEach((tr: any) => {
                    const normName = (tr.name || '').trim().toLowerCase();
                    const match = eligibleRelegs.find(c => c.name.trim().toLowerCase() === normName || String(c.id) === String(tr.id))
                        || poolT.find(c => !selectedForInsolvency.some(ic => ic.id === c.id) && startingTiers.get(c.id) === t && nextTiers.get(c.id) === t && (c.name.trim().toLowerCase() === normName || String(c.id) === String(tr.id)));
                    if (match && !directRelegs.some(d => d.id === match.id)) {
                        directRelegs.push(match);
                    }
                });

                // If more relegations needed, only pull from bottom-most remaining teams in tableT
                let extraTableRelegs: Club[] = [];
                if (relegs > directRelegs.length) {
                    const tableTRemaining = tableT
                        .filter((r: any) => !r.isUser && !directRelegs.some(d => d.name.trim().toLowerCase() === (r.name || '').trim().toLowerCase() || String(d.id) === String(r.id)))
                        .sort((a: any, b: any) => (b.pos || 0) - (a.pos || 0));
                    for (const candidate of tableTRemaining) {
                        if (extraTableRelegs.length + directRelegs.length >= relegs) break;
                        const normName = (candidate.name || '').trim().toLowerCase();
                        const match = eligibleRelegs.find(c => c.name.trim().toLowerCase() === normName || String(c.id) === String(candidate.id))
                            || poolT.find(c => !selectedForInsolvency.some(ic => ic.id === c.id) && startingTiers.get(c.id) === t && nextTiers.get(c.id) === t && (c.name.trim().toLowerCase() === normName || String(c.id) === String(candidate.id)));
                        if (match && !directRelegs.some(d => d.id === match.id) && !extraTableRelegs.some(e => e.id === match.id)) {
                            extraTableRelegs.push(match);
                        }
                    }
                }
                relegatingTeams = [...directRelegs, ...extraTableRelegs].slice(0, relegs);
            } else {
                relegatingTeams = relegs > 0 ? eligibleRelegs.slice(-relegs) : []; // Worst teams
            }

            // Lower-tier playoff participants finished in the promotion spots and must never be relegated from tier t
            const activePlayoff = resolvedMatchContext?.playoffDecider;
            if (activePlayoff && activePlayoff.lowerTier === t && country === uNormCountry) {
                const challengerId = String(activePlayoff.type === 'relegation_playoff' ? activePlayoff.loserId : activePlayoff.winnerId);
                const challengerName = ((activePlayoff.type === 'relegation_playoff' ? activePlayoff.loserName : activePlayoff.winnerName) || '').trim().toLowerCase();
                if (relegatingTeams.some(c => String(c.id) === challengerId || c.name.trim().toLowerCase() === challengerName)) {
                    relegatingTeams = relegatingTeams.filter(c => String(c.id) !== challengerId && c.name.trim().toLowerCase() !== challengerName);
                    const safeReplacements = eligibleRelegs.filter(c => 
                        !relegatingTeams.some(r => r.id === c.id) &&
                        String(c.id) !== challengerId &&
                        c.name.trim().toLowerCase() !== challengerName
                    );
                    if (safeReplacements.length > 0 && relegatingTeams.length < relegs) {
                        relegatingTeams.push(safeReplacements[safeReplacements.length - 1]);
                    }
                }
            }

            // Enforce locked cross-tier playoff outcome if played by user
            let playoff = resolvedMatchContext?.playoffDecider;
            if (!playoff && playoffOverride && playoffOverride.active !== false) {
                const upperTier = Math.min(playoffOverride.oldTier, playoffOverride.newTier);
                const lowerTier = Math.max(playoffOverride.oldTier, playoffOverride.newTier);
                if (upperTier === t && lowerTier === t + 1 && country === uNormCountry) {
                    const isPromo = playoffOverride.newTier < playoffOverride.oldTier;
                    playoff = {
                        year: currentYear,
                        type: isPromo ? 'promotion_playoff' : 'relegation_playoff',
                        winnerId: playoffOverride.userWon ? String(userClub.id) : 'ai_rival',
                        loserId: playoffOverride.userWon ? 'ai_rival' : String(userClub.id),
                        winnerName: playoffOverride.userWon ? userClub.name : 'AI Rival',
                        loserName: playoffOverride.userWon ? 'AI Rival' : userClub.name,
                        upperTier,
                        lowerTier,
                        userWon: playoffOverride.userWon,
                        promotedClubId: playoffOverride.userWon ? String(userClub.id) : 'ai_rival',
                        relegatedClubId: playoffOverride.userWon ? 'ai_rival' : String(userClub.id)
                    };
                }
            }
            const isRelevantPlayoff = Boolean(
                playoff && 
                playoff.upperTier === t && 
                playoff.lowerTier === t + 1 && 
                country === uNormCountry
            );
            if (isRelevantPlayoff && playoff) {
                const playoffWinnerName = (playoff.winnerName || '').trim().toLowerCase();
                const playoffLoserName = (playoff.loserName || '').trim().toLowerCase();
                const lowerTierPromoted = (playoff.type === 'promotion_playoff' && playoff.userWon) || (playoff.type === 'relegation_playoff' && !playoff.userWon);

                if (lowerTierPromoted) {
                    // Lower tier won extra promotion slot: 3 clubs promoted, 3 clubs relegated
                    const loserClubInT = poolT.find(c => String(c.id) === String(playoff.loserId) || c.name.trim().toLowerCase() === playoffLoserName);
                    if (loserClubInT && !relegatingTeams.some(r => r.id === loserClubInT.id)) {
                        relegatingTeams.unshift(loserClubInT);
                    }
                    if (String(playoff.winnerId) !== String(userClub.id)) {
                        const winnerClubInT1 = poolT1.find(c => String(c.id) === String(playoff.winnerId) || c.name.trim().toLowerCase() === playoffWinnerName);
                        if (winnerClubInT1 && !promotingTeams.some(p => p.id === winnerClubInT1.id)) {
                            promotingTeams.push(winnerClubInT1);
                        }
                    }
                } else {
                    // Upper tier club survived!
                    relegatingTeams = relegatingTeams.filter(r => String(r.id) !== String(playoff.winnerId) && r.name.trim().toLowerCase() !== playoffWinnerName);
                    promotingTeams = promotingTeams.filter(p => String(p.id) !== String(playoff.loserId) && p.name.trim().toLowerCase() !== playoffLoserName);
                }

                // Balance relegations to guarantee division size preservation
                const canonicalSize = getLeagueSize(t, country, undefined, undefined, undefined, baseList) || 18;
                const userPromoIncoming = Boolean(lowerTierPromoted && (String(playoff.winnerId) === String(userClub.id) || (playoff.winnerName && userClub.name && userClub.name.trim().toLowerCase() === playoff.winnerName.trim().toLowerCase())) && playoff.upperTier === t);
                const userRelegOutgoing = Boolean(lowerTierPromoted && (String(playoff.loserId) === String(userClub.id) || (playoff.loserName && userClub.name && userClub.name.trim().toLowerCase() === playoff.loserName.trim().toLowerCase())) && playoff.upperTier === t);
                const effectiveReqAiInT = userRelegOutgoing ? canonicalSize : (userPromoIncoming ? canonicalSize - 1 : reqAiInT);
                const targetRelegs = Math.max(0, Math.min(poolT.length, poolT.length + promotingTeams.length - effectiveReqAiInT));
                if (relegatingTeams.length > targetRelegs) {
                    const mustKeep = relegatingTeams.filter(r => String(r.id) === String(playoff.loserId) || r.name.trim().toLowerCase() === playoffLoserName);
                    const others = relegatingTeams.filter(r => !mustKeep.some(k => k.id === r.id));
                    relegatingTeams = [...mustKeep, ...others].slice(0, targetRelegs);
                } else if (relegatingTeams.length < targetRelegs) {
                    const fallbackRelegs = eligibleRelegs.filter(c => 
                        !relegatingTeams.some(r => r.id === c.id) &&
                        String(c.id) !== String(playoff.winnerId) &&
                        c.name.trim().toLowerCase() !== playoffWinnerName
                    );
                    relegatingTeams = [...relegatingTeams, ...fallbackRelegs].slice(0, targetRelegs);
                }
            }

            const newPoolT = poolT.filter(c => !relegatingTeams.some(r => r.id === c.id));
            const newPoolT1 = poolT1.filter(c => !promotingTeams.some(p => p.id === c.id));

            pools.set(t, [...newPoolT, ...promotingTeams]);
            pools.set(t + 1, [...newPoolT1, ...relegatingTeams]);

            promotingTeams.forEach(c => {
                nextTiers.set(c.id, t);
                if (c.id !== userClub.id) {
                    const promoCap = t === 1 ? Math.max(c.baseOvr, 83) : Math.max(c.baseOvr, 78);
                    c.baseOvr = Math.min(promoCap, c.baseOvr + (Math.floor(Math.random() * 2) + 1)); // +1 to +2 OVR promotion momentum
                }
                const isKeyPromo = (c.id === userClub.id) || (t === 1 && country === uNormCountry);
                const isCinderellaPromo = Boolean(c.isCinderellaActive || (c.goldenGenYearsRemaining && c.goldenGenYearsRemaining > 0));
                movements.push({
                    id: `${c.id}-${currentYear}-promo-t${t}`,
                    year: currentYear,
                    clubId: String(c.id),
                    clubName: c.name,
                    clubLogo: c.logo,
                    clubColor: c.color,
                    country: normalizeCountry(c.country || country),
                    type: 'promotion',
                    fromTier: t + 1,
                    toTier: t,
                    isKey: isKeyPromo || isCinderellaPromo,
                    isCinderella: isCinderellaPromo,
                });
            });

            relegatingTeams.forEach(c => {
                nextTiers.set(c.id, t + 1);
                if (c.id !== userClub.id) {
                    // Financial parachute scaling & multi-year rebuilding curves:
                    // ~22% of relegated clubs benefit from strong parachute funding/core retention (-2 to -3 OVR)
                    // ~78% suffer revenue collapse, talent flight & wage downsizing (-6 to -9 OVR) down to lower-tier parity
                    const hasParachuteShield = Math.random() < 0.22;
                    const drop = hasParachuteShield
                        ? (Math.floor(Math.random() * 2) + 2) // -2 to -3 OVR (Parachute contender)
                        : (Math.floor(Math.random() * 4) + 6); // -6 to -9 OVR (Multi-year restructuring)
                    c.baseOvr = Math.max(32, c.baseOvr - drop);
                }
                const isKeyReleg = (c.id === userClub.id) || (t === 1 && country === uNormCountry);
                movements.push({
                    id: `${c.id}-${currentYear}-releg-t${t + 1}`,
                    year: currentYear,
                    clubId: String(c.id),
                    clubName: c.name,
                    clubLogo: c.logo,
                    clubColor: c.color,
                    country: normalizeCountry(c.country || country),
                    type: 'relegation',
                    fromTier: t,
                    toTier: t + 1,
                    isKey: isKeyReleg,
                });
            });
        }
    });

    // Also include user club movement if tier changed (skip if playoff already pushed movement)
    if (userClub.tier !== playedTier && !playoffOverride?.active) {
        const uCountry = normalizeCountry(userClub.country || 'GER');
        const uMaxTier = getMaxTier(uCountry);
        if (userClub.tier < playedTier && playedTier > 1) {
            movements.unshift({
                id: `${userClub.id}-${currentYear}-user-promo`,
                year: currentYear,
                clubId: String(userClub.id),
                clubName: userClub.name,
                clubLogo: userClub.logo,
                clubColor: userClub.color,
                country: uCountry,
                type: 'promotion',
                fromTier: playedTier,
                toTier: Math.max(1, userClub.tier),
                isKey: true,
            });
        } else if (userClub.tier > playedTier && playedTier < uMaxTier) {
            movements.unshift({
                id: `${userClub.id}-${currentYear}-user-releg`,
                year: currentYear,
                clubId: String(userClub.id),
                clubName: userClub.name,
                clubLogo: userClub.logo,
                clubColor: userClub.color,
                country: uCountry,
                type: 'relegation',
                fromTier: playedTier,
                toTier: Math.min(uMaxTier, userClub.tier),
                isKey: true,
            });
        }
    }

    // 4. Simulate Key International Cup Winners (EHF Champions League, European League, European Cup, IHF Super Globe)
    const resolvedCupFinals = resolvedMatchContext?.cupFinals || {};
    const confirmedCl = resolvedCupFinals['cl'] || (resolvedCupFinals['euro_cup'] && ((userClub as any).euroStatus || 'CL') === 'CL' ? resolvedCupFinals['euro_cup'] : undefined);
    const confirmedDomCup = resolvedCupFinals['nat_cup'] || resolvedCupFinals['dfb'];
    const confirmedRegCup = resolvedCupFinals['reg_cup'] || resolvedCupFinals['reg'];
    const confirmedEl = resolvedCupFinals['el'] || (resolvedCupFinals['euro_cup'] && (userClub as any).euroStatus === 'EL' ? resolvedCupFinals['euro_cup'] : undefined);
    const confirmedEcl = resolvedCupFinals['ecl'] || (resolvedCupFinals['euro_cup'] && (userClub as any).euroStatus === 'ECL' ? resolvedCupFinals['euro_cup'] : undefined);
    const confirmedCwc = resolvedCupFinals['cwc'] || resolvedCupFinals['super_globe'];

    // Cross-reference cupRunResults to detect user cup eliminations
    const relevantCupRuns = (cupRunResults || []).filter(r => r.year === currentYear || !r.year || String(r.year) === String(currentYear));
    
    const isDomesticCupRun = (r: any) => {
        const id = (r.id || '').toLowerCase();
        const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
        return id === 'nat_cup' || id === 'dfb' || id === 'cup' || id === 'domestic_cup' || (
            (title.includes('national') || title.includes('pokal') || title.includes('cup') || title.includes('copa') || title.includes('coupe') || title.includes('puchar') || title.includes('kupa') || title.includes('kup') || title.includes('coppa') || title.includes('cupa') || title.includes('cupen') || title.includes('taça') || title.includes('taca') || title.includes('bikar') || title.includes('nm')) &&
            !title.includes('amateur') && !title.includes('regional') && !title.includes('euro') && !title.includes('champions') && !title.includes('super globe') && !id.includes('reg') && !id.includes('euro') && !id.includes('cl')
        );
    };

    const isRegionalCupRun = (r: any) => {
        const id = (r.id || '').toLowerCase();
        const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
        return id === 'reg_cup' || id === 'regional_cup' || title.includes('regional') || title.includes('amateur');
    };

    const isClCupRun = (r: any) => {
        const id = (r.id || '').toLowerCase();
        const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
        return id === 'cl' || (title.includes('champions league') || (title.includes('champions') && !title.includes('super globe')));
    };

    const isElCupRun = (r: any) => {
        const id = (r.id || '').toLowerCase();
        const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
        return id === 'el' || title.includes('european league') || title.includes('euro league');
    };

    const isEclCupRun = (r: any) => {
        const id = (r.id || '').toLowerCase();
        const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
        return id === 'ecl' || title.includes('european cup') || title.includes('europapokal');
    };

    const isCwcCupRun = (r: any) => {
        const id = (r.id || '').toLowerCase();
        const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
        return id === 'cwc' || title.includes('super globe') || title.includes('club world');
    };

    const isEuroCupRun = (r: any) => {
        const id = (r.id || '').toLowerCase();
        const title = ((r.nameEn || '') + ' ' + (r.nameDe || '')).toLowerCase();
        return isClCupRun(r) || isElCupRun(r) || isEclCupRun(r) || id === 'euro_cup' || (title.includes('euro') && !title.includes('super globe'));
    };

    const natCupEliminated = Boolean(
        relevantCupRuns.some(r => isDomesticCupRun(r) && r.won === false) ||
        (confirmedDomCup && (confirmedDomCup.year === currentYear || !confirmedDomCup.year) && !confirmedDomCup.userWon)
    );

    const regCupEliminated = Boolean(
        relevantCupRuns.some(r => isRegionalCupRun(r) && r.won === false) ||
        (confirmedRegCup && (confirmedRegCup.year === currentYear || !confirmedRegCup.year) && !confirmedRegCup.userWon)
    );

    const clEliminated = Boolean(
        relevantCupRuns.some(r => isClCupRun(r) && r.won === false) ||
        (confirmedCl && (confirmedCl.year === currentYear || !confirmedCl.year) && !confirmedCl.userWon)
    );

    const elEliminated = Boolean(
        relevantCupRuns.some(r => isElCupRun(r) && r.won === false) ||
        (confirmedEl && (confirmedEl.year === currentYear || !confirmedEl.year) && !confirmedEl.userWon)
    );

    const eclEliminated = Boolean(
        relevantCupRuns.some(r => isEclCupRun(r) && r.won === false) ||
        (confirmedEcl && (confirmedEcl.year === currentYear || !confirmedEcl.year) && !confirmedEcl.userWon)
    );

    const cwcEliminated = Boolean(
        relevantCupRuns.some(r => isCwcCupRun(r) && r.won === false) ||
        (confirmedCwc && (confirmedCwc.year === currentYear || !confirmedCwc.year) && !confirmedCwc.userWon)
    );

    const confirmedEuroFinal = resolvedCupFinals['euro_cup'];
    const euroCupEliminated = clEliminated || elEliminated || eclEliminated || Boolean(
        relevantCupRuns.some(r => isEuroCupRun(r) && r.won === false) ||
        (confirmedEuroFinal && (confirmedEuroFinal.year === currentYear || !confirmedEuroFinal.year) && !confirmedEuroFinal.userWon)
    );

    const runClWinnerName = confirmedCl?.winnerName || relevantCupRuns.find(r => isClCupRun(r) && r.won === false && r.winnerName)?.winnerName;
    const runDomWinnerName = confirmedDomCup?.winnerName || relevantCupRuns.find(r => isDomesticCupRun(r) && r.won === false && r.winnerName)?.winnerName;
    const runElWinnerName = confirmedEl?.winnerName || relevantCupRuns.find(r => isElCupRun(r) && r.won === false && r.winnerName)?.winnerName;
    const runEclWinnerName = confirmedEcl?.winnerName || relevantCupRuns.find(r => isEclCupRun(r) && r.won === false && r.winnerName)?.winnerName;
    const runCwcWinnerName = confirmedCwc?.winnerName || relevantCupRuns.find(r => isCwcCupRun(r) && r.won === false && r.winnerName)?.winnerName;

    const isUserMatch = (c: Club | { id?: number | string; name?: string }) => {
            if (!c) return false;
            const idMatch = userClub.id !== undefined && c.id !== undefined && (String(c.id) === String(userClub.id) || Number(c.id) === Number(userClub.id));
            const nameMatch = Boolean(userClub.name && c.name && c.name.trim().toLowerCase() === userClub.name.trim().toLowerCase());
            return idMatch || nameMatch;
        };

        const matchesHeritageCl = (name: string): boolean => {
            if (!name || isReserveClub(name)) return false;
            const n = name.toLowerCase();
            if (n.endsWith(' fa') || n.includes(' academy')) return false;
            if (n.includes('kielce') && !n.includes('sms')) return true; // Industria Kielce
            if ((n.includes('füchse') || n.includes('fuechse') || n.includes('foxes')) && (n.includes('berlin') || n === 'füchse')) return true;
            return (
                n.includes('barcelona') ||
                n.includes('barça') ||
                n.includes('barca') ||
                n.includes('paris saint-germain') ||
                n.includes('paris') ||
                n.includes('psg') ||
                (n.includes('kiel') && !n.includes('kielce')) || // THW Kiel
                n.includes('magdeburg') ||
                n.includes('veszprém') ||
                n.includes('veszprem') ||
                n.includes('aalborg')
            );
        };

        const matchesHeritageEl = (name: string): boolean => {
            if (!name || isReserveClub(name)) return false;
            const n = name.toLowerCase();
            if (n.endsWith(' fa') || n.includes(' academy')) return false;
            return (
                n.includes('nantes') ||
                n.includes('sporting') ||
                n.includes('montpellier') ||
                n.includes('płock') ||
                n.includes('plock') ||
                n.includes('melsungen') ||
                n.includes('flensburg') ||
                n.includes('szeged')
            );
        };

        const pickWeightedWinner = (
            pool: Club[],
            cupType: 'cl' | 'el' | 'ecl' | 'dom',
            excludeId?: number | string
        ): Club => {
            const isExcluded = (c: Club) => {
                if (isUserMatch(c)) return true;
                if (excludeId !== undefined && (String(c.id) === String(excludeId) || Number(c.id) === Number(excludeId))) return true;
                return false;
            };
            const valid = pool.filter(c => !isExcluded(c) && !isReserveClub(c.name));
            if (valid.length === 0) {
                const fallback = agedClubs.filter(c => !isExcluded(c) && !isReserveClub(c.name));
                return fallback[0] || baseList.find(c => !isUserMatch(c)) || pool[0];
            }

            const userCountry = normalizeCountry(userClub.country || 'GER');

            const weighted = valid.map(c => {
                let weight = Math.max(1, Math.pow(Math.max(1, (c.baseOvr || 70) - 65), 1.5));
                const cCountry = normalizeCountry(c.country || 'GER');
                const isForeign = cCountry !== userCountry;

                if (c.isCinderellaActive || c.isNemesisActive) {
                    weight *= 2.8; // Surging Cinderella / Investor Takeover dark-horse cup momentum
                }

                if (cupType === 'cl') {
                    if (matchesHeritageCl(c.name)) {
                        weight *= 8.0; // 8x massive probability multiplier for authentic heritage powerhouses (5x-10x)
                    }
                    if (isForeign) {
                        weight *= 2.2; // Foreign representation boost to pull European titans across worldClubs
                    }
                } else if (cupType === 'el') {
                    if (matchesHeritageEl(c.name)) {
                        weight *= 8.0; // 8x multiplier for authentic upper-mid-tier European clubs
                    } else if (matchesHeritageCl(c.name)) {
                        weight *= 3.0; // Heritage continental titans
                    }
                    if (isForeign) {
                        weight *= 2.0; // Foreign representation boost
                    }
                } else if (cupType === 'ecl') {
                    if (matchesHeritageEl(c.name)) {
                        weight *= 6.0;
                    }
                    if (isForeign) {
                        weight *= 1.8;
                    }
                }

                return { club: c, weight };
            });

            const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
            let rand = Math.random() * totalWeight;
            for (const item of weighted) {
                rand -= item.weight;
                if (rand <= 0) {
                    return item.club;
                }
            }
            return weighted[weighted.length - 1].club;
        };

        const pickWinner = (
            pool: Club[], 
            userWon: boolean, 
            cupTypeOrExcludeId?: 'cl' | 'el' | 'ecl' | 'dom' | number | string,
            excludeIdOrWinnerName?: number | string, 
            confirmedWinnerNameOrId?: number | string, 
            confirmedWinnerIdArg?: number | string
        ): Club => {
            if (userWon) return userClub;

            let cupType: 'cl' | 'el' | 'ecl' | 'dom' = 'cl';
            let excludeId: number | string | undefined = undefined;
            let confirmedWinnerName: string | undefined = undefined;
            let confirmedWinnerId: number | string | undefined = undefined;

            if (cupTypeOrExcludeId === 'cl' || cupTypeOrExcludeId === 'el' || cupTypeOrExcludeId === 'ecl' || cupTypeOrExcludeId === 'dom') {
                cupType = cupTypeOrExcludeId;
                excludeId = excludeIdOrWinnerName;
                if (typeof confirmedWinnerNameOrId === 'string') {
                    confirmedWinnerName = confirmedWinnerNameOrId;
                }
                if (confirmedWinnerIdArg !== undefined) {
                    confirmedWinnerId = confirmedWinnerIdArg;
                } else if (typeof confirmedWinnerNameOrId === 'number') {
                    confirmedWinnerId = confirmedWinnerNameOrId;
                }
            } else {
                // Defensive fallback if called without cupType
                excludeId = cupTypeOrExcludeId;
                if (typeof excludeIdOrWinnerName === 'string') {
                    confirmedWinnerName = excludeIdOrWinnerName;
                } else if (typeof excludeIdOrWinnerName === 'number') {
                    confirmedWinnerId = excludeIdOrWinnerName;
                }
                if (typeof confirmedWinnerNameOrId === 'string') {
                    confirmedWinnerName = confirmedWinnerNameOrId;
                } else if (typeof confirmedWinnerNameOrId === 'number' && confirmedWinnerId === undefined) {
                    confirmedWinnerId = confirmedWinnerNameOrId;
                }
                if (confirmedWinnerIdArg !== undefined) {
                    confirmedWinnerId = confirmedWinnerIdArg;
                }
            }

            if (confirmedWinnerName || confirmedWinnerId !== undefined) {
                const normConfirmedName = typeof confirmedWinnerName === 'string' ? confirmedWinnerName.trim().toLowerCase() : '';
                const isConfirmedUser = (confirmedWinnerId !== undefined && (String(confirmedWinnerId) === String(userClub.id) || Number(confirmedWinnerId) === Number(userClub.id))) ||
                    (normConfirmedName && userClub.name && normConfirmedName === userClub.name.trim().toLowerCase());
                if (!isConfirmedUser) {
                    const matched = agedClubs.find(c => 
                        (confirmedWinnerId !== undefined && (String(c.id) === String(confirmedWinnerId) || Number(c.id) === Number(confirmedWinnerId))) || 
                        (normConfirmedName && c.name && c.name.trim().toLowerCase() === normConfirmedName)
                    );
                    if (matched && !isUserMatch(matched)) return matched;
                    if (confirmedWinnerName && typeof confirmedWinnerName === 'string') {
                        return {
                            id: confirmedWinnerId || 99990,
                            name: confirmedWinnerName,
                            baseOvr: 85,
                            tier: 1,
                            color: '#ef4444',
                            country: userClub.country || 'GER'
                        } as Club;
                    }
                }
            }
            return pickWeightedWinner(pool, cupType, excludeId);
        };

        // EHF Champions League: Strict Tier 1 only, drawing top clubs across all European leagues
        const clEliteOrHeritage = agedClubs.filter(c => 
            c.tier === 1 && 
            !isReserveClub(c.name) && 
            (c.baseOvr >= 87 || matchesHeritageCl(c.name))
        );
        const clPool = clEliteOrHeritage.length >= 8 
            ? clEliteOrHeritage 
            : agedClubs.filter(c => c.tier === 1 && !isReserveClub(c.name) && (c.baseOvr >= 80 || matchesHeritageCl(c.name)));
        const userWonCl = !clEliminated && Boolean((userTrophiesThisYear?.cl && !clEliminated) || (confirmedCl?.userWon && (confirmedCl.year === currentYear || !confirmedCl.year)));
        const clWinner = pickWinner(
            clPool.length > 0 ? clPool : agedClubs.filter(c => c.tier === 1), 
            userWonCl,
            'cl',
            clEliminated ? userClub.id : undefined,
            runClWinnerName,
            confirmedCl?.winnerId
        );
        if (clWinner.id !== userClub.id) {
            clWinner.baseOvr = Math.min(95, clWinner.baseOvr + 1); // EHF Champions League prestige boost
        }
        movements.unshift({
            id: `${clWinner.id}-${currentYear}-cup-cl`,
            year: currentYear,
            clubId: String(clWinner.id),
            clubName: clWinner.name,
            clubLogo: clWinner.logo,
            clubColor: clWinner.color,
            country: normalizeCountry(clWinner.country || 'GER'),
            type: 'intl_cup',
            fromTier: clWinner.tier || 1,
            toTier: clWinner.tier || 1,
            cupTitle: 'EHF Champions League',
            isKey: true
        });

        // Domestic National Cup
        const userNormCountry = normalizeCountry(userClub.country || 'GER');
        const domCupName = getFAInfo(userNormCountry).cup || 'National Cup';
        // Tier 2 European League Miracle Qualification (0.05%):
        const allowTier2DomesticCupMiracle = Math.random() < 0.0005;
        const domPool = agedClubs.filter(c => 
            (c.tier === 1 || (allowTier2DomesticCupMiracle && c.tier === 2)) && 
            !isReserveClub(c.name) && 
            normalizeCountry(c.country || 'GER') === userNormCountry
        );
        const userWonDom = !natCupEliminated && Boolean((userTrophiesThisYear?.dfb && !natCupEliminated) || (confirmedDomCup?.userWon && (confirmedDomCup.year === currentYear || !confirmedDomCup.year)));
        const domWinner = pickWinner(
            domPool.length > 0 ? domPool : agedClubs.filter(c => c.tier === 1 && normalizeCountry(c.country || 'GER') === userNormCountry), 
            userWonDom,
            'dom',
            natCupEliminated ? userClub.id : undefined,
            runDomWinnerName,
            confirmedDomCup?.winnerId
        );
        if (domWinner.id !== userClub.id) {
            const preSimOvr = worldClubsMap[domWinner.id]?.baseOvr ?? domWinner.baseOvr;
            domWinner.baseOvr = Math.min(95, Math.max(preSimOvr, domWinner.baseOvr) + 1); // Cup winner momentum
        }
        movements.unshift({
            id: `${domWinner.id}-${currentYear}-cup-dfb`,
            year: currentYear,
            clubId: String(domWinner.id),
            clubName: domWinner.name,
            clubLogo: domWinner.logo,
            clubColor: domWinner.color,
            country: userNormCountry,
            type: 'intl_cup',
            fromTier: domWinner.tier || 1,
            toTier: domWinner.tier || 1,
            cupTitle: confirmedDomCup?.cupName || domCupName,
            isKey: true
        });

        // Domestic Regional / Amateur Cup (when user competed or resolved a Regional Cup run)
        const runRegWinnerName = confirmedRegCup?.winnerName || relevantCupRuns.find(r => isRegionalCupRun(r) && r.won === false && r.winnerName)?.winnerName;
        if (userTrophiesThisYear?.reg || confirmedRegCup || regCupEliminated) {
            const defaultRegCupName = userNormCountry === 'GER' ? 'DHB-Amateurpokal' : 'Regional Cup';
            const userWonReg = !regCupEliminated && Boolean((userTrophiesThisYear?.reg && !regCupEliminated) || (confirmedRegCup?.userWon && (confirmedRegCup.year === currentYear || !confirmedRegCup.year)));
            const regPool = agedClubs.filter(c =>
                c.tier >= 2 &&
                !isReserveClub(c.name) &&
                normalizeCountry(c.country || 'GER') === userNormCountry
            );
            const regWinner = pickWinner(
                regPool.length > 0 ? regPool : agedClubs.filter(c => c.tier >= 2),
                userWonReg,
                'dom',
                regCupEliminated ? userClub.id : undefined,
                runRegWinnerName,
                confirmedRegCup?.winnerId
            );
            if (regWinner.id !== userClub.id) {
                const preSimOvr = worldClubsMap[regWinner.id]?.baseOvr ?? regWinner.baseOvr;
                regWinner.baseOvr = Math.min(90, Math.max(preSimOvr, regWinner.baseOvr) + 1);
            }
            movements.unshift({
                id: `${regWinner.id}-${currentYear}-cup-reg`,
                year: currentYear,
                clubId: String(regWinner.id),
                clubName: regWinner.name,
                clubLogo: regWinner.logo,
                clubColor: regWinner.color,
                country: userNormCountry,
                type: 'intl_cup',
                fromTier: regWinner.tier || 3,
                toTier: regWinner.tier || 3,
                cupTitle: confirmedRegCup?.cupName || defaultRegCupName,
                isKey: true
            });
        }

        // EHF European League:
        const tier2CupWinnerInEl = domWinner.tier === 2 ? domWinner : null;
        const elPool = agedClubs.filter(c => 
            (c.tier === 1 || (tier2CupWinnerInEl && c.id === tier2CupWinnerInEl.id)) && 
            !isReserveClub(c.name) && 
            (matchesHeritageEl(c.name) || (c.baseOvr >= 74 && c.baseOvr <= 92)) && 
            c.id !== clWinner.id
        );
        const userWonEl = !elEliminated && Boolean((userTrophiesThisYear?.el && !elEliminated) || (confirmedEl?.userWon && (confirmedEl.year === currentYear || !confirmedEl.year)));
        const elWinner = pickWinner(
            elPool.length > 0 ? elPool : agedClubs.filter(c => c.tier === 1 && c.id !== clWinner.id), 
            userWonEl, 
            'el',
            clWinner.id,
            runElWinnerName,
            confirmedEl?.winnerId
        );
        if (elWinner.id !== userClub.id) {
            elWinner.baseOvr = Math.min(94, elWinner.baseOvr + 1); // EHF EL prestige boost
        }
        movements.unshift({
            id: `${elWinner.id}-${currentYear}-cup-el`,
            year: currentYear,
            clubId: String(elWinner.id),
            clubName: elWinner.name,
            clubLogo: elWinner.logo,
            clubColor: elWinner.color,
            country: normalizeCountry(elWinner.country || 'GER'),
            type: 'intl_cup',
            fromTier: elWinner.tier || 1,
            toTier: elWinner.tier || 1,
            cupTitle: 'EHF European League',
            isKey: true
        });

        // EHF European Cup: Strict Tier 1 only
        const eclPool = agedClubs.filter(c => 
            c.tier === 1 && 
            !isReserveClub(c.name) && 
            (matchesHeritageEl(c.name) || (c.baseOvr >= 65 && c.baseOvr <= 82)) && 
            c.id !== clWinner.id && 
            c.id !== elWinner.id
        );
        const userWonEcl = !eclEliminated && Boolean((userTrophiesThisYear?.ecl && !eclEliminated) || (confirmedEcl?.userWon && (confirmedEcl.year === currentYear || !confirmedEcl.year)));
        const eclWinner = pickWinner(
            eclPool.length > 0 ? eclPool : agedClubs.filter(c => c.tier === 1 && c.id !== clWinner.id && c.id !== elWinner.id), 
            userWonEcl, 
            'ecl',
            elWinner.id,
            runEclWinnerName,
            confirmedEcl?.winnerId
        );
        if (eclWinner.id !== userClub.id) {
            eclWinner.baseOvr = Math.min(90, eclWinner.baseOvr + 1); // EHF EC prestige boost
        }
        movements.unshift({
            id: `${eclWinner.id}-${currentYear}-cup-ecl`,
            year: currentYear,
            clubId: String(eclWinner.id),
            clubName: eclWinner.name,
            clubLogo: eclWinner.logo,
            clubColor: eclWinner.color,
            country: normalizeCountry(eclWinner.country || 'GER'),
            type: 'intl_cup',
            fromTier: eclWinner.tier || 1,
            toTier: eclWinner.tier || 1,
            cupTitle: 'EHF European Cup',
            isKey: true
        });

        // IHF Super Globe (Intercontinental Club Championship)
        const userWonCwc = !cwcEliminated && Boolean((userTrophiesThisYear?.cwc && !cwcEliminated) || (confirmedCwc?.userWon && (confirmedCwc.year === currentYear || !confirmedCwc.year)));
        const sgWinner = userWonCwc
            ? userClub
            : runCwcWinnerName
            ? pickWinner(agedClubs.filter(c => !isReserveClub(c.name)), false, 'cl', cwcEliminated ? userClub.id : undefined, runCwcWinnerName, confirmedCwc?.winnerId)
            : (Math.random() < 0.65 ? (clWinner.id === userClub.id && !userWonCwc ? pickWinner(agedClubs.filter(c => c.id !== userClub.id && !isReserveClub(c.name)), false, 'cl') : clWinner) : pickWinner(clPool.length > 0 ? clPool : agedClubs.filter(c => c.tier === 1), false, 'cl', clWinner.id));
        movements.unshift({
            id: `${sgWinner.id}-${currentYear}-cup-cwc`,
            year: currentYear,
            clubId: String(sgWinner.id),
            clubName: sgWinner.name,
            clubLogo: sgWinner.logo,
            clubColor: sgWinner.color,
            country: normalizeCountry(sgWinner.country || 'GER'),
            type: 'intl_cup',
            fromTier: sgWinner.tier || 1,
            toTier: sgWinner.tier || 1,
            cupTitle: 'IHF Super Globe',
            isKey: true
        });

    // Intercept/re-roll any UniverseMovement of type intl_cup that incorrectly crowns the user's club if eliminated
    const sanitizedMovements = movements.map(m => {
        if (m.type === 'intl_cup') {
            const isUserClub = Boolean(
                (m.clubName && userClub.name && m.clubName.trim().toLowerCase() === userClub.name.trim().toLowerCase()) ||
                (userClub.id !== undefined && m.clubId !== undefined && (String(m.clubId) === String(userClub.id) || Number(m.clubId) === Number(userClub.id)))
            );
            if (isUserClub) {
                const title = (m.cupTitle || '').toLowerCase();
                const isNatCup = (title.includes('pokal') || title.includes('cup') || title.includes('copa') || title.includes('coupe') || title.includes('puchar') || title.includes('kupa') || title.includes('kup') || title.includes('coppa') || title.includes('cupa') || title.includes('cupen') || title.includes('taça') || title.includes('taca') || title.includes('bikar') || title.includes('nm')) &&
                    !title.includes('amateur') && !title.includes('regional') && !title.includes('super globe') && !title.includes('champions league') && !title.includes('european');
                const isRegCup = title.includes('amateur') || title.includes('regional');
                const isCwc = title.includes('super globe') || title.includes('club world');
                const isCl = title.includes('champions league') || (title.includes('champions') && !title.includes('super globe'));
                const isEl = title.includes('european league') || title.includes('euro league');
                const isEcl = title.includes('european cup');

                if ((isNatCup && natCupEliminated) || (isRegCup && regCupEliminated) || (isCwc && cwcEliminated) || (isCl && clEliminated) || (isEl && elEliminated) || (isEcl && eclEliminated)) {
                    // Re-roll to an authentic AI club from the eligible competition tier
                    const validAiClubs = agedClubs.filter(c => 
                        String(c.id) !== String(userClub.id) && 
                        c.name.trim().toLowerCase() !== userClub.name.trim().toLowerCase() &&
                        !isReserveClub(c.name) && 
                        normalizeCountry(c.country || 'GER') === normalizeCountry(m.country || userClub.country || 'GER') && 
                        (isRegCup ? (c.tier || 1) > 1 : isNatCup ? (c.tier || 1) <= 2 : (c.tier === 1 || c.tier === (m.fromTier || 1)))
                    );
                    const fallbackPool = validAiClubs.length > 0 
                        ? validAiClubs 
                        : agedClubs.filter(c => String(c.id) !== String(userClub.id) && c.name.trim().toLowerCase() !== userClub.name.trim().toLowerCase() && !isReserveClub(c.name) && (isRegCup ? (c.tier || 1) > 1 : true));
                    const fallbackClub = fallbackPool[Math.floor(Math.random() * fallbackPool.length)] || baseList.find(c => String(c.id) !== String(userClub.id) && c.name.trim().toLowerCase() !== userClub.name.trim().toLowerCase() && !isReserveClub(c.name)) || baseList.find(c => String(c.id) !== String(userClub.id)) || baseList[0] || ALL_CLUBS[0];
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

    // 5. Finalize World Clubs Map (strip static lore strings on AI clubs to prevent storage bloat over long careers)
    const newWorldClubs: Record<string, Club> = {};
    agedClubs.forEach(c => {
        if (c.id !== userClub.id) {
            const { historicContext: _hc, context: _ctx, ...compactAiClub } = c;
            newWorldClubs[c.id] = { ...compactAiClub, tier: nextTiers.get(c.id) || c.tier };
        } else {
            // User club is strictly preserved as-is from state
            newWorldClubs[c.id] = { ...userClub };
        }
    });

    return { newWorldClubs, movements: sanitizedMovements, insolventClubs };
}
