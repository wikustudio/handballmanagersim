import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Language } from '../types';
import { formatMoney } from '../data/gameConstants';
import { t as tr } from '../data/translations';
import { getBaseLoanPrincipal, calculateLoanTerms } from '../utils/loanManager';
import { useGameStore } from '../store/useGameStore';
import { useModalDismiss } from '../utils/modalUtils';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  lang: Language;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  state,
  lang,
}) => {
  useModalDismiss(onClose, isOpen);
  const [selectedTerm, setSelectedTerm] = useState<10 | 15 | 25>(15);
  const [showConfirmTake, setShowConfirmTake] = useState(false);
  const [showConfirmEarlyPay, setShowConfirmEarlyPay] = useState(false);
  const [isFullPayoffSelected, setIsFullPayoffSelected] = useState(true);
  const [payoffTab, setPayoffTab] = useState<'full' | 'partial'>('full');
  const [loanMode, setLoanMode] = useState<'consolidation' | 'commercial'>('commercial');
  const [partialAmount, setPartialAmount] = useState<number>(0);

  const t = (en: string, de?: string) => (lang === 'de' ? (de || en) : en);
  const activeLoan = state?.activeLoan;
  
  const isIndebted = (state?.budget || 0) < 0;
  const debtAmount = Math.abs(state?.budget || 0);
  const tier = state?.club?.tier || 1;
  const country = state?.club?.country || 'GER';
  const standardPrincipal = getBaseLoanPrincipal(tier, country);

  // Sync mode and default partial when opened or when state changes
  React.useEffect(() => {
    if (isOpen) {
      setLoanMode(isIndebted ? 'consolidation' : 'commercial');
      if (activeLoan) {
        const discountedMax = Math.round(activeLoan.remainingBalance * 0.92);
        const affordable = Math.min(Math.max(0, state?.budget || 0), discountedMax);
        setPartialAmount(Math.min(affordable, activeLoan.annualPayment));
      }
    }
  }, [isOpen, isIndebted, activeLoan?.annualPayment, state?.budget]);

  if (!isOpen) return null;

  const effectivePrincipal = (isIndebted && loanMode === 'consolidation') 
    ? Math.max(10000, Math.round(debtAmount)) 
    : Math.max(10000, Math.round(standardPrincipal));
  const loanOptions = calculateLoanTerms(effectivePrincipal);
  const currentOption = loanOptions[selectedTerm];

  const fullPayoffDiscounted = activeLoan ? Math.round(activeLoan.remainingBalance * 0.92) : 0;
  const fullPayoffSaved = activeLoan ? Math.max(0, activeLoan.remainingBalance - fullPayoffDiscounted) : 0;
  const maxAffordable = activeLoan ? Math.min(Math.max(0, state?.budget || 0), fullPayoffDiscounted) : 0;
  const percentPaid = activeLoan && activeLoan.totalRepayment > 0
    ? Math.min(100, Math.max(0, Math.round(((activeLoan.totalRepayment - activeLoan.remainingBalance) / activeLoan.totalRepayment) * 100)))
    : 0;

  const canAffordEarlyPay = activeLoan ? (state?.budget || 0) >= fullPayoffDiscounted : false;
  const canAffordPartial = partialAmount > 0 && (state?.budget || 0) >= partialAmount;

  const partialRebateBonus = Math.round(partialAmount * 0.08);
  const simulatedRemaining = activeLoan ? Math.max(0, activeLoan.remainingBalance - (partialAmount + partialRebateBonus)) : 0;
  const simulatedAnnualPayment = activeLoan && activeLoan.yearsRemaining > 0
    ? (simulatedRemaining === 0 ? 0 : Math.max(1000, Math.round(simulatedRemaining / activeLoan.yearsRemaining)))
    : 0;
  const annualSavings = activeLoan ? Math.max(0, activeLoan.annualPayment - simulatedAnnualPayment) : 0;

  const handleTakeLoan = () => {
    const res = useGameStore.getState().takeClubLoan(selectedTerm, effectivePrincipal);
    setShowConfirmTake(false);
    if (res?.success) {
      onClose();
    }
  };

  const handleEarlyPayoff = (customAmount?: number) => {
    useGameStore.getState().repayClubLoanEarly(customAmount);
    setShowConfirmEarlyPay(false);
    onClose();
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
        className="relative w-full max-w-[560px] bg-[#14151e] rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white flex flex-col max-h-[92vh] overflow-hidden cursor-default pointer-events-auto"
      >
          {/* Top Ambient Highlight */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.04] bg-[#14151e]">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  {t('Commercial Treasury', 'Vereinskasse')}
                </span>
                <span className="text-xs text-zinc-400 font-normal">
                  {state?.club?.name || 'Club'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                <i className="fas fa-landmark text-purple-400" />
                {t('Institutional Bank Loan', 'Institutioneller Bankkredit')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer border border-white/[0.04] active:scale-95"
              aria-label="Close"
            >
              <i className="fas fa-xmark text-sm" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto custom-scrollbar overscroll-contain">
            {/* If an active loan already exists, show Tracker & Payoff */}
            {activeLoan ? (
              <div className="flex flex-col gap-4">
                <div className="bg-[#10121a] border border-purple-500/20 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fas fa-file-contract text-purple-400" />
                      {t('Active Loan Contracted', 'Aktiver Kreditvertrag')}
                    </span>
                    <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-lg text-[11px] font-medium tabular-nums">
                      {activeLoan.yearsRemaining} / {activeLoan.termYears} {t('Years Left', 'Jahre verbleibend')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium">{t('Repayment Progress', 'Rückzahlungs-Fortschritt')}</span>
                      <span className="font-semibold text-purple-300 tabular-nums">{percentPaid}% {t('Paid Off', 'Abbezahlt')}</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentPaid}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Balance & Installment Breakdown */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <div className="bg-black/30 rounded-xl p-3 border border-white/[0.04]">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-0.5">
                        {t('Remaining Balance', 'Restschuld')}
                      </span>
                      <span className="text-lg font-semibold text-rose-400 tabular-nums">
                        {formatMoney(activeLoan.remainingBalance)}
                      </span>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3 border border-white/[0.04]">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-0.5">
                        {t('Annual Installment', 'Jährliche Rate')}
                      </span>
                      <span className="text-lg font-semibold text-white tabular-nums">
                        -{formatMoney(activeLoan.annualPayment)}
                        <span className="text-[10px] text-zinc-400 font-normal">/yr</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-zinc-400 pt-1 border-t border-white/[0.04]">
                    <span>{t('Original Principal:', 'Ursprünglicher Kredit:')}</span>
                    <span className="font-semibold text-zinc-200 tabular-nums">{formatMoney(activeLoan.principal)} ({activeLoan.termYears} {t('Years', 'Jahre')})</span>
                  </div>
                </div>

                {/* Single Loan Rule Notice */}
                <div className="bg-[#10121a] rounded-xl p-3 border border-white/[0.04] text-xs text-zinc-400 leading-relaxed">
                  <i className="fas fa-circle-info text-sky-400 mr-1.5" />
                  {t(
                    'Your club currently holds an active bank loan. Under financial compliance rules, additional bank loans cannot be contracted until this balance is retired.',
                    'Dein Verein hat derzeit einen laufenden Kredit. Zusätzliche Darlehen können erst nach vollständiger Tilgung aufgenommen werden.'
                  )}
                </div>

                {/* Early Payoff / Repayment Section */}
                <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <i className="fas fa-hand-holding-dollar text-emerald-400" />
                        <span>{t('Early Loan Repayment Options', 'Optionen zur vorzeitigen Kredittilgung')}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {t('Pay off part or all of your loan balance early with zero prepayment penalties.', 'Tilge Teile oder die Gesamtschuld vorzeitig ohne Vorfälligkeitsentschädigung.')}
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Full vs Partial */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => setPayoffTab('full')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        payoffTab === 'full'
                          ? 'bg-emerald-500/[0.08] text-emerald-300 border border-emerald-500/20 shadow-sm'
                          : 'text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <i className="fas fa-check-double text-[10px]" />
                      <span>{t('Pay In Full (100%)', 'Vollständig tilgen')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayoffTab('partial');
                        if (partialAmount <= 0) {
                          setPartialAmount(Math.min(maxAffordable, activeLoan.annualPayment));
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        payoffTab === 'partial'
                          ? 'bg-purple-500/[0.08] text-purple-300 border border-purple-500/20 shadow-sm'
                          : 'text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <i className="fas fa-coins text-[10px]" />
                      <span>{t('Partial Repayment', 'Teiltilgung')}</span>
                    </button>
                  </div>

                  {payoffTab === 'full' ? (
                    /* Tab 1: Full Payoff */
                    <div className="flex flex-col gap-3 pt-1">
                      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">{t('Total Debt Balance:', 'Vollständige Restschuld:')}</span>
                          <span className="font-semibold text-zinc-400 line-through text-xs tabular-nums">{formatMoney(activeLoan.remainingBalance)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-emerald-400 font-medium">{t('Early Settlement Payoff (-8% Rebate):', 'Vorzeitige Ablöse (-8% Zinsrabatt):')}</span>
                          <span className="font-semibold text-emerald-400 text-sm tabular-nums">{formatMoney(fullPayoffDiscounted)} <span className="text-[10px] text-emerald-300/80">(-{formatMoney(fullPayoffSaved)})</span></span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-white/[0.04]">
                          <span className="text-zinc-400">{t('Available Treasury:', 'Verfügbarer Kassenbestand:')}</span>
                          <span className={`font-semibold tabular-nums ${state.budget >= fullPayoffDiscounted ? 'text-emerald-400' : 'text-zinc-300'}`}>
                            {formatMoney(state.budget)}
                          </span>
                        </div>
                      </div>

                      {canAffordEarlyPay ? (
                        showConfirmEarlyPay && isFullPayoffSelected ? (
                          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex flex-col gap-2.5">
                            <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                              <i className="fas fa-circle-check" />
                              <span>{t('Confirm Full Debt Retirement', 'Vollständige Tilgung bestätigen')}?</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              {t(
                                `Retire all ${formatMoney(activeLoan.remainingBalance)} in debt now for ${formatMoney(fullPayoffDiscounted)} (saving ${formatMoney(fullPayoffSaved)} with 8% early settlement rebate). Cancels all future annual installments.`,
                                `Gesamte Restschuld von ${formatMoney(activeLoan.remainingBalance)} jetzt für ${formatMoney(fullPayoffDiscounted)} tilgen (${formatMoney(fullPayoffSaved)} Zinsersparnis). Alle zukünftigen Raten entfallen.`
                              )}
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setShowConfirmEarlyPay(false)}
                                className="flex-1 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                              >
                                {t('Cancel', 'Abbrechen')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEarlyPayoff(undefined)}
                                className="flex-1 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
                              >
                                {t('Pay in Full', 'Vollständig bezahlen')} ({formatMoney(fullPayoffDiscounted)})
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsFullPayoffSelected(true);
                                setShowConfirmEarlyPay(true);
                              }}
                              className="w-full py-3.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/30 font-semibold text-xs sm:text-sm shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-certificate text-emerald-400" />
                              <span>{t('Settle Debt Early & Exit Restructuring', 'Schulden vorzeitig ablösen & Sanierungsplan beenden')} ({formatMoney(fullPayoffDiscounted)})</span>
                            </button>
                            <p className="text-[11px] text-emerald-300/80 text-center font-normal">
                              {t('Full lump sum payment includes an 8% early interest rebate, retires all bank liabilities, and lifts all transfer vetos immediately.', 'Einmalzahlung inkl. 8% Zinsrabatt tilgt alle Verbindlichkeiten, beendet zukünftige Raten und hebt alle Transfer-Sperren sofort auf.')}
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                            <i className="fas fa-circle-exclamation shrink-0" />
                            <span>
                              {t(
                                `Requires ${formatMoney(Math.max(0, fullPayoffDiscounted - state.budget))} more in treasury for 100% full retirement (${formatMoney(fullPayoffDiscounted)} after 8% rebate).`,
                                `Es fehlen ${formatMoney(Math.max(0, fullPayoffDiscounted - state.budget))} für eine 100%ige Gesamttilgung (${formatMoney(fullPayoffDiscounted)} nach 8% Rabatt).`
                              )}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPayoffTab('partial');
                              setPartialAmount(Math.min(maxAffordable, activeLoan.annualPayment));
                            }}
                            className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <i className="fas fa-coins text-purple-400" />
                            <span>{t('Make a Partial Payment Instead', 'Stattdessen Teiltilgung wählen')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Tab 2: Partial Repayment */
                    <div className="flex flex-col gap-3 pt-1">
                      {/* Quick Choice Presets */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                          {t('Quick Payment Presets', 'Schnell-Optionen')}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPartialAmount(Math.min(activeLoan.remainingBalance, activeLoan.annualPayment))}
                            className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                              partialAmount === Math.min(activeLoan.remainingBalance, activeLoan.annualPayment)
                                ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                                : 'bg-black/30 border-white/5 text-zinc-300 hover:bg-white/5'
                            }`}
                          >
                            <span className="block text-[9px] text-zinc-400">{t('1 Year Rate', '1 Jahresrate')}</span>
                            <span className="font-semibold tabular-nums">{formatMoney(activeLoan.annualPayment)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPartialAmount(Math.round(activeLoan.remainingBalance * 0.25))}
                            className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition cursor-pointer ${
                              partialAmount === Math.round(activeLoan.remainingBalance * 0.25)
                                ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
                                : 'bg-[#10121a] border-white/[0.04] text-zinc-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className="block text-[9px] text-zinc-400">25% {t('Debt', 'Schuld')}</span>
                            <span className="font-semibold tabular-nums">{formatMoney(Math.round(activeLoan.remainingBalance * 0.25))}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPartialAmount(Math.round(activeLoan.remainingBalance * 0.50))}
                            className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition cursor-pointer ${
                              partialAmount === Math.round(activeLoan.remainingBalance * 0.50)
                                ? 'bg-purple-500/20 border-purple-400/40 text-purple-200'
                                : 'bg-[#10121a] border-white/[0.04] text-zinc-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className="block text-[9px] text-zinc-400">50% {t('Debt', 'Schuld')}</span>
                            <span className="font-semibold tabular-nums">{formatMoney(Math.round(activeLoan.remainingBalance * 0.50))}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPartialAmount(maxAffordable)}
                            disabled={maxAffordable <= 0}
                            className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition cursor-pointer ${
                              partialAmount === maxAffordable && maxAffordable > 0
                                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                                : 'bg-[#10121a] border-white/[0.04] text-zinc-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className="block text-[9px] text-zinc-400">{t('Max Affordable', 'Max. leistbar')}</span>
                            <span className="font-semibold tabular-nums">{formatMoney(maxAffordable)}</span>
                          </button>
                        </div>
                      </div>

                      {/* Custom Amount Controls */}
                      <div className="bg-[#10121a] rounded-xl p-3 border border-white/[0.04] flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400 font-medium">{t('Repayment Sum:', 'Rückzahlungsbetrag:')}</span>
                          <span className="font-semibold text-white text-base tabular-nums">{formatMoney(partialAmount)}</span>
                        </div>

                        {/* Slider */}
                        <input
                          type="range"
                          min={Math.min(5000, fullPayoffDiscounted)}
                          max={Math.min(Math.max(5000, state.budget), fullPayoffDiscounted)}
                          step={5000}
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(Number(e.target.value))}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />

                        {/* Increment chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {[25000, 50000, 100000].map(inc => (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => setPartialAmount(prev => Math.min(maxAffordable, prev + inc))}
                              className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-medium text-zinc-300 border border-white/[0.04] transition cursor-pointer"
                            >
                              +{formatMoney(inc)}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPartialAmount(0)}
                            className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[10px] font-medium text-rose-300 border border-rose-500/20 transition cursor-pointer ml-auto"
                          >
                            {t('Reset', 'Zurücksetzen')}
                          </button>
                        </div>
                      </div>

                      {/* Live Impact Preview */}
                      {partialAmount > 0 && (
                        <div className="bg-[#10121a] border border-purple-500/20 rounded-xl p-3 text-xs flex flex-col gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                            {t('Repayment Impact', 'Effekt der Sondertilgung')}
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-zinc-400 block">{t('New Remaining Debt:', 'Neue Restschuld:')}</span>
                              <span className="font-semibold text-white tabular-nums">{formatMoney(simulatedRemaining)}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">{t('New Annual Rate:', 'Neue Jahresrate:')}</span>
                              <span className="font-semibold text-emerald-400 tabular-nums">
                                -{formatMoney(simulatedAnnualPayment)}/yr
                              </span>
                            </div>
                          </div>
                          {annualSavings > 0 && (
                            <div className="text-[10px] text-emerald-300 font-medium pt-1 border-t border-purple-500/20 flex items-center gap-1">
                              <i className="fas fa-arrow-down text-emerald-400" />
                              <span>{t(`Saves ${formatMoney(annualSavings)} each season in installments!`, `Spart ${formatMoney(annualSavings)} pro Saison an Raten!`)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {showConfirmEarlyPay && !isFullPayoffSelected ? (
                        <div className="bg-[#10121a] border border-purple-500/30 rounded-xl p-3 flex flex-col gap-2.5">
                          <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                            <i className="fas fa-coins" />
                            <span>{t('Confirm Partial Repayment', 'Vorzeitige Teiltilgung bestätigen')}?</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
                            {t(
                              `Paying ${formatMoney(partialAmount)} (+${formatMoney(partialRebateBonus)} 8% early rebate) reduces your remaining debt to ${formatMoney(simulatedRemaining)} and lowers your annual rate to ${formatMoney(simulatedAnnualPayment)}/season.`,
                              `Durch Zahlung von ${formatMoney(partialAmount)} (+${formatMoney(partialRebateBonus)} 8% Zinsrabatt) sinkt deine Restschuld auf ${formatMoney(simulatedRemaining)} und die Jahresrate auf ${formatMoney(simulatedAnnualPayment)}/Saison.`
                            )}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowConfirmEarlyPay(false)}
                              className="flex-1 py-2.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] text-zinc-300 text-xs font-medium transition cursor-pointer"
                            >
                              {t('Cancel', 'Abbrechen')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEarlyPayoff(partialAmount)}
                              className="flex-1 py-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
                            >
                              {t('Execute Payment', 'Zahlung ausführen')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsFullPayoffSelected(partialAmount >= fullPayoffDiscounted);
                            setShowConfirmEarlyPay(true);
                          }}
                          disabled={!canAffordPartial}
                          className={`w-full py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                            canAffordPartial
                              ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 active:scale-[0.99]'
                              : 'bg-white/[0.02] text-zinc-500 cursor-not-allowed border border-white/[0.04]'
                          }`}
                        >
                          <i className="fas fa-hand-holding-dollar" />
                          {canAffordPartial
                            ? `${t('Make Early Payment', 'Sondertilgung leisten')} (${formatMoney(partialAmount)})`
                            : partialAmount <= 0
                            ? t('Select Payment Amount', 'Betrag auswählen')
                            : `${t('Insufficient Treasury', 'Unzureichendes Budget')} (${formatMoney(partialAmount)})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* If NO loan is active, configure a new loan */
              <div className="flex flex-col gap-4">
                {/* Introduction info */}
                <div className="bg-[#10121a] border border-purple-500/20 rounded-2xl p-4 text-xs text-purple-200/90 leading-relaxed flex flex-col gap-1.5">
                  <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <i className="fas fa-landmark text-purple-400" />
                    <span>Commercial Bank Loan</span>
                  </div>
                  <p className="text-zinc-400 font-normal">
                    Contract an institutional bank loan over 10, 15, or 25 years. Immediate liquidity to overcome debt crises and prevent 3-year insolvency.
                  </p>
                </div>

                {/* Indebted Club Mode Toggle */}
                {isIndebted && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                      {t('Select Loan Facility Type:', 'Kredit-Art wählen:')}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLoanMode('consolidation')}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                          loanMode === 'consolidation'
                            ? 'bg-purple-500/[0.05] border-purple-500/20 text-purple-300 shadow-sm'
                            : 'bg-[#10121a] border-white/[0.04] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>{t('Debt Consolidation', 'Schulden-Konsolidierung')}</span>
                          {loanMode === 'consolidation' && <i className="fas fa-check-circle text-purple-400 text-xs" />}
                        </div>
                        <span className="text-[11px] text-emerald-400 font-semibold tabular-nums">
                          +{formatMoney(debtAmount)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-normal">
                          {t('Clears 100% of negative deficit', 'Deckt 100% des Defizits')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLoanMode('commercial')}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                          loanMode === 'commercial'
                            ? 'bg-purple-500/[0.05] border-purple-500/20 text-purple-300 shadow-sm'
                            : 'bg-[#10121a] border-white/[0.04] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>{t('Standard Commercial', 'Standard-Darlehen')}</span>
                          {loanMode === 'commercial' && <i className="fas fa-check-circle text-purple-400 text-xs" />}
                        </div>
                        <span className="text-[11px] text-zinc-200 font-semibold tabular-nums">
                          +{formatMoney(standardPrincipal)}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-normal">
                          Tier {tier} Standard Cap
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Principal Amount Highlight */}
                <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5 font-medium">
                      {isIndebted && loanMode === 'consolidation' 
                        ? t('Consolidation Facility Capital', 'Konsolidierungs-Darlehen')
                        : t('Approved Loan Capital', 'Bewilligtes Darlehen')}
                    </span>
                    <span className="text-2xl font-semibold text-emerald-400 tabular-nums">
                      +{formatMoney(effectivePrincipal)}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 bg-white/[0.03] border border-white/[0.04] px-2.5 py-1 rounded-xl font-medium">
                    {isIndebted && loanMode === 'consolidation' 
                      ? t('100% Deficit Relief', '100% Schuldenerlass')
                      : `Tier ${tier} Standard`}
                  </span>
                </div>

                {/* Term Selection (10, 15, or 25 Years) */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                    {t('Select Repayment Duration:', 'Laufzeit wählen:')}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {([10, 15, 25] as const).map((years) => {
                      const opt = loanOptions[years];
                      const isSelected = selectedTerm === years;
                      return (
                        <button
                          key={`term-${years}`}
                          type="button"
                          onClick={() => setSelectedTerm(years)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-purple-500/[0.05] border-purple-500/20 text-purple-300 shadow-sm'
                              : 'bg-[#10121a] border-white/[0.04] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold tracking-tight">{years} {t('Years', 'Jahre')}</span>
                            {isSelected && <i className="fas fa-circle-check text-purple-400 text-xs" />}
                          </div>
                          <div className="text-[11px] font-semibold text-zinc-200 tabular-nums">
                            {formatMoney(opt.annualPayment)}
                            <span className="text-[9px] text-zinc-400 font-normal">/yr</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5 tabular-nums font-normal">
                            {(opt.interestRate * 100).toFixed(1)}% APR
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Term Details Breakdown */}
                <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400 font-medium">{t('Annual Repayment Installment:', 'Jährliche Tilgungsrate:')}</span>
                    <span className="font-semibold text-rose-400 tabular-nums">-{formatMoney(currentOption.annualPayment)} / season</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400 font-medium">{t('Total Interest Over Term:', 'Gesamtzinsen über Laufzeit:')}</span>
                    <span className="font-semibold text-zinc-200 tabular-nums">+{formatMoney(currentOption.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300 pt-1.5 border-t border-white/[0.04]">
                    <span className="text-zinc-400 font-medium">{t('Total Amount Repaid:', 'Gesamtrückzahlung:')}</span>
                    <span className="font-semibold text-white tabular-nums">{formatMoney(currentOption.totalRepayment)}</span>
                  </div>
                </div>

                {/* Contract Loan CTA / Confirmation */}
                {showConfirmTake ? (
                  <div className="bg-[#10121a] border border-purple-500/20 rounded-2xl p-4 flex flex-col gap-3 shadow-sm mt-1">
                    <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm">
                      <i className="fas fa-shield-halved text-purple-400" />
                      <span>{t('Confirm Institutional Bank Loan', 'Kreditvergabe bestätigen')}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                      {t(
                        `Your club will immediately receive +${formatMoney(effectivePrincipal)} in cash. Starting this season, ${formatMoney(currentOption.annualPayment)} will be automatically deducted at each season finish for the next ${selectedTerm} years. Once taken, no additional bank loans can be contracted until fully repaid.`,
                        `Dein Verein erhält sofort +${formatMoney(effectivePrincipal)} Kassenbestand. Es werden für die nächsten ${selectedTerm} Jahre jeweils ${formatMoney(currentOption.annualPayment)} am Saisonende abgebucht. Keine weiteren Kredite bis zur vollständigen Tilgung.`
                      )}
                    </p>
                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowConfirmTake(false)}
                        className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl border border-white/[0.06] hover:bg-white/[0.04] text-zinc-300 text-xs font-medium transition cursor-pointer"
                      >
                        {t('Cancel', 'Abbrechen')}
                      </button>
                      <button
                        type="button"
                        onClick={handleTakeLoan}
                        className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <i className="fas fa-check" />
                        <span>{t('Confirm & Disburse Funds', 'Bestätigen & Auszahlen')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmTake(true)}
                    className="w-full min-h-[48px] py-3.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 font-semibold text-sm shadow-sm transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-1"
                  >
                    <i className="fas fa-file-signature" />
                    <span>{t(`Contract ${selectedTerm}-Year Loan`, `${selectedTerm}-Jahres-Kredit aufnehmen`)} (+{formatMoney(effectivePrincipal)})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
  );
};
