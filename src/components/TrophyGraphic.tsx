import React from 'react';

interface TrophyGraphicProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStars?: boolean;
  type?: 'cup' | 'league' | 'euro' | 'globe';
}

export const TrophyGraphic: React.FC<TrophyGraphicProps> = ({
  className = '',
  size = 'md',
  showStars = true,
  type = 'euro',
}) => {
  const sizeMap = {
    sm: { w: 48, h: 56, stars: 'text-[9px] gap-1' },
    md: { w: 72, h: 84, stars: 'text-xs gap-1.5' },
    lg: { w: 96, h: 112, stars: 'text-sm gap-2' },
    xl: { w: 128, h: 148, stars: 'text-base gap-2.5' },
  };

  const currentSize = sizeMap[size];

  // Colors based on competition type
  const isGold = type === 'league';
  const isGlobe = type === 'globe';

  const primaryGradientId = `trophy-grad-${type}-${size}`;
  const plinthGradientId = `plinth-grad-${type}-${size}`;
  const highlightGradientId = `highlight-grad-${type}-${size}`;

  return (
    <div className={`flex flex-col items-center justify-center shrink-0 ${className}`}>
      {/* SVG Trophy Vector Illustration matching user screenshot */}
      <svg
        width={currentSize.w}
        height={currentSize.h}
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_10px_25px_rgba(56,189,248,0.25)] filter"
      >
        <defs>
          {/* Main Cup Metallic Gradient */}
          <linearGradient id={primaryGradientId} x1="20" y1="15" x2="80" y2="75" gradientUnits="userSpaceOnUse">
            {isGold ? (
              <>
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#facc15" />
                <stop offset="70%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </>
            ) : isGlobe ? (
              <>
                <stop offset="0%" stopColor="#e0e7ff" />
                <stop offset="40%" stopColor="#818cf8" />
                <stop offset="80%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4338ca" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f0f9ff" />
                <stop offset="30%" stopColor="#bae6fd" />
                <stop offset="65%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </>
            )}
          </linearGradient>

          {/* Stepped Pedestal Base Gradient */}
          <linearGradient id={plinthGradientId} x1="25" y1="85" x2="75" y2="115" gradientUnits="userSpaceOnUse">
            {isGold ? (
              <>
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#854d0e" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0c4a6e" />
              </>
            )}
          </linearGradient>

          {/* High Gloss Glare */}
          <linearGradient id={highlightGradientId} x1="30" y1="15" x2="50" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Left Curved Ear Handle */}
        <path
          d="M32 24 C14 24 10 42 16 56 C21 68 33 68 36 67 C34 62 26 59 23 51 C20 42 22 32 32 30 Z"
          fill={`url(#${primaryGradientId})`}
          stroke={isGold ? '#ca8a04' : '#0284c7'}
          strokeWidth="1.5"
        />

        {/* Right Curved Ear Handle */}
        <path
          d="M68 24 C86 24 90 42 84 56 C79 68 67 68 64 67 C66 62 74 59 77 51 C80 42 78 32 68 30 Z"
          fill={`url(#${primaryGradientId})`}
          stroke={isGold ? '#ca8a04' : '#0284c7'}
          strokeWidth="1.5"
        />

        {/* Main Central Trophy Bowl */}
        <path
          d="M28 16 C28 16 28 60 50 68 C72 60 72 16 72 16 L28 16 Z"
          fill={`url(#${primaryGradientId})`}
          stroke={isGold ? '#eab308' : '#38bdf8'}
          strokeWidth="1.5"
        />

        {/* Gloss / Glare Accent on left bowl */}
        <path
          d="M32 20 C32 20 32 50 46 58 C38 52 35 34 35 20 Z"
          fill={`url(#${highlightGradientId})`}
        />

        {/* Star Crest in Center of Bowl */}
        <path
          d="M50 30 L52.5 36.5 L59.5 36.8 L54 41 L56 47.5 L50 43.5 L44 47.5 L46 41 L40.5 36.8 L47.5 36.5 Z"
          fill="#ffffff"
          opacity="0.9"
        />

        {/* Trophy Neck Stem */}
        <path
          d="M44 68 L56 68 L54 82 L46 82 Z"
          fill={`url(#${primaryGradientId})`}
          stroke={isGold ? '#ca8a04' : '#0284c7'}
          strokeWidth="1"
        />

        {/* Stepped Pedestal Top Tier */}
        <rect
          x="36"
          y="82"
          width="28"
          height="6"
          rx="2"
          fill={`url(#${primaryGradientId})`}
        />

        {/* Stepped Pedestal Middle Tier */}
        <rect
          x="30"
          y="88"
          width="40"
          height="8"
          rx="2.5"
          fill={`url(#${plinthGradientId})`}
          stroke={isGold ? '#ca8a04' : '#0284c7'}
          strokeWidth="1"
        />

        {/* Stepped Pedestal Bottom Foundation Plinth */}
        <path
          d="M24 96 L76 96 L80 108 L20 108 Z"
          fill={`url(#${plinthGradientId})`}
          stroke={isGold ? '#a16207' : '#0369a1'}
          strokeWidth="1.5"
        />
        
        {/* Base Highlight Strip */}
        <rect
          x="26"
          y="98"
          width="48"
          height="2"
          rx="1"
          fill="#ffffff"
          opacity="0.35"
        />
      </svg>

      {/* 5 Cyan Glowing Stars underneath trophy */}
      {showStars && (
        <div className={`flex items-center justify-center mt-1.5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] ${currentSize.stars}`}>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
        </div>
      )}
    </div>
  );
};
