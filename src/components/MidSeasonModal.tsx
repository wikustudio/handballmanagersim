import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { t } from '../data/translations';
import { getLeagueInfo, isReserveClub } from '../data/gameConstants';
import { generateMidSeasonEvent } from '../engine/midSeasonEngine';
import { getCupName } from '../data/randomEvents';
import { getContinentalCupNames } from '../utils/regionHelpers';

interface MidSeasonModalProps {
  state: GameState;
  lang: Language;
  onClose: (eventToQueue?: any) => void;
  onSelectCamp?: (type: 'local' | 'spain' | 'dubai', cost: number) => void;
  onOpenCoachMarket?: (eventToQueue?: any) => void;
  creditLimit?: number;
}

export const MidSeasonModal: React.FC<MidSeasonModalProps> = ({ 
  state, 
  lang, 
  onClose,
  onOpenCoachMarket
}) => {
  const [event] = useState(() => generateMidSeasonEvent(state));
  
  const expectedRank = state.boardTargetFinish || (state.club.tier === 1 ? 8 : 12);
  const midPos: number | undefined = (state.pendingSeasonState as any)?._meta?.midPos;
  const midPts = state.midSeasonPts ?? 24;

  const leagueInfo = getLeagueInfo(state.club.tier, state.club.country || 'GER');
  
  // Prediction logic based on actual 1st-half standings (midPos / midPts)
  let predictionStr = t(lang, 'Mid-Table', 'Mittelfeld');
  let predictionColor = 'text-yellow-400';
  let performanceStr = t(lang, 'Meeting Expectations', 'Erwartungen erfüllt');
  
  if ((midPos !== undefined && midPos <= 3) || (midPos === undefined && midPts >= 33)) { 
    predictionStr = t(lang, 'Title Contenders', 'Titelkandidat'); 
    predictionColor = 'text-emerald-400'; 
  } else if ((midPos !== undefined && midPos <= 7) || (midPos === undefined && midPts >= 26)) { 
    predictionStr = t(lang, 'Upper Half', 'Obere Hälfte'); 
    predictionColor = 'text-emerald-400'; 
  } else if ((midPos !== undefined && midPos >= 15) || (midPos === undefined && midPts <= 17)) { 
    predictionStr = t(lang, 'Relegation Battle', 'Abstiegskampf'); 
    predictionColor = 'text-rose-400'; 
  }

  const effectiveMidPos = midPos ?? (midPts >= 33 ? 2 : midPts >= 26 ? 6 : midPts <= 17 ? 16 : 10);
  if (effectiveMidPos < expectedRank - 1 || (expectedRank <= 2 && effectiveMidPos === 1)) {
    performanceStr = t(lang, 'Exceeding Expectations', 'Erwartungen übertroffen');
  } else if (effectiveMidPos > expectedRank + 2) {
    performanceStr = t(lang, 'Falling Short', 'Hinter Erwartungen');
    if (predictionColor === 'text-yellow-400') {
      predictionColor = 'text-rose-400';
    }
  } else {
    performanceStr = t(lang, 'Meeting Expectations', 'Erwartungen erfüllt');
  }

  if (state.boardExpectsSuccess && predictionStr !== t(lang, 'Title Contenders', 'Titelkandidat')) {
    performanceStr = t(lang, 'Falling Short', 'Hinter Erwartungen');
    predictionColor = 'text-rose-400';
  }

  const country = state.club.country || 'GER';
  const domesticCupName = getCupName('dfb', country, state.club.tier, state.club.name);
  const contCupNames = getContinentalCupNames(country);
  const isReserve = isReserveClub(state.club.name);
  const lastSeason = state.history && state.history.length > 0 ? state.history[state.history.length - 1] : null;
  const activeEuro = state.euroStatus || state.club.euroCup || (state as any).euroCup || lastSeason?.euroNextSeason ||
    (state.cupProgress?.['cl'] ? 'CL' : state.cupProgress?.['el'] ? 'EL' : state.cupProgress?.['ecl'] ? 'ECL' : null);

  interface CompEntry {
    id: string;
    name: string;
    category: string;
    icon: string;
    status: string;
    isActive: boolean;
    color: string;
    badgeBg: string;
  }

  const compList: CompEntry[] = [];

  const getCupStatusInfo = (cupId: string) => {
    const progress = state.cupProgress?.[cupId];
    if (progress === 'SF') {
      return {
        isActive: true,
        status: t(lang, 'Semi-Final', 'Halbfinale'),
        color: 'bg-emerald-500/20 text-emerald-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      };
    }
    if (progress === 'FINAL') {
      return {
        isActive: true,
        status: t(lang, 'Final', 'Finale'),
        color: 'bg-amber-500/20 text-amber-400',
        badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
      };
    }
    if (progress === 'QF') {
      return {
        isActive: true,
        status: t(lang, 'In Contention', 'Im Rennen'),
        color: 'bg-sky-500/20 text-sky-400',
        badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20'
      };
    }
    if (progress === 'eliminated_qf' || progress === 'eliminated') {
      return {
        isActive: false,
        status: t(lang, 'Eliminated (QF)', 'Ausgeschieden (VF)'),
        color: 'bg-rose-500/20 text-rose-400',
        badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      };
    }
    return {
      isActive: false,
      status: t(lang, 'Eliminated (Early)', 'Ausgeschieden (Vorrunde)'),
      color: 'bg-zinc-500/20 text-zinc-400',
      badgeBg: 'bg-zinc-500/10 text-zinc-400 border-white/10'
    };
  };

  // 1. League
  compList.push({
    id: 'league',
    name: leagueInfo.name,
    category: t(lang, 'League Campaign', 'Liga'),
    icon: 'fa-list-ol',
    status: t(lang, 'In Progress', 'Laufend'),
    isActive: true,
    color: 'bg-blue-500/20 text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
  });

  // 2. Domestic Cup
  if (!isReserve && (state.club.tier <= 3 || state.regionalCupWinner)) {
    const cupInfo = getCupStatusInfo('dfb');
    compList.push({
      id: 'dfb',
      name: domesticCupName,
      category: t(lang, 'National Cup', 'Nationaler Pokal'),
      icon: 'fa-trophy',
      status: cupInfo.status,
      isActive: cupInfo.isActive,
      color: cupInfo.color,
      badgeBg: cupInfo.badgeBg
    });
  }

  // 3. Regional Cup
  const playsRegCup = !isReserve && (country === 'TUR' ? state.club.tier === 3 : state.club.tier >= 4);
  if (playsRegCup) {
    const regCupName = getCupName('reg', country, state.club.tier, state.club.name);
    const cupInfo = getCupStatusInfo('reg');
    compList.push({
      id: 'reg',
      name: regCupName,
      category: t(lang, 'Regional Cup', 'Verbandspokal'),
      icon: 'fa-shield-halved',
      status: cupInfo.status,
      isActive: cupInfo.isActive,
      color: cupInfo.isActive ? 'bg-amber-500/20 text-amber-400' : cupInfo.color,
      badgeBg: cupInfo.badgeBg
    });
  }

  // 4. Secondary Cup (ENG)
  if (!isReserve && country === 'ENG' && state.club.tier <= 4) {
    const cupInfo = getCupStatusInfo('efl');
    compList.push({
      id: 'efl',
      name: 'EFL Carabao Cup',
      category: t(lang, 'League Cup', 'Ligapokal'),
      icon: 'fa-medal',
      status: cupInfo.status,
      isActive: cupInfo.isActive,
      color: cupInfo.isActive ? 'bg-cyan-500/20 text-cyan-400' : cupInfo.color,
      badgeBg: cupInfo.badgeBg
    });
  }

  // 5. Continental Cup
  if (!isReserve && activeEuro) {
    let contName = contCupNames.cl;
    let catName = t(lang, 'Champions Tournament', 'Königsklasse');
    const euroKey = activeEuro === 'EL' ? 'el' : activeEuro === 'ECL' ? 'ecl' : 'cl';
    if (activeEuro === 'EL') {
      contName = contCupNames.el;
      catName = t(lang, 'Continental League', 'Europa League');
    } else if (activeEuro === 'ECL') {
      contName = contCupNames.ecl;
      catName = t(lang, 'Conference Cup', 'Conference League');
    }
    const cupInfo = getCupStatusInfo(euroKey);
    compList.push({
      id: 'continental',
      name: contName,
      category: catName,
      icon: 'fa-globe',
      status: cupInfo.isActive ? t(lang, 'Knockouts', 'K.-o.-Phase') : cupInfo.status,
      isActive: cupInfo.isActive,
      color: cupInfo.isActive ? 'bg-indigo-500/20 text-indigo-400' : cupInfo.color,
      badgeBg: cupInfo.isActive ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : cupInfo.badgeBg
    });
  }

  const activeCount = compList.filter(c => c.isActive).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col justify-center items-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-2xl overflow-y-auto overscroll-contain">
      <motion.div 
        initial={{ scale: 0.95, y: 15 }} 
        animate={{ scale: 1, y: 0 }} 
        exit={{ scale: 0.95, y: 15 }} 
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-[540px] bg-[#12141c]/95 text-white rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-white/[0.08] bg-white/[0.02] flex justify-between items-center shrink-0 relative z-10">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-0.5">
              {t(lang, 'Mid-Season Window', 'Winterpause')}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t(lang, 'Winter Break Overview', 'Winterpause Übersicht')}</h2>
            <p className="text-xs text-zinc-400 font-medium">{t(lang, 'Board Progress & Squad Trajectory Report', 'Vorstands-Zwischenbericht & sportlicher Status')}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center text-base border border-sky-400/25 shadow-inner shrink-0">
              <i className="fas fa-snowflake"></i>
            </div>
            <button 
              onClick={() => onClose(event)} 
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
              title={t(lang, 'Close', 'Schließen')}
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 relative z-10 custom-scrollbar flex-1 min-h-0">
          {/* Top Halfway KPI Strip (3 Compact Columns) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] text-center">
              <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-0.5">
                {t(lang, 'Mid-Season Points', 'Hinrunden-Punkte')}
              </div>
              <div className="text-sm sm:text-base font-black text-white tabular-nums">
                {midPts} Pts {midPos ? `(#${midPos})` : ''}
              </div>
            </div>
            <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] text-center">
              <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-0.5">
                {t(lang, 'Board Target', 'Saisonziel')}
              </div>
              <div className="text-sm sm:text-base font-black text-sky-400 tabular-nums">
                Top {expectedRank}
              </div>
            </div>
            <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] text-center">
              <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-0.5">
                {t(lang, 'Trajectory', 'Tendenz')}
              </div>
              <div className={`text-xs sm:text-sm font-bold truncate ${predictionColor}`} title={`${predictionStr} (${performanceStr})`}>
                {predictionStr}
              </div>
              <div className="text-[9px] text-zinc-400 truncate mt-0.5">
                {performanceStr}
              </div>
            </div>
          </div>

          {/* Active Competitions */}
          <div className="bg-white/[0.03] p-3.5 sm:p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
            <h3 className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-2.5 flex items-center justify-between">
              <span>{t(lang, 'Active Competitions', 'Aktive Wettbewerbe')}</span>
              <span className="text-sky-400 font-semibold text-xs">{activeCount} {t(lang, 'Active', 'Aktiv')}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {compList.map((comp) => (
                <div 
                  key={comp.id} 
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    comp.isActive ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white/[0.01] border-white/[0.03] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <div className={`w-6 h-6 rounded-lg ${comp.color} flex items-center justify-center text-[10px] shrink-0`}>
                      <i className={`fas ${comp.icon}`}></i>
                    </div>
                    <div className="truncate">
                      <div className={`text-xs font-semibold truncate ${comp.isActive ? 'text-white' : 'text-zinc-400'}`}>{comp.name}</div>
                      <div className="text-[9px] text-zinc-400 truncate">{comp.category}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${comp.badgeBg}`}>
                    {comp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Head Coach Report */}
          <div className="bg-white/[0.03] p-3.5 sm:p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
            <h3 className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-2.5">{t(lang, 'Head Coach Report', 'Cheftrainer Bericht')}</h3>
            {state.currentCoach ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-400/25 shrink-0">
                    <i className="fas fa-user-tie text-xs"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{state.currentCoach.name}</div>
                    <div className="text-[10px] text-zinc-400">{state.currentCoach.style} System</div>
                  </div>
                </div>
                <div className="mt-1 text-xs italic text-zinc-300 border-l-2 border-sky-400/50 pl-3 py-0.5">
                  {state.currentCoach.ovrBoost >= 1 ? (
                    t(lang, '"We have a solid foundation, but to secure our targets, we need to stay sharp through the winter break."', '"Wir haben ein solides Fundament, müssen aber über die Winterpause konzentriert bleiben."')
                  ) : state.currentCoach.ovrBoost < 0 ? (
                    t(lang, '"The players are not listening. I need completely different players for my system. Buy anyone!"', '"Die Spieler hören mir nicht zu. Ich brauche komplett andere Spielertypen für mein System. Kauft irgendwen!"')
                  ) : (
                    t(lang, '"The squad is balanced. Let us focus on tactical discipline for the second half of the season."', '"Der Kader ist ausgeglichen. Konzentrieren wir uns in der Rückrunde auf taktische Disziplin."')
                  )}
                </div>
              </div>
            ) : state.midSeasonResignedCoach ? (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                    <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
                    <span>{t(lang, 'COACH THREW IN THE TOWEL!', 'TRAINER WIRFT DAS HANDTUCH!')}</span>
                  </div>
                  <div className="text-[11px] text-rose-200/95 leading-relaxed">
                    {t(
                      lang,
                      `Head Coach ${state.midSeasonResignedCoach.name} abruptly resigned at the break citing tactical clash (${state.tactic} vs ${state.midSeasonResignedCoach.style}) and trophy drought. (-20 Morale applied)`,
                      `Cheftrainer ${state.midSeasonResignedCoach.name} ist in der Winterpause wegen taktischer Differenzen (${state.tactic} vs ${state.midSeasonResignedCoach.style}) und Titelflaute überraschend zurückgetreten! (-20 Moral)`
                    )}
                  </div>
                </div>
                {onOpenCoachMarket && (
                  <button
                    onClick={() => onOpenCoachMarket(event)}
                    className="shrink-0 bg-rose-500/25 hover:bg-rose-500/35 text-rose-100 border border-rose-400/30 font-bold py-2 px-3.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <i className="fas fa-users-viewfinder text-xs"></i>
                    <span>{t(lang, 'Hire Coach', 'Trainer suchen')}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                    <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
                    <span>{t(lang, 'No Head Coach Appointed', 'Kein Cheftrainer im Amt')}</span>
                  </div>
                  <div className="text-[11px] text-rose-200/90 leading-snug">
                    {t(
                      lang,
                      'Appoint a Head Coach to maximize training synergy and tactical identity ahead of the 2nd half.',
                      'Verpflichte einen Cheftrainer, um Trainings-Synergie und Spielsystem vor der Rückrunde zu sichern.'
                    )}
                  </div>
                </div>
                {onOpenCoachMarket && (
                  <button
                    onClick={() => onOpenCoachMarket(event)}
                    className="shrink-0 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-bold py-2 px-3.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fas fa-users-viewfinder text-xs"></i>
                    <span>{t(lang, 'Hire Coach', 'Trainer suchen')}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Info Strip */}
          <div className="bg-sky-500/10 border border-sky-400/20 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs shrink-0 border border-sky-400/30">
              <i className="fa-solid fa-arrows-rotate"></i>
            </div>
            <p className="text-[11px] sm:text-xs text-sky-200/90 leading-snug">
              {t(
                lang,
                'January Window Open: +2 Regular & +1 Key Transfer slots unlocked. Optional Training Camp & Squad Bonding available in the dashboard.',
                'Januar-Transferfenster geöffnet: +2 reguläre & +1 Schlüssel-Transfer-Slots freigeschaltet. Optionales Trainingslager & Fan-Aktionen im Dashboard verfügbar.'
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-white/[0.02] shrink-0 relative z-10 flex items-center justify-end">
          <button
            onClick={() => onClose(event)}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-sky-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t(lang, 'Continue', 'Weiter')}</span>
            <i className="fas fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
