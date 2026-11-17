import { getCountryMult } from '../data/gameConstants';

export type OfficeCameraMode = 'isometric' | 'facade' | 'aerial';

export type OfficeTierId =
  | 'clubhouse_pavilion'
  | 'modern_sport_hq'
  | 'executive_atrium'
  | 'corporate_campus'
  | 'global_plaza_tower';

export interface BuildOfficeArchitectureParams {
  tier?: number;
  baseOvr?: number;
  reputation?: number;
  budget?: number;
  fanBase?: number;
  country?: string;
  isPublic?: boolean;
  stockPrice?: number;
  ipoPrice?: number;
  signedSponsorCount?: number;
  hasActiveLoan?: boolean;
  clubColor?: string;
  clubColor2?: string;
  academyLevel?: number;
  medicalLevel?: number;
}

export interface OfficeArchitectureModel {
  hqLevel: 1 | 2 | 3 | 4 | 5;
  tierId: OfficeTierId;
  tierLabel: string;
  districtLabel: string;
  stories: number;
  wingCount: 1 | 2 | 3;
  flagpoleCount: number;
  sponsorTotemCount: number;
  treeCount: number;
  pedestrianCount: number;
  vehicleCount: number;
  hasTeamBus: boolean;
  hasStockTickerFascia: boolean;
  hasPlazaWaterFeature: boolean;
  hasRooftopTerrace: boolean;
  trueValuation: number;
  fairStockPrice: number;
  effectiveStockPrice: number;
  stockDeltaPct: number;
  primaryHex: string;
  secondaryHex: string;
  clubTrimHex: string;
  busBodyHex: string;
  busStripeHex: string;
}

function sanitizeHex(input: string | undefined, fallback: string): string {
  if (!input || typeof input !== 'string') return fallback;
  const clean = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(clean)) return `#${clean.toUpperCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = clean[0].toUpperCase();
    const g = clean[1].toUpperCase();
    const b = clean[2].toUpperCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function isVeryLightHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.88;
}

export function buildOfficeArchitectureModel(
  params: BuildOfficeArchitectureParams
): OfficeArchitectureModel {
  const tier = Math.max(1, Math.min(5, Math.round(params.tier ?? 1)));
  const baseOvr = Math.max(40, Math.min(99, Math.round(params.baseOvr ?? 72)));
  const budget = Number.isFinite(params.budget) ? Number(params.budget) : 0;
  const fanBase = Math.max(200, Math.round(params.fanBase ?? 2500));
  const country = params.country || 'GER';
  const isPublic = Boolean(params.isPublic);
  const signedSponsorCount = Math.max(0, Math.min(4, Math.round(params.signedSponsorCount ?? 0)));

  // HQ Size Scales Level 1 to Level 5 dynamically in the background from the average of Youth Academy & Medical Department
  const safeAcademy = Math.max(1, Math.min(5, Math.round(params.academyLevel ?? 1)));
  const safeMedical = Math.max(1, Math.min(5, Math.round(params.medicalLevel ?? 1)));
  const hqLevel = Math.max(1, Math.min(5, Math.round((safeAcademy + safeMedical) / 2))) as 1 | 2 | 3 | 4 | 5;

  // Exact valuation parity with IPOModal.tsx
  const cMult = getCountryMult(country);
  const fanValuation = fanBase * 60;
  const squadValuation = baseOvr * 150000;
  const cashValuation = Math.max(0, budget);
  const trueValuation = Math.round((cashValuation + fanValuation + squadValuation) * cMult);
  const fairStockPrice = Math.max(1.0, Math.round((trueValuation / 1000000) * 100) / 100);
  const effectiveStockPrice =
    isPublic && params.stockPrice && params.stockPrice > 0 ? params.stockPrice : fairStockPrice;
  const baseIpo =
    isPublic && params.ipoPrice && params.ipoPrice > 0 ? params.ipoPrice : fairStockPrice;
  const stockDeltaPct =
    isPublic && baseIpo > 0
      ? Math.round(((effectiveStockPrice - baseIpo) / baseIpo) * 1000) / 10
      : 0;

  let tierId: OfficeTierId = 'clubhouse_pavilion';
  let tierLabel = 'Level 1 · Clubhouse Pavilion';
  let districtLabel = 'Training & Community Forecourt';
  let stories = 2;
  let wingCount: 1 | 2 | 3 = 1;

  if (hqLevel === 5) {
    tierId = 'global_plaza_tower';
    tierLabel = 'Level 5 · Global Flagship Plaza';
    districtLabel = 'Corporate Tower & Executive Forecourt';
    stories = 6;
    wingCount = 3;
  } else if (hqLevel === 4) {
    tierId = 'corporate_campus';
    tierLabel = 'Level 4 · Continental Campus HQ';
    districtLabel = 'Dual-Wing Glass Atrium & Media Plaza';
    stories = 5;
    wingCount = 3;
  } else if (hqLevel === 3) {
    tierId = 'executive_atrium';
    tierLabel = 'Level 3 · Executive Glass Atrium';
    districtLabel = 'First-Division Commercial Headquarters';
    stories = 4;
    wingCount = 2;
  } else if (hqLevel === 2) {
    tierId = 'modern_sport_hq';
    tierLabel = 'Level 2 · Modern Sport Office';
    districtLabel = 'Professional Club Administration';
    stories = 3;
    wingCount = 2;
  }

  const flagpoleCount = hqLevel;
  const sponsorTotemCount = Math.min(4, Math.max(signedSponsorCount > 0 ? signedSponsorCount : 1, hqLevel >= 3 ? 2 : 1));
  const treeCount = Math.min(10, 3 + hqLevel);
  const pedestrianCount = Math.min(
    14,
    Math.max(4, Math.round(3 + hqLevel * 1.4 + Math.log10(Math.max(500, fanBase)) * 1.1))
  );
  const vehicleCount = Math.min(5, Math.max(2, wingCount + 1));

  const rawPrimary = sanitizeHex(params.clubColor, '#C83232');
  const rawSecondary = sanitizeHex(params.clubColor2, '#FFFFFF');

  const primaryHex = isVeryLightHex(rawPrimary)
    ? isVeryLightHex(rawSecondary)
      ? '#1E3A8A'
      : rawSecondary
    : rawPrimary;

  const secondaryHex =
    rawSecondary.toLowerCase() === primaryHex.toLowerCase() || isVeryLightHex(rawSecondary)
      ? '#1E2638'
      : rawSecondary;

  // Preserve authentic club secondary color (including crisp white/gold/yellow) for HQ trim & Team Bus livery!
  const clubTrimHex =
    rawSecondary.toLowerCase() === primaryHex.toLowerCase()
      ? isVeryLightHex(rawPrimary) && rawPrimary.toLowerCase() !== primaryHex.toLowerCase()
        ? rawPrimary
        : '#FFFFFF'
      : rawSecondary;

  return {
    hqLevel,
    tierId,
    tierLabel,
    districtLabel,
    stories,
    wingCount,
    flagpoleCount,
    sponsorTotemCount,
    treeCount,
    pedestrianCount,
    vehicleCount,
    // Always park the official Club Team Bus at the HQ forecourt so every club showcases its team coach livery
    hasTeamBus: true,
    hasStockTickerFascia: isPublic,
    hasPlazaWaterFeature: hqLevel >= 3 || isPublic,
    hasRooftopTerrace: hqLevel >= 4,
    trueValuation,
    fairStockPrice,
    effectiveStockPrice,
    stockDeltaPct,
    primaryHex,
    secondaryHex,
    clubTrimHex,
    busBodyHex: primaryHex,
    busStripeHex: clubTrimHex,
  };
}
