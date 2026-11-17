import { SeatOccupantKind } from './arenaArchitecture';
import { CourtSceneType } from './courtPlayScenes';

export interface FanAnimationInput {
  occupant: SeatOccupantKind;
  standIndex: number; // 0=far sideline, 1=left home endzone, 2=right away endzone, 3=near sideline
  tierIndex: 0 | 1;
  rowIndex: number;
  colIndex: number;
  totalCols: number;
  timestampMs: number;
  scene: CourtSceneType;
  cyclePhase: number; // 0..1 full 4-scene cycle phase
  celebrationIntensity: number; // 0..1
  isSimulatingLive: boolean;
  prefersReducedMotion: boolean;
}

export interface FanAnimationPose {
  dyNormalized: number; // Vertical offset in seatScale units (negative = jumping up)
  swayXNormalized: number; // Horizontal sway in seatScale units
  armRaise: number; // 0..1 raised cheering/clapping arm intensity
  holdingScarf: boolean; // True when supporter raises club scarf overhead
  wavingFlag: boolean; // True when supporter waves a two-tone team flag on a pole
  flagWaveAngle: number; // -1..1 horizontal flutter of the team flag
  topDownPulse: number; // Radius multiplier in top-down camera
}

function hashFan(standIndex: number, tierIndex: number, rowIndex: number, colIndex: number): number {
  let h =
    (standIndex * 374761393 +
      tierIndex * 668265263 +
      rowIndex * 1274126177 +
      colIndex * 1597334677) >>>
    0;
  h = Math.imul(h ^ (h >>> 13), 2246822519) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/**
 * Pure crowd animation solver for the 3D Handball Arena.
 * Synchronizes home Ultras, general seating, team flag-bearers, and away supporters with live on-court play.
 */
export function computeFanAnimationPose(input: FanAnimationInput): FanAnimationPose {
  if (input.occupant === 'empty' || input.prefersReducedMotion) {
    return {
      dyNormalized: 0,
      swayXNormalized: 0,
      armRaise: 0,
      holdingScarf: false,
      wavingFlag: false,
      flagWaveAngle: 0,
      topDownPulse: 1,
    };
  }

  const isAwayFan = input.occupant === 'away_fan';
  const isHomeUltrasZone =
    !isAwayFan &&
    (input.standIndex === 1 || (input.tierIndex === 0 && input.rowIndex <= 1));

  const rand = hashFan(input.standIndex, input.tierIndex, input.rowIndex, input.colIndex);
  const flagRand = hashFan(
    input.standIndex + 7,
    input.tierIndex + 3,
    input.rowIndex + 11,
    input.colIndex + 19
  );
  const individualFreq = 0.88 + rand * 0.28;
  const individualPhase = rand * Math.PI * 2 + input.colIndex * 0.47 + input.rowIndex * 0.83;
  const tempoMult = input.isSimulatingLive ? 1.55 : 1.0;
  const tSec = input.timestampMs * 0.001 * tempoMult;

  const normCol = input.totalCols > 1 ? input.colIndex / (input.totalCols - 1) : 0.5;

  // Deterministic club flag-bearers in home stands (Ultras behind left goal + passionate lower-bowl clusters)
  const isDesignatedFlagBearer =
    !isAwayFan &&
    (input.standIndex === 1
      ? flagRand < 0.085
      : input.tierIndex === 0
      ? flagRand < 0.028
      : flagRand < 0.012);

  let dy = 0;
  let swayX = 0;
  let armRaise = 0;
  let holdingScarf = false;
  let wavingFlag = false;
  let flagWaveAngle = 0;
  let topDownPulse = 1;

  if (input.scene === 'goal_celebration') {
    if (isAwayFan) {
      dy = Math.sin(tSec * 1.8 + individualPhase) * 0.08;
      swayX = 0;
      armRaise = 0;
      topDownPulse = 0.96;
    } else {
      const intensity = Math.max(0.45, input.celebrationIntensity);
      const waveAngle =
        tSec * 5.6 - (input.standIndex * 1.35 + normCol * Math.PI * 2.2) + input.rowIndex * 0.16;
      const waveCrest = Math.max(0, Math.sin(waveAngle));
      const jumpBounce = Math.abs(Math.sin(tSec * 6.8 * individualFreq + individualPhase));

      const ultrasBoost = isHomeUltrasZone ? 1.22 : 1.0;
      dy = -(0.55 + jumpBounce * 1.35 + waveCrest * 0.75) * intensity * ultrasBoost;
      swayX = Math.sin(tSec * 4.2 + individualPhase) * 0.28 * intensity;
      armRaise = Math.min(1, (0.58 + jumpBounce * 0.42 + waveCrest * 0.25) * intensity);

      if (isDesignatedFlagBearer || (!isAwayFan && input.standIndex === 1 && flagRand < 0.13)) {
        wavingFlag = true;
        flagWaveAngle = Math.sin(tSec * 7.8 * individualFreq + individualPhase);
      } else {
        const scarfThreshold = isHomeUltrasZone ? 0.16 : 0.07;
        holdingScarf = rand < scarfThreshold && armRaise > 0.58;
      }
      topDownPulse = 1 + (jumpBounce * 0.16 + waveCrest * 0.12) * intensity;
    }
  } else if (input.scene === 'fast_break') {
    const fbT = Math.max(0, Math.min(1, (input.cyclePhase - 0.72) / 0.28));
    if (isAwayFan) {
      dy = -Math.abs(Math.sin(tSec * 3.2 + individualPhase)) * 0.22;
      armRaise = rand < 0.18 ? 0.35 : 0;
    } else {
      const surge = 0.45 + fbT * 0.75;
      const bounce = Math.abs(Math.sin(tSec * 5.8 * individualFreq + individualPhase));
      dy = -(0.22 + bounce * 0.92 * surge) * (isHomeUltrasZone ? 1.18 : 1.0);
      swayX = Math.sin(tSec * 3.8 + individualPhase) * 0.22;
      armRaise = fbT > 0.55 || isHomeUltrasZone ? (0.35 + bounce * 0.55) * surge : bounce * 0.35;
      if (isDesignatedFlagBearer) {
        wavingFlag = true;
        flagWaveAngle = Math.sin(tSec * 6.4 * individualFreq + individualPhase);
      } else {
        holdingScarf = isHomeUltrasZone && rand < 0.09 && fbT > 0.65;
      }
      topDownPulse = 1 + bounce * 0.13 * surge;
    }
  } else if (input.scene === 'counter_transition') {
    const ctT = Math.max(0, Math.min(1, (input.cyclePhase - 0.48) / 0.24));
    const gkSaveMoment = ctT > 0.72;

    if (isAwayFan) {
      const awayExcite = gkSaveMoment ? 0.35 : 1.0;
      const bounce = Math.abs(Math.sin(tSec * 5.4 * individualFreq + individualPhase));
      dy = -(0.25 + bounce * 0.85) * awayExcite;
      swayX = Math.sin(tSec * 3.6 + individualPhase) * 0.2 * awayExcite;
      armRaise = gkSaveMoment ? 0.15 : 0.45 + bounce * 0.45;
      topDownPulse = 1 + bounce * 0.12 * awayExcite;
    } else if (gkSaveMoment) {
      const behindKeeperBoost = input.standIndex === 1 ? 1.35 : 0.95;
      const saveBounce = Math.abs(Math.sin(tSec * 6.4 * individualFreq + individualPhase));
      dy = -(0.35 + saveBounce * 0.95) * behindKeeperBoost;
      swayX = Math.sin(tSec * 4.0 + individualPhase) * 0.2;
      armRaise = Math.min(1, (0.45 + saveBounce * 0.5) * behindKeeperBoost);
      if (isDesignatedFlagBearer) {
        wavingFlag = true;
        flagWaveAngle = Math.sin(tSec * 6.8 + individualPhase);
      } else {
        holdingScarf = input.standIndex === 1 && rand < 0.1;
      }
      topDownPulse = 1 + saveBounce * 0.14;
    } else {
      const clapBeat = Math.abs(Math.sin(tSec * 4.2 + input.colIndex * 0.18 + rand * 0.8));
      dy = -clapBeat * (isHomeUltrasZone ? 0.48 : 0.3);
      swayX = Math.sin(tSec * 2.6 + individualPhase) * 0.16;
      armRaise = isHomeUltrasZone && rand < 0.28 ? 0.28 + clapBeat * 0.3 : 0;
      if (isDesignatedFlagBearer && input.standIndex === 1) {
        wavingFlag = true;
        flagWaveAngle = Math.sin(tSec * 4.4 + individualPhase) * 0.75;
      }
      topDownPulse = 1 + clapBeat * 0.06;
    }
  } else {
    // `set_play` (0.00..0.30): Rhythmic European handball arena clap + Ultras flag-waving
    const spT = Math.max(0, Math.min(1, input.cyclePhase / 0.3));
    const shotAnticipation = spT > 0.68 ? (spT - 0.68) / 0.32 : 0;

    if (isAwayFan) {
      const sway = Math.sin(tSec * 2.8 + individualPhase);
      dy = -Math.abs(sway) * 0.22;
      swayX = sway * 0.12;
      armRaise = rand < 0.12 ? 0.25 : 0;
    } else {
      const drumBeat = Math.abs(Math.sin(tSec * 4.6 + (isHomeUltrasZone ? normCol * 1.2 : individualPhase)));
      const rise = 1 + shotAnticipation * 0.65;
      dy = -(0.16 + drumBeat * (isHomeUltrasZone ? 0.62 : 0.38)) * rise;
      swayX = Math.sin(tSec * 2.9 + individualPhase) * 0.18;
      if (isDesignatedFlagBearer) {
        wavingFlag = true;
        flagWaveAngle = Math.sin(tSec * 5.0 * individualFreq + individualPhase) * 0.88;
      } else if (isHomeUltrasZone && rand < 0.34) {
        armRaise = (0.26 + drumBeat * 0.42) * rise;
        holdingScarf = rand < 0.06 && drumBeat > 0.65;
      } else if (shotAnticipation > 0.35 && rand < 0.4) {
        armRaise = shotAnticipation * 0.65;
      }
      topDownPulse = 1 + drumBeat * 0.08 * rise;
    }
  }

  return {
    dyNormalized: dy,
    swayXNormalized: swayX,
    armRaise: Math.max(0, Math.min(1, armRaise)),
    holdingScarf,
    wavingFlag,
    flagWaveAngle,
    topDownPulse,
  };
}

const SKIN_HAIR_PALETTE = ['#F0C8A8', '#D8A07C', '#B67B56', '#7A5038', '#E6B896'] as const;

export function resolveSpectatorHeadColor(
  standIndex: number,
  tierIndex: number,
  rowIndex: number,
  colIndex: number
): string {
  const idx =
    ((standIndex * 19 + tierIndex * 11 + rowIndex * 37 + colIndex * 23) >>> 0) %
    SKIN_HAIR_PALETTE.length;
  return SKIN_HAIR_PALETTE[idx];
}
