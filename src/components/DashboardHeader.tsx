import React from 'react';
import { Club, GameState } from '../types';
import { getLeagueInfo, COUNTRIES, TACTICS, isReserveClub, getClubHistoricContext, getManagerStandingTier, getDomesticCupInfo, getClubFlag } from '../data/gameConstants';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { t as tr } from '../data/translations';
import { ALL_CLUBS } from '../data/clubsData';
import { ClubLogo } from './ClubLogo';

interface DashboardHeaderProps {
  state: GameState;
  lang: 'en' | 'de';
  financials: { expense: number; revenue: number; balance: number };
  clubsDb?: Club[];
  onShowTable?: () => void;
  onShowLedger?: () => void;
  onShowYouth?: () => void;
  onShowCareerHistory?: () => void;
  onShowNewBuild?: () => void;
  onOpenPhilosophyModal?: () => void;
  onOpenStaffAndTactics?: () => void;
  onOpenSkillsModal?: () => void;
  onOpenCustomization?: () => void;
  onOpenProfile?: () => void;
  onOpenOvrModal?: () => void;
  onOpenClubProfile?: () => void;
  onShowImpact?: () => void;
  onOpenMoraleModal?: () => void;
  onOpenShieldsModal?: () => void;
  onShowLeaderboard?: () => void;
  isModActive?: boolean;
  onOpenCoachDossier?: (coach: any) => void;
  onOpenLeagueModal?: () => void;
  onOpenSquadRegistration?: () => void;
  onOpenPrestigeModal?: () => void;
}

