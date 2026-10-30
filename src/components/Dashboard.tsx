import React, { useState, useEffect, useMemo } from "react";
import { WinterBreakModal } from './WinterBreakModal';
import { ToastContainer } from './ToastContainer';
import { GachaRevealModal } from './GachaRevealModal';
import { DashboardHeader } from './DashboardHeader';
import { ClubProfileModal } from './ClubProfileModal';
import { Club, Language, UniverseMovement, ResolvedCupOutcome, ResolvedPlayoffOutcome, BoardRoadmap } from '../types';

import { useGameStore, POSTSEASON_CHECKPOINT_KEY, pruneCareerHistoryForStorage } from "../store/useGameStore";
import { isReserveClub } from "../data/gameConstants";
import { getLeagueSize, generateYouthProspect } from "../engine/engine";
import { ALL_CLUBS } from "../data/clubsData";
import { getActiveClubs, isAnyModActive, mergeClubWithWorldState } from "../utils/modManager";
import { generateLeagueTable, getDecisionDayStandingsSlice } from "../utils/leagueTableGenerator";
import { getBroadcastingPackage } from "../data/broadcastingPackages";
import { generateDomesticCupTournament, generateEuroCupTournament } from "../utils/bracketGenerator";
import { getMaxTier, getCreditLimit, getClubHistoricContext, getClubHomeArena, getFAInfo } from "../data/gameConstants";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Users2, Activity, Shield, User } from "lucide-react";
import { SeasonHistoryTable } from "./SeasonHistoryTable";
import { ClubImpactModal } from "./ClubImpactModal";
import { ActionPanel } from "./ActionPanel";
import { MatchdayActionDock } from "./MatchdayActionDock";
import { JobMarketModal } from "./JobMarketModal";
import { ManagerProfileModal } from "./ManagerProfileModal";
import { ManagerSkillsModal } from "./ManagerSkillsModal";
import { LedgerModal } from "./LedgerModal";
import { LeagueTableModal } from "./LeagueTableModal";
import { AnimatedTreasury } from "./AnimatedTreasury";
import { SeasonFinishModal } from "./SeasonFinishModal";
import { SimulatingOverlay } from "./SimulatingOverlay";
import { StatusChangeModal } from "./StatusChangeModal";
import { BankruptcyModal } from "./BankruptcyModal";
import { BoardExpectationModal } from "./BoardExpectationModal";
import { AchievementModal } from "./AchievementModal";
import { PerformanceDealModal } from "./PerformanceDealModal";
import { KeyMatchModal } from "./KeyMatchModal";
import { StadiumModal } from "./StadiumModal";
import { ArenaOverviewModal } from "./ArenaOverviewModal";
import { NewBuildModal } from "./NewBuildModal";
import { ArenaInaugurationModal } from "./ArenaInaugurationModal";
import { MedicalModal } from "./MedicalModal";
import { AcademyModal } from "./AcademyModal";
import { trackEvent } from "../utils/analytics";
import { PhilosophyModal } from "./PhilosophyModal";
import { MoraleModal } from "./MoraleModal";
import { OvrModal } from "./OvrModal";
import { ShieldsModal } from "./ShieldsModal";
import { TeamBondingModal } from "./TeamBondingModal";
import { SeasonPrepInfoModal } from "./SeasonPrepInfoModal";
import { TransferModal } from "./TransferModal";
import { LoanModal } from "./LoanModal";
import { MarketingPRModal } from "./MarketingPRModal";
import { IPOModal } from "./IPOModal";
import { YouthModal } from "./YouthModal";
import { ActiveEventModal } from "./ActiveEventModal";
import { ConfirmResetModal } from "./ConfirmResetModal";
import { LeaderboardModal } from "./LeaderboardModal";
import { ClubCustomizationModal } from "./ClubCustomizationModal";
import { BoardRoadmapModal } from "./BoardRoadmapModal";
import { evaluateRoadmapProgress, generateBoardRoadmap } from "../utils/roadmapManager";
import { calculateLiveScore, saveHighscore } from "../utils/leaderboard";
import { generateRandomEvent, resolveDynamicEvent, generateMidSeasonCrisis } from "../data/randomEvents";
import {
  calculateClubFinancials,
  calculateClubReputation,
  getLeagueScaledVal,
  getAcademyUpgradeCost,
  getMedicalUpgradeCost,
  getLeagueInfo,
  getDomesticCupInfo,
  getDomesticSupercupInfo,
  getEuropeanSupercupInfo,
  getQualifiedSupercupMatches,
  formatMoney,
  formatNum,
  getPinnacleArenaCapacity,
  normalizeCountry,
  TACTICS
} from "../data/gameConstants";

const seededRandomDashboard = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

