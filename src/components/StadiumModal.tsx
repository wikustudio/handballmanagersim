import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Language, StadiumPolicy } from '../types';
import { 
  formatMoney, 
  formatNum, 
  getLeagueStadiumRequirement, 
  getCreditLimit, 
  getCountryMult,
  calculateClubFinancials
} from '../data/gameConstants';
import { analyzeCatchment } from '../engine/catchmentEngine';
import { t as tr } from '../data/translations';

export interface StadiumOption {
  seats: number;
  cost: number;
  fanBoost: number;
  labelEn: string;
  labelDe: string;
  descEn: string;
  descDe: string;
  isMegaProject?: boolean;
}

export interface SupporterSegment {
  key: 'ultras' | 'fan_clubs' | 'general' | 'casuals' | 'vip';
  nameEn: string;
  nameDe: string;
  taglineEn: string;
  taglineDe: string;
  sharePct: number; // % of total capacity
  seats: number; // total allocated seats
  attendees: number; // actual matchday turnstile attendees
  attendeeSharePct: number; // % of matchday crowd
  fillPct: number; // % of allocated stand occupied (attendees / seats)
  color: string;
  barColor: string;
  borderColor: string;
  bgGlow: string;
  icon: string;
  yieldLabel: string;
  loyaltyLabel: string;
  atmosphereRating: number;
  descEn: string;
  descDe: string;
  strategicValueEn: string;
  strategicValueDe: string;
}

export interface StadiumPolicyInfo {
  key: StadiumPolicy;
  labelEn: string;
  labelDe: string;
  taglineEn: string;
  taglineDe: string;
  icon: string;
  badgeEn: string;
  badgeDe: string;
  effectEn: string;
  effectDe: string;
  descEn: string;
  descDe: string;
}

export const STADIUM_POLICIES: StadiumPolicyInfo[] = [
  {
    key: 'balanced',
    labelEn: 'Balanced Tradition',
    labelDe: 'Ausgewogene Tradition',
    taglineEn: 'Authentic Club Equilibrium',
    taglineDe: 'Authentisches Gleichgewicht',
    icon: 'fa-solid fa-scale-balanced',
    badgeEn: 'All-Round Equilibrium',
    badgeDe: 'Ausgewogen',
    effectEn: 'Stable turnstile renewals & harmonious atmosphere across all stands with standard ticket yield. Normal event distribution.',
    effectDe: 'Solide Auslastung und harmonische Stimmung auf allen Tribünen. Normale Event-Verteilung.',
    descEn: 'Maintains the authentic European ground balance between vocal terraces, loyal fan clubs, affordable family seating, and hospitality boxes.',
    descDe: 'Erhält das traditionelle Gleichgewicht aus Stehplatz-Stimmung, Fanklubs, Familien und Business-Bereich.',
  },
  {
    key: 'ultras',
    labelEn: 'Fortress Curva',
    labelDe: 'Festung Fankurve',
    taglineEn: 'Active Supporter Priority',
    taglineDe: 'Fokus Aktive Fanszene',
    icon: 'fa-solid fa-fire',
    badgeEn: '+1 Squad OVR',
    badgeDe: '+1 Kader-GES',
    effectEn: '+1 Squad OVR immediately & vocal terrace home fortress. Note: Lacks corporate executive revenue, triggering significantly more money-issue & budget events.',
    effectDe: '+1 Kader-GES sofort & Heimvorteil-Hexenkessel. Hinweis: Ohne VIP-Logen fehlen Einnahmen – führt zu mehr Finanz- & Budget-Events.',
    descEn: 'Expands safe standing and subsidizes terrace tickets. Unlocks +1 Squad OVR and transforms your ground into a deafening wall of noise, but tightens operating cash flow.',
    descDe: 'Fördert Stehplätze und bezahlbare Tickets. Bringt +1 Kader-GES und verwandelt das Heimstadion in einen Hexenkessel, drückt aber die Einnahmen.',
  },
  {
    key: 'commercial',
    labelEn: 'Executive Hospitality',
    labelDe: 'VIP & Hospitality-Fokus',
    taglineEn: 'Corporate Revenue Maximizer',
    taglineDe: 'Umsatz-Optimierung',
    icon: 'fa-solid fa-champagne-glasses',
    badgeEn: '+18% Matchday Cash',
    badgeDe: '+18% Einnahmen',
    effectEn: '+18% Matchday & Hospitality Revenue boost every season. Note: Alienates active supporters, triggering significantly more Ultras protests & boycott events.',
    effectDe: '+18% Spieltags- & Hospitality-Einnahmen pro Saison. Hinweis: Verärgert die Fanszene – führt zu deutlich mehr Ultras- & Protest-Events.',
    descEn: 'Converts upper grandstand tiers into luxury suites, business lounges, and corporate fine dining for major sponsors and affluent clients.',
    descDe: 'Baut Oberränge zu Luxus-Logen und Business-Lounges für Sponsoren und Geschäftskunden aus.',
  },
  {
    key: 'family',
    labelEn: 'Grassroots & Family',
    labelDe: 'Familien- & Nachwuchs-Fokus',
    taglineEn: 'Next-Gen Supporter Recruitment',
    taglineDe: 'Nachwuchs-Gewinnung',
    icon: 'fa-solid fa-child-reaching',
    badgeEn: '+10% Youth & +25% Fans',
    badgeDe: '+10% Jugend & +25% Fans',
    effectEn: '+10% Youth Academy Graduate Promotion Chance & +25% Accelerated Fanbase Growth per season. Normal event distribution.',
    effectDe: '+10% Höhere Übernahmequote für Jugendtalente & +25% Schnelleres Fan-Wachstum. Normale Event-Verteilung.',
    descEn: 'Subsidizes matchday entry for children and local families. Grants a +10% promotion boost to graduating prospects and accelerates fanbase expansion.',
    descDe: 'Sichert bezahlbare Eintrittspreise für Familien. Erhöht die Übernahmechancen von Nachwuchsspielern um +10% und vergrößert die Fanbasis.',
  },
];

