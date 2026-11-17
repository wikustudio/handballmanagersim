export type BoardroomCameraMode = 'isometric' | 'topdown' | 'headtable';

export type BoardMood = 'confident' | 'steady' | 'tense';

export interface BuildBoardroomParams {
  tier?: number;
  isPublic?: boolean;
  impactScore?: number;
  reputation?: number;
  mediaPressure?: number;
  signedSponsorCount?: number;
  trophyTotal?: number;
  completedGoals?: number;
  totalGoals?: number;
  clubColor?: string;
  clubColor2?: string;
}

export interface BoardroomArchitectureModel {
  directorCount: number;
  boardMood: BoardMood;
  moodLabel: string;
  moodAccentHex: string;
  mediaStatusLabel: string;
  mediaAlertHex: string;
  trophyDisplayCount: number;
  dossierCount: number;
  hasShareholderWing: boolean;
  tableTopHex: string;
  tableTrimHex: string;
  chairHex: string;
  primaryHex: string;
  secondaryHex: string;
}

function sanitizeHex(input: string | undefined, fallback: string): string {
  if (!input || typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return fallback;
}

function isVeryLightHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.86;
}

export function buildBoardroomArchitectureModel(
  params: BuildBoardroomParams
): BoardroomArchitectureModel {
  const tier = Math.max(1, Math.min(5, Math.round(params.tier ?? 1)));
  const isPublic = Boolean(params.isPublic);
  const impactScore = Math.max(0, Math.min(100, Math.round(params.impactScore ?? 50)));
  const mediaPressure = Math.max(0, Math.min(100, Math.round(params.mediaPressure ?? 20)));
  const sponsorCount = Math.max(0, Math.min(3, Math.round(params.signedSponsorCount ?? 0)));
  const trophyTotal = Math.max(0, Math.round(params.trophyTotal ?? 0));

  // Seat count scales realistically: base 4 directors + top-tier / PLC / sponsor delegates (4 to 8 around the table)
  const rawDirectors = 4 + (tier === 1 ? 2 : tier <= 2 ? 1 : 0) + (isPublic ? 1 : 0) + (sponsorCount >= 2 ? 1 : 0);
  const directorCount = Math.max(4, Math.min(8, rawDirectors));

  const boardMood: BoardMood =
    impactScore >= 72 ? 'confident' : impactScore >= 45 ? 'steady' : 'tense';
  const moodLabel =
    boardMood === 'confident'
      ? 'Aligned & Confident'
      : boardMood === 'steady'
      ? 'Constructive Review'
      : 'Critical Scrutiny';
  const moodAccentHex =
    boardMood === 'confident' ? '#22C55E' : boardMood === 'steady' ? '#F59E0B' : '#EF4444';

  const mediaStatusLabel =
    mediaPressure >= 68 ? 'Hot Seat' : mediaPressure >= 45 ? 'Elevated' : 'Calm';
  const mediaAlertHex =
    mediaPressure >= 68 ? '#EF4444' : mediaPressure >= 45 ? '#F59E0B' : '#38BDF8';

  const trophyDisplayCount = Math.min(3, trophyTotal > 0 ? Math.max(1, Math.ceil(trophyTotal / 3)) : 0);
  const dossierCount = Math.max(3, Math.min(directorCount + 1, params.totalGoals ? params.totalGoals + 2 : 5));

  const rawPrimary = sanitizeHex(params.clubColor, '#DF642A');
  const rawSecondary = sanitizeHex(params.clubColor2, '#1E2638');
  const primaryHex = isVeryLightHex(rawPrimary)
    ? isVeryLightHex(rawSecondary)
      ? '#DF642A'
      : rawSecondary
    : rawPrimary;
  const secondaryHex =
    rawSecondary.toLowerCase() === primaryHex.toLowerCase() || isVeryLightHex(rawSecondary)
      ? '#1E2638'
      : rawSecondary;

  return {
    directorCount,
    boardMood,
    moodLabel,
    moodAccentHex,
    mediaStatusLabel,
    mediaAlertHex,
    trophyDisplayCount,
    dossierCount,
    hasShareholderWing: isPublic,
    tableTopHex: tier === 1 || isPublic ? '#8C5832' : '#A67247',
    tableTrimHex: '#59341C',
    chairHex: '#252B3B',
    primaryHex,
    secondaryHex,
  };
}
