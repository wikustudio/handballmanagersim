import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Language } from '../types';
import { formatMoney, formatNum, getLeagueScaledVal, getPinnacleArenaCapacity, getCountryEconomicProfile, isReserveClub } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';

export const getNewBuildOptions = (tier: number, country: string = 'GER') => {
  const profile = getCountryEconomicProfile(country);
  const maxCap = profile.pinnacleArenaCap;

  if (profile.tier === 1) {
    return [
      { 
        seats: 6000, 
        cost: getLeagueScaledVal(tier, 4500000, country), 
        label: 'Modern Town Arena', 
        tag: 'Tier 2-3 Standard',
        icon: 'fa-warehouse', 
        desc: 'Compact, high-acoustic multi-purpose venue engineered for rapid atmosphere growth and reliable ticket revenue.' 
      },
      { 
        seats: 12000, 
        cost: getLeagueScaledVal(tier, 14000000, country), 
        label: 'Major League Fortress', 
        tag: 'Top-Flight Fortress',
        icon: 'fa-building', 
        desc: 'Steep bowl architecture creating an intimidating cauldron for elite first-division competition.' 
      },
      { 
        seats: Math.min(22000, Math.round(maxCap * 0.75)), 
        cost: getLeagueScaledVal(tier, 38000000, country), 
        label: 'High-Tech European Complex', 
        tag: 'EHF Elite Grade',
        icon: 'fa-industry', 
        desc: 'World-class continental stadium featuring premium corporate suites, LED ribbon boards, and broadcast studios.' 
      },
      { 
        seats: maxCap, 
        cost: getLeagueScaledVal(tier, 75000000, country), 
        label: maxCap >= 25000 ? 'Global Mega Arena' : 'National Showcase Arena', 
        tag: maxCap >= 25000 ? 'World Record Cathedral' : 'Pinnacle Continental Arena',
        icon: 'fa-city', 
        desc: `The ultimate cathedral of global handball in ${country}. A monumental ${maxCap.toLocaleString()}-seat masterpiece hosting world championships.` 
      },
    ];
  } else if (profile.tier === 2) {
    return [
      {
        seats: 4000,
        cost: getLeagueScaledVal(tier, 2800000, country),
        label: 'Regional Sports Center',
        tag: 'Tier 2-3 Standard',
        icon: 'fa-warehouse',
        desc: 'A modern regional indoor venue built for passionate supporter crowds and rapid atmospheric compounding.'
      },
      {
        seats: 7500,
        cost: getLeagueScaledVal(tier, 7500000, country),
        label: 'Top-Flight Fortress',
        tag: 'Domestic Powerhouse',
        icon: 'fa-building',
        desc: 'Steep vertical grandstands maximizing home intimidation for national title showdowns.'
      },
      {
        seats: Math.min(11000, Math.round(maxCap * 0.75)),
        cost: getLeagueScaledVal(tier, 15000000, country),
        label: 'Elite Benefactor Dome',
        tag: 'EHF European Bowl',
        icon: 'fa-industry',
        desc: 'State/industrial sponsor-backed multi-level arena equipped with VIP hospitality lounges and international media facilities.'
      },
      {
        seats: maxCap,
        cost: getLeagueScaledVal(tier, 26000000, country),
        label: 'Continental Championship Bowl',
        tag: 'Pinnacle Showpiece',
        icon: 'fa-city',
        desc: `The ultimate pinnacle venue in ${country}. A majestic ${maxCap.toLocaleString()}-seat showpiece hosting Champions League clashes.`
      }
    ];
  } else if (profile.tier === 3) {
    return [
      {
        seats: 3000,
        cost: getLeagueScaledVal(tier, 1800000, country),
        label: 'Community Sports Arena',
        tag: 'Organic Heritage',
        icon: 'fa-warehouse',
        desc: 'Sustainable fan-owned community sports hall engineered for high-frequency ticket yield and low utility overhead.'
      },
      {
        seats: 5000,
        cost: getLeagueScaledVal(tier, 4200000, country),
        label: 'Pro League Hall',
        tag: 'Top-Flight Standard',
        icon: 'fa-building',
        desc: 'A classic mid-tier European handball stadium balancing active supporter terraces with reliable operational efficiency.'
      },
      {
        seats: Math.min(6500, Math.round(maxCap * 0.85)),
        cost: getLeagueScaledVal(tier, 7200000, country),
        label: 'Corporate Suite Arena',
        tag: 'VIP Hospitality Complex',
        icon: 'fa-industry',
        desc: 'Modern venue with dedicated VIP corporate suites, maximizing corporate hospitality revenue rather than excessive raw seat expansion.'
      },
      {
        seats: maxCap,
        cost: getLeagueScaledVal(tier, 11500000, country),
        label: 'Pinnacle National Arena',
        tag: 'National Ceiling',
        icon: 'fa-city',
        desc: `The pinnacle arena size for ${country}'s sporting landscape (${maxCap.toLocaleString()} seats), optimized for full sellouts and European cup nights.`
      }
    ];
  } else {
    return [
      {
        seats: Math.min(2000, Math.round(maxCap * 0.40)),
        cost: getLeagueScaledVal(tier, 1100000, country),
        label: 'Municipal Sports Complex',
        tag: 'Grassroots Standard',
        icon: 'fa-warehouse',
        desc: 'Compact municipal hall providing solid local foundation with minimal maintenance overhead.'
      },
      {
        seats: Math.min(3500, Math.round(maxCap * 0.65)),
        cost: getLeagueScaledVal(tier, 2600000, country),
        label: 'Club Center Hall',
        tag: 'League Standard',
        icon: 'fa-building',
        desc: 'Expanded multi-sport hall meeting top-division broadcast regulations and domestic cup hosting standards.'
      },
      {
        seats: Math.min(4500, Math.round(maxCap * 0.85)),
        cost: getLeagueScaledVal(tier, 4500000, country),
        label: 'National League Arena',
        tag: 'National Contender',
        icon: 'fa-industry',
        desc: 'Modern enclosed pavilion with premium seating, press gallery, and club store.'
      },
      {
        seats: maxCap,
        cost: getLeagueScaledVal(tier, 7500000, country),
        label: 'National Showcase Arena',
        tag: 'Pinnacle Stadium',
        icon: 'fa-city',
        desc: `The pinnacle arena complex for ${country} (${maxCap.toLocaleString()} seats), hosting international tests and national cup finals.`
      }
    ];
  }
};

