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
  onShowTable: () => void;
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
      {/* Sleek Unified Treasury Card */}
      <div className="bg-[#2c2c2e]/95 p-4 sm:p-4.5 rounded-[22px] border border-white/10 shadow-xl relative transition-all duration-300 flex flex-col gap-3">
        {/* Header & Balance Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs">
              <i className="fas fa-vault"></i>
            </div>
            <span className="text-[11px] text-[#8e8e93] font-black uppercase tracking-wider">
              {t('Treasury', 'Vereinskasse')}
            </span>
          </div>
          {budget < 0 && (
            <span className="text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
              <i className="fas fa-triangle-exclamation"></i>
              {t('Debt', 'Schulden')}
            </span>
          )}
        </div>

        {/* Big Crisp Balance Readout */}
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-[#8e8e93] font-extrabold uppercase tracking-widest">
            {t('Balance', 'Kontostand')}
          </span>
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-none transition-colors duration-300 tabular-nums ${
              budget < 0 ? 'text-red-400 drop-shadow-[0_0_12px_rgba(255,69,58,0.4)]' : 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,199,89,0.4)]'
            }`}
          >
            {formatMoney(displayBudget)}
          </span>
        </div>

        {/* Integrated Financial Summary Strip */}
        <div className="pt-2 border-t border-white/10 text-[10px] grid grid-cols-3 gap-1 text-center bg-black/20 rounded-xl p-2">
          <div className="flex flex-col items-center">
            <span className="text-emerald-500/80 uppercase font-extrabold text-[8px] tracking-wider mb-0.5">
              {t('Est. Rev', 'Einnahmen')}
            </span>
            <span className="text-emerald-400 font-bold truncate">{financials.estRevenue >= 1 ? `+${formatMoney(financials.estRevenue)}` : '€0'}</span>
          </div>

          <div className="flex flex-col items-center border-x border-white/10 px-1">
            <span className="text-red-500/80 uppercase font-extrabold text-[8px] tracking-wider mb-0.5">
              {t('Expenses', 'Ausgaben')}
            </span>
            <span className="text-red-400 font-bold truncate">{financials.wages >= 1 ? `-${formatMoney(financials.wages)}` : '€0'}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className={`${financials.net >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'} uppercase font-extrabold text-[8px] tracking-wider mb-0.5`}>
              {t('Op. Margin', 'Op. Marge')}
            </span>
            <span className={`${financials.net >= 0 ? 'text-emerald-400' : 'text-red-400'} font-bold truncate`}>
              {financials.net >= 0 ? '+' : ''}{formatMoney(financials.net)}
            </span>
          </div>
        </div>

        {/* Navigation Buttons Row ([Table], [Ledger]) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onShowTable}
            className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-white/10 text-xs font-bold group shadow-sm"
            title={t('League Standings', 'Tabelle')}
          >
            <i className="fas fa-list-ol text-[11px] text-amber-400 group-hover:scale-110 transition"></i>
            <span className="truncate">{t('League Standings', 'Tabelle')}</span>
          </button>

          <button
            onClick={onShowLedger}
            className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-white/10 text-xs font-bold group shadow-sm"
            title={t('Financial Ledger', 'Finanzbericht')}
          >
            <i className="fas fa-file-invoice-dollar text-[11px] text-emerald-400 group-hover:scale-110 transition"></i>
            <span className="truncate">{t('Financial Report', 'Finanzbericht')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
