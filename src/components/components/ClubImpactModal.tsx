import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Language } from '../types';
import { t as tr } from '../data/translations';
import { calculateClubReputation, calculateClubFinancials, getMonogramHex, getLeagueScaledVal, getCreditLimit, formatMoney } from '../data/gameConstants';
import { useGameStore } from '../store/useGameStore';
import { getOrGenerateRoadmap } from '../utils/roadmapManager';
import { useModalDismiss } from '../utils/modalUtils';

interface ClubImpactModalProps {
  state: GameState;
  lang: Language;
  onClose: () => void;
  onOpenTeamBonding?: () => void;
  onOpenClubProfile?: () => void;
  onBack?: () => void;
}

type MetricType = 'overall' | 'coach_rep' | 'club_rep' | 'morale' | 'target' | 'shields' | 'financials' | 'fans' | 'dynasty';

export const ClubImpactModal: React.FC<ClubImpactModalProps> = ({ 
  state, 
  lang, 
  onClose, 
  onOpenTeamBonding, 
  onBack,
}) => {
  useModalDismiss(onClose);
  const isDe = false;
  const t = (en: string, _de?: string) => en;
  
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);

  const impactScore = Math.round(state.clubImpactScore ?? 50);
  const coachRep = Math.min(100, Math.max(0, Math.round(state.reputation || 50)));
  const clubRep = Math.min(100, Math.max(1, calculateClubReputation(state.club.baseOvr, state.club.tier)));
  const morale = state.club.morale ?? 100;
  const shields = state.immunityShields ?? 0;
  
  const consecutiveTitles = state.consecutiveTitles || 0;
  const rawDynastyTax = consecutiveTitles > 0 ? Math.min(4.0, consecutiveTitles >= 4 ? Math.max(2.5, consecutiveTitles * 0.75) : consecutiveTitles * 0.5) : 0;
  const hasInfrastructureImmunity = ((state.club.medicalLevel || 1) >= 5 || (state.club.academyLevel || 1) >= 5);
  const hasHighMoraleDiscount = (state.club.morale ?? 100) > 90;
  const effectiveDynastyTax = hasInfrastructureImmunity ? 0 : (hasHighMoraleDiscount ? rawDynastyTax * 0.5 : rawDynastyTax);
  const tenureYears = state.tenureYears || 1;
  
  const targetPos = state.boardTargetFinish || state.boardTargetPos || 15;
  const targetText = isDe ? `Platz ${targetPos} oder besser` : `Place ${targetPos} or better`;
  const roadmap = getOrGenerateRoadmap(state.boardRoadmap, state.club, state.year || 2024, state.history);
  const completedGoalsCount = roadmap.goals.filter(g => g.completed).length;

  const finScore = state.budget < 0 ? 10 : state.budget < Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country)) ? 50 : 90;
  const finText = state.budget < 0 
    ? (isDe ? "-10 Pkt (Defizit)" : "-10pts (Deficit)")
    : state.budget < Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country)) 
    ? (isDe ? "+5 Pkt (Stabil)" : "+5pts (Stable)")
    : (isDe ? "+10 Pkt (Überschuss)" : "+10pts (Surplus)");
  const finColor = state.budget < 0 ? "bg-red-500" : state.budget < Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country)) ? "bg-amber-500" : "bg-emerald-500";
  const finTextColor = state.budget < 0 ? "text-red-400" : state.budget < Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country)) ? "text-amber-400" : "text-emerald-400";
  
  const moraleScore = morale;
  const moraleText = morale < 40 
    ? (isDe ? "-10 Pkt (Kritisch)" : "-10pts (Toxic)")
    : morale <= 75 
    ? (isDe ? "+5 Pkt (Stabil)" : "+5pts (Stable)")
    : (isDe ? "+10 Pkt (Hervorragend)" : "+10pts (Excellent)");
  const moraleColor = morale < 40 ? "bg-red-500" : morale <= 75 ? "bg-amber-500" : "bg-emerald-500";
  const moraleTextColor = morale < 40 ? "text-red-400" : morale <= 75 ? "text-amber-400" : "text-emerald-400";
  
  const stadiumCap = state.club.stadium || 2000;
  const financials = calculateClubFinancials(state);
  const expectedAtt = financials.expectedAtt || Math.min(stadiumCap, state.club.fanBase || 500);
  const currentFans = expectedAtt;
  const fanApproval = stadiumCap > 0 ? Math.min(100, Math.round((expectedAtt / stadiumCap) * 100)) : 50;
  const fanText = fanApproval < 40 
    ? (isDe ? "-5 Pkt (Gering/Protest)" : "-5pts (Low/Doubt)")
    : fanApproval <= 75 
    ? (isDe ? "+5 Pkt (Zufrieden)" : "+5pts (Content)")
    : (isDe ? "+15 Pkt (Euphorie/Hoch)" : "+15pts (Electric/High)");
  const fanColor = fanApproval < 40 ? "bg-red-500" : "bg-emerald-400";
  const fanTextColor = fanApproval < 40 ? "text-red-400" : "text-emerald-400";

  // 3 Core Pillars: Financial Health, Squad Harmony, Fan Approval
  let finPercent = 85;
  if (state.budget < 0) {
    finPercent = Math.max(12, Math.round(40 - Math.min(28, (Math.abs(state.budget) / 1000000) * 10)));
  } else {
    finPercent = 70;
    if (state.budget > 1000000) finPercent += 15;
    if ((state.seasonsInDebt || 0) === 0) finPercent += 10;
    finPercent = Math.min(100, finPercent);
  }
  const harmonyPercent = Math.min(100, Math.max(10, Math.round(morale)));
  const approvalPercent = fanApproval;

  const handleBondTeamInPlace = () => {
    if ((state.teamBondingThisSeason || 0) >= 1) {
      useGameStore.getState().updateState({
        notifications: [
          {
            id: Math.random().toString(),
            type: 'error',
            message: isDe ? 'Saisonlimit erreicht (Max. 1x Teambuilding pro Saison)!' : 'Team bonding limit reached (Maximum 1 session per season)!',
            read: false
          },
          ...(useGameStore.getState().notifications || [])
        ]
      });
      return;
    }
    const cost = Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country));
    const creditLimit = getCreditLimit(state.club.tier || 1, state.club.country || 'GER');
    if (state.budget + creditLimit < cost) {
      useGameStore.getState().updateState({
        notifications: [
          {
            id: Math.random().toString(),
            type: 'error',
            message: isDe ? `Nicht genügend Budget für Teambuilding (${formatMoney(cost)} benötigt)!` : `Insufficient budget and credit facility exhausted for team bonding (${formatMoney(cost)} required)!`,
            read: false
          },
          ...(useGameStore.getState().notifications || [])
        ]
      });
      return;
    }
    useGameStore.getState().teamBonding(cost);
    useGameStore.getState().updateState({
      notifications: [
        {
          id: Math.random().toString(),
          type: 'success',
          message: isDe ? 'Erfolgreiches Teambuilding! Moral um +30% gestiegen.' : 'Successful Team Bonding! Squad morale increased by +30%.',
          read: false
        },
        ...(useGameStore.getState().notifications || [])
      ]
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (selectedMetric) {
        setSelectedMetric(null);
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-[10050] backdrop-blur-2xl" onClick={handleBackdropClick}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#14151e] w-full max-w-4xl rounded-[28px] flex flex-col max-h-[92vh] shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-white/[0.04] relative overflow-hidden cursor-default"
      >
        {/* Top Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400/25 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/[0.04] shrink-0 bg-[#14151e]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] flex items-center justify-center transition text-zinc-300 hover:text-white cursor-pointer border border-white/[0.06] active:scale-95 shrink-0"
                title="Back to Manager Profile"
              >
                <i className="fas fa-arrow-left text-xs" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-tight">
                  {isDe ? 'Club Impact & Vorstand' : 'Club Impact & Board Expectations'}
                </h2>
                <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {isDe ? 'Management' : 'Governance'}
                </span>
              </div>
              <p className="text-zinc-400 font-normal text-xs mt-0.5">
                {isDe 
                  ? 'Vorstandszufriedenheit, Trainer-Renommee und Vereinsstatistiken im Detail.'
                  : 'Board satisfaction, manager prestige, and club performance metrics.'}
              </p>
            </div>
          </div>
          <button 
            aria-label="Close modal" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] flex items-center justify-center transition text-zinc-400 hover:text-white cursor-pointer border border-white/[0.06] active:scale-95"
          >
            <i className="fas fa-xmark text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 relative">

          {/* Main Top Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
            
            {/* Overall Impact Score (Hero Card) */}
            <div 
              onClick={() => setSelectedMetric('overall')}
              className="md:col-span-5 bg-[#10121a] p-6 rounded-2xl border border-white/[0.04] relative overflow-hidden flex flex-col justify-between text-center cursor-pointer hover:border-sky-500/30 transition-all group"
            >
              <div className={`absolute -top-10 -right-10 w-36 h-36 blur-3xl opacity-15 pointer-events-none rounded-full ${impactScore >= 80 ? 'bg-emerald-500' : impactScore <= 30 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              
              <div className="flex justify-between items-center w-full mb-2">
                <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {isDe ? 'Gesamt-Impact' : 'Overall Impact Score'}
                </div>
                <span className="text-[10px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 group-hover:bg-sky-500/20 transition-colors">
                  <i className="fas fa-info-circle text-[9px]"></i> {isDe ? 'Erklärung' : 'Details'}
                </span>
              </div>

              <div className="py-2">
                <div className={`text-6xl sm:text-7xl font-semibold tracking-tighter tabular-nums ${impactScore >= 80 ? 'text-emerald-400' : impactScore <= 30 ? 'text-red-400' : 'text-blue-400'}`}>
                  {impactScore}<span className="text-xl text-zinc-500 font-medium">/100</span>
                </div>
                <div className="text-xs text-zinc-300 mt-2 font-normal">
                  {impactScore >= 80 
                    ? (isDe ? 'Der Vorstand ist absolut begeistert von Ihrer Arbeit.' : 'The board is delighted with your management.') 
                    : impactScore <= 30 
                    ? (isDe ? 'Ihr Trainerposten ist in akuter Gefahr!' : 'Your job is in severe danger.') 
                    : (isDe ? 'Der Vorstand ist mit Ihrer Leistung zufrieden.' : 'The board is satisfied with your performance.')}
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-center gap-1">
                <span>{isDe ? 'Klicken für Details' : 'Click to inspect formula'}</span>
                <i className="fas fa-chevron-right text-[8px] text-zinc-400"></i>
              </div>
            </div>

            {/* 6-Card Stats Grid */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
              
              {/* 1. Head Coach Rep */}
              <button 
                onClick={() => setSelectedMetric('coach_rep')}
                className="bg-[#10121a] hover:bg-white/[0.03] border border-white/[0.04] hover:border-sky-500/30 p-3.5 rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><i className="fas fa-user-tie text-sky-400"></i> {isDe ? 'Trainer Rep' : 'Coach Rep'}</span>
                  <i className="fas fa-info-circle text-[9px] text-zinc-500 group-hover:text-sky-400 transition-colors"></i>
                </div>
                <div>
                  <div className="text-2xl font-semibold tracking-tighter text-sky-400 tabular-nums">
                    {coachRep}<span className="text-xs text-zinc-500 font-medium ml-0.5">/100</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-normal group-hover:text-sky-300 transition-colors">
                    {coachRep >= 80 ? (isDe ? 'Weltklasse' : 'World Class') : coachRep >= 60 ? (isDe ? 'Renommiert' : 'Renowned') : (isDe ? 'Regional' : 'Emerging')}
                  </div>
                </div>
              </button>

              {/* 2. Club Reputation */}
              <button 
                onClick={() => setSelectedMetric('club_rep')}
                className="bg-[#10121a] hover:bg-white/[0.03] border border-white/[0.04] hover:border-blue-500/30 p-3.5 rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><i className="fas fa-globe text-blue-400"></i> {isDe ? 'Verein Rep' : 'Club Rep'}</span>
                  <i className="fas fa-info-circle text-[9px] text-zinc-500 group-hover:text-blue-400 transition-colors"></i>
                </div>
                <div>
                  <div className="text-2xl font-semibold tracking-tighter text-blue-400 tabular-nums">
                    {clubRep}<span className="text-xs text-zinc-500 font-medium ml-0.5">/100</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-normal group-hover:text-blue-300 transition-colors">
                    {clubRep >= 80 ? (isDe ? 'Elite-Club' : 'Elite Club') : clubRep >= 60 ? (isDe ? 'National' : 'National Force') : (isDe ? 'Tradition' : 'Established')}
                  </div>
                </div>
              </button>

              {/* 3. Squad Morale */}
              <button 
                onClick={() => setSelectedMetric('morale')}
                className="bg-[#10121a] hover:bg-white/[0.03] border border-white/[0.04] hover:border-purple-500/30 p-3.5 rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><i className="fas fa-users text-purple-400"></i> {isDe ? 'Moral' : 'Morale'}</span>
                  <i className="fas fa-info-circle text-[9px] text-zinc-500 group-hover:text-purple-400 transition-colors"></i>
                </div>
                <div>
                  <div className={`text-2xl font-semibold tracking-tighter tabular-nums ${morale >= 90 ? 'text-emerald-400' : morale <= 50 ? 'text-red-400' : 'text-amber-400'}`}>
                    {morale}%
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-normal group-hover:text-purple-300 transition-colors">
                    {morale >= 85 ? (isDe ? 'Harmonisch' : 'Excellent') : morale <= 45 ? (isDe ? 'Giftig' : 'Critical') : (isDe ? 'Stabil' : 'Stable')}
                  </div>
                </div>
              </button>

              {/* 4. Strategic Board Roadmap */}
              <button 
                onClick={() => setSelectedMetric('target')}
                className="bg-[#10121a] hover:bg-white/[0.03] border border-white/[0.04] hover:border-amber-500/30 p-3.5 rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><i className="fas fa-map-location-dot text-amber-400"></i> {isDe ? 'Vorstands-Roadmap' : 'Board Roadmap'}</span>
                  <i className="fas fa-info-circle text-[9px] text-zinc-500 group-hover:text-amber-400 transition-colors"></i>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-semibold text-white tracking-tight truncate tabular-nums">
                    {roadmap.horizonYears} {isDe ? 'Jahre' : 'Years'}
                  </div>
                  <div className="text-[10px] text-amber-300/90 mt-0.5 font-normal tabular-nums group-hover:text-amber-200 transition-colors">
                    {completedGoalsCount}/{roadmap.goals.length} {isDe ? 'Ziele erfüllt' : 'Goals Met'}
                  </div>
                </div>
              </button>

              {/* 5. Job Security / Immunity Shields */}
              <button 
                onClick={() => setSelectedMetric('shields')}
                className="bg-[#10121a] hover:bg-white/[0.03] border border-white/[0.04] hover:border-emerald-500/30 p-3.5 rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><i className="fas fa-shield text-emerald-400"></i> {isDe ? 'Immunität' : 'Job Security'}</span>
                  <i className="fas fa-info-circle text-[9px] text-zinc-500 group-hover:text-emerald-400 transition-colors"></i>
                </div>
                <div>
                  <div className="text-2xl font-semibold tracking-tighter text-emerald-400 tabular-nums">
                    {shields}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-normal group-hover:text-emerald-300 transition-colors">
                    {shields === 1 ? (isDe ? '1 Schild aktiv' : '1 Shield Active') : (isDe ? `${shields} Schilde aktiv` : `${shields} Shields Active`)}
                  </div>
                </div>
              </button>

              {/* 6. Fanbase & Arena */}
              <button 
                onClick={() => setSelectedMetric('fans')}
                className="bg-[#10121a] hover:bg-white/[0.03] border border-white/[0.04] hover:border-emerald-500/30 p-3.5 rounded-xl text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><i className="fas fa-heart text-emerald-400"></i> {isDe ? 'Fans & Arena' : 'Fan Support'}</span>
                  <i className="fas fa-info-circle text-[9px] text-zinc-500 group-hover:text-emerald-400 transition-colors"></i>
                </div>
                <div>
                  <div className="text-2xl font-semibold tracking-tighter text-emerald-400 tabular-nums">
                    {fanApproval}%
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-normal tabular-nums group-hover:text-emerald-300 transition-colors">
                    {currentFans.toLocaleString()} {isDe ? 'Fans' : 'Fans'}
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* Impact Score Breakdown - 3 Circles for Financial Health, Squad Harmony, and Fan Approval */}
          <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-5 pb-3 border-b border-white/[0.04]">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-chart-pie text-sky-400"></i> {isDe ? 'Vorstands-Gewichtung: 3 Säulen' : 'Impact Score Breakdown: 3 Pillars'}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isDe ? 'Finanzen, Teamharmonie und Fanzufriedenheit bestimmen den Vorstandsrückhalt.' : 'Financial Health, Squad Harmony, and Fan Approval drive board backing.'}
                </p>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                {isDe ? 'Klicken für detaillierte Formel' : 'Click any circle to learn more'}
              </span>
            </div>
            
            {/* The 3 Circles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-5">
              {/* Circle 1: Financial Health */}
              <button
                onClick={() => setSelectedMetric('financials')}
                className="bg-black/25 hover:bg-white/[0.03] border border-white/[0.04] hover:border-emerald-500/30 rounded-xl p-4 flex flex-col items-center text-center transition group cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <i className="fas fa-wallet text-emerald-400 text-[11px]"></i>
                    {isDe ? 'Finanzen' : 'Financial Health'}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${finTextColor} bg-white/[0.04] border border-white/[0.04] tabular-nums`}>
                    {finText}
                  </span>
                </div>

                {/* Circular Gauge */}
                <div className="relative w-20 h-20 flex items-center justify-center my-1">
                  <svg height="100%" width="100%" viewBox="0 0 40 40" className="transform -rotate-90">
                    <circle stroke="rgba(255, 255, 255, 0.08)" fill="transparent" strokeWidth="3.2" r="16" cx="20" cy="20" />
                    <circle
                      stroke={finPercent >= 75 ? '#10b981' : finPercent >= 45 ? '#fbbf24' : '#f43f5e'}
                      fill="transparent"
                      strokeWidth="3.2"
                      strokeDasharray={`${100.5} ${100.5}`}
                      style={{ strokeDashoffset: 100.5 - (finPercent / 100) * 100.5 }}
                      strokeLinecap="round"
                      r="16" cx="20" cy="20"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-semibold text-white tabular-nums">{finPercent}%</span>
                    <span className="text-[9px] text-zinc-400 uppercase font-medium">
                      {state.budget < 0 ? (isDe ? 'Defizit' : 'Deficit') : state.budget < Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country)) ? (isDe ? 'Stabil' : 'Stable') : (isDe ? 'Überschuss' : 'Surplus')}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 mt-2 font-normal tabular-nums">
                  {state.budget >= 0 ? `+${formatMoney(state.budget)}` : `-${formatMoney(Math.abs(state.budget))}`} {isDe ? 'Budget' : 'Treasury'}
                </div>
                <span className="text-[10px] text-emerald-400/80 group-hover:text-emerald-300 font-medium mt-1 transition-colors flex items-center gap-1">
                  {isDe ? 'Formel prüfen' : 'View formula'} <i className="fas fa-arrow-right text-[8px]" />
                </span>
              </button>

              {/* Circle 2: Squad Harmony */}
              <button
                onClick={() => setSelectedMetric('morale')}
                className="bg-black/25 hover:bg-white/[0.03] border border-white/[0.04] hover:border-purple-500/30 rounded-xl p-4 flex flex-col items-center text-center transition group cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <i className="fas fa-heart-pulse text-purple-400 text-[11px]"></i>
                    {isDe ? 'Harmonie' : 'Squad Harmony'}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${moraleTextColor} bg-white/[0.04] border border-white/[0.04] tabular-nums`}>
                    {moraleText}
                  </span>
                </div>

                {/* Circular Gauge */}
                <div className="relative w-20 h-20 flex items-center justify-center my-1">
                  <svg height="100%" width="100%" viewBox="0 0 40 40" className="transform -rotate-90">
                    <circle stroke="rgba(255, 255, 255, 0.08)" fill="transparent" strokeWidth="3.2" r="16" cx="20" cy="20" />
                    <circle
                      stroke={harmonyPercent >= 75 ? '#10b981' : harmonyPercent >= 45 ? '#fbbf24' : '#f43f5e'}
                      fill="transparent"
                      strokeWidth="3.2"
                      strokeDasharray={`${100.5} ${100.5}`}
                      style={{ strokeDashoffset: 100.5 - (harmonyPercent / 100) * 100.5 }}
                      strokeLinecap="round"
                      r="16" cx="20" cy="20"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-semibold text-white tabular-nums">{harmonyPercent}%</span>
                    <span className="text-[9px] text-zinc-400 uppercase font-medium">
                      {morale >= 85 ? (isDe ? 'Optimal' : 'Optimal') : morale <= 45 ? (isDe ? 'Kritisch' : 'Critical') : (isDe ? 'Solide' : 'Stable')}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 mt-2 font-normal tabular-nums">
                  {state.club.morale ?? 100}% {isDe ? 'Kabinen-Moral' : 'Locker Morale'}
                </div>
                <span className="text-[10px] text-purple-400/80 group-hover:text-purple-300 font-medium mt-1 transition-colors flex items-center gap-1">
                  {isDe ? 'Formel prüfen' : 'View formula'} <i className="fas fa-arrow-right text-[8px]" />
                </span>
              </button>

              {/* Circle 3: Fan Approval */}
              <button
                onClick={() => setSelectedMetric('fans')}
                className="bg-black/25 hover:bg-white/[0.03] border border-white/[0.04] hover:border-emerald-500/30 rounded-xl p-4 flex flex-col items-center text-center transition group cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <i className="fas fa-users-viewfinder text-emerald-400 text-[11px]"></i>
                    {isDe ? 'Fan-Zustimmung' : 'Fan Approval'}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${fanTextColor} bg-white/[0.04] border border-white/[0.04] tabular-nums`}>
                    {fanText}
                  </span>
                </div>

                {/* Circular Gauge */}
                <div className="relative w-20 h-20 flex items-center justify-center my-1">
                  <svg height="100%" width="100%" viewBox="0 0 40 40" className="transform -rotate-90">
                    <circle stroke="rgba(255, 255, 255, 0.08)" fill="transparent" strokeWidth="3.2" r="16" cx="20" cy="20" />
                    <circle
                      stroke={approvalPercent >= 75 ? '#10b981' : approvalPercent >= 45 ? '#34d399' : '#f43f5e'}
                      fill="transparent"
                      strokeWidth="3.2"
                      strokeDasharray={`${100.5} ${100.5}`}
                      style={{ strokeDashoffset: 100.5 - (approvalPercent / 100) * 100.5 }}
                      strokeLinecap="round"
                      r="16" cx="20" cy="20"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-semibold text-white tabular-nums">{approvalPercent}%</span>
                    <span className="text-[9px] text-zinc-400 uppercase font-medium">
                      {fanApproval >= 75 ? (isDe ? 'Euphorie' : 'Electric') : fanApproval < 40 ? (isDe ? 'Druck' : 'Restless') : (isDe ? 'Zufrieden' : 'Content')}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 mt-2 font-normal tabular-nums">
                  {currentFans.toLocaleString()} / {stadiumCap.toLocaleString()} {isDe ? 'Plätze' : 'seats'}
                </div>
                <span className="text-[10px] text-emerald-400/80 group-hover:text-emerald-300 font-medium mt-1 transition-colors flex items-center gap-1">
                  {isDe ? 'Formel prüfen' : 'View formula'} <i className="fas fa-arrow-right text-[8px]" />
                </span>
              </button>
            </div>
          </div>

          {state.rivalClubName && (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-fire text-rose-500 text-xs"></i>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{isDe ? 'Ärgste Rivalität' : 'Fiercest Rivalry'}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Box 1: Explanation */}
                    <div className="bg-[#10121a] rounded-xl border border-white/[0.04] p-4 flex flex-col justify-center relative overflow-hidden group hover:border-white/[0.08] transition-colors">
                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mb-2 relative z-10">{isDe ? 'Hintergrund' : 'Context'}</span>
                        <p className="text-[11px] text-zinc-300 leading-relaxed relative z-10 font-normal">
                            {isDe 
                                ? 'Spiele gegen deinen ärgsten Rivalen haben doppelten Einfluss auf die Moral. Ein Sieg festigt deinen Legendenstatus, eine Niederlage stürzt den Verein in die Krise.' 
                                : 'Matches against your fiercest rival carry double the morale impact. Winning builds your legacy, while losing plunges the club into crisis.'}
                        </p>
                    </div>

                    {/* Box 2: Rival Name */}
                    <div className="bg-rose-500/[0.03] rounded-xl border border-rose-500/20 p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                        <span className="text-[10px] text-rose-400/80 font-medium uppercase tracking-widest mb-1 relative z-10">{isDe ? 'Der Gegner' : 'The Opponent'}</span>
                        <h4 className="text-lg font-semibold text-white uppercase tracking-tight relative z-10">{state.rivalClubName}</h4>
                    </div>

                    {/* Box 3: Record */}
                    <div className="bg-[#10121a] rounded-xl border border-white/[0.04] p-4 flex flex-col justify-center relative overflow-hidden group hover:border-white/[0.08] transition-colors">
                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mb-3 text-center relative z-10">{isDe ? 'Kopf-an-Kopf Bilanz' : 'Head-to-Head Record'}</span>
                        <div className="flex justify-between items-center w-full relative z-10">
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mb-1">{isDe ? 'S' : 'W'}</span>
                                <span className="text-xl font-semibold text-emerald-400 tabular-nums">{state.rivalH2HWins || 0}</span>
                            </div>
                            <div className="w-px h-6 bg-white/[0.06]"></div>
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mb-1">{isDe ? 'U' : 'D'}</span>
                                <span className="text-xl font-semibold text-zinc-400 tabular-nums">{state.rivalH2HDraws || 0}</span>
                            </div>
                            <div className="w-px h-6 bg-white/[0.06]"></div>
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mb-1">{isDe ? 'N' : 'L'}</span>
                                <span className="text-xl font-semibold text-rose-400 tabular-nums">{state.rivalH2HLosses || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Visual 3-Level Pressure Gauge & Boardroom Scrutiny */}
          <div className="bg-[#10121a] rounded-2xl border border-white/[0.04] p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.04]">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-crosshairs text-rose-400"></i>
                  {isDe ? 'Dynastie-Druck & Vorstandskontrolle' : 'Dynasty Pressure & Boardroom Scrutiny'}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isDe ? 'Titelgewinne erhöhen den Erwartungsdruck und den Zielscheiben-Effekt bei Gegnern.' : 'Winning consecutive titles escalates boardroom expectations and paints a target on your back.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedMetric('dynasty')}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors cursor-pointer bg-sky-500/[0.05] px-2.5 py-1 rounded-lg border border-sky-500/20"
                >
                  <i className="fas fa-info-circle text-[9px]"></i>
                  <span>{isDe ? 'Steuer-Formel' : 'Tax Details'}</span>
                </button>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border shrink-0 ${
                  consecutiveTitles > 1 
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' 
                    : consecutiveTitles === 1 
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                    : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                }`}>
                  {consecutiveTitles > 1 
                    ? (isDe ? `Dynastie (${consecutiveTitles} Titel in Folge)` : `Dynasty (${consecutiveTitles} Titles in a Row)`) 
                    : consecutiveTitles === 1 
                    ? (isDe ? 'Titelverteidiger (1 Titel)' : 'Reigning Champion (1 Title)') 
                    : (isDe ? 'Herausforderer (Keine Steuer)' : 'Challenger (No Tax)')}
                </span>
              </div>
            </div>

            {/* Visual 3-Level Pressure Gauge Track */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              {/* Level 1: Challenger */}
              <div className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                consecutiveTitles === 0 
                  ? 'bg-sky-500/[0.08] border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]' 
                  : 'bg-black/25 border-white/[0.04] opacity-60'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${consecutiveTitles === 0 ? 'bg-sky-400' : 'bg-zinc-600'}`} />
                  <span className={`text-[10px] font-mono font-medium tracking-wider ${consecutiveTitles === 0 ? 'text-sky-300' : 'text-zinc-500'}`}>CHALLENGER</span>
                </div>
                <span className={`text-xs font-semibold ${consecutiveTitles === 0 ? 'text-white' : 'text-zinc-400'}`}>
                  {isDe ? 'Keine Steuer' : 'No Tax'}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 font-mono tabular-nums">0.0 OVR</span>
              </div>

              {/* Level 2: Champion */}
              <div className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                consecutiveTitles === 1 
                  ? 'bg-amber-500/[0.08] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'bg-black/25 border-white/[0.04] opacity-60'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${consecutiveTitles === 1 ? 'bg-amber-400' : 'bg-zinc-600'}`} />
                  <span className={`text-[10px] font-mono font-medium tracking-wider ${consecutiveTitles === 1 ? 'text-amber-300' : 'text-zinc-500'}`}>CHAMPION</span>
                </div>
                <span className={`text-xs font-semibold ${consecutiveTitles === 1 ? 'text-white' : 'text-zinc-400'}`}>
                  {isDe ? '1 Titel' : '1 Title'}
                </span>
                <span className="text-[10px] text-amber-400/80 mt-0.5 font-mono tabular-nums">-0.5 OVR</span>
              </div>

              {/* Level 3: Dynasty */}
              <div className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                consecutiveTitles > 1 
                  ? 'bg-rose-500/[0.08] border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                  : 'bg-black/25 border-white/[0.04] opacity-60'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${consecutiveTitles > 1 ? 'bg-rose-400' : 'bg-zinc-600'}`} />
                  <span className={`text-[10px] font-mono font-medium tracking-wider ${consecutiveTitles > 1 ? 'text-rose-300' : 'text-zinc-500'}`}>DYNASTY</span>
                </div>
                <span className={`text-xs font-semibold ${consecutiveTitles > 1 ? 'text-white' : 'text-zinc-400'}`}>
                  {consecutiveTitles > 1 ? `${consecutiveTitles} ${isDe ? 'Titel' : 'Titles'}` : (isDe ? '2+ Titel' : '2+ Titles')}
                </span>
                <span className="text-[10px] text-rose-400/90 mt-0.5 font-mono tabular-nums">
                  -{consecutiveTitles > 1 ? effectiveDynastyTax.toFixed(1) : '1.0+'} OVR
                </span>
              </div>
            </div>

            {/* Boardroom Scrutiny & Operational Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/[0.04] text-xs">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                  <i className="fas fa-bullseye text-rose-400 text-xs"></i>
                  {isDe ? 'Zielscheiben-Steuer:' : 'Dynasty Target on Back:'}
                </span>
                <span className={`font-mono font-bold ${consecutiveTitles > 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                  {consecutiveTitles > 0 ? `-${effectiveDynastyTax.toFixed(1)} OVR Drag` : (isDe ? 'Keine (Herausforderer)' : 'None (Challenger)')}
                </span>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.04] flex items-center justify-between">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                  <i className="fas fa-building-shield text-emerald-400 text-xs"></i>
                  {isDe ? 'Infrastruktur-Schild:' : 'Facility Dynasty Shield:'}
                </span>
                <span className={`font-semibold ${hasInfrastructureImmunity ? 'text-emerald-400' : hasHighMoraleDiscount ? 'text-sky-400' : 'text-zinc-500'}`}>
                  {hasInfrastructureImmunity 
                    ? (isDe ? 'Aktiv (Stufe 5 100% Immunität)' : 'Active (Lvl 5 100% Immunity)') 
                    : hasHighMoraleDiscount 
                    ? (isDe ? 'Aktiv (>90% Moral -50% Steuer)' : 'Active (>90% Morale -50% Tax Cut)') 
                    : (isDe ? 'Inaktiv (Stufe 5 oder >90% Moral nötig)' : 'Inactive (Lvl 5 or >90% Morale required)')}
                </span>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.04] flex items-center justify-between sm:col-span-2">
                <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                  <i className="fas fa-user-tie text-amber-400 text-xs"></i>
                  {isDe ? 'Vorstands-Toleranz & Beobachtung:' : 'Boardroom Scrutiny:'}
                </span>
                <span className={`font-bold px-2.5 py-1 rounded-lg text-[11px] ${
                  consecutiveTitles > 0 
                    ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30' 
                    : tenureYears >= 4 
                    ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30' 
                    : 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                }`}>
                  {consecutiveTitles > 0 
                    ? (isDe ? 'Null-Toleranz bei Punktverlusten' : 'Zero tolerance for dropped points') 
                    : tenureYears >= 4 
                    ? (isDe ? 'Erhöhte Titelerwartung (Lange Amtszeit)' : 'Silverware expectation elevated') 
                    : (isDe ? 'Stabiles Grundvertrauen' : 'Standard confidence')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-amber-900/15 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3.5">
            <i className="fas fa-info-circle text-amber-400 mt-0.5 shrink-0 text-base"></i>
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 block mb-1">
                {isDe ? 'Vorstandsvorgabe & Konsequenzen' : 'Board Target & Dismissal Rules'}
              </strong>
              {isDe 
                ? `Der Vorstand erwartet zum Saisonende: `
                : `The board strictly requires you to `}
              <span className="font-bold text-white bg-black/40 px-1.5 py-0.5 rounded border border-amber-400/30">
                {state.boardTargetPos ? (isDe ? `Platz ${state.boardTargetPos} oder besser` : `Finish ${state.boardTargetPos} or better`) : state.boardExpectation || targetText}
              </span>.
              {state.club.tier === 1 && (state.trophyDrought || 0) > 4 && (
                <span className="text-rose-400 font-bold block mt-1.5 animate-pulse">
                  <i className="fas fa-triangle-exclamation mr-1 text-rose-500" />
                  {isDe ? `${state.trophyDrought}-Jahre Titelflaute: Die Fans verlieren die Geduld!` : `${state.trophyDrought}-Year Trophy Drought: The fanbase is losing patience.`}
                </span>
              )}
              {isDe 
                ? ' Fällt Ihr Gesamt-Impact Score unter 30, wird das Präsidium Sie fristlos entlassen – es sei denn, Sie besitzen einen Immunitäts-Schild!'
                : ' If your Overall Impact Score falls below 30, you will be sacked immediately unless you have an Immunity Shield to protect your career!'}
            </div>
          </div>

          {/* IN-MODAL POP-UP / DETAIL INSPECTOR OVERLAY */}
          <AnimatePresence>
            {selectedMetric && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-4 sm:p-6 flex flex-col overflow-y-auto custom-scrollbar"
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedMetric(null); }}
              >
                <div className="flex justify-between items-center pb-4 border-b border-white/[0.04] mb-5 shrink-0">
                  <button 
                    onClick={() => setSelectedMetric(null)}
                    className="flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-white transition-colors bg-sky-500/[0.05] hover:bg-sky-500/10 px-3.5 py-2 rounded-xl border border-sky-500/20 cursor-pointer"
                  >
                    <i className="fas fa-arrow-left text-xs"></i>
                    <span>{isDe ? 'Zurück zur Übersicht' : 'Back to Overview'}</span>
                  </button>

                  <button 
                    onClick={() => setSelectedMetric(null)}
                    className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/[0.04]"
                  >
                    <i className="fas fa-times text-sm"></i>
                  </button>
                </div>

                {/* Pop-up Content based on selectedMetric */}
                <div className="flex-1 space-y-6">
                  
                  {/* OVERALL IMPACT EXPLANATION */}
                  {selectedMetric === 'overall' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl text-amber-400">
                          <i className="fas fa-bolt"></i>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                            {isDe ? 'Gesamt-Impact Score' : 'Overall Impact Score'}
                          </h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            {isDe ? 'Aktueller Wert: ' : 'Current Rating: '} 
                            <span className="font-semibold text-white tabular-nums">{impactScore}/100</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-5 rounded-2xl border border-white/[0.04] space-y-3">
                        <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                          {isDe ? 'Bedeutung & Funktion' : 'What is this metric?'}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                          {isDe 
                            ? 'Der Impact Score repräsentiert das Vertrauen des Vereinsvorstands und der Gesellschafter in Ihre Amtsführung. Er bestimmt maßgeblich, ob Sie im Amt bleiben, mehr Budget erhalten oder entlassen werden.'
                            : 'The Impact Score measures the board and stakeholders\' overall confidence in your managerial leadership. It dictates your job security, transfer budget flexibility, and risk of termination.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                          <h5 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <i className="fas fa-check-circle"></i> {isDe ? 'So steigern Sie den Score' : 'How to Increase It'}
                          </h5>
                          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                            <li>{isDe ? 'Saisonziel des Vorstands erreichen oder übertreffen' : 'Meet or exceed the board\'s league target finish'}</li>
                            <li>{isDe ? 'Positive Finanzmarge & Budget-Überschuss halten' : 'Maintain a positive operating margin & budget surplus'}</li>
                            <li>{isDe ? 'Mannschaftsmoral über 80% halten' : 'Keep squad morale above 80% via bonding & wins'}</li>
                            <li>{isDe ? 'Arena-Auslastung durch gute OVR hochhalten' : 'Maximize arena fill rate with high team OVR'}</li>
                          </ul>
                        </div>

                        <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                          <h5 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                            <i className="fas fa-exclamation-triangle"></i> {isDe ? 'Kritische Schwellenwerte' : 'Critical Thresholds'}
                          </h5>
                          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                            <li><strong className="text-emerald-400 font-semibold tabular-nums">80 - 100:</strong> {isDe ? 'Präsidium begeistert, Job extrem sicher.' : 'Delighted board, high job security.'}</li>
                            <li><strong className="text-blue-400 font-semibold tabular-nums">50 - 79:</strong> {isDe ? 'Solide Leistung, regulärer Spielbetrieb.' : 'Solid performance, regular operations.'}</li>
                            <li><strong className="text-amber-400 font-semibold tabular-nums">30 - 49:</strong> {isDe ? 'Verwarnung! Vorstand erhöht den Druck.' : 'Warning! Board is putting pressure on you.'}</li>
                            <li><strong className="text-rose-400 font-semibold tabular-nums">&lt; 30:</strong> {isDe ? 'Fristlose Kündigung (außer Schutzschild aktiv).' : 'Immediate Sacking (unless shielded).'}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COACH REP EXPLANATION */}
                  {selectedMetric === 'coach_rep' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl text-sky-400">
                          <i className="fas fa-user-tie"></i>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                            {isDe ? 'Trainer-Renommee (Head Coach Rep)' : 'Head Coach Reputation'}
                          </h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            {isDe ? 'Ihr persönlicher Trainer-Status: ' : 'Your personal manager prestige: '} 
                            <span className="font-semibold text-sky-400 tabular-nums">{coachRep}/100</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-5 rounded-2xl border border-white/[0.04] space-y-3">
                        <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                          {isDe ? 'Unterschied zu Vereins-Reputation' : 'Coach Rep vs Club Rep'}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                          {isDe 
                            ? 'Ihr Trainer-Renommee gehört Ihnen persönlich – nicht dem aktuellen Club! Es wächst mit jedem Sieg, jedem Pokaltriumph (DHB-Pokal, Champions League) und jeder erfolgreichen Meisterschaftssaison. Wechseln Sie den Verein, nehmen Sie Ihr Renommee komplett mit.'
                            : 'Head Coach Reputation is tied to you personally, not your club! It rises with every victory, regional or European cup triumph, and successful season. If you take a job at a new club, your personal reputation stays with you.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                          <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <i className="fas fa-briefcase text-sky-400"></i> {isDe ? 'Vorteile im Spiel' : 'In-Game Impact'}
                          </h5>
                          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                            <li>{isDe ? 'Schaltet Angebote von Top-Vereinen auf dem Arbeitsmarkt frei' : 'Unlocks lucrative offers from elite clubs on Job Market'}</li>
                            <li>{isDe ? 'Erhöht die Zusage-Wahrscheinlichkeit von Superstars' : 'Increases superstar and key player signing success'}</li>
                            <li>{isDe ? 'Gibt dem Vorstand mehr Geduld bei Fehlstarts' : 'Grants more leeway and patience from club boards'}</li>
                          </ul>
                        </div>

                        <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                          <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <i className="fas fa-medal text-amber-400"></i> Prestige Tiers
                          </h5>
                          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                            <li><strong className="text-zinc-400 font-semibold tabular-nums">0 - 39:</strong> Emerging / Lower Tiers</li>
                            <li><strong className="text-blue-400 font-semibold tabular-nums">40 - 69:</strong> Established League Manager</li>
                            <li><strong className="text-purple-400 font-semibold tabular-nums">70 - 89:</strong> National Top Coach</li>
                            <li><strong className="text-amber-400 font-semibold tabular-nums">90 - 100:</strong> Handball Manager Legend</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CLUB REP EXPLANATION */}
                  {selectedMetric === 'club_rep' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl text-blue-400">
                          <i className="fas fa-globe"></i>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                            Club Reputation
                          </h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            {state.club.name} &bull; Rating:{' '} 
                            <span className="font-semibold text-blue-400 tabular-nums">{clubRep}/100</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-5 rounded-2xl border border-white/[0.04] space-y-3">
                        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                          Calculation & Meaning
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                          {`Club Reputation measures the institutional stature of ${state.club.name}. It is calculated dynamically based on your current League Tier (Tier ${state.club.tier}) and Squad Strength (OVR ${state.club.baseOvr}). Tier 1 top flight clubs command a much higher baseline prestige than lower divisions.`}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                          <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <i className="fas fa-money-bill-wave text-emerald-400"></i> {isDe ? 'Wirtschaftliche Effekte' : 'Commercial Impact'}
                          </h5>
                          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                            <li>{isDe ? 'Höhere automatische Sponsoring- und TV-Erlöse' : 'Higher automated sponsorship & TV broadcast income'}</li>
                            <li>{isDe ? 'Stärkere Ticketnachfrage und schnellere Fan-Entwicklung' : 'Increased ticket demand and faster organic fan growth'}</li>
                            <li>{isDe ? 'Geringere Gehaltsforderungen bei Neuverpflichtungen' : 'More bargaining power on player wage negotiations'}</li>
                          </ul>
                        </div>

                        <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                          <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <i className="fas fa-arrow-up text-blue-400"></i> {isDe ? 'Wie erhöht man Club Rep?' : 'How to Raise Club Rep'}
                          </h5>
                          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                            <li>{isDe ? 'Aufstieg in höhere Spielklassen (Tier 1 ist das Maximum)' : 'Earn promotions into higher league tiers (Tier 1 top)'}</li>
                            <li>{isDe ? 'Kader-OVR durch Transfers und Jugendförderung steigern' : 'Upgrade squad OVR through top transfers & youth academy'}</li>
                            <li>{isDe ? 'Gewinn von Meisterschaften und nationalen Pokalen' : 'Win domestic league championships and cup trophies'}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SQUAD MORALE EXPLANATION */}
                  {selectedMetric === 'morale' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl text-purple-400">
                          <i className="fas fa-users"></i>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                            {isDe ? 'Mannschaftsmoral & Kabine' : 'Squad Morale & Chemistry'}
                          </h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            {isDe ? 'Aktuelle Team-Moral: ' : 'Current Squad Morale: '} 
                            <span className="font-semibold text-purple-400 tabular-nums">{morale}%</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-5 rounded-2xl border border-white/[0.04] space-y-3">
                        <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                          {isDe ? 'Auswirkungen auf die Spiele' : 'Impact on Matches'}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                          {isDe 
                            ? 'Die Mannschaftsmoral beeinflusst das Zusammenspiel in engen Schlussphasen und die Siegwahrscheinlichkeit in Pokalspielen. Hohe Moral schützt vor Formkrisen. Niedrige Moral (<50%) führt zu unerwarteten Niederlagen und senkt Ihren Impact Score beim Vorstand.'
                            : 'Squad morale directly affects late-game clutch moments, penalty efficiency, and cup match win probabilities. High morale shields your squad against losing streaks, while toxic morale (<50%) triggers underperformance and penalizes board satisfaction.'}
                        </p>
                      </div>

                      {/* Direct Team Bonding Action */}
                      {(() => {
                        const bondingCost = Math.round(getLeagueScaledVal(state.club.tier, 50000, state.club.country));
                        const isBondingLimitReached = (state.teamBondingThisSeason || 0) >= 1;
                        return (
                          <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                              <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                                <i className="fas fa-beer text-amber-400"></i> {isDe ? 'Teambuilding-Maßnahme durchführen' : 'Conduct Team Bonding Session'}
                              </h5>
                              <p className="text-xs text-zinc-400 mt-1">
                                {isDe 
                                  ? `Investieren Sie ${formatMoney(bondingCost)}, um die Team-Moral sofort um +30% zu steigern (Max. 1x pro Saison).` 
                                  : `Invest ${formatMoney(bondingCost)} to instantly boost squad morale by +30% (Max 1 per season).`}
                              </p>
                            </div>

                            <button
                              onClick={handleBondTeamInPlace}
                              disabled={state.budget < bondingCost || morale >= 100 || isBondingLimitReached}
                              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium uppercase tracking-wider transition-colors shadow-lg shrink-0 flex items-center gap-2 cursor-pointer"
                            >
                              <i className="fas fa-handshake"></i>
                              <span>
                                {isBondingLimitReached 
                                  ? (isDe ? 'Limit erreicht (1/1)' : 'Season Limit Reached (1/1)') 
                                  : morale >= 100 
                                  ? (isDe ? 'Moral auf 100%' : 'Morale Maxed') 
                                  : (isDe ? `Teambuilding (${formatMoney(bondingCost)})` : `Bond Team (${formatMoney(bondingCost)})`)}
                              </span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* STRATEGIC BOARD ROADMAP DETAIL */}
                  {selectedMetric === 'target' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl text-amber-400">
                          <i className="fas fa-map-location-dot"></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                              {isDe ? roadmap.titleDe : roadmap.titleEn}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-sky-500/10 text-sky-300 border border-sky-500/20">
                              {roadmap.horizonYears} {isDe ? 'Jahre' : 'Years'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-medium mt-0.5">
                            {isDe ? 'Zyklus: ' : 'Strategic Cycle: '}
                            <span className="font-semibold text-white">{roadmap.startYear} – {roadmap.endYear}</span> · {roadmap.boardConfidence}% {isDe ? 'Vorstands-Vertrauen' : 'Board Confidence'}
                          </p>
                        </div>
                      </div>

                      {/* Strategic Narrative */}
                      <div className="bg-[#10121a] p-4 rounded-2xl border border-white/[0.04] space-y-2">
                        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <i className="fas fa-quote-left text-[10px]"></i>
                          {isDe ? 'Strategischer Kontext & Vorstandsvorgabe' : 'Strategic Context & Board Mandate'}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                          {isDe ? roadmap.narrativeDe : roadmap.narrativeEn}
                        </p>
                      </div>

                      {/* Goals List */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          {isDe ? 'Konkrete Roadmap-Ziele & MP-Prämien' : 'Roadmap Goals & MP Rewards'}
                        </h4>
                        {roadmap.goals.map((g, idx) => (
                          <div 
                            key={`impact-goal-${g.id || idx}-${idx}`}
                            className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                              g.completed ? 'bg-emerald-500/[0.04] border-emerald-500/20' : 'bg-[#10121a] border-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-medium shrink-0 mt-0.5 ${
                                  g.completed ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-sky-400'
                                }`}>
                                  {g.completed ? '✓' : idx + 1}
                                </span>
                                <div>
                                  <div className="text-xs font-semibold text-white">
                                    {isDe ? g.titleDe : g.titleEn}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5">
                                    {isDe ? g.descriptionDe : g.descriptionEn}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium text-xs shrink-0 tabular-nums">
                                +{g.rewardMp} MP
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400 pt-1 border-t border-white/[0.04] flex justify-between">
                              <span>Status: <strong className={g.completed ? 'text-emerald-400 font-semibold' : 'text-zinc-200 font-medium'}>{g.completed ? (isDe ? 'Erfüllt' : 'Completed') : (isDe ? 'In Bearbeitung' : 'In Progress')}</strong></span>
                              {g.rewardCash && <span className="text-emerald-400 font-medium tabular-nums">+{formatMoney(g.rewardCash)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IMMUNITY SHIELDS EXPLANATION */}
                  {selectedMetric === 'shields' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl text-emerald-400">
                          <i className="fas fa-shield"></i>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                            {isDe ? 'Job-Sicherheit & Schutzschilde' : 'Job Security & Immunity Shields'}
                          </h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            {isDe ? 'Verfügbare Immunitäts-Schilde: ' : 'Active Shields: '} 
                            <span className="font-semibold text-emerald-400 tabular-nums">{shields}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-5 rounded-2xl border border-white/[0.04] space-y-3">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                          {isDe ? 'Funktionsweise der Schutzschilde' : 'How Immunity Shields Save You'}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                          {isDe 
                            ? 'Immunitäts-Schilde sind Ihre Lebensversicherung als Handball-Manager! Sollte Ihr Impact Score nach einer verpatzten Saison unter die fatale Marke von 30 fallen oder der Vorstand die Reißleine ziehen wollen, wird automatisch 1 Schutzschild verbraucht, um Ihre Entlassung abzuwenden und Ihnen eine weitere Saison zu gewähren.'
                            : 'Immunity Shields are your ultimate job security cushion! If your Impact Score drops below the fatal threshold of 30 after a disastrous season, an Immunity Shield is consumed automatically to block your dismissal and grant you another year to turn things around.'}
                        </p>
                      </div>

                      <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                        <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <i className="fas fa-star text-amber-400"></i> {isDe ? 'Wie verdient man Schutzschilde?' : 'How to Earn Immunity Shields'}
                        </h5>
                        <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                          <li>{isDe ? 'Gewinn eines nationalen oder regionalen Pokals' : 'Win a domestic or regional cup tournament'}</li>
                          <li>{isDe ? 'Aufstieg in die Bundesliga (Tier 1)' : 'Earn promotion to Tier 1'}</li>
                          <li>{isDe ? 'Triumph in der Champions League oder im Europapokal' : 'Win the Champions League or Euro Cup'}</li>
                          <li>{isDe ? 'Freischalten spezieller Manager-Fähigkeiten im Talentbaum' : 'Unlock specific manager perks in the skill tree'}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* FINANCIAL HEALTH EXPLANATION */}
                  {selectedMetric === 'financials' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl text-emerald-400">
                          <i className="fas fa-wallet"></i>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                            {isDe ? 'Finanzielle Gesundheit & Marge' : 'Financial Health & Treasury'}
                          </h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            {isDe ? 'Vereinskasse: ' : 'Current Treasury: '} 
                            <span className="font-semibold text-white tabular-nums">{(state.budget / 1000000).toFixed(2)}M €</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-5 rounded-2xl border border-white/[0.04] space-y-3">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                          {isDe ? 'Vorstands-Kriterien' : 'Board Evaluation'}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                          {isDe 
                            ? 'Der Vorstand bewertet Ihre finanzielle Disziplin. Ein Schuldenstand (negatives Budget) zieht sofort 10 Punkte Abzug nach sich. Ein gesunder Überschuss (+50.000 €+) belohnt Sie mit +10 Bonuspunkten auf Ihren Impact Score.'
                            : 'The board strictly monitors your operating balance. Carrying debt (negative budget) applies a harsh 10-point penalty to your Impact Score. Maintaining a healthy operational surplus (+€50,000+) awards you a +10 point bonus.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                          <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <i className="fas fa-coins text-amber-400"></i> {isDe ? 'Einnahmequellen' : 'Revenue Drivers'}
                          </h5>
                          <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                            <li>{isDe ? 'Ticketeinnahmen (Zuschauer x Ticketpreis x 17 Heimspiele)' : 'Matchday ticket revenue (Attendance x Ticket price x 17 games)'}</li>
                            <li>{isDe ? 'TV- & Sponsoringgelder (Automatisch skaliert)' : 'TV broadcast rights & automated sponsors'}</li>
                            <li>{isDe ? 'Prämien für Platzierung & Europacup-Teilnahme' : 'League finish prizes & European competition revenue'}</li>
                          </ul>
                        </div>

                        <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                          <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <i className="fas fa-receipt text-rose-400"></i> {isDe ? 'Hauptausgaben' : 'Primary Costs'}
                          </h5>
                          <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                            <li>{isDe ? 'Kadergehälter & Betriebskosten' : 'Player squad wages & operational overhead'}</li>
                            <li>{isDe ? 'Instandhaltung für Arena, Medizin & Akademie' : 'Facility maintenance (Arena, Medical, Academy)'}</li>
                            <li>{isDe ? 'Ablösesummen auf dem Transfermarkt' : 'Transfer fees and signing bonuses'}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FANS & ARENA EXPLANATION */}
                  {selectedMetric === 'fans' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl text-emerald-400">
                          <i className="fas fa-heart"></i>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                            {isDe ? 'Fanzufriedenheit & Arena-Auslastung' : 'Fan Support & Arena Capacity'}
                          </h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            <span className="tabular-nums">{currentFans.toLocaleString()}</span> {isDe ? 'Gesamtfans • ' : 'total supporters • '} <span className="tabular-nums">{stadiumCap.toLocaleString()}</span> {isDe ? 'Plätze Arena' : 'seat arena'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-5 rounded-2xl border border-white/[0.04] space-y-3">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                          {isDe ? 'Auslastung & Dynamisches Fanwachstum' : 'Capacity & Organic Fan Growth'}
                        </h4>
                        <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                          {isDe 
                            ? 'Die Fanzufriedenheit errechnet sich aus dem Verhältnis Ihrer aktiven Fanbasis zur Hallenkapazität. Bauen Sie eine Riesen-Arena (bis zu 30.000 Plätze in Tier 1), müssen Sie sportlich erfolgreich sein (hohe OVR), damit die Fanbasis nachzieht und die Halle füllt!'
                            : 'Fan approval is calculated as the ratio of your active core fanbase to arena capacity. Building a mega arena (up to 30,000 capacity in Tier 1) requires continuous on-court winning (high team OVR) so your fanbase organically expands to pack the arena every matchday.'}
                        </p>
                      </div>

                      <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                        <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <i className="fas fa-chart-line text-emerald-400"></i> {isDe ? 'Tipps für maximale Erlöse' : 'Tips for Maximum Revenue'}
                        </h5>
                        <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                          <li>{isDe ? 'Eine volle Halle erzeugt eine Hexenkessel-Atmosphäre (+15 Pkt Impact Bonus)' : 'A packed arena creates an electric atmosphere (+15 pts impact bonus)'}</li>
                          <li>{isDe ? 'Kader-OVR erhöhen lässt die Fanbasis organisch wachsen' : 'Increasing squad OVR organically multiplies your core fans'}</li>
                          <li>{isDe ? 'Überdimensionierte Arenen ohne Fans belasten die Betriebskosten' : 'Empty oversized arenas drain operating margins without ticket returns'}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* DYNASTY PRESSURE & SCRUTINY EXPLANATION */}
                  {selectedMetric === 'dynasty' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl text-rose-400">
                          <i className="fas fa-crosshairs"></i>
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-tight">
                            {isDe ? 'Dynastie-Druck & Zielscheiben-Steuer' : 'Dynasty Pressure & Title Tax'}
                          </h3>
                          <p className="text-xs text-zinc-400 font-medium">
                            {isDe ? 'Aktueller Status: ' : 'Current Status: '} 
                            <span className="font-semibold text-white">
                              {consecutiveTitles > 1 
                                ? `${consecutiveTitles} Titles (Dynasty)` 
                                : consecutiveTitles === 1 
                                ? '1 Title (Reigning Champion)' 
                                : 'Challenger (No Tax)'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-5 rounded-2xl border border-white/[0.04] space-y-3">
                        <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                          {isDe ? 'Der 3-Stufen-Druckverlauf' : 'The 3-Level Pressure Progression'}
                        </h4>
                        <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed font-normal">
                          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04]">
                            <strong className="text-sky-300 block mb-0.5 font-semibold">1. CHALLENGER (0 Titles / No Tax)</strong>
                            Standard board confidence. No opponent targeting or performance drag (0.0 OVR tax). Normal margin for error.
                          </div>
                          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04]">
                            <strong className="text-amber-300 block mb-0.5 font-semibold">2. CHAMPION (1 Title / -0.5 OVR Tax)</strong>
                            The target is painted on your back. Opponents play with heightened motivation and scouting preparation. Board expects a title defense.
                          </div>
                          <div className="p-3 bg-black/40 rounded-xl border border-white/[0.04]">
                            <strong className="text-rose-300 block mb-0.5 font-semibold">3. DYNASTY (2+ Titles / -1.0 to -2.5 OVR Tax)</strong>
                            Peak pressure. Opponents bring 100% maximum focus to topple the champion. The boardroom scrutiny shifts to zero tolerance for dropped points.
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#10121a] p-4 rounded-xl border border-white/[0.04] space-y-2">
                        <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <i className="fas fa-shield-halved text-emerald-400"></i> Facility Dynasty Shield
                        </h5>
                        <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                          Upgrading club facilities to Level 5 (Tier 1 standard) cuts your Dynasty Tax drag by <strong className="text-emerald-400 font-semibold tabular-nums">50%</strong> (from up to -2.5 OVR down to -1.2 OVR). High-tech recovery centers and analytics facilities mitigate the fatigue and psychological target on your squad.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
};
