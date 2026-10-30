import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameState, Language, Club } from '../types';
import { t as tr } from '../data/translations';
import { ALL_CLUBS } from '../data/clubsData';
import { ClubLogo } from './ClubLogo';
import { isReserveClub, formatMoney, getLeagueScaledVal } from '../data/gameConstants';

interface Props {
  state: GameState;
  lang: Language;
  clubsDb?: Club[];
  isModActive?: boolean;
  onClose: (won: boolean) => void;
  onTournamentStart?: () => void;
  onTournamentVictory?: (prizeMoney: number, cohortBoost: number) => void;
}

interface YouthTeam {
  id: number;
  name: string;
  baseName: string;
  ovr: number;
  color?: string;
  logo?: string;
  fallbackLogo?: string;
  isPlayer: boolean;
  country: string;
}

interface YouthMatch {
  t1: YouthTeam;
  t2: YouthTeam;
  t1Score: number;
  t2Score: number;
  t1PenScore?: number;
  t2PenScore?: number;
  isPenalties?: boolean;
  winner: YouthTeam;
  locationText: string;
  dramaText?: string;
  att: number;
}

// Expanded dictionary to capture base game + global mod database countries
const COUNTRY_EMOJIS: Record<string, string> = {
  GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ITA: '🇮🇹', ESP: '🇪🇸', FRA: '🇫🇷',
  USA: '🇺🇸', BRA: '🇧🇷', ARG: '🇦🇷', JPN: '🇯🇵', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  POR: '🇵🇹', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', POL: '🇵🇱', AUT: '🇦🇹', SUI: '🇨🇭',
  AUS: '🇦🇺', COL: '🇨🇴', MEX: '🇲🇽', ECU: '🇪🇨', CAN: '🇨🇦',
  IDN: '🇮🇩', IND: '🇮🇳', KOR: '🇰🇷', KSA: '🇸🇦', RSA: '🇿🇦',
  NGA: '🇳🇬', TUR: '🇹🇷', NED: '🇳🇱', DEN: '🇩🇰', NOR: '🇳🇴', 
  SWE: '🇸🇪', CRO: '🇭🇷', GRE: '🇬🇷', SVK: '🇸🇰', PER: '🇵🇪', 
  BOL: '🇧🇴', PAR: '🇵🇾', CHI: '🇨🇱'
};

// Authentic FIFA penalty shootout simulator (Best-of-5 with early mathematical elimination check + sudden death)
const simulateFifaShootout = (t1Advantage: number = 0): { t1Pens: number; t2Pens: number; t1Wins: boolean } => {
  const clampedAdv = Math.max(-4, Math.min(4, t1Advantage));
  const p1Prob = Math.max(0.67, Math.min(0.83, 0.75 + clampedAdv * 0.015));
  const p2Prob = Math.max(0.67, Math.min(0.83, 0.75 - clampedAdv * 0.015));

  let s1 = 0;
  let s2 = 0;

  // Best of 5 kicks
  for (let round = 1; round <= 5; round++) {
    // Team 1 takes kick
    if (Math.random() < p1Prob) s1++;
    const rem2After1 = 5 - (round - 1);
    const rem1After1 = 5 - round;
    if (s1 > s2 + rem2After1) {
      return { t1Pens: s1, t2Pens: s2, t1Wins: true };
    }
    if (s2 > s1 + rem1After1) {
      return { t1Pens: s1, t2Pens: s2, t1Wins: false };
    }

    // Team 2 takes kick
    if (Math.random() < p2Prob) s2++;
    const rem1After2 = 5 - round;
    const rem2After2 = 5 - round;
    if (s1 > s2 + rem2After2) {
      return { t1Pens: s1, t2Pens: s2, t1Wins: true };
    }
    if (s2 > s1 + rem1After2) {
      return { t1Pens: s1, t2Pens: s2, t1Wins: false };
    }
  }

  // Sudden death if tied after 5 kicks
  for (let sd = 6; sd <= 12; sd++) {
    const k1 = Math.random() < p1Prob;
    const k2 = Math.random() < p2Prob;
    if (k1) s1++;
    if (k2) s2++;
    if (s1 !== s2) {
      return { t1Pens: s1, t2Pens: s2, t1Wins: s1 > s2 };
    }
  }

  // Decisive tiebreak fallback if still tied after 12 rounds
  s1++;
  return { t1Pens: s1, t2Pens: s2, t1Wins: true };
};

