import { AnimatePresence, motion } from 'motion/react';
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
import { t as tr } from '../data/translations';
import { ALL_CLUBS } from '../data/clubsData';
import { HandballSimLogo } from './HandballSimLogo';
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
      return { label: 'Championship Directive', icon: 'fa-trophy text-amber-400' };
    case 'european_glory':
      return { label: 'Continental Glory', icon: 'fa-star text-amber-400' };
    case 'promotion_tier':
      return { label: 'Promotion Mandate', icon: 'fa-arrow-trend-up text-emerald-400' };
    case 'top_four':
      return { label: 'High Table Target', icon: 'fa-medal text-sky-400' };
    case 'solidify_tier':
      return { label: 'League Retention', icon: 'fa-shield-halved text-sky-400' };
    case 'arena_expansion':
      return { label: 'Arena Expansion', icon: 'fa-building text-purple-400' };
    case 'academy_growth':
      return { label: 'Youth Academy', icon: 'fa-graduation-cap text-emerald-400' };
    case 'medical_growth':
      return { label: 'Medical Center', icon: 'fa-heart-pulse text-rose-400' };
    case 'fanbase_growth':
      return { label: 'Community Growth', icon: 'fa-users text-amber-400' };
    case 'financial_surplus':
      return { label: 'Fiscal Governance', icon: 'fa-vault text-emerald-400' };
    default:
      return { label: 'Board Directive', icon: 'fa-bullseye text-amber-400' };
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
    return generateBoardRoadmap(selectedClub, startYear, []);
  }, [selectedClub, startYear]);

  const handleFinalStartGame = () => {
    if (!selectedClub) return;
    const clubCountry = selectedClub.country || (nationality === 'ALL' ? 'GER' : nationality);
    onStartGame({
      club: selectedClub,
      managerName: managerName.trim().toUpperCase(),
      startYear,
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
    <div className="w-full max-w-5xl px-3 sm:px-6 mx-auto">
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

      {/* Global Broadcast Progress Stepper (Hidden on Step 1, visible from Step 2 onwards) */}
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
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-all duration-200 ${
                        isCurrent
                          ? 'bg-white text-black font-semibold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : isCompleted
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold'
                          : 'bg-white/[0.05] border border-white/[0.1] text-zinc-500 font-medium'
                      }`}
                    >
                      {isCompleted ? (
                        <i className="fas fa-check text-[9px]" />
                      ) : (
                        <span className="tabular-nums">{s.num}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] transition-colors ${
                        isCurrent
                          ? 'text-white font-semibold'
                          : isCompleted
                          ? 'text-zinc-400 font-medium group-hover:text-zinc-200'
                          : 'text-zinc-500 font-medium group-hover:text-zinc-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>

                  {idx < stepsConfig.length - 1 && (
                    <div
                      className={`h-[1px] flex-1 max-w-[40px] mx-1 sm:mx-1.5 transition-all duration-300 ${
                        step > idx + 1 ? 'bg-emerald-500/40' : 'bg-white/[0.08]'
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
      {/* STEP 1: CAREER MODE SELECTION (PREMIUM BROADCAST SETUP)                    */}
      {/* ========================================================================= */}
      {step === 1 && (
        <motion.div
          key="step-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg md:max-w-3xl mx-auto flex flex-col items-center pt-2 pb-6 font-sans text-neutral-200"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[350px] bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.035),_transparent_70%)] rounded-full blur-2xl pointer-events-none -z-10" />

          {/* Top Update Pill: v 2.2 Sponsors, Supercup & World Updates */}
          <button
            type="button"
            onClick={() => {
              setModModalTab('changelog');
              setShowModModal(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 text-xs text-zinc-300 transition mx-auto mb-4 cursor-pointer active:scale-95 shadow-sm"
          >
            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/15 font-semibold text-[10px] tracking-tight">
              v 2.2
            </span>
            <span className="text-zinc-300 font-medium text-xs">
              Sponsors, Supercup &amp; World Updates
            </span>
            <i className="fas fa-chevron-right text-[9px] text-zinc-500" />
          </button>

          {/* Main Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight uppercase text-center mb-2">
            Handball Manager Sim
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-normal text-center max-w-sm sm:max-w-md mx-auto leading-relaxed mb-6 px-2">
            Lead a club over 35 seasons. Hire coaches, scout talent, and build a dynasty.
          </p>

          {/* Mode Selection Cards (Monochrome / Black & White) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5 w-full max-w-sm md:max-w-2xl mx-auto mb-6">
            {/* Card 1: Pick Any Club */}
            <div
              onClick={() => setMode('standard')}
              className={`rounded-2xl p-5 sm:p-6 relative transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-between bg-[#14151e] active:scale-[0.99] ${
                mode === 'standard'
                  ? 'border border-white/30 bg-white/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
                  : 'border border-white/[0.05] hover:border-white/15'
              }`}
            >
              {mode === 'standard' && (
                <div className="absolute top-3.5 right-3.5 bg-white/10 text-white border border-white/20 text-[10px] font-medium tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>SELECTED</span>
                </div>
              )}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 shadow-sm transition-colors ${
                    mode === 'standard'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-400'
                  }`}
                >
                  <i className="fas fa-bars-staggered text-base" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight mb-1">
                  Pick Any Club
                </h2>
                <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-xs mb-3">
                  Choose any of the {clubsDb.length.toLocaleString()}+ clubs worldwide.
                </p>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium pt-1">
                <i className="fas fa-globe text-zinc-500 text-xs" />
                <span className="tabular-nums">{clubsDb.length.toLocaleString()} clubs worldwide</span>
              </div>
            </div>

            {/* Card 2: Realistic Career */}
            <div
              onClick={() => setMode('realistic')}
              className={`rounded-2xl p-5 sm:p-6 relative transition-all duration-200 cursor-pointer flex flex-col items-center text-center justify-between bg-[#14151e] active:scale-[0.99] ${
                mode === 'realistic'
                  ? 'border border-white/30 bg-white/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
                  : 'border border-white/[0.05] hover:border-white/15'
              }`}
            >
              {mode === 'realistic' && (
                <div className="absolute top-3.5 right-3.5 bg-white/10 text-white border border-white/20 text-[10px] font-medium tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>SELECTED</span>
                </div>
              )}
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 shadow-sm transition-colors ${
                    mode === 'realistic'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-400'
                  }`}
                >
                  <i className="fas fa-bolt text-base" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight mb-1">
                  Realistic Career
                </h2>
                <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-xs mb-3">
                  Authentic job offers & board pressure.
                </p>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium pt-1">
                <i className="fas fa-briefcase text-zinc-500 text-xs" />
                <span>Grassroots offers</span>
              </div>
            </div>
          </div>

          {/* Action CTA: Continue button + Leaderboard link */}
          <div className="flex flex-col items-center w-full">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full max-w-[280px] py-3.5 px-8 rounded-full bg-white hover:bg-zinc-100 text-black font-semibold text-sm sm:text-base shadow-[0_8px_24px_rgba(255,255,255,0.18)] transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center"
            >
              Continue →
            </button>

            <button
              type="button"
              onClick={onShowLeaderboard}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition duration-150 cursor-pointer mt-3"
            >
              <i className="fas fa-trophy text-[#eab308] text-xs" />
              <span>View Global Leaderboard</span>
            </button>
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
            <div className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] text-zinc-400 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80" />
              <span>Step 02 · Executive Dossier</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight uppercase text-white">
              Coach Identity & Jurisdiction
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal max-w-lg mx-auto mt-1">
              Define your coaching credentials, managerial inception era, and continental jurisdiction.
            </p>
          </div>

          {/* Dual Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {/* Left Card: Personal Dossier */}
            <div className="bg-[#14151e] border border-white/[0.05] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              <div>
                {/* Dossier Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xs">
                      <i className="fas fa-user-tie" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                        Personal Dossier
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-normal">
                        Name & Inception Era
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                    Pro License
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Name Input */}
                  <div
                    className={`p-3.5 px-4 rounded-xl border transition duration-150 ${
                      nameError
                        ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_14px_rgba(244,63,94,0.15)]'
                        : 'bg-black/40 border-white/[0.06] focus-within:border-sky-500/40 focus-within:ring-1 focus-within:ring-sky-500/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <label
                        className={`text-xs font-medium block uppercase tracking-wider ${
                          nameError ? 'text-rose-400' : 'text-zinc-400'
                        }`}
                      >
                        Head Coach Name
                      </label>
                      {nameError && (
                        <span className="text-[10px] font-semibold text-rose-400">
                          Required
                        </span>
                      )}
                    </div>
                    <input
                      ref={nameInputRef}
                      type="text"
                      maxLength={24}
                      value={managerName}
                      onChange={(e) => {
                        setManagerName(e.target.value);
                        setNameError(false);
                      }}
                      placeholder="e.g. Alfred Gislason"
                      className="bg-transparent w-full text-white font-semibold text-base sm:text-lg outline-none placeholder-zinc-600 tracking-tight"
                    />
                  </div>

                  {/* Start Year Input */}
                  <div className="bg-black/40 border border-white/[0.06] focus-within:border-sky-500/40 focus-within:ring-1 focus-within:ring-sky-500/20 p-3.5 px-4 rounded-xl transition">
                    <label className="text-xs text-zinc-400 font-medium block uppercase tracking-wider mb-1">
                      Start Year (Inception)
                    </label>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        min={1990}
                        max={2030}
                        value={startYear}
                        onChange={(e) => setStartYear(parseInt(e.target.value) || 2026)}
                        className="bg-transparent w-full text-white font-semibold text-base sm:text-lg outline-none tabular-nums"
                      />
                      <span className="text-xs text-zinc-500 font-medium shrink-0">
                        Season {startYear}/{(startYear + 1).toString().slice(-2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-6 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-shield text-[10px] text-zinc-500" />
                  <span>Credential Status</span>
                </span>
                <span className="text-zinc-400 font-medium">Free Agent · Ready</span>
              </div>
            </div>

            {/* Right Card: Continental Jurisdiction & Territory */}
            <div className="bg-[#14151e] border border-white/[0.05] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              <div>
                {/* Jurisdiction Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xs">
                      <i className="fas fa-earth-europe" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                        Jurisdiction & Pyramids
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-normal">
                        Territory Focus
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                    {nationality === 'ALL' ? 'Global' : nationality}
                  </span>
                </div>

                {/* Continent Selector */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/[0.04] w-fit mb-3.5 gap-1">
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
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer ${
                        continentFilter === cont
                          ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm'
                          : 'text-zinc-400 hover:text-white border border-transparent'
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
                            ? 'bg-sky-500/[0.05] border-sky-500/20 text-sky-300 shadow-sm'
                            : 'bg-black/30 border-white/[0.04] text-zinc-400 hover:text-white hover:border-white/10'
                        } ${!isActive ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <span className="text-sm">{country.flag}</span>
                        <span>{country.name}</span>
                        {clubCount > 0 && (
                          <span className="text-[10px] text-zinc-500 font-normal tabular-nums">
                            {clubCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Footer */}
              <div className="mt-6 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-500">
                <span>Selected Pyramid</span>
                <span className="text-zinc-300 font-medium">
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
              className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] font-semibold text-xs transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <i className="fas fa-arrow-left text-xs" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep3}
              className="bg-white hover:bg-zinc-100 text-black font-semibold text-xs sm:text-sm py-2.5 px-6 rounded-xl transition duration-150 active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(255,255,255,0.15)] flex items-center gap-2"
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
          className="relative w-full max-w-4xl mx-auto rounded-2xl bg-[#14151e] border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden p-6 sm:p-8"
        >
          {/* Top Delicate Ambient Glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="text-center relative z-10 pb-6 border-b border-white/[0.04] mb-6">
            <div className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] text-purple-400 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Step 03 · Tactical Doctrine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight uppercase text-white">
              Tactical Philosophy & Vision
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal max-w-lg mx-auto mt-1">
              Choose the tactical identity you will instill in your squad. Affects scoring cadence, defensive grit, and match engine outcomes.
            </p>
          </div>

          {/* Philosophy Cards Grid */}
          <div className="space-y-3 relative z-10">
            {Object.keys(PHILOSOPHIES).map((tacKey) => {
              const tac = PHILOSOPHIES[tacKey];
              const isSelected = tactic === tacKey;
              const gfPct = Math.round((tac.gfMod - 1) * 100);
              const gaPct = Math.round((tac.gaMod - 1) * 100);

              const gfText = gfPct > 0 ? `+${gfPct}%` : `${gfPct}%`;
              const gaText = gaPct > 0 ? `+${gaPct}%` : `${gaPct}%`;

              return (
                <div
                  key={`tactic-${tacKey}`}
                  onClick={() => setTactic(tacKey)}
                  className={`p-4 sm:p-5 rounded-xl flex items-start gap-4 cursor-pointer transition-all duration-150 border text-left relative ${
                    isSelected
                      ? 'border-purple-500/30 bg-purple-500/[0.04] shadow-[0_4px_20px_rgba(168,85,247,0.08)]'
                      : 'border-white/[0.04] bg-[#10121a] hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Tactic Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-300 shadow-sm'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400'
                    }`}
                  >
                    <tac.icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h4 className="font-semibold text-white text-base tracking-tight">
                        {tacKey}
                      </h4>
                      <span className="text-xs text-zinc-400 font-normal">
                        {tac.en}
                      </span>
                    </div>

                    {/* Perk Line */}
                    <div className="flex items-center gap-1.5 text-xs text-amber-300/90 font-medium mt-1">
                      <i className="fas fa-bolt text-amber-400 text-[10px]" />
                      <span>{tac.perkEn}</span>
                    </div>

                    {/* Narrative Description */}
                    <p className="text-xs text-zinc-400 mt-1 leading-snug font-normal">
                      {tac.effectDescEn}
                    </p>

                    {/* Engine Rate Chips */}
                    <div className="flex items-center gap-2 mt-2.5 text-xs font-medium">
                      <span className="bg-white/[0.03] border border-white/[0.04] rounded-lg px-2 py-0.5 text-zinc-300 tabular-nums">
                        GF: <strong className="text-emerald-400 font-semibold tabular-nums">{gfText}</strong>
                      </span>
                      <span className="bg-white/[0.03] border border-white/[0.04] rounded-lg px-2 py-0.5 text-zinc-300 tabular-nums">
                        GA: <strong className="text-sky-400 font-semibold tabular-nums">{gaText}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Radio / Selection Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                      isSelected
                        ? 'border-purple-400/50 bg-purple-500/20 text-purple-300 shadow-sm'
                        : 'border-white/20 bg-black/40'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-white/[0.04] relative z-10 flex-wrap">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] font-semibold text-xs transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <i className="fas fa-arrow-left text-xs" />
              <span>Back to Identity</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep4}
              className="bg-white hover:bg-zinc-100 text-black font-semibold text-xs sm:text-sm py-2.5 px-6 rounded-xl transition duration-150 active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(255,255,255,0.15)] flex items-center gap-2"
            >
              <span>Proceed to Club Selection</span>
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
          className="relative w-full max-w-5xl mx-auto rounded-2xl bg-[#14151e] border border-amber-500/20 shadow-[0_20px_60px_rgba(245,158,11,0.08)] overflow-hidden p-5 sm:p-7"
        >
          {/* Top Delicate Ambient Glow */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="text-center relative z-10 pb-5 border-b border-white/[0.04] mb-5">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <i className="fas fa-building text-[10px] text-amber-400" />
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
                {mode === 'standard'
                  ? 'OPEN FRANCHISE SELECTION · ALL TIERS'
                  : 'INBOUND CONTRACT OFFERS · 4 OFFICIAL PROPOSALS'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight leading-tight uppercase text-white drop-shadow-sm">
              {mode === 'standard'
                ? t('Choose Your Club', 'Verein Waehlen')
                : t('Grassroots Job Offers', 'Vertrags-Angebote')}
            </h2>

            <p className="text-[13px] text-zinc-300 leading-relaxed font-normal max-w-lg mx-auto mt-1">
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

            {/* Active Mod Pill */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowModModal(true)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition border cursor-pointer active:scale-95 shadow-sm ${
                  isModActive
                    ? 'bg-amber-500/10 border-amber-400/25 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <i className={`fas ${isModActive ? 'fa-shield-halved text-amber-400' : 'fa-database text-zinc-400'} text-xs`} />
                <span>{activeModName || 'Standard Database (Mod Off)'}</span>
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                  isModActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-black/40 text-zinc-400 border-white/[0.04]'
                }`}>
                  {isModActive ? 'ACTIVE' : 'OFF'}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium tabular-nums">· {clubsDb.length} Clubs</span>
              </button>
            </div>
          </div>

          {/* Standard Mode: Search and Country / Tier Filters */}
          {mode === 'standard' && (
            <div className="mb-6 space-y-3.5 relative z-10">
              {/* Search Bar */}
              <div className="max-w-md mx-auto relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t('Search club or city... (e.g. Kiel, Magdeburg)', 'Verein oder Stadt suchen... (z.B. Kiel)')}
                  className="w-full bg-black/50 hover:bg-black/70 focus:bg-black/80 text-white font-medium text-xs pl-10 pr-9 py-2.5 rounded-xl border border-white/10 outline-none transition focus:border-amber-400/60 placeholder-zinc-500 shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-150 border cursor-pointer ${
                      nationality === 'ALL'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm'
                        : 'bg-black/30 border-white/[0.04] text-zinc-400 hover:text-white hover:border-white/15'
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
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition duration-150 border cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm'
                              : 'bg-black/30 border-white/[0.04] text-zinc-400 hover:text-white hover:border-white/15'
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
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition duration-150 border cursor-pointer ${
                      tierFilter === 'all'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm'
                        : 'bg-black/20 text-zinc-500 border-white/[0.04] hover:text-zinc-300'
                    }`}
                  >
                    All Tiers
                  </button>
                  {Array.from({ length: getMaxTier(nationality) }, (_, i) => i + 1).map((tVal) => (
                    <button
                      key={`step4-tier-${tVal}`}
                      type="button"
                      onClick={() => setTierFilter((prev) => (prev === tVal ? 'all' : tVal))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition duration-150 border cursor-pointer ${
                        tierFilter === tVal
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm'
                          : 'bg-black/20 text-zinc-500 border-white/[0.04] hover:text-zinc-300'
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
            <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-8 max-w-md mx-auto text-center my-6">
              <i className="fas fa-search text-3xl text-zinc-600 mb-3 block" />
              <h3 className="text-white font-semibold text-base mb-1">
                No Clubs Found
              </h3>
              <p className="text-zinc-400 text-xs mb-4">
                No club matches "{searchQuery}". Try searching for "Kiel" or "Berlin".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-semibold text-xs py-2 px-5 rounded-xl transition cursor-pointer shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10 ${
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
                  <div
                    key={`club-card-${c.id || c.name || cIdx}-${cIdx}`}
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
                    className={`group rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 border text-left relative overflow-hidden ${
                      isDisabledClub
                        ? 'bg-[#10121a]/40 opacity-40 grayscale cursor-not-allowed border-white/[0.04] pointer-events-none'
                        : isSelected
                        ? 'bg-[#10121a] border-amber-500/50 shadow-[0_10px_30px_rgba(245,158,11,0.12)] cursor-pointer active:scale-[0.98]'
                        : 'bg-[#10121a] hover:bg-amber-500/[0.02] hover:border-amber-500/30 hover:shadow-[0_10px_30px_rgba(245,158,11,0.08)] border-white/[0.04] cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {/* Top Row: Unboxed League & OVR Readout */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5 truncate">
                        <span>{countryInfo?.flag || '🏁'}</span>
                        <span className="truncate">{countryInfo?.name || clubCountry}</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span className="text-zinc-400 font-medium">Tier {c.tier}</span>
                      </div>

                      {/* Tabular OVR Readout */}
                      <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-lg text-xs font-semibold text-amber-300 shrink-0 tabular-nums">
                        <span className="text-[9px] text-zinc-400 uppercase font-medium">OVR</span>
                        <span>{c.baseOvr}</span>
                      </div>
                    </div>

                    {/* Logo & Club Name */}
                    <div className="flex flex-col items-center text-center my-2">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center drop-shadow-md">
                        <ClubLogo
                          club={c}
                          name={c.name}
                          color={c.color}
                          logo={c.logo}
                          fallbackLogo={c.fallbackLogo}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-lg p-0.5"
                          fallbackClassName="w-16 h-16 sm:w-20 sm:h-20 text-xl rounded-2xl shadow-lg flex items-center justify-center font-semibold text-white border border-white/10 shrink-0"
                        />
                      </div>

                      <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight truncate w-full px-1">
                        {c.name}
                      </h3>

                      {/* Reserve Club indicator */}
                      {isReserveClub(c.name) && (
                        <div className="text-[10px] font-semibold text-amber-400/90 mt-0.5">
                          Reserve Squad
                        </div>
                      )}

                      {/* Historic Narrative / Vision */}
                      {clubContext && (
                        <div className="w-full text-xs text-zinc-300/85 italic text-center line-clamp-2 min-h-[32px] px-1 mt-1.5 leading-snug border-t border-white/[0.04] pt-1.5">
                          "{clubContext}"
                        </div>
                      )}
                    </div>

                    {/* 2x2 Metric Grid */}
                    <div className="mt-3 pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-1.5 text-[11px] font-medium">
                      <div className="bg-black/30 border border-white/[0.04] rounded-lg p-1.5 px-2 flex items-center gap-1.5 text-zinc-300 tabular-nums">
                        <i className="fas fa-users text-amber-400/80 text-[10px]" />
                        <span className="truncate">{c.stadium ? `${formatNum(c.stadium)} Seats` : 'Arena'}</span>
                      </div>
                      <div className="bg-black/30 border border-white/[0.04] rounded-lg p-1.5 px-2 flex items-center gap-1.5 text-emerald-300 tabular-nums">
                        <i className="fas fa-coins text-amber-400/80 text-[10px]" />
                        <span className="truncate">{formatMoney(startingBudget)}</span>
                      </div>
                    </div>

                    {/* Sign Contract CTA bar */}
                    <div className="mt-3 pt-2">
                      <div
                        className={`w-full py-2 rounded-xl text-center text-xs font-semibold tracking-normal transition-all duration-150 border shadow-sm ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-400 font-semibold'
                            : 'bg-white/[0.04] group-hover:bg-amber-500/10 group-hover:text-amber-300 text-zinc-300 border-white/[0.06] group-hover:border-amber-500/20'
                        }`}
                      >
                        {isSelected ? 'Selected · View Mandate →' : 'Select Club'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-white/[0.04] relative z-10 flex-wrap">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] font-semibold text-xs tracking-normal transition active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <i className="fas fa-arrow-left text-xs" />
              <span>Back to Vision</span>
            </button>

            <span className="text-xs text-zinc-400 font-normal hidden sm:inline tabular-nums">
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

        return (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto space-y-5 pt-1 pb-6 font-sans text-neutral-200"
          >
            {/* 1. Official Welcome Letter Hero Box */}
            <div className="bg-[#14151e] border border-white/[0.05] rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
              {/* Top Ambient Glow */}
              <div
                className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24 opacity-25"
                style={{ backgroundColor: selectedClub.color || '#f59e0b' }}
              />

              {/* Header row */}
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pb-5 border-b border-white/[0.05]">
                <div className="w-14 h-14 rounded-xl object-contain bg-white/[0.03] p-1 border border-white/[0.08] flex items-center justify-center shrink-0 shadow-md">
                  <ClubLogo
                    club={selectedClub}
                    name={selectedClub.name}
                    color={selectedClub.color}
                    logo={selectedClub.logo}
                    fallbackLogo={selectedClub.fallbackLogo}
                    className="w-12 h-12 object-contain drop-shadow p-0.5"
                    fallbackClassName="w-12 h-12 text-lg rounded-lg flex items-center justify-center font-semibold text-white border border-white/10"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400 flex items-center gap-1.5 mb-1">
                    <i className="fas fa-signature text-xs" />
                    <span>Official Board Appointment & Charter</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight truncate">
                    Welcome to {selectedClub.name}, Coach {managerName.trim().toUpperCase() || 'COACH'}
                  </h1>

                  <div className="text-xs text-zinc-400 font-normal mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-zinc-300 font-medium">
                      Division: {leagueInfo?.name || `Tier ${selectedClub.tier}`} (Tier {selectedClub.tier})
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span>
                      Home Arena: <span className="text-zinc-300 font-medium">{homeArena}</span> (<span className="tabular-nums">{stadiumCap.toLocaleString()}</span> Seats)
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span>
                      Era: <span className="text-zinc-300 font-medium tabular-nums">{startYear}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="relative z-10 pt-5 text-xs sm:text-sm text-zinc-300/90 leading-relaxed space-y-2">
                <p>
                  The Supervisory Board and Club Executive Committee have formally ratified your appointment as Head Coach ahead of the{' '}
                  <span className="text-white font-medium tabular-nums">{startYear}</span> campaign. You have been granted complete executive stewardship over squad recruitment, tactical doctrine, and long-term infrastructure investment.
                </p>
                {activeRoadmap?.narrativeEn && (
                  <p className="text-zinc-400 italic text-xs border-l-2 border-amber-500/40 pl-3 py-1 mt-2">
                    "{activeRoadmap.narrativeEn}"
                  </p>
                )}
              </div>
            </div>

            {/* 2. Governance Micro-Indicators Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Board Confidence */}
              <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium flex items-center gap-1.5">
                  <i className="fas fa-shield-halved text-emerald-400 text-xs" />
                  <span>Board Confidence</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold text-emerald-400 tabular-nums">100%</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-medium">Approval</span>
                </div>
              </div>

              {/* Starting Treasury */}
              <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium flex items-center gap-1.5">
                  <i className="fas fa-vault text-amber-400 text-xs" />
                  <span>Treasury Reserves</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold text-white tabular-nums">{formatMoney(startingBudget)}</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-medium">Budget</span>
                </div>
              </div>

              {/* Charter Horizon */}
              <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium flex items-center gap-1.5">
                  <i className="fas fa-compass text-sky-400 text-xs" />
                  <span>Charter Horizon</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold text-white tabular-nums">{activeRoadmap?.horizonYears || 3}</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-medium tabular-nums">
                    Seasons ({startYear}–{startYear + (activeRoadmap?.horizonYears || 3)})
                  </span>
                </div>
              </div>

              {/* Tactical Doctrine */}
              <div className="bg-[#14151e] border border-white/[0.04] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium flex items-center gap-1.5">
                  <i className="fas fa-chess text-purple-400 text-xs" />
                  <span>Tactical Doctrine</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-semibold text-white truncate">{tactic}</span>
                </div>
              </div>
            </div>

            {/* 3. Board Roadmap Goals Box */}
            <div className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.04] mb-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5 mb-0.5">
                    <i className="fas fa-list-check text-xs" />
                    <span>Mandate Directives & Deliverables</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {activeRoadmap?.titleEn || 'Club Strategic Roadmap'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg tabular-nums">
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
                        className="bg-black/30 border border-white/[0.04] hover:border-white/[0.08] rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                              <i className={`fas ${meta.icon} text-xs`} />
                              <span>{meta.label}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-amber-400/90 bg-amber-500/[0.06] border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider tabular-nums">
                              Directive 0{idx + 1}
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight mb-1.5">
                            {goal.titleEn}
                          </h4>
                          <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                            {goal.descriptionEn}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2 flex-wrap text-xs">
                          <span className="text-[11px] text-zinc-500 font-medium">Bounty on Completion:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums">
                              +{goal.rewardMp} MP
                            </span>
                            {Boolean(goal.rewardCash) && (
                              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums">
                                +{formatMoney(goal.rewardCash!)}
                              </span>
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
            <div className="flex items-center justify-between gap-3 pt-5 border-t border-white/[0.04] flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setStep(4);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] font-semibold text-xs tracking-normal transition active:scale-[0.98] cursor-pointer flex items-center gap-2"
              >
                <i className="fas fa-arrow-left text-xs" />
                <span>Back to Club Selection</span>
              </button>

              <button
                type="button"
                onClick={handleFinalStartGame}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer shadow-amber-500/10"
              >
                <span>Enter Front Office & Begin Season</span>
                <i className="fas fa-arrow-right text-xs" />
              </button>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
};
