import { ArenaDesignId, ARENA_DESIGN_PRESETS, ArenaDesignPreset } from './arenaArchitecture';
import { ArenaColorScheme } from './courtsideStats';

export type GymCameraMode = 'isometric' | 'topdown' | 'endzone';

export interface WarmupRunner {
  id: number;
  u: number;
  v: number;
  strideZ: number;
  lane: 'north' | 'south' | 'gk_left' | 'gk_right';
  isGK: boolean;
  headingDir: 1 | -1;
}

export interface WarmupBall {
  id: number;
  u: number;
  v: number;
  z: number;
}

export interface TrainingGymModel {
  design: ArenaDesignPreset;
  resolvedCreaseHex: string;
  runnerCount: number;
  tempoFactor: number;
  wallBarCount: number;
  clerestoryWindowCount: number;
  conePositions: [number, number][];
  hallWallHex: string;
  hallTrimHex: string;
  matAccentHex: string;
}

export function buildTrainingGymModel(params: {
  squadSize?: number;
  morale?: number;
  baseOvr?: number;
  tactic?: string;
  designId?: ArenaDesignId;
  clubColors: ArenaColorScheme;
}): TrainingGymModel {
  const safeSquadSize = Math.max(12, Math.min(24, Math.round(params.squadSize ?? 18)));
  const safeMorale = Math.max(0, Math.min(100, Math.round(params.morale ?? 75)));
  const design =
    ARENA_DESIGN_PRESETS[params.designId || 'terracotta_courtside'] ||
    ARENA_DESIGN_PRESETS.terracotta_courtside;
  const resolvedCreaseHex = design.creasePaintOverride || params.clubColors.courtPaintColor || '#D95D24';

  // Even number of field runners split across two parallel shuttle lanes + 2 goalkeepers
  const fieldPairs = Math.max(4, Math.min(7, Math.floor((safeSquadSize - 2) / 2)));
  const runnerCount = fieldPairs * 2;

  const isFast = (params.tactic || '').toLowerCase().includes('fast') || (params.tactic || '').includes('3-2-1');
  const moraleTempo = 0.88 + (safeMorale / 100) * 0.24;
  const tempoFactor = Number(((isFast ? 1.12 : 1.0) * moraleTempo).toFixed(2));

  // Agility cone markers along north & south warmup channels
  const conePositions: [number, number][] = [
    [-0.64, -0.78],
    [-0.32, -0.78],
    [0.0, -0.78],
    [0.32, -0.78],
    [0.64, -0.78],
    [-0.64, 0.78],
    [-0.32, 0.78],
    [0.0, 0.78],
    [0.32, 0.78],
    [0.64, 0.78],
  ];

  return {
    design,
    resolvedCreaseHex,
    runnerCount,
    tempoFactor,
    wallBarCount: 8,
    clerestoryWindowCount: 6,
    conePositions,
    hallWallHex: '#E6E1D6',
    hallTrimHex: '#C5A47E',
    matAccentHex: params.clubColors.homeJerseyColor || '#1E3A8A',
  };
}

/**
 * Smooth cosine-eased shuttle triangle wave in [-1, 1] so runners accelerate
 * down the 40x20m court, decelerate cleanly near the 6m arc, pivot, and run back.
 */
function shuttleWave(t: number): { pos: number; dir: 1 | -1 } {
  const norm = ((t % 1) + 1) % 1;
  const dir: 1 | -1 = norm < 0.5 ? 1 : -1;
  const halfPhase = norm < 0.5 ? norm * 2 : (1 - norm) * 2;
  // Blend linear + cosine ease at turnaround endpoints
  const eased = 0.25 * (halfPhase * 2 - 1) + 0.75 * (-Math.cos(halfPhase * Math.PI));
  return { pos: Math.max(-1, Math.min(1, eased)), dir };
}

