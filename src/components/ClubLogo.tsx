
import React, { useState, useEffect, useMemo } from 'react';
import { getInitials, getMonogramHex, isReserveClub } from '../data/gameConstants';
import { TEAMS } from '../mod-data/teams';
import { REAL_CLUB_ALIASES, simplifyClubName } from '../engine/moddingEngine';
import {
  getClubLogoKey,
  getCachedLogo,
  isUrlLoadedInMemory,
  markUrlLoaded,
  setCachedWorkingUrl,
  cacheLogoBlob
} from '../utils/logoCache';

interface ModLogoEntry {
  logo?: string;
  fallbackLogo?: string;
}

// Pre-index mod logos by exact name, clean name, real aliases, and canonical IDs for instant O(1) fallback resolution
const modLogoMap = new Map<string, ModLogoEntry>();
const idToModEntry = new Map<number, ModLogoEntry>();

for (let i = 0; i < TEAMS.length; i++) {
  const t = TEAMS[i];
  if (t.name) {
    const entry: ModLogoEntry = { logo: t.logo, fallbackLogo: t.fallbackLogo };
    modLogoMap.set(t.name.toLowerCase().trim(), entry);
    
    const clean = t.name.replace(/\s+II$/, '').replace(/\s+\(?B\)?$/, '').replace(/\s+Castilla$/, '').replace(/\s+B$/, '').replace(/\s+2$/, '').trim();
    if (clean && !modLogoMap.has(clean.toLowerCase())) {
      modLogoMap.set(clean.toLowerCase(), entry);
    }
    const unaccented = t.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (!modLogoMap.has(unaccented)) {
      modLogoMap.set(unaccented, entry);
    }
    const unaccentedNoDe = unaccented.replace(/\bde\b\s*/g, '').replace(/\s+/g, ' ').trim();
    if (!modLogoMap.has(unaccentedNoDe)) {
      modLogoMap.set(unaccentedNoDe, entry);
    }
    const simp = simplifyClubName(t.name);
    if (simp && !modLogoMap.has(simp)) {
      modLogoMap.set(simp, entry);
    }
    const simpUnaccented = simplifyClubName(unaccented);
    if (simpUnaccented && !modLogoMap.has(simpUnaccented)) {
      modLogoMap.set(simpUnaccented, entry);
    }
  }
}

// Map canonical ALL_CLUBS IDs to their verified real-world TEAMS crest entries
for (const [alias, clubId] of Object.entries(REAL_CLUB_ALIASES)) {
  const lowerAlias = alias.toLowerCase().trim();
  const cleanAlias = lowerAlias.replace(/\s+ii$/, '').replace(/\s+\(?b\)?$/, '').replace(/\s+b$/, '').replace(/\s+2$/, '').trim();
  const team = TEAMS.find(t => 
    t.name.toLowerCase().trim() === lowerAlias ||
    simplifyClubName(t.name) === simplifyClubName(alias)
  ) || TEAMS.find(t =>
    t.name.toLowerCase().trim() === cleanAlias ||
    simplifyClubName(t.name) === simplifyClubName(cleanAlias)
  );
  if (team && !idToModEntry.has(clubId)) {
    idToModEntry.set(clubId, { logo: team.logo, fallbackLogo: team.fallbackLogo });
  }
}

// Map default unmodded aliases (e.g. "bavaria münchen" -> Bayern München logos, "kleeblatt fürth" -> Fürth)
for (const [alias, clubId] of Object.entries(REAL_CLUB_ALIASES)) {
  const entry = idToModEntry.get(clubId);
  if (entry) {
    const lowerAlias = alias.toLowerCase().trim();
    if (!modLogoMap.has(lowerAlias)) {
      modLogoMap.set(lowerAlias, entry);
    }
    const unaccAlias = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (!modLogoMap.has(unaccAlias)) {
      modLogoMap.set(unaccAlias, entry);
    }
    const simpAlias = simplifyClubName(alias);
    if (simpAlias && !modLogoMap.has(simpAlias)) {
      modLogoMap.set(simpAlias, entry);
    }
  }
}

