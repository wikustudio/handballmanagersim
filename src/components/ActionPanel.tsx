import React, { useState } from 'react';
import { GameState, getAcademySlotLimit } from '../types';
import { useGameStore } from '../store/useGameStore';
import { formatMoney, formatNum, getLeagueScaledVal, getPinnacleArenaCapacity, getCountryMult, getCurrencyForCountry, getAcademyUpgradeCost, getMedicalUpgradeCost, getDynamicSponsorPitchTerms } from '../data/gameConstants';
import { t } from '../data/translations';
import { LoanModal } from './LoanModal';
import { MarketingPRModal } from './MarketingPRModal';
import { IPOModal } from './IPOModal';
import { getBaseLoanPrincipal } from '../utils/loanManager';

interface ActionPanelProps {
  onShowTransfers?: () => void;
  onShowYouth?: () => void;
  onTeamBonding?: () => void;
  onShowLoan?: () => void;
  onShowMarketing?: () => void;
  onShowIPO?: () => void;
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
  onUpgradeAcademy, 
  onUpgradeMedical, 
  isFirstHalf = true, 
  onOpenInfo
}) => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('commercial');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [showIPOModal, setShowIPOModal] = useState(false);
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

  // Preserve scroll position when loan/marketing/ipo modals open and close
  const scrollPositionRef = React.useRef<number>(0);
  const modalOpen = Boolean(showLoanModal || showMarketingModal || showIPOModal);
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

  const hasSalesmaster = (stateStore.managerSkills || []).includes('salesmaster') || (stateStore.managerSkills || []).includes('sponsor_boost');
  const sponsorTerms = getDynamicSponsorPitchTerms(stateStore);
  const standardPayout = sponsorTerms.standardPayout;
  const megaPayout = sponsorTerms.megaPayout;
  const performanceUpfront = sponsorTerms.performanceUpfront;
  const performanceBonus = sponsorTerms.performanceBonus;

  return (
    <div className="bg-[#10121a]/90 border border-white/[0.04] backdrop-blur-md rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 w-full [overflow-anchor:none]">
      {/* Box Header matching user mockup */}
      <div className="flex flex-col gap-1 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            {tr('Season Preparations', 'Saisonvorbereitung')}
          </h2>
          {onOpenInfo && (
            <button
              onClick={onOpenInfo}
              className="w-5 h-5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
              title={tr('Season Preparation Info', 'Infos zur Saisonvorbereitung')}
              aria-label="Season Preparation Info"
            >
              <i className="fas fa-info" />
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400 font-normal leading-relaxed">
          {tr(
            'Prepare your squad & commercial deals. Pitch sponsors for bonus revenue, expand facilities, and manage transfers.',
            'Bereite deinen Kader & Sponsoring-Deals vor. Verhandle lukrative Sponsoren, baue Einrichtungen aus und manage Transfers.'
          )}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. COMMERCIAL & SPONSORSHIPS MODULE                                      */}
      {/* ========================================================================= */}
      <div
        ref={(el) => { accordionRefs.current['commercial'] = el; }}
        className={`rounded-2xl border transition-all duration-200 overflow-hidden scroll-mt-20 ${
        activeAccordion === 'commercial' 
          ? 'border-purple-500/30 bg-purple-500/[0.04]' 
          : 'border-white/[0.05] bg-purple-500/[0.02] hover:border-purple-500/30 hover:bg-purple-500/[0.05]'
      }`}>
        <button 
          type="button"
          onClick={() => handleToggleAccordion('commercial')}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeAccordion === 'commercial' ? 'bg-purple-400' : 'bg-purple-400/60'}`} />
            <i className="fas fa-handshake text-sm text-purple-400" />
            <span className={`text-xs sm:text-[13px] font-semibold tracking-wider uppercase ${activeAccordion === 'commercial' ? 'text-white' : 'text-zinc-200'}`}>
              {tr('Commercial & Sponsorships', 'Sponsoring & Finanzen')}
            </span>
          </div>
          <i className={`fas fa-chevron-${activeAccordion === 'commercial' ? 'up' : 'down'} text-xs ${activeAccordion === 'commercial' ? 'text-purple-400' : 'text-zinc-500'}`} />
        </button>
        
        {activeAccordion === 'commercial' && (
          <div className="p-3.5 sm:p-4 border-t border-white/[0.06] flex flex-col gap-2.5 bg-black/20">
            {/* Card 1: Commercial Limit */}
            <div className="bg-[#181924] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-zinc-400 tracking-wider uppercase">
                  {tr('Commercial Limit', 'Sponsoring-Kontingent')}
                </span>
                <span className="text-white font-medium tabular-nums">{currentCommercial} / {limitCommercial}</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-relaxed font-normal">
                {tr(
                  'You can negotiate up to 3 commercial sponsorship deals per season. Pitching megadeals carries higher risk with anchor corporate sponsors.',
                  'Du kannst bis zu 3 Sponsoring-Deals pro Saison abschließen. Megadeal-Pitches um Hauptsponsoren tragen ein höheres Verhandlungsrisiko.'
                )}
              </p>
            </div>

            {/* Commercial Negotiator Active Perk Showcase */}
            {hasSalesmaster && (
              <div className="bg-[#181924] border border-white/[0.06] border-l-2 border-l-amber-500 rounded-2xl p-3 sm:p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/[0.03] text-zinc-400 border border-white/[0.06] flex items-center justify-center text-xs shrink-0">
                  <i className="fas fa-briefcase" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {tr('Commercial Negotiator Active', 'Chef-Unterhändler Aktiv')}
                    </span>
                    <span className="text-[9px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Active Perk
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5 font-normal">
                    {tr(
                      `+10% sponsor deal payouts applied & ${sponsorTerms.megaSuccessPct}% Megadeal negotiation success rate.`,
                      `+10% höhere Sponsorengelder & ${sponsorTerms.megaSuccessPct}% Erfolgsquote bei Megadeals.`
                    )}
                  </p>
                </div>
              </div>
            )}
            
            {/* Card 2: Standard Deal */}
            {(() => {
              const isStandardSigned = Boolean(stateStore.seasonSponsorDealsYear === stateStore.year && stateStore.seasonSponsorDeals?.[0]?.status === 'signed');
              return (
                <button
                  onClick={() => stateStore.pitchSponsor(0)}
                  disabled={currentCommercial >= limitCommercial || isStandardSigned || sponsorTerms.standardBrand.name === 'Empty'}
                  className="bg-[#181924] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#181924] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-white tracking-tight">{tr('Standard Deal', 'Standard-Deal')}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${
                        sponsorTerms.standardBrand.name === 'Empty'
                          ? 'text-zinc-500 bg-white/[0.03] border border-white/[0.06]'
                          : 'text-zinc-300 bg-white/[0.04] border border-white/[0.07]'
                      }`}>
                        {sponsorTerms.standardBrand.logo ? `${sponsorTerms.standardBrand.logo} ` : ''}{sponsorTerms.standardBrand.name}
                      </span>
                      {isStandardSigned && (
                        <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          {tr('Signed', 'Aktiv')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-emerald-400 font-medium tabular-nums text-sm sm:text-base">+{formatMoney(standardPayout)}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                    {tr('100% Guaranteed regional/kit partner. Funds added immediately to treasury.', '100% Sicherer Ausrüster-/Regionalpartner. Sofortige Gutschrift.')}
                  </p>
                </button>
              );
            })()}

            {/* Card 3: Megadeal Pitch */}
            {(() => {
              const isMegaSigned = Boolean(stateStore.seasonSponsorDealsYear === stateStore.year && stateStore.seasonSponsorDeals?.[1]?.status === 'signed');
              return (
                <button
                  onClick={() => stateStore.pitchSponsor(1)}
                  disabled={currentCommercial >= limitCommercial || sponsorTerms.megaBrand.name === 'Empty' || isMegaSigned}
                  className="bg-[#181924] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#181924] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-white tracking-tight">{tr('Megadeal Pitch', 'Megadeal-Verhandlung')}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${
                        sponsorTerms.megaBrand.name === 'Empty'
                          ? 'text-zinc-500 bg-white/[0.03] border border-white/[0.06]'
                          : 'text-purple-300 bg-purple-500/10 border border-purple-500/20'
                      }`}>
                        {sponsorTerms.megaBrand.logo ? `${sponsorTerms.megaBrand.logo} ` : ''}{sponsorTerms.megaBrand.name}
                      </span>
                      {isMegaSigned && (
                        <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          {tr('Signed', 'Aktiv')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-emerald-400 font-medium tabular-nums text-sm sm:text-base">+{formatMoney(megaPayout)}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                    {tr(
                      `Anchor corporate negotiation. ${sponsorTerms.megaSuccessPct}% chance of success based on club prestige & reputation.`,
                      `Hauptsponsor-Verhandlung. ${sponsorTerms.megaSuccessPct}% Erfolgschance basierend auf Vereins-Renommee.`
                    )}
                  </p>
                </button>
              );
            })()}

            {/* Card 4: Performance Deal */}
            <button
              onClick={() => stateStore.pitchSponsor(2)}
              disabled={currentCommercial >= limitCommercial || Boolean(stateStore.activePerformanceDeal)}
              className="bg-[#181924] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#181924] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-white tracking-tight">{tr('Performance Deal', 'Leistungsvertrag')}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${
                    sponsorTerms.perfBrand.name === 'Empty'
                      ? 'text-zinc-500 bg-white/[0.03] border border-white/[0.06]'
                      : 'text-sky-300 bg-sky-500/10 border border-sky-500/20'
                  }`}>
                    {sponsorTerms.perfBrand.logo ? `${sponsorTerms.perfBrand.logo} ` : ''}{sponsorTerms.perfBrand.name}
                  </span>
                  {stateStore.activePerformanceDeal && (
                    <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      {tr('Active', 'Aktiv')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-emerald-400 font-medium tabular-nums text-sm sm:text-base">+{formatMoney(performanceUpfront)}</span>
                </div>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {stateStore.activePerformanceDeal
                  ? tr(
                      `Contract active. Finish Upper Half for +${formatMoney(performanceBonus)} end-of-season bonus.`,
                      `Vertrag aktiv. Obere Tabellenhälfte bringt +${formatMoney(performanceBonus)} Saisonprämie.`
                    )
                  : tr(
                      `Upfront signing fee + ${formatMoney(performanceBonus)} bonus if finishing in the Upper Half.`,
                      `Sofortige Unterschriftsprämie + ${formatMoney(performanceBonus)} Bonus bei oberer Tabellenhälfte.`
                    )}
              </p>
            </button>

            {/* Card 4.5: Go Public (IPO) / Stock Market */}
            {(() => {
              const isPublic = Boolean(stateStore?.club?.isPublic || state?.club?.isPublic || (stateStore as any)?.isPublic || (state as any)?.isPublic);
              return (
                <button
                  onClick={() => { if (onShowIPO) onShowIPO(); else setShowIPOModal(true); }}
                  className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99] w-full"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white tracking-tight">
                      {isPublic ? tr('Stock Market', 'Börsenmarkt') : tr('Go Public (IPO)', 'Börsengang (IPO)')}
                    </span>
                    <span className="text-zinc-300 font-medium text-xs uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full ${isPublic ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                      {isPublic ? tr('Active', 'Aktiv') : tr('Available', 'Verfügbar')}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                    {isPublic ? (
                      tr(
                        'Watch your stock price progress, but beware of shareholder dynamics and dividend obligations.',
                        'Beobachte die Entwicklung deines Aktienkurses, aber achte auf Aktionärsdynamiken und Dividenden.'
                      )
                    ) : (
                      tr(
                        'Issue 1,000,000 shares to raise upfront capital. Beware shareholder dividend traps!',
                        '1.000.000 Aktien emittieren für Sofortkapital. Achtung vor der Dividendenfalle!'
                      )
                    )}
                  </p>
                </button>
              );
            })()}

            {/* Card 5: Marketing & PR */}
            <button
              onClick={() => { if (onShowMarketing) onShowMarketing(); else setShowMarketingModal(true); }}
              className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99] w-full"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">
                  {tr('Marketing & PR', 'Marketing & PR')}
                </span>
                <span className="text-zinc-300 font-medium text-xs uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${(stateStore.brandCampaignsThisSeason || 0) >= 1 ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                  {(stateStore.brandCampaignsThisSeason || 0) >= 1 ? tr('Active', 'Aktiv') : tr('Available', 'Verfügbar')}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {tr(
                  "Launch promotional drives to expand your club's addressable supporter base and national brand awareness.",
                  'Marketing-Offensiven starten, um das Fanpotenzial und die nationale Markenbekanntheit zu vergrößern.'
                )}
              </p>
            </button>

            {/* Card 6: Commercial Bank Loan */}
            <button
              onClick={() => { if (onShowLoan) onShowLoan(); else setShowLoanModal(true); }}
              className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99] w-full"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">
                  {tr('Commercial Bank Loan', 'Gewerblicher Bankkredit')}
                </span>
                <span className="text-zinc-300 font-medium text-xs uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${state.activeLoan ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                  {state.activeLoan ? tr('Active', 'Aktiv') : tr('Available', 'Verfügbar')}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {tr(
                  'Contract an institutional bank loan over 10, 15, or 25 years. Immediate liquidity to overcome debt crises and prevent 3-year insolvency.',
                  'Institutionellen Kredit über 10, 15 oder 25 Jahre aufnehmen. Sofortige Liquidität zur Abwendung der Insolvenz.'
                )}
              </p>
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
          ? 'border-emerald-500/30 bg-emerald-500/[0.04]' 
          : 'border-white/[0.05] bg-emerald-500/[0.02] hover:border-emerald-500/30 hover:bg-emerald-500/[0.05]'
      }`}>
        <button 
          type="button"
          onClick={() => handleToggleAccordion('squad')}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeAccordion === 'squad' ? 'bg-emerald-400' : 'bg-emerald-400/60'}`} />
            <i className="fas fa-users text-sm text-emerald-400" />
            <span className={`text-xs sm:text-[13px] font-semibold tracking-wider uppercase ${activeAccordion === 'squad' ? 'text-white' : 'text-zinc-200'}`}>
              {tr('Squad & Transfers', 'Kader & Transfers')}
            </span>
          </div>
          <i className={`fas fa-chevron-${activeAccordion === 'squad' ? 'up' : 'down'} text-xs ${activeAccordion === 'squad' ? 'text-emerald-400' : 'text-zinc-500'}`} />
        </button>
        
        {activeAccordion === 'squad' && (
          <div className="p-3.5 sm:p-4 border-t border-white/[0.06] flex flex-col gap-2.5 bg-black/20">
            {/* Card 1: Roster Overview */}
            <div className="bg-[#181924] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-zinc-400 tracking-wider uppercase">
                  {tr('Roster Limit', 'Kaderbegrenzung')}
                </span>
                <span className="text-white font-medium tabular-nums">{stateStore.club.squadSize || 16} / 22 {tr('Players', 'Spieler')}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-400 mt-0.5">
                <span className="text-zinc-200 font-medium tabular-nums">+{stateStore.youthPipeline?.length || 0} Academy</span>
                {(stateStore.youthDevQueue || 0) > 0 && (
                  <>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-zinc-300 font-medium bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      +{stateStore.youthDevQueue} OVR {tr('Matures Next Season', 'Reift nächste Saison')}
                    </span>
                  </>
                )}
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-medium tabular-nums">+{currentTransfers} In</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-medium tabular-nums">-{stateStore.squadSalesThisSeason || 0} Sold</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-medium tabular-nums">+{stateStore.loansThisSeason || 0} Loans</span>
              </div>
            </div>

            {/* Card 2: Transfer Market */}
            <button
              onClick={() => { if (onShowTransfers) onShowTransfers(); }}
              className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">{tr('Transfer Market', 'Transfermarkt')}</span>
                <span className="text-zinc-300 font-medium text-xs uppercase bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  {tr('Active', 'Aktiv')}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {tr('Sign starting caliber stars, squad depth or loan players.', 'Neuzugänge, Stars & Leihen verhandeln.')}
              </p>
            </button>

            {/* Card 3: Youth Academy */}
            {(() => {
              const hasGraduatesReady = Boolean(stateStore.youthPipeline?.some(p => p.timer <= 0 && !p.isLoanedOut));
              return (
                <button
                  onClick={() => { if (onShowYouth) onShowYouth(); }}
                  className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white tracking-tight">{tr('Youth Academy', 'Jugendakademie')}</span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {hasGraduatesReady && (
                        <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>🎓 {tr('Graduate Ready', 'Absolvent bereit')}</span>
                        </span>
                      )}
                      {stateStore.youthChampionshipSimulatedYear !== stateStore.year && (stateStore.youthPipeline?.length || 0) >= 6 && (
                        <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <i className="fas fa-trophy text-[9px] text-zinc-400" />
                          <span>{tr('U19 Ready', 'U19 offen')}</span>
                        </span>
                      )}
                      <span className="text-zinc-300 font-medium tabular-nums text-xs">
                        ({(stateStore.youthPipeline?.filter(p => !p.isLoanedOut)?.length || 0)}/{getAcademySlotLimit(academyLevel)})
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                    {tr('Scout next-gen talent & compete in the U19 championship.', 'Junge Toptalente scouten und U19-Meisterschaft spielen.')}
                  </p>
                </button>
              );
            })()}

            {/* Card 4: Team Retreat */}
            <button
              onClick={() => { if (onTeamBonding) onTeamBonding(); }}
              disabled={(stateStore.teamBondingThisSeason || 0) >= 1}
              className={`bg-[#181924] border border-white/[0.05] rounded-2xl p-4 flex flex-col gap-1 text-left transition ${
                (stateStore.teamBondingThisSeason || 0) >= 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/[0.04] hover:border-white/[0.1] cursor-pointer active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">{tr('Team Retreat', 'Team-Trainingslager')}</span>
                <span className="text-zinc-400 text-xs font-medium">
                  {(stateStore.teamBondingThisSeason || 0) >= 1 ? tr('1/1 Used', '1/1 Genutzt') : tr('Available', 'Verfügbar')}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {tr('Restore locker room harmony & boost morale.', 'Kabinenstimmung und Zusammenhalt stärken.')}
              </p>
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
          ? 'border-sky-500/30 bg-sky-500/[0.04]' 
          : 'border-white/[0.05] bg-sky-500/[0.02] hover:border-sky-500/30 hover:bg-sky-500/[0.05]'
      }`}>
        <button 
          type="button"
          onClick={() => handleToggleAccordion('infra')}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeAccordion === 'infra' ? 'bg-sky-400' : 'bg-sky-400/60'}`} />
            <i className="fas fa-building text-sm text-sky-400" />
            <span className={`text-xs sm:text-[13px] font-semibold tracking-wider uppercase ${activeAccordion === 'infra' ? 'text-white' : 'text-zinc-200'}`}>
              {tr('Infrastructure & Facilities', 'Infrastruktur & Arena')}
            </span>
          </div>
          <i className={`fas fa-chevron-${activeAccordion === 'infra' ? 'up' : 'down'} text-xs ${activeAccordion === 'infra' ? 'text-sky-400' : 'text-zinc-500'}`} />
        </button>
        
        {activeAccordion === 'infra' && (
          <div className="p-3.5 sm:p-4 border-t border-white/[0.06] flex flex-col gap-2.5 bg-black/20">
            {/* Card 1: Construction Limit Overview (matches Commercial Limit & Roster Limit) */}
            <div className="bg-[#181924] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-zinc-400 tracking-wider uppercase">
                  {tr('Construction Limit', 'Baukontingent')}
                </span>
                <span className="text-white font-medium tabular-nums">{currentInfra} / {maxInfra} {tr('Cranes', 'Baukräne')}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-400 mt-0.5">
                <span className="text-zinc-200 font-medium tabular-nums">{formatNum(stateStore.club.stadium || 2000)} {tr('Seats', 'Plätze')}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-medium tabular-nums">{tr('Academy', 'Akademie')} Lvl {academyLevel}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-medium tabular-nums">{tr('Medical', 'Medizin')} Lvl {medicalLevel}</span>
              </div>
            </div>

            {/* Card 2: Arena Expansion */}
            {(() => {
              const pinnacleCap = getPinnacleArenaCapacity(stateStore.club.country);
              const isMaxArena = (stateStore.club.stadium || 0) >= pinnacleCap;
              return (
                <button
                  onClick={() => { if (!isMaxArena && onShowStadium) onShowStadium(true); }}
                  disabled={isMaxArena || currentInfra >= maxInfra || (stateStore.stadiumExpandedThisSeason || 0) >= 1}
                  className="bg-[#181924] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#181924] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white tracking-tight">{tr('Arena Expansion', 'Arena-Ausbau')}</span>
                    <span className={`font-medium tabular-nums text-xs ${isMaxArena ? 'text-zinc-400' : 'text-zinc-200'}`}>
                      {isMaxArena ? `MAX (${formatNum(pinnacleCap)})` : `+500 ${tr('Seats', 'Plätze')}`}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                    {isMaxArena 
                      ? tr(`Maximum pinnacle capacity (${formatNum(pinnacleCap)} seats) reached. No further expansions permitted.`, `Maximale Arena-Kapazität (${formatNum(pinnacleCap)}) erreicht. Kein weiterer Ausbau möglich.`)
                      : tr('Add seating tiers to scale matchday gate receipts.', 'Zuschauerkapazität und Ticketeinnahmen steigern.')}
                  </p>
                </button>
              );
            })()}

            {/* Card 3: Arena Project */}
            {(() => {
              const pinnacleCap = getPinnacleArenaCapacity(stateStore.club.country);
              const isMaxArena = (stateStore.club.stadium || 0) >= pinnacleCap;
              return (
                <button
                  onClick={() => { if (!isMaxArena && onShowNewBuild) onShowNewBuild(); }}
                  disabled={isMaxArena || currentInfra >= maxInfra || (stateStore.stadiumExpandedThisSeason || 0) >= 1}
                  className="bg-[#181924] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#181924] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white tracking-tight">{tr('Arena Project', 'Arena-Projekt')}</span>
                    <span className="text-zinc-300 font-medium text-xs">
                      {isMaxArena ? tr('PINNACLE ACTIVE', 'GROSSARENA AKTIV') : tr('Complex', 'Großbau')}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                    {isMaxArena
                      ? tr(`Pinnacle Arena active (${formatNum(pinnacleCap)} seats). Venue commissioning closed.`, `Pinnacle-Arena aktiv (${formatNum(pinnacleCap)} Plätze). Keine weiteren Projekte möglich.`)
                      : tr(`Inaugurate a world-class handball entertainment complex (up to ${formatNum(pinnacleCap)} seats).`, `Bau einer modernen Multifunktionsarena (bis zu ${formatNum(pinnacleCap)} Plätze).`)}
                  </p>
                </button>
              );
            })()}

            {/* Card 4: Upgrade Academy */}
            <button
              onClick={() => { if (onUpgradeAcademy) onUpgradeAcademy(); }}
              disabled={!canUpgradeAcademy}
              className="bg-[#181924] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#181924] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">{tr('Upgrade Academy', 'Jugendakademie ausbauen')}</span>
                <span className="text-zinc-300 font-medium tabular-nums text-xs">
                  Lvl {academyLevel}{academyLevel < 5 ? ` → ${academyLevel + 1}` : ' (MAX)'}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {academyLevel < 5 
                  ? `Cost: ${formatMoney(academyUpgradeCost)} · ${
                      academyLevel + 1 === 2
                        ? 'Unlocks 2 scouts/yr'
                        : academyLevel + 1 === 3
                        ? 'Unlocks Anti-Poaching Shield'
                        : academyLevel + 1 === 4
                        ? 'Unlocks Foreign Imports 🌍'
                        : 'Unlocks Global Dynasty Immunity'
                    }`
                  : 'Max Level Reached · Global Dynasty Active'}
              </p>
            </button>

            {/* Card 5: Upgrade Medical */}
            <button
              onClick={() => { if (onUpgradeMedical) onUpgradeMedical(); }}
              disabled={!canUpgradeMedical}
              className="bg-[#181924] hover:bg-white/[0.04] disabled:opacity-40 disabled:hover:bg-[#181924] disabled:cursor-not-allowed border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">{tr('Upgrade Medical', 'Medizinabteilung ausbauen')}</span>
                <span className="text-zinc-300 font-medium tabular-nums text-xs">
                  Lvl {medicalLevel}{medicalLevel < 5 ? ` → ${medicalLevel + 1}` : ' (MAX)'}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {medicalLevel < 5
                  ? `Cost: ${formatMoney(medicalUpgradeCost)} · ${
                      medicalLevel + 1 === 2
                        ? 'Unlocks Free In-House Rehab'
                        : medicalLevel + 1 === 3
                        ? 'Unlocks Decay Immunity & 100% Rehab'
                        : medicalLevel + 1 === 4
                        ? 'Max 1 Retirement/yr & 50% Vet Retention'
                        : 'Unlocks +1.0 Match OVR & Dynasty Shield'
                    }`
                  : 'Max Level Reached · Peak Performance Institute'}
              </p>
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
          ? 'border-amber-500/30 bg-amber-500/[0.04]' 
          : 'border-white/[0.05] bg-amber-500/[0.02] hover:border-amber-500/30 hover:bg-amber-500/[0.05]'
      }`}>
        <button 
          type="button"
          onClick={() => handleToggleAccordion('manager')}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 cursor-pointer text-left transition"
        >
          <div className="flex items-center gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeAccordion === 'manager' ? 'bg-amber-400' : 'bg-amber-400/60'}`} />
            <i className="fas fa-user-tie text-sm text-amber-400" />
            <span className={`text-xs sm:text-[13px] font-semibold tracking-wider uppercase ${activeAccordion === 'manager' ? 'text-white' : 'text-zinc-200'}`}>
              {tr('Board & Manager', 'Vorstand & Trainer')}
            </span>
          </div>
          <i className={`fas fa-chevron-${activeAccordion === 'manager' ? 'up' : 'down'} text-xs ${activeAccordion === 'manager' ? 'text-amber-400' : 'text-zinc-500'}`} />
        </button>
        
        {activeAccordion === 'manager' && (
          <div className="p-3.5 sm:p-4 border-t border-white/[0.06] flex flex-col gap-2.5 bg-black/20">
            {/* Card 1: Club Impact */}
            <button
              onClick={() => { if(onShowImpact) onShowImpact(); }}
              className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">{tr('Club Impact', 'Vereinseinfluss')}</span>
                <span className="text-zinc-200 font-medium tabular-nums text-xs">{state.clubImpactScore ?? 50}/100</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {tr('Review board trust, fan happiness, and stadium status.', 'Vorstandsvertrauen, Fanstimmung und Infrastruktur analysieren.')}
              </p>
            </button>

            {/* Card 1b: Club Roadmap */}
            <button
              onClick={() => { if(onOpenRoadmap) onOpenRoadmap(); else if(onShowImpact) onShowImpact(); }}
              className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                  <i className="fas fa-map-location-dot text-zinc-400 text-xs" />
                  <span>{tr('Club Roadmap', 'Vereins-Roadmap')}</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.03] text-zinc-300 border border-white/[0.06]">
                  {state.boardRoadmap ? `${state.boardRoadmap.horizonYears} ${tr('Years', 'Jahre')}` : tr('Roadmap', 'Roadmap')}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {state.club.tier === 1 && (state.trophyDrought || 0) > 4 ? (
                  <span className="text-rose-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>{state.trophyDrought}-Year Trophy Drought: The fanbase is losing patience.</span>
                  </span>
                ) : (
                  tr('Multi-year strategic milestones, context goals & MP rewards.', 'Mehrjährige Ziele, Meilensteine und MP-Prämien einsehen.')
                )}
              </p>
            </button>

            {/* Card 2: Tactical Philosophy & Rebuild Directives */}
            <button
              onClick={() => { if(onOpenPhilosophy) onOpenPhilosophy(); }}
              className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">{tr('Tactics & Rebuild Directives', 'Taktik & Vereins-Rebuild')}</span>
                <span className="text-zinc-300 font-medium text-xs">{state.tactic}</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {tr('System philosophy, generational squad cycles & austerity rebalancing.', 'Taktisches Konzept, Generationswechsel & Rebuild-Säulen.')}
              </p>
            </button>

            {/* Card 3: Job Market */}
            <button
              onClick={() => { if(onOpenJobMarket) onOpenJobMarket(); }}
              className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight">{tr('Job Market', 'Trainermarkt')}</span>
                <span className="text-zinc-300 font-medium text-xs uppercase bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  {tr('Open', 'Offen')}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {tr('Review club vacancies & take over a new project.', 'Offene Stellen sichten und Verein wechseln.')}
              </p>
            </button>

            {/* Card 4: Manager Points */}
            <button
              onClick={() => { if(onOpenSkills) onOpenSkills(); }}
              className="bg-[#181924] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-4 flex flex-col gap-1 text-left transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                  <i className="fas fa-bolt text-zinc-400 text-xs" />
                  <span>{tr('Manager Points', 'Manager-Punkte')}</span>
                </span>
                <span className="text-zinc-200 font-medium tabular-nums text-xs bg-white/[0.03] border border-white/[0.06] px-2.5 py-0.5 rounded-full">{state.skillPoints || 0} MP</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug font-normal">
                {tr('Unlock tactical mastermind, scout networks, and perks.', 'Taktikgenie, Netzwerk und Fähigkeiten freischalten.')}
              </p>
            </button>

            {/* Card 5: Retire immediately */}
            <button
              onClick={() => { if(onRetire) onRetire(); }}
              className="bg-white/[0.02] hover:bg-white/[0.04] p-3 rounded-xl border border-white/[0.05] hover:border-white/[0.1] text-left transition cursor-pointer flex justify-between items-center mt-1 active:scale-[0.99]"
            >
              <span className="text-xs font-medium text-zinc-400 hover:text-rose-400">
                {tr('Retire from Management Immediately', 'Sofortiger Rücktritt')}
              </span>
              <i className="fas fa-power-off text-zinc-500 text-xs" />
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
    </div>
  );
};