interface FinancingDetails {
  downPayment: number;
  principal: number;
  termYears: 10 | 15 | 25;
  annualPayment: number;
  monthlyPayment: number;
  totalRepayment: number;
  interestRate: number;
}

interface NewBuildModalProps {
  onClose: () => void;
  state: GameState;
  creditLimit: number;
  lang?: Language;
  onExpand: (cost: number, seats: number, opt?: any, financing?: FinancingDetails | null) => void;
}

export const NewBuildModal: React.FC<NewBuildModalProps> = ({ 
  onClose, 
  state, 
  creditLimit, 
  onExpand 
}) => {
  useModalDismiss(onClose);
  const currentCap = state.club.stadium || 2000;
  const country = state.club.country || 'GER';
  const isReserve = isReserveClub(state.club.name);
  const currentInfra = (state.facilitiesUpgradedThisSeason || 0) + (state.infraActionsThisSeason || 0);
  const isCranesLocked = currentInfra >= 2;
  const hasExpandedThisSeason = (state.stadiumExpandedThisSeason || 0) >= 1 || isCranesLocked;
  const maxCap = isReserve ? 1500 : getPinnacleArenaCapacity(country);
  const profile = getCountryEconomicProfile(country);
  const options = getNewBuildOptions(state.club.tier, country);
  const fillPercentage = Math.min(100, (currentCap / maxCap) * 100);

  // Deal Structuring State for Pinnacle Complexes
  const [structuringOpt, setStructuringOpt] = useState<any | null>(null);
  const [selectedDownPayment, setSelectedDownPayment] = useState<number>(0);
  const [selectedTermYears, setSelectedTermYears] = useState<15 | 25>(25);

  const handleSelectOption = (opt: any) => {
    if (isReserve || hasExpandedThisSeason) return;
    const isPinnacleComplex = opt.seats >= Math.min(10000, Math.round(maxCap * 0.70));
    const minDown = Math.round(opt.cost * 0.20);
    const canStructure = isPinnacleComplex && (state.budget + creditLimit >= minDown);
    const affordableCash = state.budget + creditLimit >= opt.cost;

    if (canStructure && (!affordableCash || isPinnacleComplex)) {
      const defaultDown = state.budget >= Math.round(opt.cost * 0.35) 
        ? Math.round(opt.cost * 0.35) 
        : Math.max(minDown, Math.min(state.budget, Math.round(opt.cost * 0.20)));
      setSelectedDownPayment(defaultDown);
      setSelectedTermYears(25);
      setStructuringOpt(opt);
    } else {
      onExpand(opt.cost, opt.seats, opt, null);
    }
  };

  // Financing calculations for currently selected complex
  const calculateFinancing = (opt: any, down: number, term: 15 | 25): FinancingDetails => {
    const principal = Math.max(0, opt.cost - down);
    const interestRate = term === 25 ? 0.045 : 0.038;
    const totalInterest = Math.round(principal * interestRate * term);
    const totalRepayment = principal + totalInterest;
    const annualPayment = Math.round(totalRepayment / term);
    const monthlyPayment = Math.round(annualPayment / 12);

    return {
      downPayment: down,
      principal,
      termYears: term,
      annualPayment,
      monthlyPayment,
      totalRepayment,
      interestRate
    };
  };

  const currentFinancing = structuringOpt 
    ? calculateFinancing(structuringOpt, selectedDownPayment, selectedTermYears) 
    : null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] rounded-2xl border border-white/[0.04] w-full max-w-xl relative z-10 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] cursor-default pointer-events-auto"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-lg shrink-0">
              <i className={structuringOpt ? 'fas fa-handshake-angle' : 'fas fa-hammer'} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                {structuringOpt ? 'Structure Infrastructure Deal' : 'Arena Project'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>{structuringOpt ? structuringOpt.label : 'Pinnacle Venue Project'}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-amber-400 font-semibold tabular-nums">{formatNum(currentCap)} / {formatNum(maxCap)} Max ({profile.tierName})</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer border border-white/[0.06]"
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4 flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {structuringOpt && currentFinancing ? (
              /* Structuring Deal View */
              <motion.div
                key="deal-structuring-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {/* Milestone Verification Banner */}
                <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <i className="fas fa-certificate text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-300">
                        Syndicate Credit Facility Active
                      </span>
                      <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        20% Down Qualifying Threshold Met
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                      Treasury Balance: <strong className="text-white font-semibold tabular-nums">{formatMoney(state.budget)}</strong>. Qualified to construct this complex in {country} with syndicate credit and long-term amortized payments.
                    </p>
                  </div>
                </div>

                {/* Project Specs */}
                <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Target Complex
                    </span>
                    <span className="text-xs font-semibold text-amber-400 tabular-nums">
                      {formatNum(structuringOpt.seats)} Seats (+{formatNum(structuringOpt.seats - currentCap)} Net)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-white">
                    <span>{structuringOpt.label}</span>
                    <span className="text-zinc-300 tabular-nums">{formatMoney(structuringOpt.cost)} Total Cost</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {structuringOpt.desc}
                  </p>
                </div>

                {/* Down Payment Selection */}
                <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <i className="fas fa-coins text-amber-400 text-xs" />
                      <span>Cash Down Payment from Treasury</span>
                    </span>
                    <span className="text-xs font-semibold text-zinc-400 tabular-nums">
                      Available: {formatMoney(state.budget)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {state.budget >= Math.round(structuringOpt.cost * 0.35) && (
                      <button
                        type="button"
                        onClick={() => setSelectedDownPayment(Math.round(structuringOpt.cost * 0.35))}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                          selectedDownPayment === Math.round(structuringOpt.cost * 0.35)
                            ? 'bg-amber-500/[0.08] border-amber-500/30 text-amber-300 shadow-sm'
                            : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white tabular-nums">{formatMoney(Math.round(structuringOpt.cost * 0.35))} Down (35%)</span>
                          <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 tabular-nums">
                          Leaves {formatMoney(state.budget - Math.round(structuringOpt.cost * 0.35))} in reserve · Lowest monthly payment
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedDownPayment(Math.max(Math.round(structuringOpt.cost * 0.20), Math.min(state.budget, Math.round(structuringOpt.cost * 0.20))))}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                        selectedDownPayment === Math.max(Math.round(structuringOpt.cost * 0.20), Math.min(state.budget, Math.round(structuringOpt.cost * 0.20)))
                          ? 'bg-amber-500/[0.08] border-amber-500/30 text-amber-300 shadow-sm'
                          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white tabular-nums">{formatMoney(Math.round(structuringOpt.cost * 0.20))} Down (20%)</span>
                        <span className="text-[10px] font-medium text-zinc-400 bg-black/40 border border-white/[0.04] px-1.5 py-0.5 rounded">
                          Minimum Down
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 tabular-nums">
                        Leaves {formatMoney(state.budget - Math.round(structuringOpt.cost * 0.20))} in reserve · Higher leverage
                      </span>
                    </button>
                  </div>
                </div>

                {/* Term Selection */}
                <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <i className="fas fa-calendar-alt text-sky-400 text-xs" />
                      <span>Financing Amortization Term</span>
                    </span>
                    <span className="text-xs font-semibold text-amber-400 tabular-nums">
                      Financed: {formatMoney(currentFinancing.principal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTermYears(25)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                        selectedTermYears === 25
                          ? 'bg-sky-500/[0.08] border-sky-500/30 text-sky-300 shadow-sm'
                          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">25 Years</span>
                        <span className="text-[10px] text-sky-300 font-medium">4.5% APR</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Municipal Syndicate Facility · Lower installments
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTermYears(15)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                        selectedTermYears === 15
                          ? 'bg-sky-500/[0.08] border-sky-500/30 text-sky-300 shadow-sm'
                          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">15 Years</span>
                        <span className="text-[10px] text-sky-300 font-medium">3.8% APR</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Accelerated Paydown · Less overall interest
                      </span>
                    </button>
                  </div>
                </div>

                {/* Structured Financial Impact Breakdown Bento */}
                <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col gap-3">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                    Deal Settlement & Debt Service Schedule
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-400 font-medium uppercase block">Upfront Cash</span>
                      <span className="text-sm font-semibold text-rose-400 tabular-nums">
                        -{formatMoney(currentFinancing.downPayment)}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-400 font-medium uppercase block">Credit Principal</span>
                      <span className="text-sm font-semibold text-amber-300 tabular-nums">
                        {formatMoney(currentFinancing.principal)}
                      </span>
                    </div>

                    <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-400 font-medium uppercase block">Monthly Payment</span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {formatMoney(currentFinancing.monthlyPayment)}<span className="text-[10px] text-zinc-400 font-normal">/mo</span>
                      </span>
                    </div>

                    <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-400 font-medium uppercase block">Annual Debt</span>
                      <span className="text-sm font-semibold text-rose-300 tabular-nums">
                        -{formatMoney(currentFinancing.annualPayment)}<span className="text-[10px] text-zinc-400 font-normal">/yr</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">
                    <strong className="text-zinc-300 font-medium">Financial Covenant:</strong> The annual installment of <span className="tabular-nums">{formatMoney(currentFinancing.annualPayment)}</span> is serviced at the end of each season. If you already have an existing bank loan, it will be safely consolidated into this facility.
                  </p>
                </div>
              </motion.div>
            ) : (
              /* Standard Complex Catalog View */
              <motion.div
                key="catalog-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {/* Capacity Progress Bento */}
                <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-4 flex flex-col gap-2.5 shrink-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fas fa-building text-amber-400 text-xs" />
                      <span>Current Arena Capacity</span>
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight tabular-nums">
                        {formatNum(currentCap)}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">seats</span>
                    </div>
                  </div>

                  {/* Progress Bar with Amber Glow */}
                  <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden relative border border-white/[0.04]">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${fillPercentage}%` }} 
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                    <span className="tabular-nums">{Math.round(fillPercentage)}% of maximum national potential</span>
                    <span className="text-amber-400 font-semibold tabular-nums">Max: {formatNum(maxCap)} Seats ({profile.tierName})</span>
                  </div>
                </div>

                {/* Maximum Mega Capacity Alert or Milestone Notice */}
                {currentCap >= maxCap ? (
                  <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center shrink-0 text-xl">
                      <i className="fas fa-crown" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white tracking-tight">Maximum Pinnacle Capacity Achieved ({formatNum(maxCap)} Seats)</h3>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
                        Your club has commissioned and operates the pinnacle indoor handball venue for {country} ({formatNum(maxCap)} seats). No further arena commissioning, expansion, or replacement projects can be structured.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-3 flex items-center justify-between text-xs text-zinc-300">
                    <span className="flex items-center gap-2">
                      <i className="fas fa-landmark text-amber-400 text-sm" />
                      <span>Structured Credit Facility: 20% Down Payment + Amortized Terms available for major complexes.</span>
                    </span>
                    <span className={`font-semibold tabular-nums ${state.budget >= 5000000 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      Bank: {formatMoney(state.budget)}
                    </span>
                  </div>
                )}

                {/* New Construction Options */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider text-[10px] px-1 flex items-center gap-1.5">
                    <i className="fas fa-layer-group text-zinc-400 text-[10px]" />
                    <span>{currentCap >= maxCap ? 'Commissioning Closed' : `Architectural Complexes (Up to ${formatNum(maxCap)} Capacity)`}</span>
                  </span>

                  {options.map((opt, i) => {
                    const isDowngradeOrSame = opt.seats <= currentCap || currentCap >= maxCap;
                    const isPinnacleComplex = opt.seats >= Math.min(10000, Math.round(maxCap * 0.70));
                    const minDownRequired = Math.round(opt.cost * 0.20);
                    const canStructure = !isReserve && !hasExpandedThisSeason && currentCap < maxCap && isPinnacleComplex && (state.budget + creditLimit >= minDownRequired);
                    const affordableCash = !isReserve && !hasExpandedThisSeason && currentCap < maxCap && (state.budget + creditLimit >= opt.cost);
                    const isActionable = !isReserve && !hasExpandedThisSeason && currentCap < maxCap && !isDowngradeOrSame && (affordableCash || canStructure);

                    return (
                      <button
                        key={`nb-opt-${i}`}
                        disabled={!isActionable}
                        onClick={() => handleSelectOption(opt)}
                        className={`group relative overflow-hidden text-left p-4 rounded-2xl border transition-all ${
                          isActionable
                            ? 'bg-[#10121a] hover:bg-sky-500/[0.03] border-white/[0.04] hover:border-sky-500/20 cursor-pointer shadow-sm active:scale-[0.99]'
                            : 'bg-white/[0.015] border-white/[0.03] opacity-45 cursor-not-allowed'
                        }`}
                      >
                        <div className="relative z-10 flex justify-between items-center gap-3">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className={`mt-0.5 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border text-sm ${
                              isActionable
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:bg-amber-500/15' 
                                : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
                            }`}>
                              <i className={`fas ${opt.icon}`} />
                            </div>

                            <div className="flex flex-col min-w-0 pr-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white text-sm sm:text-base tracking-tight">
                                  {opt.label}
                                </span>
                                <span className="text-[10px] font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                  {opt.tag}
                                </span>
                                {canStructure && (
                                  <span className="text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <i className="fas fa-handshake-angle text-[9px]" />
                                    <span>Credit & Monthly Payments Available</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-zinc-400 mt-1 font-normal leading-relaxed">
                                {opt.desc}
                              </p>

                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md tabular-nums">
                                  <i className="fas fa-ticket text-[9px]" />
                                  <span>Target: {formatNum(opt.seats)} Seats</span>
                                </span>
                                {!isDowngradeOrSame && (
                                  <span className="text-[11px] text-emerald-400 font-medium tabular-nums">
                                    +{formatNum(opt.seats - currentCap)} Net Seats
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex flex-col justify-center shrink-0 min-w-[100px]">
                            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-0.5">
                              {canStructure && !affordableCash ? 'Deal Structure' : 'Cost'}
                            </div>
                            {canStructure && !affordableCash ? (
                              <div className="font-semibold text-amber-300 text-xs sm:text-sm tabular-nums">
                                {formatMoney(minDownRequired)} Down + Credit
                              </div>
                            ) : (
                              <div className="font-semibold text-white text-base sm:text-lg tabular-nums">
                                {formatMoney(opt.cost)}
                              </div>
                            )}

                            {isReserve ? (
                              <div className="text-[10px] font-medium text-amber-400 mt-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded w-fit ml-auto">
                                Reserve Cap (1,500)
                              </div>
                            ) : hasExpandedThisSeason ? (
                              <div className="text-[10px] font-medium text-amber-400 mt-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded w-fit ml-auto">
                                {isCranesLocked && (state.stadiumExpandedThisSeason || 0) < 1 ? 'Cranes Used (2/2)' : 'Quota Used (1/1)'}
                              </div>
                            ) : currentCap >= maxCap ? (
                              <div className="text-[10px] font-medium text-amber-400 mt-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded w-fit ml-auto">
                                Pinnacle Active
                              </div>
                            ) : isDowngradeOrSame ? (
                              <div className="text-[10px] font-medium text-zinc-500 mt-1 px-1.5 py-0.5 bg-black/40 border border-white/[0.04] rounded w-fit ml-auto">
                                Already Met
                              </div>
                            ) : canStructure ? (
                              <div className="text-[10px] font-medium text-emerald-400 mt-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded w-fit ml-auto">
                                Structure Deal →
                              </div>
                            ) : !affordableCash ? (
                              <div className="text-[10px] font-medium text-rose-400 mt-1 px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded w-fit ml-auto">
                                No Funds
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.04] flex items-center justify-between shrink-0">
          {structuringOpt ? (
            <>
              <button 
                type="button"
                onClick={() => setStructuringOpt(null)}
                className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer border border-white/[0.06]"
              >
                ← Back to Complexes
              </button>

              <button 
                type="button"
                onClick={() => {
                  if (currentFinancing && structuringOpt) {
                    onExpand(structuringOpt.cost, structuringOpt.seats, structuringOpt, currentFinancing);
                  }
                }}
                className="px-6 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs rounded-xl transition border border-amber-500/30 shadow-sm active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <i className="fas fa-file-signature" />
                <span>Confirm Deal & Build {structuringOpt.label}</span>
              </button>
            </>
          ) : (
            <>
              <div className="text-xs text-zinc-400">
                Treasury: <strong className="text-white font-semibold tabular-nums">{formatMoney(state.budget)}</strong>
              </div>
              <button 
                onClick={onClose} 
                className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer border border-white/[0.06] active:scale-95"
              >
                Close
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
