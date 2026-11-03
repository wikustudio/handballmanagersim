import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store/useGameStore';
import { ClubLogo } from './ClubLogo';
import { TrophyGraphic } from './TrophyGraphic';
import { getBroadcastingPackage, BroadcastingPackage, cleanBroadcastBadge } from '../data/broadcastingPackages';
import { getActiveClubs, isAnyModActive, mergeClubWithWorldState } from '../utils/modManager';
import { getOvrColor, getClubHomeArena } from '../data/gameConstants';
import { getLeagueSize } from '../engine/engine';
import { useModalScrollLock } from '../utils/modalUtils';
import { BroadcastLogo } from './BroadcastLogo';

interface KeyMatchModalProps {
  matchData: any;
  onResolve: (won: boolean, matchScore?: [number, number]) => void;
  hasTacticalGenius?: boolean;
}

export const KeyMatchModal: React.FC<KeyMatchModalProps> = ({
  matchData,
  onResolve,
  hasTacticalGenius = false,
}) => {
  useModalScrollLock(true);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const [stage, setStage] = useState<'intro' | 'match' | 'clutch_7m' | 'result'>('intro');
  const stageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stageContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [stage]);

  const [matchTime, setMatchTime] = useState(0);
  const [score, setScore] = useState([0, 0]);
  const [gkStats, setGkStats] = useState<any>(null);
  const [clutchDesc, setClutchDesc] = useState<string | null>(null);
  const [matchArchetype, setMatchArchetype] = useState<
    'nailbiter' | 'overtime' | 'shootout' | 'blowout' | 'cup_upset' | 'defensive_duel' | 'standard'
  >('standard');
  const [matchEvents, setMatchEvents] = useState<Array<{
    minute: number;
    text: string;
    icon: string;
    team: 'player' | 'opp' | 'neutral';
    isTurningPoint?: boolean;
  }>>([]);
  const [isCupMagic, setIsCupMagic] = useState<boolean>(false);
  const [finishSuffix, setFinishSuffix] = useState<string>('');
  const intervalRef = useRef<any>(null);
  const matchContextRef = useRef<{
    t: number;
    s: [number, number];
    targetPlayerFinal: number;
    targetOppFinal: number;
    playerWins: boolean;
    chosenArchetype: string;
    opponentOvr: number;
  }>({
    t: 0,
    s: [0, 0],
    targetPlayerFinal: 0,
    targetOppFinal: 0,
    playerWins: false,
    chosenArchetype: 'standard',
    opponentOvr: 75
  });

  const clubState = useGameStore((s) => s.club);
  const worldClubs = useGameStore((s) => s.worldClubs);
  const rivalClubName = useGameStore((s) => s.rivalClubName);
  const userTactic = useGameStore((s) => s.tactic) || 'Fast Break';
  const [simSpeed, setSimSpeed] = useState<1 | 2>(1);
  const simSpeedRef = useRef<1 | 2>(1);

  const clubCountry = clubState?.country || 'GER';
  const isIhfMatch =
    matchData.type === 'ihf_final' ||
    Boolean(matchData.subtitle?.toUpperCase().includes('IHF')) ||
    Boolean(matchData.subtitle?.toUpperCase().includes('SUPER GLOBE')) ||
    Boolean(matchData.cupName?.toUpperCase().includes('IHF')) ||
    Boolean(matchData.cupName?.toUpperCase().includes('SUPER GLOBE'));

  const isSupercupMatch =
    matchData.type === 'domestic_supercup' ||
    matchData.type === 'euro_supercup';

  const safeBaseWinProb = useMemo(() => {
    if (typeof matchData.baseWinProb === 'number' && !Number.isNaN(matchData.baseWinProb)) {
      return matchData.baseWinProb;
    }
    const pOvr = typeof matchData.playerOvr === 'number' && !Number.isNaN(matchData.playerOvr) ? matchData.playerOvr : (clubState?.baseOvr || 78);
    const oOvr = typeof matchData.opponentOvr === 'number' && !Number.isNaN(matchData.opponentOvr) ? matchData.opponentOvr : 78;
    return Math.round(Math.max(0.15, Math.min(0.85, 0.5 + (pOvr - oOvr) * 0.02)) * 100);
  }, [matchData.baseWinProb, matchData.playerOvr, matchData.opponentOvr, clubState?.baseOvr]);

  const isEuroMatch =
    !isIhfMatch && (
      matchData.type === 'cl_sf' ||
      matchData.type === 'euro_cup_sf' ||
      matchData.type === 'cl_qf' ||
      matchData.type === 'euro_cup_qf' ||
      matchData.type === 'cl_final' ||
      matchData.type === 'euro_cup_final' ||
      matchData.type === 'euro_supercup' ||
      Boolean(matchData.isEuroCup)
    );

  const [modTick, setModTick] = useState(0);
  useEffect(() => {
    const onModChange = () => setModTick(t => t + 1);
    window.addEventListener('mod-state-change', onModChange);
    return () => window.removeEventListener('mod-state-change', onModChange);
  }, []);

  const isModActive = useMemo(() => isAnyModActive(), [modTick]);

  // Determine official broadcast package
  const broadcastPackage: BroadcastingPackage = useMemo(() => {
    if (isIhfMatch) {
      return getBroadcastingPackage(clubCountry, true, {
        type: 'ihf_final',
        title: matchData.title,
        subtitle: matchData.subtitle,
        year: matchData.year || 2024,
        clubName: matchData.playerClubName || clubState?.name,
        isModActive,
      });
    }
    if (matchData.broadcastPackage) {
      return matchData.broadcastPackage;
    }
    return getBroadcastingPackage(clubCountry, isEuroMatch, {
      type: matchData.type,
      title: matchData.title,
      subtitle: matchData.subtitle,
      year: matchData.year || 2024,
      clubName: matchData.playerClubName || clubState?.name,
      isModActive,
    });
  }, [matchData, clubCountry, isIhfMatch, isEuroMatch, isModActive, clubState]);

  // Find club metadata for genuine logos & crests
  const clubs = useMemo(() => {
    const base = getActiveClubs(clubCountry);
    return base.map(c => mergeClubWithWorldState(c, worldClubs?.[c.id]));
  }, [clubCountry, worldClubs, modTick]);
  const playerClub = useMemo(() => {
    const fromDb = clubs.find((c) => c.name === matchData.playerClubName);
    return {
      ...(fromDb || {}),
      ...(clubState || {}),
      logo: isModActive ? (clubState?.logo ?? fromDb?.logo) : undefined,
      fallbackLogo: isModActive ? (clubState?.fallbackLogo ?? fromDb?.fallbackLogo) : undefined,
      name: matchData.playerClubName || clubState?.name || fromDb?.name,
      tier: matchData.tier || clubState?.tier || fromDb?.tier || 1
    };
  }, [clubs, matchData.playerClubName, matchData.tier, clubState, isModActive]);
  const oppClub = useMemo(
    () => clubs.find((c) => c.name === matchData.opponentName),
    [clubs, matchData.opponentName]
  );

  const oppNarrativeTag = useMemo(() => {
    const oppName = matchData.opponentName;
    const worldClub = worldClubs && oppName ? Object.values(worldClubs).find((c: any) => c.name === oppName) : null;
    const isNemesis = Boolean((worldClub as any)?.isNemesisActive || (oppClub as any)?.isNemesisActive);
    const isCinderella = Boolean((worldClub as any)?.isCinderellaActive || (oppClub as any)?.isCinderellaActive);
    const isDerby = Boolean(matchData.isRivalClash || (rivalClubName && (oppName === rivalClubName || oppClub?.name === rivalClubName)));

    if (isNemesis) {
      return { text: '🚨 INVESTOR-BACKED NEMESIS', className: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]' };
    }
    if (isCinderella) {
      return { text: '✨ CINDERELLA GIANT-KILLERS', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' };
    }
    if (isDerby) {
      return { text: '🔥 FIERCE DERBY', className: 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.3)]' };
    }
    return null;
  }, [matchData.opponentName, matchData.isRivalClash, worldClubs, oppClub, rivalClubName]);

  // Check if this match is Decision Day
  const isDecisionDay = useMemo(() => {
    return (
      matchData.type === 'championship_decider' ||
      matchData.type === 'playoff' ||
      matchData.type === 'relegation_playoff' ||
      Boolean(matchData.title && matchData.title.toUpperCase().includes('DECISION DAY')) ||
      Boolean(
        matchData.subtitle &&
          (matchData.subtitle.toUpperCase().includes('DECISION DAY') ||
            matchData.subtitle.toUpperCase().includes('ENTSCHEIDUNGSTAG') ||
            matchData.subtitle.toUpperCase().includes('AFGØRELSESDAGEN') ||
            matchData.subtitle.toUpperCase().includes('DÉCISIF') ||
            matchData.subtitle.toUpperCase().includes('DAN ODLUKE'))
      )
    );
  }, [matchData]);

  const isRelegationBattle = useMemo(() => {
    return (
      matchData.type === 'relegation_playoff' ||
      Boolean(matchData.subtitle && (matchData.subtitle.toUpperCase().includes('RELEGATION') || matchData.subtitle.toUpperCase().includes('SURVIVAL'))) ||
      Boolean(matchData.title && (matchData.title.toUpperCase().includes('RELEGATION') || matchData.title.toUpperCase().includes('SURVIVAL'))) ||
      Boolean(matchData.standings && matchData.standings.some((t: any) => t.stake?.includes('DROP') || t.status === 'RELEGATED'))
    );
  }, [matchData]);

  // Determine host arena:
  // "The decision day should not be in the lanxess arena unless this is the other teams arena."
  const hostArena = useMemo(() => {
    const getClubHomeArena = (club: any): string => {
      if (!club) return 'Home Arena';
      if (club.arena) return club.arena;
      if (club.stadiumName) return club.stadiumName;

      const KNOWN_ARENAS: Record<string, string> = {
        'SC Magdeburg': 'GETEC Arena, Magdeburg',
        'Füchse Berlin': 'Max-Schmeling-Halle, Berlin',
        'THW Kiel': 'Wunderino Arena, Kiel',
        'SG Flensburg-Handewitt': 'GP JOULE Arena, Flensburg',
        'Rhein-Neckar Löwen': 'SAP Arena, Mannheim',
        'MT Melsungen': 'Rothenbach-Halle, Kassel',
        'TSV Hannover-Burgdorf': 'ZAG Arena, Hannover',
        'VfL Gummersbach': 'SCHWALBE arena, Gummersbach',
        'SC DHfK Leipzig': 'QUARTERBACK Immobilien ARENA, Leipzig',
        'TBV Lemgo Lippe': 'Phoenix Contact Arena, Lemgo',
        'Frisch Auf Göppingen': 'EWS Arena, Göppingen',
        'HC Erlangen': 'Arena Nürnberger Versicherung, Nürnberg',
        'HSG Wetzlar': 'Buderus Arena Wetzlar',
        'HSV Hamburg': 'Sporthalle Hamburg',
        'TVB Stuttgart': 'Porsche-Arena, Stuttgart',
        'ThSV Eisenach': 'Werner-Aßmann-Halle, Eisenach',
        '1. VfL Potsdam': 'MBS Arena Potsdam',
        'SG BBM Bietigheim': 'EgeTrans Arena, Bietigheim',
        'Bergischer HC': 'Uni-Halle, Wuppertal',
        'HBW Balingen-Weilstetten': 'Sparkassen-Arena, Balingen',
        'TuS N-Lübbecke': 'MERKUR Arena, Lübbecke',
        'HSG Nordhorn-Lingen': 'Euregium, Nordhorn',
        'GWD Minden': 'Kampa-Halle, Minden',
        'HC Elbflorenz Dresden': 'Joynext Arena, Dresden',
        'ASV Hamm-Westfalen': 'Westpress Arena, Hamm',
        'HSC 2000 Coburg': 'HUK-COBURG arena, Coburg',
        'Dessau-Roßlauer HV': 'Anhalt-Arena, Dessau',
        'VfL Eintracht Hagen': 'Krollmann Arena, Hagen',
        'Die Eulen Ludwigshafen': 'Friedrich-Ebert-Halle, Ludwigshafen',
        'TV Großwallstadt': 'Untermainhalle, Elsenfeld',
        'Aalborg Håndbold': 'Sparekassen Danmark Isarena, Aalborg',
        'GOG Håndbold': 'Phønix Tag Arena, Gudme',
        'Bjerringbro-Silkeborg': 'Jysk Arena, Silkeborg',
        'Skjern Håndbold': 'Skjern Bank Arena, Skjern',
        'Paris Saint-Germain': 'Stade Pierre de Coubertin, Paris',
        'Montpellier Handball': 'FDI Stadium, Montpellier',
        'HBC Nantes': 'H Arena, Nantes',
        'Barça': 'Palau Blaugrana, Barcelona',
        'Telekom Veszprém': 'Veszprém Aréna, Veszprém',
        'Pick Szeged': 'Pick Aréna, Szeged',
        'Industria Kielce': 'Hala Legionów, Kielce',
        'Orlen Wisła Płock': 'Orlen Arena, Płock',
        'Górnik Zabrze': 'Hala Pogoń, Zabrze',
        'Alpla HC Hard': 'Sporthalle am See, Hard',
        'Bregenz Handball': 'Handball Arena Rieden-Vorkloster, Bregenz',
        'Handball Tirol': 'Osthalle Schwaz, Schwaz',
        'Fivers Margareten': 'Sporthalle Margareten, Vienna',
        'Kadetten Schaffhausen': 'BBC Arena, Schaffhausen',
        'HC Kriens-Luzern': 'Krauerhalle, Kriens',
        'Pfadi Winterthur': 'AXA Arena, Winterthur',
        'BSV Bern': 'Mobiliar Arena, Gümligen',
        'Wacker Thun': 'Lachenhalle, Thun',
      };

      if (KNOWN_ARENAS[club.name]) {
        return KNOWN_ARENAS[club.name];
      }

      const ctx = club.context || club.historicContext || '';
      if (ctx) {
        const match = ctx.match(
          /(?:inside|in|defending|turning|rocking|igniting|packing|operating out of|at|whose|into an?)\s+(?:the\s+)?([A-Z0-9À-ÿ][A-Za-z0-9À-ÿ\s\-'’\.\/]+?\b(?:Arena|Halle[n]?|Centret|Center|Idrætscenter|Idrætspark|Idrætshaller|Sportsby|Park|Spektrum|Parnasse|Phare|Beaublanc|Flandres|Colisée|Sélestat|Boisramé|Dome|Sporthalle|Palais des Sports[A-Za-z0-9À-ÿ\s\-'’]*|Sport- og Fritidscenter))\b/i
        );
        if (match) {
          const cleaned = match[1]
            .replace(
              /^(ear-shattering|fervent|state-of-the-art|iconic|modern|cauldron of|roaring|impenetrable|thunderous|beloved|legendary)\s+/i,
              ''
            )
            .trim();
          if (cleaned.length > 3) {
            return cleaned;
          }
        }
      }

      return `${club.name} Arena`;
    };

    if (isDecisionDay) {
      const oppArena = getClubHomeArena(oppClub);
      const isOtherTeamLanxess =
        oppArena.toLowerCase().includes('lanxess') ||
        Boolean(oppClub?.name && oppClub.name.toLowerCase().includes('köln'));

      // If this is the other team's arena, it CAN be Lanxess Arena!
      if (isOtherTeamLanxess) {
        return oppArena;
      }

      // Otherwise, Decision Day MUST NOT be in Lanxess Arena!
      const playerArena = getClubHomeArena(playerClub);
      const chosenArena = matchData.isAway ? oppArena : playerArena;
      if (chosenArena.toLowerCase().includes('lanxess')) {
        return `${playerClub?.name || 'Home'} Arena`;
      }
      return chosenArena;
    }

    const isAmateurCup = Boolean(
      matchData.isAmateurCup ||
      matchData.cupName?.toLowerCase().includes('amateur') ||
      matchData.subtitle?.toLowerCase().includes('amateur') ||
      matchData.title?.toLowerCase().includes('amateur') ||
      matchData.cupName?.toLowerCase().includes('regional') ||
      matchData.subtitle?.toLowerCase().includes('regional') ||
      (playerClub && playerClub.tier > 2)
    );

    const isQuarterFinal = matchData.type === 'cup_qf' || 
      Boolean(matchData.title?.toLowerCase().includes('quarter')) || 
      Boolean(matchData.subtitle?.toLowerCase().includes('quarter'));

    if (isAmateurCup || isQuarterFinal) {
      // Amateurpokal and Quarter-Finals are NEVER hosted in Lanxess Arena; played at [team name] arena
      const playerArena = getClubHomeArena(playerClub);
      const oppArena = getClubHomeArena(oppClub);
      const chosen = matchData.isAway ? oppArena : playerArena;
      if (chosen.toLowerCase().includes('lanxess')) {
        return `${matchData.isAway && oppClub ? oppClub.name : (playerClub?.name || 'Home')} Arena`;
      }
      return chosen;
    }

    if (matchData.hostArena) {
      return matchData.hostArena;
    }

    if (matchData.arena) {
      if (isAmateurCup && matchData.arena.toLowerCase().includes('lanxess')) {
        return `${playerClub?.name || 'Home'} Arena`;
      }
      return matchData.arena;
    }

    if (isAmateurCup) {
      return getClubHomeArena(playerClub);
    }

    return broadcastPackage.mainArena;
  }, [isDecisionDay, matchData, oppClub, playerClub, broadcastPackage]);

  const hostCapacity = useMemo(() => {
    if (matchData.hostCapacity) return matchData.hostCapacity;
    if (matchData.capacity) return matchData.capacity;
    const lower = hostArena.toLowerCase();
    if (lower.includes('lanxess')) return 19750;
    if (lower.includes('ews arena') || lower.includes('göppingen')) return 4750;
    if (lower.includes('sap arena')) return 13200;
    if (lower.includes('wunderino')) return 10285;
    if (lower.includes('max-schmeling')) return 9000;
    if (lower.includes('quarterback')) return 12250;
    if (lower.includes('zag arena')) return 9900;
    if (lower.includes('jyske bank boxen')) return 15000;
    if (lower.includes('accor arena')) return 15600;
    if (lower.includes('wizink')) return 17453;
    if (lower.includes('mvm dome')) return 20022;
    if (lower.includes('tauron arena')) return 15030;
    if (lower.includes('wiener stadthalle')) return 16000;
    if (lower.includes('st. jakobshalle')) return 12400;
    if (lower.includes('arena zagreb')) return 15200;

    const playerArena = getClubHomeArena(playerClub);
    if (hostArena === playerArena && playerClub?.stadium) return playerClub.stadium;

    const oppArena = getClubHomeArena(oppClub);
    if (hostArena === oppArena && oppClub?.stadium) return oppClub.stadium;

    if (matchData.isAway && oppClub?.stadium) return oppClub.stadium;
    if (!matchData.isAway && playerClub?.stadium) return playerClub.stadium;
    return playerClub?.stadium || oppClub?.stadium || 4750;
  }, [matchData, hostArena, playerClub, oppClub]);

  useEffect(() => {
    setSelectedTactic(null);
    setResult(null);
    setStage('intro');
    setMatchTime(0);
    setScore([0, 0]);
    setClutchDesc(null);
    setGkStats(null);
    setMatchArchetype('standard');
    setMatchEvents([]);
    setIsCupMagic(false);
    setFinishSuffix('');
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [matchData]);

  const isCupMatch = useMemo(() => {
    return (
      matchData.type?.includes('cup') ||
      matchData.type?.includes('cl_') ||
      matchData.type?.includes('euro_') ||
      Boolean(matchData.cupName) ||
      Boolean(
        matchData.title &&
          (matchData.title.toUpperCase().includes('CUP') ||
            matchData.title.toUpperCase().includes('POKAL') ||
            matchData.title.toUpperCase().includes('COPA'))
      )
    );
  }, [matchData]);

  const getTickInterval = (minute: number, s0: number, s1: number) => {
    const isFast = simSpeedRef.current === 2;
    const diff = Math.abs(s0 - s1);
    if (minute >= 50 && diff <= 2) {
      // Heartbeat slowdown: tension spikes dramatically in clutch finishes (50', 55', 60')
      return isFast ? 160 : 400;
    }
    if (diff >= 6) {
      // Blowout speedup: skip waiting through runaway margins
      return isFast ? 25 : 50;
    }
    return isFast ? 40 : 110;
  };

  const runMatchInterval = (ctx: typeof matchContextRef.current) => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      clearInterval(intervalRef.current);
    }

    const scheduleNext = () => {
      const delay = getTickInterval(ctx.t, ctx.s[0], ctx.s[1]);
      intervalRef.current = setTimeout(step, delay);
    };

    const step = () => {
      ctx.t += 5;
      const t = ctx.t;
      const s = ctx.s;

      // Standard 60 minutes reached
      if (t === 60) {
        s[0] = ctx.targetPlayerFinal;
        s[1] = ctx.targetOppFinal;
        setScore([...s]);
        setMatchTime(60);

        if (s[0] === s[1]) {
          // Let both overtime and shootout archetypes tick to 65' and 70'
          if (ctx.chosenArchetype === 'overtime' || ctx.chosenArchetype === 'shootout') {
            scheduleNext();
            return;
          }
          // Direct 7-meter shootout
          setFinishSuffix(' (p)');
          const GK_FIRST_NAMES = ['Lukas', 'Niklas', 'Andreas', 'Kasper', 'Thierry', 'Gonzalo', 'Ivan', 'Mikkel', 'Torbjørn', 'Dejan'];
          const GK_LAST_NAMES = ['Landin', 'Wolff', 'Perez', 'Omeyer', 'Palicka', 'Hansen', 'Vargas', 'Sterbik', 'Bergerud', 'Milosavljev'];
          const reflexes = Math.min(99, Math.max(70, ctx.opponentOvr + (Math.floor(Math.random() * 8) - 4)));
          const height = 1.9 + Math.random() * 0.15;
          const name = `${GK_FIRST_NAMES[Math.floor(Math.random() * GK_FIRST_NAMES.length)]} ${
            GK_LAST_NAMES[Math.floor(Math.random() * GK_LAST_NAMES.length)]
          }`;
          setGkStats({ reflexes, height, name });
          setStage('clutch_7m');
          return;
        }

        const won = s[0] > s[1];
        setResult(won);
        setFinishSuffix('');
        setTimeout(() => setStage('result'), simSpeedRef.current === 2 ? 400 : 1000);
        return;
      }

      // Overtime period 1 (65')
      if (t === 65) {
        setMatchTime(65);
        if (ctx.chosenArchetype === 'shootout') {
          // Shootout: scores stay naturally tied during extra time
          const otG1 = Math.random() < 0.6 ? 1 : 0;
          s[0] += otG1;
          s[1] += otG1;
        } else {
          // Overtime: narrative pacing for extra time half 1
          const pGoal = ctx.playerWins ? (Math.random() < 0.65 ? 1 : 0) : (Math.random() < 0.35 ? 1 : 0);
          const oppGoal = ctx.playerWins ? (Math.random() < 0.35 ? 1 : 0) : (Math.random() < 0.65 ? 1 : 0);
          s[0] += pGoal;
          s[1] += oppGoal;
        }
        setScore([...s]);
        scheduleNext();
        return;
      }

      // Overtime period 2 (70') - End of Extra Time
      if (t >= 70) {
        setMatchTime(70);

        if (ctx.chosenArchetype === 'shootout') {
          // Both teams score identical goals to keep scoreline tied going into 7m shootout
          const otG2 = Math.random() < 0.6 ? 1 : 0;
          s[0] += otG2;
          s[1] += otG2;
          setScore([...s]);

          setFinishSuffix(' (p)');
          const GK_FIRST_NAMES = ['Lukas', 'Niklas', 'Andreas', 'Kasper', 'Thierry', 'Gonzalo', 'Ivan', 'Mikkel', 'Torbjørn', 'Dejan'];
          const GK_LAST_NAMES = ['Landin', 'Wolff', 'Perez', 'Omeyer', 'Palicka', 'Hansen', 'Vargas', 'Sterbik', 'Bergerud', 'Milosavljev'];
          const reflexes = Math.min(99, Math.max(70, ctx.opponentOvr + (Math.floor(Math.random() * 8) - 4)));
          const height = 1.9 + Math.random() * 0.15;
          const name = `${GK_FIRST_NAMES[Math.floor(Math.random() * GK_FIRST_NAMES.length)]} ${
            GK_LAST_NAMES[Math.floor(Math.random() * GK_LAST_NAMES.length)]
          }`;
          setGkStats({ reflexes, height, name });
          setStage('clutch_7m');
          return;
        }

        // Overtime: Authoritative victory matching timeline narrative
        if (ctx.playerWins) {
          if (s[0] <= s[1]) {
            s[0] = s[1] + (Math.random() < 0.6 ? 1 : 2);
          } else {
            s[0] += Math.random() < 0.5 ? 1 : 0;
          }
        } else {
          if (s[1] <= s[0]) {
            s[1] = s[0] + (Math.random() < 0.6 ? 1 : 2);
          } else {
            s[1] += Math.random() < 0.5 ? 1 : 0;
          }
        }
        setScore([...s]);
        setFinishSuffix(' (AET)');
        setResult(ctx.playerWins);
        setTimeout(() => setStage('result'), simSpeedRef.current === 2 ? 400 : 1000);
        return;
      }

      // Regulation progression (5' to 55')
      setMatchTime(t);
      const period = t / 5; // 1 to 11
      const p1Expected = (ctx.targetPlayerFinal * period) / 12;
      const p2Expected = (ctx.targetOppFinal * period) / 12;
      const flutter1 = Math.floor(Math.random() * 3) - 1;
      const flutter2 = Math.floor(Math.random() * 3) - 1;

      const nextP1 = Math.max(s[0], Math.min(ctx.targetPlayerFinal, Math.round(p1Expected + flutter1)));
      const nextP2 = Math.max(s[1], Math.min(ctx.targetOppFinal, Math.round(p2Expected + flutter2)));

      s[0] = nextP1;
      s[1] = nextP2;
      setScore([...s]);

      scheduleNext();
    };

    scheduleNext();
  };

  const toggleSimSpeed = () => {
    const next = simSpeedRef.current === 1 ? 2 : 1;
    simSpeedRef.current = next;
    setSimSpeed(next);
    if (intervalRef.current && matchContextRef.current && stage === 'match') {
      runMatchInterval(matchContextRef.current);
    }
  };

  const handleInstantResult = () => {
    const ctx = matchContextRef.current;
    if (!ctx) return;
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      clearInterval(intervalRef.current);
    }

    const s = ctx.s;
    s[0] = ctx.targetPlayerFinal;
    s[1] = ctx.targetOppFinal;
    setScore([...s]);
    setMatchTime(60);

    if (s[0] === s[1]) {
      if (ctx.chosenArchetype === 'overtime') {
        const extraGoalP = ctx.playerWins ? 2 : 1;
        const extraGoalOpp = ctx.playerWins ? 1 : 2;
        s[0] += extraGoalP;
        s[1] += extraGoalOpp;
        setScore([...s]);
        setMatchTime(70);
        setFinishSuffix(' (AET)');
        setResult(ctx.playerWins);
        setStage('result');
        return;
      }

      // Shootout
      setFinishSuffix(' (p)');
      const GK_FIRST_NAMES = ['Lukas', 'Niklas', 'Andreas', 'Kasper', 'Thierry', 'Gonzalo', 'Ivan', 'Mikkel', 'Torbjørn', 'Dejan'];
      const GK_LAST_NAMES = ['Landin', 'Wolff', 'Perez', 'Omeyer', 'Palicka', 'Hansen', 'Vargas', 'Sterbik', 'Bergerud', 'Milosavljev'];
      const reflexes = Math.min(99, Math.max(70, ctx.opponentOvr + (Math.floor(Math.random() * 8) - 4)));
      const height = 1.9 + Math.random() * 0.15;
      const name = `${GK_FIRST_NAMES[Math.floor(Math.random() * GK_FIRST_NAMES.length)]} ${
        GK_LAST_NAMES[Math.floor(Math.random() * GK_LAST_NAMES.length)]
      }`;
      setGkStats({ reflexes, height, name });
      setStage('clutch_7m');
      return;
    }

    const won = s[0] > s[1];
    setResult(won);
    setFinishSuffix('');
    setStage('result');
  };


  const handlePlay = (tactic: string, bonus: number) => {
    setSelectedTactic(tactic);
    setStage('match');

    const playerOvr = matchData.playerOvr || 75;
    const opponentOvr = matchData.opponentOvr || 75;
    const ovrDiff = playerOvr - opponentOvr;

    // 1. Realistic Cup Magic & Cinderella Underdog Momentum
    let effectiveBonus = bonus;
    if (tactic === 'Aggressive51') {
      const isOverwhelm = Math.random() < 0.5;
      effectiveBonus = isOverwhelm ? 8 : -6;
    }
    let cupMagicActive = false;

    if (isCupMatch && ovrDiff <= -4 && Math.random() < 0.16) {
      // Player underdog surge: +12% win probability boost & inspirational momentum
      cupMagicActive = true;
      effectiveBonus += 12;
      setIsCupMagic(true);
    } else if (isCupMatch && ovrDiff >= 6 && Math.random() < 0.12) {
      // Opponent underdog cup magic: -10% player win probability
      cupMagicActive = true;
      effectiveBonus -= 10;
      setIsCupMagic(true);
    } else {
      setIsCupMagic(false);
    }

    const pWin = Math.min(0.92, Math.max(0.08, safeBaseWinProb / 100 + effectiveBonus / 100));
    let t = 0;
    let s = [0, 0];

    // 2. Match Archetype Determination
    let chosenArchetype: 'nailbiter' | 'overtime' | 'shootout' | 'blowout' | 'cup_upset' | 'defensive_duel' | 'standard' = 'standard';
    const typeRoll = Math.random();

    if (cupMagicActive) {
      chosenArchetype = 'cup_upset';
    } else if (tactic === 'Defense60' && typeRoll < 0.40) {
      chosenArchetype = 'defensive_duel';
    } else if ((tactic === 'AllOutAttack' || tactic === 'FastBreak' || tactic === 'PowerPlay7v6') && typeRoll < 0.35) {
      chosenArchetype = 'blowout';
    } else if (Math.abs(ovrDiff) <= 3) {
      if (typeRoll < 0.20) chosenArchetype = 'overtime';
      else if (typeRoll < 0.35) chosenArchetype = 'shootout';
      else if (typeRoll < 0.70) chosenArchetype = 'nailbiter';
      else if (typeRoll < 0.85) chosenArchetype = 'defensive_duel';
      else chosenArchetype = 'standard';
    } else if (Math.abs(ovrDiff) <= 7) {
      if (typeRoll < 0.15) chosenArchetype = 'overtime';
      else if (typeRoll < 0.25) chosenArchetype = 'shootout';
      else if (typeRoll < 0.55) chosenArchetype = 'nailbiter';
      else if (typeRoll < 0.80) chosenArchetype = 'standard';
      else chosenArchetype = 'blowout';
    } else {
      if (typeRoll < 0.10) chosenArchetype = 'nailbiter';
      else if (typeRoll < 0.45) chosenArchetype = 'standard';
      else chosenArchetype = 'blowout';
    }
    setMatchArchetype(chosenArchetype);

    // 3. Establish Authentic Scoring Pace (Goals per side)
    const paceRoll = Math.random();
    let baseGoals = 27; // Authentic European average

    if (chosenArchetype === 'defensive_duel') {
      baseGoals = 19 + Math.floor(Math.random() * 4); // 19 - 22 (Defensive grind)
    } else if (chosenArchetype === 'blowout') {
      baseGoals = 28 + Math.floor(Math.random() * 5); // 28 - 32 (Runaway tempo)
    } else if (paceRoll < 0.15) {
      baseGoals = 22 + Math.floor(Math.random() * 3); // 22 - 24 (Low scoring)
    } else if (paceRoll < 0.75) {
      baseGoals = 25 + Math.floor(Math.random() * 5); // 25 - 29 (Standard Bell Curve Peak)
    } else if (paceRoll < 0.95) {
      baseGoals = 30 + Math.floor(Math.random() * 4); // 30 - 33 (High tempo)
    } else {
      baseGoals = 34 + Math.floor(Math.random() * 5); // 34 - 38 (Rare Shootout)
    }

    // Tactical Pace Modifiers (Toned down to prevent ceiling hugging)
    if (tactic === 'SquadStrengths') {
      const activeTactic = userTactic || 'Fast Break';
      if (activeTactic === 'Aggressive 6-0') {
        baseGoals -= 2;
      } else if (activeTactic === 'Fast Break') {
        baseGoals += 2;
      } else if (activeTactic === 'Playmaker Focus') {
        baseGoals -= 1;
      } else if (activeTactic === 'Offensive 3-2-1') {
        baseGoals += 1;
      } else if (activeTactic === '7v6 Empty Net') {
        baseGoals += 2;
      }
    } else if (tactic === 'AllOutAttack' || tactic === 'FastBreak') {
      baseGoals += 1 + Math.floor(Math.random() * 3);
    } else if (tactic === 'Defense60') {
      baseGoals -= 1 + Math.floor(Math.random() * 2);
    } else if (tactic === 'PowerPlay7v6') {
      baseGoals += 1 + Math.floor(Math.random() * 2);
    }

    if (!matchData.isAway && clubState?.fanStrategy === 'ultras') {
      baseGoals += 1;
    }

    // 4. Spread Determination
    let targetSpread = 1;
    if (chosenArchetype === 'overtime' || chosenArchetype === 'shootout') {
      targetSpread = 0; // Tied at 60'
    } else if (tactic === 'SquadStrengths' && userTactic === 'Aggressive 6-0') {
      targetSpread = 1 + (Math.random() < 0.50 ? 1 : 0); // 1-2 goals max
    } else if (tactic === 'SquadStrengths' && userTactic === 'Playmaker Focus') {
      targetSpread = 2 + Math.floor(Math.random() * 2);
    } else if (chosenArchetype === 'nailbiter' || chosenArchetype === 'cup_upset') {
      targetSpread = 1 + (Math.random() < 0.40 ? 1 : 0); // 1 or 2 goals
    } else if (chosenArchetype === 'defensive_duel') {
      targetSpread = 1 + Math.floor(Math.random() * 4); // 1 to 4 goals
    } else if (chosenArchetype === 'blowout') {
      // 7 to 13 goal difference (Authentic blowout margin)
      targetSpread = 7 + Math.floor(Math.random() * 7); 
    } else {
      targetSpread = 3 + Math.floor(Math.random() * 4); // 3 to 6 goals
    }

    // Determine winner based on pWin
    const playerWins = Math.random() < pWin;
    let targetPlayerFinal = baseGoals;
    let targetOppFinal = baseGoals;

    if (targetSpread === 0) {
      targetPlayerFinal = baseGoals;
      targetOppFinal = baseGoals;
    } else {
      let winnerScore = Math.round(baseGoals + targetSpread / 2);
      let loserScore = winnerScore - targetSpread;

      // Absolute limits
      if (loserScore < 15) {
        const adjustment = 15 - loserScore;
        loserScore = 15;
        winnerScore += adjustment;
      }

      if (winnerScore > 46) {
        const excess = winnerScore - 46;
        winnerScore = 46;
        loserScore = Math.max(15, loserScore - excess);
      }

      targetPlayerFinal = playerWins ? winnerScore : loserScore;
      targetOppFinal = playerWins ? loserScore : winnerScore;
    }

    targetPlayerFinal = Math.min(46, Math.max(15, targetPlayerFinal));
    targetOppFinal = Math.min(46, Math.max(15, targetOppFinal));

    // 5. Generate Match Highlight Events with Rich Handball Realism Variety
    const winnerName = playerWins ? (playerClub?.name || matchData.playerClubName) : matchData.opponentName;
    const loserName = playerWins ? matchData.opponentName : (playerClub?.name || matchData.playerClubName);
    const activeCupLabel = isCupMatch ? (matchData.cupName || 'Cup Clash') : 'Decider';

    const events: Array<{ minute: number; text: string; icon: string; team: 'player' | 'opp' | 'neutral'; isTurningPoint?: boolean }> = [];

    // Slot 1: Minutes 10'–18' (Early Opening & Tone Setter)
    const slot1Roll = Math.random();
    if (slot1Roll < 0.35) {
      events.push({
        minute: 10 + Math.floor(Math.random() * 6),
        text: `🧤 Miraculous point-blank 6m kick save by the goalkeeper denies ${loserName} a clear breakthrough!`,
        icon: 'fas fa-hand-holding-hand',
        team: playerWins ? 'player' : 'opp'
      });
    } else if (slot1Roll < 0.65) {
      events.push({
        minute: 12 + Math.floor(Math.random() * 6),
        text: `⚡ First-wave lightning fast-break wing rush lasers into the top corner at full sprint!`,
        icon: 'fas fa-bolt',
        team: playerWins ? 'player' : 'opp'
      });
    } else {
      events.push({
        minute: 11 + Math.floor(Math.random() * 6),
        text: `📢 Deafening acoustic cauldron roar ignites the ${activeCupLabel} arena as ${loserName} mounts aggressive opening duels.`,
        icon: 'fas fa-bullhorn',
        team: 'neutral'
      });
    }

    // Slot 2: Minutes 22'–34' (Mid-Game Tactical & Physical Battle)
    const slot2Roll = Math.random();
    if (slot2Roll < 0.28) {
      events.push({
        minute: 24 + Math.floor(Math.random() * 6),
        text: `🤾‍♂️ Spectacular Kempa-Trick! Backcourt lob met in mid-air above the crease and hammered home!`,
        icon: 'fas fa-hands-clapping',
        team: playerWins ? 'player' : 'opp',
        isTurningPoint: true
      });
    } else if (slot2Roll < 0.54) {
      events.push({
        minute: 26 + Math.floor(Math.random() * 5),
        text: `⚡ 2-Minute Suspension: Bone-jarring body check on the 9m line stops a charging backcourt shooter.`,
        icon: 'fas fa-stopwatch',
        team: 'neutral'
      });
    } else if (slot2Roll < 0.78) {
      events.push({
        minute: 28 + Math.floor(Math.random() * 6),
        text: `🧤 7-Meter Penalty Denial: Goalkeeper reads the wrist angle and deflects the penalty with a high leg save!`,
        icon: 'fas fa-hand-holding-hand',
        team: playerWins ? 'player' : 'opp',
        isTurningPoint: true
      });
    } else {
      events.push({
        minute: 25 + Math.floor(Math.random() * 6),
        text: `🔥 Furious 4-0 Unanswered Run: Underdog momentum tilts the tie as ${winnerName} takes charge!`,
        icon: 'fas fa-fire',
        team: playerWins ? 'player' : 'opp',
        isTurningPoint: true
      });
    }

    // Slot 3: Minutes 36'–48' (Second-Half Tactical Gambles & Ref Drama)
    const slot3Roll = Math.random();
    if (slot3Roll < 0.30) {
      events.push({
        minute: 38 + Math.floor(Math.random() * 6),
        text: `🥅 7v6 Empty Net Tactical Gamble: Overload attack pulls the goalkeeper to punch through for a line pivot goal.`,
        icon: 'fas fa-users-gear',
        team: playerWins ? 'player' : 'opp'
      });
    } else if (slot3Roll < 0.55) {
      events.push({
        minute: 40 + Math.floor(Math.random() * 6),
        text: `🎯 35-Meter Empty-Net Goal: Interception on the 9m line! Defender lofts a full-court strike into the vacant net!`,
        icon: 'fas fa-bullseye',
        team: playerWins ? 'player' : 'opp',
        isTurningPoint: true
      });
    } else if (slot3Roll < 0.80) {
      events.push({
        minute: 44 + Math.floor(Math.random() * 5),
        text: `⚠️ Passive Play Warning: Referees raise hands with 4 passes left! Playmaker fires a desperate 10m laser that beats the block!`,
        icon: 'fas fa-triangle-exclamation',
        team: 'neutral'
      });
    } else {
      events.push({
        minute: 46 + Math.floor(Math.random() * 4),
        text: `🟥 Red Card Disqualification! Third 2-minute penalty forces an emotional defensive ejection from the match!`,
        icon: 'fas fa-square',
        team: 'neutral',
        isTurningPoint: true
      });
    }

    // Slot 4: Minutes 54'–60' (Crunch Time & Decisive Climax)
    if (chosenArchetype === 'overtime' || chosenArchetype === 'shootout') {
      events.push({
        minute: 59,
        text: `🔥 59' Buzzer-Beater Equalizer! Desperation 10-meter missile hits the underside of the bar with 2 seconds left to force overtime!`,
        icon: 'fas fa-fire',
        team: 'neutral',
        isTurningPoint: true
      });
    } else if (chosenArchetype === 'cup_upset' || chosenArchetype === 'nailbiter') {
      events.push({
        minute: 58 + Math.floor(Math.random() * 2),
        text: Math.random() < 0.5
          ? `🚀 Clutch Final-Minute Breakthrough: ${winnerName} slices through the 6:0 block to bury the cup-winning goal!`
          : `🧤 Heroic Buzzer Stop: Goalkeeper denies a 1-on-1 breakthrough with 3 seconds remaining to seal victory!`,
        icon: 'fas fa-trophy',
        team: playerWins ? 'player' : 'opp',
        isTurningPoint: true
      });
    } else if (chosenArchetype === 'defensive_duel') {
      events.push({
        minute: 59,
        text: `🛡️ Steel Curtain 6:0 Defense: Backcourt wall blocks two final shots as the buzzer sounds in a defensive masterclass!`,
        icon: 'fas fa-shield-halved',
        team: playerWins ? 'player' : 'opp',
        isTurningPoint: true
      });
    } else {
      events.push({
        minute: 58,
        text: `⚡ Decisive Fast Break: Rapid transition conversion seals an unassailable advantage for ${winnerName}!`,
        icon: 'fas fa-bolt',
        team: playerWins ? 'player' : 'opp',
        isTurningPoint: true
      });
    }

    // Slot 5: Overtime Drama (68' - 70') if applicable
    if (chosenArchetype === 'overtime') {
      events.push({
        minute: 68,
        text: `⚡ Overtime Drama: Thunderous 9m missile breaks the deadlock in extra time to send ${winnerName} through!`,
        icon: 'fas fa-bolt',
        team: playerWins ? 'player' : 'opp',
        isTurningPoint: true
      });
    } else if (chosenArchetype === 'shootout') {
      events.push({
        minute: 70,
        text: `🎯 70' Sudden-Death Penalty Shootout: Deadlocked after extra time! Match winner decided from the 7-meter line!`,
        icon: 'fas fa-crosshairs',
        team: 'neutral',
        isTurningPoint: true
      });
    }

    setMatchEvents(events);

    // 6. Interactive Match Initialization & Interval
    const ctx = {
      t: 0,
      s: [0, 0] as [number, number],
      targetPlayerFinal,
      targetOppFinal,
      playerWins,
      chosenArchetype,
      opponentOvr
    };
    matchContextRef.current = ctx;
    runMatchInterval(ctx);
  };

  const getClutchProbs = () => {
    if (!gkStats) return { power: 0, bounce: 0, lob: 0, specialist: 0 };
    const power = Math.max(0.1, 0.8 - gkStats.reflexes / 150);
    const bounce = Math.max(0.1, 0.7 - (gkStats.height > 1.95 ? 0.2 : 0));
    const lob = gkStats.reflexes > 85 ? 0.15 : 0.6;
    const specialist = 0.75;
    return { power, bounce, lob, specialist };
  };

  const executeClutch = (type: 'power' | 'bounce' | 'lob' | 'specialist') => {
    const probs = getClutchProbs();
    const isWin = Math.random() < probs[type];

    let msg = '';
    if (type === 'power') msg = isWin ? 'A thunderous strike rockets into the top corner!' : 'Saved! The goalkeeper read the sheer power.';
    if (type === 'bounce') msg = isWin ? 'Sneaky bounce shot skips beneath the keeper!' : 'Kick save! The tall frame deflected it.';
    if (type === 'lob') msg = isWin ? 'Audacious panenka lob leaves the arena roaring!' : 'Caught cleanly. Arrogance punished on the buzzer.';
    if (type === 'specialist') msg = isWin ? 'Ice in the veins. Specialist buries it with surgical precision.' : 'Unbelievable stop. The specialist is denied.';

    setResult(isWin);
    if (isWin) {
      setScore((prev) => [prev[0] + 1, prev[1]]);
    } else {
      setScore((prev) => [prev[0], prev[1] + 1]);
    }
    setFinishSuffix(' (p)');
    setClutchDesc(msg);
    setTimeout(() => {
      setStage('result');
    }, 2500);
  };

  const getResultWording = () => {
    const tier = matchData.tier || useGameStore.getState().club.tier || 1;
    if (matchData.type === 'championship_decider') {
      const lossText = matchData.isDirect
        ? `${matchData.opponentName} wins and steals the championship trophy!`
        : `${matchData.rivalName} wins their fixture and clinches the league title!`;
      return result
        ? `Victory confirmed! You are officially crowned Champions!`
        : tier > 1
        ? `${lossText} However, promotion as league runner-up remains secured!`
        : lossText;
    } else if (matchData.type === 'relegation_playoff') {
      return result
        ? `You held firm against ${matchData.opponentName} and retained your ${tier === 1 ? 'top-flight' : 'division'} status!`
        : `${matchData.opponentName} wins the decider and relegates your club.`;
    } else if (matchData.type === 'playoff') {
      return result
        ? `You conquered ${matchData.opponentName} to win promotion!`
        : `${matchData.opponentName} shuts down your promotion bid.`;
    } else if (matchData.type === 'rival_cup_clash') {
      return result
        ? `You ousted bitter rival ${matchData.opponentName} in spectacular fashion!`
        : `${matchData.opponentName} claims bragging rights and knocks you out.`;
    } else if (matchData.type === 'euro_supercup') {
      return result
        ? `You defeated ${matchData.opponentName} in ${hostArena} to lift the ${matchData.title || 'European Supercup'} curtain-raiser!`
        : `${matchData.opponentName} claims the ${matchData.title || 'European Supercup'} trophy.`;
    } else if (matchData.type === 'domestic_supercup') {
      return result
        ? `You defeated ${matchData.opponentName} in ${hostArena} to hoist the ${matchData.title || 'Supercup'} and open the new campaign with silverware!`
        : `${matchData.opponentName} wins the ${matchData.title || 'Supercup'} season curtain-raiser.`;
    } else if (isIhfMatch) {
      return result
        ? `You defeated ${matchData.opponentName} to lift the IHF Super Globe · Club World Championship trophy!`
        : `${matchData.opponentName} claims the Club World Championship title.`;
    } else if (matchData.type === 'cl_final') {
      return result
        ? `You defeated ${matchData.opponentName} to conquer Europe and lift the EHF Champions League!`
        : `${matchData.opponentName} takes the Champions League crown.`;
    } else if (
      matchData.type.includes('final') &&
      matchData.type !== 'cup_sf' &&
      matchData.type !== 'euro_cup_sf' &&
      matchData.type !== 'cl_sf'
    ) {
      return result
        ? `You defeated ${matchData.opponentName} to hoist the silverware!`
        : `${matchData.opponentName} wins the final.`;
    } else {
      return result
        ? `You defeated ${matchData.opponentName} and advance to the next round!`
        : `${matchData.opponentName} brings your cup run to a close.`;
    }
  };

  const getResultTitle = () => {
    if (matchData.type === 'relegation_playoff') {
      return result ? 'SURVIVAL SECURED!' : 'RELEGATED';
    }
    if (matchData.type === 'rival_cup_clash') {
      return result ? 'DERBY TRIUMPH!' : 'DERBY HEARTBREAK';
    }
    if (matchData.type === 'playoff') {
      return result ? 'PROMOTION WON!' : 'PLAYOFF DEFEAT';
    }
    if (matchData.type === 'championship_decider') {
      return result ? 'CHAMPIONS OF THE REALM!' : 'TITLE LOSS';
    }
    if (matchData.type === 'euro_supercup') {
      return result ? 'EUROPEAN SUPERCUP WINNERS!' : 'SUPERCUP DEFEAT';
    }
    if (matchData.type === 'domestic_supercup') {
      return result ? 'SUPERCUP CHAMPIONS!' : 'SUPERCUP DEFEAT';
    }
    if (isIhfMatch) {
      return result ? 'CLUB WORLD CHAMPIONS!' : 'WORLD FINAL DEFEAT';
    }
    if (matchData.type === 'cl_final') {
      return result ? 'CHAMPIONS OF EUROPE!' : 'FINAL DEFEAT';
    }
    return result ? 'VICTORY!' : 'DEFEAT';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl mx-auto rounded-[28px] bg-gradient-to-b from-[#181613] via-[#0f0e11] to-[#0a0a0c] border border-amber-500/35 shadow-[0_0_60px_-10px_rgba(245,158,11,0.25),0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[min(92dvh,92vh)]"
      >
        {/* Ambient Halo & Top Hairline Rim */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-88 h-48 rounded-full blur-[72px] opacity-25 pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: matchData.isRivalClash
              ? '#f43f5e'
              : matchData.type === 'relegation_playoff'
              ? '#dc2626'
              : broadcastPackage?.primaryColor || '#f59e0b',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />

        {/* ========================================================================= */}
        {/* OFFICIAL BROADCASTING SUITE HEADER BAR                                    */}
        {/* ========================================================================= */}
        <div className="w-full px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-white/[0.08] bg-black/40 flex items-center justify-between text-xs gap-2 relative z-20">
          {/* Left: Clean LIVE Indicator & Host Arena */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-950/40 border border-red-500/35 backdrop-blur-md shadow-[0_0_14px_rgba(239,68,68,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] text-[10px] font-mono font-bold text-red-100 shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_#ef4444]" />
              </span>
              <span>LIVE</span>
            </div>

            <span className="text-zinc-600 shrink-0">·</span>

            {/* Host Arena */}
            <div className="text-[10px] sm:text-[11px] text-zinc-300 font-mono flex items-center gap-1.5 min-w-0">
              <i className="fas fa-location-dot text-amber-400 text-[10px] shrink-0" />
              <span className="truncate">{hostArena}</span>
            </div>
          </div>

          {/* Right: Broadcaster Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <BroadcastLogo packageOrKey={broadcastPackage} size="sm" isModActive={isModActive} />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STAGE 1: INTRO / PRE-MATCH BROADCAST BUILDUP                              */}
        {/* ========================================================================= */}
        {stage === 'intro' && (
          <div ref={stageContainerRef} className="p-4 sm:p-6 flex flex-col gap-4 relative overflow-y-auto custom-scrollbar z-10 flex-1 min-h-0">
            {/* Top Match Card Plaque matching user screenshot */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {/* Left Trophy & Match Identity */}
              <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto min-w-0">
                {isRelegationBattle ? (
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl shadow-lg shrink-0">
                    <i className="fas fa-shield-halved animate-pulse" />
                  </div>
                ) : (
                  <TrophyGraphic
                    size="md"
                    showStars={true}
                    type={isIhfMatch ? 'globe' : isEuroMatch ? 'euro' : matchData.type === 'championship_decider' ? 'league' : 'cup'}
                  />
                )}

                <div className="flex flex-col min-w-0 flex-1">
                  {/* Pills Row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isRelegationBattle 
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' 
                        : isIhfMatch || isSupercupMatch
                        ? 'bg-amber-500/15 border border-amber-400/30 text-amber-300'
                        : 'bg-sky-500/15 border border-sky-400/30 text-sky-300'
                    }`}>
                      {isRelegationBattle
                        ? 'RELEGATION FIGHT'
                        : isIhfMatch
                        ? 'WORLD CHAMPIONSHIP'
                        : matchData.type === 'euro_supercup'
                        ? 'EUROPEAN SUPERCUP'
                        : matchData.type === 'domestic_supercup'
                        ? 'SUPERCUP OPENER'
                        : isEuroMatch
                        ? 'EUROPEAN CROWN'
                        : matchData.type === 'championship_decider'
                        ? 'TITLE RACE'
                        : matchData.type === 'playoff'
                        ? 'PROMOTION PLAYOFF'
                        : 'NATIONAL CUP'}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isRelegationBattle
                        ? 'bg-rose-950/50 border border-rose-700/40 text-rose-200'
                        : isSupercupMatch
                        ? 'bg-amber-950/50 border border-amber-500/30 text-amber-200'
                        : 'bg-white/[0.06] border border-white/10 text-zinc-300'
                    }`}>
                      {isRelegationBattle
                        ? 'SURVIVAL PLAYOFF'
                        : isSupercupMatch
                        ? 'FINAL'
                        : matchData.type?.includes('qf')
                        ? 'QUARTER-FINAL'
                        : matchData.type?.includes('sf')
                        ? 'SEMI-FINAL'
                        : matchData.type?.includes('final')
                        ? 'FINAL'
                        : isDecisionDay
                        ? 'DECISION DAY'
                        : 'KEY MATCH'}
                    </span>
                  </div>

                  {/* Cup / Competition Title */}
                  <h2 className="text-base sm:text-2xl font-black text-white tracking-tight leading-tight uppercase break-words">
                    {isRelegationBattle 
                      ? 'RELEGATION DECIDER · SURVIVAL BATTLE' 
                      : isSupercupMatch
                      ? matchData.title
                      : (matchData.cupName || (isIhfMatch ? 'IHF Super Globe · Club World Championship' : (matchData.type === 'cl_sf' || matchData.type === 'cl_final' ? 'EHF Champions League' : (isEuroMatch ? (matchData.subtitle?.toUpperCase().includes('EUROPEAN CUP') ? 'EHF European Cup' : 'EHF European League') : matchData.title))))}
                  </h2>

                  {/* Stadium & Capacity Subtitle */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 flex-wrap">
                    <i className="fas fa-location-dot text-amber-400 text-[11px] shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{hostArena}</span>
                    <span>·</span>
                    <span className="tabular-nums shrink-0">
                      {hostCapacity.toLocaleString()} capacity
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Head Coach Plaque */}
              <div className="w-full sm:w-auto shrink-0 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-extrabold font-mono">
                  HEAD COACH
                </span>
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  {useGameStore.getState().managerName || 'Head Coach'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                  {useGameStore.getState().tactic || 'Staff Lead'}
                </span>
              </div>
            </div>

            {/* Matchday Head-to-Head Card */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              {/* Header row */}
              <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2 text-zinc-300 font-bold uppercase tracking-wider text-[11px] flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-hand-fist text-amber-400 text-xs shrink-0" />
                    <span>HEAD TO HEAD MATCHUP</span>
                  </div>
                  {oppNarrativeTag && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wider animate-pulse ${oppNarrativeTag.className}`}>
                      {oppNarrativeTag.text}
                    </span>
                  )}
                </div>
                <div className="shrink-0 flex items-center">
                  <BroadcastLogo packageOrKey={broadcastPackage} size="xs" isModActive={isModActive} />
                </div>
              </div>

              {/* VS Head to Head Row */}
              <div className="grid grid-cols-5 items-center py-2 text-center">
                {/* Home Club */}
                <div className="col-span-2 flex flex-col items-center">
                  <ClubLogo
                    name={playerClub?.name || matchData.playerClubName}
                    color={playerClub?.color}
                    logo={playerClub?.logo}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-lg mb-1.5"
                    fallbackClassName="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center font-black text-xl text-white mb-1.5"
                  />
                  <div className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${getOvrColor(Math.min(100, matchData.playerOvr), 70)}`}>
                    {Math.min(100, matchData.playerOvr)}
                  </div>
                  <div className="text-white font-bold text-xs sm:text-sm tracking-tight truncate max-w-full mt-0.5">
                    {matchData.playerClubName}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
                    {useGameStore.getState().tactic?.toUpperCase() || 'TOTAL HANDBALL'}
                  </div>
                </div>

                {/* VS Center */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <span className="text-sm font-mono font-extrabold text-zinc-500">VS</span>
                  <span className="text-[10px] font-mono text-zinc-500 mt-0.5">60' K.O.</span>
                </div>

                {/* Away Club */}
                <div className="col-span-2 flex flex-col items-center">
                  <ClubLogo
                    name={oppClub?.name || matchData.opponentName}
                    color={oppClub?.color}
                    logo={oppClub?.logo}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-lg mb-1.5"
                    fallbackClassName="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center font-black text-xl text-white mb-1.5"
                  />
                  <div className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${getOvrColor(Math.min(100, matchData.opponentOvr), 70)}`}>
                    {Math.min(100, matchData.opponentOvr)}
                  </div>
                  <div className="text-white font-bold text-xs sm:text-sm tracking-tight truncate max-w-full mt-0.5">
                    {matchData.opponentName}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
                    {hasTacticalGenius ? (matchData.opponentTactic || 'AGGRESSIVE PRESS') : '???'}
                  </div>
                </div>
              </div>
            </div>

            {/* Standings Table on Decision Day */}
            {isDecisionDay && (
              <div className="w-full bg-white/[0.02] rounded-2xl p-3.5 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] text-left">
                <div className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] ${
                  isRelegationBattle ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <i className={`fas ${isRelegationBattle ? 'fa-triangle-exclamation text-rose-400' : 'fa-table-list text-amber-400'} text-xs`} />
                    <span>{isRelegationBattle ? 'RELEGATION BATTLE · LIVE DROP ZONE' : (broadcastPackage.decisionDayShow || 'OFFICIAL LIVE STANDINGS')}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('tactical-directives-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="sm:hidden px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-sans font-bold text-[10px] flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <i className="fas fa-bolt text-[9px]" />
                      <span>Tactics</span>
                    </button>
                    <span className="font-mono text-zinc-400 text-[10px]">
                      {isRelegationBattle ? 'SURVIVAL DECIDER' : 'FINAL MATCHDAY'}
                    </span>
                  </div>
                </div>

                {/* Table Column Headers */}
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-2.5 py-1 mb-1 border-b border-white/[0.04]">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="w-5 text-center shrink-0">#</span>
                    <span>Club</span>
                  </div>
                  <div className="flex items-center shrink-0 font-mono">
                    <span className="hidden sm:inline-block w-14 text-right pr-2">GD</span>
                    <span className="w-14 sm:w-20 text-right pr-1.5 sm:pr-2">PTS</span>
                    <span className="w-20 sm:w-24 text-right">Stake</span>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="flex flex-col gap-1.5 text-xs">
                  {(() => {
                    const activeTier = matchData.tier || playerClub?.tier || clubState?.tier || 1;
                    const activeCountry = matchData.broadcastPackage?.country || playerClub?.country || clubState?.country || 'GER';
                    const numTeams = matchData.numTeams || getLeagueSize(activeTier, activeCountry);
                    const totalMatches = (numTeams - 1) * 2;
                    const maxPts = totalMatches * 2;

                    const safePos = Math.max(1, numTeams - 3);
                    const poPos = Math.max(1, numTeams - 2);
                    const dropPos1 = Math.max(1, numTeams - 1);
                    const dropPos2 = numTeams;

                    const safePts = Math.max(10, Math.round(maxPts * 0.32));
                    const poPts = Math.max(8, safePts - 3);
                    const drop1Pts = Math.max(6, poPts - 1);
                    const drop2Pts = Math.max(4, drop1Pts - 4);

                    const tierClubs = getActiveClubs()
                      .filter(c => (c.country || 'GER') === activeCountry && c.tier === activeTier && c.name !== matchData.playerClubName && c.name !== matchData.opponentName)
                      .sort((a, b) => b.baseOvr - a.baseOvr);
                    const authenticTierOpp = tierClubs[0]?.name;

                    const defaultTierThird = activeTier === 2 
                      ? (activeCountry === 'FRA' ? 'Billère Handball' : activeCountry === 'ESP' ? 'BM Guadalajara' : 'TuS N-Lübbecke')
                      : activeTier >= 3 
                      ? 'HC Empor Rostock'
                      : (activeCountry === 'FRA' ? 'Montpellier Handball' : activeCountry === 'ESP' ? 'Fraikin BM Granollers' : activeCountry === 'POL' ? 'Orlen Wisła Płock' : 'Füchse Berlin');

                    const fallbackThird = authenticTierOpp || defaultTierThird;
                    const titleRival = matchData.rivalName || (matchData.isDirect ? matchData.opponentName : (fallbackThird || 'Title Contenders'));

                    let fallbackTable = [
                      { pos: 1, name: matchData.playerClubName, pts: Math.round(maxPts * 0.85), diff: '+124', stake: '🏆 TITLE' },
                      { pos: 2, name: titleRival, pts: Math.round(maxPts * 0.83), diff: '+118', stake: '🥈 2ND' },
                      { pos: 3, name: fallbackThird, pts: Math.round(maxPts * 0.74), diff: '+72', stake: '🥉 3RD' }
                    ];

                    if (isRelegationBattle) {
                      fallbackTable = [
                        { pos: safePos, name: 'Safe Contender', pts: safePts, diff: '-32', stake: '🛡️ SAFE' },
                        { pos: poPos, name: matchData.playerClubName, pts: poPts, diff: '-75', stake: '⚠️ PLAYOFF' },
                        { pos: dropPos1, name: matchData.opponentName, pts: drop1Pts, diff: '-88', stake: '⬇️ DROP' },
                        { pos: dropPos2, name: fallbackThird, pts: drop2Pts, diff: '-120', stake: '⬇️ DROP' }
                      ];
                    } else if (matchData.type === 'playoff') {
                      fallbackTable = [
                        { pos: 1, name: 'Title Winners', pts: Math.round(maxPts * 0.85), diff: '+112', stake: '🏆 TITLE' },
                        { pos: 2, name: fallbackThird || 'Runner-Up', pts: Math.round(maxPts * 0.76), diff: '+88', stake: '🥈 2ND' },
                        { pos: 3, name: matchData.playerClubName, pts: Math.round(maxPts * 0.70), diff: '+65', stake: '⚠️ PLAYOFF' }
                      ];
                    }

                    let rawRows = [...(matchData.standings || fallbackTable)];
                    if (result !== null) {
                      if (isRelegationBattle) {
                        if (result === true) {
                          // Survived!
                          rawRows = rawRows.map(t => {
                            if (t.name === matchData.playerClubName) {
                              return { ...t, pts: t.pts + 2, status: 'SAFE', stake: '🛡️ SURVIVED' };
                            }
                            if (t.name === matchData.opponentName) {
                              return { ...t, status: 'RELEGATED', stake: '⬇️ DROP' };
                            }
                            return t;
                          });
                        } else {
                          // Relegated
                          rawRows = rawRows.map(t => {
                            if (t.name === matchData.playerClubName) {
                              return { ...t, status: 'RELEGATED', stake: '⬇️ RELEGATED' };
                            }
                            if (t.name === matchData.opponentName) {
                              return { ...t, pts: t.pts + 2, status: 'SAFE', stake: '🛡️ SAFE' };
                            }
                            return t;
                          });
                        }
                      } else if (matchData.type === 'championship_decider') {
                        if (result === true) {
                          rawRows = rawRows.map(t => {
                            if (t.name === matchData.playerClubName) {
                              return { ...t, pos: 1, pts: t.pts + 2, status: '🏆 CHAMPIONS', stake: '🏆 CHAMPIONS' };
                            }
                            if (t.name === titleRival) {
                              return { ...t, pos: 2, status: '🥈 RUNNER-UP', stake: '🥈 2ND' };
                            }
                            return t;
                          });
                        } else {
                          rawRows = rawRows.map(t => {
                            if (t.name === matchData.playerClubName) {
                              return { ...t, pos: 2, status: '🥈 RUNNER-UP', stake: '🥈 2ND' };
                            }
                            if (t.name === titleRival) {
                              return { ...t, pos: 1, pts: t.pts + 2, status: '🏆 CHAMPIONS', stake: '🏆 CHAMPIONS' };
                            }
                            return t;
                          });
                        }
                      } else if (matchData.type === 'playoff') {
                        if (result === true) {
                          rawRows = rawRows.map(t => {
                            if (t.name === matchData.playerClubName) {
                              // Playoff winner maintains their authentic 3rd regular season position with PROMOTED stake!
                              return { ...t, pos: t.pos || 3, pts: t.pts + 2, status: '🏆 PROMOTED', stake: '🏆 PROMOTED' };
                            }
                            return t;
                          });
                        } else {
                          rawRows = rawRows.map(t => {
                            if (t.name === matchData.playerClubName) {
                              return { ...t, pos: t.pos || 3, status: 'ELIMINATED', stake: 'STAYS IN TIER' };
                            }
                            return t;
                          });
                        }
                      }
                    }

                    rawRows.sort((a: any, b: any) => (a.pos || 1) - (b.pos || 1));
                    return rawRows;
                  })().map((team: any, idx: number) => {
                    const isPlayer = team.name === matchData.playerClubName;
                    const isDrop = team.stake?.includes('DROP') || team.stake?.includes('RELEGATED') || team.status === 'RELEGATED';
                    const isPlayoff = team.stake?.includes('PLAYOFF') || team.status === 'PLAYOFF';
                    const isSafe = team.stake?.includes('SAFE') || team.stake?.includes('SURVIVED');

                    return (
                      <div
                        key={`${team.name}-${idx}`}
                        className={`flex items-center justify-between py-2 px-2.5 rounded-xl border transition ${
                          isPlayer
                            ? isRelegationBattle
                              ? (result === true 
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-bold shadow-sm' 
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-200 font-bold shadow-sm')
                              : 'bg-amber-400/10 border-amber-400/35 text-amber-200 font-bold shadow-sm'
                            : 'bg-black/30 border-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className={`w-5 text-center font-mono font-bold shrink-0 ${
                            isPlayer 
                              ? (isRelegationBattle 
                                  ? (result === true ? 'text-emerald-300 font-black' : 'text-rose-300 font-black') 
                                  : 'text-amber-300 font-black') 
                              : isDrop ? 'text-rose-500/70' : 'text-zinc-500'
                          }`}>
                            {team.pos}.
                          </span>
                          <span className={`truncate font-semibold ${isPlayer ? 'text-white' : 'text-zinc-200'}`}>
                            {team.name}
                          </span>
                        </div>
                        <div className="flex items-center shrink-0 font-mono">
                          <span className="hidden sm:inline-block w-14 text-right pr-2 text-zinc-400 tabular-nums text-xs font-semibold">
                            {team.diff || '+0'}
                          </span>
                          <span className={`w-14 sm:w-20 text-right pr-1.5 sm:pr-2 tabular-nums text-xs font-black ${
                            isPlayer 
                              ? (isRelegationBattle ? (result === true ? 'text-emerald-300' : 'text-rose-300') : 'text-amber-300') 
                              : 'text-white'
                          }`}>
                            {team.pts} <span className="hidden sm:inline text-[10px] font-bold text-zinc-400">PTS</span>
                          </span>
                          <div className="w-20 sm:w-24 flex justify-end">
                            {team.stake && (
                              <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md border font-bold tracking-tight shrink-0 ${
                                isDrop ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' :
                                isPlayoff ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
                                isSafe ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' :
                                team.stake?.includes('TITLE') || team.stake?.includes('CHAMPIONS') ? 'bg-amber-400/20 border-amber-400/40 text-amber-200' :
                                team.stake?.includes('PROMOTED') ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                                'bg-white/5 border-white/10 text-zinc-300'
                              }`}>
                                {team.stake}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Director Recommendation & Tactical Choices Header */}
            <div className="flex items-center justify-between gap-1 flex-wrap text-xs pt-1">
              <div className="flex items-center gap-2 text-white font-bold tracking-tight">
                <i className="fas fa-clipboard-list text-sky-400" />
                <span>Director Recommendation to Head Coach</span>
              </div>
              <span className="text-zinc-400 text-[11px] font-medium">Gameplan Approach</span>
            </div>

            {/* Cinderella Cup Factor Banner */}
            {isCupMatch && ((matchData.playerOvr || 75) < (matchData.opponentOvr || 75) - 3) && (
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/35 flex items-center gap-2.5 text-xs text-purple-200">
                <i className="fas fa-sparkles text-purple-400 text-xs shrink-0" />
                <span className="text-[11px] leading-tight">
                  <strong className="text-white">Cinderella Cup Momentum:</strong> Single-leg knockout magic is brewing. Underdogs historically mount spirited resistance and giant-killing surges!
                </span>
              </div>
            )}

            {/* Scouting Intelligence Banner */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] flex items-center gap-2.5 text-xs">
              <i className="fas fa-users-viewfinder text-zinc-400 text-xs shrink-0" />
              <div className="flex-1 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                <span className="text-zinc-300 font-semibold">Scouting Intelligence:</span>
                <span className="text-zinc-400 italic">
                  {hasTacticalGenius
                    ? 'Tactical Mastermind active: Opponent system mapped. Exploit transition lanes.'
                    : "Unlock 'Tactical Mastermind' to reveal opposing system"}
                </span>
              </div>
            </div>

            {/* 4 Tactical Directives matching Screenshot 1 & 3 */}
            <div id="tactical-directives-section" className="flex flex-col gap-2 w-full">
              {/* Option 1: Play to Squad Strengths (Executing Active Club Philosophy) */}
              {(() => {
                const getIdentitySubtitle = () => {
                  switch (userTactic) {
                    case 'Aggressive 6-0':
                      return 'Defensive 6:0 wall & physicality · Grinds tempo & forces tight 1–2 goal spreads (+2%)';
                    case 'Fast Break':
                      return 'High-paced transition & counter · Accelerates scoring tempo & rapid breaks (+2%)';
                    case 'Playmaker Focus':
                      return 'Structured set-plays & control · Minimizes turnovers and dictates match rhythm (+2%)';
                    case 'Offensive 3-2-1':
                      return 'Offensive defense & turnovers · Active pressure on opposing passing lanes (+2%)';
                    case '7v6 Empty Net':
                      return '7v6 extra attacker overload · Creates numerical advantage in front of goal (+2%)';
                    default:
                      return 'Disciplined execution of standard club identity · Baseline control (+2%)';
                  }
                };

                return (
                  <button
                    onClick={() => handlePlay('SquadStrengths', 2)}
                    className="group w-full p-3.5 sm:p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.08] hover:border-sky-400/40 transition duration-150 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] shadow-sm touch-manipulation"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-white font-bold text-xs sm:text-sm tracking-tight group-hover:text-sky-300 transition-colors">
                        Execute {userTactic || 'Squad'} Identity
                      </span>
                      <span className="text-zinc-400 text-[11px] sm:text-xs">
                        {getIdentitySubtitle()}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs whitespace-nowrap shrink-0">
                      {Math.min(92, safeBaseWinProb + 2)}% Win Prob
                    </span>
                  </button>
                );
              })()}

              {/* Option 2: High Press Gamble */}
              <button
                onClick={() => handlePlay('Aggressive51', 0)}
                className="group w-full p-3.5 sm:p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-400/40 transition duration-150 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] shadow-sm touch-manipulation"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-white font-bold text-xs sm:text-sm tracking-tight group-hover:text-amber-300 transition-colors">
                    High Press Gamble (High Risk)
                  </span>
                  <span className="text-zinc-400 text-[11px] sm:text-xs">
                    50% chance: +8% early shock / 50% risk: -6% late burnout
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs whitespace-nowrap shrink-0">
                  ±7% Dynamic
                </span>
              </button>

              {/* Option 3: All Out Attack */}
              <button
                onClick={() => handlePlay('AllOutAttack', 4)}
                className="group w-full p-3.5 sm:p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-400/40 transition duration-150 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] shadow-sm touch-manipulation"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-white font-bold text-xs sm:text-sm tracking-tight group-hover:text-emerald-300 transition-colors">
                    All Out Attack
                  </span>
                  <span className="text-zinc-400 text-[11px] sm:text-xs">
                    Offensive overload (+4% Win Prob) · Higher tempo & goals pace (+3)
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs whitespace-nowrap shrink-0">
                  {Math.min(92, safeBaseWinProb + 4)}% Win Prob
                </span>
              </button>

              {/* Option 4: 6:0 Defensive Wall */}
              <button
                onClick={() => handlePlay('Defense60', 3)}
                className="group w-full p-3.5 sm:p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.08] hover:border-indigo-400/40 transition duration-150 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] shadow-sm touch-manipulation"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-white font-bold text-xs sm:text-sm tracking-tight group-hover:text-indigo-300 transition-colors">
                    6:0 Defensive Wall
                  </span>
                  <span className="text-zinc-400 text-[11px] sm:text-xs">
                    Compact barrier (+3% Win Prob) · Low scoring, lane shutdown (-3)
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono font-bold text-xs whitespace-nowrap shrink-0">
                  {Math.min(90, safeBaseWinProb + 3)}% Win Prob
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: LIVE BROADCAST SCOREBUG & MATCH SIMULATION                       */}
        {/* ========================================================================= */}
        {stage === 'match' && (
          <div ref={stageContainerRef} className="p-5 sm:p-8 flex flex-col items-center text-center relative z-10 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {/* Competition Stage Label + 2x Speed / Instant Result Controls */}
            <div className="w-full flex items-center justify-between gap-2 mb-5 max-w-md flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 truncate">
                {matchData.cupName || matchData.title || 'MATCH SIMULATION'}
              </span>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={toggleSimSpeed}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer active:scale-95 ${
                    simSpeed === 2
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-white/[0.05] text-zinc-300 border-white/10 hover:bg-white/[0.1]'
                  }`}
                  title="Toggle 2x Match Playback Speed"
                >
                  ⚡ {simSpeed === 2 ? '2x SPEED' : '1x SPEED'}
                </button>
                <button
                  type="button"
                  onClick={handleInstantResult}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95"
                  title="Skip immediately to final match result"
                >
                  ⏩ Instant Result
                </button>
              </div>
            </div>

            {/* Scoreboard HUD */}
            <div className="grid grid-cols-3 items-center gap-2 sm:gap-8 mb-4 bg-gradient-to-b from-white/[0.04] to-transparent bg-[#12131a] p-4 sm:p-6 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl">
              <div className="flex flex-col items-center min-w-0">
                <span className="text-xs font-semibold text-zinc-300 truncate max-w-full mb-1">
                  {matchData.playerClubName}
                </span>
                <div className="text-4xl sm:text-6xl font-black tabular-nums text-white tracking-tight leading-none drop-shadow-lg">
                  {score[0]}
                </div>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <span className="text-xs font-semibold text-amber-400/60 uppercase">VS</span>
                <span className="text-base font-bold tabular-nums text-amber-400 my-1">{matchTime}'</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${matchTime > 60 ? 'text-purple-400 animate-pulse' : 'text-zinc-400'}`}>
                  {matchTime > 60 ? 'EXTRA TIME' : 'MIN'}
                </span>
              </div>

              <div className="flex flex-col items-center min-w-0">
                <span className="text-xs font-semibold text-zinc-300 truncate max-w-full mb-1">
                  {matchData.opponentName}
                </span>
                <div className="text-4xl sm:text-6xl font-black tabular-nums text-white tracking-tight leading-none drop-shadow-lg">
                  {score[1]}
                </div>
              </div>
            </div>

            {/* Clutch Buzzer-Beater Alert */}
            {matchTime >= 55 && Math.abs(score[0] - score[1]) <= 1 && (
              <div className="mb-3 px-3.5 py-1.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-black tracking-wide flex items-center justify-center gap-2 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)] w-full max-w-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>🚨 FINAL MINUTES BUZZER-BEATER: ONE-GOAL MARGIN</span>
              </div>
            )}

            {/* Goalkeeper In The Zone / The Wall Highlight */}
            {matchTime >= 35 && (score[0] + score[1] <= 42 || matchArchetype === 'defensive_duel') && (
              <div className="mb-3 px-3.5 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs font-bold tracking-wide flex items-center justify-center gap-2 w-full max-w-md">
                <span>🧤</span>
                <span>GOALKEEPER "THE WALL" — 44% CLUTCH SAVE EFFICIENCY</span>
              </div>
            )}

            {/* Live Match Highlights Feed */}
            {(() => {
              const activeEvent = matchEvents.filter((e) => e.minute <= matchTime).slice(-1)[0];
              if (!activeEvent) return null;
              return (
                <div
                  key={activeEvent.minute}
                  className={`mb-4 px-3.5 py-2 rounded-xl border text-xs max-w-md w-full flex items-center gap-2.5 shadow-md animate-fade-in ${
                    activeEvent.isTurningPoint
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-black/50 border-white/10 text-zinc-300'
                  }`}
                >
                  <span className="font-mono font-bold text-amber-400 shrink-0">{activeEvent.minute}'</span>
                  <i className={`${activeEvent.icon} text-amber-400 shrink-0 text-xs`} />
                  <span className="text-[11px] leading-snug flex-1 text-left break-words">{activeEvent.text}</span>
                </div>
              );
            })()}

            {/* Progress Bar with broadcast accent */}
            <div className="w-full max-w-md bg-white/[0.05] h-2 rounded-full overflow-hidden border border-white/5 mb-4">
              <div
                className="h-full transition-all duration-150 ease-linear rounded-full"
                style={{
                  width: `${(matchTime / 60) * 100}%`,
                  backgroundColor: broadcastPackage.primaryColor || '#f59e0b',
                }}
              />
            </div>

            {/* Lower-third broadcast ticker bug */}
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <i className="fas fa-satellite-dish text-amber-400 text-[10px]" />
              <span>{broadcastPackage.lowerThirdBug}</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: CLUTCH 7M PENALTY DECIDER                                        */}
        {/* ========================================================================= */}
        {stage === 'clutch_7m' && gkStats && (
          <div ref={stageContainerRef} className="p-5 sm:p-8 flex flex-col items-center relative z-10 w-full overflow-y-auto custom-scrollbar flex-1 min-h-0">
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-400">
                  FINAL BUZZER 7-METER THROW
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                CLUTCH PENALTY SPOT
              </h2>
              <p className="text-zinc-300 text-xs max-w-md mx-auto mt-1 leading-relaxed">
                Tied at {score[0]}-{score[1]} as the buzzer sounds. One throw remaining. Score to win, miss to lose.
              </p>
            </div>

            {/* Goalkeeper Scouting Card */}
            <div className="w-full max-w-md rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1">
                Opposing Goalkeeper Dossier
              </div>
              <div className="text-lg font-black text-white uppercase tracking-tight">{gkStats.name}</div>
              <div className="flex items-center justify-center gap-5 mt-2 text-xs font-mono">
                <span className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-zinc-300">
                  Reflexes: <strong className="text-amber-400">{gkStats.reflexes}</strong>
                </span>
                <span className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-zinc-300">
                  Frame: <strong className="text-sky-400">{gkStats.height.toFixed(2)}m</strong>
                </span>
              </div>
            </div>

            {/* Execution / Result Feedback */}
            {clutchDesc ? (
              <div className="w-full max-w-md p-6 rounded-2xl bg-black/60 border border-white/10 text-center animate-fade-in">
                <div className="text-4xl mb-3">{result ? '🎯' : '❌'}</div>
                <div className={`text-base font-black ${result ? 'text-emerald-400' : 'text-red-400'}`}>
                  {clutchDesc}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
                <button
                  onClick={() => executeClutch('power')}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-red-950/30 border border-white/10 hover:border-red-500/40 transition flex flex-col items-center gap-1 text-center cursor-pointer active:scale-95 touch-manipulation"
                >
                  <i className="fas fa-bolt text-red-400 text-base" />
                  <span className="font-extrabold text-white text-xs uppercase">Power Blast</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {(getClutchProbs().power * 100).toFixed(0)}% Success
                  </span>
                </button>
                <button
                  onClick={() => executeClutch('bounce')}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-amber-950/30 border border-white/10 hover:border-amber-500/40 transition flex flex-col items-center gap-1 text-center cursor-pointer active:scale-95 touch-manipulation"
                >
                  <i className="fas fa-angles-down text-amber-400 text-base" />
                  <span className="font-extrabold text-white text-xs uppercase">Bounce Shot</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {(getClutchProbs().bounce * 100).toFixed(0)}% Success
                  </span>
                </button>
                <button
                  onClick={() => executeClutch('lob')}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-sky-950/30 border border-white/10 hover:border-sky-500/40 transition flex flex-col items-center gap-1 text-center cursor-pointer active:scale-95 touch-manipulation"
                >
                  <i className="fas fa-arrow-up-right-dots text-sky-400 text-base" />
                  <span className="font-extrabold text-white text-xs uppercase">Panenka Lob</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {(getClutchProbs().lob * 100).toFixed(0)}% Success
                  </span>
                </button>
                <button
                  onClick={() => executeClutch('specialist')}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-purple-950/30 border border-white/10 hover:border-purple-500/40 transition flex flex-col items-center gap-1 text-center cursor-pointer active:scale-95 touch-manipulation"
                >
                  <i className="fas fa-star text-purple-400 text-base" />
                  <span className="font-extrabold text-white text-xs uppercase">7M Specialist</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {(getClutchProbs().specialist * 100).toFixed(0)}% Success
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: OFFICIAL BROADCAST POST-MATCH WRAP & RESULT                      */}
        {/* ========================================================================= */}
        {stage === 'result' && (
          <div ref={stageContainerRef} className="p-4 sm:p-8 flex flex-col items-center text-center relative z-10 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-amber-500/35 bg-black/40 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
              {matchData.type === 'relegation_playoff' && !result ? (
                <i className="fas fa-triangle-exclamation text-red-500 text-3xl animate-pulse" />
              ) : (
                <i
                  className={`fas ${
                    result ? 'fa-trophy text-amber-400' : 'fa-times text-red-500'
                  } text-3xl`}
                />
              )}
            </div>

            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <BroadcastLogo packageOrKey={broadcastPackage} size="sm" isModActive={isModActive} />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">
                {broadcastPackage.networkName} · POST-MATCH OFFICIAL WRAP
              </span>
            </div>

            {/* Title */}
            <h2
              className={`text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2 ${
                result
                  ? 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent'
                  : 'text-red-400'
              }`}
            >
              {getResultTitle()}
            </h2>

            {/* Match Drama Badge */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-black tracking-wider uppercase border shadow-sm ${
                matchArchetype === 'overtime' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                matchArchetype === 'shootout' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                matchArchetype === 'cup_upset' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                matchArchetype === 'blowout' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                matchArchetype === 'nailbiter' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                matchArchetype === 'defensive_duel' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                'bg-white/10 text-zinc-300 border-white/15'
              }`}>
                {matchArchetype === 'overtime' ? '⚡ OVERTIME THRILLER (AET)' :
                 matchArchetype === 'shootout' ? '🎯 7-METER SHOOTOUT (p)' :
                 matchArchetype === 'cup_upset' ? '🏆 CINDERELLA CUP MAGIC' :
                 matchArchetype === 'blowout' ? '🔥 RUNAWAY ROUT' :
                 matchArchetype === 'nailbiter' ? '⏱️ NAIL-BITER FINISH' :
                 matchArchetype === 'defensive_duel' ? '🛡️ DEFENSIVE GRIND' :
                 'DECISIVE CLASH'}
              </span>
            </div>

            {/* Final Score Bug */}
            <div className="flex items-baseline justify-center gap-6 my-3 bg-black/50 border border-white/10 px-8 py-3 rounded-2xl font-mono">
              <span className={`text-4xl sm:text-5xl font-black tracking-tight leading-none tabular-nums ${result ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {score[0]}
              </span>
              <span className="text-zinc-600 font-bold text-xl leading-none">-</span>
              <span className={`text-4xl sm:text-5xl font-black tracking-tight leading-none tabular-nums ${!result ? 'text-rose-400' : 'text-zinc-400'}`}>
                {score[1]}
              </span>
              {finishSuffix && (
                <span className="text-xs text-amber-400 font-mono font-bold leading-none">{finishSuffix}</span>
              )}
            </div>

            {/* Narrative Summary */}
            <p className="text-zinc-300 text-xs sm:text-sm font-normal max-w-md mx-auto leading-relaxed mb-4">
              {getResultWording()}
            </p>

            {/* Decisive Match Highlights Timeline */}
            {matchEvents.length > 0 && (
              <div className="w-full max-w-md bg-black/35 border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 mb-5 text-left shadow-lg">
                <div className="text-[10px] font-mono uppercase font-bold text-zinc-400 tracking-wider mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-list-check text-amber-400 text-xs" />
                    <span>Match Highlights Timeline</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider">
                    {isIhfMatch ? 'IHF SUPER GLOBE' : isCupMatch ? (matchData.cupName || 'CUP CLASH') : 'DECISIVE MATCH'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {matchEvents.map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs py-1 border-b border-white/[0.03] last:border-0">
                      <span className="font-mono text-[10px] font-extrabold text-amber-400/90 w-7 shrink-0 pt-0.5">{ev.minute}'</span>
                      <div className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                        <i className={`${ev.icon} text-[9px] ${ev.isTurningPoint ? 'text-amber-400' : 'text-zinc-400'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-[11px] sm:text-xs leading-relaxed block ${ev.isTurningPoint ? 'text-amber-100 font-semibold' : 'text-zinc-300'}`}>
                          {ev.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Continue */}
            <button
              onClick={() => onResolve(result || false, score as [number, number])}
              className="w-full sm:w-auto min-w-[200px] bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:via-yellow-200 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider py-3.5 px-8 sm:px-10 rounded-xl transition duration-150 active:scale-[0.98] cursor-pointer shadow-[0_6px_22px_-4px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.6)] border border-amber-300/40 touch-manipulation"
            >
              Continue Career
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
