/**
 * EU GDPR, ePrivacy Directive, and Google Consent Mode v2 Manager
 * 
 * Provides:
 * - Granular consent categories (Strictly Necessary, Analytics, Preferences, Marketing)
 * - Consent Mode v2 mapping (ad_storage, ad_user_data, ad_personalization, analytics_storage, functionality_storage, personalization_storage, security_storage)
 * - Safe persistence in localStorage
 * - Dynamic consent updates with live gtag updates
 * - Event dispatching for live UI reactivity
 */

export const CONSENT_STORAGE_KEY = 'hms_cookie_consent_v2';
export const CONSENT_VERSION = 2;

export interface ConsentPreferences {
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
}

export interface StoredConsentState extends ConsentPreferences {
  status: 'unconfigured' | 'configured';
  necessary: true; // Always true per ePrivacy Directive / GDPR
  updatedAt: number;
  version: number;
}

const DEFAULT_STATE: StoredConsentState = {
  status: 'unconfigured',
  necessary: true,
  analytics: false,
  preferences: false,
  marketing: false,
  updatedAt: 0,
  version: CONSENT_VERSION,
};

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Returns current consent state from localStorage
 */
export function getStoredConsent(): StoredConsentState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        ...DEFAULT_STATE,
        ...parsed,
        necessary: true,
        version: CONSENT_VERSION,
      };
    }
  } catch (err) {
    console.warn('[ConsentManager] Error reading consent storage:', err);
  }
  return DEFAULT_STATE;
}

/**
 * Applies Google Consent Mode v2 update to gtag
 */
export function applyGtagConsentUpdate(prefs: ConsentPreferences) {
  if (typeof window === 'undefined') return;

  const consentUpdatePayload = {
    ad_storage: prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.marketing ? 'granted' : 'denied',
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
    functionality_storage: prefs.preferences ? 'granted' : 'denied',
    personalization_storage: prefs.preferences ? 'granted' : 'denied',
    security_storage: 'granted',
  };

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', consentUpdatePayload);
    if (prefs.analytics) {
      window.gtag('event', 'consent_granted', {
        analytics_storage: 'granted',
        preferences_storage: prefs.preferences ? 'granted' : 'denied',
        marketing_storage: prefs.marketing ? 'granted' : 'denied',
      });
    }
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(['consent', 'update', consentUpdatePayload]);
  }
}

/**
 * Persists user choice and broadcasts update
 */
export function saveConsent(preferences: ConsentPreferences): StoredConsentState {
  const newState: StoredConsentState = {
    status: 'configured',
    necessary: true,
    analytics: Boolean(preferences.analytics),
    preferences: Boolean(preferences.preferences),
    marketing: Boolean(preferences.marketing),
    updatedAt: Date.now(),
    version: CONSENT_VERSION,
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newState));
  } catch (err) {
    console.warn('[ConsentManager] Could not write to localStorage:', err);
  }

  // Update Google Consent Mode v2
  applyGtagConsentUpdate(newState);

  // Dispatch custom event for active components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hms:consent-changed', { detail: newState }));
  }

  return newState;
}

/**
 * One-click Accept All
 */
export function acceptAllConsent(): StoredConsentState {
  return saveConsent({
    analytics: true,
    preferences: true,
    marketing: true,
  });
}

/**
 * One-click Reject All optional (Essential Only)
 */
export function rejectNonEssentialConsent(): StoredConsentState {
  return saveConsent({
    analytics: false,
    preferences: false,
    marketing: false,
  });
}

/**
 * Re-open consent banner / modal
 */
export function openConsentBanner() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hms:open-consent'));
  }
}
