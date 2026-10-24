import { Club, BoardRoadmap, BoardRoadmapGoal } from '../types';
import { getLeagueScaledVal, isReserveClub, getPinnacleArenaCapacity, getClubCatchmentCeiling, getCalibratedStartingFanbase, getCountryEconomicProfile } from '../data/gameConstants';

/**
 * Checks whether a club is an elite continental heavyweight/giant.
 */
export function isEuropeanPowerhouseClub(club: Club): boolean {
  if (club.isReserve || isReserveClub(club.name)) return false;
  const tier = club.tier || 1;
  const ovr = club.baseOvr || 70;
  const rep = club.rep || 70;
  const name = (club.name || '').toLowerCase();

  const powerhouseKeywords = [
    'barcelona', 'barça', 'magdeburg', 'kiel', 'veszprém', 'veszprem',
    'paris', 'psg', 'aalborg', 'kielce', 'flensburg', 'füchse', 'fuechse',
    'szeged', 'montpellier', 'sporting', 'porto', 'nantes', 'gog', 'zagreb',
    'kolstad', 'dinamo bucure'
  ];

  return tier === 1 && (ovr >= 82 || rep >= 85 || powerhouseKeywords.some(k => name.includes(k)));
}

/**
 * Verifies if an existing roadmap is authentic and valid for the current club.
 */
export function isRoadmapValidForClub(
  roadmap: BoardRoadmap | undefined | null,
  club: Club
): boolean {
  if (!roadmap || !roadmap.goals || roadmap.goals.length === 0) return false;
  if (roadmap.clubId !== undefined && String(roadmap.clubId) !== String(club.id)) return false;
  if (roadmap.clubName && roadmap.clubName !== club.name) return false;
  
  const isGiant = isEuropeanPowerhouseClub(club);
  if (isGiant && roadmap.titleEn.includes('Grassroots')) return false;
  if (isGiant && roadmap.titleEn.includes('Consolidation')) return false;
  if (isGiant && roadmap.goals.some(g => g.targetType === 'promotion_tier')) return false;
  if (isGiant && roadmap.goals.some(g => g.targetType === 'fanbase_growth')) return false;

  // A roadmap initially created in Tier 1 should never contain promotion goals
  if (roadmap.tierAtStart === 1 && roadmap.goals.some(g => g.targetType === 'promotion_tier')) {
    return false;
  }

  // Reject stale grassroots fanbase goals where club already vastly exceeds target or target exceeds catchment ceiling
  const catchment = getClubCatchmentCeiling(club);
  if (club.fanBase && roadmap.goals.some(g => g.targetType === 'fanbase_growth' && (club.fanBase! >= g.targetValue * 1.25 || g.targetValue > catchment.maxCeiling))) {
    return false;
  }

  const isReserve = Boolean(club.isReserve || isReserveClub(club.name));
  const maxAllowedArena = isReserve ? 1500 : getPinnacleArenaCapacity(club.country || 'GER');
  if (roadmap.goals.some(g => g.targetType === 'arena_expansion' && g.targetValue > maxAllowedArena)) {
    return false;
  }
  if (isReserve) {
    // 1. A reserve team can NEVER climb to Tier 1 under statutory league regulations
    if (roadmap.goals.some(g => g.targetType === 'promotion_tier' && g.targetValue <= 1)) {
      return false;
    }
    // 2. A reserve team at Tier 2 can NEVER have any promotion_tier goal
    if ((club.tier || 1) === 2 && roadmap.goals.some(g => g.targetType === 'promotion_tier')) {
      return false;
    }
    // 3. Reserve teams must ALWAYS have a focus on developing youth players
    if (!roadmap.goals.some(g => g.targetType === 'academy_growth')) {
      return false;
    }
    // 4. Reject senior-club-only titles or objectives
    if (
      roadmap.goals.some(g => g.targetType === 'championship_dominance' || g.targetType === 'top_four' || g.targetType === 'european_glory' || g.targetType === 'fanbase_growth')
    ) {
      return false;
    }
    if (roadmap.titleEn.includes('Promotion to Elite') || roadmap.titleEn.includes('Grassroots to Glory') || roadmap.titleEn.includes('Dynasty') || roadmap.titleEn.includes('Hegemony')) {
      return false;
    }
  }

  return true;
}

/**
 * Synchronizes roadmap goals against the current club state and history.
 * Automatically validates goals achieved during the roadmap period or through recent achievements.
 */
