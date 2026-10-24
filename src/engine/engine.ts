import { ALL_CLUBS as CLUBS } from '../data/clubsData';
import { Club, YouthProspect } from '../types';
import { normalizeCountry, isReserveClub } from '../data/gameConstants';
import { getActiveClubs } from '../utils/modManager';

export interface ProbabilisticSeasonOptions {
  isUserClub?: boolean;
  consecutiveTitles?: number;
  medicalLevel?: number;
  academyLevel?: number;
  tacticTenure?: number;
  hasTacticalMastermind?: boolean;
  previousSeasonRecord?: { wins?: number; draws?: number; losses?: number; gf?: number; ga?: number };
  recentHistoryRecords?: Array<{ wins?: number; draws?: number; losses?: number; pts?: number; gf?: number; ga?: number }>;
  clubsPool?: Club[];
}

export function calculateProbabilisticSeason(
  team: Club, 
  leagueAvgOvr: number = 60,
  tier: number = 1,
  tactic: string = 'Total Handball',
  numTeams: number = 18,
  morale: number = 100,
  isUserClubOrOptions: boolean | ProbabilisticSeasonOptions = true,
  consecutiveTitlesArg: number = 0,
  medicalLevelArg: number = 1
) {
  let isUserClub = true;
  let consecutiveTitles = 0;
  let medicalLevel = 1;
  let academyLevel = 1;
  let tacticTenure = 1;
  let hasTacticalMastermind = false;
  let previousSeasonRecord: { wins?: number; draws?: number; losses?: number; gf?: number; ga?: number } | undefined = undefined;
  let recentHistoryRecords: Array<{ wins?: number; draws?: number; losses?: number; pts?: number; gf?: number; ga?: number }> = [];
  let customClubsPool: Club[] | undefined = undefined;

  if (typeof isUserClubOrOptions === 'object' && isUserClubOrOptions !== null) {
    isUserClub = isUserClubOrOptions.isUserClub ?? true;
    consecutiveTitles = isUserClubOrOptions.consecutiveTitles ?? 0;
    medicalLevel = isUserClubOrOptions.medicalLevel ?? (team.medicalLevel || 1);
    academyLevel = isUserClubOrOptions.academyLevel ?? (team.academyLevel || 1);
    tacticTenure = isUserClubOrOptions.tacticTenure ?? 1;
    hasTacticalMastermind = Boolean(isUserClubOrOptions.hasTacticalMastermind);
    previousSeasonRecord = isUserClubOrOptions.previousSeasonRecord;
    recentHistoryRecords = isUserClubOrOptions.recentHistoryRecords || [];
    customClubsPool = isUserClubOrOptions.clubsPool;
    if (!previousSeasonRecord && recentHistoryRecords.length > 0) {
      previousSeasonRecord = recentHistoryRecords[recentHistoryRecords.length - 1];
    }
  } else if (typeof isUserClubOrOptions === 'boolean') {
    isUserClub = isUserClubOrOptions;
    consecutiveTitles = consecutiveTitlesArg;
    medicalLevel = medicalLevelArg > 1 ? medicalLevelArg : (team.medicalLevel || 1);
    academyLevel = team.academyLevel || 1;
  }

  let ovrDiff = team.baseOvr - leagueAvgOvr;
  if (isUserClub && hasTacticalMastermind) {
    ovrDiff += 2.0;
  }
  
  if (morale <= 30) ovrDiff -= 3;
  else if (morale <= 50) ovrDiff -= 1;
  else if (morale >= 90) ovrDiff += 1;

  // Medical Level 5 Milestone ("Peak Performance Institute"):
  // Grants +1.0 Effective OVR matchday conditioning & final-15-minute stamina edge.
  if (isUserClub && medicalLevel >= 5) {
    ovrDiff += 1.0;
  }

  // 'Target on the Back' Tax (With Counter-Play & Infrastructure Immunity):
  // For every consecutive title the user wins, apply an escalating penalty to their ovrDiff (capped at -4.0 OVR).
  // Facility Milestone: Level 5 Academy ("Global Dynasty") OR Level 5 Medical ("Peak Performance Institute") grants permanent complete immunity (tax = 0)!
  // Counter-Play: If Morale > 90, or Medical Level >= 3, halve this penalty.
  if (isUserClub && consecutiveTitles > 0) {
    const rawTax = Math.min(4.0, consecutiveTitles >= 4 ? Math.max(2.5, consecutiveTitles * 0.75) : consecutiveTitles * 0.5);
    const hasGlobalDynastyImmunity = academyLevel >= 5 || medicalLevel >= 5;
    if (!hasGlobalDynastyImmunity) {
      const tax = (morale > 90 || medicalLevel >= 3) ? (rawTax / 2) : rawTax;
      ovrDiff -= tax;
    }
  }

  // Tactical System Staleness:
  // If the user runs the exact same tactical setup over consecutive seasons, opposition analysts map patterns:
  // - Year 2: -0.5 OVR (system becoming stale, video analysts adapting)
  // - Year 3+: -1.0 OVR (critically stale system, predictable lanes)
  if (isUserClub && tacticTenure >= 2) {
    const stalenessTax = tacticTenure === 2 ? 0.5 : 1.0;
    ovrDiff -= stalenessTax;
  }
  
  // Tactical counter-matchups bonus & philosophy perks
  if (tactic === '6:0 Defense' || tactic === 'Aggressive 6-0') {
    ovrDiff += Math.random() > 0.5 ? 2 : -1; // Solid floor
  } else if (tactic === 'Fast Break') {
    ovrDiff += Math.random() > 0.5 ? 3 : -2; // High variance
    ovrDiff += 0.5; // +1 Home OVR Boost average perk
  } else if (tactic === '7v6 Offense' || tactic === '7v6 Empty Net') {
    ovrDiff += Math.random() > 0.7 ? 4 : -3; // Extreme risk/reward
    ovrDiff += 1.0; // +2 Away OVR Boost average perk
  } else if (tactic === '5:1 Defense' || tactic === 'Offensive 3-2-1') {
    ovrDiff += Math.random() > 0.5 ? 2 : -1; // Disruptive
    if (ovrDiff < 0) {
      ovrDiff += 3.0; // +3 OVR Giant-Killer Boost vs Stronger Teams
    }
  } else if (tactic === 'Total Handball' || tactic === 'Playmaker Focus') {
    ovrDiff += 1; // Balanced
    if (team.baseOvr >= 60 && ovrDiff > 0) {
      ovrDiff += 2.0; // +2 OVR vs Weaker Opponents
    }
  }

  if (tier === 1 && ovrDiff > 6) {
    ovrDiff = 6 + (ovrDiff - 6) * 0.75;
  }

  // Top 4 Shuffling:
  // Slightly increase the variance multiplier for teams with an ovrDiff > 5 so that the top 4 spots
  // swap more unpredictably among the giants, preventing the exact same AI team from finishing 2nd every single year.
  let varianceMultiplier = team.baseOvr < 75 ? 1.6 : 1.2;
  if (ovrDiff > 5) {
    varianceMultiplier *= 1.45;
  }
  const maxVariance = Math.min(3.0, (numTeams / 14) * varianceMultiplier);
  const variance = (Math.random() * 2 - 1) * maxVariance;
  
  // Base position calculation mapped to dynamic league size
  // In smaller leagues (e.g. 10 or 12 clubs), OVR spread across teams is narrower,
  // so each OVR point matters proportionally to prevent artificial bunching in the middle.
  const diffMultiplier = Math.max(0.85, (numTeams / 14)); 
  let rawPos = (numTeams / 2 + 0.5) - (ovrDiff * diffMultiplier) + variance; 
  let approxPos = Math.max(1, Math.min(numTeams, Math.round(rawPos)));

  // Realistic competitive safeguard:
  // A team with average or better-than-average league rating (ovrDiff >= -0.5) and stable morale (>= 70)
  // should not realistically plunge into the automatic relegation zone (bottom 2).
  if (ovrDiff >= -0.5 && morale >= 70) {
    const safeRelegationFloor = Math.max(1, numTeams - 2);
    approxPos = Math.min(approxPos, safeRelegationFloor);
  }
  
  // Asymmetric Safety Net (Protect AI Giants):
  // Keep the titleRoll auto-champion logic for AI-controlled Heritage Clubs (so teams like THW Kiel or SC Magdeburg
  // remain terrifyingly dominant when the user manages a small club).
  // However, remove or severely nerf this safety net for the user's club. The user must rely strictly on their ovrDiff and tactics to win.
  const titleRoll = Math.random();
  const isHeritage = (team.fanBase && team.fanBase > 100000) || [
    'SC Magdeburg', 'THW Kiel', 'SG Flensburg-Handewitt', 'Füchse Berlin', 
    'Paris Saint-Germain', 'Barça', 'Telekom Veszprém', 'Veszprém KC', 
    'Industria Kielce', 'Aalborg Håndbold'
  ].includes(team.name);

  if (!isUserClub && isHeritage) {
    if (tier === 1) {
      if (team.baseOvr >= 92 && titleRoll < 0.70) approxPos = 1;
      else if (team.baseOvr >= 88 && titleRoll < 0.25) approxPos = 1;
      else if (team.baseOvr < 86 && approxPos < 4) approxPos = Math.max(4, approxPos + Math.floor(Math.random() * 3));
    } else {
      if (ovrDiff >= 12 && titleRoll < 0.70) approxPos = 1;
      else if (ovrDiff >= 8 && titleRoll < 0.25) approxPos = 1;
    }
  } else if (!isUserClub) {
    // Non-heritage AI in lower tiers with overwhelming dominance
    if (tier > 1) {
      if (ovrDiff >= 12 && titleRoll < 0.70) approxPos = 1;
      else if (ovrDiff >= 8 && titleRoll < 0.25) approxPos = 1;
    }
  }
  
  const totalMatches = Math.max(0, (numTeams - 1) * 2);
  const rankPercentile = (numTeams - approxPos) / Math.max(1, numTeams - 1); // 1.0 for 1st, 0.0 for last
  const ovrDelta = team.baseOvr - leagueAvgOvr;

  // Authentic form and fortune variance (organic season momentum and bell-curve spread)
  const formFuzz = (Math.random() * 0.16 - 0.08) + (Math.random() * 0.10 - 0.05);
  // Organic season-long campaign narrative swing (prevents stagnant deterministic records across seasons)
  const seasonFormSwing = (Math.random() * 0.20 - 0.10) + (Math.random() * 0.12 - 0.06);
  const qualityFactor = Math.max(-0.06, Math.min(0.10, ovrDelta * 0.012));
  const tacticVariance = (tactic === 'Fast Break' || tactic === '7v6 Offense' || tactic === '7v6 Empty Net') ? (Math.random() * 0.08 - 0.04) : 0;
  const baseWinRate = 0.10 + (rankPercentile * 0.74);
  let winPct = Math.max(0.04, Math.min(0.96, baseWinRate + formFuzz + seasonFormSwing + qualityFactor + tacticVariance));

  let wins = Math.min(totalMatches, Math.max(0, Math.round(totalMatches * winPct)));

  // If 1st place champion: ensure champion-calibre baseline while allowing natural variance (e.g. 16-22 wins in 22 games)
  if (approxPos === 1) {
    const minChampWins = Math.max(wins, Math.round(totalMatches * 0.68));
    wins = Math.min(totalMatches, minChampWins);
  }

  // Draw probability in European handball (~8% to 15% of all matches end in draws)
  let remainingMatches = totalMatches - wins;
  const baseDrawRate = 0.20 + (0.5 - Math.abs(rankPercentile - 0.5)) * 0.16 + (Math.random() * 0.10 - 0.05);
  let draws = 0;
  for (let m = 0; m < remainingMatches; m++) {
    if (Math.random() < Math.max(0.05, baseDrawRate)) {
      draws++;
    }
  }

  // Multi-Season Anti-Repetition & Variety Guard for User Club:
  // Strictly prevent the user from receiving nearly the same record 3 times in a row!
  if (isUserClub && (recentHistoryRecords.length > 0 || previousSeasonRecord)) {
    const historyList = recentHistoryRecords.length > 0 
      ? recentHistoryRecords 
      : (previousSeasonRecord ? [previousSeasonRecord] : []);

    const isNearlyIdentical = (w1: number, d1: number, l1: number, rec: { wins?: number; draws?: number; losses?: number }) => {
      const rw = rec.wins ?? -99;
      const rd = rec.draws ?? -99;
      const rl = rec.losses ?? -99;
      return Math.abs(w1 - rw) <= 1 && Math.abs(d1 - rd) <= 1 && Math.abs(l1 - rl) <= 1;
    };

    const isExactMatch = (w1: number, d1: number, l1: number, rec: { wins?: number; draws?: number; losses?: number }) => {
      return w1 === rec.wins && d1 === rec.draws && l1 === rec.losses;
    };

    const currentLosses = Math.max(0, totalMatches - wins - draws);
    const matchesImmediatePrev = historyList.length > 0 && isNearlyIdentical(wins, draws, currentLosses, historyList[historyList.length - 1]);
    const matchesMultiplePast = historyList.filter(h => isNearlyIdentical(wins, draws, currentLosses, h)).length >= 2;
    const exactMatchPast = historyList.some(h => isExactMatch(wins, draws, currentLosses, h));

    if (matchesImmediatePrev || matchesMultiplePast || exactMatchPast) {
      const lastRec = historyList[historyList.length - 1];
      const prevDraws = lastRec.draws ?? draws;

      // Meaningfully diversify wins & draws (simulating distinct season stories: injury spells, unbeaten runs, tactical traps)
      const shouldSurge = (wins < totalMatches - 1) && (Math.random() < 0.5 || wins <= Math.round(totalMatches * 0.70));
      let winDelta = shouldSurge 
        ? Math.min(totalMatches - wins, Math.floor(Math.random() * 2) + 2) 
        : -Math.min(wins, Math.floor(Math.random() * 2) + 2);

      // Safeguard champion baseline
      if (approxPos === 1) {
        const floorChampWins = Math.round(totalMatches * 0.68);
        if (wins + winDelta < floorChampWins) {
          winDelta = Math.max(1, Math.min(3, totalMatches - wins));
        }
      }

      wins = Math.max(0, Math.min(totalMatches, wins + winDelta));
      remainingMatches = totalMatches - wins;

      // Ensure draw count breaks repetition
      if (remainingMatches > 0) {
        if (prevDraws === 0 && Math.random() < 0.75) {
          draws = Math.min(remainingMatches, Math.floor(Math.random() * 2) + 1);
        } else if (prevDraws >= 2 && Math.random() < 0.65) {
          draws = Math.min(remainingMatches, Math.max(0, prevDraws - 2));
        } else {
          draws = Math.min(remainingMatches, Math.floor(Math.random() * (Math.min(3, remainingMatches) + 1)));
        }
      } else {
        draws = 0;
      }
    }
  }

  while (wins + draws > totalMatches && draws > 0) {
    draws -= 1;
  }
  if (wins + draws > totalMatches) {
    wins = totalMatches - draws;
  }
  const losses = Math.max(0, totalMatches - wins - draws);
  const pts = wins * 2 + draws;

  // REALISTIC HANDBALL GOAL CALCULATIONS & GOAL DIFFERENCE
  // In European handball, each net win corresponds to ~3.5 to 5.2 goal difference.
  const netWins = wins - losses;
  const gdPerNetWin = 3.6 + (Math.random() * 1.6);
  const teamQualityGdBonus = ovrDelta * 1.8;
  const seasonGdVariance = (Math.random() * 16 - 8) + (Math.random() * 10 - 5);
  let targetGd = Math.round(netWins * gdPerNetWin + teamQualityGdBonus + seasonGdVariance);

  // Strict directional guarantee: winning teams must have positive GD, losing teams must have negative GD
  if (netWins > 0 && targetGd <= 0) targetGd = Math.max(2, netWins * 2);
  if (netWins < 0 && targetGd >= 0) targetGd = Math.min(-2, netWins * 2);
  if (netWins === 0 && Math.abs(targetGd) > 12) targetGd = Math.round(targetGd * 0.25);

  // Aggressive 6-0 Perk: -40% Goal Difference Damage
  if ((tactic === 'Aggressive 6-0' || tactic === '6:0 Defense') && targetGd < 0) {
    targetGd = Math.round(targetGd * 0.6);
  }

  // Realistic match tempo & season scoring variance:
  // European elite handball teams average 26.5 to 33.5 goals/match across seasons
  const seasonTempo = (Math.random() * 2.8 - 1.4) + (Math.random() * 1.6 - 0.8);
  let matchPace = 28.5 + seasonTempo;
  if (tactic === 'Fast Break' || tactic === '7v6 Offense' || tactic === '7v6 Empty Net') matchPace += 1.8;
  else if (tactic === '6:0 Defense' || tactic === 'Aggressive 6-0') matchPace -= 1.6;
  matchPace = Math.max(24.5, Math.min(34.0, matchPace));

  const totalBaseGoals = Math.round(totalMatches * matchPace);
  const minGf = Math.floor(totalMatches * 20);
  const maxGf = Math.floor(totalMatches * 36);

  let gf = Math.round(totalBaseGoals + (targetGd / 2));
  gf = Math.min(maxGf, Math.max(minGf, gf));
  let ga = gf - targetGd;

  // Clamp ga and adjust gf in tandem if necessary to preserve exact delta
  if (ga < minGf) {
    const diff = minGf - ga;
    ga = minGf;
    gf = Math.min(maxGf, gf + diff);
  } else if (ga > maxGf) {
    const diff = ga - maxGf;
    ga = maxGf;
    gf = Math.max(minGf, gf - diff);
  }

  // Maintain directional consistency after clamping
  if (netWins > 0 && gf <= ga) gf = ga + Math.max(2, netWins * 2);
  if (netWins < 0 && gf >= ga) ga = gf + Math.max(2, Math.abs(netWins) * 2);

  // DECISION DAY LOGIC
  let ddType: 'title' | 'promotion_playoff' | 'relegation_battle' | null = null;
  let rivalName = 'Rival';
  let leaderGd = 0;
  let trailerGd = 0;
  let rivalPts = pts;

  const relegationThreshold = Math.max(1, numTeams - 1);
  const maxLeaguePts = totalMatches * 2;
  const championPts = Math.round(maxLeaguePts * 0.85);
  const bottomPts = Math.round(maxLeaguePts * 0.12);
  const expectedDropZonePts = Math.round(championPts - ((relegationThreshold - 1) / Math.max(1, numTeams - 1)) * (championPts - bottomPts));
  const expectedSafetyPts = Math.round(championPts - ((relegationThreshold - 2) / Math.max(1, numTeams - 1)) * (championPts - bottomPts));

  const titleRaceChance = tier === 1 ? 0.60 : 0.33;
  if ((approxPos === 1 || approxPos === 2) && Math.random() < titleRaceChance) {
    ddType = 'title';
  } else if (approxPos === 3 && Math.random() < 0.33) {
    ddType = 'promotion_playoff';
  } else if (approxPos === relegationThreshold - 1) {
    // Relegation playoff spot (e.g. 16th place)
    ddType = 'relegation_battle';
  } else if (approxPos >= relegationThreshold) {
    // Drop zone club contesting survival within catchable margin
    const gapToSafety = expectedSafetyPts - pts;
    if (gapToSafety <= 2) {
      ddType = 'relegation_battle';
    }
  }
  
  if (ddType) {
      const trailingHasBetterGd = Math.random() > 0.5;
      const clubActualGd = gf - ga;
      const gdMargin = Math.floor(Math.random() * 6) + 2;
      
      if (ddType === 'title') {
          if (approxPos === 1) {
              leaderGd = clubActualGd;
              trailerGd = trailingHasBetterGd ? clubActualGd + Math.floor(Math.random() * 4 + 1) : clubActualGd - gdMargin;
          } else {
              trailerGd = clubActualGd;
              leaderGd = trailingHasBetterGd ? clubActualGd - Math.floor(Math.random() * 4 + 1) : clubActualGd + gdMargin;
          }
      } else if (ddType === 'promotion_playoff') {
          if (approxPos <= 3) {
              leaderGd = clubActualGd;
              trailerGd = trailingHasBetterGd ? clubActualGd + Math.floor(Math.random() * 4 + 1) : clubActualGd - gdMargin;
          } else {
              trailerGd = clubActualGd;
              leaderGd = trailingHasBetterGd ? clubActualGd - Math.floor(Math.random() * 4 + 1) : clubActualGd + gdMargin;
          }
      } else { // Relegation
          if (approxPos < relegationThreshold) {
              leaderGd = clubActualGd;
              trailerGd = trailingHasBetterGd ? clubActualGd + Math.floor(Math.random() * 4 + 1) : clubActualGd - gdMargin;
          } else {
              trailerGd = clubActualGd;
              leaderGd = trailingHasBetterGd ? clubActualGd - Math.floor(Math.random() * 4 + 1) : clubActualGd + gdMargin;
          }
      }
      
      // Dynamically filter for clubs in the EXACT same country and tier (using live evolved worldClubs pool when provided)
      const activePool = (customClubsPool && customClubsPool.length > 0) ? customClubsPool : getActiveClubs();
      const normTeamCountry = normalizeCountry(team.country || 'GER');
      let potentialRivals = activePool.filter(c =>
        normalizeCountry(c.country || 'GER') === normTeamCountry &&
        c.tier === tier &&
        c.id !== team.id &&
        c.name !== team.name &&
        !((ddType === 'title' || ddType === 'promotion_playoff') && tier === 2 && isReserveClub(c.name))
      );
      if (potentialRivals.length === 0) {
          potentialRivals = activePool.filter(c => normalizeCountry(c.country || 'GER') === normTeamCountry && c.id !== team.id && c.name !== team.name);
      }
      if (potentialRivals.length > 0) {
          // Sort by ovr to pick a realistic rival for the top/bottom
          potentialRivals.sort((a,b) => (b.baseOvr || 60) - (a.baseOvr || 60));
          if (ddType === 'title' || ddType === 'promotion_playoff') {
             rivalName = potentialRivals[Math.floor(Math.random() * Math.min(3, potentialRivals.length))].name;
          } else {
             // Relegation rival must strictly come from the bottom 2 clubs in the division
             const bottomCandidates = potentialRivals.slice(Math.max(0, potentialRivals.length - 2));
             rivalName = bottomCandidates[Math.floor(Math.random() * bottomCandidates.length)]?.name || potentialRivals[potentialRivals.length - 1].name;
          }
      } else {
          rivalName = 'Rival';
      }

      // In European handball (2 pts for win, 1 for draw), a 2-point gap can only be caught if the trailing team has a superior goal difference!
      // If the trailer has a worse GD, they can mathematically only tie on points and would lose the tiebreaker, making a 2-point catchable gap impossible.
      const catchableGap = trailingHasBetterGd ? (Math.random() < 0.5 ? 2 : 1) : 1;
      if (ddType === 'relegation_battle') {
        if (approxPos >= relegationThreshold) {
          // Inside drop zone, chasing safety spot
          rivalPts = pts + catchableGap;
        } else {
          // Just above drop zone, rival is trailing by 1-2 points
          rivalPts = Math.max(0, pts - catchableGap);
        }
      } else if (ddType === 'title') {
        if (approxPos === 1) {
          // Player is leading the title race; rival must trail the player
          rivalPts = Math.max(0, pts - catchableGap);
        } else {
          // Player is chasing in 2nd place; rival must lead the player
          rivalPts = pts + catchableGap;
        }
      } else {
        // Promotion playoff: chasing promotion spot
        rivalPts = pts + catchableGap;
      }
  }

  let pointsDeducted: number | undefined = undefined;
  const played = wins + draws + losses;
  return {
    pointsDeducted,
    pos: approxPos, pts, wins, draws, losses, played, gf, ga,
    decisionDay: ddType ? { type: ddType, rivalName, rivalPts, leaderGd, trailerGd } : null
  };
}