export const getSupporterBreakdown = (
  capacity: number,
  attendance: number,
  tier: number = 1,
  policy: StadiumPolicy = 'balanced'
): SupporterSegment[] => {
  // Realistic football stadium capacity distribution:
  // General Public forms the largest foundation (38-47%),
  // Fan Clubs form the core season ticket base (28-32%),
  // Ultras form an active, vocal terrace section (12-19%),
  // Casuals & neutrals (6-12%), and VIP / Hospitality (2-8%).
  let pUltras = tier === 1 ? 12 : tier === 2 ? 13 : tier === 3 ? 14 : 15;
  let pFanClubs = 30;
  let pGeneral = 42;
  let pCasuals = tier <= 2 ? 10 : 8;
  let pVip = tier === 1 ? 6 : tier === 2 ? 5 : tier <= 4 ? 3 : 2;

  // Modulate allocations according to the club's chosen grandstand policy
  if (policy === 'ultras') {
    pUltras += 4;
    pFanClubs += 2;
    pGeneral -= 3;
    pCasuals -= 2;
    pVip -= 1;
  } else if (policy === 'commercial') {
    pVip += 4;
    pCasuals += 2;
    pGeneral -= 3;
    pUltras -= 2;
    pFanClubs -= 1;
  } else if (policy === 'family') {
    pGeneral += 5;
    pCasuals += 2;
    pUltras -= 3;
    pFanClubs -= 2;
    pVip -= 2;
  }

  // Bound minimum allocations
  pUltras = Math.max(8, pUltras);
  pFanClubs = Math.max(20, pFanClubs);
  pGeneral = Math.max(25, pGeneral);
  pCasuals = Math.max(4, pCasuals);
  pVip = Math.max(1, pVip);

  // Normalize capacity percentages to exactly 100%
  const totalWeight = pUltras + pFanClubs + pGeneral + pCasuals + pVip;
  const pctUltras = Math.round((pUltras / totalWeight) * 100);
  const pctFanClubs = Math.round((pFanClubs / totalWeight) * 100);
  const pctGeneral = Math.round((pGeneral / totalWeight) * 100);
  const pctCasuals = Math.round((pCasuals / totalWeight) * 100);
  const pctVip = Math.max(1, 100 - (pctUltras + pctFanClubs + pctGeneral + pctCasuals));

  // Compute exact seat quotas with zero rounding leakage
  const sUltras = Math.round((pctUltras / 100) * capacity);
  const sFanClubs = Math.round((pctFanClubs / 100) * capacity);
  const sCasuals = Math.round((pctCasuals / 100) * capacity);
  const sVip = Math.round((pctVip / 100) * capacity);
  const sGeneral = Math.max(0, capacity - (sUltras + sFanClubs + sCasuals + sVip));

  const seatsMap: Record<string, number> = {
    ultras: sUltras,
    fan_clubs: sFanClubs,
    general: sGeneral,
    casuals: sCasuals,
    vip: sVip,
  };

  // Turnstile Attendance Breakdown:
  // Never exceed capacity or allow Ultras/FanClubs to cannibalize the General Public.
  const boundedAtt = Math.max(1, Math.min(capacity, attendance));
  const util = boundedAtt / Math.max(1, capacity);

  // Demand propensities:
  // Ultras and Fan Clubs turn out with high loyalty.
  // General Public has strong constant demand and always maintains a major presence.
  const weights: Record<string, number> = {
    ultras: 0.85 + util * 0.15,
    fan_clubs: 0.75 + util * 0.25,
    general: 0.55 + util * 0.45,
    casuals: 0.30 + util * 0.70,
    vip: 0.45 + util * 0.55,
  };

  const rawDemand: Record<string, number> = {
    ultras: sUltras * weights.ultras,
    fan_clubs: sFanClubs * weights.fan_clubs,
    general: sGeneral * weights.general,
    casuals: sCasuals * weights.casuals,
    vip: sVip * weights.vip,
  };

  const totalRawDemand = Object.values(rawDemand).reduce((a, b) => a + b, 0) || 1;

  // Initial proportional attendance per segment bounded by each segment's seat capacity
  const attMap: Record<string, number> = {
    ultras: Math.min(sUltras, Math.round(boundedAtt * (rawDemand.ultras / totalRawDemand))),
    fan_clubs: Math.min(sFanClubs, Math.round(boundedAtt * (rawDemand.fan_clubs / totalRawDemand))),
    general: Math.min(sGeneral, Math.round(boundedAtt * (rawDemand.general / totalRawDemand))),
    casuals: Math.min(sCasuals, Math.round(boundedAtt * (rawDemand.casuals / totalRawDemand))),
    vip: Math.min(sVip, Math.round(boundedAtt * (rawDemand.vip / totalRawDemand))),
  };

  // Ensure minimum 1 attendee per segment when there is non-trivial attendance
  if (boundedAtt >= 5) {
    for (const k of ['ultras', 'fan_clubs', 'general', 'casuals', 'vip']) {
      if (attMap[k] === 0 && seatsMap[k] > 0) {
        attMap[k] = 1;
      }
    }
  }

  // Exact reconcile so sum of attendees matches boundedAtt exactly
  let currentSum = Object.values(attMap).reduce((a, b) => a + b, 0);
  let diff = boundedAtt - currentSum;
  const keysPriority = diff > 0 
    ? ['general', 'fan_clubs', 'casuals', 'ultras', 'vip']
    : ['ultras', 'fan_clubs', 'vip', 'casuals', 'general'];

  while (diff !== 0) {
    let adjusted = false;
    for (const k of keysPriority) {
      if (diff > 0 && attMap[k] < seatsMap[k]) {
        attMap[k] += 1;
        diff -= 1;
        adjusted = true;
        if (diff === 0) break;
      } else if (diff < 0 && attMap[k] > (boundedAtt >= 5 ? 1 : 0)) {
        attMap[k] -= 1;
        diff += 1;
        adjusted = true;
        if (diff === 0) break;
      }
    }
    if (!adjusted) break;
  }

  const attUltras = attMap.ultras;
  const attFanClubs = attMap.fan_clubs;
  const attGeneral = attMap.general;
  const attCasuals = attMap.casuals;
  const attVip = attMap.vip;

  // Recalculate crowd shares cleanly (each between 0 and 100%, summing to 100%)
  const pCrowdUltras = Math.min(100, Math.round((attUltras / boundedAtt) * 100));
  const pCrowdFanClubs = Math.min(100, Math.round((attFanClubs / boundedAtt) * 100));
  const pCrowdGeneral = Math.min(100, Math.round((attGeneral / boundedAtt) * 100));
  const pCrowdCasuals = Math.min(100, Math.round((attCasuals / boundedAtt) * 100));
  const pCrowdVip = Math.max(0, 100 - (pCrowdUltras + pCrowdFanClubs + pCrowdGeneral + pCrowdCasuals));

  return [
    {
      key: 'ultras',
      nameEn: 'Ultras',
      nameDe: 'Ultras',
      taglineEn: 'Curva / Active Terraces',
      taglineDe: 'Fankurve / Stehplätze',
      sharePct: pctUltras,
      seats: sUltras,
      attendees: attUltras,
      attendeeSharePct: pCrowdUltras,
      fillPct: Math.min(100, Math.round((attUltras / Math.max(1, sUltras)) * 100)),
      color: '#f43f5e',
      barColor: 'bg-rose-500',
      borderColor: 'border-rose-500/30',
      bgGlow: 'bg-rose-500/10',
      icon: 'fa-solid fa-fire',
      yieldLabel: '0.85x (Subsidized Standing)',
      loyaltyLabel: '99% All-Weather Attendance',
      atmosphereRating: 98,
      descEn: 'The acoustic heart and vocal soul of the ground. Organizes 90-minute choreographies, tifo banners, pyrotechnics, and hostile away intimidation.',
      descDe: 'Das akustische Herz des Stadions. Organisiert 90-minütige Gesänge, Choreos, Fahnen und sorgt für eine feurige Heimfestung.',
      strategicValueEn: 'Grants +1 Squad OVR immediately and powers your "Home Fortress Factor", boosting tactical focus and resilience during tight ties and Decision Day showdowns.',
      strategicValueDe: 'Gibt sofort +1 Kader-GES und Festungsvorteil, stärkt Moral & Kampfkraft in entscheidenden Spielen.',
    },
    {
      key: 'fan_clubs',
      nameEn: 'Official Fan Clubs',
      nameDe: 'Offizielle Fanclubs',
      taglineEn: 'Season Ticket Bedrock',
      taglineDe: 'Dauerkarten-Kern',
      sharePct: pctFanClubs,
      seats: sFanClubs,
      attendees: attFanClubs,
      attendeeSharePct: pCrowdFanClubs,
      fillPct: Math.min(100, Math.round((attFanClubs / Math.max(1, sFanClubs)) * 100)),
      color: '#38bdf8',
      barColor: 'bg-sky-400',
      borderColor: 'border-sky-400/30',
      bgGlow: 'bg-sky-500/10',
      icon: 'fa-solid fa-shield-halved',
      yieldLabel: '1.00x (Standard Season Ticket)',
      loyaltyLabel: '95% Guaranteed Turnstiles',
      atmosphereRating: 78,
      descEn: 'Registered supporters, regional chapters, and generational season-ticket holders. The unwavering backbone that renews seats year after year.',
      descDe: 'Eingetragene Fanclubs und Dauerkarteninhaber. Das treue Fundament, das Jahr für Jahr die Ränge füllt.',
      strategicValueEn: 'Guarantees dependable matchday turnstile revenue regardless of form, protecting the club treasury during squad rebuilding seasons.',
      strategicValueDe: 'Sichert verlässliche Einnahmen und Vereinstreue auch in sportlichen Umbruchphasen.',
    },
    {
      key: 'general',
      nameEn: 'General Public',
      nameDe: 'Haupttribüne / Familie',
      taglineEn: 'Matchday Regulars',
      taglineDe: 'Tageskarten-Zuschauer',
      sharePct: pctGeneral,
      seats: sGeneral,
      attendees: attGeneral,
      attendeeSharePct: pCrowdGeneral,
      fillPct: Math.min(100, Math.round((attGeneral / Math.max(1, sGeneral)) * 100)),
      color: '#10b981',
      barColor: 'bg-emerald-400',
      borderColor: 'border-emerald-400/30',
      bgGlow: 'bg-emerald-500/10',
      icon: 'fa-solid fa-users',
      yieldLabel: '1.10x (Standard Ticket + F&B)',
      loyaltyLabel: '80% Form-Driven Attendance',
      atmosphereRating: 54,
      descEn: 'Local matchday ticket buyers, families, and neighborhood regulars. Strong consumers of stadium catering, official beverages, and club merchandise.',
      descDe: 'Lokale Familien, Studierende und Einzelticketkäufer. Hoher Verzehr an Imbissständen und Fanshop-Umsatz.',
      strategicValueEn: 'Forms the vital community link with the city and acts as the prime gateway for turning casual city residents into dedicated supporters.',
      strategicValueDe: 'Wichtiges Bindeglied zur Stadt; wandelt Gelegenheitszuschauer in langfristige Fans um.',
    },
    {
      key: 'casuals',
      nameEn: 'Casuals & Event-Goers',
      nameDe: 'Gelegenheitsfans',
      taglineEn: 'Walk-ins & Matchday Tourists',
      taglineDe: 'Touristen & Einmalgäste',
      sharePct: pctCasuals,
      seats: sCasuals,
      attendees: attCasuals,
      attendeeSharePct: pCrowdCasuals,
      fillPct: Math.min(100, Math.round((attCasuals / Math.max(1, sCasuals)) * 100)),
      color: '#a855f7',
      barColor: 'bg-purple-400',
      borderColor: 'border-purple-400/30',
      bgGlow: 'bg-purple-500/10',
      icon: 'fa-solid fa-ticket',
      yieldLabel: '1.25x (Full Price + High Basket)',
      loyaltyLabel: '65% Fair-Weather Influx',
      atmosphereRating: 32,
      descEn: 'Neutral sports enthusiasts, weekend tourists, and big-match event seekers. Surges when the club signs Galactico stars or hosts European cup ties.',
      descDe: 'Wochenendtouristen, Event-Publikum und Neutralbegeisterte. Strömen bei Stars, Erfolgsserien und Pokalhighlights ins Stadion.',
      strategicValueEn: 'Highest per-capita spend on full-price replica kits and souvenirs. Prime demographic for viral fanbase expansion during championship title runs.',
      strategicValueDe: 'Kauft Trikots zum Vollpreis; größtes Rekrutierungspotenzial bei Titelläufen und Meisterschaften.',
    },
    {
      key: 'vip',
      nameEn: 'VIP & Corporate',
      nameDe: 'VIP & Business-Logen',
      taglineEn: 'Executive Hospitality',
      taglineDe: 'Hospitality & Suiten',
      sharePct: pctVip,
      seats: sVip,
      attendees: attVip,
      attendeeSharePct: pCrowdVip,
      fillPct: Math.min(100, Math.round((attVip / Math.max(1, sVip)) * 100)),
      color: '#f59e0b',
      barColor: 'bg-amber-400',
      borderColor: 'border-amber-400/30',
      bgGlow: 'bg-amber-500/10',
      icon: 'fa-solid fa-champagne-glasses',
      yieldLabel: '4.50x (Luxury Premium Yield)',
      loyaltyLabel: '90% Contracted Suites',
      atmosphereRating: 18,
      descEn: 'Corporate sponsors, executive skybox members, and VIP lounge guests. Demands fine dining, reserved parking, and pristine business amenities.',
      descDe: 'Sponsoren, Firmenlogen und Business-Clubs. Verlangt erstklassiges Catering und exklusive Betreuung.',
      strategicValueEn: 'Massive commercial revenue powerhouse (+18% Matchday income boost). Attracts high-value corporate sponsors and provides crucial operating liquidity.',
      strategicValueDe: 'Enormer Umsatztreiber (+18% Spieltagseinnahmen); zieht finanzstarke Sponsoren an.',
    },
  ];
};

