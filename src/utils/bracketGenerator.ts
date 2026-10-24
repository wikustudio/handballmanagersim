import { Club, TournamentBracket } from '../types';
import { isReserveClub, normalizeCountry } from '../data/gameConstants';
import { getActiveClubs } from './modManager';

function simulateAiMatch(
  teamA: { name: string; baseOvr: number },
  teamB: { name: string; baseOvr: number }
): { winner: { name: string; baseOvr: number }; loser: { name: string; baseOvr: number } } {
  const diff = teamA.baseOvr - teamB.baseOvr;
  const probA = Math.max(0.15, Math.min(0.85, 0.5 + diff * 0.025));
  const winA = Math.random() < probA;
  return winA ? { winner: teamA, loser: teamB } : { winner: teamB, loser: teamA };
}

/**
 * Generates an authentic, strictly deduplicated 8-club tournament bracket for the domestic cup.
 * Guarantee: Opp1 is faced in QF, SF winner is faced in SF, and other-half SF winner is faced in Final.
 * No team can EVER be faced more than once in the same competition.
 */
export function generateDomesticCupTournament(
  userClub: Club,
  year: number,
  cupName: string,
  isAmateur: boolean,
  clubsDb: Club[] = getActiveClubs(userClub?.country)
): TournamentBracket {
  const country = normalizeCountry(userClub.country || 'GER');
  
  // 1. Filter eligible clubs in user's country
  let eligible = clubsDb.filter(c => 
    normalizeCountry(c.country || 'GER') === country &&
    c.name !== userClub.name &&
    !isReserveClub(c.name) &&
    (isAmateur ? c.tier > 1 : c.tier <= 2)
  );

  // Fallbacks if division has few clubs (e.g. AUT, SUI, or low-tier)
  if (eligible.length < 7 && !isAmateur) {
    eligible = clubsDb.filter(c => 
      normalizeCountry(c.country || 'GER') === country &&
      c.name !== userClub.name &&
      !isReserveClub(c.name)
    );
  }
  if (eligible.length < 7) {
    eligible = clubsDb.filter(c => 
      c.name !== userClub.name &&
      !isReserveClub(c.name)
    );
  }

  // Shuffle candidate clubs with priority for high OVR in Tier 1/2, deduplicated by club name
  const seenDomNames = new Set<string>([userClub.name]);
  const dedupedEligible = eligible.filter(c => {
    if (!c.name || seenDomNames.has(c.name)) return false;
    seenDomNames.add(c.name);
    return true;
  });
  const sorted = [...dedupedEligible].sort((a, b) => b.baseOvr - a.baseOvr);
  // Take a competitive pool of top clubs and shuffle to pick 7 unique opponents
  const candidatePool = sorted.slice(0, Math.max(7, Math.min(sorted.length, 14)));
  const shuffled = candidatePool.sort(() => 0.5 - Math.random());
  
  // Distinct 7 opponents
  const pickedOpponents = shuffled.slice(0, 7).map(c => ({ name: c.name, baseOvr: c.baseOvr }));
  
  // If still fewer than 7 (extremely degenerate database state), pad with named regional challengers
  const existingNames = new Set([userClub.name, ...pickedOpponents.map(p => p.name)]);
  let padIndex = 1;
  while (pickedOpponents.length < 7) {
    const padName = `Cup Challenger ${padIndex++}`;
    if (!existingNames.has(padName)) {
      existingNames.add(padName);
      pickedOpponents.push({ name: padName, baseOvr: isAmateur ? 56 : 76 });
    }
  }

  // Bracket Structure:
  // QF1: userClub vs opp1 (qfOpponent)
  // QF2: opp2 vs opp3 -> winner advances to SF1 against userClub
  // QF3: opp4 vs opp5 -> winner advances to SF2
  // QF4: opp6 vs opp7 -> winner advances to SF2
  // SF1: userClub vs winner(QF2) (sfOpponent)
  // SF2: winner(QF3) vs winner(QF4) -> winner advances to Final against userClub
  // Final: userClub vs winner(SF2) (finalOpponent)

  const opp1 = pickedOpponents[0]; // QF Opponent
  const opp2 = pickedOpponents[1];
  const opp3 = pickedOpponents[2];
  const opp4 = pickedOpponents[3];
  const opp5 = pickedOpponents[4];
  const opp6 = pickedOpponents[5];
  const opp7 = pickedOpponents[6];

  const qf2 = simulateAiMatch(opp2, opp3);
  const qf3 = simulateAiMatch(opp4, opp5);
  const qf4 = simulateAiMatch(opp6, opp7);

  const sfOpponent = qf2.winner; // Faces user in Semi-Final
  const sf2 = simulateAiMatch(qf3.winner, qf4.winner);
  const finalOpponent = sf2.winner; // Faces user in Final

  const eliminatedClubs = [
    qf2.loser.name,
    qf3.loser.name,
    qf4.loser.name,
    sf2.loser.name
  ];

  return {
    year,
    cupName,
    isAmateur,
    isEuro: false,
    qfOpponent: opp1.name,
    sfOpponent: sfOpponent.name,
    finalOpponent: finalOpponent.name,
    qfOpponentOvr: opp1.baseOvr,
    sfOpponentOvr: sfOpponent.baseOvr,
    finalOpponentOvr: finalOpponent.baseOvr,
    allTournamentClubs: [userClub.name, ...pickedOpponents.map(o => o.name)],
    eliminatedClubs
  };
}

