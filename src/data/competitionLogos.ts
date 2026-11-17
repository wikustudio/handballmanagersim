import { isAnyModActive } from '../utils/modManager';

export type CompetitionLogoKind =
  | 'league'
  | 'cl'
  | 'el'
  | 'ecl'
  | 'cwc'
  | 'dfb'
  | 'nat_cup'
  | 'sc'
  | 'supercup'
  | 'euro_supercup'
  | 'reg'
  | 'reg_cup'
  | 'lower';

export interface CompetitionLogoOptions {
  country?: string;
  tier?: number;
  isModActive?: boolean;
}

const normalizeCountryCode = (raw?: string): string => {
  if (!raw) return 'GER';
  const c = String(raw).trim().toUpperCase();
  if (c === 'DE' || c === 'GERMANY') return 'GER';
  if (c === 'FR' || c === 'FRANCE') return 'FRA';
  if (c === 'ES' || c === 'SPAIN') return 'ESP';
  if (c === 'DK' || c === 'DENMARK') return 'DEN';
  if (c === 'HU' || c === 'HUNGARY') return 'HUN';
  if (c === 'PL' || c === 'POLAND') return 'POL';
  if (c === 'PT' || c === 'PORTUGAL') return 'POR';
  if (c === 'SE' || c === 'SWEDEN') return 'SWE';
  if (c === 'NO' || c === 'NORWAY') return 'NOR';
  if (c === 'CH' || c === 'SWITZERLAND') return 'SUI';
  if (c === 'AT' || c === 'AUSTRIA') return 'AUT';
  if (c === 'HR' || c === 'CROATIA') return 'CRO';
  if (c === 'SI' || c === 'SLOVENIA') return 'SLO';
  if (c === 'IS' || c === 'ICELAND') return 'ISL';
  if (c === 'RO' || c === 'ROMANIA') return 'ROU';
  if (c === 'MK' || c === 'NORTH MACEDONIA') return 'MKD';
  if (c === 'IT' || c === 'ITALY') return 'ITA';
  if (c === 'GB' || c === 'UK' || c === 'ENGLAND') return 'ENG';
  return c;
};

const svgToDataUri = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

interface Tier1LeagueTheme {
  primary: string;
  secondary: string;
  accent: string;
  textColor: string;
  code: string;
  sub: string;
}

const TIER1_LEAGUE_THEMES: Record<string, Tier1LeagueTheme> = {
  GER: { primary: '#155A9C', secondary: '#111827', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'HBL', sub: 'BUNDESLIGA' },
  FRA: { primary: '#0F2557', secondary: '#1D4ED8', accent: '#FBBF24', textColor: '#FFFFFF', code: 'LNH', sub: 'STARLIGUE' },
  ESP: { primary: '#1E3A8A', secondary: '#DC2626', accent: '#FACC15', textColor: '#FFFFFF', code: 'ASOBAL', sub: 'LIGA' },
  DEN: { primary: '#C8102E', secondary: '#880D1E', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'DHF', sub: 'HERRELIGAEN' },
  HUN: { primary: '#C8102E', secondary: '#15803D', accent: '#FBBF24', textColor: '#FFFFFF', code: 'NB I', sub: 'MKSZ' },
  POL: { primary: '#DC143C', secondary: '#991B1B', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'ORLEN', sub: 'SUPERLIGA' },
  POR: { primary: '#046A38', secondary: '#DA291C', accent: '#FACC15', textColor: '#FFFFFF', code: 'FPA', sub: 'ANDEBOL 1' },
  SWE: { primary: '#005293', secondary: '#003865', accent: '#FECB00', textColor: '#FECB00', code: 'SHL', sub: 'SVERIGE' },
  NOR: { primary: '#003087', secondary: '#DA291C', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'REMA', sub: 'LIGAEN' },
  SUI: { primary: '#D52B1E', secondary: '#991B1B', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'QHL', sub: 'SUISSE' },
  CRO: { primary: '#1E3A8A', secondary: '#DC2626', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'HRS', sub: 'PREMIJER' },
  SLO: { primary: '#003893', secondary: '#059669', accent: '#38BDF8', textColor: '#FFFFFF', code: 'NLB', sub: 'SLOVENIJA' },
  AUT: { primary: '#ED2939', secondary: '#111827', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'HLA', sub: 'MEISTER' },
  ISL: { primary: '#02529C', secondary: '#DC1E35', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'OLÍS', sub: 'DEILDIN' },
  ROU: { primary: '#002B7F', secondary: '#CE1126', accent: '#FCD116', textColor: '#FCD116', code: 'FRH', sub: 'ZIMBRILOR' },
  MKD: { primary: '#D20000', secondary: '#991B1B', accent: '#FACC15', textColor: '#FACC15', code: 'RFM', sub: 'SUPERLIGA' },
  ITA: { primary: '#0066CC', secondary: '#003366', accent: '#FBBF24', textColor: '#FFFFFF', code: 'FIGH', sub: 'SERIE A' },
  ENG: { primary: '#1E293B', secondary: '#CF142B', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'EHA', sub: 'PREMIER' },
  USA: { primary: '#0A3161', secondary: '#B31942', accent: '#FFFFFF', textColor: '#FFFFFF', code: 'USATH', sub: 'LEAGUE' },
  ECU: { primary: '#034EA2', secondary: '#ED1C24', accent: '#FFD100', textColor: '#FFD100', code: 'FEH', sub: 'ECUADOR' },
};

