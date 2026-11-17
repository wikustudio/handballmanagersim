import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BoardroomArchitectureModel,
  BoardroomCameraMode,
  buildBoardroomArchitectureModel,
} from '../utils/boardroomArchitecture';
import { ClubLogo } from './ClubLogo';

interface BoardroomTableCardProps {
  club: any;
  clubFullName: string;
  clubShortName: string;
  clubId?: string | number;
  clubColor?: string;
  clubColor2?: string;
  clubLogo?: string;
  clubFallbackLogo?: string;
  managerName: string;
  archetype: string;
  skillPoints: number;
  impactScore: number;
  immunityShields: number;
  reputation: number;
  mediaScore: number;
  trophyTotal: number;
  signedSponsorCount: number;
  completedGoals: number;
  totalGoals: number;
  onOpenBoardExpectations: () => void;
  onOpenImpact: () => void;
  onOpenRoadmap: () => void;
  onOpenProfile: () => void;
}

interface Pt2 {
  x: number;
  y: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '#DF642A').replace('#', '');
  const full =
    clean.length === 3
      ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 223, g: 100, b: 42 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function shadeHex(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  if (factor >= 0) {
    return `rgb(${clamp(r + (255 - r) * factor)}, ${clamp(g + (255 - g) * factor)}, ${clamp(
      b + (255 - b) * factor
    )})`;
  }
  const f = 1 + factor;
  return `rgb(${clamp(r * f)}, ${clamp(g * f)}, ${clamp(b * f)})`;
}