/**
 * Generates an authentic, strictly deduplicated 8-club tournament bracket for European competition.
 */
export function generateEuroCupTournament(
  userClub: Club,
  year: number,
  euroStatus: string,
  cupName: string,
  clubsDb: Club[] = getActiveClubs(userClub?.country)
): TournamentBracket {
  const euroKey = euroStatus.toUpperCase();
  const isCl = euroKey === 'CL';
  const isEl = euroKey === 'EL';
  const country = normalizeCountry(userClub.country || 'GER');

  // Strict Tier 1 Exclusivity: European competitions are restricted to top-flight (Tier 1) clubs.
  // In the EHF European League, a Tier 2 club has an authentic 0.05% (0.0005) miracle chance to appear.
  const allowTier2Miracle = isEl && Math.random() < 0.0005;
  const isTierEligible = (c: Club) => (c.tier === 1) || (allowTier2Miracle && c.tier === 2);

  let eligible = clubsDb.filter(c => 
    c.name !== userClub.name &&
    !isReserveClub(c.name) &&
    isTierEligible(c) &&
    (isCl ? c.baseOvr >= 82 : isEl ? c.baseOvr >= 74 && c.baseOvr <= 85 : c.baseOvr >= 65 && c.baseOvr <= 78) &&
    (normalizeCountry(c.country || 'GER') !== country || clubsDb.filter(x => normalizeCountry(x.country || 'GER') !== country && isTierEligible(x)).length < 7)
  );

  if (eligible.length < 7) {
    eligible = clubsDb.filter(c => 
      c.name !== userClub.name &&
      !isReserveClub(c.name) &&
      isTierEligible(c) &&
      (normalizeCountry(c.country || 'GER') !== country || clubsDb.filter(x => normalizeCountry(x.country || 'GER') !== country && isTierEligible(x)).length < 7)
    );
  }
  if (eligible.length < 7) {
    eligible = clubsDb.filter(c => c.name !== userClub.name && !isReserveClub(c.name) && isTierEligible(c));
  }

  const seenEuroNames = new Set<string>([userClub.name]);
  const dedupedEligible = eligible.filter(c => {
    if (!c.name || seenEuroNames.has(c.name)) return false;
    seenEuroNames.add(c.name);
    return true;
  });
  const sorted = [...dedupedEligible].sort((a, b) => b.baseOvr - a.baseOvr);
  const candidatePool = sorted.slice(0, Math.max(7, Math.min(sorted.length, 14)));
  const shuffled = candidatePool.sort(() => 0.5 - Math.random());
  const pickedOpponents = shuffled.slice(0, 7).map(c => ({ name: c.name, baseOvr: c.baseOvr }));

  const existingNames = new Set([userClub.name, ...pickedOpponents.map(p => p.name)]);
  let padIndex = 1;
  while (pickedOpponents.length < 7) {
    const padName = `European Challenger ${padIndex++}`;
    if (!existingNames.has(padName)) {
      existingNames.add(padName);
      pickedOpponents.push({ name: padName, baseOvr: isCl ? 85 : isEl ? 79 : 72 });
    }
  }

  const opp1 = pickedOpponents[0];
  const opp2 = pickedOpponents[1];
  const opp3 = pickedOpponents[2];
  const opp4 = pickedOpponents[3];
  const opp5 = pickedOpponents[4];
  const opp6 = pickedOpponents[5];
  const opp7 = pickedOpponents[6];

  const qf2 = simulateAiMatch(opp2, opp3);
  const qf3 = simulateAiMatch(opp4, opp5);
  const qf4 = simulateAiMatch(opp6, opp7);

  const sfOpponent = qf2.winner;
  const sf2 = simulateAiMatch(qf3.winner, qf4.winner);
  const finalOpponent = sf2.winner;

  const eliminatedClubs = [
    qf2.loser.name,
    qf3.loser.name,
    qf4.loser.name,
    sf2.loser.name
  ];

  return {
    year,
    cupName,
    isAmateur: false,
    isEuro: true,
    qfOpponent: opp1.name,
    sfOpponent: sfOpponent.name,
    finalOpponent: finalOpponent.name,
    qfOpponentOvr: opp1.baseOvr,
    sfOpponentOvr: sfOpponent.baseOvr,
    finalOpponentOvr: finalOpponent.baseOvr,
    allTournamentClubs: [userClub.name, ...pickedOpponents.map(o => o.name)],
    eliminatedClubs
  };
}
