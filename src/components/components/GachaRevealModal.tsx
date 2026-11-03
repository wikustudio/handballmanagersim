import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerRealisticConfetti } from '../utils/confettiHelper';
import { Club } from '../types';
import { useModalDismiss } from '../utils/modalUtils';

interface GachaRevealModalProps {
  revealData: {
    type: string;
    cost: number;
    gain: number;
    ovr: number;
    name?: string;
    position?: string;
    playstyle?: string;
    age?: number;
    nationality?: string;
    clubName?: string;
  } | null;
  club?: Club;
  onClose: () => void;
  lang: 'en' | 'de' | 'es';
}

const COUNTRY_FLAGS: Record<string, string> = {
  GER: '🇩🇪',
  FRA: '🇫🇷',
  ESP: '🇪🇸',
  DEN: '🇩🇰',
  SWE: '🇸🇪',
  NOR: '🇳🇴',
  CRO: '🇭🇷',
  POL: '🇵🇱',
  HUN: '🇭🇺',
  POR: '🇵🇹',
  ISL: '🇮🇸',
  AUT: '🇦🇹',
  SUI: '🇨🇭',
  ITA: '🇮🇹',
  SLO: '🇸🇮',
  MKD: '🇲🇰',
  USA: '🇺🇸',
  ECU: '🇪🇨',
};

const COUNTRY_NAMES_EN: Record<string, string> = {
  GER: 'Germany',
  FRA: 'France',
  ESP: 'Spain',
  DEN: 'Denmark',
  SWE: 'Sweden',
  NOR: 'Norway',
  CRO: 'Croatia',
  POL: 'Poland',
  HUN: 'Hungary',
  POR: 'Portugal',
  ISL: 'Iceland',
  AUT: 'Austria',
  SUI: 'Switzerland',
  USA: 'United States',
  ECU: 'Ecuador',
};

const COUNTRY_NAMES_DE: Record<string, string> = {
  GER: 'Deutschland',
  FRA: 'Frankreich',
  ESP: 'Spanien',
  DEN: 'Dänemark',
  SWE: 'Schweden',
  NOR: 'Norwegen',
  CRO: 'Kroatien',
  POL: 'Polen',
  HUN: 'Ungarn',
  POR: 'Portugal',
  ISL: 'Island',
  AUT: 'Österreich',
  SUI: 'Schweiz',
  USA: 'USA',
  ECU: 'Ecuador',
};

