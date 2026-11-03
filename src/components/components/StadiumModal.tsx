import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { formatMoney, formatNum, getLeagueScaledVal, getPinnacleArenaCapacity, getCountryEconomicProfile } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';

export interface StadiumOption {
  seats: number;
  cost: number;
  fanBoost: number;
  label: string;
  tag: string;
  desc: string;
}

export const getIncrementalOptions = (
  tier: number,
  country: string = 'GER',
  currentCap: number = 2000
): StadiumOption[] => {
  return [
    {
      seats: 250,
      cost: getLeagueScaledVal(tier, 400000, country),
      fanBoost: 250,
      label: '+250 Seats',
      tag: 'Modular Bleachers',
      desc: 'Quick terrace expansion to increase standard admission.'
    },
    {
      seats: 500,
      cost: getLeagueScaledVal(tier, 750000, country),
      fanBoost: 500,
      label: '+500 Seats',
      tag: 'Grandstand Extension',
      desc: 'Extended seating tier with dedicated supporter sections.'
    },
    {
      seats: 1000,
      cost: getLeagueScaledVal(tier, 1400000, country),
      fanBoost: 1000,
      label: '+1,000 Seats',
      tag: 'Upper Deck Addition',
      desc: 'Substantial upper bowl construction to meet top-flight demand.'
    },
    {
      seats: 2500,
      cost: getLeagueScaledVal(tier, 3200000, country),
      fanBoost: 2500,
      label: '+2,500 Seats',
      tag: 'Arena Overhaul',
      desc: 'Major stadium expansion boosting atmosphere and gate receipts.'
    }
  ];
};

interface StadiumModalProps {
  onClose: () => void;
  state: GameState;
  creditLimit: number;
  lang?: Language;
  onExpand: (cost: number, seats: number, fanBoost?: number) => void;
  onShowArenaOverview?: () => void;
}

