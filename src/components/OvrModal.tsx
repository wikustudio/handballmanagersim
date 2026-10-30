import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Language } from '../types';
import { t as tr } from '../data/translations';
import { getLeagueInfo, isTacticalSynergy, TACTICS } from '../data/gameConstants';

export type OvrTierId = 'championship' | 'mid_table' | 'low_table_risk' | 'relegation_risk';

export interface OvrTierConfig {
  tier: OvrTierId;
  label: string;
  color: string;
  delta: number;
  deltaText: string;
  description: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: string;
}

export const getOvrTierConfig = (baseOvr: number, avgOvr: number): OvrTierConfig => {
  const delta = baseOvr - avgOvr;

  if (delta > 2) {
    // Green (#10b981) — Championship Material: For squads above division average. Clear title/promotion contender.
    return {
      tier: 'championship',
      label: 'Championship Material',
      color: '#10b981',
      delta,
      deltaText: `+${delta} OVR`,
      description: 'Squad is above division average. Clear title/promotion contender.',
      badgeBg: 'bg-[#10b981]/15',
      badgeBorder: 'border-[#10b981]/30',
      badgeText: 'text-[#10b981]',
      icon: 'fa-trophy'
    };
  }

  if (delta >= -2) {
    // White (#f4f4f5) — Mid-Table: For squads within 2 points of league benchmark (-2 to +2 delta). Balanced, calm presentation without dramatic alarms.
    return {
      tier: 'mid_table',
      label: 'Mid-Table',
      color: '#f4f4f5',
      delta,
      deltaText: delta > 0 ? `+${delta} OVR` : `${delta} OVR`,
      description: 'Squad is within 2 points of league benchmark (-2 to +2 delta). Balanced, calm presentation without dramatic alarms.',
      badgeBg: 'bg-[#f4f4f5]/15',
      badgeBorder: 'border-[#f4f4f5]/30',
      badgeText: 'text-[#f4f4f5]',
      icon: 'fa-scale-balanced'
    };
  }

  if (delta >= -5) {
    // Orange (#f97316) — Low Table Risk: For squads 3 to 5 below league benchmark (-3 to -5 delta). Cautionary lower-table tier without emergency panic.
    return {
      tier: 'low_table_risk',
      label: 'Low Table Risk',
      color: '#f97316',
      delta,
      deltaText: `${delta} OVR`,
      description: 'Squad is 3 to 5 below league benchmark (-3 to -5 delta). Cautionary lower-table tier without emergency panic.',
      badgeBg: 'bg-[#f97316]/15',
      badgeBorder: 'border-[#f97316]/30',
      badgeText: 'text-[#f97316]',
      icon: 'fa-triangle-exclamation'
    };
  }

  // Red (#ef4444) — Relegation Risk: For squads below league benchmark (> 5 below) facing genuine relegation peril.
  return {
    tier: 'relegation_risk',
    label: 'Relegation Risk',
    color: '#ef4444',
    delta,
    deltaText: `${delta} OVR`,
    description: 'Squad is more than 5 below league benchmark facing genuine relegation peril.',
    badgeBg: 'bg-[#ef4444]/15',
    badgeBorder: 'border-[#ef4444]/30',
    badgeText: 'text-[#ef4444]',
    icon: 'fa-circle-exclamation'
  };
};

interface OvrModalProps {
  state: GameState;
  lang: Language;
  onClose: () => void;
}

