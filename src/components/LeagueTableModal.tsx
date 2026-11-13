import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';

import { Club, GameState, Language, UniverseMovement } from '../types';
import { getLeagueInfo, getDomesticCupInfo, getDomesticSupercupInfo, isReserveClub, getMaxTier, getCountryFlag, normalizeCountry } from '../data/gameConstants';
import { generateLeagueTable, calculateLeagueStakes } from '../utils/leagueTableGenerator';
import { ALL_CLUBS } from '../data/clubsData';
import { isAnyModActive } from '../utils/modManager';
import { getAlmanacEntries, getAlmanacAvailableYears, AlmanacCompetitionFilter } from '../data/almanacHistory';
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
  const [activeTab, setActiveTab] = useState<'standings' | 'almanac'>('standings');
  const [almanacComp, setAlmanacComp] = useState<AlmanacCompetitionFilter>('league');
  const [almanacYear, setAlmanacYear] = useState<number | 'all'>('all');
  const [almanacTier, setAlmanacTier] = useState<number>(1);

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
        setAlmanacTier(targetTier);
      } else if (tHist?.tier) {
        setSelectedTier(tHist.tier);
        setAlmanacTier(tHist.tier);
      }
    } else if (targetTier !== undefined) {
      setSelectedTier(targetTier);
      setAlmanacTier(targetTier);
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
    ITA: 'Italy',
    ROU: 'Romania',
    ENG: 'England',
    USA: 'United States',
    ECU: 'Ecuador'
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
        const isNonEuroQualKey =
          k === 'reg_cup' ||
          k === 'reg' ||
          k === 'cwc' ||
          k === 'dom_supercup' ||
          k === 'supercup' ||
          k === 'sc' ||
          k === 'esc';
        if (!isNonEuroQualKey && val?.winnerName && (!val.year || val.year === selectedYear)) {
          // nat_cup only qualifies a club in the user's domestic country; European cups qualify in any country if that club is in selectedCountry
          if (k === 'nat_cup' && !isDomesticCountry) return;
          qualifyingWinners.add(String(val.winnerName).trim().toLowerCase());
        }
      });
      seasonCupMovements.forEach((m: any) => {
        const title = String(m.cupTitle || '').toLowerCase();
        const mId = String(m.id || '').toLowerCase();
        const isSupercup =
          mId.endsWith('-cup-sc') ||
          mId.endsWith('-cup-esc') ||
          title.includes('supercup') ||
          title.includes('super cup') ||
          title.includes('supercopa') ||
          title.includes('trophée des champions');
        const isRegOrWorld = isSupercup || title.includes('amateur') || title.includes('regional') || title.includes('super globe');
        const isContinental = !isSupercup && (title.includes('champions league') || title.includes('european league') || title.includes('european cup') || title.includes('ehf'));
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

  const almanacMaxTiers = getMaxTier(selectedCountry);
  const almanacTiersList = Array.from({ length: almanacMaxTiers }, (_, i) => i + 1);
  const effectiveAlmanacTier: number = Math.min(almanacTier, almanacMaxTiers);

  const almanacAvailableYears = useMemo(() => {
    return getAlmanacAvailableYears(state);
  }, [state]);

  useEffect(() => {
    if (almanacYear !== 'all' && !almanacAvailableYears.includes(almanacYear)) {
      setAlmanacYear('all');
    }
  }, [almanacYear, almanacAvailableYears]);

  const almanacNationalCupName = useMemo(() => {
    return getDomesticCupInfo(selectedCountry, 1).name;
  }, [selectedCountry]);

  const almanacSupercupName = useMemo(() => {
    return getDomesticSupercupInfo(selectedCountry, isAnyModActive()).name || 'Supercup';
  }, [selectedCountry]);

  const almanacEntries = useMemo(() => {
    return getAlmanacEntries({
      state,
      clubsDb,
      country: selectedCountry,
      tier: effectiveAlmanacTier,
      year: almanacYear,
      competition: almanacComp,
    });
  }, [state, clubsDb, selectedCountry, effectiveAlmanacTier, almanacYear, almanacComp]);

  const almanacChampionHeader = useMemo(() => {
    if (almanacComp === 'league') {
      return `${getLeagueInfo(effectiveAlmanacTier, selectedCountry).name.toUpperCase()} CHAMPION`;
    }
    if (almanacComp === 'nat_cup') return `${almanacNationalCupName.toUpperCase()} CHAMPION`;
    if (almanacComp === 'supercup') return `${almanacSupercupName.toUpperCase()} CHAMPION`;
    if (almanacComp === 'reg_cup') return 'REGIONAL CUP CHAMPION';
    if (almanacComp === 'cl') return 'CHAMPIONS CUP CHAMPION';
    if (almanacComp === 'euro_cup') return 'EURO CUP CHAMPION';
    if (almanacComp === 'cwc') return 'GLOBAL CLUB CUP CHAMPION';
    return 'COMPETITION CHAMPION';
  }, [almanacComp, effectiveAlmanacTier, selectedCountry, almanacNationalCupName, almanacSupercupName]);

  const content = (
    <div className={embedded ? "w-full text-center flex flex-col h-full overflow-hidden pointer-events-auto p-2.5 sm:p-4" : `bg-[#14151e] w-full sm:max-w-3xl lg:max-w-4xl rounded-2xl p-3 sm:p-5 shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-white/[0.04] text-center pointer-events-auto relative cursor-default overflow-hidden ${activeTab === 'almanac' ? 'h-[90vh]' : 'h-auto'} max-h-[92vh] flex flex-col`}>
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

      {/* Top Header - Responsive bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5 shrink-0 pr-8 sm:pr-9">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border p-1.5 shrink-0 ${
            activeTab === 'almanac'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-sky-500/10 border-sky-500/20'
          }`}>
            {activeTab === 'almanac' ? (
              <i className="fas fa-book-bookmark text-sm text-amber-400" />
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
              {activeTab === 'almanac'
                ? 'Historical Almanac & Roll of Honour'
                : `${yearTag} ${currentLeagueInfo.name}`}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
              {activeTab === 'almanac'
                ? `${getCountryFlag(currentCountry)} ${countryLabels[currentCountry] || currentCountry} · League Pyramid & Cup Archive (1950–Present)`
                : `${getCountryFlag(currentCountry)} ${currentCountry} · ${leagueTag} · Season Standings`}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#10121a] p-1 rounded-xl border border-white/[0.04] shrink-0 gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 sm:flex-initial justify-center px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'standings'
                ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <i className="fas fa-table-list text-[10px]" />
            <span>Standings</span>
          </button>
          <button
            onClick={() => setActiveTab('almanac')}
            className={`flex-1 sm:flex-initial justify-center px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'almanac'
                ? 'bg-amber-500/[0.05] text-amber-300 border border-amber-500/20 shadow-sm'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <i className="fas fa-book-bookmark text-[10px]" />
            <span>Almanac</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-medium tabular-nums ${
              activeTab === 'almanac' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-white/[0.06] text-zinc-400'
            }`}>
              {almanacEntries.length}
            </span>
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
                  onChange={(e) => {
                    const nextTier = Number(e.target.value);
                    setSelectedTier(nextTier);
                    setAlmanacTier(nextTier);
                  }}
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

      {activeTab === 'almanac' && (
        <div className="flex flex-col flex-1 min-h-0 text-left">
          {/* Almanac Filter Card */}
          <div className="bg-[#10121a] border border-white/[0.06] rounded-2xl p-3.5 sm:p-4 mb-3 shrink-0 shadow-md">
            {/* Row 1: Country, Tier, All Years Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3.5">
              {/* Country Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  COUNTRY
                </label>
                <div className="relative">
                  <select
                    aria-label="Almanac Country"
                    value={selectedCountry}
                    onChange={(e) => {
                      const nextCountry = e.target.value;
                      setSelectedCountry(nextCountry);
                      const maxT = getMaxTier(nextCountry);
                      if (almanacTier > maxT) {
                        setAlmanacTier(1);
                      }
                    }}
                    className="w-full appearance-none bg-[#161822] hover:bg-[#1b1e2b] text-white text-xs sm:text-sm font-semibold py-2 pl-3 pr-8 rounded-xl border border-white/10 focus:outline-none focus:border-amber-400/60 transition cursor-pointer"
                  >
                    {availableCountries.map((c) => (
                      <option key={`alm-c-${c}`} value={c} className="bg-[#161822] text-white">
                        {getCountryFlag(c)} {countryLabels[c] || c}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down text-[10px] text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Tier Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  TIER
                </label>
                <div className="relative">
                  <select
                    aria-label="Almanac Tier"
                    value={effectiveAlmanacTier}
                    onChange={(e) => {
                      const nextTier = Number(e.target.value);
                      setAlmanacTier(nextTier);
                      setSelectedTier(nextTier);
                      if (almanacComp !== 'league' && almanacComp !== 'all') {
                        setAlmanacComp('league');
                      }
                    }}
                    className="w-full appearance-none bg-[#161822] hover:bg-[#1b1e2b] text-white text-xs sm:text-sm font-semibold py-2 pl-3 pr-8 rounded-xl border border-white/10 focus:outline-none focus:border-amber-400/60 transition cursor-pointer"
                  >
                    {almanacTiersList.map((t) => {
                      const info = getLeagueInfo(t, selectedCountry);
                      return (
                        <option key={`alm-t-${t}`} value={t} className="bg-[#161822] text-white">
                          Tier {t} — {info.name}
                        </option>
                      );
                    })}
                  </select>
                  <i className="fas fa-chevron-down text-[10px] text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  YEAR
                </label>
                <div className="relative">
                  <select
                    aria-label="Almanac Year"
                    value={almanacYear}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlmanacYear(val === 'all' ? 'all' : Number(val));
                    }}
                    className="w-full appearance-none bg-[#161822] hover:bg-[#1b1e2b] text-white text-xs sm:text-sm font-semibold py-2 pl-3 pr-8 rounded-xl border border-white/10 focus:outline-none focus:border-amber-400/60 transition cursor-pointer tabular-nums"
                  >
                    <option value="all" className="bg-[#161822] text-white">
                      All Years
                    </option>
                    {almanacAvailableYears.map((yr) => (
                      <option key={`alm-yr-${yr}`} value={yr} className="bg-[#161822] text-white">
                        {yr}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down text-[10px] text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Competition Sub-Filter Bar */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-0.5">
                COMPETITION:
              </span>
              {(
                [
                  { id: 'league', label: 'League Pyramid' },
                  { id: 'nat_cup', label: almanacNationalCupName },
                  {
                    id: 'supercup',
                    label: almanacSupercupName.toLowerCase().includes('super')
                      ? almanacSupercupName
                      : `${almanacSupercupName} (Supercup)`,
                  },
                  { id: 'reg_cup', label: 'Regional Cup' },
                  { id: 'cl', label: 'Champions Cup' },
                  { id: 'euro_cup', label: 'Euro Cup' },
                  { id: 'cwc', label: 'Global Club Cup' },
                  { id: 'all', label: 'All Competitions' },
                ] as { id: AlmanacCompetitionFilter; label: string }[]
              ).map((item) => {
                const isActive = almanacComp === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAlmanacComp(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-black font-bold border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-[#161822] hover:bg-white/[0.06] text-zinc-200 font-medium border border-white/[0.08]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Almanac Table Card */}
          <div className="bg-[#10121a] rounded-2xl border border-white/[0.06] overflow-hidden shadow-lg flex-1 min-h-0 flex flex-col">
            <div className="overflow-x-auto custom-scrollbar overscroll-contain flex-1 min-h-0 flex flex-col">
              {/* Table Header */}
              <div className="min-w-[340px] grid grid-cols-12 items-center py-3 px-4 bg-[#141620] border-b border-white/[0.06] text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider shrink-0">
                <div className="col-span-2">YEAR</div>
                <div className="col-span-5 truncate pr-2">{almanacChampionHeader}</div>
                <div className="col-span-3 truncate pr-2">COMPETITION</div>
                <div className="col-span-2 text-right">
                  {almanacComp === 'league' ? 'POINTS' : almanacComp === 'all' ? 'PTS / TITLE' : 'TITLE'}
                </div>
              </div>

              {/* Table Body */}
              <div className="min-w-[340px] overflow-y-auto custom-scrollbar flex-1 min-h-0 divide-y divide-white/[0.04] overscroll-contain">
                {almanacEntries.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    {almanacComp === 'cl' && typeof almanacYear === 'number' && almanacYear < 1957
                      ? 'The Champions Cup was inaugurated in 1957. Select 1957 or later, or switch to All Years.'
                      : almanacComp === 'euro_cup' && typeof almanacYear === 'number' && almanacYear < 1982
                        ? 'The Euro Cup was inaugurated in 1982. Select 1982 or later, or switch to All Years.'
                        : almanacComp === 'cwc' && typeof almanacYear === 'number' && almanacYear < 1997
                          ? 'The Global Club Cup was inaugurated in 1997. Select 1997 or later, or switch to All Years.'
                          : 'No historical records found for this filter yet. Complete the current season to record live history!'}
                  </div>
                ) : (
                  almanacEntries.map((entry) => {
                    const canInspectTable = entry.source === 'Live' && entry.competitionType === 'league';
                    return (
                    <div
                      key={entry.id}
                      onClick={
                        canInspectTable
                          ? () => {
                              setSelectedCountry(entry.country);
                              setSelectedTier(entry.tier);
                              setAlmanacTier(entry.tier);
                              setSelectedYear(entry.year);
                              setActiveTab('standings');
                            }
                          : undefined
                      }
                      title={canInspectTable ? `Click to view full ${entry.year} ${entry.competitionName} standings` : undefined}
                      className={`grid grid-cols-12 items-center py-3 px-4 transition-colors ${
                        canInspectTable ? 'cursor-pointer' : ''
                      } ${
                        entry.isUserClub
                          ? 'bg-sky-500/[0.08] hover:bg-sky-500/[0.12]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Year */}
                      <div className="col-span-2 font-mono font-bold text-sm sm:text-base text-amber-400 tabular-nums">
                        {entry.year}
                      </div>

                      {/* Champion Club & Coach */}
                      <div className="col-span-5 flex items-center gap-3 min-w-0 pr-2">
                        <ClubLogo
                          name={entry.clubName}
                          color={entry.clubColor}
                          logo={entry.clubLogo}
                          fallbackLogo={entry.clubFallbackLogo}
                          alt=""
                          className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 select-none"
                          fallbackClassName="w-8 h-8 sm:w-9 sm:h-9 text-[10px] shrink-0 select-none"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-white font-bold text-xs sm:text-sm truncate">
                              {entry.clubName}
                            </span>
                            {entry.isUserClub && (
                              <span className="px-1.5 py-0.2 rounded bg-sky-500/15 border border-sky-400/30 text-[9px] font-semibold uppercase text-sky-300 shrink-0">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-zinc-400 text-[11px] sm:text-xs truncate">
                            Coach: <span className="text-zinc-300">{entry.coachName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Competition & Tier/Source */}
                      <div className="col-span-3 min-w-0 pr-2">
                        <div className="text-amber-400 font-semibold text-xs sm:text-sm truncate">
                          {entry.competitionName}
                        </div>
                        <div className="text-zinc-500 text-[11px] font-medium truncate">
                          {entry.subtitle}
                        </div>
                      </div>

                      {/* Points / Status */}
                      <div className="col-span-2 text-right font-mono tabular-nums">
                        {entry.points !== undefined ? (
                          <div>
                            <span className="text-emerald-400 font-bold text-sm sm:text-base">
                              {entry.points}
                            </span>{' '}
                            <span className="text-zinc-400 text-[10px] sm:text-xs font-normal">
                              PTS
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                            <i className="fas fa-trophy text-amber-400 text-[10px]" />
                            <span>{entry.statusLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
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
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-3xl lg:max-w-4xl flex justify-center ${activeTab === 'almanac' ? 'h-full max-h-[92vh]' : 'h-auto max-h-[92vh]'}`}>
        {content}
      </div>
    </motion.div>
  );
};