export function syncRoadmapWithCurrentState(
  roadmap: BoardRoadmap,
  club: Club,
  currentYear: number,
  history: any[] = []
): BoardRoadmap {
  if (!roadmap || !roadmap.goals || roadmap.goals.length === 0) return roadmap;

  const clubHistory = history.filter(h => !h.clubName || h.clubName === club.name);
  const roadmapHistory = clubHistory.filter(
    h => h.year >= roadmap.startYear && h.year <= Math.max(roadmap.endYear, currentYear)
  );

  const updatedGoals = roadmap.goals.map(goal => {
    let currentValue = goal.currentValue;
    let completed = goal.completed;

    switch (goal.targetType) {
      case 'european_glory': {
        // If club has won an EHF Champions League (cl), European League (el), European Cup (ecl), or Super Globe (cwc)
        const hasEuroTrophy = roadmapHistory.some(
          h => Boolean(h.trophiesThisYear?.cl || h.trophiesThisYear?.ecl || h.trophiesThisYear?.el || h.trophiesThisYear?.cwc)
        ) || clubHistory.some(
          h => h.year >= roadmap.startYear && Boolean(h.trophiesThisYear?.cl || h.trophiesThisYear?.ecl || h.trophiesThisYear?.el || h.trophiesThisYear?.cwc)
        );
        if (hasEuroTrophy) {
          currentValue = 1;
          completed = true;
        }
        break;
      }

      case 'championship_dominance': {
        const titleCount = roadmapHistory.filter(h => (h.pos === 1 && (h.tier || 1) === 1) || Boolean(h.trophiesThisYear?.bl)).length;
        currentValue = Math.max(currentValue, titleCount);
        if (currentValue >= goal.targetValue) {
          completed = true;
        }
        break;
      }

      case 'top_four': {
        const achievedTop4 = roadmapHistory.some(h => h.pos <= 4 && (h.tier || 1) === 1);
        if (achievedTop4) {
          currentValue = 4;
          completed = true;
        }
        break;
      }

      case 'promotion_tier': {
        const lastHist = roadmapHistory.length > 0 ? roadmapHistory[roadmapHistory.length - 1] : null;
        const currentTier = lastHist?.nextTier ?? club.tier ?? 1;
        currentValue = currentTier;
        if (currentTier <= goal.targetValue) {
          completed = true;
        }
        break;
      }

      case 'solidify_tier': {
        const targetTier = roadmap.tierAtStart || 1;
        const seasonsSurvived = roadmapHistory.filter(h => (h.tier === targetTier || h.tier <= targetTier) && !h.relegated).length;
        currentValue = Math.max(currentValue, seasonsSurvived);
        if (currentValue >= goal.targetValue) {
          completed = true;
        }
        break;
      }

      case 'arena_expansion': {
        currentValue = club.stadium || 0;
        if (currentValue >= goal.targetValue) {
          completed = true;
        }
        break;
      }

      case 'fanbase_growth': {
        currentValue = club.fanBase || 0;
        if (currentValue >= goal.targetValue) {
          completed = true;
        }
        break;
      }

      case 'academy_growth': {
        currentValue = club.academyLevel || 1;
        if (currentValue >= goal.targetValue) {
          completed = true;
        }
        break;
      }

      case 'medical_growth': {
        currentValue = club.medicalLevel || 1;
        if (currentValue >= goal.targetValue) {
          completed = true;
        }
        break;
      }

      case 'financial_surplus': {
        const clubBudget = club.currentBudget !== undefined ? club.currentBudget : ((club as any).budget ?? 0);
        currentValue = clubBudget;
        if (roadmapHistory.length > 0 && currentValue >= goal.targetValue) {
          completed = true;
        }
        break;
      }

      default:
        break;
    }

    return {
      ...goal,
      currentValue,
      completed,
    };
  });

  return {
    ...roadmap,
    goals: updatedGoals,
  };
}

/**
 * Retrieves valid active roadmap or generates a contextual one matching the club.
 */
export function getOrGenerateRoadmap(
  roadmap: BoardRoadmap | undefined | null,
  club: Club,
  currentYear: number,
  history: any[] = []
): BoardRoadmap {
  let active: BoardRoadmap;
  if (roadmap && isRoadmapValidForClub(roadmap, club)) {
    active = roadmap;
  } else {
    active = generateBoardRoadmap(club, currentYear, history);
  }
  return syncRoadmapWithCurrentState(active, club, currentYear, history);
}

/**
 * Generates a dynamic 2, 3, or 5-year strategic board roadmap tailored to the club's tier,
 * status, budget, historical success, and previous completed cycles.
 */
