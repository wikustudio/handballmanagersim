import React, { useId } from 'react';

interface HandballSimLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const HandballSimLogo: React.FC<HandballSimLogoProps> = ({
  className = 'w-8 h-8',
  size,
  showText = false,
  variant = 'dark',
}) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `hms-bg-${uid}`;
  const clipId = `hms-ball-${uid}`;
  const sizeStyle = size ? { width: size, height: size } : undefined;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${showText ? '' : 'shrink-0'}`}>
      <div
        className={`relative rounded-xl overflow-hidden shadow-xs flex items-center justify-center shrink-0 ${className}`}
        style={sizeStyle}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="40" y1="24" x2="360" y2="384" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EC7236" />
              <stop offset="55%" stopColor="#DF642A" />
              <stop offset="100%" stopColor="#BC4511" />
            </linearGradient>
            <clipPath id={clipId}>
              <circle cx="200" cy="186" r="102" />
            </clipPath>
          </defs>

          {/* Courtside Rounded Squircle Badge */}
          <rect width="400" height="400" rx="88" fill={`url(#${gradId})`} />
          <rect
            x="16"
            y="16"
            width="368"
            height="368"
            rx="74"
            stroke="#FFFFFF"
            strokeOpacity="0.22"
            strokeWidth="6"
          />

          {/* 6m Goal-Crease Court Arc */}
          <path
            d="M 72 338 C 114 290 286 290 328 338"
            stroke="#FFFFFF"
            strokeOpacity="0.34"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Exact 5-Fold Symmetric Stitched Indoor Handball */}
          <circle cx="200" cy="186" r="102" fill="#FFFFFF" />
          <g clipPath={`url(#${clipId})`}>
            <polygon
              points="200,140 243.7,171.8 227,223.2 173,223.2 156.3,171.8"
              fill="#C94E18"
            />
            <g
              stroke="#C94E18"
              strokeWidth="12.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <line x1="200" y1="140" x2="200" y2="104" />
              <polyline points="164,78 200,104 236,78" />

              <line x1="243.7" y1="171.8" x2="278" y2="160.7" />
              <polyline points="291,118 278,160.7 314,186" />

              <line x1="227" y1="223.2" x2="248.2" y2="252.3" />
              <polyline points="290,239 248.2,252.3 248,296" />

              <line x1="173" y1="223.2" x2="151.8" y2="252.3" />
              <polyline points="152,296 151.8,252.3 110,239" />

              <line x1="156.3" y1="171.8" x2="122" y2="160.7" />
              <polyline points="86,186 122,160.7 109,118" />
            </g>
          </g>
        </svg>
      </div>

      {showText && (
        <span
          className={`text-lg font-bold tracking-tight font-sans ${
            variant === 'light' ? 'text-[#14161D]' : 'text-white'
          }`}
        >
          Handball Manager
        </span>
      )}
    </div>
  );
};
