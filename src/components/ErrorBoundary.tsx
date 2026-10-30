import React, { ErrorInfo, ReactNode } from 'react';
import { recordCrashReport, formatDiagnosticSummary, submitFeedbackReport } from '../utils/crashReporter';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
    (window as any).RENDER_ERROR_DUMP = error.message + ' ' + error.stack;

    try {
      let savedGameState: any = null;
      try {
        const rawSave = localStorage.getItem('footy_manager_sim_state_v2');
        if (rawSave) {
          savedGameState = JSON.parse(rawSave);
        }
      } catch {
        // Ignore parse error
      }
      const entry = recordCrashReport(error, savedGameState, 'React Render Crash');
      const diagnostics = formatDiagnosticSummary(savedGameState, entry);
      submitFeedbackReport({
        type: 'bug',
        subject: `[FMS v2.2 Auto Crash Report] ${error.message.slice(0, 60)}`,
        title: error.message,
        description: `Automatic crash captured by ErrorBoundary.\nComponent Stack:\n${errorInfo?.componentStack || 'N/A'}`,
        diagnostics,
        crashReport: entry,
        timestamp: new Date().toISOString(),
      }).catch(() => {
        // Silently ignore network errors on crash boundary
      });
    } catch {
      // Ignore secondary crash reporter errors
    }
  }

  handleReloadKeepSave = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('footy_manager_sim_state_v2');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d0e] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-[#1c1c1e] border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-triangle-exclamation text-red-400 text-2xl"></i>
            </div>
            <h1 className="text-xl font-black mb-2 text-red-400">
              Session Recovered
            </h1>
            <p className="text-xs text-gray-400 mb-2 leading-relaxed">
              An unexpected error occurred during rendering.
            </p>
            <p className="text-[11px] text-emerald-400 mb-4 font-semibold">
              Crash diagnostics automatically sent to the developer.
            </p>
            <pre className="text-[10px] text-red-300 text-left overflow-auto max-h-32 mb-4 bg-black/40 p-2.5 rounded-xl border border-red-500/20">
              {(window as any).RENDER_ERROR_DUMP}
            </pre>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={this.handleReloadKeepSave}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="fas fa-rotate"></i>
                Reload & Keep Save
              </button>
              <button
                onClick={this.handleReset}
                className="w-full bg-white/[0.06] hover:bg-red-600/80 text-zinc-300 hover:text-white font-bold py-2.5 px-6 rounded-xl border border-white/10 transition cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <i className="fas fa-trash-can"></i>
                Reset & Start Fresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
