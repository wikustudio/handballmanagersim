import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { GameState } from '../types';
import { formatMoney, getCountryMult, isReserveClub, getCurrencyForCountry, getCorporateEntityInfo } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';
import { useGameStore } from '../store/useGameStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface IPOModalProps {
  isOpen: boolean;
  state: GameState;
  onClose: () => void;
}

export const IPOModal: React.FC<IPOModalProps> = ({ isOpen, state, onClose }) => {
  useModalDismiss(onClose, isOpen);

  const isReserve = isReserveClub(state.club.name);
  const currencySymbol = getCurrencyForCountry(state.club.country).symbol;
  const corpInfo = getCorporateEntityInfo(state.club.country);

  // Valuation model nerfed by 40%: (Budget + FanBase * 60 + BaseOVR * 150k) * countryMult
  const cMult = getCountryMult(state.club.country || 'GER');
  const fanValuation = (state.club.fanBase || 0) * 60;
  const squadValuation = (state.club.baseOvr || 60) * 150000;
  const cashValuation = Math.max(0, state.budget);
  const trueValuation = (cashValuation + fanValuation + squadValuation) * cMult;
  const fairStockPrice = Math.max(1.0, Math.round((trueValuation / 1000000) * 100) / 100);

  const [selectedTier, setSelectedTier] = useState<'conservative' | 'fair' | 'aggressive' | 'greedy'>('fair');
  const [customGreedyPrice, setCustomGreedyPrice] = useState<number>(() => Math.round(fairStockPrice * 1.35 * 100) / 100);

  const isPublic = Boolean(state.club.isPublic);
  const stockPrice = state.club.stockPrice || fairStockPrice;
  const ipoPrice = state.club.ipoPrice || fairStockPrice;
  const pctChange = ipoPrice > 0 ? ((stockPrice - ipoPrice) / ipoPrice) * 100 : 0;
  const isSurging = pctChange >= 0;

  // Dynamic Chart Generation (Reverse-Engineered Historical Tracking)
  const sparklineData = useMemo(() => {
    if (!isPublic) return null;
    
    const points: number[] = [];
    const labels: string[] = [];
    
    const recentSeasons = (state.history || []).filter(h => !h.clubName || h.clubName === state.club.name).slice(-10); 
    
    let currentReconstructedPrice = stockPrice;
    
    // Add current live price
    points.unshift(stockPrice);
    labels.unshift('Live');

    // Walk backwards through actual career history to map exact price swings
    for (let i = recentSeasons.length - 1; i >= 0; i--) {
        const h = recentSeasons[i];
        
        let pChange = 0;
        const wonTrophy = h.trophiesThisYear?.bl || h.trophiesThisYear?.cl || h.trophiesThisYear?.el || h.trophiesThisYear?.ecl || h.trophiesThisYear?.cwc || h.trophiesThisYear?.dfb || h.trophiesThisYear?.reg;
        
        if (wonTrophy || h.pos === 1) pChange = 0.25;
        else if (h.promoted || (h.pos <= 3 && h.tier === 1)) pChange = 0.15;
        else if (h.pos <= 8) pChange = 0.05;
        else if (h.relegated) pChange = -0.35;
        else pChange = -0.12;
        
        if (h.pos <= 10) pChange += 0.05;
        else pChange -= 0.08;
        
        // Reverse calculate the price: old = new / (1 + change)
        currentReconstructedPrice = currentReconstructedPrice / (1 + pChange);
        currentReconstructedPrice = Math.max(0.10, currentReconstructedPrice); // Engine floor
        
        points.unshift(currentReconstructedPrice);
        labels.unshift(`Y${h.year.toString().slice(-2)}`);
    }

    // Anchor the oldest point accurately to the IPO price
    if (points.length > 0) {
        points[0] = ipoPrice;
        labels[0] = 'IPO';
    } else {
        points.push(ipoPrice);
        labels.push('IPO');
    }

    return {
      labels,
      datasets: [{
        data: points,
        borderColor: isSurging ? '#10b981' : '#ef4444', // emerald-500 / red-500
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 160);
          gradient.addColorStop(0, isSurging ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)');
          gradient.addColorStop(1, 'transparent');
          return gradient;
        },
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: isSurging ? '#10b981' : '#ef4444',
        pointBorderColor: '#121318',
        pointBorderWidth: 2,
      }]
    };
  }, [isPublic, ipoPrice, stockPrice, state.history, state.club.name, isSurging]);

  if (!isOpen) return null;

  const conservativePrice = Math.round(fairStockPrice * 0.90 * 100) / 100;
  const aggressivePrice = Math.round(fairStockPrice * 1.15 * 100) / 100;

  const activeOfferingPrice =
    selectedTier === 'conservative'
      ? conservativePrice
      : selectedTier === 'fair'
      ? fairStockPrice
      : selectedTier === 'aggressive'
      ? aggressivePrice
      : customGreedyPrice;

  const isGreedy = activeOfferingPrice > aggressivePrice;
  const projectedCapital = activeOfferingPrice * 1000000;

  const handleLaunch = () => {
    useGameStore.getState().launchIPO(activeOfferingPrice);
    onClose();
  };

  // Dividend multiplier trap calculations
  const dividendMultiplier = stockPrice > 0 ? ipoPrice / stockPrice : 1;
  const effectiveDividendRate = Math.min(60, Math.round(10 * dividendMultiplier * 10) / 10);

  const maxVal = Math.max(...(sparklineData?.datasets[0].data || [0]));
  const minVal = Math.min(...(sparklineData?.datasets[0].data || [0]));
  const yRange = maxVal - minVal;

  const tickerOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 0, bottom: -5, left: -5, right: -5 } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { 
        display: false, 
        min: minVal - (yRange * 0.1) - 1, 
        max: maxVal + (yRange * 2.8) + 1 // Massive upper buffer forces chart into bottom 35% of canvas!
      }
    },
    interaction: { intersect: false, mode: 'index' as const },
    elements: { line: { borderJoinStyle: 'round' as const } }
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
        <div
          className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${
            isPublic
              ? isSurging
                ? 'via-emerald-400/30'
                : 'via-rose-500/30'
              : 'via-amber-400/30'
          } to-transparent pointer-events-none z-30`}
        />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/[0.04] flex justify-between items-center bg-[#14151e] shrink-0 relative z-20">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-sm shrink-0 ${
                isPublic
                  ? isSurging
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}
            >
              <i className={`fas ${isPublic ? 'fa-chart-line' : 'fa-building-columns'}`} />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-amber-400">
                {isPublic ? corpInfo.headerBadge : 'Capital Markets'}
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2 leading-none">
                {isPublic
                  ? `${state.club.name} ${corpInfo.legalForm} (${corpInfo.tickerLabel}: ${state.club.name.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase()})`
                  : 'Go Public (IPO)'}
              </h2>
            </div>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.04] active:scale-95 cursor-pointer"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-xs sm:text-sm text-zinc-300 flex-1 min-h-0 bg-[#14151e]">
          {isReserve ? (
            <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <i className="fas fa-ban" />
                Ineligible for IPO
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Reserve teams and secondary squads operate as non-independent corporate subsidiaries and cannot issue equity on public stock exchanges.
              </p>
            </div>
          ) : isPublic ? (
            /* ========================================================================= */
            /* VIEW 1: ALREADY PUBLIC INVESTOR DASHBOARD                                  */
            /* ========================================================================= */
            <div className="flex flex-col gap-4">
              
              {/* Live Stock Chart */}
              <div className="w-full h-44 sm:h-48 bg-[#10121a] border border-white/[0.04] rounded-2xl relative overflow-hidden flex flex-col shadow-sm">
                <div className="absolute inset-0 z-0">
                  {sparklineData && <Line data={sparklineData} options={tickerOptions} />}
                </div>
                <div className="relative z-10 flex justify-between items-start p-5">
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">Live Share Price</span>
                     <span className="text-4xl sm:text-5xl font-semibold text-white tracking-tight tabular-nums drop-shadow-md leading-none mt-1">
                       {currencySymbol}{stockPrice.toFixed(2)}
                     </span>
                  </div>
                  <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${isSurging ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                     {isSurging ? '+' : ''}{pctChange.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Ticker Bento Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#10121a] border border-white/[0.04] p-4 sm:p-5 rounded-2xl flex flex-col gap-1.5 shadow-sm">
                  <span className="text-[10px] uppercase font-medium text-zinc-500 tracking-[0.1em]">
                    IPO Listing Price
                  </span>
                  <span className="text-xl sm:text-2xl font-semibold text-white tabular-nums tracking-tight mt-1">
                    {currencySymbol}{ipoPrice.toFixed(2)}
                  </span>
                </div>

                <div className="bg-[#10121a] border border-white/[0.04] p-4 sm:p-5 rounded-2xl flex flex-col gap-1.5 shadow-sm">
                  <span className="text-[10px] uppercase font-medium text-zinc-500 tracking-[0.1em]">
                    Market Cap (1M Shares)
                  </span>
                  <span className="text-xl sm:text-2xl font-semibold text-amber-400 tabular-nums tracking-tight mt-1">
                    {formatMoney(stockPrice * 1000000, state.club.country)}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    1,000,000 shares × {currencySymbol}{stockPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Shareholder Dividend Trap Monitor */}
              <div
                className={`p-5 rounded-2xl border flex flex-col gap-3 shadow-sm ${
                  Math.round(stockPrice * 100) < Math.round(ipoPrice * 100)
                    ? 'bg-rose-500/[0.04] border-rose-500/20'
                    : 'bg-emerald-500/[0.04] border-emerald-500/20'
                }`}
              >
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <i
                      className={`fas text-base ${
                        Math.round(stockPrice * 100) < Math.round(ipoPrice * 100)
                          ? 'fa-triangle-exclamation text-rose-400'
                          : 'fa-circle-check text-emerald-400'
                      }`}
                    />
                    <span className="font-bold text-white text-sm">
                      {Math.round(stockPrice * 100) < Math.round(ipoPrice * 100)
                        ? 'Dividend Penalty Active (The Trap)'
                        : 'Dividend Policy Stable'}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${
                      Math.round(stockPrice * 100) < Math.round(ipoPrice * 100)
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {effectiveDividendRate}% of operating margin
                  </span>
                </div>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  {Math.round(stockPrice * 100) < Math.round(ipoPrice * 100)
                    ? `Your share price has dropped below the initial IPO valuation (${currencySymbol}${stockPrice.toFixed(2)} < ${currencySymbol}${ipoPrice.toFixed(2)}). Disgruntled shareholders demand an elevated ${effectiveDividendRate}% slice of all operating profits (up to 60% max) to compensate for lost equity.`
                    : Math.round(stockPrice * 100) === Math.round(ipoPrice * 100)
                    ? `Your share price is trading at par with the original IPO listing benchmark (${currencySymbol}${stockPrice.toFixed(2)} = ${currencySymbol}${ipoPrice.toFixed(2)}). Shareholders receive the standard baseline 10% slice of positive operating margins at season end (tracked in the Club Ledger).`
                    : `Your share price is trading above the original IPO benchmark (${currencySymbol}${stockPrice.toFixed(2)} > ${currencySymbol}${ipoPrice.toFixed(2)}). Shareholders receive the standard baseline 10% slice of positive operating margins at season end (tracked in the Club Ledger).`}
                </p>
              </div>

              {/* Annual Stock Recalibration Drivers */}
              <div className="bg-white/[0.015] border border-white/[0.04] p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.15em]">
                  Market Mechanics & Stock Factors
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-[13px] text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold tabular-nums w-12">+25%</span>
                    <span>League Title or Silverware</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold tabular-nums w-12">+15%</span>
                    <span>Promotion or European Spot</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-rose-400 font-bold tabular-nums w-12">-35%</span>
                    <span>Relegation to Lower Tier</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold tabular-nums w-12">±5-8%</span>
                    <span>Annual Operating Profit / Deficit</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: LAUNCH NEW IPO (GO PUBLIC)                                         */
            /* ========================================================================= */
            <div className="flex flex-col gap-4">
              <div className="bg-[#10121a] border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed flex flex-col gap-1.5">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <i className="fas fa-building-columns text-amber-400" />
                  <span>Go Public (IPO)</span>
                </div>
                <p className="text-zinc-400 font-normal">
                  Issue 1,000,000 shares to raise upfront capital. Beware shareholder dividend traps!
                </p>
              </div>

              {/* Valuation Assessment Card */}
              <div className="bg-[#10121a] border border-white/[0.04] p-4 sm:p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Fair Market Valuation (FMV)
                  </span>
                  <span className="text-xl sm:text-2xl font-semibold text-amber-400 tabular-nums tracking-tight">
                    {formatMoney(trueValuation, state.club.country)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-zinc-500 block font-medium uppercase tracking-wider mb-1 text-[9px]">Treasury Cash</span>
                    <span className="text-white font-semibold tabular-nums text-[13px]">{formatMoney(cashValuation, state.club.country)}</span>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-zinc-500 block font-medium uppercase tracking-wider mb-1 text-[9px]">Supporter Value</span>
                    <span className="text-white font-semibold tabular-nums text-[13px]">{formatMoney(fanValuation, state.club.country)}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-zinc-500 block font-medium uppercase tracking-wider mb-1 text-[9px]">Squad Appraisal</span>
                    <span className="text-white font-semibold tabular-nums text-[13px]">{formatMoney(squadValuation, state.club.country)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3.5 border-t border-white/[0.04] text-sm mt-1">
                  <span className="text-zinc-400 font-medium">Fair Price per Share (1M Shares)</span>
                  <span className="text-white font-semibold text-2xl tabular-nums tracking-tight">{currencySymbol}{fairStockPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Pricing Tier Selector */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-white tracking-tight px-1">
                  Select Offering Strategy & Valuation
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTier('conservative')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                      selectedTier === 'conservative'
                        ? 'bg-sky-500/[0.08] border-sky-500/30 text-sky-300 shadow-sm'
                        : 'bg-[#10121a] border-white/[0.04] hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                      Conservative (-10%)
                    </span>
                    <span className="text-xl sm:text-2xl font-semibold text-white tabular-nums tracking-tight">
                      {currencySymbol}{conservativePrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5 tabular-nums">
                      +{formatMoney(conservativePrice * 1000000, state.club.country)} Capital
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('fair')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                      selectedTier === 'fair'
                        ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300 shadow-sm'
                        : 'bg-[#10121a] border-white/[0.04] hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      Fair Market (100%)
                    </span>
                    <span className="text-xl sm:text-2xl font-semibold text-white tabular-nums tracking-tight">
                      {currencySymbol}{fairStockPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5 tabular-nums">
                      +{formatMoney(fairStockPrice * 1000000, state.club.country)} Capital
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('aggressive')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                      selectedTier === 'aggressive'
                        ? 'bg-amber-500/[0.08] border-amber-500/30 text-amber-300 shadow-sm'
                        : 'bg-[#10121a] border-white/[0.04] hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                      Max Premium (+15%)
                    </span>
                    <span className="text-xl sm:text-2xl font-semibold text-white tabular-nums tracking-tight">
                      {currencySymbol}{aggressivePrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400 mt-0.5 tabular-nums">
                      +{formatMoney(aggressivePrice * 1000000, state.club.country)} Capital
                    </span>
                  </button>
                </div>

                {/* Greed Gamble Option */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('greedy')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between mt-1 ${
                    selectedTier === 'greedy'
                      ? 'bg-rose-500/[0.08] border-rose-500/30 shadow-sm'
                      : 'bg-[#10121a] border-white/[0.04] hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-0.5">
                      <i className="fas fa-dice text-[11px]" />
                      Greedy Overvaluation (&gt;+15% Risk)
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      Push offering price above market tolerance. Risk underwriter flop & price collapse!
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-4">
                    <span className="text-xl sm:text-2xl font-semibold text-rose-400 tabular-nums tracking-tight">
                      {currencySymbol}{customGreedyPrice.toFixed(2)}
                    </span>
                  </div>
                </button>

                {selectedTier === 'greedy' && (
                  <div className="flex items-center gap-4 bg-black/30 p-3.5 rounded-xl border border-rose-500/20 mt-1">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0">Price:</span>
                    <input
                      type="range"
                      min={Math.round(fairStockPrice * 1.16 * 100) / 100}
                      max={Math.round(fairStockPrice * 2.0 * 100) / 100}
                      step="0.05"
                      value={customGreedyPrice}
                      onChange={(e) => setCustomGreedyPrice(parseFloat(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-800 rounded-full appearance-none outline-none"
                    />
                    <span className="font-mono text-sm font-semibold text-rose-400 tabular-nums shrink-0">
                      {currencySymbol}{customGreedyPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning on Greed / Flop */}
              {isGreedy ? (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl flex items-start gap-3 shadow-sm mt-1">
                  <i className="fas fa-triangle-exclamation text-rose-400 text-sm mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-rose-300">
                      Valuation Warning: Market Rejection Imminent
                    </span>
                    <span className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                      Pricing exceeds the +15% fair value ceiling. Institutional bookrunners will reject the price, dumping the shares at a steep discount and subscribing only 70% of the volume.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-start gap-3 shadow-sm mt-1">
                  <i className="fas fa-circle-info text-amber-400 text-sm mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-amber-300">
                      Shareholder Dividend Trap Warning
                    </span>
                    <span className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                      Once public, you must pay 10% of operating profit to shareholders every year. If stock falls below IPO price, dividends skyrocket up to 60% of profits!
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] shrink-0 flex items-center justify-between gap-3 relative z-20">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition border border-white/[0.04] active:scale-95 cursor-pointer"
          >
            Close
          </button>

          {!isReserve && !isPublic && (
            <button
              onClick={handleLaunch}
              className={`flex-1 py-2.5 px-5 rounded-xl font-semibold text-xs transition border active:scale-[0.99] cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
                isGreedy
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/30'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30'
              }`}
            >
              <i className="fas fa-rocket text-xs" />
              <span>
                Execute IPO & Raise +{formatMoney(projectedCapital, state.club.country)}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};