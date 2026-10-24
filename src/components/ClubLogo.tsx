import React, { useState, useEffect, useMemo } from 'react';
import { getInitials, getMonogramHex, isReserveClub } from '../data/gameConstants';
import { isRealDataModActive, getCustomDb, getActiveClubs } from '../utils/modManager';
import { getLocalAssetPath, hasVerifiedLocalAsset } from '../data/teams';
import { ALL_CLUBS } from '../data/clubsData';
import { REAL_WORLD_LOGOS } from '../data/realWorldLogos';

interface ClubLogoProps {
  name?: string;
  clubName?: string;
  clubId?: number;
  color?: string;
  color2?: string;
  logo?: string | string[];
  fallbackLogo?: string;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

// Deterministic hash function for shapes and patterns
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Check brightness for accessible text color
const getTextColor = (hex: string) => {
  const h = hex.startsWith('#') ? hex.substring(1) : hex;
  const cleanHex = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 140 ? '#0f172a' : '#ffffff';
};

const isLightHex = (hex: string) => {
  if (!hex) return false;
  const h = hex.startsWith('#') ? hex.substring(1) : hex;
  const cleanHex = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 170;
};

const getShapeStyles = (hash: number, _color: string) => {
  const shapes = [
    'rounded-full', // Circle
    'rounded-[25%]', // Squircle
    'rounded-[10px_20px_10px_20px]', // Alternating corners
    'rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm', // Leaf/Shield
    'rounded-t-[30%] rounded-b-md', // Shield-like
    'rounded-sm rotate-45', // Diamond (needs inner counter-rotation)
    'rounded-[15%_35%_50%_25%]', // Asymmetrical Abstract
    'rounded-[50%_50%_10%_10%]', // Arch shape
  ];
  return shapes[hash % shapes.length];
};

const getPatternStyles = (hash: number, color: string, color2?: string) => {
  const darken = (hex: string, amount: number) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };
  
  let secondaryColor = color2;
  if (secondaryColor && !secondaryColor.startsWith('#')) {
    secondaryColor = '#' + secondaryColor;
  }
  if (!secondaryColor) {
    secondaryColor = darken(color, 40);
  }
  
  const patterns = [
    `linear-gradient(135deg, ${color} 0%, ${secondaryColor} 100%)`,
    `repeating-linear-gradient(45deg, ${color}, ${color} 10px, ${secondaryColor} 10px, ${secondaryColor} 20px)`,
    `radial-gradient(circle at center, ${color} 0%, ${secondaryColor} 100%)`,
    `conic-gradient(from 0deg, ${color} 0% 50%, ${secondaryColor} 50% 100%)`,
    `linear-gradient(to bottom, ${color} 0% 33%, ${secondaryColor} 33% 66%, ${color} 66% 100%)`,
    `linear-gradient(to right, ${color} 0% 50%, ${secondaryColor} 50% 100%)`,
  ];
  return patterns[hash % patterns.length];
};

