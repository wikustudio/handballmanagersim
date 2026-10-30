import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Club, GameMode, Language, Coach } from '../types';
import { COUNTRIES, LEAGUES, COUNTRY_LEAGUES, getLeagueInfo, PHILOSOPHIES, TACTICS, getMonogramHex, getInitials, isReserveClub, getMaxTier, getClubHistoricContext, formatMoney, getStartingBudget, MOD_ONLY_COUNTRIES, BASE_GAME_COUNTRIES, isCanadianMLSClub, isTacticalSynergy } from '../data/gameConstants';
import { UEFA_COUNTRIES, CONMEBOL_COUNTRIES, CONCACAF_COUNTRIES, AFC_COUNTRIES } from '../utils/regionHelpers';
import { ClubLogo } from './ClubLogo';
import { prewarmClubsLogos } from '../utils/logoCache';
import { ModModal } from './ModModal';
import { generateCoachMarket, getCoachArchetypeConfig } from '../engine/coachEngine';
import { CoachDossierModal } from './CoachDossierModal';
import { t as tr } from '../data/translations';
import { ALL_CLUBS } from '../data/clubsData';
import { parseAndNormalizeModBudget } from '../engine/moddingEngine';

interface OnboardingProps {
  lang: Language;
  clubsDb: Club[];
  isModActive?: boolean;
  onToggleMod?: (active: boolean, customClubs?: Club[]) => void;
  setClubsDb?: (db: Club[]) => void;
  showToast?: (msg: string, type: string) => void;
  onStartGame: (params: {
    club: Club;
    managerName: string;
    startYear: number;
    tactic: string;
    nationality: string;
    mode: GameMode;
    archetype: 'legend' | 'finance' | 'scout' | 'balanced';
    coach?: Coach;
  }) => void;
  onShowLeaderboard: () => void;
  onShowAbout?: () => void;
}


import { normalizeAndValidateCustomDb, CustomDbValidationResult } from '../engine/moddingEngine';
export type { CustomDbValidationResult };
export { normalizeAndValidateCustomDb };



const getStyleColor = (style: string) => {
  if (style === 'Total Football') return 'text-orange-500';
  if (style === 'Gegenpressing') return 'text-yellow-400';
  if (style === 'Tiki-Taka') return 'text-blue-500';
  if (style === 'Defensive' || style === 'Catenaccio' || style === 'Park the Bus') return 'text-emerald-400';
  if (style === 'Direct Counter' || style === 'Wing Play') return 'text-cyan-400';
  return 'text-zinc-400'; // Default / Survival
};

const getCoachQuote = (ovrBoost: number, isDe: boolean, coachId: string) => {
  const hash = coachId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const quotes3 = isDe 
    ? ["Ein visionärer Trainer, der den Verein transformieren wird.", "Ein taktisches Genie. Der Vorstand liebt diese Wahl.", "Weltklasse-Format. Erwarte sofortige Ergebnisse."]
    : ["An absolute visionary. Will transform the club.", "A tactical genius. The board loves this appointment.", "World-class pedigree. Expect immediate results."];
    
  const quotes2 = isDe
    ? ["Sehr gefragt. Ein massiver Coup für uns.", "Ein aufsteigender Stern in der Trainerwelt.", "Spannende Philosophie. Die Fans werden begeistert sein.", "Garant für Erfolge über den Erwartungen."]
    : ["Highly sought after. A massive coup for us.", "A rising star in the sporting director world.", "Exciting philosophy. The fans will be thrilled.", "Proven track record of overachieving."];
    
  const quotes1 = isDe
    ? ["Solide Grundlagen. Eine sichere Wahl.", "Kennt die Liga gut. Eine pragmatische Entscheidung.", "Eine ruhige Präsenz, um die Kabine zu stabilisieren.", "Respektabler Taktiker. Wird seinen Job machen.", "Guter Menschenfänger mit ordentlichem Lebenslauf."]
    : ["Solid fundamentals. A safe pair of hands.", "Knows the league well. A pragmatic choice.", "A steady presence to stabilize the dressing room.", "Respectable tactician. Will get the job done.", "Good man-manager (coach) with a decent resume."];
    
  const quotes0 = isDe
    ? ["Sofort verfügbar und günstig im Unterhalt.", "Braucht eine Chance, sich auf diesem Niveau zu beweisen.", "Eine risikoarme Wahl für unser aktuelles Budget.", "Hatte zuletzt Probleme, ist aber heiß auf einen Neustart."]
    : ["Affordable and available immediately.", "Needs a chance to prove himself at this level.", "A low-risk appointment for our current budget.", "Struggled previously, but eager for a fresh start."];
    
  const quotesMinus = isDe
    ? ["Eine riskante Wahl, aber er passt ins Budget.", "Verzweifelte Zeiten erfordern verzweifelte Maßnahmen.", "Berüchtigt für Kabinen-Probleme. Vorsicht geboten."]
    : ["A controversial choice, but fits the budget.", "Desperate times call for desperate measures.", "Known for losing the dressing room. Proceed with caution."];

  if (ovrBoost >= 3) return quotes3[hash % quotes3.length];
  if (ovrBoost === 2) return quotes2[hash % quotes2.length];
  if (ovrBoost === 1) return quotes1[hash % quotes1.length];
  if (ovrBoost === 0) return quotes0[hash % quotes0.length];
  return quotesMinus[hash % quotesMinus.length];
};

const getQuickChips = (country: string, modActive: boolean): string[] => {
  if (country === 'GER') {
    return modActive
      ? ['Bayern', 'Dortmund', 'Leverkusen', 'Leipzig', 'St. Pauli', 'Schalke', 'HSV']
      : ['Bavaria', 'Prussia', 'Leverkusen', 'Leipzig', 'St. Pauli', 'Hamburg'];
  }
  if (country === 'ENG') {
    return modActive
      ? ['Man City', 'Arsenal', 'Liverpool', 'Man United', 'Chelsea', 'Richmond']
      : ['Manchester Blue', 'Liverpool Red', 'Arsenal', 'London Blue', 'Richmond'];
  }
  if (country === 'ESP') {
    return modActive
      ? ['Real Madrid', 'Barcelona', 'Atlético', 'Sevilla', 'Athletic Club']
      : ['Madrid White', 'Barcelona Blue', 'Madrid Red', 'Sevilla'];
  }
  if (country === 'ITA') {
    return modActive
      ? ['Inter', 'Juventus', 'Milan', 'Roma', 'Napoli']
      : ['Milano Black', 'Piedmont Black', 'Milano Red', 'Rome Yellow'];
  }
  if (country === 'FRA') {
    return modActive
      ? ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille']
      : ['Paris Capital', 'Marseille Port', 'Monaco Rock'];
  }
  if (country === 'USA') {
    return ['Inter Miami', 'LA Galaxy', 'LAFC', 'NYCFC', 'Atlanta United'];
  }
  if (country === 'POR') {
    return modActive ? ['Benfica', 'Sporting', 'Porto', 'Braga'] : ['Lisbon Eagle', 'Lisbon Lion', 'Porto Dragon'];
  }
  return modActive
    ? ['Bayern', 'Real Madrid', 'Man City', 'Barcelona', 'PSG', 'Richmond']
    : ['Bavaria', 'Madrid White', 'Manchester Blue', 'Richmond'];
};

const RANDOM_NAMES = [
  'Alex Ferguson', 'Pep Guardiola', 'Jürgen Klopp', 'Carlo Ancelotti',
  'José Mourinho', 'Arsène Wenger', 'Zinedine Zidane', 'Diego Simeone',
  'Marcelo Bielsa', 'Julian Nagelsmann', 'Xabi Alonso', 'Roberto De Zerbi',
  'Hansi Flick', 'Unai Emery', 'Antonio Conte', 'Ralf Rangnick',
  'Louis van Gaal', 'Luciano Spalletti', 'Gian Piero Gasperini', 'Rúben Amorim',
  'Thomas Tuchel', 'Erik ten Hag'
];

interface TacticVisualInfo {
  theme: {
    gradient: string;
    activeBorder: string;
    ring: string;
    glow: string;
    badgeBg: string;
    iconBg: string;
    accentText: string;
  };
  shortEthos: string;
  shortPerk: string;
  gf: string;
  ga: string;
  isGfPos: boolean;
  isGaPos: boolean;
}

const TACTIC_DETAILS: Record<string, TacticVisualInfo> = {
  'Total Football': {
    theme: {
      gradient: 'from-sky-500/[0.08] to-transparent',
      activeBorder: 'border-sky-400/50',
      ring: 'ring-sky-400/25',
      glow: 'shadow-[0_8px_30px_rgba(56,189,248,0.14),inset_0_1px_0_0_rgba(125,211,252,0.2)]',
      badgeBg: 'bg-sky-500/15 text-sky-200 border-sky-400/25',
      iconBg: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      accentText: 'text-sky-300',
    },
    shortEthos: 'Fluid Attack & Dynamic Play',
    shortPerk: '+12% Fans · +1 Home OVR',
    gf: '+18%',
    ga: '+10%',
    isGfPos: true,
    isGaPos: false,
  },
  'Gegenpressing': {
    theme: {
      gradient: 'from-sky-500/[0.08] to-transparent',
      activeBorder: 'border-sky-400/50',
      ring: 'ring-sky-400/25',
      glow: 'shadow-[0_8px_30px_rgba(56,189,248,0.14),inset_0_1px_0_0_rgba(125,211,252,0.2)]',
      badgeBg: 'bg-sky-500/15 text-sky-200 border-sky-400/25',
      iconBg: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      accentText: 'text-sky-300',
    },
    shortEthos: 'High-Intensity Press & Chaos',
    shortPerk: 'Giant-Killer +3 OVR in Cups',
    gf: '+28%',
    ga: '+22%',
    isGfPos: true,
    isGaPos: false,
  },
  'Tiki-Taka': {
    theme: {
      gradient: 'from-sky-500/[0.08] to-transparent',
      activeBorder: 'border-sky-400/50',
      ring: 'ring-sky-400/25',
      glow: 'shadow-[0_8px_30px_rgba(56,189,248,0.14),inset_0_1px_0_0_rgba(125,211,252,0.2)]',
      badgeBg: 'bg-sky-500/15 text-sky-200 border-sky-400/25',
      iconBg: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      accentText: 'text-sky-300',
    },
    shortEthos: 'Positional Possession & Control',
    shortPerk: '+15% Sponsors · Dominance',
    gf: '-12%',
    ga: '-28%',
    isGfPos: false,
    isGaPos: true,
  },
  'Defensive': {
    theme: {
      gradient: 'from-sky-500/[0.08] to-transparent',
      activeBorder: 'border-sky-400/50',
      ring: 'ring-sky-400/25',
      glow: 'shadow-[0_8px_30px_rgba(56,189,248,0.14),inset_0_1px_0_0_rgba(125,211,252,0.2)]',
      badgeBg: 'bg-sky-500/15 text-sky-200 border-sky-400/25',
      iconBg: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      accentText: 'text-sky-300',
    },
    shortEthos: 'Low-Block Fortress & Survival',
    shortPerk: '-40% Goal Damage · Safe',
    gf: '-38%',
    ga: '-48%',
    isGfPos: false,
    isGaPos: true,
  },
  'Direct Counter': {
    theme: {
      gradient: 'from-sky-500/[0.08] to-transparent',
      activeBorder: 'border-sky-400/50',
      ring: 'ring-sky-400/25',
      glow: 'shadow-[0_8px_30px_rgba(56,189,248,0.14),inset_0_1px_0_0_rgba(125,211,252,0.2)]',
      badgeBg: 'bg-sky-500/15 text-sky-200 border-sky-400/25',
      iconBg: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      accentText: 'text-sky-300',
    },
    shortEthos: 'Rapid Vertical Counter-Attack',
    shortPerk: '+2 Away OVR · Squad Savings',
    gf: '+5%',
    ga: '-12%',
    isGfPos: true,
    isGaPos: true,
  },
};