function formatNum(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  state,
  lang,
  clubsDb,
  isModActive: isModActiveProp,
  onOpenCustomization,
  onShowImpact,
  onShowCareerHistory,
  onOpenPhilosophyModal,
  onOpenStaffAndTactics,
  onOpenProfile,
  onOpenOvrModal,
  onOpenClubProfile,
  onShowLeaderboard,
  onOpenSkillsModal,
  onOpenCoachDossier,
  onOpenLeagueModal,
  onOpenSquadRegistration,
  onOpenPrestigeModal,
  onShowTable,
}) => {
  const isDe = lang === 'de';
  const t = (en: string, de?: string) => tr(lang, en, de);
  
  // Dynamically resolve modded club name, logo, and colors if a mod database is active
  const isModActive = isModActiveProp !== undefined 
    ? isModActiveProp 
    : (typeof window !== 'undefined' && localStorage.getItem('fms_real_mod_active') === 'true');

  const defaultClub = ALL_CLUBS.find(c => c.id === state.club.id || String(c.id) === String(state.club.id));
  const liveDbClub = isModActive 
    ? (clubsDb?.find(c => c.id === state.club.id || String(c.id) === String(state.club.id)) ||
       clubsDb?.find(c => c.name.toLowerCase().trim() === state.club.name.toLowerCase().trim()) ||
       defaultClub)
    : defaultClub;

  const clubName = isModActive ? (liveDbClub?.name || state.club.name) : (defaultClub?.name || state.club.name);
  const clubLogo = isModActive ? (liveDbClub?.logo || state.club.logo) : undefined;
  const clubFallbackLogo = isModActive ? (liveDbClub?.fallbackLogo || state.club.fallbackLogo) : undefined;
  const clubColor = state.club.color || (isModActive ? liveDbClub?.color : defaultClub?.color) || '1d4ed8';
  const clubCountry = state.club.country || (isModActive ? liveDbClub?.country : defaultClub?.country) || 'GER';

  const countryFlag = getClubFlag({ name: clubName, id: state.club.id, country: clubCountry });
  const leagueName = getLeagueInfo(state.club.tier, clubCountry)?.name || `League ${state.club.tier}`;
  const tactic = TACTICS[state.tactic] || TACTICS['Total Football'];
  const historicContext = isModActive ? (liveDbClub?.narrative || state.club.narrative || getClubHistoricContext(clubName, state.club.tier, isDe, clubCountry)) : undefined;
  
  const safeBaseOvr = (typeof state.club.baseOvr !== 'number' || Number.isNaN(state.club.baseOvr)) ? 60 : state.club.baseOvr;
  const prevOvrRaw = state.lastOvr !== undefined ? state.lastOvr : (state.history && state.history.length > 0 ? state.history[state.history.length - 1].ovr : safeBaseOvr);
  const previousOvr = (typeof prevOvrRaw !== 'number' || Number.isNaN(prevOvrRaw)) ? safeBaseOvr : prevOvrRaw;
  const ovrDiff = safeBaseOvr - previousOvr;
  const ovrColorClass = ovrDiff > 0 ? 'text-emerald-400' : ovrDiff < 0 ? 'text-red-400' : 'text-zinc-500';
  const ovrIcon = ovrDiff > 0 ? 'fa-arrow-up' : ovrDiff < 0 ? 'fa-arrow-down' : 'fa-minus';

  const ovrRadius = 38;
  const ovrCircum = 2 * Math.PI * ovrRadius;
  const ovrOffset = ovrCircum - (safeBaseOvr / 100) * ovrCircum;
  
  const leagueAvgOvr = getLeagueInfo(state.club.tier, state.club.country || 'GER')?.avgOvr || 60;
  const leagueDelta = safeBaseOvr - leagueAvgOvr;
  let ovrRingColorClass = 'stroke-white';
  if (leagueDelta > 2) {
    ovrRingColorClass = 'stroke-emerald-400';
  } else if (leagueDelta >= -2) {
    ovrRingColorClass = 'stroke-white';
  } else if (leagueDelta >= -5) {
    ovrRingColorClass = 'stroke-orange-500';
  } else {
    ovrRingColorClass = 'stroke-red-500';
  }

  const impact = state.clubImpactScore ?? 50;
  const impactRadius = 24;
  const impactCircum = 2 * Math.PI * impactRadius;
  const impactOffset = impactCircum - (impact / 100) * impactCircum;
  
  const rep = state.reputation ?? 50;
  const repRadius = 18;
  const repCircum = 2 * Math.PI * repRadius;
  const repOffset = repCircum - (rep / 100) * repCircum;

  const isReserve = isReserveClub(state.club.name);

  // Calculate club trophy collection
  const clubTrophyCounts = React.useMemo(() => {
    const counts: Record<string, number> = { cl: 0, cwc: 0, el: 0, ecl: 0, bl: 0, dfb: 0, lower: 0, reg: 0 };
    const currentName = state.club.name;
    const effectiveName = clubName;

    (state.history || []).forEach((h) => {
      if (h.clubName === currentName || h.clubName === effectiveName) {
        if (h.trophiesThisYear) {
          counts.cl += h.trophiesThisYear.cl || 0;
          counts.cwc += (h.trophiesThisYear as any).cwc || 0;
          counts.el += h.trophiesThisYear.el || 0;
          counts.ecl += h.trophiesThisYear.ecl || 0;
          counts.bl += h.trophiesThisYear.bl || 0;
          counts.dfb += h.trophiesThisYear.dfb || 0;
          counts.lower += h.trophiesThisYear.lower || 0;
          counts.reg += h.trophiesThisYear.reg || 0;
        }
      }
    });

    const historyTrophiesSum = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
    if (historyTrophiesSum === 0 && (state.trophyHistory || []).length > 0) {
      (state.trophyHistory || []).forEach((t) => {
        if (t.clubName === currentName || t.clubName === effectiveName) {
          const norm = (t.name || '').toLowerCase();
          if (norm.includes('elite') || norm.includes('cl') || norm.includes('champions league') || norm.includes('libertadores')) counts.cl += 1;
          else if (norm.includes('global') || norm.includes('cwc') || norm.includes('world')) counts.cwc += 1;
          else if (norm.includes('europa') || norm.includes('sudamericana') || norm.includes('euro cup')) counts.el += 1;
          else if (norm.includes('challenge') || norm.includes('conference') || norm.includes('recopa')) counts.ecl += 1;
          else if (norm.includes('top league') || norm.includes('meister') || norm.includes('champions')) counts.bl += 1;
          else if (norm.includes('cup') || norm.includes('pokal')) counts.dfb += 1;
          else if (norm.includes('lower')) counts.lower += 1;
          else if (norm.includes('reg')) counts.reg += 1;
        }
      });
    }

    return counts;
  }, [state.history, state.trophyHistory, clubName, state.club.name]);

  const totalClubSilverware = (Object.values(clubTrophyCounts) as number[]).reduce((a, b) => a + b, 0);
  const { cl: clTitle, el: elTitle, ecl: eclTitle } = getContinentalCupNames(clubCountry);
  const domesticCupTitle = getDomesticCupInfo(clubCountry, 1, clubName, state.club.id).name;
  const regionalCupTitle = getDomesticCupInfo(clubCountry, 4, clubName, state.club.id).name || (isDe ? 'Regionalpokal' : 'Regional Cup');
  const topLeagueTitle = getLeagueInfo(1, clubCountry).name;

  const trophyItems = [
    { id: 'cwc', count: clubTrophyCounts.cwc, title: 'Club World Cup', icon: 'fa-globe text-yellow-400', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' },
    { id: 'cl', count: clubTrophyCounts.cl, title: clTitle, icon: 'fa-star text-yellow-300', color: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200' },
    { id: 'el', count: clubTrophyCounts.el, title: elTitle, icon: 'fa-trophy text-orange-400', color: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
    { id: 'ecl', count: clubTrophyCounts.ecl, title: eclTitle, icon: 'fa-trophy text-emerald-400', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
    { id: 'bl', count: clubTrophyCounts.bl, title: topLeagueTitle, icon: 'fa-trophy text-amber-400', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
    { id: 'dfb', count: clubTrophyCounts.dfb, title: domesticCupTitle, icon: 'fa-award text-slate-200', color: 'border-slate-400/30 bg-slate-400/10 text-slate-200' },
    { id: 'lower', count: clubTrophyCounts.lower, title: isDe ? 'Untere Liga' : 'Lower Div', icon: 'fa-medal text-zinc-300', color: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300' },
    { id: 'reg', count: clubTrophyCounts.reg, title: regionalCupTitle, icon: 'fa-shield-halved text-amber-600', color: 'border-amber-700/30 bg-amber-700/10 text-amber-400' },
  ].filter((t) => t.count > 0);

  return (
    <div className="bg-[#161820]/75 backdrop-blur-2xl rounded-3xl p-3 sm:p-4 mb-6 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] relative overflow-hidden">
      {/* Subtle Ambient Sky-Blue Accent Gradient */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 relative z-10">
        
        {/* Box 1: Club Identity (Span 2) */}
        <div 
          onClick={onOpenClubProfile}
          className="col-span-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-5 sm:p-6 border border-white/[0.06] backdrop-blur-md transition-all duration-300 relative group cursor-pointer overflow-hidden flex flex-col justify-between min-h-[140px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenLeagueModal) onOpenLeagueModal();
                  else if (onShowTable) onShowTable();
                  else if (onOpenClubProfile) onOpenClubProfile();
                }}
                className="group/badge inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/25 px-2.5 py-0.5 rounded-full border border-sky-400/25 hover:border-sky-400/50 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Open League Standings & Universe Movements"
              >
                <i className="fa-solid fa-list-ol text-[9px] text-sky-400 group-hover/badge:scale-110 transition-transform"></i>
                <span>{leagueName}</span>
                <i className="fa-solid fa-chevron-right text-[8px] opacity-70 group-hover/badge:translate-x-0.5 transition-transform"></i>
              </button>



              {isReserve && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25 uppercase tracking-wider">
                  Reserve
                </span>
              )}
            </div>
            <div className="flex items-center gap-3.5">
              <div 
                className="hover:scale-105 transition-transform cursor-pointer"
                title={isDe ? 'Vereins-Dossier & Liga-Entwicklung öffnen' : 'Open Club Dossier & League Development'}
              >
                <ClubLogo
                  name={clubName}
                  id={state.club.id}
                  color={clubColor}
                  logo={clubLogo}
                  fallbackLogo={clubFallbackLogo}
                  isModActive={isModActive}
                  className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 drop-shadow-md"
                />
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight truncate leading-tight pb-0.5 group-hover:text-sky-300 transition-colors">
                  {clubName}
                </h2>
                <span className="text-xl sm:text-2xl shrink-0">{countryFlag}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <p 
              className="text-[11px] sm:text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors font-medium line-clamp-1 sm:line-clamp-2 pr-2 flex-1 leading-snug"
              title={isDe ? 'Vereins-Dossier & Historie ansehen' : 'View Club Dossier & Heritage'}
            >
              {historicContext || (isDe ? 'Verein ohne besondere Historie.' : 'A club with no special history.')}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {onOpenClubProfile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenClubProfile();
                  }}
                  title={isDe ? 'Vereins-Dossier & Liga-Entwicklung' : 'Club Dossier & League Development'}
                  className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-sky-500/20 hover:text-sky-300 text-zinc-400 border border-white/[0.06] flex items-center justify-center transition-colors text-xs cursor-pointer"
                >
                  <i className="fas fa-shield-halved text-[11px]"></i>
                </button>
              )}
            </div>
          </div>

          {/* Trophy Collection (Integrated directly underneath club context) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onShowCareerHistory) onShowCareerHistory();
              else if (onOpenClubProfile) onOpenClubProfile();
            }}
            className="mt-3.5 pt-2.5 border-t border-white/[0.07] flex items-center justify-between gap-2 text-left w-full group/trophies cursor-pointer hover:bg-white/[0.02] -mx-1 px-1 py-1 rounded-xl transition-colors"
            title={isDe ? 'Trophäensammlung & Vereinshistorie ansehen' : 'View Trophy Collection & Club History'}
          >
            {totalClubSilverware > 0 ? (
              <>
                <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap py-0.5">
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-amber-400/90 mr-0.5">
                    <i className="fas fa-trophy text-amber-400 text-[11px]"></i>
                    <span className="hidden xs:inline">{isDe ? 'Titel' : 'Honours'}</span>
                  </div>
                  {trophyItems.map((item) => (
                    <div
                      key={item.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold shadow-sm shrink-0 transition-transform group-hover/trophies:scale-105 ${item.color}`}
                      title={`${item.title} (${item.count}x)`}
                    >
                      <i className={`fas ${item.icon} text-[10px]`}></i>
                      <span className="whitespace-nowrap">{item.title}</span>
                      <span className="ml-0.5 px-1 py-0.2 rounded bg-white/20 text-white font-mono text-[9px] font-black">
                        {item.count}x
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 group-hover/trophies:text-white transition-colors text-xs font-semibold pl-1.5 self-center">
                  <span className="text-[11px] font-mono font-bold text-amber-300">{totalClubSilverware}</span>
                  <i className="fas fa-chevron-right text-[9px] text-zinc-500 group-hover/trophies:translate-x-0.5 transition-transform"></i>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-zinc-400 text-[11px] truncate">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mr-0.5 shrink-0">
                    <i className="fas fa-trophy text-zinc-400 text-[11px]"></i>
                    <span>{isDe ? 'Titel' : 'Honours'}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium truncate">
                    {isDe ? 'Noch keine Vereinstitel · Jagd auf Silberware läuft' : '0 Silverware · In pursuit of first honours'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-30 group-hover/trophies:opacity-50 transition-opacity shrink-0">
                  <i className="fas fa-trophy text-[11px] text-white" title="League Title"></i>
                  <i className="fas fa-award text-[11px] text-white" title="Domestic Cup"></i>
                  <i className="fas fa-star text-[11px] text-white" title="Continental Trophy"></i>
                  <i className="fas fa-chevron-right text-[9px] text-zinc-500 ml-1"></i>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Box 2: Club OVR */}
        <div onClick={onOpenOvrModal} className="col-span-1 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer rounded-2xl p-4 sm:p-6 border border-white/[0.06] backdrop-blur-md relative flex flex-col items-center justify-center min-h-[120px] sm:min-h-[140px] group">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
             <i className="fas fa-magnifying-glass text-zinc-400 text-xs"></i>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">{t('OVR', 'GES')}</div>
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 sm:w-24 sm:h-24 overflow-visible shrink-0" viewBox="0 0 96 96">
              <g transform="rotate(-90 48 48)">
              <circle cx="48" cy="48" r={ovrRadius} className="stroke-white/[0.06] fill-none" strokeWidth="8" />
              <circle 
                cx="48" 
                cy="48" 
                r={ovrRadius} 
                className={`fill-none ${ovrRingColorClass} transition-all duration-1000 ease-out`} 
                strokeWidth="8" 
                strokeDasharray={ovrCircum} 
                strokeDashoffset={ovrOffset} 
                strokeLinecap="round" 
              />
              </g>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none tabular-nums">{safeBaseOvr}</span>
            </div>
            {ovrDiff !== 0 && (
              <div className={`absolute -right-3 -bottom-1 flex items-center gap-0.5 text-xs font-semibold ${ovrColorClass} bg-[#161820] px-2 py-0.5 rounded-full border border-white/[0.08] shadow-sm tabular-nums`}>
                <i className={`fas ${ovrIcon} text-[10px]`}></i>
                <span>{Math.abs(ovrDiff)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Box 3: Club Impact Ring */}
        <div 
          onClick={onShowImpact}
          className="bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-4 sm:p-6 border border-white/[0.06] backdrop-blur-md transition-all duration-300 relative group cursor-pointer flex items-center justify-between min-h-[120px] sm:min-h-[140px]"
          title="Club Impact, Board Trust & Dressing Room Pulse"
        >
          <div className="flex flex-col h-full justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{t('Impact', 'Einfluss')}</div>
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none tabular-nums">{impact}</div>
          </div>
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible shrink-0" viewBox="0 0 64 64">
              <g transform="rotate(-90 32 32)">
              <circle cx="32" cy="32" r={impactRadius} className="stroke-white/[0.06] fill-none" strokeWidth="6" />
              <circle 
                cx="32" 
                cy="32" 
                r={impactRadius} 
                className={`fill-none ${impact >= 70 ? 'stroke-sky-400' : impact <= 30 ? 'stroke-rose-500' : 'stroke-zinc-300'} transition-all duration-1000 ease-out`} 
                strokeWidth="6" 
                strokeDasharray={impactCircum} 
                strokeDashoffset={impactOffset} 
                strokeLinecap="round" 
              />
              </g>
            </svg>
            <i className="fas fa-bolt absolute text-sky-400/80 text-xs"></i>
          </div>
        </div>

        {/* Row 2 */}
        
        {/* Box 4: Director Setup */}
        <div 
          onClick={onShowCareerHistory}
          className="bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-4 sm:p-5 border border-white/[0.06] backdrop-blur-md transition-all duration-300 relative group cursor-pointer flex flex-col justify-between min-h-[100px] sm:min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{t('Sporting Director', 'Sportdirektor')}</div>
            {state.club.tier === 1 && state.budget >= 250000 && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPrestigeModal && onOpenPrestigeModal();
                }}
                className="ml-2 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/40 transition shadow-[0_0_10px_rgba(245,158,11,0.2)] flex items-center justify-center cursor-pointer"
                title="Access Legacy & Prestige Options"
              >
                <i className="fa-solid fa-crown text-xs"></i>
              </button>
            )}
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight truncate mt-auto leading-none pb-1">
            {state.managerName}
          </div>
        </div>

        {/* Box 5: Philosophy & Coach */}
        <div 
          onClick={() => {
            if (onOpenStaffAndTactics) {
              onOpenStaffAndTactics();
            } else if (onOpenPhilosophyModal) {
              onOpenPhilosophyModal();
            } else if (state.currentCoach && onOpenCoachDossier) {
              onOpenCoachDossier(state.currentCoach);
            }
          }}
          className="bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-4 sm:p-5 border border-white/[0.06] backdrop-blur-md transition-all duration-300 relative group cursor-pointer flex flex-col justify-between min-h-[100px] sm:min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 truncate">{t('Coach & Tactics', 'Trainer & Taktik')}</div>
            {state.currentCoach && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenCoachDossier) onOpenCoachDossier(state.currentCoach);
                }}
                className="text-[9px] font-semibold text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 px-2 py-0.5 rounded-lg border border-sky-400/25 flex items-center gap-1 transition cursor-pointer"
                title={isDe ? 'Vertrauliches Trainer-Dossier ansehen' : 'View Confidential Coach Dossier'}
              >
                <i className="fa-solid fa-fingerprint text-[8px]"></i>
                <span>Dossier</span>
              </button>
            )}
          </div>
          <div className="flex flex-col mt-auto pb-1 gap-1">
            <div className="font-bold text-white text-base truncate leading-normal py-0.5">
              {state.currentCoach ? state.currentCoach.name : t('No Coach', 'Kein Trainer')}
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <i className={`fas ${tactic.icon} text-[10px] text-sky-400`}></i>
              <span className="font-medium text-[11px] uppercase tracking-wide truncate">{state.tactic}</span>
              {state.staleTactic && state.tactic === state.staleTactic && (
                <span className="px-1.5 py-0.2 rounded text-[8px] bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse font-bold">
                  STALE (-4)
                </span>
              )}
            </div>
          </div>
          
          {/* Coach warning injection */}
          {!state.currentCoach && (
            <div className="absolute -top-1.5 -right-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow-sm">
               NO COACH (-4)
            </div>
          )}
          {state.currentCoach && state.currentCoach.contractYearsLeft === 0 && (
             <div className="absolute -top-1.5 -right-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow-sm">
               RENEW COACH
            </div>
          )}
        </div>

        {/* Box 6: Reputation Ring (Opens Manager Reputation Modal) */}
        <div 
          onClick={onOpenProfile}
          className="bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 rounded-2xl p-4 sm:p-5 border border-white/[0.06] backdrop-blur-md relative group cursor-pointer flex items-center justify-between min-h-[100px] sm:min-h-[120px]"
          title="Open Manager Reputation & Standing"
        >
          <div className="flex flex-col h-full justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              {t('Reputation', 'Ansehen')}
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto pb-0.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none tabular-nums">{rep}</span>
              <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">{t('Rep', 'Ruf')}</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-medium truncate max-w-[130px] sm:max-w-[150px] flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rep >= 70 && state.club.tier === 1 ? 'bg-sky-400' : rep >= 50 ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className="truncate">
                {getManagerStandingTier(rep, state.club.tier, isDe).shortTitle}
              </span>
            </div>
          </div>
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible shrink-0" viewBox="0 0 48 48">
              <g transform="rotate(-90 24 24)">
              <circle cx="24" cy="24" r={repRadius} className="stroke-white/[0.06] fill-none" strokeWidth="4" />
              <circle 
                cx="24" 
                cy="24" 
                r="18" 
                className="fill-none stroke-amber-400 transition-all duration-1000 ease-out" 
                strokeWidth="4" 
                strokeDasharray={repCircum} 
                strokeDashoffset={repOffset} 
                strokeLinecap="round" 
              />
              </g>
            </svg>
            <i className="fas fa-medal absolute text-amber-400/80 text-[11px]"></i>
          </div>
        </div>

        {/* Box 7: Career Score / Skill Points */}
        <div 
          onClick={onShowLeaderboard}
          className="col-span-1 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-4 sm:p-5 border border-white/[0.06] backdrop-blur-md transition-all duration-300 relative group cursor-pointer flex flex-col justify-between min-h-[100px] sm:min-h-[120px]"
        >
          <div className="flex items-center justify-between">
             <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{t('Score / Leaderboard', 'Punkte / Rangliste')}</div>
             {(state.skillPoints || 0) > 0 && (
               <button
                 type="button"
                 onClick={(e) => {
                   e.stopPropagation();
                   onOpenSkillsModal();
                 }}
                 className="text-[9px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-xl border border-amber-500/25 uppercase tracking-wider cursor-pointer transition-colors tabular-nums"
               >
                 +{(state.skillPoints || 0)} SP
               </button>
             )}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 tracking-tight flex items-center gap-2 mt-auto leading-none pb-1 tabular-nums">
            <i className="fas fa-trophy text-amber-400/40 text-sm"></i>
            {formatNum(state.careerScore || 0)}
          </div>
        </div>

      </div>
    </div>
  );
};
