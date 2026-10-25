import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { GameState, Language, UniverseMovement } from '../types';
import {
  calculateClubReputation,
  getClubHistoricContext,
  getClubHomeArena,
  getLeagueInfo,
  getDomesticCupInfo,
  getCountryFlag,
  COUNTRIES,
  getLeagueMaxAttendance,
  isReserveClub,
  formatOrganicAttendance,
  getClubStartingAttendance,
} from '../data/gameConstants';
import { ClubLogo } from './ClubLogo';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { normalizeHex, getFriendlyColorName } from '../data/clubs';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs } from '../utils/modManager';
import { useModalDismiss } from '../utils/modalUtils';

interface ClubProfileModalProps {
  state: GameState;
  lang?: Language;
  onClose: () => void;
  onOpenAcademy?: () => void;
  onOpenMedical?: () => void;
  initialTab?: 'overview' | 'reputation' | 'attendance' | 'history' | 'trophies';
}

type TabType = 'overview' | 'reputation' | 'attendance' | 'history' | 'trophies';

export const ClubProfileModal: React.FC<ClubProfileModalProps> = ({
  state,
  onClose,
  onOpenAcademy,
  onOpenMedical,
  initialTab = 'overview',
}) => {
  useModalDismiss(onClose);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [historyScope, setHistoryScope] = useState<'club' | 'career'>('club');
  const [trophyScope, setTrophyScope] = useState<'club' | 'career'>('club');

  const club = state.club;
  const countryCode = club.country || 'GER';
  const countryData = COUNTRIES[countryCode];
  const countryName = countryData?.name || countryCode;
  const countryFlag = getCountryFlag(countryCode);
  const league = getLeagueInfo(club.tier, countryCode);
  const homeArena = getClubHomeArena(club);

  // Match in registry for authentic color data if club.color or color2 needs enhancement
  const activeClubs = getActiveClubs(countryCode);
  const dbMatch =
    activeClubs.find(c => c.id === club.id || (c.name && c.name.toLowerCase() === club.name.toLowerCase())) ||
    ALL_CLUBS.find(c => c.id === club.id || c.name.toLowerCase() === club.name.toLowerCase());
  const rawColor1 = club.color || dbMatch?.color || '3b82f6';
  const cleanHex1 = rawColor1.toLowerCase().replace('#', '');
  const rawColor2 = club.color2 || dbMatch?.color2 || (cleanHex1 === 'a50044' ? '004d98' : cleanHex1 === '004d98' ? 'a50044' : cleanHex1 === 'ffffff' ? '000000' : 'ffffff');

  // Normalized Club Colors & Descriptive Names
  const primaryColor = normalizeHex(rawColor1, '3b82f6');
  const secondaryColor = normalizeHex(rawColor2, 'ffffff');
  const primaryHex = primaryColor.toUpperCase();
  const secondaryHex = secondaryColor.toUpperCase();
  const primaryName = getFriendlyColorName(primaryColor);
  const secondaryName = getFriendlyColorName(secondaryColor);

  // Reputation (0-100)
  const clubRep = Math.min(100, Math.max(1, calculateClubReputation(club.baseOvr, club.tier)));

  const getReputationDetails = (rep: number) => {
    if (rep >= 90) {
      return {
        label: 'Global Superpower',
        badge: 'from-amber-400 to-yellow-500 text-black',
        color: 'text-amber-400',
        desc: 'Worldwide commercial reach, international prestige, and the capability to recruit world-class superstars.',
      };
    }
    if (rep >= 80) {
      return {
        label: 'Elite Club',
        badge: 'from-sky-400 to-blue-600 text-white',
        color: 'text-sky-400',
        desc: 'Permanent fixture among continental heavyweights with title ambitions and premier recruitment leverage.',
      };
    }
    if (rep >= 70) {
      return {
        label: 'Continental Contender',
        badge: 'from-indigo-400 to-purple-600 text-white',
        color: 'text-indigo-400',
        desc: 'Respected continental contender with high attractiveness for experienced top-tier players.',
      };
    }
    if (rep >= 60) {
      return {
        label: 'National Heavyweight',
        badge: 'from-emerald-400 to-teal-600 text-white',
        color: 'text-emerald-400',
        desc: 'A dominant force in domestic competitions consistently challenging for silverware and European spots.',
      };
    }
    if (rep >= 50) {
      return {
        label: 'Established Pro Club',
        badge: 'from-zinc-300 to-zinc-500 text-black',
        color: 'text-zinc-300',
        desc: 'Solid professional foundation with dependable league status, reliable sponsors, and a loyal fanbase.',
      };
    }
    if (rep >= 40) {
      return {
        label: 'Solid Competitor',
        badge: 'from-zinc-400 to-zinc-600 text-white',
        color: 'text-zinc-400',
        desc: 'A determined league competitor working hard to consolidate status and build long-term stability.',
      };
    }
    if (rep >= 30) {
      return {
        label: 'Regional Force',
        badge: 'from-orange-400 to-amber-600 text-white',
        color: 'text-orange-400',
        desc: 'Deeply anchored in the local region with strong community backing and passionate matchday support.',
      };
    }
    if (rep >= 20) {
      return {
        label: 'Local Contender',
        badge: 'from-rose-400 to-rose-600 text-white',
        color: 'text-rose-400',
        desc: 'A beloved community club building momentum toward professional benchmarks.',
      };
    }
    return {
      label: 'Grassroots / Semi-Pro',
      badge: 'from-zinc-600 to-zinc-800 text-zinc-300',
      color: 'text-zinc-400',
      desc: 'Authentic grassroots foundation working on early identity and organizational growth.',
    };
  };

  const repDetails = getReputationDetails(clubRep);

  // Context & Dossier (Strictly English)
  const historicContext = getClubHistoricContext(club.name, club.tier, false, countryCode, club);

  // Facilities rating: maps each facility level (1-5) directly to its 5-star rating and status
  const getFacilitiesRating = (level: number) => {
    const lvl = Math.min(5, Math.max(1, level > 5 ? Math.round(level / 20) : level));
    if (lvl >= 5) return { stars: '★★★★★', label: 'State of the Art', level: 5 };
    if (lvl === 4) return { stars: '★★★★☆', label: 'Excellent', level: 4 };
    if (lvl === 3) return { stars: '★★★☆☆', label: 'Good', level: 3 };
    if (lvl === 2) return { stars: '★★☆☆☆', label: 'Adequate', level: 2 };
    return { stars: '★☆☆☆☆', label: 'Basic', level: 1 };
  };

  const academyLvl = club.academyLevel || 1;
  const medicalLvl = club.medicalLevel || 1;
  const academy = getFacilitiesRating(academyLvl);
  const medical = getFacilitiesRating(medicalLvl);

  // Attendance metrics
  const baseClubMatch =
    activeClubs.find(c => c.id === club.id || (c.name && c.name.toLowerCase() === club.name.toLowerCase())) ||
    ALL_CLUBS.find(c => c.id === club.id || (c.name && c.name.toLowerCase() === club.name.toLowerCase()));
  const stadiumCap = Math.max(club.stadium || 0, baseClubMatch?.stadium || 0, 2000);
  const fanBase = club.fanBase || 1000;
  const isReserve = isReserveClub(club.name);
  const leagueMaxAtt = getLeagueMaxAttendance(club.tier, isReserve, countryCode, club.name, stadiumCap, fanBase, true);

  // League History for this club and full career
  const allHistory = useMemo(() => state.history || [], [state.history]);
  const currentClubHistory = useMemo(() => {
    return allHistory.filter((h) => h.clubName === club.name);
  }, [allHistory, club.name]);

  const hasCareerHistory = allHistory.some((h) => h.clubName !== club.name);
  const targetHistory = historyScope === 'career' ? allHistory : currentClubHistory;

  const latestSeason = currentClubHistory.length > 0 ? currentClubHistory[currentClubHistory.length - 1] : null;
  const isCurrentSeasonHistory = latestSeason && latestSeason.year === state.year;
  let latestAtt = isCurrentSeasonHistory ? latestSeason?.att : undefined;
  if (latestAtt && stadiumCap >= 15000 && fanBase >= 60000 && (latestAtt === 7500 || latestAtt === 14000 || latestAtt <= 8000)) {
    const demand = Math.round(fanBase * 0.16 * 1.15);
    latestAtt = Math.min(stadiumCap, Math.max(Math.round(stadiumCap * 0.90), demand));
  }
  let currentAtt = latestAtt || getClubStartingAttendance({ ...club, stadium: stadiumCap });
  currentAtt = formatOrganicAttendance(currentAtt, stadiumCap, state.year);
  const currentUtil = Math.min(100, Math.round((currentAtt / stadiumCap) * 100));

  // Trophies calculation for current club
  // Trophies calculation for current club
  const clubTrophies = useMemo(() => {
    // Gather all recorded universe movements across global state and individual season histories
    const allRecordedMovements: UniverseMovement[] = [];
    const seenMovementIds = new Set<string>();

    const addMovementIfNew = (m: UniverseMovement) => {
      if (!m) return;
      const key = m.id || `${m.year}-${m.clubId || m.clubName}-${m.type}-${m.cupTitle || ''}`;
      if (!seenMovementIds.has(key)) {
        seenMovementIds.add(key);
        allRecordedMovements.push(m);
      }
    };

    (state.universeMovements || []).forEach(addMovementIfNew);
    (state.history || []).forEach(h => {
      (h.universeMovements || []).forEach(addMovementIfNew);
    });

    const isCurrentClubMovement = (m: UniverseMovement) => {
      if (!m) return false;
      const nameMatch = Boolean(
        m.clubName && club?.name &&
        m.clubName.trim().toLowerCase() === club.name.trim().toLowerCase()
      );
      const idMatch = Boolean(
        club?.id !== undefined && m.clubId !== undefined &&
        (String(m.clubId) === String(club.id) || Number(m.clubId) === Number(club.id))
      );
      return nameMatch || idMatch;
    };

    const universeCups = allRecordedMovements.filter(
      m => isCurrentClubMovement(m) && m.type === 'intl_cup'
    );

    let extraDfb = 0;
    let extraReg = 0;
    let extraCl = 0;
    let extraEl = 0;
    let extraEcl = 0;
    let extraCwc = 0;

    const countedCupYears = {
      cwc: new Set<number>(),
      cl: new Set<number>(),
      el: new Set<number>(),
      ecl: new Set<number>(),
      dfb: new Set<number>(),
      reg: new Set<number>(),
    };

    currentClubHistory.forEach(h => {
      if (h.trophiesThisYear?.cwc) countedCupYears.cwc.add(h.year);
      if (h.trophiesThisYear?.cl) countedCupYears.cl.add(h.year);
      if (h.trophiesThisYear?.el) countedCupYears.el.add(h.year);
      if (h.trophiesThisYear?.ecl) countedCupYears.ecl.add(h.year);
      if (h.trophiesThisYear?.dfb) countedCupYears.dfb.add(h.year);
      if (h.trophiesThisYear?.reg) countedCupYears.reg.add(h.year);
    });

    const currentClubYears = new Set(currentClubHistory.map(h => h.year));
    // Also synchronize cup wins recorded in state.cupRunResults for seasons managed at this club
    (state.cupRunResults || []).forEach(r => {
      if (r.won && currentClubYears.has(r.year)) {
        const yr = r.year;
        const name = (r.nameEn || '').toLowerCase();
        if (r.id === 'cwc' || name.includes('super globe') || name.includes('club world')) {
          if (!countedCupYears.cwc.has(yr)) { countedCupYears.cwc.add(yr); extraCwc++; }
        } else if (r.id === 'reg_cup' || name.includes('regional') || name.includes('amateur')) {
          if (!countedCupYears.reg.has(yr)) { countedCupYears.reg.add(yr); extraReg++; }
        } else if (r.id === 'euro_cup' || r.id === 'cl' || r.id === 'el' || r.id === 'ecl' || name.includes('champions league') || name.includes('european league') || name.includes('euro league') || name.includes('european cup')) {
          if (name.includes('champions league') || r.id === 'cl') {
            if (!countedCupYears.cl.has(yr)) { countedCupYears.cl.add(yr); extraCl++; }
          } else if (name.includes('european league') || name.includes('euro league') || r.id === 'el') {
            if (!countedCupYears.el.has(yr)) { countedCupYears.el.add(yr); extraEl++; }
          } else if (name.includes('european cup') || name.includes('ecl') || r.id === 'ecl') {
            if (!countedCupYears.ecl.has(yr)) { countedCupYears.ecl.add(yr); extraEcl++; }
          }
        } else {
          // Default any national or custom modded domestic cup competition to National Cup (dfb)
          if (!countedCupYears.dfb.has(yr)) { countedCupYears.dfb.add(yr); extraDfb++; }
        }
      }
    });

    universeCups.forEach(m => {
      const title = (m.cupTitle || '').toLowerCase();
      const yr = m.year;
      if (!currentClubYears.has(yr)) return;
      if (title.includes('super globe')) {
        if (!countedCupYears.cwc.has(yr)) {
          countedCupYears.cwc.add(yr);
          extraCwc++;
        }
      } else if (title.includes('champions league')) {
        if (!countedCupYears.cl.has(yr)) {
          countedCupYears.cl.add(yr);
          extraCl++;
        }
      } else if (title.includes('european league')) {
        if (!countedCupYears.el.has(yr)) {
          countedCupYears.el.add(yr);
          extraEl++;
        }
      } else if (title.includes('european cup')) {
        if (!countedCupYears.ecl.has(yr)) {
          countedCupYears.ecl.add(yr);
          extraEcl++;
        }
      } else if (title.includes('amateur') || title.includes('regional')) {
        if (!countedCupYears.reg.has(yr)) {
          countedCupYears.reg.add(yr);
          extraReg++;
        }
      } else if (
        title.includes('pokal') || title.includes('cup') || title.includes('copa') || 
        title.includes('coupe') || title.includes('puchar') || title.includes('kupa') || 
        title.includes('kup') || title.includes('coppa') || title.includes('cupa') || 
        title.includes('cupen') || title.includes('taça') || title.includes('taca') || 
        title.includes('bikar') || title.includes('nm') || m.type === 'intl_cup'
      ) {
        if (!countedCupYears.dfb.has(yr)) {
          countedCupYears.dfb.add(yr);
          extraDfb++;
        }
      }
    });

    return {
      cwc: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.cwc || 0), 0) + extraCwc,
      cl: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.cl || 0), 0) + extraCl,
      el: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.el || 0), 0) + extraEl,
      ecl: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.ecl || 0), 0) + extraEcl,
      bl: currentClubHistory.reduce((sum, h) => {
        const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
        const isChamp = h.pos === undefined || h.pos === 1;
        return sum + ((!isLower && isChamp && h.trophiesThisYear?.bl) ? (h.trophiesThisYear.bl || 1) : 0);
      }, 0),
      lower: currentClubHistory.reduce((sum, h) => {
        const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
        const isChamp = h.pos === undefined || h.pos === 1;
        if (!isChamp) return sum;
        const val = (h.trophiesThisYear?.lower || 0) + (isLower ? (h.trophiesThisYear?.bl || 0) : 0);
        return sum + val;
      }, 0),
      dfb: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.dfb || 0), 0) + extraDfb,
      reg: currentClubHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.reg || 0), 0) + extraReg,
    };
  }, [currentClubHistory, state.universeMovements, state.cupRunResults, state.history, club.name, club.id]);

  const totalTrophies = useMemo(() => {
    return (
      clubTrophies.cwc +
      clubTrophies.cl +
      clubTrophies.el +
      clubTrophies.ecl +
      clubTrophies.bl +
      clubTrophies.lower +
      clubTrophies.dfb +
      clubTrophies.reg
    );
  }, [clubTrophies]);

  // Career trophies across all clubs managed
  const careerTrophies = useMemo(() => {
    return {
      cwc: allHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.cwc || 0), 0),
      cl: allHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.cl || 0), 0),
      el: allHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.el || 0), 0),
      ecl: allHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.ecl || 0), 0),
      bl: allHistory.reduce((sum, h) => {
        const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
        const isChamp = h.pos === undefined || h.pos === 1;
        return sum + ((!isLower && isChamp && h.trophiesThisYear?.bl) ? (h.trophiesThisYear.bl || 1) : 0);
      }, 0),
      lower: allHistory.reduce((sum, h) => {
        const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
        const isChamp = h.pos === undefined || h.pos === 1;
        if (!isChamp) return sum;
        const val = (h.trophiesThisYear?.lower || 0) + (isLower ? (h.trophiesThisYear?.bl || 0) : 0);
        return sum + val;
      }, 0),
      dfb: allHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.dfb || 0), 0),
      reg: allHistory.reduce((sum, h) => sum + (h.trophiesThisYear?.reg || 0), 0),
    };
  }, [allHistory]);

  const careerTotalTrophies = useMemo(() => {
    return (
      careerTrophies.cwc +
      careerTrophies.cl +
      careerTrophies.el +
      careerTrophies.ecl +
      careerTrophies.bl +
      careerTrophies.lower +
      careerTrophies.dfb +
      careerTrophies.reg
    );
  }, [careerTrophies]);

  const hasCareerTrophies = careerTotalTrophies > totalTrophies;
  const activeTrophies = trophyScope === 'career' ? careerTrophies : clubTrophies;
  const activeTotalTrophies = trophyScope === 'career' ? careerTotalTrophies : totalTrophies;

  // Trophy timeline
  const trophyChronology = useMemo(() => {
    const list: {
      year: number;
      clubName: string;
      competition: string;
      icon: string;
      badgeColor: string;
      details: string;
    }[] = [];

    const sourceHistory = trophyScope === 'career' ? allHistory : currentClubHistory;

    const activeDbPool = getActiveClubs();
    const resolveHistCountry = (h: any): string => {
      if (h.country) return h.country;
      if (h.clubName && club?.name && h.clubName.trim().toLowerCase() === club.name.trim().toLowerCase() && club.country) {
        return club.country;
      }
      const normName = (h.clubName || '').trim().toLowerCase();
      const foundInMod = activeDbPool.find(c => (h.clubId !== undefined && String(c.id) === String(h.clubId)) || (c.name && c.name.trim().toLowerCase() === normName));
      if (foundInMod?.country) return foundInMod.country;
      const foundInWorld = Object.values(state.worldClubs || {}).find((c: any) => c && ((h.clubId !== undefined && String(c.id) === String(h.clubId)) || (c.name && c.name.trim().toLowerCase() === normName))) as any;
      if (foundInWorld?.country) return foundInWorld.country;
      return countryCode;
    };

    sourceHistory.forEach((h) => {
      const t = h.trophiesThisYear || {};
      const histCountry = resolveHistCountry(h);
      const leagueInfo = getLeagueInfo(h.tier, histCountry);
      const cupNames = getContinentalCupNames(histCountry);

      if (t.cwc) {
        list.push({
          year: h.year,
          clubName: h.clubName,
          competition: 'IHF Super Globe · Club World Championship',
          icon: '🌐',
          badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
          details: 'Club World Championship Winner',
        });
      }
      if (t.cl) {
        list.push({
          year: h.year,
          clubName: h.clubName,
          competition: cupNames.cl || 'EHF Champions League',
          icon: '⭐',
          badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
          details: 'European Champions League Winners',
        });
      }
      if (t.el) {
        list.push({
          year: h.year,
          clubName: h.clubName,
          competition: cupNames.el || 'EHF European League',
          icon: '🏆',
          badgeColor: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
          details: 'EHF European League Champion',
        });
      }
      if (t.ecl) {
        list.push({
          year: h.year,
          clubName: h.clubName,
          competition: cupNames.ecl || 'EHF European Cup',
          icon: '🏅',
          badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
          details: 'EHF European Cup Winners',
        });
      }
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      const isChamp = h.pos === undefined || h.pos === 1;
      if (!isLower && isChamp && (t.bl || (h.pos === 1 && h.tier === 1))) {
        list.push({
          year: h.year,
          clubName: h.clubName,
          competition: `${leagueInfo.name} Champions`,
          icon: '🥇',
          badgeColor: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
          details: `1st Place (${h.pts} Pts, ${h.wins}W-${h.draws}D-${h.losses}L)`,
        });
      }
      if (isLower && isChamp && (t.lower || t.bl || h.pos === 1)) {
        list.push({
          year: h.year,
          clubName: h.clubName,
          competition: `${leagueInfo.name} Champions`,
          icon: '🥇',
          badgeColor: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-200',
          details: `Division Champions (${h.pts} Pts, Promoted)`,
        });
      }
      const isDomesticCupMovement = (m: any) => {
        if (!m || m.type !== 'intl_cup') return false;
        if (m.year !== undefined && m.year !== h.year) return false;
        const title = (m.cupTitle || '').toLowerCase();
        if (title.includes('super globe') || title.includes('champions league') || title.includes('european league') || title.includes('european cup') || title.includes('amateur') || title.includes('regional')) {
          return false;
        }
        const targetHistClubName = h.clubName || state.club?.name;
        const targetHistClubId = h.clubId !== undefined ? h.clubId : (h.clubName === state.club?.name ? state.club?.id : undefined);
        const nameMatch = Boolean(
          (m.clubName && targetHistClubName && m.clubName.trim().toLowerCase() === targetHistClubName.trim().toLowerCase()) ||
          (targetHistClubId !== undefined && m.clubId !== undefined && (String(m.clubId) === String(targetHistClubId) || Number(m.clubId) === Number(targetHistClubId)))
        );
        return nameMatch;
      };
      const matchedUniverseDomCup = (h.universeMovements || []).find(isDomesticCupMovement) ||
        (state.universeMovements || []).find(m => m.year === h.year && isDomesticCupMovement(m));
      const matchedCupRunDom = (state.cupRunResults || []).find(r =>
        r.won && r.year === h.year &&
        !['cwc', 'reg_cup', 'cl', 'el', 'ecl', 'euro_cup'].includes(r.id) &&
        !(r.nameEn || '').toLowerCase().includes('regional') &&
        !(r.nameEn || '').toLowerCase().includes('amateur')
      );

      if (t.dfb || matchedUniverseDomCup) {
        const domCupName = matchedCupRunDom?.nameEn || matchedUniverseDomCup?.cupTitle || getDomesticCupInfo(histCountry, 1).name || 'National Cup';
        list.push({
          year: h.year,
          clubName: h.clubName,
          competition: domCupName,
          icon: '🛡️',
          badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
          details: `${domCupName} Winner`,
        });
      }
      if (t.reg) {
        const matchedRegRun = (state.cupRunResults || []).find(r =>
          r.won && r.year === h.year && (r.id === 'reg_cup' || (r.nameEn || '').toLowerCase().includes('regional') || (r.nameEn || '').toLowerCase().includes('amateur'))
        );
        const regCupName = matchedRegRun?.nameEn || getDomesticCupInfo(histCountry, 4).name || 'Regional Cup';
        list.push({
          year: h.year,
          clubName: h.clubName,
          competition: regCupName,
          icon: '🏆',
          badgeColor: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
          details: 'Regional Association Cup Winner',
        });
      }
    });

    return list.sort((a, b) => b.year - a.year);
  }, [trophyScope, currentClubHistory, allHistory, countryCode, state.universeMovements, state.cupRunResults, state.worldClubs]);

  // Aggregate league history stats based on active scope
  const historyStats = useMemo(() => {
    const seasons = targetHistory.length;
    const wins = targetHistory.reduce((s, h) => s + (h.wins || 0), 0);
    const draws = targetHistory.reduce((s, h) => s + (h.draws || 0), 0);
    const losses = targetHistory.reduce((s, h) => s + (h.losses || 0), 0);
    const totalMatches = wins + draws + losses;
    const points = targetHistory.reduce((s, h) => s + (h.pts || 0), 0);
    const gf = targetHistory.reduce((s, h) => s + (h.gf || 0), 0);
    const ga = targetHistory.reduce((s, h) => s + (h.ga || 0), 0);
    const bestPos = targetHistory.reduce((best, h) => (h.pos < best ? h.pos : best), 999);
    const promotions = targetHistory.filter((h) => h.promoted).length;
    const relegations = targetHistory.filter((h) => h.relegated).length;

    return {
      seasons,
      wins,
      draws,
      losses,
      totalMatches,
      points,
      gf,
      ga,
      bestPos: bestPos === 999 ? '—' : `#${bestPos}`,
      promotions,
      relegations,
      winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
    };
  }, [targetHistory]);

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-5 backdrop-blur-xl bg-black/85 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#14151e] border border-white/[0.04] rounded-[28px] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] my-auto cursor-default"
      >
        {/* Top Club Colors Accent Bar */}
        <div
          className="h-1 w-full shrink-0 shadow-sm opacity-90"
          style={{
            background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 50%, ${secondaryColor} 100%)`
          }}
        />

        {/* ========================================================================= */}
        {/* MODAL HEADER: Crest, Club Name, Tier, Quick Badges, Close Button          */}
        {/* ========================================================================= */}
        <div className="relative p-5 sm:p-6 border-b border-white/[0.04] bg-[#14151e] overflow-hidden shrink-0">
          {/* Ambient Dual Club Color Glow */}
          <div
            className="absolute -top-10 -right-10 w-96 h-96 opacity-15 pointer-events-none blur-3xl rounded-full"
            style={{
              background: `radial-gradient(circle at 75% 25%, ${secondaryColor} 0%, transparent 60%), radial-gradient(circle at 25% 75%, ${primaryColor} 0%, transparent 60%)`
            }}
          />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0">
              <div className="shrink-0 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] shadow-md">
                <ClubLogo
                  club={club}
                  name={club.name}
                  color={primaryColor}
                  color2={secondaryColor}
                  logo={club.logo}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight truncate">
                    {club.name}
                  </h2>
                  <span className="text-base" title={countryName}>
                    {countryFlag}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase bg-white/[0.05] text-zinc-300 border border-white/[0.04]">
                    {league.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400 font-normal flex-wrap mt-1">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <i className="fas fa-landmark text-[11px] text-amber-400/80" />
                    <span>{homeArena}</span>
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">
                    Tier {club.tier}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">
                    {countryName}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-white/[0.04] active:scale-95"
              aria-label="Close modal"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/[0.04]">
            <div className="bg-[#10121a] rounded-xl p-2.5 sm:p-3 border border-white/[0.04] flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <i className="fas fa-star text-amber-400 text-[10px]" /> OVR
              </span>
              <span className="text-lg sm:text-xl font-semibold text-white mt-0.5 tabular-nums">
                {club.baseOvr}
              </span>
            </div>

            <div className="bg-[#10121a] rounded-xl p-2.5 sm:p-3 border border-white/[0.04] flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <i className="fas fa-globe text-sky-400 text-[10px]" /> Reputation
              </span>
              <span className="text-lg sm:text-xl font-semibold text-sky-400 mt-0.5 tabular-nums">
                {clubRep}<span className="text-xs text-zinc-500 font-normal">/100</span>
              </span>
            </div>

            <div className="bg-[#10121a] rounded-xl p-2.5 sm:p-3 border border-white/[0.04] flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <i className="fas fa-users text-emerald-400 text-[10px]" /> Avg Attendance
              </span>
              <span className="text-lg sm:text-xl font-semibold text-emerald-400 mt-0.5 tabular-nums">
                {currentAtt.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#10121a] rounded-xl p-2.5 sm:p-3 border border-white/[0.04] flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <i className="fas fa-trophy text-amber-400 text-[10px]" /> Trophies
              </span>
              <span className="text-lg sm:text-xl font-semibold text-amber-400 mt-0.5 tabular-nums">
                {totalTrophies}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABS NAVIGATION                                                          */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 pt-3 border-b border-white/[0.04] bg-[#14151e] shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white/[0.08] text-white shadow-sm border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <i className="fas fa-info-circle text-[11px]" />
              <span>Club Context</span>
            </button>

            <button
              onClick={() => setActiveTab('reputation')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'reputation'
                  ? 'bg-sky-500/[0.08] text-sky-300 border border-sky-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <i className="fas fa-award text-[11px] text-sky-400" />
              <span>Club Reputation</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/10 text-sky-300 font-medium tabular-nums">
                {clubRep}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-emerald-500/[0.08] text-emerald-300 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <i className="fas fa-ticket text-[11px] text-emerald-400" />
              <span>Attendance & Arena</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-medium tabular-nums">
                {currentUtil}%
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-purple-500/[0.08] text-purple-300 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <i className="fas fa-clock-rotate-left text-[11px] text-purple-400" />
              <span>League History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/10 text-purple-300 font-medium tabular-nums">
                {targetHistory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('trophies')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'trophies'
                  ? 'bg-amber-500/[0.08] text-amber-300 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
              }`}
            >
              <i className="fas fa-trophy text-[11px] text-amber-400" />
              <span>Trophies</span>
              {activeTotalTrophies > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/10 text-amber-300 font-medium tabular-nums">
                  {activeTotalTrophies}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENTS (Scrollable)                                                 */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#10121a]">
          {/* TAB 1: OVERVIEW & CONTEXT */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Club Dossier / Historical Narrative */}
              <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-sm">
                    <i className="fas fa-landmark text-base" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span>Club Heritage & Dossier</span>
                    </div>
                    {historicContext ? (
                      <p className="text-xs sm:text-[13px] text-zinc-300/90 leading-relaxed italic font-normal">
                        "{historicContext}"
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 italic font-normal">
                        Official club context and dossier active for this handball organization.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Club Identity Details Grid */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-id-card text-zinc-500" />
                  <span>Club Identity & Specifications</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center text-zinc-300">
                        <i className="fas fa-shield-halved" />
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-400 block font-normal">Division</span>
                        <span className="text-xs sm:text-sm font-semibold text-white">{league.name}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.05] text-zinc-200">
                      Tier {club.tier}
                    </span>
                  </div>

                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center text-zinc-300">
                        <i className="fas fa-map-pin" />
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-400 block font-normal">Home Venue</span>
                        <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[180px] block" title={homeArena}>
                          {homeArena}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 tabular-nums">
                      {stadiumCap.toLocaleString()} Cap
                    </span>
                  </div>

                  {/* Club Colors Card */}
                  <div className="bg-[#14151e] border border-white/[0.04] hover:border-white/[0.08] rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 col-span-1 sm:col-span-2 relative overflow-hidden transition-all shadow-sm">
                    {/* Background subtle ambient tint */}
                    <div 
                      className="absolute inset-0 opacity-[0.04] pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                      }}
                    />

                    <div className="flex items-center gap-3.5 min-w-0 relative z-10">
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                        }}
                      >
                        <i className="fas fa-palette text-white text-base drop-shadow-sm" />
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                          Official Club Colors
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/20 shadow-sm" style={{ backgroundColor: primaryColor }} />
                            <span>{primaryName}</span>
                            <span className="text-zinc-500 font-light">&amp;</span>
                            <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/20 shadow-sm" style={{ backgroundColor: secondaryColor }} />
                            <span>{secondaryName}</span>
                          </span>
                        </div>
                        {/* Hex Codes Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 border border-white/[0.06] shadow-inner">
                            <span className="w-2 h-2 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: primaryColor }} />
                            <span className="font-mono text-[11px] font-medium text-zinc-200 tracking-wider uppercase">{primaryHex}</span>
                          </div>
                          <span className="text-zinc-600 font-normal text-xs">/</span>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 border border-white/[0.06] shadow-inner">
                            <span className="w-2 h-2 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: secondaryColor }} />
                            <span className="font-mono text-[11px] font-medium text-zinc-200 tracking-wider uppercase">{secondaryHex}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Color Swatch Badges & Kit Ribbon */}
                    <div className="flex items-center gap-3 shrink-0 relative z-10 self-start sm:self-auto">
                      {/* Dual Swatch Circles */}
                      <div className="flex -space-x-2 items-center" title={`${primaryName} (${primaryHex}) & ${secondaryName} (${secondaryHex})`}>
                        <span
                          className="w-8 h-8 rounded-full border-2 border-[#14151e] shadow-lg ring-1 ring-white/20 transition transform hover:scale-105 relative z-10"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span
                          className="w-8 h-8 rounded-full border-2 border-[#14151e] shadow-lg ring-1 ring-white/20 transition transform hover:scale-105 relative z-0"
                          style={{ backgroundColor: secondaryColor }}
                        />
                      </div>

                      {/* Kit Stripes / Diagonal Palette Pill */}
                      <div
                        className="h-8 w-20 sm:w-24 rounded-xl border border-white/10 shadow-md overflow-hidden relative"
                        style={{
                          background: `repeating-linear-gradient(135deg, ${primaryColor}, ${primaryColor} 10px, ${secondaryColor} 10px, ${secondaryColor} 20px)`
                        }}
                        title={`Club Palette Pattern: ${primaryHex} / ${secondaryHex}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center text-zinc-300">
                        <i className="fas fa-users-viewfinder" />
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-400 block font-normal">Squad Roster</span>
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {club.squadSize || 16} Professional Players
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tabular-nums">
                      OVR {club.baseOvr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Infrastructure Details */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-screwdriver-wrench text-zinc-500" />
                  <span>Club Infrastructure & Departments</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => onOpenAcademy && onOpenAcademy()}
                    className={`flex flex-col justify-between bg-[#14151e] p-3.5 rounded-xl border border-white/[0.04] transition-all ${
                      onOpenAcademy ? 'hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
                          <i className="fas fa-graduation-cap" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs sm:text-sm">
                            Youth Academy
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal">
                            {academy.label} · Level {academyLvl}/5
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 tracking-wider text-xs font-medium">{academy.stars}</span>
                        <span className="text-[10px] text-zinc-400 font-mono font-medium">({academyLvl}/5)</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-400">
                      <span>
                        {academyLvl >= 5
                          ? '★★★★★ Maximum Facility Rating'
                          : `Next ★ at Level ${academyLvl + 1} Upgrade`}
                      </span>
                      {onOpenAcademy && academyLvl < 5 && (
                        <span className="text-emerald-400 font-medium hover:underline flex items-center gap-1">
                          Upgrade Academy →
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => onOpenMedical && onOpenMedical()}
                    className={`flex flex-col justify-between bg-[#14151e] p-3.5 rounded-xl border border-white/[0.04] transition-all ${
                      onOpenMedical ? 'hover:border-rose-500/40 hover:bg-rose-500/[0.02] cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0 border border-rose-500/20">
                          <i className="fas fa-kit-medical" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs sm:text-sm">
                            Medical Department
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal">
                            {medical.label} · Level {medicalLvl}/5
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 tracking-wider text-xs font-medium">{medical.stars}</span>
                        <span className="text-[10px] text-zinc-400 font-mono font-medium">({medicalLvl}/5)</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-400">
                      <span>
                        {medicalLvl >= 5
                          ? '★★★★★ Maximum Facility Rating'
                          : `Next ★ at Level ${medicalLvl + 1} Upgrade`}
                      </span>
                      {onOpenMedical && medicalLvl < 5 && (
                        <span className="text-rose-400 font-medium hover:underline flex items-center gap-1">
                          Upgrade Medical →
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explainer Tip */}
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-2 text-[11px] text-zinc-400">
                  <i className="fas fa-circle-info text-amber-400 text-xs shrink-0" />
                  <span>
                    Each facility purchase on your Dashboard (+€ investment) immediately upgrades the rating by +1 Star ★ (up to ★★★★★ State of the Art).
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPUTATION & STATURE */}
          {activeTab === 'reputation' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Big Reputation Hero Card */}
              <div className="bg-[#14151e] border border-sky-500/20 rounded-2xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(14,165,233,0.06)] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-sky-400 block">
                      Club Reputation & Stature
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight flex items-center gap-2">
                      <span>{repDetails.label}</span>
                    </h4>
                    <p className="text-xs text-zinc-300 max-w-lg leading-relaxed mt-1 font-normal">
                      {repDetails.desc}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-sky-500/[0.06] border border-sky-500/20 rounded-2xl px-5 py-3 shrink-0">
                    <div className="text-3xl sm:text-4xl font-semibold text-sky-400 tabular-nums">
                      {clubRep}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      Score (0-100)
                    </span>
                  </div>
                </div>

                {/* Reputation Progress Bar with Tiers */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-[11px] font-medium text-zinc-400">
                    <span>Grassroots (0)</span>
                    <span>National (50)</span>
                    <span className="text-amber-400 font-semibold">Global Elite (90+)</span>
                  </div>

                  <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-amber-400 transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.max(4, Math.min(100, clubRep))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Strategic Reputation Influences */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-chart-line text-zinc-500" />
                  <span>Strategic In-Game Influence</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-4 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/20">
                      <i className="fas fa-user-plus" />
                    </div>
                    <h5 className="text-xs font-semibold text-white">
                      Recruitment Pull
                    </h5>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                      Higher reputation unlocks access to superior players and reduces wage inflation during contract talks.
                    </p>
                  </div>

                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-4 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm border border-amber-500/20">
                      <i className="fas fa-handshake" />
                    </div>
                    <h5 className="text-xs font-semibold text-white">
                      Sponsorship Value
                    </h5>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                      Commercial partners offer larger upfront cash sums and lucrative performance incentives to prestigious clubs.
                    </p>
                  </div>

                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-4 space-y-1.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center text-sm border border-sky-500/20">
                      <i className="fas fa-users" />
                    </div>
                    <h5 className="text-xs font-semibold text-white">
                      Attendance Growth
                    </h5>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                      Prestige sparks higher organic fanbase growth, faster sell-outs for marquee derbies, and stronger matchday gates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE & ARENA */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Stadium & Attendance Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
                  <i className="fas fa-building text-purple-400 text-base mb-1.5" />
                  <div className="text-xl sm:text-2xl font-semibold text-white tabular-nums">
                    {stadiumCap.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                    Arena Capacity
                  </span>
                </div>

                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
                  <i className="fas fa-ticket text-emerald-400 text-base mb-1.5" />
                  <div className="text-xl sm:text-2xl font-semibold text-emerald-400 tabular-nums">
                    {currentAtt.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                    Avg Attendance
                  </span>
                </div>

                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
                  <i className="fas fa-percent text-sky-400 text-base mb-1.5" />
                  <div className="text-xl sm:text-2xl font-semibold text-sky-400 tabular-nums">
                    {currentUtil}%
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                    Capacity Fill Rate
                  </span>
                </div>

                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
                  <i className="fas fa-heart text-rose-400 text-base mb-1.5" />
                  <div className="text-xl sm:text-2xl font-semibold text-white tabular-nums">
                    {fanBase.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                    Core Fanbase
                  </span>
                </div>
              </div>

              {/* Stadium Capacity Utilization Meter */}
              <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-1.5 flex-wrap text-xs">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <i className="fas fa-chart-pie text-emerald-400" />
                    <span>Matchday Capacity Utilization</span>
                  </span>
                  <span className="font-semibold text-emerald-400 tabular-nums">
                    {currentAtt.toLocaleString()} / {stadiumCap.toLocaleString()} Seats ({currentUtil}%)
                  </span>
                </div>

                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(2, currentUtil))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-zinc-400 pt-1 font-normal">
                  <span>Home Arena: <strong className="text-zinc-200 font-medium">{homeArena}</strong></span>
                  <span>League Max Cap: <strong className="text-zinc-200 font-medium tabular-nums">{leagueMaxAtt.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Historical Attendance Log */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-list text-zinc-500" />
                  <span>Season Attendance Log</span>
                </h3>

                {currentClubHistory.length === 0 ? (
                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-5 text-center text-zinc-400 text-xs font-normal">
                    <i className="fas fa-info-circle mb-1 block text-zinc-500" />
                    Inaugural season {state.year} is in progress. Historical attendance logs will populate after season finish.
                  </div>
                ) : (
                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.03] text-[10px] uppercase font-medium text-zinc-400 border-b border-white/[0.04]">
                          <tr>
                            <th className="py-2.5 px-3 sm:px-4">Season</th>
                            <th className="py-2.5 px-3 sm:px-4">Division</th>
                            <th className="py-2.5 px-3 sm:px-4 text-right">Capacity</th>
                            <th className="py-2.5 px-3 sm:px-4 text-right">Avg Crowd</th>
                            <th className="py-2.5 px-3 sm:px-4 text-right">Fill %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {currentClubHistory.map((h, idx) => {
                            const cap = (h as any).stadium || stadiumCap;
                            const rawAtt = h.att || 0;
                            const att = rawAtt > 0 ? formatOrganicAttendance(rawAtt, cap, h.year) : 0;
                            const util = h.util || Math.min(100, Math.round((att / cap) * 100));
                            return (
                              <tr key={idx} className="hover:bg-white/[0.02] transition">
                                <td className="py-2.5 px-3 sm:px-4 font-semibold text-white tabular-nums">{h.year}</td>
                                <td className="py-2.5 px-3 sm:px-4 text-zinc-300 font-normal">
                                  Tier {h.tier} ({getLeagueInfo(h.tier, h.country || countryCode).name})
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-right tabular-nums text-zinc-400">
                                  {cap.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-right tabular-nums font-semibold text-emerald-400">
                                  {att > 0 ? att.toLocaleString() : '—'}
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-right tabular-nums text-zinc-300">
                                  {att > 0 ? `${util}%` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LEAGUE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* League History Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3 text-center">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Seasons
                  </span>
                  <span className="text-lg font-semibold text-white tabular-nums">
                    {historyStats.seasons}
                  </span>
                </div>

                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3 text-center">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Record (W-D-L)
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white tabular-nums">
                    {historyStats.wins}-{historyStats.draws}-{historyStats.losses}
                  </span>
                </div>

                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3 text-center">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Win Rate
                  </span>
                  <span className="text-lg font-semibold text-emerald-400 tabular-nums">
                    {historyStats.winRate}%
                  </span>
                </div>

                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3 text-center">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Total Points
                  </span>
                  <span className="text-lg font-semibold text-amber-400 tabular-nums">
                    {historyStats.points}
                  </span>
                </div>

                <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
                    Best Finish
                  </span>
                  <span className="text-lg font-semibold text-sky-400 tabular-nums">
                    {historyStats.bestPos}
                  </span>
                </div>
              </div>

              {/* Career vs Club Scope Switcher if manager managed multiple clubs */}
              {hasCareerHistory && (
                <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-xl border border-white/[0.04] w-fit">
                  <button
                    onClick={() => setHistoryScope('club')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      historyScope === 'club'
                        ? 'bg-purple-500/10 text-purple-200 border border-purple-500/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{club.name}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/[0.05] text-zinc-300 font-medium tabular-nums">
                      {currentClubHistory.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setHistoryScope('career')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      historyScope === 'career'
                        ? 'bg-purple-500/10 text-purple-200 border border-purple-500/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Full Manager Career</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/[0.05] text-zinc-300 font-medium tabular-nums">
                      {allHistory.length}
                    </span>
                  </button>
                </div>
              )}

              {/* Complete League History Table */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-table-list text-zinc-500" />
                    <span>
                      {historyScope === 'career'
                        ? 'Chronicle of All Managerial Seasons'
                        : `${club.name} Season Archive`}
                    </span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal tabular-nums">
                    {targetHistory.length} completed seasons
                  </span>
                </h3>

                {targetHistory.length === 0 ? (
                  <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 mx-auto text-xl">
                      <i className="fas fa-flag-checkered" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-white">
                        Inaugural Season {state.year} in Progress
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-normal">
                        Currently competing in {league.name} (Tier {club.tier}). Final league standings, goal tallies, and points will be archived here upon season completion.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.03] text-[10px] uppercase font-medium text-zinc-400 border-b border-white/[0.04]">
                          <tr>
                            <th className="py-2.5 px-3 sm:px-4">Year</th>
                            {historyScope === 'career' && (
                              <th className="py-2.5 px-3 sm:px-4">Club</th>
                            )}
                            <th className="py-2.5 px-3 sm:px-4">League / Tier</th>
                            <th className="py-2.5 px-3 sm:px-4 text-center">Pos</th>
                            <th className="py-2.5 px-3 sm:px-4 text-center">Record</th>
                            <th className="py-2.5 px-3 sm:px-4 text-center">Goals (GD)</th>
                            <th className="py-2.5 px-3 sm:px-4 text-center">Pts</th>
                            <th className="py-2.5 px-3 sm:px-4 text-right">Attendance (Fill)</th>
                            <th className="py-2.5 px-3 sm:px-4 text-right">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {targetHistory.map((h, idx) => {
                            const isChamp = h.pos === 1;
                            const isPromo = !!h.promoted;
                            const isReleg = !!h.relegated;
                            const gd = (h.gf || 0) - (h.ga || 0);

                            const histCleanName = (h.clubName || '').toLowerCase().replace(/[\.\s\-]/g, '');
                            const histClubData = h.clubName === state.club.name
                              ? state.club
                              : (activeClubs.find(c => {
                                  if ((h as any).clubId && (String(c.id) === String((h as any).clubId) || Number(c.id) === Number((h as any).clubId))) return true;
                                  if (c.name === h.clubName) return true;
                                  const cleanC = (c.name || '').toLowerCase().replace(/[\.\s\-]/g, '');
                                  return cleanC === histCleanName;
                                }) || ALL_CLUBS.find(c => {
                                  if ((h as any).clubId && (String(c.id) === String((h as any).clubId) || Number(c.id) === Number((h as any).clubId))) return true;
                                  if (c.name === h.clubName) return true;
                                  const cleanC = (c.name || '').toLowerCase().replace(/[\.\s\-]/g, '');
                                  if (cleanC === histCleanName) return true;
                                  if (histCleanName.includes('paderborn') && c.id === 174) return true;
                                  if ((histCleanName.includes('köln') || histCleanName.includes('koeln')) && c.id === 152) return true;
                                  if (histCleanName.includes('wiesbaden') && c.id === 171) return true;
                                  return false;
                                }));

                            return (
                              <tr key={idx} className="hover:bg-white/[0.02] transition">
                                <td className="py-2.5 px-3 sm:px-4 font-semibold text-white tabular-nums">{h.year}</td>
                                {historyScope === 'career' && (
                                  <td className="py-2.5 px-3 sm:px-4 font-medium text-zinc-200 flex items-center gap-2">
                                    <ClubLogo
                                      name={h.clubName}
                                      clubId={(h as any).clubId || histClubData?.id}
                                      club={histClubData}
                                      color={h.color || histClubData?.color}
                                      color2={(h as any).color2 || histClubData?.color2}
                                      logo={h.logo || histClubData?.logo}
                                      fallbackLogo={histClubData?.fallbackLogo}
                                      className="w-5 h-5 rounded-md object-contain shrink-0 border border-white/10"
                                    />
                                    <span className="truncate max-w-[140px]">{h.clubName}</span>
                                  </td>
                                )}
                                <td className="py-2.5 px-3 sm:px-4 text-zinc-300 font-normal">
                                  {getLeagueInfo(h.tier, h.country || countryCode).name}
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center font-medium px-2 py-0.5 rounded text-[11px] tabular-nums ${
                                      isChamp
                                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                        : h.pos <= 3
                                        ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                                        : isReleg
                                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                        : 'bg-white/[0.04] text-zinc-300 border border-white/[0.04]'
                                    }`}
                                  >
                                    #{h.pos}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-center tabular-nums text-zinc-300">
                                  {h.wins}W - {h.draws}D - {h.losses}L
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-center tabular-nums text-zinc-400">
                                  {h.gf}:{h.ga}{' '}
                                  <span className={gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-rose-400' : 'text-zinc-500'}>
                                    ({gd >= 0 ? `+${gd}` : gd})
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-center tabular-nums font-semibold text-amber-300">
                                  {h.pts}
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-right tabular-nums text-zinc-300 font-normal">
                                  {(() => {
                                    if (!h.att) return '—';
                                    const cap = (h as any).stadium || stadiumCap;
                                    const att = formatOrganicAttendance(h.att, cap, h.year);
                                    const util = cap && cap > 0 ? Math.min(100, Math.round((att / cap) * 100)) : null;
                                    return (
                                      <span className="inline-flex items-baseline justify-end gap-1">
                                        <span>{att.toLocaleString()}</span>
                                        {util !== null && (
                                          <span className="text-zinc-400 font-mono text-[10px]">({util}%)</span>
                                        )}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="py-2.5 px-3 sm:px-4 text-right">
                                  {isChamp ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                                      <span>🏆</span> <span>Champion</span>
                                    </span>
                                  ) : isPromo ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                      <span>⬆</span> <span>Promoted</span>
                                    </span>
                                  ) : isReleg ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                                      <span>⬇</span> <span>Relegated</span>
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-zinc-400">
                                      Safe
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TROPHIES */}
          {activeTab === 'trophies' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Career vs Club Scope Switcher if manager won trophies at multiple clubs */}
              {hasCareerTrophies && (
                <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-xl border border-white/[0.04] w-fit">
                  <button
                    onClick={() => setTrophyScope('club')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      trophyScope === 'club'
                        ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{club.name}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/[0.05] text-zinc-300 font-medium tabular-nums">
                      {totalTrophies}
                    </span>
                  </button>
                  <button
                    onClick={() => setTrophyScope('career')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      trophyScope === 'career'
                        ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Full Manager Career</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/[0.05] text-zinc-300 font-medium tabular-nums">
                      {careerTotalTrophies}
                    </span>
                  </button>
                </div>
              )}

              {/* Trophies Summary Card */}
              <div className="bg-[#14151e] border border-amber-500/20 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(245,158,11,0.06)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-amber-400 block">
                      {trophyScope === 'career'
                        ? 'Career Managerial Honours & Silverware'
                        : `${club.name} Silverware Cabinet`}
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight flex items-center gap-2">
                      <i className="fas fa-trophy text-amber-400" />
                      <span>{activeTotalTrophies} Official Titles</span>
                    </h4>
                    <p className="text-xs text-zinc-300 max-w-lg leading-relaxed mt-1 font-normal">
                      {activeTotalTrophies === 0
                        ? 'No silverware won yet. Compete for league titles and domestic/continental cups to fill your trophy cabinet.'
                        : trophyScope === 'career'
                        ? 'All official silverware won across your entire managerial career across all clubs.'
                        : `Official silverware won while managing ${club.name}.`}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl px-5 py-3 shrink-0">
                    <div className="text-3xl sm:text-4xl font-semibold text-amber-300 tabular-nums">
                      {activeTotalTrophies}
                    </div>
                    <span className="text-[10px] font-medium text-amber-400/80 uppercase tracking-wider mt-0.5">
                      Total Silverware
                    </span>
                  </div>
                </div>
              </div>

              {/* Silverware Category Breakdown Grid */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-cubes text-zinc-500" />
                  <span>Silverware by Competition</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Tier 1 League Title */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition ${
                    activeTrophies.bl > 0
                      ? 'bg-amber-500/[0.06] border-amber-500/20'
                      : 'bg-[#14151e] border-white/[0.04] opacity-60'
                  }`}>
                    <span className="text-2xl mb-1">🥇</span>
                    <span className="text-lg font-semibold text-white tabular-nums">{activeTrophies.bl}</span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      Tier 1 League
                    </span>
                  </div>

                  {/* Domestic Cup */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition ${
                    activeTrophies.dfb > 0
                      ? 'bg-amber-500/[0.06] border-amber-500/20'
                      : 'bg-[#14151e] border-white/[0.04] opacity-60'
                  }`}>
                    <span className="text-2xl mb-1">🛡️</span>
                    <span className="text-lg font-semibold text-white tabular-nums">{activeTrophies.dfb}</span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      National Cup
                    </span>
                  </div>

                  {/* EHF Champions League */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition ${
                    activeTrophies.cl > 0
                      ? 'bg-sky-500/[0.06] border-sky-500/20'
                      : 'bg-[#14151e] border-white/[0.04] opacity-60'
                  }`}>
                    <span className="text-2xl mb-1">⭐</span>
                    <span className="text-lg font-semibold text-white tabular-nums">{activeTrophies.cl}</span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      Champions League
                    </span>
                  </div>

                  {/* EHF European League */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition ${
                    activeTrophies.el > 0
                      ? 'bg-orange-500/[0.06] border-orange-500/20'
                      : 'bg-[#14151e] border-white/[0.04] opacity-60'
                  }`}>
                    <span className="text-2xl mb-1">🏆</span>
                    <span className="text-lg font-semibold text-white tabular-nums">{activeTrophies.el}</span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      European League
                    </span>
                  </div>

                  {/* EHF European Cup */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition ${
                    activeTrophies.ecl > 0
                      ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                      : 'bg-[#14151e] border-white/[0.04] opacity-60'
                  }`}>
                    <span className="text-2xl mb-1">🏅</span>
                    <span className="text-lg font-semibold text-white tabular-nums">{activeTrophies.ecl}</span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      European Cup
                    </span>
                  </div>

                  {/* IHF Super Globe / Club World Championship */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition ${
                    activeTrophies.cwc > 0
                      ? 'bg-amber-500/[0.06] border-amber-500/20'
                      : 'bg-[#14151e] border-white/[0.04] opacity-60'
                  }`}>
                    <span className="text-2xl mb-1">🌐</span>
                    <span className="text-lg font-semibold text-white tabular-nums">{activeTrophies.cwc}</span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      Super Globe
                    </span>
                  </div>

                  {/* Lower Division Titles */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition ${
                    activeTrophies.lower > 0
                      ? 'bg-zinc-400/10 border-zinc-400/20'
                      : 'bg-[#14151e] border-white/[0.04] opacity-60'
                  }`}>
                    <span className="text-2xl mb-1">🥇</span>
                    <span className="text-lg font-semibold text-white tabular-nums">{activeTrophies.lower}</span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      Lower Div Titles
                    </span>
                  </div>

                  {/* Regional Cup */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition ${
                    activeTrophies.reg > 0
                      ? 'bg-orange-400/[0.06] border-orange-400/20'
                      : 'bg-[#14151e] border-white/[0.04] opacity-60'
                  }`}>
                    <span className="text-2xl mb-1">🏆</span>
                    <span className="text-lg font-semibold text-white tabular-nums">{activeTrophies.reg}</span>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
                      Regional Cup
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Trophy Timeline / Honors Roll */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-medal text-zinc-500" />
                  <span>Honours Roll & Chronicle</span>
                </h3>

                {trophyChronology.length === 0 ? (
                  <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-6 text-center text-zinc-400 text-xs space-y-1 font-normal">
                    <span className="text-2xl block mb-1">🏆</span>
                    <p className="font-medium text-zinc-300">
                      No titles registered in the chronicle yet.
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Win domestic championships or continental knockout finals to record honors here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {trophyChronology.map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-white/[0.08] transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{t.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                {t.competition}
                              </span>
                              {trophyScope === 'career' && (
                                <span className="text-[11px] font-normal text-zinc-400">
                                  ({t.clubName})
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 block truncate font-normal">
                              {t.details}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 tabular-nums ${t.badgeColor}`}>
                          {t.year}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <i className="fas fa-shield text-zinc-600" />
            <span>{club.name} &bull; {countryName}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs rounded-xl transition active:scale-95 cursor-pointer border border-white/[0.06]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