export const YouthChampionshipModal: React.FC<Props> = ({ state, lang, clubsDb, isModActive, onClose, onTournamentStart, onTournamentVictory }) => {
  const t = (en: string, de?: string) => tr(lang, en, de);

  const [phase, setPhase] = useState<'intro' | 'qf' | 'sf' | 'final' | 'result'>('intro');
  const [matches, setMatches] = useState<YouthMatch[]>([]);
  const [teams, setTeams] = useState<YouthTeam[]>([]);
  const [tournamentWon, setTournamentWon] = useState<boolean>(false);
  const [reachedFinal, setReachedFinal] = useState<boolean>(false);
  const rewardsClaimedRef = React.useRef(false);

  // Scaled tournament prize purse (250k baseline in Tier 1 -> 125k in USA at 0.50x)
  const prizeMoney = getLeagueScaledVal(state.club.tier || 1, 250, state.club.country || 'GER');
  const academyLvl = Math.max(1, Math.min(5, state.club.academyLevel || 1));
  const facilityBonus = (academyLvl - 1) * 6;

  const claimRewardsIfNeeded = (won: boolean) => {
    if (won && !rewardsClaimedRef.current && onTournamentVictory) {
      rewardsClaimedRef.current = true;
      onTournamentVictory(prizeMoney, 2);
    }
  };

  useEffect(() => {
    // Only initialize tournament bracket once to prevent bracket scramble during tournament play
    if (teams.length > 0) return;

    // Dynamic database resolution: Respect user choice (custom mod, community mod, or default clubs)
    const activeDb = (clubsDb && clubsDb.length > 0) ? clubsDb : ALL_CLUBS;

    // Calculate player's U19 OVR: Higher level of youth academy = higher chance of winning the youth title
    const avgProspectBoost = state.youthPipeline && state.youthPipeline.length > 0
      ? state.youthPipeline.reduce((sum, p) => sum + (p.boost || 1), 0) / state.youthPipeline.length
      : 1;
    const talentBonus = Math.round(avgProspectBoost * 2.5);
    
    // Level 1: ~55-58 OVR (Underdogs)
    // Level 2: ~61-64 OVR
    // Level 3: ~67-70 OVR (Competitive)
    // Level 4: ~73-76 OVR
    // Level 5: ~79-85 OVR (Elite tournament contenders)
    const finalPlayerOvr = Math.max(48, Math.min(86, 52 + facilityBonus + Math.max(-4, Math.min(10, talentBonus))));

    const countryStr = state.club.country || 'GER';
    const playerTeam: YouthTeam = { 
      id: state.club.id, 
      name: `${state.club.name} U19`, 
      baseName: state.club.name,
      ovr: finalPlayerOvr, 
      color: state.club.color,
      logo: state.club.logo,
      fallbackLogo: state.club.fallbackLogo,
      isPlayer: true,
      country: countryStr,
    };

    // Filter available clubs from the user's active database (excluding player club & reserve squads)
    const isPlayerClub = (c: Club) => 
      c.id === state.club.id || 
      String(c.id) === String(state.club.id) ||
      c.name.toLowerCase().trim() === state.club.name.toLowerCase().trim();

    const candidateClubs = activeDb.filter(c => 
      !isPlayerClub(c) && 
      !isReserveClub(c.name) &&
      (c.country || 'GER') === countryStr
    );

    // Prioritize tier 1 clubs, shuffled randomly so each season is different
    const tier1Candidates = candidateClubs
      .filter(c => c.tier === 1)
      .sort(() => Math.random() - 0.5);

    const selectedClubs: Club[] = [];
    const usedIds = new Set<number>([state.club.id]);

    for (const c of tier1Candidates) {
      if (selectedClubs.length >= 7) break;
      if (!usedIds.has(c.id)) {
        selectedClubs.push(c);
        usedIds.add(c.id);
      }
    }

    // If fewer than 7 tier 1 clubs, backfill with tier 2 or lower from the same country
    if (selectedClubs.length < 7) {
      const lowerTierCandidates = candidateClubs
        .filter(c => c.tier > 1 && !usedIds.has(c.id))
        .sort(() => Math.random() - 0.5);

      for (const c of lowerTierCandidates) {
        if (selectedClubs.length >= 7) break;
        selectedClubs.push(c);
        usedIds.add(c.id);
      }
    }

    // Ultimate fallback if country has very few total clubs: pick from active database
    if (selectedClubs.length < 7) {
      const generalFallback = activeDb
        .filter(c => !usedIds.has(c.id) && !isReserveClub(c.name))
        .sort(() => Math.random() - 0.5);

      for (const c of generalFallback) {
        if (selectedClubs.length >= 7) break;
        selectedClubs.push(c);
        usedIds.add(c.id);
      }
    }

    // Normalize the 7 qualified AI academies onto the National U19 Elite 8 scale (58-85 OVR)
    // so clubs in all leagues (e.g. India, USA, Germany) field authentic top-flight youth academies
    // and Level 4-5 player academies face genuine powerhouse rivals in the Semi-Finals and Final.
    const sortedAiClubs = [...selectedClubs].sort((a, b) => (b.baseOvr || 65) - (a.baseOvr || 65));
    const maxAiClubOvr = Math.max(62, ...sortedAiClubs.map(c => c.baseOvr || 65));

    const aiTeams: YouthTeam[] = sortedAiClubs.map((c, idx) => {
      const statureOffset = Math.max(-12, Math.min(0, (c.baseOvr || 65) - maxAiClubOvr));
      const rankBaseOvr = idx === 0 ? 78 : idx === 1 ? 75 : idx <= 3 ? 71 : idx <= 5 ? 67 : 63;
      const topRivalParityBoost =
        idx === 0 && academyLvl >= 4
          ? Math.max(0, Math.round((finalPlayerOvr - rankBaseOvr) * 0.8))
          : idx === 1 && academyLvl >= 4
          ? Math.max(0, Math.round((finalPlayerOvr - rankBaseOvr) * 0.6))
          : idx === 2 && academyLvl === 5
          ? Math.max(0, Math.round((finalPlayerOvr - rankBaseOvr) * 0.45))
          : 0;
      const jitter = Math.floor(Math.random() * 5) - 2;
      const computedOvr = Math.max(56, Math.min(86, rankBaseOvr + Math.round(statureOffset * 0.3) + topRivalParityBoost + jitter));
      return {
        id: c.id,
        name: `${c.name} U19`,
        baseName: c.name,
        ovr: computedOvr,
        color: c.color,
        logo: c.logo,
        fallbackLogo: c.fallbackLogo,
        isPlayer: false,
        country: c.country || countryStr,
      };
    });

    // Seed bracket so the #1 AI Youth Powerhouse is placed on the opposite half of the bracket from the player,
    // setting up a high-stakes Semi-Final and Championship Final rather than eliminating all top seeds in QF.
    const topRival = aiTeams[0];
    const remainingAi = aiTeams.slice(1).sort(() => Math.random() - 0.5);
    const halfA = [playerTeam, ...remainingAi.slice(0, 3)].sort(() => Math.random() - 0.5);
    const halfB = (topRival ? [topRival, ...remainingAi.slice(3)] : remainingAi.slice(3)).sort(() => Math.random() - 0.5);
    const allTeams = Math.random() < 0.5 ? [...halfA, ...halfB] : [...halfB, ...halfA];
    setTeams(allTeams);
  }, [state, clubsDb]);

  const simulateRound = (currentTeams: YouthTeam[], currentPhase: string) => {
    const results: YouthMatch[] = [];
    const winners: YouthTeam[] = [];
    const isFinalRound = currentPhase === 'sf';
    const isSemiRound = currentPhase === 'qf';
    
    for (let i = 0; i < currentTeams.length; i += 2) {
      const t1 = currentTeams[i];
      const t2 = currentTeams[i + 1];
      const diff = t1.ovr - t2.ovr;
      // Knockout tension scaling: tighter margins in Semi-Finals and Final so even Level 5 academies face real jeopardy
      const mult = isFinalRound ? 1.25 : isSemiRound ? 1.55 : 1.8;
      const minWinCap = isFinalRound ? 32 : isSemiRound ? 24 : 18;
      const maxWinCap = isFinalRound ? 68 : isSemiRound ? 76 : 82;
      const t1Chance = Math.max(minWinCap, Math.min(maxWinCap, 50 + diff * mult));
      const drawShootoutProb = isFinalRound ? 0.32 : isSemiRound ? 0.27 : 0.24;
      
      let t1Score = 0;
      let t2Score = 0;
      let isPenalties = false;
      let t1PenScore = 0;
      let t2PenScore = 0;
      let dramaText = '';
      let winner: YouthTeam;

      if (Math.random() < drawShootoutProb) { 
        // Drawn match going to Penalties
        t1Score = Math.floor(Math.random() * 3) + 1;
        t2Score = t1Score;
        isPenalties = true;
        const shootout = simulateFifaShootout(diff);
        t1PenScore = shootout.t1Pens;
        t2PenScore = shootout.t2Pens;
        winner = shootout.t1Wins ? t1 : t2;
        dramaText = `${winner.baseName} wins on penalties (${t1PenScore} – ${t2PenScore})!`;
        winners.push(winner);
      } else {
        // Standard win in 90 minutes
        if (Math.random() * 100 < t1Chance) {
          t1Score = Math.floor(Math.random() * 3) + 1;
          t2Score = Math.floor(Math.random() * t1Score);
          winner = t1;
          winners.push(t1);
          if (t1Score - t2Score === 1 && Math.random() < 0.45) dramaText = "90+3' Late Winner!";
          if (t1Score >= 3 && t2Score === 0) dramaText = "Absolute Demolition!";
        } else {
          t2Score = Math.floor(Math.random() * 3) + 1;
          t1Score = Math.floor(Math.random() * t2Score);
          winner = t2;
          winners.push(t2);
          if (t2Score - t1Score === 1 && Math.random() < 0.45) dramaText = "89' Late Drama!";
          if (t2Score >= 3 && t1Score === 0) dramaText = "Tactical Masterclass!";
        }
      }
      
      const locEmoji = COUNTRY_EMOJIS[t1.country] || '⚽';
      let att = 0;
      if (currentPhase === 'intro') {
        att = Math.floor(Math.random() * 200) + 300;
      } else if (currentPhase === 'qf') {
        att = Math.floor(Math.random() * 400) + 1200;
      } else if (currentPhase === 'sf' || currentPhase === 'final') {
        att = Math.floor(Math.random() * 800) + 4000;
      }
      
      const locationText = `${t1.baseName} ${locEmoji}`;
      results.push({ t1, t2, t1Score, t2Score, t1PenScore, t2PenScore, isPenalties, winner, locationText, dramaText, att });
    }
    return { results, winners };
  };

  const handleNextPhase = () => {
    if (phase === 'intro') {
      if (onTournamentStart) {
        onTournamentStart();
      }
      const { results, winners } = simulateRound(teams, phase);
      setMatches(results);
      setTeams(winners);
      setPhase('qf');
    } else if (phase === 'qf') {
      const { results, winners } = simulateRound(teams, phase);
      setMatches(results);
      setTeams(winners);
      setPhase('sf');
    } else if (phase === 'sf') {
      if (teams.some(t => t.isPlayer)) {
        setReachedFinal(true);
      }
      const { results, winners } = simulateRound(teams, phase);
      setMatches(results);
      setTeams(winners);
      setPhase('final');
    } else if (phase === 'final') {
      const won = teams[0]?.isPlayer || false;
      setTournamentWon(won);
      setPhase('result');
      if (won) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#38bdf8']
        });
      }
    } else if (phase === 'result') {
      claimRewardsIfNeeded(tournamentWon);
      onClose(tournamentWon);
    }
  };

  const playerStillIn = teams.some(t => t.isPlayer);
  const playerMatch = matches.find(m => m.t1.isPlayer || m.t2.isPlayer);
  const otherMatches = matches.filter(m => !m.t1.isPlayer && !m.t2.isPlayer);
  const phaseTitle = phase === 'intro' ? t('Youth Championship', 'Jugendmeisterschaft') : phase === 'qf' ? t('Quarter-Finals', 'Viertelfinale') : phase === 'sf' ? t('Semi-Finals', 'Halbfinale') : phase === 'final' ? t('Final', 'Finale') : t('Tournament Over', 'Turnier Beendet');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[60] flex flex-col items-center justify-center p-2.5 sm:p-4 text-left overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 20 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#12141c]/95 backdrop-blur-3xl border border-white/[0.08] w-full max-w-2xl rounded-[28px] sm:rounded-[32px] shadow-[0_32px_96px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden relative"
      >
        {/* Subtle Ambient Stadium Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/[0.03] blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/[0.03] blur-[80px] pointer-events-none"></div>

        {/* Frosted Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-lg shadow-inner shrink-0">
              <i className="fas fa-trophy"></i>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400/90 mb-0.5">
                {t('National U19 Championship', 'Nationale U19 Meisterschaft')}
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">
                {phaseTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Minimalist Phase Progression */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <span className={phase === 'qf' ? 'text-amber-400' : phase === 'sf' || phase === 'final' || phase === 'result' ? 'text-zinc-300' : ''}>QF</span>
              <span>·</span>
              <span className={phase === 'sf' ? 'text-amber-400' : phase === 'final' || phase === 'result' ? 'text-zinc-300' : ''}>SF</span>
              <span>·</span>
              <span className={phase === 'final' ? 'text-amber-400' : phase === 'result' ? 'text-zinc-300' : ''}>Final</span>
            </div>

            <button 
              aria-label="Close modal" 
              onClick={() => { claimRewardsIfNeeded(tournamentWon); onClose(tournamentWon); }} 
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.08] cursor-pointer shrink-0"
            >
              <i className="fas fa-xmark text-xs"></i>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain custom-scrollbar flex-1 min-h-0 relative z-10">
          
          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center pt-2 pb-6 text-center">
                <h3 className="text-xl font-black text-white tracking-tight mb-1.5 uppercase">
                  {t('The Elite 8 Academies', 'Die Elite 8 Akademien')}
                </h3>
                <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-md mb-6">
                  {t("The national U19 title is on the line. Here are the 8 qualified academies competing in this year's knockout tournament.", 'Der nationale U19-Titel steht auf dem Spiel. Hier sind die qualifizierten Mannschaften des diesjährigen Turniers.')}
                </p>

                {/* Grid of 8 Teams */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-6">
                  {teams.map((t, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: idx * 0.05 }}
                      key={t.id} 
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 ${t.isPlayer ? 'bg-emerald-500/[0.08] border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/[0.02] border-white/[0.06]'}`}
                    >
                      <ClubLogo name={t.baseName} id={t.id} color={t.color} logo={t.logo} fallbackLogo={t.fallbackLogo} isModActive={isModActive} className="w-10 h-10 object-contain drop-shadow-sm" fallbackClassName="w-10 h-10 text-xs rounded-xl flex items-center justify-center font-bold text-white shrink-0" />
                      <div>
                        <div className={`text-[11px] font-bold leading-tight truncate w-full max-w-[80px] ${t.isPlayer ? 'text-emerald-400' : 'text-zinc-200'}`}>{t.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{t.ovr} OVR</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tournament Stakes & Prize Grid */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-4 border border-white/[0.06] text-left">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                      <i className="fas fa-coins text-amber-400"></i>
                      <span>{t('Prize Purse', 'Prämie')}</span>
                    </div>
                    <div className="text-base font-black font-mono text-emerald-400">+{formatMoney(prizeMoney)}</div>
                  </div>

                  <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-4 border border-white/[0.06] text-left">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                      <i className="fas fa-bolt text-sky-400"></i>
                      <span>{t('Cohort Leap', 'Talent-Sprung')}</span>
                    </div>
                    <div className="text-base font-black font-mono text-sky-400">+2 OVR</div>
                  </div>
                </div>
              </motion.div>
            )}

            {(phase === 'qf' || phase === 'sf' || phase === 'final') && (
              <motion.div key={phase} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                
                {/* HERO CARD: Player Match */}
                {playerMatch && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 px-1 justify-center sm:justify-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {t('Your Fixture', 'Dein Spiel')}
                    </div>
                    <div className={`relative overflow-hidden rounded-[24px] border ${playerMatch.winner.isPlayer ? 'bg-gradient-to-br from-emerald-500/10 via-black/40 to-black/40 border-emerald-500/30' : 'bg-gradient-to-br from-rose-500/10 via-black/40 to-black/40 border-rose-500/30'}`}>
                      <div className="p-5 sm:p-6 flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          <span>{playerMatch.locationText}</span>
                          <span>{playerMatch.att.toLocaleString()} Fans</span>
                        </div>

                        <div className="flex items-center justify-between w-full">
                          {/* Player T1 */}
                          <div className="flex-1 flex flex-col items-center gap-2">
                            <ClubLogo name={playerMatch.t1.baseName} id={playerMatch.t1.id} color={playerMatch.t1.color} logo={playerMatch.t1.logo} fallbackLogo={playerMatch.t1.fallbackLogo} isModActive={isModActive} className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg" fallbackClassName="w-12 h-12 sm:w-16 sm:h-16 text-sm rounded-2xl flex items-center justify-center font-bold text-white" />
                            <div className={`text-xs sm:text-sm font-bold truncate max-w-[100px] sm:max-w-[140px] text-center ${playerMatch.t1.isPlayer ? 'text-emerald-400' : 'text-white'}`}>{playerMatch.t1.name}</div>
                          </div>

                          {/* Scoreboard */}
                          <div className="shrink-0 flex flex-col items-center justify-center min-w-[90px]">
                            <div className="bg-black/50 border border-white/10 rounded-2xl px-4 py-2 flex items-center justify-center gap-2 shadow-inner">
                              <span className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${playerMatch.winner.id === playerMatch.t1.id ? 'text-white' : 'text-zinc-500'}`}>{playerMatch.t1Score}</span>
                              <span className="text-zinc-600 font-bold text-lg leading-none">–</span>
                              <span className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${playerMatch.winner.id === playerMatch.t2.id ? 'text-white' : 'text-zinc-500'}`}>{playerMatch.t2Score}</span>
                            </div>
                            {playerMatch.isPenalties && (
                              <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                                {playerMatch.t1PenScore} - {playerMatch.t2PenScore} Pens
                              </div>
                            )}
                          </div>

                          {/* Player T2 */}
                          <div className="flex-1 flex flex-col items-center gap-2">
                            <ClubLogo name={playerMatch.t2.baseName} id={playerMatch.t2.id} color={playerMatch.t2.color} logo={playerMatch.t2.logo} fallbackLogo={playerMatch.t2.fallbackLogo} isModActive={isModActive} className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg" fallbackClassName="w-12 h-12 sm:w-16 sm:h-16 text-sm rounded-2xl flex items-center justify-center font-bold text-white" />
                            <div className={`text-xs sm:text-sm font-bold truncate max-w-[100px] sm:max-w-[140px] text-center ${playerMatch.t2.isPlayer ? 'text-emerald-400' : 'text-white'}`}>{playerMatch.t2.name}</div>
                          </div>
                        </div>

                        {playerMatch.dramaText && (
                          <div className="text-center mt-2 pt-3 border-t border-white/[0.06] text-xs font-bold text-amber-300">
                            <i className="fa-solid fa-fire mr-1.5 text-amber-400"></i> {playerMatch.dramaText}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* OTHER FIXTURES GRID */}
                {otherMatches.length > 0 && (
                  <div className="space-y-2 flex flex-col items-center sm:items-stretch">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1 w-full text-center sm:text-left">
                      {t('Other Fixtures', 'Weitere Begegnungen')}
                    </div>
                    <div className={`grid gap-3 w-full ${otherMatches.length === 1 ? 'grid-cols-1 place-items-center' : 'grid-cols-1 sm:grid-cols-2'}`}>
                      {otherMatches.map((m, i) => (
                        <div key={i} className={`bg-white/[0.02] border border-white/[0.04] rounded-[20px] p-3.5 flex flex-col justify-center w-full ${otherMatches.length === 1 ? 'max-w-md' : ''}`}>
                          <div className="flex justify-between items-center w-full">
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <ClubLogo name={m.t1.baseName} id={m.t1.id} color={m.t1.color} logo={m.t1.logo} fallbackLogo={m.t1.fallbackLogo} isModActive={isModActive} className="w-5 h-5 object-contain shrink-0" fallbackClassName="w-5 h-5 text-[8px] rounded-md flex items-center justify-center font-bold text-white shrink-0" />
                              <span className={`text-[11px] font-bold truncate ${m.winner.id === m.t1.id ? 'text-white' : 'text-zinc-500'}`}>{m.t1.name}</span>
                            </div>
                            <div className="px-2 font-mono text-[11px] font-bold text-zinc-300 shrink-0">{m.t1Score}</div>
                          </div>
                          
                          <div className="flex justify-between items-center w-full mt-1.5">
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <ClubLogo name={m.t2.baseName} id={m.t2.id} color={m.t2.color} logo={m.t2.logo} fallbackLogo={m.t2.fallbackLogo} isModActive={isModActive} className="w-5 h-5 object-contain shrink-0" fallbackClassName="w-5 h-5 text-[8px] rounded-md flex items-center justify-center font-bold text-white shrink-0" />
                              <span className={`text-[11px] font-bold truncate ${m.winner.id === m.t2.id ? 'text-white' : 'text-zinc-500'}`}>{m.t2.name}</span>
                            </div>
                            <div className="px-2 font-mono text-[11px] font-bold text-zinc-300 shrink-0">{m.t2Score}</div>
                          </div>

                          {m.isPenalties && (
                            <div className="text-[9px] text-amber-500/80 font-bold uppercase tracking-wider mt-2 pt-2 border-t border-white/[0.02]">
                              {m.winner.baseName} wins on pens ({m.t1PenScore}-{m.t2PenScore})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {phase === 'result' && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-6 text-center">
                {tournamentWon ? (
                  <>
                    <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 text-3xl shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-4">
                      <i className="fas fa-trophy"></i>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-1">
                      {t('National Champions!', 'Deutscher Meister!')}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mb-6">
                      {t('Your youth academy has conquered the nation! The squad celebrates with pride and glory.', 'Deine Jugendakademie hat den nationalen Titel geholt! Der gesamte Verein feiert diesen historischen Erfolg.')}
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-2">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-0.5">{t('Prize Awarded', 'Prämie')}</div>
                        <div className="text-lg font-black font-mono text-emerald-400">+{formatMoney(prizeMoney)}</div>
                      </div>
                      <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-3.5 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400/80 mb-0.5">{t('Cohort Boost', 'Talent-Sprung')}</div>
                        <div className="text-lg font-black font-mono text-sky-400">+2 OVR</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-zinc-500/20 to-zinc-500/10 border border-zinc-500/30 flex items-center justify-center text-zinc-400 text-3xl mb-4">
                      <i className="fas fa-shield-halved"></i>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-1">
                      {reachedFinal ? t('National Runner-Up!', 'Deutscher Vizemeister!') : t('Tournament Concluded', 'Turnier Beendet')}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      {reachedFinal 
                        ? t('A valiant effort in the national final! Your academy players took silver medals and gained priceless tournament experience.', 'Ein beherzter Auftritt im nationalen Finale! Deine Talente sicherten sich die Silbermedaille und wertvolle Erfahrung.')
                        : playerStillIn 
                        ? t('A valiant effort on the national stage. Your academy players gained valuable tournament experience.', 'Ein beherzter Auftritt auf nationaler Bühne. Deine Talente konnten wertvolle Erfahrung sammeln.')
                        : t('Eliminated from the championship. The youth academy will return stronger next year.', 'Ausgeschieden aus der Meisterschaft. Im nächsten Jahr greifen deine Talente erneut an.')}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between sm:justify-end gap-3 shrink-0 relative z-10">
          {phase !== 'intro' && (
            <div className="text-[11px] font-medium text-zinc-500">
              {phase === 'result' ? (tournamentWon ? t('Championship Title Won', 'Meistertitel errungen') : t('Tournament finished', 'Turnier abgeschlossen')) : t('Round simulation complete', 'Runde simuliert')}
            </div>
          )}

          <div className="flex items-center gap-2">
            {phase === 'intro' ? (
              <button
                type="button"
                onClick={handleNextPhase}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer"
              >
                <span>{t('Kick Off Tournament', 'Turnier starten')}</span>
                <i className="fas fa-arrow-right text-[11px]"></i>
              </button>
            ) : phase === 'qf' ? (
              <button
                type="button"
                onClick={handleNextPhase}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer"
              >
                <span>{t('Play Semi-Finals', 'Zum Halbfinale')}</span>
                <i className="fas fa-arrow-right text-[11px]"></i>
              </button>
            ) : phase === 'sf' ? (
              <button
                type="button"
                onClick={handleNextPhase}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer"
              >
                <span>{t('Play Championship Final', 'Zum Finale')}</span>
                <i className="fas fa-trophy text-[11px]"></i>
              </button>
            ) : phase === 'final' ? (
              <button
                type="button"
                onClick={handleNextPhase}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer"
              >
                <span>{t('View Tournament Result', 'Zum Ergebnis')}</span>
                <i className="fas fa-arrow-right text-[11px]"></i>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextPhase}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center gap-2 cursor-pointer"
              >
                <span>{tournamentWon ? t('Claim Trophy & Rewards', 'Trophäe entgegennehmen') : t('Complete & Return', 'Zurück zur Akademie')}</span>
                <i className="fas fa-check text-[11px]"></i>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};