export function Dashboard({ state: propState, lang }: { state: any; lang: any }) {
  const storeState = useGameStore();
  const state = (storeState && storeState.club?.name) ? storeState : propState;
  const { club, budget, year, managerName, simulateSeason } = state || {};
  const team = club;
  const stateStore = storeState;
  const [modDb, setModDb] = useState<Club[]>(() => getActiveClubs(state?.club?.country));
  useEffect(() => {
    const handleModChange = () => setModDb(getActiveClubs(useGameStore.getState()?.club?.country));
    window.addEventListener('mod-state-change', handleModChange);
    window.addEventListener('storage', handleModChange);
    return () => {
      window.removeEventListener('mod-state-change', handleModChange);
      window.removeEventListener('storage', handleModChange);
    };
  }, []);
  const baseClubs = modDb;
  const clubsDb = useMemo(() => {
    return baseClubs.map(c => mergeClubWithWorldState(c, state?.worldClubs?.[c.id]));
  }, [baseClubs, state?.worldClubs]);
  const creditLimit = getCreditLimit(state?.club?.tier || 1, state?.club?.country || 'GER');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showJobMarket, setShowJobMarket] = useState(state?.isSacked || false);
  const [seasonalJobOffers, setSeasonalJobOffers] = useState<{ year: number; offers: Club[] } | null>(null);
  const [showInboundOffers, setShowInboundOffers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showMedical, setShowMedical] = useState(false);
  const [gachaRevealData, setGachaRevealData] = useState<{type: string, cost: number, gain: number, ovr: number, name?: string} | null>(null);

  useEffect(() => {
    if (!state) return;
    if ((state.seasonsInDebt || 0) >= 3 && (state.budget || 0) < 0 && !state.bankruptcyPending) {
      useGameStore.getState().updateState({ bankruptcyPending: true, seasonsInDebt: 3 });
    } else if ((state.seasonsInDebt || 0) > 3) {
      useGameStore.getState().updateState({ seasonsInDebt: 3 });
    }
  }, [state?.seasonsInDebt, state?.budget, state?.bankruptcyPending]);
  const [showAcademy, setShowAcademy] = useState(false);
  const [showMorale, setShowMorale] = useState(false);
  const [showOvrModal, setShowOvrModal] = useState(false);
  const [showShields, setShowShields] = useState(false);
  const [showTeamBonding, setShowTeamBonding] = useState(false);
  const [showPrepInfo, setShowPrepInfo] = useState(false);
  const [showWinterBreak, setShowWinterBreak] = useState(false);
  const winterBreakSeenYear = state?.winterBreakSeenYear ?? -1;
  const winterTransfersOpenedYear = state?.winterTransfersOpenedYear ?? -1;
  const [showTransfers, setShowTransfers] = useState(false);
  const [showLoan, setShowLoan] = useState(false);
  const [showMarketing, setShowMarketing] = useState(false);
  const [showIPO, setShowIPO] = useState(false);
  const [showStadium, setShowStadium] = useState(false);
  const [showArenaOverview, setShowArenaOverview] = useState(false);
  const [showNewBuild, setShowNewBuild] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showClubProfile, setShowClubProfile] = useState(false);
  const [showYouth, setShowYouth] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [showSimulatingOverlay, setShowSimulatingOverlay] = useState(false);
  const [totalMatchdaysForOverlay, setTotalMatchdaysForOverlay] = useState(() => (getLeagueSize(state?.club?.tier || 1, state?.club?.country || 'GER') - 1) * 2);
  const [simulationPhase, setSimulationPhase] = useState<"idle"|"first_half"|"second_half">("idle");
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [philosophyInitialTab, setPhilosophyInitialTab] = useState<'overview' | 'philosophy' | 'rebuild'>('overview');
  const [trophyInfoModal, setTrophyInfoModal] = useState<'dom' | 'intl' | null>(null);
  const [showBoardExpectations, setShowBoardExpectations] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [isSeasonalBoardTransition, setIsSeasonalBoardTransition] = useState(false);
  const [welcomeClub, setWelcomeClub] = useState<Club | null>(null);
  const [lastSeenYear, setLastSeenYear] = useState(state?.year || 2026);

  // Board expectations trigger moved to handleCloseSeasonFinish
  const [seasonResultData, setSeasonResultData] = useState<any>(null);
  const [stagedSeasonResultData, setStagedSeasonResultData] = useState<any>(null);
  const [statusChange, setStatusChange] = useState<'promotion' | 'relegation' | null>(null);
  const [pendingCupToasts, setPendingCupToasts] = useState<any[]>([]);
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [queuedCupMatches, setQueuedCupMatches] = useState<any[]>([]);
  const [queuedEuroMatches, setQueuedEuroMatches] = useState<any[]>([]);
  const [queuedSuperGlobeMatches, setQueuedSuperGlobeMatches] = useState<any[]>([]);
  const [activeCelebrationToast, setActiveCelebrationToast] = useState<any | null>(null);
  const [performanceDealResult, setPerformanceDealResult] = useState<any>(null);
  const [pendingSeasonResult, setPendingSeasonResult] = useState<any>(null);
  const [arenaInaugurationData, setArenaInaugurationData] = useState<any>(null);
  const isSimulatingRef = React.useRef(false);
  const wasBankruptcyPendingRef = React.useRef(false);
  const [cupQualifiedForSf, setCupQualifiedForSf] = useState<boolean | null>(() => state?.cupQualifiedForSf ?? null);
  const [euroQualifiedForSf, setEuroQualifiedForSf] = useState<boolean | null>(() => state?.euroQualifiedForSf ?? null);
  const [eliminatedCupOpponents, setEliminatedCupOpponents] = useState<string[]>(() => state?.activeCupTournament?.eliminatedClubs || []);
  const [eliminatedEuroOpponents, setEliminatedEuroOpponents] = useState<string[]>(() => state?.activeEuroTournament?.eliminatedClubs || []);
  const [winterBreakPending, setWinterBreakPending] = useState(false);
  const postSeasonHydratedRef = React.useRef<string>('');

  // Rehydrate post-season flow if the user reloaded during post-season resolution screens
  useEffect(() => {
    if (!state?.careerId || !state?.year) return;
    const hydrationKey = `${state.careerId}_${state.year}`;
    if (postSeasonHydratedRef.current === hydrationKey) return;
    postSeasonHydratedRef.current = hydrationKey;

    try {
      if (typeof localStorage === 'undefined') return;
      const rawCp = localStorage.getItem(POSTSEASON_CHECKPOINT_KEY);
      if (!rawCp) {
        if (state.postSeasonPending) {
          useGameStore.getState().updateState({ postSeasonPending: false });
        }
        return;
      }
      const cp = JSON.parse(rawCp);
      if (!cp || cp.careerId !== state.careerId || cp.year !== state.year) {
        localStorage.removeItem(POSTSEASON_CHECKPOINT_KEY);
        if (state.postSeasonPending) {
          useGameStore.getState().updateState({ postSeasonPending: false });
        }
        return;
      }

      const lastHist = Array.isArray(state.history) && state.history.length > 0 ? state.history[state.history.length - 1] : null;
      const reattachHeavyFields = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        return {
          ...obj,
          worldClubs: state.worldClubs || obj.worldClubs || {},
          universeMovements: lastHist?.universeMovements || state.universeMovements || obj.universeMovements || [],
          finalTable: lastHist?.finalTable || obj.finalTable
        };
      };

      const restoredPendingMatches = Array.isArray(cp.pendingMatches) ? cp.pendingMatches : [];
      const restoredQueuedCup = Array.isArray(cp.queuedCupMatches) ? cp.queuedCupMatches : [];
      const restoredQueuedEuro = Array.isArray(cp.queuedEuroMatches) ? cp.queuedEuroMatches : [];
      const restoredQueuedSuperGlobe = Array.isArray(cp.queuedSuperGlobeMatches) ? cp.queuedSuperGlobeMatches : [];
      const restoredCupToasts = Array.isArray(cp.pendingCupToasts) ? cp.pendingCupToasts : [];
      const restoredPendingResult = cp.pendingSeasonResult ? reattachHeavyFields(cp.pendingSeasonResult) : null;

      if (restoredPendingResult) setPendingSeasonResult(restoredPendingResult);
      if (cp.stagedSeasonResultData) setStagedSeasonResultData(reattachHeavyFields(cp.stagedSeasonResultData));

      if (cp.seasonResultData) {
        setSeasonResultData(reattachHeavyFields(cp.seasonResultData));
      } else if (cp.statusChange) {
        setStatusChange(cp.statusChange);
      } else if (cp.activeCelebrationToast) {
        setActiveCelebrationToast(cp.activeCelebrationToast);
        if (restoredCupToasts.length > 0) setPendingCupToasts(restoredCupToasts);
        if (restoredQueuedCup.length > 0) setQueuedCupMatches(restoredQueuedCup);
        if (restoredQueuedEuro.length > 0) setQueuedEuroMatches(restoredQueuedEuro);
        if (restoredQueuedSuperGlobe.length > 0) setQueuedSuperGlobeMatches(restoredQueuedSuperGlobe);
      } else if (restoredPendingMatches.length > 0) {
        setPendingMatches(restoredPendingMatches);
        if (restoredCupToasts.length > 0) setPendingCupToasts(restoredCupToasts);
        if (restoredQueuedCup.length > 0) setQueuedCupMatches(restoredQueuedCup);
        if (restoredQueuedEuro.length > 0) setQueuedEuroMatches(restoredQueuedEuro);
        if (restoredQueuedSuperGlobe.length > 0) setQueuedSuperGlobeMatches(restoredQueuedSuperGlobe);
      } else if (restoredCupToasts.length > 0) {
        setActiveCelebrationToast(restoredCupToasts[0]);
        setPendingCupToasts(restoredCupToasts.slice(1));
        if (restoredQueuedCup.length > 0) setQueuedCupMatches(restoredQueuedCup);
        if (restoredQueuedEuro.length > 0) setQueuedEuroMatches(restoredQueuedEuro);
        if (restoredQueuedSuperGlobe.length > 0) setQueuedSuperGlobeMatches(restoredQueuedSuperGlobe);
      } else if (restoredQueuedCup.length > 0) {
        setPendingMatches([restoredQueuedCup[0]]);
        setQueuedCupMatches(restoredQueuedCup.slice(1));
        if (restoredQueuedEuro.length > 0) setQueuedEuroMatches(restoredQueuedEuro);
        if (restoredQueuedSuperGlobe.length > 0) setQueuedSuperGlobeMatches(restoredQueuedSuperGlobe);
      } else if (restoredQueuedEuro.length > 0) {
        setPendingMatches([restoredQueuedEuro[0]]);
        setQueuedEuroMatches(restoredQueuedEuro.slice(1));
        if (restoredQueuedSuperGlobe.length > 0) setQueuedSuperGlobeMatches(restoredQueuedSuperGlobe);
      } else if (restoredQueuedSuperGlobe.length > 0) {
        setPendingMatches([restoredQueuedSuperGlobe[0]]);
        setQueuedSuperGlobeMatches(restoredQueuedSuperGlobe.slice(1));
      } else if (restoredPendingResult) {
        setTimeout(() => finishSimulation(restoredPendingResult), 0);
      }
    } catch {
      // Ignore malformed checkpoint
    }
  }, [state?.careerId, state?.year]);

  // Persist lightweight post-season checkpoint whenever post-season queues or resolution modals are active
  useEffect(() => {
    if (!state?.careerId || !state?.year) return;
    const isPostSeasonResolutionActive = Boolean(
      pendingMatches.length > 0 ||
      queuedCupMatches.length > 0 ||
      queuedEuroMatches.length > 0 ||
      queuedSuperGlobeMatches.length > 0 ||
      pendingCupToasts.length > 0 ||
      activeCelebrationToast ||
      statusChange ||
      stagedSeasonResultData ||
      seasonResultData ||
      pendingSeasonResult
    );

    try {
      if (typeof localStorage === 'undefined') return;
      if (!isPostSeasonResolutionActive) {
        if (!state.postSeasonPending) {
          localStorage.removeItem(POSTSEASON_CHECKPOINT_KEY);
        }
        return;
      }

      const stripHeavyFields = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        const { worldClubs: _wc, universeMovements: _um, finalTable: _ft, ...compact } = obj;
        return compact;
      };

      const checkpointPayload = {
        careerId: state.careerId,
        year: state.year,
        pendingMatches,
        queuedCupMatches,
        queuedEuroMatches,
        queuedSuperGlobeMatches,
        pendingCupToasts,
        activeCelebrationToast,
        statusChange,
        stagedSeasonResultData: stripHeavyFields(stagedSeasonResultData),
        seasonResultData: stripHeavyFields(seasonResultData),
        pendingSeasonResult: stripHeavyFields(pendingSeasonResult)
      };
      localStorage.setItem(POSTSEASON_CHECKPOINT_KEY, JSON.stringify(checkpointPayload));
    } catch {
      // Ignore quota errors
    }
  }, [
    state?.careerId, state?.year, state?.postSeasonPending,
    pendingMatches, queuedCupMatches, queuedEuroMatches, queuedSuperGlobeMatches,
    pendingCupToasts, activeCelebrationToast, statusChange,
    stagedSeasonResultData, seasonResultData, pendingSeasonResult
  ]);

  // Sync local tournament state if the manager switches clubs or advances seasons
  useEffect(() => {
    setCupQualifiedForSf(state?.cupQualifiedForSf ?? null);
    setEuroQualifiedForSf(state?.euroQualifiedForSf ?? null);
    setEliminatedCupOpponents(state?.activeCupTournament?.eliminatedClubs || []);
    setEliminatedEuroOpponents(state?.activeEuroTournament?.eliminatedClubs || []);
  }, [state?.club?.id, state?.year, state?.cupQualifiedForSf, state?.euroQualifiedForSf]);

  useEffect(() => {
    if (showWinterBreak && state?.year && state.winterBreakSeenYear !== state.year) {
      useGameStore.getState().updateState({ winterBreakSeenYear: state.year });
    }
  }, [showWinterBreak, state?.year, state?.winterBreakSeenYear]);

  const prevIsSackedRef = React.useRef<boolean>(Boolean(state?.isSacked));

  useEffect(() => {
    if (!state) return;
    const isPostSeasonFlowActive = Boolean(
      isSimulating ||
      showSimulatingOverlay ||
      pendingMatches.length > 0 ||
      activeCelebrationToast ||
      statusChange ||
      seasonResultData ||
      pendingSeasonResult
    );
    if (state.isSacked) {
      if (!showJobMarket && !isPostSeasonFlowActive) {
        setShowJobMarket(true);
      } else if (showJobMarket && isPostSeasonFlowActive) {
        setShowJobMarket(false);
      }
    } else if (prevIsSackedRef.current && !state.isSacked && showJobMarket) {
      setShowJobMarket(false);
    }
    prevIsSackedRef.current = Boolean(state.isSacked);
  }, [state?.isSacked, isSimulating, showSimulatingOverlay, pendingMatches.length, activeCelebrationToast, statusChange, seasonResultData, pendingSeasonResult, showJobMarket]);

  // Preserve scroll position when modals open, interact, and close
  const scrollPositionRef = React.useRef<number>(0);
  const anyModalOpen = Boolean(
    showYouth || showTransfers || showLoan || showMarketing || showIPO || showTable || showLedger || showPhilosophy ||
    showSkills || showCustomization || showNewBuild || showProfile || showImpact ||
    showOvrModal || showLeaderboard || showArenaOverview || showStadium ||
    showAcademy || showMedical || showJobMarket || showTeamBonding ||
    showPrepInfo || gachaRevealData || showShields || showMorale ||
    arenaInaugurationData || seasonResultData || showWinterBreak || statusChange ||
    trophyInfoModal || performanceDealResult || showSimulatingOverlay ||
    activeEvent || showRoadmap || showBoardExpectations || showClubProfile ||
    showConfirmReset || pendingMatches.length > 0 || activeCelebrationToast ||
    welcomeClub || showInboundOffers
  );
  const prevAnyModalOpenRef = React.useRef<boolean>(false);

  useEffect(() => {
    if (!prevAnyModalOpenRef.current && anyModalOpen) {
      scrollPositionRef.current = window.scrollY;
    } else if (prevAnyModalOpenRef.current && !anyModalOpen) {
      const savedY = scrollPositionRef.current;
      if (savedY > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, behavior: 'instant' });
        });
      }
    }
    prevAnyModalOpenRef.current = anyModalOpen;
  }, [anyModalOpen]);

  // Power User Keyboard Shortcuts: Escape closes top-most modal; Spacebar triggers Continue / Start Second Half
  useEffect(() => {
    if (!state || !state.club?.name) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }

      // 1. Space: Simulate matchday / advance campaign or proceed past season wrap-up screens
      if (e.key === ' ' || e.code === 'Space') {
        if (activeCelebrationToast) {
          e.preventDefault();
          handleCloseCelebrationToast();
          return;
        }
        if (seasonResultData && !statusChange && !state.bankruptcyPending && !showTable && !performanceDealResult && !showProfile && !showImpact && !showLeaderboard) {
          e.preventDefault();
          handleCloseSeasonFinish();
          return;
        }
        // If no blocking modal is open, advance campaign / simulate matchday
        if (!anyModalOpen && !isSimulating && !showSimulatingOverlay) {
          e.preventDefault();
          handleSimulate();
          return;
        }
      }

      // 2. T: Instant toggle for the League Standings table (only when no other modal/simulation is blocking)
      if ((e.key === 't' || e.key === 'T') && (!anyModalOpen || showTable) && !isSimulating && !showSimulatingOverlay && !state.bankruptcyPending) {
        e.preventDefault();
        setShowTable(prev => !prev);
        return;
      }

      // 3. Esc: Dismiss any open inspection drawer or modal
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showTable) { setShowTable(false); return; }
        if (gachaRevealData) { setGachaRevealData(null); return; }
        if (activeEvent) { return; }
        if (trophyInfoModal) { setTrophyInfoModal(null); return; }
        if (arenaInaugurationData) { setArenaInaugurationData(null); return; }
        if (activeCelebrationToast) { handleCloseCelebrationToast(); return; }
        if (showConfirmReset) { setShowConfirmReset(false); return; }
        if (showYouth) { setShowYouth(false); return; }
        if (showTransfers) { setShowTransfers(false); return; }
        if (showLoan) { setShowLoan(false); return; }
        if (showMarketing) { setShowMarketing(false); return; }
        if (showIPO) { setShowIPO(false); return; }
        if (showAcademy) { setShowAcademy(false); return; }
        if (showMedical) { setShowMedical(false); return; }
        if (showTeamBonding) { setShowTeamBonding(false); return; }
        if (showPrepInfo) { setShowPrepInfo(false); return; }
        if (showOvrModal) { setShowOvrModal(false); return; }
        if (showShields) { setShowShields(false); return; }
        if (showMorale) { setShowMorale(false); return; }
        if (showPhilosophy) { setShowPhilosophy(false); return; }
        if (showSkills) { setShowSkills(false); return; }
        if (showRoadmap) { setShowRoadmap(false); return; }
        if (showBoardExpectations) { setWelcomeClub(null); handleCloseBoardExpectations(); return; }
        if (showCustomization) { setShowCustomization(false); return; }
        if (showClubProfile) { setShowClubProfile(false); return; }
        if (showLeaderboard) { setShowLeaderboard(false); return; }
        if (showArenaOverview) { setShowArenaOverview(false); return; }
        if (showStadium) { setShowStadium(false); return; }
        if ((showJobMarket || showInboundOffers) && !state.isSacked) {
          if (showJobMarket) setShowJobMarket(false);
          if (showInboundOffers) {
            setShowInboundOffers(false);
            if (state.year > lastSeenYear) {
              setIsSeasonalBoardTransition(true);
              setShowBoardExpectations(true);
              setLastSeenYear(state.year);
            }
          }
          return;
        }
        if (showImpact) { setShowImpact(false); return; }
        if (showLedger) { setShowLedger(false); return; }
        if (showNewBuild) { setShowNewBuild(false); return; }
        if (showProfile) { setShowProfile(false); return; }
        if (performanceDealResult) { setPerformanceDealResult(null); return; }
        if (statusChange) {
          setSeasonResultData(stagedSeasonResultData);
          setStatusChange(null);
          setStagedSeasonResultData(null);
          return;
        }
        if (seasonResultData) {
          handleCloseSeasonFinish();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    anyModalOpen, isSimulating, showSimulatingOverlay, activeCelebrationToast,
    showWinterBreak, winterBreakPending, pendingCupToasts, queuedCupMatches,
    queuedEuroMatches, queuedSuperGlobeMatches, pendingSeasonResult, performanceDealResult,
    seasonResultData, statusChange, state?.bankruptcyPending, state?.isSacked, state?.year, lastSeenYear,
    gachaRevealData, activeEvent, trophyInfoModal, arenaInaugurationData,
    showYouth, showTransfers, showLoan, showMarketing, showIPO, showAcademy, showMedical, showTeamBonding, showPrepInfo,
    showOvrModal, showShields, showMorale, showPhilosophy, showSkills, showRoadmap, showBoardExpectations,
    showCustomization, showClubProfile, showLeaderboard, showArenaOverview, showStadium,
    showJobMarket, showInboundOffers, showConfirmReset, showImpact, showTable, showLedger, showNewBuild, showProfile,
    stagedSeasonResultData
  ]);

  // Guardrails & Save-state sanitization
  useEffect(() => {
    if (!state || !state.club) return;
    const updates: any = {};
    if (state.club.tier > 1 && state.euroStatus && state.euroStatus !== 'EL') {
      updates.euroStatus = null;
      updates.activeEuroTournament = undefined;
      updates.euroQualifiedForSf = null;
    }
    if (state.youthPullsSeasonYear !== state.year) {
      updates.youthPullsThisSeason = 0;
      updates.youthPullsSeasonYear = state.year;
    }
    if (Object.keys(updates).length > 0) {
      useGameStore.getState().updateState(updates);
    }
  }, [state?.club?.tier, state?.euroStatus, state?.year, state?.youthPullsSeasonYear]);

  // Sync staged/active seasonResultData ONLY if BankruptcyModal just resolved (bankruptcyPending transitioned true -> false)
  useEffect(() => {
    if (!state || !state.club) return;
    if (state.bankruptcyPending) {
      wasBankruptcyPendingRef.current = true;
      return;
    }
    if (!state.bankruptcyPending && wasBankruptcyPendingRef.current && (stagedSeasonResultData || seasonResultData)) {
      wasBankruptcyPendingRef.current = false;
      const targetData = stagedSeasonResultData || seasonResultData;
      const postTier = state.club.tier;
      const postBudget = state.budget;
      const postOvr = state.club.baseOvr;
      const postEuro = state.euroStatus || null;
      const postSacked = Boolean(state.isSacked);
      if (
        targetData.nextTier !== postTier ||
        targetData.endBudget !== postBudget ||
        targetData.newBaseOvr !== postOvr ||
        targetData.euroNextSeason !== postEuro ||
        Boolean(targetData.isSacked) !== postSacked
      ) {
        const demoted = postTier > targetData.tier;
        const stillPromoted = postTier < targetData.tier ? targetData.promoted : false;
        const updated = {
          ...targetData,
          nextTier: postTier,
          clubTier: targetData.clubTier ?? targetData.tier,
          endBudget: postBudget,
          newBaseOvr: postOvr,
          euroNextSeason: postEuro,
          isSacked: postSacked,
          relegated: demoted ? true : targetData.relegated,
          promoted: demoted ? false : stillPromoted,
          survived: demoted ? false : targetData.survived,
        };
        if (stagedSeasonResultData) {
          setStagedSeasonResultData(updated);
          if (demoted && statusChange !== 'relegation') {
            setStatusChange('relegation');
          }
        } else if (seasonResultData) {
          if (demoted && !statusChange) {
            setStagedSeasonResultData(updated);
            setSeasonResultData(null);
            setStatusChange('relegation');
          } else {
            setSeasonResultData(updated);
          }
        }
      }
    }
  }, [state?.bankruptcyPending, state?.club?.tier, state?.budget, state?.club?.baseOvr, state?.euroStatus, state?.isSacked, stagedSeasonResultData, seasonResultData, statusChange]);

  if (!state || !state.club || !state.club.name || !team) {
    return <div className="min-h-screen w-full bg-[#0d0d0e]" />;
  }

  const handleCloseCelebrationToast = () => {
    setActiveCelebrationToast(null);

    // If waiting for winter break after cup quarter-final
    if (winterBreakPending) {
      setWinterBreakPending(false);
      if (!state.midSeasonCrisisTriggered && Math.random() < 0.25) {
          const crisis = generateMidSeasonCrisis(state);
          if (crisis) {
              useGameStore.getState().updateState({ midSeasonCrisisTriggered: true });
              setActiveEvent(crisis);
              return;
          }
      }
      useGameStore.getState().updateState({ winterBreakSeenYear: state.year });
      setShowWinterBreak(true);
      return;
    }

    // If there is another toast waiting in pendingCupToasts (e.g. back to back promotions)
    if (pendingCupToasts.length > 0) {
      const nextToast = pendingCupToasts[0];
      setPendingCupToasts(prev => prev.slice(1));
      setActiveCelebrationToast(nextToast);
      return;
    }

    // Sequentially advance through post-season phases:
    // 1. Domestic Cup / Magic Cup runs
    if (queuedCupMatches && queuedCupMatches.length > 0) {
      const nextMatch = queuedCupMatches[0];
      setQueuedCupMatches(prev => prev.slice(1));
      setPendingMatches([nextMatch]);
      return;
    }

    // 2. European / International Cup runs
    if (queuedEuroMatches && queuedEuroMatches.length > 0) {
      const nextMatch = queuedEuroMatches[0];
      setQueuedEuroMatches(prev => prev.slice(1));
      setPendingMatches([nextMatch]);
      return;
    }

    // 3. IHF Super Globe (World Club Championship) runs
    if (queuedSuperGlobeMatches && queuedSuperGlobeMatches.length > 0) {
      const nextMatch = queuedSuperGlobeMatches[0];
      setQueuedSuperGlobeMatches(prev => prev.slice(1));
      setPendingMatches([nextMatch]);
      return;
    }

    // 4. All stages concluded -> Finish simulation and display Season Summary
    if (pendingSeasonResult) {
      finishSimulation(pendingSeasonResult);
    }
  };
  
  const flushCupToasts = () => {
    if (pendingCupToasts && pendingCupToasts.length > 0) {
      const current = useGameStore.getState().notifications || [];
      useGameStore.getState().updateState({
        notifications: [...current, ...pendingCupToasts].slice(-3)
      });
      setPendingCupToasts([]);
    }
  };

  const handleCloseBoardExpectations = () => {
    setShowBoardExpectations(false);
    const shouldTriggerOffseasonEvent = isSeasonalBoardTransition;
    setIsSeasonalBoardTransition(false);
    // Only check for an event if this was an actual seasonal transition, never when manually viewing roadmap
    if (shouldTriggerOffseasonEvent && Math.random() < 0.60) {
       const ev = generateRandomEvent(state);
       if (ev) {
          setTimeout(() => setActiveEvent(ev), 300); // Wait for modal to close
       }
    }
  };

  const handleCloseSeasonFinish = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(POSTSEASON_CHECKPOINT_KEY);
      }
    } catch {
      // ignore
    }
    setActiveEvent(null);
    setSeasonResultData(null);
    setStagedSeasonResultData(null);
    setPendingSeasonResult(null);
    setCupQualifiedForSf(null);
    setEuroQualifiedForSf(null);
    setEliminatedCupOpponents([]);
    setEliminatedEuroOpponents([]);
    const currentStore = useGameStore.getState();
    const isCareerCompleteNow = !currentStore.endlessModeActive && (currentStore.history?.length || 0) >= 35;
    currentStore.updateState({
      postSeasonPending: false,
      activeCupTournament: undefined,
      activeEuroTournament: undefined,
      resolvedMatchContext: undefined,
      playoffVictoryOverride: undefined,
      pendingSupercupTrophies: undefined,
      cupQualifiedForSf: null,
      euroQualifiedForSf: null,
      youthPullsThisSeason: 0,
      youthPullsSeasonYear: currentStore.year,
      euroStatus: (currentStore.club.tier === 1 || currentStore.euroStatus === 'EL') ? currentStore.euroStatus : null
    });
    if (isCareerCompleteNow) {
      const finalState = useGameStore.getState();
      const finalLiveScore = calculateLiveScore(finalState);
      finalState.updateState({ careerScore: finalLiveScore, score: finalLiveScore });
      saveHighscore(useGameStore.getState());
      return;
    }
    // Delay to let the SeasonFinishModal animate out
    setTimeout(() => {
      const latestState = useGameStore.getState();
      // Check if fired
      if (latestState.isSacked) {
         setShowJobMarket(true);
         return;
      }
      if (latestState.bankruptcyPending) return;
      
      // Trigger off-season event (board expectations moved to SeasonFinishModal)
      if (latestState.year > lastSeenYear) {
         setLastSeenYear(latestState.year);
         const ev = generateRandomEvent(latestState);
         if (ev) setActiveEvent(ev);
      }
    }, 700);
  };

  const [preSeasonSupercupQueue, setPreSeasonSupercupQueue] = useState<any[]>([]);
  const [autoStartSimAfterSupercup, setAutoStartSimAfterSupercup] = useState(false);

  useEffect(() => {
    setPreSeasonSupercupQueue(prev =>
      prev.filter(
        m =>
          m.playerClubName === state?.club?.name &&
          (!m.country || normalizeCountry(m.country) === normalizeCountry(state?.club?.country || 'GER'))
      )
    );
  }, [state?.club?.id, state?.club?.name, state?.club?.country]);

  const qualifiedSupercups = useMemo(() => {
    if (!state?.club || state.year <= winterBreakSeenYear) return [];
    return getQualifiedSupercupMatches(state, clubsDb, isAnyModActive());
  }, [
    state?.year,
    state?.supercupPlayedYear,
    winterBreakSeenYear,
    state?.club?.id,
    state?.club?.name,
    state?.club?.tier,
    state?.club?.country,
    state?.history,
    clubsDb
  ]);

  const buildSupercupModalPayload = (scMatch: any) => {
    const pOvr = state.club.baseOvr || 78;
    const oOvr = scMatch.opponentOvr || 78;
    const baseWinProb =
      typeof scMatch.baseWinProb === 'number' && !Number.isNaN(scMatch.baseWinProb)
        ? scMatch.baseWinProb
        : Math.round(Math.max(0.15, Math.min(0.85, 0.5 + (pOvr - oOvr) * 0.02)) * 100);
    return {
      ...scMatch,
      type: 'domestic_supercup',
      round: 'FINAL',
      title: scMatch.title,
      cupName: scMatch.title,
      subtitle: scMatch.subtitle,
      playerClubName: state.club.name,
      playerOvr: pOvr,
      opponentName: scMatch.opponent,
      opponentOvr: oOvr,
      baseWinProb,
      hostArena: scMatch.hostArena,
      arena: scMatch.hostArena,
      hostCapacity: scMatch.hostCapacity,
      capacity: scMatch.hostCapacity,
      year: state.year,
      tier: state.club.tier || 1,
      isEuroCup: false,
      broadcastPackage: getBroadcastingPackage(
        state.club.country || 'GER',
        false,
        {
          type: 'domestic_supercup',
          title: scMatch.title,
          subtitle: scMatch.subtitle,
          year: state.year,
          clubName: state.club.name,
          isModActive: isAnyModActive()
        }
      )
    };
  };

  const launchSimulationOverlayNow = () => {
    isSimulatingRef.current = true;
    const tier = state.club.tier || 5;
    const numTeams = getLeagueSize(tier, state.club.country || 'GER', state.club.id, state.club.tier, state.club.country || 'GER', clubsDb);
    const matchdays = (numTeams - 1) * 2;
    setTotalMatchdaysForOverlay(matchdays);

    if (state.year > winterBreakSeenYear && !state.isSacked) {
      setSimulationPhase("first_half");
      setShowSimulatingOverlay(true);
    } else {
      setSimulationPhase("second_half");
      setShowSimulatingOverlay(true);
    }
  };

  const handleOpenPreSeasonSupercup = (autoProceedToFirstHalf: boolean = false) => {
    if (!qualifiedSupercups || qualifiedSupercups.length === 0) return;
    setAutoStartSimAfterSupercup(autoProceedToFirstHalf);
    setPreSeasonSupercupQueue(qualifiedSupercups.map(buildSupercupModalPayload));
  };

  const handleResolvePreSeasonSupercup = (userWon: boolean) => {
    const currentMatch = preSeasonSupercupQueue[0];
    if (!currentMatch) return;
    const remaining = preSeasonSupercupQueue.slice(1);
    const store = useGameStore.getState();
    const prize = userWon
      ? (currentMatch.prizeMoney || 250000)
      : (currentMatch.runnerUpMoney || 125000);
    const newBudget = (store.budget || 0) + prize;
    const moraleDelta = userWon ? 8 : -2;
    const newMorale = Math.min(100, Math.max(10, (store.club.morale || 50) + moraleDelta));

    const scNotif = {
      id: Math.random().toString(),
      type: (userWon ? 'celebration' : 'info') as 'celebration' | 'info',
      category: 'cup' as const,
      title: userWon ? `${currentMatch.title.toUpperCase()} CHAMPIONS!` : `${currentMatch.title.toUpperCase()} RUNNER-UP`,
      message: userWon
        ? `🏆 ${currentMatch.title} Winners! Defeated ${currentMatch.opponentName} in ${currentMatch.hostArena} (+${formatMoney(prize)} prize purse).`
        : `🥈 ${currentMatch.title} Finalist: Narrowly defeated by ${currentMatch.opponentName} in ${currentMatch.hostArena} (+${formatMoney(prize)} appearance purse).`,
      read: false
    };

    if (userWon) {
      const prevPendingSc = store.pendingSupercupTrophies || {};
      const updatedPendingSc = {
        ...prevPendingSc,
        sc: ((prevPendingSc as any).sc || 0) + 1
      };
      const mpBonus = 2;
      const repBonus = 3;
      const impactBonus = 12;

      store.updateState({
        budget: newBudget,
        club: { ...store.club, currentBudget: newBudget, morale: newMorale },
        reputation: Math.min(100, (store.reputation || 50) + repBonus),
        skillPoints: (store.skillPoints || 0) + mpBonus,
        clubImpactScore: Math.min(100, (store.clubImpactScore || 50) + impactBonus),
        trophyDrought: 0,
        pendingSupercupTrophies: updatedPendingSc,
        totals: {
          ...store.totals,
          matches: (store.totals?.matches || 0) + 1,
          wins: (store.totals?.wins || 0) + 1,
          att: (store.totals?.att || 0) + (currentMatch.hostCapacity || 6000),
          domTrophies: (store.totals?.domTrophies || 0) + 1,
          intTrophies: store.totals?.intTrophies || 0,
          trophies: (store.totals?.trophies || 0) + 1
        },
        ...(remaining.length === 0 ? { supercupPlayedYear: store.year } : {}),
        notifications: [scNotif, ...(store.notifications || [])]
      });

      syncTrophyToUniverse('sc', store.year, store.club.tier || 1, store.club, currentMatch.title);
      recordCupFinalContext('dom_supercup', currentMatch.title, store.year, true, currentMatch.opponentName);
    } else {
      const oppWinnerClub = resolveAiClubByName(currentMatch.opponentName, 1);
      store.updateState({
        budget: newBudget,
        club: { ...store.club, currentBudget: newBudget, morale: newMorale },
        totals: {
          ...store.totals,
          matches: (store.totals?.matches || 0) + 1,
          att: (store.totals?.att || 0) + (currentMatch.hostCapacity || 6000)
        },
        ...(remaining.length === 0 ? { supercupPlayedYear: store.year } : {}),
        notifications: [scNotif, ...(store.notifications || [])]
      });

      syncTrophyToUniverse('sc', store.year, 1, oppWinnerClub, currentMatch.title);
      recordCupFinalContext('dom_supercup', currentMatch.title, store.year, false, currentMatch.opponentName);
    }

    if (remaining.length > 0) {
      setPreSeasonSupercupQueue(remaining);
    } else {
      setPreSeasonSupercupQueue([]);
      if (autoStartSimAfterSupercup) {
        setAutoStartSimAfterSupercup(false);
        setTimeout(() => {
          launchSimulationOverlayNow();
        }, 120);
      }
    }
  };

  const handleSimulate = () => {
    if (isSimulatingRef.current || isSimulating || showSimulatingOverlay) return;
    if (state.bankruptcyPending || ((state.seasonsInDebt || 0) >= 3 && (state.budget || 0) < 0)) {
      useGameStore.getState().updateState({ bankruptcyPending: true, seasonsInDebt: 3 });
      return;
    }
    if (state.year > winterBreakSeenYear && !state.isSacked && qualifiedSupercups.length > 0) {
      handleOpenPreSeasonSupercup(false);
      return;
    }
    launchSimulationOverlayNow();
  };

  const handleResolveActiveEvent = (choiceIndex: number) => {
    const isMidSeasonCrisis = activeEvent?.type === 'injury_crisis' || activeEvent?.type === 'sponsor_pullout' || activeEvent?.type === 'fan_protest';
    const result = resolveDynamicEvent(state, activeEvent, choiceIndex, team.tier);
    if (result) {
      if (result.acceptJobClub) {
        useGameStore.getState().acceptJobOffer(result.acceptJobClub);
      } else {
        const existingNotifs = useGameStore.getState().notifications || [];
        useGameStore.getState().updateState({
          club: result.updated.club,
          budget: result.updated.budget,
          reputation: result.updated.reputation,
          youthPipeline: result.updated.youthPipeline,
          ovrHistory: result.updated.ovrHistory,
          worldClubs: result.updated.worldClubs,
          startOfSeasonOvr: (result.updated as any).startOfSeasonOvr,
          lastOvr: (result.updated as any).lastOvr,
          eventOvrGainThisSeason: (result.updated as any).eventOvrGainThisSeason,
          signingFlopLossThisSeason: (result.updated as any).signingFlopLossThisSeason,
          notifications: [
            { id: Math.random().toString(), type: result.toastType, message: result.toastMsg, read: false },
            ...existingNotifs
          ]
        });
      }
    }
    setActiveEvent(null);
    if (isMidSeasonCrisis) {
        useGameStore.getState().updateState({ winterBreakSeenYear: state.year });
        setShowWinterBreak(true);
    }
  };


  const handleSimulateSeasonComplete = () => {
    setShowSimulatingOverlay(false);
    
    if (simulationPhase === "first_half") {
        const tier = state.club.tier || 5;
        const isReserve = isReserveClub(state.club.name);
        const clubCountry = normalizeCountry(state.club.country || "GER");
        const isGer = clubCountry === "GER";
        const realDataActive = isAnyModActive();
        const bPackage = getBroadcastingPackage(clubCountry, false, { clubName: state.club.name });
        const lastHistFirstHalf = state.history.length > 0 ? state.history[state.history.length - 1] : null;
        const isSameClubFirstHalf = Boolean(lastHistFirstHalf && (!lastHistFirstHalf.clubName || lastHistFirstHalf.clubName === state.club.name));
        const wonDfbCupLastYear = isSameClubFirstHalf && (lastHistFirstHalf.trophiesThisYear?.dfb || 0) === 1;
        const wonRegCupLastYear = tier > 1 && isSameClubFirstHalf && (lastHistFirstHalf.trophiesThisYear?.reg || 0) === 1;
        const isInNationalCup = tier <= 2 || wonRegCupLastYear || wonDfbCupLastYear;
        const isAmateurpokal = !isInNationalCup && tier > 1;

        if (!isReserve) {
          // Play Cup Quarter-Final before winter break! (Never use a Supercup name for QF/SF)
          const isSupercupStr = (s?: string) => Boolean(s && /(supercup|super cup|superpokal|superkup|supercoppa|supertaca|supertaça|supercopa|szuperkupa|superpuchar)/i.test(s));
          const rawCupName = isAmateurpokal
            ? (realDataActive ? bPackage.regionalCupName : (isGer ? 'DHB-Amateurpokal' : 'Regional Cup'))
            : (realDataActive ? bPackage.nationalCupName : (isGer ? 'DHB-Pokal' : 'National Cup'));
          const cupName = isSupercupStr(rawCupName)
            ? (isAmateurpokal ? (isGer ? 'DHB-Amateurpokal' : 'Regional Cup') : (isGer ? 'DHB-Pokal' : 'National Cup'))
            : rawCupName;

          let cupTournament = state.activeCupTournament;
          if (!cupTournament || cupTournament.year !== state.year || Boolean(cupTournament.isAmateur) !== Boolean(isAmateurpokal) || isSupercupStr(cupTournament.cupName)) {
            cupTournament = generateDomesticCupTournament(state.club, state.year, cupName, isAmateurpokal, clubsDb);
            useGameStore.getState().updateState({
              activeCupTournament: cupTournament,
              cupQualifiedForSf: null
            });
            setCupQualifiedForSf(null);
            setEliminatedCupOpponents(cupTournament.eliminatedClubs);
          }

          const chosenOppName = cupTournament.qfOpponent;
          const oppOvr = cupTournament.qfOpponentOvr;

          const qfMatch = {
            type: "cup_qf",
            title: "QUARTER-FINAL",
            subtitle: `${cupName.toUpperCase()} · ROAD TO WINTER BREAK`,
            broadcastPackage: bPackage,
            cupName: cupName,
            isAmateurCup: isAmateurpokal,
            arena: getClubHomeArena(state.club),
            capacity: state.club.stadium || 4750,
            opponentName: chosenOppName,
            previousOpponents: [chosenOppName],
            opponentOvr: oppOvr,
            playerOvr: state.club.baseOvr,
            playerClubName: state.club.name,
            baseWinProb: Math.round(Math.max(0.15, Math.min(0.85, 0.5 + (state.club.baseOvr - oppOvr) * 0.02)) * 100),
          };

          const winterMatches: any[] = [];
          if (useGameStore.getState().cupQualifiedForSf === null) {
            winterMatches.push(qfMatch);
          }

          // If the club is in European competition (Tier 1 qualified, or Tier 2/lower continental cup miracle qualifier)
          const isEuroQualified = Boolean(state.euroStatus && (state.club.tier === 1 || state.euroStatus === 'EL' || state.euroStatus === 'ECL'));
          if (isEuroQualified) {
            const activeStatus = state.euroStatus!;
            const euroKey = activeStatus.toUpperCase();
            const euroPackage = getBroadcastingPackage(clubCountry, true);
            const isCl = euroKey === 'CL';
            const isEl = euroKey === 'EL';
            const euroCupName = isCl 
              ? 'EHF Champions League'
              : isEl
              ? 'EHF European League'
              : 'EHF European Cup';

            let euroTournament = state.activeEuroTournament;
            if (!euroTournament || euroTournament.year !== state.year) {
              euroTournament = generateEuroCupTournament(state.club, state.year, activeStatus, euroCupName, clubsDb);
              useGameStore.getState().updateState({
                euroStatus: activeStatus,
                activeEuroTournament: euroTournament,
                euroQualifiedForSf: null
              });
              setEuroQualifiedForSf(null);
              setEliminatedEuroOpponents(euroTournament.eliminatedClubs);
            }

            const chosenEuroName = euroTournament.qfOpponent;
            const euroOppOvr = euroTournament.qfOpponentOvr;

            const euroQfMatch = {
              type: "euro_cup_qf",
              title: "QUARTER-FINAL",
              subtitle: realDataActive ? `${euroPackage.networkName.toUpperCase()} · ${euroCupName.toUpperCase()}` : `${euroCupName.toUpperCase()} · ROAD TO FINAL 4`,
              broadcastPackage: euroPackage,
              cupName: euroCupName,
              isAmateurCup: false,
              isEuroCup: true,
              arena: getClubHomeArena(state.club),
              capacity: state.club.stadium || 4750,
              opponentName: chosenEuroName,
              previousOpponents: [chosenEuroName],
              opponentOvr: euroOppOvr,
              playerOvr: state.club.baseOvr,
              playerClubName: state.club.name,
              baseWinProb: Math.round(Math.max(0.15, Math.min(0.85, 0.5 + (state.club.baseOvr - euroOppOvr) * 0.02)) * 100),
            };
            if (useGameStore.getState().euroQualifiedForSf === null) {
              winterMatches.push(euroQfMatch);
            }
          }

          if (winterMatches.length > 0) {
            setWinterBreakPending(true);
            setPendingMatches(winterMatches);
            setSimulationPhase("idle");
            isSimulatingRef.current = false;
            return;
          }
        }

        if (!state.midSeasonCrisisTriggered && Math.random() < 0.25) { // 25% chance of mid-season crisis
            const crisis = generateMidSeasonCrisis(state);
            if (crisis) {
                useGameStore.getState().updateState({ midSeasonCrisisTriggered: true });
                setActiveEvent(crisis);
                setSimulationPhase("idle");
                isSimulatingRef.current = false;
                return;
            }
        }

        useGameStore.getState().updateState({ winterBreakSeenYear: state.year });
        setShowWinterBreak(true);
        setSimulationPhase("idle");
        isSimulatingRef.current = false;
        return;
    }
    
    setIsSimulating(true);
    setSimulationPhase("idle");

    setShowSimulatingOverlay(false);
    setIsSimulating(true);
    setWinterBreakPending(false);
    setActiveCelebrationToast(null);
    setTimeout(() => {
      try {
        useGameStore.getState().updateState({ postSeasonPending: true });
        const preSimTenure = (state.tenureYears || 1) + 1;
        const preSimShields = state.immunityShields !== undefined ? state.immunityShields : 1;
        const preSimImpact = state.clubImpactScore || 50;
        const preSimDrought = state.trophyDrought || 0;
        const preSimEuroStatus = state.euroStatus || null;
        const result: any = simulateSeason();
        result._preSimMeta = { preSimTenure, preSimShields, preSimImpact, preSimDrought };
        result.euroThisSeason = preSimEuroStatus;
        const simSeasonYear = result.year;
        const playedTier = result.clubTier || state.club.tier || 5;
        const tier = playedTier;
        const initialSimTeams = result.numTeams || getLeagueSize(playedTier, state.club.country || "GER");
        setTotalMatchdaysForOverlay((initialSimTeams - 1) * 2);
        const cupRunQueue: any[] = [];
        const actualRivalName = useGameStore.getState().rivalClubName;
        const actualRivalClub = actualRivalName ? clubsDb.find(c => c.name === actualRivalName) : null;
        const clubCountry = normalizeCountry(state.club.country || "GER");
        const isGer = clubCountry === "GER";
        const realDataActive = isAnyModActive();
        const bPackage = getBroadcastingPackage(clubCountry, false, { clubName: state.club.name });
        const euroPackage = getBroadcastingPackage(clubCountry, true, { clubName: state.club.name });
        const isReserve = isReserveClub(state.club.name);

        // 2. Cup matches (Domestic / Regional)
        const lastHistSecondHalf = state.history.length > 0 ? state.history[state.history.length - 1] : null;
        const isSameClubSecondHalf = Boolean(lastHistSecondHalf && (!lastHistSecondHalf.clubName || lastHistSecondHalf.clubName === state.club.name));
        const wonDfbCupLastYear = isSameClubSecondHalf && (lastHistSecondHalf.trophiesThisYear?.dfb || 0) === 1;
        const wonRegCupLastYear = tier > 1 && isSameClubSecondHalf && (lastHistSecondHalf.trophiesThisYear?.reg || 0) === 1;
        const isInNationalCup = tier <= 2 || wonRegCupLastYear || wonDfbCupLastYear;
        const isRegionalCup = !isInNationalCup && tier > 1;
        
        // Regional Cup: Lower-tier non-reserve clubs actively compete in the Regional Cup Semi-Final if qualified through QF
        if (!isReserve && isRegionalCup && (cupQualifiedForSf === true || (cupQualifiedForSf === null && Math.random() < 0.5))) {
             let realOppName = state.activeCupTournament?.sfOpponent;
             let oppOvr = state.activeCupTournament?.sfOpponentOvr;
             const allElimReg = Array.from(new Set([
                 ...eliminatedCupOpponents,
                 ...(state.activeCupTournament?.eliminatedClubs || []),
                 state.activeCupTournament?.qfOpponent
             ].filter(Boolean) as string[]));

             if (!realOppName || state.activeCupTournament?.year !== state.year || allElimReg.includes(realOppName)) {
                 let cupOpponents = clubsDb.filter(c => c.tier > 1 && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !allElimReg.includes(c.name) && !isReserveClub(c.name));
                 if (cupOpponents.length === 0) {
                     cupOpponents = clubsDb.filter(c => c.tier > 1 && c.name !== state.club.name && !allElimReg.includes(c.name) && !isReserveClub(c.name));
                 }
                 if (cupOpponents.length === 0) {
                     cupOpponents = clubsDb.filter(c => c.tier > 1 && c.name !== state.club.name && !isReserveClub(c.name));
                 }
                 const chosenOpponent = cupOpponents.sort(() => 0.5 - Math.random())[0];
                 oppOvr = chosenOpponent ? chosenOpponent.baseOvr : 58;
                 realOppName = chosenOpponent?.name || clubsDb.find(c => c.tier > 1 && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !allElimReg.includes(c.name))?.name || (clubCountry === 'FRA' ? 'Billère Handball' : clubCountry === 'POL' ? 'Śląsk Wrocław' : clubCountry === 'AUT' ? 'Handball Tirol' : clubCountry === 'SUI' ? 'Wacker Thun' : 'EHV Aue');
             }

             const safeRegCupName = (realDataActive && bPackage.regionalCupName && !/(supercup|super cup|superpokal|superkup|supercoppa|supertaca|supertaça|supercopa)/i.test(bPackage.regionalCupName))
                 ? bPackage.regionalCupName
                 : (isGer ? "DHB-Amateurpokal" : "Regional Cup");
             cupRunQueue.push({
                 type: "cup_sf",
                 title: "SEMI-FINAL",
                 subtitle: safeRegCupName.toUpperCase(),
                 broadcastPackage: bPackage,
                 cupName: safeRegCupName,
                 isAmateurCup: true,
                 arena: getClubHomeArena(state.club),
                 capacity: state.club.stadium || 4750,
                 opponentName: realOppName,
                 finalOpponent: state.activeCupTournament?.finalOpponent,
                 finalOpponentOvr: state.activeCupTournament?.finalOpponentOvr,
                 previousOpponents: Array.from(new Set([...allElimReg, ...(state.activeCupTournament?.eliminatedClubs || []), state.activeCupTournament?.qfOpponent, realOppName].filter(Boolean) as string[])),
                 opponentOvr: oppOvr || 58,
                 playerOvr: state.club.baseOvr,
                 playerClubName: state.club.name,
                 baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (state.club.baseOvr - (oppOvr || 58)) * 0.02)) * 100),
             });
        }
        
        // National Cup: Tier 1, Tier 2, or reigning Regional Cup champions
        // If user won their QF before winter break (cupQualifiedForSf === true), Semi-Final is GUARANTEED!
        // If user lost QF (cupQualifiedForSf === false), they were eliminated and do NOT play SF.
        const shouldPlayNationalSf = !isReserve && isInNationalCup && (
          cupQualifiedForSf === true || 
          (cupQualifiedForSf === null && (wonRegCupLastYear || Math.random() < (tier === 1 ? 0.65 : 0.40)))
        );

        if (shouldPlayNationalSf) {
             let realOppName = state.activeCupTournament?.sfOpponent;
             let oppOvr = state.activeCupTournament?.sfOpponentOvr;
             const allElim = Array.from(new Set([
                 ...eliminatedCupOpponents,
                 ...(state.activeCupTournament?.eliminatedClubs || []),
                 state.activeCupTournament?.qfOpponent
             ].filter(Boolean) as string[]));

             if (!realOppName || state.activeCupTournament?.year !== state.year || allElim.includes(realOppName)) {
                 let cupOpponents = clubsDb.filter(c => c.tier <= 2 && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !allElim.includes(c.name) && !isReserveClub(c.name));
                 if (cupOpponents.length === 0) {
                     cupOpponents = clubsDb.filter(c => c.tier <= 2 && c.name !== state.club.name && !allElim.includes(c.name) && !isReserveClub(c.name));
                 }
                 if (cupOpponents.length === 0) {
                     cupOpponents = clubsDb.filter(c => c.name !== state.club.name && !allElim.includes(c.name) && !isReserveClub(c.name));
                 }
                 const chosenOpponent = cupOpponents.sort(() => 0.5 - Math.random())[0];
                 oppOvr = chosenOpponent ? chosenOpponent.baseOvr : (tier === 1 ? 82 : 72);
                 realOppName = chosenOpponent?.name || clubsDb.find(c => c.tier <= 2 && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !allElim.includes(c.name))?.name || (clubCountry === 'POR' ? 'FC Porto' : clubCountry === 'FRA' ? 'Montpellier Handball' : clubCountry === 'ESP' ? 'Bidasoa Irun' : 'THW Kiel');
             }

             cupRunQueue.push({
                 type: "cup_sf",
                 title: "SEMI-FINAL",
                 subtitle: realDataActive 
                     ? (wonRegCupLastYear ? `CINDERELLA RUN · ${bPackage.nationalCupName.toUpperCase()}` : bPackage.nationalCupName.toUpperCase())
                     : (wonRegCupLastYear 
                         ? "CINDERELLA CUP RUN! (" + (isGer ? "DHB-POKAL" : "NATIONAL CUP") + ")" 
                         : (isGer ? "DHB-POKAL" : "NATIONAL CUP")),
                 broadcastPackage: bPackage,
                 cupName: realDataActive ? bPackage.nationalCupName : (isGer ? "DHB-Pokal" : "National Cup"),
                 opponentName: realOppName,
                 finalOpponent: state.activeCupTournament?.finalOpponent,
                 finalOpponentOvr: state.activeCupTournament?.finalOpponentOvr,
                 previousOpponents: Array.from(new Set([...allElim, ...(state.activeCupTournament?.eliminatedClubs || []), state.activeCupTournament?.qfOpponent, realOppName].filter(Boolean) as string[])),
                 opponentOvr: oppOvr || (tier === 1 ? 82 : 72),
                 playerOvr: state.club.baseOvr,
                 playerClubName: state.club.name,
                 baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (state.club.baseOvr - (oppOvr || 78)) * 0.02)) * 100),
             });
        } else if (!isReserve && isInNationalCup) {
                 const cupName = realDataActive ? bPackage.nationalCupName : (isGer ? "DHB-Pokal" : "National Cup");
                 const exitRound = tier === 1 ? "Quarter-Finals" : (tier === 2 ? "Round of 16" : "Round of 32");
                 let div1Clubs = clubsDb.filter(c => c.tier <= 2 && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !isReserveClub(c.name));
                 if (div1Clubs.length === 0) {
                     div1Clubs = clubsDb.filter(c => c.tier <= 2 && c.name !== state.club.name && !isReserveClub(c.name));
                 }
                 const knockOpp = div1Clubs.sort(() => 0.5 - Math.random())[0]?.name || "Cup Opponent";
                 
                 // No toast for knocked out per user request

                 const currentRuns = useGameStore.getState().cupRunResults || [];
                 const alreadyRecordedNatCup = currentRuns.some(r => r.year === simSeasonYear && r.id === 'nat_cup');
                 if (!alreadyRecordedNatCup) {
                     useGameStore.getState().updateState({
                         cupRunResults: [
                             ...currentRuns,
                             {
                                 year: simSeasonYear,
                                 id: 'nat_cup',
                                 nameEn: realDataActive ? bPackage.nationalCupName : 'National Cup',
                                 nameDe: realDataActive ? bPackage.nationalCupName : 'Nationaler Pokal',
                                 won: false,
                                 exitRound: exitRound
                             }
                         ]
                     });
                 }
             }
        
        // 1. Decision Day (Playoff / Title Decider)
        const numTeams = getLeagueSize(tier, state.club.country || 'GER', state.club.id, state.club.tier, state.club.country || 'GER', clubsDb);
        const totalLeagueMatches = (numTeams - 1) * 2;
        const relegationThreshold = Math.max(1, numTeams - 1);
        
        // In European handball (2-1-0 points: 2 for win, 1 for draw):
        // On the final matchday, a title race ONLY exists if the gap between #1 and #2 is <= 2 points!
        // If the gap is > 2 points (points difference > 2), the championship was ALREADY clinched mathematically.
        const userPts = result.seasonStats.pts;
        const userPos = result.seasonStats.pos;

        let isCloseTitleRace = false;
        const decisionDayData = result.seasonStats?.decisionDay || result.decisionDay;
        if (userPos <= 2) {
            if (decisionDayData?.type === 'title') {
                const rivalP = decisionDayData.rivalPts;
                const gap = rivalP !== undefined ? Math.abs(userPts - rivalP) : 999;
                if (gap <= 2) {
                    isCloseTitleRace = true;
                }
            } else if ((result as any).rivalPts !== undefined) {
                const gap = Math.abs(userPts - (result as any).rivalPts);
                if (gap <= 2) {
                    isCloseTitleRace = true;
                }
            }
        }

        if (isCloseTitleRace) {
             const topTierContenders = clubsDb
                 .filter(c => c.tier === tier && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !isReserveClub(c.name))
                 .sort((a, b) => b.baseOvr - a.baseOvr);
             
             const rivalFromEngine = decisionDayData?.rivalName;
             const sameTierRival = topTierContenders.find(c => c.name === (rivalFromEngine || actualRivalName) && !isReserveClub(c.name));
             const rivalName = sameTierRival?.name || rivalFromEngine || (topTierContenders[0]?.name || "Title Rival");

             const directMatch = Math.random() > 0.5;
             const rivalPts = (decisionDayData?.type === 'title' && decisionDayData.rivalPts !== undefined)
                 ? decisionDayData.rivalPts
                 : (userPos === 1 ? Math.max(0, userPts - 1) : userPts + 1);
             const rivalGd = Math.max(40, Math.round((result.seasonStats.gf - result.seasonStats.ga) * 0.85));
             
             const remoteCandidates = clubsDb.filter(c => c.tier === tier && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== rivalName && c.name !== state.club.name && !isReserveClub(c.name));
             const chosenOpponent = directMatch 
                 ? rivalName 
                 : (remoteCandidates.sort(() => 0.5 - Math.random())[0]?.name || topTierContenders.find(c => c.name !== rivalName)?.name || "League Opponent");

             const deciderPackage = getBroadcastingPackage(clubCountry, false, {
               type: "championship_decider",
               isDecisionDay: true,
               year: simSeasonYear,
               clubName: state.club.name
             });

             const deciderPreTable = generateLeagueTable(
               useGameStore.getState(),
               clubsDb,
               tier,
               {
                 year: simSeasonYear,
                 clubName: state.club.name,
                 tier: tier,
                 pos: result.seasonStats.pos,
                 wins: result.seasonStats.wins,
                 draws: result.seasonStats.draws,
                 losses: result.seasonStats.losses,
                 pts: result.seasonStats.pts,
                 gf: result.seasonStats.gf,
                 ga: result.seasonStats.ga,
                 rivalName: rivalName,
                 rivalPts: rivalPts,
                 rivalGd: rivalGd,
               }
             );
             const curHistDecider = [...useGameStore.getState().history];
             if (curHistDecider.length > 0) {
               const lastIdxD = curHistDecider.length - 1;
               const updatedEntryD = { ...curHistDecider[lastIdxD] };
               syncFinalTableToHistory(updatedEntryD, tier, deciderPreTable);
               curHistDecider[lastIdxD] = updatedEntryD;
               useGameStore.getState().updateState({ history: curHistDecider });
             }

             cupRunQueue.push({
                 type: "championship_decider",
                 title: "DECISION DAY!",
                 subtitle: realDataActive 
                     ? deciderPackage.decisionDayShow.toUpperCase()
                     : (directMatch ? "DIRECT CLASH FOR THE TITLE" : "REMOTE CORRESPONDENCE BATTLE"),
                 broadcastPackage: deciderPackage,
                 opponentName: chosenOpponent,
                 rivalName: rivalName,
                 matchday: (numTeams - 1) * 2 - 1,
                 isDirect: directMatch,
                 tier: tier,
                 numTeams: numTeams,
                 opponentOvr: result.club.baseOvr + (Math.floor(Math.random() * 5) - 2),
                 playerOvr: state.club.baseOvr,
                 playerClubName: state.club.name,
                 baseWinProb: 50,
                 standings: getDecisionDayStandingsSlice(
                   deciderPreTable,
                   result.seasonStats.pos
                 )
             });
        } else if (tier > 1 && result.seasonStats.pos === 3 && !(isReserve && tier === 2)) {
             const latestHistPromo = useGameStore.getState().history;
             const upperDivTable = latestHistPromo.length > 0 ? latestHistPromo[latestHistPromo.length - 1]?.divisionTables?.[Math.max(1, tier - 1)] : undefined;
             const upperPlayoffRow = Array.isArray(upperDivTable) && upperDivTable.length >= 3
               ? (upperDivTable.find((r: any) => !r.isUser && r.statusMarker === 'PO') || upperDivTable[upperDivTable.length - 3])
               : undefined;
             const upperPlayoffClub = upperPlayoffRow
               ? clubsDb.find(c => c.name === upperPlayoffRow.name || String(c.id) === String(upperPlayoffRow.id))
               : undefined;
             const promoPlayoffOppName = upperPlayoffRow?.name || clubsDb.filter(c => c.tier === Math.max(1, tier - 1) && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !isReserveClub(c.name)).sort((a,b) => a.baseOvr - b.baseOvr)[2]?.name || (clubCountry === 'FRA' ? 'Dunkerque HGL' : clubCountry === 'POL' ? 'MMTS Kwidzyn' : clubCountry === 'AUT' ? 'BT Füchse' : clubCountry === 'SUI' ? 'BSV Bern' : 'TVB Stuttgart');
             const promoPlayoffOppOvr = upperPlayoffClub?.baseOvr || (result.club.baseOvr + (Math.floor(Math.random() * 5) - 2) + 4);

             cupRunQueue.push({
                 type: "playoff",
                 title: "DECISION DAY!",
                 matchday: (numTeams - 1) * 2 - 1,
                 tier: tier,
                 subtitle: realDataActive ? `${bPackage.networkName.toUpperCase()} · PROMOTION PLAYOFF` : "PROMOTION PLAYOFF",
                 broadcastPackage: bPackage,
                 numTeams: numTeams,
                 opponentName: promoPlayoffOppName,
                 opponentOvr: promoPlayoffOppOvr,
                 playerOvr: state.club.baseOvr,
                 playerClubName: state.club.name,
                 baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (state.club.baseOvr - promoPlayoffOppOvr) * 0.02)) * 100),
                 standings: getDecisionDayStandingsSlice(
                   generateLeagueTable(
                     useGameStore.getState(),
                     clubsDb,
                     tier,
                     {
                       year: simSeasonYear,
                       clubName: state.club.name,
                       tier: tier,
                       pos: result.seasonStats.pos,
                       wins: result.seasonStats.wins,
                       draws: result.seasonStats.draws,
                       losses: result.seasonStats.losses,
                       pts: result.seasonStats.pts,
                       gf: result.seasonStats.gf,
                       ga: result.seasonStats.ga,
                     }
                   ),
                   result.seasonStats.pos
                 )
             });
        } else if (tier < getMaxTier(state.club.country || "GER")) {
             // In European handball (2 pts for win, 1 for draw):
             // On Decision Day (last matchday), a relegation battle ONLY exists if the gap is <= 2 points!
             // If the team is safe by > 2 points (e.g. 17 vs 9 = 8 pts clear), survival is ALREADY clinched mathematically!
             const isDirectDropZone = result.seasonStats.pos >= relegationThreshold;
             const isRelegationPlayoffSpot = result.seasonStats.pos === relegationThreshold - 1;
             
             // Cross-tier playoff: The club in the playoff spot (relegationThreshold - 1, e.g. 16th in 18-team Bundesliga)
             // contests the promotion challenger from the division below.
             const isCrossTierPlayoff = isRelegationPlayoffSpot;

             // Generate preliminary standings to verify mathematical live relegation stakes
             const preliminaryTable = generateLeagueTable(
               useGameStore.getState(),
               clubsDb,
               tier,
               {
                 year: simSeasonYear,
                 clubName: state.club.name,
                 tier: tier,
                 pos: result.seasonStats.pos,
                 wins: result.seasonStats.wins,
                 draws: result.seasonStats.draws,
                 losses: result.seasonStats.losses,
                 pts: result.seasonStats.pts,
                 gf: result.seasonStats.gf,
                 ga: result.seasonStats.ga,
               }
             );
             const dropZoneRow = preliminaryTable.find(r => r.pos === relegationThreshold);
             const safetyRow = preliminaryTable.find(r => r.pos === relegationThreshold - 1);

             // In European handball (2 pts for win, 1 for draw, 0 for loss):
             // If inside the direct drop zone (17th), contest live survival battle if within 2 points of safety on matchday 34.
             // If in the playoff spot (16th place / relegationThreshold - 1), you ALWAYS play the Relegation Playoff on Decision Day!
             let isLiveRelegationBattle = false;
             let relegationRivalName = isDirectDropZone ? (safetyRow?.name || 'Safety Competitor') : (dropZoneRow?.name || 'Drop Zone Competitor');
             let relegationRivalPts = isDirectDropZone ? (userPts + 1) : (dropZoneRow?.pts ?? Math.max(0, userPts - 1));

             if (isDirectDropZone) {
               const gap = safetyRow ? (safetyRow.pts - userPts) : 999;
               if (gap <= 2 && gap >= 0) {
                 isLiveRelegationBattle = true;
               }
             } else if (isRelegationPlayoffSpot) {
               isLiveRelegationBattle = true;
             }

             if (isRelegationPlayoffSpot || isLiveRelegationBattle) {
               const sameTierDropOpps = clubsDb.filter(c => c.tier === tier && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !isReserveClub(c.name));
               const lowerTierNum = Math.min(getMaxTier(clubCountry), tier + 1);
               const latestHistReleg = useGameStore.getState().history;
               const lowerDivTable = latestHistReleg.length > 0 ? latestHistReleg[latestHistReleg.length - 1]?.divisionTables?.[lowerTierNum] : undefined;
               const lowerPlayoffRow = Array.isArray(lowerDivTable) && lowerDivTable.length >= 3
                 ? (lowerDivTable.find((r: any) => !r.isUser && r.pos === 3 && !isReserveClub(r.name)) || lowerDivTable.find((r: any) => !r.isUser && r.statusMarker === 'PO' && !isReserveClub(r.name)))
                 : undefined;
               const lowerTierPromoters = clubsDb.filter(c => c.tier === lowerTierNum && normalizeCountry(c.country || 'GER') === clubCountry && c.name !== state.club.name && !isReserveClub(c.name)).sort((a,b) => b.baseOvr - a.baseOvr);
               const lowerPlayoffClub = lowerPlayoffRow
                 ? clubsDb.find(c => c.name === lowerPlayoffRow.name || String(c.id) === String(lowerPlayoffRow.id))
                 : (lowerTierPromoters[2] || lowerTierPromoters[0]);
               
               // Opponent must strictly be same-tier for league Decision Day matches, or lower-tier 3rd-place playoff challenger for cross-tier playoffs
               const directMatch = Math.random() > 0.4;
               const isCrossTier = isRelegationPlayoffSpot && (Boolean(lowerPlayoffRow) || lowerTierPromoters.length > 0);
               const opponentName = isCrossTier
                 ? (lowerPlayoffRow?.name || lowerPlayoffClub?.name || (state.club.country === 'ESP' ? 'BM Burgos' : state.club.country === 'FRA' ? 'Billère Handball' : state.club.country === 'POL' ? 'Śląsk Wrocław' : state.club.country === 'SUI' ? 'Wacker Thun' : 'TuS N-Lübbecke'))
                 : (directMatch && sameTierDropOpps.some(c => c.name === relegationRivalName)
                     ? relegationRivalName
                     : (sameTierDropOpps.find(c => c.name === relegationRivalName)?.name || sameTierDropOpps.slice(Math.max(0, sameTierDropOpps.length - 3))[0]?.name || relegationRivalName));

               const rivalPts = isCrossTier
                 ? Math.max(0, result.seasonStats.pts - 1)
                 : relegationRivalPts;

               const relegPreTable = generateLeagueTable(
                 useGameStore.getState(),
                 clubsDb,
                 tier,
                 {
                   year: simSeasonYear,
                   clubName: state.club.name,
                   tier: tier,
                   pos: result.seasonStats.pos,
                   wins: result.seasonStats.wins,
                   draws: result.seasonStats.draws,
                   losses: result.seasonStats.losses,
                   pts: result.seasonStats.pts,
                   gf: result.seasonStats.gf,
                   ga: result.seasonStats.ga,
                   rivalName: relegationRivalName,
                   rivalPts,
                   rivalGd: Math.min(-10, (result.seasonStats.gf - result.seasonStats.ga) - 4),
                 }
               );
               const curHistReleg = [...useGameStore.getState().history];
               if (curHistReleg.length > 0) {
                 const lastIdxR = curHistReleg.length - 1;
                 const updatedEntryR = { ...curHistReleg[lastIdxR] };
                 syncFinalTableToHistory(updatedEntryR, tier, relegPreTable);
                 curHistReleg[lastIdxR] = updatedEntryR;
                 useGameStore.getState().updateState({ history: curHistReleg });
               }

               const relegationOppOvr = isCrossTier ? (lowerPlayoffClub?.baseOvr || (result.club.baseOvr - 2)) : (result.club.baseOvr + (Math.floor(Math.random() * 5) - 2) - 4);
               cupRunQueue.push({
                   type: "relegation_playoff",
                   title: "DECISION DAY!",
                   matchday: (numTeams - 1) * 2 - 1,
                   tier: tier,
                   subtitle: realDataActive 
                     ? (isCrossTier ? `${bPackage.networkName.toUpperCase()} · RELEGATION PLAYOFF` : `${bPackage.networkName.toUpperCase()} · SURVIVAL BATTLE`)
                     : (isCrossTier ? "RELEGATION PLAYOFF · SURVIVAL DECIDER" : "RELEGATION DECIDER · SURVIVAL BATTLE"),
                   broadcastPackage: bPackage,
                   numTeams: numTeams,
                   opponentName,
                   rivalName: isCrossTier ? opponentName : relegationRivalName,
                   opponentOvr: relegationOppOvr,
                   playerOvr: state.club.baseOvr,
                   playerClubName: state.club.name,
                   baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (state.club.baseOvr - relegationOppOvr) * 0.02)) * 100),
                   standings: getDecisionDayStandingsSlice(
                     relegPreTable,
                     result.seasonStats.pos,
                     true
                   )
               });
             }
        }

        // European matches (Strictly Top-Flight Tier 1 Only, or EL miracle qualifier)
        const allElimEuro = Array.from(new Set([
            ...eliminatedEuroOpponents,
            ...(state.activeEuroTournament?.eliminatedClubs || []),
            state.activeEuroTournament?.qfOpponent
        ].filter(Boolean) as string[]));
        const presetEuroSfOpp = (state.activeEuroTournament?.year === simSeasonYear && state.activeEuroTournament?.sfOpponent && !allElimEuro.includes(state.activeEuroTournament.sfOpponent))
            ? state.activeEuroTournament.sfOpponent
            : undefined;
        const presetEuroSfOvr = presetEuroSfOpp ? state.activeEuroTournament?.sfOpponentOvr : undefined;

        if (tier === 1 && (preSimEuroStatus === "CL" || preSimEuroStatus === "cl")) {
           let clSfChance = Math.max(0.01, (state.club.baseOvr - 80) / 100) * 1.5;
           if (state.club.baseOvr >= 90) clSfChance = 0.6;
           if (state.club.baseOvr >= 95) clSfChance = 0.85;
           if (euroQualifiedForSf === true || (euroQualifiedForSf === null && Math.random() < clSfChance)) {
               const validClOpps = clubsDb.filter(c => c.baseOvr >= 83 && c.name !== state.club.name && !allElimEuro.includes(c.name) && !isReserveClub(c.name));
               const pickedClOpp = validClOpps.length > 0 ? validClOpps.slice(0, 5).sort(() => 0.5 - Math.random())[0] : clubsDb.filter(c => c.name !== state.club.name && !allElimEuro.includes(c.name) && !isReserveClub(c.name)).slice(0, 5).sort(() => 0.5 - Math.random())[0];
               const clOpponent = presetEuroSfOpp || pickedClOpp?.name || (clubCountry === 'GER' ? 'Barça' : 'Telekom Veszprém');
               const clOppOvr = presetEuroSfOvr || pickedClOpp?.baseOvr || 87;
               cupRunQueue.push({
                   type: "cl_sf",
                   title: "SEMI-FINAL",
                   cupName: "EHF Champions League",
                   subtitle: realDataActive ? euroPackage.decisionDayShow.toUpperCase() : "EHF CHAMPIONS LEAGUE",
                   broadcastPackage: euroPackage,
                   opponentName: clOpponent,
                   finalOpponent: state.activeEuroTournament?.finalOpponent,
                   finalOpponentOvr: state.activeEuroTournament?.finalOpponentOvr,
                   previousOpponents: Array.from(new Set([...allElimEuro, clOpponent].filter(Boolean) as string[])),
                   opponentOvr: clOppOvr,
                   playerOvr: state.club.baseOvr,
                   playerClubName: state.club.name,
                   baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (state.club.baseOvr - clOppOvr) * 0.02)) * 100),
               });
           }
        } else if (preSimEuroStatus === "EL" || preSimEuroStatus === "el") {
           let elSfChance = Math.max(0.01, (state.club.baseOvr - 75) / 100) * 1.5;
           if (state.club.baseOvr >= 85) elSfChance = 0.6;
           if (state.club.baseOvr >= 90) elSfChance = 0.85;
           if (euroQualifiedForSf === true || (euroQualifiedForSf === null && Math.random() < elSfChance)) {
               const validElOpps = clubsDb.filter(c => c.baseOvr >= 75 && c.baseOvr <= 85 && c.name !== state.club.name && !allElimEuro.includes(c.name) && !isReserveClub(c.name));
               const pickedElOpp = validElOpps.length > 0 ? validElOpps.slice(0, 5).sort(() => 0.5 - Math.random())[0] : clubsDb.filter(c => c.name !== state.club.name && !allElimEuro.includes(c.name) && !isReserveClub(c.name)).slice(0, 5).sort(() => 0.5 - Math.random())[0];
               const elOpponent = presetEuroSfOpp || pickedElOpp?.name || (clubCountry === 'GER' ? 'Montpellier Handball' : 'Füchse Berlin');
               const elOppOvr = presetEuroSfOvr || pickedElOpp?.baseOvr || 80;
               cupRunQueue.push({
                   type: "euro_cup_sf",
                   title: "SEMI-FINAL",
                   cupName: "EHF European League",
                   subtitle: realDataActive ? "EHF EURO LEAGUE · ROAD TO FINAL4" : "EHF EURO LEAGUE",
                   broadcastPackage: euroPackage,
                   opponentName: elOpponent,
                   finalOpponent: state.activeEuroTournament?.finalOpponent,
                   finalOpponentOvr: state.activeEuroTournament?.finalOpponentOvr,
                   previousOpponents: Array.from(new Set([...allElimEuro, elOpponent].filter(Boolean) as string[])),
                   opponentOvr: elOppOvr,
                   playerOvr: state.club.baseOvr,
                   playerClubName: state.club.name,
                   baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (state.club.baseOvr - elOppOvr) * 0.02)) * 100),
               });
           }
        } else if (tier === 1 && (preSimEuroStatus === "ECL" || preSimEuroStatus === "ecl")) {
           let eclSfChance = Math.max(0.01, (state.club.baseOvr - 65) / 100) * 1.5;
           if (state.club.baseOvr >= 75) eclSfChance = 0.6;
           if (state.club.baseOvr >= 85) eclSfChance = 0.85;
           if (euroQualifiedForSf === true || (euroQualifiedForSf === null && Math.random() < eclSfChance)) {
               const validEclOpps = clubsDb.filter(c => c.baseOvr >= 65 && c.baseOvr <= 75 && c.name !== state.club.name && !allElimEuro.includes(c.name) && !isReserveClub(c.name));
               const pickedEclOpp = validEclOpps.length > 0 ? validEclOpps.slice(0, 5).sort(() => 0.5 - Math.random())[0] : clubsDb.filter(c => c.name !== state.club.name && !allElimEuro.includes(c.name) && !isReserveClub(c.name)).slice(0, 5).sort(() => 0.5 - Math.random())[0];
               const eclOpponent = presetEuroSfOpp || pickedEclOpp?.name || (clubCountry === 'GER' ? 'Bregenz Handball' : 'HC Kriens-Luzern');
               const eclOppOvr = presetEuroSfOvr || pickedEclOpp?.baseOvr || 70;
               cupRunQueue.push({
                   type: "euro_cup_sf",
                   title: "SEMI-FINAL",
                   cupName: "EHF European Cup",
                   subtitle: realDataActive ? "EHF EUROPEAN CUP · ROAD TO GLORY" : "EHF EUROPEAN CUP",
                   broadcastPackage: euroPackage,
                   opponentName: eclOpponent,
                   finalOpponent: state.activeEuroTournament?.finalOpponent,
                   finalOpponentOvr: state.activeEuroTournament?.finalOpponentOvr,
                   previousOpponents: Array.from(new Set([...allElimEuro, eclOpponent].filter(Boolean) as string[])),
                   opponentOvr: eclOppOvr,
                   playerOvr: state.club.baseOvr,
                   playerClubName: state.club.name,
                   baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (state.club.baseOvr - eclOppOvr) * 0.02)) * 100),
               });
           }
        }

        // Flag rival matches
        cupRunQueue.forEach(m => {
          if (m.opponentName === actualRivalName) m.isRivalClash = true;
        });

        // Categorize post-season matches into clear sequential phases per user requirement:
        // 1. League Decider (championship_decider, playoff, relegation_playoff)
        // 2. Domestic Cup / Magic Cup (cup_sf)
        // 3. European Cup (cl_sf, euro_cup_sf)
        const deciderMatches = cupRunQueue.filter(m => ['championship_decider', 'playoff', 'relegation_playoff'].includes(m.type));
        const domCupMatches = cupRunQueue.filter(m => ['cup_sf'].includes(m.type));
        const euroCupMatches = cupRunQueue.filter(m => ['cl_sf', 'euro_cup_sf'].includes(m.type));

        setPendingSeasonResult(result);
        setIsSimulating(false);
        setQueuedCupMatches(domCupMatches);
        setQueuedEuroMatches(euroCupMatches);

        if (deciderMatches.length > 0) {
          // Strip any premature league/relegation notifications before Decision Day match kicks off
          const currentNotifs = useGameStore.getState().notifications || [];
          useGameStore.getState().updateState({
            notifications: currentNotifs.filter((n: any) => !(
              n.category === 'decision_day' ||
              n.category === 'league' ||
              (typeof n.message === 'string' && (n.message.includes('Relegated!') || n.message.includes('You have been sacked!') || n.message.includes('Champions!') || n.message.includes('Winners! (Promoted)')))
            ))
          });
          // Play Decision Day match first!
          setPendingMatches([deciderMatches[0]]);
        } else {
          // Check for direct league finish celebration (Champion or Runner-Up / Promoted)
          const leagueName = getLeagueInfo(tier, state.club.country).name;
          const isChamp = result.seasonStats.pos === 1;
          const isRunnerUp = result.seasonStats.pos === 2;
          const isPromoted = isRunnerUp && tier > 1 && !(tier === 2 && isReserveClub(state.club.name));

          if (isChamp) {
            const history = useGameStore.getState().history;
            const lastHist = history.length > 0 ? history[history.length - 1] : null;
            const fullFinalTable = lastHist?.finalTable || generateLeagueTable(useGameStore.getState(), clubsDb, tier, lastHist || undefined);
            const verifiedStandings = getDecisionDayStandingsSlice(fullFinalTable, 1, false, 'champion');

            let champToast = {
              id: Math.random().toString(),
              type: "celebration",
              category: "league",
              message: `🏆 ${leagueName} Champions!`,
              subtitle: `Crowned Champions of ${leagueName} in Season ${simSeasonYear}!`,
              read: false,
              standings: verifiedStandings
            };
            if (history.length > 1) {
              const prevHistEntry = history[history.length - 2];
              const isSameClubPrev = !prevHistEntry.clubName || prevHistEntry.clubName === state.club.name;
              const prevPos = prevHistEntry.pos;
              const prevTier = prevHistEntry.tier;
              if (isSameClubPrev && prevPos === 1 && prevTier >= tier) {
                champToast = {
                  ...champToast,
                  message: `🏆 BACK TO BACK CHAMPIONS!`,
                  subtitle: `Back-to-back league titles! An extraordinary dynasty in the making.`,
                  standings: verifiedStandings
                };
              }
            }
            syncTrophyToUniverse(tier === 1 ? 'bl' : 'lower', simSeasonYear, tier);
            setActiveCelebrationToast(champToast);
            useGameStore.getState().updateState({
              notifications: [
                champToast,
                ...(useGameStore.getState().notifications || []).filter(n => n.id !== champToast.id && n.category !== 'decision_day')
              ]
            });
            setPendingMatches([]);
          } else if (isPromoted) {
            const nextLgName = getLeagueInfo(tier - 1, state.club.country).name;
            const history = useGameStore.getState().history;
            const lastHist = history.length > 0 ? history[history.length - 1] : null;
            const fullFinalTable = lastHist?.finalTable || generateLeagueTable(useGameStore.getState(), clubsDb, tier, lastHist || undefined);
            const verifiedStandings = getDecisionDayStandingsSlice(fullFinalTable, 2, false, 'runner_up');

            let promoToast = {
              id: Math.random().toString(),
              type: "celebration",
              category: "league",
              message: `🏆 Promoted to ${nextLgName}! (Runner-Up)`,
              subtitle: `Secured 2nd place and guaranteed promotion to ${nextLgName}!`,
              read: false,
              standings: verifiedStandings
            };
            if (history.length > 1) {
              const prevHistEntry = history[history.length - 2];
              const isSameClubPrev = !prevHistEntry.clubName || prevHistEntry.clubName === state.club.name;
              const prevPos = prevHistEntry.pos;
              const prevTier = prevHistEntry.tier;
              if (isSameClubPrev && (prevPos === 1 || prevPos === 2) && prevTier > tier) {
                promoToast = {
                  ...promoToast,
                  message: `🔥 BACK TO BACK PROMOTIONS!`,
                  subtitle: `Ascending the leagues with consecutive promotions!`
                };
              }
            }
            setActiveCelebrationToast(promoToast);
            useGameStore.getState().updateState({
              notifications: [
                ...(useGameStore.getState().notifications || []).filter(n => !n.read && n.id !== promoToast.id && n.category !== 'league'),
                promoToast
              ]
            });
            setPendingMatches([]);
          } else if (isRunnerUp && tier === 1) {
            const runnerUpToast = {
              id: Math.random().toString(),
              type: "celebration",
              category: "league",
              message: `🥈 ${leagueName} Runner-Up!`,
              subtitle: `Secured 2nd place and qualified for the EHF Champions League!`,
              read: false
            };
            // Silverware deserves modal toasts; runner-up finishes are logged to notifications to eliminate modal fatigue
            useGameStore.getState().updateState({
              notifications: [
                ...(useGameStore.getState().notifications || []).filter(n => !n.read && n.id !== runnerUpToast.id),
                runnerUpToast
              ]
            });
            if (domCupMatches.length > 0) {
              setPendingMatches([domCupMatches[0]]);
              setQueuedCupMatches(domCupMatches.slice(1));
            } else if (euroCupMatches.length > 0) {
              setPendingMatches([euroCupMatches[0]]);
              setQueuedEuroMatches(euroCupMatches.slice(1));
            } else {
              finishSimulation(result);
            }
          } else if (domCupMatches.length > 0) {
            // Start Domestic Cup run directly
            setPendingMatches([domCupMatches[0]]);
            setQueuedCupMatches(domCupMatches.slice(1));
          } else if (euroCupMatches.length > 0) {
            // Start Euro Cup run directly
            setPendingMatches([euroCupMatches[0]]);
            setQueuedEuroMatches(euroCupMatches.slice(1));
          } else {
            finishSimulation(result);
          }
        }

      } catch (e: any) {
        console.error("Simulation error:", e);
        const currentNotifications = useGameStore.getState().notifications || [];
        useGameStore.getState().updateState({
          postSeasonPending: false,
          notifications: [
            ...currentNotifications,
            {
              id: Math.random().toString(),
              type: 'error',
              message: `Simulation Error: ${e?.message || 'Unexpected error occurred'}`,
              read: false
            }
          ].slice(-3)
        });
        isSimulatingRef.current = false;
        setIsSimulating(false);
        setShowSimulatingOverlay(false);
      }
    }, 50);
  };

  const finishSimulation = (result: any) => {
      isSimulatingRef.current = false;
      // Set the start of season OVR for NEXT year to whatever it ended up as now
      useGameStore.getState().updateState({ startOfSeasonOvr: result.club.baseOvr });

      const latestStorePreFinish = useGameStore.getState();
      const pendingSc = latestStorePreFinish.pendingSupercupTrophies;
      if (pendingSc && pendingSc.sc) {
        result.trophiesThisYear = {
          ...(result.trophiesThisYear || {}),
          ...(pendingSc.sc ? { sc: pendingSc.sc } : {})
        };
      }
      const currentHistory = latestStorePreFinish.history;
      const actualPlayedTier = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1].tier : result.club.tier;
      if (currentHistory.length > 0) {
        const lastIdx = currentHistory.length - 1;
        const hasResolvedCupFinals = Boolean(
          latestStorePreFinish.resolvedMatchContext?.cupFinals &&
          Object.keys(latestStorePreFinish.resolvedMatchContext.cupFinals).length > 0
        );
        const hasResolvedPlayoffDecider = Boolean(
          latestStorePreFinish.resolvedMatchContext?.playoffDecider ||
          latestStorePreFinish.playoffVictoryOverride?.active
        );
        const histSeasonYear = currentHistory[lastIdx].year;
        const scopedSeasonMovements = (latestStorePreFinish.universeMovements || currentHistory[lastIdx].universeMovements || []).filter(
          (m: any) => m && (m.year === undefined || m.year === histSeasonYear)
        );
        const mergedHistTrophies = {
          ...(currentHistory[lastIdx].trophiesThisYear || {}),
          ...(pendingSc?.sc ? { sc: pendingSc.sc } : {})
        };
        const updatedHistItem: any = {
          ...currentHistory[lastIdx],
          trophiesThisYear: mergedHistTrophies,
          universeMovements: scopedSeasonMovements,
          ...(latestStorePreFinish.resolvedMatchContext ? { resolvedMatchContext: latestStorePreFinish.resolvedMatchContext } : {})
        };
        if (!updatedHistItem.finalTable || hasResolvedCupFinals || hasResolvedPlayoffDecider) {
          delete updatedHistItem.finalTable;
          const latestWorlds = latestStorePreFinish.worldClubs || {};
          const freshClubsDb = getActiveClubs().map(c => mergeClubWithWorldState(c, latestWorlds[String(c.id)] || latestWorlds[Number(c.id)]));
          const fullTable = generateLeagueTable(latestStorePreFinish, freshClubsDb, actualPlayedTier, updatedHistItem);
          syncFinalTableToHistory(updatedHistItem, actualPlayedTier, fullTable);
        }
        const updatedHistory = [...currentHistory];
        updatedHistory[lastIdx] = updatedHistItem;
        latestStorePreFinish.updateState({ history: pruneCareerHistoryForStorage(updatedHistory) });
      }

      // Authoritatively reconcile Board Roadmap from pre-simulation snapshot after ALL postseason Key Matches conclude
      const preSimRoadmap: BoardRoadmap | undefined = result._preSimRoadmap;
      if (preSimRoadmap && preSimRoadmap.goals) {
        const latestStore = useGameStore.getState();
        const latestHist = latestStore.history;
        const lastHistEntry = latestHist.length > 0 ? latestHist[latestHist.length - 1] : null;
        const completedSeasonYear = lastHistEntry?.year ?? result.year ?? (latestStore.year - 1);
        const simMp = result._simRoadmapEarnedMp || 0;
        const simCash = result._simRoadmapEarnedCash || 0;
        const baseBudget = latestStore.budget - simCash;
        const baseSp = Math.max(0, (latestStore.skillPoints || 0) - simMp);
        const baseEarnedPoints = Math.max(0, (result.earnedPoints || 0) - simMp);

        const clubForRoadmap: Club = {
          ...latestStore.club,
          currentBudget: baseBudget
        };
        const finalEval = evaluateRoadmapProgress(
          JSON.parse(JSON.stringify(preSimRoadmap)),
          clubForRoadmap,
          completedSeasonYear,
          result.seasonStats || { pos: lastHistEntry?.pos || 1, pts: lastHistEntry?.pts || 0 },
          latestHist,
          lastHistEntry?.trophiesThisYear || result.trophiesThisYear || {}
        );

        const finalSp = baseSp + finalEval.earnedMp;
        const finalBudget = baseBudget + (finalEval.earnedCash || 0);
        const finalEarnedPoints = baseEarnedPoints + finalEval.earnedMp;
        const nextPostRoadmap = finalEval.roadmapFinished
          ? generateBoardRoadmap(
              { ...clubForRoadmap, currentBudget: finalBudget },
              latestStore.year,
              latestHist
            )
          : finalEval.updatedRoadmap;

        const roadmapNotifs = finalEval.completedGoals.map(g => ({
          id: Math.random().toString(),
          type: "celebration",
          category: "board_roadmap",
          message: `🎯 ROADMAP GOAL ACHIEVED: ${g.titleEn}! (+${g.rewardMp} MP)`,
          subtitle: `Strategic board milestone reached! Rewarded +${g.rewardMp} Manager Points${g.rewardCash ? ` and +${formatMoney(g.rewardCash)} budget` : ''}.`,
          read: false
        }));
        if (finalEval.roadmapFinished && finalEval.success) {
          roadmapNotifs.push({
            id: Math.random().toString(),
            type: "celebration",
            category: "board_roadmap",
            message: `🏆 STRATEGIC ROADMAP COMPLETED! (+3 MP Bonus)`,
            subtitle: `Outstanding managerial execution! The Board approves the next multi-year roadmap.`,
            read: false
          });
        }

        const nonRoadmapNotifs = (latestStore.notifications || []).filter((n: any) => n.category !== 'board_roadmap');
        latestStore.updateState({
          skillPoints: finalSp,
          budget: finalBudget,
          club: { ...latestStore.club, currentBudget: finalBudget },
          boardRoadmap: nextPostRoadmap,
          notifications: [...roadmapNotifs, ...nonRoadmapNotifs].slice(0, 50)
        });

        if (Array.isArray(result.extraNotifications)) {
          result.extraNotifications = [
            ...roadmapNotifs,
            ...result.extraNotifications.filter((n: any) => n.category !== 'board_roadmap')
          ];
        }
        result.skillPoints = finalSp;
        result.earnedPoints = finalEarnedPoints;
        result.newBudget = finalBudget;
        result.evaluatedRoadmap = finalEval.updatedRoadmap;
        result._simRoadmapEarnedMp = finalEval.earnedMp;
        result._simRoadmapEarnedCash = finalEval.earnedCash || 0;
      }

      // Recalculate live career score so postseason cup/playoff/decider outcomes are immediately reflected
      const stateForLiveScore = useGameStore.getState();
      const updatedLiveScore = calculateLiveScore(stateForLiveScore);
      stateForLiveScore.updateState({ careerScore: updatedLiveScore, score: updatedLiveScore });
      
      const playedTier = result.clubTier || actualPlayedTier;
      const maxTier = getMaxTier(state.club.country || 'GER');
      let targetNextTier = result.nextTier || result.club.tier;
      if (result.relegated && !result.survived && targetNextTier <= playedTier && playedTier < maxTier) {
        targetNextTier = playedTier + 1;
      } else if (result.promoted && targetNextTier >= playedTier && playedTier > 1) {
        targetNextTier = playedTier - 1;
      }
      const isRelegatedVal = Boolean(result.relegated || (targetNextTier > playedTier && playedTier < maxTier && !result.survived));
      const isSurvivedVal = Boolean(!isRelegatedVal && !result.relegated && playedTier < maxTier && (result.survived || (targetNextTier === playedTier && result.seasonStats.pos === Math.max(1, (result.numTeams || 10) - 2))));

      const mappedData = {
        year: result.year,
        clubName: result.club.name,
        clubColor: result.club.color,
        clubLogo: result.club.logo,
        tier: playedTier,
        nextTier: targetNextTier,
        pos: result.seasonStats.pos,
        wins: result.seasonStats.wins,
        draws: result.seasonStats.draws,
        losses: result.seasonStats.losses,
        pts: result.seasonStats.pts,
        gf: result.seasonStats.gf,
        ga: result.seasonStats.ga,
        pointsDeducted: result.seasonStats.pointsDeducted,
        revenue: result.financials.estRevenue,
        wages: result.financials.wages,
        debtInterest: result.financials.debtInterest,
        netProfit: result.financials.net,
        endBudget: useGameStore.getState().budget ?? result.newBudget,
        avgAttendance: result.financials.expectedAtt,
        matchdayIncome: result.financials.matchdayIncome ?? result.financials.matchdayIncomeK,
        sponsorInc: result.financials.sponsorInc,
        extraSponsorInc: result.financials.extraSponsorInc,
        seasonSponsorDeals: result.seasonSponsorDeals,
        trophiesThisYear: result.trophiesThisYear || (result.seasonStats.pos === 1 ? (playedTier === 1 && !result.promoted ? { bl: 1 } : { lower: 1 }) : {}),
        euroNextSeason: useGameStore.getState().euroStatus ?? result.euroStatus,
        euroThisSeason: result.euroThisSeason,
        clubTier: playedTier,
        rosterUpdates: result.rosterUpdates,
        startOvr: result.startOvr ?? state.startOfSeasonOvr ?? state.club.baseOvr, // Pre-prep phase OVR
        preSimOvr: result.preSimOvr ?? state.club.baseOvr, // OVR right before hitting simulate
        newBaseOvr: result.club.baseOvr,
        graduatedYouths: result.graduatedYouths,
        departedYouths: result.departedYouths,
        totalSkillPoints: result.skillPoints,
        pointsEarned: result.earnedPoints || 0,
        extraNotifications: result.extraNotifications,
        performanceDealResult: result.performanceDealResult,
        rivalryThisSeason: result.rivalryThisSeason,
        rivalName: (useGameStore.getState().history.slice(-1)[0]?.rivalName) || result.rivalName,
        rivalPts: (useGameStore.getState().history.slice(-1)[0]?.rivalPts) || result.rivalPts,
        rivalGd: (useGameStore.getState().history.slice(-1)[0]?.rivalGd) || result.rivalGd,
        finalTable: (useGameStore.getState().history.slice(-1)[0]?.finalTable) || result.finalTable,
        universeMovements: (useGameStore.getState().history.slice(-1)[0]?.universeMovements) || useGameStore.getState().universeMovements || result.universeMovements,
        insolventClubs: result.insolventClubs,
        worldClubs: result.worldClubs || state.worldClubs,
        tactic: state.tactic,
        consecutiveTitles: useGameStore.getState().consecutiveTitles ?? result.consecutiveTitles ?? state.consecutiveTitles ?? 0,
        relegated: isRelegatedVal,
        survived: isSurvivedVal,
        promoted: Boolean(result.promoted || targetNextTier < playedTier),
        isSacked: Boolean(result.isSacked || useGameStore.getState().isSacked),
      };
      const isRelegated = isRelegatedVal && !result.survived && (mappedData.tier < maxTier);
      const isPromoted = mappedData.nextTier < mappedData.tier;

      if (isRelegated) {
        setStagedSeasonResultData(mappedData);
        setStatusChange('relegation');
      } else if (isPromoted) {
        setStagedSeasonResultData(mappedData);
        setStatusChange('promotion');
      } else {
        setSeasonResultData(mappedData);
      }
      setIsSimulating(false);
      const currentStore = useGameStore.getState();
      if (currentStore.budget >= 0 && currentStore.seasonsInDebt > 0) {
          currentStore.updateState({ seasonsInDebt: 0, bankruptcyPending: false });
      }
      // Note: performance deal result is integrated directly into SeasonFinishModal banner & notifications
      if (mappedData.extraNotifications && mappedData.extraNotifications.length > 0) {
        const existingNotifs = useGameStore.getState().notifications || [];
        const existingIds = new Set(existingNotifs.map((n: any) => n.id));
        const missingExtra = mappedData.extraNotifications.filter((n: any) => !existingIds.has(n.id));
        if (missingExtra.length > 0) {
          useGameStore.getState().updateState({ notifications: [...existingNotifs, ...missingExtra] });
        }
      }
      const finalStateAfterSim = useGameStore.getState();
      if (!finalStateAfterSim.endlessModeActive && finalStateAfterSim.history.length === 35) {
        saveHighscore(finalStateAfterSim);
      }
  };

  const syncTrophyToUniverse = (
    cupKey: 'bl' | 'lower' | 'dfb' | 'reg' | 'cl' | 'el' | 'ecl' | 'cwc' | 'sc' | 'esc',
    seasonYear: number,
    customTier?: number,
    customWinnerClub?: Club,
    customCupTitle?: string
  ) => {
    const store = useGameStore.getState();
    const winningClub = customWinnerClub || store.club;
    const isDomCup = cupKey === 'dfb' || cupKey === 'reg' || cupKey === 'bl' || cupKey === 'lower' || cupKey === 'sc';
    const userCountry = isDomCup ? (store.club.country || winningClub.country || 'GER') : (winningClub.country || store.club.country || 'GER');
    const normCountry = normalizeCountry(userCountry);
    const tier = customTier || winningClub.tier || store.club.tier || 1;
    
    let cupTitle = '';
    let movementType: 'champion' | 'intl_cup' = 'intl_cup';
    const defaultDomCupTitle = getFAInfo(normCountry).cup || 'National Cup';
    const defaultRegCupTitle = normCountry === 'GER' ? 'DHB-Amateurpokal' : 'Regional Cup';
    
    if (cupKey === 'bl' || cupKey === 'lower') {
      movementType = 'champion';
    } else if (cupKey === 'cl') {
      cupTitle = customCupTitle || 'EHF Champions League';
    } else if (cupKey === 'el') {
      cupTitle = customCupTitle || 'EHF European League';
    } else if (cupKey === 'ecl') {
      cupTitle = customCupTitle || 'EHF European Cup';
    } else if (cupKey === 'cwc') {
      cupTitle = customCupTitle || 'IHF Super Globe';
    } else if (cupKey === 'esc') {
      cupTitle = customCupTitle || getEuropeanSupercupInfo(isAnyModActive()).name;
    } else if (cupKey === 'sc') {
      cupTitle = customCupTitle || getDomesticSupercupInfo(normCountry, isAnyModActive()).name;
    } else if (cupKey === 'dfb') {
      cupTitle = customCupTitle || defaultDomCupTitle;
    } else if (cupKey === 'reg') {
      cupTitle = customCupTitle || defaultRegCupTitle;
    }

    const newMovement: UniverseMovement = {
      id: movementType === 'intl_cup' ? `${winningClub.id}-${seasonYear}-cup-${cupKey}` : `${winningClub.id}-${seasonYear}-${cupKey}`,
      year: seasonYear,
      clubId: String(winningClub.id),
      clubName: winningClub.name,
      clubLogo: winningClub.logo,
      clubColor: winningClub.color,
      country: normCountry,
      type: movementType,
      fromTier: tier,
      toTier: tier,
      cupTitle: cupTitle || undefined,
      isKey: true
    };

    const currentMovements = [...(store.universeMovements || [])];
    const filteredMovements = currentMovements.filter(m => {
      if (m.year !== seasonYear) return true;
      if (movementType === 'champion') {
        return !(m.type === 'champion' && m.fromTier === tier && normalizeCountry(m.country || 'GER') === normCountry);
      }
      if (cupTitle) {
        const mId = String(m.id || '');
        const matchesIdSuffix = mId.endsWith(`-cup-${cupKey}`) || mId.endsWith(`-${cupKey}`);
        const matchesTitle =
          m.cupTitle === cupTitle ||
          (cupKey === 'dfb' && m.cupTitle === defaultDomCupTitle) ||
          (cupKey === 'reg' && m.cupTitle === defaultRegCupTitle);
        return !(m.type === 'intl_cup' && (matchesIdSuffix || matchesTitle));
      }
      return true;
    });

    const updatedMovements = [newMovement, ...filteredMovements].slice(0, 250);
    store.updateState({ universeMovements: updatedMovements });

    const history = [...store.history];
    if (history.length > 0) {
      const targetHistYear = history[history.length - 1].year ?? seasonYear;
      const yearScopedMovements = updatedMovements.filter(m => m && (m.year === undefined || m.year === targetHistYear));
      history[history.length - 1] = { ...history[history.length - 1], universeMovements: yearScopedMovements };
      store.updateState({ history });
    }
    if (pendingSeasonResult) {
      pendingSeasonResult.universeMovements = updatedMovements.filter(m => m && (m.year === undefined || m.year === seasonYear));
    }
  };

  const resolveAiClubByName = (clubName: string, fallbackTier: number = 1): Club => {
    const store = useGameStore.getState();
    const normTarget = (clubName || '').trim().toLowerCase();
    const worldClubsList = Object.values(store.worldClubs || {}) as Club[];
    const foundInWorld = worldClubsList.find(c => c.name && c.name.trim().toLowerCase() === normTarget);
    const foundInDb = clubsDb.find(c => c.name && c.name.trim().toLowerCase() === normTarget);
    if (foundInWorld && foundInDb) {
      return { ...foundInDb, ...foundInWorld, logo: foundInDb.logo ?? foundInWorld.logo, color: foundInDb.color || foundInWorld.color };
    }
    if (foundInWorld) return foundInWorld;
    if (foundInDb) return foundInDb;
    return {
      id: `ai_cup_${normTarget.replace(/[^a-z0-9]/g, '_') || 'opp'}`,
      name: clubName || 'Continental Challenger',
      baseOvr: 82,
      tier: fallbackTier,
      color: '#ef4444',
      country: normalizeCountry(store.club.country || 'GER')
    } as Club;
  };

  const recordCupFinalContext = (
    cupKey: string,
    cupName: string,
    seasonYear: number,
    userWon: boolean,
    opponentName: string
  ) => {
    const store = useGameStore.getState();
    const userClub = store.club;
    const opp = resolveAiClubByName(opponentName, cupKey === 'reg_cup' ? Math.max(2, userClub.tier || 3) : 1);
    const winnerId = userWon ? userClub.id : (opp?.id || 'opp_winner');
    const winnerName = userWon ? userClub.name : opponentName;
    const runnerUpId = userWon ? (opp?.id || 'opp_runner_up') : userClub.id;
    const runnerUpName = userWon ? opponentName : userClub.name;

    const outcome: ResolvedCupOutcome = {
      cupId: cupKey,
      cupName,
      year: seasonYear,
      winnerId,
      winnerName,
      runnerUpId,
      runnerUpName,
      userWon
    };

    const prevContext = store.resolvedMatchContext || {};
    const updatedContext = {
      ...prevContext,
      cupFinals: {
        ...(prevContext.cupFinals || {}),
        [cupKey]: outcome
      }
    };
    const updatedWorldClubs = { ...(store.worldClubs || {}) };
    if (!userWon && opp && opp.id !== undefined && updatedWorldClubs[opp.id]) {
      const maxCap = cupKey === 'cl' || cupKey === 'nat_cup' ? 95 : cupKey === 'el' ? 94 : 90;
      updatedWorldClubs[opp.id] = {
        ...updatedWorldClubs[opp.id],
        baseOvr: Math.min(maxCap, (updatedWorldClubs[opp.id].baseOvr || 80) + 1)
      };
    }
    store.updateState({
      resolvedMatchContext: updatedContext,
      ...(Object.keys(updatedWorldClubs).length > 0 ? { worldClubs: updatedWorldClubs } : {})
    });
    const historyAfterCtx = [...useGameStore.getState().history];
    if (historyAfterCtx.length > 0) {
      historyAfterCtx[historyAfterCtx.length - 1] = {
        ...historyAfterCtx[historyAfterCtx.length - 1],
        resolvedMatchContext: updatedContext
      } as any;
      useGameStore.getState().updateState({ history: historyAfterCtx });
    }
    if (pendingSeasonResult) {
      pendingSeasonResult.resolvedMatchContext = updatedContext;
      if (Object.keys(updatedWorldClubs).length > 0) {
        pendingSeasonResult.worldClubs = updatedWorldClubs;
      }
    }

    if (!userWon && opp) {
      const universeKey =
        cupKey === 'nat_cup'
          ? 'dfb'
          : cupKey === 'reg_cup'
          ? 'reg'
          : cupKey === 'euro_cup'
          ? ((store.euroStatus || 'CL') === 'CL' ? 'cl' : store.euroStatus === 'ECL' ? 'ecl' : 'el')
          : (cupKey as any);
      syncTrophyToUniverse(universeKey, seasonYear, opp.tier || 1, opp, cupName);
      // If the user lost the EHF Champions League Final, the victorious opponent also represents Europe in the IHF Super Globe
      if (universeKey === 'cl') {
        const curMovs = useGameStore.getState().universeMovements || [];
        const existingCwc = curMovs.find(m => m.year === seasonYear && m.type === 'intl_cup' && (m.cupTitle === 'IHF Super Globe' || String(m.id).endsWith('-cup-cwc')));
        if (!existingCwc || existingCwc.clubName === userClub.name || Math.random() < 0.65) {
          syncTrophyToUniverse('cwc', seasonYear, opp.tier || 1, opp, 'IHF Super Globe');
        }
      }
    }
  };

  const recordPlayoffContext = (
    type: 'promotion_playoff' | 'relegation_playoff',
    seasonYear: number,
    userWon: boolean,
    opponentName: string,
    upperTier: number,
    lowerTier: number
  ) => {
    const opp = resolveAiClubByName(opponentName, type === 'promotion_playoff' ? upperTier : lowerTier);
    const store = useGameStore.getState();
    const userClub = store.club;
    const winnerId = userWon ? userClub.id : (opp?.id || 'opp_winner');
    const winnerName = userWon ? userClub.name : opponentName;
    const loserId = userWon ? (opp?.id || 'opp_loser') : userClub.id;
    const loserName = userWon ? opponentName : userClub.name;

    const lowerTierPromoted = (type === 'promotion_playoff' && userWon) || (type === 'relegation_playoff' && !userWon);

    const promotedClubId = lowerTierPromoted
      ? (type === 'promotion_playoff' ? userClub.id : (opp?.id || 'opp_promoted'))
      : '';
    const relegatedClubId = lowerTierPromoted
      ? (type === 'promotion_playoff' ? (opp?.id || 'opp_relegated') : userClub.id)
      : '';

    const outcome: ResolvedPlayoffOutcome = {
      type,
      year: seasonYear,
      winnerId,
      winnerName,
      loserId,
      loserName,
      upperTier,
      lowerTier,
      userWon,
      promotedClubId: String(promotedClubId),
      relegatedClubId: String(relegatedClubId)
    };

    const prevContext = store.resolvedMatchContext || {};
    const updatedContext = {
      ...prevContext,
      playoffDecider: outcome
    };
    store.updateState({
      resolvedMatchContext: updatedContext
    });
    const historyAfterPlayoff = [...useGameStore.getState().history];
    if (historyAfterPlayoff.length > 0) {
      const lastIdx = historyAfterPlayoff.length - 1;
      const lastEntry = { ...historyAfterPlayoff[lastIdx], resolvedMatchContext: updatedContext } as any;
      if (lastEntry.divisionTables) {
        const updatedDivTables = { ...lastEntry.divisionTables };
        const normOpp = (opponentName || '').trim().toLowerCase();
        if (Array.isArray(updatedDivTables[upperTier])) {
          updatedDivTables[upperTier] = updatedDivTables[upperTier].map((row: any) => {
            if (!row) return row;
            const isTarget = (type === 'promotion_playoff' && (row.name?.trim().toLowerCase() === normOpp || String(row.id) === String(opp?.id))) ||
              (type === 'relegation_playoff' && (row.isUser || row.name === userClub.name));
            if (isTarget) {
              return { ...row, statusMarker: lowerTierPromoted ? 'R' : 'PO' };
            }
            return row;
          });
        }
        if (Array.isArray(updatedDivTables[lowerTier])) {
          updatedDivTables[lowerTier] = updatedDivTables[lowerTier].map((row: any) => {
            if (!row) return row;
            const isTarget = (type === 'relegation_playoff' && (row.name?.trim().toLowerCase() === normOpp || String(row.id) === String(opp?.id))) ||
              (type === 'promotion_playoff' && (row.isUser || row.name === userClub.name));
            if (isTarget) {
              return { ...row, statusMarker: lowerTierPromoted ? 'P' : 'PO' };
            }
            return row;
          });
        }
        lastEntry.divisionTables = updatedDivTables;
      }
      historyAfterPlayoff[lastIdx] = lastEntry;
      useGameStore.getState().updateState({ history: historyAfterPlayoff });
    }
    if (pendingSeasonResult) {
      pendingSeasonResult.resolvedMatchContext = updatedContext;
    }
  };

  const syncRivalChampionToUniverse = (
    rivalClubName: string,
    seasonYear: number,
    customTier?: number
  ) => {
    const store = useGameStore.getState();
    const userClub = store.club;
    const userCountry = userClub.country || 'GER';
    const normCountry = normalizeCountry(userCountry);
    const tier = customTier || userClub.tier || 1;

    const rivalObj = resolveAiClubByName(rivalClubName, tier);

    const newMovement: UniverseMovement = {
      id: `${rivalObj?.id || 'rival'}-${seasonYear}-champ-t${tier}`,
      year: seasonYear,
      clubId: String(rivalObj?.id || 'rival'),
      clubName: rivalObj?.name || rivalClubName,
      clubLogo: rivalObj?.logo,
      clubColor: rivalObj?.color || '#999999',
      country: normCountry,
      type: 'champion',
      fromTier: tier,
      toTier: tier,
      isKey: true
    };

    const currentMovements = [...(store.universeMovements || [])];
    const filteredMovements = currentMovements.filter(m => {
      if (m.year !== seasonYear) return true;
      return !(m.type === 'champion' && m.fromTier === tier && normalizeCountry(m.country || 'GER') === normCountry);
    });

    const updatedMovements = [newMovement, ...filteredMovements];
    const updatedWorldClubs = { ...(store.worldClubs || {}) };
    if (tier === 1 && rivalObj && rivalObj.id !== undefined && updatedWorldClubs[rivalObj.id]) {
      updatedWorldClubs[rivalObj.id] = {
        ...updatedWorldClubs[rivalObj.id],
        baseOvr: Math.min(95, (updatedWorldClubs[rivalObj.id].baseOvr || 80) + 1)
      };
    }
    store.updateState({
      universeMovements: updatedMovements,
      ...(Object.keys(updatedWorldClubs).length > 0 ? { worldClubs: updatedWorldClubs } : {})
    });

    const history = [...useGameStore.getState().history];
    if (history.length > 0) {
      history[history.length - 1] = { ...history[history.length - 1], universeMovements: updatedMovements };
      useGameStore.getState().updateState({ history });
    }
    if (pendingSeasonResult) {
      pendingSeasonResult.universeMovements = updatedMovements;
      if (Object.keys(updatedWorldClubs).length > 0) {
        pendingSeasonResult.worldClubs = updatedWorldClubs;
      }
    }
  };

  const syncFinalTableToHistory = (histItem: any, tierNum: number, table: any[]) => {
    if (!histItem) return;
    histItem.finalTable = table;
    if (histItem.divisionTables) {
      histItem.divisionTables[tierNum] = table;
    } else {
      histItem.divisionTables = { [tierNum]: table };
    }
  };
   
  const handleResolveMatch = (won: boolean, matchScore?: [number, number]) => {
     if (pendingMatches.length === 0) return;
     
     const match = pendingMatches[0];
     let nextMatches = [...pendingMatches.slice(1)];
     
     const currentStoreState = useGameStore.getState();
     const matchSeasonYear = pendingSeasonResult?.year ?? currentStoreState.year;

     const pGoals = (matchScore && typeof matchScore[0] === 'number') ? matchScore[0] : (won ? 28 : 24);
     const oGoals = (matchScore && typeof matchScore[1] === 'number') ? matchScore[1] : (won ? 25 : 29);

     // Playoff ties and championship deciders are postseason knockout ties;
     // regular league schedule statistics remain strictly authentic without inflating matches played to 35.
     if (match.isRivalClash || match.opponentName === currentStoreState.rivalClubName) {
         currentStoreState.updateState({
             rivalH2HWins: (currentStoreState.rivalH2HWins || 0) + (won ? 1 : 0),
             rivalH2HLosses: (currentStoreState.rivalH2HLosses || 0) + (!won ? 1 : 0),
         });
     }
     
     const storeTotals = currentStoreState.totals || { matches: 0, wins: 0, att: 0, trophies: 0, domTrophies: 0, intTrophies: 0 };
     currentStoreState.updateState({
         totals: {
             ...storeTotals,
             matches: (storeTotals.matches || 0) + 1,
             wins: (storeTotals.wins || 0) + (won ? 1 : 0)
         }
     });
     let addedToast = false;
     let newToastToTrigger: any = null;

     const syncPostSeasonFinanceDelta = (delta: number) => {
         if (!delta) return;
         if (pendingSeasonResult) {
             pendingSeasonResult.newBudget = useGameStore.getState().budget;
             if (pendingSeasonResult.financials) {
                 pendingSeasonResult.financials = {
                     ...pendingSeasonResult.financials,
                     estRevenue: (pendingSeasonResult.financials.estRevenue || 0) + delta,
                     net: (pendingSeasonResult.financials.net || 0) + delta
                 };
             }
         }
     };
     
     if (won) {
          if (match.type === 'cup_qf') {
              const store = useGameStore.getState();
              const isRegQf = Boolean(
                  match.isAmateurCup ||
                  store.activeCupTournament?.isAmateur ||
                  (match.subtitle || '').toUpperCase().includes('REGIONAL') ||
                  (match.subtitle || '').toUpperCase().includes('AMATEUR')
              );
              const userCountry = store.club.country || 'GER';
              const prize = isRegQf
                  ? Math.round(getLeagueScaledVal(3, 7500, userCountry))
                  : Math.round(getLeagueScaledVal(1, 50000, userCountry));
              store.updateState({
                  budget: store.budget + prize,
                  reputation: Math.min(100, (store.reputation || 50) + 2),
                  cupQualifiedForSf: true
              });
              setCupQualifiedForSf(true);
              setEliminatedCupOpponents(prev => Array.from(new Set([...prev, match.opponentName])));
          } else if (match.type === 'euro_cup_qf') {
              const euroKey = (state.euroStatus || 'CL').toUpperCase();
              const euroPrize = euroKey === 'CL' ? 250000 : euroKey === 'EL' ? 100000 : 50000;
              const store = useGameStore.getState();
              store.updateState({
                  budget: store.budget + euroPrize,
                  reputation: Math.min(100, (store.reputation || 50) + 3),
                  euroQualifiedForSf: true
              });
              setEuroQualifiedForSf(true);
              setEliminatedEuroOpponents(prev => Array.from(new Set([...prev, match.opponentName])));
          } else if (match.type === 'cup_sf') {
              const isReg = Boolean(
                  match.isAmateurCup ||
                  useGameStore.getState().activeCupTournament?.isAmateur ||
                  (match.subtitle || '').toUpperCase().includes('REGIONAL') ||
                  (match.subtitle || '').toUpperCase().includes('AMATEUR')
              );
              const curStoreSf = useGameStore.getState();
              const sfCountry = curStoreSf.club.country || 'GER';
              const sfPrize = isReg
                  ? Math.round(getLeagueScaledVal(3, 15000, sfCountry))
                  : Math.round(getLeagueScaledVal(1, 150000, sfCountry));
              curStoreSf.updateState({ budget: curStoreSf.budget + sfPrize });
              syncPostSeasonFinanceDelta(sfPrize);
              const targetOvr = match.playerOvr + (Math.floor(Math.random() * 5) - 2);
              
              // Strict Tournament Deduplication: Exclude ALL clubs already faced/eliminated in QF, SF, etc.
              const allEliminated = Array.from(new Set([
                  ...eliminatedCupOpponents,
                  ...(state.activeCupTournament?.eliminatedClubs || []),
                  state.activeCupTournament?.qfOpponent,
                  state.activeCupTournament?.sfOpponent,
                  match.opponentName,
                  ...(match.previousOpponents || [])
              ].filter(Boolean) as string[]));

              setEliminatedCupOpponents(allEliminated);
              const currentTournament = useGameStore.getState().activeCupTournament;
              if (currentTournament) {
                  useGameStore.getState().updateState({
                      activeCupTournament: {
                          ...currentTournament,
                          eliminatedClubs: allEliminated
                      }
                  });
              }

              let topSeedName = '';
              let finalOppOvr = targetOvr;

              const presetFinalOpp = match.finalOpponent || currentTournament?.finalOpponent;
              const presetFinalOppOvr = match.finalOpponentOvr || currentTournament?.finalOpponentOvr;

              // 1. Prefer authentic tournament final opponent from pre-generated bracket
              if (presetFinalOpp && !allEliminated.includes(presetFinalOpp) && presetFinalOpp !== state.club.name) {
                  topSeedName = presetFinalOpp;
                  finalOppOvr = presetFinalOppOvr || targetOvr;
              } else {
                  const normSfCountry = normalizeCountry(state.club.country || 'GER');
                  const oppFilter = (c: any) => 
                      normalizeCountry(c.country || 'GER') === normSfCountry && 
                      c.name !== state.club.name && 
                      !allEliminated.includes(c.name) && 
                      !isReserveClub(c.name) && 
                      (!isReg || c.tier > 1);
                  
                  const possibleOpps = clubsDb.filter(c => oppFilter(c) && Math.abs(c.baseOvr - targetOvr) <= 2);
                  const fallbackOpps = clubsDb.filter(c => oppFilter(c) && Math.abs(c.baseOvr - targetOvr) <= 5);
                  
                  if (possibleOpps.length > 0) {
                      const picked = possibleOpps.sort(() => 0.5 - Math.random())[0];
                      topSeedName = picked.name;
                      finalOppOvr = picked.baseOvr;
                  } else if (fallbackOpps.length > 0) {
                      const picked = fallbackOpps.sort(() => 0.5 - Math.random())[0];
                      topSeedName = picked.name;
                      finalOppOvr = picked.baseOvr;
                  } else {
                      const sortedOpps = clubsDb.filter(oppFilter).sort((a, b) => b.baseOvr - a.baseOvr);
                      if (sortedOpps.length > 0) {
                          const picked = sortedOpps[Math.floor(Math.random() * Math.min(3, sortedOpps.length))];
                          topSeedName = picked.name;
                          finalOppOvr = picked.baseOvr;
                      } else {
                          const safetyOpps = clubsDb.filter(c => normalizeCountry(c.country || 'GER') === normSfCountry && c.name !== state.club.name && !allEliminated.includes(c.name) && !isReserveClub(c.name));
                          if (safetyOpps.length > 0) {
                              const picked = safetyOpps[0];
                              topSeedName = picked.name;
                              finalOppOvr = picked.baseOvr;
                          } else {
                              topSeedName = isReg ? 'Regional Challenger' : 'National Challenger';
                              finalOppOvr = targetOvr;
                          }
                      }
                  }
              }
              
              nextMatches.unshift({
                  type: 'cup_final',
                  title: 'FINAL',
                  subtitle: match.subtitle,
                  cupName: match.cupName,
                  isAmateurCup: Boolean(match.isAmateurCup || match.subtitle?.includes('REGIONAL') || match.subtitle?.includes('AMATEUR') || match.cupName?.toLowerCase().includes('amateur')),
                  broadcastPackage: getBroadcastingPackage(state.club.country || "GER", false, { type: 'cup_final', isCupFinal: true, year: matchSeasonYear, clubName: state.club.name }),
                  arena: (match.isAmateurCup || match.subtitle?.includes('REGIONAL') || match.subtitle?.includes('AMATEUR')) ? getClubHomeArena(state.club) : undefined,
                  capacity: (match.isAmateurCup || match.subtitle?.includes('REGIONAL') || match.subtitle?.includes('AMATEUR')) ? (state.club.stadium || 4750) : undefined,
                  opponentName: topSeedName,
                  previousOpponents: Array.from(new Set([...allEliminated, topSeedName])),
                  opponentOvr: finalOppOvr,
                  playerOvr: match.playerOvr,
                  playerClubName: match.playerClubName,
                  baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (match.playerOvr - finalOppOvr) * 0.02)) * 100),
              });
         } else if (match.type === 'cl_final') {
             const ihfCandidates = clubsDb
                 .filter(c => c.name !== state.club.name && c.name !== match.opponentName && !isReserveClub(c.name))
                 .sort((a, b) => b.baseOvr - a.baseOvr)
                 .slice(0, 5);
             const pickedIhfClub = ihfCandidates.length > 0
                 ? ihfCandidates[Math.floor(Math.random() * ihfCandidates.length)]
                 : undefined;
             const ihfOpponent = pickedIhfClub?.name || (state.club.country === 'GER' ? 'Barça' : 'SC Magdeburg');
             const ihfOppOvr = pickedIhfClub?.baseOvr || Math.max(82, match.opponentOvr - 1);
             const ihfBroadcastPackage = getBroadcastingPackage(state.club.country || 'GER', true, {
                 type: 'ihf_final',
                 title: 'FINAL',
                 subtitle: 'IHF SUPER GLOBE · CLUB WORLD CHAMPIONSHIP',
                 year: matchSeasonYear,
                 clubName: state.club.name,
             });
             setQueuedSuperGlobeMatches([{
                 type: 'ihf_final',
                 title: 'FINAL',
                 cupName: 'IHF Super Globe · Club World Championship',
                 subtitle: 'IHF SUPER GLOBE · CLUB WORLD CHAMPIONSHIP',
                 broadcastPackage: ihfBroadcastPackage,
                 year: matchSeasonYear,
                 arena: 'New Administrative Capital Hall',
                 capacity: 7500,
                 opponentName: ihfOpponent,
                 opponentOvr: ihfOppOvr,
                 playerOvr: match.playerOvr,
                 playerClubName: match.playerClubName,
                 baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (match.playerOvr - ihfOppOvr) * 0.02)) * 100),
             }]);





             trackEvent('cup_win', { title: 'champions_league', club_name: state.club.name });
             const clPrize = getLeagueScaledVal(1, 1500000, state.club.country);
             useGameStore.getState().updateState({ budget: useGameStore.getState().budget + clPrize });
             syncPostSeasonFinanceDelta(clPrize);

             const clToast = { id: Math.random().toString(), type: "celebration", category: "euro", message: "🏆 EHF Champions League Winners!", subtitle: "Champions of Europe! The pinnacle of continental club handball.", read: false, opponentName: match.opponentName };
             newToastToTrigger = clToast;
             addedToast = true;
             const curStoreCl = useGameStore.getState();
             const clRuns = curStoreCl.cupRunResults || [];
             const newRepCl = Math.min(100, (curStoreCl.reputation || 50) + 10);
             const newMoraleCl = Math.min(100, (curStoreCl.club.morale || 50) + 15);
             const newImpactCl = Math.min(100, (curStoreCl.clubImpactScore || 50) + 25);
             const nextClEuroStatus = (curStoreCl.club.tier === 1 && !isReserveClub(curStoreCl.club.name)) ? 'CL' : curStoreCl.euroStatus;
             const updatedClSp = (curStoreCl.skillPoints || 0) + 3;
             curStoreCl.updateState({ 
                 skillPoints: updatedClSp, 
                 euroStatus: nextClEuroStatus,
                 reputation: newRepCl,
                 clubImpactScore: newImpactCl,
                 trophyDrought: 0,
                 club: { ...curStoreCl.club, morale: newMoraleCl },
                 totals: { ...curStoreCl.totals, intTrophies: (curStoreCl.totals.intTrophies || 0) + 1, trophies: (curStoreCl.totals.trophies || 0) + 1 },
                 trophies: [...(curStoreCl.trophies || []), 'EHF Champions League'],
                 notifications: (curStoreCl.notifications || []).filter(n => !(typeof n.message === 'string' && n.message.includes('Season ended without silverware'))),
                 cupRunResults: [
                     ...clRuns.filter(r => r.year !== matchSeasonYear || r.id !== 'euro_cup'),
                     {
                         year: matchSeasonYear,
                         id: 'euro_cup',
                         nameEn: 'EHF Champions League',
                         nameDe: 'EHF Champions League',
                         won: true,
                         exitRound: 'Winners',
                         winnerName: state.club.name,
                         runnerUpName: match.opponentName
                     }
                 ]
             });

             if (pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 pendingSeasonResult.trophiesThisYear = pendingSeasonResult.trophiesThisYear || {};
                 pendingSeasonResult.trophiesThisYear.cl = 1;
                 pendingSeasonResult.newRep = newRepCl;
                 pendingSeasonResult.euroStatus = nextClEuroStatus;
                 pendingSeasonResult.skillPoints = updatedClSp;
                 pendingSeasonResult.earnedPoints = (pendingSeasonResult.earnedPoints || 0) + 3;
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     history[lastIdx] = {
                         ...history[lastIdx],
                         trophiesThisYear: { ...history[lastIdx].trophiesThisYear, cl: 1 }
                     };
                     store.updateState({ history });
                 }
                 syncTrophyToUniverse('cl', matchSeasonYear);
                 recordCupFinalContext('cl', 'EHF Champions League', matchSeasonYear, true, match.opponentName);
             }
         } else if (match.type === 'ihf_final') {
             trackEvent('cup_win', { title: 'ihf_super_globe', club_name: state.club.name });
             const cwcPrize = getLeagueScaledVal(1, 400000, state.club.country);
             const curStoreIhf = useGameStore.getState();
             const newRepIhf = Math.min(100, (curStoreIhf.reputation || 50) + 5);
             const newMoraleIhf = Math.min(100, (curStoreIhf.club.morale || 50) + 10);
             const updatedIhfSp = (curStoreIhf.skillPoints || 0) + 3;
             const ihfRuns = curStoreIhf.cupRunResults || [];

             const ihfToast = { id: Math.random().toString(), type: "celebration", category: "euro", message: "🏆 IHF Super Globe Winners!", subtitle: `World Champions! Triumphant in the intercontinental showpiece${match.opponentName ? " against " + match.opponentName : ""}.`, read: false, opponentName: match.opponentName };
             newToastToTrigger = ihfToast;
             addedToast = true;
             curStoreIhf.updateState({
                 budget: curStoreIhf.budget + cwcPrize,
                 reputation: newRepIhf,
                 trophyDrought: 0,
                 club: { ...curStoreIhf.club, morale: newMoraleIhf },
                 skillPoints: updatedIhfSp,
                 totals: { ...curStoreIhf.totals, intTrophies: (curStoreIhf.totals.intTrophies || 0) + 1, trophies: (curStoreIhf.totals.trophies || 0) + 1 },
                 trophies: [...(curStoreIhf.trophies || []), 'IHF Super Globe'],
                 cupRunResults: [
                     ...ihfRuns.filter(r => r.year !== matchSeasonYear || r.id !== 'cwc'),
                     {
                         year: matchSeasonYear,
                         id: 'cwc',
                         nameEn: 'IHF Super Globe',
                         nameDe: 'IHF Super Globe',
                         won: true,
                         exitRound: 'Winners',
                         winnerName: state.club.name,
                         runnerUpName: match.opponentName
                     }
                 ]
             });
             syncPostSeasonFinanceDelta(cwcPrize);

             if (pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 pendingSeasonResult.trophiesThisYear = pendingSeasonResult.trophiesThisYear || {};
                 pendingSeasonResult.trophiesThisYear.cwc = 1;
                 pendingSeasonResult.newRep = newRepIhf;
                 pendingSeasonResult.skillPoints = updatedIhfSp;
                 pendingSeasonResult.earnedPoints = (pendingSeasonResult.earnedPoints || 0) + 3;
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     history[lastIdx] = {
                         ...history[lastIdx],
                         trophiesThisYear: { ...history[lastIdx].trophiesThisYear, cwc: 1 }
                     };
                     store.updateState({ history });
                 }
                 syncTrophyToUniverse('cwc', matchSeasonYear);
                 recordCupFinalContext('cwc', 'IHF Super Globe', matchSeasonYear, true, match.opponentName);
             }
         } else if (match.type === 'cup_final') {
             const curStoreDom = useGameStore.getState();
             const isReg = Boolean(
                 match.isAmateurCup ||
                 curStoreDom.activeCupTournament?.isAmateur ||
                 (match.subtitle || '').toUpperCase().includes('REGIONAL') ||
                 (match.subtitle || '').toUpperCase().includes('AMATEUR') ||
                 (match.cupName || '').toLowerCase().includes('amateur') ||
                 (match.cupName || '').toLowerCase().includes('regional')
             );
             trackEvent('cup_win', { title: isReg ? 'regional_cup' : 'domestic_cup', club_name: state.club.name });
             const domPrize = isReg ? getLeagueScaledVal(3, 50000, state.club.country) : getLeagueScaledVal(1, 350000, state.club.country);
             const newRepDom = Math.min(100, (curStoreDom.reputation || 50) + (isReg ? 2 : 5));
             const newMoraleDom = Math.min(100, (curStoreDom.club.morale || 50) + 10);

             let grantedElSpot = false;
             let licensingDeniedNotice: any = null;
             if (!isReg) {
                 const currentEuro = pendingSeasonResult?.euroStatus ?? curStoreDom.euroStatus;
                 if (currentEuro === 'CL') {
                     grantedElSpot = true;
                 } else if (curStoreDom.club.tier === 1) {
                     grantedElSpot = true;
                 } else if (curStoreDom.club.tier === 2 && Math.random() < 0.02) {
                     grantedElSpot = true;
                 } else if (curStoreDom.club.tier >= 3 && Math.random() < 0.0001) {
                     grantedElSpot = true;
                 } else {
                     licensingDeniedNotice = {
                         id: Math.random().toString(),
                         type: 'info',
                         category: 'euro',
                         title: 'EHF CONTINENTAL LICENSING',
                         message: `🏟️ Domestic Cup Winners! Under EHF Continental Licensing regulations, lower-division clubs do not meet top-flight arena and financial criteria for the EHF European League. The continental berth passes to the 1st Division runner-up.`,
                         read: false
                     };
                 }
             }
             const nextEuroDom = !isReg
                 ? (grantedElSpot ? (curStoreDom.euroStatus === 'CL' ? 'CL' : 'EL') : curStoreDom.euroStatus)
                 : curStoreDom.euroStatus;
             
             const cupName = isReg 
                ? (getDomesticCupInfo(state.club.country, 4).name || 'Regional Cup')
                : (getDomesticCupInfo(state.club.country, 1).name || 'National Cup');

             const currentRuns = curStoreDom.cupRunResults || [];
             const domToast = {
                 id: Math.random().toString(),
                 type: "celebration",
                 category: "cup",
                 message: `🏆 ${cupName} Winners!`,
                 subtitle: isReg
                     ? `Historic triumph in the ${cupName}! Earned qualification for next season's National Cup.`
                     : grantedElSpot
                     ? `Historic triumph in the ${cupName}! Earned qualification for the EHF European League.`
                     : `Historic underdog triumph in the ${cupName}!`,
                 read: false,
                 opponentName: match.opponentName
             };
             newToastToTrigger = domToast;
             addedToast = true;
             const newImpactDom = Math.min(100, (curStoreDom.clubImpactScore || 50) + (isReg ? 15 : 20));
             const updatedDomSp = (curStoreDom.skillPoints || 0) + 3;
             const filteredDomNotifs = (curStoreDom.notifications || []).filter(n => !(typeof n.message === 'string' && n.message.includes('Season ended without silverware')));
             curStoreDom.updateState({
                 budget: curStoreDom.budget + domPrize,
                 reputation: newRepDom,
                 clubImpactScore: newImpactDom,
                 trophyDrought: 0,
                 euroStatus: nextEuroDom,
                 club: { ...curStoreDom.club, morale: newMoraleDom },
                 skillPoints: updatedDomSp,
                 totals: {
                     ...curStoreDom.totals,
                     domTrophies: (curStoreDom.totals.domTrophies || 0) + (isReg ? 0 : 1),
                     trophies: (curStoreDom.totals.trophies || 0) + 1
                 },
                 trophies: [...(curStoreDom.trophies || []), isReg ? 'Regional Cup' : 'National Cup'],
                 notifications: licensingDeniedNotice ? [licensingDeniedNotice, ...filteredDomNotifs] : filteredDomNotifs,
                 cupRunResults: [
                     ...currentRuns.filter(r => r.year !== matchSeasonYear || r.id !== (isReg ? 'reg_cup' : 'nat_cup')),
                     {
                         year: matchSeasonYear,
                         id: isReg ? 'reg_cup' : 'nat_cup',
                         nameEn: isReg ? 'Regional Cup' : 'National Cup',
                         nameDe: isReg ? 'Regionalpokal' : 'Nationaler Pokal',
                         won: true,
                         exitRound: 'Winners',
                         winnerName: state.club.name,
                         runnerUpName: match.opponentName
                     }
                 ]
             });
             syncPostSeasonFinanceDelta(domPrize);

             if (pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 pendingSeasonResult.trophiesThisYear = pendingSeasonResult.trophiesThisYear || {};
                 if (isReg) {
                     pendingSeasonResult.trophiesThisYear.reg = 1;
                 } else {
                     pendingSeasonResult.trophiesThisYear.dfb = 1;
                     if (grantedElSpot && pendingSeasonResult.euroStatus !== 'CL') {
                         pendingSeasonResult.euroStatus = 'EL';
                     }
                 }
                 pendingSeasonResult.newRep = newRepDom;
                 pendingSeasonResult.skillPoints = updatedDomSp;
                 pendingSeasonResult.earnedPoints = (pendingSeasonResult.earnedPoints || 0) + 3;
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     history[lastIdx] = {
                         ...history[lastIdx],
                         trophiesThisYear: {
                             ...history[lastIdx].trophiesThisYear,
                             ...(isReg ? { reg: 1 } : { dfb: 1 })
                         }
                     };
                     store.updateState({ history });
                 }
                 syncTrophyToUniverse(isReg ? 'reg' : 'dfb', matchSeasonYear);
                 recordCupFinalContext(isReg ? 'reg_cup' : 'nat_cup', cupName, matchSeasonYear, true, match.opponentName);
             }
          } else if (match.type === 'cl_sf' || match.type === 'euro_cup_sf') {
              const isEuro = match.type === 'euro_cup_sf';
              const targetOvr = match.playerOvr + (Math.floor(Math.random() * 5) - 2);
              
              // Strict European Deduplication: Exclude ALL clubs faced in QF, SF, etc.
              const allEuroEliminated = Array.from(new Set([
                  ...eliminatedEuroOpponents,
                  ...(state.activeEuroTournament?.eliminatedClubs || []),
                  state.activeEuroTournament?.qfOpponent,
                  state.activeEuroTournament?.sfOpponent,
                  match.opponentName,
                  ...(match.previousOpponents || [])
              ].filter(Boolean) as string[]));

              setEliminatedEuroOpponents(allEuroEliminated);
              const currentEuroTournament = useGameStore.getState().activeEuroTournament;
              if (currentEuroTournament) {
                  useGameStore.getState().updateState({
                      activeEuroTournament: {
                          ...currentEuroTournament,
                          eliminatedClubs: allEuroEliminated
                      }
                  });
              }

              let topSeedName = '';
              let finalOppOvr = targetOvr;
              const presetEuroFinalOpp = match.finalOpponent || currentEuroTournament?.finalOpponent;
              const presetEuroFinalOppOvr = match.finalOpponentOvr || currentEuroTournament?.finalOpponentOvr;

              if (presetEuroFinalOpp && !allEuroEliminated.includes(presetEuroFinalOpp) && presetEuroFinalOpp !== state.club.name) {
                  topSeedName = presetEuroFinalOpp;
                  finalOppOvr = presetEuroFinalOppOvr || targetOvr;
              } else {
                  const euroOppFilter = (c: any) => 
                      c.name !== state.club.name && 
                      !allEuroEliminated.includes(c.name) && 
                      !isReserveClub(c.name);
                  
                  const possibleOpps = clubsDb.filter(c => euroOppFilter(c) && Math.abs(c.baseOvr - targetOvr) <= 2);
                  const fallbackOpps = clubsDb.filter(c => euroOppFilter(c) && Math.abs(c.baseOvr - targetOvr) <= 5);
                  
                  if (possibleOpps.length > 0) {
                      const picked = possibleOpps.sort(() => 0.5 - Math.random())[0];
                      topSeedName = picked.name;
                      finalOppOvr = picked.baseOvr;
                  } else if (fallbackOpps.length > 0) {
                      const picked = fallbackOpps.sort(() => 0.5 - Math.random())[0];
                      topSeedName = picked.name;
                      finalOppOvr = picked.baseOvr;
                  } else {
                      const sortedOpps = clubsDb.filter(euroOppFilter).sort((a, b) => b.baseOvr - a.baseOvr);
                      if (sortedOpps.length > 0) {
                          const picked = sortedOpps[Math.floor(Math.random() * Math.min(3, sortedOpps.length))];
                          topSeedName = picked.name;
                          finalOppOvr = picked.baseOvr;
                      } else {
                          const safetyOpps = clubsDb.filter(c => c.name !== state.club.name && !allEuroEliminated.includes(c.name) && !isReserveClub(c.name));
                          topSeedName = safetyOpps[0]?.name || 'European Giant';
                          finalOppOvr = targetOvr;
                      }
                  }
              }

              const isEclFinal = Boolean(
                  (match.subtitle || '').toUpperCase().includes('EUROPEAN CUP') ||
                  (match.cupName || '').toUpperCase().includes('EUROPEAN CUP')
              );
              const finalCupName = isEuro 
                ? (isEclFinal ? 'EHF European Cup' : 'EHF European League')
                : 'EHF Champions League';

              nextMatches.unshift({
                  type: isEuro ? 'euro_cup_final' : 'cl_final',
                  title: 'FINAL',
                  cupName: finalCupName,
                  subtitle: match.subtitle,
                  opponentName: topSeedName,
                  previousOpponents: Array.from(new Set([...allEuroEliminated, topSeedName])),
                  opponentOvr: finalOppOvr,
                  playerOvr: match.playerOvr,
                  playerClubName: match.playerClubName,
                  baseWinProb: Math.round(Math.max(0.1, Math.min(0.9, 0.5 + (match.playerOvr - finalOppOvr) * 0.02)) * 100),
              });
         } else if (match.type === 'euro_cup_final') {
             trackEvent('cup_win', { title: 'euro_cup', club_name: state.club.name });
             const isEcl = Boolean(
                 (match.subtitle || '').toUpperCase().includes('EUROPEAN CUP') ||
                 (match.cupName || '').toUpperCase().includes('EUROPEAN CUP')
             );
             const euroPrize = isEcl ? getLeagueScaledVal(1, 250000, state.club.country) : getLeagueScaledVal(1, 750000, state.club.country);
             const curStoreEuro = useGameStore.getState();
             const newRepEuro = Math.min(100, (curStoreEuro.reputation || 50) + (isEcl ? 5 : 8));
             const newMoraleEuro = Math.min(100, (curStoreEuro.club.morale || 50) + 12);
             const nextEuroStatus = curStoreEuro.club.tier === 1
                 ? (isEcl ? (curStoreEuro.euroStatus === 'CL' ? 'CL' : 'EL') : 'CL')
                 : curStoreEuro.euroStatus;
             const newImpactEuro = Math.min(100, (curStoreEuro.clubImpactScore || 50) + 25);
             const updatedEuroSp = (curStoreEuro.skillPoints || 0) + 3;

             const euroToast = { id: Math.random().toString(), type: "celebration", category: "euro", message: isEcl ? "🏆 EHF European Cup Winners!" : "🏆 EHF Euro League Winners!", subtitle: "European silverware raised high after an extraordinary campaign!", read: false, opponentName: match.opponentName };
             newToastToTrigger = euroToast;
             addedToast = true;
             const euroCupName = isEcl ? 'EHF European Cup' : 'EHF European League';
             const euroRuns = curStoreEuro.cupRunResults || [];
             curStoreEuro.updateState({
                 budget: curStoreEuro.budget + euroPrize,
                 reputation: newRepEuro,
                 clubImpactScore: newImpactEuro,
                 trophyDrought: 0,
                 euroStatus: nextEuroStatus,
                 club: { ...curStoreEuro.club, morale: newMoraleEuro },
                 skillPoints: updatedEuroSp,
                 totals: { ...curStoreEuro.totals, intTrophies: (curStoreEuro.totals.intTrophies || 0) + 1, trophies: (curStoreEuro.totals.trophies || 0) + 1 },
                 trophies: [...(curStoreEuro.trophies || []), isEcl ? 'EHF European Cup' : 'EHF European League'],
                 notifications: (curStoreEuro.notifications || []).filter(n => !(typeof n.message === 'string' && n.message.includes('Season ended without silverware'))),
                 cupRunResults: [
                     ...euroRuns.filter(r => r.year !== matchSeasonYear || r.id !== 'euro_cup'),
                     {
                         year: matchSeasonYear,
                         id: 'euro_cup',
                         nameEn: euroCupName,
                         nameDe: euroCupName,
                         won: true,
                         exitRound: 'Winners',
                         winnerName: state.club.name,
                         runnerUpName: match.opponentName
                     }
                 ]
             });
             syncPostSeasonFinanceDelta(euroPrize);

             if (pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 pendingSeasonResult.trophiesThisYear = pendingSeasonResult.trophiesThisYear || {};
                 if (isEcl) { pendingSeasonResult.trophiesThisYear.ecl = 1; } else { pendingSeasonResult.trophiesThisYear.el = 1; }
                 pendingSeasonResult.newRep = newRepEuro;
                 pendingSeasonResult.euroStatus = nextEuroStatus;
                 pendingSeasonResult.skillPoints = updatedEuroSp;
                 pendingSeasonResult.earnedPoints = (pendingSeasonResult.earnedPoints || 0) + 3;
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     history[lastIdx] = {
                         ...history[lastIdx],
                         trophiesThisYear: {
                             ...history[lastIdx].trophiesThisYear,
                             ...(isEcl ? { ecl: 1 } : { el: 1 })
                         }
                     };
                     store.updateState({ history });
                 }
                 syncTrophyToUniverse(isEcl ? 'ecl' : 'el', matchSeasonYear);
                 const finalEuroKey = isEcl ? 'ecl' : 'el';
                 recordCupFinalContext(finalEuroKey, euroCupName, matchSeasonYear, true, match.opponentName);
             }
         } else if (match.type === 'championship_decider') {
             trackEvent('title_win', { title: 'league_champion', club_name: state.club.name, decider_match: true });

              const wasAlreadyPos1 = pendingSeasonResult?.seasonStats?.pos === 1;
              if (pendingSeasonResult && pendingSeasonResult.seasonStats) {
                  pendingSeasonResult.seasonStats.pos = 1;
              }
              
              const store = useGameStore.getState();
              const history = [...store.history];
              const originalTier = history.length > 0 
                  ? (history[history.length - 1].tier || match.tier || state.club.tier || 1)
                  : (match.tier || state.club.tier || 1);
              if (!wasAlreadyPos1) {
                  const tierPrizeMap: Record<number, number> = { 1: 350000, 2: 120000, 3: 45000, 4: 15000, 5: 5000 };
                  const deciderLeaguePrize = getLeagueScaledVal(originalTier, tierPrizeMap[originalTier] || 5000, state.club.country || 'GER');
                  const isPromoDeniedDecider = originalTier === 2 && isReserveClub(state.club.name);
                  const canDeciderPromoteEarly = originalTier > 1 && !isPromoDeniedDecider;
                  const alreadyCreditedPromo = Boolean(pendingSeasonResult?.promoted);
                  const spGain = (originalTier === 1 ? 4 : 3) + (canDeciderPromoteEarly && !alreadyCreditedPromo ? 3 : 0);
                  const repGain = originalTier === 1 ? 8 : (isPromoDeniedDecider ? 5 : (alreadyCreditedPromo ? 2 : 5));
                  const newRepDecider = Math.min(100, (store.reputation || 50) + repGain);
                  const newMoraleDecider = Math.min(100, (store.club.morale || 50) + 15);
                  const newImpactDecider = Math.min(100, (store.clubImpactScore || 50) + 35);
                  const updatedSkillPoints = (store.skillPoints || 0) + spGain;
                  const isTopFlightChamp = originalTier === 1 && !isReserveClub(state.club.name);
                  store.updateState({
                      budget: store.budget + deciderLeaguePrize,
                      skillPoints: updatedSkillPoints,
                      reputation: newRepDecider,
                      trophyDrought: 0,
                      clubImpactScore: newImpactDecider,
                      ...(isTopFlightChamp ? { euroStatus: 'CL' } : {}),
                      club: { ...store.club, morale: newMoraleDecider },
                      notifications: (store.notifications || []).filter(n => !(typeof n.message === 'string' && n.message.includes('Season ended without silverware'))),
                      totals: {
                          ...store.totals,
                          titles: (store.totals.titles || 0) + 1,
                          domTrophies: (store.totals.domTrophies || 0) + (isTopFlightChamp ? 1 : 0),
                          trophies: (store.totals.trophies || 0) + 1
                      }
                  });
                  if (pendingSeasonResult) {
                      pendingSeasonResult.newRep = newRepDecider;
                      pendingSeasonResult.skillPoints = updatedSkillPoints;
                      pendingSeasonResult.earnedPoints = (pendingSeasonResult.earnedPoints || 0) + spGain;
                      if (isTopFlightChamp) {
                          pendingSeasonResult.euroStatus = 'CL';
                      }
                      if (Array.isArray(pendingSeasonResult.extraNotifications)) {
                          pendingSeasonResult.extraNotifications = pendingSeasonResult.extraNotifications.filter(
                              (n: any) => !(typeof n.message === 'string' && n.message.includes('Season ended without silverware'))
                          );
                      }
                  }
                  syncPostSeasonFinanceDelta(deciderLeaguePrize);
              }
              const currentTrophies = (history.length > 0 && history[history.length - 1].trophiesThisYear) 
                  ? history[history.length - 1].trophiesThisYear 
                  : (pendingSeasonResult?.trophiesThisYear || {});
              const titleSilverware = originalTier === 1 ? { bl: 1 } : { lower: 1 };
              const canDeciderPromote = originalTier > 1 && !(originalTier === 2 && isReserveClub(state.club.name));
              var newTier = canDeciderPromote ? originalTier - 1 : originalTier;
              
              if (canDeciderPromote) {
                  if (store.club.tier !== newTier) {
                      store.applyPlayoffTierChange(newTier);
                  }
                  if (pendingSeasonResult) {
                      pendingSeasonResult.nextTier = newTier;
                      pendingSeasonResult.clubTier = originalTier;
                      pendingSeasonResult.promoted = true;
                  }
              }
              if (pendingSeasonResult) {
                  pendingSeasonResult.trophiesThisYear = { ...currentTrophies, ...titleSilverware };
              }

              syncTrophyToUniverse(originalTier === 1 ? 'bl' : 'lower', matchSeasonYear, originalTier);
              const storeNow = useGameStore.getState();
              const updatedMovements = storeNow.universeMovements || [];
              const latestHistList = [...storeNow.history];

              let fullFinalTable: any[] = [];
              if (latestHistList.length > 0) {
                  const lastIdx = latestHistList.length - 1;
                  latestHistList[lastIdx] = {
                      ...latestHistList[lastIdx],
                      trophiesThisYear: { ...currentTrophies, ...titleSilverware },
                      pos: 1,
                      rivalName: match.rivalName,
                      universeMovements: updatedMovements,
                      ...(pendingSeasonResult?.seasonStats ? {
                          rivalPts: pendingSeasonResult.seasonStats.pts - 1,
                          rivalGd: Math.max(1, pendingSeasonResult.seasonStats.gf - pendingSeasonResult.seasonStats.ga - 5)
                      } : {}),
                      ...(canDeciderPromote ? { nextTier: newTier, promoted: true } : { nextTier: originalTier, promoted: false })
                  };
                  delete (latestHistList[lastIdx] as any).finalTable;
                  fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier, latestHistList[lastIdx]);
                  syncFinalTableToHistory(latestHistList[lastIdx], originalTier, fullFinalTable);
                  storeNow.updateState({ history: latestHistList });
              } else {
                  fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier);
              }

              const verifiedStandings = getDecisionDayStandingsSlice(fullFinalTable, 1);
              const leagueName = getLeagueInfo(originalTier, state.club.country).name;
              let titleToast: any = { 
                  id: Math.random().toString(), 
                  type: "celebration", 
                  category: "decision_day", 
                  title: "DECISION DAY · CHAMPIONS",
                  message: `🏆 ${originalTier === 1 ? leagueName + " Champions!" : canDeciderPromote ? leagueName + " Winners! (Promoted)" : leagueName + " Winners!"}`, 
                  subtitle: "Decision Day victory! Crowned champions in front of a capacity crowd.", 
                  read: false,
                  standings: verifiedStandings
              };
              if (history.length > 1) {
                  const prevHistEntry = history[history.length - 2];
                  const isSameClubPrev = !prevHistEntry.clubName || prevHistEntry.clubName === state.club.name;
                  const prevPos = prevHistEntry.pos;
                  const prevTier = prevHistEntry.tier;
                  if (isSameClubPrev && prevPos === 1 && prevTier >= originalTier) {
                      titleToast = { ...titleToast, message: `🏆 BACK TO BACK CHAMPIONS!`, subtitle: "Back-to-back league titles! An extraordinary dynasty in the making." };
                  } else if (isSameClubPrev && (prevPos === 1 || prevPos === 2) && prevTier > originalTier) {
                      titleToast = { ...titleToast, message: `🔥 BACK TO BACK PROMOTIONS!`, subtitle: "Ascending the leagues with consecutive promotions!" };
                  }
              }
              newToastToTrigger = titleToast;
              addedToast = true;

              const currentTrophiesAfterSim = useGameStore.getState().trophies || [];
              const expectedTrophyName = originalTier === 1 ? 'League Champions' : 'Lower League Title';
              let streakCount = 0;
              const isTopFlightTitle = originalTier === 1 && !isReserveClub(state.club.name);
              if (isTopFlightTitle) {
                  for (let idx = history.length - 1; idx >= 0; idx--) {
                      const hEntry = history[idx];
                      if ((!hEntry.clubName || hEntry.clubName === state.club.name) && hEntry.pos === 1 && (hEntry.tier || 1) === 1) {
                          streakCount++;
                      } else {
                          break;
                      }
                  }
              }
              const computedConsecutiveTitles = isTopFlightTitle ? Math.max(1, streakCount) : 0;
              if (pendingSeasonResult) {
                  pendingSeasonResult.consecutiveTitles = computedConsecutiveTitles;
              }
              useGameStore.getState().updateState({
                  consecutiveTitles: isTopFlightTitle ? (wasAlreadyPos1 ? Math.max(computedConsecutiveTitles, useGameStore.getState().consecutiveTitles || 1) : computedConsecutiveTitles) : 0,
                  trophies: wasAlreadyPos1 ? currentTrophiesAfterSim : [...currentTrophiesAfterSim, expectedTrophyName],
                  notifications: [
                      titleToast,
                      ...(useGameStore.getState().notifications || []).filter(n => n.id !== titleToast.id)
                  ]
              });
          } else if (match.type === 'playoff') {
             if(pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 const earnedPos = pendingSeasonResult.seasonStats.pos || 3;
                 pendingSeasonResult.promoted = true;
                 
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     var originalTier = history[lastIdx].tier;
                     const canPlayoffPromote = originalTier > 1 && !(originalTier === 2 && isReserveClub(state.club.name));
                     var newTier = originalTier;
                     if (canPlayoffPromote) {
                         newTier = originalTier - 1;
                         store.applyPlayoffTierChange(newTier, match.opponentName || match.rivalName);
                         pendingSeasonResult.nextTier = newTier;
                         pendingSeasonResult.clubTier = originalTier;
                         pendingSeasonResult.promoted = true;
                     } else {
                         pendingSeasonResult.promoted = false;
                     }
                     recordPlayoffContext('promotion_playoff', matchSeasonYear, true, match.opponentName || match.rivalName, originalTier - 1, originalTier);
                     const storeNow = useGameStore.getState();
                     const latestHistAfterPromo = [...storeNow.history];
                     const newRepPromo = Math.min(100, (storeNow.reputation || 50) + 5);
                     const newMoralePromo = Math.min(100, (storeNow.club.morale || 50) + 15);
                     const newImpactPromo = Math.min(100, (storeNow.clubImpactScore || 50) + 35);
                     const promoMpBonus = canPlayoffPromote ? 3 : 0;
                     const updatedPromoSp = (storeNow.skillPoints || 0) + promoMpBonus;
                     pendingSeasonResult.newRep = newRepPromo;
                     if (promoMpBonus > 0) {
                         pendingSeasonResult.skillPoints = updatedPromoSp;
                         pendingSeasonResult.earnedPoints = (pendingSeasonResult.earnedPoints || 0) + promoMpBonus;
                     }
                     if (canPlayoffPromote && Array.isArray(pendingSeasonResult.extraNotifications)) {
                         pendingSeasonResult.extraNotifications = pendingSeasonResult.extraNotifications.map((n: any) =>
                             n.title === 'THE VETERAN RINGER TRAP!'
                                 ? {
                                       ...n,
                                       type: 'celebration',
                                       title: 'VETERAN RINGER GAMBLE PAID OFF!',
                                       message: `🎉 PROMOTION ACHIEVED! Veteran star hangs up his boots on a historic playoff high! The TV rights and prize money of the higher tier save your club from financial crisis.`
                                   }
                                 : n
                         );
                     }
                     latestHistAfterPromo[lastIdx] = {
                         ...latestHistAfterPromo[lastIdx],
                         pos: earnedPos,
                         promoted: canPlayoffPromote,
                         ...(canPlayoffPromote ? { nextTier: newTier } : { nextTier: originalTier }),
                         universeMovements: storeNow.universeMovements
                     };
                     delete (latestHistAfterPromo[lastIdx] as any).finalTable;
                     const fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier, latestHistAfterPromo[lastIdx]);
                     syncFinalTableToHistory(latestHistAfterPromo[lastIdx], originalTier, fullFinalTable);
                     history[lastIdx] = latestHistAfterPromo[lastIdx];

                     let promoToast = { id: Math.random().toString(), type: "celebration", category: "league", message: '🏆 Promotion Playoff Winners! (Promoted!)', subtitle: 'High-pressure playoff triumph seals promotion to the higher tier!', read: false, standings: getDecisionDayStandingsSlice(fullFinalTable, earnedPos, false, 'promoted') };
                     if (history.length > 1) {
                         const prevHistEntry = history[history.length - 2];
                         const isSameClubPrev = !prevHistEntry.clubName || prevHistEntry.clubName === state.club.name;
                         const prevPos = prevHistEntry.pos;
                         const prevTier = prevHistEntry.tier;
                         if (isSameClubPrev && (prevPos === 1 || prevPos === 2 || prevHistEntry.promoted) && prevTier > originalTier) {
                             promoToast = { id: Math.random().toString(), type: "celebration", category: "league", message: `🔥 BACK TO BACK PROMOTIONS!`, subtitle: 'Ascending the leagues with consecutive promotions!', read: false, standings: getDecisionDayStandingsSlice(fullFinalTable, earnedPos, false, 'promoted') };
                         }
                     }
                     newToastToTrigger = promoToast;
                     addedToast = true;

                     const updatedPromoNotifs = (storeNow.notifications || []).map((n: any) =>
                         canPlayoffPromote && n.title === 'THE VETERAN RINGER TRAP!'
                             ? {
                                   ...n,
                                   type: 'celebration',
                                   title: 'VETERAN RINGER GAMBLE PAID OFF!',
                                   message: `🎉 PROMOTION ACHIEVED! Veteran star hangs up his boots on a historic playoff high! The TV rights and prize money of the higher tier save your club from financial crisis.`
                               }
                             : n
                     );
                     const wonNatCupThisYear = Boolean(
                         (storeNow.resolvedMatchContext?.cupFinals?.['nat_cup']?.userWon &&
                             storeNow.resolvedMatchContext?.cupFinals?.['nat_cup']?.year === matchSeasonYear) ||
                         pendingSeasonResult?.trophiesThisYear?.dfb
                     );
                     const promoGrantsEl = canPlayoffPromote && newTier === 1 && !isReserveClub(state.club.name) && wonNatCupThisYear;
                     if (promoGrantsEl && pendingSeasonResult.euroStatus !== 'CL') {
                         pendingSeasonResult.euroStatus = 'EL';
                     }
                     storeNow.updateState({
                         history,
                         reputation: newRepPromo,
                         skillPoints: updatedPromoSp,
                         clubImpactScore: newImpactPromo,
                         ...(promoGrantsEl && storeNow.euroStatus !== 'CL' ? { euroStatus: 'EL' } : {}),
                         club: { ...storeNow.club, morale: newMoralePromo },
                         notifications: [promoToast, ...updatedPromoNotifs.filter((n: any) => n.id !== promoToast.id)]
                     });
                 }
             }
         } else if (match.type === 'relegation_playoff') {
             if(pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     var originalTier = history[lastIdx].tier || match.tier || state.club.tier || 1;
                     const numTeams = getLeagueSize(originalTier, state.club.country, undefined, undefined, undefined, clubsDb);
                     const safePos = Math.max(1, numTeams - 2);
                     const earnedPos = safePos;

                     if (pendingSeasonResult.relegated) {
                         const currentShields = store.immunityShields !== undefined ? store.immunityShields : 1;
                         const currentImpact = store.clubImpactScore || 50;
                         const preMeta = pendingSeasonResult._preSimMeta;
                         const restoredRep = Math.min(100, (store.reputation || 50) + 8);
                         pendingSeasonResult.newRep = restoredRep;
                         if (Array.isArray(pendingSeasonResult.extraNotifications)) {
                             pendingSeasonResult.extraNotifications = pendingSeasonResult.extraNotifications.filter(
                                 (n: any) => n.title !== 'RELEGATION CONTRACT CLAUSES ACTIVATED'
                             );
                         }
                         store.updateState({
                             reputation: restoredRep,
                             immunityShields: preMeta?.preSimShields !== undefined ? preMeta.preSimShields : Math.min(2, currentShields + 1),
                             clubImpactScore: Math.min(100, Math.max(currentImpact + 40, preMeta?.preSimImpact ?? 50)),
                             isSacked: false,
                             relegationWageReliefSeasons: 0,
                             tenureYears: preMeta?.preSimTenure ?? Math.max(1, store.tenureYears || 1),
                             notifications: (store.notifications || []).filter((n: any) => !(
                                 n.title === 'RELEGATION CONTRACT CLAUSES ACTIVATED' ||
                                 (typeof n.message === 'string' && (n.message.includes('Relegated') || n.message.includes('You have been sacked!')))
                             ))
                         });
                     }
                     const relegationThreshold = Math.max(1, numTeams - 1);
                     const prePlayoffPos = pendingSeasonResult.seasonStats.pos || history[lastIdx].pos || relegationThreshold;
                     const isCrossTierPlayoffWin = prePlayoffPos === relegationThreshold - 1;
                     if (isCrossTierPlayoffWin) {
                         store.applyPlayoffTierChange(originalTier, match.rivalName || match.opponentName);
                     } else {
                         // Domestic relegation decider: ensure user club stays in originalTier in worldClubs and relegate the defeated rival from the same division
                         const defeatedRivalName = match.rivalName || match.opponentName;
                         const nextWorldClubs = { ...(store.worldClubs || {}) };
                         if (state.club?.id && nextWorldClubs[state.club.id]) {
                             nextWorldClubs[state.club.id] = { ...nextWorldClubs[state.club.id], tier: originalTier };
                         }
                         if (defeatedRivalName) {
                             const rivalEntry = Object.values(nextWorldClubs).find(
                                 (c: any) => c.name === defeatedRivalName && normalizeCountry(c.country || 'GER') === normalizeCountry(state.club.country || 'GER')
                             ) || clubsDb.find(
                                 (c: any) => c.name === defeatedRivalName && normalizeCountry(c.country || 'GER') === normalizeCountry(state.club.country || 'GER')
                             );
                             if (rivalEntry) {
                                 nextWorldClubs[rivalEntry.id] = {
                                     ...(nextWorldClubs[rivalEntry.id] || rivalEntry),
                                     tier: Math.min(getMaxTier(state.club.country || 'GER'), originalTier + 1)
                                 };
                             }
                         }
                         store.updateState({ worldClubs: nextWorldClubs });
                     }
                     if (!isCrossTierPlayoffWin) {
                         pendingSeasonResult.seasonStats.pts += 2;
                         pendingSeasonResult.seasonStats.wins += 1;
                         pendingSeasonResult.seasonStats.losses = Math.max(0, (pendingSeasonResult.seasonStats.losses || 0) - 1);
                     }
                     pendingSeasonResult.seasonStats.pos = earnedPos;
                     pendingSeasonResult.nextTier = originalTier;
                     pendingSeasonResult.clubTier = originalTier;
                     pendingSeasonResult.relegated = false;
                     pendingSeasonResult.survived = true;
                     pendingSeasonResult.isSacked = false;
                     if (pendingSeasonResult.club) {
                         pendingSeasonResult.club.tier = originalTier;
                     }

                     if (isCrossTierPlayoffWin) {
                         recordPlayoffContext('relegation_playoff', matchSeasonYear, true, match.opponentName, originalTier, originalTier + 1);
                     }
                     const storeNow = useGameStore.getState();
                     const latestHistAfterSurvive = [...storeNow.history];
                     // Generate and cache authentic final table with survival outcome
                     const prevFinalTable = latestHistAfterSurvive[lastIdx]?.finalTable || latestHistAfterSurvive[lastIdx]?.fullTable || latestHistAfterSurvive[lastIdx]?.table;
                     const defeatedName = match.rivalName || match.opponentName;
                     const existingRivalRow = Array.isArray(prevFinalTable)
                         ? prevFinalTable.find((r: any) => r.name === defeatedName)
                         : null;
                     const survivedRivalPts = existingRivalRow
                         ? Math.min(existingRivalRow.pts, Math.max(0, pendingSeasonResult.seasonStats.pts - 1))
                         : Math.max(0, pendingSeasonResult.seasonStats.pts - 1);
                     latestHistAfterSurvive[lastIdx] = {
                         ...latestHistAfterSurvive[lastIdx],
                         pos: earnedPos,
                         pts: pendingSeasonResult.seasonStats.pts,
                         wins: pendingSeasonResult.seasonStats.wins,
                         losses: pendingSeasonResult.seasonStats.losses,
                         relegated: false,
                         survived: true,
                         nextTier: originalTier,
                         ...(isCrossTierPlayoffWin ? {} : {
                             rivalName: defeatedName,
                             rivalPts: survivedRivalPts,
                             rivalGd: Math.min((pendingSeasonResult.seasonStats.gf || 0) - (pendingSeasonResult.seasonStats.ga || 0) - 4, -10),
                         }),
                         universeMovements: storeNow.universeMovements
                     };

                     let fullFinalTable: any[];
                     if (!isCrossTierPlayoffWin && Array.isArray(prevFinalTable) && prevFinalTable.length > 0) {
                         const clonedRows = prevFinalTable.map((r: any) => ({ ...r }));
                         const userIdx = clonedRows.findIndex((r: any) => r.isUser || r.name === state.club.name);
                         const rivalIdx = clonedRows.findIndex((r: any) => !r.isUser && r.name === defeatedName);
                         if (userIdx !== -1) {
                             const uRow = clonedRows[userIdx];
                             const newUserPts = pendingSeasonResult.seasonStats.pts;
                             const newUserWins = pendingSeasonResult.seasonStats.wins;
                             const newUserLosses = pendingSeasonResult.seasonStats.losses;
                             const newUserGdNum = (pendingSeasonResult.seasonStats.gf || 0) - (pendingSeasonResult.seasonStats.ga || 0);
                             uRow.pts = newUserPts;
                             uRow.w = newUserWins;
                             uRow.l = newUserLosses;
                             uRow.gd = newUserGdNum > 0 ? `+${newUserGdNum}` : `${newUserGdNum}`;
                             uRow.statusMarker = undefined;

                             if (rivalIdx !== -1) {
                                 const rRow = clonedRows[rivalIdx];
                                 if (rRow.pts >= uRow.pts) {
                                     rRow.pts = Math.max(0, uRow.pts - 1);
                                     rRow.l = (rRow.l || 0) + 1;
                                     rRow.w = Math.max(0, (rRow.w || 0) - 1);
                                 }
                             }
                             // Ensure any row below safePos (17th, 18th, etc.) has points <= uRow.pts so user cleanly sits at earnedPos (16th) while keeping the exact same teams at the bottom
                             const nonUserRows = clonedRows.filter((_: any, idx: number) => idx !== userIdx);
                             if (rivalIdx !== -1 && rivalIdx > earnedPos - 1) {
                                 // Move rival to right below user if rival was above user
                             }
                             const [extractedUser] = clonedRows.splice(userIdx, 1);
                             const targetInsertIdx = Math.max(0, Math.min(clonedRows.length, earnedPos - 1));
                             clonedRows.splice(targetInsertIdx, 0, extractedUser);

                             // Ensure points monotonicity from earnedPos downward without changing club identities
                             for (let i = targetInsertIdx + 1; i < clonedRows.length; i++) {
                                 const prevRow = clonedRows[i - 1];
                                 const curRow = clonedRows[i];
                                 if (curRow.pts > prevRow.pts) {
                                     curRow.pts = Math.max(0, prevRow.pts - 1);
                                 }
                             }
                             const isMaxT = originalTier >= getMaxTier(state.club.country || 'GER');
                             clonedRows.forEach((r: any, idx: number) => {
                                 r.pos = idx + 1;
                                 if (!isMaxT && r.pos >= relegationThreshold) {
                                     r.statusMarker = 'R';
                                 } else if (!isMaxT && r.pos === relegationThreshold - 1) {
                                     r.statusMarker = 'PO';
                                 } else if (r.statusMarker === 'R' || r.statusMarker === 'PO') {
                                     delete r.statusMarker;
                                 }
                             });
                             fullFinalTable = clonedRows;
                         } else {
                             delete (latestHistAfterSurvive[lastIdx] as any).finalTable;
                             fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier, latestHistAfterSurvive[lastIdx]);
                         }
                     } else {
                         delete (latestHistAfterSurvive[lastIdx] as any).finalTable;
                         fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier, latestHistAfterSurvive[lastIdx]);
                     }
                     syncFinalTableToHistory(latestHistAfterSurvive[lastIdx], originalTier, fullFinalTable);
                     history[lastIdx] = latestHistAfterSurvive[lastIdx];
                     storeNow.updateState({ history: latestHistAfterSurvive });

                     const survivalToast = {
                         id: Math.random().toString(),
                         type: 'success',
                         category: 'decision_day' as const,
                         message: '🛡️ Survival Secured! (Stayed Up)',
                         read: false,
                         standings: getDecisionDayStandingsSlice(fullFinalTable, earnedPos, true, 'survived')
                     };
                     newToastToTrigger = survivalToast;
                     addedToast = true;

                     useGameStore.getState().updateState({
                         notifications: [
                             survivalToast,
                             ...(useGameStore.getState().notifications || [])
                         ]
                     });
                 }
             }
         }
     } else {
         // LOST the match
         if (match.type === 'cup_qf') {
             setCupQualifiedForSf(false);
             const curStoreQfLoss = useGameStore.getState();
             const isAmateur = Boolean(
                 match.isAmateurCup ||
                 curStoreQfLoss.activeCupTournament?.isAmateur ||
                 (match.subtitle || '').toUpperCase().includes('REGIONAL') ||
                 (match.subtitle || '').toUpperCase().includes('AMATEUR') ||
                 (match.cupName || '').toLowerCase().includes('amateur') ||
                 (match.cupName || '').toLowerCase().includes('regional')
             );
             const cupKey = isAmateur ? 'reg_cup' : 'nat_cup';
             const cupName = match.cupName || (isAmateur
                 ? (getDomesticCupInfo(state.club.country, 4).name || 'Regional Cup')
                 : (getDomesticCupInfo(state.club.country, 1).name || 'National Cup'));
             const fallbackTier = isAmateur ? Math.max(2, state.club.tier || 3) : 1;
             const qfVictorClub = resolveAiClubByName(match.opponentName, fallbackTier);
             const sfOppName = match.sfOpponent || curStoreQfLoss.activeCupTournament?.sfOpponent;
             let firstFinalistClub = qfVictorClub;
             if (sfOppName && sfOppName !== state.club.name && sfOppName !== match.opponentName) {
                 const sfOppClub = resolveAiClubByName(sfOppName, fallbackTier);
                 const qfVictorSfProb = Math.max(0.15, Math.min(0.85, 0.5 + ((qfVictorClub.baseOvr || 75) - (sfOppClub.baseOvr || 75)) * 0.03));
                 if (Math.random() >= qfVictorSfProb) {
                     firstFinalistClub = sfOppClub;
                 }
             }
             let otherFinalistName = match.finalOpponent || curStoreQfLoss.activeCupTournament?.finalOpponent;
             if (!otherFinalistName || otherFinalistName === state.club.name || otherFinalistName === firstFinalistClub.name || otherFinalistName === match.opponentName) {
                 const normCountry = normalizeCountry(state.club.country || 'GER');
                 const candidates = clubsDb.filter(c =>
                     normalizeCountry(c.country || 'GER') === normCountry &&
                     c.name !== state.club.name &&
                     c.name !== firstFinalistClub.name &&
                     c.name !== match.opponentName &&
                     c.name !== sfOppName &&
                     !isReserveClub(c.name) &&
                     (isAmateur ? c.tier >= 2 : c.tier === 1)
                 ).sort((a, b) => (b.baseOvr || 75) - (a.baseOvr || 75));
                 otherFinalistName = candidates[Math.floor(Math.random() * Math.min(4, Math.max(1, candidates.length)))]?.name || '';
             }
             let aiFinalWinnerClub = firstFinalistClub;
             let aiFinalRunnerUpName = otherFinalistName || '';
             if (otherFinalistName && otherFinalistName !== firstFinalistClub.name) {
                 const otherFinalistClub = resolveAiClubByName(otherFinalistName, fallbackTier);
                 const firstWinProb = Math.max(0.15, Math.min(0.85, 0.5 + ((firstFinalistClub.baseOvr || 75) - (otherFinalistClub.baseOvr || 75)) * 0.03));
                 if (Math.random() < firstWinProb) {
                     aiFinalWinnerClub = firstFinalistClub;
                     aiFinalRunnerUpName = otherFinalistClub.name;
                 } else {
                     aiFinalWinnerClub = otherFinalistClub;
                     aiFinalRunnerUpName = firstFinalistClub.name;
                 }
             }
             const prevQfContext = curStoreQfLoss.resolvedMatchContext || {};
             const updatedQfContext = {
                 ...prevQfContext,
                 cupFinals: {
                     ...(prevQfContext.cupFinals || {}),
                     [cupKey]: {
                         cupId: cupKey,
                         cupName,
                         year: matchSeasonYear,
                         winnerId: aiFinalWinnerClub.id,
                         winnerName: aiFinalWinnerClub.name,
                         runnerUpId: 'opp_runner_up',
                         runnerUpName: aiFinalRunnerUpName || match.opponentName,
                         userWon: false
                     }
                 }
             };
             const currentRuns = curStoreQfLoss.cupRunResults || [];
             curStoreQfLoss.updateState({
                 cupQualifiedForSf: false,
                 resolvedMatchContext: updatedQfContext,
                 cupRunResults: [
                     ...currentRuns.filter(r => r.year !== matchSeasonYear || r.id !== cupKey),
                     {
                         year: matchSeasonYear,
                         id: cupKey,
                         nameEn: isAmateur ? 'Regional Cup' : 'National Cup',
                         nameDe: isAmateur ? 'Regionalpokal' : 'Nationaler Pokal',
                         won: false,
                         exitRound: 'Quarter-Final',
                         winnerName: aiFinalWinnerClub.name,
                         ...(aiFinalRunnerUpName ? { runnerUpName: aiFinalRunnerUpName } : {})
                     }
                 ]
             });
         } else if (match.type === 'euro_cup_qf') {
             setEuroQualifiedForSf(false);
             const curStoreEuroQfLoss = useGameStore.getState();
             const euroKey = (state.euroStatus || 'CL').toUpperCase();
             const euroKeyLower = euroKey === 'CL' ? 'cl' : euroKey === 'ECL' ? 'ecl' : 'el';
             const euroName = euroKey === 'CL' ? 'EHF Champions League' : euroKey === 'EL' ? 'EHF European League' : 'EHF European Cup';
             const qfVictorClub = resolveAiClubByName(match.opponentName, 1);
             const sfOppName = match.sfOpponent || curStoreEuroQfLoss.activeEuroTournament?.sfOpponent;
             let firstFinalistClub = qfVictorClub;
             if (sfOppName && sfOppName !== state.club.name && sfOppName !== match.opponentName) {
                 const sfOppClub = resolveAiClubByName(sfOppName, 1);
                 const qfVictorSfProb = Math.max(0.15, Math.min(0.85, 0.5 + ((qfVictorClub.baseOvr || 82) - (sfOppClub.baseOvr || 82)) * 0.03));
                 if (Math.random() >= qfVictorSfProb) {
                     firstFinalistClub = sfOppClub;
                 }
             }
             let otherFinalistName = match.finalOpponent || curStoreEuroQfLoss.activeEuroTournament?.finalOpponent;
             if (!otherFinalistName || otherFinalistName === state.club.name || otherFinalistName === firstFinalistClub.name || otherFinalistName === match.opponentName) {
                 const candidates = clubsDb.filter(c =>
                     c.tier === 1 &&
                     c.name !== state.club.name &&
                     c.name !== firstFinalistClub.name &&
                     c.name !== match.opponentName &&
                     c.name !== sfOppName &&
                     !isReserveClub(c.name)
                 ).sort((a, b) => (b.baseOvr || 80) - (a.baseOvr || 80));
                 otherFinalistName = candidates[Math.floor(Math.random() * Math.min(6, Math.max(1, candidates.length)))]?.name || '';
             }
             let aiFinalWinnerClub = firstFinalistClub;
             let aiFinalRunnerUpName = otherFinalistName || '';
             if (otherFinalistName && otherFinalistName !== firstFinalistClub.name) {
                 const otherFinalistClub = resolveAiClubByName(otherFinalistName, 1);
                 const firstWinProb = Math.max(0.15, Math.min(0.85, 0.5 + ((firstFinalistClub.baseOvr || 82) - (otherFinalistClub.baseOvr || 82)) * 0.03));
                 if (Math.random() < firstWinProb) {
                     aiFinalWinnerClub = firstFinalistClub;
                     aiFinalRunnerUpName = otherFinalistClub.name;
                 } else {
                     aiFinalWinnerClub = otherFinalistClub;
                     aiFinalRunnerUpName = firstFinalistClub.name;
                 }
             }
             const prevEuroQfContext = curStoreEuroQfLoss.resolvedMatchContext || {};
             const updatedEuroQfContext = {
                 ...prevEuroQfContext,
                 cupFinals: {
                     ...(prevEuroQfContext.cupFinals || {}),
                     [euroKeyLower]: {
                         cupId: euroKeyLower,
                         cupName: euroName,
                         year: matchSeasonYear,
                         winnerId: aiFinalWinnerClub.id,
                         winnerName: aiFinalWinnerClub.name,
                         runnerUpId: 'opp_runner_up',
                         runnerUpName: aiFinalRunnerUpName || match.opponentName,
                         userWon: false
                     }
                 }
             };
             const currentRuns = curStoreEuroQfLoss.cupRunResults || [];
             curStoreEuroQfLoss.updateState({
                 euroQualifiedForSf: false,
                 resolvedMatchContext: updatedEuroQfContext,
                 cupRunResults: [
                     ...currentRuns.filter(r => r.year !== matchSeasonYear || r.id !== 'euro_cup'),
                     {
                         year: matchSeasonYear,
                         id: 'euro_cup',
                         nameEn: euroName,
                         nameDe: euroName,
                         won: false,
                         exitRound: 'Quarter-Final',
                         winnerName: aiFinalWinnerClub.name,
                         ...(aiFinalRunnerUpName ? { runnerUpName: aiFinalRunnerUpName } : {})
                     }
                 ]
             });
         } else if (match.type === 'championship_decider') {
             if (pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 const wasPrematurePos1 = pendingSeasonResult.seasonStats.pos === 1;
                 pendingSeasonResult.seasonStats.pos = 2; 
                 if (pendingSeasonResult.trophiesThisYear) {
                     delete pendingSeasonResult.trophiesThisYear.bl;
                     delete pendingSeasonResult.trophiesThisYear.lower;
                 }
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     const targetHist = history[lastIdx];
                     const newTrophiesThisYear = targetHist.trophiesThisYear ? { ...targetHist.trophiesThisYear } : undefined;
                     if (newTrophiesThisYear) {
                         delete newTrophiesThisYear.bl;
                         delete newTrophiesThisYear.lower;
                     }
                     const currentTrophiesList = store.trophies || [];
                     const lastTrophy = currentTrophiesList[currentTrophiesList.length - 1];
                     if (lastTrophy === 'League Champions' || lastTrophy === 'Lower League Title') {
                         store.updateState({ trophies: currentTrophiesList.slice(0, -1) });
                     }
                     var originalTier = match.tier || pendingSeasonResult?.clubTier || targetHist.tier || state.club.tier || 1;
                     if (wasPrematurePos1) {
                         const tierPrizeMap: Record<number, number> = { 1: 350000, 2: 120000, 3: 45000, 4: 15000, 5: 5000 };
                         const prematurePrize = getLeagueScaledVal(originalTier, tierPrizeMap[originalTier] || 5000, state.club.country || 'GER');
                         const prematureSp = originalTier === 1 ? 4 : 3;
                         const isPromoDeniedLoss = originalTier === 2 && isReserveClub(state.club.name);
                         const prematureRep = originalTier === 1 ? 8 : (isPromoDeniedLoss ? 5 : 2);
                         const curStore = useGameStore.getState();
                         const adjustedRep = Math.max(1, (curStore.reputation || 50) - prematureRep);
                         const adjustedSp = Math.max(0, (curStore.skillPoints || 0) - prematureSp);
                         const isPrematureChampNotif = (n: any) =>
                             n.title === 'LEAGUE CHAMPIONS!' ||
                             n.category === 'decision_day' ||
                             (typeof n.title === 'string' && (n.title.includes('DYNASTY PRESSURE') || n.title.includes('TITLE DEFENSE TARGET')));
                         const hasOtherSilverware = Boolean(
                             newTrophiesThisYear && Object.values(newTrophiesThisYear).some(v => Number(v) > 0)
                         );
                         const restoredDrought = hasOtherSilverware
                             ? 0
                             : ((pendingSeasonResult._preSimMeta?.preSimDrought ?? 0) + 1);
                         curStore.updateState({
                             budget: curStore.budget - prematurePrize,
                             skillPoints: adjustedSp,
                             reputation: adjustedRep,
                             consecutiveTitles: 0,
                             trophyDrought: restoredDrought,
                             totals: {
                                 ...curStore.totals,
                                 titles: Math.max(0, (curStore.totals.titles || 0) - 1),
                                 domTrophies: Math.max(0, (curStore.totals.domTrophies || 0) - (originalTier === 1 && !isReserveClub(state.club.name) ? 1 : 0)),
                                 trophies: Math.max(0, (curStore.totals.trophies || 0) - 1)
                             },
                             notifications: (curStore.notifications || []).filter(n => !isPrematureChampNotif(n))
                         });
                         if (Array.isArray(pendingSeasonResult.extraNotifications)) {
                             pendingSeasonResult.extraNotifications = pendingSeasonResult.extraNotifications.filter((n: any) => !isPrematureChampNotif(n));
                         }
                         pendingSeasonResult.consecutiveTitles = 0;
                         pendingSeasonResult.newRep = adjustedRep;
                         pendingSeasonResult.skillPoints = adjustedSp;
                         pendingSeasonResult.earnedPoints = Math.max(0, (pendingSeasonResult.earnedPoints || 0) - prematureSp);
                         syncPostSeasonFinanceDelta(-prematurePrize);
                     }
                     syncRivalChampionToUniverse(match.rivalName || match.opponentName, matchSeasonYear, originalTier);
                     const canRunnerUpPromote = originalTier > 1 && !(originalTier === 2 && isReserveClub(state.club.name));
                     if (canRunnerUpPromote && useGameStore.getState().club.tier !== originalTier - 1) {
                         useGameStore.getState().applyPlayoffTierChange(originalTier - 1);
                     }
                     const storeNow = useGameStore.getState();
                     const latestHistAfterRival = [...storeNow.history];
                     const baseTargetHist = latestHistAfterRival[lastIdx] || targetHist;

                     history[lastIdx] = {
                         ...baseTargetHist,
                         pos: 2,
                         rivalName: match.rivalName,
                         rivalPts: pendingSeasonResult.seasonStats.pts + 1,
                         rivalGd: Math.max(1, pendingSeasonResult.seasonStats.gf - pendingSeasonResult.seasonStats.ga + 5),
                         universeMovements: storeNow.universeMovements,
                         ...(newTrophiesThisYear ? { trophiesThisYear: newTrophiesThisYear } : {})
                     };
                     delete (history[lastIdx] as any).finalTable; // Purge stale table before regeneration!

                     if (canRunnerUpPromote) {
                         var newTier = originalTier - 1; 
                         pendingSeasonResult.nextTier = newTier;
                         pendingSeasonResult.clubTier = originalTier;
                         pendingSeasonResult.promoted = true;
                         history[lastIdx] = {
                             ...history[lastIdx],
                             promoted: true,
                             nextTier: newTier
                         };
                         
                         const fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier, history[lastIdx]);
                         syncFinalTableToHistory(history[lastIdx], originalTier, fullFinalTable);
                         storeNow.updateState({ history });

                         if (!pendingCupToasts.some(t => typeof t.message === 'string' && t.message.includes('Promoted as Runner-Up'))) {
                             let runnerUpPromoToast: any = { 
                                 id: Math.random().toString(), 
                                 type: "celebration", 
                                 category: "league", 
                                 message: '🥈 Promoted as Runner-Up!', 
                                 subtitle: 'Secured 2nd place and guaranteed promotion!', 
                                 read: false, 
                                 standings: getDecisionDayStandingsSlice(fullFinalTable, 2, false, 'promoted')
                             };
                             if (history.length > 1) {
                                 const prevHistEntry = history[history.length - 2];
                                 const isSameClubPrev = !prevHistEntry.clubName || prevHistEntry.clubName === state.club.name;
                                 const prevPos = prevHistEntry.pos;
                                 const prevTier = prevHistEntry.tier;
                                 if (isSameClubPrev && (prevPos === 1 || prevPos === 2) && prevTier > originalTier) {
                                      runnerUpPromoToast = {
                                          ...runnerUpPromoToast,
                                          message: "🔥 BACK TO BACK PROMOTIONS!",
                                          subtitle: "Ascending the leagues with consecutive promotions!"
                                      };
                                 }
                             }
                             newToastToTrigger = runnerUpPromoToast;
                             addedToast = true;
                         }
                     } else {
                         const isTopTierRunnerUp = originalTier === 1 && !isReserveClub(state.club.name);
                         if (isTopTierRunnerUp) {
                             pendingSeasonResult.euroStatus = 'CL';
                         }
                         pendingSeasonResult.promoted = false;
                         pendingSeasonResult.nextTier = originalTier;
                         history[lastIdx] = {
                             ...history[lastIdx],
                             promoted: false,
                             nextTier: originalTier
                         };
                         const fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier, history[lastIdx]);
                         syncFinalTableToHistory(history[lastIdx], originalTier, fullFinalTable);
                         storeNow.updateState({
                             history,
                             ...(isTopTierRunnerUp ? { euroStatus: 'CL' } : {}),
                             consecutiveTitles: 0
                         });
                         const runnerUpLeagueName = getLeagueInfo(originalTier, state.club.country).name;
                         const runnerUpToast = {
                             id: Math.random().toString(),
                             type: 'celebration',
                             category: 'league',
                             message: '🥈 ' + runnerUpLeagueName + ' Runner-Up!',
                             subtitle: isTopTierRunnerUp
                                 ? 'Vice-Champions of ' + runnerUpLeagueName + '! Qualified for next season\'s EHF Champions League.'
                                 : 'Vice-Champions of ' + runnerUpLeagueName + '!',
                             read: false,
                             standings: getDecisionDayStandingsSlice(fullFinalTable, 2, false, 'runner_up')
                         };
                         addedToast = true;
                         newToastToTrigger = runnerUpToast;
                     }
                     // BACKSTOP: Strip any accidental league winner toasts if we lost the decider
                     setPendingCupToasts(prev => prev.filter(t => !(typeof t.message === 'string' && (t.message.includes('Champions!') || t.message === '🏆 Promoted!'))));
                 }
             }
         } else if (match.type === 'playoff') {
             // Lost promotion playoff, stay in original tier
             if(pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 pendingSeasonResult.seasonStats.pos = 3; 
                 pendingSeasonResult.promoted = false;
                 pendingSeasonResult.survived = false;
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     var originalTier = history[lastIdx].tier;
                     store.applyPlayoffTierChange(originalTier);
                     pendingSeasonResult.nextTier = originalTier;
                     pendingSeasonResult.clubTier = originalTier;
                     if (pendingSeasonResult.club) {
                         pendingSeasonResult.club.tier = originalTier;
                     }
                     recordPlayoffContext('promotion_playoff', matchSeasonYear, false, match.opponentName || match.rivalName, (originalTier || state.club.tier) - 1, originalTier || state.club.tier);
                     const storeNow = useGameStore.getState();
                     const latestHistAfterLoss = [...storeNow.history];
                     latestHistAfterLoss[lastIdx] = {
                         ...latestHistAfterLoss[lastIdx],
                         pos: 3,
                         promoted: false,
                         nextTier: originalTier,
                         universeMovements: storeNow.universeMovements
                     };
                     delete (latestHistAfterLoss[lastIdx] as any).finalTable;
                     const fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier, latestHistAfterLoss[lastIdx]);
                     syncFinalTableToHistory(latestHistAfterLoss[lastIdx], originalTier, fullFinalTable);
                     history[lastIdx] = latestHistAfterLoss[lastIdx];
                     storeNow.updateState({ history: latestHistAfterLoss });

                     const playoffLossToast = {
                         id: Math.random().toString(),
                         type: 'info',
                         category: 'league',
                         message: '⚔️ Promotion Playoff Defeat (Stays in Tier)',
                         subtitle: 'Fought valiantly in the promotion decider, but missed out. Club remains in current tier for the upcoming campaign.',
                         read: false,
                         standings: getDecisionDayStandingsSlice(fullFinalTable, 3)
                     };
                     newToastToTrigger = playoffLossToast;
                     addedToast = true;
                 }
             }
         } else if (match.type === 'relegation_playoff') {
             // Lost relegation playoff, relegated!
             if(pendingSeasonResult && pendingSeasonResult.seasonStats) {
                 const earnedPos = pendingSeasonResult.seasonStats.pos;
                 const store = useGameStore.getState();
                 const history = [...store.history];
                 if (history.length > 0) {
                     const lastIdx = history.length - 1;
                     var originalTier = history[lastIdx].tier;
                     var newTier = Math.min(getMaxTier(state.club.country || "GER"), originalTier + 1);

                     const numTeams = getLeagueSize(originalTier, state.club.country, undefined, undefined, undefined, clubsDb);
                     const relegationThreshold = Math.max(1, numTeams - 1);
                     const isCrossTierPlayoffLoss = earnedPos < relegationThreshold;

                     store.applyPlayoffTierChange(newTier, match.opponentName || match.rivalName);
                     if (isCrossTierPlayoffLoss) {
                         recordPlayoffContext('relegation_playoff', matchSeasonYear, false, match.opponentName, originalTier, newTier);
                     }
                     const storeNow = useGameStore.getState();
                     const latestHistAfterReleg = [...storeNow.history];
                     latestHistAfterReleg[lastIdx] = {
                         ...latestHistAfterReleg[lastIdx],
                         relegated: true,
                         survived: false,
                         nextTier: newTier,
                         ...(isCrossTierPlayoffLoss ? {} : {
                             rivalName: match.rivalName || match.opponentName,
                             rivalPts: pendingSeasonResult.seasonStats.pts + 1,
                             rivalGd: Math.max(pendingSeasonResult.seasonStats.gf - pendingSeasonResult.seasonStats.ga + 4, -5),
                         }),
                         universeMovements: storeNow.universeMovements
                     };

                     // Generate and cache authentic final table with relegation outcome
                     delete (latestHistAfterReleg[lastIdx] as any).finalTable;
                     const fullFinalTable = generateLeagueTable(storeNow, clubsDb, originalTier, latestHistAfterReleg[lastIdx]);
                     syncFinalTableToHistory(latestHistAfterReleg[lastIdx], originalTier, fullFinalTable);
                     history[lastIdx] = latestHistAfterReleg[lastIdx];
                     storeNow.updateState({
                         history: latestHistAfterReleg,
                         ...(newTier > 1 ? { euroStatus: null } : {})
                     });

                     const wasAlreadyRelegatedInSim = Boolean(pendingSeasonResult.relegated);
                     const penalty = !wasAlreadyRelegatedInSim ? store.applyRelegationPenalty() : { isSacked: store.isSacked || false, toast: { id: Math.random().toString(), type: "error", message: "Relegated! Relegation playoff defeat seals demotion to the lower division.", read: false } };
                     if (!wasAlreadyRelegatedInSim) {
                         const latestAfterPenalty = useGameStore.getState();
                         const adjustedRep = Math.max(1, (latestAfterPenalty.reputation || 50) - 8);
                         latestAfterPenalty.updateState({ reputation: adjustedRep });
                         pendingSeasonResult.newRep = adjustedRep;
                     }
                     const verifiedStandings = getDecisionDayStandingsSlice(fullFinalTable, earnedPos, true, 'relegated');
                     if (penalty.toast) {
                         penalty.toast.standings = verifiedStandings;
                         penalty.toast.category = 'decision_day';
                         newToastToTrigger = penalty.toast;
                         addedToast = true;
                         const curAfterPen = useGameStore.getState();
                         curAfterPen.updateState({
                             notifications: [
                                 penalty.toast,
                                 ...(curAfterPen.notifications || []).filter((n: any) => n.id !== penalty.toast.id)
                             ]
                         });
                     }
                     if (penalty.isSacked) {
                         pendingSeasonResult.isSacked = true;
                     }
                     pendingSeasonResult.nextTier = newTier;
                     pendingSeasonResult.clubTier = originalTier;
                     pendingSeasonResult.relegated = true;
                     pendingSeasonResult.survived = false;
                     if (newTier > 1) {
                         pendingSeasonResult.euroStatus = null;
                     }
                     if (pendingSeasonResult.club) {
                         pendingSeasonResult.club.tier = newTier;
                     }
                 }
             }
         } else if (match.type === 'cup_sf') {
             const curStoreSfLoss = useGameStore.getState();
             const isReg = Boolean(
                 match.isAmateurCup ||
                 curStoreSfLoss.activeCupTournament?.isAmateur ||
                 (match.subtitle || '').toUpperCase().includes('REGIONAL') ||
                 (match.subtitle || '').toUpperCase().includes('AMATEUR') ||
                 (match.cupName || '').toLowerCase().includes('amateur') ||
                 (match.cupName || '').toLowerCase().includes('regional')
             );
             const cupName = match.cupName || (isReg 
                ? (getDomesticCupInfo(state.club.country, 4).name || 'Regional Cup')
                : (getDomesticCupInfo(state.club.country, 1).name || 'National Cup'));
             const sfVictorClub = resolveAiClubByName(match.opponentName, isReg ? Math.max(2, state.club.tier || 3) : 1);
             const otherFinalistName = match.finalOpponent || curStoreSfLoss.activeCupTournament?.finalOpponent;
             let aiFinalWinnerClub = sfVictorClub;
             let aiFinalRunnerUpName = otherFinalistName || '';
             if (otherFinalistName && otherFinalistName !== state.club.name && otherFinalistName !== match.opponentName) {
                 const otherFinalistClub = resolveAiClubByName(otherFinalistName, isReg ? Math.max(2, state.club.tier || 3) : 1);
                 const sfVictorProb = Math.max(0.15, Math.min(0.85, 0.5 + ((sfVictorClub.baseOvr || 75) - (otherFinalistClub.baseOvr || 75)) * 0.03));
                 if (Math.random() < sfVictorProb) {
                     aiFinalWinnerClub = sfVictorClub;
                     aiFinalRunnerUpName = otherFinalistClub.name;
                 } else {
                     aiFinalWinnerClub = otherFinalistClub;
                     aiFinalRunnerUpName = sfVictorClub.name;
                 }
             }
             const currentRuns = curStoreSfLoss.cupRunResults || [];
             const prevSfContext = curStoreSfLoss.resolvedMatchContext || {};
             const updatedSfContext = {
                 ...prevSfContext,
                 cupFinals: {
                     ...(prevSfContext.cupFinals || {}),
                     [isReg ? 'reg_cup' : 'nat_cup']: {
                         cupId: isReg ? 'reg_cup' : 'nat_cup',
                         cupName,
                         year: matchSeasonYear,
                         winnerId: aiFinalWinnerClub.id,
                         winnerName: aiFinalWinnerClub.name,
                         runnerUpId: 'opp_runner_up',
                         runnerUpName: aiFinalRunnerUpName || match.opponentName,
                         userWon: false
                     }
                 }
             };
             const updatedSfWorldClubs = { ...(curStoreSfLoss.worldClubs || {}) };
             if (aiFinalWinnerClub.id !== undefined && updatedSfWorldClubs[aiFinalWinnerClub.id]) {
                 const maxCap = isReg ? 90 : 95;
                 updatedSfWorldClubs[aiFinalWinnerClub.id] = {
                     ...updatedSfWorldClubs[aiFinalWinnerClub.id],
                     baseOvr: Math.min(maxCap, (updatedSfWorldClubs[aiFinalWinnerClub.id].baseOvr || 80) + 1)
                 };
             }
             curStoreSfLoss.updateState({
                 resolvedMatchContext: updatedSfContext,
                 ...(Object.keys(updatedSfWorldClubs).length > 0 ? { worldClubs: updatedSfWorldClubs } : {}),
                 cupRunResults: [
                     ...currentRuns.filter(r => r.year !== matchSeasonYear || r.id !== (isReg ? 'reg_cup' : 'nat_cup')),
                     {
                         year: matchSeasonYear,
                         id: isReg ? 'reg_cup' : 'nat_cup',
                         nameEn: isReg ? 'Regional Cup' : 'National Cup',
                         nameDe: isReg ? 'Regionalpokal' : 'Nationaler Pokal',
                         won: false,
                         exitRound: 'Semi-Final',
                         winnerName: aiFinalWinnerClub.name,
                         ...(aiFinalRunnerUpName ? { runnerUpName: aiFinalRunnerUpName } : {})
                     }
                 ]
             });
             const histAfterDomSf = [...useGameStore.getState().history];
             if (histAfterDomSf.length > 0) {
                 histAfterDomSf[histAfterDomSf.length - 1] = {
                     ...histAfterDomSf[histAfterDomSf.length - 1],
                     resolvedMatchContext: updatedSfContext
                 } as any;
                 useGameStore.getState().updateState({ history: histAfterDomSf });
             }
             if (pendingSeasonResult) {
                 pendingSeasonResult.resolvedMatchContext = updatedSfContext;
                 if (Object.keys(updatedSfWorldClubs).length > 0) {
                     pendingSeasonResult.worldClubs = updatedSfWorldClubs;
                 }
             }
             syncTrophyToUniverse(isReg ? 'reg' : 'dfb', matchSeasonYear, aiFinalWinnerClub.tier || 1, aiFinalWinnerClub, cupName);
         } else if (match.type === 'cup_final') {
             const curStoreDomLoss = useGameStore.getState();
             const isReg = Boolean(
                 match.isAmateurCup ||
                 curStoreDomLoss.activeCupTournament?.isAmateur ||
                 (match.subtitle || '').toUpperCase().includes('REGIONAL') ||
                 (match.subtitle || '').toUpperCase().includes('AMATEUR') ||
                 (match.cupName || '').toLowerCase().includes('amateur') ||
                 (match.cupName || '').toLowerCase().includes('regional')
             );
             const cupName = match.cupName || (isReg 
                ? (getDomesticCupInfo(state.club.country, 4).name || 'Regional Cup')
                : (getDomesticCupInfo(state.club.country, 1).name || 'National Cup'));
             const currentRuns = curStoreDomLoss.cupRunResults || [];
             const finalLossNotif = {
                 id: Math.random().toString(),
                 type: 'info' as const,
                 category: 'cup' as const,
                 title: `${cupName.toUpperCase()} FINALIST`,
                 message: `🥈 ${cupName} Runner-Up: Defeated by ${match.opponentName} in the Final. ${match.opponentName} lift the trophy.`,
                 read: false
             };
             curStoreDomLoss.updateState({
                 notifications: [finalLossNotif, ...(curStoreDomLoss.notifications || [])],
                 cupRunResults: [
                     ...currentRuns.filter(r => r.year !== matchSeasonYear || r.id !== (isReg ? 'reg_cup' : 'nat_cup')),
                     {
                         year: matchSeasonYear,
                         id: isReg ? 'reg_cup' : 'nat_cup',
                         nameEn: isReg ? 'Regional Cup' : 'National Cup',
                         nameDe: isReg ? 'Regionalpokal' : 'Nationaler Pokal',
                         won: false,
                         exitRound: 'Final',
                         winnerName: match.opponentName,
                         runnerUpName: state.club.name
                     }
                 ]
             });
             recordCupFinalContext(isReg ? 'reg_cup' : 'nat_cup', cupName, matchSeasonYear, false, match.opponentName);
         } else if (match.type === 'cl_sf' || match.type === 'euro_cup_sf') {
             const curStoreEuroSfLoss = useGameStore.getState();
             const isCl = match.type === 'cl_sf';
             const isEcl = Boolean(
                 (match.subtitle || '').toUpperCase().includes('EUROPEAN CUP') ||
                 (match.cupName || '').toUpperCase().includes('EUROPEAN CUP')
             );
             const euroName = isCl ? 'EHF Champions League' : isEcl ? 'EHF European Cup' : 'EHF European League';
             const euroKey = isCl ? 'cl' : isEcl ? 'ecl' : 'el';
             const sfVictorClub = resolveAiClubByName(match.opponentName, 1);
             const otherFinalistName = match.finalOpponent || curStoreEuroSfLoss.activeEuroTournament?.finalOpponent;
             let aiFinalWinnerClub = sfVictorClub;
             let aiFinalRunnerUpName = otherFinalistName || '';
             if (otherFinalistName && otherFinalistName !== state.club.name && otherFinalistName !== match.opponentName) {
                 const otherFinalistClub = resolveAiClubByName(otherFinalistName, 1);
                 const sfVictorProb = Math.max(0.15, Math.min(0.85, 0.5 + ((sfVictorClub.baseOvr || 82) - (otherFinalistClub.baseOvr || 82)) * 0.03));
                 if (Math.random() < sfVictorProb) {
                     aiFinalWinnerClub = sfVictorClub;
                     aiFinalRunnerUpName = otherFinalistClub.name;
                 } else {
                     aiFinalWinnerClub = otherFinalistClub;
                     aiFinalRunnerUpName = sfVictorClub.name;
                 }
             }
             const currentRuns = curStoreEuroSfLoss.cupRunResults || [];
             const prevEuroSfContext = curStoreEuroSfLoss.resolvedMatchContext || {};
             const updatedEuroSfContext = {
                 ...prevEuroSfContext,
                 cupFinals: {
                     ...(prevEuroSfContext.cupFinals || {}),
                     [euroKey]: {
                         cupId: euroKey,
                         cupName: euroName,
                         year: matchSeasonYear,
                         winnerId: aiFinalWinnerClub.id,
                         winnerName: aiFinalWinnerClub.name,
                         runnerUpId: 'opp_runner_up',
                         runnerUpName: aiFinalRunnerUpName || match.opponentName,
                         userWon: false
                     }
                 }
             };
             const updatedEuroSfWorldClubs = { ...(curStoreEuroSfLoss.worldClubs || {}) };
             if (aiFinalWinnerClub.id !== undefined && updatedEuroSfWorldClubs[aiFinalWinnerClub.id]) {
                 const maxCap = euroKey === 'cl' ? 95 : euroKey === 'el' ? 94 : 90;
                 updatedEuroSfWorldClubs[aiFinalWinnerClub.id] = {
                     ...updatedEuroSfWorldClubs[aiFinalWinnerClub.id],
                     baseOvr: Math.min(maxCap, (updatedEuroSfWorldClubs[aiFinalWinnerClub.id].baseOvr || 82) + 1)
                 };
             }
             curStoreEuroSfLoss.updateState({
                 resolvedMatchContext: updatedEuroSfContext,
                 ...(Object.keys(updatedEuroSfWorldClubs).length > 0 ? { worldClubs: updatedEuroSfWorldClubs } : {}),
                 cupRunResults: [
                     ...currentRuns.filter(r => r.year !== matchSeasonYear || r.id !== 'euro_cup'),
                     {
                         year: matchSeasonYear,
                         id: 'euro_cup',
                         nameEn: euroName,
                         nameDe: euroName,
                         won: false,
                         exitRound: 'Semi-Final',
                         winnerName: aiFinalWinnerClub.name,
                         ...(aiFinalRunnerUpName ? { runnerUpName: aiFinalRunnerUpName } : {})
                     }
                 ]
             });
             const histAfterEuroSf = [...useGameStore.getState().history];
             if (histAfterEuroSf.length > 0) {
                 histAfterEuroSf[histAfterEuroSf.length - 1] = {
                     ...histAfterEuroSf[histAfterEuroSf.length - 1],
                     resolvedMatchContext: updatedEuroSfContext
                 } as any;
                 useGameStore.getState().updateState({ history: histAfterEuroSf });
             }
             if (pendingSeasonResult) {
                 pendingSeasonResult.resolvedMatchContext = updatedEuroSfContext;
                 if (Object.keys(updatedEuroSfWorldClubs).length > 0) {
                     pendingSeasonResult.worldClubs = updatedEuroSfWorldClubs;
                 }
             }
             syncTrophyToUniverse(euroKey, matchSeasonYear, aiFinalWinnerClub.tier || 1, aiFinalWinnerClub, euroName);
             if (euroKey === 'cl') {
                 const curMovs = useGameStore.getState().universeMovements || [];
                 const existingCwc = curMovs.find(m => m.year === matchSeasonYear && m.type === 'intl_cup' && (m.cupTitle === 'IHF Super Globe' || String(m.id).endsWith('-cup-cwc')));
                 if (!existingCwc || existingCwc.clubName === state.club.name || Math.random() < 0.65) {
                     syncTrophyToUniverse('cwc', matchSeasonYear, aiFinalWinnerClub.tier || 1, aiFinalWinnerClub, 'IHF Super Globe');
                 }
             }
         } else if (match.type === 'cl_final' || match.type === 'euro_cup_final') {
             const curStoreEuroLoss = useGameStore.getState();
             const isCl = match.type === 'cl_final';
             const isEcl = Boolean(
                 (match.subtitle || '').toUpperCase().includes('EUROPEAN CUP') ||
                 (match.cupName || '').toUpperCase().includes('EUROPEAN CUP')
             );
             const euroName = isCl ? 'EHF Champions League' : isEcl ? 'EHF European Cup' : 'EHF European League';
             const euroLossNotif = {
                 id: Math.random().toString(),
                 type: 'info' as const,
                 category: 'euro' as const,
                 title: `${euroName.toUpperCase()} FINALIST`,
                 message: `🥈 ${euroName} Runner-Up: Defeated by ${match.opponentName} in the Final. ${match.opponentName} crowned continental champions.`,
                 read: false
             };
             const currentRuns = curStoreEuroLoss.cupRunResults || [];
             curStoreEuroLoss.updateState({
                 notifications: [euroLossNotif, ...(curStoreEuroLoss.notifications || [])],
                 cupRunResults: [
                     ...currentRuns.filter(r => r.year !== matchSeasonYear || r.id !== 'euro_cup'),
                     {
                         year: matchSeasonYear,
                         id: 'euro_cup',
                         nameEn: euroName,
                         nameDe: euroName,
                         won: false,
                         exitRound: 'Final',
                         winnerName: match.opponentName,
                         runnerUpName: state.club.name
                     }
                 ]
             });
             if (isCl) {
                 recordCupFinalContext('cl', 'EHF Champions League', matchSeasonYear, false, match.opponentName);
             } else {
                 const finalEuroKey = isEcl ? 'ecl' : 'el';
                 recordCupFinalContext(finalEuroKey, euroName, matchSeasonYear, false, match.opponentName);
             }
         } else if (match.type === 'ihf_final') {
             const curStoreIhfLoss = useGameStore.getState();
             const ihfLossNotif = {
                 id: Math.random().toString(),
                 type: 'info' as const,
                 category: 'euro' as const,
                 title: 'IHF SUPER GLOBE FINALIST',
                 message: `🥈 IHF Super Globe Runner-Up: Defeated by ${match.opponentName} in the Final. ${match.opponentName} crowned world club champions.`,
                 read: false
             };
             const currentRuns = curStoreIhfLoss.cupRunResults || [];
             curStoreIhfLoss.updateState({
                 notifications: [ihfLossNotif, ...(curStoreIhfLoss.notifications || [])],
                 cupRunResults: [
                     ...currentRuns.filter(r => r.year !== matchSeasonYear || r.id !== 'cwc'),
                     {
                         year: matchSeasonYear,
                         id: 'cwc',
                         nameEn: 'IHF Super Globe',
                         nameDe: 'IHF Super Globe',
                         won: false,
                         exitRound: 'Final',
                         winnerName: match.opponentName,
                         runnerUpName: state.club.name
                     }
                 ]
             });
             recordCupFinalContext('cwc', 'IHF Super Globe', matchSeasonYear, false, match.opponentName);
         }
     }
     
     if (nextMatches.length > 0) {
            setPendingMatches(nextMatches);
            if (newToastToTrigger) {
                setPendingCupToasts(prev => [...prev, newToastToTrigger]);
            }
        } else {
            setPendingMatches([]);
            // Re-calculate the final history state to ensure it is 100% accurate
            if (pendingSeasonResult) {
                const store = useGameStore.getState();
                const history = [...store.history];
                if (history.length > 0) {
                    // Update pendingSeasonResult from the canonical history object
                    pendingSeasonResult.trophiesThisYear = { ...history[history.length - 1].trophiesThisYear };
                    pendingSeasonResult.seasonStats.pos = history[history.length - 1].pos;
                    
                    // Also ensure total trophies are perfectly synced
                    let domTrophies = 0;
                    let intTrophies = 0;
                    let totalTrophies = 0;
                    store.history.forEach(h => {
                        // DOM. TROPHIES: Domestic cups, Supercup, and Tier 1 titles
                        if (h.trophiesThisYear?.dfb) domTrophies++;
                        if (h.trophiesThisYear?.bl) domTrophies++;
                        if (h.trophiesThisYear?.sc) domTrophies++;
                        
                        // INTL. TROPHIES: Euro cups, Euro Supercup, and IHF Superglobe
                        if (h.trophiesThisYear?.cl) intTrophies++;
                        if (h.trophiesThisYear?.el) intTrophies++;
                        if (h.trophiesThisYear?.ecl) intTrophies++;
                        if (h.trophiesThisYear?.cwc) intTrophies++;
                        if (h.trophiesThisYear?.esc) intTrophies++;

                        // Total trophies (all)
                        if (h.trophiesThisYear?.dfb) totalTrophies++;
                        if (h.trophiesThisYear?.reg) totalTrophies++;
                        if (h.trophiesThisYear?.bl) totalTrophies++;
                        if (h.trophiesThisYear?.lower) totalTrophies++;
                        if (h.trophiesThisYear?.sc) totalTrophies++;
                        if (h.trophiesThisYear?.cl) totalTrophies++;
                        if (h.trophiesThisYear?.el) totalTrophies++;
                        if (h.trophiesThisYear?.ecl) totalTrophies++;
                        if (h.trophiesThisYear?.cwc) totalTrophies++;
                        if (h.trophiesThisYear?.esc) totalTrophies++;
                    });
                    
                    store.updateState({
                        totals: {
                            ...store.totals,
                            matches: store.totals?.matches || 0,
                            wins: store.totals?.wins || 0,
                            att: store.totals?.att || 0,
                            domTrophies,
                            intTrophies,
                            trophies: totalTrophies
                        }
                    });
                    const refreshedScore = calculateLiveScore(useGameStore.getState());
                    useGameStore.getState().updateState({ careerScore: refreshedScore });
                    pendingSeasonResult.careerScore = refreshedScore;
                }
            }

            if (winterBreakPending) {
                setWinterBreakPending(false);
                if (!state.midSeasonCrisisTriggered && Math.random() < 0.25) {
                    const crisis = generateMidSeasonCrisis(state);
                    if (crisis) {
                        useGameStore.getState().updateState({ midSeasonCrisisTriggered: true });
                        setActiveEvent(crisis);
                        return;
                    }
                }
                useGameStore.getState().updateState({ winterBreakSeenYear: state.year });
                setShowWinterBreak(true);
                return;
            } else if (newToastToTrigger) {
                setActiveCelebrationToast(newToastToTrigger);
                useGameStore.getState().updateState({
                  notifications: [
                    newToastToTrigger,
                    ...(useGameStore.getState().notifications || []).filter(n => !n.read && n.id !== newToastToTrigger.id)
                  ]
                });
            } else if (pendingCupToasts.length > 0) {
                const nextT = pendingCupToasts[0];
                setPendingCupToasts(prev => prev.slice(1));
                setActiveCelebrationToast(nextT);
                useGameStore.getState().updateState({
                  notifications: [
                    nextT,
                    ...(useGameStore.getState().notifications || []).filter(n => !n.read && n.id !== nextT.id)
                  ]
                });
            } else if (!addedToast && !activeCelebrationToast) {
                if (queuedCupMatches && queuedCupMatches.length > 0) {
                    const nextMatch = queuedCupMatches[0];
                    setQueuedCupMatches(prev => prev.slice(1));
                    setPendingMatches([nextMatch]);
                } else if (queuedEuroMatches && queuedEuroMatches.length > 0) {
                    const nextMatch = queuedEuroMatches[0];
                    setQueuedEuroMatches(prev => prev.slice(1));
                    setPendingMatches([nextMatch]);
                } else if (queuedSuperGlobeMatches && queuedSuperGlobeMatches.length > 0) {
                    const nextMatch = queuedSuperGlobeMatches[0];
                    setQueuedSuperGlobeMatches(prev => prev.slice(1));
                    setPendingMatches([nextMatch]);
                } else if (pendingSeasonResult) {
                    finishSimulation(pendingSeasonResult);
                }
            }
        }
  };
  const financials = calculateClubFinancials(state);
  const rep = Math.min(100, calculateClubReputation(team.baseOvr, team.tier));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-36 sm:pb-0">
      {/* Top Banner */}
      <div className="flex flex-col gap-6">
      <DashboardHeader 
        state={state}
           
        lang={lang} 
        financials={financials}
        onShowTable={() => setShowTable(true)}
        onShowLedger={() => setShowLedger(true)}
        onShowYouth={() => setShowYouth(true)}
        onOpenPhilosophyModal={() => {
          setPhilosophyInitialTab('philosophy');
          setShowPhilosophy(true);
        }}
        onCoachMarket={() => {
          setPhilosophyInitialTab('overview');
          setShowPhilosophy(true);
        }}
        onOpenCoachDossier={() => {
          setPhilosophyInitialTab('overview');
          setShowPhilosophy(true);
        }}
        onOpenSkillsModal={() => setShowSkills(true)}
        onOpenCustomization={() => setShowCustomization(true)}
        onOpenClubProfile={() => setShowClubProfile(true)}
        onShowNewBuild={() => setShowNewBuild(true)}
        onOpenProfile={() => setShowProfile(true)}
        onShowCareerHistory={() => setShowProfile(true)}
        onShowImpact={() => setShowImpact(true)}
        onOpenMoraleModal={() => setShowMorale(true)}
        onOpenShieldsModal={() => setShowShields(true)}
        onOpenOvrModal={() => setShowOvrModal(true)}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start [overflow-anchor:none]">
        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col gap-6 [overflow-anchor:none]">
          <div className="flex flex-col gap-4">
            {/* Taunting the Player: 5-Year Trophy Drought Alert (Tier 1 & trophyDrought > 4) */}
            {state.club.tier === 1 && (state.trophyDrought || 0) > 4 && (
              <div
                onClick={() => setShowBoardExpectations(true)}
                className="bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-rose-500/5 border border-rose-500/40 hover:border-rose-400 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 shadow-[0_0_20px_rgba(244,63,94,0.18)] animate-pulse group active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/25 border border-rose-500/40 text-rose-400 flex items-center justify-center text-sm shrink-0">
                    <i className="fas fa-triangle-exclamation" />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-300 truncate">
                      {lang === 'de' ? `${state.trophyDrought}-Jahre Titelflaute: Fans verlieren Geduld!` : `${state.trophyDrought}-Year Trophy Drought: The fanbase is losing patience.`}
                    </span>
                    <span className="text-[11px] text-zinc-300 truncate">
                      {lang === 'de'
                        ? 'Vorstand & Anhänger fordern dringend Silberware in dieser Saison.'
                        : 'The boardroom and fanbase demand immediate silverware.'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/25 border border-rose-500/40 px-2.5 py-1 rounded-full shrink-0 group-hover:bg-rose-500 group-hover:text-white transition">
                  {lang === 'de' ? 'Vorgaben →' : 'Board →'}
                </span>
              </div>
            )}

            {/* Quick Dynasty Metrics Strip */}
            <div className="bg-gradient-to-b from-white/[0.045] to-white/[0.015] bg-[#121319] p-3 rounded-2xl border border-white/[0.08] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-gradient-to-b from-white/[0.03] to-transparent bg-[#161722] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border border-white/[0.05]">
                <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                  <i className="fas fa-check text-[#10b981] text-[10px]"></i> Wins
                </div>
                <div className="text-base sm:text-lg font-bold text-white tracking-tight tabular-nums">{(state.totals?.wins || 0).toLocaleString()}</div>
              </div>
              <div onClick={() => setTrophyInfoModal('dom')} className="bg-gradient-to-b from-white/[0.03] to-transparent bg-[#161722] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border border-white/[0.05] cursor-pointer hover:border-amber-500/30 transition active:scale-95 group">
                <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 group-hover:text-amber-300">
                  <i className="fas fa-trophy text-[#facc15] text-[10px]"></i> Dom. Cups
                </div>
                <div className="text-base sm:text-lg font-bold text-[#facc15] tracking-tight tabular-nums">{(state.totals?.domTrophies || 0).toLocaleString()}</div>
              </div>
              <div onClick={() => setTrophyInfoModal('intl')} className="bg-gradient-to-b from-white/[0.03] to-transparent bg-[#161722] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border border-white/[0.05] cursor-pointer hover:border-sky-500/30 transition active:scale-95 group">
                <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 group-hover:text-sky-300">
                  <i className="fas fa-globe text-[#38bdf8] text-[10px]"></i> Intl. Cups
                </div>
                <div className="text-base sm:text-lg font-bold text-[#38bdf8] tracking-tight tabular-nums">{(state.totals?.intTrophies || 0).toLocaleString()}</div>
              </div>
              <div 
                onClick={() => setShowArenaOverview(true)} 
                title="Inspect Arena Overview & 5-Year Attendance"
                className="bg-gradient-to-b from-white/[0.03] to-transparent bg-[#161722] rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border border-white/[0.05] cursor-pointer hover:border-sky-400/40 transition active:scale-95 group"
              >
                <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 group-hover:text-sky-300 transition-colors">
                  <i className="fas fa-building text-sky-400 text-[10px] group-hover:scale-110 transition-transform"></i> Arena
                </div>
                <div className="text-base sm:text-lg font-bold text-white tracking-tight tabular-nums group-hover:text-sky-200 transition-colors">{(state.club?.stadium || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
          <ActionPanel 
            isFirstHalf={state.year > winterBreakSeenYear}
            state={state}
          
            lang={lang}
            onSimulate={handleSimulate}
            onOpenJobMarket={() => setShowJobMarket(true)}
            onShowStadium={() => setShowStadium(true)}
            onShowArenaOverview={() => setShowArenaOverview(true)}
            onShowNewBuild={() => setShowNewBuild(true)}
            onOpenPhilosophy={() => {
              setPhilosophyInitialTab('philosophy');
              setShowPhilosophy(true);
            }}
            onOpenSkills={() => setShowSkills(true)}
            onShowTransfers={() => setShowTransfers(true)}
            onShowLoan={() => setShowLoan(true)}
            onShowMarketing={() => setShowMarketing(true)}
            onShowIPO={() => setShowIPO(true)}
            onUpgradeAcademy={() => setShowAcademy(true)}
            onUpgradeMedical={() => setShowMedical(true)}
            onShowYouth={() => setShowYouth(true)}
            onTeamBonding={() => {
              if ((state.teamBondingThisSeason || 0) >= 1) {
                useGameStore.getState().updateState({
                  notifications: [
                    { id: Math.random().toString(), type: 'error', message: 'Team Bonding is only allowed once per season.', read: false },
                    ...(useGameStore.getState().notifications || [])
                  ]
                });
              } else {
                setShowTeamBonding(true);
              }
            }}
            onShowProfile={() => setShowProfile(true)}
            onShowImpact={() => setShowImpact(true)}
            onOpenRoadmap={() => setShowRoadmap(true)}
            onOpenMoraleModal={() => setShowImpact(true)}
            onRetire={() => useGameStore.getState().endCareer()}
            onOpenInfo={() => setShowPrepInfo(true)}
          />
        </div>

        {/* Right Column: History/Standings */}
        <div className="lg:col-span-7 block">
          <SeasonHistoryTable state={state}
           lang={lang} />
        </div>
      </div>
      <AnimatePresence>
      {showTable && (
        <LeagueTableModal key="modal-table" state={state}
          
          clubsDb={clubsDb}
          lang={lang}
          onClose={() => setShowTable(false)}
        />
      )}
      {showLedger && (
        <LedgerModal key="modal-ledger" state={state}
          
          lang={lang}
          onClose={() => setShowLedger(false)}
        />
      )}
      {showSkills && (
        <ManagerSkillsModal key="modal-skills" state={state}
          
          lang={lang}
          onClose={() => setShowSkills(false)}
          onUnlockSkill={(skillId) => {
            stateStore.unlockManagerSkill(skillId);
          }}
        />
      )}
      {showProfile && (
        <ManagerProfileModal key="modal-profile" state={state}
          
          lang={lang}
          onClose={() => setShowProfile(false)}
          onOpenImpact={() => {
            setShowProfile(false);
            setShowImpact(true);
            }}
        />
      )}
      {(showJobMarket || showInboundOffers) && (
        <JobMarketModal key="modal-jobs" isOpen={showJobMarket || showInboundOffers}
          onClose={() => {
            if (showJobMarket) setShowJobMarket(false);
            if (showInboundOffers) {
                setShowInboundOffers(false);
                if (state.year > lastSeenYear) {
                   setIsSeasonalBoardTransition(true);
                   setShowBoardExpectations(true);
                   setLastSeenYear(state.year);
                }
            }
          }}
          state={state}
          
          clubsDb={clubsDb}
          lang={lang}
          onAcceptOffer={(c) => {
            const cleanContext = getClubHistoricContext(c.name, c.tier, false, c.country || 'GER', c);
            const enrichedClub = {
              ...c,
              historicContext: cleanContext,
              context: cleanContext
            };
            setSeasonalJobOffers(null);
            setPreSeasonSupercupQueue([]);
            stateStore.acceptJobOffer(enrichedClub);
            setShowJobMarket(false);
            setShowInboundOffers(false);
            setWelcomeClub(enrichedClub);
            setIsSeasonalBoardTransition(true);
            setShowBoardExpectations(true);
          }}
          generateOffers={(st, db, count) => {
            if (!st.isSacked && seasonalJobOffers && seasonalJobOffers.year === st.year && seasonalJobOffers.offers.length > 0 && !seasonalJobOffers.offers.some((o: any) => o.id === st.club?.id)) {
              return seasonalJobOffers.offers;
            }

            const userCountry = normalizeCountry(st.club?.country || 'GER');
            const rep = st.reputation || 0;
            
            // Check if manager has won Champions League or continental silverware
            const hasWonCL = Boolean(
              (st.clWins || 0) > 0 ||
              (Array.isArray(st.trophies)
                ? st.trophies.some((t: any) => typeof t === 'string' && (t.toLowerCase().includes('champion') || t.toLowerCase().includes('cl')))
                : st.trophies && (((st.trophies as any).cl || 0) > 0 || ((st.trophies as any).ehfChampionsLeague || 0) > 0 || ((st.trophies as any).championsCup || 0) > 0)) ||
              (st.trophyCabinet && Array.isArray(st.trophyCabinet) && st.trophyCabinet.some((t: any) => t.type === 'cl' || t.type === 'championsLeague' || t.name?.toLowerCase().includes('champion') || t.name?.toLowerCase().includes('european'))) ||
              (st.history && st.history.some((h: any) => h.clWon || h.trophiesThisYear?.cl || (Array.isArray(h.trophies) ? h.trophies.some((t: any) => typeof t === 'string' && (t.toLowerCase().includes('champion') || t.toLowerCase().includes('cl'))) : h.trophies?.cl)))
            );
            
            const hasWonLeague = Boolean(
              (Array.isArray(st.trophies)
                ? st.trophies.some((t: any) => typeof t === 'string' && (t.toLowerCase().includes('league') || t.toLowerCase().includes('bundesliga')))
                : st.trophies && (((st.trophies as any).bl || 0) > 0 || ((st.trophies as any).league || 0) > 0)) ||
              (st.history && st.history.some((h: any) => ((h.pos === 1 || h.position === 1) && h.tier === 1) || h.trophiesThisYear?.bl)) ||
              (st.consecutiveTitles || 0) > 0
            );

            // A top manager has high reputation, CL triumph, consecutive titles, or top-flight pedigree
            const isTopManager = rep >= 75 || hasWonCL || (hasWonLeague && rep >= 65) || ((st.club?.tier || 1) === 1 && rep >= 70);

            // Helper to detect Fallen Giants across lower tiers (Tier >= 2)
            const isFallenGiantCandidate = (c: any) => {
              if (c.tier < 2 || isReserveClub(c.name)) return false;
              if (c.isInsolventGiant) return true;
              if (c.originalStartLeague === 1) return true;
              if ((c.stadium || 0) >= 3800 || (c.fanBase || 0) >= 3200) return true;
              if (c.baseOvr >= 67 && c.tier >= 2) return true;
              const hist = (c.historicContext || c.context || '').toLowerCase();
              const keywords = [
                'former champion', 'glory', 'tradition', 'european', 'bundesliga',
                'top-flight', 'superpower', 'legend', 'historic', 'titans', 'heritage',
                'dynasty', 'champions', 'powerhouse', 'relegat', 'fallen'
              ];
              return keywords.some(k => hist.includes(k));
            };

            const isLowerTierRescue = (c: any) => {
              return c.tier >= 3 && !isFallenGiantCandidate(c);
            };

            const getNarrative = (c: any, isFallenGiant: boolean, isRescue: boolean) => {
              if (isFallenGiant) {
                return `[FALLEN GIANT REBUILD] A historic titan currently languishing in Tier ${c.tier}. The board and loyal supporters plead for a world-class manager to rebuild their fallen empire and orchestrate an epic return to top-flight glory.`;
              }
              if (isRescue) {
                return `[LOWER-TIER RESCUE] A passionate grassroots club in Tier ${c.tier}. They dream of an elite tactician stepping down to rescue their season and build a sustainable dynasty from the ground up.`;
              }
              const historicNarrative = getClubHistoricContext(c.name, c.tier, false, c.country || 'GER', c);
              if (historicNarrative && !historicNarrative.includes('Top-flight club') && !historicNarrative.includes('Ambitious second division') && !historicNarrative.includes('Professional third-tier')) {
                return historicNarrative;
              }
              if (c.tier === 1 && c.baseOvr >= 80) return "The board demands absolute domestic dominance and immediate European silverware.";
              if (c.tier === 1 && c.baseOvr < 75) return "We are fighting for top-flight survival. We need an elite tactical mastermind to save us.";
              if (c.tier === 2 && c.baseOvr >= 75) return "We have a squad built for the top flight. Immediate promotion is expected.";
              if (c.tier >= 3) return "A historic club seeking a complete cultural rebuild. Will you lead us back to glory?";
              return historicNarrative || "We are looking for stability, tactical identity, and steady progression up the table.";
            };

            // Exclude current club
            const eligibleClubs = [...db].filter(c => c.id !== st.club?.id);

            // Separate into domestic and international pools
            const domesticClubs = eligibleClubs.filter(c => normalizeCountry(c.country || 'GER') === userCountry);
            const intlClubs = eligibleClubs.filter(c => normalizeCountry(c.country || 'GER') !== userCountry);

            // Categorized sub-pools
            const domTier1 = domesticClubs.filter(c => c.tier === 1).sort((a, b) => b.baseOvr - a.baseOvr);
            const intlTier1 = intlClubs.filter(c => c.tier === 1).sort((a, b) => b.baseOvr - a.baseOvr);

            const domFallenGiants = domesticClubs.filter(c => isFallenGiantCandidate(c)).sort((a, b) => b.baseOvr - a.baseOvr);
            const intlFallenGiants = intlClubs.filter(c => isFallenGiantCandidate(c)).sort((a, b) => b.baseOvr - a.baseOvr);

            const domRescues = domesticClubs.filter(c => isLowerTierRescue(c)).sort((a, b) => a.baseOvr - b.baseOvr);
            const intlRescues = intlClubs.filter(c => isLowerTierRescue(c)).sort((a, b) => a.baseOvr - b.baseOvr);

            const selectedOffers: any[] = [];
            const addedIds = new Set<string>();

            const addOffer = (club: any, category?: 'fallen' | 'rescue' | 'elite') => {
              if (!club || addedIds.has(club.id)) return false;
              addedIds.add(club.id);
              const isFG = category === 'fallen' || isFallenGiantCandidate(club);
              const isR = category === 'rescue' || isLowerTierRescue(club);
              selectedOffers.push({
                ...club,
                isFallenGiant: isFG,
                isRescueProject: isR,
                offerBadge: isFG ? 'Fallen Giant Rebuild' : isR ? 'Lower-Tier Rescue' : club.tier === 1 ? 'Top-Flight Elite' : `Tier ${club.tier} Project`,
                narrative: getNarrative(club, isFG, isR)
              });
              return true;
            };

            if (isTopManager) {
              // TOP MANAGER REBUILD & ACCESS GUARANTEE:
              // 1. Top managers ALWAYS have access to Tier 1 elite offers (domestic & international)
              // 2. Top managers are ALSO given Fallen Giants (Tier 2-4) to drop down and rebuild!
              // 3. Top managers are ALSO offered grassroots/lower-tier rescues for romantic rebuilds!

              // 1. Domestic Tier 1 Elite (1-2 clubs)
              if (domTier1.length > 0) addOffer(domTier1[Math.floor(Math.random() * Math.min(3, domTier1.length))], 'elite');
              if (domTier1.length > 1) {
                const secondDomT1 = domTier1.find(c => !addedIds.has(c.id));
                if (secondDomT1) addOffer(secondDomT1, 'elite');
              }

              // 2. Domestic Fallen Giant (Tier 2-4 sleeping giant)
              if (domFallenGiants.length > 0) {
                const fg = domFallenGiants[Math.floor(Math.random() * domFallenGiants.length)];
                addOffer(fg, 'fallen');
              } else if (domRescues.length > 0) {
                addOffer(domRescues[0], 'rescue');
              }

              // 3. Domestic Lower-Tier Rescue (Tier 3-4 grassroots club)
              const remainingDomLower = domesticClubs.filter(c => c.tier >= 3 && !addedIds.has(c.id));
              if (remainingDomLower.length > 0) {
                addOffer(remainingDomLower[Math.floor(Math.random() * remainingDomLower.length)], 'rescue');
              }

              // 4. International Tier 1 Powerhouses (1-2 clubs)
              if (intlTier1.length > 0) addOffer(intlTier1[Math.floor(Math.random() * Math.min(4, intlTier1.length))], 'elite');
              if (intlTier1.length > 1) {
                const secondIntlT1 = intlTier1.find(c => !addedIds.has(c.id));
                if (secondIntlT1) addOffer(secondIntlT1, 'elite');
              }

              // 5. International Fallen Giant (Tier 2-3 continental sleeping giant)
              if (intlFallenGiants.length > 0) {
                const intlFg = intlFallenGiants[Math.floor(Math.random() * intlFallenGiants.length)];
                addOffer(intlFg, 'fallen');
              } else if (intlRescues.length > 0) {
                addOffer(intlRescues[0], 'rescue');
              }
            } else {
              // Standard/Emerging Manager:
              let expectedOvr = 30 + (rep * 0.6);
              if (st.isSacked) expectedOvr -= 12;

              const scoredDomestic = domesticClubs.map(c => ({
                ...c,
                score: Math.abs(c.baseOvr - expectedOvr) + Math.random() * 10
              })).sort((a, b) => a.score - b.score);

              const scoredIntl = intlClubs.map(c => ({
                ...c,
                score: Math.abs(c.baseOvr - expectedOvr) + Math.random() * 10
              })).sort((a, b) => a.score - b.score);

              // 2-3 domestic offers
              scoredDomestic.slice(0, 3).forEach(c => addOffer(c));
              // 2-3 intl offers
              scoredIntl.slice(0, 3).forEach(c => addOffer(c));

              // Offer a domestic fallen giant if available
              if (domFallenGiants.length > 0 && Math.random() > 0.4) {
                addOffer(domFallenGiants[0], 'fallen');
              }
            }

            // Fill up remaining slots to guarantee a rich selection of at least count (default 6-8) offers
            const targetCount = Math.max(count, 6);
            if (selectedOffers.length < targetCount) {
              const remaining = eligibleClubs
                .filter(c => !addedIds.has(c.id))
                .sort(() => 0.5 - Math.random());
              for (const c of remaining) {
                if (selectedOffers.length >= targetCount) break;
                addOffer(c);
              }
            }

            if (!st.isSacked) {
              setSeasonalJobOffers({ year: st.year, offers: selectedOffers });
            }

            return selectedOffers;
          }}
          onOpenTransfers={() => setShowTransfers(true)}
        />
      )}
      {showRoadmap && (
        <BoardRoadmapModal
          key="modal-roadmap"
          isOpen={showRoadmap}
          onClose={() => setShowRoadmap(false)}
          state={state}
          lang={lang}
        />
      )}
      {showBoardExpectations && !seasonResultData && !pendingSeasonResult && (
        <BoardExpectationModal key="modal-board" state={state} welcomeClub={welcomeClub}
           onClose={() => { setWelcomeClub(null); handleCloseBoardExpectations(); }} />
      )}
      {showCustomization && (
        <ClubCustomizationModal
          key="modal-customization"
          state={state}
          lang={lang}
          onSave={(newName, newColor, newLogo, newNarrative) => {
            const currentStore = useGameStore.getState();
            const updatedClub = {
              ...currentStore.club,
              name: newName.trim() || currentStore.club.name,
              color: newColor || currentStore.club.color,
              logo: newLogo.trim() || undefined,
              narrative: newNarrative.trim() || undefined,
              historicContext: newNarrative.trim() || currentStore.club.historicContext,
              context: newNarrative.trim() || currentStore.club.context,
            };
            const updatedWorldClubs = {
              ...(currentStore.worldClubs || {}),
              ...(updatedClub.id !== undefined ? { [updatedClub.id]: updatedClub } : {}),
            };
            currentStore.updateState({
              club: updatedClub,
              worldClubs: updatedWorldClubs,
            });
          }}
          onClose={() => setShowCustomization(false)}
        />
      )}
      {showConfirmReset && (
        <ConfirmResetModal
          key="modal-confirm-reset"
          lang={lang}
          onConfirm={() => {
            setShowConfirmReset(false);
            useGameStore.getState().resetGame();
          }}
          onClose={() => setShowConfirmReset(false)}
        />
      )}
      {showLeaderboard && (
        <LeaderboardModal
          key="modal-leaderboard"
          state={state}
          lang={lang}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
      {showImpact && (
        <ClubImpactModal key="modal-impact" state={state}
          lang={lang}
          onClose={() => setShowImpact(false)}
          onOpenTeamBonding={() => {
            setShowImpact(false);
            setShowTeamBonding(true);
            }}
          onOpenClubProfile={() => {
            setShowImpact(false);
            setShowClubProfile(true);
          }}
        />
      )}
      {showOvrModal && (
        <OvrModal
          key="modal-ovr"
          state={state}
          lang={lang}
          onClose={() => setShowOvrModal(false)}
        />
      )}
      {preSeasonSupercupQueue.length > 0 && pendingMatches.length === 0 && (
        <KeyMatchModal
          key={`preseason-supercup-${preSeasonSupercupQueue[0].type}-${preSeasonSupercupQueue.length}`}
          matchData={preSeasonSupercupQueue[0]}
          onResolve={handleResolvePreSeasonSupercup}
          hasTacticalGenius={(state.managerSkills || []).includes('tactical_mastermind')}
        />
      )}
      {pendingMatches.length > 0 && (
        <KeyMatchModal 
            key={`match-${pendingMatches[0].type}-${pendingMatches.length}`}
            matchData={pendingMatches[0]} 
            onResolve={handleResolveMatch}
            hasTacticalGenius={(state.managerSkills || []).includes('tactical_mastermind')}
        />
      )}
      {activeCelebrationToast && (
        <AchievementModal 
            key="modal-achievement" 
            state={state} 
            toast={activeCelebrationToast} 
            onClose={handleCloseCelebrationToast}
        />
      )}

      {showSimulatingOverlay && (
        <SimulatingOverlay 
          key="modal-simulating-overlay"
          lang={lang} 
          phase={simulationPhase}
          totalMatchdays={totalMatchdaysForOverlay} 
          onComplete={handleSimulateSeasonComplete} 
          state={state}
        />
      )}

      {state.bankruptcyPending && pendingMatches.length === 0 && !isSimulating && !showSimulatingOverlay && !activeCelebrationToast && (!pendingSeasonResult || stagedSeasonResultData || seasonResultData) && (
        <BankruptcyModal key="modal-bankruptcy" />
      )}
      {performanceDealResult && !state.bankruptcyPending && (
        <PerformanceDealModal key="modal-performance-deal" state={state} result={performanceDealResult} onClose={() => setPerformanceDealResult(null)} />
      )}
      {statusChange && stagedSeasonResultData && !state.bankruptcyPending && !performanceDealResult && (
        <StatusChangeModal 
          key="modal-status-change" 
          type={statusChange}
          state={state}
          mappedData={stagedSeasonResultData}
          lang={lang}
          onContinue={() => {
            setSeasonResultData(stagedSeasonResultData);
            setStatusChange(null);
            setStagedSeasonResultData(null);
          }}
        />
      )}
      
      {seasonResultData && !statusChange && !state.bankruptcyPending && !performanceDealResult && (
        <SeasonFinishModal key="modal-season-finish" state={state}
          
          clubsDb={clubsDb} seasonData={seasonResultData}
          lang={lang}
          onShowTable={() => {
            setShowTable(true);
          }}
          onClose={handleCloseSeasonFinish}
          onShowProfile={() => {
            setShowProfile(true);
          }}
        />
      )}
      {activeEvent && (
        <ActiveEventModal key="modal-active-event" event={activeEvent}
          lang={lang}
          onResolve={handleResolveActiveEvent}
        />
      )}
      {showWinterBreak && (
        <WinterBreakModal 
           key="modal-winter-break"
           state={state} 
           lang={lang} 
           cupQualifiedForSf={cupQualifiedForSf}
           euroQualifiedForSf={euroQualifiedForSf}
           isSubModalOpen={Boolean(
             showTransfers || showTeamBonding || showPhilosophy || gachaRevealData || showYouth ||
             showTable || showLoan || showMarketing || showIPO || showAcademy || showMedical ||
             showStadium || showArenaOverview || showNewBuild || showLedger || showSkills ||
             showProfile || showImpact || showOvrModal || showMorale || showShields ||
             showLeaderboard || showClubProfile || showCustomization || showRoadmap
           )}
           onReturnToDashboard={() => {
               setShowWinterBreak(false);
           }}
           onContinue={() => {
               setShowWinterBreak(false);
               isSimulatingRef.current = true;
               setSimulationPhase("second_half");
               setShowSimulatingOverlay(true);
           }}
           onTeamBonding={() => {
               // setShowWinterBreak(false); // DO NOT CLOSE
               setShowTeamBonding(true);
           }}
           onRevampSystem={() => {
               // setShowWinterBreak(false); // DO NOT CLOSE
               setShowPhilosophy(true);
           }}
           onMakeTransfers={() => {
                if (winterTransfersOpenedYear !== state.year) {
                    useGameStore.getState().updateState({ 
                        winterTransfersOpenedYear: state.year
                    });
                }
               setShowTransfers(true);
           }}
        />
      )}
      {showTransfers && (
        <TransferModal key="modal-transfers" state={state}
          
          lang={lang}
          financials={calculateClubFinancials(state)}
          creditLimit={creditLimit}
          actionCosts={{
            bidReg: Math.round(getLeagueScaledVal(state.club.tier, 500000, state.club.country) * Math.max(0.5, (state.club.baseOvr || 60) / 75) * ((state.managerSkills || []).includes('rosinenpicker') ? 0.8 : 1) * (state.tactic === '7v6 Empty Net' && (state.club.tier || 1) > 1 ? 0.9 : 1)),
            bidKey: Math.round(getLeagueScaledVal(state.club.tier, 1500000, state.club.country) * Math.max(0.5, (state.club.baseOvr || 60) / 75) * ((state.managerSkills || []).includes('rosinenpicker') ? 0.8 : 1) * (state.tactic === '7v6 Empty Net' && (state.club.tier || 1) > 1 ? 0.9 : 1)),
            bidSuperstar: Math.round(getLeagueScaledVal(state.club.tier, 3000000, state.club.country) * Math.max(0.5, (state.club.baseOvr || 60) / 75) * ((state.managerSkills || []).includes('rosinenpicker') ? 0.8 : 1)),
            bidVeteranRinger: Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country) * ((state.managerSkills || []).includes('rosinenpicker') ? 0.8 : 1))
          }}
          onSignVeteranRinger={() => {
             const ringerFee = Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country) * ((state.managerSkills || []).includes('rosinenpicker') ? 0.8 : 1));
             const res = useGameStore.getState().signVeteranRinger(ringerFee);
             if (res.success && res.gain) {
                 setGachaRevealData({
                     type: 'key',
                     cost: res.fee || ringerFee,
                     gain: res.gain,
                     ovr: useGameStore.getState().club.baseOvr || ((state.club.baseOvr || 60) + res.gain),
                     name: `VETERAN RINGER: ${res.name}`
                 });
             }
          }}
          onBidReg={() => {
            const regTransfers = state.regTransfersThisSeason || 0;
            const winterBonusReg = state.winterTransfersOpenedYear === state.year ? 3 : 0;
            const limitReg = ((state.managerSkills || []).includes('scouting_network') ? 5 : 3) + winterBonusReg;
            if (regTransfers >= limitReg) return;
            const currentSquad = state.club.squadSize || 18;
            if (currentSquad >= 22) return;

            if (Math.random() < 0.25) {
                // Transfer rejected!
                useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: 'info', message: 'Transfer Collapsed. The player rejected our contract offer.', read: false }, ...(useGameStore.getState().notifications || [])] });
                return;
            }
            let gain = Math.random() < 0.2 ? -1 : Math.random() < 0.7 ? 1 : 2;
            if ((state.managerSkills || []).includes('rosinenpicker')) gain += 1;
            const cost = Math.round(getLeagueScaledVal(state.club.tier, 500000, state.club.country) * Math.max(0.5, (state.club.baseOvr || 60) / 75) * ((state.managerSkills || []).includes('rosinenpicker') ? 0.8 : 1) * (state.tactic === '7v6 Empty Net' && (state.club.tier || 1) > 1 ? 0.9 : 1));
            stateStore.buyPlayer(cost, gain, 1, 'reg');
            const impact = gain > 0 ? '+' + gain : gain;
            useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: gain > 0 ? 'success' : 'error', message: `New Signing Arrives for €${(cost/1000000).toFixed(2)}M. Team OVR effect: ${impact}`, read: false }, ...(useGameStore.getState().notifications || [])] });
          }}
          onBidKey={() => {
             const keyTransfers = state.keyTransfersThisSeason || 0;
             const winterBonusKey = state.winterTransfersOpenedYear === state.year ? 1 : 0;
             const limitKey = ((state.managerSkills || []).includes('star_magnet') ? 3 : 2) + winterBonusKey;
             if (keyTransfers >= limitKey) return;
             const currentSquad = state.club.squadSize || 18;
             if (currentSquad >= 22) return;

             if (Math.random() < 0.3) {
                 useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: 'info', message: 'Transfer Collapsed. The rival club refused to sell their key player.', read: false }, ...(useGameStore.getState().notifications || [])] });
                 return;
             }
             let gain = Math.random() < 0.2 ? -1 : Math.random() < 0.7 ? 2 : Math.random() < 0.9 ? 3 : 4;
             if ((state.managerSkills || []).includes('rosinenpicker')) gain += 1;
             const cost = Math.round(getLeagueScaledVal(state.club.tier, 1500000, state.club.country) * Math.max(0.5, (state.club.baseOvr || 60) / 75) * ((state.managerSkills || []).includes('rosinenpicker') ? 0.8 : 1) * (state.tactic === '7v6 Empty Net' && (state.club.tier || 1) > 1 ? 0.9 : 1));
             stateStore.buyPlayer(cost, gain, 1, 'key');
             if (gain >= 3) {
                 setGachaRevealData({ type: 'key', cost, gain, ovr: useGameStore.getState().club.baseOvr || ((state.club.baseOvr || 60) + gain), name: 'KEY SIGNING' });
             } else {
                 const impact = gain > 0 ? '+' + gain : gain;
                 useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: gain > 0 ? 'success' : 'error', message: `Key Signing Arrives for €${(cost/1000000).toFixed(2)}M. Team OVR effect: ${impact}`, read: false }, ...(useGameStore.getState().notifications || [])] });
             }
          }}
          onSuperstarTransfer={() => {
             if ((state.galacticosThisSeason || 0) >= 1 || (state.club.squadSize || 18) >= 22) return;
             const cost = Math.round(getLeagueScaledVal(state.club.tier, 3000000, state.club.country) * Math.max(0.5, (state.club.baseOvr || 60) / 75) * ((state.managerSkills || []).includes('rosinenpicker') ? 0.8 : 1));
             if (state.budget + creditLimit < cost) return;
             const gain = 3;
             stateStore.buyPlayer(cost, gain, 1, 'superstar');
             const finalOvr = useGameStore.getState().club.baseOvr || Math.min(100, (state.club.baseOvr || 60) + gain);
             setGachaRevealData({ type: 'superstar', cost, gain, ovr: finalOvr, name: 'WORLD CLASS TALENT' });
          }}
          onLoanPlayer={() => {
            if ((state.loansThisSeason || 0) >= 2 || (state.club.squadSize || 18) >= 22) return;
            if (Math.random() < 0.15) {
                useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: 'info', message: 'Loan Failed. The parent club decided to keep the player.', read: false }, ...(useGameStore.getState().notifications || [])] });
                return;
            }
            const loanCost = 0; // Free upfront loan fee (adds +2% wage contribution in calculateClubFinancials)
            const gain = Math.random() < 0.25 ? -1 : Math.random() < 0.75 ? 1 : 2;
            stateStore.buyPlayer(loanCost, gain, 1, 'loan'); 
            const impact = gain > 0 ? '+' + gain : gain;
            useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: gain > 0 ? 'success' : 'error', message: `Loan Deal Secured! Team OVR effect: ${impact}`, read: false }, ...(useGameStore.getState().notifications || [])] });
          }}
          onSellBench={() => {
             if ((state.squadSalesThisSeason || 0) >= 3 || (state.club.squadSize || 18) <= 13) return;
             const isUnderRestructuring = (state.budget || 0) < 0;
             if (!isUnderRestructuring && Math.random() < 0.15) {
                 useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: 'info', message: 'Sale Collapsed. No club matched our valuation.', read: false }, ...(useGameStore.getState().notifications || [])] });
                 return;
             }
             const ovrRatio = (state.club.baseOvr || 60) / 75;
             const exponentialValue = Math.pow(ovrRatio, 2);
             const sellValue = Math.round(getLeagueScaledVal(state.club.tier, 125000, state.club.country) * Math.max(0.5, exponentialValue));
             const loss = Math.random() < 0.5 ? 0 : -1;
             stateStore.buyPlayer(-sellValue, loss, -1, 'sell');
             const message = isUnderRestructuring
               ? `Liquid Buyer Activated: 1. HBL/Top-tier club stepped in to purchase bench player for €${(sellValue/1000000).toFixed(2)}M and absorb wages! Team OVR effect: ${loss}`
               : `Bench Player Sold for €${(sellValue/1000000).toFixed(2)}M. Team OVR effect: ${loss}`;
             useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: 'info', message, read: false }, ...(useGameStore.getState().notifications || [])] });
          }}
          onSellStarter={() => {
             if ((state.squadSalesThisSeason || 0) >= 3 || (state.club.squadSize || 18) <= 13) return;
             const isUnderRestructuring = (state.budget || 0) < 0;
             if (!isUnderRestructuring && Math.random() < 0.2) {
                 useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: 'info', message: 'Sale Collapsed. The player refused the contract from the buying club.', read: false }, ...(useGameStore.getState().notifications || [])] });
                 return;
             }
             const ovrRatio = (state.club.baseOvr || 60) / 75;
             const exponentialValue = Math.pow(ovrRatio, 2.5); // Starters scale massively at high OVR
             const sellValue = Math.round(getLeagueScaledVal(state.club.tier, 350000, state.club.country) * Math.max(0.5, exponentialValue));
             const loss = Math.random() < 0.5 ? -2 : -3;
             stateStore.buyPlayer(-sellValue, loss, -1, 'sell');
             const message = isUnderRestructuring
               ? `Liquid Buyer Activated: Top-tier club stepped in to purchase starter for €${(sellValue/1000000).toFixed(2)}M and absorb wages! Team OVR effect: ${loss}`
               : `Starter Sold for €${(sellValue/1000000).toFixed(2)}M. Team OVR effect: ${loss}`;
             useGameStore.getState().updateState({ notifications: [{ id: Math.random().toString(), type: 'info', message, read: false }, ...(useGameStore.getState().notifications || [])] });
          }}
          onTerminateContractMutual={() => {
             stateStore.terminateContractMutual();
          }}
          onPullYouth={(prospectId?: string) => {
             useGameStore.getState().pullYouthPlayer(prospectId);
          }}
          onOpenYouth={() => {
             setShowTransfers(false);
             setShowYouth(true);
          }}
          onClose={() => setShowTransfers(false)}
        />
      )}
      {showLoan && (
        <LoanModal
          key="modal-loan"
          isOpen={showLoan}
          state={state}
          lang={lang}
          onClose={() => setShowLoan(false)}
        />
      )}
      {showMarketing && (
        <MarketingPRModal
          key="modal-marketing"
          isOpen={showMarketing}
          state={state}
          lang={lang}
          onClose={() => setShowMarketing(false)}
        />
      )}
      {showIPO && (
        <IPOModal
          key="modal-ipo"
          isOpen={showIPO}
          state={state}
          onClose={() => setShowIPO(false)}
        />
      )}
      {showYouth && (
        <YouthModal key="modal-youth" state={state}
          lang={lang}
          actionCost={Math.round(getLeagueScaledVal(state.club.tier, 15000, state.club.country))}
          financials={calculateClubFinancials(state)}
          canAfford={state.budget + creditLimit >= Math.round(getLeagueScaledVal(state.club.tier, 15000, state.club.country))}
          creditLimit={creditLimit}
          onRecruitYouth={(customCost?: number, customProspect?: any) => {
            const defaultCost = Math.round(getLeagueScaledVal(state.club.tier, 15000, state.club.country));
            const cost = typeof customCost === 'number' ? customCost : defaultCost;
            const res = stateStore.recruitYouth(cost, customProspect);
            if (!res || !res.success) {
              return res || { success: false, message: 'Recruitment failed' };
            }
            const updatedPipeline = useGameStore.getState().youthPipeline || [];
            const newest = res.prospect || updatedPipeline[updatedPipeline.length - 1];
            if (newest) {
                if (newest.boost >= 3 || newest.type === 'generational') {
                    setGachaRevealData({
                        type: newest.type === 'generational' ? 'superstar' : newest.type === 'top_prospect' ? 'key' : 'youth',
                        cost: cost,
                        gain: newest.boost,
                        ovr: state.club.baseOvr || 60,
                        name: newest.name
                    });
                }
            }
            return res;
          }}
          protectionCost={Math.round(getLeagueScaledVal(state.club.tier, 35000, state.club.country))}
          onProtectYouth={(id) => {
             const cost = Math.round(getLeagueScaledVal(state.club.tier, 35000, state.club.country));
             stateStore.protectYouth(id, cost);
          }}
          onGachaReveal={setGachaRevealData}
          onClose={() => setShowYouth(false)}
        />
      )}
      {showNewBuild && (
        <NewBuildModal key="modal-newbuild" creditLimit={creditLimit} 
          state={state}
           
          lang={lang} 
          onClose={() => setShowNewBuild(false)} 
          onExpand={(cost, seats, opt, financing) => {
            const country = state.club.country || 'GER';
            const maxCap = getPinnacleArenaCapacity(country);
            if ((state.stadiumExpandedThisSeason || 0) >= 1) {
               useGameStore.getState().updateState({
                  notifications: [{ id: Math.random().toString(), type: 'error', message: 'Only 1 arena expansion or construction project is permitted per season.', read: false }, ...(state.notifications || [])]
               });
               return;
            }
            if (isReserveClub(state.club.name) && seats > 1500) {
               useGameStore.getState().updateState({
                  notifications: [{ id: Math.random().toString(), type: 'error', message: 'Reserve clubs cannot expand arena capacity beyond 1,500 seats.', read: false }, ...(state.notifications || [])]
               });
               return;
            }
            if ((state.club.stadium || 0) >= maxCap) {
               useGameStore.getState().updateState({
                  notifications: [{ id: Math.random().toString(), type: 'error', message: `Maximum pinnacle capacity (${formatNum(maxCap)} seats in ${country}) already achieved. No further commissioning permitted.`, read: false }, ...(state.notifications || [])]
               });
               return;
            }
            if ((state.club.stadium || 0) >= seats) {
               useGameStore.getState().updateState({
                  notifications: [{ id: Math.random().toString(), type: 'error', message: 'Your current arena is already larger than this project!', read: false }, ...(state.notifications || [])]
               });
               return;
            }
            const prevCap = state.club.stadium || 2000;

            if (financing) {
              useGameStore.getState().structureArenaFinancing(
                financing.downPayment,
                financing.principal,
                financing.termYears,
                seats,
                opt,
                financing.annualPayment,
                financing.monthlyPayment,
                financing.totalRepayment
              );
            } else {
              state.expandArena(cost, opt?.fanBoost || 0, seats, true);
              const updatedState = useGameStore.getState();
              if ((updatedState.club.stadium || 0) > prevCap) {
                // Grand Celebration & Board Acclaim
                const currentImpact = updatedState.clubImpactScore ?? 50;
                const currentShields = updatedState.immunityShields ?? 1;
                updatedState.updateState({
                  clubImpactScore: Math.min(100, currentImpact + 10),
                  immunityShields: currentShields + 1,
                  notifications: [
                    {
                      id: Math.random().toString(),
                      type: 'celebration',
                      category: 'arena',
                      title: `🏟️ ${opt?.label || 'Grand Arena'} Inaugurated!`,
                      message: `The new ${seats.toLocaleString()} seat arena is now fully open. Board acclaim (+10 Impact, +1 Shield).`,
                      read: false
                    },
                    ...(updatedState.notifications || [])
                  ]
                });
              }
            }
            setShowNewBuild(false);

            const finalCap = useGameStore.getState().club.stadium || prevCap;
            if (finalCap > prevCap) {
              setArenaInaugurationData({
                previousCapacity: prevCap,
                newCapacity: finalCap,
                cost: financing ? financing.downPayment : cost,
                label: opt?.label || 'New Arena Complex',
                tag: opt?.tag || 'Grand Venue',
                desc: financing
                  ? `Historic milestone: Built via structured municipal project credit with ${formatMoney(financing.downPayment)} down payment and ${formatMoney(financing.monthlyPayment)}/mo debt service.`
                  : (opt?.desc || `A monumental achievement securing the future of ${state.club.name}.`),
                icon: opt?.icon || 'fa-building-columns'
              });
            }
          }}
        />
      )}
      {showStadium && (
        <StadiumModal key="modal-stadium" creditLimit={creditLimit}
          state={state}
          
          lang={lang}
          onClose={() => setShowStadium(false)}
          onShowArenaOverview={() => {
            setShowStadium(false);
            setShowArenaOverview(true);
          }}
          onExpand={(cost, seats, fanBoost) => {
            state.expandStadium(cost, seats, fanBoost || 0);
            setShowStadium(false);
          }}
        />
      )}
      {showAcademy && (() => {
        const isScoutDirector = state.directorArchetype === 'Scout / Youth Developer';
        const cost = getAcademyUpgradeCost(state.club.academyLevel || 1, state.club.tier, state.club.country, isScoutDirector);
        return (
          <AcademyModal
            key="modal-academy"
            state={state}
            lang={lang}
            cost={cost}
            onClose={() => setShowAcademy(false)}
            onConfirm={() => {
               setShowAcademy(false);
               useGameStore.getState().upgradeFacility('academy', cost);
            }}
            canAfford={state.budget + creditLimit >= cost}
          />
        );
      })()}
      
      {gachaRevealData && (
        <GachaRevealModal 
           key="modal-gacha" 
           revealData={gachaRevealData} 
           club={state.club}
           onClose={() => setGachaRevealData(null)} 
           lang={lang} 
        />
      )}
      {showMedical && (() => {
        const cost = getMedicalUpgradeCost(state.club.medicalLevel || 1, state.club.tier, state.club.country);
        return (
          <MedicalModal
            key="modal-medical"
            state={state}
            lang={lang}
            cost={cost}
            onClose={() => setShowMedical(false)}
            onConfirm={() => {
              setShowMedical(false);
              useGameStore.getState().upgradeFacility("medical", cost);
            }}
            canAfford={budget + creditLimit >= cost}
          />
        );
      })()}
      {showPhilosophy && (
        <PhilosophyModal key="modal-philosophy" isOpen={showPhilosophy}
          initialTab={philosophyInitialTab}
          state={state}
          onClose={() => setShowPhilosophy(false)}
          currentPhilosophyKey={state.tactic || "Total Handball"}
          onSelectPhilosophy={(key) => {
            stateStore.setPhilosophy(key);
            setShowPhilosophy(false);
          }}
          skillPoints={state.skillPoints || 0}
          hasTacticalGenius={(state.managerSkills || []).includes('tactical_mastermind')}
          lang={lang}
        />
      )}
      {showMorale && (
        <MoraleModal key="modal-morale" state={state}
          lang={lang}
          onClose={() => setShowMorale(false)}
        />
      )}
      {showShields && (
        <ShieldsModal key="modal-shields" state={state}
          lang={lang}
          onClose={() => setShowShields(false)}
        />
      )}
      {showPrepInfo && (
        <SeasonPrepInfoModal key="modal-prep-info" isOpen={showPrepInfo} onClose={() => setShowPrepInfo(false)} lang={lang} />
      )}
      {showTeamBonding && (
        <TeamBondingModal key="modal-bonding" state={state}
          lang={lang}
          cost={Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country))}
          canAfford={budget + creditLimit >= Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country))}
          onClose={() => setShowTeamBonding(false)}
          onConfirm={() => {
            stateStore.teamBonding(Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country)));
            setShowTeamBonding(false);
          }}
        />
      )}
      {showClubProfile && (
        <ClubProfileModal
          key="modal-club-profile"
          state={state}
          lang={lang}
          onClose={() => setShowClubProfile(false)}
          onOpenAcademy={() => {
            setShowClubProfile(false);
            setShowAcademy(true);
          }}
          onOpenMedical={() => {
            setShowClubProfile(false);
            setShowMedical(true);
          }}
        />
      )}
      {showArenaOverview && (
        <ArenaOverviewModal 
          key="modal-arena-overview"
          state={state} 
          lang={lang} 
          creditLimit={creditLimit}
          onExpand={(cost, seats, fanBoost) => {
            state.expandStadium(cost, seats, fanBoost || 0);
          }}
          onClose={() => setShowArenaOverview(false)} 
          onOpenUpgrades={() => {
             setShowArenaOverview(false);
             setShowStadium(true);
          }} 
        />
      )}
      {arenaInaugurationData && (
        <ArenaInaugurationModal
          key="modal-arena-inauguration"
          data={arenaInaugurationData}
          club={state.club}
          lang={lang}
          onClose={() => setArenaInaugurationData(null)}
        />
      )}
      {trophyInfoModal && (
        <div key="modal-trophy-info" className="fixed inset-0 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 z-[10050] animate-in fade-in" onClick={() => setTrophyInfoModal(null)}>
          <div 
            className="bg-[#14151e] rounded-2xl p-6 sm:p-7 max-w-sm w-full border border-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Top Ambient Highlight */}
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${trophyInfoModal === 'dom' ? 'via-amber-400/30' : 'via-sky-400/30'} to-transparent pointer-events-none`} />

            <button 
              onClick={() => setTrophyInfoModal(null)} 
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] text-zinc-400 hover:text-white flex items-center justify-center transition absolute top-4 right-4 cursor-pointer"
              aria-label="Close"
            >
              <i className="fas fa-xmark text-sm" />
            </button>

            <div className="text-center mb-5 mt-1">
              <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl border shadow-sm ${trophyInfoModal === 'dom' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'}`}>
                <i className={`fas ${trophyInfoModal === 'dom' ? 'fa-trophy' : 'fa-globe-americas'}`} />
              </div>
              <h2 className="text-xl font-semibold text-white tracking-tight leading-tight">
                {trophyInfoModal === 'dom' ? 'Domestic Silverware' : 'International Trophies'}
              </h2>
              <span className="text-xs text-zinc-400 font-normal mt-0.5 block">
                {trophyInfoModal === 'dom' ? 'Official Criteria' : 'Continental Criteria'}
              </span>
            </div>
            
            <div className="bg-[#10121a] rounded-2xl p-4 border border-white/[0.04] space-y-3.5">
              {trophyInfoModal === 'dom' ? (
                <>
                  <p className="text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed">
                    Counts all tier 1 domestic championships and major cups won by this club.
                  </p>
                  <div className="space-y-2 text-xs pt-1 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <i className="fas fa-check text-emerald-400 text-xs shrink-0" />
                      <span>Tier 1 League Championship</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <i className="fas fa-check text-emerald-400 text-xs shrink-0" />
                      <span>Domestic Cup & National Supercup Opener</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <i className="fas fa-xmark text-zinc-600 text-xs shrink-0" />
                      <span>Regional & Lower Divisions (Separate)</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs sm:text-[13px] text-zinc-300 font-normal leading-relaxed">
                    Records all official continental and intercontinental cup triumphs won by the club.
                  </p>
                  <div className="space-y-2 text-xs pt-1 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <i className="fas fa-check text-emerald-400 text-xs shrink-0" />
                      <span>European Cups (EHF CL, EL & EC)</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <i className="fas fa-check text-emerald-400 text-xs shrink-0" />
                      <span>IHF Super Globe / Club World Cup</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <button 
              onClick={() => setTrophyInfoModal(null)} 
              className="mt-4 w-full py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs rounded-xl transition active:scale-[0.99] cursor-pointer border border-white/[0.08]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>

    {/* Mobile-Only Dock Clearance Spacer - guarantees content never gets overlapped by the fixed dock on mobile */}
    <div className="h-32 sm:hidden shrink-0 pointer-events-none" aria-hidden="true" />

    {/* Apple Dynamic Island Matchday Action Dock (1st Half / 2nd Half Season Progression) */}
    <MatchdayActionDock
      state={state}
      isFirstHalf={state.year > winterBreakSeenYear}
      onSimulate={handleSimulate}
      lang={lang}
      disabled={Boolean(anyModalOpen || isSimulating || showSimulatingOverlay || state.bankruptcyPending || preSeasonSupercupQueue.length > 0)}
      supercupMatch={qualifiedSupercups[0]}
    />
  </div>
);
}
export default Dashboard;