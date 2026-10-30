import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { GameState, Language } from '../types';
import { getLeagueInfo, calculateClubFinancials, formatMoney } from '../data/gameConstants';
import { t as tr } from '../data/translations';

interface SquadRegistrationModalProps {
  gameState: GameState;
  onClose: () => void;
  lang?: Language | string;
  isModActive?: boolean;
}

export const SquadRegistrationModal: React.FC<SquadRegistrationModalProps> = ({
  gameState,
  onClose,
  lang = 'en',
}) => {
  const currentLang = (lang === 'de' ? 'de' : 'en') as Language;
  const t = (en: string, de?: string) => tr(currentLang, en, de);

  const tier = gameState.club?.tier || 1;
  const country = gameState.club?.country || 'GER';
  const league = useMemo(() => getLeagueInfo(tier, country), [tier, country]);
  const financials = useMemo(() => calculateClubFinancials(gameState), [gameState]);

  const squadSize = gameState.club?.squadSize || 24;
  const baseOvr = gameState.club?.baseOvr ?? 70;
  const morale = gameState.club?.morale ?? 70;
  const pureWages = financials.pureWages ?? financials.wages ?? 0;

  // Roster bounds and governance rules
  const rules = { maxSquadSize: 50, minSquadSize: 18 };

  // League average OVR calculation
  const leagueAvgOvr = league.avgOvr || (tier === 1 ? 80 : tier === 2 ? 69 : tier === 3 ? 62 : tier === 4 ? 54 : 45);
  const ovrDiff = baseOvr - leagueAvgOvr;

  // Card 1: Compliance calculations
  const isUnderMin = squadSize < rules.minSquadSize;
  const isOverMax = squadSize > rules.maxSquadSize;
  const isCompliant = !isUnderMin && !isOverMax;

  // Progress percentage for squad size bar (capped at 50)
  const squadProgressPct = Math.min(100, Math.max(0, (squadSize / rules.maxSquadSize) * 100));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#12141c]/95 border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden my-auto cursor-default flex flex-col relative"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step 1: Sleek Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 text-base shrink-0">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                <span>{t('Division Governance', 'Verbandsstatuten')}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">{league.name}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight mt-0.5">
                {t('Squad Health & Roster Compliance', 'Kader-Gesundheit & Statuten-Bericht')}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                {t('Official division governance and squad performance metrics.', 'Offizielle Ligavorgaben und Kader-Leistungsindikatoren.')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Step 2: Vertically Stacked Actionable Cards */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            {/* Card 1: Roster Compliance */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              !isCompliant
                ? 'bg-rose-500/[0.04] border-rose-500/30'
                : 'bg-white/[0.03] border-white/[0.06]'
            }`}>
              {/* Top Row: Flex Between */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                    !isCompliant ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <i className={`fa-solid ${!isCompliant ? 'fa-triangle-exclamation' : 'fa-users'}`}></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {t('Roster Compliance', 'Kader-Zulassung')}
                    </h3>
                    <span className="block text-[11px] text-zinc-400">
                      {t('Minimum Required: 18 · Hard Cap: 50', 'Erforderlich Mindestens: 18 · Obergrenze: 50')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className={`text-2xl font-bold tabular-nums ${!isCompliant ? 'text-rose-400' : 'text-white'}`}>
                      {squadSize}
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold ml-1">/ 50</span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isUnderMin && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse" data-status={'Non-Compliant'}>
                        <i className="fa-solid fa-circle-exclamation text-[9px]"></i>
                        {t('NON-COMPLIANT (Minimum 18 Required)', 'NICHT ZUGELASSEN (Mind. 18 erforderlich)')}
                      </span>
                    )}
                    {isOverMax && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse" data-status={'Non-Compliant'}>
                        <i className="fa-solid fa-circle-exclamation text-[9px]"></i>
                        {t('OVER LIMIT (Max 50)', 'LIMIT ÜBERSCHRITTEN (Max. 50)')}
                      </span>
                    )}
                    {isCompliant && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <i className="fa-solid fa-check text-[9px]"></i>
                        {t('COMPLIANT', 'ZUGELASSEN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar (Kept only for Card 1) */}
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5 mt-3.5">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    !isCompliant ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${squadProgressPct}%` }}
                />
              </div>

              {/* Bottom Row: Description */}
              <div className="border-t border-white/[0.04] pt-3 mt-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isUnderMin
                    ? t('Your squad is below the mandatory roster floor of 18 players. Sign senior or academy players to avoid match penalties.', 'Der Kader unterschreitet die Pflichtgrenze von 18 Spielern. Verpflichte Spieler, um Strafen zu vermeiden.')
                    : isOverMax
                    ? t('Your squad exceeds the absolute maximum roster ceiling of 50 players. Offload surplus contracts.', 'Der Kader überschreitet das Verbandslimit von 50 Spielern. Verkaufe Spieler zur Freigabe.')
                    : t('Your squad fulfills all division registration and competition governance regulations.', 'Der Kader erfüllt alle offiziellen Verbands- und Spielbetriebsvorgaben der Liga.')}
                </p>
              </div>
            </div>

            {/* Card 2: Squad Quality (OVR) */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
              {/* Top Row: Flex Between */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-sm shrink-0">
                    <i className="fa-solid fa-chart-line"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {t('Squad Quality', 'Kaderstärke')}
                    </h3>
                    <span className="block text-[11px] text-zinc-400">
                      {t('League Average:', 'Liga-Schnitt:')} <span className="font-semibold text-zinc-300">{leagueAvgOvr} OVR</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white tabular-nums">
                      {baseOvr}
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold ml-1">OVR</span>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border ${
                    ovrDiff >= 0
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {ovrDiff >= 0 ? `+${ovrDiff}` : ovrDiff} OVR
                  </span>
                </div>
              </div>

              {/* Bottom Row: Description */}
              <div className="border-t border-white/[0.04] pt-3 mt-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {ovrDiff >= 3
                    ? t(`Your squad is +${ovrDiff} OVR above the league average. You are genuine title contenders.`, `Dein Kader liegt +${ovrDiff} GES über dem Liga-Schnitt. Ihr seid echte Meisterschaftskandidaten.`)
                    : ovrDiff >= 0
                    ? t(`Your squad is competitive (+${ovrDiff} OVR vs average). Solid foundation for mid-to-upper table.`, `Dein Kader ist absolut konkurrenzfähig (+${ovrDiff} GES). Solide Basis für die obere Tabellenhälfte.`)
                    : ovrDiff >= -2
                    ? t(`Your squad is slightly behind (${ovrDiff} OVR). Every match will require disciplined execution.`, `Dein Kader liegt knapp zurück (${ovrDiff} GES). Jeder Spieltag erfordert maximale Konzentration.`)
                    : t(`Your squad is ${ovrDiff} OVR below the average. Relegation risk is high without reinforcements.`, `Dein Kader liegt ${ovrDiff} GES unter dem Liga-Schnitt. Hohes Abstiegsrisiko ohne Verstärkungen.`)}
                </p>
              </div>
            </div>

            {/* Card 3: Dressing Room Morale */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
              {/* Top Row: Flex Between */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0">
                    <i className="fa-solid fa-heart-pulse"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {t('Dressing Room Morale', 'Team-Moral')}
                    </h3>
                    <span className="block text-[11px] text-zinc-400">
                      {t('Atmosphere & Locker Room Cohesion', 'Atmosphäre & Kabinengefüge')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white tabular-nums">
                      {morale}
                    </span>
                    <span className="text-xs text-zinc-500 font-semibold ml-1">/ 100</span>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border ${
                    morale >= 70
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : morale >= 40
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {morale >= 80 ? t('Electric', 'Hervorragend') : morale >= 50 ? t('Stable', 'Stabil') : t('Fragile', 'Kritisch')}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Description */}
              <div className="border-t border-white/[0.04] pt-3 mt-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {morale >= 80
                    ? t('>80%: High resilience in crunch matches and critical moments.', '>80%: Hohe Resilienz und Kampfkraft in engen Spitzenspielen.')
                    : morale >= 50
                    ? t('50-79%: Stable locker room. Morale fluctuates with results.', '50-79%: Stabiles Umfeld. Moral reagiert normal auf Resultate.')
                    : morale >= 30
                    ? t('30-49%: Strained locker room atmosphere. Underperforming under pressure.', '30-49%: Angespannte Stimmung. Druckresistenz ist vermindert.')
                    : t('<30%: Toxic dressing room, players may force exits and drop form.', '<30%: Toxische Kabine. Spieler könnten Abwanderung erzwingen.')}
                </p>
              </div>
            </div>

            {/* Card 4: Wage Efficiency */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
              {/* Top Row: Flex Between */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm shrink-0">
                    <i className="fa-solid fa-coins"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {t('Wage Efficiency', 'Gehaltseffizienz')}
                    </h3>
                    <span className="block text-[11px] text-zinc-400">
                      {t('Payroll & Squad Overhead', 'Gehaltsetat & Kaderkosten')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white tabular-nums">
                      {formatMoney(pureWages, country)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {t('Payroll', 'Gehaltsetat')}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Description */}
              <div className="border-t border-white/[0.04] pt-3 mt-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t(
                    'If squad size exceeds 25, excess fringe players will automatically depart at season\'s end to reduce bloat.',
                    'Bei mehr als 25 Spielern verlassen überzählige Reservisten den Klub am Saisonende automatisch zur Entlastung.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <i className="fa-solid fa-shield-halved text-emerald-400 text-xs"></i>
            {t('Validated automatically during season simulation', 'Wird während der Saisonsimulation automatisch geprüft')}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-sm transition-all cursor-pointer"
          >
            {t('Close', 'Schließen')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
