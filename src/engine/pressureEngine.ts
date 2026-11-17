import {
  Language,
  PressureChoice,
  PressureContext,
  PressureMoment,
} from '../types';

export interface PressureTierInfo {
  id: 'calm' | 'watchlist' | 'storm' | 'siege' | 'crisis';
  label: string;
  labelDe: string;
  tone: 'emerald' | 'sky' | 'amber' | 'orange' | 'rose';
  description: string;
  descriptionDe: string;
}

export interface MidSeasonStandingEstimate {
  midSeasonPos: number;
  numTeams: number;
  targetPos: number;
  shortfall: number; // positive means worse than target (e.g. pos 9 - target 1 = +8)
  isTitleContender: boolean;
  isRelegationThreat: boolean;
  firstHalfWins?: number;
  firstHalfDraws?: number;
  firstHalfLosses?: number;
  firstHalfPts?: number;
}

export interface MidSeasonPressureInput {
  clubId?: string | number;
  clubName: string;
  country?: string;
  year: number;
  tier: number;
  maxTier: number;
  numTeams: number;
  baseOvr: number;
  leagueAvgOvr: number;
  morale: number;
  targetPos: number;
  boardExpectsSuccess: boolean;
  trophyDrought?: number;
  consecutiveTitles?: number;
  tenureYears?: number;
  isReserve?: boolean;
  currentMediaPressure?: number;
  currentCoachHeat?: number;
  currentGmHeat?: number;
  pendingSeasonState?: any;
  midSeasonPosOverride?: number;
}

export interface MidSeasonPressureEvaluation {
  mediaPressure: number;
  coachHeat: number;
  gmHeat: number;
  delta: number;
  context: PressureContext;
  headline: string;
  headlineDe: string;
  summary: string;
  summaryDe: string;
  shouldTriggerMoment: boolean;
  tierInfo: PressureTierInfo;
  standing: MidSeasonStandingEstimate;
}

export interface PostSeasonPressureInput {
  clubName: string;
  country?: string;
  year: number;
  playedTier: number;
  maxTier: number;
  numTeams: number;
  finalPos: number;
  targetPos: number;
  boardExpectsSuccess: boolean;
  isGiant: boolean;
  wonLeague: boolean;
  wonAnyTrophy: boolean;
  relegated: boolean;
  promoted: boolean;
  survived?: boolean;
  trophyDrought?: number;
  tenureYears?: number;
  isReserve?: boolean;
  currentMediaPressure?: number;
  currentCoachHeat?: number;
  currentGmHeat?: number;
  consecutivePressureSeasons?: number;
}

export interface PostSeasonPressureEvaluation {
  mediaPressure: number;
  coachHeat: number;
  gmHeat: number;
  delta: number;
  context: PressureContext;
  headline: string;
  headlineDe: string;
  summary: string;
  summaryDe: string;
  consecutivePressureSeasons: number;
  impactDelta: number;
  moraleDelta: number;
  repDelta: number;
  issueBoardWarning: boolean;
  issueBoardUltimatum: boolean;
  shouldTriggerMoment: boolean;
  tierInfo: PressureTierInfo;
}

export interface GeneratePressureMomentInput {
  clubName: string;
  country?: string;
  year: number;
  tier: number;
  phase: 'midseason' | 'postseason' | 'briefing';
  context: PressureContext;
  mediaPressure: number;
  coachHeat: number;
  gmHeat: number;
  targetPos: number;
  currentPos: number;
  numTeams: number;
  coachName?: string;
  gmName?: string;
  tactic?: string;
  relegated?: boolean;
  trophyDrought?: number;
}

export interface PressureResolutionOutcome {
  mediaPressure: number;
  coachHeat: number;
  gmHeat: number;
  morale: number;
  reputation: number;
  clubImpactScore: number;
  secondHalfMod: {
    year: number;
    moraleDelta: number;
    ovrEffect: number;
    stanceLabel: string;
  };
  resolvedMoment: PressureMoment;
  toastType: 'info' | 'warning' | 'error' | 'success';
  toastMessage: string;
}

export const clampMetric = (val: number, min: number = 0, max: number = 100): number =>
  Math.max(min, Math.min(max, Math.round(val)));

export function getPressureTier(pressure: number): PressureTierInfo {
  const p = clampMetric(pressure, 0, 100);
  if (p >= 85) {
    return {
      id: 'crisis',
      label: 'Crisis Point',
      labelDe: 'Krisenpunkt',
      tone: 'rose',
      description: 'Relentless back-page scrutiny. Coach and Sporting Director face urgent board accountability.',
      descriptionDe: 'Gnadenloser Mediendruck. Trainer und Sportdirektor stehen vor dem Vorstand unter Druck.',
    };
  }
  if (p >= 70) {
    return {
      id: 'siege',
      label: 'Under Siege',
      labelDe: 'Unter Beschuss',
      tone: 'orange',
      description: 'National press is dissecting tactics and recruitment after sharp sporting underperformance.',
      descriptionDe: 'Die Fachpresse zerlegt Taktik und Kaderplanung nach deutlichem Leistungsabfall.',
    };
  }
  if (p >= 50) {
    return {
      id: 'storm',
      label: 'Media Storm',
      labelDe: 'Mediensturm',
      tone: 'amber',
      description: 'Mounting headlines questioning leadership decisions as results lag behind club expectations.',
      descriptionDe: 'Wachsende Schlagzeilen stellen die sportliche Leitung infrage.',
    };
  }
  if (p >= 25) {
    return {
      id: 'watchlist',
      label: 'Watchlist',
      labelDe: 'Unter Beobachtung',
      tone: 'sky',
      description: 'Pundits are watching closely for consistency across key league fixtures.',
      descriptionDe: 'Experten beobachten die Konstanz in der Liga sehr genau.',
    };
  }
  return {
    id: 'calm',
    label: 'Composed',
    labelDe: 'Ruhiges Umfeld',
    tone: 'emerald',
    description: 'Constructive press coverage with unified confidence behind Coach and Sporting Director.',
    descriptionDe: 'Sachliche Berichterstattung und geschlossenes Vertrauen in Trainer und Sportdirektor.',
  };
}

