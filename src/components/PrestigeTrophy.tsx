import React from 'react';

export type TrophyType =
  | 'cwc'
  | 'cl'
  | 'el'
  | 'ecl'
  | 'dfb'
  | 'reg'
  | 'lower'
  | 'title'
  | 'promotion_playoff'
  | 'relegation';

interface PrestigeTrophyProps {
  type: TrophyType | string;
  size?: number; // Optional override in pixels
  className?: string;
  showStars?: boolean;
}

export const getTrophyPrestigeLevel = (type: string): 1 | 2 | 3 | 4 | 5 => {
  const norm = (type || '').toLowerCase().trim();
  if (norm === 'cwc' || norm.includes('world') || norm === 'title' || norm === 'bl_champions' || norm === 'b2_champions' || norm.includes('meister') || norm === 'bl') return 5;
  if (norm === 'cl' || norm === 'c1' || norm.includes('champions')) return 5;
  if (norm === 'promotion_playoff' || norm.includes('playoff')) return 4;
  if (norm === 'el' || norm.includes('europa')) return 4;
  if (norm === 'dfb' || norm === 'efl' || norm.includes('pokal') || norm.includes('cup')) return 4;
  if (norm === 'ecl' || norm.includes('conference')) return 3;
  if (norm === 'relegation') return 3;
  return 1; // reg / lower / grassroots
};

export const getDefaultTrophyHeight = (prestigeLevel: 1 | 2 | 3 | 4 | 5, type?: string): number => {
  const norm = (type || '').toLowerCase().trim();
  // Exact user specifications:
  // FIFA Club World Cup (Level 5 · Largest, 160px)
  // UEFA Champions League / Liberatores / Concacaf / AFC (Level 5 · 150px)
  // Championship Decider (Level 5 · 160px)
  // UEFA Europa League / Copa / Concacaf / AFC (Level 4 · 130px)
  // National Domestic Cup (Level 4 · 130px)
  // Promotion Playoff Decider (Level 4 · 130px)
  // UEFA Conference League / Copa / Concacaf / AFC (Level 3 · 110px)
  // Relegation Survival Battle (Level 3 · 110px)
  // Regional Grassroots Cup (Level 1 · Compact 85px)
  if (norm === 'cwc' || norm.includes('world') || norm === 'title') return 160;
  if (norm === 'cl' || norm === 'c1' || norm.includes('champions')) return 150;
  if (norm === 'promotion_playoff' || norm.includes('playoff')) return 130;
  if (norm === 'el' || norm.includes('europa')) return 130;
  if (norm === 'dfb' || norm === 'efl' || norm.includes('pokal') || norm.includes('cup')) return 130;
  if (norm === 'ecl' || norm.includes('conference')) return 110;
  if (norm === 'relegation') return 110;
  
  if (prestigeLevel === 5) return 160;
  if (prestigeLevel === 4) return 130;
  if (prestigeLevel === 3) return 110;
  if (prestigeLevel === 2) return 95;
  return 85; // Level 1 - Grassroots Cup
};

