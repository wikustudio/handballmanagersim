import React from 'react';
import { EventOption, GameEvent, Language } from '../types';
import { COUNTRIES, getLeagueInfo, formatMoney, calculateClubReputation, getStartingBudget } from '../data/gameConstants';
import { parseAndNormalizeModBudget } from '../engine/moddingEngine';
import { ClubLogo } from './ClubLogo';
import { t as tr, getLoc } from '../data/translations';

interface EventUIProps {
  event: GameEvent;
  lang: Language;
  isModActive?: boolean;
  onResolve: (choiceIndex: number) => void;
}

export const EventUI: React.FC<EventUIProps> = ({ event, lang, isModActive, onResolve }) => {
  const [isResolving, setIsResolving] = React.useState(false);

  React.useEffect(() => {
    setIsResolving(false);
  }, [event?.id, event?.type]);

  const handleChoice = (choiceIndex: number) => {
    if (isResolving) return;
    setIsResolving(true);
    onResolve(choiceIndex);
    setTimeout(() => {
      setIsResolving(false);
    }, 320);
  };

  const t = (en: string, de?: string, _ignoredEs?: string) =>
    tr(lang, en, de);

  const isNegativeText = (txt: string): boolean => {
    const s = txt.toLowerCase();
    return (
      s.includes('-') ||
      s.includes('sperren') ||
      s.includes('close') ||
      s.includes('strafe') ||
      s.includes('penalty') ||
      s.includes('verfehlt') ||
      s.includes('verstimmt') ||
      s.includes('nervoes') ||
      s.includes('disappointed') ||
      s.includes('sacked') ||
      s.includes('loss') ||
      s.includes('verlust') ||
      s.includes('feuern')
    );
  };

  const buildOutcomeChips = (opt?: EventOption) => {
    if (!opt) return null;

    if (opt.goodPct !== undefined && (!opt.badPct || opt.badPct === 0)) {
      const txt = getLoc(lang, opt.goodTxt) || getLoc(lang, opt.tag) || '';
      const isNeg = isNegativeText(txt);

      return (
        <div
          className={`w-full mt-2.5 ${
            isNeg
              ? 'bg-rose-500/[0.08] border-rose-500/25 text-rose-200'
              : 'bg-emerald-500/[0.08] border-emerald-500/25 text-emerald-200'
          } border rounded-xl py-2 px-3 flex items-start gap-2.5 shadow-sm text-left`}
        >
          {opt.goodPct === 100 ? (
            <div className={`w-5 h-5 rounded-lg ${isNeg ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'} flex items-center justify-center shrink-0 text-[10px] mt-0.5`}>
              <i className={`fas ${isNeg ? 'fa-triangle-exclamation' : 'fa-check'}`}></i>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold shrink-0 border border-emerald-400/30 mt-0.5">
              <span>{opt.goodPct}%</span>
              <i className="fas fa-arrow-up text-[9px] text-emerald-400"></i>
            </span>
          )}
          <span className="text-[11px] font-medium leading-snug tracking-wide min-w-0 flex-1">{txt}</span>
        </div>
      );
    } else if (opt.goodPct !== undefined && opt.badPct !== undefined) {
      const goodText = getLoc(lang, opt.goodTxt);
      const badText = getLoc(lang, opt.badTxt);
      return (
        <div className="flex flex-col gap-1.5 w-full mt-2.5">
          <div className="w-full bg-emerald-500/[0.07] border border-emerald-500/25 rounded-xl py-2 px-3 flex items-start gap-2.5 shadow-sm text-left">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold shrink-0 border border-emerald-400/30 mt-0.5">
              <span>{opt.goodPct}%</span>
              <i className="fas fa-arrow-up text-[9px] text-emerald-400"></i>
            </span>
            <span className="text-[11px] font-medium text-emerald-100/90 leading-snug min-w-0 flex-1">
              {goodText}
            </span>
          </div>
          <div className="w-full bg-rose-500/[0.07] border border-rose-500/25 rounded-xl py-2 px-3 flex items-start gap-2.5 shadow-sm text-left">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-[11px] font-bold shrink-0 border border-rose-400/30 mt-0.5">
              <span>{opt.badPct}%</span>
              <i className="fas fa-arrow-down text-[9px] text-rose-400"></i>
            </span>
            <span className="text-[11px] font-medium text-rose-100/90 leading-snug min-w-0 flex-1">
              {badText}
            </span>
          </div>
        </div>
      );
    } else if (opt.badPct !== undefined && (!opt.goodPct || opt.goodPct === 0)) {
      const badText = getLoc(lang, opt.badTxt) || getLoc(lang, opt.tag) || '';
      return (
        <div className="w-full mt-2.5 bg-rose-500/[0.07] border border-rose-500/25 rounded-xl py-2 px-3 flex items-start gap-2.5 shadow-sm text-left">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-[11px] font-bold shrink-0 border border-rose-400/30 mt-0.5">
            <span>{opt.badPct}%</span>
            <i className="fas fa-arrow-down text-[9px] text-rose-400"></i>
          </span>
          <span className="text-[11px] font-medium text-rose-100/90 leading-snug min-w-0 flex-1">
            {badText}
          </span>
        </div>
      );
    } else if (opt.tag) {
      const txt = getLoc(lang, opt.tag);
      const isNeg = isNegativeText(txt);
      const colorClass = isNeg
        ? 'bg-rose-500/[0.08] border-rose-500/25 text-rose-200'
        : txt.includes('+€') || txt.includes('+GES') || txt.includes('+OVR')
        ? 'bg-emerald-500/[0.08] border-emerald-500/25 text-emerald-200'
        : 'bg-white/[0.04] border-white/[0.08] text-zinc-300';

      return (
        <div className={`w-full mt-2.5 ${colorClass} border rounded-xl py-2 px-3 text-left shadow-sm flex items-center gap-2`}>
          <span className="text-[11px] font-medium tracking-wide leading-snug min-w-0 flex-1 uppercase">{txt}</span>
        </div>
      );
    }
    return null;
  };

  const isSackedOffer = Boolean(
    event.isForced ||
    (typeof event.title === 'string'
      ? event.title.toUpperCase().includes('SACKED') || event.title.toUpperCase().includes('ENTLASSEN') || event.title.toUpperCase().includes('RELIEVED')
      : (event.title?.en?.toUpperCase().includes('SACKED') ||
         event.title?.en?.toUpperCase().includes('RELIEVED') ||
         event.title?.de?.toUpperCase().includes('ENTLASSEN') ||
         event.title?.de?.toUpperCase().includes('VERTRAGSAUFLÖSUNG')))
  );

  const getEventKicker = () => {
    if (event.type === 'job_offer') {
      return isSackedOffer
        ? t('Official Board Resolution · Relieved of Duties', 'Offizieller Vorstandsbeschluss · Vertragsauflösung')
        : t('Executive Opportunities · Contract Offers', 'Trainerangebote · Vertragsangebote');
    }
    if (event.type === 'board_expectation') return t('Board Directive', 'Vorstandsvorgabe');
    if (event.type === 'club_welcome') return t('Club Appointment', 'Amtsantritt');
    if (event.type === 'bankruptcy' || event.type === 'bankruptcy_decision') return t('Financial Emergency', 'Finanzielle Notlage');
    if (event.type === 'injury_crisis' || event.type === 'midseason_injury') return t('Medical Advisory', 'Medizinischer Bericht');
    if (event.type === 'transfer_bid' || event.type === 'star_poached' || event.type === 'squad_sale') return t('Transfer Market', 'Transfermarkt');
    return t('Executive Decision', 'Direktoren-Entscheidung');
  };

  // Job Offer Specific Event UI (Apple-inspired Minimalist Glassmorphism)
  if (event.type === 'job_offer' && event.clubs) {
    const rawTitle = getLoc(lang, event.title);
    const displayTitle = isSackedOffer
      ? (rawTitle.toUpperCase().includes('SACKED!') || rawTitle.toUpperCase().includes('ENTLASSEN!')
          ? t('Relieved of Duties · New Job Offers', 'Vertragsauflösung · Neue Angebote')
          : rawTitle)
      : rawTitle;

    return (
      <div className="bg-[#12141c]/95 backdrop-blur-3xl rounded-[28px] sm:rounded-[32px] p-4 sm:p-7 border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.7)] text-left relative overflow-hidden flex flex-col justify-start">
        {/* Ambient Glow */}
        {isSackedOffer ? (
          <>
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          </>
        ) : (
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Header Dispatch */}
        <div className="text-center mb-5 relative z-10">
          <div
            className={`w-13 h-13 rounded-2xl ${
              isSackedOffer
                ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.15)]'
                : 'bg-white/[0.04] border border-white/[0.08] text-sky-400 shadow-inner'
            } flex items-center justify-center text-xl mx-auto mb-3`}
          >
            <i className={`fa-solid ${isSackedOffer ? 'fa-file-contract' : 'fa-briefcase'}`}></i>
          </div>

          <div className="flex justify-center mb-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                isSackedOffer
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : 'bg-sky-500/15 text-sky-300 border border-sky-400/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isSackedOffer ? 'bg-rose-400 animate-pulse' : 'bg-sky-400'
                }`}
              ></span>
              <span className="text-center">{getEventKicker()}</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            {displayTitle}
          </h2>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 sm:p-4.5 text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed mt-3 shadow-inner text-left">
            {isSackedOffer && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/25 mb-2">
                <i className="fa-solid fa-triangle-exclamation text-[9px]"></i>
                <span>{t('Contract Terminated', 'Vertrag gekündigt')}</span>
              </div>
            )}
            <div>{getLoc(lang, event.desc)}</div>
          </div>
        </div>

        {/* Offers Section */}
        <div className="flex flex-col relative z-10 space-y-3">
          {!event.isForced && (
            <button
              onClick={(e) => { e.stopPropagation(); handleChoice(0); }}
              disabled={isResolving}
              className="w-full bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-2xl transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 border border-white/[0.08] hover:border-sky-400/30 text-sky-300 font-semibold text-xs tracking-wide shadow-sm cursor-pointer mb-1"
            >
              <i className="fa-solid fa-arrow-left text-[11px]"></i>
              <span>{t('Decline & Remain at Current Club', 'Ablehnen & Beim Verein bleiben', 'Permanecer en el Club')}</span>
            </button>
          )}

          <div className="grid grid-cols-1 gap-3">
            {(event.clubs || []).filter(Boolean).map((c, idx) => {
              if (!c) return null;
              const countryCode = c.country || 'GER';
              const countryObj = COUNTRIES[countryCode] || COUNTRIES['GER'];
              const lgInfo = getLeagueInfo(c.tier || 1, countryCode);
              const displayBudget = c.offerBudget != null
                ? parseAndNormalizeModBudget(c.offerBudget, c.tier || 1, countryCode)
                : c.currentBudget != null
                ? parseAndNormalizeModBudget(c.currentBudget, c.tier || 1, countryCode)
                : getStartingBudget(c.tier || 1, countryCode);

              return (
                <div
                  key={c.id || `${c.name}-${idx}`}
                  className="w-full bg-white/[0.025] p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col border border-white/[0.08] relative overflow-hidden text-left shadow-sm cursor-default"
                >
                  {/* Club Header Row */}
                  <div className="flex items-start justify-between gap-3 w-full mb-3">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                        <ClubLogo
                          name={c.name}
                          id={c.id}
                          color={c.color}
                          logo={c.logo}
                          fallbackLogo={c.fallbackLogo}
                          isModActive={isModActive}
                          className="w-full h-full object-contain drop-shadow-sm"
                          fallbackClassName="w-full h-full text-xs rounded-xl shadow-sm flex items-center justify-center font-bold text-white"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm sm:text-base text-white group-hover:text-sky-200 transition-colors break-words tracking-tight leading-tight">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 font-medium">
                          <span className="shrink-0">{countryObj?.flag || '🌐'}</span>
                          <span className="text-zinc-300">{countryObj?.name || countryCode}</span>
                          <span className="text-zinc-600">·</span>
                          <span className="text-zinc-400">{lgInfo?.name || `Tier ${c.tier}`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reputation & OVR Pill */}
                    <div className="flex flex-col items-end shrink-0 pt-0.5">
                      <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-xl shadow-inner">
                        <span className="text-amber-400 text-xs font-semibold flex items-center gap-1">
                          <i className="fas fa-star text-[9px]"></i> {calculateClubReputation(c.baseOvr, c.tier)}
                        </span>
                        <span className="text-zinc-500 text-[10px]">·</span>
                        <span className="text-white font-bold text-xs font-mono">{c.baseOvr} <span className="text-[10px] text-zinc-400 font-normal">OVR</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Key Parameters Row: League + Budget + Capacity */}
                  <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-[130px] bg-white/[0.03] border border-white/[0.06] rounded-xl py-2 px-3 flex items-center gap-2 shadow-inner">
                      {lgInfo?.logo ? (
                        <img
                          src={lgInfo.logo}
                          alt={`${lgInfo.name} logo`}
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                      ) : (
                        <i className="fas fa-shield-halved text-zinc-400 text-xs shrink-0"></i>
                      )}
                      <span className="text-[11px] font-semibold text-zinc-200 truncate">
                        {lgInfo?.name || `Tier ${c.tier}`}
                      </span>
                    </div>

                    <div className="flex-1 min-w-[130px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl py-2 px-3 flex items-center gap-2 shadow-inner">
                      <i className="fas fa-building-columns text-xs shrink-0"></i>
                      <span className="text-[11px] font-bold font-mono truncate">
                        {formatMoney(displayBudget)} {t('Budget', 'Budget')}
                      </span>
                    </div>

                    {c.stadium ? (
                      <div className="hidden sm:flex bg-white/[0.03] border border-white/[0.06] text-zinc-300 rounded-xl py-2 px-3 items-center gap-1.5 shadow-inner shrink-0">
                        <i className="fas fa-users text-zinc-500 text-[10px]"></i>
                        <span className="text-[11px] font-medium font-mono">{c.stadium.toLocaleString()}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Board Directive / Narrative if available */}
                  {c.narrative && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/[0.05] flex items-start gap-2 text-[11px] text-zinc-400 italic leading-relaxed">
                      <i className="fas fa-quote-left text-zinc-600 text-[9px] mt-0.5 shrink-0"></i>
                      <span className="line-clamp-2">{c.narrative}</span>
                    </div>
                  )}

                  {/* Contract Sign Call to Action */}
                  <div className="flex items-center justify-between w-full mt-3 pt-3 border-t border-white/[0.06]">
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                      <i className="fa-solid fa-file-signature text-sky-400/80 text-[11px]"></i>
                      {t('Official Appointment Ready', 'Vertrag liegt bereit')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isResolving) return;
                        setIsResolving(true);
                        onResolve(idx + 1);
                      }}
                      disabled={isResolving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-semibold text-xs tracking-wide shadow-md hover:shadow-sky-500/25 transition-all duration-150 cursor-pointer"
                    >
                      <i className="fa-solid fa-signature text-xs"></i>
                      <span>{t('Sign Contract', 'Vertrag Unterschreiben')}</span>
                      <i className="fas fa-arrow-right text-[10px]"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Retirement option */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isResolving) return;
              setIsResolving(true);
              onResolve(999);
            }}
            disabled={isResolving}
            className="w-full text-zinc-400 hover:text-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 bg-white/[0.02] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 cursor-pointer mt-2"
          >
            <i className="fa-solid fa-door-open text-xs"></i>
            <span>{t('End Director Career & Retire', 'Karriere Beenden & Zurücktreten', 'Finalizar Carrera')}</span>
          </button>
        </div>
      </div>
    );
  }

  // Standard event styling
  let headerIcon = 'fa-bolt';
  let headerColor = 'text-amber-400';
  let ambientGlow = 'bg-sky-500/10';
  const isEmergency = event.type === 'bankruptcy' || event.type === 'bankruptcy_decision';

  if (event.type === 'board_expectation') {
    headerIcon = 'fa-bullseye';
    headerColor = 'text-sky-400';
    ambientGlow = 'bg-sky-500/10';
  } else if (event.type === 'loan_result') {
    headerIcon = 'fa-handshake';
    headerColor = 'text-emerald-400';
    ambientGlow = 'bg-emerald-500/10';
  } else if (event.type === 'club_welcome') {
    headerIcon = 'fa-door-open';
    headerColor = 'text-sky-300';
    ambientGlow = 'bg-sky-500/10';
  } else if (
    isEmergency ||
    event.type === 'star_unhappy' ||
    event.type === 'hooligans' ||
    event.type === 'board' ||
    event.type === 'relegation' ||
    event.type === 'stadium_safety_mandate' ||
    event.type === 'tax_audit' ||
    event.type === 'ffp_warning' ||
    event.type === 'sausage_scandal' ||
    event.type === 'crypto_scam' ||
    event.type === 'mole_infestation' ||
    event.type === 'press_controversy' ||
    event.type === 'ultras_seat_destruction' ||
    event.type.startsWith('ita_ultras_') ||
    event.type === 'injury_crisis' ||
    event.type === 'var_hacked' ||
    event.type === 'mascot_brawl' ||
    event.type === 'nlz_loss'
  ) {
    headerIcon = 'fa-triangle-exclamation';
    headerColor = 'text-rose-400';
    ambientGlow = 'bg-rose-500/15';
  } else if (
    event.type === 'star_poached' ||
    event.type === 'transfer_bid' ||
    event.type === 'squad_sale' ||
    event.type === 'wonderkid' ||
    event.type === 'board_grant'
  ) {
    headerIcon = 'fa-sack-dollar';
    headerColor = 'text-emerald-400';
    ambientGlow = 'bg-emerald-500/10';
  }

  const fallbackName = event.newClub
    ? event.newClub.name
    : event.opt2
    ? getLoc(lang, event.opt2.title)
    : '';

  const fauxColor = event.newClub ? event.newClub.color : '1c1c1e';

  const opt2IconHtml = !event.opt2 ? null :
    event.type === 'job' || event.type === 'sacked_giant' ? (
      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] p-1 flex items-center justify-center shrink-0">
        <ClubLogo
          name={fallbackName}
          id={event.newClub?.id}
          color={fauxColor}
          logo={event.newClub?.logo}
          fallbackLogo={event.newClub?.fallbackLogo}
          isModActive={isModActive}
          className="w-full h-full object-contain drop-shadow-sm"
          fallbackClassName="w-full h-full text-xs rounded-lg border border-white/5 flex items-center justify-center font-bold text-white shrink-0"
        />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0 shadow-inner">
        <i className={`fas ${event.opt2?.icon || 'fa-handshake'} text-sm`}></i>
      </div>
    );

  return (
    <div
      className={`bg-[#12141c]/90 backdrop-blur-3xl rounded-[28px] sm:rounded-[32px] p-4 sm:p-7 border ${
        isEmergency
          ? 'border-rose-500/30 shadow-[0_24px_70px_rgba(244,63,94,0.25)]'
          : 'border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.7)]'
      } text-left relative overflow-hidden flex flex-col justify-start`}
    >
      {/* Subtle Ambient Glow */}
      <div className={`absolute -top-24 -right-24 w-72 h-72 ${ambientGlow} rounded-full blur-3xl pointer-events-none`} />

      {event.type === 'board_expectation' ? (
        <div className="mb-5 flex flex-col items-center text-center relative z-10">
          <div className="w-14 h-14 mb-3.5 bg-white/[0.04] border border-sky-400/30 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-sky-500/15 animate-pulse"></div>
            <i className="fas fa-clipboard-list text-2xl text-sky-400 relative z-10"></i>
          </div>
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
              <span>{getEventKicker()}</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3 leading-tight">
            {getLoc(lang, event.title)}
          </h2>
          
          <div className="w-full bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-3 text-left">
            {getLoc(lang, event.desc).split('•').map((part, i) => (
              <div key={i} className={`flex items-start gap-3 ${i === 0 ? 'pb-3 border-b border-white/[0.06]' : ''}`}>
                <div className={`w-7 h-7 rounded-xl ${i === 0 ? 'bg-sky-500/15 text-sky-400 border border-sky-400/25' : 'bg-purple-500/15 text-purple-400 border border-purple-400/25'} flex items-center justify-center shrink-0 mt-0.5 text-xs`}>
                  <i className={`fas ${i === 0 ? 'fa-crosshairs' : 'fa-chart-line'}`}></i>
                </div>
                <div className="text-xs sm:text-[13px] leading-relaxed text-zinc-300 font-medium">
                  {part.trim()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : event.type === 'club_welcome' && event.newClub ? (
        <div className="mb-5 flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 mb-3 bg-white/[0.04] rounded-2xl flex items-center justify-center shadow-lg border border-white/[0.08] relative overflow-hidden p-2">
            <ClubLogo 
              name={event.newClub.name} 
              id={event.newClub.id}
              color={event.newClub.color} 
              logo={event.newClub.logo} 
              fallbackLogo={event.newClub.fallbackLogo} 
              isModActive={isModActive}
              className="w-full h-full object-contain drop-shadow-sm"
              fallbackClassName="w-full h-full text-base rounded-xl flex items-center justify-center font-bold text-white shrink-0" 
            />
          </div>
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
              <span>{getEventKicker()}</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 leading-tight">
            {getLoc(lang, event.title)}
          </h2>
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3.5 text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed mb-3 w-full">
            {getLoc(lang, event.desc)}
          </div>
          <div className="w-full grid grid-cols-3 gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
            <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{lang === 'de' ? 'Liga' : 'Division'}</span>
              <span className="text-sm font-bold text-white mt-0.5">Tier {event.newClub.tier}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{lang === 'de' ? 'Stadion' : 'Capacity'}</span>
              <span className="text-sm font-bold text-white mt-0.5 font-mono">{event.newClub.stadium.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{lang === 'de' ? 'Budget' : 'War Chest'}</span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">{formatMoney(event.amount || 0)}</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-3.5 py-1.5 rounded-xl border border-amber-400/20">
            {lang === 'de' ? '1 Jahr Schonfrist vom Vorstand gewährt.' : '1-Year Board Grace Period granted.'}
          </div>
        </div>
      ) : (
        <div className="text-center mb-5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-lg mx-auto mb-3 shadow-inner">
            <i className={`fas ${headerIcon} ${headerColor}`}></i>
          </div>
          <div className="flex justify-center mb-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              isEmergency
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                : 'bg-sky-500/15 text-sky-300 border border-sky-400/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEmergency ? 'bg-rose-400 animate-pulse' : 'bg-sky-400'}`}></span>
              <span>{getEventKicker()}</span>
            </div>
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 ${
            isEmergency ? 'text-rose-300' : 'text-white'
          } leading-tight`}>
            {getLoc(lang, event.title)}
          </h2>
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed text-left sm:text-center">
            {getLoc(lang, event.desc)}
          </div>
        </div>
      )}

      {/* Choice Action Buttons */}
      <div className="flex flex-col gap-2.5 relative z-10">
        {event.opt1 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleChoice(0); }}
            disabled={isResolving}
            className={`w-full ${
              !event.opt2 
                ? 'bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3.5 px-5 justify-center items-center shadow-[0_4px_20px_rgba(14,165,233,0.3)]' 
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-sky-400/30 p-4 items-start'
            } rounded-2xl transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex flex-col relative overflow-hidden group shadow-sm cursor-pointer border`}
          >
            <div className={`flex items-center gap-3 w-full ${!event.opt2 ? 'justify-center' : ''}`}>
              {event.opt2 && (
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0 shadow-inner">
                  <i className={`fas ${event.opt1.icon || 'fa-handshake'} text-xs text-sky-400`}></i>
                </div>
              )}
              <div className={`font-semibold text-xs sm:text-sm text-white leading-snug ${!event.opt2 ? 'text-center' : 'text-left w-full'}`}>
                {getLoc(lang, event.opt1.title)}
              </div>
            </div>
            {buildOutcomeChips(event.opt1)}
          </button>
        )}

        {event.opt2 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleChoice(1); }}
            disabled={isResolving}
            className="w-full bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-2xl transition active:scale-[0.99] flex flex-col items-start border border-white/[0.08] hover:border-sky-400/30 relative overflow-hidden group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              {opt2IconHtml}
              <div className="font-semibold text-xs sm:text-sm text-white text-left w-full leading-snug">
                {getLoc(lang, event.opt2.title)}
              </div>
            </div>
            {buildOutcomeChips(event.opt2)}
          </button>
        )}

        {event.opt3 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleChoice(2); }}
            disabled={isResolving}
            className="w-full bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-2xl transition active:scale-[0.99] flex flex-col items-start border border-white/[0.08] hover:border-rose-500/30 relative overflow-hidden group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <i className={`fas ${event.opt3.icon || 'fa-user-slash'} text-xs`}></i>
              </div>
              <div className="font-semibold text-xs sm:text-sm text-white text-left w-full leading-snug">
                {getLoc(lang, event.opt3.title)}
              </div>
            </div>
            {buildOutcomeChips(event.opt3)}
          </button>
        )}
      </div>
    </div>
  );
};
