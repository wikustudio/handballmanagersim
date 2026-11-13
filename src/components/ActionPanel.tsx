import React, { useState } from 'react';
import { GameState, getAcademySlotLimit } from '../types';
import { useGameStore } from '../store/useGameStore';
import { formatMoney, formatNum, getLeagueScaledVal, getPinnacleArenaCapacity, getCountryMult, getCurrencyForCountry, getAcademyUpgradeCost, getMedicalUpgradeCost, getDynamicSponsorPitchTerms } from '../data/gameConstants';
import { t } from '../data/translations';
import { LoanModal } from './LoanModal';
import { MarketingPRModal } from './MarketingPRModal';
import { IPOModal } from './IPOModal';
import { SponsorModal } from './SponsorModal';
import { getBaseLoanPrincipal } from '../utils/loanManager';

interface ActionPanelProps {
  onShowTransfers?: () => void;
  onShowYouth?: () => void;
  onTeamBonding?: () => void;
  onShowLoan?: () => void;
  onShowMarketing?: () => void;
  onShowIPO?: () => void;
  onShowSponsors?: () => void;
  state: GameState;
  lang: 'en' | 'de' | 'es';
  onSimulate: () => void;
  onScoutPlayer?: () => void;
  onBuyPlayer?: () => void;
  onUpgradeAcademy?: () => void;
  onUpgradeMedical?: () => void;
  onShowStadium?: (val: boolean) => void;
  onShowArenaOverview?: () => void;
  onShowNewBuild?: () => void;
  onShowImpact?: () => void;
  onOpenPhilosophy?: () => void;
  onOpenJobMarket?: () => void;
  onOpenSkills?: () => void;
  onRetire?: () => void;
  onOpenRoadmap?: () => void;
  isFirstHalf?: boolean;
  onOpenInfo?: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ 
  state, 
  lang, 
  onSimulate, 
  onShowStadium, 
  onShowArenaOverview, 
  onShowNewBuild,
  onShowImpact, 
  onOpenPhilosophy, 
  onOpenJobMarket, 
  onOpenSkills, 
  onOpenRoadmap, 
  onRetire, 
  onShowTransfers, 
  onShowYouth, 
  onTeamBonding, 
  onShowLoan,
  onShowMarketing,
  onShowIPO,
  onShowSponsors,
  onUpgradeAcademy, 
  onUpgradeMedical, 
  isFirstHalf = true, 
  onOpenInfo
}) => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [showIPOModal, setShowIPOModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [selectedSponsorDeal, setSelectedSponsorDeal] = useState<0 | 1 | 2>(0);
  const stateStore = useGameStore();
  const tr = (en: string, _de?: string, _es?: string) => en;
  const accordionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const handleToggleAccordion = (section: string) => {
    const isOpening = activeAccordion !== section;
    setActiveAccordion(isOpening ? section : null);

    if (isOpening && typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = accordionRefs.current[section];
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const isMobile = window.innerWidth < 1024;
          const headerOffset = isMobile ? 76 : 88;
          if (isMobile || rect.top < headerOffset || rect.bottom > window.innerHeight) {
            const targetTop = Math.max(0, window.scrollY + rect.top - headerOffset);
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
          }
        });
      });
    }
  };

  // Preserve scroll position when loan/marketing/ipo/sponsor modals open and close
  const scrollPositionRef = React.useRef<number>(0);
  const modalOpen = Boolean(showLoanModal || showMarketingModal || showIPOModal || showSponsorModal);
  const prevModalOpenRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (!prevModalOpenRef.current && modalOpen) {
      scrollPositionRef.current = window.scrollY;
    } else if (prevModalOpenRef.current && !modalOpen) {
      const savedY = scrollPositionRef.current;
      if (savedY > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, behavior: 'instant' });
        });
      }
    }
    prevModalOpenRef.current = modalOpen;
  }, [modalOpen]);

  const currentCommercial = (stateStore.sponsorsPitchedThisSeason || 0);
  const limitCommercial = 3;
  
  const currentTransfers = stateStore.regTransfersThisSeason || 0;

  const currentInfra = stateStore.infraActionsThisSeason || 0;
  const maxInfra = 2;

  // Academy & Medical Facility Levels & Costs (Steeply Exponential Scaling)
  const academyLevel = stateStore.club.academyLevel || 1;
  const medicalLevel = stateStore.club.medicalLevel || 1;
  const isScoutDirector = stateStore.directorArchetype === 'Scout / Youth Developer';
  const academyUpgradeCost = getAcademyUpgradeCost(academyLevel, stateStore.club.tier, stateStore.club.country, isScoutDirector);
  const medicalUpgradeCost = getMedicalUpgradeCost(medicalLevel, stateStore.club.tier, stateStore.club.country);
  const canUpgradeAcademy = currentInfra < maxInfra && academyLevel < 5 && (stateStore.academyUpgradedThisSeason || 0) < 1;
  const canUpgradeMedical = currentInfra < maxInfra && medicalLevel < 5 && (stateStore.medicalUpgradedThisSeason || 0) < 1;

  const sponsorTerms = getDynamicSponsorPitchTerms(stateStore);
  const standardPayout = sponsorTerms.standardPayout;
  const megaPayout = sponsorTerms.megaPayout;
  const performanceUpfront = sponsorTerms.performanceUpfront;
  const performanceBonus = sponsorTerms.performanceBonus;

  return (
    <div className="bg-[#12141c] border border-white/[0.06] shadow-[0_16px_40px_rgba(0,0,0,0.45)] rounded-[24px] p-4 sm:p-5 flex flex-col gap-3 w-full [overflow-anchor:none]">
      {/* Season Preparations Title & Description (Matches Reference) */}
      <div className="flex flex-col gap-1.5 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {tr('Season Preparations', 'Saisonvorbereitung')}
          </h2>
          {onOpenInfo && (
            <button
              onClick={onOpenInfo}
              className="w-5 h-5 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 hover:text-sky-300 flex items-center justify-center text-[10px] transition cursor-pointer"
              title={tr('Season Preparation Info', 'Infos zur Saisonvorbereitung')}
              aria-label="Season Preparation Info"
            >
              <i className="fas fa-info" />
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Prepare your squad &amp; commercial deals. Pitch sponsors for bonus revenue, buy/sell players, or simulate when ready.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. COMMERCIAL & SPONSORSHIPS MODULE                                      */}
      {/* ========================================================================= */}
      <div
        ref={(el) => { accordionRefs.current['commercial'] = el; }}
        className={`rounded-2xl border transition-all duration-200 overflow-hidden scroll-mt-20 ${
          activeAccordion === 'commercial'
            ? 'border-white/[0.1] bg-[#161922]'
            : 'border-white/[0.05] bg-[#161922]/90 hover:border-white/[0.1] hover:bg-[#191d27]'
        }`}
      >
        <button
          type="button"
          onClick={() => handleToggleAccordion('commercial')}
          className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <i className="fas fa-handshake text-purple-400 text-sm shrink-0" />
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white">
              {tr('Commercial & Sponsorships', 'Sponsoring & Finanzen')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <i className={`fas fa-chevron-${activeAccordion === 'commercial' ? 'up' : 'down'} text-xs text-zinc-400`} />
          </div>
        </button>

        {activeAccordion === 'commercial' && (
          <div className="p-2.5 sm:p-3 border-t border-white/[0.05] flex flex-col gap-2 bg-[#101219]">
            {/* Sponsorship Deals */}
            {(() => {
              const curDeals = stateStore.seasonSponsorDealsYear === stateStore.year ? stateStore.seasonSponsorDeals : undefined;
              const signedCount =
                (curDeals?.[0]?.status === 'signed' ? 1 : 0) +
                (curDeals?.[1]?.status === 'signed' ? 1 : 0) +
                (curDeals?.[2]?.status === 'signed' || stateStore.activePerformanceDeal ? 1 : 0);
              const maxAvailablePayout =
                curDeals?.[1]?.status !== 'failed'
                  ? megaPayout
                  : curDeals?.[2]?.status !== 'failed'
                  ? performanceUpfront + performanceBonus
                  : standardPayout;

              return (
                <button
                  type="button"
                  onClick={() => {
                    if (onShowSponsors) {
                      onShowSponsors();
                    } else {
                      setSelectedSponsorDeal(0);
                      setShowSponsorModal(true);
                    }
                  }}
                  className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-medium text-white tracking-tight">
                      {tr('Sponsorship Deals', 'Sponsorenverträge')}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate">
                      {tr('Standard, Megadeal & Performance (1–3 yrs)', 'Standard-, Megadeal- & Leistungsverträge')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {signedCount > 0 ? (
                      <span className="text-zinc-300 font-mono text-[10px] uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1 tabular-nums">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {signedCount}/3 {tr('Active', 'Aktiv')}
                      </span>
                    ) : currentCommercial >= limitCommercial ? (
                      <span className="text-zinc-400 font-mono text-[10px] uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] tabular-nums">
                        {currentCommercial}/{limitCommercial} {tr('Pitched', 'Verhandelt')}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-mono font-medium tabular-nums text-xs">
                        +{formatMoney(maxAvailablePayout)}
                      </span>
                    )}
                    <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </button>
              );
            })()}

            {/* Go Public (IPO) / Stock Market */}
            {(() => {
              const isPublic = Boolean(stateStore?.club?.isPublic || state?.club?.isPublic || (stateStore as any)?.isPublic || (state as any)?.isPublic);
              return (
                <button
                  type="button"
                  onClick={() => { if (onShowIPO) onShowIPO(); else setShowIPOModal(true); }}
                  className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-medium text-white tracking-tight">
                      {isPublic ? tr('Stock Market & Shares', 'Börsenmarkt') : tr('Go Public (IPO)', 'Börsengang (IPO)')}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate">
                      {isPublic
                        ? tr('Share price, valuation & dividends', 'Aktienkurs & Dividenden')
                        : tr('Issue equity for upfront capital', 'Aktienemission für Sofortkapital')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-zinc-300 font-mono text-[10px] uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                      {isPublic ? tr('Listed', 'Gelisted') : tr('Open', 'Offen')}
                    </span>
                    <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </button>
              );
            })()}

            {/* Marketing & PR */}
            <button
              type="button"
              onClick={() => { if (onShowMarketing) onShowMarketing(); else setShowMarketingModal(true); }}
              className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">
                  {tr('Marketing & PR', 'Marketing & PR')}
                </span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {tr('Expand supporter base & brand reach', 'Fanpotenzial & Reichweite steigern')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-300 font-mono text-[10px] uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${(stateStore.brandCampaignsThisSeason || 0) >= 1 ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                  {(stateStore.brandCampaignsThisSeason || 0) >= 1 ? tr('Active', 'Aktiv') : tr('Open', 'Offen')}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>

            {/* Commercial Bank Loan */}
            <button
              type="button"
              onClick={() => { if (onShowLoan) onShowLoan(); else setShowLoanModal(true); }}
              className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">
                  {tr('Commercial Bank Loan', 'Gewerblicher Bankkredit')}
                </span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {tr('10–25yr institutional credit facility', '10–25J institutioneller Kredit')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-300 font-mono text-[10px] uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${state.activeLoan ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                  {state.activeLoan ? tr('Active', 'Aktiv') : tr('Open', 'Offen')}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SQUAD & TRANSFERS MODULE                                               */}
      {/* ========================================================================= */}
      <div
        ref={(el) => { accordionRefs.current['squad'] = el; }}
        className={`rounded-2xl border transition-all duration-200 overflow-hidden scroll-mt-20 ${
          activeAccordion === 'squad'
            ? 'border-white/[0.1] bg-[#161922]'
            : 'border-white/[0.05] bg-[#161922]/90 hover:border-white/[0.1] hover:bg-[#191d27]'
        }`}
      >
        <button
          type="button"
          onClick={() => handleToggleAccordion('squad')}
          className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <i className="fas fa-users text-emerald-400 text-sm shrink-0" />
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white">
              {tr('Squad & Transfers', 'Kader & Transfers')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <i className={`fas fa-chevron-${activeAccordion === 'squad' ? 'up' : 'down'} text-xs text-zinc-400`} />
          </div>
        </button>

        {activeAccordion === 'squad' && (
          <div className="p-2.5 sm:p-3 border-t border-white/[0.05] flex flex-col gap-2 bg-[#101219]">
            {/* Compact Roster Activity Strip */}
            <div className="bg-[#121520]/70 border border-white/[0.04] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 flex-wrap text-[11px] text-zinc-400">
              <div className="flex items-center gap-2 flex-wrap tabular-nums font-mono">
                <span className="text-zinc-200">+{stateStore.youthPipeline?.length || 0} Youth</span>
                <span className="text-zinc-600">·</span>
                <span>+{currentTransfers} In</span>
                <span className="text-zinc-600">·</span>
                <span>-{stateStore.squadSalesThisSeason || 0} Sold</span>
                <span className="text-zinc-600">·</span>
                <span>+{stateStore.loansThisSeason || 0} Loans</span>
              </div>
              {(stateStore.youthDevQueue || 0) > 0 && (
                <span className="text-emerald-300 font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] tabular-nums">
                  +{stateStore.youthDevQueue} OVR Next Yr
                </span>
              )}
            </div>

            {/* Transfer Market */}
            <button
              onClick={() => { if (onShowTransfers) onShowTransfers(); }}
              className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Transfer Market', 'Transfermarkt')}</span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {tr('Signings, loans & player sales', 'Neuzugänge, Leihen & Verkäufe')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-300 font-mono text-[10px] uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {tr('Open', 'Offen')}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>

            {/* Youth Academy */}
            {(() => {
              const hasGraduatesReady = Boolean(stateStore.youthPipeline?.some(p => p.timer <= 0 && !p.isLoanedOut));
              const u19Ready = stateStore.youthChampionshipSimulatedYear !== stateStore.year && (stateStore.youthPipeline?.length || 0) >= 6;
              return (
                <button
                  onClick={() => { if (onShowYouth) onShowYouth(); }}
                  className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-medium text-white tracking-tight">{tr('Youth Academy', 'Jugendakademie')}</span>
                    <span className="text-[11px] text-zinc-500 truncate">
                      {tr('Scouting pipeline & U19 championship', 'Talent-Pipeline & U19-Meisterschaft')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasGraduatesReady && (
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        Ready
                      </span>
                    )}
                    {u19Ready && (
                      <span className="text-[10px] font-mono text-zinc-300 bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 rounded">
                        U19
                      </span>
                    )}
                    <span className="text-zinc-400 font-mono tabular-nums text-[11px]">
                      {(stateStore.youthPipeline?.filter(p => !p.isLoanedOut)?.length || 0)}/{getAcademySlotLimit(academyLevel)}
                    </span>
                    <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </button>
              );
            })()}

            {/* Team Retreat */}
            <button
              onClick={() => { if (onTeamBonding) onTeamBonding(); }}
              disabled={(stateStore.teamBondingThisSeason || 0) >= 1}
              className={`bg-[#121520] border border-white/[0.05] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition group ${
                (stateStore.teamBondingThisSeason || 0) >= 1
                  ? 'opacity-45 cursor-not-allowed'
                  : 'hover:bg-white/[0.04] hover:border-white/[0.12] cursor-pointer active:scale-[0.99]'
              }`}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Team Retreat', 'Team-Trainingslager')}</span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {tr('Boost squad morale & locker room harmony', 'Kabinenstimmung & Moral stärken')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-400 font-mono text-[10px] uppercase">
                  {(stateStore.teamBondingThisSeason || 0) >= 1 ? tr('1/1 Used', '1/1 Genutzt') : tr('Open', 'Offen')}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. INFRASTRUCTURE & ARENA MODULE                                          */}
      {/* ========================================================================= */}
      <div
        ref={(el) => { accordionRefs.current['infra'] = el; }}
        className={`rounded-2xl border transition-all duration-200 overflow-hidden scroll-mt-20 ${
          activeAccordion === 'infra'
            ? 'border-white/[0.1] bg-[#161922]'
            : 'border-white/[0.05] bg-[#161922]/90 hover:border-white/[0.1] hover:bg-[#191d27]'
        }`}
      >
        <button
          type="button"
          onClick={() => handleToggleAccordion('infra')}
          className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <i className="fas fa-building text-sky-400 text-sm shrink-0" />
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white">
              {tr('Arena & Infrastructure', 'Infrastruktur & Arena')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <i className={`fas fa-chevron-${activeAccordion === 'infra' ? 'up' : 'down'} text-xs text-zinc-400`} />
          </div>
        </button>

        {activeAccordion === 'infra' && (
          <div className="p-2.5 sm:p-3 border-t border-white/[0.05] flex flex-col gap-2 bg-[#101219]">
            {/* Compact Facility Status Strip */}
            <div className="bg-[#121520]/70 border border-white/[0.04] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 flex-wrap text-[11px] font-mono text-zinc-400 tabular-nums">
              <span>{formatNum(stateStore.club.stadium || 2000)} {tr('Seats', 'Plätze')}</span>
              <span className="text-zinc-600">·</span>
              <span>{tr('Academy', 'Akademie')} Lvl {academyLevel}</span>
              <span className="text-zinc-600">·</span>
              <span>{tr('Medical', 'Medizin')} Lvl {medicalLevel}</span>
            </div>

            {/* Arena Expansion */}
            {(() => {
              const pinnacleCap = getPinnacleArenaCapacity(stateStore.club.country);
              const isMaxArena = (stateStore.club.stadium || 0) >= pinnacleCap;
              return (
                <button
                  onClick={() => { if (!isMaxArena && onShowStadium) onShowStadium(true); }}
                  disabled={isMaxArena || currentInfra >= maxInfra || (stateStore.stadiumExpandedThisSeason || 0) >= 1}
                  className="bg-[#121520] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#121520] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-medium text-white tracking-tight">{tr('Arena Expansion', 'Arena-Ausbau')}</span>
                    <span className="text-[11px] text-zinc-500 truncate">
                      {isMaxArena
                        ? tr(`Max capacity (${formatNum(pinnacleCap)}) reached`, `Max. Kapazität (${formatNum(pinnacleCap)})`)
                        : tr('Expand seating tiers & matchday revenue', 'Plätze & Ticketeinnahmen steigern')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-zinc-300 font-mono tabular-nums text-[11px]">
                      {isMaxArena ? 'MAX' : `+500 ${tr('Seats', 'Plätze')}`}
                    </span>
                    <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </button>
              );
            })()}

            {/* Arena Project */}
            {(() => {
              const pinnacleCap = getPinnacleArenaCapacity(stateStore.club.country);
              const isMaxArena = (stateStore.club.stadium || 0) >= pinnacleCap;
              return (
                <button
                  onClick={() => { if (!isMaxArena && onShowNewBuild) onShowNewBuild(); }}
                  disabled={isMaxArena || currentInfra >= maxInfra || (stateStore.stadiumExpandedThisSeason || 0) >= 1}
                  className="bg-[#121520] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#121520] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-medium text-white tracking-tight">{tr('Arena Project', 'Arena-Projekt')}</span>
                    <span className="text-[11px] text-zinc-500 truncate">
                      {isMaxArena
                        ? tr('Pinnacle complex active', 'Großarena aktiv')
                        : tr(`New complex up to ${formatNum(pinnacleCap)} seats`, `Neubau bis ${formatNum(pinnacleCap)} Plätze`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-zinc-300 font-mono text-[10px] uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
                      {isMaxArena ? 'Active' : 'Complex'}
                    </span>
                    <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </button>
              );
            })()}

            {/* Upgrade Academy */}
            <button
              onClick={() => { if (onUpgradeAcademy) onUpgradeAcademy(); }}
              disabled={!canUpgradeAcademy}
              className="bg-[#121520] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#121520] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Upgrade Academy', 'Jugendakademie ausbauen')}</span>
                <span className="text-[11px] text-zinc-500 truncate tabular-nums">
                  {academyLevel < 5
                    ? `${formatMoney(academyUpgradeCost)} · ${
                        academyLevel + 1 === 2
                          ? '2 scouts/yr'
                          : academyLevel + 1 === 3
                          ? 'Anti-Poaching Shield'
                          : academyLevel + 1 === 4
                          ? 'Foreign Imports'
                          : 'Dynasty Immunity'
                      }`
                    : 'Max Level · Global Dynasty'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-300 font-mono tabular-nums text-[11px]">
                  Lvl {academyLevel}{academyLevel < 5 ? `→${academyLevel + 1}` : ''}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>

            {/* Upgrade Medical */}
            <button
              onClick={() => { if (onUpgradeMedical) onUpgradeMedical(); }}
              disabled={!canUpgradeMedical}
              className="bg-[#121520] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#121520] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Upgrade Medical', 'Medizinabteilung ausbauen')}</span>
                <span className="text-[11px] text-zinc-500 truncate tabular-nums">
                  {medicalLevel < 5
                    ? `${formatMoney(medicalUpgradeCost)} · ${
                        medicalLevel + 1 === 2
                          ? 'Free Rehab'
                          : medicalLevel + 1 === 3
                          ? 'Decay Immunity'
                          : medicalLevel + 1 === 4
                          ? 'Vet Retention'
                          : '+1.0 Match OVR'
                      }`
                    : 'Max Level · Peak Performance'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-300 font-mono tabular-nums text-[11px]">
                  Lvl {medicalLevel}{medicalLevel < 5 ? `→${medicalLevel + 1}` : ''}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. BOARD & MANAGER MODULE                                                 */}
      {/* ========================================================================= */}
      <div
        ref={(el) => { accordionRefs.current['manager'] = el; }}
        className={`rounded-2xl border transition-all duration-200 overflow-hidden scroll-mt-20 ${
          activeAccordion === 'manager'
            ? 'border-white/[0.1] bg-[#161922]'
            : 'border-white/[0.05] bg-[#161922]/90 hover:border-white/[0.1] hover:bg-[#191d27]'
        }`}
      >
        <button
          type="button"
          onClick={() => handleToggleAccordion('manager')}
          className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <i className="fas fa-user-tie text-amber-400 text-sm shrink-0" />
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white">
              {tr('Board & Manager', 'Vorstand & Trainer')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <i className={`fas fa-chevron-${activeAccordion === 'manager' ? 'up' : 'down'} text-xs text-zinc-400`} />
          </div>
        </button>

        {activeAccordion === 'manager' && (
          <div className="p-2.5 sm:p-3 border-t border-white/[0.05] flex flex-col gap-2 bg-[#101219]">
            {/* Club Impact */}
            <button
              onClick={() => { if (onShowImpact) onShowImpact(); }}
              className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Club Impact', 'Vereinseinfluss')}</span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {tr('Board trust, fan sentiment & governance', 'Vorstandsvertrauen & Fanstimmung')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-300 font-mono tabular-nums text-[11px]">{state.clubImpactScore ?? 50}/100</span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>

            {/* Club Roadmap */}
            <button
              onClick={() => { if (onOpenRoadmap) onOpenRoadmap(); else if (onShowImpact) onShowImpact(); }}
              className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Club Roadmap', 'Vereins-Roadmap')}</span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {state.club.tier === 1 && (state.trophyDrought || 0) > 4
                    ? `${state.trophyDrought}-Year Trophy Drought`
                    : tr('Multi-year milestones & MP rewards', 'Mehrjährige Ziele & MP-Prämien')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/[0.03] text-zinc-300 border border-white/[0.06]">
                  {state.boardRoadmap ? `${state.boardRoadmap.horizonYears}Y` : 'View'}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>

            {/* Tactics & Rebuild Directives */}
            <button
              onClick={() => { if (onOpenPhilosophy) onOpenPhilosophy(); }}
              className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Tactics & Rebuild Directives', 'Taktik & Vereins-Rebuild')}</span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {tr('System philosophy & squad cycle', 'Taktisches System & Kaderzyklus')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-300 text-[11px] font-medium">{state.tactic}</span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>

            {/* Job Market */}
            <button
              onClick={() => { if (onOpenJobMarket) onOpenJobMarket(); }}
              className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Job Market', 'Trainermarkt')}</span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {tr('Club vacancies & career moves', 'Offene Trainerstellen')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-300 font-mono text-[10px] uppercase bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {tr('Open', 'Offen')}
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>

            {/* Manager Points */}
            <button
              onClick={() => { if (onOpenSkills) onOpenSkills(); }}
              className="bg-[#121520] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition cursor-pointer active:scale-[0.99] group"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium text-white tracking-tight">{tr('Manager Points', 'Manager-Punkte')}</span>
                <span className="text-[11px] text-zinc-500 truncate">
                  {tr('Unlock tactical & scouting perks', 'Fähigkeiten & Perks freischalten')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-zinc-200 font-mono tabular-nums text-[11px] bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded">
                  {state.skillPoints || 0} MP
                </span>
                <i className="fas fa-chevron-right text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </button>

            {/* Retire immediately */}
            <button
              onClick={() => { if (onRetire) onRetire(); }}
              className="bg-white/[0.015] hover:bg-rose-500/[0.08] px-3.5 py-2.5 rounded-xl border border-white/[0.04] hover:border-rose-500/20 text-left transition cursor-pointer flex justify-between items-center mt-0.5 active:scale-[0.99] group"
            >
              <span className="text-xs font-medium text-zinc-400 group-hover:text-rose-300 transition-colors">
                {tr('Retire from Management', 'Karriere beenden')}
              </span>
              <i className="fas fa-power-off text-zinc-600 group-hover:text-rose-400 text-xs transition-colors" />
            </button>
          </div>
        )}
      </div>

      {/* Commercial Bank Loan Modal */}
      {!onShowLoan && showLoanModal && (
        <LoanModal
          isOpen={showLoanModal}
          lang={lang}
          state={state}
          onClose={() => setShowLoanModal(false)}
        />
      )}

      {/* Marketing & PR Spin-the-Wheel Modal */}
      {!onShowMarketing && showMarketingModal && (
        <MarketingPRModal
          isOpen={showMarketingModal}
          lang={lang}
          state={state}
          onClose={() => setShowMarketingModal(false)}
        />
      )}

      {/* Stock Market / IPO Modal */}
      {!onShowIPO && showIPOModal && (
        <IPOModal
          isOpen={showIPOModal}
          lang={lang}
          state={state}
          onClose={() => setShowIPOModal(false)}
        />
      )}

      {/* Sponsorship Details & Brand Portfolio Modal */}
      {!onShowSponsors && showSponsorModal && (
        <SponsorModal
          isOpen={showSponsorModal}
          initialDealIndex={selectedSponsorDeal}
          lang={lang}
          onClose={() => setShowSponsorModal(false)}
        />
      )}
    </div>
  );
};
