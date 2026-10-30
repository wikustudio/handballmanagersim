import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ConsentPreferences,
  getStoredConsent,
  saveConsent,
  acceptAllConsent,
  rejectAllConsent,
  initializeConsentOnLoad,
} from '../utils/consentMode';

export const ConsentBanner: React.FC = () => {
  const [hasDecision, setHasDecision] = useState<boolean>(true); // Start true to prevent flash
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customPrefs, setCustomPrefs] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Synchronize Consent Mode v2 signals upon mounting
    initializeConsentOnLoad();

    const stored = getStoredConsent();
    if (!stored) {
      setHasDecision(false);
    } else {
      setCustomPrefs(stored.preferences);
    }

    // Global listener for players who want to revisit settings from in-game links/footer
    const handleReopen = () => {
      const current = getStoredConsent();
      if (current) {
        setCustomPrefs(current.preferences);
      }
      setIsModalOpen(true);
    };

    window.addEventListener('open_privacy_settings', handleReopen);
    return () => {
      window.removeEventListener('open_privacy_settings', handleReopen);
    };
  }, []);

  const handleAcceptAll = () => {
    acceptAllConsent();
    setHasDecision(true);
    setIsModalOpen(false);
  };

  const handleRejectAll = () => {
    rejectAllConsent();
    setHasDecision(true);
    setIsModalOpen(false);
  };

  const handleSaveCustom = () => {
    saveConsent(customPrefs, 'customized');
    setHasDecision(true);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* ──────────────────────────────────────────────────────────
          1. BOTTOM CONSENT BANNER (Shown on first visit until decision)
          ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!hasDecision && !isModalOpen && (
          <motion.aside
            key="gdpr-consent-banner"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            aria-label="Privacy and Cookie Consent"
            className="fixed bottom-3 inset-x-3 sm:bottom-5 sm:inset-x-auto sm:right-6 sm:max-w-xl z-[9998] pointer-events-auto"
          >
            <div className="bg-[#0f1117]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl text-zinc-200">
              <div className="flex items-start gap-3.5 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center shrink-0 text-sky-400">
                  <i className="fa-solid fa-shield-halved text-sm" aria-hidden="true"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-sm font-bold text-white tracking-tight">
                      Privacy & Cookie Consent
                    </h2>
                    <span className="text-[10px] text-zinc-400 font-mono" aria-hidden="true">·</span>
                    <span className="text-[10px] text-zinc-400 font-mono">GDPR & ePrivacy Compliant</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    We use cookies and local device storage to power game saves, maintain your device preferences, and analyze gameplay performance. We do not personalize content. Non-essential cookies and analytics remain inactive until you choose to accept them.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Parity of choice between Accept and Reject under EU law */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  Manage Preferences
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] transition text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  Reject Non-Essential
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-sky-400 hover:bg-sky-300 shadow-md shadow-sky-500/20 transition text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  Accept All
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────
          2. GRANULAR PREFERENCES MODAL (Manage specific categories)
          ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: 'linear' }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-[#0e1017] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl text-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="privacy-modal-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400 text-xs">
                    <i className="fa-solid fa-sliders" aria-hidden="true"></i>
                  </div>
                  <div>
                    <h2 id="privacy-modal-title" className="text-base font-bold text-white">
                      Cookie & Storage Preferences
                    </h2>
                    <p className="text-[11px] text-zinc-400">
                      Google Consent Mode v2 & GDPR Granular Control
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label="Close preferences modal"
                >
                  <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
                </button>
              </div>

              {/* Category Options List */}
              <div className="overflow-y-auto custom-scrollbar my-4 pr-1 space-y-3 flex-1 text-xs">
                {/* Category 1: Strictly Necessary */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Strictly Necessary</span>
                      <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        Always Active
                      </span>
                    </div>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    Essential for the football simulation to function. Stores career saves, league standings, user session state, and security authentication tokens. These cannot be disabled.
                  </p>
                </div>

                {/* Category 2: Analytics & Measurement */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="toggle-analytics" className="font-bold text-white text-sm cursor-pointer">
                      Analytics & Performance
                    </label>
                    <input
                      id="toggle-analytics"
                      type="checkbox"
                      checked={customPrefs.analytics}
                      onChange={(e) =>
                        setCustomPrefs((prev) => ({ ...prev, analytics: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-sky-500 bg-black/40 border-white/20 focus:ring-sky-400 focus:ring-offset-0 cursor-pointer accent-sky-400"
                    />
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    Helps us understand gameplay telemetry, match engine performance, and crash reports using Google Analytics (GA4) with anonymous client identifiers (<code className="text-zinc-300">analytics_storage</code>).
                  </p>
                </div>

                {/* Category 3: Non-Personalized Ad Measurement */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="toggle-marketing" className="font-bold text-white text-sm cursor-pointer">
                      Ad Measurement (Non-Personalized)
                    </label>
                    <input
                      id="toggle-marketing"
                      type="checkbox"
                      checked={customPrefs.marketing}
                      onChange={(e) =>
                        setCustomPrefs((prev) => ({ ...prev, marketing: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-sky-500 bg-black/40 border-white/20 focus:ring-sky-400 focus:ring-offset-0 cursor-pointer accent-sky-400"
                    />
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    Controls non-personalized ad and sponsorship measurement signals (<code className="text-zinc-300">ad_storage</code>, <code className="text-zinc-300">ad_user_data</code>). We do not personalize content or ads.
                  </p>
                </div>

                {/* Explicit Guarantee: No Content Personalization */}
                <div className="p-3 rounded-xl bg-sky-500/[0.04] border border-sky-400/20 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <i className="fa-solid fa-user-shield text-sky-400 text-xs" aria-hidden="true"></i>
                    <span>Content Personalization & Profiling</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">Disabled (Not Used)</span>
                </div>

                {/* Category 4: Functionality & UI Preferences */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="toggle-preferences" className="font-bold text-white text-sm cursor-pointer">
                      Functional & Game Preferences
                    </label>
                    <input
                      id="toggle-preferences"
                      type="checkbox"
                      checked={customPrefs.preferences}
                      onChange={(e) =>
                        setCustomPrefs((prev) => ({ ...prev, preferences: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-sky-500 bg-black/40 border-white/20 focus:ring-sky-400 focus:ring-offset-0 cursor-pointer accent-sky-400"
                    />
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    Preserves your customized tactical view settings, sound volume, stadium chant toggles, and custom database modifications across sessions (<code className="text-zinc-300">functionality_storage</code>).
                  </p>
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRejectAll}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    Reject All
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    Accept All
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-black bg-sky-400 hover:bg-sky-300 shadow-md shadow-sky-500/20 transition text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  Save Preferences
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────
          3. DISCREET WITHDRAWAL / SETTINGS TRIGGER (Right to change)
          GDPR requires consent to be as easy to withdraw as to give.
          ────────────────────────────────────────────────────────── */}
      {hasDecision && !isModalOpen && (
        <button
          type="button"
          onClick={() => {
            const current = getStoredConsent();
            if (current) setCustomPrefs(current.preferences);
            setIsModalOpen(true);
          }}
          className="fixed bottom-2.5 left-2.5 z-[9000] p-2 rounded-xl bg-black/60 hover:bg-black/85 text-zinc-500 hover:text-sky-300 border border-white/10 backdrop-blur-sm shadow-md transition-all text-xs flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 opacity-70 hover:opacity-100"
          title="Privacy & Cookie Preferences"
          aria-label="Open Privacy and Cookie Settings"
        >
          <i className="fa-solid fa-shield-halved text-[11px]" aria-hidden="true"></i>
          <span className="hidden md:inline font-mono text-[10px]">Privacy & Cookies</span>
        </button>
      )}
    </>
  );
};
export default ConsentBanner;
