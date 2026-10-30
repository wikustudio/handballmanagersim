import React from 'react';
import { motion } from 'framer-motion';
import { GameState } from '../types';
import { formatMoney, getLeagueScaledFans } from '../data/gameConstants';

interface PrestigeModalProps {
  state: GameState;
  onClose: () => void;
  onPrestigePurchase: (type: 'statue' | 'stadium' | 'feeder' | 'immortality') => void;
}

export const PrestigeModal: React.FC<PrestigeModalProps> = ({ state, onClose, onPrestigePurchase }) => {
  const isTier1 = state.club.tier === 1;
  const hasWealth = state.budget >= 250000;
  const country = state.club.country || 'GER';
  const stadiumFanGain = Math.max(5000, getLeagueScaledFans(state.club.tier, 5000, country, state.club.originalStartLeague || state.club.tier));
  const immortalityFanGain = Math.max(15000, getLeagueScaledFans(state.club.tier, 15000, country, state.club.originalStartLeague || state.club.tier));
  
  if (!isTier1 || !hasWealth) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
        <div className="bg-[#12141c] border border-white/10 rounded-3xl p-8 max-w-sm text-center shadow-2xl">
          <i className="fa-solid fa-lock text-3xl text-zinc-600 mb-4"></i>
          <h2 className="text-lg font-bold text-white mb-2">VIP Access Denied</h2>
          <p className="text-xs text-zinc-400">Reach Tier 1 and accumulate {formatMoney(250000, country)} to unlock Billionaire Prestige Investments.</p>
        </div>
      </div>
    );
  }

  const upgrades = state.prestigeUpgrades || {};

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} 
        animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-gradient-to-b from-[#1a1400] to-[#0a0800] border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden"
      >
        <div className="p-6 border-b border-amber-500/20 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg">
              <i className="fa-solid fa-crown"></i>
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Billionaire Sinks</div>
              <h2 className="text-xl font-bold text-amber-100">Legacy & Prestige</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-200/50 hover:text-amber-200 transition cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-amber-200/60 mb-4">Cement your legacy with permanent vanity projects. These investments carry over across seasons.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bronze Statue */}
            <button 
              onClick={() => onPrestigePurchase('statue')}
              disabled={Boolean(upgrades.statueBuilt) || state.budget < 100000}
              className={`p-5 rounded-2xl border text-left transition-all ${upgrades.statueBuilt ? 'bg-emerald-950/30 border-emerald-500/30 opacity-60' : 'bg-black/40 border-amber-500/20 hover:border-amber-400 hover:bg-amber-950/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <i className="fa-solid fa-monument text-2xl text-amber-400"></i>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">{formatMoney(100000, country)}</span>
              </div>
              <h3 className="font-bold text-amber-100 text-sm">Bronze Statue</h3>
              <p className="text-[11px] text-amber-200/60 mt-1">+1 Permanent Immunity Shield</p>
              {upgrades.statueBuilt && <div className="mt-3 text-[10px] font-bold text-emerald-400"><i className="fa-solid fa-check"></i> Constructed</div>}
            </button>

            {/* Stadium Naming */}
            <button 
              onClick={() => onPrestigePurchase('stadium')}
              disabled={Boolean(upgrades.stadiumRenamed) || state.budget < 250000}
              className={`p-5 rounded-2xl border text-left transition-all ${upgrades.stadiumRenamed ? 'bg-emerald-950/30 border-emerald-500/30 opacity-60' : 'bg-black/40 border-amber-500/20 hover:border-amber-400 hover:bg-amber-950/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <i className="fa-solid fa-signature text-2xl text-amber-400"></i>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">{formatMoney(250000, country)}</span>
              </div>
              <h3 className="font-bold text-amber-100 text-sm">Stadium Naming</h3>
              <p className="text-[11px] text-amber-200/60 mt-1">Rename after Director (+10 Trust, +{stadiumFanGain.toLocaleString('en-US')} Fans)</p>
              {upgrades.stadiumRenamed && <div className="mt-3 text-[10px] font-bold text-emerald-400"><i className="fa-solid fa-check"></i> Renamed</div>}
            </button>

            {/* Feeder Club */}
            <button 
              onClick={() => onPrestigePurchase('feeder')}
              disabled={Boolean(upgrades.feederClubPurchased) || state.budget < 500000 || (state.skillPoints || 0) < 20}
              className={`p-5 rounded-2xl border text-left transition-all ${upgrades.feederClubPurchased ? 'bg-emerald-950/30 border-emerald-500/30 opacity-60' : 'bg-black/40 border-amber-500/20 hover:border-amber-400 hover:bg-amber-950/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <i className="fa-solid fa-sitemap text-2xl text-amber-400"></i>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">{formatMoney(500000, country)} & 20 DP</span>
              </div>
              <h3 className="font-bold text-amber-100 text-sm">Tier 5 Feeder Club</h3>
              <p className="text-[11px] text-amber-200/60 mt-1">+1 OVR to all future Youth Graduates</p>
              {upgrades.feederClubPurchased && <div className="mt-3 text-[10px] font-bold text-emerald-400"><i className="fa-solid fa-check"></i> Acquired</div>}
            </button>

            {/* Sovereign Immortality */}
            <button 
              onClick={() => onPrestigePurchase('immortality')}
              disabled={Boolean(upgrades.managerialImmortality) || state.budget < 500000 || (state.skillPoints || 0) < 100}
              className={`p-5 rounded-2xl border text-left transition-all ${upgrades.managerialImmortality ? 'bg-emerald-950/30 border-emerald-500/30 opacity-60' : 'bg-black/40 border-amber-500/20 hover:border-amber-400 hover:bg-amber-950/30 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <i className="fa-solid fa-gem text-2xl text-amber-300 animate-pulse"></i>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">{formatMoney(500000, country)} & 100 DP</span>
              </div>
              <h3 className="font-bold text-amber-100 text-sm">Sovereign Immortality</h3>
              <p className="text-[11px] text-amber-200/60 mt-1">+3 Shields, +25 Trust & +{immortalityFanGain.toLocaleString('en-US')} Fans</p>
              {upgrades.managerialImmortality && <div className="mt-3 text-[10px] font-bold text-emerald-400"><i className="fa-solid fa-check"></i> Legend</div>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
