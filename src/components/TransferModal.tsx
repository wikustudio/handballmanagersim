import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../types';
import { formatMoney, getLeagueScaledVal, getRequiredAcademyLevelForYouthPull, getMaxYouthPullsPerSeason } from '../data/gameConstants';
import { CountUp } from './CountUp';
import { useModalDismiss } from '../utils/modalUtils';

type TransferCategory = 'all' | 'signings' | 'loans_sales' | 'academy';

interface TransferModalProps {
  state: GameState;
  lang: string;
  creditLimit: number;
  financials: { estRevenue: number; wages: number; net: number };
  actionCosts: { bidReg: number; bidKey: number; bidSuperstar?: number; bidVeteranRinger?: number };
  onBidReg: () => void;
  onBidKey: () => void;
  onSuperstarTransfer: () => void;
  onSignVeteranRinger?: () => void;
  onLoanPlayer: () => void;
  onSellBench: () => void;
  onSellStarter: () => void;
  onTerminateContractMutual?: () => void;
  onPullYouth?: (prospectId?: string) => void;
  onOpenYouth?: () => void;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  state,
  lang,
  creditLimit,
  financials,
  actionCosts,
  onBidReg,
  onBidKey,
  onSuperstarTransfer,
  onSignVeteranRinger,
  onLoanPlayer,
  onSellBench,
  onSellStarter,
  onTerminateContractMutual,
  onPullYouth,
  onOpenYouth,
  onClose
}) => {
  useModalDismiss(onClose);
  const t = (en: string, _de?: string, _es?: string) => en;
  const isDe = lang === 'de';

  const [activeCategory, setActiveCategory] = useState<TransferCategory>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isSigningRef = useRef(false);

  const handleBidReg = () => {
    if (isSigningRef.current) return;
    isSigningRef.current = true;
    onBidReg();
    setTimeout(() => { isSigningRef.current = false; }, 400);
  };

  const handleBidKey = () => {
    if (isSigningRef.current) return;
    isSigningRef.current = true;
    onBidKey();
    setTimeout(() => { isSigningRef.current = false; }, 400);
  };

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeCategory]);

  const isUnderdog = (state.managerSkills || []).includes('rosinenpicker');
  const winterBonusReg = state.winterTransfersOpenedYear === state.year ? 3 : 0;
  const winterBonusKey = state.winterTransfersOpenedYear === state.year ? 1 : 0;
  const limitTransfers = ((state.managerSkills || []).includes('scouting_network') ? 5 : 3) + winterBonusReg;
  const currentTransfers = state.regTransfersThisSeason || 0;
  const isTransferLimitReached = currentTransfers >= limitTransfers;
  const maxKeyTransfers = ((state.managerSkills || []).includes('star_magnet') ? 3 : 2) + winterBonusKey;
  const youthPullsThisSeason = (state.youthPullsSeasonYear === state.year) ? (state.youthPullsThisSeason || 0) : 0;
  const maxYouthPulls = getMaxYouthPullsPerSeason(state.club.tier || 1, state.club.academyLevel || 1);
  const isYouthPullLimitReached = youthPullsThisSeason >= maxYouthPulls;
  const academyProspects = state.youthPipeline || [];
  const academyLvl = state.club.academyLevel || 1;
  const requiredAcademyLvl = getRequiredAcademyLevelForYouthPull(state.club.tier || 1);
  const isAcademyLvlTooLow = academyLvl < requiredAcademyLvl;

  // Moral Hazard Restructuring Oversight
  const isDebtVetoActive = state.budget < 0;
  const pureWages = (financials as any).pureWages || financials.wages;
  const wageRatio = financials.estRevenue > 0 ? (pureWages / financials.estRevenue) : 1;
  const isWageCapExceeded = isDebtVetoActive && wageRatio > 0.65;

  const salesThisSeason = state.squadSalesThisSeason || 0;
  const currentSquadSize = state.club.squadSize || 18;
  const minSquadSize = 13;
  const maxSquadSize = 22;
  const availableSales = Math.max(0, Math.min(3 - salesThisSeason, currentSquadSize - minSquadSize));
  const isSellDisabled = availableSales <= 0;
  let sellReason = `(${availableSales}x)`;
  if (isSellDisabled) {
     if (currentSquadSize <= minSquadSize) {
        sellReason = isDe ? 'Min. Kader' : 'Min Squad';
     } else {
        sellReason = isDe ? 'Limit erreicht' : 'Limit reached';
     }
  }

  // Net per match (34 matchdays in a European handball season)
  const netPerMatch = Math.round(financials.net / 34);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-5 z-[110] backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.96, y: 8 }} 
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] bg-[#14151e] rounded-2xl border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden cursor-default pointer-events-auto"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-sm border border-sky-500/20 shrink-0">
              <i className="fas fa-arrows-rotate" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-sky-400 leading-none mb-1">
                {t('SEASON TRANSFER WINDOW', 'SAISON-TRANSFERFENSTER')}
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                {t('Squad Transfer Market', 'Kader Transfermarkt')}
              </h2>
            </div>
          </div>
          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center transition active:scale-95 text-zinc-400 hover:text-white cursor-pointer"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* 3-Column Metrics Bento Box */}
        <div className="px-5 pt-4 shrink-0">
          <div className="bg-[#181924] border border-white/[0.04] rounded-2xl p-3.5 sm:p-4 grid grid-cols-3 gap-2 shadow-sm">
            <div>
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block mb-1">
                {t('TRANSFER BUDGET', 'TRANSFERBUDGET')}
              </span>
              <span className={`text-lg sm:text-xl font-semibold tracking-tight tabular-nums ${state.budget < 0 ? 'text-rose-400' : 'text-white'}`}>
                <CountUp value={state.budget} formatValue={formatMoney} duration={900} />
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block mb-1">
                {t('NET / MATCH', 'NETTO / SPIEL')}
              </span>
              <span className={`text-lg sm:text-xl font-semibold tracking-tight tabular-nums flex items-center gap-1 ${netPerMatch >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span>{netPerMatch >= 0 ? '+' : ''}{formatMoney(netPerMatch)}</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block mb-1">
                {t('SQUAD CAPACITY', 'KADERGRÖSSE')}
              </span>
              <span className="text-lg sm:text-xl font-semibold tracking-tight tabular-nums text-white">
                {currentSquadSize}<span className="text-xs sm:text-sm font-medium text-zinc-500">/22</span>
              </span>
            </div>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-medium transition cursor-pointer shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-sky-500/[0.08] text-sky-300 border border-sky-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              {t('All Operations', 'Alle Operationen')}
            </button>
            <button
              onClick={() => setActiveCategory('signings')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-medium transition cursor-pointer shrink-0 ${
                activeCategory === 'signings'
                  ? 'bg-sky-500/[0.08] text-sky-300 border border-sky-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              {t('Incoming Signings', 'Neuzugänge')}
            </button>
            <button
              onClick={() => setActiveCategory('loans_sales')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-medium transition cursor-pointer shrink-0 ${
                activeCategory === 'loans_sales'
                  ? 'bg-sky-500/[0.08] text-sky-300 border border-sky-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              {t('Loans & Sales', 'Leihen & Abgänge')}
            </button>
            <button
              onClick={() => setActiveCategory('academy')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeCategory === 'academy'
                  ? 'bg-emerald-500/[0.08] text-emerald-300 border border-emerald-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              <span>{t('Academy Call-Up', 'U19 Nachwuchs')}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium tabular-nums ${
                academyProspects.length > 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-zinc-800 text-zinc-500'
              }`}>
                {academyProspects.length}
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Moral Hazard Sanierungsplan Restructuring Covenant Banner */}
          {isDebtVetoActive && (
            <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs text-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 text-xs">
                    <i className="fas fa-shield-halved" />
                  </span>
                  <div>
                    <span className="font-semibold text-amber-300 block">{t('Restructuring Covenant Enforced', 'Sanierungsauflagen in Kraft')}</span>
                    <span className="text-[11px] text-amber-200/80 leading-snug">
                      {t(
                        'Board veto freezes cash transfer fees until €0 net debt. Hard wage cap of 65% on external signings.',
                        'Vorstands-Veto sperrt Transferausgaben bis 0 € Schulden. 65% Gehaltsobergrenze für Neuzugänge.'
                      )}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                  {t('Moral Hazard Lock', 'Schuldenbremse')}
                </span>
              </div>
              
              <div className="bg-[#14151e]/80 rounded-xl px-2.5 py-1.5 border border-white/[0.04] flex flex-col gap-1 text-[10px] text-amber-200/90">
                <div className="flex items-center gap-2">
                  <i className="fas fa-hand-holding-heart text-amber-400 shrink-0" />
                  <span>
                    {t(
                      'Legacy Renewal Exemption: Existing contracts, flat-wage loyalty renewals, and free season loans enjoy a +5% buffer (up to 70% revenue) to protect roster continuity.',
                      'Bestandsschutz-Klausel: Bestehende Verträge, treue Verlängerungen und kostenlose Leihen erhalten +5% Puffer (bis 70% Umsatz) für Kaderstabilität.'
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                  <i className="fas fa-seedling text-emerald-400 shrink-0" />
                  <span>
                    {t(
                      'Academy Call-Up Exemption: Emergency promotions from your academy pipeline are permitted to strengthen your squad with zero transfer fees.',
                      'Nachwuchs-Ausnahme: Beförderungen aus der eigenen Akademie sind ohne Transfergebühr jederzeit zulässig.'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: FIRST-TEAM ADDITIONS */}
          {(activeCategory === 'all' || activeCategory === 'signings') && (
            <div className="space-y-2.5">
              <div className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                {t('FIRST-TEAM ADDITIONS', 'ERSTE MANNSCHAFT')}
              </div>

              {/* Card 1: Sign Squad Player */}
              <button
                onClick={(e) => { e.stopPropagation(); handleBidReg(); }}
                disabled={isDebtVetoActive || isTransferLimitReached || currentSquadSize >= maxSquadSize || (state.budget + creditLimit) < actionCosts.bidReg || isWageCapExceeded}
                className="w-full bg-[#181924] hover:bg-white/[0.03] p-3.5 sm:p-4 rounded-2xl border border-white/[0.04] hover:border-sky-500/20 text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-sm shrink-0">
                    <i className="fas fa-user-plus" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs sm:text-sm truncate">
                      {t('Sign Squad Player', 'Stammspieler kaufen')}
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-snug truncate">
                      {isDebtVetoActive ? (
                        <span className="text-amber-400 font-medium">{t('Board Veto: Locked under debt restructuring.', 'Vorstands-Veto: Wegen Schulden gesperrt.')}</span>
                      ) : isWageCapExceeded ? (
                        <span className="text-amber-400 font-medium">{t('Wage Cap (65%) Exceeded.', 'Gehaltsobergrenze überschritten.')}</span>
                      ) : currentSquadSize >= maxSquadSize ? (
                        <span className="text-rose-400 font-medium">{t('Blocked: Max squad size (22).', 'Kader voll (22).')}</span>
                      ) : isTransferLimitReached ? (
                        <span className="text-rose-400 font-medium">{t('Limit reached.', 'Limit erreicht.')}</span>
                      ) : (state.budget + creditLimit) < actionCosts.bidReg ? (
                        <span className="text-rose-400 font-medium">{t('Blocked: Insufficient funds.', 'Zu wenig Budget.')}</span>
                      ) : (
                        t('Solid starting quality to strengthen depth and base team OVR.', 'Solide Startelf-Qualität für mehr Kaderbreite.')
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-white text-xs sm:text-sm tabular-nums">
                    -{formatMoney(actionCosts.bidReg)}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium tabular-nums mt-0.5">
                    {currentTransfers} / {limitTransfers} slots
                  </div>
                </div>

                {isUnderdog && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[9px] font-medium tracking-wider uppercase rounded-bl-lg border-l border-b border-amber-500/20">
                    20% Off
                  </div>
                )}
              </button>

              {/* Card 2: Sign Key Player */}
              <button
                onClick={(e) => { e.stopPropagation(); handleBidKey(); }}
                disabled={isDebtVetoActive || (state.keyTransfersThisSeason || 0) >= maxKeyTransfers || currentSquadSize >= maxSquadSize || (state.club.morale ?? 100) < 40 || (state.budget + creditLimit) < actionCosts.bidKey || isWageCapExceeded}
                className="w-full bg-[#181924] hover:bg-white/[0.03] p-3.5 sm:p-4 rounded-2xl border border-white/[0.04] hover:border-purple-500/20 text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-sm shrink-0">
                    <i className="fas fa-star" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs sm:text-sm truncate">
                      {t('Sign Key Player', 'Schlüsselspieler kaufen')}
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-snug truncate">
                      {isDebtVetoActive ? (
                        <span className="text-amber-400 font-medium">{t('Board Veto: Locked under debt restructuring.', 'Vorstands-Veto: Wegen Schulden gesperrt.')}</span>
                      ) : isWageCapExceeded ? (
                        <span className="text-amber-400 font-medium">{t('Wage Cap (65%) Exceeded.', 'Gehaltsobergrenze überschritten.')}</span>
                      ) : currentSquadSize >= maxSquadSize ? (
                        <span className="text-rose-400 font-medium">{t('Blocked: Max squad size (22).', 'Kader voll (22).')}</span>
                      ) : (state.keyTransfersThisSeason || 0) >= maxKeyTransfers ? (
                        <span className="text-rose-400 font-medium">{t('Limit reached.', 'Limit erreicht.')}</span>
                      ) : (state.club.morale ?? 100) < 40 ? (
                        <span className="text-rose-400 font-medium">{t('Blocked: Team morale too low (<40).', 'Moral zu niedrig (<40).')}</span>
                      ) : (state.budget + creditLimit) < actionCosts.bidKey ? (
                        <span className="text-rose-400 font-medium">{t('Blocked: Insufficient funds.', 'Zu wenig Budget.')}</span>
                      ) : (
                        t('High stakes gamble! Immediate high OVR impact or expensive flop.', 'Großer OVR-Impact oder teurer Flop.')
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-white text-xs sm:text-sm tabular-nums">
                    -{formatMoney(actionCosts.bidKey)}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium tabular-nums mt-0.5">
                    {state.keyTransfersThisSeason || 0} / {maxKeyTransfers} slots
                  </div>
                </div>

                {isUnderdog && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[9px] font-medium tracking-wider uppercase rounded-bl-lg border-l border-b border-amber-500/20">
                    20% Off
                  </div>
                )}
              </button>

              {/* Card 3: Superstar Galáctico (League 1 only) */}
              {state.club.tier === 1 && (() => {
                const superstarCost = actionCosts.bidSuperstar || (actionCosts.bidKey * 2);
                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSuperstarTransfer(); }}
                    disabled={isDebtVetoActive || (state.galacticosThisSeason || 0) >= 1 || currentSquadSize >= maxSquadSize || (state.club.morale ?? 100) < 50 || isWageCapExceeded || (state.budget + creditLimit) < superstarCost}
                    className="w-full bg-[#181924] hover:bg-white/[0.03] p-3.5 sm:p-4 rounded-2xl border border-white/[0.04] hover:border-amber-500/20 text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group disabled:opacity-30 disabled:grayscale"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm shrink-0">
                        <i className="fas fa-crown" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-amber-300 text-xs sm:text-sm truncate">
                          {t('Sign Superstar Galáctico', 'Superstar Galáctico')}
                        </div>
                        <div className="text-[11px] text-zinc-400 leading-snug truncate">
                          {isDebtVetoActive ? (
                            <span className="text-amber-400 font-medium">{t('Board Veto: Locked under debt restructuring.', 'Vorstands-Veto.')}</span>
                          ) : isWageCapExceeded ? (
                            <span className="text-amber-400 font-medium">{t('Wage Cap Exceeded.', 'Gehaltsobergrenze überschritten.')}</span>
                          ) : (state.galacticosThisSeason || 0) >= 1 ? (
                            <span className="text-rose-400 font-medium">{t('Season limit reached (1/1).', 'Saisonlimit erreicht.')}</span>
                          ) : currentSquadSize >= maxSquadSize ? (
                            <span className="text-rose-400 font-medium">{t('Blocked: Max squad size (22).', 'Kader voll (22).')}</span>
                          ) : (state.club.morale ?? 100) < 50 ? (
                            <span className="text-rose-400 font-medium">{t('Blocked: Team morale too low.', 'Moral zu niedrig.')}</span>
                          ) : (state.budget + creditLimit) < superstarCost ? (
                            <span className="text-rose-400 font-medium">{t('Blocked: Insufficient funds.', 'Zu wenig Budget.')}</span>
                          ) : (
                            t('Bypasses rating caps. Guaranteed +3 OVR and +5,000 Fans immediately.', 'Garantiert sofort +3 GES & +5.000 Fans.')
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold text-rose-400 text-xs sm:text-sm tabular-nums">
                        -{formatMoney(superstarCost)}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium tabular-nums mt-0.5">
                        {state.galacticosThisSeason || 0} / 1 slot
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* Card 4: Sign Veteran Ringer (Tiers 3, 4, 5, 6 only) */}
              {(state.club.tier || 1) >= 3 && (() => {
                const ringerFee = actionCosts.bidVeteranRinger || Math.round(actionCosts.bidReg * 0.4);
                const isRingerSigned = Boolean(state.veteranRingerSignedThisSeason);
                const isBlocked = isDebtVetoActive || isRingerSigned || currentSquadSize >= maxSquadSize || (state.budget + creditLimit) < ringerFee;

                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSignVeteranRinger?.(); }}
                    disabled={isBlocked}
                    className="w-full bg-[#181924] hover:bg-white/[0.03] p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 hover:border-amber-400/40 text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-sm shrink-0">
                        <i className="fas fa-medal" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-amber-300 text-xs sm:text-sm truncate flex items-center gap-1.5">
                          <span>{t('Sign Veteran Ringer', 'Altstar verpflichten')}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                            T3–T6 All-In
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 leading-snug truncate">
                          {isRingerSigned ? (
                            <span className="text-amber-400 font-medium">
                              {t(`Active: ${state.veteranRingerName || 'Veteran Star'} (+${state.veteranRingerOvrGain || 4} OVR). Retires at season end.`, `Aktiv: ${state.veteranRingerName || 'Altstar'} (+${state.veteranRingerOvrGain || 4} GES). Hört nach Saison auf.`)}
                            </span>
                          ) : isDebtVetoActive ? (
                            <span className="text-amber-400 font-medium">{t('Board Veto: Locked under debt restructuring.', 'Vorstands-Veto.')}</span>
                          ) : currentSquadSize >= maxSquadSize ? (
                            <span className="text-rose-400 font-medium">{t('Blocked: Max squad size (22).', 'Kader voll (22).')}</span>
                          ) : (state.budget + creditLimit) < ringerFee ? (
                            <span className="text-rose-400 font-medium">{t('Blocked: Insufficient funds.', 'Zu wenig Budget.')}</span>
                          ) : (
                            t('Massive +3 to +5 OVR immediate boost. Exorbitant wages & 1-season retirement. Promote or face crisis!', 'Sofort +3 bis +5 GES! Astronomisches Gehalt & Karriereende nach Saison. Aufstieg oder Krise!')
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold text-amber-300 text-xs sm:text-sm tabular-nums">
                        -{formatMoney(ringerFee)}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-medium tabular-nums mt-0.5">
                        {isRingerSigned ? '1 / 1 slot' : '0 / 1 slot'}
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          )}

          {/* SECTION 2: LOANS & OUTGOINGS */}
          {(activeCategory === 'all' || activeCategory === 'loans_sales') && (
            <div className="space-y-2.5">
              <div className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                {t('LOANS & OUTGOINGS', 'LEIHEN & ABGÄNGE')}
              </div>

              {/* 2-Column Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Loan In Card */}
                <button
                  onClick={(e) => { e.stopPropagation(); onLoanPlayer(); }}
                  disabled={(state.loansThisSeason || 0) >= 2 || currentSquadSize >= maxSquadSize}
                  className="bg-[#181924] hover:bg-white/[0.03] p-4 rounded-2xl border border-white/[0.04] hover:border-cyan-500/20 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">
                        <i className="fas fa-handshake" />
                      </div>
                      <span className="font-semibold text-white text-sm">{t('Loan In', 'Spieler leihen')}</span>
                    </div>
                    <span className="text-cyan-400 text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                      Free
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {t('Temporary signing (-1 to +2 OVR impact). Expires at season end.', 'Kurzfristige Verstärkung (-1 bis +2 GES). Endet nach einer Saison.')}
                  </p>

                  <div className="text-[11px] text-zinc-500 font-medium tabular-nums">
                    {state.loansThisSeason || 0} / 2 loans used
                  </div>
                </button>

                {/* Sell Player Card */}
                <div className="bg-[#181924] p-4 rounded-2xl border border-white/[0.04] text-left flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                        <i className="fas fa-arrow-trend-up" />
                      </div>
                      <span className="font-semibold text-white text-sm">{t('Sell Player', 'Spieler verkaufen')}</span>
                    </div>
                    <span className="text-emerald-400 text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      +Cash
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {t('Liquidate surplus talent to reduce squad wage bill and inject capital.', 'Überflüssige Spieler abgeben, Gehaltsetat senken und Erlöse erzielen.')}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {(() => {
                      const ovrRatio = (state.club.baseOvr || 60) / 75;
                      const benchSellValue = Math.round(getLeagueScaledVal(state.club.tier, 125000, state.club.country) * Math.max(0.5, Math.pow(ovrRatio, 2)));
                      const starterSellValue = Math.round(getLeagueScaledVal(state.club.tier, 350000, state.club.country) * Math.max(0.5, Math.pow(ovrRatio, 2.5)));
                      return (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onSellBench(); }}
                            disabled={isSellDisabled}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-200 border border-white/[0.04] transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center truncate cursor-pointer"
                            title="Sell Bench / Reserve Player"
                          >
                            Bench +{formatMoney(benchSellValue)} {sellReason}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onSellStarter(); }}
                            disabled={isSellDisabled}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium text-emerald-300 border border-emerald-500/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center truncate cursor-pointer"
                            title="Sell First-Team Starter"
                          >
                            Starter +{formatMoney(starterSellValue)} {sellReason}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Mutual Contract Termination Row */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTerminateContractMutual) onTerminateContractMutual();
                }}
                disabled={currentSquadSize <= minSquadSize}
                className="w-full bg-[#181924] hover:bg-white/[0.03] p-3 rounded-2xl border border-white/[0.04] hover:border-sky-500/20 text-left transition flex items-center justify-between gap-3 disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xs shrink-0">
                    <i className="fas fa-file-contract" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{t('Mutual Contract Termination', 'Einvernehmliche Vertragsauflösung')}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{t('Release contract by mutual agreement with €0 severance.', 'Vertrag ohne Abfindung einvernehmlich auflösen.')}</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-sky-400 uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full shrink-0">
                  {t('€0 Severance', '0 € Abfindung')}
                </span>
              </button>
            </div>
          )}

          {/* SECTION 3: YOUTH ACADEMY */}
          {(activeCategory === 'all' || activeCategory === 'academy') && (
            <div className="space-y-2.5">
              <div className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                {t('YOUTH ACADEMY', 'JUGENDAKADEMIE')}
              </div>

              {/* Youth Academy Action Card */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenYouth) onOpenYouth();
                }}
                className="w-full bg-[#181924] hover:bg-emerald-500/[0.04] p-3 rounded-2xl border border-white/[0.04] hover:border-emerald-500/20 text-left transition flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <i className="fas fa-graduation-cap" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors truncate flex items-center gap-2">
                      <span>{t('Youth Academy & Incubator', 'Nachwuchsakademie & Talentschmiede')}</span>
                      {academyProspects.some(p => (p.timer || 0) <= 0 && !p.isLoanedOut) && (
                        <span className="text-[9px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                          {t('Graduate Ready', 'Graduierung bereit')}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {t('Scout talent, review incubator prospects, Pull to Squad, or graduate mature players.', 'Talente scouten, U19-Kader verwalten und Nachwuchsspieler hochziehen.')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full tabular-nums">
                    {academyProspects.length} {academyProspects.length === 1 ? t('Prospect', 'Talent') : t('Prospects', 'Talente')}
                  </span>
                  <i className="fas fa-arrow-up-right-from-square text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                </div>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.04] bg-[#14151e] shrink-0">
          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="w-full py-3 px-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium transition active:scale-[0.99] border border-white/[0.04] cursor-pointer"
          >
            {t('Close Window', 'Fenster schließen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