/**
 * Official real-world competition asset paths in /public/assets/competitions/
 * used when Mod is active.
 */
const OFFICIAL_TIER1_LEAGUE_ASSETS: Record<string, string> = {
  GER: '/assets/competitions/ger_t1.svg',
  FRA: '/assets/competitions/fra_t1.png',
  ESP: '/assets/competitions/esp_t1.svg',
  DEN: '/assets/competitions/den_t1.svg',
  HUN: '/assets/competitions/hun_t1.svg',
  POL: '/assets/competitions/pol_t1.svg',
  POR: '/assets/competitions/por_t1.jpg',
  SWE: '/assets/competitions/swe_t1.svg',
  SUI: '/assets/competitions/sui_t1.svg',
  AUT: '/assets/competitions/aut_t1.svg',
  CRO: '/assets/competitions/cro_t1.svg',
  ISL: '/assets/competitions/isl_t1.svg',
  ROU: '/assets/competitions/rou_t1.svg',
};

const OFFICIAL_FEDERATION_OR_CUP_ASSETS: Record<string, string> = {
  GER: '/assets/competitions/ger_cup_square.png',
  FRA: '/assets/competitions/fra_cup.svg',
  ESP: '/assets/competitions/esp_rfebm.svg',
  DEN: '/assets/competitions/den_t1.svg',
  HUN: '/assets/competitions/hun_t1.svg',
  POL: '/assets/competitions/pol_t1.svg',
  SWE: '/assets/competitions/swe_t1.svg',
  SUI: '/assets/competitions/sui_t1.svg',
  AUT: '/assets/competitions/aut_t1.svg',
  CRO: '/assets/competitions/cro_t1.svg',
  ISL: '/assets/competitions/isl_t1.svg',
  ROU: '/assets/competitions/rou_t1.svg',
};

const OFFICIAL_SUPERCUP_ASSETS: Record<string, string> = {
  GER: '/assets/competitions/ger_supercup.svg',
  FRA: '/assets/competitions/fra_supercup.svg',
  ESP: '/assets/competitions/esp_rfebm.svg',
  DEN: '/assets/competitions/den_t1.svg',
  HUN: '/assets/competitions/hun_t1.svg',
  POL: '/assets/competitions/pol_t1.svg',
  SWE: '/assets/competitions/swe_t1.svg',
  SUI: '/assets/competitions/sui_t1.svg',
  AUT: '/assets/competitions/aut_t1.svg',
  CRO: '/assets/competitions/cro_t1.svg',
  ISL: '/assets/competitions/isl_t1.svg',
  ROU: '/assets/competitions/rou_t1.svg',
};