function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: Pt2[],
  fill: string,
  stroke?: string,
  lineWidth = 1
) {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export const BoardroomTableCard: React.FC<BoardroomTableCardProps> = ({
  club,
  clubFullName,
  clubShortName,
  clubId,
  clubColor,
  clubColor2,
  clubLogo,
  clubFallbackLogo,
  managerName,
  archetype,
  skillPoints,
  impactScore,
  immunityShields,
  reputation,
  mediaScore,
  trophyTotal,
  signedSponsorCount,
  completedGoals,
  totalGoals,
  onOpenBoardExpectations,
  onOpenImpact,
  onOpenRoadmap,
  onOpenProfile,
}) => {
  const [camera, setCamera] = useState<BoardroomCameraMode>('isometric');

  const boardModel: BoardroomArchitectureModel = useMemo(
    () =>
      buildBoardroomArchitectureModel({
        tier: club?.tier ?? 1,
        isPublic: Boolean(club?.isPublic),
        impactScore,
        reputation,
        mediaPressure: mediaScore,
        signedSponsorCount,
        trophyTotal,
        completedGoals,
        totalGoals,
        clubColor: club?.color || clubColor,
        clubColor2: club?.color2 || clubColor2,
      }),
    [
      club?.tier,
      club?.isPublic,
      club?.color,
      club?.color2,
      clubColor,
      clubColor2,
      impactScore,
      reputation,
      mediaScore,
      signedSponsorCount,
      trophyTotal,
      completedGoals,
      totalGoals,
    ]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const src = club?.logo || clubLogo || club?.fallbackLogo || clubFallbackLogo;
    if (!src || typeof Image === 'undefined') {
      logoImgRef.current = null;
      redrawRef.current?.();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImgRef.current = img;
      redrawRef.current?.();
    };
    img.onerror = () => {
      logoImgRef.current = null;
      redrawRef.current?.();
    };
    img.src = src;
  }, [club?.logo, clubLogo, club?.fallbackLogo, clubFallbackLogo]);

  const propsRef = useRef({
    camera,
    boardModel,
    clubShortName: (clubShortName || clubFullName || 'CLUB').toUpperCase(),
    impactScore,
    mediaScore,
  });

  useEffect(() => {
    propsRef.current = {
      camera,
      boardModel,
      clubShortName: (clubShortName || clubFullName || 'CLUB').toUpperCase(),
      impactScore,
      mediaScore,
    };
    redrawRef.current?.();
  }, [camera, boardModel, clubShortName, clubFullName, impactScore, mediaScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cssW = 720;
    let cssH = 380;
    let dpr = 1;
    let unmounted = false;
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      cssW = rect.width;
      cssH = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    };

    updateSize();

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let lastTs = performance.now();
    let elapsed = 0;

    const scheduleNext = () => {
      if (unmounted || reducedMotion) return;
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        if (!unmounted) {
          rafId = requestAnimationFrame(renderFrame);
        }
      }, 80);
    };

    const renderFrame = (now: number) => {
      if (unmounted) return;
      const rect = canvas.getBoundingClientRect();
      if (
        rect.width >= 10 &&
        rect.height >= 10 &&
        (Math.abs(rect.width - cssW) > 1 || Math.abs(rect.height - cssH) > 1)
      ) {
        updateSize();
      }

      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.1);
      if (!reducedMotion) {
        elapsed += dt;
      }

      const {
        camera: cam,
        boardModel: model,
        clubShortName: shortLabel,
        impactScore: curImpact,
        mediaScore: curMedia,
      } = propsRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Deep Executive Boardroom Architectural Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, cssW, cssH);
      bgGrad.addColorStop(0, '#161C2C');
      bgGrad.addColorStop(0.5, '#1F273C');
      bgGrad.addColorStop(1, '#141927');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      const isCompact = cssW < 500;
      const cx = cssW * 0.5;
      const cy =
        cam === 'headtable'
          ? isCompact
            ? cssH * 0.64
            : cssH * 0.61
          : cam === 'topdown'
          ? isCompact
            ? cssH * 0.56
            : cssH * 0.54
          : isCompact
          ? cssH * 0.61
          : cssH * 0.59;

      const project = (u: number, v: number, z = 0): Pt2 => {
        if (cam === 'topdown') {
          const halfW = Math.min(cssW * 0.39, cssH * 0.66);
          const halfH = halfW * 0.56;
          return {
            x: cx + u * halfW,
            y: cy + v * halfH - z * 18,
          };
        }
        if (cam === 'headtable') {
          const depth = (v + 1.45) / 2.9;
          const persp = 0.54 + depth * 0.58;
          const spanW = Math.min(cssW * 0.36, cssH * 0.54);
          return {
            x: cx + u * spanW * persp,
            y: cy + (v - 0.1) * cssH * 0.19 - z * cssH * 0.25 * persp,
          };
        }
        const scale = Math.min(
          cssW * (isCompact ? 0.33 : 0.29),
          cssH * (isCompact ? 0.45 : 0.44)
        );
        const isoX = (u * 0.94 - v * 0.56) * scale;
        const isoY = (u * 0.29 + v * 0.48) * scale;
        return {
          x: cx + isoX,
          y: cy + isoY - z * scale * 0.46,
        };
      };

      const drawBox = (
        u0: number,
        u1: number,
        v0: number,
        v1: number,
        z0: number,
        z1: number,
        colors: { top: string; front: string; side: string; stroke?: string }
      ) => {
        const p000 = project(u0, v0, z0);
        const p100 = project(u1, v0, z0);
        const p110 = project(u1, v1, z0);
        const p010 = project(u0, v1, z0);

        const p001 = project(u0, v0, z1);
        const p101 = project(u1, v0, z1);
        const p111 = project(u1, v1, z1);
        const p011 = project(u0, v1, z1);

        if (cam === 'topdown') {
          fillPoly(ctx, [p001, p101, p111, p011], colors.top, colors.stroke, 0.85);
          return;
        }
        if (cam === 'headtable') {
          fillPoly(ctx, [p010, p110, p111, p011], colors.front, colors.stroke, 0.8);
          fillPoly(ctx, [p001, p101, p111, p011], colors.top, colors.stroke, 0.8);
          return;
        }
        fillPoly(ctx, [p100, p110, p111, p101], colors.side, colors.stroke, 0.75);
        fillPoly(ctx, [p010, p110, p111, p011], colors.front, colors.stroke, 0.75);
        fillPoly(ctx, [p001, p101, p111, p011], colors.top, colors.stroke, 0.75);
      };

      // Warm overhead boardroom chandelier glow
      const ceilingGlow = ctx.createRadialGradient(
        cx,
        cy - cssH * 0.12,
        12,
        cx,
        cy,
        cssW * 0.48
      );
      ceilingGlow.addColorStop(0, 'rgba(255, 224, 178, 0.20)');
      ceilingGlow.addColorStop(0.55, 'rgba(148, 176, 224, 0.06)');
      ceilingGlow.addColorStop(1, 'rgba(22, 28, 44, 0)');
      ctx.fillStyle = ceilingGlow;
      ctx.fillRect(0, 0, cssW, cssH);

      // 2. Hardwood Executive Floor & Tailored Woven Boardroom Rug
      fillPoly(
        ctx,
        [
          project(-1.38, -1.25, 0),
          project(1.38, -1.25, 0),
          project(1.38, 1.15, 0),
          project(-1.38, 1.15, 0),
        ],
        '#2E3548',
        'rgba(255,255,255,0.12)',
        1.1
      );

      // Parquet seam lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.8;
      for (let g = -1.2; g <= 1.2; g += 0.3) {
        const a = project(g, -1.25, 0);
        const b = project(g, 1.15, 0);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Tailored Woven Carpet Area Rug beneath the table
      fillPoly(
        ctx,
        [
          project(-1.12, -0.78, 0.005),
          project(1.12, -0.78, 0.005),
          project(1.12, 0.78, 0.005),
          project(-1.12, 0.78, 0.005),
        ],
        '#3D455C',
        'rgba(255,255,255,0.14)',
        1
      );
      fillPoly(
        ctx,
        [
          project(-1.06, -0.72, 0.006),
          project(1.06, -0.72, 0.006),
          project(1.06, 0.72, 0.006),
          project(-1.06, 0.72, 0.006),
        ],
        '#464F68',
        model.primaryHex,
        0.9
      );

      // 3. Architectural Boardroom Backdrop Walls, Strategy Screen & Trophy Credenza
      if (cam !== 'topdown') {
        const wallH = 1.05;

        // Back Wall (v = -1.25): Warm Walnut / Slate Executive Wall
        fillPoly(
          ctx,
          [
            project(-1.38, -1.25, 0),
            project(1.38, -1.25, 0),
            project(1.38, -1.25, wallH),
            project(-1.38, -1.25, wallH),
          ],
          '#242C40',
          'rgba(255,255,255,0.10)',
          1
        );

        // Acoustic wood-slat architectural band along lower half of back wall
        fillPoly(
          ctx,
          [
            project(-1.38, -1.245, 0),
            project(1.38, -1.245, 0),
            project(1.38, -1.245, 0.36),
            project(-1.38, -1.245, 0.36),
          ],
          '#5C3D28',
          'rgba(20,14,10,0.45)',
          0.9
        );

        // Recessed Club Accent Cove Strip
        const coveA = project(-1.32, -1.24, 0.96);
        const coveB = project(1.32, -1.24, 0.96);
        ctx.strokeStyle = model.primaryHex;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(coveA.x, coveA.y);
        ctx.lineTo(coveB.x, coveB.y);
        ctx.stroke();

        // Executive KPI & Board Strategy Display Screen mounted on center Back Wall
        fillPoly(
          ctx,
          [
            project(-0.56, -1.23, 0.42),
            project(0.56, -1.23, 0.42),
            project(0.56, -1.23, 0.88),
            project(-0.56, -1.23, 0.88),
          ],
          '#0F1524',
          'rgba(255,255,255,0.28)',
          1.2
        );

        // Screen inner status bars (Impact & Media bars inside wall screen)
        const impactRatio = Math.max(0.08, Math.min(1, curImpact / 100));
        const mediaRatio = Math.max(0.08, Math.min(1, curMedia / 100));
        const pulse = reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(elapsed * 2.4);

        fillPoly(
          ctx,
          [
            project(-0.46, -1.225, 0.65),
            project(-0.46 + 0.92 * impactRatio, -1.225, 0.65),
            project(-0.46 + 0.92 * impactRatio, -1.225, 0.72),
            project(-0.46, -1.225, 0.72),
          ],
          model.moodAccentHex
        );

        fillPoly(
          ctx,
          [
            project(-0.46, -1.225, 0.52),
            project(-0.46 + 0.92 * mediaRatio, -1.225, 0.52),
            project(-0.46 + 0.92 * mediaRatio, -1.225, 0.58),
            project(-0.46, -1.225, 0.58),
          ],
          model.mediaAlertHex
        );

        // Screen Header Text
        const screenTitlePt = project(0, -1.22, 0.80);
        const sL = project(-0.4, -1.22, 0.80);
        const sR = project(0.4, -1.22, 0.80);
        const screenAng = Math.atan2(sR.y - sL.y, sR.x - sL.x);
        ctx.save();
        ctx.translate(screenTitlePt.x, screenTitlePt.y);
        ctx.rotate(screenAng);
        ctx.globalAlpha = pulse;
        ctx.font = `700 ${Math.max(7, Math.round(cssW * 0.012))}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#E2E8F0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${shortLabel} BOARD`, 0, 0);
        ctx.restore();

        // Back Credenza Sideboard + Trophy Showcase Cups
        drawBox(-0.78, 0.78, -1.22, -0.98, 0.01, 0.28, {
          top: '#784A2A',
          front: '#5E381E',
          side: '#472915',
          stroke: 'rgba(15,10,6,0.45)',
        });

        for (let t = 0; t < model.trophyDisplayCount; t++) {
          const tu = -0.5 + t * 0.5;
          const cupBase = project(tu, -1.08, 0.29);
          const cupTop = project(tu, -1.08, 0.42);
          ctx.strokeStyle = '#FACC15';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cupBase.x, cupBase.y);
          ctx.lineTo(cupTop.x, cupTop.y);
          ctx.stroke();

          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(cupTop.x, cupTop.y - 2, 3.6, 0, Math.PI, false);
          ctx.fill();
          ctx.fillRect(cupBase.x - 3, cupBase.y - 1.5, 6, 2.2);
        }

        // Left Glass Curtain Wall (u = -1.38) looking toward evening arena floodlights
        if (cam === 'isometric') {
          fillPoly(
            ctx,
            [
              project(-1.38, 1.15, 0),
              project(-1.38, -1.25, 0),
              project(-1.38, -1.25, wallH),
              project(-1.38, 1.15, wallH),
            ],
            'rgba(48, 72, 112, 0.55)',
            'rgba(255,255,255,0.16)',
            1
          );
          // Window mullions
          for (const mv of [-0.65, -0.05, 0.55]) {
            const mb = project(-1.375, mv, 0);
            const mt = project(-1.375, mv, wallH);
            ctx.strokeStyle = 'rgba(20, 26, 40, 0.65)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mb.x, mb.y);
            ctx.lineTo(mt.x, mt.y);
            ctx.stroke();
          }
        }
      }

      // 4. Far-Side Executive Directors & Chairs (behind table, painted before table!)
      const drawChairAndDirector = (
        cu: number,
        cv: number,
        facingDir: 'south' | 'north' | 'east' | 'west',
        seatIndex: number,
        isGM = false
      ) => {
        const chairW = 0.11;
        const chairD = 0.09;
        // Seat cushion
        drawBox(cu - chairW, cu + chairW, cv - chairD, cv + chairD, 0.14, 0.19, {
          top: isGM ? model.primaryHex : '#323A4F',
          front: '#202636',
          side: '#191E2B',
        });

        // Seated Director Torso + Head
        const sway = reducedMotion ? 0 : Math.sin(elapsed * 1.4 + seatIndex * 1.1) * 0.01;
        const seatPt = project(cu, cv, 0.22);
        const headPt = project(cu, cv, 0.49 + sway);

        if (cam === 'topdown') {
          ctx.beginPath();
          ctx.arc(seatPt.x, seatPt.y, 7.2, 0, Math.PI * 2);
          ctx.fillStyle = isGM ? model.primaryHex : seatIndex % 2 === 0 ? '#1E293B' : '#334155';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(seatPt.x, seatPt.y, 3.3, 0, Math.PI * 2);
          ctx.fillStyle = seatIndex % 3 === 0 ? '#D9A886' : '#8A5A42';
          ctx.fill();
          return;
        }

        // Executive suit shoulders
        ctx.fillStyle = isGM ? model.primaryHex : seatIndex % 2 === 0 ? '#1E2538' : '#2E374D';
        ctx.strokeStyle = 'rgba(10, 14, 22, 0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(seatPt.x - 6.5, headPt.y + 3, 13, Math.max(8, seatPt.y - headPt.y - 1), 4);
        ctx.fill();
        ctx.stroke();

        // Crisp white collar triangle
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.moveTo(seatPt.x - 2.4, headPt.y + 3.5);
        ctx.lineTo(seatPt.x + 2.4, headPt.y + 3.5);
        ctx.lineTo(seatPt.x, headPt.y + 7.5);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = seatIndex % 3 === 0 ? '#D9A886' : seatIndex % 2 === 0 ? '#E8C0A2' : '#7C5138';
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 20, 30, 0.45)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // High-back executive leather backrest (drawn behind or in front depending on facingDir)
        if (facingDir === 'south' || facingDir === 'east') {
          const backU0 = facingDir === 'east' ? cu - 0.12 : cu - 0.1;
          const backU1 = facingDir === 'east' ? cu - 0.08 : cu + 0.1;
          const backV0 = facingDir === 'south' ? cv - 0.11 : cv - 0.09;
          const backV1 = facingDir === 'south' ? cv - 0.07 : cv + 0.09;
          drawBox(backU0, backU1, backV0, backV1, 0.19, 0.45, {
            top: '#3B445C',
            front: '#252C3D',
            side: '#1C2130',
          });
        }
      };

      const topSideCount = Math.ceil(Math.max(2, model.directorCount - 2) / 2);
      const botSideCount = Math.floor(Math.max(2, model.directorCount - 2) / 2);

      // Far-side board directors (v = -0.58, facing south across table)
      for (let i = 0; i < topSideCount; i++) {
        const u =
          topSideCount === 1 ? 0 : -0.46 + (0.92 * i) / Math.max(1, topSideCount - 1);
        drawChairAndDirector(u, -0.58, 'south', i + 1);
      }
      // Chairman at West head of table (u = -0.92)
      drawChairAndDirector(-0.92, 0, 'east', 0);

      // 5. Grand Executive Conference Table
      // Two sculpted hardwood pedestal bases underneath
      drawBox(-0.56, -0.40, -0.22, 0.22, 0.01, 0.28, {
        top: '#472814',
        front: '#3A2010',
        side: '#2C180C',
      });
      drawBox(0.40, 0.56, -0.22, 0.22, 0.01, 0.28, {
        top: '#472814',
        front: '#3A2010',
        side: '#2C180C',
      });

      // Tabletop shadow on rug
      fillPoly(
        ctx,
        [
          project(-0.82, -0.46, 0.012),
          project(0.84, -0.46, 0.012),
          project(0.84, 0.48, 0.012),
          project(-0.82, 0.48, 0.012),
        ],
        'rgba(10, 14, 24, 0.36)'
      );

      // Thick beveled walnut tabletop (u: -0.78..0.78, v: -0.42..0.42, z: 0.28..0.34)
      drawBox(-0.78, 0.78, -0.42, 0.42, 0.28, 0.34, {
        top: model.tableTopHex,
        front: model.tableTrimHex,
        side: shadeHex(model.tableTrimHex, -0.18),
        stroke: 'rgba(20, 12, 6, 0.45)',
      });

      // Center club-colored leather inlay runner down the middle of the table
      fillPoly(
        ctx,
        [
          project(-0.62, -0.14, 0.343),
          project(0.62, -0.14, 0.343),
          project(0.62, 0.14, 0.343),
          project(-0.62, 0.14, 0.343),
        ],
        model.secondaryHex,
        model.primaryHex,
        1.2
      );

      // Center Inlaid Club Medallion Crest
      const tableMid = project(0, 0, 0.346);
      const logoImg = logoImgRef.current;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(tableMid.x, tableMid.y, 16, 10.5, cam === 'isometric' ? -0.14 : 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = model.primaryHex;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.drawImage(logoImg, tableMid.x - 10, tableMid.y - 8.5, 20, 17);
      } else {
        ctx.fillStyle = '#14161D';
        ctx.font = '800 8px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shortLabel.slice(0, 4), tableMid.x, tableMid.y);
      }
      ctx.restore();

      // Dossier folders, pens & water glasses on tabletop
      const drawDossier = (du: number, dv: number, accent: string) => {
        fillPoly(
          ctx,
          [
            project(du - 0.08, dv - 0.06, 0.345),
            project(du + 0.08, dv - 0.06, 0.345),
            project(du + 0.08, dv + 0.06, 0.345),
            project(du - 0.08, dv + 0.06, 0.345),
          ],
          '#F8FAFC',
          accent,
          1.1
        );
        // Tiny status tab on dossier
        const tabPt = project(du + 0.04, dv, 0.347);
        ctx.fillStyle = accent;
        ctx.fillRect(tabPt.x - 2, tabPt.y - 1.5, 4, 2.5);
      };

      for (let i = 0; i < topSideCount; i++) {
        const u = topSideCount === 1 ? 0 : -0.46 + (0.92 * i) / Math.max(1, topSideCount - 1);
        drawDossier(u, -0.28, model.moodAccentHex);
      }
      for (let i = 0; i < botSideCount; i++) {
        const u = botSideCount === 1 ? 0 : -0.46 + (0.92 * i) / Math.max(1, botSideCount - 1);
        drawDossier(u, 0.28, model.moodAccentHex);
      }
      // Chairman's agenda dossier + brass gavel plaque at head
      drawDossier(-0.62, 0, model.primaryHex);
      // GM's dossier at right foot
      drawDossier(0.62, 0, model.primaryHex);

      // Twin warm brass conference lamps along the center runner
      for (const lu of [-0.30, 0.30]) {
        const lBase = project(lu, 0, 0.345);
        const lTop = project(lu, 0, 0.44);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(lBase.x, lBase.y);
        ctx.lineTo(lTop.x, lTop.y);
        ctx.stroke();

        const glow = ctx.createRadialGradient(lTop.x, lTop.y, 1, lTop.x, lTop.y, 14);
        glow.addColorStop(0, 'rgba(255, 232, 175, 0.65)');
        glow.addColorStop(1, 'rgba(255, 224, 150, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lTop.x, lTop.y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEF3C7';
        ctx.beginPath();
        ctx.ellipse(lTop.x, lTop.y, 5, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Near-Side Directors & General Manager at Foot of Table (drawn after table!)
      for (let i = 0; i < botSideCount; i++) {
        const u =
          botSideCount === 1 ? 0 : -0.46 + (0.92 * i) / Math.max(1, botSideCount - 1);
        drawChairAndDirector(u, 0.58, 'north', i + 4);
        if (cam !== 'topdown') {
          // Near chair leather backrest
          drawBox(u - 0.1, u + 0.1, 0.66, 0.70, 0.19, 0.44, {
            top: '#3B445C',
            front: '#1E2434',
            side: '#171C29',
          });
        }
      }

      // General Manager seated at East foot of table (u = +0.92)
      drawChairAndDirector(0.92, 0, 'west', 7, true);
      if (cam !== 'topdown') {
        drawBox(0.99, 1.03, -0.09, 0.09, 0.19, 0.45, {
          top: model.primaryHex,
          front: '#1E2434',
          side: '#171C29',
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
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(triggerRedraw) : null;
    ro?.observe(canvas);
    window.addEventListener('resize', triggerRedraw);

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      unmounted = true;
      redrawRef.current = null;
      window.removeEventListener('resize', triggerRedraw);
      cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
      ro?.disconnect();
    };
  }, []);

  return (
    <section
      aria-label="3D Boardroom Table"
      data-testid="board-table-stage"
      data-board-directors={String(boardModel.directorCount)}
      data-board-mood={boardModel.boardMood}
      className="relative w-full rounded-[26px] overflow-hidden bg-[#182032] shadow-[0_14px_36px_rgba(15,23,42,0.12)] border border-black/[0.06] select-none"
    >
      <div className="relative w-full h-[336px] sm:h-[365px] lg:h-[348px] xl:h-[364px]">
        <canvas
          ref={canvasRef}
          data-camera={camera}
          className="block w-full h-full"
        />
      </div>

      {/* Top Floating Executive Cards */}
      <div className="absolute inset-x-0 top-0 z-20 p-2.5 sm:p-3.5 flex items-start justify-between gap-2.5 pointer-events-none">
        {/* Top-Left Boardroom Executive Card */}
        <div className="pointer-events-auto bg-white/95 rounded-[18px] sm:rounded-[22px] px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.14)] border border-black/[0.05] min-w-0 max-w-[54%] sm:max-w-[300px]">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 min-w-0 w-full text-left hover:opacity-80 transition cursor-pointer"
            title="Open Manager Dossier"
          >
            <ClubLogo
              club={club}
              name={clubFullName}
              clubId={clubId}
              color={clubColor}
              color2={clubColor2}
              logo={clubLogo}
              fallbackLogo={clubFallbackLogo}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-[12px] sm:text-[15px] font-bold text-[#14161D] leading-tight truncate">
                {clubShortName} Boardroom
              </h2>
              <p className="text-[10px] sm:text-[11px] font-medium text-[#6E7381] truncate">
                {managerName} · {archetype}
              </p>
            </div>
          </button>

          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-black/[0.06] flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenBoardExpectations}
              className="py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-[10px] sm:text-[11px] font-semibold transition cursor-pointer whitespace-nowrap touch-manipulation"
            >
              Board Mandate
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
              className="hidden sm:inline-flex py-1.5 px-2.5 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-[10px] sm:text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
            >
              Dossier
            </button>
          </div>
        </div>

        {/* Top-Right Club Impact & Mood Card */}
        <button
          type="button"
          onClick={onOpenImpact}
          className="pointer-events-auto bg-white/95 hover:bg-white rounded-[18px] sm:rounded-[22px] px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.14)] border border-black/[0.05] text-left transition cursor-pointer shrink-0 touch-manipulation"
          title="Inspect Club Impact & Immunity Shields"
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-medium text-[#525866]">
            <span>Club Impact</span>
            <span className="font-semibold text-[#14161D] tabular-nums">
              {immunityShields} {immunityShields === 1 ? 'Shield' : 'Shields'}
            </span>
          </div>
          <div className="mt-0.5 sm:mt-1 text-[15px] sm:text-[19px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight">
            {impactScore} / 100
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-medium text-[#525866] whitespace-nowrap">
            {boardModel.moodLabel}
          </div>
        </button>
      </div>

      {/* Bottom Floating Camera Switcher & Roadmap / MP Summary */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 sm:p-3.5 flex items-end justify-between gap-1.5 sm:gap-2 pointer-events-none">
        <div
          role="group"
          aria-label="Boardroom Camera Angle"
          className="pointer-events-auto bg-white/95 rounded-[18px] sm:rounded-[20px] p-1 sm:p-1.5 sm:pl-3 shadow-[0_10px_26px_rgba(15,23,42,0.14)] border border-black/[0.05] flex items-center gap-1 sm:gap-2 shrink-0"
        >
          <span className="hidden sm:inline text-[11px] font-semibold text-[#14161D] pr-0.5">
            Camera
          </span>

          <button
            type="button"
            onClick={() => setCamera('isometric')}
            aria-label="Isometric boardroom camera"
            aria-pressed={camera === 'isometric'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'isometric'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <polygon
                points="20,6 34,13 20,20 6,13"
                fill="#8C5832"
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCamera('topdown')}
            aria-label="Top-down boardroom camera"
            aria-pressed={camera === 'topdown'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'topdown'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <rect
                x="8"
                y="7"
                width="24"
                height="12"
                rx="2"
                fill="#8C5832"
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
              <circle cx="20" cy="13" r="2.2" fill="#FFFFFF" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCamera('headtable')}
            aria-label="Head of table camera"
            aria-pressed={camera === 'headtable'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'headtable'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <polygon
                points="14,7 26,7 34,20 6,20"
                fill="#8C5832"
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenRoadmap}
          aria-label={`Open Board Roadmap (${completedGoals}/${totalGoals} objectives, ${skillPoints} MP)`}
          className="pointer-events-auto bg-white/95 hover:bg-white rounded-[16px] sm:rounded-[18px] px-3 sm:px-4 py-1.5 sm:py-2 shadow-[0_10px_26px_rgba(15,23,42,0.14)] border border-black/[0.05] flex items-center gap-3 sm:gap-4 min-w-0 text-left transition cursor-pointer touch-manipulation"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
              Roadmap
            </span>
            <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] tabular-nums leading-tight whitespace-nowrap">
              {completedGoals}/{totalGoals} Goals
            </span>
          </div>

          <div className="h-5 w-px bg-black/[0.08] shrink-0" aria-hidden="true" />

          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
              Manager Pts
            </span>
            <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] tabular-nums leading-tight whitespace-nowrap">
              {skillPoints} MP
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};
