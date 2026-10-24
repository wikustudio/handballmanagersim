import React from 'react';
import { EventOption, GameEvent, Language } from '../types';
import { getLeagueInfo, formatMoney, calculateClubReputation, getStartingBudget } from '../data/gameConstants';
import { ClubLogo } from './ClubLogo';
import { t as tr, getLoc } from '../data/translations';

interface EventUIProps {
  event: GameEvent;
  lang: Language;
  onResolve: (choiceIndex: number) => void;
}

export const EventUI: React.FC<EventUIProps> = ({ event, lang, onResolve }) => {
  const t = (en: string, de?: string, _ignoredEs?: string) => tr(lang, en, de);

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

    if (opt.goodPct === 100 && (!opt.badPct || opt.badPct === 0)) {
      const txt = getLoc(lang, opt.goodTxt) || getLoc(lang, opt.tag) || '';
      const isNeg = isNegativeText(txt);

      return (
        <div
          className={`w-full mt-2.5 ${
            isNeg
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          } border rounded-xl py-2 px-3 flex items-center justify-center gap-2`}
        >
          <i className={`fas ${isNeg ? 'fa-triangle-exclamation' : 'fa-check'} text-[11px]`} />
          <span className="text-xs font-medium tracking-tight">{txt}</span>
        </div>
      );
    } else if (opt.goodPct !== undefined && opt.badPct !== undefined) {
      const goodText = getLoc(lang, opt.goodTxt);
      const badText = getLoc(lang, opt.badTxt);
      return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full mt-2.5">
          <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-1.5 px-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 shrink-0">
              {opt.goodPct}% <i className="fas fa-arrow-up text-[10px] ml-0.5 opacity-80" />
            </span>
            <span className="text-[11px] font-medium text-emerald-200/90 text-right ml-2 leading-tight">
              {goodText}
            </span>
          </div>
          <div className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-xl py-1.5 px-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 shrink-0">
              {opt.badPct}% <i className="fas fa-arrow-down text-[10px] ml-0.5 opacity-80" />
            </span>
            <span className="text-[11px] font-medium text-rose-200/90 text-right ml-2 leading-tight">
              {badText}
            </span>
          </div>
        </div>
      );
    } else if (opt.tag) {
      const txt = getLoc(lang, opt.tag);
      const isNeg = isNegativeText(txt);
      const colorClass = isNeg
        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        : txt.includes('+€') || txt.includes('+GES') || txt.includes('+OVR')
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        : 'bg-white/[0.04] border-white/10 text-zinc-300';

      return (
        <div className={`w-full mt-2.5 ${colorClass} border rounded-xl py-1.5 px-3 text-center`}>
          <span className="text-xs font-medium tracking-tight">{txt}</span>
        </div>
      );
    }
    return null;
  };

  // Job Offer Specific Event UI
  if (event.type === 'job_offer' && event.clubs) {
    return (
      <div className="bg-[#14151e] rounded-2xl p-6 sm:p-7 border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col justify-center mb-4 relative overflow-hidden">
        {/* Subtle Ambient Light */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />
        
        <div className="w-12 h-12 rounded-2xl bg-sky-500/[0.08] text-sky-400 border border-sky-500/20 flex items-center justify-center text-lg mx-auto mb-3.5 shadow-sm">
          <i className="fas fa-envelope-open-text" />
        </div>
        <div className="text-xl sm:text-[22px] font-semibold tracking-tight mb-1.5 text-white text-center">
          {getLoc(lang, event.title)}
        </div>
        <div className="text-xs sm:text-[13.5px] text-zinc-300 mb-5 text-center leading-relaxed px-2 font-normal">
          {getLoc(lang, event.desc)}
        </div>

        <div className="flex flex-col gap-2.5">
          {!event.isForced && (
            <button
              onClick={(e) => { e.stopPropagation(); onResolve(0); }}
              className="w-full bg-sky-500/[0.04] hover:bg-sky-500/[0.08] p-3.5 rounded-2xl transition-all active:scale-[0.99] flex items-center justify-center border border-sky-500/20 text-sky-300 font-medium text-xs sm:text-sm cursor-pointer shadow-sm"
            >
              {t('Stay at Current Club', 'Hier bleiben', 'Permanecer en el Club')}
            </button>
          )}

          {event.clubs.map((c, idx) => (
            <button
              key={`ev-club-${c.id || c.name || idx}-${idx}`}
              onClick={(e) => { e.stopPropagation(); onResolve(idx + 1); }}
              className="w-full bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl transition-all active:scale-[0.99] flex flex-col border border-white/[0.04] hover:border-sky-500/30 group relative overflow-hidden cursor-pointer shadow-sm text-left"
            >
              <div className="flex items-center gap-3 w-full mb-3">
                <ClubLogo
                  name={c.name}
                  color={c.color}
                  logo={c.logo}
                  className="w-10 h-10 object-contain shrink-0 drop-shadow-sm"
                  fallbackClassName="w-10 h-10 text-sm rounded-xl shadow-sm flex items-center justify-center font-semibold text-white shrink-0 border border-white/10"
                />
                <div className="text-left w-full min-w-0">
                  <div className="font-semibold text-sm sm:text-[15px] text-white leading-tight truncate">{c.name}</div>
                  <div className="text-[11px] text-amber-300/90 font-medium mt-0.5">
                    <i className="fas fa-star text-[10px] mr-1 text-amber-400" />
                    {calculateClubReputation(c.baseOvr, c.tier)} {t('Reputation', 'Reputation')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full text-xs">
                <div className="flex-1 bg-[#10121a] border border-white/[0.04] rounded-xl py-1.5 px-2.5 flex items-center justify-center gap-1.5">
                  {getLeagueInfo(c.tier, c.country || 'GER')?.logo ? (
                    <img
                      src={getLeagueInfo(c.tier, c.country || 'GER').logo}
                      alt={`${getLeagueInfo(c.tier, c.country || 'GER').name} logo`}
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      className="w-4 h-4 object-contain shrink-0"
                    />
                  ) : (
                    <i className="fas fa-shield-halved text-zinc-500" />
                  )}
                  <span className="font-medium text-zinc-300 truncate text-[11px]">
                    {getLeagueInfo(c.tier, c.country || 'GER')?.name || `League ${c.tier}`}
                  </span>
                </div>
                <div className="flex-1 bg-emerald-500/[0.05] border border-emerald-500/20 text-emerald-300 rounded-xl py-1.5 px-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium tabular-nums">
                  <i className="fas fa-building-columns text-[10px] text-emerald-400" />
                  <span className="truncate">
                    {formatMoney(getStartingBudget(c.tier, c.country || 'GER'))}
                  </span>
                </div>
              </div>
            </button>
          ))}

          <button
            onClick={(e) => { e.stopPropagation(); onResolve(3); }}
            className="w-full bg-rose-500/[0.04] hover:bg-rose-500/[0.08] p-3 rounded-2xl transition active:scale-[0.99] flex items-center justify-center border border-rose-500/20 mt-1 text-rose-400 font-medium text-xs cursor-pointer"
          >
            {t('End Manager Career', 'Karriere Beenden', 'Finalizar Carrera')}
          </button>
        </div>
      </div>
    );
  }

  // Standard event styling
  let headerIcon = 'fa-bolt';
  let headerColor = 'text-amber-400';
  let headerBg = 'bg-amber-500/[0.08] border-amber-500/20';

  if (event.type === 'board_expectation') {
    headerIcon = 'fa-bullseye';
    headerColor = 'text-sky-400';
    headerBg = 'bg-sky-500/[0.08] border-sky-500/20';
  } else if (event.type === 'loan_result') {
    headerIcon = 'fa-handshake';
    headerColor = 'text-emerald-400';
    headerBg = 'bg-emerald-500/[0.08] border-emerald-500/20';
  } else if (event.type === 'club_welcome') {
    headerIcon = 'fa-door-open';
    headerColor = 'text-white';
    headerBg = 'bg-white/[0.05] border-white/10';
  } else if (
    event.type === 'bankruptcy' ||
    event.type === 'bankruptcy_decision' ||
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
    headerBg = 'bg-rose-500/[0.08] border-rose-500/20';
  } else if (
    event.type === 'star_poached' ||
    event.type === 'transfer_bid' ||
    event.type === 'squad_sale' ||
    event.type === 'wonderkid' ||
    event.type === 'board_grant'
  ) {
    headerIcon = 'fa-sack-dollar';
    headerColor = 'text-emerald-400';
    headerBg = 'bg-emerald-500/[0.08] border-emerald-500/20';
  }

  const fallbackName = event.newClub
    ? event.newClub.name
    : event.opt2
    ? getLoc(lang, event.opt2.title)
    : '';

  const fauxColor = event.newClub ? event.newClub.color : '1c1c1e';

  const opt2IconHtml = !event.opt2 ? null :
    event.type === 'job' || event.type === 'sacked_giant' ? (
      <ClubLogo
        name={fallbackName}
        color={fauxColor}
        logo={event.newClub?.logo}
        className="w-9 h-9 object-contain shrink-0 drop-shadow-sm"
        fallbackClassName="w-9 h-9 text-xs rounded-xl border border-white/10 flex items-center justify-center font-semibold text-white shrink-0"
      />
    ) : (
      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white shrink-0 shadow-inner">
        <i className={`fas ${event.opt2?.icon || 'fa-handshake'} text-sm`} />
      </div>
    );

  const isCritical = event.type === 'bankruptcy' || event.type === 'bankruptcy_decision';

  return (
    <div
      className={`bg-[#14151e] rounded-2xl p-6 sm:p-7 border ${
        isCritical
          ? 'border-rose-500/30 shadow-[0_25px_70px_rgba(244,63,94,0.2)]'
          : 'border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.9)]'
      } flex flex-col justify-center mb-4 relative overflow-hidden`}
    >
      {/* Top Ambient Highlight */}
      <div
        className={`absolute top-0 inset-x-0 h-1 ${
          isCritical
            ? 'bg-rose-500'
            : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
        }`}
      />

      {event.type === 'board_expectation' ? (
        <div className="mb-6 flex flex-col items-center">
          <div className="w-14 h-14 mb-4 bg-sky-500/[0.08] rounded-2xl flex items-center justify-center shadow-lg border border-sky-500/20 relative overflow-hidden">
             <i className="fas fa-clipboard-list text-2xl text-sky-400 relative z-10" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-white text-center mb-3 tracking-tight">
            {getLoc(lang, event.title)}
          </div>
          
          <div className="w-full bg-[#10121a] border border-white/[0.04] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
             {getLoc(lang, event.desc).split('•').map((part, i) => (
                <div key={`ev-desc-bullet-${i}`} className={`flex items-start gap-3 ${i === 0 ? 'pb-3 border-b border-white/[0.04]' : ''}`}>
                   {i === 0 ? (
                     <div className="w-7 h-7 rounded-xl bg-sky-500/[0.08] border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        <i className="fas fa-crosshairs" />
                     </div>
                   ) : (
                     <div className="w-7 h-7 rounded-xl bg-purple-500/[0.08] border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        <i className="fas fa-chart-line" />
                     </div>
                   )}
                   <div className="text-xs sm:text-[13px] leading-relaxed text-zinc-300 font-normal">
                      {part.trim()}
                   </div>
                </div>
             ))}
          </div>
        </div>
      ) : event.type === 'club_welcome' && event.newClub ? (
        <div className="mb-6 flex flex-col items-center">
          <div className="w-16 h-16 mb-3 bg-[#10121a] rounded-2xl flex items-center justify-center shadow-lg border border-white/[0.06] relative overflow-hidden group">
            <ClubLogo 
              name={event.newClub.name} 
              color={event.newClub.color} 
              logo={event.newClub.logo} 
              fallbackLogo={event.newClub.fallbackLogo} 
              fallbackClassName="w-12 h-12 text-lg rounded-xl border border-white/10 flex items-center justify-center font-semibold text-white shrink-0" 
            />
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-white text-center mb-1.5 tracking-tight">
            {getLoc(lang, event.title)}
          </div>
          <div className="text-xs sm:text-[13px] text-zinc-400 text-center max-w-[320px] leading-relaxed mx-auto mb-4 font-normal">
            {getLoc(lang, event.desc)}
          </div>
          <div className="w-full bg-[#10121a] border border-white/[0.04] rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
              <span className="text-zinc-400 font-normal">League Tier</span>
              <span className="font-semibold text-white">Tier {event.newClub.tier}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
              <span className="text-zinc-400 font-normal">Arena Size</span>
              <span className="font-semibold text-white tabular-nums">{(event.newClub.stadium || 2000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 font-normal">Initial Budget</span>
              <span className="font-semibold text-emerald-400 tabular-nums">{formatMoney(event.amount || 0)}</span>
            </div>
          </div>
          <div className="mt-3.5 text-xs font-medium text-amber-300 bg-amber-500/[0.04] px-3 py-1.5 rounded-2xl text-center border border-amber-500/20">
            1 Year Board Grace Period.
          </div>
        </div>
      ) : (
        <>
          <div
            className={`w-11 h-11 rounded-2xl ${headerBg} ${headerColor} border flex items-center justify-center text-lg mx-auto mb-3 shadow-inner`}
          >
            <i className={`fas ${headerIcon}`} />
          </div>
          <div
            className={`text-lg sm:text-xl font-semibold tracking-tight mb-1.5 ${
              isCritical ? 'text-rose-400' : 'text-white'
            } text-center`}
          >
            {getLoc(lang, event.title)}
          </div>
          <div className="text-xs sm:text-[13.5px] text-zinc-300 mb-5 text-center leading-relaxed px-2 font-normal">
            {getLoc(lang, event.desc)}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2.5">
        {event.opt1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onResolve(0); }}
            className={`w-full ${
              !event.opt2 
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-[0_4px_20px_rgba(37,99,235,0.3)] border border-blue-400/30 justify-center items-center py-4' 
                : 'bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-sky-500/30 items-start p-4'
            } rounded-2xl transition-all active:scale-[0.99] flex flex-col relative overflow-hidden group shadow-sm cursor-pointer`}
          >
            <div className={`flex items-center gap-3 w-full ${!event.opt2 ? 'justify-center' : ''}`}>
              {event.opt2 && (
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-200 shrink-0 shadow-inner">
                  <i className={`fas ${event.opt1.icon || 'fa-handshake'} text-sm`} />
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
            onClick={(e) => { e.stopPropagation(); onResolve(1); }}
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl transition-all active:scale-[0.99] flex flex-col items-start border border-white/[0.04] hover:border-sky-500/30 relative overflow-hidden group shadow-sm cursor-pointer"
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
            onClick={(e) => { e.stopPropagation(); onResolve(2); }}
            className="w-full bg-rose-500/[0.02] hover:bg-rose-500/[0.05] p-4 rounded-2xl transition-all active:scale-[0.99] flex flex-col items-start border border-rose-500/20 relative overflow-hidden group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-9 h-9 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <i className={`fas ${event.opt3.icon || 'fa-user-slash'} text-sm`} />
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
