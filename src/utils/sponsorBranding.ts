import { GameState, StadiumNamingDeal } from '../types';

export interface ActiveSponsorBrand {
  slot: 0 | 1 | 2 | 3;
  name: string;
  tierTag: 'Megadeal' | 'Partner' | 'Performance' | 'Naming Rights';
}

const SLOT_ORDER: readonly { slot: 0 | 1 | 2; tierTag: 'Megadeal' | 'Partner' | 'Performance' }[] = [
  { slot: 1, tierTag: 'Megadeal' },
  { slot: 0, tierTag: 'Partner' },
  { slot: 2, tierTag: 'Performance' },
];

/**
 * Extracts currently active signed sponsors for the club's current season.
 * Returns an empty array if no sponsor deals are signed so arena & gym surfaces
 * stay clean until commercial partnerships are finalized.
 */
export function resolveActiveSponsorBrands(
  state?: (Pick<GameState, 'year' | 'seasonSponsorDeals' | 'seasonSponsorDealsYear'> & {
    namingRightsDeal?: StadiumNamingDeal | null;
  }) | null
): ActiveSponsorBrand[] {
  if (!state) return [];

  const active: ActiveSponsorBrand[] = [];
  const seen = new Set<string>();

  const hasValidSeasonDeals =
    Boolean(state.seasonSponsorDeals) &&
    !(
      typeof state.seasonSponsorDealsYear === 'number' &&
      typeof state.year === 'number' &&
      state.seasonSponsorDealsYear !== state.year
    );

  if (hasValidSeasonDeals && state.seasonSponsorDeals) {
    const deals = state.seasonSponsorDeals;
    for (const entry of SLOT_ORDER) {
      const deal = deals[entry.slot];
      if (!deal || deal.status !== 'signed') continue;
      const rawName = (deal.brandName || '').trim();
      if (!rawName || rawName.toLowerCase() === 'empty') continue;
      const dedupeKey = rawName.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      active.push({
        slot: entry.slot,
        name: rawName,
        tierTag: entry.tierTag,
      });
    }
  }

  if (state.namingRightsDeal && state.namingRightsDeal.yearsRemaining > 0) {
    const rawNamingBrand = (state.namingRightsDeal.brandName || '').trim();
    if (rawNamingBrand && rawNamingBrand.toLowerCase() !== 'empty') {
      const dedupeKey = rawNamingBrand.toLowerCase();
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        active.push({
          slot: 3,
          name: rawNamingBrand,
          tierTag: 'Naming Rights',
        });
      }
    }
  }

  return active;
}

/**
 * Formats a sponsor brand name for high-contrast arena LED fascia & training wall signage.
 * Default maxLen allows longer corporate partner names to display while scaling font size down.
 */
export function formatSponsorBoardText(brandName: string, maxLen = 28): string {
  const clean = (brandName || '').trim().replace(/\s+/g, ' ').toUpperCase();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(3, maxLen - 1)).trim()}…`;
}

/**
 * Normalizes a 2D projected board text angle into (-PI/2, PI/2] so LED boards
 * behind the left goal or along side walls never render upside down.
 */
export function normalizeReadableBoardAngle(angleRad: number): number {
  if (!Number.isFinite(angleRad)) return 0;
  let a = ((angleRad + Math.PI) % (Math.PI * 2));
  if (a < 0) a += Math.PI * 2;
  a -= Math.PI; // Now in [-PI, PI)
  if (a > Math.PI / 2) {
    a -= Math.PI;
  } else if (a <= -Math.PI / 2) {
    a += Math.PI;
  }
  return a;
}

/**
 * Dynamically scales LED / fascia font size down when a sponsor brand name is long,
 * ensuring longer corporate names fit cleanly inside perimeter panels without clipping.
 */
export function computeFittedBoardFontPx(params: {
  text: string;
  panelSpanPx: number;
  maxFontPx: number;
  minFontPx?: number;
  measuredWidthAtMaxPx?: number;
}): number {
  const { text, panelSpanPx, maxFontPx, minFontPx = 5.25, measuredWidthAtMaxPx } = params;
  const safeMax = Math.max(minFontPx, maxFontPx);
  const usableSpan = Math.max(12, panelSpanPx * 0.86);
  const estimatedWidth =
    typeof measuredWidthAtMaxPx === 'number' && measuredWidthAtMaxPx > 0
      ? measuredWidthAtMaxPx
      : Math.max(1, (text || '').length) * safeMax * 0.64;

  if (estimatedWidth <= usableSpan) {
    return safeMax;
  }
  const scaled = (usableSpan / estimatedWidth) * safeMax;
  return Math.max(minFontPx, Math.min(safeMax, Number(scaled.toFixed(2))));
}
