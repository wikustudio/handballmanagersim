import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Club, Language, PressureChoice, PressureMoment } from '../types';
import { getPressureTier } from '../engine/pressureEngine';
import { useGameStore } from '../store/useGameStore';
import { resolveActiveSponsorBrands } from '../utils/sponsorBranding';
import { normalizeHex } from '../data/clubs';
import { useModalDismiss } from '../utils/modalUtils';
import { ClubLogo } from './ClubLogo';

interface PressureMomentModalProps {
  moment: PressureMoment;
  club: Club;
  lang: Language;
  onSelectChoice: (choiceId: PressureChoice['id']) => PressureMoment | void;
  onClose: () => void;
}

export const PressureMomentModal: React.FC<PressureMomentModalProps> = ({
  moment,
  club,
  lang,
  onSelectChoice,
  onClose,
}) => {
  const [resolvedMoment, setResolvedMoment] = useState<PressureMoment | null>(() =>
    moment.resolvedChoiceId ? moment : null
  );

  const storeSnapshot = useGameStore();
  const activeMoment = resolvedMoment || moment;
  const isResolved = Boolean(activeMoment.resolvedChoiceId);
  const canDismiss = isResolved || activeMoment.phase === 'briefing';
  const isHighHeat = activeMoment.mediaPressure >= 40;

  useModalDismiss(() => {
    if (canDismiss) onClose();
  }, true);

  const isDe = lang === 'de';
  const tierInfo = getPressureTier(activeMoment.mediaPressure);
  const clubPrimaryHex = normalizeHex(club?.color || '#1d4ed8', '1d4ed8');
  const clubSecondaryHex = normalizeHex(club?.color2 || '#ffffff', 'ffffff');

  const backdropWallTiles = useMemo(() => {
    const sponsors = resolveActiveSponsorBrands(storeSnapshot);
    const shortClub = (club?.name || 'CLUB')
      .replace(/^(THW|SG|SC|HC|HSG|MT|TBV|TV|TSV|VfL|FRISCH AUF!|Rhein-Neckar)\s+/i, '')
      .trim()
      .slice(0, 14)
      .toUpperCase();
    const pool =
      sponsors.length > 0
        ? [shortClub, ...sponsors.map((s) => s.name.toUpperCase())]
        : [shortClub, 'HANDBALL', activeMoment.outletName.slice(0, 14).toUpperCase()];
    const tiles: string[] = [];
    for (let i = 0; i < 12; i++) {
      tiles.push(pool[i % pool.length]);
    }
    return tiles;
  }, [storeSnapshot, club?.name, activeMoment.outletName]);

  const toneAccent = {
    emerald: {
      text: 'text-emerald-300',
      bar: 'bg-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
    sky: {
      text: 'text-sky-300',
      bar: 'bg-sky-400',
      border: 'border-sky-500/30',
      bg: 'bg-sky-500/10',
    },
    amber: {
      text: 'text-amber-300',
      bar: 'bg-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    orange: {
      text: 'text-orange-300',
      bar: 'bg-orange-400',
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/10',
    },
    rose: {
      text: 'text-rose-300',
      bar: 'bg-rose-400',
      border: 'border-rose-500/35',
      bg: 'bg-rose-500/10',
    },
  }[tierInfo.tone];

  const handleChoose = (choiceId: PressureChoice['id']) => {
    const result = onSelectChoice(choiceId);
    if (result) {
      setResolvedMoment(result);
    }
  };

  const formatDelta = (val: number, suffix: string = '') => {
    if (val === 0) return `±0${suffix}`;
    return `${val > 0 ? '+' : ''}${val}${suffix}`;
  };

  const stageLabel =
    activeMoment.phase === 'postseason'
      ? isDe
        ? `Saison ${activeMoment.year} · Saisonabschluss-Pressekonferenz`
        : `Season ${activeMoment.year} · Post-Season Press Conference`
      : activeMoment.phase === 'midseason'
      ? isDe
        ? `Saison ${activeMoment.year} · Live-Pressekonferenz`
        : `Season ${activeMoment.year} · Live Press Conference`
      : isHighHeat
      ? isDe
        ? `Saison ${activeMoment.year} · Angespannte Pressekonferenz`
        : `Season ${activeMoment.year} · Heated Press Conference`
      : isDe
      ? `Saison ${activeMoment.year} · Medien-Presseraum`
      : `Season ${activeMoment.year} · Club Press Conference`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => {
        if (canDismiss) onClose();
      }}
      className="fixed inset-0 z-[115] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ scale: 0.96, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 10, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        data-testid="press-conference-modal"
        className="w-full max-w-[720px] bg-[#12141c] rounded-[28px] border border-white/[0.1] shadow-[0_32px_100px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] relative cursor-default"
      >
        {/* Top Broadcast Bar (Single source of truth for Media Heat) */}
        <div
          data-broadcast-logo="true"
          className="w-full px-5 py-2.5 bg-[#0d0f16] border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0 text-[11px] text-zinc-300">
            <i className={`fas fa-microphone-lines text-xs ${toneAccent.text} shrink-0`} />
            <span className="font-semibold text-white truncate">{activeMoment.outletName}</span>
            <span aria-hidden="true" className="text-zinc-500">
              ·
            </span>
            <span className="text-zinc-300 truncate hidden sm:inline">
              {isDe ? 'Pressekonferenz' : 'Press Conference'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-white/[0.12] overflow-hidden hidden sm:block">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${toneAccent.bar}`}
                  style={{ width: `${Math.max(5, activeMoment.mediaPressure)}%` }}
                />
              </div>
              <span className={`text-[11px] font-semibold ${toneAccent.text} tabular-nums whitespace-nowrap`}>
                {isDe ? tierInfo.labelDe : tierInfo.label} · {activeMoment.mediaPressure}/100
              </span>
            </div>
            {canDismiss && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close press conference"
                className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-zinc-200 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <i className="fas fa-xmark text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Press Conference Stage Header: Step-and-Repeat Sponsor Wall + Broadcast Microphones */}
        <div
          data-broadcast-logo="true"
          className="relative overflow-hidden border-b border-white/[0.08] shrink-0"
          style={{
            background: `linear-gradient(180deg, ${clubPrimaryHex}45 0%, #131621 72%, #0e1018 100%)`,
          }}
        >
          {/* Step-and-repeat sponsor & club media wall */}
          <div
            aria-hidden="true"
            className="grid grid-cols-4 gap-2 px-5 pt-2.5 pb-1 opacity-[0.22] select-none pointer-events-none"
          >
            {backdropWallTiles.map((label, idx) => (
              <div
                key={idx}
                className="border border-white/15 rounded px-2 py-0.5 text-[9px] font-bold tracking-wider text-center text-white truncate"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Spotlight cones when media heat is building */}
          {isHighHeat && (
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.12), transparent 45%), radial-gradient(circle at 82% 0%, rgba(255,255,255,0.10), transparent 42%)',
              }}
            />
          )}

          {/* Main Podium Headline Lockup */}
          <div className="relative z-10 px-5 pt-2 pb-7 flex items-start gap-3.5">
            <ClubLogo
              club={club}
              clubId={club.id}
              name={club.name}
              logo={club.logo}
              fallbackLogo={club.fallbackLogo}
              color={club.color}
              color2={club.color2}
              className="w-11 h-11 rounded-xl object-contain shrink-0 mt-0.5 bg-black/25 p-1 border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-zinc-300">{stageLabel}</div>
              <h2 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug mt-0.5 text-balance">
                {isDe ? activeMoment.headlineDe : activeMoment.headline}
              </h2>
              <p className="text-xs text-zinc-300/90 leading-snug mt-1">
                {isDe ? activeMoment.subheadlineDe : activeMoment.subheadline}
              </p>
            </div>
          </div>

          {/* Press Desk Silhouette + Broadcast Microphones Cluster */}
          <svg
            viewBox="0 0 720 34"
            className="w-full h-[30px] block relative z-10 select-none pointer-events-none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Podium Desk Top */}
            <rect x="0" y="24" width="720" height="10" fill="#0b0d14" />
            <rect x="0" y="23" width="720" height="2" fill={clubSecondaryHex} fillOpacity="0.45" />
            {/* Broadcast Microphones & Network Cubes */}
            <g transform="translate(230, 2)">
              <line x1="18" y1="22" x2="24" y2="10" stroke="#64748b" strokeWidth="2" />
              <rect x="17" y="6" width="14" height="8" rx="2" fill="#dc2626" />
              <ellipse cx="25" cy="4" rx="4" ry="3" fill="#1e293b" />

              <line x1="58" y1="22" x2="56" y2="8" stroke="#64748b" strokeWidth="2" />
              <rect x="49" y="5" width="14" height="8" rx="2" fill="#0284c7" />
              <ellipse cx="56" cy="3" rx="4" ry="3" fill="#334155" />

              <line x1="96" y1="22" x2="96" y2="6" stroke="#94a3b8" strokeWidth="2.2" />
              <rect x="88" y="3" width="16" height="9" rx="2" fill={clubPrimaryHex} />
              <ellipse cx="96" cy="1.8" rx="4.5" ry="3" fill="#1e293b" />

              <line x1="136" y1="22" x2="138" y2="8" stroke="#64748b" strokeWidth="2" />
              <rect x="131" y="5" width="14" height="8" rx="2" fill="#d97706" />
              <ellipse cx="138" cy="3" rx="4" ry="3" fill="#334155" />

              <line x1="176" y1="22" x2="170" y2="10" stroke="#64748b" strokeWidth="2" />
              <rect x="163" y="6" width="14" height="8" rx="2" fill="#4f46e5" />
              <ellipse cx="169" cy="4" rx="4" ry="3" fill="#1e293b" />
            </g>
          </svg>
        </div>

        {/* Scrollable Press Room Content (Zero duplicate metrics) */}
        <div className="p-4 sm:px-5 sm:py-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* Non-Redundant 2-Column Podium Context: Standing vs Target + Leadership Scrutiny */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-5 bg-[#161922] border border-white/[0.07] rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                {isDe ? 'Tabellenstand vs. Ziel' : 'Standing vs Mandate'}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1 tabular-nums">
                <span className="text-xl font-bold text-white">#{activeMoment.currentPos}</span>
                <span className="text-xs text-zinc-400">/ {activeMoment.numTeams}</span>
                <span className="text-[11px] text-zinc-500 mx-1" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-zinc-300">
                  {isDe ? 'Ziel:' : 'Target:'} <strong>Top {activeMoment.targetPos}</strong>
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 tabular-nums">
                {activeMoment.shortfall > 0 ? (
                  <span className="text-rose-300 font-medium">
                    {activeMoment.shortfall}{' '}
                    {isDe ? 'Plätze hinter Vorgabe' : 'places behind target'}
                  </span>
                ) : (
                  <span className="text-emerald-300 font-medium">
                    {isDe ? 'Auf Kurs für Saisonziel' : 'On track for board objective'}
                  </span>
                )}
              </div>
            </div>

            <div className="sm:col-span-7 bg-[#161922] border border-white/[0.07] rounded-2xl p-3 flex flex-col justify-between gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                  {isDe ? 'Podium: Trainer & Management' : 'Podium Scrutiny'}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                  {activeMoment.gmName} · {activeMoment.tactic} · Coach {activeMoment.coachHeat}/100
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-snug">
                {isDe ? activeMoment.gmScrutinyDe : activeMoment.gmScrutiny}
              </p>
            </div>
          </div>

          {/* Accredited Reporters Asking Questions from the Floor */}
          <div className="bg-[#161922] border border-white/[0.07] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {isDe ? 'Fragen aus dem Pressesaal' : 'Reporters on the Floor'}
              </span>
              <span className="text-[11px] text-zinc-500 tabular-nums">
                {activeMoment.journalistQuestions.length}{' '}
                {isDe
                  ? activeMoment.journalistQuestions.length === 1
                    ? 'Wortmeldung'
                    : 'Wortmeldungen'
                  : activeMoment.journalistQuestions.length === 1
                  ? 'accredited question'
                  : 'accredited questions'}
              </span>
            </div>
            <div className="space-y-2">
              {activeMoment.journalistQuestions.map((q, idx) => {
                const rawQuote = (isDe ? q.questionDe : q.question) || '';
                const cleanQuote = rawQuote.replace(/^["“„]+|["”]+$/g, '').trim();
                return (
                  <div
                    key={`${q.reporter}-${idx}`}
                    className="bg-black/30 border border-white/[0.06] rounded-xl p-2.5 flex items-start gap-2.5"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-zinc-400 shrink-0 mt-0.5">
                      <i className="fas fa-microphone text-[10px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-0.5 flex-wrap">
                        <span className="font-semibold text-zinc-200">{q.outlet}</span>
                        <span aria-hidden="true">·</span>
                        <span>{q.reporter}</span>
                      </div>
                      <p className="text-xs text-zinc-200 leading-snug italic">
                        &ldquo;{cleanQuote}&rdquo;
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Podium Statement Selection or Immediate Press Fallout */}
          {!isResolved ? (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-0.5">
                {isDe
                  ? `Statement am Mikrofon wählen (${activeMoment.gmName})`
                  : `Step to the Microphones (${activeMoment.gmName})`}
              </div>
              <div className="space-y-2">
                {activeMoment.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleChoose(choice.id)}
                    className="w-full text-left bg-[#161922] hover:bg-[#1b202d] border border-white/[0.08] hover:border-sky-400/40 rounded-2xl p-3 transition-all duration-150 cursor-pointer active:scale-[0.995] group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[13px] sm:text-sm font-semibold text-white group-hover:text-sky-200 transition-colors">
                        {isDe ? choice.labelDe : choice.label}
                      </span>
                      <span className="text-[11px] font-mono text-sky-300 shrink-0">
                        {isDe ? choice.stanceTagDe : choice.stanceTag}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-snug mt-0.5">
                      {isDe ? choice.descriptionDe : choice.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-1.5 border-t border-white/[0.06] text-[11px] font-mono tabular-nums">
                      <span
                        className={
                          choice.mediaPressureDelta <= 0 ? 'text-emerald-300' : 'text-rose-300'
                        }
                      >
                        Press {formatDelta(choice.mediaPressureDelta)}
                      </span>
                      <span
                        className={choice.moraleDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}
                      >
                        Morale {formatDelta(choice.moraleDelta, '%')}
                      </span>
                      {choice.impactDelta !== 0 && (
                        <span
                          className={choice.impactDelta > 0 ? 'text-sky-300' : 'text-rose-300'}
                        >
                          Board Impact {formatDelta(choice.impactDelta)}
                        </span>
                      )}
                      {Boolean(choice.secondHalfOvrLift) && (
                        <span className="text-emerald-300">
                          Run-In Edge +{choice.secondHalfOvrLift} OVR
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl p-4 border ${toneAccent.border} ${toneAccent.bg} space-y-2.5`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                {isDe ? 'Schlagzeile nach der Pressekonferenz' : 'Breaking Press Wire'}
              </div>
              <h3 className="text-base font-bold text-white leading-snug">
                {activeMoment.resolvedReactionHeadline}
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
                {activeMoment.resolvedOutcomeSummary}
              </p>
              {activeMoment.resolvedCoachQuote && (
                <div className="bg-black/35 border border-white/[0.07] rounded-xl p-3 text-xs text-zinc-300 italic">
                  <span className="not-italic font-semibold text-zinc-200 mr-1.5">
                    {activeMoment.gmName}:
                  </span>
                  &ldquo;{activeMoment.resolvedCoachQuote}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-zinc-400">
            {isResolved
              ? isDe
                ? 'Pressekonferenz beendet · Statement protokolliert.'
                : 'Press conference adjourned · Statement on the record.'
              : activeMoment.phase === 'briefing'
              ? isDe
                ? 'Antworten Sie der Presse oder verlassen Sie das Podium.'
                : 'Address the microphones or step down from the podium.'
              : isDe
              ? 'Die Kameras laufen — wählen Sie Ihr offizielles Statement.'
              : 'Cameras are rolling — deliver your official podium statement.'}
          </span>
          {canDismiss && (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              {isResolved
                ? isDe
                  ? 'Weiter'
                  : 'Leave Podium'
                : isDe
                ? 'Schließen'
                : 'Close'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
