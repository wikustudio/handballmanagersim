import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  X,
  Check,
  Lock,
  BarChart3,
  Sparkles,
  Megaphone,
  ChevronLeft,
} from 'lucide-react';
import {
  getStoredConsent,
  saveConsent,
  acceptAllConsent,
  rejectNonEssentialConsent,
  StoredConsentState,
} from '../utils/consentManager';

type ViewMode = 'main' | 'customize' | 'notice';

export const ConsentBanner: React.FC = () => {
  const [consent, setConsent] = useState<StoredConsentState>(getStoredConsent);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('main');

  // Editable draft states for customize view
  const [analytics, setAnalytics] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<boolean>(false);
  const [marketing, setMarketing] = useState<boolean>(false);

  useEffect(() => {
    const current = getStoredConsent();
    setConsent(current);
    if (current.status === 'unconfigured') {
      const timer = setTimeout(() => setIsOpen(true), 350);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      const current = getStoredConsent();
      setConsent(current);
      setAnalytics(current.analytics);
      setPreferences(current.preferences);
      setMarketing(current.marketing);
      setViewMode('customize');
      setIsOpen(true);
    };

    const handleConsentChanged = (e: any) => {
      if (e.detail) {
        setConsent(e.detail);
      }
    };

    window.addEventListener('hms:open-consent', handleOpen);
    window.addEventListener('hms:consent-changed', handleConsentChanged);
    return () => {
      window.removeEventListener('hms:open-consent', handleOpen);
      window.removeEventListener('hms:consent-changed', handleConsentChanged);
    };
  }, []);

  const handleAcceptAll = () => {
    const updated = acceptAllConsent();
    setConsent(updated);
    setIsOpen(false);
    setViewMode('main');
  };

  const handleRejectNonEssential = () => {
    const updated = rejectNonEssentialConsent();
    setConsent(updated);
    setIsOpen(false);
    setViewMode('main');
  };

  const handleSavePreferences = () => {
    const updated = saveConsent({
      analytics,
      preferences,
      marketing,
    });
    setConsent(updated);
    setIsOpen(false);
    setViewMode('main');
  };

  const handleOpenCustomize = () => {
    setAnalytics(consent.analytics);
    setPreferences(consent.preferences);
    setMarketing(consent.marketing);
    setViewMode('customize');
  };

  const handleClose = () => {
    if (consent.status === 'unconfigured') {
      rejectNonEssentialConsent();
    }
    setIsOpen(false);
    setViewMode('main');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          /* Compact non-takeover bottom floating pop up */
          <div className="fixed bottom-3 left-3 right-3 sm:right-auto sm:left-5 sm:bottom-5 z-[10060] sm:w-[440px] max-w-full pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              role="region"
              aria-label="Privacy & Performance Preferences"
              className="bg-[#12131b]/95 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-4.5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-zinc-200 relative overflow-hidden"
            >
              {/* VIEW 1: Main Compact Pop-Up */}
              {viewMode === 'main' && (
                <div className="space-y-2.5">
                  {/* Top Bar: Label on Left, Close on Right */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black tracking-wider uppercase text-white/80">
                      PRIVACY & PERFORMANCE
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/10 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Heading */}
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-snug">
                    Transparency & Analytics
                  </h3>

                  {/* Body Text */}
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-normal">
                    We use anonymous analytics to understand visitor engagement with Handball Manager Sim and optimize site performance. In accordance with GDPR, tracking activates only with your consent.
                  </p>

                  {/* Bottom Action Row */}
                  <div className="pt-1.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Left: Pill Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAcceptAll}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] shadow transition active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Accept All</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRejectNonEssential}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/15 font-bold text-[11px] transition active:scale-95 cursor-pointer text-center whitespace-nowrap"
                      >
                        Essential Only
                      </button>
                    </div>

                    {/* Right: Text Links */}
                    <div className="flex items-center justify-end gap-2.5 text-[11px] text-zinc-300 shrink-0">
                      <button
                        type="button"
                        onClick={handleOpenCustomize}
                        className="hover:text-white transition cursor-pointer font-medium underline underline-offset-2"
                      >
                        Customize
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('notice')}
                        className="hover:text-white transition cursor-pointer font-medium underline underline-offset-2"
                      >
                        Privacy Notice
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: Granular Customize Settings */}
              {viewMode === 'customize' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('main')}
                      className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Preferences
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className="w-5 h-5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1 text-[11px]">
                    {/* Strictly Necessary */}
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          <span>Strictly Necessary Storage</span>
                          <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400">
                            Required
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          Retains career saves, tactics, finances, and roster states in browser storage.
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <div className="w-7 h-4 rounded-full bg-emerald-600/70 p-0.5 flex items-center justify-end opacity-80 cursor-not-allowed">
                          <div className="w-3 h-3 rounded-full bg-white flex items-center justify-center text-emerald-700">
                            <Check className="w-2 h-2 stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                          <BarChart3 className="w-3 h-3 text-sky-400" />
                          <span>Analytics & Performance</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          Maps to `analytics_storage`. Measures simulation speed and game errors to optimize balance.
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={analytics}
                          onClick={() => setAnalytics(!analytics)}
                          className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                            analytics ? 'bg-sky-500 justify-end' : 'bg-zinc-700 justify-start'
                          }`}
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                        </button>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Preferences & UI</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          Retains sound settings, interface density, and custom database selections.
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={preferences}
                          onClick={() => setPreferences(!preferences)}
                          className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                            preferences ? 'bg-amber-500 justify-end' : 'bg-zinc-700 justify-start'
                          }`}
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                        </button>
                      </div>
                    </div>

                    {/* Marketing */}
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                          <Megaphone className="w-3 h-3 text-rose-400" />
                          <span>Attribution & Outreach</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          Measures referral traffic from community forums and handball announcements.
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={marketing}
                          onClick={() => setMarketing(!marketing)}
                          className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                            marketing ? 'bg-rose-500 justify-end' : 'bg-zinc-700 justify-start'
                          }`}
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleRejectNonEssential}
                      className="flex-1 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px] transition cursor-pointer text-center"
                    >
                      Reject Optional
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className="flex-1 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] shadow transition cursor-pointer text-center"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 3: Privacy Notice */}
              {viewMode === 'notice' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('main')}
                      className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Privacy Notice
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className="w-5 h-5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-zinc-300 leading-relaxed max-h-[38vh] overflow-y-auto pr-1">
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5 space-y-0.5">
                      <strong className="text-white block text-[11px]">1. Data Controller & Scope</strong>
                      <p className="text-[10px] text-zinc-400">
                        Handball Manager Sim processes data on your local device. No personal profiles are sold or transferred to data brokers.
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5 space-y-0.5">
                      <strong className="text-white block text-[11px]">2. Legal Basis (GDPR Art. 6)</strong>
                      <p className="text-[10px] text-zinc-400">
                        - <strong>Necessary Data:</strong> Art. 6(1)(b) (gameplay save states).<br />
                        - <strong>Optional Analytics:</strong> Art. 6(1)(a) & ePrivacy Directive Art. 5(3) (affirmative consent).
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5 space-y-0.5">
                      <strong className="text-white block text-[11px]">3. Right of Withdrawal</strong>
                      <p className="text-[10px] text-zinc-400">
                        Withdraw or modify consent anytime via the bottom "Privacy Settings" button or the Header menu.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('main')}
                      className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] transition cursor-pointer text-center"
                    >
                      Back to Privacy Choices
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Discreet Re-open Button (bottom left, unobtrusive per GDPR Art 7(3)) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            const current = getStoredConsent();
            setConsent(current);
            setAnalytics(current.analytics);
            setPreferences(current.preferences);
            setMarketing(current.marketing);
            setViewMode('customize');
            setIsOpen(true);
          }}
          title="Privacy & Cookie Preferences"
          aria-label="Privacy & Cookie Preferences"
          className="fixed bottom-3 left-3 z-40 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-[#12131b]/90 hover:bg-[#1a1b26] border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white shadow-lg backdrop-blur transition active:scale-95 text-xs flex items-center gap-1.5 cursor-pointer group opacity-60 hover:opacity-100"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">
            Privacy Settings
          </span>
        </button>
      )}
    </>
  );
};
