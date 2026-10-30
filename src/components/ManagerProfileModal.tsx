import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { GameState } from '../types';
import { calculateClubReputation, getManagerStandingTier, getManagerStandingShortTitle } from '../data/gameConstants';

interface ManagerProfileModalProps {
  state: GameState;
  lang?: string;
  onClose: () => void;
}

export const ManagerProfileModal: React.FC<ManagerProfileModalProps> = ({
  state,
  lang = 'en',
  onClose,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const rep = state.reputation ?? 50;
  const isDe = lang === 'de';

  const repTier = getManagerStandingTier(rep, state.club.tier, isDe);
  const totalTrophies = state.totals?.trophies ?? (state.trophies?.length || 0);
  const seasonsManaged = state.history?.length || 0;
  const worldCupWins = state.worldCupTrophies || state.internationalTrophies || 0;

  // Commercial leverage calculation
  const sponsorBonusPct = Math.round((rep / 100) * 35);

  // Build historical reputation timeline
  const timelineData = useMemo(() => {
    const history = state.history || [];
    const currentRep = state.reputation ?? 50;
    const currentYear = state.year || 2026;

    if (history.length === 0) {
      return [
        {
          year: currentYear,
          clubName: state.club.name || 'Club',
          leagueTag: `T${state.club.tier || 1}`,
          rep: currentRep,
          tier: state.club.tier || 1,
          pos: undefined,
          trophiesCount: (state.trophies?.length || 0),
          isCurrent: true,
        }
      ];
    }

    // Baseline reputation estimate for first recorded season
    const startClubRep = calculateClubReputation(history[0].ovr || 65, history[0].tier || 1);
    let runningRep = Math.max(25, Math.min(80, startClubRep));

    const standardTrophyWeights: Record<string, number> = {
      wc: 15,
      cl: 12,
      cwc: 8,
      bl: 6,
      el: 5,
      dfb: 4,
      lower: 4,
      ecl: 3,
      efl: 3,
      reg: 2,
    };

    const points = history.map((h, idx) => {
      // Delta based on domestic finish
      let delta = 0;
      if (h.pos === 1) delta += 7;
      else if (h.pos <= 3) delta += 4;
      else if (h.pos >= 15) delta -= 4;

      if (h.trophiesThisYear && typeof h.trophiesThisYear === 'object') {
        for (const [k, rawVal] of Object.entries(h.trophiesThisYear)) {
          const count = Number(rawVal) || 0;
          if (count <= 0) continue;
          const weight = standardTrophyWeights[k] ?? 3; // Custom/modded competition fallback
          delta += weight * count;
        }
      }

      runningRep = Math.max(15, Math.min(100, runningRep + delta));

      const trCount = h.trophiesThisYear
        ? Object.values(h.trophiesThisYear).reduce<number>((acc, val) => acc + (Number(val) || 0), 0)
        : 0;

      const safeTier = Math.max(1, Number(h.tier) || state.club.tier || 1);
      const safeTag = h.leagueTag || `T${safeTier}`;

      return {
        year: h.year || currentYear,
        clubName: h.clubName || state.club.name || 'Club',
        leagueTag: safeTag,
        rep: idx === history.length - 1 ? currentRep : runningRep,
        tier: safeTier,
        pos: h.pos,
        trophiesCount: trCount,
        isCurrent: idx === history.length - 1,
      };
    });

    if (points.length > 0) {
      points[points.length - 1].rep = currentRep;
      points[points.length - 1].isCurrent = true;
    }

    return points;
  }, [state.history, state.reputation, state.year, state.club, state.trophies]);

  const activePoint = selectedPointIndex !== null && timelineData[selectedPointIndex]
    ? timelineData[selectedPointIndex]
    : timelineData[timelineData.length - 1];

  // SVG Chart Dimensions
  const svgWidth = 560;
  const svgHeight = 170;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 30;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getCoordinates = (index: number, score: number) => {
    const x = timelineData.length === 1
      ? padLeft + plotWidth / 2
      : padLeft + (index / (timelineData.length - 1)) * plotWidth;
    const y = padTop + (1 - Math.max(0, Math.min(100, score)) / 100) * plotHeight;
    return { x, y };
  };

  const linePath = useMemo(() => {
    if (timelineData.length === 0) return '';
    if (timelineData.length === 1) {
      const { x, y } = getCoordinates(0, timelineData[0].rep);
      return `M ${x - 30} ${y} L ${x + 30} ${y}`;
    }

    return timelineData.reduce((path, pt, idx) => {
      const { x, y } = getCoordinates(idx, pt.rep);
      if (idx === 0) return `M ${x} ${y}`;

      const prev = getCoordinates(idx - 1, timelineData[idx - 1].rep);
      const cpX1 = prev.x + (x - prev.x) * 0.45;
      const cpX2 = prev.x + (x - prev.x) * 0.55;
      return `${path} C ${cpX1} ${prev.y}, ${cpX2} ${y}, ${x} ${y}`;
    }, '');
  }, [timelineData]);

  const areaPath = useMemo(() => {
    if (timelineData.length < 2) return '';
    const first = getCoordinates(0, timelineData[0].rep);
    const last = getCoordinates(timelineData.length - 1, timelineData[timelineData.length - 1].rep);
    const bottomY = padTop + plotHeight;
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [linePath, timelineData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-5 backdrop-blur-2xl bg-black/80 overflow-y-auto overscroll-contain"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#12141c]/95 backdrop-blur-3xl w-full max-w-2xl rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden relative z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 text-lg shadow-inner">
              <i className="fas fa-medal"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Manager Reputation & Standing
                </h2>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Global Director Prestige, Career Trajectory & Commercial Clout
              </p>
            </div>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 custom-scrollbar flex-1 min-h-0">
          {/* Hero Reputation Score Card */}
          <div className="bg-white/[0.03] rounded-2xl p-5 sm:p-6 border border-white/[0.06] relative overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-amber-500/10 border border-amber-400/30 flex flex-col items-center justify-center shrink-0 shadow-inner">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none">{rep}</span>
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mt-0.5">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${repTier.badge}`}>
                      {repTier.title}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {state.managerName || 'Sporting Director'}
                  </h3>
                  <div className="text-xs text-zinc-400 font-medium">
                    Current Club: <span className="text-white font-bold">{state.club.name}</span> · Tier {state.club.tier}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">
                  Career Experience
                </div>
                <div className="text-sm font-bold text-white mt-0.5 tabular-nums">
                  {seasonsManaged} Seasons Completed
                </div>
                <div className="text-[11px] text-amber-400 font-bold mt-0.5">
                  🏆 {totalTrophies} Honours Won
                </div>
              </div>
            </div>

            {/* Qualitative Verdict */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-start gap-2.5">
              <i className={`fas ${repTier.icon} ${repTier.color} text-sm mt-0.5 shrink-0`}></i>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                {repTier.desc}
              </p>
            </div>
          </div>

          {/* SECTION 2: Career Reputation Progression Chart */}
          <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3.5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5 flex items-center gap-1.5">
                  <i className="fas fa-chart-line text-amber-400"></i>
                  <span>Career Trajectory</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  Reputation & Standing Progression
                </h3>
              </div>
            </div>

            {/* Active Node Detail Callout */}
            {activePoint && (
              <div className="bg-black/40 rounded-xl p-3 border border-white/5 mb-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center tabular-nums font-black text-xs shrink-0">
                    '{String(activePoint.year).slice(-2)}
                  </div>
                  <div>
                    <div className="font-black text-white flex items-center gap-1.5">
                      <span>{activePoint.clubName}</span>
                      {activePoint.isCurrent && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-medium">
                      Season {activePoint.year} {activePoint.leagueTag ? `(${activePoint.leagueTag})` : ''} • {activePoint.pos ? `Finish: #${activePoint.pos}` : 'In Progress'}
                      {activePoint.trophiesCount ? ` • 🏆 ${activePoint.trophiesCount} ${activePoint.trophiesCount === 1 ? 'Trophy' : 'Trophies'}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-amber-400 tabular-nums">
                    {activePoint.rep} <span className="text-xs text-zinc-500 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">
                    {getManagerStandingShortTitle(activePoint.rep, activePoint.tier || state.club.tier, isDe)}
                  </div>
                </div>
              </div>
            )}

            {/* Chart Area - Interactive Line Chart */}
            <div className="w-full overflow-x-auto custom-scrollbar">
              <div className="min-w-[440px] relative">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="repAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                      <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="repLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>

                  {/* Benchmark Grid Lines */}
                  {/* 100% */}
                  <line x1={padLeft} y1={padTop} x2={svgWidth - padRight} y2={padTop} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <text x={padLeft - 8} y={padTop + 4} fill="#71717a" fontSize="9" textAnchor="end" className="tabular-nums font-medium">100</text>

                  {/* 85% (Global Elite threshold) */}
                  <line x1={padLeft} y1={padTop + (1 - 0.85) * plotHeight} x2={svgWidth - padRight} y2={padTop + (1 - 0.85) * plotHeight} stroke="rgba(245,158,11,0.2)" strokeDasharray="2 4" />
                  <text x={padLeft - 8} y={padTop + (1 - 0.85) * plotHeight + 3} fill="#d97706" fontSize="8" textAnchor="end" className="tabular-nums font-semibold">85</text>

                  {/* 70% (Continental threshold) */}
                  <line x1={padLeft} y1={padTop + (1 - 0.70) * plotHeight} x2={svgWidth - padRight} y2={padTop + (1 - 0.70) * plotHeight} stroke="rgba(56,189,248,0.2)" strokeDasharray="2 4" />
                  <text x={padLeft - 8} y={padTop + (1 - 0.70) * plotHeight + 3} fill="#0284c7" fontSize="8" textAnchor="end" className="tabular-nums font-semibold">70</text>

                  {/* 50% (Established threshold) */}
                  <line x1={padLeft} y1={padTop + (1 - 0.50) * plotHeight} x2={svgWidth - padRight} y2={padTop + (1 - 0.50) * plotHeight} stroke="rgba(16,185,129,0.15)" strokeDasharray="2 4" />
                  <text x={padLeft - 8} y={padTop + (1 - 0.50) * plotHeight + 3} fill="#059669" fontSize="8" textAnchor="end" className="tabular-nums font-semibold">50</text>

                  {/* Bottom Axis Baseline */}
                  <line x1={padLeft} y1={padTop + plotHeight} x2={svgWidth - padRight} y2={padTop + plotHeight} stroke="rgba(255,255,255,0.15)" />
                  <text x={padLeft - 8} y={padTop + plotHeight + 3} fill="#71717a" fontSize="9" textAnchor="end" className="tabular-nums font-medium">0</text>

                  {/* Gradient Area Fill */}
                  {areaPath && <path d={areaPath} fill="url(#repAreaGrad)" />}

                  {/* Main Line Stroke */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#repLineGrad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    />
                  )}

                  {/* Nodes / Dots */}
                  {timelineData.map((pt, idx) => {
                    const { x, y } = getCoordinates(idx, pt.rep);
                    const isSelected = selectedPointIndex === idx || (selectedPointIndex === null && idx === timelineData.length - 1);

                    return (
                      <g
                        key={pt.year}
                        className="cursor-pointer group"
                        onClick={() => setSelectedPointIndex(idx)}
                      >
                        {/* Invisible hover target */}
                        <circle cx={x} cy={y} r="14" fill="transparent" />

                        {/* Steady Halo Accent ring if selected or current (Replaced harsh animate-ping pulsating dot) */}
                        {isSelected && (
                          <circle
                            cx={x}
                            cy={y}
                            r="9"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            opacity="0.5"
                          />
                        )}

                        {/* Outer circle */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? '6' : '4.5'}
                          fill={pt.rep >= 85 ? '#f59e0b' : pt.rep >= 70 ? '#38bdf8' : pt.rep >= 50 ? '#10b981' : '#a1a1aa'}
                          stroke="#000000"
                          strokeWidth="2"
                          className="transition-all duration-200"
                        />

                        {/* Year label underneath */}
                        <text
                          x={x}
                          y={padTop + plotHeight + 16}
                          fill={isSelected ? '#f59e0b' : '#a1a1aa'}
                          fontSize="10"
                          className="tabular-nums font-semibold"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                        >
                          '{String(pt.year).slice(-2)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Threshold Legend */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-3 pt-2.5 border-t border-white/[0.06] flex-wrap gap-2">
              <span className="font-bold text-zinc-500 uppercase tracking-widest">{isDe ? 'Branchen-Stufen:' : 'Industry Thresholds:'}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-amber-400 font-bold" title="Tier 1 exclusive">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> 85+ {isDe ? 'Weltklasse (Liga 1)' : 'Global Elite (Tier 1)'}
                </span>
                <span className="flex items-center gap-1 text-sky-400 font-bold" title="Tier 1 exclusive">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span> 70+ {isDe ? 'Kontinental (Liga 1)' : 'Continental (Tier 1)'}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 50+ {isDe ? 'Etabliert' : 'Established'}
                </span>
              </div>
            </div>

            {state.club.tier > 1 && (
              <div className="mt-2.5 bg-sky-500/10 border border-sky-400/20 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-sky-300">
                <i className="fa-solid fa-circle-info text-sky-400 shrink-0"></i>
                <span>
                  {isDe
                    ? `Aktuelle Liga: Liga ${state.club.tier}. Weltklasse- und Kontinental-Status sind ausschließlich in der 1. Liga (Tier 1) erreichbar.`
                    : `Current Division: Tier ${state.club.tier}. Continental and Global Elite standing are strictly exclusive to top-flight Tier 1.`}
                </span>
              </div>
            )}
          </div>

          {/* Industry Stature Strip */}
          <div className="bg-white/[0.03] rounded-2xl p-3 sm:p-4 border border-white/[0.06] shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2.5">
              {isDe ? 'Reputations-Faktoren' : 'Reputation Breakdown'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                  🏆 {isDe ? 'Titel' : 'Silverware'}
                </div>
                <div className="text-xs sm:text-sm font-bold text-amber-400 truncate tabular-nums">
                  {totalTrophies} {isDe ? 'Titel' : 'Trophies'}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                  📊 {isDe ? 'Liga' : 'Division'}
                </div>
                <div className="text-xs sm:text-sm font-bold text-sky-400 truncate tabular-nums">
                  Tier {state.club.tier} · {state.club.baseOvr} OVR
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                  🌍 {isDe ? 'WM' : 'World Cup'}
                </div>
                <div className="text-xs sm:text-sm font-bold text-emerald-400 truncate">
                  {worldCupWins > 0
                    ? `${worldCupWins}x Champion`
                    : (state.worldCupCampaigns?.length || 0) > 0
                    ? (isDe ? 'Teilnehmer' : 'Contender')
                    : (isDe ? 'Keine' : 'Uncapped')}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                  🤝 {isDe ? 'Sponsoring' : 'Commercial'}
                </div>
                <div className="text-xs sm:text-sm font-bold text-purple-400 truncate tabular-nums">
                  +{sponsorBonusPct}% {isDe ? 'Bonus' : 'Sponsor Value'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] text-white font-semibold text-xs tracking-wider transition cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
