import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { CareerSummary } from './components/CareerSummary';
import { Header } from './components/Header';
import { AboutPage } from './components/AboutPage';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_CLUBS } from './data/clubsData';
import { MAX_SEASONS, getLeagueInfo, getMaxTier, getDomesticCupInfo, getStartingBudget, isReserveClub } from './data/gameConstants';
import { getLeagueSize } from './engine/engine';
import { Language, ViewMode, UniverseMovement } from './types';
import { syncOfflineScores, fetchHighscores, calculateLiveScore, getReconciledTrophies } from './utils/leaderboard';
import { ToastContainer } from './components/ToastContainer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ModSelectionModal } from './components/ModSelectionModal';
import { ConsentBanner } from './components/ConsentBanner';
import { Trophy, Globe } from 'lucide-react';
import { getActiveClubs, isRealDataModActive, getCustomDb, mergeClubWithWorldState } from './utils/modManager';
import { preloadClubAssets } from './utils/assetPreloader';
import { initCrashReporter, openFeedbackModal } from './utils/crashReporter';
import { SEO } from './components/SEO';

const serializeTrophiesKey = (t?: any): string => {
  if (!t || typeof t !== 'object') return '';
  return `bl:${t.bl || 0},cwc:${t.cwc || 0},cl:${t.cl || 0},dfb:${t.dfb || 0},ecl:${t.ecl || 0},el:${t.el || 0},low:${t.lower || 0},reg:${t.reg || 0},sc:${t.sc || 0},esc:${t.esc || 0}`;
};

const computeHistoryReconciliationKey = (history: any[] = [], movements: any[] = []): string => {
  return `${history.length}-${movements.length}-${history.map(h => `${h.year}-${h.tier || 0}-${h.nextTier || 0}-${h.pos || 0}-${h.promoted ? 1 : 0}-${h.relegated ? 1 : 0}-${(h as any).survived ? 1 : 0}-${serializeTrophiesKey(h.trophiesThisYear)}-${(h.universeMovements || []).length}`).join(':')}`;
};

