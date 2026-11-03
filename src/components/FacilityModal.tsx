import React from 'react';
import { motion } from 'motion/react';
import { GameState, Language, getAcademySlotLimit } from '../types';
import { t as tr } from '../data/translations';
import { formatMoney, getCountryMult, isReserveClub } from '../data/gameConstants';
import { useModalDismiss } from '../utils/modalUtils';

interface FacilityModalProps {
  type: 'academy' | 'medical';
  state: GameState;
  lang: Language;
  cost: number;
  onClose: () => void;
  onConfirm: () => void;
  canAfford: boolean;
}

export const FacilityModal: React.FC<FacilityModalProps> = ({ type, state, lang, cost, onClose, onConfirm, canAfford }) => {
  const t = (en: string, _de?: string) => en;
  
  useModalDismiss(onClose);

  const isAcademy = type === 'academy';
  const currentLevel = isAcademy ? (state.club.academyLevel || 1) : (state.club.medicalLevel || 1);
  const nextLevel = currentLevel + 1;
  const isMaxLevel = currentLevel >= 5;
  const tier = state.club.tier || 1;
  const cMult = getCountryMult(state.club.country);
  const baseAcademyTierMap: Record<number, number> = {
    1: 120000,
    2: 48000,
    3: 16000,
    4: 5000,
    5: 1800,
    6: 750,
  };
  const baseMedicalTierMap: Record<number, number> = {
    1: 75000,
    2: 32000,
    3: 14000,
    4: 4500,
    5: 1800,
    6: 750,
  };
  const baseAcademy = isReserveClub(state.club.name) ? 0 : (baseAcademyTierMap[tier] || 750) * cMult;
  const baseMedical = (baseMedicalTierMap[tier] || 750) * cMult * (isReserveClub(state.club.name) ? 0.35 : 1);
  const currentUpkeep = isAcademy 
    ? Math.floor(baseAcademy * Math.pow(1.15, currentLevel - 1))
    : Math.floor(baseMedical * Math.pow(1.15, currentLevel - 1));
  const newUpkeep = isAcademy 
    ? Math.floor(baseAcademy * Math.pow(1.15, nextLevel - 1))
    : Math.floor(baseMedical * Math.pow(1.15, nextLevel - 1));
  const currentInfra = (state.facilitiesUpgradedThisSeason || 0) + (state.infraActionsThisSeason || 0);
  const isCranesLocked = currentInfra >= 2;
  const isUpgradedThisSeason = isAcademy 
    ? (state.academyUpgradedThisSeason || 0) >= 1 
    : (state.medicalUpgradedThisSeason || 0) >= 1;

  const milestones = isAcademy
    ? [
        { lvl: 2, title: 'Regional Hub', desc: 'Unlocks scouting 2 youths per season (up from 1) & 8 academy slots', icon: 'fa-binoculars' },
        { lvl: 3, title: 'National NLZ', desc: 'Unlocks Anti-Poaching Shielding against predatory top-tier rivals', icon: 'fa-shield-halved' },
        { lvl: 4, title: 'Continental Setup', desc: 'Unlocks Foreign Imports 🌍 (wonderkids from DEN, FRA, ESP, SWE, NOR)', icon: 'fa-earth-europe' },
        { lvl: 5, title: 'Global Dynasty', desc: 'Grants permanent immunity from the "Target on the Back" title penalty', icon: 'fa-crown' },
      ]
    : [
        { lvl: 2, title: 'In-House Rehab Suite', desc: 'Free mid-season injury dilemma rehab (€0 vs €40k) & -50% crisis rehab cost', icon: 'fa-kit-medical' },
        { lvl: 3, title: 'Sports Science Lab', desc: 'Permanent immunity from Dramatic Squad Decay, 100% Star Injury recovery & -50% Title Tax', icon: 'fa-vial-circle-check' },
        { lvl: 4, title: 'Cryo & Biomechanics', desc: 'Caps annual retirements at max 1 player & retains 50% of Veteran Ringer OVR upon retirement', icon: 'fa-snowflake' },
        { lvl: 5, title: 'Peak Performance Institute', desc: '+1.0 Matchday Conditioning OVR, -50% Generational Turnover shield & permanent Dynasty Immunity', icon: 'fa-bolt' },
      ];

  const ambientGlow = isAcademy ? 'via-emerald-400/30' : 'via-purple-400/30';

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 8 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.96, opacity: 0, y: 8 }} 
        transition={{ duration: 0.15, ease: 'easeOut' }} 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] border border-white/[0.04] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${ambientGlow} to-transparent pointer-events-none`} />

        <button 
          aria-label="Close modal" 
          onClick={onClose}
          className="active:scale-95 absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer z-10"
        >
          <i className="fas fa-xmark text-sm" />
        </button>

        <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1 -mr-1">

        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 ${
            isAcademy 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }`}>
            <i className={`fas ${isAcademy ? 'fa-seedling' : 'fa-heart-pulse'}`} />
          </div>

          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
            {t('Club Infrastructure', 'Vereins-Infrastruktur')} · {t('Cranes', 'Baukräne')}: {currentInfra}/2
          </div>

          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
            {isAcademy ? 'Upgrade Youth Academy' : 'Upgrade Medical Center'}
          </h3>
          
          <p className="text-xs text-zinc-400 leading-relaxed mb-4 max-w-sm font-normal">
            {isAcademy 
              ? `Investing in your academy improves youth potential and capacity (${getAcademySlotLimit(currentLevel)}${!isMaxLevel ? ` → ${getAcademySlotLimit(nextLevel)}` : ''} slots).`
              : `A top-tier medical department mitigates aging decay (${Math.max(0, (currentLevel - 1) * 12)}%${!isMaxLevel ? ` → ${(nextLevel - 1) * 12}%` : ''}) and cushions against injuries.`
            }
          </p>
        </div>

        {/* Milestone Capability Unlocks (Lvl 2-5) */}
        <div className="bg-[#10121a] rounded-2xl p-4 mb-4 border border-white/[0.04] flex flex-col gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
            Milestone Capability Unlocks
          </div>
          {milestones.map((m) => {
            const isUnlocked = currentLevel >= m.lvl;
            const isNext = nextLevel === m.lvl;
            return (
              <div
                key={m.lvl}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition ${
                  isUnlocked
                    ? isAcademy
                      ? 'bg-emerald-500/[0.06] border-emerald-500/25'
                      : 'bg-purple-500/[0.06] border-purple-500/25'
                    : isNext
                    ? 'bg-amber-500/[0.06] border-amber-500/25'
                    : 'bg-black/30 border-white/[0.04] opacity-60'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 mt-0.5 border ${
                  isUnlocked
                    ? isAcademy
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : isNext
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
                }`}>
                  <i className={`fas ${isUnlocked ? 'fa-check' : m.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[11px] font-semibold ${
                      isUnlocked ? (isAcademy ? 'text-emerald-300' : 'text-purple-300') : isNext ? 'text-amber-300' : 'text-zinc-400'
                    }`}>
                      Lvl {m.lvl} · {m.title}
                    </span>
                    <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                      isUnlocked
                        ? isAcademy
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-purple-500/15 text-purple-300'
                        : isNext
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-white/[0.04] text-zinc-500'
                    }`}>
                      {isUnlocked ? 'Active' : isNext ? 'Next Unlock' : `Lvl ${m.lvl}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Level & Financials Bento */}
        <div className="bg-[#10121a] rounded-2xl p-4 mb-4 border border-white/[0.04] flex flex-col gap-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Facility Level</span>
            <div className="flex items-center gap-2 font-semibold text-sm tabular-nums">
              <span className="text-zinc-400">Lvl {currentLevel}</span>
              {!isMaxLevel && (
                <>
                  <i className="fas fa-arrow-right text-zinc-600 text-[10px]" />
                  <span className={isAcademy ? 'text-emerald-400' : 'text-purple-400'}>Lvl {nextLevel}</span>
                </>
              )}
            </div>
          </div>
          
          {!isMaxLevel && (
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{t('Construction Cost', 'Baukosten')}</span>
              <span className="font-semibold text-white text-sm tabular-nums">{formatMoney(cost)}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{t('Annual Upkeep', 'Jahres-Unterhalt')}</span>
            <div className="flex flex-col items-end tabular-nums">
              <span className="text-rose-400 font-semibold text-sm">{formatMoney(isMaxLevel ? currentUpkeep : newUpkeep)}/yr</span>
              {!isMaxLevel && (
                <span className="text-[10px] text-zinc-500 line-through">{formatMoney(currentUpkeep)}/yr</span>
              )}
            </div>
          </div>
        </div>

        {/* Warning Note */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-5 flex gap-2.5 items-start">
          <i className="fas fa-circle-info text-amber-400 mt-0.5 text-xs shrink-0" />
          <p className="text-[11px] text-amber-200/90 leading-relaxed font-normal">
            <strong className="text-amber-300 font-medium mr-1">{t('Fixed Cost Advisory:', 'Fiskalischer Hinweis:')}</strong>
            {t('Facility upkeep is a permanent recurring expense. Ensure your revenue can sustain it through lower league tiers.', 'Der Unterhalt ist ein fester Kostenpunkt. Achte darauf, dass dein Budget die Betriebskosten dauerhaft tragen kann.')}
          </p>
        </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            disabled={!canAfford || isCranesLocked || isUpgradedThisSeason || isMaxLevel}
            className={`w-full py-3 px-5 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-150 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
              isMaxLevel || isUpgradedThisSeason || isCranesLocked
                ? 'bg-white/[0.02] text-zinc-500 cursor-not-allowed border border-white/[0.04]'
                : !canAfford
                ? 'bg-rose-500/10 text-rose-400 cursor-not-allowed border border-rose-500/20'
                : isAcademy 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30' 
                : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30'
            }`}
          >
            {isMaxLevel
              ? t('Maximum Level 5 Reached', 'Maximale Stufe 5 erreicht')
              : isUpgradedThisSeason
              ? t('Already upgraded this season (1/1)', 'In dieser Saison bereits ausgebaut (1/1)')
              : isCranesLocked
              ? t('All cranes in use this season (2/2)', 'Alle Baugenehmigungen ausgeschöpft (2/2)')
              : !canAfford 
              ? t('Insufficient Funds', 'Nicht genügend Budget') 
              : t('Authorize Upgrade', 'Ausbau autorisieren')}
          </button>
          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-xs font-medium bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 hover:text-white border border-white/[0.04] transition active:scale-[0.99] cursor-pointer"
          >
            {t('Cancel', 'Abbrechen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