export const Onboarding: React.FC<OnboardingProps> = ({
  setClubsDb,
  showToast,
  lang,
  clubsDb,
  isModActive = false,
  onToggleMod,
  onStartGame,
  onShowLeaderboard,
  onShowAbout,
}) => {
  const isDe = lang === 'de';

  const [step, setStep] = useState<number>(1);
  const [coachMarket, setCoachMarket] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [mode, setMode] = useState<GameMode>('realistic');
  const [archetype, setArchetype] = useState<'legend' | 'finance' | 'scout' | 'balanced'>('balanced');
  const [selectedClubForArchetype, setSelectedClubForArchetype] = useState<Club | null>(null);
  const [managerName, setManagerName] = useState<string>('');
  const [nameError, setNameError] = useState<boolean>(false);
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [showModModal, setShowModModal] = useState<boolean>(false);
  const [nationality, setNationality] = useState<string>('GER');
  const [tactic, setTactic] = useState<string>('Total Football');
  const [tierFilter, setTierFilter] = useState<number | 'all'>(1);
  const [showAllClubs, setShowAllClubs] = useState<boolean>(false);
  const [showCustomTactics, setShowCustomTactics] = useState<boolean>(false);
  const [continentFilter, setContinentFilter] = useState<'ALL' | 'EUROPE' | 'AMERICAS' | 'APAC'>('ALL');
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [subStep2, setSubStep2] = useState<'2A' | '2B'>('2A');
  const [startingOffers, setStartingOffers] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const t = (en: string, de?: string, _ignoredEs?: string) => tr(lang, en, de);

  const [dossierCoach, setDossierCoach] = useState<Coach | null>(null);

  React.useEffect(() => {
    if (step === 4 && selectedClubForArchetype) {
      const tier = selectedClubForArchetype.tier;
      const country = selectedClubForArchetype.country || 'GER';
      let initRep = 50;
      if (archetype === 'legend') initRep += 50;
      if (archetype === 'scout') initRep -= 30;
      const pool = generateCoachMarket(tier, country, initRep, 0);
      // Guarantee at least one coach matches the selected director tactic
      if (!pool.some(c => isTacticalSynergy(c.style, tactic))) {
        if (pool[0]) pool[0].style = tactic;
      }
      setCoachMarket(pool);
    }
  }, [step, selectedClubForArchetype, archetype, tactic]);

  // Keep selected club and starting offers updated if clubsDb changes (e.g. mod loaded or toggled)
  useEffect(() => {
    if (selectedClubForArchetype) {
      const match = clubsDb.find(c => c.id === selectedClubForArchetype.id);
      if (match && (match.name !== selectedClubForArchetype.name || match.logo !== selectedClubForArchetype.logo)) {
        setSelectedClubForArchetype(match);
      }
    }
    if (startingOffers.length > 0) {
      setStartingOffers(prev => prev.map(offer => {
        const match = clubsDb.find(c => c.id === offer.id);
        return match || offer;
      }));
    }
  }, [clubsDb, selectedClubForArchetype?.id]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Validate tierFilter whenever nationality changes, and reset to 'GER' if selected nation is mod-only while mod is inactive
  React.useEffect(() => {
    if (!isModActive && MOD_ONLY_COUNTRIES.includes(nationality)) {
      setNationality('GER');
      setTierFilter('all');
    }
    const maxT = getMaxTier(nationality, clubsDb);
    if (tierFilter !== 'all' && typeof tierFilter === 'number' && tierFilter > maxT) {
      setTierFilter('all');
    }
  }, [nationality, tierFilter, clubsDb, isModActive]);

  const activeCountriesForContinent = useMemo(() => {
    return Object.keys(COUNTRIES).filter((k) => {
      if (!isModActive && MOD_ONLY_COUNTRIES.includes(k)) return false;
      if (continentFilter === 'ALL') return true;
      const eur = UEFA_COUNTRIES;
      const amr = [...CONMEBOL_COUNTRIES, ...CONCACAF_COUNTRIES];
      const asi = AFC_COUNTRIES;
      if (continentFilter === 'EUROPE') return eur.includes(k);
      if (continentFilter === 'AMERICAS') return amr.includes(k);
      if (continentFilter === 'APAC') return asi.includes(k);
      return true;
    });
  }, [continentFilter, isModActive]);

  const availableLeaguesForCountry = useMemo(() => {
    if (nationality === 'ALL') return [];
    
    // Find all clubs in this country from clubsDb
    const clubsInCountry = clubsDb.filter((c) => (c.country || 'GER') === nationality);
    
    // Dynamically discover all tiers present in the database (supports custom community mod tiers)
    const dbTiers: number[] = Array.from(new Set(clubsInCountry.map((c) => c.tier)))
      .filter((t): t is number => typeof t === 'number' && t > 0);
      
    // Also include standard preset tiers for this country if populated
    const standardMax = getMaxTier(nationality, clubsDb);
    const combinedTiers = new Set<number>(dbTiers);
    for (let t = 1; t <= standardMax; t++) {
      if (clubsInCountry.some(c => c.tier === t) || (combinedTiers.size === 0 && t <= 3)) {
        combinedTiers.add(t);
      }
    }

    const sortedTiers = Array.from(combinedTiers).sort((a, b) => a - b);
    const countryLeagues = COUNTRY_LEAGUES[nationality] || {};
    
    return sortedTiers.map((t) => {
      const sampleClub = clubsInCountry.find(c => c.tier === t);
      const customLeagueName = (sampleClub as any)?.leagueName || (sampleClub as any)?.league;
      const info = countryLeagues[t] || getLeagueInfo(t, nationality, customLeagueName);
      return {
        tier: t,
        name: customLeagueName || info?.name || `Tier ${t}`,
        tag: info?.tag || `T${t}`
      };
    });
  }, [nationality, clubsDb]);

  const [sortBy, setSortBy] = useState<'tier' | 'ovr' | 'budget' | 'name'>('tier');

  const displayedClubs = useMemo(() => {
    if (mode !== 'standard') return startingOffers;
    const rawQuery = searchQuery.trim();

    const matchesCountryFilter = (c: Club) => {
      if (nationality === 'ALL') return true;
      return (c.country || 'GER') === nationality;
    };

    const applySort = (list: Club[]) => {
      return [...list].sort((a, b) => {
        if (sortBy === 'ovr') return (b.baseOvr || 0) - (a.baseOvr || 0) || a.tier - b.tier;
        if (sortBy === 'budget') {
          const bBudget = b.currentBudget != null ? parseAndNormalizeModBudget(b.currentBudget, b.tier, b.country || 'GER') : getStartingBudget(b.tier, b.country || 'GER');
          const aBudget = a.currentBudget != null ? parseAndNormalizeModBudget(a.currentBudget, a.tier, a.country || 'GER') : getStartingBudget(a.tier, a.country || 'GER');
          return bBudget - aBudget;
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return a.tier - b.tier || (b.baseOvr || 0) - (a.baseOvr || 0) || a.name.localeCompare(b.name);
      });
    };

    if (!rawQuery) {
      const filtered = clubsDb.filter(
        (c) =>
          matchesCountryFilter(c) &&
          (tierFilter === 'all' || c.tier === tierFilter)
      );
      return applySort(filtered);
    }

    // Normalization helper: strips accents, diacritics, and non-alphanumeric chars
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

      const aliases: string[] = [];
      if (nameNorm.includes('richmond')) aliases.push('lasso', 'greyhounds', 'ted');
      if (nameNorm.includes('dortmund')) aliases.push('bvb', 'borussia');
      if (nameNorm.includes('bayern')) aliases.push('fcb', 'munich', 'muenchen', 'bavaria');
      if (nameNorm.includes('barcelona')) aliases.push('barca', 'blaugrana');
      if (nameNorm.includes('real madrid')) aliases.push('galacticos', 'merengues', 'rm');
      if (nameNorm.includes('atletico madrid')) aliases.push('atleti', 'colchoneros');
      if (nameNorm.includes('manchester city')) aliases.push('man city', 'citizens', 'mcfc');
      if (nameNorm.includes('manchester united')) aliases.push('man utd', 'man united', 'mufc', 'red devils');
      if (nameNorm.includes('tottenham')) aliases.push('spurs');
      if (nameNorm.includes('arsenal')) aliases.push('gunners');
      if (nameNorm.includes('liverpool')) aliases.push('reds', 'lfc');
      if (nameNorm.includes('chelsea')) aliases.push('blues', 'cfc');
      if (nameNorm.includes('paris saint germain') || nameNorm.includes('psg')) aliases.push('paris', 'psg');
      if (nameNorm.includes('juventus')) aliases.push('juve', 'bianconeri');
      if (nameNorm.includes('inter') && !nameNorm.includes('miami')) aliases.push('nerazzurri', 'inter milan');
      if (nameNorm.includes('milan') && !nameNorm.includes('inter')) aliases.push('ac milan', 'rossoneri');
      if (nameNorm.includes('roma')) aliases.push('giallorossi');
      if (nameNorm.includes('napoli')) aliases.push('partenopei');
      if (nameNorm.includes('benfica')) aliases.push('slb', 'eagles');
      if (nameNorm.includes('sporting')) aliases.push('scp', 'lions');
      if (nameNorm.includes('porto')) aliases.push('fcp', 'dragons');
      if (nameNorm.includes('toronto')) aliases.push('tfc', 'canada');
      if (nameNorm.includes('montreal')) aliases.push('cfm', 'impact', 'canada');
      if (nameNorm.includes('vancouver')) aliases.push('whitecaps', 'caps', 'canada');
      if (nameNorm.includes('wrexham')) aliases.push('hollywood', 'ryan reynolds');
      if (nameNorm.includes('miami')) aliases.push('inter miami', 'messi');

      const aliasNorm = aliases.map(normalize).join(' ');
      const fullSearchableText = `${nameNorm} ${countryNorm} ${countryNameNorm} ${leagueNameNorm} tier ${c.tier} ${aliasNorm}`;
      return tokens.every((token) => fullSearchableText.includes(token));
    };

    // 1. Search in current filtered country first (ignoring tierFilter during query)
    if (nationality !== 'ALL') {
      const natClubs = clubsDb.filter((c) => matchesCountryFilter(c));
      const natMatches = natClubs.filter(isMatch);
      if (natMatches.length > 0) {
        return applySort(natMatches);
      }
    }

    // 2. Global search across ALL countries if no match in current country or nationality === 'ALL'
    return applySort(clubsDb.filter(isMatch));
  }, [mode, searchQuery, clubsDb, nationality, tierFilter, startingOffers, sortBy]);

  // Pre-warm crests for currently displayed clubs so scrolling and browsing has zero pop-in
  useEffect(() => {
    if (step === 3 && Array.isArray(displayedClubs) && displayedClubs.length > 0) {
      prewarmClubsLogos(displayedClubs.slice(0, 30));
    }
  }, [step, displayedClubs]);

  const [startInLowestLeague, setStartInLowestTier] = useState(false);

  
  const generateRealisticOffers = () => {
      let natClubs = clubsDb;
      let targetTier = 5;

      if (nationality !== 'ALL') {
        natClubs = clubsDb.filter((c) => (c.country || 'GER') === nationality);
        targetTier = getMaxTier(nationality, clubsDb);
        // If Germany, realistic default starts at tier 8
        if (nationality === 'GER') {
          targetTier = 8;
        }
      } else {
        // If ALL countries, just pick very low tier clubs generally (e.g. tier >= 4)
        natClubs = clubsDb;
        targetTier = 4;
      }

      let lowerClubs = natClubs.filter((c) => c.tier >= targetTier).sort(() => 0.5 - Math.random());
      if (lowerClubs.length < 3) lowerClubs = natClubs.filter((c) => c.tier >= targetTier - 1).sort(() => 0.5 - Math.random());
      if (lowerClubs.length < 3) lowerClubs = natClubs.sort(() => 0.5 - Math.random());
      setStartingOffers(lowerClubs.slice(0, 3));
  };

  const handleGoToStep3 = () => {
    if (!managerName.trim()) {
      setNameError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => nameInputRef.current?.focus(), 100);
      return;
    }
    if (mode === 'realistic' && clubsDb.length > 0) {
      generateRealisticOffers();
    }
    if (nationality !== 'ALL') {
      setTierFilter(1);
    }
    setShowAllClubs(false);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`w-full ${step === 3 ? 'max-w-6xl' : 'max-w-5xl'} px-3 sm:px-4 mt-4 md:mt-8 mx-auto transition-all duration-300`}>

      {/* Mod Importer Modal */}
      {showModModal && (
        <ModModal
          lang={lang}
          clubsDb={clubsDb}
          isModActive={isModActive}
          onUpdateClubsDb={(newClubs, active) => {
            if (onToggleMod) {
              onToggleMod(active, newClubs);
            } else if (setClubsDb) {
              setClubsDb(newClubs);
            }
            if (selectedClubForArchetype) {
              const updated = newClubs.find(c => c.id === selectedClubForArchetype.id);
              if (updated) setSelectedClubForArchetype(updated);
            }
            setStartingOffers(prev => prev.map(offer => {
              const match = newClubs.find(c => c.id === offer.id);
              return match || offer;
            }));
          }}
          showToast={showToast}
          onClose={() => setShowModModal(false)}
        />
      )}
      {/* Step Navigation Header (Apple Minimalist Glassmorphism Tracker) */}
      {step > 1 && (
        <div className="max-w-xl mx-auto mb-8 px-4">
          <div className="flex items-center justify-between relative">
            {/* Minimalist connecting track */}
            <div className="absolute top-1/2 left-8 right-8 h-[1.5px] bg-white/[0.08] -translate-y-1/2 pointer-events-none overflow-hidden rounded-full">
              <div 
                className="h-full bg-white/70 transition-all duration-500 rounded-full"
                style={{
                  width: `${
                    step === 1
                      ? 0
                      : step === 2
                      ? subStep2 === '2B'
                        ? (1.5 / 3) * 100
                        : (1 / 3) * 100
                      : ((step - 1) / 3) * 100
                  }%`,
                }}
              />
            </div>
            
            {[
              { num: 1, title: isDe ? 'Modus' : 'Mode', icon: 'fa-gamepad' },
              { num: 2, title: isDe ? 'Profil' : 'Profile', icon: 'fa-user-tie' },
              { num: 3, title: isDe ? 'Verein' : 'Club', icon: 'fa-shield-halved' },
              { num: 4, title: isDe ? 'Trainer' : 'Staff', icon: 'fa-clipboard-user' },
            ].map(s => {
              const isCompleted = step > s.num;
              const isCurrent = step === s.num;
              const canNavigate = step > s.num;
              
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (canNavigate) {
                      setStep(s.num);
                      if (s.num === 2) setSubStep2('2A');
                    }
                  }}
                  disabled={!canNavigate}
                  className={`relative z-10 flex flex-col items-center gap-1.5 transition ${canNavigate ? 'cursor-pointer group' : 'cursor-default'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all backdrop-blur-md ${
                    isCurrent
                      ? 'bg-white text-zinc-950 shadow-lg shadow-black/30 scale-105'
                      : isCompleted
                      ? 'bg-white/10 text-white border border-white/20 group-hover:bg-white/15'
                      : 'bg-white/[0.03] text-zinc-500 border border-white/[0.08]'
                  }`}>
                    {isCompleted ? <i className="fa-solid fa-check text-[10px]"></i> : s.num}
                  </div>
                  <span className={`text-[11px] font-medium tracking-wide transition-colors ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
                  }`}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 1: Game Mode */}
      {step === 1 && (
        <>
          <div className="max-w-2xl mx-auto text-center fade-in px-4 py-4 relative">
          <div className="w-20 h-20 border border-white/10 rounded-3xl mx-auto overflow-hidden shadow-2xl mb-5 bg-white/[0.04] backdrop-blur-xl">
            <img src="/assets/a_footballsim_logo.jpg" alt="Football Manager Sim Logo" className="w-full h-full object-cover" />
          </div>

          {/* Version pill & Tiny CR27 Community Mod Icon Button */}
          <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
            <button 
              onClick={() => onShowAbout && onShowAbout()} 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] shadow-sm cursor-pointer hover:bg-white/[0.12] transition group backdrop-blur-md"
              title="v2.2: Road-to-Glory 11-Tier Scaling, Delta Save Engine & Prestige Legacy (v2.1 & v2.0 Archived)"
            >
              <span 
                className="bg-white font-extrabold text-[10px] px-2 py-0.5 rounded-full tracking-wider shadow-sm"
                style={{ color: '#09090b', backgroundColor: '#ffffff' }}
              >
                v 2.2
              </span>
              <span className="text-zinc-300 group-hover:text-white transition text-xs font-medium pr-1 tracking-wide flex items-center gap-1.5">
                360° Engine Parity & Road-to-Glory v2.2 <span className="text-[10px] text-zinc-500 hidden sm:inline">(v2.1 Archived)</span> <i className="fa-solid fa-chevron-right text-[9px] opacity-50 group-hover:opacity-100 transition"></i>
              </span>
            </button>

            {/* Tiny CR27 Community Mod Icon Button */}
            <button
              type="button"
              onClick={() => setShowModModal(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all shadow-sm backdrop-blur-md active:scale-95 ${
                isModActive
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_14px_rgba(16,185,129,0.3)]'
                  : 'border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="CR27_Footy Community Mod (Toggle & JSON Export/Import)"
            >
              <i className="fa-solid fa-shield-halved text-xs text-sky-400"></i>
              <span className="text-[11px] font-bold">CR27</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isModActive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'}`}></span>
            </button>
          </div>

          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-2.5">
            {t('Football Manager Sim', 'Fussball Manager Sim')}
          </h1>
          <p className="text-sm md:text-base text-zinc-400 mb-8 font-normal max-w-lg mx-auto leading-relaxed">
            {t(
              'Lead a club over 35 seasons. Hire coaches, scout talent, and build a dynasty.',
              'Fuehre einen Verein ueber 35 Saisons. Stelle Trainer ein, scoute Talente und baue eine Dynastie auf.'
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto fade-in-delay-1 text-center">
            <div
              onClick={() => setMode('standard')}
              className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center justify-between min-h-[160px] backdrop-blur-2xl ${
                mode === 'standard'
                  ? 'bg-white/[0.12] border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.18)] ring-1 ring-white/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-white/[0.16]'
              }`}
            >
              {mode === 'standard' && (
                <span className="absolute top-3.5 right-3.5 text-[10px] font-semibold uppercase tracking-wider bg-white text-zinc-950 px-2 py-0.5 rounded-full shadow-sm">
                  {isDe ? 'Aktiv' : 'Selected'}
                </span>
              )}
              <div className="flex flex-col items-center w-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner ${
                  mode === 'standard' ? 'bg-white text-zinc-950 font-bold' : 'bg-white/[0.06] text-white border border-white/[0.1]'
                }`}>
                  <i className="fas fa-list"></i>
                </div>
                <div className="font-semibold text-white text-base mb-1">
                  {t('Pick Any Club', 'Freie Auswahl')}
                </div>
                <div className="text-xs text-zinc-400 font-normal leading-relaxed max-w-[220px]">
                  {t(
                    'Choose any of the 1,200+ clubs worldwide.',
                    'Waehle einen beliebigen von 1.200+ Vereinen weltweit.'
                  )}
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-white/[0.06] text-[11px] text-zinc-400 font-normal flex items-center justify-center gap-1.5 w-full">
                <i className="fa-solid fa-earth-americas text-[10px] text-zinc-400"></i>
                <span>{isDe ? '1.202 Vereine weltweit' : '1,202 clubs worldwide'}</span>
              </div>
            </div>

            <div
              onClick={() => setMode('realistic')}
              className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center justify-between min-h-[160px] backdrop-blur-2xl ${
                mode === 'realistic'
                  ? 'bg-white/[0.12] border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.18)] ring-1 ring-white/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-white/[0.16]'
              }`}
            >
              {mode === 'realistic' && (
                <span className="absolute top-3.5 right-3.5 text-[10px] font-semibold uppercase tracking-wider bg-white text-zinc-950 px-2 py-0.5 rounded-full shadow-sm">
                  {isDe ? 'Aktiv' : 'Selected'}
                </span>
              )}
              <div className="flex flex-col items-center w-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner ${
                  mode === 'realistic' ? 'bg-white text-zinc-950 font-bold' : 'bg-white/[0.06] text-white border border-white/[0.1]'
                }`}>
                  <i className="fas fa-bolt"></i>
                </div>
                <div className="font-semibold text-white text-base mb-1">
                  {t('Realistic Career', 'Realistische Karriere')}
                </div>
                <div className="text-xs text-zinc-400 font-normal leading-relaxed max-w-[220px]">
                  {t(
                    'Authentic job offers & board pressure.',
                    'Authentische Job-Angebote & Vorstandsdruck.'
                  )}
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-white/[0.06] text-[11px] text-zinc-400 font-normal flex items-center justify-center gap-1.5 w-full">
                <i className="fa-solid fa-briefcase text-[10px] text-zinc-400"></i>
                <span>{isDe ? 'Grassroots-Angebote' : 'Grassroots offers'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 fade-in-delay-2 pb-6 flex flex-col items-center justify-center gap-4">
            <button
              onClick={() => setStep(2)}
              className="bg-white hover:bg-zinc-100 text-zinc-950 text-sm md:text-base font-semibold py-3.5 px-10 rounded-2xl transition active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.15)] cursor-pointer min-w-[200px] flex items-center justify-center gap-2"
            >
              <span>{t('Continue', 'Weiter')}</span>
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
            
            <button 
              onClick={onShowLeaderboard} 
              className="text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto"
            >
              <i className="fas fa-trophy text-xs text-amber-400"></i> {t('View Global Leaderboard', 'Globale Rangliste')}
            </button>
          </div>
        </div>
        </>
      )}

      {/* STEP 2: Director Profile (Apple Minimalist Glassmorphism: 2A Heritage -> 2B Managerial DNA) */}
      {step === 2 && (
        <div className="max-w-5xl mx-auto px-2 sm:px-4 pb-12">
          <AnimatePresence mode="wait">
            {subStep2 === '2A' ? (
              /* ================= SCREEN 2A: HERITAGE & ROOTS ================= */
              <motion.div
                key="screen-2a"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="fade-in"
              >
                {/* Header Title with Apple Frosted Kicker */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-[11px] font-medium tracking-wide mb-3 backdrop-blur-md">
                    <span>{t('Identity & Country', 'Identität & Land')}</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
                    {t('Director Identity', 'Sportdirektor-Identität')}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-lg mx-auto font-normal leading-relaxed">
                    {t('Establish your managerial persona, inaugural era, and starting federation roots.', 'Definiere deinen Namen, deine Start-Ära und dein Heimatland.')}
                  </p>
                </div>

                {/* Mobile-First Bento Dual-Card Layout (Equal heights & balanced spacing) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8 items-stretch">
                  {/* Card 1: Director Credentials (Left 6 Cols) */}
                  <div className="lg:col-span-6 bg-[#161820]/75 rounded-3xl p-6 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between text-left h-full">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />

                    <div className="flex flex-col justify-between h-full space-y-6">
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white/[0.08] text-white border border-white/[0.12] flex items-center justify-center text-xs shadow-inner">
                            <i className="fa-solid fa-user-tie"></i>
                          </div>
                          <div>
                            <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide">
                              {t('Personal Dossier', 'Personal-Dossier')}
                            </h2>
                            <span className="text-[11px] text-zinc-400 font-normal">
                              {t('Name & Inception Era', 'Name & Startjahr')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/[0.1]">
                          1 of 2
                        </span>
                      </div>

                      {/* Name Input Field */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-zinc-400 tracking-wide uppercase">
                            {t('Sporting Director Name', 'Name des Direktors')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
                              setManagerName(name);
                              setNameError(false);
                            }}
                            className="text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-[11px] font-medium flex items-center gap-1.5 transition active:scale-95 cursor-pointer backdrop-blur-md"
                          >
                            <i className="fa-solid fa-dice text-[11px] text-zinc-400"></i>
                            <span>{t('Random', 'Zufall')}</span>
                          </button>
                        </div>

                        <div className={`transition-all duration-200 p-3.5 rounded-2xl border ${
                          nameError
                            ? 'bg-rose-950/20 border-rose-500/80 ring-2 ring-rose-500/20'
                            : 'bg-white/[0.03] border-white/[0.1] hover:border-white/20 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/10 focus-within:bg-white/[0.05]'
                        } shadow-inner relative flex items-center backdrop-blur-md`}>
                          <input
                            ref={nameInputRef}
                            type="text"
                            value={managerName}
                            onChange={(e) => {
                              setManagerName(e.target.value);
                              setNameError(false);
                            }}
                            placeholder={t('E.G. ALEX FERGUSON', 'Z.B. JÜRGEN KLOPP')}
                            className="bg-transparent w-full text-white font-semibold text-base sm:text-lg outline-none uppercase placeholder-zinc-600 pr-7 tracking-wide font-sans"
                          />
                          {managerName && (
                            <button
                              type="button"
                              onClick={() => setManagerName('')}
                              className="absolute right-3 text-zinc-500 hover:text-zinc-300 p-1 transition cursor-pointer"
                            >
                              <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                          )}
                        </div>
                        {nameError && (
                          <span className="text-[11px] font-medium text-rose-400 mt-1.5 inline-block">
                            {t('Please enter a director name to proceed.', 'Bitte gib einen Namen ein, um fortzufahren.')}
                          </span>
                        )}
                      </div>

                      {/* Start Year Dial / Controls */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-zinc-400 tracking-wide uppercase">
                            {t('Inaugural Season Era', 'Start-Saison')}
                          </span>
                          <span className="text-[11px] text-zinc-300 font-medium">
                            {startYear} Kickoff
                          </span>
                        </div>

                        <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/[0.08] flex items-center justify-between gap-3 shadow-inner">
                          <button
                            type="button"
                            onClick={() => setStartYear((prev) => Math.max(1950, prev - 1))}
                            className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center transition border border-white/[0.1] active:scale-95 cursor-pointer shrink-0"
                            title="-1 Year"
                          >
                            <i className="fa-solid fa-minus text-xs"></i>
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-none">
                              {startYear}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-1">
                              {startYear === currentYear ? t('Modern Era', 'Moderne Ära') : t('Historical Era', 'Historische Ära')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStartYear((prev) => Math.min(currentYear, prev + 1))}
                            className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white flex items-center justify-center transition border border-white/[0.1] active:scale-95 cursor-pointer shrink-0"
                            title="+1 Year"
                          >
                            <i className="fa-solid fa-plus text-xs"></i>
                          </button>
                        </div>

                        {/* Era Quick Presets */}
                        <div className="flex items-center gap-1.5 mt-2.5 justify-center flex-wrap">
                          {[currentYear, 2010, 1990, 1974, 1954].map((y) => (
                            <button
                              key={y}
                              type="button"
                              onClick={() => setStartYear(y)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                startYear === y
                                  ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent'
                              }`}
                            >
                              {y}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Federation Roots & Starting Country (Right 6 Cols) */}
                  <div className="lg:col-span-6 bg-[#161820]/75 rounded-3xl p-6 sm:p-7 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between text-left h-full">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/[0.02] blur-3xl pointer-events-none" />

                    <div className="flex flex-col justify-between h-full space-y-4">
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white/[0.08] text-white border border-white/[0.12] flex items-center justify-center text-xs shadow-inner">
                            <i className="fa-solid fa-earth-americas"></i>
                          </div>
                          <div>
                            <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide">
                              {t('Starting Country', 'Start-Land')}
                            </h2>
                            <span className="text-[11px] text-zinc-400 font-normal">
                              {t('Domestic Pyramid & Heritage', 'Ligensystem & Verband')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/[0.1]">
                          {nationality}
                        </span>
                      </div>

                      {/* Selected Country Spotlight Banner */}
                      <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.1] shadow-inner backdrop-blur-xl flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl drop-shadow select-none">{COUNTRIES[nationality]?.flag || '🌍'}</span>
                          <div>
                            <div className="text-sm font-semibold text-white flex items-center gap-2">
                              <span>{COUNTRIES[nationality]?.name || 'Germany'}</span>
                              <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-white/[0.1] text-white border border-white/[0.15]">
                                Active
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 font-normal">
                              {UEFA_COUNTRIES.includes(nationality) ? 'Europe' : (CONMEBOL_COUNTRIES.includes(nationality) || CONCACAF_COUNTRIES.includes(nationality)) ? 'Americas' : 'Asia-Pacific'} • Tier 1-{getMaxTier(nationality, clubsDb)} Leagues
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">
                            {nationality}
                          </span>
                        </div>
                      </div>

                      {/* Quick Search & Filter Bar */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="relative flex-1">
                          <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px]"></i>
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder={t(`Filter ${isModActive ? 34 : 21} countries...`, `${isModActive ? 34 : 21} Länder filtern...`)}
                            className="w-full bg-white/[0.03] text-xs text-white pl-7 pr-2.5 py-1.5 rounded-xl border border-white/[0.08] focus:border-white/30 outline-none placeholder-zinc-500 transition font-normal backdrop-blur-md"
                          />
                          {countrySearch && (
                            <button
                              type="button"
                              onClick={() => setCountrySearch('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Continent Filter Segmented Control */}
                      <div className="flex bg-black/30 p-1 rounded-xl border border-white/[0.08] mb-3 gap-1 shadow-inner backdrop-blur-md">
                        {(['ALL', 'EUROPE', 'AMERICAS', 'APAC'] as const).map((cont) => (
                          <button
                            key={cont}
                            type="button"
                            onClick={() => {
                              setContinentFilter(cont);
                              setCountrySearch('');
                              if (cont === 'EUROPE') setNationality('GER');
                              else if (cont === 'AMERICAS') setNationality('USA');
                              else if (cont === 'APAC') setNationality('JPN');
                              else setNationality('GER');
                              setTierFilter('all');
                              setStartingOffers([]);
                            }}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-semibold tracking-wider transition-all cursor-pointer ${
                              continentFilter === cont
                                ? 'bg-white/[0.15] text-white shadow-sm backdrop-blur-md border border-white/[0.12]'
                                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                          >
                            {cont === 'ALL' ? (isDe ? 'All' : 'All') : cont === 'EUROPE' ? 'Europe' : cont === 'AMERICAS' ? 'Americas' : 'APAC'}
                          </button>
                        ))}
                      </div>

                      {/* Country Chips (Horizontally scrolling on mobile, 3-col grid on sm+) */}
                      <div className="flex sm:grid sm:grid-cols-3 overflow-x-auto hide-scrollbar sm:overflow-y-auto sm:max-h-36 gap-1.5 pb-1 sm:pr-1">
                        {Object.keys(COUNTRIES)
                          .filter((k) => {
                            if (!isModActive && MOD_ONLY_COUNTRIES.includes(k)) return false;
                            if (countrySearch.trim()) {
                              const q = countrySearch.toLowerCase().trim();
                              return COUNTRIES[k].name.toLowerCase().includes(q) || k.toLowerCase().includes(q);
                            }
                            if (continentFilter === 'ALL') return true;
                            const eur = UEFA_COUNTRIES;
                            const amr = [...CONMEBOL_COUNTRIES, ...CONCACAF_COUNTRIES];
                            const asi = AFC_COUNTRIES;
                            if (continentFilter === 'EUROPE') return eur.includes(k);
                            if (continentFilter === 'AMERICAS') return amr.includes(k);
                            if (continentFilter === 'APAC') return asi.includes(k);
                            return true;
                          })
                          .map((key) => {
                            const isActive = COUNTRIES[key].active;
                            const isSelected = nationality === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  if (isActive) {
                                    setNationality(key);
                                    setTierFilter('all');
                                    setStartingOffers([]);
                                  }
                                }}
                                disabled={!isActive}
                                className={`min-w-[125px] sm:min-w-0 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200 flex items-center justify-between shrink-0 backdrop-blur-md ${
                                  isSelected
                                    ? 'bg-white text-zinc-950 font-semibold shadow-md'
                                    : 'bg-white/[0.03] text-zinc-300 border border-white/[0.06] hover:border-white/20 hover:text-white hover:bg-white/[0.06]'
                                } ${!isActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <span>{COUNTRIES[key].flag}</span>
                                  <span className="truncate">{COUNTRIES[key].name}</span>
                                </span>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 shrink-0 ml-1"></span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Mobile Action Bar (Apple Frosted Dock) */}
                <div className="sticky bottom-0 z-40 bg-[#0c0d12]/80 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-3 -mx-2 sm:mx-0 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:shadow-none sm:backdrop-blur-none flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs sm:text-sm font-medium py-3.5 px-6 rounded-2xl border border-white/[0.1] backdrop-blur-md transition active:scale-95 cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-left text-xs"></i>
                    <span>{t('Back', 'Zurück')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!managerName.trim()) {
                        setNameError(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setTimeout(() => nameInputRef.current?.focus(), 100);
                        return;
                      }
                      setSubStep2('2B');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white hover:bg-zinc-100 text-zinc-950 text-xs sm:text-sm font-semibold tracking-wide py-3.5 px-8 sm:px-10 rounded-2xl transition-all duration-200 active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.12)] cursor-pointer flex-1 sm:flex-none sm:min-w-[240px] flex items-center justify-center gap-2.5"
                  >
                    <span>{t('Continue to Managerial DNA', 'Weiter zur Manager-DNA')}</span>
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ================= SCREEN 2B: MANAGERIAL DNA & TACTICS ================= */
              <motion.div
                key="screen-2b"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
                className="fade-in"
              >
                {/* Header Title with Apple Frosted Kicker */}
                <div className="text-center mb-7">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-[11px] font-medium tracking-wide mb-3 backdrop-blur-md">
                    <span>{t('Career Path & Tactical Philosophy', 'Karrierepfad & Philosophie')}</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
                    {t('Director Vision', 'Sportdirektor-Vision')}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl mx-auto font-normal leading-relaxed">
                    {t('Every great football project starts with an identity. Choose the story of your tenure.', 'Jedes erfolgreiche Vereinsprojekt beginnt mit einer klaren Vision. Wähle den Schwerpunkt deiner Ära.')}
                  </p>

                  {/* Director Credentials Breadcrumb Pill (Unified Sans Typography) */}
                  <div className="inline-flex items-center gap-2.5 mt-3 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 shadow-sm backdrop-blur-xl">
                    <span className="text-white font-medium">
                      {managerName.trim() || 'Director'}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400 font-normal">
                      {startYear}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-300 flex items-center gap-1.5 font-normal">
                      <span>{COUNTRIES[nationality]?.flag}</span>
                      <span>{COUNTRIES[nationality]?.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubStep2('2A')}
                      className="ml-1 text-[11px] text-zinc-400 hover:text-white underline font-medium cursor-pointer"
                    >
                      {t('Edit', 'Ändern')}
                    </button>
                  </div>
                </div>

                {/* 4 Story-Driven Career Blueprints */}
                <div className="mb-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        id: 'scout',
                        title: t('The Academy Architect', 'Der NLZ-Architekt'),
                        badge: t('Youth Dynasty', 'Nachwuchs-Dynastie'),
                        icon: 'fa-magnifying-glass',
                        story: t(
                          'Build a sustainable dynasty. You prioritize world-class scouting networks, elite youth facilities, and cultivating homegrown wonderkids.',
                          'Baue eine nachhaltige Dynastie auf. Fokus auf modernste Nachwuchs-Förderung, weltweites Scouting und flüssigen Angriffsfußball.'
                        ),
                        advantage: t('-35% Academy Upgrade Costs · Wonderkid Pipeline', '-35% NLZ-Ausbaukosten · Top-Talentförderung'),
                        defaultTactic: 'Total Football',
                        tacticLabel: t('Fluid Attack (Total Football)', 'Flüssiger Angriff (Total Football)'),
                      },
                      {
                        id: 'legend',
                        title: t('The Dressing Room Icon', 'Die Vereinslegende'),
                        badge: t('Authority & Morale', 'Autorität & Moral'),
                        icon: 'fa-star',
                        story: t(
                          'A revered football figure returning home. Your presence commands instant board patience, unshakeable dressing room respect, and cup spirit.',
                          'Eine verehrte Ikone übernimmt das Ruder. Dein Name garantiert sofortiges Vorstandsvertrauen, hohe Moral und Pokalsieger-Mentalität.'
                        ),
                        advantage: t('Instant Board Respect · +5 Squad Morale', 'Sofortiges Vorstandsvertrauen · +5 Moral'),
                        defaultTactic: 'Gegenpressing',
                        tacticLabel: t('High Press (Gegenpressing)', 'Hohes Pressing (Gegenpressing)'),
                      },
                      {
                        id: 'finance',
                        title: t('The Commercial Powerhouse', 'Der Finanz-Stratege'),
                        badge: t('Transfer War Chest', 'Transfer-Dominanz'),
                        icon: 'fa-chart-line',
                        story: t(
                          'A master of the boardroom and the transfer market. You negotiate lucrative sponsor deals, maximize ticket yields, and build a war chest.',
                          'Wirtschaftliche Überlegenheit. Verhandle Rekord-Sponsorendeals, maximiere Spieltagserlöse und sichere dir ein massives Transferbudget.'
                        ),
                        advantage: t('+25% Transfer Budget · +20% Sponsors', '+25% Transferbudget · +20% Sponsoren'),
                        defaultTactic: 'Direct Counter',
                        tacticLabel: t('Lethal Counter (Direct Counter)', 'Lethale Konter (Direct Counter)'),
                      },
                      {
                        id: 'balanced',
                        title: t('The Balanced Traditionalist', 'Der ausgewogene Klassiker'),
                        badge: t('Neutral Clean Slate', 'Neutraler Start'),
                        icon: 'fa-scale-balanced',
                        story: t(
                          'A complete clean slate for the football purist. An uncompromised foundation with equal focus across youth, commercial growth, and squad management.',
                          'Ein neutraler Neustart für den Puristen. Ausgewogene Ausgangsbedingungen ohne Nachteile oder Vorfestlegungen.'
                        ),
                        advantage: t('Neutral Slate · Balanced Fundamentals', 'Neutraler Start · Ausgewogene Bedingungen'),
                        defaultTactic: 'Tiki-Taka',
                        tacticLabel: t('Control (Tiki-Taka)', 'Positionsspiel & Kontrolle (Tiki-Taka)'),
                      },
                    ].map((vision) => {
                      const isSelected = archetype === vision.id;
                      return (
                        <button
                          key={vision.id}
                          type="button"
                          onClick={() => {
                            setArchetype(vision.id as any);
                            setTactic(vision.defaultTactic);
                          }}
                          className={`p-5 rounded-3xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between group active:scale-[0.98] relative overflow-hidden backdrop-blur-2xl ${
                            isSelected
                              ? 'bg-sky-500/[0.08] border-sky-400/50 ring-1 ring-sky-400/25 shadow-[0_8px_32px_rgba(56,189,248,0.14),inset_0_1px_0_0_rgba(125,211,252,0.2)] scale-[1.01]'
                              : 'opacity-60 hover:opacity-100 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.16]'
                          }`}
                        >
                          <div>
                            {/* Top row: Icon & Radio Checkmark */}
                            <div className="flex items-center justify-between mb-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-inner transition-colors ${
                                isSelected
                                  ? 'bg-sky-500/20 border border-sky-400/30 text-sky-300'
                                  : 'bg-white/[0.06] border border-white/[0.1] text-white'
                              }`}>
                                <i className={`fas ${vision.icon}`}></i>
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                                isSelected
                                  ? 'bg-sky-400 text-zinc-950 font-bold shadow-sm'
                                  : 'border border-white/20 group-hover:border-white/40'
                              }`}>
                                {isSelected && <i className="fa-solid fa-check"></i>}
                              </div>
                            </div>

                            {/* Badge */}
                            <div className={`inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full mb-2 transition-colors ${
                              isSelected
                                ? 'bg-sky-500/15 text-sky-300 border border-sky-400/25'
                                : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06]'
                            }`}>
                              {vision.badge}
                            </div>

                            {/* Title */}
                            <h3 className="font-semibold text-white text-base tracking-tight mb-2">
                              {vision.title}
                            </h3>

                            {/* Narrative Story */}
                            <p className="text-[12px] text-zinc-400 font-normal leading-relaxed mb-4">
                              {vision.story}
                            </p>
                          </div>

                          <div>
                            {/* Key Advantage Pill */}
                            <div className={`text-[11px] font-medium p-2.5 rounded-2xl border transition-colors leading-snug mb-3 ${
                              isSelected
                                ? 'bg-sky-500/10 text-sky-200 border-sky-400/20'
                                : 'bg-white/[0.03] text-zinc-300 border-white/[0.06]'
                            }`}>
                              <i className="fa-solid fa-bolt text-[9px] mr-1.5 opacity-70"></i>
                              <span>{vision.advantage}</span>
                            </div>

                            {/* Natural Tactic Indicator */}
                            <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                              <span className="text-[10px] uppercase font-medium tracking-wider text-zinc-500">
                                {t('Tactical Style', 'Spielstil')}
                              </span>
                              <span className={`font-medium ${isSelected ? 'text-sky-300' : 'text-zinc-400'}`}>
                                {vision.tacticLabel}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tactical Alignment Bar (Apple Glass Capsule with Progressive Disclosure) */}
                <div className="bg-[#161820]/75 border border-white/[0.08] rounded-3xl p-4 sm:p-5 mb-8 backdrop-blur-2xl text-left shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-300 text-sm shadow-inner shrink-0">
                        <i className={`fas ${PHILOSOPHIES[tactic]?.icon || 'fa-chess-board'}`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-medium text-zinc-400 tracking-wider">
                            {t('Tactical Philosophy', 'Taktische Ausrichtung')}
                          </span>
                          <span className="text-[11px] font-semibold text-sky-300 bg-sky-500/15 px-2.5 py-0.5 rounded-full border border-sky-400/25">
                            {tactic}
                          </span>
                        </div>
                        <p className="text-[12px] text-zinc-300 font-normal mt-0.5">
                          {TACTIC_DETAILS[tactic]?.shortEthos || tactic} · <span className="text-sky-300/90">{TACTIC_DETAILS[tactic]?.shortPerk || ''}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCustomTactics(!showCustomTactics)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer self-start sm:self-center flex items-center gap-1.5 backdrop-blur-md"
                    >
                      <i className="fa-solid fa-sliders text-[10px] text-sky-400"></i>
                      <span>{showCustomTactics ? (isDe ? 'Schließen' : 'Close') : (isDe ? 'Spielstil anpassen' : 'Change Philosophy')}</span>
                      <i className={`fa-solid ${showCustomTactics ? 'fa-chevron-up' : 'fa-chevron-down'} text-[9px] text-zinc-400`}></i>
                    </button>
                  </div>

                  {/* Expandable 5 Core Tactics Pills */}
                  {showCustomTactics && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] fade-in">
                      <p className="text-[11px] text-zinc-400 mb-2.5">
                        {t('Select an alternative matchday philosophy for your squad:', 'Wähle einen alternativen Matchday-Spielstil für dein Team:')}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {Object.keys(PHILOSOPHIES).map((tacKey) => {
                          const isTacSelected = tactic === tacKey;
                          const tac = PHILOSOPHIES[tacKey];
                          return (
                            <button
                              key={tacKey}
                              type="button"
                              onClick={() => setTactic(tacKey)}
                              className={`px-3.5 py-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-2.5 backdrop-blur-md active:scale-95 ${
                                isTacSelected
                                  ? 'bg-sky-500/20 border-sky-400/50 text-white shadow-sm ring-1 ring-sky-400/20'
                                  : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <i className={`fas ${tac.icon} text-xs ${isTacSelected ? 'text-sky-300' : 'text-zinc-500'}`}></i>
                              <span className="text-xs font-medium truncate">{tacKey}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky Mobile Action Bar (Apple Frosted Dock) */}
                <div className="sticky bottom-0 z-40 bg-[#0c0d12]/80 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-3 -mx-2 sm:mx-0 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:shadow-none sm:backdrop-blur-none flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubStep2('2A');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs sm:text-sm font-medium py-3.5 px-6 rounded-2xl border border-white/[0.1] backdrop-blur-md transition active:scale-95 cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-left text-xs"></i>
                    <span>{t('Back to Identity & Country', 'Zurück zu Identität & Land')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGoToStep3}
                    className="bg-white hover:bg-zinc-100 text-zinc-950 text-xs sm:text-sm font-semibold tracking-wide py-3.5 px-8 sm:px-10 rounded-2xl transition-all duration-200 active:scale-95 shadow-[0_4px_20px_rgba(255,255,255,0.12)] cursor-pointer flex-1 sm:flex-none sm:min-w-[240px] flex items-center justify-center gap-2.5"
                  >
                    <span>{t('Continue to Club Selection', 'Weiter zur Vereinswahl')}</span>
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* STEP 3: Club Selection / Job Offers (Apple Minimalist Glassmorphism) */}
      {step === 3 && (
        <div className="max-w-5xl mx-auto fade-in text-center px-2 sm:px-4 pb-12">
          {/* Director Context Pill (Unified Apple Typography & Soft Azure Accent) */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium backdrop-blur-xl shadow-sm">
            <span className="text-zinc-400">{isDe ? 'Sportdirektor:' : 'Director:'}</span>
            <span className="text-white font-medium">{managerName.trim() || 'Director'}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{isDe ? 'Start:' : 'Start:'}</span>
            <span className="text-zinc-200 font-medium">{startYear}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{isDe ? 'Philosophie:' : 'Philosophy:'}</span>
            <span className="text-sky-300 font-medium">{tactic}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-2">
            {mode === 'standard'
              ? t('Choose Your Club', 'Verein wählen')
              : t('Grassroots Job Offers', 'Offizielle Job-Angebote')}
          </h1>
          <p className="text-[14px] md:text-[15px] font-normal text-zinc-400 max-w-xl mx-auto mb-6 leading-relaxed">
            {mode === 'standard'
              ? t('Explore clubs by league division, search by name, or browse international powerhouses.', 'Wähle deinen Verein nach Liga, suche nach Namen oder starte bei einem Spitzenklub.')
              : t('Three clubs have submitted official managerial contract offers. Review their project and choose your club.', 'Drei Vereine bieten dir den Posten als Sportdirektor an. Wähle dein Einstiegsprojekt.')}
          </p>

          {/* CR27_Footy Real Name Pack Status & Responsive Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-5xl mx-auto mb-6 px-1">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs backdrop-blur-xl">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isModActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-zinc-500'}`} />
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-white tracking-tight">CR27_Footy Pack</span>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-300 font-medium truncate">
                  {isModActive
                    ? (isDe ? '1.202 reale Vereine & Wappen aktiv' : '1,202 verified clubs & crests active')
                    : (isDe ? 'Lizenzfreie Standard-Namen' : 'Standard copyright-safe names')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              {onToggleMod && (
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-2xl backdrop-blur-xl">
                  <span className="text-[11px] font-semibold text-zinc-300">
                    {isModActive ? (isDe ? 'Echtnamen' : 'Real Names') : (isDe ? 'Standard' : 'Standard')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isModActive}
                    onClick={() => onToggleMod(!isModActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-sm ${
                      isModActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                    title={isModActive ? 'Disable Real Name Pack' : 'Enable Real Name Pack'}
                  >
                    <span className="sr-only">Toggle CR27 Real Name Pack</span>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isModActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowModModal(true)}
                className="px-3.5 py-1.5 rounded-2xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition cursor-pointer backdrop-blur-xl active:scale-95 flex items-center gap-1.5 shadow-sm"
                title="Open Database & Community Mods"
              >
                <i className="fa-solid fa-sliders text-[11px] text-zinc-400"></i>
                <span>{isDe ? 'Optionen' : 'Options'}</span>
              </button>
            </div>
          </div>

          {/* REALISTIC MODE: 3 Job Offers (Apple Glass Dossiers) */}
          {mode === 'realistic' && (
            <div className="w-full max-w-5xl mx-auto space-y-6">
              <div className="flex justify-center mb-2">
                <button
                  type="button"
                  onClick={generateRealisticOffers}
                  className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white font-medium text-xs py-2 px-5 rounded-full border border-white/[0.1] transition backdrop-blur-md active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <i className="fa-solid fa-arrows-rotate text-xs text-sky-400/80"></i>
                  <span>{isDe ? 'Angebote neu mischen' : 'Reshuffle Job Offers'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                {startingOffers.map((c, idx) => {
                  const clubCountry = c.country || 'GER';
                  const countryInfo = COUNTRIES[clubCountry];
                  const leagueInfo = getLeagueInfo(c.tier, clubCountry);
                  const clubContext = isModActive
                    ? (c.historicContext || c.narrative || getClubHistoricContext(c.name, c.tier, isDe, clubCountry))
                    : undefined;

                  return (
                    <div
                      key={`${c.id}-${c.name}`}
                      onClick={() => {
                        setSelectedClubForArchetype(c);
                        setStep(4);
                      }}
                      className="rounded-3xl p-5 sm:p-6 flex flex-col justify-between min-h-[350px] sm:min-h-[390px] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-sky-400/40 hover:shadow-[0_8px_32px_rgba(56,189,248,0.12)] transition-all duration-300 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.06)] relative overflow-hidden group backdrop-blur-2xl"
                    >
                      {/* Top offer badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.1] text-[10px] font-medium tracking-wide">
                          <i className="fa-solid fa-briefcase text-[9px] text-sky-400/80"></i>
                          <span>{isDe ? `Angebot #${idx + 1}` : `Offer #${idx + 1}`}</span>
                        </div>
                        <div className="px-2.5 py-0.5 rounded-lg font-medium text-xs text-zinc-200 bg-white/[0.06] border border-white/[0.08] flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-400">OVR</span>
                          <span className="font-semibold text-white">{c.baseOvr}</span>
                        </div>
                      </div>

                      {/* Crest Section */}
                      <div className="my-2 flex flex-col items-center text-center">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center p-2.5 mb-3 shadow-inner group-hover:scale-105 transition-transform duration-200 backdrop-blur-md">
                          <ClubLogo
                            name={c.name}
                            id={c.id}
                            color={c.color}
                            logo={c.logo}
                            fallbackLogo={c.fallbackLogo}
                            isModActive={isModActive}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md"
                            fallbackClassName="w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl rounded-xl flex items-center justify-center font-bold text-white"
                          />
                        </div>

                        <h3 className="text-lg font-semibold text-white tracking-tight leading-snug">
                          {c.name}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                          <span>{countryInfo?.flag || '🏁'}</span>
                          <span className="font-medium text-zinc-300">{leagueInfo?.name || `Tier ${c.tier}`}</span>
                        </div>

                        {clubContext ? (
                          <p className="text-[11px] font-normal text-zinc-400 line-clamp-2 mt-2 px-1 leading-snug">
                            "{clubContext}"
                          </p>
                        ) : (
                          <p className="text-[11px] text-zinc-500 mt-2">
                            {(c.stadium || 15000).toLocaleString()} {isDe ? 'Zuschauerkapazität' : 'capacity'}
                          </p>
                        )}
                      </div>

                      {/* Key contract specifications */}
                      <div className="w-full space-y-3 mt-4">
                        <div className="grid grid-cols-3 gap-1 bg-white/[0.03] p-2.5 rounded-2xl border border-white/[0.06] text-center text-xs backdrop-blur-sm">
                          <div>
                            <div className="text-[9px] uppercase font-medium text-zinc-500 tracking-wider">
                              {isDe ? 'Budget' : 'Budget'}
                            </div>
                            <div className="font-semibold text-white text-xs mt-0.5">
                              {formatMoney(c.currentBudget != null ? parseAndNormalizeModBudget(c.currentBudget, c.tier, c.country || 'GER') : getStartingBudget(c.tier, c.country || 'GER'), c.country || 'GER')}
                            </div>
                          </div>
                          <div className="border-x border-white/[0.06]">
                            <div className="text-[9px] uppercase font-medium text-zinc-500 tracking-wider">
                              {isDe ? 'Stadion' : 'Stadium'}
                            </div>
                            <div className="font-semibold text-zinc-300 text-xs mt-0.5">
                              {((c.stadium || 15000) / 1000).toFixed(0)}k
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase font-medium text-zinc-500 tracking-wider">
                              {isDe ? 'Reputation' : 'Rep'}
                            </div>
                            <div className="font-semibold text-sky-300 text-xs mt-0.5">
                              {c.rep || c.baseOvr || 65}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <span>{isDe ? 'Angebot annehmen' : 'Accept Contract'}</span>
                          <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STANDARD MODE: Clean Unified Apple Glass Explorer */}
          {mode === 'standard' && (
            <div className="w-full max-w-5xl mx-auto mb-6 text-left space-y-4">
              <div className="bg-[#161820]/75 border border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-2xl space-y-3.5">
                
                {/* Search Bar */}
                <div className="relative flex items-center">
                  <i className="fas fa-search absolute left-4 text-zinc-400 text-sm pointer-events-none"></i>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={isModActive
                      ? (isDe ? 'Verein suchen... (z.B. Bayern, Dortmund, Real Madrid, Arsenal)' : 'Search club by name... (e.g. Bayern, Dortmund, Real Madrid, Arsenal)')
                      : (isDe ? 'Verein suchen... (z.B. Bavaria, Prussia, Manchester Blue)' : 'Search club by name... (e.g. Bavaria, Prussia, Manchester Blue)')}
                    enterKeyHint="search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.06] text-white font-medium text-xs sm:text-sm pl-11 pr-24 py-3 rounded-2xl border border-white/[0.08] focus:border-sky-400/40 focus:ring-1 focus:ring-sky-400/30 outline-none transition placeholder-zinc-500"
                  />
                  <div className="absolute right-3 flex items-center gap-2">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          if (searchInputRef.current) searchInputRef.current.focus();
                        }}
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                      >
                        <i className="fas fa-xmark"></i>
                      </button>
                    )}
                    <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.06]">
                      {displayedClubs.length} {isDe ? 'Vereine' : 'clubs'}
                    </span>
                  </div>
                </div>

                {/* Country / League Quick Switch Strip */}
                <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs px-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                      {isDe ? 'Land / Wettbewerb' : 'Country / Region'}
                    </span>
                    {nationality !== 'ALL' && COUNTRIES[nationality] && (
                      <span className="text-zinc-300 text-xs flex items-center gap-1 font-medium">
                        <span>{COUNTRIES[nationality].flag}</span>
                        <span>{COUNTRIES[nationality].name}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5 custom-scrollbar -mx-1 px-1">
                    {/* Top Football Nations */}
                    {(['GER', 'ENG', 'ESP', 'ITA', 'FRA', 'POR', 'USA'] as const).map(code => {
                      const country = COUNTRIES[code];
                      if (!country) return null;
                      const isSelected = nationality === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setNationality(code);
                            setTierFilter(1);
                            setShowAllClubs(false);
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer backdrop-blur-md ${
                            isSelected
                              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 shadow-sm'
                              : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.06] hover:bg-white/[0.06]'
                          }`}
                        >
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </button>
                      );
                    })}

                    {/* All Countries (World) */}
                    <button
                      type="button"
                      onClick={() => {
                        setNationality('ALL');
                        setTierFilter('all');
                        setShowAllClubs(false);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer backdrop-blur-md ${
                        nationality === 'ALL'
                          ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 shadow-sm'
                          : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.06] hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>🌍</span>
                      <span>{isDe ? 'Alle Länder' : 'All Countries'}</span>
                    </button>

                    {/* More Nations Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={['ALL', 'GER', 'ENG', 'ESP', 'ITA', 'FRA', 'POR', 'USA'].includes(nationality) ? '' : nationality}
                        onChange={(e) => {
                          if (e.target.value) {
                            setNationality(e.target.value);
                            setTierFilter(1);
                            setShowAllClubs(false);
                          }
                        }}
                        className="bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.06] hover:bg-white/[0.06] rounded-xl px-3 py-1.5 text-xs font-medium outline-none cursor-pointer pr-7 transition backdrop-blur-md"
                      >
                        <option value="" disabled>
                          {isDe ? '🌐 Weitere Länder...' : '🌐 More Nations...'}
                        </option>
                        {Object.keys(COUNTRIES)
                          .filter(k => !['ALL', 'GER', 'ENG', 'ESP', 'ITA', 'FRA', 'POR', 'USA'].includes(k))
                          .filter(k => isModActive || !MOD_ONLY_COUNTRIES.includes(k))
                          .map(k => (
                            <option key={k} value={k} className="bg-[#161820] text-white">
                              {COUNTRIES[k]?.flag} {COUNTRIES[k]?.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Division / Tier Tabs (Allows hiding lower leagues by defaulting to Tier 1) */}
                {nationality !== 'ALL' && availableLeaguesForCountry.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] px-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                        {isDe ? 'Spielklasse wählen' : 'Select Division'}
                      </span>
                      <span className="text-zinc-400 text-xs">
                        {COUNTRIES[nationality]?.flag} {COUNTRIES[nationality]?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 custom-scrollbar -mx-1 px-1">
                      {availableLeaguesForCountry.map(({ tier, name }) => {
                        const isSelected = tierFilter === tier;
                        const tierClubsCount = clubsDb.filter(c => (c.country || 'GER') === nationality && c.tier === tier).length;
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => {
                              setTierFilter(isSelected ? 'all' : tier);
                              setShowAllClubs(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer backdrop-blur-md ${
                              isSelected
                                ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 shadow-sm'
                                : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.06] hover:bg-white/[0.06]'
                            }`}
                          >
                            <span className="opacity-70 text-[10px] font-medium">T{tier}</span>
                            <span>{name}</span>
                            {tierClubsCount > 0 && (
                              <span className="text-[10px] opacity-70 ml-0.5">({tierClubsCount})</span>
                            )}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          setTierFilter('all');
                          setShowAllClubs(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer backdrop-blur-md ${
                          tierFilter === 'all'
                            ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 shadow-sm'
                            : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.06] hover:bg-white/[0.06]'
                        }`}
                      >
                        {isDe ? 'Alle Ligen' : 'All Divisions'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Sort Bar */}
                <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mr-1.5">
                      {isDe ? 'Sortierung:' : 'Sort By:'}
                    </span>
                    {(
                      [
                        { id: 'tier', label: isDe ? 'Liga & Stärke' : 'Tier & Rating', icon: 'fa-layer-group' },
                        { id: 'ovr', label: isDe ? 'Stärke (OVR)' : 'Overall OVR', icon: 'fa-bolt' },
                        { id: 'budget', label: isDe ? 'Budget' : 'Budget', icon: 'fa-coins' },
                        { id: 'name', label: isDe ? 'Name' : 'A-Z', icon: 'fa-arrow-down-a-z' },
                      ] as const
                    ).map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSortBy(s.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                          sortBy === s.id
                            ? 'bg-white/15 text-white shadow-sm border border-white/10'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        <i className={`fa-solid ${s.icon} text-[10px]`}></i>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer transition text-xs"
                    >
                      <i className="fas fa-xmark text-xs"></i>
                      <span>{isDe ? 'Suche zurücksetzen' : 'Clear search'}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Standard Mode Clubs Grid with Progressive Disclosure (Hides overwhelming choice) */}
          {mode === 'standard' && (
            displayedClubs.length === 0 ? (
              <div className="bg-[#161820]/75 border border-white/[0.08] rounded-3xl p-8 max-w-md mx-auto text-center my-6 shadow-xl backdrop-blur-2xl">
                <i className="fas fa-magnifying-glass text-3xl text-zinc-500 mb-3 block"></i>
                <p className="text-white font-medium text-base mb-1">
                  {isDe ? 'Keine Vereine gefunden' : 'No Results Found'}
                </p>
                <p className="text-zinc-400 text-xs mb-4">
                  {isDe
                    ? `Kein Verein entspricht "${searchQuery}". Versuche es mit einem anderen Begriff oder setze Filter zurück.`
                    : `No clubs matched "${searchQuery}". Try a different keyword or reset filters.`}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-xs py-2.5 px-6 rounded-full transition shadow-sm active:scale-95 cursor-pointer"
                >
                  {isDe ? 'Suche zurücksetzen' : 'Reset Search'}
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                  {(searchQuery.trim() !== '' || showAllClubs ? displayedClubs : displayedClubs.slice(0, 9)).map((c) => {
                    const clubCountry = c.country || (nationality === 'ALL' ? 'GER' : nationality);
                    const countryInfo = COUNTRIES[clubCountry];
                    const leagueInfo = getLeagueInfo(c.tier, clubCountry);
                    
                    const clubContext = isModActive
                      ? (c.historicContext || c.narrative || getClubHistoricContext(c.name, c.tier, isDe, clubCountry))
                      : undefined;

                    return (
                      <div
                        key={`${c.id}-${c.name}`}
                        onClick={() => {
                          if (!managerName.trim()) {
                            setNameError(true);
                            setSubStep2('2A');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            setTimeout(() => nameInputRef.current?.focus(), 100);
                            return;
                          }
                          if (document.activeElement instanceof HTMLElement) { document.activeElement.blur(); }
                          setSelectedClubForArchetype(c);
                          setStep(4);
                        }}
                        className="rounded-3xl p-4 sm:p-5 flex flex-col justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-sky-400/40 hover:shadow-[0_8px_32px_rgba(56,189,248,0.12)] transition-all duration-300 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.06)] relative overflow-hidden group backdrop-blur-2xl active:scale-[0.99]"
                      >
                        {/* Mobile Row Layout (< sm) */}
                        <div className="sm:hidden flex items-center gap-3.5 w-full mb-3">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center p-2 shrink-0 shadow-inner">
                            <ClubLogo
                              name={c.name}
                              id={c.id}
                              color={c.color}
                              logo={c.logo}
                              fallbackLogo={c.fallbackLogo}
                              isModActive={isModActive}
                              className="w-10 h-10 object-contain drop-shadow-md"
                              fallbackClassName="w-10 h-10 text-base rounded-xl shadow-sm flex items-center justify-center font-bold text-white"
                            />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-medium text-zinc-300 truncate bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                                {isCanadianMLSClub(c.name, c.id, c.country) ? '🇨🇦' : (countryInfo?.flag || '🏁')} {leagueInfo?.name || `Tier ${c.tier}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-md font-medium text-[10px] shrink-0 bg-white/[0.06] text-zinc-200 border border-white/[0.08]">
                                OVR {c.baseOvr}
                              </span>
                            </div>
                            <h3 className="text-base font-semibold text-white break-words leading-tight">
                              {c.name}
                            </h3>
                            {clubContext ? (
                              <p className="text-[10px] font-normal text-zinc-400 truncate mt-0.5">
                                "{clubContext}"
                              </p>
                            ) : (
                              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                {(c.stadium || 20000).toLocaleString()} {isDe ? 'Plätze' : 'seats'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Desktop Top Row (>= sm) */}
                        <div className="hidden sm:flex w-full items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-zinc-300 truncate max-w-[65%] shadow-sm">
                            <span>{isCanadianMLSClub(c.name, c.id, c.country) ? '🇨🇦' : (countryInfo?.flag || '🏁')}</span>
                            <span className="truncate">{leagueInfo?.name || `Tier ${c.tier}`}</span>
                          </div>
                          <div className="px-2.5 py-0.5 rounded-lg font-medium text-xs shrink-0 flex items-center gap-1 bg-white/[0.06] text-zinc-200 border border-white/[0.08] shadow-sm">
                            <span className="text-[10px] text-zinc-400">OVR</span>
                            <span className="font-semibold">{c.baseOvr}</span>
                          </div>
                        </div>

                        {/* Desktop Crest Section (>= sm) */}
                        <div className="hidden sm:flex my-2 items-center justify-center relative">
                          <div className="w-18 h-18 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center p-2.5 shadow-inner group-hover:scale-105 transition-transform duration-200 backdrop-blur-sm">
                            <ClubLogo
                              name={c.name}
                              id={c.id}
                              color={c.color}
                              logo={c.logo}
                              fallbackLogo={c.fallbackLogo}
                              isModActive={isModActive}
                              className="w-14 h-14 object-contain drop-shadow-md p-0.5"
                              fallbackClassName="w-14 h-14 text-xl rounded-xl shadow-md flex items-center justify-center font-bold text-white"
                            />
                          </div>
                        </div>

                        {/* Desktop Club Name & Context (>= sm) */}
                        <div className="hidden sm:flex text-center w-full mb-3 flex-col items-center">
                          <h3 className="text-base font-semibold text-white tracking-tight truncate w-full px-1 py-0.5 leading-normal">
                            {c.name}
                          </h3>

                          {clubContext ? (
                            <p className="text-[11px] font-normal text-zinc-400 text-center line-clamp-2 min-h-[32px] px-2 mt-1 leading-snug">
                              "{clubContext}"
                            </p>
                          ) : (
                            <p className="text-[11px] font-normal text-zinc-400 text-center line-clamp-1 min-h-[20px] px-2 mt-1">
                              {countryInfo?.name || clubCountry} · {(c.stadium || 20000).toLocaleString()} {isDe ? 'Kapazität' : 'Capacity'}
                            </p>
                          )}

                          {isReserveClub(c.name) && (
                            <span className="mt-1 text-[9px] font-medium uppercase tracking-wider bg-white/[0.06] text-zinc-300 border border-white/[0.1] px-2 py-0.5 rounded-full">
                              {isDe ? 'Reserve-Team' : 'Reserve Team'}
                            </span>
                          )}
                        </div>

                        {/* Key Metrics Strip */}
                        <div className="w-full grid grid-cols-3 gap-1 bg-white/[0.03] p-2 rounded-2xl border border-white/[0.06] text-center text-xs mb-3 backdrop-blur-sm">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-medium text-zinc-500 tracking-wider">
                              {isDe ? 'Budget' : 'Budget'}
                            </span>
                            <span className="font-semibold text-white text-[11px]">
                              {formatMoney(c.currentBudget != null ? parseAndNormalizeModBudget(c.currentBudget, c.tier, c.country || 'GER') : getStartingBudget(c.tier, c.country || 'GER'), c.country || 'GER')}
                            </span>
                          </div>
                          <div className="flex flex-col border-x border-white/[0.06]">
                            <span className="text-[9px] uppercase font-medium text-zinc-500 tracking-wider">
                              {isDe ? 'Stadion' : 'Stadium'}
                            </span>
                            <span className="font-semibold text-zinc-300 text-[11px]">
                              {((c.stadium || 20000) / 1000).toFixed(0)}k
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-medium text-zinc-500 tracking-wider">
                              {isDe ? 'Rep' : 'Rep'}
                            </span>
                            <span className="font-semibold text-sky-300 text-[11px]">
                              {c.rep || c.baseOvr || 70}
                            </span>
                          </div>
                        </div>

                        {/* Select Action Button */}
                        <button
                          type="button"
                          className="w-full py-2.5 rounded-xl bg-white/[0.06] group-hover:bg-white text-zinc-300 group-hover:text-zinc-950 font-medium text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>{t('Select Club', 'Verein wählen')}</span>
                          <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Progressive Disclosure (Show All / Show Less) */}
                {searchQuery.trim() === '' && displayedClubs.length > 9 && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllClubs(!showAllClubs)}
                      className="px-6 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] backdrop-blur-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      <span>
                        {showAllClubs
                          ? (isDe ? 'Weniger Vereine anzeigen' : 'Show fewer clubs')
                          : (isDe ? `Alle ${displayedClubs.length} Vereine anzeigen` : `Show all ${displayedClubs.length} clubs`)}
                      </span>
                      <i className={`fa-solid ${showAllClubs ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px] text-zinc-400`}></i>
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Navigation to Step 2 */}
          <div className="text-center mt-8 fade-in-delay-2">
            <button
              onClick={() => {
                setStep(2);
                setSubStep2('2B');
              }}
              className="bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-medium text-xs sm:text-sm py-3 px-7 rounded-2xl border border-white/[0.08] backdrop-blur-xl transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2 shadow-sm"
            >
              <i className="fas fa-arrow-left text-xs"></i>
              <span>{t('Back to Managerial DNA', 'Zurück zur Management-DNA')}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Hire Head Coach */}
      {step === 4 && selectedClubForArchetype && (
        <div className="max-w-2xl mx-auto text-center fade-in px-4 pb-10">
          <div className="inline-flex items-center gap-2 mb-3 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium backdrop-blur-xl shadow-sm">
            <span className="text-zinc-400">{isDe ? 'Verein:' : 'Club:'}</span>
            <span className="text-white font-medium">{selectedClubForArchetype.name}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{isDe ? 'Philosophie:' : 'Philosophy:'}</span>
            <span className="text-sky-300 font-medium">{tactic}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-2">
            {t('Hire Head Coach', 'Cheftrainer einstellen')}
          </h1>
          <p className="text-[14px] md:text-[15px] font-normal text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            {t(
              `As the new Sporting Director of ${selectedClubForArchetype.name}, appoint your Head Coach. Choose someone who aligns with your ${tactic} philosophy.`,
              `Als neuer Sportdirektor von ${selectedClubForArchetype.name} musst du einen Cheftrainer einstellen. Wähle jemanden, der zu deiner ${tactic}-Philosophie passt.`
            )}
          </p>
          
          <div className="grid gap-3.5 text-left">
            {coachMarket.map((coach) => {
              const hasSynergy = isTacticalSynergy(coach.style, tactic);
              const isSelected = selectedCoach?.id === coach.id;
              const archConfig = getCoachArchetypeConfig(coach.coachArchetype || coach.archetype);
              
              return (
                <div 
                  key={coach.id}
                  onClick={() => setSelectedCoach(coach)}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 backdrop-blur-2xl ${
                    isSelected
                      ? 'bg-sky-500/[0.08] border-sky-400/40 ring-1 ring-sky-400/25 shadow-[0_8px_30px_rgba(56,189,248,0.14),inset_0_1px_0_0_rgba(125,211,252,0.2)] scale-[1.01]'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.16]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base sm:text-lg text-white mb-1.5 flex items-center gap-2 flex-wrap">
                      <span>{coach.name}</span>
                      
                      {/* Coach Archetype Pill */}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${archConfig.badgeClass}`}>
                        <i className={`fa-solid ${archConfig.icon} text-[9px]`}></i>
                        <span>{isDe ? archConfig.labelDe : archConfig.labelEn}</span>
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                          : 'bg-white/[0.08] border border-white/[0.1] text-zinc-300'
                      }`}>{coach.strength}</span>
                    </div>

                    <div className="text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-300 font-medium flex items-center gap-1">
                        <i className={`fas ${TACTICS[coach.style]?.icon || 'fa-chess-board'} text-zinc-400 text-xs`}></i> {coach.style}
                      </span>
                      {hasSynergy && (
                         <span className="text-[10px] bg-sky-500/15 text-sky-200 px-2.5 py-0.5 rounded-full font-medium tracking-wide border border-sky-400/30 flex items-center gap-1">
                           <i className="fa-solid fa-circle-check text-[9px] text-sky-400"></i>
                           <span>Synergy</span>
                         </span>
                      )}
                      {coach.trophyPedigree ? (
                        <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                          <i className="fa-solid fa-trophy text-[9px]"></i>
                          <span>{coach.trophyPedigree} {isDe ? 'Titel' : 'Trophies'}</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-zinc-400 mt-2 font-normal italic line-clamp-1">
                      "{getCoachQuote(coach.ovrBoost, isDe, coach.id)}"
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] gap-2">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-semibold text-white mb-0.5">{formatMoney(coach.cost)} / {isDe ? 'Jahr' : 'yr'}</div>
                      <div className="text-xs text-zinc-400">{coach.contractYearsLeft} {isDe ? 'Jahre Vertrag' : 'Year Deal'}</div>
                    </div>

                    {/* View Dossier Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDossierCoach(coach);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-sky-300 hover:text-white border border-white/[0.1] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <i className="fa-solid fa-fingerprint text-[11px] text-sky-400"></i>
                      <span>{isDe ? 'Dossier ansehen' : 'View Dossier'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              type="button" 
              onClick={() => setStep(3)} 
              className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white font-medium text-xs sm:text-sm py-3.5 px-7 rounded-2xl border border-white/[0.1] backdrop-blur-md transition active:scale-95 cursor-pointer shadow-sm flex items-center gap-2"
            >
              <i className="fa-solid fa-arrow-left text-xs"></i>
              <span>{t('Back', 'Zurück')}</span>
            </button>
            <button 
              onClick={() => {
                onStartGame({
                  club: selectedClubForArchetype,
                  managerName: managerName.trim().toUpperCase(),
                  startYear,
                  tactic,
                  nationality: selectedClubForArchetype.country || nationality || 'GER',
                  mode: mode,
                  archetype,
                  coach: selectedCoach || undefined,
                });
              }}
              className={`flex-1 font-semibold text-xs sm:text-sm py-3.5 px-8 rounded-2xl transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.15)] ${
                selectedCoach ? 'bg-white text-zinc-950 hover:bg-zinc-100 active:scale-95' : 'bg-white/[0.06] text-zinc-600 border border-white/[0.05] cursor-not-allowed shadow-none'
              }`}
              disabled={!selectedCoach}
            >
              {t('Start Career', 'Karriere Starten')}
            </button>
          </div>
        </div>
      )}

      {/* Coach Dossier Modal in Onboarding */}
      <AnimatePresence>
        {dossierCoach && (
          <CoachDossierModal
            coach={dossierCoach}
            lang={lang}
            clubTactic={tactic}
            onSelectInOnboarding={(c) => {
              setSelectedCoach(c);
              setDossierCoach(null);
            }}
            onClose={() => setDossierCoach(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
