import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameState } from '../types';
import { getLeagueInfo, formatMoney, formatNum, isReserveClub, calculateClubFinancials, getCreditLimit, getCountryEconomicProfile, getPinnacleArenaCapacity, COUNTRY_LEAGUES, getCurrencyForCountry, getCorporateEntityInfo, getDynamicSponsorPitchTerms } from '../data/gameConstants';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs } from '../utils/modManager';
import { t } from '../data/translations';
import { useGameStore } from '../store/useGameStore';
import { useModalDismiss } from '../utils/modalUtils';

interface LedgerModalProps {
  state: GameState;
  lang: 'en' | 'de' | 'es';
  onClose: () => void;
}

interface GovernanceConfig {
  authority: string;
  planName: string;
  councilName: string;
  councilSub: string;
  heritageLabel: string;
  councilDesc: string;
}

const getGovernanceInfo = (tier: number, country: string = 'GER', leagueName?: string): GovernanceConfig => {
  const c = country.toUpperCase();
  const lName = leagueName || `Tier ${tier}`;

  if (c === 'GER') {
    if (tier === 1) {
      return {
        authority: '1. HBL',
        planName: 'Debt Restructuring Plan',
        councilName: 'Regional Patron & Sponsor Council',
        councilSub: 'Emergency debt relief package',
        heritageLabel: '1. HBL Heritage',
        councilDesc: 'In 1. Handball-Bundesliga, traditional clubs facing crisis convene their regional business advisory board to absorb legacy deficits through emergency patron equity injections.'
      };
    }
    if (tier === 2) {
      return {
        authority: '2. HBL',
        planName: 'Debt Restructuring Plan',
        councilName: 'Regional Patron & Sponsor Council',
        councilSub: 'Emergency debt relief package',
        heritageLabel: '2. HBL Heritage',
        councilDesc: 'In the 2. Handball-Bundesliga, clubs facing relegation hangover or legacy deficits convene their regional business advisory board to absorb legacy debt through emergency patron equity injections.'
      };
    }
    return {
      authority: 'DHB',
      planName: 'Debt Restructuring Plan',
      councilName: 'Communal Business & Sponsor Circle',
      councilSub: 'Regional debt relief package',
      heritageLabel: 'German Regional Heritage',
      councilDesc: 'In German regional handball, clubs facing financial distress coordinate with local business councils and communal sponsors to absorb deficits through emergency patron equity injections.'
    };
  }

  if (c === 'FRA') {
    if (tier === 1) {
      return {
        authority: 'LNH Liqui Moly StarLigue',
        planName: 'Plan de Redressement CNCG',
        councilName: 'Regional Partner & Patron Consortium',
        councilSub: 'Emergency debt relief package (Club des Partenaires)',
        heritageLabel: 'French StarLigue Tradition',
        councilDesc: 'In French elite handball, clubs facing structural deficits agree to a CNCG financial turnaround plan backed by regional business partners and municipal guarantees.'
      };
    }
    if (tier === 2) {
      return {
        authority: 'LNH Proligue',
        planName: 'Plan de Redressement CNCG',
        councilName: 'Regional Partner & Patron Consortium',
        councilSub: 'Emergency debt relief package (Club des Partenaires)',
        heritageLabel: 'French Proligue Tradition',
        councilDesc: 'In French Proligue, clubs in deficit coordinate with regional business partners (Club des Partenaires) and local communities to inject emergency liquidity.'
      };
    }
    return {
      authority: 'FFHB Nationale',
      planName: 'Plan de Viabilité',
      councilName: 'Regional Partner Consortium',
      councilSub: 'Emergency debt relief package',
      heritageLabel: 'French Handball Tradition',
      councilDesc: 'In French federal handball, clubs agree to financial oversight under regional partner consortiums to safeguard club operations.'
    };
  }

  if (c === 'ESP') {
    if (tier === 1) {
      return {
        authority: 'Liga Plenitude ASOBAL',
        planName: 'Plan de Viabilidad',
        councilName: 'Civic Patron & Sponsor Board',
        councilSub: 'Emergency debt relief package (Junta de Patronos)',
        heritageLabel: 'Spanish ASOBAL Tradition',
        councilDesc: 'In Liga ASOBAL, historic clubs restructure debt through a sanctioned viability plan supported by regional civic patrons and corporate partners.'
      };
    }
    if (tier === 2) {
      return {
        authority: 'División de Honor Plata',
        planName: 'Plan de Viabilidad',
        councilName: 'Civic Patron & Sponsor Board',
        councilSub: 'Emergency debt relief package (Junta de Patronos)',
        heritageLabel: 'Spanish DHP Tradition',
        councilDesc: 'In División de Honor Plata, clubs convene local corporate sponsors and civic boards to absorb liabilities and preserve club status.'
      };
    }
    return {
      authority: 'RFEBM',
      planName: 'Plan de Viabilidad',
      councilName: 'Regional Sponsor Council',
      councilSub: 'Emergency debt relief package',
      heritageLabel: 'Spanish Handball Tradition',
      councilDesc: 'In Spanish regional leagues, clubs rely on municipal patrons and community sponsors to restructure club debts.'
    };
  }

  if (c === 'DEN') {
    return {
      authority: tier === 1 ? 'HTH Herreligaen' : '1. Division Håndbold',
      planName: 'Genopretningsplan',
      councilName: 'Regional Commercial & Patron Network',
      councilSub: 'Emergency debt relief package (Erhvervsnetværk)',
      heritageLabel: 'Danish Handball Heritage',
      councilDesc: `In Danish handball (${tier === 1 ? 'Herreligaen' : '1. Division'}), clubs coordinate with municipal authorities and local commercial business networks to inject emergency liquidity and safeguard league licensing.`
    };
  }

  if (c === 'POL') {
    return {
      authority: tier === 1 ? 'ORLEN Superliga' : 'Liga Centralna',
      planName: 'Plan Naprawczy',
      councilName: 'Regional Sponsor & Industrial Council',
      councilSub: 'Emergency debt relief package (Rada Sponsorów)',
      heritageLabel: 'Polish Handball Tradition',
      councilDesc: `In Polish handball (${tier === 1 ? 'Superliga' : 'Liga Centralna'}), clubs in distress work with regional industrial conglomerates and local sponsor councils to resolve legacy liabilities.`
    };
  }

  if (c === 'SWE') {
    return {
      authority: tier === 1 ? 'Handbollsligan' : 'Allsvenskan',
      planName: 'Saneringsplan',
      councilName: 'Regional Business & Sponsor Network',
      councilSub: 'Emergency debt relief package (Näringslivsnätverk)',
      heritageLabel: 'Swedish Handball Heritage',
      councilDesc: `In Swedish handball (${tier === 1 ? 'Handbollsligan' : 'Allsvenskan'}), clubs partner with regional commercial networks and local municipal backers to inject emergency stability capital.`
    };
  }

  if (c === 'NOR') {
    return {
      authority: tier === 1 ? 'REMA 1000-ligaen' : '1. divisjon håndball',
      planName: 'Handlingsplan for økonomi',
      councilName: 'Regional Commercial & Sponsor Council',
      councilSub: 'Emergency debt relief package (Næringslivsråd)',
      heritageLabel: 'Norwegian Handball Heritage',
      councilDesc: `In Norwegian handball, clubs facing deficit work under NHF licensing oversight with regional business councils to absorb legacy liabilities.`
    };
  }

  return {
    authority: `${lName} Licensing Authority`,
    planName: 'Financial Recovery Plan',
    councilName: 'Regional Patron & Sponsor Council',
    councilSub: 'Emergency debt relief package (Patron Consortium)',
    heritageLabel: `${country} Handball Tradition`,
    councilDesc: `In ${lName}, traditional clubs facing severe deficit convene regional business patrons and key commercial sponsors to absorb legacy liabilities through emergency equity relief.`
  };
};

