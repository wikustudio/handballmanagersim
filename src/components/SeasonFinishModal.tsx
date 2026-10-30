import React, { useRef, useState, useEffect, useMemo } from 'react';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { getTrophyImage } from '../utils/trophyHelpers';
import { motion, animate } from 'motion/react';
import confetti from 'canvas-confetti';
import * as htmlToImage from 'html-to-image';
import { Club, GameState, Language, TrophiesObj, UniverseMovement } from '../types';
import { getLeagueInfo, getDomesticCupInfo, TOURNAMENT_LOGOS, formatMoney, isReserveClub, getMinAllowedTierForReserve, getLeagueMaxAttendance, getLeagueScaledVal, getMaxTier, isCanadianMLSClub } from '../data/gameConstants';
import { ALL_CLUBS } from '../data/clubsData';
import { ClubLogo } from './ClubLogo';
import { REAL_CLUB_ALIASES, simplifyClubName } from '../engine/moddingEngine';
import { PrestigeTrophy } from './PrestigeTrophy';
import { getAllUniverseMovements, getHeadlineCategory, isMajorUniverseHeadline } from '../utils/universeMovements';

interface SeasonFinishModalProps {
  state: GameState;
  onShowTable?: () => void;
  clubsDb?: Club[];
  seasonData: {
    year: number;
    clubName: string;
    clubColor?: string;
    clubLogo?: string;
    tier: number;
    nextLeague?: number;
    pos: number;
    wins: number;
    draws: number;
    losses: number;
    pts: number;
    gf: number;
    ga: number;
    revenue: number;
    wages: number;
    netProfit: number;
    endBudget: number;
    trophiesThisYear: TrophiesObj;
    euroNextSeason: 'CL' | 'EL' | 'ECL' | null;
    euroThisSeason?: 'CL' | 'EL' | 'ECL' | null;
    graduatedYouths?: string[];
    departedYouths?: string[];
    transfersIn?: number;
    transfersOut?: number;
    newBaseOvr?: number;
    startOvr?: number;
    decayReasons?: string[];
    pointsEarned?: number;
    totalSkillPoints?: number;
    moraleDelta?: number;
    endMorale?: number;
    rivalData?: { name: string; wins: number; draws: number; losses: number; h2hWins: number; h2hDraws: number; h2hLosses: number; isPaused?: boolean; };
    coachAtStartOfSim?: any;
    coachDepartureAlert?: {
      coachName: string;
      ovrBoost: number;
      style: string;
      reason: string;
      isPoached: boolean;
      buyoutFeeK: number;
    } | null;
    isSackedRelegation?: boolean;
    isSacked?: boolean;
    pointsDeducted?: number;
  };
  lang?: Language;
  onClose: () => void;
  onRenewCoach?: (years: number) => void;
  globalHighscores?: { name: string; score: number }[];
  isModActive?: boolean;
}

const AnimatedNumber = ({ from = 0, to, duration = 1.2, isMoney = false, prefix = '', suffix = '' }: { from?: number, to: number, duration?: number, isMoney?: boolean, prefix?: string, suffix?: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        if (isMoney) {
          let fm = formatMoney(value);
          if (value >= 0 && prefix === '+') fm = '+' + fm;
          node.textContent = `${fm}${suffix}`;
        } else {
          node.textContent = `${prefix}${Math.round(value).toLocaleString('en-US')}${suffix}`;
        }
      }
    });
    
    return () => controls.stop();
  }, [from, to, duration, isMoney, prefix, suffix]);
  
  let initialText = '';
  if (isMoney) {
    let fm = formatMoney(from);
    if (from >= 0 && prefix === '+') fm = '+' + fm;
    initialText = fm + suffix;
  } else {
    initialText = `${prefix}${Math.round(from).toLocaleString('en-US')}${suffix}`;
  }
  
  return <span ref={nodeRef}>{initialText}</span>;
};

