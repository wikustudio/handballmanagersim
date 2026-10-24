import React from 'react';
import { motion } from 'motion/react';
import { formatMoney, getCountryFlag } from '../data/gameConstants';
import { ClubLogo } from './ClubLogo';
import { Language, Club } from '../types';
import { useModalDismiss } from '../utils/modalUtils';

interface TvCupTieModalProps {
  userClub: Club;
  opponent: {
    name: string;
    baseOvr: number;
    tier?: number;
    logo?: string;
    color?: string;
    country?: string;
  };
  cupName: string;
  jackpotAmount: number;
  lang: Language;
  onClaim: () => void;
}

export const TvCupTieModal: React.FC<TvCupTieModalProps> = ({
  userClub,
  opponent,
  cupName,
  jackpotAmount,
  lang,
  onClaim,
}) => {
  useModalDismiss(onClaim);
  const isDe = lang === 'de';

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="bg-[#12131c] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_80px_rgba(245,158,11,0.25)] relative overflow-hidden flex flex-col cursor-default"
      >
        {/* Top Radiant Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400 pointer-events-none" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Live Broadcast Header Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {isDe ? 'LIVE AUF SENDUNG · PRIME TIME' : 'LIVE ON PRIME-TIME TV'}
            </span>
          </div>

          <div className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <i className="fas fa-trophy text-[9px]" />
            <span>{cupName}</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 block mb-1">
            {isDe ? 'DAS GROSSE LOS · KASSENSCHLAGER' : 'THE CUP JACKPOT · GRASSROOTS LIFELINE'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {isDe ? 'TV-Pokalschlager Gezogen!' : 'TV Cup Tie Drawn!'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {isDe
              ? `Dein Unterhaus-Klub trifft im Pokal auf den Erstliga-Giganten ${opponent.name}! Volle Halle, 50/50-Einnahmenteilung und TV-Livegelder retten deine Finanzen.`
              : `Your lower-league club drew Tier 1 Giant ${opponent.name}! Guaranteed sold-out arena, 50/50 gate receipts, and prime-time broadcast split.`}
          </p>
        </div>

        {/* Matchup Showcase Bento */}
        <div className="bg-[#181926] border border-white/[0.06] rounded-2xl p-4 mb-5 relative overflow-hidden">
          <div className="grid grid-cols-2 gap-3 items-center text-center">
            {/* User Club */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center p-1 bg-black/40 border border-white/[0.08] mb-2 shadow-sm">
                <ClubLogo club={userClub} name={userClub.name} color={userClub.color} logo={userClub.logo} className="w-9 h-9 object-contain" />
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[120px]">{userClub.name}</span>
              <span className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                {isDe ? `Liga-Stufe ${userClub.tier} · ${userClub.baseOvr} GES` : `Tier ${userClub.tier} · ${userClub.baseOvr} OVR`}
              </span>
            </div>

            {/* Giant Opponent */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center p-1 bg-black/40 border border-amber-500/30 mb-2 shadow-sm">
                <ClubLogo name={opponent.name} color={opponent.color} logo={opponent.logo} className="w-9 h-9 object-contain" />
              </div>
              <span className="text-xs font-bold text-amber-200 truncate max-w-[120px] flex items-center gap-1 justify-center">
                <span>{opponent.name}</span>
                <i className="fas fa-crown text-[10px] text-amber-400" />
              </span>
              <span className="text-[10px] text-amber-400/80 mt-0.5 font-mono font-semibold">
                {isDe ? `Erstliga-Gigant · ${opponent.baseOvr} GES` : `Tier 1 Giant · ${opponent.baseOvr} OVR`}
              </span>
            </div>
          </div>

          {/* Sold out arena banner */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-300">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <i className="fas fa-ticket text-xs" />
              <span>{isDe ? 'Ausverkauft in 18 Minuten' : 'Arena Sold Out in 18 Mins'}</span>
            </span>
            <span className="text-zinc-400 text-[10px]">
              {isDe ? '50/50 Zuschauereinnahmen' : '50/50 Gate Receipts'}
            </span>
          </div>
        </div>

        {/* The Jackpot Loot Drop */}
        <div className="bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-4 mb-5 text-center shadow-inner">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block mb-1">
            {isDe ? 'GARANTIERTE GESAMTERLÖSE (TV & TICKETS)' : 'GUARANTEED WINDFALL (BROADCAST & GATE SPLIT)'}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight tabular-nums flex items-center justify-center gap-1">
            <span>+{formatMoney(jackpotAmount, userClub.country)}</span>
          </div>
          <span className="text-[11px] text-zinc-300/90 mt-1 block leading-snug">
            {isDe
              ? 'Wird unabhängig vom Spielergebnis sofort deinem Vereinskonto gutgeschrieben!'
              : 'Directly injected into your club treasury regardless of win or defeat!'}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClaim}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <i className="fas fa-sack-dollar text-base" />
          <span>{isDe ? 'Kassenschlager verbuchen & Weiter' : 'Claim Windfall & Resume Campaign'}</span>
        </button>
      </motion.div>
    </div>
  );
};
