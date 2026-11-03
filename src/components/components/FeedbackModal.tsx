import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { useModalDismiss } from '../utils/modalUtils';
import {
  FeedbackType,
  CapturedCrashEntry,
  GameDiagnosticSnapshot,
  getLatestCrashReport,
  getRecentErrors,
  buildDiagnosticSnapshot,
  submitFeedbackReport,
  clearLatestCrashReport,
} from '../utils/crashReporter';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  initialType?: FeedbackType;
  prefillTitle?: string;
  prefillDescription?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  lang = 'en',
  initialType,
  prefillTitle = '',
  prefillDescription = '',
}) => {
  useModalDismiss(onClose, isOpen);

  const tr = (en: string, de?: string) => (lang === 'de' ? de || en : en);

  const [latestCrash, setLatestCrash] = useState<CapturedCrashEntry | null>(null);
  const [snapshot, setSnapshot] = useState<GameDiagnosticSnapshot | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [userContact, setUserContact] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [showTelemetryPreview, setShowTelemetryPreview] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const crash = getLatestCrashReport();
    const diag = buildDiagnosticSnapshot();
    setLatestCrash(crash);
    setSnapshot(diag);

    if (initialType) {
      setFeedbackType(initialType);
    } else if (crash) {
      setFeedbackType('crash');
    } else {
      setFeedbackType('bug');
    }

    if (prefillTitle) {
      setTitle(prefillTitle);
    } else if (crash && !title) {
      setTitle(`Crash: ${crash.message.slice(0, 80)}`);
    }

    if (prefillDescription) {
      setDescription(prefillDescription);
    }

    setSubmitError(null);
    setSubmittedReportId(null);
  }, [isOpen, initialType, prefillTitle, prefillDescription]);

  if (!isOpen) return null;

  const handleSelectType = (nextType: FeedbackType) => {
    setFeedbackType(nextType);
    setSubmitError(null);
    if (nextType === 'feature') {
      setIncludeDiagnostics(false);
    } else {
      setIncludeDiagnostics(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    if (!cleanTitle && !cleanDesc) {
      setSubmitError(
        tr(
          'Please provide a brief summary or description before submitting.',
          'Bitte gib vor dem Absenden eine kurze Zusammenfassung oder Beschreibung ein.'
        )
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await submitFeedbackReport({
      type: feedbackType,
      title:
        cleanTitle ||
        (feedbackType === 'crash'
          ? 'Crash Report'
          : feedbackType === 'feature'
          ? 'Feature Request'
          : 'Bug / Fix Report'),
      description: cleanDesc || cleanTitle,
      stepsToReproduce: stepsToReproduce.trim() || undefined,
      userContact: userContact.trim() || undefined,
      includeDiagnostics,
      autoCaptured: false,
      crashReport: includeDiagnostics ? latestCrash : null,
      recentErrors: includeDiagnostics ? getRecentErrors() : [],
      gameStateSnapshot: includeDiagnostics ? snapshot : null,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setSubmitError(
        res.error ||
          tr(
            'Could not transmit report right now. Please try again.',
            'Bericht konnte momentan nicht gesendet werden. Bitte versuche es erneut.'
          )
      );
      return;
    }

    if (feedbackType === 'crash') {
      clearLatestCrashReport();
    }
    setSubmittedReportId(res.reportId || `HMS-${Date.now().toString(36).toUpperCase()}`);
  };

  const handleResetAndClose = () => {
    setTitle('');
    setDescription('');
    setStepsToReproduce('');
    setSubmittedReportId(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#14151e] border border-white/[0.08] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden cursor-default"
      >
        {/* Top Ambient Highlight */}
        <div
          className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${
            feedbackType === 'crash'
              ? 'via-rose-500/40'
              : feedbackType === 'feature'
              ? 'via-emerald-500/40'
              : 'via-sky-500/40'
          } to-transparent pointer-events-none`}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
                feedbackType === 'crash'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : feedbackType === 'feature'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              }`}
            >
              <i
                className={`fas ${
                  feedbackType === 'crash'
                    ? 'fa-triangle-exclamation'
                    : feedbackType === 'feature'
                    ? 'fa-lightbulb'
                    : 'fa-bug'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-zinc-400 leading-none mb-1">
                {tr('Developer Support & Issue Tracker', 'Entwickler-Support & Feedback')}
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight truncate">
                {tr('Submit Feedback or Crash Report', 'Feedback oder Absturz melden')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer shrink-0"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {submittedReportId ? (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl shadow-sm">
                <i className="fas fa-check" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-lg font-semibold text-white">
                  {tr('Report Sent to Developer', 'Bericht an Entwickler gesendet')}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {tr(
                    'Thank you! Your report has been securely transmitted through our backend issue dispatch.',
                    'Vielen Dank! Dein Bericht wurde sicher über das Backend übermittelt.'
                  )}
                </p>
              </div>
              <div className="bg-[#10121a] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-zinc-300 font-mono tabular-nums">
                {tr('Reference ID:', 'Referenz-ID:')} <span className="text-sky-300 font-semibold">{submittedReportId}</span>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-200 font-semibold text-xs transition cursor-pointer active:scale-[0.99]"
              >
                {tr('Return to Game', 'Zurück zum Spiel')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Interactive Segmented Control for Report Type */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                  {tr('Report Category', 'Kategorie auswählen')}
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0e1017] border border-white/[0.05] rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleSelectType('bug')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      feedbackType === 'bug'
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <i className="fas fa-wrench text-[11px]" />
                    <span className="truncate">{tr('Bug / Fix', 'Bug / Fix')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectType('crash')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      feedbackType === 'crash'
                        ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <i className="fas fa-bolt text-[11px]" />
                    <span className="truncate">{tr('Crash Report', 'Absturz')}</span>
                    {latestCrash && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectType('feature')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      feedbackType === 'feature'
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <i className="fas fa-lightbulb text-[11px]" />
                    <span className="truncate">{tr('Feature Idea', 'Vorschlag')}</span>
                  </button>
                </div>
              </div>

              {/* Auto-Captured Crash Banner if present */}
              {latestCrash && (
                <div className="bg-rose-500/[0.07] border border-rose-500/25 rounded-xl p-3 flex items-start gap-2.5">
                  <i className="fas fa-wave-square text-rose-400 text-xs mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-rose-200">
                      {tr('Crash Log Automatically Captured', 'Absturzprotokoll automatisch erfasst')}
                    </div>
                    <p className="text-[11px] text-rose-200/80 font-mono truncate mt-0.5">
                      {latestCrash.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Subject / Summary */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                  {feedbackType === 'feature'
                    ? tr('Feature Title', 'Titel des Vorschlags')
                    : tr('Issue Summary', 'Kurzbeschreibung')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    feedbackType === 'feature'
                      ? tr('e.g., Add historical player awards or custom tactics', 'z.B. Neue Taktik-Optionen')
                      : feedbackType === 'crash'
                      ? tr('e.g., Freeze after Champions League Final', 'z.B. Absturz nach dem Finale')
                      : tr('e.g., Supercup opponent mismatch after switching club', 'z.B. Falscher Gegner im Supercup')
                  }
                  maxLength={140}
                  className="w-full bg-[#0e1017] border border-white/[0.08] focus:border-sky-400/50 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                  {feedbackType === 'feature'
                    ? tr('How should this feature work?', 'Wie soll das Feature funktionieren?')
                    : tr('What happened? (Details & Context)', 'Was ist passiert? (Details & Kontext)')}
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    feedbackType === 'feature'
                      ? tr(
                          'Describe your idea and how it would make the game more fun or realistic...',
                          'Beschreibe deine Idee...'
                        )
                      : tr(
                          'Describe what you clicked or noticed right before the issue occurred...',
                          'Beschreibe kurz, was du vor dem Fehler gemacht hast...'
                        )
                  }
                  maxLength={2500}
                  className="w-full bg-[#0e1017] border border-white/[0.08] focus:border-sky-400/50 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition resize-y"
                />
              </div>

              {/* Optional Contact Handle */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                  {tr('Your Name or Contact (Optional, if you want a reply)', 'Name oder Kontakt (Optional für Rückfragen)')}
                </label>
                <input
                  type="text"
                  value={userContact}
                  onChange={(e) => setUserContact(e.target.value)}
                  placeholder={tr('Optional name, Discord, or email', 'Optional: Name, Discord oder E-Mail')}
                  maxLength={120}
                  className="w-full bg-[#0e1017] border border-white/[0.08] focus:border-sky-400/50 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none transition"
                />
              </div>

              {/* Automatic Diagnostic & Crash Snapshot Toggle */}
              <div className="bg-[#0e1017] border border-white/[0.06] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
                    <input
                      type="checkbox"
                      checked={includeDiagnostics}
                      onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                      className="rounded border-white/20 bg-zinc-900 text-sky-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-zinc-200 block">
                        {tr('Attach Automatic Crash & Save Diagnostics', 'Automatische Diagnose- & Spielstandsdaten anhängen')}
                      </span>
                      <span className="text-[11px] text-zinc-500 block">
                        {tr(
                          'Includes active club, season, tier, viewport, and captured error stack.',
                          'Enthält Verein, Saison, Liga, Bildschirmgröße und Fehlerprotokoll.'
                        )}
                      </span>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowTelemetryPreview((prev) => !prev)}
                    className="text-[11px] font-medium text-sky-400 hover:text-sky-300 shrink-0 cursor-pointer"
                  >
                    {showTelemetryPreview ? tr('Hide', 'Ausblenden') : tr('Inspect', 'Ansehen')}
                  </button>
                </div>

                <AnimatePresence>
                  {showTelemetryPreview && snapshot && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-2 border-t border-white/[0.05]"
                    >
                      <pre className="text-[10px] font-mono text-zinc-400 bg-black/50 p-2.5 rounded-lg overflow-x-auto max-h-36 whitespace-pre-wrap break-all">
                        {JSON.stringify(
                          {
                            club: snapshot.clubName || 'None',
                            country: snapshot.country || 'N/A',
                            tier: snapshot.tier ?? 'N/A',
                            season: snapshot.year ?? 'N/A',
                            ovr: snapshot.baseOvr ?? 'N/A',
                            euroStatus: snapshot.euroStatus || 'None',
                            mod: snapshot.modState,
                            viewport: snapshot.viewport,
                            latestCrash: latestCrash
                              ? {
                                  message: latestCrash.message,
                                  timestamp: latestCrash.timestamp,
                                }
                              : 'None',
                          },
                          null,
                          2
                        )}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {submitError && (
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
                  <i className="fas fa-circle-exclamation text-rose-400 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Actions */}
              <div className="pt-1 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  {tr('Cancel', 'Abbrechen')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition cursor-pointer flex items-center gap-2 active:scale-[0.99] shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin text-xs" />
                      <span>{tr('Sending...', 'Wird gesendet...')}</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane text-xs" />
                      <span>
                        {feedbackType === 'feature'
                          ? tr('Submit Feature Request', 'Vorschlag senden')
                          : feedbackType === 'crash'
                          ? tr('Send Crash Report', 'Absturzbericht senden')
                          : tr('Submit Bug / Fix', 'Bericht senden')}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
