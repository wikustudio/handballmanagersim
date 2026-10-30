import React, { useRef, useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import confetti from 'canvas-confetti';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { GameState, Language, WorldCupCampaignHistoryRecord } from '../types';
import { NATIONAL_TEAMS } from '../engine/internationalEngine';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { getTrophyImage, getTrophyFilter } from '../utils/trophyHelpers';
import { 
  MAX_SEASONS,
  formatNum,
  getInitials,
  getMonogramHex,
  getOvrColor,
  getLeagueInfo,
  getDomesticCupInfo,
  calculateClubReputation,
  HISTORICAL_DIRECTORS,
  TOURNAMENT_LOGOS, 
  getMaxTier 
} from '../data/gameConstants';
import { ALL_CLUBS } from '../data/clubsData';
import { ClubLogo } from './ClubLogo';
import { t as tr } from '../data/translations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CareerSummaryProps {
  state: GameState;
  lang: Language;
  onReset: () => void;
  onContinueEndless?: () => void;
  onShowToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onClose?: () => void;
  onShowLeaderboard?: () => void;
  globalHighscores?: { directorName?: string; managerName?: string; score: number }[];
  isModActive?: boolean;
  onOpenWorldCupHistory?: () => void;
}

type SummaryTab = 'card' | 'chart' | 'clubs' | 'leaderboard';

