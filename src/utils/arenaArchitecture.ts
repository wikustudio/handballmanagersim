export interface ArenaColorScheme {
  courtPaintColor: string;
  courtApronColor: string;
  ledRibbonColor: string;
  homeJerseyColor: string;
  homeShortsColor: string;
  awayJerseyColor: string;
  awayShortsColor: string;
  accentHex: string;
}

export type ArenaDesignId =
  | 'terracotta_courtside'
  | 'club_heritage'
  | 'championship_taraflex'
  | 'nordic_birch';

export type ArenaScaleTierId =
  | 'sportshalle'
  | 'municipal_bowl'
  | 'bundesliga_cauldron'
  | 'champions_palace'
  | 'pinnacle_dome';

export interface ArenaDesignPreset {
  id: ArenaDesignId;
  name: string;
  shortLabel: string;
  subtitle: string;
  floorStops: [string, string, string];
  plankStroke: string;
  creasePaintOverride: string | null; // null = use club identity courtPaintColor
  centerCircleOverride: string | null;
  apronOverride: string | null;
  lineColor: string;
  wordmarkColor: string;
  bowlBgStops: [string, string, string];
  riserBaseHex: string;
  riserUpperHex: string;
  emptySeatHex: string;
  emptySeatBackHex: string;
}

export const ARENA_DESIGN_PRESETS: Record<ArenaDesignId, ArenaDesignPreset> = {
  terracotta_courtside: {
    id: 'terracotta_courtside',
    name: 'Terracotta Courtside',
    shortLabel: 'Terracotta 6m',
    subtitle: 'Warm maple parquet with painted terracotta 6m creases & navy bowl',
    floorStops: ['#DBA065', '#CE8F52', '#BF7F42'],
    plankStroke: 'rgba(110, 62, 20, 0.12)',
    creasePaintOverride: '#D9632B',
    centerCircleOverride: '#D9632B',
    apronOverride: null,
    lineColor: 'rgba(255, 255, 255, 0.94)',
    wordmarkColor: 'rgba(24, 28, 42, 0.80)',
    bowlBgStops: ['#192032', '#222B42', '#161C2C'],
    riserBaseHex: '#25304A',
    riserUpperHex: '#1C2438',
    emptySeatHex: '#364362',
    emptySeatBackHex: '#46567A',
  },
  club_heritage: {
    id: 'club_heritage',
    name: 'Club Heritage Paint',
    shortLabel: 'Club Colors',
    subtitle: 'Full club-colored 6m goal creases, apron & LED perimeter fascia',
    floorStops: ['#D79A5E', '#CA8B4E', '#BC7C40'],
    plankStroke: 'rgba(110, 62, 20, 0.11)',
    creasePaintOverride: null,
    centerCircleOverride: null,
    apronOverride: null,
    lineColor: 'rgba(255, 255, 255, 0.94)',
    wordmarkColor: 'rgba(24, 28, 42, 0.78)',
    bowlBgStops: ['#1B2234', '#232C43', '#181E2E'],
    riserBaseHex: '#27324C',
    riserUpperHex: '#1D263B',
    emptySeatHex: '#384666',
    emptySeatBackHex: '#495A80',
  },
  championship_taraflex: {
    id: 'championship_taraflex',
    name: 'Continental Taraflex',
    shortLabel: 'Final4 Blue',
    subtitle: 'EHF championship azure Taraflex floor with terracotta 6m creases',
    floorStops: ['#2E6BB4', '#255B9E', '#1E4D89'],
    plankStroke: 'rgba(255, 255, 255, 0.05)',
    creasePaintOverride: '#DF642A',
    centerCircleOverride: '#DF642A',
    apronOverride: '#172544',
    lineColor: 'rgba(255, 255, 255, 0.96)',
    wordmarkColor: 'rgba(255, 255, 255, 0.85)',
    bowlBgStops: ['#131B2E', '#1B2640', '#101728'],
    riserBaseHex: '#212D48',
    riserUpperHex: '#172035',
    emptySeatHex: '#314163',
    emptySeatBackHex: '#425680',
  },
  nordic_birch: {
    id: 'nordic_birch',
    name: 'Scandinavian Birch',
    shortLabel: 'Nordic Birch',
    subtitle: 'Pale Nordic birch timber court with terracotta 6m creases & slate stands',
    floorStops: ['#EAD0A8', '#DFC295', '#D2B382'],
    plankStroke: 'rgba(120, 88, 46, 0.10)',
    creasePaintOverride: '#D45A24',
    centerCircleOverride: '#D45A24',
    apronOverride: '#262B36',
    lineColor: 'rgba(255, 255, 255, 0.96)',
    wordmarkColor: 'rgba(24, 28, 38, 0.82)',
    bowlBgStops: ['#1D212B', '#262B38', '#181B24'],
    riserBaseHex: '#2B303E',
    riserUpperHex: '#202430',
    emptySeatHex: '#3D4457',
    emptySeatBackHex: '#50586E',
  },
};

