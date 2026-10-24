import { ALL_CLUBS as RAW_CLUBS, Club } from './clubsData';
import { getLocalAssetPath, hasVerifiedLocalAsset } from './teams';
import { REAL_WORLD_LOGOS } from './realWorldLogos';

export interface HandballClub extends Club {
  logo?: string;
  fallbackLogo?: string;
  context?: string;
  historicContext?: string;
}

// Populates INITIAL_CLUBS with the active logo path and cached fallbackLogo URL for each club
export const INITIAL_CLUBS: HandballClub[] = (RAW_CLUBS as HandballClub[]).map((c) => {
  const officialLogo = REAL_WORLD_LOGOS[c.id];
  const hasLocal = hasVerifiedLocalAsset(c.id);
  const localAsset = getLocalAssetPath(c.id);

  let primaryLogo: string;
  let fallback: string;

  if (hasLocal) {
    primaryLogo = localAsset;
    fallback =
      officialLogo && officialLogo.startsWith('http')
        ? `https://images.weserv.nl/?url=${encodeURIComponent(officialLogo.replace(/^https?:\/\//, ''))}&w=160&output=png`
        : officialLogo || localAsset;
  } else if (officialLogo && officialLogo.startsWith('http')) {
    primaryLogo = officialLogo;
    fallback = `https://images.weserv.nl/?url=${encodeURIComponent(officialLogo.replace(/^https?:\/\//, ''))}&w=160&output=png`;
  } else {
    primaryLogo = c.logo || localAsset;
    fallback = c.fallbackLogo || localAsset;
  }

  return {
    ...c,
    logo: primaryLogo,
    fallbackLogo: fallback,
  };
});

export const ALL_HANDBALL_CLUBS = INITIAL_CLUBS;
export { INITIAL_CLUBS as ALL_CLUBS };

export const COUNTRY_META: Record<string, { name: string; flag: string; leagueName: string }> = {
  GER: { name: 'Germany', flag: '🇩🇪', leagueName: 'Handball-Bundesliga (HBL)' },
  DEN: { name: 'Denmark', flag: '🇩🇰', leagueName: 'Herrehåndboldligaen' },
  FRA: { name: 'France', flag: '🇫🇷', leagueName: 'LNH Starligue' },
  ESP: { name: 'Spain', flag: '🇪🇸', leagueName: 'Liga Plenitude ASOBAL' },
  SWE: { name: 'Sweden', flag: '🇸🇪', leagueName: 'Handbollsligan' },
  CRO: { name: 'Croatia', flag: '🇭🇷', leagueName: 'Premijer Liga' },
  POR: { name: 'Portugal', flag: '🇵🇹', leagueName: 'Campeonato Andebol 1' },
  NOR: { name: 'Norway', flag: '🇳🇴', leagueName: 'REMA 1000-ligaen' },
  HUN: { name: 'Hungary', flag: '🇭🇺', leagueName: 'K&H Férfi Kézilabda Liga' },
  ISL: { name: 'Iceland', flag: '🇮🇸', leagueName: 'Olís deild karla' },
  POL: { name: 'Poland', flag: '🇵🇱', leagueName: 'ORLEN Superliga' },
  AUT: { name: 'Austria', flag: '🇦🇹', leagueName: 'HLA Meisterliga' },
  SUI: { name: 'Switzerland', flag: '🇨🇭', leagueName: 'Quickline Handball League' },
};

export const TIER_NAMES: Record<number, string> = {
  1: 'Tier 1 · Top Flight',
  2: 'Tier 2 · Second Division',
  3: 'Tier 3 · Regional / Division 3',
  4: 'Tier 4 · Division 4',
  5: 'Tier 5 · Division 5',
  6: 'Tier 6 · Division 6',
};

// Formats hex string safely
export function normalizeHex(color?: string, fallback = '3b82f6'): string {
  if (!color) return `#${fallback}`;
  const clean = color.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(clean) || /^[0-9A-Fa-f]{3}$/.test(clean)) {
    return `#${clean}`;
  }
  return `#${fallback}`;
}

