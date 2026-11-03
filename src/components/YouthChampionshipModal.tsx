import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, calculateCohortRating } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, isAnyModActive, mergeClubWithWorldState } from '../utils/modManager';
import { useModalDismiss } from '../utils/modalUtils';
import { ClubLogo } from './ClubLogo';
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
}

interface YouthChampionshipModalProps {
    state: GameState;
    onClose: () => void;
    onComplete: (wonTitle: boolean) => void;
}

export const YouthChampionshipModal: React.FC<YouthChampionshipModalProps> = ({ state, onClose, onComplete }) => {
    const t = (en: string, _de?: string) => en;
    
    const [intro, setIntro] = useState(true);
    const [round, setRound] = useState<0 | 1 | 2 | 3>(0); // 0: Init, 1: QF done, 2: SF done, 3: Final done
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

    const pipelineCount = (state.youthPipeline || []).filter(p => !p.isLoanedOut).length;
    const academyLvl = state.club.academyLevel || state.club.youthAcademy || 1;
    const playerOvr = calculateCohortRating(
        state.club.baseOvr || 70,
        academyLvl,
        state.youthPipeline || []
    );

    useEffect(() => {
        if (pipelineCount < 6) return;
        const country = (state.club.country || 'GER').trim().toUpperCase();
        const mergedClubs = getActiveClubs(country).map(c => mergeClubWithWorldState(c, state.worldClubs?.[c.id]));
        let aiClubs = mergedClubs.filter(c => (c.country || 'GER').trim().toUpperCase() === country && c.id !== state.club.id && !/\s(II|B)$/i.test(c.name))
            .sort((a,b) => a.tier - b.tier)
            .slice(0, 7)
            .map(c => {
                const aiSeniorOvr = c.baseOvr || 65;
                // AI U19 rating logically scaled to youth level (senior * ~0.74 + variance)
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
        for(let i=0; i<4; i++) {
            matches.push({
                id: `qf-${i}`,
                home: allBracket[i*2].name,
                away: allBracket[i*2+1].name,
                homeOvr: allBracket[i*2].ovr,
                awayOvr: allBracket[i*2+1].ovr,
                homeScore: null,
                awayScore: null,
                isPlayerMatch: allBracket[i*2].isPlayer || allBracket[i*2+1].isPlayer
            });
        }
        setQfMatches(matches);
    }, [pipelineCount]);

    if (pipelineCount < 6) {
        return (
            <div 
                onClick={onClose}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl cursor-pointer"
            >
                <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-[0_25px_70px_rgba(0,0,0,0.85)] cursor-default"
                >
                    <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl">
                        <i className="fas fa-lock" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold text-white">{t('Full 6-Prospect Cohort Required', 'Vollständiger 6er U19-Kader erforderlich')}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            {t(
                                `You must have a full youth cohort of at least 6 prospects to enter the National Youth Championship. Currently you have ${pipelineCount}/6.`,
                                `Für die Teilnahme an der nationalen U19-Meisterschaft wird ein vollständiger Kader von mindestens 6 Talenten benötigt. Aktuell hast du ${pipelineCount}/6.`
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.04] text-white font-medium text-xs transition cursor-pointer"
                    >
                        {t('Back to Academy', 'Zurück zur Akademie')}
                    </button>
                </div>
            </div>
        );
    }

    const simulateMatch = (m: Match): Match => {
        const diff = m.homeOvr - m.awayOvr;
        const absDiff = Math.abs(diff);

        // Multi-tempo handball pace archetypes
        const paceRoll = Math.random();
        let baseGoals = 26;
        if (paceRoll < 0.20) {
            baseGoals = 20 + Math.floor(Math.random() * 5); // 20-24 defensive battle
        } else if (paceRoll < 0.75) {
            baseGoals = 25 + Math.floor(Math.random() * 6); // 25-30 standard pace
        } else {
            baseGoals = 31 + Math.floor(Math.random() * 5); // 31-35 shootout
        }

        // Multi-tiered goal spread distribution
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

        return { ...m, homeScore: homeGoals, awayScore: awayGoals, winner: homeGoals > awayGoals ? m.home : m.away };
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
        }, 320);
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

    const renderMatch = (m: Match, idx: number, stage: 'qf' | 'sf' | 'final') => {
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
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, delay: idx * 0.05 }}
                className={`relative overflow-hidden rounded-xl transition-all duration-300 border ${
                    m.isPlayerMatch 
                        ? 'border-amber-400/30 shadow-[0_0_18px_rgba(251,191,36,0.12)] bg-amber-500/[0.04]'
                        : 'border-white/[0.04] bg-[#181924] hover:border-white/[0.08]'
                }`}
            >
                {/* Glowing Golden Top Accent on Player Match */}
                {m.isPlayerMatch && (
                    <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                )}

                {/* Match Eyebrow / Tag */}
                <div className="flex items-center justify-between px-3 py-1 bg-white/[0.02] border-b border-white/[0.04] text-[9px] font-medium uppercase tracking-wider">
                    <span className="text-zinc-500">
                        {stage === 'qf' ? `Quarter-Final ${idx + 1}` : stage === 'sf' ? `Semi-Final ${idx + 1}` : 'Championship Grand Final'}
                    </span>
                    {m.isPlayerMatch ? (
                        <span className="text-amber-400 flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>YOUR FIXTURE</span>
                        </span>
                    ) : hasPlayed ? (
                        <span className="text-zinc-500">FT</span>
                    ) : (
                        <span className="text-zinc-600">Upcoming</span>
                    )}
                </div>

                {/* Broadcast Bracket Rows */}
                <div className="p-2 sm:p-2.5 flex flex-col gap-1.5">
                    {/* Home Team Row */}
                    <div className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg transition ${
                        homeWon ? 'bg-white/[0.03]' : ''
                    }`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ClubLogo
                                name={homeClub.name}
                                logo={homeClub.logo}
                                fallbackLogo={homeClub.fallbackLogo}
                                color={homeClub.color}
                                className="w-4 h-4 object-contain shrink-0"
                                fallbackClassName="w-4 h-4 text-[7px] rounded border border-white/10 flex items-center justify-center font-medium text-white shrink-0"
                            />
                            <span className={`text-xs truncate tracking-tight ${
                                isHomePlayer 
                                    ? 'text-amber-400 font-medium' 
                                    : homeWon 
                                        ? 'text-white font-medium' 
                                        : 'text-zinc-300 font-normal'
                            }`}>
                                {m.home}
                            </span>
                            {isHomePlayer && (
                                <span className="text-[8px] font-medium px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 uppercase shrink-0">
                                    YOU
                                </span>
                            )}
                        </div>
                        <div className={`w-8 h-7 rounded flex items-center justify-center font-medium tabular-nums text-sm shrink-0 border ${
                            homeWon
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : hasPlayed
                                    ? 'bg-black/20 text-zinc-500 border-white/[0.04]'
                                    : 'bg-white/[0.02] text-zinc-600 border-transparent'
                        }`}>
                            {hasPlayed ? (
                                <motion.span initial={{ scale: 1.35, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
                                    {m.homeScore}
                                </motion.span>
                            ) : '-'}
                        </div>
                    </div>

                    {/* Away Team Row */}
                    <div className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg transition ${
                        awayWon ? 'bg-white/[0.03]' : ''
                    }`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ClubLogo
                                name={awayClub.name}
                                logo={awayClub.logo}
                                fallbackLogo={awayClub.fallbackLogo}
                                color={awayClub.color}
                                className="w-4 h-4 object-contain shrink-0"
                                fallbackClassName="w-4 h-4 text-[7px] rounded border border-white/10 flex items-center justify-center font-medium text-white shrink-0"
                            />
                            <span className={`text-xs truncate tracking-tight ${
                                isAwayPlayer 
                                    ? 'text-amber-400 font-medium' 
                                    : awayWon 
                                        ? 'text-white font-medium' 
                                        : 'text-zinc-300 font-normal'
                            }`}>
                                {m.away}
                            </span>
                            {isAwayPlayer && (
                                <span className="text-[8px] font-medium px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 uppercase shrink-0">
                                    YOU
                                </span>
                            )}
                        </div>
                        <div className={`w-8 h-7 rounded flex items-center justify-center font-medium tabular-nums text-sm shrink-0 border ${
                            awayWon
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : hasPlayed
                                    ? 'bg-black/20 text-zinc-500 border-white/[0.04]'
                                    : 'bg-white/[0.02] text-zinc-600 border-transparent'
                        }`}>
                            {hasPlayed ? (
                                <motion.span initial={{ scale: 1.35, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
                                    {m.awayScore}
                                </motion.span>
                            ) : '-'}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div 
            onClick={handleCloseModal}
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl cursor-pointer overflow-y-auto"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl lg:max-w-3xl bg-[#14151e] rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col h-auto max-h-[92vh] my-auto relative cursor-default"
            >
                {/* Top Ambient Glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

                {intro ? (
                    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                        {/* Invitation Header Banner */}
                        <div className="p-5 sm:p-7 text-center flex flex-col items-center gap-3 border-b border-white/[0.04] bg-white/[0.01]">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-medium uppercase tracking-widest shadow-sm">
                                <i className="fas fa-envelope-open-text text-amber-400 text-xs" />
                                <span>Official Tournament Invitation</span>
                            </div>
                            
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-400 text-2xl sm:text-3xl my-1">
                                <i className="fas fa-trophy drop-shadow" />
                            </div>
                            
                            <div className="flex flex-col">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
                                    {t('National Youth Championship', 'Nationale U19-Meisterschaft')}
                                </h2>
                                <span className="text-xs text-zinc-400 mt-1">
                                    {t('Premier U19 Academy Showpiece Tournament', 'Spitzen-Akademieturnier für U19-Nachwuchs')}
                                </span>
                            </div>
                            
                            <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed max-w-md">
                                {t(
                                    `Your complete academy cohort at ${state.club.name} has qualified for the premier national knockout tournament. Eight elite academies will battle for the coveted National U19 Crown.`,
                                    `Deine Nachwuchsakademie von ${state.club.name} hat sich für das wichtigste nationale U19-K.o.-Turnier qualifiziert. Acht Top-Akademien kämpfen um die nationale U19-Krone.`
                                )}
                            </p>
                        </div>

                        {/* Bento Boxes: Tournament Rules & Academy Readiness */}
                        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 flex-1">
                            {/* Bento 1: Tournament Rules */}
                            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-4 flex flex-col justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 text-sky-400 text-[10px] font-medium uppercase tracking-wider mb-2">
                                        <i className="fas fa-scale-balanced" />
                                        <span>Tournament Rules</span>
                                    </div>
                                    <div className="text-sm font-semibold text-white tracking-tight mb-2">
                                        Single-Leg Knockout Format
                                    </div>
                                    <ul className="text-xs text-zinc-300 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <i className="fas fa-check-circle text-sky-400 text-[11px] mt-0.5 shrink-0" />
                                            <span>3 Knockout Rounds: Quarter-Finals, Semi-Finals, Grand Final.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fas fa-trophy text-amber-400 text-[11px] mt-0.5 shrink-0" />
                                            <span>Champions secure a permanent <strong>U19 National Trophy</strong> in the club cabinet.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fas fa-arrow-trend-up text-emerald-400 text-[11px] mt-0.5 shrink-0" />
                                            <span>Winning title boosts senior team morale (+15) and team development (+1 OVR).</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Bento 2: Academy Standing */}
                            <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-4 flex flex-col justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 text-amber-400 text-[10px] font-medium uppercase tracking-wider mb-2">
                                        <i className="fas fa-graduation-cap" />
                                        <span>Academy Readiness</span>
                                    </div>
                                    <div className="text-sm font-semibold text-white tracking-tight mb-2">
                                        {state.club.name} U19 Roster
                                    </div>
                                    <div className="flex flex-col gap-2 text-xs">
                                        <div className="flex justify-between items-center bg-[#14151e] rounded-xl p-2 border border-white/[0.04]">
                                            <span className="text-zinc-400">Prospects Enrolled:</span>
                                            <span className="text-emerald-400 font-medium tabular-nums flex items-center gap-1">
                                                <i className="fas fa-check text-[10px]" />
                                                <span>{pipelineCount}/6 (Full Cohort)</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#14151e] rounded-xl p-2 border border-white/[0.04]">
                                            <span className="text-zinc-400">Cohort Rating:</span>
                                            <span className="text-sky-300 font-medium tabular-nums">{playerOvr} OVR</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#14151e] rounded-xl p-2 border border-white/[0.04]">
                                            <span className="text-zinc-400">Academy Facility:</span>
                                            <span className="text-sky-300 font-medium tabular-nums">Level {academyLvl}/5</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#14151e] rounded-xl p-2 border border-white/[0.04]">
                                            <span className="text-zinc-400">Current U19 Cabinet:</span>
                                            <span className="text-amber-300 font-medium tabular-nums">{state.youthTitlesWon || 0} Titles Won</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action CTA */}
                        <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] flex items-center gap-3 shrink-0">
                            <button
                                onClick={onClose}
                                className="w-1/3 py-3 rounded-2xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition active:scale-[0.99] cursor-pointer"
                            >
                                {t('Decline', 'Ablehnen')}
                            </button>
                            <button
                                onClick={() => setIntro(false)}
                                className="w-2/3 py-3 px-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.06] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                            >
                                <i className="fas fa-play text-xs text-amber-400" />
                                <span>{t('Enter Tournament Bracket', 'Turnier starten')}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                    {/* Top Broadcast Bar */}
                    <div className="p-4 sm:p-5 border-b border-white/[0.04] flex items-center justify-between shrink-0 bg-white/[0.01]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-base border border-amber-500/20 shadow-sm">
                                <i className="fas fa-trophy" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-tight">
                                        {t('National Youth Championship', 'U19-Meisterschaft')}
                                    </h2>
                                    <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                        {round === 0 ? 'Quarter-Finals' : round === 1 ? 'Semi-Finals' : round === 2 ? 'Grand Final' : 'Final Standings'}
                                    </span>
                                </div>
                                <span className="text-[11px] text-zinc-400">
                                    {t('Knockout Bracket · Elite U19 Academies', 'K.o.-Runde · Elite U19-Akademien')}
                                </span>
                            </div>
                        </div>
                        <button 
                            aria-label="Close modal"
                            onClick={handleCloseModal}
                            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
                        >
                            <i className="fas fa-xmark text-sm" />
                        </button>
                    </div>

                    {/* Stage Progress Indicator */}
                    <div className="px-4 py-2 border-b border-white/[0.04] bg-black/20 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500 shrink-0">
                        <span className={round >= 0 ? 'text-sky-400 flex items-center gap-1' : ''}>
                            <i className={`fas ${round > 0 ? 'fa-check text-emerald-400' : 'fa-circle-dot'}`} /> 1. Quarter-Finals
                        </span>
                        <i className="fas fa-chevron-right text-[8px] opacity-40" />
                        <span className={round >= 1 ? 'text-sky-400 flex items-center gap-1' : ''}>
                            <i className={`fas ${round > 1 ? 'fa-check text-emerald-400' : round === 1 ? 'fa-circle-dot' : 'fa-circle'}`} /> 2. Semi-Finals
                        </span>
                        <i className="fas fa-chevron-right text-[8px] opacity-40" />
                        <span className={round >= 2 ? 'text-amber-400 flex items-center gap-1' : ''}>
                            <i className={`fas ${round === 3 ? 'fa-trophy text-amber-400' : round === 2 ? 'fa-circle-dot' : 'fa-circle'}`} /> 3. Championship Final
                        </span>
                    </div>
                    
                    {/* Bracket Content Body */}
                    <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                        {/* Quarter-Finals */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                                    Quarter-Finals (Single Leg)
                                </span>
                                <span className="text-[10px] text-zinc-500 tabular-nums">8 Teams</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {qfMatches.map((m, idx) => renderMatch(m, idx, 'qf'))}
                            </div>
                        </div>

                        {/* Semi-Finals */}
                        {round >= 1 && (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                                        Semi-Finals
                                    </span>
                                    <span className="text-[10px] text-zinc-500 tabular-nums">4 Teams</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {sfMatches.map((m, idx) => renderMatch(m, idx, 'sf'))}
                                </div>
                            </motion.div>
                        )}

                        {/* Grand Final */}
                        {round >= 2 && finalMatch && (
                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-medium uppercase tracking-widest text-amber-400 flex items-center gap-1">
                                        <i className="fas fa-trophy text-[9px]" />
                                        <span>Grand Final</span>
                                    </span>
                                    <span className="text-[10px] text-zinc-500">Championship Match</span>
                                </div>
                                <div className="max-w-md mx-auto">
                                    {renderMatch(finalMatch, 0, 'final')}
                                </div>
                            </motion.div>
                        )}

                        {/* Grand Final & Champion Reveal */}
                        {round === 3 && champion && (
                            champion === state.club.name + ' U19' ? (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0, y: 16 }} 
                                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                                    transition={{ type: 'spring', damping: 20, stiffness: 280 }}
                                    className="text-center pt-2"
                                >
                                    <div className="bg-[#181924] border border-amber-500/20 shadow-[0_10px_40px_rgba(245,158,11,0.1)] rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-3 shadow-sm">
                                            🏆
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                            <span className="text-[10px] font-medium uppercase tracking-widest text-amber-400">
                                                U19 NATIONAL CHAMPIONS
                                            </span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-2 text-white">
                                            {champion}
                                        </h2>
                                        <div className="text-xs font-medium uppercase tracking-wider text-zinc-200 mt-1 flex items-center gap-1.5 bg-white/[0.04] px-3.5 py-1 rounded-full border border-white/[0.06]">
                                            <i className="fas fa-sparkles text-amber-400 text-xs" />
                                            <span>Golden Generation Unlocked</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 font-normal max-w-sm mt-3 leading-relaxed">
                                            Permanent U19 Silverware captured! +1 OVR development boost awarded across the squad & +15 Morale.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0, y: 10 }} 
                                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                                    className="text-center pt-2"
                                >
                                    <div className="bg-[#181924] border border-white/[0.04] text-zinc-100 rounded-2xl p-5 shadow-xl flex flex-col items-center">
                                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-1">
                                            🏆 U19 NATIONAL CHAMPIONS
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-1">
                                            {champion}
                                        </h2>
                                        <span className="text-xs text-zinc-400 font-normal">
                                            {finalMatch?.isPlayerMatch
                                                ? 'Runners-Up · Valuable elite tournament experience gained'
                                                : sfMatches.some(m => m.isPlayerMatch)
                                                ? 'Semi-Finalists · Valuable elite tournament experience gained'
                                                : 'Quarter-Finalists · Valuable elite tournament experience gained'}
                                        </span>
                                    </div>
                                </motion.div>
                            )
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] shrink-0">
                        {round < 3 ? (
                            <button
                                onClick={playNextRound}
                                disabled={isSimulating}
                                className="w-full py-3.5 px-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-50 border border-white/[0.06] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                            >
                                {isSimulating ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin text-sm" />
                                        <span>Simulating Matches...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-play text-xs text-amber-400" />
                                        <span>
                                            {round === 0 ? t('Simulate Quarter-Finals', 'Viertelfinale simulieren') :
                                             round === 1 ? t('Simulate Semi-Finals', 'Halbfinale simulieren') :
                                             t('Simulate Championship Final', 'U19-Finale simulieren')}
                                        </span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleCloseModal}
                                className="w-full py-3.5 px-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.06] font-medium text-xs sm:text-sm transition active:scale-[0.99] cursor-pointer"
                            >
                                {t('Return to Youth Academy', 'Zurück zur Jugendakademie')}
                            </button>
                        )}
                    </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};
