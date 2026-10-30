import React, { useEffect, useRef, useState } from 'react';
import { formatMoney } from '../data/gameConstants';

interface AnimatedTreasuryProps {
  budget: number;
  financials: {
    wages: number;
    estRevenue: number;
    net: number;
    sponsorInc?: number;
  };
  onShowTable?: () => void;
  onShowLedger: () => void;
  
  youthCount?: number;
  isDe: boolean;
  t: (en: string, de: string) => string;
}

export const AnimatedTreasury: React.FC<AnimatedTreasuryProps> = ({
  budget,
  financials,
  onShowTable,
  onShowLedger,
  
  youthCount = 0,
  isDe,
  t,
}) => {
  const [displayBudget, setDisplayBudget] = useState<number>(budget);
  const prevBudgetRef = useRef<number>(budget);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevBudgetRef.current;
    if (prev === budget) return;

    const startVal = displayBudget;
    const diff = budget - startVal;
    prevBudgetRef.current = budget;

    // Smooth number counting animation over 600ms
    const startTime = performance.now();
    const duration = 600;

    const animateNumber = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startVal + diff * easeProgress);

      setDisplayBudget(currentVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateNumber);
      } else {
        setDisplayBudget(budget);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animateNumber);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [budget]);

  return (
    <div className="flex flex-col w-full shrink-0 transition-all duration-300">
      {/* Apple-inspired Frosted Glass Treasury Card */}
      <div className="bg-[#161820]/75 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] relative transition-all duration-300 flex flex-col gap-3.5 overflow-hidden">
        {/* Subtle Ambient Sky-Blue Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header & Balance Row */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 text-xs shadow-sm">
              <i className="fa-solid fa-vault"></i>
            </div>
            <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
              {t('Treasury', 'Vereinskasse')}
            </span>
          </div>
          {budget < 0 && (
            <span className="text-[10px] font-medium tracking-wide bg-rose-500/10 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1.5">
              <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
              {t('Debt Active', 'Schulden aktiv')}
            </span>
          )}
        </div>

        {/* Big Crisp Balance Readout */}
        <div className="flex items-baseline justify-between relative z-10">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
            {t('Balance', 'Kontostand')}
          </span>
          <span
            className={`text-2xl sm:text-3xl font-black tracking-tight leading-none transition-colors duration-300 tabular-nums ${
              budget < 0
                ? 'text-rose-400 drop-shadow-[0_0_16px_rgba(244,63,94,0.3)]'
                : 'text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]'
            }`}
          >
            {formatMoney(displayBudget)}
          </span>
        </div>

        {/* Integrated Financial Summary Strip */}
        <div className="text-[10px] grid grid-cols-3 gap-1 text-center bg-white/[0.03] border border-white/[0.06] rounded-2xl p-2.5 relative z-10">
          <div className="flex flex-col items-center">
            <span className="text-zinc-500 uppercase font-medium text-[9px] tracking-wider mb-0.5">
              {t('Est. Rev', 'Einnahmen')}
            </span>
            <span className="text-emerald-400 font-bold truncate">
              {financials.estRevenue >= 1 ? `+${formatMoney(financials.estRevenue)}` : '€0'}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-white/[0.06] px-1">
            <span className="text-zinc-500 uppercase font-medium text-[9px] tracking-wider mb-0.5">
              {t('Expenses', 'Ausgaben')}
            </span>
            <span className="text-rose-400 font-bold truncate">
              {financials.wages >= 1 ? `-${formatMoney(financials.wages)}` : '€0'}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-zinc-500 uppercase font-medium text-[9px] tracking-wider mb-0.5">
              {t('Proj. Margin', 'Prognose')}
            </span>
            <span
              className={`font-bold truncate ${
                financials.net >= 0 ? 'text-sky-300' : 'text-rose-400'
              }`}
            >
              {financials.net >= 0 ? '+' : ''}
              {formatMoney(financials.net)}
            </span>
          </div>
        </div>

        {/* Navigation Buttons Row: Standings & Financial Ledger */}
        <div className="grid grid-cols-2 gap-2 pt-1 relative z-10">
          <button
            onClick={onShowTable}
            className="px-2.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-white/[0.08] text-xs font-semibold group shadow-sm"
            title="League Standings & Universe Movements"
          >
            <i className="fa-solid fa-list-ol text-[11px] text-sky-400 group-hover:scale-110 transition-transform"></i>
            <span className="truncate">Standings</span>
          </button>

          <button
            onClick={onShowLedger}
            className="px-2.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-white/[0.08] text-xs font-semibold group shadow-sm"
            title="Financial Ledger & Balance Sheet"
          >
            <i className="fa-solid fa-file-invoice-dollar text-[11px] text-emerald-400 group-hover:scale-110 transition-transform"></i>
            <span className="truncate">Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
};