export const PrestigeTrophy: React.FC<PrestigeTrophyProps> = ({
  type,
  size,
  className = '',
  showStars = true,
}) => {
  const norm = (type || '').toLowerCase().trim();
  const prestige = getTrophyPrestigeLevel(norm);
  const baseHeight = size ?? getDefaultTrophyHeight(prestige, norm);
  const baseWidth = Math.round(baseHeight * 0.88);

  const starCount = prestige;

  // Render SVG based on tournament identity
  const renderSvg = () => {
    // 1. FIFA Club World Cup (CWC) - Royal Radiant Gold with Orbiting Celestial Rings
    if (norm === 'cwc' || norm.includes('world')) {
      return (
        <svg
          viewBox="0 0 160 180"
          width={baseWidth}
          height={baseHeight}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="cwcGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="25%" stopColor="#FBBF24" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="cwcPedestal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3F3F46" />
              <stop offset="50%" stopColor="#18181B" />
              <stop offset="100%" stopColor="#09090B" />
            </linearGradient>
            <radialGradient id="cwcGlobeGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="85%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </radialGradient>
            <filter id="cwcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ambient Glow */}
          <circle cx="80" cy="75" r="45" fill="#F59E0B" opacity="0.25" filter="url(#cwcGlow)" />

          {/* Pedestal Base */}
          <path d="M 45 155 L 115 155 L 125 172 L 35 172 Z" fill="url(#cwcPedestal)" stroke="#F59E0B" strokeWidth="1.5" />
          <rect x="42" y="145" width="76" height="10" rx="2" fill="url(#cwcGoldGrad)" stroke="#B45309" strokeWidth="1" />
          <rect x="52" y="132" width="56" height="13" rx="1.5" fill="url(#cwcPedestal)" stroke="#F59E0B" strokeWidth="1" />

          {/* Golden Plaque */}
          <rect x="62" y="148" width="36" height="5" rx="1" fill="#FEF08A" opacity="0.9" />

          {/* Dynamic Orbital Pillars */}
          <path d="M 52 132 C 40 100, 42 70, 60 48 C 65 65, 60 105, 52 132 Z" fill="url(#cwcGoldGrad)" opacity="0.9" />
          <path d="M 108 132 C 120 100, 118 70, 100 48 C 95 65, 100 105, 108 132 Z" fill="url(#cwcGoldGrad)" opacity="0.9" />

          {/* Central World Globe */}
          <circle cx="80" cy="72" r="30" fill="url(#cwcGlobeGlow)" stroke="#FEF08A" strokeWidth="1.5" />

          {/* Globe Latitude & Longitude Arcs */}
          <ellipse cx="80" cy="72" rx="30" ry="12" fill="none" stroke="#FFFBEB" strokeWidth="1.2" opacity="0.75" />
          <ellipse cx="80" cy="72" rx="14" ry="30" fill="none" stroke="#FFFBEB" strokeWidth="1.2" opacity="0.75" />
          <line x1="80" y1="42" x2="80" y2="102" stroke="#FFFBEB" strokeWidth="1.2" opacity="0.8" />

          {/* Crown Ring at the Top */}
          <path d="M 68 38 L 80 26 L 92 38 L 88 44 L 72 44 Z" fill="url(#cwcGoldGrad)" stroke="#FEF08A" strokeWidth="1" />
          <circle cx="80" cy="24" r="3" fill="#FFFBEB" />
          <circle cx="68" cy="38" r="2" fill="#FFFBEB" />
          <circle cx="92" cy="38" r="2" fill="#FFFBEB" />

          {/* Glimmer Sparkles */}
          <polygon points="80,14 82,19 87,21 82,23 80,28 78,23 73,21 78,19" fill="#FFFFFF" opacity="0.9" />
          <polygon points="118,65 119,68 122,69 119,70 118,73 117,70 114,69 117,68" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );
    }

    // 2. UEFA Champions League (CL) - Monumental Big Ears Cup in Midnight Sapphire & Brilliant Silver
    if (norm === 'cl' || norm === 'c1' || norm.includes('champions')) {
      return (
        <svg
          viewBox="0 0 160 180"
          width={baseWidth}
          height={baseHeight}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="uclSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#E0F2FE" />
              <stop offset="65%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="uclHandleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <radialGradient id="uclStarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
            </radialGradient>
            <filter id="uclGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ambient Sapphire Glow */}
          <circle cx="80" cy="80" r="50" fill="url(#uclStarGlow)" filter="url(#uclGlow)" />

          {/* Pedestal */}
          <path d="M 48 152 L 112 152 L 122 170 L 38 170 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="44" y="142" width="72" height="10" rx="2" fill="url(#uclSilverGrad)" stroke="#0284C7" strokeWidth="1" />
          <rect x="58" y="128" width="44" height="14" rx="2" fill="url(#uclHandleGrad)" stroke="#38BDF8" strokeWidth="1" />

          {/* Massive Iconic Flared Handles ("The Big Ears") */}
          {/* Left Handle */}
          <path
            d="M 54 44 C 14 36, 6 92, 42 120 C 34 100, 30 58, 54 54 Z"
            fill="url(#uclHandleGrad)"
            stroke="#E0F2FE"
            strokeWidth="1.2"
          />
          {/* Right Handle */}
          <path
            d="M 106 44 C 146 36, 154 92, 118 120 C 126 100, 130 58, 106 54 Z"
            fill="url(#uclHandleGrad)"
            stroke="#E0F2FE"
            strokeWidth="1.2"
          />

          {/* Main Chalice Body */}
          <path
            d="M 50 36 C 50 85, 58 126, 80 128 C 102 126, 110 85, 110 36 Z"
            fill="url(#uclSilverGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />

          {/* Chalice Lip & Rim */}
          <ellipse cx="80" cy="36" rx="30" ry="6" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="1.5" />

          {/* Fluted Vertical Highlights on Cup */}
          <path d="M 68 44 Q 70 85 76 122" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M 80 44 Q 80 85 80 124" stroke="#FFFFFF" strokeWidth="2.5" fill="none" opacity="0.8" />
          <path d="M 92 44 Q 90 85 84 122" stroke="#0284C7" strokeWidth="2" fill="none" opacity="0.5" />

          {/* Continental Star Motif on Chalice Center */}
          <polygon
            points="80,68 83,76 91,76 85,81 87,89 80,84 73,89 75,81 69,76 77,76"
            fill="#FFFFFF"
            stroke="#0284C7"
            strokeWidth="0.8"
          />

          {/* Sparkles */}
          <polygon points="126,36 128,40 132,41 128,42 126,46 124,42 120,41 124,40" fill="#FFFFFF" />
          <polygon points="34,36 36,40 40,41 36,42 34,46 32,42 28,41 32,40" fill="#FFFFFF" />
        </svg>
      );
    }

    // 3. UEFA Europa League (EL) - Fiery Octagonal Hammered Metal Chalice
    if (norm === 'el' || norm.includes('europa')) {
      return (
        <svg
          viewBox="0 0 160 180"
          width={baseWidth}
          height={baseHeight}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="elOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFEDD5" />
              <stop offset="25%" stopColor="#FB923C" />
              <stop offset="60%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>
            <linearGradient id="elBronzeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#7C2D12" />
            </linearGradient>
            <filter id="elGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Fiery Ember Glow */}
          <circle cx="80" cy="80" r="45" fill="#EA580C" opacity="0.25" filter="url(#elGlow)" />

          {/* Sturdy Geometric Pedestal */}
          <polygon points="50,154 110,154 118,170 42,170" fill="#1C1917" stroke="#EA580C" strokeWidth="1.5" />
          <rect x="46" y="144" width="68" height="10" rx="1.5" fill="url(#elOrangeGrad)" stroke="#9A3412" strokeWidth="1" />
          <polygon points="56,126 104,126 100,144 60,144" fill="url(#elBronzeGrad)" stroke="#F97316" strokeWidth="1" />

          {/* Octagonal Flared Trophy Body */}
          <polygon
            points="46,34 114,34 98,126 62,126"
            fill="url(#elOrangeGrad)"
            stroke="#FED7AA"
            strokeWidth="1.5"
          />

          {/* Faceted Panels */}
          <polygon points="62,34 76,34 74,126 62,126" fill="#FDBA74" opacity="0.4" />
          <polygon points="76,34 84,34 82,126 78,126" fill="#FFF7ED" opacity="0.6" />
          <polygon points="84,34 98,34 90,126 82,126" fill="#C2410C" opacity="0.3" />

          {/* Angular Geometric Handles */}
          <path d="M 46 44 L 28 62 L 32 94 L 66 114 L 64 104 L 38 88 L 36 66 L 48 52 Z" fill="url(#elBronzeGrad)" stroke="#FED7AA" strokeWidth="1" />
          <path d="M 114 44 L 132 62 L 128 94 L 94 114 L 96 104 L 122 88 L 124 66 L 112 52 Z" fill="url(#elBronzeGrad)" stroke="#FED7AA" strokeWidth="1" />

          {/* Top Hexagonal Opening Rim */}
          <polygon points="46,34 80,26 114,34 80,40" fill="#FFEDD5" stroke="#EA580C" strokeWidth="1.5" />

          {/* Sparkles */}
          <polygon points="80,18 82,22 86,23 82,24 80,28 78,24 74,23 78,22" fill="#FFFFFF" />
        </svg>
      );
    }

    // 4. UEFA Conference League (ECL) - Sculpted Fluted Twisted Emerald Chalice
    if (norm === 'ecl' || norm.includes('conference')) {
      return (
        <svg
          viewBox="0 0 160 180"
          width={baseWidth}
          height={baseHeight}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="eclEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="30%" stopColor="#34D399" />
              <stop offset="70%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
            <linearGradient id="eclSilverRib" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <filter id="eclGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Emerald Glow */}
          <circle cx="80" cy="80" r="42" fill="#059669" opacity="0.25" filter="url(#eclGlow)" />

          {/* Pedestal Base */}
          <path d="M 52 152 L 108 152 L 116 168 L 44 168 Z" fill="#064E3B" stroke="#34D399" strokeWidth="1.5" />
          <rect x="48" y="142" width="64" height="10" rx="2" fill="url(#eclEmeraldGrad)" stroke="#047857" strokeWidth="1" />
          <rect x="58" y="128" width="44" height="14" rx="2" fill="#065F46" stroke="#34D399" strokeWidth="1" />

          {/* Curved Twisted Slender Chalice */}
          <path
            d="M 54 36 C 58 75, 62 110, 68 128 L 92 128 C 98 110, 102 75, 106 36 Z"
            fill="url(#eclEmeraldGrad)"
            stroke="#A7F3D0"
            strokeWidth="1.5"
          />

          {/* 32 Curved Characteristic Spines / Ribs */}
          <path d="M 58 38 Q 66 85 70 126" stroke="url(#eclSilverRib)" strokeWidth="2.5" fill="none" />
          <path d="M 68 38 Q 74 85 76 126" stroke="url(#eclSilverRib)" strokeWidth="2.5" fill="none" />
          <path d="M 80 38 Q 80 85 80 126" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          <path d="M 92 38 Q 86 85 84 126" stroke="url(#eclSilverRib)" strokeWidth="2.5" fill="none" />
          <path d="M 102 38 Q 94 85 90 126" stroke="url(#eclSilverRib)" strokeWidth="2.5" fill="none" />

          {/* Oval Emerald Mouth */}
          <ellipse cx="80" cy="36" rx="26" ry="6" fill="#D1FAE5" stroke="#059669" strokeWidth="1.5" />

          {/* Glimmer */}
          <polygon points="80,18 82,22 86,23 82,24 80,28 78,24 74,23 78,22" fill="#FFFFFF" />
        </svg>
      );
    }

    // 5. National Domestic Cup (DFB-Pokal, FA Cup, Copa del Rey, Taça, EFL) - Regal Gold & Imperial Goblet
    if (norm === 'dfb' || norm === 'efl' || norm.includes('pokal') || norm.includes('cup') || norm.includes('taca') || norm.includes('copa')) {
      return (
        <svg
          viewBox="0 0 160 180"
          width={baseWidth}
          height={baseHeight}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="dfbGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="35%" stopColor="#FACC15" />
              <stop offset="70%" stopColor="#CA8A04" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
            <linearGradient id="dfbEmeraldJewel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
            <filter id="dfbGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Warm Golden Glow */}
          <circle cx="80" cy="78" r="46" fill="#FACC15" opacity="0.25" filter="url(#dfbGlow)" />

          {/* Layered Pedestal Base */}
          <path d="M 46 154 L 114 154 L 122 170 L 38 170 Z" fill="#27272A" stroke="#EAB308" strokeWidth="1.5" />
          <rect x="42" y="144" width="76" height="10" rx="2" fill="url(#dfbGoldGrad)" stroke="#A16207" strokeWidth="1" />
          <rect x="54" y="128" width="52" height="16" rx="2" fill="url(#dfbEmeraldJewel)" stroke="#EAB308" strokeWidth="1" />

          {/* Ornate Scrolled Handles */}
          <path
            d="M 52 46 C 24 44, 20 86, 50 106 C 36 94, 34 60, 52 56 Z"
            fill="url(#dfbGoldGrad)"
            stroke="#FEF08A"
            strokeWidth="1.2"
          />
          <path
            d="M 108 46 C 136 44, 140 86, 110 106 C 124 94, 126 60, 108 56 Z"
            fill="url(#dfbGoldGrad)"
            stroke="#FEF08A"
            strokeWidth="1.2"
          />

          {/* Majestic Goblet Body */}
          <path
            d="M 50 38 Q 48 88 80 128 Q 112 88 110 38 Z"
            fill="url(#dfbGoldGrad)"
            stroke="#FEF9C3"
            strokeWidth="1.5"
          />

          {/* Emerald Jewel Band across Waist */}
          <path d="M 56 70 Q 80 76 104 70 L 102 78 Q 80 84 58 78 Z" fill="url(#dfbEmeraldJewel)" stroke="#FEF08A" strokeWidth="1" />
          <circle cx="70" cy="74" r="2.5" fill="#FEF08A" />
          <circle cx="80" cy="76" r="3" fill="#FFFFFF" />
          <circle cx="90" cy="74" r="2.5" fill="#FEF08A" />

          {/* Goblet Lip */}
          <ellipse cx="80" cy="38" rx="30" ry="7" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="1.5" />

          {/* Central Highlight */}
          <path d="M 80 44 L 80 122" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.75" />

          {/* Sparkles */}
          <polygon points="80,18 82,23 87,24 82,25 80,30 78,25 73,24 78,23" fill="#FFFFFF" />
        </svg>
      );
    }

    // 6. Title Decider / League Championship - Royal Meister Crown & Golden Championship Platter
    if (norm === 'title' || norm === 'bl_champions' || norm === 'b2_champions' || norm === 'l3_champions' || norm === 'reg_champions' || norm === 'ob_champions' || norm === 'bl' || norm.includes('meister')) {
      return (
        <svg
          viewBox="0 0 160 180"
          width={baseWidth}
          height={baseHeight}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="titleCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="30%" stopColor="#FDE047" />
              <stop offset="70%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
            <radialGradient id="titleSunburst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FACC15" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
            </radialGradient>
            <filter id="titleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Sunburst Glory Glow */}
          <circle cx="80" cy="80" r="55" fill="url(#titleSunburst)" filter="url(#titleGlow)" />

          {/* Massive Pedestal */}
          <path d="M 44 154 L 116 154 L 126 172 L 34 172 Z" fill="#18181B" stroke="#FACC15" strokeWidth="1.5" />
          <rect x="40" y="142" width="80" height="12" rx="2" fill="url(#titleCrownGrad)" stroke="#A16207" strokeWidth="1" />
          <rect x="52" y="126" width="56" height="16" rx="2" fill="#27272A" stroke="#FACC15" strokeWidth="1" />

          {/* Grand Championship Laurel Wreath Ring */}
          <circle cx="80" cy="76" r="44" fill="none" stroke="#FACC15" strokeWidth="2.5" strokeDasharray="6 3" opacity="0.6" />

          {/* Royal Crown of Champions */}
          <path
            d="M 44 94 L 40 46 L 60 64 L 80 34 L 100 64 L 120 46 L 116 94 Z"
            fill="url(#titleCrownGrad)"
            stroke="#FEF9C3"
            strokeWidth="1.8"
          />

          {/* Crown Jewels on the 5 Peaks */}
          <circle cx="40" cy="44" r="4" fill="#FFFFFF" stroke="#EAB308" strokeWidth="1" />
          <circle cx="60" cy="62" r="3" fill="#60A5FA" stroke="#EAB308" strokeWidth="1" />
          <circle cx="80" cy="32" r="5" fill="#FFFFFF" stroke="#EAB308" strokeWidth="1.2" />
          <circle cx="100" cy="62" r="3" fill="#60A5FA" stroke="#EAB308" strokeWidth="1" />
          <circle cx="120" cy="44" r="4" fill="#FFFFFF" stroke="#EAB308" strokeWidth="1" />

          {/* Crown Filigree Band */}
          <rect x="44" y="94" width="72" height="14" rx="2" fill="url(#titleCrownGrad)" stroke="#A16207" strokeWidth="1" />
          <circle cx="56" cy="101" r="2.5" fill="#EF4444" />
          <circle cx="68" cy="101" r="2.5" fill="#3B82F6" />
          <circle cx="80" cy="101" r="3" fill="#FFFFFF" />
          <circle cx="92" cy="101" r="2.5" fill="#3B82F6" />
          <circle cx="104" cy="101" r="2.5" fill="#EF4444" />

          {/* Golden Centerpiece Star */}
          <polygon
            points="80,108 82,114 88,114 83,118 85,124 80,120 75,124 77,118 72,114 78,114"
            fill="#FFFBEB"
          />

          {/* Brilliant Crown Sparkle */}
          <polygon points="80,14 83,21 90,23 83,25 80,32 77,25 70,23 77,21" fill="#FFFFFF" />
        </svg>
      );
    }

    // 7. Promotion Playoff - Modern Ascending Sky-Cyan Victory Wings & Chevron
    if (norm === 'promotion_playoff' || norm.includes('playoff')) {
      return (
        <svg
          viewBox="0 0 160 180"
          width={baseWidth}
          height={baseHeight}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="promoCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECFEFF" />
              <stop offset="30%" stopColor="#67E8F9" />
              <stop offset="70%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0E7490" />
            </linearGradient>
            <linearGradient id="promoAscent" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0891B2" />
              <stop offset="100%" stopColor="#A5F3FC" />
            </linearGradient>
            <filter id="promoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Electric Cyan Glow */}
          <circle cx="80" cy="80" r="48" fill="#06B6D4" opacity="0.3" filter="url(#promoGlow)" />

          {/* Stepped Ascending Pedestal */}
          <path d="M 44 154 L 116 154 L 124 170 L 36 170 Z" fill="#082F49" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="42" y="142" width="76" height="12" rx="2" fill="url(#promoCyanGrad)" stroke="#0E7490" strokeWidth="1" />
          <rect x="54" y="126" width="52" height="16" rx="2" fill="#075985" stroke="#38BDF8" strokeWidth="1" />

          {/* Left Wing */}
          <path
            d="M 64 126 C 42 100, 26 62, 38 32 C 48 58, 62 86, 68 116 Z"
            fill="url(#promoCyanGrad)"
            stroke="#CFFAFE"
            strokeWidth="1.2"
          />
          {/* Right Wing */}
          <path
            d="M 96 126 C 118 100, 134 62, 122 32 C 112 58, 98 86, 92 116 Z"
            fill="url(#promoCyanGrad)"
            stroke="#CFFAFE"
            strokeWidth="1.2"
          />

          {/* Central Ascending Chevron Tower (Moving to Higher Division) */}
          <polygon
            points="80,30 102,68 88,68 88,126 72,126 72,68 58,68"
            fill="url(#promoAscent)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />

          {/* Higher Division Upward Chevron Markers */}
          <polyline points="66,80 80,62 94,80" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <polyline points="70,98 80,84 90,98" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

          {/* Shining Pinnacle Star */}
          <polygon points="80,14 83,21 90,23 83,25 80,32 77,25 70,23 77,21" fill="#FFFFFF" />
        </svg>
      );
    }

    // 8. Relegation / Survival Battle - Iron Fortress Heraldic Shield & Crossed Steel Swords
    if (norm === 'relegation') {
      return (
        <svg
          viewBox="0 0 160 180"
          width={baseWidth}
          height={baseHeight}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="relShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE4E6" />
              <stop offset="30%" stopColor="#F43F5E" />
              <stop offset="70%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="relSteel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <filter id="relGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Defiant Blood-Crimson Glow */}
          <circle cx="80" cy="80" r="45" fill="#E11D48" opacity="0.3" filter="url(#relGlow)" />

          {/* Fortified Stone Pedestal */}
          <path d="M 44 154 L 116 154 L 124 170 L 36 170 Z" fill="#1E293B" stroke="#F43F5E" strokeWidth="1.5" />
          <rect x="42" y="142" width="76" height="12" rx="2" fill="url(#relSteel)" stroke="#475569" strokeWidth="1" />
          <rect x="54" y="126" width="52" height="16" rx="2" fill="#4C0519" stroke="#E11D48" strokeWidth="1" />

          {/* Crossed Steel Swords Behind Shield */}
          <line x1="30" y1="36" x2="130" y2="136" stroke="url(#relSteel)" strokeWidth="4" strokeLinecap="round" />
          <line x1="130" y1="36" x2="30" y2="136" stroke="url(#relSteel)" strokeWidth="4" strokeLinecap="round" />

          {/* Heavy Heraldic Guardian Shield */}
          <path
            d="M 44 42 L 116 42 C 116 88, 104 122, 80 136 C 56 122, 44 88, 44 42 Z"
            fill="url(#relShieldGrad)"
            stroke="#FECDD3"
            strokeWidth="2"
          />

          {/* Inner Shield Rim */}
          <path
            d="M 50 48 L 110 48 C 110 86, 100 114, 80 126 C 60 114, 50 86, 50 48 Z"
            fill="#4C0519"
            stroke="#FB7185"
            strokeWidth="1.2"
          />

          {/* Guardian Heraldic Lion / Fortress Rampart */}
          <path
            d="M 70 88 L 70 66 L 75 66 L 75 62 L 80 62 L 80 66 L 85 66 L 85 62 L 90 62 L 90 88 Z"
            fill="url(#relSteel)"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <circle cx="80" cy="74" r="3" fill="#E11D48" />

          {/* Steel Rivets */}
          <circle cx="48" cy="46" r="2" fill="#F1F5F9" />
          <circle cx="112" cy="46" r="2" fill="#F1F5F9" />
          <circle cx="80" cy="132" r="2" fill="#F1F5F9" />

          {/* Defiant Sparkle */}
          <polygon points="80,24 82,28 86,29 82,30 80,34 78,30 74,29 78,28" fill="#FFFFFF" />
        </svg>
      );
    }

    // 9. Regional / Grassroots / Lower Cup - Honest Classic Silver-Bronze Chalice
    return (
      <svg
        viewBox="0 0 160 180"
        width={baseWidth}
        height={baseHeight}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="grassBronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="40%" stopColor="#D97706" />
            <stop offset="80%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="grassRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <filter id="grassGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Rustic Bronze Glow */}
        <circle cx="80" cy="80" r="38" fill="#D97706" opacity="0.2" filter="url(#grassGlow)" />

        {/* Honest Wooden Block Pedestal */}
        <path d="M 48 152 L 112 152 L 118 168 L 42 168 Z" fill="#292524" stroke="#D97706" strokeWidth="1.5" />
        <rect x="46" y="142" width="68" height="10" rx="1.5" fill="url(#grassBronzeGrad)" stroke="#78350F" strokeWidth="1" />
        <rect x="56" y="128" width="48" height="14" rx="1.5" fill="#44403C" stroke="#D97706" strokeWidth="1" />

        {/* Simple Honest Curved Handles */}
        <path d="M 54 50 C 32 50, 30 84, 56 96 C 44 86, 42 62, 54 58 Z" fill="url(#grassBronzeGrad)" stroke="#FEF3C7" strokeWidth="1" />
        <path d="M 106 50 C 128 50, 130 84, 104 96 C 116 86, 118 62, 106 58 Z" fill="url(#grassBronzeGrad)" stroke="#FEF3C7" strokeWidth="1" />

        {/* Cup Body */}
        <path
          d="M 52 42 Q 52 88 80 126 Q 108 88 108 42 Z"
          fill="url(#grassBronzeGrad)"
          stroke="#FDE68A"
          strokeWidth="1.2"
        />

        {/* Grassroots Ribbon around Base */}
        <path d="M 58 116 Q 80 122 102 116 L 100 124 Q 80 130 60 124 Z" fill="url(#grassRibbon)" />

        {/* Rim */}
        <ellipse cx="80" cy="42" rx="28" ry="6" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.2" />

        {/* Modest Shine */}
        <line x1="80" y1="48" x2="80" y2="120" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
      </svg>
    );
  };

  return (
    <div className={`relative inline-flex flex-col items-center justify-center shrink-0 ${className}`}>
      {/* Dynamic Rendered SVG Trophy */}
      <div className="relative flex items-center justify-center transition-transform duration-300">
        {renderSvg()}
      </div>

      {/* Prestige Stars Badge */}
      {showStars && (
        <div className="flex items-center justify-center gap-1 mt-1 text-xs select-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`${
                i < starCount
                  ? norm === 'cl'
                    ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                    : norm === 'el'
                    ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                    : norm === 'ecl'
                    ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    : norm === 'promotion_playoff'
                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : norm === 'relegation'
                    ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                    : 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'text-zinc-700'
              }`}
            >
              ★
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
