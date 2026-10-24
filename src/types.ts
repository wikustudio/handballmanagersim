export type Language = 'en' | 'de' | 'es';
export type GameMode = 'standard' | 'realistic';
export type ViewMode = 'game' | 'about';

export interface Club {
  id: string | number;
  name: string;
  tier: number;
  baseOvr: number;
  stadium?: number;
  color: string;
  color2?: string;
  country?: string;
  fanBase?: number;
  morale?: number;
  logo?: string;
  fallbackLogo?: string;
  historicContext?: string;
  context?: string;
  rep?: number;
  currentBudget?: number;
  narrative?: string;
  isReserve?: boolean;
  squadSize?: number;
  academyLevel?: number;
  medicalLevel?: number;
  originalStartLeague?: number;
  isInsolventGiant?: boolean;
  fanStrategy?: 'ultras' | 'community' | 'corporate' | 'balanced';
  startAttendance?: number;
  goldenGenYearsRemaining?: number;
  isCinderellaActive?: boolean;
  isNemesisActive?: boolean;
  wasNemesisChampion?: boolean;
  lastSeasonPos?: number;
  isFallenGiant?: boolean;
  isRescueProject?: boolean;
  offerBadge?: string;
  temporaryOvrBoost?: number;
  activeLoansCount?: number;
  globalFans?: number;
  isPublic?: boolean;
  ipoPrice?: number;
  stockPrice?: number;
}

export interface TrophiesObj {
  cl?: number;
  el?: number; 
  ecl?: number;
  cwc?: number;
  bl?: number;
  lower?: number;
  dfb?: number;
  reg?: number;
  sc?: number;
  esc?: number;
}

export interface Standing {
  teamId: string;
  clubName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface SeasonHistory {
  year: number;
  clubName: string;
  clubId?: number;
  color?: string;
  color2?: string;
  logo?: string;
  fallbackLogo?: string;
  leagueTag?: string;
  leagueCss?: string;
  ovr: number;
  tier: number;
  nextTier?: number;
  wins: number;
  draws: number;
  losses: number;
  pts: number;
  pos: number;
  gf: number;
  ga: number;
  played?: number;
  att: number;
  util: number;
  stadium?: number;
  academyLevel?: number;
  medicalLevel?: number;
  trophyIcons?: string;
  trophiesThisYear?: TrophiesObj;
  country?: string;
  relegated?: boolean;
  promoted?: boolean;
  survived?: boolean;
  bankrupt?: boolean;
  financialRelegation?: boolean;
  pointsDeducted?: number;
  transfersIn?: number;
  transfersOut?: number;
  rivalName?: string;
  rivalPts?: number;
  rivalGd?: number;
  championshipDecider?: boolean;
  finalTable?: any[];
  divisionTables?: Record<number, any[]>;
  universeMovements?: UniverseMovement[];
  resolvedMatchContext?: any;
  insolventClubs?: { clubId: string; clubName: string; tier: number; country: string }[];
  userPlayedTier?: number;
  tactic?: string;
}

export interface UniverseMovement {
  id: string;
  year: number;
  clubId: string;
  clubName: string;
  clubLogo?: string;
  clubColor?: string;
  country: string;
  type: 'promotion' | 'relegation' | 'insolvency_relegation' | 'champion' | 'intl_cup' | 'takeover';
  fromTier?: number;
  toTier?: number;
  cupTitle?: string;
  isKey?: boolean;
  isCinderella?: boolean;
  pos?: number;
  toLeagueName?: string;
  reason?: string;
}

export interface YouthProspect {
  id: string;
  name: string;
  age: number;
  boost: number;
  timer: number;
  type: 'local' | 'top_prospect' | 'generational';
  tierType?: 'local' | 'top_prospect' | 'generational';
  isProtected?: boolean;
  protectionDefenseChance?: number;
  isTrialist?: boolean;
  enrolledYear?: number;
  position?: 'GK' | 'WING' | 'BACK' | 'PIVOT' | 'LW' | 'RW' | 'LB' | 'RB' | 'CB' | 'P';
  playstyle?: string;
  nationality?: string;
  isLoanedOut?: boolean;
  loanReturnSeason?: number;
  loanBonusEarned?: boolean;
  isForeignImport?: boolean;
}

export function getAcademySlotLimit(level: number = 1): number {
  if (level <= 1) return 6;
  if (level === 2) return 8;
  if (level === 3) return 10;
  if (level === 4) return 11;
  return 12; // Level 5 (Maximum)
}

export function calculateCohortRating(
  seniorBaseOvr: number = 70,
  academyLevel: number = 1,
  pipeline: YouthProspect[] = []
): number {
  const safeSenior = Math.max(40, seniorBaseOvr);
  // Baseline youth quality anchored to club senior standard (~74% of senior squad)
  const baseYouth = Math.max(45, Math.round(safeSenior * 0.74));
  
  // Facility quality tier: +0 to +6 OVR based on academy facility level (1-5)
  const facilityBonus = Math.max(0, Math.min(6, (academyLevel - 1) * 1.5));
  
  // Prospect quality: average potential/boost of the enrolled prospects
  const count = pipeline.length;
  if (count === 0) {
    return Math.min(baseYouth, safeSenior - 3);
  }
  
  const totalBoost = pipeline.reduce((sum, p) => sum + (p.boost || 0), 0);
  const avgBoost = totalBoost / Math.max(1, count);
  const talentBonus = Math.min(12, avgBoost * 2.8);
  
  // Full cohort bonus (having 6+ prospects ready to field a complete team)
  const cohortBonus = count >= 6 ? 2 : Math.max(-6, (count - 6));
  
  const rawRating = Math.round(baseYouth + facilityBonus + talentBonus + cohortBonus);
  
  // Youth teams realistically never exceed adult senior first team
  // Maximum realistic U19 youth ceiling is 82 OVR (world-class golden generation)
  const seniorCeiling = Math.max(45, safeSenior - 2);
  const absoluteYouthCap = 82;
  const maxPossible = Math.min(seniorCeiling, absoluteYouthCap);
  
  return Math.max(42, Math.min(maxPossible, rawRating));
}


export interface GameNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'celebration' | 'danger' | 'warning';
  title?: string;
  subtitle?: string;
  message: string;
  read: boolean;
  category?: string;
  standings?: any[];
  prizeMoney?: number;
  opponentName?: string;
}

