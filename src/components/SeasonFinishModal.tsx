import React, { useRef, useState, useEffect } from 'react';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { getTrophyImage } from '../utils/trophyHelpers';
import { motion, AnimatePresence } from 'motion/react';
import { triggerRealisticConfetti } from '../utils/confettiHelper';
import * as htmlToImage from 'html-to-image';
import { GameState, Language, TrophiesObj, getAcademySlotLimit } from '../types';
import { getLeagueInfo, getLeagueScaledVal, getDomesticCupInfo, getDomesticSupercupInfo, getEuropeanSupercupInfo, TOURNAMENT_LOGOS, formatMoney, isReserveClub, getLeagueMaxAttendance, getMaxTier, getCountryFlag, getClubCatchmentCeiling, formatOrganicAttendance, getCountryEconomicProfile, calculateClubFinancials, normalizeCountry } from '../data/gameConstants';
import { getBroadcastingPackage } from '../data/broadcastingPackages';
import { isAnyModActive } from '../utils/modManager';
import { BroadcastLogo } from './BroadcastLogo';
import { ClubLogo } from './ClubLogo';
import { LeagueTableModal } from './LeagueTableModal';
import { CountUp } from './CountUp';
import { t as tr } from '../data/translations';
import { Club } from "../types";
import { ALL_CLUBS } from '../data/clubsData';
import { getOrGenerateRoadmap } from '../utils/roadmapManager';
import { getLeagueSize } from '../engine/engine';
import { useModalDismiss } from '../utils/modalUtils';

interface SeasonFinishModalProps {
  clubsDb: Club[];
  state: GameState;
  onShowTable?: () => void;
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
    sponsorInc?: number;
    extraSponsorInc?: number;
    seasonSponsorDeals?: Record<number, {
      status: 'signed' | 'failed' | 'available';
      brandName: string;
      brandLogo: string;
      payout?: number;
      bonus?: number;
    }>;
    wages: number;
    debtInterest?: number;
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
    preSimOvr?: number;
    rivalryThisSeason?: {
        name: string;
        wins: number;
        draws: number;
        losses: number;
        message: string;
    };
    decayReasons?: string[];
    rosterUpdates?: {
      retirements: number;
      retirementPenalty: number;
      naturalDecay: number;
      dramaticDecay?: number;
      bloatDepartures: number;
      emergencyCallups: number;
      callupPenalty: number;
      loanExpirationPenalty?: number;
    };
    pointsEarned?: number;
    totalSkillPoints?: number;
    moraleDelta?: number;
    endMorale?: number;
    pointsDeducted?: number;
    nextTier?: number;
    clubTier: number;
    finishPos?: number;
    oldTarget?: number;
    tactic?: string;
    consecutiveTitles?: number;
    worldClubs?: Record<string, Club>;
    performanceDealResult?: any;
  };
  lang: Language;
  onClose: () => void;
  onShowProfile?: () => void;
}

