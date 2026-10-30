import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  NationalTeam,
  InternationalMatchResult,
  NationalSquadDirection,
  NationalFederationInvestment,
  NationalTrainingFocus,
  PreGameDirective,
  NationalCoachProfile,
  HostNation,
  GroupStageResult,
  GroupTeam,
  WorldCupCampaignStats,
  InternationalFirstHalfState
} from '../types';
import {
  getHostNation,
  getNationalCoachCandidates,
  calculateDirectorSynergy,
  simulateGroupStage,
  simulateInternationalMatch,
  simulateInternationalFirstHalf
} from '../engine/internationalEngine';

import confetti from 'canvas-confetti';
import { BroadcastBadge } from './BroadcastBadge';
import { PrestigeTrophy } from './PrestigeTrophy';

interface InternationalTournamentModalProps {
  year: number;
  offeredTeams: NationalTeam[];
  onComplete: (wonTrophy: boolean, teamName?: string, stats?: WorldCupCampaignStats) => void;
  onDecline: () => void;
  isModActive?: boolean;
  isFreshInvite?: boolean;
}

interface DirectiveConfig {
  id: PreGameDirective;
  label: string;
  tagline: string;
  desc: string;
  icon: string;
  counterAdvantage: string;
}

const TACTICAL_DIRECTIVES: DirectiveConfig[] = [
  {
    id: 'controlled_possession',
    label: 'Controlled Possession',
    tagline: 'Dictate Tempo & Suppress Counters',
    desc: 'Patient positional buildup that suffocates opponent transitional rhythm.',
    icon: 'fa-shield-halved',
    counterAdvantage: 'Counters direct wing transitions and athletic counter-attacking sides.'
  },
  {
    id: 'high_press',
    label: 'High Press & Gegenpress',
    tagline: 'Aggressive Line & High Turnovers',
    desc: 'Relentless forward press forcing errors in the opponent defensive third.',
    icon: 'fa-bolt',
    counterAdvantage: 'Breaks down low blocks and punishes slow technical buildup.'
  },
  {
    id: 'low_block_counter',
    label: 'Low Block & Fast Break',
    tagline: 'Compact Fortress & Lethal Counters',
    desc: 'Absorbs elite pressure and springs devastating vertical counter-attacks.',
    icon: 'fa-lock',
    counterAdvantage: 'Ultimate giant-killer against higher-OVR football superpowers.'
  },
  {
    id: 'direct_wing_play',
    label: 'Direct Wing Overload',
    tagline: 'Rapid Flanks & Set-Piece Threat',
    desc: 'Direct diagonal switches and overlaps creating aerial box scrambles.',
    icon: 'fa-wind',
    counterAdvantage: 'Bypasses congested midfields and exploits balanced continental shapes.'
  }
];

interface TrainingCampConfig {
  id: NationalTrainingFocus;
  label: string;
  tagline: string;
  desc: string;
  icon: string;
  badgeColor: string;
}