export function estimateMidSeasonStanding(params: {
  clubId?: string | number;
  year: number;
  numTeams: number;
  baseOvr: number;
  leagueAvgOvr: number;
  morale: number;
  targetPos: number;
  boardExpectsSuccess: boolean;
  tier: number;
  maxTier: number;
  pendingSeasonState?: any;
  midSeasonPosOverride?: number;
}): MidSeasonStandingEstimate {
  const numTeams = Math.max(4, params.numTeams || 18);
  const targetPos = Math.max(1, Math.min(numTeams, params.targetPos || Math.floor(numTeams / 2)));

  let midSeasonPos: number;
  let firstHalfWins: number | undefined;
  let firstHalfDraws: number | undefined;
  let firstHalfLosses: number | undefined;
  let firstHalfPts: number | undefined;

  const firstHalfOutcomes: Array<'W' | 'D' | 'L'> | undefined =
    params.pendingSeasonState?._meta?.firstHalfOutcomes;

  if (typeof params.midSeasonPosOverride === 'number' && !Number.isNaN(params.midSeasonPosOverride)) {
    midSeasonPos = Math.max(1, Math.min(numTeams, Math.round(params.midSeasonPosOverride)));
  } else if (Array.isArray(firstHalfOutcomes) && firstHalfOutcomes.length > 0) {
    firstHalfWins = firstHalfOutcomes.filter(o => o === 'W').length;
    firstHalfDraws = firstHalfOutcomes.filter(o => o === 'D').length;
    firstHalfLosses = firstHalfOutcomes.filter(o => o === 'L').length;
    firstHalfPts = firstHalfWins * 2 + firstHalfDraws;

    const halfMatches = firstHalfOutcomes.length;
    const expectedSeasonPos = typeof params.pendingSeasonState?.pos === 'number'
      ? params.pendingSeasonState.pos
      : Math.round((1 - (firstHalfPts / Math.max(1, halfMatches * 2))) * (numTeams - 1) + 1);
    const paceFraction = firstHalfPts / Math.max(1, halfMatches * 2);
    const pacePos = Math.max(1, Math.min(numTeams, Math.round(1 + (1 - paceFraction) * (numTeams - 1))));
    midSeasonPos = Math.max(1, Math.min(numTeams, Math.round((expectedSeasonPos * 0.6) + (pacePos * 0.4))));
  } else {
    let ovrDiff = params.baseOvr - params.leagueAvgOvr;
    const morale = params.morale ?? 100;
    if (morale <= 30) ovrDiff -= 3;
    else if (morale <= 50) ovrDiff -= 1;
    else if (morale >= 90) ovrDiff += 1;

    const diffMultiplier = (numTeams / 18) * 1.2;
    const seed = ((params.year || 2026) * 131 + Number(params.clubId || 1) * 37) % 997;
    const deterministicOffset = ((seed / 997) * 2) - 1;
    const rawPos = (numTeams / 2 + 0.5) - (ovrDiff * diffMultiplier) + deterministicOffset;
    midSeasonPos = Math.max(1, Math.min(numTeams, Math.round(rawPos)));
  }

  const shortfall = midSeasonPos - targetPos;
  const isTitleContender =
    targetPos <= 3 || params.boardExpectsSuccess || params.baseOvr >= params.leagueAvgOvr + 5;
  const isRelegationThreat =
    midSeasonPos >= Math.max(2, numTeams - 2) &&
    (params.tier < params.maxTier || midSeasonPos >= numTeams - 1);

  return {
    midSeasonPos,
    numTeams,
    targetPos,
    shortfall,
    isTitleContender,
    isRelegationThreat,
    firstHalfWins,
    firstHalfDraws,
    firstHalfLosses,
    firstHalfPts,
  };
}