export const CareerSummary: React.FC<CareerSummaryProps> = ({
  globalHighscores,
  state,
  lang,
  onReset,
  onShowToast,
  onClose,
  onContinueEndless,
  onShowLeaderboard,
  isModActive,
  onOpenWorldCupHistory,
}) => {
  const t = (en: string, de?: string, _ignoredEs?: string) => tr(lang, en, de);
  const [activeTab, setActiveTab] = useState<SummaryTab>('card');
  const [isDownloading, setIsDownloading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // Top 3 Celebration Confetti
  useEffect(() => {
    if (globalHighscores && globalHighscores.length > 0) {
      const myScore = state.careerScore || 0;
      const allScores = [...globalHighscores.map(g => g.score), myScore].sort((a, b) => b - a);
      const myRank = allScores.indexOf(myScore) + 1;

      if (myRank <= 3) {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 999999 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 70 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: 0.5, y: 0.35 } });
        }, 300);
        
        return () => clearInterval(interval);
      }
    }
  }, [globalHighscores, state.careerScore]);

  // Fetch AI Career Summary or client-side fallback
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/generate-career-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            directorName: (state.managerName || (lang === 'de' ? 'Der Manager' : 'The Manager')),
            clubName: state.club.name,
            managedClubs: Array.from(new Set(state.history?.map(h => h.clubName) || [])),
            seasons: state.history?.length || 0,
            matches: state.totals?.matches || 0,
            wins: state.totals?.wins || 0,
            winPct: state.totals?.matches > 0 ? Math.round((state.totals.wins / state.totals.matches) * 100) : 0,
            trophies: state.totals?.trophies || 0,
            clTrophies: state.history?.reduce((acc, h) => acc + (h.trophiesThisYear?.cl || 0), 0) || 0,
            managerRep: Math.min(100, Math.max(0, Math.round(state.reputation || 50))),
            clubRep: Math.min(100, Math.max(1, calculateClubReputation(state.club.baseOvr, state.club.tier))),
            morale: Math.min(100, Math.max(0, state.club.morale ?? 100))
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
           if (data.error === "GEMINI_API_KEY not configured") {
              throw new Error("KEY_MISSING");
           }
           throw new Error('API failed');
        }
        
        if (isMounted && data.text) {
          setAiSummary(data.text);
        }
      } catch (err: any) {
        if (isMounted) {
          const seasons = state.history?.length || 0;
          const trophies = state.totals?.trophies || 0;
          const matches = state.totals?.matches || 0;
          const wins = state.totals?.wins || 0;
          const winPct = matches > 0 ? Math.round((wins / matches) * 100) : 0;
          const managerName = state.managerName || (lang === 'de' ? 'Der Manager' : 'The Manager');

          const earlyQuits = [
            `After a mere ${seasons} seasons across clubs like ${Array.from(new Set(state.history?.map(h => h.clubName) || [])).slice(0, 3).join(', ')}, ${managerName} packed their bags, proving they simply couldn't handle the heat.`,
            `${managerName} throws in the towel after just ${seasons} seasons, stepping away from the technical area.`,
            `Fleeing management after ${seasons} seasons, ${managerName} leaves behind an intriguing tactical legacy at ${state.club.name}.`
          ];

          const endlessCareers = [
            `Stepping through ${seasons} campaigns at clubs like ${Array.from(new Set(state.history?.map(h => h.clubName) || [])).slice(0, 3).join(', ')}, ${managerName} has basically become part of modern football folklore.`,
            `After ${seasons} seasons at the highest level, ${managerName} concludes a historic and enduring managerial reign.`,
            `${seasons} seasons, ${matches} matches. ${managerName}'s tenure stands as an indelible landmark.`
          ];

          const standardCareers = [
            `${managerName} calls time on a textbook ${seasons}-season stint across clubs like ${Array.from(new Set(state.history?.map(h => h.clubName) || [])).slice(0, 3).join(', ')}, stepping away from the touchline with distinction.`,
            `The ${managerName} era comes to an end after ${seasons} campaigns of refined sporting direction and high-stakes football.`,
            `After ${seasons} seasons of tactical mastery and roster management, ${managerName} bids farewell to the supporters of ${state.club.name}.`
          ];

          const frauds = [
            `Despite a ${winPct}% win rate, they depart with an empty trophy cabinet and the elusive title of a purist theoretician.`,
            `Zero trophies across ${matches} matches leaves an appetite for silverware unfulfilled.`,
            `They leave with 0 pieces of silverware, demonstrating that stylistic football alone doesn't always guarantee medals.`
          ];

          const cheatCodes = [
            `A glittering haul of ${trophies} trophies elevates this career into an untouchable golden pantheon.`,
            `Collecting ${trophies} pieces of silverware along the journey, this director effectively mastered every level of competition.`,
            `With ${trophies} trophies secured, they leave behind an era of undisputed supremacy.`
          ];

          const averages = [
            `Walking away with ${trophies} pieces of silverware, they leave behind a respectable and hard-earned legacy.`,
            `Securing ${trophies} major trophies provided plenty of indelible memories for loyal supporters.`,
            `With ${trophies} trophies in the cabinet, they will be remembered fondly across every club they guided.`
          ];

          const randomPick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
          let s1 = seasons < 35 ? randomPick(earlyQuits) : seasons > 35 ? randomPick(endlessCareers) : randomPick(standardCareers);
          let s2 = trophies === 0 ? randomPick(frauds) : trophies >= (seasons * 0.5) ? randomPick(cheatCodes) : randomPick(averages);

          setAiSummary(`${s1} ${s2}`);
          setAiError(null);
        }
      } finally {
        if (isMounted) setIsAiLoading(false);
      }
    };
    
    fetchSummary();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);

  const history = state.history || [];
  const matches = state.totals?.matches || 0;
  const wins = state.totals?.wins || 0;
  const winPct = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const totalTrophies = state.totals?.trophies || 0;

  const managerReputation = Math.min(100, Math.max(0, Math.round(state.reputation || 50)));
  const clubReputation = Math.min(100, Math.max(1, calculateClubReputation(state.club.baseOvr, state.club.tier)));

  const finalCountry = state.club.country || 'GER';
  const { cl: clTitle, el: elTitle, ecl: eclTitle } = getContinentalCupNames(finalCountry);

  const clubStats: Record<
    string,
    {
      name: string;
      color: string;
      logo?: string;
      country?: string;
      seasons: number;
      matches: number;
      wins: number;
      trophyCounts: { cl: number; el: number; ecl: number; cwc: number; bl: number; lower: number; dfb: number; reg: number };
    }
  > = {};

  const totalTrophyCounts = { cl: 0, el: 0, ecl: 0, cwc: 0, bl: 0, lower: 0, dfb: 0, reg: 0, wc: 0 };
  history.forEach((h) => {
    if (h.trophiesThisYear) {
      totalTrophyCounts.cl += h.trophiesThisYear.cl || 0;
      totalTrophyCounts.el += h.trophiesThisYear.el || 0;
      totalTrophyCounts.ecl += h.trophiesThisYear.ecl || 0;
      totalTrophyCounts.cwc = (totalTrophyCounts.cwc || 0) + (h.trophiesThisYear.cwc || 0);
      totalTrophyCounts.bl += h.trophiesThisYear.bl || 0;
      totalTrophyCounts.lower += h.trophiesThisYear.lower || 0;
      totalTrophyCounts.dfb += h.trophiesThisYear.dfb || 0;
      totalTrophyCounts.reg += h.trophiesThisYear.reg || 0;
      totalTrophyCounts.wc += h.trophiesThisYear.wc || 0;
    }

    if (!clubStats[h.clubName]) {
      clubStats[h.clubName] = {
        name: h.clubName,
        color: h.color,
        logo: h.logo,
        country: h.country,
        seasons: 0,
        matches: 0,
        wins: 0,
        trophyCounts: { cl: 0, el: 0, ecl: 0, cwc: 0, bl: 0, lower: 0, dfb: 0, reg: 0 },
      };
    }
    const club = clubStats[h.clubName];
    club.seasons += 1;
    if (!h.bankrupt) {
      club.matches += 34;
      club.wins += (h.wins || 0);
    }
    if (h.trophiesThisYear) {
      club.trophyCounts.cl += h.trophiesThisYear.cl || 0;
      club.trophyCounts.el += h.trophiesThisYear.el || 0;
      club.trophyCounts.ecl += h.trophiesThisYear.ecl || 0;
      club.trophyCounts.cwc = (club.trophyCounts.cwc || 0) + (h.trophiesThisYear.cwc || 0);
      club.trophyCounts.bl += h.trophiesThisYear.bl || 0;
      club.trophyCounts.lower += h.trophiesThisYear.lower || 0;
      club.trophyCounts.dfb += h.trophiesThisYear.dfb || 0;
      club.trophyCounts.reg += h.trophiesThisYear.reg || 0;
    }
  });

  // Aggregate National Team (World Cup) participation stats
  interface NationalTeamTenureStats {
    name: string;
    code?: string;
    flag: string;
    color: string;
    years: number[];
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    trophiesCount: number;
    bestFinish: string;
    campaigns: WorldCupCampaignHistoryRecord[];
  }

  const nationalStats: Record<string, NationalTeamTenureStats> = {};
  const rawCampaigns: WorldCupCampaignHistoryRecord[] = Array.isArray(state.worldCupCampaigns) ? state.worldCupCampaigns : [];

  rawCampaigns.forEach((camp) => {
    const teamName = camp.teamName || 'National Team';
    const ntMeta = NATIONAL_TEAMS.find(
      (nt) => nt.name.toLowerCase() === teamName.toLowerCase() || nt.code === teamName
    );
    const resolvedName = ntMeta?.name || teamName;

    if (!nationalStats[resolvedName]) {
      nationalStats[resolvedName] = {
        name: resolvedName,
        code: ntMeta?.code,
        flag: camp.teamFlag || ntMeta?.flag || '🌍',
        color: ntMeta?.color || '#3b82f6',
        years: [],
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        trophiesCount: 0,
        bestFinish: camp.bestFinish || 'Participant',
        campaigns: []
      };
    }

    const stat = nationalStats[resolvedName];
    stat.campaigns.push(camp);
    if (!stat.years.includes(camp.year)) stat.years.push(camp.year);
    stat.matches += camp.matchesPlayed || 0;
    stat.wins += camp.matchesWon || 0;
    stat.draws += camp.matchesDrawn || 0;
    stat.losses += camp.matchesLost || 0;
    stat.goalsFor += camp.goalsFor || 0;
    stat.goalsAgainst += camp.goalsAgainst || 0;
    if (camp.wonTrophy || (camp.bestFinish && camp.bestFinish.toLowerCase().includes('champ'))) {
      stat.trophiesCount += 1;
    }

    const finishRank = (f: string): number => {
      const lower = (f || '').toLowerCase();
      if (lower.includes('champ') || lower.includes('winner') || lower.includes('meister')) return 6;
      if (lower.includes('final') && !lower.includes('semi') && !lower.includes('quarter')) return 5;
      if (lower.includes('semi')) return 4;
      if (lower.includes('quarter')) return 3;
      if (lower.includes('16') || lower.includes('achtel')) return 2;
      return 1;
    };

    if (finishRank(camp.bestFinish) > finishRank(stat.bestFinish)) {
      stat.bestFinish = camp.bestFinish;
    }
  });

  if (
    Object.keys(nationalStats).length === 0 &&
    ((state.worldCupMatchesPlayed || 0) > 0 ||
      (state.worldCupTournamentsPlayed || 0) > 0 ||
      (state.worldCupTrophies || 0) > 0 ||
      (state.internationalTrophies || 0) > 0 ||
      (totalTrophyCounts.wc || 0) > 0)
  ) {
    const teamName =
      state.worldCupLastTeam ||
      (state.club?.country ? (NATIONAL_TEAMS.find((nt) => nt.code === state.club.country)?.name || 'National Team') : 'National Team');
    const ntMeta = NATIONAL_TEAMS.find(
      (nt) => nt.name.toLowerCase() === teamName.toLowerCase() || nt.code === teamName
    );
    const resolvedName = ntMeta?.name || teamName;
    const won =
      (state.worldCupTrophies || 0) > 0 ||
      (state.internationalTrophies || 0) > 0 ||
      (totalTrophyCounts.wc || 0) > 0;
    nationalStats[resolvedName] = {
      name: resolvedName,
      code: ntMeta?.code,
      flag: ntMeta?.flag || '🌍',
      color: ntMeta?.color || '#3b82f6',
      years: [2026],
      matches: state.worldCupMatchesPlayed || (won ? 7 : 4),
      wins: state.worldCupMatchesWon || (won ? 6 : 2),
      draws: state.worldCupMatchesDrawn || 0,
      losses: state.worldCupMatchesLost || (won ? 1 : 2),
      goalsFor: state.worldCupGoalsFor || (won ? 14 : 6),
      goalsAgainst: state.worldCupGoalsAgainst || (won ? 5 : 5),
      trophiesCount: Math.max(state.worldCupTrophies || 0, state.internationalTrophies || 0, totalTrophyCounts.wc || 0, won ? 1 : 0),
      bestFinish: state.worldCupBestFinish || (won ? 'Champion' : 'World Cup Participant'),
      campaigns: []
    };
  }

  const shareCard = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    
    try {
      const blob = await htmlToImage.toBlob(cardRef.current, {
        quality: 1.0,
        backgroundColor: '#0c0d14',
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
        filter: () => true,
      });
      if (!blob) throw new Error('Failed to create image blob');
      
      const filename = `career-legacy-${state.club.name.replace(/\s+/g, '-')}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      const text = `I completed a ${history.length}-season career with ${state.club.name} and won ${totalTrophies} trophies!`;
      
      const fallbackDownload = () => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      };

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Sporting Director Legacy',
            text: text,
            files: [file]
          });
        } catch (shareErr) {
          console.warn('Share API failed, falling back to download', shareErr);
          fallbackDownload();
        }
      } else {
        fallbackDownload();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !err?.message?.toLowerCase().includes('cancel')) {
        console.warn('Share failed', err);
        onShowToast(t('Failed to export image', 'Bildexport fehlgeschlagen'), 'error');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const countriesUsed = React.useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => {
      if (h.country) set.add(h.country);
    });
    if (state.club?.country) set.add(state.club.country);
    return Array.from(set);
  }, [history, state.club?.country]);

  const hasChangedCountry = countriesUsed.length > 1;
  const singleCountry = countriesUsed[0] || state.club?.country || 'GER';

  const historyTiers = history.map((h: any) => h.tier || 1);
  const minHistoryTier = historyTiers.length > 0 ? Math.min(...historyTiers) : 1;
  const maxHistoryTier = historyTiers.length > 0 ? Math.max(...historyTiers) : 1;
  const totalTierSpan = Math.max(1, maxHistoryTier - minHistoryTier + 1);

  // Stratified positional hierarchy:
  // Tier 1: ranks 1..20
  // Tier 2: ranks 21..40 (21 = 1st in Tier 2)
  // Tier 3: ranks 41..60 (41 = 1st in Tier 3)
  const getStratifiedPos = (h: any) => {
    const tier = Math.max(1, h.tier || 1);
    const pos = Math.max(1, Math.min(20, h.pos || 1));
    return ((tier - 1) * 20) + pos;
  };

  const chartData = {
    labels: history.map((h) => h.year),
    datasets: [
      {
        label: t('Position', 'Platzierung'),
        data: history.map((h) => getStratifiedPos(h)),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.25,
        pointBackgroundColor: history.map((h) => {
          if (h.pos === 1) return '#fbbf24'; // Gold star for champions
          if ((h.tier || 1) === 1) return '#38bdf8'; // Sky blue for top flight
          if ((h.tier || 1) === 2) return '#34d399'; // Emerald for tier 2
          return '#c084fc'; // Purple for tier 3+
        }),
        pointBorderColor: history.map((h) => {
          if (h.pos === 1) return '#ffffff';
          if ((h.tier || 1) === 1) return '#0284c7';
          if ((h.tier || 1) === 2) return '#059669';
          return '#7e22ce';
        }),
        pointBorderWidth: 2,
        pointRadius: history.map((h) => (h.pos === 1 ? 6 : 4.5)),
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(18, 21, 32, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          title: (items: any) => {
            const h = history[items[0].dataIndex];
            return h ? `${h.year} Season · ${h.clubName}` : '';
          },
          label: (context: any) => {
            const h = history[context.dataIndex];
            if (!h) return '';
            const tier = h.tier || 1;
            const country = h.country || singleCountry;
            const leagueInfo = getLeagueInfo(tier, country);
            const leagueName = leagueInfo?.name || `Tier ${tier}`;
            let statusSuffix = '';
            if (h.pos === 1) {
              statusSuffix = tier === 1 ? ' · League Champions 🏆' : ' · Tier Champions & Promoted 🏆';
            } else if (tier > 1 && h.pos <= 2) {
              statusSuffix = ' · Promoted ⬆';
            } else if (tier === 1 && h.pos <= 4) {
              statusSuffix = ' · Continental Cup Qualified ★';
            }
            return [
              `Division: ${leagueName} (Tier ${tier})`,
              `Finish: ${h.pos}. Place${statusSuffix}`,
              h.gf !== undefined && h.ga !== undefined ? `Record: ${h.gf} GF · ${h.ga} GA` : ''
            ].filter(Boolean);
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        display: true,
        reverse: true,
        min: Math.max(1, ((minHistoryTier - 1) * 20) + 1),
        max: Math.max(maxHistoryTier * 20, 20),
        afterBuildTicks: (axis: any) => {
          axis.ticks = [];
          for (let t = minHistoryTier; t <= maxHistoryTier; t++) {
             axis.ticks.push({ value: (t - 1) * 20 + 1 }); // 1st place mark
             if (totalTierSpan <= 5) {
               axis.ticks.push({ value: (t - 1) * 20 + 10 }); // 10th place mark
             }
             if (totalTierSpan <= 3) {
               axis.ticks.push({ value: (t - 1) * 20 + 20 }); // 20th place mark
             }
          }
        },
        ticks: {
          color: '#94a3b8',
          font: { weight: 600 as const, size: 10 },
          callback: (value: any) => {
            const val = Number(value);
            const tier = Math.floor((val - 1) / 20) + 1;
            const posInTier = ((val - 1) % 20) + 1;
            const leagueInfo = getLeagueInfo(tier, singleCountry);
            const tierTag = hasChangedCountry ? `T${tier}` : (leagueInfo?.tag || `T${tier}`);
            
            if (posInTier === 1) return `${tierTag}: 1st 🏆`;
            if (posInTier === 10) return `${tierTag}: 10th`;
            if (posInTier === 20) return `${tierTag}: 20th`;
            return null;
          },
        },
        grid: {
          color: (context: any) => {
            if (!context.tick) return 'rgba(255, 255, 255, 0.04)';
            const val = context.tick.value;
            if (val === 1 || val % 20 === 1) return 'rgba(251, 191, 36, 0.25)'; // Gold line for 1st
            if (val % 20 === 0) return 'rgba(244, 63, 94, 0.2)'; // Red line for bottom
            return 'rgba(255, 255, 255, 0.04)';
          },
        },
      },
      yRight: {
        type: 'linear' as const,
        position: 'right' as const,
        display: true,
        reverse: true,
        min: Math.max(1, ((minHistoryTier - 1) * 20) + 1),
        max: Math.max(maxHistoryTier * 20, 20),
        afterBuildTicks: (axis: any) => {
          axis.ticks = [];
          for (let t = minHistoryTier; t <= maxHistoryTier; t++) {
             // Center label explicitly in the middle of each tier's bracket
             axis.ticks.push({ value: (t - 1) * 20 + 10 }); 
          }
        },
        ticks: {
          color: '#71717a',
          font: { weight: 600 as const, size: 10 },
          callback: (value: any) => {
            const val = Number(value);
            const tier = Math.floor((val - 1) / 20) + 1;
            const posInTier = ((val - 1) % 20) + 1;
            if (posInTier === 10) return `Tier ${tier}`;
            return null;
          },
        },
        grid: {
          drawOnChartArea: false, // Prevent duplicate horizontal grid lines across the chart
        }
      },
      x: {
        ticks: { color: '#71717a', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
      },
    },
  };

  const bestFinish = React.useMemo(() => {
    if (!history.length) return null;
    let best = history[0];
    for (const h of history) {
      if ((h.tier || 1) < (best.tier || 1) || ((h.tier || 1) === (best.tier || 1) && (h.pos || 99) < (best.pos || 99))) {
        best = h;
      }
    }
    return best;
  }, [history]);

  const stadiumMetrics = React.useMemo(() => {
    if (!history.length) return null;
    let peakAtt = 0;
    let peakAttSeason: any = null;
    let peakCap = state.club.stadium || 0;
    let totalCrowd = 0;
    let totalUtil = 0;

    for (const h of history) {
      const att = h.att || 0;
      totalCrowd += (att * 17);
      totalUtil += (h.util || 0);
      if (att > peakAtt) {
        peakAtt = att;
        peakAttSeason = h;
      }
      const cap = (h as any).stadiumCapacity || 0;
      if (cap > peakCap) {
        peakCap = cap;
      }
    }

    const avgUtil = history.length ? Math.round(totalUtil / history.length) : 0;
    return {
      peakAtt,
      peakAttSeason,
      peakCap,
      totalCrowd: (state.totals?.att && state.totals.att > totalCrowd) ? state.totals.att : totalCrowd,
      avgUtil,
    };
  }, [history, state.totals?.att, state.club.stadium]);

  return (
    <div className={onClose ? "fixed inset-0 z-50 bg-black/80 flex justify-center overflow-y-auto backdrop-blur-2xl p-3 sm:p-6 text-white animate-in fade-in duration-100" : "w-full text-white"}>
      <div className={`max-w-4xl mx-auto px-2 sm:px-4 pb-20 w-full relative ${onClose ? 'mt-4' : 'mt-4'}`}>
        
        {/* Apple-style Frosted Close Button */}
        {onClose && (
          <button 
            aria-label="Close modal" 
            onClick={onClose} 
            className="absolute -top-2 right-2 sm:-right-2 bg-white/10 hover:bg-white/20 active:scale-95 w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white border border-white/15 z-10 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition cursor-pointer"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        )}

        {/* Ambient Sky-Blue & Muted Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Top Header Banner - Minimalist Apple Style */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-400/25 text-sky-300 text-xs font-semibold px-3 py-1 rounded-lg tracking-wide uppercase mb-3 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <i className="fas fa-award text-xs text-sky-400"></i>
            <span>{t('Career Completed', 'Karriere Abgeschlossen')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {(state.managerName || (lang === 'de' ? 'Der Manager' : 'The Manager'))}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-medium flex items-center justify-center gap-2 flex-wrap">
            <span className="tabular-nums">{history.length}</span> {t('Seasons as Director', 'Saisons als Direktor')}
            <span className="text-zinc-600">•</span>
            <span className="tabular-nums">{wins}</span> {t('Wins', 'Siege')}
            <span className="text-zinc-600">•</span>
            <span className="tabular-nums">{totalTrophies}</span> {t('Trophies', 'Titel')}
          </p>
        </div>

        {/* Apple Frosted Segmented Control (Progressive Disclosure) */}
        <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08] backdrop-blur-2xl mb-8 gap-1 max-w-xl mx-auto shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'card'
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <i className="fas fa-id-card text-xs text-sky-400"></i>
            <span>{t('Director Card', 'Direktor-Karte')}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <i className="fas fa-chart-line text-xs text-sky-400"></i>
            <span>{t('Progression', 'Verlauf')}</span>
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'clubs'
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <i className="fas fa-shield-halved text-xs text-sky-400"></i>
            <span>{t('Clubs', 'Vereine')}</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <i className="fas fa-crown text-xs text-amber-400"></i>
            <span>{t('Hall of Fame', 'Rangliste')}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* Tab 1: Director Share Card & Legacy */}
        {/* ========================================================================= */}
        {activeTab === 'card' && (
          <div className="flex flex-col items-center w-full max-w-md mx-auto mb-8 animate-fadeIn">
            <div className="w-full flex flex-col">
              <div
                ref={cardRef}
                id="marketing-share-card"
                className="bg-gradient-to-b from-[#181b28] via-[#11131c] to-[#0c0d14] border border-white/[0.12] rounded-[32px] p-6 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col items-center justify-between relative overflow-hidden w-full min-h-[500px] sm:min-h-[530px]"
              >
                {/* Subtle Ambient Glows */}
                <div className="absolute top-[-50px] left-[-50px] w-56 h-56 bg-sky-500/15 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-50px] right-[-50px] w-56 h-56 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
                {state.club.color && (
                  <div 
                    className="absolute top-1/3 right-[-30px] w-48 h-48 rounded-full blur-[90px] opacity-10 pointer-events-none"
                    style={{ backgroundColor: state.club.color }}
                  />
                )}

                {/* Card Header */}
                <div className="w-full text-center z-10">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-sky-300 font-semibold uppercase tracking-widest mb-1.5">
                    <i className="fas fa-crown text-amber-400 text-xs"></i>
                    <span>Sporting Director Legend</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight break-words">
                    {(state.managerName || (lang === 'de' ? 'Der Manager' : 'The Manager'))}
                  </h2>
                </div>

                {/* Center Club Badge & Rep Badges (Zero-Pill Discipline) */}
                <div className="flex flex-col items-center z-10 my-3 w-full">
                  <div className="relative mb-2">
                    <ClubLogo
                      name={state.club.name}
                      id={state.club.id}
                      color={state.club.color}
                      logo={state.club.logo}
                      fallbackLogo={state.club.fallbackLogo}
                      isModActive={isModActive}
                      className="w-16 h-16 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
                      fallbackClassName="w-16 h-16 text-2xl rounded-2xl shadow-lg border border-white/10 flex items-center justify-center font-bold text-white shrink-0"
                    />
                  </div>
                  <div className="text-sm font-bold text-white tracking-wide mb-2.5 text-center">
                    {state.club.name}
                  </div>

                  {/* Refined Stat Chips */}
                  <div className="flex items-center gap-2 flex-wrap justify-center w-full">
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1 flex items-center gap-2 shadow-sm">
                      <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Final OVR
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${getOvrColor(state.club.baseOvr)}`}>
                        {state.club.baseOvr}
                      </span>
                    </div>

                    <div className="bg-sky-500/10 border border-sky-400/25 rounded-xl px-3 py-1 flex items-center gap-2 shadow-sm">
                      <span className="text-[9px] font-semibold text-sky-400 uppercase tracking-wider">
                        {t('Director Rep', 'Direktor-Ansehen')}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-sky-300">
                        {managerReputation}/100
                      </span>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-400/25 rounded-xl px-3 py-1 flex items-center gap-2 shadow-sm">
                      <span className="text-[9px] font-semibold text-purple-400 uppercase tracking-wider">
                        {t('Club Rep', 'Vereins-Ansehen')}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-purple-300">
                        {clubReputation}/100
                      </span>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-400/25 rounded-xl px-3 py-1 flex items-center gap-2 shadow-sm">
                      <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">
                        {t('Career Score', 'Karriere-Punkte')}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-emerald-300">
                        {(state.careerScore || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Final Head Coach card */}
                  {state.currentCoach && (
                    <div className="mt-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 w-full max-w-sm flex justify-between items-center z-10 shadow-sm backdrop-blur-md">
                      <div className="text-left">
                        <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                          {t('Final Head Coach', 'Letzter Cheftrainer')}
                        </div>
                        <div className="text-sm font-bold text-white">{state.currentCoach.name}</div>
                        <div className="text-[11px] text-sky-300 font-medium">{state.currentCoach.style}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-extrabold text-base tabular-nums">+{state.currentCoach.ovrBoost}</div>
                        <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">OVR Boost</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bento Stat Badges */}
                <div className="grid grid-cols-3 w-full gap-2 z-10 my-2">
                  <div className="bg-white/[0.03] rounded-2xl p-2.5 border border-white/[0.07] text-center flex flex-col items-center justify-center">
                    <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                      {t('Seasons', 'Saisons')}
                    </div>
                    <div className="text-base font-extrabold text-white tabular-nums">{history.length}</div>
                  </div>

                  <div className="bg-white/[0.03] rounded-2xl p-2.5 border border-white/[0.07] text-center flex flex-col items-center justify-center">
                    <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                      Win %
                    </div>
                    <div className="text-base font-extrabold text-sky-400 tabular-nums">{winPct}%</div>
                  </div>

                  <div className="bg-white/[0.03] rounded-2xl p-2.5 border border-white/[0.07] text-center flex flex-col items-center justify-center">
                    <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                      {t('Wins', 'Siege')}
                    </div>
                    <div className="text-base font-extrabold text-white tabular-nums">{wins}</div>
                  </div>
                </div>
                
                {/* Total Trophy Cabinet Showcase */}
                <div className="bg-white/[0.03] rounded-2xl p-3.5 border border-white/[0.07] flex flex-col gap-2.5 my-2 w-full">
                  <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
                    <i className="fas fa-trophy text-amber-400"></i>
                    <span>{t('Total Trophy Cabinet', 'Gesamter Trophäenschrank')}</span>
                    <span className="text-white font-bold tabular-nums">({totalTrophies})</span>
                  </div>

                  {totalTrophies === 0 ? (
                    <div className="text-center text-xs text-zinc-500 italic py-2">{t('No titles won', 'Keine Titel gewonnen')}</div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      {(totalTrophyCounts.wc > 0 || (state.internationalTrophies || 0) > 0) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWorldCupHistory?.();
                          }}
                          className="relative cursor-pointer group hover:scale-105 transition-transform"
                          title="World Cup Champion (Click to view World Cup Archive)"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 border border-yellow-200 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.5)] z-10">
                            <i className="fas fa-trophy text-amber-950 text-base"></i>
                          </div>
                          {Math.max(totalTrophyCounts.wc, state.internationalTrophies || 0) > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{Math.max(totalTrophyCounts.wc, state.internationalTrophies || 0)}
                            </span>
                          )}
                        </button>
                      )}

                      {totalTrophyCounts.cl > 0 && (
                        <div className="relative" title={clTitle}>
                          <div className="w-9 h-9 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center shadow-[0_0_10px_rgba(203,213,225,0.4)] z-10">
                            <i className="fas fa-trophy text-slate-800 text-base"></i>
                          </div>
                          {totalTrophyCounts.cl > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{totalTrophyCounts.cl}
                            </span>
                          )}
                        </div>
                      )}

                      {totalTrophyCounts.el > 0 && (
                        <div className="relative" title={elTitle}>
                          <div className="w-9 h-9 rounded-xl bg-amber-600 border border-amber-500 flex items-center justify-center shadow-[0_0_10px_rgba(217,119,6,0.4)] z-10">
                            <i className="fas fa-trophy text-amber-100 text-base"></i>
                          </div>
                          {totalTrophyCounts.el > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{totalTrophyCounts.el}
                            </span>
                          )}
                        </div>
                      )}

                      {totalTrophyCounts.ecl > 0 && (
                        <div className="relative" title={eclTitle}>
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 border border-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(5,150,105,0.4)] z-10">
                            <i className="fas fa-trophy text-emerald-100 text-base"></i>
                          </div>
                          {totalTrophyCounts.ecl > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{totalTrophyCounts.ecl}
                            </span>
                          )}
                        </div>
                      )}

                      {totalTrophyCounts.cwc > 0 && (
                        <div className="relative" title="Global Club Cup">
                          <div className="w-9 h-9 rounded-xl bg-sky-900 border border-sky-600 flex items-center justify-center z-10">
                            <i className="fas fa-globe text-yellow-400 text-base"></i>
                          </div>
                          {totalTrophyCounts.cwc > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{totalTrophyCounts.cwc}
                            </span>
                          )}
                        </div>
                      )}

                      {totalTrophyCounts.bl > 0 && (
                        <div className="relative" title={t('League Titles', 'Liga-Titel')}>
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.4)] z-10">
                            <i className="fas fa-medal text-white text-base"></i>
                          </div>
                          {totalTrophyCounts.bl > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{totalTrophyCounts.bl}
                            </span>
                          )}
                        </div>
                      )}

                      {totalTrophyCounts.dfb > 0 && (
                        <div className="relative" title={t('Domestic Trophies', 'Nationale Pokale')}>
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 border border-slate-200 flex items-center justify-center shadow-[0_0_10px_rgba(203,213,225,0.4)] z-10">
                            <i className="fas fa-trophy text-slate-700 text-base"></i>
                          </div>
                          {totalTrophyCounts.dfb > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{totalTrophyCounts.dfb}
                            </span>
                          )}
                        </div>
                      )}

                      {totalTrophyCounts.lower > 0 && (
                        <div className="relative" title="Lower League Title">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center z-10">
                            <i className="fas fa-medal text-zinc-400 text-xs"></i>
                          </div>
                          {totalTrophyCounts.lower > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{totalTrophyCounts.lower}
                            </span>
                          )}
                        </div>
                      )}

                      {totalTrophyCounts.reg > 0 && (
                        <div className="relative" title={getDomesticCupInfo(state?.club?.country || 'GER', 4, state?.club?.name, state?.club?.id).name || 'Regional Cup'}>
                          <div className="w-8 h-8 rounded-lg bg-amber-900/80 border border-amber-700 flex items-center justify-center z-10">
                            <i className="fas fa-shield-halved text-amber-300 text-xs"></i>
                          </div>
                          {totalTrophyCounts.reg > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/20 z-20 tabular-nums">
                              x{totalTrophyCounts.reg}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Career Analysis Card */}
                <div className="w-full bg-white/[0.03] rounded-2xl p-4 my-2 border border-white/[0.07] relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-400 opacity-60" />
                  <div className="text-[10px] text-sky-300 font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <i className="fas fa-wand-magic-sparkles text-sky-400 text-xs"></i>
                    <span>{t('Career Analysis', 'Karriere-Analyse')}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
                    {isAiLoading ? (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <i className="fas fa-circle-notch fa-spin text-xs text-sky-400"></i>
                        <span>Analyzing career legacy...</span>
                      </div>
                    ) : aiError === 'KEY_MISSING' ? (
                      <div className="text-zinc-400 italic text-xs">
                        API Key not found. Add your Gemini API Key in Settings &gt; Secrets to enable the AI Pundit.
                      </div>
                    ) : aiError ? (
                      <div className="text-zinc-400 italic text-xs">Analyzing offline...</div>
                    ) : (
                      aiSummary
                    )}
                  </div>
                </div>

                {/* Footer Watermark */}
                <div className="w-full text-center mt-3 z-10 opacity-50">
                  <div className="text-[9px] font-semibold text-zinc-400 tracking-widest uppercase">
                    Sporting Director Legend • Career Legacy
                  </div>
                </div>
              </div>
            </div>

            {/* Apple Actions Grid */}
            <div className="flex flex-col gap-3 mt-6 w-full">
              {!onClose && (
                <button 
                  onClick={onShowLeaderboard}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3.5 px-6 rounded-2xl shadow-[0_4px_24px_rgba(245,158,11,0.25)] transition active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <i className="fas fa-crown text-base"></i>
                  <span>{t('View Global Leaderboard', 'Globale Rangliste')}</span>
                </button>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={shareCard}
                  disabled={isDownloading}
                  className="w-full sm:flex-1 bg-sky-500 hover:bg-sky-400 active:scale-[0.99] disabled:opacity-60 text-white font-semibold py-3.5 px-6 rounded-2xl transition shadow-[0_4px_20px_rgba(56,189,248,0.25)] flex items-center justify-center gap-2 text-sm cursor-pointer border border-sky-400/30"
                >
                  {isDownloading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-share-nodes"></i>}
                  <span>{isDownloading ? t('Processing...', 'Wird erstellt...') : t('Share Director Card', 'Direktor-Karte Teilen')}</span>
                </button>
                
                {!onClose && (
                  <button
                    onClick={onReset}
                    className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold py-3.5 px-6 rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.25)] transition flex items-center justify-center gap-2 text-sm cursor-pointer border border-emerald-500/30"
                  >
                    <i className="fas fa-redo"></i>
                    <span>{t('Start New Career', 'Neue Karriere')}</span>
                  </button>
                )}
              </div>
              
              {!onClose && (
                <button
                  onClick={onContinueEndless ? onContinueEndless : undefined}
                  disabled={!onContinueEndless || history.length < 35 || state.endlessModeActive}
                  className="w-full bg-white/[0.05] hover:bg-white/[0.09] disabled:bg-white/[0.02] disabled:text-zinc-600 text-zinc-300 font-semibold py-3.5 px-6 rounded-2xl transition active:scale-[0.99] flex items-center justify-center gap-2 text-sm border border-white/[0.08] disabled:border-white/[0.04] disabled:cursor-not-allowed group relative cursor-pointer"
                  title={history.length < 35 ? t('Complete 35 seasons to unlock', 'Absolviere 35 Saisons zum Freischalten') : ''}
                >
                  <i className={`fas fa-infinity ${(history.length < 35 || state.endlessModeActive) ? 'text-zinc-700' : 'text-sky-400'}`}></i>
                  <span>{t('Endless Mode', 'Endlosmodus')}</span>
                  {(!onContinueEndless || history.length < 35 || state.endlessModeActive) && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                        {state.endlessModeActive ? 'Endless Mode Active' : 'Requires 35 Seasons'}
                      </span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Tab 2: Career League Progression */}
        {/* ========================================================================= */}
        {activeTab === 'chart' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#121520]/90 rounded-[28px] p-5 sm:p-7 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400">
                    <i className="fas fa-chart-line text-sm"></i>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {t('Career League Progression', 'Karriere-Ligenverlauf')}
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium">
                      {t('Division hierarchy and season finish trends over time', 'Entwicklung der Ligapositionen über Zeit')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-sky-300 bg-sky-500/10 border border-sky-400/20 px-3 py-1 rounded-lg tabular-nums">
                  {history.length} {t('Seasons', 'Saisons')}
                </span>
              </div>

              {/* Tier & Honour Visual Guide */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 text-[10px] font-semibold text-zinc-400 flex-wrap border-b border-white/[0.04] pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-sky-300" />
                  <span>{t('Tier 1 (Top Flight)', '1. Liga (Oberhaus)')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300" />
                  <span>{t('Tier 2 (Second Division)', '2. Liga (Unterhaus)')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 border border-purple-300" />
                  <span>{t('Tier 3+ (Lower Leagues)', '3.+ Liga (Basis)')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-trophy text-amber-400 text-xs" />
                  <span className="text-amber-300 font-bold">{t('Champions / Promoted', 'Meister / Aufstieg')}</span>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full relative">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Progressive Disclosure: Career Milestones Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 backdrop-blur-xl">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                  {t('Peak Division Finish', 'Beste Platzierung')}
                </div>
                <div className="text-xl font-extrabold text-white tabular-nums">
                  {bestFinish ? `${bestFinish.pos}. Place` : 'N/A'}
                </div>
                <div className="text-xs text-sky-300 font-medium truncate mt-0.5">
                  {bestFinish ? `${bestFinish.clubName} (${bestFinish.year})` : ''}
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 backdrop-blur-xl">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                  {t('Overall Match Record', 'Gesamtbilanz')}
                </div>
                <div className="text-xl font-extrabold text-white tabular-nums">
                  {wins} <span className="text-xs text-zinc-400 font-normal">/ {matches}</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-0.5 tabular-nums">
                  {winPct}% {t('Win Rate', 'Siegquote')}
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 backdrop-blur-xl">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1">
                  {t('Silverware Efficiency', 'Titelausbeute')}
                </div>
                <div className="text-xl font-extrabold text-amber-400 tabular-nums">
                  {totalTrophies} <span className="text-xs text-zinc-400 font-normal">{t('Cups', 'Pokale')}</span>
                </div>
                <div className="text-xs text-zinc-300 font-medium mt-0.5 tabular-nums">
                  {history.length > 0 ? (totalTrophies / history.length).toFixed(2) : '0.00'} {t('per season', 'pro Saison')}
                </div>
              </div>
            </div>

            {/* Crowd & Stadium Expansion Footprint */}
            {stadiumMetrics && (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3 border-b border-white/[0.05] pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400 text-xs">
                      <i className="fas fa-users"></i>
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {t('Crowd & Stadium Infrastructure', 'Zuschauer & Stadion-Infrastruktur')}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06] tabular-nums">
                    {t('Avg. Utilization', 'Ø Auslastung')}: {stadiumMetrics.avgUtil}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                      {t('Career Spectators', 'Gesamtzuschauer')}
                    </div>
                    <div className="text-lg font-extrabold text-sky-300 tabular-nums">
                      {formatNum(stadiumMetrics.totalCrowd)}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                      {t('Total home turnstile attendance', 'Heimspiel-Stadionbesucher')}
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                      {t('Peak Season Turnout', 'Rekord-Zuschauerschnitt')}
                    </div>
                    <div className="text-lg font-extrabold text-white tabular-nums">
                      {formatNum(stadiumMetrics.peakAtt)}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                      {stadiumMetrics.peakAttSeason ? `${stadiumMetrics.peakAttSeason.clubName} ('${String(stadiumMetrics.peakAttSeason.year).slice(-2)})` : '—'}
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                      {t('Peak Arena Capacity', 'Max. Stadionkapazität')}
                    </div>
                    <div className="text-lg font-extrabold text-emerald-400 tabular-nums">
                      {formatNum(stadiumMetrics.peakCap)} <span className="text-xs text-zinc-400 font-normal">{t('Seats', 'Plätze')}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                      {t('Highest capacity reached', 'Höchster Ausbauzustand')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Season Journey Breakdown (Chronological Season-by-Season Log) */}
            <div className="bg-[#121520]/90 rounded-[28px] p-5 sm:p-7 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-400 text-xs">
                    <i className="fa-solid fa-list-ol"></i>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {t('Season-by-Season Division Journey', 'Saison-Verlauf & Platzierungen')}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {t('Exact finishes, promotions, and achievements across every campaign', 'Genaue Platzierungen, Aufstiege und Titel über alle Spielzeiten')}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
                  {history.length} {t('Completed Seasons', 'Gespielte Saisons')}
                </span>
              </div>

              <div className="space-y-2">
                {history.map((h: any, idx: number) => {
                  const tier = h.tier || 1;
                  const country = h.country || singleCountry;
                  const leagueInfo = getLeagueInfo(tier, country);
                  const isChamp = h.pos === 1;
                  const nextH = history[idx + 1];
                  const sameClubNext = Boolean(nextH && (
                    (h.clubId != null && nextH.clubId != null && String(nextH.clubId) === String(h.clubId)) ||
                    (nextH.clubName && h.clubName && nextH.clubName.toLowerCase().trim() === h.clubName.toLowerCase().trim())
                  ));
                  const isCurrentClubLast = idx === history.length - 1 && Boolean(
                    (h.clubId != null && state.club?.id != null && String(state.club.id) === String(h.clubId)) ||
                    (state.club?.name && h.clubName && state.club.name.toLowerCase().trim() === h.clubName.toLowerCase().trim())
                  );
                  const hasKnownNextTier = sameClubNext || isCurrentClubLast;
                  const nextTierVal = sameClubNext ? (nextH.tier || tier) : (isCurrentClubLast ? (state.club?.tier || tier) : tier);
                  const maxCountryTier = getMaxTier(country);
                  const isPromo = !isChamp && tier > 1 && (
                    h.status === 'P' ||
                    (hasKnownNextTier ? nextTierVal < tier : h.pos <= 2)
                  );
                  const isTop4 = !isChamp && tier === 1 && h.pos <= 4;
                  const isRelegated = !isChamp && tier < maxCountryTier && !h.survived && (
                    h.status === 'R' ||
                    h.financialRelegation ||
                    (hasKnownNextTier ? nextTierVal > tier : h.pos >= 17)
                  );

                  return (
                    <div
                      key={`journey-${h.year}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all"
                    >
                      {/* Left: Year & Club */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-sky-300 tabular-nums w-10 shrink-0">
                          {h.year}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white truncate">
                            {h.clubName}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                            <span className={tier === 1 ? 'text-sky-300 font-semibold' : tier === 2 ? 'text-emerald-300 font-semibold' : 'text-purple-300 font-semibold'}>
                              {leagueInfo?.name || `Tier ${tier}`}
                            </span>
                            <span className="text-zinc-600">·</span>
                            <span>Tier {tier}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Exact Finish & Status */}
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold tabular-nums">
                            {isChamp && <i className="fa-solid fa-trophy text-amber-400 text-xs" />}
                            <span className={isChamp ? 'text-amber-300' : isTop4 ? 'text-sky-300' : isPromo ? 'text-emerald-300' : isRelegated ? 'text-rose-400' : 'text-white'}>
                              {h.pos}. Place
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold tracking-wide">
                            {isChamp && (tier === 1 ? (
                              <span className="text-amber-300">{t('League Champions', 'Meister')}</span>
                            ) : (
                              <span className="text-emerald-400">{t('Tier Champions & Promoted', 'Meister & Aufstieg')}</span>
                            ))}
                            {!isChamp && isPromo && (
                              <span className="text-emerald-400">
                                {tier > 2 ? t(`Promoted to Tier ${tier - 1} ⬆`, `Aufstieg in ${tier - 1}. Liga ⬆`) : t('Promoted to Tier 1 ⬆', 'Aufstieg in 1. Liga ⬆')}
                              </span>
                            )}
                            {!isChamp && isTop4 && (
                              <span className="text-sky-300">{t('Continental Qualified ★', 'Kontinental-Quali ★')}</span>
                            )}
                            {isRelegated && (
                              <span className="text-rose-400">{t('Relegated ⬇', 'Abstieg ⬇')}</span>
                            )}
                            {!isChamp && !isPromo && !isTop4 && !isRelegated && (
                              <span className="text-zinc-500">{t('Mid-Table', 'Mittelfeld')}</span>
                            )}
                          </div>
                        </div>

                        {/* Optional Goal Record & Attendance */}
                        <div className="hidden sm:flex flex-col items-end pl-3 border-l border-white/[0.08] text-[10px] text-zinc-400 tabular-nums">
                          <span>{h.gf || 0} : {h.ga || 0} {t('Goals', 'Tore')}</span>
                          {h.att ? <span>{formatNum(h.att)} {t('Fans', 'Fans')}</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Tab 3: Clubs & Silverware History */}
        {/* ========================================================================= */}
        {activeTab === 'clubs' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                  <i className="fas fa-trophy text-amber-400"></i>
                  <span>
                    {Object.keys(nationalStats).length > 0
                      ? t('Club & International History & Trophy Cabinet', 'Vereins- & Länderspielhistorie & Titel')
                      : t('Club History & Trophy Cabinet', 'Vereinshistorie & Titel')}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  {Object.keys(nationalStats).length > 0
                    ? t('Records, match ratios, and trophies won across each club and international tenure', 'Bilanzen und Trophäen nach Verein und Nationalteam')
                    : t('Records, match ratios, and trophies won across each tenure', 'Bilanzen und Trophäen nach Verein')}
                </p>
              </div>
              <span className="text-xs font-semibold text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-lg tabular-nums">
                {Object.keys(nationalStats).length > 0
                  ? `${Object.keys(clubStats).length} ${t('Clubs', 'Vereine')} · ${Object.keys(nationalStats).length} ${Object.keys(nationalStats).length === 1 ? t('National Team', 'Nationalteam') : t('National Teams', 'Nationalteams')}`
                  : `${Object.keys(clubStats).length} ${t('Clubs Managed', 'Vereine')}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(clubStats).map((c) => {
                const domCount =
                  (c.trophyCounts.bl || 0) +
                  (c.trophyCounts.dfb || 0) +
                  (c.trophyCounts.lower || 0) +
                  (c.trophyCounts.reg || 0);
                const intlCount =
                  (c.trophyCounts.cl || 0) +
                  (c.trophyCounts.el || 0) +
                  (c.trophyCounts.ecl || 0) + 
                  (c.trophyCounts.cwc || 0);

                const matchClub = ALL_CLUBS.find(club => club.name === c.name);
                const clubCountry = c.country || matchClub?.country || 'GER';
                const clubLeagueTitle = getLeagueInfo(1, clubCountry).name;
                const clubCupTitle = getDomesticCupInfo(clubCountry, 1, c.name, matchClub?.id).name || 'National Cup';
                const { cl: clubClTitle, el: clubElTitle, ecl: clubEclTitle } = getContinentalCupNames(clubCountry);

                return (
                  <div
                    key={c.name}
                    className="bg-[#121520]/90 rounded-[28px] p-5 border border-white/[0.08] hover:border-white/[0.16] shadow-xl flex flex-col justify-between relative overflow-hidden backdrop-blur-2xl transition duration-200"
                  >
                    <div>
                      <div className="flex items-center gap-3.5 mb-4">
                        <ClubLogo
                          name={c.name}
                          id={matchClub?.id}
                          color={c.color}
                          logo={c.logo || matchClub?.logo}
                          fallbackLogo={matchClub?.fallbackLogo}
                          isModActive={isModActive}
                          className="w-12 h-12 object-contain drop-shadow shrink-0"
                          fallbackClassName="w-12 h-12 text-lg rounded-xl shadow flex items-center justify-center font-bold text-white shrink-0 border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-white tracking-tight break-words">{c.name}</h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            <span className="tabular-nums">{c.seasons}</span> {c.seasons === 1 ? t('Season', 'Saison') : t('Seasons', 'Saisons')}
                          </p>
                        </div>
                      </div>

                      {/* Stats bento */}
                      <div className="grid grid-cols-3 gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] mb-4 text-center">
                        <div>
                          <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                            {t('Wins', 'Siege')}
                          </div>
                          <div className="text-sm font-extrabold text-emerald-400 tabular-nums">{c.wins}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                            {t('Matches', 'Spiele')}
                          </div>
                          <div className="text-sm font-extrabold text-white tabular-nums">{c.matches}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                            Win %
                          </div>
                          <div className="text-sm font-extrabold text-sky-400 tabular-nums">
                            {c.matches > 0 ? Math.round((c.wins / c.matches) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trophy Cabinet showcase inside club card */}
                    <div className="bg-black/40 rounded-2xl p-3.5 border border-white/[0.06] flex flex-col gap-2.5 relative overflow-hidden shadow-inner">
                      <div className="text-[10px] text-amber-400/90 font-semibold uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
                        <i className="fas fa-trophy text-[9px]"></i>
                        <span>{t('Trophy Cabinet', 'Trophäenschrank')}</span>
                        <span className="text-white font-bold tabular-nums">({domCount + intlCount})</span>
                      </div>

                      {(domCount + intlCount) === 0 ? (
                        <div className="text-center text-xs text-zinc-500 italic py-2">{t('No titles won', 'Keine Titel gewonnen')}</div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                          {c.trophyCounts.cl > 0 && (
                            <div className="relative group flex flex-col items-center">
                              <div className="w-10 h-10 flex items-center justify-center relative transition-transform group-hover:scale-105" title={clubClTitle}>
                                <i className="fas fa-trophy text-2xl text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)]"></i>
                                {c.trophyCounts.cl > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                    x{c.trophyCounts.cl}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-center mt-1 font-semibold max-w-[70px] truncate">{clubClTitle}</div>
                            </div>
                          )}

                          {c.trophyCounts.el > 0 && (
                            <div className="relative group flex flex-col items-center">
                              <div className="w-10 h-10 flex items-center justify-center relative transition-transform group-hover:scale-105" title={clubElTitle}>
                                <i className="fas fa-trophy text-2xl text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]"></i>
                                {c.trophyCounts.el > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                    x{c.trophyCounts.el}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-center mt-1 font-semibold max-w-[70px] truncate">{clubElTitle}</div>
                            </div>
                          )}

                          {c.trophyCounts.ecl > 0 && (
                            <div className="relative group flex flex-col items-center">
                              <div className="w-10 h-10 flex items-center justify-center relative transition-transform group-hover:scale-105" title={clubEclTitle}>
                                <i className="fas fa-trophy text-2xl text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]"></i>
                                {c.trophyCounts.ecl > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                    x{c.trophyCounts.ecl}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-center mt-1 font-semibold max-w-[70px] truncate">{clubEclTitle}</div>
                            </div>
                          )}

                          {c.trophyCounts.cwc > 0 && (
                            <div className="relative group flex flex-col items-center">
                              <div className="w-10 h-10 flex items-center justify-center relative transition-transform group-hover:scale-105" title="Global Club Cup">
                                <i className="fas fa-globe text-2xl text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]"></i>
                                {c.trophyCounts.cwc > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                    x{c.trophyCounts.cwc}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-center mt-1 font-semibold max-w-[70px] truncate">Club Cup</div>
                            </div>
                          )}

                          {c.trophyCounts.bl > 0 && (
                            <div className="relative group flex flex-col items-center">
                              <div className="w-10 h-10 flex items-center justify-center relative transition-transform group-hover:scale-105" title={clubLeagueTitle}>
                                {getTrophyImage('bl', clubCountry) ? (
                                  <img 
                                    src={getTrophyImage('bl', clubCountry)} 
                                    alt="League" 
                                    className="w-8 h-8 object-contain" 
                                    style={{ filter: getTrophyFilter('bl') }} 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                                  />
                                ) : (
                                  <i className="fas fa-medal text-2xl text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]"></i>
                                )}
                                {c.trophyCounts.bl > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                    x{c.trophyCounts.bl}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-center mt-1 font-semibold max-w-[70px] truncate">{clubLeagueTitle}</div>
                            </div>
                          )}

                          {c.trophyCounts.dfb > 0 && (
                            <div className="relative group flex flex-col items-center">
                              <div className="w-10 h-10 flex items-center justify-center relative transition-transform group-hover:scale-105" title={clubCupTitle}>
                                <i className="fas fa-trophy text-2xl text-slate-300 drop-shadow-[0_0_10px_rgba(148,163,184,0.4)]"></i>
                                {c.trophyCounts.dfb > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                    x{c.trophyCounts.dfb}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-center mt-1 font-semibold max-w-[70px] truncate">{clubCupTitle}</div>
                            </div>
                          )}

                          {c.trophyCounts.lower > 0 && (
                            <div className="relative group flex flex-col items-center">
                              <div className="w-9 h-9 flex items-center justify-center relative" title={t("Lower League", "Untere Liga")}>
                                <i className="fas fa-medal text-xl text-zinc-400"></i>
                                {c.trophyCounts.lower > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                    x{c.trophyCounts.lower}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-center mt-1 font-semibold max-w-[70px] truncate">Lower Div</div>
                            </div>
                          )}

                          {c.trophyCounts.reg > 0 && (
                            <div className="relative group flex flex-col items-center">
                              <div className="w-9 h-9 flex items-center justify-center relative" title={getDomesticCupInfo(clubCountry, 4, c.name, matchClub?.id).name || 'Regional Cup'}>
                                <i className="fas fa-shield-halved text-xl text-amber-300"></i>
                                {c.trophyCounts.reg > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                    x{c.trophyCounts.reg}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-zinc-400 text-center mt-1 font-semibold max-w-[70px] truncate">Regional</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* National Team Tenures & World Cup Silverware */}
              {Object.values(nationalStats).map((nat) => {
                const winPct = nat.matches > 0 ? Math.round((nat.wins / nat.matches) * 100) : 0;
                const sortedYears = [...nat.years].sort((a, b) => a - b);
                const yearsLabel = sortedYears.length > 0
                  ? sortedYears.map((y) => `${y} ${t('World Cup', 'WM')}`).join(', ')
                  : t('World Cup Campaign', 'WM-Kampagne');

                return (
                  <div
                    key={`nat-${nat.name}`}
                    onClick={() => onOpenWorldCupHistory?.()}
                    className="bg-[#121520]/90 rounded-[28px] p-5 border border-amber-500/25 hover:border-amber-400/50 shadow-xl flex flex-col justify-between relative overflow-hidden backdrop-blur-2xl transition duration-200 cursor-pointer group"
                    title={t('Click to view World Cup tournament archive', 'Klicken für WM-Archiv')}
                  >
                    {/* Top ambient gold accent */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-400/70 to-amber-500/0"></div>

                    <div>
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/15 to-yellow-400/25 border border-amber-400/30 flex items-center justify-center text-2xl drop-shadow shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          {nat.flag}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base font-bold text-white tracking-tight break-words">
                              {nat.name}
                            </h3>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 tracking-wider shrink-0">
                              {t('National Team', 'Nationalelf')}
                            </span>
                          </div>
                          <p className="text-xs text-amber-300/80 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                            <i className="fa-solid fa-earth-americas text-[10px] shrink-0 text-amber-400"></i>
                            <span className="truncate">{yearsLabel}</span>
                          </p>
                        </div>
                      </div>

                      {/* Stats bento */}
                      <div className="grid grid-cols-3 gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06] mb-4 text-center">
                        <div>
                          <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                            {t('Wins', 'Siege')}
                          </div>
                          <div className="text-sm font-extrabold text-emerald-400 tabular-nums">{nat.wins}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                            {t('Matches', 'Spiele')}
                          </div>
                          <div className="text-sm font-extrabold text-white tabular-nums">{nat.matches}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">
                            Win %
                          </div>
                          <div className="text-sm font-extrabold text-amber-400 tabular-nums">{winPct}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Trophy Cabinet & Best Finish Showcase */}
                    <div className="bg-black/40 rounded-2xl p-3.5 border border-amber-500/20 flex flex-col gap-2.5 relative overflow-hidden shadow-inner">
                      <div className="text-[10px] text-amber-400/90 font-semibold uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
                        <i className="fas fa-trophy text-[9px]"></i>
                        <span>{t('World Cup Silverware', 'WM-Trophäen')}</span>
                        <span className="text-white font-bold tabular-nums">({nat.trophiesCount})</span>
                      </div>

                      {nat.trophiesCount === 0 ? (
                        <div className="text-center py-2 flex flex-col items-center justify-center gap-1">
                          <span className="text-xs font-bold text-zinc-300">
                            {t('Best Finish:', 'Beste Platzierung:')}{' '}
                            <span className="text-amber-400">{nat.bestFinish}</span>
                          </span>
                          <span className="text-[10px] text-zinc-500 italic">
                            {t('Click to inspect tournament log', 'Klicken für Details')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
                          <div className="relative group/trophy flex flex-col items-center">
                            <div
                              className="w-11 h-11 flex items-center justify-center relative transition-transform group-hover/trophy:scale-110"
                              title="FIFA World Cup Champion"
                            >
                              <i className="fas fa-trophy text-3xl text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.6)]"></i>
                              {nat.trophiesCount > 1 && (
                                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow-md tabular-nums">
                                  x{nat.trophiesCount}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-amber-300 text-center mt-1 font-bold">
                              {t('World Cup Champion', 'Weltmeister')}
                            </div>
                          </div>
                          {sortedYears.length > 0 && (
                            <div className="text-[10px] text-zinc-400 text-center font-medium">
                              {sortedYears.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Tab 4: Hall of Fame & Global Leaderboard */}
        {/* ========================================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="animate-fadeIn">
            <div className="bg-[#0c0e14]/90 rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-400 text-sm">
                    <i className="fa-solid fa-trophy" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 mb-0.5">
                      {t('Hall of Fame Standards', 'Hall of Fame Vergleich')}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {t('Global Leaderboard', 'Globale Rangliste')}
                    </h2>
                    <p className="text-xs text-zinc-400 font-normal">
                      {t('Historical sporting directors and all-time career benchmarks', 'Historische Manager und allzeitige Karriere-Punkte')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Your Score Hero Row */}
              <div className="bg-gradient-to-r from-sky-500/[0.08] via-white/[0.02] to-transparent p-4 sm:p-5 rounded-2xl border border-sky-400/25 flex items-center justify-between mb-6 shadow-[0_0_24px_rgba(56,189,248,0.08)] relative z-10">
                <div>
                  <div className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider mb-1">
                    {t('Your Career Score', 'Deine Karriere-Punkte')}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {(state.managerName || (lang === 'de' ? 'Der Manager' : 'The Manager'))}
                  </div>
                  <div className="text-xs text-zinc-400 font-normal mt-0.5 flex items-center gap-1.5">
                    <span>{history.length} {t('Seasons', 'Saisons')}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-amber-400/90 font-medium">{totalTrophies} {t('Trophies', 'Titel')}</span>
                  </div>
                </div>
                <div className="px-5 py-2.5 rounded-2xl bg-sky-500/20 text-sky-300 font-mono font-bold text-lg sm:text-xl shadow-[0_0_20px_rgba(56,189,248,0.2)] tabular-nums border border-sky-400/30">
                  {((state.careerScore || 0) / 1000).toFixed(1)}k
                </div>
              </div>

              {/* Hall of Fame List */}
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mb-3 pl-1 relative z-10">
                {t('All-Time Benchmarks', 'Allzeit-Vergleich')}
              </div>

              <div className="space-y-2 relative z-10">
                {(globalHighscores && globalHighscores.length > 0 ? globalHighscores : HISTORICAL_DIRECTORS).slice(0, 10).map((mgr, index) => {
                  const score = mgr.score || 0;
                  const name = (mgr as any).managerName || (mgr as any).directorName || (mgr as any).name || 'Director';
                  const hasPassed = (state.careerScore || 0) >= score;
                  const rank = index + 1;

                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        hasPassed 
                          ? 'bg-amber-500/[0.07] border-amber-400/25 shadow-[0_0_15px_rgba(245,158,11,0.06)]' 
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs tabular-nums shrink-0 ${
                          hasPassed 
                            ? 'bg-amber-400/20 border-amber-400/40 text-amber-300 shadow-sm' 
                            : 'bg-white/[0.04] border-white/[0.06] text-zinc-400'
                        }`}>
                          #{rank}
                        </div>
                        <div>
                          <div className={`text-xs sm:text-sm font-bold ${hasPassed ? 'text-amber-200' : 'text-zinc-200'}`}>
                            {name}
                          </div>
                          {(mgr as any).era && (
                            <div className="text-[10px] text-zinc-500">{(mgr as any).era}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                            {formatNum(score)}
                          </div>
                          <div className="text-[9px] text-zinc-500 uppercase font-semibold">
                            {t('Points', 'Punkte')}
                          </div>
                        </div>

                        {hasPassed ? (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                            <i className="fa-solid fa-check text-[9px]" />
                            <span>{t('Surpassed', 'Übertroffen')}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hidden sm:inline">
                            Target
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {onShowLeaderboard && (
                <button
                  type="button"
                  onClick={onShowLeaderboard}
                  className="mt-6 w-full py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-sm relative z-10"
                >
                  <i className="fa-solid fa-list-ol text-xs text-sky-400" />
                  <span>{t('Open Full Highscores Board', 'Vollständige Bestenliste öffnen')}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};