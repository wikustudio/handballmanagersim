import React, { useState } from 'react';
import {
  PressSponsor,
  partitionPressSlots,
  TOTAL_PRESS_SLOTS,
  HEADLINE_SLOTS_COUNT,
  GRID_SLOTS_COUNT
} from '../lib/supabaseClient';
import { resolveLogoUrl, PRESET_LOGOS } from '../utils/sponsorPresets';

const SVG_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0b1329"/><circle cx="50" cy="50" r="30" fill="none" stroke="#38bdf8" stroke-width="3"/><path d="M40 50h20M50 40v20" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/></svg>'
  );

// Authentic dark brand palettes for the digital LED wall blocks (no glaring white backgrounds)
const BRAND_THEMES = [
  { bg: 'bg-[#0f172a]', border: 'border-sky-500/40', text: 'text-white', subtext: 'text-sky-200/80' }, // PS4 / Sony Navy
  { bg: 'bg-[#7f1d1d]', border: 'border-red-400/40', text: 'text-white', subtext: 'text-red-200/80' }, // Santander / Nissan Red
  { bg: 'bg-[#064e3b]', border: 'border-emerald-400/40', text: 'text-white', subtext: 'text-emerald-200/80' }, // Heineken Green
  { bg: 'bg-[#18181b]', border: 'border-zinc-700/60', text: 'text-white', subtext: 'text-zinc-400' }, // Mastercard Carbon
  { bg: 'bg-[#1e1b4b]', border: 'border-indigo-400/40', text: 'text-white', subtext: 'text-indigo-200/80' }, // Night Blue
  { bg: 'bg-[#451a03]', border: 'border-amber-400/40', text: 'text-amber-100', subtext: 'text-amber-300/80' }, // Gold Bronze
  { bg: 'bg-[#172554]', border: 'border-blue-400/50', text: 'text-white', subtext: 'text-blue-200/80' } // UEFA Deep Royal Blue
];

export interface SlotSelectionInfo {
  slotNumber: number;
  slotLabel: string;
  isPremium: boolean;
}

export interface HouseFallbackData {
  brand_name: string;
  link_url?: string;
  tagline: string;
  badge: string;
  logo_url: string;
  isSample: boolean;
}

export const ROW_FALLBACKS: Record<number, HouseFallbackData> = {
  0: {
    brand_name: 'Buy Me a Coffee',
    link_url: 'https://buymeacoffee.com/willykuhne',
    tagline: 'Support Late-Night Engine Updates',
    badge: 'Supporter',
    logo_url: PRESET_LOGOS[2].url,
    isSample: false
  },
  1: {
    brand_name: 'Tactical Lab Pro',
    tagline: 'Your Brand Here · Click to Claim Slot',
    badge: 'Sample',
    logo_url: PRESET_LOGOS[0].url,
    isSample: true
  },
  2: {
    brand_name: 'Ultras Curva Zine',
    tagline: 'Your Channel Here · Free 48h Trial',
    badge: 'Sample',
    logo_url: PRESET_LOGOS[3].url,
    isSample: true
  }
};

interface PressConferenceWallProps {
  sponsors: PressSponsor[];
  onOpenCheckout: (packageType?: 'free_48h' | '30_days' | '90_days' | '1_year' | '1_day' | '1_week' | '1_month', slotInfo?: SlotSelectionInfo) => void;
  isLoading?: boolean;
  managerName?: string;
}