export const getStadiumOptions = (
  tier: number,
  country: string = 'GER',
  _baseOvr: number = 50,
  _clWins: number = 0,
  currentCap: number = 2000,
  _mode: string = 'standard'
): StadiumOption[] => {
  const countryMult = getCountryMult(country);
  const tierMult = tier === 1 ? 1.0 : tier === 2 ? 0.6 : tier === 3 ? 0.3 : tier === 4 ? 0.15 : tier === 5 ? 0.08 : tier === 6 ? 0.04 : 0.02;
  const mult = countryMult * tierMult;

  const options: StadiumOption[] = [];

  const base2500 = 15000;
  const base5000 = 35000;
  const base10000 = 80000;

  const fanBoost2500 = tier === 1 ? 1200 : tier === 2 ? 800 : tier === 3 ? 600 : tier === 4 ? 400 : 250;
  const fanBoost5000 = tier === 1 ? 2800 : tier === 2 ? 1800 : tier === 3 ? 1300 : tier === 4 ? 900 : 600;
  const fanBoost10000 = tier === 1 ? 6500 : tier === 2 ? 4200 : tier === 3 ? 3000 : tier === 4 ? 2000 : 1400;

  const rawOptions = [
    {
      seats: 2500,
      cost: Math.floor(base2500 * mult),
      fanBoost: fanBoost2500,
      labelEn: 'Compact Extension',
      labelDe: 'Kompakt-Erweiterung',
      descEn: 'Quick modular stand expansion to add immediate seating capacity.',
      descDe: 'Schneller modularer Tribuenenausbau fuer sofortige Kapazitaetssteigerung.',
    },
    {
      seats: 5000,
      cost: Math.floor(base5000 * mult),
      fanBoost: fanBoost5000,
      labelEn: 'Major Stand',
      labelDe: 'Haupt-Tribuenenrang',
      descEn: 'Full grandstand upgrade with covered seating & improved concessions.',
      descDe: 'Grosser Tribuenenausbau mit Ueberdachung & neuer Gastronomie.',
    },
    {
      seats: 10000,
      cost: Math.floor(base10000 * mult),
      fanBoost: fanBoost10000,
      labelEn: 'Arena Structure',
      labelDe: 'Arena-Oberrang Komplex',
      descEn: 'Massive double-tier stadium expansion with VIP suites & modern roof.',
      descDe: 'Massiver doppelstoeckiger Arena-Ausbau mit VIP-Logen & Dachkonstruktion.',
    },
  ];

  rawOptions.forEach(opt => {
    let seatsToAdd = opt.seats;
    if (currentCap + seatsToAdd > 100000) {
       seatsToAdd = 100000 - currentCap;
    }
    if (seatsToAdd > 0) {
      options.push({ ...opt, seats: seatsToAdd });
    }
  });

  if (currentCap >= 80000 && currentCap < 150000) {
    options.push(
       {
        seats: 150000 - currentCap,
        cost: Math.floor(600000 * mult), 
        fanBoost: 50000, 
        labelEn: 'Global Mega-Stadium',
        labelDe: 'Globales Mega-Stadion',
        descEn: 'Build a futuristic 150,000-seat architectural marvel. Becomes a global tourist destination, massively expanding your worldwide fanbase!',
        descDe: 'Ein futuristisches 150.000-Plaetze-Wunderwerk. Wird zur globalen Touristenattraktion und vergroessert die weltweite Fanbasis massiv!',
        isMegaProject: true
      }
    );
  }

  return options;
};

