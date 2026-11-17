import { motion } from 'motion/react';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Club, GameMode, Language } from '../types';
import {
  COUNTRIES,
  LEAGUES,
  getLeagueInfo,
  PHILOSOPHIES,
  TACTICS,
  isReserveClub,
  getMaxTier,
  getClubHistoricContext,
  getStartingBudget,
  formatMoney,
  formatNum,
  getClubHomeArena,
} from '../data/gameConstants';
import { ClubLogo } from './ClubLogo';
import { CompetitionLogo } from './CompetitionLogo';
import { ModSelectionModal } from './ModSelectionModal';
import { isRealDataModActive, getCustomDb, REALDATA_MOD_NAME } from '../utils/modManager';
import { generateBoardRoadmap } from '../utils/roadmapManager';

interface OnboardingProps {
  lang: Language;
  clubsDb: Club[];
  setClubsDb?: (db: Club[]) => void;
  showToast?: (msg: string, type: string) => void;
  onStartGame: (params: {
    club: Club;
    managerName: string;
    startYear: number;
    tactic: string;
    nationality: string;
    mode: GameMode;
  }) => void;
  onShowLeaderboard: () => void;
}

const getGoalCategoryMeta = (targetType: string) => {
  switch (targetType) {
    case 'championship_dominance':
      return { label: 'Championship Directive', icon: 'fa-trophy text-[#B45309]' };
    case 'european_glory':
      return { label: 'Continental Glory', icon: 'fa-star text-[#B45309]' };
    case 'promotion_tier':
      return { label: 'Promotion Mandate', icon: 'fa-arrow-trend-up text-[#15803D]' };
    case 'top_four':
      return { label: 'High Table Target', icon: 'fa-medal text-[#0369A1]' };
    case 'solidify_tier':
      return { label: 'League Retention', icon: 'fa-shield-halved text-[#0369A1]' };
    case 'arena_expansion':
      return { label: 'Arena Expansion', icon: 'fa-building text-[#6D28D9]' };
    case 'academy_growth':
      return { label: 'Youth Academy', icon: 'fa-graduation-cap text-[#15803D]' };
    case 'medical_growth':
      return { label: 'Medical Center', icon: 'fa-heart-pulse text-[#BE123C]' };
    case 'fanbase_growth':
      return { label: 'Community Growth', icon: 'fa-users text-[#B45309]' };
    case 'financial_surplus':
      return { label: 'Fiscal Governance', icon: 'fa-vault text-[#15803D]' };
    default:
      return { label: 'Board Directive', icon: 'fa-bullseye text-[#B45309]' };
  }
};

