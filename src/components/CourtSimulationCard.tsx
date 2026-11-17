import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameState, Language } from '../types';
import { CourtsideAnalytics, LiveSeasonProgress, resolveArenaColorScheme } from '../utils/courtsideStats';
import {
  ArenaArchitectureModel,
  ArenaDesignId,
  buildArenaArchitectureModel,
  evaluateArenaSeat,
} from '../utils/arenaArchitecture';
import { ClubLogo } from './ClubLogo';
import { SimulatingOverlay, SimulatedFixture } from './SimulatingOverlay';
import {
  ActiveSponsorBrand,
  computeFittedBoardFontPx,
  formatSponsorBoardText,
  normalizeReadableBoardAngle,
  resolveActiveSponsorBrands,
} from '../utils/sponsorBranding';
import { computeCourtPlayFrame, CourtPlayFrame } from '../utils/courtPlayScenes';
import {
  computeFanAnimationPose,
  resolveSpectatorHeadColor,
} from '../utils/arenaCrowdAnimation';

export type CourtCameraMode = 'isometric' | 'topdown' | 'endzone';

interface CourtSimulationCardProps {
  analytics: CourtsideAnalytics;
  club?: any;
  simState?: GameState;
  tactic: string;
  isFirstHalf: boolean;
  hasSupercup: boolean;
  supercupTitle?: string;
  isRelegationFight?: boolean;
  mediaPressureScore: number;
  disabled?: boolean;
  lang?: Language;
  variant?: 'matchday' | 'infrastructure';
  overrideCapacity?: number;
  overrideAttendance?: number;
  overrideDesignId?: ArenaDesignId;
  sponsors?: ActiveSponsorBrand[];
  isSimulatingLive?: boolean;
  simulationPhase?: 'first_half' | 'second_half' | 'full' | 'idle';
  totalMatchdays?: number;
  onSimulationComplete?: () => void;
  onLiveProgressChange?: (progress: LiveSeasonProgress | null) => void;
  onOpenTeamModal?: (clubObj?: any) => void;
  onSimulate: () => void;
  onOpenTactics: () => void;
  onOpenPressRoom: () => void;
  onOpenArena: () => void;
}

interface Vec2 {
  x: number;
  y: number;
}

