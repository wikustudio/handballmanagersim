import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { formatMoney, COUNTRIES, sanitizePlayerName } from '../data/gameConstants';

export interface PlayerRevealModalProps {
  ovr: number;
  cost: number;
  isStar: boolean;
  name?: string;
  nationality?: string;
  position?: string;
  cardType?: 'galactico' | 'star' | 'youth';
  lang: string;
  onClose: () => void;
  returnToTransferMarket?: boolean;
}

interface CardData {
  name: string;
  pos: string;
  subtitle: string;
  flag: string;
  nationName: string;
  rating: number;
  stats: {
    label1: string; val1: number;
    label2: string; val2: number;
    label3: string; val3: number;
    label4: string; val4: number;
    label5: string; val5: number;
    label6: string; val6: number;
  };
}

const generateCardData = (
  isStar: boolean,
  ovrBoost: number,
  cardType: 'galactico' | 'star' | 'youth' | undefined,
  lang: string,
  propName?: string,
  propNat?: string,
  propPos?: string
): CardData => {
  const isDe = lang === 'de';
  const isGalactico = cardType === 'galactico' || (isStar && ovrBoost >= 4);

  // Positions
  const positions = ['ST', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
  const pos = propPos || positions[Math.floor(Math.random() * positions.length)];

  // Nationalities
  const nationPool: { code: string; name: string; flag: string; starNames: string[] }[] = [
    { code: 'FRA', name: 'France', flag: '🇫🇷', starNames: ['Mbappe', 'Griezmann', 'Camavinga', 'Tchouameni', 'Saliba', 'Hernandez'] },
    { code: 'BRA', name: 'Brazil', flag: '🇧🇷', starNames: ['Vinicius Jr.', 'Rodrygo', 'Neymar Jr.', 'Casemiro', 'Marquinhos', 'Alisson'] },
    { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', starNames: ['Bellingham', 'Kane', 'Saka', 'Foden', 'Rice', 'Alexander-Arnold'] },
    { code: 'ESP', name: 'Spain', flag: '🇪🇸', starNames: ['Rodri', 'Pedri', 'Gavi', 'Yamal', 'Carvajal', 'Morata'] },
    { code: 'GER', name: 'Germany', flag: '🇩🇪', starNames: ['Musiala', 'Wirtz', 'Kroos', 'Kimmich', 'Ruediger', 'Sane'] },
    { code: 'ARG', name: 'Argentina', flag: '🇦🇷', starNames: ['Messi', 'Lautaro', 'Alvarez', 'De Paul', 'Mac Allister', 'Romero'] },
    { code: 'POR', name: 'Portugal', flag: '🇵🇹', starNames: ['Cristiano', 'Bruno Fernandes', 'Bernardo Silva', 'Rafael Leao', 'Ruben Dias'] },
    { code: 'NOR', name: 'Norway', flag: '🇳🇴', starNames: ['Haaland', 'Odegaard', 'Ajer', 'Nusa', 'Bobb'] },
    { code: 'NED', name: 'Netherlands', flag: '🇳🇱', starNames: ['Van Dijk', 'De Jong', 'Gakpo', 'Simons', 'Dumfries', 'De Ligt'] },
    { code: 'BEL', name: 'Belgium', flag: '🇧🇪', starNames: ['De Bruyne', 'Lukaku', 'Doku', 'Onana', 'Tielemans', 'Courtois'] },
    { code: 'ITA', name: 'Italy', flag: '🇮🇹', starNames: ['Barella', 'Bastoni', 'Chiesa', 'Donnarumma', 'Dimarco', 'Tonali'] },
    { code: 'CRO', name: 'Croatia', flag: '🇭🇷', starNames: ['Modric', 'Gvardiol', 'Kovacic', 'Kramaric', 'Livakovic'] },
    { code: 'NGA', name: 'Nigeria', flag: '🇳🇬', starNames: ['Osimhen', 'Lookman', 'Chukwueze', 'Iwobi', 'Ndidi'] },
    { code: 'USA', name: 'USA', flag: '🇺🇸', starNames: ['Pulisic', 'McKennie', 'Musah', 'Weah', 'Balogun', 'Dest'] },
    { code: 'JPN', name: 'Japan', flag: '🇯🇵', starNames: ['Mitoma', 'Kubo', 'Endo', 'Tomiyasu', 'Minamino', 'Doan'] },
    { code: 'KOR', name: 'South Korea', flag: '🇰🇷', starNames: ['Son', 'Kim Min-jae', 'Lee Kang-in', 'Hwang Hee-chan'] }
  ];

  let selectedNation = nationPool[Math.floor(Math.random() * nationPool.length)];
  if (propNat) {
    const matched = nationPool.find(n => n.code === propNat || n.name.toUpperCase() === propNat.toUpperCase());
    if (matched) {
      selectedNation = matched;
    } else if (COUNTRIES[propNat]) {
      selectedNation = {
        code: propNat,
        name: COUNTRIES[propNat].name,
        flag: COUNTRIES[propNat].flag,
        starNames: ['Silva', 'Santos', 'Keller', 'Weber', 'Kovacs']
      };
    }
  }

  // Generate or use name
  let name = propName ? sanitizePlayerName(propName) : '';
  if (!name) {
    if (isGalactico) {
      name = selectedNation.starNames[Math.floor(Math.random() * selectedNation.starNames.length)];
    } else {
      const initials = ['L.', 'M.', 'A.', 'K.', 'J.', 'D.', 'E.', 'R.', 'S.', 'T.'];
      const initial = initials[Math.floor(Math.random() * initials.length)];
      const surname = selectedNation.starNames[Math.floor(Math.random() * selectedNation.starNames.length)];
      name = `${initial} ${surname}`;
    }
  }
  name = sanitizePlayerName(name);

  // Archetype & Subtitle
  let subtitle = '';
  if (isGalactico) {
    if (pos === 'GK') subtitle = isDe ? 'Weltklasse Torhüter · Mauer' : 'World-Class Keeper · Unbeatable';
    else if (['CB', 'LB', 'RB'].includes(pos)) subtitle = isDe ? 'Elite Abwehrchef · Titan' : 'Elite Commander · Iron Titan';
    else if (['CDM', 'CM'].includes(pos)) subtitle = isDe ? 'Galactico Spielmacher · Maestro' : 'Galactico Playmaker · Engine';
    else if (pos === 'CAM') subtitle = isDe ? 'Virtuoser Zehner · Zauberer' : 'Virtuoso No. 10 · Magician';
    else subtitle = isDe ? 'Superstar Torjäger · Weltklasse' : 'Superstar Striker · World-Class';
  } else if (cardType === 'youth') {
    if (pos === 'GK') subtitle = isDe ? 'Akademie-Juwel · Reflex-Wunder' : 'Academy Jewel · Reflex Phenom';
    else if (['CB', 'LB', 'RB', 'CDM'].includes(pos)) subtitle = isDe ? 'Top-Talent · Zweikampfstark' : 'Top Talent · Ball Winner';
    else if (['CM', 'CAM'].includes(pos)) subtitle = isDe ? 'Akademie-Regisseur · Vision' : 'Academy Director · High Vision';
    else subtitle = isDe ? 'Offensiv-Diamant · Abschlussstark' : 'Offensive Diamond · Clinical';
  } else {
    if (pos === 'GK') subtitle = isDe ? 'Routinierter Keeper · Fels' : 'Reliable Goalkeeper · Rock';
    else if (['CB', 'LB', 'RB', 'CDM'].includes(pos)) subtitle = isDe ? 'Defensiv-Anker · Präsenz' : 'Defensive Anchor · Solid';
    else if (['CM', 'CAM'].includes(pos)) subtitle = isDe ? 'Mittelfeld-Stratege' : 'Midfield Strategist';
    else subtitle = isDe ? 'Torgefährlicher Angreifer' : 'Dynamic Finisher';
  }

  // Base OVR
  const baseRating = isGalactico ? 90 + Math.min(6, ovrBoost) : (isStar ? 85 + ovrBoost : 80 + ovrBoost);
  const rating = Math.min(99, baseRating);

  // Balanced Tactical Stats
  const statFloor = isGalactico ? 84 : 76;
  const statMax = isGalactico ? 98 : 92;
  const genStat = (isPrimary: boolean) => {
    const min = isPrimary ? statFloor + 4 : statFloor - 6;
    const max = isPrimary ? statMax : statMax - 8;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  let stats;
  if (pos === 'GK') {
    stats = {
      label1: 'DIV', val1: genStat(true),
      label2: 'REF', val2: genStat(true),
      label3: 'HAN', val3: genStat(true),
      label4: 'SPE', val4: genStat(false),
      label5: 'KIC', val5: genStat(false),
      label6: 'POS', val6: genStat(true)
    };
  } else if (['CB', 'LB', 'RB'].includes(pos)) {
    stats = {
      label1: 'PAC', val1: genStat(pos !== 'CB'),
      label2: 'DEF', val2: genStat(true),
      label3: 'PHY', val3: genStat(true),
      label4: 'PAS', val4: genStat(false),
      label5: 'DRI', val5: genStat(false),
      label6: 'SHO', val6: genStat(false)
    };
  } else if (['CDM', 'CM'].includes(pos)) {
    stats = {
      label1: 'PAS', val1: genStat(true),
      label2: 'DRI', val2: genStat(true),
      label3: 'PHY', val3: genStat(true),
      label4: 'DEF', val4: genStat(pos === 'CDM'),
      label5: 'PAC', val5: genStat(false),
      label6: 'SHO', val6: genStat(false)
    };
  } else {
    // CAM, ST, RW, LW
    stats = {
      label1: 'PAC', val1: genStat(true),
      label2: 'SHO', val2: genStat(true),
      label3: 'DRI', val3: genStat(true),
      label4: 'PAS', val4: genStat(pos === 'CAM'),
      label5: 'PHY', val5: genStat(pos === 'ST'),
      label6: 'DEF', val6: genStat(false)
    };
  }

  return {
    name,
    pos,
    subtitle,
    flag: selectedNation.flag,
    nationName: selectedNation.name,
    rating,
    stats
  };
};

export const PlayerRevealModal: React.FC<PlayerRevealModalProps> = ({
  ovr,
  cost,
  isStar,
  name,
  nationality,
  position,
  cardType,
  lang,
  onClose,
  returnToTransferMarket = false
}) => {
  const isDe = lang === 'de';
  const isGalactico = cardType === 'galactico' || (isStar && ovr >= 4);
  const touchStartY = useRef<number | null>(null);

  // Instant zero-latency reveal
  const [isRevealed, setIsRevealed] = useState(true);

  // Stable Card Data
  const cardDataRef = useRef<CardData | null>(null);
  if (!cardDataRef.current) {
    cardDataRef.current = generateCardData(isStar, ovr, cardType, lang, name, nationality, position);
  }
  const cardData = cardDataRef.current;

  // Immediate safe confetti trigger on mount
  useEffect(() => {
    let animId: number;
    try {
      animId = requestAnimationFrame(() => {
        try {
          confetti({
            particleCount: isGalactico ? 85 : 55,
            spread: 80,
            origin: { y: 0.55 },
            colors: isGalactico 
              ? ['#f59e0b', '#fbbf24', '#ffffff', '#38bdf8'] 
              : ['#38bdf8', '#34d399', '#ffffff']
          });
        } catch {
          // safe fallback
        }
      });
    } catch {
      // safe fallback
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isGalactico]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  // 10s Safety Watchdog Timer: Guarantee modal auto-dismissal if left unattended or trapped
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Touch Swipe-Down Dismissal
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 60) {
        onClose();
      }
      touchStartY.current = null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto overscroll-contain select-none cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full max-w-[340px] sm:max-w-[380px] bg-[#12141c]/95 backdrop-blur-3xl rounded-[28px] border ${
          isGalactico 
            ? 'border-amber-400/35 shadow-[0_24px_64px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.22)]' 
            : 'border-sky-400/30 shadow-[0_24px_64px_rgba(0,0,0,0.8),0_0_40px_rgba(56,189,248,0.18)]'
        } p-4 sm:p-5 flex flex-col gap-3.5 my-auto overflow-hidden text-left cursor-default`}
      >
        {/* Elite Ambient Aura Glow */}
        <div className={`absolute -top-24 -right-24 w-60 h-60 ${isGalactico ? 'bg-amber-500/15' : 'bg-sky-500/12'} rounded-full blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-24 -left-24 w-60 h-60 ${isGalactico ? 'bg-amber-400/10' : 'bg-emerald-500/10'} rounded-full blur-3xl pointer-events-none`} />

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            /* Split-Second Anticipation State (400ms pulse & golden silhouette) */
            <motion.div
              key="anticipation"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center justify-center py-10 px-3 gap-5 text-center relative z-10"
            >
              <div className="relative">
                <div className={`w-28 h-28 rounded-3xl ${
                  isGalactico 
                    ? 'bg-amber-500/15 border-2 border-amber-400/50 shadow-[0_0_45px_rgba(245,158,11,0.45)]' 
                    : 'bg-sky-500/15 border-2 border-sky-400/50 shadow-[0_0_45px_rgba(56,189,248,0.35)]'
                } flex flex-col items-center justify-center animate-pulse`}>
                  <i className={`${isGalactico ? 'fa-solid fa-crown text-amber-300' : 'fa-solid fa-user-astronaut text-sky-300'} text-4xl`}></i>
                  <div className="flex items-center gap-1 text-[9px] text-amber-400 mt-2">
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-3xl ring-4 ring-amber-400/25 animate-ping pointer-events-none" />
              </div>

              <div className="flex flex-col gap-1 items-center">
                <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${isGalactico ? 'text-amber-400' : 'text-sky-400'}`}>
                  {isGalactico ? (isDe ? 'GALACTICO ENTDECKUNG...' : 'GALACTICO SIGHTING...') : (isDe ? 'STAR-VERPFLICHTUNG...' : 'SIGNING CONFIRMED...')}
                </span>
                <div className="text-3xl font-black text-white tracking-tight font-mono">
                  +{ovr} OVR
                </div>
                <p className="text-[11px] text-zinc-400 font-normal">
                  {isDe ? 'Werte werden entschlüsselt...' : 'Scouting report compiling...'}
                </p>
              </div>
            </motion.div>
          ) : (
            /* Revealed Card (Instant smooth scale & opacity entry, zero edge-on deadlock) */
            <motion.div
              key="revealed"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-3.5 relative z-10"
            >
              {/* Top Header Strip */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${isGalactico ? 'bg-amber-500/15 border-amber-400/30 text-amber-400' : 'bg-sky-500/15 border-sky-400/30 text-sky-400'} border flex items-center justify-center text-xs shadow-inner`}>
                    <i className={isGalactico ? "fa-solid fa-crown" : "fa-solid fa-star"}></i>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isGalactico ? 'text-amber-400' : 'text-sky-400'}`}>
                      {isGalactico 
                        ? (isDe ? 'Galactico-Verpflichtung' : 'Galactico Marquee Signing')
                        : (cardType === 'youth' ? (isDe ? 'Akademie-Aufstieg' : 'Academy Graduate') : (isDe ? 'Star-Verpflichtung' : 'Marquee Signing'))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close card modal"
                  className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.08] cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>

              {/* Hero Identity Section */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-3">
                {/* Left: OVR, Position, Nation */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tighter tabular-nums ${isGalactico ? 'text-amber-300' : 'text-sky-300'}`}>
                      {cardData.rating}
                    </span>
                    <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${isGalactico ? 'bg-amber-400/20 text-amber-300' : 'bg-sky-400/20 text-sky-300'}`}>
                      +{ovr} OVR
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold mt-1">
                    <span className="text-base leading-none">{cardData.flag}</span>
                    <span className="text-white font-bold">{cardData.pos}</span>
                    <span className="text-zinc-600 font-normal">·</span>
                    <span className="text-zinc-400 font-normal truncate max-w-[120px]">{cardData.nationName}</span>
                  </div>
                </div>

                {/* Right: Superstar Emblem / Avatar with Aura Ring */}
                <div className="relative shrink-0">
                  <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br ${
                    isGalactico 
                      ? 'from-amber-500/25 via-zinc-800 to-zinc-950 border-amber-400/40 shadow-[0_0_24px_rgba(245,158,11,0.3)]' 
                      : 'from-sky-500/25 via-zinc-800 to-zinc-950 border-sky-400/40 shadow-[0_0_24px_rgba(56,189,248,0.25)]'
                  } border flex flex-col items-center justify-center relative overflow-hidden group`}>
                    <i className={`${isGalactico ? 'fa-solid fa-crown text-amber-300' : 'fa-solid fa-user-astronaut text-sky-300'} text-2xl`}></i>
                    <div className="flex items-center gap-0.5 text-[8px] text-amber-400 mt-1">
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      {isGalactico && <i className="fa-solid fa-star"></i>}
                      {isGalactico && <i className="fa-solid fa-star"></i>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Name & Trait */}
              <div className="px-1">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-none truncate">
                  {cardData.name}
                </h1>
                <p className={`text-xs font-semibold mt-1 flex items-center gap-1.5 ${isGalactico ? 'text-amber-300/90' : 'text-sky-300/90'}`}>
                  <i className="fa-solid fa-sparkles text-[10px]"></i>
                  <span className="truncate">{cardData.subtitle}</span>
                </p>
              </div>

              {/* Tactical Stats Matrix (6 Key Attributes) */}
              <div className="grid grid-cols-3 gap-1.5 text-left">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{cardData.stats.label1}</span>
                  <span className="font-mono font-bold text-sm text-white tabular-nums">{cardData.stats.val1}</span>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{cardData.stats.label2}</span>
                  <span className="font-mono font-bold text-sm text-white tabular-nums">{cardData.stats.val2}</span>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{cardData.stats.label3}</span>
                  <span className="font-mono font-bold text-sm text-white tabular-nums">{cardData.stats.val3}</span>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{cardData.stats.label4}</span>
                  <span className="font-mono font-bold text-sm text-white tabular-nums">{cardData.stats.val4}</span>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{cardData.stats.label5}</span>
                  <span className="font-mono font-bold text-sm text-white tabular-nums">{cardData.stats.val5}</span>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">{cardData.stats.label6}</span>
                  <span className="font-mono font-bold text-sm text-white tabular-nums">{cardData.stats.val6}</span>
                </div>
              </div>

              {/* Transaction & Impact Summary Strip */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs px-1">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">
                    {isDe ? 'Transfergebühr' : 'Transfer Fee'}
                  </div>
                  <div className={`font-mono font-bold ${cost > 0 ? 'text-zinc-200' : 'text-emerald-400'}`}>
                    {cost > 0 ? `-${formatMoney(cost)}` : (isDe ? 'KOSTENLOS' : 'FREE')}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">
                    {isDe ? 'Kader-Auswirkung' : 'Squad Impact'}
                  </div>
                  <div className={`font-mono font-bold ${isGalactico ? 'text-amber-300' : 'text-emerald-400'}`}>
                    {isGalactico ? `+${ovr} OVR · +5k Fans` : `+${ovr} Team OVR`}
                  </div>
                </div>
              </div>

              {/* Mobile-Ready Bottom Action Button */}
              <div className="pt-1 flex flex-col gap-1.5">
                <button
                  onClick={onClose}
                  className={`w-full min-h-[46px] py-2.5 px-4 rounded-xl ${
                    isGalactico 
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.3)]' 
                      : 'bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-500 hover:brightness-110 text-slate-950 shadow-[0_4px_16px_rgba(56,189,248,0.3)]'
                  } font-bold text-sm tracking-wide transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2`}
                >
                  <span>
                    {returnToTransferMarket
                      ? (isDe ? 'Zurück zum Transfermarkt' : 'Return to Transfer Market')
                      : (isDe ? 'Weiter zum Kader' : 'Continue to Squad')}
                  </span>
                  <i className="fa-solid fa-arrow-right text-xs"></i>
                </button>
                
                <div className="text-center text-[10px] text-zinc-500 tracking-tight">
                  {isDe ? 'Tippen oder nach unten wischen zum Schließen' : 'Tap or swipe down to dismiss'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