export const ARENA_DESIGN_LIST: ArenaDesignPreset[] = [
  ARENA_DESIGN_PRESETS.terracotta_courtside,
  ARENA_DESIGN_PRESETS.club_heritage,
  ARENA_DESIGN_PRESETS.championship_taraflex,
  ARENA_DESIGN_PRESETS.nordic_birch,
];

export interface ArenaTierOptions {
  vipEnabled?: boolean;
}

export interface ArenaTierSpec {
  id: ArenaScaleTierId;
  label: string;
  minCapacity: number;
  lowerRows: number;
  upperRows: number;
  endzoneRows: number;
  nearCutawayRows: number;
  sidelineCols: number;
  endzoneCols: number;
  aisleCount: number;
  hasVipBoxes: boolean;
  vipSuiteCount: number;
  isVipStrategyActive: boolean;
  hasLuxuryFinish: boolean;
  hasRoofRig: boolean;
  hasCornerTowers: boolean;
  standElevationScale: number;
}

/**
 * Resolves continuous 3D arena geometry from seat capacity and VIP hospitality mode.
 * Every +500 to +1,000 seat expansion visibly adds rows, columns, and stand elevation,
 * and switching to VIP Fan Strategy immediately activates illuminated VIP skyboxes & gold lounge rails.
 */
