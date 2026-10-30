import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Club, Coach, Language, BoardVision } from '../types';
import { ClubLogo } from './ClubLogo';
import { formatMoney, getLeagueInfo, getClubHistoricContext, TACTICS } from '../data/gameConstants';
import { generateBoardVision } from '../engine/boardVisionEngine';
import { t as tr } from '../data/translations';

interface ClubIntroModalProps {
  club: Club;
  coach?: Coach;
  targetPos: number;
  budget: number;
  rivalName?: string;
  boardVision?: BoardVision;
  lang?: Language;
  isModActive?: boolean;
  onConfirm: () => void;
}

export const ClubIntroModal: React.FC<ClubIntroModalProps> = ({
  club,
  coach,
  targetPos,
  budget,
  rivalName,
  boardVision: boardVisionProp,
  lang = 'en' as Language,
  isModActive: isModActiveProp,
  onConfirm,
}) => {
  const isDe = lang === 'de';
  const t = (en: string, de?: string) => tr((lang || 'en') as Language, en, de);

  const country = club.country || 'GER';
  const leagueInfo = getLeagueInfo(club.tier, country);
  const isModActive = isModActiveProp !== undefined 
    ? isModActiveProp 
    : (typeof window !== 'undefined' && localStorage.getItem('fms_real_mod_active') === 'true');
    
  let narrative = isModActive ? (club.historicContext || club.narrative || getClubHistoricContext(club.name, club.tier, isDe, country)) : undefined;
  if (narrative && !isDe) {
    const hasGermanWords = /\b(ziel|ziele|zielen|saison|vorstand|traditionsverein|bundesligist|zweitligist|drittligist|rekordmeister|fuehrend|oberhaus)\b/i.test(narrative);
    if (hasGermanWords) {
      narrative = getClubHistoricContext(club.name, club.tier, false, country);
    }
  }

  // Resolve Board Vision for the appointed club
  const boardVision: BoardVision = useMemo(() => {
    if (boardVisionProp) return boardVisionProp;
    return generateBoardVision(club, 2026);
  }, [boardVisionProp, club]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-5 bg-black/80 backdrop-blur-2xl text-left overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-[#12141c]/95 rounded-[28px] sm:rounded-[32px] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-3xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 relative text-white"
      >
        {/* Ambient Sky & Club Accent Glows */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        {club.color && (
          <div 
            className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: club.color }}
          />
        )}

        {/* Refined Header Banner */}
        <div className="p-4 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-3.5 sm:gap-4 shrink-0 relative z-10">
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 shadow-inner p-2">
            <ClubLogo
              name={club.name}
              color={club.color}
              logo={club.logo}
              fallbackLogo={club.fallbackLogo}
              isModActive={isModActive}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow"
              fallbackClassName="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 bg-sky-500/15 px-2.5 py-0.5 rounded-lg border border-sky-400/25">
                {t('New Appointment', 'Neue Ernennung')}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                {leagueInfo.name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white break-words tracking-tight leading-tight">
              {club.name}
            </h2>
            <div className="text-xs text-zinc-400 font-medium mt-0.5 flex items-center gap-1.5">
              <i className="fa-solid fa-briefcase text-[11px] text-sky-400"></i>
              <span>{t('Appointed Sporting Director', 'Als Sportdirektor ernannt')}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 custom-scrollbar relative z-10">
          
          {/* Welcome to the Boardroom · Chairman Directive */}
          <div className="bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-indigo-500/15 border border-sky-400/30 rounded-2xl p-4 sm:p-5 backdrop-blur-md relative overflow-hidden shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-sky-400/20 border border-sky-400/30 flex items-center justify-center text-sky-300 text-xs shrink-0">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                {t('Welcome to the Boardroom · Club Chairman', 'Willkommen im Vorstandszimmer · Vereinspräsident')}
              </span>
            </div>
            <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
              "{t(
                `Welcome to the club. Here is your ${boardVision.durationYears || 3}-year mandate. We expect a Top ${targetPos} finish, and we've given you ${formatMoney(budget)}. Do not fail us.`,
                `Willkommen im Verein. Hier ist dein ${boardVision.durationYears || 3}-Jahres-Mandat. Wir erwarten eine Platzierung unter den Top ${targetPos}, und wir haben dir ein Budget von ${formatMoney(budget)} bereitgestellt. Enttäusche uns nicht.`
              )}"
            </p>
          </div>

          {/* Club Background & Lore */}
          {narrative && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-md">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400/90 mb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-bookmark text-[10px]"></i>
                <span>{t('Club Background & Context', 'Vereinshintergrund & Historie')}</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal italic">
                "{narrative}"
              </p>
            </div>
          )}

          {/* BOARD STRATEGIC ROADMAP CARD */}
          <div className="bg-white/[0.03] border border-amber-400/25 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden backdrop-blur-md">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-2 mb-2 relative z-10 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center justify-center text-xs shadow-inner">
                  <i className="fa-solid fa-compass"></i>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                    {t('Board Strategic Roadmap', 'Strategische Vorstandsvision')}
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {boardVision.title}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25 tabular-nums shrink-0">
                {boardVision.durationYears || 3} {t('Yr Vision', 'Jahre Vision')}
              </span>
            </div>

            {/* Strategic Milestones List */}
            <div className="space-y-2 mb-3 relative z-10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <i className="fa-solid fa-list-check text-amber-400 text-xs"></i>
                <span>{t('Required Milestones', 'Erforderliche Meilensteine')}</span>
              </div>
              <div className="flex flex-col gap-2">
                {boardVision.objectives.map((obj) => (
                  <div
                    key={obj.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5"></span>
                      <span className="text-xs font-medium text-zinc-100 leading-snug">
                        {obj.desc}
                      </span>
                    </div>
                    <span className="text-[10px] tabular-nums font-semibold text-amber-300 shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 whitespace-nowrap self-start sm:self-auto">
                      {t('Target:', 'Ziel:')} {obj.targetValue} {obj.unit || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Rewards & Risk Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] relative z-10">
              <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-emerald-200">
                <i className="fa-solid fa-gift text-emerald-400 text-xs shrink-0 mt-0.5"></i>
                <div className="leading-snug">
                  <strong className="text-white font-semibold">{t('Reward:', 'Belohnung:')} </strong>
                  <span>{boardVision.reward.desc}</span>
                </div>
              </div>
              <div className="bg-rose-500/[0.06] border border-rose-500/20 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-rose-200">
                <i className="fa-solid fa-triangle-exclamation text-rose-400 text-xs shrink-0 mt-0.5"></i>
                <div className="leading-snug">
                  <strong className="text-white font-semibold">{t('Risk:', 'Risiko:')} </strong>
                  <span>{boardVision.penalty.desc}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Incumbent Head Coach */}
          {coach && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-md">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-clipboard-user text-sky-400"></i>
                  <span>{t('Incumbent Head Coach', 'Aktueller Cheftrainer')}</span>
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 tabular-nums">
                  {coach.contractYearsLeft} {t('Yr Contract', 'J. Vertrag')}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
                <div>
                  <div className="text-sm font-bold text-white">{coach.name}</div>
                  <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className={`${TACTICS[coach.style]?.color || 'text-white'} font-medium`}>
                      <i className={`fas ${TACTICS[coach.style]?.icon || 'fa-chess-board'} mr-1 text-sky-400`}></i>
                      {coach.style}
                    </span>
                    {coach.strength && (
                      <span className="text-emerald-300 text-[11px] font-medium">
                        · {coach.strength}
                      </span>
                    )}
                    {coach.weakness && (
                      <span className="text-rose-400 text-[11px] flex items-center gap-0.5 font-medium">
                        · <i className="fa-solid fa-triangle-exclamation text-[9px]"></i> {coach.weakness}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-lg font-bold tabular-nums ${coach.ovrBoost >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {coach.ovrBoost >= 0 ? `+${coach.ovrBoost}` : coach.ovrBoost}
                  </div>
                  <div className="text-[9px] uppercase font-semibold text-zinc-500">OVR Boost</div>
                </div>
              </div>
            </div>
          )}

          {/* Club Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider mb-0.5">
                {t('Budget', 'Budget')}
              </div>
              <div className="text-xs sm:text-sm font-bold text-emerald-400 truncate tabular-nums">
                {formatMoney(budget)}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider mb-0.5">
                {t('Squad OVR', 'Kader GES')}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white tabular-nums">
                {club.baseOvr}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider mb-0.5">
                {t('Stadium', 'Stadion')}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white truncate tabular-nums">
                {club.stadium.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider mb-0.5">
                {t('Season Target', 'Saisonziel')}
              </div>
              <div className="text-xs sm:text-sm font-bold text-sky-400 truncate tabular-nums">
                Top {targetPos} · <span className="text-emerald-400 font-semibold">{t('1 Yr Immunity', '1 J. Schutz')}</span>
              </div>
            </div>
          </div>

          {/* Arch Rival Notice if any */}
          {rivalName && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-rose-500/[0.06] border border-rose-500/20 rounded-xl text-xs text-rose-300 font-medium">
              <i className="fa-solid fa-fire text-rose-400 text-sm shrink-0"></i>
              <span>
                {t('Arch Rival:', 'Erzrivale:')} <strong className="text-white font-semibold">{rivalName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Action Footer with Apple-Style Primary Button */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] shrink-0 relative z-10">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 sm:py-4 px-6 rounded-2xl font-bold text-sm text-white bg-sky-500 hover:bg-sky-400 active:scale-[0.99] transition-all shadow-[0_4px_24px_rgba(56,189,248,0.25)] hover:shadow-[0_6px_32px_rgba(56,189,248,0.35)] cursor-pointer border border-sky-400/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-xs">
                <i className="fa-solid fa-file-signature"></i>
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[10px] font-semibold text-sky-100 uppercase tracking-wider">
                  {t('Sign Official Contract', 'Offiziellen Vertrag unterzeichnen')}
                </span>
                <span className="text-sm sm:text-base font-bold text-white">
                  {t('Take Charge & Begin', 'Vereinsführung übernehmen')}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </div>
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};
