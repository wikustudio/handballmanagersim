import React from 'react';
import { formatMoney } from '../data/gameConstants';
import { GameState } from '../types';

interface CompactTreasuryProps {
  budget: number;
  state?: GameState;
  financials: {
    wages: number;
    estRevenue: number;
    net: number;
  };
  t: (en: string, de: string) => string;
  lang?: string;
  onShowLedger?: () => void;
}

export const CompactTreasury: React.FC<CompactTreasuryProps> = ({ budget, financials, t, onShowLedger }) => {
  return (
    <div 
      className="bg-[#161820]/75 backdrop-blur-2xl hover:bg-[#1c1f2b]/85 p-3.5 sm:p-4 rounded-3xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] relative overflow-hidden transition-all duration-200 cursor-pointer group w-full"
      onClick={onShowLedger}
    >
      {/* Subtle Sky-Blue Ambient Glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/15 transition-all"></div>

      <div className="flex items-center justify-between mb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 text-xs">
            <i className="fa-solid fa-vault"></i>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            {t('Treasury', 'Vereinskasse')}
          </span>
        </div>
        <div className="text-zinc-500 group-hover:text-sky-400 transition-colors text-xs flex items-center gap-1">
          <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors hidden sm:inline">{t('Ledger', 'Bericht')}</span>
          <i className="fa-solid fa-chevron-right text-[9px]"></i>
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-3 relative z-10">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-medium">
          {t('Balance', 'Kontostand')}
        </span>
        <span
          className={`text-2xl font-black tracking-tight leading-none tabular-nums ${
            budget < 0
              ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'text-white drop-shadow-[0_0_16px_rgba(56,189,248,0.2)]'
          }`}
        >
          {formatMoney(budget)}
        </span>
      </div>

      {/* Integrated Financial Summary Strip */}
      <div className="text-[10px] grid grid-cols-3 gap-1 text-center bg-white/[0.03] border border-white/[0.06] rounded-2xl p-2 relative z-10">
        <div className="flex flex-col items-center">
          <span className="text-zinc-500 uppercase font-medium text-[8px] tracking-wider mb-0.5">
            {t('Est. Rev', 'Einnahmen')}
          </span>
          <span className="text-emerald-400 font-bold truncate">
            {financials.estRevenue >= 1 ? `+${formatMoney(financials.estRevenue)}` : '€0'}
          </span>
        </div>
        <div className="flex flex-col items-center border-x border-white/[0.06] px-1">
          <span className="text-zinc-500 uppercase font-medium text-[8px] tracking-wider mb-0.5">
            {t('Expenses', 'Ausgaben')}
          </span>
          <span className="text-rose-400 font-bold truncate">
            {financials.wages >= 1 ? `-${formatMoney(financials.wages)}` : '€0'}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-zinc-500 uppercase font-medium text-[8px] tracking-wider mb-0.5">
            {t('Proj. Margin', 'Prognose')}
          </span>
          <span
            className={`font-bold truncate ${
              financials.net >= 0 ? 'text-sky-300' : 'text-rose-400'
            }`}
          >
            {financials.net >= 0 ? '+' : ''}{formatMoney(financials.net)}
          </span>
        </div>
      </div>
    </div>
  );
};