export function resolveArenaScaleTier(
  capacityInput: number,
  options?: ArenaTierOptions
): ArenaTierSpec {
  const cap = Math.max(500, Math.round(capacityInput || 2500));
  const vipActive = Boolean(options?.vipEnabled);
  const hasLuxuryFinish = cap >= 14000;

  if (cap < 3000) {
    const t = (cap - 500) / 2500; // 0..1 across 500..3000
    const lowerRows = 3 + Math.floor(t * 2.2); // 3 -> 5
    const endzoneRows = 2 + Math.floor(t * 2.2); // 2 -> 4
    const sidelineCols = 24 + Math.round(t * 7); // 24 -> 31 (denser crowd!)
    const endzoneCols = 12 + Math.round(t * 4); // 12 -> 16
    return {
      id: 'sportshalle',
      label: vipActive ? 'VIP Club Sportshalle' : 'Regional Sportshalle',
      minCapacity: 500,
      lowerRows,
      upperRows: vipActive && cap >= 2000 ? 1 : 0,
      endzoneRows,
      nearCutawayRows: cap >= 1800 ? 2 : 1,
      sidelineCols,
      endzoneCols,
      aisleCount: 2,
      hasVipBoxes: vipActive,
      vipSuiteCount: vipActive ? Math.max(3, 3 + Math.floor(t * 2)) : 0,
      isVipStrategyActive: vipActive,
      hasLuxuryFinish,
      hasRoofRig: cap >= 2400,
      hasCornerTowers: cap >= 2000 || vipActive,
      standElevationScale: Number((0.76 + t * 0.14 + (vipActive ? 0.06 : 0)).toFixed(3)),
    };
  }

  if (cap < 6500) {
    const t = (cap - 3000) / 3500; // 0..1 across 3000..6500
    const lowerRows = 5 + Math.floor(t * 1.8); // 5 -> 6
    const upperRows = cap >= 4800 ? 1 + Math.floor(((cap - 4800) / 1700) * 1.2) : (vipActive ? 1 : 0);
    const endzoneRows = 4 + Math.floor(t * 2.4); // 4 -> 6
    const sidelineCols = 33 + Math.round(t * 8); // 33 -> 41
    const endzoneCols = 17 + Math.round(t * 4); // 17 -> 21
    return {
      id: 'municipal_bowl',
      label: vipActive ? 'VIP Municipal Arena' : 'Municipal Bowl',
      minCapacity: 3000,
      lowerRows,
      upperRows,
      endzoneRows,
      nearCutawayRows: 2,
      sidelineCols,
      endzoneCols,
      aisleCount: 3,
      hasVipBoxes: vipActive || cap >= 5500,
      vipSuiteCount: vipActive ? 5 + Math.floor(t * 3) : cap >= 5500 ? 4 : 0,
      isVipStrategyActive: vipActive,
      hasLuxuryFinish,
      hasRoofRig: cap >= 4500 || vipActive,
      hasCornerTowers: true,
      standElevationScale: Number((0.91 + t * 0.11 + (vipActive ? 0.06 : 0)).toFixed(3)),
    };
  }

  if (cap < 11500) {
    const t = (cap - 6500) / 5000; // 0..1 across 6500..11500
    const lowerRows = 6 + Math.floor(t * 1.4); // 6 -> 7
    const upperRows = 3 + Math.floor(t * 2.2); // 3 -> 5
    const endzoneRows = 6 + Math.floor(t * 2.5); // 6 -> 8
    const sidelineCols = 43 + Math.round(t * 8); // 43 -> 51
    const endzoneCols = 22 + Math.round(t * 4); // 22 -> 26
    return {
      id: 'bundesliga_cauldron',
      label: vipActive ? 'VIP Hospitality Cauldron' : 'Twin-Tier Cauldron',
      minCapacity: 6500,
      lowerRows,
      upperRows,
      endzoneRows,
      nearCutawayRows: cap >= 9000 ? 3 : 2,
      sidelineCols,
      endzoneCols,
      aisleCount: 4,
      hasVipBoxes: vipActive || cap >= 8500,
      vipSuiteCount: vipActive ? 7 + Math.floor(t * 3) : cap >= 8500 ? 5 : 0,
      isVipStrategyActive: vipActive,
      hasLuxuryFinish,
      hasRoofRig: true,
      hasCornerTowers: true,
      standElevationScale: Number((1.03 + t * 0.11 + (vipActive ? 0.06 : 0)).toFixed(3)),
    };
  }

  if (cap < 16000) {
    const t = (cap - 11500) / 4500; // 0..1 across 11500..16000
    const lowerRows = 7 + Math.floor(t * 1.4); // 7 -> 8
    const upperRows = 5 + Math.floor(t * 1.6); // 5 -> 6
    const endzoneRows = 9 + Math.floor(t * 2.0); // 9 -> 10
    const sidelineCols = 53 + Math.round(t * 6); // 53 -> 59
    const endzoneCols = 27 + Math.round(t * 3); // 27 -> 30
    return {
      id: 'champions_palace',
      label: hasLuxuryFinish || vipActive ? 'Grand Luxury Arena' : 'Championship Arena',
      minCapacity: 11500,
      lowerRows,
      upperRows,
      endzoneRows,
      nearCutawayRows: 3,
      sidelineCols,
      endzoneCols,
      aisleCount: 5,
      hasVipBoxes: true,
      vipSuiteCount: (vipActive ? 10 : 7) + Math.floor(t * 2),
      isVipStrategyActive: vipActive,
      hasLuxuryFinish,
      hasRoofRig: true,
      hasCornerTowers: true,
      standElevationScale: Number((1.15 + t * 0.10 + (vipActive ? 0.05 : 0)).toFixed(3)),
    };
  }

  if (cap < 23500) {
    const t = (cap - 16000) / 7500; // 0..1 across 16000..23500
    const lowerRows = 8 + Math.floor(t * 1.4); // 8 -> 9
    const upperRows = 6 + Math.floor(t * 1.6); // 6 -> 7
    const endzoneRows = 11 + Math.floor(t * 2.0); // 11 -> 12
    const sidelineCols = 60 + Math.round(t * 6); // 60 -> 66
    const endzoneCols = 31 + Math.round(t * 3); // 31 -> 34
    return {
      id: 'pinnacle_dome',
      label: vipActive ? 'Executive Super-Dome' : 'Continental Super-Dome',
      minCapacity: 16000,
      lowerRows,
      upperRows,
      endzoneRows,
      nearCutawayRows: 3 + (cap >= 20000 ? 1 : 0),
      sidelineCols,
      endzoneCols,
      aisleCount: 6,
      hasVipBoxes: true,
      vipSuiteCount: (vipActive ? 12 : 9) + Math.floor(t * 2),
      isVipStrategyActive: vipActive,
      hasLuxuryFinish: true,
      hasRoofRig: true,
      hasCornerTowers: true,
      standElevationScale: Number((1.26 + t * 0.09 + (vipActive ? 0.05 : 0)).toFixed(3)),
    };
  }

  const tTop = Math.min(1, (cap - 23500) / 6500);
  return {
    id: 'pinnacle_dome',
    label: vipActive ? '30K Royal Hospitality Cathedral' : '30K World Cathedral',
    minCapacity: 23500,
    lowerRows: 9 + Math.round(tTop),
    upperRows: 8 + Math.round(tTop),
    endzoneRows: 13 + Math.round(tTop * 2),
    nearCutawayRows: 4,
    sidelineCols: 68 + Math.round(tTop * 6),
    endzoneCols: 35 + Math.round(tTop * 3),
    aisleCount: 7,
    hasVipBoxes: true,
    vipSuiteCount: vipActive ? 14 : 11,
    isVipStrategyActive: vipActive,
    hasLuxuryFinish: true,
    hasRoofRig: true,
    hasCornerTowers: true,
    standElevationScale: Number((1.36 + tTop * 0.08 + (vipActive ? 0.05 : 0)).toFixed(3)),
  };
}