export type ClubVision = 'Standard' | 'Youth Academy Focus' | 'Galactico Builder' | 'Financial Prudence' | 'Local Heritage';

export interface GameState {
  lang?: "en" | "de";
  sponsorDealsThisSeason?: number;
  notifications?: { id: string; type: string; title?: string; subtitle?: string; message: string; read: boolean; category?: string; standings?: any[]; prizeMoney?: number; opponentName?: string }[];
  year: number;
  careerId?: string;
  managerName: string;
  nationality?: string;
  tactic: string;
  philosophy?: string;
  mode: GameMode;
  startTier?: number;
  startClubName?: string;
  club: Club;
  budget: number;
  euroStatus: 'CL' | 'EL' | 'ECL' | null;
  history: SeasonHistory[];
  worldClubs?: Record<string, Club>;
  universeMovements?: UniverseMovement[];
  totals: {
    matches: number;
    wins: number;
    att: number;
    trophies: number;
    domTrophies: number;
    intTrophies: number;
    titles?: number;
  };
  score?: number;
  careerScore?: number;
  reputation: number;
  youthPipeline: YouthProspect[];
  trophies: string[];
  lastJobOfferYear: number;
  pendingJobOffers?: Club[];
  maxOvrCap: number;
  investmentsThisSeason: number;
  sponsorsPitchedThisSeason: number;
  stadiumExpandedThisSeason: number;
  infraActionsThisSeason?: number;
  facilitiesUpgradedThisSeason?: number;
  academyUpgradedThisSeason?: number;
  medicalUpgradedThisSeason?: number;
  regTransfersThisSeason: number;
  keyTransfersThisSeason: number;
  galacticosThisSeason?: number;
  squadSalesThisSeason?: number;
  loansThisSeason?: number;
  youthPullsThisSeason?: number;
  youthPullsSeasonYear?: number;
  lastGenerationalTurnoverYear?: number;
  rebuildImmunity?: boolean;
  jobMarketSearchesThisSeason: number;
  regionalToursThisSeason?: number;
  brandCampaignsThisSeason?: number;
  teamBondingThisSeason?: number;
  isNewSeasonRender: boolean;
  initialRenderDone: boolean;
  clWins: number;
  consecutiveTitles: number;
  trophyDrought: number;
  activePromise: boolean;
  boardWarning: boolean;
  boardExpectsSuccess: boolean;
  boardGracePeriod: number;
  boardUltimatum: boolean;
  seasonsInDebt: number;
  performanceSponsorSignedThisSeason?: boolean;
  performanceSponsorBlockedNextSeason?: boolean;
  managerSkills?: string[];
  skillPoints?: number;
  lastOvr?: number;
  startOfSeasonOvr?: number;
  signingOvrGainThisSeason?: number;
  signingFlopLossThisSeason?: number;
  eventOvrGainThisSeason?: number;
  contractRenewalSpend?: number;
  marketingSpend?: number;
  failedSponsorTargetNextSeason?: boolean;
  clubImpactScore?: number;
  boardExpectation?: string;
  boardTargetPos?: number;
  boardRoadmap?: BoardRoadmap;
  bankruptcyPending?: boolean;
  