export function evaluateMidSeasonPressure(
  input: MidSeasonPressureInput
): MidSeasonPressureEvaluation {
  const standing = estimateMidSeasonStanding({
    clubId: input.clubId,
    year: input.year,
    numTeams: input.numTeams,
    baseOvr: input.baseOvr,
    leagueAvgOvr: input.leagueAvgOvr,
    morale: input.morale,
    targetPos: input.targetPos,
    boardExpectsSuccess: input.boardExpectsSuccess,
    tier: input.tier,
    maxTier: input.maxTier,
    pendingSeasonState: input.pendingSeasonState,
    midSeasonPosOverride: input.midSeasonPosOverride,
  });

  const basePressure = clampMetric(input.currentMediaPressure ?? 15, 0, 100);
  const baseCoachHeat = clampMetric(input.currentCoachHeat ?? 15, 0, 100);
  const baseGmHeat = clampMetric(input.currentGmHeat ?? 15, 0, 100);

  const { midSeasonPos, numTeams, targetPos, shortfall, isTitleContender, isRelegationThreat } = standing;
  const drought = input.trophyDrought ?? 0;

  let context: PressureContext = 'steady';
  let delta = 0;
  let coachDelta = 0;
  let gmDelta = 0;
  let shouldTriggerMoment = false;
  let headline = `${input.clubName} Holds Steady at Winter Break (#${midSeasonPos})`;
  let headlineDe = `${input.clubName} bleibt zur Winterpause auf Kurs (Platz ${midSeasonPos})`;
  let summary = `Sitting #${midSeasonPos} against a Top-${targetPos} mandate keeps dressing room and press temperature measured.`;
  let summaryDe = `Platz ${midSeasonPos} bei Saisonziel Top ${targetPos} sorgt für ein ruhiges Umfeld.`;

  if (input.isReserve) {
    const nextPressure = clampMetric(Math.min(35, Math.max(5, basePressure - 8)));
    return {
      mediaPressure: nextPressure,
      coachHeat: clampMetric(baseCoachHeat - 6),
      gmHeat: clampMetric(baseGmHeat - 6),
      delta: nextPressure - basePressure,
      context: 'steady',
      headline,
      headlineDe,
      summary: 'Reserve squad development focus shields the senior sporting leadership from major press storms.',
      summaryDe: 'Als Zweitmannschaft liegt der Fokus auf Talentförderung abseits des großen Medienrummels.',
      shouldTriggerMoment: false,
      tierInfo: getPressureTier(nextPressure),
      standing,
    };
  }

  // 1. Acute Championship / Title Contender Collapse
  if (isTitleContender && shortfall >= 4) {
    context = 'championship_collapse';
    const severityBoost = Math.min(20, (shortfall - 4) * 4);
    delta = 28 + severityBoost + (drought >= 3 ? 6 : 0);
    coachDelta = 30 + severityBoost;
    gmDelta = 24 + Math.round(severityBoost * 0.85);
    shouldTriggerMoment = true;
    headline = `TITLE COLLAPSE SCRUTINY: ${input.clubName} Languishing #${midSeasonPos} Despite Championship Mandate`;
    headlineDe = `MEISTERSCHAFTS-KRISE: ${input.clubName} stürzt trotz Titelanspruch auf Platz ${midSeasonPos} ab`;
    summary = `Targeting Top ${targetPos} yet stuck at #${midSeasonPos} of ${numTeams} has ignited fierce press questioning of both Coach tactics and GM squad building.`;
    summaryDe = `Anspruch Top ${targetPos}, Realität Platz ${midSeasonPos} von ${numTeams}: Medien nehmen Trainer-Taktik und GM-Kaderplanung ins Kreuzverhör.`;
  }
  // 2. Relegation Spiral / Drop-Zone Crisis
  else if (isRelegationThreat && (shortfall >= 2 || midSeasonPos >= numTeams - 1)) {
    context = 'relegation_spiral';
    const dangerBoost = midSeasonPos >= numTeams - 1 ? 14 : 6;
    delta = 26 + dangerBoost + Math.min(10, Math.max(0, shortfall) * 2);
    coachDelta = 28 + dangerBoost;
    gmDelta = 25 + Math.round(dangerBoost * 0.8);
    shouldTriggerMoment = true;
    headline = `RELEGATION ALARM: ${input.clubName} Trapped in Drop Zone (#${midSeasonPos}) as Pressure Boils Over`;
    headlineDe = `ABSTIEGSALARM: ${input.clubName} steckt auf Platz ${midSeasonPos} fest – Druck auf Trainer & GM wächst`;
    summary = `Sitting #${midSeasonPos} in ${numTeams}-team league battle leaves zero margin for error; press demands answers on survival plan.`;
    summaryDe = `Platz ${midSeasonPos} in der ${numTeams}er-Liga lässt keinen Spielraum – die Presse fordert einen sofortigen Rettungsplan.`;
  }
  // 3. Title Contender Off the Pace (Moderate shortfall 2–3 places)
  else if (isTitleContender && shortfall >= 2) {
    context = 'title_expectations';
    delta = 14 + shortfall * 2;
    coachDelta = 15 + shortfall * 2;
    gmDelta = 12 + shortfall;
    shouldTriggerMoment = basePressure + delta >= 55;
    headline = `EXPECTATION CHECK: Title Hopes Slipping for #${midSeasonPos} ${input.clubName}`;
    headlineDe = `TITELDRUCK STEIGT: ${input.clubName} hinkt als ${midSeasonPos}. den eigenen Ansprüchen hinterher`;
    summary = `Falling ${shortfall} spots short of Top ${targetPos} pace draws pointed commentary from league pundits.`;
    summaryDe = `${shortfall} Plätze hinter dem Top-${targetPos}-Ziel wecken erste Zweifel bei Experten und Fans.`;
  }
  // 4. Lower-half / Mid-table drift into Relegation Dogfight
  else if ((shortfall >= 3 && midSeasonPos >= Math.round(numTeams * 0.65)) || isRelegationThreat) {
    context = 'relegation_dogfight';
    delta = 16 + Math.min(12, Math.max(0, shortfall) * 2);
    coachDelta = 18;
    gmDelta = 14;
    shouldTriggerMoment = basePressure + delta >= 55 || shortfall >= 5;
    headline = `SURVIVAL PRESSURE: ${input.clubName} Dragged Into Relegation Scrap (#${midSeasonPos})`;
    headlineDe = `ABSTIEGSKAMPF: ${input.clubName} rutscht auf Platz ${midSeasonPos} ab`;
    summary = `Sliding to #${midSeasonPos} against a Top-${targetPos} brief puts both bench and front office under scrutiny.`;
    summaryDe = `Der Abrutsch auf Platz ${midSeasonPos} (Ziel Top ${targetPos}) setzt Trainerbank und Sportliche Leitung unter Druck.`;
  }
  // 5. Trophy Drought Scrutiny in Tier 1 even when close
  else if (input.tier === 1 && drought >= 4 && shortfall >= 1) {
    context = 'drought_scrutiny';
    delta = 12;
    coachDelta = 10;
    gmDelta = 14;
    shouldTriggerMoment = basePressure + delta >= 60;
    headline = `${drought}-YEAR DROUGHT: Impatient Fanbase & Press Questioning Direction`;
    headlineDe = `${drought} JAHRE OHNE TITEL: Ungeduld bei Fans und Presse wächst`;
    summary = `Supporters and columnists demand tangible progress toward ending a ${drought}-season wait for silverware.`;
    summaryDe = `Nach ${drought} Jahren ohne Titel fordern Umfeld und Kolumnisten sichtbare Fortschritte.`;
  }
  // 6. On Track / Ahead of Target -> Relief & De-escalation
  else if (shortfall <= 0) {
    const relief = shortfall <= -2 ? -18 : -11;
    delta = relief;
    coachDelta = relief - 2;
    gmDelta = relief;
    headline = shortfall <= -2
      ? `PRESS APPLAUSE: ${input.clubName} Surging Ahead of Schedule (#${midSeasonPos})`
      : `${input.clubName} Delivering on Mandate (#${midSeasonPos} at Break)`;
    headlineDe = shortfall <= -2
      ? `LOB DER FACHPRESSE: ${input.clubName} übertrifft Erwartungen (Platz ${midSeasonPos})`
      : `${input.clubName} erfüllt Vorgaben zur Winterpause (Platz ${midSeasonPos})`;
    summary = `Competitive position (#${midSeasonPos} vs Top-${targetPos} goal) cools earlier media noise.`;
    summaryDe = `Stabile Tabellenposition (#${midSeasonPos} vs. Ziel Top ${targetPos}) beruhigt die Schlagzeilen.`;
  } else {
    delta = 4;
    coachDelta = 4;
    gmDelta = 3;
  }

  const nextMedia = clampMetric(basePressure + delta, 5, 100);
  const nextCoach = clampMetric(baseCoachHeat + coachDelta, 5, 100);
  const nextGm = clampMetric(baseGmHeat + gmDelta, 5, 100);

  return {
    mediaPressure: nextMedia,
    coachHeat: nextCoach,
    gmHeat: nextGm,
    delta: nextMedia - basePressure,
    context,
    headline,
    headlineDe,
    summary,
    summaryDe,
    shouldTriggerMoment,
    tierInfo: getPressureTier(nextMedia),
    standing,
  };
}