export const PressConferenceWall: React.FC<PressConferenceWallProps> = ({
  sponsors,
  onOpenCheckout,
  isLoading = false,
  managerName
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(true);

  const displayManagerName = (managerName && managerName.trim()) ? managerName.trim() : 'Managers';
  const { headlineSlots, gridSlots, occupiedCount, availableCount } = partitionPressSlots(sponsors);

  // Generate 3 distinct scrolling tracks of sponsor tiles for the digital LED wall effect
  const createTrackItems = (rowIndex: number) => {
    const items: Array<
      | { type: 'sponsor'; data: PressSponsor }
      | { type: 'house'; data: HouseFallbackData; slotNumber: number }
      | { type: 'slot'; index: number; tier: '30_days' | '90_days' }
    > = [];
    const chunkSize = 5;
    const rowSlots = gridSlots.slice(rowIndex * chunkSize, (rowIndex + 1) * chunkSize);

    const hasHouseFallback = Boolean(ROW_FALLBACKS[rowIndex]);
    let housePlaced = false;

    rowSlots.forEach((sponsor, i) => {
      const slotNum = rowIndex * chunkSize + i + 1;
      if (sponsor) {
        items.push({ type: 'sponsor', data: sponsor });
      } else if (hasHouseFallback && !housePlaced && i === 1) {
        items.push({
          type: 'house',
          data: ROW_FALLBACKS[rowIndex],
          slotNumber: slotNum
        });
        housePlaced = true;
      } else {
        items.push({ type: 'slot', index: slotNum, tier: '30_days' });
      }
    });

    // If house fallback wasn't placed because slot i === 1 was occupied or row has fewer slots:
    if (hasHouseFallback && !housePlaced) {
      const firstOpenSlotIdx = items.findIndex(it => it.type === 'slot');
      if (firstOpenSlotIdx !== -1) {
        const slotItem = items[firstOpenSlotIdx] as { type: 'slot'; index: number; tier: '30_days' | '90_days' };
        items[firstOpenSlotIdx] = {
          type: 'house',
          data: ROW_FALLBACKS[rowIndex],
          slotNumber: slotItem.index
        };
        housePlaced = true;
      }
    }

    while (items.length < 8) {
      items.push({ type: 'slot', index: items.length + 1, tier: '30_days' });
    }

    return [...items, ...items];
  };

  const row1Items = createTrackItems(0);
  const row2Items = createTrackItems(1);
  const row3Items = createTrackItems(2);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-[#131622]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] mb-8 select-none">
      {/* Subtle Ambient Sky Accent Gradients (matching Dashboard Header) */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* ──────────────────────────────────────────────────────────
          1. Header: Official Partners (Single Title in Crisp White)
          ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-5 sm:px-7 py-4.5 bg-white/[0.02] border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Official Partners */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <i className="fa-solid fa-handshake text-sky-400 text-lg"></i>
            <span>Official Partners</span>
          </h2>
          <span
            className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${
              availableCount === 0
                ? 'text-rose-400 bg-rose-500/10 border-rose-400/30'
                : 'text-amber-400 bg-white/[0.05] border-white/[0.08]'
            }`}
          >
            {occupiedCount}/{TOTAL_PRESS_SLOTS} {availableCount === 0 ? 'Full · Sold Out' : 'Active'}
          </span>
        </div>

        {/* Right: Controls & CTA */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsMoving(!isMoving)}
            title="Toggle wall motion"
            className="px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
          >
            <i className={`fa-solid ${isMoving ? 'fa-pause' : 'fa-play'} text-[10px]`}></i>
            <span>{isMoving ? 'Pause Wall' : 'Resume Motion'}</span>
          </button>

          {availableCount === 0 ? (
            <button
              type="button"
              disabled
              title="All 18 slots are currently occupied. Check back when an active slot expires!"
              className="px-4 py-2 rounded-xl bg-white/[0.08] text-zinc-400 font-bold text-xs border border-white/[0.1] cursor-not-allowed flex items-center gap-2 opacity-70"
            >
              <i className="fa-solid fa-lock text-xs"></i>
              <span>Wall Full (18/18 Sold Out)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenCheckout('30_days')}
              className="group relative px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-black text-xs shadow-md hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <i className="fa-solid fa-file-signature text-xs group-hover:rotate-12 transition-transform"></i>
              <span>Sign Sponsor Deal</span>
              <span className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded text-black font-extrabold">
                Free 48h / €0.99
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. Competition Logo Banner (Clean Repeating Ribbon)
          ────────────────────────────────────────────────────────── */}
      <div className="relative py-2.5 px-4 bg-black/30 border-b border-white/[0.05] flex items-center justify-between overflow-hidden">
        <div className="flex items-center justify-around w-full opacity-60 whitespace-nowrap text-zinc-300 text-xs font-black tracking-widest uppercase gap-6">
          <div className="flex items-center gap-2">
            <i className="fa-regular fa-futbol text-white text-sm"></i>
            <span>Football Manager Sim</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fa-regular fa-futbol text-white text-sm"></i>
            <span>Football Manager Sim</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <i className="fa-regular fa-futbol text-white text-sm"></i>
            <span>Football Manager Sim</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <i className="fa-regular fa-futbol text-white text-sm"></i>
            <span>Football Manager Sim</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          3. Premium Partners Tier
          ────────────────────────────────────────────────────────── */}
      <div className="relative px-4 sm:px-6 pt-4.5 pb-3 bg-white/[0.015]">
        <div className="flex items-center justify-between mb-2.5 text-xs">
          <div className="flex items-center gap-2 font-black uppercase tracking-wider text-amber-300">
            <i className="fa-solid fa-crown text-amber-400 text-sm"></i>
            <span>Premium Partners ({HEADLINE_SLOTS_COUNT} Pinned Prime Slots)</span>
          </div>
          <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
            Pinned centerstage · 90 Days or 1 Year
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {headlineSlots.map((sponsor, idx) => {
            if (sponsor) {
              return (
                <a
                  key={sponsor.id}
                  href={sponsor.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-white/[0.03] to-black/40 border border-amber-400/40 hover:border-amber-400/80 shadow-md transition-all cursor-pointer flex items-center gap-3 overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-lg bg-black/70 border border-amber-400/30 shrink-0 p-1 flex items-center justify-center shadow">
                    <img
                      src={resolveLogoUrl(sponsor.logo_url)}
                      alt={sponsor.brand_name}
                      className="w-full h-full object-contain rounded group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = SVG_FALLBACK;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-white text-sm truncate group-hover:text-amber-300 transition-colors">
                        {sponsor.brand_name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-400 text-black shrink-0">
                        Premium Partner
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                      {sponsor.tagline || 'Official Premium Partner'}
                    </p>
                    <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                      <span>Visit</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
                    </div>
                  </div>
                </a>
              );
            }

            // Fallback for Premium Slot #3 (idx === 2) when open: Wiku Studio
            if (idx === 2) {
              return (
                <a
                  key="house-wiku-studio"
                  href="https://wiku.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-white/[0.03] to-black/40 border border-emerald-400/40 hover:border-emerald-400/80 shadow-md transition-all cursor-pointer flex items-center gap-3 overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-lg bg-black/70 border border-emerald-400/30 shrink-0 p-1 flex items-center justify-center shadow">
                    <img
                      src={PRESET_LOGOS[0].url}
                      alt="Wiku Studio"
                      className="w-full h-full object-contain rounded group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-white text-sm truncate group-hover:text-emerald-300 transition-colors">
                        Wiku Studio
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-400 text-black shrink-0">
                        Creator
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                      Official Game Studio & Football Lab
                    </p>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                      <span>Visit</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
                    </div>
                  </div>
                </a>
              );
            }

            // Vacant Premium Partner Slot
            return (
              <button
                key={`vacant-premium-${idx}`}
                type="button"
                onClick={() =>
                  onOpenCheckout('90_days', {
                    slotNumber: idx + 1,
                    slotLabel: `Premium Partner Slot #${idx + 1}`,
                    isPremium: true
                  })
                }
                className="group relative p-3 rounded-xl border-2 border-dashed border-amber-400/30 hover:border-amber-400 bg-amber-500/[0.03] hover:bg-amber-500/[0.08] transition-all text-left cursor-pointer flex items-center gap-3 overflow-hidden"
              >
                <div className="w-12 h-12 rounded-lg border border-dashed border-amber-400/50 group-hover:border-amber-400 flex items-center justify-center text-amber-400 shrink-0 bg-black/40">
                  <i className="fa-solid fa-crown text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-extrabold text-amber-200 text-xs sm:text-sm truncate block">
                    Premium Partner Slot #{idx + 1} Open
                  </span>
                  <span className="text-[11px] text-zinc-400 block truncate">
                    Centerstage placement from €2.49 · 90 Days
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold block mt-0.5 group-hover:underline">
                    Claim Premium Partner Spot →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          4. The Moving Digital LED Wall
          ────────────────────────────────────────────────────────── */}
      <div className="relative py-3.5 bg-black/40 border-y border-white/[0.05] overflow-hidden">
        {/* Subtle Vignettes for Horizon Fade */}
        <div className="absolute top-0 left-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-[#131622] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-[#131622] to-transparent z-10 pointer-events-none" />

        <div className="space-y-2.5">
          {/* Row 1: Gliding Left */}
          <div
            className="flex items-center gap-2.5 will-change-transform"
            style={{
              animation: isMoving ? 'marquee-left 32s linear infinite' : 'none',
              width: 'max-content'
            }}
          >
            {row1Items.map((item, idx) => (
              <TileRenderer
                key={`r1-${idx}`}
                item={item}
                themeIndex={idx % BRAND_THEMES.length}
                onOpenCheckout={onOpenCheckout}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
              />
            ))}
          </div>

          {/* Row 2: Gliding Right */}
          <div
            className="flex items-center gap-2.5 will-change-transform"
            style={{
              animation: isMoving ? 'marquee-right 36s linear infinite' : 'none',
              width: 'max-content'
            }}
          >
            {row2Items.map((item, idx) => (
              <TileRenderer
                key={`r2-${idx}`}
                item={item}
                themeIndex={(idx + 2) % BRAND_THEMES.length}
                onOpenCheckout={onOpenCheckout}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
              />
            ))}
          </div>

          {/* Row 3: Gliding Left */}
          <div
            className="flex items-center gap-2.5 will-change-transform"
            style={{
              animation: isMoving ? 'marquee-left 40s linear infinite' : 'none',
              width: 'max-content'
}}
          >
            {row3Items.map((item, idx) => (
              <TileRenderer
                key={`r3-${idx}`}
                item={item}
                themeIndex={(idx + 4) % BRAND_THEMES.length}
                onOpenCheckout={onOpenCheckout}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          5. Clean Press Table with Microphone & Sports Bottles
          ────────────────────────────────────────────────────────── */}
      <div className="relative bg-white/[0.02] border-t border-white/[0.06] pt-4 pb-3 px-6">
        <div className="relative max-w-2xl mx-auto flex items-end justify-between gap-6">
          {/* Left Sports Bottle */}
          <div className="relative flex flex-col items-center">
            <div className="w-3 h-2 rounded-t-sm bg-orange-500 shadow-sm" />
            <div className="w-4 h-2 bg-red-600" />
            <div className="w-6 h-14 rounded-b-md bg-gradient-to-b from-red-600 via-red-500 to-red-700 shadow-lg border border-red-400/40 flex items-center justify-center p-0.5">
              <span className="text-[7px] font-black text-white tracking-tighter uppercase -rotate-90">
                ENERGY
              </span>
            </div>
          </div>

          {/* Center Manager Microphone Desk Stand */}
          <div className="relative flex flex-col items-center flex-1">
            <div className="relative flex flex-col items-center -mb-1 z-20">
              <div className="w-5 h-7 rounded-full bg-zinc-800 border-2 border-zinc-500 shadow-lg flex items-center justify-center">
                <div className="w-2 h-4 bg-zinc-950 rounded-sm"></div>
              </div>
              <div className="w-1.5 h-10 bg-zinc-700 shadow-sm"></div>
            </div>

            <div className="w-16 h-3 rounded-full bg-zinc-900 border border-zinc-600 shadow-xl z-10" />

            {/* Podium Front Panel with Actual User Manager Name or 'Managers' Fallback */}
            <div className="mt-2 px-5 py-1.5 rounded-lg bg-[#0e111a] border border-white/[0.1] shadow flex items-center gap-2">
              <i className="fa-regular fa-futbol text-white text-xs"></i>
              <span className="text-[11px] font-black text-white tracking-widest uppercase">
                {displayManagerName}
              </span>
              <i className="fa-solid fa-trophy text-amber-400 text-xs"></i>
            </div>
          </div>

          {/* Right Sports Bottle */}
          <div className="relative flex flex-col items-center">
            <div className="w-3 h-2 rounded-t-sm bg-orange-500 shadow-sm" />
            <div className="w-4 h-2 bg-red-600" />
            <div className="w-6 h-14 rounded-b-md bg-gradient-to-b from-red-600 via-red-500 to-red-700 shadow-lg border border-red-400/40 flex items-center justify-center p-0.5">
              <span className="text-[7px] font-black text-white tracking-tighter uppercase -rotate-90">
                ENERGY
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee-left {
          0% { transform: translate3d(0%, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes marquee-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0%, 0, 0); }
        }
      `}</style>
    </div>
  );
};

interface TileRendererProps {
  item:
    | { type: 'sponsor'; data: PressSponsor }
    | { type: 'house'; data: HouseFallbackData; slotNumber: number }
    | { type: 'slot'; index: number; tier: '30_days' | '90_days' | '1_day' | '1_week' };
  themeIndex: number;
  onOpenCheckout: (packageType?: 'free_48h' | '30_days' | '90_days' | '1_year' | '1_day' | '1_week' | '1_month', slotInfo?: SlotSelectionInfo) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

const TileRendererComponent: React.FC<TileRendererProps> = ({
  item,
  themeIndex,
  onOpenCheckout,
  hoveredId,
  setHoveredId
}) => {
  const theme = BRAND_THEMES[themeIndex % BRAND_THEMES.length];

  if (item.type === 'sponsor') {
    const sponsor = item.data;
    const isHovered = hoveredId === sponsor.id;

    return (
      <a
        href={sponsor.link_url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHoveredId(sponsor.id)}
        onMouseLeave={() => setHoveredId(null)}
        className={`shrink-0 w-44 sm:w-48 h-14 sm:h-16 rounded-xl ${theme.bg} ${theme.border} border shadow-md flex items-center px-3 py-1.5 gap-2.5 transition-all duration-150 cursor-pointer overflow-hidden ${
          isHovered ? 'scale-105 ring-2 ring-white/80 shadow-xl' : 'hover:scale-102'
        }`}
      >
        <div className="w-10 h-10 rounded-lg bg-black/30 border border-white/20 shrink-0 p-1 flex items-center justify-center">
          <img
            src={resolveLogoUrl(sponsor.logo_url)}
            alt={sponsor.brand_name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = SVG_FALLBACK;
            }}
          />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className={`font-black text-xs sm:text-sm truncate leading-tight ${theme.text}`}>
            {sponsor.brand_name}
          </div>
          <div className={`text-[10px] opacity-90 truncate ${theme.subtext || 'text-zinc-300'}`}>
            {sponsor.tagline || 'Official Partner'}
          </div>
        </div>
      </a>
    );
  }

  // House / Community Fallback Tile
  if (item.type === 'house') {
    const house = item.data;
    if (house.isSample) {
      return (
        <button
          type="button"
          onClick={() =>
            onOpenCheckout('30_days', {
              slotNumber: item.slotNumber,
              slotLabel: `Moving Wall Slot #${item.slotNumber}`,
              isPremium: false
            })
          }
          className={`shrink-0 w-44 sm:w-48 h-14 sm:h-16 rounded-xl ${theme.bg} ${theme.border} border shadow-md flex items-center px-3 py-1.5 gap-2.5 transition-all duration-150 cursor-pointer overflow-hidden text-left hover:scale-102 hover:border-amber-400 group`}
        >
          <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/20 group-hover:border-amber-400/50 shrink-0 p-1 flex items-center justify-center">
            <img
              src={house.logo_url}
              alt={house.brand_name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = SVG_FALLBACK;
              }}
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className={`font-black text-xs sm:text-sm truncate leading-tight ${theme.text} group-hover:text-amber-200`}>
                {house.brand_name}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[7px] font-black uppercase bg-amber-400/25 text-amber-300 border border-amber-400/30 shrink-0">
                {house.badge}
              </span>
            </div>
            <div className={`text-[10px] opacity-90 truncate ${theme.subtext || 'text-zinc-300'} group-hover:text-amber-300/90 mt-0.5`}>
              {house.tagline}
            </div>
          </div>
        </button>
      );
    }

    return (
      <a
        href={house.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`shrink-0 w-44 sm:w-48 h-14 sm:h-16 rounded-xl ${theme.bg} ${theme.border} border shadow-md flex items-center px-3 py-1.5 gap-2.5 transition-all duration-150 cursor-pointer overflow-hidden hover:scale-102`}
      >
        <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/20 shrink-0 p-1 flex items-center justify-center">
          <img
            src={house.logo_url}
            alt={house.brand_name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = SVG_FALLBACK;
            }}
          />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-xs sm:text-sm truncate leading-tight ${theme.text}`}>
              {house.brand_name}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[7px] font-black uppercase bg-amber-400 text-black shrink-0">
              {house.badge}
            </span>
          </div>
          <div className={`text-[10px] opacity-90 truncate ${theme.subtext || 'text-zinc-300'} mt-0.5`}>
            {house.tagline}
          </div>
        </div>
      </a>
    );
  }

  // Vacant / Open Commercial Slot Tile
  return (
    <button
      type="button"
      onClick={() =>
        onOpenCheckout(item.tier, {
          slotNumber: item.index,
          slotLabel: `Moving Wall Slot #${item.index}`,
          isPremium: false
        })
      }
      className="shrink-0 w-44 sm:w-48 h-14 sm:h-16 rounded-xl bg-white/[0.03] border-2 border-dashed border-white/[0.15] hover:border-amber-400 hover:bg-amber-500/10 shadow-sm flex items-center px-3 py-1.5 gap-2.5 transition-all duration-150 cursor-pointer text-left group"
    >
      <div className="w-9 h-9 rounded-lg border border-dashed border-white/30 group-hover:border-amber-400 flex items-center justify-center text-zinc-400 group-hover:text-amber-300 shrink-0 bg-black/40">
        <i className="fa-solid fa-plus text-xs group-hover:rotate-90 transition-transform"></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-xs text-zinc-200 group-hover:text-amber-200 truncate">
          + Claim Slot #{item.index}
        </div>
        <div className="text-[10px] text-amber-400 font-mono font-bold truncate">
          Free 48h or €0.99
        </div>
      </div>
    </button>
  );
};

const TileRenderer = React.memo(TileRendererComponent);

export default PressConferenceWall;
