import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Club, Language } from '../types';
import { ClubLogo } from './ClubLogo';
import { formatMoney, formatNum, getCountryFlag } from '../data/gameConstants';
import { triggerRealisticConfetti } from '../utils/confettiHelper';
import { t as tr } from '../data/translations';
import { useModalDismiss } from '../utils/modalUtils';

interface ArenaInaugurationData {
  previousCapacity: number;
  newCapacity: number;
  cost: number;
  label: string;
  tag: string;
  desc: string;
  icon?: string;
}

interface ArenaInaugurationModalProps {
  data: ArenaInaugurationData;
  club: Club;
  lang?: Language;
  onClose: () => void;
}

export const ArenaInaugurationModal: React.FC<ArenaInaugurationModalProps> = ({
  data,
  club,
  lang = 'en',
  onClose,
}) => {
  const t = (en: string, de?: string) => tr(lang, en, de);

  useModalDismiss(onClose);

  useEffect(() => {
    // Fire celebratory confetti for the historic milestone
    triggerRealisticConfetti();
    const timer = setTimeout(() => {
      triggerRealisticConfetti();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const netSeats = Math.max(0, data.newCapacity - data.previousCapacity);
  const arenaName = club.customArenaName || `${club.name} Arena`;
  const flag = getCountryFlag(club.country || 'GER');

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl cursor-pointer"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#14151e] rounded-[28px] border border-amber-500/25 w-full max-w-lg relative overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col cursor-default pointer-events-auto max-h-[min(92dvh,92vh)] overflow-y-auto custom-scrollbar"
        >
          {/* Top Golden Light Rays / Architectural Spotlight */}
          <div className="absolute top-0 inset-x-0 h-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-amber-500/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none" />

          {/* Modal Content */}
          <div className="p-4 sm:p-7 relative z-10 flex flex-col items-center text-center">
            
            {/* Top Inauguration Ribbon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/[0.08] border border-amber-500/25 text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-4 shadow-sm">
              <i className="fas fa-ribbon text-amber-400" />
              <span>{t('Grand Arena Inauguration', 'Feierliche Arena-Einweihung')}</span>
            </div>

            {/* Stadium Architectural Icon & Club Crest Duo */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500/[0.08] border border-amber-400/25 flex items-center justify-center text-3xl sm:text-4xl text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.15)]">
                <i className={`fas ${data.icon || 'fa-building-columns'}`} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#10121a] border border-white/[0.08] p-1.5 shadow-lg flex items-center justify-center">
                <ClubLogo club={club} size="sm" />
              </div>
            </div>

            {/* Title & Historic Arena Name */}
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
              {arenaName}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1 text-xs text-zinc-400">
              <span className="text-base">{flag}</span>
              <span className="font-medium text-zinc-200">{club.name}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-amber-400 font-semibold">{data.tag}</span>
            </div>

            <p className="text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed mt-3 max-w-md px-1">
              {t(
                `A historic milestone! The new ${formatNum(data.newCapacity)}-seat arena has officially been inaugurated and approved for top-tier handball competition.`,
                `Ein historischer Meilenstein! Die neue Arena mit ${formatNum(data.newCapacity)} Plätzen wurde feierlich eingeweiht und für den Spitzenhandball freigegeben.`
              )}
            </p>

            {/* Key Architectural & Financial Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-5">
              {/* Capacity Card */}
              <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  {t('Total Capacity', 'Gesamtkapazität')}
                </span>
                <span className="text-xl sm:text-2xl font-semibold text-white tabular-nums tracking-tight mt-0.5">
                  {formatNum(data.newCapacity)}
                </span>
                {netSeats > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 px-2 py-0.5 rounded-full mt-1.5 tabular-nums">
                    +{formatNum(netSeats)} {t('New Seats', 'Neue Plätze')}
                  </span>
                )}
              </div>

              {/* Status / Standard Card */}
              <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  {t('Arena Standard', 'Arena-Standard')}
                </span>
                <span className="text-base sm:text-lg font-semibold text-amber-300 tracking-tight mt-0.5 line-clamp-1">
                  {data.label}
                </span>
                <span className="text-[10px] font-semibold text-amber-300/90 bg-amber-500/[0.08] border border-amber-500/20 px-2 py-0.5 rounded-full mt-1.5">
                  {t('Fully Certified', 'Lizenz erteilt')}
                </span>
              </div>
            </div>

            {/* Prestige & Board Impact Strip */}
            <div className="w-full mt-3 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <i className="fas fa-shield-heart text-emerald-400 text-sm" />
                <span>{t('Board & Fanbase Acclaim', 'Zufriedenheit bei Vorstand & Fans')}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400 font-mono text-[11px] tabular-nums">
                <span>+10 Impact</span>
                <span className="text-zinc-500">·</span>
                <span>+1 Shield</span>
              </div>
            </div>

            {/* Ceremonial Action Button */}
            <button
              onClick={onClose}
              className="w-full mt-5 py-4 px-6 rounded-2xl font-semibold text-sm sm:text-base tracking-wide transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-[0_4px_20px_rgba(245,158,11,0.3)] border border-amber-300/40"
            >
              <i className="fas fa-scissors text-xs rotate-[-45deg]" />
              <span>{t('Cut Ceremonial Ribbon & Open Arena', 'Band durchschneiden & Arena eröffnen')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
