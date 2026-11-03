import React, { useState, useEffect } from 'react';
import { BroadcastingPackage } from '../data/broadcastingPackages';
import { isAnyModActive } from '../utils/modManager';

export interface BroadcastLogoProps {
  packageOrKey?: BroadcastingPackage | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  isModActive?: boolean;
}

export const BroadcastLogo: React.FC<BroadcastLogoProps> = ({
  packageOrKey,
  size = 'md',
  showLabel = false,
  className = '',
  isModActive,
}) => {
  const [, setModTick] = useState(0);
  useEffect(() => {
    const onModChange = () => setModTick(t => t + 1);
    window.addEventListener('mod-state-change', onModChange);
    return () => window.removeEventListener('mod-state-change', onModChange);
  }, []);

  const modActive = isModActive !== undefined ? isModActive : isAnyModActive();

  // Resolve logo key and package metadata
  let key = 'COURTVISION';
  let networkName = 'CourtVision';

  if (typeof packageOrKey === 'string') {
    key = packageOrKey.toUpperCase();
  } else if (packageOrKey) {
    key = (packageOrKey.logoKey || '').toUpperCase();
    networkName = packageOrKey.networkName;

    // Fallback key resolution from package properties if logoKey wasn't explicit
    if (!key) {
      const name = (packageOrKey.networkName || '').toUpperCase();
      const badge = (packageOrKey.networkBadge || '').toUpperCase();

      if (name.includes('DYN') || badge.includes('DYN')) key = 'DYN';
      else if (name.includes('DAZN') || badge.includes('DAZN')) key = 'DAZN';
      else if (name.includes('BEIN') || badge.includes('BEIN')) key = 'BEIN';
      else if (name.includes('TV 2') || badge.includes('TV 2')) key = 'TV2';
      else if (name.includes('ARD') || badge.includes('ARD') || name.includes('ERSTE')) key = 'ARD';
      else if (name.includes('ZDF') || badge.includes('ZDF')) key = 'ZDF';
      else if (name.includes('TELEDEPORTE') || name.includes('RTVE') || badge.includes('TDP')) key = 'TELEDEPORTE';
      else if (name.includes('SVT') || badge.includes('SVT')) key = 'SVT';
      else if (name.includes('ARENA') || badge.includes('ARENA')) key = 'ARENA_SPORT';
      else if (name.includes('PORTO CANAL') || badge.includes('PORTO CANAL')) key = 'PORTO_CANAL';
      else if (name.includes('ANDEBOL TV') || badge.includes('ANDEBOL TV')) key = 'ANDEBOL_TV';
      else if (name.includes('SPORTING TV') || badge.includes('SPORTING TV')) key = 'SPORTING_TV';
      else if (name.includes('BTV') || badge.includes('BTV') || name.includes('BENFICA TV')) key = 'BTV';
      else if (name.includes('RTP') || badge.includes('RTP')) key = 'RTP';
      else if (name.includes('SPORT TV') || badge.includes('SPORT TV') || name.includes('SPORTTV')) key = 'SPORT_TV';
      else if (name.includes('TVP') || badge.includes('TVP')) key = 'TVP';
      else if (name.includes('ORF') || badge.includes('ORF')) key = 'ORF';
      else if (name.includes('SRF') || badge.includes('SRF')) key = 'SRF';
      else if (name.includes('DR ') || badge.includes('DR')) key = 'DR';
      else if (name.includes('FRANCE') || badge.includes('FRANCE')) key = 'FRANCE_TV';
      else if (name.includes('NRK') || badge.includes('NRK')) key = 'NRK';
      else if (name.includes('HRT') || badge.includes('HRT')) key = 'HRT';
      else if (name.includes('EHF') || badge.includes('EHF')) key = 'EHFTV';
      else if (name.includes('M4') || badge.includes('M4')) key = 'M4';
      else if (name.includes('STOD') || badge.includes('STÖÐ')) key = 'STOD2';
      else if (name.includes('POLSAT') || badge.includes('POLSAT')) key = 'POLSAT';
      else if (name.includes('MDR') || badge.includes('OSTEN')) key = 'MDR';
      else if (name.includes('WDR') || badge.includes('WESTEN')) key = 'WDR';
      else if (name.includes('BR') || badge.includes('BR SPORT')) key = 'BR';
      else if (name.includes('SWR')) key = 'SWR';
      else if (name.includes('SPORT1')) key = 'SPORT1';
      else if (name.includes('SPORTTOTAL')) key = 'SPORTTOTAL';
      else if (name.includes('HANDBALL LIVE') || badge.includes('HANDBALL LIVE')) key = 'HANDBALL_LIVE';
      else if (name.includes('COURTSTREAM')) key = 'COURTSTREAM';
      else key = 'COURTVISION';
    }
  }

  // If mod is OFF, strictly ensure NO real-world broadcasters are rendered
  if (!modActive) {
    if (key.includes('EURO') || key === 'DAZN' || key === 'EHFTV') {
      key = 'COURTVISION_EURO';
      networkName = 'CourtVision Euro';
    } else if (
      key === 'HANDBALL_LIVE' ||
      key.includes('CUP') ||
      key === 'ARD' ||
      key === 'ZDF' ||
      key === 'DR' ||
      key === 'MDR' ||
      key === 'WDR' ||
      key === 'BR' ||
      key === 'SWR' ||
      key === 'SPORT1' ||
      key === 'SPORTTOTAL'
    ) {
      key = 'HANDBALL_LIVE';
      networkName = 'Handball Live';
    } else if (key === 'COURTSTREAM' || key.includes('STREAM')) {
      key = 'COURTSTREAM';
      networkName = 'CourtStream';
    } else {
      key = 'COURTVISION';
      networkName = 'CourtVision';
    }
  }

  // Dimension scaling
  const dims = {
    xs: { h: 'h-4', svgH: 14, textMain: 'text-[11px]', textSub: 'text-[7px]' },
    sm: { h: 'h-5 sm:h-6', svgH: 18, textMain: 'text-[12px] sm:text-[13px]', textSub: 'text-[7.5px] sm:text-[8px]' },
    md: { h: 'h-6 sm:h-7', svgH: 22, textMain: 'text-[13px] sm:text-[14px]', textSub: 'text-[8px] sm:text-[9px]' },
    lg: { h: 'h-8 sm:h-9', svgH: 28, textMain: 'text-[15px] sm:text-[16px]', textSub: 'text-[9px] sm:text-[10px]' },
    xl: { h: 'h-10 sm:h-12', svgH: 36, textMain: 'text-[18px] sm:text-[20px]', textSub: 'text-[11px] sm:text-[12px]' },
  }[size];

  // Render Clean Borderless SVG Vector Mark without glow or official tags
  const renderVectorMark = () => {
    // ------------------------------------------------------------------------
    // GENERIC FICTIONAL NETWORKS (MOD OFF) - Clean, borderless vector marks
    // ------------------------------------------------------------------------
    if (key === 'COURTVISION') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <svg className="shrink-0" height={dims.svgH} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="5" fill="#0284c7" />
            <circle cx="12" cy="12" r="5" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="2" fill="#ffffff" />
          </svg>
          <div className="flex items-center leading-none font-sans font-black tracking-tight text-white">
            <span className={dims.textMain}>COURT</span>
            <span className={`${dims.textMain} text-sky-400 ml-0.5`}>VISION</span>
          </div>
        </div>
      );
    }

    if (key === 'COURTVISION_EURO') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <svg className="shrink-0" height={dims.svgH} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="5" fill="#1e3a8a" />
            <polygon points="12,6 13.5,10.2 18,10.5 14.5,13.2 15.6,17.5 12,14.8 8.4,17.5 9.5,13.2 6,10.5 10.5,10.2" fill="#fbbf24" />
          </svg>
          <div className="flex items-center leading-none font-sans font-black tracking-tight text-white">
            <span className={dims.textMain}>COURT</span>
            <span className={`${dims.textMain} text-amber-400 ml-0.5`}>EURO</span>
          </div>
        </div>
      );
    }

    if (key === 'HANDBALL_LIVE') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <svg className="shrink-0" height={dims.svgH} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="5" fill="#ea580c" />
            <circle cx="12" cy="12" r="6" fill="#ffffff" />
            <path d="M9 9C11 11 13 13 12 15" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M15 9C13 11 11 13 12 15" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M6 12H18" stroke="#ea580c" strokeWidth="1" />
          </svg>
          <div className="flex items-center gap-0.5 leading-none font-sans font-black tracking-tight text-white">
            <span className={dims.textMain}>HANDBALL</span>
            <span className={`${dims.textMain} text-orange-400 ml-0.5`}>LIVE</span>
          </div>
        </div>
      );
    }

    if (key === 'COURTSTREAM') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <svg className="shrink-0" height={dims.svgH} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="5" fill="#7e22ce" />
            <path d="M6 12V12.01M9 9V15M12 6V18M15 9V15M18 12V12.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="flex items-center leading-none font-sans font-black tracking-tight text-white">
            <span className={dims.textMain}>COURT</span>
            <span className={`${dims.textMain} text-purple-400 ml-0.5`}>STREAM</span>
          </div>
        </div>
      );
    }

    // ------------------------------------------------------------------------
    // AUTHENTIC VECTOR BROADCAST LOGOS (MOD ON) - Clean, borderless vector marks
    // ------------------------------------------------------------------------

    // DYN SPORT (Germany HBL & DHB-Pokal Host Broadcaster)
    if (key === 'DYN') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#ff5500] text-black font-sans font-black px-1.5 py-0.5 rounded leading-none flex items-center justify-center shrink-0">
            <span className="text-white font-extrabold tracking-tight text-[11px] sm:text-[13px] lowercase">dyn</span>
          </div>
          <span className="font-sans font-black text-white tracking-widest text-[11px] sm:text-[12px] uppercase leading-none">
            SPORT
          </span>
        </div>
      );
    }

    // DAZN (European Competitions & Champions League)
    if (key === 'DAZN') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-white text-black font-sans font-black px-1.5 py-0.5 rounded leading-none flex flex-col items-center justify-center tracking-tighter text-[8px] sm:text-[9px] w-5 sm:w-6 h-4.5 sm:h-5 shrink-0">
            <span className="leading-[0.8] font-black">DA</span>
            <span className="leading-[0.8] font-black">ZN</span>
          </div>
          <span className="font-sans font-black text-white text-[12px] sm:text-[14px] tracking-widest leading-none">
            DAZN
          </span>
        </div>
      );
    }

    // beIN SPORTS (France & European Tournaments)
    if (key === 'BEIN') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#6b21a8] text-white font-sans font-black px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] tracking-tight flex items-center shrink-0">
            <span className="lowercase font-bold">be</span>
            <span className="uppercase text-amber-400 font-black">IN</span>
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[13px] tracking-wider uppercase leading-none">
            SPORTS
          </span>
        </div>
      );
    }

    // TV 2 SPORT (Denmark / Norway)
    if (key === 'TV2') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <svg className="shrink-0" height={dims.svgH} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="5" fill="#dc2626" />
            <circle cx="12" cy="12" r="7.5" fill="#ffffff" />
            <path d="M9.5 9C9.5 7.8 10.7 7 12 7C13.3 7 14.5 7.8 14.5 9C14.5 10.8 12.3 12.2 10.2 14.4H15V16.5H9V14.8C11.1 12.6 12.7 11.2 12.7 9.8C12.7 9 12.2 8.5 11.6 8.5C11 8.5 10.5 8.9 10.5 9.6H9.5Z" fill="#dc2626" />
          </svg>
          <div className="flex items-center gap-1 font-sans font-black text-white text-[11px] sm:text-[13px] tracking-tight leading-none">
            <span>TV 2</span>
            <span className="text-red-400 font-black">SPORT</span>
          </div>
        </div>
      );
    }

    // ARD / Das Erste & Sportschau (Germany Public Television)
    if (key === 'ARD') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <svg className="shrink-0" height={dims.svgH} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#002d62" />
            <path d="M10 8L13 6V18H10V8Z" fill="#ffffff" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight">
              Das Erste
            </span>
            <span className="text-[7px] sm:text-[7.5px] font-mono text-sky-400 font-bold tracking-wider uppercase">
              SPORTSCHAU
            </span>
          </div>
        </div>
      );
    }

    // ZDF (German Second Channel / sportstudio)
    if (key === 'ZDF') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#fa7d00] text-black font-sans font-black px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] tracking-tight flex items-center justify-center font-bold shrink-0">
            zdf
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[13px] tracking-tight leading-none">
            sportstudio
          </span>
        </div>
      );
    }

    // MDR Sport im Osten (German Regional Cup - Landespokal)
    if (key === 'MDR') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#002e70] text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight shrink-0">
            mdr
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-tight">
              Sport im Osten
            </span>
            <span className="text-[6.5px] sm:text-[7px] font-mono text-sky-400 font-bold tracking-wider uppercase">
              LANDESPOKAL
            </span>
          </div>
        </div>
      );
    }

    // WDR Sport im Westen (German Regional Cup - Landespokal)
    if (key === 'WDR') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#003366] text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight shrink-0">
            WDR
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-tight">
              Sport im Westen
            </span>
            <span className="text-[6.5px] sm:text-[7px] font-mono text-red-400 font-bold tracking-wider uppercase">
              LANDESPOKAL
            </span>
          </div>
        </div>
      );
    }

    // BR Sport (German Regional Cup - Landespokal)
    if (key === 'BR') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#0065a2] text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight shrink-0">
            BR
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-tight">
              Sport
            </span>
            <span className="text-[6.5px] sm:text-[7px] font-mono text-blue-300 font-bold tracking-wider uppercase">
              LANDESPOKAL
            </span>
          </div>
        </div>
      );
    }

    // SWR Sport (German Regional Cup - Landespokal)
    if (key === 'SWR') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#8b0000] text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight shrink-0">
            SWR
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-tight">
              Sport
            </span>
            <span className="text-[6.5px] sm:text-[7px] font-mono text-rose-300 font-bold tracking-wider uppercase">
              LANDESPOKAL
            </span>
          </div>
        </div>
      );
    }

    // Sport1 (German Cup - Pokal Live)
    if (key === 'SPORT1') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#ffcc00] text-black font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight shrink-0">
            SPORT1
          </div>
          <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
            POKAL LIVE
          </span>
        </div>
      );
    }

    // Sporttotal.tv (German Regional Cup - Landespokal)
    if (key === 'SPORTTOTAL') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight shrink-0">
            sporttotal.tv
          </div>
          <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
            LANDESPOKAL
          </span>
        </div>
      );
    }

    // TELEDEPORTE / RTVE (Spain)
    if (key === 'TELEDEPORTE' || key === 'RTVE') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#e11d48] text-white font-sans font-black italic px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight shrink-0">
            tdp
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            Teledeporte
          </span>
        </div>
      );
    }

    // SVT SPORT (Sweden)
    if (key === 'SVT') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-[#0284c7] text-[#facc15] font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tighter uppercase shrink-0">
            SVT
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            SPORT
          </span>
        </div>
      );
    }

    // ARENA SPORT (Balkans / Croatia / Slovenia)
    if (key === 'ARENA_SPORT') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tighter uppercase shrink-0">
            AS
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            ARENA SPORT
          </span>
        </div>
      );
    }

    // SPORT TV (Portugal - Authentic sport.tv brand identity)
    if (key === 'SPORT_TV') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="flex items-center bg-black px-2 py-0.5 rounded-md border border-white/10 shadow-sm shrink-0 tracking-tight font-sans font-black italic">
            <span className="text-white text-[11px] sm:text-[13px] lowercase tracking-normal">sport</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#fdea00] mx-0.5 inline-block shadow-[0_0_6px_rgba(253,234,0,0.6)]" />
            <span className="text-[#fdea00] text-[11px] sm:text-[13px] lowercase tracking-normal">tv</span>
            <span className="ml-1 text-[8px] sm:text-[9px] not-italic font-mono font-bold px-1 py-0.2 bg-[#fdea00] text-black rounded-sm">1</span>
          </div>
          <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
            DIRETO
          </span>
        </div>
      );
    }

    // RTP / RTP DESPORTO (Portugal Public Broadcaster)
    if (key === 'RTP' || key === 'RTP_DESPORTO') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="flex items-center bg-[#005ca9] text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tighter shrink-0 shadow-sm">
            RTP
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            DESPORTO
          </span>
        </div>
      );
    }

    // PORTO CANAL (FC Porto Official Host Broadcaster)
    if (key === 'PORTO_CANAL') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="flex items-center bg-[#003882] px-2 py-0.5 rounded-md border border-blue-400/30 text-white font-sans font-black tracking-tight shrink-0 shadow-sm">
            <span className="text-white text-[11px] sm:text-[12px] lowercase font-extrabold">porto</span>
            <span className="text-[#38bdf8] ml-1 text-[11px] sm:text-[12px] lowercase font-black">canal</span>
          </div>
          <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
            DIRETO
          </span>
        </div>
      );
    }

    // ANDEBOL TV (Federação de Andebol de Portugal)
    if (key === 'ANDEBOL_TV') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="flex items-center bg-[#064e3b] px-2 py-0.5 rounded-md border border-emerald-500/30 text-white font-sans font-black shrink-0 shadow-sm">
            <span className="text-white text-[10px] sm:text-[11px] tracking-tight">ANDEBOL</span>
            <span className="text-[#facc15] ml-1 text-[10px] sm:text-[11px]">TV</span>
          </div>
          <span className="font-sans font-black text-emerald-400 text-[9px] sm:text-[10px] tracking-wider uppercase leading-none">
            FAP DIRETO
          </span>
        </div>
      );
    }

    // SPORTING TV (Sporting CP Official Broadcaster)
    if (key === 'SPORTING_TV') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="flex items-center bg-[#006633] px-2 py-0.5 rounded-md border border-emerald-400/30 text-white font-sans font-black shrink-0 shadow-sm">
            <span className="text-white text-[10px] sm:text-[11px] tracking-tight">SPORTING</span>
            <span className="text-[#facc15] ml-1 text-[10px] sm:text-[11px]">TV</span>
          </div>
          <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
            DIRETO
          </span>
        </div>
      );
    }

    // BTV (SL Benfica Official Broadcaster)
    if (key === 'BTV') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="flex items-center bg-[#cc0000] px-2 py-0.5 rounded-md border border-red-400/30 text-white font-sans font-black tracking-tight shrink-0 shadow-sm">
            <span className="text-white text-[11px] sm:text-[12px] font-black">BTV</span>
          </div>
          <span className="font-sans font-black text-white text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
            DIRETO
          </span>
        </div>
      );
    }

    // TVP SPORT (Poland)
    if (key === 'TVP') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-red-600 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-widest uppercase shrink-0">
            TVP
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            SPORT
          </span>
        </div>
      );
    }

    // ORF SPORT+ (Austria)
    if (key === 'ORF') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-red-600 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight uppercase shrink-0">
            ORF
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            SPORT+
          </span>
        </div>
      );
    }

    // SRF SPORT (Switzerland)
    if (key === 'SRF') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-red-600 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight uppercase shrink-0">
            SRF
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight leading-none">
            sport
          </span>
        </div>
      );
    }

    // DR (Denmark Public Network)
    if (key === 'DR') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-black text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-wider uppercase shrink-0">
            DR 1
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            SPORTEN
          </span>
        </div>
      );
    }

    // FRANCE TV (France)
    if (key === 'FRANCE_TV') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-blue-600 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight uppercase shrink-0">
            france·tv
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            SPORT
          </span>
        </div>
      );
    }

    // NRK (Norway)
    if (key === 'NRK') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-sky-600 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-widest uppercase shrink-0">
            nrk
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            SPORT
          </span>
        </div>
      );
    }

    // HRT (Croatia)
    if (key === 'HRT') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-red-700 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight uppercase shrink-0">
            HRT 2
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            SPORT
          </span>
        </div>
      );
    }

    // M4 SPORT (Hungary)
    if (key === 'M4') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <div className="bg-emerald-600 text-white font-sans font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] tracking-tight uppercase shrink-0">
            M4
          </div>
          <span className="font-sans font-black text-white text-[11px] sm:text-[12px] tracking-tight uppercase leading-none">
            SPORT
          </span>
        </div>
      );
    }

    // EHFTV (Continental streaming)
    if (key === 'EHFTV') {
      return (
        <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
          <svg className="shrink-0" height={dims.svgH} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="12,2 22,7.5 22,16.5 12,22 2,16.5 2,7.5" fill="#1e3a8a" />
            <circle cx="12" cy="12" r="3.5" fill="#f59e0b" />
          </svg>
          <span className="font-sans font-black text-white text-[11px] sm:text-[13px] tracking-tight uppercase leading-none">
            EHFTV
          </span>
        </div>
      );
    }

    // Default fallback
    return (
      <div className={`flex items-center gap-1.5 ${dims.h} select-none`}>
        <span className="font-mono font-bold text-white text-xs">{networkName}</span>
      </div>
    );
  };

  return (
    <div className={`inline-flex items-center shrink-0 whitespace-nowrap ${className}`}>
      {renderVectorMark()}
      {showLabel && (
        <span className="ml-2 text-xs font-mono text-zinc-300 shrink-0 whitespace-nowrap">{networkName}</span>
      )}
    </div>
  );
};
