import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { GameState } from '../types';
import {
  formatMoney,
  getLeagueScaledVal,
  getRequiredAcademyLevelForYouthPull,
  getMaxYouthPullsPerSeason,
} from '../data/gameConstants';
import { CountUp } from './CountUp';
import { ClubLogo } from './ClubLogo';
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
  onOpenYouth,
  onClose,
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
    setTimeout(() => {
      isSigningRef.current = false;
    }, 400);
  };

  const handleBidKey = () => {
    if (isSigningRef.current) return;
    isSigningRef.current = true;
    onBidKey();
    setTimeout(() => {
      isSigningRef.current = false;
    }, 400);
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
  const youthPullsThisSeason = state.youthPullsSeasonYear === state.year ? state.youthPullsThisSeason || 0 : 0;
  const maxYouthPulls = getMaxYouthPullsPerSeason(state.club.tier || 1, state.club.academyLevel || 1);
  const isYouthPullLimitReached = youthPullsThisSeason >= maxYouthPulls;
  const academyProspects = state.youthPipeline || [];
  const academyLvl = state.club.academyLevel || 1;
  const requiredAcademyLvl = getRequiredAcademyLevelForYouthPull(state.club.tier || 1);
  const isAcademyLvlTooLow = academyLvl < requiredAcademyLvl;
  void isYouthPullLimitReached;
  void isAcademyLvlTooLow;

  // Moral Hazard Restructuring Oversight
  const isDebtVetoActive = state.budget < 0;
  const pureWages = (financials as any).pureWages || financials.wages;
  const wageRatio = financials.estRevenue > 0 ? pureWages / financials.estRevenue : 1;
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
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-[110] backdrop-blur-2xl cursor-pointer animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#14151e] rounded-[28px] border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] overflow-hidden cursor-default pointer-events-auto text-white"
      >
        {/* Top Ambient Hairline */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-white/[0.04] shrink-0 bg-[#14151e]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base border border-emerald-500/20 shrink-0">
              <i className="fas fa-arrows-rotate" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 leading-none">
                  {t('SQUAD & TRANSFERS', 'KADER & TRANSFERS')}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-zinc-400 tabular-nums leading-none">
                  {currentSquadSize}/22
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-none truncate">
                {t('Transfer Market', 'Transfermarkt')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-[#10121a] border border-white/[0.04] px-3 py-1.5 rounded-xl">
              <ClubLogo
                name={state.club.name}
                logo={state.club.logo}
                fallbackLogo={state.club.fallbackLogo}
                color={state.club.color}
                className="w-4 h-4 object-contain shrink-0"
                fallbackClassName="w-4 h-4 text-[7px] rounded flex items-center justify-center font-bold text-white shrink-0"
              />
              <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">
                {state.club.name}
              </span>
            </div>
            <button
              aria-label="Close modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] flex items-center justify-center transition-colors active:scale-95 text-zinc-400 hover:text-white cursor-pointer"
            >
              <i className="fas fa-xmark text-sm" />
            </button>
          </div>
        </div>

        {/* 4-Column Metrics Bento Box */}
        <div className="px-5 pt-4 shrink-0">
          <div className="bg-[#10121a] border border-white/[0.04] rounded-2xl p-3.5 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('TRANSFER BUDGET', 'TRANSFERBUDGET')}
              </span>
              <span
                className={`text-lg sm:text-xl font-semibold tracking-tight tabular-nums ${
                  state.budget < 0 ? 'text-rose-400' : 'text-white'
                }`}
              >
                <CountUp value={state.budget} formatValue={formatMoney} duration={900} />
              </span>
            </div>

            <div className="sm:border-l sm:border-white/[0.04] sm:pl-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('NET / MATCH', 'NETTO / SPIEL')}
              </span>
              <span
                className={`text-lg sm:text-xl font-semibold tracking-tight tabular-nums flex items-center gap-1 ${
                  netPerMatch >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span>
                  {netPerMatch >= 0 ? '+' : ''}
                  {formatMoney(netPerMatch)}
                </span>
              </span>
            </div>

            <div className="sm:border-l sm:border-white/[0.04] sm:pl-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('SQUAD OVR', 'KADER-GES')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-semibold tracking-tight tabular-nums text-white">
                  <CountUp value={state.club.baseOvr || 60} duration={500} />
                </span>
                {(() => {
                  const seasonLogs = (state.ovrHistory || []).filter((h) => h.season === state.year);
                  const seasonDelta =
                    seasonLogs.length > 0
                      ? seasonLogs.reduce((sum, h) => sum + h.change, 0)
                      : typeof state.startOfSeasonOvr === 'number'
                      ? (state.club.baseOvr || 60) - state.startOfSeasonOvr
                      : 0;
                  if (seasonDelta === 0) return null;
                  return (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border tabular-nums ${
                        seasonDelta > 0
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {seasonDelta > 0 ? `+${seasonDelta}` : seasonDelta}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="sm:border-l sm:border-white/[0.04] sm:pl-3 sm:text-right">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">
                {t('SQUAD CAPACITY', 'KADERGRÖSSE')}
              </span>
              <span className="text-lg sm:text-xl font-semibold tracking-tight tabular-nums text-white">
                {currentSquadSize}
                <span className="text-xs sm:text-sm font-normal text-zinc-500">/22</span>
              </span>
            </div>
          </div>
        </div>

        {/* Segmented Category Navigation Switcher */}
        <div className="px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-2xl bg-[#10121a] border border-white/[0.04] text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`py-2 px-2.5 rounded-xl font-medium transition-colors cursor-pointer truncate ${
                activeCategory === 'all'
                  ? 'bg-[#181924] text-white border border-white/[0.06] shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {t('All Operations', 'Alle Operationen')}
            </button>
            <button
              onClick={() => setActiveCategory('signings')}
              className={`py-2 px-2.5 rounded-xl font-medium transition-colors cursor-pointer truncate ${
                activeCategory === 'signings'
                  ? 'bg-[#181924] text-white border border-white/[0.06] shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {t('Incoming Signings', 'Neuzugänge')}
            </button>
            <button
              onClick={() => setActiveCategory('loans_sales')}
              className={`py-2 px-2.5 rounded-xl font-medium transition-colors cursor-pointer truncate ${
                activeCategory === 'loans_sales'
                  ? 'bg-[#181924] text-white border border-white/[0.06] shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {t('Loans & Sales', 'Leihen & Abgänge')}
            </button>
            <button
              onClick={() => setActiveCategory('academy')}
              className={`py-2 px-2.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                activeCategory === 'academy'
                  ? 'bg-[#181924] text-white border border-white/[0.06] shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              <span className="truncate">{t('Academy Call-Up', 'U19 Nachwuchs')}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums shrink-0 ${
                  academyProspects.length > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06]'
                }`}
              >
                {academyProspects.length}
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 pt-3.5 space-y-5 custom-scrollbar">
          {/* Moral Hazard Sanierungsplan Restructuring Covenant Banner */}
          {isDebtVetoActive && (
            <div className="bg-[#10121a] border border-amber-500/25 rounded-2xl p-4 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 text-xs">
                    <i className="fas fa-shield-halved" />
                  </span>
                  <div className="min-w-0">
                    <span className="font-semibold text-white block truncate">
                      {t('Restructuring Covenant Enforced', 'Sanierungsauflagen in Kraft')}
                    </span>
                    <span className="text-[11px] text-zinc-400 leading-snug">
                      {t(
                        'Board veto freezes cash transfer fees until €0 net debt. Hard wage cap of 65% on external signings.',
                        'Vorstands-Veto sperrt Transferausgaben bis 0 € Schulden. 65% Gehaltsobergrenze für Neuzugänge.'
                      )}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] border border-white/[0.06] text-amber-400 shrink-0 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {t('Moral Hazard Lock', 'Schuldenbremse')}
                </span>
              </div>

              <div className="bg-[#181924] rounded-xl p-3 border border-white/[0.04] flex flex-col gap-2 text-[11px] text-zinc-400">
                <div className="flex items-start gap-2">
                  <i className="fas fa-hand-holding-heart text-amber-400 mt-0.5 shrink-0" />
                  <span>
                    {t(
                      'Legacy Renewal Exemption: Existing contracts, flat-wage loyalty renewals, and free season loans enjoy a +5% buffer (up to 70% revenue) to protect roster continuity.',
                      'Bestandsschutz-Klausel: Bestehende Verträge, treue Verlängerungen und kostenlose Leihen erhalten +5% Puffer (bis 70% Umsatz) für Kaderstabilität.'
                    )}
                  </span>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-white/[0.04]">
                  <i className="fas fa-seedling text-emerald-400 mt-0.5 shrink-0" />
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
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {t('FIRST-TEAM ADDITIONS', 'ERSTE MANNSCHAFT')}
              </div>

              {/* Card 1: Sign Squad Player */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBidReg();
                }}
                disabled={
                  isDebtVetoActive ||
                  isTransferLimitReached ||
                  currentSquadSize >= maxSquadSize ||
                  state.budget + creditLimit < actionCosts.bidReg ||
                  isWageCapExceeded
                }
                className="w-full bg-[#10121a] hover:bg-[#181924] p-3.5 sm:p-4 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] text-left transition-colors cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-sky-400 text-sm shrink-0">
                    <i className="fas fa-user-plus" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-xs sm:text-sm truncate">
                        {t('Sign Squad Player', 'Stammspieler kaufen')}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-zinc-400 tabular-nums">
                        {currentTransfers} / {limitTransfers} slots
                      </span>
                      {isUnderdog && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 tabular-nums">
                          -20%
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-snug truncate mt-0.5">
                      {isDebtVetoActive ? (
                        <span className="text-amber-400 font-medium">
                          {t('Board Veto: Locked under debt restructuring.', 'Vorstands-Veto: Wegen Schulden gesperrt.')}
                        </span>
                      ) : isWageCapExceeded ? (
                        <span className="text-amber-400 font-medium">
                          {t('Wage Cap (65%) Exceeded.', 'Gehaltsobergrenze überschritten.')}
                        </span>
                      ) : currentSquadSize >= maxSquadSize ? (
                        <span className="text-rose-400 font-medium">
                          {t('Blocked: Max squad size (22).', 'Kader voll (22).')}
                        </span>
                      ) : isTransferLimitReached ? (
                        <span className="text-rose-400 font-medium">{t('Limit reached.', 'Limit erreicht.')}</span>
                      ) : state.budget + creditLimit < actionCosts.bidReg ? (
                        <span className="text-rose-400 font-medium">
                          {t('Blocked: Insufficient funds.', 'Zu wenig Budget.')}
                        </span>
                      ) : (
                        t(
                          'Solid starting quality to strengthen depth and base team OVR.',
                          'Solide Startelf-Qualität für mehr Kaderbreite.'
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-2.5 py-1.5 rounded-xl bg-[#181924] border border-white/[0.06] text-right shrink-0 tabular-nums">
                  <span className="font-mono font-semibold text-white text-xs">
                    -{formatMoney(actionCosts.bidReg)}
                  </span>
                </div>
              </button>

              {/* Card 2: Sign Key Player */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBidKey();
                }}
                disabled={
                  isDebtVetoActive ||
                  (state.keyTransfersThisSeason || 0) >= maxKeyTransfers ||
                  currentSquadSize >= maxSquadSize ||
                  (state.club.morale ?? 100) < 40 ||
                  state.budget + creditLimit < actionCosts.bidKey ||
                  isWageCapExceeded
                }
                className="w-full bg-[#10121a] hover:bg-[#181924] p-3.5 sm:p-4 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] text-left transition-colors cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-purple-400 text-sm shrink-0">
                    <i className="fas fa-star" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-xs sm:text-sm truncate">
                        {t('Sign Key Player', 'Schlüsselspieler kaufen')}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-zinc-400 tabular-nums">
                        {state.keyTransfersThisSeason || 0} / {maxKeyTransfers} slots
                      </span>
                      {isUnderdog && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 tabular-nums">
                          -20%
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-snug truncate mt-0.5">
                      {isDebtVetoActive ? (
                        <span className="text-amber-400 font-medium">
                          {t('Board Veto: Locked under debt restructuring.', 'Vorstands-Veto: Wegen Schulden gesperrt.')}
                        </span>
                      ) : isWageCapExceeded ? (
                        <span className="text-amber-400 font-medium">
                          {t('Wage Cap (65%) Exceeded.', 'Gehaltsobergrenze überschritten.')}
                        </span>
                      ) : currentSquadSize >= maxSquadSize ? (
                        <span className="text-rose-400 font-medium">
                          {t('Blocked: Max squad size (22).', 'Kader voll (22).')}
                        </span>
                      ) : (state.keyTransfersThisSeason || 0) >= maxKeyTransfers ? (
                        <span className="text-rose-400 font-medium">{t('Limit reached.', 'Limit erreicht.')}</span>
                      ) : (state.club.morale ?? 100) < 40 ? (
                        <span className="text-rose-400 font-medium">
                          {t('Blocked: Team morale too low (<40).', 'Moral zu niedrig (<40).')}
                        </span>
                      ) : state.budget + creditLimit < actionCosts.bidKey ? (
                        <span className="text-rose-400 font-medium">
                          {t('Blocked: Insufficient funds.', 'Zu wenig Budget.')}
                        </span>
                      ) : (
                        t(
                          'High stakes gamble! Immediate high OVR impact or expensive flop.',
                          'Großer OVR-Impact oder teurer Flop.'
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-2.5 py-1.5 rounded-xl bg-[#181924] border border-white/[0.06] text-right shrink-0 tabular-nums">
                  <span className="font-mono font-semibold text-white text-xs">
                    -{formatMoney(actionCosts.bidKey)}
                  </span>
                </div>
              </button>

              {/* Card 3: Superstar Galáctico (League 1 only) */}
              {state.club.tier === 1 &&
                (() => {
                  const superstarCost = actionCosts.bidSuperstar || actionCosts.bidKey * 2;
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSuperstarTransfer();
                      }}
                      disabled={
                        isDebtVetoActive ||
                        (state.galacticosThisSeason || 0) >= 1 ||
                        currentSquadSize >= maxSquadSize ||
                        (state.club.morale ?? 100) < 50 ||
                        isWageCapExceeded ||
                        state.budget + creditLimit < superstarCost
                      }
                      className="w-full bg-[#10121a] hover:bg-[#181924] p-3.5 sm:p-4 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] text-left transition-colors cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-amber-400 text-sm shrink-0">
                          <i className="fas fa-crown" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-xs sm:text-sm truncate">
                              {t('Sign Superstar Galáctico', 'Superstar Galáctico')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-zinc-400 tabular-nums">
                              {state.galacticosThisSeason || 0} / 1 slot
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 leading-snug truncate mt-0.5">
                            {isDebtVetoActive ? (
                              <span className="text-amber-400 font-medium">
                                {t('Board Veto: Locked under debt restructuring.', 'Vorstands-Veto.')}
                              </span>
                            ) : isWageCapExceeded ? (
                              <span className="text-amber-400 font-medium">
                                {t('Wage Cap Exceeded.', 'Gehaltsobergrenze überschritten.')}
                              </span>
                            ) : (state.galacticosThisSeason || 0) >= 1 ? (
                              <span className="text-rose-400 font-medium">
                                {t('Season limit reached (1/1).', 'Saisonlimit erreicht.')}
                              </span>
                            ) : currentSquadSize >= maxSquadSize ? (
                              <span className="text-rose-400 font-medium">
                                {t('Blocked: Max squad size (22).', 'Kader voll (22).')}
                              </span>
                            ) : (state.club.morale ?? 100) < 50 ? (
                              <span className="text-rose-400 font-medium">
                                {t('Blocked: Team morale too low.', 'Moral zu niedrig.')}
                              </span>
                            ) : state.budget + creditLimit < superstarCost ? (
                              <span className="text-rose-400 font-medium">
                                {t('Blocked: Insufficient funds.', 'Zu wenig Budget.')}
                              </span>
                            ) : (
                              t(
                                'Bypasses rating caps. Guaranteed +3 OVR and +5,000 Fans immediately.',
                                'Garantiert sofort +3 GES & +5.000 Fans.'
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-2.5 py-1.5 rounded-xl bg-[#181924] border border-white/[0.06] text-right shrink-0 tabular-nums">
                        <span className="font-mono font-semibold text-amber-400 text-xs">
                          -{formatMoney(superstarCost)}
                        </span>
                      </div>
                    </button>
                  );
                })()}

              {/* Card 4: Sign Veteran Ringer (Tiers 3, 4, 5, 6 only) */}
              {(state.club.tier || 1) >= 3 &&
                (() => {
                  const ringerFee = actionCosts.bidVeteranRinger || Math.round(actionCosts.bidReg * 0.4);
                  const isRingerSigned = Boolean(state.veteranRingerSignedThisSeason);
                  const isBlocked =
                    isDebtVetoActive ||
                    isRingerSigned ||
                    currentSquadSize >= maxSquadSize ||
                    state.budget + creditLimit < ringerFee;

                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSignVeteranRinger?.();
                      }}
                      disabled={isBlocked}
                      className="w-full bg-[#10121a] hover:bg-[#181924] p-3.5 sm:p-4 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] text-left transition-colors cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-amber-400 text-sm shrink-0">
                          <i className="fas fa-medal" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-xs sm:text-sm truncate">
                              {t('Sign Veteran Ringer', 'Altstar verpflichten')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-amber-400 uppercase">
                              T3–T6 All-In
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.03] border border-white/[0.06] text-zinc-400 tabular-nums">
                              {isRingerSigned ? '1 / 1 slot' : '0 / 1 slot'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 leading-snug truncate mt-0.5">
                            {isRingerSigned ? (
                              <span className="text-amber-400 font-medium">
                                {t(
                                  `Active: ${state.veteranRingerName || 'Veteran Star'} (+${
                                    state.veteranRingerOvrGain || 4
                                  } OVR). Retires at season end.`,
                                  `Aktiv: ${state.veteranRingerName || 'Altstar'} (+${
                                    state.veteranRingerOvrGain || 4
                                  } GES). Hört nach Saison auf.`
                                )}
                              </span>
                            ) : isDebtVetoActive ? (
                              <span className="text-amber-400 font-medium">
                                {t('Board Veto: Locked under debt restructuring.', 'Vorstands-Veto.')}
                              </span>
                            ) : currentSquadSize >= maxSquadSize ? (
                              <span className="text-rose-400 font-medium">
                                {t('Blocked: Max squad size (22).', 'Kader voll (22).')}
                              </span>
                            ) : state.budget + creditLimit < ringerFee ? (
                              <span className="text-rose-400 font-medium">
                                {t('Blocked: Insufficient funds.', 'Zu wenig Budget.')}
                              </span>
                            ) : (
                              t(
                                'Massive +3 to +5 OVR immediate boost. Exorbitant wages & 1-season retirement. Promote or face crisis!',
                                'Sofort +3 bis +5 GES! Astronomisches Gehalt & Karriereende nach Saison. Aufstieg oder Krise!'
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-2.5 py-1.5 rounded-xl bg-[#181924] border border-white/[0.06] text-right shrink-0 tabular-nums">
                        <span className="font-mono font-semibold text-amber-400 text-xs">
                          -{formatMoney(ringerFee)}
                        </span>
                      </div>
                    </button>
                  );
                })()}
            </div>
          )}

          {/* SECTION 2: LOANS & OUTGOINGS */}
          {(activeCategory === 'all' || activeCategory === 'loans_sales') && (
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {t('LOANS & OUTGOINGS', 'LEIHEN & ABGÄNGE')}
              </div>

              {/* 2-Column Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Loan In Card */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoanPlayer();
                  }}
                  disabled={(state.loansThisSeason || 0) >= 2 || currentSquadSize >= maxSquadSize}
                  className="bg-[#10121a] hover:bg-[#181924] p-4 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] text-left transition-colors cursor-pointer flex flex-col justify-between gap-3 disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-sky-400 text-xs">
                        <i className="fas fa-handshake" />
                      </div>
                      <span className="font-semibold text-white text-sm">{t('Loan In', 'Spieler leihen')}</span>
                    </div>
                    <span className="text-sky-400 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                      Free
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {t(
                      'Temporary signing (-1 to +2 OVR impact). Expires at season end.',
                      'Kurzfristige Verstärkung (-1 bis +2 GES). Endet nach einer Saison.'
                    )}
                  </p>

                  <div className="text-[11px] text-zinc-500 font-mono tabular-nums">
                    {state.loansThisSeason || 0} / 2 loans used
                  </div>
                </button>

                {/* Sell Player Card */}
                <div className="bg-[#10121a] p-4 rounded-2xl border border-white/[0.04] text-left flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-emerald-400 text-xs">
                        <i className="fas fa-arrow-trend-up" />
                      </div>
                      <span className="font-semibold text-white text-sm">{t('Sell Player', 'Spieler verkaufen')}</span>
                    </div>
                    <span className="text-emerald-400 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                      +Cash
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {t(
                      'Liquidate surplus talent to reduce squad wage bill and inject capital.',
                      'Überflüssige Spieler abgeben, Gehaltsetat senken und Erlöse erzielen.'
                    )}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {(() => {
                      const ovrRatio = (state.club.baseOvr || 60) / 75;
                      const benchSellValue = Math.round(
                        getLeagueScaledVal(state.club.tier, 125000, state.club.country) *
                          Math.max(0.5, Math.pow(ovrRatio, 2))
                      );
                      const starterSellValue = Math.round(
                        getLeagueScaledVal(state.club.tier, 350000, state.club.country) *
                          Math.max(0.5, Math.pow(ovrRatio, 2.5))
                      );
                      return (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSellBench();
                            }}
                            disabled={isSellDisabled}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-[#181924] hover:bg-white/[0.08] text-xs font-medium text-zinc-200 border border-white/[0.06] transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center truncate cursor-pointer tabular-nums"
                            title="Sell Bench / Reserve Player"
                          >
                            Bench +{formatMoney(benchSellValue)} {sellReason}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSellStarter();
                            }}
                            disabled={isSellDisabled}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-[#181924] hover:bg-emerald-500/15 text-xs font-medium text-emerald-400 border border-white/[0.06] transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-center truncate cursor-pointer tabular-nums"
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
                className="w-full bg-[#10121a] hover:bg-[#181924] p-3.5 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] text-left transition-colors flex items-center justify-between gap-3 disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-sky-400 text-xs shrink-0">
                    <i className="fas fa-file-contract" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {t('Mutual Contract Termination', 'Einvernehmliche Vertragsauflösung')}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {t(
                        'Release contract by mutual agreement with €0 severance.',
                        'Vertrag ohne Abfindung einvernehmlich auflösen.'
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 uppercase bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-lg shrink-0 tabular-nums">
                  {t('€0 Severance', '0 € Abfindung')}
                </span>
              </button>
            </div>
          )}

          {/* SECTION 3: YOUTH ACADEMY */}
          {(activeCategory === 'all' || activeCategory === 'academy') && (
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                {t('YOUTH ACADEMY', 'JUGENDAKADEMIE')}
              </div>

              {/* Youth Academy Action Card */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenYouth) onOpenYouth();
                }}
                className="w-full bg-[#10121a] hover:bg-[#181924] p-3.5 sm:p-4 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] text-left transition-colors flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#181924] border border-white/[0.06] flex items-center justify-center text-emerald-400 text-sm shrink-0">
                    <i className="fas fa-seedling" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-white truncate flex items-center gap-2">
                      <span>{t('Youth Academy & Incubator', 'Nachwuchsakademie & Talentschmiede')}</span>
                      {academyProspects.some((p) => (p.timer || 0) <= 0 && !p.isLoanedOut) && (
                        <span className="text-[10px] font-medium text-amber-300 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {t('Graduate Ready', 'Graduierung bereit')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {t(
                        'Scout talent, review incubator prospects, Pull to Squad, or graduate mature players.',
                        'Talente scouten, U19-Kader verwalten und Nachwuchsspieler hochziehen.'
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-emerald-400 bg-[#181924] border border-white/[0.06] px-2.5 py-1 rounded-xl tabular-nums">
                    {academyProspects.length}{' '}
                    {academyProspects.length === 1 ? t('Prospect', 'Talent') : t('Prospects', 'Talente')}
                  </span>
                  <i className="fas fa-chevron-right text-xs text-zinc-500 group-hover:text-white transition-colors" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.04] bg-[#10121a] shrink-0">
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-full py-2.5 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition-colors active:scale-[0.99] border border-white/[0.06] cursor-pointer"
          >
            {t('Close Window', 'Fenster schließen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
