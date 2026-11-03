import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { GameState, calculateCohortRating } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, isAnyModActive, mergeClubWithWorldState } from '../utils/modManager';
import { getBroadcastingPackage } from '../data/broadcastingPackages';
import { useModalDismiss } from '../utils/modalUtils';
import { ClubLogo } from './ClubLogo';
import { BroadcastLogo } from './BroadcastLogo';
import { TrophyGraphic } from './TrophyGraphic';
import { triggerRealisticConfetti } from '../utils/confettiHelper';

interface Match {
    id: string;
    home: string;
    away: string;
    homeScore: number | null;
    awayScore: number | null;
    homeOvr: number;
    awayOvr: number;
    winner?: string;
    isPlayerMatch: boolean;
    mvpName?: string;
    mvpGoals?: number;
}

interface YouthChampionshipModalProps {
    state: GameState;
    onClose: () => void;
    onComplete: (wonTitle: boolean) => void;
}

export const YouthChampionshipModal: React.FC<YouthChampionshipModalProps> = ({ state, onClose, onComplete }) => {
    const t = (en: string, _de?: string) => en;

    const [round, setRound] = useState<0 | 1 | 2 | 3>(0); // 0: QF ready, 1: QF done, 2: SF done, 3: Final done
    const [qfMatches, setQfMatches] = useState<Match[]>([]);
    const [sfMatches, setSfMatches] = useState<Match[]>([]);
    const [finalMatch, setFinalMatch] = useState<Match | null>(null);
    const [champion, setChampion] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const hasCompletedRef = useRef(false);

    const handleCloseModal = () => {
        if (!hasCompletedRef.current && round >= 1) {
            hasCompletedRef.current = true;
            onComplete(false);
        }
        onClose();
    };
    useModalDismiss(handleCloseModal);

    const activeCohort = (state.youthPipeline || []).filter(p => !p.isLoanedOut);
    const pipelineCount = activeCohort.length;
    const academyLvl = state.club.academyLevel || state.club.youthAcademy || 1;
    const playerOvr = calculateCohortRating(
        state.club.baseOvr || 70,
        academyLvl,
        state.youthPipeline || []
    );

    const country = (state.club.country || 'GER').trim().toUpperCase();
    const isModActive = isAnyModActive();
    const youthBroadcastPkg = useMemo(() => {
        return getBroadcastingPackage(country, false, {
            type: 'regional_cup',
            tier: Math.max(3, state.club.tier || 3),
            year: state.year || 2024,
            clubName: state.club.name,
            isModActive,
        });
    }, [country, state.club.tier, state.year, state.club.name, isModActive]);

    const pickStarProspectName = () => {
        if (activeCohort.length === 0) return 'U19 Captain';
        const sorted = [...activeCohort].sort((a, b) => (b.boost || 1) - (a.boost || 1));
        const pool = sorted.slice(0, Math.min(3, sorted.length));
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return chosen?.name || 'U19 Captain';
    };

    useEffect(() => {
        if (pipelineCount < 6) return;
        const mergedClubs = getActiveClubs(country).map(c => mergeClubWithWorldState(c, state.worldClubs?.[c.id]));
        let aiClubs = mergedClubs.filter(c => (c.country || 'GER').trim().toUpperCase() === country && c.id !== state.club.id && !/\s(II|B)$/i.test(c.name))
            .sort((a, b) => a.tier - b.tier)
            .slice(0, 7)
            .map(c => {
                const aiSeniorOvr = c.baseOvr || 65;
                const aiU19Ovr = Math.max(50, Math.min(aiSeniorOvr - 2, Math.round(aiSeniorOvr * 0.74 + Math.floor(Math.random() * 8))));
                return { name: c.name + ' U19', ovr: aiU19Ovr, isPlayer: false };
            });

        if (aiClubs.length < 7) {
            const extraClubs = mergedClubs.filter(c => c.id !== state.club.id && !aiClubs.some(ac => ac.name.startsWith(c.name)))
                .slice(0, 7 - aiClubs.length)
                .map(c => {
                    const aiSeniorOvr = c.baseOvr || 65;
                    const aiU19Ovr = Math.max(50, Math.min(aiSeniorOvr - 2, Math.round(aiSeniorOvr * 0.74 + Math.floor(Math.random() * 8))));
                    return { name: c.name + ' U19', ovr: aiU19Ovr, isPlayer: false };
                });
            aiClubs = [...aiClubs, ...extraClubs];
        }

        const playerTeam = { name: state.club.name + ' U19', ovr: playerOvr, isPlayer: true };
        const allBracket = [playerTeam, ...aiClubs].sort(() => Math.random() - 0.5);

        const matches: Match[] = [];
        for (let i = 0; i < 4; i++) {
            matches.push({
                id: `qf-${i}`,
                home: allBracket[i * 2].name,
                away: allBracket[i * 2 + 1].name,
                homeOvr: allBracket[i * 2].ovr,
                awayOvr: allBracket[i * 2 + 1].ovr,
                homeScore: null,
                awayScore: null,
                isPlayerMatch: allBracket[i * 2].isPlayer || allBracket[i * 2 + 1].isPlayer
            });
        }
        setQfMatches(matches);
    }, [pipelineCount]);

    const simulateMatch = (m: Match): Match => {
        const diff = m.homeOvr - m.awayOvr;
        const absDiff = Math.abs(diff);

        const paceRoll = Math.random();
        let baseGoals = 26;
        if (paceRoll < 0.20) {
            baseGoals = 20 + Math.floor(Math.random() * 5);
        } else if (paceRoll < 0.75) {
            baseGoals = 25 + Math.floor(Math.random() * 6);
        } else {
            baseGoals = 31 + Math.floor(Math.random() * 5);
        }

        let targetSpread = 1;
        const spreadRoll = Math.random();
        if (absDiff <= 3) {
            if (spreadRoll < 0.50) targetSpread = 1;
            else if (spreadRoll < 0.85) targetSpread = 2;
            else targetSpread = 3 + (Math.random() < 0.5 ? 0 : 1);
        } else if (absDiff <= 7) {
            if (spreadRoll < 0.25) targetSpread = 1 + Math.floor(Math.random() * 2);
            else if (spreadRoll < 0.75) targetSpread = 3 + Math.floor(Math.random() * 4);
            else targetSpread = 7 + Math.floor(Math.random() * 2);
        } else if (absDiff <= 13) {
            if (spreadRoll < 0.15) targetSpread = 2 + Math.floor(Math.random() * 3);
            else if (spreadRoll < 0.60) targetSpread = 5 + Math.floor(Math.random() * 5);
            else targetSpread = 10 + Math.floor(Math.random() * 5);
        } else {
            if (spreadRoll < 0.10) targetSpread = 5 + Math.floor(Math.random() * 4);
            else if (spreadRoll < 0.60) targetSpread = 10 + Math.floor(Math.random() * 5);
            else targetSpread = 15 + Math.floor(Math.random() * 4);
        }

        const winProb = Math.max(0.1, Math.min(0.9, 0.5 + diff * 0.03));
        const homeWins = Math.random() < winProb;

        let winnerScore = Math.round(baseGoals + targetSpread / 2);
        let loserScore = winnerScore - targetSpread;

        if (loserScore < 18) {
            const adj = 18 - loserScore;
            loserScore = 18;
            winnerScore += adj;
        }
        if (winnerScore > 38) {
            const excess = winnerScore - 38;
            winnerScore = 38;
            loserScore = Math.max(18, loserScore - excess);
        }

        const homeGoals = homeWins ? winnerScore : loserScore;
        const awayGoals = homeWins ? loserScore : winnerScore;
        const winner = homeGoals > awayGoals ? m.home : m.away;

        return {
            ...m,
            homeScore: homeGoals,
            awayScore: awayGoals,
            winner,
            mvpName: m.isPlayerMatch ? pickStarProspectName() : undefined,
            mvpGoals: m.isPlayerMatch ? 6 + Math.floor(Math.random() * 6) : undefined
        };
    };

    const playNextRound = () => {
        if (isSimulating) return;
        setIsSimulating(true);

        setTimeout(() => {
            if (round === 0) {
                const played = qfMatches.map(simulateMatch);
                setQfMatches(played);

                const nextSf = [
                    { id: 'sf-0', home: played[0].winner!, away: played[1].winner!, homeOvr: played[0].homeScore! > played[0].awayScore! ? played[0].homeOvr : played[0].awayOvr, awayOvr: played[1].homeScore! > played[1].awayScore! ? played[1].homeOvr : played[1].awayOvr, homeScore: null, awayScore: null, isPlayerMatch: played[0].winner === state.club.name + ' U19' || played[1].winner === state.club.name + ' U19' },
                    { id: 'sf-1', home: played[2].winner!, away: played[3].winner!, homeOvr: played[2].homeScore! > played[2].awayScore! ? played[2].homeOvr : played[2].awayOvr, awayOvr: played[3].homeScore! > played[3].awayScore! ? played[3].homeOvr : played[3].awayOvr, homeScore: null, awayScore: null, isPlayerMatch: played[2].winner === state.club.name + ' U19' || played[3].winner === state.club.name + ' U19' }
                ];
                setSfMatches(nextSf);
                if (!nextSf.some(m => m.isPlayerMatch) && !hasCompletedRef.current) {
                    hasCompletedRef.current = true;
                    onComplete(false);
                }
                setRound(1);
            } else if (round === 1) {
                const played = sfMatches.map(simulateMatch);
                setSfMatches(played);

                const nextFinal = {
                    id: 'fin-0', home: played[0].winner!, away: played[1].winner!, homeOvr: played[0].homeScore! > played[0].awayScore! ? played[0].homeOvr : played[0].awayOvr, awayOvr: played[1].homeScore! > played[1].awayScore! ? played[1].homeOvr : played[1].awayOvr, homeScore: null, awayScore: null, isPlayerMatch: played[0].winner === state.club.name + ' U19' || played[1].winner === state.club.name + ' U19'
                };
                setFinalMatch(nextFinal);
                if (!nextFinal.isPlayerMatch && !hasCompletedRef.current) {
                    hasCompletedRef.current = true;
                    onComplete(false);
                }
                setRound(2);
            } else if (round === 2) {
                const played = simulateMatch(finalMatch!);
                setFinalMatch(played);
                setChampion(played.winner!);
                setRound(3);
                const wonTitle = played.winner === state.club.name + ' U19';
                if (wonTitle) {
                    try {
                        triggerRealisticConfetti();
                        setTimeout(triggerRealisticConfetti, 400);
                    } catch (err) {
                        console.error('Confetti trigger error:', err);
                    }
                    hasCompletedRef.current = true;
                    onComplete(true);
                } else if (!hasCompletedRef.current) {
                    hasCompletedRef.current = true;
                    onComplete(false);
                }
            }
            setIsSimulating(false);
        }, 200);
    };

    const getClubForTeam = (teamU19Name: string) => {
        const isPlayer = teamU19Name === state.club.name + ' U19' || teamU19Name.toLowerCase().startsWith(state.club.name.toLowerCase());
        if (isPlayer) {
            return {
                name: state.club.name,
                logo: state.club.logo,
                fallbackLogo: state.club.fallbackLogo,
                color: state.club.color,
                isPlayer: true
            };
        }
        const cleanName = teamU19Name.replace(/\s+U19$/i, '').trim();
        const activeClubs = getActiveClubs(state.club?.country);
        const modActive = isAnyModActive();
        const matched = activeClubs.find(c => c.name.toLowerCase() === cleanName.toLowerCase()) ||
                        activeClubs.find(c => c.name.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(c.name.toLowerCase())) ||
                        ALL_CLUBS.find(c => c.name.toLowerCase() === cleanName.toLowerCase()) ||
                        ALL_CLUBS.find(c => c.name.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(c.name.toLowerCase()));
        return {
            name: cleanName,
            logo: modActive ? matched?.logo : undefined,
            fallbackLogo: modActive ? matched?.fallbackLogo : undefined,
            color: matched?.color,
            isPlayer: false
        };
    };

    const renderMatch = (m: Match, idx: number) => {
        const homeClub = getClubForTeam(m.home);
        const awayClub = getClubForTeam(m.away);
        const isHomePlayer = m.home === state.club.name + ' U19';
        const isAwayPlayer = m.away === state.club.name + ' U19';
        const hasPlayed = m.homeScore !== null && m.awayScore !== null;
        const homeWon = hasPlayed && m.homeScore! > m.awayScore!;
        const awayWon = hasPlayed && m.awayScore! > m.homeScore!;

        return (
            <motion.div
                key={`yc-match-${m.id}-${m.home}-${m.away}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.03 }}
                className={`rounded-2xl p-3.5 border transition-all ${
                    m.isPlayerMatch
                        ? 'bg-[#10121a] border-amber-500/25'
                        : 'bg-[#10121a] border-white/[0.04]'
                }`}
            >
                <div className="flex flex-col gap-1.5">
                    {/* Home Row */}
                    <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl transition ${homeWon ? 'bg-[#181924]' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ClubLogo
                                name={homeClub.name}
                                logo={homeClub.logo}
                                fallbackLogo={homeClub.fallbackLogo}
                                color={homeClub.color}
                                className="w-4 h-4 object-contain shrink-0"
                                fallbackClassName="w-4 h-4 text-[7px] rounded border border-white/10 flex items-center justify-center font-medium text-white shrink-0"
                            />
                            <span className={`text-xs truncate ${
                                isHomePlayer ? 'text-amber-400 font-semibold' : homeWon ? 'text-white font-semibold' : 'text-zinc-300'
                            }`}>
                                {m.home}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 tabular-nums shrink-0">
                                {m.homeOvr}
                            </span>
                        </div>
                        <div className={`w-7 h-6 rounded-lg flex items-center justify-center font-mono font-semibold tabular-nums text-xs shrink-0 ${
                            homeWon
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : hasPlayed
                                ? 'text-zinc-500 bg-white/[0.02]'
                                : 'text-zinc-600'
                        }`}>
                            {hasPlayed ? m.homeScore : '-'}
                        </div>
                    </div>

                    {/* Away Row */}
                    <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl transition ${awayWon ? 'bg-[#181924]' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ClubLogo
                                name={awayClub.name}
                                logo={awayClub.logo}
                                fallbackLogo={awayClub.fallbackLogo}
                                color={awayClub.color}
                                className="w-4 h-4 object-contain shrink-0"
                                fallbackClassName="w-4 h-4 text-[7px] rounded border border-white/10 flex items-center justify-center font-medium text-white shrink-0"
                            />
                            <span className={`text-xs truncate ${
                                isAwayPlayer ? 'text-amber-400 font-semibold' : awayWon ? 'text-white font-semibold' : 'text-zinc-300'
                            }`}>
                                {m.away}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 tabular-nums shrink-0">
                                {m.awayOvr}
                            </span>
                        </div>
                        <div className={`w-7 h-6 rounded-lg flex items-center justify-center font-mono font-semibold tabular-nums text-xs shrink-0 ${
                            awayWon
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : hasPlayed
                                ? 'text-zinc-500 bg-white/[0.02]'
                                : 'text-zinc-600'
                        }`}>
                            {hasPlayed ? m.awayScore : '-'}
                        </div>
                    </div>

                    {m.isPlayerMatch && hasPlayed && m.mvpName && (
                        <div className="pt-1.5 mt-0.5 border-t border-white/[0.04] px-2 flex items-center justify-between text-[10px] text-zinc-400">
                            <span className="flex items-center gap-1">
                                <i className="fas fa-star text-amber-400 text-[9px]" />
                                <span>MVP: <strong className="text-white font-medium">{m.mvpName}</strong></span>
                            </span>
                            <span className="font-mono text-amber-400 tabular-nums">{m.mvpGoals} goals</span>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    const stages = [
        { key: 0, label: 'Quarter-Finals' },
        { key: 1, label: 'Semi-Finals' },
        { key: 2, label: 'Grand Final' },
    ];

    return (
        <div
            onClick={handleCloseModal}
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl cursor-pointer overflow-y-auto"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[#14151e] rounded-[28px] border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] my-auto relative cursor-default"
            >
                {/* Top Ambient Hairline */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent pointer-events-none" />

                {/* Top Broadcast Partner Bar */}
                <div className="w-full px-5 py-2 bg-[#10121a] border-b border-white/[0.04] flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">
                            U19 NATIONAL SHOWCASE · LIVE COVERAGE
                        </span>
                    </div>
                    <BroadcastLogo packageOrKey={youthBroadcastPkg} size="xs" isModActive={isModActive} />
                </div>

                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 pb-3 border-b border-white/[0.04] shrink-0 bg-[#14151e]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                            <TrophyGraphic size="sm" type="league" showStars={false} className="scale-75" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 leading-none mb-1">
                                {round === 0 ? 'QUARTER-FINALS' : round === 1 ? 'SEMI-FINALS' : round === 2 ? 'GRAND FINAL' : 'TOURNAMENT COMPLETE'}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none">
                                {t('U19 National Cup', 'U19-Meisterschaft')}
                            </h2>
                        </div>
                    </div>

                    {/* Stage Stepper + Close */}
                    <div className="flex items-center gap-2.5">
                        <div className="hidden sm:flex items-center gap-1 bg-[#10121a] border border-white/[0.04] p-1 rounded-xl">
                            {stages.map((st) => {
                                const isActive = round === st.key || (st.key === 2 && round === 3);
                                const isDone = round > st.key;
                                return (
                                    <span
                                        key={st.key}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition ${
                                            isActive
                                                ? 'bg-[#181924] text-amber-400 border border-white/[0.06]'
                                                : isDone
                                                ? 'text-emerald-400'
                                                : 'text-zinc-500'
                                        }`}
                                    >
                                        {st.label}
                                    </span>
                                );
                            })}
                        </div>
                        <button
                            aria-label="Close modal"
                            onClick={handleCloseModal}
                            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer active:scale-95"
                        >
                            <i className="fas fa-xmark text-sm" />
                        </button>
                    </div>
                </div>

                {/* Your U19 Squad Strip */}
                <div className="px-5 pt-4 shrink-0">
                    <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <ClubLogo
                                name={state.club.name}
                                logo={state.club.logo}
                                fallbackLogo={state.club.fallbackLogo}
                                color={state.club.color}
                                className="w-8 h-8 object-contain shrink-0"
                                fallbackClassName="w-8 h-8 text-[10px] rounded-xl border border-white/10 flex items-center justify-center font-bold text-white shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                        {state.club.name} U19
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-amber-400 tabular-nums">
                                        {playerOvr} OVR
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    {activeCohort.slice(0, 6).map((p, i) => (
                                        <span
                                            key={`u19-pill-${i}`}
                                            className="text-[10px] font-mono text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded truncate max-w-[100px]"
                                        >
                                            {p.position} {(p.name || '').split(' ').slice(-1)[0]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="text-right shrink-0 hidden sm:block">
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                TITLE REWARD
                            </div>
                            <div className="text-xs font-mono text-emerald-400 mt-0.5">
                                +1 Senior OVR · +15 Morale
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bracket Body */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                    {/* Champion Banner */}
                    {round === 3 && champion && (
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`rounded-2xl p-5 text-center border flex flex-col items-center ${
                                champion === state.club.name + ' U19'
                                    ? 'bg-[#10121a] border-amber-500/30'
                                    : 'bg-[#10121a] border-white/[0.04]'
                            }`}
                        >
                            <TrophyGraphic size="md" type="league" showStars={true} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                                U19 NATIONAL CHAMPIONS
                            </span>
                            <h3 className="text-xl sm:text-2xl font-semibold text-white mt-0.5">
                                {champion}
                            </h3>
                            {champion === state.club.name + ' U19' && (
                                <span className="mt-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 font-medium">
                                    +1 Senior Squad OVR & +15 Morale Awarded!
                                </span>
                            )}
                        </motion.div>
                    )}

                    {/* Grand Final */}
                    {round >= 2 && finalMatch && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                                <i className="fas fa-crown text-[9px]" />
                                <span>GRAND FINAL</span>
                            </div>
                            {renderMatch(finalMatch, 0)}
                        </div>
                    )}

                    {/* Semi-Finals */}
                    {round >= 1 && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                SEMI-FINALS
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {sfMatches.map((m, idx) => renderMatch(m, idx))}
                            </div>
                        </div>
                    )}

                    {/* Quarter-Finals */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            QUARTER-FINALS
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {qfMatches.map((m, idx) => renderMatch(m, idx))}
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="p-4 border-t border-white/[0.04] bg-[#10121a] shrink-0">
                    {round < 3 ? (
                        <button
                            onClick={playNextRound}
                            disabled={isSimulating}
                            className="w-full py-2.5 px-5 rounded-xl bg-[#181924] hover:bg-white/[0.08] border border-amber-500/30 disabled:opacity-50 text-amber-300 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                        >
                            <i className={`fas ${isSimulating ? 'fa-spinner fa-spin' : 'fa-play'} text-xs`} />
                            <span>
                                {round === 0 ? t('Play Quarter-Finals', 'Viertelfinale spielen') :
                                 round === 1 ? t('Play Semi-Finals', 'Halbfinale spielen') :
                                 t('Play Grand Final', 'Finale spielen')}
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={handleCloseModal}
                            className="w-full py-2.5 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] font-medium text-xs sm:text-sm transition active:scale-[0.99] cursor-pointer"
                        >
                            {t('Back to Youth Academy', 'Zurück zur Akademie')}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
