export type CourtSceneType =
  | 'set_play'
  | 'goal_celebration'
  | 'counter_transition'
  | 'fast_break';

export interface CourtPlayerPose {
  u: number;
  v: number;
  z: number;
  armRaise: number; // 0..1 raised celebratory or shooting arm intensity
}

export interface CourtPlayFrame {
  scene: CourtSceneType;
  sceneLabel: string;
  home: CourtPlayerPose[]; // [GK, LW, LB, CB, RB, RW, Pivot]
  away: CourtPlayerPose[]; // [GK, L1, L2, C1, C2, R2, R1]
  ballPos: [number, number];
  ballZ: number;
  celebrationIntensity: number; // 0..1
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function pose(u: number, v: number, z = 0, armRaise = 0): CourtPlayerPose {
  return {
    u: clamp(u, -0.96, 0.96),
    v: clamp(v, -0.94, 0.94),
    z: Math.max(0, z),
    armRaise: clamp(armRaise, 0, 1),
  };
}

/**
 * Computes animated 7v7 handball choreography across 4 distinct broadcast cut scenes:
 *  1. `set_play`           (0.00..0.30): Half-court weave, pivot screen & airborne jump shot
 *  2. `goal_celebration`   (0.30..0.48): Ball in net, jumping teammates with raised arms, opponent center reset
 *  3. `counter_transition` (0.48..0.72): Opponent throw-off & transition attack pushed left, home GK parry
 *  4. `fast_break`         (0.72..1.00): Home GK long outlet pass, full-court sprint & breakaway finish
 */
export function computeCourtPlayFrame(tactic: string, rawPhase: number): CourtPlayFrame {
  const phase = ((rawPhase % 1) + 1) % 1;
  const lowerTactic = (tactic || '').toLowerCase();
  const isFastBreakTactic = lowerTactic.includes('fast');
  const is7v6 = lowerTactic.includes('7v6');
  const is51 = lowerTactic.includes('5-1') || lowerTactic.includes('5:1');
  const is321 = lowerTactic.includes('3-2-1') || lowerTactic.includes('3:2:1');

  // ---------------------------------------------------------------------------
  // SCENE 1: SET-PLAY HALF-COURT WEAVE & JUMP SHOT (0.00 -> 0.30)
  // ---------------------------------------------------------------------------
  if (phase < 0.3) {
    const t = phase / 0.3;
    const swing = Math.sin(t * Math.PI * 2);
    const surge = Math.max(0, Math.sin((t - 0.5) * Math.PI * 2));
    const shootT = clamp((t - 0.72) / 0.24, 0, 1);
    const shooterJump = Math.sin(shootT * Math.PI) * 0.22;

    const gkHome = pose(is7v6 ? 0.14 : -0.79, is7v6 ? -0.58 : swing * 0.12, 0, 0);
    const atkLW = pose(0.81, -0.82 + surge * 0.08, 0, 0);
    const atkRW = pose(0.82, 0.82 - surge * 0.08, isFastBreakTactic ? shooterJump * 0.6 : 0, isFastBreakTactic ? shootT : 0);
    const atkP = pose(0.69 + surge * 0.05, swing * 0.24, 0, 0);
    const atkLB = pose(0.36 + (swing > 0 ? 0.09 : 0) + surge * 0.12, -0.46 + swing * 0.08, 0, 0);
    const atkCB = pose(0.32 + surge * 0.12, swing * 0.11, 0, 0);
    const atkRB = pose(
      0.38 + (swing < 0 ? 0.09 : 0) + shootT * 0.26,
      0.44 + swing * 0.07 - shootT * 0.18,
      isFastBreakTactic ? 0 : shooterJump,
      isFastBreakTactic ? 0 : shootT * 0.9
    );

    const defShift = swing * 0.11;
    const away: CourtPlayerPose[] = [
      pose(0.92, lerp(swing * 0.14, 0.06, shootT), shooterJump * 0.35, shootT * 0.5),
      pose(0.76, -0.68 + defShift * 0.5),
      pose(is321 ? 0.62 : 0.71, -0.35 + defShift),
      pose(is51 ? 0.51 : is321 ? 0.48 : 0.68, -0.07 + defShift),
      pose(0.69, 0.17 + defShift),
      pose(is321 ? 0.62 : 0.71, 0.42 + defShift),
      pose(0.76, 0.7 + defShift * 0.5),
    ];

    let ballU = atkCB.u;
    let ballV = atkCB.v;
    let ballZ = 0.34 + Math.abs(Math.sin(t * Math.PI * 6)) * 0.12;

    if (t < 0.26) {
      const p = smoothstep(t / 0.26);
      ballU = lerp(atkCB.u, atkLB.u, p);
      ballV = lerp(atkCB.v, atkLB.v, p);
    } else if (t < 0.5) {
      const p = smoothstep((t - 0.26) / 0.24);
      ballU = lerp(atkLB.u, atkCB.u, p);
      ballV = lerp(atkLB.v, atkCB.v, p);
    } else if (t < 0.74) {
      const p = smoothstep((t - 0.5) / 0.24);
      const target = isFastBreakTactic ? atkRW : atkRB;
      ballU = lerp(atkCB.u, target.u, p);
      ballV = lerp(atkCB.v, target.v, p);
    } else {
      const p = smoothstep((t - 0.74) / 0.26);
      const shooter = isFastBreakTactic ? atkRW : atkRB;
      ballU = lerp(shooter.u, 1.02, p);
      ballV = lerp(shooter.v, 0.06, p);
      ballZ = lerp(0.54, 0.28, p) + Math.sin(p * Math.PI) * 0.36;
    }

    return {
      scene: 'set_play',
      sceneLabel: 'Set-Play Attack',
      home: [gkHome, atkLW, atkLB, atkCB, atkRB, atkRW, atkP],
      away,
      ballPos: [ballU, ballV],
      ballZ,
      celebrationIntensity: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // SCENE 2: GOAL CELEBRATION & CENTER THROW-OFF RESET (0.30 -> 0.48)
  // ---------------------------------------------------------------------------
  if (phase < 0.48) {
    const t = (phase - 0.3) / 0.18;
    const huddleEase = smoothstep(Math.min(1, t * 1.6));
    const retreatEase = smoothstep(clamp((t - 0.25) / 0.75, 0, 1));
    const jumpA = Math.abs(Math.sin(t * Math.PI * 4)) * 0.16;
    const jumpB = Math.abs(Math.sin((t + 0.12) * Math.PI * 4)) * 0.15;
    const armWave = 0.8 + 0.2 * Math.abs(Math.sin(t * Math.PI * 4));

    const home: CourtPlayerPose[] = [
      pose(-0.78, 0.0, jumpB * 0.4, 0.85), // GK celebrates back in crease
      pose(lerp(0.81, 0.44, huddleEase), lerp(-0.82, -0.22, huddleEase), jumpB * 0.5, armWave),
      pose(lerp(0.42, 0.32, huddleEase), lerp(-0.44, -0.14, huddleEase), jumpA * 0.7, armWave),
      pose(lerp(0.38, 0.46, huddleEase), lerp(0.05, 0.02, huddleEase), jumpA, 1),
      pose(lerp(0.62, 0.56, huddleEase), lerp(0.24, 0.11, huddleEase), jumpB, 1),
      pose(lerp(0.76, 0.52, huddleEase), lerp(0.74, 0.22, huddleEase), jumpA * 0.85, armWave),
      pose(lerp(0.68, 0.48, huddleEase), lerp(0.18, -0.09, huddleEase), jumpB * 0.9, 1),
    ];

    // Opponent GK fetches ball from net; defenders jog back toward half-court throw-off
    const away: CourtPlayerPose[] = [
      pose(0.9, lerp(0.06, 0.0, retreatEase), 0, 0),
      pose(lerp(0.76, 0.26, retreatEase), lerp(-0.66, -0.48, retreatEase)),
      pose(lerp(0.7, 0.18, retreatEase), lerp(-0.34, -0.24, retreatEase)),
      pose(lerp(0.66, 0.04, retreatEase), lerp(-0.08, 0.0, retreatEase)), // Center throw-off taker
      pose(lerp(0.68, 0.14, retreatEase), lerp(0.18, 0.26, retreatEase)),
      pose(lerp(0.7, 0.22, retreatEase), lerp(0.42, 0.52, retreatEase)),
      pose(lerp(0.76, 0.3, retreatEase), lerp(0.7, 0.74, retreatEase)),
    ];

    // Ball rests briefly in net, then GK tosses to center circle for throw-off
    let ballU = 1.03;
    let ballV = 0.05;
    let ballZ = 0.16 + Math.abs(Math.sin(t * Math.PI * 3)) * 0.06 * (1 - t);
    if (t > 0.42) {
      const passT = smoothstep((t - 0.42) / 0.58);
      ballU = lerp(0.92, 0.04, passT);
      ballV = lerp(0.04, 0.0, passT);
      ballZ = 0.32 + Math.sin(passT * Math.PI) * 0.38;
    }

    return {
      scene: 'goal_celebration',
      sceneLabel: 'Goal Celebration',
      home,
      away,
      ballPos: [ballU, ballV],
      ballZ,
      celebrationIntensity: clamp(1 - t * 0.35, 0.35, 1),
    };
  }

  // ---------------------------------------------------------------------------
  // SCENE 3: OPPONENT COUNTER-TRANSITION PUSH LEFT & HOME GK SAVE (0.48 -> 0.72)
  // ---------------------------------------------------------------------------
  if (phase < 0.72) {
    const t = (phase - 0.48) / 0.24;
    const push = smoothstep(Math.min(1, t * 1.25));
    const shotT = clamp((t - 0.68) / 0.26, 0, 1);
    const shooterJump = Math.sin(shotT * Math.PI) * 0.2;

    // Home squad drops into compact defensive shape in front of left goal (-1)
    const home: CourtPlayerPose[] = [
      pose(-0.91, lerp(0.0, -0.14, shotT), shooterJump * 0.4, shotT * 0.85), // Home GK makes save
      pose(lerp(0.42, -0.74, push), lerp(-0.22, -0.68, push)),
      pose(lerp(0.32, -0.68, push), lerp(-0.14, -0.34, push)),
      pose(lerp(0.44, -0.58, push), lerp(0.02, -0.06, push)),
      pose(lerp(0.52, -0.66, push), lerp(0.12, 0.24, push)),
      pose(lerp(0.48, -0.74, push), lerp(0.24, 0.66, push)),
      pose(lerp(0.46, -0.64, push), lerp(-0.08, 0.06, push)),
    ];

    // Opponent attacks left goal (-1)
    const atkRunnerU = lerp(0.04, -0.44, push);
    const wingRunnerU = lerp(0.22, -0.78, push);
    const away: CourtPlayerPose[] = [
      pose(0.88, 0.0),
      pose(wingRunnerU, lerp(-0.48, -0.76, push)),
      pose(lerp(0.18, -0.42, push), lerp(-0.24, -0.46, push), shooterJump, shotT * 0.85),
      pose(atkRunnerU, lerp(0.0, -0.08, push)),
      pose(lerp(0.14, -0.66, push), lerp(0.26, 0.18, push)),
      pose(lerp(0.22, -0.46, push), lerp(0.52, 0.48, push)),
      pose(lerp(0.3, -0.76, push), lerp(0.74, 0.78, push)),
    ];

    let ballU = away[3].u;
    let ballV = away[3].v;
    let ballZ = 0.34;
    if (t < 0.36) {
      const p = smoothstep(t / 0.36);
      ballU = lerp(0.04, away[3].u, p);
      ballV = lerp(0.0, away[3].v, p);
      ballZ = 0.35 + Math.abs(Math.sin(p * Math.PI * 3)) * 0.14;
    } else if (t < 0.68) {
      const p = smoothstep((t - 0.36) / 0.32);
      ballU = lerp(away[3].u, away[2].u, p);
      ballV = lerp(away[3].v, away[2].v, p);
      ballZ = 0.36 + Math.sin(p * Math.PI) * 0.18;
    } else {
      const p = smoothstep((t - 0.68) / 0.32);
      // Shot saved by Home GK around u = -0.88
      ballU = lerp(away[2].u, -0.88, p);
      ballV = lerp(away[2].v, -0.08, p);
      ballZ = 0.5 + Math.sin(p * Math.PI) * 0.28;
    }

    return {
      scene: 'counter_transition',
      sceneLabel: 'Defensive Transition',
      home,
      away,
      ballPos: [ballU, ballV],
      ballZ,
      celebrationIntensity: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // SCENE 4: FULL-COURT FAST-BREAK TRANSITION & BREAKAWAY FINISH (0.72 -> 1.00)
  // ---------------------------------------------------------------------------
  const t = (phase - 0.72) / 0.28;
  const outletT = clamp(t / 0.35, 0, 1);
  const sprintT = smoothstep(t);
  const finishT = clamp((t - 0.74) / 0.24, 0, 1);
  const breakJump = Math.sin(finishT * Math.PI) * 0.24;

  // Home GK steps to edge of 6m and whips long outlet pass; wings & center fly down court!
  const home: CourtPlayerPose[] = [
    pose(lerp(-0.9, -0.78, Math.min(1, t * 2.5)), lerp(-0.08, 0.0, sprintT), 0, outletT < 0.8 ? 0.6 : 0),
    pose(lerp(-0.74, 0.8, sprintT), lerp(-0.68, -0.8, sprintT)),
    pose(lerp(-0.68, 0.36, sprintT), lerp(-0.34, -0.45, sprintT)),
    pose(lerp(-0.58, 0.32, sprintT), lerp(-0.06, 0.0, sprintT)),
    pose(lerp(-0.66, 0.42, sprintT), lerp(0.24, 0.44, sprintT)),
    pose(lerp(-0.7, 0.79, sprintT), lerp(0.66, 0.32 + Math.sin(sprintT * Math.PI) * 0.14, sprintT), breakJump, finishT * 0.9),
    pose(lerp(-0.64, 0.68, sprintT), lerp(0.06, -0.08, sprintT)),
  ];

  // Away defenders sprint back trying to recover 6m block
  const recoverT = smoothstep(clamp((t - 0.08) / 0.92, 0, 1));
  const away: CourtPlayerPose[] = [
    pose(0.91, lerp(0.0, 0.1, finishT), breakJump * 0.35, finishT * 0.55),
    pose(lerp(-0.64, 0.74, recoverT), lerp(-0.6, -0.66, recoverT)),
    pose(lerp(-0.42, 0.68, recoverT), lerp(-0.44, -0.34, recoverT)),
    pose(lerp(-0.44, 0.62, recoverT), lerp(-0.08, -0.06, recoverT)),
    pose(lerp(-0.64, 0.66, recoverT), lerp(0.18, 0.18, recoverT)),
    pose(lerp(-0.46, 0.69, recoverT), lerp(0.48, 0.42, recoverT)),
    pose(lerp(-0.74, 0.75, recoverT), lerp(0.76, 0.68, recoverT)),
  ];

  let ballU = -0.85;
  let ballV = -0.05;
  let ballZ = 0.36;

  if (t < 0.35) {
    // High-arcing GK long outlet pass into streaking right-wing runner
    const p = smoothstep(t / 0.35);
    ballU = lerp(-0.85, home[5].u, p);
    ballV = lerp(-0.05, home[5].v, p);
    ballZ = 0.45 + Math.sin(p * Math.PI) * 0.58;
  } else if (t < 0.74) {
    // Wing dribbles fast toward right goal
    const p = (t - 0.35) / 0.39;
    ballU = home[5].u + 0.02;
    ballV = home[5].v;
    ballZ = 0.25 + Math.abs(Math.sin(p * Math.PI * 5)) * 0.18;
  } else {
    // Airborne fast-break finish over keeper into goal
    const p = smoothstep((t - 0.74) / 0.26);
    ballU = lerp(home[5].u, 0.98, p);
    ballV = lerp(home[5].v, 0.04, p);
    ballZ = lerp(0.56, 0.26, p) + Math.sin(p * Math.PI) * 0.32;
  }

  return {
    scene: 'fast_break',
    sceneLabel: 'Fast-Break Transition',
    home,
    away,
    ballPos: [ballU, ballV],
    ballZ,
    celebrationIntensity: 0,
  };
}