  tenureYears?: number;
  isSacked?: boolean;
  immunityShields?: number;
  transferSpend?: number;
  facilitySpend?: number;
  youthSpend?: number;
  sponsorIncome?: number;
  activePerformanceDeal?: boolean;
  seasonSponsorDeals?: Record<number, { status: 'signed' | 'failed' | 'available'; brandName: string; brandLogo: string; payout?: number; bonus?: number }>;
  seasonSponsorDealsYear?: number;
  lastPatronRescueYear?: number;
  lastInsolventGiantNotice?: { clubId: string; clubName: string; tier: number; country: string };
  settings?: { language?: string };
  cupRunResults?: { year?: number; id: string; nameEn: string; nameDe: string; won: boolean; exitRound: string; winnerName?: string; runnerUpName?: string }[];
  endlessModeActive?: boolean;
  isCareerEnded?: boolean;
  postSeasonPending?: boolean;
  
  // Interactive Match Synchronization Context
  resolvedMatchContext?: ResolvedMatchContext;
  playoffVictoryOverride?: { oldTier: number; newTier: number; userWon: boolean; active?: boolean; year?: number };
  winterBreakSeenYear?: number;
  winterTransfersOpenedYear?: number;
  
  // New features
  rivalClubName?: string;
  rivalH2HWins?: number;
  rivalH2HLosses?: number;
  rivalH2HDraws?: number;
  youthTitlesWon?: number;
  youthChampionshipSimulatedYear?: number;
  youthSalesThisSeason?: number;
  youthSalesSeasonYear?: number;
  youthScoutsThisSeason?: number;
  schoolTrialistsThisSeason?: number;
  midSeasonCrisisTriggered?: boolean;
  ovrHistory?: { id: string; season: number; change: number; reason: string; reasonDe: string; }[];
  fanStrategy?: 'ultras' | 'community' | 'corporate' | 'balanced';
  headCoachArchetype?: 'Youth Developer' | 'Scout' | 'Continental Legend' | 'Tactician' | 'Motivator' | 'Standard';
  directorArchetype?: 'Scout / Youth Developer' | 'Financial Mogul' | 'Brand Ambassador' | 'Standard';
  clubVision?: ClubVision;
  youthDevQueue?: number;
  lastDirectorChangeYear?: number;
  rebuildWageDiscountSeasons?: number;
  rebuildYouthAccelSeasons?: number;
  relegationWageReliefSeasons?: number;
  lastGenerationalRebuildYear?: number;
  currentCoach?: Coach;
  
  // Interactive match flow
  simPhase?: 'idle' | 'cup_sf' | 'cup_final' | 'playoff' | 'cl_sf' | 'cl_final' | 'season_finish';
  pendingSeasonState?: any;
  activeMatch?: any;
  activeCupTournament?: TournamentBracket;
  activeEuroTournament?: TournamentBracket;
  cupQualifiedForSf?: boolean | null;
  euroQualifiedForSf?: boolean | null;
  activeLoan?: ClubLoan | null;

  // Veteran Ringer, TV Cup Jackpot, & Mid-Season Dilemma
  veteranRingerSignedThisSeason?: boolean;
  veteranRingerOvrGain?: number;
  veteranRingerWageCost?: number;
  veteranRingerName?: string;
  tvCupJackpotClaimedYear?: number;
  midSeasonDilemmaResolvedYear?: number;
  supercupPlayedYear?: number;
  pendingSupercupTrophies?: { sc?: number; esc?: number };
}

