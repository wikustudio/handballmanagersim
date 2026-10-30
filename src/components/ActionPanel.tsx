import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Language } from '../types';
import { LEAGUES, getLeagueInfo, formatMoney, formatNum, getLeagueStadiumRequirement, getClubMaxBankLoan, isReserveClub } from '../data/gameConstants';
import { getStadiumOptions } from './StadiumModal';
import { AnimatedTreasury } from './AnimatedTreasury';
import { BankLoanModal } from './BankLoanModal';
import { getLoanProgress } from '../engine/creditFacilityEngine';
import { getIncubatorCapacity } from '../engine/incubatorEngine';
import { t as tr } from '../data/translations';

interface ActionPanelProps {
  onTakeLoan?: (principal: number, years: 10 | 15 | 25) => void;
  onPayoffLoan?: () => void;
  onCoachMarket?: () => void;
  onTeamBonding?: () => void;
  onFanBonding?: () => void;
  mediaCost?: number;
  prCost?: number;
  mediaBaseBoost?: number;
  state: GameState;
  lang: Language;
  actionCosts: {
    stadium: number;
    bidReg: number;
    bidKey: number;
    youth: number;
    sponsor: number;
    academy?: number;
    medical?: number;
    bonding?: number;
  };
  financials: {
    wages: number;
    estRevenue: number;
    net: number;
  };
  onSponsorSelect: (type: 0 | 1 | 2) => void;
  onStadiumExpand: (seats: number, cost: number, fanBoost: number) => void;
  onShowTransfers: () => void;
  onShowStadium: () => void;
  onShowNewBuild?: () => void;
  onYouth: () => void;
  onUpgradeAcademy?: () => void;
  onUpgradeMedical?: () => void;
  onJobMarket: () => void;
  onResign: () => void;
  onPhilosophy?: () => void;
  onOpenSkills?: () => void;
  onSimulate: () => void;
  onShowTable: () => void;
  onShowLedger: () => void;
  onShowYouth?: () => void;
  onOpenCoachDossier?: (coach: any) => void;
  onPrestigePurchase?: (type: 'statue' | 'stadium' | 'feeder' | 'immortality') => void;
  onOpenMarketingModal?: () => void;
  onOpenIpoModal?: () => void;
  onOpenSquadRegistration?: () => void;
  onClaimTvCupJackpot?: () => void;
}

interface PrepInfo {
  key: string;
  titleEn: string;
  titleDe: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  costBadge?: string;
  descEn: string;
  descDe: string;
}

const PREP_INFOS: Record<string, PrepInfo> = {
  sponsor: {
    key: 'sponsor',
    titleEn: 'Negotiate Sponsors',
    titleDe: 'Sponsoren-Deal',
    icon: 'fa-handshake',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    costBadge: '+Deal (Max 3/yr)',
    descEn: 'Pitch corporate brands to secure upfront sponsorship payouts or performance bonus incentives. (Max 3 pitch attempts per season).',
    descDe: 'Verhandle mit Sponsoren fuer sofortige Gelder oder erfolgsabhaengige Praemien. (Max. 3 Pitch-Versuche pro Saison).'
  },
  youth: {
    key: 'youth',
    titleEn: 'Youth Academy',
    titleDe: 'Jugendakademie',
    icon: 'fa-seedling',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    costBadge: 'Scouting Fee',
    descEn: 'Scout high-potential teenage wonderkids into your youth pipeline. Promote top prospects or upgrade the facility to increase your odds of finding a Generational Talent.',
    descDe: 'Scoute hochkaraetige Nachwuchstalente fuer deinen Klub. Baue das NLZ aus, um deine Chancen auf ein Jahrhunderttalent drastisch zu erhoehen.'
  },
  bidReg: {
    key: 'bidReg',
    titleEn: 'Buy Regular Player',
    titleDe: 'Stammspieler kaufen',
    icon: 'fa-user-plus',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    costBadge: 'Transfer Fee',
    descEn: 'Acquire solid first-team players to strengthen squad depth and boost team overall rating (+OVR). (Max 3 regular transfers per season).',
    descDe: 'Verpflichte gestandene Profis zur Verstaerkung der Kaderbreite und Erhoehung der Team-Staerke (+OVR). (Max. 3 regulaere Transfers pro Saison).'
  },
  bidKey: {
    key: 'bidKey',
    titleEn: 'Buy Key Player',
    titleDe: 'Schluesselspieler kaufen',
    icon: 'fa-star',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    costBadge: 'High Fee',
    descEn: 'Sign a marquee key player for a major squad overall rating (+OVR) surge and immediate quality leap. (Max 3 key transfers per season).',
    descDe: 'Verpflichte einen Schluesselspieler fuer einen grossen Staerke-Schub (+OVR) im Team. (Max. 3 Key-Transfers pro Saison).'
  },
  galactico: {
    key: 'galactico',
    titleEn: 'Sign Galactico (League 1)',
    titleDe: 'Galactico (League 1)',
    icon: 'fa-crown',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    costBadge: 'League 1 Mega-Transfer',
    descEn: 'Bypass OVR cap limits completely independent of key transfers. Guaranteed +3 OVR and +5,000 Fans. (Max 1 Galactico per season).',
    descDe: 'Umgeht GES-Limits komplett unabhaengig von Key-Transfers. Garantiert +3 GES und +5.000 Fans. (Max. 1 Galactico pro Saison).'
  },
  sellPlayer: {
    key: 'sellPlayer',
    titleEn: 'Sell Players',
    titleDe: 'Spielerverkauf',
    icon: 'fa-sack-dollar',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    costBadge: '+Cash',
    descEn: 'Sell surplus players to raise capital and reduce wages. If your squad exceeds 25 players, aggressive contract expirations will force excess players out on free transfers at season end.',
    descDe: 'Verkaufe Spieler, um Gehaelter zu sparen. Bei einer Kadergroesse ueber 25 Spielern werden am Saisonende ueberschuessige Spieler den Verein abloesefrei verlassen (Vertragsende/Fehlende Spielzeit).'
  },
  stadium: {
    key: 'stadium',
    titleEn: 'Stadium Expansion',
    titleDe: 'Stadionausbau',
    icon: 'fa-building',
    iconBg: 'bg-gray-500/30',
    iconColor: 'text-white',
    costBadge: 'Cap Ex',
    descEn: 'Expand seating capacity to boost matchday income or commission monumental Mega-Projects (Spartakiad Amphitheater). (Max 1 per season).', // Dynamically handled in render
    descDe: 'Erhoehe die Kapazitaet fuer mehr Einnahmen oder starte monumentale Mega-Projekte (Spartakiade-Amphitheater). (Max. 1 pro Saison).', // Dynamically handled in render
  },
  resign: {
    key: 'resign',
    titleEn: 'Resign Director Post',
    titleDe: 'Als Sportdirektor zuruecktreten',
    icon: 'fa-door-open',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    costBadge: 'Immediate',
    descEn: 'Immediately resign from your current executive role. Headhunters will offer you new Director positions based on your current reputation.',
    descDe: 'Tritt sofort von deinem aktuellen Posten zurueck. Headhunter bieten dir neue Stellen als Sportdirektor an, basierend auf deinem Ansehen.'
  },
  jobMarket: {
    key: 'jobMarket',
    titleEn: 'Job Market',
    titleDe: 'Arbeitsmarkt',
    icon: 'fa-briefcase',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
    costBadge: 'Free',
    descEn: 'Browse vacant Sporting Director positions at other clubs to switch teams or take on new division challenges. (Max 1 search per season).',
    descDe: 'Durchstoebere freie Sportdirektor-Stellen bei anderen Vereinen, um den Klub zu wechseln oder neue Herausforderungen zu suchen. (Max. 1 Suche pro Saison).'
  },
  philosophy: {
    key: 'philosophy',
    titleEn: 'Adapt Philosophy',
    titleDe: 'Vereinsphilosophie',
    icon: 'fa-chess',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    costBadge: '5 MP',
    descEn: 'Change your club\'s tactical identity (e.g., Tiki-Taka, Gegenpressing, Catenaccio) using 5 Director Points. Make sure it synergizes with your Head Coach.',
    descDe: 'Wechsle die Spielphilosophie des Klubs (z.B. Tiki-Taka, Gegenpressing) fuer 5 Direktor-Punkte. Achte auf Synergien mit dem Trainer.'
  },
  skills: {
    key: 'skills',
    titleEn: 'Director Skills',
    titleDe: 'Direktor-Fähigkeiten',
    icon: 'fa-graduation-cap',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    costBadge: 'MP Perks',
    descEn: 'Equip or swap active director perks (e.g. Master Negotiator, Youth Guru) using earned Manager Points (MP) to boost specific club departments.',
    descDe: 'Rueste aktive Trainer-Boni (z.B. Jugend-Guru, Verhandlungs-Profi) mit verdienten Management-Punkten (MP) aus, um gezielte Vorteile zu nutzen.'
  }
};

