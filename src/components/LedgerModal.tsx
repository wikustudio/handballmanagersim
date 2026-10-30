import React from 'react';
import { motion } from 'framer-motion';
import { GameState } from '../types';
import { getLeagueInfo, formatMoney, calculateClubFinancials, getCreditLimit, isReserveClub } from '../data/gameConstants';
import { t as translate } from '../data/translations';
import { calculateAcademySubLedger } from '../engine/subLedgerEngine';

interface LedgerModalProps {
  state: GameState;
  lang: 'en' | 'de' | 'es';
  onUpdateScoutingDial?: (dialPct: number) => void;
  onClose: () => void;
}

export const LedgerModal: React.FC<LedgerModalProps> = ({ state, lang, onUpdateScoutingDial, onClose }) => {
  const tr = (en: string, de?: string) => translate(lang, en, de);
  const t = tr;
  const league = getLeagueInfo(state.club.tier, state.club.country || 'GER');
  const fin = calculateClubFinancials({ ...state, isManaged: true });
  const financials = fin;

  const wages = fin.wages;
  const matchdayIncomeK = fin.matchdayIncomeK;
  const posPrizeK = fin.posPrizeK;
  const euroRev = fin.euroRev;
  const sponsorInc = fin.sponsorInc;
  const parentClubGrant = fin.parentClubGrant;
  const estRevenue = fin.estRevenue;

  const pureWages = (fin as any).pureWages;
  const luxuryTax = (fin as any).luxuryTax;
  const stadiumTotal = (fin as any).stadiumOp;
  const medicalTotal = (fin as any).medicalOp;
  const youthTotal = (fin as any).academyOp;
  const severanceOp = (fin as any).severanceOp || 0;
  const bankLoanDebtService = (fin as any).bankLoanDebtService || 0;
  const shareholderDividend = (fin as any).shareholderDividend || 0;

  const operatingMargin = fin.net;
  
  const creditLimit = getCreditLimit(state.club.tier, state.club.country || 'GER');
  const seasonsInDebt = state.seasonsInDebt || 0;
  const isDefensiveTactic = state.tactic === 'Defensive' || state.tactic === 'Catenaccio' || state.tactic === 'Park the Bus';
  const maxDebtYears = isDefensiveTactic ? 4 : 3;

  const currentBudget = typeof state.budget === 'number' ? state.budget : 100000;
  const projectedEndBalance = currentBudget + operatingMargin;


  

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 bg-black/75 flex flex-col items-center p-2.5 sm:p-4 justify-center z-50 backdrop-blur-2xl cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.98, opacity: 0 }} 
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/95 text-white w-full sm:max-w-lg rounded-[28px] sm:rounded-[32px] shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/[0.08] pointer-events-auto relative cursor-default max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto flex flex-col overflow-hidden backdrop-blur-3xl shrink-0"
      >
        {/* Subtle Ambient Sky-Blue Accent */}
        <div className="absolute -top-20 -left-20 w-52 h-52 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* 1. Frosted Sticky Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 text-base shrink-0">
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                <span>{tr('Financial Ledger', 'Finanzbericht')}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">{league.name}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5">
                {state.club.name}
              </h3>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 custom-scrollbar relative z-10 text-left">
        
        {currentBudget > 60000 && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3 text-left text-xs mb-3 flex items-start gap-2.5">
            <i className="fa-solid fa-sack-dollar text-rose-400 mt-0.5 shrink-0"></i>
            <div className="text-[11px] text-zinc-300 leading-snug">
              <span className="font-semibold text-rose-300 mr-1.5">{tr('FFP Luxury Tax Active:', 'FFP-Reichensteuer aktiv:')}</span>
              {tr(
                'Luxury Tax active on cash reserves over €60M: 10% >€60M · 25% >€150M · 40% >€300M. Reinvest before year-end to minimize taxation.',
                'Reichensteuer auf Barreserven über €60M: 10% >€60M · 25% >€150M · 40% >€300M. Vor Saisonende reinvestieren.'
              )}
            </div>
          </div>
        )}

        <div className="text-left space-y-3">
          {/* Compact 3-Column Treasury Summary */}
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.08] shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
              <div className="p-2 sm:p-0 border-b sm:border-b-0 sm:border-r border-white/[0.06] sm:pr-3">
                <span className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${currentBudget < 0 ? 'bg-rose-400' : 'bg-sky-400'}`}></span>
                  {tr('Current Treasury', 'Aktuelles Budget')}
                </span>
                <span className={`text-lg sm:text-xl font-bold tabular-nums ${currentBudget < 0 ? 'text-rose-400' : 'text-white'}`}>
                  {formatMoney(currentBudget)}
                </span>
              </div>
              <div className="p-2 sm:p-0 border-b sm:border-b-0 sm:border-r border-white/[0.06] sm:px-3">
                <span className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  {tr('Projected Margin', 'Betriebsbilanz')}
                </span>
                <span className={`text-lg sm:text-xl font-bold tabular-nums ${operatingMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {operatingMargin >= 0 ? '+' : ''}{formatMoney(operatingMargin)}
                </span>
              </div>
              <div className="p-2 sm:p-0 sm:pl-3">
                <span className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  {tr('Est. End Balance', 'Gesch. Saisonende')}
                </span>
                <span className={`text-lg sm:text-xl font-bold tabular-nums ${projectedEndBalance < 0 ? 'text-rose-400' : 'text-sky-300'}`}>
                  {formatMoney(projectedEndBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Operations Breakdown */}
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.08] shadow-sm">
            <div className="text-zinc-300 font-semibold mb-3 uppercase text-[10px] tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-chart-line text-sky-400"></i>
              <span>{tr('END-OF-SEASON OPERATIONS PROJECTION', 'SAISONENDE BETRIEBS-PROGNOSE')}</span>
            </div>
            
            <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-2.5 border-b border-white/[0.06] pb-1.5">
              {tr('OPERATING INCOME', 'BETRIEBSEINNAHMEN')}
            </div>
            
            {matchdayIncomeK >= 1 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">{tr('Matchday Income', 'Spieltageinnahmen')}</span>
                <span className="text-white tabular-nums font-medium">+{formatMoney(matchdayIncomeK)}</span>
              </div>
            )}
            
            {league.tvPrize > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">{tr('TV Rights', 'TV-Rechte')}</span>
                <span className="text-white tabular-nums font-medium">+{formatMoney(league.tvPrize)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-400">{tr('League Position (Est.)', 'Liga-Platzierung (Gesch.)')}</span>
              <span className="text-white tabular-nums font-medium">+{formatMoney(posPrizeK)}</span>
            </div>
            
            {euroRev > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">{['GER','ENG','ESP','ITA','FRA','POR','SCO','WAL','POL','AUT','SUI','TUR'].includes(state.club.country || 'GER') ? 'European Prize' : 'Continental Prize'} ({state.euroStatus})</span>
                <span className="text-white tabular-nums font-medium">+{formatMoney(euroRev)}</span>
              </div>
            )}
            
            {parentClubGrant > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">{isReserveClub(state.club.name) ? tr('Parent Club Grant (II Team)', 'Mutterverein-Zuschuss (II)') : tr('Association Grant', 'Verbandszuschuss')}</span>
                <span className="text-emerald-400 tabular-nums font-medium">+{formatMoney(parentClubGrant)}</span>
              </div>
            )}
            
            {fin.boardSubsidy > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">{tr('Board Subsidy', 'Vorstandszuschuss')}</span>
                <span className="text-emerald-400 tabular-nums font-medium">+{formatMoney(fin.boardSubsidy)}</span>
              </div>
            )}

            {(fin as any).academyDividend > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">{tr('Youth Solidarity Dividend (Lvl 5)', 'Solidaritätsdividende (Akademie Lvl 5)')}</span>
                <span className="text-emerald-400 tabular-nums font-medium">+{formatMoney((fin as any).academyDividend)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-xs mb-3">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span>{tr('Base Sponsorships', 'Sponsoring')}</span>
                {state.failedSponsorTargetNextSeason && (
                  <span className="text-[9px] text-amber-300 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {tr('-40% Penalty', '-40% Strafe')}
                  </span>
                )}
              </span>
              <span className={`tabular-nums font-medium ${sponsorInc < 0 ? 'text-rose-400' : 'text-white'}`}>
                {sponsorInc < 0 ? '' : '+'}{formatMoney(sponsorInc)}
              </span>
            </div>
            
            <div className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider mb-2.5 mt-3 border-b border-white/[0.06] pb-1.5">
              {tr('OPERATING EXPENSES', 'BETRIEBSAUSGABEN')}
            </div>
            
            <div className="flex justify-between text-xs mb-1.5 flex-wrap">
              <span className="text-zinc-400">{tr('Squad Wage', 'Kader-Gehaelter')}</span>
              <span className="text-white tabular-nums font-medium">-{formatMoney((fin as any).pureWages)}</span>
              {(state.veteranRingerActive || state.veteranRingerSignedThisSeason) && (
                <div className="w-full text-[10px] text-amber-400/80 mt-0.5">
                  {tr(
                    `Includes Veteran Ringer Contract (${state.veteranRingerName || 'Legend'}: -${formatMoney((fin as any).veteranRingerWageSurcharge || state.veteranRingerWageK || 0)})`,
                    `Enthält Altstar-Vertrag (${state.veteranRingerName || 'Ikone'}: -${formatMoney((fin as any).veteranRingerWageSurcharge || state.veteranRingerWageK || 0)})`
                  )}
                </div>
              )}
            </div>
            
            {(fin as any).luxuryTax > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-rose-400 font-medium">{tr('FFP Wealth & Luxury Tax', 'FFP Reichensteuer')}</span>
                <span className="text-rose-400 tabular-nums font-medium">-{formatMoney((fin as any).luxuryTax)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-xs mb-1.5 flex-wrap">
              <span className="text-zinc-400">{tr('Stadium Upkeep', 'Stadion-Unterhalt')}</span>
              <span className="text-white tabular-nums font-medium">-{formatMoney(stadiumTotal)}</span>
              {fin.venueRentFee > 0 && <div className="w-full text-[10px] text-amber-400/80 mt-0.5">{tr('Includes Venue Lease Deficit Fee', 'Enthaelt Stadion-Ausweichmiete')}</div>}
            </div>
            
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-400">{tr('Medical Staff', 'Medizin-Personal')}</span>
              <span className="text-white tabular-nums font-medium">-{formatMoney(medicalTotal)}</span>
            </div>
            
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-400">{tr('Academy Coaches', 'Jugend-Trainer')}</span>
              <span className="text-white tabular-nums font-medium">-{formatMoney(youthTotal)}</span>
            </div>

            {severanceOp > 0 && (
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-rose-400 font-medium">{tr('Coach Severance Pay', 'Trainer-Abfindungen')}</span>
                <span className="text-rose-400 tabular-nums font-medium">-{formatMoney(severanceOp)}</span>
              </div>
            )}

            {(fin as any).debtInterest > 0 && (
              <div className="flex justify-between text-xs mb-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                <span className="text-rose-400 font-medium">{tr('Interest Payment on Debt (10%)', 'Zinszahlungen auf Schulden (10%)')}</span>
                <span className="text-rose-400 tabular-nums font-medium">-{formatMoney((fin as any).debtInterest)}</span>
              </div>
            )}

            {bankLoanDebtService > 0 && (
              <div className="flex justify-between text-xs mb-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                <span className="text-rose-400 font-medium flex items-center gap-1.5">
                  <i className="fa-solid fa-building-columns text-[10px]"></i>
                  <span>
                    {tr('Bank Debt Service', 'Bankkredit-Tilgung')}
                    {state.bankLoan && (
                      <span className="text-[10px] text-zinc-400 ml-1 font-normal">
                        ({state.bankLoan.totalYears - state.bankLoan.yearsLeft + 1}/{state.bankLoan.totalYears} {tr('yrs', 'J.')})
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-rose-400 tabular-nums font-medium">-{formatMoney(bankLoanDebtService)}</span>
              </div>
            )}

            {state.isPublic && (
              <div className="flex items-center justify-between text-xs mb-1.5 mt-2 pt-2 border-t border-white/[0.06] text-amber-200/90 font-medium">
                <span>{t('Public Shareholder Dividend', 'Aktionärsdividende')}</span>
                <span className="font-bold tabular-nums">
                  -{formatMoney(financials.shareholderDividend || 0, state.club.country)}
                </span>
              </div>
            )}

            <div className="border-t border-white/[0.08] mt-3.5 pt-2.5 flex items-center justify-between font-semibold text-sm">
              <span className="text-white">{tr('Annual Projected Margin', 'Prognostizierte Betriebsbilanz')}</span>
              <span className={`tabular-nums font-bold ${operatingMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {operatingMargin >= 0 ? '+' : ''}{formatMoney(operatingMargin)}
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider text-left font-medium">
              {tr('This margin is applied to your treasury on Decision Day.', 'Diese Bilanz wird am Decision Day mit dem Konto verrechnet.')}
            </p>
          </div>

          {/* Segmented Dual Sub-Ledger: Developmental Academy ROI & Cost per Asset */}
          {(() => {
            const subLedger = calculateAcademySubLedger(state);
            const currentDial = subLedger.scoutingDialPct;

            return (
              <div className="bg-emerald-500/[0.03] rounded-2xl p-4 border border-emerald-500/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-seedling text-xs"></i>
                    <span>{tr('DEVELOPMENTAL SUB-LEDGER & ROI', 'NACHWUCHS-TEILBILANZ & ROI')}</span>
                  </span>
                  <span className="text-emerald-300 font-mono text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {subLedger.roiMultiplier}x {tr('Talent ROI', 'Rendite')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Column 1: Cost Per Asset Produced */}
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-1.5">
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">
                      {tr('Acquisition Cost / Asset', 'Kosten pro Nachwuchsprofi')}
                    </div>
                    <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                      {formatMoney(subLedger.effectiveCostPerGraduateK)}
                    </div>
                    <div className="text-[10px] text-zinc-400 border-t border-white/5 pt-1 flex justify-between">
                      <span>{tr('Market Avg:', 'Marktwert:')}</span>
                      <span className="text-zinc-300 font-mono line-through">{formatMoney(subLedger.marketBenchmarkCostK)}</span>
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      {subLedger.totalGraduates3Yr} {tr('graduates over 3 seasons', 'Talente in 3 Saisons')}
                    </div>
                  </div>

                  {/* Column 2: Fixed Upkeep vs Variable Dial */}
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-1.5">
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">
                      {tr('Campus & Scouting Upkeep', 'Infrastruktur & Scouting')}
                    </div>
                    <div className="text-xs text-zinc-300 flex justify-between">
                      <span className="text-zinc-400">{tr('Fixed Base:', 'Fixkosten:')}</span>
                      <span className="font-mono text-white">-{formatMoney(subLedger.fixedBaseUpkeepK)}</span>
                    </div>
                    <div className="text-xs text-zinc-300 flex justify-between border-t border-white/5 pt-1">
                      <span className="text-zinc-400">{tr('Variable Scouting:', 'Scouting-Dial:')}</span>
                      <span className="font-mono text-sky-400">+{currentDial}%</span>
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      {currentDial > 0 ? `+${formatMoney(subLedger.variableScoutingK)}/yr` : tr('Base intake quality', 'Basis-Talentqualität')}
                    </div>
                  </div>
                </div>

                {/* Variable Investment Dial (0% to +50%) */}
                {onUpdateScoutingDial && (
                  <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-300 font-semibold">{tr('Aggressive Scouting & Nutrition Dial:', 'Scouting- & Ernährungs-Dial:')}</span>
                      <span className="text-sky-300 font-bold font-mono">+{currentDial}%</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      {[0, 10, 20, 35, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => onUpdateScoutingDial(pct)}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            currentDial === pct
                              ? 'bg-sky-500 text-white shadow-sm'
                              : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                          }`}
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Credit & Debt Rules */}
          <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.08] shadow-sm space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-amber-400 font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-scale-balanced text-xs"></i>
                <span>{tr('CREDIT & DEBT RULES', 'KREDIT & SCHULDENREGELN')}</span>
              </span>
              <span className="text-zinc-300 tabular-nums text-xs font-semibold">
                {tr('MAX LIMIT:', 'MAX LIMIT:')} -{formatMoney(creditLimit)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-white/[0.06]">
              <span className="text-zinc-400 text-xs">{tr(`Insolvency Counter (${maxDebtYears} Yr Max)`, `Insolvenz-Zaehler (Max ${maxDebtYears} J.)`)}</span>
              <span className={`font-semibold px-2.5 py-1 rounded-xl text-[10px] tabular-nums ${
                seasonsInDebt >= maxDebtYears - 1
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                  : seasonsInDebt >= 1
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
              }`}>
                {seasonsInDebt}/{maxDebtYears} {tr('Red Seasons', 'Schuldenjahre')}
              </span>
            </div>

            {(currentBudget < 0 || seasonsInDebt > 0) && (
              <div className="pt-2 border-t border-white/[0.06] text-[11px] text-rose-300/90 leading-relaxed flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation text-rose-400 text-xs mt-0.5 shrink-0"></i>
                <span>
                  {tr(
                    `Finishing in debt triggers point deductions & 10% interest. After ${maxDebtYears} red seasons: Emergency Fire Sale (-40% to -50% squad OVR) or administrative demotion!`,
                    `Saisonabschluss im Minus führt zu Punktabzügen & 10% Zinsen. Nach ${maxDebtYears} Schuldenjahren: Notverkäufe (-40% bis -50% GES) oder Zwangsabstieg!`
                  )}
                </span>
              </div>
            )}

            {state.bankLoan && state.bankLoan.yearsLeft > 0 && (
              <div className="pt-2.5 border-t border-white/[0.06] text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sky-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <i className="fa-solid fa-building-columns"></i>
                    {tr('Active Bank Facility', 'Aktiver Bankkredit')}
                  </span>
                  <span className="text-sky-300 text-[10px] font-bold">
                    {state.bankLoan.yearsLeft} / {state.bankLoan.totalYears} {tr('Yrs Left', 'Jahre')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                  <span>{tr('Principal Repayment / Yr', 'Tilgung p.a.')}</span>
                  <span className="text-rose-400 font-semibold tabular-nums">-{formatMoney(state.bankLoan.annualPayment)}/yr</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400 text-[11px] mt-0.5">
                  <span>{tr('Estimated Balance Due', 'Restverbindlichkeit')}</span>
                  <span className="text-white font-medium tabular-nums">
                    {formatMoney(state.bankLoan.principal)}
                  </span>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* 3. Sticky Action Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] shrink-0 relative z-10">
          <button 
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="w-full bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-sm py-3 rounded-2xl transition active:scale-95 cursor-pointer border border-white/[0.08]"
          >
            {tr('Close', 'Schliessen')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
