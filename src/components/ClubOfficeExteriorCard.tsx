import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatMoney, formatNum } from '../data/gameConstants';
import {
  buildOfficeArchitectureModel,
  OfficeArchitectureModel,
  OfficeCameraMode,
} from '../utils/officeArchitecture';
import { ClubLogo } from './ClubLogo';

interface ClubOfficeExteriorCardProps {
  club: any;
  clubFullName: string;
  clubShortName: string;
  clubId?: string | number;
  clubColor?: string;
  clubColor2?: string;
  clubLogo?: string;
  clubFallbackLogo?: string;
  country: string;
  reputation: number;
  budget: number;
  estRevenue: number;
  projNet: number;
  fanBase: number;
  signedSponsorCount: number;
  hasActiveLoan: boolean;
  academyLevel?: number;
  medicalLevel?: number;
  onOpenLedger: () => void;
  onOpenSponsors: () => void;
  onOpenIPO: () => void;
  onOpenClubProfile: () => void;
}

interface Pt2 {
  x: number;
  y: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '#C83232').replace('#', '');
  const full =
    clean.length === 3
      ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 200, g: 50, b: 50 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

function fillPoly(ctx: CanvasRenderingContext2D, pts: Pt2[], fill: string, stroke?: string, lineWidth = 1) {
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

export const ClubOfficeExteriorCard: React.FC<ClubOfficeExteriorCardProps> = ({
  club,
  clubFullName,
  clubShortName,
  clubId,
  clubColor,
  clubColor2,
  clubLogo,
  clubFallbackLogo,
  country,
  reputation,
  budget,
  estRevenue,
  projNet,
  fanBase,
  signedSponsorCount,
  hasActiveLoan,
  academyLevel,
  medicalLevel,
  onOpenLedger,
  onOpenSponsors,
  onOpenIPO,
  onOpenClubProfile,
}) => {
  const [camera, setCamera] = useState<OfficeCameraMode>('isometric');

  const resolvedAcademyLevel = academyLevel ?? club?.academyLevel ?? 1;
  const resolvedMedicalLevel = medicalLevel ?? club?.medicalLevel ?? 1;

  const officeModel: OfficeArchitectureModel = useMemo(
    () =>
      buildOfficeArchitectureModel({
        tier: club?.tier ?? 1,
        baseOvr: club?.baseOvr ?? 75,
        reputation,
        budget,
        fanBase,
        country,
        isPublic: Boolean(club?.isPublic),
        stockPrice: club?.stockPrice,
        ipoPrice: club?.ipoPrice,
        signedSponsorCount,
        hasActiveLoan,
        clubColor: club?.color || clubColor,
        clubColor2: club?.color2 || clubColor2,
        academyLevel: resolvedAcademyLevel,
        medicalLevel: resolvedMedicalLevel,
      }),
    [
      club?.tier,
      club?.baseOvr,
      club?.isPublic,
      club?.stockPrice,
      club?.ipoPrice,
      club?.color,
      club?.color2,
      resolvedAcademyLevel,
      resolvedMedicalLevel,
      reputation,
      budget,
      fanBase,
      country,
      signedSponsorCount,
      hasActiveLoan,
      clubColor,
      clubColor2,
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
    officeModel,
    clubShortName: (clubShortName || clubFullName || 'CLUB').toUpperCase(),
  });

  useEffect(() => {
    propsRef.current = {
      camera,
      officeModel,
      clubShortName: (clubShortName || clubFullName || 'CLUB').toUpperCase(),
    };
    redrawRef.current?.();
  }, [camera, officeModel, clubShortName, clubFullName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cssW = 720;
    let cssH = 420;
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
      }, 75);
    };

    const renderFrame = (now: number) => {
      if (unmounted) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width >= 10 && rect.height >= 10 && (Math.abs(rect.width - cssW) > 1 || Math.abs(rect.height - cssH) > 1)) {
        updateSize();
      }
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.1);
      if (!reducedMotion) {
        elapsed += dt;
      }

      const { camera: cam, officeModel: model, clubShortName: shortLabel } = propsRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Sky & Architectural Horizon Backdrop (matches Courtside dark-navy framing with sunlit daylight horizon)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, cssH);
      if (cam === 'facade') {
        skyGrad.addColorStop(0, '#1B253B');
        skyGrad.addColorStop(0.54, '#2B3B59');
        skyGrad.addColorStop(0.56, '#D9D6CE');
        skyGrad.addColorStop(1, '#C5C1B7');
      } else {
        skyGrad.addColorStop(0, '#182032');
        skyGrad.addColorStop(0.45, '#24314A');
        skyGrad.addColorStop(1, '#1A2336');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      // Subtle sun glow on upper-left sky
      const sunGlow = ctx.createRadialGradient(
        cssW * 0.25,
        cssH * 0.16,
        10,
        cssW * 0.25,
        cssH * 0.16,
        cssW * 0.55
      );
      sunGlow.addColorStop(0, 'rgba(255, 226, 182, 0.18)');
      sunGlow.addColorStop(0.55, 'rgba(148, 179, 228, 0.07)');
      sunGlow.addColorStop(1, 'rgba(24, 32, 50, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, cssW, cssH);

      // Scale dynamically with story count so 5F-6F headquarters + rooftop pavilion never clip at top
      const tallness = 1 + Math.max(0, model.stories - 3) * 0.085;
      const scaleBase = Math.min(cssW / 30.5, cssH / (17.8 * tallness));
      const cx = cssW * 0.5;
      const cy =
        cam === 'facade'
          ? cssH * 0.73
          : cam === 'aerial'
          ? cssH * 0.62
          : cssH * 0.67;

      const project = (wx: number, wy: number, wz: number): Pt2 => {
        if (cam === 'facade') {
          const depth = 1 / (1 + (8 - wy) * 0.028);
          const s = scaleBase * 1.02 * depth;
          return {
            x: cx + (wx + (wy - 2) * 0.12) * s,
            y: cy + (wy - 2) * s * 0.22 - wz * s * 0.9,
          };
        }
        if (cam === 'aerial') {
          const s = scaleBase * 0.92;
          const rx = wx * 0.88 - wy * 0.52;
          const ry = wx * 0.34 + wy * 0.64;
          return {
            x: cx + rx * s,
            y: cy + ry * s - wz * s * 0.64,
          };
        }
        const s = scaleBase * 0.96;
        const rx = wx * 0.86 - wy * 0.56;
        const ry = wx * 0.28 + wy * 0.46;
        return {
          x: cx + rx * s,
          y: cy + ry * s - wz * s * 0.84,
        };
      };

      const drawBox = (
        x0: number,
        x1: number,
        y0: number,
        y1: number,
        z0: number,
        z1: number,
        colors: {
          top: string;
          front: string;
          side: string;
          stroke?: string;
        }
      ) => {
        const p000 = project(x0, y0, z0);
        const p100 = project(x1, y0, z0);
        const p110 = project(x1, y1, z0);
        const p010 = project(x0, y1, z0);

        const p001 = project(x0, y0, z1);
        const p101 = project(x1, y0, z1);
        const p111 = project(x1, y1, z1);
        const p011 = project(x0, y1, z1);

        if (cam === 'facade') {
          fillPoly(ctx, [p100, p110, p111, p101], colors.side, colors.stroke, 0.7);
          fillPoly(ctx, [p010, p110, p111, p011], colors.front, colors.stroke, 0.8);
          fillPoly(ctx, [p001, p101, p111, p011], colors.top, colors.stroke, 0.7);
          return;
        }

        fillPoly(ctx, [p100, p110, p111, p101], colors.side, colors.stroke, 0.75);
        fillPoly(ctx, [p010, p110, p111, p011], colors.front, colors.stroke, 0.75);
        fillPoly(ctx, [p001, p101, p111, p011], colors.top, colors.stroke, 0.75);
      };

      // 2. Campus Estate Plinth & Landscaped Grounds
      drawBox(-13.8, 13.8, -8.8, 10.6, -0.45, 0, {
        top: '#DCD8CE',
        front: '#B8B3A7',
        side: '#9F9A8E',
        stroke: 'rgba(20,24,36,0.18)',
      });

      // Left & Right manicured lawn beds
      fillPoly(
        ctx,
        [
          project(-13.1, -8.0, 0.02),
          project(-6.6, -8.0, 0.02),
          project(-6.6, 5.8, 0.02),
          project(-13.1, 5.8, 0.02),
        ],
        '#5E8B61',
        'rgba(35,60,38,0.25)',
        1
      );
      fillPoly(
        ctx,
        [
          project(6.6, -8.0, 0.02),
          project(13.1, -8.0, 0.02),
          project(13.1, 5.8, 0.02),
          project(6.6, 5.8, 0.02),
        ],
        '#568259',
        'rgba(35,60,38,0.25)',
        1
      );

      // Central Travertine Stone Forecourt Plaza
      fillPoly(
        ctx,
        [
          project(-6.5, -7.8, 0.03),
          project(6.5, -7.8, 0.03),
          project(6.5, 6.2, 0.03),
          project(-6.5, 6.2, 0.03),
        ],
        '#EAE6DC',
        'rgba(120,114,102,0.28)',
        1
      );

      // Subtle stone paving grid lines on plaza
      ctx.strokeStyle = 'rgba(130, 124, 110, 0.18)';
      ctx.lineWidth = 0.8;
      for (let gx = -5; gx <= 5; gx += 2.5) {
        const a = project(gx, -1.5, 0.04);
        const b = project(gx, 6.1, 0.04);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let gy = 0; gy <= 6; gy += 1.5) {
        const a = project(-6.3, gy, 0.04);
        const b = project(6.3, gy, 0.04);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Front Executive Driveway / Drop-off Lane (y: 6.2 .. 10.1)
      fillPoly(
        ctx,
        [
          project(-13.4, 6.2, 0.02),
          project(13.4, 6.2, 0.02),
          project(13.4, 10.1, 0.02),
          project(-13.4, 10.1, 0.02),
        ],
        '#343B4B',
        'rgba(255,255,255,0.12)',
        1
      );

      // Dashed road centerline on executive drive
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.1;
      const rdL = project(-12.6, 8.15, 0.04);
      const rdR = project(12.6, 8.15, 0.04);
      ctx.beginPath();
      ctx.moveTo(rdL.x, rdL.y);
      ctx.lineTo(rdR.x, rdR.y);
      ctx.stroke();
      ctx.restore();

      // Reflecting Pool / Water Feature in Plaza (for 4+ story or PLC HQs)
      if (model.hasPlazaWaterFeature) {
        drawBox(-5.6, -2.5, 1.8, 4.9, 0.02, 0.22, {
          top: '#4F89B8',
          front: '#C8C3B8',
          side: '#B0ABA0',
        });
        const ripple = 0.5 + 0.5 * Math.sin(elapsed * 2.2);
        fillPoly(
          ctx,
          [
            project(-5.35, 2.05, 0.23),
            project(-2.75, 2.05, 0.23),
            project(-2.75, 4.65, 0.23),
            project(-5.35, 4.65, 0.23),
          ],
          `rgba(135, 204, 245, ${0.32 + ripple * 0.16})`
        );
      }

      const drawTree = (tx: number, ty: number, scale = 1) => {
        const base = project(tx, ty, 0.04);
        ctx.fillStyle = 'rgba(18, 24, 34, 0.22)';
        ctx.beginPath();
        ctx.ellipse(base.x + 2, base.y + 2, 7 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        drawBox(tx - 0.14 * scale, tx + 0.14 * scale, ty - 0.14 * scale, ty + 0.14 * scale, 0.04, 0.85 * scale, {
          top: '#6B4C35',
          front: '#5C402C',
          side: '#473121',
        });

        const c1 = project(tx, ty, 1.35 * scale);
        const c2 = project(tx - 0.12 * scale, ty - 0.1 * scale, 1.85 * scale);
        const r1 = Math.max(5, scaleBase * 0.55 * scale);
        const r2 = Math.max(4, scaleBase * 0.4 * scale);

        ctx.fillStyle = '#3B6E47';
        ctx.beginPath();
        ctx.arc(c1.x, c1.y, r1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#528B5E';
        ctx.beginPath();
        ctx.arc(c2.x - r1 * 0.14, c2.y - r2 * 0.1, r2, 0, Math.PI * 2);
        ctx.fill();
      };

      drawTree(-11.2, -5.8, 1.05);
      drawTree(-11.2, -1.8, 0.95);
      drawTree(11.2, -5.8, 1.05);
      drawTree(11.2, -1.8, 0.95);

      // 3. Headquarters Architectural Massing
      const floorH = 1.18;
      const mainH = model.stories * floorH + 0.7;
      const wingStories = Math.max(2, model.stories - 1);
      const wingH = wingStories * floorH + 0.45;

      const drawFrontCurtainWall = (
        x0: number,
        x1: number,
        yFace: number,
        zBottom: number,
        numStories: number,
        cols: number,
        accentFinHex: string
      ) => {
        const padX = 0.35;
        const innerW = x1 - x0 - padX * 2;
        if (innerW <= 0.4) return;

        for (let s = 0; s < numStories; s++) {
          const fz0 = zBottom + s * floorH + 0.18;
          const fz1 = fz0 + floorH - 0.3;

          for (let c = 0; c < cols; c++) {
            const wx0 = x0 + padX + (innerW * c) / cols + 0.06;
            const wx1 = x0 + padX + (innerW * (c + 1)) / cols - 0.06;
            const litSeed = (s * 7 + c * 13) % 5;
            const warmGlow =
              litSeed === 0 || litSeed === 2
                ? 'rgba(255, 232, 185, 0.74)'
                : litSeed === 1
                ? 'rgba(182, 214, 242, 0.62)'
                : 'rgba(122, 162, 204, 0.48)';

            fillPoly(
              ctx,
              [
                project(wx0, yFace + 0.02, fz0),
                project(wx1, yFace + 0.02, fz0),
                project(wx1, yFace + 0.02, fz1),
                project(wx0, yFace + 0.02, fz1),
              ],
              warmGlow,
              'rgba(32, 44, 64, 0.45)',
              0.7
            );
          }

          const slabZ0 = zBottom + (s + 1) * floorH - 0.08;
          const slabZ1 = slabZ0 + 0.12;
          fillPoly(
            ctx,
            [
              project(x0 + 0.12, yFace + 0.03, slabZ0),
              project(x1 - 0.12, yFace + 0.03, slabZ0),
              project(x1 - 0.12, yFace + 0.03, slabZ1),
              project(x0 + 0.12, yFace + 0.03, slabZ1),
            ],
            '#2B3548'
          );
        }

        ctx.strokeStyle = accentFinHex;
        ctx.lineWidth = 1.25;
        for (let c = 1; c < cols; c++) {
          const fx = x0 + padX + (innerW * c) / cols;
          const bPt = project(fx, yFace + 0.05, zBottom + 0.15);
          const tPt = project(fx, yFace + 0.05, zBottom + numStories * floorH);
          ctx.beginPath();
          ctx.moveTo(bPt.x, bPt.y);
          ctx.lineTo(tPt.x, tPt.y);
          ctx.stroke();
        }
      };

      const drawSideCurtainWall = (
        xFace: number,
        y0: number,
        y1: number,
        zBottom: number,
        numStories: number,
        cols: number
      ) => {
        if (cam === 'facade') return;
        const padY = 0.35;
        const innerD = y1 - y0 - padY * 2;
        if (innerD <= 0.4) return;
        for (let s = 0; s < numStories; s++) {
          const fz0 = zBottom + s * floorH + 0.18;
          const fz1 = fz0 + floorH - 0.3;
          for (let c = 0; c < cols; c++) {
            const wy0 = y0 + padY + (innerD * c) / cols + 0.06;
            const wy1 = y0 + padY + (innerD * (c + 1)) / cols - 0.06;
            const isWarm = (s + c) % 3 === 0;
            fillPoly(
              ctx,
              [
                project(xFace + 0.02, wy0, fz0),
                project(xFace + 0.02, wy1, fz0),
                project(xFace + 0.02, wy1, fz1),
                project(xFace + 0.02, wy0, fz1),
              ],
              isWarm ? 'rgba(232, 208, 162, 0.52)' : 'rgba(96, 134, 178, 0.46)',
              'rgba(24, 34, 52, 0.4)',
              0.65
            );
          }
        }
      };

      if (model.wingCount >= 2) {
        drawBox(-9.8, -4.4, -6.8, -1.6, 0.03, wingH, {
          top: shadeHex(model.primaryHex, 0.78),
          front: shadeHex(model.primaryHex, 0.84),
          side: shadeHex(model.primaryHex, 0.66),
          stroke: rgba(model.primaryHex, 0.35),
        });
        // Bold club primary & secondary architectural cornice bands on left wing
        drawBox(-9.85, -4.4, -6.85, -1.55, wingH - 0.16, wingH + 0.08, {
          top: model.clubTrimHex,
          front: model.clubTrimHex,
          side: shadeHex(model.clubTrimHex, -0.15),
          stroke: 'rgba(20,26,38,0.22)',
        });
        drawBox(-9.88, -4.4, -6.88, -1.52, wingH + 0.08, wingH + 0.30, {
          top: shadeHex(model.primaryHex, 0.12),
          front: model.primaryHex,
          side: shadeHex(model.primaryHex, -0.22),
          stroke: 'rgba(20,26,38,0.24)',
        });
        drawFrontCurtainWall(
          -9.8,
          -4.4,
          -1.6,
          0.03,
          wingStories,
          4,
          rgba(model.primaryHex, 0.78)
        );
      }

      // Main Headquarters Tower clad in club-tinted architectural stone + club primary corner pilasters
      drawBox(-4.6, 4.6, -6.6, -0.4, 0.03, mainH, {
        top: shadeHex(model.primaryHex, 0.84),
        front: shadeHex(model.primaryHex, 0.88),
        side: shadeHex(model.primaryHex, 0.70),
        stroke: rgba(model.primaryHex, 0.38),
      });

      // Vertical Club-Colored Architectural Corner Pilasters framing the main facade
      for (const pilX of [-4.42, 4.14]) {
        fillPoly(
          ctx,
          [
            project(pilX, -0.37, 0.04),
            project(pilX + 0.28, -0.37, 0.04),
            project(pilX + 0.28, -0.37, mainH),
            project(pilX, -0.37, mainH),
          ],
          model.primaryHex
        );
      }

      const crownH = 0.68;
      // Primary club-colored executive crown fascia (high contrast for white/gold signage)
      drawBox(-4.72, 4.72, -6.72, -0.28, mainH, mainH + crownH, {
        top: shadeHex(model.primaryHex, 0.12),
        front: model.primaryHex,
        side: shadeHex(model.primaryHex, -0.24),
        stroke: 'rgba(15,20,30,0.32)',
      });
      // Secondary club-color trim cornice crowning the roofline
      drawBox(-4.78, 4.78, -6.78, -0.22, mainH + crownH, mainH + crownH + 0.22, {
        top: shadeHex(model.clubTrimHex, 0.12),
        front: model.clubTrimHex,
        side: shadeHex(model.clubTrimHex, -0.18),
        stroke: 'rgba(15,20,30,0.25)',
      });

      if (model.hasRooftopTerrace) {
        drawBox(-2.6, 2.6, -5.4, -2.0, mainH + crownH + 0.22, mainH + crownH + 1.28, {
          top: shadeHex(model.primaryHex, 0.82),
          front: model.primaryHex,
          side: shadeHex(model.primaryHex, -0.22),
          stroke: 'rgba(24,32,48,0.28)',
        });
      }

      drawFrontCurtainWall(
        -4.6,
        4.6,
        -0.4,
        floorH + 0.03,
        Math.max(1, model.stories - 1),
        6,
        model.primaryHex
      );
      drawSideCurtainWall(4.6, -6.6, -0.4, 0.03, model.stories, 4);

      // Ground-floor double-height warm illuminated reception lobby
      fillPoly(
        ctx,
        [
          project(-2.5, -0.37, 0.06),
          project(2.5, -0.37, 0.06),
          project(2.5, -0.37, floorH + 0.05),
          project(-2.5, -0.37, floorH + 0.05),
        ],
        'rgba(255, 224, 158, 0.88)',
        model.primaryHex,
        1.3
      );

      for (const dx of [-1.2, 0, 1.2]) {
        const b = project(dx, -0.35, 0.06);
        const t = project(dx, -0.35, floorH + 0.05);
        ctx.strokeStyle = 'rgba(30, 40, 58, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }

      fillPoly(
        ctx,
        [
          project(-2.6, -0.35, 0.05),
          project(2.6, -0.35, 0.05),
          project(3.1, 1.45, 0.05),
          project(-3.1, 1.45, 0.05),
        ],
        'rgba(255, 214, 138, 0.22)'
      );

      // Two-tone Club-Colored Cantilevered Entrance Canopy
      drawBox(-2.95, 2.95, -0.4, 1.38, floorH + 0.02, floorH + 0.24, {
        top: shadeHex(model.primaryHex, 0.1),
        front: model.primaryHex,
        side: shadeHex(model.primaryHex, -0.22),
        stroke: 'rgba(20,24,36,0.28)',
      });
      drawBox(-2.98, 2.98, -0.4, 1.4, floorH + 0.24, floorH + 0.33, {
        top: model.clubTrimHex,
        front: model.clubTrimHex,
        side: shadeHex(model.clubTrimHex, -0.16),
      });
      for (const px of [-2.55, 2.55]) {
        drawBox(px - 0.11, px + 0.11, 1.05, 1.25, 0.04, floorH + 0.02, {
          top: model.primaryHex,
          front: shadeHex(model.primaryHex, -0.18),
          side: shadeHex(model.primaryHex, -0.32),
        });
      }

      if (model.hasStockTickerFascia) {
        fillPoly(
          ctx,
          [
            project(-4.45, -0.36, floorH + 0.35),
            project(4.45, -0.36, floorH + 0.35),
            project(4.45, -0.36, floorH + 0.62),
            project(-4.45, -0.36, floorH + 0.62),
          ],
          '#111726',
          'rgba(52, 211, 153, 0.55)',
          0.9
        );
        const tickerMid = project(0, -0.34, floorH + 0.48);
        ctx.save();
        ctx.fillStyle = '#34D399';
        ctx.font = `700 ${Math.max(8, Math.round(scaleBase * 0.34))}px ui-monospace, SFMono-Regular, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`PLC LISTED · ${model.effectiveStockPrice.toFixed(2)}`, tickerMid.x, tickerMid.y);
        ctx.restore();
      }

      // Facade Signage: Club Crest + "{SHORTNAME} HQ"
      const signCenter = project(0, -0.24, mainH + crownH * 0.5);
      const signLeft = project(-3.4, -0.24, mainH + crownH * 0.5);
      const signRight = project(3.4, -0.24, mainH + crownH * 0.5);
      const signAngle = Math.atan2(signRight.y - signLeft.y, signRight.x - signLeft.x);

      ctx.save();
      ctx.translate(signCenter.x, signCenter.y);
      ctx.rotate(signAngle);
      const fontPx = Math.max(9, Math.min(15, Math.round(scaleBase * 0.48)));
      ctx.font = `800 ${fontPx}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const labelText = `${shortLabel.slice(0, 12)} HQ`;
      const textW = ctx.measureText(labelText).width;
      const crestSize = Math.max(12, Math.round(fontPx * 1.25));
      const totalW = crestSize + 6 + textW;

      if (logoImgRef.current) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-totalW / 2 + crestSize / 2, 0, crestSize * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(
          logoImgRef.current,
          -totalW / 2,
          -crestSize / 2,
          crestSize,
          crestSize
        );
      } else {
        ctx.fillStyle = model.clubTrimHex;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-totalW / 2 + crestSize / 2, 0, crestSize * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, -totalW / 2 + crestSize + 6, 0.5);
      ctx.restore();

      if (model.wingCount >= 3) {
        drawBox(4.6, 9.8, -6.8, -1.6, 0.03, wingH, {
          top: shadeHex(model.primaryHex, 0.78),
          front: shadeHex(model.primaryHex, 0.84),
          side: shadeHex(model.primaryHex, 0.66),
          stroke: rgba(model.primaryHex, 0.35),
        });
        drawBox(4.6, 9.85, -6.85, -1.55, wingH - 0.16, wingH + 0.08, {
          top: model.clubTrimHex,
          front: model.clubTrimHex,
          side: shadeHex(model.clubTrimHex, -0.15),
          stroke: 'rgba(20,26,38,0.22)',
        });
        drawBox(4.6, 9.88, -6.88, -1.52, wingH + 0.08, wingH + 0.30, {
          top: shadeHex(model.primaryHex, 0.12),
          front: model.primaryHex,
          side: shadeHex(model.primaryHex, -0.22),
          stroke: 'rgba(20,26,38,0.24)',
        });
        drawFrontCurtainWall(
          4.6,
          9.8,
          -1.6,
          0.03,
          wingStories,
          4,
          rgba(model.primaryHex, 0.78)
        );
        drawSideCurtainWall(9.8, -6.8, -1.6, 0.03, wingStories, 3);
      }

      drawTree(-9.6, 2.8, 1.0);
      drawTree(9.6, 2.8, 1.0);
      if (model.treeCount >= 8) {
        drawTree(-7.4, 4.6, 0.9);
        drawTree(7.4, 4.6, 0.9);
      }

      // 4. Club-Branded Sponsor Plaza Totem Monoliths
      for (let i = 0; i < model.sponsorTotemCount; i++) {
        const tx = 3.4 + (i % 2) * 2.1;
        const ty = 1.6 + Math.floor(i / 2) * 2.2;
        drawBox(tx - 0.28, tx + 0.28, ty - 0.12, ty + 0.12, 0.04, 1.45, {
          top: model.clubTrimHex,
          front: shadeHex(model.primaryHex, -0.25),
          side: shadeHex(model.primaryHex, -0.4),
          stroke: 'rgba(255,255,255,0.24)',
        });
        fillPoly(
          ctx,
          [
            project(tx - 0.2, ty + 0.13, 0.32),
            project(tx + 0.2, ty + 0.13, 0.32),
            project(tx + 0.2, ty + 0.13, 1.3),
            project(tx - 0.2, ty + 0.13, 1.3),
          ],
          i % 2 === 0 ? model.primaryHex : model.clubTrimHex
        );
      }

      // 5. Waving Club Flags on Forecourt Flagpoles (Two-Tone Club Colors)
      for (let f = 0; f < model.flagpoleCount; f++) {
        const fx = -5.4 + f * 1.15;
        const fy = 5.45;
        const poleBase = project(fx, fy, 0.04);
        const poleTop = project(fx, fy, 3.15);

        ctx.strokeStyle = '#DCE2EC';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(poleBase.x, poleBase.y);
        ctx.lineTo(poleTop.x, poleTop.y);
        ctx.stroke();

        const wave = Math.sin(elapsed * 3.1 + f * 0.9) * 3.2;
        const flagColor = f % 2 === 0 ? model.primaryHex : model.clubTrimHex;
        const flagW = Math.max(9, scaleBase * 0.56);
        const flagH = Math.max(6, scaleBase * 0.34);

        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.moveTo(poleTop.x, poleTop.y + 1);
        ctx.quadraticCurveTo(
          poleTop.x + flagW * 0.5,
          poleTop.y - 2 + wave * 0.5,
          poleTop.x + flagW,
          poleTop.y + 1.5 + wave
        );
        ctx.lineTo(poleTop.x + flagW, poleTop.y + flagH + wave);
        ctx.quadraticCurveTo(
          poleTop.x + flagW * 0.5,
          poleTop.y + flagH - 2 + wave * 0.5,
          poleTop.x,
          poleTop.y + flagH
        );
        ctx.closePath();
        ctx.fill();
      }

      // 6. Subtle Animated Visitors & Staff on Plaza (wearing club colors)
      for (let p = 0; p < model.pedestrianCount; p++) {
        const speed = 0.22 + (p % 3) * 0.07;
        const cycle = ((elapsed * speed + p * 0.19) % 1 + 1) % 1;
        const laneX = ((p * 2.3) % 8.4) - 4.2;
        const py = p % 2 === 0 ? 0.3 + cycle * 5.2 : 5.5 - cycle * 5.0;
        const foot = project(laneX, py, 0.05);
        const head = project(laneX, py, 0.58);

        ctx.fillStyle = 'rgba(15, 20, 30, 0.24)';
        ctx.beginPath();
        ctx.ellipse(foot.x + 1, foot.y + 1, 3.2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p % 2 === 0 ? model.primaryHex : '#1E293B';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(foot.x, foot.y);
        ctx.lineTo(head.x, head.y + 2);
        ctx.stroke();

        ctx.fillStyle = '#F1D2B6';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Official Club Team Coach Bus (Full Club Primary + Secondary Livery) & Executive Cars
      if (model.hasTeamBus) {
        const bx0 = -6.0;
        const bx1 = -0.5;
        const by0 = 6.6;
        const by1 = 7.82;
        const shadowCenter = project((bx0 + bx1) / 2, (by0 + by1) / 2, 0.03);
        ctx.fillStyle = 'rgba(10, 14, 22, 0.38)';
        ctx.beginPath();
        ctx.ellipse(shadowCenter.x, shadowCenter.y + 3, scaleBase * 2.55, scaleBase * 0.58, -0.22, 0, Math.PI * 2);
        ctx.fill();

        // Main Coach Body in Club Primary Color with Secondary Club Roof Cap
        drawBox(bx0, bx1, by0, by1, 0.16, 1.36, {
          top: shadeHex(model.busStripeHex, 0.05),
          front: model.busBodyHex,
          side: shadeHex(model.busBodyHex, -0.22),
          stroke: 'rgba(15,20,32,0.42)',
        });

        // Rooftop AC Pods in Club Primary
        for (const acX of [bx0 + 1.3, bx0 + 3.1]) {
          drawBox(acX, acX + 0.9, by0 + 0.24, by1 - 0.24, 1.36, 1.48, {
            top: shadeHex(model.busBodyHex, 0.14),
            front: model.busBodyHex,
            side: shadeHex(model.busBodyHex, -0.18),
          });
        }

        // Bold Dynamic Club Secondary Livery Stripe across Coach Side
        fillPoly(
          ctx,
          [
            project(bx0 + 0.08, by1 + 0.015, 0.34),
            project(bx1 - 0.08, by1 + 0.015, 0.44),
            project(bx1 - 0.08, by1 + 0.015, 0.66),
            project(bx0 + 0.08, by1 + 0.015, 0.52),
          ],
          model.busStripeHex
        );

        // Tinted Panoramic Passenger Window Ribbon
        fillPoly(
          ctx,
          [
            project(bx0 + 0.24, by1 + 0.02, 0.72),
            project(bx1 - 0.18, by1 + 0.02, 0.72),
            project(bx1 - 0.18, by1 + 0.02, 1.18),
            project(bx0 + 0.24, by1 + 0.02, 1.18),
          ],
          '#111827',
          rgba(model.busStripeHex, 0.65),
          0.9
        );

        // Front Windshield & Warm Headlights on Right/Front Nose (bx1)
        if (cam !== 'facade') {
          fillPoly(
            ctx,
            [
              project(bx1 + 0.02, by0 + 0.12, 0.68),
              project(bx1 + 0.02, by1 - 0.12, 0.68),
              project(bx1 + 0.02, by1 - 0.12, 1.2),
              project(bx1 + 0.02, by0 + 0.12, 1.2),
            ],
            '#1E293B'
          );
          for (const hy of [by0 + 0.22, by1 - 0.22]) {
            const hl = project(bx1 + 0.03, hy, 0.32);
            ctx.fillStyle = '#FEF08A';
            ctx.beginPath();
            ctx.arc(hl.x, hl.y, Math.max(1.6, scaleBase * 0.1), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Club Short Label / Wordmark on Team Bus Side
        const busLabelLeft = project(bx0 + 0.6, by1 + 0.03, 0.46);
        const busLabelRight = project(bx1 - 0.6, by1 + 0.03, 0.54);
        const busMidX = (busLabelLeft.x + busLabelRight.x) * 0.5;
        const busMidY = (busLabelLeft.y + busLabelRight.y) * 0.5;
        const busAng = Math.atan2(busLabelRight.y - busLabelLeft.y, busLabelRight.x - busLabelLeft.x);
        ctx.save();
        ctx.translate(busMidX, busMidY);
        ctx.rotate(busAng);
        const busFontPx = Math.max(7, Math.min(10, Math.round(scaleBase * 0.31)));
        ctx.font = `800 ${busFontPx}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle =
          model.busStripeHex.toUpperCase() === '#FFFFFF' || model.busStripeHex.toUpperCase() === '#F8FAFC'
            ? model.busBodyHex
            : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shortLabel.slice(0, 14).toUpperCase(), 0, 0);
        ctx.restore();

        // Coach Alloy Wheels & Tires
        for (const wx of [bx0 + 1.05, bx1 - 1.05]) {
          const wPt = project(wx, by1 + 0.035, 0.2);
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.arc(wPt.x, wPt.y, Math.max(3.0, scaleBase * 0.2), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#CBD5E1';
          ctx.beginPath();
          ctx.arc(wPt.x, wPt.y, Math.max(1.4, scaleBase * 0.09), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const carPositions = [3.2, 6.8];
      for (let c = 0; c < Math.min(carPositions.length, model.vehicleCount); c++) {
        const cx0 = carPositions[c];
        const cx1 = cx0 + 2.1;
        const cy0 = 8.45;
        const cy1 = 9.35;
        const bodyHex = c === 0 ? '#1E2536' : '#CBD5E1';
        drawBox(cx0, cx1, cy0, cy1, 0.1, 0.48, {
          top: shadeHex(bodyHex, 0.12),
          front: bodyHex,
          side: shadeHex(bodyHex, -0.18),
        });
        drawBox(cx0 + 0.45, cx1 - 0.4, cy0 + 0.08, cy1 - 0.08, 0.48, 0.78, {
          top: shadeHex(bodyHex, 0.18),
          front: '#334155',
          side: '#1E293B',
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

  const isPublic = Boolean(club?.isPublic);
  const netPositive = projNet >= 0;

  return (
    <section
      aria-label="3D Club Office Exterior"
      className="relative w-full rounded-[26px] overflow-hidden bg-[#182032] shadow-[0_14px_36px_rgba(15,23,42,0.12)] border border-black/[0.06] select-none"
    >
      {/* Responsive Live 3D Exterior Canvas */}
      <div className="relative w-full h-[336px] sm:h-[365px] lg:h-[338px] xl:h-[346px]">
        <canvas
          ref={canvasRef}
          data-testid="club-office-canvas"
          className="block w-full h-full"
        />
      </div>

      {/* Top Floating Overlay Bar (Zero backdrop-blur over live canvas) */}
      <div className="absolute inset-x-0 top-0 z-20 p-2.5 sm:p-3.5 flex items-start justify-between gap-2.5 pointer-events-none">
        {/* Top-Left Club Headquarters Identity Card */}
        <div className="pointer-events-auto bg-white/95 rounded-[18px] sm:rounded-[22px] px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.14)] border border-black/[0.05] min-w-0 flex-1 max-w-[54%] sm:max-w-[300px]">
          <button
            type="button"
            onClick={onOpenClubProfile}
            className="flex items-center gap-2 min-w-0 w-full text-left hover:opacity-80 transition cursor-pointer"
            title="Open Club Profile & Identity"
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
            <div className="min-w-0 flex-1 overflow-hidden">
              <h2 className="text-[12px] sm:text-[15px] font-bold text-[#14161D] leading-tight truncate">
                {clubFullName} HQ
              </h2>
              <p className="text-[10px] sm:text-[11px] font-medium text-[#6E7381] truncate">
                {officeModel.tierLabel} · {officeModel.stories}F Exterior
              </p>
            </div>
          </button>

          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-black/[0.06] flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenLedger}
              className="py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-[10px] sm:text-[11px] font-semibold transition cursor-pointer whitespace-nowrap touch-manipulation"
            >
              Financial Ledger
            </button>
            <button
              type="button"
              onClick={onOpenIPO}
              className="hidden sm:inline-flex py-1.5 px-2.5 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-[10px] sm:text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
            >
              {isPublic ? 'PLC Shares' : 'Valuation'}
            </button>
          </div>
        </div>

        {/* Top-Right Valuation & Ownership Card */}
        <button
          type="button"
          onClick={onOpenIPO}
          className="pointer-events-auto bg-white/95 hover:bg-white rounded-[18px] sm:rounded-[22px] px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.14)] border border-black/[0.05] text-left transition cursor-pointer shrink-0 touch-manipulation"
          title="Inspect Club Valuation & Ownership"
        >
          <div className="flex items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-medium text-[#525866]">
            <span>Club Valuation</span>
            <span className="font-semibold text-[#14161D]">
              {isPublic ? 'Listed PLC' : 'Private'}
            </span>
          </div>
          <div className="mt-0.5 sm:mt-1 text-[15px] sm:text-[19px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight">
            {formatMoney(officeModel.trueValuation, country)}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-medium text-[#525866] tabular-nums whitespace-nowrap">
            <span>Proj. Net </span>
            <span className={netPositive ? 'text-[#15803D] font-semibold' : 'text-[#C83232] font-semibold'}>
              {netPositive ? '+' : ''}
              {formatMoney(projNet, country)}
            </span>
          </div>
        </button>
      </div>

      {/* Bottom Floating Camera Switcher & Commercial Summary */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 sm:p-3.5 flex items-end justify-between gap-1.5 sm:gap-2 pointer-events-none">
        <div
          role="group"
          aria-label="Office Exterior Camera Angle"
          className="pointer-events-auto bg-white/95 rounded-[18px] sm:rounded-[20px] p-1 sm:p-1.5 sm:pl-3 shadow-[0_10px_26px_rgba(15,23,42,0.14)] border border-black/[0.05] flex items-center gap-1 sm:gap-2 shrink-0"
        >
          <span className="hidden sm:inline text-[11px] font-semibold text-[#14161D] pr-0.5">
            Camera
          </span>

          <button
            type="button"
            onClick={() => setCamera('isometric')}
            aria-label="Isometric office view"
            aria-pressed={camera === 'isometric'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'isometric'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <polygon points="20,4 33,10 33,19 20,23 7,19 7,10" fill="#EAE6DC" stroke="#FFFFFF" strokeWidth="1.1" />
              <line x1="20" y1="12" x2="20" y2="23" stroke="#1E2538" strokeWidth="1.1" />
              <line x1="7" y1="10" x2="20" y2="12" stroke="#1E2538" strokeWidth="1" />
              <line x1="33" y1="10" x2="20" y2="12" stroke="#1E2538" strokeWidth="1" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCamera('facade')}
            aria-label="Front facade view"
            aria-pressed={camera === 'facade'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'facade'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <rect x="8" y="6" width="24" height="15" rx="1.5" fill="#EAE6DC" stroke="#FFFFFF" strokeWidth="1.1" />
              <rect x="16" y="14" width="8" height="7" fill="#D98A46" />
              <line x1="5" y1="21" x2="35" y2="21" stroke="#FFFFFF" strokeWidth="1.2" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCamera('aerial')}
            aria-label="Aerial campus view"
            aria-pressed={camera === 'aerial'}
            className={`w-10 h-8 sm:w-12 sm:h-8 rounded-[10px] sm:rounded-[11px] bg-[#1E2538] flex items-center justify-center transition cursor-pointer touch-manipulation ${
              camera === 'aerial'
                ? 'ring-2 ring-[#18191F] shadow-sm'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 40 26" className="w-8 h-5 sm:w-9 sm:h-6">
              <polygon points="20,3 36,13 20,23 4,13" fill="#5E8B61" stroke="#FFFFFF" strokeWidth="1.1" />
              <polygon points="20,7 29,12.5 20,18 11,12.5" fill="#EAE6DC" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSponsors}
          aria-label="Open Commercial Partnerships"
          className="pointer-events-auto bg-white/95 hover:bg-white rounded-[16px] sm:rounded-[18px] px-3 sm:px-4 py-1.5 sm:py-2 shadow-[0_10px_26px_rgba(15,23,42,0.14)] border border-black/[0.05] flex items-center gap-3 sm:gap-4 min-w-0 text-left transition cursor-pointer touch-manipulation"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
              Est. Revenue
            </span>
            <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] tabular-nums leading-tight whitespace-nowrap">
              {formatMoney(estRevenue, country)}
            </span>
          </div>

          <div className="h-5 w-px bg-black/[0.08] shrink-0" aria-hidden="true" />

          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-medium text-[#525866] whitespace-nowrap">
              Supporters
            </span>
            <span className="text-[11px] sm:text-[13px] font-bold text-[#14161D] tabular-nums leading-tight whitespace-nowrap">
              {formatNum(fanBase)}
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};