export interface YouthProspectOptions {
  headCoachArchetype?: string;
  directorArchetype?: string;
  managerSkills?: string[];
  clubVision?: string;
  isForeignImport?: boolean;
}

export function generateYouthProspect(
  academyLevel = 1, 
  country = "GER", 
  tier = 1,
  options?: YouthProspectOptions
): YouthProspect {
  type Position = 'GK' | 'LW' | 'LB' | 'CB' | 'RB' | 'RW' | 'P';
  // Tactical positional weighting representing standard handball court composition and backcourt depth (LB, CB, RB)
  const POSITION_WEIGHTS: Record<Position, number> = {
    GK: 0.10,
    LW: 0.10,
    RW: 0.10,
    P:  0.10,
    LB: 0.20,
    CB: 0.20,
    RB: 0.20,
  };

  const getRandomPosition = (): Position => {
    const rand = Math.random();
    let cumulative = 0;
    for (const [pos, weight] of Object.entries(POSITION_WEIGHTS) as [Position, number][]) {
      cumulative += weight;
      if (rand < cumulative) {
        return pos;
      }
    }
    return 'CB';
  };

  const position = getRandomPosition();
  
  const playstyles = {
    GK: ['Shot Stopper', 'Sweeper Keeper', 'Penalty Specialist', 'Reflex Expert'],
    LW: ['Fast Break Specialist', 'Trick Shot Artist', 'Corner Specialist', 'Speedster'],
    RW: ['Fast Break Specialist', 'Trick Shot Artist', 'Corner Specialist', 'Speedster'],
    LB: ['Playmaker', 'Shooter', 'Penetrator', 'Defensive Specialist'],
    CB: ['Playmaker', 'Shooter', 'Penetrator', 'Defensive Specialist'],
    RB: ['Playmaker', 'Shooter', 'Penetrator', 'Defensive Specialist'],
    P: ['Blocker', 'Line Player', 'Offensive Pivot', 'Target Man']
  };
  
  const styles = playstyles[position];
  const playstyle = styles[Math.floor(Math.random() * styles.length)];
  
  const namesByCountry: Record<string, { first: string[], last: string[] }> = {
      GER: { first: ['Leon', 'Lukas', 'Finn', 'Elias', 'Jonas', 'Paul', 'Noah', 'Felix', 'Juri'], last: ['Weber', 'Schneider', 'Fischer', 'Hoffmann', 'Bauer', 'Wagner', 'Richter', 'Knorr', 'Köster'] },
      ESP: { first: ['Hugo', 'Mateo', 'Martin', 'Lucas', 'Leo', 'Daniel', 'Alejandro', 'Alex', 'Ian'], last: ['Garcia', 'Martinez', 'Rodriguez', 'Fernandez', 'Lopez', 'Gonzalez', 'Dujshebaev', 'Tarrafeta'] },
      FRA: { first: ['Gabriel', 'Leo', 'Raphael', 'Arthur', 'Louis', 'Jules', 'Adam', 'Elohim', 'Aymeric'], last: ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Prandi', 'Mem', 'Richardson'] },
      ITA: { first: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea'], last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano'] },
      ENG: { first: ['Oliver', 'George', 'Harry', 'Jack', 'Jacob', 'Noah', 'Charlie'], last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson'] },
      POR: { first: ['Joao', 'Martim', 'Rodrigo', 'Tiago', 'Tomas', 'Afonso', 'Francisco'], last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Areia', 'Iturriza'] },
      POL: { first: ['Antoni', 'Jan', 'Jakub', 'Aleksander', 'Szymon', 'Filip', 'Michał', 'Piotr', 'Kamil'], last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Jurecki', 'Syprzak', 'Daszek', 'Sicko'] },
      AUT: { first: ['Maximilian', 'Tobias', 'David', 'Florian', 'Sebastian', 'Felix', 'Moritz', 'Alexander', 'Lukas'], last: ['Gruber', 'Brunner', 'Pichler', 'Steiner', 'Moser', 'Mayer', 'Hofer', 'Leitner', 'Bilyk', 'Hutecek'] },
      SUI: { first: ['Noah', 'Luca', 'Leon', 'Levin', 'Matteo', 'Jan', 'Nico', 'Lenny', 'Andrin'], last: ['Müller', 'Meier', 'Schmid', 'Keller', 'Weber', 'Huber', 'Schneider', 'Zehnder', 'Rubin', 'Portner'] },
      DEN: { first: ['William', 'Noah', 'Oscar', 'Lucas', 'Victor', 'Malthe', 'Mathias', 'Simon', 'Emil'], last: ['Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Andersen', 'Gidsel', 'Pytlick', 'Lauge'] },
      SWE: { first: ['William', 'Liam', 'Noah', 'Lucas', 'Oliver', 'Hugo', 'Felix', 'Albin', 'Jim'], last: ['Johansson', 'Andersson', 'Karlsson', 'Nilsson', 'Eriksson', 'Claars', 'Gottfridsson', 'Wanne'] },
      NOR: { first: ['Jakob', 'Emil', 'Noah', 'Oliver', 'William', 'Filip', 'Sander', 'Tobias'], last: ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Sagosen', 'Grøndahl', 'Bjørnsen'] },
      ISL: { first: ['Jon', 'Sigurdur', 'Gudmundur', 'Gunnar', 'Olafur', 'Einar', 'Gisli', 'Omar'], last: ['Jonsson', 'Sigurdsson', 'Gudmundsson', 'Gunnarsson', 'Kristjansson', 'Magnusson'] },
      HUN: { first: ['Bence', 'Mate', 'Dominik', 'Levente', 'Balazs', 'Zoran', 'Gabor'], last: ['Nagy', 'Kovacs', 'Toth', 'Szabo', 'Horvath', 'Banhidi', 'Fazekas', 'Lekai'] },
      ROU: { first: ['Andrei', 'Alexandru', 'Gabriel', 'Ionut', 'Stefan'], last: ['Popa', 'Radu', 'Dumitru', 'Stoica', 'Gheorghe'] },
      SLO: { first: ['Luka', 'Mark', 'Filip', 'Jakob', 'Nik', 'Domen', 'Blaz'], last: ['Novak', 'Horvat', 'Krajnc', 'Kovac', 'Zupancic', 'Janc', 'Mackovsek', 'Bombac'] },
      MKD: { first: ['Aleksandar', 'Zoran', 'Goran', 'Nikola', 'Igor', 'Kiril', 'Filip'], last: ['Stojanovski', 'Nikolovski', 'Trajkovski', 'Petrovski', 'Lazarov', 'Taleski'] },
      CRO: { first: ['Luka', 'Ivan', 'Marko', 'David', 'Josip', 'Domagoj', 'Zvonimir', 'Tin'], last: ['Horvat', 'Kovacevic', 'Babic', 'Maric', 'Novak', 'Duvnjak', 'Cindric', 'Martinovic', 'Lucin'] },
      ARG: { first: ['Mateo', 'Thiago', 'Santiago', 'Joaquin', 'Facundo', 'Lautaro', 'Julian', 'Enzo', 'Lucas'], last: ['Fernandez', 'Rodriguez', 'Simon', 'Varela', 'Baronetto', 'Pizarro', 'Moscariello', 'Carou'] },
      BRA: { first: ['Gabriel', 'Lucas', 'Matheus', 'Felipe', 'Thiago', 'Leonardo', 'Vinicius', 'Haniel'], last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Toledo', 'Langaro', 'Petrus', 'Chiuffa'] },
      COL: { first: ['Alejandro', 'Sebastian', 'Santiago', 'Daniel', 'Camilo', 'Nicolas'], last: ['Rodriguez', 'Gomez', 'Restrepo', 'Morales', 'Valencia', 'Zapata'] },
      URU: { first: ['Facundo', 'Santiago', 'Mateo', 'Agustin', 'Rodrigo', 'Bruno'], last: ['Rodriguez', 'Gonzalez', 'Velazco', 'Cancio', 'Morandeira', 'Chaparro'] },
  };
  const normCountry = normalizeCountry(country || 'GER');
  const isForeignImport = Boolean(options?.isForeignImport && academyLevel >= 4);
  const foreignPool = ['DEN', 'FRA', 'ESP', 'SWE', 'NOR', 'CRO', 'ISL', 'HUN', 'GER', 'POR', 'SLO'].filter(c => c !== normCountry);
  const effectiveCountry = isForeignImport ? (foreignPool[Math.floor(Math.random() * foreignPool.length)] || 'DEN') : normCountry;
  const list = namesByCountry[effectiveCountry] || namesByCountry['GER'];
  const name = `${list.first[Math.floor(Math.random() * list.first.length)]} ${list.last[Math.floor(Math.random() * list.last.length)]}`;
  
  // Teenager age between 15 and 17
  const age = Math.floor(Math.random() * 3) + 15;
  
  // Base maturation timer: 1 to 3 seasons based on age
  // 17yo: 1 season, 16yo: 1-2 seasons, 15yo: 2-3 seasons
  let timer = age === 17 ? 1 : age === 16 ? (Math.random() < 0.5 ? 1 : 2) : (Math.random() < 0.4 ? 2 : 3);
  
  // Head Coach Archetype: Youth Developer, Scout, or Continental Legend traits grant accelerated maturation chance
  const coachArchetype = options?.headCoachArchetype || '';
  const hasYouthCoach = coachArchetype === 'Youth Developer' || 
                        coachArchetype === 'Scout' || 
                        coachArchetype === 'Continental Legend' ||
                        (options?.managerSkills || []).includes('talentscout');
  if (hasYouthCoach && timer > 1 && Math.random() < 0.40) {
    timer -= 1;
  }

  // Quality roll influences:
  // 1. Academy facility level: progressive scaling for premier facilities (Level 3-5)
  // Level 1: 5, Level 2: 12, Level 3: 25, Level 4: 32 (-20%), Level 5: 40 (-20%)
  const academyBonus = academyLevel >= 5 ? 40 : academyLevel >= 4 ? 32 : academyLevel >= 3 ? 25 : (academyLevel === 2 ? 12 : 5);
  
  // 2. Head coach archetype: +10 quality bonus
  const coachBonus = hasYouthCoach ? 10 : 0;
  
  // 3. Director archetype: Scout / Youth Developer
  const directorArchetype = options?.directorArchetype || '';
  const isScoutDirector = directorArchetype === 'Scout / Youth Developer';
  const directorBonus = isScoutDirector ? 8 : 0;

  // 4. Club Vision: Youth Academy Focus (+12 quality bonus)
  const visionBonus = options?.clubVision === 'Youth Academy Focus' ? 12 : 0;

  // Roll: 1 to 60 + bonuses
  const baseRoll = Math.floor(Math.random() * 60) + 1;
  const totalScore = baseRoll + academyBonus + coachBonus + directorBonus + visionBonus;

  let type: 'local' | 'top_prospect' | 'generational' = 'local';
  let boost = 1;

  // Generational Wonderkid: Rare prodigy (+3 OVR potential)
  // Raised threshold 80 (with Scout Director) and 85 (without) so generational talents are rare once-in-a-decade gems
  const wonderkidThreshold = isScoutDirector ? 80 : 85;
  if (totalScore >= wonderkidThreshold) {
    type = 'generational';
    boost = 3;
  } 
  // Top Prospect: High-ceiling talent (+2 OVR potential)
  else if (totalScore >= 48) {
    type = 'top_prospect';
    boost = 2;
  } 
  // Local Prospect: Solid domestic player (+1 OVR potential)
  else {
    type = 'local';
    boost = 1;
  }

  return { 
    id: Math.random().toString(36).substring(2, 9), 
    name, 
    age, 
    position, 
    playstyle, 
    type, 
    tierType: type,
    boost, 
    timer,
    nationality: effectiveCountry,
    isForeignImport
  };
}

export interface ProcessAgingOptions {
  userClubId?: string | number;
  userClubOvr?: number;
  userTier?: number;
  userCountry?: string;
  userWonLeague?: boolean;
  championClubIds?: (string | number)[];
  consecutiveTitles?: number;
  currentYear?: number;
}

export function processAging(
  teams: Club[], 
  userClubIdOrOptions?: string | number | ProcessAgingOptions,
  optionsArg?: ProcessAgingOptions
): Club[] {
  let userClubId: string | number | undefined = undefined;
  let options: ProcessAgingOptions | undefined = undefined;

  if (typeof userClubIdOrOptions === 'object' && userClubIdOrOptions !== null) {
    options = userClubIdOrOptions;
    userClubId = options.userClubId;
  } else if (typeof userClubIdOrOptions === 'string' || typeof userClubIdOrOptions === 'number') {
    userClubId = userClubIdOrOptions;
    options = optionsArg;
  } else {
    options = optionsArg;
  }

  const isUserMatch = (c: Club | { id?: number | string }) => 
    userClubId !== undefined && (String(c.id) === String(userClubId) || Number(c.id) === Number(userClubId));

  const userClub = teams.find(isUserMatch);
  const userOvr = options?.userClubOvr ?? (userClub ? userClub.baseOvr : 0);
  const userTier = options?.userTier ?? (userClub ? userClub.tier : 1);
  const userCountry = options?.userCountry ?? normalizeCountry(userClub?.country || 'GER');

  const isGiantClub = (t: Club): boolean => {
    return Boolean(
      (t.fanBase && t.fanBase > 180000) || 
      [
        'SC Magdeburg', 'THW Kiel', 'SG Flensburg-Handewitt', 'Füchse Berlin', 
        'Paris Saint-Germain', 'Barça', 'Telekom Veszprém', 'Veszprém KC', 
        'Industria Kielce', 'Aalborg Håndbold', 'Sporting CP', 'HBC Nantes', 
        'Montpellier HB', 'ORLEN Wisła Płock', 'OTP Bank - Pick Szeged'
      ].includes(t.name)
    );
  };

  const poachedGainsByLeague: Map<string, number> = new Map();

  const agedTeams: Club[] = teams.map(t => {
    const isUserManaged = isUserMatch(t);
    let ovrChange = 0;
    
    // Determine the expected OVR for this team's tier
    const tier = t.tier || 5;
    let targetOvr = 45;
    if (tier === 1) targetOvr = 81;
    else if (tier === 2) targetOvr = 71;
    else if (tier === 3) targetOvr = 64;
    else if (tier === 4) targetOvr = 56;
    else if (tier === 5) targetOvr = 48;
    else if (tier >= 6) targetOvr = 40;

    const r = Math.random();
    const isHeritageClub = isGiantClub(t);
    
    // Multi-Season Golden Generation / Cinderella Surge handling
    let remainingSurgeYears = t.goldenGenYearsRemaining || 0;
    let isCinderella = Boolean(t.isCinderellaActive);

    // Champions Hangover: If a Nemesis club won the title/beat the user, remove artificial boost the following year
    let nemesisActive = t.isNemesisActive;
    if (nemesisActive && !isUserManaged) {
      const wasChamp = t.wasNemesisChampion || (options?.userWonLeague === false && t.tier === userTier && normalizeCountry(t.country || 'GER') === userCountry);
      if (wasChamp) {
        ovrChange -= (Math.floor(Math.random() * 3) + 2); // -2 to -4 OVR Champions Hangover
        nemesisActive = false;
      }
    }

    let alreadyProcessed = false;

    if (!isUserManaged && (remainingSurgeYears > 0 || isCinderella)) {
      alreadyProcessed = true;
      if (remainingSurgeYears >= 2) {
        remainingSurgeYears -= 1;
        ovrChange = Math.floor(Math.random() * 2) + 2; // +2 to +3
        isCinderella = true;
      } else {
        // 'Food Chain' Poaching Mechanic:
        // Mid-tier Cinderella club overperformed, top talent gets poached by the Giants the following season
        // Cinderella loses -2 to -4 OVR (talent drained)
        const talentDrain = Math.floor(Math.random() * 3) + 2; // -2 to -4
        ovrChange = -talentDrain;
        isCinderella = false;
        remainingSurgeYears = 0;

        // Register a poaching talent injection for a Giant in the same league
        const leagueKey = `${normalizeCountry(t.country || 'GER')}-${t.tier || 1}`;
        poachedGainsByLeague.set(leagueKey, (poachedGainsByLeague.get(leagueKey) || 0) + 1);
      }
    } else if (!isUserManaged && !alreadyProcessed && !isHeritageClub && !isReserveClub(t.name) && ((tier >= 2 && tier <= 5 && t.baseOvr < 82) || (tier === 1 && t.baseOvr < 84)) && r < 0.028) {
      // Initiate new Cinderella / Golden Generation story (including Tier 1 dark-horse challengers)
      remainingSurgeYears = Math.floor(Math.random() * 2) + 3;
      isCinderella = true;
      ovrChange = tier === 1 ? (Math.floor(Math.random() * 3) + 3) : (Math.floor(Math.random() * 4) + 4); // +3 to +5 in Tier 1, +4 to +7 in lower tiers
    } else if (!isUserManaged && !alreadyProcessed && r < 0.008 && t.baseOvr > 65 && !isHeritageClub && !isReserveClub(t.name)) {
      // Catastrophic collapse
      ovrChange = -(Math.floor(Math.random() * 6) + 4);
    } else {
      if (isUserManaged) {
        // User club: organic small fluctuation without CPU safety nets or anchor rebounds
        ovrChange = Math.random() < 0.2 ? 1 : (Math.random() < 0.2 ? -1 : 0);
      } else if (isHeritageClub) {
        // Heritage powerhouse (e.g. Kiel, Magdeburg, Barca, PSG):
        // Anchored to authentic peak range 88-92
        if (t.baseOvr >= 94) {
          // Severe dynasty cycle turnover: veteran stars age, transition year
          ovrChange = -(Math.floor(Math.random() * 2) + 2); // -2 to -3
        } else if (t.baseOvr >= 92) {
          // Natural roster aging pressure
          ovrChange = Math.random() < 0.5 ? -1 : (Math.random() < 0.15 ? -2 : 0);
        } else if (t.baseOvr < 85 && tier === 1) {
          // Rebound from crisis back towards heritage baseline
          ovrChange = Math.floor(Math.random() * 2) + 1; // +1 to +2
        } else if (t.baseOvr < 88) {
          ovrChange = Math.random() < 0.35 ? 1 : (Math.random() < 0.2 ? -1 : 0);
        } else {
          ovrChange = Math.random() < 0.2 ? 1 : (Math.random() < 0.25 ? -1 : 0);
        }
      } else {
        // Standard AI clubs: strongly anchored to league tier target
        if (t.baseOvr >= 92) {
          // Exceptional Cinderella run ending, regression to mean
          ovrChange = -(Math.floor(Math.random() * 2) + 2); // -2 to -3
        } else if (t.baseOvr > targetOvr + 5) {
          ovrChange = Math.random() < 0.55 ? -1 : (Math.random() < 0.2 ? -2 : 0);
        } else if (t.baseOvr > targetOvr + 2) {
          ovrChange = Math.random() < 0.38 ? -1 : (Math.random() < 0.12 ? 1 : 0);
        } else if (t.baseOvr < targetOvr - 5) {
          ovrChange = Math.random() < 0.45 ? 1 : 0;
        } else if (t.baseOvr < targetOvr - 2) {
          ovrChange = Math.random() < 0.3 ? 1 : (Math.random() < 0.15 ? -1 : 0);
        } else {
          ovrChange = Math.random() < 0.15 ? 1 : (Math.random() < 0.15 ? -1 : 0);
        }
      }
    }

    // Additional generational turnover for any AI club exceeding 92 OVR
    if (!isUserManaged && t.baseOvr >= 93 && Math.random() < 0.35) {
      ovrChange -= 1;
    }

    const maxCap = isUserManaged ? 100 : 94;
    const finalOvr = Math.max(25, Math.min(maxCap, t.baseOvr + ovrChange));

    // Organic AI Facility Progression (Academy & Medical Center) for Top Clubs
    let nextAcademy = t.academyLevel || 1;
    let nextMedical = t.medicalLevel || 1;
    if (!isUserManaged && !isReserveClub(t.name)) {
      const isTopClub = isHeritageClub || (tier === 1 && finalOvr >= 78);
      const isEliteGiant = isHeritageClub || (tier === 1 && finalOvr >= 84);
      const facilityCeiling = isEliteGiant ? 3 : isTopClub ? 3 : ((tier === 1 && finalOvr >= 72) || (tier === 2 && finalOvr >= 74)) ? 2 : 1;
      const upgradeChance = isEliteGiant ? 0.40 : isTopClub ? 0.28 : 0.18;

      if (nextAcademy < facilityCeiling && Math.random() < upgradeChance) {
        nextAcademy += 1;
      }
      if (nextMedical < facilityCeiling && Math.random() < upgradeChance) {
        nextMedical += 1;
      }

      const seasonsElapsed = options?.currentYear ? Math.max(0, options.currentYear - 2024) : 0;
      if (seasonsElapsed >= 4 && isTopClub) {
        nextAcademy = Math.max(2, nextAcademy);
        nextMedical = Math.max(2, nextMedical);
        if (isEliteGiant && nextAcademy === 2 && nextMedical === 2) {
          const idSeed = typeof t.id === 'number' ? t.id : String(t.name || '').length;
          if (idSeed % 3 === 0) {
            nextAcademy = 3;
            nextMedical = 3;
          } else if (idSeed % 2 === 0) {
            nextAcademy = 3;
          } else {
            nextMedical = 3;
          }
        }
      }
    }

    return {
      ...t,
      baseOvr: finalOvr,
      ...(nextAcademy > 1 || t.academyLevel ? { academyLevel: nextAcademy } : {}),
      ...(nextMedical > 1 || t.medicalLevel ? { medicalLevel: nextMedical } : {}),
      goldenGenYearsRemaining: remainingSurgeYears > 0 ? remainingSurgeYears : undefined,
      isCinderellaActive: isCinderella || undefined,
      isNemesisActive: nemesisActive || undefined,
      wasNemesisChampion: nemesisActive ? t.wasNemesisChampion : undefined
    };
  });

  // Pass 2: Distribute poached Cinderella talent gains to Giants in the same league
  poachedGainsByLeague.forEach((gain, leagueKey) => {
    const [country, tierStr] = leagueKey.split('-');
    const tierNum = parseInt(tierStr, 10);
    const candidateGiants = agedTeams.filter(c => 
      !isUserMatch(c) && 
      !isReserveClub(c.name) && 
      isGiantClub(c) && 
      c.tier === tierNum && 
      normalizeCountry(c.country || 'GER') === country &&
      c.baseOvr < 92
    );
    const targetGiants = candidateGiants.length > 0 ? candidateGiants : agedTeams.filter(c => 
      !isUserMatch(c) && 
      !isReserveClub(c.name) && 
      isGiantClub(c) && 
      c.tier === 1 && 
      normalizeCountry(c.country || 'GER') === country &&
      c.baseOvr < 92
    );
    if (targetGiants.length > 0) {
      const luckyGiant = targetGiants[Math.floor(Math.random() * targetGiants.length)];
      luckyGiant.baseOvr = Math.min(92, luckyGiant.baseOvr + Math.min(1, gain));
    }
  });

  // Pass 3: The 'Mortal' Nemesis / Hostile Rival Takeover
  // Triggers when the user is dominating Tier 1, OR organically (22% chance/season) as an ambitious investor consortium backs a challenger
  const isDominantDynasty = userTier === 1 && ((options?.consecutiveTitles || 0) >= 2 || (userOvr >= 91 && options?.userWonLeague === true));
  if (isDominantDynasty) {
    const existingNemesis = agedTeams.find(t =>
      !isUserMatch(t) &&
      !isReserveClub(t.name) &&
      t.tier === userTier &&
      normalizeCountry(t.country || 'GER') === userCountry &&
      Boolean(t.isNemesisActive)
    );
    const rivalCandidates = existingNemesis
      ? (existingNemesis.baseOvr < 92 ? [existingNemesis] : [])
      : agedTeams.filter(t => 
          !isUserMatch(t) && 
          !isReserveClub(t.name) && 
          t.tier === userTier && 
          normalizeCountry(t.country || 'GER') === userCountry &&
          t.baseOvr < 92
        );
    if (rivalCandidates.length > 0) {
      rivalCandidates.sort((a, b) => (b.baseOvr || 0) - (a.baseOvr || 0));
      const nemesis = rivalCandidates[0];
      const armsRaceBoost = Math.floor(Math.random() * 2) + 1; // +1 to +2 OVR
      nemesis.baseOvr = Math.min(93, nemesis.baseOvr + armsRaceBoost);
      nemesis.isNemesisActive = true;
    }
  } else if (Math.random() < 0.22) {
    // Organic Investor Takeover: an ambitious upper-mid Tier 1 challenger launches a title push
    const organicChallengers = agedTeams.filter(t =>
      !isUserMatch(t) &&
      !isReserveClub(t.name) &&
      !isGiantClub(t) &&
      !t.isNemesisActive &&
      t.tier === 1 &&
      t.baseOvr >= 78 &&
      t.baseOvr <= 88 &&
      normalizeCountry(t.country || 'GER') === userCountry
    );
    if (organicChallengers.length > 0) {
      const chosen = organicChallengers[Math.floor(Math.random() * organicChallengers.length)];
      chosen.baseOvr = Math.min(92, chosen.baseOvr + (Math.floor(Math.random() * 2) + 2)); // +2 to +3 OVR
      chosen.isNemesisActive = true;
    }
  }

  return agedTeams;
}

export function getLeagueSize(
  tier: number = 1, 
  country: string = 'GER', 
  _userClubId?: string | number, 
  _userClubTier?: number, 
  _userClubCountry?: string, 
  clubsDb?: Club[]
): number {
    const normCountry = normalizeCountry(country);
    const activeClubs = getActiveClubs(normCountry);
    const dbToUse = (clubsDb && clubsDb.length > 0) ? clubsDb : (activeClubs.length > 0 ? activeClubs : CLUBS);
    const count = dbToUse.filter(c => c.tier === tier && normalizeCountry(c.country || 'GER') === normCountry).length;
    if (count > 0) return count;
    // Default handball league sizes by tier
    if (normCountry === 'GER') return tier <= 2 ? 18 : 14;
    if (['FRA', 'ESP', 'CRO'].includes(normCountry)) return tier === 1 ? 16 : 14;
    if (['DEN', 'POL', 'HUN', 'SWE', 'NOR'].includes(normCountry)) return tier === 1 ? 14 : 12;
    return 12;
}