export type SeatOccupantKind = 'empty' | 'home_primary' | 'home_secondary' | 'away_fan';

export interface SeatEvaluationInput {
  standIndex: number; // 0=far sideline, 1=left endzone, 2=right endzone, 3=near riser
  tierIndex: 0 | 1; // 0=lower bowl, 1=upper deck
  rowIndex: number;
  totalRowsInTier: number;
  colIndex: number;
  totalCols: number;
  occupancyRatio: number; // 0..1
  seed?: number;
}

function deterministicUnitNoise(a: number, b: number, c: number, seed = 17): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647 + seed * 1597334677) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/**
 * Evaluates whether a specific stadium seat is occupied or empty based on
 * live attendance/capacity ratio. Fill radiates strictly from center line (sidelines)
 * and directly behind the goal (endzones), filling lower rows first and leaving corners last.
 */
export function evaluateArenaSeat(input: SeatEvaluationInput): SeatOccupantKind {
  const occ = Math.max(0, Math.min(1, input.occupancyRatio));
  if (occ <= 0.002) return 'empty';

  const normCol = input.totalCols > 1 ? input.colIndex / (input.totalCols - 1) : 0.5; // 0..1
  const centerDist = Math.abs(normCol - 0.5) * 2;
  const normRow =
    input.totalRowsInTier > 1 ? input.rowIndex / (input.totalRowsInTier - 1) : 0;

  const microNoise = deterministicUnitNoise(
    input.standIndex * 31 + input.tierIndex * 7 + input.rowIndex,
    input.colIndex,
    101,
    input.seed ?? 41
  );

  const fillPriority =
    centerDist * 0.64 +
    (input.tierIndex === 1 ? 0.19 : 0) +
    normRow * 0.13 +
    microNoise * 0.04;

  const normalizedRank = Math.max(0, Math.min(1, (fillPriority - 0.02) / 0.94));
  if (occ < 0.995 && normalizedRank > occ) {
    return 'empty';
  }

  // Dedicated away-supporter section in right endzone upper/edge block
  const isAwayBlock =
    (input.standIndex === 2 && normCol > 0.62 && (input.tierIndex === 1 || normRow > 0.45)) ||
    (input.standIndex === 0 && normCol > 0.86 && input.tierIndex === 1);
  if (isAwayBlock) {
    return 'away_fan';
  }

  const shirtRoll = deterministicUnitNoise(
    input.colIndex + 13,
    input.rowIndex + 29,
    input.standIndex + input.tierIndex * 5,
    (input.seed ?? 41) + 99
  );
  return shirtRoll < 0.68 ? 'home_primary' : 'home_secondary';
}

