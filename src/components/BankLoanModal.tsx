import React, { useState } from 'react';
import { motion } from 'motion/react';
import { formatMoney, getLoanOptions, LoanTermOption } from '../data/gameConstants';
import { Language } from '../types';
import { t } from '../data/translations';

interface BankLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxLoanAmount: number;
  onConfirmLoan: (principal: number, years: 10 | 15 | 25) => void;
  currentBudget: number;
  clubName: string;
  lang: Language;
}

export const BankLoanModal: React.FC<BankLoanModalProps> = ({
  isOpen,
  onClose,
  maxLoanAmount,
  onConfirmLoan,
  currentBudget,
  clubName,
  lang,
}) => {
  const [selectedTenure, setSelectedTenure] = useState<10 | 15 | 25>(15);
  const isDe = lang === 'de';
  const tr = (en: string, de?: string) => t(lang, en, de);


  const options: LoanTermOption[] = getLoanOptions(maxLoanAmount);
  const activeOption = options.find((opt) => opt.years === selectedTenure) || options[1];

  const projectedTreasury = currentBudget + maxLoanAmount;

  // Isolate Escape key to pop only this sub-modal without dismissing parent StadiumModal or LedgerModal
  React.useEffect(() => {
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-[70] backdrop-blur-2xl cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/95 text-white w-full sm:max-w-lg rounded-[32px] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/[0.1] text-left relative cursor-default max-h-[92vh] overflow-y-auto custom-scrollbar backdrop-blur-3xl"
      >
        {/* Subtle Ambient Sky Accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 text-lg shrink-0">
              <i className="fa-solid fa-building-columns"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                <span>{tr('Board & Financial Advisory', 'Finanzdirektion & Bankkonsortium')}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">{clubName}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {tr('Commercial Credit Facility', 'Institutioneller Bankkredit')}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Lifeline / Liquidity Banner */}
        <div className="bg-sky-500/[0.06] border border-sky-400/20 rounded-2xl p-3.5 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-sky-300 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved"></i>
              {tr('Emergency Liquidity Lifeline', 'Notfall-Liquidität')}
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              +{formatMoney(maxLoanAmount)} Cash
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed mb-2.5">
            {tr(
              'Draw immediate institutional capital directly into your Current Treasury to eliminate negative balances and avoid insolvency penalties.',
              'Sofortige Auszahlung auf das Vereinskonto. Beendet rote Zahlen und schützt vor Insolvenz-Strafen.'
            )}
          </p>
          <div className="pt-2 border-t border-sky-400/15 flex justify-between items-center text-xs">
            <span className="text-zinc-400">{tr('Projected Post-Loan Treasury:', 'Kassenbestand nach Auszahlung:')}</span>
            <span className={`font-bold tabular-nums text-sm ${projectedTreasury >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatMoney(projectedTreasury)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-sky-400/10 flex items-center justify-between text-[10px]">
            <span className="text-sky-300/90 flex items-center gap-1.5 font-semibold">
              <i className="fa-solid fa-circle-check text-sky-400"></i>
              {tr('Independent Credit Line:', 'Eigenständige Kreditlinie:')}
            </span>
            <span className="text-zinc-400">
              {tr('Does not consume your seasonal Sponsor Pitch.', 'Verbraucht keinen saisonalen Sponsoren-Pitch.')}
            </span>
          </div>
        </div>

        {/* Tenure Selection Cards (10, 15, 25 Years) */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
            {tr('Select Repayment Horizon & Amortization', 'Laufzeit & Tilgungsplan wählen')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {options.map((opt) => {
              const isSelected = selectedTenure === opt.years;
              return (
                <button
                  key={opt.years}
                  type="button"
                  onClick={() => setSelectedTenure(opt.years)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 text-sky-400 text-xs">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base font-black text-white">{opt.years}</span>
                      <span className="text-xs text-zinc-400 font-semibold">{tr('Years', 'Jahre')}</span>
                    </div>
                    <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider mb-2">
                      {isDe ? opt.taglineDe : opt.taglineEn}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.08] pt-2 mt-1">
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider">{tr('Annual Service', 'Jaehrl. Rate')}</div>
                    <div className="text-sm font-bold text-rose-400 tabular-nums">
                      -{formatMoney(opt.annualPayment)}/yr
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      {opt.annualRatePct}% {tr('principal/yr', 'Tilgung/J.')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Plan Details Bento */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-3.5 mb-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {tr('Total Repayment', 'Gesamttilgung')} ({selectedTenure} {tr('Yrs', 'Jahre')}):
            </span>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="text-sm font-bold text-white">
                {formatMoney(activeOption.totalRepayment)}
              </span>
              <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                +{activeOption.totalInterestPct}% {tr('interest', 'Zins')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.05] flex items-center gap-1.5 text-[10px] text-amber-300/90">
            <i className="fa-solid fa-triangle-exclamation text-amber-400 text-[10px] shrink-0"></i>
            <span>
              {tr(
                'Max 1 active credit facility per club (resets on club transfer).',
                'Max. 1 aktiver Kredit pro Verein (wird bei Klubwechsel zurückgesetzt).'
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={maxLoanAmount <= 0}
            onClick={() => {
              if (maxLoanAmount > 0) {
                onConfirmLoan(maxLoanAmount, selectedTenure);
              }
            }}
            className={`flex-1 ${
              maxLoanAmount <= 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/[0.06]'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] active:scale-98 cursor-pointer'
            } font-bold text-sm py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2`}
          >
            <i className="fa-solid fa-file-signature"></i>
            <span>
              {maxLoanAmount <= 0
                ? tr('Credit Facility Maxed', 'Kreditlinie ausgeschöpft')
                : tr(`Authorize Loan (+${formatMoney(maxLoanAmount)})`, `Kredit aufnehmen (+${formatMoney(maxLoanAmount)})`)}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white font-semibold text-sm py-3 px-5 rounded-2xl transition active:scale-98 cursor-pointer border border-white/[0.06]"
          >
            {tr('Cancel', 'Abbrechen')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
