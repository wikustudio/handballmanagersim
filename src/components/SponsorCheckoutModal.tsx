import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { SPONSOR_PACKAGES, PressSponsor, registerActiveSponsor } from '../lib/supabaseClient';
import { validateSponsorContent } from '../utils/sponsorModeration';
import { PRESET_LOGOS, resolveLogoUrl } from '../utils/sponsorPresets';
import { createCheckoutSession } from '../lib/stripeClientService';

export interface SlotSelectionInfo {
  slotNumber: number;
  slotLabel: string;
  isPremium: boolean;
}

interface SponsorCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSponsorCreated: (sponsor: PressSponsor) => void;
  initialPackage?: 'free_48h' | '30_days' | '90_days' | '1_year' | '1_day' | '1_week' | '1_month';
  currentManagerName?: string;
  selectedSlot?: SlotSelectionInfo | null;
  isSoldOut?: boolean;
}

export type PackageKey = 'free_48h' | '30_days' | '90_days' | '1_year';

const normalizePackageKey = (key?: string): PackageKey => {
  if (key === 'free_48h') return 'free_48h';
  if (key === '1_month' || key === '1_year') return '1_year';
  if (key === '1_week' || key === '90_days') return '90_days';
  return '30_days';
};

const TIER_DETAILS = {
  free_48h: {
    badge: 'Community',
    title: '48 Hours',
    subtext: '1x Free Trial',
    price: 'FREE',
    cardBorderActive: 'border-zinc-400 bg-zinc-500/15 ring-1 ring-zinc-400/50 shadow-md',
    previewBorder: 'border-zinc-700 bg-[#161822] shadow-[0_0_15px_rgba(255,255,255,0.03)]',
    previewBadgeText: 'COMMUNITY SPOTLIGHT (48H)',
    previewBadgeStyle: 'bg-zinc-800 text-zinc-300 border border-zinc-700/60',
    accentText: 'text-zinc-300'
  },
  '30_days': {
    badge: 'Supporter',
    title: '30 Days',
    subtext: 'Monthly Partner',
    price: `€${SPONSOR_PACKAGES['30_days'].priceEur.toFixed(2)}`,
    cardBorderActive: 'border-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-400/50 shadow-md shadow-emerald-500/10',
    previewBorder: 'border-emerald-400/35 bg-gradient-to-r from-emerald-500/10 via-[#181b28] to-teal-500/5 shadow-[0_0_20px_rgba(52,211,153,0.12)]',
    previewBadgeText: 'OFFICIAL SUPPORTER',
    previewBadgeStyle: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40',
    accentText: 'text-emerald-400'
  },
  '90_days': {
    badge: 'Popular',
    title: '90 Days',
    subtext: 'Season Partner',
    price: `€${SPONSOR_PACKAGES['90_days'].priceEur.toFixed(2)}`,
    cardBorderActive: 'border-sky-400 bg-sky-500/15 ring-1 ring-sky-400/50 shadow-md shadow-sky-500/10',
    previewBorder: 'border-sky-400/40 bg-gradient-to-r from-sky-500/15 via-[#181b28] to-indigo-500/5 shadow-[0_0_25px_rgba(56,189,248,0.15)]',
    previewBadgeText: '⭐ SEASON PARTNER',
    previewBadgeStyle: 'bg-sky-400/20 text-sky-300 border border-sky-400/40',
    accentText: 'text-sky-400'
  },
  '1_year': {
    badge: 'Crown VIP',
    title: '1 Year',
    subtext: 'Title Sponsor',
    price: `€${SPONSOR_PACKAGES['1_year'].priceEur.toFixed(2)}`,
    cardBorderActive: 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50 shadow-md shadow-amber-500/10',
    previewBorder: 'border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-[#181b28] to-amber-500/5 shadow-[0_0_25px_rgba(251,191,36,0.15)]',
    previewBadgeText: '👑 OFFICIAL TITLE PARTNER',
    previewBadgeStyle: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
    accentText: 'text-amber-400'
  }
};

