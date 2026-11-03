import React from 'react';
import { GameState } from '../types';

export const Standings: React.FC<{ state: GameState; lang?: string }> = ({ state, lang }) => {
  if (!state.history || state.history.length === 0) return null;
  const currentSeason = state.history[state.history.length - 1];

  return (
    <div className="bg-[#14151e] rounded-2xl border border-white/[0.04] p-5 shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

      <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2 mb-3.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>Final Standings (Simulated)</span>
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-baseline p-3 bg-[#10121a] border border-white/[0.04] rounded-xl">
          <span className="text-zinc-400 text-xs font-normal">Position</span>
          <span className="font-semibold text-white tabular-nums text-sm">#{currentSeason.pos}</span>
        </div>
        <div className="flex justify-between items-baseline p-3 bg-[#10121a] border border-white/[0.04] rounded-xl">
          <span className="text-zinc-400 text-xs font-normal">Points</span>
          <span className="font-semibold text-amber-400 tabular-nums text-sm">{currentSeason.pts} pts</span>
        </div>
        <div className="flex justify-between items-baseline p-3 bg-[#10121a] border border-white/[0.04] rounded-xl">
          <span className="text-zinc-400 text-xs font-normal">Record (W-D-L)</span>
          <span className="font-semibold text-zinc-200 tabular-nums text-sm">{currentSeason.wins}-{currentSeason.draws}-{currentSeason.losses}</span>
        </div>
        <div className="flex justify-between items-baseline p-3 bg-[#10121a] border border-white/[0.04] rounded-xl">
          <span className="text-zinc-400 text-xs font-normal">Goals</span>
          <span className="font-semibold text-zinc-200 tabular-nums text-sm">{currentSeason.gf} : {currentSeason.ga}</span>
        </div>
      </div>
    </div>
  );
};