export const SeasonFinishModal: React.FC<SeasonFinishModalProps> = React.memo(({
  state,
  onShowTable,
  seasonData,
  lang = 'en',
  onClose,
  onRenewCoach,
  globalHighscores,
  isModActive,
  clubsDb,
}) => {
  const t = (en: string, ..._ignored: any[]) => en;
  const [isTop3Leaderboard, setIsTop3Leaderboard] = useState(false);
  const [top3Rank, setTop3Rank] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'squad' | 'table' | 'world'>('overview');
  const cardRef = useRef<HTMLDivElement>(null);

  const switchTab = (tab: 'overview' | 'squad' | 'table' | 'world') => {
    setActiveTab(tab);
    if (cardRef.current) {
      cardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToSection = (tab: string, _elementId?: string) => {
    if (tab === 'table' || tab === 'sporting') {
      switchTab('table');
    } else if (tab === 'squad' || tab === 'coach' || tab === 'finance') {
      switchTab('squad');
    } else if (tab === 'universe' || tab === 'world') {
      switchTab('world');
    } else {
      switchTab('overview');
    }
  };

  const handleScroll = () => {
    // Clean single-tab view; no multi-section scroll tracking needed
  };

  const country = state.club.country || 'GER';
  const league = getLeagueInfo(seasonData.tier, country);
  const nextTier = seasonData.nextTier !== undefined
    ? seasonData.nextTier
    : seasonData.nextLeague !== undefined
    ? seasonData.nextLeague
    : Math.max(1, seasonData.tier - (seasonData.pos <= 2 && seasonData.tier > 1 ? 1 : 0));
  const nextLeague = getLeagueInfo(nextTier, country);
  const isCanadian = country === 'CAN' || isCanadianMLSClub(state.club.name, state.club.id, country);
  const natCupCountry = isCanadian ? 'CAN' : country;
  const cupInfo = getDomesticCupInfo(natCupCountry, seasonData.tier, state.club.name);
  const t1League = getLeagueInfo(1, country);

  const isTier1Only = getMaxTier(country, clubsDb) === 1;
  const isBottomTier = seasonData.tier >= getMaxTier(country, clubsDb);
  const isChamp = seasonData.pos === 1;
  const isPromoted = nextTier < seasonData.tier;
  const isRelegated = !isTier1Only && !seasonData.isSackedRelegation && nextTier > seasonData.tier;
  const isPositiveNetProfit = seasonData.netProfit >= 0;

  // Global Highscore / Leaderboard celebration
  useEffect(() => {
    const currentScore = state.careerScore || 0;
    if (currentScore > 0 && globalHighscores && globalHighscores.length > 0) {
      const scores = globalHighscores
        .map(h => h.score)
        .filter(s => typeof s === 'number' && !isNaN(s));
      const sortedUnique = Array.from(new Set([...scores, currentScore])).sort((a, b) => b - a);
      const myRank = sortedUnique.indexOf(currentScore) + 1;

      if (myRank <= 3) {
        setIsTop3Leaderboard(true);
        setTop3Rank(myRank);

        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 999999 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: NodeJS.Timeout = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 60 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 300);

        return () => {
          clearInterval(interval);
          confetti.reset();
        };
      }
    }
  }, [state.careerScore, globalHighscores]);

  // Haptic feedback & celebration confetti for championships / promotions
  useEffect(() => {
    if (isChamp || isPromoted) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (navigator.vibrate) {
        navigator.vibrate([40, 60, 40, 60, 120]);
      }
    } else if (isRelegated) {
      if (navigator.vibrate) {
        navigator.vibrate([180, 80, 180]);
      }
    }
    return () => {
      confetti.reset();
    };
  }, [isChamp, isPromoted, isRelegated]);

  // Keyboard shortcut: Press Enter to proceed (guarded against duplicate calls or overlapping modals)
  const hasClosedRef = useRef(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isDownloading && !hasClosedRef.current) {
        if (typeof document !== 'undefined' && document.querySelector('[data-wc-modal="true"]')) {
          return;
        }
        hasClosedRef.current = true;
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isDownloading]);

  // Pundit commentary (100% English)
  const pundit = useMemo(() => {
    if (isChamp && seasonData.tier === 1) {
      return {
        author: "Gareth North",
        text: `An absolute masterclass. ${state.club.name} just dismantled the league. This sporting directorship is going down in history.`,
        handle: "@GarethNorth_TV",
        role: "Lead Analyst"
      };
    }
    if (isPromoted) {
      return {
        author: "Mateo Russo",
        text: `🚨 PROMOTION CONFIRMED! ${state.club.name} secures their spot in the higher tier! What a story, fully deserved! 📈`,
        handle: "@MateoRusso_Transfers",
        role: "Transfer Insider"
      };
    }
    if (seasonData.isSackedRelegation) {
      return {
        author: "Ray Kearns",
        text: isTier1Only
          ? `Ruthless dismissal at ${state.club.name}. In a single-tier system, finishing in the bottom three is immediate grounds for dismissal. Board immunity shields offered zero protection.`
          : `Brutal dismissal at ${state.club.name}. Finishing in the bottom tier drop-zone leaves the board with no patience: manager sacked on the spot.`,
        handle: "@RayKearns_Pundit",
        role: "Pundit"
      };
    }
    if (isRelegated) {
      return {
        author: "Ray Kearns",
        text: `Crushing relegation. ${state.club.name} lacked sharpness in decisive moments. A complete squad reset is required now.`,
        handle: "@RayKearns_Pundit",
        role: "Pundit"
      };
    }
    if (seasonData.tier === 1 && seasonData.pos > 10) {
      return {
        author: "James Callaghan",
        text: `Disappointing campaign for ${state.club.name}. The sporting directorship will have to deliver quick answers next term.`,
        handle: "@JCallaghan_TV",
        role: "League Correspondent"
      };
    }
    if (seasonData.wins === 0) {
      return {
        author: "DataPro",
        text: `0 wins - A historically challenging campaign for ${state.club.name}. Time to regroup and build back stronger.`,
        handle: "@DataPro_Sports",
        role: "Analytics"
      };
    }
    if (seasonData.gf > 80) {
      return {
        author: "Theo Henri",
        text: `The attacking football from ${state.club.name} was pure art. ${seasonData.gf} goals! An absolute treat for the fans.`,
        handle: "@TheoHenri_14",
        role: "Tactical Analyst"
      };
    }
    return {
      author: "Arthur Sterling",
      text: `A disciplined, by-the-numbers campaign from ${state.club.name}. Expected benchmarks met with calm execution.`,
      handle: "@ArthurSterling_9",
      role: "Senior Columnist"
    };
  }, [isChamp, isPromoted, isRelegated, seasonData, state.club.name]);

  // Trophy collection
  const trophyList = useMemo(() => {
    const list: { type: string; name: string; icon?: string; logo?: string; color: string; badge?: string }[] = [];
    const { cl, el, ecl } = getContinentalCupNames(country);
    
    if (seasonData.trophiesThisYear?.cwc) list.push({ type: 'cwc', name: 'Global Club Cup', logo: TOURNAMENT_LOGOS.cwc || '', color: 'text-amber-400', badge: 'World Champions' });
    if (seasonData.trophiesThisYear?.cl) list.push({ type: 'cl', name: cl, logo: getTrophyImage('cl', country), color: 'text-yellow-300', badge: 'Continental Champions' });
    if (seasonData.trophiesThisYear?.el) list.push({ type: 'el', name: el, logo: getTrophyImage('el', country), color: 'text-orange-400', badge: 'Continental Cup' });
    if (seasonData.trophiesThisYear?.ecl) list.push({ type: 'ecl', name: ecl, logo: getTrophyImage('ecl', country), color: 'text-emerald-400', badge: 'Continental Challenge' });
    if (seasonData.trophiesThisYear?.bl) list.push({ type: 'title', name: `${t1League.name}`, logo: t1League.logo, color: 'text-amber-400', badge: 'League Champions' });
    if (seasonData.trophiesThisYear?.lower) list.push({ type: 'lower', name: `${league.name} Title`, logo: league.logo, color: 'text-sky-300', badge: 'League Champions' });
    if (seasonData.trophiesThisYear?.dfb) list.push({ type: 'dfb', name: cupInfo.name, logo: cupInfo.logo, color: 'text-amber-400', badge: 'National Cup' });
    if (seasonData.trophiesThisYear?.efl) list.push({ type: 'efl', name: 'League Cup', color: 'text-emerald-400', badge: 'League Cup' });
    if (seasonData.trophiesThisYear?.reg) list.push({ type: 'reg', name: 'Regional Cup', icon: 'fa-shield-halved', color: 'text-amber-600', badge: 'Regional Cup' });

    // Cross-reference state.cupRunResults for any cup won this year not yet added
    const sYear = seasonData.year ?? (state.year - 1);
    const wonCupsThisYear = (state.cupRunResults || []).filter(r => r.year === sYear && r.won);
    for (const cup of wonCupsThisYear) {
      if (!list.some(item => item.type === cup.id)) {
        let cupType = cup.id;
        let cupName = cup.nameEn || cup.nameDe || 'Cup';
        let trophyColor = 'text-amber-400';
        let badge = 'Cup Champions';
        if (cup.id === 'cl') { trophyColor = 'text-yellow-300'; badge = 'Continental Champions'; }
        else if (cup.id === 'el') { trophyColor = 'text-orange-400'; badge = 'Continental Cup'; }
        else if (cup.id === 'ecl') { trophyColor = 'text-emerald-400'; badge = 'Continental Challenge'; }
        else if (cup.id === 'reg') { trophyColor = 'text-amber-600'; badge = 'Regional Cup'; }
        else if (cup.id === 'dfb') { badge = 'National Cup'; }
        list.push({ type: cupType, name: cupName, color: trophyColor, badge });
      }
    }

    return list;
  }, [seasonData.trophiesThisYear, country, t1League, league, cupInfo, state.cupRunResults, seasonData.year, state.year]);

  // Attendance Metrics
  const leagueMaxAtt = getLeagueMaxAttendance(seasonData.tier, isReserveClub(state.club.name), country, state.club.name);
  const baseAvgAttendance = Math.min(state.club.fanBase || league.attBase, state.club.stadium, leagueMaxAtt);
  const sCount = seasonData.year || 2026;
  const pseudoRandom = Math.abs(Math.sin(sCount * 12.9898 + state.club.baseOvr)) % 1;
  const seasonalVariance = 0.90 + (pseudoRandom * 0.20);
  const rawAttendance = Math.round(baseAvgAttendance * seasonalVariance);
  const nonRoundOffset = (Math.floor(pseudoRandom * 97) - 48);
  let avgAttendance = Math.min(state.club.stadium, Math.max(10, rawAttendance + nonRoundOffset));
  if (avgAttendance === state.club.stadium && seasonData.tier > 2) {
    const noShows = Math.floor(pseudoRandom * (state.club.stadium * 0.03)) + 3;
    avgAttendance = Math.max(10, avgAttendance - noShows);
  }
  const fillPercentage = Math.min(100, Math.round((avgAttendance / state.club.stadium) * 100));

  const goalDiff = seasonData.gf - seasonData.ga;
  const ovrDelta = (seasonData.newBaseOvr || state.club.baseOvr) - (seasonData.startOvr || state.club.baseOvr);
  const hasPromotionPlayoffs = seasonData.tier > 1 && getMaxTier(country, clubsDb) > 1;

  const isStaleActive = Boolean(state.staleTactic && state.tactic === state.staleTactic);
  const isStaleWarning = Boolean(!isStaleActive && (state.consecutiveTitlesWithSameTactic || 0) >= 1 && seasonData.pos === 1);
  const consecutiveTitles = state.consecutiveTitles || 0;
  const hasSystemicImmunity = Boolean((state.club.medicalLevel || 1) >= 5 && (state.club.academyLevel || 1) >= 5);
  const rivalChallengerEvent = seasonData.rivalChallengerEvent || null;
  const superVillainClub = useMemo(() => {
    const targetId = rivalChallengerEvent?.clubId || null;
    if (!targetId) return null;
    return (clubsDb || ALL_CLUBS).find(c => c.id === targetId) || null;
  }, [rivalChallengerEvent, clubsDb]);
  const decayReasons = seasonData.decayReasons || [];

  const tableData = useMemo(() => {
    const currentTier = seasonData.tier;
    const currentCountry = country;
    const currentLeagueInfo = league;
    const userPos = seasonData.pos;
    const userWins = seasonData.wins;
    const userDraws = seasonData.draws;
    const userLosses = seasonData.losses;
    const userPts = seasonData.pts;
    const userGf = seasonData.gf;
    const userGa = seasonData.ga;
    const rawGd = userGf - userGa;
    const userGDStr = rawGd > 0 ? `+${rawGd}` : `${rawGd}`;

    const isReserveTeam = (name: string) => {
      if (name === 'SSV Jeddeloh II' || name.toLowerCase().includes('jeddeloh ii')) return false;
      return isReserveClub(name);
    };

    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const seededRand = (seed: number, min: number, max: number) => {
      return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
    };

    const sanitizedClubsDb = clubsDb && clubsDb.length > 0 ? clubsDb : ALL_CLUBS;
    const isMajorPyramid = ['GER', 'ENG', 'ESP', 'ITA', 'FRA'].includes(currentCountry);
    const minReserveTier = getMinAllowedTierForReserve(currentCountry);
    const targetTotalClubs = 18;
    const targetAiCount = Math.max(0, targetTotalClubs - 1);

    // 1. Direct retrieval from permanent season standings archive if available
    const archivedRows = state.seasonStandingsArchive?.[seasonData.year]?.[currentTier];
    if (archivedRows && archivedRows.length > 0) {
      const mappedRows = archivedRows.slice(0, targetTotalClubs).map((r: any, idx: number) => {
        const isUserClub = Boolean(
          r.isUser ||
          (seasonData.clubName && r.name?.toLowerCase().trim() === seasonData.clubName.toLowerCase().trim()) ||
          (!seasonData.clubName && r.id === state.club.id)
        );
        if (isUserClub) {
          const rawGd = seasonData.gf - seasonData.ga;
          return {
            ...r,
            isUser: true,
            pos: idx + 1,
            pts: seasonData.pts,
            w: seasonData.wins,
            d: seasonData.draws,
            l: seasonData.losses,
            gf: seasonData.gf,
            ga: seasonData.ga,
            gd: rawGd > 0 ? `+${rawGd}` : `${rawGd}`,
            logo: isModActive ? (r.logo || (r.id ? (clubsDb || ALL_CLUBS).find(c => c.id === r.id)?.logo : undefined)) : undefined
          };
        }
        return {
          ...r,
          pos: idx + 1,
          isUser: false,
          isRival: Boolean(!seasonData.rivalData?.isPaused && (r.isRival || (seasonData.rivalData?.name && r.name === seasonData.rivalData.name))),
          logo: isModActive ? (r.logo || (r.id ? (clubsDb || ALL_CLUBS).find(c => c.id === r.id)?.logo : undefined)) : undefined
        };
      });
      mappedRows.sort((a: any, b: any) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const aGd = parseInt(String(a.gd ?? 0), 10) || 0;
        const bGd = parseInt(String(b.gd ?? 0), 10) || 0;
        return bGd - aGd;
      });
      mappedRows.forEach((r: any, idx: number) => {
        r.pos = idx + 1;
      });
      return mappedRows;
    }

    const db = clubsDb && clubsDb.length > 0 ? clubsDb : ALL_CLUBS;
    let leagueClubs = db
      .filter((c) => c.tier === currentTier && (c.country || 'GER') === currentCountry && c.id !== state.club.id && !(currentTier < minReserveTier && isReserveTeam(c.name)))
      .map((c) => ({ ...c }));

    // Deduplicate clubs by canonical identity & name (e.g. prune duplicate unmodded Dortmund II when mod is active)
    const getCanonicalDedupeKey = (clubName: string): string => {
      const lower = clubName.toLowerCase().trim();
      if (REAL_CLUB_ALIASES[lower] != null) {
        return `alias_${REAL_CLUB_ALIASES[lower]}`;
      }
      const lowerNoRes = lower.replace(/\s+res\.?$/i, '').replace(/\s+reserve$/i, '').trim();
      if (REAL_CLUB_ALIASES[lowerNoRes] != null) {
        return `alias_${REAL_CLUB_ALIASES[lowerNoRes]}`;
      }
      const isReserve = isReserveClub(clubName);
      const cleanParent = clubName
        .replace(/\s+Res\.?$/i, '')
        .replace(/\s+Reserve$/i, '')
        .replace(/\s+II$/, '')
        .replace(/\s+\(?B\)?$/, '')
        .replace(/\s+Castilla$/, '')
        .replace(/\s+B$/, '')
        .replace(/\s+2$/, '')
        .trim()
        .toLowerCase();
      const parentAlias = REAL_CLUB_ALIASES[cleanParent];
      if (parentAlias != null) {
        return `parent_${parentAlias}_${isReserve}`;
      }
      return `simp_${simplifyClubName(cleanParent)}_${isReserve}`;
    };

    if (isModActive) {
      leagueClubs.sort((a, b) => {
        const aLower = a.name.toLowerCase().trim();
        const bLower = b.name.toLowerCase().trim();
        const aIsFallback = aLower.startsWith('prussia') || aLower.startsWith('bavaria') || aLower.startsWith('baden');
        const bIsFallback = bLower.startsWith('prussia') || bLower.startsWith('bavaria') || bLower.startsWith('baden');
        if (!aIsFallback && bIsFallback) return -1;
        if (aIsFallback && !bIsFallback) return 1;
        return 0;
      });
    }

    const seenIdentities = new Set<string>();
    const seenClubIds = new Set<number | string>();
    seenIdentities.add(getCanonicalDedupeKey(state.club.name));
    if (state.club.id != null) seenClubIds.add(state.club.id);

    leagueClubs = leagueClubs.filter(c => {
      if (c.id != null && seenClubIds.has(c.id)) return false;
      const key = isMajorPyramid ? getCanonicalDedupeKey(c.name) : c.name.toLowerCase().trim();
      if (seenIdentities.has(key)) return false;
      seenIdentities.add(key);
      if (c.id != null) seenClubIds.add(c.id);
      return true;
    });

    const heavyweightSet = new Set([
      'Madrid FC', 'Catalonia FC', 'Atlético M.', 'FC Bavaria', 'Borussia West',
      'Manchester Blue', 'North London Red', 'Merseyside Red', 'London Blue', 'Manchester United', 'PSG', 'Piemonte Calcio', 'Milan Blue', 'AC Milan'
    ]);
    if (leagueClubs.length > targetAiCount) {
      leagueClubs = leagueClubs.slice(0, targetAiCount);
    }

    const existingClubIds = new Set([state.club.id, ...leagueClubs.map((c) => c.id)]);
    if (leagueClubs.length < targetAiCount) {
      const rivalNameLower = (state.currentRival?.name || '').toLowerCase().trim();
      const sameCountryOtherClubs = db
        .filter(
          (c) =>
            (c.country || 'GER') === currentCountry &&
            !existingClubIds.has(c.id) &&
            c.tier === currentTier + 1 &&
            (currentTier < minReserveTier ? !isReserveTeam(c.name) : true) &&
            (currentTier === 1 ? c.baseOvr >= 70 : true) &&
            !heavyweightSet.has(c.name) &&
            c.id !== state.currentRival?.id &&
            (!rivalNameLower || c.name.toLowerCase().trim() !== rivalNameLower)
        )
        .sort((a, b) => b.baseOvr - a.baseOvr);

      for (const c of sameCountryOtherClubs) {
        if (leagueClubs.length >= targetAiCount) break;
        existingClubIds.add(c.id);
        leagueClubs.push({
          ...c,
          tier: currentTier,
        });
      }
    }

    const engFallbackNames = currentTier === 1 ? [
      'Leeds United', 'Leicester City', 'Southampton', 'Norwich City', 'West Bromwich Albion',
      'Middlesbrough', 'Coventry City', 'Sunderland', 'Watford', 'Stoke City'
    ] : [
      'Scunthorpe United', 'Torquay United', 'Yeovil Town', 'Rochdale', 'Oldham Athletic',
      'Southend United', 'Maidstone United', 'Kidderminster Harriers', 'Dorking Wanderers', 'York City'
    ];
    const gerFallbackNames = currentTier === 1 ? [
      'FC Schalke 04', 'Hertha BSC', '1. FC Nürnberg', 'Hannover 96', 'Fortuna Düsseldorf',
      'Hamburger SV', 'SpVgg Greuther Fürth', 'SC Paderborn 07', '1. FC Magdeburg', 'Eintracht Braunschweig'
    ] : [
      'VfR Aalen', 'Kickers Offenbach', 'Wuppertaler SV', 'FC Homburg', 'Chemnitzer FC',
      'Carl Zeiss Jena', 'SV Meppen', 'FSV Zwickau', 'Fortuna Koeln', 'Alemannia Aachen'
    ];
    const espFallbackNames = currentTier === 1 ? [
      'RCD Espanyol', 'Real Valladolid', 'Levante UD', 'Sporting Gijón', 'Real Oviedo',
      'Real Zaragoza', 'Elche CF', 'CD Tenerife', 'SD Eibar', 'Albacete Balompié'
    ] : [
      'CE Europa', 'UE Sant Andreu', 'Marbella FC', 'SD Logroñés', 'Real Avilés Industrial',
      'CD Guadalajara', 'Yeclano Deportivo', 'CD Tudelano', 'CF Talavera', 'CF Badalona'
    ];
    const itaFallbackNames = currentTier === 1 ? [
      'Parma Calcio', 'Palermo', 'Sampdoria', 'Bari', 'Brescia',
      'Venezia', 'Spezia', 'Cremonese', 'Modena', 'Catanzaro'
    ] : [
      'Virtus Entella', 'Pro Vercelli', 'Triestina', 'Vicenza Calcio', 'Lucchese',
      'Pescara', 'Foggia', 'SPAL', 'Novara', 'Ancona'
    ];
    const fraFallbackNames = currentTier === 1 ? [
      'Girondins de Bordeaux', 'AS Saint-Étienne', 'AJ Auxerre', 'Angers SCO', 'SM Caen',
      'EA Guingamp', 'Paris FC', 'Grenoble Foot', 'Rodez AF', 'Pau FC'
    ] : [
      'Le Mans FC', 'FC Villefranche', 'LB Châteauroux', 'SAS Épinal', 'GOAL FC',
      'FC Rouen', 'Red Star FC', 'US Avranches', 'SO Cholet', 'Nîmes Olympique'
    ];
    const porFallbackNames = [
      'SC Lusitânia', 'União de Leiria', 'CD Mafra', 'Varzim SC', 'FC Felgueiras',
      'Atlético CP', 'AD Sanjoanense', 'SG Sacavenense', 'Belém OS', 'Sertanense FC'
    ];
    const ecuFallbackNames = [
      'Guayaquil City', 'Gualaceo SC', '9 de Octubre', 'Cumbayá FC', 'Imbabura SC',
      'Independiente Juniors', 'Chacaritas FC', 'Leones del Norte', 'San Antonio FC', 'Vargas Torres'
    ];
    const usaFallbackNames = [
      'Tulsa City FC', 'Austin United', 'Miami Coast FC', 'Denver Peak FC',
      'Phoenix Rising Stars', 'Seattle Sound SC', 'Boston Breakers SC', 'Chicago Athletic',
      'Dallas Pioneers', 'Atlanta Metro FC', 'San Antonio Rovers', 'Nashville Sound FC',
      'Detroit City FC', 'Memphis 901', 'Tampa Bay Sun'
    ];
    const scoFallbackNames = [
      'Airdrieonians', 'Queen of the South', 'Alloa Athletic', 'Montrose FC', 'Kelty Hearts',
      'Cove Rangers', 'Falkirk FC', 'Hamilton Academical', 'Stirling Albion', 'Peterhead FC'
    ];
    const braFallbackNames = [
      'América Mineiro', 'Coritiba FC', 'Goiás EC', 'Chapecoense', 'Ponte Preta',
      'Vila Nova', 'Avaí FC', 'CRB', 'Operário Ferroviário', 'Paysandu'
    ];
    const argFallbackNames = [
      'Chacarita Juniors', 'Quilmes AC', 'Ferro Carril Oeste', 'San Martín de Tucumán', 'Colón de Santa Fe',
      'All Boys', 'Nueva Chicago', 'Defensores de Belgrano', 'Gimnasia y Esgrima', 'Temperley'
    ];
    const colFallbackNames = [
      'Deportes Quindío', 'Cúcuta Deportivo', 'Cortuluá', 'Real Cartagena', 'Valledupar FC',
      'Bogotá FC', 'Leones FC', 'Barranquilla FC', 'Tigres FC', 'Atlético Huila'
    ];
    const jpnFallbackNames = [
      'Oita Trinita', 'Roasso Kumamoto', 'Ventforet Kofu', 'Renofa Yamaguchi', 'Tochigi SC',
      'Mito HollyHock', 'Blaublitz Akita', 'Iwaki FC', 'Thespakusatsu Gunma', 'Fujieda MYFC'
    ];
    const mexFallbackNames = [
      'Atlante FC', 'Celaya FC', 'Venados FC', 'Leones Negros', 'Cimarrones de Sonora',
      'Cancún FC', 'Alebrijes de Oaxaca', 'Mineros de Zacatecas', 'Tepatitlán FC', 'Correcaminos UAT'
    ];
    const canFallbackNames = [
      'Victoria Highlanders', 'Calgary Foothills', 'FC Manitoba', 'Thunder Bay Chill', 'Simcoe County Rovers',
      'Guelph United', 'Blue Devils FC', 'Vaughan Azzurri', 'TFC Academy', 'FC Laval'
    ];
    const turFallbackNames = [
      'Bursaspor', 'Eskişehirspor', 'Altay SK', 'Giresunspor', 'Menemenspor',
      'Tuzlaspor', 'Boluspor', 'Adanaspor', 'Bandırmaspor', 'Keçiörengücü'
    ];

    const fallbackList =
      currentCountry === 'ENG' ? engFallbackNames :
      currentCountry === 'POR' ? porFallbackNames :
      currentCountry === 'ESP' ? espFallbackNames :
      currentCountry === 'ITA' ? itaFallbackNames :
      currentCountry === 'FRA' ? fraFallbackNames :
      currentCountry === 'ECU' ? ecuFallbackNames :
      currentCountry === 'USA' ? usaFallbackNames :
      currentCountry === 'SCO' ? scoFallbackNames :
      currentCountry === 'BRA' ? braFallbackNames :
      currentCountry === 'ARG' ? argFallbackNames :
      currentCountry === 'COL' ? colFallbackNames :
      currentCountry === 'JPN' ? jpnFallbackNames :
      currentCountry === 'MEX' ? mexFallbackNames :
      currentCountry === 'CAN' ? canFallbackNames :
      currentCountry === 'TUR' ? turFallbackNames :
      (currentCountry === 'GER' ? gerFallbackNames : []);

    const neededFillers = Math.max(0, targetAiCount - leagueClubs.length);
    const allKnownDbNames = new Set([
      ...db.map((c) => c.name.toLowerCase().trim()),
      state.club.name.toLowerCase().trim(),
      ...(state.currentRival?.name ? [state.currentRival.name.toLowerCase().trim()] : []),
    ]);
    for (let i = 0; i < neededFillers; i++) {
      const existingNames = new Set([
        ...allKnownDbNames,
        ...leagueClubs.map((c) => c.name.toLowerCase().trim()),
      ]);
      const availableFallback = fallbackList.find((n) => !existingNames.has(n.toLowerCase().trim())) || `Club ${i + 1}`;
      leagueClubs.push({
        id: 9900 + i,
        name: availableFallback,
        tier: currentTier,
        baseOvr: currentLeagueInfo.avgOvr + seededRand((seasonData.year || 2024) + i, -5, 5),
        color: '#' + Math.floor(seededRandom((seasonData.year || 2024) * 10 + i) * 16777215).toString(16).padStart(6, '0'),
        stadium: 15000,
        country: currentCountry,
      });
    }

    // Safety guard: ensure leagueClubs reaches targetAiCount under all circumstances
    while (leagueClubs.length < targetAiCount) {
      const idx = leagueClubs.length;
      leagueClubs.push({
        id: 9900 + idx,
        name: `${country} Club ${idx + 1}`,
        tier: currentTier,
        baseOvr: currentLeagueInfo.avgOvr + seededRand((seasonData.year || 2024) + idx, -5, 5),
        color: '#' + Math.floor(seededRandom((seasonData.year || 2024) * 10 + idx) * 16777215).toString(16).padStart(6, '0'),
        stadium: 15000,
        country: currentCountry,
      });
    }

    const clubsPool = [...leagueClubs].sort((a, b) => {
      const bEff = b.baseOvr + seededRand(seasonData.year * 10 + (typeof b.id === 'number' ? b.id : 1), -4, 4);
      const aEff = a.baseOvr + seededRand(seasonData.year * 10 + (typeof a.id === 'number' ? a.id : 1), -4, 4);
      return bEff - aEff;
    });

    const basePtsMap: Record<number, number> = {
      1: 82, 2: 74, 3: 66, 4: 60, 5: 55, 6: 51,
      7: 48, 8: 45, 9: 42, 10: 40, 11: 37, 12: 35,
      13: 33, 14: 31, 15: 28, 16: 25, 17: 21, 18: 16
    };
    const getRealisticBasePoints = (p: number) => basePtsMap[p] || 40;

    const isRivalActiveInTier = !seasonData.rivalData?.isPaused;
    const rivalName = isRivalActiveInTier ? (seasonData.rivalData?.name || state.currentRival?.name) : undefined;
    const rivalClubIndex = rivalName ? clubsPool.findIndex(c => c.name === rivalName) : -1;
    let rivalClub: any = null;
    if (rivalClubIndex !== -1) {
      rivalClub = clubsPool.splice(rivalClubIndex, 1)[0];
    }

    const safeUserPos = Math.max(1, Math.min(targetTotalClubs, userPos || 1));
    let rivalPos = -1;
    if (rivalClub) {
      if (safeUserPos === 1) rivalPos = 2;
      else if (safeUserPos === 2) rivalPos = 1;
      else if (safeUserPos === 15) rivalPos = 16;
      else if (safeUserPos === 16) rivalPos = 15;
      else if (safeUserPos === 3) rivalPos = 4;
      else if (safeUserPos === 4) rivalPos = 3;
      else rivalPos = safeUserPos - 1 > 0 ? safeUserPos - 1 : 2;
    }

    const posPts: number[] = new Array(targetTotalClubs + 1).fill(0);
    posPts[safeUserPos] = userPts;

    // Fill upwards from safeUserPos - 1 down to 1
    for (let p = safeUserPos - 1; p >= 1; p--) {
      let ideal = getRealisticBasePoints(p) + seededRand(seasonData.year * 70 + p, -1, 1);
      ideal = Math.max(posPts[p + 1] + 1, ideal);
      posPts[p] = ideal;
    }

    // Fill downwards from safeUserPos + 1 up to targetTotalClubs
    for (let p = safeUserPos + 1; p <= targetTotalClubs; p++) {
      let ideal = getRealisticBasePoints(p) + seededRand(seasonData.year * 70 + p, -1, 1);
      ideal = Math.min(posPts[p - 1] - 1, ideal);
      posPts[p] = Math.max(4, ideal);
    }

    if (rivalClub && rivalPos >= 1 && rivalPos <= 18 && rivalPos <= targetTotalClubs && (seasonData.rivalData as any)?.pts !== undefined) {
      const rTarget = (seasonData.rivalData as any).pts;
      posPts[rivalPos] = rivalPos < safeUserPos
        ? Math.max(posPts[rivalPos + 1] + 1, Math.min(rivalPos > 1 ? posPts[rivalPos - 1] - 1 : 98, rTarget))
        : Math.min(posPts[rivalPos - 1] - 1, Math.max(rivalPos < targetTotalClubs ? posPts[rivalPos + 1] + 1 : 4, rTarget));
    }

    const rows: any[] = [];
    for (let p = 1; p <= targetTotalClubs; p++) {
      if (p === safeUserPos) {
        rows.push({
          pos: safeUserPos,
          id: state.club.id,
          name: seasonData.clubName || state.club.name,
          color: seasonData.clubColor || state.club.color,
          logo: seasonData.clubLogo || (isModActive ? state.club.logo : undefined),
          mp: 34,
          w: userWins,
          d: userDraws,
          l: userLosses,
          gf: userGf,
          ga: userGa,
          pts: userPts,
          gd: userGDStr,
          isUser: true,
          isRival: false,
          pointsDeducted: seasonData.pointsDeducted,
        });
      } else if (p === rivalPos && rivalClub) {
        const rPts = posPts[rivalPos];
        let w = Math.min(34, Math.max(1, Math.floor(rPts / 3)));
        let d = Math.max(0, rPts - w * 3);
        while (d < 4 && w > 2 && w + d < 34) {
          w -= 1;
          d += 3;
        }
        const l = Math.max(0, 34 - w - d);
        const gf = Math.max(18, Math.round(w * 1.9 + d * 1.1 + seededRand(seasonData.year * 2, 4, 10)));
        const ga = Math.max(14, Math.round(l * 1.8 + d * 0.9 + seededRand(seasonData.year * 2 + 10, 4, 10)));
        const rGd = gf - ga;

        rows.push({
          pos: rivalPos,
          id: typeof rivalClub.id === 'number' ? rivalClub.id : undefined,
          name: rivalClub.name,
          color: rivalClub.color,
          logo: isModActive ? rivalClub.logo : undefined,
          mp: 34,
          w,
          d,
          l,
          gf,
          ga,
          pts: rPts,
          gd: rGd > 0 ? `+${rGd}` : `${rGd}`,
          isUser: false,
          isRival: true,
        });
      } else {
        const club = clubsPool.shift() || {
          id: 9950 + p,
          name: `Club ${p}`,
          color: '#64748b',
          tier: currentTier,
          baseOvr: currentLeagueInfo.avgOvr,
        };
        const pts = posPts[p];
        let w = Math.min(34, Math.max(1, Math.floor(pts / 3)));
        let d = Math.max(0, pts - w * 3);
        while (d < 4 && w > 2 && w + d < 34) {
          w -= 1;
          d += 3;
        }
        const l = Math.max(0, 34 - w - d);
        const gf = Math.max(18, Math.round(w * 1.9 + d * 1.1 + seededRand(seasonData.year * 10 + p, 4, 12)));
        const ga = Math.max(14, Math.round(l * 1.8 + d * 0.9 + seededRand(seasonData.year * 10 + p + 50, 4, 12)));
        const gdVal = gf - ga;

        rows.push({
          pos: p,
          id: typeof club.id === 'number' ? club.id : undefined,
          name: club.name,
          color: club.color,
          logo: isModActive ? club.logo : undefined,
          mp: 34,
          w,
          d,
          l,
          gf,
          ga,
          pts,
          gd: gdVal > 0 ? `+${gdVal}` : `${gdVal}`,
          isUser: false,
          isRival: false,
        });
      }
    }

    rows.forEach((r, idx) => {
      r.pos = idx + 1;
    });

    return rows;
  }, [seasonData, country, league, clubsDb, state.club, state.currentRival, state.seasonStandingsArchive, isModActive]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const elem = cardRef.current;
    if (!elem) return;

    let originalOverflow = '';
    let originalMaxHeight = '';
    let originalHeight = '';

    try {
      setIsDownloading(true);

      // Temporarily expand scrollable container so htmlToImage renders the complete content without cropping or blank canvases
      originalOverflow = elem.style.overflow;
      originalMaxHeight = elem.style.maxHeight;
      originalHeight = elem.style.height;

      elem.classList.remove('overflow-y-auto', 'max-h-[92vh]', 'sm:max-h-[88vh]', 'overscroll-contain');
      elem.style.overflow = 'visible';
      elem.style.maxHeight = 'none';
      elem.style.height = 'auto';

      const blob = await htmlToImage.toBlob(elem, {
        quality: 1.0,
        backgroundColor: '#141416',
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
        filter: (node) => node.tagName !== 'BUTTON' && node.tagName !== 'NAV'
      });
      if (!blob) return;

      const filename = `season-${seasonData.year}-${seasonData.clubName.replace(/\s+/g, '-').toLowerCase()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${seasonData.clubName} Season ${seasonData.year}`,
            files: [file]
          });
          return;
        } catch {
          // fallback
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.warn('Failed to export season wrap card', err);
    } finally {
      if (elem) {
        elem.classList.add('overflow-y-auto', 'overscroll-contain');
        elem.style.overflow = originalOverflow;
        elem.style.maxHeight = originalMaxHeight;
        elem.style.height = originalHeight;
      }
      setIsDownloading(false);
    }
  };

  // Living Universe & World Football Movements
  const universeMovementsList = useMemo(() => {
    const all = getAllUniverseMovements(state, clubsDb || ALL_CLUBS, isModActive);
    const yearMoves = all.filter(m => m.year === seasonData.year);
    return yearMoves.length > 0 ? yearMoves : all.slice(0, 30);
  }, [state, clubsDb, isModActive, seasonData.year]);

  const continentalChampions = useMemo(() => {
    return universeMovementsList.filter(m => m.type === 'cup_champion');
  }, [universeMovementsList]);

  const leagueChampions = useMemo(() => {
    return universeMovementsList.filter(m => 
      m.type === 'title_won' || 
      (m.pos === 1 && m.type !== 'cup_champion' && m.type !== 'insolvency_drop') ||
      (typeof m.reason === 'string' && /(?:^|\b)(?:champion|meister|league title)(?:\b|$)/i.test(m.reason) && m.type !== 'cup_champion')
    );
  }, [universeMovementsList]);

  const promotionsList = useMemo(() => {
    return universeMovementsList.filter(m => m.type === 'promotion');
  }, [universeMovementsList]);

  const relegationsList = useMemo(() => {
    return universeMovementsList.filter(m => 
      m.type === 'relegation' && 
      m.pos !== 1 && 
      !(typeof m.reason === 'string' && /(?:^|\b)(?:champion|meister|winner|trophy|glory|triumph)(?:\b|$)/i.test(m.reason))
    );
  }, [universeMovementsList]);

  const fallenGiantsList = useMemo(() => {
    return universeMovementsList.filter(m => m.type === 'insolvency_drop');
  }, [universeMovementsList]);

  const transferSagasList = useMemo(() => {
    return universeMovementsList.filter(m => m.type === 'transfer_saga');
  }, [universeMovementsList]);

  // Outcome banner styles (100% English)
  const outcomeBanner = useMemo(() => {
    if (isChamp) {
      return {
        badge: 'CHAMPIONS',
        tagline: 'Champions & League Glory',
        color: 'from-amber-500/25 via-yellow-500/15 to-transparent',
        border: 'border-amber-500/40',
        text: 'text-amber-300',
        icon: 'fa-crown',
        pillBg: 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]'
      };
    }
    if (isPromoted) {
      return {
        badge: 'PROMOTION ACHIEVED',
        tagline: `Promoted to ${nextLeague.name}!`,
        color: 'from-emerald-500/25 via-teal-500/15 to-transparent',
        border: 'border-emerald-500/40',
        text: 'text-emerald-300',
        icon: 'fa-arrow-trend-up',
        pillBg: 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.4)]'
      };
    }
    if (seasonData.isSackedRelegation) {
      return {
        badge: 'MANAGER SACKED',
        tagline: isTier1Only
          ? `Contract Terminated · Bottom-3 Finish (No Relegation · Shields Ineffective)`
          : `Contract Terminated · Bottom-Tier Relegation Sacking`,
        color: 'from-rose-500/25 via-red-500/15 to-transparent',
        border: 'border-rose-500/40',
        text: 'text-rose-300',
        icon: 'fa-triangle-exclamation',
        pillBg: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
      };
    }
    if (isRelegated) {
      return {
        badge: 'RELEGATION',
        tagline: `Relegated to ${nextLeague.name}`,
        color: 'from-rose-500/25 via-red-500/15 to-transparent',
        border: 'border-rose-500/40',
        text: 'text-rose-300',
        icon: 'fa-arrow-trend-down',
        pillBg: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
      };
    }
    if (seasonData.tier === 1 && seasonData.pos <= 4) {
      return {
        badge: 'CONTINENTAL QUALIFIED',
        tagline: 'Elite Continental Stage Secured',
        color: 'from-sky-500/25 via-blue-500/15 to-transparent',
        border: 'border-sky-500/40',
        text: 'text-sky-300',
        icon: 'fa-star',
        pillBg: 'bg-sky-400 text-black'
      };
    }
    return {
      badge: `FINISH #${seasonData.pos}`,
      tagline: `Season completed in ${league.name}`,
      color: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      border: 'border-white/10',
      text: 'text-zinc-200',
      icon: 'fa-flag-checkered',
      pillBg: 'bg-white/15 text-white'
    };
  }, [isChamp, isPromoted, isRelegated, seasonData, nextLeague, league]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-2xl overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl xl:max-w-6xl bg-[#12141c]/95 rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-xl flex flex-col h-[90vh] sm:h-auto max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto overflow-hidden relative shrink-0"
      >
        {/* Subtle Ambient Accent Glow */}
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: state.club.color || '#38bdf8' }}
        />

        {/* TOP BRANDING & OUTCOME HEADER */}
        <div className="relative p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02] overflow-hidden shrink-0">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Club Identity & Outcome */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 shadow-md p-2 relative">
                <ClubLogo
                  name={seasonData.clubName || state.club.name}
                  id={state.club.id}
                  color={seasonData.clubColor || state.club.color}
                  logo={state.club.logo}
                  fallbackLogo={state.club.fallbackLogo}
                  isModActive={isModActive}
                  className="w-10 h-10 object-contain drop-shadow"
                  fallbackClassName="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base"
                />
                {isChamp && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] shadow-md font-bold">
                    <i className="fas fa-crown"></i>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Season Wrap-Up · {seasonData.year}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-sky-400 uppercase tracking-wide">
                    {league.name}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-white break-words leading-tight tracking-tight">
                  {seasonData.clubName}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${outcomeBanner.text}`}>
                    <i className={`fas ${outcomeBanner.icon} text-[10px]`}></i>
                    {outcomeBanner.badge}
                  </span>
                  <span className="text-zinc-600 hidden sm:inline">·</span>
                  <span className="text-xs text-zinc-300 font-normal hidden sm:inline truncate">
                    {outcomeBanner.tagline}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Record Ribbon */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-2xl p-2.5 sm:p-3 self-start md:self-auto shrink-0 shadow-sm">
              <div className="text-center px-2">
                <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider">Pts</div>
                <div className="text-base sm:text-lg font-bold text-amber-300 tabular-nums">{seasonData.pts}</div>
              </div>
              <div className="w-px h-6 bg-white/[0.08]" />
              <div className="text-center px-2">
                <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider">W-D-L</div>
                <div className="text-xs sm:text-sm font-semibold text-white tabular-nums">
                  <span className="text-emerald-400">{seasonData.wins}</span>-
                  <span className="text-zinc-300">{seasonData.draws}</span>-
                  <span className="text-rose-400">{seasonData.losses}</span>
                </div>
              </div>
              <div className="w-px h-6 bg-white/[0.08]" />
              <div className="text-center px-2">
                <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider">GD</div>
                <div className={`text-xs sm:text-sm font-semibold tabular-nums ${goalDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                </div>
              </div>
              {trophyList.length > 0 && (
                <>
                  <div className="w-px h-6 bg-white/[0.08]" />
                  <div className="text-center px-2">
                    <div className="text-[9px] uppercase font-semibold text-amber-300 tracking-wider">Trophies</div>
                    <div className="text-sm sm:text-base font-bold text-amber-300 flex items-center justify-center gap-1 tabular-nums">
                      <span>{trophyList.length}</span>
                      <span className="text-xs">🏆</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4 Clean, Punchy Segmented Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.06] overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => switchTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <i className="fa-solid fa-compass text-[10px]"></i>
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('squad')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'squad'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <i className="fa-solid fa-users text-[10px]"></i>
              <span>Club & Squad</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'table'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <i className="fa-solid fa-table text-[10px]"></i>
              <span>League Table</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('world')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'world'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <i className="fa-solid fa-earth-americas text-[10px]"></i>
              <span>World Digest</span>
            </button>
          </div>
        </div>

        {/* SCROLLABLE BENTO BODY */}
        <div ref={cardRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar bg-[#12141c]/60">
          <div className="space-y-6">
            {/* Top 3 Global Leaderboard Milestone Banner */}
            {isTop3Leaderboard && (
              <div className="bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/15 border border-yellow-400/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 text-xl font-bold">
                    🏆
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                      Top 3 Global Leaderboard!
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                      Historic achievement! Rank #{top3Rank} globally with {(state.careerScore || 0).toLocaleString()} pts!
                    </div>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-300 px-3 py-1 bg-yellow-400/10 rounded-xl border border-yellow-400/25 tabular-nums">
                  #{top3Rank}
                </div>
              </div>
            )}

            {/* Grand League Champions & Multi-Trophy Celebration Banner */}
            {activeTab === 'overview' && (isChamp || trophyList.length > 0) && (
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border border-yellow-400/40 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(250,204,21,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 text-center sm:text-left relative z-10">
                  {/* Visual Trophies Display */}
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 p-2 sm:p-2.5 bg-gradient-to-br from-yellow-400/20 via-amber-500/30 to-yellow-600/20 border border-yellow-400/30 rounded-2xl shadow-lg shrink-0">
                    {trophyList.length > 0 ? (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {trophyList.map((tr, i) => (
                          <div key={i} className="transform hover:scale-110 transition-transform" title={tr.name}>
                            <PrestigeTrophy
                              type={tr.type}
                              size={trophyList.length >= 4 ? 40 : trophyList.length > 1 ? 48 : 56}
                              showStars={false}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-3xl">🏆</span>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-300 flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                      <span>★</span>
                      <span>
                        {trophyList.length >= 6
                          ? 'HISTORIC SEXTUPLE WINNERS'
                          : trophyList.length === 5
                          ? 'HISTORIC QUINTUPLE WINNERS'
                          : trophyList.length === 4
                          ? 'HISTORIC QUADRUPLE WINNERS'
                          : trophyList.length === 3
                          ? 'HISTORIC TREBLE WINNERS'
                          : trophyList.length === 2
                          ? (isChamp ? 'DOMESTIC DOUBLE WINNERS' : 'CUP DOUBLE WINNERS')
                          : isChamp
                          ? (country === 'ECU' ? 'LigaPro Serie A Champion' : `${league.name} Champion`)
                          : 'CUP CHAMPIONS'}
                      </span>
                      <span>★</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {trophyList.length >= 6
                        ? 'HISTORIC SEXTUPLE GLORY!'
                        : trophyList.length === 5
                        ? 'HISTORIC QUINTUPLE GLORY!'
                        : trophyList.length === 4
                        ? 'HISTORIC QUADRUPLE GLORY!'
                        : trophyList.length === 3
                        ? 'HISTORIC TREBLE GLORY!'
                        : trophyList.length === 2
                        ? (isChamp ? 'DOMESTIC DOUBLE GLORY!' : 'CUP DOUBLE GLORY!')
                        : isChamp
                        ? (country === 'ECU' ? 'CAMPEÓN NACIONAL DEL ECUADOR!' : 'LEAGUE TITLE GLORY!')
                        : 'SILVERWARE & CUP GLORY!'}
                    </h2>
                    <p className="text-xs sm:text-sm text-yellow-100/90 mt-1 max-w-lg font-medium leading-relaxed">
                      {trophyList.length > 1
                        ? `Historic multi-trophy triumph! ${seasonData.clubName} lifts ${trophyList.map(t => t.name).join(' & ')} in an extraordinary campaign!`
                        : isChamp
                        ? `Historic triumph! ${seasonData.clubName} lifts the championship trophy after dominating the season with ${seasonData.pts} points!`
                        : `Historic cup triumph! ${seasonData.clubName} lifts the ${trophyList[0]?.name || 'cup'} silverware!`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-center gap-1.5 shrink-0 relative z-10">
                  <span className="text-xs uppercase font-bold tracking-wider px-3.5 py-1 rounded-full bg-yellow-400 text-black shadow-md">
                    {trophyList.length >= 6
                      ? 'Sextuple'
                      : trophyList.length === 5
                      ? 'Quintuple'
                      : trophyList.length === 4
                      ? 'Quadruple'
                      : trophyList.length === 3
                      ? 'Treble'
                      : trophyList.length === 2
                      ? 'Double'
                      : isChamp
                      ? '1st Place'
                      : 'Winners'}
                  </span>
                  <span className="text-[11px] text-amber-200 font-semibold tabular-nums mt-0.5">
                    +{formatMoney(getLeagueScaledVal(1, trophyList.length >= 6 ? 30000 : trophyList.length === 5 ? 25000 : trophyList.length === 4 ? 20000 : 15000, country))} Prize
                  </span>
                </div>
              </div>
            )}

            {/* ================= 1. OVERVIEW: POSITION, TROPHIES, BOARD & DYNASTY ================= */}
            {activeTab === 'overview' && (
              <div id="section-exec" className="space-y-4 scroll-mt-6">
                {/* Silverware & Trophy Cabinet (Featured directly in Executive Summary whenever trophies are won!) */}
                {trophyList.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-500/10 via-yellow-950/20 to-amber-950/10 border border-amber-400/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3 mb-4">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
                          <i className="fa-solid fa-crown text-amber-400 text-xs"></i>
                          <span>
                            {trophyList.length >= 6
                              ? 'Historic Sextuple / Multiple Honours'
                              : trophyList.length === 5
                              ? 'Historic Quintuple / Multiple Honours'
                              : trophyList.length === 4
                              ? 'Historic Quadruple / Multiple Honours'
                              : trophyList.length === 3
                              ? 'Historic Treble / Multiple Honours'
                              : trophyList.length === 2
                              ? 'Domestic / Continental Double'
                              : 'Silverware & Championship Honours'}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                          {trophyList.length === 1
                            ? '1 Trophy Lifted This Season'
                            : `${trophyList.length} Trophies Lifted This Season!`}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                          {trophyList.length >= 6
                            ? 'Sextuple Winners'
                            : trophyList.length === 5
                            ? 'Quintuple Winners'
                            : trophyList.length === 4
                            ? 'Quadruple Winners'
                            : trophyList.length === 3
                            ? 'Treble Winners'
                            : trophyList.length === 2
                            ? 'Double Winners'
                            : 'Champions'}
                        </span>
                      </div>
                    </div>

                    {/* Trophy Display Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {trophyList.map((tr, idx) => (
                        <div
                          key={idx}
                          className="bg-white/[0.03] hover:bg-white/[0.06] border border-amber-400/25 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center transition-all shadow-sm group"
                        >
                          <div className="py-2 transform group-hover:scale-105 transition-transform">
                            <PrestigeTrophy type={tr.type} size={64} showStars={false} />
                          </div>
                          <div className="mt-2 w-full">
                            <div className="text-[9px] uppercase font-semibold tracking-wider text-amber-300/80 truncate">
                              {tr.badge || 'Silverware'}
                            </div>
                            <div className="text-xs font-bold text-white tracking-tight truncate mt-0.5" title={tr.name}>
                              {tr.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Promotion Showcase Card (Prominently featured exclusively in Executive Summary for Promoted Clubs) */}
                {isPromoted && !isChamp && (
                  <div className="bg-gradient-to-br from-emerald-500/15 via-teal-950/25 to-sky-950/15 border border-emerald-400/35 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_0_35px_rgba(16,185,129,0.2)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-4 relative z-10">
                      <div className="flex items-center gap-3.5">
                        <div className="flex items-center justify-center p-2.5 bg-gradient-to-br from-emerald-400/25 via-teal-500/35 to-emerald-600/25 border border-emerald-400/40 rounded-2xl shadow-lg shrink-0">
                          <PrestigeTrophy type="promotion" size={44} showStars={false} />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 flex items-center gap-1.5 mb-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <i className="fa-solid fa-arrow-trend-up text-xs text-emerald-400"></i>
                            <span>{seasonData.pos === 2 ? t('Runner-Up Promotion', 'Vizemeister-Aufstieg') : t('Promotion Achieved', 'Aufstieg gesichert')}</span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {t(`Promotion Secured! Ascending to ${nextLeague.name}`, `Aufstieg geschafft! Aufstieg in die ${nextLeague.name}`)}
                          </h3>
                          <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                            {`${state.club.name} finishes #${seasonData.pos} in ${league.name} and secures promotion to ${nextLeague.name} (Tier ${nextTier})!`}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0">
                        <span className="text-xs uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/35 shadow-sm">
                          {seasonData.pos === 2 ? t('Runner-Up · Promoted', 'Vizemeister · Aufsteiger') : t('Promotion Secured', 'Aufstieg gesichert')}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                          Tier {seasonData.tier} ➔ Tier {nextTier}
                        </span>
                      </div>
                    </div>

                    {/* Key Promotion Parameters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
                      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">New Division</div>
                        <div className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">{nextLeague.name}</div>
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">New Tier Level</div>
                        <div className="text-xs sm:text-sm font-bold text-sky-400 mt-0.5">Tier {nextTier}</div>
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Avg League OVR</div>
                        <div className="text-xs sm:text-sm font-bold text-amber-300 font-mono mt-0.5">{nextLeague.avgOvr || 70} OVR</div>
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Next Season Target</div>
                        <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">Top {state.boardTargetFinish || 15} Mandate</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Twin Bento: Position & Board Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Position KPI Tile */}
                  <div 
                    onClick={() => {
                      switchTab('table');
                    }}
                    className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-400/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90">Final Position</span>
                        <span className="text-[11px] text-sky-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Standings & Table</span>
                          <i className="fa-solid fa-arrow-right text-[9px]"></i>
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">
                        #{seasonData.pos} <span className="text-xs text-zinc-400 font-sans font-normal">in {league.name}</span>
                      </div>
                      <div className="text-xs text-zinc-300 mt-1.5 tabular-nums">
                        {seasonData.pts} Pts · {seasonData.wins}W-{seasonData.draws}D-{seasonData.losses}L ({seasonData.gf}:{seasonData.ga})
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.05] text-xs flex items-center justify-between text-zinc-400">
                      <span>Target: Top {state.boardTargetFinish || 15}</span>
                      <span className={`font-semibold tabular-nums ${seasonData.pos <= (state.boardTargetFinish || 15) ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {seasonData.pos <= (state.boardTargetFinish || 15) ? 'Target Met ✓' : 'Target Missed ✗'}
                      </span>
                    </div>
                  </div>

                  {/* Board Trust & Mandate Tile */}
                  <div 
                    onClick={() => scrollToSection('board', 'section-board')}
                    className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-400/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90">Board Status & Trust</span>
                        <span className="text-[11px] text-sky-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Board Review</span>
                          <i className="fa-solid fa-arrow-right text-[9px]"></i>
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                          {state.clubImpactScore ?? 50}<span className="text-sm text-zinc-500 font-normal">/100</span>
                        </span>
                        <span className={`text-xs font-semibold ${
                          (state.clubImpactScore ?? 50) >= 70 ? 'text-emerald-400' : (state.clubImpactScore ?? 50) >= 40 ? 'text-sky-300' : 'text-rose-400'
                        }`}>
                          {(state.clubImpactScore ?? 50) >= 70 ? 'Untouchable' : (state.clubImpactScore ?? 50) >= 40 ? 'Stable Standing' : 'Under Pressure'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-3">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            (state.clubImpactScore ?? 50) >= 70 ? 'bg-emerald-400' : (state.clubImpactScore ?? 50) >= 40 ? 'bg-sky-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, state.clubImpactScore ?? 50))}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.05] text-xs flex items-center justify-between text-zinc-400">
                      <span>Shields: <strong className="text-white tabular-nums">{state.immunityShields ?? 0}</strong></span>
                      <span>Next Mandate: <strong className="text-white">Top {state.boardTargetFinish || 15}</strong></span>
                    </div>
                  </div>
                </div>

                {/* ================= STRATEGIC INTELLIGENCE & DYNASTY RADAR ================= */}
                <div className="space-y-3 pt-2">
                  {/* Head Coach Poached / Departed Alert */}
                  {seasonData.coachDepartureAlert && (
                    <div className="bg-gradient-to-r from-rose-950/50 via-amber-950/35 to-rose-950/40 border border-rose-500/40 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-sm shrink-0">
                          <i className="fa-solid fa-person-walking-dashed-line-arrow-right"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] uppercase font-bold text-rose-300 flex items-center gap-2 flex-wrap">
                            <span>
                              {seasonData.coachDepartureAlert.isPoached
                                ? 'Breaking: Head Coach Poached (Release Clause Triggered)'
                                : 'Breaking: Head Coach Resigned'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/30 text-[9px] text-rose-200">
                              {seasonData.coachDepartureAlert.ovrBoost >= 0 ? `-${seasonData.coachDepartureAlert.ovrBoost}` : `+${Math.abs(seasonData.coachDepartureAlert.ovrBoost)}`} OVR Impact
                            </span>
                          </div>
                          <p className="text-xs text-zinc-200 mt-0.5 leading-relaxed">
                            <strong className="text-white">{seasonData.coachDepartureAlert.coachName}</strong> ({seasonData.coachDepartureAlert.style}, {seasonData.coachDepartureAlert.ovrBoost >= 0 ? `+${seasonData.coachDepartureAlert.ovrBoost}` : seasonData.coachDepartureAlert.ovrBoost} OVR) departed at the end of the campaign due to {seasonData.coachDepartureAlert.reason}. Appoint a replacement in the Staff Market before next season!
                          </p>
                        </div>
                      </div>
                      {seasonData.coachDepartureAlert.isPoached && seasonData.coachDepartureAlert.buyoutFeeK > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold shrink-0 self-start sm:self-center">
                          +{formatMoney(seasonData.coachDepartureAlert.buyoutFeeK)} Buyout
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Tactical Staleness Warning */}
                  {isStaleActive && (
                    <div className="bg-gradient-to-r from-rose-950/40 via-red-900/30 to-amber-950/30 border border-rose-500/40 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 text-sm shrink-0">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase font-bold text-rose-300">Tactical Obsolescence · System Decoded</div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                          The league has decoded your tactic ({state.tactic})! You face an unavoidable <strong className="text-rose-400">-4 OVR penalty</strong> next season unless you reinvent or switch your philosophy in the Coach room (<span className="text-amber-300 font-semibold">-5 MP</span>).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Impending Tactical Staleness Warning (1 title away) */}
                  {isStaleWarning && (
                    <div className="bg-gradient-to-r from-amber-950/30 via-yellow-900/20 to-orange-950/20 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-sm shrink-0">
                        <i className="fa-solid fa-crosshairs"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase font-bold text-amber-300">Tactical Surveillance Notice</div>
                        <p className="text-xs text-zinc-300 mt-0.5">
                          Back-to-back league titles with {state.tactic} have drawn heavy scrutiny; winning again triggers Tactical Obsolescence (-4 OVR penalty).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Diverse Rival Challenger Storyline (Only shown in seasons when a challenger event triggers) */}
                  {superVillainClub && rivalChallengerEvent && (
                    <div className="bg-gradient-to-r from-purple-950/40 via-fuchsia-950/30 to-indigo-950/30 border border-fuchsia-500/40 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/30 flex items-center justify-center p-1.5 shrink-0">
                          {superVillainClub.logo ? (
                            <ClubLogo name={superVillainClub.name} club={superVillainClub} size={28} />
                          ) : (
                            <span className="text-base">⚔️</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-fuchsia-300">
                            {rivalChallengerEvent.badge || 'League Challenger · Title Threat'}
                          </div>
                          <p className="text-xs text-zinc-300 mt-0.5 truncate sm:whitespace-normal">
                            {rivalChallengerEvent.desc || `${superVillainClub.name} (${superVillainClub.baseOvr} OVR) has mounted a major title challenge for next season.`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-fuchsia-300 bg-fuchsia-500/20 px-2.5 py-1 rounded-full border border-fuchsia-400/30">
                          {rivalChallengerEvent.clubOvr || superVillainClub.baseOvr} OVR
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dynasty Target on the Back (When consecutiveTitles >= 2) */}
                  {consecutiveTitles >= 2 && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-yellow-950/20 to-amber-950/15 border border-amber-400/25 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 text-sm shrink-0">
                          <i className="fa-solid fa-crown"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-amber-300">Dynasty Target · {consecutiveTitles}x Consecutive Champion</div>
                          <p className="text-xs text-zinc-300 mt-0.5 truncate sm:whitespace-normal">
                            The entire continent is gunned to knock you off the summit; opponents treat every clash against you as their cup final.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/25 shrink-0">
                        {consecutiveTitles}x Champion
                      </span>
                    </div>
                  )}

                  {/* Sacking Resolution Banner if Sacked */}
                  {(seasonData.isSackedRelegation || seasonData.isSacked) && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 sm:p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 text-base shrink-0">
                          <i className="fas fa-triangle-exclamation"></i>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-semibold tracking-wider text-rose-400">Board Resolution</div>
                          <div className="text-base font-bold text-white">Managerial Contract Terminated</div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {isTier1Only
                          ? `Following a bottom-3 finish in ${league.name}, the Board of Directors has immediately dismissed management for sporting failure. Since this country has no lower tier, the club remains in the league, but managerial immunity shields offer no protection against bottom-tier collapse.`
                          : isBottomTier
                          ? `Following drop-zone failure in ${league.name}, the Board of Directors has immediately terminated your contract. With no lower league to absorb the fall, management has been relieved of duties.`
                          : `Following the conclusion of the campaign, the Board of Directors has officially relieved management of sporting duties.`}
                      </p>
                    </div>
                  )}

                  {/* Arch Rival Derby Record */}
                  {seasonData.rivalData && (
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-rose-400 flex items-center gap-1.5">
                          <i className="fas fa-fire text-rose-400"></i>
                          <span>Arch Rival Derby · {seasonData.rivalData.name}</span>
                        </div>
                        {seasonData.rivalData.isPaused && (
                          <span className="text-[9px] uppercase font-semibold text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-full">
                            Paused
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-[9px] text-zinc-400 uppercase block">This Season</span>
                          <span className="font-bold text-emerald-400">{seasonData.rivalData.wins}W</span>{' '}
                          <span className="text-zinc-500">·</span>{' '}
                          <span className="font-bold text-zinc-300">{seasonData.rivalData.draws}D</span>{' '}
                          <span className="text-zinc-500">·</span>{' '}
                          <span className="font-bold text-rose-400">{seasonData.rivalData.losses}L</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-[9px] text-zinc-400 uppercase block">All-Time H2H</span>
                          <span className="font-bold text-emerald-400">{seasonData.rivalData.h2hWins}W</span>{' '}
                          <span className="text-zinc-500">·</span>{' '}
                          <span className="font-bold text-zinc-300">{seasonData.rivalData.h2hDraws}D</span>{' '}
                          <span className="text-zinc-500">·</span>{' '}
                          <span className="font-bold text-rose-400">{seasonData.rivalData.h2hLosses}L</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OVR Decay & Roster Audit Breakdown (if any deductions happened) */}
                  {decayReasons.length > 0 && (
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
                          <i className="fa-solid fa-arrow-trend-down text-rose-400 text-xs"></i>
                          <span>Off-Season OVR Audit & Attrition Breakdown</span>
                        </div>
                        <span className="text-xs text-zinc-400 font-mono tabular-nums">
                          {seasonData.startOvr || state.club.baseOvr} ➔ {seasonData.newBaseOvr || state.club.baseOvr} OVR
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {decayReasons.map((reason, idx) => (
                          <div key={idx} className="bg-rose-500/10 border border-rose-500/25 rounded-lg px-2.5 py-1 text-xs text-rose-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= 3. LEAGUE TABLE: DIRECT INLINE STANDINGS ================= */}
            {activeTab === 'table' && (
              <div id="section-sporting" className="space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-sky-400/90 px-1">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-chart-line text-[11px]"></i>
                    {league.name} · Final Standings & Campaign Review
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Matchday 34 Final Table</span>
                </div>

                {/* League Campaign Results */}
                <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 border border-white/[0.06] shadow-sm">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mb-1">
                    Campaign Summary
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {league.name}
                  </h3>

                  {/* Primary Stats Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.05] my-3 text-center">
                    <div className="bg-white/[0.02] rounded-xl p-2">
                      <div className="text-[9px] text-zinc-400 uppercase font-semibold">Position</div>
                      <div className="text-base sm:text-lg font-bold text-amber-300 tabular-nums">#{seasonData.pos}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-2">
                      <div className="text-[9px] text-zinc-400 uppercase font-semibold">Points</div>
                      <div className="text-base sm:text-lg font-bold text-white tabular-nums">{seasonData.pts}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-2">
                      <div className="text-[9px] text-zinc-400 uppercase font-semibold">Wins</div>
                      <div className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">{seasonData.wins}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-2">
                      <div className="text-[9px] text-zinc-400 uppercase font-semibold">Draws</div>
                      <div className="text-base sm:text-lg font-bold text-zinc-300 tabular-nums">{seasonData.draws}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-2">
                      <div className="text-[9px] text-zinc-400 uppercase font-semibold">Losses</div>
                      <div className="text-base sm:text-lg font-bold text-rose-400 tabular-nums">{seasonData.losses}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-2">
                      <div className="text-[9px] text-zinc-400 uppercase font-semibold">Goals</div>
                      <div className="text-sm font-bold text-white tabular-nums">
                        {seasonData.gf}:{seasonData.ga}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400">
                    <span>Goal Difference</span>
                    <span className={`tabular-nums font-semibold ${goalDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                    </span>
                  </div>
                </div>

                {/* Direct Full League Standings Table (Inline without toggle) */}
                <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/[0.08] shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400 text-xs">
                        <i className="fa-solid fa-table-list"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {league.name} · Final Standings
                        </h4>
                        <span className="text-[10px] text-zinc-400">Matchday 34 Final Table</span>
                      </div>
                    </div>
                  </div>

                    <div className="overflow-x-auto custom-scrollbar">
                      <div className="min-w-[560px]">
                        {/* Table Header */}
                        <div className="flex items-center py-1.5 px-3 text-[10px] uppercase font-semibold text-zinc-400 border-b border-white/[0.04]">
                          <div className="w-8 text-center shrink-0">#</div>
                          <div className="flex-1 px-2">Club</div>
                          <div className="w-9 text-center shrink-0">MP</div>
                          <div className="w-8 text-center shrink-0 text-emerald-400">W</div>
                          <div className="w-8 text-center shrink-0 text-zinc-300">D</div>
                          <div className="w-8 text-center shrink-0 text-rose-400">L</div>
                          <div className="w-14 text-center shrink-0">GF:GA</div>
                          <div className="w-10 text-center shrink-0">GD</div>
                          <div className="w-12 text-center shrink-0 font-bold text-white">Pts</div>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-white/[0.02]">
                          {tableData.map((r, i) => {
                            const isTier1Only = getMaxTier(country, clubsDb) === 1;
                            const isBottomTier = seasonData.tier >= getMaxTier(country, clubsDb);
                            const isContinental = seasonData.tier === 1 && i < 4;
                            const isUserPromoted = r.isUser && seasonData.tier > 1 && (seasonData.pos <= 2 || nextTier < seasonData.tier);
                            const isUserChamp = r.isUser && seasonData.pos === 1;
                            const isPromo = (seasonData.tier > 1 && i < 2) || isUserPromoted;
                            const isPlayoff = !isUserPromoted && seasonData.tier > 1 && ((['ENG', 'ESP', 'ITA', 'USA', 'FRA'].includes(country) && i >= 2 && i < 6) || i === 2);
                            const numRelegationSpots = (country === 'TUR' && seasonData.tier === 3) ? 2 : 3;
                            const isManagerSackingZone = (isTier1Only || isBottomTier) && (i >= tableData.length - numRelegationSpots);
                            const isRelegation = !isBottomTier && !isTier1Only && (i >= tableData.length - numRelegationSpots);
                            const isRelegationPlayoff = !isBottomTier && !isTier1Only && (i === tableData.length - numRelegationSpots);
                            const isDirectRelegation = !isBottomTier && !isTier1Only && (i > tableData.length - numRelegationSpots);

                            const rowBg = r.isUser
                              ? isUserChamp
                                ? 'bg-amber-500/15 border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                                : isUserPromoted
                                ? 'bg-emerald-500/15 border-emerald-400/40'
                                : 'bg-sky-500/15 border-sky-400/40'
                              : r.isRival
                              ? 'bg-rose-500/10'
                              : isManagerSackingZone
                              ? 'bg-rose-950/20'
                              : i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]';

                            return (
                              <div
                                key={`${r.name}-${r.pos}`}
                                className={`flex items-center py-2 px-3 transition-colors relative text-xs ${rowBg} ${r.isUser ? (isUserChamp ? 'border-l-4 border-l-amber-400' : isUserPromoted ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-sky-400') : isContinental ? 'border-l-2 border-l-emerald-400/60' : isPromo ? 'border-l-2 border-l-emerald-400/60' : isPlayoff ? 'border-l-2 border-l-amber-400/60' : isRelegationPlayoff ? 'border-l-2 border-l-amber-500/80' : isDirectRelegation ? 'border-l-2 border-l-rose-500/60' : isManagerSackingZone ? 'border-l-2 border-l-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.7)]' : ''}`}
                              >
                                {/* Position */}
                                <div className={`w-8 text-center font-bold tabular-nums shrink-0 ${
                                  r.isUser ? (isUserChamp ? 'text-amber-300 font-black' : isUserPromoted ? 'text-emerald-300 font-extrabold' : 'text-sky-300') : r.isRival ? 'text-rose-300' : isContinental ? 'text-emerald-400' : isPromo ? 'text-emerald-400' : isPlayoff ? 'text-amber-400' : isRelegationPlayoff ? 'text-amber-400 font-bold' : (isDirectRelegation || isManagerSackingZone) ? 'text-rose-400 font-extrabold' : 'text-zinc-400'
                                }`}>
                                  {r.pos}
                                </div>

                                {/* Club Crest & Name */}
                                <div className="flex-1 flex items-center gap-2 px-2 min-w-0 py-0.5">
                                  <ClubLogo
                                    name={r.name}
                                    id={typeof r.id === 'number' ? r.id : undefined}
                                    color={r.color}
                                    logo={r.logo}
                                    isModActive={isModActive}
                                    className="w-5 h-5 object-contain shrink-0"
                                    fallbackClassName="w-5 h-5 text-[8px] rounded-md"
                                  />
                                  <span className={`truncate font-semibold text-xs py-0.5 leading-normal ${r.isUser ? 'text-white font-extrabold' : r.isRival ? 'text-rose-200 font-bold' : 'text-zinc-200'}`}>
                                    {r.name}
                                  </span>

                                  {r.isUser && (
                                    <span className="px-1.5 py-0.5 text-[8px] font-black bg-sky-500/25 text-sky-300 border border-sky-400/40 rounded tracking-wider uppercase shrink-0">
                                      YOU
                                    </span>
                                  )}

                                  {r.isRival && (
                                    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded tracking-wider uppercase shrink-0">
                                      Rival ⚔️
                                    </span>
                                  )}

                                  {/* FM-style Outcome Badge (C / P / R) */}
                                  {(() => {
                                    const badge = r.status || (
                                      r.pos === 1 ? 'C' :
                                      (r.isUser && isUserPromoted && !isUserChamp) ? 'P' :
                                      (!r.isUser && seasonData.tier > 1 && r.pos === 2 && !r.isReserve) ? 'P' :
                                      (!isBottomTier && !isTier1Only && isDirectRelegation) ? 'R' :
                                      undefined
                                    );
                                    if (!badge) return null;
                                    return (
                                      <span
                                        className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded tracking-wider shrink-0 shadow-sm ${
                                          badge === 'C'
                                            ? 'bg-amber-400 text-black'
                                            : badge === 'P'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-rose-600 text-white'
                                        }`}
                                        title={badge === 'C' ? (seasonData.tier > 1 ? 'Division Champion & Promoted' : 'League Champion') : badge === 'P' ? 'Promoted' : 'Relegated'}
                                      >
                                        {badge}
                                      </span>
                                    );
                                  })()}
                                </div>

                                {/* Numbers */}
                                <div className="w-9 text-center text-zinc-400 tabular-nums shrink-0">{r.mp}</div>
                                <div className="w-8 text-center text-emerald-400 font-semibold tabular-nums shrink-0">{r.w}</div>
                                <div className="w-8 text-center text-zinc-300 tabular-nums shrink-0">{r.d}</div>
                                <div className="w-8 text-center text-rose-400 tabular-nums shrink-0">{r.l}</div>
                                <div className="w-14 text-center text-zinc-300 tabular-nums shrink-0">{r.gf}:{r.ga}</div>
                                {(() => {
                                  const gdStr = String(r.gd ?? '0');
                                  const isPosGd = gdStr.startsWith('+') || (typeof r.gd === 'number' && r.gd > 0);
                                  const isNegGd = gdStr.startsWith('-') || (typeof r.gd === 'number' && r.gd < 0);
                                  const gdDisplay = (typeof r.gd === 'number' && r.gd > 0) ? `+${r.gd}` : gdStr;
                                  return (
                                    <div className={`w-10 text-center font-medium tabular-nums shrink-0 ${isPosGd ? 'text-emerald-400' : isNegGd ? 'text-rose-400' : 'text-zinc-400'}`}>
                                      {gdDisplay}
                                    </div>
                                  );
                                })()}
                                <div className="w-12 text-center font-bold text-white tabular-nums shrink-0">{r.pts}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Table Legend Footer */}
                        {(() => {
                          const isTier1Only = getMaxTier(country, clubsDb) === 1;
                          const isBottomTier = seasonData.tier >= getMaxTier(country, clubsDb);
                          return (
                            <div className="p-3 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 gap-3 flex-wrap shrink-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  <span>{seasonData.tier === 1 ? getContinentalCupNames(country).cl : 'Promotion (Top 2)'}</span>
                                </span>

                                {hasPromotionPlayoffs && (
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span>Promotion Playoff</span>
                                  </span>
                                )}

                                {(isTier1Only || isBottomTier) ? (
                                  <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <span>{country === 'TUR' && seasonData.tier === 3 ? 'Spots 17–18' : 'Spots 16–18'}: Sporting Relegation · Pyramid Floor ({isTier1Only ? 'No Club Relegation' : 'Clubs Retained'} · Manager Dismissal Only)</span>
                                  </span>
                                ) : (
                                  <>
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                                      <span>16th: Relegation Playoff</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                                      <span>{country === 'TUR' && seasonData.tier === 3 ? '18th: Direct Relegation' : 'Bottom 2: Direct Relegation'}</span>
                                    </span>
                                  </>
                                )}

                                <span className="flex items-center gap-1.5 border-l border-white/10 pl-2">
                                  <span className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-400 text-black">C</span>
                                  <span>Champion</span>
                                  <span className="px-1 py-0.2 rounded text-[7px] font-black bg-emerald-500 text-white ml-0.5">P</span>
                                  <span>Promoted</span>
                                  <span className="px-1 py-0.2 rounded text-[7px] font-black bg-rose-600 text-white ml-0.5">R</span>
                                  <span>Relegated</span>
                                </span>
                              </div>

                              <div className="text-[10px] text-zinc-500 font-medium tabular-nums">
                                {tableData.length} Clubs · 34 Matches Played
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Editorial Pundit Review */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 shrink-0 text-xs">
                    <i className="fas fa-quote-left"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{pundit.author}</span>
                      <span className="text-[10px] text-zinc-500">{pundit.handle}</span>
                    </div>
                    <p className="text-xs text-zinc-300 italic font-normal line-clamp-2">
                      "{pundit.text}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 3. PILLAR 2: FINANCE & TREASURY ================= */}
            {activeTab === 'squad' && (
              <div id="section-finance" className="space-y-3 scroll-mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-400/90 px-1 flex items-center gap-2">
                  <i className="fas fa-coins text-[11px]"></i>
                  Finance & Treasury · Fiscal Audit & Facilities
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Financial Audit */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 border border-white/[0.06] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 mb-1">
                        Financial Audit
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {isPositiveNetProfit ? 'Profitable Campaign' : 'Fiscal Deficit'}
                      </h3>
                    </div>

                    <div className="space-y-2 my-3">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <i className="fas fa-arrow-up text-emerald-400 text-[10px]"></i>
                          Revenue
                        </span>
                        <span className="font-semibold text-emerald-400 tabular-nums">
                          +{formatMoney(seasonData.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <i className="fas fa-arrow-down text-rose-400 text-[10px]"></i>
                          Expenses & Wages
                        </span>
                        <span className="font-semibold text-rose-400 tabular-nums">
                          -{formatMoney(seasonData.wages)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.05] flex items-end justify-between">
                      <div>
                        <div className="text-[9px] uppercase font-semibold text-zinc-500 mb-0.5">
                          Net Profit
                        </div>
                        <div className={`text-2xl font-bold tracking-tight tabular-nums ${isPositiveNetProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <AnimatedNumber from={0} to={seasonData.netProfit} isMoney duration={1.2} prefix={isPositiveNetProfit ? '+' : ''} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase font-semibold text-zinc-500 mb-0.5">
                          Ending Treasury
                        </div>
                        <div className={`text-base font-bold tabular-nums ${seasonData.endBudget >= 0 ? 'text-white' : 'text-rose-400'}`}>
                          {formatMoney(seasonData.endBudget)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stadium & Attendance */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 border border-white/[0.06] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-1">
                        Stadium & Attendance
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        Matchday Utilization
                      </h3>
                    </div>

                    <div className="space-y-3 my-3">
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-zinc-400">Average Turnout</span>
                          <span className="font-semibold text-white tabular-nums">
                            {Math.round(avgAttendance).toLocaleString()} / {state.club.stadium.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full transition-all duration-500 ${
                              fillPercentage >= 90 ? 'bg-emerald-400' : fillPercentage >= 70 ? 'bg-sky-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, fillPercentage))}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-zinc-400">
                          <span>Capacity Occupancy</span>
                          <span className="font-semibold text-zinc-300 tabular-nums">{fillPercentage}% Full</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                        <span className="text-zinc-400">Est. Gate Revenue</span>
                        <span className="font-semibold text-emerald-400 tabular-nums">
                          +{formatMoney(Math.round((avgAttendance * 17 * (country === 'ENG' ? 45 : country === 'GER' ? 35 : 30)) / 1000))}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400">
                      <span>Ground Capacity</span>
                      <span className="tabular-nums font-semibold text-white">
                        {state.club.stadium.toLocaleString()} seats
                      </span>
                    </div>
                  </div>

                  {/* Club Infrastructure */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 border border-white/[0.06] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-1">
                        Club Infrastructure
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        Academy & Medical
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 my-3">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                            <i className="fas fa-graduation-cap text-sky-400"></i>
                            <span>Academy</span>
                          </div>
                          <div className="text-lg font-bold text-white tabular-nums mt-1">
                            Lvl {state.club.academyLevel || 1}<span className="text-xs text-zinc-500 font-normal">/5</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-sky-300 font-normal mt-1">
                          {(state.club.academyLevel || 1) >= 5 ? 'World-Class Complex' : (state.club.academyLevel || 1) >= 3 ? 'National Academy (NLZ)' : 'Grassroots'}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                            <i className="fas fa-heart-pulse text-emerald-400"></i>
                            <span>Medical</span>
                          </div>
                          <div className="text-lg font-bold text-white tabular-nums mt-1">
                            Lvl {state.club.medicalLevel || 1}<span className="text-xs text-zinc-500 font-normal">/5</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-emerald-300 font-normal mt-1">
                          {(state.club.medicalLevel || 1) >= 5 ? 'Longevity Institute' : (state.club.medicalLevel || 1) >= 3 ? 'Biomechanics Lab' : 'Basic Rehab'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400">
                      <span>Maintenance</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <i className="fas fa-circle-check text-[10px]"></i> Operational
                      </span>
                    </div>
                  </div>
                </div>

                {/* Public Equity / IPO Performance */}
                {state.isPublic && (
                  <div className="bg-white/[0.03] border border-amber-500/20 rounded-2xl p-4 sm:p-5 mt-3 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5 mb-0.5">
                          <i className="fa-solid fa-chart-line text-xs"></i>
                          <span>{t('Public Shareholder Equity', 'Börsenwert & Aktionäre')}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          {t('Stock Exchange Performance', 'Aktienkurs-Entwicklung')}
                        </h4>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          {t('Your club is publicly traded. The stock price adjusted to', 'Der Verein ist börsennotiert. Der Aktienkurs reagierte auf die sportliche Saisonleistung und steht nun bei')} <strong className="text-white">€{state.stockPrice?.toFixed(2)}</strong>.
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <div className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-center min-w-[90px]">
                          <div className="text-[9px] text-zinc-400 uppercase font-semibold">{t('IPO Base', 'Ausgabepreis')}</div>
                          <div className="text-sm font-bold text-white tabular-nums mt-0.5">€{state.ipoPrice?.toFixed(2)}</div>
                        </div>
                        <div className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-center min-w-[90px]">
                          <div className="text-[9px] text-zinc-400 uppercase font-semibold">{t('Current Price', 'Aktueller Kurs')}</div>
                          <div className={`text-sm font-bold tabular-nums mt-0.5 ${(state.stockPrice || 0) >= (state.ipoPrice || 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                            €{state.stockPrice?.toFixed(2)}
                          </div>
                          <div className={`text-[9px] font-bold mt-0.5 ${(state.stockPrice || 0) >= (state.ipoPrice || 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {((((state.stockPrice || 0) - (state.ipoPrice || 1)) / (state.ipoPrice || 1)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Restructuring & Austerity Advisory */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5 mt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-scale-balanced text-xs"></i>
                        <span>Treasury & Wage Restructuring Advisory</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        Fiscal Blueprint & Debt Service
                      </h4>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        {state.bankLoan && state.bankLoan.yearsLeft > 0 ? (
                          <span>
                            Active bank debt requires <strong className="text-rose-300">{formatMoney(state.bankLoan.annualPayment)}/year</strong> in debt service ({state.bankLoan.yearsLeft} years left). Paying down debt early in the Ledger frees up cash flow for infrastructure development.
                          </span>
                        ) : seasonData.endBudget < 10000 ? (
                          <span>
                            Treasury reserves stand at {formatMoney(seasonData.endBudget)}. Building a €10M+ cash buffer cushions wage inflation from high-OVR veterans and funds Level 5+ upgrades.
                          </span>
                        ) : (
                          <span>
                            Excellent financial cushion ({formatMoney(seasonData.endBudget)}). High cash liquidity enables fearless transitions and systemic facility investments.
                          </span>
                        )}
                      </p>
                    </div>
                    {state.bankLoan && state.bankLoan.yearsLeft > 0 && (
                      <div className="shrink-0 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl sm:text-right">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Active Bank Loan</div>
                        <div className="text-sm font-bold text-rose-300 tabular-nums">-{formatMoney(state.bankLoan.annualPayment)}/yr</div>
                        <div className="text-[10px] text-zinc-400">{state.bankLoan.yearsLeft} yrs remaining</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= 4. PILLAR 3: SQUAD PROGRESSION ================= */}
            {activeTab === 'squad' && (
              <div id="section-squad" className="space-y-3 scroll-mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-400/90 px-1 flex items-center gap-2">
                  <i className="fas fa-users text-[11px]"></i>
                  Squad Progression · Roster & Academy
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First-Team Progression */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 border border-white/[0.06] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-1">
                        Squad Report
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        First-Team Progression
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 my-3">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <div className="text-[9px] uppercase font-semibold text-zinc-400">Squad OVR</div>
                        <div className="flex items-center gap-1.5 mt-1 tabular-nums">
                          <span className="text-sm font-semibold text-zinc-400">{seasonData.startOvr || state.club.baseOvr}</span>
                          <i className="fas fa-arrow-right text-[10px] text-zinc-600"></i>
                          <span className="text-xl font-bold text-white">{seasonData.newBaseOvr || state.club.baseOvr}</span>
                          {ovrDelta !== 0 && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums ${ovrDelta > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                              {ovrDelta > 0 ? `+${ovrDelta}` : ovrDelta}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <div className="text-[9px] uppercase font-semibold text-zinc-400">Squad Morale</div>
                        <div className="text-xl font-bold text-emerald-400 tabular-nums mt-1">
                          {seasonData.endMorale ?? state.club.morale ?? 100}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Youth Pipeline & Graduates */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 border border-white/[0.06] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-1">
                        Academy Pipeline
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        Youth Pipeline & Graduates
                      </h3>
                    </div>

                    <div className="space-y-2.5 my-3">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                        <span className="text-zinc-400">Academy Facility</span>
                        <span className="font-semibold text-sky-300 tabular-nums">
                          Level {state.club.academyLevel || 1}/5
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <div className="text-[9px] uppercase font-semibold text-zinc-400 mb-1">
                          Promoted Graduates
                        </div>
                        <div className="text-xs text-white">
                          {seasonData.graduatedYouths && seasonData.graduatedYouths.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {seasonData.graduatedYouths.map((y, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 text-[10px] font-semibold border border-sky-400/25">
                                  {y.split(',')[0]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">No graduates promoted to first team this season</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-400">
                      <span>Youth Pipeline</span>
                      <span className="tabular-nums font-semibold text-white">
                        {state.youthPipeline?.length || 0} Talents Enrolled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Squad Attrition Audit Breakdown */}
                {decayReasons.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
                        <i className="fa-solid fa-arrow-trend-down text-rose-400 text-xs"></i>
                        <span>Off-Season Squad Attrition Breakdown</span>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono tabular-nums">
                        Net: {(seasonData.newBaseOvr || state.club.baseOvr) - (seasonData.startOvr || state.club.baseOvr)} OVR
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {decayReasons.map((reason, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tactical Status within Squad Tab */}
                <div className={`p-4 rounded-2xl border mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isStaleActive 
                    ? 'bg-rose-500/10 border-rose-500/30' 
                    : isStaleWarning 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-white/[0.03] border-white/[0.06]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                      isStaleActive ? 'bg-rose-500/20 text-rose-400' : isStaleWarning ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      <i className={`fa-solid ${isStaleActive ? 'fa-triangle-exclamation' : isStaleWarning ? 'fa-crosshairs' : 'fa-chess'}`}></i>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-zinc-400">Tactical System Status</div>
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>{state.tactic || 'Balanced'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isStaleActive 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : isStaleWarning 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {isStaleActive 
                            ? 'Stale (-4 OVR Penalty)' 
                            : isStaleWarning 
                            ? 'Under League Surveillance' 
                            : 'Tactically Fresh'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400 sm:text-right">
                    {isStaleActive ? (
                      <span className="text-rose-300 font-semibold">Adapt philosophy in Headquarters for 5 MP to clear penalty.</span>
                    ) : isStaleWarning ? (
                      <span className="text-amber-300">Winning again with this tactic triggers staleness.</span>
                    ) : (
                      <span className="text-zinc-400">Tactics are effective and unpredictable.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= 5. PILLAR 4: HEAD COACH REVIEW ================= */}
            {activeTab === 'squad' && (
              <div id="section-coach" className="space-y-3 scroll-mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-400/90 px-1 flex items-center gap-2">
                  <i className="fas fa-user-tie text-[11px]"></i>
                  Head Coach Review · Leadership & Contract
                </div>

                {(state.currentCoach || seasonData.coachAtStartOfSim) ? (() => {
                  const coach = state.currentCoach || seasonData.coachAtStartOfSim;
                  const isExpiring = (coach.contractYearsLeft ?? 0) <= 0;
                  return (
                    <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-1 flex items-center justify-between">
                          <span>Head Coach Tenure</span>
                          {isExpiring && (
                            <span className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-400/30">
                              Expiring!
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-between">
                          <span>{coach.name}</span>
                          <span className="text-xs font-semibold text-zinc-400">{coach.style}</span>
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-3">
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <div className="text-[9px] uppercase font-semibold text-zinc-400">Contract Remaining</div>
                          <div className={`text-base font-bold tabular-nums mt-0.5 ${isExpiring ? 'text-rose-400' : 'text-white'}`}>
                            {coach.contractYearsLeft ?? 0} Years
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <div className="text-[9px] uppercase font-semibold text-zinc-400">Tactical Boost</div>
                          <div className={`text-base font-bold tabular-nums mt-0.5 ${coach.ovrBoost >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {coach.ovrBoost >= 0 ? `+${coach.ovrBoost}` : coach.ovrBoost} OVR
                          </div>
                        </div>
                      </div>

                      {onRenewCoach && (() => {
                        const currentYears = coach.contractYearsLeft ?? 0;
                        const isMaxed = currentYears >= 5;
                        const canPlus1 = currentYears + 1 <= 5;
                        const canPlus2 = currentYears + 2 <= 5;

                        return (
                          <div className="pt-3 border-t border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs text-zinc-400">
                              <span className="font-semibold text-white block">
                                {isMaxed ? 'Max Contract Length (5 Yrs)' : 'Extend Contract (Max 5 Yrs)'}
                              </span>
                              <span>{formatMoney(coach.cost)} / yr</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                disabled={!canPlus1}
                                onClick={() => canPlus1 && onRenewCoach(1)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                  canPlus1
                                    ? 'bg-sky-500 hover:bg-sky-400 text-white cursor-pointer shadow-sm'
                                    : 'bg-white/[0.04] text-zinc-600 border border-white/[0.06] cursor-not-allowed opacity-50'
                                }`}
                              >
                                +1 Yr
                              </button>
                              <button
                                disabled={!canPlus2}
                                onClick={() => canPlus2 && onRenewCoach(2)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                  canPlus2
                                    ? 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1] cursor-pointer'
                                    : 'bg-white/[0.04] text-zinc-600 border border-white/[0.06] cursor-not-allowed opacity-50'
                                }`}
                              >
                                +2 Yrs
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })() : seasonData.coachDepartureAlert ? (
                  <div className="bg-rose-500/[0.06] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-rose-500/30 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-rose-300 mb-0.5">
                          {seasonData.coachDepartureAlert.isPoached
                            ? 'Head Coach Poached · Release Clause Triggered'
                            : 'Head Coach Departed · Resignation'}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {seasonData.coachDepartureAlert.coachName}{' '}
                          <span className="text-xs font-semibold text-rose-300">
                            ({seasonData.coachDepartureAlert.ovrBoost >= 0 ? `+${seasonData.coachDepartureAlert.ovrBoost}` : seasonData.coachDepartureAlert.ovrBoost} OVR · {seasonData.coachDepartureAlert.style})
                          </span>
                        </h3>
                      </div>
                      {seasonData.coachDepartureAlert.isPoached && seasonData.coachDepartureAlert.buyoutFeeK > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold shrink-0">
                          +{formatMoney(seasonData.coachDepartureAlert.buyoutFeeK)} Buyout Paid
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Departed at season end due to {seasonData.coachDepartureAlert.reason}. Visit the Staff Market in pre-season to appoint a new Head Coach.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/[0.06] shadow-sm text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 text-lg mx-auto mb-3">
                      <i className="fas fa-user-tie"></i>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">No Head Coach Appointed</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Your squad navigated this campaign under interim management. Review and hire a specialist tactician in the pre-season staff market to elevate tactical strength.
                    </p>
                  </div>
                )}

                {/* Philosophical Pivot & Rebuild Advisory */}
                <div className="bg-white/[0.03] rounded-2xl p-4 sm:p-5 border border-white/[0.06] mt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5 mb-0.5">
                        <i className="fa-solid fa-chess-knight text-xs"></i>
                        <span>Tactical Philosophy & Backroom Rebuild Direction</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        Current System: {state.tactic || 'Balanced'}
                      </h4>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        {isStaleActive ? (
                          <span className="text-rose-300">
                            <strong>Obsolescence Active:</strong> League opposition has fully solved this philosophy (-4 OVR penalty in simulations). Head to the Coach room to adapt philosophy for 5 MP.
                          </span>
                        ) : isStaleWarning ? (
                          <span className="text-amber-300">
                            <strong>System Under Surveillance:</strong> Winning consecutive titles with this system. Adapting philosophy now protects your tactical unpredictability.
                          </span>
                        ) : (
                          <span>
                            System operates smoothly. Consider whether this squad needs a win-now Continental Legend or a Youth Whisperer / Scout to accelerate wonderkid maturation.
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 bg-white/[0.04] p-3 rounded-xl border border-white/[0.08] text-right">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Management Points</div>
                      <div className="text-base font-bold text-amber-300 tabular-nums">{state.skillPoints || 0} MP Available</div>
                      <div className="text-[10px] text-zinc-400">5 MP to adapt system</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 6. PILLAR 5: BOARD EXPECTATIONS & ROADMAP ================= */}
            {activeTab === 'overview' && (
              <div id="section-board" className="space-y-3 scroll-mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-400/90 px-1 flex items-center gap-2">
                  <i className="fas fa-bullseye text-[11px]"></i>
                  Board Vision · Strategic Mandates & Trust
                </div>

                {(seasonData.isSackedRelegation || seasonData.isSacked) ? (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
                    <div className="flex items-center gap-3.5 mb-2">
                      <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg shrink-0">
                        <i className="fas fa-triangle-exclamation"></i>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-rose-400">Board Resolution</div>
                        <div className="text-base sm:text-lg font-bold text-white">Managerial Contract Terminated</div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {isTier1Only
                        ? `Following a bottom-3 finish in ${league.name}, the Board of Directors has immediately dismissed management for sporting failure. Since this country has no lower tier, the club remains in the league, but managerial immunity shields offer no protection against bottom-tier collapse.`
                        : isBottomTier
                        ? `Following drop-zone failure in ${league.name}, the Board of Directors has immediately terminated your contract. With no lower league to absorb the fall, management has been relieved of duties.`
                        : `Following the conclusion of the campaign, the Board of Directors has officially relieved management of sporting duties.`}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/[0.06] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 text-lg shrink-0 shadow-inner">
                        <i className="fas fa-bullseye"></i>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-0.5">
                          Next Season Mandate
                        </div>
                        <div className="text-base sm:text-lg font-bold text-white">
                          Finish Top {state.boardTargetFinish || 15} or better mandated
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Target failure without immunity shields triggers termination review.
                        </div>
                      </div>
                    </div>

                    {/* Impact score progress bar */}
                    <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.05] min-w-[260px]">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-semibold text-zinc-400">Club Impact & Trust</span>
                        <span className="font-bold text-white tabular-nums">{state.clubImpactScore ?? 50}/100</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${
                            (state.clubImpactScore ?? 50) >= 70 ? 'bg-emerald-400' : (state.clubImpactScore ?? 50) >= 40 ? 'bg-sky-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, state.clubImpactScore ?? 50))}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1 font-medium">
                        <span>Immunity Shields: {state.immunityShields ?? 0}</span>
                        <span className={(state.clubImpactScore ?? 50) >= 70 ? 'text-emerald-400' : 'text-sky-300'}>
                          {(state.clubImpactScore ?? 50) >= 70 ? 'Untouchable' : 'Stable'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= 7. PILLAR 6: LIVING UNIVERSE & WORLD FOOTBALL ================= */}
            {activeTab === 'world' && (
              <div id="section-universe" className="space-y-4 scroll-mt-6">
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-2">
                    <i className="fa-solid fa-earth-americas text-[11px]"></i>
                    Global Football Universe & Seasonal Digest
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Season {seasonData.year} Ecosystem Digest
                  </span>
                </div>

                {/* Diverse Rival Challenger Headline in Global Universe */}
                {superVillainClub && rivalChallengerEvent && (
                  <div className="bg-gradient-to-r from-purple-950/40 via-fuchsia-950/30 to-indigo-950/30 border border-fuchsia-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/30 flex items-center justify-center p-2 shrink-0">
                        <ClubLogo name={superVillainClub.name} club={superVillainClub} size={32} />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-fuchsia-400 tracking-wider">
                          BREAKING LEAGUE HEADLINE · {rivalChallengerEvent.badge?.toUpperCase() || 'NEW TITLE CHALLENGER'}
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {rivalChallengerEvent.headline || `${superVillainClub.name} Mounts Challenge Against ${state.club.name}`}
                        </h4>
                        <p className="text-xs text-zinc-300 mt-0.5">
                          {rivalChallengerEvent.desc || `A surging ${rivalChallengerEvent.clubOvr || superVillainClub.baseOvr} OVR domestic contender emerges in ${league.name}.`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-fuchsia-300 bg-fuchsia-500/20 px-3 py-1 rounded-full border border-fuchsia-400/30">
                        {rivalChallengerEvent.clubOvr || superVillainClub.baseOvr} OVR Threat
                      </span>
                    </div>
                  </div>
                )}

                {/* Continental & World Champions Marquee */}
                <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/[0.06] shadow-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <i className="fa-solid fa-trophy text-amber-400 text-xs"></i>
                      World & Continental Silverware
                    </span>
                    <span className="text-[10px] text-zinc-400">Major Continental Kings</span>
                  </div>

                  {continentalChampions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {continentalChampions.map((c) => (
                        <div
                          key={c.id}
                          className="bg-black/30 border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 p-1">
                            <ClubLogo
                              name={c.clubName}
                              id={c.clubId}
                              color={c.clubColor}
                              logo={c.clubLogo}
                              isModActive={isModActive}
                              className="w-8 h-8 object-contain"
                              fallbackClassName="w-8 h-8 rounded-lg text-xs flex items-center justify-center font-bold text-white"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider truncate">
                              {c.fromLeagueName}
                            </div>
                            <div className="text-xs font-bold text-white break-words">{c.clubName}</div>
                            <div className="text-[10px] text-zinc-400 truncate mt-0.5">{c.reason}</div>
                          </div>
                          <div className="text-amber-400 text-sm shrink-0 pr-1">🏆</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 py-3 text-center">
                      Continental tournaments in progress across the globe.
                    </div>
                  )}
                </div>

                {/* Domestic League Champions Grid */}
                <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/[0.06] shadow-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <i className="fa-solid fa-crown text-amber-400 text-xs"></i>
                      Domestic League Champions
                    </span>
                    <span className="text-[10px] text-zinc-400">National League Winners</span>
                  </div>

                  {leagueChampions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {leagueChampions.map((c) => (
                        <div
                          key={c.id}
                          className="bg-black/30 border border-white/[0.06] rounded-2xl p-2.5 flex items-center gap-2.5"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 p-1">
                            <ClubLogo
                              name={c.clubName}
                              id={c.clubId}
                              color={c.clubColor}
                              logo={c.clubLogo}
                              isModActive={isModActive}
                              className="w-7 h-7 object-contain"
                              fallbackClassName="w-7 h-7 rounded-lg text-[10px] flex items-center justify-center font-bold text-white"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-bold text-sky-400 uppercase tracking-wider truncate">
                              {c.fromLeagueName}
                            </div>
                            <div className="text-xs font-bold text-white break-words">{c.clubName}</div>
                          </div>
                          <i className="fa-solid fa-crown text-amber-400 text-xs shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 py-3 text-center">
                      Domestic title battles concluded for this campaign.
                    </div>
                  )}
                </div>

                {/* Fallen Giants Crisis Alert */}
                {fallenGiantsList.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                      <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
                      Fallen Giant Administration Alert
                    </div>
                    <div className="space-y-2">
                      {fallenGiantsList.map((g) => (
                        <div
                          key={g.id}
                          className="bg-black/40 border border-amber-500/20 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 p-1">
                              <ClubLogo
                                name={g.clubName}
                                id={g.clubId}
                                color={g.clubColor}
                                logo={g.clubLogo}
                                isModActive={isModActive}
                                className="w-8 h-8 object-contain"
                                fallbackClassName="w-8 h-8 rounded-lg text-xs flex items-center justify-center font-bold text-white"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white break-words">{g.clubName}</div>
                              <div className="text-xs text-amber-300/90 font-medium">
                                Demoted from {g.fromLeagueName} to {g.toLeagueName}
                              </div>
                              <div className="text-[10px] text-zinc-400">{g.reason}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                              Rebuild Challenge Target
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pyramid Movements: Promotions & Relegations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Promotions */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/[0.06] shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-arrow-trend-up text-xs"></i>
                        Promoted to Higher Tiers
                      </span>
                      <span className="text-[10px] text-zinc-400">{promotionsList.length} Moves</span>
                    </div>
                    {promotionsList.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {promotionsList.map((p) => (
                          <div
                            key={p.id}
                            className="bg-black/30 border border-white/[0.04] rounded-xl p-2.5 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ClubLogo
                                name={p.clubName}
                                id={p.clubId}
                                color={p.clubColor}
                                logo={p.clubLogo}
                                isModActive={isModActive}
                                className="w-6 h-6 object-contain shrink-0"
                                fallbackClassName="w-6 h-6 rounded text-[9px] flex items-center justify-center font-bold text-white shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-white break-words">{p.clubName}</div>
                                <div className="text-[10px] text-emerald-400 truncate">{p.reason}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full shrink-0 ml-2">
                              {p.toLeagueName}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 py-3 text-center">No promotions recorded.</div>
                    )}
                  </div>

                  {/* Relegations */}
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/[0.06] shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-2">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-arrow-trend-down text-xs"></i>
                        Relegated & Demoted
                      </span>
                      <span className="text-[10px] text-zinc-400">{relegationsList.length} Moves</span>
                    </div>
                    {relegationsList.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {relegationsList.map((r) => (
                          <div
                            key={r.id}
                            className="bg-black/30 border border-white/[0.04] rounded-xl p-2.5 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ClubLogo
                                name={r.clubName}
                                id={r.clubId}
                                color={r.clubColor}
                                logo={r.clubLogo}
                                isModActive={isModActive}
                                className="w-6 h-6 object-contain shrink-0"
                                fallbackClassName="w-6 h-6 rounded text-[9px] flex items-center justify-center font-bold text-white shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-white break-words">{r.clubName}</div>
                                <div className="text-[10px] text-rose-400 truncate">{r.reason}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 rounded-full shrink-0 ml-2">
                              {r.toLeagueName}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 py-3 text-center">No relegations recorded.</div>
                    )}
                  </div>
                </div>

                {/* Blockbuster Heavyweight Transfers */}
                {transferSagasList.length > 0 && (
                  <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/[0.06] shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-arrow-right-arrow-left text-sky-400 text-xs"></i>
                        Blockbuster Heavyweight Transfer Sagas
                      </span>
                      <span className="text-[10px] text-zinc-400">Continental Market</span>
                    </div>
                    <div className="space-y-2">
                      {transferSagasList.map((t) => (
                        <div
                          key={t.id}
                          className="bg-black/30 border border-white/[0.05] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-300 font-bold shrink-0">
                              <i className="fa-solid fa-user text-xs"></i>
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate">{t.reason}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-sky-300 bg-sky-500/15 border border-sky-400/30 px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
                            Market Confirmed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="p-4 sm:p-5 pb-safe border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold transition border border-white/[0.08] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial"
              title="Export / Share Season Card"
            >
              <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-share-nodes'} text-sky-400`}></i>
              <span>Share Card</span>
            </button>

            <button
              type="button"
              onClick={() => {
                switchTab('table');
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-semibold transition border flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial ${
                activeTab === 'table'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/30 shadow-sm'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
              }`}
            >
              <i className={`fas ${activeTab === 'table' ? 'fa-table-cells-large text-sky-300' : 'fa-table text-sky-400'}`}></i>
              <span>League Table</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto sm:min-w-[280px] py-3.5 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-semibold text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>Continue to Next Season <span className="hidden sm:inline font-normal text-xs text-sky-100/90">(Press Enter)</span></span>
            <span className="text-xs text-sky-100 tabular-nums sm:hidden">({seasonData.year + 1})</span>
            <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});