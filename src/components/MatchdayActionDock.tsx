import React from 'react';
import { GameState, Language } from '../types';
import { ClubLogo } from './ClubLogo';
import { getLeagueInfo, normalizeCountry, getQualifiedSupercupMatches } from '../data/gameConstants';
import { getLeagueSize } from '../engine/engine';
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
  const leagueSize = effectiveTierClubs.length >= 4
    ? effectiveTierClubs.length
    : getLeagueSize(tier, country, clubId, tier, country, activeClubs);
  const totalMatchdays = Math.max(2, (leagueSize - 1) * 2);
  const halfMatchdays = Math.floor(totalMatchdays / 2);

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
      ? (lang === 'de' ? `Spieltage 1–${halfMatchdays}` : `MD 1–${halfMatchdays}`)
      : (lang === 'de' ? `Spieltage ${halfMatchdays + 1}–${totalMatchdays}` : `MD ${halfMatchdays + 1}–${totalMatchdays}`);

  const titleText = activeSupercup
    ? activeSupercup.title
    : isFirstHalf
      ? (lang === 'de' ? 'Hinrunde' : '1st Half')
      : (lang === 'de' ? 'Rückrunde' : '2nd Half');

  let stakeText = '';
  if (activeSupercup) {
    stakeText = `vs. ${activeSupercup.opponent}`;
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
      stakeText = leagueName;
    }
  } else {
    if (isRelegationFight) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Abstiegskampf' : 'Relegation Battle'}`;
    } else if (isTitleContender) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Meisterschaft' : 'Championship'}`;
    } else if (isPromotionHunt) {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Aufstiegsfinale' : 'Promotion Deciders'}`;
    } else {
      stakeText = `${leagueName} · ${lang === 'de' ? 'Rückrunde' : 'Deciders'}`;
    }
  }

  const theme = activeSupercup
    ? {
        buttonStyle: 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 border-amber-300/60 shadow-[0_0_25px_rgba(251,191,36,0.35)]',
        pulseDot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]',
        dockBorder: 'border-amber-400/25 hover:border-amber-400/40',
        spaceBadge: 'bg-black/20 text-zinc-950 border-black/15',
      }
    : isRelegationFight
    ? {
        buttonStyle: 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white border-rose-400/40 shadow-[0_0_25px_rgba(244,63,94,0.35)]',
        pulseDot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]',
        dockBorder: 'border-rose-500/25 hover:border-rose-500/40',
        spaceBadge: 'bg-black/25 text-rose-100 border-white/15',
      }
    : {
        buttonStyle: 'bg-gradient-to-r from-[#0ea5e9] via-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0ea5e9] text-white border-sky-400/40 shadow-[0_0_25px_rgba(14,165,233,0.4)]',
        pulseDot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
        dockBorder: 'border-sky-500/25 hover:border-sky-400/40',
        spaceBadge: 'bg-black/25 text-sky-100 border-white/15',
      };

  return (
    <aside
      aria-label="Matchday Action Dock"
      aria-hidden={disabled || undefined}
      className={`fixed bottom-3.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-[660px] select-none transition-[opacity,transform] duration-200 ${
        disabled ? 'opacity-0 invisible pointer-events-none translate-y-4' : 'opacity-100 visible translate-y-0'
      }`}
    >
      <div className={`group relative flex items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-4.5 py-2.5 sm:py-3 rounded-2xl sm:rounded-[22px] bg-[#111520]/95 hover:bg-[#131824]/98 backdrop-blur-2xl border ${theme.dockBorder} shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] text-white transition-all duration-300`}>
        {/* Left: Club Crest + Title + Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#181d2a] border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
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
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.pulseDot}`} />
              <span className="text-xs sm:text-[13px] font-bold tracking-tight text-white leading-snug truncate max-w-[130px] xs:max-w-[155px] sm:max-w-[180px]">
                {titleText}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 leading-snug truncate max-w-[140px] xs:max-w-[165px] sm:max-w-[180px]">
              {activeSupercup ? (
                <>
                  <span className="sm:hidden text-amber-300/90">{stakeText}</span>
                  <span className="hidden sm:inline">{campaignBadge}</span>
                </>
              ) : (
                campaignBadge
              )}
            </span>
          </div>
        </div>

        {/* Center: Stake Title on Top + OVR & Form Pills Below */}
        <div className="hidden sm:flex flex-col items-center justify-center gap-1 min-w-0 flex-1 px-2">
          <span
            className={`text-[11px] font-semibold truncate max-w-[210px] md:max-w-[250px] text-center leading-snug py-0.5 ${
              activeSupercup ? 'text-amber-300' : 'text-zinc-200'
            }`}
            title={stakeText}
          >
            {stakeText}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-200 border border-white/[0.08] text-[10px] font-mono font-semibold tabular-nums whitespace-nowrap">
              OVR {baseOvr}
            </span>
            {activeSupercup ? (
              <span className="inline-flex text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/25 whitespace-nowrap">
                SUPERCUP
              </span>
            ) : isRelegationFight ? (
              <span className="inline-flex text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/25 whitespace-nowrap">
                - Form
              </span>
            ) : (isTitleContender || isPromotionHunt) ? (
              <span className="inline-flex text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 whitespace-nowrap">
                + Form
              </span>
            ) : (
              <span className="inline-flex text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.07] whitespace-nowrap">
                ±0 Form
              </span>
            )}
          </div>
        </div>

        {/* Right: Mobile OVR Badge + Primary Simulate Pill Button */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <span className="sm:hidden px-2 py-1 rounded-lg bg-white/[0.05] text-zinc-200 border border-white/[0.08] text-[10px] font-mono font-semibold tabular-nums whitespace-nowrap">
            OVR {baseOvr}
          </span>
          <button
            onClick={onSimulate}
            disabled={disabled}
            title={activeSupercup ? 'Press Space or click to play Supercup Opener' : 'Press Space or click to simulate campaign'}
            className={`cursor-pointer shrink-0 flex items-center gap-2 px-3.5 sm:px-4.5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-[13px] transition-all duration-150 active:scale-95 touch-manipulation border ${theme.buttonStyle}`}
          >
            <i className={`fas ${activeSupercup ? 'fa-trophy text-[10px]' : 'fa-play text-[10px]'}`} />
            <span className="whitespace-nowrap font-bold">
              {activeSupercup
                ? (lang === 'de' ? 'Supercup spielen' : 'Play Supercup')
                : isFirstHalf 
                  ? (lang === 'de' ? 'Hinrunde simulieren' : 'Simulate 1st Half') 
                  : (lang === 'de' ? 'Rückrunde simulieren' : 'Simulate 2nd Half')}
            </span>
            <span className={`hidden sm:inline text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${theme.spaceBadge}`}>
              SPACE
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
