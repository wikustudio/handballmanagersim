import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../types';
import { formatMoney } from '../data/gameConstants';
import { analyzeCatchment } from '../engine/catchmentEngine';

export interface TourMatch {
  opponent: string;
  ourScore: number;
  theirScore: number;
}

interface OutcomeResult {
  title: string;
  fanDelta: number;
  ovrDelta: number;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  matches?: TourMatch[];
}

interface MarketingModalProps {
  state: GameState;
  onClose: () => void;
  onMarketingAction?: (
    cost: number,
    dp: number,
    fanDelta: number,
    ovrDelta: number,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
    campaignId?: 'regional' | 'continental' | 'global_tour',
    matches?: TourMatch[],
    moraleDelta?: number
  ) => void;
  onCampaign?: (
    cost: number,
    dp: number,
    fanDelta: number,
    repDelta: number,
    moraleDelta: number,
    trustDelta: number,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
    ovrDelta?: number,
    campaignId?: 'regional' | 'continental' | 'global_tour'
  ) => void;
  onTourCompleted?: (summary: any) => void;
}

const SPIN_PLACEHOLDERS: string[] = [
  'Going Viral...',
  'Flight Delayed...',
  'Great Training...',
  'Jet Lag Fatigue...',
  'Stadium Sold Out...',
  'Logistical Snag...',
  'Sponsor Surge...',
  'Squad Chemistry Peak...',
  'Tough Turbulence...',
  'Local Excitement Peak...',
  'Flyer Distribution...'
];