export const SponsorCheckoutModal: React.FC<SponsorCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSponsorCreated,
  initialPackage = '30_days',
  currentManagerName = 'Manager',
  selectedSlot = null,
  isSoldOut = false
}) => {
  const [hasClaimedFree, setHasClaimedFree] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('fms_free_sponsor_claimed_v1') === 'true';
  });
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>(() => normalizePackageKey(initialPackage));
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState(PRESET_LOGOS[0].url);
  const [customLogoInput, setCustomLogoInput] = useState('');
  const [useCustomLogo, setUseCustomLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial package and clear error state when modal opens
  useEffect(() => {
    if (isOpen) {
      const isClaimed = typeof window !== 'undefined' && localStorage.getItem('fms_free_sponsor_claimed_v1') === 'true';
      setHasClaimedFree(isClaimed);
      const pkg = normalizePackageKey(initialPackage);
      if (pkg === 'free_48h' && isClaimed) {
        setSelectedPackage('30_days');
      } else {
        setSelectedPackage(pkg);
      }
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [initialPackage, isOpen]);

  // Isolate Escape key so closing sponsor checkout does not close parent PressConferenceWall
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPkg = (SPONSOR_PACKAGES as any)[selectedPackage] || SPONSOR_PACKAGES['30_days'];
  const activeLogo = useCustomLogo && customLogoInput.trim() ? customLogoInput.trim() : logoUrl?.trim() || PRESET_LOGOS[0].url;
  const activeTierMeta = TIER_DETAILS[selectedPackage];

  const handleSubmit = async () => {
    if (isSoldOut && selectedPackage !== 'free_48h') {
      setErrorMessage('The Press Wall is at full capacity (18/18 slots occupied). Please wait for an active slot to expire.');
      return;
    }
    if (!brandName.trim()) {
      setErrorMessage('Please enter your Brand or Channel name.');
      return;
    }
    if (!linkUrl.trim()) {
      setErrorMessage('Please enter your website or social profile URL.');
      return;
    }

    const moderation = validateSponsorContent({
      brandName: brandName.trim(),
      tagline: tagline.trim(),
      linkUrl: linkUrl.trim()
    });

    if (!moderation.isValid) {
      setErrorMessage(moderation.reason || 'Prohibited content detected.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    // Free 48h Community Trial (No Stripe checkout)
    if (selectedPackage === 'free_48h') {
      if (hasClaimedFree) {
        setErrorMessage('You have already claimed your 1x free 48h community spot. Please select a supporter tier.');
        setIsSubmitting(false);
        return;
      }

      try {
        const newSponsor = await registerActiveSponsor({
          brand_name: brandName.trim(),
          logo_url: activeLogo,
          link_url: linkUrl.trim(),
          package_type: 'free_48h',
          tagline: tagline.trim() || brandName.trim()
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('fms_free_sponsor_claimed_v1', 'true');
        }
        setHasClaimedFree(true);
        setIsSubmitting(false);

        try {
          confetti({
            particleCount: 85,
            spread: 75,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }

        onSponsorCreated(newSponsor);
        return;
      } catch (err: any) {
        console.error('Free Sponsor Activation Error:', err);
        setErrorMessage(err.message || 'Could not activate free sponsor slot. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    // Paid tiers proceed to Stripe checkout session
    try {
      const { checkoutUrl } = await createCheckoutSession({
        packageType: selectedPackage as '30_days' | '90_days' | '1_year',
        brandName: brandName.trim(),
        tagline: tagline.trim() || brandName.trim(),
        logoUrl: activeLogo,
        linkUrl: linkUrl.trim(),
        slotNumber: selectedSlot?.slotNumber
      });

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received.');
      }
    } catch (err: any) {
      console.error('Stripe Checkout Error:', err);
      setErrorMessage(err.message || 'Could not connect to payment gateway. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-2.5 sm:p-5 overflow-y-auto overscroll-contain cursor-pointer"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-[#131622]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-4 sm:p-6 text-left shadow-[0_12px_45px_rgba(0,0,0,0.7)] text-white relative cursor-default my-auto max-h-[90vh] flex flex-col min-h-0 shrink-0 overflow-y-auto overscroll-contain custom-scrollbar"
        >
          {/* Subtle Ambient Sky Accent Gradients */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          {/* 1. Header */}
          <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-3 mb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <i className="fa-solid fa-handshake text-sky-400"></i>
                <span>Become an Official Partner</span>
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5">
                Feature your brand on the digital press conference wall. One-time payment, no subscription.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition shrink-0 cursor-pointer"
              title="Close"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          {/* Sold Out Notice */}
          {isSoldOut && selectedPackage !== 'free_48h' && (
            <div className="relative z-10 mb-3 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <i className="fa-solid fa-lock text-rose-400 text-sm shrink-0"></i>
              <span>
                <strong>Press Wall is Full (18/18 Active):</strong> All commercial slots are currently occupied. To guarantee maximum exposure for existing partners, new deals cannot be signed until an active slot expires.
              </span>
            </div>
          )}

          {/* Assigned Slot Confirmation Card */}
          {selectedSlot && !isSoldOut && (
            <div className="relative z-10 mb-3 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <i className={`fa-solid ${selectedSlot.isPremium ? 'fa-crown text-amber-400' : 'fa-th-large text-sky-400'}`}></i>
                <span>
                  Reserving: <strong className="text-white font-black">{selectedSlot.slotLabel}</strong>
                </span>
              </div>
              <span className="text-[10px] text-amber-400/80 font-mono font-bold uppercase tracking-wider">
                Assigned on Checkout
              </span>
            </div>
          )}

          {/* 2. Package Selection (Responsive 4-tile grid) */}
          <div className="relative z-10 mb-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Select Placement Tier
              </span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Zero Risk · Instant Activation
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['free_48h', '30_days', '90_days', '1_year'] as PackageKey[]).map((pkgKey) => {
                const meta = TIER_DETAILS[pkgKey];
                const isSelected = selectedPackage === pkgKey;
                const isFree = pkgKey === 'free_48h';
                const isDisabled = isFree && hasClaimedFree;

                return (
                  <button
                    key={pkgKey}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) setSelectedPackage(pkgKey);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isDisabled
                        ? 'bg-white/[0.02] border-white/[0.05] opacity-50 cursor-not-allowed'
                        : isSelected
                        ? meta.cardBorderActive
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[8px] uppercase font-black tracking-wider truncate ${meta.accentText}`}>
                          {meta.badge}
                        </span>
                        {isFree && hasClaimedFree && (
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Claimed
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-black text-white truncate mt-0.5">
                        {meta.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium truncate">
                        {meta.subtext}
                      </div>
                    </div>
                    <div className={`text-sm font-black mt-1.5 ${meta.accentText}`}>
                      {meta.price}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Brand & Destination Details */}
          <div className="relative z-10 mb-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Brand / Channel Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Tactical Lab"
                  maxLength={40}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/[0.12] rounded-lg text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Destination URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/[0.12] rounded-lg text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Short Tagline <span className="text-zinc-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Weekly Football Analytics & Matchday Tactics"
                maxLength={60}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/[0.12] rounded-lg text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* 4. Logo Picker */}
          <div className="relative z-10 mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                Logo Icon
              </label>
              <button
                type="button"
                onClick={() => setUseCustomLogo(!useCustomLogo)}
                className="text-[10px] text-amber-400 hover:text-amber-300 transition cursor-pointer font-bold"
              >
                {useCustomLogo ? 'Pick from Presets' : 'Custom Image URL'}
              </button>
            </div>

            {useCustomLogo ? (
              <input
                type="url"
                value={customLogoInput}
                onChange={(e) => setCustomLogoInput(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-1.5 bg-black/40 border border-white/[0.12] rounded-lg text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
              />
            ) : (
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_LOGOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLogoUrl(preset.url);
                      setUseCustomLogo(false);
                    }}
                    className={`p-1 rounded-lg border flex flex-col items-center gap-0.5 transition cursor-pointer ${
                      !useCustomLogo && logoUrl === preset.url
                        ? 'border-amber-400 bg-amber-500/20'
                        : 'border-white/[0.08] bg-black/30 hover:bg-white/[0.06]'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded object-cover" />
                    <span className="text-[8px] text-zinc-400 truncate w-full text-center">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. Broadcast TV Backdrop Live Preview */}
          <div className={`relative z-10 mb-3.5 p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${activeTierMeta.previewBorder}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-black/70 border border-white/20 shrink-0 p-1 flex items-center justify-center">
                <img
                  src={resolveLogoUrl(activeLogo)}
                  alt="Preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_LOGOS[0].url;
                  }}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-white text-xs sm:text-sm truncate">
                    {brandName.trim() || 'Your Brand Name'}
                  </span>
                  <span className={`text-[8px] sm:text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase ${activeTierMeta.previewBadgeStyle}`}>
                    {activeTierMeta.previewBadgeText}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {tagline.trim() || linkUrl.trim() || 'Official Press Wall Partner'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={linkUrl.trim() ? (linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!linkUrl.trim()) e.preventDefault();
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1.5 ${
                  linkUrl.trim()
                    ? 'bg-white/[0.08] hover:bg-white/[0.15] border-white/20 text-white cursor-pointer active:scale-95'
                    : 'bg-white/[0.02] border-white/[0.05] text-zinc-500 cursor-not-allowed pointer-events-none'
                }`}
                title="Test outbound destination URL"
              >
                <span>Test Link</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
              </a>
            </div>
          </div>

          {errorMessage && (
            <div className="relative z-10 mb-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation shrink-0"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 6. Action Footer */}
          <div className="relative z-10 flex items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
              <i className={`fa-solid ${selectedPackage === 'free_48h' ? 'fa-bolt text-teal-400' : 'fa-lock text-emerald-400'} text-xs shrink-0`}></i>
              <span className="truncate">
                {selectedPackage === 'free_48h'
                  ? 'Instant zero-cost activation (1x trial)'
                  : 'One-time checkout via Stripe'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl border border-white/[0.1] text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (isSoldOut && selectedPackage !== 'free_48h') || (selectedPackage === 'free_48h' && hasClaimedFree)}
                className={`px-4 sm:px-5 py-2 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 ${
                  selectedPackage === 'free_48h'
                    ? hasClaimedFree
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-black'
                    : isSoldOut
                    ? 'bg-zinc-600 text-zinc-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span>{selectedPackage === 'free_48h' ? 'Activating...' : 'Redirecting...'}</span>
                  </>
                ) : selectedPackage === 'free_48h' ? (
                  hasClaimedFree ? (
                    <>
                      <i className="fa-solid fa-ban text-xs"></i>
                      <span>Trial Claimed</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-bolt text-xs"></i>
                      <span>Activate Free 48h Spot</span>
                    </>
                  )
                ) : isSoldOut ? (
                  <>
                    <i className="fa-solid fa-lock text-xs"></i>
                    <span>Wall Sold Out (18/18 Full)</span>
                  </>
                ) : (
                  <>
                    <span>Sign Deal • €{currentPkg?.priceEur ? currentPkg.priceEur.toFixed(2) : '0.99'}</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SponsorCheckoutModal;