/**
 * Returns the official asset URL if available when Mod is active, or null if a
 * procedural SVG fallback should be used.
 */
export function getOfficialCompetitionAssetPath(
  kind: CompetitionLogoKind | string,
  options: CompetitionLogoOptions = {}
): string | null {
  const modActive = options.isModActive !== undefined ? options.isModActive : isAnyModActive();
  if (!modActive) return null;

  const country = normalizeCountryCode(options.country || 'GER');
  const tier = Math.max(1, options.tier || (kind === 'lower' ? 2 : 1));

  if (kind === 'cl') return '/assets/competitions/ehf_cl.svg';
  if (kind === 'el') return '/assets/competitions/ehf_el.svg';
  if (kind === 'ecl') return '/assets/competitions/ehf_ec.png';
  if (kind === 'euro_supercup') return '/assets/competitions/ehf_logo.svg';
  if (kind === 'cwc') return '/assets/competitions/ihf_super_globe.svg';

  if (kind === 'dfb' || kind === 'nat_cup') {
    return OFFICIAL_FEDERATION_OR_CUP_ASSETS[country] || null;
  }

  if (kind === 'sc' || kind === 'supercup') {
    return OFFICIAL_SUPERCUP_ASSETS[country] || null;
  }

  if (kind === 'reg' || kind === 'reg_cup') {
    if (country === 'GER') return '/assets/competitions/ger_dhb.svg';
    return OFFICIAL_FEDERATION_OR_CUP_ASSETS[country] || null;
  }

  // League / Lower divisions
  if (country === 'GER') {
    if (tier === 1 && kind !== 'lower') return '/assets/competitions/ger_t1.svg';
    if (tier === 2) return '/assets/competitions/ger_t2.svg';
    if (tier === 3) return '/assets/competitions/ger_t3.svg';
    return '/assets/competitions/ger_dhb.svg';
  }

  if (country === 'FRA') {
    if (tier === 1 && kind !== 'lower') return '/assets/competitions/fra_t1.png';
    if (tier === 2) return '/assets/competitions/fra_t2.svg';
    return '/assets/competitions/fra_cup.svg';
  }

  if (country === 'ESP') {
    if (tier === 1 && kind !== 'lower') return '/assets/competitions/esp_t1.svg';
    return '/assets/competitions/esp_rfebm.svg';
  }

  if (tier === 1 && kind !== 'lower' && OFFICIAL_TIER1_LEAGUE_ASSETS[country]) {
    return OFFICIAL_TIER1_LEAGUE_ASSETS[country];
  }

  if (OFFICIAL_FEDERATION_OR_CUP_ASSETS[country]) {
    return OFFICIAL_FEDERATION_OR_CUP_ASSETS[country];
  }

  return null;
}