const DEFAULT_NAMES: Record<string, { first: string[]; last: string[] }> = {
  GER: { first: ['Lukas', 'Julian', 'Jonas', 'Leon', 'Felix', 'Finn', 'Paul', 'Niklas'], last: ['Weber', 'Schneider', 'Fischer', 'Hoffmann', 'Bauer', 'Wagner', 'Richter', 'Köster'] },
  DEN: { first: ['Mikkel', 'Mathias', 'Magnus', 'Emil', 'Nikolaj', 'Rasmus', 'Lasse'], last: ['Hansen', 'Gidsel', 'Landin', 'Saugstrup', 'Pytlick', 'Kirkeløkke', 'Lauge'] },
  FRA: { first: ['Dika', 'Melvyn', 'Nedim', 'Valentin', 'Ludovic', 'Elohim', 'Aymeric'], last: ['Mem', 'Richardson', 'Remili', 'Porte', 'Fabregas', 'Prandi', 'Minne'] },
  ESP: { first: ['Alex', 'Daniel', 'Ferran', 'Aleix', 'Gonzalo', 'Jorge', 'Ian'], last: ['Dujshebaev', 'Sarmiento', 'Sole', 'Gomez', 'Perez de Vargas', 'Maqueda', 'Tarrafeta'] },
  SWE: { first: ['Jim', 'Felix', 'Albin', 'Hampus', 'Andreas', 'Lucas', 'Max'], last: ['Gottfridsson', 'Claars', 'Lagergren', 'Wanne', 'Palicka', 'Pellas', 'Darj'] },
  CRO: { first: ['Domagoj', 'Luka', 'Ivan', 'Zvonimir', 'Marin', 'David', 'Tin'], last: ['Duvnjak', 'Cindric', 'Martinovic', 'Sego', 'Mandic', 'Lucin', 'Sipic'] },
  POL: { first: ['Szymon', 'Arkadiusz', 'Kamil', 'Michal', 'Piotr', 'Maciej'], last: ['Sicko', 'Moryto', 'Syprzak', 'Daszek', 'Gebala', 'Jurecki', 'Kornecki'] },
  NOR: { first: ['Sander', 'Christian', 'Torbjorn', 'Magnus', 'Goran', 'Harald'], last: ['Sagosen', 'O\'Sullivan', 'Bergerud', 'Rod', 'Johannessen', 'Reinkind'] },
  HUN: { first: ['Bence', 'Mate', 'Dominik', 'Richard', 'Zoran', 'Patrik'], last: ['Banhidi', 'Lekai', 'Mathe', 'Bodo', 'Ilic', 'Ligetvari'] },
  POR: { first: ['Martim', 'Kiko', 'Rui', 'Pedro', 'Alexandre', 'Victor'], last: ['Costa', 'Silva', 'Portela', 'Cavalcanti', 'Iturriza', 'Areia'] },
  ISL: { first: ['Aron', 'Omar', 'Gisli', 'Bjarki', 'Viktor', 'Elvar'], last: ['Palmarsson', 'Magnusson', 'Kristjansson', 'Elisson', 'Hallgrimsson', 'Jonsson'] },
  AUT: { first: ['Nikola', 'Robert', 'Lukas', 'Sebastian', 'Boris', 'Constantin'], last: ['Bilyk', 'Weber', 'Hutecek', 'Frimmel', 'Zivkovic', 'Mostl'] },
  SUI: { first: ['Andy', 'Nikola', 'Lenny', 'Lucas', 'Samuel', 'Lukas'], last: ['Schmid', 'Portner', 'Rubin', 'Meister', 'Zehnder', 'von Deschwanden'] },
};

