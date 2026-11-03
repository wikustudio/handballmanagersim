import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { t } from '../data/translations';
import { Language, GameState } from '../types';
import { ClubLogo } from './ClubLogo';
import { getActiveClubs, mergeClubWithWorldState } from '../utils/modManager';
import { formatMoney, normalizeCountry, isReserveClub, getCountryMult } from '../data/gameConstants';
import { getBroadcastingPackage } from '../data/broadcastingPackages';
import { useGameStore } from '../store/useGameStore';
import { TvCupTieModal } from './TvCupTieModal';
import { calculateProbabilisticSeason } from '../engine/engine';

interface SimulatingOverlayProps {
  phase?: "first_half" | "second_half" | "full";
  lang: Language;
  totalMatchdays: number;
  onComplete: () => void;
  state?: GameState;
}

interface SimulatedFixture {
  matchday: number;
  opponent: {
    id?: number | string;
    name: string;
    baseOvr: number;
    color?: string;
    color2?: string;
    logo?: string;
    fallbackLogo?: string;
  };
  isHome: boolean;
  userGoals: number;
  oppGoals: number;
  outcome: 'W' | 'D' | 'L';
  pts: number;
  momentum: number;
  isUpset: boolean;
}

function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DilemmaOption {
  textEn: string;
  textDe: string;
  cost: number;
  ovrChange: number;
  moraleChange: number;
  tagEn: string;
  tagDe: string;
}

interface ManagerialDilemma {
  id: string;
  titleEn: string;
  titleDe: string;
  descriptionEn: string;
  descriptionDe: string;
  optA: DilemmaOption;
  optB: DilemmaOption;
}

const MANAGERIAL_DILEMMAS: ManagerialDilemma[] = [
  {
    id: 'ligament_injury',
    titleEn: 'Top Scorer Ligament Tear',
    titleDe: 'Kreuzbandriss beim Top-Torschützen',
    descriptionEn: 'Your leading scorer collapsed clutching his knee during matchday drills. The medical team offers two rehabilitation paths.',
    descriptionDe: 'Dein bester Torschütze ist im Abschlusstraining zusammengebrochen. Die medizinische Abteilung bietet zwei Behandlungswege.',
    optA: {
      textEn: 'Private Clinic Fast-Track Rehab',
      textDe: 'Private Spezialklinik in der Schweiz',
      cost: 40000,
      ovrChange: 0,
      moraleChange: 0,
      tagEn: '-€40k · Immediate Recovery (0 OVR Loss)',
      tagDe: '-40.000 € · Sofortige Genesung (0 GES Abzug)'
    },
    optB: {
      textEn: 'Standard Public Physios',
      textDe: 'Standardmäßige Kassen-Physio',
      cost: 0,
      ovrChange: -2,
      moraleChange: 0,
      tagEn: 'Free (€0) · Out 8 Matches (-2 OVR Deficit)',
      tagDe: 'Kostenlos (0 €) · 8 Wochen Pause (-2 GES Defizit)'
    }
  },
  {
    id: 'tapping_up',
    titleEn: 'Rival Tapping Up Key Star',
    titleDe: 'Abwerbe-Versuch beim Spielmacher',
    descriptionEn: 'A higher division club has illegally tapped up your centre back playmaker through back-channels before the weekend match.',
    descriptionDe: 'Ein Spitzenklub aus der höheren Liga wirbt deinen Spielmacher mit astronomischem Handgeld ab.',
    optA: {
      textEn: 'Cash In Mid-Season',
      textDe: 'Sofort für 100.000 € verkaufen',
      cost: -100000,
      ovrChange: -2,
      moraleChange: 0,
      tagEn: '+€100k Windfall · Key Player Departs (-2 OVR)',
      tagDe: '+100.000 € Einnahme · Schlüsselspieler geht (-2 GES)'
    },
    optB: {
      textEn: 'Force Him To Stay',
      textDe: 'Wechsel verbieten & auf Vertrag pochen',
      cost: 0,
      ovrChange: 0,
      moraleChange: -15,
      tagEn: 'Keep Player · Dressing Room Unrest (-15 Morale)',
      tagDe: 'Spieler bleibt · Frust in der Kabine (-15 Moral)'
    }
  },
  {
    id: 'bonus_revolt',
    titleEn: 'Squad Matchday Bonus Ultimatum',
    titleDe: 'Kabinen-Streik um Siegprämien',
    descriptionEn: 'Squad captains corner you in the tunnel demanding an emergency €25,000 promotion bonus pool before the derby.',
    descriptionDe: 'Der Mannschaftsrat fordert ultimativ eine Sonderprämie von 25.000 € vor dem anstehenden Derby.',
    optA: {
      textEn: 'Authorize Bonus Pool',
      textDe: 'Sonderprämie freigeben',
      cost: 25000,
      ovrChange: 0,
      moraleChange: 15,
      tagEn: '-€25k · Squad Morale Surges (+15 Morale)',
      tagDe: '-25.000 € · Höchste Motivation (+15 Moral)'
    },
    optB: {
      textEn: 'Reject Greed Demands',
      textDe: 'Forderung ablehnen & Disziplin fordern',
      cost: 0,
      ovrChange: 0,
      moraleChange: -10,
      tagEn: 'Save Cash · Squad Discontent (-10 Morale)',
      tagDe: '0 € gespart · Mannschaft murrt (-10 Moral)'
    }
  },
  {
    id: 'tactical_leak',
    titleEn: 'Leaked Set-Play Signals',
    titleDe: 'Spionage beim Spielzug-Training',
    descriptionEn: 'Opposition analysts decoded your 7v6 and set-play calls from leaked match video.',
    descriptionDe: 'Gegnerische Videoanalysten haben deine 7-gegen-6-Laufwege und Spielzug-Kommandos entschlüsselt.',
    optA: {
      textEn: 'Hire Specialist Consultant',
      textDe: 'Taktikspezialist engagieren',
      cost: 20000,
      ovrChange: 1,
      moraleChange: 0,
      tagEn: '-€20k · Tactical System Upgrade (+1 OVR)',
      tagDe: '-20.000 € · System-Upgrade (+1 GES)'
    },
    optB: {
      textEn: 'Rely on Existing Habits',
      textDe: 'Bei gewohnten Abläufen bleiben',
      cost: 0,
      ovrChange: -1,
      moraleChange: 0,
      tagEn: 'Free (€0) · Tactical Staleness (-1 OVR Drag)',
      tagDe: '0 € Kosten · Vorhersehbare Spielzüge (-1 GES)'
    }
  }
];

