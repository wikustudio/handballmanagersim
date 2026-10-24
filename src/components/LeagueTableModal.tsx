import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';

import { Club, GameState, Language, UniverseMovement } from '../types';
import { getLeagueInfo, isReserveClub, getMaxTier, getCountryFlag, normalizeCountry } from '../data/gameConstants';
import { generateLeagueTable, calculateLeagueStakes } from '../utils/leagueTableGenerator';
import { ALL_CLUBS } from '../data/clubsData';
import { isAnyModActive } from '../utils/modManager';
import { ClubLogo } from './ClubLogo';
import { useModalDismiss } from '../utils/modalUtils';

interface LeagueTableModalProps {
  embedded?: boolean;
  targetTier?: number;
  targetYear?: number;
  state: GameState;
  clubsDb: Club[];
  lang: Language;
  onClose: () => void;
}

export const LeagueTableModal: React.FC<LeagueTableModalProps> = ({
  embedded,
  targetTier,
  targetYear,
  state,
  clubsDb,
  onClose,
}) => {
  useModalDismiss(onClose, !embedded);
  const [activeTab, setActiveTab] = useState<'standings' | 'universe'>('standings');
  const [universeFilter, setUniverseFilter] = useState<'headlines' | 'domestic' | 'cups' | 'career' | 'all'>('headlines');
  const [universeRegion, setUniverseRegion] = useState<string>('all');

  const history = state.history || [];

  // Collect all available years in chronological order
  const availableYears = useMemo(() => {
    const list: number[] = [];
    history.forEach((h) => {
      if (!list.includes(h.year)) list.push(h.year);
    });
    if (!list.includes(state.year)) {
      list.push(state.year);
    }
    return list.sort((a, b) => b - a); // Newest first
  }, [history, state.year]);

  // Determine initial selected year: targetYear if provided, else target the active current season
  const initialYear = targetYear ?? state.year;
  const initialHist = history.find((h) => h.year === initialYear) || null;
  const initialCountry = initialHist?.country || state.club.country || 'GER';
  const initialTier = targetTier ?? (initialHist ? initialHist.tier : state.club.tier);

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry);
  const [selectedTier, setSelectedTier] = useState<number>(initialTier);

  useEffect(() => {
    if (targetYear !== undefined) {
      setSelectedYear(targetYear);
      const tHist = history.find((h) => h.year === targetYear) || null;
      if (tHist?.country) {
        setSelectedCountry(tHist.country);
      }
      if (targetTier !== undefined) {
        setSelectedTier(targetTier);
      } else if (tHist?.tier) {
        setSelectedTier(tHist.tier);
      }
    } else if (targetTier !== undefined) {
      setSelectedTier(targetTier);
    }
  }, [targetYear, targetTier]);

  // Selected season history entry (if looking at a completed historical season)
  const currentSelectedHist = useMemo(() => {
    return history.find((h) => h.year === selectedYear) || null;
  }, [history, selectedYear]);

  // Available countries from leagues and database
  const availableCountries = useMemo(() => {
    const defaultPriority = ['GER', 'FRA', 'ESP', 'DEN', 'HUN', 'POL', 'POR', 'SWE', 'NOR', 'SUI', 'AUT', 'CRO', 'SLO', 'MKD', 'ISL', 'ITA'];
    const myC = normalizeCountry(state.club.country || 'GER');
    const dbCountries = new Set<string>([myC]);
    clubsDb.forEach(c => {
      if (c.country) dbCountries.add(normalizeCountry(c.country));
    });
    const ordered = defaultPriority.filter(code => dbCountries.has(code));
    dbCountries.forEach(code => {
      if (!ordered.includes(code)) ordered.push(code);
    });
    return ordered;
  }, [state.club.country, clubsDb]);

  useEffect(() => {
    if (!availableCountries.includes(normalizeCountry(selectedCountry))) {
      setSelectedCountry(normalizeCountry(state.club.country || 'GER'));
    }
  }, [availableCountries, selectedCountry, state.club.country]);

  const countryLabels: Record<string, string> = {
    GER: 'Germany',
    FRA: 'France',
    ESP: 'Spain',
    DEN: 'Denmark',
    HUN: 'Hungary',
    POL: 'Poland',
    POR: 'Portugal',
    SWE: 'Sweden',
    NOR: 'Norway',
    SUI: 'Switzerland',
    AUT: 'Austria',
    CRO: 'Croatia',
    SLO: 'Slovenia',
    MKD: 'North Macedonia',
    ISL: 'Iceland',
    ITA: 'Italy'
  };

  const currentCountry = selectedCountry;
  const maxTiers = getMaxTier(currentCountry);
  const availableTiers = Array.from({ length: maxTiers }, (_, i) => i + 1);

  // Clamped tier in case switching to country with fewer divisions
  const effectiveTier = Math.min(selectedTier, maxTiers);
  const currentLeagueInfo = getLeagueInfo(effectiveTier, currentCountry);
  const yearTag = `${selectedYear}`;
  const leagueTag = currentLeagueInfo.tag || `T${effectiveTier}`;

  const isTier1 = effectiveTier === 1;
  const isMaxTier = effectiveTier >= maxTiers;
  const hasPromotionPlayoffs = (currentCountry === 'ENG' || currentCountry === 'USA' || currentCountry === 'SCO') && effectiveTier > 1;

  // Use cached authentic divisionTables / finalTable for the selected year and tier if available, otherwise generate
  const tableData = useMemo(() => {
    const reconcileRows = (rows: any[]) => {
      const modActive = isAnyModActive();
      const isCurrentOrLatestSeason = !currentSelectedHist || currentSelectedHist.year === state?.year;
      const cupFinalsCtx = (currentSelectedHist as any)?.resolvedMatchContext?.cupFinals || (isCurrentOrLatestSeason ? state?.resolvedMatchContext?.cupFinals : undefined) || {};
      const seasonCupMovements = (currentSelectedHist?.universeMovements || (isCurrentOrLatestSeason ? state?.universeMovements : []) || []).filter(
        (m: any) => m.year === selectedYear && m.type === 'intl_cup'
      );
      const normSelectedCountry = normalizeCountry(selectedCountry);
      const userHistCountry = normalizeCountry(currentSelectedHist?.country || state.club.country || 'GER');
      const isDomesticCountry = normSelectedCountry === userHistCountry;

      const qualifyingWinners = new Set<string>();
      Object.entries(cupFinalsCtx).forEach(([k, val]: [string, any]) => {
        if (k !== 'reg_cup' && k !== 'reg' && k !== 'cwc' && val?.winnerName && (!val.year || val.year === selectedYear)) {
          // nat_cup only qualifies a club in the user's domestic country; European cups qualify in any country if that club is in selectedCountry
          if (k === 'nat_cup' && !isDomesticCountry) return;
          qualifyingWinners.add(String(val.winnerName).trim().toLowerCase());
        }
      });
      seasonCupMovements.forEach((m: any) => {
        const title = String(m.cupTitle || '').toLowerCase();
        const isRegOrWorld = title.includes('amateur') || title.includes('regional') || title.includes('super globe');
        const isContinental = title.includes('champions league') || title.includes('european league') || title.includes('european cup') || title.includes('ehf');
        const mCountry = normalizeCountry(m.country || 'GER');
        if (!isRegOrWorld && m.clubName && (isContinental || mCountry === normSelectedCountry)) {
          qualifyingWinners.add(String(m.clubName).trim().toLowerCase());
        }
      });
      const histTrophies = currentSelectedHist?.trophiesThisYear;
      const userWonQualifyingCup = Boolean(
        histTrophies?.dfb || histTrophies?.cl || histTrophies?.el || histTrophies?.ecl
      );

      const rawPlayoff = (currentSelectedHist as any)?.resolvedMatchContext?.playoffDecider || (isCurrentOrLatestSeason ? state?.resolvedMatchContext?.playoffDecider : undefined);
      const playoffCtx = rawPlayoff && (!rawPlayoff.year || rawPlayoff.year === selectedYear) ? rawPlayoff : undefined;

      return rows.map((r: any) => {
        const dbMatch =
          clubsDb.find(c => (r.id !== undefined && String(c.id) === String(r.id)) || (c.name && r.name && c.name.toLowerCase() === r.name.toLowerCase())) ||
          ALL_CLUBS.find(c => (r.id !== undefined && String(c.id) === String(r.id)) || (c.name && r.name && c.name.toLowerCase() === r.name.toLowerCase()));
        const resolvedName = dbMatch?.name || r.name || '';
        const normRowName = resolvedName.trim().toLowerCase();
        const isCupQual = effectiveTier === 1 && !isReserveClub(resolvedName) && (
          (r.isUser && isDomesticCountry && userWonQualifyingCup) ||
          qualifyingWinners.has(normRowName)
        );
        let resolvedMarker = (!r.statusMarker && isCupQual && r.pos > 1) ? 'Q' : r.statusMarker;
        if (isDomesticCountry && playoffCtx) {
          const isPlayoffLoser = (playoffCtx.loserName && normRowName === playoffCtx.loserName.trim().toLowerCase()) ||
            (playoffCtx.relegatedClubId && String(r.id) === String(playoffCtx.relegatedClubId));
          const isPlayoffWinner = (playoffCtx.winnerName && normRowName === playoffCtx.winnerName.trim().toLowerCase()) ||
            (playoffCtx.promotedClubId && String(r.id) === String(playoffCtx.promotedClubId));
          if (effectiveTier === playoffCtx.upperTier) {
            if (isPlayoffLoser) resolvedMarker = 'R';
            else if (isPlayoffWinner && resolvedMarker === 'R') resolvedMarker = undefined;
          }
          if (effectiveTier === playoffCtx.lowerTier && playoffCtx.lowerTier !== playoffCtx.upperTier) {
            if (isPlayoffWinner) resolvedMarker = 'P';
            else if (isPlayoffLoser && resolvedMarker === 'P') resolvedMarker = undefined;
          }
        }
        return {
          ...r,
          name: resolvedName,
          color: dbMatch?.color || r.color,
          logo: modActive ? (dbMatch?.logo ?? r.logo) : undefined,
          fallbackLogo: modActive ? (dbMatch?.fallbackLogo ?? r.fallbackLogo) : undefined,
          ...(resolvedMarker ? { statusMarker: resolvedMarker } : {}),
        };
      });
    };

    if (currentSelectedHist) {
      if (
        normalizeCountry(selectedCountry) === normalizeCountry(currentSelectedHist.country || state.club.country || 'GER') &&
        effectiveTier === currentSelectedHist.tier &&
        currentSelectedHist.finalTable &&
        Array.isArray(currentSelectedHist.finalTable) &&
        currentSelectedHist.finalTable.length > 0
      ) {
        return reconcileRows(currentSelectedHist.finalTable);
      }
      if (
        normalizeCountry(selectedCountry) === normalizeCountry(currentSelectedHist.country || state.club.country || 'GER') &&
        currentSelectedHist.divisionTables?.[effectiveTier] &&
        Array.isArray(currentSelectedHist.divisionTables[effectiveTier]) &&
        currentSelectedHist.divisionTables[effectiveTier].length > 0
      ) {
        return reconcileRows(currentSelectedHist.divisionTables[effectiveTier]);
      }
      return generateLeagueTable(state, clubsDb, effectiveTier, {
        year: selectedYear,
        country: selectedCountry,
        tier: effectiveTier,
        userPlayedTier: currentSelectedHist.tier
      });
    }
    return generateLeagueTable(state, clubsDb, effectiveTier, {
      year: selectedYear,
      country: selectedCountry,
      tier: effectiveTier,
      userPlayedTier: state.club.tier
    });
  }, [state, clubsDb, effectiveTier, currentSelectedHist, selectedYear, selectedCountry]);

  const stakes = useMemo(() => {
    return calculateLeagueStakes(tableData, effectiveTier, currentCountry, state.club.name);
  }, [tableData, effectiveTier, currentCountry, state.club.name]);

  const userCountry = normalizeCountry(state.club.country || 'GER');
  const marqueeCountries = ['GER', 'FRA', 'ESP', 'DEN', 'HUN'];

  // Universe movements for the selected year
  const universeMovements: UniverseMovement[] = useMemo(() => {
    let raw: UniverseMovement[] = [];
    if (currentSelectedHist?.universeMovements && currentSelectedHist.universeMovements.length > 0) {
      raw = currentSelectedHist.universeMovements;
    } else if (state.universeMovements && state.universeMovements.length > 0) {
      const thisYearMovements = state.universeMovements.filter((m) => m.year === selectedYear);
      raw = thisYearMovements.length > 0 ? thisYearMovements : state.universeMovements;
    }
    const modActive = isAnyModActive();
    return raw
      .filter(m => !(m.type === 'insolvency_relegation' && normalizeCountry(m.country || 'GER') !== userCountry))
      .map(m => {
        const dbMatch =
          clubsDb.find(c => (m.clubId !== undefined && String(c.id) === String(m.clubId)) || (c.name && m.clubName && c.name.toLowerCase() === m.clubName.toLowerCase())) ||
          ALL_CLUBS.find(c => (m.clubId !== undefined && String(c.id) === String(m.clubId)) || (c.name && m.clubName && c.name.toLowerCase() === m.clubName.toLowerCase()));
        return {
          ...m,
          clubName: dbMatch?.name || m.clubName,
          clubColor: dbMatch?.color || m.clubColor,
          clubLogo: modActive ? (dbMatch?.logo ?? m.clubLogo) : undefined,
        };
      });
  }, [currentSelectedHist, state.universeMovements, selectedYear, userCountry, clubsDb]);

  const insolventClubInTable = clubsDb.find(
    (c) =>
      c.isInsolventGiant &&
      c.tier === effectiveTier &&
      normalizeCountry(c.country || 'GER') === normalizeCountry(selectedCountry)
  ) || (state.lastInsolventGiantNotice && state.lastInsolventGiantNotice.tier === effectiveTier && normalizeCountry(state.lastInsolventGiantNotice.country || 'GER') === normalizeCountry(selectedCountry)
    ? clubsDb.find((c) => c.id === state.lastInsolventGiantNotice?.clubId) || { name: state.lastInsolventGiantNotice.clubName }
    : null) || (universeMovements.find(m => m.type === 'insolvency_relegation' && m.toTier === effectiveTier && normalizeCountry(m.country || 'GER') === normalizeCountry(selectedCountry))
      ? { name: universeMovements.find(m => m.type === 'insolvency_relegation' && m.toTier === effectiveTier && normalizeCountry(m.country || 'GER') === normalizeCountry(selectedCountry))!.clubName }
      : null);

  const isKeyChampion = (m: UniverseMovement) => {
    if (m.type !== 'champion') return false;
    const mCountry = normalizeCountry(m.country || 'GER');
    // User's own club
    if (m.clubName === state.club.name || m.clubId === String(state.club.id)) return true;
    // User's division champion
    const userTier = currentSelectedHist ? currentSelectedHist.tier : state.club.tier;
    if (mCountry === userCountry && m.fromTier === userTier) return true;
    // User's domestic Tier 1 champion
    if (mCountry === userCountry && m.fromTier === 1) return true;
    // Marquee top European leagues' Tier 1 champions
    if (marqueeCountries.includes(mCountry) && m.fromTier === 1) return true;
    return false;
  };

  const isMajorRelegation = (m: UniverseMovement) => {
    if (m.type !== 'relegation' && m.type !== 'insolvency_relegation') return false;
    const mCountry = normalizeCountry(m.country || 'GER');
    // User's club
    if (m.clubName === state.club.name || m.clubId === String(state.club.id)) return true;
    // User's domestic top division relegation drama
    if (mCountry === userCountry && m.fromTier === 1) return true;
    // Insolvency demotions (strictly domestic to maintain authentic league context)
    if (m.type === 'insolvency_relegation' && mCountry === userCountry) return true;
    return false;
  };

  const isKeyDramaMovement = (m: UniverseMovement) => {
    // 1. Key international cup winners (CL, EL, ECL, Super Globe)
    if (m.type === 'intl_cup') return true;
    const mCountry = normalizeCountry(m.country || 'GER');
    // 2. Insolvency & Takeover drama (strictly domestic context)
    if (m.type === 'insolvency_relegation' || m.type === 'takeover') return mCountry === userCountry;
    // 3. Cinderella Breakthroughs
    if (m.isCinderella) return true;
    // 4. Key Champions
    if (isKeyChampion(m)) return true;
    // 5. Major Relegation drama
    if (isMajorRelegation(m)) return true;
    // 6. User promotion
    if ((m.clubName === state.club.name || m.clubId === String(state.club.id)) && m.type === 'promotion') return true;
    return false;
  };

  const availableUniverseRegions = useMemo(() => {
    const regions = new Set<string>();
    universeMovements.forEach((m) => {
      if (m.country) regions.add(m.country.toUpperCase());
    });
    return Array.from(regions).sort();
  }, [universeMovements]);

  const isKeyMovement = isKeyDramaMovement;

  const filteredMovements = useMemo(() => {
    let list = universeMovements;

    if (universeRegion !== 'all') {
      list = list.filter((m) => (m.country || '').toUpperCase() === universeRegion.toUpperCase());
    }

    if (universeFilter === 'headlines') {
      list = list.filter(isKeyDramaMovement);
    } else if (universeFilter === 'domestic') {
      list = list.filter((m) => m.type === 'champion' || m.type === 'promotion' || m.type === 'relegation' || m.type === 'insolvency_relegation' || m.type === 'takeover');
    } else if (universeFilter === 'cups') {
      list = list.filter((m) => m.type === 'intl_cup');
    } else if (universeFilter === 'career') {
      list = list.filter((m) =>
        m.clubName === state.club.name ||
        m.clubId === String(state.club.id) ||
        normalizeCountry(m.country || 'GER') === userCountry
      );
    }

    if (universeFilter === 'headlines') {
      const typePriority: Record<string, number> = {
        'insolvency_relegation': 1,
        'takeover': 2,
        'intl_cup': 2,
        'champion': 3,
        'relegation': 4,
        'promotion': 5,
      };
      return [...list].sort((a, b) => {
        const aIsUser = (a.clubName === state.club.name || a.clubId === String(state.club.id)) ? 0 : 1;
        const bIsUser = (b.clubName === state.club.name || b.clubId === String(state.club.id)) ? 0 : 1;
        if (aIsUser !== bIsUser) return aIsUser - bIsUser;
        const pA = typePriority[a.type] || 10;
        const pB = typePriority[b.type] || 10;
        return pA - pB;
      });
    }

    return list;
  }, [universeMovements, universeRegion, universeFilter, userCountry, state.club.name, state.club.id]);

  const content = (
    <div className={embedded ? "w-full text-center flex flex-col h-full overflow-hidden pointer-events-auto" : `bg-[#14151e] w-full sm:max-w-3xl lg:max-w-4xl rounded-2xl p-3 sm:p-5 shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-white/[0.04] text-center pointer-events-auto relative cursor-default overflow-hidden ${activeTab === 'universe' ? 'h-[90vh]' : 'h-auto'} max-h-[92vh] flex flex-col`}>
      {!embedded && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/25 to-transparent pointer-events-none" />}
      {!embedded && (
        <button
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer z-10 border border-white/[0.04]"
        >
          <i className="fas fa-xmark text-xs" />
        </button>
      )}

      {/* Top Header - Compact single-line bar */}
      <div className="flex items-center justify-between gap-2.5 mb-2 shrink-0 pr-8 sm:pr-9">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border p-1.5 shrink-0 ${
            activeTab === 'universe'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-sky-500/10 border-sky-500/20'
          }`}>
            {activeTab === 'universe' ? (
              <i className="fas fa-arrows-up-down text-sm text-amber-400" />
            ) : currentLeagueInfo?.logo ? (
              <img
                src={currentLeagueInfo.logo}
                alt={`${currentLeagueInfo.name} logo`}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                className="w-5 h-5 object-contain drop-shadow"
              />
            ) : (
              <i className="fas fa-list-ol text-sm text-sky-400" />
            )}
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-tight truncate">
              {activeTab === 'universe'
                ? `${yearTag} Universe Movements`
                : `${yearTag} ${currentLeagueInfo.name}`}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
              {activeTab === 'universe'
                ? 'Continental Cups · Champions · Promotions · Relegations'
                : `${getCountryFlag(currentCountry)} ${currentCountry} · ${leagueTag} · Season Standings`}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#10121a] p-1 rounded-xl border border-white/[0.04] shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'standings'
                ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <i className="fas fa-table-list text-[10px]" />
            <span>Standings</span>
          </button>
          <button
            onClick={() => setActiveTab('universe')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'universe'
                ? 'bg-amber-500/[0.05] text-amber-300 border border-amber-500/20 shadow-sm'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <i className="fas fa-arrows-up-down text-[10px]" />
            <span>Movements</span>
            {universeMovements.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-medium tabular-nums ${
                activeTab === 'universe' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-white/[0.06] text-zinc-400'
              }`}>
                {universeMovements.filter(isKeyMovement).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'standings' && (
        <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0 text-left">
          {/* Standings Toolbar: Country, Division & Season Archive Selectors side by side */}
          <div className="flex items-center justify-between gap-2.5 mb-2.5 flex-wrap shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* League Country Selector Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  aria-label="Select League Country"
                  value={selectedCountry}
                  onChange={(e) => {
                    const newCountry = e.target.value;
                    setSelectedCountry(newCountry);
                    const maxT = getMaxTier(newCountry);
                    if (selectedTier > maxT) {
                      setSelectedTier(1);
                    }
                  }}
                  className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white text-[11px] font-medium py-1 pl-2.5 pr-6 rounded-lg border border-white/10 focus:outline-none focus:border-sky-400 transition cursor-pointer"
                >
                  {availableCountries.map((c) => {
                    const isMyCountry = (state.club.country || 'GER') === c;
                    return (
                      <option key={`c-opt-${c}`} value={c} className="bg-[#161722] text-white">
                        {getCountryFlag(c)} {countryLabels[c] || c}{isMyCountry ? ' (My League)' : ''}
                      </option>
                    );
                  })}
                </select>
                <i className="fas fa-chevron-down text-[8px] text-zinc-400 absolute right-2 pointer-events-none" />
              </div>

              {/* Division Selector Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  aria-label="Select Division"
                  value={effectiveTier}
                  onChange={(e) => setSelectedTier(Number(e.target.value))}
                  className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white text-[11px] font-medium py-1 pl-2.5 pr-6 rounded-lg border border-white/10 focus:outline-none focus:border-sky-400 transition cursor-pointer"
                >
                  {availableTiers.map((t) => {
                    const info = getLeagueInfo(t, selectedCountry);
                    const isMyLeague = (state.club.country || 'GER') === selectedCountry && (currentSelectedHist ? currentSelectedHist.tier : state.club.tier) === t;
                    return (
                      <option key={`tier-opt-${t}`} value={t} className="bg-[#161722] text-white">
                        {info.tag || `Tier ${t}`} · {info.name}{isMyLeague ? ' ★' : ''}
                      </option>
                    );
                  })}
                </select>
                <i className="fas fa-chevron-down text-[8px] text-zinc-400 absolute right-2 pointer-events-none" />
              </div>

              {/* Season Archive Selector Dropdown */}
              {availableYears.length > 1 ? (
                <div className="relative inline-flex items-center">
                  <select
                    aria-label="Select Season Year"
                    value={selectedYear}
                    onChange={(e) => {
                      const newYr = Number(e.target.value);
                      setSelectedYear(newYr);
                      const h = history.find((item) => item.year === newYr);
                      if (h && normalizeCountry(h.country || state.club.country || 'GER') === normalizeCountry(selectedCountry)) {
                        setSelectedTier(h.tier || 1);
                      } else if (newYr === state.year && normalizeCountry(state.club.country || 'GER') === normalizeCountry(selectedCountry)) {
                        setSelectedTier(state.club.tier);
                      }
                    }}
                    className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white text-[11px] font-medium py-1 pl-2.5 pr-6 rounded-lg border border-white/10 focus:outline-none focus:border-sky-400 transition cursor-pointer"
                  >
                    {availableYears.map((yr) => {
                      const isCurrentActive = yr === state.year && (!currentSelectedHist || currentSelectedHist.year !== yr);
                      return (
                        <option key={`standings-year-${yr}`} value={yr} className="bg-[#161722] text-white">
                          Season {yr} {isCurrentActive ? '(Active)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <i className="fas fa-chevron-down text-[8px] text-zinc-400 absolute right-2 pointer-events-none" />
                </div>
              ) : (
                <div className="px-2.5 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[11px] font-mono font-medium text-zinc-400">
                  Season {selectedYear}
                </div>
              )}

              {/* Quick Jump "My League" Button */}
              {(normalizeCountry(initialCountry) !== normalizeCountry(selectedCountry) || (currentSelectedHist ? currentSelectedHist.tier : initialTier) !== effectiveTier || initialYear !== selectedYear) && (
                <button
                  onClick={() => {
                    setSelectedYear(initialYear);
                    setSelectedCountry(initialCountry);
                    setSelectedTier(initialTier);
                  }}
                  className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
                  title="Reset to your active league and season"
                >
                  <i className="fas fa-rotate-left text-[9px]" />
                  <span>My League</span>
                </button>
              )}
            </div>

            <div className="text-[11px] font-mono text-zinc-400 hidden sm:flex items-center gap-1.5">
              <span className="text-zinc-300 font-semibold">{currentLeagueInfo.tag}</span>
              <span className="text-zinc-600">·</span>
              <span>{tableData.length} Clubs</span>
            </div>
          </div>

          {insolventClubInTable && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-3 text-left flex items-start gap-2.5 shadow-sm animate-modal-enter">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-base">
                <i className="fas fa-triangle-exclamation" />
              </div>
              <div className="flex-1 text-[12px] text-amber-200/90 leading-relaxed">
                <div className="font-semibold text-amber-400 text-[13px] mb-0.5">
                  Restructuring Notice
                </div>
                Insolvency restructuring reallocated {insolventClubInTable.name} to this league for financial consolidation.
              </div>
            </div>
          )}

          {/* Stakes & Mathematical Point Gaps Strip */}
          {stakes && stakes.leaderRow && (
            <div className="mb-2.5 px-3 py-2 rounded-xl bg-[#10121a] border border-white/[0.04] flex items-center justify-between text-xs font-mono flex-wrap gap-2 text-zinc-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-medium">Stakes:</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="font-semibold">1st (C)</span> {stakes.leaderRow.name} ({stakes.leaderRow.pts} pts)
                </span>
                {!isTier1 && stakes.secondRow && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="flex items-center gap-1 text-emerald-300">
                      <span className="font-semibold">2nd (P)</span> {stakes.secondRow.name} ({stakes.secondRow.pts} pts{stakes.leaderRow.pts - stakes.secondRow.pts > 0 ? `, -${stakes.leaderRow.pts - stakes.secondRow.pts} gap` : ''})
                    </span>
                  </>
                )}
                {!isTier1 && stakes.thirdRow && (hasPromotionPlayoffs || currentCountry === 'ESP' || currentCountry === 'SUI') && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="flex items-center gap-1 text-amber-200">
                      <span className="font-semibold">3rd (PO)</span> {stakes.thirdRow.name} ({stakes.thirdRow.pts} pts{stakes.secondRow ? `, -${stakes.secondRow.pts - stakes.thirdRow.pts} to P` : ''})
                    </span>
                  </>
                )}
              </div>

              {/* User Club Point Margin or Division Safety Line */}
              {stakes.userRow ? (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-medium">Your Margin:</span>
                  {tableData.every(r => r.pts === 0) ? (
                    <span className="text-sky-300 font-semibold flex items-center gap-1">
                      <i className="fas fa-calendar-check text-[10px]" />
                      <span>Pre-Season · Matchday 1 Pending</span>
                    </span>
                  ) : (stakes.isUserInDropZone || currentSelectedHist?.relegated || stakes.userRow.statusMarker === 'R') ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <i className="fas fa-arrow-down text-[10px]" />
                      <span>{currentSelectedHist?.relegated ? 'Relegated' : `Drop Zone (${stakes.gapToSafety ?? 0} pts to safety)`}</span>
                    </span>
                  ) : (stakes.isUserClinchedSafe || (currentSelectedHist && !currentSelectedHist.relegated)) ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <i className="fas fa-shield text-[10px]" />
                      <span>Safe (+{stakes.marginToSafety ?? 0} pts clear of drop)</span>
                    </span>
                  ) : stakes.marginToSafety !== undefined ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <i className="fas fa-triangle-exclamation text-[10px]" />
                      <span>Relegation Battle (+{stakes.marginToSafety} pts margin)</span>
                    </span>
                  ) : (
                    <span className="text-zinc-400">Position {stakes.userRow.pos}</span>
                  )}
                </div>
              ) : (
                !isMaxTier && stakes.safetyRow && stakes.dropZoneRow && (
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <span className="text-zinc-500 font-medium uppercase text-[10px]">Safety Line:</span>
                    <span>{stakes.safetyRow.pos}. {stakes.safetyRow.name} ({stakes.safetyRow.pts} pts)</span>
                    <span className="text-rose-400 font-semibold">vs</span>
                    <span className="text-rose-400">{stakes.dropZoneRow.pos}. {stakes.dropZoneRow.name} (Drop)</span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Table Container */}
          <div className="bg-[#14151e] rounded-2xl border border-white/[0.04] overflow-hidden shadow-lg flex flex-col text-left">
            <div className="overflow-x-auto custom-scrollbar overscroll-contain flex flex-col">
              <div className="min-w-[340px] flex items-center py-2.5 px-3 bg-[#10121a] border-b border-white/[0.04] text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider shrink-0">
                <div className="w-8 text-center shrink-0">#</div>
                <div className="flex-1 px-2 min-w-0">Club</div>
                <div className="w-14 text-center shrink-0">W-D-L</div>
                <div className="w-12 text-center shrink-0">GD</div>
                <div className="w-12 text-right pr-1 shrink-0">PTS</div>
              </div>

              <div className="min-w-[340px] overflow-y-auto custom-scrollbar max-h-[60vh] overscroll-contain">
                {tableData.map((r, i) => {
                const isPromo = i < 2 || r.statusMarker === 'P';
                const isPlayoff = r.statusMarker === 'PO' || (hasPromotionPlayoffs && i >= 2 && i < 6);
                const isRelegation = !isMaxTier && (r.statusMarker === 'R' || i >= tableData.length - 2);
                const isPlayer = (r.isUser || r.name === state.club.name) && normalizeCountry(state.club.country || 'GER') === normalizeCountry(selectedCountry);
                
                const rowBg = isPlayer
                  ? 'bg-sky-500/[0.08] text-white font-medium'
                  : i % 2 === 0 ? 'bg-[#14151e]' : 'bg-[#181924]';

                return (
                  <div
                    key={`${r.name}-${i}`}
                    className={`group relative flex items-center py-2.5 px-3 border-b border-white/[0.03] transition-colors ${rowBg}`}
                  >
                    {/* Status indicator line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-90 ${
                      isPlayer 
                        ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                        : isPromo && isTier1 ? 'bg-amber-400'
                        : isPromo && !isTier1 ? 'bg-emerald-400'
                        : isPlayoff ? 'bg-amber-400'
                        : isRelegation ? 'bg-rose-500'
                        : 'bg-transparent'
                    }`} />

                    <div className={`w-8 text-center font-mono font-semibold text-xs shrink-0 tabular-nums ${
                      isPlayer ? 'text-sky-300 font-semibold'
                      : isPromo ? (isTier1 ? 'text-amber-400' : 'text-emerald-400')
                      : isRelegation ? 'text-rose-400'
                      : 'text-zinc-500'
                    }`}>
                      {r.pos}.
                    </div>

                    <div className="flex-1 flex items-center gap-2 overflow-hidden px-2 min-w-0">
                      <ClubLogo
                        name={r.name}
                        color={r.color}
                        logo={r.logo}
                        fallbackLogo={r.fallbackLogo}
                        alt=""
                        className="w-5 h-5 object-contain shrink-0 select-none"
                        fallbackClassName="w-5 h-5 text-[8px] select-none"
                      />
                      <div className={`text-xs truncate flex items-center gap-1.5 min-w-0 ${isPlayer ? 'text-white font-semibold' : 'text-zinc-300 font-medium'}`}>
                        <span className="truncate">{r.name}</span>
                        {isPlayer && (
                          <span className="px-1.5 py-0.2 rounded-md bg-sky-500/10 border border-sky-400/20 text-[9px] font-medium uppercase text-sky-300 shrink-0">
                            YOU
                          </span>
                        )}
                        {r.statusMarker && (
                          <span className="text-[10px] font-semibold tracking-tight shrink-0 font-mono" style={{ 
                            color: r.statusMarker === 'C' ? '#f59e0b' : r.statusMarker === 'P' ? '#10b981' : r.statusMarker === 'PO' ? '#fbbf24' : r.statusMarker === 'R' ? '#f43f5e' : '#38bdf8' 
                          }}>
                            ({r.statusMarker})
                          </span>
                        )}
                        {isReserveClub(r.name) && (
                          <span className="px-1 py-0.2 text-[8px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded uppercase tracking-wider shrink-0">
                            Res.
                          </span>
                        )}
                        {(r.pointsDeducted || 0) > 0 && (
                          <span className="px-1 py-0.2 text-[8px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/20 rounded uppercase tracking-wider shrink-0 tabular-nums">
                            -{r.pointsDeducted} Pts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-14 flex justify-center gap-0.5 font-mono text-[11px] text-zinc-400 shrink-0 tabular-nums">
                      <span className="w-3.5 text-center tabular-nums">{r.w}</span>
                      <span className="w-3.5 text-center tabular-nums">{r.d}</span>
                      <span className="w-3.5 text-center tabular-nums">{r.l}</span>
                    </div>

                    <div className={`w-12 text-center font-mono font-medium text-xs shrink-0 tabular-nums ${
                      parseInt(r.gd) > 0 ? 'text-emerald-400' : parseInt(r.gd) < 0 ? 'text-rose-400' : 'text-zinc-500'
                    }`}>
                      {r.gd}
                    </div>

                    <div className={`w-12 text-right pr-1 font-mono font-semibold text-sm shrink-0 tabular-nums leading-none ${isPlayer ? 'text-sky-300' : 'text-white'}`}>
                      {r.pts}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          {/* Table Legend */}
          <div className="mt-2.5 bg-[#10121a] rounded-xl p-2 border border-white/[0.04] flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] text-zinc-400 font-medium shrink-0">
            <div className="flex items-center gap-1"><span className="text-amber-400 font-semibold">(C)</span> {isTier1 ? 'Champions (EHF CL)' : 'Champions (Promoted)'}</div>
            {!isTier1 && <div className="flex items-center gap-1"><span className="text-emerald-400 font-semibold">(P)</span> Direct Promotion (1st-2nd)</div>}
            {(hasPromotionPlayoffs || selectedTier > 1 || currentCountry === 'ESP' || currentCountry === 'SUI') && (
              <div className="flex items-center gap-1"><span className="text-amber-300 font-semibold">(PO)</span> Playoff Contender</div>
            )}
            {isTier1 && <div className="flex items-center gap-1"><span className="text-sky-400 font-semibold">(Q)</span> European Qualification</div>}
            {!isMaxTier && <div className="flex items-center gap-1"><span className="text-rose-400 font-semibold">(R)</span> Relegation Drop Zone</div>}
            {isMaxTier && <div className="flex items-center gap-1"><span className="text-zinc-500 font-medium">🛡️</span> Division Floor (No Relegation)</div>}
          </div>
        </div>
      )}

      {activeTab === 'universe' && (
        <div className="flex flex-col flex-1 min-h-0 text-left">
          {/* Universe Movements Filter Bar: Core Toggle Buttons on Left, Dropdowns on Right */}
          <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-white/[0.04] mb-2.5 flex-wrap shrink-0">
            {/* Left: Five Core Toggle Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setUniverseFilter('headlines')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  universeFilter === 'headlines'
                    ? 'bg-amber-500/[0.05] text-amber-300 border border-amber-500/20 shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-amber-300 border border-white/[0.04]'
                }`}
              >
                <span>⭐ Headlines</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-medium tabular-nums ${
                  universeFilter === 'headlines' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-white/[0.06] text-zinc-400'
                }`}>
                  {universeMovements.filter(isKeyDramaMovement).length}
                </span>
              </button>

              <button
                onClick={() => setUniverseFilter('domestic')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  universeFilter === 'domestic'
                    ? 'bg-emerald-500/[0.05] text-emerald-300 border border-emerald-500/20 shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-emerald-300 border border-white/[0.04]'
                }`}
              >
                <span>🏟️ Domestic</span>
                <span className="text-[10px] opacity-75 tabular-nums">
                  ({universeMovements.filter(m => m.type === 'champion' || m.type === 'promotion' || m.type === 'relegation' || m.type === 'insolvency_relegation' || m.type === 'takeover').length})
                </span>
              </button>

              <button
                onClick={() => setUniverseFilter('cups')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  universeFilter === 'cups'
                    ? 'bg-purple-500/[0.05] text-purple-300 border border-purple-500/20 shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-purple-300 border border-white/[0.04]'
                }`}
              >
                <span>🏆 Cups</span>
                <span className="text-[10px] opacity-75 tabular-nums">
                  ({universeMovements.filter(m => m.type === 'intl_cup').length})
                </span>
              </button>

              <button
                onClick={() => setUniverseFilter('career')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  universeFilter === 'career'
                    ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-sky-300 border border-white/[0.04]'
                }`}
              >
                <span>👤 Career</span>
                <span className="text-[10px] opacity-75 tabular-nums">
                  ({universeMovements.filter(m => m.clubName === state.club.name || m.clubId === String(state.club.id) || normalizeCountry(m.country || 'GER') === userCountry).length})
                </span>
              </button>

              <button
                onClick={() => setUniverseFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  universeFilter === 'all'
                    ? 'bg-white/[0.08] text-white border border-white/20 shadow-sm'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.04]'
                }`}
              >
                <span>All</span>
                <span className="text-[10px] opacity-75 tabular-nums">
                  ({universeMovements.length})
                </span>
              </button>
            </div>

            {/* Right: Year and Cup Region Dropdowns */}
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              {/* Region / Country Selector */}
              <div className="relative inline-flex items-center">
                <select
                  aria-label="Filter Region"
                  value={universeRegion}
                  onChange={(e) => setUniverseRegion(e.target.value)}
                  className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white text-[11px] font-medium py-1 pl-2.5 pr-6 rounded-lg border border-white/10 focus:outline-none focus:border-amber-400 transition cursor-pointer"
                >
                  <option value="all" className="bg-[#161722] text-white">All Regions</option>
                  {availableUniverseRegions.map((regionCode) => (
                    <option key={`region-${regionCode}`} value={regionCode} className="bg-[#161722] text-white">
                      {getCountryFlag(regionCode)} {regionCode}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down text-[8px] text-zinc-400 absolute right-2 pointer-events-none" />
              </div>

              {/* Year Selector */}
              <div className="relative inline-flex items-center">
                <select
                  aria-label="Filter Season Year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white text-[11px] font-medium py-1 pl-2.5 pr-6 rounded-lg border border-white/10 focus:outline-none focus:border-amber-400 transition cursor-pointer"
                >
                  {availableYears.map((yr) => {
                    const isCurrentActive = yr === state.year && (!currentSelectedHist || currentSelectedHist.year !== yr);
                    return (
                      <option key={`univ-year-${yr}`} value={yr} className="bg-[#161722] text-white">
                        Season {yr} {isCurrentActive ? '(Active)' : ''}
                      </option>
                    );
                  })}
                </select>
                <i className="fas fa-chevron-down text-[8px] text-zinc-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Movements List - Fully flexible, fills all available modal height */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1">
            {filteredMovements.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No universe movements found for this filter. Simulate a season to observe European champions, international cup winners, and relegation drama!
              </div>
            ) : (
              filteredMovements.map((m) => {
                const isPromo = m.type === 'promotion';
                const isInsolvency = m.type === 'insolvency_relegation';
                const isTakeover = m.type === 'takeover';
                const isChampion = m.type === 'champion';
                const isIntlCup = m.type === 'intl_cup';
                const isUserClub = m.clubName === state.club.name || m.clubId === String(state.club.id);

                let effectiveFrom = m.fromTier;
                let effectiveTo = m.toTier;
                if (m.type === 'relegation' || m.type === 'insolvency_relegation') {
                  if (effectiveTo <= effectiveFrom) {
                    effectiveTo = effectiveFrom + 1;
                  }
                } else if (m.type === 'promotion') {
                  if (effectiveTo >= effectiveFrom && effectiveFrom > 1) {
                    effectiveTo = effectiveFrom - 1;
                  }
                }
                const fromLeague = getLeagueInfo(effectiveFrom, m.country);
                let toLeague = getLeagueInfo(effectiveTo, m.country);
                if ((m.type === 'relegation' || m.type === 'insolvency_relegation') && toLeague.name === fromLeague.name) {
                  toLeague = getLeagueInfo(effectiveFrom + 1, m.country);
                } else if (m.type === 'promotion' && toLeague.name === fromLeague.name && effectiveFrom > 1) {
                  toLeague = getLeagueInfo(effectiveFrom - 1, m.country);
                }

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition gap-2 ${
                      isUserClub
                        ? 'bg-sky-500/[0.05] border-sky-500/20 shadow-sm'
                        : isIntlCup
                        ? 'bg-amber-500/[0.05] border-amber-500/20 shadow-sm'
                        : isChampion
                        ? 'bg-amber-500/[0.05] border-amber-500/20'
                        : isTakeover
                        ? 'bg-purple-500/[0.05] border-purple-500/20'
                        : isPromo
                        ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                        : isInsolvency
                        ? 'bg-amber-500/[0.05] border-amber-500/20'
                        : 'bg-rose-500/[0.05] border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ClubLogo
                        name={m.clubName}
                        color={m.clubColor}
                        logo={m.clubLogo}
                        className="w-6 h-6 object-contain shrink-0"
                      />
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold truncate ${isUserClub ? 'text-sky-200' : 'text-white'}`}>
                            {m.clubName}
                          </span>
                          {isUserClub && (
                            <span className="px-1.5 py-0.2 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[9px] font-semibold uppercase">
                              YOUR CLUB
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {getCountryFlag(m.country)} {m.country}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          {isIntlCup ? (() => {
                            const mId = String(m.id || '').toLowerCase();
                            const mTitle = String(m.cupTitle || '').toLowerCase();
                            const isCwcMov = mId.endsWith('-cup-cwc') || mTitle.includes('super globe');
                            const isRegMov = mId.endsWith('-cup-reg') || mTitle.includes('regional') || mTitle.includes('amateur');
                            const isEuroMov = mId.endsWith('-cup-cl') || mId.endsWith('-cup-el') || mId.endsWith('-cup-ecl') || mTitle.includes('champions league') || mTitle.includes('european league') || mTitle.includes('european cup') || mTitle.includes('americas') || mTitle.includes('north american');
                            const matchedRun = (state.cupRunResults || []).find((cr: any) => {
                              if (cr.year !== m.year || !cr.winnerName) return false;
                              if (cr.winnerName.trim().toLowerCase() !== (m.clubName || '').trim().toLowerCase()) return false;
                              if (isCwcMov) return cr.id === 'cwc';
                              if (isRegMov) return cr.id === 'reg_cup';
                              if (isEuroMov) return cr.id === 'euro_cup' || cr.id === 'cl' || cr.id === 'el' || cr.id === 'ecl';
                              return cr.id === 'nat_cup';
                            });
                            const runnerUpLabel = matchedRun?.runnerUpName;
                            return (
                              <span className="font-semibold text-amber-300 flex items-center gap-1.5 flex-wrap">
                                <i className="fas fa-trophy text-[11px] text-amber-400" />
                                <span>Crowned {m.cupTitle} Winners!</span>
                                {runnerUpLabel && (
                                  <span className="text-zinc-400 font-normal text-[10px]">
                                    (def. {runnerUpLabel} in Final)
                                  </span>
                                )}
                              </span>
                            );
                          })() : isChampion ? (
                            <span className="font-semibold text-amber-300 flex items-center gap-1">
                              <i className="fas fa-trophy text-[10px] text-amber-400" />
                              <span>{fromLeague.name} Champions</span>
                            </span>
                          ) : isTakeover ? (
                            <span className="font-semibold text-purple-300 flex items-center gap-1">
                              <i className="fas fa-sack-dollar text-[10px] text-purple-400" />
                              <span>{fromLeague.name} · {m.cupTitle || 'Tycoon Takeover'}</span>
                            </span>
                          ) : (
                            <>
                              <span>{fromLeague.name}</span>
                              <i className="fas fa-arrow-right text-[9px] text-zinc-500" />
                              <span className={`font-medium ${isInsolvency ? 'text-amber-200' : 'text-zinc-200'}`}>{toLeague.name}</span>
                            </>
                          )}
                        </div>
                        {isInsolvency && (
                          <div className="text-[10px] text-amber-400/80 font-medium flex items-center gap-1 mt-0.5">
                            <i className="fas fa-triangle-exclamation text-[9px]" />
                            <span>Licensing revocation · Administrative demotion</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                      {m.isCinderella && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-lg font-medium bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 flex items-center gap-1 shrink-0">
                          <span>✨</span>
                          <span>Cinderella</span>
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider border shrink-0 ${
                        isIntlCup
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 shadow-sm'
                          : isChampion
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : isTakeover
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : isPromo
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : isInsolvency
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        {isIntlCup ? `👑 ${m.cupTitle || 'Trophy'}` : isChampion ? '🏆 Champion' : isTakeover ? '💰 Takeover' : isPromo ? '⬆️ Promoted' : isInsolvency ? '⚠️ Demoted' : '⬇️ Relegated'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {!embedded && (
        <button
          aria-label="Close modal"
          onClick={onClose}
          className="w-full mt-2.5 bg-white/[0.05] hover:bg-white/[0.10] text-zinc-200 hover:text-white font-semibold text-xs py-2 rounded-xl transition-all active:scale-[0.99] border border-white/[0.08] cursor-pointer shrink-0"
        >
          Close
        </button>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center p-2 sm:p-4 justify-center z-[10000] backdrop-blur-2xl transition-all cursor-pointer"
    >
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-3xl lg:max-w-4xl flex justify-center ${activeTab === 'universe' ? 'h-full max-h-[92vh]' : 'h-auto max-h-[92vh]'}`}>
        {content}
      </div>
    </motion.div>
  );
};