export const LedgerModal: React.FC<LedgerModalProps> = ({ state, lang, onClose }) => {
  useModalDismiss(onClose);
  const tr = (en: string, _de?: string) => en;

  const country = state.club.country || 'GER';
  const corpInfo = getCorporateEntityInfo(country);
  const currencySymbol = getCurrencyForCountry(country).symbol;
  const profile = getCountryEconomicProfile(country);
  const pinnacleCap = getPinnacleArenaCapacity(country);
  const clubDbEntry =
    getActiveClubs(country).find(c => c.name === state.club?.name || String(c.id) === String(state.club?.id)) ||
    ALL_CLUBS.find(c => c.name === state.club?.name || String(c.id) === String(state.club?.id));
  const tier = state.club?.tier ?? clubDbEntry?.tier ?? state.startTier ?? 4;
  const league = getLeagueInfo(tier, country);
  const gov = getGovernanceInfo(tier, country, league?.name);
  const isReserve = isReserveClub(state.club.name);

  const fin = calculateClubFinancials(state);
  const wages = fin.wages;
  const estRevenue = fin.estRevenue;

  const squadWagesAndOps = (fin as any).pureWages || wages;
  const stadiumTotal = (fin as any).stadiumOp || 0;
  const medicalTotal = (fin as any).medicalOp || 0;
  const youthTotal = (fin as any).academyOp || 0;
  const travelAdminTotal = (fin as any).travelAdminOp || 0;
  const euroTravelTotal = (fin as any).euroTravelTax || 0;
  const debtInterestTotal = (fin as any).debtInterest || 0;
  const luxuryTaxTotal = (fin as any).luxuryTax || 0;
  const shareholderDividendTotal = (fin as any).shareholderDividend || 0;
  const activeLoan = state.activeLoan;
  const loanInstallment = (fin as any).loanInstallment !== undefined 
    ? (fin as any).loanInstallment 
    : ((activeLoan && activeLoan.yearsRemaining > 0) ? activeLoan.annualPayment : 0);
  const totalOpExp = squadWagesAndOps + stadiumTotal + travelAdminTotal + medicalTotal + youthTotal + euroTravelTotal + luxuryTaxTotal + debtInterestTotal + loanInstallment + shareholderDividendTotal;
  
  // Net Profit = Revenue - Total Expenses (Exactly matches fin.net and DashboardHeader)
  const netProfit = fin.net;
  const operatingMargin = (fin as any).operatingMargin ?? (estRevenue - (totalOpExp - loanInstallment - debtInterestTotal));

  const creditLimit = getCreditLimit(tier, country);
  const seasonsInDebt = state.seasonsInDebt || 0;
  
  // "Deeply in debt": deficit exceeds 65% of the league's credit facility, or more than 1 red season under deficit
  const deepDebtThreshold = Math.round(Math.max(50000, creditLimit * 0.65));
  const currentBudget = typeof state.budget === 'number' ? state.budget : 100000;
  const isDeeplyInDebt = currentBudget <= -deepDebtThreshold || (seasonsInDebt >= 1 && currentBudget <= -Math.max(30000, creditLimit * 0.30));

  // Patron Council Frequency: Once every 3 seasons (3-year governance cycle)
  const seasonsSincePatronRescue = state.lastPatronRescueYear ? state.year - state.lastPatronRescueYear : 999;
  const patronCooldownRemaining = Math.max(0, 3 - seasonsSincePatronRescue);
  const isPatronReady = patronCooldownRemaining === 0;

  const loanPercentPaid = activeLoan
    ? Math.min(100, Math.max(0, Math.round(((activeLoan.totalRepayment - activeLoan.remainingBalance) / activeLoan.totalRepayment) * 100)))
    : 0;

  const alreadyCreditedSponsorIncome = state.sponsorIncome || 0;
  const projectedEndBalance = currentBudget + (netProfit - alreadyCreditedSponsorIncome);

  const [showEarlyPayoff, setShowEarlyPayoff] = useState(false);
  const [showMarketInfo, setShowMarketInfo] = useState(false);
  const [repayStrategy, setRepayStrategy] = useState<'reduce_installment' | 'shorten_term'>('reduce_installment');
  const [repaySuccessMsg, setRepaySuccessMsg] = useState<string | null>(null);
  const [patronRescueMsg, setPatronRescueMsg] = useState<string | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center p-3 sm:p-4 justify-center z-[100] backdrop-blur-2xl cursor-pointer"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 16, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }} 
        exit={{ scale: 0.95, y: 16, opacity: 0 }} 
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] w-full max-w-lg rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white pointer-events-auto relative cursor-default max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.04] bg-[#14151e] shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {tr('Treasury & Accounts', 'Kasse & Bilanzen')}
              </span>
              <span className="text-xs text-zinc-400 font-normal">
                {league.name}
              </span>
              <span className="text-[10px] text-zinc-400 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.04] font-medium flex items-center gap-1">
                <i className="fas fa-layer-group text-sky-400 text-[9px]" />
                <span>{country} · Tier {tier}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              {state.club.name}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar overscroll-contain flex flex-col gap-4">
          
          {/* Main Treasury Bento - Net Profit Spotlight */}
          <div className="bg-[#10121a] rounded-2xl p-4 sm:p-5 border border-white/[0.04] flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <i className="fas fa-vault text-emerald-400" />
                  {tr('Current Treasury & Net Profit', 'Aktuelle Kasse & Netto-Ergebnis')}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md border tabular-nums ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                   {netProfit >= 0 ? tr('Profitable', 'Gewinnbringend') : tr('Deficit', 'Defizit')}
                </span>
             </div>
             
             {/* Key Figures Row */}
             <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-black/30 rounded-xl p-3 border border-white/[0.04]">
                   <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                      {tr('Current Treasury', 'Kassenbestand')}
                   </span>
                   <span className={`text-xl sm:text-2xl font-semibold tracking-tight tabular-nums ${currentBudget < 0 ? 'text-rose-400' : 'text-white'}`}>
                      {formatMoney(currentBudget)}
                   </span>
                </div>

                {/* Net Profit highlighted */}
                <div className="bg-black/30 rounded-xl p-3 border border-white/[0.04]">
                   <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                      {tr('Net Profit / Loss', 'Netto-Gewinn / Verlust')}
                   </span>
                   <span className={`text-xl sm:text-2xl font-semibold tracking-tight tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {netProfit >= 0 ? '+' : ''}{formatMoney(netProfit)}
                   </span>
                </div>
             </div>

             <div className="flex justify-between items-center text-xs pt-2 border-t border-white/[0.04]">
                <span className="text-zinc-400 font-normal">{tr('Est. End-of-Season Balance', 'Erwarteter Endbestand')}</span>
                <span className={`text-sm font-semibold tabular-nums ${projectedEndBalance < 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                   {formatMoney(projectedEndBalance)}
                </span>
             </div>

             {(() => {
               const pitchTerms = getDynamicSponsorPitchTerms(state);
               const deals: any = (state.seasonSponsorDeals && state.seasonSponsorDealsYear === state.year) ? state.seasonSponsorDeals : {};
               const slots = [
                 { key: 'standard' as const, label: tr('Standard', 'Standard'), brand: deals[0]?.brandName || pitchTerms.standardBrand.name, status: deals[0]?.status || 'available', amount: deals[0]?.status === 'signed' ? (deals[0].payout ?? pitchTerms.standardPayout) : pitchTerms.standardPayout },
                 { key: 'mega' as const, label: tr('Megadeal', 'Megadeal'), brand: deals[1]?.brandName || pitchTerms.megaBrand.name, status: deals[1]?.status || 'available', amount: deals[1]?.status === 'signed' ? (deals[1].payout ?? pitchTerms.megaPayout) : pitchTerms.megaPayout },
                 { key: 'perf' as const, label: tr('Performance', 'Performance'), brand: deals[2]?.brandName || pitchTerms.perfBrand.name, status: deals[2]?.status || 'available', amount: deals[2]?.status === 'signed' ? (deals[2].bonus ?? pitchTerms.performanceBonus) : pitchTerms.performanceBonus }
               ];
               return (
                 <div className="flex flex-col gap-1.5 px-3 py-2.5 bg-sky-500/[0.05] rounded-xl border border-sky-500/20 text-xs">
                   <div className="flex justify-between items-center text-sky-300">
                     <span className="font-normal flex items-center gap-1.5">
                       <i className="fas fa-handshake text-sky-400 text-xs" />
                       {tr('Season Sponsor Slots (Pitched Income):', 'Saison-Sponsoren-Plätze (Pitches):')}
                     </span>
                     <span className="font-semibold tabular-nums">+{formatMoney(state.sponsorIncome || 0)}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-1.5 pt-1">
                     {slots.map(s => (
                       <div key={s.key} className="px-2 py-1 rounded-lg bg-black/30 border border-white/[0.06] flex flex-col gap-0.5">
                         <div className="flex items-center justify-between gap-1">
                           <span className="text-[9px] uppercase tracking-wider text-zinc-500">{s.label}</span>
                           <span className={`text-[9px] font-semibold ${
                             s.status === 'signed' ? 'text-emerald-400' : s.status === 'failed' ? 'text-rose-400' : 'text-amber-300'
                           }`}>
                             {s.status === 'signed' ? tr('Signed', 'Aktiv') : s.status === 'failed' ? tr('Empty', 'Leer') : tr('Open', 'Offen')}
                           </span>
                         </div>
                         <span className="text-[10px] font-semibold text-zinc-200 truncate">
                           {s.status === 'failed' ? tr('Empty', 'Leer') : s.brand}
                         </span>
                       </div>
                     ))}
                   </div>
                 </div>
               );
             })()}
          </div>

          {/* Active Bank Loan Tracker */}
          {activeLoan && (
            <div className="bg-purple-500/[0.04] border border-purple-500/20 rounded-2xl p-4 text-left flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-purple-300">
                  <i className="fas fa-landmark text-purple-400" />
                  {activeLoan.loanType === 'arena_syndicate' 
                    ? tr('Arena Project Syndicate Credit', 'Arena-Infrastruktur-Kredit')
                    : tr('Institutional Bank Loan', 'Institutioneller Bankkredit')}
                </span>
                <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-lg text-[11px] font-medium tabular-nums">
                  {loanPercentPaid}% {tr('Paid Off', 'Abbezahlt')}
                </span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${loanPercentPaid}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-300 pt-0.5">
                <span className="text-zinc-400">
                  {tr('Remaining Debt:', 'Restschuld:')} <strong className="text-rose-400">{formatMoney(activeLoan.remainingBalance)}</strong>
                </span>
                <span className="text-zinc-400">
                  {activeLoan.yearsRemaining} / {activeLoan.termYears} {tr('years', 'Jahre')} ({formatMoney(Math.round(activeLoan.annualPayment / 12))}/mo)
                </span>
              </div>

              {/* Early Repayment Action & Section */}
              <div className="pt-1.5 border-t border-purple-500/20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowEarlyPayoff(!showEarlyPayoff)}
                  className="w-full py-2 px-3 rounded-xl bg-purple-500/[0.08] hover:bg-purple-500/[0.15] text-purple-300 border border-purple-500/20 font-medium text-xs transition cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-hand-holding-dollar text-purple-400 text-xs" />
                    <span>{tr('Early Loan Repayment Options', 'Kredit vorzeitig tilgen')}</span>
                  </span>
                  <i className={`fas fa-chevron-${showEarlyPayoff ? 'up' : 'down'} text-[10px] text-purple-300`} />
                </button>

                {repaySuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <i className="fas fa-check-circle shrink-0" />
                    <span>{repaySuccessMsg}</span>
                  </div>
                )}

                {showEarlyPayoff && (
                  <div className="bg-[#10121a] rounded-xl p-3 border border-purple-500/20 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{tr('Early Repayment Strategy:', 'Tilgungsstrategie:')}</span>
                      <span className="text-[10px] text-emerald-300 font-medium bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        8% Interest Rebate
                      </span>
                    </div>

                    {/* Strategy Selector Toggle */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/[0.04] text-[10px] font-medium">
                      <button
                        type="button"
                        onClick={() => setRepayStrategy('reduce_installment')}
                        className={`py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                          repayStrategy === 'reduce_installment'
                            ? 'bg-purple-500/20 border border-purple-500/30 text-purple-200 font-semibold shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <i className="fas fa-arrow-down-wide-short" />
                        <span>{tr('Lower Yearly Rate', 'Rate senken')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayStrategy('shorten_term')}
                        className={`py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                          repayStrategy === 'shorten_term'
                            ? 'bg-purple-500/20 border border-purple-500/30 text-purple-200 font-semibold shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <i className="fas fa-clock-rotate-left" />
                        <span>{tr('Shorten Duration', 'Laufzeit kürzen')}</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-zinc-400 leading-snug">
                      {repayStrategy === 'reduce_installment'
                        ? tr('Prepayments reduce future annual installments to maximize yearly operating cash flow.', 'Zahlungen senken die jährliche Rate zur Entlastung des Saisonbudgets.')
                        : tr('Prepayments accelerate payoff, shaving years off your 25-year debt horizon.', 'Zahlungen verkürzen die Gesamtlaufzeit, um die Schulden Jahre früher zu tilgen.')}
                    </div>

                    {/* Full Payoff Button */}
                    {(() => {
                      const fullPayoffDiscounted = Math.round(activeLoan.remainingBalance * 0.92);
                      const discountAmount = activeLoan.remainingBalance - fullPayoffDiscounted;
                      const canFullPayoff = currentBudget >= fullPayoffDiscounted;

                      return (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={!canFullPayoff}
                            onClick={() => {
                              const res = useGameStore.getState().repayClubLoanEarly(fullPayoffDiscounted, repayStrategy);
                              if (res.success) setRepaySuccessMsg(res.message);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl font-semibold text-xs bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <i className="fas fa-check-double text-[11px]" />
                            <span>{tr('Retire Loan in Full (100%)', 'Kredit vollständig ablösen')} ({formatMoney(fullPayoffDiscounted)})</span>
                          </button>
                          <span className="text-[10px] text-emerald-400/90 text-center">
                            Includes +{formatMoney(discountAmount)} (8%) unearned interest settlement rebate
                          </span>
                          {!canFullPayoff && (
                            <span className="text-[10px] text-rose-300 text-center">
                              {tr(
                                `Treasury needs ${formatMoney(fullPayoffDiscounted - currentBudget)} more for 100% payoff.`,
                                `Es fehlen ${formatMoney(fullPayoffDiscounted - currentBudget)} zur vollständigen Tilgung.`
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Partial Payoff Quick Options */}
                    <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                        {tr('Partial Early Payments:', 'Teiltilgungen:')}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {activeLoan.annualPayment <= activeLoan.remainingBalance && (
                          <button
                            type="button"
                            disabled={currentBudget < activeLoan.annualPayment}
                            onClick={() => {
                              const res = useGameStore.getState().repayClubLoanEarly(activeLoan.annualPayment, repayStrategy);
                              if (res.success) setRepaySuccessMsg(res.message);
                            }}
                            className="py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.06] text-[11px] font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            1 Rate ({formatMoney(activeLoan.annualPayment)})
                          </button>
                        )}
                        {currentBudget > 0 && currentBudget < activeLoan.remainingBalance && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = useGameStore.getState().repayClubLoanEarly(currentBudget, repayStrategy);
                              if (res.success) setRepaySuccessMsg(res.message);
                            }}
                            className="py-1.5 px-2 rounded-lg bg-purple-500/[0.08] hover:bg-purple-500/[0.15] text-purple-200 border border-purple-500/20 text-[11px] font-medium transition cursor-pointer"
                          >
                            {tr('All Cash', 'Gesamte Kasse')} ({formatMoney(currentBudget)})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Public Joint-Stock Corporation (AG) Equity & Capital Markets Monitor */}
          {state.club.isPublic && (
            <div className="bg-[#10121a] border border-amber-500/20 rounded-2xl p-4 text-left flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <i className="fas fa-chart-line text-amber-400" />
                  {state.club.name} {corpInfo.legalForm} · {tr(corpInfo.fullName, corpInfo.fullNameDe)}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium tabular-nums border ${
                  (() => {
                    const sp = state.club.stockPrice || 0;
                    const ipo = state.club.ipoPrice || sp;
                    const diff = Math.round(sp * 100) - Math.round(ipo * 100);
                    return diff < 0
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      : diff > 0
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : 'bg-white/[0.04] text-zinc-300 border-white/[0.06]';
                  })()
                }`}>
                  {(() => {
                    const sp = state.club.stockPrice || 0;
                    const ipo = state.club.ipoPrice || sp;
                    const diff = Math.round(sp * 100) - Math.round(ipo * 100);
                    return diff === 0
                      ? '0.0% (At Par)'
                      : diff > 0
                      ? `+${(((sp - ipo) / ipo) * 100).toFixed(1)}% vs IPO`
                      : `${(((sp - ipo) / ipo) * 100).toFixed(1)}% vs IPO`;
                  })()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#14151e] p-2.5 rounded-xl border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5 font-medium">
                    {tr('Live Stock / IPO Price', 'Aktienkurs / IPO-Basis')}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white font-semibold text-sm tabular-nums">
                      {currencySymbol}{(state.club.stockPrice || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-500 tabular-nums font-normal">
                      (IPO: {currencySymbol}{(state.club.ipoPrice || state.club.stockPrice || 0).toFixed(2)})
                    </span>
                  </div>
                </div>
                <div className="bg-[#14151e] p-2.5 rounded-xl border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5 font-medium">
                    {tr('Market Capitalization', 'Marktkapitalisierung')}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-amber-300 font-semibold text-sm tabular-nums">
                      {formatMoney((state.club.stockPrice || 0) * 1000000, country)}
                    </span>
                    <span className="text-[10px] text-zinc-500 tabular-nums font-normal">
                      (1M sh)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-1 border-t border-white/[0.04]">
                <span>{tr('Audited Dividend in Ledger', 'Im Jahresabschluss enthaltene Dividende')}:</span>
                <span className={`font-semibold tabular-nums ${shareholderDividendTotal > 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                  {shareholderDividendTotal > 0 ? `-${formatMoney(shareholderDividendTotal, country)}` : `${formatMoney(0, country)} (No operating surplus)`}
                </span>
              </div>
            </div>
          )}

          {/* Financial Regulation & Recovery Plan Status */}
          {(currentBudget < 0 || seasonsInDebt > 0 || projectedEndBalance < 0) && (
            <div className={`rounded-2xl p-4 text-left flex flex-col gap-2.5 border ${
              netProfit >= 0 
                ? 'bg-sky-500/[0.05] border-sky-500/20' 
                : 'bg-rose-500/[0.05] border-rose-500/20'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={`flex items-center gap-1.5 ${netProfit >= 0 ? 'text-sky-300' : 'text-rose-400'}`}>
                  <i className={`fas ${netProfit >= 0 ? 'fa-shield-halved text-sky-400' : 'fa-triangle-exclamation text-rose-400'}`} />
                  {netProfit >= 0 ? `${gov.authority} Restructuring Plan Compliant` : 'Operating Deficit Risk'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  netProfit >= 0 
                    ? 'bg-sky-500/10 text-sky-200 border-sky-500/20' 
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                }`}>
                  {netProfit >= 0 ? 'Turnaround Active' : `${Math.min(3, seasonsInDebt + 1)}/3 Crisis Yrs`}
                </span>
              </div>
              <p className={`text-xs leading-relaxed font-normal ${netProfit >= 0 ? 'text-sky-200/90' : 'text-rose-200/90'}`}>
                {netProfit >= 0 ? (
                  <>
                    <strong className="font-semibold">Operating Surplus Protected:</strong> Your projected operating profit of <strong className="text-white font-semibold">+{formatMoney(netProfit)}</strong> actively pays down debt.
                    {alreadyCreditedSponsorIncome > 0 && (
                      <span className="block mt-1 text-emerald-300 font-medium">
                        <i className="fas fa-handshake text-xs mr-1" />
                        Includes <strong>+{formatMoney(alreadyCreditedSponsorIncome, country)}</strong> in commercial megadeals & sponsorship pitches negotiated this season, deposited directly to reduce debt.
                      </span>
                    )}
                    <span className="block mt-1">
                      Under {gov.authority} regulations, clubs operating with a positive seasonal cash flow are compliant with their {gov.planName}—<strong className="font-semibold text-white">no point deductions or insolvency penalties</strong> will be issued.
                    </span>
                  </>
                ) : (
                  <>
                    <strong className="font-semibold">Expanding Operating Deficit:</strong> Your projected seasonal operating costs exceed revenue. Under {gov.authority} regulations, persistent operating losses under debt incur league licensing penalties.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Regional Patron & Sponsor Rescue Package - shows when deeply in debt or just convened */}
          {(isDeeplyInDebt || Boolean(patronRescueMsg)) && (
            <div className="bg-[#10121a] rounded-2xl p-4 border border-amber-500/20 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs shrink-0">
                    <i className="fas fa-handshake" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white tracking-tight">
                      {gov.councilName}
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-normal">
                      {gov.councilSub}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    {gov.heritageLabel}
                  </span>
                  <span className="text-[10px] font-medium text-amber-200/90 bg-black/40 border border-white/[0.04] px-2 py-0.5 rounded flex items-center gap-1">
                    <i className="fas fa-clock-rotate-left text-[9px] text-amber-400" />
                    {tr('1x every 3 seasons', '1x alle 3 Saisons')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
                {gov.councilDesc}
              </p>

              {/* Patron Cooldown & Status Bar */}
              {isPatronReady ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-emerald-300">
                  <i className="fas fa-circle-check text-emerald-400 shrink-0" />
                  <span>
                    {tr(
                      'Council Ready: Regional patrons are assembled and prepared to absorb 50% of outstanding debt.',
                      'Wirtschaftsrat bereit: Regionale Förderer stehen bereit, 50% der Altschulden zu übernehmen.'
                    )}
                  </span>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-amber-200/90">
                  <i className="fas fa-hourglass-half text-amber-400 shrink-0" />
                  <span>
                    {tr(
                      `On Cooldown (${patronCooldownRemaining} season${patronCooldownRemaining === 1 ? '' : 's'} remaining): Council last convened in ${state.lastPatronRescueYear}. Patrons observe a 3-season governance cycle.`,
                      `Abklingzeit (${patronCooldownRemaining} Saison${patronCooldownRemaining === 1 ? '' : 'en'} verbleibend): Zuletzt einberufen im Jahr ${state.lastPatronRescueYear}. Förderer greifen nur alle 3 Jahre ein.`
                    )}
                  </span>
                </div>
              )}

              {patronRescueMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <i className="fas fa-check-circle shrink-0 text-sm text-emerald-400" />
                  <span>{patronRescueMsg}</span>
                </div>
              )}

              {isPatronReady ? (
                <button
                  type="button"
                  onClick={() => {
                    const res = useGameStore.getState().applyPatronRescuePackage();
                    setPatronRescueMsg(res.message);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/[0.08] hover:bg-amber-500/[0.15] text-amber-200 border border-amber-500/20 font-medium text-xs shadow-sm active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fas fa-users-viewfinder text-amber-400" />
                  <span>Convene Patron Council (Absorb 50% Debt: +{formatMoney(Math.round(Math.abs(currentBudget) * 0.50))})</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.04] text-zinc-500 font-medium text-xs cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <i className="fas fa-lock text-xs text-zinc-600" />
                  <span>
                    {tr(
                      `Patron Council on Cooldown (Available in ${patronCooldownRemaining} season${patronCooldownRemaining === 1 ? '' : 's'})`,
                      `Wirtschaftsrat in Abklingzeit (Verfügbar in ${patronCooldownRemaining} Saison${patronCooldownRemaining === 1 ? '' : 'en'})`
                    )}
                  </span>
                </button>
              )}
            </div>
          )}


          {/* Income & Expense Breakdown */}
          <div className="bg-[#10121a] rounded-2xl p-4 sm:p-5 border border-white/[0.04] flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <i className="fas fa-chart-pie text-zinc-400" />
              <span>{tr('Annual Budget Breakdown', 'Einnahmen & Kosten im Detail')}</span>
            </h4>
            
            {/* Revenue Stream */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span>{tr('Matchday & Ticket Sales', 'Ticket- & Spieltag-Erlöse')}</span>
                  {fin.expectedAtt ? (
                    <span className="text-[10px] text-zinc-500 font-normal">({fin.expectedAtt.toLocaleString()} avg)</span>
                  ) : null}
                </span>
                <span className="text-white font-medium tabular-nums">+{formatMoney(fin.matchdayIncome ?? fin.matchdayIncomeK)}</span>
              </div>
              {(fin.tvPrize || 0) > 0 && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span>{tr('TV & Broadcasting Base', 'TV- & Mediengelder')}</span>
                  <span className="text-white font-medium tabular-nums">+{formatMoney(fin.tvPrize || 0)}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>{tr('Commercial Sponsorship', 'Sponsoring & Werbung')}</span>
                  <span className="text-white font-medium tabular-nums">+{formatMoney(fin.sponsorInc)}</span>
                </div>
                {Array.isArray(fin.sponsorDrivers) && fin.sponsorDrivers.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-2">
                    {fin.sponsorDrivers.map((d: any, idx: number) => (
                      <span
                        key={idx}
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                          d.positive
                            ? 'text-emerald-300/90 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-rose-300/90 bg-rose-500/10 border-rose-500/20'
                        }`}
                      >
                        {tr(d.labelEn, d.labelDe)} {d.pct !== 'Brand' ? d.pct : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {(() => {
                const pitchTerms = getDynamicSponsorPitchTerms(state);
                const deals: any = (state.seasonSponsorDeals && state.seasonSponsorDealsYear === state.year) ? state.seasonSponsorDeals : {};
                const slots = [
                  { key: 'standard' as const, label: 'Standard', brand: deals[0]?.brandName || pitchTerms.standardBrand.name, status: deals[0]?.status || 'available' },
                  { key: 'mega' as const, label: 'Megadeal', brand: deals[1]?.brandName || pitchTerms.megaBrand.name, status: deals[1]?.status || 'available' },
                  { key: 'perf' as const, label: 'Performance', brand: deals[2]?.brandName || pitchTerms.perfBrand.name, status: deals[2]?.status || 'available' }
                ];
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="flex items-center gap-1.5 text-sky-300">
                        <i className="fas fa-handshake text-[10px]" />
                        <span>{tr('Pitched Megadeals & Partner Contracts', 'Akquirierte Megadeals & Sponsoren-Pitches')}</span>
                      </span>
                      <span className="text-emerald-400 font-semibold tabular-nums">+{formatMoney(fin.extraSponsorInc || 0)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pl-2">
                      {slots.map(s => (
                        <span
                          key={s.key}
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                            s.status === 'signed'
                              ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                              : s.status === 'failed'
                              ? 'text-zinc-500 bg-white/[0.02] border-white/[0.06]'
                              : 'text-amber-300/90 bg-amber-500/10 border-amber-500/20'
                          }`}
                        >
                          {s.label}: {s.status === 'failed' ? tr('Empty', 'Leer') : s.brand} ({s.status === 'signed' ? tr('Signed', 'Aktiv') : s.status === 'failed' ? tr('Missed', 'Leer') : tr('Unpitched', 'Offen')})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="flex justify-between items-center text-zinc-400">
                <span>{tr('League Merit / Prize Money', 'Ligaprämien & Platzierung')}</span>
                <span className="text-white font-medium tabular-nums">+{formatMoney(fin.posPrize ?? fin.posPrizeK)}</span>
              </div>
              {fin.euroRev > 0 && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span>{tr('European Competitions', 'Europapokal-Prämien')}</span>
                  <span className="text-emerald-400 font-medium tabular-nums">+{formatMoney(fin.euroRev)}</span>
                </div>
              )}
              {isReserve && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span>{tr('Parent Club Grant', 'Zuschuss Profiabteilung')}</span>
                  <span className="text-emerald-400 font-medium tabular-nums">+{formatMoney(fin.parentClubGrant)}</span>
                </div>
              )}
              {(fin.treasuryReserveYield || 0) > 0 && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <i className="fas fa-piggy-bank text-[10px]" />
                    <span>{tr('Treasury Reserve Yield (2% Dividend)', 'Zinsertrag Kassenreserve (2% Dividende)')}</span>
                  </span>
                  <span className="text-emerald-400 font-medium tabular-nums">+{formatMoney(fin.treasuryReserveYield || 0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-white/[0.04]">
                <span className="text-zinc-200">{tr('Total Projected Revenue', 'Gesamteinnahmen')}</span>
                <span className="text-emerald-400 tabular-nums">+{formatMoney(estRevenue)}</span>
              </div>
            </div>

            <div className="w-full h-px bg-white/[0.04] my-0.5" />

            {/* Operating Costs */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>{tr('Squad & Coaching Payroll', 'Gehaltsbudget Kader & Staff')}</span>
                <span className="text-rose-400 font-medium tabular-nums">-{formatMoney(squadWagesAndOps)}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>{tr('Arena Maintenance & Utilities', 'Hallenmiete & Betrieb')}</span>
                <span className="text-rose-400 font-medium tabular-nums">-{formatMoney(stadiumTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>{tr('Team Travel, Admin & Operations', 'Reisekosten, Geschäftsstelle & Spielbetrieb')}</span>
                <span className="text-rose-400 font-medium tabular-nums">-{formatMoney(travelAdminTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>{tr('Medical & Physio Services', 'Medizinische Abteilung')}</span>
                <span className="text-rose-400 font-medium tabular-nums">-{formatMoney(medicalTotal)}</span>
              </div>
              {youthTotal > 0 && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span>{tr('Youth Academy Center', 'Nachwuchsleistungszentrum')}</span>
                  <span className="text-rose-400 font-medium tabular-nums">-{formatMoney(youthTotal)}</span>
                </div>
              )}
              {euroTravelTotal > 0 && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span>{tr('European Away Travel', 'Europapokal-Reisekosten')}</span>
                  <span className="text-rose-400 font-medium tabular-nums">-{formatMoney(euroTravelTotal)}</span>
                </div>
              )}
              {tier <= 2 && luxuryTaxTotal > 0 && (
                <div className="flex justify-between items-center text-zinc-400 bg-amber-500/[0.05] p-2 -mx-2 rounded-xl border border-amber-500/15">
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-scale-balanced text-amber-400 text-xs" />
                    <div>
                      <span className="text-amber-300 font-medium block leading-tight">
                        {tr('Competitive Balance & Luxury Tax', 'Luxussteuer & Liga-Solidarität')}
                      </span>
                      <span className="text-[10px] text-amber-400/80 leading-tight">
                        {((fin as any).treasuryLuxuryTax > 0 && (fin as any).payrollLuxuryTax > 0)
                          ? tr('Surplus Treasury + Squad Payroll Cap', 'Kassenüberschuss + Gehaltscap')
                          : (fin as any).treasuryLuxuryTax > 0
                          ? tr('Surplus Treasury (>€8M)', 'Kassenüberschuss (>€8M)')
                          : tr('Squad Payroll Cap Excess', 'Gehaltsobergrenzen-Überhang')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-rose-400 font-semibold tabular-nums">-{formatMoney(luxuryTaxTotal)}</span>
                    <span className="text-[10px] text-zinc-500">
                      {(fin as any).treasuryLuxuryTax > 0 ? `-${formatMoney((fin as any).treasuryLuxuryTax)} treasury` : ''}
                      {(fin as any).treasuryLuxuryTax > 0 && (fin as any).payrollLuxuryTax > 0 ? ' · ' : ''}
                      {(fin as any).payrollLuxuryTax > 0 ? `-${formatMoney((fin as any).payrollLuxuryTax)} wages` : ''}
                    </span>
                  </div>
                </div>
              )}
              {(shareholderDividendTotal > 0 || state.club.isPublic) && (
                <div className={`flex justify-between items-center text-zinc-400 p-2 -mx-2 rounded-xl border ${
                  shareholderDividendTotal > 0 ? 'bg-rose-500/[0.05] border-rose-500/15' : 'bg-white/[0.02] border-white/[0.05]'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <i className={`fas fa-chart-line text-xs ${shareholderDividendTotal > 0 ? 'text-rose-400' : 'text-zinc-500'}`} />
                    <div>
                      <span className={`font-medium block leading-tight ${shareholderDividendTotal > 0 ? 'text-rose-300' : 'text-zinc-300'}`}>
                        {tr('Public Shareholder Dividend', 'Aktionärsdividende')}
                      </span>
                      <span className="text-[10px] text-zinc-400 leading-tight">
                        {shareholderDividendTotal > 0
                          ? (state.club.stockPrice && state.club.ipoPrice && Math.round(state.club.stockPrice * 100) < Math.round(state.club.ipoPrice * 100)
                            ? tr('Elevated Yield Penalty (Stock below IPO)', 'Strafdividende (Kurs unter IPO)')
                            : tr('10% Baseline Slice of Operating Margin', '10% Basis-Gewinnausschüttung'))
                          : tr('No dividend due (operating margin ≤ 0)', 'Keine Dividende (operative Marge ≤ 0)')}
                      </span>
                    </div>
                  </div>
                  <span className={`font-semibold tabular-nums ${shareholderDividendTotal > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {shareholderDividendTotal > 0 ? `-${formatMoney(shareholderDividendTotal, country)}` : formatMoney(0, country)}
                  </span>
                </div>
              )}
              {loanInstallment > 0 && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-purple-300 flex items-center gap-1">
                    <i className="fas fa-landmark text-[10px]" />
                    {activeLoan?.loanType === 'arena_syndicate' 
                      ? tr('Arena Project Syndicate Credit', 'Arena-Infrastruktur-Kredit')
                      : tr('Bank Loan Installment', 'Bankkredit-Rate')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 tabular-nums">
                      ({formatMoney(Math.round(loanInstallment / 12))}/mo)
                    </span>
                    <span className="text-rose-400 font-medium tabular-nums">-{formatMoney(loanInstallment)}</span>
                  </div>
                </div>
              )}
              {debtInterestTotal > 0 && (
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-rose-300 flex items-center gap-1">
                    <i className="fas fa-triangle-exclamation text-[10px]" />
                    {tr('Overdraft Deficit Penalty (Interest)', 'Überziehungszinsen')}
                  </span>
                  <span className="text-rose-400 font-medium tabular-nums">-{formatMoney(debtInterestTotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-white/[0.04]">
                <span className="text-zinc-200">{tr('Total Operating Costs', 'Gesamtausgaben')}</span>
                <span className="text-rose-400 tabular-nums">-{formatMoney(totalOpExp)}</span>
              </div>
            </div>

            {/* Net Profit Summary */}
            <div className="flex justify-between items-center text-xs font-semibold pt-2 border-t border-white/[0.04] bg-[#14151e] p-2.5 rounded-xl border border-white/[0.04]">
              <span className="text-white">{tr('Projected Net Profit / Loss', 'Erwarteter Netto-Gewinn')}</span>
              <span className={`tabular-nums text-sm font-semibold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netProfit >= 0 ? '+' : ''}{formatMoney(netProfit)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>{tr('Overdraft Facility:', 'Kreditlinie:')}</span>
            <span className="font-semibold text-white tabular-nums">{formatMoney(creditLimit)}</span>
          </div>

          {/* Optional Collapsible Country Economic Profile */}
          <div className="border border-white/[0.05] rounded-xl overflow-hidden bg-white/[0.015]">
            <button
              type="button"
              onClick={() => setShowMarketInfo(!showMarketInfo)}
              className="w-full py-2.5 px-3 text-[11px] text-zinc-400 hover:text-zinc-200 transition flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <i className="fas fa-globe-europe text-sky-400 text-[10px]" />
                <span>{country} Commercial Media Profile ({profile.tierName.includes(':') ? profile.tierName.split(':')[1].trim() : profile.tierName})</span>
              </span>
              <i className={`fas fa-chevron-${showMarketInfo ? 'up' : 'down'} text-[9px] text-zinc-500`} />
            </button>
            {showMarketInfo && (
              <div className="p-3 pt-1 border-t border-white/[0.04] text-[11px] text-zinc-400 flex flex-col gap-2 bg-black/20">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block">TV Baseline</span>
                    <span className="font-semibold text-white">{country === 'GER' ? '100% (€450K)' : `${Math.round(profile.tvScale * 100)}%`}</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block">Sponsor Scale</span>
                    <span className="font-semibold text-emerald-300">{Math.round(profile.sponsorScale * 100)}%</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block">Cost Index</span>
                    <span className="font-semibold text-sky-300">{Math.round(profile.operationalCostScale * 100)}% of GER</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block">Luxury Threshold</span>
                    <span className="font-semibold text-amber-300">{formatMoney((fin as any).luxuryThreshold || 8000000)}</span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block">Pinnacle Arena</span>
                    <span className="font-semibold text-purple-300">{formatNum(pinnacleCap)} seats</span>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 pt-0.5">
                  <i className="fas fa-scale-balanced text-amber-400 text-[9px]" />
                  <span>{tr('Progressive luxury tax activates above €8.0M treasury surplus or for squad payroll exceeding soft cap.', 'Progressive Luxussteuer reguliert übermäßige Kassenbestände (>€8M) und Gehaltsexzesse für die Liga-Parität.')}</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Close Button */}
        <div className="p-4 sm:p-5 border-t border-white/[0.04] bg-[#14151e] shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-3.5 px-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-xs sm:text-sm transition-all active:scale-[0.99] cursor-pointer border border-white/[0.06] flex items-center justify-center gap-2"
          >
            <span>{tr('Close Ledger', 'Schließen')}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