export function evaluatePostSeasonPressure(
  input: PostSeasonPressureInput
): PostSeasonPressureEvaluation {
  const numTeams = Math.max(4, input.numTeams || 18);
  const targetPos = Math.max(1, Math.min(numTeams, input.targetPos || 8));
  const shortfall = input.finalPos - targetPos;
  const basePressure = clampMetric(input.currentMediaPressure ?? 15, 0, 100);
  const baseCoachHeat = clampMetric(input.currentCoachHeat ?? 15, 0, 100);
  const baseGmHeat = clampMetric(input.currentGmHeat ?? 15, 0, 100);
  const prevStreak = input.consecutivePressureSeasons ?? 0;

  let context: PressureContext = 'steady';
  let delta = 0;
  let coachDelta = 0;
  let gmDelta = 0;
  let impactDelta = 0;
  let moraleDelta = 0;
  let repDelta = 0;
  let consecutivePressureSeasons = prevStreak;
  let issueBoardWarning = false;
  let issueBoardUltimatum = false;
  let shouldTriggerMoment = false;
  let headline = `${input.clubName} Wraps Campaign in #${input.finalPos}`;
  let headlineDe = `${input.clubName} beendet Saison auf Platz ${input.finalPos}`;
  let summary = `Campaign concluded without acute media crisis.`;
  let summaryDe = `Die Saison endete ohne größere Medienstürme.`;

  if (input.isReserve) {
    const nextMedia = clampMetric(basePressure - 15, 5, 45);
    return {
      mediaPressure: nextMedia,
      coachHeat: clampMetric(baseCoachHeat - 12, 5, 45),
      gmHeat: clampMetric(baseGmHeat - 12, 5, 45),
      delta: nextMedia - basePressure,
      context: 'steady',
      headline,
      headlineDe,
      summary,
      summaryDe,
      consecutivePressureSeasons: 0,
      impactDelta: 0,
      moraleDelta: 0,
      repDelta: 0,
      issueBoardWarning: false,
      issueBoardUltimatum: false,
      shouldTriggerMoment: false,
      tierInfo: getPressureTier(nextMedia),
    };
  }

  // Case A: Championship / Top Ambition Collapse
  const chasedChampionship = targetPos <= 2 || input.boardExpectsSuccess || input.isGiant;
  if (chasedChampionship && !input.wonLeague && !input.wonAnyTrophy && shortfall >= 4) {
    context = 'championship_collapse';
    const severity = Math.min(18, (shortfall - 3) * 3);
    delta = 26 + severity + prevStreak * 6;
    coachDelta = 30 + severity;
    gmDelta = 24 + Math.round(severity * 0.85);
    consecutivePressureSeasons = prevStreak + 1;
    impactDelta = -(6 + Math.min(10, shortfall));
    moraleDelta = -8;
    repDelta = -3;
    issueBoardWarning = true;
    issueBoardUltimatum = consecutivePressureSeasons >= 2 || shortfall >= 7;
    shouldTriggerMoment = true;
    headline = `CHAMPIONSHIP POST-MORTEM: ${input.clubName} Finishes #${input.finalPos} After Pre-Season Title Push`;
    headlineDe = `TITEL-DEBAKEL: ${input.clubName} landet trotz Meisterziel nur auf Platz ${input.finalPos}`;
    summary = `Falling ${shortfall} places short of a Top-${targetPos} mandate triggers fierce criticism of Head Coach tactics and GM transfer strategy.`;
    summaryDe = `${shortfall} Plätze hinter dem Top-${targetPos}-Anspruch: Presse und Vorstand verlangen Rechenschaft von Trainer und GM.`;
  }
  // Case B: Relegation or Scraping Survival in Drop Zone
  else if (input.relegated || (input.finalPos >= Math.max(2, numTeams - 2) && input.playedTier < input.maxTier)) {
    context = input.relegated ? 'relegation_spiral' : 'relegation_dogfight';
    delta = input.relegated ? 34 : 20;
    coachDelta = input.relegated ? 36 : 22;
    gmDelta = input.relegated ? 30 : 18;
    consecutivePressureSeasons = prevStreak + 1;
    impactDelta = input.relegated ? -8 : -3;
    moraleDelta = input.relegated ? -10 : -4;
    repDelta = input.relegated ? -4 : -1;
    issueBoardWarning = true;
    issueBoardUltimatum = input.relegated || consecutivePressureSeasons >= 2;
    shouldTriggerMoment = true;
    headline = input.relegated
      ? `RELEGATION INQUEST: Media & Fans Demand Accountability After Drop`
      : `SURVIVAL SCARE: Late Escape Leaves Questions Over ${input.clubName} Direction`;
    headlineDe = input.relegated
      ? `ABSTIEGS-ANALYSE: Presse und Fans fordern Konsequenzen`
      : `MIT BLAUEM AUGE: Zittersaison wirft Fragen an Trainer & GM auf`;
    summary = input.relegated
      ? `Relegation after finishing #${input.finalPos} exposes fractures between front-office planning and court execution.`
      : `Finishing #${input.finalPos} in the survival scrap spared relegation, yet press scrutiny on Coach & GM stays intense.`;
    summaryDe = input.relegated
      ? `Der Abstieg auf Platz ${input.finalPos} legt schonungslos Defizite in Kaderplanung und Coaching offen.`
      : `Platz ${input.finalPos} sicherte knapp den Klassenerhalt, doch die Kritik an der Führungsetage bleibt laut.`;
  }
  // Case C: Significant Shortfall for non-title clubs (e.g. target 6th, finished 13th)
  else if (shortfall >= 4 && !input.wonAnyTrophy) {
    context = shortfall >= 6 || input.finalPos >= numTeams - 3 ? 'relegation_dogfight' : 'title_expectations';
    delta = 18 + Math.min(12, shortfall);
    coachDelta = 20 + Math.min(10, shortfall);
    gmDelta = 16 + Math.min(10, shortfall);
    consecutivePressureSeasons = prevStreak + 1;
    impactDelta = -4;
    moraleDelta = -5;
    repDelta = -2;
    issueBoardWarning = consecutivePressureSeasons >= 2;
    shouldTriggerMoment = basePressure + delta >= 65 || shortfall >= 6;
    headline = `UNDERACHIEVEMENT REVIEW: ${input.clubName} Slides to #${input.finalPos} (Target Top ${targetPos})`;
    headlineDe = `SAISONBILANZ UNTER SOLL: ${input.clubName} nur #${input.finalPos} statt Top ${targetPos}`;
    summary = `Finishing ${shortfall} places off target raises uncomfortable summer questions for both the GM's desk and coaching bench.`;
    summaryDe = `Ein Rückstand von ${shortfall} Plätzen auf das Saisonziel sorgt für hitzige Sommerdebatten.`;
  }
  // Case D: Delivered Title / Promotion / Met or Beat Target
  else if (input.wonLeague || input.promoted || input.wonAnyTrophy || shortfall <= 0) {
    const triumphClear = input.wonLeague || input.promoted;
    delta = triumphClear ? -38 : input.wonAnyTrophy ? -28 : -18;
    coachDelta = triumphClear ? -38 : -22;
    gmDelta = triumphClear ? -36 : -20;
    consecutivePressureSeasons = 0;
    context = 'steady';
    headline = triumphClear
      ? `SILENCE THE CRITICS: ${input.clubName} Vindicates Leadership With Triumph`
      : `TARGET MET: Calm Restored Around ${input.clubName} Leadership`;
    headlineDe = triumphClear
      ? `KRITIK VERSTUMMT: ${input.clubName} krönt Arbeit von Trainer & GM`
      : `ZIEL ERREICHT: Ruhe kehrt rund um ${input.clubName} ein`;
    summary = `Strong final execution eased press scrutiny across both the dressing room and sporting director's office.`;
    summaryDe = `Das starke Saisonfinish hat den Druck auf Kabine und Sportliche Leitung abgebaut.`;
  } else {
    delta = 4;
    coachDelta = 5;
    gmDelta = 3;
    consecutivePressureSeasons = Math.max(0, prevStreak - 1);
  }

  const nextMedia = clampMetric(basePressure + delta, 5, 100);
  const nextCoach = clampMetric(baseCoachHeat + coachDelta, 5, 100);
  const nextGm = clampMetric(baseGmHeat + gmDelta, 5, 100);

  return {
    mediaPressure: nextMedia,
    coachHeat: nextCoach,
    gmHeat: nextGm,
    delta: nextMedia - basePressure,
    context,
    headline,
    headlineDe,
    summary,
    summaryDe,
    consecutivePressureSeasons,
    impactDelta,
    moraleDelta,
    repDelta,
    issueBoardWarning,
    issueBoardUltimatum,
    shouldTriggerMoment,
    tierInfo: getPressureTier(nextMedia),
  };
}

