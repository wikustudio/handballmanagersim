import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Club, GameState, Language } from '../types';
import { ClubLogo } from './ClubLogo';
import { getLeagueInfo, getOvrColor, formatMoney, getStartingBudget, formatNum } from '../data/gameConstants';
import { t as tr } from '../data/translations';
import { parseAndNormalizeModBudget } from '../engine/moddingEngine';

interface JobMarketModalProps {
  isOpen?: boolean;
  onClose: () => void;
  state: GameState;
  clubsDb: Club[];
  lang: Language;
  onAcceptOffer: (club: Club) => void;
  generateOffers: (state: GameState, currentClubsDb: Club[], count: number) => Club[];
  isModActive?: boolean;
}

export const JobMarketModal: React.FC<JobMarketModalProps> = ({
  isOpen = true,
  onClose,
  state,
  clubsDb,
  lang,
  onAcceptOffer,
  generateOffers,
  isModActive,
}) => {
  const [offers, setOffers] = useState<Club[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'domestic' | 'international' | 'fallen'>('all');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // 3 Domestic + 2 Intl (including Fallen Giant Restoration opportunities) = 5
      const generated = generateOffers(state, clubsDb, 5);
      setOffers(generated);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, state, clubsDb, generateOffers]);

  if (!isOpen) return null;
  const t = (en: string, de?: string, es?: string) => tr(lang, en, de, es);

  const userCountry = state.club.country || 'GER';
  const domesticOffers = offers.filter((c) => (c.country || 'GER') === userCountry);
  const intlOffers = offers.filter((c) => (c.country || 'GER') !== userCountry);
  const fallenOffers = offers.filter((c) => Boolean(c.isInsolventGiant));

  const displayedOffers = 
    selectedRegion === 'domestic'
      ? domesticOffers
      : selectedRegion === 'international'
      ? intlOffers
      : selectedRegion === 'fallen'
      ? fallenOffers
      : offers;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-2xl flex flex-col items-center justify-center p-2.5 sm:p-5 z-50 cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.98, opacity: 0 }} 
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/90 text-white w-full max-w-4xl rounded-[28px] sm:rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-white/[0.08] backdrop-blur-3xl relative cursor-default max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto flex flex-col overflow-hidden text-left shrink-0"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-sky-400 text-base shadow-inner shrink-0">
              <i className="fa-solid fa-briefcase"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5">
                {t('Career Inquiries · Headhunter Desk', 'Karriere-Anfragen · Headhunter-Desk')}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                {t('Director Job Market', 'Sportdirektor Arbeitsmarkt')}
              </h2>
            </div>
          </div>

          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/[0.08] shrink-0"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Progressive Disclosure Filter Bar */}
        <div className="px-5 sm:px-6 pt-4 pb-2.5 shrink-0 border-b border-white/[0.04] flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('all');
                scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                selectedRegion === 'all'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <span>{t('All Opportunities', 'Alle Angebote')}</span>
              <span className="text-[10px] tabular-nums font-medium opacity-70">({offers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('domestic');
                scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                selectedRegion === 'domestic'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <i className="fa-solid fa-house-chimney text-[10px]"></i>
              <span>{t('Domestic', 'Inland')}</span>
              <span className="text-[10px] tabular-nums font-medium opacity-70">({domesticOffers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('international');
                scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                selectedRegion === 'international'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <i className="fa-solid fa-globe text-[10px]"></i>
              <span>{t('Continental', 'International')}</span>
              <span className="text-[10px] tabular-nums font-medium opacity-70">({intlOffers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('fallen');
                scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                selectedRegion === 'fallen'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'
              }`}
            >
              <i className="fa-solid fa-fire-flame-curved text-[10px] text-amber-400"></i>
              <span>{t('Fallen Giants', 'Gefallene Giganten')}</span>
              <span className="text-[10px] tabular-nums font-medium opacity-70">({fallenOffers.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-400 font-normal hidden sm:block">
            {t('Director Rep:', 'Direktor-Ansehen:')} <span className="font-bold text-sky-300 tabular-nums">{state.reputation || 50}</span>
          </div>
        </div>

        {/* Content Body */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 custom-scrollbar relative z-10">
          {displayedOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedOffers.map((club) => {
                const isDomestic = (club.country || 'GER') === userCountry;
                return (
                  <OfferCard 
                    key={club.id} 
                    club={club} 
                    lang={lang} 
                    isDomestic={isDomestic}
                    onAccept={() => onAcceptOffer(club)} 
                    t={t} 
                    isModActive={isModActive} 
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-3">
                <i className="fa-solid fa-folder-open text-xl"></i>
              </div>
              <div className="text-white font-bold text-sm mb-1">
                {t('No Inquiries in this Category', 'Keine Anfragen in dieser Kategorie')}
              </div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {t('Switch filters to view other club opportunities or continue with your current mandate.', 'Wähle einen anderen Filter oder führe deine aktuelle Amtszeit fort.')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            <span className="text-amber-400/90 font-medium">
              <i className="fa-solid fa-triangle-exclamation mr-1.5 text-[10px]"></i>
              {t(
                'Accepting a proposal immediately terminates your current club contract.',
                'Die Annahme eines Angebots beendet deine aktuelle Amtszeit sofort.'
              )}
            </span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs transition border border-white/[0.08] cursor-pointer"
          >
            {t('Decline & Stay', 'Ablehnen & Verbleiben')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface OfferCardProps {
  club: Club;
  lang: Language;
  isDomestic: boolean;
  onAccept: () => void;
  t: (en: string, de?: string, es?: string) => string;
  isModActive?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({ club, lang, isDomestic, onAccept, t, isModActive }) => {
  const league = getLeagueInfo(club.tier, club.country || 'GER');
  const startingBudget = club.offerBudget != null
    ? parseAndNormalizeModBudget(club.offerBudget, club.tier, club.country || 'GER')
    : club.currentBudget != null
    ? parseAndNormalizeModBudget(club.currentBudget, club.tier, club.country || 'GER')
    : getStartingBudget(club.tier, club.country || 'GER');

  return (
    <div className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-sky-400/30 rounded-2xl sm:rounded-3xl p-5 transition-all duration-200 flex flex-col justify-between shadow-sm relative group">
      <div>
        {/* Header row with club logo & metadata */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center p-2 shrink-0 shadow-sm">
            <ClubLogo 
              name={club.name} 
              id={club.id} 
              color={club.color} 
              logo={club.logo} 
              fallbackLogo={club.fallbackLogo} 
              isModActive={isModActive} 
              className="w-full h-full object-contain drop-shadow" 
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider mb-0.5">
              <span className="shrink-0">{isDomestic ? t('Domestic', 'Inland') : t('International', 'Ausland')}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-sky-400/90 break-words">{league?.name}</span>
              {club.isInsolventGiant && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[9px] font-bold tracking-wider inline-flex items-center gap-1">
                  <i className="fa-solid fa-fire-flame-curved text-[9px] text-amber-400"></i>
                  <span>{t('Fallen Giant · Recovery Mandate', 'Gefallener Gigant · Sanierungsmandat')}</span>
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white break-words tracking-tight group-hover:text-sky-300 transition-colors">
              {club.name}
            </h3>
          </div>
        </div>

        {/* Narrative / Context if present */}
        {club.narrative && (
          <div className={`mb-3.5 text-xs text-zinc-200 italic leading-relaxed p-3 rounded-xl border-l-2 ${
            club.isInsolventGiant
              ? 'bg-amber-500/[0.06] border-amber-400/70 text-amber-100/90'
              : 'bg-white/[0.02] border-sky-400/50 text-zinc-300'
          }`}>
            "{club.narrative}"
          </div>
        )}

        {/* Bento stats row */}
        <div className="grid grid-cols-2 gap-2.5 my-2">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider">
              {t('Squad OVR', 'Kader-Stärke')}
            </div>
            <div className={`text-base font-bold tabular-nums mt-0.5 ${getOvrColor(club.baseOvr)}`}>
              {club.baseOvr} <span className="text-[10px] text-zinc-500 font-normal">OVR</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="text-[9px] uppercase font-semibold text-zinc-400 tracking-wider">
              {t('Transfer Budget', 'Transferbudget')}
            </div>
            <div className={`text-base font-bold tabular-nums mt-0.5 ${startingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatMoney(startingBudget)}
            </div>
          </div>
        </div>

        {club.stadium && (
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between px-1">
            <span>{t('Venue Capacity:', 'Stadionkapazität:')}</span>
            <span className="font-semibold text-white tabular-nums">{formatNum(club.stadium)} seats</span>
          </div>
        )}
      </div>

      {/* Contract Action Button */}
      <div className="mt-4 pt-3 border-t border-white/[0.05]">
        <button
          onClick={onAccept}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white shadow-sm"
        >
          <i className="fa-solid fa-file-signature text-xs"></i>
          <span>{t('Sign Management Contract', 'Vertrag unterschreiben')}</span>
        </button>
      </div>
    </div>
  );
};
