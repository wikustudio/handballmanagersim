import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { t as tr } from '../data/translations';
import { formatMoney, getAcademyCallUpCap, getAcademyScoutCap, getLeagueScaledVal } from '../data/gameConstants';
import { YOUTH_ACADEMY_MILESTONES, MEDICAL_CENTER_MILESTONES } from '../engine/seasonSimEngine';

export interface FacilityModalProps {
  type: 'academy' | 'medical';
  state: GameState;
  lang: Language;
  cost: number;
  onClose: () => void;
  onConfirm: () => void;
  onDowngrade?: () => void;
  canAfford: boolean;
}

export const FacilityModal: React.FC<FacilityModalProps> = ({
  type,
  state,
  lang,
  cost,
  onClose,
  onConfirm,
  onDowngrade,
  canAfford,
}) => {
  const isDe = lang === 'de';
  const t = (en: string, de?: string) => tr(lang, en, de);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isAcademy = type === 'academy';
  const currentLevel = isAcademy
    ? Math.max(1, Math.min(5, state.club.academyLevel || 1))
    : Math.max(1, Math.min(5, state.club.medicalLevel || 1));
  const nextLevel = Math.min(5, currentLevel + 1);
  const isMax = currentLevel >= 5;
  const baseUpkeepUnit = getLeagueScaledVal(state.club.tier || 1, 250, state.club.country || 'GER');
  const heritageMult = state.clubIdentity === 'heritage' ? 0.8 : 1.0;
  const dialMult = isAcademy ? 1 + Math.max(0, Math.min(50, state.academyScoutingDial ?? 0)) / 100 : 1.0;
  const currentUpkeep = Math.round(Math.floor(baseUpkeepUnit * Math.pow(1.5, currentLevel - 1) * dialMult) * heritageMult);
  const newUpkeep = Math.round(Math.floor(baseUpkeepUnit * Math.pow(1.5, nextLevel - 1) * dialMult) * heritageMult);
  const thisFacilityUpgraded = isAcademy
    ? (state.academyUpgradedThisSeason || 0) >= 1
    : (state.medicalUpgradedThisSeason || 0) >= 1;
  const totalProjects = Math.max(
    state.facilitiesUpgradedThisSeason || 0,
    (state.stadiumExpandedThisSeason || 0) +
      (state.academyUpgradedThisSeason || 0) +
      (state.medicalUpgradedThisSeason || 0)
  );
  const callUpCap = getAcademyCallUpCap(currentLevel);
  const scoutCap = getAcademyScoutCap(currentLevel);
  const milestones = isAcademy ? YOUTH_ACADEMY_MILESTONES : MEDICAL_CENTER_MILESTONES;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-2xl text-left cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[28px] sm:rounded-[32px] max-w-lg w-full shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden cursor-default"
      >
        {/* Subtle Ambient Accent Glow */}
        <div
          className={`absolute -top-24 -right-24 w-80 h-80 ${
            isAcademy ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          } rounded-full blur-3xl pointer-events-none`}
        />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center ${
                isAcademy ? 'text-emerald-400' : 'text-rose-400'
              } text-base shadow-inner shrink-0`}
            >
              <i className={`fas ${isAcademy ? 'fa-seedling' : 'fa-heart-pulse'}`}></i>
            </div>
            <div>
              <div
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isAcademy ? 'text-emerald-400/90' : 'text-rose-400/90'
                } mb-0.5`}
              >
                {isAcademy
                  ? t('Development Infrastructure', 'Jugend-Infrastruktur')
                  : t('Sports Science & Longevity', 'Medizinische Abteilung')}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                {isAcademy
                  ? t('Youth Academy Milestones', 'Jugendakademie-Stufenplan')
                  : t('Medical Center Milestones', 'Medizinzentrum-Stufenplan')}
              </h2>
            </div>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.08] cursor-pointer shrink-0"
          >
            <i className="fas fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
          {/* Active Telemetry Summary Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {t('Current Tier', 'Aktuelle Stufe')}
              </div>
              <div
                className={`text-base sm:text-lg font-extrabold tracking-tight tabular-nums leading-none ${
                  isAcademy ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                Level {currentLevel}/5
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {isAcademy
                  ? t('Scouts & Call-Ups', 'Scouts & Berufung')
                  : t('Injury Rehab', 'Notfall-Reha')}
              </div>
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-white tabular-nums leading-none">
                {isAcademy
                  ? `${scoutCap} / ${callUpCap} yr`
                  : currentLevel >= 5
                  ? formatMoney(0, state.club.country)
                  : currentLevel >= 2
                  ? '-50%'
                  : '100%'}
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {isAcademy ? t('Milestone Perk', 'Aktiver Bonus') : t('Wear Protection', 'Verschleiß-Schutz')}
              </div>
              <div className="text-xs font-bold tracking-tight text-zinc-200 tabular-nums leading-tight truncate">
                {isAcademy
                  ? currentLevel >= 5
                    ? `${formatMoney(getLeagueScaledVal(state.club.tier || 1, 1500, state.club.country || 'GER'), state.club.country)}/${t('yr Dividend', 'J Dividende')}`
                    : currentLevel >= 4
                    ? t('15% Wonderkid', '15% Wunderkind')
                    : currentLevel >= 3
                    ? t('+1 OVR Call-Up', '+1 GES Berufung')
                    : currentLevel >= 2
                    ? t('Poach Shield', 'Abwerbe-Schutz')
                    : t('Base Pipeline', 'Basis-Scouting')
                  : currentLevel >= 5
                  ? t('100% Immune', '100% Immun')
                  : currentLevel >= 4
                  ? t('80% Decay Shield', '80% Schutz')
                  : currentLevel >= 3
                  ? t('Wear Shield', 'Verschleiß-Schutz')
                  : t('Standard Care', 'Basis-Pflege')}
              </div>
            </div>
          </div>

          {/* 5-Level Milestone Roadmap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {t('Facility Progression (Levels 1–5)', 'Infrastruktur-Meilensteine (Stufe 1–5)')}
              </span>
              <span className="text-[10px] font-semibold text-zinc-500 tabular-nums">
                {currentLevel} / 5 {t('Unlocked', 'Freigeschaltet')}
              </span>
            </div>

            <div className="space-y-2">
              {milestones.map((m) => {
                const isUnlocked = currentLevel >= m.level;
                const isCurrent = currentLevel === m.level;
                const isNext = !isMax && nextLevel === m.level;

                return (
                  <div
                    key={m.level}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isCurrent
                        ? isAcademy
                          ? 'bg-emerald-500/[0.07] border-emerald-500/40'
                          : 'bg-rose-500/[0.07] border-rose-500/40'
                        : isNext
                        ? 'bg-white/[0.04] border-amber-400/35'
                        : isUnlocked
                        ? 'bg-white/[0.02] border-white/[0.08]'
                        : 'bg-white/[0.01] border-white/[0.04] opacity-55'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg text-[11px] font-extrabold tracking-tight tabular-nums flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? isAcademy
                                ? 'bg-emerald-500 text-zinc-950'
                                : 'bg-rose-500 text-white'
                              : isUnlocked
                              ? 'bg-white/[0.08] text-zinc-200'
                              : isNext
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                              : 'bg-white/[0.04] text-zinc-500'
                          }`}
                        >
                          {m.level}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                          {isDe ? m.titleDe : m.titleEn}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] tracking-tight tabular-nums shrink-0">
                        <span
                          className={
                            isCurrent
                              ? isAcademy
                                ? 'text-emerald-300 font-semibold'
                                : 'text-rose-300 font-semibold'
                              : isNext
                              ? 'text-amber-300 font-semibold'
                              : 'text-zinc-400 font-medium'
                          }
                        >
                          {isDe ? m.badgeDe : m.badgeEn}
                        </span>
                        {isCurrent && (
                          <>
                            <span className="text-zinc-600" aria-hidden="true">·</span>
                            <span className={isAcademy ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {t('Active', 'Aktiv')}
                            </span>
                          </>
                        )}
                        {isNext && (
                          <>
                            <span className="text-zinc-600" aria-hidden="true">·</span>
                            <span className="text-amber-400 font-bold">
                              {t('Next', 'Nächste')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 pl-8.5 leading-relaxed tabular-nums">
                      {isDe ? m.perkDe : m.perkEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial & Upkeep Summary Bento */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                {t('Facility Tier Progression', 'Ausbaustufe')}
              </span>
              <div className="flex items-center gap-1.5 tracking-tight tabular-nums">
                <span className="font-bold text-zinc-300">Level {currentLevel}</span>
                {isMax ? (
                  <>
                    <span className="text-zinc-600" aria-hidden="true">·</span>
                    <span className="text-amber-400 font-bold">{t('Max Tier', 'Maximum')}</span>
                  </>
                ) : (
                  <>
                    <span className="text-zinc-600">→</span>
                    <span className={`font-bold ${isAcademy ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Level {nextLevel}
                    </span>
                  </>
                )}
              </div>
            </div>

            {!isMax && (
              <div className="flex justify-between items-center pt-2 border-t border-white/[0.04] text-xs">
                <span className="text-zinc-400">{t('Upgrade Cost', 'Baukosten')}</span>
                <span className="font-extrabold text-white text-sm tracking-tight tabular-nums">
                  {formatMoney(cost)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-white/[0.04] text-xs">
              <span className="text-zinc-400">{t('Annual Upkeep', 'Jährliche Betriebskosten')}</span>
              <div className="text-right tracking-tight tabular-nums">
                {isMax ? (
                  <span className="font-bold text-zinc-200">{formatMoney(currentUpkeep)}/yr</span>
                ) : (
                  <>
                    <span className="font-bold text-rose-400">{formatMoney(newUpkeep)}/yr</span>
                    <span className="text-[10px] text-zinc-500 line-through ml-1.5 font-normal">
                      {formatMoney(currentUpkeep)}/yr
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Construction Limit Notice */}
          <div className="bg-amber-500/[0.04] border border-amber-400/20 rounded-2xl p-3 flex gap-2.5 items-center">
            <i className="fas fa-triangle-exclamation text-amber-400 shrink-0 text-xs"></i>
            <p className="text-[11px] text-amber-200/90 leading-tight font-normal">
              {t(
                `Construction Limit: Max 1 upgrade per facility per season (${totalProjects}/2 total club projects used).`,
                `Baugrenze: Max. 1 Ausbau pro Anlage pro Saison (${totalProjects}/2 Vereinsprojekte genutzt).`
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] flex flex-col gap-2 shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={onConfirm}
              disabled={!canAfford || totalProjects >= 2 || thisFacilityUpgraded || isMax}
              className={`flex-1 py-3.5 px-5 rounded-2xl font-semibold text-xs tracking-wide transition shadow-sm ${
                isMax || totalProjects >= 2 || thisFacilityUpgraded
                  ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                  : !canAfford
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 cursor-not-allowed'
                  : isAcademy
                  ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-bold cursor-pointer'
                  : 'bg-rose-500 hover:bg-rose-400 active:scale-[0.98] text-white font-bold cursor-pointer'
              }`}
            >
              {isMax
                ? t('Maximum Level Reached (Lvl 5)', 'Maximalstufe erreicht (Stufe 5)')
                : thisFacilityUpgraded
                ? t('Already Upgraded This Season (1/1)', 'Diese Saison bereits ausgebaut (1/1)')
                : totalProjects >= 2
                ? t(`Construction Limit Reached (${totalProjects}/2)`, `Baugrenze erreicht (${totalProjects}/2)`)
                : !canAfford
                ? t('Insufficient Funds', 'Nicht genügend Budget')
                : t(`Authorize Level ${nextLevel} Upgrade (${formatMoney(cost)})`, `Stufe ${nextLevel} Ausbau (${formatMoney(cost)})`)}
            </button>

            <button
              aria-label="Close modal"
              onClick={onClose}
              className="py-3.5 px-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs transition border border-white/[0.08] cursor-pointer shrink-0"
            >
              {t('Close', 'Schließen')}
            </button>
          </div>

          {currentLevel > 1 && onDowngrade && (
            <button
              onClick={onDowngrade}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition border border-rose-500/20 cursor-pointer"
            >
              <i className="fas fa-arrow-down mr-1.5 text-[10px]"></i>
              {t('Downgrade & Scale Back Overhead', 'Abbauen & Betriebskosten senken')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