export const CourtSimulationCard: React.FC<CourtSimulationCardProps> = ({
  analytics,
  club,
  simState,
  tactic,
  isFirstHalf,
  hasSupercup,
  supercupTitle,
  isRelegationFight = false,
  mediaPressureScore,
  disabled = false,
  lang = 'en',
  variant = 'matchday',
  overrideCapacity,
  overrideAttendance,
  overrideDesignId,
  sponsors,
  isSimulatingLive = false,
  simulationPhase = 'full',
  totalMatchdays = 34,
  onSimulationComplete,
  onLiveProgressChange,
  onOpenTeamModal,
  onSimulate,
  onOpenTactics,
  onOpenArena,
}) => {
  const activeSponsors = useMemo(
    () => sponsors ?? resolveActiveSponsorBrands(simState),
    [sponsors, simState]
  );
  const [camera, setCamera] = useState<CourtCameraMode>('isometric');
  const [liveOpponent, setLiveOpponent] = useState<{
    color?: string;
    color2?: string;
  } | null>(null);

  const onLiveProgressChangeRef = useRef(onLiveProgressChange);
  useEffect(() => {
    onLiveProgressChangeRef.current = onLiveProgressChange;
  }, [onLiveProgressChange]);

  useEffect(() => {
    if (!isSimulatingLive) {
      setLiveOpponent(null);
      onLiveProgressChangeRef.current?.(null);
    }
  }, [isSimulatingLive]);

  const handleLiveFixtureChange = useCallback(
    (
      fixture: SimulatedFixture,
      _matchday: number,
      _targetEnd: number,
      liveProgress: LiveSeasonProgress
    ) => {
      setLiveOpponent({
        color: fixture.opponent.color,
        color2: fixture.opponent.color2,
      });
      onLiveProgressChangeRef.current?.(liveProgress);
    },
    []
  );

  const activeColors = useMemo(
    () =>
      resolveArenaColorScheme(
        club?.color || analytics.clubColor,
        club?.color2 || analytics.clubColor2,
        liveOpponent?.color || analytics.featuredMatch.opponentColor,
        liveOpponent?.color2 || analytics.featuredMatch.opponentColor2
      ),
    [
      club?.color,
      club?.color2,
      analytics.clubColor,
      analytics.clubColor2,
      liveOpponent?.color,
      liveOpponent?.color2,
      analytics.featuredMatch.opponentColor,
      analytics.featuredMatch.opponentColor2,
    ]
  );

  const isEmptyInfrastructure = variant === 'infrastructure';
  const effectiveCapacity = overrideCapacity ?? club?.stadium ?? analytics.stadiumCapacity ?? 4500;
  const effectiveAttendance = isEmptyInfrastructure
    ? 0
    : overrideAttendance ?? analytics.featuredMatch.attendanceNumeric ?? Math.round(effectiveCapacity * 0.85);
  const effectiveDesignId: ArenaDesignId =
    overrideDesignId ?? club?.arenaDesign ?? analytics.arenaDesign ?? 'terracotta_courtside';

  const isVipStrategyActive =
    (club?.fanStrategy || simState?.fanStrategy) === 'corporate';

  const arenaModel: ArenaArchitectureModel = useMemo(
    () =>
      buildArenaArchitectureModel({
        capacity: effectiveCapacity,
        attendance: effectiveAttendance,
        designId: effectiveDesignId,
        clubColors: activeColors,
        vipEnabled: isVipStrategyActive,
        seed: (analytics.selectedYear || 2026) + String(analytics.clubFullName || '').length * 13,
      }),
    [
      effectiveCapacity,
      effectiveAttendance,
      effectiveDesignId,
      activeColors,
      isVipStrategyActive,
      analytics.selectedYear,
      analytics.clubFullName,
    ]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const centerLogoImgRef = useRef<HTMLImageElement | null>(null);

  // Preload official local club crest if present so it can be painted cleanly at center court
  useEffect(() => {
    const candidateLogo = club?.logo || analytics.clubLogo;
    if (!candidateLogo || typeof Image === 'undefined') {
      centerLogoImgRef.current = null;
      redrawRef.current?.();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      centerLogoImgRef.current = img;
      redrawRef.current?.();
    };
    img.onerror = () => {
      centerLogoImgRef.current = null;
      redrawRef.current?.();
    };
    img.src = candidateLogo;
  }, [club?.logo, analytics.clubLogo]);

  const propsRef = useRef({
    camera,
    tactic,
    clubShortName: analytics.clubShortName,
    clubCode: analytics.clubCode,
    arenaName: analytics.arenaName,
    activeColors,
    arenaModel,
    activeSponsors,
    isSimulatingLive,
    variant,
  });

  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    propsRef.current = {
      camera,
      tactic,
      clubShortName: analytics.clubShortName,
      clubCode: analytics.clubCode,
      arenaName: analytics.arenaName,
      activeColors,
      arenaModel,
      activeSponsors,
      isSimulatingLive,
      variant,
    };
    redrawRef.current?.();
  }, [
    camera,
    tactic,
    analytics.clubShortName,
    analytics.clubCode,
    analytics.arenaName,
    activeColors,
    arenaModel,
    activeSponsors,
    isSimulatingLive,
    variant,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scheduleNext = () => {
      if (unmounted || prefersReducedMotion || propsRef.current.variant === 'infrastructure') return;
      const delayMs = propsRef.current.isSimulatingLive ? 45 : 64;
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        if (!unmounted) {
          rafId = requestAnimationFrame(renderFrame);
        }
      }, delayMs);
    };

    const renderFrame = (timestamp: number) => {
      if (unmounted) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) {
        scheduleNext();
        return;
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;
      const isCompact = W < 500;

      const {
        camera: cam,
        tactic: curTactic,
        clubShortName,
        clubCode,
        arenaName: curArenaName,
        activeColors: colors,
        arenaModel: arch,
        activeSponsors: curSponsors,
        isSimulatingLive: liveSim,
        variant: curVariant,
      } = propsRef.current;

      const { design, tier } = arch;

      // 1. Arena Bowl Background
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, design.bowlBgStops[0]);
      bgGrad.addColorStop(0.5, design.bowlBgStops[1]);
      bgGrad.addColorStop(1, design.bowlBgStops[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle arena spotlight glow over center court (scales brighter for bigger roof rigs & 14k+ luxury)
      const spotY = curVariant === 'infrastructure' ? H * 0.54 : isCompact ? H * 0.57 : H * 0.55;
      const spot = ctx.createRadialGradient(W * 0.5, spotY, 16, W * 0.5, spotY, W * (tier.hasLuxuryFinish ? 0.62 : 0.56));
      spot.addColorStop(
        0,
        tier.hasLuxuryFinish
          ? 'rgba(255, 228, 178, 0.22)'
          : tier.hasRoofRig
          ? 'rgba(255, 232, 198, 0.16)'
          : 'rgba(255, 224, 185, 0.11)'
      );
      spot.addColorStop(1, 'rgba(16, 22, 36, 0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, H);

      // Responsive 3D -> 2D Camera Projection (scales cleanly down to 320px mobile!)
      const hasUpper = tier.upperRows > 0;
      const bowlZoomAdjust = hasUpper ? 0.92 : 0.98;

      const project = (u: number, v: number, z = 0): Vec2 => {
        if (cam === 'topdown') {
          const maxWFactor = isCompact ? 0.72 : 0.62;
          const maxHFactor = isCompact ? 0.66 : 0.92;
          const cw = Math.min(W * maxWFactor, H * maxHFactor) * bowlZoomAdjust;
          const ch = cw * 0.5;
          const cx = W * 0.5;
          const cy = curVariant === 'infrastructure' ? H * 0.53 : isCompact ? H * 0.58 : H * 0.56;
          return {
            x: cx + u * (cw * 0.5),
            y: cy + v * (ch * 0.5) - z * 11,
          };
        }
        if (cam === 'endzone') {
          const depth = (u + 1) * 0.5;
          const persp = 0.48 + depth * 0.5;
          const cx = W * 0.5;
          const topBase = curVariant === 'infrastructure' ? H * 0.29 : isCompact ? H * 0.36 : H * 0.31;
          const spanH = isCompact ? H * 0.43 : H * 0.48;
          const cy = topBase + depth * spanH;
          return {
            x: cx + v * (W * (isCompact ? 0.35 : 0.33)) * persp * bowlZoomAdjust,
            y: cy - z * 24 * persp,
          };
        }
        const cx = W * 0.495;
        const cy =
          curVariant === 'infrastructure'
            ? H * 0.555
            : isCompact
            ? H * 0.595
            : H * 0.565;
        const baseScale = isCompact
          ? Math.min(W / 540, H / 430)
          : Math.min(W / 685, H / 455);
        const scale = baseScale * bowlZoomAdjust;
        const ux = 196 * scale;
        const uy = 93 * scale;
        const vx = -122 * scale;
        const vy = 70 * scale;
        return {
          x: cx + u * ux + v * vx,
          y: cy + u * uy + v * vy - z * 34 * scale,
        };
      };

      const seatScale = Math.max(0.62, Math.min(1.08, W / 640));

      // Solve on-court play frame upfront so every stadium tribune reacts live to goals, saves & fast breaks
      let activePlayFrame: CourtPlayFrame | null = null;
      let activeCyclePhase = 0.18;
      if (curVariant !== 'infrastructure') {
        const tempoFactor = liveSim ? 2.4 : 1;
        const cycleDuration = 22 / tempoFactor;
        activeCyclePhase = prefersReducedMotion
          ? 0.18
          : ((timestamp * 0.001) % cycleDuration) / cycleDuration;
        activePlayFrame = computeCourtPlayFrame(curTactic, activeCyclePhase);
        if (canvas.dataset.scene !== activePlayFrame.scene) {
          canvas.dataset.scene = activePlayFrame.scene;
        }
        const nextCrowdState =
          arch.attendance <= 0
            ? 'empty'
            : activePlayFrame.scene === 'goal_celebration'
            ? 'celebrating'
            : activePlayFrame.scene === 'fast_break'
            ? 'surging'
            : activePlayFrame.scene === 'counter_transition'
            ? 'defending'
            : 'chanting';
        if (canvas.dataset.crowdState !== nextCrowdState) {
          canvas.dataset.crowdState = nextCrowdState;
        }
      } else if (canvas.dataset.crowdState !== 'empty') {
        canvas.dataset.crowdState = 'empty';
      }

      const fillQuad = (a: Vec2, b: Vec2, c: Vec2, d: Vec2, fill: string, stroke?: string) => {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      };

      // Helper: Draw a single seat shell or animated spectator at projected 2D point
      const drawSeatOrFan = (
        pt: Vec2,
        occupant: ReturnType<typeof evaluateArenaSeat>,
        standIdx: number,
        tierIdx: 0 | 1,
        rowIdx: number,
        colIdx: number,
        totalCols: number,
        isTopDown = false
      ) => {
        const rBase = (isTopDown ? 2.2 : 2.76) * seatScale;
        if (occupant === 'empty') {
          // Empty structural plastic bucket seat shell
          ctx.fillStyle = design.emptySeatHex;
          ctx.fillRect(pt.x - rBase * 0.95, pt.y - rBase * 0.75, rBase * 1.9, rBase * 1.35);
          ctx.fillStyle = design.emptySeatBackHex;
          ctx.fillRect(pt.x - rBase * 0.85, pt.y - rBase * 1.05, rBase * 1.7, rBase * 0.45);
          return;
        }

        const fanColor =
          occupant === 'away_fan'
            ? colors.awayJerseyColor
            : occupant === 'home_primary'
            ? colors.homeJerseyColor
            : colors.homeShortsColor;

        const fanPose = computeFanAnimationPose({
          occupant,
          standIndex: standIdx,
          tierIndex: tierIdx,
          rowIndex: rowIdx,
          colIndex: colIdx,
          totalCols,
          timestampMs: timestamp,
          scene: activePlayFrame ? activePlayFrame.scene : 'set_play',
          cyclePhase: activeCyclePhase,
          celebrationIntensity: activePlayFrame ? activePlayFrame.celebrationIntensity : 0,
          isSimulatingLive: liveSim,
          prefersReducedMotion,
        });

        if (isTopDown) {
          const pulsedR = rBase * 1.06 * fanPose.topDownPulse;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pulsedR, 0, Math.PI * 2);
          ctx.fillStyle = fanColor;
          ctx.fill();
          if (fanPose.wavingFlag) {
            const flagSec =
              colors.homeShortsColor.toUpperCase() === colors.homeJerseyColor.toUpperCase()
                ? '#FFFFFF'
                : colors.homeShortsColor;
            ctx.fillStyle = colors.homeJerseyColor;
            ctx.fillRect(pt.x - pulsedR * 1.35, pt.y - pulsedR * 1.25, pulsedR * 1.35, pulsedR * 0.9);
            ctx.fillStyle = flagSec;
            ctx.fillRect(pt.x, pt.y - pulsedR * 1.25, pulsedR * 1.35, pulsedR * 0.9);
          } else if (fanPose.holdingScarf) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(pt.x - pulsedR * 0.95, pt.y - pulsedR * 0.32, pulsedR * 1.9, pulsedR * 0.64);
          }
          return;
        }

        const dx = fanPose.swayXNormalized * rBase;
        const dy = fanPose.dyNormalized * rBase;
        const fx = pt.x + dx;
        const fy = pt.y + dy;

        // Subtle bucket-seat base glimpse underneath jumping supporters
        if (fanPose.dyNormalized < -0.55) {
          ctx.fillStyle = design.emptySeatHex;
          ctx.fillRect(pt.x - rBase * 0.8, pt.y - rBase * 0.35, rBase * 1.6, rBase * 0.75);
        }

        // Raised cheering / clapping arms & optional overhead Ultras scarf (fast fillRect V-arms)
        if (fanPose.armRaise > 0.26) {
          const armLift = (1.05 + fanPose.armRaise * 1.55) * rBase;
          const armSpread = (0.92 + fanPose.armRaise * 0.48) * rBase;
          const armThick = Math.max(1.15, 0.54 * rBase);
          const shoulderY = fy - rBase * 0.42;

          ctx.fillStyle = fanColor;
          ctx.fillRect(fx - rBase * 0.96, shoulderY - armLift * 0.56, armThick, armLift * 0.6);
          ctx.fillRect(fx - armSpread - armThick * 0.35, shoulderY - armLift, armThick, armLift * 0.58);
          ctx.fillRect(fx + rBase * 0.96 - armThick, shoulderY - armLift * 0.56, armThick, armLift * 0.6);
          ctx.fillRect(fx + armSpread - armThick * 0.65, shoulderY - armLift, armThick, armLift * 0.58);

          if (fanPose.holdingScarf && !fanPose.wavingFlag) {
            const scarfY = shoulderY - armLift - rBase * 0.18;
            const scarfHalfW = armSpread * 1.08;
            const scarfH = Math.max(1.45, rBase * 0.58);
            ctx.fillStyle = colors.homeJerseyColor;
            ctx.fillRect(fx - scarfHalfW, scarfY - scarfH * 0.5, scarfHalfW * 2, scarfH);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(fx - scarfHalfW, scarfY - scarfH * 0.5, scarfHalfW * 0.36, scarfH);
            ctx.fillRect(fx + scarfHalfW * 0.64, scarfY - scarfH * 0.5, scarfHalfW * 0.36, scarfH);
          }
        }

        // Spectator shoulders/shirt (slightly fuller shoulder span for authentic dense cauldron crowd)
        ctx.beginPath();
        ctx.ellipse(fx, fy, rBase * 1.28, rBase * 1.0, 0, 0, Math.PI * 2);
        ctx.fillStyle = fanColor;
        ctx.fill();

        // Spectator head with natural non-striped variation
        ctx.beginPath();
        ctx.arc(fx, fy - rBase * 1.14, rBase * 0.69, 0, Math.PI * 2);
        ctx.fillStyle = resolveSpectatorHeadColor(standIdx, tierIdx, rowIdx, colIdx);
        ctx.fill();

        // Waving Team-Colored Supporter Flag (fast polygon quads — zero stroke tessellation overhead)
        if (fanPose.wavingFlag) {
          const tilt = fanPose.flagWaveAngle * 0.42;
          const poleLen = rBase * 4.4;
          const baseX = fx + rBase * 0.72;
          const baseY = fy - rBase * 0.55;
          const tipX = baseX + Math.sin(tilt) * poleLen;
          const tipY = baseY - Math.cos(tilt) * poleLen;

          // Flagpole shaft
          ctx.fillStyle = '#E2E8F0';
          ctx.beginPath();
          ctx.moveTo(baseX - 0.6, baseY);
          ctx.lineTo(baseX + 0.6, baseY);
          ctx.lineTo(tipX + 0.6, tipY);
          ctx.lineTo(tipX - 0.6, tipY);
          ctx.closePath();
          ctx.fill();

          const dirSign = tilt >= 0 ? 1 : -1;
          const flagW = rBase * 3.35 * dirSign;
          const flagH = rBase * 2.15;
          const flutter = Math.sin(fanPose.flagWaveAngle * 2.4) * rBase * 0.75;
          const attachLowX = baseX + Math.sin(tilt) * (poleLen - flagH);
          const attachLowY = baseY - Math.cos(tilt) * (poleLen - flagH);
          const midAttachX = (tipX + attachLowX) * 0.5;
          const midAttachY = (tipY + attachLowY) * 0.5;
          const outerTopX = tipX + flagW;
          const outerTopY = tipY + flutter;
          const outerMidX = midAttachX + flagW;
          const outerMidY = midAttachY + flutter;
          const outerBotX = attachLowX + flagW;
          const outerBotY = attachLowY + flutter;

          const secondaryFlagColor =
            colors.homeShortsColor.toUpperCase() === colors.homeJerseyColor.toUpperCase()
              ? '#FFFFFF'
              : colors.homeShortsColor;

          // Upper stripe (Primary Club Color)
          ctx.fillStyle = colors.homeJerseyColor;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(outerTopX, outerTopY);
          ctx.lineTo(outerMidX, outerMidY);
          ctx.lineTo(midAttachX, midAttachY);
          ctx.closePath();
          ctx.fill();

          // Lower stripe (Secondary Club Color)
          ctx.fillStyle = secondaryFlagColor;
          ctx.beginPath();
          ctx.moveTo(midAttachX, midAttachY);
          ctx.lineTo(outerMidX, outerMidY);
          ctx.lineTo(outerBotX, outerBotY);
          ctx.lineTo(attachLowX, attachLowY);
          ctx.closePath();
          ctx.fill();
        }
      };

      // Helper: Render a stepped 3D stand section along either a constant-v sideline or constant-u endzone
      const render3DStand = (opts: {
        axis: 'sideline_far' | 'endzone_left' | 'sideline_near_cutaway' | 'endzone_right_cutaway' | 'sideline_left_ez' | 'sideline_right_ez';
        standIndex: number;
        spanStart: number;
        spanEnd: number;
        baseOffset: number;
        rowDepth: number;
        rowRise: number;
        lowerRows: number;
        upperRows: number;
        cols: number;
        hasVip: boolean;
      }) => {
        const mapPoint = (along: number, depthOut: number, z: number): Vec2 => {
          if (opts.axis === 'sideline_far' || opts.axis === 'sideline_left_ez') {
            return project(along, -(opts.baseOffset + depthOut), z);
          }
          if (opts.axis === 'sideline_near_cutaway' || opts.axis === 'sideline_right_ez') {
            return project(along, opts.baseOffset + depthOut, z);
          }
          if (opts.axis === 'endzone_left') {
            return project(-(opts.baseOffset + depthOut), along, z);
          }
          return project(opts.baseOffset + depthOut, along, z);
        };

        const totalLowerDepth = opts.lowerRows * opts.rowDepth;
        const totalLowerZ = opts.lowerRows * opts.rowRise;

        // Lower Bowl Structural Riser Slab
        const lb0 = mapPoint(opts.spanStart, 0, 0);
        const lb1 = mapPoint(opts.spanEnd, 0, 0);
        const lb2 = mapPoint(opts.spanEnd, totalLowerDepth + 0.04, totalLowerZ);
        const lb3 = mapPoint(opts.spanStart, totalLowerDepth + 0.04, totalLowerZ);
        fillQuad(lb0, lb1, lb2, lb3, design.riserBaseHex, 'rgba(255,255,255,0.08)');

        // Stepped Terrace Lines on Lower Bowl
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.8;
        for (let r = 1; r <= opts.lowerRows; r++) {
          const d = r * opts.rowDepth;
          const z = r * opts.rowRise;
          const a = mapPoint(opts.spanStart, d, z);
          const b = mapPoint(opts.spanEnd, d, z);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        // Draw Lower Bowl Seats (back-to-front or row-by-row)
        const rowOrderLower =
          opts.axis === 'sideline_near_cutaway' || opts.axis === 'endzone_right_cutaway'
            ? Array.from({ length: opts.lowerRows }, (_, i) => i)
            : Array.from({ length: opts.lowerRows }, (_, i) => opts.lowerRows - 1 - i);

        for (const r of rowOrderLower) {
          const d = (r + 0.55) * opts.rowDepth;
          const z = (r + 0.55) * opts.rowRise;
          for (let c = 0; c < opts.cols; c++) {
            // Leave realistic concrete stair aisles while keeping stands densely packed
            const aisleStride = Math.max(7, Math.floor(opts.cols / (tier.aisleCount + 1)));
            if (c > 0 && c < opts.cols - 1 && c % aisleStride === 0) continue;

            const t = opts.cols > 1 ? c / (opts.cols - 1) : 0.5;
            const along = opts.spanStart + (opts.spanEnd - opts.spanStart) * t;
            const pt = mapPoint(along, d, z);
            const occ = evaluateArenaSeat({
              standIndex: opts.standIndex,
              tierIndex: 0,
              rowIndex: r,
              totalRowsInTier: opts.lowerRows,
              colIndex: c,
              totalCols: opts.cols,
              occupancyRatio: arch.occupancyRatio,
            });
            drawSeatOrFan(pt, occ, opts.standIndex, 0, r, c, opts.cols, false);
          }
        }

        // VIP Hospitality Skybox Gallery — renders on ANY arena size when VIP strategy or 8k+ capacity is active!
        const renderVipSkyboxBand = (vipD0: number, vipZ0: number, vipD1: number, vipZ1: number) => {
          const v0 = mapPoint(opts.spanStart, vipD0, vipZ0);
          const v1 = mapPoint(opts.spanEnd, vipD0, vipZ0);
          const v2 = mapPoint(opts.spanEnd, vipD1, vipZ1);
          const v3 = mapPoint(opts.spanStart, vipD1, vipZ1);

          fillQuad(
            v0,
            v1,
            v2,
            v3,
            tier.hasLuxuryFinish ? 'rgba(18, 22, 34, 0.95)' : 'rgba(22, 28, 44, 0.92)',
            '#D4AF37'
          );

          const suiteCount = Math.max(
            3,
            Math.min(10, tier.vipSuiteCount || Math.floor(opts.cols / 5))
          );
          for (let sb = 0; sb < suiteCount; sb++) {
            const st0 = sb / suiteCount;
            const st1 = (sb + 1) / suiteCount;
            const u0 = opts.spanStart + (opts.spanEnd - opts.spanStart) * (st0 + 0.015);
            const u1 = opts.spanStart + (opts.spanEnd - opts.spanStart) * (st1 - 0.015);
            const b0 = mapPoint(u0, vipD0 + 0.008, vipZ0 + 0.012);
            const b1 = mapPoint(u1, vipD0 + 0.008, vipZ0 + 0.012);
            const b2 = mapPoint(u1, vipD1 - 0.006, vipZ1 - 0.01);
            const b3 = mapPoint(u0, vipD1 - 0.006, vipZ1 - 0.01);
            fillQuad(
              b0,
              b1,
              b2,
              b3,
              tier.isVipStrategyActive || tier.hasLuxuryFinish
                ? 'rgba(251, 211, 128, 0.42)'
                : 'rgba(251, 191, 36, 0.30)',
              'rgba(246, 208, 118, 0.72)'
            );

            // Warm interior hospitality lounge sconce accent
            const lamp = mapPoint((u0 + u1) * 0.5, (vipD0 + vipD1) * 0.5, (vipZ0 + vipZ1) * 0.54);
            ctx.beginPath();
            ctx.arc(lamp.x, lamp.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 244, 214, 0.90)';
            ctx.fill();
          }

          // Brushed champagne-gold VIP rail cornice along lower and upper skybox edges
          ctx.strokeStyle = 'rgba(245, 198, 92, 0.88)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(v0.x, v0.y);
          ctx.lineTo(v1.x, v1.y);
          ctx.moveTo(v3.x, v3.y);
          ctx.lineTo(v2.x, v2.y);
          ctx.stroke();
        };

        // Single-tier arena with VIP Strategy enabled: crown the lower bowl with an illuminated VIP Hospitality Penthouse Band!
        if (opts.upperRows === 0 && opts.hasVip) {
          renderVipSkyboxBand(
            totalLowerDepth + 0.018,
            totalLowerZ + 0.01,
            totalLowerDepth + 0.105,
            totalLowerZ + 0.105
          );
        }

        // Multi-tier Upper Deck + Mezzanine VIP Hospitality Skybox Ribbon
        if (opts.upperRows > 0) {
          const concourseGap = opts.hasVip ? 0.092 : 0.055;
          const vipRise = opts.hasVip ? 0.095 : 0.045;
          const upperBaseDepth = totalLowerDepth + concourseGap;
          const upperBaseZ = totalLowerZ + vipRise;

          if (opts.hasVip) {
            renderVipSkyboxBand(totalLowerDepth + 0.02, totalLowerZ + 0.01, upperBaseDepth, upperBaseZ);
          } else {
            // Second-tier LED Fascia Wall
            const f0 = mapPoint(opts.spanStart, totalLowerDepth + 0.02, totalLowerZ);
            const f1 = mapPoint(opts.spanEnd, totalLowerDepth + 0.02, totalLowerZ);
            ctx.beginPath();
            ctx.moveTo(f0.x, f0.y);
            ctx.lineTo(f1.x, f1.y);
            ctx.strokeStyle = colors.ledRibbonColor;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          const totalUpperDepth = upperBaseDepth + opts.upperRows * opts.rowDepth * 0.95;
          const totalUpperZ = upperBaseZ + opts.upperRows * opts.rowRise * 1.12;

          const ub0 = mapPoint(opts.spanStart, upperBaseDepth, upperBaseZ);
          const ub1 = mapPoint(opts.spanEnd, upperBaseDepth, upperBaseZ);
          const ub2 = mapPoint(opts.spanEnd, totalUpperDepth + 0.03, totalUpperZ);
          const ub3 = mapPoint(opts.spanStart, totalUpperDepth + 0.03, totalUpperZ);
          fillQuad(ub0, ub1, ub2, ub3, design.riserUpperHex, 'rgba(255,255,255,0.09)');

          for (let r = opts.upperRows - 1; r >= 0; r--) {
            const d = upperBaseDepth + (r + 0.55) * opts.rowDepth * 0.95;
            const z = upperBaseZ + (r + 0.55) * opts.rowRise * 1.12;
            for (let c = 0; c < opts.cols; c++) {
              const aisleStride = Math.max(7, Math.floor(opts.cols / (tier.aisleCount + 1)));
              if (c > 0 && c < opts.cols - 1 && c % aisleStride === 0) continue;

              const t = opts.cols > 1 ? c / (opts.cols - 1) : 0.5;
              const along = opts.spanStart + (opts.spanEnd - opts.spanStart) * t;
              const pt = mapPoint(along, d, z);
              const occ = evaluateArenaSeat({
                standIndex: opts.standIndex,
                tierIndex: 1,
                rowIndex: r,
                totalRowsInTier: opts.upperRows,
                colIndex: c,
                totalCols: opts.cols,
                occupancyRatio: arch.occupancyRatio,
              });
              drawSeatOrFan(pt, occ, opts.standIndex, 1, r, c, opts.cols, false);
            }
          }
        }
      };

      // =======================================================================
      // 2. DRAW SCALED BACKGROUND SPECTATOR STANDS (BEFORE COURT FLOOR)
      // =======================================================================
      if (cam === 'isometric') {
        const sidelineCols = isCompact ? Math.round(tier.sidelineCols * 0.76) : tier.sidelineCols;
        const endzoneCols = isCompact ? Math.round(tier.endzoneCols * 0.76) : tier.endzoneCols;
        const endLower = Math.max(2, Math.min(tier.lowerRows, tier.endzoneRows));
        const endUpper = tier.upperRows > 0 ? Math.max(1, tier.upperRows - 1) : 0;

        // Enclosed Back Corner Wedge for Municipal Bowl & Larger Arenas (Upgraded to Glazed VIP Atrium at 14k+)
        if (tier.hasCornerTowers) {
          const cornerDepth = (tier.lowerRows + tier.upperRows * 0.9) * 0.068 + 0.14;
          const cornerZ = (tier.lowerRows + tier.upperRows * 1.1) * 0.052;
          const cInner = project(-1.09, -1.11, 0.02);
          const cLeft = project(-1.09 - cornerDepth, -1.11, cornerZ);
          const cApex = project(-1.09 - cornerDepth * 0.85, -1.11 - cornerDepth * 0.85, cornerZ * 1.04);
          const cRight = project(-1.09, -1.11 - cornerDepth, cornerZ);
          fillQuad(
            cInner,
            cLeft,
            cApex,
            cRight,
            design.riserUpperHex,
            tier.hasLuxuryFinish ? 'rgba(245, 198, 92, 0.55)' : 'rgba(255,255,255,0.10)'
          );

          if (tier.hasLuxuryFinish) {
            // Glazed Golden Hospitality Sky-Atrium Crown on Back Corner Tower
            const lInner = project(-1.09 - cornerDepth * 0.42, -1.11 - cornerDepth * 0.42, cornerZ * 0.58);
            const lLeft = project(-1.09 - cornerDepth * 0.82, -1.11 - cornerDepth * 0.2, cornerZ * 0.96);
            const lApex = project(-1.09 - cornerDepth * 0.86, -1.11 - cornerDepth * 0.86, cornerZ * 1.12);
            const lRight = project(-1.09 - cornerDepth * 0.2, -1.11 - cornerDepth * 0.82, cornerZ * 0.96);
            fillQuad(lInner, lLeft, lApex, lRight, 'rgba(251, 211, 128, 0.26)', 'rgba(245, 198, 92, 0.72)');
          }
        }

        // Far Sideline Stand (Top-Right Tribune)
        render3DStand({
          axis: 'sideline_far',
          standIndex: 0,
          spanStart: -1.03,
          spanEnd: 1.03,
          baseOffset: 1.12,
          rowDepth: 0.068,
          rowRise: 0.052 * tier.standElevationScale,
          lowerRows: tier.lowerRows,
          upperRows: tier.upperRows,
          cols: sidelineCols,
          hasVip: tier.hasVipBoxes,
        });

        // Left / Home Endzone Stand (Top-Left Tribune behind Left Goal)
        render3DStand({
          axis: 'endzone_left',
          standIndex: 1,
          spanStart: -1.01,
          spanEnd: 0.98,
          baseOffset: 1.11,
          rowDepth: 0.064,
          rowRise: 0.05 * tier.standElevationScale,
          lowerRows: endLower,
          upperRows: endUpper,
          cols: endzoneCols,
          hasVip: tier.hasVipBoxes && (endUpper > 0 || tier.isVipStrategyActive),
        });

        // Overhead Arena Roof Lighting Rig Truss (Twin-Tier Cauldron & Larger; Champagne Luxury Truss at 14k+)
        if (tier.hasRoofRig) {
          const r1 = project(-0.88, -0.88, tier.hasLuxuryFinish ? 0.96 : 0.92);
          const r2 = project(0.88, -0.88, tier.hasLuxuryFinish ? 0.96 : 0.92);
          ctx.save();
          ctx.strokeStyle = tier.hasLuxuryFinish ? 'rgba(245, 198, 92, 0.55)' : 'rgba(255, 245, 222, 0.22)';
          ctx.lineWidth = tier.hasLuxuryFinish ? 2.2 : 1.6;
          ctx.beginPath();
          ctx.moveTo(r1.x, r1.y);
          ctx.lineTo(r2.x, r2.y);
          ctx.stroke();

          if (tier.hasLuxuryFinish) {
            const r1b = project(-0.84, -0.78, 0.90);
            const r2b = project(0.84, -0.78, 0.90);
            ctx.strokeStyle = 'rgba(255, 245, 215, 0.30)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(r1b.x, r1b.y);
            ctx.lineTo(r2b.x, r2b.y);
            ctx.stroke();
          }

          const lightCount = tier.hasLuxuryFinish ? 7 : 5;
          for (let li = 0; li <= lightCount; li++) {
            const lt = li / lightCount;
            const lx = r1.x + (r2.x - r1.x) * lt;
            const ly = r1.y + (r2.y - r1.y) * lt;
            if (tier.hasLuxuryFinish) {
              const halo = ctx.createRadialGradient(lx, ly, 1, lx, ly, 9);
              halo.addColorStop(0, 'rgba(255, 244, 214, 0.65)');
              halo.addColorStop(1, 'rgba(255, 224, 150, 0)');
              ctx.fillStyle = halo;
              ctx.beginPath();
              ctx.arc(lx, ly, 9, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(lx, ly, tier.hasLuxuryFinish ? 2.5 : 2.2, 0, Math.PI * 2);
            ctx.fillStyle = tier.hasLuxuryFinish ? '#FFFBEB' : 'rgba(255, 250, 230, 0.72)';
            ctx.fill();
          }
          ctx.restore();
        }

        // Club-Colored LED Advertising Perimeter Boards (Far Sideline & Left Endzone — Always Right-Side Up & Dynamically Scaled)
        if (curSponsors.length > 0) {
          const drawLedSponsorPanel = (
            uStart: number,
            vStart: number,
            uEnd: number,
            vEnd: number,
            label: string
          ) => {
            const b0 = project(uStart, vStart, 0.005);
            const b1 = project(uEnd, vEnd, 0.005);
            const t1 = project(uEnd, vEnd, 0.095);
            const t0 = project(uStart, vStart, 0.095);
            fillQuad(b0, b1, t1, t0, '#0F172A', 'rgba(255,255,255,0.22)');

            // Top illuminated club-color trim strip
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.strokeStyle = colors.ledRibbonColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            const midX = (b0.x + b1.x + t0.x + t1.x) * 0.25;
            const midY = (b0.y + b1.y + t0.y + t1.y) * 0.25;
            const ang = normalizeReadableBoardAngle(Math.atan2(b1.y - b0.y, b1.x - b0.x));
            const panelPx = Math.hypot(b1.x - b0.x, b1.y - b0.y);
            const boardText = formatSponsorBoardText(label, 28);
            const maxFont = Math.round(Math.max(7, Math.min(11, panelPx * 0.145)));
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(ang);
            ctx.font = `800 ${maxFont}px "Plus Jakarta Sans", sans-serif`;
            const measuredAtMax = ctx.measureText(boardText).width;
            const fittedFont = computeFittedBoardFontPx({
              text: boardText,
              panelSpanPx: panelPx,
              maxFontPx: maxFont,
              minFontPx: 5.5,
              measuredWidthAtMaxPx: measuredAtMax,
            });
            ctx.font = `800 ${fittedFont}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = '#F8FAFC';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(boardText, 0, 0, Math.max(24, panelPx * 0.90));
            ctx.restore();
          };

          const panelCount = 3;
          for (let p = 0; p < panelCount; p++) {
            const uA = -1.03 + (2.06 * p) / panelCount + 0.025;
            const uB = -1.03 + (2.06 * (p + 1)) / panelCount - 0.025;
            const brand = curSponsors[p % curSponsors.length];
            drawLedSponsorPanel(uA, -1.095, uB, -1.095, brand.name);
          }

          const ezCount = 2;
          for (let e = 0; e < ezCount; e++) {
            const vA = -1.0 + (2.0 * e) / ezCount + 0.03;
            const vB = -1.0 + (2.0 * (e + 1)) / ezCount - 0.03;
            const brand = curSponsors[(e + 1) % curSponsors.length];
            drawLedSponsorPanel(-1.095, vA, -1.095, vB, brand.name);
          }
        } else {
          const ledA1 = project(-1.05, -1.095, 0.03);
          const ledA2 = project(1.05, -1.095, 0.03);
          ctx.beginPath();
          ctx.moveTo(ledA1.x, ledA1.y);
          ctx.lineTo(ledA2.x, ledA2.y);
          ctx.strokeStyle = colors.ledRibbonColor;
          ctx.lineWidth = 3.6;
          ctx.stroke();

          const ledB1 = project(-1.095, -1.05, 0.03);
          const ledB2 = project(-1.095, 1.02, 0.03);
          ctx.beginPath();
          ctx.moveTo(ledB1.x, ledB1.y);
          ctx.lineTo(ledB2.x, ledB2.y);
          ctx.strokeStyle = colors.ledRibbonColor;
          ctx.lineWidth = 3.4;
          ctx.stroke();
        }
      } else if (cam === 'endzone') {
        const ezCols = isCompact ? Math.round(tier.endzoneCols * 0.8) : tier.endzoneCols;
        const sideCols = isCompact ? Math.round(tier.sidelineCols * 0.65) : Math.round(tier.sidelineCols * 0.8);
        // Far Endzone Tribune rising behind far goal
        render3DStand({
          axis: 'endzone_left',
          standIndex: 1,
          spanStart: -1.04,
          spanEnd: 1.04,
          baseOffset: 1.1,
          rowDepth: 0.06,
          rowRise: 0.048 * tier.standElevationScale,
          lowerRows: Math.max(2, tier.endzoneRows),
          upperRows: tier.upperRows > 0 ? Math.max(1, tier.upperRows - 1) : 0,
          cols: ezCols + 4,
          hasVip: tier.hasVipBoxes,
        });
        // Left & Right Sideline Tribunes framing the perspective court
        render3DStand({
          axis: 'sideline_left_ez',
          standIndex: 0,
          spanStart: -0.98,
          spanEnd: 0.92,
          baseOffset: 1.1,
          rowDepth: 0.065,
          rowRise: 0.046 * tier.standElevationScale,
          lowerRows: Math.min(5, tier.lowerRows),
          upperRows: Math.min(3, tier.upperRows),
          cols: sideCols,
          hasVip: tier.hasVipBoxes,
        });
        render3DStand({
          axis: 'sideline_right_ez',
          standIndex: 2,
          spanStart: -0.98,
          spanEnd: 0.92,
          baseOffset: 1.1,
          rowDepth: 0.065,
          rowRise: 0.046 * tier.standElevationScale,
          lowerRows: Math.min(5, tier.lowerRows),
          upperRows: Math.min(3, tier.upperRows),
          cols: sideCols,
          hasVip: tier.hasVipBoxes,
        });

        // Far endzone LED perimeter sponsor boards (strictly off the court, behind far goal)
        if (curSponsors.length > 0) {
          const ezPanels = Math.min(3, curSponsors.length);
          for (let ei = 0; ei < ezPanels; ei++) {
            const vA = -0.92 + (1.84 * ei) / ezPanels + 0.03;
            const vB = -0.92 + (1.84 * (ei + 1)) / ezPanels - 0.03;
            const b0 = project(-1.085, vA, 0.01);
            const b1 = project(-1.085, vB, 0.01);
            const t1 = project(-1.085, vB, 0.11);
            const t0 = project(-1.085, vA, 0.11);
            fillQuad(b0, b1, t1, t0, '#0F172A', 'rgba(255,255,255,0.24)');
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.strokeStyle = colors.ledRibbonColor;
            ctx.lineWidth = 1.8;
            ctx.stroke();

            const midX = (b0.x + b1.x + t0.x + t1.x) * 0.25;
            const midY = (b0.y + b1.y + t0.y + t1.y) * 0.25;
            const ang = normalizeReadableBoardAngle(Math.atan2(b1.y - b0.y, b1.x - b0.x));
            const panelPx = Math.hypot(b1.x - b0.x, b1.y - b0.y);
            const ezText = formatSponsorBoardText(curSponsors[ei % curSponsors.length].name, 28);
            const maxEzFont = Math.round(Math.max(7, Math.min(10, panelPx * 0.145)));
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(ang);
            ctx.font = `800 ${maxEzFont}px "Plus Jakarta Sans", sans-serif`;
            const measuredEz = ctx.measureText(ezText).width;
            const fittedEz = computeFittedBoardFontPx({
              text: ezText,
              panelSpanPx: panelPx,
              maxFontPx: maxEzFont,
              minFontPx: 5.5,
              measuredWidthAtMaxPx: measuredEz,
            });
            ctx.font = `800 ${fittedEz}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = '#F8FAFC';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ezText, 0, 0, Math.max(24, panelPx * 0.90));
            ctx.restore();
          }
        }
      } else if (cam === 'topdown') {
        // Architectural 4-Sided Perimeter Bowl in Top-Down Tactical Camera
        const totalTopRows = Math.min(7, tier.lowerRows + Math.ceil(tier.upperRows * 0.65));
        const tdSidelineCols = isCompact ? Math.round(tier.sidelineCols * 0.72) : tier.sidelineCols;
        const tdEndCols = isCompact ? Math.round(tier.endzoneCols * 0.72) : tier.endzoneCols;

        // North & South Sideline Stands
        ([-1, 1] as const).forEach((vDir, sIdx) => {
          const innerV = vDir * 1.12;
          const outerV = vDir * (1.12 + totalTopRows * 0.095);
          const s0 = project(-1.04, innerV);
          const s1 = project(1.04, innerV);
          const s2 = project(1.04, outerV);
          const s3 = project(-1.04, outerV);
          fillQuad(s0, s1, s2, s3, design.riserBaseHex, 'rgba(255,255,255,0.10)');

          for (let r = 0; r < totalTopRows; r++) {
            const isUpperRow = r >= tier.lowerRows;
            const vr = vDir * (1.165 + r * 0.092);
            for (let c = 0; c < tdSidelineCols; c++) {
              if (c > 0 && c < tdSidelineCols - 1 && c % 7 === 0) continue;
              const u = -1.0 + (2.0 * c) / Math.max(1, tdSidelineCols - 1);
              const occ = evaluateArenaSeat({
                standIndex: sIdx === 0 ? 0 : 3,
                tierIndex: isUpperRow ? 1 : 0,
                rowIndex: r,
                totalRowsInTier: totalTopRows,
                colIndex: c,
                totalCols: tdSidelineCols,
                occupancyRatio: arch.occupancyRatio,
              });
              drawSeatOrFan(
                project(u, vr),
                occ,
                sIdx === 0 ? 0 : 3,
                isUpperRow ? 1 : 0,
                r,
                c,
                tdSidelineCols,
                true
              );
            }
          }
        });

        // West & East Endzone Stands
        const ezTopRows = Math.min(5, Math.max(2, Math.ceil(tier.endzoneRows * 0.55)));
        ([-1, 1] as const).forEach((uDir, eIdx) => {
          const innerU = uDir * 1.09;
          const outerU = uDir * (1.09 + ezTopRows * 0.055);
          const e0 = project(innerU, -1.04);
          const e1 = project(outerU, -1.04);
          const e2 = project(outerU, 1.04);
          const e3 = project(innerU, 1.04);
          fillQuad(e0, e1, e2, e3, design.riserUpperHex, 'rgba(255,255,255,0.10)');

          for (let r = 0; r < ezTopRows; r++) {
            const ur = uDir * (1.115 + r * 0.052);
            for (let c = 0; c < tdEndCols; c++) {
              if (c > 0 && c < tdEndCols - 1 && c % 6 === 0) continue;
              const v = -0.96 + (1.92 * c) / Math.max(1, tdEndCols - 1);
              const occ = evaluateArenaSeat({
                standIndex: eIdx + 1,
                tierIndex: r >= 3 ? 1 : 0,
                rowIndex: r,
                totalRowsInTier: ezTopRows,
                colIndex: c,
                totalCols: tdEndCols,
                occupancyRatio: arch.occupancyRatio,
              });
              drawSeatOrFan(
                project(ur, v),
                occ,
                eIdx + 1,
                r >= 3 ? 1 : 0,
                r,
                c,
                tdEndCols,
                true
              );
            }
          }
        });

        // North Perimeter LED Sponsor Fascia Boards (Strictly outside playing boundary)
        if (curSponsors.length > 0) {
          const tdSlots = Math.min(3, curSponsors.length);
          for (let ti = 0; ti < tdSlots; ti++) {
            const uA = -0.92 + (1.84 * ti) / tdSlots + 0.03;
            const uB = -0.92 + (1.84 * (ti + 1)) / tdSlots - 0.03;
            const b0 = project(uA, -1.11);
            const b1 = project(uB, -1.11);
            const b2 = project(uB, -1.06);
            const b3 = project(uA, -1.06);
            fillQuad(b0, b1, b2, b3, '#0F172A', colors.ledRibbonColor);
            const mid = project((uA + uB) * 0.5, -1.085);
            const spanTdPx = Math.max(48, Math.hypot(b1.x - b0.x, b1.y - b0.y));
            const tdText = formatSponsorBoardText(curSponsors[ti].name, 28);
            ctx.save();
            ctx.font = '800 8.5px "Plus Jakarta Sans", sans-serif';
            const measuredTd = ctx.measureText(tdText).width;
            const fittedTd = computeFittedBoardFontPx({
              text: tdText,
              panelSpanPx: spanTdPx,
              maxFontPx: 8.5,
              minFontPx: 5.5,
              measuredWidthAtMaxPx: measuredTd,
            });
            ctx.font = `800 ${fittedTd}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = '#F8FAFC';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tdText, mid.x, mid.y, spanTdPx * 0.90);
            ctx.restore();
          }
        }
      }

      // =======================================================================
      // 3. COURT APRON & 40x20m OFFICIAL HANDBALL PLAYING SURFACE
      // =======================================================================
      const ap1 = project(-1.055, -1.075);
      const ap2 = project(1.055, -1.075);
      const ap3 = project(1.055, 1.075);
      const ap4 = project(-1.055, 1.075);
      fillQuad(ap1, ap2, ap3, ap4, arch.resolvedApronHex, 'rgba(255,255,255,0.12)');

      const p1 = project(-1, -1);
      const p2 = project(1, -1);
      const p3 = project(1, 1);
      const p4 = project(-1, 1);

      const woodGrad = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
      woodGrad.addColorStop(0, design.floorStops[0]);
      woodGrad.addColorStop(0.5, design.floorStops[1]);
      woodGrad.addColorStop(1, design.floorStops[2]);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fillStyle = woodGrad;
      ctx.fill();
      ctx.clip();

      // Subtle Longitudinal Parquet Planks / Synthetic Court Seams
      ctx.strokeStyle = design.plankStroke;
      ctx.lineWidth = 1;
      for (let s = -9; s <= 9; s++) {
        const vLine = s / 10;
        const a = project(-1, vLine);
        const b = project(1, vLine);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      const traceHandballArc = (side: -1 | 1, radiusMeters: number) => {
        const du = radiusMeters / 20;
        const dv = radiusMeters / 10;
        const pts: Vec2[] = [];
        const steps = 28;
        for (let i = 0; i <= steps; i++) {
          const ang = -Math.PI / 2 + (Math.PI / 2) * (i / steps);
          const u = side - side * Math.cos(ang) * du;
          const v = -0.15 + Math.sin(ang) * dv;
          if (Math.abs(v) <= 1.02) {
            pts.push(project(u, Math.max(-1, Math.min(1, v))));
          }
        }
        for (let i = 0; i <= steps; i++) {
          const ang = (Math.PI / 2) * (i / steps);
          const u = side - side * Math.cos(ang) * du;
          const v = 0.15 + Math.sin(ang) * dv;
          if (Math.abs(v) <= 1.02) {
            pts.push(project(u, Math.max(-1, Math.min(1, v))));
          }
        }
        return pts;
      };

      // 4. Painted 6m Goal Creases (Terracotta / Selected Design), Dashed 9m Free-Throw Arcs, 7m & 4m Marks
      ([-1, 1] as const).forEach((side) => {
        const arcPts = traceHandballArc(side, 6);
        if (arcPts.length > 2) {
          ctx.beginPath();
          const startGoal = project(side, -0.75);
          const endGoal = project(side, 0.75);
          ctx.moveTo(startGoal.x, startGoal.y);
          arcPts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
          ctx.lineTo(endGoal.x, endGoal.y);
          ctx.closePath();
          ctx.fillStyle = arch.resolvedCreaseHex;
          ctx.fill();

          ctx.beginPath();
          arcPts.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.strokeStyle = design.lineColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Dashed 9m Free-Throw Arc
        const ninePts = traceHandballArc(side, 9);
        if (ninePts.length > 2) {
          ctx.save();
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ninePts.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
          ctx.lineWidth = 1.65;
          ctx.stroke();
          ctx.restore();
        }

        // 7m Penalty Mark (1m wide line at 7m from goal line)
        const p7a = project(side - side * (7 / 20), -0.055);
        const p7b = project(side - side * (7 / 20), 0.055);
        ctx.beginPath();
        ctx.moveTo(p7a.x, p7a.y);
        ctx.lineTo(p7b.x, p7b.y);
        ctx.strokeStyle = design.lineColor;
        ctx.lineWidth = 2.1;
        ctx.stroke();

        // 4m Goalkeeper Restraining Line inside 6m Crease
        const p4a = project(side - side * (4 / 20), -0.035);
        const p4b = project(side - side * (4 / 20), 0.035);
        ctx.beginPath();
        ctx.moveTo(p4a.x, p4a.y);
        ctx.lineTo(p4b.x, p4b.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 5. Center Line, Center Circle & Dynamic Club Crest / Monogram
      const midA = project(0, -1);
      const midB = project(0, 1);
      ctx.beginPath();
      ctx.moveTo(midA.x, midA.y);
      ctx.lineTo(midB.x, midB.y);
      ctx.strokeStyle = design.lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const pt = project(Math.cos(a) * 0.115, Math.sin(a) * 0.23);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fillStyle = arch.resolvedCenterCircleHex;
      ctx.fill();
      ctx.strokeStyle = design.lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      const centerPt = project(0, 0);
      const logoImg = centerLogoImgRef.current;
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const crestSize = Math.max(16, Math.min(28, W * 0.044));
        ctx.save();
        ctx.globalAlpha = 0.94;
        ctx.drawImage(logoImg, centerPt.x - crestSize / 2, centerPt.y - crestSize / 2, crestSize, crestSize);
        ctx.restore();
      } else {
        ctx.save();
        ctx.font = `800 ${Math.round(Math.max(8, Math.min(12, W * 0.019)))}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((clubCode || 'HBM').toUpperCase(), centerPt.x, centerPt.y);
        ctx.restore();
      }

      // 6. Official Home Arena Name Stencil (TV-Facing Near Court Wing) & Club Wordmark (Far Court Wing)
      const nearStencilText = (curArenaName || clubShortName || 'HANDBALL ARENA').toUpperCase();
      const labelAnchor = project(0.0, 0.66);
      const labelLeft = project(-0.34, 0.66);
      const labelRight = project(0.34, 0.66);
      const angle = normalizeReadableBoardAngle(
        Math.atan2(labelRight.y - labelLeft.y, labelRight.x - labelLeft.x)
      );
      const nearSpanPx = Math.max(96, Math.hypot(labelRight.x - labelLeft.x, labelRight.y - labelLeft.y));
      const maxNearFont = Math.round(Math.max(10, Math.min(18, W * 0.026)));
      ctx.save();
      ctx.translate(labelAnchor.x, labelAnchor.y);
      ctx.rotate(angle);
      if (cam === 'isometric') {
        ctx.transform(1, 0, -0.35, 0.82, 0, 0);
      }
      ctx.font = `800 ${maxNearFont}px "Plus Jakarta Sans", sans-serif`;
      const measuredNear = ctx.measureText(nearStencilText).width;
      const fittedNearFont = computeFittedBoardFontPx({
        text: nearStencilText,
        panelSpanPx: nearSpanPx * 1.15,
        maxFontPx: maxNearFont,
        minFontPx: 8,
        measuredWidthAtMaxPx: measuredNear,
      });
      ctx.font = `800 ${fittedNearFont}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = design.wordmarkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nearStencilText, 0, 0, Math.max(100, W * 0.38));
      ctx.restore();

      if (!isCompact && clubShortName) {
        const farStencilText = clubShortName.toUpperCase();
        const farAnchor = project(0.0, -0.68);
        const farLeft = project(-0.28, -0.68);
        const farRight = project(0.28, -0.68);
        const farAngle = normalizeReadableBoardAngle(
          Math.atan2(farRight.y - farLeft.y, farRight.x - farLeft.x)
        );
        const farSpanPx = Math.max(84, Math.hypot(farRight.x - farLeft.x, farRight.y - farLeft.y));
        const maxFarFont = Math.round(Math.max(8, Math.min(13, W * 0.019)));
        ctx.save();
        ctx.translate(farAnchor.x, farAnchor.y);
        ctx.rotate(farAngle);
        if (cam === 'isometric') {
          ctx.transform(1, 0, -0.32, 0.8, 0, 0);
        }
        ctx.font = `700 ${maxFarFont}px "Plus Jakarta Sans", sans-serif`;
        const measuredFar = ctx.measureText(farStencilText).width;
        const fittedFarFont = computeFittedBoardFontPx({
          text: farStencilText,
          panelSpanPx: farSpanPx * 1.1,
          maxFontPx: maxFarFont,
          minFontPx: 7,
          measuredWidthAtMaxPx: measuredFar,
        });
        ctx.font = `700 ${fittedFarFont}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle =
          design.id === 'championship_taraflex'
            ? 'rgba(255, 255, 255, 0.48)'
            : 'rgba(24, 28, 42, 0.42)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(farStencilText, 0, 0, Math.max(80, W * 0.32));
        ctx.restore();
      }

      ctx.restore(); // End court clip

      // Crisp White Outer 40x20m Boundary
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.strokeStyle = design.lineColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 7. Authentic 3D Handball Goal Frames & Mesh Nets (3m x 2m)
      const drawHandballGoal = (side: -1 | 1) => {
        const postL0 = project(side, -0.17, 0);
        const postR0 = project(side, 0.17, 0);
        const postL1 = project(side, -0.17, 0.44);
        const postR1 = project(side, 0.17, 0.44);
        const backU = side + side * 0.07;
        const backL0 = project(backU, -0.17, 0);
        const backR0 = project(backU, 0.17, 0);
        const backL1 = project(backU, -0.17, 0.4);
        const backR1 = project(backU, 0.17, 0.4);

        // Translucent taut goal net volume
        ctx.fillStyle = 'rgba(255, 255, 255, 0.17)';
        ctx.beginPath();
        ctx.moveTo(postL1.x, postL1.y);
        ctx.lineTo(postR1.x, postR1.y);
        ctx.lineTo(backR1.x, backR1.y);
        ctx.lineTo(backR0.x, backR0.y);
        ctx.lineTo(backL0.x, backL0.y);
        ctx.lineTo(backL1.x, backL1.y);
        ctx.closePath();
        ctx.fill();

        // Net mesh strands
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        for (let m = 1; m <= 4; m++) {
          const t = m / 5;
          const topA = {
            x: postL1.x + (postR1.x - postL1.x) * t,
            y: postL1.y + (postR1.y - postL1.y) * t,
          };
          const backTop = {
            x: backL1.x + (backR1.x - backL1.x) * t,
            y: backL1.y + (backR1.y - backL1.y) * t,
          };
          const backBot = {
            x: backL0.x + (backR0.x - backL0.x) * t,
            y: backL0.y + (backR0.y - backL0.y) * t,
          };
          ctx.moveTo(topA.x, topA.y);
          ctx.lineTo(backTop.x, backTop.y);
          ctx.lineTo(backBot.x, backBot.y);
        }
        ctx.moveTo(postL0.x, postL0.y);
        ctx.lineTo(backL0.x, backL0.y);
        ctx.lineTo(backR0.x, backR0.y);
        ctx.lineTo(postR0.x, postR0.y);
        ctx.moveTo(postL1.x, postL1.y);
        ctx.lineTo(backL1.x, backL1.y);
        ctx.lineTo(backR1.x, backR1.y);
        ctx.lineTo(postR1.x, postR1.y);
        ctx.stroke();

        // Striped Handball Goalpost & Crossbar Frame
        ctx.strokeStyle = '#181C2A';
        ctx.lineWidth = 4.4;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(postL0.x, postL0.y);
        ctx.lineTo(postL1.x, postL1.y);
        ctx.lineTo(postR1.x, postR1.y);
        ctx.lineTo(postR0.x, postR0.y);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(postL0.x, postL0.y);
        ctx.lineTo(postL1.x, postL1.y);
        ctx.lineTo(postR1.x, postR1.y);
        ctx.lineTo(postR0.x, postR0.y);
        ctx.stroke();

        // Authentic Handball Red/Terracotta Post Stripes
        ctx.save();
        ctx.setLineDash([3.5, 3.5]);
        ctx.strokeStyle = '#DF4B2A';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(postL0.x, postL0.y);
        ctx.lineTo(postL1.x, postL1.y);
        ctx.lineTo(postR1.x, postR1.y);
        ctx.lineTo(postR0.x, postR0.y);
        ctx.stroke();
        ctx.restore();
      };

      drawHandballGoal(-1);

      // 8. Animated 7v7 Play Cut Scenes & Ball (Matchday Only — Infrastructure shows Empty Venue)
      if (activePlayFrame) {
        const formation = activePlayFrame;

        // Subtle celebratory goal-glow highlight around celebrating zone & net during goal_celebration
        if (formation.celebrationIntensity > 0.05) {
          const goalPt = project(0.95, 0, 0.15);
          const glow = ctx.createRadialGradient(goalPt.x, goalPt.y, 4, goalPt.x, goalPt.y, Math.max(54, W * 0.13));
          glow.addColorStop(0, `rgba(251, 191, 36, ${0.28 * formation.celebrationIntensity})`);
          glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(goalPt.x, goalPt.y, Math.max(54, W * 0.13), 0, Math.PI * 2);
          ctx.fill();
        }

        type RenderEntity = {
          kind: 'player' | 'ball';
          screenY: number;
          u: number;
          v: number;
          z: number;
          armRaise?: number;
          team?: 'home' | 'away';
          isGK?: boolean;
        };

        const entities: RenderEntity[] = [];
        formation.home.forEach((pPose, idx) => {
          const p = project(pPose.u, pPose.v, 0);
          entities.push({
            kind: 'player',
            screenY: p.y,
            u: pPose.u,
            v: pPose.v,
            z: pPose.z,
            armRaise: pPose.armRaise,
            team: 'home',
            isGK: idx === 0,
          });
        });
        formation.away.forEach((pPose, idx) => {
          const p = project(pPose.u, pPose.v, 0);
          entities.push({
            kind: 'player',
            screenY: p.y,
            u: pPose.u,
            v: pPose.v,
            z: pPose.z,
            armRaise: pPose.armRaise,
            team: 'away',
            isGK: idx === 0,
          });
        });
        const bProj = project(formation.ballPos[0], formation.ballPos[1], 0);
        entities.push({
          kind: 'ball',
          screenY: bProj.y + 2,
          u: formation.ballPos[0],
          v: formation.ballPos[1],
          z: formation.ballZ,
        });

        entities.sort((a, b) => a.screenY - b.screenY);

        const figScale = Math.max(0.66, Math.min(1.16, W / 630));

        entities.forEach((ent) => {
          if (ent.kind === 'ball') {
            const ground = project(ent.u, ent.v, 0);
            const air = project(ent.u, ent.v, ent.z);

            ctx.beginPath();
            ctx.ellipse(ground.x, ground.y, 4.2 * figScale, 2.2 * figScale, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(20, 22, 30, 0.32)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(air.x, air.y, 4.4 * figScale, 0, Math.PI * 2);
            ctx.fillStyle = '#DF642A';
            ctx.fill();
            ctx.strokeStyle = '#18191F';
            ctx.lineWidth = 1.1;
            ctx.stroke();
            return;
          }

          const groundPt = project(ent.u, ent.v, 0);
          const base = project(ent.u, ent.v, ent.z);
          const bodyH = (cam === 'topdown' ? 10 : 15) * figScale;
          const bodyW = (cam === 'topdown' ? 8.5 : 7.2) * figScale;
          const shadowShrink = Math.max(0.65, 1 - ent.z * 0.6);

          ctx.beginPath();
          ctx.ellipse(groundPt.x, groundPt.y + 1, bodyW * 0.85 * shadowShrink, bodyW * 0.45 * shadowShrink, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
          ctx.fill();

          if (cam === 'topdown') {
            if ((ent.armRaise || 0) > 0.35) {
              ctx.beginPath();
              ctx.arc(base.x, base.y, 10.5 * figScale, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(base.x, base.y, 7.2 * figScale, 0, Math.PI * 2);
            ctx.fillStyle =
              ent.team === 'home'
                ? ent.isGK
                  ? '#F59E0B'
                  : colors.homeJerseyColor
                : ent.isGK
                ? '#38BDF8'
                : colors.awayJerseyColor;
            ctx.fill();
            ctx.strokeStyle = '#18191F';
            ctx.lineWidth = 1.6;
            ctx.stroke();
            return;
          }

          const jerseyFill =
            ent.team === 'home'
              ? ent.isGK
                ? '#EAB308'
                : colors.homeJerseyColor
              : ent.isGK
              ? '#38BDF8'
              : colors.awayJerseyColor;

          // Raised celebrating / shooting arms behind head & torso
          const armLevel = ent.armRaise || 0;
          if (armLevel > 0.15) {
            const lift = armLevel * 7.5 * figScale;
            const spread = (3.4 + armLevel * 2.2) * figScale;
            const shoulderY = base.y - bodyH * 0.82;
            ctx.strokeStyle = jerseyFill;
            ctx.lineWidth = 2.1 * figScale;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(base.x - bodyW * 0.42, shoulderY);
            ctx.lineTo(base.x - spread, shoulderY - lift);
            ctx.moveTo(base.x + bodyW * 0.42, shoulderY);
            ctx.lineTo(base.x + spread, shoulderY - lift);
            ctx.stroke();
          }

          // Club-matched shorts/legs base
          ctx.fillStyle = ent.team === 'home' ? colors.homeShortsColor : colors.awayShortsColor;
          ctx.beginPath();
          ctx.roundRect(base.x - bodyW * 0.38, base.y - bodyH * 0.45, bodyW * 0.76, bodyH * 0.45, 2);
          ctx.fill();

          // Club-matched jersey capsule torso
          ctx.fillStyle = jerseyFill;
          ctx.strokeStyle = 'rgba(20, 22, 29, 0.65)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.roundRect(base.x - bodyW * 0.5, base.y - bodyH, bodyW, bodyH * 0.68, 3.5 * figScale);
          ctx.fill();
          ctx.stroke();

          // Head sphere
          ctx.beginPath();
          ctx.arc(base.x, base.y - bodyH - 3.3 * figScale, 3.1 * figScale, 0, Math.PI * 2);
          ctx.fillStyle = ent.team === 'home' ? '#5C3A28' : '#D9A784';
          ctx.fill();
          ctx.strokeStyle = 'rgba(20, 22, 29, 0.55)';
          ctx.lineWidth = 0.9;
          ctx.stroke();
        });
      }

      drawHandballGoal(1);

      // =======================================================================
      // 9. FOREGROUND CUTAWAY FRONT RISERS (ISOMETRIC CAMERA — NEVER COVERS COURT!)
      // =======================================================================
      if (cam === 'isometric') {
        const nearCols = isCompact
          ? Math.round(tier.sidelineCols * 0.66)
          : Math.round(tier.sidelineCols * 0.85);
        const rightEzCols = isCompact
          ? Math.round(tier.endzoneCols * 0.66)
          : Math.round(tier.endzoneCols * 0.82);

        render3DStand({
          axis: 'sideline_near_cutaway',
          standIndex: 3,
          spanStart: -0.98,
          spanEnd: 0.98,
          baseOffset: 1.115,
          rowDepth: 0.058,
          rowRise: 0.024,
          lowerRows: tier.nearCutawayRows,
          upperRows: 0,
          cols: nearCols,
          hasVip: false,
        });

        render3DStand({
          axis: 'endzone_right_cutaway',
          standIndex: 2,
          spanStart: -0.96,
          spanEnd: 0.96,
          baseOffset: 1.105,
          rowDepth: 0.056,
          rowRise: 0.024,
          lowerRows: Math.max(1, tier.nearCutawayRows - 1),
          upperRows: 0,
          cols: rightEzCols,
          hasVip: false,
        });
      }

      ctx.restore();
      scheduleNext();
    };

    const triggerRedraw = () => {
      if (unmounted) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(renderFrame);
    };
    redrawRef.current = triggerRedraw;
    window.addEventListener('resize', triggerRedraw);

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      unmounted = true;
      redrawRef.current = null;
      window.removeEventListener('resize', triggerRedraw);
      cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const primaryLabel = hasSupercup
    ? lang === 'de'
      ? 'Supercup spielen'
      : 'Play Supercup'
    : isFirstHalf
    ? lang === 'de'
      ? 'Hinrunde simulieren'
      : 'Simulate 1st Half'
    : lang === 'de'
    ? 'Rückrunde simulieren'
    : 'Simulate 2nd Half';

  const opponentClubObj = useMemo(
    () => ({
      id: analytics.featuredMatch.opponentId,
      name: analytics.featuredMatch.opponentName,
      color: analytics.featuredMatch.opponentColor,
      color2: analytics.featuredMatch.opponentColor2,
      logo: analytics.featuredMatch.opponentLogo,
      fallbackLogo: analytics.featuredMatch.opponentFallbackLogo,
    }),
    [analytics.featuredMatch]
  );

  return (
    <section
      aria-label={
        variant === 'infrastructure'
          ? 'Live 40x20m Handball Arena Architecture Preview'
          : 'Live Handball Arena Simulation'
      }
      data-testid={
        variant === 'infrastructure' ? 'infrastructure-arena-stage' : 'court-simulation-stage'
      }
      data-arena-design={arenaModel.design.id}
      data-arena-tier={arenaModel.tier.id}
      data-arena-name={analytics.arenaName}
      data-arena-capacity={String(arenaModel.capacity)}
      data-arena-vip={arenaModel.tier.hasVipBoxes ? 'true' : 'false'}
      data-arena-utilization={String(arenaModel.utilizationPct)}
      data-sponsor-count={String(activeSponsors.length)}
      data-sponsors={activeSponsors.map((s) => s.name).join('|')}
      data-simulating={isSimulatingLive ? 'true' : 'false'}
      className={`relative w-full rounded-[24px] sm:rounded-[26px] bg-[#1E2538] border border-black/[0.06] shadow-[0_12px_32px_rgba(15,23,42,0.08)] overflow-hidden select-none ${
        variant === 'infrastructure'
          ? 'min-h-[340px] sm:min-h-[395px] xl:min-h-[425px]'
          : 'min-h-[420px] sm:min-h-[430px] xl:min-h-[456px]'
      }`}
    >
      {/* Interactive Isometric / 2D / Endzone Handball Canvas */}
      <canvas
        ref={canvasRef}
        data-camera={camera}
        className="absolute inset-0 w-full h-full block"
      />

      {/* INLINE CENTER-COURT LIVE SEASON SIMULATION */}
      {variant === 'matchday' && isSimulatingLive && onSimulationComplete && (
        <SimulatingOverlay
          inlineOverCourt
          lang={lang}
          phase={simulationPhase === 'idle' ? 'full' : simulationPhase}
          totalMatchdays={totalMatchdays}
          onComplete={onSimulationComplete}
          state={simState}
          onLiveFixtureChange={handleLiveFixtureChange}
        />
      )}

      {/* INFRASTRUCTURE EMPTY VENUE ARCHITECTURAL OVERLAY HEADER */}
      {variant === 'infrastructure' && (
        <>
          {/* Mobile (< 640px) Unified Compact Venue Bar */}
          <div className="relative z-10 p-2.5 flex sm:hidden pointer-events-none">
            <div className="w-full pointer-events-auto bg-white/95 rounded-[18px] px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.14)] border border-black/[0.06] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ClubLogo
                  club={club}
                  name={analytics.clubFullName}
                  clubId={analytics.clubId}
                  color={analytics.clubColor}
                  color2={analytics.clubColor2}
                  logo={analytics.clubLogo}
                  fallbackLogo={analytics.clubFallbackLogo}
                  className="w-5 h-5 rounded-md object-contain shrink-0"
                />
                <div className="min-w-0 leading-tight">
                  <h3 className="text-[12px] font-bold text-[#14161D] truncate">
                    {analytics.arenaName}
                  </h3>
                  <p className="text-[10px] text-[#686D7B] truncate">
                    {arenaModel.tier.label} · {arenaModel.design.name}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 tabular-nums leading-tight">
                <div className="text-[12px] font-extrabold text-[#14161D]">
                  {arenaModel.capacity.toLocaleString()} Seats
                </div>
                <div className="text-[10px] font-semibold text-[#686D7B]">
                  Empty Arena
                </div>
              </div>
            </div>
          </div>

          {/* Tablet & Desktop (>= 640px) Dual Floating Cards */}
          <div className="relative z-10 p-3.5 hidden sm:flex items-start justify-between gap-2.5 pointer-events-none">
            <div className="pointer-events-auto bg-white/95 rounded-[18px] px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.14)] border border-black/[0.06] max-w-[330px]">
              <div className="flex items-center gap-2 min-w-0">
                <ClubLogo
                  club={club}
                  name={analytics.clubFullName}
                  clubId={analytics.clubId}
                  color={analytics.clubColor}
                  color2={analytics.clubColor2}
                  logo={analytics.clubLogo}
                  fallbackLogo={analytics.clubFallbackLogo}
                  className="w-6 h-6 rounded-md object-contain shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold text-[#14161D] leading-tight truncate">
                    {analytics.arenaName}
                  </h3>
                  <p className="text-[11px] text-[#686D7B] truncate">
                    {arenaModel.tier.label} · {arenaModel.design.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="pointer-events-auto bg-white/95 rounded-[18px] px-3.5 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.14)] border border-black/[0.06] text-right shrink-0 tabular-nums">
              <div className="text-[14px] font-extrabold text-[#14161D] leading-tight">
                {arenaModel.capacity.toLocaleString()} Seats
              </div>
              <div className="text-[10px] font-semibold text-[#686D7B]">
                Empty Bowl · Non-Matchday View
              </div>
            </div>
          </div>
        </>
      )}

      {/* MATCHDAY TOP HUD CARDS WHEN IDLE */}
      {variant === 'matchday' && !isSimulatingLive && (
        <>
          {/* MOBILE (< 640px) COMPACT UNIFIED MATCHUP + SCORE + CTA STRIP — Keeps Center 3D Court & Stands Unobstructed! */}
          <div className="relative z-10 p-2.5 flex sm:hidden flex-col gap-2 pointer-events-none">
            <div className="pointer-events-auto bg-white/95 rounded-[20px] p-2.5 shadow-[0_10px_26px_rgba(15,23,42,0.15)] border border-black/[0.06]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenTeamModal?.(club)}
                    className="shrink-0 cursor-pointer hover:opacity-80 transition"
                    aria-label={`Inspect ${analytics.clubFullName}`}
                  >
                    <ClubLogo
                      club={club}
                      name={analytics.clubFullName}
                      clubId={analytics.clubId}
                      color={analytics.clubColor}
                      color2={analytics.clubColor2}
                      logo={analytics.clubLogo}
                      fallbackLogo={analytics.clubFallbackLogo}
                      className="w-6 h-6 rounded-md object-contain shrink-0"
                    />
                  </button>
                  <div className="min-w-0 leading-tight">
                    <h2 className="text-[13px] font-bold text-[#14161D] truncate flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenTeamModal?.(club)}
                        className="hover:underline cursor-pointer truncate"
                      >
                        {analytics.clubShortName}
                      </button>
                      <span className="text-[#5C6270] font-medium">vs</span>
                      <button
                        type="button"
                        onClick={() => onOpenTeamModal?.(opponentClubObj)}
                        className="hover:underline cursor-pointer truncate"
                      >
                        {analytics.featuredMatch.opponentShort}
                      </button>
                    </h2>
                    <span className="text-[10px] text-[#525866] truncate block">
                      {analytics.arenaName} · {analytics.featuredMatch.halfLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                  <span className="text-[17px] font-extrabold text-[#14161D]">
                    {analytics.featuredMatch.userScore}
                  </span>
                  <span className="text-xs font-bold text-[#5C6270]">–</span>
                  <span className="text-[17px] font-bold text-[#525866]">
                    {analytics.featuredMatch.opponentScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenTeamModal?.(opponentClubObj)}
                    className="shrink-0 cursor-pointer hover:opacity-80 transition"
                    aria-label={`Inspect ${analytics.featuredMatch.opponentName}`}
                  >
                    <ClubLogo
                      club={opponentClubObj}
                      name={analytics.featuredMatch.opponentName}
                      clubId={analytics.featuredMatch.opponentId}
                      color={analytics.featuredMatch.opponentColor}
                      color2={analytics.featuredMatch.opponentColor2}
                      logo={analytics.featuredMatch.opponentLogo}
                      fallbackLogo={analytics.featuredMatch.opponentFallbackLogo}
                      className="w-6 h-6 rounded-md object-contain shrink-0"
                    />
                  </button>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-black/[0.06] flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onSimulate}
                  disabled={disabled}
                  className={`flex-1 min-h-[40px] px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98] touch-manipulation shadow-xs min-w-0 ${
                    hasSupercup
                      ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                      : isRelegationFight
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-[#18191F] hover:bg-[#2A2D37] text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={supercupTitle || primaryLabel}
                >
                  <i className={`fas ${hasSupercup ? 'fa-trophy' : 'fa-play'} text-[10px] shrink-0`} />
                  <span className="truncate whitespace-nowrap">{primaryLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenTactics}
                  className="min-h-[40px] px-3 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] border border-black/[0.06] text-[11px] font-semibold transition cursor-pointer truncate max-w-[116px] shrink-0 whitespace-nowrap"
                  title="Change Tactical System"
                >
                  {tactic}
                </button>
              </div>
            </div>
          </div>

          {/* TABLET & DESKTOP (>= 640px) TWO FLOATING APPLE COURTSIDE CARDS */}
          <div className="relative z-10 p-3.5 hidden sm:flex items-start justify-between gap-2.5 pointer-events-none">
            {/* Top-Left Floating Matchup & Simulate Card */}
            <div className="pointer-events-auto bg-white/95 rounded-[22px] px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.14)] border border-black/[0.05] min-w-0 sm:max-w-[285px] xl:max-w-[350px]">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => onOpenTeamModal?.(club)}
                  className="shrink-0 cursor-pointer hover:opacity-80 transition"
                  aria-label={`Inspect ${analytics.clubFullName}`}
                >
                  <ClubLogo
                    club={club}
                    name={analytics.clubFullName}
                    clubId={analytics.clubId}
                    color={analytics.clubColor}
                    color2={analytics.clubColor2}
                    logo={analytics.clubLogo}
                    fallbackLogo={analytics.clubFallbackLogo}
                    className="w-6 h-6 rounded-md object-contain shrink-0"
                  />
                </button>
                <h2 className="text-[15px] xl:text-[17px] font-bold tracking-tight text-[#14161D] leading-tight truncate flex items-center gap-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenTeamModal?.(club)}
                    className="hover:underline cursor-pointer truncate"
                    title={`Inspect ${analytics.clubFullName}`}
                  >
                    {analytics.clubShortName}
                  </button>
                  <span className="text-[#5C6270] font-semibold shrink-0">vs</span>
                  <button
                    type="button"
                    onClick={() => onOpenTeamModal?.(opponentClubObj)}
                    className="hover:underline cursor-pointer truncate"
                    title={`Inspect ${analytics.featuredMatch.opponentName}`}
                  >
                    {analytics.featuredMatch.opponentShort}
                  </button>
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenTeamModal?.(opponentClubObj)}
                  className="shrink-0 cursor-pointer hover:opacity-80 transition"
                  aria-label={`Inspect ${analytics.featuredMatch.opponentName}`}
                >
                  <ClubLogo
                    club={opponentClubObj}
                    name={analytics.featuredMatch.opponentName}
                    clubId={analytics.featuredMatch.opponentId}
                    color={analytics.featuredMatch.opponentColor}
                    color2={analytics.featuredMatch.opponentColor2}
                    logo={analytics.featuredMatch.opponentLogo}
                    fallbackLogo={analytics.featuredMatch.opponentFallbackLogo}
                    className="w-6 h-6 rounded-md object-contain shrink-0"
                  />
                </button>
              </div>

              <div className="mt-2 flex items-center flex-wrap gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] xl:text-[11px] font-bold tracking-wide text-white ${
                    hasSupercup
                      ? 'bg-amber-500'
                      : isRelegationFight
                      ? 'bg-rose-600'
                      : ''
                  }`}
                  style={
                    !hasSupercup && !isRelegationFight
                      ? { backgroundColor: arenaModel.resolvedCreaseHex }
                      : undefined
                  }
                >
                  <span>{hasSupercup ? 'FINAL' : 'MATCHDAY'}</span>
                </span>

                <button
                  type="button"
                  onClick={onOpenArena}
                  className="px-2.5 py-0.5 rounded-full bg-[#ECEAE4] hover:bg-[#E2DFD7] text-[#374151] text-[10px] xl:text-[11px] font-medium transition cursor-pointer truncate max-w-[125px] xl:max-w-[145px]"
                  title="Inspect Arena & Attendance"
                >
                  {analytics.arenaName}
                </button>

                <span className="px-2.5 py-0.5 rounded-full bg-[#ECEAE4] text-[#374151] text-[10px] xl:text-[11px] font-medium tabular-nums">
                  {analytics.featuredMatch.phaseBadge}
                </span>
              </div>

              {/* Primary Campaign Simulation CTA + Tactical System Button */}
              <div className="mt-2.5 pt-2 border-t border-black/[0.06] flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onSimulate}
                  disabled={disabled}
                  className={`flex-1 py-1.5 px-3 rounded-full text-[11px] xl:text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98] touch-manipulation shadow-sm min-w-0 ${
                    hasSupercup
                      ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950'
                      : isRelegationFight
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-[#18191F] hover:bg-[#2A2D37] text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={supercupTitle || primaryLabel}
                >
                  <i className={`fas ${hasSupercup ? 'fa-trophy' : 'fa-play'} text-[10px] shrink-0`} />
                  <span className="truncate whitespace-nowrap">{primaryLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenTactics}
                  className="py-1.5 px-2.5 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] border border-black/[0.06] text-[10px] xl:text-[11px] font-semibold transition cursor-pointer truncate max-w-[100px] xl:max-w-none whitespace-nowrap"
                  title="Change Tactical System"
                >
                  {tactic}
                </button>
              </div>
            </div>

            {/* Top-Right Floating Scoreboard Card with Embedded Team Logos */}
            <div className="pointer-events-auto bg-white/95 rounded-[22px] px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.14)] border border-black/[0.05] sm:min-w-[190px] xl:min-w-[220px] shrink-0">
              <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-[#525866] mb-2">
                <span>Scoreboard</span>
                <span>{analytics.featuredMatch.halfLabel}</span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenTeamModal?.(club)}
                    className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition cursor-pointer"
                    title={`Inspect ${analytics.clubFullName}`}
                  >
                    <ClubLogo
                      club={club}
                      name={analytics.clubFullName}
                      clubId={analytics.clubId}
                      color={analytics.clubColor}
                      color2={analytics.clubColor2}
                      logo={analytics.clubLogo}
                      fallbackLogo={analytics.clubFallbackLogo}
                      className="w-7 h-7 xl:w-8 xl:h-8 rounded-[9px] object-contain shrink-0"
                    />
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-[12px] xl:text-[13px] font-semibold text-[#14161D] hover:underline truncate max-w-[92px] xl:max-w-[115px]">
                        {analytics.clubShortName}
                      </span>
                      <span className="text-[10px] xl:text-[11px] text-[#525866] tabular-nums">
                        {analytics.recordLabel}
                      </span>
                    </div>
                  </button>
                  <span className="text-[20px] xl:text-[22px] font-bold text-[#14161D] tracking-tight tabular-nums leading-none shrink-0">
                    {analytics.featuredMatch.userScore}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenTeamModal?.(opponentClubObj)}
                    className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition cursor-pointer"
                    title={`Inspect ${analytics.featuredMatch.opponentName}`}
                  >
                    <ClubLogo
                      club={opponentClubObj}
                      name={analytics.featuredMatch.opponentName}
                      clubId={analytics.featuredMatch.opponentId}
                      color={analytics.featuredMatch.opponentColor}
                      color2={analytics.featuredMatch.opponentColor2}
                      logo={analytics.featuredMatch.opponentLogo}
                      fallbackLogo={analytics.featuredMatch.opponentFallbackLogo}
                      className="w-7 h-7 xl:w-8 xl:h-8 rounded-[9px] object-contain shrink-0"
                    />
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-[12px] xl:text-[13px] font-semibold text-[#14161D] hover:underline truncate max-w-[92px] xl:max-w-[115px]">
                        {analytics.featuredMatch.opponentShort}
                      </span>
                      <span className="text-[10px] xl:text-[11px] text-[#525866] tabular-nums">
                        {analytics.featuredMatch.opponentRecord}
                      </span>
                    </div>
                  </button>
                  <span className="text-[20px] xl:text-[22px] font-bold text-[#525866] tracking-tight tabular-nums leading-none shrink-0">
                    {analytics.featuredMatch.opponentScore}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* BOTTOM FLOATING CAMERA SWITCHER & SCALED ATTENDANCE TELEMETRY */}
      <div className="absolute inset-x-0 bottom-0 z-30 p-2.5 sm:p-3.5 flex items-end justify-between gap-1.5 sm:gap-2 pointer-events-none">
        {/* Bottom-Left Camera Switcher */}
        <div
          role="group"
          aria-label="Court Camera Angle"
          className="pointer-events-auto bg-white/95 rounded-[18px] sm:rounded-[20px] p-1 sm:p-1.5 sm:pl-3 shadow-[0_10px_26px_rgba(15,23,42,0.14)] border border-black/[0.05] flex items-center gap-1 sm:gap-2 shrink-0"
        >
          <span className="hidden sm:inline text-[11px] font-semibold text-[#14161D] pr-0.5">
            Camera
          </span>

          {/* 1. Isometric Thumbnail */}
          <button
            type="button"
            onClick={() => setCamera('isometric')}
            aria-label="Isometric camera"
            aria-pressed={camera === 'isometric'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'isometric'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <polygon
                points="20,4 36,13 20,22 4,13"
                fill="#D2955A"
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
            </svg>
          </button>

          {/* 2. Top-Down Thumbnail */}
          <button
            type="button"
            onClick={() => setCamera('topdown')}
            aria-label="Top-down camera"
            aria-pressed={camera === 'topdown'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'topdown'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <rect
                x="6"
                y="5"
                width="28"
                height="16"
                rx="1.5"
                fill="#D2955A"
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
              <line x1="20" y1="5" x2="20" y2="21" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="20" cy="13" r="3" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </svg>
          </button>

          {/* 3. Endzone Thumbnail */}
          <button
            type="button"
            onClick={() => setCamera('endzone')}
            aria-label="Endzone camera"
            aria-pressed={camera === 'endzone'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'endzone'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <polygon
                points="12,6 28,6 35,21 5,21"
                fill="#D2955A"
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
              <line x1="20" y1="6" x2="20" y2="21" stroke="#FFFFFF" strokeWidth="1" />
            </svg>
          </button>
        </div>

        {/* Bottom-Right Attendance & Arena Size Pill (Clicks to Arena Modal) */}
        {!isSimulatingLive && (
          <button
            type="button"
            onClick={onOpenArena}
            aria-label={
              isEmptyInfrastructure
                ? `Open Arena Overview (${arenaModel.capacity.toLocaleString()} arena size)`
                : `Open Arena Overview (${arenaModel.attendance.toLocaleString()} attendance, ${arenaModel.capacity.toLocaleString()} arena size)`
            }
            className="pointer-events-auto bg-white/95 hover:bg-white rounded-[16px] sm:rounded-[18px] px-3 sm:px-4 py-1.5 sm:py-2 shadow-[0_10px_26px_rgba(15,23,42,0.14)] border border-black/[0.05] flex items-center gap-3 sm:gap-5 min-w-0 text-left transition cursor-pointer touch-manipulation"
            title={
              isEmptyInfrastructure
                ? `${analytics.arenaName} · ${arenaModel.capacity.toLocaleString()} seats (Empty Venue)`
                : `${analytics.arenaName} · ${arenaModel.attendance.toLocaleString()} / ${arenaModel.capacity.toLocaleString()} seats (${arenaModel.utilizationPct}% full)`
            }
          >
            {isEmptyInfrastructure ? (
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
                  Venue Status
                </span>
                <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] leading-tight whitespace-nowrap">
                  Empty Arena
                </span>
              </div>
            ) : (
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
                  Attendance · {arenaModel.utilizationPct}%
                </span>
                <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] tabular-nums leading-tight whitespace-nowrap">
                  {arenaModel.attendance.toLocaleString()}
                </span>
              </div>
            )}

            <div className="h-5 w-px bg-black/[0.08] shrink-0" aria-hidden="true" />

            <div className="flex flex-col shrink-0">
              <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
                Arena size
              </span>
              <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] tabular-nums leading-tight whitespace-nowrap">
                {arenaModel.capacity.toLocaleString()}
                <span className="hidden sm:inline text-[10px] font-medium text-[#525866] ml-0.5">
                  seats
                </span>
              </span>
            </div>
          </button>
        )}
      </div>
    </section>
  );
};