export const StadiumModal: React.FC<StadiumModalProps> = ({
  onClose,
  state,
  creditLimit,
  onExpand,
  onShowArenaOverview
}) => {
  useModalDismiss(onClose);
  const currentCap = state.club.stadium || 2000;
  const country = state.club.country || 'GER';
  const maxCap = getPinnacleArenaCapacity(country);
  const profile = getCountryEconomicProfile(country);
  const options = getIncrementalOptions(state.club.tier, country, currentCap);
  const fillPercentage = Math.min(100, (currentCap / maxCap) * 100);
  const isExpansionLimitReached = (state.stadiumExpandedThisSeason || 0) >= 1;
  const currentInfra = (state.facilitiesUpgradedThisSeason || 0) + (state.infraActionsThisSeason || 0);
  const isCranesLocked = currentInfra >= 2;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] rounded-2xl border border-white/[0.04] w-full max-w-lg relative z-10 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[88vh] cursor-default pointer-events-auto"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-base shadow-sm shrink-0">
              <i className="fas fa-arrow-up-right-dots" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                Arena Expansion
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>Scaled Seat Expansions</span>
                <span className="text-zinc-600">·</span>
                <span className="text-sky-400 font-medium tabular-nums">{formatNum(currentCap)} / {formatNum(maxCap)}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 border border-white/[0.06] cursor-pointer"
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4 flex-1 min-h-0">
          {/* Quick Metrics Glance */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-3 flex flex-col">
              <span className="text-[10px] uppercase font-medium text-zinc-500 tracking-wider">Capacity</span>
              <span className="text-lg font-semibold text-white tabular-nums mt-0.5">{formatNum(currentCap)}</span>
              <span className="text-[10px] text-zinc-500 tabular-nums">Max: {formatNum(maxCap)}</span>
            </div>
            <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-3 flex flex-col">
              <span className="text-[10px] uppercase font-medium text-zinc-500 tracking-wider">Supporters</span>
              <span className="text-lg font-semibold text-zinc-200 tabular-nums mt-0.5">{formatNum(state.club.fanBase || 1000)}</span>
              <span className="text-[10px] text-zinc-500">Fanbase</span>
            </div>
            <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-3 flex flex-col">
              <span className="text-[10px] uppercase font-medium text-zinc-500 tracking-wider">Fill Rate</span>
              <span className="text-lg font-semibold tabular-nums mt-0.5 text-zinc-200">
                {Math.round(fillPercentage)}%
              </span>
              <span className="text-[10px] text-zinc-500">of Ceiling</span>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-3.5 flex flex-col gap-2 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <i className="fas fa-building text-sky-400 text-xs" />
                <span>Arena Scale</span>
              </span>
              <span className="text-sky-400 font-semibold tabular-nums text-[11px]">{profile.tierName}</span>
            </div>

            {/* Progress Bar with Gradient Glow */}
            <div className="w-full bg-black/40 border border-white/[0.04] h-2 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${fillPercentage}%` }} 
              />
            </div>
          </div>

          {/* 5-Year Trend Shortcut Card */}
          {onShowArenaOverview && (
            <button
              onClick={onShowArenaOverview}
              className="bg-sky-500/[0.05] hover:bg-sky-500/10 border border-sky-500/20 hover:border-sky-400/30 rounded-2xl p-3 flex items-center justify-between text-left transition cursor-pointer active:scale-[0.99] shrink-0 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs shrink-0 shadow-sm">
                  <i className="fas fa-chart-column" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
                    <span>Attendance & Market Intelligence</span>
                    <span className="text-[9px] font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                      Inspect
                    </span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    View 5-year crowd trends and city supporter catchment
                  </span>
                </div>
              </div>
              <i className="fas fa-chevron-right text-xs text-sky-400 ml-2 shrink-0" />
            </button>
          )}

          {/* Maximum Mega Capacity Alert */}
          {currentCap >= maxCap && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                <i className="fas fa-crown text-sm" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Maximum Pinnacle Capacity Achieved ({formatNum(maxCap)} Seats)</h3>
                <p className="text-xs text-zinc-300 mt-0.5 leading-snug font-normal">
                  Your arena has achieved the pinnacle stadium capacity for {country}&apos;s handball sporting landscape ({formatNum(maxCap)} seats). No further expansions are permitted.
                </p>
              </div>
            </div>
          )}

          {/* Construction Underway (1 Per Season Cap) Alert */}
          {isExpansionLimitReached && currentCap < maxCap && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                <i className="fas fa-helmet-safety text-sm" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {state.lang === 'de' ? 'Bauarbeiten im Gange (1x pro Saison)' : 'Construction Underway (1/1 Per Season)'}
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5 leading-snug font-normal">
                  {state.lang === 'de'
                    ? 'Eine Arenenerweiterung wurde in dieser Saison bereits in Auftrag gegeben. Weitere Baumaßnahmen sind erst in der nächsten Saison möglich.'
                    : 'An arena expansion has already been commissioned this season. Municipal permits and structural construction restrict expansion to 1 project per season.'}
                </p>
              </div>
            </div>
          )}

          {/* Expansion Options List */}
          <div className="flex flex-col gap-2.5">
            <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px] px-1 flex items-center gap-1.5">
              <i className="fas fa-layer-group text-zinc-400 text-[10px]" />
              <span>{currentCap >= maxCap ? 'Expansion Closed' : isExpansionLimitReached ? 'Expansion Locked (Season Limit Reached)' : 'Available Expansion Packages'}</span>
            </span>

            {options.map((opt, i) => {
              const affordable = state.budget + creditLimit >= opt.cost;
              const seatsToAdd = Math.min(opt.seats, Math.max(0, maxCap - currentCap));
              const targetCapacity = currentCap + seatsToAdd;
              const isMaxed = currentCap >= maxCap || seatsToAdd <= 0;
              const isBlocked = !affordable || isMaxed || isExpansionLimitReached || isCranesLocked;

              return (
                <button
                  key={`stad-opt-${i}`}
                  disabled={isBlocked}
                  onClick={() => !isBlocked && onExpand(opt.cost, seatsToAdd, opt.fanBoost)}
                  className={`group relative overflow-hidden text-left p-4 rounded-2xl border transition-all ${
                    !isBlocked
                      ? 'bg-[#10121a] hover:bg-sky-500/[0.04] border-white/[0.04] hover:border-sky-500/30 cursor-pointer shadow-sm active:scale-[0.99]'
                      : 'bg-white/[0.015] border-white/[0.04] opacity-45 cursor-not-allowed'
                  }`}
                >
                  <div className="relative z-10 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border text-xs font-semibold ${
                        !isBlocked
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 group-hover:bg-sky-500/20' 
                          : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
                      }`}>
                        <i className="fas fa-plus text-xs" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm tracking-tight">{opt.label}</span>
                          <span className="text-[10px] font-semibold text-sky-400/90 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                            {opt.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 font-normal leading-snug">
                          {opt.desc}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1 font-medium flex items-center gap-1.5">
                          <span>New Total:</span>
                          <strong className="text-zinc-300 font-semibold tabular-nums">{formatNum(targetCapacity)} seats {targetCapacity >= maxCap ? '(Pinnacle Cap)' : ''}</strong>
                          <span className="text-zinc-600">·</span>
                          <span className="text-emerald-400 font-semibold tabular-nums">+{opt.fanBoost} Supporters</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold text-white text-sm sm:text-base tabular-nums">
                        {formatMoney(opt.cost)}
                      </div>
                      {!affordable ? (
                        <div className="text-[10px] font-semibold text-rose-400 mt-0.5">
                          Insufficient Funds
                        </div>
                      ) : isExpansionLimitReached ? (
                        <div className="text-[10px] font-semibold text-amber-400 mt-0.5">
                          Limit (1/1)
                        </div>
                      ) : isCranesLocked ? (
                        <div className="text-[10px] font-semibold text-amber-400 mt-0.5">
                          Cranes (2/2)
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.04] flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto px-6 py-2.5 bg-sky-500/[0.05] hover:bg-sky-500/10 text-sky-300 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer border border-sky-500/20 shadow-sm active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
