import React, { useState, useEffect } from 'react';
import { Bug, Sparkles, Mail, Copy, Check, Trash2, AlertTriangle, X, Send } from 'lucide-react';
import { GameState } from '../types';
import {
  CrashReportEntry,
  getCrashReports,
  clearCrashReports,
  markAllCrashReportsRead,
  formatDiagnosticSummary,
  submitFeedbackReport,
} from '../utils/crashReporter';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState?: GameState | null;
  onShowToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, gameState, onShowToast }) => {
  const [reports, setReports] = useState<CrashReportEntry[]>([]);
  const [reportType, setReportType] = useState<'bug' | 'feature'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [selectedCrashId, setSelectedCrashId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sent' | 'copied'>('idle');

  useEffect(() => {
    if (isOpen) {
      const loaded = getCrashReports();
      setReports(loaded);
      if (loaded.length > 0) {
        setSelectedCrashId(loaded[0].id);
        setReportType('bug');
      }
      markAllCrashReportsRead();
      setSubmitStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCrash = reports.find((r) => r.id === selectedCrashId) || reports[0] || null;
  const diagnosticText = includeDiagnostics ? formatDiagnosticSummary(gameState, selectedCrash) : '';

  const subjectLine = `[FMS v2.2 ${reportType === 'bug' ? 'Bug / Crash Report' : 'Feature Request'}] ${
    title.trim() || (reportType === 'bug' ? (selectedCrash ? selectedCrash.message.slice(0, 50) : 'Gameplay Issue') : 'Feature Suggestion')
  }`;

  const fullReportBody = [
    `Type: ${reportType === 'bug' ? 'Crash / Bug Report' : 'Feature Request'}`,
    userEmail.trim() ? `Reply-To: ${userEmail.trim()}` : null,
    `Summary: ${title.trim() || '(No title provided)'}`,
    '',
    '=== DESCRIPTION ===',
    description.trim() || '(No additional details provided)',
    includeDiagnostics ? `\n${diagnosticText}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subjectLine}\n\n${fullReportBody}`);
      setCopied(true);
      setSubmitStatus('copied');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = `Subject: ${subjectLine}\n\n${fullReportBody}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setSubmitStatus('copied');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmitReport = async () => {
    setSubmitting(true);
    try {
      await submitFeedbackReport({
        type: reportType,
        subject: subjectLine,
        title: title.trim(),
        description: description.trim(),
        contactEmail: userEmail.trim(),
        diagnostics: diagnosticText,
        crashReport: selectedCrash,
        crashLogs: reports,
        timestamp: new Date().toISOString(),
      });
      setSubmitStatus('sent');
      setTitle('');
      setDescription('');
      if (onShowToast) {
        onShowToast(
          reportType === 'bug'
            ? 'Crash / bug report submitted! Thank you for helping improve the game.'
            : 'Feature request submitted! Thank you for your feedback.',
          'success'
        );
      }
    } catch {
      setSubmitStatus('sent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearLogs = () => {
    clearCrashReports();
    setReports([]);
    setSelectedCrashId('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[120] p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              {reportType === 'bug' ? <Bug className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block">
                Direct Developer Line
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Feedback & Crash Reporter
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto custom-scrollbar space-y-4 py-4 pr-1 flex-1">
          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setReportType('bug')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                reportType === 'bug'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              Bug / Crash Report
              {reports.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-mono">
                  {reports.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setReportType('feature')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                reportType === 'feature'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Feature Request
            </button>
          </div>

          {/* Automatic Crash Log Banner if any captured */}
          {reports.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Automatic Crash Report Captured ({reports.length})</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="text-[10px] font-mono text-zinc-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Logs
                </button>
              </div>
              {reports.length > 1 && (
                <select
                  value={selectedCrashId}
                  onChange={(e) => setSelectedCrashId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{new Date(r.timestamp).toLocaleTimeString()}] {r.context}: {r.message.slice(0, 55)}
                    </option>
                  ))}
                </select>
              )}
              {selectedCrash && (
                <div className="bg-black/50 border border-rose-500/20 rounded-lg p-2.5 text-[11px] font-mono text-rose-200/90 overflow-x-auto">
                  <div className="font-bold text-rose-300">{selectedCrash.context}: {selectedCrash.message}</div>
                  {selectedCrash.clubName && (
                    <div className="text-zinc-400 mt-0.5">
                      Club: {selectedCrash.clubName} (Tier {selectedCrash.tier}) • Season {selectedCrash.year} • Phase: {selectedCrash.seasonPhase}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                {reportType === 'bug' ? 'Issue Summary' : 'Feature Title'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  reportType === 'bug'
                    ? 'e.g. Season end returned to winter window / UI layout issue'
                    : 'e.g. Add historical trophy cabinet filter'
                }
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                {reportType === 'bug' ? 'What happened / Steps to reproduce' : 'How should this feature work?'}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  reportType === 'bug'
                    ? 'Describe what you were doing right before the bug occurred...'
                    : 'Share your idea or improvement for Football Manager Strip...'
                }
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Your Email (Optional, for follow-up)
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="manager@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/60 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Auto-Include Diagnostics Toggle */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-zinc-200">
                  Attach automatic save state & crash diagnostics
                </div>
                <div className="text-zinc-500 text-[11px] mt-0.5">
                  Includes club, tier, season phase, history count, and any captured stack trace.
                </div>
              </div>
            </label>

            {includeDiagnostics && (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                  Attached Diagnostic Snapshot
                </div>
                <pre className="text-[10px] font-mono text-zinc-400 whitespace-pre-wrap break-words max-h-28 overflow-y-auto custom-scrollbar">
                  {diagnosticText}
                </pre>
              </div>
            )}
          </div>

          {submitStatus !== 'idle' && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {submitStatus === 'copied'
                  ? 'Full diagnostic report copied to your clipboard!'
                  : 'Report submitted successfully! Thank you for your feedback.'}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyReport}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Report'}
          </button>

          <button
            type="button"
            onClick={handleSubmitReport}
            disabled={submitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 text-xs font-black tracking-wide transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
