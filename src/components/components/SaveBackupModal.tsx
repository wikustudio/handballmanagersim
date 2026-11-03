import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GameState, Language } from '../types';
import { getReconciledTrophies } from '../utils/leaderboard';
import { useModalDismiss } from '../utils/modalUtils';
import { useGameStore, POSTSEASON_CHECKPOINT_KEY } from '../store/useGameStore';

interface SaveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  lang?: Language;
  onShowToast?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SaveBackupModal: React.FC<SaveBackupModalProps> = ({
  isOpen,
  onClose,
  state,
  onShowToast,
}) => {
  useModalDismiss(onClose, isOpen);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const getSavePayload = (): string => {
    try {
      const raw = localStorage.getItem('handball-manager-storage');
      if (raw) return raw;
      return JSON.stringify({ state, version: 1 });
    } catch {
      return JSON.stringify({ state, version: 1 });
    }
  };

  const handleDownload = () => {
    try {
      const payload = getSavePayload();
      const clubSlug = (state.club?.name || 'club').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `handballsim_save_${clubSlug}_season_${state.year || 2026}.json`;
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (onShowToast) {
        onShowToast('Save backup downloaded successfully!', 'success');
      }
    } catch (e) {
      if (onShowToast) {
        onShowToast('Failed to download save backup', 'error');
      }
    }
  };

  const handleCopyCode = async () => {
    try {
      const payload = getSavePayload();
      const encoded = btoa(encodeURIComponent(payload));
      await navigator.clipboard.writeText(encoded);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
      if (onShowToast) {
        onShowToast('Save code copied to clipboard!', 'success');
      }
    } catch {
      try {
        const payload = getSavePayload();
        await navigator.clipboard.writeText(payload);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
        if (onShowToast) {
          onShowToast('Raw save JSON copied to clipboard!', 'success');
        }
      } catch {
        if (onShowToast) {
          onShowToast('Could not copy to clipboard', 'error');
        }
      }
    }
  };

  const handleImport = () => {
    setImportError(null);
    const trimmed = importCode.trim();
    if (!trimmed) {
      setImportError('Please paste a valid save code or raw save JSON.');
      return;
    }

    let parsedJsonString = '';
    // Try base64 decode first
    try {
      parsedJsonString = decodeURIComponent(atob(trimmed));
    } catch {
      // If not base64, assume raw json
      parsedJsonString = trimmed;
    }

    try {
      const parsed = JSON.parse(parsedJsonString);
      if (!parsed || (typeof parsed !== 'object')) {
        throw new Error('Invalid save payload structure.');
      }

      // Check if it's zustand envelope { state: { ... } } or raw state
      let envelope = parsed;
      if (!parsed.state && parsed.managerName) {
        envelope = { state: parsed, version: 1 };
      } else if (!parsed.state?.managerName && !parsed.state?.club) {
        throw new Error('Save file does not contain valid manager career data.');
      }

      if (envelope.state) {
        useGameStore.getState().updateState(envelope.state);
      }
      localStorage.removeItem(POSTSEASON_CHECKPOINT_KEY);
      localStorage.setItem('handball-manager-storage', JSON.stringify(envelope));
      if (onShowToast) {
        onShowToast('Save restored successfully! Reloading career...', 'success');
      }
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setImportError(err?.message || 'Invalid save data format. Please verify the copied code.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportCode(content);
      }
    };
    reader.readAsText(file);
  };

  const hasCareer = Boolean(state.managerName && state.club?.name);
  const totalTrophies = getReconciledTrophies(state);

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 text-zinc-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/25 text-sky-400 flex items-center justify-center">
              <i className="fas fa-cloud-arrow-down text-base" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Save Backup & Device Transfer</h2>
              <p className="text-xs text-zinc-400">Safeguard your multi-season dynasty or switch devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Current Career Status */}
        {hasCareer ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 font-medium">Active Manager</span>
              <span className="text-sm font-bold text-white">{state.managerName}</span>
              <span className="text-xs text-zinc-400">{state.club?.name} · Season {state.year}</span>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-xs text-zinc-400">Silverware</span>
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1 justify-end">
                <i className="fas fa-trophy text-xs" /> {totalTrophies} Trophies
              </span>
              <span className="text-[11px] text-zinc-400">{state.history?.length || 0} seasons recorded</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3 text-xs">
            No active career currently in session. You can import a previous backup file below.
          </div>
        )}

        {/* Section 1: Export / Download */}
        {hasCareer && (
          <div className="flex flex-col gap-2 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Export / Backup</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 hover:border-sky-400/50 text-sky-200 hover:text-white text-xs font-semibold transition cursor-pointer active:scale-98"
              >
                <i className="fas fa-download text-xs" />
                <span>Download .JSON File</span>
              </button>
              <button
                onClick={handleCopyCode}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-98 ${
                  copySuccess
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-800 hover:bg-zinc-700/80 border-white/10 hover:border-white/20 text-zinc-200 hover:text-white'
                }`}
              >
                <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'} text-xs`} />
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Transfer Code'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 italic">
              Tip: iOS Safari automatically purges local storage after 7 days of inactivity. Downloading regular backups protects your career!
            </p>
          </div>
        )}

        {/* Section 2: Import / Restore */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Restore or Transfer Save</h3>
            <label className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer font-medium flex items-center gap-1">
              <i className="fas fa-file-arrow-up text-xs" />
              <span>Choose File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <textarea
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            placeholder="Paste your exported transfer code or raw JSON here..."
            className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-sky-400/50 resize-none"
          />

          {importError && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 flex items-center gap-2">
              <i className="fas fa-triangle-exclamation text-xs shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!importCode.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold text-xs transition cursor-pointer active:scale-98 shadow-md"
          >
            <i className="fas fa-rotate text-xs" />
            <span>Restore Career & Reload</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