export const ClubLogo: React.FC<ClubLogoProps & { club?: any; clubName?: string; name?: string; size?: string | number }> = ({ 
  club,
  clubId: propClubId,
  name: rawPropName,
  clubName: rawClubName,
  color: propColor,
  color2: propColor2,
  logo: propLogo,
  fallbackLogo,
  className = '',
  fallbackClassName = '',
  alt: propAlt,
  _size = 'sm'
}: any) => {
  const propName = rawPropName || rawClubName;
  const name = propName || club?.name || 'Club';
  const color = propColor || club?.color || '#1c1c1e';
  const alt = propAlt !== undefined ? propAlt : '';
  const isReserve = (propName || club?.name) ? isReserveClub(propName || club?.name) : false;

  // Mod state listener
  const [modActive, setModActive] = useState<boolean>(() => {
    try {
      return isRealDataModActive() || Boolean(getCustomDb());
    } catch {
      return true;
    }
  });
  const [modVersion, setModVersion] = useState(0);

  useEffect(() => {
    const handleModChange = () => {
      setModActive(isRealDataModActive() || Boolean(getCustomDb()));
      setModVersion(v => v + 1);
    };
    window.addEventListener('storage', handleModChange);
    window.addEventListener('mod-state-change', handleModChange);
    return () => {
      window.removeEventListener('storage', handleModChange);
      window.removeEventListener('mod-state-change', handleModChange);
    };
  }, []);

  // Match club in verified registry with exact, normalized, and flexible alias matching
  const matchedClub = useMemo(() => {
    let registryClubs: any[] = [];
    try {
      registryClubs = getActiveClubs() || [];
    } catch {
      registryClubs = [];
    }
    const combinedClubs = registryClubs.length > 0 ? registryClubs : ALL_CLUBS;

    const targetId = propClubId || club?.id;
    if (targetId !== undefined && targetId !== null && targetId !== '') {
      const byCombinedId = combinedClubs.find(c => String(c.id) === String(targetId) || Number(c.id) === Number(targetId));
      if (byCombinedId) return byCombinedId;
      const byAllClubsId = ALL_CLUBS.find(c => String(c.id) === String(targetId) || Number(c.id) === Number(targetId));
      if (byAllClubsId) return byAllClubsId;
    }
    const clean = (propName || club?.name || '').trim().toLowerCase();
    if (!clean) return undefined;

    // 1. Exact match
    const exact = combinedClubs.find(c => c.name.toLowerCase() === clean) || ALL_CLUBS.find(c => c.name.toLowerCase() === clean);
    if (exact) return exact;

    // 1b. Normalized match (stripping periods, hyphens, and whitespace: e.g. "1.fc köln" vs "1. fc köln")
    const normClean = clean.replace(/[\.\s\-]/g, '');
    const normMatch = combinedClubs.find(c => (c.name || '').toLowerCase().replace(/[\.\s\-]/g, '') === normClean) ||
      ALL_CLUBS.find(c => (c.name || '').toLowerCase().replace(/[\.\s\-]/g, '') === normClean);
    if (normMatch) return normMatch;

    // 2. Specific known multi-sport / handball team aliases
    if (clean.includes('porto')) {
      const p = combinedClubs.find(c => c.id === 202 || c.name.toLowerCase().includes('porto')) ||
        ALL_CLUBS.find(c => c.id === 202 || c.name.toLowerCase().includes('porto'));
      if (p) return p;
    }
    if (clean.includes('sporting')) {
      const sp = combinedClubs.find(c => c.id === 201 || c.name.toLowerCase().includes('sporting')) ||
        ALL_CLUBS.find(c => c.id === 201 || c.name.toLowerCase().includes('sporting'));
      if (sp) return sp;
    }
    if (clean.includes('benfica')) {
      const b = combinedClubs.find(c => c.id === 203 || c.name.toLowerCase().includes('benfica')) ||
        ALL_CLUBS.find(c => c.id === 203 || c.name.toLowerCase().includes('benfica'));
      if (b) return b;
    }
    if (clean.includes('köln') || clean.includes('koeln') || clean.includes('cologne')) {
      const k = ALL_CLUBS.find(c => c.id === 152 || String(c.id) === '152');
      if (k) return k;
    }
    if (clean.includes('paderborn')) {
      const p = ALL_CLUBS.find(c => c.id === 174 || String(c.id) === '174');
      if (p) return p;
    }
    if (clean.includes('dortmund')) {
      const d = ALL_CLUBS.find(c => c.id === 160 || String(c.id) === '160');
      if (d) return d;
    }
    if (clean.includes('bayern')) {
      const b = ALL_CLUBS.find(c => c.id === 183 || String(c.id) === '183');
      if (b) return b;
    }
    if (clean.includes('wiesbaden')) {
      const w = ALL_CLUBS.find(c => c.id === 171 || String(c.id) === '171');
      if (w) return w;
    }
    if (clean.includes('toulouse')) {
      const t = ALL_CLUBS.find(c => c.id === 406 || c.name.includes('Toulouse'));
      if (t) return t;
    }
    if (clean.includes('chambéry') || clean.includes('chambery')) {
      const ch = ALL_CLUBS.find(c => c.id === 405);
      if (ch) return ch;
    }
    if (clean.includes('nîmes') || clean.includes('nimes')) {
      const n = ALL_CLUBS.find(c => c.id === 404);
      if (n) return n;
    }
    if (clean.includes('granollers')) {
      const g = ALL_CLUBS.find(c => c.id === 304);
      if (g) return g;
    }
    if (clean.includes('melsungen')) {
      const m = ALL_CLUBS.find(c => c.id === 105);
      if (m) return m;
    }
    if (clean.includes('magdeburg')) {
      const mg = ALL_CLUBS.find(c => c.id === 101);
      if (mg) return mg;
    }
    if (clean.includes('flensburg')) {
      const fl = ALL_CLUBS.find(c => c.id === 103);
      if (fl) return fl;
    }
    if (clean.includes('kiel') && !clean.includes('kielce')) {
      const k = ALL_CLUBS.find(c => c.id === 104);
      if (k) return k;
    }

    // 3. Substring matching
    return ALL_CLUBS.find(c => {
      const cLow = c.name.toLowerCase();
      return cLow.includes(clean) || clean.includes(cLow);
    });
  }, [propClubId, club?.id, propName, club?.name, modActive, modVersion]);

  const candidateLogos = useMemo(() => {
    if (!modActive) return [];
    const candidates: string[] = [];
    const rawClubId = propClubId || club?.id || matchedClub?.id;
    const clubId = rawClubId !== undefined && rawClubId !== null ? Number(rawClubId) : undefined;

    // 1. Explicit prop or club object logo takes first priority (especially custom or edited logos)
    const explicitLogo = propLogo || club?.logo;
    if (explicitLogo) {
      const arr = Array.isArray(explicitLogo) ? explicitLogo : [explicitLogo];
      arr.forEach((l) => {
        if (l && typeof l === 'string' && !candidates.includes(l)) {
          candidates.push(l);
        }
      });
    }

    // 2. Verified local asset (guaranteed on disk)
    if (clubId !== undefined && !isNaN(clubId) && hasVerifiedLocalAsset(clubId)) {
      const localPath = getLocalAssetPath(clubId);
      if (localPath && !candidates.includes(localPath)) {
        candidates.push(localPath);
      }
    }

    // 2b. Specific priority for multi-sport football crests and regional verified clubs
    const cleanName = (propName || club?.name || matchedClub?.name || '').toLowerCase();
    if (clubId === 202 || cleanName.includes('porto')) {
      if (!candidates.includes('/assets/logos/club_202.svg')) candidates.unshift('/assets/logos/club_202.svg');
      if (!candidates.includes('/assets/logos/club_202.png')) candidates.push('/assets/logos/club_202.png');
    }
    if (clubId === 201 || cleanName.includes('sporting')) {
      if (!candidates.includes('/assets/logos/club_201.svg')) candidates.unshift('/assets/logos/club_201.svg');
    }
    if (clubId === 203 || cleanName.includes('benfica')) {
      if (!candidates.includes('/assets/logos/club_203.svg')) candidates.unshift('/assets/logos/club_203.svg');
    }
    if (clubId === 174 || cleanName.includes('paderborn')) {
      if (!candidates.includes('/assets/logos/club_174.svg')) candidates.unshift('/assets/logos/club_174.svg');
    }
    if (clubId === 152 || cleanName.includes('köln') || cleanName.includes('koeln') || cleanName.includes('cologne')) {
      if (!candidates.includes('/assets/logos/club_152.svg')) candidates.unshift('/assets/logos/club_152.svg');
    }
    if (clubId === 171 || cleanName.includes('wiesbaden')) {
      if (!candidates.includes('/assets/logos/club_171.svg')) candidates.unshift('/assets/logos/club_171.svg');
    }

    // 2c. Matched club logo fallback
    if (matchedClub?.logo && matchedClub.logo !== explicitLogo) {
      const arr = Array.isArray(matchedClub.logo) ? matchedClub.logo : [matchedClub.logo];
      arr.forEach((l) => {
        if (l && typeof l === 'string' && !candidates.includes(l)) {
          candidates.push(l);
        }
      });
    }

    // 3. Verified real-world official CDN
    if (clubId !== undefined && !isNaN(clubId) && REAL_WORLD_LOGOS[clubId]) {
      const direct = REAL_WORLD_LOGOS[clubId];
      if (!candidates.includes(direct)) candidates.push(direct);

      const cleanUrl = direct.replace(/^https?:\/\//, '');
      const mirror = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=160&output=png`;
      if (!candidates.includes(mirror)) candidates.push(mirror);
    }

    // 4. Fallback logo from prop / club
    let fb = fallbackLogo || matchedClub?.fallbackLogo || club?.fallbackLogo;
    if (fb && typeof fb === 'string') {
      if (fb.startsWith('/assets/logos/') && !candidates.includes(fb)) {
        candidates.unshift(fb);
      } else if (!fb.includes('Fenix_Toulouse_Handball_Logo.svg') && !candidates.includes(fb)) {
        candidates.push(fb);
      }
    }

    return candidates.filter((c): c is string => typeof c === 'string' && c.length > 0);
  }, [modActive, modVersion, propClubId, matchedClub, club?.id, propLogo, club?.logo, fallbackLogo, propName, club?.name]);

  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(() => candidateLogos.length > 0 ? candidateLogos[0] : undefined);

  useEffect(() => {
    if (candidateLogos.length > 0) {
      setCurrentSrc(candidateLogos[0]);
      setImgError(false);
    } else {
      setCurrentSrc(undefined);
      setImgError(true);
    }
  }, [candidateLogos]);

  const handleError = () => {
    if (candidateLogos.length > 0 && currentSrc) {
      const currentIndex = candidateLogos.indexOf(currentSrc);
      if (currentIndex > -1 && currentIndex < candidateLogos.length - 1) {
        setCurrentSrc(candidateLogos[currentIndex + 1]);
      } else {
        setImgError(true);
      }
    } else {
      setImgError(true);
    }
  };

  const baseClassName = "flex-shrink-0 object-contain";
  const displayClass = className || "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12";
  const fallbackDisplayClass = fallbackClassName || displayClass;

  let finalColor = color || getMonogramHex(color) || '#3f3f46';
  if (finalColor && !finalColor.startsWith('#')) {
    finalColor = '#' + finalColor;
  }
  const isLight = isLightHex(finalColor) || Boolean(color && ['ffffff', 'fff', '#ffffff', '#fff'].includes(color.toLowerCase()));
  const isWiesbaden = name.toLowerCase().includes('wiesbaden') || (propClubId === 171) || (club?.id === 171) || (matchedClub?.id === 171);
  const needsContrastContainer = isLight || isWiesbaden;

  // Real logo display (active when mod is active and valid crest asset is available)
  if (modActive && currentSrc && !imgError) {
    const isFull = displayClass.includes('w-full') || displayClass.includes('h-full');
    return (
      <div 
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${isFull ? 'w-full h-full' : ''} ${
          needsContrastContainer ? 'bg-[#0e1017]/90 rounded-lg p-0.5 border border-white/10 shadow-sm' : ''
        }`} 
        aria-hidden={alt === '' ? true : undefined}
      >
        <img
          src={currentSrc}
          alt={alt}
          aria-hidden={alt === '' ? true : undefined}
          className={`${baseClassName} ${displayClass}`}
          onError={handleError}
          decoding="async"
          loading="eager"
        />
        {isReserve && (
          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] sm:text-[9px] font-black px-1 rounded shadow-sm border border-black z-10 select-none" title="Reserve Team">
            II
          </span>
        )}
      </div>
    );
  }

  // Procedural Monogram Generation (used when mod is inactive or no crest asset is available)
  // User confirmed: "In mod, the real club logo first. If not subtle dark badge container with club accent border"
  const hash = hashCode(name);
  const textColor = isLight ? '#fbbf24' : getTextColor(finalColor);
  const initials = getInitials(name);
  
  let sizeClass = 'text-xs';
  if (fallbackDisplayClass.includes('w-12') || fallbackDisplayClass.includes('w-14') || fallbackDisplayClass.includes('w-16')) sizeClass = 'text-lg';
  if (fallbackDisplayClass.includes('w-20') || fallbackDisplayClass.includes('w-24') || fallbackDisplayClass.includes('w-32')) sizeClass = 'text-3xl';
  if (fallbackDisplayClass.includes('w-48') || fallbackDisplayClass.includes('w-64')) sizeClass = 'text-5xl';
  
  const fontStyles = ['font-sans font-black tracking-tighter', 'font-serif font-bold tracking-widest', 'font-mono font-bold'];
  const fontStyle = fontStyles[hash % fontStyles.length];
  
  const resolvedColor2 = propColor2 || club?.color2 || matchedClub?.color2;
  const shapeClass = getShapeStyles(hash, finalColor);
  const patternStyle = isLight 
    ? { background: 'linear-gradient(135deg, #181922 0%, #0d0e13 100%)' }
    : { background: getPatternStyles(hash, finalColor, resolvedColor2) };
  
  const isDiamond = shapeClass.includes('rotate-45');
  const borderClass = isLight ? 'border border-amber-400/50 shadow-md' : 'border border-white/20';

  return (
    <div className="relative inline-block shrink-0 select-none" aria-hidden={alt === '' ? true : undefined}>
      <div
        className={`flex items-center justify-center shrink-0 shadow-inner ${fallbackDisplayClass} ${shapeClass} overflow-hidden ${borderClass} relative group`}
        style={patternStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 pointer-events-none" />
        <span 
          className={`${fontStyle} ${sizeClass} uppercase z-10 drop-shadow-md transition-transform group-hover:scale-110`}
          style={{ 
            color: textColor,
            transform: isDiamond ? 'rotate(-45deg)' : 'none' 
          }}
        >
          {initials}
        </span>
      </div>
      {isReserve && (
        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] sm:text-[9px] font-black px-1 rounded shadow-sm border border-black z-20" title="Reserve Team">
          II
        </span>
      )}
    </div>
  );
};
