import React, { ErrorInfo, ReactNode } from 'react';
import { HandballSimLogo } from './HandballSimLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false,
    errorMsg: '',
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
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
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
    } catch (e) {
      console.error(e);
    }
    window.location.href = window.location.origin + window.location.pathname + '?reset=' + Date.now();
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
      // Also remove fallback element during render if still present
      const fallback = document.getElementById('app-loading-fallback');
      if (fallback) fallback.remove();
      const errDump = this.state.errorMsg || (window as any).RENDER_ERROR_DUMP;

      return (
        <div className="min-h-screen bg-[#090a0f] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-[#14151f] border border-amber-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center mx-auto mb-4">
              <HandballSimLogo className="w-16 h-16 rounded-2xl shadow-xl border border-white/20" />
            </div>
            <h1 className="text-xl font-bold mb-2 text-white">
              Handball Manager Sim
            </h1>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              The game encountered a momentary display hiccup. You can reload or start a fresh career.
            </p>
            {Boolean(errDump) && (
              <pre className="text-[10px] text-rose-300 text-left overflow-auto max-h-36 mb-4 p-2.5 bg-black/60 rounded-xl border border-rose-500/20 font-mono whitespace-pre-wrap break-all">
                {String(errDump)}
              </pre>
            )}
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