// Returns a human-friendly color description for UI presentation
export function getFriendlyColorName(hexInput?: string): string {
  if (!hexInput) return 'Club Color';
  const clean = hexInput.trim().replace(/^#/, '').toLowerCase();
  
  const knownMap: Record<string, string> = {
    'a50044': 'Blaugrana Garnet',
    '004d98': 'Blaugrana Blue',
    'e30613': 'Crimson Red',
    'ff0000': 'Pure Red',
    'cc0000': 'Ruby Red',
    '009036': 'Emerald Green',
    '008000': 'Classic Green',
    '002855': 'Navy Blue',
    '003366': 'Deep Navy',
    '000000': 'Pitch Black',
    'ffffff': 'Pure White',
    'ffff00': 'Bright Yellow',
    'f7c600': 'Gold / Amber',
    'ffcc00': 'Gold',
    '3b82f6': 'Royal Blue',
    '1e3a8a': 'Dark Navy',
    '990000': 'Burgundy',
    '660099': 'Deep Purple',
    'ff6600': 'Vibrant Orange',
    '00a3e0': 'Sky Blue',
    '00205b': 'Midnight Blue',
    '00529b': 'Cobalt Blue',
  };

  if (knownMap[clean]) return knownMap[clean];
  if (!/^[0-9a-f]{6}$/.test(clean)) return `#${clean.toUpperCase()}`;

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  if (r > 240 && g > 240 && b > 240) return 'White';
  if (r < 30 && g < 30 && b < 30) return 'Black';
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
    if (r > 160) return 'Silver';
    if (r > 90) return 'Slate Grey';
    return 'Anthracite';
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const d = max - min;

  if (d === 0) h = 0;
  else if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  if (h >= 345 || h < 15) return r > 180 ? 'Red' : 'Deep Red';
  if (h >= 15 && h < 45) return 'Orange';
  if (h >= 45 && h < 70) return 'Yellow / Gold';
  if (h >= 70 && h < 165) return g > 150 ? 'Green' : 'Forest Green';
  if (h >= 165 && h < 200) return 'Teal / Cyan';
  if (h >= 200 && h < 260) {
    if (b < 100) return 'Navy Blue';
    if (b > 180 && r < 100 && g > 100) return 'Sky Blue';
    return 'Royal Blue';
  }
  if (h >= 260 && h < 315) return 'Purple';
  return 'Garnet / Magenta';
}

// Generates monogram/initials from club name (e.g., "SC Magdeburg" -> "SCM", "THW Kiel" -> "THW")
export function getClubInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 3).toUpperCase();
  }
  if (parts.length === 2) {
    if (parts[0].length <= 3 && /^[A-Z0-9.]+$/i.test(parts[0])) {
      return `${parts[0].replace('.', '')}${parts[1][0]}`.toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts.slice(0, 3).map(p => p[0]).join('').toUpperCase();
}

export type CrestStyle = 'shield' | 'circle' | 'modern' | 'diamond' | 'classic';

// Deterministic style selection based on club id
export function getCrestStyleForId(id: number): CrestStyle {
  const styles: CrestStyle[] = ['shield', 'circle', 'modern', 'diamond', 'classic'];
  return styles[id % styles.length];
}

// Generate guaranteed pristine vector SVG badge
export function generateClubLogoSvg(club: HandballClub, style?: CrestStyle): string {
  const c1 = normalizeHex(club.color, '1e3a8a');
  const c2 = normalizeHex(club.color2, club.color ? (club.color.toLowerCase() === 'ffffff' ? '000000' : 'ffffff') : 'ffffff');
  const chosenStyle = style || getCrestStyleForId(club.id);
  const initials = getClubInitials(club.name);

  // High contrast text color against primary
  const isLight = (hex: string) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  };

  const textFill = isLight(c1) ? (isLight(c2) ? '#0f172a' : c2) : (c2.toLowerCase() === '#ffffff' ? '#ffffff' : (isLight(c2) ? c2 : '#ffffff'));

  if (chosenStyle === 'circle') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad-${club.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c1}" stop-opacity="0.85" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#grad-${club.id})" stroke="${c2}" stroke-width="5" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="${c2}" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.6" />
      <!-- Handball seam arc -->
      <path d="M 25 35 Q 50 45 75 35" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.4" />
      <path d="M 25 65 Q 50 55 75 65" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.4" />
      <text x="50" y="56" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${initials.length > 3 ? '18' : '22'}" fill="${textFill}" text-anchor="middle" letter-spacing="0.5">${initials}</text>
      <circle cx="50" cy="74" r="3" fill="${c2}" />
    </svg>`;
  }

  if (chosenStyle === 'diamond') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad-${club.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c1}" stop-opacity="0.9" />
        </linearGradient>
      </defs>
      <polygon points="50,4 94,50 50,96 6,50" fill="url(#grad-${club.id})" stroke="${c2}" stroke-width="4.5" stroke-linejoin="round" />
      <polygon points="50,14 84,50 50,86 16,50" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.5" />
      <line x1="28" y1="50" x2="72" y2="50" stroke="${c2}" stroke-width="2" opacity="0.4" />
      <text x="50" y="56" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${initials.length > 3 ? '17' : '21'}" fill="${textFill}" text-anchor="middle" letter-spacing="1">${initials}</text>
    </svg>`;
  }

  if (chosenStyle === 'modern') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad-${club.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c1}" stop-opacity="0.9" />
        </linearGradient>
      </defs>
      <!-- Modern rounded hexagonal badge -->
      <path d="M 50 6 L 90 22 L 90 68 L 50 94 L 10 68 L 10 22 Z" fill="url(#grad-${club.id})" stroke="${c2}" stroke-width="4" stroke-linejoin="round" />
      <path d="M 50 16 L 82 29 L 82 64 L 50 84 L 18 64 L 18 29 Z" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.4" />
      <text x="50" y="56" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${initials.length > 3 ? '18' : '22'}" fill="${textFill}" text-anchor="middle" letter-spacing="0.5">${initials}</text>
      <circle cx="50" cy="72" r="3" fill="${c2}" />
    </svg>`;
  }

  if (chosenStyle === 'classic') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad-${club.id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c1}" stop-opacity="0.85" />
        </linearGradient>
      </defs>
      <path d="M 12 12 Q 50 20 88 12 L 88 56 Q 88 88 50 96 Q 12 88 12 56 Z" fill="url(#grad-${club.id})" stroke="${c2}" stroke-width="4.5" stroke-linejoin="round" />
      <!-- Vertical club stripe -->
      <path d="M 45 18 L 55 18 L 55 94 L 45 94 Z" fill="${c2}" opacity="0.25" />
      <text x="50" y="55" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${initials.length > 3 ? '18' : '22'}" fill="${textFill}" text-anchor="middle" letter-spacing="1">${initials}</text>
      <path d="M 32 68 Q 50 74 68 68" fill="none" stroke="${c2}" stroke-width="2" opacity="0.5" />
    </svg>`;
  }

  // Default: Shield
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad-${club.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c1}" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <path d="M 10 10 H 90 V 52 C 90 75 50 94 50 94 C 50 94 10 75 10 52 Z" fill="url(#grad-${club.id})" stroke="${c2}" stroke-width="4" stroke-linejoin="round" />
    <path d="M 18 18 H 82 V 50 C 82 68 50 84 50 84 C 50 84 18 68 18 50 Z" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.4" />
    <!-- Handball motif in badge -->
    <circle cx="50" cy="34" r="8" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.4" />
    <text x="50" y="62" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${initials.length > 3 ? '18' : '22'}" fill="${textFill}" text-anchor="middle" letter-spacing="1">${initials}</text>
  </svg>`;
}

// Convert SVG to Data URL for direct embed into JSON if desired
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