export const OvrModal: React.FC<OvrModalProps> = ({ state, lang, onClose }) => {
  const isDe = lang === 'de';
  const t = (en: string, de?: string) => tr(lang, en, de);

  const baseOvr = (typeof state.club.baseOvr === 'number' && !Number.isNaN(state.club.baseOvr)) ? state.club.baseOvr : 60;
  const prevOvrRaw = state.lastOvr !== undefined ? state.lastOvr : (state.history && state.history.length > 0 ? state.history[state.history.length - 1].ovr : baseOvr);
  const startOvr = (typeof prevOvrRaw === 'number' && !Number.isNaN(prevOvrRaw)) ? prevOvrRaw : baseOvr;
  const diff = baseOvr - startOvr;
  const coachBoost = state.currentCoach ? (state.currentCoach.ovrBoost || 0) : -4;
  
  const hasSynergy = Boolean(state.currentCoach && isTacticalSynergy(state.currentCoach.style, state.tactic));
  const synergyGain = hasSynergy
    ? (state.clubIdentity === 'moneyball' ? 4 : state.currentCoach?.weakness === 'Tactical Rigidity' ? 3 : 2)
    : 0;
  const isStale = Boolean(state.staleTactic && state.tactic === state.staleTactic);
  const isSurveillance = Boolean(!isStale && (state.consecutiveTitlesWithSameTactic || 0) >= 1);
  const stalePenalty = isStale ? 4 : 0;

  const leagueInfo = getLeagueInfo(state.club.tier, state.club.country || 'GER');
  const avgOvr = leagueInfo?.avgOvr || 60;
  const tierConfig = getOvrTierConfig(baseOvr, avgOvr);

  const hasMastermind = (state.managerSkills || []).includes('tactical_mastermind') || state.currentCoach?.strength === 'Tactical Chessboard Maestro' || (state.currentCoach as any)?.archetype === 'chessboard_maestro';
  let coachTraitMod = 0;
  if (state.currentCoach?.hiddenAttributes) {
    const { tacticalFlexibility = 10, motivationalDrive = 10, discipline = 10 } = state.currentCoach.hiddenAttributes;
    if (tacticalFlexibility >= 16) coachTraitMod += (tacticalFlexibility >= 18 ? 1.5 : 1.0);
    if (motivationalDrive >= 16 && baseOvr < avgOvr) coachTraitMod += 1.5;
    if (discipline >= 16) coachTraitMod += 0.5;
  }
  if (state.currentCoach?.weakness === 'Tactical Rigidity' && !hasSynergy) {
    coachTraitMod -= 5;
  }
  const caretakerPenalty = !state.currentCoach ? -4 : 0;
  const bounceMod = state.currentCoach && state.hasNewManagerBounce ? 2 : 0;
  const tenureMod = state.currentCoach && (state.coachTenure || 0) >= 3 && state.currentCoach?.strength !== 'Continental Legend' ? -1 : 0;
  const currentMorale = state.club.morale ?? 100;
  const moraleMod = currentMorale >= 85 ? 1.0 : currentMorale < 45 ? -1.5 : 0;
  const ultrasMod = state.stadiumPolicy === 'ultras' ? 1 : 0;

  const getLeagueAdvantage = (myTac: string, metaTac: string) => {
    const p = myTac === 'Catenaccio' || myTac === 'Defensive' ? 'Park the Bus' : myTac;
    if (p === 'Tiki-Taka' && metaTac === 'Park the Bus') return 1;
    if (p === 'Tiki-Taka' && metaTac === 'Gegenpressing') return -1;
    if (p === 'Park the Bus' && metaTac === 'Direct Counter') return 1;
    if (p === 'Park the Bus' && metaTac === 'Tiki-Taka') return -1;
    if (p === 'Direct Counter' && metaTac === 'Gegenpressing') return 1;
    if (p === 'Direct Counter' && metaTac === 'Park the Bus') return -1;
    if (p === 'Gegenpressing' && metaTac === 'Tiki-Taka') return 1;
    if (p === 'Gegenpressing' && metaTac === 'Direct Counter') return -1;
    return 0;
  };
  const leagueMetaAdv = getLeagueAdvantage(state.tactic || 'Total Football', (state as any).leagueMetaTactic || 'Total Football');
  const leagueMetaMod = leagueMetaAdv === 1 ? 2 : leagueMetaAdv === -1 ? -2 : 0;

  const tacticKey = state.tactic || 'Total Football';
  const tacticInfo = (TACTICS as Record<string, any>)[tacticKey] || (TACTICS as Record<string, any>)['Total Football'];
  let tacticBonus = 0;
  if (tacticInfo?.ovrBonusType === 'underdog' && baseOvr < avgOvr) {
    tacticBonus = 3;
  } else if (tacticInfo?.ovrBonusType === 'dominance') {
    if (baseOvr > avgOvr) {
      tacticBonus = 2;
    } else if (baseOvr < 60) {
      tacticBonus = -1;
    }
  } else if (tacticInfo?.ovrBonusType === 'home') {
    tacticBonus = 1.5;
  } else if (tacticInfo?.ovrBonusType === 'away') {
    tacticBonus = 1.5;
  }

  const rawTacticalNetMod = synergyGain + (hasMastermind ? 2 : 0) + coachTraitMod + caretakerPenalty + bounceMod + tenureMod + moraleMod + ultrasMod + leagueMetaMod + tacticBonus - stalePenalty;
  const tacticalNetMod = Math.round(rawTacticalNetMod * 10) / 10;
  const effectiveMatchdayOvr = Math.min(100, Math.max(10, Math.round((baseOvr + tacticalNetMod) * 10) / 10));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.1, ease: 'linear' }} 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 backdrop-blur-2xl bg-black/75 cursor-pointer overflow-y-auto overscroll-contain" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.98, opacity: 0 }} 
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }} 
        onClick={(e) => e.stopPropagation()} 
        className="bg-[#12141c]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[28px] sm:rounded-[32px] w-full max-w-md max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col cursor-default relative text-left"
      >
        {/* Ambient Accent Glow with Tier Color */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: tierConfig.color }}
        />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border flex items-center justify-center text-sm shadow-inner shrink-0"
              style={{
                color: tierConfig.color,
                borderColor: `${tierConfig.color}40`,
                backgroundColor: `${tierConfig.color}15`
              }}
            >
              <i className="fas fa-chart-simple"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5">
                {t('Squad Dynamics', 'Kader-Dynamik')}
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
                {t('Squad OVR Dynamics', 'Kader GES-Dynamik')}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close modal" 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.08] cursor-pointer"
          >
            <i className="fas fa-xmark text-xs"></i>
          </button>
        </div>
        
        {/* Content Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
          {/* Comparison Cards */}
          <div className="flex items-center gap-3">
            <div className="bg-white/[0.03] backdrop-blur-md p-4 rounded-2xl border border-white/[0.06] flex-1 text-center">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mb-1">
                {t('Start of Season', 'Saisonstart')}
              </div>
              <div className="text-3xl font-bold text-zinc-300 tabular-nums leading-none">
                {startOvr}
              </div>
            </div>

            <div className="text-zinc-500 text-xs flex items-center justify-center">
              <i className="fas fa-arrow-right"></i>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-md p-4 rounded-2xl border border-white/[0.06] flex-1 text-center relative overflow-hidden">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mb-1">
                {t('Current OVR', 'Aktuelle GES')}
              </div>
              <div className={`text-3xl font-bold flex items-center justify-center gap-2 leading-none tabular-nums ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-white'}`}>
                <span>{baseOvr}</span>
                {diff !== 0 && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums ${diff > 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/15 text-rose-300 border border-rose-400/30'}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* League Competitiveness Card with Four-Tier Rating Classification */}
          <div className="bg-white/[0.03] backdrop-blur-md p-5 rounded-2xl border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                <i className="fas fa-scale-unbalanced text-sky-400"></i>
                <span>{t('League Competitiveness', 'Liga-Konkurrenz')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-white bg-white/[0.04] px-2.5 py-1 rounded-xl border border-white/[0.08]">
                  {leagueInfo?.name}
                </div>
                {/* 4-Tier Rating Classification Badge */}
                <div
                  className="text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm"
                  style={{
                    color: tierConfig.color,
                    borderColor: `${tierConfig.color}40`,
                    backgroundColor: `${tierConfig.color}15`
                  }}
                >
                  <i className={`fas ${tierConfig.icon} text-[10px]`}></i>
                  <span>{tierConfig.label}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-zinc-300 tabular-nums">{avgOvr}</span>
              </div>
              <div className="flex-1">
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-full" style={{ width: `${(avgOvr / 100) * 100}%` }}></div>
                  <div
                    className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(baseOvr / 100) * 100}%`,
                      backgroundColor: tierConfig.color,
                      boxShadow: `0 0 10px ${tierConfig.color}50`
                    }}
                  ></div>
                </div>
                <div className="text-[10px] font-medium text-zinc-400 mt-2 flex justify-between tabular-nums">
                  <span>0</span>
                  <span className="text-zinc-300">{t('Avg', 'Schnitt')} ({avgOvr})</span>
                  <span>100</span>
                </div>
              </div>
            </div>
            
            {/* Four-Tier Rating Assessment Card */}
            <div
              className="mt-4 p-3.5 rounded-xl border text-xs leading-relaxed transition-all"
              style={{
                backgroundColor: `${tierConfig.color}0d`,
                borderColor: `${tierConfig.color}30`
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5"
                  style={{ color: tierConfig.color }}
                >
                  <i className={`fas ${tierConfig.icon}`}></i>
                  <span>{tierConfig.label}</span>
                </span>
                <span
                  className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md border tabular-nums"
                  style={{
                    color: tierConfig.color,
                    borderColor: `${tierConfig.color}30`,
                    backgroundColor: `${tierConfig.color}15`
                  }}
                >
                  {tierConfig.deltaText} vs benchmark
                </span>
              </div>
              <p className="text-zinc-300 text-xs leading-snug">
                {tierConfig.description}
              </p>

              {/* 4-Tier Rating Segment Gauge */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] grid grid-cols-4 gap-1.5 text-[9px] font-semibold text-center">
                <div
                  className={`py-1 px-1 rounded-lg border transition ${
                    tierConfig.tier === 'relegation_risk'
                      ? 'border-[#ef4444] bg-[#ef4444]/20 text-[#ef4444] font-bold ring-1 ring-[#ef4444]/40'
                      : 'border-white/[0.06] bg-white/[0.02] text-zinc-500'
                  }`}
                >
                  <span>Red (Relegation)</span>
                </div>
                <div
                  className={`py-1 px-1 rounded-lg border transition ${
                    tierConfig.tier === 'low_table_risk'
                      ? 'border-[#f97316] bg-[#f97316]/20 text-[#f97316] font-bold ring-1 ring-[#f97316]/40'
                      : 'border-white/[0.06] bg-white/[0.02] text-zinc-500'
                  }`}
                >
                  <span>Orange (Low Risk)</span>
                </div>
                <div
                  className={`py-1 px-1 rounded-lg border transition ${
                    tierConfig.tier === 'mid_table'
                      ? 'border-[#f4f4f5] bg-[#f4f4f5]/20 text-[#f4f4f5] font-bold ring-1 ring-[#f4f4f5]/40'
                      : 'border-white/[0.06] bg-white/[0.02] text-zinc-500'
                  }`}
                >
                  <span>White (Mid-Table)</span>
                </div>
                <div
                  className={`py-1 px-1 rounded-lg border transition ${
                    tierConfig.tier === 'championship'
                      ? 'border-[#10b981] bg-[#10b981]/20 text-[#10b981] font-bold ring-1 ring-[#10b981]/40'
                      : 'border-white/[0.06] bg-white/[0.02] text-zinc-500'
                  }`}
                >
                  <span>Green (Title)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coach & Loan Modifier Bento */}
          <div className="bg-white/[0.03] backdrop-blur-md p-4 rounded-2xl border border-white/[0.06] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mb-0.5">
                  {t('Head Coach Impact', 'Trainer-Einfluss')}
                </div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <i className="fas fa-user-tie text-sky-400 text-xs"></i> 
                  <span>{state.currentCoach?.name || t('Interim Caretakers (No Coach)', 'Interims-Betreuung (Kein Trainer)')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`text-xl font-bold tabular-nums ${coachBoost > 0 ? 'text-emerald-400' : coachBoost < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                  {coachBoost > 0 ? `+${coachBoost}` : coachBoost}
                </div>
                <div className="text-[10px] font-semibold text-zinc-500 uppercase">OVR</div>
              </div>
            </div>

            {state.activeLoanOvrBoost ? (
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mb-0.5">
                    {t('Temporary Loan Impacts', 'Temporäre Leih-Effekte')}
                  </div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <i className="fas fa-arrow-right-arrow-left text-sky-400 text-xs"></i> 
                    <span>{t('Active Loans', 'Aktive Leihen')}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">{t('Expires at end of season', 'Läuft am Saisonende aus')}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`text-xl font-bold tabular-nums ${state.activeLoanOvrBoost > 0 ? 'text-emerald-400' : state.activeLoanOvrBoost < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                    {state.activeLoanOvrBoost > 0 ? `+${state.activeLoanOvrBoost}` : state.activeLoanOvrBoost}
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase">OVR</div>
                </div>
              </div>
            ) : null}

            {state.veteranRingerActive ? (
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-amber-400 mb-0.5">
                    {t('Veteran Ringer Signing', 'Altstar-Verpflichtung')}
                  </div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <i className="fa-solid fa-fire-flame-curved text-amber-400 text-xs"></i> 
                    <span>{state.veteranRingerName || t('Ex-Top-Flight Legend', 'Ex-Erstliga-Ikone')}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">{t('Included in Base OVR · Retires at end of season', 'In Basis-GES enthalten · Karriereende nach der Saison')}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-xl font-bold tabular-nums text-emerald-400">
                    +{state.veteranRingerOvrGain || 5}
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase">OVR</div>
                </div>
              </div>
            ) : null}

            {state.stadiumPolicy === 'ultras' ? (
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-amber-400 mb-0.5">
                    {t('Stadium Strategy Bonus', 'Stadion-Strategie-Bonus')}
                  </div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <i className="fa-solid fa-fire text-amber-400 text-xs"></i> 
                    <span>{t('Fortress Curva (Ultras)', 'Festung Fankurve (Ultras)')}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">{t('Terrace roar & standing section backing', 'Stehplatz-Atmosphäre & Hexenkessel')}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-xl font-bold tabular-nums text-emerald-400">
                    +1
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase">OVR</div>
                </div>
              </div>
            ) : null}

            {/* Tactical Philosophy & Synergy */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-0.5">
                  {t('Tactical Philosophy Synergy', 'Taktische Philosophie & Synergie')}
                </div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <i className="fa-solid fa-chess text-sky-400 text-xs"></i> 
                  <span>{state.tactic || 'Total Football'}</span>
                  {state.currentCoach && (
                    <span className="text-[11px] text-zinc-400 font-normal">
                      · {state.currentCoach.style}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {hasSynergy 
                    ? t(`Coach style matches tactical philosophy (+${synergyGain} synergy)`, `Trainer-Stil passt zur Spielphilosophie (+${synergyGain} Synergie)`)
                    : state.currentCoach 
                    ? t('No synergy: Hire matching coach style in Job Market for +2 OVR', 'Keine Synergie: Passenden Trainer für +2 GES verpflichten')
                    : t('No coach appointed for tactical synergy', 'Kein Trainer für taktische Synergie eingesetzt')}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`text-xl font-bold tabular-nums ${hasSynergy ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {hasSynergy ? `+${synergyGain}` : '0'}
                </div>
                <div className="text-[10px] font-semibold text-zinc-500 uppercase">OVR</div>
              </div>
            </div>

            {/* Tactical Philosophy Specific Perk */}
            {tacticBonus !== 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-0.5">
                    {t('Philosophy Matchday Perk', 'Spielphilosophie-Perk')}
                  </div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <i className="fa-solid fa-bolt text-sky-400 text-xs"></i>
                    <span>{state.tactic || 'Total Football'}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {tacticInfo?.ovrBonusType === 'underdog'
                      ? t('Giant-Killer boost (+3 OVR vs superior league average)', 'Underdog-Bonus (+3 GES gegen überlegenen Ligaschnitt)')
                      : tacticInfo?.ovrBonusType === 'dominance' && tacticBonus > 0
                      ? t('Dominance boost (+2 OVR vs weaker opposition)', 'Dominanz-Bonus (+2 GES gegen schwächere Klubs)')
                      : tacticInfo?.ovrBonusType === 'dominance' && tacticBonus < 0
                      ? t('Squad lacks technical quality for system (-1 OVR under 60)', 'Kader fehlt technische Reife (-1 GES unter 60)')
                      : tacticInfo?.ovrBonusType === 'home'
                      ? t('Total Football home pitch boost (+1.5 OVR)', 'Total Football Heimstärke (+1.5 GES)')
                      : t('Direct Counter away match efficiency (+1.5 OVR)', 'Direct Counter Auswärtsstärke (+1.5 GES)')}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`text-xl font-bold tabular-nums ${tacticBonus > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tacticBonus > 0 ? `+${tacticBonus}` : tacticBonus}
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase">OVR</div>
                </div>
              </div>
            )}

            {/* Tactical Staleness (Obsolescence) Penalty */}
            {isStale && (
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rose-300 mb-0.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-triangle-exclamation text-rose-400 text-xs animate-bounce"></i>
                    <span>{t('Tactical Staleness Penalty (Decoded)', 'Taktische Entschlüsselung (Decoded)')}</span>
                  </div>
                  <div className="text-xs font-semibold text-rose-200">
                    {state.tactic} {t('system has been solved by opponents', 'vom Gegner vollständig entschlüsselt')}
                  </div>
                  <div className="text-[10px] text-zinc-300 mt-0.5">
                    {t('Full -4 OVR penalty in matches. Adapt philosophy in Coach Room for 5 DP to clear.', 'Vollständige -4 GES Strafe. Wechsle Philosophie im Trainer-Büro für 5 DP zum Löschen.')}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <div className="text-xl font-black tabular-nums text-rose-400">
                    -{stalePenalty}
                  </div>
                  <div className="text-[10px] font-bold text-rose-300 uppercase">OVR</div>
                </div>
              </div>
            )}

            {/* Tactical Surveillance Notice */}
            {!isStale && isSurveillance && (
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-amber-400 mb-0.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-crosshairs text-amber-400 text-xs"></i>
                    <span>{t('Tactical Surveillance Notice', 'Taktische Beobachtung')}</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-200">
                    {state.tactic} ({state.consecutiveTitlesWithSameTactic}x {t('Consecutive Champions', 'Serientitel')})
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {t('Opponents are studying video. Winning again locks in -4 OVR staleness.', 'Gegner studieren Videoaufnahmen. Ein weiterer Titel führt zu -4 GES.')}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                    {t('At Risk', 'Gefährdet')}
                  </span>
                </div>
              </div>
            )}

            {/* Matchday Tactical Net Modifier */}
            {(hasSynergy || isStale || hasMastermind || coachTraitMod !== 0 || caretakerPenalty !== 0 || bounceMod !== 0 || tenureMod !== 0 || moraleMod !== 0 || ultrasMod !== 0 || leagueMetaMod !== 0 || tacticBonus !== 0) && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs mt-1 ${
                tacticalNetMod > 0 ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200' :
                tacticalNetMod < 0 ? 'bg-rose-500/10 border-rose-500/25 text-rose-200' :
                'bg-white/[0.03] border-white/[0.06] text-zinc-300'
              }`}>
                <span className="font-semibold flex items-center gap-1.5">
                  <i className="fa-solid fa-shield-halved text-xs"></i>
                  <span>{t('Matchday Tactical Simulation Impact:', 'Matchday Taktik-Modifikator:')}</span>
                </span>
                <div className="text-right">
                  <span className="font-bold tabular-nums">
                    {tacticalNetMod > 0 ? `+${tacticalNetMod}` : tacticalNetMod} OVR
                  </span>
                  <span className="block text-[10px] opacity-80 font-mono tabular-nums">
                    {t('Effective Matchday OVR:', 'Effektive Spieltags-GES:')} {effectiveMatchdayOvr}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};