export const SimulatingOverlay: React.FC<SimulatingOverlayProps> = ({
  lang,
  totalMatchdays,
  onComplete,
  phase = "full",
  state,
}) => {
  const targetEnd = phase === "first_half" ? Math.floor(totalMatchdays / 2) : totalMatchdays;
  const startDay = phase === "second_half" ? Math.floor(totalMatchdays / 2) + 1 : 1;
  const totalDaysInPhase = Math.max(1, targetEnd - startDay + 1);

  const [matchday, setMatchday] = useState(startDay);
  const currentTickRef = useRef(startDay);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const [activeDilemma, setActiveDilemma] = useState<ManagerialDilemma | null>(null);
  const [dilemmaFeedback, setDilemmaFeedback] = useState<string | null>(null);

  const [activeCupJackpot, setActiveCupJackpot] = useState<{
    giantName: string;
    giantOvr: number;
    cupName: string;
    jackpotAmount: number;
  } | null>(null);

  const isDilemmaActiveRef = useRef(false);
  const isCupJackpotActiveRef = useRef(false);
  const hasTriggeredDilemmaRef = useRef(false);
  const hasClaimedCupJackpotRef = useRef(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    currentTickRef.current = startDay;
    setMatchday(startDay);
    setIsFinishing(false);
    setIsFadingOut(false);
    hasCompletedRef.current = false;
  }, [phase, startDay]);

  const clubName = state?.club?.name || 'Your Club';
  const playerOvr = state?.club?.baseOvr || 70;
  const tier = state?.club?.tier || 1;
  const tactic = state?.tactics?.defensiveSystem || state?.tactic || '6:0 Defense';
  const philosophy = state?.club?.philosophy || 'Total Handball';
  const morale = state?.club?.morale ?? 75;

  const [modTick, setModTick] = useState(0);
  useEffect(() => {
    const onModChange = () => setModTick(t => t + 1);
    window.addEventListener('mod-state-change', onModChange);
    return () => window.removeEventListener('mod-state-change', onModChange);
  }, []);

  const activeClubs = useMemo(() => {
    const base = (getActiveClubs && getActiveClubs(state?.club?.country)) || [];
    const wc = state?.worldClubs;
    if (!wc) return base;
    return base.map(c => (wc[c.id] || wc[String(c.id)]) ? mergeClubWithWorldState(c, wc[c.id] || wc[String(c.id)]) : c);
  }, [state?.worldClubs, state?.club?.country, modTick]);
  const currentCountry = normalizeCountry(state?.club?.country || 'GER');
  const sameTierClubs = useMemo(
    () => (activeClubs || []).filter(c => c.tier === tier && normalizeCountry(c.country || 'GER') === currentCountry),
    [activeClubs, tier, currentCountry]
  );
  const effectiveTierClubs = useMemo(
    () => (sameTierClubs.length >= 4 ? sameTierClubs : (activeClubs || []).filter(c => c.tier === tier)),
    [sameTierClubs, activeClubs, tier]
  );
  const leagueSize = effectiveTierClubs.length > 0 ? effectiveTierClubs.length : 18;

  const clubHist = useMemo(
    () => (state?.history || []).filter(h => !h.clubName || h.clubName === state?.club?.name),
    [state?.history, state?.club?.name]
  );
  const rawLatestHist = state?.history && state.history.length > 0 ? state.history[state.history.length - 1] : undefined;
  const lastHist =
    rawLatestHist &&
    ((rawLatestHist.clubId !== undefined && state?.club?.id !== undefined && String(rawLatestHist.clubId) === String(state.club.id)) ||
      !rawLatestHist.clubName ||
      rawLatestHist.clubName === state?.club?.name)
      ? rawLatestHist
      : undefined;
  const currentTacticTenure = useMemo(() => {
    let tenure = 1;
    for (let i = clubHist.length - 1; i >= 0; i--) {
      if ((clubHist[i] as any).tactic === (state?.tactic || tactic)) {
        tenure++;
      } else {
        break;
      }
    }
    return tenure;
  }, [clubHist, state?.tactic, tactic]);
  const hasTacticalMastermind = Boolean((state?.managerSkills || []).includes('tactical_mastermind'));

  const tierBenchmarkOvr = useMemo(() => {
    if (effectiveTierClubs.length > 0) {
      return Math.round(effectiveTierClubs.reduce((sum, c) => sum + (c.baseOvr || 70), 0) / effectiveTierClubs.length);
    }
    switch (tier) {
      case 1: return 84;
      case 2: return 73;
      case 3: return 63;
      case 4: return 55;
      default: return 60;
    }
  }, [effectiveTierClubs, tier]);

  const sortedTierClubs = useMemo(() => {
    return [...effectiveTierClubs].sort((a, b) => (b.baseOvr || 70) - (a.baseOvr || 70));
  }, [effectiveTierClubs]);

  const clubTierRankIndex = sortedTierClubs.findIndex(c => 
    (state?.club?.id !== undefined && String(c.id) === String(state.club.id)) ||
    (state?.club?.name && c?.name && c.name.toLowerCase() === state.club.name.toLowerCase())
  );
  const clubTierRank = clubTierRankIndex >= 0 ? clubTierRankIndex + 1 : Math.round(leagueSize * 0.5);

  const relegationDepth = leagueSize >= 18 ? 3 : 2;
  const relegationLine = leagueSize - relegationDepth + 1;

  const boardExp = (state?.boardExpectation || '').toLowerCase();
  const boardTargetPos = state?.boardTargetPos;
  const hasRelegationBoardObjective = 
    boardExp.includes('relegat') || 
    boardExp.includes('abstieg') || 
    boardExp.includes('survival') || 
    boardExp.includes('klassenerhalt') ||
    (boardTargetPos !== undefined && boardTargetPos >= relegationLine);

  const isProvenTopHalf = Boolean(lastHist && lastHist.pos <= Math.ceil(leagueSize * 0.5));
  const finishedInRelegationDanger = Boolean(lastHist && !lastHist.relegated && !lastHist.promoted && lastHist.pos >= relegationLine);
  const isNewlyRelegated = Boolean(lastHist && lastHist.relegated);
  const isNewlyPromoted = Boolean(lastHist && (lastHist.promoted || (lastHist.nextTier && lastHist.tier && lastHist.nextTier < lastHist.tier)));
  const isBottomTierOvr = playerOvr <= tierBenchmarkOvr - 3 || clubTierRank >= relegationLine;
  const isSeverelyUnderstrength = playerOvr <= tierBenchmarkOvr - 2 && (morale <= 50 || isNewlyPromoted);

  const contextText = ((state?.club as any)?.historicContext || (state?.club as any)?.context || '').toLowerCase();
  const mentionsRelegation = contextText.includes('relegat') || contextText.includes('abstieg') || contextText.includes('klassenerhalt') || contextText.includes('survival');

  const isRelegationSeason = Boolean(
    !isNewlyRelegated && !isProvenTopHalf && (
      hasRelegationBoardObjective ||
      finishedInRelegationDanger ||
      isBottomTierOvr ||
      isSeverelyUnderstrength ||
      (mentionsRelegation && playerOvr < tierBenchmarkOvr)
    )
  );

  const moraleMod = morale <= 35 ? -3 : morale <= 50 ? -1 : morale >= 85 ? +1 : 0;
  const contextModifier = isRelegationSeason ? -4.0 : (isProvenTopHalf ? +0.5 : 0);

  const tempoMultiplier = useMemo(() => {
    if (tactic.includes('Fast Break') || philosophy.includes('Fast Break') || tactic.includes('7v6')) return 1.18;
    if (tactic.includes('6:0') || philosophy.includes('Defensive Wall')) return 0.88;
    if (tactic.includes('5:1') || tactic.includes('3:2:1')) return 1.05;
    return 1.0; 
  }, [tactic, philosophy]);

  const opponents = useMemo(() => {
    const opps = (effectiveTierClubs || []).filter(c => 
      (state?.club?.id !== undefined ? String(c.id) !== String(state.club.id) : true) &&
      (!c?.name || !clubName || c.name.toLowerCase() !== clubName.toLowerCase())
    );
    if (opps.length > 0) return opps;
    return [{ name: 'League Rival', baseOvr: tierBenchmarkOvr, id: 9999 }];
  }, [effectiveTierClubs, state?.club?.id, clubName, tierBenchmarkOvr]);

  const halfMatchdays = Math.floor(totalMatchdays / 2);

  // 1. Pre-calculate the EXACT engine season result (two-phase aware)
  const exactSeasonStats = useMemo(() => {
    const seed = (state?.year || 2026) * 10000 + Number(state?.club?.id || 1);
    const prevPending = state?.pendingSeasonState as any;
    const meta = prevPending?._meta;

    // When 2nd half starts, keep 1st half locked and recalculate 2nd half if OVR/morale/tactic changed
    if (phase === 'second_half' && prevPending && meta?.firstHalfOutcomes) {
      const hasMidSeasonChanges =
        playerOvr !== meta.initialOvr ||
        morale !== meta.initialMorale ||
        tactic !== meta.initialTactic;
      const currentSecondHalfKey = `${playerOvr}_${morale}_${tactic}`;

      if (!hasMidSeasonChanges || meta.secondHalfAppliedKey === currentSecondHalfKey) {
        return prevPending;
      }

      const updatedStats = calculateProbabilisticSeason(
        { ...state?.club, baseOvr: playerOvr } as any,
        tierBenchmarkOvr,
        tier,
        tactic,
        leagueSize,
        (morale + moraleMod),
        {
          isUserClub: true,
          consecutiveTitles: state?.consecutiveTitles || 0,
          medicalLevel: state?.club?.medicalLevel || 1,
          academyLevel: state?.club?.academyLevel || 1,
          tacticTenure: currentTacticTenure,
          hasTacticalMastermind,
          previousSeasonRecord: clubHist.length > 0 ? {
            wins: clubHist[clubHist.length - 1].wins,
            draws: clubHist[clubHist.length - 1].draws,
            losses: clubHist[clubHist.length - 1].losses,
            gf: clubHist[clubHist.length - 1].gf,
            ga: clubHist[clubHist.length - 1].ga,
          } : undefined,
          recentHistoryRecords: clubHist.slice(-3).map(h => ({
            wins: h.wins,
            draws: h.draws,
            losses: h.losses,
            pts: h.pts,
            gf: h.gf,
            ga: h.ga,
          })),
        }
      );

      const rng2 = createPRNG(seed + 777 + playerOvr * 13 + morale * 7);
      const newPool: ('W' | 'D' | 'L')[] = [
        ...Array(updatedStats.wins).fill('W'),
        ...Array(updatedStats.draws).fill('D'),
        ...Array(updatedStats.losses).fill('L'),
      ];
      for (let i = newPool.length - 1; i > 0; i--) {
        const j = Math.floor(rng2() * (i + 1));
        [newPool[i], newPool[j]] = [newPool[j], newPool[i]];
      }

      const firstHalfOutcomes: ('W' | 'D' | 'L')[] = meta.firstHalfOutcomes.slice(0, halfMatchdays);
      const secondHalfOutcomes: ('W' | 'D' | 'L')[] = newPool.slice(halfMatchdays, totalMatchdays);
      const allOutcomes: ('W' | 'D' | 'L')[] = [...firstHalfOutcomes, ...secondHalfOutcomes];

      const wins = allOutcomes.filter(o => o === 'W').length;
      const draws = allOutcomes.filter(o => o === 'D').length;
      const losses = allOutcomes.filter(o => o === 'L').length;
      const pts = wins * 2 + draws;

      const initialRawGf = meta.initialRawGf ?? prevPending.gf;
      const initialRawGa = meta.initialRawGa ?? prevPending.ga;
      const rawGf = Math.round(
        initialRawGf * (halfMatchdays / totalMatchdays) +
        updatedStats.gf * ((totalMatchdays - halfMatchdays) / totalMatchdays)
      );
      const rawGa = Math.round(
        initialRawGa * (halfMatchdays / totalMatchdays) +
        updatedStats.ga * ((totalMatchdays - halfMatchdays) / totalMatchdays)
      );

      const initialPts = meta.initialPts ?? prevPending.pts;
      const initialPos = meta.initialPos ?? prevPending.pos;
      const ptsDelta = pts - initialPts;
      const posShift = Math.round(ptsDelta / 2.2);
      const pos = Math.max(1, Math.min(leagueSize, initialPos - posShift));

      return {
        ...prevPending,
        wins,
        draws,
        losses,
        pts,
        gf: rawGf,
        ga: rawGa,
        pos,
        _meta: {
          ...meta,
          secondHalfOutcomes,
          allOutcomes,
          rawGf,
          rawGa,
          secondHalfAppliedKey: currentSecondHalfKey,
        },
      };
    }

    // If pendingSeasonState already exists during first_half (or externally injected), preserve it
    if (prevPending) {
      if (meta?.firstHalfOutcomes) {
        return prevPending;
      }
      // Attach _meta if pendingSeasonState was injected without _meta
      const rng = createPRNG(seed);
      const pool: ('W' | 'D' | 'L')[] = [
        ...Array(prevPending.wins).fill('W'),
        ...Array(prevPending.draws).fill('D'),
        ...Array(prevPending.losses).fill('L'),
      ];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const firstHalfOutcomes = pool.slice(0, halfMatchdays);
      const secondHalfOutcomes = pool.slice(halfMatchdays, totalMatchdays);
      return {
        ...prevPending,
        _meta: {
          initialOvr: playerOvr,
          initialMorale: morale,
          initialTactic: tactic,
          initialPts: prevPending.pts,
          initialPos: prevPending.pos,
          initialRawGf: prevPending.gf,
          initialRawGa: prevPending.ga,
          rawGf: prevPending.gf,
          rawGa: prevPending.ga,
          firstHalfOutcomes,
          secondHalfOutcomes,
          allOutcomes: pool,
        },
      };
    }

    // Fresh calculation at the start of first_half (or full)
    const baseStats = calculateProbabilisticSeason(
      { ...state?.club, baseOvr: playerOvr } as any,
      tierBenchmarkOvr,
      tier,
      tactic,
      leagueSize,
      (morale + moraleMod),
      {
        isUserClub: true,
        consecutiveTitles: state?.consecutiveTitles || 0,
        medicalLevel: state?.club?.medicalLevel || 1,
        academyLevel: state?.club?.academyLevel || 1,
        tacticTenure: currentTacticTenure,
        hasTacticalMastermind,
        previousSeasonRecord: clubHist.length > 0 ? {
          wins: clubHist[clubHist.length - 1].wins,
          draws: clubHist[clubHist.length - 1].draws,
          losses: clubHist[clubHist.length - 1].losses,
          gf: clubHist[clubHist.length - 1].gf,
          ga: clubHist[clubHist.length - 1].ga,
        } : undefined,
        recentHistoryRecords: clubHist.slice(-3).map(h => ({
          wins: h.wins,
          draws: h.draws,
          losses: h.losses,
          pts: h.pts,
          gf: h.gf,
          ga: h.ga,
        })),
      }
    );

    const rng = createPRNG(seed);
    const outcomePool: ('W' | 'D' | 'L')[] = [
      ...Array(baseStats.wins).fill('W'),
      ...Array(baseStats.draws).fill('D'),
      ...Array(baseStats.losses).fill('L'),
    ];
    for (let i = outcomePool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [outcomePool[i], outcomePool[j]] = [outcomePool[j], outcomePool[i]];
    }

    const firstHalfOutcomes = outcomePool.slice(0, halfMatchdays);
    const secondHalfOutcomes = outcomePool.slice(halfMatchdays, totalMatchdays);

    return {
      ...baseStats,
      _meta: {
        initialOvr: playerOvr,
        initialMorale: morale,
        initialTactic: tactic,
        initialPts: baseStats.pts,
        initialPos: baseStats.pos,
        initialRawGf: baseStats.gf,
        initialRawGa: baseStats.ga,
        rawGf: baseStats.gf,
        rawGa: baseStats.ga,
        firstHalfOutcomes,
        secondHalfOutcomes,
        allOutcomes: outcomePool,
      },
    };
  }, [
    phase,
    state?.pendingSeasonState,
    state?.year,
    state?.club?.id,
    playerOvr,
    tierBenchmarkOvr,
    tier,
    tactic,
    leagueSize,
    morale,
    moraleMod,
    halfMatchdays,
    totalMatchdays,
  ]);

  // 2. Distribute exact outcomes across visuals (locking 1st half scores & outcomes)
  const fixtures = useMemo<SimulatedFixture[]>(() => {
    const seed = (state?.year || 2026) * 10000 + Number(state?.club?.id || 1);
    const rng = createPRNG(seed + 101);
    const list: SimulatedFixture[] = [];

    const meta = (exactSeasonStats as any)?._meta;
    let outcomePool: ('W' | 'D' | 'L')[] = meta?.allOutcomes;

    if (!outcomePool || outcomePool.length < totalMatchdays) {
      const fallbackRng = createPRNG(seed);
      outcomePool = [
        ...Array(exactSeasonStats.wins).fill('W'),
        ...Array(exactSeasonStats.draws).fill('D'),
        ...Array(exactSeasonStats.losses).fill('L'),
      ];
      for (let i = outcomePool.length - 1; i > 0; i--) {
        const j = Math.floor(fallbackRng() * (i + 1));
        [outcomePool[i], outcomePool[j]] = [outcomePool[j], outcomePool[i]];
      }
    }

    const initialRawGf = meta?.initialRawGf ?? exactSeasonStats.gf;
    const initialRawGa = meta?.initialRawGa ?? exactSeasonStats.ga;
    const totalRawGf = meta?.rawGf ?? exactSeasonStats.gf;
    const totalRawGa = meta?.rawGa ?? exactSeasonStats.ga;

    let remainingGf1 = Math.round(initialRawGf * (halfMatchdays / totalMatchdays));
    let remainingGa1 = Math.round(initialRawGa * (halfMatchdays / totalMatchdays));
    let remainingGf2 = totalRawGf - remainingGf1;
    let remainingGa2 = totalRawGa - remainingGa1;

    for (let m = 1; m <= totalMatchdays; m++) {
      const opp = opponents[(m - 1) % opponents.length];
      const isHome = m % 2 === 1;
      const outcome = outcomePool[m - 1] || 'L';
      const pts = outcome === 'W' ? 2 : outcome === 'D' ? 1 : 0;

      const inFirstHalf = m <= halfMatchdays;
      const matchesLeftInHalf = inFirstHalf ? (halfMatchdays - m + 1) : (totalMatchdays - m + 1);
      const avgGfLeft = (inFirstHalf ? remainingGf1 : remainingGf2) / Math.max(1, matchesLeftInHalf);
      const avgGaLeft = (inFirstHalf ? remainingGa1 : remainingGa2) / Math.max(1, matchesLeftInHalf);

      let userGoals = Math.max(16, Math.round(avgGfLeft + (rng() * 4 - 2)));
      let oppGoals = Math.max(16, Math.round(avgGaLeft + (rng() * 4 - 2)));

      if (outcome === 'W') {
        if (userGoals <= oppGoals) userGoals = oppGoals + Math.floor(rng() * 3) + 1;
      } else if (outcome === 'D') {
        userGoals = oppGoals;
      } else {
        if (userGoals >= oppGoals) oppGoals = userGoals + Math.floor(rng() * 3) + 1;
      }

      if (inFirstHalf) {
        remainingGf1 -= userGoals;
        remainingGa1 -= oppGoals;
      } else {
        remainingGf2 -= userGoals;
        remainingGa2 -= oppGoals;
      }

      let momentum = 0;
      if (outcome === 'W') momentum = Math.round(52 + rng() * 34);
      else if (outcome === 'D') momentum = Math.round((rng() - 0.5) * 12);
      else momentum = -Math.round(42 + rng() * 44);

      list.push({
        matchday: m,
        opponent: {
          id: opp.id,
          name: opp.name,
          baseOvr: opp.baseOvr || tierBenchmarkOvr,
          color: (opp as any).color,
          color2: (opp as any).color2,
          logo: (opp as any).logo,
          fallbackLogo: (opp as any).fallbackLogo,
        },
        isHome,
        userGoals,
        oppGoals,
        outcome,
        pts,
        momentum,
        isUpset: outcome === 'W' && (playerOvr < (opp.baseOvr || tierBenchmarkOvr) - 2),
      });
    }

    return list;
  }, [totalMatchdays, halfMatchdays, opponents, exactSeasonStats, playerOvr, tierBenchmarkOvr, state?.year, state?.club?.id]);

  // 3. Safely sync to Zustand outside the render cycle with exact matchday GF/GA sum
  useEffect(() => {
    const totalGf = fixtures.reduce((sum, f) => sum + f.userGoals, 0);
    const totalGa = fixtures.reduce((sum, f) => sum + f.oppGoals, 0);
    const currentPending = state?.pendingSeasonState as any;
    const targetMeta = (exactSeasonStats as any)?._meta;

    const needsSync =
      !currentPending ||
      currentPending.pts !== exactSeasonStats.pts ||
      currentPending.wins !== exactSeasonStats.wins ||
      currentPending.draws !== exactSeasonStats.draws ||
      currentPending.losses !== exactSeasonStats.losses ||
      currentPending.pos !== exactSeasonStats.pos ||
      currentPending.gf !== totalGf ||
      currentPending.ga !== totalGa ||
      currentPending._meta?.secondHalfAppliedKey !== targetMeta?.secondHalfAppliedKey ||
      !currentPending._meta?.firstHalfOutcomes;

    if (needsSync) {
      useGameStore.getState().updateState({
        pendingSeasonState: {
          ...exactSeasonStats,
          gf: totalGf,
          ga: totalGa,
        },
      });
    }
  }, [exactSeasonStats, fixtures, state?.pendingSeasonState]);

  const currentFixtureIndex = Math.max(0, Math.min(fixtures.length - 1, matchday - 1));
  const currentFixture = fixtures[currentFixtureIndex] || fixtures[0];

  const cumulativeStats = useMemo(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let pts = 0;

    for (let i = 0; i <= currentFixtureIndex; i++) {
      const f = fixtures[i];
      if (!f) continue;
      if (f.outcome === 'W') wins++;
      else if (f.outcome === 'D') draws++;
      else losses++;
      pts += f.pts;
    }

    return { wins, draws, losses, pts };
  }, [fixtures, currentFixtureIndex]);

  const progressFraction = Math.min(1, Math.max(0, (matchday - startDay) / Math.max(1, targetEnd - startDay)));

  const liveMomentumPercent = useMemo(() => {
    if (!currentFixture) return 0;
    const wave = Math.sin(progressFraction * Math.PI * 6) * 8;
    return Math.max(-95, Math.min(95, Math.round(currentFixture.momentum + wave)));
  }, [currentFixture, progressFraction]);

  const cupJackpotMatchday = useMemo(() => {
    return Math.min(targetEnd - 1, Math.max(startDay + 2, Math.floor(startDay + (targetEnd - startDay) * 0.3)));
  }, [startDay, targetEnd]);

  const dilemmaMatchday = useMemo(() => {
    return Math.min(targetEnd - 1, Math.max(startDay + 3, Math.floor(startDay + (targetEnd - startDay) * 0.62)));
  }, [startDay, targetEnd]);

  const handleResolveDilemma = (choice: 'A' | 'B') => {
    if (!activeDilemma) return;
    const opt = choice === 'A' ? activeDilemma.optA : activeDilemma.optB;
    const currentState = useGameStore.getState();
    const currentClub = currentState.club;

    const oldOvr = currentClub.baseOvr || 60;
    const newBudget = currentState.budget - opt.cost;
    const newOvr = Math.min(100, Math.max(35, oldOvr + opt.ovrChange));
    const actualDelta = newOvr - oldOvr;
    const newMorale = Math.min(100, Math.max(10, (currentClub.morale ?? 75) + opt.moraleChange));

    const ovrHistory = actualDelta !== 0 ? [
      {
        id: Math.random().toString(36).substring(7),
        season: currentState.year,
        change: actualDelta,
        reason: activeDilemma.titleEn,
        reasonDe: activeDilemma.titleDe,
      },
      ...(currentState.ovrHistory || [])
    ].slice(0, 30) : currentState.ovrHistory;

    const updatedClub = {
      ...currentClub,
      baseOvr: newOvr,
      morale: newMorale
    };
    const updatedWorldClubs = currentState.worldClubs
      ? {
          ...currentState.worldClubs,
          [currentClub.id]: {
            ...(currentState.worldClubs[currentClub.id] || currentClub),
            baseOvr: newOvr,
            morale: newMorale
          }
        }
      : currentState.worldClubs;

    currentState.updateState({
      budget: newBudget,
      club: updatedClub,
      worldClubs: updatedWorldClubs,
      ...(actualDelta !== 0 ? {
        startOfSeasonOvr: typeof currentState.startOfSeasonOvr === 'number' ? currentState.startOfSeasonOvr : oldOvr,
        lastOvr: typeof currentState.lastOvr === 'number' ? currentState.lastOvr : oldOvr,
        ...(actualDelta > 0
          ? { eventOvrGainThisSeason: (currentState.eventOvrGainThisSeason || 0) + actualDelta }
          : { signingFlopLossThisSeason: (currentState.signingFlopLossThisSeason || 0) + Math.abs(actualDelta) })
      } : {}),
      ovrHistory,
      midSeasonDilemmaResolvedYear: currentState.year,
      notifications: [
        {
          id: Math.random().toString(),
          type: opt.cost > 0 || opt.ovrChange < 0 ? 'info' : 'success',
          title: 'DILEMMA RESOLVED',
          message: `${lang === 'de' ? activeDilemma.titleDe : activeDilemma.titleEn}: ${lang === 'de' ? opt.textDe : opt.textEn} (${lang === 'de' ? opt.tagDe : opt.tagEn})`,
          read: false
        },
        ...(currentState.notifications || [])
      ]
    });

    setDilemmaFeedback(lang === 'de' ? `Entscheidung bestätigt: ${opt.tagDe} · Simulation läuft weiter...` : `Decision confirmed: ${opt.tagEn} · Resuming campaign...`);

    setTimeout(() => {
      setActiveDilemma(null);
      setDilemmaFeedback(null);
      isDilemmaActiveRef.current = false;
    }, 700);
  };

  const handleClaimCupJackpot = () => {
    if (!activeCupJackpot) return;
    const currentState = useGameStore.getState();
    const jackpot = activeCupJackpot.jackpotAmount;

    currentState.updateState({
      budget: currentState.budget + jackpot,
      tvCupJackpotClaimedYear: currentState.year,
      notifications: [
        {
          id: Math.random().toString(),
          type: 'celebration',
          title: 'TV CUP JACKPOT DEPOSITED',
          message: `📺 TV Cup Tie against ${activeCupJackpot.giantName}: Sold-out arena & prime-time TV split injected +${formatMoney(jackpot, currentState.club?.country)} into treasury!`,
          read: false
        },
        ...(currentState.notifications || [])
      ]
    });

    setActiveCupJackpot(null);
    isCupJackpotActiveRef.current = false;
  };

  const onCompleteRef = React.useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Ticker Interval separated from render cycle
  useEffect(() => {
    const duration = 1800;
    const intervalTime = Math.max(45, duration / totalDaysInPhase);

    const timer = setInterval(() => {
      if (isDilemmaActiveRef.current || isCupJackpotActiveRef.current) {
        return;
      }

      const currentDay = currentTickRef.current;
      const freshState = useGameStore.getState();

      const lastSeasonHist = freshState.history && freshState.history.length > 0
        ? freshState.history[freshState.history.length - 1]
        : null;
      const isSameClubLastSeason = Boolean(
        lastSeasonHist && (!lastSeasonHist.clubName || lastSeasonHist.clubName === freshState.club?.name)
      );
      const wonAmateurCupLastYear = Boolean(
        isSameClubLastSeason && ((lastSeasonHist?.trophiesThisYear?.reg || 0) >= 1 || (lastSeasonHist?.trophiesThisYear?.dfb || 0) >= 1)
      );
      const seasonsPlayedAtClub = (freshState.history || []).filter(
        h => !h.clubName || h.clubName === freshState.club?.name
      ).length;
      const yearsSinceLastCupJackpot = freshState.tvCupJackpotClaimedYear
        ? freshState.year - freshState.tvCupJackpotClaimedYear
        : 99;
      const cupDrawRng = createPRNG((freshState.year || 2026) * 7919 + Number(freshState.club?.id || 1) * 131)();
      // Realistic rarity:
      // - Reserve teams never enter the National Cup
      // - At least 3 seasons cooldown between TV Cup Jackpots
      // - Winning the Amateur/Regional Cup last year qualifies for the National Cup 1st Round (50% chance of a prime-time TV Giant draw)
      // - Otherwise, only after Year 1 (seasonsPlayedAtClub >= 1), a rare ~14% wildcard draw chance (higher in Tier 3 at 18%, lower in Tier 5-6 at 10%)
      const wildcardProb = tier === 3 ? 0.18 : tier === 4 ? 0.14 : 0.10;
      const eligibleForTvCupDraw =
        !isReserveClub(clubName) &&
        yearsSinceLastCupJackpot >= 3 &&
        (wonAmateurCupLastYear ? cupDrawRng < 0.50 : (seasonsPlayedAtClub >= 1 && cupDrawRng < wildcardProb));

      if (
        tier >= 3 &&
        (phase === 'first_half' || phase === 'full') &&
        !hasClaimedCupJackpotRef.current &&
        freshState.tvCupJackpotClaimedYear !== freshState.year &&
        currentDay === cupJackpotMatchday &&
        eligibleForTvCupDraw
      ) {
        hasClaimedCupJackpotRef.current = true;
        isCupJackpotActiveRef.current = true;
        const normCountry = normalizeCountry(freshState.club?.country || currentCountry || 'GER');
        const domesticTier1Clubs = (activeClubs || []).filter(
          c =>
            c.tier === 1 &&
            normalizeCountry(c.country || 'GER') === normCountry &&
            !isReserveClub(c.name) &&
            (!c?.name || !clubName || c.name.toLowerCase() !== clubName.toLowerCase())
        );
        // Sort by OVR descending and pick from the top Tier 1 giants of the user's country
        const sortedGiants = [...domesticTier1Clubs].sort((a, b) => (b.baseOvr || 80) - (a.baseOvr || 80));
        const topGiantPool = sortedGiants.slice(0, Math.max(1, Math.min(5, Math.ceil(sortedGiants.length * 0.45))));
        const giantIdx = Math.floor(createPRNG((freshState.year || 2026) * 3571 + Number(freshState.club?.id || 1))() * Math.max(1, topGiantPool.length));
        const giant = topGiantPool.length > 0
          ? topGiantPool[giantIdx]
          : { name: normCountry === 'GER' ? 'THW Kiel' : 'National Giant', baseOvr: 84 };

        const cMult = getCountryMult(normCountry);
        const rawJackpot = (120000 + Math.floor(Math.random() * 130000)) * cMult;
        const jackpot = Math.max(25000, Math.round(rawJackpot / 5000) * 5000);
        const bPackage = getBroadcastingPackage(normCountry, false, { clubName, type: 'cup_qf' });
        const cupName = bPackage.nationalCupName || (normCountry === 'GER' ? 'DHB-Pokal' : 'National Cup');

        setActiveCupJackpot({
          giantName: giant.name,
          giantOvr: giant.baseOvr || 84,
          cupName,
          jackpotAmount: jackpot
        });
        return;
      }

      if (
        !hasTriggeredDilemmaRef.current &&
        freshState.midSeasonDilemmaResolvedYear !== freshState.year &&
        !hasClaimedCupJackpotRef.current &&
        totalDaysInPhase >= 4 &&
        currentDay === dilemmaMatchday
      ) {
        hasTriggeredDilemmaRef.current = true;
        isDilemmaActiveRef.current = true;
        const seedDilemma = (freshState.year || 2026) + Number(freshState.club?.id || 1);
        const baseDilemma = MANAGERIAL_DILEMMAS[seedDilemma % MANAGERIAL_DILEMMAS.length];
        const medLvl = freshState.club?.medicalLevel || 1;
        const pickedDilemma: ManagerialDilemma =
          baseDilemma.id === 'ligament_injury' && medLvl >= 2
            ? {
                ...baseDilemma,
                descriptionEn:
                  medLvl >= 3
                    ? 'Your leading scorer suffered a knee strain in matchday drills, but your Level 3+ Sports Science Lab is equipped for immediate free recovery and morale boosts.'
                    : 'Your leading scorer suffered a knee strain in matchday drills. Your Level 2 In-House Rehab Suite can treat him immediately at zero external clinic cost.',
                descriptionDe:
                  medLvl >= 3
                    ? 'Dein Top-Torjäger hat sich im Training verletzt, doch dein Sportwissenschaftliches Labor (Stufe 3+) ermöglicht eine kostenlose Sofort-Reha inklusive Moral-Schub.'
                    : 'Dein Top-Torjäger hat sich im Training verletzt. Deine vereinseigene Reha-Abteilung (Stufe 2) übernimmt die Sofort-Behandlung komplett kostenlos.',
                optA: {
                  textEn: medLvl >= 3 ? 'Sports Science Lab Fast-Track (Lvl 3+)' : 'In-House Rehab Suite Fast-Track (Lvl 2)',
                  textDe: medLvl >= 3 ? 'Sportwissenschaftliches Labor (Stufe 3+)' : 'Vereinseigene Reha-Abteilung (Stufe 2)',
                  cost: 0,
                  ovrChange: 0,
                  moraleChange: medLvl >= 3 ? 5 : 0,
                  tagEn:
                    medLvl >= 3
                      ? 'Free (€0 · Lvl 3+ Lab) · 0 OVR Loss & +5 Morale'
                      : 'Free (€0 · Lvl 2 Rehab) · Immediate Recovery (0 OVR Loss)',
                  tagDe:
                    medLvl >= 3
                      ? 'Kostenlos (0 € · Stufe 3+ Labor) · 0 GES Abzug & +5 Moral'
                      : 'Kostenlos (0 € · Stufe 2 Reha) · Sofortige Genesung (0 GES Abzug)',
                },
              }
            : baseDilemma;
        setActiveDilemma(pickedDilemma);
        return;
      }

      if (currentDay < targetEnd) {
        currentTickRef.current++;
        setMatchday(currentTickRef.current);
      } else if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        clearInterval(timer);
        setIsFinishing(true);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onCompleteRef.current();
          }, 240);
        }, 360);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [targetEnd, totalDaysInPhase, tier, phase, cupJackpotMatchday, dilemmaMatchday, clubName, activeClubs]);

  const phaseLabel = phase === 'first_half'
    ? t(lang, '1st Half Campaign · Autumn Fixtures', 'Hinrunde · Spieltage 1–17')
    : phase === 'second_half'
    ? t(lang, '2nd Half Finale · Championship Deciders', 'Rückrunde & Entscheidungen')
    : t(lang, 'Season Campaign Progression', 'Saison-Simulation');

  const isMatchWin = currentFixture?.outcome === 'W';
  const isMatchDraw = currentFixture?.outcome === 'D';
  const isMatchLoss = currentFixture?.outcome === 'L';

  const formColorClass = isMatchWin
    ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    : isMatchDraw
    ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
    : 'text-rose-400 bg-rose-500/15 border-rose-500/30';

  const formLabel = isMatchWin
    ? (currentFixture.isUpset
        ? `+3 Form · ${lang === 'de' ? 'Überraschungssieg!' : 'Upset Victory!'}`
        : `+2 Form · ${lang === 'de' ? 'Spieltag-Sieg' : 'Matchday Win'}`)
    : isMatchDraw
    ? `±0 Form · ${lang === 'de' ? 'Ausgeglichen' : 'Level Pegging'}`
    : (isRelegationSeason
        ? `-3 Form · ${lang === 'de' ? 'Abstiegskampf' : 'Relegation Struggle'}`
        : `-2 Form · ${lang === 'de' ? 'Unter Druck' : 'Under Pressure'}`);

  const headerDotClass = isMatchWin
    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
    : isMatchDraw
    ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]';

  const ambientGlowClass = isMatchWin
    ? 'bg-emerald-500/20'
    : isMatchDraw
    ? 'bg-amber-500/10'
    : 'bg-rose-500/20';

  return (
    <AnimatePresence>
      {!isFadingOut && (
        <motion.div
          key="apple-sports-match-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] bg-[#07080d]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 select-none"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 6 }}
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
            className="w-full max-w-[380px] sm:max-w-[420px] bg-[#0e1018]/95 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_40px_rgba(56,189,248,0.12)] flex flex-col items-center relative overflow-hidden"
          >
            <div 
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 blur-[60px] rounded-full pointer-events-none transition-all duration-500 ${ambientGlowClass}`} 
            />

            <div className="flex items-center justify-between w-full mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${headerDotClass}`} />
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-zinc-300">
                  {phaseLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-semibold text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 tabular-nums">
                  MD {matchday}/{targetEnd}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 tabular-nums">
                  {cumulativeStats.pts} PTS
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-5 items-center justify-items-center mb-5 relative z-10 bg-black/40 rounded-2xl p-4 border border-white/[0.08]">
              <div className="col-span-2 flex flex-col items-center text-center gap-1.5 w-full">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/15 p-1 flex items-center justify-center shadow-inner">
                  <ClubLogo 
                    club={state?.club}
                    name={clubName} 
                    clubId={state?.club?.id}
                    color={state?.club?.color}
                    color2={state?.club?.color2}
                    logo={state?.club?.logo}
                    fallbackLogo={state?.club?.fallbackLogo}
                    className="w-full h-full object-contain" 
                  />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[110px]">
                  {clubName}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  OVR {playerOvr}
                </span>
              </div>

              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-light tracking-tight text-white tabular-nums font-mono">
                  <span className={isMatchWin ? 'text-emerald-400 font-semibold' : isMatchLoss ? 'text-rose-400 font-semibold' : 'text-amber-300 font-semibold'}>
                    {currentFixture.userGoals}
                  </span>
                  <span className="text-zinc-500 text-lg sm:text-xl font-thin">:</span>
                  <span className={isMatchLoss ? 'text-emerald-400 font-semibold' : isMatchWin ? 'text-zinc-400' : 'text-amber-300 font-semibold'}>
                    {currentFixture.oppGoals}
                  </span>
                </div>
                <span className={`text-[9px] uppercase tracking-wider mt-1 font-bold px-2 py-0.5 rounded-full border ${
                  isMatchWin
                    ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                    : isMatchDraw
                    ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                    : 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                }`}>
                  {isFinishing 
                    ? 'Full Time' 
                    : isMatchWin 
                    ? 'FT · WIN (+2P)' 
                    : isMatchDraw 
                    ? 'FT · DRAW (+1P)' 
                    : 'FT · LOSS'}
                </span>
              </div>

              <div className="col-span-2 flex flex-col items-center text-center gap-1.5 w-full">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/15 p-1 flex items-center justify-center shadow-inner">
                  <ClubLogo 
                    club={currentFixture.opponent as any}
                    name={currentFixture.opponent.name} 
                    clubId={currentFixture.opponent.id}
                    color={currentFixture.opponent.color}
                    color2={currentFixture.opponent.color2}
                    logo={currentFixture.opponent.logo}
                    fallbackLogo={currentFixture.opponent.fallbackLogo}
                    className="w-full h-full object-contain" 
                  />
                </div>
                <span className="text-xs font-bold text-zinc-200 truncate max-w-[90px] sm:max-w-[110px]">
                  {currentFixture.opponent.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  OVR {currentFixture.opponent.baseOvr}
                </span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 mb-4 relative z-10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Momentum Swings</span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-tight uppercase tabular-nums ${formColorClass}`}>
                  {formLabel}
                </span>
              </div>

              <div className="w-full h-2.5 bg-black/60 rounded-full border border-white/10 relative overflow-hidden flex items-center">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />
                {liveMomentumPercent >= 0 ? (
                  <motion.div 
                    className="absolute left-1/2 top-0 bottom-0 bg-gradient-to-r from-sky-500 to-emerald-400 rounded-r-full shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                    style={{ width: `${Math.min(50, liveMomentumPercent / 2)}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                ) : (
                  <motion.div 
                    className="absolute top-0 bottom-0 bg-gradient-to-l from-rose-500 to-amber-500 rounded-l-full shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    style={{ 
                      right: '50%', 
                      width: `${Math.min(50, Math.abs(liveMomentumPercent) / 2)}%` 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between h-4 px-1 gap-1">
                {Array.from({ length: 24 }).map((_, i) => {
                  const distanceFromCenter = Math.abs(i - 11.5) / 11.5;
                  const isActive = liveMomentumPercent >= 0 
                    ? i >= 12 && ((i - 12) / 12) <= (liveMomentumPercent / 100)
                    : i < 12 && ((12 - i) / 12) <= (Math.abs(liveMomentumPercent) / 100);
                  
                  const barHeight = Math.max(3, Math.sin((i / 24) * Math.PI + progressFraction * 4) * 14 * (1 - distanceFromCenter * 0.4));

                  return (
                    <div 
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isActive
                          ? liveMomentumPercent >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                          : isMatchDraw ? 'bg-amber-400/40' : 'bg-white/10'
                      }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="w-full flex items-center justify-between pt-3 border-t border-white/[0.08] relative z-10 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <i className={`fas fa-chess-knight text-[10px] ${isMatchWin ? 'text-emerald-400' : isMatchDraw ? 'text-amber-400' : 'text-rose-400'}`} />
                <span className="truncate max-w-[150px]">{tactic}</span>
              </span>
              <span className="font-semibold text-zinc-300">
                {isFinishing 
                  ? `${cumulativeStats.pts} Pts (${cumulativeStats.wins}W ${cumulativeStats.draws}D ${cumulativeStats.losses}L)`
                  : `${cumulativeStats.wins}W ${cumulativeStats.draws}D ${cumulativeStats.losses}L · ${Math.round(progressFraction * 100)}%`}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeCupJackpot && state?.club && (
        <TvCupTieModal
          userClub={state.club}
          opponent={{
            name: activeCupJackpot.giantName,
            baseOvr: activeCupJackpot.giantOvr,
            tier: 1,
          }}
          cupName={activeCupJackpot.cupName}
          jackpotAmount={activeCupJackpot.jackpotAmount}
          lang={lang}
          onClaim={handleClaimCupJackpot}
        />
      )}

      {activeDilemma && (
          <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="bg-[#12131c] border border-rose-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_80px_rgba(244,63,94,0.25)] relative overflow-hidden flex flex-col cursor-default"
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 pointer-events-none" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {lang === 'de' ? `SPIELTAG ${matchday} · KRISEN-SITZUNG` : `MATCHDAY ${matchday} · MANAGERIAL DILEMMA`}
                </span>
              </div>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                {lang === 'de' ? 'Simulation Pausiert' : 'Simulation Paused'}
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {lang === 'de' ? activeDilemma.titleDe : activeDilemma.titleEn}
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {lang === 'de' ? activeDilemma.descriptionDe : activeDilemma.descriptionEn}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleResolveDilemma('A')}
                disabled={Boolean(dilemmaFeedback)}
                className="w-full bg-[#181926] hover:bg-white/[0.04] active:scale-[0.99] border border-white/[0.08] hover:border-amber-500/30 rounded-2xl p-4 text-left transition flex items-center justify-between gap-3 cursor-pointer group disabled:opacity-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-300 transition">
                    {lang === 'de' ? activeDilemma.optA.textDe : activeDilemma.optA.textEn}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {lang === 'de' ? activeDilemma.optA.tagDe : activeDilemma.optA.tagEn}
                    </span>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-xs text-zinc-500 group-hover:text-white transition shrink-0" />
              </button>

              <button
                onClick={() => handleResolveDilemma('B')}
                disabled={Boolean(dilemmaFeedback)}
                className="w-full bg-[#181926] hover:bg-white/[0.04] active:scale-[0.99] border border-white/[0.08] hover:border-rose-500/30 rounded-2xl p-4 text-left transition flex items-center justify-between gap-3 cursor-pointer group disabled:opacity-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-rose-300 transition">
                    {lang === 'de' ? activeDilemma.optB.textDe : activeDilemma.optB.textEn}
                  </div>
                  <div className="mt-1">
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {lang === 'de' ? activeDilemma.optB.tagDe : activeDilemma.optB.tagEn}
                    </span>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-xs text-zinc-500 group-hover:text-white transition shrink-0" />
              </button>
            </div>

            {dilemmaFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center flex items-center justify-center gap-2">
                <i className="fas fa-circle-check" />
                <span>{dilemmaFeedback}</span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
