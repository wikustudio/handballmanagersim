import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Club, GameState, Language } from '../types';
import { ClubLogo } from './ClubLogo';
import { getLeagueInfo, getOvrColor, formatMoney, getStartingBudget, getCountryFlag, normalizeCountry } from '../data/gameConstants';
import { t as tr } from '../data/translations';
import { mergeClubWithWorldState } from '../utils/modManager';
import { useModalDismiss } from '../utils/modalUtils';

interface JobMarketModalProps {
  isOpen?: boolean;
  onClose: () => void;
  state: GameState;
  clubsDb: Club[];
  lang: Language;
  onAcceptOffer: (club: Club) => void;
  generateOffers: (state: GameState, currentClubsDb: Club[], count: number) => Club[];
  onOpenTransfers?: () => void;
}

export const JobMarketModal: React.FC<JobMarketModalProps> = ({
  isOpen = true,
  onClose,
  state,
  clubsDb,
  lang,
  onAcceptOffer,
  generateOffers,
  onOpenTransfers,
}) => {
  useModalDismiss(!state.isSacked ? onClose : undefined, isOpen);
  const [offers, setOffers] = useState<Club[]>([]);
  const [filter, setFilter] = useState<'all' | 'tier1' | 'lower'>('all');
  const generateOffersRef = useRef(generateOffers);
  generateOffersRef.current = generateOffers;

  useEffect(() => {
    if (isOpen) {
      // Up to 8 curated proposals across domestic, international, top flight, and fallen giants
      const generated = generateOffersRef.current(state, clubsDb, 8);
      setOffers(generated);
    }
  }, [isOpen, state.year, state.club?.id, state.isSacked]);

  useEffect(() => {
    if (!clubsDb || clubsDb.length === 0) return;
    setOffers((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((offer) => {
        const match = clubsDb.find(
          (c) => String(c.id) === String(offer.id) || (c.name && offer.name && c.name.toLowerCase() === offer.name.toLowerCase())
        );
        return match ? mergeClubWithWorldState(match, offer) : offer;
      });
    });
  }, [clubsDb]);

  if (!isOpen) return null;

  const t = (en: string, _de?: string, _es?: string) => en;
  const userCountry = normalizeCountry(state.club.country || 'GER');

  const displayedOffers = offers.filter((c) => {
    if (filter === 'tier1') return c.tier === 1;
    if (filter === 'lower') return c.tier >= 2;
    return true;
  });

  const domesticOffers = displayedOffers.filter((c) => normalizeCountry(c.country || 'GER') === userCountry);
  const intlOffers = displayedOffers.filter((c) => normalizeCountry(c.country || 'GER') !== userCountry);

  const tier1Count = offers.filter(c => c.tier === 1).length;
  const lowerCount = offers.filter(c => c.tier >= 2).length;

  return (
    <div 
      onClick={!state.isSacked ? onClose : undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-2xl cursor-pointer overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15, opacity: 0 }} 
        animate={{ scale: 1, y: 0, opacity: 1 }} 
        exit={{ scale: 0.95, y: 10, opacity: 0 }} 
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] border border-white/[0.04] rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative my-auto max-h-[92vh] flex flex-col overflow-hidden cursor-default pointer-events-auto"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/25 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.04] bg-[#14151e] shrink-0 gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-lg shadow-sm shrink-0">
              <i className="fas fa-envelope-open-text" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight flex items-center gap-2">
                <span>{state.isSacked ? t('You Were Fired!', 'Sie wurden entlassen!', '¡Fuiste despedido!') : t('Manager Job Market', 'Trainer-Arbeitsmarkt', 'Mercado de Entrenadores')}</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                {state.isSacked 
                  ? t('Your tenure at the club has ended. Review official offers from interested clubs to resume your career.', 'Ihre Amtszeit ist beendet. Prüfen Sie Angebote anderer Vereine, um Ihre Karriere fortzusetzen.') 
                  : t('Club executives and headhunters have presented proposals. Elite clubs and lower-tier Fallen Giants seek your leadership.', 'Funktionäre haben Ihnen Angebote unterbreitet. Elite-Klubs und schlafende Riesen hoffen auf Ihre Führung.')}
              </p>
            </div>
          </div>
          {!state.isSacked && (
            <button 
              aria-label="Close modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.04] flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer active:scale-95 shrink-0"
            >
              <i className="fas fa-xmark text-sm" />
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="pt-3 pb-2 shrink-0 flex items-center justify-between flex-wrap gap-2 border-b border-white/[0.04]">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm'
                  : 'bg-white/[0.02] text-zinc-400 hover:text-zinc-200 border border-white/[0.04]'
              }`}
            >
              <span>{t('All Proposals', 'Alle Angebote')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 tabular-nums">{offers.length}</span>
            </button>

            <button
              onClick={() => setFilter('tier1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                filter === 'tier1'
                  ? 'bg-sky-500/[0.05] text-sky-300 border border-sky-500/20 shadow-sm'
                  : 'bg-white/[0.02] text-zinc-400 hover:text-zinc-200 border border-white/[0.04]'
              }`}
            >
              <i className="fas fa-trophy text-[10px] text-sky-400" />
              <span>{t('Top-Flight (Tier 1)', 'Erstliga-Elite')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 tabular-nums">{tier1Count}</span>
            </button>

            <button
              onClick={() => setFilter('lower')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                filter === 'lower'
                  ? 'bg-amber-500/[0.05] text-amber-300 border border-amber-500/20 shadow-sm'
                  : 'bg-white/[0.02] text-zinc-400 hover:text-zinc-200 border border-white/[0.04]'
              }`}
            >
              <i className="fas fa-crown text-[10px] text-amber-400" />
              <span>{t('Fallen Giants & Rebuilds (Tier 2-4)', 'Gefallene Riesen & Rebuilds')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 tabular-nums">{lowerCount}</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-400 font-normal">
            Reputation: <strong className="text-white font-semibold tabular-nums">{Math.round(state.reputation || 50)}/100</strong>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pt-3 flex flex-col gap-5">
          
          {/* Veteran Ringer Promotion Gamble Lifeline (Tiers 3-6) */}
          {!state.isSacked && (state.club.tier || 1) >= 3 && onOpenTransfers && (
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm shrink-0">
                  <i className="fas fa-medal" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-amber-200">
                      {lang === 'de' ? 'Alternative: Altstar verpflichten (All-In Aufstiegs-Wette)' : 'Alternative: Sign Veteran Ringer (High-Risk Promotion Gamble)'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      T{state.club.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
                    {lang === 'de'
                      ? 'Statt den Verein zu verlassen: Hole einen 38-jährigen Bundesliga-Star für sofortige +3 bis +5 GES! Aufstieg oder Schuldenkrise.'
                      : 'Rather than leaving your club, take a massive swing: +3 to +5 OVR immediate boost with 1-season retirement. Promote or face financial crisis!'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenTransfers();
                }}
                className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide shrink-0 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <i className="fas fa-arrow-right text-[10px]" />
                <span>{lang === 'de' ? 'Zum Transfermarkt' : 'Open Transfers'}</span>
              </button>
            </div>
          )}

          {domesticOffers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <i className="fas fa-house-chimney text-emerald-400 text-xs" />
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  {t('Domestic Offers', 'Inländische Angebote')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {domesticOffers.map((club, _idx) => (
                  <OfferCard key={`dom-${club.id}-${_idx}`} club={club} lang={lang} onAccept={() => onAcceptOffer(club)} t={t} />
                ))}
              </div>
            </div>
          )}

          {intlOffers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <i className="fas fa-globe-americas text-sky-400 text-xs" />
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  {t('International Offers', 'Internationale Angebote')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {intlOffers.map((club, _idx) => (
                  <OfferCard key={`intl-${club.id}-${_idx}`} club={club} lang={lang} onAccept={() => onAcceptOffer(club)} t={t} />
                ))}
              </div>
            </div>
          )}

          {displayedOffers.length === 0 && offers.length > 0 && (
            <div className="text-center p-8 bg-[#10121a] rounded-2xl border border-white/[0.04] flex flex-col items-center gap-2">
              <i className="fas fa-filter text-2xl text-zinc-600 mb-1" />
              <div className="text-white font-semibold text-sm">{t('No offers match current filter.', 'Keine Angebote für diesen Filter gefunden.')}</div>
              <button 
                onClick={() => setFilter('all')}
                className="text-xs text-sky-400 hover:text-sky-300 underline cursor-pointer mt-1"
              >
                {t('View all available proposals', 'Alle verfügbaren Angebote anzeigen')}
              </button>
            </div>
          )}

          {!state.isSacked && (
            <div className="mt-1 border-t border-white/[0.04] pt-3">
              <button
                onClick={onClose}
                className="w-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 border border-sky-500/20 p-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] group shadow-sm"
              >
                <i className="fas fa-handshake text-sky-300 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm tracking-tight">{t('Stay at Current Club', 'Beim aktuellen Verein bleiben')}</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const OfferCard: React.FC<{ club: Club; lang: Language; onAccept: () => void; t: any }> = ({ club, lang, onAccept, t }) => {
  const league = getLeagueInfo(club.tier, club.country || 'GER');
  const isFallenGiant = Boolean((club as any).isFallenGiant || (club as any).offerBadge === 'Fallen Giant Rebuild');
  const isRescueProject = Boolean((club as any).isRescueProject || (club as any).offerBadge === 'Lower-Tier Rescue');

  return (
    <button
      onClick={onAccept}
      className={`p-4 rounded-2xl border transition active:scale-[0.99] text-left flex flex-col group cursor-pointer shadow-sm relative overflow-hidden ${
        isFallenGiant
          ? 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/[0.07]'
          : isRescueProject
          ? 'bg-purple-500/[0.04] border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/[0.07]'
          : 'bg-[#14151e] border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]'
      }`}
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        {isFallenGiant ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>FALLEN GIANT REBUILD</span>
          </span>
        ) : isRescueProject ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            <span>LOWER-TIER RESCUE</span>
          </span>
        ) : club.tier === 1 ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
            <span>TOP-FLIGHT ELITE</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-white/[0.03] text-zinc-400 border border-white/[0.04]">
            Tier {club.tier} Project
          </span>
        )}

        <span className="text-[10px] font-mono font-medium text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-white/[0.04] tabular-nums">
          Tier {club.tier}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <ClubLogo name={club.name} color={club.color} logo={club.logo} fallbackLogo={club.fallbackLogo} className="w-11 h-11 rounded-2xl drop-shadow-md border border-white/[0.06] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
            <span className="truncate">{club.name}</span>
            <span className="text-xs shrink-0" title={club.country}>{getCountryFlag(club.country)}</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5 truncate mt-0.5">
            {league?.logo && (
              <img
                src={league.logo}
                alt={`${league?.name || 'League'} logo`}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                className="h-3.5 w-3.5 object-contain shrink-0 opacity-80"
              />
            )}
            <span className="truncate">{league?.name}</span>
          </div>
        </div>
      </div>
      
      {(club.historicContext || club.context || club.narrative) && (
        <div className={`text-[11px] italic leading-relaxed mb-3.5 border-l-2 pl-2 line-clamp-2 font-normal ${
          isFallenGiant 
            ? 'text-amber-200/90 border-amber-400/60' 
            : isRescueProject 
            ? 'text-purple-200/90 border-purple-400/60' 
            : 'text-zinc-400 border-sky-400/50'
        }`}>
          "{club.narrative || club.historicContext || club.context}"
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/[0.04] w-full">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">{t('Squad OVR', 'Kader GES')}</span>
          <span className={`text-xs font-semibold tabular-nums ${getOvrColor(club.baseOvr, getLeagueInfo(club.tier, club.country).avgOvr)}`}>
            {club.baseOvr} OVR
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">{t('Starting Budget', 'Startbudget')}</span>
          <span className="text-xs font-semibold text-emerald-400 tabular-nums">
            {formatMoney(getStartingBudget(club.tier, club.country || 'GER'))}
          </span>
        </div>
      </div>
    </button>
  );
};
