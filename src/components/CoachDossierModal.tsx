import React from 'react';
import { motion } from 'motion/react';
import { Coach } from '../types';
import { formatMoney, TACTICS, isTacticalSynergy } from '../data/gameConstants';
import { 
  getCoachTraitInfo, 
  getCoachWeaknessInfo, 
  ensureCoachHiddenAttributes, 
  getCoachArchetypeConfig 
} from '../engine/coachEngine';

interface CoachDossierModalProps {
  coach: Coach;
  lang: 'en' | 'de';
  clubTactic?: string;
  isCurrentCoach?: boolean;
  coachTenure?: number;
  hasNewManagerBounce?: boolean;
  canHire?: boolean;
  hireDisabledReason?: string;
  onHire?: (coach: Coach) => void;
  onFire?: () => void;
  onRenew?: () => void;
  onSelectInOnboarding?: (coach: Coach) => void;
  onClose: () => void;
}

export const CoachDossierModal: React.FC<CoachDossierModalProps> = ({
  coach,
  lang,
  clubTactic,
  isCurrentCoach = false,
  coachTenure,
  hasNewManagerBounce,
  canHire = true,
  hireDisabledReason,
  onHire,
  onFire,
  onRenew,
  onSelectInOnboarding,
  onClose,
}) => {
  const isDe = lang === 'de';
  const hiddenAttrs = ensureCoachHiddenAttributes(coach);
  const archConfig = getCoachArchetypeConfig(coach.coachArchetype || coach.archetype);
  const traitInfo = getCoachTraitInfo(coach.strength);
  const weakInfo = getCoachWeaknessInfo(coach.weakness);
  const hasSynergy = clubTactic ? isTacticalSynergy(coach.style, clubTactic) : false;

  const getAttrTier = (val: number) => {
    if (val >= 18) return { label: isDe ? 'Weltklasse' : 'World Class', color: 'text-amber-300' };
    if (val >= 15) return { label: isDe ? 'Exzellent' : 'Exceptional', color: 'text-sky-300' };
    if (val >= 11) return { label: isDe ? 'Solide' : 'Proficient', color: 'text-zinc-400' };
    return { label: isDe ? 'Verletzlich' : 'Vulnerable', color: 'text-rose-400' };
  };

  const getAttrBarGradient = (val: number) => {
    if (val >= 18) return 'from-amber-400 via-amber-300 to-yellow-200';
    if (val >= 15) return 'from-sky-500 via-sky-400 to-cyan-300';
    if (val >= 11) return 'from-zinc-500 to-zinc-400';
    return 'from-rose-600 to-rose-400';
  };

  const attributesList = [
    {
      key: 'tacticalFlexibility',
      name: isDe ? 'Taktische Flexibilität' : 'Tactical Flexibility',
      val: hiddenAttrs.tacticalFlexibility,
      desc: isDe 
        ? 'In-Game Umstellungen, Anpassung an Systembrüche & Rückstand-Aufholjagden.' 
        : 'In-match adjustments, exploiting opposition traps & deficit comebacks.',
      icon: 'fa-chess-knight'
    },
    {
      key: 'manManagement',
      name: isDe ? 'Menschenführung & Kabine' : 'Man-Management',
      val: hiddenAttrs.manManagement,
      desc: isDe 
        ? 'Ego-Balance bei Stars, Verhinderung von Meutereien & Moralschutz in Krisen.' 
        : 'Ego management, locker room harmony & preventing dressing room mutinies.',
      icon: 'fa-handshake'
    },
    {
      key: 'motivationalDrive',
      name: isDe ? 'Motivationskraft & Mentalität' : 'Motivational Drive',
      val: hiddenAttrs.motivationalDrive,
      desc: isDe 
        ? 'Underdog-Feuer, Siegeswille in Pokalkrimis & Comeback-Dynamik.' 
        : 'Underdog intensity, big-match clutch mentality & late fightbacks.',
      icon: 'fa-fire'
    },
    {
      key: 'youthNurturing',
      name: isDe ? 'Nachwuchsförderung' : 'Youth Nurturing',
      val: hiddenAttrs.youthNurturing,
      desc: isDe 
        ? 'Entwicklung von Akademie-Talenten, Geduld mit Teenagern & Wonderkid-Schub.' 
        : 'Accelerating wonderkid development, academy integration & talent breakthrough.',
      icon: 'fa-seedling'
    },
    {
      key: 'discipline',
      name: isDe ? 'Disziplin & Kompaktheit' : 'Discipline & Structure',
      val: hiddenAttrs.discipline,
      desc: isDe 
        ? 'Defensive Grundordnung, Verhinderung von Konzentrationsfehlern & Zweikampfhärte.' 
        : 'Defensive organization, tactical shape adherence & avoiding card trouble.',
      icon: 'fa-shield-halved'
    },
    {
      key: 'boardAlignment',
      name: isDe ? 'Vorstandsharmonie' : 'Board Alignment',
      val: hiddenAttrs.boardAlignment,
      desc: isDe 
        ? 'Loyalität gegenüber der Sportdirektor-Strategie; keine Medien-Eskalationen.' 
        : 'Harmony with Sporting Director transfer strategy & zero press drama.',
      icon: 'fa-building-columns'
    }
  ];

  // Isolate Escape key so closing coach dossier does not close parent CoachMarketModal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-2.5 sm:p-5 overflow-y-auto overscroll-contain"
    >
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-xl" 
        onClick={onClose} 
      />

      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-[#14151b] border border-white/[0.12] rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.1)] overflow-hidden my-auto max-h-[92vh] sm:max-h-[88vh] flex flex-col min-h-0 shrink-0 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-sky-500/10 via-sky-500/5 to-transparent pointer-events-none" />

        {/* Header Bar */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/[0.08] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-sky-400 text-xl shadow-inner shrink-0">
              <i className={`fa-solid ${archConfig.icon}`}></i>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap text-xs text-zinc-400">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-400">
                  {isDe ? 'Vertrauliches Trainer-Dossier' : 'Director Scouting Dossier'}
                </span>
                <span>·</span>
                <span className="text-zinc-300 font-medium flex items-center gap-1">
                  <i className={`fa-solid ${archConfig.icon} text-[10px] text-sky-400`}></i>
                  <span>{isDe ? archConfig.labelDe : archConfig.labelEn}</span>
                </span>
                {isCurrentCoach && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <i className="fa-solid fa-check text-[10px]"></i>
                      <span>{isDe ? 'Amtsinhaber' : 'Current Coach'}</span>
                    </span>
                    <span>·</span>
                    <span className="text-zinc-300 font-medium">
                      {isDe ? `Jahre im Verein: ${coachTenure || 0}` : `Years at Club: ${coachTenure || 0}`}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {coach.name}
                {coach.nationality && (
                  <span className="text-xs font-normal text-zinc-400">
                    ({coach.nationality})
                  </span>
                )}
              </h2>

              {/* Stale Voice / Bounce Badges */}
              {isCurrentCoach && ((coachTenure || 0) >= 3 || hasNewManagerBounce) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(coachTenure || 0) >= 3 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                      <i className="fa-solid fa-triangle-exclamation text-rose-400 text-xs"></i>
                      <span>{isDe ? 'Abnutzungseffekt: Die Mannschaft hört nicht mehr auf den Trainer.' : 'Stale Voice: Squad is tuning out the manager.'}</span>
                      {coach.strength === 'Continental Legend' ? (
                        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                          {isDe ? 'Legende Immun' : 'Legend Immune'}
                        </span>
                      ) : (
                        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-rose-500/30 text-rose-200 text-[10px] font-bold uppercase tracking-wider">
                          -1 OVR
                        </span>
                      )}
                    </div>
                  )}

                  {hasNewManagerBounce && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <i className="fa-solid fa-sparkles text-emerald-400 text-xs"></i>
                      <span>{isDe ? 'Trainereffekt aktiv (+2 GES Flitterwochen)' : 'New Manager Bounce Active (+2 OVR Honeymoon)'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">

          {/* Quick Metrics Capsule Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                {isDe ? 'Taktik-Stil' : 'Tactical Style'}
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white truncate">
                <i className={`fas ${TACTICS[coach.style]?.icon || 'fa-chess-board'} text-sky-400`}></i>
                <span className="truncate">{coach.style}</span>
              </div>
              {hasSynergy && (
                <div className="mt-1 text-[9px] text-sky-300 font-medium flex items-center gap-1">
                  <i className="fa-solid fa-circle-check text-[8px]"></i>
                  {isDe ? 'Perfekte Synergie' : 'System Synergy'}
                </div>
              )}
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                {isDe ? 'Taktik-Einfluss' : 'Tactical Impact'}
              </div>
              <div className={`text-sm sm:text-base font-bold ${coach.ovrBoost >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {coach.ovrBoost >= 0 ? `+${coach.ovrBoost}` : coach.ovrBoost} OVR
              </div>
              <div className="text-[9px] text-zinc-500">
                {isDe ? 'Direkter Team-Boost' : 'Squad rating modifier'}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                {isDe ? 'Erfolgsquote' : 'Career Win Rate'}
              </div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <i className="fa-solid fa-trophy text-amber-400 text-xs"></i>
                <span>{coach.winRate ?? 45}%</span>
              </div>
              <div className="text-[9px] text-zinc-400">
                {coach.trophyPedigree ? `${coach.trophyPedigree} ${isDe ? 'Titel errungen' : 'Honours won'}` : (isDe ? 'Solider Ligarekord' : 'Solid track record')}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                {isDe ? 'Gehalt / Vertrag' : 'Annual Salary'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {formatMoney(coach.cost)} / {isDe ? 'Jahr' : 'yr'}
              </div>
              <div className="text-[9px] text-zinc-400">
                {coach.contractYearsLeft ?? coach.contractLength ?? 1} {isDe ? 'Jahre Vertrag' : 'Year Deal'}
              </div>
            </div>
          </div>

          {/* Manager Persona & Biography */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <i className="fa-solid fa-feather text-sky-400 text-xs"></i>
              <span>{isDe ? 'Trainer-Philosophie & Profil' : 'Managerial Philosophy & Bio'}</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal italic">
              "{coach.bio || archConfig.bioTemplatesEn[0]}"
            </p>
            {coach.preferredFormation && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-zinc-400">{isDe ? 'Bevorzugtes System:' : 'Preferred System:'}</span>
                <span className="text-white font-semibold bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                  {coach.preferredFormation}
                </span>
              </div>
            )}
          </div>

          {/* Hidden Attributes Section (FM / Apple Health style 1-20 bars) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-fingerprint text-sky-400 text-xs"></i>
                  <span>{isDe ? 'Verborgene Trainer-Attribute (1-20)' : 'Hidden Managerial Attributes (1-20 Scale)'}</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {isDe 
                    ? 'Vertrauliche Beobachtungswerte der sportlichen Leitung über Charakter und Match-IQ.'
                    : 'Confidential board assessment measuring in-game composure, tactical IQ, and personality.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attributesList.map((attr) => {
                const tier = getAttrTier(attr.val);
                const percent = Math.min(100, Math.max(5, (attr.val / 20) * 100));

                return (
                  <div 
                    key={attr.key}
                    className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl p-3.5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid ${attr.icon} text-zinc-400 text-xs`}></i>
                        <span className="text-xs font-semibold text-white">{attr.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <span className={`text-[11px] font-semibold ${tier.color}`}>
                          {tier.label}
                        </span>
                        <span className="text-zinc-600 text-xs">·</span>
                        <span className="text-sm font-bold text-white min-w-[20px] text-right">
                          {attr.val}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-normal">/20</span>
                      </div>
                    </div>

                    {/* Attribute Bar */}
                    <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden p-0.5 border border-white/[0.04] mb-2">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${getAttrBarGradient(attr.val)} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-zinc-400 leading-normal font-normal">
                      {attr.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signature Trait & Weakness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Trait */}
            <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl p-3.5">
              <div className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider mb-1 flex items-center gap-1.5">
                <i className={`fa-solid ${traitInfo.icon || 'fa-star'}`}></i>
                <span>{isDe ? 'Charakter-Stärke' : 'Signature Trait'}</span>
              </div>
              <div className="text-sm font-bold text-emerald-200 mb-1">
                {traitInfo.name}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {traitInfo.desc}
              </p>
            </div>

            {/* Weakness */}
            <div className="bg-rose-500/[0.06] border border-rose-500/20 rounded-2xl p-3.5">
              <div className="text-[10px] uppercase font-semibold text-rose-400 tracking-wider mb-1 flex items-center gap-1.5">
                <i className={`fa-solid ${weakInfo.icon || 'fa-triangle-exclamation'}`}></i>
                <span>{isDe ? 'Bekannte Schwachstelle' : 'Known Risk Factor'}</span>
              </div>
              <div className="text-sm font-bold text-rose-200 mb-1">
                {weakInfo.name}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {weakInfo.desc}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-semibold transition border border-white/[0.08] active:scale-95 cursor-pointer"
          >
            {isDe ? 'Schließen' : 'Close Dossier'}
          </button>

          {/* Onboarding Mode Action */}
          {onSelectInOnboarding && (
            <button
              type="button"
              onClick={() => {
                onSelectInOnboarding(coach);
                onClose();
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-check text-xs"></i>
              <span>{isDe ? 'Diesen Trainer ernennen' : 'Appoint This Coach'}</span>
            </button>
          )}

          {/* Market Mode Action */}
          {onHire && !isCurrentCoach && (
            <div className="flex items-center gap-2">
              {!canHire && hireDisabledReason && (
                <span className="text-[11px] text-rose-400 font-medium">
                  {hireDisabledReason}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  onHire(coach);
                  onClose();
                }}
                disabled={!canHire}
                className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 ${
                  canHire
                    ? 'bg-sky-500 hover:bg-sky-400 text-white active:scale-95'
                    : 'bg-white/[0.06] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                }`}
              >
                <i className="fa-solid fa-user-plus text-xs"></i>
                <span>{isDe ? 'Cheftrainer verpflichten' : 'Hire Head Coach'}</span>
              </button>
            </div>
          )}

          {/* Current Coach Actions */}
          {isCurrentCoach && (
            <div className="flex items-center gap-2">
              {onRenew && (
                <button
                  type="button"
                  onClick={() => {
                    onRenew();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-400/30 transition cursor-pointer"
                >
                  <i className="fa-solid fa-file-signature mr-1.5"></i>
                  {isDe ? 'Vertrag verlängern' : 'Extend Contract'}
                </button>
              )}
              {onFire && (
                <button
                  type="button"
                  onClick={() => {
                    onFire();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-400/30 transition cursor-pointer"
                >
                  <i className="fa-solid fa-user-xmark mr-1.5"></i>
                  {isDe ? 'Freistellen' : 'Sack Coach'}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
