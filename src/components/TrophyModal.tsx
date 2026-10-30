import React, { useEffect } from "react";
import { motion } from "motion/react";
import { getRegion } from '../utils/regionHelpers';



import confetti from 'canvas-confetti';
import { Language } from '../types';
import { formatMoney, getLeagueInfo, getDomesticCupInfo } from '../data/gameConstants';
import { t as tr, getLoc } from '../data/translations';
import { PrestigeTrophy } from './PrestigeTrophy';

export type ModalType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'platinum'
  | 'gold'
  | 'champions'
  | 'epic_trophy'
  | 'cl_champions'
  | 'bl_champions'
  | 'b2_champions'
  | 'l3_champions'
  | 'reg_champions'
  | 'ob_champions'
  | 'minor_trophy'
  | 'silver'
  | 'bronze'
  | 'promotion'
  | 'trophy';

interface TrophyModalProps {
  title: string;
  message: string;
  type: ModalType;
  lang: Language;
  country?: string;
  clubName?: string;
  clubId?: number;
  onClose: () => void;
  logo?: string;
  prizeMoney?: number;
}

export const TrophyModal: React.FC<TrophyModalProps> = React.memo(({
  title,
  message,
  type,
  lang,
  country = 'GER',
  clubName,
  clubId,
  onClose,
  logo,
  prizeMoney,
}) => {
  const isDe = lang === 'de';
  const t = (en: string, de?: string, _ignoredEs?: string) => tr(lang, en, de);

  const isBl = type === 'bl_champions';
  const isB2 = type === 'b2_champions';
  const isL3 = type === 'l3_champions';
  const isReg = type === 'reg_champions';
  const isOb = type === 'ob_champions';
  const isLeagueChampion = isBl || isB2 || isL3 || isReg || isOb;

  const isPlatinum = type === 'platinum';
  const isGold =
    type === 'gold' ||
    type === 'champions' ||
    type === 'epic_trophy' ||
    type === 'cl_champions' ||
    isBl;
  const isSilver = type === 'minor_trophy' || isB2;
  const isBronze = type === 'bronze' || isReg;
  const isEmerald = type === 'promotion' || isL3;
  const isEpicWin =
    isPlatinum ||
    isGold ||
    isSilver ||
    isBronze ||
    isEmerald ||
    isOb ||
    isLeagueChampion ||
    type === 'trophy';

  useEffect(() => {
    if (isEpicWin) {
      const confColors = isBl
        ? ['#fef08a', '#fbbf24', '#f59e0b', '#ffffff']
        : isB2
        ? ['#e2e8f0', '#cbd5e1', '#fbbf24', '#ffffff']
        : isL3
        ? ['#34d399', '#10b981', '#fbbf24', '#ffffff']
        : isReg
        ? ['#f43f5e', '#f59e0b', '#cd7f32', '#ffffff']
        : isOb
        ? ['#fbbf24', '#d97706', '#b45309', '#ffffff']
        : isPlatinum
        ? ['#ffffff', '#e2e8f0', '#94a3b8']
        : isGold
        ? ['#fbbf24', '#f59e0b', '#ffffff']
        : isSilver
        ? ['#cbd5e1', '#94a3b8', '#ffffff']
        : isBronze
        ? ['#cd7f32', '#d97706', '#b45309', '#ffffff']
        : ['#34d399', '#10b981', '#ffffff'];

      const duration =
        type === 'platinum' || type === 'cl_champions' || isLeagueChampion || type === 'gold' ? 3500 : 2500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: confColors,
          zIndex: 9999,
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: confColors,
          zIndex: 9999,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    } else if (type === 'success') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#30d158', '#ffffff'],
        zIndex: 9999,
      });
    }
  }, [type, isEpicWin, isPlatinum, isGold, isSilver, isBronze, isLeagueChampion, isBl, isB2, isL3, isReg, isOb]);

  if (isEpicWin) {
    const l1Name = getLeagueInfo(1, country).name;
    const l2Name = getLeagueInfo(2, country).name;
    const l3Name = getLeagueInfo(3, country).name;
    const l4Name = getLeagueInfo(4, country).name;
    const l5Name = getLeagueInfo(5, country).name;

    const crownStr = isBl
      ? country === 'POR'
        ? 'Primeira Liga • Campeão Nacional 🏆'
        : country === 'ESP'
        ? 'La Liga • Campeón de España 🏆'
        : country === 'FRA'
        ? 'Ligue 1 • Champion de France 🏆'
        : country === 'ENG'
        ? 'Premier League • Champions of England 🏆'
        : country === 'ECU'
        ? 'LigaPro Serie A • Campeón Nacional 🏆'
        : isDe && country === 'GER'
        ? 'German First Division • Champion 🏆'
        : `${l1Name} Champions 🏆`
      : isB2
      ? country === 'ENG'
        ? 'EFL Championship • Champions 🏆'
        : country === 'ESP'
        ? 'La Liga Hypermotion • Campeón 🏆'
        : country === 'FRA'
        ? 'Ligue 2 • Champion 🏆'
        : country === 'ECU'
        ? 'LigaPro Serie B • Campeón 🏆'
        : isDe && country === 'GER'
        ? 'German Second Division • Champion 🏆'
        : `${l2Name} Champions 🏆`
      : isL3
      ? country === 'ENG'
        ? 'EFL League One • Champions 🏆'
        : country === 'ESP'
        ? 'Primera Federación • Campeón 🏆'
        : country === 'FRA'
        ? 'National 1 • Champion 🏆'
        : country === 'ECU'
        ? 'Segunda Categoría • Campeón 🏆'
        : isDe && country === 'GER'
        ? '3. Liga • Meister 🏆'
        : `${l3Name} Champions 🏆`
      : isReg
      ? country === 'ENG'
        ? 'EFL League Two • Champions 🏆'
        : country === 'ESP'
        ? 'Segunda Federación • Campeón 🏆'
        : country === 'FRA'
        ? 'National 2 • Champion 🏆'
        : country === 'ECU'
        ? 'Segunda Cat. Provincial • Campeón 🏆'
        : isDe && country === 'GER'
        ? 'Regionalliga • Meister 🏆'
        : `${l4Name} Champions 🏆`
      : isOb
      ? country === 'ENG'
        ? 'National League • Champions 🏆'
        : country === 'ESP'
        ? 'Tercera Federación • Campeón 🏆'
        : country === 'FRA'
        ? 'National 3 • Champion 🏆'
        : country === 'ECU'
        ? 'Torneo Amateur • Campeón 🏆'
        : isDe && country === 'GER'
        ? 'Oberliga • Meister 🏆'
        : `${l5Name} Champions 🏆`
      : type === 'cl_champions'
      ? country === 'USA'
        ? (isDe ? 'Koenige Nordamerikas' : 'Kings of CONCACAF')
        : country === 'ECU'
        ? (isDe ? 'Suedamerikas Koenige' : 'Kings of South America')
        : isDe
        ? 'Europas Koenige'
        : 'Kings of Europe'
      : isBronze
      ? isDe
        ? country === 'POR' ? 'Taça Distrital Sieger' : country === 'ESP' ? 'Copa RFEF Sieger' : country === 'FRA' ? 'Coupe de Ligue Sieger' : country === 'ENG' ? 'FA Trophy Sieger' : 'Landespokalsieger'
        : country === 'POR' ? 'Taça Distrital Winners' : country === 'ESP' ? 'Copa RFEF Winners' : country === 'FRA' ? 'Coupe de Ligue Winners' : country === 'ENG' ? 'FA Trophy Winners' : 'Regional Cup Winner'
      : type === 'promotion'
      ? (isDe ? 'Aufstieg gesichert ↑' : 'Promotion Achieved ↑')
      : isDe
      ? `${getDomesticCupInfo(country, 1, clubName, clubId).name} Sieger`
      : `${getDomesticCupInfo(country, 1, clubName, clubId).name} Winners`;

    const gradFrom = isBl
      ? 'from-yellow-300'
      : isB2
      ? 'from-slate-200'
      : isL3
      ? 'from-emerald-300'
      : isReg
      ? 'from-rose-400'
      : isOb
      ? 'from-amber-300'
      : isPlatinum
      ? 'from-slate-100'
      : isGold
      ? 'from-yellow-300'
      : isSilver
      ? 'from-slate-300'
      : isBronze
      ? 'from-amber-600'
      : type === 'promotion'
      ? 'from-cyan-400'
      : 'from-emerald-300';

    const gradTo = isBl
      ? 'to-amber-500'
      : isB2
      ? 'to-yellow-500'
      : isL3
      ? 'to-yellow-500'
      : isReg
      ? 'to-amber-600'
      : isOb
      ? 'to-amber-600'
      : isPlatinum
      ? 'to-slate-400'
      : isGold
      ? 'to-yellow-600'
      : isSilver
      ? 'to-slate-500'
      : isBronze
      ? 'to-amber-900'
      : 'to-emerald-600';

    const shadowColor = isBl
      ? 'rgba(234,179,8,0.7)'
      : isB2
      ? 'rgba(203,213,225,0.7)'
      : isL3
      ? 'rgba(52,211,153,0.7)'
      : isReg
      ? 'rgba(244,63,94,0.7)'
      : isOb
      ? 'rgba(245,158,11,0.7)'
      : isPlatinum
      ? 'rgba(255,255,255,0.6)'
      : isGold
      ? 'rgba(250,204,21,0.5)'
      : isSilver
      ? 'rgba(148,163,184,0.5)'
      : isBronze
      ? 'rgba(217,119,6,0.6)'
      : 'rgba(16,185,129,0.5)';

    const iconStr = isReg || isOb
      ? 'fa-shield-halved'
      : isL3
      ? 'fa-award'
      : isPlatinum || isGold || isSilver || isLeagueChampion || type === 'trophy'
      ? 'fa-trophy'
      : type === 'promotion'
      ? 'fa-arrow-trend-up'
      : 'fa-arrow-up';

    const cleanMessage = (message || '')
      .replace(/\s*\(\+[^)]*(prize money|prämie|bonus)[^)]*\)/gi, '')
      .trim();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1, ease: "linear" }}
        className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-[70] p-2.5 sm:p-4 backdrop-blur-xl overflow-y-auto overscroll-contain"
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md mx-auto my-auto max-h-[92vh] sm:max-h-[88vh] min-h-0 flex flex-col rounded-[28px] bg-gradient-to-b from-[#181613] via-[#0f0e11] to-[#0a0a0c] border border-amber-500/35 shadow-[0_0_60px_-10px_rgba(245,158,11,0.3),0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden shrink-0"
        >
          {/* Subtle Golden Ambient Halo at the top */}
          <div
            className={`absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-44 bg-gradient-to-b ${gradFrom} ${gradTo} rounded-full blur-[64px] opacity-25 pointer-events-none`}
          ></div>

          {/* Top Edge Hairline Highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />

          <div className="relative p-5 sm:p-7 text-center flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar z-10 flex flex-col items-center">
            {/* Trophy Showcase */}
            <div className="relative mb-3 flex justify-center items-center">
              {isLeagueChampion || isGold || isPlatinum || type === 'trophy' ? (
                <div className="relative flex items-center justify-center py-1">
                  <PrestigeTrophy
                    type={isLeagueChampion ? 'title' : type}
                    size={140}
                    className="drop-shadow-[0_12px_28px_rgba(250,204,21,0.4)]"
                  />
                </div>
              ) : (
                <div
                  className={`relative w-24 h-20 bg-gradient-to-b ${gradFrom} ${gradTo} rounded-2xl flex items-center justify-center border border-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.5)]`}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt="Trophy"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-contain drop-shadow-lg"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-icon')) {
                          const icon = document.createElement('i');
                          icon.className = `fas ${iconStr} text-4xl text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] fallback-icon`;
                          parent.appendChild(icon);
                        }
                      }}
                    />
                  ) : (
                    <i
                      className={`fas ${iconStr} text-4xl text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]`}
                    ></i>
                  )}
                </div>
              )}
            </div>

            {/* Unboxed Clean Eyebrow Header */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-amber-400/90 mb-1.5">
              <i className={`fas ${isBronze ? 'fa-shield-halved' : 'fa-crown'} text-[10px] text-amber-400`}></i>
              <span>
                {isBl
                  ? t('National Champions', 'Nationaler Meister')
                  : isB2 || isL3 || isReg || isOb
                  ? t('Division Champions', 'Staffelsieger')
                  : isBronze
                  ? t('Cup Winners', 'Pokalsieger')
                  : type === 'promotion'
                  ? t('Promotion Achieved', 'Aufstieg perfekt')
                  : t('Championship Triumph', 'Meister-Triumph')}
              </span>
            </div>

            {/* Main Championship Title */}
            <h2 className="text-2xl sm:text-[26px] font-black tracking-tight leading-tight uppercase bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)] mb-2.5">
              {title}
            </h2>

            {/* Clean, Non-Redundant Description */}
            <p className="text-[13px] sm:text-[14px] text-zinc-300 leading-relaxed font-normal mb-4 px-1 max-w-sm">
              {cleanMessage.split('\n').map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  {idx < cleanMessage.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>

            {/* Sleek Prize Money Card */}
            {(() => {
              const prizeMoneyVal = prizeMoney !== undefined ? prizeMoney : 0;
              if (prizeMoneyVal < 1) return null;

              return (
                <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-950/40 via-emerald-950/20 to-[#0c1410] border border-emerald-500/35 p-3.5 mb-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.4)]">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400/90 flex items-center justify-center gap-1.5 mb-0.5">
                    <i className="fas fa-coins text-amber-400 text-xs"></i>
                    <span>{t('Prize Money Awarded to Treasury', 'Preisgeld-Gutschrift auf Konto')}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight drop-shadow-[0_0_18px_rgba(52,211,153,0.35)]">
                    +{formatMoney(prizeMoneyVal)}
                  </div>
                </div>
              );
            })()}

            {/* Benefits & Honors Section */}
            {(type === 'promotion' || isLeagueChampion) && (
              <div className="w-full rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 mb-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400/95 flex items-center gap-1.5 pb-2 mb-2.5 border-b border-white/[0.08]">
                  <i className={`fas ${isBl ? 'fa-crown text-amber-400 text-xs' : 'fa-angles-up text-emerald-400 text-xs'}`}></i>
                  <span>
                    {isBl
                      ? t('Championship Honors & Perks', 'Meisterschafts-Vorteile')
                      : t('Division Benefits Unlocked!', 'Vorteile der neuen Liga!')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-300 font-medium bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                    <i className="fas fa-coins text-amber-400 text-xs"></i>
                    <span>{t('Cash Windfall', 'Prämie & Bonus')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-300 font-medium bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                    <i className={`fas ${isBl ? 'fa-trophy text-amber-400' : 'fa-tv text-cyan-400'} text-xs`}></i>
                    <span>{isBl ? t('Continental Berth', 'Europapokal') : t('Higher TV Money', 'Höhere TV-Gelder')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300 font-medium bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                    <i className="fas fa-handshake text-purple-400 text-xs"></i>
                    <span>{t('Top Sponsors', 'Bessere Sponsoren')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-300 font-medium bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                    <i className="fas fa-users text-amber-400 text-xs"></i>
                    <span>{t('Bigger Crowds', 'Mehr Zuschauer')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              aria-label="Close modal"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:via-yellow-200 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base py-3.5 rounded-xl transition duration-150 active:scale-[0.98] cursor-pointer shadow-[0_6px_22px_-4px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.6)] border border-amber-300/40"
            >
              {t('Continue to Season Summary', 'Weiter zur Saisonbilanz')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Standard modal
  let icon = 'fa-circle-info text-system-blue';
  let iconBg = 'bg-blue-500/10';

  if (type === 'success') {
    icon = 'fa-circle-check text-system-green';
    iconBg = 'bg-green-500/10';
  } else if (type === 'warning' || type === 'error') {
    icon = 'fa-triangle-exclamation text-system-red';
    iconBg = 'bg-red-500/10';
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: "linear" }} className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center p-2.5 sm:p-4 z-[70] backdrop-blur-md overflow-y-auto overscroll-contain">
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }} className="bg-[#1c1c1e] w-full sm:max-w-sm rounded-[24px] p-5 sm:p-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] border border-white/10 text-center pointer-events-auto relative my-auto shrink-0 max-h-[92vh] sm:max-h-[88vh] min-h-0 flex flex-col overflow-y-auto overscroll-contain">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden"></div>
        <div className={`w-16 h-16 mx-auto ${iconBg} rounded-full flex items-center justify-center mb-5`}>
          <i className={`fas ${icon} text-3xl`}></i>
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight mb-4">
          {typeof title === 'object' ? getLoc(lang, title as any) : String(title || '')}
        </h3>
        <div className="text-[14px] text-[#98989d] mb-8 font-medium w-full leading-relaxed">
          {String(typeof message === 'object' ? getLoc(lang, message as any) : (message || '')).split('\n').map((line, idx, arr) => (
            <React.Fragment key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <button aria-label="Close modal"
          onClick={onClose}
          className="w-full bg-[#2c2c2e] hover:bg-system-blue text-white font-semibold text-base py-3.5 rounded-2xl transition active:scale-95 border border-white/5 hover:border-system-blue cursor-pointer"
        >
          {t('Continue', 'Weiter')}
        </button>
      </motion.div>
    </motion.div>
  );
});
