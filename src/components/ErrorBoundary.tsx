import React, { ErrorInfo, ReactNode } from 'react';
import { HandballSimLogo } from './HandballSimLogo';
import {
  autoSubmitCrashReport,
  submitFeedbackReport,
  buildDiagnosticSnapshot,
  getRecentErrors,
  CapturedCrashEntry,
} from '../utils/crashReporter';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg?: string;
  crashEntry?: CapturedCrashEntry | null;
  autoReportId?: string | null;
  userNotes: string;
  isSendingNotes: boolean;
  notesSentId?: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    errorMsg: '',
    crashEntry: null,
    autoReportId: null,
    userNotes: '',
    isSendingNotes: false,
    notesSentId: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMsg: (error?.message || 'Unknown error') + (error?.stack ? '\n' + error.stack : ''),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
    const dump = (error.message || 'Unknown error') + '\n' + (error.stack || '');
    (window as any).RENDER_ERROR_DUMP = dump;
    this.setState({ errorMsg: dump });
    // Ensure any static loading fallback element is removed from DOM even on error
    const fallback = document.getElementById('app-loading-fallback');
    if (fallback) fallback.remove();

    // Automatically capture & dispatch crash report to the backend
    autoSubmitCrashReport(error, errorInfo?.componentStack)
      .then((res) => {
        this.setState({
          crashEntry: res.crashEntry,
          autoReportId: res.reportId || res.crashEntry.id,
        });
      })
      .catch(() => {
        // ignore network failure on auto-report
      });
  }

  handleSendCrashDetails = async () => {
    if (this.state.isSendingNotes || this.state.notesSentId) return;
    this.setState({ isSendingNotes: true });
    const snapshot = buildDiagnosticSnapshot();
    const res = await submitFeedbackReport({
      type: 'crash',
      title: `[User Crash Report] ${(this.state.errorMsg || 'UI Crash').split('\n')[0].slice(0, 100)}`,
      description:
        this.state.userNotes.trim() ||
        'User submitted crash report from the ErrorBoundary recovery screen.',
      includeDiagnostics: true,
      autoCaptured: false,
      crashReport: this.state.crashEntry || {
        id: `crash-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: (this.state.errorMsg || 'Unknown crash').split('\n')[0],
        stack: this.state.errorMsg,
        source: 'ErrorBoundary',
      },
      recentErrors: getRecentErrors(),
      gameStateSnapshot: snapshot,
    });
    this.setState({
      isSendingNotes: false,
      notesSentId: res.reportId || `HMS-${Date.now().toString(36).toUpperCase()}`,
    });
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => r.unregister()));
      }
    } catch (e) {
      console.error(e);
    }
    window.location.href =
      window.location.origin + window.location.pathname + '?reset=' + Date.now();
  };

  handleReload = () => {
    try {
      localStorage.removeItem('handball-postseason-checkpoint');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const fallback = document.getElementById('app-loading-fallback');
      if (fallback) fallback.remove();
      const errDump = this.state.errorMsg || (window as any).RENDER_ERROR_DUMP;

      return (
        <div className="min-h-screen bg-[#090a0f] text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
          <div className="bg-[#14151f] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-center mx-auto mb-4">
              <HandballSimLogo className="w-14 h-14 rounded-2xl shadow-xl border border-white/20" />
            </div>
            <h1 className="text-xl font-bold mb-1.5 text-white">
              Handball Manager Sim
            </h1>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              The game encountered an unexpected error. A diagnostic crash log has been captured automatically.
            </p>

            {Boolean(errDump) && (
              <pre className="text-[10px] text-rose-300 text-left overflow-auto max-h-32 mb-4 p-2.5 bg-black/60 rounded-xl border border-rose-500/20 font-mono whitespace-pre-wrap break-all">
                {String(errDump)}
              </pre>
            )}

            {/* Inline Crash Feedback Submission */}
            <div className="bg-[#0e1017] border border-white/[0.07] rounded-2xl p-3.5 mb-4 text-left">
              {this.state.notesSentId ? (
                <div className="flex items-center gap-2.5 text-xs text-emerald-300">
                  <i className="fas fa-circle-check text-emerald-400" />
                  <span>
                    Crash report sent to developer (Ref: <strong className="font-mono">{this.state.notesSentId}</strong>).
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-300 font-medium">
                    <span>Report Crash to Developer</span>
                    {this.state.autoReportId && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Auto-logged ({this.state.autoReportId})
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={this.state.userNotes}
                    onChange={(e) => this.setState({ userNotes: e.target.value })}
                    placeholder="Optional: What were you doing right before this crash? (e.g., finishing Champions League final)"
                    className="w-full bg-black/50 border border-white/10 focus:border-sky-400/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={this.handleSendCrashDetails}
                    disabled={this.state.isSendingNotes}
                    className="w-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-200 font-semibold py-2 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-xs active:scale-95"
                  >
                    <i className={`fas ${this.state.isSendingNotes ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'} text-xs`} />
                    <span>{this.state.isSendingNotes ? 'Sending Crash Report...' : 'Submit Crash Report & Context'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 text-sm"
              >
                <i className="fas fa-arrows-rotate text-xs"></i>
                Reload Game
              </button>
              <button
                onClick={this.handleReset}
                className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white font-medium py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 text-xs border border-white/[0.08]"
              >
                <i className="fas fa-trash-can text-xs text-rose-400"></i>
                Reset Save Data & Start Fresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
