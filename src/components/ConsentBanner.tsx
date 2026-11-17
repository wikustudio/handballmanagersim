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

interface ConsentBannerProps {
  hasBottomDock?: boolean;
  isCourtside?: boolean;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  hasBottomDock = false,
  isCourtside = false,
}) => {
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
              className={`rounded-[22px] p-4 sm:p-5 relative overflow-hidden ${
                isCourtside
                  ? 'bg-white border border-black/[0.08] shadow-[0_18px_45px_rgba(15,23,42,0.16)] text-[#14161D]'
                  : 'bg-[#12131b]/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-zinc-200'
              }`}
            >
              {/* VIEW 1: Main Compact Pop-Up */}
              {viewMode === 'main' && (
                <div className="space-y-2.5">
                  {/* Top Bar: Label on Left, Close on Right */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-semibold tracking-wide ${
                        isCourtside ? 'text-[#686D7B]' : 'text-white/80 uppercase font-black tracking-wider text-[10px]'
                      }`}
                    >
                      Privacy &amp; Performance
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition border cursor-pointer ${
                        isCourtside
                          ? 'bg-[#F5F4F0] hover:bg-[#E7E4DC] text-[#525866] hover:text-[#14161D] border-black/[0.06]'
                          : 'w-6 h-6 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/10'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Heading */}
                  <h3
                    className={`text-sm sm:text-base font-bold tracking-tight leading-snug ${
                      isCourtside ? 'text-[#14161D]' : 'font-black text-white'
                    }`}
                  >
                    Transparency &amp; Analytics
                  </h3>

                  {/* Body Text */}
                  <p
                    className={`text-[12px] leading-relaxed font-normal ${
                      isCourtside ? 'text-[#525866]' : 'text-[11px] text-zinc-300'
                    }`}
                  >
                    We use anonymous analytics to understand visitor engagement with Handball Manager Sim and optimize site performance. In accordance with GDPR, tracking activates only with your consent.
                  </p>

                  {/* Bottom Action Row */}
                  <div className="pt-1.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Left: Pill Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAcceptAll}
                        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs transition active:scale-95 cursor-pointer whitespace-nowrap ${
                          isCourtside
                            ? 'bg-[#18191F] hover:bg-[#2A2D37] text-white font-semibold shadow-xs'
                            : 'bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] shadow'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Accept All</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRejectNonEssential}
                        className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-full border text-xs transition active:scale-95 cursor-pointer text-center whitespace-nowrap ${
                          isCourtside
                            ? 'bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] border-black/[0.06] font-semibold'
                            : 'bg-white/10 hover:bg-white/15 text-zinc-200 border-white/15 font-bold text-[11px]'
                        }`}
                      >
                        Essential Only
                      </button>
                    </div>

                    {/* Right: Text Links */}
                    <div
                      className={`flex items-center justify-end gap-3 text-[11px] shrink-0 ${
                        isCourtside ? 'text-[#525866]' : 'text-zinc-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={handleOpenCustomize}
                        className={`transition cursor-pointer font-medium underline underline-offset-2 ${
                          isCourtside ? 'hover:text-[#14161D]' : 'hover:text-white'
                        }`}
                      >
                        Customize
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('notice')}
                        className={`transition cursor-pointer font-medium underline underline-offset-2 ${
                          isCourtside ? 'hover:text-[#14161D]' : 'hover:text-white'
                        }`}
                      >
                        Privacy Notice
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: Granular Customize Settings */}
              {viewMode === 'customize' && (
                <div className="space-y-3">
                  <div
                    className={`flex items-center justify-between gap-2 border-b pb-2 ${
                      isCourtside ? 'border-black/[0.06]' : 'border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode('main')}
                      className={`p-1 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-medium ${
                        isCourtside
                          ? 'hover:bg-[#F5F4F0] text-[#525866] hover:text-[#14161D]'
                          : 'hover:bg-white/10 text-zinc-400 hover:text-white text-[11px]'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <span
                      className={`text-xs font-bold ${
                        isCourtside ? 'text-[#14161D]' : 'text-white uppercase tracking-wider text-[11px]'
                      }`}
                    >
                      Privacy Preferences
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                        isCourtside
                          ? 'hover:bg-[#F5F4F0] text-[#525866] hover:text-[#14161D]'
                          : 'w-5 h-5 hover:bg-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1 text-xs custom-scrollbar">
                    {/* Strictly Necessary */}
                    <div
                      className={`p-3 rounded-2xl border flex items-start justify-between gap-2.5 ${
                        isCourtside ? 'bg-[#F5F4F0] border-black/[0.06]' : 'bg-white/[0.04] border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div
                          className={`flex items-center gap-1.5 font-semibold text-xs ${
                            isCourtside ? 'text-[#14161D]' : 'font-bold text-white text-[11px]'
                          }`}
                        >
                          <Lock className={`w-3.5 h-3.5 ${isCourtside ? 'text-[#15803D]' : 'w-3 h-3 text-emerald-400'}`} />
                          <span>Strictly Necessary Storage</span>
                          <span
                            className={`text-[10px] font-semibold ${
                              isCourtside
                                ? 'text-[#15803D]'
                                : 'text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400'
                            }`}
                          >
                            · Required
                          </span>
                        </div>
                        <p className={`text-[11px] leading-normal ${isCourtside ? 'text-[#525866]' : 'text-[10px] text-zinc-400'}`}>
                          Retains career saves, tactics, finances, and roster states in browser storage.
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <div
                          className={`w-8 h-4.5 rounded-full p-0.5 flex items-center justify-end cursor-not-allowed ${
                            isCourtside ? 'bg-[#15803D]/80' : 'w-7 h-4 bg-emerald-600/70 opacity-80'
                          }`}
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center text-emerald-700">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div
                      className={`p-3 rounded-2xl border flex items-start justify-between gap-2.5 ${
                        isCourtside ? 'bg-[#F5F4F0] border-black/[0.06]' : 'bg-white/[0.04] border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div
                          className={`flex items-center gap-1.5 font-semibold text-xs ${
                            isCourtside ? 'text-[#14161D]' : 'font-bold text-white text-[11px]'
                          }`}
                        >
                          <BarChart3 className={`w-3.5 h-3.5 ${isCourtside ? 'text-[#0369A1]' : 'w-3 h-3 text-sky-400'}`} />
                          <span>Analytics &amp; Performance</span>
                        </div>
                        <p className={`text-[11px] leading-normal ${isCourtside ? 'text-[#525866]' : 'text-[10px] text-zinc-400'}`}>
                          Maps to `analytics_storage`. Measures simulation speed and game errors to optimize balance.
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <button
                          type="button"
                          role="switch"
                          aria-label="Toggle Analytics & Performance"
                          aria-checked={analytics}
                          onClick={() => setAnalytics(!analytics)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                            analytics
                              ? isCourtside
                                ? 'bg-[#18191F] justify-end'
                                : 'bg-sky-500 justify-end'
                              : isCourtside
                              ? 'bg-black/15 justify-start'
                              : 'bg-zinc-700 justify-start'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow" />
                        </button>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div
                      className={`p-3 rounded-2xl border flex items-start justify-between gap-2.5 ${
                        isCourtside ? 'bg-[#F5F4F0] border-black/[0.06]' : 'bg-white/[0.04] border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div
                          className={`flex items-center gap-1.5 font-semibold text-xs ${
                            isCourtside ? 'text-[#14161D]' : 'font-bold text-white text-[11px]'
                          }`}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isCourtside ? 'text-[#B45309]' : 'w-3 h-3 text-amber-400'}`} />
                          <span>Preferences &amp; UI</span>
                        </div>
                        <p className={`text-[11px] leading-normal ${isCourtside ? 'text-[#525866]' : 'text-[10px] text-zinc-400'}`}>
                          Retains sound settings, interface density, and custom database selections.
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <button
                          type="button"
                          role="switch"
                          aria-label="Toggle Preferences & UI"
                          aria-checked={preferences}
                          onClick={() => setPreferences(!preferences)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                            preferences
                              ? isCourtside
                                ? 'bg-[#18191F] justify-end'
                                : 'bg-amber-500 justify-end'
                              : isCourtside
                              ? 'bg-black/15 justify-start'
                              : 'bg-zinc-700 justify-start'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow" />
                        </button>
                      </div>
                    </div>

                    {/* Marketing */}
                    <div
                      className={`p-3 rounded-2xl border flex items-start justify-between gap-2.5 ${
                        isCourtside ? 'bg-[#F5F4F0] border-black/[0.06]' : 'bg-white/[0.04] border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div
                          className={`flex items-center gap-1.5 font-semibold text-xs ${
                            isCourtside ? 'text-[#14161D]' : 'font-bold text-white text-[11px]'
                          }`}
                        >
                          <Megaphone className={`w-3.5 h-3.5 ${isCourtside ? 'text-[#BE123C]' : 'w-3 h-3 text-rose-400'}`} />
                          <span>Attribution &amp; Outreach</span>
                        </div>
                        <p className={`text-[11px] leading-normal ${isCourtside ? 'text-[#525866]' : 'text-[10px] text-zinc-400'}`}>
                          Measures referral traffic from community forums and handball announcements.
                        </p>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <button
                          type="button"
                          role="switch"
                          aria-label="Toggle Attribution & Outreach"
                          aria-checked={marketing}
                          onClick={() => setMarketing(!marketing)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                            marketing
                              ? isCourtside
                                ? 'bg-[#18191F] justify-end'
                                : 'bg-rose-500 justify-end'
                              : isCourtside
                              ? 'bg-black/15 justify-start'
                              : 'bg-zinc-700 justify-start'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleRejectNonEssential}
                      className={`flex-1 py-2 rounded-full font-semibold text-xs transition cursor-pointer text-center ${
                        isCourtside
                          ? 'bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D]'
                          : 'rounded-xl py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px]'
                      }`}
                    >
                      Reject Optional
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className={`flex-1 py-2 rounded-full font-semibold text-xs transition cursor-pointer text-center ${
                        isCourtside
                          ? 'bg-[#18191F] hover:bg-[#2A2D37] text-white'
                          : 'rounded-xl py-1.5 bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] shadow'
                      }`}
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 3: Privacy Notice */}
              {viewMode === 'notice' && (
                <div className="space-y-3">
                  <div
                    className={`flex items-center justify-between gap-2 border-b pb-2 ${
                      isCourtside ? 'border-black/[0.06]' : 'border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode('main')}
                      className={`p-1 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-medium ${
                        isCourtside
                          ? 'hover:bg-[#F5F4F0] text-[#525866] hover:text-[#14161D]'
                          : 'hover:bg-white/10 text-zinc-400 hover:text-white text-[11px]'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <span
                      className={`text-xs font-bold ${
                        isCourtside ? 'text-[#14161D]' : 'text-white uppercase tracking-wider text-[11px]'
                      }`}
                    >
                      Privacy Notice
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="Close"
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                        isCourtside
                          ? 'hover:bg-[#F5F4F0] text-[#525866] hover:text-[#14161D]'
                          : 'w-5 h-5 hover:bg-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div
                    className={`space-y-2 text-xs leading-relaxed max-h-[38vh] overflow-y-auto pr-1 custom-scrollbar ${
                      isCourtside ? 'text-[#3E4452]' : 'text-[11px] text-zinc-300'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-2xl border space-y-0.5 ${
                        isCourtside ? 'bg-[#F5F4F0] border-black/[0.06]' : 'bg-white/[0.04] border-white/5'
                      }`}
                    >
                      <strong className={`block text-xs ${isCourtside ? 'text-[#14161D]' : 'text-white text-[11px]'}`}>
                        1. Data Controller &amp; Scope
                      </strong>
                      <p className={`text-[11px] ${isCourtside ? 'text-[#525866]' : 'text-[10px] text-zinc-400'}`}>
                        Handball Manager Sim processes data on your local device. No personal profiles are sold or transferred to data brokers.
                      </p>
                    </div>

                    <div
                      className={`p-2.5 rounded-2xl border space-y-0.5 ${
                        isCourtside ? 'bg-[#F5F4F0] border-black/[0.06]' : 'bg-white/[0.04] border-white/5'
                      }`}
                    >
                      <strong className={`block text-xs ${isCourtside ? 'text-[#14161D]' : 'text-white text-[11px]'}`}>
                        2. Legal Basis (GDPR Art. 6)
                      </strong>
                      <p className={`text-[11px] ${isCourtside ? 'text-[#525866]' : 'text-[10px] text-zinc-400'}`}>
                        - <strong>Necessary Data:</strong> Art. 6(1)(b) (gameplay save states).<br />
                        - <strong>Optional Analytics:</strong> Art. 6(1)(a) &amp; ePrivacy Directive Art. 5(3) (affirmative consent).
                      </p>
                    </div>

                    <div
                      className={`p-2.5 rounded-2xl border space-y-0.5 ${
                        isCourtside ? 'bg-[#F5F4F0] border-black/[0.06]' : 'bg-white/[0.04] border-white/5'
                      }`}
                    >
                      <strong className={`block text-xs ${isCourtside ? 'text-[#14161D]' : 'text-white text-[11px]'}`}>
                        3. Right of Withdrawal
                      </strong>
                      <p className={`text-[11px] ${isCourtside ? 'text-[#525866]' : 'text-[10px] text-zinc-400'}`}>
                        Withdraw or modify consent anytime via the bottom "Privacy Settings" button or the Header menu.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('main')}
                      className={`w-full py-2 rounded-full font-semibold text-xs transition cursor-pointer text-center ${
                        isCourtside
                          ? 'bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D]'
                          : 'rounded-xl py-1.5 bg-white/10 hover:bg-white/15 text-white font-bold text-[11px]'
                      }`}
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

      {/* Discreet Re-open Footer Link (in-flow at page bottom so it never overlaps HUD cards, per GDPR Art 7(3)) */}
      {!isOpen && (
        <footer
          className={`mt-auto w-full max-w-[1380px] mx-auto px-3 sm:px-6 pt-2 flex items-center justify-center sm:justify-start ${
            hasBottomDock ? 'pb-24 sm:pb-28' : 'pb-5'
          }`}
        >
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
            className={`px-3 py-1.5 rounded-full border transition active:scale-95 text-xs inline-flex items-center gap-1.5 cursor-pointer group ${
              isCourtside
                ? 'bg-white hover:bg-[#F7F6F2] border-black/[0.08] text-[#525866] hover:text-[#14161D] shadow-[0_2px_10px_rgba(15,23,42,0.04)]'
                : 'px-2.5 bg-[#12131b]/80 hover:bg-[#1a1b26] border-white/10 hover:border-white/20 text-zinc-400 hover:text-white opacity-70 hover:opacity-100'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isCourtside ? 'text-[#0369A1]' : 'text-sky-400'}`} />
            <span
              className={`text-[11px] font-medium ${
                isCourtside ? 'text-[#525866] group-hover:text-[#14161D]' : 'text-zinc-400 group-hover:text-zinc-200'
              }`}
            >
              Privacy Settings
            </span>
          </button>
        </footer>
      )}
    </>
  );
};