export interface ArenaArchitectureModel {
  design: ArenaDesignPreset;
  tier: ArenaTierSpec;
  capacity: number;
  attendance: number;
  emptySeats: number;
  occupancyRatio: number;
  utilizationPct: number;
  resolvedCreaseHex: string;
  resolvedCenterCircleHex: string;
  resolvedApronHex: string;
  totalVisualSeats: number;
  occupiedVisualSeats: number;
}

export function buildArenaArchitectureModel(params: {
  capacity: number;
  attendance: number;
  designId?: ArenaDesignId | string | null;
  clubColors: ArenaColorScheme;
  vipEnabled?: boolean;
  seed?: number;
}): ArenaArchitectureModel {
  const safeCap = Math.max(500, Math.round(params.capacity || 4500));
  const safeAtt = Math.max(0, Math.min(safeCap, Math.round(params.attendance ?? safeCap * 0.85)));
  const occupancyRatio = safeCap > 0 ? Math.max(0, Math.min(1, safeAtt / safeCap)) : 0;
  const utilizationPct = Math.round(occupancyRatio * 100);

  const designKey: ArenaDesignId =
    params.designId && params.designId in ARENA_DESIGN_PRESETS
      ? (params.designId as ArenaDesignId)
      : 'terracotta_courtside';
  const design = ARENA_DESIGN_PRESETS[designKey];
  const tier = resolveArenaScaleTier(safeCap, { vipEnabled: params.vipEnabled });

  const resolvedCreaseHex = design.creasePaintOverride || params.clubColors.courtPaintColor;
  const resolvedCenterCircleHex =
    design.centerCircleOverride || params.clubColors.courtPaintColor;
  const resolvedApronHex = design.apronOverride || params.clubColors.courtApronColor;

  let totalVisualSeats = 0;
  let occupiedVisualSeats = 0;
  const stands: { standIdx: number; rows0: number; rows1: number; cols: number }[] = [
    { standIdx: 0, rows0: tier.lowerRows, rows1: tier.upperRows, cols: tier.sidelineCols },
    { standIdx: 1, rows0: Math.max(2, Math.ceil(tier.endzoneRows * 0.6)), rows1: Math.floor(tier.endzoneRows * 0.4), cols: tier.endzoneCols },
    { standIdx: 2, rows0: Math.max(2, Math.ceil(tier.endzoneRows * 0.6)), rows1: Math.floor(tier.endzoneRows * 0.4), cols: tier.endzoneCols },
  ];

  for (const st of stands) {
    for (let r = 0; r < st.rows0; r++) {
      for (let c = 0; c < st.cols; c++) {
        totalVisualSeats++;
        const kind = evaluateArenaSeat({
          standIndex: st.standIdx,
          tierIndex: 0,
          rowIndex: r,
          totalRowsInTier: st.rows0,
          colIndex: c,
          totalCols: st.cols,
          occupancyRatio,
          seed: params.seed,
        });
        if (kind !== 'empty') occupiedVisualSeats++;
      }
    }
    for (let r = 0; r < st.rows1; r++) {
      for (let c = 0; c < st.cols; c++) {
        totalVisualSeats++;
        const kind = evaluateArenaSeat({
          standIndex: st.standIdx,
          tierIndex: 1,
          rowIndex: r,
          totalRowsInTier: st.rows1,
          colIndex: c,
          totalCols: st.cols,
          occupancyRatio,
          seed: params.seed,
        });
        if (kind !== 'empty') occupiedVisualSeats++;
      }
    }
  }

  return {
    design,
    tier,
    capacity: safeCap,
    attendance: safeAtt,
    emptySeats: Math.max(0, safeCap - safeAtt),
    occupancyRatio,
    utilizationPct,
    resolvedCreaseHex,
    resolvedCenterCircleHex,
    resolvedApronHex,
    totalVisualSeats,
    occupiedVisualSeats,
  };
}