export function generatePressureMoment(input: GeneratePressureMomentInput): PressureMoment {
  const coachName = input.coachName?.trim() || 'Head Coach';
  const gmName = input.gmName?.trim() || 'Sporting Director';
  const tactic = input.tactic || 'Balanced 6-0';
  const shortfall = input.currentPos - input.targetPos;
  const mediaPressure = clampMetric(input.mediaPressure, 0, 100);
  const coachHeat = clampMetric(input.coachHeat, 0, 100);
  const gmHeat = clampMetric(input.gmHeat, 0, 100);

  const outletByCountry: Record<string, string> = {
    GER: 'Handball-Woche & Sky Sports Desk',
    FRA: 'L’Équipe Handball Desk',
    ESP: 'Marca Balonmano Panel',
    DEN: 'TV2 Sport Handball Desk',
    NOR: 'Viaplay Nordic Press',
    SWE: 'Handbollskanalen Desk',
    HUN: 'Nemzeti Sport Press Room',
    POL: 'Przegląd Sportowy Desk',
    USA: 'National Handball Wire',
  };
  const outletName = outletByCountry[(input.country || 'GER').toUpperCase()] || 'Continental Handball Press Corps';

  if (input.context === 'championship_collapse' || input.context === 'title_expectations') {
    const isSevere = input.context === 'championship_collapse';
    return {
      id: `pm-${input.year}-${input.phase}-${input.context}`,
      year: input.year,
      phase: input.phase,
      context: input.context,
      outletName,
      headline: isSevere
        ? `TITLE COLLAPSE: ${input.clubName} #${input.currentPos} Despite Top-${input.targetPos} Mandate`
        : `CHAMPIONSHIP SCRUTINY: ${input.clubName} Off Pace in #${input.currentPos}`,
      headlineDe: isSevere
        ? `TITEL-ABSTURZ: ${input.clubName} nur auf Platz ${input.currentPos} statt Top ${input.targetPos}`
        : `TITELDRUCK: ${input.clubName} hinkt auf Platz ${input.currentPos} hinterher`,
      subheadline: input.phase === 'postseason'
        ? `Post-season press interrogation: Critics demand answers from ${gmName} and ${coachName} after falling ${Math.max(1, shortfall)} places short.`
        : `Mid-season crisis briefing: Press surrounds ${gmName} and ${coachName} with the championship slipping out of reach.`,
      subheadlineDe: input.phase === 'postseason'
        ? `Saison-Bilanz-PK: Nach ${Math.max(1, shortfall)} Plätzen unter Soll stehen ${gmName} und ${coachName} im Kreuzverhör.`
        : `Winter-Krisen-PK: Die Presse konfrontiert ${gmName} und ${coachName} mit dem abgerissenen Titelrennen.`,
      mediaPressure,
      coachHeat,
      gmHeat,
      targetPos: input.targetPos,
      currentPos: input.currentPos,
      numTeams: input.numTeams,
      shortfall,
      coachName,
      gmName,
      tactic,
      coachScrutiny: `Columnists accuse ${coachName}'s ${tactic} structure of being decoded by rivals, leaving high-wage stars isolated in crunch halves.`,
      coachScrutinyDe: `Kommentatoren werfen ${coachName}s ${tactic}-System Ausrechenbarkeit gegen direkte Konkurrenten vor.`,
      gmScrutiny: `Shareholders and ultras question ${gmName}'s recruitment balance, squad depth, and patience with the current bench leadership.`,
      gmScrutinyDe: `Gremien und Anhänger hinterfragen ${gmName}s Kaderzusammenstellung, Transferpolitik und Rückendeckung für den Trainer.`,
      journalistQuestions: [
        {
          outlet: 'Sky Sports Studio',
          reporter: 'M. Lindner',
          targetRole: 'Coach',
          question: `"${coachName}, you entered the year chasing Top ${input.targetPos}, yet you're sitting #${input.currentPos}. Has your ${tactic} playbook lost the dressing room?"`,
          questionDe: `"${coachName}, Saisonziel war Top ${input.targetPos}, aktuell steht Platz ${input.currentPos}. Verliert Ihr ${tactic}-System die Kabine?"`,
        },
        {
          outlet: 'SportBild Handball',
          reporter: 'K. Becker',
          targetRole: 'GM',
          question: `"${gmName}, as Sporting Director you built this roster and backed the coach. Is this collapse on your recruitment, or are changes coming?"`,
          questionDe: `"${gmName}, als Sportdirektor tragen Sie Verantwortung für Kader und Trainerwahl. Liegt der Absturz an der Kaderplanung oder drohen Konsequenzen?"`,
        },
      ],
      choices: [
        {
          id: 'back_coach',
          label: `Publicly Back ${coachName} & Absorb Fire`,
          labelDe: `${coachName} öffentlich stützen & Druck abfangen`,
          stanceTag: 'Unity Shield · Protects Dressing Room',
          stanceTagDe: 'Rückendeckung · Schützt Kabine',
          description: 'Step in front of the microphones, own recruitment expectations, and shield the squad from panic.',
          descriptionDe: 'Stellen Sie sich schützend vor Trainer und Mannschaft und übernehmen Sie die mediale Verantwortung.',
          mediaPressureDelta: -6,
          coachHeatDelta: -16,
          gmHeatDelta: +12,
          moraleDelta: +9,
          repDelta: -2,
          impactDelta: -2,
          secondHalfMoraleMod: 5,
          secondHalfOvrLift: 0,
          pressReactionHeadline: `${gmName} Draws Line Under Speculation: "We Win and Lose Together"`,
          pressReactionHeadlineDe: `${gmName} stärkt ${coachName} den Rücken: "Wir gehen diesen Weg gemeinsam"`,
          outcomeSummary: 'Dressing room rallied around the unity pledge (+9 Morale, -16 Coach Heat), though pundits turn their spotlight onto your front-office decisions (+12 GM Heat).',
          outcomeSummaryDe: 'Die Kabine dankt das Vertrauen (+9 Moral, -16 Trainer-Druck), während Experten nun Ihren Kader auf den Prüfstand stellen (+12 GM-Druck).',
          coachResponseQuote: `"Having the Sporting Director stand beside me in public takes weight off the players' shoulders. We'll repay that backing on the court."`,
          coachResponseQuoteDe: `"Dass der Sportdirektor öffentlich zu uns steht, nimmt enormen Druck von den Spielern."`,
        },
        {
          id: 'public_ultimatum',
          label: `Put ${coachName} on Notice & Demand Tactical Pivot`,
          labelDe: `Öffentliches Ultimatum an ${coachName} & Taktikwechsel`,
          stanceTag: 'Hardline Mandate · Shifts Heat to Bench',
          stanceTagDe: 'Hartes Ultimatum · Druck auf Trainerbank',
          description: 'Tell reporters #'+input.currentPos+' is unacceptable for this roster and demand immediate tactical adjustments.',
          descriptionDe: 'Machen Sie öffentlich klar, dass Platz '+input.currentPos+' inakzeptabel ist und fordern Sie taktische Korrekturen.',
          mediaPressureDelta: +6,
          coachHeatDelta: +18,
          gmHeatDelta: -14,
          moraleDelta: -7,
          repDelta: +1,
          impactDelta: +3,
          secondHalfMoraleMod: -4,
          secondHalfOvrLift: 1,
          pressReactionHeadline: `${gmName} Sounds Alarm: "Nobody at This Club Is Above Results"`,
          pressReactionHeadlineDe: `${gmName} erhöht den Druck: "Bei diesem Anspruch zählt nur sofortige Reaktion"`,
          outcomeSummary: 'Board and critics respect your toughness (-14 GM Heat, +3 Impact) and sharpens tactical urgency (+1 OVR focus), at the cost of dressing-room tension (-7 Morale).',
          outcomeSummaryDe: 'Vorstand und Presse honorieren die klare Kante (-14 GM-Druck, +3 Impact), doch in der Kabine entsteht Reibung (-7 Moral).',
          coachResponseQuote: `"Message received loud and clear. Every training session from tomorrow morning will be about fixing our execution."`,
          coachResponseQuoteDe: `"Die Botschaft ist angekommen. Ab morgen gilt voller Fokus auf Ergebnisse."`,
        },
        {
          id: 'gm_accountability',
          label: 'Announce Joint Accountability & Winter Review',
          labelDe: 'Gemeinsame Analyse & Kader-Überprüfung ankündigen',
          stanceTag: 'Balanced Reset · Cools Media Storm',
          stanceTagDe: 'Sachlicher Reset · Beruhigt Medien',
          description: 'Present a sober performance audit covering injuries, shooting efficiency, and targeted market upgrades.',
          descriptionDe: 'Präsentieren Sie eine nüchterne Leistungsanalyse samt gezielter Verstärkungspläne.',
          mediaPressureDelta: -16,
          coachHeatDelta: -6,
          gmHeatDelta: -6,
          moraleDelta: +2,
          repDelta: -1,
          impactDelta: +2,
          secondHalfMoraleMod: 2,
          secondHalfOvrLift: 0,
          pressReactionHeadline: `${input.clubName} Leadership Unveils Corrective Blueprint After Frank Talks`,
          pressReactionHeadlineDe: `${input.clubName}-Führung präsentiert nach Krisensitzung klaren Sanierungsplan`,
          outcomeSummary: 'A measured technical briefing took heat out of the headlines (-16 Media Pressure) while keeping both Coach and front office aligned (+2 Impact).',
          outcomeSummaryDe: 'Die sachliche Analyse nimmt Schärfe aus den Schlagzeilen (-16 Mediendruck) und stabilisiert die Führung (+2 Impact).',
          coachResponseQuote: `"The review was honest and constructive. Now we have clear benchmarks to chase over the run-in."`,
          coachResponseQuoteDe: `"Die Analyse war ehrlich und konstruktiv. Wir wissen genau, woran wir arbeiten müssen."`,
        },
      ],
    };
  }

  if (input.context === 'relegation_spiral' || input.context === 'relegation_dogfight') {
    const isRelegated = Boolean(input.relegated);
    return {
      id: `pm-${input.year}-${input.phase}-${input.context}`,
      year: input.year,
      phase: input.phase,
      context: input.context,
      outletName,
      headline: isRelegated
        ? `RELEGATION FALLOUT: ${input.clubName} Drops After #${input.currentPos} Finish`
        : `SURVIVAL CRISIS: ${input.clubName} Fighting for Lives in #${input.currentPos}`,
      headlineDe: isRelegated
        ? `ABSTIEGS-SCHOCK: ${input.clubName} stürzt nach Platz ${input.currentPos} ab`
        : `ABSTIEGS-KRIMINAL: ${input.clubName} auf Platz ${input.currentPos} unter Volldruck`,
      subheadline: `With the club entrenched at #${input.currentPos} of ${input.numTeams}, supporters and local press demand straight answers from ${gmName} and ${coachName}.`,
      subheadlineDe: `Auf Platz ${input.currentPos} von ${input.numTeams} fordern Fans und Lokalpresse klare Antworten von ${gmName} und ${coachName}.`,
      mediaPressure,
      coachHeat,
      gmHeat,
      targetPos: input.targetPos,
      currentPos: input.currentPos,
      numTeams: input.numTeams,
      shortfall,
      coachName,
      gmName,
      tactic,
      coachScrutiny: `Critics argue ${coachName}'s defensive rotations leak late goals and struggle to halt losing streaks under relegation tension.`,
      coachScrutinyDe: `Kritiker bemängeln späte Gegentore unter Druck und mangelnde Stabilität in der Defensive von ${coachName}.`,
      gmScrutiny: `Local media blasts ${gmName} for leaving the squad exposed to a dogfight without sufficient veteran depth or emergency fixes.`,
      gmScrutinyDe: `Die Lokalpresse kritisiert ${gmName} für fehlende Kaderbreite und mangelnde Erfahrung im Abstiegskampf.`,
      journalistQuestions: [
        {
          outlet: 'Regional Sports Desk',
          reporter: 'S. Hartmann',
          targetRole: 'Both',
          question: `"Fans packed the arena yet watched a slide to #${input.currentPos}. Why should they believe ${gmName} and ${coachName} can steer clear of the drop?"`,
          questionDe: `"Die Fans füllen die Halle, doch das Team rutscht auf Platz ${input.currentPos}. Warum sollten sie an den Turnaround unter ${gmName} und ${coachName} glauben?"`,
        },
        {
          outlet: 'Club Beat Reporter',
          reporter: 'T. Weber',
          targetRole: 'GM',
          question: `"If relegation survival demands bold moves, will the board back emergency squad surgery or is the coaching seat on the line?"`,
          questionDe: `"Verlangt der Abstiegskampf jetzt sofortige Transfers, oder steht der Trainerposten bereits zur Disposition?"`,
        },
      ],
      choices: [
        {
          id: 'siege_mentality',
          label: 'Forge Siege Mentality ("Us Against Everyone")',
          labelDe: 'Wagenburg-Mentalität ausrufen ("Jetzt erst recht")',
          stanceTag: 'Siege Mentality · High Morale Boost',
          stanceTagDe: 'Wagenburg · Moral-Schub',
          description: 'Reject media pessimism, rally ultras and players together, and turn home court into a cauldron.',
          descriptionDe: 'Schließen Sie die Reihen zwischen Kabine und Kurve und drehen Sie die Kritik in Kampfgeist um.',
          mediaPressureDelta: +8,
          coachHeatDelta: -10,
          gmHeatDelta: +6,
          moraleDelta: +12,
          repDelta: -1,
          impactDelta: 0,
          secondHalfMoraleMod: 8,
          secondHalfOvrLift: 1,
          pressReactionHeadline: `Defiant ${input.clubName} Lock Arms in Fiery Press Briefing`,
          pressReactionHeadlineDe: `Trotziges ${input.clubName} schaltet auf Wagenburg-Modus`,
          outcomeSummary: 'The dressing room caught fire (+12 Morale, +1 OVR grit), though reporters sharpen their pens (+8 Media Pressure).',
          outcomeSummaryDe: 'Die Mannschaft zieht mit (+12 Moral, +1 GES Kampfgeist), während die Medien skeptisch bleiben (+8 Mediendruck).',
          coachResponseQuote: `"Let them write us off. Inside that locker room, nobody is flinching."`,
          coachResponseQuoteDe: `"Sollen sie uns abschreiben – in dieser Kabine gibt niemand auf."`,
        },
        {
          id: 'emergency_backing',
          label: 'Own Front-Office Gaps & Pledge Market Action',
          labelDe: 'Kader-Defizite einräumen & Verstärkung zusagen',
          stanceTag: 'Accountable GM · Pacifies Press',
          stanceTagDe: 'Klartext vom GM · Beruhigt Umfeld',
          description: 'Acknowledge the roster needs reinforcement, take heat off the players, and commit to smart fixes.',
          descriptionDe: 'Übernehmen Sie Verantwortung für Kaderlücken und kündigen Sie gezielte Entlastung an.',
          mediaPressureDelta: -18,
          coachHeatDelta: -8,
          gmHeatDelta: -4,
          moraleDelta: +4,
          repDelta: -3,
          impactDelta: +3,
          secondHalfMoraleMod: 4,
          secondHalfOvrLift: 0,
          pressReactionHeadline: `${gmName} Admits Recruitment Shortfalls, Vows Survival Push`,
          pressReactionHeadlineDe: `${gmName} räumt Fehler ein und verspricht Unterstützung im Abstiegskampf`,
          outcomeSummary: 'Honesty disarmed the press pack (-18 Media Pressure, +3 Board Impact) and steadied nerves (+4 Morale), costing a touch of personal prestige (-3 Rep).',
          outcomeSummaryDe: 'Offene Selbstkritik nimmt Tempo aus der Debatte (-18 Mediendruck, +3 Impact) und beruhigt das Team (+4 Moral).',
          coachResponseQuote: `"Even one or two targeted additions or fresh legs will transform how we finish tight games."`,
          coachResponseQuoteDe: `"Gezielte Impulse werden uns in den Schlussphasen enorm helfen."`,
        },
        {
          id: 'public_ultimatum',
          label: 'Demand Immediate Defensive Discipline From Staff',
          labelDe: 'Sofortige defensive Disziplin von Trainerteam fordern',
          stanceTag: 'Boardroom Ultimatum · Shifts Blame',
          stanceTagDe: 'Vorstandsdruck · Fokus auf Trainer',
          description: 'State bluntly that points per game must surge immediately or structural changes will follow.',
          descriptionDe: 'Fordern Sie öffentlich sofortige Punkteausbeute – andernfalls drohen Konsequenzen.',
          mediaPressureDelta: -6,
          coachHeatDelta: +18,
          gmHeatDelta: -12,
          moraleDelta: -6,
          repDelta: +1,
          impactDelta: +4,
          secondHalfMoraleMod: -4,
          secondHalfOvrLift: 0,
          pressReactionHeadline: `Survival Ultimatum Issued at ${input.clubName} Press Room`,
          pressReactionHeadlineDe: `Überlebens-Ultimatum im Pressesaal von ${input.clubName}`,
          outcomeSummary: 'Board confidence in your authority firmed up (-12 GM Heat, +4 Impact), leaving the Coach walking a tightrope (+18 Coach Heat, -6 Morale).',
          outcomeSummaryDe: 'Ihre Autorität gegenüber dem Vorstand steigt (-12 GM-Druck, +4 Impact), doch der Coach steht massiv unter Strom (+18 Trainer-Druck).',
          coachResponseQuote: `"I know the table doesn't lie. Every point from here on out is a cup final."`,
          coachResponseQuoteDe: `"Die Tabelle lügt nicht. Jedes verbleibende Spiel ist ein Endspiel."`,
        },
      ],
    };
  }

  // Calm / Watchlist / Drought Briefing
  return {
    id: `pm-${input.year}-${input.phase}-briefing`,
    year: input.year,
    phase: input.phase,
    context: input.context,
    outletName,
    headline:
      input.context === 'drought_scrutiny'
        ? `${input.trophyDrought || 5}-YEAR DROUGHT BRIEFING: Trophy Pressure Simmers at ${input.clubName}`
        : `MEDIA ROOM BRIEFING: ${input.clubName} Temperature Check (#${input.currentPos})`,
    headlineDe:
      input.context === 'drought_scrutiny'
        ? `TITELFLAUTE IM FOKUS: Umfeld von ${input.clubName} verlangt Silberware`
        : `MEDIEN-BRIEFING: Stimmungsbild bei ${input.clubName} (Platz ${input.currentPos})`,
    subheadline: `Routine media check-in assessing alignment between ${gmName} and ${coachName} against a Top-${input.targetPos} expectation.`,
    subheadlineDe: `Aktuelle Einschätzung der Presse zur Zusammenarbeit zwischen ${gmName} und ${coachName} (Ziel Top ${input.targetPos}).`,
    mediaPressure,
    coachHeat,
    gmHeat,
    targetPos: input.targetPos,
    currentPos: input.currentPos,
    numTeams: input.numTeams,
    shortfall,
    coachName,
    gmName,
    tactic,
    coachScrutiny:
      mediaPressure >= 40
        ? `Pundits note minor tactical predictability in ${coachName}'s ${tactic} match plans.`
        : `Analysts commend ${coachName}'s structured preparation and calm touchline demeanor.`,
    coachScrutinyDe:
      mediaPressure >= 40
        ? `Experten sehen kleinere taktische Baustellen in ${coachName}s ${tactic}-Konzept.`
        : `Fachleute loben ${coachName}s klare Struktur und ruhige Ausstrahlung an der Seitenlinie.`,
    gmScrutiny:
      mediaPressure >= 40
        ? `Local columnists want to see decisive long-term ambition from ${gmName} in upcoming windows.`
        : `Board and local press recognize steady stewardship and disciplined squad management from ${gmName}.`,
    gmScrutinyDe:
      mediaPressure >= 40
        ? `Kolumnisten erwarten von ${gmName} in den kommenden Fenstern klare Impulse.`
        : `Vorstand und Presse bescheinigen ${gmName} eine solide und besonnene Kaderführung.`,
    journalistQuestions: [
      {
        outlet: outletName,
        reporter: 'J. Vance',
        targetRole: 'Both',
        question: `"${gmName}, with expectations set at Top ${input.targetPos}, how aligned are you and ${coachName} entering the decisive stretch?"`,
        questionDe: `"${gmName}, bei Saisonziel Top ${input.targetPos}: Wie eng sind Sie und ${coachName} für die entscheidende Phase abgestimmt?"`,
      },
    ],
    choices: [
      {
        id: 'calm_review',
        label: 'Project Calm Confidence & Long-Term Vision',
        labelDe: 'Gelassenheit & Langfrist-Strategie betonen',
        stanceTag: 'Steady Hand · Reduces Noise',
        stanceTagDe: 'Ruhige Hand · Senkt Druck',
        description: 'Deliver a poised briefing reinforcing mutual trust between board, front office, and coaching staff.',
        descriptionDe: 'Betonen Sie Geschlossenheit zwischen Vorstand, Sportdirektor und Trainerteam.',
        mediaPressureDelta: -10,
        coachHeatDelta: -8,
        gmHeatDelta: -8,
        moraleDelta: +3,
        repDelta: +1,
        impactDelta: +2,
        secondHalfMoraleMod: 2,
        secondHalfOvrLift: 0,
        pressReactionHeadline: `Measured Tone From ${input.clubName} Wins Praise Across Press Room`,
        pressReactionHeadlineDe: `Souveräner Auftritt der ${input.clubName}-Führung überzeugt Medien`,
        outcomeSummary: 'Composed messaging calmed speculation (-10 Media Pressure) and nudged confidence upward (+3 Morale, +2 Impact).',
        outcomeSummaryDe: 'Der ruhige Auftritt senkt den Druck (-10 Mediendruck) und stärkt das Vertrauen (+3 Moral, +2 Impact).',
        coachResponseQuote: `"Clarity from the top lets the whole locker room focus purely on matchday details."`,
        coachResponseQuoteDe: `"Klarheit von oben gibt der Mannschaft volle Konzentration für den Spieltag."`,
      },
      {
        id: 'public_ultimatum',
        label: 'Raise Public Standards & Demand Top-Gear Focus',
        labelDe: 'Öffentlich höchste Ansprüche einfordern',
        stanceTag: 'Ambitious Edge · Sharpens Focus',
        stanceTagDe: 'Ambitioniert · Schärft Fokus',
        description: 'Remind players and pundits that complacency is not tolerated at this club.',
        descriptionDe: 'Erinnern Sie Umfeld und Kader daran, dass Stillstand keine Option ist.',
        mediaPressureDelta: +4,
        coachHeatDelta: +6,
        gmHeatDelta: -4,
        moraleDelta: -2,
        repDelta: +2,
        impactDelta: +2,
        secondHalfMoraleMod: 0,
        secondHalfOvrLift: 1,
        pressReactionHeadline: `${gmName} Sets Demanding Tone: "Good Enough Isn't Enough Here"`,
        pressReactionHeadlineDe: `${gmName} setzt Reizpunkt: "Zufriedenheit darf es hier nie geben"`,
        outcomeSummary: 'Your high standards raised external expectations (+2 Rep, +1 OVR focus), adding mild edge around the bench (+6 Coach Heat).',
        outcomeSummaryDe: 'Klare Ambitionen stärken Ihr Profil (+2 Reputation), erhöhen aber leicht die Erwartung an die Bank.',
        coachResponseQuote: `"We embrace that standard. High expectations push elite competitors forward."`,
        coachResponseQuoteDe: `"Diesen Anspruch nehmen wir gerne an."`,
      },
    ],
  };
}

