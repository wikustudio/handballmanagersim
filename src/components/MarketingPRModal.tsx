import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Language } from '../types';
import { formatMoney } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';
import { triggerRealisticConfetti } from '../utils/confettiHelper';
import { useGameStore } from '../store/useGameStore';

interface MarketingPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  state?: GameState;
  lang: Language;
}

interface CampaignOptionConfig {
  id: 1 | 2 | 3;
  title: string;
  subtitle: string;
  cost: number;
  dpCost: number;
  icon: string;
  themeColor: string;
  borderGlow: string;
  bgGradient: string;
  oddsDisplay: { label: string; pct: string; color: string }[];
  wheelSegments: {
    label: string;
    sublabel: string;
    color: string;
    textColor: string;
    isJackpot?: boolean;
    isDisaster?: boolean;
  }[];
}

const CAMPAIGN_OPTIONS: CampaignOptionConfig[] = [
  {
    id: 1,
    title: 'Regional Fan Promo',
    subtitle: 'Targeted grassroots promotional blitz in suburban municipalities & local sports clubs.',
    cost: 250000,
    dpCost: 0,
    icon: 'fa-bullhorn',
    themeColor: 'emerald',
    borderGlow: 'hover:border-emerald-400/50',
    bgGradient: 'from-emerald-500/15 via-emerald-950/20 to-transparent',
    oddsDisplay: [
      { label: 'Success (+15k Fans)', pct: '60%', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      { label: 'Break Even (+5k Fans)', pct: '30%', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
      { label: 'Flop (-2k Fans)', pct: '10%', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    ],
    wheelSegments: [
      { label: '+15k Fans', sublabel: '60% Success', color: '#10b981', textColor: '#ffffff' },
      { label: '+5k Fans', sublabel: '30% Break Even', color: '#0284c7', textColor: '#ffffff' },
      { label: '-2k Fans', sublabel: '10% Flop', color: '#e11d48', textColor: '#ffffff', isDisaster: true },
    ]
  },
  {
    id: 2,
    title: 'Continental Summer Tour',
    subtitle: 'High-profile summer exhibition matches in European handball hubs to broaden fan reach.',
    cost: 1000000,
    dpCost: 1,
    icon: 'fa-plane-departure',
    themeColor: 'sky',
    borderGlow: 'hover:border-sky-400/50',
    bgGradient: 'from-sky-500/15 via-blue-950/20 to-transparent',
    oddsDisplay: [
      { label: 'Smash Hit (+80k Fans, +5 Morale)', pct: '20%', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      { label: 'Success (+40k Fans)', pct: '50%', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      { label: 'Nightmare (-10k Fans, -5 Morale)', pct: '30%', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    ],
    wheelSegments: [
      { label: '+80k & +5 Morale', sublabel: '20% Smash Hit', color: '#f59e0b', textColor: '#000000', isJackpot: true },
      { label: '+40k Fans', sublabel: '50% Success', color: '#0ea5e9', textColor: '#ffffff' },
      { label: '-10k & -5 Morale', sublabel: '30% Nightmare', color: '#e11d48', textColor: '#ffffff', isDisaster: true },
    ]
  },
  {
    id: 3,
    title: 'Global "Viral" PR Campaign',
    subtitle: 'Worldwide viral marketing & documentary media drive to capture overseas casual viewers.',
    cost: 3000000,
    dpCost: 3,
    icon: 'fa-earth-americas',
    themeColor: 'purple',
    borderGlow: 'hover:border-purple-400/50',
    bgGradient: 'from-purple-500/15 via-fuchsia-950/20 to-transparent',
    oddsDisplay: [
      { label: 'Jackpot (+350k Fans, +2 Rep, +10 Morale)', pct: '10%', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      { label: 'Solid ROI (+100k Fans)', pct: '40%', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      { label: 'Lukewarm (+25k Fans)', pct: '30%', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
      { label: 'Disaster (-40k Fans, -10 Trust, -5 Morale)', pct: '20%', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    ],
    wheelSegments: [
      { label: 'JACKPOT: +350k Fans', sublabel: '10% Viral Hit (+2 Rep, +10 M)', color: '#eab308', textColor: '#000000', isJackpot: true },
      { label: '+100k Fans', sublabel: '40% Solid ROI', color: '#10b981', textColor: '#ffffff' },
      { label: '+25k Fans', sublabel: '30% Lukewarm', color: '#38bdf8', textColor: '#000000' },
      { label: 'PR DISASTER: -40k', sublabel: '20% Backlash (-10 T, -5 M)', color: '#be123c', textColor: '#ffffff', isDisaster: true },
    ]
  }
];

export const MarketingPRModal: React.FC<MarketingPRModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  useModalDismiss(onClose, isOpen);

  // Read reactive store values directly to prevent stale props
  const store = useGameStore();
  const budget = store.budget ?? 0;
  const dpAvailable = store.skillPoints ?? 0;
  const isCampaignLimitReached = (store.brandCampaignsThisSeason ?? 0) >= 1;

  const [selectedOption, setSelectedOption] = useState<CampaignOptionConfig>(CAMPAIGN_OPTIONS[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [campaignResult, setCampaignResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = (en: string, de?: string) => (lang === 'de' ? (de || en) : en);

  const handleSpinWheel = () => {
    if (isSpinning) return;
    setErrorMessage(null);

    if (isCampaignLimitReached) {
      setErrorMessage(t('You have already launched a Marketing & PR campaign this season (limit: 1/season).', 'In dieser Saison wurde bereits eine Kampagne durchgeführt (Limit: 1/Saison).'));
      return;
    }
    if (budget < selectedOption.cost) {
      setErrorMessage(t(`Insufficient treasury funds: requires ${formatMoney(selectedOption.cost)} (Current: ${formatMoney(budget)})`, `Nicht genügend Budget: benötigt ${formatMoney(selectedOption.cost)} (Aktuell: ${formatMoney(budget)})`));
      return;
    }
    if (dpAvailable < selectedOption.dpCost) {
      setErrorMessage(t(`Insufficient Director Points: requires ${selectedOption.dpCost} DP (Current: ${dpAvailable} DP)`, `Nicht genügend Director Points: benötigt ${selectedOption.dpCost} DP (Aktuell: ${dpAvailable} DP)`));
      return;
    }

    setIsSpinning(true);
    setCampaignResult(null);

    // Call store action
    const res = useGameStore.getState().launchBrandCampaign(selectedOption.id);
    if (!res || !res.success) {
      setIsSpinning(false);
      setErrorMessage(res?.message || t('Failed to launch campaign.', 'Kampagne konnte nicht gestartet werden.'));
      return;
    }

    const segmentCount = selectedOption.wheelSegments.length;
    const segmentAngle = 360 / segmentCount;
    const targetSegment = typeof res.segmentIndex === 'number' ? res.segmentIndex : 0;
    
    const extraFullSpins = (5 + Math.floor(Math.random() * 2)) * 360;
    const targetOffset = (360 - (targetSegment * segmentAngle + segmentAngle / 2)) % 360;
    const currentNorm = wheelRotation % 360;
    const rotationNeeded = (targetOffset - currentNorm + 360) % 360;
    const targetTotalAngle = wheelRotation + extraFullSpins + rotationNeeded;

    setWheelRotation(targetTotalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setCampaignResult(res);
      if (res.outcomeKey === 'viral_jackpot' || res.outcomeKey === 'smash_hit' || res.outcomeKey === 'success') {
        triggerRealisticConfetti();
      }
    }, 3800);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-5 z-[100] backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] bg-[#14151e] rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] overflow-hidden cursor-default pointer-events-auto"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.04] bg-[#14151e] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center text-lg shadow-sm shrink-0">
              <i className="fas fa-bullhorn" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                Marketing & PR
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal leading-relaxed">
                Launch promotional drives to expand your club's addressable supporter base and national brand awareness.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4 flex-1 min-h-0">
          
          {/* Season Limit Notice */}
          {isCampaignLimitReached && !isSpinning && !campaignResult && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-center gap-3 shrink-0">
              <i className="fas fa-calendar-check text-amber-400 text-lg" />
              <div className="text-xs text-zinc-200">
                <strong className="text-amber-300 block font-semibold">{t('Campaign Limit Reached (1/1 Per Season)', 'Saison-Limit erreicht (1/1 Kampagne)')}</strong>
                <span>{t('Your PR team has executed a campaign this season. Available again next season.', 'In dieser Saison wurde bereits eine Kampagne durchgeführt. Erneut verfügbar in der nächsten Saison.')}</span>
              </div>
            </div>
          )}

          {/* Campaign Selection Cards - ADDED shrink-0 */}
          <div className="flex flex-col gap-2.5 shrink-0">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 px-1 flex items-center gap-1.5">
              <i className="fas fa-layer-group text-zinc-500" />
              <span>{t('Select Campaign Tier', 'Kampagnen-Stufe wählen')}</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CAMPAIGN_OPTIONS.map((opt) => {
                const isSelected = selectedOption.id === opt.id;

                return (
                  <button
                    key={opt.id}
                    disabled={isSpinning || isCampaignLimitReached}
                    onClick={() => {
                      setSelectedOption(opt);
                      setCampaignResult(null);
                      setErrorMessage(null);
                    }}
                    className={`rounded-2xl p-3.5 text-left transition border relative flex flex-col justify-between cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'bg-amber-500/[0.05] border-amber-500/30 shadow-sm'
                        : 'bg-[#10121a] hover:bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                          isSelected ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-white/[0.04] text-zinc-400 border border-white/[0.04]'
                        }`}>
                          <i className={`fas ${opt.icon}`} />
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-white/[0.03] text-zinc-400 border border-white/[0.04]'
                        }`}>
                          Option {opt.id}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-white tracking-tight leading-tight">
                        {opt.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-snug font-normal">
                        {opt.subtitle}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-xs">
                      <span className="font-semibold text-white tabular-nums">
                        {formatMoney(opt.cost)}
                      </span>
                      {opt.dpCost > 0 && (
                        <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded tabular-nums">
                          +{opt.dpCost} DP
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TEMU-Style Wheel & Outcome Stage - ADDED shrink-0 */}
          <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 sm:p-5 flex flex-col items-center gap-4 relative overflow-hidden shrink-0">
            {/* Stage Title & Odds Pill Badges */}
            <div className="w-full flex flex-col items-center gap-2 text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <i className="fas fa-dharmachakra text-amber-400" />
                <span>{selectedOption.title} — Odds & Probability Table</span>
              </span>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {selectedOption.oddsDisplay.map((odd, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-medium ${odd.color}`}
                  >
                    {odd.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Spinning Wheel Container */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-1 flex items-center justify-center shrink-0">
              {/* Pointer Arrow at 12 o'clock */}
              <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)] animate-bounce" />
              </div>

              {/* Outer Golden Flashing Bezel */}
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.25),inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none z-20 flex items-center justify-center">
                {/* 12 Perimeter Studs */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_6px_#fde047]"
                    style={{
                      transform: `rotate(${i * 30}deg) translateY(-126px)`,
                    }}
                  />
                ))}
              </div>

              {/* The Rotating Wheel with Hardware-Accelerated Motion */}
              <motion.div
                animate={{ rotate: wheelRotation }}
                transition={{
                  duration: isSpinning ? 3.8 : 0,
                  ease: [0.15, 0.9, 0.2, 1],
                }}
                onClick={!isSpinning && !isCampaignLimitReached ? handleSpinWheel : undefined}
                className={`w-full h-full rounded-full overflow-hidden shadow-2xl relative select-none ${
                  !isSpinning && !isCampaignLimitReached && budget >= selectedOption.cost && dpAvailable >= selectedOption.dpCost
                    ? 'cursor-pointer'
                    : ''
                }`}
              >
                {/* Wheel SVG Segments */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {selectedOption.wheelSegments.map((seg, i, arr) => {
                    const count = arr.length;
                    const angle = 360 / count;
                    const startAngle = i * angle;
                    const endAngle = (i + 1) * angle;

                    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
                      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
                      return {
                        x: centerX + radius * Math.cos(angleInRadians),
                        y: centerY + radius * Math.sin(angleInRadians),
                      };
                    };

                    const start = polarToCartesian(50, 50, 50, endAngle);
                    const end = polarToCartesian(50, 50, 50, startAngle);
                    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
                    const pathData = `M 50 50 L ${start.x} ${start.y} A 50 50 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;

                    // Middle text angle
                    const midAngle = startAngle + angle / 2;
                    const textPos = polarToCartesian(50, 50, 32, midAngle);

                    return (
                      <g key={i}>
                        <path d={pathData} fill={seg.color} stroke="#181924" strokeWidth="0.8" />
                        <text
                          x={textPos.x}
                          y={textPos.y}
                          fill={seg.textColor}
                          fontSize={count === 4 ? '4.2' : '4.8'}
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${midAngle + 90}, ${textPos.x}, ${textPos.y})`}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </motion.div>

              {/* Center Hub Button */}
              <button
                type="button"
                onClick={handleSpinWheel}
                disabled={isSpinning || isCampaignLimitReached || budget < selectedOption.cost || dpAvailable < selectedOption.dpCost}
                className="absolute z-30 w-16 h-16 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 shadow-sm flex flex-col items-center justify-center font-semibold cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                title="Spin the Wheel"
              >
                <span className="text-[10px] tracking-tight leading-none font-semibold">SPIN</span>
                <i className={`fas ${isSpinning ? 'fa-spinner fa-spin' : 'fa-play'} text-[9px] mt-0.5 text-amber-300`} />
              </button>
            </div>

            {/* Campaign Result Card */}
            <AnimatePresence>
              {campaignResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`w-full rounded-2xl p-4 border flex flex-col gap-2.5 ${
                    campaignResult.outcomeKey === 'viral_jackpot' || campaignResult.outcomeKey === 'smash_hit'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                      : campaignResult.outcomeKey === 'pr_disaster' || campaignResult.outcomeKey === 'flop' || campaignResult.outcomeKey === 'nightmare'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                      <i className={`fas ${
                        campaignResult.outcomeKey.includes('jackpot') || campaignResult.outcomeKey.includes('hit') ? 'fa-crown text-amber-400' : campaignResult.outcomeKey.includes('disaster') || campaignResult.outcomeKey.includes('flop') || campaignResult.outcomeKey.includes('nightmare') ? 'fa-triangle-exclamation text-rose-400' : 'fa-circle-check text-emerald-400'
                      }`} />
                      <span>{campaignResult.title}</span>
                    </span>
                    <span className="text-[11px] font-semibold tabular-nums">
                      {campaignResult.fanGain > 0 ? `+${campaignResult.fanGain.toLocaleString()} Fans` : `${campaignResult.fanGain.toLocaleString()} Fans`}
                    </span>
                  </div>

                  <p className="text-xs text-white leading-relaxed font-normal">
                    {campaignResult.message}
                  </p>

                  {/* Continental Tour Exhibition Game Results */}
                  {campaignResult.matches && campaignResult.matches.length > 0 && (
                    <div className="mt-2 pt-2.5 border-t border-white/[0.04] flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <i className="fas fa-trophy text-amber-400" />
                          <span>{t('Tour Exhibition Match Results', 'Ergebnisse der Testspielserie')}</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {campaignResult.matches.filter((m: any) => m.won).length}W - {campaignResult.matches.filter((m: any) => m.draw).length}D - {campaignResult.matches.filter((m: any) => !m.won && !m.draw).length}L
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {campaignResult.matches.map((m: any, mIdx: number) => (
                          <div key={mIdx} className="bg-black/35 border border-white/[0.04] rounded-xl p-2.5 flex items-center justify-between text-xs">
                            <div className="flex flex-col min-w-0 pr-1">
                              <span className="font-semibold text-white truncate text-[11px]">{m.opp}</span>
                              <span className="text-[9px] text-zinc-400">Match #{mIdx + 1}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono font-semibold text-white text-[12px]">{m.playerGoals} : {m.oppGoals}</span>
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                                m.won ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : m.draw ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              }`}>
                                {m.won ? 'W' : m.draw ? 'D' : 'L'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message Notice (Moved to bottom above button so it's always seen) */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="w-full bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-300 text-left shrink-0"
                >
                  <i className="fas fa-triangle-exclamation text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spin CTA Button */}
            <button
              onClick={handleSpinWheel}
              disabled={
                isSpinning ||
                isCampaignLimitReached ||
                budget < selectedOption.cost ||
                dpAvailable < selectedOption.dpCost
              }
              className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] shrink-0 ${
                isSpinning
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-500/30 cursor-wait animate-pulse'
                  : isCampaignLimitReached
                  ? 'bg-white/[0.02] text-zinc-500 border border-white/[0.04] cursor-not-allowed'
                  : budget < selectedOption.cost || dpAvailable < selectedOption.dpCost
                  ? 'bg-white/[0.02] text-zinc-500 border border-white/[0.04] cursor-not-allowed'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30'
              }`}
            >
              {isSpinning ? (
                <>
                  <i className="fas fa-spinner fa-spin text-sm" />
                  <span>Spinning Wheel...</span>
                </>
              ) : isCampaignLimitReached ? (
                <span>{t('Season Limit Reached (1/1)', 'Saison-Limit erreicht (1/1)')}</span>
              ) : budget < selectedOption.cost ? (
                <span>{t('Insufficient Treasury Funds', 'Nicht genügend Budget')} ({formatMoney(selectedOption.cost)})</span>
              ) : dpAvailable < selectedOption.dpCost ? (
                <span>{t('Requires', 'Benötigt')} {selectedOption.dpCost} DP ({dpAvailable}/{selectedOption.dpCost})</span>
              ) : (
                <>
                  <i className="fas fa-dice text-sm" />
                  <span>
                    {t('Spin the Wheel', 'Rad drehen')} (-{formatMoney(selectedOption.cost)}{selectedOption.dpCost > 0 ? ` + ${selectedOption.dpCost} DP` : ''})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] flex justify-between items-center shrink-0">
          <div className="text-[11px] text-zinc-400">
            <span>Treasury: <strong className="text-white font-semibold tabular-nums">{formatMoney(budget)}</strong></span>
            <span className="mx-2 text-zinc-600">·</span>
            <span>Director Points: <strong className="text-amber-300 font-semibold tabular-nums">{dpAvailable} DP</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-medium text-xs rounded-xl transition cursor-pointer border border-white/[0.04] active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};