export function computeWarmupFrame(
  phase: number,
  runnerCount = 12
): { runners: WarmupRunner[]; balls: WarmupBall[] } {
  const safePhase = ((phase % 1) + 1) % 1;
  const pairs = Math.max(3, Math.min(8, Math.floor(runnerCount / 2)));
  const runners: WarmupRunner[] = [];

  for (let i = 0; i < pairs; i++) {
    // Stagger pairs slightly so the squad forms a crisp moving platoon running end-to-end
    const stagger = (i / pairs) * 0.28;
    const northShuttle = shuttleWave(safePhase + stagger);
    const southShuttle = shuttleWave(safePhase + stagger + 0.04);

    const uNorth = Math.max(-0.82, Math.min(0.82, northShuttle.pos * 0.76));
    const uSouth = Math.max(-0.82, Math.min(0.82, southShuttle.pos * 0.76));

    // Gentle figure-8 / dynamic warmup lateral sway
    const swayNorth = Math.sin((safePhase * 4 + i * 0.65) * Math.PI * 2) * 0.045;
    const swaySouth = -Math.sin((safePhase * 4 + i * 0.65) * Math.PI * 2) * 0.045;

    const vNorth = Math.max(-0.86, Math.min(-0.14, -0.43 + (i % 2 === 0 ? -0.09 : 0.09) + swayNorth));
    const vSouth = Math.max(0.14, Math.min(0.86, 0.43 + (i % 2 === 0 ? 0.09 : -0.09) + swaySouth));

    const strideNorth = Math.abs(Math.sin((safePhase * 12 + i * 0.37) * Math.PI * 2)) * 0.045;
    const strideSouth = Math.abs(Math.sin((safePhase * 12 + i * 0.37 + 0.25) * Math.PI * 2)) * 0.045;

    runners.push({
      id: i * 2,
      u: uNorth,
      v: vNorth,
      strideZ: strideNorth,
      lane: 'north',
      isGK: false,
      headingDir: northShuttle.dir,
    });

    runners.push({
      id: i * 2 + 1,
      u: uSouth,
      v: vSouth,
      strideZ: strideSouth,
      lane: 'south',
      isGK: false,
      headingDir: southShuttle.dir,
    });
  }

  // Two goalkeepers doing lateral arc footwork drills at opposite 6m goal creases
  const gkSlideL = Math.sin(safePhase * Math.PI * 6) * 0.24;
  const gkSlideR = -Math.sin(safePhase * Math.PI * 6 + 0.8) * 0.24;
  const gkHop = Math.abs(Math.sin(safePhase * Math.PI * 12)) * 0.035;

  runners.push({
    id: 100,
    u: -0.89,
    v: gkSlideL,
    strideZ: gkHop,
    lane: 'gk_left',
    isGK: true,
    headingDir: 1,
  });

  runners.push({
    id: 101,
    u: 0.89,
    v: gkSlideR,
    strideZ: gkHop,
    lane: 'gk_right',
    isGK: true,
    headingDir: -1,
  });

  // Crisp chest-pass warmup balls arcing between paired runners as they run up and down
  const balls: WarmupBall[] = [];
  const ballPairIndices = [0, Math.min(2, pairs - 1)];
  ballPairIndices.forEach((pairIdx, bIdx) => {
    const rA = runners[pairIdx * 2];
    const rB = runners[pairIdx * 2 + 1];
    if (!rA || !rB) return;
    const passCycle = ((safePhase * 5 + bIdx * 0.5) % 1 + 1) % 1;
    const pingPong = passCycle < 0.5 ? passCycle * 2 : (1 - passCycle) * 2;
    const ballU = rA.u * (1 - pingPong) + rB.u * pingPong;
    const ballV = rA.v * (1 - pingPong) + rB.v * pingPong;
    const ballZ = 0.28 + Math.sin(pingPong * Math.PI) * 0.26;
    balls.push({
      id: bIdx,
      u: ballU,
      v: ballV,
      z: ballZ,
    });
  });

  return { runners, balls };
}
