import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArenaDesignId } from '../utils/arenaArchitecture';
import { CourtsideAnalytics, resolveArenaColorScheme } from '../utils/courtsideStats';
import {
  buildTrainingGymModel,
  computeWarmupFrame,
  GymCameraMode,
  TrainingGymModel,
} from '../utils/trainingGymArchitecture';
import { ClubLogo } from './ClubLogo';
import {
  ActiveSponsorBrand,
  computeFittedBoardFontPx,
  formatSponsorBoardText,
  normalizeReadableBoardAngle,
  resolveActiveSponsorBrands,
} from '../utils/sponsorBranding';

interface TrainingGymWarmupCardProps {
  analytics: CourtsideAnalytics;
  club: any;
  tactic: string;
  squadSize: number;
  morale: number;
  baseOvr: number;
  activeYouthCount: number;
  youthSlotLimit: number;
  designId?: ArenaDesignId;
  sponsors?: ActiveSponsorBrand[];
  onOpenTactics: () => void;
  onOpenOvr: () => void;
  onOpenTeamModal?: (clubObj?: any) => void;
}

interface Vec2 {
  x: number;
  y: number;
}

export const TrainingGymWarmupCard: React.FC<TrainingGymWarmupCardProps> = ({
  analytics,
  club,
  tactic,
  squadSize,
  morale,
  baseOvr,
  activeYouthCount,
  youthSlotLimit,
  designId,
  sponsors,
  onOpenTactics,
  onOpenOvr,
  onOpenTeamModal,
}) => {
  const [camera, setCamera] = useState<GymCameraMode>('isometric');
  const activeSponsors = useMemo(
    () => sponsors ?? resolveActiveSponsorBrands(null),
    [sponsors]
  );

  const activeColors = useMemo(
    () =>
      resolveArenaColorScheme(
        club?.color || analytics.clubColor,
        club?.color2 || analytics.clubColor2,
        analytics.featuredMatch.opponentColor,
        analytics.featuredMatch.opponentColor2
      ),
    [
      club?.color,
      club?.color2,
      analytics.clubColor,
      analytics.clubColor2,
      analytics.featuredMatch.opponentColor,
      analytics.featuredMatch.opponentColor2,
    ]
  );

  const effectiveDesignId: ArenaDesignId =
    designId ?? club?.arenaDesign ?? analytics.arenaDesign ?? 'terracotta_courtside';

  const gymModel: TrainingGymModel = useMemo(
    () =>
      buildTrainingGymModel({
        squadSize,
        morale,
        baseOvr,
        tactic,
        designId: effectiveDesignId,
        clubColors: activeColors,
      }),
    [squadSize, morale, baseOvr, tactic, effectiveDesignId, activeColors]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const centerLogoImgRef = useRef<HTMLImageElement | null>(null);
  const redrawRef = useRef<(() => void) | null>(null);

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
    activeColors,
    gymModel,
    activeSponsors,
  });

  useEffect(() => {
    propsRef.current = {
      camera,
      tactic,
      clubShortName: analytics.clubShortName,
      clubCode: analytics.clubCode,
      activeColors,
      gymModel,
      activeSponsors,
    };
    redrawRef.current?.();
  }, [camera, tactic, analytics.clubShortName, analytics.clubCode, activeColors, gymModel, activeSponsors]);

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
      if (unmounted || prefersReducedMotion) return;
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        if (!unmounted) {
          rafId = requestAnimationFrame(renderFrame);
        }
      }, 75);
    };

    const renderFrame = (timestamp: number) => {
      if (unmounted) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const W = Math.max(280, Math.round(rect.width));
      const H = Math.max(280, Math.round(rect.height));

      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const {
        camera: cam,
        clubShortName,
        clubCode,
        activeColors: colors,
        gymModel: model,
        activeSponsors: curSponsors,
      } = propsRef.current;
      const { design, resolvedCreaseHex } = model;
      const isCompact = W < 500;

      // 1. Warm Daylight Indoor Training Hall Backdrop (Zero Spectator Stands)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#272D3C');
      bgGrad.addColorStop(0.55, '#1F2533');
      bgGrad.addColorStop(1, '#161B26');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = isCompact ? H * 0.56 : H * 0.55;

      const project = (u: number, v: number, z = 0): Vec2 => {
        if (cam === 'topdown') {
          const halfW = Math.min(W * 0.41, H * 0.72);
          const halfH = halfW * 0.5;
          return {
            x: cx + u * halfW,
            y: cy + v * halfH - z * 16,
          };
        }
        if (cam === 'endzone') {
          const depth = (u + 1) * 0.5;
          const persp = 0.52 + depth * 0.62;
          const baseHalfW = Math.min(W * 0.36, H * 0.56);
          const topY = cy - H * 0.24;
          const botY = cy + H * 0.28;
          return {
            x: cx + v * baseHalfW * persp,
            y: topY + depth * (botY - topY) - z * (16 + depth * 18),
          };
        }
        // Default 3D Isometric Training Hall Projection (Matches CourtSimulationCard)
        const scale = Math.min(W * (isCompact ? 0.35 : 0.32), H * (isCompact ? 0.5 : 0.47));
        const isoX = (u - v * 0.52) * scale;
        const isoY = (u * 0.33 + v * 0.5) * scale;
        return {
          x: cx + isoX,
          y: cy + isoY - z * scale * 0.28,
        };
      };

      const drawQuad = (
        u0: number,
        v0: number,
        z0: number,
        u1: number,
        v1: number,
        z1: number,
        u2: number,
        v2: number,
        z2: number,
        u3: number,
        v3: number,
        z3: number,
        fill: string | CanvasGradient,
        stroke?: string,
        lineWidth = 1
      ) => {
        const p0 = project(u0, v0, z0);
        const p1 = project(u1, v1, z1);
        const p2 = project(u2, v2, z2);
        const p3 = project(u3, v3, z3);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      // =======================================================================
      // 2. SPORTHALLE PERIMETER FLOOR & ACOUSTIC GYM WALLS (NO STANDS!)
      // =======================================================================
      // Outer hall hardwood/rubber surround
      drawQuad(
        -1.18,
        -1.18,
        0,
        1.18,
        -1.18,
        0,
        1.18,
        1.18,
        0,
        -1.18,
        1.18,
        0,
        '#343D4F',
        'rgba(255,255,255,0.12)',
        1.2
      );

      if (cam !== 'topdown') {
        const wallH = 0.56;
        const wainscotH = 0.22;

        // Back (North) Acoustic Gym Wall (v = -1.18)
        drawQuad(
          -1.18,
          -1.18,
          0,
          1.18,
          -1.18,
          0,
          1.18,
          -1.18,
          wallH,
          -1.18,
          -1.18,
          wallH,
          '#DDD7CA',
          'rgba(20,22,29,0.28)',
          1
        );
        // Warm timber acoustic wainscoting along lower gym wall
        drawQuad(
          -1.18,
          -1.18,
          0,
          1.18,
          -1.18,
          0,
          1.18,
          -1.18,
          wainscotH,
          -1.18,
          -1.18,
          wainscotH,
          '#B79065',
          'rgba(20,22,29,0.22)',
          0.9
        );

        // Clerestory gym windows along upper North wall
        for (let w = 0; w < model.clerestoryWindowCount; w++) {
          const wu0 = -1.04 + w * 0.355;
          const wu1 = wu0 + 0.27;
          drawQuad(
            wu0,
            -1.178,
            0.31,
            wu1,
            -1.178,
            0.31,
            wu1,
            -1.178,
            0.49,
            wu0,
            -1.178,
            0.49,
            '#DCEAF7',
            'rgba(30,41,59,0.45)',
            1
          );
        }

        // Swedish wooden wall-bars (Sprossenwände) mounted on the North gym wall
        for (let b = 0; b < model.wallBarCount; b++) {
          const bu0 = -0.98 + b * 0.255;
          const bu1 = bu0 + 0.14;
          const pBL = project(bu0, -1.165, 0.02);
          const pTL = project(bu0, -1.165, 0.27);
          const pBR = project(bu1, -1.165, 0.02);
          const pTR = project(bu1, -1.165, 0.27);

          ctx.strokeStyle = '#6E4C2B';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pBL.x, pBL.y);
          ctx.lineTo(pTL.x, pTL.y);
          ctx.moveTo(pBR.x, pBR.y);
          ctx.lineTo(pTR.x, pTR.y);
          ctx.stroke();

          ctx.strokeStyle = '#8C633A';
          ctx.lineWidth = 0.9;
          for (let rung = 1; rung <= 5; rung++) {
            const rz = 0.02 + (rung / 6) * 0.25;
            const rL = project(bu0, -1.165, rz);
            const rR = project(bu1, -1.165, rz);
            ctx.beginPath();
            ctx.moveTo(rL.x, rL.y);
            ctx.lineTo(rR.x, rR.y);
            ctx.stroke();
          }
        }

        // Left End-Wall (u = -1.18) with padded crash mat behind goal
        drawQuad(
          -1.18,
          1.18,
          0,
          -1.18,
          -1.18,
          0,
          -1.18,
          -1.18,
          wallH,
          -1.18,
          1.18,
          wallH,
          '#D3CCC0',
          'rgba(20,22,29,0.28)',
          1
        );
        drawQuad(
          -1.18,
          1.18,
          0,
          -1.18,
          -1.18,
          0,
          -1.18,
          -1.18,
          wainscotH,
          -1.18,
          1.18,
          wainscotH,
          '#A98258',
          'rgba(20,22,29,0.22)',
          0.9
        );
        // Padded safety wall mat behind left goal
        drawQuad(
          -1.174,
          0.38,
          0.01,
          -1.174,
          -0.38,
          0.01,
          -1.174,
          -0.38,
          0.25,
          -1.174,
          0.38,
          0.25,
          model.matAccentHex,
          'rgba(255,255,255,0.35)',
          1
        );

        // Signed Sponsor Wall Banner Boards above padded goal mat (Left End-Wall)
        if (curSponsors.length > 0) {
          const bannerCount = Math.min(3, curSponsors.length);
          const spanTotal = 1.66;
          const slotSpan = spanTotal / bannerCount;
          for (let bi = 0; bi < bannerCount; bi++) {
            const vA = -0.83 + bi * slotSpan + 0.04;
            const vB = -0.83 + (bi + 1) * slotSpan - 0.04;
            drawQuad(
              -1.17,
              vA,
              0.29,
              -1.17,
              vB,
              0.29,
              -1.17,
              vB,
              0.46,
              -1.17,
              vA,
              0.46,
              '#161D2F',
              colors.homeJerseyColor,
              1.1
            );
            const pA = project(-1.168, vA, 0.375);
            const pB = project(-1.168, vB, 0.375);
            const midX = (pA.x + pB.x) * 0.5;
            const midY = (pA.y + pB.y) * 0.5;
            const ang = normalizeReadableBoardAngle(Math.atan2(pB.y - pA.y, pB.x - pA.x));
            const boardPx = Math.hypot(pB.x - pA.x, pB.y - pA.y);
            const boardText = formatSponsorBoardText(curSponsors[bi].name, 28);
            const maxFont = Math.round(Math.max(7, Math.min(11, boardPx * 0.14)));
            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(ang);
            ctx.font = `800 ${maxFont}px "Plus Jakarta Sans", sans-serif`;
            const measuredAtMax = ctx.measureText(boardText).width;
            const fittedFont = computeFittedBoardFontPx({
              text: boardText,
              panelSpanPx: boardPx,
              maxFontPx: maxFont,
              minFontPx: 5.5,
              measuredWidthAtMaxPx: measuredAtMax,
            });
            ctx.font = `800 ${fittedFont}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = '#F8FAFC';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(boardText, 0, 0, Math.max(24, boardPx * 0.90));
            ctx.restore();
          }
        }

        if (cam === 'endzone') {
          // Right side gym wall visible in endzone perspective
          drawQuad(
            -1.18,
            1.18,
            0,
            1.18,
            1.18,
            0,
            1.18,
            1.18,
            wallH,
            -1.18,
            1.18,
            wallH,
            '#D6CFC2',
            'rgba(20,22,29,0.25)',
            1
          );
        }
      } else {
        // Top-down architectural gym wall border & wall-bar ticks
        drawQuad(
          -1.18,
          -1.18,
          0,
          1.18,
          -1.18,
          0,
          1.18,
          -1.13,
          0,
          -1.18,
          -1.13,
          0,
          '#B79065'
        );
        drawQuad(
          -1.18,
          1.13,
          0,
          1.18,
          1.13,
          0,
          1.18,
          1.18,
          0,
          -1.18,
          1.18,
          0,
          '#B79065'
        );

        if (curSponsors.length > 0) {
          const topSlots = Math.min(3, curSponsors.length);
          for (let ti = 0; ti < topSlots; ti++) {
            const uA = -0.9 + (1.8 * ti) / topSlots + 0.04;
            const uB = -0.9 + (1.8 * (ti + 1)) / topSlots - 0.04;
            drawQuad(
              uA,
              -1.12,
              0,
              uB,
              -1.12,
              0,
              uB,
              -1.06,
              0,
              uA,
              -1.06,
              0,
              '#161D2F',
              colors.homeJerseyColor,
              1
            );
            const tLeft = project(uA, -1.09, 0);
            const tRight = project(uB, -1.09, 0);
            const tMid = project((uA + uB) * 0.5, -1.09, 0);
            const spanPx = Math.max(44, Math.hypot(tRight.x - tLeft.x, tRight.y - tLeft.y));
            const topText = formatSponsorBoardText(curSponsors[ti].name, 28);
            ctx.save();
            ctx.font = '800 8px "Plus Jakarta Sans", sans-serif';
            const measuredTop = ctx.measureText(topText).width;
            const fittedTop = computeFittedBoardFontPx({
              text: topText,
              panelSpanPx: spanPx,
              maxFontPx: 8.5,
              minFontPx: 5.5,
              measuredWidthAtMaxPx: measuredTop,
            });
            ctx.font = `800 ${fittedTop}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = '#F8FAFC';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(topText, tMid.x, tMid.y, spanPx * 0.90);
            ctx.restore();
          }
        }
      }

      // =======================================================================
      // 3. 40x20m HANDBALL TRAINING COURT SURFACE & MARKINGS
      // =======================================================================
      // Inner safety apron
      drawQuad(
        -1.06,
        -1.06,
        0,
        1.06,
        -1.06,
        0,
        1.06,
        1.06,
        0,
        -1.06,
        1.06,
        0,
        design.apronColor,
        'rgba(255,255,255,0.14)',
        1
      );

      // Maple/Oak Hardwood Parquet Playing Surface
      const cTL = project(-1, -1, 0);
      const cTR = project(1, -1, 0);
      const cBR = project(1, 1, 0);
      const cBL = project(-1, 1, 0);

      const woodGrad = ctx.createLinearGradient(cTL.x, cTL.y, cBR.x, cBR.y);
      woodGrad.addColorStop(0, design.floorStops[0]);
      woodGrad.addColorStop(0.5, design.floorStops[1]);
      woodGrad.addColorStop(1, design.floorStops[2]);

      ctx.beginPath();
      ctx.moveTo(cTL.x, cTL.y);
      ctx.lineTo(cTR.x, cTR.y);
      ctx.lineTo(cBR.x, cBR.y);
      ctx.lineTo(cBL.x, cBL.y);
      ctx.closePath();
      ctx.fillStyle = woodGrad;
      ctx.fill();

      // Subtle hardwood plank lines
      ctx.strokeStyle = design.plankLineRgba;
      ctx.lineWidth = 1;
      for (let i = -9; i <= 9; i++) {
        const vLine = i / 10;
        const pA = project(-1, vLine, 0);
        const pB = project(1, vLine, 0);
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }

      // 6m Goal Creases & Dashed 9m Free-Throw Arcs
      const drawCreaseAndFreeThrow = (side: -1 | 1) => {
        const goalU = side;
        const dir = -side;

        ctx.beginPath();
        const startEdge = project(goalU, -0.75, 0);
        ctx.moveTo(startEdge.x, startEdge.y);

        const steps = 28;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const v = -0.75 + t * 1.5;
          let depth = 0.3;
          if (Math.abs(v) > 0.15) {
            const norm = (Math.abs(v) - 0.15) / 0.6;
            depth = 0.3 * Math.sqrt(Math.max(0, 1 - norm * norm));
          }
          const pt = project(goalU + dir * depth, v, 0);
          ctx.lineTo(pt.x, pt.y);
        }
        const endEdge = project(goalU, 0.75, 0);
        ctx.lineTo(endEdge.x, endEdge.y);
        ctx.closePath();

        ctx.fillStyle = resolvedCreaseHex;
        ctx.fill();
        ctx.strokeStyle = design.courtLineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 7m penalty mark & 4m goalkeeper line
        const penA = project(goalU + dir * 0.35, -0.05, 0);
        const penB = project(goalU + dir * 0.35, 0.05, 0);
        ctx.beginPath();
        ctx.moveTo(penA.x, penA.y);
        ctx.lineTo(penB.x, penB.y);
        ctx.strokeStyle = design.courtLineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dashed 9m free-throw arc
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let s = 0; s <= 32; s++) {
          const t = s / 32;
          const v = -0.96 + t * 1.92;
          let depth = 0.45;
          if (Math.abs(v) > 0.15) {
            const norm = (Math.abs(v) - 0.15) / 0.81;
            depth = 0.45 * Math.sqrt(Math.max(0, 1 - norm * norm));
          }
          const pt = project(goalU + dir * depth, v, 0);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      };

      drawCreaseAndFreeThrow(-1);
      drawCreaseAndFreeThrow(1);

      // Outer 40x20m Boundary & Halfway Line
      ctx.beginPath();
      ctx.moveTo(cTL.x, cTL.y);
      ctx.lineTo(cTR.x, cTR.y);
      ctx.lineTo(cBR.x, cBR.y);
      ctx.lineTo(cBL.x, cBL.y);
      ctx.closePath();
      ctx.strokeStyle = design.courtLineColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      const midTop = project(0, -1, 0);
      const midBot = project(0, 1, 0);
      ctx.beginPath();
      ctx.moveTo(midTop.x, midTop.y);
      ctx.lineTo(midBot.x, midBot.y);
      ctx.strokeStyle = design.courtLineColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Center Circle + Club Crest / Wordmark
      ctx.beginPath();
      for (let s = 0; s <= 36; s++) {
        const ang = (s / 36) * Math.PI * 2;
        const pt = project(Math.cos(ang) * 0.14, Math.sin(ang) * 0.27, 0);
        if (s === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fillStyle = colors.centerCircleFill;
      ctx.fill();
      ctx.strokeStyle = design.courtLineColor;
      ctx.lineWidth = 1.7;
      ctx.stroke();

      const centerPt = project(0, 0, 0);
      const logoImg = centerLogoImgRef.current;
      ctx.save();
      ctx.translate(centerPt.x, centerPt.y);
      if (cam === 'isometric') ctx.rotate(-0.14);
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const crestSize = Math.max(20, Math.min(34, W * 0.046));
        ctx.globalAlpha = 0.86;
        ctx.drawImage(logoImg, -crestSize / 2, -crestSize / 2, crestSize, crestSize);
      } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 10px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(
          (clubShortName || clubCode || 'CLUB').slice(0, 12).toUpperCase(),
          0,
          0
        );
      }
      ctx.restore();

      // Dead-centered club name wordmark along near floor baseline (u = 0)
      const wordmarkAnchor = project(0, 0.66, 0);
      const wordmarkLeft = project(-0.24, 0.66, 0);
      const wordmarkRight = project(0.24, 0.66, 0);
      const wordmarkAngle = Math.atan2(wordmarkRight.y - wordmarkLeft.y, wordmarkRight.x - wordmarkLeft.x);
      ctx.save();
      ctx.translate(wordmarkAnchor.x, wordmarkAnchor.y);
      ctx.rotate(wordmarkAngle);
      if (cam === 'isometric') {
        ctx.transform(1, 0, -0.35, 0.82, 0, 0);
      }
      ctx.font = `800 ${Math.round(Math.max(10, Math.min(20, W * 0.028)))}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(24, 28, 42, 0.72)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((clubShortName || clubCode || 'CLUB').toUpperCase(), 0, 0, Math.max(80, W * 0.3));
      ctx.restore();

      // =======================================================================
      // 4. GYM TOUCHLINE EQUIPMENT: TEAM BENCH, BALL RACK & AGILITY CONES
      // =======================================================================
      // Wooden team bench along near touchline (v = 1.09)
      drawQuad(
        -0.55,
        1.07,
        0.04,
        -0.08,
        1.07,
        0.04,
        -0.08,
        1.12,
        0.04,
        -0.55,
        1.12,
        0.04,
        '#C89D6C',
        'rgba(20,22,29,0.45)',
        1
      );

      // Handball rack with 4 training balls along touchline (u = 0.22..0.42, v = 1.09)
      drawQuad(
        0.18,
        1.07,
        0.05,
        0.44,
        1.07,
        0.05,
        0.44,
        1.12,
        0.05,
        0.18,
        1.12,
        0.05,
        '#1E293B',
        'rgba(255,255,255,0.28)',
        1
      );
      for (let bi = 0; bi < 4; bi++) {
        const bp = project(0.22 + bi * 0.06, 1.095, 0.07);
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#DF642A';
        ctx.fill();
      }

      // Low-profile orange/yellow agility cones marking warmup shuttle channels
      const figScale = Math.max(0.68, Math.min(1.16, W / 620));
      model.conePositions.forEach(([cu, cv]) => {
        const cp = project(cu, cv, 0);
        ctx.beginPath();
        ctx.ellipse(cp.x, cp.y, 3.6 * figScale, 1.9 * figScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#F97316';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cp.x, cp.y - 1.2 * figScale, 1.6 * figScale, 0, Math.PI * 2);
        ctx.fillStyle = '#FDE047';
        ctx.fill();
      });

      // =======================================================================
      // 5. 3D HANDBALL GOALS + ANIMATED SQUAD WARMUP SHUTTLE RUNNERS
      // =======================================================================
      const drawHandballGoal = (side: -1 | 1) => {
        const u = side;
        const backU = side * 1.08;
        const vL = -0.16;
        const vR = 0.16;
        const hZ = 0.24;

        const postL0 = project(u, vL, 0);
        const postL1 = project(u, vL, hZ);
        const postR0 = project(u, vR, 0);
        const postR1 = project(u, vR, hZ);
        const netL0 = project(backU, vL, 0);
        const netL1 = project(backU, vL, hZ * 0.92);
        const netR0 = project(backU, vR, 0);
        const netR1 = project(backU, vR, hZ * 0.92);

        ctx.fillStyle = 'rgba(241, 245, 249, 0.24)';
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
        ctx.lineWidth = 0.9;

        const faces: [Vec2, Vec2, Vec2, Vec2][] = [
          [postL1, postR1, netR1, netL1],
          [netL0, netR0, netR1, netL1],
          [postL0, netL0, netL1, postL1],
          [postR0, netR0, netR1, postR1],
        ];
        faces.forEach(([a, b, c, d]) => {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(c.x, c.y);
          ctx.lineTo(d.x, d.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(postL0.x, postL0.y);
        ctx.lineTo(postL1.x, postL1.y);
        ctx.lineTo(postR1.x, postR1.y);
        ctx.lineTo(postR0.x, postR0.y);
        ctx.stroke();

        ctx.save();
        ctx.setLineDash([3.5, 3.5]);
        ctx.strokeStyle = '#DF4B2A';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(postL0.x, postL0.y);
        ctx.lineTo(postL1.x, postL1.y);
        ctx.lineTo(postR1.x, postR1.y);
        ctx.lineTo(postR0.x, postR0.y);
        ctx.stroke();
        ctx.restore();
      };

      drawHandballGoal(-1);

      const cycleDuration = 11.5 / model.tempoFactor;
      const phase = prefersReducedMotion
        ? 0.28
        : ((timestamp * 0.001) % cycleDuration) / cycleDuration;
      const warmup = computeWarmupFrame(phase, model.runnerCount);

      type Entity =
        | { kind: 'runner'; screenY: number; u: number; v: number; z: number; isGK: boolean; lane: string; id: number }
        | { kind: 'ball'; screenY: number; u: number; v: number; z: number };

      const entities: Entity[] = [];
      warmup.runners.forEach((r) => {
        const p = project(r.u, r.v, 0);
        entities.push({
          kind: 'runner',
          screenY: p.y,
          u: r.u,
          v: r.v,
          z: r.strideZ,
          isGK: r.isGK,
          lane: r.lane,
          id: r.id,
        });
      });
      warmup.balls.forEach((b) => {
        const p = project(b.u, b.v, 0);
        entities.push({
          kind: 'ball',
          screenY: p.y + 1.5,
          u: b.u,
          v: b.v,
          z: b.z,
        });
      });

      entities.sort((a, b) => a.screenY - b.screenY);

      entities.forEach((ent) => {
        if (ent.kind === 'ball') {
          const ground = project(ent.u, ent.v, 0);
          const air = project(ent.u, ent.v, ent.z);

          ctx.beginPath();
          ctx.ellipse(ground.x, ground.y, 4 * figScale, 2.1 * figScale, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(20, 22, 30, 0.30)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(air.x, air.y, 4.2 * figScale, 0, Math.PI * 2);
          ctx.fillStyle = '#DF642A';
          ctx.fill();
          ctx.strokeStyle = '#18191F';
          ctx.lineWidth = 1.1;
          ctx.stroke();
          return;
        }

        const shadowPt = project(ent.u, ent.v, 0);
        const base = project(ent.u, ent.v, ent.z);
        const bodyH = (cam === 'topdown' ? 10 : 15) * figScale;
        const bodyW = (cam === 'topdown' ? 8.5 : 7.2) * figScale;

        ctx.beginPath();
        ctx.ellipse(shadowPt.x, shadowPt.y + 1, bodyW * 0.84, bodyW * 0.44, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.30)';
        ctx.fill();

        // Alternate home training kit & secondary training bib between north/south lanes
        const jerseyFill = ent.isGK
          ? ent.lane === 'gk_left'
            ? '#EAB308'
            : '#38BDF8'
          : ent.lane === 'north'
          ? colors.homeJerseyColor
          : colors.homeShortsColor === colors.homeJerseyColor
          ? '#F8FAFC'
          : colors.homeJerseyColor;

        const bibStripe = !ent.isGK && ent.lane === 'south';

        if (cam === 'topdown') {
          ctx.beginPath();
          ctx.arc(base.x, base.y, 7 * figScale, 0, Math.PI * 2);
          ctx.fillStyle = jerseyFill;
          ctx.fill();
          ctx.strokeStyle = bibStripe ? '#FACC15' : '#18191F';
          ctx.lineWidth = 1.6;
          ctx.stroke();
          return;
        }

        // Shorts / legs
        ctx.fillStyle = colors.homeShortsColor;
        ctx.beginPath();
        ctx.roundRect(base.x - bodyW * 0.38, base.y - bodyH * 0.45, bodyW * 0.76, bodyH * 0.45, 2);
        ctx.fill();

        // Training jersey torso
        ctx.fillStyle = jerseyFill;
        ctx.strokeStyle = 'rgba(20, 22, 29, 0.65)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.roundRect(base.x - bodyW * 0.5, base.y - bodyH, bodyW, bodyH * 0.68, 3.5 * figScale);
        ctx.fill();
        ctx.stroke();

        // Scrimmage training bib accent on south shuttle column
        if (bibStripe) {
          ctx.fillStyle = 'rgba(250, 204, 21, 0.85)';
          ctx.fillRect(base.x - bodyW * 0.34, base.y - bodyH * 0.82, bodyW * 0.68, bodyH * 0.24);
        }

        // Head sphere
        ctx.beginPath();
        ctx.arc(base.x, base.y - bodyH - 3.3 * figScale, 3.1 * figScale, 0, Math.PI * 2);
        ctx.fillStyle = ent.id % 3 === 0 ? '#6F4834' : ent.id % 2 === 0 ? '#D9A784' : '#C68B66';
        ctx.fill();
        ctx.strokeStyle = 'rgba(20, 22, 29, 0.55)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      });

      drawHandballGoal(1);

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

  return (
    <section
      aria-label="3D Handball Training Gym Warmup"
      data-testid="squad-training-gym-stage"
      data-runners={String(gymModel.runnerCount + 2)}
      data-sponsor-count={String(activeSponsors.length)}
      data-sponsors={activeSponsors.map((s) => s.name).join('|')}
      className="relative w-full rounded-[24px] sm:rounded-[26px] bg-[#1F2533] border border-black/[0.06] shadow-[0_12px_32px_rgba(15,23,42,0.08)] overflow-hidden select-none min-h-[340px] sm:min-h-[380px] xl:min-h-[410px]"
    >
      <canvas
        ref={canvasRef}
        data-camera={camera}
        className="absolute inset-0 w-full h-full block"
      />

      {/* MOBILE (< 640px) COMPACT TRAINING HALL BAR */}
      <div className="relative z-10 p-2.5 flex sm:hidden pointer-events-none">
        <div className="w-full pointer-events-auto bg-white/95 rounded-[18px] px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.14)] border border-black/[0.06] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenTeamModal?.(club)}
            className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
          >
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
                {analytics.clubShortName} Training Hall
              </h3>
              <p className="text-[10px] text-[#686D7B] truncate">
                Squad Warmup · {tactic}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenTactics}
            className="px-2.5 py-1 rounded-full bg-[#18191F] text-white text-[10px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tactics
          </button>
        </div>
      </div>

      {/* TABLET & DESKTOP (>= 640px) FLOATING TRAINING HALL HEADER */}
      <div className="relative z-10 p-3.5 hidden sm:flex items-start justify-between gap-2.5 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 rounded-[18px] px-3.5 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.14)] border border-black/[0.06] flex items-center gap-2.5 max-w-[340px]">
          <button
            type="button"
            onClick={() => onOpenTeamModal?.(club)}
            className="shrink-0 cursor-pointer hover:opacity-85 transition"
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
              className="w-7 h-7 rounded-md object-contain shrink-0"
            />
          </button>
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-[#14161D] leading-tight truncate">
              {analytics.clubShortName} Training Gym
            </h3>
            <p className="text-[11px] text-[#686D7B] truncate">
              Full-court shuttle warmup · {tactic}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenTactics}
          className="pointer-events-auto bg-white/95 hover:bg-white rounded-[18px] px-3.5 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.14)] border border-black/[0.06] text-right shrink-0 tabular-nums transition cursor-pointer"
          title="Open Coach & Tactical System"
        >
          <div className="text-[13px] font-extrabold text-[#14161D] leading-tight">
            {squadSize}/22 Active · {morale}% Morale
          </div>
          <div className="text-[10px] font-semibold text-[#686D7B]">
            Change Tactical System →
          </div>
        </button>
      </div>

      {/* BOTTOM FLOATING CAMERA SWITCHER & SQUAD TELEMETRY */}
      <div className="absolute inset-x-0 bottom-0 z-30 p-2.5 sm:p-3.5 flex items-end justify-between gap-1.5 sm:gap-2 pointer-events-none">
        <div
          role="group"
          aria-label="Gym Camera Angle"
          className="pointer-events-auto bg-white/95 rounded-[18px] sm:rounded-[20px] p-1 sm:p-1.5 sm:pl-3 shadow-[0_10px_26px_rgba(15,23,42,0.14)] border border-black/[0.05] flex items-center gap-1 sm:gap-2 shrink-0"
        >
          <span className="hidden sm:inline text-[11px] font-semibold text-[#14161D] pr-0.5">
            Camera
          </span>

          <button
            type="button"
            onClick={() => setCamera('isometric')}
            aria-label="Isometric gym camera"
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

          <button
            type="button"
            onClick={() => setCamera('topdown')}
            aria-label="Top-down gym camera"
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

          <button
            type="button"
            onClick={() => setCamera('endzone')}
            aria-label="Endzone gym camera"
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

        <button
          type="button"
          onClick={onOpenOvr}
          aria-label={`Inspect Squad OVR (${baseOvr} OVR, ${activeYouthCount}/${youthSlotLimit} Youth Slots)`}
          className="pointer-events-auto bg-white/95 hover:bg-white rounded-[16px] sm:rounded-[18px] px-3 sm:px-4 py-1.5 sm:py-2 shadow-[0_10px_26px_rgba(15,23,42,0.14)] border border-black/[0.05] flex items-center gap-3 sm:gap-4 min-w-0 text-left transition cursor-pointer touch-manipulation"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
              Squad Rating
            </span>
            <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] tabular-nums leading-tight whitespace-nowrap">
              {baseOvr} OVR
            </span>
          </div>

          <div className="h-5 w-px bg-black/[0.08] shrink-0" aria-hidden="true" />

          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
              U19 Pipeline
            </span>
            <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] tabular-nums leading-tight whitespace-nowrap">
              {activeYouthCount}/{youthSlotLimit}
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};
