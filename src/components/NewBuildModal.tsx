import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { formatMoney, formatNum, getLeagueStadiumRequirement, getCreditLimit, getCountryMult } from '../data/gameConstants';

interface NewBuildModalProps {
  state: GameState;
  lang: Language;
  onClose: () => void;
  onBuild: (capacity: number, cost: number, fanBoost: number, bundle?: { academyLevel: number; medicalLevel: number }) => void;
}

export const NewBuildModal: React.FC<NewBuildModalProps> = ({ state, onClose, onBuild }) => {
  const options = [
    {
      seats: 45000,
      cost: 300000, 
      fanBoost: 10000,
      labelEn: 'Modern Bowl Arena',
      descEn: 'Mid-sized modern stadium engineered for top-flight national competition.',
      minLeague: 3
    },
    {
      seats: 60000,
      cost: 650000, 
      fanBoost: 20000,
      labelEn: 'Elite Arena',
      descEn: 'Large European elite amphitheater with world-class acoustic engineering.',
      minLeague: 2
    },
    {
      seats: 89000,
      cost: 950000, 
      fanBoost: 35000,
      labelEn: 'Colossal Stadium',
      descEn: 'Monumental world-class arena. Intimidating atmosphere for any visiting club.',
      minLeague: 1
    },
    {
      seats: 80000,
      cost: 1200000, 
      fanBoost: 30000,
      labelEn: 'Integrated Sports Campus',
      descEn: 'A sprawling 80,000-seat arena bundled with state-of-the-art Level 3 Academy and Medical facilities.',
      minLeague: 2,
      isMegaProject: true,
      bundle: { academyLevel: 3, medicalLevel: 3 }
    },
    {
      seats: 150000,
      cost: 2500000, 
      fanBoost: 60000,
      labelEn: 'Global Football City',
      descEn: 'The ultimate 150,000-seat architectural marvel. Fully maxes out your Academy (Level 5) and Medical (Level 5) infrastructure.',
      minLeague: 1,
      isMegaProject: true,
      bundle: { academyLevel: 5, medicalLevel: 5 }
    }
  ];

  const currentCap = state.club.stadium || 0;
  const tier = state.club.tier || 5;
  const country = state.club.country || 'GER';
  const requiredCap = getLeagueStadiumRequirement(tier, country);
  
  const countryMult = getCountryMult(country);
  const ovrFactor = Math.pow(1.015, Math.max(0, Math.min(85, state.club.baseOvr) - 50));
  const successMult = (state.clWins || 0) > 0 ? 1.15 : 1.0;
  const mult = countryMult * ovrFactor * successMult;

  const creditLimit = getCreditLimit(tier, country);
  const availableLiquidity = state.budget + creditLimit;

  const alreadyExpanded = (state.stadiumExpandedThisSeason || 0) >= 1;
  const totalProjects = (state.stadiumExpandedThisSeason || 0) + (state.academyUpgradedThisSeason || 0) + (state.medicalUpgradedThisSeason || 0);
  const isProjectCapped = totalProjects >= 2;

  const standardOptions = options.filter(o => !o.isMegaProject);
  const megaProjects = options.filter(o => o.isMegaProject);

  const getFundingBreakdown = (cost: number) => {
    const cashAvailable = Math.max(0, state.budget);
    const cashUsed = Math.min(cashAvailable, cost);
    const creditUsed = Math.max(0, cost - cashUsed);
    return { cashUsed, creditUsed };
  };

  const FacilityUpgradeBadge = ({ icon, name, current, target }: { icon: string, name: string, current: number, target: number }) => {
    const finalLevel = Math.max(current, target);
    const isUpgraded = finalLevel > current;
    
    return (
      <div className="flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex-1 min-w-[120px]">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
          <i className={`fa-solid ${icon}`}></i> {name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-medium text-sm">Lvl {current}</span>
          {isUpgraded ? (
            <>
              <i className="fa-solid fa-arrow-right text-[10px] text-zinc-600"></i>
              <span className="text-emerald-400 font-bold text-sm">Lvl {finalLevel}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-arrow-right text-[10px] text-zinc-600"></i>
              <span className="text-zinc-500 font-bold text-sm">Maintained</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.1, ease: 'linear' }} 
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-2xl text-left cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.98, opacity: 0 }} 
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }} 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0e1015]/95 text-white w-full max-w-5xl rounded-[28px] shadow-[0_24px_64px_rgba(0,0,0,0.8)] border border-white/[0.08] relative flex flex-col max-h-[92vh] min-h-0 my-auto shrink-0 overflow-hidden cursor-default"
      >
        {/* Minimalist Header */}
        <div className="px-6 py-5 border-b border-white/[0.05] bg-white/[0.01] flex justify-between items-center shrink-0">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">
              Civil Engineering & Infrastructure
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              New Stadium Construction
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.05] cursor-pointer shrink-0"
          >
            <i className="fas fa-xmark text-xs"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto overscroll-contain custom-scrollbar flex-1 min-h-0">
          
          {/* Executive Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 mb-6">
            <div className="flex gap-6 md:gap-12">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Current Capacity</div>
                <div className="text-lg font-bold text-white tabular-nums">{formatNum(currentCap)}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">League Standard</div>
                <div className="text-lg font-bold text-zinc-300 tabular-nums">{formatNum(requiredCap)}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Total Liquidity (Cash + Credit)</div>
                <div className="text-lg font-bold text-emerald-400 tabular-nums">{formatMoney(availableLiquidity)}</div>
              </div>
            </div>
          </div>

          {/* External Financing Instructional Banner */}
          <div className="bg-sky-500/[0.03] border border-sky-500/20 rounded-xl p-3.5 mb-6 flex items-start gap-3 text-sky-200/80 text-xs leading-relaxed">
            <i className="fa-solid fa-building-columns text-sky-400 mt-0.5 shrink-0"></i>
            <div>
              <strong className="text-sky-300 font-semibold mr-1.5">Project Financing:</strong>
              Construction automatically utilizes your Treasury Cash first, followed by your available Credit Facility. If a project exceeds your total liquidity, you must manually secure a Bank Loan or launch an IPO from the Corporate Action Panel before authorizing the build.
            </div>
          </div>

          {/* MEGA PROJECTS SECTION */}
          {megaProjects.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-zinc-300 mb-3 tracking-wide uppercase">Integrated Mega-Projects</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {megaProjects.map((mega) => {
                  const actualCost = Math.floor(mega.cost * mult);
                  const canAfford = availableLiquidity >= actualCost;
                  const isDowngrade = currentCap >= mega.seats;
                  const allowedTier = tier <= mega.minLeague;
                  const disabled = alreadyExpanded || isProjectCapped || !canAfford || isDowngrade || !allowedTier;
                  const { cashUsed, creditUsed } = getFundingBreakdown(actualCost);

                  return (
                    <div key={mega.seats} className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between transition hover:border-white/[0.1]">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-bold text-white">{mega.labelEn}</h4>
                          <span className="text-xs font-bold text-sky-400 tabular-nums">{formatNum(mega.seats)} Seats</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-5 min-h-[34px]">
                          {mega.descEn}
                        </p>

                        {/* Explicit Bundle Protection UI */}
                        {mega.bundle && (
                          <div className="flex flex-wrap gap-3 mb-6">
                            <FacilityUpgradeBadge icon="fa-graduation-cap" name="Academy" current={state.club.academyLevel || 1} target={mega.bundle.academyLevel} />
                            <FacilityUpgradeBadge icon="fa-heart-pulse" name="Medical" current={state.club.medicalLevel || 1} target={mega.bundle.medicalLevel} />
                          </div>
                        )}
                        
                        {/* Funding Breakdown */}
                        <div className="bg-black/30 rounded-xl p-3.5 border border-white/[0.04] mb-6 text-xs">
                           <div className="flex justify-between mb-1.5">
                              <span className="text-zinc-500">Project Cost</span>
                              <span className="font-bold text-white tabular-nums">{formatMoney(actualCost)}</span>
                           </div>
                           <div className="flex justify-between mb-1.5">
                              <span className="text-zinc-500">Treasury Cash Used</span>
                              <span className="font-semibold text-zinc-300 tabular-nums">{formatMoney(cashUsed)}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-zinc-500">Credit Facility Used</span>
                              <span className="font-semibold text-amber-400/80 tabular-nums">{formatMoney(creditUsed)}</span>
                           </div>
                        </div>
                      </div>

                      <button
                        disabled={disabled}
                        onClick={() => onBuild(mega.seats, actualCost, mega.fanBoost, mega.bundle)}
                        className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 ${
                          alreadyExpanded || isProjectCapped || isDowngrade || !allowedTier
                            ? 'bg-white/[0.02] text-zinc-600 border border-white/[0.04] cursor-not-allowed'
                            : !canAfford
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-zinc-200 shadow-lg'
                        }`}
                      >
                        {alreadyExpanded ? <span>Project Completed This Season</span> 
                          : isProjectCapped ? <span>Max 2 Projects Reached (2/2)</span>
                          : isDowngrade ? <span>Current Venue is Larger</span>
                          : !allowedTier ? <span>Requires League {mega.minLeague} Status</span> 
                          : !canAfford ? <span>Insufficient Capital — Seek External Financing</span>
                          : <><i className="fas fa-hammer"></i> Authorize Project</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STANDARD PROJECTS GRID */}
          <div>
             <h3 className="text-sm font-bold text-zinc-300 mb-3 tracking-wide uppercase">Standard Stadium Builds</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {standardOptions.map((opt) => {
                const actualCost = Math.floor(opt.cost * mult);
                const canAfford = availableLiquidity >= actualCost;
                const isDowngrade = currentCap >= opt.seats;
                const allowedTier = tier <= opt.minLeague;
                const disabled = alreadyExpanded || isProjectCapped || !canAfford || isDowngrade || !allowedTier;
                const { cashUsed, creditUsed } = getFundingBreakdown(actualCost);

                return (
                  <div key={opt.seats} className={`bg-white/[0.02] border rounded-2xl p-5 flex flex-col justify-between transition-all ${isDowngrade ? 'opacity-40 border-transparent' : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-white">{opt.labelEn}</h4>
                        <span className="text-xs font-bold text-zinc-300 tabular-nums">{formatNum(opt.seats)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed mb-4 min-h-[34px]">
                        {opt.descEn}
                      </p>

                      <div className="space-y-1.5 text-[11px] mb-5">
                        <div className="flex justify-between text-zinc-400">
                          <span>Cost</span>
                          <span className="font-semibold text-white">{formatMoney(actualCost)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Credit Used</span>
                          <span className="font-semibold text-amber-400/80">{formatMoney(creditUsed)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Fan Growth</span>
                          <span className="font-semibold text-emerald-400">+{formatNum(opt.fanBoost)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={disabled}
                      onClick={() => onBuild(opt.seats, actualCost, opt.fanBoost)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-[11px] tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        alreadyExpanded || isProjectCapped || isDowngrade || !allowedTier
                          ? 'bg-white/[0.02] text-zinc-600 border border-white/[0.04] cursor-not-allowed'
                          : !canAfford
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-not-allowed'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.1]'
                      }`}
                    >
                      {alreadyExpanded ? <span>Already Built</span> 
                        : isProjectCapped ? <span>Max 2 Projects (2/2)</span>
                        : isDowngrade ? <span>Downgrade Blocked</span>
                        : !allowedTier ? <span>Requires Lvl {opt.minLeague}</span> 
                        : !canAfford ? <span>Seek Financing</span>
                        : <span>Authorize Build</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};