export function generateBoardRoadmap(
  club: Club,
  currentYear: number,
  history: any[] = []
): BoardRoadmap {
  const tier = club.tier || 1;
  const ovr = club.baseOvr || 70;
  const country = club.country || 'GER';
  const clubHistory = history.filter(h => !h.clubName || h.clubName === club.name);
  const seasonsAtClub = clubHistory.length;
  const recentTitles = clubHistory.slice(-3).filter(h => h.pos === 1 && h.tier === 1).length;
  const isGiant = isEuropeanPowerhouseClub(club) || (tier === 1 && ovr >= 80 && recentTitles >= 1);
  const isReserve = Boolean(club.isReserve || isReserveClub(club.name));
  const isSubsequentCycle = seasonsAtClub >= 2;
  const maxArenaCap = isReserve ? 1500 : getPinnacleArenaCapacity(country);

  // 1. TIER 1 GIANTS & CONTINENTAL POWERHOUSES (e.g. FC Barcelona, SC Magdeburg, THW Kiel, Veszprém)
  if (isGiant) {
    const horizonYears: 2 | 3 | 5 = 3;
    const currentStadium = club.stadium || Math.min(7500, maxArenaCap);
    const currentAcademy = club.academyLevel || 1;
    const currentMedical = club.medicalLevel || 1;
    const isBarca = (club.name || '').toLowerCase().includes('barc');

    let infraGoal: BoardRoadmapGoal;
    if (currentStadium < Math.min(10000, maxArenaCap)) {
      // Palau Blaugrana (7,585 seats) or similar arenas under high excess demand
      const targetCapacity = Math.min(maxArenaCap, 12500, Math.max(currentStadium + 1500, Math.min(maxArenaCap, 9500)));
      infraGoal = {
        id: `arena_expand_${currentYear}`,
        titleEn: isBarca ? 'Palau Blaugrana Modernization' : 'Coliseum Arena Expansion',
        titleDe: isBarca ? 'Palau Blaugrana Modernisierung' : 'Großhallen-Erweiterung',
        descriptionEn: `With massive matchday sellout demand, expand arena capacity to at least ${targetCapacity.toLocaleString()} seats.`,
        descriptionDe: `Erweitere aufgrund enormer Kartennachfrage die Hallenkapazität auf mindestens ${targetCapacity.toLocaleString()} Plätze.`,
        targetType: 'arena_expansion',
        targetValue: targetCapacity,
        currentValue: currentStadium,
        completed: currentStadium >= targetCapacity,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(1, 1200000, country),
      };
    } else if (currentAcademy < 5) {
      infraGoal = {
        id: `academy_expand_${currentYear}`,
        titleEn: isBarca ? 'La Masia High-Performance Modernization' : 'World-Class Youth Academy',
        titleDe: isBarca ? 'La Masia Exzellenz-Zentrum' : 'Weltklasse-Nachwuchsakademie',
        descriptionEn: 'Upgrade Youth Academy to Level 5 to maintain a world-leading talent pipeline.',
        descriptionDe: 'Baue die Nachwuchsakademie auf Maximalstufe 5 aus.',
        targetType: 'academy_growth',
        targetValue: 5,
        currentValue: currentAcademy,
        completed: currentAcademy >= 5,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(1, 1000000, country),
      };
    } else if (currentMedical < 5) {
      infraGoal = {
        id: `medical_expand_${currentYear}`,
        titleEn: 'Sports Science & Cryo-Recovery Center',
        titleDe: 'Hochleistungs-Medizinzentrum',
        descriptionEn: 'Upgrade Medical Department to Level 5 to maximize veteran squad recovery and cushion age decay.',
        descriptionDe: 'Baue die medizinische Abteilung auf Maximalstufe 5 aus.',
        targetType: 'medical_growth',
        targetValue: 5,
        currentValue: currentMedical,
        completed: currentMedical >= 5,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(1, 1000000, country),
      };
    } else if (currentStadium < maxArenaCap) {
      const megaCapacity = Math.min(maxArenaCap, currentStadium + 2000, 15000);
      infraGoal = {
        id: `arena_expand_${currentYear}`,
        titleEn: 'Super-Coliseum Expansion',
        titleDe: 'Super-Arena-Ausbau',
        descriptionEn: `Expand arena capacity to at least ${megaCapacity.toLocaleString()} seats to establish Europe\'s ultimate handball cathedral.`,
        descriptionDe: `Erweitere die Hallenkapazität auf mindestens ${megaCapacity.toLocaleString()} Plätze.`,
        targetType: 'arena_expansion',
        targetValue: megaCapacity,
        currentValue: currentStadium,
        completed: currentStadium >= megaCapacity,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(1, 1500000, country),
      };
    } else {
      infraGoal = {
        id: `academy_expand_${currentYear}`,
        titleEn: 'World-Class Youth Academy Standards',
        titleDe: 'Weltklasse-Nachwuchsakademie',
        descriptionEn: 'Maintain Level 5 Youth Academy excellence across the roadmap cycle.',
        descriptionDe: 'Halte die Nachwuchsakademie auf Maximalstufe 5.',
        targetType: 'academy_growth',
        targetValue: 5,
        currentValue: currentAcademy,
        completed: currentAcademy >= 5,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(1, 1000000, country),
      };
    }

    const targetSurplus = Math.max(500000, getLeagueScaledVal(1, isSubsequentCycle ? 4000000 : 3000000, country));
    const goals: BoardRoadmapGoal[] = [
      {
        id: `dynasty_titles_${currentYear}`,
        titleEn: isSubsequentCycle ? 'Title Hegemony' : 'Domestic Dynasty',
        titleDe: isSubsequentCycle ? 'Titel-Hegemonie' : 'Nationale Dominanz',
        descriptionEn: 'Win at least 2 League Championships over the next 3 seasons.',
        descriptionDe: 'Gewinne mindestens 2 Meisterschaften in den nächsten 3 Spielzeiten.',
        targetType: 'championship_dominance',
        targetValue: 2,
        currentValue: 0,
        completed: false,
        rewardMp: 4,
        rewardCash: getLeagueScaledVal(1, 1500000, country),
      },
      {
        id: `euro_supremacy_${currentYear}`,
        titleEn: isSubsequentCycle ? 'Champions League Supremacy' : 'European Glory',
        titleDe: isSubsequentCycle ? 'Champions-League-Triumph' : 'Europäischer Triumph',
        descriptionEn: 'Win the EHF Champions League or an International Cup trophy.',
        descriptionDe: 'Gewinne die EHF Champions League oder einen internationalen Pokal.',
        targetType: 'european_glory',
        targetValue: 1,
        currentValue: 0,
        completed: false,
        rewardMp: 5,
        rewardCash: getLeagueScaledVal(1, 2000000, country),
      },
      infraGoal,
      {
        id: `giant_solvency_${currentYear}`,
        titleEn: 'Commercial & Financial Prestige',
        titleDe: 'Wirtschaftliche Stärke & Reserve',
        descriptionEn: `Maintain positive balance with at least €${(targetSurplus / 1000000).toFixed(1)}M reserve and avoid debt.`,
        descriptionDe: `Halte ein Guthaben von mindestens ${(targetSurplus / 1000000).toFixed(1)} Mio. € ohne Schulden.`,
        targetType: 'financial_surplus',
        targetValue: targetSurplus,
        currentValue: club.currentBudget !== undefined ? club.currentBudget : ((club as any).budget ?? 5000000),
        completed: false,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(1, 1000000, country),
      },
    ];

    return {
      clubId: club.id,
      clubName: club.name,
      titleEn: isSubsequentCycle
        ? '3-Year Continental Hegemony & Infrastructure Roadmap'
        : '3-Year Dynasty & European Supremacy Roadmap',
      titleDe: isSubsequentCycle
        ? '3-Jahres-Kontinental-Hegemonie & Infrastruktur-Roadmap'
        : '3-Jahres-Dynastie & Europäische Vorherrschaft Roadmap',
      horizonYears,
      startYear: currentYear,
      endYear: currentYear + horizonYears,
      status: 'in_progress',
      goals,
      boardConfidence: 85,
      narrativeEn: isSubsequentCycle
        ? `Having achieved previous strategic milestones, the Board demands sustained European hegemony, arena expansion, and unyielding domestic silverware.`
        : `As an undisputed powerhouse, the Board expects unwavering domestic dominance, arena modernization, and continental silverware. Mediocrity will not be tolerated.`,
      narrativeDe: isSubsequentCycle
        ? `Nach dem Erreichen früherer Meilensteine verlangt der Vorstand dauerhafte europäische Vorherrschaft und den Ausbau der Vereins-Infrastruktur.`
        : `Als unangefochtene europäische Spitzenmacht erwartet der Vorstand unerschütterliche Dominanz, Hallenausbau und kontinentale Trophäen.`,
      tierAtStart: tier,
    };
  }

  // 2. TIER 1 UPPER HALF & CONTINENTAL CONTENDERS (OVR 73+, e.g. Nantes, Flensburg, Sporting, Granollers)
  if (tier === 1 && ovr >= 73) {
    const horizonYears: 2 | 3 | 5 = isSubsequentCycle ? 3 : 2;
    const currentStadium = club.stadium || Math.min(4500, maxArenaCap);
    const currentAcademy = club.academyLevel || 1;
    const currentMedical = club.medicalLevel || 1;
    const targetCapacity = Math.min(maxArenaCap, currentStadium + 1500, 9500);
    const targetAcademy = Math.min(5, Math.max(3, currentAcademy + 1));
    const targetMedical = Math.min(5, Math.max(3, currentMedical + 1));
    const targetSurplus = Math.max(250000, getLeagueScaledVal(1, 900000, country));

    let infraGoal: BoardRoadmapGoal;
    if (currentStadium < Math.min(7500, maxArenaCap)) {
      infraGoal = {
        id: `arena_expand_${currentYear}`,
        titleEn: 'Arena Infrastructure Upgrade',
        titleDe: 'Arena-Infrastruktur-Ausbau',
        descriptionEn: `Expand arena capacity to at least ${targetCapacity.toLocaleString()} seats.`,
        descriptionDe: `Erweitere die Hallenkapazität auf mindestens ${targetCapacity.toLocaleString()} Plätze.`,
        targetType: 'arena_expansion',
        targetValue: targetCapacity,
        currentValue: currentStadium,
        completed: currentStadium >= targetCapacity,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(1, 600000, country),
      };
    } else if (currentAcademy < 5) {
      infraGoal = {
        id: `academy_expand_${currentYear}`,
        titleEn: 'High-Performance Academy Expansion',
        titleDe: 'Leistungszentrum-Ausbau',
        descriptionEn: `Upgrade Youth Academy to Level ${targetAcademy} for sustainable talent development.`,
        descriptionDe: `Baue die Nachwuchsakademie auf Stufe ${targetAcademy} aus.`,
        targetType: 'academy_growth',
        targetValue: targetAcademy,
        currentValue: currentAcademy,
        completed: currentAcademy >= targetAcademy,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(1, 500000, country),
      };
    } else if (currentMedical < 5) {
      infraGoal = {
        id: `medical_expand_${currentYear}`,
        titleEn: 'Sports Science & Medical Center',
        titleDe: 'Sportmedizin & Regenerationszentrum',
        descriptionEn: `Upgrade Medical Department to Level ${targetMedical} to protect squad recovery.`,
        descriptionDe: `Baue die medizinische Abteilung auf Stufe ${targetMedical} aus.`,
        targetType: 'medical_growth',
        targetValue: targetMedical,
        currentValue: currentMedical,
        completed: currentMedical >= targetMedical,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(1, 500000, country),
      };
    } else {
      const megaCapacity = Math.min(maxArenaCap, currentStadium + 1500, 12500);
      infraGoal = {
        id: `arena_expand_${currentYear}`,
        titleEn: 'Coliseum Arena Expansion',
        titleDe: 'Großhallen-Erweiterung',
        descriptionEn: `Expand arena capacity to at least ${megaCapacity.toLocaleString()} seats to match our European standing.`,
        descriptionDe: `Erweitere die Hallenkapazität auf mindestens ${megaCapacity.toLocaleString()} Plätze.`,
        targetType: 'arena_expansion',
        targetValue: megaCapacity,
        currentValue: currentStadium,
        completed: currentStadium >= megaCapacity,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(1, 750000, country),
      };
    }

    const goals: BoardRoadmapGoal[] = [
      {
        id: `top_four_${currentYear}`,
        titleEn: isSubsequentCycle ? 'Title Contender Push' : 'Continental Qualification',
        titleDe: isSubsequentCycle ? 'Titelanwärter-Angriff' : 'Europapokal-Qualifikation',
        descriptionEn: isSubsequentCycle
          ? 'Secure a Top-4 league finish and push for domestic or European silverware.'
          : 'Achieve a Top-4 league finish to secure European qualification.',
        descriptionDe: isSubsequentCycle
          ? 'Sichere einen Top-4-Platz und greife nach nationalen oder europäischen Trophäen.'
          : 'Erreiche einen Top-4-Tabellenplatz für das internationale Geschäft.',
        targetType: 'top_four',
        targetValue: 4,
        currentValue: 0,
        completed: false,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(1, 1000000, country),
      },
      infraGoal,
      {
        id: `financial_surplus_${currentYear}`,
        titleEn: 'Financial Solvency & Growth',
        titleDe: 'Finanzielle Solidität & Wachstum',
        descriptionEn: `Maintain positive club balance of at least €${(targetSurplus / 1000).toFixed(0)}K and avoid debt.`,
        descriptionDe: `Halte ein positives Clubguthaben von mind. €${(targetSurplus / 1000).toFixed(0)}K ohne Schulden.`,
        targetType: 'financial_surplus',
        targetValue: targetSurplus,
        currentValue: club.currentBudget !== undefined ? club.currentBudget : ((club as any).budget ?? 1000000),
        completed: false,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(1, 400000, country),
      },
    ];

    return {
      clubId: club.id,
      clubName: club.name,
      titleEn: isSubsequentCycle
        ? '3-Year Title Contender & European Push Roadmap'
        : '2-Year European Breakthrough Roadmap',
      titleDe: isSubsequentCycle
        ? '3-Jahres-Titelanwärter & Europa-Roadmap'
        : '2-Jahres-Europa-Durchbruch Roadmap',
      horizonYears,
      startYear: currentYear,
      endYear: currentYear + horizonYears,
      status: 'in_progress',
      goals,
      boardConfidence: 75,
      narrativeEn: isSubsequentCycle
        ? `With top-flight credentials established, the Board expects continued European contention alongside sustained arena and training facility upgrades.`
        : `The Board believes our squad has reached maturity. Our mandate is to breach the top 4 and modernize club infrastructure.`,
      narrativeDe: isSubsequentCycle
        ? `Nachdem die Erstliga-Rolle gefestigt ist, erwartet der Vorstand konstante Europapokal-Präsenz und moderne Infrastruktur.`
        : `Der Vorstand sieht den Kader reif für Europa. Unser Auftrag: Top-4-Einzug und Ausbau der Infrastruktur.`,
      tierAtStart: tier,
    };
  }

  // 3. TIER 1 LOWER HALF & RELEGATION BATTLES (OVR < 73, e.g. Stuttgart, Eisenach, Cangas)
  if (tier === 1) {
    const horizonYears: 2 | 3 | 5 = 2;
    const currentStadium = club.stadium || Math.min(2500, maxArenaCap);
    const currentAcademy = club.academyLevel || 1;
    const targetCapacity = Math.min(maxArenaCap, currentStadium + 800, 4500);
    const targetSurplus = Math.max(50000, getLeagueScaledVal(1, 450000, country));

    const goals: BoardRoadmapGoal[] = [
      {
        id: `solidify_t1_${currentYear}`,
        titleEn: isSubsequentCycle ? 'Established Mid-Table Standing' : 'Top-Flight Consolidation',
        titleDe: isSubsequentCycle ? 'Gesichertes Tabellenmittelfeld' : 'Erstliga-Klassenerhalt',
        descriptionEn: isSubsequentCycle
          ? 'Secure top-flight survival without relegation threats for 2 consecutive seasons.'
          : 'Avoid relegation for 2 consecutive seasons and solidify Tier 1 status.',
        descriptionDe: isSubsequentCycle
          ? 'Sichere in 2 aufeinanderfolgenden Saisons den Klassenerhalt ohne Abstiegssorgen.'
          : 'Verhindere in 2 aufeinanderfolgenden Saisons den Abstieg.',
        targetType: 'solidify_tier',
        targetValue: 2,
        currentValue: 0,
        completed: false,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(1, 600000, country),
      },
    ];

    if (isSubsequentCycle && currentStadium < Math.min(4000, maxArenaCap)) {
      goals.push({
        id: `arena_expand_${currentYear}`,
        titleEn: 'Arena Expansion Plan',
        titleDe: 'Hallen-Erweiterungsplan',
        descriptionEn: `Expand arena capacity to at least ${targetCapacity.toLocaleString()} seats to improve matchday revenue.`,
        descriptionDe: `Erweitere die Hallenkapazität auf mindestens ${targetCapacity.toLocaleString()} Plätze.`,
        targetType: 'arena_expansion',
        targetValue: targetCapacity,
        currentValue: currentStadium,
        completed: currentStadium >= targetCapacity,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(1, 400000, country),
      });
    } else if (isSubsequentCycle && currentAcademy < 3) {
      goals.push({
        id: `academy_expand_${currentYear}`,
        titleEn: 'Academy Modernization Plan',
        titleDe: 'Akademie-Ausbau',
        descriptionEn: `Upgrade Youth Academy to Level 2 or higher to nurture budget-friendly talent.`,
        descriptionDe: `Baue die Nachwuchsakademie auf mindestens Stufe 2 aus.`,
        targetType: 'academy_growth',
        targetValue: 2,
        currentValue: currentAcademy,
        completed: currentAcademy >= 2,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(1, 350000, country),
      });
    }

    goals.push({
      id: `financial_surplus_${currentYear}`,
      titleEn: 'Financial Solvency',
      titleDe: 'Finanzielle Solidität',
      descriptionEn: `Maintain positive club balance of at least €${(targetSurplus / 1000).toFixed(0)}K and avoid debt.`,
      descriptionDe: `Halte ein positives Clubguthaben von mind. €${(targetSurplus / 1000).toFixed(0)}K ohne Verbindlichkeiten.`,
      targetType: 'financial_surplus',
      targetValue: targetSurplus,
      currentValue: club.currentBudget !== undefined ? club.currentBudget : ((club as any).budget ?? 500000),
      completed: false,
      rewardMp: 2,
      rewardCash: getLeagueScaledVal(1, 300000, country),
    });

    return {
      clubId: club.id,
      clubName: club.name,
      titleEn: isSubsequentCycle
        ? '2-Year Mid-Table Consolidation & Infrastructure Roadmap'
        : '2-Year Top-Flight Consolidation Roadmap',
      titleDe: isSubsequentCycle
        ? '2-Jahres-Mittelfeld & Infrastruktur-Roadmap'
        : '2-Jahres-Erstliga-Klassenerhalt Roadmap',
      horizonYears,
      startYear: currentYear,
      endYear: currentYear + horizonYears,
      status: 'in_progress',
      goals,
      boardConfidence: 70,
      narrativeEn: `Preserving our elite league status is paramount. The Board requires guaranteed survival, sensible financial management, and sustainable club growth.`,
      narrativeDe: `Der Verbleib im Oberhaus hat oberste Priorität. Der Vorstand fordert sicheren Klassenerhalt und solide Finanzen.`,
      tierAtStart: tier,
    };
  }

  // 4. RESERVE SIDES (ANY TIER: e.g. Barça Atlètic, THW Kiel II, SG Flensburg-Handewitt II)
  // Under statutory sports regulations, reserve teams can NEVER climb to Tier 1.
  // Their fundamental mandate is developing youth players and incubating prospects for the senior team.
  if (isReserve) {
    const horizonYears: 2 | 3 | 5 = 3;
    const currentAcademy = club.academyLevel || 1;
    const targetAcademy = Math.min(5, Math.max(currentAcademy + 1, tier === 2 ? 3 : 2));
    const targetSurplus = Math.max(100000, getLeagueScaledVal(tier, 300000, country));

    // Core Goal 1: Youth Talent Factory & Academy Expansion (Mandatory Youth Development Focus)
    const goals: BoardRoadmapGoal[] = [
      {
        id: `academy_growth_${currentYear}`,
        titleEn: currentAcademy >= 5 ? 'Elite Youth Incubator Standards' : 'Talent Factory & Youth Development',
        titleDe: currentAcademy >= 5 ? 'Elite-Nachwuchszentrum Spitzenstandard' : 'Talentschmiede & Nachwuchsausbau',
        descriptionEn: currentAcademy >= 5
          ? 'Maintain world-class Level 5 Youth Academy facilities to nurture elite prospects for the first team.'
          : `Upgrade the Youth Academy to Level ${targetAcademy} to expand youth pipeline capacity and elevate developmental potential for the senior squad.`,
        descriptionDe: currentAcademy >= 5
          ? 'Halte das Level-5-Nachwuchszentrum auf Weltklasse-Niveau zur Ausbildung von Profitalenten.'
          : `Baue die Nachwuchs-Akademie auf Stufe ${targetAcademy} aus, um Nachwuchsspieler optimal für das Profiteam auszubilden.`,
        targetType: 'academy_growth',
        targetValue: targetAcademy,
        currentValue: currentAcademy,
        completed: currentAcademy >= targetAcademy,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(tier, 250000, country),
      },
    ];

    if (tier === 2) {
      // In Tier 2: Promotion to Tier 1 is legally barred under statutory regulations. Focus on Tier 2 stability.
      goals.push({
        id: `reserve_stability_${currentYear}`,
        titleEn: 'Division 2 Stability & Senior Feeder',
        titleDe: 'Zweitliga-Sicherung & Ausbildungsstätte',
        descriptionEn: 'Avoid relegation and secure mid-table security in Tier 2 for 2 seasons while developing youth prospects (statutory rules prohibit Tier 1 promotion).',
        descriptionDe: 'Verhindere den Abstieg und sichere den Klassenerhalt in Liga 2 für 2 Spielzeiten (Aufstieg in Liga 1 satzungsgemäß ausgeschlossen).',
        targetType: 'solidify_tier',
        targetValue: 2,
        currentValue: 0,
        completed: false,
        rewardMp: 3,
        rewardCash: getLeagueScaledVal(2, 400000, country),
      });
    } else {
      // In Tier > 2 (Tier 3, 4, 5, etc.): Can only climb to at most Tier 2 (the statutory ceiling). NEVER Tier 1!
      const targetClimbTier = Math.max(2, tier - 1);
      goals.push({
        id: `reserve_pyramid_climb_${currentYear}`,
        titleEn: targetClimbTier === 2 ? 'Promotion to Tier 2 (Ceiling)' : `Pyramid Progression to Tier ${targetClimbTier}`,
        titleDe: targetClimbTier === 2 ? 'Aufstieg in Liga 2 (Oberes Limit)' : `Aufstieg in Liga ${targetClimbTier}`,
        descriptionEn: targetClimbTier === 2
          ? 'Achieve promotion to Tier 2 (the statutory maximum division permitted for reserve sides) to test youth talents at the highest allowable competitive level.'
          : `Rise to Tier ${targetClimbTier} to provide elite competition for developing academy graduates.`,
        descriptionDe: targetClimbTier === 2
          ? 'Erreiche den Aufstieg in Liga 2 (die satzungsgemäße Höchstliga für Reserveteams), um Nachwuchsspieler auf höchstem Niveau zu fordern.'
          : `Steige in Liga ${targetClimbTier} auf, um den Nachwuchsspielern Wettkampfhärte zu bieten.`,
        targetType: 'promotion_tier',
        targetValue: targetClimbTier, // Strictly >= 2, NEVER 1!
        currentValue: tier,
        completed: false,
        rewardMp: 4,
        rewardCash: getLeagueScaledVal(tier, 450000, country),
      });
    }

    goals.push({
      id: `financial_surplus_${currentYear}`,
      titleEn: 'Balanced Reserve Nursery Budget',
      titleDe: 'Ausgeglichenes Reserve-Budget',
      descriptionEn: `Maintain positive reserve balance of at least €${(targetSurplus / 1000).toFixed(0)}K to sustainably fund youth talent operations.`,
      descriptionDe: `Halte ein positives Budget von mindestens €${(targetSurplus / 1000).toFixed(0)}K zur Finanzierung der Nachwuchsförderung.`,
      targetType: 'financial_surplus',
      targetValue: targetSurplus,
      currentValue: club.currentBudget !== undefined ? club.currentBudget : ((club as any).budget ?? 300000),
      completed: false,
      rewardMp: 2,
      rewardCash: getLeagueScaledVal(tier, 200000, country),
    });

    return {
      clubId: club.id,
      clubName: club.name,
      titleEn: tier === 2
        ? '3-Year Youth Talent Incubator & Division 2 Roadmap'
        : `3-Year Youth Development & Tier ${Math.max(2, tier - 1)} Roadmap`,
      titleDe: tier === 2
        ? '3-Jahres-Talentförderung & 2.-Liga-Sicherung Roadmap'
        : `3-Jahres-Talentförderung & Liga-${Math.max(2, tier - 1)} Roadmap`,
      horizonYears,
      startYear: currentYear,
      endYear: currentYear + horizonYears,
      status: 'in_progress',
      goals,
      boardConfidence: 80,
      narrativeEn: tier === 2
        ? `As a reserve squad, our core mission is developing future stars for the senior squad while maintaining our position in Division 2. Statutory league rules strictly bar reserve sides from ascending to Tier 1.`
        : `As a reserve squad, our overarching mandate is developing youth players and feeding first-team talent. Under statutory league rules, reserve teams can never climb to Tier 1, so our focus is developing elite prospects while climbing to the Tier 2 ceiling.`,
      narrativeDe: tier === 2
        ? `Als Reserveteam ist unsere Kernaufgabe die Ausbildung zukünftiger Profis und die Sicherung der Spielklasse. Ein Aufstieg in Liga 1 ist satzungsgemäß ausgeschlossen.`
        : `Als Reserveteam ist unsere Hauptaufgabe die Ausbildung und Entwicklung junger Talente für das Profiteam. Ein Aufstieg in Liga 1 ist satzungsgemäß ausgeschlossen, weshalb der Fokus voll auf der Jugendförderung liegt.`,
      tierAtStart: tier,
    };
  }

  // 5. TIER 2 STANDARD CLUBS (e.g. TuS N-Lübbecke, Bergischer HC, Tremblay, Burgos)
  if (tier === 2) {
    const horizonYears: 2 | 3 | 5 = 3;
    const targetAcademy = Math.min(5, Math.max(2, (club.academyLevel || 1) + 1));
    const currentStadium = club.stadium || Math.min(2000, maxArenaCap);
    const targetCapacity = Math.min(maxArenaCap, currentStadium + 800, 4000);
    const goals: BoardRoadmapGoal[] = [
      {
        id: `promote_tier1_${currentYear}`,
        titleEn: 'Promotion to Tier 1',
        titleDe: 'Aufstieg in Liga 1',
        descriptionEn: 'Achieve promotion to the top division within 3 seasons.',
        descriptionDe: 'Erreiche innerhalb von 3 Spielzeiten den Aufstieg in das Oberhaus.',
        targetType: 'promotion_tier',
        targetValue: 1,
        currentValue: tier,
        completed: false,
        rewardMp: 4,
        rewardCash: getLeagueScaledVal(2, 800000, country),
      },
      {
        id: `academy_growth_${currentYear}`,
        titleEn: 'Youth Talent Pipeline',
        titleDe: 'Nachwuchs-Akademie Ausbau',
        descriptionEn: `Upgrade the Youth Academy to Level ${targetAcademy} or higher.`,
        descriptionDe: `Baue die Nachwuchs-Akademie auf mindestens Stufe ${targetAcademy} aus.`,
        targetType: 'academy_growth',
        targetValue: targetAcademy,
        currentValue: club.academyLevel || 1,
        completed: (club.academyLevel || 1) >= targetAcademy,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(2, 300000, country),
      },
    ];

    if (isSubsequentCycle && currentStadium < Math.min(3500, maxArenaCap)) {
      goals.push({
        id: `arena_expand_${currentYear}`,
        titleEn: 'Arena Growth Plan',
        titleDe: 'Hallen-Ausbau',
        descriptionEn: `Expand arena capacity to at least ${targetCapacity.toLocaleString()} seats to prepare for top-flight standards.`,
        descriptionDe: `Erweitere die Hallenkapazität auf mindestens ${targetCapacity.toLocaleString()} Plätze.`,
        targetType: 'arena_expansion',
        targetValue: targetCapacity,
        currentValue: currentStadium,
        completed: currentStadium >= targetCapacity,
        rewardMp: 2,
        rewardCash: getLeagueScaledVal(2, 350000, country),
      });
    }

    return {
      clubId: club.id,
      clubName: club.name,
      titleEn: isSubsequentCycle
        ? '3-Year Promotion Push & Infrastructure Roadmap'
        : '3-Year Promotion to Elite Roadmap',
      titleDe: isSubsequentCycle
        ? '3-Jahres-Aufstiegsdruck & Infrastruktur-Roadmap'
        : '3-Year Promotion to Elite Roadmap',
      horizonYears,
      startYear: currentYear,
      endYear: currentYear + horizonYears,
      status: 'in_progress',
      goals,
      boardConfidence: 75,
      narrativeEn: `Second division status is only temporary. The Board expects strategic investments into youth and promotion to Tier 1 within 3 years.`,
      narrativeDe: `Die 2. Liga ist nur Durchgangsstation. Der Vorstand erwartet gezielte Nachwuchsförderung und den Aufstieg binnen 3 Jahren.`,
      tierAtStart: tier,
    };
  }

  // 6. TIER 3, 4, OR 5: LOWER PYRAMID & GRASSROOTS
  const horizonYears: 2 | 3 | 5 = 5;
  const targetTier = isReserve ? Math.max(2, tier - 2) : Math.max(1, tier - 2);
  
  // Proportional, realistic fanbase scaling by tier (capped by club catchment ceiling so goal is always achievable):
  const econProfile = getCountryEconomicProfile(country);
  const calibratedBaseFan = getCalibratedStartingFanbase(club);
  const rawClubFan = club.fanBase || (tier === 3 ? 5000 : tier === 4 ? 2000 : 800);
  const currentFans = (econProfile.tier === 4 && rawClubFan > calibratedBaseFan * 2.5)
    ? calibratedBaseFan
    : rawClubFan;
  const catchment = getClubCatchmentCeiling({ ...club, fanBase: currentFans });
  const fanGrowthMult = tier === 5 ? 1.8 : 1.6;
  const minTargetFans = tier === 3 ? 6000 : tier === 4 ? 2500 : 1200;
  const targetFans = Math.min(
    catchment.maxCeiling,
    Math.round(Math.max(currentFans * fanGrowthMult, Math.min(catchment.maxCeiling, minTargetFans)))
  );
  const currentStadium = club.stadium || (tier === 3 ? 1200 : 600);
  const targetCapacity = Math.min(maxArenaCap, currentStadium + 800, tier === 3 ? 2500 : 1500);

  const goals: BoardRoadmapGoal[] = [
    {
      id: `pyramid_climb_${currentYear}`,
      titleEn: `Climb the Pyramid to Tier ${targetTier}`,
      titleDe: `Aufstieg in Liga ${targetTier}`,
      descriptionEn: `Rise from Tier ${tier} to at least Tier ${targetTier} within 5 seasons.`,
      descriptionDe: `Steige von Liga ${tier} in mindestens Liga ${targetTier} innerhalb von 5 Jahren auf.`,
      targetType: 'promotion_tier',
      targetValue: targetTier,
      currentValue: tier,
      completed: false,
      rewardMp: 5,
      rewardCash: getLeagueScaledVal(tier, 600000, country),
    },
    {
      id: `grassroots_fans_${currentYear}`,
      titleEn: 'Grassroots Supporter Boom',
      titleDe: 'Grassroots-Fanwachstum',
      descriptionEn: `Grow club fanbase to over ${targetFans.toLocaleString()} addressable supporters.`,
      descriptionDe: `Steigere die Fanbasis auf über ${targetFans.toLocaleString()} Fans.`,
      targetType: 'fanbase_growth',
      targetValue: targetFans,
      currentValue: currentFans,
      completed: currentFans >= targetFans,
      rewardMp: 3,
      rewardCash: getLeagueScaledVal(tier, 250000, country),
    },
  ];

  if (isSubsequentCycle && currentStadium < Math.min(2500, maxArenaCap)) {
    goals.push({
      id: `arena_expand_${currentYear}`,
      titleEn: 'Grassroots Arena Growth Plan',
      titleDe: 'Vereinshallen-Erweiterung',
      descriptionEn: `Expand venue capacity to at least ${targetCapacity.toLocaleString()} seats to house expanding local crowds.`,
      descriptionDe: `Erweitere die Hallenkapazität auf mindestens ${targetCapacity.toLocaleString()} Plätze.`,
      targetType: 'arena_expansion',
      targetValue: targetCapacity,
      currentValue: currentStadium,
      completed: currentStadium >= targetCapacity,
      rewardMp: 2,
      rewardCash: getLeagueScaledVal(tier, 200000, country),
    });
  }

  return {
    clubId: club.id,
    clubName: club.name,
    titleEn: isSubsequentCycle
      ? '5-Year Grassroots Hegemony & Infrastructure Roadmap'
      : '5-Year Grassroots to Glory Roadmap',
    titleDe: isSubsequentCycle
      ? '5-Jahres-Grassroots-Ausbau & Infrastruktur Roadmap'
      : '5-Year Grassroots to Glory Roadmap',
    horizonYears,
    startYear: currentYear,
    endYear: currentYear + horizonYears,
    status: 'in_progress',
    goals,
    boardConfidence: 80,
    narrativeEn: isSubsequentCycle
      ? `Having established sustainable roots, the Board demands continuous pyramid climbing alongside venue and supporter base expansion.`
      : `From the lower tiers, we are building a long-term sporting powerhouse. The Board requires steady promotion up the pyramid and fan expansion over 5 years.`,
    narrativeDe: isSubsequentCycle
      ? `Nachdem die Basis gelegt ist, fordert der Vorstand weiteren Ligaaufstieg sowie den Ausbau der Halle und Fanbasis.`
      : `Von den unteren Ligen aus formen wir eine neue Handball-Macht. Der Vorstand verlangt kontinuierlichen Aufstieg und Vergrößerung der Fanbasis.`,
    tierAtStart: tier,
  };
}