export const ActionPanel: React.FC<ActionPanelProps> = ({
  state,
  lang,
  actionCosts,
  financials,
  onSponsorSelect,
  onStadiumExpand,
  onOpenCamp, onTeamBonding, onFanBonding,
  onShowTransfers,
  onShowStadium,
  onShowNewBuild,
  onYouth,
  onUpgradeAcademy,
  onUpgradeMedical,
  onCoachMarket,
  onOpenCoachDossier,
  onJobMarket,
  onResign,
  onPhilosophy,
  onOpenImpact,
  onOpenSkills,
  onSimulate,
  onShowTable,
  onShowLedger,
  onShowYouth,
  onTakeLoan,
  onPayoffLoan,
  onPrestigePurchase,
  onOpenMarketingModal,
  onOpenIpoModal,
  onOpenSquadRegistration,
  onClaimTvCupJackpot,
  mediaBaseBoost = 6500,
  mediaCost = 1500,
  prCost = 1500,
}) => {
  const totalProjects = (state.stadiumExpandedThisSeason || 0) + (state.academyUpgradedThisSeason || 0) + (state.medicalUpgradedThisSeason || 0);

  const t = (en: string, ..._ignored: any[]) => en;

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const [activeInfoKey, setActiveInfoKey] = useState<string | null>(null);
  const [showAllInfoModal, setShowAllInfoModal] = useState<boolean>(false);
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);
  const maxLoanAmount = getClubMaxBankLoan(state.club, state.budget, state.reputation);
  
  const hasStarMagnet = (state.managerSkills || []).includes('star_magnet');
  const maxKeyTransfers = hasStarMagnet ? 3 : 2;

  const [isSquadOpen, setIsSquadOpen] = useState<boolean>(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState<boolean>(false);
  const [isInfraOpen, setIsInfraOpen] = useState<boolean>(false);
  const [isManagerOpen, setIsManagerOpen] = useState<boolean>(false);
  const [trophyModalType, setTrophyModalType] = useState<'dom' | 'intl' | 'stadium' | null>(null);
  const [showGroundsDetails, setShowGroundsDetails] = useState<boolean>(false);

  React.useEffect(() => {
    setIsSquadOpen(false);
    setIsSponsorOpen(false);
    setIsInfraOpen(false);
    setIsManagerOpen(false);
  }, [state.year]);

  const isDe = lang === 'de';
  const league = getLeagueInfo(state.club.tier, state.club.country || 'GER');
  const isUnderdog = state.club.baseOvr < league.avgOvr;

  return (
    <div className="flex flex-col gap-4">

      {state.seasonPhase === 'mid' ? (
        <div className="bg-[#161820]/75 backdrop-blur-2xl rounded-3xl p-5 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] mb-4 relative overflow-hidden">
          {/* Subtle Ambient Sky-Blue Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="text-[10px] font-semibold tracking-wider text-sky-400/90 uppercase mb-1 relative z-10">
            {t('Mid-Season Window', 'Winterpause')}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1 relative z-10">
            {t('Winter Preparation', 'Winter-Vorbereitung')}
          </h2>
          <p className="text-xs text-zinc-400 font-medium mb-4 leading-relaxed relative z-10 max-w-xl">
            {t('The winter window is open! You have max 2 transfer slots. Plan a training camp to boost squad morale and tactical synergy.', 'Das Transferfenster ist offen! Max 2 Transfers. Plane ein Trainingslager, um Teammoral und Synergie zu stärken.')}
          </p>
          
          {Object.entries(state.cupProgress || {}).some(([_, status]) => status === 'SF') && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <i className="fa-solid fa-trophy text-xs"></i>
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-amber-200 uppercase tracking-wide text-[10px]">
                  {t('Cup Semi-Finals Awaiting', 'Pokal-Halbfinale steht an')}
                </div>
                <div className="text-zinc-300 text-[11px] leading-tight mt-0.5">
                  {t('Your squad reached the Semi-Final! Crunch knockout ties will take place during the 2nd half.', 'Dein Team steht im Halbfinale! Die K.-o.-Spiele finden in der Rückrunde statt.')}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <button 
              onClick={onShowTransfers} 
              className="bg-white/[0.04] hover:bg-white/[0.08] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-center transition cursor-pointer text-center group active:scale-[0.98] shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 mb-2 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-right-left text-sm"></i>
              </div>
              <span className="font-semibold text-white text-xs uppercase tracking-wide">{t('Transfers', 'Transfers')}</span>
            </button>

            <button 
              onClick={onOpenCamp} 
              disabled={state.winterCampDone} 
              className="bg-white/[0.04] hover:bg-white/[0.08] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-center transition cursor-pointer text-center group disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-plane-departure text-sm"></i>
              </div>
              <span className="font-semibold text-white text-xs uppercase tracking-wide">{t('Training Camp', 'Trainingslager')}</span>
            </button>

            <button 
              onClick={onTeamBonding} 
              disabled={Boolean(state.teamBondingThisSeason)}
              className="bg-white/[0.04] hover:bg-white/[0.08] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-center transition cursor-pointer text-center group active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 mb-2 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-users text-sm"></i>
              </div>
              <span className="font-semibold text-white text-xs uppercase tracking-wide">{t('Team Building', 'Teambuilding')}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 font-medium">{state.teamBondingThisSeason ? t('Used', 'Genutzt') : t('1x/Season', '1x/Saison')}</span>
            </button>

            <button 
              onClick={onFanBonding} 
              disabled={Boolean(state.fanBondingThisSeason)}
              className="bg-white/[0.04] hover:bg-white/[0.08] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-center transition cursor-pointer text-center group active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-bullhorn text-sm"></i>
              </div>
              <span className="font-semibold text-white text-xs uppercase tracking-wide">{t('Fan Bonding', 'Fan-Bindung')}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 font-medium">{state.fanBondingThisSeason ? t('Used', 'Genutzt') : t('1x/Season', '1x/Saison')}</span>
            </button>

            <button 
              onClick={onCoachMarket} 
              className="bg-white/[0.04] hover:bg-white/[0.08] p-4 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-center transition cursor-pointer text-center group col-span-2 active:scale-[0.98] shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-user-tie text-sm"></i>
              </div>
              <span className="font-semibold text-white text-xs uppercase tracking-wide">{t('Head Coach (Hire/Fire)', 'Cheftrainer (Einstellen/Entlassen)')}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Apple Frosted Glass 4-Stat Strip: Wins, Dom. Trophies, Intl. Trophies, Stadium */}
          <div className="bg-[#161820]/75 backdrop-blur-2xl rounded-3xl p-2.5 sm:p-3 border border-white/[0.08] grid grid-cols-4 gap-2 text-center shadow-[0_8px_32px_rgba(0,0,0,0.36)] shrink-0 mb-3">
            {/* Wins */}
            <div className="bg-white/[0.03] rounded-2xl p-2 sm:p-2.5 border border-white/[0.06] flex flex-col justify-center">
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5 truncate">
                <i className="fa-solid fa-check text-emerald-400 text-[10px]"></i>
                <span className="hidden sm:inline">{t('Wins', 'Siege')}</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white tabular-nums leading-none">
                {state.totals.wins}
              </div>
            </div>

            {/* Dom. Trophies */}
            <button 
              onClick={() => setTrophyModalType('dom')} 
              className="bg-white/[0.03] hover:bg-white/[0.07] rounded-2xl p-2 sm:p-2.5 border border-white/[0.06] flex flex-col items-center justify-center transition active:scale-95 cursor-pointer text-center group"
            >
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5 truncate">
                <i className="fa-solid fa-trophy text-amber-400 text-[10px] group-hover:scale-110 transition-transform"></i>
                <span className="hidden sm:inline">{t('Dom. Trophies', 'Nat. Titel')}</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-300 tabular-nums leading-none">
                {state.totals.domTrophies || 0}
              </div>
            </button>

            {/* Intl. Trophies */}
            <button 
              onClick={() => setTrophyModalType('intl')} 
              className="bg-white/[0.03] hover:bg-white/[0.07] rounded-2xl p-2 sm:p-2.5 border border-white/[0.06] flex flex-col items-center justify-center transition active:scale-95 cursor-pointer text-center group"
            >
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5 truncate">
                <i className="fa-solid fa-globe text-sky-400 text-[10px] group-hover:scale-110 transition-transform"></i>
                <span className="hidden sm:inline">{t('Intl. Trophies', 'Int. Titel')}</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-sky-300 tabular-nums leading-none">
                {state.totals.intTrophies || 0}
              </div>
            </button>

            {/* Stadium */}
            <button 
              onClick={onShowStadium} 
              className="bg-white/[0.03] hover:bg-white/[0.07] rounded-2xl p-2 sm:p-2.5 border border-white/[0.06] flex flex-col items-center justify-center transition active:scale-95 cursor-pointer text-center group"
            >
              <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5 truncate">
                <i className="fa-solid fa-landmark text-zinc-400 text-[10px] group-hover:scale-110 transition-transform"></i>
                <span className="hidden sm:inline">{t('Stadium', 'Stadion')}</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white tabular-nums leading-none truncate w-full">
                {formatNum(state.club.stadium)}
              </div>
            </button>
          </div>

          {/* Season Preparations Action Panel Card */}
          <div className="bg-[#161820]/75 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.36)] mb-3 relative overflow-hidden">
            {/* Subtle Ambient Glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-1.5 relative z-10">
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {t('Season Preparations', 'Saisonvorbereitung')}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllInfoModal(true);
                  }}
                  className="w-5 h-5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-400/25 flex items-center justify-center text-[10px] hover:bg-sky-500/25 transition cursor-pointer shrink-0"
                  title={t('View Season Preparation Guide', 'Saisonvorbereitungs-Guide')}
                >
                  <i className="fa-solid fa-info"></i>
                </button>
              </div>
              {(state.budget < 0) && (
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-rose-500/15 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/25 flex items-center gap-1.5">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  {t('Deficit', 'Defizit')}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-medium mb-4 leading-relaxed relative z-10">
              {t(
                'Prepare your squad & commercial deals. Pitch sponsors for bonus revenue, buy/sell players, or simulate when ready.',
                'Bereite Kader & Sponsoren vor. Verhandle lukrative Deals, handle Spieler oder simuliere direkt.'
              )}
            </p>

        {/* Stadium Capacity Deficit Warning starting in League 3 */}
        {state.club.tier <= 3 && state.club.stadium < getLeagueStadiumRequirement(state.club.tier, state.club.country) && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
              <i className="fas fa-building text-xs"></i>
            </div>
            <div className="text-[11px] text-amber-200/90 leading-tight">
              <div className="font-bold text-amber-300 mb-0.5">
                {t(
                  `Stadium Deficit (League ${state.club.tier} Standard: ${formatNum(getLeagueStadiumRequirement(state.club.tier, state.club.country))} Seats)`,
                  `Stadion-Defizit (League ${state.club.tier} Soll: ${formatNum(getLeagueStadiumRequirement(state.club.tier, state.club.country))} Plaetze)`
                )}
              </div>
              {t(
                `Your stadium (${formatNum(state.club.stadium)} seats) is below the league standard. Expand your stadium to avoid match simulation penalties & venue rent fees!`,
                `Dein Stadion (${formatNum(state.club.stadium)} Plaetze) liegt unter dem Ligen-Standard. Baue dein Stadion aus, um Match-Malus & Ausweichmiete zu vermeiden!`
              )}
            </div>
          </div>
        )}




        
        {/* COMMERCIAL & SPONSORSHIPS HUD */}
        {true && (
        <div className={`rounded-2xl border shadow-inner mb-4 overflow-hidden transition-colors ${isSponsorOpen ? 'border-purple-500/30' : 'border-white/5'}`}>

          <button 
            onClick={() => setIsSponsorOpen(!isSponsorOpen)}
            className={`w-full flex items-center justify-between p-4 transition cursor-pointer ${isSponsorOpen ? 'bg-purple-950/40 hover:bg-purple-900/50' : 'bg-[#1c1c1e] hover:bg-[#2c2c2e]'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
              <div className={`font-black text-[13px] sm:text-sm uppercase tracking-wide flex items-center gap-2 ${isSponsorOpen ? 'text-purple-400' : 'text-white'}`}>
                <i className="fas fa-handshake text-purple-400"></i>
                {t('Commercial & Sponsorships', 'Sponsoring & Kommerz')}
              </div>
            </div>
            <i className={`fas fa-chevron-${isSponsorOpen ? 'up' : 'down'} ${isSponsorOpen ? 'text-purple-400' : 'text-[#8e8e93]'}`}></i>
          </button>

          <AnimatePresence initial={false}>
            {isSponsorOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
              <div className="p-3 sm:p-4 border-t border-white/5 flex flex-col gap-3">
              {(() => {
                const maxCommercialPitches = 3;
                const currentCommercialCount = state.sponsorsPitchedThisSeason || 0;
                const isCommercialLimitReached = currentCommercialCount >= maxCommercialPitches;

                return (
                  <div className="bg-[#1c1c1e] rounded-xl p-3 border border-white/5 flex flex-col gap-1.5 shadow-sm mb-1 text-left">
                    <div className="text-[11px] text-[#8e8e93] font-bold uppercase tracking-widest flex justify-between items-center">
                      <span>{t('Sponsor Pitches', 'Sponsoren-Pitches')}</span>
                      <span className="text-white font-black">{currentCommercialCount} / {maxCommercialPitches}</span>
                    </div>
                    <div className="text-[10px] text-[#8e8e93] leading-relaxed">
                      {t('You can negotiate up to 3 commercial sponsor deals per season. Pitching megadeals carries risk.', 'Du kannst bis zu 3 Sponsoren-Deals pro Saison aushandeln. Megadeals bergen Risiken.')}
                    </div>
                  </div>
                );
              })()}
              {(() => {
                const maxCommercialPitches = 3;
                const currentCommercialCount = state.sponsorsPitchedThisSeason || 0;
                const isCommercialLimitReached = currentCommercialCount >= maxCommercialPitches;

                let baseBoost = mediaBaseBoost;
                if (state.tactic === 'Tiki-Taka') baseBoost = Math.round(baseBoost * 1.15);
                const hasSalesmaster = (state.managerSkills || []).includes('salesmaster');

                if (hasSalesmaster) baseBoost = Math.round(baseBoost * 1.10);
                
                return (
                  <>
                    <button onClick={() => onSponsorSelect(0)} disabled={isCommercialLimitReached} className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-white/5 text-left disabled:opacity-50 transition cursor-pointer">
                      <div className="text-[12px] font-bold text-white mb-1 flex flex-wrap items-center justify-between gap-1">
                        <span className="flex items-center gap-2">{t('Standard Deal', 'Standard Deal')} {hasSalesmaster && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1"><i className="fas fa-bolt"></i> +10% Cash</span>}</span>
                        <span className="text-emerald-400">+{formatMoney(Math.round(baseBoost * 1.5))}</span>
                      </div>
                      <div className="text-[10px] text-[#8e8e93]">{t('100% Guaranteed. Funds added immediately to treasury.', '100% Sicher. Geld fliesst sofort in die Kasse.')}</div>
                    </button>
                    <button onClick={() => onSponsorSelect(1)} disabled={isCommercialLimitReached} className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-white/5 text-left disabled:opacity-50 transition cursor-pointer">
                      <div className="text-[12px] font-bold text-white mb-1 flex flex-wrap items-center justify-between gap-1">
                        <span className="flex items-center gap-2">{t('Megadeal Pitch', 'Megadeal Pitch')} {hasSalesmaster && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1"><i className="fas fa-bolt"></i> 55% Success</span>}</span>
                        <span className="text-purple-400">+{formatMoney(Math.round(baseBoost * 2.4))}</span>
                      </div>
                      <div className="text-[10px] text-[#8e8e93]">{hasSalesmaster ? t('Aggressive negotiation. 55% chance of success.', 'Aggressive Verhandlung. 55% Erfolgschance.') : t('Aggressive negotiation. 40% chance of success.', 'Aggressive Verhandlung. 40% Erfolgschance.')}</div>
                    </button>
                    
                    <button onClick={() => onSponsorSelect(2)} disabled={isCommercialLimitReached || state.performanceSponsorBlockedNextSeason || state.performanceSponsorSignedThisSeason} className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-white/5 text-left disabled:opacity-50 transition cursor-pointer">
                      <div className="text-[12px] font-bold text-white mb-1 flex flex-wrap items-center justify-between gap-1">
                        <span className="flex items-center gap-2">{t('Performance Deal', 'Performance Deal')} {hasSalesmaster && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1"><i className="fas fa-bolt"></i> +10% Cash</span>}</span>
                        <span className="text-amber-400">+{formatMoney(Math.round(baseBoost * 2.6))}</span>
                      </div>
                      <div className="text-[10px] text-[#8e8e93]">{state.performanceSponsorBlockedNextSeason ? <span className="text-red-400 font-bold"><i className="fas fa-lock mr-1"></i>Locked this season due to missed targets.</span> : state.performanceSponsorSignedThisSeason ? <span className="text-amber-400 font-bold"><i className="fas fa-check mr-1"></i>Already signed this season.</span> : 'High payout but tied to strict tactical objectives.'}</div>
                    </button>

                    {/* Public Offering (IPO) Trigger */}
                    {onOpenIpoModal && (
                      <button
                        onClick={onOpenIpoModal}
                        className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-amber-500/25 text-left transition cursor-pointer mt-2 w-full group"
                      >
                        <div className="text-[12px] font-bold text-white mb-1 flex flex-wrap items-center justify-between gap-1">
                          <span className="flex items-center gap-2">
                            <i className="fa-solid fa-landmark text-amber-400 group-hover:scale-110 transition-transform"></i>
                            <span>{t('Public Offering', 'Börsengang (IPO)')}</span>
                            {state.isPublic ? (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1">
                                <i className="fa-solid fa-chart-line text-[8px]"></i>
                                €{state.stockPrice ? state.stockPrice.toFixed(2) : '10.00'}
                              </span>
                            ) : state.club.tier === 1 && (state.club.fanBase || 0) >= 1000000 ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1">
                                <i className="fa-solid fa-coins text-[8px]"></i>
                                Eligible
                              </span>
                            ) : (
                              <span className="bg-white/5 text-zinc-400 border border-white/10 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1">
                                <i className="fa-solid fa-lock text-[8px]"></i>
                                Tier 1 & 1M Fans
                              </span>
                            )}
                          </span>
                          <span className="text-amber-300 font-mono text-[10px] flex items-center gap-1">
                            <span>{state.isPublic ? 'Public Float: 25%' : 'Float 25% Equity'}</span>
                            <i className="fa-solid fa-arrow-right text-[8px]"></i>
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8e8e93]">
                          {state.isPublic
                            ? t('Club is publicly traded. Stock price fluctuates each season based on sporting success.', 'Verein ist an der Börse notiert. Aktienkurs schwankt je nach sportlichem Erfolg.')
                            : t('Float 25% of the club on the stock exchange for an immediate multi-million cash injection. Requires Tier 1 & 1M fans.', 'Bringen Sie 25% des Vereins an die Börse für sofortiges Eigenkapital. Erfordert 1. Liga und 1 Mio. Fans.')}
                        </div>
                      </button>
                    )}


                    {/* Bank Loan Facility */}
                    {(!state.bankLoan || state.bankLoan.yearsLeft <= 0) ? (
                      <button 
                        onClick={() => setShowLoanModal(true)} 
                        className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-sky-500/25 text-left transition cursor-pointer mt-2 w-full"
                      >
                        <div className="text-[12px] font-bold text-white mb-1 flex flex-wrap items-center justify-between gap-1">
                          <span className="flex items-center gap-2">
                            <i className="fa-solid fa-building-columns text-sky-400"></i>
                            <span>{t('Commercial Bank Loan', 'Bankkredit aufnehmen')}</span>
                            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1">
                              <i className="fa-solid fa-check text-[8px]"></i>
                              {t('Exempt from 3/3 Limit', 'Kein 3/3 Limit')}
                            </span>
                          </span>
                          <span className="text-emerald-400 font-bold">+{formatMoney(maxLoanAmount)}</span>
                        </div>
                        <div className="text-[10px] text-[#8e8e93]">
                          {t('Institutional credit facility scaled to club stature and debt. Does not consume your 3/3 seasonal commercial limit.', 'Institutionelle Kreditlinie, skaliert nach Vereinsgröße und Schulden. Verbraucht kein Sponsoren-Limit.')}
                        </div>
                      </button>
                    ) : (
                      (() => {
                        const progress = getLoanProgress(state.bankLoan);
                        const percentPaid = progress ? progress.percentPaidOff : Math.round(((state.bankLoan.totalYears - state.bankLoan.yearsLeft) / state.bankLoan.totalYears) * 100);
                        const remaining = progress ? progress.remainingPrincipal : Math.round(state.bankLoan.principal * (state.bankLoan.yearsLeft / state.bankLoan.totalYears));
                        const initial = progress ? progress.initialPrincipal : state.bankLoan.principal;
                        const earlyCost = progress ? progress.earlyPayoffCost : remaining;

                        return (
                          <div className="bg-[#1c1c1e] p-3 rounded-xl border border-sky-500/30 text-left mt-2 flex flex-col gap-2.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-2">
                                <i className="fa-solid fa-building-columns text-sky-400"></i>
                                {state.bankLoan.loanType === 'bond'
                                  ? t('Infrastructure Bond', 'Infrastrukturanleihe')
                                  : t('Active Bank Facility', 'Aktiver Bankkredit')}
                              </span>
                              <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                                {state.bankLoan.yearsLeft} / {state.bankLoan.totalYears} {t('yrs left', 'J. übrig')}
                              </span>
                            </div>

                            {/* Amortization Progress Bar */}
                            <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-semibold">
                                <span className="text-sky-300">{percentPaid}% {t('Amortized', 'Getilgt')}</span>
                                <span className="text-zinc-400 font-mono">
                                  {formatMoney(initial - remaining)} / {formatMoney(initial)}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 flex">
                                <div
                                  className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                                  style={{ width: `${Math.max(4, Math.min(100, percentPaid))}%` }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/25 p-2 rounded-lg border border-white/5">
                              <div>
                                <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{t('Annual Service', 'Jährl. Tilgung')}</div>
                                <div className="font-bold text-rose-400 tabular-nums">-{formatMoney(state.bankLoan.annualPayment)}/yr</div>
                              </div>
                              <div>
                                <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{t('Remaining Debt', 'Restschuld')}</div>
                                <div className="font-bold text-white tabular-nums">
                                  {formatMoney(remaining)}
                                </div>
                              </div>
                            </div>

                            {onPayoffLoan && (
                              <button
                                onClick={onPayoffLoan}
                                disabled={state.budget < earlyCost}
                                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 disabled:opacity-40 disabled:hover:bg-emerald-500/10 text-[10px] font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <i className="fa-solid fa-check-circle"></i>
                                <span>
                                  {t(
                                    `Pay Off Debt Early (${formatMoney(earlyCost)})`,
                                    `Schulden vorzeitig ablösen (${formatMoney(earlyCost)})`
                                  )}
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })()
                    )}

                    {/* Open Marketing & Tours Desk */}
                    {onOpenMarketingModal && (
                      <button 
                        onClick={onOpenMarketingModal}
                        className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-purple-500/30 text-left transition cursor-pointer mt-2 w-full group"
                      >
                        <div className="text-[12px] font-bold text-white mb-1 flex flex-wrap items-center justify-between gap-1">
                          <span className="flex items-center gap-2">
                            <i className="fa-solid fa-bullhorn text-purple-400 group-hover:scale-110 transition-transform"></i>
                            <span>{t('Marketing & PR', 'Marketing & PR')}</span>
                            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase flex items-center gap-1">
                              Campaigns & Tours
                            </span>
                          </span>
                          <span className="text-purple-300 font-mono text-[10px] flex items-center gap-1">
                            <span>Tours & Fanbase</span>
                            <i className="fa-solid fa-arrow-right text-[8px]"></i>
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8e8e93]">
                          {t('Launch commercial campaigns and pre-season international tours to expand global fanbase and boost squad rating.', 'Starten Sie PR-Kampagnen und internationale Touren, um Ihre globale Fanbasis auszubauen.')}
                        </div>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        
        {/* Removed State Subsidies Section */} 



        {/* SQUAD & TRANSFERS HUD (Collapsible) */}
        <div className={`rounded-2xl border shadow-inner mb-4 overflow-hidden transition-colors ${isSquadOpen ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-white/5'}`}>
          {/* Header Toggle */}
          <button 
            onClick={() => setIsSquadOpen(!isSquadOpen)}
            className={`w-full flex items-center justify-between p-4 transition cursor-pointer ${isSquadOpen ? 'bg-emerald-900/40 hover:bg-emerald-900/50 border-b border-emerald-500/50' : 'bg-[#1c1c1e] hover:bg-[#2c2c2e]'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
              <div className={`font-black text-[13px] sm:text-sm uppercase tracking-wide flex items-center gap-2 ${isSquadOpen ? 'text-emerald-400' : 'text-white'}`}>
                <i className="fas fa-users-cog text-emerald-400"></i>
                {t('Squad & Transfers', 'Kader & Transfers')}
              </div>
            </div>
            <i className={`fas fa-chevron-${isSquadOpen ? 'up' : 'down'} ${isSquadOpen ? 'text-emerald-400' : 'text-[#8e8e93]'}`}></i>
          </button>

          {/* Collapsible Content */}
          <AnimatePresence initial={false}>
            {isSquadOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
              <div className="p-3 sm:p-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => onOpenSquadRegistration && onOpenSquadRegistration()}
                className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] transition cursor-pointer rounded-xl p-3 border border-white/5 flex flex-col gap-1.5 shadow-sm mb-3 text-left relative overflow-hidden group"
              >
                <div className="text-[11px] text-[#8e8e93] font-bold uppercase tracking-widest flex justify-between items-center w-full">
                  <span className="flex items-center gap-1.5">
                    {t('Squad Context', 'Kader-Kontext')}
                    <i className="fa-solid fa-chevron-right text-[9px] opacity-50 group-hover:translate-x-0.5 transition-transform"></i>
                  </span>
                  <span className={`font-black ${((state.club.squadSize || 24) < 18 || (state.club.squadSize || 24) > 50) ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                    {state.club.squadSize || 24} <span className="text-[#8e8e93] font-semibold">(Min: 18 | Max: 50)</span>
                  </span>
                </div>
                <div className="text-[10px] text-[#8e8e93] leading-relaxed">
                  {t('Youth prospects will join next season. 1-4 players may retire. If a transfer bid fails, the funds are immediately refunded to your treasury in full.', 'Jugendspieler stossen naechste Saison dazu. 1-4 Spieler koennten zuruecktreten. Wenn ein Transferangebot scheitert, wird das Geld in die Kasse zurueckerstattet.')}
                </div>
                <div className="text-[12px] font-medium text-white/90 leading-snug mt-1.5 flex flex-wrap gap-2">
                  <div className="bg-black/20 px-2 py-1 rounded border border-white/5"><span className="text-emerald-400 font-bold">+{state.youthPipeline.length}</span> {t('Academy', 'Akademie')}</div>
                  <div className="bg-black/20 px-2 py-1 rounded border border-white/5"><span className="text-blue-400 font-bold">+{state.regTransfersThisSeason + state.keyTransfersThisSeason}</span> {t('In', 'Zugaenge')}</div>
                  <div className="bg-black/20 px-2 py-1 rounded border border-white/5"><span className="text-red-400 font-bold">-{state.squadSalesThisSeason || 0}</span> {t('Sold', 'Verkauft')}</div>
                  <div className="bg-black/20 px-2 py-1 rounded border border-emerald-500/10"><span className="text-emerald-400 font-bold">+{state.loansThisSeason || 0}</span> {t('Loans', 'Leihen')}</div>
                </div>
              </button>
              
              <div className="flex flex-col gap-3">
          {/* Youth Academy Hub */}
          <button
            onClick={() => { if(onShowYouth) onShowYouth(); }}
            className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-emerald-500/30 text-left transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
            <div className="text-[13px] font-bold text-white flex items-center justify-between mb-1">
              <span className="flex items-center gap-2">
                <i className="fas fa-seedling text-emerald-400"></i>
                {t('Youth Academy', 'Jugendakademie')}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1">
                {state.youthPipeline.length}/{getIncubatorCapacity(state.club.academyLevel || 1)}
              </span>
            </div>
            <div className="text-[10px] text-[#8e8e93]">
              {t('Scout local talent and manage your youth pipeline.', 'Scoute Talente und verwalte die Akademie.')}
            </div>
          </button>

          {/* Team Bonding */}
          {onTeamBonding && (
            <button
              onClick={() => { onTeamBonding(); }}
              disabled={Boolean(state.teamBondingThisSeason)}
              className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-sky-500/30 text-left transition cursor-pointer relative overflow-hidden mb-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none"></div>
              <div className="text-[13px] font-bold text-white flex items-center justify-between mb-1">
                <span className="flex items-center gap-2">
                  <i className="fas fa-handshake text-sky-400"></i>
                  {t('Team Bonding', 'Team-Building')}
                </span>
                <div className="flex items-center gap-2">
                  {state.teamBondingThisSeason && (
                    <span className="text-[9px] text-zinc-400 uppercase font-semibold">1x/Saison</span>
                  )}
                  <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-[#8e8e93]">
                {state.teamBondingThisSeason ? t('Already held this season.', 'Diese Saison bereits genutzt.') : t('Squad retreat gamble to restore locker room morale (1x per season).', 'Unberechenbare Klausur zur Steigerung der Kadermoral (1x pro Saison).')}
              </div>
            </button>
          )}

          {/* Transfer Market Hub */}
          <button
            onClick={() => { onShowTransfers(); }}
            className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-blue-500/30 text-left transition cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.05)] relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
            <div className="text-[13px] font-bold text-white flex items-center justify-between mb-1">
              <span className="flex items-center gap-2">
                <i className="fas fa-exchange-alt text-blue-400"></i>
                {t('Transfer Market', 'Transfermarkt')}
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black tracking-wider uppercase border border-blue-500/30">
                Open
              </span>
            </div>
            <div className="text-[10px] text-[#8e8e93]">
              {t('Sign squad players, star players, or sell assets.', 'Spieler verpflichten, Stars kaufen oder verkaufen.')}
            </div>
          </button>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* STADIUM & INFRASTRUCTURE HUD */}
        <div className={`rounded-2xl border shadow-inner mb-4 overflow-hidden transition-colors ${isInfraOpen ? 'border-blue-500/30' : 'border-white/5'}`}>
          <button 
            onClick={() => setIsInfraOpen(!isInfraOpen)}
            className={`w-full flex items-center justify-between p-4 transition cursor-pointer ${isInfraOpen ? 'bg-blue-950/40 hover:bg-blue-900/50' : 'bg-[#1c1c1e] hover:bg-[#2c2c2e]'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
              <div className={`font-black text-[13px] sm:text-sm uppercase tracking-wide flex items-center gap-2 ${isInfraOpen ? 'text-blue-400' : 'text-white'}`}>
                <i className="fas fa-building text-blue-400"></i>
                {t('Stadium & Infrastructure', 'Stadion & Infrastruktur')}
              </div>
            </div>
            <i className={`fas fa-chevron-${isInfraOpen ? 'up' : 'down'} ${isInfraOpen ? 'text-blue-400' : 'text-[#8e8e93]'}`}></i>
          </button>

          <AnimatePresence initial={false}>
            {isInfraOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
              <div className="p-3 sm:p-4 border-t border-white/5 flex flex-col gap-3">
              <div className="bg-[#1c1c1e] rounded-xl p-3 border border-white/5 flex flex-col gap-1.5 shadow-sm mb-1 text-left">
                <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex justify-between items-center">
                  <span>{t('Season Project Limit', 'Saison-Bauprojekte')}</span>
                  <span className="text-white font-bold tabular-nums">{totalProjects} / 2</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                  {t('Maximum 2 projects per season (limit 1 per facility type).', 'Max. 2 Projekte pro Saison (max. 1 pro Typ: Stadion, Akademie, Med. Abteilung).')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Expand Current Stadium Button */}
                <button
                  onClick={() => { onShowStadium(); }}
                  disabled={totalProjects >= 2 || (state.stadiumExpandedThisSeason || 0) >= 1}
                  className="bg-white/[0.03] hover:bg-white/[0.06] p-3.5 rounded-2xl border border-white/[0.06] text-left transition cursor-pointer flex items-center justify-between group disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 text-xs shrink-0 group-hover:scale-105 transition-transform">
                      <i className="fa-solid fa-landmark"></i>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white mb-0.5">
                        {t('Expand Stadium', 'Stadion ausbauen')}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-normal">
                        {t('Add modular grandstands to increase matchday capacity.', 'Füge dem aktuellen Stadion neue Tribünen hinzu.')}
                      </div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors shrink-0">
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </div>
                </button>

                {/* Upgrade Academy Button */}
                {onUpgradeAcademy && (
                  <button
                    onClick={() => { onUpgradeAcademy(); }}
                    disabled={totalProjects >= 2 || (state.academyUpgradedThisSeason || 0) >= 1 || (state.club.academyLevel || 1) >= 5}
                    className="bg-white/[0.03] hover:bg-white/[0.06] p-3.5 rounded-2xl border border-white/[0.06] text-left transition cursor-pointer flex items-center justify-between group disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs shrink-0 group-hover:scale-105 transition-transform">
                        <i className="fas fa-seedling"></i>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white mb-0.5 flex items-center">
                          <span>{t('Upgrade Academy', 'Jugendakademie ausbauen')}</span>
                          { (state.club.academyLevel || 1) >= 5 && <span className="ml-2 text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">Max</span> }
                        </div>
                        <div className="text-[11px] text-zinc-400 font-normal">
                          {t('Improve facilities to attract generational youth talent.', 'Erhöht die Chance auf Top- und Ausnahmetalente.')}
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <i className="fas fa-arrow-right text-[10px]"></i>
                    </div>
                  </button>
                )}

                {/* Upgrade Medical Button */}
                {onUpgradeMedical && (
                  <button
                    onClick={() => { onUpgradeMedical(); }}
                    disabled={totalProjects >= 2 || (state.medicalUpgradedThisSeason || 0) >= 1 || (state.club.medicalLevel || 1) >= 5}
                    className="bg-white/[0.03] hover:bg-white/[0.06] p-3.5 rounded-2xl border border-white/[0.06] text-left transition cursor-pointer flex items-center justify-between group disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-xs shrink-0 group-hover:scale-105 transition-transform">
                        <i className="fas fa-heartbeat"></i>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white mb-0.5 flex items-center">
                          <span>{t('Upgrade Medical', 'Medizinabteilung ausbauen')}</span>
                          { (state.club.medicalLevel || 1) >= 5 && <span className="ml-2 text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">Max</span> }
                        </div>
                        <div className="text-[11px] text-zinc-400 font-normal">
                          {t('Minimize aging decay and extend veteran longevity.', 'Reduziert den Altersverfall und schützt Leistungsträger.')}
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors shrink-0">
                      <i className="fas fa-arrow-right text-[10px]"></i>
                    </div>
                  </button>
                )}

                {/* Build New Stadium (Mega-Project) Button */}
                <button
                  onClick={() => { if(onShowNewBuild) onShowNewBuild(); }}
                  disabled={totalProjects >= 2 || (state.stadiumExpandedThisSeason || 0) >= 1}
                  className="bg-amber-500/[0.04] hover:bg-amber-500/[0.08] p-3.5 rounded-2xl border border-amber-400/20 text-left transition cursor-pointer flex items-center justify-between group disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 text-xs shrink-0 group-hover:scale-105 transition-transform">
                      <i className="fas fa-crown"></i>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-amber-200 mb-0.5 flex items-center gap-1.5">
                        <span>{t('Mega-Project', 'Mega-Projekt')}</span>
                        <span className="text-[10px] text-amber-400/80 font-normal">· New Build</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-normal">
                        {t('Demolish and construct a state-of-the-art arena.', 'Abriss und Neubau einer hochmodernen Arena.')}
                      </div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400 group-hover:scale-105 transition-all shrink-0">
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </div>
                </button>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* DIRECTOR & PHILOSOPHY HUD */}
        <div className={`rounded-2xl border shadow-inner mb-4 overflow-hidden transition-colors ${isManagerOpen ? 'border-amber-500/30' : 'border-white/5'}`}>
          <button 
            onClick={() => setIsManagerOpen(!isManagerOpen)}
            className={`w-full flex items-center justify-between p-4 transition cursor-pointer ${isManagerOpen ? 'bg-amber-950/40 hover:bg-amber-900/50' : 'bg-[#1c1c1e] hover:bg-[#2c2c2e]'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
              <div className={`font-black text-[13px] sm:text-sm uppercase tracking-wide flex items-center gap-2 ${isManagerOpen ? 'text-amber-400' : 'text-white'}`}>
                <i className="fas fa-user-tie text-amber-400"></i>
                {t('Director & Staff', 'Direktor & Personal')}
              </div>
            </div>
            <i className={`fas fa-chevron-${isManagerOpen ? 'up' : 'down'} ${isManagerOpen ? 'text-amber-400' : 'text-[#8e8e93]'}`}></i>
          </button>

          <AnimatePresence initial={false}>
            {isManagerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
              <div className="p-3 sm:p-4 border-t border-white/5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="bg-[#1c1c1e] rounded-xl p-3 border border-white/5 flex flex-col gap-1 shadow-sm text-left">
                  <div className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                    {t('Club Director', 'Sportdirektor')}
                  </div>
                  <div className="text-xs font-black text-white truncate">{state.managerName}</div>
                  <div className="text-[9px] text-[#8e8e93] flex justify-between items-center">
                    <span>Rep: {Math.floor(state.reputation || 10)}</span>
                    <span className="text-amber-500/70">{state.skillPoints || 0} MP</span>
                  </div>
                </div>

                <button 
                  onClick={() => { 
                    setIsManagerOpen(false); 
                    if (state.currentCoach && onOpenCoachDossier) {
                      onOpenCoachDossier(state.currentCoach);
                    } else if (onCoachMarket) {
                      onCoachMarket(); 
                    }
                  }}
                  className="bg-[#1c1c1e] hover:bg-[#2c2c2e] rounded-xl p-3 border border-indigo-500/20 flex flex-col gap-1 shadow-sm text-left relative overflow-hidden group cursor-pointer transition-colors w-full"
                >
                  <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                  <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest flex items-center justify-between w-full">
                    <span>{t('Head Coach', 'Cheftrainer')}</span>
                    {state.currentCoach ? (
                      <span className="text-[8px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-400/20 flex items-center gap-0.5">
                        <i className="fa-solid fa-fingerprint text-[7px]"></i>
                        <span>Dossier</span>
                      </span>
                    ) : (
                      <i className="fas fa-chevron-right text-[8px] opacity-50"></i>
                    )}
                  </div>
                  <div className="text-xs font-black text-white truncate relative z-10">
                    {state.currentCoach ? state.currentCoach.name : t('Vacant', 'Vakant')}
                  </div>
                  <div className="text-[9px] text-[#8e8e93] flex justify-between items-center relative z-10 w-full">
                    <span className="truncate max-w-[50%]">{state.currentCoach ? state.currentCoach.style : '-'}</span>
                    {state.currentCoach && (
                      <span className="text-emerald-400 font-bold">+{state.currentCoach.ovrBoost} OVR</span>
                    )}
                  </div>
                  {state.currentCoach && (
                    <div className="text-[8px] uppercase font-bold mt-0.5 relative z-10 flex flex-wrap justify-between gap-1 w-full">
                      {state.currentCoach.strength && <span className="text-indigo-300/80">{state.currentCoach.strength}</span>}
                      {state.currentCoach.weakness && (
                        <span className="text-rose-400 flex items-center gap-0.5" title={state.currentCoach.weakness}>
                          <i className="fas fa-triangle-exclamation text-[7px]"></i> {state.currentCoach.weakness}
                        </span>
                      )}
                      <span className="text-zinc-400">{state.currentCoach.contractYearsLeft} Yr(s) left</span>
                      <span className="text-zinc-400">({state.coachTenure || 0} Yrs at Club)</span>
                      {(state.coachTenure || 0) >= 3 && state.currentCoach.strength !== 'Continental Legend' && (
                        <span className="text-rose-400 flex items-center gap-1 w-full bg-rose-500/15 border border-rose-500/25 px-1.5 py-0.5 rounded text-[7px]" title="Stale Voice: Squad is tuning out the manager (-1 OVR)">
                          <i className="fa-solid fa-triangle-exclamation text-[7px]"></i> Stale Voice (-1 OVR)
                        </span>
                      )}
                      {state.hasNewManagerBounce && (
                        <span className="text-emerald-400 flex items-center gap-1 w-full bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded text-[7px]" title="New Manager Bounce (+2 OVR)">
                          <i className="fa-solid fa-sparkles text-[7px]"></i> New Manager Bounce (+2 OVR)
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </div>
              {/* Board & Impact */}
              <button
                onClick={() => { setIsManagerOpen(false); if (onOpenImpact) onOpenImpact(); }}
                className="bg-[#1c1c1e] hover:bg-[#2c2c2e] p-3 rounded-xl border border-white/5 text-left transition cursor-pointer"
              >
                <div className="text-[12px] font-bold text-white flex items-center justify-between mb-1">
                  <span>{t('Board & Impact', 'Vorstand & Einfluss')}</span>
                  <span className="text-white/60">{state.clubImpactScore ?? 50}/100</span>
                </div>
                <div className="text-[10px] text-[#8e8e93]">
                  View board expectations and dressing room impact.
                </div>
              </button>
              
              {/* Staff & Tactics (Unified Coach & Philosophy Desk) */}
              <button
                onClick={() => { 
                  setIsManagerOpen(false); 
                  if (onCoachMarket) onCoachMarket(); 
                  else if (onPhilosophy) onPhilosophy(); 
                }}
                className="bg-white/[0.03] hover:bg-white/[0.06] p-3 rounded-xl border border-white/[0.08] hover:border-sky-400/30 text-left transition cursor-pointer group"
              >
                <div className="text-[12px] font-bold text-white flex items-center justify-between mb-1">
                  <span className="group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                    <i className="fa-solid fa-user-tie text-[11px] text-sky-400"></i>
                    <span>{t('Staff & Tactics', 'Trainerstab & Taktik')}</span>
                  </span>
                  <span className="text-sky-400 font-semibold text-[11px] flex items-center gap-1">
                    <span className="truncate max-w-[100px]">{state.currentCoach ? state.currentCoach.name : t('Interim', 'Interim')}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-amber-400">{state.tactic}</span>
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  {t('Manage head coach, browse job market, and adapt tactical DNA.', 'Cheftrainer verwalten, Markt durchsuchen und Taktik anpassen.')}
                </div>
              </button>

              {/* Job Market */}
              <button
                onClick={() => { setIsManagerOpen(false); onJobMarket(); }}
                className="bg-white/[0.03] hover:bg-white/[0.06] p-3 rounded-xl border border-white/[0.08] hover:border-sky-400/30 text-left transition cursor-pointer group"
              >
                <div className="text-[12px] font-bold text-white flex items-center justify-between mb-1">
                  <span className="group-hover:text-sky-300 transition-colors">{t('Director Job Market', 'Direktor Arbeitsmarkt')} <span className="text-[10px] text-zinc-400 font-normal ml-1 tabular-nums">({state.jobMarketSearchesThisSeason || 0}/1)</span></span>
                  <span className="text-sky-400 font-semibold text-[11px]">{t('Search', 'Suchen')}</span>
                </div>
                <div className="text-[10px] text-zinc-400">{t('Search for new club offers.', 'Nach neuen Jobangeboten bei anderen Vereinen suchen.')}</div>
              </button>

              {/* Resign */}
              <button
                onClick={onResign}
                className="bg-white/[0.02] hover:bg-rose-500/10 p-3 rounded-xl border border-white/[0.06] hover:border-rose-500/30 text-left transition cursor-pointer group"
              >
                <div className="text-[12px] font-bold text-red-400 group-hover:text-red-300 mb-1 flex items-center justify-between">
                  <span>{t('End Career Immediately', 'Karriere sofort beenden')}</span>
                  <i className="fas fa-door-open text-red-500/40 group-hover:text-red-400 transition text-xs"></i>
                </div>
                <div className="text-[10px] text-red-400/70 group-hover:text-red-300/90">{t('Retire from your Sporting Director role permanently.', 'Als Sportdirektor dauerhaft in den Ruhestand gehen.')}</div>
              </button>
              
              {/* Skills & Points */}
              <button
                onClick={() => { setIsManagerOpen(false); if(onOpenSkills) onOpenSkills(); }}
                className="bg-white/[0.03] hover:bg-white/[0.06] p-3 rounded-xl border border-white/[0.08] hover:border-amber-400/30 text-left transition cursor-pointer group"
              >
                <div className="text-[12px] font-bold text-white flex items-center justify-between mb-1">
                  <span className="group-hover:text-amber-300 transition-colors">{t('Director Skills', 'Direktor-Fähigkeiten')}</span>
                  <span className="text-amber-400 font-semibold text-[11px] tabular-nums">{state.skillPoints || 0} DP</span>
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {t('Manage active perks', 'Aktive Boni verwalten')}
                </div>
              </button>
            </div>
              </motion.div>
            )}
                                                  </AnimatePresence>
        </div>
        </div>
        </>
      )}
      {/* Grassroots TV Cup Jackpot ("David vs. Goliath" Draw, Tiers 3–11, Non-Reserve Clubs Only) */}
      {state.club.tier >= 3 && state.club.tier <= 11 && !isReserveClub(state.club.name) && (state.tvCupJackpotAvailable || state.tvCupJackpotClaimed) && (
        <div className="mb-2.5">
          {state.tvCupJackpotAvailable && !state.tvCupJackpotClaimed ? (
            <button
              type="button"
              onClick={() => {
                if (onClaimTvCupJackpot) onClaimTvCupJackpot();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_28px_rgba(245,158,11,0.45)] border border-yellow-200 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-2 animate-pulse"
            >
              <span className="flex items-center gap-2 truncate">
                <i className="fa-solid fa-tv text-slate-950 text-sm shrink-0" />
                <span className="truncate">
                  {t(
                    `CUP TV DRAW: vs. ${state.tvCupJackpotOpponent || 'Top-Flight Giant'}!`,
                    `POKAL-TV-LOS: gegen ${state.tvCupJackpotOpponent || 'Erstliga-Gigant'}!`
                  )}
                </span>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-300 font-mono text-[11px] font-black shrink-0">
                {t('CLAIM +€350K & +5 MORALE', '+350K € & +5 MORAL SICHERN')}
              </span>
            </button>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 truncate">
                <i className="fa-solid fa-circle-check text-emerald-400 shrink-0" />
                <span className="truncate">
                  {t(
                    `TV Cup Broadcast Jackpot Claimed (vs. ${state.tvCupJackpotOpponent || 'Top-Flight Giant'})`,
                    `TV-Pokal-Jackpot eingelöst (gg. ${state.tvCupJackpotOpponent || 'Erstliga-Gigant'})`
                  )}
                </span>
              </span>
              <span className="font-mono text-[11px] font-black text-emerald-400 shrink-0">
                +€350k · +5 Morale
              </span>
            </div>
          )}
        </div>
      )}

      {/* Single Tool Info Modal / Sheet */}
      {activeInfoKey && PREP_INFOS[activeInfoKey] && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveInfoKey(null)}
        >
          <div
            className="bg-[#12141c]/95 border border-white/[0.08] rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveInfoKey(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer border border-white/[0.06]"
            >
              <i className="fas fa-xmark"></i>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl ${PREP_INFOS[activeInfoKey].iconBg} flex items-center justify-center ${PREP_INFOS[activeInfoKey].iconColor} border border-white/10 font-bold text-lg`}>
                <i className={`fas ${PREP_INFOS[activeInfoKey].icon}`}></i>
              </div>
              <div>
                <h4 className="text-base font-bold text-white leading-snug">
                  {isDe ? PREP_INFOS[activeInfoKey].titleDe : PREP_INFOS[activeInfoKey].titleEn}
                </h4>
                <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
                  {t('Season Preparation Tool', 'Saisonvorbereitungs-Funktion')}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-normal">
              {isDe ? (activeInfoKey === 'stadium' ? 'Erhoehe die Kapazitaet fuer mehr Einnahmen oder starte gigantische Mega-Projekte (Neues Stadion/Hightech Arena), um den Weltmarkt zu dominieren. (Max. 1 pro Saison).' : PREP_INFOS[activeInfoKey].descDe) : (activeInfoKey === 'stadium' ? 'Expand seating capacity to boost matchday income or commission massive Mega-Projects (New Home/Hightech Arena) to dominate global fanbases. (Max 1 per season).' : PREP_INFOS[activeInfoKey].descEn)}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  const key = activeInfoKey;
                  setActiveInfoKey(null);
                  if (key === 'sponsor') setIsSponsorOpen(true);
                  else if (key === 'youth') onYouth();
                  else if (key === 'bidReg' || key === 'bidKey' || key === 'sellPlayer') onShowTransfers();
                  else if (key === 'stadium') setIsInfraOpen(true);
                  else if (key === 'jobMarket') { setIsManagerOpen(true); onJobMarket(); }
                  else if (key === 'philosophy' && onPhilosophy) onPhilosophy();
                  else if (key === 'skills' && onOpenSkills) onOpenSkills();
                }}
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                {t('Open Tool', 'Funktion Oeffnen')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Season Preparation Guide Modal */}
      {showAllInfoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={() => setShowAllInfoModal(false)}
        >
          <div
            className="bg-[#1c1c1e] border border-white/10 rounded-[28px] max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#2c2c2e]/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-system-blue/20 text-system-blue flex items-center justify-center font-bold text-base border border-system-blue/30">
                  <i className="fas fa-info"></i>
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {t('Season Preparations Guide', 'Saisonvorbereitungs-Guide')}
                  </h3>
                  <p className="text-[11px] text-[#8e8e93] font-medium">
                    {t('How each function helps prepare your club', 'Ueberblick ueber alle Vorbereitungs-Funktionen')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllInfoModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition cursor-pointer"
              >
                <i className="fas fa-xmark"></i>
              </button>
            </div>

            {/* Content List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 no-scrollbar">
              {Object.values(PREP_INFOS).map((info) => (
                <div
                  key={info.key}
                  className="bg-[#2c2c2e]/60 rounded-2xl p-3.5 border border-white/5 flex items-start gap-3 hover:bg-[#2c2c2e] transition"
                >
                  <div className={`w-9 h-9 rounded-xl ${info.iconBg} ${info.iconColor} flex items-center justify-center shrink-0 font-bold text-sm border border-white/10 mt-0.5`}>
                    <i className={`fas ${info.icon}`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-black text-white truncate">
                        {isDe ? info.titleDe : info.titleEn}
                      </h4>
                      {info.costBadge && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/5 shrink-0">
                          {info.costBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8e8e93] leading-relaxed font-medium">
                      {isDe ? (info.key === 'stadium' ? 'Erhoehe die Kapazitaet fuer mehr Einnahmen oder starte gigantische Mega-Projekte (Neues Stadion/Hightech Arena), um den Weltmarkt zu dominieren. (Max. 1 pro Saison).' : info.descDe) : (info.key === 'stadium' ? 'Expand seating capacity to boost matchday income or commission massive Mega-Projects (New Home/Hightech Arena) to dominate global fanbases. (Max 1 per season).' : info.descEn)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#2c2c2e]/30 flex justify-end shrink-0">
              <button
                onClick={() => setShowAllInfoModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                {t('Close', 'Schliessen')}
              </button>
            </div>
          </div>
        </div>
      )}
    
      <AnimatePresence>
        {trophyModalType && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.1, ease: 'linear' }}
            className="fixed inset-0 flex items-center justify-center p-4 z-[70] bg-black/75 backdrop-blur-2xl"
            onClick={() => setTrophyModalType(null)}
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.98, opacity: 0 }} 
              transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-[#10121a]/95 text-white w-full ${trophyModalType === 'stadium' ? 'max-w-md sm:max-w-[460px]' : 'max-w-sm'} rounded-[32px] border border-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.85)] p-5 sm:p-6 relative flex flex-col items-center text-center backdrop-blur-3xl overflow-hidden`}
              onClick={e => e.stopPropagation()}
            >
              {/* Subtle Ambient Refraction Glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-sky-500/12 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

              <button 
                type="button"
                onClick={() => {
                  setTrophyModalType(null);
                  setShowGroundsDetails(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer z-20"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
              
              {trophyModalType === 'stadium' ? (
                <>
                  <div className="mb-4 relative w-full pt-1 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-sky-400/20 via-sky-500/10 to-transparent border border-sky-400/30 flex items-center justify-center relative z-10 mx-auto shadow-[0_8px_24px_rgba(56,189,248,0.2)] mb-3 text-sky-400">
                      <i className="fa-solid fa-landmark text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-1 relative z-10">
                      {t('Stadium', 'Stadion')}
                    </h3>
                    <div className="flex items-baseline justify-center gap-2 relative z-10">
                      <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 tabular-nums tracking-tight">{formatNum(state.club.stadium)}</span>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">{t('Capacity', 'Kapazität')}</span>
                    </div>

                    {/* Unboxed subtle requirement status */}
                    {state.club.tier <= 3 && state.club.stadium < getLeagueStadiumRequirement(state.club.tier, state.club.country) ? (
                      <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-amber-300/90 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        <span>{t(`Below Tier ${state.club.tier} Standard (${formatNum(getLeagueStadiumRequirement(state.club.tier, state.club.country))} required)`, `Unter Ligen-Standard (${formatNum(getLeagueStadiumRequirement(state.club.tier, state.club.country))} Soll)`)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-zinc-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>{t(`Meets League Standard (${formatNum(getLeagueStadiumRequirement(state.club.tier, state.club.country))} required)`, `Erfüllt Ligen-Standard (${formatNum(getLeagueStadiumRequirement(state.club.tier, state.club.country))} Soll)`)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* ATTENDANCE STATS CARD - Position Unmoved */}
                  <div className="w-full bg-white/[0.025] backdrop-blur-xl rounded-2xl p-4 sm:p-5 text-left mb-3.5 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] relative">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3 border-b border-white/[0.04] pb-2">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <i className="fa-solid fa-chart-line text-sky-400 text-[10px]"></i>
                        <span>{t('Avg. Attendance (Last 5 Seasons)', 'Ø Zuschauer (Letzte 5 Saisons)')}</span>
                      </span>
                      {(() => {
                        const history = state.history || [];
                        const last5 = history.slice(-5);
                        const latest = last5[last5.length - 1];
                        if (!latest || !latest.att) return null;
                        const capForHistory = latest.stadiumCapacity || state.club.stadium || 1;
                        const util = Math.min(100, Math.max(0, latest.util ?? Math.round((latest.att / capForHistory) * 100)));
                        return (
                          <span className="text-sky-300 tabular-nums font-semibold">
                            {util}% {t('Fill', 'Auslastung')}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="relative w-full h-28 mt-4 mb-2">
                      {/* Grid Lines */}
                      <div className="absolute top-0 left-0 w-full border-t border-dashed border-white/10 z-0"></div>
                      <div className="absolute bottom-0 left-0 w-full border-b border-white/10 z-0"></div>
                      <div className="absolute -top-4 right-0 text-[8px] text-zinc-500 font-medium uppercase z-0 tracking-wider">
                        {t('MAX', 'MAX')} · {formatNum(state.club.stadium)}
                      </div>
                      
                      {(() => {
                        const history = state.history || [];
                        const last5 = history.slice(-5);
                        if (last5.length === 0) {
                          return <div className="text-center w-full text-zinc-500 text-xs italic py-8 relative z-10">{t('No history available yet.', 'Noch keine Historie verfügbar.')}</div>;
                        }
                        
                        const maxAtt = state.club.stadium;
                        const len = last5.length;
                        const step = len > 1 ? 100 / (len - 1) : 0;
                        
                        const points = last5.map((h, i) => {
                          const x = len === 1 ? 50 : i * step;
                          const y = 100 - (Math.min(maxAtt, h.att || 0) / (maxAtt || 1)) * 100;
                          return { x, y, att: h.att || 0, year: h.year };
                        });
                        
                        // Generate SVG path string
                        const areaPath = `M 0 100 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L 100 100 Z`;
                        const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                        
                        return (
                          <>
                            <svg className="absolute inset-0 w-full h-full overflow-visible z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="stadiumAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                                  <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.08" />
                                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                                </linearGradient>
                                <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
                                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.4" />
                                </filter>
                              </defs>
                              <path d={areaPath} fill="url(#stadiumAreaGradient)" />
                              <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#glowLine)" vectorEffect="non-scaling-stroke" />
                            </svg>
                            {/* Render dots and labels */}
                            <div className="absolute inset-0 z-20 w-full h-full pointer-events-none">
                              {points.map((p, i) => {
                                const isLast = i === points.length - 1;
                                return (
                                  <div key={i} className="absolute flex flex-col items-center justify-center" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}>
                                    <div className={`rounded-full bg-sky-400 border-2 border-[#10121a] shadow-[0_0_8px_rgba(56,189,248,0.5)] ${isLast ? 'w-3 h-3 ring-4 ring-sky-400/20' : 'w-2.5 h-2.5'}`}></div>
                                    {/* Label above */}
                                    <div className="absolute -top-5 text-[9px] font-bold text-white px-1.5 py-0.5 whitespace-nowrap bg-[#10121a]/95 backdrop-blur-md rounded-md border border-white/10 tabular-nums shadow-sm">
                                      {formatNum(p.att)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {/* X Axis years */}
                            <div className="absolute -bottom-5 left-0 w-full z-20 pointer-events-none">
                              {points.map((p, i) => (
                                <div key={i} className={`absolute text-[9px] font-semibold tabular-nums ${i === points.length - 1 ? 'text-sky-300 font-bold' : 'text-zinc-500'}`} style={{ left: `${p.x}%`, transform: 'translateX(-50%)' }}>
                                  '{p.year.toString().slice(-2)}
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* PROGRESSIVE DISCLOSURE: Grounds Economics & Atmosphere */}
                  <div className="w-full mb-5">
                    <button
                      type="button"
                      onClick={() => setShowGroundsDetails(!showGroundsDetails)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-xs transition cursor-pointer text-zinc-400 hover:text-white group"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <i className="fa-solid fa-coins text-[10px] text-sky-400 group-hover:scale-110 transition-transform"></i>
                        <span>{t('Matchday Economics & Atmosphere', 'Spieltags-Finanzen & Festungs-Bonus')}</span>
                      </span>
                      <i className={`fa-solid fa-chevron-${showGroundsDetails ? 'up' : 'down'} text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-transform`}></i>
                    </button>

                    {showGroundsDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-left space-y-2.5 overflow-hidden text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">{t('Est. Annual Gate Revenue', 'Geschätzte Ticketerlöse')}</span>
                          <span className="font-bold text-emerald-400 tabular-nums">
                            +{formatMoney(Math.floor((((state.history && state.history.length > 0 ? state.history[state.history.length - 1].att : state.club.stadium * 0.85) || 1000) * (league.ticket || 30) * 17) / 1000))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">{t('Average Ticket Yield', 'Ø Ticketpreis')}</span>
                          <span className="font-semibold text-white tabular-nums">~{formatMoney(league.ticket || 30)} / {t('seat', 'Platz')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">{t('Home Fortress Bonus', 'Heimstärke-Atmosphäre')}</span>
                          <span className={`font-semibold tabular-nums ${(state.history && state.history.length > 0 && state.history[state.history.length - 1].util >= 90) ? 'text-sky-300' : 'text-zinc-300'}`}>
                            {(state.history && state.history.length > 0 && state.history[state.history.length - 1].util >= 90)
                              ? t('Max Home Advantage (+)', 'Maximale Heimstärke (+)')
                              : (state.history && state.history.length > 0 && state.history[state.history.length - 1].util >= 75)
                              ? t('Solid Atmosphere', 'Solide Kulisse')
                              : t('Room to Grow', 'Ausbaufähig')}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2.5 pt-2">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto shadow-sm">
                      <i className={`fa-solid ${trophyModalType === 'dom' ? 'fa-trophy text-amber-400' : 'fa-globe text-sky-400'} text-2xl`}></i>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-4">
                    {trophyModalType === 'dom' ? t('Dom. Trophies', 'Nat. Titel') : t('Intl. Trophies', 'Int. Titel')}
                  </h3>
                  
                  <div className="w-full bg-white/[0.03] rounded-2xl p-4 text-left mb-5 border border-white/[0.08]">
                    <p className="text-zinc-200 font-medium mb-4 leading-relaxed text-xs">
                      {trophyModalType === 'dom' 
                        ? t('This counts all tier 1 domestic titles won by this club.', 'Zählt alle nationalen Erstliga-Titel, die dieser Club gewonnen hat.')
                        : t('This counts all international titles won by this club.', 'Zählt alle internationalen Titel, die dieser Club gewonnen hat.')}
                    </p>
                    
                    <div className="space-y-2.5 text-xs">
                      {trophyModalType === 'dom' ? (
                        <>
                          <div className="flex items-center gap-2.5">
                            <i className="fa-solid fa-circle-check text-emerald-400 text-xs shrink-0"></i>
                            <span className="text-zinc-300">{t('Tier 1 League Title', '1. Liga Meisterschaft')}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <i className="fa-solid fa-circle-check text-emerald-400 text-xs shrink-0"></i>
                            <span className="text-zinc-300">{t('Domestic Cup (Top Tier)', 'Nationaler Pokal (Top-Ebene)')}</span>
                          </div>
                          <div className="flex items-center gap-2.5 opacity-50">
                            <i className="fa-solid fa-circle-xmark text-zinc-500 text-xs shrink-0"></i>
                            <span className="text-zinc-400">{t('Regional & Lower Tier (Not Counted)', 'Regional & Unterklassig (Zählt nicht)')}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <i className="fa-solid fa-circle-check text-sky-400 text-xs shrink-0"></i>
                            <span className="text-zinc-300">{t('Champions League & Equivalent', 'Champions League & Äquivalente')}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <i className="fa-solid fa-circle-check text-sky-400 text-xs shrink-0"></i>
                            <span className="text-zinc-300">{t('Continental & Secondary Cups', 'Kontinentale Pokale')}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <i className="fa-solid fa-circle-check text-sky-400 text-xs shrink-0"></i>
                            <span className="text-zinc-300">{t('Club World Cup', 'Klub-Weltmeisterschaft')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
                                    
              {trophyModalType === 'stadium' ? (
                <div className="flex gap-2.5 w-full">
                  <button 
                    type="button"
                    onClick={() => {
                      setTrophyModalType(null);
                      setShowGroundsDetails(false);
                      setIsInfraOpen(true);
                    }}
                    className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs py-3 px-4 rounded-2xl shadow-[0_4px_20px_rgba(56,189,248,0.25)] hover:shadow-[0_6px_28px_rgba(56,189,248,0.35)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <i className="fa-solid fa-arrow-up-right-dots text-[11px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                    <span>{t('Expand Stadium', 'Stadion ausbauen')}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setTrophyModalType(null);
                      setShowGroundsDetails(false);
                    }}
                    className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white font-semibold text-xs py-3 px-4 rounded-2xl border border-white/[0.08] transition active:scale-[0.98] cursor-pointer"
                  >
                    {t('Close', 'Schließen')}
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => setTrophyModalType(null)}
                  className="w-full bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs py-3 rounded-2xl border border-white/[0.08] transition active:scale-95 cursor-pointer"
                >
                  {t('Close', 'Schließen')}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showLoanModal && onTakeLoan && (
          <BankLoanModal
            isOpen={showLoanModal}
            onClose={() => setShowLoanModal(false)}
            maxLoanAmount={maxLoanAmount}
            onConfirmLoan={(principal, years) => {
              onTakeLoan(principal, years);
              setShowLoanModal(false);
            }}
            currentBudget={state.budget}
            clubName={state.club.name}
            lang={lang}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

