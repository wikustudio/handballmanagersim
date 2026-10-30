import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameState, Club } from '../types';
import { PrestigeTrophy } from './PrestigeTrophy';
import { getCompetitionTheme } from '../utils/prestigeTheme';
import { ClubLogo } from './ClubLogo';
import { BroadcastBadge } from './BroadcastBadge';
import { TEAMS } from '../mod-data/teams';
import { ALL_CLUBS as CLUBS } from '../data/clubsData';
import { getLeagueInfo } from '../data/gameConstants';

interface DecisionDayModalProps {
  resolve: (result: {
    won: boolean;
    draw?: boolean;
    choice?: number;
    userRank?: number;
    finalPts?: number;
    finalGd?: number;
    score?: string;
  }) => void;
  gameState: GameState;
  rivalName: string;
  userPts: number;
  userGd: number;
  rivalPts: number;
  rivalGd: number;
  opponentName?: string;
  opponentOvr?: number;
  ddType?: 'title' | 'relegation' | 'promotion_playoff';
  isBottomTier?: boolean;
  isCrossTierPlayoff?: boolean;
  pointsDeducted?: number;
  winProb?: number;
  clubsDb?: Club[];
  isModActive?: boolean;
  userPos?: number;
  standings?: any[];
}

const DecisionDayModal: React.FC<DecisionDayModalProps> = ({
  resolve,
  gameState,
  rivalName,
  userPts,
  userGd,
  rivalPts,
  rivalGd,
  opponentName,
  opponentOvr,
  ddType = 'title',
  isBottomTier = false,
  isCrossTierPlayoff = false,
  pointsDeducted,
  winProb,
  clubsDb = [],
  isModActive = false,
  userPos = 4,
  standings,
}) => {
  const theme = useMemo(() => getCompetitionTheme(ddType, gameState.club.country, ddType), [ddType, gameState.club.country]);
  
  const isPlayoff = ddType === 'promotion_playoff';
  const isRelegation = ddType === 'relegation';
  const isTwoLegged = isCrossTierPlayoff || isPlayoff;

  // Matchday 34 League Table · Title Duel
  // Matchday 34 Relegation Survival Duel
  // Demarcation: !isRelegation && !isPlayoff && gameState.club.tier > 1 && idx === 1
  const allClubs = clubsDb.length > 0 ? clubsDb : CLUBS;
  const tier = gameState.club.tier;
  const country = gameState.club.country || 'GER';
  const totalLeagueTeams = allClubs.filter(c => c.tier === tier && (c.country || 'GER') === country).length || 18;
  const baseRankOffset = isRelegation ? Math.max(1, totalLeagueTeams - 3) : (isPlayoff ? 3 : 1);
  const decisionTable = useMemo(() => [], []);
  const renderStandingsTable = () => null;

  // Stages: 'choice' (tactical directive) -> 'match' (game unfolds) -> 'leg1_summary' (halftime between legs) -> 'result' (final whistle & presentation)
  const [stage, setStage] = useState<'choice' | 'match' | 'leg1_summary' | 'result'>('choice');
  const [currentLeg, setCurrentLeg] = useState<1 | 2>(1);
  const [leg1Result, setLeg1Result] = useState<{ me: number; opp: number; score: string; tactic: string } | null>(null);
  const [leg2Result, setLeg2Result] = useState<{ me: number; opp: number; score: string; tactic: string } | null>(null);
  const [penaltyResult, setPenaltyResult] = useState<{ mePen: number; oppPen: number; won: boolean } | null>(null);
  const [appliedDirective, setAppliedDirective] = useState<string>('');
  const [simultaneousRivalScore, setSimultaneousRivalScore] = useState<string>('0-0');
  
  const intervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const isResolvedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const matchScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    if (matchScrollRef.current) matchScrollRef.current.scrollTop = 0;
  }, [stage]);

  const handleResolve = (arg: {
    won: boolean;
    draw?: boolean;
    choice?: number;
    userRank?: number;
    finalPts?: number;
    finalGd?: number;
    score?: string;
  }) => {
    if (isResolvedRef.current) return;
    isResolvedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    resolve(arg);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      delete (window as any)._decisionChoice;
    };
  }, []);

  const [decisionChoice, setDecisionChoice] = useState<number | undefined>(undefined);
  const [matchResult, setMatchResult] = useState<{ won: boolean; draw?: boolean; isComeback?: boolean; oppComeback?: boolean; score: string; description: string } | null>(null);
  const [matchMinute, setMatchMinute] = useState(0);
  const [liveScore, setLiveScore] = useState({ me: 0, opp: 0 });
  const [localOpponentOvr, setOpponentOvr] = useState(80);
  const [recentEvent, setRecentEvent] = useState<string | null>(null);

  // Tactical Duel logic
  const [isTacticalDuel] = useState<boolean>(() => Math.random() > 0.5);
  const [oppTacticInfo, setOppTacticInfo] = useState(() => {
    const tactics = [
      { en: 'Gegenpressing', de: 'Gegenpressing' },
      { en: 'Direct Counter', de: 'Direktes Konterspiel' },
      { en: 'Park the Bus', de: 'Catenaccio' },
      { en: 'Tiki-Taka', de: 'Tiki-Taka' }
    ];
    return tactics[Math.floor(Math.random() * tactics.length)];
  });

  const hasTacticalGeniusPerk = Boolean(
    gameState.managerSkills?.includes('tactical_mastermind') ||
    gameState.managerSkills?.includes('tactical_genius')
  );
  const isTacticalMasterCoach = gameState.currentCoach?.strength === 'Tactical Chessboard Maestro';
  const coachUnderstandsOpponent = useMemo(() => {
    if (!isTacticalMasterCoach) return false;
    const key = `${opponentName || 'Rival'}_${currentLeg}_${gameState.year || 2026}_${gameState.currentCoach?.id || gameState.currentCoach?.name || ''}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    // Tactical Master coaches only fully understand and reveal odds against some opponents (~30%)
    return (Math.abs(hash) % 10) < 3;
  }, [isTacticalMasterCoach, opponentName, currentLeg, gameState.year, gameState.currentCoach?.id, gameState.currentCoach?.name]);

  const canSeeOdds = hasTacticalGeniusPerk || coachUnderstandsOpponent;
  // PATCH: Hard cap the displayed and simulated player OVR
  const playerOvr = Math.min(100, gameState.club.baseOvr + (hasTacticalGeniusPerk ? 2 : 0));

  // Resolve user club info
  const userClub = useMemo(() => {
    const dbClub = clubsDb?.find(c => 
      c.id === gameState.club.id || 
      String(c.id) === String(gameState.club.id) ||
      c.name.toLowerCase().trim() === gameState.club.name.toLowerCase().trim()
    );
    const modTeam = isModActive ? TEAMS.find(t => 
      t.id === gameState.club.id || 
      String(t.id) === String(gameState.club.id) || 
      t.name.toLowerCase().trim() === gameState.club.name.toLowerCase().trim()
    ) : undefined;

    return {
      ...gameState.club,
      name: (isModActive && (dbClub?.name || modTeam?.name)) || gameState.club.name,
      id: dbClub?.id ?? modTeam?.id ?? gameState.club.id,
      logo: isModActive ? (dbClub?.logo || modTeam?.logo || gameState.club.logo) : gameState.club.logo,
      fallbackLogo: isModActive ? (dbClub?.fallbackLogo || modTeam?.fallbackLogo || gameState.club.fallbackLogo) : gameState.club.fallbackLogo,
      color: dbClub?.color || modTeam?.color || gameState.club.color,
    };
  }, [clubsDb, gameState.club, isModActive]);

  // Resolve opponent club info
  const oppClub = useMemo(() => {
    const effectiveName = opponentName || 'League Opponent';
    const dbSource = clubsDb.length > 0 ? clubsDb : CLUBS;
    const match = dbSource.find(c => c.name.toLowerCase() === effectiveName.toLowerCase());
    const modTeam = isModActive ? TEAMS.find(t => 
      (match && (t.id === match.id || String(t.id) === String(match.id))) ||
      t.name.toLowerCase().trim() === effectiveName.toLowerCase().trim()
    ) : undefined;

    return {
      name: (isModActive && (dbTeamName(modTeam, match) || modTeam?.name)) || match?.name || effectiveName,
      id: modTeam?.id ?? match?.id,
      logo: isModActive ? (modTeam?.logo || match?.logo) : match?.logo,
      fallbackLogo: isModActive ? (modTeam?.fallbackLogo || match?.fallbackLogo) : match?.fallbackLogo,
      color: modTeam?.color || match?.color,
    };
  }, [clubsDb, opponentName, isModActive]);

  function dbTeamName(m?: any, c?: any) {
    return m?.name || c?.name;
  }



  // Match Stakes Consequence Matrix panel dynamically framing the 90 or 180 minute stakes
  const renderMatchStakes = (isLive: boolean = false) => {
    const higherLeague = getLeagueInfo(Math.max(1, gameState.club.tier - 1), gameState.club.country);
    const currentLeague = getLeagueInfo(gameState.club.tier, gameState.club.country);
    const lowerLeague = getLeagueInfo(gameState.club.tier + 1, gameState.club.country);
    const isRelegation = ddType === 'relegation';
    const isPlayoff = ddType === 'promotion_playoff';

    let stakesHeader = '';
    let stakesSubtitle = '';
    let winTitle = '';
    let winDesc = '';
    let drawTitle = '';
    let drawDesc = '';
    let lossTitle = '';
    let lossDesc = '';
    let lossBadgeColor = 'border-rose-500/30 bg-rose-500/10 text-rose-300';

    if (ddType === 'title') {
      const isTopFlight = gameState.club.tier === 1;
      stakesHeader = isTopFlight ? 'Matchday 34 · Title Decider Stakes' : 'Championship & Promotion Stakes';
      stakesSubtitle = isTopFlight
        ? `90 minutes to decide the national championship. You face ${oppClub.name} in the finale while direct rival ${rivalName} contests the crown.`
        : `Top 2 automatic promotion spots are locked. Today's duel determines who lifts the ${currentLeague?.name || 'League'} Championship Trophy.`;

      winTitle = isTopFlight ? 'League Champions' : 'Champions & Auto-Promotion';
      winDesc = isTopFlight
        ? `Finish 1st · Lift the ${currentLeague?.name || 'League'} Trophy · Gold Silverware & Continental Seed.`
        : `Finish 1st · Crowned Champions with Silverware · Direct promotion to ${higherLeague?.name || 'higher division'}.`;

      drawTitle = isTopFlight ? 'Title on GD / Runner-Up' : 'Promoted as Runner-Up';
      drawDesc = isTopFlight
        ? `Title decided by goal difference tiebreak vs ${rivalName}.`
        : `Finish 2nd · Automatic promotion to ${higherLeague?.name || 'higher division'} locked as Runner-Up!`;

      lossTitle = isTopFlight ? 'League Runner-Up' : 'Promoted as Runner-Up';
      lossDesc = isTopFlight
        ? `${rivalName} claims the title. You finish as official League Runner-Up.`
        : `Finish 2nd behind ${rivalName} · Automatic promotion to ${higherLeague?.name || 'higher division'} guaranteed!`;
      lossBadgeColor = isTopFlight ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    } else if (isPlayoff) {
      stakesHeader = isTwoLegged ? 'Two-Legged Promotion Playoff Stakes' : 'Promotion Playoff Final Stakes';
      stakesSubtitle = `Winner takes the promotion ticket to ${higherLeague?.name || 'higher division'}. Loser remains in ${currentLeague?.name || 'current league'}.`;

      winTitle = `Promoted to ${higherLeague?.name || 'Higher Division'}`;
      winDesc = `Playoff Winners! Elevates ${userClub.name} into ${higherLeague?.name || 'the higher league'} for next season.`;

      drawTitle = 'Shootout Decider';
      drawDesc = 'Deadlock after regulation leads directly to a sudden-death penalty shootout.';

      lossTitle = 'Playoff Finalist';
      lossDesc = `Remain in ${currentLeague?.name || 'current tier'} as playoff finalist for the upcoming campaign.`;
      lossBadgeColor = 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300';
    } else if (isRelegation) {
      if (isBottomTier) {
        stakesHeader = 'Pyramid Floor Sporting Survival Stakes';
        stakesSubtitle = `No lower division exists below ${currentLeague?.name || 'current league'}. Relegation here triggers immediate board dismissal.`;

        winTitle = 'Sporting Survival Secured';
        winDesc = 'Avoid the bottom dismissal zone · Retain managerial contract and board backing.';

        drawTitle = 'Survival on GD / Tiebreak';
        drawDesc = `Stay above ${rivalName} on points or goal difference to avoid the sacking line.`;

        lossTitle = 'Sacking Risk · Board Dismissal';
        lossDesc = `Finish in the bottom dismissal zone · The Board will immediately terminate your managerial contract for sporting failure.`;
        lossBadgeColor = 'border-rose-500/40 bg-rose-500/15 text-rose-300';
      } else if (isCrossTierPlayoff) {
        stakesHeader = isPlayoff ? 'Cross-Tier Promotion Playoff Stakes' : 'Cross-Tier Promotion Playoff · Relegation Decider Stakes';
        stakesSubtitle = isPlayoff
          ? `Two-legged playoff (2 Legs): You enter as the Challenger against Defender ${oppClub.name} to earn promotion to ${higherLeague?.name || 'the higher tier'}!`
          : `Two-legged survival playoff (2 Legs): You enter as the Defender to protect your place in ${currentLeague?.name || 'current tier'} against Challenger ${oppClub.name}.`;

        winTitle = isPlayoff ? `Promotion to ${higherLeague?.name || 'Higher Tier'}` : 'Survival Defended';
        winDesc = isPlayoff
          ? `Playoff victory as Challenger! Elevates ${userClub.name} into ${higherLeague?.name || 'the higher league'}.`
          : `Defeat Challenger ${oppClub.name} over 2 Legs · Maintain membership in ${currentLeague?.name || 'current tier'}.`;

        drawTitle = 'Penalties on Aggregate Tie';
        drawDesc = 'Aggregate deadlock resolved via sudden-death penalty shootout.';

        lossTitle = isPlayoff ? 'Promotion Denied' : `Relegation to ${lowerLeague?.name || 'Lower Tier'}`;
        lossDesc = isPlayoff
          ? `Playoff defeat as Challenger · Remain in ${currentLeague?.name || 'current tier'}.`
          : `Playoff defeat as Defender · Drop below the line into ${lowerLeague?.name || `Tier ${gameState.club.tier + 1}`}.`;
        lossBadgeColor = isPlayoff ? 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300' : 'border-rose-500/40 bg-rose-500/15 text-rose-300';
      } else {
        stakesHeader = 'Matchday 34 Survival Stakes';
        stakesSubtitle = `Direct duel against ${oppClub.name} with ${rivalName} battling simultaneously in the survival scrap.`;

        winTitle = 'Survival Secured';
        winDesc = `Defeat ${oppClub.name} · Stay above the relegation line in ${currentLeague?.name || 'current league'}.`;

        drawTitle = 'Survival on GD';
        drawDesc = `Maintain point or goal difference advantage over ${rivalName} to stay up.`;

        lossTitle = `Relegated to ${lowerLeague?.name || 'Lower Tier'}`;
        lossDesc = `Drop into the relegation zone · Relegated to ${lowerLeague?.name || `Tier ${gameState.club.tier + 1}`}.`;
        lossBadgeColor = 'border-rose-500/40 bg-rose-500/15 text-rose-300';
      }
    }

    // Determine live active card if isLive is true
    let activeCard: 'win' | 'draw' | 'loss' | null = null;
    if (isLive) {
      if (liveScore.me > liveScore.opp) activeCard = 'win';
      else if (liveScore.me === liveScore.opp) activeCard = 'draw';
      else activeCard = 'loss';
    }

    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 w-full">
        {/* Header with Icon and Badge */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400 text-xs shrink-0">
              <i className="fa-solid fa-scale-balanced" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest leading-none">
                Match Stakes · Direct Duel Matrix
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug truncate">
                {stakesHeader}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>As It Stands ({matchMinute}')</span>
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-full hidden sm:inline">
                {isTwoLegged ? '180 Minutes' : '90 Minutes'}
              </span>
            )}
          </div>
        </div>

        {/* Subtitle / Framing */}
        <p className="text-[11px] sm:text-xs text-zinc-300 font-normal leading-relaxed">
          {stakesSubtitle}
        </p>

        {/* 3 Consequence Cards: WIN | DRAW | LOSS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* WIN */}
          <div
            className={`rounded-xl p-3 flex flex-col justify-between transition-all duration-300 ${
              isLive && activeCard === 'win'
                ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-emerald-500/[0.08] border border-emerald-500/25'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Victory
                </span>
                <i className="fa-solid fa-trophy text-[11px] text-emerald-400" />
              </div>
              <div className="text-xs font-bold text-emerald-200 leading-snug">
                {winTitle}
              </div>
            </div>
            <p className="text-[10px] text-emerald-300/80 mt-1.5 leading-normal font-normal">
              {winDesc}
            </p>
          </div>

          {/* DRAW */}
          <div
            className={`rounded-xl p-3 flex flex-col justify-between transition-all duration-300 ${
              isLive && activeCard === 'draw'
                ? 'bg-sky-500/20 border-2 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                : 'bg-white/[0.03] border border-white/[0.06]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-200 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-400/30">
                  Draw
                </span>
                <i className="fa-solid fa-handshake text-[11px] text-sky-400" />
              </div>
              <div className="text-xs font-bold text-zinc-200 leading-snug">
                {drawTitle}
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 leading-normal font-normal">
              {drawDesc}
            </p>
          </div>

          {/* LOSS */}
          <div
            className={`rounded-xl p-3 flex flex-col justify-between transition-all duration-300 ${
              isLive && activeCard === 'loss'
                ? 'bg-rose-500/25 border-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                : `border ${lossBadgeColor}`
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-rose-200">
                  Defeat
                </span>
                <i className="fa-solid fa-arrow-trend-down text-[11px] text-rose-400" />
              </div>
              <div className="text-xs font-bold leading-snug text-white">
                {lossTitle}
              </div>
            </div>
            <p className="text-[10px] text-zinc-300 opacity-90 mt-1.5 leading-normal font-normal">
              {lossDesc}
            </p>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (opponentOvr) {
      setOpponentOvr(Math.min(99, Math.max(15, opponentOvr)));
    } else {
      setOpponentOvr(Math.min(99, Math.max(15, playerOvr - 5 + Math.floor(Math.random() * 8))));
    }
  }, [opponentOvr, playerOvr]);

  const executeMatch = (myEffectiveOvr: number, flatWinProb: number | null, directiveText: string, specialDesc: string) => {
    setAppliedDirective(directiveText);

    const baseDrawProb = 0.26;
    let rawWinShare = 0.50;
    if (flatWinProb !== null) {
      rawWinShare = Math.max(0.05, Math.min(0.95, flatWinProb));
    } else {
      const ovrDelta = myEffectiveOvr - localOpponentOvr;
      rawWinShare = Math.max(0.05, Math.min(0.95, 0.50 + (ovrDelta * 0.025)));
    }

    // 3-Way Probabilities: 26% base draw chance, non-draw share (74%) partitioned by relative strength
    const drawProb = baseDrawProb;
    const winProb = rawWinShare * (1 - drawProb);
    const lossProb = (1 - rawWinShare) * (1 - drawProb);

    const matchOutcomeRoll = Math.random();
    let outcome: 'win' | 'draw' | 'loss';
    if (matchOutcomeRoll < winProb) {
      outcome = 'win';
    } else if (matchOutcomeRoll < winProb + drawProb) {
      outcome = 'draw';
    } else {
      outcome = 'loss';
    }

    const isWin = outcome === 'win';
    let finalScoreMe = 0;
    let finalScoreOpp = 0;
    const r = Math.random();

    if (outcome === 'win') {
      if (r < 0.20) {
        // 1. Gritty Defensive Grinds (20%): 1-0, 2-0
        const grittyWins = [[1, 0], [1, 0], [2, 0]];
        const pick = grittyWins[Math.floor(Math.random() * grittyWins.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      } else if (r < 0.52) {
        // 2. Balanced Clashes (32%): 2-1, 3-1, 3-0
        const balancedWins = [[2, 1], [2, 1], [3, 1], [3, 1], [3, 0]];
        const pick = balancedWins[Math.floor(Math.random() * balancedWins.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      } else if (r < 0.74) {
        // 3. High-Scoring Entertainers (22%): 3-2, 4-2, 4-1
        const highScoringWins = [[3, 2], [3, 2], [4, 2], [4, 1]];
        const pick = highScoringWins[Math.floor(Math.random() * highScoringWins.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      } else if (r < 0.88) {
        // 4. Wild Thrillers (14%): 4-3, 5-2, 5-3, 5-4
        const wildWins = [[4, 3], [5, 2], [5, 3], [5, 4]];
        const pick = wildWins[Math.floor(Math.random() * wildWins.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      } else {
        // 5. Statement Blowouts & Routs (12%): 4-0, 5-0, 5-1, 6-0, 6-1, 6-2, 7-0, 7-1
        const blowouts = [[4, 0], [5, 0], [5, 1], [6, 0], [6, 1], [6, 2], [7, 0], [7, 1]];
        const pick = blowouts[Math.floor(Math.random() * blowouts.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      }
    } else if (outcome === 'draw') {
      // Authentic Draw scorelines (26% base occurrence): 0-0, 1-1, 2-2, 3-3, 4-4
      const draws = [[0, 0], [1, 1], [1, 1], [2, 2], [2, 2], [3, 3], [4, 4]];
      const pick = draws[Math.floor(Math.random() * draws.length)];
      finalScoreMe = pick[0]; finalScoreOpp = pick[1];
    } else {
      // Realistic Defeats
      if (r < 0.23) {
        // 1. Gritty Defensive Losses (23%): 0-1, 0-2
        const grittyLosses = [[0, 1], [0, 1], [0, 2]];
        const pick = grittyLosses[Math.floor(Math.random() * grittyLosses.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      } else if (r < 0.57) {
        // 2. Balanced Losses (34%): 1-2, 1-3, 0-3
        const balancedLosses = [[1, 2], [1, 2], [1, 3], [1, 3], [0, 3]];
        const pick = balancedLosses[Math.floor(Math.random() * balancedLosses.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      } else if (r < 0.80) {
        // 3. High-Scoring Losses (23%): 2-3, 2-4, 1-4
        const highScoringLosses = [[2, 3], [2, 3], [2, 4], [1, 4]];
        const pick = highScoringLosses[Math.floor(Math.random() * highScoringLosses.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      } else if (r < 0.93) {
        // 4. Wild Thrillers (13%): 3-4, 2-5, 3-5, 4-5
        const wildLosses = [[3, 4], [2, 5], [3, 5], [4, 5]];
        const pick = wildLosses[Math.floor(Math.random() * wildLosses.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      } else {
        // 5. Heavy Blowouts (7%): 0-4, 0-5, 1-5, 0-6, 1-6, 2-6, 0-7, 1-7
        const blowouts = [[0, 4], [0, 5], [1, 5], [0, 6], [1, 6], [2, 6], [0, 7], [1, 7]];
        const pick = blowouts[Math.floor(Math.random() * blowouts.length)];
        finalScoreMe = pick[0]; finalScoreOpp = pick[1];
      }
    }

    const isDraw = finalScoreMe === finalScoreOpp;
    const isComeback = isWin && finalScoreOpp > 0 && Math.random() > 0.5;
    const oppComeback = !isWin && !isDraw && finalScoreMe > 0 && Math.random() > 0.5;

    const eventTimeline: { min: number, isMe: boolean, text: string }[] = [];

    const usedMins = new Set<number>();
    const getUniqueMin = (start: number, end: number) => {
      let m = Math.floor(Math.random() * (end - start + 1)) + start;
      let tries = 0;
      while (usedMins.has(m) && tries < 30) {
        m = Math.floor(Math.random() * (end - start + 1)) + start;
        tries++;
      }
      usedMins.add(m);
      return m;
    };

    for (let i = 0; i < finalScoreMe; i++) {
      let min = getUniqueMin(1, 89);
      if (isComeback) min = getUniqueMin(58, 90);
      else if (oppComeback) min = getUniqueMin(5, 45);
      eventTimeline.push({ min, isMe: true, text: `GOAL! ${userClub.name} scores!` });
    }
    for (let i = 0; i < finalScoreOpp; i++) {
      let min = getUniqueMin(1, 89);
      if (isComeback) min = getUniqueMin(5, 45);
      else if (oppComeback) min = getUniqueMin(58, 90);
      eventTimeline.push({ min, isMe: false, text: `GOAL! ${oppClub.name} scores.` });
    }
    eventTimeline.sort((a, b) => a.min - b.min);

    // Build description narrative
    let desc = specialDesc;
    if (isComeback) {
      desc = `Dramatic comeback victory! Down early, your squad rallied heroically under intense pressure!`;
    } else if (oppComeback) {
      desc = `Total second-half collapse. An early advantage slipped away in heartbreaking fashion.`;
    } else if (finalScoreMe >= 4 && finalScoreOpp <= 1) {
      desc = `Total masterclass! A breathtaking demolition on the biggest stage!`;
    } else if (finalScoreOpp >= 4 && finalScoreMe <= 1) {
      desc = `A chastening, heavy defeat. Completely outpowered across the pitch.`;
    } else if (finalScoreMe + finalScoreOpp >= 6) {
      desc = `An instant, breathless classic! An incredible high-scoring slugfest!`;
    }

    // Begin match unfolding
    setStage('match');
    setMatchMinute(0);
    setLiveScore({ me: 0, opp: 0 });
    setSimultaneousRivalScore('0-0');
    setRecentEvent('Kickoff whistle blown. Decision Day is underway!');

    let currentMin = 0;
    let currentMe = 0;
    let currentOpp = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      currentMin += 1;
      setMatchMinute(currentMin);

      // Simulate simultaneous rival match updates
      if (currentMin === 24) {
        setSimultaneousRivalScore('0-1');
        setRecentEvent(`24' - Simultaneous Rival: ${rivalName} trail 0-1!`);
      }
      if (currentMin === 52) {
        setSimultaneousRivalScore('1-1');
        setRecentEvent(`52' - Simultaneous Rival: ${rivalName} level at 1-1!`);
      }
      if (currentMin === 78) {
        const rivalFinal = isWin ? '1-2' : (isDraw ? '1-1' : '2-1');
        setSimultaneousRivalScore(rivalFinal);
        setRecentEvent(`78' - Simultaneous Rival: Late goal in ${rivalName} match (${rivalFinal})!`);
      }

      const eventsThisMin = eventTimeline.filter(e => e.min === currentMin);
      if (eventsThisMin.length > 0) {
        eventsThisMin.forEach(e => {
          if (e.isMe) currentMe++;
          else currentOpp++;
          setRecentEvent(`${e.min}' - ${e.text}`);
        });
        setLiveScore({ me: currentMe, opp: currentOpp });
        if (navigator.vibrate) navigator.vibrate(20);
      }

      if (currentMin >= 90) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        
        if (navigator.vibrate) navigator.vibrate([50, 50, 100]);

        if (isTwoLegged && currentLeg === 1) {
          timeoutRef.current = setTimeout(() => {
            const scoreStr = `${finalScoreMe}-${finalScoreOpp}`;
            setLeg1Result({
              me: finalScoreMe,
              opp: finalScoreOpp,
              score: scoreStr,
              tactic: directiveText || 'Directive'
            });
            setStage('leg1_summary');
          }, 750);
          return;
        }

        timeoutRef.current = setTimeout(() => {
          let wonActual = finalScoreMe > finalScoreOpp;
          let drawActual = finalScoreMe === finalScoreOpp;
          let scoreStr = `${finalScoreMe}-${finalScoreOpp}`;
          let finalDesc = desc;

          if (isTwoLegged && currentLeg === 2) {
            setLeg2Result({
              me: finalScoreMe,
              opp: finalScoreOpp,
              score: scoreStr,
              tactic: directiveText || 'Directive'
            });

            const totalMe = (leg1Result?.me || 0) + finalScoreMe;
            const totalOpp = (leg1Result?.opp || 0) + finalScoreOpp;

            if (totalMe === totalOpp) {
              // Level on aggregate after 180 minutes -> Penalty Shootout!
              const penAdv = (playerOvr - localOpponentOvr) * 0.02;
              const wonPens = Math.random() < (0.5 + penAdv);
              const mePen = wonPens ? 5 : (Math.random() > 0.5 ? 4 : 3);
              const oppPen = wonPens ? (Math.random() > 0.5 ? 4 : 3) : 5;
              const pens = { mePen, oppPen, won: wonPens };
              wonActual = wonPens;
              drawActual = false;
              setPenaltyResult(pens);
              scoreStr = `${totalMe}-${totalOpp} (${mePen}-${oppPen} pens)`;
              finalDesc = wonPens
                ? `Tied ${totalMe}-${totalOpp} on aggregate! Your squad held their nerve to win ${mePen}-${oppPen} in the penalty shootout!`
                : `Heartbreak! Tied ${totalMe}-${totalOpp} on aggregate, but fell ${mePen}-${oppPen} in the penalty shootout.`;
            } else {
              wonActual = totalMe > totalOpp;
              drawActual = false;
              scoreStr = `${totalMe}-${totalOpp} agg.`;
              finalDesc = wonActual
                ? `Two-legged playoff triumph! ${totalMe}-${totalOpp} aggregate victory!`
                : `Playoff heartbreak. Defeated ${totalMe}-${totalOpp} on aggregate.`;
            }
          }
          
          setMatchResult({
            won: wonActual,
            draw: drawActual,
            isComeback,
            oppComeback,
            score: scoreStr,
            description: finalDesc
          });
          setStage('result');

          if (wonActual) {
            const duration = 4 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 40, spread: 360, ticks: 80, zIndex: 110 };
            confetti({
              particleCount: 200,
              spread: 120,
              origin: { y: 0.6 },
              colors: [theme.accentHex, '#ffffff', '#38BDF8'],
              zIndex: 110
            });
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
            intervalRef.current = setInterval(function () {
              const timeLeft = animationEnd - Date.now();
              if (timeLeft <= 0) {
                return clearInterval(intervalRef.current);
              }
              const particleCount = 70 * (timeLeft / duration);
              confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
              confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
          }
        }, 750);
      }
    }, 45);
  };

  const normalizeTacticKey = (style?: string): string => {
    if (!style) return 'Total Football';
    const s = style.trim().toLowerCase();
    if (s === 'catenaccio' || s === 'park the bus' || s === 'defensive') return 'Park the Bus';
    if (s === 'tiki-taka' || s === 'possession') return 'Tiki-Taka';
    if (s === 'gegenpressing' || s === 'gegenpress' || s === 'pressing') return 'Gegenpressing';
    if (s === 'direct counter' || s === 'counter' || s === 'counter-attack' || s === 'wing play') return 'Direct Counter';
    if (s === 'total football' || s === 'attacking' || s === 'balanced') return 'Total Football';
    return style;
  };

  const getTacticalAdvantage = (myTac: string, oppTac: string) => {
    const p = normalizeTacticKey(myTac);
    const o = normalizeTacticKey(oppTac);
    if (p === 'Tiki-Taka' && o === 'Park the Bus') return 1;
    if (p === 'Tiki-Taka' && o === 'Gegenpressing') return -1;
    if (p === 'Park the Bus' && o === 'Direct Counter') return 1;
    if (p === 'Park the Bus' && o === 'Tiki-Taka') return -1;
    if (p === 'Direct Counter' && o === 'Gegenpressing') return 1;
    if (p === 'Direct Counter' && o === 'Park the Bus') return -1;
    if (p === 'Gegenpressing' && o === 'Tiki-Taka') return 1;
    if (p === 'Gegenpressing' && o === 'Direct Counter') return -1;
    return 0;
  };

  const getSingleAlignmentOvr = (chosenStyle: string, refStyle?: string): number => {
    if (!refStyle) return 0;
    const c = normalizeTacticKey(chosenStyle);
    const r = normalizeTacticKey(refStyle);
    if (c === r) return 5; // Perfect match (+5 OVR)

    const isOppositePair =
      (c === 'Gegenpressing' && r === 'Park the Bus') ||
      (c === 'Park the Bus' && r === 'Gegenpressing') ||
      (c === 'Tiki-Taka' && r === 'Direct Counter') ||
      (c === 'Direct Counter' && r === 'Tiki-Taka');
    if (isOppositePair) return -7; // Direct tactical opposite (-7 OVR)

    const isSevereClash =
      (c === 'Tiki-Taka' && r === 'Park the Bus') ||
      (c === 'Park the Bus' && r === 'Tiki-Taka') ||
      (c === 'Total Football' && r === 'Park the Bus') ||
      (c === 'Park the Bus' && r === 'Total Football');
    if (isSevereClash) return -6; // High-line/possession vs deep low block (-6 OVR)

    if (c === 'Total Football' || r === 'Total Football') return -2;
    return -3.5; // Non-aligned philosophy mismatch
  };

  const getTacticalStyleOffset = (choice: string) => {
    const normalizedChoice = normalizeTacticKey(choice);
    const clubAlign = getSingleAlignmentOvr(normalizedChoice, gameState.tactic);
    const coachAlign = getSingleAlignmentOvr(normalizedChoice, gameState.currentCoach?.style);
    const synergyBonus =
      clubAlign > 0 && coachAlign > 0
        ? 2
        : clubAlign <= -6 && coachAlign <= -6
        ? -2
        : 0;
    const tieBreaker =
      normalizedChoice === 'Total Football'
        ? 0.8
        : normalizedChoice === 'Gegenpressing'
        ? 0.4
        : normalizedChoice === 'Tiki-Taka'
        ? -0.4
        : normalizedChoice === 'Direct Counter'
        ? -0.8
        : -1.2;
    return clubAlign + coachAlign + synergyBonus + tieBreaker;
  };

  const isRelegationSpecialistBoost = ddType === 'relegation' && gameState.currentCoach?.strength === 'Relegation Specialist';

  const calcProb = (ovrMod: number) => {
    const base = 50 + ((playerOvr + ovrMod - localOpponentOvr) * 2.5) + (isRelegationSpecialistBoost ? 15 : 0);
    return Math.round(Math.max(5, Math.min(95, base)));
  };

  const computeRawRpsWinProb = (choice: string) => {
    let eff = playerOvr + getTacticalStyleOffset(choice);
    const adv = getTacticalAdvantage(choice, oppTacticInfo.en);
    if (adv === 1) eff += 8;
    if (adv === -1) eff -= 8;
    return calcProb(eff - playerOvr);
  };

  const rpsProbMap = (() => {
    const usedRps = new Set<number>();
    const choices = ['Total Football', 'Gegenpressing', 'Tiki-Taka', 'Direct Counter', 'Park the Bus'];
    const map: Record<string, number> = {};
    choices.forEach((ch, idx) => {
      const raw = computeRawRpsWinProb(ch);
      let candidate = Math.max(5, Math.min(95, raw));
      if (!usedRps.has(candidate)) {
        usedRps.add(candidate);
        map[ch] = candidate;
        return;
      }
      const step = idx % 2 === 0 ? -1 : 1;
      for (let i = 1; i <= 12; i++) {
        const next = Math.max(5, Math.min(95, candidate + step * i));
        if (!usedRps.has(next)) {
          usedRps.add(next);
          map[ch] = next;
          return;
        }
        const alt = Math.max(5, Math.min(95, candidate - step * i));
        if (!usedRps.has(alt)) {
          usedRps.add(alt);
          map[ch] = alt;
          return;
        }
      }
      map[ch] = candidate;
    });
    return map;
  })();

  const getRpsWinProb = (choice: string) => {
    const normalized = choice === 'Catenaccio' ? 'Park the Bus' : choice;
    return rpsProbMap[normalized] ?? computeRawRpsWinProb(choice);
  };

  const getRpsColor = (choice: string) => {
    if (!canSeeOdds) return 'text-zinc-500';
    const prob = getRpsWinProb(choice);
    if (prob >= 60) return 'text-emerald-400';
    if (prob <= 40) return 'text-rose-400';
    return 'text-sky-400';
  };

  const handleProceedToLeg2 = () => {
    setCurrentLeg(2);
    setMatchMinute(0);
    setLiveScore({ me: 0, opp: 0 });
    setSimultaneousRivalScore('0-0');
    setRecentEvent(null);
    const tactics = [
      { en: 'Gegenpressing', de: 'Gegenpressing' },
      { en: 'Direct Counter', de: 'Direktes Konterspiel' },
      { en: 'Park the Bus', de: 'Catenaccio' },
      { en: 'Tiki-Taka', de: 'Tiki-Taka' }
    ];
    setOppTacticInfo(tactics[Math.floor(Math.random() * tactics.length)]);
    setStage('choice');
  };

  const handleTacticalDuelChoice = (choice: string) => {
    setDecisionChoice(99);
    const styleOffset = getTacticalStyleOffset(choice);
    let myEffectiveOvr = playerOvr + styleOffset;
    const adv = getTacticalAdvantage(choice, oppTacticInfo.en);
    let specialDesc = '';

    if (adv === 1 && styleOffset >= 4) {
      myEffectiveOvr += 8;
      specialDesc = `Tactical Masterclass! Your squad & coach executed ${choice} flawlessly and dismantled their ${oppTacticInfo.en}!`;
    } else if (adv === 1 && styleOffset <= -5) {
      myEffectiveOvr += 8;
      specialDesc = `Your ${choice} countered their ${oppTacticInfo.en}, though the unfamiliar tactical identity limited your squad's fluency.`;
    } else if (adv === 1) {
      myEffectiveOvr += 8;
      specialDesc = `Tactical Masterclass! Your ${choice} dismantled their ${oppTacticInfo.en}!`;
    } else if (adv === -1 && styleOffset <= -5) {
      myEffectiveOvr -= 8;
      specialDesc = `Total Tactical Collapse! Ordering ${choice} clashed with your club & coach philosophy and walked right into their ${oppTacticInfo.en}!`;
    } else if (adv === -1) {
      myEffectiveOvr -= 8;
      specialDesc = `Tactical Disaster! Their ${oppTacticInfo.en} countered your ${choice}!`;
    } else if (styleOffset <= -6) {
      specialDesc = `System Mismatch! Your squad & coach looked disjointed playing ${choice} against their ${oppTacticInfo.en}.`;
    } else if (styleOffset >= 6) {
      specialDesc = `Fluid Identity! Your squad & coach were in complete harmony executing ${choice}.`;
    } else {
      specialDesc = `A gritty, evenly matched tactical battle.`;
    }

    executeMatch(myEffectiveOvr, getRpsWinProb(choice) / 100, `Directive: ${choice}`, specialDesc);
  };

  const getDynamicMods = (pOvr: number, oOvr: number, oName: string, oppTac: string) => {
    const diff = pOvr - oOvr;
    const seed = (oName.charCodeAt(0) + pOvr) % 4;

    const routineFit = getTacticalStyleOffset(gameState.tactic) + getTacticalAdvantage(gameState.tactic, oppTac) * 6;
    const kloppFit = getTacticalStyleOffset('Gegenpressing') + getTacticalAdvantage('Gegenpressing', oppTac) * 6;
    const pepFit = getTacticalStyleOffset('Tiki-Taka') + getTacticalAdvantage('Tiki-Taka', oppTac) * 6;
    const mourinhoFit =
      Math.max(getTacticalStyleOffset('Park the Bus'), getTacticalStyleOffset('Direct Counter')) +
      getTacticalAdvantage('Park the Bus', oppTac) * 6;

    let safeGood = Math.round(routineFit + 2 + (seed % 2));
    let safeBad = Math.round(routineFit - 2 - (seed % 2));
    let emoGood = Math.round(kloppFit + 4 + seed);
    let emoBad = Math.round(kloppFit - 5 - seed);
    let tacGood = Math.round(pepFit + 6 + seed);
    let tacBad = Math.round(pepFit - 6 - seed);
    let rattleGood = Math.round(mourinhoFit + 3 + (seed % 3));
    let rattleBad = Math.round(mourinhoFit - 4 - (seed % 3));

    if (diff < -4) { emoGood += 2; emoBad += 1; tacGood += 3; tacBad += 1; }
    else if (diff > 4) { emoGood -= 1; emoBad -= 2; tacGood -= 2; tacBad -= 2; }
    return { safeGood, safeBad, emoGood, emoBad, tacGood, tacBad, rattleGood, rattleBad };
  };

  const mods = getDynamicMods(playerOvr, localOpponentOvr, opponentName || 'Rival', oppTacticInfo.en);

  const getNetProb = (probGood: number, goodMod: number, badMod: number) => {
    return Math.round((probGood * calcProb(goodMod)) + ((1 - probGood) * calcProb(badMod)));
  };
  const rawSafe = getNetProb(0.75, mods.safeGood, mods.safeBad);
  const rawEmo = getNetProb(0.55, mods.emoGood, mods.emoBad);
  const rawTac = getNetProb(0.35, mods.tacGood, mods.tacBad);
  const rawRattle = getNetProb(0.62, mods.rattleGood, mods.rattleBad);

  // Ensure standard directives display distinct probabilities even when OVR gap is large
  const usedProbs = new Set<number>();
  const ensureDistinctProb = (val: number, fallbackDelta: number) => {
    let candidate = Math.max(5, Math.min(95, val));
    if (!usedProbs.has(candidate)) {
      usedProbs.add(candidate);
      return candidate;
    }
    const step = fallbackDelta >= 0 ? 1 : -1;
    for (let i = 1; i <= 12; i++) {
      const next = Math.max(5, Math.min(95, candidate + step * i));
      if (!usedProbs.has(next)) {
        usedProbs.add(next);
        return next;
      }
      const alt = Math.max(5, Math.min(95, candidate - step * i));
      if (!usedProbs.has(alt)) {
        usedProbs.add(alt);
        return alt;
      }
    }
    return candidate;
  };
  const netSafe = ensureDistinctProb(rawSafe, 2);
  const netEmo = ensureDistinctProb(rawEmo, -2);
  const netTac = ensureDistinctProb(rawTac, -4);
  const netRattle = ensureDistinctProb(rawRattle, 1);

  const handleChoice = (choiceIndex: number) => {
    setDecisionChoice(choiceIndex);
    let myEffectiveOvr = playerOvr;
    let resultDesc = '';
    let flatWinProb: number | null = null;
    let dirName = '';

    const rand = Math.random();

    switch (choiceIndex) {
      case 6: // MP Boost
        if ((gameState.skillPoints || 0) < 5) return;
        myEffectiveOvr += 12;
        dirName = 'Directive: Masterclass Blueprint (+12 OVR)';
        resultDesc = 'Masterclass tactical plan executed flawlessly (+12 OVR).';
        break;

      case 1: // Trust the Routine
        dirName = 'Directive: Trust the Routine';
        flatWinProb = netSafe / 100;
        if (rand < 0.75) {
          myEffectiveOvr += mods.safeGood;
          resultDesc = `The squad stayed composed and executed their club identity (${mods.safeGood >= 0 ? '+' : ''}${mods.safeGood} OVR).`;
        } else {
          myEffectiveOvr += mods.safeBad;
          resultDesc = `The squad struggled to impose their routine against the opposition (${mods.safeBad >= 0 ? '+' : ''}${mods.safeBad} OVR).`;
        }
        break;

      case 2: // Emotional Speech
        dirName = 'Directive: High-Intensity Speech';
        flatWinProb = netEmo / 100;
        if (rand < 0.55) {
          myEffectiveOvr += mods.emoGood;
          resultDesc = `Relentless pressing energy (${mods.emoGood >= 0 ? '+' : ''}${mods.emoGood} OVR).`;
        } else {
          myEffectiveOvr += mods.emoBad;
          resultDesc = `Over-emotional pressing left gaps in transition (${mods.emoBad >= 0 ? '+' : ''}${mods.emoBad} OVR).`;
        }
        break;

      case 3: // Tactical Shift
        dirName = 'Directive: Last-Minute Tactical Shift';
        flatWinProb = netTac / 100;
        if (rand < 0.35) {
          myEffectiveOvr += mods.tacGood;
          resultDesc = `Positional masterstroke confounded the opponent (${mods.tacGood >= 0 ? '+' : ''}${mods.tacGood} OVR).`;
        } else {
          myEffectiveOvr += mods.tacBad;
          resultDesc = `Overthought the system — confusion in transition (${mods.tacBad >= 0 ? '+' : ''}${mods.tacBad} OVR).`;
        }
        break;

      case 4: // Mind Games
        dirName = 'Directive: Press Mind Games';
        flatWinProb = netRattle / 100;
        if (rand < 0.62) {
          myEffectiveOvr += mods.rattleGood;
          resultDesc = `Pragmatic siege mentality rattled the opposition (${mods.rattleGood >= 0 ? '+' : ''}${mods.rattleGood} OVR).`;
        } else {
          myEffectiveOvr += mods.rattleBad;
          resultDesc = `Public comments backfired and disrupted squad rhythm (${mods.rattleBad >= 0 ? '+' : ''}${mods.rattleBad} OVR).`;
        }
        break;

      case 5: // Set-pieces
        dirName = 'Directive: Set-Piece Chaos Focus';
        flatWinProb = 0.3333;
        resultDesc = 'Dedicated preparation on dead-ball deliveries all week.';
        break;
    }

    executeMatch(myEffectiveOvr, flatWinProb, dirName, resultDesc);
  };

  // Determine whether the user won the overall Season Finale duel (accounting for pre-match points/GD lead on a Matchday 34 draw)
  const didWinDuel = isTwoLegged
    ? Boolean(matchResult?.won)
    : Boolean(
        matchResult?.won ||
        (matchResult?.draw && (userPts > rivalPts || (userPts === rivalPts && userGd >= rivalGd)))
      );


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#12141c]/95 backdrop-blur-xl w-full max-w-2xl rounded-[24px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] relative flex flex-col h-[90vh] sm:h-auto max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto overflow-hidden text-left shrink-0"
      >
        {/* Subtle Ambient Background Glow with Prestige Accent */}
        <div 
          className="absolute -top-28 -right-28 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: theme.accentHex }}
        />

        {/* ========================================================================= */}
        {/* STAGE 1: TACTICAL RECOMMENDATIONS FOR HEAD COACH                          */}
        {/* ========================================================================= */}
        {stage === 'choice' && (
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header: Event Trophy & Decision Day Stakes (Pinned on mobile & desktop) */}
            <div className="shrink-0 relative z-20 border-b border-white/[0.08] bg-[#12141c]/90 backdrop-blur-md px-4 py-3.5 sm:px-6 sm:py-5 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Prestige Trophy / Upward Arrow Emblem / Survival Shield */}
                <div className="relative shrink-0">
                  {ddType === 'title' ? (
                    <PrestigeTrophy
                      type={ddType}
                      size={Math.min(theme.trophyHeight, 46)}
                      className="drop-shadow-lg"
                    />
                  ) : isPlayoff ? (
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-emerald-500/25 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                      <i className="fa-solid fa-arrow-trend-up"></i>
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-xl">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full ${theme.tagPillBg}`}>
                      {theme.badgeLabel.en}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-sky-300 bg-sky-500/10 border border-sky-400/20 px-2 sm:px-2.5 py-0.5 rounded-full">
                      {isTwoLegged ? (currentLeg === 1 ? 'Playoff · Leg 1 of 2 (Away)' : 'Playoff · Leg 2 of 2 (Home Decider)') : (isPlayoff ? 'Post-Season Knockout Tie' : 'Matchday 34 · Final')}
                    </span>
                    <BroadcastBadge country={gameState.club.country} competitionId={ddType} isModActive={isModActive} tier={gameState.club.tier} />
                  </div>
                  <h2 className="text-base sm:text-2xl font-bold text-white tracking-tight leading-tight">
                    {isTwoLegged
                      ? (currentLeg === 1 ? 'Promotion Playoff · First Leg' : 'Promotion Playoff · Second Leg Decider')
                      : isPlayoff
                      ? 'Promotion Playoff Final'
                      : ddType === 'relegation'
                      ? (isBottomTier
                          ? 'Pyramid Floor Survival Duel'
                          : isCrossTierPlayoff
                          ? 'Relegation Playoff Decider'
                          : 'Board Survival Battle')
                      : 'Championship Decider'}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 font-normal truncate sm:whitespace-normal">
                    {isTwoLegged
                      ? (currentLeg === 1
                          ? `First leg away at ${oppClub.name}. Set your gameplan to secure a strong road result before returning home.`
                          : `Decisive second leg at home! Aggregate score determines promotion or survival.`)
                      : isPlayoff
                      ? `Winner takes the promotion ticket to the higher league`
                      : ddType === 'relegation'
                      ? (isBottomTier
                          ? `Pyramid floor: No lower division exists. Avoid the bottom-three dismissal zone to preserve your managerial contract (club remains in tier)`
                          : isCrossTierPlayoff
                          ? `Two-legged playoff decider against ${oppClub.name} to retain your league status`
                          : `High-stakes survival duel to escape the bottom-three dismissal zone and keep the board from terminating your contract`)
                      : `Final match to decide the league championship`}
                  </p>
                </div>
              </div>

              {/* Head Coach Pill */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-right shrink-0">
                <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Head Coach</div>
                <div className="text-xs sm:text-xs font-bold text-white truncate max-w-[85px] sm:max-w-[140px] mt-0.5">
                  {gameState.currentCoach?.name || 'Head Coach'}
                </div>
                <div className="text-[10px] text-zinc-400 truncate max-w-[140px] hidden sm:block">
                  {gameState.currentCoach?.role || 'Tactical Lead'}
                </div>
              </div>
            </div>

            {/* Scrollable Body Container */}
            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5 custom-scrollbar relative z-10 text-left">
              {/* First Leg Aggregate Status Banner for Leg 2 */}
              {isTwoLegged && currentLeg === 2 && leg1Result && (
                <div className="bg-gradient-to-r from-sky-500/15 via-emerald-500/10 to-sky-500/15 border border-sky-400/30 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 font-bold text-sm shrink-0">
                      Leg 2
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider">
                        Second Leg (Home Decider)
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-0.5">
                        First Leg: <strong className="text-white">{oppClub.name} {leg1Result.opp} – {leg1Result.me} {userClub.name}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Aggregate:</span>
                    <span className="text-sm font-black text-amber-300 font-mono bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                      {userClub.name} {leg1Result.me} – {leg1Result.opp} {oppClub.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Matchup Header */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                {isModActive && (
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 text-[10px]">
                    <span className="text-zinc-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                      <i className="fa-solid fa-satellite-dish text-sky-400 text-xs" />
                      <span>Official Matchday Broadcast</span>
                    </span>
                    <BroadcastBadge country={gameState.club.country} competitionId={ddType} isModActive={isModActive} tier={gameState.club.tier} />
                  </div>
                )}
                <div className="grid grid-cols-7 items-center">
                  <div className="col-span-3 flex flex-col items-center text-center">
                    <ClubLogo
                      name={userClub.name}
                      id={userClub.id}
                      color={userClub.color}
                      logo={userClub.logo}
                      fallbackLogo={userClub.fallbackLogo}
                      isModActive={isModActive}
                      className="w-14 h-14 object-contain mb-1.5 drop-shadow-sm"
                      fallbackClassName="w-14 h-14 text-sm rounded-full flex items-center justify-center font-bold text-white shrink-0 mb-1.5"
                    />
                    <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">{playerOvr} OVR</div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-200 truncate max-w-[130px] mt-0.5 py-0.5 leading-normal">{userClub.name}</div>
                  </div>

                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">VS</span>
                  </div>

                  <div className="col-span-3 flex flex-col items-center text-center">
                    <ClubLogo
                      name={oppClub.name}
                      id={oppClub.id}
                      color={oppClub.color}
                      logo={oppClub.logo}
                      fallbackLogo={oppClub.fallbackLogo}
                      isModActive={isModActive}
                      className="w-14 h-14 object-contain mb-1.5 drop-shadow-sm"
                      fallbackClassName="w-14 h-14 text-sm rounded-full flex items-center justify-center font-bold text-white shrink-0 mb-1.5"
                    />
                    <div className="text-xl sm:text-2xl font-bold text-zinc-400 tabular-nums">{localOpponentOvr} OVR</div>
                    <div className="text-xs sm:text-sm font-bold text-zinc-200 truncate max-w-[130px] mt-0.5 py-0.5 leading-normal">{oppClub.name}</div>
                  </div>
                </div>

                {/* Sleek 1-Line Stakes Banner inside Matchup Card */}
                <div className="mt-2 pt-2.5 border-t border-white/[0.06] flex items-center justify-center text-center">
                  <div className="text-[11px] sm:text-xs font-semibold text-amber-300 flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                    <span>{ddType === 'title' ? '🏆' : ddType === 'promotion_playoff' ? '⚡' : '🛡️'}</span>
                    <span>
                      {ddType === 'title'
                        ? (gameState.club.tier === 1
                            ? 'Stakes: Win = League Champions • Draw/Loss = Runner-Up'
                            : 'Stakes: Win = Champions Trophy & Promotion • 2nd = Direct Promotion')
                        : ddType === 'promotion_playoff'
                        ? 'Stakes: Win = Promoted to Higher Division • Defeat = Remain in Tier'
                        : isBottomTier
                        ? 'Stakes: Win/Draw = Sporting Survival • Loss = Board Termination Risk'
                        : 'Stakes: Win = Sporting Survival • Loss = Relegated to Lower Tier'}
                    </span>
                  </div>
                </div>
              </div>



              {/* Tactical Directives / Recommendation Choice */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-clipboard-check text-sky-400 text-xs" />
                    <span>Tactical Recommendation for Head Coach</span>
                  </span>
                  <span className="text-zinc-500 text-[11px] font-medium">
                    {isTacticalDuel ? 'Counter System' : 'Strategic Directive'}
                  </span>
                </div>

                {/* Scout Insight & Identity Alignment Bar */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-3.5 py-2.5 text-xs flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <i className="fa-solid fa-compass text-sky-400 text-[11px]" />
                      <span>Philosophy: <strong className="text-white font-semibold">{gameState.tactic || 'Total Football'}</strong></span>
                      <span className="text-zinc-600">·</span>
                      <span>Coach: <strong className="text-sky-300 font-semibold">{gameState.currentCoach?.style || 'Balanced'}</strong></span>
                    </span>
                    {hasTacticalGeniusPerk ? (
                      <span className="font-semibold text-white">
                        <i className="fa-solid fa-chess-knight text-amber-400 text-[10px] mr-1" />
                        Tactical Genius: Opponent plays <strong className="text-amber-300 font-semibold">{oppTacticInfo.en}</strong>
                      </span>
                    ) : coachUnderstandsOpponent ? (
                      <span className="font-semibold text-sky-200">
                        <i className="fa-solid fa-chess text-sky-400 text-[10px] mr-1" />
                        Tactical Master Coach decoded <strong className="text-amber-300 font-semibold">{oppTacticInfo.en}</strong>
                      </span>
                    ) : isTacticalMasterCoach ? (
                      <span className="text-zinc-500 italic text-[11px]">
                        <i className="fa-solid fa-lock text-[10px] mr-1" />
                        Coach couldn't decode {oppClub.name} · Activate 'Tactical Genius' perk for all odds
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic text-[11px]">
                        <i className="fa-solid fa-lock text-[10px] mr-1" />
                        Activate 'Tactical Genius' manager perk to reveal opponent system &amp; odds
                      </span>
                    )}
                  </div>
                </div>

                {/* Tactical Selections */}
                <div className="space-y-2">
                  {isTacticalDuel ? (
                    <>
                      <button
                        onClick={() => handleTacticalDuelChoice('Gegenpressing')}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors">
                            ⚡ Gegenpressing
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Beats Tiki-Taka · Vulnerable to Counter</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Gegenpressing')}`}>
                          {canSeeOdds ? `${getRpsWinProb('Gegenpressing')}% Win Prob` : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleTacticalDuelChoice('Direct Counter')}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors">
                            🎯 Direct Counter
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Beats Gegenpress · Vulnerable to Catenaccio</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Direct Counter')}`}>
                          {canSeeOdds ? `${getRpsWinProb('Direct Counter')}% Win Prob` : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleTacticalDuelChoice('Catenaccio')}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors">
                            🛡️ Catenaccio (Park the Bus)
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Beats Direct Counter · Vulnerable to Tiki-Taka</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Catenaccio')}`}>
                          {canSeeOdds ? `${getRpsWinProb('Catenaccio')}% Win Prob` : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleTacticalDuelChoice('Tiki-Taka')}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors">
                            🧠 Tiki-Taka
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Beats Catenaccio · Vulnerable to Gegenpress</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Tiki-Taka')}`}>
                          {canSeeOdds ? `${getRpsWinProb('Tiki-Taka')}% Win Prob` : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleTacticalDuelChoice('Total Football')}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs group-hover:text-sky-300 transition-colors">
                            ⚖️ Total Football
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Fluid positional play · Dependent on philosophy &amp; coach</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Total Football')}`}>
                          {canSeeOdds ? `${getRpsWinProb('Total Football')}% Win Prob` : '???% Odds'}
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleChoice(1)}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs">Trust the Routine (Ancelotti · {gameState.tactic || 'Club Identity'})</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Rely on your established club philosophy &amp; coach synergy</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${canSeeOdds ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {canSeeOdds ? `${netSafe}% Win Prob` : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleChoice(2)}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs">Emotional War Cry (Klopp · Gegenpressing)</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Maximum pressing intensity · Clashes with Low Block philosophy</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${canSeeOdds ? 'text-amber-400' : 'text-zinc-500'}`}>
                          {canSeeOdds ? `${netEmo}% Win Prob` : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleChoice(3)}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs">Last-Minute System Overhaul (Pep · Tiki-Taka)</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Intricate possession overload · Clashes with Direct Counter &amp; Low Block</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${canSeeOdds ? 'text-amber-400' : 'text-zinc-500'}`}>
                          {canSeeOdds ? `${netTac}% Win Prob` : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleChoice(4)}
                        className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-3 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-white text-xs">Press Conference Mind Games (Mourinho · Low Block)</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">Pragmatic defensive siege · Clashes with Gegenpressing &amp; Tiki-Taka</div>
                        </div>
                        <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${canSeeOdds ? 'text-sky-400' : 'text-zinc-500'}`}>
                          {canSeeOdds ? `${netRattle}% Win Prob` : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleChoice(5)}
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 p-3 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="font-semibold text-emerald-300 text-xs">Set-Pieces &amp; Marginal Gains</div>
                          <div className="text-[11px] text-emerald-200/70 mt-0.5">Risk everything on dead-ball efficiency</div>
                        </div>
                        <div className="text-xs tabular-nums font-semibold text-emerald-300 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                          {canSeeOdds ? '33% Fixed Prob' : '???% Odds'}
                        </div>
                      </button>

                      <button
                        onClick={() => handleChoice(6)}
                        disabled={(gameState.skillPoints || 0) < 5}
                        className={`w-full ${(gameState.skillPoints || 0) >= 5 ? 'bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 cursor-pointer' : 'bg-white/[0.02] border border-white/[0.05] opacity-40 cursor-not-allowed'} p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-3 active:scale-[0.99]`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-amber-300 text-xs flex items-center gap-1.5">
                            <span className="truncate">Masterclass Directive</span>
                            <span className="text-[11px] font-bold bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/40 tabular-nums whitespace-nowrap shrink-0 inline-flex items-center leading-normal">-5 MP</span>
                          </div>
                          <div className="text-[11px] text-amber-200/70 mt-0.5">+12 OVR decisive tactical blueprint</div>
                        </div>
                        <div className="text-xs tabular-nums font-semibold text-amber-300 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 whitespace-nowrap shrink-0">
                          {canSeeOdds ? `${calcProb(12)}% Win Prob` : '???% Odds'}
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: THE GAME UNFOLDS (BROADCAST SCOREBOARD SIMULATION)               */}
        {/* ========================================================================= */}
        {stage === 'match' && (
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Pinned Stage 2 Header */}
            <div className="shrink-0 relative z-20 border-b border-white/[0.08] bg-[#12141c]/90 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="relative shrink-0">
                  {ddType === 'title' ? (
                    <PrestigeTrophy
                      type={ddType}
                      size={38}
                      className="drop-shadow-lg"
                    />
                  ) : isPlayoff ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/25 to-emerald-500/25 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                      <i className="fa-solid fa-arrow-trend-up"></i>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-lg">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                    <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full ${theme.tagPillBg}`}>
                      {theme.badgeLabel.en}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {isTwoLegged ? `Live · Leg ${currentLeg} of 2` : (isPlayoff ? 'Live · Playoff Tie' : 'Live · Matchday 34')}
                    </span>
                    <BroadcastBadge country={gameState.club.country} competitionId={ddType} isModActive={isModActive} tier={gameState.club.tier} />
                  </div>
                  <h2 className="text-sm sm:text-xl font-bold text-white tracking-tight leading-tight">
                    {isTwoLegged
                      ? (currentLeg === 1 ? 'Promotion Playoff · First Leg' : 'Promotion Playoff · Second Leg Decider')
                      : isPlayoff
                      ? 'Promotion Playoff Final'
                      : ddType === 'relegation'
                      ? (isBottomTier
                          ? 'Pyramid Floor Survival Duel'
                          : isCrossTierPlayoff
                          ? 'Relegation Playoff Decider'
                          : 'Board Survival Battle')
                      : 'Championship Decider'}
                  </h2>
                </div>
              </div>

              {/* Match Minute Clock & Rival Status */}
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 text-center shrink-0">
                <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Match Clock</div>
                <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono tabular-nums">{matchMinute}'</div>
              </div>
            </div>

            {/* Scrollable Stage 2 Body */}
            <div ref={matchScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar relative z-10 flex flex-col items-center justify-start">
              <div className="w-full max-w-md my-2 sm:my-auto rounded-[24px] border border-white/[0.08] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#12141c]/95">
                {/* Scoreboard Header */}
                <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <i className={`fas ${theme.iconClass} text-xs ${theme.bannerAccentText} shrink-0`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white truncate">
                      {isTwoLegged ? `Playoff Tie · Leg ${currentLeg} of 2` : `${theme.badgeLabel.en} · Matchday 34`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isTwoLegged && (
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 tabular-nums hidden sm:flex">
                        <span>Rival {rivalName}: <strong className="text-white">{simultaneousRivalScore}</strong></span>
                      </div>
                    )}
                    <BroadcastBadge country={gameState.club.country} competitionId={ddType} isModActive={isModActive} tier={gameState.club.tier} />
                  </div>
                </div>

                {/* Simulating 90 Minutes Suspense Banner */}
                <div className="bg-gradient-to-r from-amber-500/15 via-sky-500/15 to-emerald-500/15 border-b border-white/[0.08] px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <span className="font-bold uppercase tracking-wider text-amber-300 text-[10px] sm:text-xs">
                      Simulating 90 Minutes...
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-300 tabular-nums">
                    {Math.round((matchMinute / 90) * 100)}%
                  </span>
                </div>

                {/* Match Progress Bar */}
                <div className="w-full h-1 bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, (matchMinute / 90) * 100)}%` }}
                  />
                </div>

                {/* Ticking Clock & Directive Bar */}
                <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-2xl font-bold tabular-nums tracking-wider text-white">
                      {matchMinute}'
                    </span>
                  </div>
                  {appliedDirective && (
                    <div className="text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full truncate max-w-[190px]">
                      {appliedDirective}
                    </div>
                  )}
                </div>

                {/* Scoreboard Teams & Live Score */}
                <div className="flex items-center justify-between p-3.5 sm:p-6 gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                    <ClubLogo
                      name={userClub.name}
                      id={userClub.id}
                      color={userClub.color}
                      logo={userClub.logo}
                      fallbackLogo={userClub.fallbackLogo}
                      isModActive={isModActive}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-1.5 sm:mb-2 drop-shadow-sm"
                      fallbackClassName="w-12 h-12 sm:w-16 sm:h-16 text-sm sm:text-base rounded-full flex items-center justify-center font-bold text-white shrink-0 mb-1.5 sm:mb-2"
                    />
                    <div className="text-xs font-bold text-white truncate max-w-[95px] sm:max-w-[130px] py-0.5 leading-normal">{userClub.name}</div>
                    <div className="text-[10px] text-zinc-400 tabular-nums mt-0.5">OVR {playerOvr}</div>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 px-1 sm:px-3 flex flex-col items-center justify-center min-w-[80px] sm:min-w-[110px]">
                    <div className="bg-black/50 border border-white/10 rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center gap-1 sm:gap-2 shadow-inner">
                      <span className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight min-w-[16px] sm:min-w-[22px] text-center ${theme.scoreboardScoreColor}`}>
                        {liveScore.me}
                      </span>
                      <span className="text-zinc-400 font-bold text-sm sm:text-lg select-none px-0.5 leading-none">–</span>
                      <span className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight min-w-[16px] sm:min-w-[22px] text-center ${theme.scoreboardScoreColor}`}>
                        {liveScore.opp}
                      </span>
                    </div>
                    {isTwoLegged && currentLeg === 2 && leg1Result && (
                      <div className="mt-1 text-[10px] font-bold text-sky-300 bg-sky-500/15 border border-sky-400/30 px-2 py-0.5 rounded-md text-center whitespace-nowrap">
                        Agg: {(leg1Result?.me || 0) + liveScore.me} – {(leg1Result?.opp || 0) + liveScore.opp}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                    <ClubLogo
                      name={oppClub.name}
                      id={oppClub.id}
                      color={oppClub.color}
                      logo={oppClub.logo}
                      fallbackLogo={oppClub.fallbackLogo}
                      isModActive={isModActive}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-1.5 sm:mb-2 drop-shadow-sm"
                      fallbackClassName="w-12 h-12 sm:w-16 sm:h-16 text-sm sm:text-base rounded-full flex items-center justify-center font-bold text-white shrink-0 mb-1.5 sm:mb-2"
                    />
                    <div className="text-xs font-bold text-white truncate max-w-[95px] sm:max-w-[130px] py-0.5 leading-normal">{oppClub.name}</div>
                    <div className="text-[10px] text-zinc-400 tabular-nums mt-0.5">OVR {localOpponentOvr}</div>
                  </div>
                </div>

                {/* Live Match Ticker / Event */}
                {recentEvent && (
                  <div className="bg-white/[0.02] border-t border-white/[0.06] px-4 py-2.5 text-center text-xs font-medium text-zinc-300">
                    <i className="fa-regular fa-futbol text-sky-400 mr-1.5" />
                    {recentEvent}
                  </div>
                )}
              </div>

              {/* Match Stakes Panel: On Mobile, streamlined 1-line live status pill; on desktop, full matrix */}
              <div className="mt-3 sm:mt-4 w-full max-w-md">
                <div className="sm:hidden px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {ddType === 'title' ? (
                        liveScore.me > liveScore.opp ? 'LIVE STANDING: #1 (CHAMPIONS 🏆)' :
                        liveScore.me === liveScore.opp ? 'LIVE STANDING: LEVEL / TITLE ON GD' :
                        'LIVE STANDING: #2 (RUNNER-UP)'
                      ) : isPlayoff ? (
                        (isTwoLegged && currentLeg === 2 ? ((leg1Result?.me || 0) + liveScore.me > (leg1Result?.opp || 0) + liveScore.opp) : liveScore.me > liveScore.opp) ? 'LIVE STATUS: PROMOTED (AGGREGATE LEAD)' :
                        (isTwoLegged && currentLeg === 2 ? ((leg1Result?.me || 0) + liveScore.me === (leg1Result?.opp || 0) + liveScore.opp) : liveScore.me === liveScore.opp) ? 'LIVE STATUS: LEVEL ON AGGREGATE' :
                        'LIVE STATUS: TRAILING ON AGGREGATE'
                      ) : (
                        (isTwoLegged && currentLeg === 2 ? ((leg1Result?.me || 0) + liveScore.me > (leg1Result?.opp || 0) + liveScore.opp) : liveScore.me > liveScore.opp) ? 'LIVE STATUS: SURVIVAL SECURED (SAFE)' :
                        (isTwoLegged && currentLeg === 2 ? ((leg1Result?.me || 0) + liveScore.me === (leg1Result?.opp || 0) + liveScore.opp) : liveScore.me === liveScore.opp) ? 'LIVE STATUS: SURVIVAL ON THE WIRE' :
                        'LIVE STATUS: RELEGATION DANGER ZONE'
                      )}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  {renderMatchStakes(true)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE: LEG 1 SUMMARY / HALFTIME BETWEEN LEGS                              */}
        {/* ========================================================================= */}
        {stage === 'leg1_summary' && leg1Result && (
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header */}
            <div className="shrink-0 relative z-20 border-b border-white/[0.08] bg-[#12141c]/90 backdrop-blur-md px-4 py-3.5 sm:px-6 sm:py-5 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-emerald-500/25 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
                  <i className="fa-solid fa-arrow-trend-up"></i>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-sky-300 bg-sky-500/10 border border-sky-400/20 px-2 sm:px-2.5 py-0.5 rounded-full">
                      Leg 1 of 2 Complete
                    </span>
                    <BroadcastBadge country={gameState.club.country} competitionId={ddType} isModActive={isModActive} tier={gameState.club.tier} />
                  </div>
                  <h2 className="text-base sm:text-2xl font-bold text-white tracking-tight leading-tight">
                    Playoff · First Leg Whistle
                  </h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                    Halfway through the series. Review the first leg score and set your tactics for the home return leg.
                  </p>
                </div>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-center shrink-0">
                <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Leg 1 Score</div>
                <div className="text-sm font-bold text-white font-mono">{(leg1Result?.score || '0-0').replace('-', ' – ')}</div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar relative z-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                  First Leg Result (Away)
                </div>
                <div className="grid grid-cols-7 items-center mb-5">
                  <div className="col-span-3 flex flex-col items-center text-center">
                    <ClubLogo
                      name={userClub.name}
                      id={userClub.id}
                      color={userClub.color}
                      logo={userClub.logo}
                      fallbackLogo={userClub.fallbackLogo}
                      isModActive={isModActive}
                      className="w-14 h-14 object-contain mb-2 drop-shadow-sm"
                    />
                    <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] py-0.5 leading-normal">{userClub.name}</div>
                  </div>

                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tabular-nums bg-black/40 px-3 py-1.5 rounded-2xl border border-white/10">
                      {leg1Result.me} – {leg1Result.opp}
                    </div>
                  </div>

                  <div className="col-span-3 flex flex-col items-center text-center">
                    <ClubLogo
                      name={oppClub.name}
                      id={oppClub.id}
                      color={oppClub.color}
                      logo={oppClub.logo}
                      fallbackLogo={oppClub.fallbackLogo}
                      isModActive={isModActive}
                      className="w-14 h-14 object-contain mb-2 drop-shadow-sm"
                    />
                    <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] py-0.5 leading-normal">{oppClub.name}</div>
                  </div>
                </div>

                {/* Aggregate Status Box */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 mb-5 text-center">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    Current Aggregate Status
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
                    {leg1Result.me > leg1Result.opp
                      ? `Advantage ${userClub.name} (+${leg1Result.me - leg1Result.opp} Agg)`
                      : leg1Result.me === leg1Result.opp
                      ? 'All Square on Aggregate (0-0)'
                      : `Deficit to Overturn (-${leg1Result.opp - leg1Result.me} Agg)`}
                  </div>
                  <div className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {leg1Result.me > leg1Result.opp
                      ? `Crucial road advantage! A home victory or draw in Leg 2 seals promotion.`
                      : leg1Result.me === leg1Result.opp
                      ? `Honors even heading to your home ground. Winner of Leg 2 takes all (penalties if drawn on aggregate).`
                      : `You must overturn the deficit in front of home supporters in Leg 2.`}
                  </div>
                </div>

                {/* Next Step CTA */}
                <button
                  onClick={handleProceedToLeg2}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-black font-bold text-sm sm:text-base tracking-wide transition-all shadow-lg shadow-sky-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Leg 2 (Home Decider) · Set Tactics</span>
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: RESULT & TROPHY PRESENTATION / WRAP-UP                           */}
        {/* ========================================================================= */}
        {stage === 'result' && matchResult && (
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Pinned Stage 3 Header */}
            <div className="shrink-0 relative z-20 border-b border-white/[0.08] bg-[#12141c]/90 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="relative shrink-0">
                  {ddType === 'title' ? (
                    <PrestigeTrophy
                      type={!didWinDuel && gameState.club.tier > 1 ? 'promotion' : ddType}
                      size={38}
                      className="drop-shadow-lg"
                    />
                  ) : isPlayoff ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/25 to-emerald-500/25 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                      <i className="fa-solid fa-arrow-trend-up"></i>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-lg">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
                    <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full ${theme.tagPillBg}`}>
                      {theme.badgeLabel.en}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-400/20 px-2 sm:px-2.5 py-0.5 rounded-full">
                      Full Time · Season Finale
                    </span>
                    <BroadcastBadge country={gameState.club.country} competitionId={ddType} isModActive={isModActive} tier={gameState.club.tier} />
                  </div>
                  <h2 className="text-base sm:text-xl font-bold text-white tracking-tight leading-tight">
                    {didWinDuel 
                      ? (ddType === 'title' 
                          ? 'Champions of the League!' 
                          : ddType === 'relegation'
                          ? (isCrossTierPlayoff ? 'Survival Secured (Playoff Winner)!' : 'Board Survival Secured!') 
                          : 'Promotion Playoff Winners!')
                      : (ddType === 'title' && gameState.club.tier > 1)
                      ? 'Promoted as Runner-Up!'
                      : ddType === 'relegation'
                      ? (isBottomTier ? 'Dismissal Zone Confirmed (Sacked)' : 'Relegation Confirmed')
                      : matchResult.draw
                      ? 'Final Day Draw'
                      : 'Final Day Heartbreak'}
                  </h2>
                </div>
              </div>

              {/* Final Score Badge */}
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 text-center shrink-0">
                <div className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Final Score</div>
                <div className="text-sm sm:text-base font-bold text-amber-300 font-mono tabular-nums">{(matchResult?.score || '0-0').replace('-', '–')}</div>
              </div>
            </div>

            {/* Scrollable Stage 3 Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar relative z-10 flex flex-col items-center justify-start text-center">
              <div className="my-auto w-full flex flex-col items-center justify-center">
              {/* Grand Emblem: Prestige Trophy for Title, Upward Arrow for Playoff, Shield for Relegation */}
              {ddType === 'title' ? (
                <div className="mb-3">
                  <PrestigeTrophy
                    type={!didWinDuel && gameState.club.tier > 1 ? 'promotion' : ddType}
                    size={Math.round(theme.trophyHeight * 1.1)}
                    className="animate-pulse drop-shadow-2xl"
                  />
                </div>
              ) : isPlayoff ? (
                <div className="mb-4 flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-3xl border flex items-center justify-center text-4xl shadow-2xl transition-all duration-500 ${
                    didWinDuel
                      ? 'bg-gradient-to-br from-cyan-500/25 via-emerald-500/20 to-cyan-500/25 border-cyan-400/50 text-cyan-300 shadow-[0_0_50px_rgba(6,182,212,0.4)] animate-bounce'
                      : 'bg-white/[0.04] border-white/[0.1] text-zinc-400'
                  }`}>
                    <i className={`fa-solid ${didWinDuel ? 'fa-arrow-trend-up' : 'fa-xmark'}`} />
                  </div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
                    {didWinDuel ? 'Direct Promotion Secured · #3 Playoff Winner' : 'Promotion Playoff Finalist'}
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-3xl border flex items-center justify-center text-4xl shadow-2xl transition-all duration-500 ${
                    didWinDuel
                      ? 'bg-gradient-to-br from-emerald-500/25 via-sky-500/20 to-emerald-500/25 border-emerald-400/50 text-emerald-300 shadow-[0_0_50px_rgba(16,185,129,0.4)]'
                      : 'bg-gradient-to-br from-rose-500/25 via-red-500/20 to-rose-500/25 border-rose-400/50 text-rose-300 shadow-[0_0_50px_rgba(244,63,94,0.4)] animate-pulse'
                  }`}>
                    <i className={`fa-solid ${didWinDuel ? 'fa-shield-halved' : 'fa-arrow-trend-down'}`} />
                  </div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-300">
                    {didWinDuel 
                      ? 'Survival Secured' 
                      : (isBottomTier ? 'Dismissal Zone Confirmed' : 'Relegation Confirmed')}
                  </div>
                </div>
              )}

              {/* Official Broadcast Branding - always active for Decision Day presentation */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <BroadcastBadge country={gameState.club.country} competitionId={ddType} isModActive={isModActive} tier={gameState.club.tier} />
                <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md">
                  Official Broadcast
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                <span>{(matchResult?.score || '0-0').replace('-', ' – ')} Full Time</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight mb-2">
                {didWinDuel 
                  ? (ddType === 'title' 
                      ? 'CHAMPIONS OF THE LEAGUE!' 
                      : ddType === 'relegation'
                      ? (isCrossTierPlayoff ? 'SURVIVAL SECURED (PLAYOFF WINNER)!' : 'BOARD SURVIVAL SECURED!') 
                      : 'PROMOTION ACHIEVED (PLAYOFF WINNER)!')
                  : (ddType === 'title' && gameState.club.tier > 1)
                  ? 'PROMOTED AS RUNNER-UP!'
                  : ddType === 'relegation'
                  ? (isBottomTier ? 'DISMISSAL ZONE CONFIRMED (SACKED)' : 'RELEGATION CONFIRMED')
                  : matchResult?.draw
                  ? 'FINAL DAY DRAW'
                  : 'FINAL DAY HEARTBREAK'}
              </h2>

              <p className="text-sm text-zinc-300 max-w-md mb-4 font-normal leading-relaxed">
                {didWinDuel
                  ? (ddType === 'title'
                      ? (matchResult?.draw
                          ? `Clinched on the final whistle! A hard-fought draw on Decision Day keeps ${userClub.name} ahead of ${rivalName} to capture the championship trophy!`
                          : `Victory! ${userClub.name} finishes on top of the table and captures the coveted championship trophy!`)
                      : ddType === 'relegation'
                      ? (isBottomTier
                          ? `Survival secured! The squad holds firm on Decision Day, avoiding the bottom-3 sacking zone to keep the manager in charge!`
                          : isCrossTierPlayoff
                          ? `Playoff victory! ${userClub.name} triumphs in the Relegation Playoff against ${oppClub.name} and defends their place in ${getLeagueInfo(gameState.club.tier, gameState.club.country)?.name || 'current division'}!`
                          : `Defiant survival! The club holds firm on the final matchday and maintains league status.`)
                      : `Promotion locked! ${userClub.name} triumphs on Decision Day as Playoff Winners${isCrossTierPlayoff ? ` against ${oppClub.name}` : ''} and punches their ticket to ${
                          gameState.club.tier > 1 ? (getLeagueInfo(Math.max(1, gameState.club.tier - 1), gameState.club.country)?.name || 'higher division') : 'the higher division'
                        }!`)
                  : (ddType === 'title' && gameState.club.tier > 1)
                  ? `Although the title was claimed by ${rivalName}, finishing as 2nd-place Runner-Up secures direct promotion to the higher division! A landmark campaign!`
                  : matchResult?.draw
                  ? (ddType === 'relegation'
                      ? `A tense draw on Decision Day was not enough to overtake ${rivalName}. The club drops below the survival line.`
                      : `A tense draw on Decision Day leaves ${userClub.name} just behind ${rivalName} in the final table.`)
                  : (ddType === 'title'
                      ? `A slip-up on the final matchday costs the title. ${rivalName} takes advantage to finish ahead.`
                      : ddType === 'relegation'
                      ? (isBottomTier
                          ? `Heartbreaking final matchday defeat. The club finishes in the sporting relegation zone. As this is the pyramid floor, ${userClub.name} remains in ${getLeagueInfo(gameState.club.tier, gameState.club.country)?.name || 'current division'}, but the Board of Directors has immediately sacked you for sporting failure!`
                          : isCrossTierPlayoff
                          ? `Heartbreaking playoff defeat. The club drops below the line and is relegated to the lower division.`
                          : `Heartbreaking final matchday defeat. The club drops below the line into relegation.`)
                      : `Promotion playoff falls short (${matchResult?.score || `${liveScore.me}-${liveScore.opp}`}). ${userClub.name} finishes ${userPos || 4}${userPos === 1 ? 'st' : userPos === 2 ? 'nd' : userPos === 3 ? 'rd' : 'th'} in the regular season standings. The squad will remain in ${getLeagueInfo(gameState.club.tier, gameState.club.country)?.name || 'current division'} for the upcoming campaign.`)}
              </p>

                <div className="pt-2 pb-4 shrink-0 w-full flex justify-center">
                  <button
                    onClick={() => {
                      let finalUserRank = 1;
                      const wonMatch = !!matchResult?.won;
                      const drawMatch = !!matchResult?.draw;
                      if (ddType === 'title') {
                        finalUserRank = didWinDuel ? 1 : 2;
                      } else if (isPlayoff) {
                        finalUserRank = didWinDuel ? 3 : (userPos || 4);
                      } else if (isRelegation) {
                        finalUserRank = didWinDuel ? (isCrossTierPlayoff ? 16 : Math.min(15, userPos ? Math.max(1, userPos - 1) : 15)) : (isBottomTier ? 18 : 16);
                      }
                      const isPostSeasonPlayoff = Boolean(isPlayoff || isCrossTierPlayoff);
                      const deltaPts = isPostSeasonPlayoff ? 0 : (wonMatch ? 3 : drawMatch ? 1 : 0);
                      const finalPts = userPts + deltaPts;
                      const isShootout = !!(matchResult?.score && matchResult.score.includes('pens'));
                      const deltaGd = (isPostSeasonPlayoff || isShootout)
                        ? 0
                        : (wonMatch ? Math.max(1, liveScore.me - liveScore.opp) : drawMatch ? 0 : Math.min(-1, liveScore.me - liveScore.opp));
                      const finalGd = userGd + deltaGd;
                      handleResolve({
                        won: isTwoLegged ? didWinDuel : wonMatch,
                        draw: drawMatch,
                        userRank: finalUserRank,
                        finalPts: finalPts,
                        finalGd: finalGd,
                        score: matchResult?.score || `${liveScore.me}-${liveScore.opp}`,
                        choice: decisionChoice
                      });
                    }}
                    className={`px-8 sm:px-10 py-3 sm:py-3.5 rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-sm ${theme.primaryBtnClass}`}
                  >
                    Complete Season
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DecisionDayModal;