export interface RoadmapEvaluationResult {
  updatedRoadmap: BoardRoadmap;
  completedGoals: BoardRoadmapGoal[];
  roadmapFinished: boolean;
  success: boolean;
  earnedMp: number;
  earnedCash: number;
}

/**
 * Evaluates progress on the current roadmap after a completed season.
 */
export function evaluateRoadmapProgress(
  roadmap: BoardRoadmap,
  club: Club,
  currentYear: number,
  seasonStats: { pos: number; pts: number },
  history: any[],
  _trophiesWon: { bl?: number; lower?: number; dfb?: number; cl?: number; el?: number; cwc?: number; reg?: number; ecl?: number }
): RoadmapEvaluationResult {
  const updatedGoals: BoardRoadmapGoal[] = [];
  const completedGoals: BoardRoadmapGoal[] = [];
  let earnedMp = 0;
  let earnedCash = 0;

  // Slices relevant history during this roadmap period for the active club
  const clubHistory = history.filter(h => !h.clubName || h.clubName === club.name);
  const roadmapHistory = clubHistory.filter(h => h.year >= roadmap.startYear && h.year <= currentYear);

  for (const goal of roadmap.goals) {
    if (goal.completed && goal.rewardClaimed) {
      updatedGoals.push(goal);
      continue;
    }

    let newlyCompleted = Boolean(goal.completed && !goal.rewardClaimed);
    let currentVal = goal.currentValue;

    switch (goal.targetType) {
      case 'championship_dominance': {
        // Count tier 1 titles during roadmap period
        const titleCount = roadmapHistory.filter(h => (h.pos === 1 && (h.tier || 1) === 1) || Boolean(h.trophiesThisYear?.bl)).length;
        currentVal = titleCount;
        if (currentVal >= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      case 'european_glory': {
        const hasEuroTrophy = roadmapHistory.some(h => (h.trophiesThisYear?.cl || h.trophiesThisYear?.ecl || h.trophiesThisYear?.el || h.trophiesThisYear?.cwc)) || Boolean(_trophiesWon?.cl || _trophiesWon?.ecl || _trophiesWon?.el || _trophiesWon?.cwc);
        currentVal = hasEuroTrophy ? 1 : 0;
        if (currentVal >= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      case 'top_four': {
        const playedSeasonTier = clubHistory.length > 0 ? (clubHistory[clubHistory.length - 1].tier ?? club.tier) : club.tier;
        const achievedTop4 = (seasonStats.pos <= 4 && playedSeasonTier === 1) || roadmapHistory.some(h => h.pos <= 4 && (h.tier || 1) === 1);
        currentVal = achievedTop4 ? 4 : seasonStats.pos;
        if (achievedTop4) {
          newlyCompleted = true;
        }
        break;
      }

      case 'promotion_tier': {
        const lastHist = clubHistory.length > 0 ? clubHistory[clubHistory.length - 1] : null;
        const achievedTier = lastHist?.nextTier ?? club.tier ?? 1;
        currentVal = achievedTier;
        if (achievedTier <= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      case 'solidify_tier': {
        const targetTier = roadmap.tierAtStart || 1;
        const seasonsSurvived = roadmapHistory.filter(h => (h.tier === targetTier || h.tier <= targetTier) && !h.relegated).length;
        currentVal = seasonsSurvived;
        if (currentVal >= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      case 'arena_expansion': {
        currentVal = club.stadium || 0;
        if (currentVal >= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      case 'fanbase_growth': {
        currentVal = club.fanBase || 0;
        if (currentVal >= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      case 'academy_growth': {
        currentVal = club.academyLevel || 1;
        if (currentVal >= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      case 'medical_growth': {
        currentVal = club.medicalLevel || 1;
        if (currentVal >= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      case 'financial_surplus': {
        const clubBudget = club.currentBudget !== undefined ? club.currentBudget : ((club as any).budget ?? 0);
        currentVal = clubBudget;
        if (currentVal >= goal.targetValue) {
          newlyCompleted = true;
        }
        break;
      }

      default:
        break;
    }

    if (newlyCompleted) {
      const finishedGoal: BoardRoadmapGoal = {
        ...goal,
        currentValue: currentVal,
        completed: true,
        rewardClaimed: true,
      };
      updatedGoals.push(finishedGoal);
      completedGoals.push(finishedGoal);
      earnedMp += goal.rewardMp;
      earnedCash += goal.rewardCash || 0;
    } else {
      updatedGoals.push({
        ...goal,
        currentValue: currentVal,
      });
    }
  }

  const allCompleted = updatedGoals.every(g => g.completed);
  const isTimeUp = (currentYear + 1) >= roadmap.endYear;
  const roadmapFinished = allCompleted || isTimeUp;
  const success = allCompleted || (isTimeUp && updatedGoals.filter(g => g.completed).length >= Math.ceil(updatedGoals.length / 2));

  // If entire roadmap is completed on schedule, grant bonus MP!
  if (allCompleted && roadmap.status === 'in_progress') {
    earnedMp += 3; // Bonus +3 MP for fulfilling the entire strategic vision!
  }

  const newConfidence = allCompleted
    ? 100
    : completedGoals.length > 0
    ? Math.min(100, roadmap.boardConfidence + 15)
    : isTimeUp && !success
    ? Math.max(20, roadmap.boardConfidence - 35)
    : roadmap.boardConfidence;

  const updatedRoadmap: BoardRoadmap = {
    ...roadmap,
    goals: updatedGoals,
    status: allCompleted ? 'succeeded' : isTimeUp ? (success ? 'succeeded' : 'failed') : 'in_progress',
    boardConfidence: newConfidence,
  };

  return {
    updatedRoadmap,
    completedGoals,
    roadmapFinished,
    success,
    earnedMp,
    earnedCash,
  };
}