export function buildCompetitionSvgMarkup(
  kind: CompetitionLogoKind | string,
  options: CompetitionLogoOptions = {}
): string {
  const modActive = options.isModActive !== undefined ? options.isModActive : isAnyModActive();
  const country = normalizeCountryCode(options.country || 'GER');
  const tier = Math.max(1, options.tier || (kind === 'lower' ? 2 : 1));
  const theme = TIER1_LEAGUE_THEMES[country] || TIER1_LEAGUE_THEMES.GER;

  // Mod ON fallback for countries without a dedicated file in /assets/competitions/ (e.g. NOR, SLO, MKD, ITA, ENG, USA)
  if (modActive) {
    if (kind === 'dfb' || kind === 'nat_cup') {
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect x="4" y="4" width="56" height="56" rx="12" fill="${theme.primary}" stroke="#F59E0B" stroke-width="2.4"/>
  <path d="M24 14 H40 V22 C40 27 36.5 30.5 32 30.5 C27.5 30.5 24 27 24 22 V14 Z" fill="#FBBF24" stroke="#FFFFFF" stroke-width="1.4"/>
  <path d="M32 30.5 V35 M27 35.5 H37" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
  <rect x="10" y="39.5" width="44" height="9" rx="2.5" fill="#111827"/>
  <text x="32" y="46" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="6.4" fill="#FBBF24" text-anchor="middle" letter-spacing="0.5">${theme.code} CUP</text>
  <text x="32" y="54.5" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="4.4" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.6">NATIONAL CUP</text>
</svg>`;
    }

    if (kind === 'sc' || kind === 'supercup') {
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect x="4" y="4" width="56" height="56" rx="12" fill="#18191F" stroke="#F59E0B" stroke-width="2.4"/>
  <polygon points="32,11 38,23 35,34 29,34 26,23" fill="#F59E0B" stroke="#FEF08A" stroke-width="1.2"/>
  <rect x="10" y="39.5" width="44" height="9" rx="2.5" fill="${theme.primary}"/>
  <text x="32" y="46" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="6.6" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">${theme.code} SUPER</text>
  <text x="32" y="54.5" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="4.4" fill="#FDE68A" text-anchor="middle" letter-spacing="0.6">SUPERCUP</text>
</svg>`;
    }

    const badgeCode = tier === 1 && kind !== 'lower' ? theme.code : `${theme.code} ${tier}`;
    const badgeSub = tier === 1 && kind !== 'lower' ? theme.sub : `DIVISION ${tier}`;
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect x="4" y="4" width="56" height="56" rx="12" fill="${theme.primary}" stroke="${theme.accent}" stroke-width="2.4"/>
  <circle cx="32" cy="22.5" r="8" fill="#FFFFFF" stroke="${theme.secondary}" stroke-width="1.5"/>
  <path d="M28 18.5 C31 21 33 24 31 27.5 M36 18.5 C33 21 31 24 33 27.5 M25.5 22.5 H38.5" stroke="${theme.primary}" stroke-width="1.3" stroke-linecap="round"/>
  <rect x="10" y="38" width="44" height="10" rx="2.5" fill="#111827"/>
  <text x="32" y="45" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="7.2" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.6">${badgeCode}</text>
  <text x="32" y="54.5" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="4.5" fill="${theme.textColor}" text-anchor="middle" letter-spacing="0.5">${badgeSub}</text>
</svg>`;
  }

  // ============================================================================
  // MOD OFF: CLEAN GENERIC FALLBACK SHIELDS (No EHF/IHF/HBL/Real-World Trademarks)
  // ============================================================================
  if (kind === 'cl') {
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path d="M32 4 L56 12.5 V32 C56 46.8 45.8 56.5 32 60 C18.2 56.5 8 46.8 8 32 V12.5 Z" fill="#1E3A8A" stroke="#F59E0B" stroke-width="2.4"/>
  <polygon points="32,14 35.2,21.2 43,21.8 37,26.8 39,34.4 32,30.2 25,34.4 27,26.8 21,21.8 28.8,21.2" fill="#FBBF24"/>
  <rect x="13" y="40" width="38" height="8.5" rx="2.5" fill="#0F172A"/>
  <text x="32" y="46.1" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="6.4" fill="#FBBF24" text-anchor="middle" letter-spacing="0.6">CHAMPIONS</text>
</svg>`;
  }

  if (kind === 'el' || kind === 'ecl') {
    const col = kind === 'el' ? '#D97706' : '#0284C7';
    const label = kind === 'el' ? 'EURO LG' : 'EURO CUP';
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path d="M32 4 L56 12.5 V32 C56 46.8 45.8 56.5 32 60 C18.2 56.5 8 46.8 8 32 V12.5 Z" fill="#1E293B" stroke="${col}" stroke-width="2.4"/>
  <circle cx="32" cy="24" r="7.5" fill="${col}"/>
  <circle cx="32" cy="24" r="3.5" fill="#FFFFFF"/>
  <rect x="13" y="40" width="38" height="8.5" rx="2.5" fill="${col}"/>
  <text x="32" y="46.1" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="6.4" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.6">${label}</text>
</svg>`;
  }

  if (kind === 'cwc') {
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="27" fill="#1E293B" stroke="#F59E0B" stroke-width="2.4"/>
  <circle cx="32" cy="24" r="9" fill="none" stroke="#FBBF24" stroke-width="1.8"/>
  <line x1="23" y1="24" x2="41" y2="24" stroke="#FBBF24" stroke-width="1.4"/>
  <rect x="13" y="39.5" width="38" height="8.5" rx="2.5" fill="#F59E0B"/>
  <text x="32" y="45.6" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="6.4" fill="#0F172A" text-anchor="middle" letter-spacing="0.6">GLOBAL CUP</text>
</svg>`;
  }

  if (kind === 'dfb' || kind === 'nat_cup' || kind === 'sc' || kind === 'supercup' || kind === 'euro_supercup' || kind === 'reg' || kind === 'reg_cup') {
    const isSuper = kind === 'sc' || kind === 'supercup' || kind === 'euro_supercup';
    const isReg = kind === 'reg' || kind === 'reg_cup';
    const accent = isSuper ? '#F59E0B' : isReg ? '#10B981' : '#38BDF8';
    const label = isSuper ? 'SUPERCUP' : isReg ? 'REG. CUP' : 'NAT. CUP';
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path d="M32 4 L56 12.5 V32 C56 46.8 45.8 56.5 32 60 C18.2 56.5 8 46.8 8 32 V12.5 Z" fill="#334155" stroke="${accent}" stroke-width="2.4"/>
  <path d="M25 16 H39 V23 C39 27.5 36 30.5 32 30.5 C28 30.5 25 27.5 25 23 V16 Z" fill="${accent}"/>
  <rect x="13" y="40" width="38" height="8.5" rx="2.5" fill="#0F172A"/>
  <text x="32" y="46.1" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="6.4" fill="${accent}" text-anchor="middle" letter-spacing="0.6">${label}</text>
</svg>`;
  }

  // Generic Fallback League Shield (Mod OFF)
  const isT1 = tier === 1 && kind !== 'lower';
  const shieldFill = isT1 ? '#334155' : '#475569';
  const shieldStroke = isT1 ? '#F59E0B' : '#94A3B8';
  const badgeText = isT1 ? 'PRO DIV 1' : `DIVISION ${tier}`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path d="M32 4 L56 12.5 V32 C56 46.8 45.8 56.5 32 60 C18.2 56.5 8 46.8 8 32 V12.5 Z" fill="${shieldFill}" stroke="${shieldStroke}" stroke-width="2.4"/>
  <circle cx="32" cy="23.5" r="8" fill="${shieldStroke}"/>
  <text x="32" y="26.8" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="9" fill="#0F172A" text-anchor="middle">T${tier}</text>
  <rect x="12" y="40" width="40" height="8.5" rx="2.5" fill="#0F172A"/>
  <text x="32" y="46.1" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="6" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">${badgeText}</text>
</svg>`;
}

export function getCompetitionLogoDataUri(
  kind: CompetitionLogoKind | string,
  options: CompetitionLogoOptions = {}
): string {
  const officialPath = getOfficialCompetitionAssetPath(kind, options);
  if (officialPath) {
    return officialPath;
  }
  return svgToDataUri(buildCompetitionSvgMarkup(kind, options));
}

export function getLeagueLogoDataUri(
  country: string = 'GER',
  tier: number = 1,
  isModActive?: boolean
): string {
  return getCompetitionLogoDataUri('league', { country, tier, isModActive });
}