export interface Coach {
  id?: string;
  name: string;
  ovrBoost?: number;
  style?: string;
  archetype?: string;
  wage?: number;
  contractYears?: number;
}

export interface ResolvedCupOutcome {
  cupId: string; // 'nat_cup' | 'reg_cup' | 'cl' | 'el' | 'cwc'
  cupName: string;
  year: number;
  winnerId?: string | number;
  winnerName: string;
  runnerUpId?: string | number;
  runnerUpName: string;
  userWon: boolean;
}

export interface ResolvedPlayoffOutcome {
  type: 'promotion_playoff' | 'relegation_playoff';
  year: number;
  winnerId: string | number;
  winnerName: string;
  loserId: string | number;
  loserName: string;
  upperTier: number;
  lowerTier: number;
  userWon: boolean;
  promotedClubId: string | number;
  relegatedClubId: string | number;
}

export interface ResolvedMatchContext {
  cupFinals?: Record<string, ResolvedCupOutcome>;
  playoffDecider?: ResolvedPlayoffOutcome;
}

export interface ClubLoan {
  id: string;
  principal: number;
  remainingBalance: number;
  termYears: 10 | 15 | 25;
  yearsRemaining: number;
  interestRate: number;
  annualPayment: number;
  totalRepayment: number;
  takenInYear: number;
  loanType?: 'commercial' | 'arena_syndicate';
  monthlyPayment?: number;
}

export interface TournamentBracket {
  year: number;
  cupName: string;
  isAmateur?: boolean;
  isEuro?: boolean;
  qfOpponent: string;
  sfOpponent: string;
  finalOpponent: string;
  qfOpponentOvr: number;
  sfOpponentOvr: number;
  finalOpponentOvr: number;
  allTournamentClubs: string[];
  eliminatedClubs: string[];
}

export interface GameEvent {
  type: string;
  title: { en: string; de?: string; es?: string };
  desc: { en: string; de?: string; es?: string };
  opt1?: EventOption;
  opt2?: EventOption;
  opt3?: EventOption;
  cost?: number;
  saleVal?: number;
  invAmt?: number;
  offerVal?: number;
  extraData?: any;
  ovrLoss?: number;
  clubs?: Club[];
  isForced?: boolean;
  amount?: number;
  newClub?: Club;
}

export interface EventOption {
  title: { en: string; de?: string; es?: string };
  icon?: string;
  goodPct?: number;
  badPct?: number;
  goodTxt?: { en: string; de?: string; es?: string } | string;
  badTxt?: { en: string; de?: string; es?: string } | string;
  tag?: { en: string; de?: string; es?: string } | string;
}

export interface PhilosophyInfo {
  icon: any;
  color: string;
  en: string;
  de: string;
  gfMod: number;
  gaMod: number;
  perkEn: string;
  perkDe: string;
  effectDescEn: string;
  effectDescDe: string;
  ovrBonusType: string;
}

export interface LeagueInfo {
  name: string;
  tag: string;
  css: string;
  avgOvr: number;
  ticket: number;
  tvPrize: number;
  wages: number;
  attBase: number;
  stadBase: number;
  logo?: string;
}

export type RoadmapTargetType = 
  | 'championship_dominance' 
  | 'promotion_tier' 
  | 'top_four' 
  | 'arena_expansion' 
  | 'fanbase_growth'
  | 'academy_growth' 
  | 'medical_growth'
  | 'financial_surplus' 
  | 'european_glory' 
  | 'solidify_tier';

export interface BoardRoadmapGoal {
  id: string;
  titleEn: string;
  titleDe: string;
  descriptionEn: string;
  descriptionDe: string;
  targetType: RoadmapTargetType;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  rewardMp: number;
  rewardCash?: number;
  rewardClaimed?: boolean;
}

export interface BoardRoadmap {
  clubId?: string | number;
  clubName?: string;
  titleEn: string;
  titleDe: string;
  horizonYears: 2 | 3 | 5;
  startYear: number;
  endYear: number;
  status: 'in_progress' | 'succeeded' | 'failed';
  goals: BoardRoadmapGoal[];
  boardConfidence: number; // 0 - 100
  narrativeEn: string;
  narrativeDe: string;
  tierAtStart: number;
}
