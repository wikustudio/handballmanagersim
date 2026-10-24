import React, { useRef, useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
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
import { GameState, Language } from '../types';
import { getContinentalCupNames } from '../utils/regionHelpers';
import { getTrophyImage, getTrophyFilter } from '../utils/trophyHelpers';
import { 
  MAX_SEASONS,
  getInitials,
  getMonogramHex,
  getOvrColor,
  getLeagueInfo,
  getDomesticCupInfo,
  calculateClubReputation,
  HISTORICAL_MANAGERS,
  TOURNAMENT_LOGOS, getMaxTier } from '../data/gameConstants';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs, isAnyModActive } from '../utils/modManager';
import { ClubLogo } from './ClubLogo';
import { t as tr } from '../data/translations';
import { calculateLiveScore, saveHighscore } from '../utils/leaderboard';
import { useModalDismiss } from '../utils/modalUtils';

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
  onShowToast?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onClose?: () => void;
  onShowLeaderboard?: () => void;
}

export const CareerSummary: React.FC<CareerSummaryProps> = ({
  state,
  lang,
  onReset,
  onShowToast,
  onClose,
  onContinueEndless,
  onShowLeaderboard,
}) => {
  useModalDismiss(onClose, Boolean(onClose));
  const t = (en: string, _de?: string, _ignoredEs?: string) => en;
  const [activeMobileTab, setActiveMobileTab] = useState<'card' | 'chart' | 'clubs'>('card');
  const [isDownloading, setIsDownloading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  const winPct =
    state.totals?.matches > 0
      ? Math.round((state.totals.wins / state.totals.matches) * 100)
      : 0;

  const history = state.history || [];

  // 2. Fetch AI Summary on mount
  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/generate-career-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            managerName: state.managerName,
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
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error("KEY_MISSING");
        }
        
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
        if (err.message !== "KEY_MISSING" && err.name !== "SyntaxError") {
          console.warn("AI Summary using offline procedural generator:", err.message);
        }
        if (isMounted) {
           
    const earlyQuits = [
      `After a mere ${state.history?.length || 0} seasons across clubs like ${Array.from(new Set(state.history?.map(h => h.clubName) || [])).slice(0, 3).join(', ')}, ${state.managerName} packed their bags, proving they simply couldn't handle the heat.`,
      `${state.managerName} throws in the towel after just ${state.history?.length || 0} seasons, presumably to pursue a career in television punditry.`,
      `Fleeing coaching after ${state.history?.length || 0} seasons, ${state.managerName} leaves behind a trail of confused fans and half-finished tactical whiteboards at ${state.club.name}.`
    ];
    
    const endlessCareers = [
      `Refusing to retire after an absurd ${state.history?.length || 0} campaigns at clubs like ${Array.from(new Set(state.history?.map(h => h.clubName) || [])).slice(0, 3).join(', ')}, ${state.managerName} has basically become part of the arena architecture.`,
      `After ${state.history?.length || 0} seasons in the dugout, ${state.managerName} finally retires, presumably because they ran out of tracksuits.`,
      `${state.history?.length || 0} seasons. ${state.totals?.matches || 0} matches. ${state.managerName}'s reign lasted longer than most modern nations.`
    ];
    
    const standardCareers = [
      `${state.managerName} calls time on a textbook ${state.history?.length || 0}-season stint across clubs like ${Array.from(new Set(state.history?.map(h => h.clubName) || [])).slice(0, 3).join(', ')}, stepping away from the touchline at last.`,
      `The ${state.managerName} era comes to an end after ${state.history?.length || 0} solid campaigns of touchline theatrics.`,
      `After ${state.history?.length || 0} seasons of tactical tweaks and media scuffles, ${state.managerName} bids farewell to the fans of ${state.club.name} and others.`
    ];

    const frauds = [
      `Despite a ${winPct}% win rate, they depart with an empty trophy cabinet and the undeniable label of a tactical fraud.`,
      `Zero trophies across ${state.totals?.matches || 0} matches is a special kind of achievement, cementing their legacy as a total fraud.`,
      `They leave with 0 pieces of silverware, proving that possession stats don't win you handball matches.`
    ];

    const cheatCodes = [
      `A haul of ${state.totals?.trophies || 0} trophies makes this run look less like real life and more like a video game cheat code.`,
      `Collecting ${state.totals?.trophies || 0} pieces of silverware along the way, this coach essentially completed handball.`,
      `With ${state.totals?.trophies || 0} trophies secured, they leave behind a legacy so dominant it should probably be investigated by the authorities.`
    ];

    const averages = [
      `Walking away with ${state.totals?.trophies || 0} pieces of silverware, they leave behind a respectable, if slightly chaotic, legacy.`,
      `They managed to scrape together ${state.totals?.trophies || 0} trophies, providing just enough joy to keep the board from sacking them.`,
      `With ${state.totals?.trophies || 0} trophies to their name, they'll be remembered fondly, though perhaps not with a statue.`
    ];

    const randomPick = (arr: any) => arr[Math.floor(Math.random() * arr.length)];
    const seasons = state.history?.length || 0;
    const trophies = state.totals?.trophies || 0;
    
    let s1 = "";
    if (seasons < 35) s1 = randomPick(earlyQuits);
    else if (seasons > 35) s1 = randomPick(endlessCareers);
    else s1 = randomPick(standardCareers);

    let s2 = "";
    if (trophies === 0) s2 = randomPick(frauds);
    else if (trophies >= (seasons * 0.5)) s2 = randomPick(cheatCodes);
    else s2 = randomPick(averages);

    const clientSideSummary = s1 + " " + s2;

           setAiSummary(clientSideSummary);
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

  const historyDomTrophies = history.reduce(
    (acc, h) =>
      acc +
      (h.trophiesThisYear?.bl || 0) +
      (h.trophiesThisYear?.lower || 0) +
      (h.trophiesThisYear?.dfb || 0) +
      (h.trophiesThisYear?.reg || 0) +
      (h.trophiesThisYear?.sc || 0),
    0
  );
  const domTrophies = Math.max(state.totals?.domTrophies ?? 0, historyDomTrophies);

  const formatScore = (score: number) => {
    if (score >= 1000000) return (score / 1000000).toFixed(1) + 'm';
    if (score >= 1000) return Math.floor(score / 1000) + 'k';
    return score.toString();
  };

  const currentScore = calculateLiveScore(state);

  const historyIntTrophies = history.reduce(
    (acc, h) =>
      acc +
      (h.trophiesThisYear?.cl || 0) +
      (h.trophiesThisYear?.el || 0) +
      (h.trophiesThisYear?.ecl || 0) +
      (h.trophiesThisYear?.cwc || 0) +
      (h.trophiesThisYear?.esc || 0),
    0
  );
  const intTrophies = Math.max(state.totals?.intTrophies ?? 0, historyIntTrophies);
  const totalTrophies = Math.max(state.totals?.trophies ?? 0, domTrophies + intTrophies);

  const clWins =
    state.clWins ??
    history.reduce((acc, h) => acc + (h.trophiesThisYear?.cl || 0), 0);

  const managerReputation = Math.min(100, Math.max(0, Math.round(state.reputation || 50)));
  const clubReputation = Math.min(100, Math.max(1, calculateClubReputation(state.club.baseOvr, state.club.tier)));

  const finalCountry = state.club.country || 'GER';
  const isEcu = finalCountry === 'ECU';
  const isUsa = finalCountry === 'USA';
  const clLogo = getTrophyImage('cl', finalCountry);
  const elLogo = getTrophyImage('el', finalCountry);
  const eclLogo = getTrophyImage('ecl', finalCountry);
  const { cl: clTitle, el: elTitle, ecl: eclTitle } = getContinentalCupNames(finalCountry);
  const mainLeagueTitle = getLeagueInfo(1, finalCountry || 'GER').name;
  const mainCupTitle = getDomesticCupInfo(finalCountry, 1).name || 'National Cup';
  

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


  const totalTrophyCounts = { cl: 0, el: 0, ecl: 0, cwc: 0, bl: 0, lower: 0, dfb: 0, reg: 0 };
  history.forEach((h) => {
    if (h.trophiesThisYear) {
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      const isChamp = h.pos === undefined || h.pos === 1;
      const blCount = (!isLower && h.tier === 1 && !h.promoted && isChamp && h.trophiesThisYear.bl) ? (h.trophiesThisYear.bl || 1) : 0;
      const lowerCount = (h.trophiesThisYear.lower || 0) + ((isLower && isChamp) ? (h.trophiesThisYear.bl || 0) : 0);

      totalTrophyCounts.cl += h.trophiesThisYear.cl || 0;
      totalTrophyCounts.el += h.trophiesThisYear.el || 0;
      totalTrophyCounts.ecl += h.trophiesThisYear.ecl || 0;
      totalTrophyCounts.cwc = (totalTrophyCounts.cwc || 0) + (h.trophiesThisYear.cwc || 0);
      totalTrophyCounts.bl += blCount;
      totalTrophyCounts.lower += lowerCount;
      totalTrophyCounts.dfb += h.trophiesThisYear.dfb || 0;
      totalTrophyCounts.reg += h.trophiesThisYear.reg || 0;
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
      const seasonMatches = (h.wins !== undefined && h.draws !== undefined && h.losses !== undefined)
        ? ((h.wins || 0) + (h.draws || 0) + (h.losses || 0))
        : 34;
      club.matches += seasonMatches;
      club.wins += (h.wins || 0);
    }
    if (h.trophiesThisYear) {
      const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
      const isChamp = h.pos === undefined || h.pos === 1;
      const blCount = (!isLower && h.tier === 1 && !h.promoted && isChamp && h.trophiesThisYear.bl) ? (h.trophiesThisYear.bl || 1) : 0;
      const lowerCount = (h.trophiesThisYear.lower || 0) + ((isLower && isChamp) ? (h.trophiesThisYear.bl || 0) : 0);

      club.trophyCounts.cl += h.trophiesThisYear.cl || 0;
      club.trophyCounts.el += h.trophiesThisYear.el || 0;
      club.trophyCounts.ecl += h.trophiesThisYear.ecl || 0;
      club.trophyCounts.cwc = (club.trophyCounts.cwc || 0) + (h.trophiesThisYear.cwc || 0);
      club.trophyCounts.bl += blCount;
      club.trophyCounts.lower += lowerCount;
      club.trophyCounts.dfb += h.trophiesThisYear.dfb || 0;
      club.trophyCounts.reg += h.trophiesThisYear.reg || 0;
    }
  });

  if (Object.keys(clubStats).length === 0 && state.club?.name) {
    clubStats[state.club.name] = {
      name: state.club.name,
      color: state.club.colors?.primary || '#0a84ff',
      logo: state.club.logo,
      country: state.club.country,
      seasons: 1,
      matches: state.totals?.matches || 0,
      wins: state.totals?.wins || 0,
      trophyCounts: { cl: 0, el: 0, ecl: 0, cwc: 0, bl: 0, lower: 0, dfb: 0, reg: 0 },
    };
  }

  const shareCard = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    
    try {
      const fallbackDataUri = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
      const blob = await htmlToImage.toBlob(cardRef.current, {
        quality: 1.0,
        backgroundColor: '#1c1c1e',
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
        includeQueryParams: true,
        imagePlaceholder: fallbackDataUri,
        filter: (node: any) => node.tagName !== 'IMG',
      });
      if (!blob) throw new Error('Failed to create blob');
      
      const filename = `career-legacy-${state.club.name.replace(/\s+/g, '-')}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      
      const score = Math.round(calculateLiveScore(state));
      const trophies = totalTrophies;
      const shareUrl = `https://handballmanagersim.com/?share=dynasty&club=${encodeURIComponent(state.club.name)}&manager=${encodeURIComponent(state.managerName)}&trophies=${trophies}&score=${score}`;
      const text = `I finished a ${MAX_SEASONS}-season career with ${state.club.name} and won ${trophies} trophies! Play free: ${shareUrl} #HandballManagerSim`;
      
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
            title: 'Handball Manager Legacy',
            text: text,
            url: shareUrl,
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
        if (onShowToast) onShowToast('Failed to export image', 'error');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const shareDynastyLink = async () => {
    const score = Math.round(calculateLiveScore(state));
    const trophies = totalTrophies;
    const shareUrl = `https://handballmanagersim.com/?share=dynasty&club=${encodeURIComponent(state.club.name)}&manager=${encodeURIComponent(state.managerName)}&trophies=${trophies}&score=${score}`;
    const bragText = `🏆 ${state.managerName}'s ${state.club.name} Dynasty\n👑 ${trophies} Major Trophies | Career Score: ${score.toLocaleString()}\n👉 Play free: ${shareUrl}`;

    const fallbackCopyText = (textToCopy: string) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        if (onShowToast) onShowToast(t('Dynasty brag link copied to clipboard!', 'Dynastie-Link in die Zwischenablage kopiert!'), 'success');
      } catch {
        if (onShowToast) onShowToast(t('Could not copy link automatically.', 'Link konnte nicht automatisch kopiert werden.'), 'error');
      }
    };

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(bragText);
        if (onShowToast) onShowToast(t('Dynasty brag link copied to clipboard!', 'Dynastie-Link in die Zwischenablage kopiert!'), 'success');
      } else {
        fallbackCopyText(bragText);
      }
    } catch {
      fallbackCopyText(bragText);
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

  const maxTier = React.useMemo(() => {
    let mt = 5;
    history.forEach((h) => {
      if ((h.tier || 1) > mt) {
        mt = h.tier || 1;
      }
    });
    if (state.club?.tier && state.club.tier > mt) mt = state.club.tier;
    if (countriesUsed.includes('GER') && mt < 7) mt = 7;
    return mt;
  }, [countriesUsed, history, state.club?.tier]);

  const chartHistory = history.length > 0 
    ? history 
    : [{ year: state.year, tier: state.club?.tier || 1, pos: 1, clubName: state.club?.name || '', country: state.club?.country || 'GER' }];

  const chartData = {
    labels: chartHistory.map((h) => h.year),
    datasets: [
      {
        label: 'League',
        data: chartHistory.map((h) => h.tier || 1),
        borderColor: '#0a84ff',
        backgroundColor: 'rgba(10, 132, 255, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const h = chartHistory[context.dataIndex];
            if (!h) return '';
            const country = h?.country || singleCountry;
            if (hasChangedCountry) {
              return `${h.clubName} (${country}): Tier ${context.raw} (${h.pos}. Pos)`;
            } else {
              return `${h.clubName}: Tier ${context.raw} (${h.pos}. Pos)`;
            }
          },
        },
      },
    },
    scales: {
      y: {
        reverse: true,
        min: 1,
        max: getMaxTier(singleCountry),
        ticks: {
          stepSize: 1,
          callback: (value: any) => {
            return `Tier ${value}`;
          },
          color: '#8e8e93',
          font: { weight: 'bold' as const, size: 10 },
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      x: {
        ticks: { color: '#8e8e93', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  return (
        <div className={onClose ? "fixed inset-0 z-[10050] bg-black/85 flex justify-center overflow-y-auto backdrop-blur-xl p-3 sm:p-6" : ""}>
      <div className={`max-w-4xl mx-auto fade-in px-2 sm:px-4 pb-16 w-full relative ${onClose ? 'mt-3 sm:mt-6' : 'mt-4'}`}>
        {onClose && (
          <button aria-label="Close modal" onClick={onClose} className="active:scale-95 absolute -top-2 right-2 sm:-right-2 bg-white/[0.06] hover:bg-white/[0.14] w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white border border-white/10 z-[200] shadow-xl transition-all cursor-pointer">
            <i className="fas fa-times text-sm"></i>
          </button>
        )}
      {/* Top Header Banner */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-medium uppercase tracking-wider px-3 py-1 rounded-full mb-2">
          <i className="fas fa-award text-xs"></i>
          {t('Career Completed', 'Karriere Abgeschlossen')}
        </span>
        <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight uppercase">
          {state.managerName}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
          <span className="tabular-nums">{history.length}</span> {t('Seasons Coached', 'Saisons als Trainer')} · <span className="tabular-nums">{state.totals?.wins || 0}</span> {t('Wins', 'Siege')} · <span className="tabular-nums">{totalTrophies}</span> {t('Trophies', 'Titel')}
        </p>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex bg-[#10121a] p-1 rounded-xl border border-white/[0.04] mb-6 gap-1 max-w-md mx-auto">
        <button
          onClick={() => setActiveMobileTab('card')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMobileTab === 'card'
              ? 'bg-sky-500/[0.05] border border-sky-500/20 text-sky-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <i className="fas fa-id-card text-[11px]"></i>
          <span>{t('Coach Card', 'Karte')}</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('chart')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMobileTab === 'chart'
              ? 'bg-sky-500/[0.05] border border-sky-500/20 text-sky-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <i className="fas fa-chart-line text-[11px]"></i>
          <span>{t('Progression', 'Verlauf')}</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('clubs')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMobileTab === 'clubs'
              ? 'bg-sky-500/[0.05] border border-sky-500/20 text-sky-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <i className="fas fa-shield-halved text-[11px]"></i>
          <span>Clubs</span>
        </button>
      </div>

      {/* Section 1: Manager Share Card */}
      <div className={`${activeMobileTab === 'card' ? 'flex' : 'hidden'} flex-col items-center w-full max-w-md mx-auto mb-8`}>
        <div className="w-full max-w-md flex flex-col">
          <div
            ref={cardRef}
            id="marketing-share-card"
            className="bg-[#14151e] border border-white/[0.04] rounded-2xl p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col items-center justify-between relative overflow-hidden w-full min-h-[480px] sm:min-h-[520px] m-0"
          >
          <div className="absolute top-[-40px] left-[-40px] w-48 h-48 bg-sky-500/10 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="absolute bottom-[-40px] right-[-40px] w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none"></div>

          {/* Card Header */}
          <div className="w-full text-center z-10">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-400 font-mono font-medium uppercase tracking-widest mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>HANDBALL COACH LEGEND</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight uppercase truncate">
              {state.managerName}
            </h2>
          </div>

          {/* Center Club Badge & Rep Stat Row */}
          <div className="flex flex-col items-center z-10 my-3 w-full">
            <div className="flex items-center justify-center gap-2.5 mb-3 text-center">
              <ClubLogo
                name={state.club.name}
                clubId={state.club.id}
                club={state.club}
                color={state.club.color}
                color2={state.club.color2}
                logo={isAnyModActive() ? state.club.logo : undefined}
                fallbackLogo={isAnyModActive() ? state.club.fallbackLogo : undefined}
                className="w-7 h-7 rounded-lg object-contain shrink-0 border border-white/10"
              />
              <div className="text-lg font-semibold text-white tracking-tight">
                {state.club.name}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              <div className="bg-[#10121a] border border-white/[0.04] rounded-xl px-2.5 py-2 flex flex-col items-center text-center">
                <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider">
                  Final OVR
                </span>
                <span className={`text-sm font-semibold tabular-nums ${getOvrColor(state.club.baseOvr, getLeagueInfo(state.club.tier, state.club.country).avgOvr)}`}>
                  {state.club.baseOvr}
                </span>
              </div>
              <div className="bg-[#10121a] border border-white/[0.04] rounded-xl px-2.5 py-2 flex flex-col items-center text-center">
                <span className="text-[9px] font-medium text-sky-400 uppercase tracking-wider">
                  Coach Rep
                </span>
                <span className="text-sm font-semibold text-sky-300 tabular-nums">
                  {managerReputation}/100
                </span>
              </div>
              <div className="bg-[#10121a] border border-white/[0.04] rounded-xl px-2.5 py-2 flex flex-col items-center text-center">
                <span className="text-[9px] font-medium text-purple-400 uppercase tracking-wider">
                  Club Rep
                </span>
                <span className="text-sm font-semibold text-purple-300 tabular-nums">
                  {clubReputation}/100
                </span>
              </div>
              <div className="bg-[#10121a] border border-white/[0.04] rounded-xl px-2.5 py-2 flex flex-col items-center text-center">
                <span className="text-[9px] font-medium text-emerald-400 uppercase tracking-wider">
                  Score
                </span>
                <span className="text-sm font-semibold text-emerald-300 tabular-nums">
                  {currentScore.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Streamlined Stat Badges & Cabinet */}
          <div className="flex flex-row justify-between w-full gap-2 z-10 my-2">
            <div className="flex-1 bg-[#10121a] rounded-xl p-2.5 border border-white/[0.04] text-center flex flex-col items-center justify-center">
              <div className="text-[8px] sm:text-[9px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                {t('Seasons', 'Saisons')}
              </div>
              <div className="text-sm sm:text-base font-semibold text-white tabular-nums">{history.length}</div>
            </div>
            <div className="flex-1 bg-[#10121a] rounded-xl p-2.5 border border-white/[0.04] text-center flex flex-col items-center justify-center">
              <div className="text-[8px] sm:text-[9px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                Win %
              </div>
              <div className="text-sm sm:text-base font-semibold text-emerald-400 tabular-nums">{winPct}%</div>
            </div>
            <div className="flex-1 bg-[#10121a] rounded-xl p-2.5 border border-white/[0.04] text-center flex flex-col items-center justify-center">
              <div className="text-[8px] sm:text-[9px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                {t('Wins', 'Siege')}
              </div>
              <div className="text-sm sm:text-base font-semibold text-white tabular-nums">{state.totals?.wins || 0}</div>
            </div>

            
          </div>
          
          <div className="bg-[#10121a] rounded-xl p-3 border border-white/[0.04] flex flex-col gap-2 my-2 w-full">
             <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
               <i className="fas fa-trophy text-amber-400"></i> {t('Total Trophy Cabinet', 'Gesamter Trophaeenschrank')} (<span className="tabular-nums">{totalTrophies}</span>)
             </div>
             {totalTrophies === 0 ? (
               <div className="text-center text-xs text-white/30 italic py-2">{t('No titles won', 'Keine Titel gewonnen')}</div>
             ) : (
               <div className="flex flex-wrap items-center justify-center gap-3">
                 {totalTrophyCounts.cl > 0 && (
                   <div className="relative">
                     <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-400 flex items-center justify-center shadow-[0_0_10px_rgba(203,213,225,0.5)] z-10 overflow-hidden" title={clTitle}>
                       <i className="fas fa-trophy text-slate-800 text-[18px] drop-shadow-md relative z-10"></i>
                     </div>
                     {totalTrophyCounts.cl > 1 && <span className="absolute -top-2 -right-2 bg-[#2c2c2e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 z-20">x{totalTrophyCounts.cl}</span>}
                   </div>
                 )}
                 {totalTrophyCounts.el > 0 && (
                   <div className="relative">
                     <div className="w-9 h-9 rounded-full bg-amber-600 border border-amber-500 flex items-center justify-center shadow-[0_0_10px_rgba(217,119,6,0.5)] z-10 overflow-hidden" title={elTitle}>
                       <i className="fas fa-trophy text-amber-100 text-[18px] drop-shadow-md relative z-10"></i>
                     </div>
                     {totalTrophyCounts.el > 1 && <span className="absolute -top-2 -right-2 bg-[#2c2c2e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 z-20">x{totalTrophyCounts.el}</span>}
                   </div>
                 )}
                 {totalTrophyCounts.ecl > 0 && (
                   <div className="relative">
                     <div className="w-9 h-9 rounded-full bg-emerald-600 border border-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(5,150,105,0.5)] z-10 overflow-hidden" title={eclTitle}>
                       <i className="fas fa-trophy text-emerald-100 text-[18px] drop-shadow-md relative z-10"></i>
                     </div>
                     {totalTrophyCounts.ecl > 1 && <span className="absolute -top-2 -right-2 bg-[#2c2c2e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 z-20">x{totalTrophyCounts.ecl}</span>}
                   </div>
                 )}
                 {totalTrophyCounts.cwc > 0 && (
                   <div className="relative">
                     <div className="w-9 h-9 rounded-full bg-blue-900 border border-yellow-500/50 flex items-center justify-center z-10 overflow-hidden" title="Global Club Cup">
                       <i className="fas fa-globe text-yellow-400 text-[18px] drop-shadow-md relative z-10"></i>
                     </div>
                     {totalTrophyCounts.cwc > 1 && <span className="absolute -top-2 -right-2 bg-[#2c2c2e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 z-20">x{totalTrophyCounts.cwc}</span>}
                   </div>
                 )}
                 {totalTrophyCounts.bl > 0 && (
                   <div className="relative">
                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10 overflow-hidden" title={t('League Titles', 'Liga-Titel')}>
                       <i className="fas fa-medal text-white drop-shadow-md text-[18px] relative z-10"></i>
                     </div>
                     {totalTrophyCounts.bl > 1 && <span className="absolute -top-2 -right-2 bg-[#2c2c2e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 z-20">x{totalTrophyCounts.bl}</span>}
                   </div>
                 )}
                 {totalTrophyCounts.dfb > 0 && (
                   <div className="relative">
                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 border border-slate-200 flex items-center justify-center shadow-[0_0_10px_rgba(203,213,225,0.5)] z-10 overflow-hidden" title={t('Domestic Cups', 'Nationale Pokale')}>
                       <i className="fas fa-trophy text-slate-700 drop-shadow-md text-[18px] relative z-10"></i>
                     </div>
                     {totalTrophyCounts.dfb > 1 && <span className="absolute -top-2 -right-2 bg-[#2c2c2e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 z-20">x{totalTrophyCounts.dfb}</span>}
                   </div>
                 )}
                 {totalTrophyCounts.lower > 0 && (
                   <div className="relative">
                     <div className="w-8 h-8 rounded-full bg-slate-600 border border-slate-500 flex items-center justify-center z-10" title="Lower League Title">
                       <i className="fas fa-medal text-slate-300 text-xs"></i>
                     </div>
                     {totalTrophyCounts.lower > 1 && <span className="absolute -top-2 -right-2 bg-[#2c2c2e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 z-20">x{totalTrophyCounts.lower}</span>}
                   </div>
                 )}
                 {totalTrophyCounts.reg > 0 && (
                   <div className="relative">
                     <div className="w-8 h-8 rounded-full bg-amber-800 border border-amber-700 flex items-center justify-center z-10" title={getDomesticCupInfo(state?.club?.country || 'GER', 4).name || 'Regional Cup'}>
                       <i className="fas fa-shield-halved text-amber-200 text-xs"></i>
                     </div>
                     {totalTrophyCounts.reg > 1 && <span className="absolute -top-2 -right-2 bg-[#2c2c2e] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/20 z-20">x{totalTrophyCounts.reg}</span>}
                   </div>
                 )}
               </div>
             )}

          </div>

          {/* AI Pundit Summary */}
          <div className="w-full bg-[#10121a] rounded-xl p-3 sm:p-4 my-2 border border-purple-500/20 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-60"></div>
             <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
               <i className="fas fa-robot text-purple-400"></i> {t('AI Career Analysis', 'KI-Karriere-Analyse')}
             </div>
             <div className="text-sm text-zinc-200 leading-relaxed font-normal">
               {isAiLoading ? (
                 <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
                   <i className="fas fa-spinner fa-spin text-xs"></i> Analyzing career legacy...
                 </div>
               ) : aiError === 'KEY_MISSING' ? (
                 <div className="text-zinc-400 italic text-xs">
                   API Key not found. Add your Gemini API Key in Settings &gt; Secrets to enable the AI Pundit.
                 </div>
               ) : aiError ? (
                 <div className="text-zinc-400 italic text-xs">
                   Analyzing offline...
                 </div>
               ) : (
                 aiSummary
               )}
             </div>
          </div>

          {/* Footer watermark */}
          <div className="w-full text-center mt-3 z-10 opacity-60">
            <div className="text-[9px] font-medium text-white/80 tracking-widest uppercase">
              Handball Coach Legend • Career Legacy
            </div>
          </div>
        </div>

        </div>
      </div>

      {/* Global Career Action Bar (Visible across all tabs so users can always exit, view leaderboard, or continue endless mode) */}
      <div className="flex flex-col items-center w-full max-w-md mx-auto mb-8">
        <div className="flex flex-col gap-3 w-full">
          {onShowLeaderboard && (
            <button 
              onClick={() => {
                  onShowLeaderboard();
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold py-3.5 px-8 rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.25)] transition active:scale-95 flex items-center justify-center gap-2 text-sm border border-amber-400/40 cursor-pointer"
            >
              <i className="fas fa-globe text-base"></i> {t('VIEW GLOBAL LEADERBOARD', 'GLOBALE BESTENLISTE ANSEHEN')}
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {activeMobileTab === 'card' && (
              <>
                <button
                  onClick={shareCard}
                  disabled={isDownloading}
                  className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-70 text-white font-semibold py-3.5 px-6 rounded-xl transition active:scale-95 shadow-[0_4px_20px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2 text-sm cursor-pointer border border-blue-400/30"
                >
                  {isDownloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-share-nodes"></i>}
                  <span>{isDownloading ? t('Processing...', 'Wird erstellt...') : t('Share Manager Card', 'Manager-Karte Teilen')}</span>
                </button>

                <button
                  onClick={shareDynastyLink}
                  className="w-full sm:flex-1 bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold py-3.5 px-6 rounded-xl transition active:scale-95 shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer border border-white/10"
                  title="Copy shareable link with dynamic card preview for Discord, Reddit, and Twitter"
                >
                  <i className="fas fa-link text-amber-400 text-xs"></i>
                  <span>{t('Copy Dynasty Link', 'Dynastie-Link Kopieren')}</span>
                </button>
              </>
            )}
            
            {onClose ? (
              <button
                onClick={onClose}
                className="w-full sm:flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold py-3.5 px-6 rounded-xl transition active:scale-95 shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer border border-white/[0.06]"
              >
                <i className="fas fa-times"></i>
                <span>{t('Close Overview', 'Übersicht Schließen')}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  saveHighscore(state).catch(() => {});
                  onReset();
                }}
                className="w-full sm:flex-1 bg-white hover:bg-zinc-200 text-black font-semibold uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <i className="fas fa-check"></i>
                {t('Submit & Exit', 'Abschließen & Beenden')}
              </button>
            )}
          </div>
          
          {!onClose && (
            <button
              onClick={onContinueEndless ? onContinueEndless : undefined}
              disabled={!onContinueEndless || state.history.length < 35 || state.endlessModeActive}
              className="active:scale-[0.99] mt-3 w-full bg-amber-500/[0.04] border border-amber-500/30 text-amber-300 hover:bg-amber-500/[0.08] font-semibold py-3 rounded-xl transition-all duration-300 uppercase tracking-widest text-xs relative group disabled:opacity-50 disabled:cursor-not-allowed"
              title={state.history.length < 35 ? t('Complete 35 seasons to unlock', 'Absolviere 35 Saisons zum Freischalten') : ''}
            >
              <div className="flex items-center justify-center gap-2">
                <i className={`fas fa-infinity text-xs`}></i>
                <span>{t('Endless Mode', 'Endlosmodus')}</span>
              </div>
              {(!onContinueEndless || state.history.length < 35 || state.endlessModeActive) && (
                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                  <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">{state.endlessModeActive ? 'Endless Mode Active' : 'Requires 35 Seasons'}</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Section 2: Progression Line Chart */}
      <div className={`${activeMobileTab === 'chart' ? 'block' : 'hidden'} bg-[#14151e] rounded-2xl p-5 sm:p-6 border border-white/[0.04] shadow-xl mb-8`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <i className="fas fa-chart-line text-sky-400"></i>
            <span>{t('Career League Progression', 'Karriere-Ligenverlauf')}</span>
          </h2>
          <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg uppercase tabular-nums">
            {history.length} {t('Seasons', 'Saisons')}
          </span>
        </div>
        <div className="h-56 sm:h-64 w-full relative">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Section 2.5: Historic Manager Timeline */}
      <div className={`${activeMobileTab === 'clubs' ? 'block' : 'hidden'} mb-10`}>
        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-4 flex items-center gap-2">
          <i className="fas fa-crown text-amber-400"></i>
          <span>{t('Hall of Fame', 'Ruhmeshalle')}</span>
        </h2>
        
        <div className="bg-[#14151e] rounded-2xl p-4 sm:p-6 border border-white/[0.04] shadow-xl w-full">
          {/* We will build a responsive vertical list on mobile, and a horizontal timeline on desktop */}
          
          <div className="hidden sm:block overflow-x-auto custom-scrollbar relative pb-4">
            {(() => { const maxScale = 2000000; return (<div className="min-w-[800px] mx-12 h-48 relative flex items-center pb-8 mt-4">
              {/* Base line */}
              <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-white/10 rounded-full -translate-y-1/2"></div>
              {/* Progress line */}
              <div className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000 -translate-y-1/2" style={{ width: `${Math.min(100, (currentScore / maxScale) * 100)}%` }}></div>
              
              {/* Coach markers */}
              {HISTORICAL_MANAGERS.map((mgr, index) => {
                const posPct = (mgr.score / maxScale) * 100;
                const hasPassed = currentScore >= mgr.score;
                // Place names above and below the line to completely eliminate crowding
                const isTop = index % 2 === 0;
                
                return (
                  <div key={`mgr-timeline-${mgr.id}`} className="absolute flex flex-col items-center group hover:z-30 transition-all" style={{ left: `${posPct}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                    {/* TOP LABEL */}
                    {isTop && (
                      <div className="absolute bottom-full mb-6 flex flex-col items-center">
                        <div className={`text-[10px] whitespace-nowrap font-medium transition-colors text-center ${hasPassed ? 'text-white' : 'text-[#8e8e93]'}`}>
                          {mgr.name.split(' ').map((n, i) => <div key={`name-${i}`}>{n}</div>)}
                        </div>
                        <div className={`mt-2 w-0.5 h-4 ${hasPassed ? 'bg-amber-400' : 'bg-white/20'}`}></div>
                      </div>
                    )}
                    
                    <div className={`px-2 h-7 rounded-full border flex items-center justify-center font-semibold text-[10px] tabular-nums z-10 transition-all cursor-default ${hasPassed ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] scale-105' : 'bg-[#2c2c2e] border-white/10 text-zinc-400'}`}>
                      {formatScore(mgr.score)}
                    </div>
                    
                    {/* BOTTOM LABEL */}
                    {!isTop && (
                      <div className="absolute top-full mt-6 flex flex-col items-center">
                        <div className={`mb-2 w-0.5 h-4 ${hasPassed ? 'bg-amber-400' : 'bg-white/20'}`}></div>
                        <div className={`text-[10px] whitespace-nowrap font-medium transition-colors text-center ${hasPassed ? 'text-white' : 'text-[#8e8e93]'}`}>
                          {mgr.name.split(' ').map((n, i) => <div key={`name-${i}`}>{n}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Player marker */}
              <div className="absolute flex flex-col items-center z-40 transition-all duration-1000" style={{ left: `${Math.min(100, (currentScore / maxScale) * 100)}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="absolute bottom-full mb-2 flex flex-col items-center animate-pulse">
                  <div className="bg-sky-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-[0_4px_15px_rgba(14,165,233,0.5)] whitespace-nowrap border border-sky-300/40">
                    {t('You', 'Du')}
                  </div>
                  <div className="w-0.5 h-4 bg-sky-400 mt-1.5"></div>
                </div>
                
                <div className="px-2.5 h-8 rounded-full bg-sky-600 border border-sky-300/50 flex items-center justify-center font-semibold text-white text-[10px] tabular-nums shadow-[0_0_15px_rgba(14,165,233,0.6)] z-20">
                  {formatScore(currentScore)}
                </div>
              </div>
            </div>
            );
            })()}
          </div>
          
          {/* Mobile Vertical View */}
          <div className="block sm:hidden space-y-2.5 mt-4">
             <div className="bg-sky-500/[0.04] p-4 rounded-xl border border-sky-500/20 flex items-center justify-between mb-4 shadow-sm relative overflow-hidden">
               <div className="relative z-10">
                 <div className="text-[10px] text-sky-400 font-medium uppercase tracking-widest mb-0.5">{t('Your Rank', 'Dein Rang')}</div>
                 <div className="text-xl font-semibold text-white">{t('You', 'Du')}</div>
               </div>
               <div className="px-3 h-8 rounded-lg bg-sky-600 border border-sky-400/50 flex items-center justify-center font-semibold text-white text-xs shadow-md z-10 relative tabular-nums">
                 {formatScore(currentScore)}
               </div>
             </div>
             
             <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest pl-1 mb-2">{t('Hall of Fame', 'Hall of Fame')}</div>
             
             {[...HISTORICAL_MANAGERS].sort((a,b) => b.score - a.score).map((mgr) => {
                const hasPassed = currentScore >= mgr.score;
                return (
                  <div key={`mgr-list-${mgr.id}`} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${hasPassed ? 'bg-amber-500/[0.03] border-amber-500/20' : 'bg-white/[0.02] border-white/[0.04] opacity-70'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 h-7 rounded-lg border flex items-center justify-center font-semibold text-[11px] tabular-nums ${hasPassed ? 'bg-amber-500/15 border-amber-400/30 text-amber-300' : 'bg-white/[0.04] border-white/10 text-zinc-400'}`}>
                        {formatScore(mgr.score)}
                      </div>
                      <div className={`text-sm font-medium ${hasPassed ? 'text-amber-300' : 'text-zinc-300'}`}>
                        {mgr.name}
                      </div>
                    </div>
                    {hasPassed && <i className="fas fa-check text-amber-400 text-xs"></i>}
                  </div>
                )
             })}
          </div>

          <div className="text-center text-[10px] text-[#8e8e93] font-medium uppercase tracking-widest mt-4">
            {t('Career Score Timeline', 'Karriere-Score Zeitstrahl')}
          </div>
        </div>
      </div>

      {/* Section 3: Club History Grid */}
      <div className={`${activeMobileTab === 'clubs' ? 'block' : 'hidden'}`}>
        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-4 flex items-center gap-2">
          <i className="fas fa-trophy text-amber-400"></i>
          <span>{t('Club History & Trophy Cabinet', 'Vereinshistorie & Titel')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(clubStats).map((c, cIdx) => {
            const domCount =
              (c.trophyCounts.bl || 0) +
              (c.trophyCounts.dfb || 0) +
              (c.trophyCounts.lower || 0) +
              (c.trophyCounts.reg || 0);
            const intlCount =
              (c.trophyCounts.cl || 0) +
              (c.trophyCounts.el || 0) +
              (c.trophyCounts.ecl || 0) + (c.trophyCounts.cwc || 0);

            const activePoolForClub = getActiveClubs(c.country || state.club?.country);
            const clubInfo =
              activePoolForClub.find(club => club.name === c.name || club.name.toLowerCase() === c.name.toLowerCase()) ||
              ALL_CLUBS.find(club => club.name === c.name || club.name.toLowerCase() === c.name.toLowerCase());
            const clubCountry = c.country || clubInfo?.country || 'GER';
            const clubClLogo = TOURNAMENT_LOGOS.cl;
            const clubElLogo = TOURNAMENT_LOGOS.el;
            const clubEclLogo = TOURNAMENT_LOGOS.ecl;
            const clubLeagueTitle = getLeagueInfo(1, clubCountry).name;
            const clubCupTitle = getDomesticCupInfo(clubCountry, 1).name || 'National Cup';
            
            const { cl: clubClTitle, el: clubElTitle, ecl: clubEclTitle } = getContinentalCupNames(clubCountry);
            const modActiveNow = isAnyModActive();

            return (
              <div
                key={`c-${c.name}-${cIdx}`}
                className="bg-[#14151e] rounded-2xl p-5 border border-white/[0.04] shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-white/[0.08] transition"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <ClubLogo
                      name={c.name}
                      clubId={clubInfo?.id}
                      club={clubInfo}
                      color={c.color || clubInfo?.color}
                      color2={clubInfo?.color2}
                      logo={modActiveNow ? (clubInfo?.logo || c.logo) : undefined}
                      fallbackLogo={modActiveNow ? clubInfo?.fallbackLogo : undefined}
                      className="w-10 h-10 rounded-xl object-contain shrink-0 border border-white/10 shadow-md bg-white/[0.03]"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">{c.name}</h3>
                      <p className="text-xs text-zinc-400 font-normal mt-0.5">
                        <span className="tabular-nums">{c.seasons}</span> {c.seasons === 1 ? t('Season', 'Saison') : t('Seasons', 'Saisons')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#10121a] p-3 rounded-xl border border-white/[0.04] mb-4 text-center">
                    <div>
                      <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                        {t('Wins', 'Siege')}
                      </div>
                      <div className="text-sm font-semibold text-emerald-400 tabular-nums">{c.wins}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                        {t('Matches', 'Spiele')}
                      </div>
                      <div className="text-sm font-semibold text-white tabular-nums">{c.matches}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
                        Win %
                      </div>
                      <div className="text-sm font-semibold text-sky-400 tabular-nums">
                        {c.matches > 0 ? Math.round((c.wins / c.matches) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#10121a] rounded-xl p-4 border border-white/[0.04] flex flex-col gap-3 relative overflow-hidden">
                  <div className="text-[10px] text-amber-400 font-medium uppercase tracking-widest text-center relative z-10 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{t('Trophy Cabinet', 'Trophaeenschrank')}</span>
                  </div>
                  {(domCount + intlCount) === 0 ? (
                    <div className="text-center text-xs text-white/30 italic py-4 relative z-10">{t('No titles won', 'Keine Titel gewonnen')}</div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 relative z-10 pt-2 pb-1">
                      {c.trophyCounts.cl > 0 && (
                        <div className="relative group flex flex-col items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform group-hover:scale-110" title={clubClTitle}>
                            <i className="fas fa-trophy text-4xl text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.5)]"></i>
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow-md border border-[#0a0a0b] z-20 tabular-nums">x{c.trophyCounts.cl}</span>
                          </div>
                          <div className="text-[9px] text-[#8e8e93] text-center mt-1 font-medium max-w-[80px] truncate">{clubClTitle}</div>
                        </div>
                      )}
                      {c.trophyCounts.el > 0 && (
                        <div className="relative group flex flex-col items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform group-hover:scale-110" title={clubElTitle}>
                            <i className="fas fa-trophy text-4xl text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"></i>
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow-md border border-[#0a0a0b] z-20 tabular-nums">x{c.trophyCounts.el}</span>
                          </div>
                          <div className="text-[9px] text-[#8e8e93] text-center mt-1 font-medium max-w-[80px] truncate">{clubElTitle}</div>
                        </div>
                      )}
                      {c.trophyCounts.ecl > 0 && (
                        <div className="relative group flex flex-col items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform group-hover:scale-110" title={clubEclTitle}>
                            <i className="fas fa-trophy text-4xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"></i>
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow-md border border-[#0a0a0b] z-20 tabular-nums">x{c.trophyCounts.ecl}</span>
                          </div>
                          <div className="text-[9px] text-[#8e8e93] text-center mt-1 font-medium max-w-[80px] truncate">{clubEclTitle}</div>
                        </div>
                      )}
                      {c.trophyCounts.cwc > 0 && (
                        <div className="relative group flex flex-col items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform group-hover:scale-110" title="Global Club Cup">
                            <i className="fas fa-globe text-4xl text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"></i>
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow-md border border-[#0a0a0b] z-20 tabular-nums">x{c.trophyCounts.cwc}</span>
                          </div>
                          <div className="text-[9px] text-[#8e8e93] text-center mt-1 font-medium max-w-[80px] truncate">Global Club Cup</div>
                        </div>
                      )}
                      {c.trophyCounts.bl > 0 && (
                        <div className="relative group flex flex-col items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform group-hover:scale-110" title={clubLeagueTitle}>
                            {getTrophyImage('bl', clubCountry) ? <img src={getTrophyImage('bl', clubCountry)} alt="League" className="w-full h-full object-contain" style={{ filter: getTrophyFilter('bl') }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <i className="fas fa-medal text-4xl text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"></i>}
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow-md border border-[#0a0a0b] z-20 tabular-nums">x{c.trophyCounts.bl}</span>
                          </div>
                          <div className="text-[9px] text-[#8e8e93] text-center mt-1 font-medium max-w-[80px] truncate">{clubLeagueTitle}</div>
                        </div>
                      )}
                      {c.trophyCounts.dfb > 0 && (
                        <div className="relative group flex flex-col items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform group-hover:scale-110" title={clubCupTitle}>
                            <i className="fas fa-trophy text-4xl text-slate-400 drop-shadow-[0_0_15px_rgba(148,163,184,0.5)]"></i>
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow-md border border-[#0a0a0b] z-20 tabular-nums">x{c.trophyCounts.dfb}</span>
                          </div>
                          <div className="text-[9px] text-[#8e8e93] text-center mt-1 font-medium max-w-[80px] truncate">{clubCupTitle}</div>
                        </div>
                      )}
                      {c.trophyCounts.lower > 0 && (
                        <div className="relative group flex flex-col items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform group-hover:scale-110" title={t("Lower League", "Untere Liga")}>
                            {getTrophyImage('generic', clubCountry) ? <img src={getTrophyImage('generic', clubCountry)} alt="Lower League" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <i className="fas fa-medal text-4xl text-zinc-400 drop-shadow-[0_0_15px_rgba(161,161,170,0.5)]"></i>}
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow-md border border-[#0a0a0b] z-20 tabular-nums">x{c.trophyCounts.lower}</span>
                          </div>
                          <div className="text-[9px] text-[#8e8e93] text-center mt-1 font-medium max-w-[80px] truncate">{t("Lower League", "Untere Liga")}</div>
                        </div>
                      )}
                      {c.trophyCounts.reg > 0 && (
                        <div className="relative group flex flex-col items-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative transition-transform group-hover:scale-110" title={getDomesticCupInfo(state?.club?.country || 'GER', 4).name || 'Regional Cup'}>
                            {getTrophyImage('generic', clubCountry) ? <img src={getTrophyImage('generic', clubCountry)} alt="Regional Cup" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <i className="fas fa-medal text-4xl text-zinc-400 drop-shadow-[0_0_15px_rgba(161,161,170,0.5)]"></i>}
                            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow-md border border-[#0a0a0b] z-20 tabular-nums">x{c.trophyCounts.reg}</span>
                          </div>
                          <div className="text-[9px] text-[#8e8e93] text-center mt-1 font-medium max-w-[80px] truncate">{getDomesticCupInfo(state?.club?.country || 'GER', 4).name || 'Regional Cup'}</div>
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
      </div>
    </div>
  );
};
