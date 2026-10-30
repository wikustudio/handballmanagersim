import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameState, Language, Club } from '../types';
import { formatMoney, sanitizePlayerName, getAcademyCallUpCap, getAcademyScoutCap, getLeagueScaledVal } from '../data/gameConstants';
import { t as tr } from '../data/translations';
import { YouthChampionshipModal } from './YouthChampionshipModal';
import { getIncubatorCapacity, calculateTrainingCompensationK, getSeniorIntegrationOdds } from '../engine/incubatorEngine';

interface YouthModalProps {
  protectionCost?: number;
  creditLimit?: number;
  state: GameState;
  lang: Language;
  actionCost: number;
  financials: { wages: number; estRevenue: number; net: number };
  onRecruitYouth: () => void;
  onProtectYouth?: (id: string) => void;
  onGraduateYouth?: (id: string, action: 'promote' | 'loan' | 'compensation') => void;
  canAfford: boolean;
  onClose: () => void;
  onOpenChampionship?: () => void;
  clubsDb?: Club[];
  isModActive?: boolean;
  onTournamentVictory?: (prizeMoney: number, cohortBoost: number) => void;
}

export const YouthModal: React.FC<YouthModalProps> = ({
  state,
  lang,
  actionCost,
  onRecruitYouth,
  onProtectYouth,
  onGraduateYouth,
  onClose,
  onOpenChampionship,
  canAfford,
  protectionCost = 25000,
  creditLimit = 0,
  financials,
  clubsDb,
  isModActive,
  onTournamentVictory,
}) => {
  const isDe = lang === 'de';
  const t = (en: string, de?: string, _ignoredEs?: string) => tr(lang, en, de);
  const [protectConfirmId, setProtectConfirmId] = useState<string | null>(null);
  const [showTournamentSubModal, setShowTournamentSubModal] = useState(false);
  
  const pipeline = state.youthPipeline || [];
  const maxCapacity = getIncubatorCapacity(state.club.academyLevel || 1);
  const squadSize = state.club.squadSize || 24;
  const isSquadFull = squadSize >= 50;
  const isCombinedFull = squadSize + pipeline.length >= 50;
  const isFull = pipeline.length >= maxCapacity || isCombinedFull;

  const LEVEL_1_THRESHOLD = 1;
  const hasLevel1Cohort = pipeline.length >= LEVEL_1_THRESHOLD;
  const isTournamentPlayed = state.youthChampionshipPlayedYear === state.year;
  const isPreSeason = (state.seasonPhase || 'start') === 'start';
  const academyLvl = Math.max(1, Math.min(5, state.club.academyLevel || 1));
  const tier = state.club.tier || 1;
  const facilityBonus = (academyLvl - 1) * 6;
  const callUpCap = getAcademyCallUpCap(academyLvl);
  const callUpsUsed = state.academyCallUpsThisSeason || 0;
  const isCallUpCapped = callUpsUsed >= callUpCap;
  const scoutCap = getAcademyScoutCap(academyLvl);
  const scoutsUsed = state.youthScoutedThisSeason || 0;
  const isScoutCapped = scoutsUsed >= scoutCap;

  // Realistic Tier Vulnerability: Giants aggressively poach from lower tiers
  const tierPoachVulnerability = Math.max(0, (tier - 1) * 8);
  const baseKeep = 45 + ((academyLvl || 1) * 11);
  const protectionKeepChance = Math.max(25, Math.min(95, baseKeep - tierPoachVulnerability));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 cursor-pointer overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.98, opacity: 0 }} 
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/90 backdrop-blur-3xl border border-white/[0.08] w-full max-w-lg rounded-[28px] sm:rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto shrink-0 overflow-hidden cursor-default relative text-left"
      >
        {/* Subtle Ambient Sky-Blue Accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] flex justify-between items-center shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400 text-base shadow-inner shrink-0">
              <i className="fas fa-seedling"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90 mb-0.5">
                {t('Talent Pipeline', 'Talentschmiede')}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                {t('Youth Academy', 'Jugendakademie')}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-extrabold tracking-tight tabular-nums text-emerald-400">{pipeline.length}/{maxCapacity}</span>
              <span className="text-[11px] text-zinc-400 font-normal ml-1">{t('Prospects', 'Talente')}</span>
            </div>
            <button 
              aria-label="Close modal" 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.08] cursor-pointer shrink-0"
            >
              <i className="fas fa-xmark text-xs"></i>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain custom-scrollbar flex-1 min-h-0 space-y-4 relative z-10">
          {/* Compact Academy Milestone & Capacity Bar */}
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3.5 flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-zinc-200 flex items-center gap-2 font-semibold">
                <i className="fas fa-seedling text-emerald-400 text-xs"></i>
                {t(
                  `Academy Level ${academyLvl}/5 Milestones`,
                  `Akademie Stufe ${academyLvl}/5 Meilensteine`
                )}
              </span>
              <div className="flex items-center gap-2 text-[11px] tracking-tight tabular-nums">
                <span className="text-sky-300 font-bold">
                  {t(`Scouts ${scoutsUsed}/${scoutCap}`, `Scouts ${scoutsUsed}/${scoutCap}`)}
                </span>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className="text-emerald-300 font-bold">
                  {t(`Call-ups ${callUpsUsed}/${callUpCap}`, `Berufung ${callUpsUsed}/${callUpCap}`)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 border-t border-white/[0.05] text-[10px] tracking-tight tabular-nums">
              <span className={academyLvl >= 2 ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                L2 {t('Poach Shield', 'Abwerbe-Schutz')}
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className={academyLvl >= 3 ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                L3 +1 OVR {t('Graduation', 'Reife-Bonus')}
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className={academyLvl >= 4 ? 'text-amber-400 font-semibold' : 'text-zinc-500'}>
                L4 15% {t('Wonderkid', 'Wunderkind')}
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className={academyLvl >= 5 ? 'text-sky-400 font-semibold' : 'text-zinc-500'}>
                L5 {formatMoney(getLeagueScaledVal(state.club.tier || 1, 1500, state.club.country || 'GER'), state.club.country)} {t('Dividend/yr', 'Dividende/J')}
              </span>
            </div>
          </div>

          {tier >= 3 && academyLvl >= 2 && academyLvl < 5 && (
            <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-amber-200/90 leading-tight">
              <i className="fa-solid fa-triangle-exclamation text-amber-400 text-xs shrink-0"></i>
              <span>
                {t(
                  `Tier ${tier} Poaching Risk: Use L2 Poach Shield on 3+ OVR prospects (${protectionKeepChance}% keep rate vs Tier 1 giants; 100% automatic at L5)`,
                  `Tier ${tier} Abwerberisiko: Nutze L2 Abwerbe-Schutz für 3+ GES Talente (${protectionKeepChance}% Verbleibequote vs. Erstligisten; 100% automatisch ab L5)`
                )}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {pipeline.length === 0 ? (
              <div className="text-center p-8 border border-white/[0.06] rounded-2xl bg-white/[0.02]">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 text-xl mx-auto mb-3">
                  <i className="fas fa-user-graduate"></i>
                </div>
                <div className="text-white font-semibold text-sm">{t('Academy Empty', 'Akademie leer')}</div>
                <div className="text-zinc-400 text-xs mt-1 font-normal">{t('No players currently enrolled in development.', 'Derzeit keine Nachwuchsspieler in der Entwicklung.')}</div>
              </div>
            ) : (
              pipeline.map((p, idx) => {
                const isGenerational = p.type === 'generational';
                const isTop = p.type === 'top_prospect';
                const isReady = (p.status === 'ready' || (typeof p.timer === 'number' && p.timer <= 0)) && p.status !== 'loaned';
                const isLoaned = p.status === 'loaned';
                const hasNlzBonus = isReady && academyLvl >= 3;
                const hasFeederBonus = Boolean(state.prestigeUpgrades?.feederClubPurchased && !(p as any).feederBonusApplied);
                const rawGraduateBoost = p.boost + (hasNlzBonus ? 1 : 0) + (hasFeederBonus ? 1 : 0);
                let effectiveGraduateBoost = rawGraduateBoost;
                const rawEarlyBoost = Math.max(1, (p.boost + (hasFeederBonus ? 1 : 0)) - 1);
                let effectiveEarlyBoost = rawEarlyBoost;
                let coachYouthTrait: 'boost' | 'penalty' | null = null;
                if (state.currentCoach) {
                  const cStr = state.currentCoach.strength;
                  const cWeak = state.currentCoach.weakness;
                  const cArch = (state.currentCoach as any).archetype;
                  if (cWeak === 'Youth Apathy' || cArch === 'iron_disciplinarian' || cArch === 'pragmatic_grinder') {
                    effectiveGraduateBoost = Math.max(1, Math.floor(effectiveGraduateBoost / 2));
                    effectiveEarlyBoost = Math.max(1, Math.floor(effectiveEarlyBoost / 2));
                    coachYouthTrait = 'penalty';
                  } else if (cStr === 'Youth Whisperer' || cStr === 'Youth Focus' || cArch === 'youth_visionary') {
                    effectiveGraduateBoost += 1;
                    effectiveEarlyBoost += 1;
                    coachYouthTrait = 'boost';
                  }
                }
                const rawCompFee = calculateTrainingCompensationK(p, state.club.tier || 1, state.club.country || 'GER');
                const compFee = state.clubIdentity === 'wonderkid' ? Math.round(rawCompFee * 1.35) : rawCompFee;
                const integrationOdds = getSeniorIntegrationOdds(p, state.club.baseOvr, {
                  coachStrength: state.currentCoach?.strength,
                  coachWeakness: state.currentCoach?.weakness,
                  coachArchetype: (state.currentCoach as any)?.archetype,
                  hasTalentscout: (state.managerSkills || []).includes('talentscout'),
                  clubTier: state.club.tier || 1,
                  clubCountry: state.club.country || 'GER',
                });
                const clickChancePct = Math.round(integrationOdds.clickChance * 100);
                
                return (
                  <div
                    key={p.id || idx}
                    className={`backdrop-blur-md border rounded-2xl p-4 flex flex-col gap-2.5 transition-all ${
                      isReady 
                        ? 'bg-emerald-500/[0.04] border-emerald-500/25 shadow-[0_0_16px_rgba(16,185,129,0.08)]' 
                        : isLoaned
                        ? 'bg-sky-500/[0.03] border-sky-500/20'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-semibold text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                            <span className="truncate max-w-full">{sanitizePlayerName(p.name) || `Talent #${idx + 1}`}</span>
                            {p.position && (
                              <span className="text-zinc-400 font-mono text-[11px] shrink-0">
                                · {p.position}
                              </span>
                            )}
                            {p.nationality && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-300 border border-white/[0.08] shrink-0">
                                {p.nationality}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-normal flex-wrap">
                            <span className={isGenerational ? 'text-amber-300 font-semibold' : isTop ? 'text-emerald-300 font-semibold' : 'text-sky-300'}>
                              {isGenerational ? t('Generational', 'Ausnahmetalent') : isTop ? t('Top Prospect', 'Top-Talent') : t('Local Prospect', 'Lokales Talent')}
                            </span>
                            <span className="text-zinc-600">·</span>
                            <span className=" whitespace-nowrap">{p.age || 17} {t('yrs', 'Jahre')}</span>
                            {p.playstyle && (
                              <>
                                <span className="text-zinc-600">·</span>
                                <span className="text-zinc-300 text-[11px]">{p.playstyle}</span>
                              </>
                            )}
                            {isReady && (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap">
                                {t('Ready to Graduate', 'Absolvent')}
                              </span>
                            )}
                            {isLoaned && (
                              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap">
                                {t('On Loan Farm', 'Leihe')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="text-emerald-400 font-bold font-mono text-sm sm:text-base whitespace-nowrap">
                            +{effectiveGraduateBoost} {t('OVR', 'GES')}
                          </span>
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {hasNlzBonus && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold whitespace-nowrap">
                                +{t('1 NLZ Bonus', '1 NLZ-Bonus')}
                              </span>
                            )}
                            {hasFeederBonus && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold whitespace-nowrap">
                                +{t('1 Feeder', '1 Farmteam')}
                              </span>
                            )}
                            {coachYouthTrait === 'boost' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold whitespace-nowrap" title="Head Coach Youth Development Bonus">
                                +1 Coach
                              </span>
                            )}
                            {coachYouthTrait === 'penalty' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold whitespace-nowrap" title="Head Coach Youth Apathy / Disciplinarian Bottleneck">
                                -50% Coach
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between gap-2 flex-wrap pt-1.5 border-t border-white/[0.05]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded border font-semibold whitespace-nowrap ${
                              clickChancePct >= 60
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                : clickChancePct >= 40
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                            }`}
                            title="Probability that this youth player clicks immediately with your Senior First Team tactics & dressing room upon promotion. Farm Loans (+14%/loan) and Youth-focused coaches increase this rate."
                          >
                            {clickChancePct}% Senior Click
                          </span>
                          {(p.loansServed || 0) > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold whitespace-nowrap">
                              Loan-Tested ({p.loansServed}/2)
                            </span>
                          )}
                        </div>
                        <span className="text-zinc-400 whitespace-nowrap ml-auto">
                          {isReady 
                            ? t('Matured', 'Ausgebildet') 
                            : isLoaned 
                            ? t('Developing off-site', 'Extern in Leihe') 
                            : p.timer === 1 
                            ? t('Next season', 'Nächste Saison') 
                            : t(`In ${p.timer} seasons`, `In ${p.timer} Saisons`)}
                        </span>
                      </div>
                    </div>

                    {/* Graduation Choices for Ready or Loaned Prospects */}
                    {(isReady || isLoaned) && onGraduateYouth && (
                      <div className="pt-2.5 mt-1 border-t border-emerald-500/20 flex flex-col gap-2">
                        <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-graduation-cap"></i>
                            <span>{t('Graduation Decisions', 'Abschluss-Entscheidung')}</span>
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                            isCallUpCapped
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                          }`}>
                            {callUpsUsed}/{callUpCap} {t('Senior Call-ups', 'Kaderübernahmen')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            disabled={isLoaned || isCallUpCapped || isSquadFull}
                            onClick={() => onGraduateYouth(p.id, 'promote')}
                            className={`p-2 rounded-xl text-left transition flex flex-col justify-between ${
                              isLoaned || isCallUpCapped || isSquadFull
                                ? 'bg-zinc-800/40 border border-white/[0.05] text-zinc-500 cursor-not-allowed opacity-60'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white cursor-pointer'
                            }`}
                            title={
                              isLoaned
                                ? t('Locked while prospect is out on farm loan this season', 'Gesperrt während der laufenden Saisonleihe')
                                : isSquadFull
                                ? t('Senior squad is at maximum capacity (50/50 players)', 'Profikader hat das Limit erreicht (50/50 Spieler)')
                                : isCallUpCapped
                                ? `Seasonal call-up cap reached (${callUpsUsed}/${callUpCap}). Upgrade Youth Academy for higher capacity.`
                                : undefined
                            }
                          >
                            <span className="text-[11px] font-bold flex items-center gap-1">
                              <i className={`fa-solid ${isLoaned ? 'fa-lock' : 'fa-user-plus'} text-[10px]`}></i>
                              {isLoaned ? t('Sign to Squad', 'Kaderübernahme') : isSquadFull ? t('Squad Full', 'Kader voll') : isCallUpCapped ? t('Cap Reached', 'Limit erreicht') : t('Sign to Squad', 'Kaderübernahme')}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-300 mt-1">
                              {isLoaned ? t('Locked (On Loan)', 'Gesperrt (Leihe)') : isSquadFull ? '50/50 max' : isCallUpCapped ? `${callUpsUsed}/${callUpCap} used` : `+${effectiveGraduateBoost} ${t('OVR to First Team', 'GES für Profikader')}`}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isLoaned || (p.loansServed || 0) >= 2 || (p.age || 18) >= 20}
                            onClick={() => onGraduateYouth(p.id, 'loan')}
                            className={`p-2 rounded-xl text-left transition flex flex-col justify-between ${
                              isLoaned || (p.loansServed || 0) >= 2 || (p.age || 18) >= 20
                                ? 'bg-zinc-800/40 border border-white/[0.05] text-zinc-500 cursor-not-allowed opacity-60'
                                : 'bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-white cursor-pointer'
                            }`}
                            title={
                              isLoaned
                                ? t('Already on farm loan for this season', 'Bereits für diese Saison verliehen')
                                : (p.loansServed || 0) >= 2
                                ? t('Max 2 farm loans reached for this prospect', 'Maximal 2 Leihen für dieses Talent erreicht')
                                : (p.age || 18) >= 20
                                ? t('Prospect too old for farm loan (max age 19)', 'Talent zu alt für Partnerleihe (max. 19 Jahre)')
                                : undefined
                            }
                          >
                            <span className="text-[11px] font-bold flex items-center gap-1">
                              <i className={`fa-solid ${isLoaned ? 'fa-lock' : 'fa-handshake'} text-[10px]`}></i>
                              {(p.loansServed || 0) >= 2 ? t('Loan Cap (2/2)', 'Leih-Limit (2/2)') : t('Farm Loan', 'Partnerleihe')}
                            </span>
                            <span className="text-[9px] text-sky-200/80 mt-1">
                              {isLoaned
                                ? t('On Loan This Season', 'Diese Saison verliehen')
                                : (p.loansServed || 0) >= 2 
                                ? t('Must promote or release', 'Übernahme oder Ablöse')
                                : `+1 OVR & +14% Click (${p.loansServed || 0}/2)`}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isLoaned}
                            onClick={() => onGraduateYouth(p.id, 'compensation')}
                            className={`p-2 rounded-xl text-left transition flex flex-col justify-between ${
                              isLoaned
                                ? 'bg-zinc-800/40 border border-white/[0.05] text-zinc-500 cursor-not-allowed opacity-60'
                                : 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white cursor-pointer'
                            }`}
                            title={
                              isLoaned
                                ? t('Locked while prospect is out on farm loan this season', 'Gesperrt während der laufenden Saisonleihe')
                                : undefined
                            }
                          >
                            <span className="text-[11px] font-bold flex items-center gap-1">
                              <i className={`fa-solid ${isLoaned ? 'fa-lock' : 'fa-sack-dollar'} text-[10px]`}></i>
                              {t('Release Fee', 'Entschädigung')}
                            </span>
                            <span className="text-[9px] text-amber-200/90 font-mono mt-1">
                              {isLoaned ? t('Locked (On Loan)', 'Gesperrt (Leihe)') : `+${formatMoney(compFee)} Cash`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {!isReady && !isLoaned && (
                      <div className="pt-2 border-t border-white/[0.05] flex flex-col gap-2">
                        {!p.isProtected && p.boost >= 3 && academyLvl < 5 && onProtectYouth && (
                          <>
                            {academyLvl < 2 ? (
                              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wide text-center flex items-center justify-center gap-1.5">
                                <i className="fas fa-lock text-[9px]"></i>
                                <span>{t('Requires Academy Lvl 2 (Poach Shield) to Protect', 'Akademie Lvl 2 (Abwerbe-Schutz) benötigt zum Schützen')}</span>
                              </div>
                            ) : protectConfirmId === p.id ? (
                              <div className="bg-sky-500/10 border border-sky-400/20 rounded-xl p-3">
                                <div className="text-sky-200 text-xs font-normal mb-2 text-center">
                                  {t('Protecting this player gives you a', 'Dieses Talent zu schützen gibt dir eine')} 
                                  <strong className="text-emerald-400 mx-1 font-bold">{protectionKeepChance}%</strong> 
                                  {t('chance of fending off poachers.', 'Erfolgschance gegen abwerbende Spitzenklubs.')}
                                  {tier >= 3 && (
                                    <span className="block text-[10px] text-amber-300 mt-1">
                                      {t(`(Tier ${tier} penalty applied: -${tierPoachVulnerability}% protection resistance vs Tier 1 giants)`, `(Liga-${tier}-Abzug: -${tierPoachVulnerability}% Schutz gegen Erstligisten)`)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProtectConfirmId(null);
                                    }}
                                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                                  >
                                    {t('Cancel', 'Abbrechen')}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onProtectYouth(p.id);
                                      setProtectConfirmId(null);
                                    }}
                                    disabled={state.budget - protectionCost < -creditLimit}
                                    className="flex-1 bg-sky-500 hover:bg-sky-400 text-white py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                  >
                                    {t('Confirm', 'Bestätigen')} (-{formatMoney(protectionCost)})
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {!p.isProtected && p.boost >= 3 && academyLvl >= 2 && academyLvl < 5 && onProtectYouth && protectConfirmId !== p.id ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProtectConfirmId(p.id);
                              }}
                              className="bg-white/[0.03] hover:bg-white/[0.06] text-sky-300 hover:text-white border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <i className="fas fa-shield-halved text-[10px] text-sky-400"></i>
                              <span>{t('Protect Prospect', 'Talent Schützen')}</span>
                            </button>
                          ) : <div />}

                          {onGraduateYouth && (
                            <button
                              type="button"
                              disabled={isCallUpCapped || isSquadFull}
                              onClick={() => onGraduateYouth(p.id, 'promote')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                                isCallUpCapped || isSquadFull
                                  ? 'bg-zinc-800/40 border-white/[0.05] text-zinc-500 cursor-not-allowed opacity-60'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border-emerald-500/25 cursor-pointer'
                              }`}
                              title={
                                isSquadFull
                                  ? t('Senior squad is at maximum capacity (50/50 players)', 'Profikader voll (50/50 Spieler)')
                                  : isCallUpCapped
                                  ? `Seasonal call-up cap reached (${callUpsUsed}/${callUpCap})`
                                  : t(`Promote early to First Team (-1 OVR & -15% Senior Click penalty; ${clickChancePct}% Click Rate)`, `Vorzeitig in den Profikader berufen (-1 GES & -15% Integrations-Abzug; ${clickChancePct}% Klick-Rate)`)
                              }
                            >
                              <i className="fa-solid fa-arrow-up-from-bracket text-[10px]"></i>
                              <span>
                                {isSquadFull
                                  ? t('Squad Full', 'Kader voll')
                                  : isCallUpCapped
                                  ? `${t('Call-Up Cap', 'Berufungs-Limit')} (${callUpsUsed}/${callUpCap})`
                                  : `${t('Call Up Early', 'Früh berufen')} (+${effectiveEarlyBoost} ${t('Net OVR', 'Netto-GES')} · ${clickChancePct}% Click)`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {!isReady && !isLoaned && p.boost >= 3 && academyLvl >= 5 && (
                      <div className="self-start mt-0.5 text-emerald-400 flex items-center gap-1.5 text-xs font-medium">
                        <i className="fas fa-shield-halved text-[10px]"></i>
                        <span>{t('La Masia Complex: 100% Automatic Poach Immunity', 'La-Masia-Komplex: 100% Automatischer Abwerbe-Schutz')}</span>
                      </div>
                    )}
                    {p.isProtected && academyLvl < 5 && (
                      <div className="self-start mt-0.5 text-sky-400 flex items-center gap-1.5 text-xs font-medium">
                        <i className="fas fa-shield-halved text-[10px]"></i>
                        <span>{t('Protected from poachers', 'Vor Abwerbung geschützt')} ({protectionKeepChance}% {t('resistance', 'Erfolgswahrscheinlichkeit')})</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.02] flex flex-col gap-2.5 shrink-0 relative z-10">
          {/* Youth Championship Sub-Modal Trigger */}
          <div className="w-full">
            {isTournamentPlayed ? (
              <div className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-xl ${state.lastYouthChampionshipResult?.won ? 'bg-amber-500/20 text-amber-400 border-amber-400/30' : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'} border flex items-center justify-center text-xs shrink-0`}>
                    <i className={state.lastYouthChampionshipResult?.won ? "fa-solid fa-trophy" : "fa-solid fa-flag-checkered"}></i>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-zinc-200">
                      {t('National U19 Championship', 'Nationale U19 Meisterschaft')}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {state.lastYouthChampionshipResult?.won 
                        ? (isDe ? '🏆 U19-Meister dieser Saison' : '🏆 Season Champions') 
                        : (isDe ? 'Teilnahme diese Saison beendet' : 'Completed for this season')}
                      <span className="text-zinc-500"> · {isDe ? `Wieder in Saison ${state.year + 1} (Vorbereitung)` : `Returns in Season ${state.year + 1} Pre-Season`}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.08] shrink-0">
                  1/1 {isDe ? 'Saison' : 'Season'}
                </span>
              </div>
            ) : !isPreSeason ? (
              <div className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-zinc-400 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-500 text-xs shrink-0">
                    <i className="fa-solid fa-calendar-xmark"></i>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-zinc-300">
                      {t('National U19 Championship', 'Nationale U19 Meisterschaft')}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {isDe 
                        ? `Nur während der Saisonvorbereitung spielbar · Nächstes Turnier in Saison ${state.year + 1}` 
                        : `Playable during pre-season preparation only · Returns in Season ${state.year + 1} prep`}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-500 border border-white/[0.06] shrink-0">
                  {isDe ? 'Saisonvorbereitung' : 'Pre-Season Only'}
                </span>
              </div>
            ) : hasLevel1Cohort ? (
              <button
                type="button"
                onClick={() => {
                  if (onOpenChampionship) {
                    onOpenChampionship();
                  } else {
                    setShowTournamentSubModal(true);
                  }
                }}
                className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-yellow-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 text-amber-200 border border-amber-400/30 active:scale-[0.98] shadow-sm transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 text-xs shrink-0">
                    <i className="fas fa-trophy"></i>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-amber-300 tracking-wide uppercase">
                      {t('Simulate National Youth Championship', 'Nationale U19 Meisterschaft simulieren')}
                    </div>
                    <div className="text-[11px] text-amber-200/70 font-normal">
                      {t(`Level ${academyLvl} Academy: +${facilityBonus} OVR title advantage`, `Stufe ${academyLvl} Akademie: +${facilityBonus} GES Titel-Vorteil`)}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                  {t('Open', 'Öffnen')} →
                </span>
              </button>
            ) : (
              <div className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-zinc-400 text-xs">
                <div className="flex items-center gap-2">
                  <i className="fas fa-lock text-zinc-500 text-xs"></i>
                  <span>{t('National U19 Championship', 'Nationale U19 Meisterschaft')}</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  {t(`Requires at least 1 Academy Prospect (${pipeline.length}/${maxCapacity})`, `Erfordert mind. 1 Akademie-Talent (${pipeline.length}/${maxCapacity})`)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRecruitYouth}
              disabled={isFull || isScoutCapped || !canAfford}
              className={`flex-1 py-3.5 px-5 rounded-2xl flex items-center justify-between font-semibold text-xs tracking-wide transition shadow-sm ${
                isFull || isScoutCapped || !canAfford
                  ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-400 text-white cursor-pointer active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-2">
                <i className="fas fa-search text-xs"></i>
                <span>
                  {isFull
                    ? t('Academy Full', 'Akademie voll')
                    : isScoutCapped
                    ? t(`Scout Cap Reached (${scoutsUsed}/${scoutCap} Lvl ${academyLvl})`, `Scout-Limit erreicht (${scoutsUsed}/${scoutCap} Lvl ${academyLvl})`)
                    : t(`Scout New Talent (${scoutsUsed}/${scoutCap})`, `Talent scouten (${scoutsUsed}/${scoutCap})`)}
                </span>
              </div>
              {!isFull && !isScoutCapped && (
                <span className="font-mono text-xs text-sky-100">
                  -{formatMoney(actionCost)}
                </span>
              )}
            </button>

            <button
              aria-label="Close modal"
              onClick={onClose}
              className="py-3.5 px-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-semibold text-xs transition border border-white/[0.08] cursor-pointer"
            >
              {t('Close', 'Schliessen')}
            </button>
          </div>
        </div>

        {/* Embedded Youth Championship Sub-Modal */}
        {showTournamentSubModal && (
          <YouthChampionshipModal
            state={state}
            lang={lang}
            clubsDb={clubsDb}
            isModActive={isModActive}
            onClose={(_won) => {
              setShowTournamentSubModal(false);
            }}
            onTournamentVictory={(prize, boost) => {
              if (onTournamentVictory) {
                onTournamentVictory(prize, boost);
              }
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
