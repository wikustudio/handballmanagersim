import React from 'react';

interface HandballSimLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const HandballSimLogo: React.FC<HandballSimLogoProps> = ({
  className = 'w-8 h-8',
  size,
  showText = false,
}) => {
  const sizeStyle = size ? { width: size, height: size } : undefined;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${showText ? '' : 'shrink-0'}`}>
      <div 
        className={`relative rounded-xl overflow-hidden shadow-sm flex items-center justify-center border border-white/[0.06] bg-[#14151e] shrink-0 ${className}`}
        style={sizeStyle}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="400" height="400" rx="32" fill="#14151e" />
          <g fill="#ffffff" fillRule="evenodd">
            {/* Handball in player hand */}
            <circle cx="123" cy="114" r="23.5" />

            {/* Official jumping throwing handball player silhouette */}
            <path d="
              M 130 119
              C 134 128 142 142 153 151
              C 161 157 170 160 178 153
              C 183 148 181 140 188 135
              C 194 130 205 130 216 132
              C 222 126 226 116 230 106
              C 233 97 241 89 252 88
              C 261 88 266 95 264 106
              C 263 115 258 122 254 128
              C 264 126 278 122 291 113
              C 301 106 312 95 319 90
              C 324 86 329 88 327 94
              C 325 101 319 110 314 117
              C 307 125 296 134 286 140
              C 275 146 268 148 263 158
              C 256 172 250 189 242 205
              C 238 214 233 223 226 231
              C 220 238 211 245 204 252
              C 197 259 188 270 180 282
              C 174 291 168 300 157 307
              C 148 313 137 315 126 312
              C 116 309 111 300 115 291
              C 120 282 133 275 142 265
              C 148 258 152 248 154 238
              C 142 242 129 244 116 242
              C 101 240 88 235 81 228
              C 75 222 79 215 89 211
              C 102 206 122 204 140 202
              C 149 194 157 184 161 172
              C 152 168 141 158 133 146
              C 127 137 127 127 130 119
              Z
            " />
          </g>
        </svg>
      </div>

      {showText && (
        <span className="text-lg font-semibold tracking-tight text-white font-sans">
          Handball Manager Sim
        </span>
      )}
    </div>
  );
};