interface ClubLogoProps {
  name?: string;
  club?: { name?: string; id?: number; color?: string; logo?: string; fallbackLogo?: string };
  size?: number;
  id?: number;
  color?: string;
  logo?: string | string[];
  fallbackLogo?: string;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
  isModActive?: boolean;
  showReserveBadge?: boolean;
}

// Deterministic hash function for shapes and patterns
const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

// Check uebrightness for accessible text color
const getTextColor = (hex: string) => {
    const h = hex.startsWith('#') ? hex.substr(1) : hex;
    const r = parseInt(h.substr(0, 2), 16) || 0;
    const g = parseInt(h.substr(2, 2), 16) || 0;
    const b = parseInt(h.substr(4, 2), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
};

const getShapeStyle = (shape: string): React.CSSProperties => {
    switch(shape) {
      case 'circle': return { borderRadius: '50%' };
      case 'rounded': return { borderRadius: '25%' };
      case 'rounded-sm': return { borderRadius: '12%' };
      case 'shield': return { clipPath: 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)' };
      case 'shield-round': return { clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)', borderRadius: '12% 12% 0 0' };
      case 'shield-modern': return { clipPath: 'polygon(6% 0, 94% 0, 100% 15%, 100% 70%, 50% 100%, 0 70%, 0 15%)' };
      case 'hexagon': return { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
      default: return { borderRadius: '50%' };
    }
};

const getPatternBackground = (pattern: string, p: string, s: string) => {
    switch(pattern) {
      case 'solid': return p;
      case 'stripes-v': return `repeating-linear-gradient(to right, ${p}, ${p} 25%, ${s} 25%, ${s} 50%)`;
      case 'stripes-h': return `repeating-linear-gradient(to bottom, ${p}, ${p} 25%, ${s} 25%, ${s} 50%)`;
      case 'stripes-thin-v': return `repeating-linear-gradient(to right, ${p}, ${p} 10%, ${s} 10%, ${s} 20%)`;
      case 'stripes-thin-h': return `repeating-linear-gradient(to bottom, ${p}, ${p} 10%, ${s} 10%, ${s} 20%)`;
      case 'halves-v': return `linear-gradient(to right, ${p} 50%, ${s} 50%)`;
      case 'halves-h': return `linear-gradient(to bottom, ${p} 50%, ${s} 50%)`;
      case 'sash-diag': return `linear-gradient(135deg, ${p} 35%, ${s} 35%, ${s} 65%, ${p} 65%)`;
      case 'sash-diag-reverse': return `linear-gradient(225deg, ${p} 35%, ${s} 35%, ${s} 65%, ${p} 65%)`;
      case 'quarters': return `conic-gradient(${p} 90deg, ${s} 90deg 180deg, ${p} 180deg 270deg, ${s} 270deg)`;
      case 'cross': return `linear-gradient(to right, transparent 40%, ${s} 40%, ${s} 60%, transparent 60%), linear-gradient(to bottom, ${p} 40%, ${s} 40%, ${s} 60%, ${p} 60%)`;
      case 'diamond-check': return `repeating-linear-gradient(45deg, ${p}, ${p} 10px, ${s} 10px, ${s} 20px)`;
      case 'center-stripe-h': return `linear-gradient(to bottom, ${p} 33%, ${s} 33%, ${s} 66%, ${p} 66%)`;
      case 'center-stripe-v': return `linear-gradient(to right, ${p} 33%, ${s} 33%, ${s} 66%, ${p} 66%)`;
      case 'checks': return `conic-gradient(${p} 90deg, ${s} 90deg 180deg, ${p} 180deg 270deg, ${s} 270deg) 0 0 / 50% 50%`;
      default: return p;
    }
};

const getLookalikeConfig = (baseName: string, primaryFallback: string) => {
    const lookalikes = [
      { keys: ['Magdeburg'], shape: 'shield', pattern: 'halves-v', sColor: '#ffffff', inner: false, pColor: '#0054a6' },
      { keys: ['São Paulo'], shape: 'shield', pattern: 'stripes-v', sColor: '#000000', inner: true, pColor: '#ff0000' },
      { keys: ['Flamengo', 'Rio Red-Black'], shape: 'shield', pattern: 'stripes-h', sColor: '#000000', inner: true, pColor: '#c9141d' },
      { keys: ['Boca', 'Buenos Aires Blue-Gold'], shape: 'shield', pattern: 'center-stripe-h', sColor: '#ffb000', inner: true, pColor: '#004791' },
      { keys: ['River', 'Buenos Aires Red-White'], shape: 'shield', pattern: 'sash-diag', sColor: '#ff0000', inner: true, pColor: '#ffffff' },
      { keys: ['Celtic', 'Glasgow Green'], shape: 'circle', pattern: 'stripes-h', sColor: '#ffffff', inner: true, pColor: '#018749' },
      { keys: ['Rangers', 'Glasgow Blue'], shape: 'circle', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#1b458f' },
      { keys: ['Legia', 'Warsaw White'], shape: 'shield', pattern: 'sash-diag', sColor: '#000000', inner: true, pColor: '#ffffff' },
      { keys: ['Salzburg'], shape: 'circle', pattern: 'halves-v', sColor: '#ffffff', inner: true, pColor: '#de002a' },
      { keys: ['Basel', 'Basel Red-Blue'], shape: 'shield', pattern: 'halves-v', sColor: '#003882', inner: true, pColor: '#db001b' },
      { keys: ['Sydney'], shape: 'circle', pattern: 'solid', sColor: '#000080', inner: true, pColor: '#6cabdd' },
      { keys: ['Melbourne City'], shape: 'circle', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#6cabdd' },
      { keys: ['Nacional', 'Medellin Green'], shape: 'shield', pattern: 'stripes-v', sColor: '#ffffff', inner: true, pColor: '#006a36' },
      { keys: ['America', 'Mexico City Yellow-Blue'], shape: 'circle', pattern: 'solid', sColor: '#00005a', inner: true, pColor: '#fbeb00' },
      { keys: ['Cruz Azul', 'Mexico City Blue'], shape: 'cross', pattern: 'cross', sColor: '#ffffff', inner: true, pColor: '#003db3' },
      { keys: ['Toronto'], shape: 'shield', pattern: 'halves-v', sColor: '#303e48', inner: true, pColor: '#e31837' },
      { keys: ['Munich Red', 'Muenchen'], shape: 'circle', pattern: 'diamond-check', sColor: '#ffffff', inner: true, pColor: '#dc052d' },
      { keys: ['Dortmund Yellow', 'Dortmund'], shape: 'circle', pattern: 'solid', sColor: '#000000', inner: true, pColor: '#fde100' },
      { keys: ['Leverkusen Red-Black', 'Leverkusen'], shape: 'circle', pattern: 'halves-v', sColor: '#000000', inner: false, pColor: '#e32219' },
      { keys: ['Leipzig Yellow'], shape: 'shield', pattern: 'stripes-v', sColor: '#0054a6', inner: true, pColor: '#eab308' },
      { keys: ['Leipzig Green'], shape: 'shield', pattern: 'halves-v', sColor: '#ffffff', inner: true, pColor: '#15803d' },
      { keys: ['Leipzig Rasen', 'Leipzig Red', 'Leipzig'], shape: 'shield', pattern: 'halves-v', sColor: '#dd011d', inner: true, pColor: '#ffffff' },
      { keys: ['Stuttgart'], shape: 'shield', pattern: 'center-stripe-h', sColor: '#ffffff', inner: false, pColor: '#e32219' },
      { keys: ['Gladbach'], shape: 'diamond', pattern: 'stripes-v', sColor: '#000000', inner: true, pColor: '#ffffff' },
      { keys: ['Koln'], shape: 'circle', pattern: 'halves-v', sColor: '#ffffff', inner: true, pColor: '#ed1c24' },
      { keys: ['Frankfurt Eagle', 'Frankfurt'], shape: 'shield', pattern: 'stripes-v', sColor: '#e1000f', inner: true, pColor: '#000000' },
      { keys: ['Bremen'], shape: 'diamond', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#1d8438' },
      { keys: ['Gelsenkirchen', 'Schalke'], shape: 'circle', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#004d9d' },
      { keys: ['Madrid White'], shape: 'circle', pattern: 'sash-diag', sColor: '#00529f', inner: true, pColor: '#ffffff' },
      { keys: ['Madrid Red', 'Madrid Rojo y Blanco', 'Madrid Rojiblanco', 'Madrid Rojo', 'Atletico', 'Atlético'], shape: 'shield', pattern: 'stripes-v', sColor: '#ffffff', inner: true, pColor: '#cb3524' },
      { keys: ['Barcelona', 'Catalunya'], shape: 'shield', pattern: 'stripes-v', sColor: '#a50044', inner: true, pColor: '#004d98' },
      { keys: ['Valencia'], shape: 'shield', pattern: 'stripes-v', sColor: '#ffffff', inner: true, pColor: '#000000' },
      { keys: ['Sevilla'], shape: 'shield', pattern: 'halves-v', sColor: '#d11515', inner: false, pColor: '#ffffff' },
      { keys: ['Man Red'], shape: 'shield', pattern: 'halves-v', sColor: '#fbe122', inner: true, pColor: '#da291c' },
      { keys: ['Man Blue'], shape: 'circle', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#6cabdd' },
      { keys: ['North London'], shape: 'shield', pattern: 'halves-v', sColor: '#ffffff', inner: true, pColor: '#ef0107' },
      { keys: ['West London'], shape: 'circle', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#034694' },
      { keys: ['Merseyside Red'], shape: 'shield', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#c8102E' },
      { keys: ['Milan (R)', 'AC Milan', 'Milan'], shape: 'oval', pattern: 'stripes-v', sColor: '#000000', inner: true, pColor: '#fb090b' },
      { keys: ['Milan (B)', 'Inter'], shape: 'circle', pattern: 'stripes-v', sColor: '#000000', inner: true, pColor: '#010E80' },
      { keys: ['Juventus', 'Turin'], shape: 'oval', pattern: 'stripes-v', sColor: '#000000', inner: true, pColor: '#ffffff' },
      { keys: ['Rome', 'Roma'], shape: 'shield', pattern: 'halves-v', sColor: '#f0bc42', inner: false, pColor: '#8e1f2f' },
      { keys: ['Napoli', 'Naples'], shape: 'circle', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#003cb2' },
      { keys: ['Paris'], shape: 'circle', pattern: 'center-stripe-v', sColor: '#da291c', inner: true, pColor: '#004170' },
      { keys: ['Marseille'], shape: 'circle', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#2faee0' },
      { keys: ['Lyon'], shape: 'shield', pattern: 'halves-v', sColor: '#da291c', inner: true, pColor: '#ffffff' },
      { keys: ['Lisbon (B)', 'Benfica'], shape: 'shield', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#ed1c24' },
      { keys: ['Porto'], shape: 'shield', pattern: 'stripes-v', sColor: '#ffffff', inner: true, pColor: '#00428c' },
      { keys: ['Lisbon (S)', 'Sporting'], shape: 'circle', pattern: 'stripes-h', sColor: '#ffffff', inner: true, pColor: '#008040' },
      { keys: ['Ajax', 'Amsterdam'], shape: 'shield', pattern: 'center-stripe-v', sColor: '#d2122b', inner: false, pColor: '#ffffff' },
      { keys: ['Celtic'], shape: 'circle', pattern: 'stripes-h', sColor: '#ffffff', inner: true, pColor: '#018749' },
      { keys: ['Belém OS', 'Belenenses', 'Belem'], shape: 'shield-round', pattern: 'solid', sColor: '#ffffff', inner: true, pColor: '#008057' }
    ];

    const clean = (baseName || '').replace(/\s+\(?B\)?$/, '').trim();
    for (const l of lookalikes) {
       for (const key of l.keys) {
          if (clean === key || (clean && clean.startsWith(key))) {
             return { ...l, pColor: l.pColor || primaryFallback };
          }
       }
    }

    // Deterministic Generic Fallback
    const h = hashCode(clean || 'FC');
    const SHAPES = ['shield', 'shield-round', 'shield-modern', 'circle', 'rounded', 'rounded-sm', 'hexagon'];
    const PATTERNS = ['solid', 'stripes-v', 'stripes-h', 'stripes-thin-v', 'stripes-thin-h', 'halves-v', 'halves-h', 'sash-diag', 'sash-diag-reverse', 'quarters', 'cross', 'diamond-check', 'center-stripe-h', 'center-stripe-v', 'checks'];
        // STRICT OFFICIAL COLOR CONTRAST (Never invent random secondary colors like yellow unless it's their actual primary)
    // Most real clubs just pair their primary color with white or black.
    const getContrastSecondary = (hex: string = '#ffffff') => {
       const rawHex = hex || '#ffffff';
       const h = rawHex.startsWith('#') ? rawHex.substr(1) : rawHex;
       const r = parseInt(h.substr(0, 2), 16) || 0;
       const g = parseInt(h.substr(2, 2), 16) || 0;
       const b = parseInt(h.substr(4, 2), 16) || 0;
       const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
       // If primary is very light (like yellow or white), use black. Otherwise use white.
       return yiq >= 180 ? '#000000' : '#ffffff';
    };

    const TEXT_STYLES = ['initials', 'initials', 'single', 'single', 'icon'];
    const ICONS = ['fa-shield-halved', 'fa-futbol', 'fa-crown', 'fa-star', 'fa-bolt', 'fa-anchor', 'fa-leaf'];
    
    return {
        shape: SHAPES[h % SHAPES.length],
        pattern: PATTERNS[(h >> 2) % PATTERNS.length],
        sColor: getContrastSecondary(primaryFallback),
        pColor: primaryFallback,
        inner: (h % 2) === 0,
        textStyle: TEXT_STYLES[(h >> 3) % TEXT_STYLES.length],
        icon: ICONS[(h >> 4) % ICONS.length]
    };
};


export const ClubLogo: React.FC<ClubLogoProps> = ({
  name: nameProp,
  club,
  size,
  id: idProp,
  color: colorProp,
  logo: logoProp,
  fallbackLogo: fallbackLogoProp,
  className = "w-8 h-8 object-contain shrink-0 drop-shadow-md",
  fallbackClassName,
  alt,
  isModActive: isModActiveProp,
  showReserveBadge = false
}) => {
  const name = (nameProp || club?.name || alt || '').trim();
  const id = idProp ?? club?.id;
  const color = colorProp || club?.color;
  const logo = logoProp || club?.logo;
  const fallbackLogo = fallbackLogoProp || club?.fallbackLogo;

  const clubKey = getClubLogoKey(id, name);

  // Determine if the community mod is active (via prop or fallback to localStorage)
  const isModActive = isModActiveProp !== undefined
    ? isModActiveProp
    : (typeof window !== 'undefined' && localStorage.getItem('fms_real_mod_active') === 'true');

  const isReserve = isReserveClub(name);
  const showReserve = showReserveBadge && isReserve;

  // Strip reserve suffixes so they share identical badges
  const cleanName = (name || '')
    .replace(/\s+Res\.?$/i, '')
    .replace(/\s+Reserve$/i, '')
    .replace(/\s+II$/, '')
    .replace(/\s+\(?B\)?$/, '')
    .replace(/\s+Castilla$/, '')
    .replace(/\s+B$/, '')
    .replace(/\s+2$/, '')
    .replace(/\s+Res\.?$/i, '')
    .trim();

  // Helper to sanitize Wikipedia File / Datei links and trim URLs
  const sanitizeLogoUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.includes('wikipedia.org/wiki/File:') || trimmed.includes('wikipedia.org/wiki/Datei:')) {
      const fileName = trimmed.split(/wiki\/(?:File|Datei):/)[1]?.split(/[?#]/)[0];
      if (fileName) {
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}`;
      }
    }
    return trimmed;
  };

  // Compute all candidate logo sources
  const sources = useMemo(() => {
    // STRICT CHECK: If mod is OFF (fallback/unmodded clubs mode), NEVER load official crests,
    // mod assets, or cached mod URLs!
    // Only manual user custom uploads (data:image/ or blob:) from club customization are permitted.
    if (!isModActive) {
      if (typeof logo === 'string' && (logo.startsWith('data:image/') || logo.startsWith('blob:'))) {
        return [logo];
      }
      return [];
    }

    const list: string[] = [];

    // Check localStorage cache only when community mod is active
    const cached = getCachedLogo(clubKey);
    // 1. If we have an offline base64 Data URL cached in localStorage, place it first!
    if (cached.dataUrl && !list.includes(cached.dataUrl)) {
      list.push(cached.dataUrl);
    }
    // 2. If we have a verified working URL from localStorage, place it next!
    if (cached.workingUrl && !list.includes(cached.workingUrl)) {
      list.push(cached.workingUrl);
    }

    const addUrl = (u?: string) => {
      if (!u || typeof u !== 'string') return;
      const clean = sanitizeLogoUrl(u);
      if (!clean) return;

      // For Wikimedia / Wikipedia SVG assets, prioritize high-res pre-rendered PNG thumbnails via Special:FilePath
      // to ensure 100% browser decoding compatibility across all desktop and mobile browsers
      if (clean.includes('wikimedia.org') || clean.includes('wikipedia.org')) {
        let fileName = '';
        let wikiDomain = clean.includes('/wikipedia/en/') ? 'en.wikipedia.org' : 'commons.wikimedia.org';
        if (clean.includes('/wiki/Special:FilePath/')) {
          fileName = clean.split('/wiki/Special:FilePath/')[1]?.split(/[?#]/)[0];
          if (clean.includes('en.wikipedia.org')) wikiDomain = 'en.wikipedia.org';
        } else if (clean.includes('/wikipedia/commons/')) {
          const parts = clean.split('/');
          fileName = parts[parts.length - 1]?.split(/[?#]/)[0];
          wikiDomain = 'commons.wikimedia.org';
        } else if (clean.includes('/wikipedia/en/')) {
          const parts = clean.split('/');
          fileName = parts[parts.length - 1]?.split(/[?#]/)[0];
          wikiDomain = 'en.wikipedia.org';
        }
        if (fileName) {
          try {
            const decoded = decodeURIComponent(fileName);
            const pngThumb = `https://${wikiDomain}/wiki/Special:FilePath/${encodeURIComponent(decoded)}?width=240`;
            if (!list.includes(pngThumb)) list.push(pngThumb);
          } catch {
            const pngThumb = `https://${wikiDomain}/wiki/Special:FilePath/${fileName}?width=240`;
            if (!list.includes(pngThumb)) list.push(pngThumb);
          }
        }
      }

      if (!list.includes(clean)) list.push(clean);

      if (clean && clean.includes('upload.wikimedia.org/wikipedia/')) {
        const parts = clean.split('/');
        const fileName = parts[parts.length - 1];
        const wikiDomain = clean.includes('/wikipedia/en/') ? 'en.wikipedia.org' : 'commons.wikimedia.org';
        if (fileName) {
          try {
            const decoded = decodeURIComponent(fileName);
            const filePath = `https://${wikiDomain}/wiki/Special:FilePath/${encodeURIComponent(decoded)}`;
            if (!list.includes(filePath)) list.push(filePath);
          } catch {
            const filePath = `https://${wikiDomain}/wiki/Special:FilePath/${fileName}`;
            if (!list.includes(filePath)) list.push(filePath);
          }
        }
      }
    };

    const lowerName = (name || '').toLowerCase().trim();
    const lowerClean = (cleanName || '').toLowerCase().trim();
    const lowerNoRes = lowerName ? lowerName.replace(/\s+res\.?$/i, '').trim() : '';
    const simp = name ? simplifyClubName(name) : '';
    const simpClean = cleanName ? simplifyClubName(cleanName) : '';

    // Look up in order of precision:
    // 1. Exact name match in mod database or alias dictionary
    // 2. Name without "Res."
    // 3. Clean parent name match (crucial for reserve teams sharing parent crest)
    // 4. Simplified name match
    // 5. Clean simplified name match
    // 6. Canonical ID lookup (only if verified or name is empty)
    let idEntry: ModLogoEntry | undefined = undefined;
    if (id != null && idToModEntry.has(id)) {
      if (!name || name.trim() === '' || REAL_CLUB_ALIASES[lowerName] === id || REAL_CLUB_ALIASES[lowerClean] === id || REAL_CLUB_ALIASES[lowerNoRes] === id) {
        idEntry = idToModEntry.get(id);
      }
    }

    const modded = modLogoMap.get(lowerName) ||
                   modLogoMap.get(lowerNoRes) ||
                   modLogoMap.get(lowerClean) ||
                   (simp ? modLogoMap.get(simp) : undefined) ||
                   (simpClean ? modLogoMap.get(simpClean) : undefined) ||
                   idEntry;

    const isCustomUpload = (u: any) => typeof u === 'string' && (u.startsWith('data:image/') || u.startsWith('blob:'));

    // 1. Manual user custom image uploads have absolute top priority
    if (Array.isArray(logo)) {
      logo.filter(isCustomUpload).forEach(addUrl);
    } else if (isCustomUpload(logo)) {
      addUrl(logo as string);
    }

    // 2. When mod is active, verified authentic mod crest takes priority over stale/corrupted external URLs from saves
    if (isModActive && modded) {
      if (modded.logo) addUrl(modded.logo);
      if (modded.fallbackLogo) addUrl(modded.fallbackLogo);
    }

    // 3. External HTTP/HTTPS URLs from props
    if (Array.isArray(logo)) {
      logo.filter(u => !isCustomUpload(u)).forEach(addUrl);
    } else if (logo && typeof logo === 'string' && !isCustomUpload(logo)) {
      addUrl(logo);
    }
    if (fallbackLogo && typeof fallbackLogo === 'string' && !isCustomUpload(fallbackLogo)) {
      addUrl(fallbackLogo);
    }

    // 4. Fallback mod logo if mod was inactive
    if (!isModActive && modded) {
      if (modded.logo) addUrl(modded.logo);
      if (modded.fallbackLogo) addUrl(modded.fallbackLogo);
    }

    return list.filter(Boolean);
  }, [logo, fallbackLogo, name, cleanName, id, isModActive, clubKey]);

  const [sourceIndex, setSourceIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const currentSrc = sources[sourceIndex];

  // Synchronously initialize isLoaded if the image has already loaded in memory (zero-flicker on remount)
  const [isLoaded, setIsLoaded] = useState(() => (sources[0] ? isUrlLoadedInMemory(sources[0]) : false));

  useEffect(() => {
    setSourceIndex(0);
    setImgError(false);
    if (sources[0] && isUrlLoadedInMemory(sources[0])) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [logo, fallbackLogo, cleanName, id, isModActive, sources]);

  useEffect(() => {
    if (currentSrc && isUrlLoadedInMemory(currentSrc)) {
      setIsLoaded(true);
    }
  }, [currentSrc]);
  
  // GENERATE GENERIC MODDED MONOGRAM
  const sizeStyle = size ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` } : undefined;
  const primaryFallback = color || getMonogramHex(cleanName || name || 'FC');
  let pColor = primaryFallback;
  if (!pColor.startsWith('#')) pColor = '#' + pColor;
  
  const config = getLookalikeConfig(cleanName || name || 'FC', pColor);
  const displayInitials = getInitials(cleanName || name || 'FC');
  
  const displayColor = (config.pattern === 'solid' && pColor === '#ffffff') ? '#000000' : pColor; // Adjust if pure white solid
  const pBg = getPatternBackground(config.pattern, config.pColor, config.sColor);

  const outerStyle = getShapeStyle(config.shape);
  const innerShapeStyle = getShapeStyle(config.shape === 'oval' || config.shape === 'flag' ? 'circle' : config.shape);

  const tStyle = (config as any).textStyle || 'initials';
  const cIcon = (config as any).icon || 'fa-shield-halved';
  
  let innerContent = null;
  const tColor = getTextColor(config.inner ? config.pColor : config.pColor); // Technically outer text might need different color based on pattern, but pColor is safe fallback
  
  if (tStyle === 'initials') {
      innerContent = <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill={tColor} fontSize={displayInitials.length > 2 ? "36" : "44"} fontWeight="900" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="-0.02em" stroke={tColor === '#ffffff' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinejoin="round">{displayInitials}</text>;
  } else if (tStyle === 'single') {
      innerContent = <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill={tColor} fontSize="58" fontWeight="900" fontFamily="ui-sans-serif, system-ui, sans-serif" stroke={tColor === '#ffffff' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinejoin="round">{displayInitials.charAt(0)}</text>;
  } else if (tStyle === 'icon') {
      // Use foreignObject to render fontawesome inside SVG, or just render it outside SVG
  }

  const renderContent = () => {
     if (tStyle === 'none') return null;
     if (tStyle === 'icon') {
         return <i className={`fas ${cIcon} absolute z-10 drop-shadow-md`} style={{ color: tColor, fontSize: '45%' }}></i>;
     }
     return (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-md pointer-events-none" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}>
            {innerContent}
        </svg>
     );
  };

  const isClipped = Boolean((outerStyle as any)?.clipPath);

  // Render complete monogram artwork filling 100% of its square container
  const monogramInner = (
    <div 
      className={`w-full h-full relative flex items-center justify-center font-bold overflow-hidden ${fallbackClassName || ''}`}
      style={{
        background: pBg,
        ...outerStyle,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
        ...(!isClipped ? { border: '1px solid rgba(255,255,255,0.2)' } : {})
      }}
      title={name}
    >
      {/* Inner overlay for shadow/highlights */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-black/30 pointer-events-none mix-blend-overlay"></div>
      {!isClipped && <div className="absolute inset-0 border border-white/20 pointer-events-none rounded-[inherit]"></div>}
      
      {config.inner ? (
        <div 
          className="absolute flex items-center justify-center" 
          style={{
            width: '65%', height: '65%', 
            backgroundColor: config.pColor,
            ...innerShapeStyle,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-[inherit]"></div>
          {renderContent()}
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );

  const isImageValid = Boolean(
    currentSrc &&
    !imgError &&
    (
      currentSrc.startsWith('http://') ||
      currentSrc.startsWith('https://') ||
      currentSrc.startsWith('//') ||
      currentSrc.startsWith('data:image/') ||
      currentSrc.startsWith('blob:') ||
      currentSrc.startsWith('/') ||
      currentSrc.startsWith('./') ||
      /\.(png|jpe?g|svg|webp|gif|ico)(\?.*)?$/i.test(currentSrc)
    )
  );

  if (isImageValid) {
    return (
      <div 
        style={sizeStyle}
        className={`relative inline-flex items-center justify-center aspect-square shrink-0 overflow-hidden select-none [contain:paint_layout] ${className}`}
      >
        {/* Solid crisp placeholder monogram with zero layout shift while image settles */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            {monogramInner}
          </div>
        )}
        <img
          ref={(imgNode) => {
            if (imgNode && imgNode.complete && imgNode.naturalWidth > 0) {
              if (currentSrc) {
                markUrlLoaded(currentSrc);
                setCachedWorkingUrl(clubKey, currentSrc);
              }
              if (!isLoaded) {
                setIsLoaded(true);
              }
            }
          }}
          src={currentSrc}
          referrerPolicy="no-referrer"
          decoding="async"
          loading="eager"
          alt={alt || name}
          onLoad={() => {
            if (currentSrc) {
              markUrlLoaded(currentSrc);
              setCachedWorkingUrl(clubKey, currentSrc);
              if (isModActive && currentSrc.startsWith('http')) {
                cacheLogoBlob(clubKey, currentSrc);
              }
            }
            setIsLoaded(true);
          }}
          className={`relative z-10 w-full h-full max-w-full max-h-full object-contain drop-shadow-md ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={() => {
            setIsLoaded(false);
            if (sourceIndex < sources.length - 1) {
              setSourceIndex(prev => prev + 1);
            } else {
              setImgError(true);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div 
      style={sizeStyle}
      className={`relative inline-flex items-center justify-center aspect-square shrink-0 overflow-hidden select-none [contain:paint_layout] ${className}`}
    >
      {monogramInner}
    </div>
  );
};
