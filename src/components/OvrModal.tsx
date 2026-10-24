import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { getLeagueInfo, getDynamicLeagueAvgOvr, getOvrTierConfig } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';

import { getActiveClubs } from '../utils/modManager';

interface OvrModalProps {
  state: GameState;
  lang: Language;
  onClose: () => void;
}

export const OvrModal: React.FC<OvrModalProps> = ({ state, lang, onClose }) => {
  useModalDismiss(onClose);

  // Current OVR and Start of Season calculation
  const currentOvr = state.club.baseOvr;
  const currentSeason = state.year;
  const seasonLogs = (state.ovrHistory || []).filter(h => h.season === currentSeason);
  const changesThisSeason = seasonLogs.reduce((sum, h) => sum + h.change, 0);
  
  // Prefer explicitly saved startOfSeasonOvr on state, falling back to reverse log calculation
  const startOfSeasonOvr = state.startOfSeasonOvr !== undefined 
    ? state.startOfSeasonOvr 
    : (currentOvr - changesThisSeason);
  
  // League Competitiveness & Benchmark (aligned with live simulation calculation)
  const tier = state.club.tier;
  const country = state.club.country || 'GER';
  const leagueInfo = getLeagueInfo(tier, country);
  const leagueName = leagueInfo.name;

  // Compute live dynamic league average of clubs currently in that division (shared across dashboard)
  const leagueAvgOvr = getDynamicLeagueAvgOvr(state);
  
  const diffFromAvg = currentOvr - leagueAvgOvr;
  
  // Calibrated 4-tier model: Green=championship, White=mid-table, Orange=low table risk, Red=relegation risk
  const tierConfig = getOvrTierConfig(currentOvr, leagueAvgOvr);
  const statusLabel = lang === 'de' ? tierConfig.statusLabelDe : tierConfig.statusLabelEn;
  const deltaDisplay = diffFromAvg > 0 
    ? `+${diffFromAvg} vs Lg` 
    : diffFromAvg === 0 
    ? '= Lg Benchmark' 
    : `${diffFromAvg} vs Lg`;
  const competitivenessText = lang === 'de' ? tierConfig.summaryDe : tierConfig.summaryEn;

  // Scale progress bar width based on 0 to 100 range
  const clubPercent = Math.min(100, Math.max(10, currentOvr));
  const avgPercent = Math.min(100, Math.max(10, leagueAvgOvr));

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl cursor-pointer">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-[#14151e] w-full max-w-md rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden relative z-10 flex flex-col max-h-[88vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Radial Glow matching rating status */}
        <div className={`absolute inset-0 pointer-events-none opacity-40 ${tierConfig.ambientGlow}`} />

        {/* Top Ambient Highlight matching rating status */}
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${tierConfig.glowLine} to-transparent pointer-events-none`} />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-white/[0.04] flex justify-between items-center relative shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${tierConfig.badgeBg} ${tierConfig.badgeText} border ${tierConfig.badgeBorder} flex items-center justify-center text-xs transition-colors duration-300 shadow-sm`}>
              <i className={`fas ${tierConfig.statusIcon}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight leading-tight">
                Squad Rating Dynamics
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border tracking-wide uppercase ${tierConfig.badgeBg} ${tierConfig.badgeText} ${tierConfig.badgeBorder}`}>
                  {statusLabel}
                </span>
                <span className={`text-[10px] font-semibold tabular-nums ${tierConfig.badgeText}`}>
                  {deltaDisplay}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* Start vs Current OVR Row */}
          <div className="grid grid-cols-2 gap-3 items-stretch">
            <div className="bg-[#10121a] rounded-2xl p-4 flex flex-col items-center justify-center border border-white/[0.04]">
              <span className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase mb-1">
                Start of Season
              </span>
              <span className="text-3xl font-semibold text-white tracking-tight tabular-nums">
                {startOfSeasonOvr}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">OVR Base</span>
            </div>
            
            <div className="bg-[#10121a] rounded-2xl p-4 flex flex-col items-center justify-center border border-white/[0.04] relative overflow-hidden transition-colors duration-300">
              <span className={`text-[10px] font-medium ${tierConfig.subText} tracking-wider uppercase mb-1`}>
                Current OVR
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-semibold ${tierConfig.valueText} tracking-tight tabular-nums`}>
                  {currentOvr}
                </span>
                {changesThisSeason !== 0 && (
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded border tabular-nums ${changesThisSeason > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    {changesThisSeason > 0 ? '+' : ''}{changesThisSeason}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${tierConfig.subTextMuted} mt-0.5`}>
                {statusLabel}
              </span>
              {(state.youthDevQueue || 0) > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 tabular-nums">
                  ⏳ +{state.youthDevQueue} OVR Banked (Next Season)
                </span>
              )}
            </div>
          </div>

          {/* League Benchmark */}
          <div className="bg-[#10121a] rounded-2xl p-4 sm:p-5 border border-white/[0.04] flex flex-col gap-3.5 transition-colors duration-300">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <i className={`fas fa-scale-balanced ${tierConfig.valueText}`} />
                League Competitiveness
              </span>
              <span className="text-[11px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.04] px-2.5 py-0.5 rounded-full">
                {leagueName}
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs tabular-nums text-zinc-300">
                <span>{state.club.name}: <strong className={`${tierConfig.valueText} font-semibold tabular-nums`}>{currentOvr} OVR</strong></span>
                <span>Avg: <strong className="text-zinc-300 font-semibold tabular-nums">{leagueAvgOvr} OVR</strong></span>
              </div>

              {/* Progress Gauge with Benchmark Pin */}
              <div className="relative pt-1 pb-1">
                <div className="h-2 bg-black/40 border border-white/[0.04] rounded-full overflow-hidden flex w-full relative">
                  <div 
                    className={`h-full bg-gradient-to-r ${tierConfig.progressGradient} rounded-full transition-all duration-700`} 
                    style={{ width: `${clubPercent}%` }}
                  />
                </div>
                {/* Benchmark Indicator Needle */}
                <div 
                  className={`absolute top-0 bottom-0 w-0.5 pointer-events-none ${tierConfig.benchmarkNeedle}`}
                  style={{ left: `${avgPercent}%` }}
                  title={`League Average Benchmark: ${leagueAvgOvr} OVR`}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-zinc-400 tabular-nums">
                <span>Min: 30 OVR</span>
                <span className="flex items-center gap-1 font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${tierConfig.benchmarkDot}`} />
                  Benchmark {leagueAvgOvr}
                </span>
                <span>Max: 100 OVR</span>
              </div>
            </div>
            
            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] transition-colors duration-300">
              <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                {competitivenessText}
              </p>
            </div>
          </div>

          {/* Season Rating Log Breakdown (if any logs exist this season) */}
          {seasonLogs.length > 0 && (
            <div className="bg-[#10121a] rounded-2xl p-4 border border-white/[0.04] flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <i className="fas fa-timeline text-zinc-400" />
                Season {currentSeason} Rating Adjustments
              </span>
              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {seasonLogs.map(log => (
                  <div key={log.id} className="flex justify-between items-center text-xs py-1 px-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-zinc-300 truncate text-[11px]">
                      {lang === 'de' ? (log.reasonDe || log.reason) : log.reason}
                    </span>
                    <span className={`text-[11px] font-semibold tabular-nums shrink-0 ${log.change > 0 ? 'text-emerald-400' : log.change < 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                      {log.change > 0 ? `+${log.change}` : log.change === 0 ? '0' : log.change} OVR
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.04] flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-2.5 font-semibold text-xs rounded-xl transition cursor-pointer bg-emerald-500/[0.05] hover:bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-sm"
          >
            {lang === 'de' ? 'Schließen' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
