import React from 'react';
import { GameState, Language } from '../types';
import { ClubLogo } from './ClubLogo';
import { getLeagueInfo, normalizeCountry, getQualifiedSupercupMatches } from '../data/gameConstants';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, isAnyModActive } from '../utils/modManager';
import { getLocalAssetPath, hasVerifiedLocalAsset } from '../data/teams';
import { useGameStore } from '../store/useGameStore';

interface MatchdayActionDockProps {
  state: GameState;
  isFirstHalf: boolean;
  onSimulate: () => void;
  lang?: Language;
  disabled?: boolean;
  supercupMatch?: any;
}

export const MatchdayActionDock: React.FC<MatchdayActionDockProps> = ({
  state: propState,
  isFirstHalf,
  onSimulate,
  lang = 'en',
  disabled = false,
  supercupMatch,
}) => {
  // 1. Fetch only the specific properties you need to avoid full-store re-renders
  const storeClub = useGameStore(s => s.club);
  const [, setModTick] = React.useState(0);
  React.useEffect(() => {
    const onModChange = () => setModTick(t => t + 1);
    window.addEventListener('mod-state-change', onModChange);
    return () => window.removeEventListener('mod-state-change', onModChange);
  }, []);
  
  // 2. Safe fallback state
  const state = propState || useGameStore.getState();
  
  // 3. Resolve club details cleanly
  const currentClub = state?.club || storeClub;
  const modActive = isAnyModActive();
  const activeClubs = getActiveClubs(currentClub?.country);

  const activeClub = activeClubs.find(c => 
    (currentClub?.id !== undefined && String(c.id) === String(currentClub.id)) || 
    (currentClub?.name && c?.name && c.name.toLowerCase() === currentClub.name.toLowerCase())
  );

  const dbClub = activeClub || ALL_CLUBS.find(c => 
    (currentClub?.id !== undefined && String(c.id) === String(currentClub.id)) || 
    (currentClub?.name && c?.name && c.name.toLowerCase() === currentClub.name.toLowerCase())
  );

  const clubName = currentClub?.name || activeClub?.name || dbClub?.name || 'Club';
  const clubId = currentClub?.id ?? activeClub?.id ?? dbClub?.id;
  const rawCountry = currentClub?.country || activeClub?.country || dbClub?.country || (state as any)?.nationality;
  const country = normalizeCountry(rawCountry || 'GER');
  const tier = currentClub?.tier ?? activeClub?.tier ?? dbClub?.tier ?? 1;
  const baseOvr = currentClub?.baseOvr ?? activeClub?.baseOvr ?? dbClub?.baseOvr ?? 70;
  const color = currentClub?.color || activeClub?.color || dbClub?.color || '#0054a6';
  const color2 = currentClub?.color2 || activeClub?.color2 || dbClub?.color2 || '#ffffff';

  const verifiedLocalPath = (modActive && clubId !== undefined && hasVerifiedLocalAsset(clubId)) ? getLocalAssetPath(clubId) : undefined;
  const logo = modActive ? (currentClub?.logo || activeClub?.logo || verifiedLocalPath || dbClub?.logo) : undefined;
  const fallbackLogo = modActive ? (currentClub?.fallbackLogo || activeClub?.fallbackLogo || verifiedLocalPath || dbClub?.fallbackLogo) : undefined;

  const resolvedClub = {
    ...(dbClub || {}),
    ...(activeClub || {}),
    ...(currentClub || {}),
    id: clubId,
    name: clubName,
    color,
    color2,
    logo,
    fallbackLogo,
  };

  const euro = state?.euroStatus;
  const league = getLeagueInfo(tier, country);
  const leagueName = league?.name || (lang === 'de' ? 'Liga' : 'League');

  const sameTierClubs = activeClubs.filter(c => 
    c.tier === tier && (normalizeCountry(c.country || 'GER') === country || !c.country || c.country === country)
  );
  const effectiveTierClubs = sameTierClubs.length >= 4 
    ? sameTierClubs 
    : activeClubs.filter(c => c.tier === tier);
  const leagueSize = effectiveTierClubs.length > 0 ? effectiveTierClubs.length : 18;

  const avgTierOvr = effectiveTierClubs.length > 0
    ? Math.round(effectiveTierClubs.reduce((s, c) => s + (c.baseOvr || 70), 0) / effectiveTierClubs.length)
    : (tier === 1 ? 84 : tier === 2 ? 73 : tier === 3 ? 63 : 55);

  const sortedTierClubs = [...effectiveTierClubs].sort((a, b) => (b.baseOvr || 70) - (a.baseOvr || 70));
  const clubTierRankIndex = sortedTierClubs.findIndex(c => 
    (clubId !== undefined && String(c.id) === String(clubId)) || 
    (clubName && c?.name && c.name.toLowerCase() === clubName.toLowerCase())
  );
  const clubTierRank = clubTierRankIndex >= 0 ? clubTierRankIndex + 1 : Math.round(leagueSize * 0.5);

  const rawLatestHist = state?.history && state.history.length > 0 ? state.history[state.history.length - 1] : undefined;
  const lastHist =
    rawLatestHist &&
    ((rawLatestHist.clubId !== undefined && clubId !== undefined && String(rawLatestHist.clubId) === String(clubId)) ||
      !rawLatestHist.clubName ||
      rawLatestHist.clubName === clubName)
      ? rawLatestHist
      : undefined;
  const morale = currentClub?.morale ?? 75;

  const relegationDepth = leagueSize >= 18 ? 3 : 2;
  const relegationLine = leagueSize - relegationDepth + 1;

  const boardExp = (state?.boardExpectation || '').toLowerCase();
  const boardTargetPos = state?.boardTargetPos;
  const hasRelegationBoardObjective = 
    boardExp.includes('relegat') || 
    boardExp.includes('abstieg') || 
    boardExp.includes('survival') || 
    boardExp.includes('klassenerhalt') ||
    (boardTargetPos !== undefined && boardTargetPos >= relegationLine);

  const isProvenTopHalf = Boolean(lastHist && lastHist.pos <= Math.ceil(leagueSize * 0.5));
  const finishedInRelegationDanger = Boolean(lastHist && !lastHist.relegated && !lastHist.promoted && lastHist.pos >= relegationLine);
  const isNewlyRelegated = Boolean(lastHist && lastHist.relegated);
  const isNewlyPromoted = Boolean(lastHist && (lastHist.promoted || (lastHist.nextTier && lastHist.tier && lastHist.nextTier < lastHist.tier)));
  const isBottomTierOvr = baseOvr <= avgTierOvr - 3 || clubTierRank >= relegationLine;
  const isSeverelyUnderstrength = baseOvr <= avgTierOvr - 2 && (morale <= 50 || isNewlyPromoted);

  const contextText = ((resolvedClub as any)?.historicContext || (resolvedClub as any)?.context || '').toLowerCase();
  const mentionsRelegation = contextText.includes('relegat') || contextText.includes('abstieg') || contextText.includes('klassenerhalt') || contextText.includes('survival');

  const isRelegationFight = Boolean(
    !isNewlyRelegated && !isProvenTopHalf && (
      hasRelegationBoardObjective ||
      finishedInRelegationDanger ||
      isBottomTierOvr ||
      isSeverelyUnderstrength ||
      (mentionsRelegation && baseOvr < avgTierOvr)
    )
  );

  const isTitleContender = Boolean(
    !isRelegationFight && (
      euro === 'CL' ||
      (tier === 1 && baseOvr >= avgTierOvr + 2 && morale >= 60) ||
      (lastHist && lastHist.pos <= 2 && morale >= 55)
    )
  );

  const isPromotionHunt = Boolean(
    tier > 1 && !isRelegationFight && !isTitleContender && (
      baseOvr >= avgTierOvr ||
      (lastHist && lastHist.pos <= Math.ceil(leagueSize * 0.5) && !lastHist.relegated) ||
      isNewlyRelegated
    )
  );

  const activeSupercup = isFirstHalf
    ? (supercupMatch ?? getQualifiedSupercupMatches(state, activeClubs, modActive)[0])
    : null;

  const campaignBadge = activeSupercup
    ? (lang === 'de' ? 'Saison-Auftakt · Finale' : 'Curtain-Raiser · Final')
    : isFirstHalf 
      ? (lang === 'de' ? 'Spieltage 1–17' : 'MD 1–17')
      : (lang === 'de' ? 'Spieltage 18–34' : 'MD 18–34');

  const titleText = activeSupercup
    ? activeSupercup.title
    : isFirstHalf
      ? (lang === 'de' ? 'Hinrunde' : '1st Half')
      : (lang === 'de' ? 'Rückrunde' : '2nd Half');

  let stakeText = '';
  if (activeSupercup) {
    const cityOrArena = (activeSupercup.hostArena || '').split(',')[0];
    stakeText = `vs. ${activeSupercup.opponent}${cityOrArena ? ` · ${cityOrArena}` : ''}`;
  } else if (isFirstHalf) {
    if (euro === 'CL') {
      stakeText = 'EHF Champions League';
    } else if (euro === 'EL' || euro === 'ECL') {
      stakeText = lang === 'de' ? 'Europapokal' : 'European Cup';
    } else if (isRelegationFight) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Klassenerhalt' : 'Fight for Survival'}`;
    } else if (isTitleContender) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Meisterschaftsjagd' : 'Title Hunt'}`;
    } else if (isPromotionHunt) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Aufstiegskampf' : 'Promotion Race'}`;
    } else {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Hinrunde' : 'Autumn Season'}`;
    }
  } else {
    if (isRelegationFight) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Abstiegskampf' : 'Relegation Battle'}`;
    } else if (isTitleContender) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Meisterschaft' : 'Championship'}`;
    } else if (isPromotionHunt) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Aufstiegsfinale' : 'Promotion Deciders'}`;
    } else {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Entscheidungsphase' : 'Deciders'}`;
    }
  }

  const theme = activeSupercup
    ? {
        buttonGradient: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.45)] border-amber-300/40',
        pulseDot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]',
        glow: 'from-amber-500/15 via-transparent to-yellow-500/15',
        dockBorder: 'border-amber-400/35 hover:border-amber-400/50',
        dockShadow: 'shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(245,158,11,0.22)]',
        spaceBadge: 'bg-amber-950/70 text-amber-200 border-amber-400/30',
        playBg: 'bg-black/25',
      }
    : isRelegationFight
    ? {
        buttonGradient: 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 shadow-[0_0_20px_rgba(244,63,94,0.45)] border-rose-400/40',
        pulseDot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]',
        glow: 'from-rose-500/15 via-transparent to-red-500/15',
        dockBorder: 'border-rose-500/30 hover:border-rose-500/45',
        dockShadow: 'shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(244,63,94,0.22)]',
        spaceBadge: 'bg-rose-950/70 text-rose-200 border-rose-400/30',
        playBg: 'bg-white/20',
      }
    : isTitleContender
    ? {
        buttonGradient: 'bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:to-blue-500 shadow-[0_0_15px_rgba(56,189,248,0.35)] border-white/20',
        pulseDot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
        glow: 'from-sky-500/10 via-transparent to-amber-500/10',
        dockBorder: 'border-white/15 hover:border-white/25',
        dockShadow: 'shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(56,189,248,0.18)]',
        spaceBadge: 'bg-black/40 text-blue-100 border-white/15',
        playBg: 'bg-white/20',
      }
    : isPromotionHunt
    ? {
        buttonGradient: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] border-emerald-400/30',
        pulseDot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
        glow: 'from-emerald-500/10 via-transparent to-teal-500/10',
        dockBorder: 'border-emerald-500/20 hover:border-emerald-500/35',
        dockShadow: 'shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(16,185,129,0.18)]',
        spaceBadge: 'bg-emerald-950/60 text-emerald-200 border-emerald-400/30',
        playBg: 'bg-white/20',
      }
    : {
        buttonGradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.35)] border-indigo-400/30',
        pulseDot: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]',
        glow: 'from-blue-500/10 via-transparent to-indigo-500/10',
        dockBorder: 'border-white/15 hover:border-white/25',
        dockShadow: 'shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(99,102,241,0.18)]',
        spaceBadge: 'bg-black/40 text-blue-100 border-white/15',
        playBg: 'bg-white/20',
      };

  return (
    <aside
      aria-label="Matchday Action Dock"
      className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[95vw] max-w-2xl select-none transition-all duration-300 ${
        disabled ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className={`group relative flex items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#0a0b12]/95 hover:bg-[#0c0d16]/98 backdrop-blur-2xl border ${theme.dockBorder} ${theme.dockShadow} text-white transition-all duration-300`}>
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${theme.glow} pointer-events-none`} />

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-start min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            <ClubLogo 
              club={resolvedClub}
              name={clubName} 
              clubId={clubId}
              color={color}
              color2={color2}
              logo={logo}
              fallbackLogo={fallbackLogo}
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${theme.pulseDot}`} />
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white truncate max-w-[92px] xs:max-w-[130px] sm:max-w-none">
                {titleText}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap hidden xs:inline">
              {campaignBadge}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 min-w-0 px-1.5 sm:px-3 border-x border-white/10 shrink">
          <span className={`hidden md:inline-block text-[11px] font-medium truncate max-w-[130px] lg:max-w-[190px] text-center ${activeSupercup ? 'text-amber-200/95' : 'text-sky-200/90'}`}>
            {stakeText}
          </span>
          <div className="flex items-center justify-center px-2 sm:px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 shadow-inner shrink-0">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-tight tabular-nums text-center whitespace-nowrap">
              OVR {baseOvr}
            </span>
          </div>
          {activeSupercup ? (
            <span className="hidden sm:inline-flex text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/35 whitespace-nowrap">
              🏆 SUPERCUP
            </span>
          ) : isRelegationFight ? (
            <span className="hidden sm:inline-flex text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap">
              - Form
            </span>
          ) : (isTitleContender || isPromotionHunt) ? (
            <span className="hidden sm:inline-flex text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
              + Form
            </span>
          ) : (
            <span className="text-[10px] sm:text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 whitespace-nowrap hidden sm:inline">
              ±0 Form
            </span>
          )}
        </div>

        <div className="flex items-center justify-end shrink-0">
          <button
            onClick={onSimulate}
            disabled={disabled}
            title={activeSupercup ? 'Press Space or click to play Supercup Opener' : 'Press Space or click to simulate campaign'}
            className={`cursor-pointer shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-95 touch-manipulation border hover:border-white/40 ${theme.buttonGradient}`}
          >
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${theme.playBg}`}>
              <i className={`fas ${activeSupercup ? 'fa-trophy' : 'fa-play ml-0.5'}`} />
            </div>
            <span className="whitespace-nowrap font-bold">
              {activeSupercup
                ? (lang === 'de' ? 'Supercup spielen' : 'Play Supercup')
                : isFirstHalf 
                  ? (lang === 'de' ? 'Hinrunde simulieren' : 'Simulate 1st Half') 
                  : (lang === 'de' ? 'Rückrunde simulieren' : 'Simulate 2nd Half')}
            </span>
            <span className={`hidden sm:inline text-[9px] font-mono uppercase px-1 py-0.5 rounded border ${theme.spaceBadge}`}>
              Space
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
