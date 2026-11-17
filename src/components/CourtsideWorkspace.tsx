import React, { useMemo, useState } from 'react';
import { GameState, Language, CourtsideNavTab, getAcademySlotLimit, calculateCohortRating } from '../types';
import {
  formatMoney,
  formatNum,
  getAcademyUpgradeCost,
  getMedicalUpgradeCost,
  getPinnacleArenaCapacity,
  getDynamicSponsorPitchTerms,
  getCurrencyForCountry,
  getLeagueScaledVal,
  MANAGER_SKILLS,
} from '../data/gameConstants';
import { buildCourtsideAnalytics, LiveSeasonProgress } from '../utils/courtsideStats';
import { ARENA_DESIGN_LIST, ArenaDesignId } from '../utils/arenaArchitecture';
import { buildOfficeArchitectureModel } from '../utils/officeArchitecture';
import { getBaseLoanPrincipal, calculateLoanTerms } from '../utils/loanManager';
import { resolveActiveSponsorBrands } from '../utils/sponsorBranding';
import { getOrGenerateRoadmap } from '../utils/roadmapManager';
import { evaluateIPOEligibility } from '../utils/ipoEligibility';
import { useGameStore } from '../store/useGameStore';
import { ClubLogo } from './ClubLogo';
import { CourtSimulationCard } from './CourtSimulationCard';
import { ClubOfficeExteriorCard } from './ClubOfficeExteriorCard';
import { TrainingGymWarmupCard } from './TrainingGymWarmupCard';
import { BoardroomTableCard } from './BoardroomTableCard';
import { SeasonHistoryTable } from './SeasonHistoryTable';

export type { CourtsideNavTab };

interface CourtsideWorkspaceProps {
  activeTab: CourtsideNavTab;
  onSelectTab: (tab: CourtsideNavTab) => void;
  state: GameState;
  lang: Language;
  activeClubs: any[];
  financials: any;
  isFirstHalf: boolean;
  supercupMatch?: any;
  isRelegationFight?: boolean;
  simulateDisabled?: boolean;
  isSimulatingLive?: boolean;
  simulationPhase?: 'first_half' | 'second_half' | 'full' | 'idle';
  totalMatchdays?: number;
  onSimulationComplete?: () => void;
  onSimulate: () => void;
  onShowTable: () => void;
  onShowLedger: () => void;
  onShowTransfers: () => void;
  onShowOvr: () => void;
  onShowYouth: () => void;
  onShowYouthTournament: () => void;
  onTeamBonding: () => void;
  onOpenPhilosophy: () => void;
  onOpenCoachOverview: () => void;
  onOpenRebuild: () => void;
  onOpenTeamModal: (clubObj?: any) => void;
  onOpenClubContext?: () => void;
  onOpenTrophyCabinet?: () => void;
  onShowSponsors: (dealIndex?: 0 | 1 | 2 | 3) => void;
  onShowIPO: () => void;
  onShowMarketing: () => void;
  onShowLoan: () => void;
  onShowStadium: () => void;
  onShowArenaOverview: (tab?: 'market' | 'trend' | 'strategy' | 'expansion') => void;
  onShowNewBuild: () => void;
  onUpgradeAcademy: () => void;
  onUpgradeMedical: () => void;
  onShowImpact: () => void;
  onOpenPressRoom: () => void;
  onOpenRoadmap: () => void;
  onOpenSkills: () => void;
  onOpenJobMarket: () => void;
  onOpenProfile: () => void;
  onOpenClubProfile: () => void;
  onOpenCustomization: () => void;
  onOpenBoardExpectations: () => void;
  onRetire: () => void;
}

