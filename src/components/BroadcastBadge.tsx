import React from 'react';
import { getBroadcastNetwork, BroadcastNetwork } from '../utils/broadcastNetworks';

interface BroadcastBadgeProps {
  country?: string;
  competitionId?: string;
  isModActive?: boolean;
  tier?: number;
  className?: string;
}

export const BroadcastBadge: React.FC<BroadcastBadgeProps> = ({
  country = 'GER',
  competitionId,
  isModActive = false,
  tier = 1,
  className = '',
}) => {
  const network: BroadcastNetwork | null = getBroadcastNetwork(country, competitionId, isModActive, tier);

  if (!network) {
    return null;
  }

  const renderLogo = () => {
    switch (network.renderType) {
      case 'sky':
        return (
          <div className="flex items-center gap-1 select-none font-black italic tracking-tighter">
            <span className="text-[11px] lowercase bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent font-extrabold not-italic">
              sky
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white font-black bg-red-600 px-1 py-0.2 rounded">
              SPORT
            </span>
          </div>
        );

      case 'bbc':
        return (
          <div className="flex items-center gap-0.5 select-none font-black">
            <span className="inline-flex items-center justify-center w-3 h-3 bg-white text-black font-black text-[8px] rounded-[1px] shadow-sm">
              B
            </span>
            <span className="inline-flex items-center justify-center w-3 h-3 bg-white text-black font-black text-[8px] rounded-[1px] shadow-sm">
              B
            </span>
            <span className="inline-flex items-center justify-center w-3 h-3 bg-white text-black font-black text-[8px] rounded-[1px] shadow-sm">
              C
            </span>
            <span className="text-[9.5px] font-black text-amber-400 tracking-wider ml-1">
              SPORT
            </span>
          </div>
        );

      case 'itv':
        return (
          <div className="flex items-center gap-1 select-none">
            <span className="text-[11px] font-extrabold text-teal-400 tracking-tighter lowercase">
              itv
            </span>
            <span className="text-[9px] font-black text-white tracking-widest uppercase">
              SPORT
            </span>
          </div>
        );

      case 'rtl':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px] tracking-tight">
            <span className="bg-red-600 text-white px-1 py-0.2 rounded-l-[2px]">R</span>
            <span className="bg-blue-600 text-white px-1 py-0.2">T</span>
            <span className="bg-yellow-500 text-black px-1 py-0.2 rounded-r-[2px]">L</span>
          </div>
        );

      case 'espn':
        return (
          <div className="flex items-center select-none font-black italic text-[11px] tracking-tight">
            <span className="text-white drop-shadow font-black">E</span>
            <span className="text-red-500 drop-shadow font-black">SPN</span>
          </div>
        );

      case 'tsn':
        return (
          <div className="flex items-center select-none font-black italic text-[10px] tracking-tight bg-red-600 text-white px-1.5 py-0.2 rounded">
            <span>TSN</span>
          </div>
        );

      case 'onesoccer':
        return (
          <div className="flex items-center gap-1 select-none font-bold text-[9px] tracking-tight">
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded bg-sky-500 text-black font-black text-[8.5px] shadow-sm">
              1
            </span>
            <span className="text-white font-extrabold italic tracking-tight text-[9px]">SOCCER</span>
          </div>
        );

      case 'goal':
        return (
          <div className="flex items-center gap-0.5 select-none font-extrabold text-[9px]">
            <span className="text-emerald-400 font-black">GOAL</span>
            <span className="text-white text-[8px] bg-emerald-600/60 px-0.8 py-0.1 rounded">.tv</span>
          </div>
        );

      case 'dazn':
        return (
          <div className="flex items-center select-none font-mono font-black text-[9px] tracking-widest bg-yellow-400 text-black px-1.5 py-0.2 rounded">
            <span>DAZN</span>
          </div>
        );

      case 'tnt':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-1 py-0.2 rounded text-[8px]">
              TNT
            </span>
            <span className="text-pink-300 tracking-wider">SPORTS</span>
          </div>
        );

      case 'canal':
        return (
          <div className="flex items-center select-none font-black italic text-[9px] tracking-tight bg-white text-black px-1 py-0.2 rounded">
            <span>CANAL+</span>
          </div>
        );

      case 'appletv':
        return (
          <div className="flex items-center gap-0.5 select-none font-bold text-[9px] tracking-tight text-white">
            <span className="text-[10px]"></span>
            <span className="font-semibold text-white/90">tv</span>
            {network.tagline !== 'LEAGUES CUP' && (
              <span className="text-[8px] font-black uppercase text-emerald-400 ml-0.5 bg-emerald-500/20 px-1 py-0.2 rounded">MLS</span>
            )}
          </div>
        );

      case 'sporttv':
        return (
          <div className="flex items-center gap-1 select-none font-black italic text-[9px] tracking-tight">
            <span className="text-emerald-400 not-italic font-black">SPORT</span>
            <span className="bg-emerald-500 text-zinc-950 px-1 py-0.2 rounded font-black not-italic text-[8px]">TV</span>
          </div>
        );

      case 'movistar':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px] tracking-tight">
            <span className="text-cyan-400 font-extrabold text-[10px]">M+</span>
            <span className="text-white text-[8px] tracking-wider uppercase">LALIGA</span>
          </div>
        );

      case 'rtve':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px] tracking-tight">
            <span className="text-orange-400 lowercase text-[10px] font-extrabold">rtve</span>
            <span className="text-[7.5px] uppercase font-bold text-white bg-orange-600 px-1 py-0.2 rounded ml-0.5">PLAY</span>
          </div>
        );

      case 'mediaset':
        return (
          <div className="flex items-center gap-1 select-none font-extrabold text-[9px] tracking-wider text-sky-400">
            <span>MEDIASET</span>
          </div>
        );

      case 'francetv':
        return (
          <div className="flex items-center gap-0.5 select-none font-bold text-[9px] text-white">
            <span>france</span>
            <span className="text-blue-400">·</span>
            <span className="text-red-400 font-extrabold">tv</span>
          </div>
        );

      case 's4c':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px] text-white">
            <span className="bg-red-600 px-1 py-0.2 rounded text-[8px] font-black">S4C</span>
            <span className="text-red-400 italic text-[8.5px]">SGORIO</span>
          </div>
        );

      case 'orf':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="bg-white text-zinc-950 px-1 py-0.2 rounded-[2px] font-black text-[8px]">ORF</span>
            <span className="text-red-400 text-[8px] font-bold">SPORT+</span>
          </div>
        );

      case 'bluesport':
        return (
          <div className="flex items-center gap-1 select-none font-extrabold text-[9px]">
            <span className="text-cyan-400 lowercase">blue</span>
            <span className="text-white font-black uppercase text-[8px]">SPORT</span>
          </div>
        );

      case 'srfsport':
        return (
          <div className="flex items-center gap-1 select-none font-bold text-[9px]">
            <span className="bg-red-600 text-white font-black px-1 py-0.2 rounded-[2px] text-[8px]">SRF</span>
            <span className="text-zinc-200 text-[8px] font-bold">SPORT</span>
          </div>
        );

      case 'tvp':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="bg-blue-600 text-white px-1 py-0.2 rounded font-black text-[8px]">TVP</span>
            <span className="text-red-400 font-bold text-[8px]">SPORT</span>
          </div>
        );

      case 'bein':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-purple-300 font-extrabold lowercase text-[10px]">beIN</span>
            <span className="text-white text-[8px] tracking-wider uppercase">SPORTS</span>
          </div>
        );

      case 'aspor':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px]">
            <span className="bg-red-600 text-white font-black px-1 py-0.2 rounded text-[8px]">A</span>
            <span className="text-white font-bold text-[8.5px] ml-0.5">SPOR</span>
          </div>
        );

      case 'viaplay':
        return (
          <div className="flex items-center select-none font-extrabold text-[9px] tracking-tight text-pink-400">
            <span>viaplay</span>
          </div>
        );

      case 'tv2':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-sky-400 font-black">TV 2</span>
            <span className="text-white text-[8px] uppercase">SPORT</span>
          </div>
        );

      case 'tv4':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="bg-red-600 text-white px-1 py-0.2 rounded-full font-black text-[8px]">4</span>
            <span className="text-white text-[8px] uppercase">PLAY</span>
          </div>
        );

      case 'svt':
        return (
          <div className="flex items-center gap-1 select-none font-extrabold text-[9px]">
            <span className="text-sky-400 lowercase font-black text-[10px]">svt</span>
            <span className="text-white text-[8px] uppercase font-bold">SPORT</span>
          </div>
        );

      case 'cbs':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-sky-400 font-extrabold">CBS</span>
            <span className="bg-blue-600 text-white px-1 py-0.2 rounded text-[7.5px] font-black uppercase">GOLAZO</span>
          </div>
        );

      case 'tudn':
        return (
          <div className="flex items-center select-none font-black italic text-[9.5px] tracking-tight text-emerald-400">
            <span>TUDN</span>
          </div>
        );

      case 'premiere':
        return (
          <div className="flex items-center select-none font-black text-[9px] tracking-wider text-emerald-400 uppercase">
            <span>PREMIERE</span>
          </div>
        );

      case 'sportv':
        return (
          <div className="flex items-center select-none font-black italic text-[9px] text-sky-400">
            <span>sporTV</span>
          </div>
        );

      case 'tyc':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px]">
            <span className="text-blue-400 font-black">TyC</span>
            <span className="text-white text-[8px] uppercase font-bold">SPORTS</span>
          </div>
        );

      case 'winsports':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px]">
            <span className="text-orange-400 font-black">Win</span>
            <span className="text-white text-[8px] font-bold">SPORTS+</span>
          </div>
        );

      case 'ecdf':
        return (
          <div className="flex items-center select-none font-black text-[9px] tracking-tight text-yellow-400">
            <span>ECDF</span>
          </div>
        );

      case 'paramount':
        return (
          <div className="flex items-center gap-0.5 select-none font-extrabold text-[9px] text-blue-400">
            <span>Paramount</span>
            <span className="text-white font-black text-[10px]">+</span>
          </div>
        );

      case 'indosiar':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-sky-400 font-black uppercase tracking-wider">INDOSIAR</span>
          </div>
        );

      case 'jio':
        return (
          <div className="flex items-center select-none font-extrabold text-[9px] text-pink-400">
            <span>JioCinema</span>
          </div>
        );

      case 'sony':
        return (
          <div className="flex items-center select-none font-bold text-[8.5px] tracking-widest text-white uppercase font-mono">
            <span>SONY</span>
          </div>
        );

      case 'coupang':
        return (
          <div className="flex items-center gap-0.5 select-none font-bold text-[9px] tracking-tight">
            <span className="text-sky-400 font-extrabold lowercase text-[10px]">coupang</span>
            <span className="text-[7.5px] uppercase font-bold text-white bg-sky-600 px-1 py-0.2 rounded ml-0.5">play</span>
          </div>
        );

      case 'tigo':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px]">
            <span className="text-blue-400 font-black lowercase text-[10px]">tigo</span>
            <span className="text-amber-400 font-black italic text-[8.5px] ml-0.5">SPORTS</span>
          </div>
        );

      case 'l1max':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px]">
            <span className="bg-red-600 text-white font-black px-1 py-0.2 rounded text-[8px]">L1</span>
            <span className="text-amber-400 font-black italic text-[9px] ml-0.5">MAX</span>
          </div>
        );

      case 'voyo':
        if (network.id === 'rtvs_sport_svk') {
          return (
            <div className="flex items-center gap-1 select-none font-black text-[9px]">
              <span className="text-white font-black tracking-wide text-[9px]">RTVS</span>
              <span className="text-red-500 font-black italic text-[9px]">ŠPORT</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-sky-400 font-black tracking-wide text-[9.5px]">VOYO</span>
            <span className="text-white text-[7.5px] bg-blue-600 px-1 py-0.2 rounded uppercase">SPORT</span>
          </div>
        );

      case 'maxsport':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px]">
            <span className="bg-rose-600 text-white font-black italic px-1 py-0.2 rounded text-[8px]">MAX</span>
            <span className="text-white font-bold text-[8.5px] ml-0.5">Sport</span>
          </div>
        );

      case 'cosmote':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-emerald-400 font-extrabold uppercase text-[9px]">COSMOTE</span>
            <span className="text-sky-400 text-[8px] font-bold uppercase">SPORT</span>
          </div>
        );

      case 'sky_plus':
        return (
          <div className="flex items-center gap-1 select-none font-black italic tracking-tighter">
            <span className="text-[11px] lowercase bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent font-extrabold not-italic">
              sky
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white font-black bg-red-600 px-1 py-0.2 rounded">
              SPORTS
            </span>
            <span className="text-amber-400 font-black not-italic text-[10px] ml-0.5">+</span>
          </div>
        );

      case 'ard':
        return (
          <div className="flex items-center gap-1 select-none font-bold text-[9px]">
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white text-[#001a4b] font-black text-[8px] shadow-sm">
              1
            </span>
            <span className="text-white font-extrabold tracking-tight text-[9px]">ARD</span>
            <span className="text-cyan-400 font-black italic tracking-wide text-[8.5px] ml-0.5 uppercase">
              SPORTSCHAU
            </span>
          </div>
        );

      case 'zdf':
        return (
          <div className="flex items-center gap-1 select-none font-bold text-[9px]">
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded bg-[#fa7d00] text-white font-black text-[8.5px] shadow-sm">
              ZDF
            </span>
            <span className="text-white font-extrabold italic tracking-tight text-[9px]">sportstudio</span>
          </div>
        );

      case 'magenta':
        return (
          <div className="flex items-center select-none font-black text-[9px] tracking-tight bg-[#e20074] text-white px-1.5 py-0.2 rounded shadow-sm">
            <span>MAGENTA SPORT</span>
          </div>
        );

      case 'mdr':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-white font-black text-[9.5px]">mdr</span>
            <span className="text-sky-300 font-extrabold text-[8px] uppercase tracking-wider">SPORT</span>
          </div>
        );

      case 'wdr':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-white font-black text-[9.5px]">WDR</span>
            <span className="text-red-400 font-extrabold text-[8px] uppercase tracking-wider">SPORT</span>
          </div>
        );

      case 'br':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-white font-black text-[9.5px]">BR</span>
            <span className="text-sky-400 font-extrabold text-[8px] uppercase tracking-wider">SPORT</span>
          </div>
        );

      case 'swr':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-white font-black text-[9.5px]">SWR</span>
            <span className="text-blue-400 font-extrabold text-[8px] uppercase tracking-wider">SPORT</span>
          </div>
        );

      case 'sport1':
        return (
          <div className="flex items-center select-none font-black italic text-[9.5px] tracking-tighter text-amber-400">
            <span className="text-red-500 font-black">SPORT</span>
            <span className="text-yellow-400 font-black">1</span>
          </div>
        );

      case 'sporttotal':
        return (
          <div className="flex items-center gap-0.5 select-none font-bold text-[9px]">
            <span className="text-emerald-400 font-extrabold">sporttotal</span>
            <span className="bg-emerald-600 text-white text-[7.5px] px-0.8 py-0.1 rounded font-black">.tv</span>
          </div>
        );

      case 'nationalleaguetv':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="bg-amber-500 text-black px-1 py-0.2 rounded text-[8px] font-black uppercase">
              NLTV
            </span>
            <span className="text-amber-200 text-[8px] font-bold uppercase tracking-wider">LIVE</span>
          </div>
        );

      case 'feftv':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px]">
            <span className="bg-red-600 text-white px-1 py-0.2 rounded-l text-[8px] font-black">
              FEF
            </span>
            <span className="bg-amber-500 text-black px-1 py-0.2 rounded-r text-[8px] font-black">
              TV
            </span>
          </div>
        );

      case 'ffftv':
        return (
          <div className="flex items-center gap-0.5 select-none font-black text-[9px]">
            <span className="text-blue-400 font-extrabold">FFF</span>
            <span className="bg-blue-600 text-white px-1 py-0.2 rounded text-[7.5px] uppercase font-bold">
              tv
            </span>
          </div>
        );

      case 'now':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-emerald-400 font-black lowercase text-[10.5px]">now</span>
            <span className="text-white text-[8px] font-extrabold uppercase bg-emerald-700/60 px-1 py-0.2 rounded">
              SERIE C
            </span>
          </div>
        );

      case 'raisport':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="bg-blue-600 text-white px-1 py-0.2 rounded text-[8px] font-black">Rai</span>
            <span className="text-blue-300 font-bold text-[8.5px]">Sport</span>
          </div>
        );

      case 'telefe':
        return (
          <div className="flex items-center gap-1 select-none font-bold text-[9px]">
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            </span>
            <span className="text-white font-extrabold lowercase text-[9.5px]">telefe</span>
          </div>
        );

      case 'globo':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-orange-400 font-black uppercase text-[9.5px]">GLOBO</span>
          </div>
        );

      case 'azteca':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px]">
            <span className="text-emerald-400 font-black uppercase text-[9px]">AZTECA</span>
            <span className="text-red-500 font-bold text-[9px]">7</span>
          </div>
        );

      case 'custom_mod':
        return (
          <div className="flex items-center gap-1 select-none font-black text-[9px] tracking-tight">
            <span className="bg-white/10 text-white px-1.5 py-0.2 rounded font-extrabold text-[8.5px] border border-white/20">
              {network.shortName}
            </span>
            <span className="text-[7.5px] uppercase font-bold text-sky-300 bg-sky-500/20 px-1 py-0.2 rounded">
              LIVE
            </span>
          </div>
        );

      default:
        return (
          <span className="text-[9px] font-bold text-white tracking-wider">
            {network.shortName}
          </span>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border backdrop-blur-md shadow-sm ${network.badgeBg} ${network.borderColor} ${className}`}
      title={`${network.name} Broadcast Feed (Community Pack Active)`}
    >
      {/* Blinking Live Indicator */}
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
      </span>

      {/* Network Brand Typography */}
      {renderLogo()}

      {/* Tagline / Resolution pill */}
      {network.tagline && (
        <span
          className={`text-[8px] font-black uppercase tracking-wider pl-1.5 border-l border-white/15 ${
            network.tagline === 'WORLD CUP'
              ? 'text-amber-300 font-extrabold tracking-widest'
              : network.tagline === 'LEAGUES CUP'
              ? 'text-amber-300 font-black tracking-wider'
              : 'text-zinc-300 hidden sm:inline'
          }`}
        >
          {network.tagline}
        </span>
      )}
    </div>
  );
};
