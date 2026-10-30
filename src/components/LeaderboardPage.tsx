import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Club, GameState, Language } from '../types';
import { PressConferenceWall, SlotSelectionInfo } from './PressConferenceWall';
import { GlobalLeaderboard, LeaderboardEntry } from './GlobalLeaderboard';
import { SponsorCheckoutModal } from './SponsorCheckoutModal';
import { resolveLogoUrl } from '../utils/sponsorPresets';
import {
  fetchPressSponsors,
  fetchTop50Highscores,
  getQuickCachedSponsors,
  getQuickCachedHighscores,
  PressSponsor,
  saveLocalSponsor,
  partitionPressSlots,
  supabase,
  supabaseUrl,
  supabaseAnonKey
} from '../lib/supabaseClient';

interface LeaderboardPageProps {
  lang?: Language;
  gameState?: GameState | null;
  clubsDb?: Club[];
  initialHighscores?: LeaderboardEntry[];
  onBack: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  lang = 'en',
  gameState,
  clubsDb = [],
  initialHighscores,
  onBack
}) => {
  const [sponsors, setSponsors] = useState<PressSponsor[]>(() => getQuickCachedSponsors());
  const [highscores, setHighscores] = useState<LeaderboardEntry[]>(() =>
    initialHighscores && initialHighscores.length > 0 ? initialHighscores : getQuickCachedHighscores()
  );
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPackageTier, setSelectedPackageTier] = useState<'free_48h' | '30_days' | '90_days' | '1_year' | '1_day' | '1_week' | '1_month'>('30_days');
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<SlotSelectionInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const hasProcessedCheckoutReturn = useRef(false);

  // Sync external initialHighscores when provided or updated
  useEffect(() => {
    if (initialHighscores && initialHighscores.length > 0) {
      setHighscores(initialHighscores);
    }
  }, [initialHighscores]);

  // Load highscores from Supabase and local cache
  const loadHighscores = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const topScores = await fetchTop50Highscores();
      if (topScores && topScores.length > 0) {
        setHighscores(topScores);
      }
    } catch (e) {
      console.warn('Error loading highscores:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Load sponsors (also updates state when active array is empty so expired sponsors clear out)
  const loadSponsors = useCallback(async () => {
    try {
      const active = await fetchPressSponsors();
      if (Array.isArray(active)) {
        setSponsors(active);
      }
    } catch (e) {
      console.warn('Error fetching sponsors:', e);
    }
  }, []);

  // Check URL query parameters for return from Stripe checkout
  useEffect(() => {
    if (hasProcessedCheckoutReturn.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    const sponsorStatus = searchParams.get('sponsor_status');
    const sessionId = searchParams.get('session_id');
    const brand = searchParams.get('brand');
    const pkg = (searchParams.get('pkg') as any) || '30_days';
    const logo = searchParams.get('logo') || '';
    const link = searchParams.get('link') || '';
    const slot = searchParams.get('slot') || '';

    if (sponsorStatus === 'success') {
      hasProcessedCheckoutReturn.current = true;
      (async () => {
        let confirmed = false;

        try {
          const payload = {
            action: 'confirm',
            sessionId,
            brandName: brand,
            packageType: pkg,
            logoUrl: logo,
            linkUrl: link
          };

          // 1. Try local/Netlify /api/confirm-sponsor-session first
          let res = await fetch('/api/confirm-sponsor-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          // 2. If static drag-and-drop deploy returns 404/405, verify via Supabase Edge Function
          let usedEdgeFallback = false;
          if (res.status === 404 || res.status === 405) {
            usedEdgeFallback = true;
            res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
              },
              body: JSON.stringify(payload)
            });
          }

          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await res.json();
              if (data?.sponsor) {
                const resolvedLogo = resolveLogoUrl(data.sponsor.logo_url || logo);
                const finalLink = (data.sponsor.link_url || link || '').startsWith('http')
                  ? (data.sponsor.link_url || link)
                  : `https://${data.sponsor.link_url || link}`;
                const finalPkg = data.sponsor.package_type || pkg;

                const sponsorRecord: PressSponsor = {
                  id: data.sponsor.id || `sponsor-${sessionId || Date.now()}`,
                  brand_name: data.sponsor.brand_name || brand || 'Official Partner',
                  logo_url: resolvedLogo,
                  link_url: finalLink,
                  package_type: finalPkg,
                  tagline: data.sponsor.tagline || brand || 'Official Partner',
                  starts_at: data.sponsor.starts_at || new Date().toISOString(),
                  expires_at: data.sponsor.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
                  is_active: true,
                  is_headline: finalPkg === '90_days' || finalPkg === '1_year' || finalPkg === '1_week' || finalPkg === '1_month'
                };

                saveLocalSponsor(sponsorRecord);
                setSponsors((prev) => [sponsorRecord, ...prev.filter(s => s.brand_name.toLowerCase() !== sponsorRecord.brand_name.toLowerCase())]);

                // If verified via Edge Function fallback, persist the verified row into Supabase press_sponsors
                if (usedEdgeFallback && supabase) {
                  const { data: existing } = await supabase
                    .from('press_sponsors')
                    .select('id')
                    .eq('brand_name', sponsorRecord.brand_name)
                    .eq('is_active', true)
                    .gt('expires_at', new Date().toISOString())
                    .limit(1);

                  if (!existing || existing.length === 0) {
                    await supabase.from('press_sponsors').insert({
                      brand_name: sponsorRecord.brand_name,
                      logo_url: sponsorRecord.logo_url,
                      link_url: sponsorRecord.link_url,
                      package_type: sponsorRecord.package_type,
                      tagline: sponsorRecord.tagline,
                      starts_at: sponsorRecord.starts_at,
                      expires_at: sponsorRecord.expires_at,
                      is_active: true
                    });
                  }
                }

                confirmed = true;
                setNotification({
                  message: slot
                    ? `Official Partner Deal Confirmed! "${sponsorRecord.brand_name}" is now live on Slot #${slot}!`
                    : `Official Partner Deal Confirmed! "${sponsorRecord.brand_name}" is now live on the Press Conference Wall!`,
                  type: 'success'
                });
                try {
                  confetti({
                    particleCount: 90,
                    spread: 80,
                    origin: { y: 0.6 }
                  });
                } catch {
                  // Ignore confetti failure
                }
                loadSponsors();
              }
            }
          }
        } catch (e) {
          console.warn('Backend confirmation request failed:', e);
        }

        if (!confirmed) {
          setNotification({
            message: 'Unable to verify payment session with server. Please check your transaction or contact support.',
            type: 'error'
          });
        }

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      })();
    } else if (sponsorStatus === 'cancelled') {
      hasProcessedCheckoutReturn.current = true;
      setNotification({
        message: 'Contract checkout was cancelled. The press slot remains available whenever you are ready.',
        type: 'info'
      });
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [loadSponsors]);

  // Background non-blocking revalidation
  useEffect(() => {
    loadSponsors();
    loadHighscores();
  }, [loadSponsors, loadHighscores]);

  const handleSponsorCreated = (newSponsor: PressSponsor) => {
    setSponsors((prev) => [newSponsor, ...prev]);
    setIsCheckoutModalOpen(false);
    setNotification({
      message: `Commercial contract authorized! "${newSponsor.brand_name}" is now live on the press conference wall!`,
      type: 'success'
    });
  };

  const handleOpenCheckout = (packageType?: 'free_48h' | '30_days' | '90_days' | '1_year' | '1_day' | '1_week' | '1_month', slotInfo?: SlotSelectionInfo) => {
    if (packageType) setSelectedPackageTier(packageType);
    setSelectedSlotInfo(slotInfo || null);
    setIsCheckoutModalOpen(true);
  };

  const { availableCount } = partitionPressSlots(sponsors);

  return (
    <div className="w-full flex flex-col min-h-screen text-white text-left animate-fadeIn pt-6 sm:pt-8 md:pt-10 pb-20">
      {/* Top Breadcrumb & Action Navigation Bar with Generous Breathing Room */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-zinc-200 hover:text-white transition cursor-pointer flex items-center gap-2 group shrink-0 active:scale-95"
            title="Return to active career or dugout"
          >
            <i className="fa-solid fa-arrow-left text-xs group-hover:-translate-x-1 transition-transform"></i>
            <span>Back to Career</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <i className="fa-solid fa-trophy text-amber-400 text-lg"></i>
              <span>Leaderboard & Partners</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={() => handleOpenCheckout('30_days')}
            className="px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <i className="fa-solid fa-file-signature text-xs"></i>
            <span>Claim Sponsor Slot on Media Wall</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-black">
              Free 48h / €0.99
            </span>
            <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-black">
              {availableCount}/18 Open
            </span>
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-red-500/15 border-red-400/40 text-red-200'
              : 'bg-sky-500/15 border-sky-400/40 text-sky-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <i
              className={`fa-solid ${
                notification.type === 'success'
                  ? 'fa-circle-check text-emerald-400'
                  : notification.type === 'error'
                  ? 'fa-triangle-exclamation text-red-400'
                  : 'fa-circle-info text-sky-400'
              } text-sm`}
            ></i>
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/60 hover:text-white text-xs cursor-pointer ml-2"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* 1. Authentic Press Conference Sponsor Backdrop Wall (18 Slots) */}
      <PressConferenceWall
        sponsors={sponsors}
        onOpenCheckout={handleOpenCheckout}
        managerName={gameState?.managerName}
      />

      {/* 2. Global Leaderboard (Top 50 Managers & All Runs) */}
      <GlobalLeaderboard
        highscores={highscores}
        gameState={gameState}
        clubsDb={clubsDb}
        lang={lang}
        onRefresh={loadHighscores}
        isRefreshing={isRefreshing}
      />

      {/* 3. Self-Contained Deal Signing Room Modal */}
      <SponsorCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSponsorCreated={handleSponsorCreated}
        initialPackage={selectedPackageTier}
        currentManagerName={gameState?.managerName || 'Manager'}
        selectedSlot={selectedSlotInfo}
        isSoldOut={partitionPressSlots(sponsors).availableCount === 0}
      />
    </div>
  );
};

export default LeaderboardPage;