export const CourtsideWorkspace: React.FC<CourtsideWorkspaceProps> = ({
  activeTab,
  onSelectTab,
  state,
  lang,
  activeClubs,
  financials,
  isFirstHalf,
  supercupMatch,
  isRelegationFight = false,
  simulateDisabled = false,
  isSimulatingLive = false,
  simulationPhase = 'full',
  totalMatchdays = 34,
  onSimulationComplete,
  onSimulate,
  onShowTable,
  onShowLedger,
  onShowTransfers,
  onShowOvr,
  onShowYouth,
  onShowYouthTournament,
  onTeamBonding,
  onOpenPhilosophy,
  onOpenCoachOverview,
  onOpenRebuild,
  onOpenTeamModal,
  onOpenClubContext,
  onOpenTrophyCabinet,
  onShowSponsors,
  onShowIPO,
  onShowMarketing,
  onShowLoan,
  onShowStadium,
  onShowArenaOverview,
  onShowNewBuild,
  onUpgradeAcademy,
  onUpgradeMedical,
  onShowImpact,
  onOpenPressRoom,
  onOpenRoadmap,
  onOpenSkills,
  onOpenJobMarket,
  onOpenProfile,
  onOpenClubProfile,
  onOpenCustomization,
  onOpenBoardExpectations,
  onRetire,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(state.year || 2026);
  const [shotUnitFilter, setShotUnitFilter] = useState<string>('All players');
  const [liveSimProgress, setLiveSimProgress] = useState<LiveSeasonProgress | null>(null);

  React.useEffect(() => {
    setSelectedYear(state.year || 2026);
    setLiveSimProgress(null);
  }, [state.year]);

  React.useEffect(() => {
    if (!isSimulatingLive) {
      setLiveSimProgress(null);
    }
  }, [isSimulatingLive]);

  const activeArenaDesign: ArenaDesignId =
    (state.club as any)?.arenaDesign || 'terracotta_courtside';

  const handleSelectArenaDesign = (designId: ArenaDesignId) => {
    if (!state.club) return;
    const updatedClub = { ...state.club, arenaDesign: designId };
    const nextWorldClubs = { ...(state.worldClubs || {}) };
    if (state.club.id !== undefined) {
      nextWorldClubs[String(state.club.id)] = {
        ...(nextWorldClubs[String(state.club.id)] || state.club),
        arenaDesign: designId,
      };
    }
    useGameStore.getState().updateState({
      club: updatedClub,
      worldClubs: nextWorldClubs,
    });
  };

  const analytics = useMemo(
    () =>
      buildCourtsideAnalytics(
        state,
        activeClubs,
        selectedYear,
        isFirstHalf,
        supercupMatch,
        isSimulatingLive ? liveSimProgress : null
      ),
    [state, activeClubs, selectedYear, isFirstHalf, supercupMatch, isSimulatingLive, liveSimProgress]
  );

  const mediaScore = Math.round(state.mediaPressure ?? 22);
  const mediaStatusLabel =
    mediaScore >= 68 ? 'Hot seat' : mediaScore >= 45 ? 'Elevated' : 'Calm';
  const country = state.club?.country || 'GER';

  const filteredMarkers = useMemo(() => {
    if (shotUnitFilter === 'All players') return analytics.shotChart.markers;
    return analytics.shotChart.markers.filter((m) => m.unit === shotUnitFilter);
  }, [analytics.shotChart.markers, shotUnitFilter]);

  const academyLevel = state.club?.academyLevel || 1;
  const medicalLevel = state.club?.medicalLevel || 1;
  const activeYouthCount = (state.youthPipeline || []).filter((p) => !p.isLoanedOut).length;
  const youthSlotLimit = getAcademySlotLimit(academyLevel);
  const isScoutDirector = state.directorArchetype === 'Scout / Youth Developer';
  const academyCost = getAcademyUpgradeCost(academyLevel, state.club?.tier || 1, country, isScoutDirector);
  const medicalCost = getMedicalUpgradeCost(medicalLevel, state.club?.tier || 1, country);
  const pinnacleCap = getPinnacleArenaCapacity(country);
  const sponsorTerms = getDynamicSponsorPitchTerms(state);

  const estRevenue = financials?.estRevenue || 0;
  const projNet = financials?.net || 0;
  const estExpenses = Math.max(0, estRevenue - projNet);

  const paintAccent = analytics.arenaColors.courtPaintColor || '#DF642A';

  const liveClubCapacity = Math.max(500, state.club?.stadium || analytics.stadiumCapacity || 4500);
  const liveClubAttendance = Math.min(
    liveClubCapacity,
    Math.max(0, financials?.expectedAtt || analytics.featuredMatch.attendanceNumeric || 0)
  );
  const liveUtilPct = Math.min(
    100,
    Math.round((liveClubAttendance / Math.max(1, liveClubCapacity)) * 100)
  );
  const u19CohortOvr = calculateCohortRating(
    state.club?.baseOvr || 75,
    academyLevel,
    state.youthPipeline || []
  );
  const hasPlayedYouthCupThisSeason = state.youthChampionshipSimulatedYear === state.year;
  const canEnterYouthCupNow = activeYouthCount >= 6 && !hasPlayedYouthCupThisSeason;
  const retreatCost = Math.round(getLeagueScaledVal(state.club?.tier || 1, 50000, country));
  const signingsCountThisSeason =
    (state.regTransfersThisSeason || 0) +
    (state.keyTransfersThisSeason || 0) +
    (state.galacticosThisSeason || 0) +
    (state.loansThisSeason || 0);
  const activeFanStrategy: 'ultras' | 'community' | 'corporate' | 'balanced' =
    state.club?.fanStrategy || state.fanStrategy || 'balanced';
  const infraUsedThisSeason =
    (state.facilitiesUpgradedThisSeason || 0) + (state.infraActionsThisSeason || 0);

  const activeSponsorBrands = useMemo(
    () => resolveActiveSponsorBrands(state),
    [state.year, state.seasonSponsorDeals, state.seasonSponsorDealsYear]
  );

  const signedSponsorCount = useMemo(() => {
    if (activeSponsorBrands.length > 0) return activeSponsorBrands.length;
    const isSameYear = state.seasonSponsorDealsYear === state.year;
    return isSameYear && (state.sponsorsPitchedThisSeason || 0) > 0 && (state.sponsorIncome || 0) > 0 ? 1 : 0;
  }, [activeSponsorBrands.length, state.seasonSponsorDealsYear, state.year, state.sponsorsPitchedThisSeason, state.sponsorIncome]);

  const boardRoadmapSummary = useMemo(() => {
    if (!state.club) {
      return {
        title: 'Club Strategic Plan',
        completedGoals: 0,
        totalGoals: 3,
        confidence: 65,
        horizonLabel: `${state.year || 2026}–${(state.year || 2026) + 3}`,
      };
    }
    const roadmap = getOrGenerateRoadmap(
      state.boardRoadmap,
      { ...state.club, currentBudget: state.budget ?? 0 },
      state.year || 2024,
      state.history || []
    );
    const goals = roadmap.goals || [];
    const completedGoals = goals.filter((g) => g.completed).length;
    return {
      title: roadmap.titleEn || 'Club Strategic Plan',
      completedGoals,
      totalGoals: goals.length || 3,
      confidence: Math.round(roadmap.boardConfidence ?? 65),
      horizonLabel: `${roadmap.startYear}–${roadmap.endYear}`,
    };
  }, [state.boardRoadmap, state.club, state.budget, state.year, state.history]);

  const activeManagerSkills = state.managerSkills || [];
  const totalManagerSkillsCount = Object.keys(MANAGER_SKILLS).length;

  const commercialOfficeModel = useMemo(
    () =>
      buildOfficeArchitectureModel({
        tier: state.club?.tier || 1,
        baseOvr: state.club?.baseOvr || 75,
        reputation: state.reputation ?? 50,
        budget: state.budget || 0,
        fanBase: state.club?.fanBase || 1500,
        country,
        isPublic: Boolean(state.club?.isPublic),
        stockPrice: state.club?.stockPrice,
        ipoPrice: state.club?.ipoPrice,
        signedSponsorCount,
        hasActiveLoan: Boolean(state.activeLoan),
        clubColor: analytics.clubColor,
        clubColor2: analytics.clubColor2,
        academyLevel,
        medicalLevel,
      }),
    [
      state.club?.tier,
      state.club?.baseOvr,
      state.club?.fanBase,
      state.club?.isPublic,
      state.club?.stockPrice,
      state.club?.ipoPrice,
      state.reputation,
      state.budget,
      state.activeLoan,
      country,
      signedSponsorCount,
      analytics.clubColor,
      analytics.clubColor2,
      academyLevel,
      medicalLevel,
    ]
  );

  const standardLoanPrincipal = useMemo(
    () => getBaseLoanPrincipal(state.club?.tier || 1, country),
    [state.club?.tier, country]
  );
  const previewLoanPrincipal = Math.max(
    10000,
    Math.round((state.budget || 0) < 0 ? Math.abs(state.budget || 0) : standardLoanPrincipal)
  );
  const previewLoan15Yr = useMemo(
    () => calculateLoanTerms(previewLoanPrincipal)[15],
    [previewLoanPrincipal]
  );
  const currencySymbol = getCurrencyForCountry(country).symbol;
  const ipoEligibility = useMemo(
    () =>
      evaluateIPOEligibility({
        club: state.club,
        budget: state.budget,
        seasonsInDebt: state.seasonsInDebt,
        bankruptcyPending: state.bankruptcyPending,
      }),
    [state.club, state.budget, state.seasonsInDebt, state.bankruptcyPending]
  );

  return (
    <div className="w-full flex flex-col gap-3.5 sm:gap-4">
      {/* Mobile / Compact Equal-Column Segmented Navigation (Desktop uses top Header) */}
      <nav
        aria-label="Mobile Workspace Sections"
        className="grid md:hidden grid-cols-5 items-center gap-1 bg-white rounded-[20px] sm:rounded-full p-1 w-full max-w-[560px] mx-auto shadow-[0_4px_16px_rgba(15,23,42,0.05)] border border-black/[0.05]"
      >
        {(
          [
            { id: 'overview', label: 'Overview', mobileLabel: 'Overview', icon: 'fa-border-all' },
            { id: 'commercial', label: 'Commercial', mobileLabel: 'Commercial', icon: 'fa-coins' },
            { id: 'squad', label: 'Squad', mobileLabel: 'Squad', icon: 'fa-user-group' },
            { id: 'infrastructure', label: 'Infrastructure', mobileLabel: 'Arena', icon: 'fa-building-columns' },
            { id: 'board', label: 'Board & Manager', mobileLabel: 'Board', icon: 'fa-user-tie' },
          ] as { id: CourtsideNavTab; label: string; mobileLabel: string; icon: string }[]
        ).map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-label={t.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(t.id)}
              className={`w-full min-h-[44px] px-0.5 sm:px-2 py-1.5 rounded-[15px] sm:rounded-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs tracking-[-0.015em] sm:tracking-normal font-semibold leading-none whitespace-nowrap text-center transition cursor-pointer touch-manipulation ${
                isActive
                  ? 'bg-[#18191F] text-white shadow-xs'
                  : 'text-[#686D7B] hover:text-[#14161D]'
              }`}
            >
              <i
                aria-hidden="true"
                className={`fas ${t.icon} text-[11px] ${
                  isActive ? 'text-white' : 'text-[#525866]'
                }`}
              />
              <span className="truncate max-w-full">{t.mobileLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Trophy Drought Alert Banner if active */}
      {state.club?.tier === 1 && (state.trophyDrought || 0) > 4 && (
        <button
          type="button"
          onClick={onOpenBoardExpectations}
          className="w-full bg-white hover:bg-[#FFF9F6] border border-[#DF642A]/30 rounded-[20px] px-4 py-3 flex items-center justify-between gap-3 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#DF642A]/12 text-[#DF642A] flex items-center justify-center text-xs shrink-0">
              <i className="fas fa-triangle-exclamation" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#14161D] truncate">
                {state.trophyDrought}-Year Championship Drought Scrutiny
              </p>
              <p className="text-[11px] text-[#6E7381] truncate">
                Board &amp; media demand silverware this campaign. Click to review mandate.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#DF642A] text-white text-[11px] font-semibold shrink-0">
            Mandate →
          </span>
        </button>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: COURTSIDE 3-COLUMN APPLE BENTO OVERVIEW (EXACT 8 BENTOS)       */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 xl:gap-4 items-stretch">
          {/* --------------------------------------------------------------- */}
          {/* LEFT COLUMN (Desktop: 1. Season Snapshot · 2. Treasury · 3. Standings) */}
          {/* --------------------------------------------------------------- */}
          <div className="contents lg:flex lg:col-span-3 lg:order-1 lg:flex-col lg:gap-3.5 xl:gap-4 lg:h-full">
            {/* BENTO: Season snapshot (Mobile #3) */}
            <section
              aria-label="Season snapshot"
              data-bento="season-snapshot"
              className="max-lg:order-3 courtside-card p-4 xl:p-[18px] flex flex-col gap-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenTeamModal(state.club)}
                    className="shrink-0 cursor-pointer hover:opacity-80 transition"
                    title={`Inspect ${analytics.clubFullName}`}
                  >
                    <ClubLogo
                      club={state.club}
                      name={analytics.clubFullName}
                      clubId={analytics.clubId}
                      color={analytics.clubColor}
                      color2={analytics.clubColor2}
                      logo={analytics.clubLogo}
                      fallbackLogo={analytics.clubFallbackLogo}
                      className="w-6 h-6 rounded-md object-contain shrink-0"
                    />
                  </button>
                  <div className="min-w-0 leading-tight">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#14161D] truncate">
                      Season snapshot
                    </h2>
                    <button
                      type="button"
                      onClick={() => onOpenTeamModal(state.club)}
                      className="text-[10px] font-medium text-[#525866] hover:text-[#14161D] hover:underline truncate block text-left cursor-pointer"
                    >
                      {analytics.clubFullName}
                    </button>
                  </div>
                </div>
                <label className="sr-only" htmlFor="season-year-select">
                  Select season year
                </label>
                <select
                  id="season-year-select"
                  value={analytics.selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-[#F2F0EB] hover:bg-[#E8E5DE] text-[#374151] text-[11px] font-semibold rounded-full px-3 py-1 border border-black/[0.04] cursor-pointer outline-none tabular-nums shrink-0"
                >
                  {analytics.availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}–{String((yr + 1) % 100).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-[#525866] mb-0.5">Win rate</span>
                  <div className="flex items-baseline leading-none tabular-nums">
                    <span className="text-[32px] lg:text-[36px] font-extrabold tracking-tight text-[#14161D]">
                      {analytics.winRatePct}
                    </span>
                    <span className="text-[18px] font-semibold text-[#525866] ml-0.5">%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onShowTable}
                  className="flex flex-col items-end text-right hover:opacity-75 transition cursor-pointer"
                  title="Open League Standings"
                >
                  <span className="text-[11px] font-medium text-[#525866] mb-0.5">Record</span>
                  <span className="text-[20px] lg:text-[22px] font-bold tracking-tight text-[#14161D] leading-none tabular-nums">
                    {analytics.recordLabel}
                  </span>
                  <span className="text-[11px] text-[#525866] mt-1 truncate max-w-[135px]">
                    {analytics.standingLabel}
                  </span>
                </button>
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[#525866]">Last five games</span>
                  <span className="text-[10px] font-medium text-[#525866] tabular-nums">
                    {analytics.gamesPlayed} played
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {analytics.lastFive.map((res, idx) => (
                    <span
                      key={idx}
                      className={`h-7 rounded-[9px] text-[11px] font-bold flex items-center justify-center ${
                        res === 'W'
                          ? 'bg-[#E2F5EA] text-[#15803D]'
                          : res === 'L'
                          ? 'bg-[#FCE8E8] text-[#C83232]'
                          : res === 'D'
                          ? 'bg-[#F1EFEA] text-[#525866]'
                          : 'bg-[#F6F5F1] text-[#5C6270]'
                      }`}
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* BENTO: Treasury (Mobile #6) */}
            <section
              aria-label="Treasury"
              data-bento="treasury"
              className="max-lg:order-6 courtside-card p-4 xl:p-[18px] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-bold tracking-tight text-[#14161D]">
                  Treasury
                </h2>
                <span className="text-[11px] font-medium text-[#525866]">
                  {state.club?.isPublic
                    ? 'Listed PLC'
                    : state.activeLoan
                    ? 'Credit active'
                    : 'Debt-free'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#525866]">Available balance</span>
                <span
                  className={`text-[28px] xl:text-[31px] font-extrabold tracking-tight tabular-nums leading-tight ${
                    (state.budget || 0) < 0 ? 'text-[#C83232]' : 'text-[#14161D]'
                  }`}
                >
                  {formatMoney(state.budget || 0, country)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-[#F5F4F0] rounded-[13px] p-2.5 flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-medium text-[#525866] truncate">Revenue</span>
                  <span className="text-[12px] xl:text-[13px] font-bold text-[#15803D] tabular-nums truncate">
                    +{formatMoney(estRevenue, country)}
                  </span>
                </div>
                <div className="bg-[#F5F4F0] rounded-[13px] p-2.5 flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-medium text-[#525866] truncate">Expenses</span>
                  <span className="text-[12px] xl:text-[13px] font-bold text-[#C83232] tabular-nums truncate">
                    -{formatMoney(estExpenses, country)}
                  </span>
                </div>
                <div className="bg-[#F5F4F0] rounded-[13px] p-2.5 flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-medium text-[#525866] truncate">Net</span>
                  <span
                    className={`text-[12px] xl:text-[13px] font-bold tabular-nums truncate ${
                      projNet < 0 ? 'text-[#C83232]' : 'text-[#14161D]'
                    }`}
                  >
                    {projNet >= 0 ? '+' : ''}
                    {formatMoney(projNet, country)}
                  </span>
                </div>
              </div>

              <div className="pt-1 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={onShowLedger}
                  className="py-2 px-3 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  Ledger
                </button>
                <button
                  type="button"
                  onClick={() => onShowSponsors(0)}
                  className="py-2 px-3 rounded-full bg-[#F2F0EB] hover:bg-[#E6E3DB] text-[#14161D] text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  Sponsors
                </button>
              </div>
            </section>

            {/* BENTO: Standings — Extended Adjacent Teams (Mobile #7) */}
            <section
              aria-label="Standings"
              data-bento="standings"
              className="max-lg:order-7 courtside-card p-4 xl:p-[18px] flex flex-col justify-between gap-2.5 lg:flex-1"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#14161D]">
                      Standings
                    </h2>
                    <p className="text-[10px] text-[#525866] truncate">
                      {analytics.leagueName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onShowTable}
                    className="bg-[#F2F0EB] hover:bg-[#E7E4DC] text-[#374151] text-[11px] font-semibold px-3 py-1 rounded-full transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Full table →
                  </button>
                </div>

                <div className="grid grid-cols-[22px_1fr_38px_32px] items-center gap-1.5 px-2 pt-0.5 text-[10px] font-semibold text-[#525866]">
                  <span>#</span>
                  <span>Club</span>
                  <span className="text-right">GD</span>
                  <span className="text-right">PTS</span>
                </div>

                <div className="flex flex-col gap-1">
                  {analytics.adjacentStandings.map((row) => (
                    <button
                      key={`${row.pos}-${row.name}`}
                      type="button"
                      onClick={() => onOpenTeamModal(row.isUser ? state.club : row)}
                      title={`Inspect ${row.name}`}
                      className={`w-full grid grid-cols-[22px_1fr_38px_32px] items-center gap-1.5 px-2 py-1.5 rounded-[12px] text-left transition cursor-pointer ${
                        row.isUser
                          ? 'bg-[#18191F] text-white shadow-xs'
                          : 'hover:bg-[#F5F4F0] text-[#14161D]'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-bold tabular-nums ${
                          row.isUser ? 'text-white' : 'text-[#686D7B]'
                        }`}
                      >
                        {row.pos}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <ClubLogo
                          club={row as any}
                          name={row.name}
                          clubId={row.id}
                          color={row.color}
                          color2={row.color2}
                          logo={row.logo}
                          fallbackLogo={row.fallbackLogo}
                          className="w-5 h-5 rounded-md object-contain shrink-0"
                        />
                        <span
                          className={`text-[12px] font-semibold truncate hover:underline ${
                            row.isUser ? 'text-white' : 'text-[#14161D]'
                          }`}
                        >
                          {row.shortName}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] text-right tabular-nums ${
                          row.isUser ? 'text-zinc-300' : 'text-[#686D7B]'
                        }`}
                      >
                        {row.gd}
                      </span>
                      <span
                        className={`text-[12px] font-bold text-right tabular-nums ${
                          row.isUser ? 'text-white' : 'text-[#14161D]'
                        }`}
                      >
                        {row.pts}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* CENTER COLUMN (Desktop: 4. Inline Arena Sim + 5. Season & Club History) */}
          {/* --------------------------------------------------------------- */}
          <div className="contents lg:flex lg:col-span-6 lg:order-2 lg:flex-col lg:gap-3.5 xl:gap-4 lg:h-full">
            {/* BENTO: Interactive Center Handball Arena + Inline Simulation (Mobile #1) */}
            <div
              data-bento="arena-overlay"
              className="max-lg:order-1 md:max-lg:col-span-2 w-full"
            >
              <CourtSimulationCard
                analytics={analytics}
                club={state.club}
                simState={state}
                tactic={state.tactic || 'Balanced 6-0'}
                isFirstHalf={isFirstHalf}
                hasSupercup={Boolean(supercupMatch && isFirstHalf)}
                supercupTitle={supercupMatch?.title}
                isRelegationFight={isRelegationFight}
                mediaPressureScore={mediaScore}
                disabled={simulateDisabled}
                lang={lang}
                overrideCapacity={
                  analytics.selectedYear === state.year ? liveClubCapacity : undefined
                }
                overrideAttendance={
                  analytics.selectedYear === state.year
                    ? isSimulatingLive
                      ? analytics.featuredMatch.attendanceNumeric
                      : liveClubAttendance
                    : undefined
                }
                overrideDesignId={activeArenaDesign}
                sponsors={activeSponsorBrands}
                isSimulatingLive={isSimulatingLive}
                simulationPhase={simulationPhase}
                totalMatchdays={totalMatchdays}
                onSimulationComplete={onSimulationComplete}
                onLiveProgressChange={setLiveSimProgress}
                onOpenTeamModal={onOpenTeamModal}
                onSimulate={onSimulate}
                onOpenTactics={onOpenPhilosophy}
                onOpenPressRoom={onOpenPressRoom}
                onOpenArena={() => onShowArenaOverview('market')}
              />
            </div>

            {/* BENTO: Season & Club History + Club Context + Trophy Collections (Mobile #8 Bottom) */}
            <div
              data-bento="season-history"
              className="max-lg:order-8 md:max-lg:col-span-2 w-full flex flex-col lg:flex-1"
            >
              <SeasonHistoryTable
                state={state}
                lang={lang}
                variant="courtside"
                clubContext={analytics.clubContext}
                trophyCollection={analytics.trophyCollection}
                onOpenStandings={onShowTable}
                onOpenTeamModal={onOpenTeamModal}
                onOpenClubContext={onOpenClubContext || (() => onOpenTeamModal(state.club))}
                onOpenTrophyCabinet={onOpenTrophyCabinet || (() => onOpenTeamModal(state.club))}
              />
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* RIGHT COLUMN (Desktop: 6. Shot Chart · 7. Club Health · 8. Tactics) */}
          {/* --------------------------------------------------------------- */}
          <div className="contents lg:flex lg:col-span-3 lg:order-3 lg:flex-col lg:gap-3.5 xl:gap-4 lg:h-full">
            {/* BENTO: Shot chart · Season (Mobile #4) */}
            <section
              aria-label="Shot chart"
              data-bento="shot-chart"
              className="max-lg:order-4 courtside-card p-4 xl:p-[18px] flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between gap-1.5">
                <h2 className="text-[15px] font-bold tracking-tight text-[#14161D] whitespace-nowrap">
                  Shot chart
                </h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="sr-only" htmlFor="shot-unit-filter">
                    Filter shot chart unit
                  </label>
                  <select
                    id="shot-unit-filter"
                    value={shotUnitFilter}
                    onChange={(e) => setShotUnitFilter(e.target.value)}
                    className="bg-[#F2F0EB] hover:bg-[#E7E4DC] text-[#374151] text-[11px] font-semibold rounded-full px-2 py-1 border border-black/[0.04] cursor-pointer outline-none shrink-0"
                  >
                    <option value="All players">All players</option>
                    <option value="Backcourt">Backcourt</option>
                    <option value="Wings & Pivot">Wings &amp; Pivot</option>
                    <option value="Fast Break">Fast Break</option>
                  </select>
                  <button
                    type="button"
                    onClick={onShowTransfers}
                    className="bg-[#18191F] hover:bg-[#2A2D37] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full transition cursor-pointer whitespace-nowrap shrink-0"
                    title="Open Squad Reinforcement & Transfers"
                  >
                    Squad →
                  </button>
                </div>
              </div>

              {/* Authentic Handball Half-Court 6m / 9m SVG Diagram */}
              <div className="relative w-full rounded-[15px] bg-[#EFECE6] p-2">
                <svg
                  viewBox="0 0 220 116"
                  className="w-full h-auto block rounded-[10px]"
                  role="img"
                  aria-label="Handball half court shot chart"
                >
                  <rect x="0" y="0" width="220" height="116" rx="8" fill="#EAE0CE" />
                  <rect
                    x="12"
                    y="8"
                    width="196"
                    height="100"
                    fill="none"
                    stroke="#C5B59D"
                    strokeWidth="1.3"
                  />
                  <rect x="92" y="4" width="36" height="5" fill="#1E2638" rx="1" />
                  <line x1="92" y1="8" x2="128" y2="8" stroke={paintAccent} strokeWidth="2.4" />

                  <path
                    d="M 52 8 A 38 38 0 0 0 92 46 L 128 46 A 38 38 0 0 0 168 8 Z"
                    fill={paintAccent}
                    fillOpacity="0.13"
                    stroke="#B89F82"
                    strokeWidth="1.4"
                  />

                  <line x1="104" y1="56" x2="116" y2="56" stroke="#9C8870" strokeWidth="1.6" />

                  <path
                    d="M 24 8 A 66 66 0 0 0 92 74 L 128 74 A 66 66 0 0 0 196 8"
                    fill="none"
                    stroke="#B89F82"
                    strokeWidth="1.3"
                    strokeDasharray="4 4"
                  />

                  {filteredMarkers.map((m) => {
                    const cx = 14 + (m.x / 100) * 192;
                    const cy = 12 + (m.y / 100) * 92;
                    if (m.made) {
                      return (
                        <circle
                          key={m.id}
                          cx={cx}
                          cy={cy}
                          r="3.6"
                          fill={paintAccent}
                          opacity="0.92"
                        />
                      );
                    }
                    return (
                      <g
                        key={m.id}
                        transform={`translate(${cx}, ${cy})`}
                        stroke="#1E2638"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      >
                        <line x1="-2.6" y1="-2.6" x2="2.6" y2="2.6" />
                        <line x1="2.6" y1="-2.6" x2="-2.6" y2="2.6" />
                      </g>
                    );
                  })}
                </svg>

                {analytics.shotChart.isPreSeason && (
                  <div className="absolute inset-2 rounded-[10px] bg-[#EAE0CE]/70 flex items-center justify-center pointer-events-none px-3 text-center">
                    <span className="text-[11px] font-semibold text-[#525866]">
                      0 shots logged · Awaiting season kickoff
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-[#F5F4F0] rounded-[12px] py-1.5 px-2 flex flex-col items-center text-center">
                  <span className="text-[10px] font-medium text-[#525866]">6m Crease</span>
                  <span className="text-[15px] font-bold text-[#14161D] tabular-nums leading-tight">
                    {analytics.shotChart.isPreSeason ? '0%' : `${analytics.shotChart.creasePct}%`}
                  </span>
                </div>
                <div className="bg-[#F5F4F0] rounded-[12px] py-1.5 px-2 flex flex-col items-center text-center">
                  <span className="text-[10px] font-medium text-[#525866]">9m Range</span>
                  <span className="text-[15px] font-bold text-[#14161D] tabular-nums leading-tight">
                    {analytics.shotChart.isPreSeason ? '0%' : `${analytics.shotChart.backcourtPct}%`}
                  </span>
                </div>
                <div className="bg-[#F5F4F0] rounded-[12px] py-1.5 px-2 flex flex-col items-center text-center">
                  <span className="text-[10px] font-medium text-[#525866]">Wings</span>
                  <span className="text-[15px] font-bold text-[#14161D] tabular-nums leading-tight">
                    {analytics.shotChart.isPreSeason ? '0%' : `${analytics.shotChart.wingPct}%`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-[#686D7B]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: paintAccent }}
                    />
                    <span>Made</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-[#1E2638] leading-none">×</span>
                    <span>Missed</span>
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[#525866] tabular-nums">
                  {analytics.shotChart.shotsLogged} shots
                </span>
              </div>
            </section>

            {/* BENTO: Club Health (Mobile #2) */}
            <section
              aria-label="Club Health"
              data-bento="club-health"
              className="max-lg:order-2 courtside-card p-4 xl:p-[18px] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => (onOpenClubContext ? onOpenClubContext() : onOpenTeamModal(state.club))}
                  className="flex items-center gap-2 min-w-0 text-left cursor-pointer hover:opacity-80 transition"
                  title={`Inspect ${analytics.clubFullName}`}
                >
                  <ClubLogo
                    club={state.club}
                    name={analytics.clubFullName}
                    clubId={analytics.clubId}
                    color={analytics.clubColor}
                    color2={analytics.clubColor2}
                    logo={analytics.clubLogo}
                    fallbackLogo={analytics.clubFallbackLogo}
                    className="w-6 h-6 rounded-md object-contain shrink-0"
                  />
                  <h2 className="text-[15px] font-bold tracking-tight text-[#14161D] truncate">
                    Club Health
                  </h2>
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#525866] tabular-nums shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenTrophyCabinet ? onOpenTrophyCabinet() : onOpenTeamModal(state.club)
                    }
                    className="hover:text-[#14161D] hover:underline transition cursor-pointer"
                    title="Open Club Trophy Cabinet"
                  >
                    {analytics.trophyCollection.clubTotal}{' '}
                    {analytics.trophyCollection.clubTotal === 1 ? 'trophy' : 'trophies'}
                  </button>
                  <span aria-hidden="true">·</span>
                  <span>{formatNum(analytics.executiveRatings.fanBase)} fans</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {/* 1. OVR Tile */}
                <button
                  type="button"
                  onClick={onShowOvr}
                  className="bg-[#F5F4F0] hover:bg-[#ECEAE2] rounded-[13px] p-2.5 flex flex-col items-start text-left transition cursor-pointer"
                  title="Inspect Squad OVR History & Cap"
                >
                  <span className="text-[10px] font-semibold text-[#525866]">OVR</span>
                  <div className="flex items-baseline gap-1 mt-0.5 tabular-nums">
                    <span className="text-[19px] xl:text-[21px] font-extrabold text-[#14161D] leading-none">
                      {analytics.executiveRatings.ovr}
                    </span>
                    {analytics.executiveRatings.seasonOvrDelta !== 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          analytics.executiveRatings.seasonOvrDelta > 0
                            ? 'text-[#15803D]'
                            : 'text-[#C83232]'
                        }`}
                      >
                        {analytics.executiveRatings.seasonOvrDelta > 0
                          ? `+${analytics.executiveRatings.seasonOvrDelta}`
                          : analytics.executiveRatings.seasonOvrDelta}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#525866] mt-0.5 tabular-nums">
                    Cap {analytics.executiveRatings.maxOvrCap}
                  </span>
                </button>

                {/* 2. Impact Tile */}
                <button
                  type="button"
                  onClick={onShowImpact}
                  className="bg-[#F5F4F0] hover:bg-[#ECEAE2] rounded-[13px] p-2.5 flex flex-col items-start text-left transition cursor-pointer"
                  title="Inspect Club Impact & Board Confidence"
                >
                  <span className="text-[10px] font-semibold text-[#525866]">Impact</span>
                  <span className="text-[19px] xl:text-[21px] font-extrabold text-[#14161D] leading-none mt-0.5 tabular-nums">
                    {analytics.executiveRatings.impactScore}
                  </span>
                  <span className="text-[10px] text-[#525866] mt-0.5 tabular-nums">
                    {analytics.executiveRatings.immunityShields} Shields
                  </span>
                </button>

                {/* 3. Reputation Tile */}
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="bg-[#F5F4F0] hover:bg-[#ECEAE2] rounded-[13px] p-2.5 flex flex-col items-start text-left transition cursor-pointer"
                  title="Inspect Manager & Club Reputation"
                >
                  <span className="text-[10px] font-semibold text-[#525866]">Reputation</span>
                  <span className="text-[19px] xl:text-[21px] font-extrabold text-[#14161D] leading-none mt-0.5 tabular-nums">
                    {analytics.executiveRatings.reputation}
                  </span>
                  <span className="text-[10px] text-[#525866] mt-0.5 tabular-nums truncate max-w-full">
                    Prestige / 100
                  </span>
                </button>

                {/* 4. Media Heat Tile */}
                <button
                  type="button"
                  onClick={onOpenPressRoom}
                  className="bg-[#F5F4F0] hover:bg-[#ECEAE2] rounded-[13px] p-2.5 flex flex-col items-start text-left transition cursor-pointer"
                  title="Open Media Pressure & Press Conference"
                >
                  <span className="text-[10px] font-semibold text-[#525866]">
                    {mediaScore >= 40 ? 'Press Conference' : 'Media Heat'}
                  </span>
                  <span
                    className={`text-[19px] xl:text-[21px] font-extrabold leading-none mt-0.5 tabular-nums ${
                      mediaScore >= 68
                        ? 'text-[#C83232]'
                        : mediaScore >= 40
                        ? 'text-[#B45309]'
                        : 'text-[#14161D]'
                    }`}
                  >
                    {mediaScore}
                  </span>
                  <span className="text-[10px] text-[#525866] mt-0.5 truncate max-w-full">
                    {mediaScore >= 40 ? `${mediaStatusLabel} · Mics Live` : `${mediaStatusLabel} · /100`}
                  </span>
                </button>
              </div>

              {/* Clean Progress Bar for Board Impact */}
              <div className="flex flex-col gap-1 pt-0.5">
                <div className="flex items-center justify-between text-[11px] tabular-nums">
                  <span className="text-[#686D7B] font-medium">Board confidence</span>
                  <span className="font-bold text-[#14161D]">
                    {analytics.executiveRatings.impactScore}/100
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#ECEAE4] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, analytics.executiveRatings.impactScore)}%`,
                      backgroundColor: paintAccent,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* BENTO: Tactics & Squad (Mobile #5) */}
            <section
              aria-label="Tactics & Squad"
              data-bento="coach-tactics"
              className="max-lg:order-5 courtside-card p-4 xl:p-[18px] flex flex-col justify-between gap-3 lg:flex-1"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[15px] font-bold tracking-tight text-[#14161D]">
                    Tactics &amp; Squad
                  </h2>
                  <button
                    type="button"
                    onClick={onOpenSkills}
                    className="text-[11px] font-bold text-[#14161D] hover:opacity-75 transition cursor-pointer tabular-nums"
                    title="Open Manager Skill Tree"
                  >
                    {analytics.coachSummary.skillPoints} MP →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="flex items-center justify-between gap-2.5 p-2.5 rounded-[14px] bg-[#F5F4F0] hover:bg-[#ECEAE2] transition cursor-pointer text-left"
                  title="Open Head Coach & GM Profile"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                      style={{ backgroundColor: paintAccent }}
                    >
                      {analytics.coachSummary.gmInitials}
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-[13px] font-bold text-[#14161D] truncate">
                        {analytics.coachSummary.gmName}
                      </span>
                      <span className="text-[11px] text-[#686D7B] truncate">
                        {analytics.coachSummary.gmArchetype} · Yr {analytics.coachSummary.tenureYears}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 tabular-nums leading-tight">
                    <span className="text-[13px] font-bold text-[#14161D]">
                      {analytics.coachSummary.careerWinRate}%
                    </span>
                    <span className="text-[10px] text-[#525866]">Win %</span>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={onShowTransfers}
                    className="bg-[#F5F4F0] hover:bg-[#E7E4DC] rounded-[12px] p-2.5 flex flex-col items-start text-left min-w-0 transition cursor-pointer"
                    title="Manage Senior Squad & Transfers"
                  >
                    <span className="text-[10px] font-medium text-[#525866]">Squad Size</span>
                    <span className="text-[13px] font-extrabold text-[#14161D] tabular-nums truncate mt-0.5">
                      {state.club?.squadSize || 18} / 22
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onShowYouth}
                    className="bg-[#F5F4F0] hover:bg-[#E7E4DC] rounded-[12px] p-2.5 flex flex-col items-start text-left min-w-0 transition cursor-pointer"
                    title="Open Youth Academy & U19 Pipeline"
                  >
                    <span className="text-[10px] font-medium text-[#525866]">Youth Team Size</span>
                    <span className="text-[13px] font-extrabold text-[#14161D] tabular-nums truncate mt-0.5">
                      {activeYouthCount} / {youthSlotLimit}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-[#F5F4F0] rounded-[12px] p-2.5 flex flex-col min-w-0">
                    <span className="text-[10px] font-medium text-[#525866]">Active tactic</span>
                    <span className="text-[12px] font-bold text-[#14161D] truncate mt-0.5">
                      {analytics.coachSummary.tactic}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenPhilosophy}
                    className="bg-[#F5F4F0] hover:bg-[#E7E4DC] rounded-[12px] p-2.5 flex flex-col items-start text-left min-w-0 transition cursor-pointer"
                    title="Change Active Tactical System"
                  >
                    <span className="text-[10px] font-medium text-[#525866]">System</span>
                    <span className="text-[12px] font-bold text-[#14161D] truncate mt-0.5">
                      Change tactic →
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={onOpenCoachOverview}
                  className="py-2 px-3 rounded-full bg-[#F2F0EB] hover:bg-[#E6E3DB] text-[#14161D] text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  Coach Overview
                </button>
                <button
                  type="button"
                  onClick={onOpenRebuild}
                  className="py-2 px-3 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  Rebuild
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: COMMERCIAL (3D CLUB OFFICE EXTERIOR + 5 BENTO BOXES)           */}
      {/* ===================================================================== */}
      {activeTab === 'commercial' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-[18px] items-stretch">
          {/* LEFT COLUMN ON DESKTOP: 1. Treasury + 4. Loans */}
          <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            {/* BOX 1: TREASURY */}
            <section
              aria-label="Treasury"
              className="max-lg:order-2 courtside-card p-5 flex flex-col gap-3.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">Treasury</h3>
                <span className="text-[11px] font-medium text-[#6E7381]">
                  {(state.budget || 0) < 0 ? 'Overdraft' : 'Solvent'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#525866]">Available balance</span>
                <span
                  className={`text-[28px] xl:text-[30px] font-extrabold tracking-tight tabular-nums leading-tight mt-0.5 ${
                    (state.budget || 0) < 0 ? 'text-[#C83232]' : 'text-[#14161D]'
                  }`}
                >
                  {formatMoney(state.budget || 0, country)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#F6F5F1] rounded-2xl px-2.5 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block truncate">
                    Revenue
                  </span>
                  <span className="text-[12px] font-bold text-[#15803D] tabular-nums block truncate mt-0.5">
                    +{formatMoney(estRevenue, country)}
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-2.5 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block truncate">
                    Expenses
                  </span>
                  <span className="text-[12px] font-bold text-[#C83232] tabular-nums block truncate mt-0.5">
                    -{formatMoney(estExpenses, country)}
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-2.5 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block truncate">
                    Proj. net
                  </span>
                  <span
                    className={`text-[12px] font-bold tabular-nums block truncate mt-0.5 ${
                      projNet < 0 ? 'text-[#C83232]' : 'text-[#14161D]'
                    }`}
                  >
                    {projNet >= 0 ? '+' : ''}
                    {formatMoney(projNet, country)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onShowLedger}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation"
              >
                Inspect Financial Ledger
              </button>
            </section>

            {/* BOX 4: LOANS */}
            <section
              aria-label="Loans"
              className="max-lg:order-5 courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">Loans</h3>
                  <span className="text-[11px] font-medium text-[#6E7381] tabular-nums">
                    {state.activeLoan
                      ? `${state.activeLoan.yearsRemaining} yrs left`
                      : '10 · 15 · 25 yr'}
                  </span>
                </div>

                {state.activeLoan ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-[#525866]">
                        Remaining debt balance
                      </span>
                      <span className="text-[24px] xl:text-[26px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                        {formatMoney(state.activeLoan.remainingBalance, country)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                        <span className="text-[10px] font-medium text-[#525866] block">
                          Annual service
                        </span>
                        <span className="text-[12px] font-bold text-[#C83232] tabular-nums block mt-0.5">
                          -{formatMoney(state.activeLoan.annualPayment, country)}/yr
                        </span>
                      </div>
                      <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                        <span className="text-[10px] font-medium text-[#525866] block">
                          Interest rate
                        </span>
                        <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                          {Math.round(state.activeLoan.interestRate * 1000) / 10}% p.a.
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-[#525866]">
                        {(state.budget || 0) < 0 ? 'Debt consolidation line' : 'Available credit line'}
                      </span>
                      <span className="text-[24px] xl:text-[26px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                        +{formatMoney(previewLoanPrincipal, country)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                        <span className="text-[10px] font-medium text-[#525866] block">
                          15-yr est. service
                        </span>
                        <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                          {formatMoney(previewLoan15Yr.annualPayment, country)}/yr
                        </span>
                      </div>
                      <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                        <span className="text-[10px] font-medium text-[#525866] block">
                          Facility status
                        </span>
                        <span className="text-[12px] font-bold text-[#15803D] block mt-0.5">
                          Debt-free
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={onShowLoan}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer touch-manipulation"
              >
                {state.activeLoan ? 'Manage Loan & Payoff' : 'Open Credit Facility'}
              </button>
            </section>
          </div>

          {/* CENTER COLUMN ON DESKTOP: 3D Club Office Exterior + 2. Sponsorship Deals */}
          <div className="contents lg:col-span-6 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            {/* 3D CLUB OFFICE EXTERIOR */}
            <div className="max-lg:order-1 md:max-lg:col-span-2 w-full">
              <ClubOfficeExteriorCard
                club={state.club}
                clubFullName={analytics.clubFullName}
                clubShortName={analytics.clubShortName}
                clubId={analytics.clubId}
                clubColor={analytics.clubColor}
                clubColor2={analytics.clubColor2}
                clubLogo={analytics.clubLogo}
                clubFallbackLogo={analytics.clubFallbackLogo}
                country={country}
                reputation={state.reputation ?? 50}
                budget={state.budget || 0}
                estRevenue={estRevenue}
                projNet={projNet}
                fanBase={state.club?.fanBase || 1500}
                signedSponsorCount={signedSponsorCount}
                hasActiveLoan={Boolean(state.activeLoan)}
                academyLevel={academyLevel}
                medicalLevel={medicalLevel}
                onOpenLedger={onShowLedger}
                onOpenSponsors={() => onShowSponsors(0)}
                onOpenIPO={onShowIPO}
                onOpenClubProfile={onOpenClubProfile}
              />
            </div>

            {/* BOX 2: SPONSORSHIP DEALS */}
            <section
              aria-label="Sponsorship Deals"
              className="max-lg:order-3 md:max-lg:col-span-2 courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                    Sponsorship Deals
                  </h3>
                  <p className="text-[11px] font-medium text-[#6E7381] mt-0.5">
                    <span>
                      {signedSponsorCount > 0
                        ? `${signedSponsorCount} active partner${signedSponsorCount > 1 ? 's' : ''}`
                        : 'Commercial desk open'}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">
                      Season income +{formatMoney(state.sponsorIncome || 0, country)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onShowSponsors(0)}
                  className="min-h-[40px] py-2 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap touch-manipulation"
                >
                  Negotiate Sponsors
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => onShowSponsors(0)}
                  className="bg-[#F6F5F1] hover:bg-[#ECEAE3] rounded-2xl p-3 text-left transition cursor-pointer"
                >
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Standard Partner
                  </span>
                  <span className="text-sm font-extrabold text-[#14161D] tabular-nums block mt-0.5">
                    +{formatMoney(sponsorTerms.standardPayout, country)}
                  </span>
                  <span className="text-[11px] text-[#6E7381] block truncate mt-0.5">
                    Guaranteed upfront
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onShowSponsors(1)}
                  className="bg-[#F6F5F1] hover:bg-[#ECEAE3] rounded-2xl p-3 text-left transition cursor-pointer"
                >
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Corporate Megadeal
                  </span>
                  <span className="text-sm font-extrabold text-[#15803D] tabular-nums block mt-0.5">
                    +{formatMoney(sponsorTerms.megaPayout, country)}
                  </span>
                  <span className="text-[11px] text-[#6E7381] tabular-nums block truncate mt-0.5">
                    {sponsorTerms.megaSuccessPct}% pitch approval
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onShowSponsors(2)}
                  className="bg-[#F6F5F1] hover:bg-[#ECEAE3] rounded-2xl p-3 text-left transition cursor-pointer"
                >
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Performance Bonus
                  </span>
                  <span className="text-sm font-extrabold text-[#14161D] tabular-nums block mt-0.5">
                    +{formatMoney(sponsorTerms.performanceBonus, country)}
                  </span>
                  <span className="text-[11px] text-[#6E7381] tabular-nums block truncate mt-0.5">
                    Top-{sponsorTerms.performanceTargetPos} target
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onShowSponsors(3)}
                  className="bg-[#F6F5F1] hover:bg-[#ECEAE3] rounded-2xl p-3 text-left transition cursor-pointer"
                >
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Stadium Naming
                  </span>
                  <span className="text-sm font-extrabold text-[#15803D] tabular-nums block mt-0.5">
                    +{formatMoney(
                      state.namingRightsDeal?.annualPayout ||
                        sponsorTerms.namingOffers?.[0]?.annualPayout ||
                        sponsorTerms.namingBaseAnnual ||
                        250000,
                      country
                    )}
                    /yr
                  </span>
                  <span className="text-[11px] text-[#6E7381] block truncate mt-0.5">
                    {state.namingRightsDeal && state.namingRightsDeal.yearsRemaining > 0
                      ? `${state.namingRightsDeal.arenaName} · ${state.namingRightsDeal.yearsRemaining}y`
                      : 'Name the stadium'}
                  </span>
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN ON DESKTOP: 3. Marketing & PR + 5. Go Public / IPO */}
          <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            {/* BOX 3: MARKETING & PR */}
            <section
              aria-label="Marketing & PR"
              className="max-lg:order-4 courtside-card p-5 flex flex-col gap-3.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                  Marketing &amp; PR
                </h3>
                <span className="text-[11px] font-medium text-[#6E7381]">
                  {mediaStatusLabel} press
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#525866]">Active supporter base</span>
                <span className="text-[28px] xl:text-[30px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                  {formatNum(state.club?.fanBase || 1500)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Brand stature
                  </span>
                  <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {Math.round(state.reputation ?? 50)} / 100
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Media heat
                  </span>
                  <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {mediaScore} / 100
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onShowMarketing}
                  className="flex-1 min-h-[42px] py-2.5 px-3.5 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap touch-manipulation"
                >
                  Campaigns &amp; PR
                </button>
                <button
                  type="button"
                  onClick={onOpenPressRoom}
                  className="min-h-[42px] py-2.5 px-3.5 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer whitespace-nowrap touch-manipulation"
                >
                  Press
                </button>
              </div>
            </section>

            {/* BOX 5: GO PUBLIC / IPO */}
            <section
              aria-label="Go Public / IPO"
              className="max-lg:order-6 courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                    Go Public / IPO
                  </h3>
                  <span
                    className={`text-[11px] font-semibold ${
                      state.club?.isPublic
                        ? 'text-[#15803D]'
                        : ipoEligibility.eligible
                        ? 'text-[#15803D]'
                        : 'text-[#B45309]'
                    }`}
                  >
                    {state.club?.isPublic
                      ? 'Listed PLC'
                      : ipoEligibility.eligible
                      ? 'IPO Eligible'
                      : ipoEligibility.primaryBlocker || 'IPO Locked'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-[#525866]">
                    Estimated equity valuation
                  </span>
                  <span className="text-[24px] xl:text-[26px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                    {formatMoney(commercialOfficeModel.trueValuation, country)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      {state.club?.isPublic ? 'Live share price' : 'Indicative IPO'}
                    </span>
                    <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                      {currencySymbol}
                      {commercialOfficeModel.effectiveStockPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      {state.club?.isPublic ? 'Since IPO' : 'Listing status'}
                    </span>
                    <span
                      className={`text-[12px] font-bold tabular-nums block mt-0.5 truncate ${
                        state.club?.isPublic
                          ? commercialOfficeModel.stockDeltaPct >= 0
                            ? 'text-[#15803D]'
                            : 'text-[#C83232]'
                          : ipoEligibility.eligible
                          ? 'text-[#15803D]'
                          : 'text-[#525866]'
                      }`}
                    >
                      {state.club?.isPublic
                        ? `${commercialOfficeModel.stockDeltaPct >= 0 ? '+' : ''}${commercialOfficeModel.stockDeltaPct}%`
                        : ipoEligibility.eligible
                        ? '4/4 Ready'
                        : `${ipoEligibility.checks.filter((c) => c.passed).length}/4 Ready`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onShowIPO}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer touch-manipulation"
              >
                {state.club?.isPublic
                  ? 'Open Stock Exchange'
                  : ipoEligibility.eligible
                  ? 'Go Public / Launch IPO'
                  : 'View IPO Requirements'}
              </button>
            </section>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SQUAD (3D TRAINING GYM WARMUP + 5 BENTO BOXES)                 */}
      {/* ===================================================================== */}
      {activeTab === 'squad' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-[18px] items-stretch">
          {/* LEFT COLUMN ON DESKTOP: 1. Squad Overview + 4. Youth Tournament */}
          <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            {/* BOX 1: SQUAD OVERVIEW */}
            <section
              aria-label="Squad Overview"
              className="max-lg:order-2 courtside-card p-5 flex flex-col gap-3.5"
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClubLogo
                    club={state.club}
                    name={analytics.clubFullName}
                    clubId={analytics.clubId}
                    color={analytics.clubColor}
                    color2={analytics.clubColor2}
                    logo={analytics.clubLogo}
                    fallbackLogo={analytics.clubFallbackLogo}
                    className="w-8 h-8 rounded-lg object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight truncate">
                      Squad Overview
                    </h3>
                    <span className="text-[11px] font-medium text-[#525866] block truncate">
                      {state.club?.name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onShowOvr}
                  className="px-3 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#EAE8E1] text-[#14161D] text-xs font-extrabold tabular-nums transition cursor-pointer shrink-0"
                >
                  OVR {state.club?.baseOvr || 75}
                </button>
              </div>

              {/* Funds Available Hero Metric */}
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#525866]">Funds available</span>
                <span
                  className={`text-[26px] xl:text-[28px] font-extrabold tracking-tight tabular-nums leading-tight mt-0.5 ${
                    (state.budget ?? 0) < 0 ? 'text-[#C83232]' : 'text-[#14161D]'
                  }`}
                >
                  {formatMoney(state.budget, country)}
                </span>
              </div>

              {/* 2x2 Grid: OVR, Squad Size, Morale, Youth Slots */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">Team OVR</span>
                  <span className="text-[13px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {state.club?.baseOvr || 75} OVR
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">Squad size</span>
                  <span className="text-[13px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {state.club?.squadSize || 18} / 22
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">Morale</span>
                  <span className="text-[13px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {state.club?.morale ?? 75}%
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">Youth slots</span>
                  <span className="text-[13px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {activeYouthCount} / {youthSlotLimit}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onShowOvr}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
              >
                OVR &amp; Squad Breakdown
              </button>
            </section>

            {/* BOX 4: YOUTH TOURNAMENT */}
            <section
              aria-label="Youth Tournament"
              className="max-lg:order-5 courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                    Youth Tournament
                  </h3>
                  <span className="text-[11px] font-medium text-[#6E7381] tabular-nums">
                    {hasPlayedYouthCupThisSeason
                      ? `Played ${state.year}`
                      : `${activeYouthCount}/6 U19s`}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-[#525866]">
                    U19 National Championship
                  </span>
                  <span className="text-[24px] xl:text-[26px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                    {u19CohortOvr} Cohort OVR
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Champion bonus
                    </span>
                    <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                      +1 OVR · +15%
                    </span>
                  </div>
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Youth titles
                    </span>
                    <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                      {state.youthTitlesWon || 0} won
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onShowYouthTournament}
                className={`w-full min-h-[42px] py-2.5 px-4 rounded-full text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap ${
                  canEnterYouthCupNow
                    ? 'bg-[#DF642A] hover:bg-[#c8551f] text-white'
                    : 'bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D]'
                }`}
              >
                {canEnterYouthCupNow
                  ? 'Enter Youth Tournament'
                  : hasPlayedYouthCupThisSeason
                  ? 'Review U19 Cohort'
                  : `Recruit U19s (${activeYouthCount}/6 Ready)`}
              </button>
            </section>
          </div>

          {/* CENTER COLUMN ON DESKTOP: 3D Handball Training Gym (First on Mobile) + 2. Transfer Market */}
          <div className="contents lg:col-span-6 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            <div className="max-lg:order-1 md:max-lg:col-span-2 w-full">
              <TrainingGymWarmupCard
                analytics={analytics}
                club={state.club}
                tactic={state.tactic || 'Balanced 6-0'}
                squadSize={state.club?.squadSize || 18}
                morale={state.club?.morale ?? 75}
                baseOvr={state.club?.baseOvr || 75}
                activeYouthCount={activeYouthCount}
                youthSlotLimit={youthSlotLimit}
                designId={activeArenaDesign}
                sponsors={activeSponsorBrands}
                onOpenTactics={onOpenPhilosophy}
                onOpenOvr={onShowOvr}
                onOpenTeamModal={onOpenTeamModal}
              />
            </div>

            {/* BOX 2: TRANSFER MARKET */}
            <section
              aria-label="Transfer Market"
              className="max-lg:order-3 md:max-lg:col-span-2 courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                      Transfer Market
                    </h3>
                    <p className="text-xs text-[#6E7381] mt-0.5">
                      Sign starters, marquee superstars, short-term loans &amp; negotiate player sales.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#14161D] tabular-nums">
                    {signingsCountThisSeason} moves · {state.squadSalesThisSeason || 0} sales
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  <div className="bg-[#F6F5F1] rounded-2xl p-3 min-w-0">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Transfer budget
                    </span>
                    <span className="text-sm font-bold text-[#14161D] tabular-nums mt-0.5 block truncate">
                      {formatMoney(state.budget, country)}
                    </span>
                  </div>
                  <div className="bg-[#F6F5F1] rounded-2xl p-3 min-w-0">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Season spend
                    </span>
                    <span className="text-sm font-bold text-[#14161D] tabular-nums mt-0.5 block truncate">
                      {formatMoney(state.transferSpend || 0, country)}
                    </span>
                  </div>
                  <div className="bg-[#F6F5F1] rounded-2xl p-3 min-w-0 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Active system
                    </span>
                    <span className="text-sm font-bold text-[#14161D] mt-0.5 block truncate">
                      {state.tactic || 'Balanced'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={onShowTransfers}
                  className="flex-1 min-h-[42px] py-2.5 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
                >
                  Open Transfer Market
                </button>
                <button
                  type="button"
                  onClick={onOpenPhilosophy}
                  className="min-h-[42px] py-2.5 px-4 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
                >
                  Tactics &amp; Rebuild
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN ON DESKTOP: 3. Youth Academy + 5. Team Retreat */}
          <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            {/* BOX 3: YOUTH ACADEMY */}
            <section
              aria-label="Youth Academy"
              className="max-lg:order-4 courtside-card p-5 flex flex-col gap-3.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                  Youth Academy
                </h3>
                <span className="text-[11px] font-medium text-[#6E7381] tabular-nums">
                  Lvl {academyLevel}/5
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#525866]">
                  Enrolled U19 prospects
                </span>
                <span className="text-[28px] xl:text-[30px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                  {activeYouthCount} / {youthSlotLimit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Scouts used
                  </span>
                  <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {state.youthScoutsThisSeason || 0} / {academyLevel}
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Promotions
                  </span>
                  <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {state.youthPullsThisSeason || 0} called up
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onShowYouth}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
              >
                Open Youth Academy
              </button>
            </section>

            {/* BOX 5: TEAM RETREAT */}
            <section
              aria-label="Team Retreat"
              className="max-lg:order-6 courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                    Team Retreat
                  </h3>
                  <span className="text-[11px] font-medium text-[#6E7381] tabular-nums">
                    {state.teamBondingThisSeason || 0}/1 used
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-[#525866]">
                    Dressing room morale
                  </span>
                  <span className="text-[28px] xl:text-[30px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                    {state.club?.morale ?? 75}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Harmony effect
                    </span>
                    <span className="text-[12px] font-bold text-[#15803D] tabular-nums block mt-0.5">
                      +30% Morale
                    </span>
                  </div>
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Camp fee
                    </span>
                    <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5 truncate">
                      {formatMoney(retreatCost, country)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onTeamBonding}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
              >
                {(state.teamBondingThisSeason || 0) >= 1
                  ? 'Retreat Completed This Season'
                  : 'Organize Team Retreat'}
              </button>
            </section>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: INFRASTRUCTURE (EMPTY 3D ARENA + COURT DESIGN + 4 BENTO BOXES) */}
      {/* ===================================================================== */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-[18px] items-stretch">
          {/* Left Column on Desktop / Second on Mobile: Venue + Court Design, 1. Fan Strategy, 2. Club Facilities */}
          <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col gap-4 lg:h-full">
            {/* ARENA & MATCHDAY VENUE + 40x20m COURT DESIGN */}
            <section
              aria-label="Arena and Court Design"
              className="courtside-card p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClubLogo
                    club={state.club}
                    name={analytics.clubFullName}
                    clubId={analytics.clubId}
                    color={analytics.clubColor}
                    color2={analytics.clubColor2}
                    logo={analytics.clubLogo}
                    fallbackLogo={analytics.clubFallbackLogo}
                    className="w-8 h-8 rounded-lg object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-[#525866] block">
                      Arena &amp; Matchday Venue
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[#14161D] truncate">
                      {analytics.arenaName}
                    </h2>
                  </div>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <span className="text-xs font-bold text-[#14161D] block">
                    {formatNum(liveClubCapacity)} / {formatNum(pinnacleCap)} Seats
                  </span>
                  <span className="text-[10px] font-medium text-[#686D7B] block">
                    Avg. {formatNum(liveClubAttendance)} ({liveUtilPct}% full)
                  </span>
                </div>
              </div>

              {/* 4 Selectable 40x20m Handball Court & Arena Designs */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#14161D]">
                    40×20m Court Design
                  </span>
                  <span className="text-[10px] text-[#525866]">
                    Applies to Matchday &amp; Arena
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Select 40x20m Handball Arena Court Design"
                  className="grid grid-cols-2 gap-2"
                >
                  {ARENA_DESIGN_LIST.map((preset) => {
                    const isSelected = activeArenaDesign === preset.id;
                    const swatchCrease =
                      preset.creasePaintOverride || analytics.arenaColors.courtPaintColor;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectArenaDesign(preset.id)}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 min-h-[60px] ${
                          isSelected
                            ? 'bg-[#18191F] text-white border-[#18191F] shadow-xs'
                            : 'bg-[#F5F4F0] hover:bg-[#EAE8E1] text-[#14161D] border-black/[0.05]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate">{preset.name}</span>
                          <span className="flex items-center gap-1 shrink-0">
                            <span
                              className="w-3 h-3 rounded-full border border-white/40"
                              style={{ backgroundColor: preset.floorStops[1] }}
                            />
                            <span
                              className="w-3 h-3 rounded-full border border-white/40"
                              style={{ backgroundColor: swatchCrease }}
                            />
                          </span>
                        </div>
                        <span
                          className={`text-[10px] leading-snug line-clamp-2 ${
                            isSelected ? 'text-zinc-300' : 'text-[#6E7381]'
                          }`}
                        >
                          {preset.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => onShowArenaOverview('trend')}
                  className="flex-1 min-h-[42px] py-2.5 px-3 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  5-Year Attendance Analytics
                </button>
                <button
                  type="button"
                  onClick={onOpenCustomization}
                  className="min-h-[42px] py-2.5 px-4 rounded-full bg-[#F2F0EB] hover:bg-[#E5E2DA] text-[#14161D] text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  Customize Club
                </button>
              </div>
            </section>

            {/* BOX 1: FAN STRATEGY (HOME FORTRESS, GRASSROOTS, VIP, BALANCED) */}
            <section
              aria-label="Fan Strategy"
              className="courtside-card p-5 flex flex-col gap-3.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                    Fan Strategy
                  </h3>
                  <p className="text-[11px] text-[#6E7381] mt-0.5">
                    Set matchday ticket policy, atmosphere &amp; supporter focus.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#14161D] shrink-0">
                  {activeFanStrategy === 'ultras'
                    ? 'Home Fortress'
                    : activeFanStrategy === 'community'
                    ? 'Grassroots'
                    : activeFanStrategy === 'corporate'
                    ? 'VIP'
                    : 'Balanced'}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Select Fan Strategy"
                className="grid grid-cols-2 gap-2"
              >
                {(
                  [
                    {
                      key: 'ultras',
                      label: 'Home Fortress',
                      sub: '+2 Home OVR · -8% Ticket Yield',
                    },
                    {
                      key: 'community',
                      label: 'Grassroots',
                      sub: '+25% Fan Growth & Youth Pull',
                    },
                    {
                      key: 'corporate',
                      label: 'VIP',
                      sub: '+30% Matchday Rev · -1 OVR',
                    },
                    {
                      key: 'balanced',
                      label: 'Balanced',
                      sub: 'Standard Gate Yield · +0 OVR',
                    },
                  ] as const
                ).map((item) => {
                  const isActive = activeFanStrategy === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => useGameStore.getState().setFanStrategy(item.key)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 min-h-[60px] ${
                        isActive
                          ? 'bg-[#18191F] text-white border-[#18191F]'
                          : 'bg-[#F5F4F0] hover:bg-[#EAE8E1] text-[#14161D] border-black/[0.05]'
                      }`}
                    >
                      <span className="text-xs font-bold">{item.label}</span>
                      <span
                        className={`text-[10px] leading-snug ${
                          isActive ? 'text-zinc-300' : 'text-[#6E7381]'
                        }`}
                      >
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* BOX 2: CLUB FACILITIES */}
            <section
              aria-label="Club Facilities"
              className="courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                    Club Facilities
                  </h3>
                  <p className="text-[11px] text-[#6E7381] mt-0.5">
                    Youth Academy campus &amp; Sports Medicine department upgrades.
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[#6E7381] tabular-nums shrink-0">
                  {infraUsedThisSeason}/2 upgrades
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onUpgradeAcademy}
                  className="p-3.5 rounded-2xl bg-[#F5F4F0] hover:bg-[#EAE8E1] text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#14161D] tabular-nums">
                    Youth Academy (Lvl {academyLevel}/5)
                  </div>
                  <div className="text-[11px] text-[#6E7381] mt-1 tabular-nums">
                    {academyLevel < 5
                      ? `Upgrade · ${formatMoney(academyCost, country)}`
                      : 'Maximum Level Reached'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onUpgradeMedical}
                  className="p-3.5 rounded-2xl bg-[#F5F4F0] hover:bg-[#EAE8E1] text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-[#14161D] tabular-nums">
                    Medical Dept (Lvl {medicalLevel}/5)
                  </div>
                  <div className="text-[11px] text-[#6E7381] mt-1 tabular-nums">
                    {medicalLevel < 5
                      ? `Upgrade · ${formatMoney(medicalCost, country)}`
                      : 'Maximum Level Reached'}
                  </div>
                </button>
              </div>
            </section>
          </div>

          {/* Right Column on Desktop / First on Mobile: Empty 3D Handball Arena + 3. Arena Expansion + 4. New Arena Complex */}
          <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col gap-4 lg:h-full">
            <CourtSimulationCard
              variant="infrastructure"
              analytics={analytics}
              club={state.club}
              simState={state}
              tactic={state.tactic || 'Balanced 6-0'}
              isFirstHalf={isFirstHalf}
              hasSupercup={false}
              mediaPressureScore={mediaScore}
              lang={lang}
              overrideCapacity={liveClubCapacity}
              overrideAttendance={0}
              overrideDesignId={activeArenaDesign}
              sponsors={activeSponsorBrands}
              onSimulate={onSimulate}
              onOpenTactics={onOpenPhilosophy}
              onOpenPressRoom={onOpenPressRoom}
              onOpenArena={() => onShowArenaOverview('market')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:flex-1 items-stretch">
              {/* BOX 3: ARENA EXPANSION */}
              <section
                aria-label="Arena Expansion"
                className="courtside-card p-5 flex flex-col justify-between gap-3.5"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                      Arena Expansion
                    </h3>
                    <span className="text-[11px] font-medium text-[#6E7381] tabular-nums">
                      +500 / tier
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-[#525866]">
                      Current seating bowl
                    </span>
                    <span className="text-[24px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                      {formatNum(liveClubCapacity)} / {formatNum(pinnacleCap)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E7381] leading-relaxed">
                    Add tribune seating rings to boost matchday ticket revenue and home-court capacity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onShowStadium}
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
                >
                  Expand Arena Stands
                </button>
              </section>

              {/* BOX 4: NEW ARENA COMPLEX */}
              <section
                aria-label="New Arena Complex"
                className="courtside-card p-5 flex flex-col justify-between gap-3.5"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                      New Arena Complex
                    </h3>
                    <span className="text-[11px] font-medium text-[#6E7381]">
                      10–25 yr credit
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-[#525866]">
                      Landmark capacity ceiling
                    </span>
                    <span className="text-[24px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                      Up to {formatNum(pinnacleCap)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E7381] leading-relaxed">
                    Commission a multi-tier modern handball palace via cash treasury or municipal credit (+10 Impact).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onShowNewBuild}
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
                >
                  Commission New Arena
                </button>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: BOARD & MANAGER (3D BOARDROOM TABLE + 6 SURROUNDING BENTO BOXES) */}
      {/* ===================================================================== */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-[18px] items-stretch">
          {/* LEFT COLUMN: 1. Manager Overview + 2. Club Impact */}
          <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            {/* BOX 1: MANAGER OVERVIEW */}
            <section
              aria-label="Manager Overview"
              className="max-lg:order-2 courtside-card p-5 flex flex-col gap-3.5"
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClubLogo
                    club={state.club}
                    name={analytics.clubFullName}
                    clubId={analytics.clubId}
                    color={analytics.clubColor}
                    color2={analytics.clubColor2}
                    logo={analytics.clubLogo}
                    fallbackLogo={analytics.clubFallbackLogo}
                    className="w-8 h-8 rounded-lg object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight truncate">
                      Manager Overview
                    </h3>
                    <span className="text-[11px] font-medium text-[#525866] block truncate">
                      {state.managerName || 'General Manager'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F5F4F0] text-[#14161D] text-[11px] font-bold tabular-nums shrink-0">
                  Yr {analytics.coachSummary.tenureYears}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Career win rate
                  </span>
                  <span className="text-[16px] font-extrabold text-[#14161D] tabular-nums block mt-0.5">
                    {analytics.coachSummary.careerWinRate}%
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Archetype
                  </span>
                  <span className="text-[12px] font-bold text-[#14161D] block mt-1 truncate">
                    {analytics.coachSummary.gmArchetype}
                  </span>
                </div>
              </div>

              <div className="bg-[#F6F5F1] rounded-2xl px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-[#525866]">
                    Current board mandate
                  </span>
                  <span className="text-[10px] font-bold text-[#14161D] tabular-nums">
                    Top {state.boardTargetPos || 8}
                  </span>
                </div>
                <p className="text-[12px] font-semibold text-[#14161D] leading-snug mt-0.5 line-clamp-2">
                  {state.boardExpectation || 'Mid-table consolidation'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="flex-1 min-h-[40px] py-2 px-3 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
                >
                  Manager Dossier
                </button>
                <button
                  type="button"
                  onClick={onOpenBoardExpectations}
                  className="min-h-[40px] py-2 px-3.5 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
                >
                  Mandate
                </button>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-black/[0.05]">
                <button
                  type="button"
                  onClick={onOpenClubProfile}
                  className="text-[11px] font-semibold text-[#525866] hover:text-[#14161D] cursor-pointer transition"
                >
                  Club Heritage →
                </button>
                <button
                  type="button"
                  onClick={onRetire}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer transition"
                >
                  Retire Career
                </button>
              </div>
            </section>

            {/* BOX 2: CLUB IMPACT */}
            <section
              aria-label="Club Impact"
              className="max-lg:order-3 courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                    Club Impact
                  </h3>
                  <span className="text-[11px] font-medium text-[#6E7381] tabular-nums">
                    {analytics.executiveRatings.immunityShields}{' '}
                    {analytics.executiveRatings.immunityShields === 1 ? 'shield' : 'shields'}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-[#525866]">
                    Board standing score
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[28px] xl:text-[30px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-none">
                      {analytics.executiveRatings.impactScore}
                    </span>
                    <span className="text-xs font-semibold text-[#525866] tabular-nums">/ 100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#EFECE5] overflow-hidden mt-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, analytics.executiveRatings.impactScore))}%`,
                        backgroundColor:
                          analytics.executiveRatings.impactScore >= 72
                            ? '#15803D'
                            : analytics.executiveRatings.impactScore >= 45
                            ? '#DF642A'
                            : '#C83232',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Trophy count
                    </span>
                    <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                      {analytics.trophyCollection.clubTotal} total
                    </span>
                  </div>
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Position
                    </span>
                    <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5 truncate">
                      {analytics.gamesPlayed > 0
                        ? `#${analytics.rankPos} of ${analytics.leagueSize}`
                        : `Pre-Season · #${analytics.rankPos}`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onShowImpact}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
              >
                Open Club Impact
              </button>
            </section>
          </div>

          {/* CENTER COLUMN: 3D Boardroom Table + Bottom Pair (Board Roadmap & Manager Skills) */}
          <div className="contents lg:col-span-6 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            <div className="max-lg:order-1 md:max-lg:col-span-2 w-full">
              <BoardroomTableCard
                club={state.club}
                clubFullName={analytics.clubFullName}
                clubShortName={analytics.clubShortName}
                clubId={analytics.clubId}
                clubColor={analytics.clubColor}
                clubColor2={analytics.clubColor2}
                clubLogo={analytics.clubLogo}
                clubFallbackLogo={analytics.clubFallbackLogo}
                managerName={state.managerName || 'General Manager'}
                archetype={analytics.coachSummary.gmArchetype}
                skillPoints={state.skillPoints || 0}
                impactScore={analytics.executiveRatings.impactScore}
                immunityShields={analytics.executiveRatings.immunityShields}
                reputation={analytics.executiveRatings.reputation}
                mediaScore={mediaScore}
                trophyTotal={analytics.trophyCollection.clubTotal}
                signedSponsorCount={activeSponsorBrands.length}
                completedGoals={boardRoadmapSummary.completedGoals}
                totalGoals={boardRoadmapSummary.totalGoals}
                onOpenBoardExpectations={onOpenBoardExpectations}
                onOpenImpact={onShowImpact}
                onOpenRoadmap={onOpenRoadmap}
                onOpenProfile={onOpenProfile}
              />
            </div>

            <div className="contents lg:grid lg:grid-cols-2 lg:gap-[18px] lg:flex-1 items-stretch">
              {/* BOX 4: BOARD ROADMAP */}
              <section
                aria-label="Board Roadmap"
                className="max-lg:order-5 courtside-card p-5 flex flex-col justify-between gap-3.5 h-full"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                      Board Roadmap
                    </h3>
                    <span className="text-[11px] font-semibold text-[#6E7381] tabular-nums">
                      {boardRoadmapSummary.horizonLabel}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-[#525866] truncate">
                      {boardRoadmapSummary.title}
                    </span>
                    <span className="text-[26px] xl:text-[28px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                      {boardRoadmapSummary.completedGoals} / {boardRoadmapSummary.totalGoals} Goals
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                      <span className="text-[10px] font-medium text-[#525866] block">
                        Confidence
                      </span>
                      <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                        {boardRoadmapSummary.confidence}%
                      </span>
                    </div>
                    <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                      <span className="text-[10px] font-medium text-[#525866] block">
                        Next reward
                      </span>
                      <span className="text-[12px] font-bold text-[#DF642A] tabular-nums block mt-0.5">
                        +MP Directives
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenRoadmap}
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
                >
                  Open Board Roadmap
                </button>
              </section>

              {/* BOX 6: MANAGER SKILLS */}
              <section
                aria-label="Manager Skills"
                className="max-lg:order-7 courtside-card p-5 flex flex-col justify-between gap-3.5 h-full"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                      Manager Skills
                    </h3>
                    <span className="text-[11px] font-semibold text-[#14161D] tabular-nums">
                      {state.skillPoints || 0} MP
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-[#525866]">
                      Unlocked executive perks
                    </span>
                    <span className="text-[26px] xl:text-[28px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-tight mt-0.5">
                      {activeManagerSkills.length} / {totalManagerSkillsCount}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                      <span className="text-[10px] font-medium text-[#525866] block">
                        Unspent points
                      </span>
                      <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                        {state.skillPoints || 0} MP
                      </span>
                    </div>
                    <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                      <span className="text-[10px] font-medium text-[#525866] block">
                        Status
                      </span>
                      <span className="text-[12px] font-bold text-[#15803D] block mt-0.5 truncate">
                        {activeManagerSkills.length > 0 ? 'Perks Active' : 'Ready to Unlock'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenSkills}
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
                >
                  Open Manager Skills
                </button>
              </section>
            </div>
          </div>

          {/* RIGHT COLUMN: 3. Media Impact + 5. Job Market */}
          <div className="contents lg:col-span-3 lg:flex lg:flex-col lg:gap-[18px] lg:h-full">
            {/* BOX 3: MEDIA IMPACT */}
            <section
              aria-label="Media Impact"
              className="max-lg:order-4 courtside-card p-5 flex flex-col gap-3.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                  Media Impact
                </h3>
                <span
                  className={`text-[11px] font-bold ${
                    mediaScore >= 68
                      ? 'text-[#C83232]'
                      : mediaScore >= 45
                      ? 'text-[#DF642A]'
                      : 'text-[#15803D]'
                  }`}
                >
                  {mediaStatusLabel}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#525866]">
                  Press scrutiny level
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-[28px] xl:text-[30px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-none">
                    {mediaScore}
                  </span>
                  <span className="text-xs font-semibold text-[#525866] tabular-nums">/ 100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">
                    Coach heat
                  </span>
                  <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                    {analytics.coachSummary.coachHeat}/100
                  </span>
                </div>
                <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-[#525866] block">
                    {mediaScore >= 40 ? 'Press stage' : 'Narrative'}
                  </span>
                  <span className="text-[12px] font-bold text-[#14161D] block mt-0.5 truncate">
                    {mediaScore >= 68
                      ? 'Mics Live · Crisis'
                      : mediaScore >= 40
                      ? 'Press Conference'
                      : 'Stable'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenPressRoom}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#18191F] hover:bg-[#2A2D37] text-white text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
              >
                {mediaScore >= 40 ? 'Enter Press Conference' : 'Open Press Room'}
              </button>
            </section>

            {/* BOX 5: JOB MARKET */}
            <section
              aria-label="Job Market"
              className="max-lg:order-6 courtside-card p-5 flex flex-col justify-between gap-3.5 lg:flex-1"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-[#14161D] tracking-tight">
                    Job Market
                  </h3>
                  <span className="text-[11px] font-medium text-[#6E7381] tabular-nums">
                    Tier {state.club?.tier || 1} Club
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-[#525866]">
                    Executive reputation
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[28px] xl:text-[30px] font-extrabold text-[#14161D] tracking-tight tabular-nums leading-none">
                      {analytics.executiveRatings.reputation}
                    </span>
                    <span className="text-xs font-semibold text-[#525866] tabular-nums">/ 100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      Career silverware
                    </span>
                    <span className="text-[12px] font-bold text-[#14161D] tabular-nums block mt-0.5">
                      {state.totals?.trophies || 0} {(state.totals?.trophies || 0) === 1 ? 'trophy' : 'trophies'}
                    </span>
                  </div>
                  <div className="bg-[#F6F5F1] rounded-2xl px-3 py-2.5">
                    <span className="text-[10px] font-medium text-[#525866] block">
                      League appeal
                    </span>
                    <span className="text-[12px] font-bold text-[#14161D] block mt-0.5 truncate">
                      {analytics.executiveRatings.reputation >= 75
                        ? 'Elite'
                        : analytics.executiveRatings.reputation >= 50
                        ? 'Strong'
                        : 'Building'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenJobMarket}
                className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-[#F3F1EC] hover:bg-[#E7E4DC] text-[#14161D] text-xs font-semibold transition cursor-pointer touch-manipulation whitespace-nowrap"
              >
                Open Job Market
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