const TRAINING_CAMPS: TrainingCampConfig[] = [
  {
    id: 'high_intensity',
    label: 'High-Intensity Blitz',
    tagline: '+1 OVR Group & Early Tempo',
    desc: 'Explosive pressing drills for fast starts and group stage dominance.',
    icon: 'fa-dumbbell',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  {
    id: 'tactical_masterclass',
    label: 'Giant-Killer Video Lab',
    tagline: '+1 OVR & -1 Giant Opp OVR',
    desc: 'Deep opposition scouting that neutralizes higher-rated superpowers.',
    icon: 'fa-brain',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  {
    id: 'stamina_recovery',
    label: 'Knockout Bio-Recovery',
    tagline: '+1 OVR & +15% Extra-Time/Pens',
    desc: 'Cryo-recovery and load management for 120-minute knockout battles.',
    icon: 'fa-heart-pulse',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    id: 'set_piece_specialist',
    label: 'Dead-Ball & Shootout Lab',
    tagline: '+40% Set-Piece Goal & +20% Pens',
    desc: 'Obsessive corner routines and ice-cold penalty shootout rehearsals.',
    icon: 'fa-crosshairs',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  }
];

const getScoutIntelligence = (opp: NationalTeam, userOvr: number) => {
  const diff = opp.ovr - userOvr;
  if (diff >= 3) {
    return {
      style: 'World Superpower',
      threat: `${opp.name} (${opp.ovr} OVR) boasts elite world-class firepower and will look to pin opponents deep with overwhelming vertical pressure.`
    };
  }
  if (diff <= -3) {
    return {
      style: 'Compact Underdog',
      threat: `${opp.name} (${opp.ovr} OVR) defends in a stubborn low block, conceding territorial possession and hoping for set-piece openings.`
    };
  }
  if (['BRA', 'ESP', 'ARG', 'POR'].includes(opp.code)) {
    return {
      style: 'Technical Possession',
      threat: `${opp.name} dictates tempo through elite midfield technicians, patient circulation, and short passing combinations.`
    };
  }
  if (['ENG', 'FRA', 'GER', 'NED'].includes(opp.code)) {
    return {
      style: 'Direct Athletic Transitions',
      threat: `${opp.name} attacks with blistering pace down the wide channels, exploiting space behind defensive lines.`
    };
  }
  return {
    style: 'Disciplined Continental Unit',
    threat: `${opp.name} (${opp.ovr} OVR) plays a structured, balanced shape with strong aerial organization in both penalty boxes.`
  };
};

export const InternationalTournamentModal: React.FC<InternationalTournamentModalProps> = ({
  year,
  offeredTeams,
  onComplete,
  onDecline,
  isModActive = false,
  isFreshInvite = false
}) => {
  const hostNation: HostNation = useMemo(() => getHostNation(year), [year]);
  const storageKey = `fms_active_wc_state_${year}`;

  const initialSavedState = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  }, [storageKey]);

  // If the tournament was already persisted in gameState from before without active step state (i.e. restarted after winning the World Cup),
  // automatically recover directly into the World Cup Trophy Presentation!
  const isRecoveredVictory = !initialSavedState && !isFreshInvite && offeredTeams.length > 0;

  const [step, setStep] = useState<'invite' | 'strategy' | 'group' | 'knockout' | 'final' | 'summary'>(() => {
    if (initialSavedState?.step) return initialSavedState.step;
    if (isRecoveredVictory) return 'summary';
    return 'invite';
  });
  const [selectedTeam, setSelectedTeam] = useState<NationalTeam | null>(() => {
    if (initialSavedState?.selectedTeam) return initialSavedState.selectedTeam;
    if (isRecoveredVictory) return offeredTeams[0] || null;
    return null;
  });

  // Director Blueprint State
  const [availableCoaches, setAvailableCoaches] = useState<NationalCoachProfile[]>(() => initialSavedState?.availableCoaches || []);
  const [appointedCoach, setAppointedCoach] = useState<NationalCoachProfile | null>(() => initialSavedState?.appointedCoach || null);
  const [squadDirection, setSquadDirection] = useState<NationalSquadDirection>(() => initialSavedState?.squadDirection || 'golden_generation');
  const [federationInvestment, setFederationInvestment] = useState<NationalFederationInvestment>(() => initialSavedState?.federationInvestment || 'high_performance_camp');
  const [trainingFocus, setTrainingFocus] = useState<NationalTrainingFocus>(() => initialSavedState?.trainingFocus || 'high_intensity');
  const [preGameDirective, setPreGameDirective] = useState<PreGameDirective>(() => initialSavedState?.preGameDirective || 'controlled_possession');

  // Group Stage State (Matchday-by-Matchday progression: 1, 2, 3)
  const [groupResult, setGroupResult] = useState<GroupStageResult | null>(() => initialSavedState?.groupResult || null);
  const [groupMatchdayRevealed, setGroupMatchdayRevealed] = useState<number>(() => initialSavedState?.groupMatchdayRevealed ?? 1);

  // Knockout Stage State
  const [matches, setMatches] = useState<InternationalMatchResult[]>(() => initialSavedState?.matches || []);
  const [currentMatch, setCurrentMatch] = useState<InternationalMatchResult | null>(() => initialSavedState?.currentMatch || null);
  const [isSimulatingMatch, setIsSimulatingMatch] = useState<boolean>(false);
  const [knockoutPhase, setKnockoutPhase] = useState<'prep' | 'simulating' | 'result'>(() => {
    const saved = initialSavedState?.knockoutPhase;
    return saved === 'simulating' ? 'prep' : (saved || 'prep');
  });
  const [currentStage, setCurrentStage] = useState<'Quarter-Final' | 'Semi-Final'>(() => initialSavedState?.currentStage || 'Quarter-Final');
  const [pendingOpponent, setPendingOpponent] = useState<NationalTeam | null>(() => initialSavedState?.pendingOpponent || null);
  const [wonTrophy, setWonTrophy] = useState<boolean>(() => {
    if (typeof initialSavedState?.wonTrophy === 'boolean') return initialSavedState.wonTrophy;
    if (isRecoveredVictory) return true;
    return false;
  });

  // Grand Final State (with Halftime Director Call!)
  const [finalPhase, setFinalPhase] = useState<'prep' | 'halftime' | 'live' | 'result'>(() => {
    const saved = initialSavedState?.finalPhase;
    return saved === 'live' ? (initialSavedState?.currentMatch?.stage === 'Grand Final' ? 'result' : 'prep') : (saved || 'prep');
  });
  const [finalOpponent, setFinalOpponent] = useState<NationalTeam | null>(() => initialSavedState?.finalOpponent || null);
  const [finalMinute, setFinalMinute] = useState<number>(() => initialSavedState?.finalMinute || 0);
  const [finalTickerEvents, setFinalTickerEvents] = useState<Array<{ minute: number; text: string; isGoal?: boolean; forUser?: boolean }>>(() => initialSavedState?.finalTickerEvents || []);
  const [finalLiveTeamScore, setFinalLiveTeamScore] = useState<number>(() => initialSavedState?.finalLiveTeamScore || 0);
  const [finalLiveOppScore, setFinalLiveOppScore] = useState<number>(() => initialSavedState?.finalLiveOppScore || 0);
  const [isFinalLiveRunning, setIsFinalLiveRunning] = useState<boolean>(false);
  const [grandFinalFirstHalf, setGrandFinalFirstHalf] = useState<InternationalFirstHalfState | null>(() => initialSavedState?.grandFinalFirstHalf || null);

  // Persist active tournament progression so any remount or refresh never restarts the World Cup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        step,
        selectedTeam,
        availableCoaches,
        appointedCoach,
        squadDirection,
        federationInvestment,
        trainingFocus,
        preGameDirective,
        groupResult,
        groupMatchdayRevealed,
        matches,
        currentMatch,
        knockoutPhase,
        currentStage,
        pendingOpponent,
        wonTrophy,
        finalPhase,
        finalOpponent,
        finalMinute,
        finalTickerEvents,
        finalLiveTeamScore,
        finalLiveOppScore,
        grandFinalFirstHalf
      }));
    } catch {
      // ignore storage errors
    }
  }, [
    storageKey,
    step,
    selectedTeam,
    availableCoaches,
    appointedCoach,
    squadDirection,
    federationInvestment,
    trainingFocus,
    preGameDirective,
    groupResult,
    groupMatchdayRevealed,
    matches,
    currentMatch,
    knockoutPhase,
    currentStage,
    pendingOpponent,
    wonTrophy,
    finalPhase,
    finalOpponent,
    finalMinute,
    finalTickerEvents,
    finalLiveTeamScore,
    finalLiveOppScore,
    grandFinalFirstHalf
  ]);

  const handleFinishTournament = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    const activeTeam = selectedTeam || offeredTeams[0];
    if (!activeTeam) {
      onDecline();
      return;
    }

    const userGroupRow = groupResult?.table.find(t => t.isUser || t.team.code === activeTeam.code);
    const groupPlayed = userGroupRow?.p || (groupResult ? 3 : (wonTrophy ? 3 : 0));
    const groupWins = userGroupRow?.w || (wonTrophy && !groupResult ? 3 : 0);
    const groupDraws = userGroupRow?.d || 0;
    const groupLosses = userGroupRow?.l || 0;
    const groupGf = userGroupRow?.gf || (wonTrophy && !groupResult ? 7 : 0);
    const groupGa = userGroupRow?.ga || (wonTrophy && !groupResult ? 2 : 0);

    const knockoutPlayed = matches.length || (wonTrophy && matches.length === 0 ? 3 : 0);
    const knockoutWins = matches.filter(m => m.won).length || (wonTrophy && matches.length === 0 ? 3 : 0);
    const knockoutLosses = matches.filter(m => !m.won).length;
    const knockoutGf = matches.reduce((acc, m) => acc + (m.teamGoals || 0), 0) || (wonTrophy && matches.length === 0 ? 7 : 0);
    const knockoutGa = matches.reduce((acc, m) => acc + (m.oppGoals || 0), 0) || (wonTrophy && matches.length === 0 ? 2 : 0);

    let bestFinish = 'Group Stage';
    if (wonTrophy) bestFinish = 'Champion 🏆';
    else if (matches.some(m => m.stage === 'Grand Final')) bestFinish = 'Runner-Up 🥈';
    else if (matches.some(m => m.stage === 'Semi-Final')) bestFinish = 'Semi-Finalist 🥉';
    else if (matches.some(m => m.stage === 'Quarter-Final')) bestFinish = 'Quarter-Finalist';

    const campaignStats: WorldCupCampaignStats = {
      matchesPlayed: groupPlayed + knockoutPlayed,
      matchesWon: groupWins + knockoutWins,
      matchesDrawn: groupDraws,
      matchesLost: groupLosses + knockoutLosses,
      goalsFor: groupGf + knockoutGf,
      goalsAgainst: groupGa + knockoutGa,
      bestFinish,
      teamName: activeTeam.name
    };
    onComplete(wonTrophy, activeTeam.name, campaignStats);
  };

  const handleDeclineOrClose = () => {
    if (step === 'summary' || (step === 'final' && finalPhase === 'result')) {
      handleFinishTournament();
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    onDecline();
  };

  const timerRefs = React.useRef<any[]>([]);
  const isMountedRef = React.useRef(true);
  const registerTimer = (t: any) => {
    timerRefs.current.push(t);
    return t;
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timerRefs.current.forEach(t => {
        clearInterval(t);
        clearTimeout(t);
      });
      timerRefs.current = [];
    };
  }, []);

  const fireVictoryConfetti = () => {
    if (!isMountedRef.current) return;
    try {
      confetti({
        particleCount: 110,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff', '#eab308']
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (step === 'summary' && wonTrophy) {
      fireVictoryConfetti();
      const t1 = registerTimer(setTimeout(() => isMountedRef.current && fireVictoryConfetti(), 1200));
      return () => clearTimeout(t1);
    }
  }, [step, wonTrophy]);

  // Select Federation
  const handleSelectTeam = (team: NationalTeam) => {
    setSelectedTeam(team);
    const coaches = getNationalCoachCandidates(team);
    setAvailableCoaches(coaches);
    const defaultCoach = coaches[0];
    setAppointedCoach(defaultCoach);
    setStep('strategy');
  };

  // Live Director Synergy
  const synergy = useMemo(() => {
    if (!appointedCoach) {
      return {
        score: 50,
        level: 'neutral' as const,
        title: 'Evaluating Synergy',
        desc: 'Appoint a coach and align your federation blueprint.',
        indicatorBadge: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
        clues: [],
        ovrModifier: 0,
        penaltyBonus: 0,
        clutchGoalChance: 0.1
      };
    }
    return calculateDirectorSynergy(squadDirection, federationInvestment, appointedCoach);
  }, [squadDirection, federationInvestment, appointedCoach]);

  // Launch Group Stage (starts at Matchday 1)
  const handleLaunchGroupStage = () => {
    if (!selectedTeam || !appointedCoach) return;
    const res = simulateGroupStage(
      selectedTeam,
      hostNation,
      squadDirection,
      federationInvestment,
      appointedCoach,
      synergy,
      trainingFocus,
      preGameDirective
    );
    setGroupResult(res);
    setGroupMatchdayRevealed(1);
    setStep('group');
  };

  // Compute partial or full group table based on how many Matchdays (1, 2, or 3) have been played
  const displayedGroupTable = useMemo((): GroupTeam[] => {
    if (!groupResult) return [];
    if (groupMatchdayRevealed >= 3) return groupResult.table;

    const visibleMatches = groupResult.matches.slice(0, groupMatchdayRevealed * 2);
    const map = new Map<string, GroupTeam>();
    groupResult.table.forEach(row => {
      map.set(row.team.code, {
        team: row.team,
        p: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        isUser: row.isUser
      });
    });

    visibleMatches.forEach(m => {
      const r1 = map.get(m.home.code);
      const r2 = map.get(m.away.code);
      if (!r1 || !r2) return;
      r1.p += 1;
      r2.p += 1;
      r1.gf += m.homeScore;
      r1.ga += m.awayScore;
      r1.gd += (m.homeScore - m.awayScore);
      r2.gf += m.awayScore;
      r2.ga += m.homeScore;
      r2.gd += (m.awayScore - m.homeScore);
      if (m.homeScore > m.awayScore) {
        r1.w += 1;
        r1.pts += 3;
        r2.l += 1;
      } else if (m.homeScore < m.awayScore) {
        r2.w += 1;
        r2.pts += 3;
        r1.l += 1;
      } else {
        r1.d += 1;
        r1.pts += 1;
        r2.d += 1;
        r2.pts += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  }, [groupResult, groupMatchdayRevealed]);

  const handleStartKnockouts = () => {
    if (!selectedTeam || !appointedCoach) return;
    setStep('knockout');
    setCurrentStage('Quarter-Final');
    prepareKnockoutStage('Quarter-Final', []);
  };

  const prepareKnockoutStage = (stage: 'Quarter-Final' | 'Semi-Final', excludedCodes: string[]) => {
    if (!selectedTeam) return;
    const pool = [
      { name: 'France', code: 'FRA', flag: '🇫🇷', color: '#2563eb', ovr: 89, continent: 'UEFA' as const },
      { name: 'Brazil', code: 'BRA', flag: '🇧🇷', color: '#16a34a', ovr: 88, continent: 'CONMEBOL' as const },
      { name: 'Argentina', code: 'ARG', flag: '🇦🇷', color: '#38bdf8', ovr: 88, continent: 'CONMEBOL' as const },
      { name: 'Spain', code: 'ESP', flag: '🇪🇸', color: '#e11d48', ovr: 87, continent: 'UEFA' as const },
      { name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#dc2626', ovr: 87, continent: 'UEFA' as const },
      { name: 'Germany', code: 'GER', flag: '🇩🇪', color: '#f59e0b', ovr: 86, continent: 'UEFA' as const },
      { name: 'Portugal', code: 'POR', flag: '🇵🇹', color: '#b91c1c', ovr: 86, continent: 'UEFA' as const },
      { name: 'Netherlands', code: 'NED', flag: '🇳🇱', color: '#ea580c', ovr: 85, continent: 'UEFA' as const },
      { name: 'Italy', code: 'ITA', flag: '🇮🇹', color: '#1d4ed8', ovr: 85, continent: 'UEFA' as const }
    ].filter(t => t.code !== selectedTeam.code && !excludedCodes.includes(t.code));

    const opp = pool[Math.floor(Math.random() * pool.length)] || pool[0];
    setPendingOpponent(opp);
    setKnockoutPhase('prep');
    setCurrentMatch(null);
  };

  const executeKnockoutMatch = () => {
    if (!selectedTeam || !appointedCoach || !pendingOpponent) return;
    setIsSimulatingMatch(true);
    setKnockoutPhase('simulating');

    registerTimer(setTimeout(() => {
      if (!isMountedRef.current) return;
      const result = simulateInternationalMatch(
        selectedTeam,
        pendingOpponent,
        currentStage,
        squadDirection,
        federationInvestment,
        appointedCoach,
        synergy,
        trainingFocus,
        preGameDirective
      );
      setCurrentMatch(result);
      setMatches(prev => [...prev, result]);
      setIsSimulatingMatch(false);
      setKnockoutPhase('result');
      if (!result.won) setWonTrophy(false);
    }, 750));
  };

  const handleProceedAfterKnockout = () => {
    if (!currentMatch) return;
    const currentExcluded = matches.map(m => m.opponent.code);
    if (currentMatch.stage === 'Quarter-Final') {
      setCurrentStage('Semi-Final');
      prepareKnockoutStage('Semi-Final', currentExcluded);
    } else if (currentMatch.stage === 'Semi-Final') {
      prepareGrandFinal(currentExcluded);
    }
  };

  const prepareGrandFinal = (excludedCodes: string[]) => {
    if (!selectedTeam) return;
    setStep('final');
    setFinalPhase('prep');
    setGrandFinalFirstHalf(null);

    const finalists = [
      { name: 'France', code: 'FRA', flag: '🇫🇷', color: '#2563eb', ovr: 89, continent: 'UEFA' as const },
      { name: 'Brazil', code: 'BRA', flag: '🇧🇷', color: '#16a34a', ovr: 88, continent: 'CONMEBOL' as const },
      { name: 'Argentina', code: 'ARG', flag: '🇦🇷', color: '#38bdf8', ovr: 88, continent: 'CONMEBOL' as const },
      { name: 'Spain', code: 'ESP', flag: '🇪🇸', color: '#e11d48', ovr: 87, continent: 'UEFA' as const }
    ].filter(t => t.code !== selectedTeam.code && !excludedCodes.includes(t.code));

    const finalOpp = finalists[Math.floor(Math.random() * finalists.length)] || finalists[0];
    setFinalOpponent(finalOpp);
  };

  // Kickoff First Half of Grand Final (minute-by-minute simulation up to 45', pauses for Director Halftime Call)
  const startGrandFinalFirstHalf = () => {
    if (!selectedTeam || !appointedCoach || !finalOpponent) return;
    const firstHalf = simulateInternationalFirstHalf(
      selectedTeam,
      finalOpponent,
      squadDirection,
      federationInvestment,
      appointedCoach,
      synergy,
      trainingFocus,
      preGameDirective
    );
    setGrandFinalFirstHalf(firstHalf);
    setFinalPhase('live');
    setIsFinalLiveRunning(true);
    setFinalMinute(1);
    setFinalLiveTeamScore(0);
    setFinalLiveOppScore(0);
    setFinalTickerEvents([]);

    let currentMin = 1;
    const interval = registerTimer(setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(interval);
        return;
      }
      currentMin += 1;
      setFinalMinute(currentMin);

      const triggered = (firstHalf.minuteEvents || []).filter(e => e.minute <= currentMin);
      setFinalTickerEvents(triggered);
      setFinalLiveTeamScore(triggered.filter(e => e.isGoal && e.forUser).length);
      setFinalLiveOppScore(triggered.filter(e => e.isGoal && !e.forUser).length);

      if (currentMin >= 45) {
        clearInterval(interval);
        setFinalMinute(45);
        setFinalLiveTeamScore(firstHalf.teamGoals);
        setFinalLiveOppScore(firstHalf.oppGoals);
        setFinalTickerEvents(firstHalf.minuteEvents);
        setIsFinalLiveRunning(false);
        setFinalPhase('halftime');
      }
    }, 45));
  };

  // Resolve Second Half of Grand Final after Director Halftime Intervention
  const resolveGrandFinalSecondHalf = (intervention: 'steady' | 'all_out_attack' | 'park_the_bus') => {
    if (!selectedTeam || !appointedCoach || !finalOpponent) return;
    setFinalPhase('live');
    setIsFinalLiveRunning(true);

    const result = simulateInternationalMatch(
      selectedTeam,
      finalOpponent,
      'Grand Final',
      squadDirection,
      federationInvestment,
      appointedCoach,
      synergy,
      trainingFocus,
      preGameDirective,
      intervention,
      grandFinalFirstHalf || undefined
    );

    setCurrentMatch(result);
    setMatches(prev => [...prev, result]);

    const targetEndMin = result.pens || result.extraTime ? 120 : 90;
    let currentMin = 45;

    const interval = registerTimer(setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(interval);
        return;
      }
      currentMin += 1;
      setFinalMinute(currentMin);

      const triggered = (result.minuteEvents || []).filter(e => e.minute <= currentMin);
      setFinalTickerEvents(triggered);
      setFinalLiveTeamScore(triggered.filter(e => e.isGoal && e.forUser).length);
      setFinalLiveOppScore(triggered.filter(e => e.isGoal && !e.forUser).length);

      if (currentMin >= targetEndMin) {
        clearInterval(interval);
        setFinalMinute(targetEndMin);
        setFinalLiveTeamScore(result.teamGoals);
        setFinalLiveOppScore(result.oppGoals);
        setFinalTickerEvents(result.minuteEvents || []);
        setIsFinalLiveRunning(false);
        setFinalPhase('result');
        setWonTrophy(result.won);
      }
    }, 45));
  };

  const activeOpponent = step === 'final' ? finalOpponent : step === 'knockout' ? pendingOpponent : null;
  const effectiveUserOvr = Math.min(100, (selectedTeam?.ovr || 82) + synergy.ovrModifier + (['high_intensity', 'tactical_masterclass', 'stamina_recovery'].includes(trainingFocus) ? 1 : 0));
  const scoutReport = useMemo(() => {
    if (!activeOpponent || !selectedTeam) return null;
    return getScoutIntelligence(activeOpponent, effectiveUserOvr);
  }, [activeOpponent, selectedTeam, effectiveUserOvr]);

  return (
    <motion.div
      data-wc-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, ease: 'linear' }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-2xl overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl bg-[#12141c]/95 backdrop-blur-3xl rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden text-left text-white"
      >
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 text-lg shadow-lg shadow-amber-500/20 shrink-0">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-black tracking-tight uppercase text-white">
                  World Cup™ {year}
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-xs font-semibold text-amber-300">
                  {hostNation.flag} {hostNation.name}
                </span>
                <BroadcastBadge
                  country={selectedTeam?.code || hostNation.code || 'USA'}
                  competitionId="world cup"
                  isModActive={isModActive}
                />
              </div>
              <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                National Team Director of Football · Final at {hostNation.stadium}, {hostNation.city}
              </p>
            </div>
          </div>

          <button
            onClick={handleDeclineOrClose}
            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
            title={step === 'summary' ? 'Complete & Return to Club' : 'Decline & Return to Club'}
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>

        {/* Streamlined Single Sleek Non-Wrapping Status Ribbon */}
        {step !== 'invite' && selectedTeam && (
          <div className="px-5 py-2.5 sm:px-6 bg-black/30 border-b border-white/[0.06] flex items-center justify-between shrink-0 text-xs gap-3 relative z-10">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="text-lg shrink-0">{selectedTeam.flag}</span>
              <span className="text-white font-black truncate">{selectedTeam.name}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="font-mono text-xs font-bold text-amber-300 tabular-nums whitespace-nowrap">
                {effectiveUserOvr} Eff. OVR
              </span>
              {appointedCoach && (
                <>
                  <span aria-hidden="true" className="text-zinc-600 hidden sm:inline">·</span>
                  <span className="text-[11px] text-zinc-400 truncate hidden sm:inline">
                    HC: <strong className="text-zinc-200 font-semibold">{appointedCoach.name}</strong>
                  </span>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 text-[11px] font-bold tracking-wide shrink-0">
              <span className={step === 'strategy' ? 'text-amber-300' : 'text-emerald-400'}>01. Blueprint</span>
              <span aria-hidden="true" className="text-zinc-700">/</span>
              <span className={step === 'group' ? 'text-amber-300' : ['knockout', 'final', 'summary'].includes(step) ? 'text-emerald-400' : 'text-zinc-500'}>02. Group</span>
              <span aria-hidden="true" className="text-zinc-700">/</span>
              <span className={step === 'knockout' ? 'text-amber-300' : ['final', 'summary'].includes(step) ? 'text-emerald-400' : 'text-zinc-500'}>03. Knockouts</span>
              <span aria-hidden="true" className="text-zinc-700">/</span>
              <span className={step === 'final' || step === 'summary' ? 'text-amber-300' : 'text-zinc-500'}>04. Grand Final</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold">
              <span className={
                synergy.ovrModifier > 0
                  ? 'text-emerald-400 font-mono tabular-nums'
                  : synergy.ovrModifier < 0
                  ? 'text-rose-400 font-mono tabular-nums'
                  : 'text-amber-300 font-mono tabular-nums'
              }>
                ⚡ {synergy.ovrModifier > 0 ? `+${synergy.ovrModifier}` : synergy.ovrModifier} OVR
              </span>
              <span aria-hidden="true" className="text-zinc-600 hidden sm:inline">·</span>
              <span className="text-zinc-300 hidden sm:inline">{synergy.title}</span>
            </div>
          </div>
        )}

        {/* Scrollable Content Viewport */}
        <div className="p-5 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar relative z-10 flex flex-col">
          <AnimatePresence mode="wait">
            {/* ================= ACT 1: FEDERATION APPOINTMENT ================= */}
            {step === 'invite' && (
              <motion.div
                key="invite"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.14 }}
                className="flex flex-col gap-5 flex-1 justify-between"
              >
                <div className="space-y-5">
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl sm:text-5xl drop-shadow">{hostNation.flag}</span>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                          Official Federation Call-Up · Tier 1 Sporting Director Invitation
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {year} World Cup™ in {hostNation.name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Grand Final Venue: <strong className="text-zinc-200">{hostNation.stadium}</strong> ({hostNation.city}) · Champion Reward: <strong className="text-amber-300">+5,000 Career Pts &amp; +25 Rep</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
                      <span>Select National Federation to Direct</span>
                      <span className="text-[11px] text-zinc-500 font-medium">4 Federations Courting Your Signature</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {offeredTeams.map((team) => {
                        const isHost = team.code === hostNation.code;
                        const expectation = team.ovr >= 86 ? 'Target: Win World Cup 🏆' : team.ovr >= 83 ? 'Target: Reach Semi-Finals' : 'Target: Knockout Upset Run';
                        return (
                          <button
                            key={team.code}
                            onClick={() => handleSelectTeam(team)}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                              isHost
                                ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.14] border-amber-500/35 hover:border-amber-400/60'
                                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.07] hover:border-white/[0.16]'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <span className="text-4xl drop-shadow shrink-0">{team.flag}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-white text-base group-hover:text-amber-300 transition truncate">
                                    {team.name}
                                  </span>
                                  {isHost && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                      · Host (+2 OVR)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-400 font-medium mt-0.5 flex items-center gap-1.5">
                                  <span>Squad <strong className="text-amber-300 font-mono tabular-nums">{team.ovr} OVR</strong></span>
                                  <span aria-hidden="true" className="text-zinc-600">·</span>
                                  <span>{team.continent}</span>
                                </div>
                                <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{expectation}</div>
                              </div>
                            </div>

                            <div className="px-3.5 py-2 rounded-xl bg-white/[0.06] group-hover:bg-amber-400 text-zinc-200 group-hover:text-slate-950 text-xs font-black transition flex items-center gap-1.5 shrink-0 ml-2">
                              <span>Appoint</span>
                              <i className="fas fa-arrow-right text-[10px]"></i>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-xs text-zinc-500">
                  <span>International tournaments do not deduct club budget or energy.</span>
                  <button
                    onClick={onDecline}
                    className="text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer py-1.5 px-3 rounded-lg hover:bg-white/[0.04]"
                  >
                    Decline International Duty
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= ACT 2: UNIFIED DIRECTOR WAR ROOM BLUEPRINT (SINGLE SCREEN) ================= */}
            {step === 'strategy' && selectedTeam && (
              <motion.div
                key="strategy"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.14 }}
                className="flex flex-col gap-4"
              >
                {/* Live Director Synergy Summary Banner */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <i className="fas fa-sliders text-amber-400"></i>
                      <span>Federation Blueprint Alignment: {synergy.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                      {synergy.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs font-mono font-bold tabular-nums">
                    <span className="text-zinc-400">
                      Base <strong className="text-white">{selectedTeam.ovr}</strong>
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">→</span>
                    <span className="text-amber-300">
                      Effective {effectiveUserOvr} OVR
                    </span>
                  </div>
                </div>

                {/* Step 1: Appoint Head Coach */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                    <span>01. Appoint National Head Coach</span>
                    <span className="text-zinc-500 font-normal">Selects tactical identity &amp; synergy profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {availableCoaches.map((c) => {
                      const isSelected = appointedCoach?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setAppointedCoach(c)}
                          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/[0.10] border-amber-400/60 shadow-sm'
                              : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-black text-white truncate">{c.name}</span>
                              {isSelected && (
                                <i className="fas fa-circle-check text-amber-400 text-xs shrink-0"></i>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-300 font-semibold mb-1.5">{c.title}</div>
                            <p className="text-[11px] text-zinc-400 leading-snug mb-2.5">{c.strength}</p>
                          </div>
                          <div className="pt-2 border-t border-white/[0.06] space-y-1 text-[10px]">
                            <div className="text-sky-300 font-medium truncate">
                              Style: {c.tacticalStyle}
                            </div>
                            <div className="text-rose-300/80 font-medium truncate">
                              Risk: {c.flaw}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 & 3 Side-by-Side: Squad Identity + Federation Funding */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Step 2: Squad Identity */}
                  <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      02. National Squad Identity
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'golden_generation', label: 'Golden Gen', desc: '+1 Base OVR peak stars' },
                        { id: 'youth_pipeline', label: 'Youth Wave', desc: 'High energy & upside' },
                        { id: 'veteran_stalwarts', label: 'Veterans', desc: 'Tournament poise & composure' },
                        { id: 'defensive_fortress', label: 'Fortress', desc: 'Compact shape & clean sheets' }
                      ].map((item) => {
                        const active = squadDirection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSquadDirection(item.id as NationalSquadDirection)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              active
                                ? 'bg-amber-500/[0.12] border-amber-400/60 text-white'
                                : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{item.label}</span>
                              {active && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{item.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Federation Infrastructure */}
                  <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      03. Federation Camp Allocation
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'high_performance_camp', label: 'Elite Base Camp', desc: 'Peak stamina & clutch goals' },
                        { id: 'tactical_analytics', label: 'Analytics Lab', desc: 'Opposition prep (-1 Opp OVR)' },
                        { id: 'mental_penalty_protocol', label: 'Shootout Psych', desc: '+15% Shootout win rate' },
                        { id: 'youth_scouting', label: 'Breakout Scouting', desc: 'Youth pipeline development' }
                      ].map((item) => {
                        const active = federationInvestment === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setFederationInvestment(item.id as NationalFederationInvestment)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              active
                                ? 'bg-sky-500/[0.12] border-sky-400/60 text-white'
                                : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span>{item.label}</span>
                              {active && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{item.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Step 4: Pre-Tournament Readiness Focus */}
                <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                    <span>04. Pre-Tournament Readiness Regimen</span>
                    <span className="text-zinc-500 font-normal">Final training camp focus before Matchday 1</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TRAINING_CAMPS.map((camp) => {
                      const active = trainingFocus === camp.id;
                      return (
                        <button
                          key={camp.id}
                          onClick={() => setTrainingFocus(camp.id)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            active
                              ? 'bg-amber-500/[0.12] border-amber-400/60 text-white'
                              : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <i className={`fas ${camp.icon} text-amber-400 text-[10px] shrink-0`}></i>
                              <span className="text-xs font-bold text-white truncate">{camp.label}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 leading-tight">{camp.tagline}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Group Stage CTA */}
                <div className="pt-1">
                  <button
                    onClick={handleLaunchGroupStage}
                    className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-amber-500/15 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-futbol"></i>
                    <span>Lock In Blueprint &amp; Kick Off Group Stage</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= ACT 3: INTERACTIVE GROUP STAGE (MATCHDAY BY MATCHDAY) ================= */}
            {step === 'group' && groupResult && (
              <motion.div
                key="group"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.14 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3">
                  <div>
                    <h3 className="font-black text-white text-sm sm:text-base">
                      {groupResult.groupName} · Matchday {groupMatchdayRevealed} of 3
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Top 2 nations advance to the World Cup Quarter-Finals
                    </p>
                  </div>
                  {groupMatchdayRevealed < 3 ? (
                    <button
                      onClick={() => setGroupMatchdayRevealed(3)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-bold text-amber-300 transition cursor-pointer"
                    >
                      Fast-Forward Group ⏩
                    </button>
                  ) : (
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      groupResult.userQualified ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {groupResult.userQualified ? `Qualified (#${groupResult.userPosition})` : `Eliminated (#${groupResult.userPosition})`}
                    </span>
                  )}
                </div>

                {/* Live Group Standings Table */}
                <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/[0.03] border-b border-white/[0.06] text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        <th className="py-2.5 px-3.5">Pos</th>
                        <th className="py-2.5 px-3">Nation</th>
                        <th className="py-2.5 px-2 text-center">MP</th>
                        <th className="py-2.5 px-2 text-center">W</th>
                        <th className="py-2.5 px-2 text-center">D</th>
                        <th className="py-2.5 px-2 text-center">L</th>
                        <th className="py-2.5 px-2 text-center">GD</th>
                        <th className="py-2.5 px-3.5 text-right font-black text-white">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {displayedGroupTable.map((row, idx) => {
                        const isQualifying = idx < 2;
                        return (
                          <tr
                            key={row.team.code}
                            className={`${row.isUser ? 'bg-amber-500/[0.10] font-bold' : ''} hover:bg-white/[0.02]`}
                          >
                            <td className="py-2.5 px-3.5 font-mono tabular-nums">
                              <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[11px] font-bold ${
                                isQualifying ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-500'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 flex items-center gap-2.5">
                              <span className="text-lg">{row.team.flag}</span>
                              <span className={row.isUser ? 'text-amber-300 font-black' : 'text-white font-semibold'}>
                                {row.team.name}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono tabular-nums text-zinc-400">{row.p}</td>
                            <td className="py-2.5 px-2 text-center font-mono tabular-nums text-emerald-400">{row.w}</td>
                            <td className="py-2.5 px-2 text-center font-mono tabular-nums text-zinc-300">{row.d}</td>
                            <td className="py-2.5 px-2 text-center font-mono tabular-nums text-rose-400">{row.l}</td>
                            <td className="py-2.5 px-2 text-center font-mono tabular-nums font-bold text-zinc-200">
                              {row.gd > 0 ? `+${row.gd}` : row.gd}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-black text-white text-sm">
                              {row.pts}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Revealed Matchday Results */}
                <div className="space-y-2.5">
                  {[1, 2, 3].filter(md => md <= groupMatchdayRevealed).map(md => {
                    const mdMatches = groupResult.matches.slice((md - 1) * 2, md * 2);
                    return (
                      <div key={md} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          Matchday {md} Results
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mdMatches.map((m, idx) => {
                            const isUserMatch = m.home.code === selectedTeam?.code || m.away.code === selectedTeam?.code;
                            return (
                              <div
                                key={idx}
                                className={`rounded-xl px-3 py-2 flex items-center justify-between text-xs border ${
                                  isUserMatch ? 'bg-amber-500/[0.08] border-amber-400/30 font-bold' : 'bg-black/30 border-white/[0.05]'
                                }`}
                              >
                                <span className="truncate flex-1">{m.home.flag} {m.home.name}</span>
                                <span className="font-mono font-black px-2.5 py-0.5 rounded-lg bg-black/50 text-amber-300 mx-2 whitespace-nowrap tabular-nums inline-flex items-center shrink-0">
                                  {m.homeScore} – {m.awayScore}
                                </span>
                                <span className="truncate flex-1 text-right">{m.away.name} {m.away.flag}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next Matchday / Advance CTA */}
                <div className="pt-1">
                  {groupMatchdayRevealed < 3 ? (
                    <button
                      onClick={() => setGroupMatchdayRevealed(prev => prev + 1)}
                      className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-forward-step"></i>
                      <span>Simulate Group Matchday {groupMatchdayRevealed + 1}</span>
                    </button>
                  ) : groupResult.userQualified ? (
                    <button
                      onClick={handleStartKnockouts}
                      className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-emerald-500/15 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-sitemap"></i>
                      <span>Advance to World Cup Quarter-Final</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setWonTrophy(false);
                        setStep('summary');
                      }}
                      className="w-full min-h-[48px] py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer"
                    >
                      Group Stage Elimination · Conclude Campaign
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ================= ACT 4: UNIFIED KNOCKOUT WAR ROOM (QF & SF) ================= */}
            {step === 'knockout' && selectedTeam && (
              <motion.div
                key={`knockout-${currentStage}-${knockoutPhase}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.14 }}
                className="flex flex-col gap-4"
              >
                {isSimulatingMatch ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <i className="fas fa-futbol fa-spin text-amber-400 text-4xl mb-1"></i>
                    <span className="text-base font-black tracking-wide text-white">
                      Simulating {currentStage} Clash...
                    </span>
                    <span className="text-xs text-zinc-400">
                      Executing matchday tactical directive on the pitch
                    </span>
                  </div>
                ) : knockoutPhase === 'prep' && pendingOpponent ? (
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-5 space-y-4">
                    {/* Matchup Header */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 border-b border-white/[0.06]">
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-4xl sm:text-5xl drop-shadow">{selectedTeam.flag}</span>
                        <span className="font-black text-sm sm:text-base text-white truncate max-w-full">{selectedTeam.name}</span>
                        <span className="text-xs font-mono text-amber-300 font-bold tabular-nums">{effectiveUserOvr} Eff. OVR</span>
                      </div>
                      <div className="flex flex-col items-center px-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">{currentStage}</span>
                        <span className="text-xl sm:text-2xl font-black text-zinc-500">VS</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-4xl sm:text-5xl drop-shadow">{pendingOpponent.flag}</span>
                        <span className="font-black text-sm sm:text-base text-white truncate max-w-full">{pendingOpponent.name}</span>
                        <span className="text-xs font-mono text-zinc-300 font-bold tabular-nums">{pendingOpponent.ovr} OVR</span>
                      </div>
                    </div>

                    {/* Integrated Chief Scout Dossier */}
                    {scoutReport && (
                      <div className="bg-sky-500/[0.07] border border-sky-400/25 rounded-2xl px-4 py-3 text-left">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5 truncate">
                            <i className="fas fa-binoculars text-sky-400 shrink-0"></i>
                            <span>Chief Scout Dossier · {pendingOpponent.name}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-sky-200 shrink-0">
                            {scoutReport.style}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {scoutReport.threat}
                        </p>
                      </div>
                    )}

                    {/* Pre-Game Tactical Directive Selector */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 text-left">
                        Select Matchday Tactical Directive
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                        {TACTICAL_DIRECTIVES.map(d => {
                          const isSelected = preGameDirective === d.id;
                          return (
                            <button
                              key={d.id}
                              onClick={() => setPreGameDirective(d.id)}
                              className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-amber-500/[0.12] border-amber-400/60 shadow-sm'
                                  : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black text-white flex items-center gap-2">
                                  <i className={`fas ${d.icon} text-amber-400`}></i>
                                  <span>{d.label}</span>
                                </span>
                                {isSelected && <i className="fas fa-circle-check text-amber-400 text-xs"></i>}
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-snug">{d.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={executeKnockoutMatch}
                      className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-futbol"></i>
                      <span>Kick Off {currentStage}</span>
                    </button>
                  </div>
                ) : currentMatch ? (
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 text-center space-y-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                      {currentMatch.stage} · Full-Time Result
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5 my-2 w-full max-w-md mx-auto">
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-4xl sm:text-5xl drop-shadow">{selectedTeam.flag}</span>
                        <span className="font-black text-xs sm:text-base text-white truncate max-w-full">{selectedTeam.name}</span>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <div className="bg-black/60 border border-white/[0.12] rounded-2xl px-5 sm:px-6 py-2.5 font-mono font-black text-2xl sm:text-4xl text-amber-300 whitespace-nowrap tabular-nums inline-flex items-center justify-center tracking-wide">
                          <span>{currentMatch.teamGoals}</span>
                          <span className="mx-2.5 text-zinc-500 font-sans text-xl sm:text-2xl">–</span>
                          <span>{currentMatch.oppGoals}</span>
                        </div>
                        {currentMatch.pens && (
                          <span className="text-[11px] font-mono font-bold text-amber-300 mt-1.5 tabular-nums">
                            ({currentMatch.teamPenGoals} : {currentMatch.oppPenGoals} Penalties)
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-4xl sm:text-5xl drop-shadow">{currentMatch.opponent.flag}</span>
                        <span className="font-black text-xs sm:text-base text-white truncate max-w-full">{currentMatch.opponent.name}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-lg mx-auto leading-relaxed">
                      {currentMatch.summary}
                    </p>

                    <div className="pt-3 border-t border-white/[0.06]">
                      {currentMatch.won ? (
                        <button
                          onClick={handleProceedAfterKnockout}
                          className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>{currentMatch.stage === 'Quarter-Final' ? 'Advance to Semi-Final ⚽' : 'Advance to World Cup Grand Final 🏆'}</span>
                          <i className="fas fa-arrow-right"></i>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setWonTrophy(false);
                            setStep('summary');
                          }}
                          className="w-full min-h-[48px] py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer"
                        >
                          Conclude World Cup Campaign
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* ================= ACT 5: GRAND FINAL WITH HALFTIME DIRECTOR CALL ================= */}
            {step === 'final' && selectedTeam && finalOpponent && (
              <motion.div
                key={`final-${finalPhase}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.14 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-amber-500/[0.08] border border-amber-400/30 rounded-2xl px-4 py-2.5 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                    <i className="fas fa-crown mr-1.5"></i>
                    World Cup™ Grand Final · {hostNation.stadium}, {hostNation.city}
                  </div>
                </div>

                {finalPhase === 'prep' ? (
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-5 space-y-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 border-b border-white/[0.06]">
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-5xl drop-shadow">{selectedTeam.flag}</span>
                        <span className="font-black text-base text-white truncate max-w-full">{selectedTeam.name}</span>
                        <span className="text-xs font-mono text-amber-300 font-bold tabular-nums">{effectiveUserOvr} Eff. OVR</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-amber-400 px-3">VS</div>
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-5xl drop-shadow">{finalOpponent.flag}</span>
                        <span className="font-black text-base text-white truncate max-w-full">{finalOpponent.name}</span>
                        <span className="text-xs font-mono text-zinc-300 font-bold tabular-nums">{finalOpponent.ovr} OVR</span>
                      </div>
                    </div>

                    {scoutReport && (
                      <div className="bg-sky-500/[0.07] border border-sky-400/25 rounded-2xl px-4 py-3 text-left">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5 truncate">
                            <i className="fas fa-binoculars text-sky-400 shrink-0"></i>
                            <span>Grand Final Dossier · {finalOpponent.name}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-sky-200 shrink-0">
                            {scoutReport.style}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {scoutReport.threat}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                      {TACTICAL_DIRECTIVES.map(d => {
                        const isSelected = preGameDirective === d.id;
                        return (
                          <button
                            key={d.id}
                            onClick={() => setPreGameDirective(d.id)}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-500/[0.12] border-amber-400/60 shadow-sm'
                                : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-white flex items-center gap-2">
                                <i className={`fas ${d.icon} text-amber-400`}></i>
                                <span>{d.label}</span>
                              </span>
                              {isSelected && <i className="fas fa-circle-check text-amber-400 text-xs"></i>}
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-snug">{d.desc}</p>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={startGrandFinalFirstHalf}
                      className="w-full min-h-[48px] py-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-xl cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-trophy"></i>
                      <span>Kick Off World Cup Grand Final 🏆</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/[0.02] border border-amber-400/40 rounded-3xl p-5 sm:p-6 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-mono font-black tabular-nums">
                      <span className={`w-2 h-2 rounded-full bg-red-500 ${isFinalLiveRunning ? 'animate-ping' : ''}`}></span>
                      <span>{finalMinute === 45 && finalPhase === 'halftime' ? "45' HALF-TIME" : `${finalMinute}' ${finalMinute >= 90 ? 'FT' : 'LIVE'}`}</span>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5 my-2 w-full max-w-md mx-auto">
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-4xl sm:text-5xl drop-shadow">{selectedTeam.flag}</span>
                        <span className="font-black text-xs sm:text-base text-white truncate max-w-full">{selectedTeam.name}</span>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <div className="bg-black/65 border border-amber-400/40 rounded-2xl px-5 sm:px-6 py-2.5 font-mono font-black text-3xl sm:text-5xl text-amber-300 whitespace-nowrap tabular-nums inline-flex items-center justify-center tracking-wide">
                          <span>{finalLiveTeamScore}</span>
                          <span className="mx-2.5 text-zinc-500 font-sans text-xl sm:text-2xl">–</span>
                          <span>{finalLiveOppScore}</span>
                        </div>
                        {currentMatch?.pens && !isFinalLiveRunning && finalPhase === 'result' && (
                          <span className="text-[11px] font-mono font-bold text-amber-300 mt-1.5 tabular-nums">
                            Shootout: {currentMatch.teamPenGoals} : {currentMatch.oppPenGoals}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-4xl sm:text-5xl drop-shadow">{finalOpponent.flag}</span>
                        <span className="font-black text-xs sm:text-base text-white truncate max-w-full">{finalOpponent.name}</span>
                      </div>
                    </div>

                    {/* Halftime Director Call */}
                    {finalPhase === 'halftime' && (
                      <div className="bg-amber-500/[0.08] border border-amber-400/35 rounded-2xl p-4 text-left space-y-2.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <i className="fas fa-bullhorn"></i>
                          <span>Halftime Locker Room Mandate (45')</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={() => resolveGrandFinalSecondHalf('steady')}
                            className="p-3 rounded-xl bg-white/[0.05] hover:bg-amber-400 hover:text-slate-950 border border-white/[0.10] text-left transition cursor-pointer group"
                          >
                            <div className="text-xs font-black">Stay the Course</div>
                            <div className="text-[10px] text-zinc-400 group-hover:text-slate-900">Trust {appointedCoach?.name}'s gameplan</div>
                          </button>
                          <button
                            onClick={() => resolveGrandFinalSecondHalf('all_out_attack')}
                            className="p-3 rounded-xl bg-white/[0.05] hover:bg-amber-400 hover:text-slate-950 border border-white/[0.10] text-left transition cursor-pointer group"
                          >
                            <div className="text-xs font-black">All-Out Press ⚡</div>
                            <div className="text-[10px] text-zinc-400 group-hover:text-slate-900">+Goal Surge / Counter Risk</div>
                          </button>
                          <button
                            onClick={() => resolveGrandFinalSecondHalf('park_the_bus')}
                            className="p-3 rounded-xl bg-white/[0.05] hover:bg-amber-400 hover:text-slate-950 border border-white/[0.10] text-left transition cursor-pointer group"
                          >
                            <div className="text-xs font-black">Lock Down &amp; Pens 🛡️</div>
                            <div className="text-[10px] text-zinc-400 group-hover:text-slate-900">Suppress Opp &amp; +15% Shootout</div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Commentary Ticker */}
                    <div className="pt-3 border-t border-white/[0.06] space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar text-left">
                      {finalTickerEvents.map((evt, idx) => (
                        <div
                          key={idx}
                          className={`text-xs px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                            evt.isGoal
                              ? evt.forUser
                                ? 'bg-emerald-500/[0.12] border border-emerald-500/30 text-emerald-200 font-bold'
                                : 'bg-rose-500/[0.12] border border-rose-500/30 text-rose-200 font-bold'
                              : 'bg-white/[0.03] text-zinc-300'
                          }`}
                        >
                          <span className="font-mono font-black text-amber-400 tabular-nums shrink-0">{evt.minute}'</span>
                          <span>{evt.text}</span>
                        </div>
                      ))}
                    </div>

                    {!isFinalLiveRunning && finalPhase === 'result' && (
                      <button
                        onClick={() => setStep('summary')}
                        className="w-full min-h-[48px] py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-105 text-slate-950 font-semibold text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_8px_25px_rgba(245,158,11,0.28)] cursor-pointer active:scale-[0.98]"
                      >
                        {wonTrophy ? 'Lift the Trophy' : 'Conclude World Cup Campaign'}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================= ACT 6: TROPHY PRESENTATION & SUMMARY (CHAMPIONS CUP STYLE) ================= */}
            {step === 'summary' && selectedTeam && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24 }}
                className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[380px] text-center py-2 sm:py-4 relative z-10 flex-1"
              >
                {wonTrophy ? (
                  <>
                    {/* Grand Prestige Trophy Centerpiece (Matching Champions Cup Celebration) */}
                    <div className="mb-3 sm:mb-4 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full scale-125 pointer-events-none" />
                      <PrestigeTrophy
                        type="wc"
                        size={135}
                        className="animate-pulse drop-shadow-2xl max-h-28 sm:max-h-36 w-auto relative z-10"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2">
                      {isModActive && (
                        <BroadcastBadge
                          country={selectedTeam.code || hostNation.code || 'USA'}
                          competitionId="world cup"
                          isModActive={isModActive}
                        />
                      )}
                      <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase bg-amber-500/10 border border-amber-400/20 px-2.5 py-0.5 rounded-md">
                        Live Trophy Presentation
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-300 mb-1">
                      <span>★</span>
                      <span>World Cup {year} Champions</span>
                      <span>★</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tight mb-2">
                      WORLD CUP GLORY!
                    </h2>

                    <p className="text-sm text-zinc-300 max-w-md mb-4 font-normal leading-relaxed">
                      A historic achievement! {selectedTeam.flag} {selectedTeam.name} hoists the prestigious World Cup trophy into the sky at {hostNation.stadium}!
                    </p>

                    {isRecoveredVictory && offeredTeams.length > 1 && (
                      <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Champion Nation:</span>
                        {offeredTeams.map(team => (
                          <button
                            key={team.code}
                            type="button"
                            onClick={() => setSelectedTeam(team)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                              selectedTeam.code === team.code
                                ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span>{team.flag}</span>
                            <span>{team.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-6 w-full max-w-sm">
                      <div className="p-3 rounded-2xl bg-amber-500/[0.10] border border-amber-400/30">
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-0.5">Career Legacy</span>
                        <span className="text-lg font-black text-white font-mono tabular-nums">+5,000 Pts</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-500/[0.10] border border-emerald-400/30">
                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block mb-0.5">Director Reputation</span>
                        <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">+25 Rep</span>
                      </div>
                    </div>

                    <button
                      onClick={handleFinishTournament}
                      className="px-10 py-3.5 rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-[0_8px_25px_rgba(245,158,11,0.28)] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-105 text-slate-950 active:scale-[0.98]"
                    >
                      Complete World Cup
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 text-2xl mb-4">
                      <span>{selectedTeam.flag}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-200 uppercase tracking-tight mb-2">
                      Valiant World Cup Run Concluded
                    </h2>

                    <p className="text-sm text-zinc-400 max-w-sm mb-6 font-normal leading-relaxed">
                      Your international tenure with {selectedTeam.name} elevated your global profile (+8 Director Reputation, +800 Career Pts).
                    </p>

                    <button
                      onClick={handleFinishTournament}
                      className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white px-8 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Return to Club Duties
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};