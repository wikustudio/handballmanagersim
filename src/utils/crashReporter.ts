import { useGameStore } from '../store/useGameStore';
import { isRealDataModActive, getCustomDb } from './modManager';

export type FeedbackType = 'crash' | 'bug' | 'feature';

export interface CapturedCrashEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
}

export interface GameDiagnosticSnapshot {
  capturedAt: string;
  year?: number;
  clubName?: string;
  clubId?: number | string;
  country?: string;
  tier?: number;
  baseOvr?: number;
  budget?: number;
  euroStatus?: string | null;
  historyCount?: number;
  postSeasonPending?: boolean;
  winterBreakPending?: boolean;
  isSacked?: boolean;
  activeCup?: string | null;
  activeEuro?: string | null;
  modState: string;
  viewport: string;
  userAgent: string;
  urlPath: string;
}

export interface FeedbackSubmissionPayload {
  type: FeedbackType;
  title: string;
  description: string;
  stepsToReproduce?: string;
  userContact?: string;
  includeDiagnostics: boolean;
  autoCaptured?: boolean;
  crashReport?: CapturedCrashEntry | null;
  recentErrors?: CapturedCrashEntry[];
  gameStateSnapshot?: GameDiagnosticSnapshot | null;
}

const LAST_CRASH_STORAGE_KEY = 'handball_last_crash_report';
const SENT_CRASH_HASHES_KEY = 'handball_sent_crash_hashes';
const MAX_RECENT_ERRORS = 10;

const recentErrorsBuffer: CapturedCrashEntry[] = [];
let initialized = false;

function safeSessionGet(key: string): string | null {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(key);
    }
  } catch {
    // ignore
  }
  return null;
}

function safeSessionSet(key: string, value: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

export function buildDiagnosticSnapshot(): GameDiagnosticSnapshot {
  let state: any = null;
  try {
    state = useGameStore.getState();
  } catch {
    state = null;
  }

  let modState = 'Default Database';
  try {
    if (getCustomDb()) modState = 'Custom Community Mod';
    else if (isRealDataModActive()) modState = 'Real Data Mod';
  } catch {
    // ignore
  }

  const viewport =
    typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight}`
      : 'unknown';
  const userAgent =
    typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const urlPath =
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/';

  return {
    capturedAt: new Date().toISOString(),
    year: state?.year,
    clubName: state?.club?.name,
    clubId: state?.club?.id,
    country: state?.club?.country,
    tier: state?.club?.tier,
    baseOvr: state?.club?.baseOvr,
    budget: state?.budget,
    euroStatus: state?.euroStatus ?? null,
    historyCount: Array.isArray(state?.history) ? state.history.length : 0,
    postSeasonPending: Boolean(state?.postSeasonPending),
    winterBreakPending: Boolean(state?.winterBreakPending),
    isSacked: Boolean(state?.isSacked),
    activeCup: state?.activeCupTournament?.name || null,
    activeEuro: state?.activeEuroTournament?.name || null,
    modState,
    viewport,
    userAgent,
    urlPath,
  };
}

export function recordCrashReport(
  error: Error | string | unknown,
  componentStack?: string,
  source: string = 'runtime'
): CapturedCrashEntry {
  const message =
    typeof error === 'string'
      ? error
      : (error as any)?.message || String(error || 'Unknown Error');
  const stack =
    typeof error === 'object' && error !== null && 'stack' in error
      ? String((error as any).stack || '')
      : undefined;

  const entry: CapturedCrashEntry = {
    id: `crash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    message: message.slice(0, 1000),
    stack: stack ? stack.slice(0, 4000) : undefined,
    componentStack: componentStack ? componentStack.slice(0, 3000) : undefined,
    source,
  };

  recentErrorsBuffer.unshift(entry);
  if (recentErrorsBuffer.length > MAX_RECENT_ERRORS) {
    recentErrorsBuffer.pop();
  }

  safeSessionSet(LAST_CRASH_STORAGE_KEY, JSON.stringify(entry));
  return entry;
}

export function getLatestCrashReport(): CapturedCrashEntry | null {
  if (recentErrorsBuffer.length > 0) {
    return recentErrorsBuffer[0];
  }
  const raw = safeSessionGet(LAST_CRASH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CapturedCrashEntry;
  } catch {
    return null;
  }
}

export function getRecentErrors(): CapturedCrashEntry[] {
  return [...recentErrorsBuffer];
}

export function clearLatestCrashReport(): void {
  recentErrorsBuffer.length = 0;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(LAST_CRASH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function submitFeedbackReport(
  payload: FeedbackSubmissionPayload
): Promise<{ ok: boolean; reportId?: string; error?: string }> {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: errData?.error || `Server responded with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      ok: true,
      reportId: data.reportId || `HMS-${Date.now().toString(36).toUpperCase()}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error while submitting feedback report.',
    };
  }
}

export async function autoSubmitCrashReport(
  error: Error | string | unknown,
  componentStack?: string
): Promise<{ ok: boolean; reportId?: string; crashEntry: CapturedCrashEntry }> {
  const crashEntry = recordCrashReport(error, componentStack, 'ErrorBoundary');
  const fingerprint = `${crashEntry.message}::${(crashEntry.stack || '').slice(0, 180)}`;

  try {
    const rawHashes = safeSessionGet(SENT_CRASH_HASHES_KEY);
    const hashes: string[] = rawHashes ? JSON.parse(rawHashes) : [];
    if (hashes.includes(fingerprint)) {
      return { ok: true, reportId: crashEntry.id, crashEntry };
    }
    hashes.push(fingerprint);
    safeSessionSet(SENT_CRASH_HASHES_KEY, JSON.stringify(hashes.slice(-20)));
  } catch {
    // ignore
  }

  const snapshot = buildDiagnosticSnapshot();
  const res = await submitFeedbackReport({
    type: 'crash',
    title: `[Auto-Captured Crash] ${crashEntry.message.slice(0, 120)}`,
    description: 'Automatic crash report captured by ErrorBoundary.',
    includeDiagnostics: true,
    autoCaptured: true,
    crashReport: crashEntry,
    recentErrors: getRecentErrors(),
    gameStateSnapshot: snapshot,
  });

  return {
    ok: res.ok,
    reportId: res.reportId || crashEntry.id,
    crashEntry,
  };
}

export function initCrashReporter(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement | null;
    // Ignore image/script resource load errors (e.g. external club logos falling back)
    if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      return;
    }
    const err = event.error || event.message || 'Unhandled window error';
    recordCrashReport(err, undefined, 'window.onerror');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || 'Unhandled Promise Rejection';
    recordCrashReport(reason, undefined, 'unhandledrejection');
  });
}

export function openFeedbackModal(options?: {
  type?: FeedbackType;
  prefillTitle?: string;
  prefillDescription?: string;
}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('open-feedback-modal', {
      detail: options || {},
    })
  );
}