export const GachaRevealModal: React.FC<GachaRevealModalProps> = ({ revealData, club, onClose, lang }) => {
  useModalDismiss(onClose, Boolean(revealData));
  const [isSuspensePhase, setIsSuspensePhase] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRevealedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const tr = (en: string, de?: string, _es?: string) => (lang === 'de' && de ? de : en);

  const handleReveal = () => {
    if (hasRevealedRef.current) return;
    hasRevealedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsSuspensePhase(false);
    setFlipped(true);
    setShowContinue(true);
    if (revealData && revealData.gain >= 3) {
      try {
        setTimeout(triggerRealisticConfetti, 150);
      } catch (err) {
        // Safe fallback
      }
    }
  };

  useEffect(() => {
    if (!revealData) return;

    // Reset state for new reveal data
    hasRevealedRef.current = false;
    setIsSuspensePhase(true);
    setFlipped(false);
    setShowContinue(false);

    // Mandatory 1.7-second suspense delay before slamming card rating
    timerRef.current = setTimeout(() => {
      handleReveal();
    }, 1700);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [revealData]);

  useEffect(() => {
    if (!revealData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (flipped) {
          onCloseRef.current();
        } else {
          handleReveal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, revealData]);

  const country = revealData?.nationality || club?.country || 'GER';
  const flag = COUNTRY_FLAGS[country] || '🌐';
  const countryName = COUNTRY_NAMES_EN[country] || country;

  const isSuperstar = revealData?.type === 'superstar';
  const isYouth = revealData?.type === 'youth';
  const isKey = revealData?.type === 'key';

  const cardDetails = useMemo(() => {
    if (!revealData) return null;

    const namePool = DEFAULT_NAMES[country] || DEFAULT_NAMES['GER'];
    const generatedFirstName = namePool.first[Math.floor(Math.random() * namePool.first.length)];
    const generatedLastName = namePool.last[Math.floor(Math.random() * namePool.last.length)];
    
    let playerName = revealData.name;
    if (!playerName || playerName.includes('SIGNING') || playerName.includes('TALENT') || playerName.includes('PLAYER')) {
      playerName = `${generatedFirstName} ${generatedLastName}`;
    }

    const positions = ['CB', 'LB', 'RB', 'LW', 'RW', 'P', 'GK'];
    const playerPosition = revealData.position || positions[Math.floor(Math.random() * positions.length)];
    const isGK = playerPosition === 'GK';

    const jerseyNumber = Math.floor(Math.random() * 88) + 2;
    const playerAge = revealData.age || (isYouth ? Math.floor(Math.random() * 3) + 16 : isSuperstar ? Math.floor(Math.random() * 5) + 25 : Math.floor(Math.random() * 8) + 23);
    const playerHeight = isGK ? '1.98 m' : playerPosition === 'P' ? '1.96 m' : playerPosition.includes('W') ? '1.85 m' : '1.94 m';

    const defaultPlaystyles: Record<string, string[]> = {
      CB: ['Playmaking Maestro', 'Tempo Dictator', '7v6 Specialist', 'Breakthrough Artist'],
      LB: ['9m Jump Shot Gunner', 'Power Shooter', 'Defense Anchor & Blocker', 'Clutch Scorer'],
      RB: ['Left-Handed 9m Hammer', 'Cut-in Specialist', 'Transition Engine', 'Long Range Artist'],
      LW: ['Acrobatic Wing Finisher', 'Fast-Break Flyer', 'Spin Shot Specialist', 'Steal Hunter'],
      RW: ['Acrobatic Wing Finisher', 'Fast-Break Flyer', 'Spin Shot Specialist', 'Angle Master'],
      P: ['Dominant Line Pivot', '6-0 Defense Pillar', 'Screen & Roll Master', 'Low Post Bruiser'],
      GK: ['Penalty Stop Specialist', 'Wall of Reflexes', 'Fast Break Quarterback', '1v1 Angles Master'],
    };
    const playstyleList = defaultPlaystyles[playerPosition] || defaultPlaystyles['CB'];
    const playerPlaystyle = revealData.playstyle || playstyleList[Math.floor(Math.random() * playstyleList.length)];

    const finalOvr = revealData.ovr;
    const baseTarget = Math.max(55, Math.min(96, finalOvr + (isSuperstar ? 4 : isKey ? 2 : 0)));
    const attr1 = Math.min(99, Math.max(60, baseTarget + Math.floor(Math.random() * 7 - 3)));
    const attr2 = Math.min(99, Math.max(60, baseTarget + Math.floor(Math.random() * 7 - 3)));
    const attr3 = Math.min(99, Math.max(60, baseTarget + Math.floor(Math.random() * 7 - 3)));
    const attr4 = Math.min(99, Math.max(60, baseTarget + Math.floor(Math.random() * 7 - 3)));

    return {
      playerName,
      playerPosition,
      isGK,
      jerseyNumber,
      playerAge,
      playerHeight,
      playerPlaystyle,
      finalOvr,
      attr1,
      attr2,
      attr3,
      attr4
    };
  }, [revealData, country, isYouth, isSuperstar, isKey]);

  if (!revealData || !cardDetails) return null;

  const {
    playerName,
    playerPosition,
    isGK,
    jerseyNumber,
    playerAge,
    playerHeight,
    playerPlaystyle,
    finalOvr,
    attr1,
    attr2,
    attr3,
    attr4
  } = cardDetails;

  const theme = isSuperstar
    ? {
        tierLabel: tr('World Class Signing', 'Weltklasse-Verpflichtung'),
        tierBadge: 'from-amber-400 via-amber-300 to-yellow-500',
        borderColor: 'border-amber-400/50',
        ambientGlow: 'from-amber-500/25 via-yellow-500/15 to-transparent',
        badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
        accentColor: 'text-amber-400',
        stamp: tr('★ WORLD CLASS RECRUITMENT ★', '★ WELTKLASSE-TRANSFER ★')
      }
    : isKey
    ? {
        tierLabel: tr('Key Senior Signing', 'Schlüsselspieler-Transfer'),
        tierBadge: 'from-sky-400 via-blue-400 to-indigo-500',
        borderColor: 'border-sky-400/50',
        ambientGlow: 'from-sky-500/25 via-blue-500/15 to-transparent',
        badgeBg: 'bg-sky-500/20 border-sky-400/40 text-sky-300',
        accentColor: 'text-sky-400',
        stamp: tr('★ KEY FIRST-TEAM ACQUISITION ★', '★ STAMM-VERPFLICHTUNG ★')
      }
    : isYouth
    ? {
        tierLabel: tr('Academy Golden Prospect', 'Top-Nachwuchstalent'),
        tierBadge: 'from-emerald-400 via-teal-300 to-emerald-600',
        borderColor: 'border-emerald-400/50',
        ambientGlow: 'from-emerald-500/25 via-teal-500/15 to-transparent',
        badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
        accentColor: 'text-emerald-400',
        stamp: tr('★ ACADEMY TALENT DISCOVERY ★', '★ NACHWUCHS-ENTDECKUNG ★')
      }
    : {
        tierLabel: tr('Senior Squad Addition', 'Kader-Neuzugang'),
        tierBadge: 'from-zinc-200 via-zinc-400 to-zinc-500',
        borderColor: 'border-white/30',
        ambientGlow: 'from-white/15 to-transparent',
        badgeBg: 'bg-white/15 border-white/30 text-zinc-300',
        accentColor: 'text-white',
        stamp: tr('★ OFFICIAL CONTRACT SIGNING ★', '★ OFFIZIELLER VERTRAGSABSCHLUSS ★')
      };

  const impactText = revealData.gain > 0 ? `+${revealData.gain}` : `${revealData.gain}`;

  const attributes = isGK
    ? [
        { label: 'REF', desc: tr('Reflexes', 'Reflexe'), value: attr1 },
        { label: 'POS', desc: tr('Angles & Position', 'Stellungsspiel'), value: attr2 },
        { label: 'DIS', desc: tr('Outlet Passes', 'Gegenstoßpass'), value: attr3 },
        { label: '7M', desc: tr('Penalty Stops', '7m-Paraden'), value: attr4 }
      ]
    : [
        { label: 'SHT', desc: tr('Shot Velocity & Finish', 'Wurf & Abschluss'), value: attr1 },
        { label: 'TAC', desc: tr('Playmaking & Vision', 'Taktik & Pass'), value: attr2 },
        { label: 'DEF', desc: tr('Defense & Physicality', 'Abwehr & Physis'), value: attr3 },
        { label: 'AGI', desc: tr('Counter Pace & Agility', 'Tempo & Dynamik'), value: attr4 }
      ];

  const scoutingVerdict = isSuperstar
    ? tr(
        'An unstoppable game-changer boasting elite handball instincts, commanding the court in high-pressure crunch time.',
        'Ein Weltklasse-Unterschiedsspieler mit überragendem Handball-Instinkt, der die Partie in entscheidenden Phasen dominiert.'
      )
    : isYouth
    ? tr(
        'Enormous athletic ceiling with outstanding throwing mechanics and modern tactical maturity beyond his years.',
        'Enormes athletisches Entwicklungspotenzial mit hervorragender Wurftechnik und beachtlicher taktischer Reife.'
      )
    : tr(
        'Experienced first-team starter providing immediate stability, tactical discipline, and clinical execution.',
        'Erfahrener Leistungsträger, der dem Kader sofortige Stabilität, taktische Disziplin und Treffsicherheit verleiht.'
      );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 overflow-y-auto cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Safety Close Button (Always visible) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-[10020] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/10 cursor-pointer shadow-lg active:scale-95"
          title={tr('Close', 'Schließen')}
        >
          <i className="fas fa-times text-base" />
        </button>

        <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md py-4 cursor-default">
          
          {/* Card Presentation Container */}
          <div className="relative w-[310px] sm:w-[340px] h-[520px] sm:h-[550px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!flipped ? (
                /* ================= CARD BACK (OFFICIAL DOSSIER) ================= */
                <motion.div
                  key="dossier-back"
                  initial={{ rotateY: 0, opacity: 1, scale: 0.95 }}
                  animate={isSuspensePhase ? {
                    rotateY: [0, 8, -8, 4, -4, 0],
                    scale: [0.95, 1.02, 0.97, 1.01, 0.95],
                  } : { scale: 0.95 }}
                  exit={{
                    rotateY: 90,
                    opacity: 0,
                    scale: 0.85,
                    transition: { duration: 0.22, ease: 'easeIn' },
                  }}
                  transition={{ duration: 1.6, ease: 'easeInOut' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReveal();
                  }}
                  className={`w-full h-full rounded-[26px] bg-gradient-to-b from-[#181926] via-[#12131d] to-[#0a0b10] border ${theme.borderColor} shadow-[0_25px_70px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col justify-between p-6 overflow-hidden select-none relative cursor-pointer active:scale-[0.98] transition-transform`}
                >
                  {/* Handball Court Arc Watermark */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.06] flex items-center justify-center">
                    <svg width="280" height="420" viewBox="0 0 100 150" fill="none" stroke="white" strokeWidth="1.5">
                      <rect x="5" y="5" width="90" height="140" rx="4" />
                      <path d="M 5 50 Q 50 75 95 50" />
                      <path d="M 5 40 Q 50 60 95 40" strokeDasharray="3 3" />
                      <circle cx="50" cy="15" r="4" fill="white" fillOpacity="0.4" />
                      <circle cx="50" cy="75" r="12" />
                    </svg>
                  </div>

                  {/* Dossier Top Header */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.08] flex items-center justify-center text-xs text-zinc-300">
                        <i className="fas fa-folder-closed" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">
                        {tr('Transfer Dossier', 'Transfer-Dossier')}
                      </span>
                    </div>
                    <span className="text-base">{flag}</span>
                  </div>

                  {/* Dossier Center Seal */}
                  <div className="flex flex-col items-center justify-center gap-4 z-10 my-auto text-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/[0.15] via-white/[0.05] to-transparent border border-white/[0.2] flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.18)] relative"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-[#0e0f17] border border-white/[0.12] flex items-center justify-center text-2xl" style={{ color: club?.color || '#38bdf8' }}>
                        <i className="fas fa-hand-holding-handball" />
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400/25 border border-amber-400/50 text-amber-300 flex items-center justify-center text-[10px] animate-pulse">
                        <i className="fas fa-award" />
                      </div>
                    </motion.div>

                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-400/90 mb-1 animate-pulse">
                        {isSuspensePhase ? tr('★ UNSEALING RECRUITMENT DOSSIER ★', '★ AKTE WIRD ENTSCHLÜSSELT ★') : theme.stamp}
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                        {club?.name || tr('Handball Club', 'Handballverein')}
                      </h3>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {theme.tierLabel}
                      </div>
                    </div>
                  </div>

                  {/* Dossier Footer Prompt */}
                  <div className="flex flex-col items-center gap-2 z-10 pt-4 border-t border-white/[0.08]">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 animate-pulse">
                      <i className="fas fa-spinner fa-spin text-[11px] text-amber-400" />
                      <span>{tr('DECRYPTING SQUAD RATING...', 'BEWERTUNG WIRD BERECHNET...')}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                      {tr('Official Scouting Release', 'Offizielle Scouting-Freigabe')}
                    </span>
                  </div>
                </motion.div>
              ) : (
                /* ================= CARD FRONT (OFFICIAL HANDBALL CARD) ================= */
                <motion.div
                  key="player-card-front"
                  initial={{ rotateY: -90, opacity: 0, scale: 0.85 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 130 }}
                  className={`w-full h-full rounded-[26px] bg-[#12131e] border ${theme.borderColor} shadow-[0_25px_70px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col justify-between p-4 sm:p-5 overflow-hidden select-none relative`}
                >
                  {/* Dynamic Rarity Ambient Glow */}
                  <div className={`absolute top-0 inset-x-0 h-44 bg-gradient-to-b ${theme.ambientGlow} pointer-events-none`} />

                  {/* CARD TOP BAR */}
                  <div className="flex justify-between items-start z-10 relative">
                    {/* Left: OVR & Position */}
                    <div className="flex flex-col items-start leading-none">
                      <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter tabular-nums drop-shadow-md flex items-baseline gap-1">
                        <span>{finalOvr}</span>
                        <span className="text-xs font-bold text-zinc-400 tracking-normal">OVR</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-extrabold tracking-wider ${theme.badgeBg}`}>
                          {playerPosition}
                        </span>
                        <span className="text-base" title={countryName}>{flag}</span>
                      </div>
                    </div>

                    {/* Right: Club Crest & Jersey # */}
                    <div className="flex flex-col items-end">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center p-1 shadow-inner">
                        {club?.logo ? (
                          <img src={club.logo} alt={club.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: club?.color || '#2563eb' }}>
                            {(club?.name || 'HC').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold mt-1">
                        #{jerseyNumber}
                      </span>
                    </div>
                  </div>

                  {/* CENTER HERO: HANDBALL ACTION GRAPHIC */}
                  <div className="relative flex-1 flex flex-col items-center justify-center my-1 z-10">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                      <svg className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className={theme.accentColor} opacity="0.35" />
                        <circle cx="52" cy="22" r="7" fill="#ffffff" />
                        <path d="M 52 28 L 68 18 L 74 12" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="78" cy="9" r="5" fill="#f59e0b" />
                        <circle cx="78" cy="9" r="3.5" stroke="#ffffff" strokeWidth="1" />
                        <path d="M 52 28 L 46 54 L 56 54 Z" fill={club?.color || '#3b82f6'} />
                        <path d="M 48 32 L 32 30 L 26 38" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 47 54 L 38 72 L 28 82" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 54 54 L 62 68 L 70 78" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    {/* Player Identity Strip */}
                    <div className="text-center w-full mt-1">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase truncate px-2">
                        {playerName}
                      </h2>
                      <div className="text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-white">{playerPlaystyle}</span>
                        <span className="text-zinc-600">·</span>
                        <span>{playerAge} {tr('yrs', 'Jahre')}</span>
                        <span className="text-zinc-600">·</span>
                        <span>{playerHeight}</span>
                      </div>
                    </div>
                  </div>

                  {/* HANDBALL ATTRIBUTES GRID */}
                  <div className="bg-[#0e0f17] border border-white/[0.08] rounded-2xl p-2.5 sm:p-3 grid grid-cols-2 gap-2 z-10">
                    {attributes.map((attr, attrIdx) => (
                      <div key={`${attr.label}-${attrIdx}`} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-zinc-400 font-mono tracking-wider">
                            {attr.label}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-medium truncate max-w-[85px]">
                            {attr.desc}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-white tabular-nums">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* SQUAD IMPACT FOOTER */}
                  <div className="pt-2 z-10 flex flex-col gap-1.5 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-[11px] font-medium text-zinc-400">
                        {isYouth ? tr('Academy Potential:', 'Akademie-Potenzial:') : tr('Team OVR Impact:', 'Kader-Stärkeffekt:')}
                      </span>
                      <span className={`font-black tabular-nums ${revealData.gain > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {impactText} {isYouth ? tr('Potential', 'Potenzial') : 'OVR'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-300 leading-tight italic px-1 line-clamp-2">
                      "{scoutingVerdict}"
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-5 flex flex-col items-center">
            {!flipped ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReveal();
                }}
                className="px-8 py-3 rounded-2xl bg-white/[0.1] hover:bg-white/[0.18] text-white text-xs sm:text-sm font-semibold border border-white/20 transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <i className="fas fa-envelope-open-text text-sky-400" />
                <span>{tr('Tap to Unseal Card', 'Karte jetzt aufdecken')}</span>
              </button>
            ) : (
              <motion.button
                key="gacha-continue-btn"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-10 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_8px_25px_rgba(37,99,235,0.4)] border border-blue-400/30 flex items-center gap-2 transition active:scale-[0.98] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <span>{tr('Confirm & Continue', 'Bestätigen & Weiter')}</span>
                <i className="fas fa-arrow-right text-xs" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