export const MarketingModal: React.FC<MarketingModalProps> = ({
  state,
  onClose,
  onMarketingAction,
  onCampaign,
  onTourCompleted
}) => {
  const [rollingId, setRollingId] = useState<string | null>(null);
  const [flashText, setFlashText] = useState<string>('');
  const [flashCard, setFlashCard] = useState<{ id: string; success: boolean } | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{ id: string; result: OutcomeResult } | null>(null);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);

  const budget = state.budget || 0;
  const dp = state.skillPoints || 0;
  const fanBase = state.club.fanBase || 0;
  const tier = state.club.tier || 1;
  const isTier1 = tier === 1;
  const catchment = analyzeCatchment(state.club);

  // In-engine budget: €1.5M is stored as 1500 (since formatMoney uses K units)
  const hasGlobalTourBudget = budget >= 1500 || budget >= 1500000;
  const isTourCompletedThisSeason = (state.globalToursThisSeason || 0) >= 1;
  const canAccessGlobalTour = isTier1 && hasGlobalTourBudget && !isTourCompletedThisSeason;

  const tourTitle = state.club.country === 'USA'
    ? 'European Pre-Season Tour'
    : state.club.country === 'ECU'
    ? 'European Showcase Tour'
    : 'Global Tour (Asia/USA)';

  const tourDesc = state.club.country === 'USA'
    ? 'Showcase matches against European giants to expand global brand and hone squad chemistry.'
    : state.club.country === 'ECU'
    ? 'High-profile showcase matches across Europe and the Americas to elevate international standing.'
    : 'Expand global brand and test squad fitness. Marquee international showcase directly impacting overall rating.';

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const handleLaunchCampaign = (
    campaignId: 'regional' | 'continental' | 'global_tour',
    cost: number,
    dpCost: number,
    rollOutcome: () => OutcomeResult
  ) => {
    if (rollingId !== null) return;

    setRollingId(campaignId);
    setFlashText(SPIN_PLACEHOLDERS[0]);
    setFlashCard(null);

    // Rapidly update flashText every 80ms with randomized placeholders
    intervalRef.current = window.setInterval(() => {
      const randomIndex = Math.floor(Math.random() * SPIN_PLACEHOLDERS.length);
      setFlashText(SPIN_PLACEHOLDERS[randomIndex]);
    }, 80);

    // After 2000ms, lock in the mathematical result
    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      const outcome = rollOutcome();
      const isSuccess = outcome.type === 'success';

      // Lock result & flash card background for 500ms
      setFlashCard({ id: campaignId, success: isSuccess });
      setLastOutcome({ id: campaignId, result: outcome });
      setRollingId(null);

      const tourMoraleDelta = campaignId === 'global_tour' ? (isSuccess ? 30 : -15) : 0;

      // Trigger state handler
      if (onMarketingAction) {
        onMarketingAction(cost, dpCost, outcome.fanDelta, outcome.ovrDelta, outcome.message, outcome.type, campaignId, outcome.matches, tourMoraleDelta);
      } else if (onCampaign) {
        onCampaign(cost, dpCost, outcome.fanDelta, 0, tourMoraleDelta, 0, outcome.message, outcome.type, outcome.ovrDelta, campaignId);
      }

      if (campaignId === 'global_tour' && outcome.matches && onTourCompleted) {
        onTourCompleted({
          matches: outcome.matches,
          fansGained: outcome.fanDelta,
          ovrChange: outcome.ovrDelta,
          cost: 1500,
          clubName: state.club.name,
          moraleChange: tourMoraleDelta
        });
      }

      // Clear the 500ms flash
      flashTimeoutRef.current = window.setTimeout(() => {
        setFlashCard(null);
      }, 500);
    }, 2000);
  };

  // Card 1: Regional Fan Promo (€250k)
  const runRegionalPromo = () => {
    if (budget < 250 || rollingId !== null) return;
    handleLaunchCampaign('regional', 250, 0, () => {
      const roll = Math.random();
      if (roll < 0.60) {
        return {
          title: 'Regional Hit!',
          fanDelta: 15000,
          ovrDelta: 0,
          type: 'success',
          message: 'Regional Promo Hit! Grassroots hype sparks local community excitement (+15,000 Fans).'
        };
      } else if (roll < 0.90) {
        return {
          title: 'Break Even',
          fanDelta: 5000,
          ovrDelta: 0,
          type: 'info',
          message: 'Regional Promo: Modest district turnout (+5,000 Fans).'
        };
      } else {
        return {
          title: 'Promo Flop',
          fanDelta: -2000,
          ovrDelta: 0,
          type: 'error',
          message: 'Regional Promo Flop: Tone-deaf flyers discarded by local fans (-2,000 Fans).'
        };
      }
    });
  };

  // Card 2: Continental Summer Tour (€1.0M + 1 DP)
  const runContinentalTour = () => {
    if (budget < 1000 || dp < 1 || rollingId !== null) return;
    handleLaunchCampaign('continental', 1000, 1, () => {
      const roll = Math.random();
      if (roll < 0.20) {
        return {
          title: 'Tour Smash Hit!',
          fanDelta: 80000,
          ovrDelta: 0,
          type: 'success',
          message: 'Continental Tour Smash Hit! Sold-out stadiums abroad build international fanbase (+80,000 Fans).'
        };
      } else if (roll < 0.70) {
        return {
          title: 'Tour Success',
          fanDelta: 40000,
          ovrDelta: 0,
          type: 'success',
          message: 'Continental Tour Success: Overseas supporter chapters established (+40,000 Fans).'
        };
      } else {
        return {
          title: 'Logistical Nightmare',
          fanDelta: -10000,
          ovrDelta: 0,
          type: 'error',
          message: 'Logistical Nightmare! Travel delays and exhausted squad spark friction (-10,000 Fans).'
        };
      }
    });
  };

  const getTourOpponents = (country: string) => {
    const usaPool = ['Real Madrid', 'Bayern Munich', 'Arsenal', 'Barcelona', 'Man City', 'PSG', 'Juventus', 'AC Milan', 'Liverpool', 'Dortmund'];
    const ecuPool = ['Boca Juniors', 'Flamengo', 'River Plate', 'Palmeiras', 'Santos', 'Colo-Colo', 'Sao Paulo', 'Penarol', 'Independiente'];
    const defaultPool = ['LA Galaxy', 'Tokyo FC', 'Sydney FC', 'NY City FC', 'Al Hilal', 'Yokohama FM', 'Seattle Sounders', 'Melbourne Victory', 'Urawa Reds', 'Al Nassr', 'Inter Miami'];
    
    const pool = country === 'USA' ? usaPool : country === 'ECU' ? ecuPool : defaultPool;
    return [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  // Card 3: Global Tour (€1.5M, Tier 1 Exclusive)
  const runGlobalTour = () => {
    if (!canAccessGlobalTour || rollingId !== null) return;
    handleLaunchCampaign('global_tour', 1500, 0, () => {
      const roll = Math.random();
      const isSuccess = roll < 0.75;
      const opponents = getTourOpponents(state.club.country || 'GER');
      const matches: TourMatch[] = opponents.map((opp) => {
        let ourScore = 0;
        let theirScore = 0;
        if (!isSuccess) {
          ourScore = Math.floor(Math.random() * 2);
          theirScore = Math.floor(Math.random() * 3) + 1;
        } else {
          ourScore = Math.floor(Math.random() * 3) + 1;
          theirScore = Math.floor(Math.random() * 2);
        }
        return { opponent: opp, ourScore, theirScore };
      });

      if (isSuccess) {
        // 75% Chance: +15,000 Fans, +1 OVR
        return {
          title: `${tourTitle} Triumph!`,
          fanDelta: 15000,
          ovrDelta: 1,
          type: 'success',
          message: `${tourTitle} Triumph! Electrifying showcase matches surge squad chemistry (+15,000 Fans, +1 OVR).`,
          matches
        };
      } else {
        // 25% Chance: +2,500 Fans, -2 OVR
        return {
          title: `${tourTitle} Disaster!`,
          fanDelta: 2500,
          ovrDelta: -2,
          type: 'error',
          message: `${tourTitle} Disaster! Punishing jet lag, fatigue, and knocks derail preparation (+2,500 Fans, -2 OVR).`,
          matches
        };
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-2xl overflow-y-auto text-left cursor-pointer"
      onClick={() => {
        if (rollingId === null) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#12141c]/90 backdrop-blur-3xl rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto overflow-hidden cursor-default shrink-0"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-purple-400 text-base shadow-inner shrink-0">
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/90 mb-0.5">
                Marketing & PR
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                Commercial Campaigns
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={rollingId !== null}
            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Boardroom HUD Banner */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                Treasury
              </div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-white">
                {formatMoney(budget)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                Director Points
              </div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-purple-300 flex items-center gap-1.5">
                <i className="fa-solid fa-graduation-cap text-xs"></i>
                <span>{dp} DP</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                Global Fanbase
              </div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-emerald-400 flex items-center gap-1.5">
                <i className="fa-solid fa-users text-xs"></i>
                <span>{fanBase.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                Soft Stadium Ceiling
              </div>
              <div className="text-base sm:text-lg font-bold tabular-nums text-sky-400 flex items-center gap-1.5 justify-end sm:justify-start">
                <i className="fa-solid fa-building-shield text-xs"></i>
                <span>{catchment.softCapacityCeiling.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Demographic Bypass Context */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 sm:p-3.5 flex items-start gap-3 text-xs text-zinc-300">
            <i className="fa-solid fa-circle-info text-purple-400 text-sm mt-0.5 shrink-0"></i>
            <div className="leading-relaxed">
              <span className="font-bold text-white">Addressable Global Market: </span>
              Campaign rewards expand your global fanbase, which organically raises your stadium soft capacity ceiling in demographic simulations without artificially bloating immediate matchday attendance.
            </div>
          </div>

          {/* Last Roll Outcome Receipt */}
          {lastOutcome && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 sm:p-4 rounded-2xl border text-xs flex flex-col gap-3 shadow-md ${
                lastOutcome.result.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                  : lastOutcome.result.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/25 text-rose-200'
                  : 'bg-sky-500/10 border-sky-500/25 text-sky-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <i
                    className={`fa-solid text-sm sm:text-base shrink-0 ${
                      lastOutcome.result.type === 'success'
                        ? 'fa-circle-check text-emerald-400'
                        : lastOutcome.result.type === 'error'
                        ? 'fa-circle-exclamation text-rose-400'
                        : 'fa-circle-info text-sky-400'
                    }`}
                  ></i>
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] text-white flex items-center gap-2 flex-wrap">
                      <span>{lastOutcome.result.title}</span>
                      {lastOutcome.result.ovrDelta !== 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          lastOutcome.result.ovrDelta > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {lastOutcome.result.ovrDelta > 0 ? `+${lastOutcome.result.ovrDelta}` : lastOutcome.result.ovrDelta} OVR
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-90 truncate sm:whitespace-normal">
                      {lastOutcome.result.message}
                    </div>
                  </div>
                </div>
                <div className="font-bold tabular-nums text-xs sm:text-sm shrink-0">
                  {lastOutcome.result.fanDelta > 0
                    ? `+${lastOutcome.result.fanDelta.toLocaleString()}`
                    : lastOutcome.result.fanDelta.toLocaleString()}{' '}
                  Fans
                </div>
              </div>

              {/* Tour Exhibition Game Results */}
              {lastOutcome.result.matches && lastOutcome.result.matches.length > 0 && (
                <div className="pt-2.5 border-t border-white/[0.08] w-full">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-futbol text-[9px]"></i>
                      <span>Exhibition Match Results</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      3 Fixtures Completed
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {lastOutcome.result.matches.map((m, idx) => {
                      const isWin = m.ourScore > m.theirScore;
                      const isLoss = m.ourScore < m.theirScore;
                      return (
                        <div
                          key={idx}
                          className="bg-black/40 border border-white/[0.06] rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-inner"
                        >
                          <span
                            className="text-xs font-semibold text-white truncate max-w-[85px] sm:max-w-[100px]"
                            title={state.club.name}
                          >
                            {state.club.shortName || state.club.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md border ${
                                isWin
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : isLoss
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                              }`}
                            >
                              {m.ourScore} : {m.theirScore}
                            </span>
                          </div>
                          <span
                            className="text-xs text-zinc-300 truncate max-w-[85px] sm:max-w-[100px] text-right"
                            title={m.opponent}
                          >
                            {m.opponent}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 3 Campaign Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Regional Fan Promo */}
            <motion.div
              animate={
                flashCard?.id === 'regional'
                  ? { scale: [1, 1.025, 1], transition: { duration: 0.5, ease: 'easeOut' } }
                  : {}
              }
              className={`rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm ${
                flashCard?.id === 'regional'
                  ? flashCard.success
                    ? 'bg-emerald-500/20 border border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                    : 'bg-rose-500/20 border border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
                  : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sky-400 text-base">
                    <i className="fa-solid fa-signs-post"></i>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg">
                    €250K
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Risk: Low
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                    Potential: Modest
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">Regional Fan Promo</h3>
                <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                  Safe, modest fan growth via local billboards, community radio spots, and school vouchers.
                </p>

                {/* Fixed-Height Div for Flash Text or Resting Preview (Zero UI Jitter) */}
                <div className="h-14 w-full rounded-xl bg-white/[0.02] border border-white/[0.04] mb-5 flex flex-col justify-center px-3 overflow-hidden relative">
                  {rollingId === 'regional' ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-[9px] uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5 animate-pulse mb-0.5">
                        <i className="fa-solid fa-arrows-spin fa-spin text-[10px]"></i>
                        <span>Spinning...</span>
                      </div>
                      <div className="text-xs font-bold tabular-nums text-amber-300 tracking-tight truncate w-full text-center animate-pulse">
                        {flashText}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 via-amber-400 to-purple-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Peak Gain:</span>
                        <span className="font-bold tabular-nums text-emerald-400">+15,000 Fans</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Worst Case:</span>
                        <span className="font-bold tabular-nums text-rose-400">-2,000 Fans</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={runRegionalPromo}
                disabled={budget < 250 || rollingId !== null}
                className="w-full bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] border border-white/[0.12] disabled:opacity-40 text-white font-bold text-xs py-3 px-3 rounded-xl transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {rollingId === 'regional' ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    <span>Spinning Wheel...</span>
                  </>
                ) : budget < 250 ? (
                  <span>Insufficient Funds</span>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane text-sky-400"></i>
                    <span>Launch Promo (€250K)</span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Card 2: Continental Summer Tour */}
            <motion.div
              animate={
                flashCard?.id === 'continental'
                  ? { scale: [1, 1.025, 1], transition: { duration: 0.5, ease: 'easeOut' } }
                  : {}
              }
              className={`rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm ${
                flashCard?.id === 'continental'
                  ? flashCard.success
                    ? 'bg-emerald-500/20 border border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                    : 'bg-rose-500/20 border border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
                  : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-purple-400 text-base">
                    <i className="fa-solid fa-plane-departure"></i>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tabular-nums text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                      €1.0M
                    </span>
                    <span className="text-xs font-bold tabular-nums text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                      <i className="fa-solid fa-graduation-cap text-[9px]"></i> 1 DP
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Risk: Medium
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                    Potential: High
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">Continental Summer Tour</h3>
                <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                  Medium risk, high fan growth through pre-season showcase friendlies in European media hubs.
                </p>

                {/* Fixed-Height Div for Flash Text or Resting Preview (Zero UI Jitter) */}
                <div className="h-14 w-full rounded-xl bg-white/[0.02] border border-white/[0.04] mb-5 flex flex-col justify-center px-3 overflow-hidden relative">
                  {rollingId === 'continental' ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-[9px] uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5 animate-pulse mb-0.5">
                        <i className="fa-solid fa-arrows-spin fa-spin text-[10px]"></i>
                        <span>Spinning...</span>
                      </div>
                      <div className="text-xs font-bold tabular-nums text-amber-300 tracking-tight truncate w-full text-center animate-pulse">
                        {flashText}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 via-amber-400 to-purple-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Peak Gain:</span>
                        <span className="font-bold tabular-nums text-emerald-400">+80,000 Fans</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Worst Case:</span>
                        <span className="font-bold tabular-nums text-rose-400">-10,000 Fans</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={runContinentalTour}
                disabled={budget < 1000 || dp < 1 || rollingId !== null}
                className="w-full bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] border border-white/[0.12] disabled:opacity-40 text-white font-bold text-xs py-3 px-3 rounded-xl transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {rollingId === 'continental' ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    <span>Spinning Wheel...</span>
                  </>
                ) : budget < 1000 ? (
                  <span>Need €1.0M Budget</span>
                ) : dp < 1 ? (
                  <span>Need 1 Director Point</span>
                ) : (
                  <>
                    <i className="fa-solid fa-route text-purple-400"></i>
                    <span>Book Tour (€1M + 1 DP)</span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Card 3: Global Tour */}
            <motion.div
              animate={
                flashCard?.id === 'global_tour'
                  ? { scale: [1, 1.025, 1], transition: { duration: 0.5, ease: 'easeOut' } }
                  : {}
              }
              className={`rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm ${
                flashCard?.id === 'global_tour'
                  ? flashCard.success
                    ? 'bg-emerald-500/20 border border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                    : 'bg-rose-500/20 border border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
                  : isTier1
                  ? 'bg-white/[0.03] border border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-white/[0.02] border border-white/[0.04] opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-base">
                    <i className="fa-solid fa-earth-americas"></i>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tabular-nums text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                      €1.5M
                    </span>
                    {isTourCompletedThisSeason ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                        <i className="fa-solid fa-check text-[9px]"></i> Completed (1/1)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-lg">
                        Tier 1 Req
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Risk: High (25% Disaster)
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Potential: +1 OVR Surge
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{tourTitle}</h3>
                <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                  {tourDesc}
                </p>

                {/* Fixed-Height Div for Flash Text or Resting Preview (Zero UI Jitter) */}
                <div className="h-14 w-full rounded-xl bg-white/[0.02] border border-white/[0.04] mb-5 flex flex-col justify-center px-3 overflow-hidden relative">
                  {rollingId === 'global_tour' ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse mb-0.5">
                        <i className="fa-solid fa-arrows-spin fa-spin text-[10px]"></i>
                        <span>Spinning...</span>
                      </div>
                      <div className="text-xs font-bold tabular-nums text-amber-300 tracking-tight truncate w-full text-center animate-pulse">
                        {flashText}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 animate-pulse" />
                    </div>
                  ) : isTourCompletedThisSeason ? (
                    (() => {
                      const tourMatches = state.latestTourMatches || (lastOutcome?.id === 'global_tour' ? lastOutcome.result.matches : undefined);
                      if (tourMatches && tourMatches.length > 0) {
                        const wins = tourMatches.filter((m) => m.ourScore > m.theirScore).length;
                        const draws = tourMatches.filter((m) => m.ourScore === m.theirScore).length;
                        const losses = tourMatches.filter((m) => m.ourScore < m.theirScore).length;
                        return (
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-400">Exhibition Record:</span>
                              <span className="font-bold tabular-nums text-emerald-400">
                                {wins}W · {draws}D · {losses}L
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-400">Season Tour:</span>
                              <span className="font-semibold text-emerald-300 flex items-center gap-1">
                                <i className="fa-solid fa-check text-[9px]"></i> 3 Matches Completed
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Season Status:</span>
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <i className="fa-solid fa-check text-[9px]"></i> Tour Completed
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Exhibitions:</span>
                            <span className="text-zinc-300 font-semibold">3 Fixtures Finished</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">75% Success:</span>
                        <span className="font-bold tabular-nums text-emerald-400">+15,000 Fans, +1 OVR</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">25% Disaster:</span>
                        <span className="font-bold tabular-nums text-rose-400">+2,500 Fans, -2 OVR</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={runGlobalTour}
                disabled={!canAccessGlobalTour || rollingId !== null}
                className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-40 text-emerald-300 font-bold text-xs py-3 px-3 rounded-xl transition shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {rollingId === 'global_tour' ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    <span>Spinning Wheel...</span>
                  </>
                ) : isTourCompletedThisSeason ? (
                  <>
                    <i className="fa-solid fa-check text-emerald-400"></i>
                    <span>Completed This Season</span>
                  </>
                ) : !isTier1 ? (
                  <span>Requires Tier 1 Division</span>
                ) : !hasGlobalTourBudget ? (
                  <span>Need €1.5M Budget</span>
                ) : (
                  <>
                    <i className="fa-solid fa-plane-departure text-emerald-400"></i>
                    <span>Launch Tour (€1.5M)</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2 text-zinc-400">
            <i className="fa-solid fa-shield-halved text-purple-400"></i>
            <span>Campaign rolls resolve with mathematical fairness calibrated to club stature.</span>
          </div>
          <button
            onClick={onClose}
            disabled={rollingId !== null}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 hover:text-white disabled:opacity-50 transition cursor-pointer text-xs font-semibold"
          >
            Close Desk
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