export const Onboarding: React.FC<OnboardingProps> = ({
  setClubsDb,
  showToast,
  lang,
  clubsDb,
  onStartGame,
  onShowLeaderboard,
}) => {
  const isDe = false;

  const [step, setStep] = useState<number>(1);
  const [mode, setMode] = useState<GameMode>('realistic');
  const [managerName, setManagerName] = useState<string>('');
  const [nameError, setNameError] = useState<boolean>(false);
  const [startYear, setStartYear] = useState<number>(2026);
  const [showModModal, setShowModModal] = useState<boolean>(false);
  const [modModalTab, setModModalTab] = useState<'changelog' | 'mods'>('changelog');
  const [nationality, setNationality] = useState<string>('ALL');
  const [tactic, setTactic] = useState<string>('Fast Break');
  const [tierFilter, setTierFilter] = useState<number | 'all'>('all');
  const [continentFilter, setContinentFilter] = useState<'ALL' | 'EUROPE'>('ALL');
  const [startingOffers, setStartingOffers] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [modVersion, setModVersion] = useState(0);

  useEffect(() => {
    const onModChange = () => setModVersion((v) => v + 1);
    window.addEventListener('mod-state-change', onModChange);
    window.addEventListener('storage', onModChange);
    return () => {
      window.removeEventListener('mod-state-change', onModChange);
      window.removeEventListener('storage', onModChange);
    };
  }, []);

  const t = (en: string, _de?: string) => en;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  useEffect(() => {
    const maxT = getMaxTier(nationality);
    if (tierFilter !== 'all' && typeof tierFilter === 'number' && tierFilter > maxT) {
      setTierFilter('all');
    }
  }, [nationality, tierFilter]);

  const availableCountries = useMemo(() => {
    const countsByCountry: Record<string, number> = {};
    clubsDb.forEach((c) => {
      const code = (c.country || 'GER').trim().toUpperCase();
      countsByCountry[code] = (countsByCountry[code] || 0) + 1;
    });

    return Object.keys(COUNTRIES).filter((k) => {
      const count = countsByCountry[k] || 0;
      if (count === 0) return false;
      if (continentFilter === 'ALL') return true;
      const eur = ['GER', 'DEN', 'FRA', 'ESP', 'SWE', 'CRO', 'POR', 'NOR', 'HUN', 'ISL', 'POL', 'AUT', 'SUI'];
      return eur.includes(k);
    });
  }, [clubsDb, continentFilter, modVersion]);

  useEffect(() => {
    if (availableCountries.length > 0 && !availableCountries.includes(nationality) && nationality !== 'ALL') {
      setNationality(availableCountries[0]);
    }
  }, [availableCountries, nationality]);

  // Keep selectedClub and startingOffers cleanly synchronized when switching between Mod, Custom Mod, and Non-Mod
  useEffect(() => {
    if (!clubsDb || clubsDb.length === 0) return;
    if (selectedClub) {
      const updatedMatch = clubsDb.find(
        (c) => String(c.id) === String(selectedClub.id) || (c.name && c.name.toLowerCase() === selectedClub.name.toLowerCase())
      );
      if (updatedMatch) {
        if (
          updatedMatch.logo !== selectedClub.logo ||
          updatedMatch.name !== selectedClub.name ||
          updatedMatch.color !== selectedClub.color ||
          updatedMatch.historicContext !== selectedClub.historicContext
        ) {
          setSelectedClub(updatedMatch);
        }
      } else {
        // Selected club's nation/entry is no longer in the active database (e.g. POL/AUT/SUI when mod disabled)
        setSelectedClub(null);
        if (step === 5) setStep(4);
      }
    }
    if (startingOffers.length > 0) {
      const syncedOffers = startingOffers
        .map((offer) =>
          clubsDb.find(
            (c) => String(c.id) === String(offer.id) || (c.name && c.name.toLowerCase() === offer.name.toLowerCase())
          )
        )
        .filter((c): c is Club => Boolean(c));
      if (syncedOffers.length === startingOffers.length) {
        const changed = syncedOffers.some(
          (c, i) =>
            c.logo !== startingOffers[i].logo ||
            c.name !== startingOffers[i].name ||
            c.color !== startingOffers[i].color
        );
        if (changed) setStartingOffers(syncedOffers);
      } else {
        // Re-roll starting offers from the newly active database
        const eligibleClubs = clubsDb.filter((c) => !isReserveClub(c.name));
        const maxTierByCountry: Record<string, number> = {};
        eligibleClubs.forEach((c) => {
          const ctry = c.country || 'GER';
          if (!maxTierByCountry[ctry] || c.tier > maxTierByCountry[ctry]) {
            maxTierByCountry[ctry] = c.tier;
          }
        });
        const pool = eligibleClubs.filter((c) => {
          const ctry = c.country || 'GER';
          if (nationality !== 'ALL' && ctry !== nationality) return false;
          const maxT = maxTierByCountry[ctry] || 1;
          return c.tier >= Math.max(1, maxT - 1);
        });
        const finalPool = pool.length > 0 ? [...pool].sort(() => 0.5 - Math.random()) : [...eligibleClubs].sort((a, b) => a.baseOvr - b.baseOvr);
        setStartingOffers(finalPool.slice(0, 4));
      }
    }
  }, [clubsDb, modVersion]);

  const displayedClubs = useMemo(() => {
    if (mode !== 'standard') return startingOffers;
    const rawQuery = searchQuery.trim();

    const matchesCountryFilter = (c: Club) => {
      if (nationality === 'ALL') return true;
      return (c.country || 'GER') === nationality;
    };

    if (!rawQuery) {
      return clubsDb
        .filter(
          (c) =>
            matchesCountryFilter(c) &&
            (tierFilter === 'all' || c.tier === tierFilter)
        )
        .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
    }

    const normalize = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const qNorm = normalize(rawQuery);
    const tokens = qNorm.split(' ').filter(Boolean);

    const isMatch = (c: Club) => {
      const countryKey = c.country || 'GER';
      const countryObj = COUNTRIES[countryKey];
      const leagueInfo = getLeagueInfo(c.tier, countryKey);

      const nameNorm = normalize(c.name);
      const countryNorm = normalize(countryKey);
      const countryNameNorm = normalize(countryObj?.name || '');
      const leagueNameNorm = normalize(leagueInfo?.name || '');

      const fullSearchableText = `${nameNorm} ${countryNorm} ${countryNameNorm} ${leagueNameNorm} tier ${c.tier}`;
      return tokens.every((token) => fullSearchableText.includes(token));
    };

    if (nationality !== 'ALL') {
      const natClubs = clubsDb.filter((c) => matchesCountryFilter(c));
      const natMatches = natClubs.filter(isMatch);
      if (natMatches.length > 0) {
        return natMatches.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
      }
    }

    return clubsDb.filter(isMatch).sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  }, [mode, searchQuery, clubsDb, nationality, tierFilter, startingOffers]);

  const handleProceedToStep3 = () => {
    if (!managerName.trim()) {
      setNameError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => nameInputRef.current?.focus(), 100);
      return;
    }
    if (!startYear || startYear < 1950) {
      setStartYear(1950);
    } else if (startYear > 2030) {
      setStartYear(2030);
    }
    setNameError(false);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToStep4 = () => {
    if (!managerName.trim()) {
      setNameError(true);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => nameInputRef.current?.focus(), 100);
      return;
    }
    if (mode === 'realistic' && startingOffers.length === 0 && clubsDb.length > 0) {
      const isGlobal = nationality === 'ALL';
      const eligibleClubs = clubsDb.filter((c) => !isReserveClub(c.name));
      let pool: Club[] = [];

      if (isGlobal) {
        const maxTierByCountry: Record<string, number> = {};
        eligibleClubs.forEach((c) => {
          const ctry = c.country || 'GER';
          if (!maxTierByCountry[ctry] || c.tier > maxTierByCountry[ctry]) {
            maxTierByCountry[ctry] = c.tier;
          }
        });

        eligibleClubs.forEach((c) => {
          const ctry = c.country || 'GER';
          const maxT = maxTierByCountry[ctry];
          if (c.tier >= Math.max(1, maxT - 1)) {
            pool.push(c);
          }
        });
      } else {
        const natClubs = eligibleClubs.filter((c) => (c.country || 'GER') === nationality);
        let targetMaxTier = 1;
        natClubs.forEach((c) => {
          if (c.tier > targetMaxTier) targetMaxTier = c.tier;
        });
        pool = natClubs.filter((c) => c.tier >= Math.max(1, targetMaxTier - 1));
      }

      if (pool.length === 0) {
        pool = [...eligibleClubs].sort((a, b) => a.baseOvr - b.baseOvr);
      } else {
        pool.sort(() => 0.5 - Math.random());
      }

      setStartingOffers(pool.slice(0, 4));
    }
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isModActive = useMemo(() => {
    return Boolean(getCustomDb()) || isRealDataModActive();
  }, [modVersion]);

  const activeModName = useMemo(() => {
    if (getCustomDb()) return 'Custom Community Mod';
    return isRealDataModActive() ? REALDATA_MOD_NAME : null;
  }, [modVersion]);

  const stepsConfig = [
    { num: 1, label: 'Mode' },
    { num: 2, label: 'Identity' },
    { num: 3, label: 'Vision' },
    { num: 4, label: 'Club' },
    { num: 5, label: 'Mandate' },
  ];

  const activeRoadmap = useMemo(() => {
    if (!selectedClub) return null;
    const safeStartYear = Math.max(1950, Math.min(2030, startYear || 2026));
    return generateBoardRoadmap(selectedClub, safeStartYear, []);
  }, [selectedClub, startYear]);

  const handleFinalStartGame = () => {
    if (!selectedClub) return;
    const safeStartYear = Math.max(1950, Math.min(2030, startYear || 2026));
    const clubCountry = selectedClub.country || (nationality === 'ALL' ? 'GER' : nationality);
    onStartGame({
      club: selectedClub,
      managerName: managerName.trim().toUpperCase(),
      startYear: safeStartYear,
      tactic,
      nationality: clubCountry,
      mode,
    });
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === 1) {
      setStep(1);
    } else if (targetStep === 2) {
      setStep(2);
    } else if (targetStep === 3) {
      if (!managerName.trim()) {
        setNameError(true);
        setStep(2);
        setTimeout(() => nameInputRef.current?.focus(), 100);
        return;
      }
      setStep(3);
    } else if (targetStep === 4) {
      handleProceedToStep4();
    } else if (targetStep === 5) {
      if (selectedClub) {
        setStep(5);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="w-full max-w-5xl px-2 sm:px-6 mx-auto text-[#14161D]">
      {/* Mod Selection Modal */}
      {showModModal && (
        <ModSelectionModal
          isOpen={showModModal}
          onClose={() => setShowModModal(false)}
          lang={lang}
          initialTab={modModalTab}
          onDatabaseChange={(updatedClubs) => {
            if (setClubsDb) setClubsDb(updatedClubs);
            setModVersion((v) => v + 1);
          }}
          showToast={showToast as any}
        />
      )}

      {/* Global Courtside Progress Stepper (Hidden on Step 1, visible from Step 2 onwards) */}
      {step > 1 && (
        <div className="w-full max-w-lg mx-auto mb-6 sm:mb-8 pt-1">
          <div className="flex items-center justify-between">
            {stepsConfig.map((s, idx) => {
              const isCurrent = step === s.num;
              const isCompleted = step > s.num;

              return (
                <React.Fragment key={`step-pip-${s.num}`}>
                  <button
                    type="button"
                    onClick={() => handleStepClick(s.num)}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none transition-transform active:scale-95"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all duration-200 ${
                        isCurrent
                          ? 'bg-[#18191F] text-white font-semibold shadow-[0_4px_12px_rgba(24,25,31,0.2)]'
                          : isCompleted
                          ? 'bg-[#E2F5EA] border border-emerald-600/25 text-[#15803D] font-semibold'
                          : 'bg-white border border-black/[0.08] text-[#525866] font-medium'
                      }`}
                    >
                      {isCompleted ? (
                        <i className="fas fa-check text-[10px]" />
                      ) : (
                        <span className="tabular-nums">{s.num}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] transition-colors ${
                        isCurrent
                          ? 'text-[#14161D] font-semibold'
                          : isCompleted
                          ? 'text-[#525866] font-medium group-hover:text-[#14161D]'
                          : 'text-[#525866] font-medium group-hover:text-[#14161D]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>

                  {idx < stepsConfig.length - 1 && (
                    <div
                      className={`h-[1px] flex-1 max-w-[44px] mx-1 sm:mx-1.5 transition-all duration-300 ${
                        step > idx + 1 ? 'bg-emerald-600/40' : 'bg-black/[0.08]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: CAREER MODE SELECTION                                              */}
      {/* ========================================================================= */}
      {step === 1 && (
        <motion.div
          key="step-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg md:max-w-3xl mx-auto flex flex-col items-center pt-3 sm:pt-5 pb-6 font-sans text-[#14161D]"
        >
          {/* Top Release / Changelog Button */}
          <button
            type="button"
            onClick={() => {
              setModModalTab('changelog');
              setShowModModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F7F6F2] border border-black/[0.06] shadow-[0_2px_10px_rgba(15,23,42,0.04)] text-xs text-[#525866] transition mx-auto mb-5 cursor-pointer active:scale-95"
          >
            <span className="text-[#DF642A] font-bold text-xs tracking-tight tabular-nums">
              v 3.0
            </span>
            <span aria-hidden="true" className="text-[#686D7B]">·</span>
            <span className="text-[#14161D] font-medium text-xs">
              Courtside Edition · 3D Arenas, Squad Gym &amp; Boardroom
            </span>
            <i className="fas fa-chevron-right text-[10px] text-[#5C6270]" />
          </button>

          {/* Main Title & Subtitle */}
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-[#14161D] tracking-tight text-center text-balance leading-[1.1] mb-3">
            Handball Manager Sim
          </h1>
          <p className="text-[#525866] text-sm sm:text-base font-normal text-center max-w-md mx-auto leading-relaxed mb-7 px-2">
            Lead a club over 35 seasons. Master tactics, scout talent, and build a European dynasty.
          </p>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full max-w-sm md:max-w-2xl mx-auto mb-7 items-stretch">
            {/* Card 1: Pick Any Club */}
            <button
              type="button"
              onClick={() => setMode('standard')}
              aria-pressed={mode === 'standard'}
              className={`rounded-[24px] p-6 sm:p-7 relative overflow-hidden transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-between active:scale-[0.99] bg-white border ${
                mode === 'standard'
                  ? 'border-[#DF642A] ring-1 ring-[#DF642A] shadow-[0_14px_34px_rgba(223,100,42,0.12)]'
                  : 'border-black/[0.06] shadow-[0_6px_24px_rgba(15,23,42,0.05)] hover:border-black/[0.14]'
              }`}
            >
              {mode === 'standard' && (
                <span className="absolute top-4 right-4 text-[#DF642A] text-[11px] font-semibold flex items-center gap-1">
                  <i className="fas fa-circle-check text-xs" />
                  <span>Selected</span>
                </span>
              )}
              <span className="flex flex-col items-center w-full">
                <span
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-3.5 transition-colors ${
                    mode === 'standard'
                      ? 'bg-[#FFF3EC] border-[#DF642A]/25 text-[#DF642A]'
                      : 'bg-[#F5F4F0] border-black/[0.05] text-[#14161D]'
                  }`}
                >
                  <i className="fas fa-shield-halved text-sm" />
                </span>
                <span className="text-base sm:text-lg font-bold text-[#14161D] tracking-tight mb-1.5">
                  Pick Any Club
                </span>
                <span className="text-xs text-[#525866] font-normal leading-relaxed max-w-xs mb-4">
                  Take command of any of the {clubsDb.length.toLocaleString()}+ clubs immediately.
                </span>
              </span>
              <span className="flex items-center justify-center gap-1.5 text-[11px] text-[#525866] font-medium pt-3 border-t border-black/[0.05] w-full">
                <i className="fas fa-globe text-[#5C6270] text-xs" />
                <span className="tabular-nums">{clubsDb.length.toLocaleString()} clubs across Europe &amp; World</span>
              </span>
            </button>

            {/* Card 2: Realistic Career */}
            <button
              type="button"
              onClick={() => setMode('realistic')}
              aria-pressed={mode === 'realistic'}
              className={`rounded-[24px] p-6 sm:p-7 relative overflow-hidden transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-between active:scale-[0.99] bg-white border ${
                mode === 'realistic'
                  ? 'border-[#DF642A] ring-1 ring-[#DF642A] shadow-[0_14px_34px_rgba(223,100,42,0.12)]'
                  : 'border-black/[0.06] shadow-[0_6px_24px_rgba(15,23,42,0.05)] hover:border-black/[0.14]'
              }`}
            >
              {mode === 'realistic' && (
                <span className="absolute top-4 right-4 text-[#DF642A] text-[11px] font-semibold flex items-center gap-1">
                  <i className="fas fa-circle-check text-xs" />
                  <span>Selected</span>
                </span>
              )}
              <span className="flex flex-col items-center w-full">
                <span
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-3.5 transition-colors ${
                    mode === 'realistic'
                      ? 'bg-[#FFF3EC] border-[#DF642A]/25 text-[#DF642A]'
                      : 'bg-[#F5F4F0] border-black/[0.05] text-[#14161D]'
                  }`}
                >
                  <i className="fas fa-bolt text-sm" />
                </span>
                <span className="text-base sm:text-lg font-bold text-[#14161D] tracking-tight mb-1.5">
                  Realistic Career
                </span>
                <span className="text-xs text-[#525866] font-normal leading-relaxed max-w-xs mb-4">
                  Start in lower divisions with authentic job offers &amp; board pressure.
                </span>
              </span>
              <span className="flex items-center justify-center gap-1.5 text-[11px] text-[#525866] font-medium pt-3 border-t border-black/[0.05] w-full">
                <i className="fas fa-briefcase text-[#5C6270] text-xs" />
                <span>Lower-tier &amp; grassroots offers</span>
              </span>
            </button>
          </div>

          {/* Action CTA: Continue button + Leaderboard link */}
          <div className="flex flex-col items-center w-full">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full max-w-[260px] py-3.5 px-8 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white font-semibold text-sm shadow-[0_8px_22px_rgba(24,25,31,0.18)] transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              onClick={onShowLeaderboard}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#525866] hover:text-[#14161D] transition duration-150 cursor-pointer mt-4"
            >
              <i className="fas fa-trophy text-[#B45309] text-xs" />
              <span>View Global Leaderboard</span>
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-[#525866] mt-6 pt-4 border-t border-black/[0.06] w-full max-w-md">
              <span>Also play:</span>
              <a
                href="https://footballmanagersim.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#14161D] hover:text-[#DF642A] font-semibold transition inline-flex items-center gap-1"
              >
                <span>Football Manager Sim</span>
                <i aria-hidden="true" className="fas fa-arrow-up-right-from-square text-[10px] opacity-80" />
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="https://basketballmanagersim.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#14161D] hover:text-[#DF642A] font-semibold transition inline-flex items-center gap-1"
              >
                <span>Basketball Manager Sim</span>
                <i aria-hidden="true" className="fas fa-arrow-up-right-from-square text-[10px] opacity-80" />
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: DIRECTOR IDENTITY & COUNTRY (DUAL BENTO LAYOUT)                    */}
      {/* ========================================================================= */}
      {step === 2 && (
        <motion.div
          key="step-2"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl mx-auto flex flex-col gap-6"
        >
          {/* Header */}
          <div className="text-center">
            <div className="text-xs font-semibold text-[#DF642A] mb-1.5">
              Step 2 · Executive Dossier
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#14161D] text-balance">
              Coach Identity &amp; Starting Country
            </h2>
            <p className="text-xs sm:text-sm text-[#525866] leading-relaxed font-normal max-w-lg mx-auto mt-1.5">
              Define your coaching credentials, starting season, and starting country.
            </p>
          </div>

          {/* Dual Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full items-stretch">
            {/* Left Card: Personal Dossier */}
            <div className="courtside-card bg-white border border-black/[0.06] rounded-[24px] p-5 sm:p-6 flex flex-col justify-between shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
              <div>
                {/* Dossier Header */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F5F4F0] border border-black/[0.05] flex items-center justify-center text-[#14161D] text-xs">
                      <i className="fas fa-user-tie" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#14161D] tracking-tight">
                        Personal Dossier
                      </h3>
                      <p className="text-[11px] text-[#686D7B] font-normal">
                        Name &amp; Inception Era
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#525866]">
                    Pro License
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Name Input */}
                  <div
                    className={`p-3.5 px-4 rounded-2xl border transition duration-150 ${
                      nameError
                        ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-300/60'
                        : 'bg-[#F5F4F0] border-black/[0.06] focus-within:bg-white focus-within:border-[#DF642A] focus-within:ring-1 focus-within:ring-[#DF642A]/25'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <label
                        htmlFor="onboarding-coach-name"
                        className={`text-xs font-semibold block ${
                          nameError ? 'text-rose-700' : 'text-[#525866]'
                        }`}
                      >
                        Head Coach Name
                      </label>
                      {nameError && (
                        <span className="text-[11px] font-semibold text-rose-700">
                          Required
                        </span>
                      )}
                    </div>
                    <input
                      id="onboarding-coach-name"
                      ref={nameInputRef}
                      type="text"
                      maxLength={24}
                      value={managerName}
                      onChange={(e) => {
                        setManagerName(e.target.value);
                        setNameError(false);
                      }}
                      placeholder="e.g. Alfred Gislason"
                      className="bg-transparent w-full text-[#14161D] font-semibold text-base sm:text-lg outline-none placeholder-[#5C6270] tracking-tight"
                    />
                  </div>

                  {/* Start Year Input */}
                  <div className="bg-[#F5F4F0] border border-black/[0.06] focus-within:bg-white focus-within:border-[#DF642A] focus-within:ring-1 focus-within:ring-[#DF642A]/25 p-3.5 px-4 rounded-2xl transition">
                    <label
                      htmlFor="onboarding-start-year"
                      className="text-xs text-[#525866] font-semibold block mb-1"
                    >
                      Start Year (Inception)
                    </label>
                    <div className="flex items-center justify-between gap-3">
                      <input
                        id="onboarding-start-year"
                        type="number"
                        min={1950}
                        max={2030}
                        value={startYear || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setStartYear(0);
                            return;
                          }
                          const raw = parseInt(val, 10);
                          if (!isNaN(raw)) {
                            setStartYear(raw);
                          }
                        }}
                        onBlur={() => {
                          setStartYear((prev) => Math.max(1950, Math.min(2030, prev || 2026)));
                        }}
                        className="bg-transparent w-full text-[#14161D] font-semibold text-base sm:text-lg outline-none tabular-nums"
                      />
                      <span className="text-xs text-[#525866] font-medium shrink-0 tabular-nums">
                        {(() => {
                          const dispYear = Math.max(1950, Math.min(2030, startYear || 2026));
                          return `Season ${dispYear}/${(dispYear + 1).toString().slice(-2)}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-6 pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-xs text-[#525866]">
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-shield text-[10px] text-[#5C6270]" />
                  <span>Credential Status</span>
                </span>
                <span className="text-[#14161D] font-semibold">Free Agent · Ready</span>
              </div>
            </div>

            {/* Right Card: Starting Country & League Pyramids */}
            <div className="courtside-card bg-white border border-black/[0.06] rounded-[24px] p-5 sm:p-6 flex flex-col justify-between shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
              <div>
                {/* Starting Country Header */}
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F5F4F0] border border-black/[0.05] flex items-center justify-center text-[#14161D] text-xs">
                      <i className="fas fa-earth-europe" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#14161D] tracking-tight">
                        Starting Country
                      </h3>
                      <p className="text-[11px] text-[#525866] font-normal">
                        League Pyramid Focus
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#525866]">
                    {nationality === 'ALL' ? 'Global' : nationality}
                  </span>
                </div>

                {/* Continent Selector */}
                <div className="flex bg-[#F5F4F0] p-1 rounded-full border border-black/[0.05] w-fit mb-3.5 gap-1">
                  {(['ALL', 'EUROPE'] as const).map((cont) => (
                    <button
                      key={`step2-cont-${cont}`}
                      type="button"
                      onClick={() => {
                        setContinentFilter(cont);
                        if (cont === 'ALL') setNationality('ALL');
                        else setNationality('GER');
                        setTierFilter('all');
                        setStartingOffers([]);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition duration-150 cursor-pointer whitespace-nowrap ${
                        continentFilter === cont
                          ? 'bg-white text-[#14161D] shadow-xs'
                          : 'text-[#525866] hover:text-[#14161D]'
                      }`}
                    >
                      {cont === 'ALL' ? 'All Continents' : 'Europe (EHF)'}
                    </button>
                  ))}
                </div>

                {/* Country Selection Grid */}
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {availableCountries.map((key) => {
                    const country = COUNTRIES[key] || { name: key, flag: '🌐', active: true };
                    const isSelected = nationality === key;
                    const clubCount = clubsDb.filter((c) => (c.country || 'GER') === key).length;
                    const isActive = clubCount > 0;

                    return (
                      <button
                        key={`step2-country-${key}`}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setNationality(key);
                            setTierFilter('all');
                            setStartingOffers([]);
                          }
                        }}
                        disabled={!isActive}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition duration-150 border cursor-pointer ${
                          isSelected
                            ? 'bg-[#18191F] border-[#18191F] text-white shadow-xs'
                            : 'bg-[#F5F4F0] border-black/[0.05] text-[#525866] hover:text-[#14161D] hover:bg-[#ECE9E1]'
                        } ${!isActive ? 'opacity-35 cursor-not-allowed' : ''}`}
                      >
                        <span className="text-sm">{country.flag}</span>
                        <span>{country.name}</span>
                        {clubCount > 0 && (
                          <span
                            className={`text-[10px] font-normal tabular-nums ${
                              isSelected ? 'text-white/80' : 'text-[#5C6270]'
                            }`}
                          >
                            {clubCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Footer */}
              <div className="mt-6 pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-xs text-[#686D7B]">
                <span>Selected Pyramid</span>
                <span className="text-[#14161D] font-semibold">
                  {nationality === 'ALL' ? 'All Pyramids (Global)' : COUNTRIES[nationality]?.name || nationality}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#F7F6F2] text-[#14161D] border border-black/[0.08] font-semibold text-xs transition active:scale-95 cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <i className="fas fa-arrow-left text-xs" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep3}
              className="bg-[#18191F] hover:bg-[#2A2D37] text-white font-semibold text-xs sm:text-sm py-2.5 px-6 rounded-full transition duration-150 active:scale-95 cursor-pointer shadow-[0_6px_18px_rgba(24,25,31,0.16)] flex items-center gap-2"
            >
              <span>Proceed to Vision</span>
              <i className="fas fa-arrow-right text-xs" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: MANAGERIAL VISION & TACTICAL PHILOSOPHY                            */}
      {/* ========================================================================= */}
      {step === 3 && (
        <motion.div
          key="step-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl mx-auto rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_28px_rgba(15,23,42,0.05)] overflow-hidden p-5 sm:p-8"
        >
          {/* Header */}
          <div className="text-center pb-6 border-b border-black/[0.06] mb-6">
            <div className="text-xs font-semibold text-[#DF642A] mb-1.5">
              Step 3 · Tactical Philosophy
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#14161D] text-balance">
              Tactical Philosophy &amp; Vision
            </h2>
            <p className="text-xs sm:text-sm text-[#525866] leading-relaxed font-normal max-w-lg mx-auto mt-1.5">
              Select your tactical system and playing style.
            </p>
          </div>

          {/* Philosophy Cards Grid */}
          <div className="space-y-3">
            {Object.keys(PHILOSOPHIES).map((tacKey) => {
              const tac = PHILOSOPHIES[tacKey];
              const isSelected = tactic === tacKey;
              const gfPct = Math.round((tac.gfMod - 1) * 100);
              const gaPct = Math.round((tac.gaMod - 1) * 100);

              const gfText = gfPct > 0 ? `+${gfPct}%` : `${gfPct}%`;
              const gaText = gaPct > 0 ? `+${gaPct}%` : `${gaPct}%`;

              return (
                <button
                  key={`tactic-${tacKey}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setTactic(tacKey)}
                  className={`w-full p-4 sm:p-5 rounded-[20px] flex items-center gap-4 cursor-pointer transition-all duration-150 border text-left relative ${
                    isSelected
                      ? 'border-[#DF642A] bg-[#FFF8F4] ring-1 ring-[#DF642A]/30 shadow-[0_6px_18px_rgba(223,100,42,0.08)]'
                      : 'border-black/[0.06] bg-[#FAF9F6] hover:border-black/[0.14] hover:bg-[#F5F4F0]'
                  }`}
                >
                  {/* Tactic Icon Box */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-[#FFF0E6] border-[#DF642A]/30 text-[#DF642A]'
                        : 'bg-white border-black/[0.06] text-[#14161D]'
                    }`}
                  >
                    <tac.icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h4 className="font-bold text-[#14161D] text-base tracking-tight">
                        {tacKey}
                      </h4>
                      <span className="text-xs text-[#686D7B] font-medium">
                        {tac.en}
                      </span>
                    </div>

                    {/* Perk Line */}
                    <div className="flex items-center gap-1.5 text-xs text-[#B45309] font-semibold mt-1">
                      <i className="fas fa-bolt text-[#DF642A] text-[10px]" />
                      <span>{tac.perkEn}</span>
                    </div>

                    {/* Narrative Description */}
                    <p className="text-xs text-[#525866] mt-1 leading-snug font-normal">
                      {tac.effectDescEn}
                    </p>

                    {/* Engine Rate Metadata */}
                    <div className="flex items-center gap-3 mt-2.5 text-xs font-medium text-[#525866]">
                      <span className="tabular-nums">
                        GF: <strong className="text-[#15803D] font-semibold tabular-nums">{gfText}</strong>
                      </span>
                      <span aria-hidden="true" className="text-[#686D7B]">·</span>
                      <span className="tabular-nums">
                        GA: <strong className="text-[#0369A1] font-semibold tabular-nums">{gaText}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Radio / Selection Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-[#DF642A] bg-[#DF642A] text-white'
                        : 'border-black/20 bg-white'
                    }`}
                  >
                    {isSelected && <i className="fas fa-check text-[10px]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 pt-6 mt-6 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 sm:px-5 py-2.5 rounded-full bg-white hover:bg-[#F7F6F2] text-[#14161D] border border-black/[0.08] font-semibold text-xs transition active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 shadow-xs"
            >
              <i className="fas fa-arrow-left text-xs" />
              <span>Back<span className="hidden sm:inline"> to Identity</span></span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep4}
              className="bg-[#18191F] hover:bg-[#2A2D37] text-white font-semibold text-xs sm:text-sm py-2.5 px-5 sm:px-6 rounded-full transition duration-150 active:scale-95 cursor-pointer shadow-[0_6px_18px_rgba(24,25,31,0.16)] flex items-center gap-2 shrink-0"
            >
              <span>Proceed to Club<span className="hidden sm:inline"> Selection</span></span>
              <i className="fas fa-arrow-right text-xs" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: CLUB SELECTION / GRASSROOTS OFFERS                                */}
      {/* ========================================================================= */}
      {step === 4 && (
        <motion.div
          key="step-4"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl mx-auto rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_28px_rgba(15,23,42,0.05)] overflow-hidden p-5 sm:p-7"
        >
          {/* Header */}
          <div className="text-center pb-5 border-b border-black/[0.06] mb-5">
            <div className="text-xs font-semibold text-[#DF642A] mb-1.5">
              {mode === 'standard'
                ? 'Open Club Selection · All Tiers'
                : 'Inbound Contract Offers · 4 Official Proposals'}
            </div>

            <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight leading-tight text-[#14161D] text-balance">
              {mode === 'standard'
                ? t('Choose Your Club', 'Verein Waehlen')
                : t('Grassroots Job Offers', 'Vertrags-Angebote')}
            </h2>

            <p className="text-[13px] text-[#525866] leading-relaxed font-normal max-w-lg mx-auto mt-1.5">
              {mode === 'standard'
                ? t(
                    'Select any club across European handball pyramids to start your managerial journey.',
                    'Waehle einen beliebigen Verein fuer deinen Karrierestart aus.'
                  )
                : t(
                    'Four clubs have extended official contracts to you. Review roster strength and accept an appointment.',
                    'Vier Vereine moechten dich verpflichten. Waehle deinen Startpunkt.'
                  )}
            </p>

            {/* Active Database Switcher */}
            <div className="flex items-center justify-center gap-2 mt-3.5">
              <button
                type="button"
                onClick={() => {
                  setModModalTab('mods');
                  setShowModModal(true);
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition border cursor-pointer active:scale-95 ${
                  isModActive
                    ? 'bg-[#FFF8F4] border-[#DF642A]/30 text-[#C2410C] hover:bg-[#FFF0E6]'
                    : 'bg-[#F5F4F0] border-black/[0.06] text-[#14161D] hover:bg-[#ECE9E1]'
                }`}
              >
                <i className={`fas ${isModActive ? 'fa-shield-halved text-[#DF642A]' : 'fa-database text-[#686D7B]'} text-xs`} />
                <span>{activeModName || 'Standard Database'}</span>
                <span aria-hidden="true" className="text-[#686D7B]">·</span>
                <span className={isModActive ? 'text-[#15803D]' : 'text-[#525866]'}>
                  {isModActive ? 'Mod Active' : 'Default'}
                </span>
                <span aria-hidden="true" className="text-[#686D7B]">·</span>
                <span className="text-[#525866] font-medium tabular-nums">{clubsDb.length} Clubs</span>
              </button>
            </div>
          </div>

          {/* Standard Mode: Search and Country / Tier Filters */}
          {mode === 'standard' && (
            <div className="mb-6 space-y-3.5">
              {/* Search Bar */}
              <div className="max-w-md mx-auto relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#5C6270] text-xs pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label="Search club or city"
                  placeholder={t('Search club or city... (e.g. Kiel, Magdeburg)', 'Verein oder Stadt suchen... (z.B. Kiel)')}
                  className="w-full bg-[#F5F4F0] hover:bg-[#F0EEE8] focus:bg-white text-[#14161D] font-medium text-xs pl-10 pr-9 py-2.5 rounded-full border border-black/[0.08] outline-none transition focus:border-[#DF642A] placeholder-[#5C6270]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/[0.08] hover:bg-black/[0.15] text-[#525866] hover:text-[#14161D] flex items-center justify-center text-[10px] transition cursor-pointer"
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>

              {/* Country Filters Bar */}
              {!searchQuery && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-4xl mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setNationality('ALL');
                      setTierFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition duration-150 border cursor-pointer whitespace-nowrap ${
                      nationality === 'ALL'
                        ? 'bg-[#18191F] text-white border-[#18191F] shadow-xs'
                        : 'bg-[#F5F4F0] border-black/[0.05] text-[#525866] hover:text-[#14161D] hover:bg-[#ECE9E1]'
                    }`}
                  >
                    🌍 All Countries
                  </button>

                  {Object.keys(COUNTRIES)
                    .filter((k) => {
                      if (['POL', 'AUT', 'SUI'].includes(k) && !isModActive) return false;
                      return COUNTRIES[k].active;
                    })
                    .map((k) => {
                      const c = COUNTRIES[k];
                      const isSelected = nationality === k;
                      return (
                        <button
                          key={`step4-nat-${k}`}
                          type="button"
                          onClick={() => {
                            setNationality(k);
                            setTierFilter('all');
                          }}
                          className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition duration-150 border cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-[#18191F] text-white border-[#18191F] shadow-xs'
                              : 'bg-[#F5F4F0] border-black/[0.05] text-[#525866] hover:text-[#14161D] hover:bg-[#ECE9E1]'
                          }`}
                        >
                          <span>{c.flag}</span> <span className="hidden sm:inline">{c.name}</span>
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Tier Filters for Selected Country */}
              {!searchQuery && nationality !== 'ALL' && (
                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => setTierFilter('all')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition duration-150 border cursor-pointer ${
                      tierFilter === 'all'
                        ? 'bg-[#DF642A] text-white border-[#DF642A] shadow-xs'
                        : 'bg-[#F5F4F0] text-[#525866] border-black/[0.05] hover:text-[#14161D]'
                    }`}
                  >
                    All Tiers
                  </button>
                  {Array.from({ length: getMaxTier(nationality) }, (_, i) => i + 1).map((tVal) => (
                    <button
                      key={`step4-tier-${tVal}`}
                      type="button"
                      onClick={() => setTierFilter((prev) => (prev === tVal ? 'all' : tVal))}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition duration-150 border cursor-pointer ${
                        tierFilter === tVal
                          ? 'bg-[#DF642A] text-white border-[#DF642A] shadow-xs'
                          : 'bg-[#F5F4F0] text-[#525866] border-black/[0.05] hover:text-[#14161D]'
                      }`}
                    >
                      Tier {tVal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Club Grid */}
          {displayedClubs.length === 0 ? (
            <div className="bg-[#FAF9F6] border border-black/[0.06] rounded-[20px] p-8 max-w-md mx-auto text-center my-6">
              <i className="fas fa-search text-3xl text-[#5C6270] mb-3 block" />
              <h3 className="text-[#14161D] font-bold text-base mb-1">
                No Clubs Found
              </h3>
              <p className="text-[#525866] text-xs mb-4">
                No club matches "{searchQuery}". Try searching for "Kiel" or "Berlin".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="bg-[#18191F] hover:bg-[#2A2D37] text-white font-semibold text-xs py-2 px-5 rounded-full transition cursor-pointer shadow-xs"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${
                mode === 'standard' ? 'overflow-y-auto max-h-[58vh] pr-1.5 custom-scrollbar pb-4' : ''
              }`}
            >
              {displayedClubs.map((c, cIdx) => {
                const clubCountry = c.country || (nationality === 'ALL' ? 'GER' : nationality);
                const countryInfo = COUNTRIES[clubCountry];
                const isDisabledClub = c.tier > getMaxTier(clubCountry);
                const clubContext = getClubHistoricContext(c.name, c.tier, false, clubCountry, c);
                const startingBudget = getStartingBudget(c.tier, clubCountry);
                const isSelected = selectedClub?.name === c.name;

                return (
                  <button
                    key={`club-card-${c.id || c.name || cIdx}-${cIdx}`}
                    type="button"
                    disabled={isDisabledClub}
                    onClick={() => {
                      if (!managerName.trim()) {
                        setNameError(true);
                        setStep(2);
                        return;
                      }
                      if (isDisabledClub) return;
                      setSelectedClub(c);
                      setStep(5);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`group rounded-[20px] p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 border text-left relative overflow-hidden ${
                      isDisabledClub
                        ? 'bg-[#FAF9F6] opacity-40 grayscale cursor-not-allowed border-black/[0.04]'
                        : isSelected
                        ? 'bg-white border-[#DF642A] ring-1 ring-[#DF642A] shadow-[0_12px_28px_rgba(223,100,42,0.12)] cursor-pointer active:scale-[0.98]'
                        : 'bg-[#FAF9F6] hover:bg-white hover:border-black/[0.16] hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] border-black/[0.06] cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {/* Top Row: Unboxed League & OVR Readout */}
                    <div className="flex items-center justify-between gap-2 mb-3 w-full">
                      <div className="text-[11px] font-semibold text-[#525866] flex items-center gap-1.5 truncate">
                        <CompetitionLogo
                          kind="league"
                          country={clubCountry}
                          tier={c.tier}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="truncate text-[#14161D]">{countryInfo?.name || clubCountry}</span>
                        <span aria-hidden="true" className="text-[#686D7B]">·</span>
                        <span className="text-[#525866] font-medium">Tier {c.tier}</span>
                      </div>

                      {/* Tabular OVR Readout */}
                      <div className="flex items-center gap-1 text-xs font-bold text-[#14161D] shrink-0 tabular-nums">
                        <span className="text-[10px] text-[#525866] font-medium">OVR</span>
                        <span>{c.baseOvr}</span>
                      </div>
                    </div>

                    {/* Logo & Club Name */}
                    <div className="flex flex-col items-center text-center my-2 w-full">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center">
                        <ClubLogo
                          club={c}
                          name={c.name}
                          color={c.color}
                          logo={c.logo}
                          fallbackLogo={c.fallbackLogo}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm p-0.5"
                          fallbackClassName="w-16 h-16 sm:w-20 sm:h-20 text-xl rounded-2xl shadow-sm flex items-center justify-center font-semibold text-white shrink-0"
                        />
                      </div>

                      <span className="text-base sm:text-lg font-bold text-[#14161D] tracking-tight truncate w-full px-1">
                        {c.name}
                      </span>

                      {/* Reserve Club indicator */}
                      {isReserveClub(c.name) && (
                        <span className="text-[11px] font-semibold text-[#B45309] mt-0.5">
                          Reserve Squad
                        </span>
                      )}

                      {/* Historic Narrative / Vision */}
                      {clubContext && (
                        <span className="w-full text-xs text-[#525866] italic text-center line-clamp-2 min-h-[32px] px-1 mt-1.5 leading-snug border-t border-black/[0.05] pt-1.5">
                          "{clubContext}"
                        </span>
                      )}
                    </div>

                    {/* 2x2 Metric Grid */}
                    <div className="mt-3 pt-3 border-t border-black/[0.06] grid grid-cols-2 gap-1.5 text-[11px] font-medium w-full">
                      <div className="bg-white border border-black/[0.05] rounded-xl p-1.5 px-2.5 flex items-center gap-1.5 text-[#3E4452] tabular-nums">
                        <i className="fas fa-users text-[#DF642A] text-[10px]" />
                        <span className="truncate">{c.stadium ? `${formatNum(c.stadium)} Seats` : 'Arena'}</span>
                      </div>
                      <div className="bg-white border border-black/[0.05] rounded-xl p-1.5 px-2.5 flex items-center gap-1.5 text-[#15803D] font-semibold tabular-nums">
                        <i className="fas fa-coins text-[#B45309] text-[10px]" />
                        <span className="truncate">{formatMoney(startingBudget)}</span>
                      </div>
                    </div>

                    {/* Sign Contract CTA bar */}
                    <div className="mt-3 pt-1 w-full">
                      <div
                        className={`w-full py-2 rounded-full text-center text-xs font-semibold transition-all duration-150 border ${
                          isSelected
                            ? 'bg-[#DF642A] text-white border-[#DF642A]'
                            : 'bg-white group-hover:bg-[#18191F] group-hover:text-white text-[#14161D] border-black/[0.08] group-hover:border-[#18191F]'
                        }`}
                      >
                        {isSelected ? 'Selected · View Mandate →' : 'Select Club'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-black/[0.06] flex-wrap">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#F7F6F2] text-[#14161D] border border-black/[0.08] font-semibold text-xs transition active:scale-[0.98] cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <i className="fas fa-arrow-left text-xs" />
              <span>Back to Vision</span>
            </button>

            <span className="text-xs text-[#686D7B] font-medium hidden sm:inline tabular-nums">
              {displayedClubs.length} Clubs available
            </span>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: BOARD INAUGURATION & STRATEGIC MANDATE CONFIRMATION               */}
      {/* ========================================================================= */}
      {step === 5 && selectedClub && (() => {
        const clubCountry = selectedClub.country || (nationality === 'ALL' ? 'GER' : nationality);
        const leagueInfo = getLeagueInfo(selectedClub.tier, clubCountry);
        const homeArena = getClubHomeArena(selectedClub);
        const stadiumCap = selectedClub.stadium || (leagueInfo ? leagueInfo.stadBase : 5000);
        const startingBudget = getStartingBudget(selectedClub.tier, clubCountry);
        const safeStartYear = Math.max(1950, Math.min(2030, startYear || 2026));

        return (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto space-y-5 pt-1 pb-6 font-sans text-[#14161D]"
          >
            {/* 1. Official Welcome Letter Hero Box */}
            <div className="courtside-card bg-white border border-black/[0.06] rounded-[24px] p-6 sm:p-7 relative overflow-hidden shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
              {/* Subtle Ambient Glow */}
              <div
                className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-10"
                style={{ backgroundColor: selectedClub.color || '#DF642A' }}
              />

              {/* Header row */}
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pb-5 border-b border-black/[0.06]">
                <div className="w-14 h-14 rounded-2xl bg-[#F5F4F0] p-1 border border-black/[0.06] flex items-center justify-center shrink-0">
                  <ClubLogo
                    club={selectedClub}
                    name={selectedClub.name}
                    color={selectedClub.color}
                    logo={selectedClub.logo}
                    fallbackLogo={selectedClub.fallbackLogo}
                    className="w-12 h-12 object-contain p-0.5"
                    fallbackClassName="w-12 h-12 text-lg rounded-xl flex items-center justify-center font-semibold text-white"
                  />
                </div>

                <div className="w-full flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#DF642A] flex items-center gap-1.5 mb-1">
                    <i className="fas fa-signature text-xs" />
                    <span>Official Board Appointment &amp; Charter</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#14161D] tracking-tight leading-snug break-words text-balance">
                    Welcome to {selectedClub.name}, Coach {managerName.trim().toUpperCase() || 'COACH'}
                  </h1>

                  <div className="text-xs text-[#525866] font-normal mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[#14161D] font-semibold">
                      Division: {leagueInfo?.name || `Tier ${selectedClub.tier}`} (Tier {selectedClub.tier})
                    </span>
                    <span aria-hidden="true" className="text-[#686D7B]">·</span>
                    <span>
                      Home Arena: <span className="text-[#14161D] font-medium">{homeArena}</span> (<span className="tabular-nums">{stadiumCap.toLocaleString()}</span> Seats)
                    </span>
                    <span aria-hidden="true" className="text-[#686D7B]">·</span>
                    <span>
                      Era: <span className="text-[#14161D] font-semibold tabular-nums">{safeStartYear}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="relative z-10 pt-5 text-xs sm:text-sm text-[#3E4452] leading-relaxed space-y-3">
                <p>
                  The Supervisory Board and Club Executive Committee have formally ratified your appointment as Head Coach ahead of the{' '}
                  <span className="text-[#14161D] font-semibold tabular-nums">{safeStartYear}</span> campaign. You have been granted complete executive stewardship over squad recruitment, tactical doctrine, and long-term infrastructure investment.
                </p>
                {activeRoadmap?.narrativeEn && (
                  <p className="text-[#525866] italic text-xs bg-[#F5F4F0] border border-black/[0.05] rounded-2xl px-4 py-3">
                    "{activeRoadmap.narrativeEn}"
                  </p>
                )}
              </div>
            </div>

            {/* 2. Governance Micro-Indicators Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch">
              {/* Board Confidence */}
              <div className="bg-white border border-black/[0.06] rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] text-[#525866] font-semibold flex items-center gap-1.5">
                  <i className="fas fa-shield-halved text-[#15803D] text-xs" />
                  <span>Board Confidence</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-[#15803D] tabular-nums">100%</span>
                  <span className="text-[11px] text-[#525866] font-medium">Approval</span>
                </div>
              </div>

              {/* Starting Treasury */}
              <div className="bg-white border border-black/[0.06] rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] text-[#525866] font-semibold flex items-center gap-1.5">
                  <i className="fas fa-vault text-[#B45309] text-xs" />
                  <span>Treasury Reserves</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-[#14161D] tabular-nums">{formatMoney(startingBudget)}</span>
                  <span className="text-[11px] text-[#525866] font-medium">Budget</span>
                </div>
              </div>

              {/* Charter Horizon */}
              <div className="bg-white border border-black/[0.06] rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] text-[#525866] font-semibold flex items-center gap-1.5">
                  <i className="fas fa-compass text-[#0369A1] text-xs" />
                  <span>Charter Horizon</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-[#14161D] tabular-nums">{activeRoadmap?.horizonYears || 3}</span>
                  <span className="text-[11px] text-[#525866] font-medium tabular-nums">
                    Seasons ({safeStartYear}–{safeStartYear + (activeRoadmap?.horizonYears || 3)})
                  </span>
                </div>
              </div>

              {/* Tactical Doctrine */}
              <div className="bg-white border border-black/[0.06] rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] text-[#525866] font-semibold flex items-center gap-1.5">
                  <i className="fas fa-chess text-[#6D28D9] text-xs" />
                  <span>Tactical Doctrine</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-bold text-[#14161D] truncate">{tactic}</span>
                </div>
              </div>
            </div>

            {/* 3. Board Roadmap Goals Box */}
            <div className="courtside-card bg-white border border-black/[0.06] rounded-[24px] p-5 sm:p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/[0.06] mb-4">
                <div>
                  <div className="text-xs font-semibold text-[#DF642A] flex items-center gap-1.5 mb-0.5">
                    <i className="fas fa-list-check text-xs" />
                    <span>Mandate Directives &amp; Deliverables</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#14161D] tracking-tight">
                    {activeRoadmap?.titleEn || 'Club Strategic Roadmap'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#525866] tabular-nums">
                    {activeRoadmap?.horizonYears || 3}-Year Milestone Cycle
                  </span>
                </div>
              </div>

              {/* Goals Grid */}
              {activeRoadmap?.goals && activeRoadmap.goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {activeRoadmap.goals.map((goal, idx) => {
                    const meta = getGoalCategoryMeta(goal.targetType);
                    return (
                      <div
                        key={goal.id || `goal-${idx}`}
                        className="bg-[#FAF9F6] border border-black/[0.06] hover:border-black/[0.14] rounded-[20px] p-4 sm:p-5 flex flex-col justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[11px] font-semibold text-[#525866] flex items-center gap-1.5">
                              <i className={`fas ${meta.icon} text-xs`} />
                              <span>{meta.label}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-[#B45309] tabular-nums">
                              Directive 0{idx + 1}
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-[#14161D] tracking-tight mb-1.5">
                            {goal.titleEn}
                          </h4>
                          <p className="text-xs text-[#525866] font-normal leading-relaxed">
                            {goal.descriptionEn}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2 flex-wrap text-xs">
                          <span className="text-[11px] text-[#525866] font-medium">Bounty on Completion:</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[#B45309] text-xs font-bold tabular-nums">
                              +{goal.rewardMp} MP
                            </span>
                            {Boolean(goal.rewardCash) && (
                              <>
                                <span aria-hidden="true" className="text-[#686D7B]">·</span>
                                <span className="text-[#15803D] text-xs font-bold tabular-nums">
                                  +{formatMoney(goal.rewardCash!)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* 4. Action Footer */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setStep(4);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white hover:bg-[#F7F6F2] text-[#14161D] border border-black/[0.08] font-semibold text-xs transition active:scale-[0.98] cursor-pointer flex items-center gap-2 shrink-0 shadow-xs"
              >
                <i className="fas fa-arrow-left text-xs" />
                <span>Back<span className="hidden sm:inline"> to Club Selection</span></span>
              </button>

              <button
                type="button"
                onClick={handleFinalStartGame}
                className="px-6 sm:px-7 py-3 rounded-full bg-[#DF642A] hover:bg-[#C8531E] text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_8px_24px_rgba(223,100,42,0.28)] active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>Enter Front Office<span className="hidden sm:inline"> &amp; Begin Season</span></span>
                <i className="fas fa-arrow-right text-xs" />
              </button>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
};