export default function App() {
  const state = useGameStore();
  const [lang, setLang] = useState<Language>('en');
  const [viewMode, setViewMode] = useState<ViewMode>('game');
  const [clubsDb, setClubsDb] = useState<any[]>(() => getActiveClubs());
  
  const [showHighscoresModal, setShowHighscoresModal] = useState(false);
  const [showModSelectionModal, setShowModSelectionModal] = useState(false);
  const [highscores, setHighscores] = useState<any[]>([]);
  const [loadingHighscores, setLoadingHighscores] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const lastReconciledHistoryKey = React.useRef<string>('');

  const [initialHydrationDone, setInitialHydrationDone] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('handball-manager-storage');
      if (!saved) return true;
      const parsed = JSON.parse(saved);
      if (!parsed?.state?.managerName) return true;
    } catch {
      return true;
    }
    return Boolean((useGameStore as any).persist?.hasHydrated?.());
  });

  const hasActiveCareer = Boolean(state.managerName && state.club && state.club.name);
  const isReadyToRender = initialHydrationDone || hasActiveCareer;

  useEffect(() => {
    if (initialHydrationDone) return;
    if ((useGameStore as any).persist?.hasHydrated?.()) {
      setInitialHydrationDone(true);
      return;
    }
    const unsub = (useGameStore as any).persist?.onFinishHydration?.(() => {
      setInitialHydrationDone(true);
    });
    const timer = setTimeout(() => setInitialHydrationDone(true), 10);
    return () => {
      unsub?.();
      clearTimeout(timer);
    };
  }, [initialHydrationDone]);

  React.useEffect(() => { 
    // Explicitly clean up any static loading screen fallback element upon React mount
    const fallback = document.getElementById('app-loading-fallback');
    if (fallback) fallback.remove();

    initCrashReporter();
    syncOfflineScores().catch(() => {}); 
    preloadClubAssets(clubsDb);
    setIsMounted(true);

    // Deep link query support for sitemap, languages, clubs, and tactical guides
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view');
        const l = params.get('lang');
        if (l === 'de' || l === 'es' || l === 'en') {
          setLang(l);
        }
        if (v === 'about' || v === 'tactics' || v === 'leagues') {
          setViewMode('about');
        } else if (v === 'leaderboard') {
          fetchGlobalHighscores();
        }
      } catch {}
    }

    // Sanity-check and heal legacy unplayed lower-tier saves with corrupted initial budgets
    if (
      state.club &&
      !state.club.isPublic &&
      (state.history?.length || 0) === 0 &&
      (state.club.tier || 1) >= 3 &&
      !state.activeLoan &&
      (state.squadSalesThisSeason || 0) === 0 &&
      (state.youthSalesThisSeason || 0) === 0 &&
      (state.sponsorIncome || 0) === 0 &&
      state.budget > 2500000 &&
      state.updateState
    ) {
      const realisticBase = getStartingBudget(state.club.tier, state.club.country || 'GER');
      const calibratedBudget = Math.round(realisticBase * 1.1);
      state.updateState({ budget: calibratedBudget });
    }
  }, [clubsDb]);

  React.useEffect(() => {
    if (!state.history || state.history.length === 0 || !state.updateState || state.postSeasonPending) {
      return;
    }
    const currentKey = computeHistoryReconciliationKey(state.history, state.universeMovements || []);
    if (lastReconciledHistoryKey.current === currentKey) {
      return;
    }
    lastReconciledHistoryKey.current = currentKey;

    let needsUpdate = false;
    
    const seasonsByClub: Record<string, typeof state.history> = {};
    state.history.forEach(h => {
      const cName = h.clubName || state.club?.name || 'Unknown';
      if (!seasonsByClub[cName]) seasonsByClub[cName] = [];
      seasonsByClub[cName].push(h);
    });

    const repairedHistoryMap = new Map<number, any>();

    const inauguralClubName = state.startClubName || state.history[0]?.clubName || state.club?.name;

    Object.entries(seasonsByClub).forEach(([clubName, seasons]) => {
      const dbClub = ALL_CLUBS.find(c => c.name === clubName) || getActiveClubs().find(c => c.name === clubName);
      const isInauguralClub = Boolean(inauguralClubName && clubName.trim().toLowerCase() === inauguralClubName.trim().toLowerCase());
      const sorted = [...seasons].sort((a, b) => a.year - b.year);
      const startingTier = isInauguralClub
        ? (state.startTier || sorted[0]?.tier || dbClub?.tier || (state.club?.name === clubName ? state.club.originalStartLeague : undefined) || 1)
        : (sorted[0]?.tier || dbClub?.tier || (state.club?.name === clubName ? state.club.tier : undefined) || 1);
      const cCountry = dbClub?.country || (state.club?.name === clubName ? state.club.country : 'GER') || 'GER';
      const maxTier = getMaxTier(cCountry);

      let expectedTier = startingTier;

      sorted.forEach((h, idx) => {
        let updated = { ...h };
        if (idx > 0 && h.year > sorted[idx - 1].year + 1 && typeof h.tier === 'number' && h.tier >= 1) {
          expectedTier = h.tier;
        }
        if (!updated.clubName && state.club?.name) {
          updated.clubName = state.club.name;
          needsUpdate = true;
        }
        if (updated.clubId === undefined) {
          if (updated.clubName) {
            const matchedHistoricalClub = ALL_CLUBS.find(c => c.name.trim().toLowerCase() === updated.clubName?.trim().toLowerCase());
            if (matchedHistoricalClub && matchedHistoricalClub.id !== undefined) {
              const histId = typeof matchedHistoricalClub.id === 'number' ? matchedHistoricalClub.id : Number(matchedHistoricalClub.id);
              if (!isNaN(histId)) {
                updated.clubId = histId;
                needsUpdate = true;
              }
            } else if (state.club?.name && updated.clubName.trim().toLowerCase() === state.club.name.trim().toLowerCase() && state.club?.id !== undefined) {
              const numericId = typeof state.club.id === 'number' ? state.club.id : Number(state.club.id);
              if (!isNaN(numericId)) {
                updated.clubId = numericId;
                needsUpdate = true;
              }
            }
          } else if (state.club?.id !== undefined) {
            const numericId = typeof state.club.id === 'number' ? state.club.id : Number(state.club.id);
            if (!isNaN(numericId)) {
              updated.clubId = numericId;
              needsUpdate = true;
            }
          }
        }
        if (!updated.country) {
          updated.country = cCountry;
          needsUpdate = true;
        }

        let divTableTier: number | undefined = undefined;
        if (h.divisionTables && typeof h.divisionTables === 'object') {
          for (const [tKey, rows] of Object.entries(h.divisionTables)) {
            if (Array.isArray(rows) && rows.some((r: any) => r && r.isUser)) {
              const parsedT = Number(tKey);
              if (!isNaN(parsedT) && parsedT >= 1) {
                divTableTier = parsedT;
                break;
              }
            }
          }
        }

        const isLegacyUnsetTier1 =
          h.tier === 1 &&
          divTableTier === undefined &&
          isInauguralClub &&
          expectedTier > 1 &&
          h.nextTier === undefined &&
          !h.finalTable &&
          !h.divisionTables &&
          !h.trophiesThisYear?.bl &&
          !h.trophiesThisYear?.cl &&
          !h.trophiesThisYear?.el &&
          !h.trophiesThisYear?.ecl &&
          !h.trophiesThisYear?.cwc;

        let seasonTier = divTableTier !== undefined
          ? divTableTier
          : (typeof h.tier === 'number' && h.tier >= 1 && !isLegacyUnsetTier1)
          ? h.tier
          : (expectedTier > 1 ? expectedTier : (h.tier || 1));

        if (updated.tier !== seasonTier) {
          updated.tier = seasonTier;
          needsUpdate = true;
        }

        const canPromoteFromTier = seasonTier > 1 && !(seasonTier === 2 && isReserveClub(clubName));
        const hasPromoMovement = (h.universeMovements || []).some(
          (m: any) => m && m.type === 'promotion' && (
            (updated.clubId !== undefined && String(m.clubId) === String(updated.clubId)) ||
            (m.clubName && m.clubName.trim().toLowerCase() === clubName.trim().toLowerCase())
          )
        );
        const isPromoted = Boolean(
          canPromoteFromTier && (
            hasPromoMovement ||
            (divTableTier !== undefined && divTableTier !== h.tier ? false : h.promoted) ||
            h.pos <= 2
          )
        );
        const numTeamsInSeason = getLeagueSize(seasonTier, updated.country || 'GER');
        const dropThreshold = Math.max(1, numTeamsInSeason - 1);
        const isFinancialDrop = Boolean((h as any).bankrupt || (h as any).financialRelegation);
        const canBeSportingRelegated = (h.pos || 0) >= Math.max(2, dropThreshold - 1);
        const isRelegated = Boolean(
          !isPromoted &&
          seasonTier < maxTier && (
            isFinancialDrop ||
            (canBeSportingRelegated && (
              h.relegated ||
              (!(h as any).survived && h.nextTier && h.nextTier > seasonTier) ||
              (!(h as any).survived && (h.pos || 0) >= dropThreshold)
            ))
          )
        );

        if (updated.promoted !== isPromoted) {
          updated.promoted = isPromoted;
          needsUpdate = true;
        }

        if (updated.relegated !== isRelegated) {
          updated.relegated = isRelegated;
          needsUpdate = true;
        }

        let nextTier = isPromoted && seasonTier > 1
          ? seasonTier - 1
          : isRelegated && seasonTier < maxTier
          ? seasonTier + 1
          : seasonTier;

        if (updated.nextTier !== nextTier) {
          updated.nextTier = nextTier;
          needsUpdate = true;
        }

        expectedTier = nextTier;

        const isLowerSeason = seasonTier > 1 || isPromoted || (updated.nextTier && updated.nextTier < seasonTier);
        if (isLowerSeason && updated.trophiesThisYear?.bl) {
          needsUpdate = true;
          const newT = {
            ...updated.trophiesThisYear,
            lower: (updated.trophiesThisYear.lower || 0) + (updated.trophiesThisYear.bl || 1)
          };
          delete newT.bl;
          updated.trophiesThisYear = newT;
        } else if (!isLowerSeason && seasonTier === 1 && updated.pos === 1 && !isReserveClub(clubName) && updated.trophiesThisYear?.lower && !updated.trophiesThisYear?.bl) {
          needsUpdate = true;
          const newT = {
            ...updated.trophiesThisYear,
            bl: 1
          };
          delete newT.lower;
          updated.trophiesThisYear = newT;
        }

        if (updated.pos > 1 && (updated.trophiesThisYear?.bl || updated.trophiesThisYear?.lower)) {
          needsUpdate = true;
          const newT = { ...updated.trophiesThisYear };
          delete newT.bl;
          delete newT.lower;
          updated.trophiesThisYear = newT;
        }

        const cupRunsThisYear = (state.cupRunResults || []).filter(r => r.year === updated.year);
        const natCupEliminated = cupRunsThisYear.some(r => {
            const title = (r.nameEn || '').toLowerCase();
            const isNational = r.id === 'nat_cup' || r.id === 'dfb' || ((title.includes('national') || title.includes('pokal') || title.includes('cup') || title.includes('copa') || title.includes('coupe') || title.includes('puchar')) && !title.includes('amateur') && !title.includes('regional') && !title.includes('euro') && !title.includes('champions') && !title.includes('super globe'));
            return isNational && !r.won;
        });
        const regCupEliminated = cupRunsThisYear.some(r => {
            const title = (r.nameEn || '').toLowerCase();
            const isRegional = r.id === 'reg_cup' || title.includes('regional') || title.includes('amateur');
            return isRegional && !r.won;
        });

        if (natCupEliminated && updated.trophiesThisYear?.dfb) {
          needsUpdate = true;
          const newT = { ...updated.trophiesThisYear };
          delete newT.dfb;
          updated.trophiesThisYear = newT;
        }

        if (regCupEliminated && updated.trophiesThisYear?.reg) {
          needsUpdate = true;
          const newT = { ...updated.trophiesThisYear };
          delete newT.reg;
          updated.trophiesThisYear = newT;
        }

        const candidateMovements: UniverseMovement[] = [
          ...(updated.universeMovements || []),
          ...(state.universeMovements || []),
          ...(state.history || []).flatMap((hist: any) => hist.universeMovements || [])
        ];
        const matchingCupMovements = candidateMovements.filter(
          m => Boolean(
            m &&
            m.year === updated.year &&
            m.type === 'intl_cup' &&
            (
              (m.clubName && updated.clubName && m.clubName.trim().toLowerCase() === updated.clubName.trim().toLowerCase()) ||
              (updated.clubId !== undefined && m.clubId !== undefined && (String(m.clubId) === String(updated.clubId) || Number(m.clubId) === Number(updated.clubId)))
            )
          )
        );
        matchingCupMovements.forEach(m => {
          const title = (m.cupTitle || '').toLowerCase();
          const isEuroSc = Boolean(m.id?.endsWith('-cup-esc') || title.includes('european supercup') || title.includes('euro supercup'));
          const isDomSc = Boolean(!isEuroSc && (m.id?.endsWith('-cup-sc') || title.includes('supercup') || title.includes('super cup') || title.includes('supercopa') || title.includes('trophée des champions')));
          if (isEuroSc) {
            if (!updated.trophiesThisYear?.esc) {
              updated.trophiesThisYear = { ...(updated.trophiesThisYear || {}), esc: 1 };
              needsUpdate = true;
            }
          } else if (isDomSc) {
            if (!updated.trophiesThisYear?.sc) {
              updated.trophiesThisYear = { ...(updated.trophiesThisYear || {}), sc: 1 };
              needsUpdate = true;
            }
          } else if (title.includes('champions league') && !updated.trophiesThisYear?.cl) {
            updated.trophiesThisYear = { ...(updated.trophiesThisYear || {}), cl: 1 };
            needsUpdate = true;
          } else if (title.includes('super globe') && !updated.trophiesThisYear?.cwc) {
            updated.trophiesThisYear = { ...(updated.trophiesThisYear || {}), cwc: 1 };
            needsUpdate = true;
          } else if (title.includes('european league') && !updated.trophiesThisYear?.el) {
            updated.trophiesThisYear = { ...(updated.trophiesThisYear || {}), el: 1 };
            needsUpdate = true;
          } else if (title.includes('european cup') && !updated.trophiesThisYear?.ecl) {
            updated.trophiesThisYear = { ...(updated.trophiesThisYear || {}), ecl: 1 };
            needsUpdate = true;
          } else if (title.includes('amateur') || title.includes('regional')) {
            if (!regCupEliminated && !updated.trophiesThisYear?.reg) {
              updated.trophiesThisYear = { ...(updated.trophiesThisYear || {}), reg: 1 };
              needsUpdate = true;
            }
          } else if (!natCupEliminated && !updated.trophiesThisYear?.dfb) {
            updated.trophiesThisYear = { ...(updated.trophiesThisYear || {}), dfb: 1 };
            needsUpdate = true;
          }
        });

        const lInfo = getLeagueInfo(seasonTier, updated.country);
        if (updated.leagueTag !== lInfo.name) {
          updated.leagueTag = lInfo.name;
          needsUpdate = true;
        }

        repairedHistoryMap.set(updated.year, updated);
      });
    });

    const newHistory = state.history.map(h => repairedHistoryMap.get(h.year) || h);

    const userCountryNorm = (state.club?.country || 'GER').toUpperCase();
    const hasForeignInsolvency = (state.universeMovements || []).some(
      m => m.type === 'insolvency_relegation' && (m.country || 'GER').toUpperCase() !== userCountryNorm
    );
    let cleanMovements = state.universeMovements;
    if (hasForeignInsolvency) {
      needsUpdate = true;
      cleanMovements = (state.universeMovements || []).filter(
        m => !(m.type === 'insolvency_relegation' && (m.country || 'GER').toUpperCase() !== userCountryNorm)
      );
    }
    
    // Auto-repair false positive AI cup victories in older save states
    if (cleanMovements) {
        let repairedCups = false;
        cleanMovements = cleanMovements.map(m => {
            if (m.type === 'intl_cup') {
                const isClubMatch = Boolean(
                    (m.clubName && state.club?.name && m.clubName.trim().toLowerCase() === state.club.name.trim().toLowerCase()) ||
                    (state.club?.id !== undefined && m.clubId !== undefined && (String(m.clubId) === String(state.club.id) || Number(m.clubId) === Number(state.club.id)))
                );
                if (isClubMatch) {
                    const title = (m.cupTitle || '').toLowerCase();
                    const isSupercup = Boolean(m.id?.endsWith('-cup-sc') || m.id?.endsWith('-cup-esc') || title.includes('supercup') || title.includes('super cup') || title.includes('supercopa') || title.includes('trophée des champions'));
                    const isNatCup = !isSupercup && (title.includes('pokal') || title.includes('cup') || title.includes('copa') || title.includes('coupe') || title.includes('puchar')) && !title.includes('amateur') && !title.includes('regional') && !title.includes('super globe') && !title.includes('champions league') && !title.includes('european');
                    const isRegCup = title.includes('amateur') || title.includes('regional');

                    const mCupRuns = (state.cupRunResults || []).filter(r => r.year === m.year);
                    const mNatElim = mCupRuns.some(r => {
                        const rTitle = (r.nameEn || '').toLowerCase();
                        const isNational = r.id === 'nat_cup' || r.id === 'dfb' || ((rTitle.includes('national') || rTitle.includes('pokal') || rTitle.includes('cup') || rTitle.includes('copa') || rTitle.includes('coupe') || rTitle.includes('puchar')) && !rTitle.includes('amateur') && !rTitle.includes('regional') && !rTitle.includes('euro') && !rTitle.includes('champions') && !rTitle.includes('super globe'));
                        return isNational && !r.won;
                    });
                    const mRegElim = mCupRuns.some(r => {
                        const rTitle = (r.nameEn || '').toLowerCase();
                        const isRegional = r.id === 'reg_cup' || rTitle.includes('regional') || rTitle.includes('amateur');
                        return isRegional && !r.won;
                    });

                    if ((isNatCup && mNatElim) || (isRegCup && mRegElim)) {
                        repairedCups = true;
                        const validAiClubs = ALL_CLUBS.filter(c => c.tier === 1 && c.country === (state.club?.country || 'GER') && c.id !== state.club?.id);
                        const fallbackClub = validAiClubs[Math.floor(Math.random() * validAiClubs.length)] || ALL_CLUBS[0];
                        return {
                            ...m,
                            clubId: String(fallbackClub.id),
                            clubName: fallbackClub.name,
                            clubLogo: fallbackClub.logo,
                            clubColor: fallbackClub.color
                        };
                    }
                }
            }
            return m;
        });
        if (repairedCups) needsUpdate = true;
    }
    
    const cleanNotice = (state.lastInsolventGiantNotice && (state.lastInsolventGiantNotice.country || 'GER').toUpperCase() !== userCountryNorm)
      ? undefined
      : state.lastInsolventGiantNotice;
    if (cleanNotice !== state.lastInsolventGiantNotice) {
      needsUpdate = true;
    }

    const activeClubSeasons = newHistory.filter(h => h.clubName === state.club?.name || (h.clubId !== undefined && h.clubId === state.club?.id));
    const latestActiveSeason = activeClubSeasons.length > 0 ? activeClubSeasons.sort((a, b) => a.year - b.year)[activeClubSeasons.length - 1] : null;
    const isImmediatePrevSeason = Boolean(latestActiveSeason && latestActiveSeason.year === (state.year || 2024) - 1);
    const expectedClubTier = isImmediatePrevSeason ? (latestActiveSeason?.nextTier || state.club?.tier) : state.club?.tier;
    if (state.club && expectedClubTier && state.club.tier !== expectedClubTier) {
      needsUpdate = true;
    }

    const correctScore = calculateLiveScore({ ...state, history: newHistory });
    if (state.careerScore !== correctScore || state.score !== correctScore) {
      needsUpdate = true;
    }

    if (needsUpdate) {
      let domTrophies = 0;
      let intTrophies = 0;
      let totalTrophies = 0;
      newHistory.forEach(h => {
        if (h.trophiesThisYear?.dfb) domTrophies++;
        if (h.trophiesThisYear?.bl) domTrophies++;
        if (h.trophiesThisYear?.sc) domTrophies++;
        if (h.trophiesThisYear?.cl) intTrophies++;
        if (h.trophiesThisYear?.el) intTrophies++;
        if (h.trophiesThisYear?.ecl) intTrophies++;
        if (h.trophiesThisYear?.cwc) intTrophies++;
        if (h.trophiesThisYear?.esc) intTrophies++;
        
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

      const reconstructedTrophies: string[] = [];
      newHistory.forEach(h => {
        if (h.trophiesThisYear?.cl) reconstructedTrophies.push('EHF Champions League');
        if (h.trophiesThisYear?.el) reconstructedTrophies.push('EHF European League');
        if (h.trophiesThisYear?.ecl) reconstructedTrophies.push('EHF European Cup');
        if (h.trophiesThisYear?.cwc) reconstructedTrophies.push('IHF Super Globe');
        if (h.trophiesThisYear?.esc) reconstructedTrophies.push('EHF European Supercup');
        if (h.trophiesThisYear?.bl) reconstructedTrophies.push('League Champions');
        if (h.trophiesThisYear?.lower) reconstructedTrophies.push('Lower League Title');
        if (h.trophiesThisYear?.dfb) reconstructedTrophies.push('National Cup');
        if (h.trophiesThisYear?.sc) reconstructedTrophies.push('National Supercup');
        if (h.trophiesThisYear?.reg) reconstructedTrophies.push('Regional Cup');
      });
      const resolvedTrophies = (state.trophies && state.trophies.length > 0) ? state.trophies : reconstructedTrophies;

      let updatedClub = state.club;
      let updatedWorldClubs = state.worldClubs;
      if (state.club && expectedClubTier && state.club.tier !== expectedClubTier) {
        updatedClub = { ...state.club, tier: expectedClubTier };
        if (state.club.id !== undefined) {
          updatedWorldClubs = {
            ...(state.worldClubs || {}),
            [state.club.id]: {
              ...(state.worldClubs?.[state.club.id] || state.club),
              tier: expectedClubTier
            }
          };
        }
      }
      state.updateState({ 
        club: updatedClub,
        ...(updatedWorldClubs !== state.worldClubs ? { worldClubs: updatedWorldClubs } : {}),
        history: newHistory,
        universeMovements: cleanMovements,
        lastInsolventGiantNotice: cleanNotice,
        totals: { ...state.totals, domTrophies, intTrophies, trophies: totalTrophies },
        trophies: resolvedTrophies,
        careerScore: correctScore,
        score: correctScore
      });
    }
    const finalKey = computeHistoryReconciliationKey(newHistory || state.history, cleanMovements || state.universeMovements || []);
    lastReconciledHistoryKey.current = finalKey;
  }, [state.history, state.updateState, state.totals, state.startClubName, state.startTier, state.club, state.universeMovements, state.lastInsolventGiantNotice, state.careerScore, state.score, state.trophies, state.postSeasonPending]);

  React.useEffect(() => { state.setLang(lang); }, [lang]);

  React.useEffect(() => {
    const syncDatabaseToState = (nextClubs: any[]) => {
      const liveState = useGameStore.getState();
      if (!liveState.club || !liveState.updateState) return;
      const isModActiveNow = isRealDataModActive() || Boolean(getCustomDb());
      const matched =
        nextClubs.find(c => String(c.id) === String(liveState.club.id) || (c.name && c.name.toLowerCase() === liveState.club.name.toLowerCase())) ||
        ALL_CLUBS.find(c => String(c.id) === String(liveState.club.id) || (c.name && c.name.toLowerCase() === liveState.club.name.toLowerCase()));

      const updatedClub = matched
        ? {
            ...mergeClubWithWorldState(matched, liveState.club),
            logo: isModActiveNow ? matched.logo : undefined,
            fallbackLogo: isModActiveNow ? matched.fallbackLogo : undefined,
          }
        : {
            ...liveState.club,
            logo: isModActiveNow ? liveState.club.logo : undefined,
            fallbackLogo: isModActiveNow ? liveState.club.fallbackLogo : undefined,
          };

      let updatedWorldClubs = liveState.worldClubs;
      if (liveState.worldClubs && Object.keys(liveState.worldClubs).length > 0) {
        const nextWorld: Record<string, any> = {};
        for (const [k, wc] of Object.entries(liveState.worldClubs)) {
          if (!wc) continue;
          const dbEntry =
            nextClubs.find(c => String(c.id) === String(wc.id) || (c.name && wc.name && c.name.toLowerCase() === wc.name.toLowerCase())) ||
            ALL_CLUBS.find(c => String(c.id) === String(wc.id) || (c.name && wc.name && c.name.toLowerCase() === wc.name.toLowerCase()));
          nextWorld[k] = dbEntry
            ? {
                ...mergeClubWithWorldState(dbEntry, wc),
                logo: isModActiveNow ? dbEntry.logo : undefined,
                fallbackLogo: isModActiveNow ? dbEntry.fallbackLogo : undefined,
              }
            : {
                ...wc,
                logo: isModActiveNow ? wc.logo : undefined,
                fallbackLogo: isModActiveNow ? wc.fallbackLogo : undefined,
              };
        }
        if (updatedClub.id !== undefined) {
          nextWorld[String(updatedClub.id)] = updatedClub;
        }
        updatedWorldClubs = nextWorld;
      }

      let updatedOffers = liveState.pendingJobOffers;
      if (Array.isArray(liveState.pendingJobOffers) && liveState.pendingJobOffers.length > 0) {
        updatedOffers = liveState.pendingJobOffers.map((offer: any) => {
          const dbOffer =
            nextClubs.find(c => String(c.id) === String(offer.id) || (c.name && offer.name && c.name.toLowerCase() === offer.name.toLowerCase())) ||
            ALL_CLUBS.find(c => String(c.id) === String(offer.id) || (c.name && offer.name && c.name.toLowerCase() === offer.name.toLowerCase()));
          return dbOffer ? mergeClubWithWorldState(dbOffer, offer) : {
            ...offer,
            logo: isModActiveNow ? offer.logo : undefined,
            fallbackLogo: isModActiveNow ? offer.fallbackLogo : undefined,
          };
        });
      }

      let updatedMovements = liveState.universeMovements;
      if (Array.isArray(liveState.universeMovements) && liveState.universeMovements.length > 0) {
        updatedMovements = liveState.universeMovements.map((m: any) => {
          const dbMov =
            nextClubs.find(c => (m.clubId !== undefined && String(c.id) === String(m.clubId)) || (c.name && m.clubName && c.name.toLowerCase() === m.clubName.toLowerCase())) ||
            ALL_CLUBS.find(c => (m.clubId !== undefined && String(c.id) === String(m.clubId)) || (c.name && m.clubName && c.name.toLowerCase() === m.clubName.toLowerCase()));
          return {
            ...m,
            clubName: dbMov?.name || m.clubName,
            clubColor: dbMov?.color || m.clubColor,
            clubLogo: isModActiveNow ? (dbMov?.logo ?? m.clubLogo) : undefined,
          };
        });
      }

      liveState.updateState({
        club: updatedClub,
        ...(updatedWorldClubs !== liveState.worldClubs ? { worldClubs: updatedWorldClubs } : {}),
        ...(updatedOffers !== liveState.pendingJobOffers ? { pendingJobOffers: updatedOffers } : {}),
        ...(updatedMovements !== liveState.universeMovements ? { universeMovements: updatedMovements } : {}),
      });
    };

    const handleModChange = () => {
      const liveState = useGameStore.getState();
      const nextClubs = getActiveClubs(liveState.club?.country);
      setClubsDb(nextClubs);
      syncDatabaseToState(nextClubs);
    };

    window.addEventListener('mod-state-change', handleModChange);

    if (state.club && state.updateState) {
      const isModActiveNow = isRealDataModActive() || Boolean(getCustomDb());
      const nextClubs = getActiveClubs(state.club?.country);
      const matched =
        nextClubs.find(c => String(c.id) === String(state.club.id) || (c.name && c.name.toLowerCase() === state.club.name.toLowerCase())) ||
        ALL_CLUBS.find(c => String(c.id) === String(state.club.id) || (c.name && c.name.toLowerCase() === state.club.name.toLowerCase()));
      if (matched) {
        const desiredLogo = isModActiveNow ? (matched.logo || state.club.logo) : undefined;
        const desiredFallbackLogo = isModActiveNow ? (matched.fallbackLogo || state.club.fallbackLogo) : undefined;
        if (
          state.club.logo !== desiredLogo ||
          state.club.fallbackLogo !== desiredFallbackLogo ||
          (!state.club.historicContext && (matched.historicContext || matched.context))
        ) {
          state.updateState({
            club: {
              ...state.club,
              logo: desiredLogo,
              fallbackLogo: desiredFallbackLogo,
              historicContext: matched.historicContext || matched.context || state.club.historicContext,
              context: matched.context || matched.historicContext || state.club.context
            }
          });
        }
      }
    }

    return () => {
      window.removeEventListener('mod-state-change', handleModChange);
    };
  }, [state.club?.id, state.club?.name, state.club?.logo, state.updateState]);

  const handleReset = () => {
    setInitialHydrationDone(true);
    state.resetGame();
    setViewMode('game');
    setResetKey(prev => prev + 1);
  };

  const handleContinueEndless = () => {
    state.updateState({ endlessModeActive: true, isCareerEnded: false, postSeasonPending: false });
  };

    const fetchGlobalHighscores = async () => {
    setLoadingHighscores(true);
    setShowHighscoresModal(true);
    
    let fetchedData: any[] = [];
    try {
      fetchedData = await fetchHighscores();
    } catch (err) {
      console.warn('Leaderboard fetch error:', err);
      fetchedData = [];
    }
    
    if (state.isCareerEnded || (!state.endlessModeActive && (state.history?.length || 0) >= 35)) {
        const currentScore = calculateLiveScore(state);
        if (currentScore) {
            const exists = fetchedData.some((d: any) => d.managerName === state.managerName && d.score === currentScore);
            if (!exists) {
                fetchedData.push({
                    managerName: state.managerName || 'You',
                    clubName: state.club?.name || '',
                    score: currentScore,
                    trophies: getReconciledTrophies(state),
                    start_tier: state.startTier || (state.history && state.history.length > 0 ? state.history[0]?.tier : undefined) || state.club?.originalStartLeague || state.club?.tier || 1
                });
                fetchedData.sort((a: any, b: any) => b.score - a.score);
                fetchedData = fetchedData.slice(0, 50);
            }
        }
    }
    
    setHighscores(fetchedData);
    setLoadingHighscores(false);
  };

  let seoTitle = 'Handball Manager Sim – Career & Strategy Game';
  let seoDesc = 'Lead your handball club to glory. Manage transfers, master tactical systems, expand your arena, and compete in domestic leagues, national cups, and the EHF Champions League.';
  let seoCanonical = 'https://handballmanagersim.com/';
  let seoType: 'website' | 'game' | 'article' = 'website';

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const viewParam = searchParams?.get('view');
  const clubParam = searchParams?.get('club');
  const shareParam = searchParams?.get('share');
  const shareManager = searchParams?.get('manager');
  const shareClub = searchParams?.get('club');
  const shareTrophies = searchParams?.get('trophies');
  const shareScore = searchParams?.get('score');

  const matchedClubFromParam = clubParam
    ? (clubsDb.find(c => c.name.toLowerCase() === clubParam.toLowerCase()) || ALL_CLUBS.find(c => c.name.toLowerCase() === clubParam.toLowerCase()))
    : null;

  if (shareParam === 'dynasty' || shareParam === 'career') {
    const dMgr = shareManager || 'Manager';
    const dClub = shareClub || state.club?.name || 'European Handball Club';
    const dTrophies = shareTrophies || getReconciledTrophies(state);
    const dScore = shareScore || (state.history?.length ? calculateLiveScore(state) : 'Elite');
    seoTitle = `🏆 ${dMgr}'s ${dClub} Dynasty (${dTrophies} Trophies) | Handball Manager Sim`;
    seoDesc = `Explore ${dMgr}'s managerial legacy with ${dClub}: ${dTrophies} major trophies won and ${dScore} points in Handball Manager Sim. Free browser sports sim!`;
    seoCanonical = `https://handballmanagersim.com/?share=dynasty&club=${encodeURIComponent(dClub)}`;
    seoType = 'game';
  } else if (matchedClubFromParam && !hasActiveCareer) {
    seoTitle = `Manage ${matchedClubFromParam.name} – Tactics, Transfers & Trophies | Handball Manager Sim`;
    seoDesc = `Take command of ${matchedClubFromParam.name} (${matchedClubFromParam.country} · Tier ${matchedClubFromParam.tier}) in Handball Manager Sim. Master tactical systems, arena expansions, and European silverware hunts.`;
    seoCanonical = `https://handballmanagersim.com/?club=${encodeURIComponent(matchedClubFromParam.name)}`;
    seoType = 'game';
  } else if (showHighscoresModal || viewParam === 'leaderboard') {
    seoTitle = 'Global Leaderboard & Hall of Fame | Handball Manager Sim';
    seoDesc = 'Compare your European handball dynasty score, trophies won, and manager legacy against the greatest tacticians on the global leaderboard.';
    seoCanonical = 'https://handballmanagersim.com/?view=leaderboard';
    seoType = 'game';
  } else if (viewParam === 'tactics') {
    seoTitle = 'Handball Tactics Guide – 6:0, 5:1, 3:2:1 Formations & Fast Breaks | Handball Manager Sim';
    seoDesc = 'Master modern European handball tactics: 6:0 wall defense, 5:1 point disruptor, 3:2:1 aggressive pyramid, fast break tempo, and 7-on-6 empty goal power plays.';
    seoCanonical = 'https://handballmanagersim.com/?view=tactics';
    seoType = 'article';
  } else if (viewParam === 'leagues') {
    seoTitle = 'European Handball Leagues & Pyramids Guide – Bundesliga, Starligue, ASOBAL | Handball Manager Sim';
    seoDesc = 'Explore 20 European handball domestic pyramids including Germany, France, Spain, Denmark, Poland, and Croatia, with authentic promotion and cup rules.';
    seoCanonical = 'https://handballmanagersim.com/?view=leagues';
    seoType = 'article';
  } else if (viewMode === 'about') {
    seoTitle = 'About Handball Manager Sim – Mechanics, Leagues & Tactical Guide';
    seoDesc = 'Discover how Handball Manager Sim works: 6:0, 5:1, and 3:2:1 defensive systems, fast breaks, domestic pyramids across Europe, youth scouting, and arena upgrades.';
    seoCanonical = 'https://handballmanagersim.com/?view=about';
    seoType = 'article';
  } else if (state.isCareerEnded || (!state.endlessModeActive && !state.postSeasonPending && (state.history?.length || 0) >= MAX_SEASONS)) {
    seoTitle = `${state.managerName || 'Manager'} Career Retrospective | Handball Manager Sim`;
    seoDesc = `Final career retrospective for manager ${state.managerName || 'Manager'}. ${state.history?.length || 0} seasons managed, ${getReconciledTrophies(state)} trophies won across European handball.`;
    seoType = 'game';
  } else if (hasActiveCareer) {
    seoTitle = `${state.club?.name || 'Club'} (Season ${state.year}) | Handball Manager Sim`;
    seoDesc = `Managing ${state.club?.name || 'European club'} in Handball Manager Sim. Season ${state.year}, master tactical systems, transfers, arena expansion, and silverware hunts.`;
    seoType = 'game';
  }

  // Ensure document.title always stays in sync with the active career or onboarding state
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = seoTitle;
  }, [seoTitle, hasActiveCareer, state.club?.name, state.year]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden text-neutral-200 font-sans selection:bg-blue-500/30 pt-12 sm:pt-16 flex flex-col">
      <SEO title={seoTitle} description={seoDesc} canonical={seoCanonical} type={seoType} />
      <ToastContainer state={state} />
      <ConsentBanner />
      <Header 
         lang={lang} 
         viewMode={viewMode} 
         onToggleViewMode={setViewMode} 
         onResetGame={handleReset} 
         hasActiveGame={!!(state.managerName && state.club && state.club.name)}
        onShowLeaderboard={fetchGlobalHighscores}
        onOpenMods={() => setShowModSelectionModal(true)}
      />
      
      {viewMode === 'about' ? (
        <AboutPage lang={lang} clubsDb={clubsDb} onStartCareer={() => setViewMode('game')} />
      ) : (
        <>
          {!isReadyToRender ? (
            <div className="w-full flex-1 flex items-center justify-center min-h-[400px]" />
          ) : !hasActiveCareer ? (
            <div className="w-full max-w-full overflow-x-hidden flex-1 flex flex-col items-center justify-start pt-2 sm:pt-4 md:pt-6 pb-12 px-2 sm:px-4">
              <Onboarding 
                 key={resetKey}
                 lang={lang} 
                 clubsDb={clubsDb} 
                 setClubsDb={setClubsDb}
                 onStartGame={(p) => state.initGame(p.club.id, p.managerName, p.startYear, p.tactic, p.mode)} 
                 onShowLeaderboard={fetchGlobalHighscores} 
               />
            </div>
          ) : (state.isCareerEnded || (!state.endlessModeActive && !state.postSeasonPending && (state.history?.length || 0) >= MAX_SEASONS)) ? (
            <CareerSummary 
               state={state} 
               lang={lang} 
               onReset={handleReset} 
               onContinueEndless={handleContinueEndless}
              onShowLeaderboard={fetchGlobalHighscores}
            />
          ) : (
            <main className="px-3 sm:px-6 py-2 sm:py-3.5 pb-36 sm:pb-4 w-full max-w-full overflow-x-hidden">
              <div className="flex flex-col gap-2.5 sm:gap-4 w-full max-w-full">
                {/* Subtle Community Feedback Strip between Navigation and Dashboard */}
                <div className="max-w-7xl mx-auto w-full">
                  <button
                    type="button"
                    onClick={() => openFeedbackModal()}
                    className="w-full group flex items-center justify-between gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.06] hover:border-sky-400/25 transition-all duration-200 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80 group-hover:bg-sky-400 shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
                      <p className="text-[11px] sm:text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors leading-snug">
                        {lang === 'de' ? (
                          <>
                            <span className="font-medium text-zinc-300">Gestalte das Spiel mit:</span> Melde Feedback, Wünsche oder Abstürze — <span className="text-sky-400/90 font-medium">Feedback wird wöchentlich umgesetzt.</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-zinc-300">Help shape this game:</span> Share feedback, feature wishes, or crash reports — <span className="text-sky-400/90 font-medium">feedback is implemented weekly.</span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-sky-400/90 group-hover:text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-400/20 group-hover:border-sky-400/40 transition-all">
                      <i className="fas fa-comment-dots text-[10px]" />
                      <span>{lang === 'de' ? 'Melden' : 'Report'}</span>
                    </span>
                  </button>
                </div>

                <Dashboard state={state} lang={lang} />
              </div>
            </main>
          )}
        </>
      )}

      {/* HighscoreModal */}
      <AnimatePresence>
        {showHighscoresModal && (
          <LeaderboardModal
            state={state}
            lang={lang}
            onReset={() => {
              setShowHighscoresModal(false);
              handleReset();
            }}
            onClose={() => {
              setShowHighscoresModal(false);
              if (state.managerName && state.club?.name && viewMode !== 'game') {
                setViewMode('game');
              }
            }}
          />
        )}
        {showModSelectionModal && (
          <ModSelectionModal
            isOpen={showModSelectionModal}
            onClose={() => setShowModSelectionModal(false)}
            lang={lang}
            onDatabaseChange={(updatedClubs) => {
              setClubsDb(updatedClubs);
              const currentClub = state.club;
              if (currentClub && state.managerName) {
                const isModActiveNow = isRealDataModActive() || Boolean(getCustomDb());
                const modMatch =
                  updatedClubs.find((c: any) => String(c.id) === String(currentClub.id) || (c.name && c.name.toLowerCase() === currentClub.name.toLowerCase())) ||
                  ALL_CLUBS.find((c: any) => String(c.id) === String(currentClub.id) || (c.name && c.name.toLowerCase() === currentClub.name.toLowerCase()));
                const preservedClub = modMatch
                  ? {
                      ...mergeClubWithWorldState(modMatch, currentClub),
                      stadium: currentClub.stadium ?? modMatch.stadium ?? 0,
                      fanBase: currentClub.fanBase ?? modMatch.fanBase ?? 0,
                      academyLevel: currentClub.academyLevel || 1,
                      medicalLevel: currentClub.medicalLevel || 1,
                      baseOvr: currentClub.baseOvr || modMatch.baseOvr || 60,
                      squadSize: currentClub.squadSize || modMatch.squadSize || 18,
                      fanStrategy: currentClub.fanStrategy || modMatch.fanStrategy || 'balanced',
                      logo: isModActiveNow ? modMatch.logo : undefined,
                      fallbackLogo: isModActiveNow ? modMatch.fallbackLogo : undefined,
                    }
                  : {
                      ...currentClub,
                      logo: isModActiveNow ? currentClub.logo : undefined,
                      fallbackLogo: isModActiveNow ? currentClub.fallbackLogo : undefined,
                    };

                const nextWorldClubs: Record<string, any> = {};
                for (const [k, wc] of Object.entries(state.worldClubs || {})) {
                  if (!wc) continue;
                  const dbMatch =
                    updatedClubs.find((c: any) => String(c.id) === String(wc.id) || (c.name && wc.name && c.name.toLowerCase() === wc.name.toLowerCase())) ||
                    ALL_CLUBS.find((c: any) => String(c.id) === String(wc.id) || (c.name && wc.name && c.name.toLowerCase() === wc.name.toLowerCase()));
                  nextWorldClubs[k] = dbMatch
                    ? {
                        ...mergeClubWithWorldState(dbMatch, wc),
                        logo: isModActiveNow ? dbMatch.logo : undefined,
                        fallbackLogo: isModActiveNow ? dbMatch.fallbackLogo : undefined,
                      }
                    : {
                        ...wc,
                        logo: isModActiveNow ? wc.logo : undefined,
                        fallbackLogo: isModActiveNow ? wc.fallbackLogo : undefined,
                      };
                }
                nextWorldClubs[String(currentClub.id)] = preservedClub;

                state.updateState({
                  club: preservedClub,
                  worldClubs: nextWorldClubs,
                });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}