export const SeasonFinishModal: React.FC<SeasonFinishModalProps> = React.memo(({
  state,
  clubsDb,
  onShowTable,
  seasonData,
  lang,
  onClose,
  onShowProfile,
}) => {
  useModalDismiss(onClose, true);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentBodyRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'performance' | 'finances' | 'finance' | 'squad' | 'coach' | 'board' | 'universe' | 'table' | 'history'>('summary');
  const [selectedYearForTable, setSelectedYearForTable] = useState<number>(seasonData.year);

  useEffect(() => {
    if (contentBodyRef.current) {
      contentBodyRef.current.scrollTop = 0;
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (seasonData && seasonData.trophiesThisYear && Object.keys(seasonData.trophiesThisYear).length > 0) {
      triggerRealisticConfetti();
    }
  }, [seasonData]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      const fallbackDataUri = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
      const blob = await htmlToImage.toBlob(cardRef.current, {
        quality: 1.0,
        backgroundColor: '#111218',
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
        includeQueryParams: true,
        imagePlaceholder: fallbackDataUri,
        filter: (node: any) => node.tagName !== 'IMG',
      });
      if (!blob) throw new Error('Failed to create blob');
      
      const filename = `season-${seasonData.year}-${seasonData.clubName}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      
      const fallbackDownload = () => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      };

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${seasonData.clubName} Season ${seasonData.year}`,
            files: [file]
          });
        } catch (shareErr) {
          console.warn('Share API failed, falling back to download', shareErr);
          fallbackDownload();
        }
      } else {
        fallbackDownload();
      }
    } catch (err) {
      console.warn('Failed to export image', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const t = (en: string, de?: string, _ignoredEs?: string) => (lang === 'de' ? (de || en) : en);

  const country = state.club.country || 'GER';
  const maxTier = getMaxTier(country);
  const playedTier = seasonData.tier || 1;
  let nextTier = seasonData.nextTier || playedTier;
  if (seasonData.relegated && !seasonData.survived && nextTier <= playedTier && playedTier < maxTier) {
    nextTier = playedTier + 1;
  } else if (seasonData.promoted && nextTier >= playedTier && playedTier > 1) {
    nextTier = playedTier - 1;
  }
  const league = getLeagueInfo(playedTier, country);
  const nextLeague = getLeagueInfo(nextTier, country);
  const isCanadian = country === 'CAN' || ['Vancouver Blue', 'Montréal', 'Toronto', 'CF Montréal', 'Toronto FC', 'Vancouver FC', 'Pacific FC'].includes(state.club.name);
  const natCupCountry = isCanadian ? 'CAN' : country;
  const cupInfo = getDomesticCupInfo(natCupCountry, seasonData.clubTier);
  const t1League = getLeagueInfo(1, country);

  const isModActive = isAnyModActive();
  const domSupercupInfo = getDomesticSupercupInfo(country, isModActive);
  const euroSupercupInfo = getEuropeanSupercupInfo(isModActive);
  const bPackage = getBroadcastingPackage(country, false, { isModActive, clubName: state.club.name });
  const isDe = lang === 'de';

  const isReserve = isReserveClub(seasonData.clubName || state.club.name);

  const getBroadcasterVerdict = () => {
    const maxT = getMaxTier(country);
    const isPromoted = Boolean((seasonData.promoted || (seasonData.pos <= 2 && !(seasonData.tier === 2 && isReserve))) && seasonData.tier > 1 && (!seasonData.nextTier || seasonData.nextTier < seasonData.tier));
    const isRelegated = !seasonData.survived && Boolean((seasonData.nextTier && seasonData.nextTier > seasonData.tier) || (seasonData.relegated && seasonData.tier < maxT));
    const isChamp = seasonData.pos === 1;
    
    const targetPos = seasonData.oldTarget || state.boardTargetFinish || state.boardTargetPos || 15;
    const pos = seasonData.pos;
    const isBottomTierRelegationZone = playedTier >= maxT && (pos >= Math.max(1, (seasonData.numTeams || 18) - 1) || state.isSacked || seasonData.isSacked);

    let text = '';
    if (seasonData.wins === 0) {
      text = `${state.club.name} concludes the campaign without winning a single match. A historic disaster demanding comprehensive overhaul.`;
    } else if (isChamp && seasonData.tier === 1 && (hasCl || hasEl || hasEcl)) {
      const euroCupLabel = hasCl ? getContinentalCupNames(state.club.country || 'GER').cl : hasEl ? getContinentalCupNames(state.club.country || 'GER').el : getContinentalCupNames(state.club.country || 'GER').ecl;
      text = `Unforgettable domestic and continental triumph from ${state.club.name}! Lifting both ${t1League.name} and the ${euroCupLabel} cements an all-time legendary season.`;
    } else if (hasCl || hasEl || hasEcl) {
      const euroCupLabel = hasCl ? getContinentalCupNames(state.club.country || 'GER').cl : hasEl ? getContinentalCupNames(state.club.country || 'GER').el : getContinentalCupNames(state.club.country || 'GER').ecl;
      text = `European glory for ${state.club.name}! Conquering the continent to lift the ${euroCupLabel} makes this campaign an historic triumph.`;
    } else if (isChamp && seasonData.tier === 1) {
      text = `Masterclass from ${state.club.name}! With exceptional tactical discipline and sustained dominance, the club deservedly lifts the championship trophy.`;
    } else if (isPromoted) {
      text = `Promotion confirmed! ${state.club.name} caps off a phenomenal campaign with a triumphant climb to the higher division!`;
    } else if (isRelegated) {
      text = `Painful relegation for ${state.club.name}. Unable to withstand crunch moments, the club now faces a necessary rebuilding cycle.`;
    } else if (isBottomTierRelegationZone) {
      text = `Disastrous finish for ${state.club.name} in the relegation zone. While the club remains in ${league.name} as the lowest tier, the board has summarily dismissed the manager.`;
    } else if (targetPos <= 3 && pos > targetPos + 2) {
      text = `A notable setback for ${state.club.name}. Entering the campaign with championship ambitions, finishing ${pos}th leaves fans and critics asking tough questions.`;
    } else if (pos > targetPos + 3) {
      text = `A testing campaign for ${state.club.name}. Despite bright flashes, the club fell short of their pre-season benchmarks.`;
    } else if (seasonData.tier === 1 && seasonData.pos > 10) {
      text = `Inconsistent stretches throughout the year. ${state.club.name} retains top-flight status, but will need targeted summer recruitment.`;
    } else if (seasonData.gf > 1000) {
      text = `Attacking spectacle! ${state.club.name} delighted viewers all year long with high-tempo transition play and prolific scoring.`;
    } else {
      text = `A composed, highly disciplined campaign from ${state.club.name}. The squad executed their strategic mandate with admirable professionalism.`;
    }

    return {
      network: bPackage.networkName,
      text,
      title: 'Broadcaster Summary'
    };
  };

  const broadcasterVerdict = getBroadcasterVerdict();

  const getPosBadge = (pos: number, tier: number, nextT?: number) => {
    const euroSuffix = hasCl ? ' & CL Winners! ⭐' : hasEl ? ' & EL Winners! 🏆' : hasEcl ? ' & EC Winners! 🏅' : '';
    if (pos === 1) {
      if (tier === 1) {
        return { text: `${t1League.name} Champions${euroSuffix} 🏆`, bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
      }
      if (tier === 2 && isReserve) {
        return { text: `${league.name} Champions! 🏆 (Reserve Limit)`, bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
      }
      return { text: `${league.name} Champions & Promoted! 🏆`, bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    }
    if (pos === 2 && tier > 1) {
      if (tier === 2 && isReserve) {
        return { text: `Runner-Up in ${league.name} (Reserve Limit)`, bg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' };
      }
      if (nextT && nextT < tier) {
        return { text: `Promoted to ${nextLeague.name}! ⬆️`, bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
      }
      return { text: 'Promoted (2nd Place)! ⬆️', bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    }
    if (pos === 3 && tier > 1 && (seasonData.promoted || (nextT && nextT < tier))) {
      return { text: `3rd Place · Promoted to ${nextLeague.name}! ⬆️ (Playoff Winners)`, bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    }
    const maxT = getMaxTier(country);
    if (!seasonData.survived && ((nextT && nextT > tier && tier < maxT) || (seasonData.relegated && tier < maxT && (!nextT || nextT > tier)))) {
      return { text: `Relegated to ${nextLeague.name} ⬇️`, bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
    }
    const currentLeagueSize = getLeagueSize(tier, country, state.club.id, tier, country, clubsDb);
    const isSurvivalZone = pos >= Math.max(1, currentLeagueSize - 2);
    if (tier >= maxT && pos >= Math.max(1, currentLeagueSize - 1)) {
      if (state.isSacked || seasonData.isSacked) {
        return { text: `Relegation Zone — Manager Sacked! ⚠️`, bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
      }
      return { text: `Relegation Zone · No Lower Tier ⚠️`, bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    }
    if (nextT && nextT === tier && (seasonData.survived || isSurvivalZone) && tier < maxT) {
      return { text: `Survival Secured! (Retained Status) 🛡️`, bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    }
    const isEcu = (state.club.country || 'GER') === 'ECU';
    const isUsa = (state.club.country || 'GER') === 'USA';
    if (tier === 1) {
      if (isEcu) {
        if (pos <= 2) return { text: `Finish #${pos} · Americas Elite Cup Spot 🌟`, bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' };
        if (pos <= 5) return { text: `Finish #${pos} · Americas Cup Spot 🌍`, bg: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' };
        if (pos === 6) return { text: `Finish #${pos} · Americas Challenge Cup Spot 🏅`, bg: 'bg-teal-500/10 text-teal-400 border border-teal-500/20' };
      } else if (isUsa) {
        if (pos <= 2) return { text: `Finish #${pos} · North American Elite Cup Spot 🌟`, bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' };
        if (pos <= 5) return { text: `Finish #${pos} · North American Challenge Cup Spot 🌍`, bg: 'bg-orange-500/10 text-orange-400 border border-orange-400/20' };
      } else {
        // European leagues: 1 & 2 -> EHF Champions League; 3, 4, 5 -> EHF European League; 6 -> EHF European Cup (for eligible nations)
        // If the club won CL/EL (or Domestic Cup) to earn a higher continental tier than league position alone, reflect the upgraded berth!
        if (pos === 2) return { text: `Runner-Up · EHF Champions League Spot 🥈`, bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' };
        if (seasonData.euroNextSeason === 'CL' && pos > 2) {
          return { text: `Finish #${pos} (Cup Holders) · EHF Champions League Spot 🌟`, bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' };
        }
        if (pos >= 3 && pos <= 5) return { text: `Finish #${pos} · EHF European League Spot 🌍`, bg: 'bg-orange-500/10 text-orange-400 border border-orange-400/20' };
        if (seasonData.euroNextSeason === 'EL' && pos > 5) {
          const viaCup = (seasonData.trophiesThisYear?.dfb || (seasonData.trophiesThisYear as any)?.cup) ? ' (Cup Winners)' : ' (Cup Holders)';
          return { text: `Finish #${pos}${viaCup} · EHF European League Spot 🌍`, bg: 'bg-orange-500/10 text-orange-400 border border-orange-400/20' };
        }
        if (pos === 6) {
          const excludedCountries = ['HUN', 'GER', 'ESP', 'POR'];
          if (!excludedCountries.includes(state.club.country || 'GER')) {
            return { text: `Finish #6 · EHF European Cup Spot 🏅`, bg: 'bg-teal-500/10 text-teal-400 border border-teal-500/20' };
          }
        }
      }
    }
    if (seasonData.euroNextSeason === 'CL') {
      const cNames = getContinentalCupNames(state.club.country);
      return { text: `Finish #${pos} · ${cNames.cl} Spot 🌟`, bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' };
    }
    if (seasonData.euroNextSeason === 'EL') {
      const cNames = getContinentalCupNames(state.club.country);
      const viaCup = (seasonData.trophiesThisYear?.dfb || (seasonData.trophiesThisYear as any)?.cup) ? ' (Cup Winners)' : '';
      return { text: `Finish #${pos}${viaCup} · ${cNames.el} Spot 🌍`, bg: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' };
    }
    if (seasonData.euroNextSeason === 'ECL') {
      const cNames = getContinentalCupNames(state.club.country);
      return { text: `Finish #${pos} · ${cNames.ecl} Spot 🏅`, bg: 'bg-teal-500/10 text-teal-400 border border-teal-500/20' };
    }
    return { text: `${pos}. Place in ${league.name}`, bg: 'bg-black/40 text-zinc-400 border border-white/[0.04]' };
  };

  const posBadge = getPosBadge(seasonData.pos, seasonData.tier, seasonData.nextTier);

  // Strategic Intelligence Metrics & End-Game Dynamics
  const currentTactic = seasonData.tactic || state.tactic || 'Balanced';
  const hist = state.history || [];
  const lastHist = hist.length > 0 ? hist[hist.length - 1] : null;
  const isCurrentInHist = Boolean(lastHist && (lastHist.year === seasonData.year || (lastHist.year === seasonData.year - 1 && lastHist.pos === seasonData.pos)));

  let consecutiveSeasonsWithTactic = 0;
  for (let i = hist.length - 1; i >= 0; i--) {
    if ((hist[i] as any).tactic === currentTactic) {
      consecutiveSeasonsWithTactic++;
    } else {
      break;
    }
  }

  // Anti-Metronome: Count recent usage across last 4 seasons
  const recentHistUsage = hist.slice(-4).filter((h: any) => h.tactic === currentTactic).length;
  const rawTenure = isCurrentInHist ? Math.max(1, consecutiveSeasonsWithTactic) : consecutiveSeasonsWithTactic + 1;
  const rawRecent = isCurrentInHist ? Math.max(1, recentHistUsage) : recentHistUsage + 1;
  const tacticTenure = Math.max(rawTenure, rawRecent);
  const isTacticStale = tacticTenure >= 2;
  const isCriticallyStale = tacticTenure >= 3;
  const teamOvr = seasonData.newBaseOvr || state.club?.baseOvr || 70;
  const isVeteranCoreAging = teamOvr >= 82;
  const isRebuildActive = (state.rebuildWageDiscountSeasons || 0) > 0;

  const consecutiveTitles = seasonData.consecutiveTitles !== undefined 
    ? seasonData.consecutiveTitles 
    : (state.consecutiveTitles || (seasonData.pos === 1 && seasonData.tier === 1 ? 1 : 0));
  const rawDynastyTax = Math.min(4.0, consecutiveTitles >= 4 ? Math.max(2.5, consecutiveTitles * 0.75) : consecutiveTitles * 0.5);
  const medicalLevel = state.club?.medicalLevel || 1;
  const academyLevel = state.club?.academyLevel || 1;
  const hasInfrastructureImmunity = medicalLevel >= 5 || academyLevel >= 5;
  const hasMoraleImmunity = !hasInfrastructureImmunity && ((state.club.morale ?? 100) > 90 || medicalLevel >= 3);
  const effectiveDynastyTax = hasInfrastructureImmunity ? 0 : (hasMoraleImmunity ? rawDynastyTax / 2 : rawDynastyTax);

  const currentTier = seasonData.tier || 1;
  const currentCountry = normalizeCountry(state.club?.country || 'GER');
  const worldClubsObj = (seasonData.worldClubs || state.worldClubs || {}) as Record<string, any>;
  const activeLeagueRivals: any[] = (Object.values(worldClubsObj) as any[]).filter((c: any) => 
    c && c.id !== state.club?.id && 
    c.name !== seasonData.clubName && 
    c.tier === currentTier && 
    normalizeCountry(c.country || 'GER') === currentCountry && 
    !isReserveClub(c.name)
  );
  activeLeagueRivals.sort((a: any, b: any) => (b.baseOvr || 0) - (a.baseOvr || 0));

  const allMovements = seasonData.universeMovements || state.universeMovements || [];
  const takeoverMovement = (allMovements as any[]).find((m: any) => m && m.type === 'takeover');
  const takeoverClubFromMovement = takeoverMovement ? (worldClubsObj[takeoverMovement.clubId] || Object.values(worldClubsObj).find((c: any) => c.name === takeoverMovement.clubName)) : null;

  const nemesisClub: any = activeLeagueRivals.find((c: any) => Boolean(c.isNemesisActive)) || takeoverClubFromMovement || activeLeagueRivals[0];
  const isNemesisActive = Boolean(nemesisClub?.isNemesisActive || takeoverMovement || (takeoverClubFromMovement && takeoverClubFromMovement.isNemesisActive));
  const heritageRebuildingGiant: any = activeLeagueRivals.find((c: any) => c.id !== nemesisClub?.id && (c.baseOvr || 0) >= 82);

  // Dynamic AI-style sporting season narrative
  const generateSportingSummary = () => {
    const isDe = false;
    let base = "";
    
    const trophies = seasonData.trophiesThisYear || {};
    const isDomesticChamp = trophies.bl || trophies.lower;
    const isIntlChamp = trophies.cl || trophies.el || trophies.ecl;
    const isCupChamp = trophies.dfb || trophies.reg;
    const isWorldChamp = trophies.cwc;
    
    const wonQuadruple = isDomesticChamp && isIntlChamp && isCupChamp && isWorldChamp;
    const wonTreble = isDomesticChamp && isIntlChamp && isCupChamp && !wonQuadruple;
    const wonDouble = (isDomesticChamp && isIntlChamp) || (isDomesticChamp && isCupChamp) || (isIntlChamp && isCupChamp);
    
    const variance = (seasonData.wins * 3 + seasonData.pts) % 3; 
    const leagueSize = Math.max(10, (state.worldClubs ? Object.values(state.worldClubs).filter((c: any) => c.tier === seasonData.tier && normalizeCountry(c.country || "GER") === normalizeCountry(state.club.country || "GER")).length : 18));
    const safeMidTableThreshold = Math.floor(leagueSize * 0.65);
    const topTableThreshold = Math.floor(leagueSize * 0.33);

    if (wonQuadruple) {
      base = isDe 
        ? `Das vollkommene Jahr! Ein historisches Quadruple für ${seasonData.clubName}. Mit dem Gewinn der Liga, des Pokals, der Elite Cup und der Weltmeisterschaft hat das Team alles abgeräumt, was es zu gewinnen gibt. Absolute Legenden.` 
        : `The ultimate glory! A historic quadruple for ${seasonData.clubName}. By winning the League, the Cup, the Continental Title, and the Global Club Cup, this team has won everything possible. Absolute legends.`;
    } else if (wonTreble) {
      base = isDe 
        ? `Unglaublich! Eine historische Saison für ${seasonData.clubName}. Mit dem Gewinn des Triples haben sich Manager und Mannschaft unsterblich gemacht. Ein Jahr, das für immer in den Geschichtsbüchern bleibt.` 
        : `Unbelievable! A historic treble-winning season for ${seasonData.clubName}. The manager and squad have achieved immortality in a campaign that will echo through the ages.`;
    } else if (wonDouble) {
      base = isDe 
        ? `Eine magische Saison! ${seasonData.clubName} holt das Double und krönt eine herausragende Spielzeit. Taktische Meisterleistung gepaart mit absoluter Dominanz auf dem Feld.` 
        : `A magical season! ${seasonData.clubName} secures the double, crowning an outstanding campaign. Tactical brilliance paired with absolute dominance on the court.`;
    } else if (seasonData.pos === 1) {
      if (variance === 0) {
        base = isDe 
          ? `Eine absolute Meisterleistung! ${seasonData.clubName} dominierte die Liga und sicherte sich mit ${seasonData.wins} Siegen verdient die Meisterschaft.` 
          : `An absolute masterclass! ${seasonData.clubName} dominated the league, securing the championship with ${seasonData.wins} wins. The tactical vision was executed flawlessly.`;
      } else if (variance === 1) {
        base = isDe 
          ? `Meister! Nach einem packenden Titelrennen darf ${seasonData.clubName} am Ende die Trophäe in die Höhe stemmen. Ein Triumph des Willens und der klugen Kaderplanung.` 
          : `Champions! After a thrilling title race, ${seasonData.clubName} lifts the trophy. A triumph of sheer will and composed squad management.`;
      } else {
        base = isDe 
          ? `Titel-Feier! Die Fans feiern eine denkwürdige Meistersaison. Das Team bewies absolute Konstanz und krönt sich verdient zur Nummer 1.` 
          : `Title celebration! The fans celebrate a memorable championship season. The squad proved exceptional consistency to claim the top spot.`;
      }
    } else if (seasonData.pos === 2) {
      const lastHist = state.history && state.history.length > 0 ? state.history[state.history.length - 1] : null;
      const finalTable = lastHist?.finalTable;
      const championClub = finalTable && finalTable.length > 0 ? finalTable[0] : null;
      const champName = championClub?.name || lastHist?.rivalName || 'the champions';
      const gap = championClub ? Math.max(0, championClub.pts - seasonData.pts) : (lastHist?.rivalPts ? Math.max(0, lastHist.rivalPts - seasonData.pts) : 99);

      if (gap <= 2) {
        base = isDe
          ? `Herzschlagfinale um die Meisterschaft! Nur ${gap === 0 ? 'durch das Torverhältnis' : `${gap} Punkt${gap > 1 ? 'e' : ''}`} von ${champName} getrennt—ein einziges Unentschieden in einen Sieg verwandelt bringt nächste Saison die Krone.`
          : `Finished just ${gap === 0 ? 'on goal differential' : `${gap} point${gap > 1 ? 's' : ''}`} behind ${champName}—a single draw turned into a win next season claims the crown.`;
      } else if (seasonData.tier > 1) {
        if (seasonData.tier === 2 && isReserve) {
          base = `Outstanding 2nd place finish in ${league.name}! Under federation regulations, reserve squads remain in Tier 2 while developing top talents for the first team.`;
        } else {
          base = isDe
            ? `Sensationell! Als Vizemeister gelingt der Aufstieg. ${seasonData.clubName} hat bewiesen, reif für die nächste Spielklasse zu sein.`
            : `Sensational! Securing promotion as runners-up, ${seasonData.clubName} proved they are ready for the next level. A massive milestone for the club project.`;
        }
      } else {
        base = isDe
          ? `Hervorragende Vizemeisterschaft! ${seasonData.clubName} schließt eine starke Spielzeit auf Rang 2 ab und qualifiziert sich direkt für die Champions League.`
          : `Outstanding runner-up finish! ${seasonData.clubName} concludes a stellar campaign in 2nd place, locking in direct qualification for the Champions League.`;
      }
    } else if (seasonData.pos === 4 && playedTier === 1) {
      const lastHist = state.history && state.history.length > 0 ? state.history[state.history.length - 1] : null;
      const finalTable = lastHist?.finalTable;
      const clSpotClub = finalTable && finalTable.length >= 2 ? finalTable[1] : null;
      const clGap = clSpotClub ? Math.max(0, clSpotClub.pts - seasonData.pts) : 99;

      if (clGap <= 3) {
        base = isDe
          ? `Platz 4 im Oberhaus: Denkbar knapp an der Königsklasse vorbei! Nur ${clGap} Punkt${clGap > 1 ? 'e' : ''} fehlten auf ${clSpotClub?.name || 'Rang 2'}—nächste Saison ist der Champions-League-Angriff Pflicht.`
          : `Finished 4th, agonizingly close to elite European qualification—just ${clGap} point${clGap > 1 ? 's' : ''} shy of ${clSpotClub?.name || '2nd place'} and the Champions League spots.`;
      } else {
        base = isDe
          ? `Starker 4. Platz! ${seasonData.clubName} sichert sich die europäische Qualifikation für die EHF European League.`
          : `Strong 4th place finish! ${seasonData.clubName} secures qualification for the EHF European League.`;
      }
    } else if (!seasonData.survived && ((nextTier > playedTier) || (seasonData.relegated && playedTier < maxTier))) {
      base = `A difficult season comes to a close. Following a challenging year, ${seasonData.clubName} suffers relegation. Regrouping and focused rebuilding are now the immediate priority.`;
    } else if (playedTier >= maxTier && (seasonData.pos >= leagueSize - 1 || state.isSacked || seasonData.isSacked)) {
      base = `A catastrophic campaign in the lowest division. While ${seasonData.clubName} remains in ${league.name} without possibility of further demotion, finishing in the relegation zone has resulted in the board immediately sacking the manager.`;
    } else if (!seasonData.relegated && playedTier < maxTier && (seasonData.survived || (nextTier === playedTier && seasonData.pos >= leagueSize - 3))) {
      base = `A nerve-wracking season with a sigh of relief: survival is secured on Decision Day! ${seasonData.clubName} held nerve in the crunch moments to defend their league status.`;
    } else if (seasonData.pos <= topTableThreshold && seasonData.tier < 4) {
      if (variance === 0) {
        base = isDe 
          ? `Eine sehr starke Saison endet mit einer Spitzenplatzierung. Das Team hat das Potenzial voll ausgeschöpft und blickt optimistisch nach vorn.` 
          : `A very strong campaign ends with a top-tier finish. The squad extracted great value and looks poised to challenge further next year.`;
      } else {
        base = isDe 
          ? `Starke Saison! ${seasonData.clubName} begeisterte die Anhänger mit dynamischem Handball und belohnt sich mit einer hervorragenden Tabellenposition.` 
          : `A brilliant showing! ${seasonData.clubName} thrilled the fans with energetic handball, rewarding themselves with an excellent league position.`;
      }
    } else if (seasonData.pos <= topTableThreshold || seasonData.pos <= safeMidTableThreshold) {
      base = isDe 
        ? `Eine solide, stabile Spielzeit im gesicherten Mittelfeld. Um den nächsten Schritt zu machen, bieten sich im Sommer gezielte Verstärkungen an.` 
        : `A solid and stable mid-table campaign. To take the next step forward, targeted reinforcements this summer will be key.`;
    } else {
      base = isDe 
        ? `Eine nervenaufreibende Saison mit Happy End: Der Klassenerhalt ist unter Dach und Fach. Im Sommer wartet konstruktive Aufbauarbeit.` 
        : `A nerve-wracking season with a sigh of relief: survival is secured. The summer window presents a valuable chance to recalibrate.`;
    }

    const cupRunsThisYear = state.cupRunResults ? state.cupRunResults.filter(r => r.year === seasonData.year) : [];
    const getContCupName = (id: string) => {
        if (id === 'CL') return country === 'USA' ? 'North American Elite Cup' : country === 'ECU' ? 'Americas Elite Cup' : 'EHF Champions League';
        if (id === 'EL') return country === 'USA' ? 'North American Challenge Cup' : country === 'ECU' ? 'Americas Cup' : 'EHF European League';
        if (id === 'ECL') return country === 'USA' ? 'North American Regional Cup' : country === 'ECU' ? 'Americas Youth Cup' : 'EHF European Cup';
        return id;
    };

    const isEuro = !['USA', 'ECU'].includes(state.club.country || 'GER');
    const nightsEn = isEuro ? 'European nights' : 'continental nights';

    const hadContinentalDeepRun = cupRunsThisYear.some(run => ['cl', 'el', 'ecl', 'intl', 'euro_cup'].includes(run.id));
    if (seasonData.euroThisSeason && !isIntlChamp && !hadContinentalDeepRun) {
      base += ` The international journey in the ${getContCupName(seasonData.euroThisSeason)} concluded prior to the championship finals.`;
    }

    const lostFinalRuns = cupRunsThisYear.filter(run => !run.won && run.exitRound === 'Final');
    lostFinalRuns.forEach(run => {
      const compName = isDe ? (run.nameDe || run.nameEn) : (run.nameEn || run.nameDe);
      if (run.winnerName) {
        base += isDe
          ? ` Im Finale des Wettbewerbs (${compName}) musste man sich nach großem Kampf ${run.winnerName} geschlagen geben und wurde Vizemeister.`
          : ` Reached the ${compName} Final, finishing as Runner-Up after a hard-fought showpiece won by ${run.winnerName}.`;
      } else {
        base += isDe
          ? ` Im ${compName} erreichte das Team das große Finale.`
          : ` Reached the ${compName} Final to cap a memorable cup campaign.`;
      }
    });

    const lostSfRuns = cupRunsThisYear.filter(run => !run.won && run.exitRound === 'Semi-Final');
    lostSfRuns.forEach(run => {
      const compName = isDe ? (run.nameDe || run.nameEn) : (run.nameEn || run.nameDe);
      base += isDe
        ? ` Im ${compName} gelang der Vorstoß bis ins Halbfinale${run.winnerName ? ` (Turniersieger: ${run.winnerName})` : ''}.`
        : ` Advanced to the ${compName} Semi-Finals${run.winnerName ? ` (eventual champions: ${run.winnerName})` : ''}.`;
    });
    
    if (seasonData.euroNextSeason) {
      base += ` Next season, the club can look forward to ${nightsEn} in the ${getContCupName(seasonData.euroNextSeason)}!`;
    }
    
    if (seasonData.pointsDeducted && seasonData.pointsDeducted > 0) {
      base += ` The campaign was influenced by financial fair-play point deductions (-${seasonData.pointsDeducted} pts).`;
    }

    return base;
  };

  // Read newly generated trophy data merging both seasonData.trophiesThisYear and latestHistoryEntry.trophiesThisYear
  const latestHistoryEntry = (state.history && state.history.length > 0)
    ? state.history[state.history.length - 1]
    : undefined;
  const currentSeasonTrophies: TrophiesObj = {
    ...(seasonData.trophiesThisYear || {}),
    ...(latestHistoryEntry?.trophiesThisYear || {}),
  } as TrophiesObj;

  const hasBl = (currentSeasonTrophies.bl || 0) > 0;
  const hasDfb = (currentSeasonTrophies.dfb || 0) > 0;
  const hasCl = (currentSeasonTrophies.cl || 0) > 0;
  const hasEl = (currentSeasonTrophies.el || 0) > 0;
  const hasEcl = (currentSeasonTrophies.ecl || 0) > 0;
  const hasCwc = (currentSeasonTrophies.cwc || 0) > 0;

  // Replicate combo logic from SeasonHistoryTable:
  // If bl + dfb + cl + cwc = 🏆 Quadruple
  // If bl + dfb + cl = 🏆 Triple
  // If bl + dfb + el = 🏆 Euro Triple
  // If bl + dfb = 🏆 Domestic Double
  type ComboType = 'quadruple' | 'triple' | 'euro_triple' | 'euro_cl_double' | 'euro_el_double' | 'euro_ecl_double' | 'double';
  let comboType: ComboType | null = null;

  if (hasBl && hasDfb && hasCl && hasCwc) {
    comboType = 'quadruple';
  } else if (hasBl && hasDfb && hasCl) {
    comboType = 'triple';
  } else if (hasBl && hasDfb && hasEl) {
    comboType = 'euro_triple';
  } else if (hasBl && hasCl) {
    comboType = 'euro_cl_double';
  } else if (hasBl && hasEl) {
    comboType = 'euro_el_double';
  } else if (hasBl && hasEcl) {
    comboType = 'euro_ecl_double';
  } else if (hasBl && hasDfb) {
    comboType = 'double';
  }

  const { cl, el, ecl } = getContinentalCupNames(state.club.country || 'GER');

  const comboDefinitions: Record<ComboType, {
    label: string;
    tag: string;
    fullTitle: string;
    description: string;
    color: string;
    borderColor: string;
    badgeStyle: string;
    bannerStyle: string;
  }> = {
    quadruple: {
      label: '🏆 Quadruple',
      tag: 'Quadruple',
      fullTitle: isDe ? 'Historisches Quadruple' : 'Historic Quadruple Champion',
      description: isDe
        ? `${t1League.name}, ${cupInfo.name}, ${cl} und IHF Super Globe in einer Traumsaison gewonnen!`
        : `Lifting ${t1League.name}, ${cupInfo.name}, ${cl}, and the IHF Super Globe in a single legendary sweep.`,
      color: 'text-zinc-200',
      borderColor: 'border-white/[0.08] bg-white/[0.02]',
      badgeStyle: 'text-zinc-300 bg-white/[0.03] border border-white/[0.06]',
      bannerStyle: 'bg-[#10121a]/90 border border-white/[0.06] backdrop-blur-md'
    },
    triple: {
      label: '🏆 Triple',
      tag: 'Triple',
      fullTitle: isDe ? 'Kontinentales Triple' : 'Continental Treble Champion',
      description: isDe
        ? `Meisterschaft (${t1League.name}), Pokalsieg (${cupInfo.name}) und Triumph in der ${cl}!`
        : `Historic treble: ${t1League.name}, ${cupInfo.name}, and the prestigious ${cl}.`,
      color: 'text-zinc-200',
      borderColor: 'border-white/[0.08] bg-white/[0.02]',
      badgeStyle: 'text-zinc-300 bg-white/[0.03] border border-white/[0.06]',
      bannerStyle: 'bg-[#10121a]/90 border border-white/[0.06] backdrop-blur-md'
    },
    euro_triple: {
      label: '🏆 Euro Triple',
      tag: 'Euro Triple',
      fullTitle: isDe ? 'Europäisches Triple' : 'European Treble Winner',
      description: isDe
        ? `${t1League.name}, ${cupInfo.name} und ${el} in einer überragenden Saison.`
        : `Sensational campaign: ${t1League.name}, ${cupInfo.name}, and the ${el}.`,
      color: 'text-zinc-200',
      borderColor: 'border-white/[0.08] bg-white/[0.02]',
      badgeStyle: 'text-zinc-300 bg-white/[0.03] border border-white/[0.06]',
      bannerStyle: 'bg-[#10121a]/90 border border-white/[0.06] backdrop-blur-md'
    },
    euro_cl_double: {
      label: '🏆⭐ European & League Double',
      tag: 'Euro Double',
      fullTitle: isDe ? 'Meisterschaft & Champions-League-Double' : 'League & Champions League Double',
      description: isDe
        ? `Triumph in der ${t1League.name} und Krönung in der ${cl}!`
        : `Crowned champions of both ${t1League.name} and the ${cl}!`,
      color: 'text-amber-200',
      borderColor: 'border-amber-500/20 bg-amber-500/[0.04]',
      badgeStyle: 'text-amber-300 bg-amber-500/10 border border-amber-500/20',
      bannerStyle: 'bg-[#10121a]/90 border border-amber-500/20 backdrop-blur-md'
    },
    euro_el_double: {
      label: '🏆🥇 League & European League Double',
      tag: 'Euro Double',
      fullTitle: isDe ? 'Meisterschaft & European-League-Double' : 'League & European League Double',
      description: isDe
        ? `Meistertitel in der ${t1League.name} und Europapokalsieg in der ${el}!`
        : `Lifting both the ${t1League.name} title and the ${el} trophy!`,
      color: 'text-amber-200',
      borderColor: 'border-amber-500/20 bg-amber-500/[0.04]',
      badgeStyle: 'text-amber-300 bg-amber-500/10 border border-amber-500/20',
      bannerStyle: 'bg-[#10121a]/90 border border-amber-500/20 backdrop-blur-md'
    },
    euro_ecl_double: {
      label: '🏆🏅 League & European Cup Double',
      tag: 'Euro Double',
      fullTitle: isDe ? 'Meisterschaft & Europapokal-Double' : 'League & European Cup Double',
      description: isDe
        ? `Meistertitel in der ${t1League.name} und Triumph im ${ecl}!`
        : `Celebrating both the ${t1League.name} championship and the ${ecl}!`,
      color: 'text-amber-200',
      borderColor: 'border-amber-500/20 bg-amber-500/[0.04]',
      badgeStyle: 'text-amber-300 bg-amber-500/10 border border-amber-500/20',
      bannerStyle: 'bg-[#10121a]/90 border border-amber-500/20 backdrop-blur-md'
    },
    double: {
      label: '🏆 Domestic Double',
      tag: 'Domestic Double',
      fullTitle: isDe ? 'Nationales Double' : 'Domestic Double Champion',
      description: isDe
        ? `Souveräner Triumph in Liga (${t1League.name}) und Pokal (${cupInfo.name}).`
        : `Dominated domestic handball: ${t1League.name} & ${cupInfo.name} Champions.`,
      color: 'text-zinc-200',
      borderColor: 'border-white/[0.08] bg-white/[0.02]',
      badgeStyle: 'text-zinc-300 bg-white/[0.03] border border-white/[0.06]',
      bannerStyle: 'bg-[#10121a]/90 border border-white/[0.06] backdrop-blur-md'
    }
  };

  const activeCombo = comboType ? comboDefinitions[comboType] : null;

  const trophyList: {
    icon?: string;
    logo?: string;
    name: string;
    color: string;
    count: number;
    subtitle?: string;
    isCombo?: boolean;
    borderStyle?: string;
    badgeStyle?: string;
    badgeText?: string;
  }[] = [];

  if (activeCombo) {
    trophyList.push({
      name: activeCombo.label,
      subtitle: activeCombo.description,
      color: activeCombo.color,
      count: 1,
      isCombo: true,
      borderStyle: activeCombo.borderColor,
      badgeStyle: activeCombo.badgeStyle,
      badgeText: activeCombo.tag,
      icon: 'fa-trophy'
    });
  }

  // Always show the League Title and European Trophy cards alongside each other so both are celebrated side-by-side
  if (currentSeasonTrophies.bl) {
    trophyList.push({ logo: t1League.logo, name: t1League.name, color: 'text-amber-300', count: Number(currentSeasonTrophies.bl) || 1 });
  }
  if (currentSeasonTrophies.lower) {
    trophyList.push({ logo: league.logo, name: `${league.name} Champion`, color: 'text-zinc-200', count: Number(currentSeasonTrophies.lower) || 1 });
  }
  if (currentSeasonTrophies.cl) {
    trophyList.push({ logo: getTrophyImage('cl', state.club.country || 'GER'), name: cl, color: 'text-amber-300', count: Number(currentSeasonTrophies.cl) || 1 });
  }
  if (currentSeasonTrophies.el) {
    trophyList.push({ logo: getTrophyImage('el', state.club.country || 'GER'), name: el, color: 'text-amber-300', count: Number(currentSeasonTrophies.el) || 1 });
  }
  if (currentSeasonTrophies.ecl) {
    trophyList.push({ logo: getTrophyImage('ecl', state.club.country || 'GER'), name: ecl, color: 'text-amber-300', count: Number(currentSeasonTrophies.ecl) || 1 });
  }
  if (currentSeasonTrophies.cwc) {
    trophyList.push({ logo: TOURNAMENT_LOGOS.cwc || '', name: 'IHF Super Globe · Club World Championship', color: 'text-amber-300', count: Number(currentSeasonTrophies.cwc) || 1 });
  }
  if (currentSeasonTrophies.dfb) {
    trophyList.push({ logo: cupInfo.logo, name: cupInfo.name, color: 'text-zinc-200', count: Number(currentSeasonTrophies.dfb) || 1 });
  }
  if (currentSeasonTrophies.sc) {
    trophyList.push({ icon: 'fa-trophy', name: domSupercupInfo.name, color: 'text-amber-300', count: Number(currentSeasonTrophies.sc) || 1 });
  }
  if (currentSeasonTrophies.reg) {
    trophyList.push({ icon: 'fa-shield-halved', name: t('Regional Cup', 'Regionalpokal'), color: 'text-zinc-200', count: Number(currentSeasonTrophies.reg) || 1 });
  }

  const totalSilverwareThisCampaign = (hasBl ? 1 : 0) + (hasDfb ? 1 : 0) + (hasCl ? 1 : 0) + (hasEl ? 1 : 0) + (hasEcl ? 1 : 0) + (hasCwc ? 1 : 0) + (currentSeasonTrophies.lower ? 1 : 0) + (currentSeasonTrophies.reg ? 1 : 0) + (currentSeasonTrophies.sc ? 1 : 0);

  // Render combo & individual trophy badges replicating SeasonHistoryTable logic with 2026/2027 broadcast styling
  const renderSeasonTrophyBadges = (trophiesObj?: TrophiesObj) => {
    if (!trophiesObj) return null;
    const badges: React.ReactNode[] = [];

    const tBl = (trophiesObj.bl || 0) > 0;
    const tDfb = (trophiesObj.dfb || 0) > 0;
    const tCl = (trophiesObj.cl || 0) > 0;
    const tEl = (trophiesObj.el || 0) > 0;
    const tEcl = (trophiesObj.ecl || 0) > 0;
    const tCwc = (trophiesObj.cwc || 0) > 0;

    if (tBl && tDfb && tCl && tCwc) {
      badges.push(
        <span key="quadruple" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
          🏆 Quadruple
        </span>
      );
    } else if (tBl && tDfb && tCl) {
      badges.push(
        <span key="triple" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
          🏆 Triple
        </span>
      );
    } else if (tBl && tDfb && tEl) {
      badges.push(
        <span key="euro-triple" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
          🏆 Euro Triple
        </span>
      );
    } else if (tBl && tDfb) {
      badges.push(
        <span key="double" className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
          🏆 Domestic Double
        </span>
      );
    }

    // Celebrate League Title & European Trophies right next to each other
    if (tBl) badges.push(<span key="bl" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0" title="League Champions">🥇 {t1League.tag || 'League'}</span>);
    if (trophiesObj.lower) badges.push(<span key="lower" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0" title="Division Champions">🥇 Champion</span>);
    if (tCl) badges.push(<span key="cl" className="text-[10px] font-medium text-sky-300 bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 rounded shrink-0" title={cl}>⭐ {cl}</span>);
    if (tEl) badges.push(<span key="el" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded shrink-0" title={el}>🏆 {el}</span>);
    if (tEcl) badges.push(<span key="ecl" className="text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded shrink-0" title={ecl}>🏅 {ecl}</span>);
    if (tCwc) badges.push(<span key="cwc" className="text-[10px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/25 px-1.5 py-0.5 rounded shrink-0" title="IHF Super Globe">🌐 Super Globe</span>);
    if (tDfb && !(tBl && tDfb)) badges.push(<span key="dfb" className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded shrink-0" title={cupInfo.name}>🛡️ Cup</span>);
    if (trophiesObj.sc) badges.push(<span key="sc" className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0" title={domSupercupInfo.name}>⚡ Supercup</span>);
    if (trophiesObj.reg) badges.push(<span key="reg" className="text-[10px] font-medium text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded shrink-0" title="Regional Cup">🏆 Reg-Cup</span>);

    if (badges.length === 0) return null;
    return <div className="flex items-center gap-1.5 flex-wrap shrink-0">{badges}</div>;
  };

  const currentHist: any = {
    ...(latestHistoryEntry || seasonData),
    country: state.club.country || 'GER',
    trophiesThisYear: currentSeasonTrophies
  };
  const renderTrophyBadges = renderSeasonTrophyBadges;

  // Verified Handball Points Calculation: seasonData.pts already accounts for any pointsDeducted
  const displayPts = typeof seasonData.pts === 'number' ? seasonData.pts : Math.max(0, ((seasonData.wins * 2) + seasonData.draws) - (seasonData.pointsDeducted || 0));

  // All-time trophies won under this specific club across the entire career
  const clubHistory = (state.history || []).filter(h => h.clubName === seasonData.clubName);
  
  // Track specific lower tier division titles by their authentic league name
  const lowerTitlesByLeagueName: Record<string, number> = {};
  let totalBlTitles = 0;
  let totalCwcTitles = 0;
  let totalClTitles = 0;
  let totalElTitles = 0;
  let totalEclTitles = 0;
  let totalEscTitles = 0;
  let totalDfbTitles = 0;
  let totalScTitles = 0;
  let totalRegTitles = 0;

  const processTrophiesFromSeason = (hTrophies: any, hTier?: number, hPromoted?: boolean, hCountry?: string, hPos?: number) => {
    if (!hTrophies) return;
    const sCountry = hCountry || country;
    if (hTrophies.cwc) totalCwcTitles += (hTrophies.cwc || 1);
    if (hTrophies.cl) totalClTitles += (hTrophies.cl || 1);
    if (hTrophies.el) totalElTitles += (hTrophies.el || 1);
    if (hTrophies.ecl) totalEclTitles += (hTrophies.ecl || 1);
    if (hTrophies.esc) totalEscTitles += (hTrophies.esc || 1);
    if (hTrophies.dfb) totalDfbTitles += (hTrophies.dfb || 1);
    if (hTrophies.sc) totalScTitles += (hTrophies.sc || 1);
    if (hTrophies.reg) totalRegTitles += (hTrophies.reg || 1);

    // League Titles:
    // A season with a promotion or tier > 1 was strictly a lower division campaign
    const isLower = Boolean(hPromoted || (hTier && hTier > 1));
    const isChamp = hPos === undefined || hPos === 1;
    const hasBl = Boolean(hTrophies.bl && !isLower && hTier === 1 && !hPromoted && isChamp);
    const hasLower = Boolean((hTrophies.lower || (isLower && hTrophies.bl) || (hTrophies.bl && hTier && hTier > 1) || (hTrophies.bl && hPromoted)) && isChamp);

    if (hasBl) {
      totalBlTitles += (hTrophies.bl || 1);
    } else if (hasLower) {
      // Lower division championship: resolve authentic league division
      const actualPlayedTier = (hTier && hTier > 1) ? hTier : (isLower ? 2 : 1);
      const leagueInfo = getLeagueInfo(actualPlayedTier, sCountry);
      const titleName = `${leagueInfo.name} Champion`;
      const count = (hTrophies.lower || 0) + (isLower ? (hTrophies.bl || 0) : 0);
      lowerTitlesByLeagueName[titleName] = (lowerTitlesByLeagueName[titleName] || 0) + (count > 0 ? count : 1);
    }
  };

  const dbClub = (clubsDb || ALL_CLUBS).find(c => c.name === seasonData.clubName) || (clubsDb || ALL_CLUBS).find(c => c.id === state.club.id) || ALL_CLUBS.find(c => c.name === seasonData.clubName) || ALL_CLUBS.find(c => c.id === state.club.id);
  const clubStartTier = (state.startClubName === seasonData.clubName && state.startTier)
    ? state.startTier
    : (state.club?.name === seasonData.clubName && state.startTier
      ? state.startTier
      : (dbClub?.tier || (state.club.name === seasonData.clubName ? (state.club.originalStartLeague || (state.club.tier > 1 ? state.club.tier : undefined)) : undefined) || 1));

  // Reconstruct chronological tiers for prior seasons under this club
  const sortedClubHistory = [...clubHistory].sort((a, b) => a.year - b.year);
  let trackedTier = clubStartTier;
  const seasonsWithResolvedTier = sortedClubHistory.map((h) => {
    let resolvedTier = (h.tier && h.tier > 1) ? h.tier : (trackedTier > 1 ? trackedTier : (h.tier || 1));
    const isHistReserve = isReserveClub(h.clubName || seasonData.clubName);
    const isPromoted = Boolean((h.promoted || (h.pos <= 2 && resolvedTier > 1) || (h.nextTier && h.nextTier < resolvedTier)) && !(resolvedTier === 2 && isHistReserve));
    const isRelegated = Boolean(h.relegated || (!(h as any).survived && h.nextTier && h.nextTier > resolvedTier));
    
    // If the season resulted in promotion, the played division could not have been top flight Tier 1
    if (isPromoted && resolvedTier <= 1) {
      resolvedTier = 2;
    }

    // Update trackedTier for next season
    if (isPromoted && resolvedTier > 1) {
      trackedTier = Math.max(1, resolvedTier - 1);
    } else if (isRelegated && resolvedTier < maxTier) {
      trackedTier = Math.min(maxTier, resolvedTier + 1);
    } else {
      trackedTier = resolvedTier;
    }

    return {
      ...h,
      resolvedTier,
      isPromoted
    };
  });

  seasonsWithResolvedTier.forEach(h => {
    if (h.year !== seasonData.year) {
      processTrophiesFromSeason(h.trophiesThisYear, h.resolvedTier, h.isPromoted, h.country, h.pos);
    }
  });

  // Always include this completed season's silverware
  processTrophiesFromSeason(currentSeasonTrophies, seasonData.tier, seasonData.promoted, state.club.country, seasonData.pos);

  const allTimeClubTrophyList: { key: string; name: string; count: number; icon: string; color: string }[] = [];
  if (totalCwcTitles > 0) allTimeClubTrophyList.push({ key: 'cwc', name: 'IHF Super Globe · Club World Championship', count: totalCwcTitles, icon: 'fa-globe', color: 'text-amber-400' });
  if (totalClTitles > 0) allTimeClubTrophyList.push({ key: 'cl', name: cl, count: totalClTitles, icon: 'fa-trophy', color: 'text-amber-300' });
  if (totalElTitles > 0) allTimeClubTrophyList.push({ key: 'el', name: el, count: totalElTitles, icon: 'fa-trophy', color: 'text-orange-400' });
  if (totalEclTitles > 0) allTimeClubTrophyList.push({ key: 'ecl', name: ecl, count: totalEclTitles, icon: 'fa-trophy', color: 'text-emerald-400' });
  if (totalBlTitles > 0) allTimeClubTrophyList.push({ key: 'bl', name: `${t1League.name} Champion`, count: totalBlTitles, icon: 'fa-medal', color: 'text-amber-300' });

  // Add lower division champions broken down by specific division name
  Object.entries(lowerTitlesByLeagueName).forEach(([name, count], idx) => {
    allTimeClubTrophyList.push({
      key: `lower-${idx}`,
      name,
      count,
      icon: 'fa-award',
      color: 'text-sky-300'
    });
  });

  if (totalDfbTitles > 0) allTimeClubTrophyList.push({ key: 'dfb', name: cupInfo.name, count: totalDfbTitles, icon: 'fa-shield-halved', color: 'text-amber-400' });
  if (totalScTitles > 0) allTimeClubTrophyList.push({ key: 'sc', name: domSupercupInfo.name, count: totalScTitles, icon: 'fa-bolt', color: 'text-amber-300' });
  if (totalRegTitles > 0) allTimeClubTrophyList.push({ key: 'reg', name: t('Regional Cup', 'Regionalpokal'), count: totalRegTitles, icon: 'fa-shield-cat', color: 'text-amber-500' });

  const totalClubSilverware = allTimeClubTrophyList.reduce((sum, item) => sum + item.count, 0);

  // Attendance Metrics
  const stadiumCap = (seasonData as any).stadium || state.club.stadium || 2000;
  const catchment = getClubCatchmentCeiling(state.club, state);
  const leagueMaxAtt = getLeagueMaxAttendance(seasonData.tier, isReserveClub(state.club.name), state.club.country || 'GER', state.club.name, stadiumCap, state.club.fanBase, catchment.isMegaClub);
  
  let avgAttendance = (seasonData as any).att || (seasonData as any).avgAttendance;
  if (!avgAttendance) {
    const financials = calculateClubFinancials(state);
    avgAttendance = Math.min(stadiumCap, leagueMaxAtt, financials.expectedAtt || 500);
  }
  avgAttendance = formatOrganicAttendance(avgAttendance, stadiumCap, seasonData.year || 2024);
  const fillPercentage = Math.min(100, Math.round((avgAttendance / stadiumCap) * 100));

  const goalDiff = seasonData.gf - seasonData.ga;
  const ovrDelta = (seasonData.newBaseOvr || state.club.baseOvr) - (seasonData.startOvr || state.club.baseOvr);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.2 }} 
      className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-[9999] bg-black/85 backdrop-blur-xl overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 16, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }} 
        exit={{ scale: 0.95, y: 16, opacity: 0 }} 
        transition={{ type: "spring", damping: 28, stiffness: 350 }} 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl lg:max-w-5xl flex flex-col h-auto max-h-[92vh] my-auto cursor-default transition-all duration-150`}
      >
        <div 
          ref={cardRef} 
          className="bg-[#14151e] text-white rounded-2xl w-full h-auto max-h-[92vh] shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/[0.04] flex flex-col m-0 overflow-hidden relative"
        >
          {/* Top Ambient Highlight */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

          {/* Redesigned Compact Top Header */}
          <div className="relative shrink-0 border-b border-white/[0.04] px-4 py-3 sm:px-6 flex items-center justify-between gap-3 bg-transparent">
            {/* Left side: Club crest, "SEASON WRAP-UP - [YEAR] • [LEAGUE TAG]", Club Name, FINISH #[POS] badge */}
            <div className="flex items-center gap-3 min-w-0">
              <ClubLogo
                name={seasonData.clubName}
                color={seasonData.clubColor || state.club.color}
                logo={seasonData.clubLogo || state.club.logo}
                fallbackLogo={state.club.fallbackLogo}
                className="w-10 h-10 object-contain shrink-0 drop-shadow"
                fallbackClassName="w-10 h-10 text-xs rounded-xl border border-white/10 flex items-center justify-center font-semibold text-white shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 truncate">
                  SEASON WRAP-UP - {seasonData.year} • {league.tag || league.name}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-semibold text-white tracking-tight leading-tight truncate">
                    {seasonData.clubName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-300 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.04] shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${seasonData.pos === 1 ? 'bg-amber-400' : seasonData.pos <= 3 ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                    <span>FINISH #{seasonData.pos}</span>
                  </span>
                  {(hasBl || currentSeasonTrophies.lower) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 shrink-0">
                      🏆 {hasBl ? t1League.name : league.name} Champions
                    </span>
                  )}
                  {hasCl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 shrink-0">
                      ⭐ {cl} Winners
                    </span>
                  )}
                  {hasEl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 shrink-0">
                      🏆 {el} Winners
                    </span>
                  )}
                  {hasEcl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                      🏅 {ecl} Winners
                    </span>
                  )}
                  {hasCwc && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 shrink-0">
                      🌐 Super Globe Winners
                    </span>
                  )}
                  {hasDfb && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-200 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] shrink-0">
                      🛡️ {cupInfo.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Three compact data blocks for PTS, W-D-L, and GD */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 leading-none">PTS</span>
                <span className="text-lg font-semibold text-zinc-200 leading-tight tabular-nums">
                  <CountUp value={displayPts} duration={850} />
                </span>
              </div>
              <div className="h-6 w-[1px] bg-white/[0.06]" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 leading-none">W-D-L</span>
                <div className="text-lg font-semibold leading-tight tabular-nums flex items-center gap-0.5 text-zinc-200">
                  <span>{seasonData.wins}</span>
                  <span className="text-zinc-500 font-normal">-</span>
                  <span>{seasonData.draws}</span>
                  <span className="text-zinc-500 font-normal">-</span>
                  <span>{seasonData.losses}</span>
                </div>
              </div>
              <div className="h-6 w-[1px] bg-white/[0.06]" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 leading-none">GD</span>
                <span className="text-lg font-semibold leading-tight tabular-nums text-zinc-200">
                  {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                </span>
              </div>
            </div>
          </div>

          {/* Pill-based horizontal scroll menu with Ambient Tints */}
          <div className="shrink-0 px-4 py-2 sm:px-6 border-b border-white/[0.04] bg-black/20 flex items-center overflow-x-auto custom-scrollbar gap-2">
            {[
              { id: 'summary', label: 'Exec. Summary', badge: (isTacticStale || consecutiveTitles > 0 || isNemesisActive) ? t('Alerts', 'Meldungen') : null, badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
              { id: 'performance', label: 'Performance' },
              { id: 'finances', label: 'Finances & Arena' },
              { id: 'squad', label: 'Squad' },
              { id: 'coach', label: 'Coach', badge: isCriticallyStale ? t(`Stale: Yr ${tacticTenure}`, `Abnutzung ${tacticTenure}. J.`) : isTacticStale ? t(`Stale: Yr ${tacticTenure}`, `Abnutzung ${tacticTenure}. J.`) : null, badgeColor: isCriticallyStale ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
              { id: 'board', label: 'Board', badge: consecutiveTitles > 0 ? t(`Tax: -${effectiveDynastyTax.toFixed(1)}`, `Steuer: -${effectiveDynastyTax.toFixed(1)}`) : null, badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
              { id: 'universe', label: 'Universe & World', badge: isNemesisActive ? t('Rival Takeover', 'Rivalen-Übernahme') : null, badgeColor: 'bg-purple-500/10 text-purple-200 border-purple-500/20' },
            ].map((tab) => {
              const isActive = activeTab === tab.id || (tab.id === 'finances' && activeTab === 'finance');
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono font-medium rounded border ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scrollable Content Body */}
          <div ref={contentBodyRef} className={`min-h-0 ${activeTab === 'table' ? 'p-2 sm:p-3 overflow-hidden h-[580px]' : 'p-4 sm:p-5 overflow-y-auto custom-scrollbar'} flex flex-col gap-3.5`}>
            <AnimatePresence mode="wait">
              {activeTab === 'summary' ? (
                <motion.div
                  key="summary-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3 sm:gap-4"
                >
                  {/* 🏆 CHAMPIONSHIP & EUROPEAN GLORY HERO BANNER 🏆 */}
                  {(currentHist.pos === 1 || hasCl || hasEl || hasEcl || hasCwc) && (() => {
                    const tty = currentHist.trophiesThisYear || {};
                    const bBl = tty.bl > 0;
                    const bDfb = tty.dfb > 0;
                    const bCl = tty.cl > 0;
                    const bEl = tty.el > 0;
                    const bEcl = tty.ecl > 0;
                    const bCwc = tty.cwc > 0;

                    let bannerTitle = "LEAGUE TITLE GLORY!";
                    let bannerDesc = `Historic triumph! ${currentHist.clubName} lifts the championship trophy after dominating the season with ${currentHist.pts} points!`;
                    let bannerSuperTitle = `${getLeagueInfo(currentHist.tier, currentHist.country).name} CHAMPION`;

                    if (bBl && bDfb && bCl && bCwc) {
                      bannerTitle = "HISTORIC QUADRUPLE!";
                      bannerDesc = `Unprecedented dominance! ${currentHist.clubName} completes the ultimate quadruple, sweeping the League, Cup, ${cl}, and Super Globe!`;
                      bannerSuperTitle = "🏆 🏆 🏆 🏆 QUADRUPLE WINNERS";
                    } else if (bBl && bDfb && bCl) {
                      bannerTitle = "LEGENDARY TRIPLE!";
                      bannerDesc = `A season for the history books! ${currentHist.clubName} conquers Europe and domestic competitions to secure the legendary Triple!`;
                      bannerSuperTitle = `🏆 🏆 ⭐ LEAGUE, CUP & ${cl.toUpperCase()} WINNERS`;
                    } else if (bBl && bDfb && bEl) {
                      bannerTitle = "EURO TRIPLE GLORY!";
                      bannerDesc = `An extraordinary campaign! ${currentHist.clubName} secures the domestic double and captures the ${el} title!`;
                      bannerSuperTitle = `🏆 🏆 🥇 LEAGUE, CUP & ${el.toUpperCase()} WINNERS`;
                    } else if (bBl && bCl) {
                      bannerTitle = "EUROPEAN & LEAGUE DOUBLE!";
                      bannerDesc = `Supreme continental and domestic glory! ${currentHist.clubName} lifts both ${t1League.name} and the prestigious ${cl}!`;
                      bannerSuperTitle = `🏆 ⭐ ${t1League.name.toUpperCase()} & ${cl.toUpperCase()} CHAMPIONS`;
                    } else if (bBl && bEl) {
                      bannerTitle = "EUROPEAN & LEAGUE DOUBLE!";
                      bannerDesc = `A monumental campaign! ${currentHist.clubName} celebrates both the ${t1League.name} title and the ${el} trophy!`;
                      bannerSuperTitle = `🏆 🥇 ${t1League.name.toUpperCase()} & ${el.toUpperCase()} CHAMPIONS`;
                    } else if (bBl && bEcl) {
                      bannerTitle = "EUROPEAN & LEAGUE DOUBLE!";
                      bannerDesc = `Double silverware celebration! ${currentHist.clubName} claims the ${t1League.name} crown alongside the ${ecl}!`;
                      bannerSuperTitle = `🏆 🏅 ${t1League.name.toUpperCase()} & ${ecl.toUpperCase()} CHAMPIONS`;
                    } else if (bBl && bDfb) {
                      bannerTitle = "DOMESTIC DOUBLE WINNERS!";
                      bannerDesc = `Total domestic supremacy! ${currentHist.clubName} secures the prestigious double, lifting both the league championship and the national cup!`;
                      bannerSuperTitle = `🏆 🏆 DOMESTIC DOUBLE WINNERS`;
                    } else if (bCl) {
                      bannerTitle = "CHAMPIONS OF EUROPE!";
                      bannerDesc = `Continental kings! ${currentHist.clubName} conquers Europe's elite to lift the prestigious ${cl} trophy!`;
                      bannerSuperTitle = `⭐ ${cl.toUpperCase()} WINNERS${bDfb ? ' & CUP CHAMPIONS' : ''}`;
                    } else if (bEl) {
                      bannerTitle = "EUROPEAN LEAGUE GLORY!";
                      bannerDesc = `European triumph! ${currentHist.clubName} marches through the continent to lift the ${el} trophy!`;
                      bannerSuperTitle = `🏆 ${el.toUpperCase()} WINNERS${bDfb ? ' & CUP CHAMPIONS' : ''}`;
                    } else if (bEcl) {
                      bannerTitle = "EUROPEAN CUP CHAMPIONS!";
                      bannerDesc = `Continental silverware secured! ${currentHist.clubName} triumphs in the final to lift the ${ecl}!`;
                      bannerSuperTitle = `🏅 ${ecl.toUpperCase()} WINNERS${bDfb ? ' & CUP CHAMPIONS' : ''}`;
                    } else if (bCwc && currentHist.pos !== 1) {
                      bannerTitle = "CLUB WORLD CHAMPIONS!";
                      bannerDesc = `Global supremacy! ${currentHist.clubName} lifts the IHF Super Globe as Club World Champions!`;
                      bannerSuperTitle = "🌐 IHF SUPER GLOBE WINNERS";
                    }

                    return (
                      <div className="bg-[#10121a]/90 border border-white/[0.08] backdrop-blur-md rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        
                        {/* Left Side: Trophy Icon & Text */}
                        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                          {/* Trophy Icon Box */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-2xl shrink-0">
                            {bCl ? '⭐' : '🏆'}
                          </div>

                          {/* Text Content */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-amber-300/90 mb-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                              {bannerSuperTitle}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight uppercase mb-1 truncate">
                              {bannerTitle}
                            </h3>
                            <p className="text-xs sm:text-[13px] text-zinc-400 font-normal leading-relaxed max-w-xl">
                              {bannerDesc}
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Side-by-Side League & European Trophy Pills + Prize Money */}
                        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
                            {currentHist.pos === 1 && (
                              <span className="bg-amber-500/10 border border-amber-500/25 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                🏆 {currentHist.tier === 1 ? t1League.tag || 'LEAGUE' : '1ST PLACE'}
                              </span>
                            )}
                            {bCl && (
                              <span className="bg-sky-500/15 border border-sky-500/30 text-sky-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                ⭐ {cl.toUpperCase()}
                              </span>
                            )}
                            {bEl && (
                              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                🏆 {el.toUpperCase()}
                              </span>
                            )}
                            {bEcl && (
                              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                🏅 {ecl.toUpperCase()}
                              </span>
                            )}
                            {bCwc && (
                              <span className="bg-purple-500/15 border border-purple-500/30 text-purple-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5">
                                🌐 SUPER GLOBE
                              </span>
                            )}
                          </div>
                          {currentHist.pos === 1 && (
                            <span className="text-[11px] text-zinc-300 font-medium tabular-nums">
                              +{formatMoney(getLeagueScaledVal(currentHist.tier, ({ 1: 350000, 2: 120000, 3: 45000, 4: 15000, 5: 5000 } as Record<number, number>)[currentHist.tier] || 5000, currentHist.country || 'GER'))} League Prize
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })()}

                  {/* Media & Broadcaster Verdict Card */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 border-b border-white/[0.04] pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-white/[0.03] border border-white/[0.06] text-zinc-400 flex items-center justify-center shrink-0">
                          <i className="fas fa-satellite-dish text-[9px]" />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 truncate">
                          MEDIA & BROADCASTER VERDICT
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest shrink-0">
                        OFFICIAL WRAP
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/30 rounded-lg px-3 py-2 border border-white/[0.04]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BroadcastLogo packageOrKey={bPackage} size="sm" isModActive={isModActive} className="shrink-0" />
                        <div className="h-4 w-[1px] bg-white/10 shrink-0 hidden sm:block" />
                        <div className="min-w-0 flex flex-col">
                          <span className="font-semibold text-white text-xs truncate">
                            {broadcasterVerdict.network}
                          </span>
                          <span className="text-[10px] text-zinc-400 leading-none">
                            {broadcasterVerdict.title}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shrink-0" />
                        <span className="uppercase tracking-wider">VERIFIED BROADCAST</span>
                      </div>
                    </div>

                    <div className="relative pl-3 border-l-2 border-white/20 py-0.5">
                      <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-normal italic">
                        "{broadcasterVerdict.text}"
                      </p>
                    </div>
                  </div>

                  {/* Season Narrative Executive Summary */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                        <i className="fas fa-file-contract text-zinc-400" />
                        <span>EXECUTIVE CAMPAIGN SUMMARY</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        OFFICIAL CLUB REPORT
                      </span>
                    </div>

                    <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-normal">
                      {generateSportingSummary()}
                    </p>

                    {/* Integrated Sponsor Performance Deal Banner */}
                    {seasonData.performanceDealResult && (
                      <div className="mt-1 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] text-zinc-300">
                            <i className={`fas ${seasonData.performanceDealResult.success ? 'fa-check text-emerald-400' : 'fa-xmark text-rose-400'}`} />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                              {isDe ? 'Kommerzielle Leistungsklausel' : 'Sponsor Performance Deal'}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {seasonData.performanceDealResult.success ? (
                                isDe 
                                  ? `Obere Tabellenhälfte erreicht (Platz ${seasonData.performanceDealResult.pos}). Leistungsprämie ausgezahlt!`
                                  : `Top-Half Finish achieved (Pos ${seasonData.performanceDealResult.pos}). Performance incentive unlocked!`
                              ) : (
                                isDe
                                  ? `Platz ${seasonData.performanceDealResult.pos} verfehlt Zielkorridor (Ziel: Platz ${seasonData.performanceDealResult.target}).`
                                  : `Position ${seasonData.performanceDealResult.pos} missed contractual target (Target: Pos ${seasonData.performanceDealResult.target}).`
                              )}
                            </span>
                          </div>
                        </div>
                        {seasonData.performanceDealResult.success && (
                          <span className="text-xs font-semibold text-zinc-200 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06] shrink-0 font-mono">
                            +{formatMoney(seasonData.performanceDealResult.payout)}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Prestigious Double / Triple / Quadruple Hero Banner */}
                    {activeCombo && (
                      <div className="mt-2 p-3.5 rounded-xl border border-white/[0.06] bg-[#10121a]/90 backdrop-blur-md flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-lg shrink-0">
                            🏆
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                                {activeCombo.fullTitle}
                              </span>
                              <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] text-zinc-300 font-mono">
                                {activeCombo.tag}
                              </span>
                            </div>
                            <span className="text-xs text-zinc-400 mt-0.5 leading-snug">
                              {activeCombo.description}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4 Quick Executive Bento Blocks */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">FINAL FINISH</span>
                      <span className="text-lg font-semibold text-white mt-1">#{seasonData.pos}</span>
                      <span className="text-[11px] text-zinc-400 truncate">{league.name}</span>
                    </div>
                    <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">MATCH RECORD</span>
                      <span className="text-lg font-semibold text-white mt-1 tabular-nums">{seasonData.wins}W-{seasonData.draws}D-{seasonData.losses}L</span>
                      <span className="text-[11px] text-zinc-300 font-medium tabular-nums">{displayPts} Points</span>
                    </div>
                    <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">SILVERWARE</span>
                      {activeCombo ? (
                        <div className="mt-1 flex flex-col min-w-0">
                          <span className="text-sm sm:text-base font-semibold truncate leading-tight text-zinc-200">
                            {activeCombo.label}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-normal">
                            {totalSilverwareThisCampaign} Titles ({totalClubSilverware} all-time)
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="text-lg font-semibold text-zinc-200 mt-1 tabular-nums">{totalSilverwareThisCampaign} Titles</span>
                          <span className="text-[11px] text-zinc-400 font-normal">{totalClubSilverware} all-time</span>
                        </>
                      )}
                    </div>
                    <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">NET TREASURY</span>
                      <span className="text-lg font-semibold text-white mt-1 tabular-nums">
                        {formatMoney(seasonData.endBudget)}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium tabular-nums">
                        {seasonData.netProfit >= 0 ? '+' : ''}{formatMoney(seasonData.netProfit)} net
                      </span>
                    </div>
                  </div>

                  {/* Active Alerts Ribbon */}
                  {(isTacticStale || consecutiveTitles > 0 || isNemesisActive) && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mr-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>{t('Active Alerts:', 'Aktive Warnungen:')}</span>
                      </span>

                      {isTacticStale && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('coach')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                            isCriticallyStale
                              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                          }`}
                          title={t('View details in Coach tab', 'Details im Trainer-Tab ansehen')}
                        >
                          <i className="fas fa-chess-rook text-[10px]" />
                          <span>{t(`Tactic Stale (${isCriticallyStale ? '-1.0' : '-0.5'} OVR)`, `Taktik abgenutzt (${isCriticallyStale ? '-1,0' : '-0,5'} GES)`)}</span>
                          <i className="fas fa-arrow-right text-[9px] opacity-60 ml-0.5" />
                        </button>
                      )}

                      {consecutiveTitles > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('board')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition cursor-pointer active:scale-95"
                          title={t('View details in Board tab', 'Details im Vorstands-Tab ansehen')}
                        >
                          <i className="fas fa-crosshairs text-[10px]" />
                          <span>{t(`Dynasty Tax (-${effectiveDynastyTax.toFixed(1)} OVR)`, `Dynastie-Steuer (-${effectiveDynastyTax.toFixed(1)} GES)`)}</span>
                          <i className="fas fa-arrow-right text-[9px] opacity-60 ml-0.5" />
                        </button>
                      )}

                      {isNemesisActive && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('universe')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/35 transition cursor-pointer active:scale-95 animate-pulse"
                          title={t('View details in Universe tab', 'Details im Universums-Tab ansehen')}
                        >
                          <i className="fas fa-bolt text-[10px]" />
                          <span>{t(`Takeover: ${nemesisClub?.name || 'Rival'}`, `Übernahme: ${nemesisClub?.name || 'Rival'}`)}</span>
                          <i className="fas fa-arrow-right text-[9px] opacity-60 ml-0.5" />
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'performance' ? (
                /* 2-column grid: Left card 'Final Position' and 'Arch Rival Derby'. Right card 'Silverware & Honours' */
                <motion.div
                  key="performance-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
                >
                  {/* Left Card: Final Position & Arch Rival Derby */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          FINAL POSITION & STANDINGS
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-300 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
                          <span className={`w-1.5 h-1.5 rounded-full ${seasonData.pos === 1 ? 'bg-amber-400' : seasonData.pos <= 3 ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                          <span>{posBadge.text}</span>
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-none tabular-nums">
                          #{seasonData.pos}
                        </span>
                        <span className="text-xs text-zinc-400 font-normal">in {league.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/[0.04] text-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">POINTS</span>
                          <span className="text-sm font-medium text-zinc-200 tabular-nums">{displayPts} pts</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">RECORD</span>
                          <span className="text-sm font-medium text-zinc-200 tabular-nums">{seasonData.wins}W-{seasonData.draws}D-{seasonData.losses}L</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">GOAL DIFF</span>
                          <span className="text-sm font-medium tabular-nums text-zinc-200">
                            {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                        <span>Target Benchmark:</span>
                        <span className="font-medium text-zinc-300">Top #{seasonData.oldTarget || 15} Finish</span>
                      </div>
                    </div>

                    {/* Arch Rival Derby Sub-Card */}
                    <div className="pt-3 border-t border-white/[0.04] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                          <i className="fas fa-hand-fist text-zinc-400 text-[10px]" />
                          ARCH RIVAL DERBY
                        </span>
                        {seasonData.rivalryThisSeason && (
                          <span className="text-[10px] font-medium text-zinc-300">
                            {seasonData.rivalryThisSeason.name}
                          </span>
                        )}
                      </div>

                      {seasonData.rivalryThisSeason ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs bg-black/30 rounded-lg p-2 border border-white/[0.04]">
                            <span className="text-zinc-400 text-[11px]">This Season:</span>
                            <span className="font-medium text-zinc-200">
                              <span>{seasonData.rivalryThisSeason.wins}W</span>
                              <span className="text-zinc-500 mx-1">·</span>
                              <span>{seasonData.rivalryThisSeason.draws}D</span>
                              <span className="text-zinc-500 mx-1">·</span>
                              <span>{seasonData.rivalryThisSeason.losses}L</span>
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 italic leading-relaxed">
                            "{seasonData.rivalryThisSeason.message}"
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs bg-black/30 rounded-lg p-2 border border-white/[0.04]">
                          <span className="text-zinc-400 text-[11px]">All-Time Rivalry H2H:</span>
                          <span className="font-medium text-zinc-200">
                            <span>{state.rivalH2HWins || 0}W</span>
                            <span className="text-zinc-500 mx-1">·</span>
                            <span>{state.rivalH2HDraws || 0}D</span>
                            <span className="text-zinc-500 mx-1">·</span>
                            <span>{state.rivalH2HLosses || 0}L</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Card: Silverware & Honours */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between gap-3.5">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          SILVERWARE & HONOURS
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-300">
                          {activeCombo ? `${activeCombo.tag} · ` : ''}{totalSilverwareThisCampaign} This Campaign
                        </span>
                      </div>

                      {trophyList.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {trophyList.map((trItem, idx) => (
                            <div 
                              key={`perf-trophy-${trItem.name}-${idx}`} 
                              className="rounded-lg px-3 py-2.5 flex items-center justify-between border bg-white/[0.02] border-white/[0.04]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {trItem.isCombo ? (
                                  <span className="text-base shrink-0">🏆</span>
                                ) : trItem.logo ? (
                                  <img src={trItem.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
                                ) : (
                                  <i className={`fas ${trItem.icon || 'fa-trophy'} text-zinc-400 text-xs`} />
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-medium truncate text-zinc-200">
                                    {trItem.name}
                                  </span>
                                  {trItem.subtitle && (
                                    <span className="text-[10px] text-zinc-500 truncate">
                                      {trItem.subtitle}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] font-medium shrink-0 text-zinc-300">
                                {trItem.isCombo ? trItem.badgeText : `${trItem.count || 1}x Winner`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-black/20 rounded-lg border border-white/[0.04] text-center">
                          <span className="text-xs text-zinc-500">No silverware captured this campaign.</span>
                        </div>
                      )}

                      {(() => {
                        const nonWinningCupRuns = (state.cupRunResults || []).filter(
                          r => r.year === seasonData.year && !r.won
                        );
                        if (nonWinningCupRuns.length === 0) return null;
                        return (
                          <div className="flex flex-col gap-1.5 pt-1">
                            {nonWinningCupRuns.map((run, rIdx) => {
                              const isFinalist = run.exitRound === 'Final';
                              const displayCompName = run.id === 'nat_cup'
                                ? cupInfo.name
                                : (isDe ? (run.nameDe || run.nameEn) : (run.nameEn || run.nameDe));
                              return (
                                <div
                                  key={`cup-run-summary-${run.id}-${rIdx}`}
                                  className="rounded-lg px-3 py-2 flex items-center justify-between gap-2 border bg-white/[0.02] border-white/[0.04]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs shrink-0">{isFinalist ? '🥈' : '🏟️'}</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-medium text-zinc-200 truncate">
                                        {displayCompName}
                                      </span>
                                      {run.winnerName && (
                                        <span className="text-[10px] text-zinc-400 truncate">
                                          {isFinalist ? `Final won by ${run.winnerName}` : `Champions: ${run.winnerName}`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${
                                    isFinalist
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                      : 'bg-white/[0.03] text-zinc-400 border-white/[0.06]'
                                  }`}>
                                    {isFinalist ? 'Runner-Up' : run.exitRound}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* All-Time Cabinet */}
                    <div className="pt-3 border-t border-white/[0.04] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          ALL-TIME CLUB CABINET
                        </span>
                        <span className="text-[10px] font-medium text-zinc-300">
                          {totalClubSilverware} Total Honours
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {allTimeClubTrophyList.slice(0, 6).map((item) => (
                          <div key={`perf-alltime-${item.key}`} className="bg-white/[0.02] border border-white/[0.04] rounded-lg px-2 py-1 flex items-center justify-between text-[11px]">
                            <span className="text-zinc-300 truncate pr-1">{item.name}</span>
                            <span className="font-medium text-zinc-300 shrink-0">x{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (activeTab === 'finances' || activeTab === 'finance') ? (
                /* 3-column grid for 'Financial Audit', 'Stadium & Attendance', and 'Club Infrastructure' */
                <motion.div
                  key="finances-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
                >
                  {/* Card 1: Financial Audit */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          FINANCIAL AUDIT
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                          {seasonData.netProfit >= 0 ? '+' : ''}{formatMoney(seasonData.netProfit)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-2xl font-semibold tracking-tight tabular-nums text-white">
                          {formatMoney(seasonData.endBudget)}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 block mb-3">Closing Treasury</span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Total Revenue:</span>
                        <span className="text-zinc-200 font-medium">+{formatMoney(seasonData.revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Commercial & Pitched Sponsors:</span>
                        <span className="text-sky-300 font-medium">+{formatMoney((seasonData.sponsorInc ?? currentHist.sponsorInc ?? 0) + (seasonData.extraSponsorInc ?? currentHist.extraSponsorInc ?? 0))}</span>
                      </div>
                      {(() => {
                        const sDeals: any = seasonData.seasonSponsorDeals || currentHist.seasonSponsorDeals || state.seasonSponsorDeals;
                        if (!sDeals) return null;
                        const items = [
                          { k: 'Std', d: sDeals[0] || sDeals.standard },
                          { k: 'Mega', d: sDeals[1] || sDeals.mega },
                          { k: 'Perf', d: sDeals[2] || sDeals.perf }
                        ].filter(x => x.d);
                        if (items.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1 py-0.5">
                            {items.map(item => {
                              const bName = item.d?.brandName || item.d?.brand || 'Partner';
                              return (
                                <span
                                  key={item.k}
                                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                                    item.d?.status === 'signed'
                                      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                                      : item.d?.status === 'failed'
                                      ? 'text-zinc-500 bg-white/[0.02] border-white/[0.06]'
                                      : 'text-amber-300/90 bg-amber-500/10 border-amber-500/20'
                                  }`}
                                >
                                  {item.k}: {item.d?.status === 'failed' ? 'Empty' : bName} ({item.d?.status === 'signed' ? 'Signed' : item.d?.status === 'failed' ? 'Empty' : 'Unpitched'})
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Payroll & Operations:</span>
                        <span className="text-zinc-400 font-medium">-{formatMoney(Math.max(0, seasonData.wages - (seasonData.debtInterest || 0)))}</span>
                      </div>
                      {(seasonData.debtInterest || 0) > 0 && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Debt Interest:</span>
                          <span className="text-zinc-400 font-medium">-{formatMoney(seasonData.debtInterest || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Stadium & Attendance */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          STADIUM & ATTENDANCE
                        </span>
                        <span className="text-xs font-medium text-zinc-300">{fillPercentage}% Full</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-2xl font-semibold text-white tracking-tight tabular-nums">
                          {avgAttendance.toLocaleString()}
                        </span>
                        <span className="text-xs text-zinc-400">/ {stadiumCap.toLocaleString()}</span>
                      </div>
                      <span className="text-xs text-zinc-400 block mb-2">Avg Attendance Per Match</span>

                      <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden mb-3">
                        <div className={`h-full ${fillPercentage > 90 ? 'bg-emerald-500' : fillPercentage > 70 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${fillPercentage}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Est. Gate Revenue:</span>
                        <span className="text-zinc-200 font-medium">
                          +{formatMoney(
                            (seasonData as any).matchdayIncome ??
                              Math.floor(avgAttendance * (getCountryEconomicProfile(state.club.country || 'GER').baseTicketYield[seasonData.tier] || 3) * 17)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Club Fanbase:</span>
                        <span className="text-zinc-200 font-medium">{(state.club.fanBase || 1000).toLocaleString()} fans</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Club Infrastructure */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          CLUB INFRASTRUCTURE
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex items-center gap-1">
                            <i className="fas fa-graduation-cap text-[9px] text-zinc-400" />
                            <span>Lvl {state.club.academyLevel ?? state.club.youthAcademy ?? 1}/5</span>
                          </span>
                          <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex items-center gap-1">
                            <i className="fas fa-kit-medical text-[9px] text-zinc-400" />
                            <span>Lvl {state.club.medicalLevel ?? 1}/5</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-base font-semibold text-white tracking-tight mb-1">
                        Youth Academy & Medical
                      </div>
                      <span className="text-xs text-zinc-400 block mb-3">Facility Levels & Development</span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <i className="fas fa-graduation-cap text-zinc-400 text-[10px]" />
                          <span>Academy Level:</span>
                        </span>
                        <span className="text-zinc-200 font-medium">Lvl {state.club.academyLevel ?? state.club.youthAcademy ?? 1}/5</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <i className="fas fa-kit-medical text-zinc-400 text-[10px]" />
                          <span>Medical Level:</span>
                        </span>
                        <span className="text-zinc-200 font-medium">Lvl {state.club.medicalLevel ?? 1}/5</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Academy Slots:</span>
                        <span className="text-zinc-200 font-medium">{getAcademySlotLimit(state.club.academyLevel ?? state.club.youthAcademy ?? 1)} Max Prospects</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Training Quality:</span>
                        <span className="text-zinc-200 font-medium">Level {state.club.trainingFacilities || 1}/5</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'squad' ? (
                /* 2-column grid for 'First-Team Progression' and 'Youth Pipeline & Graduates' */
                <motion.div
                  key="squad-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
                >
                  {/* Left Card: First-Team Progression */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          FIRST-TEAM PROGRESSION
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md tabular-nums bg-white/[0.03] border border-white/[0.06] text-zinc-300">
                          {ovrDelta >= 0 ? '+' : ''}{ovrDelta} OVR
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-none tabular-nums">
                          {seasonData.startOvr || state.club.baseOvr} → {seasonData.newBaseOvr || state.club.baseOvr}
                        </span>
                        <span className="text-xs text-zinc-400 font-normal">Team OVR</span>
                      </div>
                      <span className="text-xs text-zinc-400 block mb-3">Season Rating Evolution</span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Transfer Windows:</span>
                        <span className="text-zinc-200 font-medium">
                          {((seasonData.preSimOvr || state.club.baseOvr) - (seasonData.startOvr || state.club.baseOvr)) >= 0 ? '+' : ''}{((seasonData.preSimOvr || state.club.baseOvr) - (seasonData.startOvr || state.club.baseOvr))} OVR
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Youth Promotions:</span>
                        <span className="text-zinc-200 font-medium">+{seasonData.graduatedYouths?.length || 0} Players</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Retirements:</span>
                        <span className="text-zinc-400 font-medium">-{seasonData.rosterUpdates?.retirementPenalty || 0} OVR ({seasonData.rosterUpdates?.retirements || 0} retired)</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Natural Aging:</span>
                        <span className="text-zinc-400 font-medium">-{seasonData.rosterUpdates?.naturalDecay || 0} OVR</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Card: Youth Pipeline & Graduates */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          YOUTH PIPELINE & GRADUATES
                        </span>
                        <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
                          {state.youthPipeline?.length || 0} In Academy
                        </span>
                      </div>
                      <div className="text-base font-semibold text-white tracking-tight mb-2">
                        Promoted Graduates This Year
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto max-h-[160px] custom-scrollbar my-1">
                      {seasonData.graduatedYouths && seasonData.graduatedYouths.length > 0 ? (
                        seasonData.graduatedYouths.map((grad, gIdx) => (
                          <div key={`grad-${gIdx}`} className="bg-white/[0.02] border border-white/[0.04] rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                            <span className="font-medium text-zinc-200 truncate">{grad}</span>
                            <span className="text-[10px] font-medium text-zinc-300 shrink-0">Promoted</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-black/20 rounded-lg text-center text-xs text-zinc-400">
                          No youth graduates promoted to the first-team this season.
                        </div>
                      )}

                      {seasonData.departedYouths && seasonData.departedYouths.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/[0.06]">
                          <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <i className="fas fa-handshake-angle text-[9px]" />
                            <span>Signed by Top-Flight Rival (Compensated)</span>
                          </div>
                          {seasonData.departedYouths.map((dep, dIdx) => (
                            <div key={`dep-${dIdx}`} className="bg-white/[0.02] border border-white/[0.04] rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px] mb-1">
                              <span className="text-zinc-200 truncate">{dep}</span>
                              <span className="text-[10px] font-medium text-zinc-400 shrink-0">Compensated</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-zinc-400 border-t border-white/[0.04] pt-2 flex items-center justify-between">
                      <span>Academy Capacity:</span>
                      <span className="text-zinc-200 font-medium">{getAcademySlotLimit(state.club.academyLevel ?? state.club.youthAcademy ?? 1)} slots total</span>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'coach' ? (
                /* Coach Tab */
                <motion.div
                  key="coach-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
                >
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          HEAD COACH & TACTICS
                        </span>
                        <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
                          +{state.currentCoach?.ovrBoost || 0} OVR Boost
                        </span>
                      </div>
                      <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-1 truncate">
                        {state.currentCoach?.name || state.managerName || 'Head Coach'}
                      </div>
                      <span className="text-xs text-zinc-400 block mb-3">
                        {state.currentCoach?.archetype || state.headCoachArchetype || state.currentCoach?.style || state.philosophy || 'Tactical Architect'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Tactical System:</span>
                        <span className="text-zinc-200 font-medium">{state.tactic || 'Balanced 6-0'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">{t('System Staleness:', 'System-Abnutzung:')}</span>
                        <span className="font-medium text-zinc-300">
                          {isCriticallyStale 
                            ? t(`Critically Stale (Yr ${tacticTenure}, -1.0 OVR Drag)`, `Kritisch abgenutzt (${tacticTenure}. J., -1,0 GES Abzug)`)
                            : isTacticStale 
                            ? t(`Becoming Stale (Yr ${tacticTenure}, -0.5 OVR Drag)`, `Wird abgenutzt (${tacticTenure}. J., -0,5 GES Abzug)`)
                            : t(`Fresh System (Yr 1 · No Drag)`, `Frisches System (1. J. · Kein Abzug)`)}
                        </span>
                      </div>
                      {/* Visual tenure tracker */}
                      <div className="grid grid-cols-3 gap-1.5 my-1">
                        <div className={`p-1 rounded text-center text-[9px] font-mono border ${
                          tacticTenure === 1 ? 'bg-white/[0.06] border-white/[0.1] text-zinc-200 font-medium' : 'bg-black/30 border-white/[0.04] text-zinc-500'
                        }`}>
                          Yr 1: Fresh
                        </div>
                        <div className={`p-1 rounded text-center text-[9px] font-mono border ${
                          tacticTenure === 2 ? 'bg-white/[0.06] border-white/[0.1] text-zinc-200 font-medium' : 'bg-black/30 border-white/[0.04] text-zinc-500'
                        }`}>
                          Yr 2: -0.5 Drag
                        </div>
                        <div className={`p-1 rounded text-center text-[9px] font-mono border ${
                          tacticTenure >= 3 ? 'bg-white/[0.06] border-white/[0.1] text-zinc-200 font-medium' : 'bg-black/30 border-white/[0.04] text-zinc-500'
                        }`}>
                          Yr 3+: -1.0 Drag
                        </div>
                      </div>
                      {isTacticStale && (
                        <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.06] text-[10px] text-zinc-400">
                          {t('💡 Action: Evolve your philosophy in the Tactics & Rebuild hub to clear tactical drag.', '💡 Aktion: Philosophie im Taktik-Hub wechseln, um Abzug zu löschen.')}
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Contract Years:</span>
                        <span className="text-zinc-200 font-medium">{state.currentCoach?.contractYears || 1} Year(s)</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Annual Wage:</span>
                        <span className="text-zinc-200 font-medium">{formatMoney(state.currentCoach?.wage || 85000)}/yr</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 block mb-2">
                        CAMPAIGN PERFORMANCE METRICS
                      </span>
                      <div className="text-xl sm:text-2xl font-semibold text-zinc-200 tracking-tight mb-1 tabular-nums">
                        {Math.round((seasonData.wins / Math.max(1, seasonData.wins + seasonData.draws + seasonData.losses)) * 100)}% Win Rate
                      </div>
                      <span className="text-xs text-zinc-400 block mb-3">Competitive Result Efficiency</span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Matches Supervised:</span>
                        <span className="text-zinc-200 font-medium">{seasonData.wins + seasonData.draws + seasonData.losses} Matches</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Goals Scored:</span>
                        <span className="text-zinc-200 font-medium">{seasonData.gf} Goals</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Goals Conceded:</span>
                        <span className="text-zinc-400 font-medium">{seasonData.ga} Goals</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'board' ? (
                /* Board Tab: 'Next Season Mandate' alongside progress bar for 'Club Impact & Trust' and 'Immunity Shields' */
                <motion.div
                  key="board-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
                >
                  {/* Left Card: Next Season Mandate */}
                  {(() => {
                    const clubWithBudget = { ...state.club, currentBudget: state.budget ?? state.club.currentBudget ?? 0 };
                    const roadmap = getOrGenerateRoadmap(state.boardRoadmap, clubWithBudget, seasonData.year, state.history);
                    const metCount = roadmap.goals.filter(g => g.completed).length;
                    return (
                      <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                              NEXT SEASON MANDATE
                            </span>
                            <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
                              {roadmap.horizonYears} Year Roadmap
                            </span>
                          </div>
                          <div className="text-base sm:text-lg font-semibold text-white tracking-tight mb-1 truncate">
                            {roadmap.titleEn}
                          </div>
                          <span className="text-xs text-zinc-400 block mb-3">
                            Mandate: Target finish in division & strategic benchmarks
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-400">Roadmap Goals Met:</span>
                            <span className="text-zinc-200 font-medium">{metCount} of {roadmap.goals.length} Goals</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-400">Manager Skill Points:</span>
                            <span className="text-zinc-200 font-medium">+{seasonData.pointsEarned || 0} SP Earned</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Right Card: Club Impact & Trust & Immunity Shields */}
                  <div className="bg-[#10121a]/90 border border-white/[0.04] hover:border-white/[0.08] backdrop-blur-md rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                          CLUB IMPACT & TRUST
                        </span>
                        <span className="text-xs font-medium text-zinc-200">
                          {state.clubImpactScore || 75}/100
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden mb-3">
                        <div 
                          className="h-full bg-zinc-300" 
                          style={{ width: `${Math.min(100, state.clubImpactScore || 75)}%` }} 
                        />
                      </div>
                      <span className="text-xs text-zinc-400 block mb-3">Board & Fanbase Confidence Index</span>
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-zinc-300 border-t border-white/[0.04] pt-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <i className="fas fa-shield-halved text-zinc-400 text-xs" />
                          Immunity Shields:
                        </span>
                        <span className="font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded text-[10px]">
                          {state.immunityShields || 0} Available
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Managerial Tenure:</span>
                        <span className="text-zinc-200 font-medium">{state.tenureYears || 1} Seasons at Club</span>
                      </div>

                      {/* Visual 3-Level Pressure Gauge in Club Impact */}
                      <div className="flex flex-col gap-1 border-t border-white/[0.04] pt-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                            <i className="fas fa-crosshairs text-zinc-400 text-xs" />
                            <span>{t('Dynasty Pressure Level:', 'Dynastie-Druckstufe:')}</span>
                          </span>
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] text-zinc-300">
                            {consecutiveTitles > 1 
                              ? t(`Dynasty (${consecutiveTitles} Titles)`, `Dynastie (${consecutiveTitles} Titel)`) 
                              : consecutiveTitles === 1 
                              ? t('Champion (1 Title)', 'Titelverteidiger (1 Titel)') 
                              : t('Challenger (No Tax)', 'Herausforderer (Keine Steuer)')}
                          </span>
                        </div>

                        {/* Visual 3-level pressure track */}
                        <div className="grid grid-cols-3 gap-1.5 my-1">
                          <div className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center ${
                            consecutiveTitles === 0 ? 'bg-white/[0.06] border-white/[0.1] text-zinc-200 font-medium' : 'bg-black/30 border-white/[0.04] text-zinc-500'
                          }`}>
                            <span className="text-[9px] font-mono leading-none">CHALLENGER</span>
                            <span className="text-[10px] mt-0.5">No Tax (0.0)</span>
                          </div>
                          <div className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center ${
                            consecutiveTitles === 1 ? 'bg-white/[0.06] border-white/[0.1] text-zinc-200 font-medium' : 'bg-black/30 border-white/[0.04] text-zinc-500'
                          }`}>
                            <span className="text-[9px] font-mono leading-none">CHAMPION</span>
                            <span className="text-[10px] mt-0.5">1 Crown (-{(hasInfrastructureImmunity ? 0 : hasMoraleImmunity ? 0.25 : 0.5).toFixed(1)})</span>
                          </div>
                          <div className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center ${
                            consecutiveTitles > 1 ? 'bg-white/[0.06] border-white/[0.1] text-zinc-200 font-medium' : 'bg-black/30 border-white/[0.04] text-zinc-500'
                          }`}>
                            <span className="text-[9px] font-mono leading-none">DYNASTY</span>
                            <span className="text-[10px] mt-0.5">{consecutiveTitles} Titles (-{effectiveDynastyTax.toFixed(1)})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">{t('Dynasty Target on Back:', 'Zielscheiben-Steuer:')}</span>
                        <span className="font-medium text-zinc-300">
                          {consecutiveTitles > 0 ? `-${effectiveDynastyTax.toFixed(1)} OVR Tax (${consecutiveTitles} Titles)` : t('None (Challenger)', 'Keine (Herausforderer)')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">{t('Facility Dynasty Shield:', 'Infrastruktur-Schild:')}</span>
                        <span className="font-medium text-zinc-300">
                          {hasInfrastructureImmunity
                            ? t('Active (100% Tax Immunity)', 'Aktiv (100% Steuer-Immunität)')
                            : hasMoraleImmunity
                            ? t('Partial Shield (50% Tax Reduction)', 'Teil-Schild (50% Steuer-Reduktion)')
                            : t('Inactive (Lvl 3 Med / Lvl 5 req.)', 'Inaktiv (Stufe 3 Med / Stufe 5 erf.)')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">{t('Opponent Motivation:', 'Gegner-Motivation:')}</span>
                        <span className="font-medium text-zinc-300">
                          {consecutiveTitles > 0 ? t('Peak (+100% Focus vs Champion)', 'Maximal (+100% Fokus)') : t('Standard', 'Normal')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">{t('Boardroom Scrutiny:', 'Vorstandsdruck:')}</span>
                        <span className="font-medium text-zinc-300">
                          {consecutiveTitles > 0 ? t('Zero tolerance for dropped points', 'Keine Toleranz für Ausrutscher') : (state.tenureYears || 1) >= 4 ? t('Silverware expectation elevated', 'Hohe Titelerwartung') : t('Standard confidence', 'Stabiles Vertrauen')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'universe' || activeTab === 'history' ? (
                /* Universe & World Tab (incorporating Career Chronicle history) */
                <motion.div
                  key="universe-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3 sm:gap-4"
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                      <i className="fas fa-earth-americas text-zinc-400" />
                      CAREER CHRONICLE & UNIVERSE HISTORY
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {(state.history || []).length} Recorded Seasons
                    </span>
                  </div>

                  {isNemesisActive && nemesisClub && (
                    <div className="bg-[#10121a]/90 border border-white/[0.06] backdrop-blur-md rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-300 flex items-center justify-center shrink-0">
                          <i className="fas fa-money-bill-trend-up text-xs" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                            <span>{t('🚨 GLOBAL UNIVERSE HEADLINE: Hostile Rival Takeover', '🚨 GLOBALE SCHLAGZEILE: Feindliche Rivalen-Übernahme')}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {t(
                              `${nemesisClub.name} acquired by private commercial backers (+3 to +5 OVR surge, now ${nemesisClub.baseOvr} OVR).`,
                              `${nemesisClub.name} von Investoren übernommen (+3 bis +5 GES Wettrüsten, nun ${nemesisClub.baseOvr} GES).`
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-zinc-300 border border-white/[0.06] shrink-0 font-medium">
                        {nemesisClub.baseOvr} OVR
                      </span>
                    </div>
                  )}

                  {(() => {
                    const seasonMovements = (
                      latestHistoryEntry?.universeMovements ||
                      seasonData.universeMovements ||
                      state.universeMovements ||
                      []
                    ).filter((m: any) => m.year === seasonData.year && m.type === 'intl_cup');
                    if (seasonMovements.length === 0) return null;
                    return (
                      <div className="bg-[#10121a]/90 border border-white/[0.06] backdrop-blur-md rounded-xl p-3.5 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                            <i className="fas fa-trophy text-amber-400 text-[10px]" />
                            SEASON {seasonData.year} CUP & CONTINENTAL CHAMPIONS
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            Official Roll of Honour
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {seasonMovements.map((m: any) => {
                            const isUserWinner = m.clubName === state.club.name || String(m.clubId) === String(state.club.id);
                            const mId = String(m.id || '').toLowerCase();
                            const mTitle = String(m.cupTitle || '').toLowerCase();
                            const isCwcMov = mId.endsWith('-cup-cwc') || mTitle.includes('super globe');
                            const isRegMov = mId.endsWith('-cup-reg') || mTitle.includes('regional') || mTitle.includes('amateur');
                            const isEuroMov = mId.endsWith('-cup-cl') || mId.endsWith('-cup-el') || mId.endsWith('-cup-ecl') || mTitle.includes('champions league') || mTitle.includes('european league') || mTitle.includes('european cup') || mTitle.includes('americas') || mTitle.includes('north american');
                            const matchedRun = (state.cupRunResults || []).find((cr: any) => {
                              if (cr.year !== seasonData.year || !cr.winnerName) return false;
                              if (cr.winnerName.trim().toLowerCase() !== (m.clubName || '').trim().toLowerCase()) return false;
                              if (isCwcMov) return cr.id === 'cwc';
                              if (isRegMov) return cr.id === 'reg_cup';
                              if (isEuroMov) return cr.id === 'euro_cup' || cr.id === 'cl' || cr.id === 'el' || cr.id === 'ecl';
                              return cr.id === 'nat_cup';
                            });
                            const userWasRunnerUp = Boolean(matchedRun && !matchedRun.won && matchedRun.exitRound === 'Final');
                            const runnerUpDisplay = userWasRunnerUp ? state.club.name : matchedRun?.runnerUpName;
                            return (
                              <div
                                key={`sf-cup-winner-${m.id}`}
                                className={`rounded-lg px-3 py-2 border flex items-center justify-between gap-2 ${
                                  isUserWinner
                                    ? 'bg-sky-500/[0.06] border-sky-500/20'
                                    : userWasRunnerUp
                                    ? 'bg-amber-500/[0.05] border-amber-500/20'
                                    : 'bg-white/[0.02] border-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs shrink-0">{getCountryFlag(m.country || 'GER')}</span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-white truncate">
                                      {m.clubName}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 truncate">
                                      {m.cupTitle}
                                      {runnerUpDisplay ? ` · def. ${runnerUpDisplay} in Final` : ''}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                                  isUserWinner
                                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                }`}>
                                  {isUserWinner ? 'Your Club' : 'Champion'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    const allSeasonMovs = (
                      latestHistoryEntry?.universeMovements ||
                      seasonData.universeMovements ||
                      state.universeMovements ||
                      []
                    ).filter((m: any) => m.year === seasonData.year && m.type !== 'intl_cup' && m.type !== 'takeover');

                    const notableMovs = allSeasonMovs.filter((m: any) =>
                      (m.type === 'champion' && (m.fromTier === 1 || m.country === normalizeCountry(state.club.country || 'GER'))) ||
                      m.isCinderella ||
                      m.type === 'insolvency_relegation' ||
                      (m.type === 'promotion' && m.toTier === 1 && m.country === normalizeCountry(state.club.country || 'GER')) ||
                      (m.type === 'relegation' && m.fromTier === 1 && m.country === normalizeCountry(state.club.country || 'GER'))
                    ).slice(0, 10);

                    if (notableMovs.length === 0) return null;

                    return (
                      <div className="bg-[#10121a]/90 border border-white/[0.06] backdrop-blur-md rounded-xl p-3.5 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                            <i className="fas fa-newspaper text-sky-400 text-[10px]" />
                            SEASON {seasonData.year} LEAGUE CHAMPIONS & WORLD HEADLINES
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            Across Europe
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {notableMovs.map((m: any) => {
                            const isUserClub = m.clubName === state.club.name || String(m.clubId) === String(state.club.id);
                            const isChamp = m.type === 'champion';
                            const isInsolvency = m.type === 'insolvency_relegation';
                            const isPromo = m.type === 'promotion';
                            const leagueName = getLeagueInfo(m.fromTier || 1, m.country || 'GER').name;
                            const targetLeagueName = getLeagueInfo(m.toTier || 1, m.country || 'GER').name;

                            let subtitle = leagueName;
                            let badgeLabel = 'Champion';
                            let badgeClass = 'bg-amber-500/10 text-amber-300 border-amber-500/20';

                            if (isChamp) {
                              subtitle = `${leagueName} Champions`;
                              badgeLabel = isUserClub ? 'Your Club' : 'Title Winner';
                              badgeClass = isUserClub
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                            } else if (isInsolvency) {
                              subtitle = `Licensing withdrawal · Demoted to ${targetLeagueName}`;
                              badgeLabel = 'Insolvency';
                              badgeClass = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
                            } else if (isPromo) {
                              subtitle = m.isCinderella
                                ? `Cinderella surge · Promoted to ${targetLeagueName}`
                                : `Promoted to ${targetLeagueName}`;
                              badgeLabel = m.isCinderella ? 'Cinderella' : 'Promoted';
                              badgeClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
                            } else {
                              subtitle = `Relegated to ${targetLeagueName}`;
                              badgeLabel = 'Relegated';
                              badgeClass = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
                            }

                            return (
                              <div
                                key={`sf-world-mov-${m.id}`}
                                className="rounded-lg px-3 py-2 border bg-white/[0.02] border-white/[0.04] flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs shrink-0">{getCountryFlag(m.country || 'GER')}</span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-white truncate">
                                      {m.clubName}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 truncate">
                                      {subtitle}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                                  {badgeLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col gap-2">
                    {[...(state.history || [])].reverse().map((h, hIdx) => {
                      const isCurrentReview = h.year === seasonData.year;
                      const gd = (h.gf || 0) - (h.ga || 0);
                      const isChamp = h.pos === 1;
                      const hasCups = Boolean(
                        h.trophiesThisYear?.cl || h.trophiesThisYear?.el || 
                        h.trophiesThisYear?.ecl || h.trophiesThisYear?.cwc || 
                        h.trophiesThisYear?.dfb || h.trophiesThisYear?.reg
                      );

                      return (
                        <div
                          key={`hist-chronicle-${h.year}-${hIdx}`}
                          className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isCurrentReview
                              ? 'bg-white/[0.04] border-white/[0.08]'
                              : 'bg-[#10121a]/90 border-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex flex-col items-center justify-center w-12 py-1 px-2 rounded-lg bg-black/40 border border-white/10 shrink-0">
                              <span className="text-[8px] text-zinc-400 font-mono uppercase">Season</span>
                              <span className="text-xs font-semibold text-white tabular-nums">{h.year}</span>
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-[13px] font-semibold text-white tracking-tight truncate">
                                  {h.clubName}
                                </span>
                                {isCurrentReview && (
                                  <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-300 border border-white/[0.08] text-[9px] font-medium uppercase">
                                    Current
                                  </span>
                                )}
                                {renderSeasonTrophyBadges(h.trophiesThisYear)}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 flex-wrap">
                                <span>{getCountryFlag(h.country || state.club.country)} Tier {h.tier}</span>
                                <span>·</span>
                                <span className={`font-medium ${isChamp ? 'text-amber-300' : 'text-zinc-300'}`}>
                                  {isChamp ? '🏆 1st' : `${h.pos}.`}
                                </span>
                                <span>·</span>
                                <span className="font-mono text-zinc-300">{h.wins}W-{h.draws}D-{h.losses}L</span>
                                <span>·</span>
                                <span className="font-mono text-zinc-300">{h.pts} pts</span>
                                {gd !== 0 && (
                                  <span className="font-mono text-zinc-400">
                                    ({gd > 0 ? `+${gd}` : gd})
                                  </span>
                                )}
                                {hasCups && (
                                  <span className="text-zinc-400" title="Captured Silverware">
                                    <i className="fas fa-trophy text-[10px]" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedYearForTable(h.year);
                              setActiveTab('table');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border border-white/10 text-xs font-semibold shrink-0 cursor-pointer transition flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <i className="fas fa-table-list text-[10px]" />
                            <span>View Table</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : activeTab === 'table' ? (
                /* Final Standings Table View */
                <motion.div
                  key="table-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 h-full min-h-[460px] rounded-xl overflow-hidden border border-white/[0.05] bg-black/40 relative flex flex-col"
                >
                  <div className="absolute inset-0 w-full h-full overflow-hidden flex flex-col">
                    <LeagueTableModal 
                      state={state} 
                      targetTier={(state.history || []).find(h => h.year === selectedYearForTable)?.tier || seasonData.tier} 
                      targetYear={selectedYearForTable}
                      clubsDb={clubsDb} 
                      lang={lang} 
                      onClose={() => {}} 
                      embedded={true} 
                    />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Next Campaign Horizon Banner (The "Just One More Season" Hook) */}
          {(() => {
            const isPromoted = nextTier < playedTier;
            const isRelegated = nextTier > playedTier || Boolean(seasonData.relegated && !seasonData.survived && playedTier < maxTier);
            const targetLeague = getLeagueInfo(nextTier, state.club?.country || 'GER');
            
            let hookIcon = 'fa-calendar-star';
            let hookTitle = `${seasonData.year + 1} Outlook`;
            let hookMsg = '';
            let hookBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

            if (seasonData.euroNextSeason === 'CL') {
              hookIcon = 'fa-star';
              hookTitle = 'European Nights';
              hookMsg = "⭐ EHF Champions League Qualified — clash with Europe's giants in the group stage!";
              hookBadgeColor = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
            } else if (seasonData.euroNextSeason === 'EL') {
              hookIcon = 'fa-globe';
              hookTitle = 'European Nights';
              hookMsg = '⭐ EHF European League Qualified — European nights await under arena floodlights!';
              hookBadgeColor = 'text-sky-300 bg-sky-500/15 border-sky-500/30';
            } else if (seasonData.euroNextSeason === 'ECL') {
              hookIcon = 'fa-trophy';
              hookTitle = 'European Nights';
              hookMsg = '⭐ EHF European Cup Qualified — European silverware contention unlocked for next season!';
              hookBadgeColor = 'text-teal-300 bg-teal-500/15 border-teal-500/30';
            } else if (isPromoted) {
              hookIcon = 'fa-rocket';
              hookTitle = 'Promotion Secured';
              hookMsg = `🚀 Promoted to ${targetLeague?.name || 'Higher Division'}! Higher division status, bigger arenas & richer TV distribution await.`;
              hookBadgeColor = 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
            } else if (isRelegated) {
              hookIcon = 'fa-shield-halved';
              hookTitle = 'Rebuild Mandate';
              hookMsg = `Bounce-back mission in ${targetLeague?.name || 'Lower Division'} — rally the squad to reclaim division status.`;
              hookBadgeColor = 'text-rose-300 bg-rose-500/15 border-rose-500/30';
            } else if (seasonData.pos === 1) {
              hookIcon = 'fa-crown';
              hookTitle = 'Title Defense';
              hookMsg = '👑 Reigning Champions — defend the crown and build an era-defining dynasty.';
              hookBadgeColor = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
            } else if (seasonData.rivalryThisSeason && seasonData.rivalryThisSeason.losses > seasonData.rivalryThisSeason.wins) {
              hookIcon = 'fa-hand-fist';
              hookTitle = 'Derby Vengeance';
              hookMsg = `⚔️ Settle the score with arch-rival ${seasonData.rivalryThisSeason.name} next season.`;
              hookBadgeColor = 'text-orange-300 bg-orange-500/15 border-orange-500/30';
            } else {
              hookIcon = 'fa-bullseye';
              hookTitle = `${seasonData.year + 1} Campaign Mandate`;
              hookMsg = `Summer restructuring & boardroom push for Top-${Math.max(1, seasonData.pos - 2)} benchmark.`;
              hookBadgeColor = 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30';
            }

            return (
              <div className="shrink-0 px-3.5 sm:px-5 py-2.5 bg-[#0e0f16] border-t border-white/[0.05] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${hookBadgeColor}`}>
                    <i className={`fas ${hookIcon} text-[9px]`} />
                    <span>{hookTitle}</span>
                  </div>
                  <span className="text-zinc-300 text-[11px] sm:text-xs font-normal truncate">
                    {hookMsg}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider shrink-0 hidden md:inline">
                  {seasonData.year + 1} SZN
                </span>
              </div>
            );
          })()}

          {/* Action Footer */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-white/[0.06] bg-[#0c0d12] flex items-center gap-2.5 sm:gap-3">
            <button 
              onClick={handleDownload} 
              disabled={isDownloading} 
              className="h-10 px-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white rounded-xl transition-colors border border-white/[0.08] flex items-center justify-center gap-2 text-xs font-semibold shrink-0 disabled:opacity-50 cursor-pointer active:scale-95 shadow-sm" 
              title="Share season summary card"
              aria-label="Share season summary"
            >
              <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-arrow-up-from-bracket'} text-xs`} />
              <span>Share Card</span>
            </button>

            <button
              onClick={() => {
                if (activeTab === 'table') {
                  setActiveTab('summary');
                } else {
                  setSelectedYearForTable(seasonData.year);
                  setActiveTab('table');
                }
              }}
              className={`h-10 px-3.5 rounded-xl transition-colors border flex items-center justify-center gap-2 text-xs font-semibold shrink-0 cursor-pointer active:scale-95 shadow-sm ${
                activeTab === 'table'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
              }`}
              title="View League Standings Table"
            >
              <i className="fas fa-table-list text-xs text-sky-400" />
              <span>League Table</span>
            </button>

            {onShowProfile && (
              <button
                onClick={onShowProfile}
                title="Head Coach Profile & Leaderboard"
                className="h-10 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 flex items-center justify-center gap-2 text-xs font-bold shrink-0 cursor-pointer transition active:scale-95 shadow-sm hidden md:flex"
              >
                <i className="fas fa-trophy text-amber-400 text-xs" />
                <span>Profile & Score</span>
              </button>
            )}

            <button 
              aria-label="Advance to Next Season" 
              onClick={onClose} 
              className="group flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold h-10 px-4 sm:px-5 rounded-xl transition-all duration-200 active:scale-[0.99] shadow-[0_4px_18px_rgba(37,99,235,0.35)] border border-blue-400/30 cursor-pointer flex items-center justify-between min-w-0 ml-auto"
            >
              <div className="flex items-center gap-2 truncate mr-2">
                <span className="text-xs sm:text-[13px] font-bold tracking-tight text-white leading-tight truncate">
                  Kick Off {seasonData.year + 1} Campaign →
                </span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5 shrink-0">
                <i className="fas fa-arrow-right text-[10px]" />
              </div>
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
});