interface StadiumModalProps {
  isOpen?: boolean;
  state: GameState;
  lang: Language;
  onExpand: (seats: number, cost: number, fanBoost: number) => void;
  onSelectPolicy?: (policy: StadiumPolicy) => void;
  onClose: () => void;
}

export const StadiumModal: React.FC<StadiumModalProps> = ({
  isOpen = true,
  state,
  lang,
  onExpand,
  onSelectPolicy,
  onClose,
}) => {
  if (!isOpen) return null;

  const t = (en: string, de?: string, _ignoredEs?: string) => tr(lang, en, de);
  const tier = state.club.tier || 5;
  const country = state.club.country || 'GER';
  const requiredCap = getLeagueStadiumRequirement(tier, country);
  const currentCap = state.club.stadium || 2000;
  const isUndersized = tier <= 3 && currentCap < requiredCap;
  const alreadyExpanded = (state.stadiumExpandedThisSeason || 0) >= 1;
  const totalProjects = (state.stadiumExpandedThisSeason || 0) + (state.academyUpgradedThisSeason || 0) + (state.medicalUpgradedThisSeason || 0);
  const isProjectCapped = totalProjects >= 2;
  const activePolicy: StadiumPolicy = state.stadiumPolicy || 'balanced';

  // Current Attendance & Utilization
  const fin = calculateClubFinancials(state);
  const lastHistory = state.history && state.history.length > 0 ? state.history[state.history.length - 1] : null;
  const isCurrentClubHistory = lastHistory && (!lastHistory.clubId || lastHistory.clubId === state.club.id);
  const rawAtt = (isCurrentClubHistory ? lastHistory?.att : undefined) ?? fin.expectedAtt ?? Math.round(currentCap * 0.85);
  const currentAtt = Math.max(1, Math.min(currentCap, rawAtt));
  const currentUtil = Math.min(100, Math.round((currentAtt / currentCap) * 100));

  const [showHistoryChart, setShowHistoryChart] = useState<boolean>(false);
  const segments = getSupporterBreakdown(currentCap, currentAtt, tier, activePolicy);

  // Calculate composite stadium atmosphere index
  const weightedAtmosphere = Math.round(
    segments.reduce((acc, s) => acc + (s.atmosphereRating * (s.attendees / Math.max(1, currentAtt))), 0)
  );

  const options = getStadiumOptions(tier, country, state.club.baseOvr, state.clWins || 0, currentCap, state.mode);
  const megaProject = options.find(opt => opt.isMegaProject);
  const standardOptions = options.filter(opt => !opt.isMegaProject);

  const creditLimit = getCreditLimit(tier, country);
  const availableLiquidity = state.budget + creditLimit;

  // History data for attendance sparkline (filtered to current club tenure)
  const historyList = (state.history || [])
    .filter(h => !h.clubId || h.clubId === state.club.id)
    .slice(-5);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-2.5 sm:p-4 z-50 cursor-pointer text-left overflow-y-auto overscroll-contain"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.98, opacity: 0 }} 
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12141c]/95 text-white w-full sm:max-w-4xl xl:max-w-5xl rounded-[28px] sm:rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-white/[0.08] backdrop-blur-xl relative cursor-default max-h-[92vh] sm:max-h-[88vh] min-h-0 my-auto flex flex-col overflow-hidden shrink-0"
      >
        {/* Subtle Ambient Sky-Blue Accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06] bg-white/[0.02] shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-sky-400 text-base shadow-inner shrink-0">
              <i className="fa-solid fa-landmark"></i>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5 flex items-center gap-1.5">
                <span>{t('Infrastructure & Matchday Ground', 'Infrastruktur & Ausbau')}</span>
                <span className="w-1 h-1 rounded-full bg-sky-400/60" />
                <span className="text-zinc-400 font-medium">{state.club.name}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight flex items-center gap-2">
                <span>{t('Stadium & Grandstand Center', 'Stadion- & Tribünenzentrum')}</span>
              </h2>
            </div>
          </div>
          
          <button 
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/[0.08] shrink-0"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 custom-scrollbar text-left relative z-10 space-y-6">
          {/* TOP ATTENDANCE & STADIUM STATS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* CURRENT ATTENDANCE */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                  {t('Avg. Attendance', 'Ø Zuschauer')}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  {currentUtil}% {t('Fill', 'Voll')}
                </span>
              </div>
              <span className="text-base sm:text-xl font-bold text-white tabular-nums mt-1">
                {formatNum(currentAtt)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                {t('per home matchday', 'pro Heimspiel')}
              </span>
            </div>

            {/* TOTAL CAPACITY */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                {t('Total Capacity', 'Gesamtkapazität')}
              </span>
              <span className="text-base sm:text-xl font-bold text-sky-400 tabular-nums mt-1">
                {formatNum(currentCap)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                {formatNum(Math.max(0, currentCap - currentAtt))} {t('unfilled seats', 'Freie Plätze')}
              </span>
            </div>

            {/* LEAGUE STANDARD */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                {t('League Standard', 'Ligen-Soll')}
              </span>
              <span className={`text-base sm:text-xl font-bold tabular-nums mt-1 ${isUndersized ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatNum(requiredCap)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                {isUndersized ? t('Needs expansion', 'Ausbau empfohlen') : t('Standard compliant', 'Ligen-konform')}
              </span>
            </div>

            {/* TREASURY / CREDIT */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                {t('Treasury / Credit', 'Kasse / Kredit')}
              </span>
              <span className={`text-base sm:text-xl font-bold tabular-nums mt-1 ${state.budget < 0 ? 'text-rose-400' : 'text-sky-300'}`}>
                {formatMoney(state.budget)}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                {formatMoney(availableLiquidity)} {t('liquidity', 'Verfügbar')}
              </span>
            </div>
          </div>

          {/* DEMOGRAPHIC CATCHMENT & METROPOLITAN REACH */}
          {(() => {
            const catchment = analyzeCatchment(state.club, currentCap);
            return (
              <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 text-sm shrink-0">
                    <i className="fa-solid fa-map-location-dot"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                        {t('Metro Demographic Catchment', 'Regionales Einzugsgebiet')}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-xs text-zinc-300 font-semibold">{catchment.metroCity}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">({formatNum(catchment.population)} {t('inhabitants', 'Einw.')})</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      {lang === 'de' ? catchment.adviceDe : catchment.adviceEn}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="text-right">
                    <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{t('Soft Ceiling', 'Demograf. Soll')}</div>
                    <div className="text-xs font-bold font-mono text-zinc-200">{formatNum(catchment.softCapacityCeiling)}</div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 ${
                    catchment.utilizationRiskLevel === 'high_drag'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : catchment.utilizationRiskLevel === 'moderate'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <i className={`fa-solid ${catchment.utilizationRiskLevel === 'high_drag' ? 'fa-triangle-exclamation' : catchment.utilizationRiskLevel === 'moderate' ? 'fa-circle-exclamation' : 'fa-check'}`}></i>
                    <span>{catchment.penetrationPct}% {t('Capacity Index', 'Index')}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 5-SEASON ATTENDANCE TREND (Collapsible Sparkline) */}
          {historyList.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setShowHistoryChart(!showHistoryChart)}
                className="w-full flex items-center justify-between text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 text-xs">
                    <i className="fa-solid fa-chart-line"></i>
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition">
                    {t('5-Season Attendance Trend & Turnstiles', 'Zuschauer-Historie (Letzte 5 Saisons)')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-sky-400 tabular-nums">
                    {currentUtil}% {t('current utilization', 'aktuelle Auslastung')}
                  </span>
                  <i className={`fa-solid fa-chevron-${showHistoryChart ? 'up' : 'down'} text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-transform`}></i>
                </div>
              </button>

              {showHistoryChart && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <div className="relative w-full h-24 mt-2 mb-4">
                    <div className="absolute top-0 left-0 w-full border-t border-dashed border-white/10 z-0" />
                    <div className="absolute bottom-0 left-0 w-full border-b border-white/10 z-0" />
                    <div className="absolute -top-3.5 right-0 text-[8px] text-zinc-500 font-medium uppercase tracking-wider">
                      {t('MAX', 'MAX')} · {formatNum(currentCap)}
                    </div>

                    {(() => {
                      const maxAtt = currentCap;
                      const len = historyList.length;
                      const step = len > 1 ? 100 / (len - 1) : 0;
                      const points = historyList.map((h, i) => {
                        const x = len === 1 ? 50 : i * step;
                        const y = 100 - (Math.min(maxAtt, h.att || 0) / (maxAtt || 1)) * 100;
                        return { x, y, att: h.att || 0, year: h.year };
                      });

                      const areaPath = `M 0 100 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L 100 100 Z`;
                      const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

                      return (
                        <>
                          <svg className="absolute inset-0 w-full h-full overflow-visible z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="stadiumTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                                <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path d={areaPath} fill="url(#stadiumTrendGrad)" />
                            <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                          </svg>

                          <div className="absolute inset-0 z-20 w-full h-full pointer-events-none">
                            {points.map((p, i) => {
                              const isLast = i === points.length - 1;
                              return (
                                <div key={i} className="absolute flex flex-col items-center justify-center" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}>
                                  <div className={`rounded-full bg-sky-400 border-2 border-[#12141c] shadow-[0_0_8px_rgba(56,189,248,0.5)] ${isLast ? 'w-3 h-3 ring-4 ring-sky-400/25' : 'w-2.5 h-2.5'}`} />
                                  <div className="absolute -top-5 text-[9px] font-bold text-white px-1.5 py-0.5 whitespace-nowrap bg-[#12141c]/95 backdrop-blur-md rounded-md border border-white/10 tabular-nums shadow-sm">
                                    {formatNum(p.att)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="absolute -bottom-4.5 left-0 w-full z-20 pointer-events-none">
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
              )}
            </div>
          )}

          {alreadyExpanded && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-center gap-3 text-amber-300 text-xs font-medium">
              <i className="fa-solid fa-triangle-exclamation text-amber-400 shrink-0"></i>
              <span>{t('Stadium expansion completed for this season (1/1).', 'Ausbau für diese Saison beendet (1/1).')}</span>
            </div>
          )}

          {/* STRATEGY & SUPPORTER DEMOGRAPHICS SECTION */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-6">
            {/* Top: Grandstand Strategy Cards (Primary Focus) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90 mb-0.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-sliders text-[10px]"></i>
                    <span>{t('Matchday Ground Operations', 'Stadion-Betrieb')}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {t('Grandstand & Matchday Strategy', 'Tribünen- & Spieltagsstrategie')}
                  </h3>
                  <p className="text-xs text-zinc-400 font-normal">
                    {t(
                      'Choose your ground policy to influence pitch atmosphere, matchday cash flow, and supporter recruitment.',
                      'Wähle deine Ausrichtung für Heimstärke, Spieltagseinnahmen und Fan-Zuwachs.'
                    )}
                  </p>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs self-start sm:self-auto shrink-0">
                  <i className="fa-solid fa-volume-high text-sky-400 text-[11px]"></i>
                  <span className="text-zinc-400 text-[11px] font-medium">{t('Atmosphere:', 'Stimmung:')}</span>
                  <span className="font-bold text-white tabular-nums">{weightedAtmosphere}/100</span>
                </div>
              </div>

              {/* 4 Strategy Cards in Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {STADIUM_POLICIES.map((policy) => {
                  const isPolicyActive = activePolicy === policy.key;
                  return (
                    <button
                      key={policy.key}
                      type="button"
                      onClick={() => onSelectPolicy && onSelectPolicy(policy.key)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden group ${
                        isPolicyActive
                          ? 'bg-sky-500/[0.09] border-sky-400/40 ring-1 ring-sky-400/30 shadow-md'
                          : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.06]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition ${
                              isPolicyActive ? 'bg-sky-400 text-zinc-950 font-bold' : 'bg-white/[0.04] text-zinc-300 group-hover:text-white'
                            }`}>
                              <i className={policy.icon}></i>
                            </div>
                            <span className="text-xs font-bold text-white truncate">
                              {lang === 'de' ? policy.labelDe : policy.labelEn}
                            </span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] shrink-0 ${
                            isPolicyActive ? 'bg-sky-400 border-sky-400 text-zinc-950 font-bold' : 'border-white/20 text-transparent'
                          }`}>
                            <i className="fa-solid fa-check"></i>
                          </div>
                        </div>

                        <div className="mb-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isPolicyActive 
                              ? 'bg-sky-400/20 text-sky-300 border-sky-400/30 font-bold' 
                              : 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
                          }`}>
                            {lang === 'de' ? policy.badgeDe : policy.badgeEn}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] text-[10px] font-medium text-emerald-400 leading-snug">
                        {lang === 'de' ? policy.effectDe : policy.effectEn}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Compact Continuous Supporter Demographics Bar */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-chart-pie text-sky-400 text-[10px]"></i>
                  <span>{t('Matchday Turnstiles by Supporter Group', 'Zuschauer-Aufteilung nach Fanszene')}</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {formatNum(currentAtt)} / {formatNum(currentCap)} {t('turnstiles active', 'Plätze belegt')} ({currentUtil}%)
                </div>
              </div>

              {/* Continuous Segmented Distribution Bar */}
              <div className="h-3.5 w-full bg-black/40 rounded-full p-0.5 border border-white/[0.06] flex gap-1 overflow-hidden shadow-inner mb-3">
                {segments.map((segment) => (
                  <div
                    key={segment.key}
                    style={{ width: `${Math.max(4, segment.attendeeSharePct)}%` }}
                    className={`h-full rounded-full transition-all relative ${segment.barColor}`}
                    title={`${segment.nameEn}: ${formatNum(segment.attendees)} turnstiles (${segment.attendeeSharePct}%)`}
                  />
                ))}
              </div>

              {/* Clean 5-Column Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {segments.map((segment) => {
                  const isUltrasSynergy = activePolicy === 'ultras' && segment.key === 'ultras';
                  const isVipSynergy = activePolicy === 'commercial' && segment.key === 'vip';
                  const isFamilySynergy = activePolicy === 'family' && (segment.key === 'general' || segment.key === 'casuals');

                  return (
                    <div
                      key={segment.key}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition ${
                        isUltrasSynergy || isVipSynergy || isFamilySynergy
                          ? 'bg-sky-500/[0.07] border-sky-400/30'
                          : 'bg-white/[0.02] border-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: segment.color }} 
                          />
                          <span className="text-[11px] font-bold text-white truncate">
                            {lang === 'de' ? segment.nameDe : segment.nameEn}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 tabular-nums ml-1 shrink-0">
                          {segment.attendeeSharePct}%
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mt-0.5">
                        <div className="text-[13px] font-bold text-white font-mono tabular-nums">
                          {formatNum(segment.attendees)}
                        </div>
                        <span className="text-[9px] text-zinc-400 tabular-nums">
                          {segment.fillPct}% {t('full', 'voll')}
                        </span>
                      </div>

                      <div className="mt-1 pt-1 border-t border-white/[0.04] flex items-center justify-between text-[9px]">
                        <span className="text-zinc-500 truncate">{segment.loyaltyLabel}</span>
                        {isUltrasSynergy ? (
                          <span className="text-rose-400 font-semibold">{t('+Curva', '+Kurve')}</span>
                        ) : isVipSynergy ? (
                          <span className="text-violet-400 font-semibold">{t('+Yield', '+Ertrag')}</span>
                        ) : isFamilySynergy ? (
                          <span className="text-emerald-400 font-semibold">{t('+Family', '+Familie')}</span>
                        ) : (
                          <span className="text-zinc-500">{segment.yieldLabel.split(' ')[0]}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FULL WIDTH MEGA PROJECT BANNER */}
          {megaProject && (
            <div className="bg-amber-500/[0.04] border border-amber-400/25 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10">
                <div className="flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-crown text-[9px]"></i>
                    <span>{t('Ultimate Project', 'Ultimatives Projekt')}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">
                    {lang === 'de' ? megaProject.labelDe : megaProject.labelEn}
                    <span className="text-amber-400 tabular-nums ml-2">+{formatNum(megaProject.seats)}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-2.5 max-w-xl font-normal">
                    {lang === 'de' ? megaProject.descDe : megaProject.descEn}
                  </p>
                  
                  {/* Demographic breakdown pill for new seats */}
                  <div className="mb-3.5 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                    <span className="font-semibold text-zinc-300">{t('New Stand Allocation:', 'Tribünenaufteilung:')}</span>
                    <span className="text-rose-400 font-medium">+{formatNum(Math.round(megaProject.seats * 0.14))} {t('Ultras', 'Ultras')}</span>
                    <span>·</span>
                    <span className="text-sky-400 font-medium">+{formatNum(Math.round(megaProject.seats * 0.30))} {t('Fan Clubs', 'Fanclubs')}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-medium">+{formatNum(Math.round(megaProject.seats * 0.42))} {t('General', 'Tageskarten')}</span>
                    <span>·</span>
                    <span className="text-purple-400 font-medium">+{formatNum(Math.round(megaProject.seats * 0.09))} {t('Casuals', 'Gäste')}</span>
                    <span>·</span>
                    <span className="text-amber-400 font-medium">+{formatNum(Math.round(megaProject.seats * 0.05))} {t('VIP Suites', 'VIP-Logen')}</span>
                  </div>

                  <div className="text-[11px] font-medium text-emerald-400 mb-4 flex items-center gap-1.5">
                    <i className="fa-solid fa-building-columns"></i>
                    <span>{lang === 'de' ? 'Strukturierte Schulden möglich (Insolvenz-Pause bei operativem Gewinn)' : 'Structured Debt Eligible (Insolvency paused if operating at a profit)'}</span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{t('Fanbase Growth', 'Fan-Wachstum')}</span>
                      <span className="font-bold text-emerald-400 tabular-nums">+{formatNum(megaProject.fanBoost)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{t('Total Investment', 'Kosten')}</span>
                      <span className="font-bold text-rose-400 tabular-nums">-{formatMoney(megaProject.cost)}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto shrink-0 pt-4 sm:pt-0">
                  <button
                    disabled={alreadyExpanded || isProjectCapped || availableLiquidity < megaProject.cost}
                    onClick={() => onExpand(megaProject.seats, megaProject.cost, megaProject.fanBoost)}
                    className={`w-full sm:w-52 py-3.5 px-4 rounded-2xl font-semibold text-xs tracking-wide transition cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-[0.98] ${
                      alreadyExpanded || isProjectCapped
                        ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                        : availableLiquidity < megaProject.cost
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-sm'
                    }`}
                  >
                    {alreadyExpanded ? (
                      <span>{t('Completed (1/1)', 'Erledigt (1/1)')}</span>
                    ) : isProjectCapped ? (
                      <span>{t('Max 2 Projects (2/2)', 'Max. 2 Projekte (2/2)')}</span>
                    ) : availableLiquidity < megaProject.cost ? (
                      <span>{t('Need More Funds', 'Mehr Geld benötigt')}</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><i className="fa-solid fa-hammer"></i> {t('Authorize Build', 'Bau genehmigen')}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STANDARD OPTIONS GRID */}
          {standardOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {t('Grandstand Expansion Options', 'Tribünen-Ausbauoptionen')}
                </h4>
                <span className="text-[10px] text-zinc-500">
                  {t('Max 1 expansion project per season', 'Max. 1 Projekt pro Saison')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {standardOptions.map((opt) => {
                  const canAfford = availableLiquidity >= opt.cost;
                  const newCap = currentCap + opt.seats;
                  const newBreakdown = getSupporterBreakdown(opt.seats, opt.seats, tier, activePolicy);

                  return (
                    <div key={opt.seats} className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-zinc-300">{lang === 'de' ? opt.labelDe : opt.labelEn}</span>
                          <span className="text-xs font-semibold text-sky-400 tabular-nums">
                            +{formatNum(opt.seats)}
                          </span>
                        </div>
                        <div className="text-base font-bold text-white tracking-tight mb-1 tabular-nums">{formatNum(opt.seats)} {t('Seats', 'Sitzplätze')}</div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed mb-3 font-normal truncate">{lang === 'de' ? opt.descDe : opt.descEn}</p>

                        <div className="space-y-1.5 pt-2 border-t border-white/[0.05] text-xs mb-3.5">
                          <div className="flex justify-between text-zinc-400"><span>{t('New Cap:', 'Neue Kap:')}</span><span className="font-semibold text-white tabular-nums">{formatNum(newCap)}</span></div>
                          <div className="flex justify-between text-zinc-400"><span>{t('Fan Boost:', 'Fans:')}</span><span className="font-semibold text-emerald-400 tabular-nums">+{formatNum(opt.fanBoost)}</span></div>
                          <div className="flex justify-between text-zinc-400"><span>{t('Cost:', 'Kosten:')}</span><span className="font-semibold text-rose-400 tabular-nums">-{formatMoney(opt.cost)}</span></div>
                        </div>
                      </div>
                      
                      <button
                        disabled={alreadyExpanded || isProjectCapped || !canAfford}
                        onClick={() => onExpand(opt.seats, opt.cost, opt.fanBoost)}
                        className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                          alreadyExpanded || isProjectCapped ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.06] cursor-not-allowed'
                          : !canAfford ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-not-allowed'
                          : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.08]'
                        }`}
                      >
                        {alreadyExpanded ? <span>{t('Expanded (1/1)', 'Ausgebaut (1/1)')}</span> : isProjectCapped ? <span>{t('Max 2 Projects (2/2)', 'Max. 2 Projekte (2/2)')}</span> : !canAfford ? <span>{t('Insufficient Liquidity', 'Zu wenig Guthaben')}</span> : <><i className="fa-solid fa-hammer"></i><span>{t(`Build`, `Bauen`)}</span></>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};