export function resolvePressureResponse(
  moment: PressureMoment,
  choiceId: string,
  currentState: {
    mediaPressure?: number;
    coachHeat?: number;
    gmHeat?: number;
    morale?: number;
    reputation?: number;
    clubImpactScore?: number;
  },
  lang: Language = 'en'
): PressureResolutionOutcome | null {
  const choice = moment.choices.find(c => c.id === choiceId);
  if (!choice) return null;

  const nextMedia = clampMetric((currentState.mediaPressure ?? moment.mediaPressure) + choice.mediaPressureDelta, 5, 100);
  const nextCoach = clampMetric((currentState.coachHeat ?? moment.coachHeat) + choice.coachHeatDelta, 5, 100);
  const nextGm = clampMetric((currentState.gmHeat ?? moment.gmHeat) + choice.gmHeatDelta, 5, 100);
  const nextMorale = clampMetric((currentState.morale ?? 75) + choice.moraleDelta, 5, 100);
  const nextRep = clampMetric((currentState.reputation ?? 50) + choice.repDelta, 1, 100);
  const nextImpact = clampMetric((currentState.clubImpactScore ?? 50) + choice.impactDelta, 0, 100);

  const isDe = lang === 'de';
  const resolvedMoment: PressureMoment = {
    ...moment,
    mediaPressure: nextMedia,
    coachHeat: nextCoach,
    gmHeat: nextGm,
    resolvedChoiceId: choice.id,
    resolvedReactionHeadline: isDe ? choice.pressReactionHeadlineDe : choice.pressReactionHeadline,
    resolvedOutcomeSummary: isDe ? choice.outcomeSummaryDe : choice.outcomeSummary,
    resolvedCoachQuote: isDe ? choice.coachResponseQuoteDe : choice.coachResponseQuote,
  };

  const toastType: PressureResolutionOutcome['toastType'] =
    nextMedia >= 75 ? 'warning' : choice.moraleDelta >= 5 ? 'success' : 'info';

  return {
    mediaPressure: nextMedia,
    coachHeat: nextCoach,
    gmHeat: nextGm,
    morale: nextMorale,
    reputation: nextRep,
    clubImpactScore: nextImpact,
    secondHalfMod: {
      year: moment.year,
      moraleDelta: choice.secondHalfMoraleMod ?? 0,
      ovrEffect: choice.secondHalfOvrLift ?? 0,
      stanceLabel: isDe ? choice.stanceTagDe : choice.stanceTag,
    },
    resolvedMoment,
    toastType,
    toastMessage: `🎙️ ${isDe ? choice.pressReactionHeadlineDe : choice.pressReactionHeadline}`,
  };
}
