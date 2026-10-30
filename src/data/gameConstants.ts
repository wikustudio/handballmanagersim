import { ALL_CLUBS } from './clubsData';
import {
  UserCircle, Telescope, Megaphone, Briefcase, Tags, ShieldHalf, 
  Star, Swords, Gauge, Network, Zap, User
} from 'lucide-react';
import { LeagueInfo, PhilosophyInfo, Club } from '../types';
import handballBaseDatabase from '../mod-data/handball_base_database.json';
import { getActiveClubs, mergeClubWithWorldState, isAnyModActive } from '../utils/modManager';
export { calculateLiveScore } from '../utils/leaderboard';

export const MAX_SEASONS = 35;

export const COUNTRY_LEAGUES: Record<string, Record<number, LeagueInfo>> = {
  GER: {
    1: { name: "1. Bundesliga", tag: "HBL 1", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 84, ticket: 40, tvPrize: 450000, wages: 4800000, attBase: 7000, stadBase: 12000 },
    2: { name: "2. Bundesliga", tag: "HBL 2", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 68, ticket: 25, tvPrize: 85000, wages: 1200000, attBase: 2500, stadBase: 5000 },
    3: { name: "3. Liga", tag: "3. LIGA", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 61, ticket: 15, tvPrize: 25000, wages: 260000, attBase: 1200, stadBase: 3000 },
    4: { name: "Regionalliga", tag: "REG", css: "bg-orange-500/20 text-orange-400 border border-orange-500/30", avgOvr: 54, ticket: 12, tvPrize: 8000, wages: 65000, attBase: 500, stadBase: 1500 },
    5: { name: "Oberliga", tag: "OBER", css: "bg-purple-500/20 text-purple-400 border border-purple-500/30", avgOvr: 46, ticket: 8, tvPrize: 3000, wages: 25000, attBase: 250, stadBase: 800 },
    6: { name: "Verbandsliga", tag: "VERB", css: "bg-pink-500/20 text-pink-400 border border-pink-500/30", avgOvr: 39, ticket: 5, tvPrize: 1000, wages: 10000, attBase: 100, stadBase: 300 },
  },
  FRA: {
    1: { name: "LNH Division 1", tag: "LNH", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 84, ticket: 38, tvPrize: 300000, wages: 2600000, attBase: 5000, stadBase: 8000 },
    2: { name: "Proligue", tag: "PRO", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 68, ticket: 22, tvPrize: 65000, wages: 1200000, attBase: 2000, stadBase: 3500 },
    3: { name: "Nationale 1", tag: "NAT 1", css: "bg-teal-500/20 text-teal-400 border border-teal-500/30", avgOvr: 59, ticket: 14, tvPrize: 18000, wages: 240000, attBase: 900, stadBase: 1800 },
    4: { name: "Nationale 2", tag: "NAT 2", css: "bg-orange-500/20 text-orange-400 border border-orange-500/30", avgOvr: 50, ticket: 10, tvPrize: 6000, wages: 65000, attBase: 450, stadBase: 900 },
    5: { name: "Nationale 3", tag: "NAT 3", css: "bg-purple-500/20 text-purple-400 border border-purple-500/30", avgOvr: 42, ticket: 6, tvPrize: 2500, wages: 25000, attBase: 200, stadBase: 500 },
    6: { name: "Pré-Nationale", tag: "PRE", css: "bg-pink-500/20 text-pink-400 border border-pink-500/30", avgOvr: 35, ticket: 4, tvPrize: 1000, wages: 10000, attBase: 100, stadBase: 300 },
  },
  HUN: {
    1: { name: "Nemzeti Bajnokság I", tag: "NB1", css: "bg-green-500/20 text-green-400 border border-green-500/30", avgOvr: 76, ticket: 22, tvPrize: 160000, wages: 1500000, attBase: 3200, stadBase: 6000 },
    2: { name: "Nemzeti Bajnokság I/B", tag: "NB1/B", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 68, ticket: 12, tvPrize: 35000, wages: 600000, attBase: 1000, stadBase: 2000 },
    3: { name: "Nemzeti Bajnokság II", tag: "NB2", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 55, ticket: 8, tvPrize: 12000, wages: 200000, attBase: 450, stadBase: 900 },
    4: { name: "Megyei I", tag: "MEG 1", css: "bg-amber-500/20 text-amber-400 border border-amber-500/30", avgOvr: 44, ticket: 5, tvPrize: 4000, wages: 55000, attBase: 200, stadBase: 450 },
    5: { name: "Megyei II", tag: "MEG 2", css: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30", avgOvr: 36, ticket: 3, tvPrize: 1500, wages: 15000, attBase: 100, stadBase: 250 },
  },
  POL: {
    1: { name: "Superliga", tag: "SUPER", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 76, ticket: 22, tvPrize: 180000, wages: 1400000, attBase: 3200, stadBase: 6000 },
    2: { name: "I Liga", tag: "1 LIGA", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 68, ticket: 12, tvPrize: 40000, wages: 550000, attBase: 1100, stadBase: 2200 },
    3: { name: "II Liga", tag: "2 LIGA", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 55, ticket: 8, tvPrize: 12000, wages: 180000, attBase: 500, stadBase: 1000 },
  },
  DEN: {
    1: { name: "Håndboldligaen", tag: "HL", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 80, ticket: 32, tvPrize: 220000, wages: 2000000, attBase: 3500, stadBase: 6500 },
    2: { name: "1. Division", tag: "1. DIV", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 70, ticket: 18, tvPrize: 50000, wages: 800000, attBase: 1400, stadBase: 2500 },
    3: { name: "2. Division", tag: "2. DIV", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 57, ticket: 10, tvPrize: 15000, wages: 260000, attBase: 600, stadBase: 1200 },
    4: { name: "3. Division", tag: "3. DIV", css: "bg-amber-500/20 text-amber-400 border border-amber-500/30", avgOvr: 46, ticket: 6, tvPrize: 6000, wages: 80000, attBase: 250, stadBase: 600 },
    5: { name: "Danmarksserien", tag: "DAN", css: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30", avgOvr: 38, ticket: 4, tvPrize: 2000, wages: 25000, attBase: 120, stadBase: 300 },
  },
  ESP: {
    1: { name: "Liga ASOBAL", tag: "ASOBAL", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 76, ticket: 25, tvPrize: 120000, wages: 1500000, attBase: 2200, stadBase: 4500 },
    2: { name: "División de Honor Plata", tag: "PLATA", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 69, ticket: 14, tvPrize: 30000, wages: 500000, attBase: 1000, stadBase: 2000 },
    3: { name: "Primera Nacional", tag: "PRIM", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 60, ticket: 8, tvPrize: 10000, wages: 160000, attBase: 400, stadBase: 1000 },
    4: { name: "Segunda Nacional", tag: "SEG", css: "bg-orange-500/20 text-orange-400 border border-orange-500/30", avgOvr: 52, ticket: 6, tvPrize: 5000, wages: 70000, attBase: 250, stadBase: 600 },
    5: { name: "Primera Autonómica", tag: "AUT 1", css: "bg-purple-500/20 text-purple-400 border border-purple-500/30", avgOvr: 44, ticket: 4, tvPrize: 2000, wages: 30000, attBase: 150, stadBase: 400 },
    6: { name: "Segunda Autonómica", tag: "AUT 2", css: "bg-pink-500/20 text-pink-400 border border-pink-500/30", avgOvr: 36, ticket: 3, tvPrize: 1000, wages: 12000, attBase: 80, stadBase: 200 },
  },
  POR: {
    1: { name: "Campeonato Placard Andebol 1", tag: "AND1", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 75, ticket: 15, tvPrize: 100000, wages: 550000, attBase: 1500, stadBase: 3000 },
    2: { name: "Divisão de Honra", tag: "HONRA", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 68, ticket: 8, tvPrize: 25000, wages: 220000, attBase: 500, stadBase: 1200 },
    3: { name: "2ª Divisão", tag: "2. DIV", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 57, ticket: 5, tvPrize: 8000, wages: 110000, attBase: 200, stadBase: 500 },
    4: { name: "3ª Divisão", tag: "3. DIV", css: "bg-orange-500/20 text-orange-400 border border-orange-500/30", avgOvr: 50, ticket: 4, tvPrize: 3000, wages: 45000, attBase: 100, stadBase: 300 },
    5: { name: "Ligas Regionais", tag: "REG", css: "bg-purple-500/20 text-purple-400 border border-purple-500/30", avgOvr: 44, ticket: 3, tvPrize: 1000, wages: 18000, attBase: 50, stadBase: 150 },
  },
  SWE: {
    1: { name: "Handbollsligan", tag: "HBL", css: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", avgOvr: 75, ticket: 24, tvPrize: 110000, wages: 950000, attBase: 2200, stadBase: 4000 },
    2: { name: "Allsvenskan", tag: "ALLS", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 67, ticket: 12, tvPrize: 25000, wages: 450000, attBase: 800, stadBase: 1500 },
    3: { name: "Division 1", tag: "DIV 1", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 56, ticket: 8, tvPrize: 10000, wages: 160000, attBase: 400, stadBase: 900 },
    4: { name: "Division 2", tag: "DIV 2", css: "bg-amber-500/20 text-amber-400 border border-amber-500/30", avgOvr: 45, ticket: 5, tvPrize: 4000, wages: 55000, attBase: 200, stadBase: 450 },
    5: { name: "Division 3", tag: "DIV 3", css: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30", avgOvr: 37, ticket: 3, tvPrize: 1500, wages: 18000, attBase: 100, stadBase: 250 },
  },
  NOR: {
    1: { name: "REMA 1000-ligaen", tag: "REMA", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 75, ticket: 24, tvPrize: 110000, wages: 950000, attBase: 2200, stadBase: 4000 },
    2: { name: "1. divisjon", tag: "1. DIV", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 67, ticket: 12, tvPrize: 25000, wages: 480000, attBase: 800, stadBase: 1500 },
    3: { name: "2. divisjon", tag: "2. DIV", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 56, ticket: 8, tvPrize: 10000, wages: 160000, attBase: 400, stadBase: 800 },
    4: { name: "3. divisjon", tag: "3. DIV", css: "bg-amber-500/20 text-amber-400 border border-amber-500/30", avgOvr: 44, ticket: 5, tvPrize: 4000, wages: 55000, attBase: 200, stadBase: 450 },
    5: { name: "4. divisjon", tag: "4. DIV", css: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30", avgOvr: 36, ticket: 3, tvPrize: 1500, wages: 16000, attBase: 100, stadBase: 250 },
  },
  SUI: {
    1: { name: "Quickline Handball League", tag: "QHL", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 73, ticket: 28, tvPrize: 80000, wages: 650000, attBase: 1600, stadBase: 3000 },
    2: { name: "Nationalliga B", tag: "NLB", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 66, ticket: 15, tvPrize: 25000, wages: 350000, attBase: 600, stadBase: 1200 },
    3: { name: "1. Liga", tag: "1. LIGA", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 55, ticket: 10, tvPrize: 10000, wages: 120000, attBase: 300, stadBase: 600 },
  },
  CRO: {
    1: { name: "Premijer liga", tag: "PREM", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 73, ticket: 14, tvPrize: 80000, wages: 500000, attBase: 1200, stadBase: 2800 },
    2: { name: "Prva HRL", tag: "1. HRL", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 65, ticket: 8, tvPrize: 20000, wages: 250000, attBase: 450, stadBase: 1000 },
    3: { name: "Druga HRL", tag: "2. HRL", css: "bg-teal-500/20 text-teal-400 border border-teal-500/30", avgOvr: 55, ticket: 5, tvPrize: 8000, wages: 90000, attBase: 250, stadBase: 600 },
    4: { name: "Treća HRL", tag: "3. HRL", css: "bg-amber-500/20 text-amber-400 border border-amber-500/30", avgOvr: 43, ticket: 4, tvPrize: 3000, wages: 35000, attBase: 150, stadBase: 350 },
    5: { name: "Županijska Liga", tag: "ŽUP", css: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30", avgOvr: 35, ticket: 3, tvPrize: 1000, wages: 12000, attBase: 80, stadBase: 200 },
  },
  AUT: {
    1: { name: "HLA MEISTERLIGA", tag: "HLA", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 72, ticket: 20, tvPrize: 80000, wages: 420000, attBase: 1200, stadBase: 2500 },
    2: { name: "HLA CHALLENGE", tag: "HLA 2", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 66, ticket: 10, tvPrize: 20000, wages: 250000, attBase: 450, stadBase: 1000 },
    3: { name: "Landesliga", tag: "LAND", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 55, ticket: 6, tvPrize: 6000, wages: 75000, attBase: 200, stadBase: 500 },
  },
  ISL: {
    1: { name: "Úrvalsdeild", tag: "URVAL", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 71, ticket: 18, tvPrize: 60000, wages: 280000, attBase: 800, stadBase: 1800 },
    2: { name: "1. deild", tag: "1. DEILD", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 64, ticket: 10, tvPrize: 18000, wages: 155000, attBase: 300, stadBase: 700 },
    3: { name: "2. deild", tag: "2. DEILD", css: "bg-teal-500/20 text-teal-400 border border-teal-500/30", avgOvr: 54, ticket: 6, tvPrize: 6000, wages: 55000, attBase: 150, stadBase: 400 },
    4: { name: "3. deild", tag: "3. DEILD", css: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30", avgOvr: 44, ticket: 4, tvPrize: 2500, wages: 20000, attBase: 80, stadBase: 200 },
  },
  ROU: {
    1: { name: "Liga Națională", tag: "LIGA NAȚ", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 73, ticket: 14, tvPrize: 120000, wages: 500000, attBase: 1200, stadBase: 2500 },
    2: { name: "Divizia A", tag: "DIV A", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 60, ticket: 8, tvPrize: 30000, wages: 250000, attBase: 400, stadBase: 1000 },
  },
  MKD: {
    1: { name: "Super League", tag: "SUPER", css: "bg-red-500/20 text-red-400 border border-red-500/30", avgOvr: 74, ticket: 14, tvPrize: 150000, wages: 500000, attBase: 2200, stadBase: 4500 },
    2: { name: "First League", tag: "1. LIGA", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 60, ticket: 7, tvPrize: 30000, wages: 85000, attBase: 500, stadBase: 1200 },
  },
  ENG: {
    1: { name: "Premier Handball League", tag: "PHL", css: "bg-purple-500/20 text-purple-400 border border-purple-500/30", avgOvr: 55, ticket: 12, tvPrize: 30000, wages: 350000, attBase: 500, stadBase: 1200 },
    2: { name: "Championship", tag: "CHAMP", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 45, ticket: 6, tvPrize: 10000, wages: 100000, attBase: 200, stadBase: 500 },
  },
  SLO: {
    1: { name: "Liga NLB", tag: "NLB", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 74, ticket: 14, tvPrize: 120000, wages: 600000, attBase: 1500, stadBase: 3500 },
    2: { name: "1. B DRL", tag: "1. B", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 61, ticket: 8, tvPrize: 25000, wages: 250000, attBase: 450, stadBase: 1000 },
  },
  ITA: {
    1: { name: "Serie A Gold", tag: "A GOLD", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 70, ticket: 12, tvPrize: 70000, wages: 450000, attBase: 900, stadBase: 2000 },
    2: { name: "Serie A Silver", tag: "A SILVER", css: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", avgOvr: 58, ticket: 7, tvPrize: 20000, wages: 180000, attBase: 350, stadBase: 800 },
  },
  USA: {
    1: { name: "Premier Handball Tour", tag: "USATH", css: "bg-blue-500/20 text-blue-400 border border-blue-500/30", avgOvr: 62, ticket: 15, tvPrize: 50000, wages: 400000, attBase: 600, stadBase: 2000 },
  },
  ECU: {
    1: { name: "Liga Nacional de Balonmano", tag: "LNB", css: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", avgOvr: 52, ticket: 5, tvPrize: 15000, wages: 120000, attBase: 300, stadBase: 1000 },
  },
};

export const LEAGUES: Record<number, LeagueInfo> = COUNTRY_LEAGUES.GER;

export const normalizeCountryCode = (country: string | undefined): string => {
  if (!country) return 'GER';
  const c = country.trim().toUpperCase();
  if (c === 'GER' || c === 'GERMANY' || c === 'DEUTSCHLAND') return 'GER';
  if (c === 'POL' || c === 'POLAND' || c === 'POLSKA') return 'POL';
  if (c === 'AUT' || c === 'AUSTRIA' || c === 'ÖSTERREICH' || c === 'OESTERREICH') return 'AUT';
  if (c === 'SUI' || c === 'SWITZERLAND' || c === 'SCHWEIZ' || c === 'CHE') return 'SUI';
  if (c === 'DEN' || c === 'DENMARK' || c === 'DANMARK') return 'DEN';
  if (c === 'FRA' || c === 'FRANCE') return 'FRA';
  if (c === 'ESP' || c === 'SPAIN' || c === 'ESPAÑA') return 'ESP';
  if (c === 'SWE' || c === 'SWEDEN' || c === 'SVERIGE') return 'SWE';
  if (c === 'CRO' || c === 'CROATIA' || c === 'HRVATSKA') return 'CRO';
  if (c === 'POR' || c === 'PORTUGAL') return 'POR';
  if (c === 'NOR' || c === 'NORWAY' || c === 'NORGE') return 'NOR';
  if (c === 'HUN' || c === 'HUNGARY' || c === 'MAGYARORSZÁG') return 'HUN';
  if (c === 'ISL' || c === 'ICELAND' || c === 'ÍSLAND') return 'ISL';
  if (c === 'ROU' || c === 'ROMANIA' || c === 'ROMÂNIA') return 'ROU';
  if (c === 'MKD' || c === 'NORTH MACEDONIA' || c === 'MACEDONIA') return 'MKD';
  if (c === 'SLO' || c === 'SLOVENIA' || c === 'SLOVENIJA') return 'SLO';
  if (c === 'ITA' || c === 'ITALY' || c === 'ITALIA') return 'ITA';
  if (c === 'USA' || c === 'UNITED STATES' || c === 'US') return 'USA';
  if (c === 'ECU' || c === 'ECUADOR') return 'ECU';
  return c;
};

export function normalizeCountry(country: string | undefined): string {
  return normalizeCountryCode(country);
}

export interface CorporateEntityInfo {
  legalForm: string;
  fullName: string;
  fullNameDe: string;
  tickerLabel: string;
  headerBadge: string;
}

/**
 * Returns country-accurate legal form and capital markets nomenclature.
 * Explicit rule: NEVER use 'AG' for the stock market unless in Germany (GER).
 */
export function getCorporateEntityInfo(countryRaw?: string): CorporateEntityInfo {
  const c = normalizeCountry(countryRaw || 'GER');
  if (c === 'GER') {
    return {
      legalForm: 'AG',
      fullName: 'Public Corporation (AG)',
      fullNameDe: 'Börsennotierte Aktiengesellschaft',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Corporation (AG)'
    };
  }
  if (c === 'POR') {
    return {
      legalForm: 'SAD',
      fullName: 'Public Sports Corporation (SAD)',
      fullNameDe: 'Börsennotierte Sport-Aktiengesellschaft (SAD)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Sports Corporation (SAD)'
    };
  }
  if (c === 'ESP') {
    return {
      legalForm: 'SAD',
      fullName: 'Public Sports Corporation (SAD)',
      fullNameDe: 'Börsennotierte Sport-Aktiengesellschaft (SAD)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Sports Corporation (SAD)'
    };
  }
  if (c === 'FRA') {
    return {
      legalForm: 'SASP',
      fullName: 'Professional Sports Corporation (SASP)',
      fullNameDe: 'Börsennotierte Sportgesellschaft (SASP)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Sports Corporation (SASP)'
    };
  }
  if (c === 'DEN') {
    return {
      legalForm: 'A/S',
      fullName: 'Public Limited Company (A/S)',
      fullNameDe: 'Börsennotierte Aktiengesellschaft (A/S)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Corporation (A/S)'
    };
  }
  if (c === 'SWE') {
    return {
      legalForm: 'AB',
      fullName: 'Public Limited Company (AB)',
      fullNameDe: 'Börsennotierte Aktiengesellschaft (AB)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Corporation (AB)'
    };
  }
  if (c === 'NOR') {
    return {
      legalForm: 'AS',
      fullName: 'Public Limited Company (AS)',
      fullNameDe: 'Börsennotierte Aktiengesellschaft (AS)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Corporation (AS)'
    };
  }
  if (c === 'POL') {
    return {
      legalForm: 'S.A.',
      fullName: 'Joint-Stock Company (S.A.)',
      fullNameDe: 'Börsennotierte Aktiengesellschaft (S.A.)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Corporation (S.A.)'
    };
  }
  if (c === 'HUN') {
    return {
      legalForm: 'Nyrt.',
      fullName: 'Public Company Limited by Shares (Nyrt.)',
      fullNameDe: 'Börsennotierte Aktiengesellschaft (Nyrt.)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Corporation (Nyrt.)'
    };
  }
  if (c === 'CRO' || c === 'SLO') {
    return {
      legalForm: 'd.d.',
      fullName: 'Joint-Stock Company (d.d.)',
      fullNameDe: 'Börsennotierte Aktiengesellschaft (d.d.)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Corporation (d.d.)'
    };
  }
  if (c === 'MKD') {
    return {
      legalForm: 'AD',
      fullName: 'Joint-Stock Company (AD)',
      fullNameDe: 'Börsennotierte Aktiengesellschaft (AD)',
      tickerLabel: 'Ticker',
      headerBadge: 'Listed Corporation (AD)'
    };
  }
  return {
    legalForm: 'PLC',
    fullName: 'Public Limited Company (PLC)',
    fullNameDe: 'Börsennotierte Kapitalgesellschaft (PLC)',
    tickerLabel: 'Ticker',
    headerBadge: 'Listed Public Corporation (PLC)'
  };
}

export const getMaxTier = (country: string = 'GER'): number => {
  const normCountry = normalizeCountry(country) || 'GER';
  const activeClubs = getActiveClubs(normCountry);
  let activeMax = 0;
  for (const c of activeClubs) {
    if (normalizeCountry(c.country || 'GER') === normCountry && c.tier > activeMax) {
      activeMax = c.tier;
    }
  }
  if (activeMax > 0 && activeClubs !== ALL_CLUBS) {
    return Math.max(activeMax, 1);
  }
  let max = Math.max(1, activeMax);
  if (COUNTRY_LEAGUES[normCountry]) {
    const definedTiers = Object.keys(COUNTRY_LEAGUES[normCountry]).map(Number);
    if (definedTiers.length > 0) {
      max = Math.max(...definedTiers);
    }
  }
  for (const c of getActiveClubs(normCountry)) {
    if (normalizeCountry(c.country || 'GER') === normCountry && c.tier > max) {
      max = c.tier;
    }
  }
  for (const c of ALL_CLUBS) {
    if (normalizeCountry(c.country || 'GER') === normCountry && c.tier > max) {
      max = c.tier;
    }
  }
  if (Array.isArray(handballBaseDatabase)) {
    for (const c of (handballBaseDatabase as any[])) {
      if (normalizeCountry(c.country || 'GER') === normCountry && c.tier > max) {
        max = c.tier;
      }
    }
  }
  return Math.max(max, 1);
};

export const getLeagueInfo = (tier: number, country: string = 'GER'): LeagueInfo => {
  const normCountry = normalizeCountry(country) || 'GER';
  const countryLeagues = COUNTRY_LEAGUES[normCountry] || COUNTRY_LEAGUES['GER'];
  const safeTier = Math.max(1, tier || 1);
  
  if (countryLeagues && countryLeagues[safeTier]) {
    return countryLeagues[safeTier];
  }

  const countryNames: Record<string, string> = {
    DEN: 'Danish', POL: 'Polish', HUN: 'Hungarian', CRO: 'Croatian', SWE: 'Swedish', ENG: 'English', FRA: 'French', ESP: 'Spanish', POR: 'Portuguese', NOR: 'Norwegian', ISL: 'Icelandic', AUT: 'Austrian', SUI: 'Swiss', ROU: 'Romanian', MKD: 'Macedonian', SLO: 'Slovenian', ITA: 'Italian', USA: 'American', ECU: 'Ecuadorian', GER: 'German'
  };
  const adjective = countryNames[normCountry] || normCountry;
  const cMult = getCountryMult(normCountry);
  
  const clampedGerTier = Math.max(1, Math.min(safeTier, 5));
  const baseLeagueInfo = COUNTRY_LEAGUES['GER'][clampedGerTier] || COUNTRY_LEAGUES['GER'][5] || COUNTRY_LEAGUES['GER'][1];
  const extraDepth = Math.max(0, safeTier - 5);
  const depthScale = extraDepth > 0 ? Math.pow(0.65, extraDepth) : 1;
  
  // For unmapped or custom deep tiers, scale the financial and OVR baselines smoothly
  let defaultName = `${adjective} League ${safeTier}`;
  if (safeTier === 1) defaultName = `${adjective} Pro League`;
  else if (safeTier === 2) defaultName = `${adjective} 2. League`;
  else if (safeTier === 3) defaultName = `${adjective} 3. League`;
  else if (safeTier === 4) defaultName = `${adjective} 4. League`;
  else if (safeTier >= 5) defaultName = `${adjective} Division ${safeTier}`;
  
  return {
    ...baseLeagueInfo,
    name: defaultName,
    tag: `DIV ${safeTier}`,
    avgOvr: Math.max(32, Math.round((baseLeagueInfo.avgOvr || 45) - extraDepth * 5)),
    wages: Math.max(5000, Math.floor(baseLeagueInfo.wages * cMult * depthScale)),
    tvPrize: Math.max(1000, Math.floor(baseLeagueInfo.tvPrize * cMult * depthScale)),
    ticket: Math.max(4, Math.floor(baseLeagueInfo.ticket * cMult * Math.max(0.5, depthScale)))
  };
};

/**
 * Calculates the authentic live league average OVR based on the actual clubs
 * currently competing in the specified division, taking into account dynamic
 * worldClubs evolutions, promotions/relegations, and the user's current squad rating.
 */
export const getDynamicLeagueAvgOvr = (
  state: {
    club: { name: string; tier: number; baseOvr: number; country?: string; id?: string | number; color?: string };
    worldClubs?: Record<string, Club>;
  },
  tierOverride?: number,
  countryOverride?: string
): number => {
  const tier = tierOverride !== undefined ? tierOverride : state.club.tier;
  const country = countryOverride || state.club.country || 'GER';
  const leagueInfo = getLeagueInfo(tier, country);

  // Retrieve active clubs list (respects real data mod or default db)
  const activeClubsList = getActiveClubs(country);
  
  // Merge with live worldClubs state and ensure the user's club is properly up-to-date
  const mergedClubs = activeClubsList.map(c => {
    const fromWorld = state.worldClubs?.[c.id];
    const base = fromWorld ? mergeClubWithWorldState(c, fromWorld) : { ...c };
    if (
      (state.club.id !== undefined && c.id === state.club.id) ||
      (c.name && state.club.name && c.name.trim().toLowerCase() === state.club.name.trim().toLowerCase())
    ) {
      return { ...base, ...state.club };
    }
    return base;
  });

  const normTargetCountry = normalizeCountry(country || 'GER');
  // Filter clubs belonging to this specific tier and country
  const leagueClubs = mergedClubs.filter(
    te => te.tier === tier && normalizeCountry(te.country || 'GER') === normTargetCountry
  );

  // If the user's club is in this tier and country, make sure it is included if missing
  const userInThisLeague = state.club.tier === tier && normalizeCountry(state.club.country || 'GER') === normTargetCountry;
  if (userInThisLeague) {
    const userAlreadyIncluded = leagueClubs.some(
      c => (state.club.id !== undefined && c.id === state.club.id) ||
           (c.name && state.club.name && c.name.trim().toLowerCase() === state.club.name.trim().toLowerCase())
    );
    if (!userAlreadyIncluded) {
      leagueClubs.push({
        id: state.club.id ?? 'user-club',
        name: state.club.name,
        tier: state.club.tier,
        baseOvr: state.club.baseOvr,
        country: normTargetCountry,
        color: state.club.color || '#3b82f6',
      } as Club);
    }
  }

  if (leagueClubs.length > 0) {
    const totalOvr = leagueClubs.reduce((sum, c) => sum + (c.baseOvr || 0), 0);
    return Math.round(totalOvr / leagueClubs.length);
  }

  return leagueInfo.avgOvr || 40;
};

export const getDomesticCupInfo = (country: string = 'GER', tier: number = 1) => {
  const norm = normalizeCountry(country);
  const isRegional = tier >= 4;
  let name = isRegional ? 'Regional Cup' : 'National Cup';
  let logo = '';
  
  if (!isRegional) {
    if (norm === 'GER') { name = 'DHB-Pokal'; }
    else if (norm === 'ESP') { name = 'Copa del Rey'; }
    else if (norm === 'FRA') { name = 'Coupe de France'; }
    else if (norm === 'DEN') { name = 'Santander Cup'; }
    else if (norm === 'SWE') { name = 'ATG Svenska cupen'; }
    else if (norm === 'NOR') { name = 'NM Senior'; }
    else if (norm === 'POR') { name = 'Taça de Portugal'; }
    else if (norm === 'HUN') { name = 'Magyar Kupa'; }
    else if (norm === 'CRO') { name = 'Kup Hrvatske'; }
    else if (norm === 'POL') { name = 'Puchar Polski'; }
    else if (norm === 'AUT') { name = 'ÖHB-Cup'; }
    else if (norm === 'SUI') { name = 'Mobiliar Handball Cup'; }
    else if (norm === 'ISL') { name = 'Coca-Cola bikarinn'; }
    else if (norm === 'ROU') { name = 'Cupa României'; }
    else if (norm === 'MKD') { name = 'Kup na Makedonija'; }
    else if (norm === 'SLO') { name = 'Pokal Slovenije'; }
    else if (norm === 'ITA') { name = 'Coppa Italia'; }
    else if (norm === 'ENG') { name = 'National Cup'; }
    else if (norm === 'USA') { name = 'USATH National Championship'; }
    else if (norm === 'ECU') { name = 'Copa Ecuador'; }
  }

  return {
    name,
    logo,
    tag: isRegional ? 'REGIONAL' : 'CUP',
  };
};

export interface SupercupInfo {
  name: string;
  shortTag: string;
  arena: string;
  city: string;
  capacity: number;
  prizeMoney: number;
  runnerUpMoney: number;
  subtitle: string;
  country: string;
}

export const getDomesticSupercupInfo = (
  country: string = 'GER',
  isModActive: boolean = isAnyModActive()
): SupercupInfo => {
  const norm = normalizeCountry(country || 'GER');

  const MOD_MAP: Record<string, Omit<SupercupInfo, 'country' | 'shortTag' | 'subtitle'>> = {
    GER: { name: 'HBL Supercup', arena: 'PSD Bank Dome, Düsseldorf', city: 'Düsseldorf', capacity: 13200, prizeMoney: 350000, runnerUpMoney: 175000 },
    FRA: { name: 'Trophée des Champions', arena: 'Arena Futuroscope, Poitiers', city: 'Poitiers', capacity: 6000, prizeMoney: 280000, runnerUpMoney: 140000 },
    ESP: { name: 'Supercopa Ibérica', arena: 'Palacio de Deportes de Santander', city: 'Santander', capacity: 6000, prizeMoney: 220000, runnerUpMoney: 110000 },
    DEN: { name: 'Bambusa Super Cup', arena: 'Gigantium, Aalborg', city: 'Aalborg', capacity: 5600, prizeMoney: 220000, runnerUpMoney: 110000 },
    POL: { name: 'Superpuchar Polski', arena: 'Atlas Arena, Łódź', city: 'Łódź', capacity: 10400, prizeMoney: 220000, runnerUpMoney: 110000 },
    HUN: { name: 'Magyar Szuperkupa', arena: 'MVM Dome, Budapest', city: 'Budapest', capacity: 20022, prizeMoney: 220000, runnerUpMoney: 110000 },
    POR: { name: 'Supertaça de Portugal', arena: 'Pavilhão Multiusos de Sines', city: 'Sines', capacity: 2800, prizeMoney: 160000, runnerUpMoney: 80000 },
    SWE: { name: 'Svenska Supercupen', arena: 'Avicii Arena, Stockholm', city: 'Stockholm', capacity: 13850, prizeMoney: 180000, runnerUpMoney: 90000 },
    NOR: { name: 'Norsk Supercup', arena: 'Oslo Spektrum', city: 'Oslo', capacity: 8600, prizeMoney: 180000, runnerUpMoney: 90000 },
    CRO: { name: 'Hrvatski Superkup', arena: 'Dvorana Gradski vrt, Osijek', city: 'Osijek', capacity: 4438, prizeMoney: 150000, runnerUpMoney: 75000 },
    SUI: { name: 'SHV Supercup', arena: 'Gottardo Arena, Ambri', city: 'Ambri', capacity: 6775, prizeMoney: 160000, runnerUpMoney: 80000 },
    AUT: { name: 'HLA Supercup', arena: 'BSFZ Südstadt, Maria Enzersdorf', city: 'Maria Enzersdorf', capacity: 3000, prizeMoney: 150000, runnerUpMoney: 75000 },
    ISL: { name: 'Meistarakeppni HSÍ', arena: 'Ásvellir, Hafnarfjörður', city: 'Hafnarfjörður', capacity: 2400, prizeMoney: 110000, runnerUpMoney: 55000 },
    ROU: { name: 'Supercupa României', arena: 'Sala Polivalentă, Bucharest', city: 'Bucharest', capacity: 5300, prizeMoney: 160000, runnerUpMoney: 80000 },
    MKD: { name: 'Superkup na Makedonija', arena: 'Jane Sandanski Arena, Skopje', city: 'Skopje', capacity: 6500, prizeMoney: 150000, runnerUpMoney: 75000 },
    SLO: { name: 'Superpokal Slovenije', arena: 'Dvorana Bonifika, Koper', city: 'Koper', capacity: 3200, prizeMoney: 150000, runnerUpMoney: 75000 },
    ITA: { name: 'Supercoppa Italiana', arena: 'PalaGeorge, Montichiari', city: 'Montichiari', capacity: 4500, prizeMoney: 120000, runnerUpMoney: 60000 },
    ENG: { name: 'EHA Super Cup', arena: 'Copper Box Arena, London', city: 'London', capacity: 7400, prizeMoney: 100000, runnerUpMoney: 50000 },
    USA: { name: 'USATH Super Cup', arena: 'Allstate Arena, Chicago', city: 'Chicago', capacity: 12500, prizeMoney: 120000, runnerUpMoney: 60000 },
    ECU: { name: 'Supercopa de Ecuador', arena: 'Coliseo General Rumiñahui, Quito', city: 'Quito', capacity: 8000, prizeMoney: 90000, runnerUpMoney: 45000 },
  };

  const FICTIONAL_MAP: Record<string, Omit<SupercupInfo, 'country' | 'shortTag' | 'subtitle'>> = {
    GER: { name: 'German Supercup', arena: 'Düsseldorf Dome, Düsseldorf', city: 'Düsseldorf', capacity: 13200, prizeMoney: 350000, runnerUpMoney: 175000 },
    FRA: { name: 'French Supercup', arena: 'Poitiers Arena, Poitiers', city: 'Poitiers', capacity: 6000, prizeMoney: 280000, runnerUpMoney: 140000 },
    ESP: { name: 'Spanish Supercup', arena: 'Santander Sports Palace, Santander', city: 'Santander', capacity: 6000, prizeMoney: 220000, runnerUpMoney: 110000 },
    DEN: { name: 'Danish Supercup', arena: 'Aalborg Arena, Aalborg', city: 'Aalborg', capacity: 5600, prizeMoney: 220000, runnerUpMoney: 110000 },
    POL: { name: 'Polish Supercup', arena: 'Łódź Arena, Łódź', city: 'Łódź', capacity: 10400, prizeMoney: 220000, runnerUpMoney: 110000 },
    HUN: { name: 'Hungarian Supercup', arena: 'Budapest Dome, Budapest', city: 'Budapest', capacity: 20022, prizeMoney: 220000, runnerUpMoney: 110000 },
    POR: { name: 'Portuguese Supercup', arena: 'Sines Multipurpose Hall, Sines', city: 'Sines', capacity: 2800, prizeMoney: 160000, runnerUpMoney: 80000 },
    SWE: { name: 'Swedish Supercup', arena: 'Stockholm Globe Arena, Stockholm', city: 'Stockholm', capacity: 13850, prizeMoney: 180000, runnerUpMoney: 90000 },
    NOR: { name: 'Norwegian Supercup', arena: 'Oslo Indoor Arena, Oslo', city: 'Oslo', capacity: 8600, prizeMoney: 180000, runnerUpMoney: 90000 },
    CRO: { name: 'Croatian Supercup', arena: 'Osijek Sports Hall, Osijek', city: 'Osijek', capacity: 4438, prizeMoney: 150000, runnerUpMoney: 75000 },
    SUI: { name: 'Swiss Supercup', arena: 'Ambri Arena, Ambri', city: 'Ambri', capacity: 6775, prizeMoney: 160000, runnerUpMoney: 80000 },
    AUT: { name: 'Austrian Supercup', arena: 'Südstadt Arena, Vienna South', city: 'Vienna South', capacity: 3000, prizeMoney: 150000, runnerUpMoney: 75000 },
    ISL: { name: 'Icelandic Supercup', arena: 'Hafnarfjörður Hall, Hafnarfjörður', city: 'Hafnarfjörður', capacity: 2400, prizeMoney: 110000, runnerUpMoney: 55000 },
    ROU: { name: 'Romanian Supercup', arena: 'Bucharest National Hall, Bucharest', city: 'Bucharest', capacity: 5300, prizeMoney: 160000, runnerUpMoney: 80000 },
    MKD: { name: 'Macedonian Supercup', arena: 'Skopje Indoor Arena, Skopje', city: 'Skopje', capacity: 6500, prizeMoney: 150000, runnerUpMoney: 75000 },
    SLO: { name: 'Slovenian Supercup', arena: 'Koper Coastal Arena, Koper', city: 'Koper', capacity: 3200, prizeMoney: 150000, runnerUpMoney: 75000 },
    ITA: { name: 'Italian Supercup', arena: 'Montichiari Indoor Arena, Montichiari', city: 'Montichiari', capacity: 4500, prizeMoney: 120000, runnerUpMoney: 60000 },
    ENG: { name: 'English Supercup', arena: 'London Olympic Box, London', city: 'London', capacity: 7400, prizeMoney: 100000, runnerUpMoney: 50000 },
    USA: { name: 'US National Supercup', arena: 'Chicago Indoor Arena, Chicago', city: 'Chicago', capacity: 12500, prizeMoney: 120000, runnerUpMoney: 60000 },
    ECU: { name: 'Ecuadorian Supercup', arena: 'Quito National Coliseum, Quito', city: 'Quito', capacity: 8000, prizeMoney: 90000, runnerUpMoney: 45000 },
  };

  const entry = (isModActive ? MOD_MAP[norm] : FICTIONAL_MAP[norm]) ||
    (isModActive ? MOD_MAP.GER : FICTIONAL_MAP.GER);

  return {
    ...entry,
    country: norm,
    shortTag: 'SUPERCUP',
    subtitle: 'League Champion vs. Cup Winner • Season Curtain-Raiser',
  };
};

export const getEuropeanSupercupInfo = (
  isModActive: boolean = isAnyModActive()
): SupercupInfo => {
  return {
    name: isModActive ? 'EHF European Supercup' : 'Continental Supercup',
    shortTag: 'EURO SUPERCUP',
    arena: isModActive ? 'Lanxess Arena, Cologne' : 'Continental Supercup Arena, Cologne',
    city: 'Cologne',
    capacity: 19750,
    prizeMoney: 650000,
    runnerUpMoney: 300000,
    subtitle: 'Champions League Winner vs. European League Winner • Continental Opener',
    country: 'EUR',
  };
};

export const getQualifiedSupercupMatches = (
  state: any,
  clubsDb: Club[] = [],
  isModActive: boolean = isAnyModActive()
): any[] => {
  if (!state || !state.club) return [];
  if (state.supercupPlayedYear === state.year) return [];
  if ((state.club as any).isReserve) return [];

  const country = normalizeCountry(state.club.country || 'GER');
  const pool = clubsDb && clubsDb.length > 0 ? clubsDb : getActiveClubs(country);
  const mergedClubs: Club[] = pool.map(c => {
    const fromWorld = state.worldClubs?.[c.id];
    const base = fromWorld ? mergeClubWithWorldState(c, fromWorld) : { ...c };
    if (String(c.id) === String(state.club.id) || c.name === state.club.name) {
      return { ...base, ...state.club };
    }
    return base;
  });

  const domesticTier1Clubs = mergedClubs
    .filter(c => normalizeCountry(c.country || 'GER') === country && c.tier === 1 && !(c as any).isReserve)
    .sort((a, b) => (b.baseOvr || 0) - (a.baseOvr || 0) || (b.rep || 0) - (a.rep || 0) || String(a.id).localeCompare(String(b.id)));

  const otherDomesticTier1 = domesticTier1Clubs.filter(
    c => String(c.id) !== String(state.club.id) && c.name !== state.club.name
  );

  const matches: any[] = [];
  const hasHistory = Array.isArray(state.history) && state.history.length > 0;
  const lastHist = hasHistory ? state.history[state.history.length - 1] : null;

  // Check Domestic Supercup Qualification (League Champion vs. Cup Winner)
  let domesticQualified = false;
  let userDomesticRole = 'League Champion';
  let oppDomesticRole = 'Cup Winner';
  let oppClub: Club | undefined;
  let explicitOppName: string | undefined;

  if (lastHist) {
    const lastHistClub = mergedClubs.find(
      c =>
        (lastHist.clubId !== undefined && String(c.id) === String(lastHist.clubId)) ||
        c.name === lastHist.clubName
    );
    const sameClubAsLastSeason =
      (lastHist.clubId !== undefined && String(lastHist.clubId) === String(state.club.id)) ||
      lastHist.clubName === state.club.name;
    const sameCountryAsLastSeason =
      sameClubAsLastSeason ||
      (lastHistClub ? normalizeCountry(lastHistClub.country || 'GER') === country : false);
    const canUseLastHistTable = sameCountryAsLastSeason && (lastHist.tier === 1 || lastHist.tier === undefined);
    const domesticRivalFallback =
      sameClubAsLastSeason && lastHist.rivalName && lastHist.rivalName !== state.club.name
        ? lastHist.rivalName
        : undefined;

    const wonLeague = sameClubAsLastSeason
      ? ((lastHist.trophiesThisYear?.bl || 0) > 0 || (lastHist.tier === 1 && lastHist.pos === 1))
      : Boolean(
          lastHist.universeMovements?.some(
            (m: any) =>
              m.type === 'champion' &&
              m.fromTier === 1 &&
              normalizeCountry(m.country || 'GER') === country &&
              m.clubName === state.club.name
          )
        );

    const cupInfo = getDomesticCupInfo(country, 1);
    const cupWinnerFromMovements = lastHist.universeMovements?.find(
      (m: any) =>
        m.type === 'intl_cup' &&
        normalizeCountry(m.country || 'GER') === country &&
        (String(m.id || '').endsWith('-cup-dfb') ||
          (m.cupTitle && m.cupTitle.toLowerCase() === cupInfo.name.toLowerCase()))
    )?.clubName;

    const natCupFinalFromContext = sameCountryAsLastSeason
      ? lastHist.resolvedMatchContext?.cupFinals?.['nat_cup']
      : undefined;

    const wonCup = sameClubAsLastSeason
      ? ((lastHist.trophiesThisYear?.dfb || 0) > 0 || Boolean(natCupFinalFromContext?.userWon))
      : (natCupFinalFromContext?.winnerName === state.club.name || cupWinnerFromMovements === state.club.name);

    if (wonLeague || wonCup) {
      domesticQualified = true;

      if (wonLeague && wonCup) {
        userDomesticRole = 'Domestic Double Winner';
        oppDomesticRole = 'League Runner-Up';
        const runnerUpFromTable = canUseLastHistTable
          ? lastHist.finalTable?.find(
              (row: any) => (row.pos === 2 || row.rank === 2) && row.name !== state.club.name && row.clubName !== state.club.name
            )
          : undefined;
        explicitOppName = runnerUpFromTable?.name || runnerUpFromTable?.clubName || domesticRivalFallback;
      } else if (wonLeague) {
        userDomesticRole = 'League Champion';
        oppDomesticRole = `${cupInfo.name} Winner`;
        const cupWinnerName = natCupFinalFromContext?.winnerName || cupWinnerFromMovements;
        if (cupWinnerName && cupWinnerName !== state.club.name) {
          explicitOppName = cupWinnerName;
        } else {
          const runnerUpFromTable = canUseLastHistTable
            ? lastHist.finalTable?.find(
                (row: any) => (row.pos === 2 || row.rank === 2) && row.name !== state.club.name && row.clubName !== state.club.name
              )
            : undefined;
          explicitOppName = runnerUpFromTable?.name || runnerUpFromTable?.clubName || domesticRivalFallback;
        }
      } else {
        userDomesticRole = `${cupInfo.name} Winner`;
        oppDomesticRole = 'League Champion';
        const champFromTable = canUseLastHistTable
          ? lastHist.finalTable?.find(
              (row: any) => (row.pos === 1 || row.rank === 1) && row.name !== state.club.name && row.clubName !== state.club.name
            )
          : undefined;
        const champFromMovements = lastHist.universeMovements?.find(
          (m: any) => m.type === 'champion' && m.fromTier === 1 && normalizeCountry(m.country || 'GER') === country && m.clubName !== state.club.name
        )?.clubName;
        explicitOppName = champFromTable?.name || champFromTable?.clubName || champFromMovements || domesticRivalFallback;
      }
    }
  } else if (state.club.tier === 1) {
    // Season 1 Opener: Top 2 clubs in Tier 1 of the country contest the inaugural Supercup Curtain-Raiser
    const userRankIdx = domesticTier1Clubs.findIndex(
      c => String(c.id) === String(state.club.id) || c.name === state.club.name
    );
    if (userRankIdx === 0 || userRankIdx === 1) {
      domesticQualified = true;
      const cupInfo = getDomesticCupInfo(country, 1);
      if (userRankIdx === 0) {
        userDomesticRole = 'Reigning League Champion';
        oppDomesticRole = `Reigning ${cupInfo.name} Winner`;
        oppClub = domesticTier1Clubs[1] || otherDomesticTier1[0];
      } else {
        userDomesticRole = `Reigning ${cupInfo.name} Winner`;
        oppDomesticRole = 'Reigning League Champion';
        oppClub = domesticTier1Clubs[0] || otherDomesticTier1[0];
      }
    }
  }

  if (domesticQualified) {
    const domInfo = getDomesticSupercupInfo(country, isModActive);
    if (!oppClub && explicitOppName) {
      const matchedInCountry = mergedClubs.find(
        c =>
          c.name === explicitOppName &&
          normalizeCountry(c.country || 'GER') === country &&
          String(c.id) !== String(state.club.id)
      );
      if (matchedInCountry) {
        oppClub = matchedInCountry;
      } else {
        const isForeignClub = mergedClubs.some(
          c => c.name === explicitOppName && normalizeCountry(c.country || 'GER') !== country
        );
        if (isForeignClub) {
          explicitOppName = undefined;
        }
      }
    }
    if (!oppClub) {
      oppClub = otherDomesticTier1[0];
    }

    const fallbackLeagueAvg = getLeagueInfo(1, country, state)?.avgOvr || 75;
    const oppName = oppClub?.name || explicitOppName || 'National Rival';
    const oppOvr = Math.max(52, Math.min(94, oppClub?.baseOvr || Math.round(fallbackLeagueAvg + 4)));
    const userOvr = state.club.baseOvr || fallbackLeagueAvg;
    const baseWinProb = Math.round(Math.max(0.15, Math.min(0.85, 0.5 + (userOvr - oppOvr) * 0.02)) * 100);

    matches.push({
      type: 'domestic_supercup',
      title: domInfo.name,
      subtitle: `${userDomesticRole} vs. ${oppDomesticRole} • ${domInfo.arena}`,
      opponent: oppName,
      opponentOvr: oppOvr,
      baseWinProb,
      opponentId: oppClub?.id,
      opponentCountry: country,
      opponentLogo: oppClub?.logo,
      opponentFallbackLogo: oppClub?.fallbackLogo,
      opponentColor: oppClub?.color,
      userQualificationRole: userDomesticRole,
      opponentQualificationRole: oppDomesticRole,
      hostArena: domInfo.arena,
      hostCapacity: domInfo.capacity,
      prizeMoney: domInfo.prizeMoney,
      runnerUpMoney: domInfo.runnerUpMoney,
      country,
    });
  }

  return matches;
};

export const getFAInfo = (country: string = 'GER') => {
  const norm = normalizeCountry(country);
  if (norm === 'GER') {
    return {
      name: 'DHB',
      full: 'Deutscher Handballbund',
      cup: 'DHB-Pokal',
      cupLogo: '',
      arenaFinal: 'Lanxess Arena, Cologne',
    };
  }
  if (norm === 'ESP') {
    return {
      name: 'RFEBM',
      full: 'Real Federación Española de Balonmano',
      cup: 'Copa del Rey',
      cupLogo: '',
      arenaFinal: 'Wizink Center, Madrid',
    };
  }
  if (norm === 'FRA') {
    return {
      name: 'FFHB',
      full: 'Fédération Française de Handball',
      cup: 'Coupe de France',
      cupLogo: '',
      arenaFinal: 'Accor Arena, Paris',
    };
  }
  if (norm === 'DEN') {
    return {
      name: 'DHF',
      full: 'Dansk Håndbold Forbund',
      cup: 'Santander Cup',
      cupLogo: '',
      arenaFinal: 'Jyske Bank Boxen, Herning',
    };
  }
  if (norm === 'SWE') {
    return {
      name: 'SHF',
      full: 'Svenska Handbollförbundet',
      cup: 'ATG Svenska cupen',
      cupLogo: '',
      arenaFinal: 'Partille Arena, Gothenburg',
    };
  }
  if (norm === 'NOR') {
    return {
      name: 'NHF',
      full: 'Norges Håndballforbund',
      cup: 'NM Senior',
      cupLogo: '',
      arenaFinal: 'Unity Arena, Oslo',
    };
  }
  if (norm === 'POR') {
    return {
      name: 'FPA',
      full: 'Federação de Andebol de Portugal',
      cup: 'Taça de Portugal',
      cupLogo: '',
      arenaFinal: 'Pavilhão Multiusos de Guimarães',
    };
  }
  if (norm === 'HUN') {
    return {
      name: 'MKSZ',
      full: 'Magyar Kézilabda Szövetség',
      cup: 'Magyar Kupa',
      cupLogo: '',
      arenaFinal: 'Tatabányai Multifunkcionális Aréna',
    };
  }
  if (norm === 'CRO') {
    return {
      name: 'HRS',
      full: 'Hrvatski rukometni savez',
      cup: 'Kup Hrvatske',
      cupLogo: '',
      arenaFinal: 'Arena Zagreb',
    };
  }
  if (norm === 'POL') {
    return {
      name: 'ZPRP',
      full: 'Związek Piłki Ręcznej w Polsce',
      cup: 'Puchar Polski',
      cupLogo: '',
      arenaFinal: 'Ergo Arena, Gdańsk',
    };
  }
  if (norm === 'AUT') {
    return {
      name: 'ÖHB',
      full: 'Österreichischer Handballbund',
      cup: 'ÖHB-Cup',
      cupLogo: '',
      arenaFinal: 'Steffl Arena, Vienna',
    };
  }
  if (norm === 'SUI') {
    return {
      name: 'SHV',
      full: 'Schweizerischer Handball-Verband',
      cup: 'Mobiliar Handball Cup',
      cupLogo: '',
      arenaFinal: 'Mobiliar Arena, Gümligen',
    };
  }
  if (norm === 'ISL') {
    return {
      name: 'HSÍ',
      full: 'Handknattleikssamband Íslands',
      cup: 'Coca-Cola bikarinn',
      cupLogo: '',
      arenaFinal: 'Laugardalshöll, Reykjavík',
    };
  }
  if (norm === 'ROU') {
    return {
      name: 'FRH',
      full: 'Federația Română de Handbal',
      cup: 'Cupa României',
      cupLogo: '',
      arenaFinal: 'Sala Polivalentă, Bucharest',
    };
  }
  if (norm === 'MKD') {
    return {
      name: 'RFM',
      full: 'Ракометна Федерација на Македонија',
      cup: 'Kup na Makedonija',
      cupLogo: '',
      arenaFinal: 'Boris Trajkovski Arena, Skopje',
    };
  }
  if (norm === 'SLO') {
    return {
      name: 'RZS',
      full: 'Rokometna zveza Slovenije',
      cup: 'Pokal Slovenije',
      cupLogo: '',
      arenaFinal: 'Dvorana Zlatorog, Celje',
    };
  }
  if (norm === 'ITA') {
    return {
      name: 'FIGH',
      full: 'Federazione Italiana Giuoco Handball',
      cup: 'Coppa Italia',
      cupLogo: '',
      arenaFinal: 'Play Hall, Riccione',
    };
  }
  if (norm === 'ENG') {
    return {
      name: 'EHA',
      full: 'England Handball Association',
      cup: 'National Cup',
      cupLogo: '',
      arenaFinal: 'National Cycling Centre, Manchester',
    };
  }
  if (norm === 'USA') {
    return {
      name: 'USATH',
      full: 'USA Team Handball',
      cup: 'USATH National Championship',
      cupLogo: '',
      arenaFinal: 'Spokane Arena, Washington',
    };
  }
  if (norm === 'ECU') {
    return {
      name: 'FEH',
      full: 'Federación Ecuatoriana de Balonmano',
      cup: 'Copa Ecuador',
      cupLogo: '',
      arenaFinal: 'Coliseo Mayor, Guayaquil',
    };
  }
  return {
    name: 'IHF',
    full: 'International Handball Federation',
    cup: 'National Cup',
    cupLogo: '',
    arenaFinal: 'National Arena',
  };
};

export const getRequiredAcademyLevelForYouthPull = (tier: number): number => {
  if (tier === 1) return 4;
  if (tier === 2 || tier === 3) return 3;
  if (tier === 4 || tier === 5) return 2;
  return 1;
};

export const getMaxYouthPullsPerSeason = (tier: number, academyLevel: number = 1): number => {
  // Allow the number of senior squad promotions to scale with the facility level
  return academyLevel; 
};

export const TOURNAMENT_LOGOS: Record<string, string> = {
  dfbPokal: "",
  supercup: "",
  cl: "", // EHF Champions League
  el: "", // EHF European League
  ecl: "", // EHF European Cup
  dfbTeam: "",
  cwc: "", // IHF Super Globe
};

export const COUNTRIES: Record<string, { name: string; flag: string; active: boolean }> = {
  'GER': { name: 'Germany', flag: '🇩🇪', active: true },
  'DEN': { name: 'Denmark', flag: '🇩🇰', active: true },
  'FRA': { name: 'France', flag: '🇫🇷', active: true },
  'ESP': { name: 'Spain', flag: '🇪🇸', active: true },
  'SWE': { name: 'Sweden', flag: '🇸🇪', active: true },
  'CRO': { name: 'Croatia', flag: '🇭🇷', active: true },
  'POR': { name: 'Portugal', flag: '🇵🇹', active: true },
  'NOR': { name: 'Norway', flag: '🇳🇴', active: true },
  'HUN': { name: 'Hungary', flag: '🇭🇺', active: true },
  'ISL': { name: 'Iceland', flag: '🇮🇸', active: true },
  'POL': { name: 'Poland', flag: '🇵🇱', active: true },
  'AUT': { name: 'Austria', flag: '🇦🇹', active: true },
  'SUI': { name: 'Switzerland', flag: '🇨🇭', active: true },
  'ITA': { name: 'Italy', flag: '🇮🇹', active: false },
  'SLO': { name: 'Slovenia', flag: '🇸🇮', active: false },
  'MKD': { name: 'North Macedonia', flag: '🇲🇰', active: false },
  'USA': { name: 'United States', flag: '🇺🇸', active: false },
  'ECU': { name: 'Ecuador', flag: '🇪🇨', active: false },
};

export const getCountryFlag = (countryCode?: string): string => {
  if (!countryCode) return '🌐';
  const clean = countryCode.trim().toUpperCase();
  return COUNTRIES[clean]?.flag || '🌐';
};

export const isCountryModOnly = (countryCode: string): boolean => {
  return ['POL', 'AUT', 'SUI'].includes((countryCode || '').trim().toUpperCase());
};

export interface SponsorBrand {
  name: string;
  fallbackName?: string;
  fullName: string;
  tag: string;
  logo: string;
  countries?: string[];
  minTier?: number;
  maxTier?: number;
}

export const SPONSOR_BRANDS: SponsorBrand[] = [
  // ============================================================================
  // GLOBAL / MULTINATIONAL HANDBALL & SPORTSWEAR PARTNERS (TIER 1 & TIER 1-2)
  // ============================================================================
  { name: 'Hummel', fallbackName: 'Hammel', fullName: 'Hummel International', tag: 'KIT & SPORTSWEAR', logo: '🐝', minTier: 1, maxTier: 1 },
  { name: 'Adidas Handball', fallbackName: 'Adidos Handball', fullName: 'Adidas AG', tag: 'GLOBAL APPAREL', logo: '👟', minTier: 1, maxTier: 1 },
  { name: 'Puma Handball', fallbackName: 'Pumo Handball', fullName: 'Puma SE Handball', tag: 'SPORTSWEAR', logo: '🐆', minTier: 1, maxTier: 1 },
  { name: 'Liqui Moly', fallbackName: 'Liqui Motor', fullName: 'Liqui Moly GmbH', tag: 'AUTOMOTIVE LUBRICANTS', logo: '🛢️', minTier: 1, maxTier: 1 },
  { name: 'Mizuno', fallbackName: 'Mizuna', fullName: 'Mizuno Corporation', tag: 'PERFORMANCE FOOTWEAR', logo: '⚡', minTier: 1, maxTier: 1 },
  { name: 'ASICS', fallbackName: 'ASIX', fullName: 'ASICS Indoor', tag: 'COURT FOOTWEAR', logo: '👟', minTier: 1, maxTier: 1 },
  { name: 'Kempa', fallbackName: 'Kempo', fullName: 'Kempa Handball', tag: 'HANDBALL SPECIALIST', logo: '👟', minTier: 1, maxTier: 2 },
  { name: 'Select', fallbackName: 'Selekta', fullName: 'Select Sport A/S', tag: 'OFFICIAL MATCH BALL', logo: '🏐', minTier: 1, maxTier: 2 },
  { name: 'Salming', fallbackName: 'Salmen', fullName: 'Salming Sports', tag: 'INDOOR COURT GEAR', logo: '🏃', minTier: 1, maxTier: 2 },
  { name: 'Erima', fallbackName: 'Erimo', fullName: 'Erima Sportswear', tag: 'TEAMWEAR PARTNER', logo: '👕', minTier: 1, maxTier: 2 },
  { name: 'Craft', fallbackName: 'Kraft Sport', fullName: 'Craft Sportswear', tag: 'PERFORMANCE GEAR', logo: '🧥', minTier: 1, maxTier: 2 },
  { name: 'Molten', fallbackName: 'Moltano', fullName: 'Molten Corporation', tag: 'OFFICIAL EQUIPMENT', logo: '🏐', minTier: 1, maxTier: 2 },

  // ============================================================================
  // GLOBAL / EUROPEAN CHALLENGER TEAMWEAR & EQUIPMENT (TIER 2-3)
  // ============================================================================
  { name: 'Jako', fallbackName: 'Jaka Sport', fullName: 'JAKO AG Teamwear', tag: 'REGIONAL TEAMWEAR', logo: '👕', minTier: 2, maxTier: 3 },
  { name: 'Macron', fallbackName: 'Makron Teamwear', fullName: 'Macron S.p.A.', tag: 'KIT OUTFITTER', logo: '👕', minTier: 2, maxTier: 3 },
  { name: 'Uhlsport', fallbackName: 'Uhl-Sport', fullName: 'uhlsport GmbH', tag: 'INDOOR GEAR', logo: '👟', minTier: 2, maxTier: 3 },
  { name: 'Kappa Teamwear', fallbackName: 'Kappo Teamwear', fullName: 'Kappa Indoor Sport', tag: 'CLUB APPAREL', logo: '👕', minTier: 2, maxTier: 3 },
  { name: 'Capelli Sport', fallbackName: 'Kapelli Sport', fullName: 'Capelli Teamwear', tag: 'TEAM OUTFITTER', logo: '👟', minTier: 2, maxTier: 3 },
  { name: 'Trimona', fallbackName: 'Trimono Grip', fullName: 'Trimona Handball Wax', tag: 'COURT EQUIPMENT', logo: '🧴', minTier: 2, maxTier: 3 },
  { name: 'Derbystar', fallbackName: 'Derbystar Sport', fullName: 'Derbystar Sportartikelfabrik', tag: 'BALL & KIT PARTNER', logo: '🏐', minTier: 2, maxTier: 3 },
  { name: 'Kelme Indoor', fallbackName: 'Kelmo Indoor', fullName: 'Kelme Sports', tag: 'INDOOR FOOTWEAR', logo: '👟', minTier: 2, maxTier: 3 },

  // ============================================================================
  // LOWER-LEAGUE & GRASSROOTS TEAMWEAR / KIT SUPPLIERS (TIER 3-6)
  // ============================================================================
  { name: 'Saller', fallbackName: 'Salar Teamsport', fullName: 'Sport-Saller e.K.', tag: 'CLUB TEAMWEAR', logo: '👕', minTier: 3, maxTier: 6 },
  { name: 'Stanno', fallbackName: 'Stano Indoor', fullName: 'Stanno Teamwear', tag: 'INDOOR TEAMWEAR', logo: '👕', minTier: 3, maxTier: 6 },
  { name: 'Patrick', fallbackName: 'Patrik Sport', fullName: 'Patrick Sportswear', tag: 'AMATEUR KIT SUPPLIER', logo: '👟', minTier: 3, maxTier: 6 },
  { name: 'Acerbis Teamwear', fallbackName: 'Akerbis Team', fullName: 'Acerbis Sport', tag: 'LOCAL KIT PARTNER', logo: '👕', minTier: 3, maxTier: 6 },
  { name: 'ProTouch', fallbackName: 'ProTakt Indoor', fullName: 'PRO TOUCH Indoor', tag: 'COURT EQUIPMENT', logo: '🏐', minTier: 3, maxTier: 6 },
  { name: 'Masita', fallbackName: 'Masito Sport', fullName: 'Masita Sportswear', tag: 'GRASSROOTS TEAMWEAR', logo: '👕', minTier: 3, maxTier: 6 },
  { name: 'Luanvi', fallbackName: 'Luanva Sport', fullName: 'Luanvi Teamwear', tag: 'CLUB APPAREL', logo: '👕', minTier: 3, maxTier: 6 },

  // ============================================================================
  // GERMANY (GER) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'Lidl', fallbackName: 'Lidel', fullName: 'Lidl Stiftung & Co. KG', tag: 'RETAIL PARTNER', logo: '🛒', countries: ['GER'], minTier: 1, maxTier: 1 },
  { name: 'SAP', fallbackName: 'SYP Systems', fullName: 'SAP SE', tag: 'ENTERPRISE TECH', logo: '💻', countries: ['GER'], minTier: 1, maxTier: 1 },
  { name: 'REWE', fallbackName: 'REWA', fullName: 'REWE Group', tag: 'RETAIL GROUP', logo: '🛒', countries: ['GER'], minTier: 1, maxTier: 1 },
  { name: 'DEKRA', fallbackName: 'DEKRO', fullName: 'DEKRA SE', tag: 'SAFETY & INSPECTION', logo: '✅', countries: ['GER'], minTier: 1, maxTier: 1 },
  { name: 'Würth', fallbackName: 'Wuerthner', fullName: 'Adolf Würth GmbH', tag: 'INDUSTRIAL PARTNER', logo: '🔩', countries: ['GER'], minTier: 1, maxTier: 1 },
  { name: 'Krombacher', fallbackName: 'Krombach', fullName: 'Krombacher Brauerei', tag: 'BREWERY PARTNER', logo: '🍺', countries: ['GER'], minTier: 1, maxTier: 1 },
  { name: 'Fielmann', fallbackName: 'Fielman Optics', fullName: 'Fielmann Group AG', tag: 'OPTICAL RETAIL', logo: '👓', countries: ['GER'], minTier: 1, maxTier: 1 },
  { name: 'Provinzial', fallbackName: 'Provinzia', fullName: 'Provinzial Versicherung', tag: 'INSURANCE GROUP', logo: '🛡️', countries: ['GER'], minTier: 1, maxTier: 2 },
  { name: 'Flensburger', fallbackName: 'Flensborger', fullName: 'Flensburger Brauerei', tag: 'BEVERAGE PARTNER', logo: '🍺', countries: ['GER'], minTier: 1, maxTier: 2 },
  { name: 'GETEC', fallbackName: 'GETEK Energy', fullName: 'GETEC Energie Holding', tag: 'ENERGY SOLUTIONS', logo: '🔋', countries: ['GER'], minTier: 1, maxTier: 2 },
  { name: 'Sparkasse', fallbackName: 'Sparbank', fullName: 'Sparkassen-Finanzgruppe', tag: 'BANKING PARTNER', logo: '🏦', countries: ['GER'], minTier: 1, maxTier: 2 },
  { name: 'DEVK', fallbackName: 'DEVKA', fullName: 'DEVK Versicherungen', tag: 'INSURANCE PARTNER', logo: '🛡️', countries: ['GER'], minTier: 1, maxTier: 2 },
  { name: 'GP JOULE', fallbackName: 'GP JULE', fullName: 'GP JOULE GmbH', tag: 'RENEWABLE ENERGY', logo: '🌱', countries: ['GER'], minTier: 1, maxTier: 2 },
  { name: 'SCHWALBE', fallbackName: 'SCHWALBA', fullName: 'Ralf Bohle GmbH', tag: 'MOBILITY PARTNER', logo: '🛞', countries: ['GER'], minTier: 1, maxTier: 2 },
  { name: 'Kaufland', fallbackName: 'Kauffland', fullName: 'Kaufland Stiftung & Co. KG', tag: 'RETAIL PARTNER', logo: '🛒', countries: ['GER', 'CRO', 'POL'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional Mittelstand (GER)
  { name: 'Volksbank Raiffeisen', fallbackName: 'Volks- & Regiobank', fullName: 'Genossenschaftsbank Gruppe', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['GER'], minTier: 2, maxTier: 3 },
  { name: 'AOK Gesundheit', fallbackName: 'AOKA Gesundheit', fullName: 'AOK Gesundheitskasse', tag: 'HEALTH PARTNER', logo: '🏥', countries: ['GER'], minTier: 2, maxTier: 3 },
  { name: 'Bitburger 0,0%', fallbackName: 'Bitburga 0,0%', fullName: 'Bitburger Braugruppe', tag: 'BEVERAGE PARTNER', logo: '🍺', countries: ['GER'], minTier: 2, maxTier: 3 },
  { name: 'Radeberger Gruppe', fallbackName: 'Radeberg Brau', fullName: 'Radeberger Exportbierbrauerei', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['GER'], minTier: 2, maxTier: 3 },
  { name: 'EWE Energie', fallbackName: 'EWA Energie', fullName: 'EWE AG Regionalenergie', tag: 'REGIONAL UTILITY', logo: '⚡', countries: ['GER'], minTier: 2, maxTier: 3 },
  { name: 'enviaM', fallbackName: 'envia Energie', fullName: 'envia Mitteldeutsche Energie', tag: 'REGIONAL POWER', logo: '💡', countries: ['GER'], minTier: 2, maxTier: 3 },
  { name: 'Teutoburger Mineralbrunnen', fallbackName: 'Teutoburg Quelle', fullName: 'Teutoburger Mineralbrunnen GmbH', tag: 'MINERAL WATER', logo: '💧', countries: ['GER'], minTier: 2, maxTier: 3 },
  { name: 'LVM Versicherung', fallbackName: 'LVA Versicherung', fullName: 'LVM Versicherungen Münster', tag: 'REGIONAL INSURANCE', logo: '🛡️', countries: ['GER'], minTier: 2, maxTier: 3 },
  { name: 'Sport-Thieme', fallbackName: 'Sport-Thema', fullName: 'Sport-Thieme GmbH', tag: 'CLUB EQUIPMENT', logo: '🏐', countries: ['GER'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal / Grassroots (GER)
  { name: 'Stadtwerke {city}', fallbackName: 'Kommunalwerke {city}', fullName: 'Stadtwerke {city} GmbH', tag: 'MUNICIPAL UTILITY', logo: '⚡', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Kreissparkasse {city}', fallbackName: 'Kreisbank {city}', fullName: 'Kreissparkasse {city}', tag: 'LOCAL SAVINGS BANK', logo: '🏦', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Volksbank {city}', fallbackName: 'Bürgerbank {city}', fullName: 'Volksbank {city} eG', tag: 'COOPERATIVE BANK', logo: '🏦', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Autohaus {city}', fallbackName: 'Auto-Zentrum {city}', fullName: 'Autohaus {city} GmbH', tag: 'LOCAL DEALERSHIP', logo: '🚗', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Brauhaus {city}', fallbackName: 'Privatbrauerei {city}', fullName: 'Bürgerliches Brauhaus {city}', tag: 'LOCAL BREWERY', logo: '🍺', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Baugeschäft {city}', fallbackName: 'Hochbau {city}', fullName: 'Bauunternehmen {city} & Söhne', tag: 'LOCAL CONSTRUCTION', logo: '🏗️', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Physio & Reha {city}', fallbackName: 'Reha-Praxis {city}', fullName: 'Therapiezentrum {city}', tag: 'LOCAL PHYSIO', logo: '🏥', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Getränke Hoffmann Lokal', fallbackName: 'Getränke Hofman {city}', fullName: 'Getränkefachmarkt {city}', tag: 'BEVERAGE MARKET', logo: '🥤', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Landbäckerei {city}', fallbackName: 'Backhaus {city}', fullName: 'Traditionsbäckerei {city}', tag: 'LOCAL BAKERY', logo: '🥨', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Sanitätshaus {city}', fallbackName: 'Sanitätshaus Vital {city}', fullName: 'Sanitätshaus & Orthopädie {city}', tag: 'ORTHOPEDIC PARTNER', logo: '🩹', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Holzbau & Bedachung {city}', fallbackName: 'Holzbau Meister {city}', fullName: 'Zimmerei & Holzbau {city}', tag: 'LOCAL CRAFTSMEN', logo: '🪚', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Teamsport {city}', fallbackName: 'Sport-Ecke {city}', fullName: 'Teamsport & Druck {city}', tag: 'LOCAL KIT SHOP', logo: '👕', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Rathaus-Apotheke {city}', fallbackName: 'Markt-Apotheke {city}', fullName: 'Stadt-Apotheke {city}', tag: 'LOCAL PHARMACY', logo: '💊', countries: ['GER'], minTier: 3, maxTier: 6 },
  { name: 'Elektro & Solar {city}', fallbackName: 'Haustechnik {city}', fullName: 'Elektrotechnik {city} GmbH', tag: 'LOCAL TRADES', logo: '🔌', countries: ['GER'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // DENMARK (DEN) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'JYSK', fallbackName: 'JYSKA', fullName: 'JYSK Nordic', tag: 'RETAIL DENMARK', logo: '🛋️', countries: ['DEN'], minTier: 1, maxTier: 1 },
  { name: 'Arla', fallbackName: 'Arlo Foods', fullName: 'Arla Foods amba', tag: 'DAIRY NUTRITION', logo: '🥛', countries: ['DEN', 'SWE'], minTier: 1, maxTier: 1 },
  { name: 'Carlsberg', fallbackName: 'Karlsberg', fullName: 'Carlsberg Breweries', tag: 'BEVERAGE PARTNER', logo: '🍺', countries: ['DEN'], minTier: 1, maxTier: 1 },
  { name: 'Grundfos', fallbackName: 'Grundfoss', fullName: 'Grundfos Holding', tag: 'ENGINEERING', logo: '⚙️', countries: ['DEN'], minTier: 1, maxTier: 1 },
  { name: 'Jyske Bank', fallbackName: 'Jyska Bank', fullName: 'Jyske Bank A/S', tag: 'BANKING DENMARK', logo: '🏦', countries: ['DEN'], minTier: 1, maxTier: 1 },
  { name: 'Santander DK', fallbackName: 'Santanda DK', fullName: 'Santander Consumer DK', tag: 'FINANCIAL SERVICES', logo: '🏦', countries: ['DEN'], minTier: 1, maxTier: 1 },
  { name: 'Bambusa', fallbackName: 'Bambuso', fullName: 'Bambusa Denmark', tag: 'APPAREL PARTNER', logo: '🎍', countries: ['DEN'], minTier: 1, maxTier: 2 },
  { name: 'Sparekassen Danmark', fallbackName: 'Sparekasse Nord', fullName: 'Sparekassen Danmark', tag: 'NORDIC BANKING', logo: '🏦', countries: ['DEN'], minTier: 1, maxTier: 2 },
  { name: 'Norlys', fallbackName: 'Nordlys', fullName: 'Norlys Energi & Fiber', tag: 'ENERGY & TELECOM', logo: '💡', countries: ['DEN'], minTier: 1, maxTier: 2 },
  { name: 'STARK', fallbackName: 'STARKA', fullName: 'STARK Group', tag: 'CONSTRUCTION', logo: '🏗️', countries: ['DEN', 'SWE'], minTier: 1, maxTier: 2 },
  { name: 'Sydbank', fallbackName: 'Sydbanken', fullName: 'Sydbank A/S', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['DEN'], minTier: 1, maxTier: 2 },
  { name: 'OK Energi', fallbackName: 'OKay Energi', fullName: 'OK a.m.b.a.', tag: 'ENERGY CO-OP', logo: '⛽', countries: ['DEN'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (DEN)
  { name: 'Spar Nord', fallbackName: 'SparNorden', fullName: 'Spar Nord Bank A/S', tag: 'REGIONAL BANK', logo: '🏦', countries: ['DEN'], minTier: 2, maxTier: 3 },
  { name: 'Royal Unibrew', fallbackName: 'Royal Bryg', fullName: 'Royal Unibrew A/S', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['DEN'], minTier: 2, maxTier: 3 },
  { name: 'Middelfart Sparekasse', fallbackName: 'Bælt Sparekasse', fullName: 'Middelfart Sparekasse', tag: 'SAVINGS BANK', logo: '🏦', countries: ['DEN'], minTier: 2, maxTier: 3 },
  { name: 'NRGi', fallbackName: 'NRG Energi', fullName: 'NRGi Elselskab', tag: 'REGIONAL UTILITY', logo: '⚡', countries: ['DEN'], minTier: 2, maxTier: 3 },
  { name: 'Vestjysk Bank', fallbackName: 'VestBank DK', fullName: 'Vestjysk Bank A/S', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['DEN'], minTier: 2, maxTier: 3 },
  { name: 'Harboe Bryggeri', fallbackName: 'Harbo Bryg', fullName: 'Harboes Bryggeri A/S', tag: 'BEVERAGE PARTNER', logo: '🍺', countries: ['DEN'], minTier: 2, maxTier: 3 },
  { name: 'Sport 24 Team', fallbackName: 'Sport 25 Team', fullName: 'Sport 24 Erhverv & Team', tag: 'TEAMSPORT PARTNER', logo: '👕', countries: ['DEN'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (DEN)
  { name: 'Sparekassen {city}', fallbackName: 'Lokalbank {city}', fullName: 'Lokal Sparekasse {city}', tag: 'LOCAL SAVINGS BANK', logo: '🏦', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: '{city} El & VVS', fallbackName: '{city} Teknik & VVS', fullName: '{city} El-Installation ApS', tag: 'LOCAL TRADES', logo: '🔌', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: '{city} Bryghus', fallbackName: '{city} Lokal-Bryg', fullName: '{city} Mikrobryggeri ApS', tag: 'LOCAL BREWERY', logo: '🍺', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: 'Bilhus {city}', fallbackName: 'Auto-Centret {city}', fullName: '{city} Bilcenter A/S', tag: 'LOCAL DEALERSHIP', logo: '🚗', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: 'Tømrermester {city}', fallbackName: 'Byg & Tømrer {city}', fullName: '{city} Tømrer & Snedker ApS', tag: 'LOCAL CARPENTRY', logo: '🪚', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: 'SuperBrugsen {city}', fallbackName: 'LokalMarked {city}', fullName: 'Brugsforeningen {city}', tag: 'LOCAL GROCER', logo: '🛒', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: '{city} Fysioterapi', fallbackName: '{city} Sundhedshus', fullName: 'Klinik for Fysioterapi {city}', tag: 'LOCAL PHYSIO', logo: '🏥', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: 'Sportigan {city}', fallbackName: 'Teamsport {city}', fullName: 'Sportigan Lokal {city}', tag: 'LOCAL SPORT SHOP', logo: '👕', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: 'Bageriet {city}', fallbackName: 'Håndværksbageren {city}', fullName: '{city} Konditori & Bageri', tag: 'LOCAL BAKERY', logo: '🥨', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: '{city} Fjernvarme', fallbackName: '{city} Forsyning', fullName: '{city} Varmeværk a.m.b.a.', tag: 'MUNICIPAL HEATING', logo: '🔥', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: 'Danbolig {city}', fallbackName: 'LokalMægler {city}', fullName: 'Ejendomsmægler {city}', tag: 'LOCAL REAL ESTATE', logo: '🏠', countries: ['DEN'], minTier: 3, maxTier: 6 },
  { name: '{city} Vognmand', fallbackName: '{city} Transport ApS', fullName: '{city} Vognmandsforretning', tag: 'LOCAL HAULAGE', logo: '🚚', countries: ['DEN'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // FRANCE (FRA) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'Lidl France', fallbackName: 'Lidel France', fullName: 'Lidl SNC France', tag: 'RETAIL FRANCE', logo: '🛒', countries: ['FRA'], minTier: 1, maxTier: 1 },
  { name: 'TotalEnergies', fallbackName: 'Totalia Énergie', fullName: 'TotalEnergies SE', tag: 'GLOBAL ENERGY', logo: '⛽', countries: ['FRA'], minTier: 1, maxTier: 1 },
  { name: 'EDF', fallbackName: 'EDV Énergie', fullName: 'Électricité de France', tag: 'POWER UTILITY', logo: '⚡', countries: ['FRA'], minTier: 1, maxTier: 1 },
  { name: 'Air France', fallbackName: 'Air Franca', fullName: 'Air France-KLM', tag: 'OFFICIAL AIRLINE', logo: '✈️', countries: ['FRA'], minTier: 1, maxTier: 1 },
  { name: 'Orange', fallbackName: 'Oranga Telecom', fullName: 'Orange S.A.', tag: 'TELECOMMUNICATIONS', logo: '📡', countries: ['FRA', 'POL', 'ROU', 'ESP'], minTier: 1, maxTier: 1 },
  { name: 'Carrefour', fallbackName: 'Carrefor', fullName: 'Groupe Carrefour', tag: 'HYPERMARKET', logo: '🛒', countries: ['FRA', 'ESP', 'POL', 'ROU'], minTier: 1, maxTier: 1 },
  { name: 'FDJ', fallbackName: 'FJD Gaming', fullName: 'La Française des Jeux', tag: 'NATIONAL LOTTERY', logo: '🍀', countries: ['FRA'], minTier: 1, maxTier: 1 },
  { name: 'RATP', fallbackName: 'RATB Transit', fullName: 'Groupe RATP', tag: 'URBAN TRANSIT', logo: '🚇', countries: ['FRA'], minTier: 1, maxTier: 1 },
  { name: 'Butagaz', fallbackName: 'Butagas', fullName: 'Butagaz SAS', tag: 'ENERGY PARTNER', logo: '🔥', countries: ['FRA'], minTier: 1, maxTier: 2 },
  { name: 'Crédit Mutuel', fallbackName: 'Crédit Mutual', fullName: 'Crédit Mutuel Alliance', tag: 'BANKING FRANCE', logo: '🏦', countries: ['FRA'], minTier: 1, maxTier: 2 },
  { name: 'Caisse d’Épargne', fallbackName: 'Caisse Épargna', fullName: 'Caisse d’Épargne', tag: 'BANKING GROUP', logo: '🏦', countries: ['FRA'], minTier: 1, maxTier: 2 },
  { name: 'MAIF', fallbackName: 'MAIFA', fullName: 'MAIF Assurances', tag: 'MUTUAL INSURANCE', logo: '🛡️', countries: ['FRA'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (FRA)
  { name: 'Banque Populaire', fallbackName: 'Banque Régionale', fullName: 'Banque Populaire Régionale', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['FRA'], minTier: 2, maxTier: 3 },
  { name: 'Groupama', fallbackName: 'Groupamo', fullName: 'Groupama Assurances Mutuelles', tag: 'REGIONAL INSURANCE', logo: '🛡️', countries: ['FRA'], minTier: 2, maxTier: 3 },
  { name: 'E.Leclerc Régional', fallbackName: 'Leclerq Marché', fullName: 'Centres E.Leclerc', tag: 'REGIONAL RETAIL', logo: '🛒', countries: ['FRA'], minTier: 2, maxTier: 3 },
  { name: 'Harmonie Mutuelle', fallbackName: 'Harmonia Mutuelle', fullName: 'Harmonie Mutuelle Santé', tag: 'HEALTH MUTUAL', logo: '🏥', countries: ['FRA'], minTier: 2, maxTier: 3 },
  { name: 'Pizzorno / Paprec', fallbackName: 'Paprek Services', fullName: 'Groupe Environnement Régional', tag: 'REGIONAL SERVICES', logo: '♻️', countries: ['FRA'], minTier: 2, maxTier: 3 },
  { name: 'Bricomarché', fallbackName: 'Brikomarché', fullName: 'Bricomarché France', tag: 'DIY & HOME', logo: '🛠️', countries: ['FRA'], minTier: 2, maxTier: 3 },
  { name: 'Sport 2000 Pro', fallbackName: 'Sport 2000 Club', fullName: 'Sport 2000 Collectivités', tag: 'CLUB EQUIPMENT', logo: '👕', countries: ['FRA'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (FRA)
  { name: 'Crédit Agricole {city}', fallbackName: 'Caisse Locale {city}', fullName: 'Caisse Locale de {city}', tag: 'LOCAL BANK', logo: '🏦', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Intermarché {city}', fallbackName: 'SuperMarché {city}', fullName: 'Hypermarché Local {city}', tag: 'LOCAL SUPERMARKET', logo: '🛒', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Garage Auto {city}', fallbackName: 'Automobiles {city}', fullName: 'Concessionnaire Auto {city}', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Boulangerie {city}', fallbackName: 'Artisan Boulanger {city}', fullName: 'Boulangerie-Pâtisserie {city}', tag: 'LOCAL BAKERY', logo: '🥖', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'BTP & Maçonnerie {city}', fallbackName: 'Constructions {city}', fullName: 'Entreprise BTP {city} SARL', tag: 'LOCAL CONSTRUCTION', logo: '🏗️', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Brasserie de {city}', fallbackName: 'Brasserie Artisanale {city}', fullName: 'Brasserie Locale de {city}', tag: 'LOCAL BREWERY', logo: '🍺', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Kiné & Santé {city}', fallbackName: 'Centre Paramédical {city}', fullName: 'Cabinet Kinésithérapie {city}', tag: 'LOCAL PHYSIO', logo: '🏥', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Menuiserie {city}', fallbackName: 'Artisan Bois {city}', fullName: 'Menuiserie & Charpente {city}', tag: 'LOCAL CRAFTSMEN', logo: '🪚', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Régie des Eaux {city}', fallbackName: 'Services Municipaux {city}', fullName: 'Régie Municipale de {city}', tag: 'MUNICIPAL UTILITY', logo: '💧', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Transports {city}', fallbackName: 'Logistique {city}', fullName: 'Transports Routiers {city}', tag: 'LOCAL LOGISTICS', logo: '🚚', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Optique {city}', fallbackName: 'Opticien {city}', fullName: 'Centre Optique {city}', tag: 'LOCAL OPTICIAN', logo: '👓', countries: ['FRA'], minTier: 3, maxTier: 6 },
  { name: 'Équipement Sport {city}', fallbackName: 'Club Shop {city}', fullName: 'Articles de Sport {city}', tag: 'LOCAL KIT SHOP', logo: '👕', countries: ['FRA'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // SPAIN (ESP) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'Iberdrola', fallbackName: 'Iberdrol', fullName: 'Iberdrola S.A.', tag: 'ENERGY UTILITY', logo: '⚡', countries: ['ESP', 'POR'], minTier: 1, maxTier: 1 },
  { name: 'Repsol', fallbackName: 'Repsola', fullName: 'Repsol S.A.', tag: 'ENERGY & MOBILITY', logo: '⛽', countries: ['ESP', 'POR'], minTier: 1, maxTier: 1 },
  { name: 'CaixaBank', fallbackName: 'CaxaBank', fullName: 'CaixaBank S.A.', tag: 'FINANCIAL GROUP', logo: '🏦', countries: ['ESP'], minTier: 1, maxTier: 1 },
  { name: 'Movistar', fallbackName: 'Movistel', fullName: 'Telefónica Movistar', tag: 'TELECOM PARTNER', logo: '📱', countries: ['ESP'], minTier: 1, maxTier: 1 },
  { name: 'Renfe', fallbackName: 'Renfa Rail', fullName: 'Renfe Operadora', tag: 'NATIONAL RAIL', logo: '🚆', countries: ['ESP'], minTier: 1, maxTier: 1 },
  { name: 'El Corte Inglés', fallbackName: 'El Corte Ibérico', fullName: 'El Corte Inglés S.A.', tag: 'RETAIL DEPARTMENT', logo: '🛍️', countries: ['ESP', 'POR'], minTier: 1, maxTier: 1 },
  { name: 'MAPFRE', fallbackName: 'MAPFRA', fullName: 'MAPFRE Seguros', tag: 'INSURANCE SPAIN', logo: '🛡️', countries: ['ESP'], minTier: 1, maxTier: 1 },
  { name: 'Plenitude', fallbackName: 'Plenituda', fullName: 'Eni Plenitude Iberia', tag: 'RENEWABLE ENERGY', logo: '☀️', countries: ['ESP', 'ITA'], minTier: 1, maxTier: 2 },
  { name: 'ABANCA', fallbackName: 'ABANKA', fullName: 'ABANCA Corporación', tag: 'BANKING SPAIN', logo: '🏦', countries: ['ESP'], minTier: 1, maxTier: 2 },
  { name: 'Estrella Damm', fallbackName: 'Estrella Dorada', fullName: 'S.A. Damm', tag: 'BEVERAGE SPAIN', logo: '🍺', countries: ['ESP'], minTier: 1, maxTier: 2 },
  { name: 'Finetwork', fallbackName: 'Finetel', fullName: 'Finetwork Telecom', tag: 'FIBER & MOBILE', logo: '📡', countries: ['ESP'], minTier: 1, maxTier: 2 },
  { name: 'Joma', fallbackName: 'Jomo Sport', fullName: 'Joma Sport S.A.', tag: 'SPORTS APPAREL', logo: '👟', countries: ['ESP', 'CRO', 'SLO'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (ESP)
  { name: 'Kutxabank / Unicaja', fallbackName: 'Banca Autonómica', fullName: 'Banca Regional España', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['ESP'], minTier: 2, maxTier: 3 },
  { name: 'Estrella Galicia', fallbackName: 'Cerveza Atlántica', fullName: 'Hijos de Rivera S.A.', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['ESP'], minTier: 2, maxTier: 3 },
  { name: 'Eroski / Gadis', fallbackName: 'Supermercados Ibéricos', fullName: 'Distribución Regional S.A.', tag: 'REGIONAL RETAIL', logo: '🛒', countries: ['ESP'], minTier: 2, maxTier: 3 },
  { name: 'Sanitas Salud', fallbackName: 'Sanita Clínica', fullName: 'Sanitas Seguros Médicos', tag: 'MEDICAL PARTNER', logo: '🏥', countries: ['ESP'], minTier: 2, maxTier: 3 },
  { name: 'ALSA Autobuses', fallbackName: 'ALSO Transportes', fullName: 'Automóviles Luarca S.A.', tag: 'REGIONAL TRANSIT', logo: '🚌', countries: ['ESP'], minTier: 2, maxTier: 3 },
  { name: 'Solán de Cabras', fallbackName: 'Aguas de la Sierra', fullName: 'Manantial Solán de Cabras', tag: 'HYDRATION PARTNER', logo: '💧', countries: ['ESP'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (ESP)
  { name: 'Caja Rural de {city}', fallbackName: 'Caja Comarcal {city}', fullName: 'Caja Rural de {city} S.C.C.', tag: 'LOCAL CREDIT UNION', logo: '🏦', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Talleres y Motor {city}', fallbackName: 'Automoción {city}', fullName: 'Concesionario & Talleres {city}', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Construcciones {city}', fallbackName: 'Obras y Reformas {city}', fullName: 'Construcciones {city} S.L.', tag: 'LOCAL BUILDER', logo: '🏗️', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Panadería Artesana {city}', fallbackName: 'Horno de {city}', fullName: 'Panificadora de {city} S.L.', tag: 'LOCAL BAKERY', logo: '🥖', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Clínica Fisioterapia {city}', fallbackName: 'Centro Médico {city}', fullName: 'Fisioterapia y Salud {city}', tag: 'LOCAL CLINIC', logo: '🏥', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Aguas Municipales {city}', fallbackName: 'Suministros {city}', fullName: 'Empresa Municipal de {city}', tag: 'MUNICIPAL UTILITY', logo: '💧', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Supermercados {city}', fallbackName: 'Autoservicio {city}', fullName: 'Alimentación {city} S.L.', tag: 'LOCAL GROCER', logo: '🛒', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Transportes {city}', fallbackName: 'Logística {city}', fullName: 'Transportes Comarcales {city}', tag: 'LOCAL HAULAGE', logo: '🚚', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Deportes {city}', fallbackName: 'Equipaciones {city}', fullName: 'Deportes y Trofeos {city}', tag: 'LOCAL SPORT SHOP', logo: '👕', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Bodegas {city}', fallbackName: 'Cooperativa Agrícola {city}', fullName: 'Cooperativa de {city}', tag: 'LOCAL COOPERATIVE', logo: '🍇', countries: ['ESP'], minTier: 3, maxTier: 6 },
  { name: 'Asesoría {city}', fallbackName: 'Inmobiliaria {city}', fullName: 'Gestoría & Seguros {city}', tag: 'LOCAL SERVICES', logo: '🏢', countries: ['ESP'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // HUNGARY (HUN) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'OTP Bank', fallbackName: 'OTB Bank', fullName: 'OTP Bank Nyrt.', tag: 'FINANCIAL GROUP', logo: '🏦', countries: ['HUN', 'CRO', 'SLO', 'SRB', 'MNE'], minTier: 1, maxTier: 1 },
  { name: 'MOL Group', fallbackName: 'MAL Group', fullName: 'MOL Magyar Olaj', tag: 'PETROCHEMICALS', logo: '⛽', countries: ['HUN', 'CRO', 'SLO', 'SVK'], minTier: 1, maxTier: 1 },
  { name: 'Telekom HU', fallbackName: 'Telekom Pannonia', fullName: 'Magyar Telekom', tag: 'TELECOMMUNICATIONS', logo: '📡', countries: ['HUN'], minTier: 1, maxTier: 1 },
  { name: 'MVM Energy', fallbackName: 'MVN Energy', fullName: 'MVM Dome & Energy', tag: 'STATE POWER', logo: '⚡', countries: ['HUN'], minTier: 1, maxTier: 1 },
  { name: 'Audi Hungaria', fallbackName: 'Audo Hungaria', fullName: 'Audi Hungaria Zrt.', tag: 'AUTOMOTIVE', logo: '🚗', countries: ['HUN'], minTier: 1, maxTier: 1 },
  { name: 'Richter Gedeon', fallbackName: 'Richta Pharma', fullName: 'Gedeon Richter Nyrt.', tag: 'PHARMACEUTICALS', logo: '💊', countries: ['HUN'], minTier: 1, maxTier: 1 },
  { name: 'Wizz Air', fallbackName: 'Wiz Air', fullName: 'Wizz Air Hungary', tag: 'AIRLINE PARTNER', logo: '✈️', countries: ['HUN', 'POL', 'ROU', 'MKD'], minTier: 1, maxTier: 1 },
  { name: 'Tippmix', fallbackName: 'Tipmix', fullName: 'Szerencsejáték Zrt.', tag: 'NATIONAL GAMING', logo: '🎯', countries: ['HUN'], minTier: 1, maxTier: 2 },
  { name: 'K&H Bank', fallbackName: 'K&B Bank', fullName: 'K&H Csoport', tag: 'BANKING & INSURANCE', logo: '🏦', countries: ['HUN'], minTier: 1, maxTier: 2 },
  { name: 'PICK', fallbackName: 'PIKK Foods', fullName: 'Pick Szeged Zrt.', tag: 'FOOD INDUSTRY', logo: '🥩', countries: ['HUN'], minTier: 1, maxTier: 2 },
  { name: 'HELL Energy', fallbackName: 'HELIOS Energy', fullName: 'HELL Energy Magyarország', tag: 'BEVERAGE PARTNER', logo: '⚡', countries: ['HUN', 'ROU', 'CRO'], minTier: 1, maxTier: 2 },
  { name: 'Borsodi', fallbackName: 'Borsod Brew', fullName: 'Borsodi Sörgyár', tag: 'BREWERY PARTNER', logo: '🍺', countries: ['HUN'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (HUN)
  { name: 'MBH Bank', fallbackName: 'MBA Takarék', fullName: 'MBH Bank Nyrt.', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['HUN'], minTier: 2, maxTier: 3 },
  { name: 'Szentkirályi', fallbackName: 'Királyi Ásványvíz', fullName: 'Szentkirályi Magyarország', tag: 'MINERAL WATER', logo: '💧', countries: ['HUN'], minTier: 2, maxTier: 3 },
  { name: 'CBA Príma', fallbackName: 'CBO Élelmiszer', fullName: 'CBA Kereskedelmi Kft.', tag: 'REGIONAL RETAIL', logo: '🛒', countries: ['HUN'], minTier: 2, maxTier: 3 },
  { name: 'Gyermelyi', fallbackName: 'Gyermely Foods', fullName: 'Gyermelyi Zrt.', tag: 'FOOD PARTNER', logo: '🌾', countries: ['HUN'], minTier: 2, maxTier: 3 },
  { name: 'Pécsi Sörfőzde', fallbackName: 'Pannon Sör', fullName: 'Pécsi Sörfőzde Zrt.', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['HUN'], minTier: 2, maxTier: 3 },
  { name: 'Volánbusz Regió', fallbackName: 'Pannon Busz', fullName: 'Regionális Közlekedési Központ', tag: 'REGIONAL TRANSIT', logo: '🚌', countries: ['HUN'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (HUN)
  { name: '{city} Takarék', fallbackName: 'Városi Takarék {city}', fullName: '{city} és Vidéke Takarékszövetkezet', tag: 'LOCAL SAVINGS CO-OP', logo: '🏦', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: '{city} Városüzemeltetés', fallbackName: '{city} Közművek', fullName: '{city} Városi Közmű Kft.', tag: 'MUNICIPAL UTILITY', logo: '⚡', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: '{city} Pékség', fallbackName: 'Friss Pékség {city}', fullName: '{city} Sütőipari Kft.', tag: 'LOCAL BAKERY', logo: '🥖', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: 'Autóház {city}', fallbackName: 'Autócentrum {city}', fullName: '{city} Autószerviz Kft.', tag: 'LOCAL DEALERSHIP', logo: '🚗', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: '{city} Építő Kft.', fallbackName: 'Építőmester {city}', fullName: '{city} Magasépítő Kft.', tag: 'LOCAL BUILDER', logo: '🏗️', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: 'Coop {city}', fallbackName: 'Városi ABC {city}', fullName: 'Coop Szolnok / {city} Zrt.', tag: 'LOCAL GROCER', logo: '🛒', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: '{city} Gyógyszertár', fallbackName: 'Arany Sas Patika {city}', fullName: 'Városi Gyógyszertár {city}', tag: 'LOCAL PHARMACY', logo: '💊', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: '{city} Húsüzem', fallbackName: 'Családi Hentes {city}', fullName: '{city} Húsfeldolgozó Kft.', tag: 'LOCAL BUTCHER', logo: '🥩', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: '{city} Fuvarozás', fallbackName: 'Transz-Log {city}', fullName: '{city} Szállítmányozási Kft.', tag: 'LOCAL HAULAGE', logo: '🚚', countries: ['HUN'], minTier: 3, maxTier: 6 },
  { name: '{city} Sportbolt', fallbackName: 'Csapatsport {city}', fullName: '{city} Sportszer Szaküzlet', tag: 'LOCAL SPORT SHOP', logo: '👕', countries: ['HUN'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // POLAND (POL) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'ORLEN', fallbackName: 'ORLAN', fullName: 'ORLEN S.A.', tag: 'STATE ENERGY GIANT', logo: '🦅', countries: ['POL', 'LTU', 'CZE'], minTier: 1, maxTier: 1 },
  { name: 'PKO Bank', fallbackName: 'PKA Bank', fullName: 'PKO Bank Polski', tag: 'NATIONAL BANKING', logo: '🏦', countries: ['POL'], minTier: 1, maxTier: 1 },
  { name: 'PGE Energia', fallbackName: 'PGA Energia', fullName: 'PGE Polska Grupa', tag: 'POWER GROUP', logo: '⚡', countries: ['POL'], minTier: 1, maxTier: 1 },
  { name: 'PZU', fallbackName: 'PZA Insurance', fullName: 'Grupa PZU', tag: 'INSURANCE POLAND', logo: '🛡️', countries: ['POL', 'LTU', 'UKR'], minTier: 1, maxTier: 1 },
  { name: 'KGHM', fallbackName: 'KGHN Copper', fullName: 'KGHM Polska Miedź', tag: 'MINING & METALS', logo: '⛏️', countries: ['POL'], minTier: 1, maxTier: 1 },
  { name: 'LOTTO', fallbackName: 'LOTO Polska', fullName: 'Totalizator Sportowy', tag: 'SPORTS LOTTERY', logo: '🍀', countries: ['POL'], minTier: 1, maxTier: 1 },
  { name: 'InPost', fallbackName: 'InPaczka', fullName: 'InPost S.A.', tag: 'LOGISTICS PARTNER', logo: '📦', countries: ['POL', 'ENG', 'ITA'], minTier: 1, maxTier: 1 },
  { name: 'Grupa Azoty', fallbackName: 'Grupa Azota', fullName: 'Grupa Azoty S.A.', tag: 'CHEMICALS GROUP', logo: '🧪', countries: ['POL'], minTier: 1, maxTier: 2 },
  { name: 'Łomża', fallbackName: 'Lomza Brew', fullName: 'Browar Łomża', tag: 'BEVERAGE POLAND', logo: '🍺', countries: ['POL'], minTier: 1, maxTier: 2 },
  { name: 'Tauron', fallbackName: 'Tauran', fullName: 'Tauron Polska Energia', tag: 'ENERGY UTILITY', logo: '💡', countries: ['POL'], minTier: 1, maxTier: 2 },
  { name: 'Plus Telecom', fallbackName: 'Pluss Telecom', fullName: 'Polkomtel Plus', tag: 'MOBILE NETWORK', logo: '📡', countries: ['POL'], minTier: 1, maxTier: 2 },
  { name: '4F Sport', fallbackName: '4V Sport', fullName: 'OTCF 4F Sportswear', tag: 'KIT MANUFACTURER', logo: '👕', countries: ['POL', 'SRB', 'CRO', 'SVK'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (POL)
  { name: 'Enea Energia', fallbackName: 'Eneo Energia', fullName: 'Enea S.A. Poznań', tag: 'REGIONAL UTILITY', logo: '⚡', countries: ['POL'], minTier: 2, maxTier: 3 },
  { name: 'Mlekovita', fallbackName: 'MlekoPol', fullName: 'Grupa Mlekovita', tag: 'DAIRY PARTNER', logo: '🥛', countries: ['POL'], minTier: 2, maxTier: 3 },
  { name: 'Dino Polska', fallbackName: 'Dina Market', fullName: 'Dino Polska S.A.', tag: 'REGIONAL RETAIL', logo: '🛒', countries: ['POL'], minTier: 2, maxTier: 3 },
  { name: 'Perła Browary', fallbackName: 'Korona Browar', fullName: 'Perła Browary Lubelskie', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['POL'], minTier: 2, maxTier: 3 },
  { name: 'Fakro / Wiśniowski', fallbackName: 'Pol-Okna Dom', fullName: 'Stolarka Budowlana Sp. z o.o.', tag: 'INDUSTRIAL PARTNER', logo: '🏠', countries: ['POL'], minTier: 2, maxTier: 3 },
  { name: 'Cisowianka', fallbackName: 'Zdrój Polski', fullName: 'Nałęczów Zdrój Sp. z o.o.', tag: 'MINERAL WATER', logo: '💧', countries: ['POL'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (POL)
  { name: 'Bank Spółdzielczy {city}', fallbackName: 'Kasa Spółdzielcza {city}', fullName: 'Bank Spółdzielczy w {city}', tag: 'COOPERATIVE BANK', logo: '🏦', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Wodociągi & PEC {city}', fallbackName: 'Zakład Komunalny {city}', fullName: 'Miejskie Przedsiębiorstwo {city}', tag: 'MUNICIPAL UTILITY', logo: '💧', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Piekarnia {city}', fallbackName: 'Piekarnia Rodzinna {city}', fullName: 'Piekarnia-Cukiernia {city}', tag: 'LOCAL BAKERY', logo: '🥖', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Auto-Serwis {city}', fallbackName: 'Auto-Centrum {city}', fullName: 'Salon i Serwis Auto {city}', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Dom-Bud {city}', fallbackName: 'Budownictwo {city}', fullName: 'Przedsiębiorstwo Budowlane {city}', tag: 'LOCAL BUILDER', logo: '🏗️', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Lewiatan {city}', fallbackName: 'Delikatesy {city}', fullName: 'Sklep Spożywczy {city}', tag: 'LOCAL GROCER', logo: '🛒', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Browar Rzemieślniczy {city}', fallbackName: 'Browar Miejski {city}', fullName: 'Browar Lokalny {city}', tag: 'LOCAL BREWERY', logo: '🍺', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Centrum Medyczne {city}', fallbackName: 'Fizjo-Med {city}', fullName: 'Przychodnia i Rehabilitacja {city}', tag: 'LOCAL CLINIC', logo: '🏥', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Trans-Pol {city}', fallbackName: 'Spedycja {city}', fullName: 'Usługi Transportowe {city}', tag: 'LOCAL HAULAGE', logo: '🚚', countries: ['POL'], minTier: 3, maxTier: 6 },
  { name: 'Hurtownia Sportowa {city}', fallbackName: 'Strefa Sportu {city}', fullName: 'Sklep Sportowy {city}', tag: 'LOCAL KIT SHOP', logo: '👕', countries: ['POL'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // NORWAY & SWEDEN (NOR / SWE) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'REMA 1000', fallbackName: 'REMO 1000', fullName: 'REMA 1000 Norge', tag: 'RETAIL SCANDINAVIA', logo: '🛒', countries: ['NOR', 'DEN'], minTier: 1, maxTier: 1 },
  { name: 'Equinor', fallbackName: 'Equinord', fullName: 'Equinor ASA', tag: 'NORDIC ENERGY', logo: '⛽', countries: ['NOR'], minTier: 1, maxTier: 1 },
  { name: 'Telenor', fallbackName: 'Telenord', fullName: 'Telenor ASA', tag: 'TELECOM NORDIC', logo: '📡', countries: ['NOR', 'SWE', 'DEN', 'FIN'], minTier: 1, maxTier: 1 },
  { name: 'DNB', fallbackName: 'DNA Bank', fullName: 'DNB Bank ASA', tag: 'FINANCIAL GROUP', logo: '🏦', countries: ['NOR'], minTier: 1, maxTier: 1 },
  { name: 'SAS Airlines', fallbackName: 'SNS Airlines', fullName: 'Scandinavian Airlines', tag: 'AIRLINE PARTNER', logo: '✈️', countries: ['NOR', 'SWE', 'DEN'], minTier: 1, maxTier: 1 },
  { name: 'ICA', fallbackName: 'IKA Retail', fullName: 'ICA Gruppen', tag: 'RETAIL SWEDEN', logo: '🛒', countries: ['SWE'], minTier: 1, maxTier: 1 },
  { name: 'Swedbank', fallbackName: 'Swebank', fullName: 'Swedbank AB', tag: 'NORDIC BANKING', logo: '🏦', countries: ['SWE', 'LTU'], minTier: 1, maxTier: 1 },
  { name: 'Vattenfall', fallbackName: 'Vattenfal', fullName: 'Vattenfall AB', tag: 'HYDRO & WIND POWER', logo: '⚡', countries: ['SWE', 'GER', 'NED'], minTier: 1, maxTier: 1 },
  { name: 'Gjensidige', fallbackName: 'Gjensidig', fullName: 'Gjensidige Forsikring', tag: 'NORDIC INSURANCE', logo: '🛡️', countries: ['NOR', 'SWE', 'DEN'], minTier: 1, maxTier: 2 },
  { name: 'SpareBank 1', fallbackName: 'SparBank 1', fullName: 'SpareBank 1 Gruppen', tag: 'NORWEGIAN BANKING', logo: '🏦', countries: ['NOR'], minTier: 1, maxTier: 2 },
  { name: 'Norsk Tipping', fallbackName: 'Norsk Spill', fullName: 'Norsk Tipping AS', tag: 'GAMING PARTNER', logo: '🎯', countries: ['NOR'], minTier: 1, maxTier: 2 },
  { name: 'Posten Bring', fallbackName: 'Posta Bring', fullName: 'Posten Bring AS', tag: 'NORDIC LOGISTICS', logo: '📦', countries: ['NOR', 'SWE'], minTier: 1, maxTier: 2 },
  { name: 'Coop Norden', fallbackName: 'Koop Norden', fullName: 'Coop Norge / Sverige', tag: 'RETAIL CO-OP', logo: '🛒', countries: ['NOR', 'SWE', 'DEN', 'FIN'], minTier: 1, maxTier: 2 },
  { name: 'Umbro Nordic', fallbackName: 'Umbra Nordic', fullName: 'Umbro Scandinavia', tag: 'KIT SUPPLIER', logo: '👟', countries: ['NOR', 'SWE', 'ISL', 'FAR'], minTier: 1, maxTier: 2 },
  { name: 'ATG', fallbackName: 'ATB Gaming', fullName: 'AB Trav och Galopp', tag: 'SWEDISH GAMING', logo: '🐎', countries: ['SWE'], minTier: 1, maxTier: 2 },
  { name: 'Svenska Spel', fallbackName: 'Svensk Spel', fullName: 'AB Svenska Spel', tag: 'NATIONAL GAMING', logo: '🎯', countries: ['SWE'], minTier: 1, maxTier: 2 },
  { name: 'Bauhaus', fallbackName: 'Bauhus', fullName: 'Bauhaus Nordic', tag: 'HOME IMPROVEMENT', logo: '🛠️', countries: ['SWE', 'NOR', 'DEN', 'GER', 'AUT', 'SUI', 'ISL'], minTier: 1, maxTier: 2 },
  { name: 'Folksam', fallbackName: 'Folksan', fullName: 'Folksam Försäkring', tag: 'SPORTS INSURANCE', logo: '🛡️', countries: ['SWE'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (NOR / SWE)
  { name: 'Länsförsäkringar', fallbackName: 'LänsSkydd', fullName: 'Länsförsäkringar AB', tag: 'REGIONAL INSURANCE', logo: '🛡️', countries: ['SWE'], minTier: 2, maxTier: 3 },
  { name: 'Peab / Veidekke', fallbackName: 'NordBygg Entreprenad', fullName: 'Nordisk Entreprenør AS', tag: 'REGIONAL CONSTRUCTION', logo: '🏗️', countries: ['SWE', 'NOR'], minTier: 2, maxTier: 3 },
  { name: 'Fjordkraft / Lyse', fallbackName: 'FjordEnergi', fullName: 'Regionale Kraftselskap AS', tag: 'REGIONAL POWER', logo: '⚡', countries: ['NOR'], minTier: 2, maxTier: 3 },
  { name: 'Spendrups / Hansa Borg', fallbackName: 'Nordisk Bryggeri', fullName: 'Skandinaviska Bryggerier', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['SWE', 'NOR'], minTier: 2, maxTier: 3 },
  { name: 'Willys / Kiwi Minipris', fallbackName: 'Nordic Lågpris', fullName: 'Dagligvarehandel Norden', tag: 'DISCOUNT GROCER', logo: '🛒', countries: ['SWE', 'NOR'], minTier: 2, maxTier: 3 },
  { name: 'Intersport Team Nordic', fallbackName: 'Klubbsport Norden', fullName: 'Team Sportia & Klubbhuset', tag: 'CLUB TEAMWEAR', logo: '👕', countries: ['SWE', 'NOR', 'FIN'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (NOR / SWE)
  { name: '{city} Sparebank', fallbackName: 'Lokalbanken {city}', fullName: '{city} Sparbank & Försäkring', tag: 'LOCAL SAVINGS BANK', logo: '🏦', countries: ['NOR', 'SWE'], minTier: 3, maxTier: 6 },
  { name: '{city} Energi', fallbackName: '{city} Kraftverk', fullName: '{city} Kommunala Energi', tag: 'MUNICIPAL ENERGY', logo: '⚡', countries: ['NOR', 'SWE', 'FIN'], minTier: 3, maxTier: 6 },
  { name: 'Byggmester {city}', fallbackName: '{city} Bygg & Måleri', fullName: '{city} Byggservice AB/AS', tag: 'LOCAL BUILDER', logo: '🪚', countries: ['NOR', 'SWE'], minTier: 3, maxTier: 6 },
  { name: 'Bilcentrum {city}', fallbackName: '{city} Bilverkstad', fullName: 'Auto & Bilservice {city}', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['NOR', 'SWE'], minTier: 3, maxTier: 6 },
  { name: '{city} Bageri', fallbackName: 'Konditori {city}', fullName: '{city} Hembageri & Café', tag: 'LOCAL BAKERY', logo: '🥨', countries: ['NOR', 'SWE'], minTier: 3, maxTier: 6 },
  { name: 'Lokalmat {city}', fallbackName: 'Närbutiken {city}', fullName: 'Handlarn / Bunnpris {city}', tag: 'LOCAL GROCER', logo: '🛒', countries: ['NOR', 'SWE'], minTier: 3, maxTier: 6 },
  { name: '{city} Fysio & Rehab', fallbackName: '{city} Idrottsklinik', fullName: 'Fysioterapi {city}', tag: 'LOCAL PHYSIO', logo: '🏥', countries: ['NOR', 'SWE'], minTier: 3, maxTier: 6 },
  { name: '{city} Bryggeri', fallbackName: '{city} Hantverksöl', fullName: '{city} Mikrobryggeri', tag: 'LOCAL BREWERY', logo: '🍺', countries: ['NOR', 'SWE'], minTier: 3, maxTier: 6 },
  { name: '{city} Åkeri & Transport', fallbackName: '{city} Frakt', fullName: '{city} Transport & Logistik', tag: 'LOCAL HAULAGE', logo: '🚚', countries: ['NOR', 'SWE'], minTier: 3, maxTier: 6 },
  { name: 'Klubbshoppen {city}', fallbackName: 'Sportbutiken {city}', fullName: '{city} Sport & Profil', tag: 'LOCAL SPORT SHOP', logo: '👕', countries: ['NOR', 'SWE', 'FIN'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // BALKANS (CRO / SLO / MKD / SRB / BIH / MNE) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'Podravka', fallbackName: 'Podravko', fullName: 'Podravka d.d.', tag: 'FOOD & NUTRITION', logo: '🍲', countries: ['CRO', 'SLO', 'BIH', 'SRB', 'MKD', 'MNE'], minTier: 1, maxTier: 1 },
  { name: 'NLB Group', fallbackName: 'NLA Bank', fullName: 'Nova Ljubljanska Banka', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['SLO', 'MKD', 'SRB', 'BIH', 'MNE', 'CRO'], minTier: 1, maxTier: 1 },
  { name: 'INA Energy', fallbackName: 'INO Energy', fullName: 'INA Industrija Nafte', tag: 'ENERGY PARTNER', logo: '⛽', countries: ['CRO', 'BIH', 'SLO'], minTier: 1, maxTier: 1 },
  { name: 'HEP Group', fallbackName: 'HEB Power', fullName: 'Hrvatska Elektroprivreda', tag: 'NATIONAL POWER', logo: '⚡', countries: ['CRO', 'SLO', 'BIH'], minTier: 1, maxTier: 1 },
  { name: 'Petrol Group', fallbackName: 'Petrola Group', fullName: 'Petrol d.d. Ljubljana', tag: 'ENERGY & MOBILITY', logo: '⛽', countries: ['SLO', 'CRO', 'SRB', 'BIH', 'MNE', 'MKD'], minTier: 1, maxTier: 1 },
  { name: 'Telekom Adria', fallbackName: 'Telekom Balkan', fullName: 'Hrvatski / Makedonski Telekom', tag: 'TELECOMMUNICATIONS', logo: '📡', countries: ['CRO', 'MKD', 'SLO', 'SRB', 'BIH', 'MNE'], minTier: 1, maxTier: 1 },
  { name: 'Alkaloid', fallbackName: 'Alkaloida', fullName: 'Alkaloid AD Skopje', tag: 'PHARMACEUTICALS', logo: '💊', countries: ['MKD', 'SRB', 'CRO', 'BIH', 'SLO', 'MNE'], minTier: 1, maxTier: 2 },
  { name: 'Gorenje', fallbackName: 'Gorenja', fullName: 'Gorenje Home Appliances', tag: 'HOME ELECTRONICS', logo: '🏠', countries: ['SLO', 'CRO', 'SRB', 'BIH', 'MKD', 'MNE'], minTier: 1, maxTier: 2 },
  { name: 'Croatia Osiguranje', fallbackName: 'Adria Osiguranje', fullName: 'Croatia Osiguranje d.d.', tag: 'INSURANCE GROUP', logo: '🛡️', countries: ['CRO', 'BIH'], minTier: 1, maxTier: 2 },
  { name: 'Krka Pharma', fallbackName: 'Karka Pharma', fullName: 'Krka d.d. Novo Mesto', tag: 'PHARMA PARTNER', logo: '💊', countries: ['SLO', 'CRO', 'SRB', 'MKD', 'BIH', 'MNE'], minTier: 1, maxTier: 2 },
  { name: 'Triglav', fallbackName: 'Triglava', fullName: 'Zavarovalnica Triglav', tag: 'INSURANCE ADRIA', logo: '🛡️', countries: ['SLO', 'CRO', 'SRB', 'BIH', 'MKD', 'MNE'], minTier: 1, maxTier: 2 },
  { name: 'Eurofarm', fallbackName: 'Eurofarma', fullName: 'Eurofarm Pelister', tag: 'MEDICAL & PHARMA', logo: '🏥', countries: ['MKD', 'SRB', 'BIH', 'CRO', 'SLO', 'MNE'], minTier: 1, maxTier: 2 },
  { name: 'Laško / Ožujsko', fallbackName: 'Lasko / Ozujsko', fullName: 'Adriatic Breweries', tag: 'BEVERAGE PARTNER', logo: '🍺', countries: ['SLO', 'CRO', 'BIH', 'SRB', 'MKD', 'MNE'], minTier: 1, maxTier: 2 },
  { name: 'Pelisterka', fallbackName: 'Pelistera', fullName: 'Pelisterka AD', tag: 'MINERAL WATER', logo: '💧', countries: ['MKD', 'SRB', 'CRO', 'SLO', 'BIH', 'MNE'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (Balkans)
  { name: 'Konzum / Mercator', fallbackName: 'Adria Market', fullName: 'Regionalni Maloprodajni Lanac', tag: 'REGIONAL RETAIL', logo: '🛒', countries: ['CRO', 'SLO', 'BIH', 'SRB', 'MNE', 'MKD'], minTier: 2, maxTier: 3 },
  { name: 'Vindija / Imlek', fallbackName: 'Balkan Mljekara', fullName: 'Prehrambena Industrija d.d.', tag: 'DAIRY & NUTRITION', logo: '🥛', countries: ['CRO', 'SLO', 'SRB', 'BIH', 'MKD', 'MNE'], minTier: 2, maxTier: 3 },
  { name: 'Komercijalna Banka', fallbackName: 'Adria Banka', fullName: 'Regionalna Komercijalna Banka', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['SRB', 'MKD', 'BIH', 'MNE', 'CRO', 'SLO'], minTier: 2, maxTier: 3 },
  { name: 'Sava Osiguranje', fallbackName: 'Savo Osiguranje', fullName: 'Zavarovalna Skupina Sava', tag: 'REGIONAL INSURANCE', logo: '🛡️', countries: ['SLO', 'CRO', 'SRB', 'MKD', 'MNE', 'BIH'], minTier: 2, maxTier: 3 },
  { name: 'Jamnica / Knjaz Miloš', fallbackName: 'Izvor Voda', fullName: 'Prirodna Mineralna Voda', tag: 'HYDRATION PARTNER', logo: '💧', countries: ['CRO', 'SRB', 'BIH', 'SLO', 'MNE', 'MKD'], minTier: 2, maxTier: 3 },
  { name: 'Tikveš / Badel', fallbackName: 'Adria Beverages', fullName: 'Regionalna Industrija Pića', tag: 'BEVERAGE PARTNER', logo: '🍷', countries: ['MKD', 'CRO', 'SRB', 'BIH', 'SLO', 'MNE'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (Balkans)
  { name: 'Vodovod i Komunalno {city}', fallbackName: 'Komunalac {city}', fullName: 'Javno Poduzeće {city}', tag: 'MUNICIPAL UTILITY', logo: '💧', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Gradska Pekara {city}', fallbackName: 'Pekara Klas {city}', fullName: 'Pekarska Industrija {city}', tag: 'LOCAL BAKERY', logo: '🥖', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Auto Kuća {city}', fallbackName: 'Auto Centar {city}', fullName: 'Auto Servis i Salon {city}', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Tehnogradnja {city}', fallbackName: 'Gradnja {city}', fullName: 'Građevinsko Poduzeće {city}', tag: 'LOCAL BUILDER', logo: '🏗️', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Poliklinika {city}', fallbackName: 'Apoteka Zdravlje {city}', fullName: 'Dom Zdravlja & Fizioterapija {city}', tag: 'LOCAL CLINIC', logo: '🏥', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Lokalna Pivovara {city}', fallbackName: 'Pivnica {city}', fullName: 'Zanatska Pivovara {city}', tag: 'LOCAL BREWERY', logo: '🍺', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Trgovina & Market {city}', fallbackName: 'Diskont {city}', fullName: 'Lokalni Market {city} d.o.o.', tag: 'LOCAL GROCER', logo: '🛒', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Mesna Industrija {city}', fallbackName: 'Mesnica {city}', fullName: 'Domaća Mesnica {city}', tag: 'LOCAL BUTCHER', logo: '🥩', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Autoprevoz {city}', fallbackName: 'Špedicija {city}', fullName: 'Transport i Logistika {city}', tag: 'LOCAL HAULAGE', logo: '🚚', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },
  { name: 'Sport Oprema {city}', fallbackName: 'Tim Sport {city}', fullName: 'Sportska Trgovina {city}', tag: 'LOCAL KIT SHOP', logo: '👕', countries: ['CRO', 'SLO', 'MKD', 'SRB', 'BIH', 'MNE'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // PORTUGAL (POR) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'Galp', fallbackName: 'Galpa Energia', fullName: 'Galp Energia SGPS', tag: 'ENERGY & FUEL', logo: '⛽', countries: ['POR', 'ESP'], minTier: 1, maxTier: 1 },
  { name: 'Millennium bcp', fallbackName: 'Millenium Bank', fullName: 'Banco Comercial Português', tag: 'BANKING PORTUGAL', logo: '🏦', countries: ['POR', 'POL'], minTier: 1, maxTier: 1 },
  { name: 'MEO', fallbackName: 'MEA Telecom', fullName: 'MEO Altice Portugal', tag: 'TELECOMMUNICATIONS', logo: '📡', countries: ['POR'], minTier: 1, maxTier: 1 },
  { name: 'Continente', fallbackName: 'Kontinente', fullName: 'Modelo Continente', tag: 'RETAIL HYPERMARKET', logo: '🛒', countries: ['POR'], minTier: 1, maxTier: 1 },
  { name: 'EDP', fallbackName: 'EDB Energia', fullName: 'Energias de Portugal', tag: 'RENEWABLE POWER', logo: '⚡', countries: ['POR', 'ESP', 'BRA'], minTier: 1, maxTier: 1 },
  { name: 'TAP Air', fallbackName: 'TAB Air', fullName: 'TAP Air Portugal', tag: 'OFFICIAL AIRLINE', logo: '✈️', countries: ['POR', 'BRA'], minTier: 1, maxTier: 1 },
  { name: 'Santa Casa', fallbackName: 'Santa Kasa', fullName: 'Jogos Santa Casa', tag: 'PORTUGAL PARTNER', logo: '🍀', countries: ['POR'], minTier: 1, maxTier: 2 },
  { name: 'Placard', fallbackName: 'Plakard', fullName: 'Placard.pt', tag: 'SPORTS GAMING', logo: '🎯', countries: ['POR'], minTier: 1, maxTier: 2 },
  { name: 'Fidelidade', fallbackName: 'Fidelidada', fullName: 'Fidelidade Seguros', tag: 'INSURANCE PORTUGAL', logo: '🛡️', countries: ['POR'], minTier: 1, maxTier: 2 },
  { name: 'Super Bock', fallbackName: 'Super Bok', fullName: 'Super Bock Group', tag: 'BEVERAGE PORTUGAL', logo: '🍺', countries: ['POR'], minTier: 1, maxTier: 2 },
  { name: 'Vitalis', fallbackName: 'Vitalia Water', fullName: 'Água Vitalis', tag: 'HYDRATION PARTNER', logo: '💧', countries: ['POR'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (POR)
  { name: 'Pingo Doce', fallbackName: 'Pingo Mercado', fullName: 'Jerónimo Martins Retalho', tag: 'REGIONAL RETAIL', logo: '🛒', countries: ['POR'], minTier: 2, maxTier: 3 },
  { name: 'Banco Montepio', fallbackName: 'Banco Mutualista', fullName: 'Caixa Económica Montepio', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['POR'], minTier: 2, maxTier: 3 },
  { name: 'Delta Cafés', fallbackName: 'Lusitânia Cafés', fullName: 'Grupo Nabeiro Portugal', tag: 'ROASTERY PARTNER', logo: '☕', countries: ['POR'], minTier: 2, maxTier: 3 },
  { name: 'Tranquilidade', fallbackName: 'Seguros Atlântico', fullName: 'Seguradoras Unidas S.A.', tag: 'REGIONAL INSURANCE', logo: '🛡️', countries: ['POR'], minTier: 2, maxTier: 3 },
  { name: 'Mimosa / Lactogal', fallbackName: 'LactoLusitano', fullName: 'Produtos Alimentares S.A.', tag: 'DAIRY NUTRITION', logo: '🥛', countries: ['POR'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (POR)
  { name: 'Crédito Agrícola {city}', fallbackName: 'Caixa Agrícola {city}', fullName: 'Caixa de Crédito Agrícola de {city}', tag: 'LOCAL CREDIT UNION', logo: '🏦', countries: ['POR'], minTier: 3, maxTier: 6 },
  { name: 'Águas Municipais {city}', fallbackName: 'Serviços Municipais {city}', fullName: 'Empresa Municipal de {city}', tag: 'MUNICIPAL UTILITY', logo: '💧', countries: ['POR'], minTier: 3, maxTier: 6 },
  { name: 'Padaria & Pastelaria {city}', fallbackName: 'Forno Tradicional {city}', fullName: 'Panificadora de {city} Lda.', tag: 'LOCAL BAKERY', logo: '🥖', countries: ['POR'], minTier: 3, maxTier: 6 },
  { name: 'Stand & Oficina {city}', fallbackName: 'Auto Reparadora {city}', fullName: 'Comércio Automóvel {city}', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['POR'], minTier: 3, maxTier: 6 },
  { name: 'Construções {city}', fallbackName: 'Obras & Engenharia {city}', fullName: 'Sociedade de Construções {city}', tag: 'LOCAL BUILDER', logo: '🏗️', countries: ['POR'], minTier: 3, maxTier: 6 },
  { name: 'Clínica Médica {city}', fallbackName: 'Fisioterapia {city}', fullName: 'Centro de Saúde & Reabilitação {city}', tag: 'LOCAL CLINIC', logo: '🏥', countries: ['POR'], minTier: 3, maxTier: 6 },
  { name: 'Minimercado {city}', fallbackName: 'Talho & Mercado {city}', fullName: 'Comércio Alimentar de {city}', tag: 'LOCAL GROCER', logo: '🛒', countries: ['POR'], minTier: 3, maxTier: 6 },
  { name: 'Transportes {city}', fallbackName: 'Transitários {city}', fullName: 'Transportes Rodoviários {city}', tag: 'LOCAL HAULAGE', logo: '🚚', countries: ['POR'], minTier: 3, maxTier: 6 },
  { name: 'Desporto {city}', fallbackName: 'Equipamentos {city}', fullName: 'Artigos Desportivos {city}', tag: 'LOCAL KIT SHOP', logo: '👕', countries: ['POR'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // ROMANIA (ROU) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'Hidroelectrica', fallbackName: 'Hidroelektrika', fullName: 'Hidroelectrica S.A.', tag: 'HYDRO ENERGY', logo: '🌊', countries: ['ROU'], minTier: 1, maxTier: 1 },
  { name: 'Banca Transilvania', fallbackName: 'Banka Transilvana', fullName: 'Banca Transilvania S.A.', tag: 'BANKING ROMANIA', logo: '🏦', countries: ['ROU'], minTier: 1, maxTier: 1 },
  { name: 'OMV Petrom', fallbackName: 'OMW Petrom', fullName: 'OMV Petrom S.A.', tag: 'ENERGY PARTNER', logo: '⛽', countries: ['ROU', 'AUT'], minTier: 1, maxTier: 1 },
  { name: 'Romgaz', fallbackName: 'Romgas', fullName: 'SNGN Romgaz S.A.', tag: 'NATURAL GAS', logo: '🔥', countries: ['ROU'], minTier: 1, maxTier: 1 },
  { name: 'Dedeman', fallbackName: 'Dedeman Construct', fullName: 'Dedeman SRL', tag: 'HOME & DIY RETAIL', logo: '🛠️', countries: ['ROU'], minTier: 1, maxTier: 1 },
  { name: 'TAROM', fallbackName: 'TARON Air', fullName: 'TAROM Airlines', tag: 'AIRLINE PARTNER', logo: '✈️', countries: ['ROU'], minTier: 1, maxTier: 1 },
  { name: 'CEC Bank', fallbackName: 'CEK Bank', fullName: 'CEC Bank S.A.', tag: 'NATIONAL BANK', logo: '🏦', countries: ['ROU'], minTier: 1, maxTier: 2 },
  { name: 'BRD Finance', fallbackName: 'BRA Finance', fullName: 'BRD Groupe', tag: 'FINANCIAL SERVICES', logo: '🏦', countries: ['ROU'], minTier: 1, maxTier: 2 },
  { name: 'Superbet', fallbackName: 'Supabet', fullName: 'Superbet Romania', tag: 'SPORTS ENTERTAINMENT', logo: '🎯', countries: ['ROU', 'POL'], minTier: 1, maxTier: 2 },
  { name: 'Kaufland RO', fallbackName: 'Kauffland RO', fullName: 'Kaufland Romania', tag: 'RETAIL PARTNER', logo: '🛒', countries: ['ROU'], minTier: 1, maxTier: 2 },
  { name: 'Ursus', fallbackName: 'Ursa Brew', fullName: 'Ursus Breweries', tag: 'BEVERAGE PARTNER', logo: '🍺', countries: ['ROU'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (ROU)
  { name: 'Borsec / Dorna', fallbackName: 'Izvorul Carpați', fullName: 'Romaqua Group Borsec', tag: 'MINERAL WATER', logo: '💧', countries: ['ROU'], minTier: 2, maxTier: 3 },
  { name: 'Altex / Flanco', fallbackName: 'ElectroRetail RO', fullName: 'Retail Electrocasnice SRL', tag: 'ELECTRONICS RETAIL', logo: '🔌', countries: ['ROU'], minTier: 2, maxTier: 3 },
  { name: 'Catena / Dona', fallbackName: 'Farmacia Carpați', fullName: 'Rețea Farmaceutică SRL', tag: 'PHARMACY PARTNER', logo: '💊', countries: ['ROU'], minTier: 2, maxTier: 3 },
  { name: 'Cris-Tim / Agricola', fallbackName: 'AgroFood RO', fullName: 'Industria Alimentară SRL', tag: 'FOOD PARTNER', logo: '🥩', countries: ['ROU'], minTier: 2, maxTier: 3 },
  { name: 'Timișoreana', fallbackName: 'Banat Bere', fullName: 'Fabrica de Bere Tradițională', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['ROU'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (ROU)
  { name: 'Banca Cooperatistă {city}', fallbackName: 'Casa de Ajutor {city}', fullName: 'Cooperativa de Credit {city}', tag: 'LOCAL CREDIT CO-OP', logo: '🏦', countries: ['ROU'], minTier: 3, maxTier: 6 },
  { name: 'Apă-Canal & Termo {city}', fallbackName: 'Regia Locală {city}', fullName: 'Compania Municipală de Utilități {city}', tag: 'MUNICIPAL UTILITY', logo: '💧', countries: ['ROU'], minTier: 3, maxTier: 6 },
  { name: 'Brutăria {city}', fallbackName: 'Panificație {city}', fullName: 'Morărit și Panificație {city} SRL', tag: 'LOCAL BAKERY', logo: '🥖', countries: ['ROU'], minTier: 3, maxTier: 6 },
  { name: 'Auto Service {city}', fallbackName: 'Centrul Auto {city}', fullName: 'Service & Piese Auto {city} SRL', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['ROU'], minTier: 3, maxTier: 6 },
  { name: 'Construcții Civile {city}', fallbackName: 'Edil-Construct {city}', fullName: 'Antrepriza de Construcții {city}', tag: 'LOCAL BUILDER', logo: '🏗️', countries: ['ROU'], minTier: 3, maxTier: 6 },
  { name: 'Clinica Medicală {city}', fallbackName: 'Recuperare & Fizio {city}', fullName: 'Centrul Medical {city} SRL', tag: 'LOCAL CLINIC', logo: '🏥', countries: ['ROU'], minTier: 3, maxTier: 6 },
  { name: 'Marketul Local {city}', fallbackName: 'Alimentara {city}', fullName: 'Magazinul Gospodarului {city}', tag: 'LOCAL GROCER', logo: '🛒', countries: ['ROU'], minTier: 3, maxTier: 6 },
  { name: 'Transporturi {city}', fallbackName: 'Autogara & Spediție {city}', fullName: 'Transport Marfă {city} SRL', tag: 'LOCAL HAULAGE', logo: '🚚', countries: ['ROU'], minTier: 3, maxTier: 6 },
  { name: 'Echipament Sport {city}', fallbackName: 'Magazin Sportiv {city}', fullName: 'Articole Sportive {city}', tag: 'LOCAL KIT SHOP', logo: '👕', countries: ['ROU'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // AUSTRIA & SWITZERLAND (AUT / SUI) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'OMV', fallbackName: 'OMW Energy', fullName: 'OMV Aktiengesellschaft', tag: 'ENERGY GROUP', logo: '⛽', countries: ['AUT'], minTier: 1, maxTier: 1 },
  { name: 'VERBUND', fallbackName: 'VERBUNDA', fullName: 'VERBUND AG', tag: 'HYDROPOWER AUSTRIA', logo: '⚡', countries: ['AUT'], minTier: 1, maxTier: 1 },
  { name: 'voestalpine', fallbackName: 'vostalpine', fullName: 'voestalpine AG', tag: 'STEEL & TECH', logo: '⚙️', countries: ['AUT'], minTier: 1, maxTier: 1 },
  { name: 'A1 Telekom', fallbackName: 'A2 Telekom', fullName: 'A1 Telekom Austria', tag: 'TELECOMMUNICATIONS', logo: '📡', countries: ['AUT', 'SLO', 'CRO', 'SRB', 'MKD'], minTier: 1, maxTier: 1 },
  { name: 'Erste Bank', fallbackName: 'Ersta Bank', fullName: 'Erste Group Bank AG', tag: 'FINANCIAL GROUP', logo: '🏦', countries: ['AUT', 'CZE', 'SVK', 'HUN', 'ROU', 'CRO'], minTier: 1, maxTier: 1 },
  { name: 'Swisscom', fallbackName: 'Swiscom', fullName: 'Swisscom AG', tag: 'TELECOMMUNICATIONS', logo: '📱', countries: ['SUI'], minTier: 1, maxTier: 1 },
  { name: 'UBS', fallbackName: 'UBA Bank', fullName: 'UBS Group AG', tag: 'GLOBAL BANKING', logo: '🏦', countries: ['SUI'], minTier: 1, maxTier: 1 },
  { name: 'Migros', fallbackName: 'Migro Retail', fullName: 'Migros-Genossenschaft', tag: 'SWISS RETAIL', logo: '🛒', countries: ['SUI'], minTier: 1, maxTier: 1 },
  { name: 'SWISS Air', fallbackName: 'SWIS Air', fullName: 'Swiss International Air Lines', tag: 'OFFICIAL AIRLINE', logo: '✈️', countries: ['SUI'], minTier: 1, maxTier: 1 },
  { name: 'Wiener Städtische', fallbackName: 'Wiener Versicherung', fullName: 'Wiener Städtische Versicherung', tag: 'INSURANCE AUSTRIA', logo: '🛡️', countries: ['AUT'], minTier: 1, maxTier: 2 },
  { name: 'ADMIRAL', fallbackName: 'ADMIRALA Sport', fullName: 'ADMIRAL Sportwetten', tag: 'SPORTS PARTNER', logo: '🎯', countries: ['AUT'], minTier: 1, maxTier: 2 },
  { name: 'Raiffeisen', fallbackName: 'Raifeisen Bank', fullName: 'Raiffeisen Bank International', tag: 'BANKING PARTNER', logo: '🏦', countries: ['AUT', 'SUI', 'ROU', 'CRO', 'HUN', 'CZE', 'SVK'], minTier: 1, maxTier: 2 },
  { name: 'UNIQA', fallbackName: 'UNIKA', fullName: 'UNIQA Insurance Group', tag: 'INSURANCE GROUP', logo: '🛡️', countries: ['AUT', 'SUI', 'POL', 'ROU'], minTier: 1, maxTier: 2 },
  { name: 'Stiegl', fallbackName: 'Stiegel Brew', fullName: 'Stieglbrauerei zu Salzburg', tag: 'BEVERAGE AUSTRIA', logo: '🍺', countries: ['AUT'], minTier: 1, maxTier: 2 },
  { name: 'SPAR Austria', fallbackName: 'SPARA Austria', fullName: 'SPAR Österreich', tag: 'RETAIL PARTNER', logo: '🛒', countries: ['AUT'], minTier: 1, maxTier: 2 },
  { name: 'SPAR', fallbackName: 'SPARA Market', fullName: 'SPAR International', tag: 'RETAIL PARTNER', logo: '🛒', countries: ['SLO', 'SUI', 'HUN', 'CRO'], minTier: 1, maxTier: 2 },
  { name: 'Quickline', fallbackName: 'Quikline', fullName: 'Quickline AG Schweiz', tag: 'SWISS TELECOM', logo: '📡', countries: ['SUI'], minTier: 1, maxTier: 2 },
  { name: 'Mobiliar', fallbackName: 'Mobilia', fullName: 'Die Mobiliar', tag: 'SWISS INSURANCE', logo: '🛡️', countries: ['SUI'], minTier: 1, maxTier: 2 },
  { name: 'PostFinance', fallbackName: 'PostFinanz', fullName: 'PostFinance AG', tag: 'SWISS BANKING', logo: '🏦', countries: ['SUI'], minTier: 1, maxTier: 2 },
  { name: 'CONCORDIA', fallbackName: 'KONKORDIA', fullName: 'CONCORDIA Health', tag: 'HEALTH INSURANCE', logo: '🏥', countries: ['SUI'], minTier: 1, maxTier: 2 },
  { name: 'Coop Schweiz', fallbackName: 'Koop Schweiz', fullName: 'Coop Genossenschaft', tag: 'SUPERMARKET PARTNER', logo: '🛒', countries: ['SUI'], minTier: 1, maxTier: 2 },
  { name: 'AXA Schweiz', fallbackName: 'AXO Schweiz', fullName: 'AXA Versicherungen AG', tag: 'ARENA & INSURANCE', logo: '🛡️', countries: ['SUI'], minTier: 1, maxTier: 2 },
  { name: 'AXA', fallbackName: 'AXO Insurance', fullName: 'AXA Group', tag: 'INSURANCE PARTNER', logo: '🛡️', countries: ['FRA', 'GER', 'ESP'], minTier: 1, maxTier: 2 },
  { name: 'Helvetia', fallbackName: 'Helveta', fullName: 'Helvetia Versicherungen', tag: 'SWISS INSURANCE', logo: '🛡️', countries: ['SUI', 'AUT', 'ESP'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (AUT / SUI)
  { name: 'Hypo Landesbank', fallbackName: 'Alpen-Hypobank', fullName: 'Hypo Landesbank Gruppe', tag: 'REGIONAL BANKING', logo: '🏦', countries: ['AUT'], minTier: 2, maxTier: 3 },
  { name: 'Kantonalbank Regional', fallbackName: 'Kantonal-Finanz', fullName: 'Schweizerische Kantonalbanken', tag: 'CANTONAL BANK', logo: '🏦', countries: ['SUI'], minTier: 2, maxTier: 3 },
  { name: 'EVN / Energie AG', fallbackName: 'AlpenEnergie AG', fullName: 'Landesenergieversorgung', tag: 'REGIONAL POWER', logo: '⚡', countries: ['AUT', 'SUI'], minTier: 2, maxTier: 3 },
  { name: 'Ottakringer / Puntigamer', fallbackName: 'AlpenBräu Tradition', fullName: 'Österreichische Privatbrauerei', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['AUT'], minTier: 2, maxTier: 3 },
  { name: 'Feldschlösschen / Calanda', fallbackName: 'Helvetia Bräu', fullName: 'Brauerei Schweiz AG', tag: 'REGIONAL BREWERY', logo: '🍺', countries: ['SUI'], minTier: 2, maxTier: 3 },
  { name: 'Ochsner Sport Team', fallbackName: 'AlpenSport Team', fullName: 'Teamsport Ausrüstung AG', tag: 'CLUB OUTFITTER', logo: '👕', countries: ['SUI', 'AUT'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (AUT / SUI)
  { name: 'Raiffeisenkasse {city}', fallbackName: 'Regionalbank {city}', fullName: 'Genossenschaftsbank {city}', tag: 'LOCAL BANK', logo: '🏦', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Stadtwerke & E-Werk {city}', fallbackName: 'Gemeindewerke {city}', fullName: 'Technische Betriebe {city}', tag: 'MUNICIPAL UTILITY', logo: '⚡', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Autohaus & Garage {city}', fallbackName: 'Auto-Center {city}', fullName: 'KFZ-Meisterbetrieb {city}', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Bäckerei-Konditorei {city}', fallbackName: 'Dorf-Bäckerei {city}', fullName: 'Traditionsbäckerei {city}', tag: 'LOCAL BAKERY', logo: '🥨', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Holzbau & Schreinerei {city}', fallbackName: 'Zimmerei {city}', fullName: 'Holzbau & Bedachungen {city}', tag: 'LOCAL CARPENTRY', logo: '🪚', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Privatbrauerei {city}', fallbackName: 'Brauhaus {city}', fullName: 'Gasthof & Brauerei {city}', tag: 'LOCAL BREWERY', logo: '🍺', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Physio & Drogerie {city}', fallbackName: 'Gesundheitszentrum {city}', fullName: 'Therapie & Apotheke {city}', tag: 'LOCAL HEALTH', logo: '🏥', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Dorfladen & Getränke {city}', fallbackName: 'Nahversorger {city}', fullName: 'Lebensmittel & Getränke {city}', tag: 'LOCAL GROCER', logo: '🛒', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Baumeister {city}', fallbackName: 'Hoch- & Tiefbau {city}', fullName: 'Bauunternehmung {city} GmbH', tag: 'LOCAL BUILDER', logo: '🏗️', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },
  { name: 'Teamsport {city}', fallbackName: 'Sportgeschäft {city}', fullName: 'Sportartikel & Vereinsbedarf {city}', tag: 'LOCAL SPORT SHOP', logo: '👕', countries: ['AUT', 'SUI'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // ICELAND & FAROE ISLANDS (ISL / FAR) — TIER 1 TO TIER 5
  // ============================================================================
  // Tier 1 & Tier 1-2
  { name: 'Landsbankinn', fallbackName: 'Landsbanki', fullName: 'Landsbankinn hf.', tag: 'ICELAND BANKING', logo: '🏦', countries: ['ISL', 'FAR'], minTier: 1, maxTier: 1 },
  { name: 'Íslandsbanki', fallbackName: 'Islandsbank', fullName: 'Íslandsbanki hf.', tag: 'FINANCIAL GROUP', logo: '🏦', countries: ['ISL'], minTier: 1, maxTier: 1 },
  { name: 'Icelandair', fallbackName: 'Iceland Airway', fullName: 'Icelandair Group', tag: 'ATLANTIC AIRLINE', logo: '✈️', countries: ['ISL', 'FAR'], minTier: 1, maxTier: 1 },
  { name: 'Eimskip', fallbackName: 'Eimschip', fullName: 'Eimskipafélag Íslands', tag: 'MARITIME LOGISTICS', logo: '🚢', countries: ['ISL', 'FAR'], minTier: 1, maxTier: 1 },
  { name: '66°North', fallbackName: '66°Norda', fullName: '66°North Iceland', tag: 'OUTDOOR APPAREL', logo: '🧥', countries: ['ISL', 'FAR'], minTier: 1, maxTier: 1 },
  { name: 'Olís', fallbackName: 'Olis Energy', fullName: 'Olíuverslun Íslands', tag: 'ICELAND ENERGY', logo: '⛽', countries: ['ISL', 'FAR'], minTier: 1, maxTier: 2 },
  { name: 'Coca-Cola ISL', fallbackName: 'Kola Reykjavik', fullName: 'Coca-Cola European Partners ISL', tag: 'CUP & BEVERAGE', logo: '🥤', countries: ['ISL'], minTier: 1, maxTier: 2 },
  { name: 'VÍS', fallbackName: 'VIS Trygging', fullName: 'Vátryggingafélag Íslands', tag: 'INSURANCE ICELAND', logo: '🛡️', countries: ['ISL'], minTier: 1, maxTier: 2 },
  { name: 'Síminn', fallbackName: 'Simin Telecom', fullName: 'Síminn hf.', tag: 'TELECOM ICELAND', logo: '📡', countries: ['ISL'], minTier: 1, maxTier: 2 },
  { name: 'Bónus', fallbackName: 'Bonus Retail', fullName: 'Bónus Supermarket', tag: 'RETAIL ICELAND', logo: '🛒', countries: ['ISL', 'FAR'], minTier: 1, maxTier: 2 },
  { name: 'Orkan', fallbackName: 'Orka Power', fullName: 'Orkan IS', tag: 'MOBILITY & FUEL', logo: '⚡', countries: ['ISL'], minTier: 1, maxTier: 2 },
  // Tier 2-3 Regional (ISL / FAR)
  { name: 'Samherji / Brim Seafood', fallbackName: 'Nordic Pelagic', fullName: 'Sjávarútvegsfyrirtæki hf.', tag: 'MARITIME FISHERIES', logo: '🐟', countries: ['ISL', 'FAR'], minTier: 2, maxTier: 3 },
  { name: 'Krónan / FK', fallbackName: 'Eyja-Markaður', fullName: 'Dagvöruverslun hf.', tag: 'REGIONAL GROCER', logo: '🛒', countries: ['ISL', 'FAR'], minTier: 2, maxTier: 3 },
  { name: 'Betri Banki / Sjóvá', fallbackName: 'Norður-Trygging', fullName: 'Tryggingar & Fjármál hf.', tag: 'REGIONAL INSURANCE', logo: '🛡️', countries: ['ISL', 'FAR'], minTier: 2, maxTier: 3 },
  { name: 'Ölgerðin Egill Skallagrímsson', fallbackName: 'Gull Ölgerð', fullName: 'Ölgerðin hf.', tag: 'BEVERAGE PARTNER', logo: '🍺', countries: ['ISL', 'FAR'], minTier: 2, maxTier: 3 },
  // Tier 3-6 Local / Municipal (ISL / FAR)
  { name: 'Sparisjóður {city}', fallbackName: 'Lokalbanki {city}', fullName: 'Sparisjóður {city} og nágrennis', tag: 'LOCAL SAVINGS BANK', logo: '🏦', countries: ['ISL', 'FAR'], minTier: 3, maxTier: 6 },
  { name: 'Fiskvinnsla {city}', fallbackName: 'Sjávarfang {city}', fullName: 'Útgerðarfélag {city} ehf.', tag: 'LOCAL FISHERIES', logo: '🐟', countries: ['ISL', 'FAR'], minTier: 3, maxTier: 6 },
  { name: 'Bakarí {city}', fallbackName: 'Brauðgerð {city}', fullName: 'Bakarameistarinn {city}', tag: 'LOCAL BAKERY', logo: '🥖', countries: ['ISL', 'FAR'], minTier: 3, maxTier: 6 },
  { name: 'Bílaverkstæði {city}', fallbackName: 'Bílasala {city}', fullName: 'Bílaþjónusta {city} ehf.', tag: 'LOCAL GARAGE', logo: '🚗', countries: ['ISL', 'FAR'], minTier: 3, maxTier: 6 },
  { name: 'Byggingafélag {city}', fallbackName: 'Trésmiðja {city}', fullName: 'Verktakar {city} ehf.', tag: 'LOCAL BUILDER', logo: '🏗️', countries: ['ISL', 'FAR'], minTier: 3, maxTier: 6 },
  { name: 'Orkuveita {city}', fallbackName: 'Hitaveita {city}', fullName: 'Veitur & Orka {city}', tag: 'MUNICIPAL GEOTHERMAL', logo: '⚡', countries: ['ISL', 'FAR'], minTier: 3, maxTier: 6 },
  { name: 'Kjörbúðin {city}', fallbackName: 'Kaupfélag {city}', fullName: 'Matvöruverslun {city}', tag: 'LOCAL GROCER', logo: '🛒', countries: ['ISL', 'FAR'], minTier: 3, maxTier: 6 },
  { name: 'Sjúkraþjálfun {city}', fallbackName: 'Apótek {city}', fullName: 'Heilsugæsla & Sjúkraþjálfun {city}', tag: 'LOCAL CLINIC', logo: '🏥', countries: ['ISL', 'FAR'], minTier: 3, maxTier: 6 },

  // ============================================================================
  // UNIVERSAL / INTERNATIONAL REGIONAL & LOCAL FALLBACKS (TIER 2-3 & TIER 3-6)
  // ============================================================================
  { name: ' {city} Municipal Energy', fallbackName: '{city} Power & Water', fullName: '{city} Municipal Utility Corp.', tag: 'MUNICIPAL UTILITY', logo: '⚡', minTier: 3, maxTier: 6 },
  { name: '{city} Community Bank', fallbackName: 'First Savings {city}', fullName: '{city} Mutual Savings Bank', tag: 'LOCAL SAVINGS BANK', logo: '🏦', minTier: 3, maxTier: 6 },
  { name: '{city} Motors', fallbackName: 'Auto Center {city}', fullName: '{city} Automotive Dealership', tag: 'LOCAL DEALERSHIP', logo: '🚗', minTier: 3, maxTier: 6 },
  { name: '{city} Craft Brewery', fallbackName: 'Old Town Brewery {city}', fullName: '{city} Brewing Company', tag: 'LOCAL BREWERY', logo: '🍺', minTier: 3, maxTier: 6 },
  { name: '{city} Builders & Sons', fallbackName: '{city} Construction', fullName: '{city} Civil & Timber Construction', tag: 'LOCAL CONSTRUCTION', logo: '🏗️', minTier: 3, maxTier: 6 },
  { name: '{city} Physio & Ortho', fallbackName: '{city} Sports Clinic', fullName: '{city} Rehabilitation & Physio Center', tag: 'LOCAL PHYSIO', logo: '🏥', minTier: 3, maxTier: 6 },
  { name: 'Artisan Bakery {city}', fallbackName: '{city} Bakehouse', fullName: 'Traditional Bakery {city}', tag: 'LOCAL BAKERY', logo: '🥖', minTier: 3, maxTier: 6 },
  { name: '{city} Fresh Market', fallbackName: 'Family Grocer {city}', fullName: '{city} Local Supermarket', tag: 'LOCAL GROCER', logo: '🛒', minTier: 3, maxTier: 6 },
  { name: '{city} Freight & Transit', fallbackName: '{city} Haulage Co.', fullName: '{city} Regional Transport Ltd.', tag: 'LOCAL LOGISTICS', logo: '🚚', minTier: 3, maxTier: 6 },
  { name: 'Teamsport {city}', fallbackName: '{city} Athletic Supply', fullName: '{city} Teamwear & Print Shop', tag: 'LOCAL KIT SHOP', logo: '👕', minTier: 3, maxTier: 6 },
];

export const extractClubLocality = (clubName: string = ''): string => {
  const raw = (clubName || '').trim();
  if (!raw) return 'Regio';
  const stripped = raw
    .replace(/^(1\.\s*FC|1\.\s*VfL|SC\s+DHfK|HSC\s+2000|SG\s+BBM|Frisch\s+Auf|Die\s+Eulen|TSG|TSV|TVB|TV|TuS\s+N-|TuS|TUSEM|HSG|SGSH|SG|HC|THW|VfL\s+Eintracht|VfL|MT|TBV|HSV|ThSV|HBW|GWD|ASV|HSC|EHV|DJK|MTV|ATSV|HBC|BTB|OSC|HG|SV|BV|US|BM|CB|CD|RK|MRK|GRK|HRK|ORK|FK|IFK|IK|IF|HK|BK|BSH|GOG|KIF|TTH|TMS|SAH|FIF|SK|CSM|CSU|CS|AHC|SCM|KS|MKS|KPR|SPR|UHC|BSV|GC|Wacker|Pfadi|Kadetten|RTV|STV|HV|JD|CF|SL|FC|AA|ADA|UMF|ÍBV|FH|KA|ÍR|VÍF|H71|KÍF|StÍF)\s+/i, '')
    .replace(/\s+(II|III|2|Youngsters|Junior|Amateure|Handball|e\.V\.|rrh|Niederrhein|Westfalen|Lippe|Dragons|Löwen)$/i, '')
    .trim();
  const slashPart = stripped.split('/')[0].trim();
  const hyphenParts = slashPart.split('-');
  const clean = (slashPart.length > 14 && hyphenParts[0].length >= 4) ? hyphenParts[0].trim() : slashPart;
  return clean || raw;
};

export const getSponsorBrandForClub = (
  countryCode: string = 'GER',
  dealType: 0 | 1 | 2 = 0,
  year: number = 2025,
  clubName: string = '',
  pitchSlot: number = 0,
  tier: number = 1
): SponsorBrand => {
  const norm = normalizeCountry(countryCode || 'GER');
  const modActive = isAnyModActive();
  const effectiveTier = Math.max(1, Math.min(6, tier || 1));

  const matchesTier = (b: SponsorBrand) => {
    const minT = b.minTier ?? 1;
    const maxT = b.maxTier ?? 2;
    return effectiveTier >= minT && effectiveTier <= maxT;
  };

  const regional = SPONSOR_BRANDS.filter(b => b.countries && b.countries.includes(norm) && matchesTier(b));
  const global = SPONSOR_BRANDS.filter(b => (!b.countries || b.countries.length === 0) && matchesTier(b));
  const pool = regional.length > 0 ? [...regional, ...global] : global;

  const activePool = pool.length > 0 ? pool : SPONSOR_BRANDS.filter(matchesTier);
  const seed = (clubName || 'Club').split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 3), 0);
  const baseIdx = Math.abs(seed + year * 11 + pitchSlot * 5) % activePool.length;
  // Offset by dealType so Standard (0), Megadeal (1), and Performance (2) always show 3 distinct brands
  const step = Math.max(1, Math.floor(activePool.length / 3));
  const idx = (baseIdx + dealType * step) % activePool.length;
  const chosen = activePool[idx] || activePool[0] || SPONSOR_BRANDS[0];

  const locality = extractClubLocality(clubName);
  const applyLocality = (str: string) => str.replace(/\{city\}/g, locality).trim();

  const rawName = modActive ? chosen.name : (chosen.fallbackName || chosen.name);
  const rawFull = modActive ? chosen.fullName : (chosen.fallbackName || chosen.fullName);

  return {
    ...chosen,
    name: applyLocality(rawName),
    fullName: applyLocality(rawFull),
  };
};

export interface DynamicSponsorPitchTerms {
  standardPayout: number;
  megaPayout: number;
  performanceUpfront: number;
  performanceBonus: number;
  performanceTargetPos: number;
  megaSuccessProb: number;
  megaSuccessPct: number;
  standardBrand: SponsorBrand;
  megaBrand: SponsorBrand;
  perfBrand: SponsorBrand;
  valuationMult: number;
  activeDrivers: { labelEn: string; labelDe: string; pct: string; positive: boolean }[];
}

export const getDynamicSponsorPitchTerms = (state: any): DynamicSponsorPitchTerms => {
  const tier = state?.club?.tier || 5;
  const country = normalizeCountry(state?.club?.country || 'GER');
  const league = getLeagueInfo(tier, country);
  const leagueAvgOvr = league.avgOvr || 65;
  const clubOvr = state?.club?.baseOvr || leagueAvgOvr;
  const year = state?.year || 2025;
  const pitchSlot = state?.sponsorsPitchedThisSeason || 0;
  const clubName = state?.club?.name || 'Handball Club';

  const activeDrivers: { labelEn: string; labelDe: string; pct: string; positive: boolean }[] = [];

  // 1. Club Stature vs Division Average (0.76x to 1.42x)
  const statureMult = Math.max(0.76, Math.min(1.42, Math.pow(clubOvr / Math.max(40, leagueAvgOvr), 1.35)));
  const statureDiffPct = Math.round((statureMult - 1) * 100);
  if (Math.abs(statureDiffPct) >= 3) {
    activeDrivers.push({
      labelEn: statureDiffPct > 0 ? 'Club Stature' : 'Underdog Brand',
      labelDe: statureDiffPct > 0 ? 'Vereins-Renommee' : 'Außenseiter-Marke',
      pct: `${statureDiffPct > 0 ? '+' : ''}${statureDiffPct}%`,
      positive: statureDiffPct >= 0,
    });
  }

  // 2. Continental Broadcast Exposure
  const euroStatus = state?.euroStatus;
  const euroMult = euroStatus === 'CL' ? 1.24 : euroStatus === 'EL' ? 1.12 : euroStatus === 'ECL' ? 1.06 : 1.0;
  if (euroMult > 1.0) {
    activeDrivers.push({
      labelEn: `${euroStatus} TV Exposure`,
      labelDe: `${euroStatus} TV-Präsenz`,
      pct: `+${Math.round((euroMult - 1) * 100)}%`,
      positive: true,
    });
  }

  // 3. Previous Season Sporting Trajectory
  const clubHistory = (state?.history || []).filter(
    (h: any) => !h.clubName || !state?.club?.name || h.clubName === state.club.name
  );
  const lastSeason = clubHistory.length > 0 ? clubHistory[clubHistory.length - 1] : null;
  let trajectoryMult = 1.0;
  if (lastSeason) {
    const trObj = lastSeason.trophiesThisYear || lastSeason;
    const wonCupOrEuro = Boolean(trObj.cl || trObj.el || trObj.ecl || trObj.dfb || trObj.sc || trObj.esc || trObj.cwc);
    if (lastSeason.pos === 1 || wonCupOrEuro) {
      trajectoryMult = 1.10;
      activeDrivers.push({
        labelEn: 'Title Holder Momentum',
        labelDe: 'Titelträger-Bonus',
        pct: '+10%',
        positive: true,
      });
    } else if (lastSeason.pos <= 3 || lastSeason.promoted) {
      trajectoryMult = 1.05;
      activeDrivers.push({
        labelEn: lastSeason.promoted ? 'Promotion Euphoria' : 'Podium Contender',
        labelDe: lastSeason.promoted ? 'Aufstiegs-Euphorie' : 'Spitzenteam-Bonus',
        pct: '+5%',
        positive: true,
      });
    } else if (lastSeason.relegated) {
      trajectoryMult = 0.90;
      activeDrivers.push({
        labelEn: 'Relegation Discount',
        labelDe: 'Abstiegs-Abschlag',
        pct: '-10%',
        positive: false,
      });
    }
  }

  // 4. Corporate Fan Strategy & Sporting Director Archetype
  let strategyMult = 1.0;
  if (state?.club?.fanStrategy === 'corporate') {
    strategyMult *= 1.08;
    activeDrivers.push({
      labelEn: 'Corporate VIP Hospitality',
      labelDe: 'VIP-Hospitality Fokus',
      pct: '+8%',
      positive: true,
    });
  }
  if (state?.directorArchetype === 'Financial Mogul' || state?.directorArchetype === 'Brand Ambassador') {
    strategyMult *= 1.06;
    activeDrivers.push({
      labelEn: state.directorArchetype,
      labelDe: state.directorArchetype === 'Financial Mogul' ? 'Finanzmogul' : 'Markenbotschafter',
      pct: '+6%',
      positive: true,
    });
  }

  // 5. Arena Hospitality Scale
  const stadium = state?.club?.stadium || 2000;
  const arenaMult = stadium >= 10000 ? 1.08 : stadium >= 6000 ? 1.04 : 1.0;
  if (arenaMult > 1.0) {
    activeDrivers.push({
      labelEn: 'Arena Hospitality Suites',
      labelDe: 'Arena VIP-Logen',
      pct: `+${Math.round((arenaMult - 1) * 100)}%`,
      positive: true,
    });
  }

  // 6. Coach Commercial Skills & Playmaker Style
  const hasSalesmaster = (state?.managerSkills || []).includes('salesmaster') || (state?.managerSkills || []).includes('sponsor_boost');
  const hasPlaymakerPhilosophy = state?.tactic === 'Playmaker Focus' || state?.tactic === 'Total Handball';
  if (hasSalesmaster) {
    activeDrivers.push({
      labelEn: 'Commercial Negotiator',
      labelDe: 'Chef-Unterhändler',
      pct: '+10%',
      positive: true,
    });
  }
  if (hasPlaymakerPhilosophy) {
    activeDrivers.push({
      labelEn: 'Attractive Playstyle',
      labelDe: 'Attraktiver Spielstil',
      pct: '+15%',
      positive: true,
    });
  }

  // 7. Subtle deterministic market variance by club & year (0.97 to 1.03) — fixed for the entire season
  const seed = clubName.split('').reduce((acc: number, ch: string, i: number) => acc + ch.charCodeAt(0) * (i + 5), 0);
  const organicFactor = 0.97 + (((seed + year * 19) % 61) / 1000);

  const marketMult = statureMult * euroMult * trajectoryMult * strategyMult * arenaMult * organicFactor;
  const skillMult = (hasSalesmaster ? 1.10 : 1.0) * (hasPlaymakerPhilosophy ? 1.15 : 1.0);
  const totalMult = marketMult * skillMult;

  const roundStep = tier <= 2 ? 500 : tier === 3 ? 250 : 50;
  const cleanRound = (val: number) => Math.max(roundStep, Math.round(val / roundStep) * roundStep);

  const standardPayout = cleanRound(getLeagueScaledVal(tier, 100000, country) * totalMult);
  const megaPayout = cleanRound(getLeagueScaledVal(tier, 500000, country) * totalMult);
  const performanceUpfront = cleanRound(getLeagueScaledVal(tier, 50000, country) * totalMult);
  const performanceBonus = cleanRound(getLeagueScaledVal(tier, 750000, country) * totalMult);

  // Dynamic Megadeal negotiation probability (32% to 72%)
  const ovrProbDelta = Math.max(-0.08, Math.min(0.10, (clubOvr - leagueAvgOvr) * 0.008));
  const euroProbBonus = euroStatus === 'CL' ? 0.06 : euroStatus === 'EL' ? 0.03 : euroStatus === 'ECL' ? 0.01 : 0;
  const rep = typeof state?.reputation === 'number' ? state.reputation : 50;
  const repProbBonus = rep >= 80 ? 0.04 : rep >= 60 ? 0.02 : rep < 30 ? -0.03 : 0;
  const corpProbBonus = (state?.club?.fanStrategy === 'corporate' ? 0.03 : 0) +
    (state?.directorArchetype === 'Financial Mogul' || state?.directorArchetype === 'Brand Ambassador' ? 0.03 : 0);
  const salesProbBonus = hasSalesmaster ? 0.10 : 0;

  const megaSuccessProb = Math.max(0.32, Math.min(0.72, 0.45 + ovrProbDelta + euroProbBonus + repProbBonus + corpProbBonus + salesProbBonus));
  const megaSuccessPct = Math.round(megaSuccessProb * 100);

  const baseStandard = getSponsorBrandForClub(country, 0, year, clubName, 0, tier);
  const baseMega = getSponsorBrandForClub(country, 1, year, clubName, 0, tier);
  const basePerf = getSponsorBrandForClub(country, 2, year, clubName, 0, tier);

  const seasonDeals = (state?.seasonSponsorDeals && state?.seasonSponsorDealsYear === year)
    ? state.seasonSponsorDeals
    : {};

  const resolveSeasonBrand = (dealType: 0 | 1 | 2, baseBrand: SponsorBrand): SponsorBrand => {
    const entry = seasonDeals[dealType];
    if (!entry) return baseBrand;
    if (entry.status === 'failed') {
      return {
        ...baseBrand,
        name: 'Empty',
        fullName: 'Empty',
        logo: '',
      };
    }
    return {
      ...baseBrand,
      name: entry.brandName || baseBrand.name,
      fullName: entry.brandName || baseBrand.fullName,
      logo: entry.brandLogo !== undefined ? entry.brandLogo : baseBrand.logo,
    };
  };

  return {
    standardPayout: seasonDeals[0]?.status === 'signed' && seasonDeals[0]?.payout !== undefined ? seasonDeals[0].payout : standardPayout,
    megaPayout: seasonDeals[1]?.status === 'signed' && seasonDeals[1]?.payout !== undefined ? seasonDeals[1].payout : megaPayout,
    performanceUpfront: seasonDeals[2]?.status === 'signed' && seasonDeals[2]?.payout !== undefined ? seasonDeals[2].payout : performanceUpfront,
    performanceBonus: seasonDeals[2]?.status === 'signed' && seasonDeals[2]?.bonus !== undefined ? seasonDeals[2].bonus : performanceBonus,
    performanceTargetPos: Math.max(1, Math.floor((league.teams || 18) / 2)),
    megaSuccessProb,
    megaSuccessPct,
    standardBrand: resolveSeasonBrand(0, baseStandard),
    megaBrand: resolveSeasonBrand(1, baseMega),
    perfBrand: resolveSeasonBrand(2, basePerf),
    valuationMult: totalMult,
    activeDrivers,
  };
};

export interface ManagerSkillInfo {
  id: string;
  nameEn: string;
  nameDe: string;
  icon: string;
  descEn: string;
  descDe: string;
  effectEn: string;
  effectDe: string;
  cost: number;
}

export const MANAGER_SKILLS: Record<string, ManagerSkillInfo> = {
  'vorstandsliebling': {
    id: 'vorstandsliebling',
    nameEn: "Board Favorite",
    nameDe: "Vorstandsliebling",
    icon: UserCircle,
    descEn: "Builds deep trust with directors, drastically reducing pressure and giving you a higher tolerance floor during crisis periods.",
    descDe: "Erwirbt tiefes Vertrauen der Klubfuehrung, verringert den Druck des Vorstands bei Durststrecken.",
    effectEn: "+15 Board Satisfaction Floor & delays warnings by 1 season",
    effectDe: "+15 Vorstands-Toleranz & verzoegert Abmahnungen um 1 Saison",
    cost: 15
  },
  'talentscout': {
    id: 'talentscout',
    nameEn: "Talent Scout",
    nameDe: "Talentscout",
    icon: Telescope,
    descEn: "Sharp eye for supreme prodigies — boosts youth graduate output and halves talent poaching rates.",
    descDe: "Schaerft den Blick fuer absolute Ausnahmetalente — erhoeht Erfolgschance in der Jugendakademie.",
    effectEn: "+25% youth grad chance, +1 OVR boost on youth events & -50% poaching",
    effectDe: "+25% Akademie-Erfolg, +1 GES bei Talent-Events & 50% weniger Abwerbung",
    cost: 15
  },
  'ultraliebling': {
    id: 'ultraliebling',
    nameEn: "Fan Icon",
    nameDe: "Ultraliebling",
    icon: Megaphone,
    descEn: "Inspirational relationship with supporters, driving electric arena atmosphere and ticket revenue.",
    descDe: "Hautnahe Bindung zu den Fans, sorgt fuer kochende Hallen und hoehere Auslastung.",
    effectEn: "+15% arena attendance & boosted fan loyalty income",
    effectDe: "+15% hoehere Zuschauerzahlen & gesteigerte Treue-Einnahmen",
    cost: 15
  },
  'salesmaster': {
    id: 'salesmaster',
    nameEn: "Commercial Negotiator",
    nameDe: "Chef-Unterhaendler",
    icon: Briefcase,
    descEn: "Master commercial negotiator, attracting elite corporate sponsors and maximizing deal payouts.",
    descDe: "Verhandlungsgeschick auf Spitzenniveau, lockt internationale Grossponsoren an.",
    effectEn: "+20% base sponsorship, +10% deal payouts & +10% Megadeal pitch odds",
    effectDe: "+20% Basis-Sponsoring, +10% Deal-Prämien & +10% Megadeal-Erfolgschance",
    cost: 15
  },
  'rosinenpicker': {
    id: 'rosinenpicker',
    nameEn: "Bargain Hunter",
    nameDe: "Rosinenpicker",
    icon: Tags,
    descEn: "Unrivaled transfer market acumen — secures key player acquisitions at discount prices.",
    descDe: "Meisterhafte Transferverhandlungen — kauft Verstaerkungen zu Schnaeppchenpreisen.",
    effectEn: "-20% squad upgrade costs & +1 OVR bonus on key transfers",
    effectDe: "-20% Kader-Upgrade-Kosten & +1 GES-Bonus bei Key-Transfers",
    cost: 15
  },
  'untouchable': {
    id: 'untouchable',
    nameEn: "Board Darling",
    nameDe: "Unkuendbar",
    icon: ShieldHalf,
    descEn: "Board expectations are heavily relaxed. You won't be fired for missing targets, allowing you to survive relegation and rebuild.",
    descDe: "Die Vorstandserwartungen sind extrem entspannt. Du wirst nicht gefeuert, wenn du Ziele verfehlst, und kannst Abstiege ueberstehen und neu aufbauen.",
    effectEn: "Immune to Board sackings (WHYDFML protocol bypass).",
    effectDe: "Immun gegen Entlassungen durch den Vorstand (WHYDFML-Schutz).",
    cost: 40
  },
  'star_magnet': {
    id: 'star_magnet',
    nameEn: "Star Magnet",
    nameDe: "Star-Magnet",
    icon: Star,
    descEn: "Your elite reputation attracts top talent. Increases the maximum number of Key Player signings per season from 2 to 3.",
    descDe: "Dein exzellenter Ruf lockt Top-Talente an. Erhoeht die maximale Anzahl an Schluesselspieler-Transfers pro Saison von 2 auf 3.",
    effectEn: "+1 Max Key Player Transfer per season (3 instead of 2)",
    effectDe: "+1 max. Schluesselspieler-Transfer pro Saison (3 statt 2)",
    cost: 15
  },
  'tactical_mastermind': {
    id: 'tactical_mastermind',
    nameEn: "Tactical Genius",
    nameDe: "Spielstil-Meister",
    icon: Swords,
    descEn: "Grants a tactical advantage in match simulations. Also reveals opponent tactics and scout reports during Cup matches.",
    descDe: "Perfektioniert die Taktik in der Simulation. Offenbart die gegnerische Taktik und Scout-Reports in Pokal- & Entscheidungsspielen.",
    effectEn: "+2 OVR tactical bonus & unlocks Fog of War",
    effectDe: "+2 GES taktischer Bonus & entschleiert Gegner-Taktik",
    cost: 15
  }
};

export const calculateInitialReputation = (baseOvr: number): number => {
  return Math.min(100, Math.max(1, Math.round(1 + ((baseOvr - 40) / 52) * 99)));
};

export const calculateClubReputation = (baseOvr: number, tier: number = 1): number => {
  const ovrFactor = Math.max(0, (baseOvr - 35) / 57) * 78;
  const tierBonus = (6 - Math.min(5, Math.max(1, tier))) * 4.4;
  return Math.min(100, Math.max(1, Math.round(ovrFactor + tierBonus)));
};

export type CountryEconomyTier = 1 | 2 | 3 | 4;

export interface CountryEconomicProfile {
  tier: CountryEconomyTier;
  tierName: string;
  pinnacleArenaCap: number;
  tvScale: number; // relative to Germany 100%
  sponsorScale: number; // base commercial sponsor scale
  sugarDaddyBoost: number; // sponsor boost for elite European contenders (HUN/POL/MKD)
  operationalCostScale: number; // local cost of living & facility operations
  baseTicketYield: Record<number, number>; // net ticket yield per fan by tier
}

export const COUNTRY_ECONOMIC_PROFILES: Record<string, CountryEconomicProfile> = {
  // Tier 1: Mega Markets (Germany, France)
  GER: {
    tier: 1,
    tierName: 'Tier 1: Mega Market (Centralized Media Contract)',
    pinnacleArenaCap: 30000,
    tvScale: 1.0, // €3.5M HBL 1 broadcast contract
    sponsorScale: 1.0,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 1.0,
    baseTicketYield: { 1: 18, 2: 11, 3: 6.5, 4: 4, 5: 2.5, 6: 2 }
  },
  FRA: {
    tier: 1,
    tierName: 'Tier 1: Mega Market (Premium National Sports League)',
    pinnacleArenaCap: 20000,
    tvScale: 0.35, // €1.2M LNH broadcast rights
    sponsorScale: 0.95,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.95,
    baseTicketYield: { 1: 17, 2: 10, 3: 6, 4: 3.5, 5: 2.5, 6: 2 }
  },

  // Tier 2: Elite / Sugar Daddy & State Benefactor Markets (Hungary, Poland, Denmark, North Macedonia)
  HUN: {
    tier: 2,
    tierName: 'Tier 2: Elite State / Corporate Benefactor Market',
    pinnacleArenaCap: 15000,
    tvScale: 0.08, // €280k domestic TV
    sponsorScale: 0.70,
    sugarDaddyBoost: 1.10, // Veszprém / Szeged reach up to 110% of German commercial sponsorship
    operationalCostScale: 0.60,
    baseTicketYield: { 1: 14, 2: 8.0, 3: 5.0, 4: 3.0, 5: 1.8 }
  },
  POL: {
    tier: 2,
    tierName: 'Tier 2: Elite Industrial Benefactor Market',
    pinnacleArenaCap: 15000,
    tvScale: 0.09, // €320k domestic TV
    sponsorScale: 0.65,
    sugarDaddyBoost: 1.05, // Kielce / Wisła Płock backed by major industrial state groups
    operationalCostScale: 0.60,
    baseTicketYield: { 1: 14, 2: 8.0, 3: 5.0 }
  },
  DEN: {
    tier: 2,
    tierName: 'Tier 2: Elite Commercial Handball Market',
    pinnacleArenaCap: 14000,
    tvScale: 0.12, // €420k TV
    sponsorScale: 0.85,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.85,
    baseTicketYield: { 1: 18, 2: 11, 3: 6.5, 4: 4.0, 5: 2.5 }
  },
  MKD: {
    tier: 2,
    tierName: 'Tier 2: Elite Benefactor Market',
    pinnacleArenaCap: 10000,
    tvScale: 0.05, // €175k TV
    sponsorScale: 0.50,
    sugarDaddyBoost: 1.15, // Vardar / Pelister private benefactors
    operationalCostScale: 0.40,
    baseTicketYield: { 1: 10, 2: 5.5 }
  },

  // Tier 3: Mid-Tier European Markets (Spain, Portugal, Sweden, Norway)
  ESP: {
    tier: 3,
    tierName: 'Tier 3: Mid-Tier European (ASOBAL Heritage)',
    pinnacleArenaCap: 8000,
    tvScale: 0.07, // €250k domestic TV (Barca subsidizes from football)
    sponsorScale: 0.40,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.50,
    baseTicketYield: { 1: 14, 2: 8.5, 3: 5.0, 4: 3.2, 5: 2.2, 6: 1.5 }
  },
  POR: {
    tier: 3,
    tierName: 'Tier 3: Mid-Tier European (Multi-Sport Club Model)',
    pinnacleArenaCap: 6500,
    tvScale: 0.05, // €180k TV
    sponsorScale: 0.40,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.48,
    baseTicketYield: { 1: 11, 2: 6.5, 3: 4.0, 4: 2.5, 5: 1.6 }
  },
  SWE: {
    tier: 3,
    tierName: 'Tier 3: Mid-Tier European (Organic Fan-Owned Model)',
    pinnacleArenaCap: 8000,
    tvScale: 0.06, // €200k TV
    sponsorScale: 0.45,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.65,
    baseTicketYield: { 1: 15, 2: 9.0, 3: 5.5, 4: 3.5, 5: 2.2 }
  },
  NOR: {
    tier: 3,
    tierName: 'Tier 3: Mid-Tier European (Sustainable Nordic Model)',
    pinnacleArenaCap: 8000,
    tvScale: 0.06, // €200k TV
    sponsorScale: 0.50,
    sugarDaddyBoost: 1.05, // Kolstad project backing
    operationalCostScale: 0.70,
    baseTicketYield: { 1: 16, 2: 9.5, 3: 6.0, 4: 3.8, 5: 2.4 }
  },

  // Tier 4: Developing Markets (Romania, Croatia, Switzerland, Austria, Iceland, England)
  ROU: {
    tier: 4,
    tierName: 'Tier 4: Developing European Market',
    pinnacleArenaCap: 6000,
    tvScale: 0.04, // €140k TV
    sponsorScale: 0.30,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.40,
    baseTicketYield: { 1: 10, 2: 5.5 }
  },
  CRO: {
    tier: 4,
    tierName: 'Tier 4: Developing European Market',
    pinnacleArenaCap: 6000,
    tvScale: 0.03, // €100k TV
    sponsorScale: 0.28,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.42,
    baseTicketYield: { 1: 10, 2: 6.0, 3: 3.8, 4: 2.4, 5: 1.5 }
  },
  SUI: {
    tier: 4,
    tierName: 'Tier 4: High-Cost Developing Market',
    pinnacleArenaCap: 5000,
    tvScale: 0.04, // €140k TV
    sponsorScale: 0.35,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.75,
    baseTicketYield: { 1: 16, 2: 9.5, 3: 5.5 }
  },
  AUT: {
    tier: 4,
    tierName: 'Tier 4: Developing European Market',
    pinnacleArenaCap: 4500,
    tvScale: 0.03, // €100k TV
    sponsorScale: 0.25,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.55,
    baseTicketYield: { 1: 12, 2: 7.0, 3: 4.2 }
  },
  ISL: {
    tier: 4,
    tierName: 'Tier 4: Compact Island Market (~380k pop)',
    pinnacleArenaCap: 3500,
    tvScale: 0.02, // €60k TV
    sponsorScale: 0.20,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.45,
    baseTicketYield: { 1: 12, 2: 7.0, 3: 4.2, 4: 2.5 }
  },
  ENG: {
    tier: 4,
    tierName: 'Tier 4: Grassroots Developing Market',
    pinnacleArenaCap: 3000,
    tvScale: 0.01, // €30k TV
    sponsorScale: 0.15,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.50,
    baseTicketYield: { 1: 8, 2: 4.5 }
  },
  SLO: {
    tier: 3,
    tierName: 'Tier 3: Continental Stronghold (Balkan Heritage)',
    pinnacleArenaCap: 7000,
    tvScale: 0.05, // €180k TV
    sponsorScale: 0.40,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.52,
    baseTicketYield: { 1: 12, 2: 7.0 }
  },
  ITA: {
    tier: 4,
    tierName: 'Tier 4: Developing Mediterranean Market',
    pinnacleArenaCap: 4500,
    tvScale: 0.03, // €100k TV
    sponsorScale: 0.25,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.50,
    baseTicketYield: { 1: 10, 2: 5.5 }
  },
  USA: {
    tier: 4,
    tierName: 'Tier 4: Emerging North American Market',
    pinnacleArenaCap: 6000,
    tvScale: 0.02, // €60k TV
    sponsorScale: 0.30,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.70,
    baseTicketYield: { 1: 15 }
  },
  ECU: {
    tier: 4,
    tierName: 'Tier 4: Developing South American Market',
    pinnacleArenaCap: 3000,
    tvScale: 0.01, // €30k TV
    sponsorScale: 0.15,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.35,
    baseTicketYield: { 1: 8 }
  }
};

export const getCountryEconomicProfile = (country: string = 'GER'): CountryEconomicProfile => {
  const norm = normalizeCountry(country);
  return COUNTRY_ECONOMIC_PROFILES[norm] || {
    tier: 4,
    tierName: 'Tier 4: Developing Market',
    pinnacleArenaCap: 5000,
    tvScale: 0.03,
    sponsorScale: 0.25,
    sugarDaddyBoost: 1.0,
    operationalCostScale: 0.45,
    baseTicketYield: { 1: 10, 2: 5, 3: 3 }
  };
};

export const getPinnacleArenaCapacity = (country: string = 'GER'): number => {
  return getCountryEconomicProfile(country).pinnacleArenaCap;
};

// HANDBALL SCALED BUDGETS & OPERATIONS
export const getCountryMult = (country: string): number => {
  return getCountryEconomicProfile(country).operationalCostScale;
};


export const STARTING_BUDGETS: Record<number, number> = { 1: 650000, 2: 220000, 3: 85000, 4: 35000, 5: 15000, 6: 6000 };

export const getStartingBudget = (tier: number, country: string = 'GER'): number => {
  const base = STARTING_BUDGETS[tier] || 5000;
  return Math.round(base * getCountryMult(country));
};

export const getCreditLimit = (tier: number, country: string = 'GER'): number => {
  const baseLimits: Record<number, number> = {
    1: 1500000, // Top tier: emergency room for elite wages & European cashflows
    2: 600000,  // Pro transition tier
    3: 180000,  // Semi-pro tier
    4: 60000,   // Regional tier
    5: 25000,   // Amateur tier
    6: 10000,   // Grassroots local tier
  };
  const base = baseLimits[tier] || 10000;
  return Math.round(base * getCountryMult(country));
};

export const getRegionalTourCost = (tier: number, country: string = 'GER'): number => {
  const baseCosts: Record<number, number> = {
    1: 25000,
    2: 12000,
    3: 5000,
    4: 2200,
    5: 1000,
    6: 450,
  };
  const base = baseCosts[tier] || 450;
  return Math.max(250, Math.round(base * getCountryMult(country)));
};

export const YOUTH_GRAD_ODDS: Record<number, number> = { 1: 0.40, 2: 0.60, 3: 0.75, 4: 0.88, 5: 0.95, 6: 0.98, 7: 1.0 };

export const PHILOSOPHIES: Record<string, PhilosophyInfo> = {
  'Fast Break': {
    icon: Gauge,
    color: 'text-orange-500',
    en: 'High-Paced Transition & Counter',
    de: 'Schnelle Mitte & Konter',
    gfMod: 1.18,
    gaMod: 1.10,
    perkEn: '+12% Fanbase Growth & +1 Home OVR Boost',
    perkDe: '+12% Fanwachstum & +1 Heim-GES-Bonus',
    effectDescEn: 'Thrills supporters and fills arenas with high-scoring, rapid transition play.',
    effectDescDe: 'Begeistert Fans und fuellt die Halle durch torreiche, schnelle Angriffe.',
    ovrBonusType: 'home'
  },
  'Aggressive 6-0': {
    icon: ShieldHalf,
    color: 'text-emerald-500',
    en: 'Solid Defensive Wall & Physicality',
    de: 'Kompakte 6-0 Deckung & Haerte',
    gfMod: 0.62,
    gaMod: 0.52,
    perkEn: '-40% Goal Difference Damage & +1 Season Grace in Debt/Relegation',
    perkDe: '-40% Tordifferenz-Schaden & +1 Saison Schonfrist bei Abstiegssorgen',
    effectDescEn: 'Locks down matches to secure crucial low-scoring wins when fighting for survival.',
    effectDescDe: 'Macht hinten dicht und erkaempft dreckige Siege im Abstiegskampf.',
    ovrBonusType: 'catenaccio'
  },
  'Playmaker Focus': {
    icon: Network,
    color: 'text-blue-500',
    en: 'Structured Set-Plays & Control',
    de: 'Ruhiger Spielaufbau & Kontrolle',
    gfMod: 0.88,
    gaMod: 0.72,
    perkEn: '+15% Sponsor Income & +2 OVR vs Weaker Opponents (Req. 60+ OVR)',
    perkDe: '+15% Sponsoreneinnahmen & +2 GES gegen schwaechere Klubs (Ab GES 60)',
    effectDescEn: 'Dictates game rhythm to reliably beat weaker teams and attract prestige sponsors.',
    effectDescDe: 'Diktierte den Rhythmus, vermeidet Ausrutscher und lockt Edel-Sponsoren an.',
    ovrBonusType: 'dominance'
  },
  'Offensive 3-2-1': {
    icon: Zap,
    color: 'text-yellow-500',
    en: 'Offensive Defense & Interceptions',
    de: 'Offensive Deckung & Ballgewinne',
    gfMod: 1.28,
    gaMod: 1.22,
    perkEn: '+3 OVR Giant-Killer Boost vs Stronger Teams & Cup Matches',
    perkDe: '+3 GES Underdog-Bonus gegen staerkere Klubs & im Pokal',
    effectDescEn: 'Overwhelms superior opponents in cup ties and derbies with high steals and chaos.',
    effectDescDe: 'Ueberrumpelt staerkere Gegner im Pokal durch viele Ballgewinne und Chaos.',
    ovrBonusType: 'underdog'
  },
  '7v6 Empty Net': {
    icon: User,
    color: 'text-cyan-400',
    en: '7v6 Extra Attacker (Risky)',
    de: '7 gegen 6 (Risiko)',
    gfMod: 1.05,
    gaMod: 0.88,
    perkEn: '+2 OVR Away Match Master & -10% Squad Upgrade Costs in Lower Leagues',
    perkDe: '+2 GES Auswaerts-Bonus & -10% Upgrade-Kosten in tiefen Ligen',
    effectDescEn: 'Uses the extra attacker to break down stubborn defenses, highly effective away from home.',
    effectDescDe: 'Nutzt den 7. Feldspieler, um massierte Deckungen zu knacken, effektiv auswaerts.',
    ovrBonusType: 'away'
  }
};

export const TACTICS = PHILOSOPHIES;

export const rand = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  ratePerEur: number;
  symbolPosition: 'prefix' | 'suffix';
  spaceBetween?: boolean;
}

export const COUNTRY_CURRENCIES: Record<string, CurrencyInfo> = {
  'GER': { code: 'EUR', symbol: '€', name: 'Euro', ratePerEur: 1.0, symbolPosition: 'prefix', spaceBetween: false },
  'DEN': { code: 'DKK', symbol: 'kr.', name: 'Danish Krone', ratePerEur: 7.5, symbolPosition: 'prefix', spaceBetween: true },
  'FRA': { code: 'EUR', symbol: '€', name: 'Euro', ratePerEur: 1.0, symbolPosition: 'prefix', spaceBetween: false },
  'ESP': { code: 'EUR', symbol: '€', name: 'Euro', ratePerEur: 1.0, symbolPosition: 'prefix', spaceBetween: false },
  'SWE': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', ratePerEur: 11.5, symbolPosition: 'suffix', spaceBetween: true },
  'CRO': { code: 'EUR', symbol: '€', name: 'Euro', ratePerEur: 1.0, symbolPosition: 'prefix', spaceBetween: false },
  'POR': { code: 'EUR', symbol: '€', name: 'Euro', ratePerEur: 1.0, symbolPosition: 'prefix', spaceBetween: false },
  'NOR': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', ratePerEur: 11.5, symbolPosition: 'prefix', spaceBetween: true },
  'HUN': { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', ratePerEur: 400, symbolPosition: 'suffix', spaceBetween: true },
  'ISL': { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna', ratePerEur: 150, symbolPosition: 'suffix', spaceBetween: true },
  'POL': { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', ratePerEur: 4.3, symbolPosition: 'suffix', spaceBetween: true },
  'AUT': { code: 'EUR', symbol: '€', name: 'Euro', ratePerEur: 1.0, symbolPosition: 'prefix', spaceBetween: false },
  'SUI': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', ratePerEur: 0.95, symbolPosition: 'prefix', spaceBetween: true },
  'ITA': { code: 'EUR', symbol: '€', name: 'Euro', ratePerEur: 1.0, symbolPosition: 'prefix', spaceBetween: false },
  'SLO': { code: 'EUR', symbol: '€', name: 'Euro', ratePerEur: 1.0, symbolPosition: 'prefix', spaceBetween: false },
  'MKD': { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar', ratePerEur: 61.5, symbolPosition: 'suffix', spaceBetween: true },
  'ROU': { code: 'RON', symbol: 'lei', name: 'Romanian Leu', ratePerEur: 4.97, symbolPosition: 'suffix', spaceBetween: true },
  'USA': { code: 'USD', symbol: '$', name: 'US Dollar', ratePerEur: 1.08, symbolPosition: 'prefix', spaceBetween: false },
  'ECU': { code: 'USD', symbol: '$', name: 'US Dollar', ratePerEur: 1.08, symbolPosition: 'prefix', spaceBetween: false },
};

let activeCountryCode: string = 'GER';
export const setActiveCountryCode = (code: string | undefined): void => {
  if (code) {
    activeCountryCode = normalizeCountry(code);
  }
};
export const getActiveCountryCode = (): string => activeCountryCode;

export const getCurrencyForCountry = (countryCode?: string): CurrencyInfo => {
  const norm = normalizeCountry(countryCode || activeCountryCode || 'GER');
  return COUNTRY_CURRENCIES[norm] || COUNTRY_CURRENCIES['GER'];
};

export const convertEurToLocal = (eurAmount: number, countryCode?: string): number => {
  const curr = getCurrencyForCountry(countryCode);
  return Math.round(eurAmount * curr.ratePerEur);
};

export const convertLocalToEur = (localAmount: number, countryCode?: string): number => {
  const curr = getCurrencyForCountry(countryCode);
  return Math.round(localAmount / (curr.ratePerEur || 1));
};

export const formatMoney = (
  val: number | string,
  countryCode?: string,
  skipConversion: boolean = false
): string => {
  let num = typeof val === 'number' ? val : parseFloat(val);
  const currency = getCurrencyForCountry(countryCode);
  if (isNaN(num)) {
    return currency.symbolPosition === 'prefix'
      ? `${currency.symbol}${currency.spaceBetween ? ' ' : ''}0`
      : `0${currency.spaceBetween ? ' ' : ''}${currency.symbol}`;
  }

  const isNeg = num < 0;
  num = Math.abs(num);

  if (!skipConversion && currency.ratePerEur !== 1.0) {
    num = num * currency.ratePerEur;
  }

  let formattedVal: string;
  if (num >= 1000000) {
    const valInM = num / 1000000;
    formattedVal = `${parseFloat(valInM.toFixed(2))}M`;
  } else if (num >= 1000) {
    const valInK = num / 1000;
    formattedVal = `${parseFloat(valInK.toFixed(2))}K`;
  } else {
    formattedVal = `${Math.floor(num)}`;
  }

  const result = currency.symbolPosition === 'prefix'
    ? `${currency.symbol}${currency.spaceBetween ? ' ' : ''}${formattedVal}`
    : `${formattedVal}${currency.spaceBetween ? ' ' : ''}${currency.symbol}`;

  return isNeg ? `-${result}` : result;
};

export const formatNum = (num: number): string => (num || 0).toLocaleString('en-US');

export type OvrCompetitiveTier = 'championship' | 'mid-table' | 'low-table' | 'relegation';

export interface OvrTierConfig {
  tier: OvrCompetitiveTier;
  color: 'green' | 'white' | 'orange' | 'red';
  hex: string;
  ringGlow: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  glowLine: string;
  boxBg: string;
  boxBorder: string;
  valueText: string;
  subText: string;
  subTextMuted: string;
  progressGradient: string;
  analysisBorder: string;
  statusLabelEn: string;
  statusLabelDe: string;
  statusIcon: string;
  modalBorder: string;
  modalShadow: string;
  ambientGlow: string;
  headerBorder: string;
  benchmarkCardBorder: string;
  buttonStyle: string;
  footerBorder: string;
  benchmarkNeedle: string;
  benchmarkDot: string;
  cardBorder: string;
  summaryEn: string;
  summaryDe: string;
}

export const getOvrTierConfig = (ovr: number, leagueAvgOvr: number): OvrTierConfig => {
  const diff = ovr - leagueAvgOvr;

  // Green: Championship material (>= +3 vs league average)
  if (diff >= 3) {
    return {
      tier: 'championship',
      color: 'green',
      hex: '#10b981',
      ringGlow: 'rgba(16, 185, 129, 0.35)',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      glowLine: 'via-emerald-400/80',
      boxBg: 'bg-emerald-500/10',
      boxBorder: 'border-emerald-500/20',
      valueText: 'text-emerald-400',
      subText: 'text-emerald-300',
      subTextMuted: 'text-emerald-300/70',
      progressGradient: 'from-emerald-500 to-teal-400',
      analysisBorder: 'border-emerald-500/20 bg-emerald-500/[0.04]',
      statusLabelEn: 'CHAMPIONSHIP MATERIAL',
      statusLabelDe: 'TITELANWÄRTER',
      statusIcon: 'fa-trophy',
      modalBorder: 'border-emerald-500/35',
      modalShadow: 'shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(16,185,129,0.18),inset_0_1px_0_rgba(16,185,129,0.25)]',
      ambientGlow: 'bg-[radial-gradient(120%_90%_at_50%_0%,rgba(16,185,129,0.15)_0%,transparent_60%)]',
      headerBorder: 'border-emerald-500/20',
      benchmarkCardBorder: 'border-emerald-500/20 bg-emerald-500/[0.02]',
      buttonStyle: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border-emerald-500/35',
      footerBorder: 'border-emerald-500/20',
      benchmarkNeedle: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      benchmarkDot: 'bg-emerald-400',
      cardBorder: 'border-white/[0.08] hover:border-emerald-500/40 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55),0_0_20px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]',
      summaryEn: 'Your squad rating clearly exceeds the league benchmark. Silverware or promotion is a realistic expectation.',
      summaryDe: 'Dein Kader übertrifft das Ligamaß deutlich. Aufstieg oder Titelgewinn sind realistische Saisonziele.'
    };
  }

  // White: Mid-table (within 2 points of league average: -2 to +2)
  if (diff >= -2) {
    return {
      tier: 'mid-table',
      color: 'white',
      hex: '#f4f4f5',
      ringGlow: 'rgba(255, 255, 255, 0.22)',
      badgeBg: 'bg-white/10',
      badgeText: 'text-zinc-100',
      badgeBorder: 'border-white/20',
      glowLine: 'via-zinc-200/80',
      boxBg: 'bg-white/[0.06]',
      boxBorder: 'border-white/15',
      valueText: 'text-white',
      subText: 'text-zinc-200',
      subTextMuted: 'text-zinc-400',
      progressGradient: 'from-zinc-400 to-zinc-200',
      analysisBorder: 'border-white/15 bg-white/[0.03]',
      statusLabelEn: 'MID-TABLE',
      statusLabelDe: 'GESICHERTES MITTELFELD',
      statusIcon: 'fa-equals',
      modalBorder: 'border-white/25',
      modalShadow: 'shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.2)]',
      ambientGlow: 'bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_60%)]',
      headerBorder: 'border-white/15',
      benchmarkCardBorder: 'border-white/10 bg-white/[0.02]',
      buttonStyle: 'bg-white/10 hover:bg-white/20 text-white border-white/25',
      footerBorder: 'border-white/15',
      benchmarkNeedle: 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]',
      benchmarkDot: 'bg-white',
      cardBorder: 'border-white/[0.08] hover:border-white/30 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55),0_0_20px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)]',
      summaryEn: 'Your squad is balanced and competitive with the league average. Tactical consistency will determine your table position.',
      summaryDe: 'Dein Kader liegt im gesicherten Mittelfeld auf Augenhöhe mit der Liga. Spieltagstaktik und Konstanz entscheiden.'
    };
  }

  // Orange: Low table risk (-3 to -5 vs league average)
  if (diff >= -5) {
    return {
      tier: 'low-table',
      color: 'orange',
      hex: '#f97316',
      ringGlow: 'rgba(249, 115, 22, 0.35)',
      badgeBg: 'bg-orange-500/15',
      badgeText: 'text-orange-400',
      badgeBorder: 'border-orange-500/30',
      glowLine: 'via-orange-400/80',
      boxBg: 'bg-orange-500/10',
      boxBorder: 'border-orange-500/20',
      valueText: 'text-orange-400',
      subText: 'text-orange-300',
      subTextMuted: 'text-orange-300/70',
      progressGradient: 'from-orange-500 to-amber-400',
      analysisBorder: 'border-orange-500/20 bg-orange-500/[0.04]',
      statusLabelEn: 'LOW TABLE RISK',
      statusLabelDe: 'UNTERES TABELLENDRITTEL',
      statusIcon: 'fa-shield-halved',
      modalBorder: 'border-orange-500/35',
      modalShadow: 'shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(249,115,22,0.18),inset_0_1px_0_rgba(249,115,22,0.25)]',
      ambientGlow: 'bg-[radial-gradient(120%_90%_at_50%_0%,rgba(249,115,22,0.15)_0%,transparent_60%)]',
      headerBorder: 'border-orange-500/20',
      benchmarkCardBorder: 'border-orange-500/20 bg-orange-500/[0.02]',
      buttonStyle: 'bg-orange-500/15 hover:bg-orange-500/25 text-orange-200 border-orange-500/35',
      footerBorder: 'border-orange-500/20',
      benchmarkNeedle: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]',
      benchmarkDot: 'bg-orange-400',
      cardBorder: 'border-white/[0.08] hover:border-orange-500/40 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55),0_0_20px_rgba(249,115,22,0.06),inset_0_1px_0_rgba(255,255,255,0.06)]',
      summaryEn: 'Your squad sits in the lower table risk zone. Focused tactics and disciplined squad management are vital to stay clear of the drop.',
      summaryDe: 'Dein Kader befindet sich in der unteren Tabellenregion. Fokussierte Taktik und Disziplin sind nötig, um nicht in die Abstiegszone zu rutschen.'
    };
  }

  // Red: Relegation risk (<= -6 vs league average)
  return {
    tier: 'relegation',
    color: 'red',
    hex: '#ef4444',
    ringGlow: 'rgba(239, 68, 68, 0.38)',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    glowLine: 'via-rose-400/80',
    boxBg: 'bg-rose-500/10',
    boxBorder: 'border-rose-500/20',
    valueText: 'text-rose-400',
    subText: 'text-rose-300',
    subTextMuted: 'text-rose-300/70',
    progressGradient: 'from-rose-500 to-red-600',
    analysisBorder: 'border-rose-500/20 bg-rose-500/[0.04]',
    statusLabelEn: 'RELEGATION RISK',
    statusLabelDe: 'AKUTE ABSTIEGSGEFAHR',
    statusIcon: 'fa-triangle-exclamation',
    modalBorder: 'border-rose-500/35',
    modalShadow: 'shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(239,68,68,0.18),inset_0_1px_0_rgba(239,68,68,0.25)]',
    ambientGlow: 'bg-[radial-gradient(120%_90%_at_50%_0%,rgba(239,68,68,0.15)_0%,transparent_60%)]',
    headerBorder: 'border-rose-500/20',
    benchmarkCardBorder: 'border-rose-500/20 bg-rose-500/[0.02]',
    buttonStyle: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border-rose-500/35',
    footerBorder: 'border-rose-500/20',
    benchmarkNeedle: 'bg-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    benchmarkDot: 'bg-rose-400',
    cardBorder: 'border-white/[0.08] hover:border-rose-500/40 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55),0_0_20px_rgba(239,68,68,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]',
    summaryEn: 'Your squad is significantly below the league benchmark. Maximum defensive resilience and grit are urgent to avoid relegation.',
    summaryDe: 'Dein Kader liegt deutlich unter dem Ligaschnitt. Leidenschaftlicher Kampf gegen den Abstieg ist dringend gefordert.'
  };
};

export const getOvrColor = (ovr: number, tierAvgOvr?: number): string => {
  if (tierAvgOvr !== undefined) {
    const cfg = getOvrTierConfig(ovr, tierAvgOvr);
    return `${cfg.valueText} font-bold`;
  }
  if (ovr >= 85) return 'text-emerald-400 font-bold';
  if (ovr >= 75) return 'text-zinc-100 font-bold';
  if (ovr >= 65) return 'text-orange-400 font-bold';
  return 'text-rose-400 font-bold';
};

export const getMonogramHex = (color?: string): string => {
  if (!color) return '#1c1c1e';
  return color.startsWith('#') ? color : '#' + color;
};

export const getInitials = (name?: string): string => {
  const cleanName = (name || 'HC').trim();
  const words = cleanName.split(/[\s./-]+/).filter(Boolean);
  const initials = words.length > 1 ? (words[0][0] + words[1][0]) : (cleanName ? cleanName.substring(0, 2) : 'HC');
  return initials.toUpperCase();
};

export const isReserveClub = (name?: string): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  return (
    trimmed.endsWith(' II') ||
    trimmed.endsWith(' 2') ||
    trimmed.endsWith(' B') ||
    trimmed.endsWith('(B)') ||
    trimmed.endsWith(' (B)') ||
    lower.includes('barça atlètic') ||
    lower.includes('barca atletic') ||
    lower.includes('youngsters') ||
    lower.includes('youngstars') ||
    lower.endsWith(' amateure') ||
    lower.endsWith(' u23') ||
    lower.endsWith(' u21')
  );
};



// Deterministic hash for procedural descriptions
const descHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

export const getClubHistoricContext = (
  clubName: string = '', 
  tier: number = 1, 
  _isDe: boolean = false, 
  country: string = 'GER',
  clubObj?: Partial<Club>
): string => {
  const isGermanText = (txt?: string) => {
    if (!txt) return false;
    return /(Erstligist|Zweitligist|Drittligist|Regionalligist|Traditionsverein|Nachwuchsmannschaft|fuer die Profis|kaempft|Aufstieg|Oberhaus|Jugendarbeit|Anhaengerschaft|ehrenamtlich|Stufe|Verein|Plaetze|Halle)/i.test(txt);
  };

  // 1. Direct object property check
  if (clubObj?.historicContext && clubObj.historicContext.trim() && !isGermanText(clubObj.historicContext)) {
    return clubObj.historicContext.trim();
  }
  if (clubObj?.context && clubObj.context.trim() && !isGermanText(clubObj.context)) {
    return clubObj.context.trim();
  }

  // 2. Lookup in handball_base_database.json by ID or Name
  const targetName = clubName.trim().toLowerCase();
  const handballList = (handballBaseDatabase as unknown as Club[]) || [];

  if (clubObj?.id) {
    const idMatch = handballList.find((c) => c && String(c.id) === String(clubObj.id));
    const cand = (idMatch?.historicContext || idMatch?.context) as string | undefined;
    if (cand && cand.trim() && !isGermanText(cand)) {
      return cand.trim();
    }
  }

  if (targetName) {
    // Exact name match
    const exactMatch = handballList.find((c) => c && c.name && c.name.trim().toLowerCase() === targetName);
    const cand1 = (exactMatch?.historicContext || exactMatch?.context) as string | undefined;
    if (cand1 && cand1.trim() && !isGermanText(cand1)) {
      return cand1.trim();
    }

    // Normalized match (handling diacritics and umlauts)
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const targetNorm = norm(targetName);
    const normMatch = handballList.find((c) => c && c.name && norm(c.name) === targetNorm);
    const cand2 = (normMatch?.historicContext || normMatch?.context) as string | undefined;
    if (cand2 && cand2.trim() && !isGermanText(cand2)) {
      return cand2.trim();
    }

    // Partial/prefix match if non-reserve or reserve matching
    const partialMatch = handballList.find((c) => {
      if (!c || !c.name) return false;
      const cnl = norm(c.name);
      return targetNorm === cnl || targetNorm.startsWith(cnl) || cnl.startsWith(targetNorm);
    });
    const cand3 = (partialMatch?.historicContext || partialMatch?.context) as string | undefined;
    if (cand3 && cand3.trim() && !isGermanText(cand3)) {
      return cand3.trim();
    }
  }

  if (isReserveClub(clubName)) {
    const league = getLeagueInfo(tier, country);
    return `Youth development squad for the main club, focusing on nurturing academy prospects and gaining experience in ${league.name}.`;
  }

  if (tier === 1) {
    return `Top-flight club competing at the highest level of national handball, striving for domestic titles and European qualification.`;
  } else if (tier === 2) {
    return `Ambitious second division side, focused on establishing themselves and pushing for promotion to the top tier.`;
  } else if (tier === 3) {
    return `Professional third-tier club. Known for developing youth and serving as a stepping stone for rising talent.`;
  } else if (tier === 4) {
    return `Ambitious regional club. Balancing a semi-professional setup with passionate local support.`;
  } else if (tier === 5) {
    return `Proud local club. A strong community presence where passion for the sport takes priority.`;
  } else {
    return `Local traditional club. Driven by volunteer dedication and honest, hard work at the grassroots level.`;
  }
};

export const MAX_ARENA_CAPACITY = 30000;

export interface CatchmentCeilingInfo {
  maxCeiling: number;
  cityName: string;
  populationEstimate: number;
  cityCoreFans: number;
  regionalPerimeterFans: number;
  megaStatusFans: number;
  isMegaClub: boolean;
  saturation: number;
  cityCategory?: 'metro' | 'stronghold' | 'mid' | 'town';
}

import { extractClubCity } from './demographicsData';
import { getClubStartingAttendance, getCalibratedStartingFanbase, getRealLifeStartingAttendance } from './realLifeAttendance';
export { extractClubCity, getClubStartingAttendance, getCalibratedStartingFanbase, getRealLifeStartingAttendance };

export const getClubCatchmentCeiling = (club: Partial<Club>, state?: any): CatchmentCeilingInfo => {
  const normCountry = normalizeCountry(club.country || 'GER');
  const cityInfo = extractClubCity(club.name || '', normCountry, club.historicContext || club.context);
  const tier = club.tier || 1;
  const rep = club.rep || 70;
  const baseOvr = club.baseOvr || 70;

  // Macro country scaling (Germany, France, Spain have the largest European handball ecosystems)
  const countryPopMult = normCountry === 'GER' || normCountry === 'FRA' || normCountry === 'ESP'
    ? 1.0
    : normCountry === 'DEN' || normCountry === 'POL' || normCountry === 'HUN' || normCountry === 'SWE'
    ? 0.85
    : normCountry === 'NOR' || normCountry === 'CRO'
    ? 0.70
    : normCountry === 'POR' || normCountry === 'SUI' || normCountry === 'AUT'
    ? 0.55
    : normCountry === 'ISL'
    ? 0.25 // Iceland total national population is only ~380k
    : 0.40;

  // Base city core ceiling (immediate urban core supporter potential)
  let baseCore = 42000;
  let basePerimeter = 30000;
  if (cityInfo.category === 'metro') {
    baseCore = 125000;
    basePerimeter = 65000;
  } else if (cityInfo.category === 'stronghold') {
    baseCore = 80000;
    basePerimeter = 50000;
  } else if (cityInfo.category === 'mid') {
    baseCore = 42000;
    basePerimeter = 30000;
  } else if (cityInfo.category === 'town') {
    baseCore = 22000;
    basePerimeter = 18000;
  }

  // Regional perimeter reach is unlocked by league tier
  const perimeterTierFactor = tier === 1 ? 1.0 : tier === 2 ? 0.60 : tier === 3 ? 0.35 : 0.15;
  const regionalPerimeterFans = Math.round(basePerimeter * perimeterTierFactor * countryPopMult);
  const cityCoreFans = Math.round(baseCore * countryPopMult);

  // Mega Club Status Check
  // Unlocked through European silverware (CL/EL), domestic championships, historic giant status, or dynasty champion stature
  const history = (state?.history || []).filter((h: any) => !h.clubName || !club.name || h.clubName === club.name);
  const wonContinentalSilverware = history.some((h: any) => h.trophiesThisYear?.cl || h.trophiesThisYear?.el || h.trophiesThisYear?.cwc);
  const wonTopFlightTitle = history.some((h: any) => h.pos === 1 && (h.tier === 1 || h.playedTier === 1));
  const isHistoricGiant = ['Magdeburg', 'Kiel', 'Flensburg', 'Füchse Berlin', 'Barcelona', 'Veszprém', 'Veszprem', 'Kielce', 'Montpellier', 'Nantes', 'Aalborg', 'Pick Szeged'].some(n => (club.name || '').includes(n));
  const topFlightTitleCount = history.filter((h: any) => h.pos === 1 && (h.tier === 1 || h.playedTier === 1)).length;

  // Normalize uncalibrated raw database fanbases against getCalibratedStartingFanbase in Tier 4 developing markets
  // (e.g. in Iceland) so they don't falsely trigger 60,000+ mega-club status on Day 1 from legacy raw numbers
  const econProfile = getCountryEconomicProfile(normCountry);
  const dbMatch =
    getActiveClubs(normCountry).find(c => (club.id !== undefined && c.id === club.id) || (c.name && club.name && c.name.trim().toLowerCase() === club.name.trim().toLowerCase())) ||
    ALL_CLUBS.find(c => (club.id !== undefined && c.id === club.id) || (c.name && club.name && c.name.trim().toLowerCase() === club.name.trim().toLowerCase()));
  const calibratedBaseFans = getCalibratedStartingFanbase(club);
  const rawClubFans = club.fanBase || calibratedBaseFans;
  const effectiveClubFans = (econProfile.tier === 4 && dbMatch && dbMatch.fanBase && dbMatch.fanBase > calibratedBaseFans * 2.5 && rawClubFans >= dbMatch.fanBase * 0.6)
    ? calibratedBaseFans + Math.max(0, rawClubFans - dbMatch.fanBase)
    : rawClubFans;

  const isDynastyChampion = wonTopFlightTitle && (topFlightTitleCount >= 1 || effectiveClubFans >= 60000 || wonContinentalSilverware);
  const hasMegaFanbase = effectiveClubFans >= 60000;
  
  const isMegaClub = Boolean(
    isHistoricGiant ||
    hasMegaFanbase ||
    isDynastyChampion ||
    (tier === 1 && (wonTopFlightTitle || wonContinentalSilverware)) ||
    (tier === 1 && (rep >= 75 || baseOvr >= 78) && (wonContinentalSilverware || wonTopFlightTitle))
  );

  let megaStatusFans = 0;
  if (isMegaClub) {
    const baseMega = cityInfo.category === 'metro' 
      ? 150000 
      : cityInfo.category === 'stronghold' 
      ? 120000 
      : cityInfo.category === 'mid' 
      ? 80000 
      : 50000;
    megaStatusFans = Math.round(baseMega * countryPopMult);
  }

  // NEW: Global Brand Reach (Fans outside the geographic catchment from Marketing Gacha)
  const globalBrandFans = club.globalFans || 0;

  // Add globalBrandFans to the final ceiling calculation
  const maxCeiling = cityCoreFans + regionalPerimeterFans + megaStatusFans + globalBrandFans;
  const currentFans = effectiveClubFans;
  const saturation = Math.min(100, Math.round((currentFans / Math.max(1, maxCeiling)) * 100));

  return {
    maxCeiling,
    cityName: cityInfo.cityName,
    populationEstimate: cityInfo.population,
    cityCoreFans,
    regionalPerimeterFans,
    megaStatusFans,
    isMegaClub,
    saturation,
    cityCategory: cityInfo.category
  };
};

export const getLeagueMaxAttendance = (
  tier: number, 
  isReserve: boolean, 
  country: string = 'GER', 
  _clubName: string = '', 
  stadium: number = 0,
  _fanBase?: number,
  _isMega: boolean = false
): number => {
  if (isReserve) return 300;
  
  const normCountry = normalizeCountry(country);
  const pinnacleCap = getPinnacleArenaCapacity(normCountry);

  // In Tier 1, the pinnacle attendance ceiling is governed by the Country Tier System:
  // e.g. Tier 1 Mega Markets: Germany up to 30,000, France up to 20,000.
  // Tier 2: Hungary, Poland, Denmark, North Macedonia up to 15,000.
  // Tier 3: Spain, Portugal, Sweden, Norway up to 8,000.
  // Tier 4: Romania, Switzerland, Croatia, Austria, Iceland up to 6,000.
  // When a club expands to an elite arena (e.g. 30k in Germany) and builds a huge fanbase,
  // attendance can realistically fill their venue!
  if (tier === 1) {
    if (stadium > 0) {
      return Math.min(stadium, pinnacleCap);
    }
    return pinnacleCap;
  }

  // Realistic lower division attendance ceilings (amateur & lower tier leagues):
  let leagueCap = 3500;
  if (normCountry === 'GER') {
    if (tier === 2) leagueCap = 10000; // 2. Bundesliga derbies / major arenas (Hamburg, Gummersbach)
    else if (tier === 3) leagueCap = 4500; // 3. Liga
    else if (tier === 4) leagueCap = 2000; // Regionalliga
    else if (tier === 5) leagueCap = 1000; // Oberliga
    else leagueCap = 400;
  } else if (normCountry === 'FRA') {
    if (tier === 2) leagueCap = 5000;
    else leagueCap = 1500;
  } else if (normCountry === 'HUN' || normCountry === 'POL' || normCountry === 'DEN' || normCountry === 'MKD') {
    if (tier === 2) leagueCap = 3500;
    else leagueCap = 1200;
  } else if (normCountry === 'ESP' || normCountry === 'POR' || normCountry === 'SWE' || normCountry === 'NOR') {
    if (tier === 2) leagueCap = 2500;
    else leagueCap = 800;
  } else if (normCountry === 'ROU' || normCountry === 'SUI' || normCountry === 'AUT' || normCountry === 'CRO' || normCountry === 'ISL') {
    if (tier === 2) leagueCap = 2000;
    else leagueCap = 600;
  } else {
    leagueCap = tier === 2 ? 2000 : 600;
  }

  // If a club has invested in a larger venue and built a strong fanbase, allow them to draw above the generic lower-league baseline
  const fanPotential = _fanBase ? Math.round(_fanBase * 0.22) : 0;
  const effectiveLeagueCap = Math.max(leagueCap, Math.min(stadium || leagueCap, fanPotential));

  if (stadium > 0) {
    return Math.min(stadium, effectiveLeagueCap);
  }
  return effectiveLeagueCap;
};

/**
 * Ensures attendance figures look authentic, realistic, and organic.
 * Rule: Unless an arena is genuinely sold out (att >= capacity), attendance figures
 * should NEVER be artificially round numbers ending in 00 or 50 (like 800, 900, 1000, 7500).
 */
export const formatOrganicAttendance = (att: number, capacity: number, seed: number = 0): number => {
  if (!att || att <= 0) return 0;
  const cap = Math.max(1, Math.round(capacity || 0));
  let val = Math.round(att);

  // If sold out: Attendance matches capacity exactly (e.g. 800 / 800, 30,000 / 30,000)
  if (cap > 0 && val >= cap) {
    return cap;
  }

  // If not sold out:
  // Check if val ends in 0 (e.g. 800, 900, 7500, 24320)
  if (val % 10 === 0) {
    const pseudo = Math.abs(Math.sin((val + seed * 31) * 12.9898 + 78.233)) % 1;
    // Generate an offset between -19 and +19 that is non-zero and doesn't end in 0
    let offset = Math.floor(pseudo * 37) - 18;
    if (offset === 0 || offset % 10 === 0) {
      offset = pseudo > 0.5 ? 7 : -7;
    }
    // Prevent small attendances from going below 10
    if (val + offset < 10) {
      val = Math.min(cap - 1, 10 + Math.floor(pseudo * 8) + 1);
    } else {
      val += offset;
    }
    // Double check last digit is not 0
    if (val % 10 === 0) {
      val += 3;
    }
  }

  // Ensure val strictly respects not sold out constraint (val < cap)
  if (cap > 0 && val >= cap) {
    const pseudo = Math.abs(Math.sin((val + seed) * 9.17)) % 1;
    val = cap - (Math.floor(pseudo * 13) + 3);
  }

  return Math.min(cap, Math.max(cap > 0 ? 1 : 0, val));
};

export const calculateInitialFanBase = (stadium: number = 2000, tier: number, isReserve: boolean, country: string = 'GER', clubName: string = ''): number => {
  if (isReserve) return Math.min(500, Math.max(100, Math.floor(stadium * 0.15)));
  
  const normCountry = normalizeCountry(country);
  const isGiants = ['Kiel', 'Flensburg', 'Magdeburg', 'Barcelona', 'PSG', 'Veszprem', 'Kielce'].some(n => clubName.includes(n));
  if (isGiants) {
    return Math.min(stadium, 12000);
  }

  const league = getLeagueInfo(tier, normCountry);
  const maxAtt = getLeagueMaxAttendance(tier, false, normCountry, clubName, stadium);
  let proportion = tier === 1 ? 0.75 : tier === 2 ? 0.60 : tier === 3 ? 0.45 : tier === 4 ? 0.30 : 0.20;
  
  const baseFan = Math.floor(stadium * proportion);
  return Math.max(Math.floor(league.attBase * 0.7), Math.min(maxAtt, baseFan));
};

export const getLeagueStadiumRequirement = (tier: number, country: string = 'GER'): number => {
  if (country === 'GER' || country === 'FRA' || country === 'ESP') {
    if (tier === 1) return 4500;
    if (tier === 2) return 2500;
    if (tier === 3) return 1000;
    if (tier === 4) return 500;
    return 200;
  }
  if (tier === 1) return 3000;
  if (tier === 2) return 1500;
  if (tier === 3) return 800;
  return 300;
};

export const getLeagueScaledFans = (tier: number, baseLeague1Fans: number, country: string = 'GER', originalStartTier: number = 1): number => {
  let mult = tier === 1 ? 1.0 : tier === 2 ? 0.35 : tier === 3 ? 0.12 : tier === 4 ? 0.04 : tier === 5 ? 0.015 : tier === 6 ? 0.005 : 0.002;
  
  if (country === 'GER' && originalStartTier >= 6) {
    if (tier === 4) mult = 0.01;
    if (tier === 5) mult = 0.005;
  }
  const cMult = getCountryMult(country);
  const scaled = Math.round(baseLeague1Fans * mult * cMult);
  if (scaled >= 1000) return Math.round(scaled / 100) * 100;
  if (scaled >= 100) return Math.round(scaled / 50) * 50;
  return Math.max(10, Math.round(scaled / 10) * 10);
};

let currentGlobalYear = 2024;
export const setGlobalYear = (y: number) => { currentGlobalYear = y; };

export const getLeagueScaledVal = (tier: number, baseLeague1K: number, country: string = 'GER'): number => {
  // Proportional decay from Tier 1 to Tier 6
  const mults = [0, 1.0, 0.32, 0.10, 0.035, 0.012, 0.004];
  const mult = mults[tier] || 0.004;
  let scaled = baseLeague1K * mult;

  // Scale by national economic cost index
  const countryMult = getCountryMult(country);
  scaled *= countryMult;

  // Clean rounding logic without artificially inflating small amounts
  if (scaled >= 100000) return Math.round(scaled / 10000) * 10000;
  if (scaled >= 10000) return Math.round(scaled / 1000) * 1000;
  if (scaled >= 1000) return Math.round(scaled / 250) * 250;
  if (scaled >= 100) return Math.round(scaled / 50) * 50;
  return Math.max(50, Math.round(scaled));
};

/**
 * Steeply Exponential Facility Costs:
 * Upgrading Academy and Medical facilities to Level 4 and Level 5 is prohibitively expensive
 * to prevent snowballing and ensure long-term structural progression.
 * Tier 1 Base:
 * Level 1 -> 2: €500k (Academy) / €400k (Medical)
 * Level 2 -> 3: €1.5M (Academy) / €1.2M (Medical)
 * Level 3 -> 4: €5.0M (Academy) / €4.5M (Medical)
 * Level 4 -> 5: €12.5M (Academy) / €12.0M (Medical)
 * Values scaled by league tier and country multiplier.
 */
export const getAcademyUpgradeCost = (currentLevel: number = 1, tier: number = 1, country: string = 'GER', isScoutDirector: boolean = false): number => {
  const baseCosts: Record<number, number> = {
    1: 500000,
    2: 1500000,
    3: 5000000,
    4: 12500000,
  };
  const base = baseCosts[currentLevel] || (currentLevel >= 4 ? 12500000 : 500000);
  const rawCost = Math.round(getLeagueScaledVal(tier, base, country));
  return isScoutDirector ? Math.round(rawCost * 0.65) : rawCost;
};

export const getMedicalUpgradeCost = (currentLevel: number = 1, tier: number = 1, country: string = 'GER'): number => {
  const baseCosts: Record<number, number> = {
    1: 400000,
    2: 1200000,
    3: 4500000,
    4: 12000000,
  };
  const base = baseCosts[currentLevel] || (currentLevel >= 4 ? 12000000 : 400000);
  return Math.round(getLeagueScaledVal(tier, base, country));
};

export const calculateClubFinancials = (state: {
  club: { id?: string | number; name: string; tier: number; baseOvr: number; stadium?: number; fanBase?: number; country?: string; squadSize?: number; academyLevel?: number; medicalLevel?: number; globalFans?: number; isPublic?: boolean; ipoPrice?: number; stockPrice?: number; };
  budget: number;
  euroStatus?: 'CL' | 'EL' | 'ECL' | null;
  sponsorIncome?: number;
  managerSkills?: string[];
  keyTransfersThisSeason?: number;
  galacticosThisSeason?: number;
  failedSponsorTargetNextSeason?: boolean;
  seasonCount?: number;
  year?: number;
  activeLoan?: any;
  history?: any[];
}) => {
  const country = normalizeCountry(state.club.country || 'GER');
  const dbClub =
    getActiveClubs(country).find(c => c.name === state.club?.name || String(c.id) === String(state.club?.id)) ||
    ALL_CLUBS.find(c => c.name === state.club?.name || String(c.id) === String(state.club?.id));
  const tier = state.club?.tier || dbClub?.tier || 5;
  const league = getLeagueInfo(tier, country);
  const isReserve = isReserveClub(state.club.name);
  const cMult = getCountryMult(country);
  const leagueAvgOvr = league.avgOvr || (tier === 1 ? 80 : tier === 2 ? 69 : tier === 3 ? 62 : tier === 4 ? 54 : 45);
  
  // Track current-season signings so mid-season acquisitions increase payroll without artificially inflating current-season automated sponsor/ticket contracts
  const regTransfers = (state as any).regTransfersThisSeason || 0;
  const keyTransfers = state.keyTransfersThisSeason || 0;
  const galacticoTransfers = state.galacticosThisSeason || 0;
  const loanTransfers = (state as any).loansThisSeason || 0;
  const youthPulls = ((state as any).youthPullsSeasonYear === state.year || (state as any).youthPullsSeasonYear === undefined)
    ? ((state as any).youthPullsThisSeason || 0)
    : 0;
  const ringerSigned = Boolean((state as any).veteranRingerSignedThisSeason);
  const squadSales = (state as any).squadSalesThisSeason || 0;
  const totalSigningsThisSeason = regTransfers + keyTransfers + galacticoTransfers + loanTransfers + youthPulls + (ringerSigned ? 1 : 0);

  let preSigningOvr = state.club.baseOvr || 70;
  if (typeof (state as any).startOfSeasonOvr === 'number') {
    preSigningOvr = (state as any).startOfSeasonOvr;
  } else if (typeof (state as any).lastOvr === 'number') {
    preSigningOvr = (state as any).lastOvr;
  } else if ((totalSigningsThisSeason > 0 || squadSales > 0) && dbClub?.baseOvr !== undefined) {
    preSigningOvr = dbClub.baseOvr;
  }

  const hasExplicitSigningDelta =
    typeof (state as any).signingOvrGainThisSeason === 'number' ||
    typeof (state as any).signingFlopLossThisSeason === 'number' ||
    typeof (state as any).eventOvrGainThisSeason === 'number';
  const signingOvrGain = Math.max(0, (state as any).signingOvrGainThisSeason || 0);
  const signingFlopLoss = Math.max(0, (state as any).signingFlopLossThisSeason || 0);
  const eventOvrGain = Math.max(0, (state as any).eventOvrGainThisSeason || 0);

  // Current-season automated sponsorships and baseline crowd expectations are anchored to pre-signing OVR
  // (so neither mid-season signings nor mid-season player sales abruptly alter locked-in season sponsorship deals);
  // meanwhile squad payroll reflects actual current OVR (plus any flop losses so flops never cut existing contracts, and minus non-signing event gains).
  const baseSigningRemovedOvr = Math.max(30, (state.club.baseOvr || 70) - signingOvrGain - eventOvrGain);
  const commercialOvr = (totalSigningsThisSeason > 0 || squadSales > 0 || hasExplicitSigningDelta)
    ? Math.max(preSigningOvr, baseSigningRemovedOvr)
    : (state.club.baseOvr || 70);
  const wageOvr = Math.min(100, Math.max(30, (state.club.baseOvr || 70) - eventOvrGain) + signingFlopLoss);

  // 1. Matchday Income Calculation (Realistic Handball Attendance & Net Ticket Yield)
  const stadBase = league.stadBase || 1000;
  const currStad = state.club.stadium || stadBase;
  const catchment = getClubCatchmentCeiling(state.club, state);
  const maxAtt = getLeagueMaxAttendance(tier, isReserve, country, state.club.name, currStad, state.club.fanBase, catchment.isMegaClub);
  
  const clubNameSeed = String(state.club.name || 'Club')
    .split('')
    .reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 1), 0);
  const sCount = state.year || 2024;
  // Seed seasonal variance strictly by season year and club identity (never baseOvr) so mid-season OVR changes never cause random attendance swings
  const pseudoRandom = Math.abs(Math.sin(sCount * 12.9898 + clubNameSeed * 0.137)) % 1;
  const seasonalVariance = 0.94 + (pseudoRandom * 0.12);
  const nonRoundOffset = (Math.floor(pseudoRandom * 47) - 23);
  
  const profile = getCountryEconomicProfile(country);
  const commercialClub = { ...state.club, baseOvr: commercialOvr };
  const baseFan = getCalibratedStartingFanbase(commercialClub);
  const rawDbFan = dbClub?.fanBase || baseFan;
  const rawStateFans = state.club.fanBase || baseFan;
  // Normalize uncalibrated raw database fanbases in Tier 4 compact markets (e.g. 65k-130k in Iceland)
  // so they do not inflate Day 1 attendance to 3.5x or create €78k admin-cost drops when clamped
  const normalizedStateFans = (profile.tier === 4 && rawDbFan > baseFan * 2.5 && rawStateFans >= rawDbFan * 0.6)
    ? baseFan + Math.max(0, rawStateFans - rawDbFan)
    : rawStateFans;
  const clubInitialFans = (profile.tier === 4 && rawDbFan > baseFan * 2.5)
    ? baseFan
    : Math.max(baseFan, rawDbFan);
  const signingHypeFansThisSeason = galacticoTransfers > 0 ? galacticoTransfers * 5000 : 0;
  const currentFans = Math.max(200, normalizedStateFans - signingHypeFansThisSeason);
  const globalFans = Math.max(0, (state.club.globalFans || 0) - signingHypeFansThisSeason);

  let expectedAtt = 0;
  if (isReserve) {
      expectedAtt = formatOrganicAttendance(Math.min(300, maxAtt), currStad, sCount);
  } else {
      // 1. Establish authentic baseline starting attendance (real-life documented where available, else tier-calibrated)
      const startAtt = getClubStartingAttendance(commercialClub);

      // 2. Supporter base expansion / contraction relative to calibrated baseline
      // Global/viral campaigns expand global addressable fanbase and convert ~35% into local turnstile demand,
      // while regional fan growth and on-court momentum convert 100% into matchday turnstile demand.
      const nonLocalGlobalFans = Math.round(globalFans * 0.65);
      const physicalMatchgoers = Math.max(baseFan, currentFans - nonLocalGlobalFans);
      const fanGrowthRatio = physicalMatchgoers / Math.max(1, baseFan);
      const fanGrowthMult = Math.max(0.65, Math.min(3.5, fanGrowthRatio));

      // 3. Matchday engagement governed by fan strategy
      const fanStrat = (state.club as any)?.fanStrategy;
      const stratMult = fanStrat === 'ultras' ? 1.15 : fanStrat === 'community' ? 1.08 : fanStrat === 'corporate' ? 0.88 : 1.0;

      // 4. On-court performance factor modulates crowd excitement
      const ovrDelta = commercialOvr - leagueAvgOvr;
      const perfMod = Math.max(-0.22, Math.min(0.28, ovrDelta * 0.022));

      // 5. Dynamic evolving crowd demand starting from authentic baseline
      let crowd = Math.round(startAtt * fanGrowthMult * (1 + perfMod) * stratMult * seasonalVariance);
      if (catchment.isMegaClub) {
        crowd = Math.round(crowd * 1.15);
      }
      crowd += nonRoundOffset;

      const minFloor = Math.min(currStad, tier >= 4 ? 40 : 120);
      const rawExpected = Math.max(minFloor, Math.min(currStad, crowd, maxAtt));
      expectedAtt = formatOrganicAttendance(rawExpected, currStad, sCount + (clubNameSeed % 89));
  }

  const hasUltraliebling = (state.managerSkills || []).includes('ultraliebling');
  const hasSalesmaster = (state.managerSkills || []).includes('salesmaster') || (state.managerSkills || []).includes('sponsor_boost');
  let matchdayMult = hasUltraliebling ? 1.12 : 1.0;
  if (hasSalesmaster) matchdayMult *= 1.08;
  
  const fanStrat = (state.club as any)?.fanStrategy;
  if (fanStrat === 'corporate') {
    matchdayMult *= 1.20;
  } else if (fanStrat === 'ultras') {
    matchdayMult *= 0.94;
  }
  
  // Authentic Net Ticket Yield by Country & League Tier (in € per fan per match)
  const baseNetYield = profile.baseTicketYield[tier] || 3;
  const netTicketYield = Math.max(2, Math.round(baseNetYield * matchdayMult));
  const matchdayIncomeK = Math.floor(expectedAtt * netTicketYield * 17);

  // 2. Prize & TV Money
  // Domestic broadcast rights pools (e.g. Dyn Media in Germany ~€450K/club) and baseline league merit distributions
  const basePosPrizeK = tier === 1 ? 60 : tier === 2 ? 20 : tier === 3 ? 8 : tier === 4 ? 3 : 1;
  const posPrizeK = Math.floor(basePosPrizeK * cMult * 1000);
  const tvPrize = league.tvPrize || 0;
  const regionalGrant = isReserve ? Math.floor(tvPrize * 0.4) : 0;
  const euroRev = isReserve ? 0 : state.euroStatus === 'CL' ? 2500000 : state.euroStatus === 'EL' ? 800000 : state.euroStatus === 'ECL' ? 300000 : 0;
  
  // 3. Sponsorships (Country Tier & Sugar Daddy Benefactor Logic)
  // In European handball, commercial sponsorships represent 50%-65% of club operating revenues
  const autoSponsorRate = tier === 1 ? 0.72 : tier === 2 ? 0.58 : tier === 3 ? 0.65 : tier === 4 ? 0.68 : tier === 5 ? 0.65 : 0.55;
  const isEuropeanContender = state.euroStatus === 'CL' || state.euroStatus === 'EL' || commercialOvr >= 80;
  
  // In Tier 2 benefactor markets (Hungary, Poland, North Macedonia), reaching the Champions League unlocks heavy state/industrial benefactor sponsorship
  // Note: league.wages is already scaled to the local country economy; only apply country sponsorScale when overriding sponsorWageBase to the German HBL 1 baseline.
  let effectiveSponsorScale = 1.0;
  let sponsorWageBase = league.wages || 500000;
  if (profile.tier === 2 && state.euroStatus === 'CL') {
    // Drop the domestic TV base, but boost Commercial Sponsorship to 70% - 110% of the German baseline
    sponsorWageBase = COUNTRY_LEAGUES.GER[1].wages;
    effectiveSponsorScale = profile.sugarDaddyBoost;
  } else if (profile.tier === 2 && isEuropeanContender) {
    effectiveSponsorScale = 1.18;
  }

  // Champions League & European Stage: Elite continental exposure unlocks premier multinational partnerships
  const euroSponsorBoost = state.euroStatus === 'CL' ? 1.35 : state.euroStatus === 'EL' ? 1.15 : state.euroStatus === 'ECL' ? 1.06 : 1.0;
  // Corporate arena naming rights & hospitality suites for 10,000+ mega venues
  const arenaCorporateBoost = currStad >= 10000 ? Math.min(1.20, 1.0 + ((currStad - 10000) / 35000)) : 1.0;

  // In lower tiers (Tier >= 3), an ambitious squad chasing promotion mobilizes local business and communal patron sponsorships
  const ambitionSponsorBonus = (tier >= 3 && commercialOvr > leagueAvgOvr)
    ? 1.0 + Math.min(0.45, ((commercialOvr - leagueAvgOvr) / leagueAvgOvr) * 1.2)
    : 1.0;

  // Past-Season Sporting Trajectory (strictly from completed past seasons in state.history — never mid-season variables)
  const clubHistoryForSponsor = (state.history || []).filter(
    (h: any) => !h.clubName || !state.club.name || h.clubName === state.club.name
  );
  const lastCompletedSeason = clubHistoryForSponsor.length > 0 ? clubHistoryForSponsor[clubHistoryForSponsor.length - 1] : null;
  let trajectorySponsorMod = 1.0;
  if (lastCompletedSeason) {
    const trObj = lastCompletedSeason.trophiesThisYear || lastCompletedSeason;
    const wonMajorSilverware = Boolean(
      trObj.cl || trObj.el || trObj.ecl ||
      trObj.dfb || trObj.sc || trObj.esc || trObj.cwc
    );
    if (lastCompletedSeason.pos === 1) {
      trajectorySponsorMod *= 1.06;
    } else if (lastCompletedSeason.pos > 1 && lastCompletedSeason.pos <= 3) {
      trajectorySponsorMod *= 1.03;
    } else if (lastCompletedSeason.relegated) {
      trajectorySponsorMod *= 0.93;
    }
    if (wonMajorSilverware) {
      trajectorySponsorMod *= 1.04;
    } else if (lastCompletedSeason.promoted) {
      trajectorySponsorMod *= 1.04;
    }
    trajectorySponsorMod = Math.max(0.90, Math.min(1.12, trajectorySponsorMod));
  }

  // Commercial Strategy & Board Leadership Modifiers
  let strategySponsorMod = 1.0;
  if (fanStrat === 'corporate') {
    strategySponsorMod *= 1.06;
  }
  const dirArch = (state as any).directorArchetype;
  if (dirArch === 'Financial Mogul' || dirArch === 'Brand Ambassador') {
    strategySponsorMod *= 1.05;
  }

  // Multi-Season Commercial Renewal Cycle (deterministic by sCount and clubNameSeed; 1.0 on Day 1 baseline)
  const marketSponsorCycle = sCount === 0
    ? 1.0
    : 0.97 + (((sCount * 37 + clubNameSeed * 13) % 71) / 1000);
  const organicSponsorOffset = (isReserve || sCount === 0)
    ? 0
    : ((clubNameSeed * 19 + sCount * 43) % 19 - 9) * (tier <= 2 ? 180 : tier === 3 ? 40 : 10);

  // Supporter brand reach & merchandising monetization: growing fanbase via marketing/PR or performance boosts commercial appeal
  const brandGrowthFans = Math.max(0, globalFans, currentFans - clubInitialFans);
  const fanCommercialRoyalty = isReserve
    ? 0
    : Math.min(Math.floor(sponsorWageBase * 0.35), Math.floor(brandGrowthFans * 2.5 * cMult));

  const baseAutoSponsor = isReserve
    ? 0
    : Math.max(
        0,
        Math.floor(
          sponsorWageBase *
            autoSponsorRate *
            Math.pow(commercialOvr / leagueAvgOvr, 1.4) *
            effectiveSponsorScale *
            euroSponsorBoost *
            arenaCorporateBoost *
            ambitionSponsorBonus *
            trajectorySponsorMod *
            strategySponsorMod *
            marketSponsorCycle
        ) +
          fanCommercialRoyalty +
          organicSponsorOffset
      );
  
  // Volatility rule: If a Tier 2 benefactor team loses primary backing, revenue drops by 60% instantly
  const sponsorPenaltyMult = state.failedSponsorTargetNextSeason 
    ? (profile.tier === 2 ? 0.40 : 0.60) 
    : 1.0;
  const isPlaymakerFocus = (state as any).tactic === 'Playmaker Focus' || (state as any).tactic === 'Total Handball';
  const sponsorInc = Math.floor(baseAutoSponsor * (hasSalesmaster ? 1.20 : 1.0) * (isPlaymakerFocus ? 1.15 : 1.0) * sponsorPenaltyMult);
  const extraSponsorInc = state.sponsorIncome || 0;

  // Build transparent commercial sponsorship breakdown tags for the Financial Ledger
  const sponsorDrivers: { labelEn: string; labelDe: string; pct: string; positive: boolean }[] = [];
  if (euroSponsorBoost > 1.0) {
    sponsorDrivers.push({
      labelEn: `${state.euroStatus} Broadcast Exposure`,
      labelDe: `${state.euroStatus} TV-Präsenz`,
      pct: `+${Math.round((euroSponsorBoost - 1) * 100)}%`,
      positive: true,
    });
  }
  if (arenaCorporateBoost > 1.01) {
    sponsorDrivers.push({
      labelEn: 'Arena Naming & VIP Suites',
      labelDe: 'Arena-Naming & VIP-Logen',
      pct: `+${Math.round((arenaCorporateBoost - 1) * 100)}%`,
      positive: true,
    });
  }
  if (Math.abs(trajectorySponsorMod - 1.0) >= 0.02) {
    const tPct = Math.round((trajectorySponsorMod - 1) * 100);
    sponsorDrivers.push({
      labelEn: tPct > 0 ? 'Sporting Momentum' : 'Relegation Setback',
      labelDe: tPct > 0 ? 'Sportlicher Erfolg' : 'Abstiegs-Dämpfer',
      pct: `${tPct > 0 ? '+' : ''}${tPct}%`,
      positive: tPct >= 0,
    });
  }
  if (strategySponsorMod > 1.0) {
    sponsorDrivers.push({
      labelEn: 'Commercial Strategy & Board',
      labelDe: 'VIP-Strategie & Vorstand',
      pct: `+${Math.round((strategySponsorMod - 1) * 100)}%`,
      positive: true,
    });
  }
  if (hasSalesmaster) {
    sponsorDrivers.push({
      labelEn: 'Commercial Negotiator',
      labelDe: 'Chef-Unterhändler',
      pct: '+20%',
      positive: true,
    });
  }
  if (isPlaymakerFocus) {
    sponsorDrivers.push({
      labelEn: 'Attractive Playstyle',
      labelDe: 'Attraktiver Spielstil',
      pct: '+15%',
      positive: true,
    });
  }
  if (fanCommercialRoyalty > 0) {
    sponsorDrivers.push({
      labelEn: `Fan Brand Royalty (+${formatMoney(fanCommercialRoyalty)})`,
      labelDe: `Fan-Markenerlös (+${formatMoney(fanCommercialRoyalty)})`,
      pct: 'Brand',
      positive: true,
    });
  } 
  
  // Austerity Rebuild / Treasury Prudence Yield:
  // Maintaining €10M+ in cash treasury yields a 2% annual treasury management dividend (+€200k+), capped at €2.5M
  const currentBudget = typeof state.budget === 'number' ? state.budget : 0;
  const preTransferTreasury =
    currentBudget +
    Math.max(0, (state as any).transferSpend || 0) +
    Math.max(0, (state as any).facilitySpend || 0) +
    Math.max(0, (state as any).youthSpend || 0) +
    Math.max(0, (state as any).marketingSpend || 0) +
    Math.max(0, (state as any).contractRenewalSpend || 0);
  const treasuryReserveYield = preTransferTreasury >= 10000000 ? Math.min(2500000, Math.floor(preTransferTreasury * 0.02)) : 0;

  const estRevenue = matchdayIncomeK + tvPrize + posPrizeK + sponsorInc + regionalGrant + euroRev + extraSponsorInc + treasuryReserveYield;

  // 4. Operating Expenses Calculation (Real-world Handball Cost Structures)
  const squadSize = state.club.squadSize || 18;
  const squadModifier = squadSize / 18;
  const baseLeagueWage = league.wages || 500000;
  const ovrRatio = Math.max(0.65, Math.min(1.65, wageOvr / leagueAvgOvr));
  const ovrExponent = tier <= 2 ? (tier === 1 ? 2.2 : 1.8) : 1.15;
  let pureWages = Math.floor(baseLeagueWage * Math.pow(ovrRatio, ovrExponent));
  if (isReserve) pureWages = Math.floor(pureWages * 0.40);

  // Semi-pro / Grassroots Solvency Rule (Applied to baseline 18-man squad BEFORE roster expansions/sales and transfer surcharges):
  // In amateur and semi-professional divisions (Tier >= 3), clubs operate under non-profit federation charters.
  // Baseline 18-man squad stipends cannot outstrip sustainable club turnover into catastrophic deficits.
  if (tier >= 3) {
    const maxSemiProWages = Math.round(estRevenue * 0.65);
    pureWages = Math.min(pureWages, maxSemiProWages);
  }

  // Scale payroll by actual squad size (signing players increases wage bill; selling/releasing players reduces wage bill)
  pureWages = Math.floor(pureWages * squadModifier);

  if (regTransfers > 0) {
      pureWages += Math.floor(pureWages * 0.03 * regTransfers);
  }
  if (keyTransfers > 0) {
      pureWages += Math.floor(pureWages * 0.04 * keyTransfers);
  }
  if (galacticoTransfers > 0) {
      pureWages += Math.floor(pureWages * 0.12 * galacticoTransfers);
  }
  if (loanTransfers > 0) {
      pureWages += Math.floor(pureWages * 0.02 * loanTransfers);
  }
  // High-Risk Veteran Ringer: Exorbitant 1-season wage burden
  if (ringerSigned) {
      const ringerWage = (state as any).veteranRingerWageCost || Math.max(25000, Math.floor(pureWages * 0.35));
      pureWages += ringerWage;
  }
  // Dynasty Champion squad wage escalation:
  // In elite European handball (Barça, Kiel, PSG, Magdeburg), sustaining titles at the current club increases squad renewal demands
  const history = (state.history || []).filter((h: any) => !h.clubName || !state.club.name || h.clubName === state.club.name);
  const topFlightTitles = history.filter((h: any) => h.pos === 1 && (h.tier === 1 || h.playedTier === 1)).length;
  if (tier === 1 && topFlightTitles > 0) {
    const dynastyWageMult = Math.min(0.25, topFlightTitles * 0.05);
    pureWages = Math.floor(pureWages * (1 + dynastyWageMult));
  }

  // Generational Rebuild Wage Relief:
  // Slashed 25% wage burden for 3 seasons following an intentional transition rebuild
  if ((state as any).rebuildWageDiscountSeasons && (state as any).rebuildWageDiscountSeasons > 0) {
    pureWages = Math.floor(pureWages * 0.75);
  }

  // Statutory Relegation Wage Reduction Clause:
  // Standard European handball contracts include an automatic 18% relegation wage reduction clause
  // during the first season after relegation so clubs can recalibrate without an immediate financial death spiral.
  if ((state as any).relegationWageReliefSeasons && (state as any).relegationWageReliefSeasons > 0) {
    pureWages = Math.floor(pureWages * 0.82);
  }

  // European Away Travel Exception: Fixed globally based on match count (does NOT scale down by country)
  const euroTravelTax = state.euroStatus === 'CL' 
    ? 180000 
    : state.euroStatus === 'EL' 
    ? 95000 
    : state.euroStatus === 'ECL' 
    ? 45000 
    : 0;

  // Medical & Physio Services (Authentic European Handball)
  // Retained sports physicians, orthopedics + 2-3 dedicated physiotherapists and imaging/taping.
  const baseMedicalTierMap: Record<number, number> = {
    1: 75000,
    2: 32000,
    3: 14000,
    4: 4500,
    5: 1800,
    6: 750,
  };
  let baseMedical = (baseMedicalTierMap[tier] || 750) * cMult;
  if (isReserve) baseMedical *= 0.35;
  const medicalLevel = state.club.medicalLevel || 1;
  const medicalOp = Math.floor(baseMedical * Math.pow(1.15, medicalLevel - 1));

  // Youth Academy Center (Authentic European Handball NLZ)
  // Nachwuchsleistungszentrum certified coaches, youth boarding subsidies, mini-bus transport & tournament fees.
  const baseAcademyTierMap: Record<number, number> = {
    1: 120000,
    2: 48000,
    3: 16000,
    4: 5000,
    5: 1800,
    6: 750,
  };
  let baseAcademy = isReserve ? 0 : (baseAcademyTierMap[tier] || 750) * cMult;
  const academyLevel = state.club.academyLevel || 1;
  const academyOp = Math.floor(baseAcademy * Math.pow(1.15, academyLevel - 1));

  // Arena Maintenance & Utilities (Indoor Arena Reality)
  // Base indoor facility operations + progressive cost for large and mega venues.
  // In professional handball, large venues require major event-day staffing, police and security deployments,
  // high-draw climate and lighting systems, structural upkeep, and insurance.
  const baseArenaOpsByTier: Record<number, number> = {
    1: 220000,
    2: 95000,
    3: 30000,
    4: 10000,
    5: 4000,
    6: 1500
  };
  const baseArenaOp = (baseArenaOpsByTier[tier] || 1500) * cMult;
  const baseTierCapacity = tier === 1 ? 4500 : tier === 2 ? 2500 : tier === 3 ? 1200 : 500;
  const effectiveStad = isReserve ? Math.min(1500, currStad) : currStad;
  const excessCapacity = Math.max(0, effectiveStad - baseTierCapacity);
  
  // Progressive stadium operating scale: 
  // Larger venues have substantially higher event-day staffing, security details, municipal police fees, and facility insurance
  let excessSeatCost = 0;
  if (excessCapacity > 0) {
    if (tier <= 2) {
      if (excessCapacity <= 5500) {
        // 4,500 to 10,000 seats: ~€28/seat
        excessSeatCost = excessCapacity * 28;
      } else if (excessCapacity <= 15500) {
        // 10,000 to 20,000 seats: ~€28 on first 5.5k + €55/seat on the next 10k
        excessSeatCost = (5500 * 28) + ((excessCapacity - 5500) * 55);
      } else {
        // 20,000 to 30,000 mega arenas: €85/seat on top tier (massive matchday security, ticketing systems, energy)
        excessSeatCost = (5500 * 28) + (10000 * 55) + ((excessCapacity - 15500) * 85);
      }
    } else {
      // Semi-pro & amateur municipal gymnasiums (Tier 3-6)
      const seatRate = tier === 3 ? 10 : tier === 4 ? 3 : 1.5;
      excessSeatCost = excessCapacity * seatRate;
    }
  }
  const stadiumOp = Math.floor((baseArenaOp + (excessSeatCost * cMult)));

  // Team Travel, Admin & Office Operations (Authentic European Handball)
  // Domestic travel for 17 away matches (team bus/train + business hotel: ~€100k-€120k)
  // + front office administration (managing director, press officer, ticketing software: ~€150k-€180k).
  const baseTravelAdminByTier: Record<number, number> = {
    1: 320000,
    2: 120000,
    3: 40000,
    4: 12000,
    5: 4500,
    6: 1800
  };
  let travelAdminOp = Math.floor((baseTravelAdminByTier[tier] || 1800) * cMult);
  // Commercial ticketing, member management, PR and fan operations scale with local supporter base (excluding digital/global marketing expansion)
  const localAdminFans = Math.max(0, currentFans - globalFans);
  if (!isReserve && localAdminFans > 20000) {
    const fanAdminScale = Math.min(480000, Math.floor((localAdminFans - 20000) * 3.2 * cMult));
    travelAdminOp += fanAdminScale;
  }
  if (isReserve) travelAdminOp = Math.floor(travelAdminOp * 0.35);

  // Bank Loan / Arena Syndicate Credit Service
  const activeLoan = (state as any).activeLoan;
  const loanInstallment = (activeLoan && activeLoan.yearsRemaining > 0) ? activeLoan.annualPayment : 0;

  // 5. Competitive Balance & League Solidarity Luxury Tax (Luxussteuer)
  // In European professional handball, clubs accumulating massive treasury reserves or maintaining squad payroll
  // substantially above the domestic competitive balance threshold contribute progressive solidarity luxury taxes.
  // This funds league-wide infrastructure parity and prevents runaway oligopolistic dominance.
  // Restricted strictly to top professional divisions (Tier 1 & Tier 2).
  // Uses preTransferTreasury (currentBudget + transferSpend) so spending cash on player transfers never reduces luxury tax mid-season to create fake net profit gains.
  const tierTreasuryThreshold = Math.round((tier === 1 ? 8000000 : tier === 2 ? 3000000 : tier === 3 ? 1200000 : 500000) * cMult);
  
  let treasuryLuxuryTax = 0;
  if (tier <= 2 && preTransferTreasury > tierTreasuryThreshold) {
    const surplus = preTransferTreasury - tierTreasuryThreshold;
    // Progressive brackets:
    // Bracket 1: First €6M above threshold @ 15% (e.g. €8M to €14M in Tier 1 GER)
    // Bracket 2: Next €6M above that @ 25% (e.g. €14M to €20M in Tier 1 GER)
    // Bracket 3: Any amount beyond €12M surplus @ 40% (e.g. >€20M in Tier 1 GER)
    const b1 = Math.min(surplus, 6000000 * cMult);
    const b2 = Math.min(Math.max(0, surplus - b1), 6000000 * cMult);
    const b3 = Math.max(0, surplus - b1 - b2);
    treasuryLuxuryTax = Math.floor(b1 * 0.15 + b2 * 0.25 + b3 * 0.40);
  }

  // Squad Payroll Competitive Balance Soft Cap:
  // In professional handball, payroll above sustainable thresholds incurs a competitive balance tax.
  // European contenders (CL/EL) and clubs with strong commercial turnover (UEFA/EHF Squad Cost Rule)
  // receive higher sustainable wage allowances before luxury levies are applied.
  const euroCapFactor = state.euroStatus === 'CL' ? 1.45 : state.euroStatus === 'EL' ? 1.25 : state.euroStatus === 'ECL' ? 1.12 : 1.0;
  const domesticBaseCap = Math.round(baseLeagueWage * 1.08 * squadModifier * euroCapFactor * (isReserve ? 0.40 : 1.0));
  // UEFA / EHF Squad Cost Rule Safe Harbor:
  // Legitimate earned revenue (ticket sales, TV, sponsors, prize money) permits self-funded squad investment up to 72% of turnover
  const revenueSafeHarborCap = Math.round(estRevenue * 0.72);
  const softCap = Math.max(domesticBaseCap, revenueSafeHarborCap);

  let payrollLuxuryTax = 0;
  if (tier <= 2 && pureWages > softCap) {
    const excessWages = pureWages - softCap;
    // Progressive luxury brackets on excess wages:
    // Tier 1: First 15% above softCap taxed at 15%
    // Tier 2: Next 20% above softCap taxed at 25%
    // Tier 3: Extreme Galactico spending beyond 35% excess taxed at 35% (+ dynasty repeater bonus up to 20%)
    const tier1Span = softCap * 0.15;
    const tier2Span = softCap * 0.20;

    const t1 = Math.min(excessWages, tier1Span);
    const t2 = Math.min(Math.max(0, excessWages - tier1Span), tier2Span);
    const t3 = Math.max(0, excessWages - tier1Span - tier2Span);

    const repeaterBonus = Math.min(0.20, (topFlightTitles || 0) * 0.05);
    const tier3Rate = 0.35 + repeaterBonus;

    payrollLuxuryTax = Math.floor(t1 * 0.15 + t2 * 0.25 + t3 * tier3Rate);
  }

  // Pre-tax operational margin
  const baseOperatingExpenses = pureWages + euroTravelTax + stadiumOp + academyOp + medicalOp + travelAdminOp;
  const preTaxOperatingMargin = estRevenue - baseOperatingExpenses;

  // Solvency Protection Guardrail for Squad Payroll Tax:
  // Payroll luxury tax promotes competitive balance; it is never meant to push
  // an operationally profitable, self-funded club into a multi-million euro deficit.
  let effectivePayrollLuxuryTax = payrollLuxuryTax;
  if (preTaxOperatingMargin > 0 && effectivePayrollLuxuryTax > 0) {
    const maxPermittedPayrollTax = Math.max(Math.round(preTaxOperatingMargin * 0.50), Math.round(estRevenue * 0.08));
    effectivePayrollLuxuryTax = Math.min(effectivePayrollLuxuryTax, maxPermittedPayrollTax);
  }

  // NEW: Public Company Shareholder Dividend (The Greed Trap)
  let shareholderDividend = 0;
  if (state.club.isPublic && state.club.ipoPrice && state.club.stockPrice && preTaxOperatingMargin > 0) {
    const baseDividendRate = 0.10; // 10% base slice of profits
    // The trap: If stock price < IPO price, the multiplier skyrockets.
    const dividendMultiplier = state.club.ipoPrice / state.club.stockPrice; 
    
    const rawDividend = Math.floor(preTaxOperatingMargin * baseDividendRate * dividendMultiplier);
    // Hard clamp at 60% of operating profit to prevent instant bankruptcy, but guarantee misery.
    shareholderDividend = Math.min(rawDividend, Math.floor(preTaxOperatingMargin * 0.60));
  }

  const luxuryTax = tier <= 2 ? (treasuryLuxuryTax + effectivePayrollLuxuryTax) : 0;
  const operatingExpenses = baseOperatingExpenses + luxuryTax + shareholderDividend;
  const operatingMargin = estRevenue - operatingExpenses;
  const isStructuredDebt = operatingMargin >= 0;
  const debtInterest = (state.budget < 0 && !isStructuredDebt) ? Math.floor(Math.abs(state.budget) * 0.05) : 0;
  const totalExpenses = operatingExpenses + debtInterest + loanInstallment;
  const net = estRevenue - totalExpenses;

  return {
    extraSponsorInc,
    treasuryReserveYield,
    wages: totalExpenses,
    pureWages,
    operatingExpenses,
    operatingMargin,
    shareholderDividend,
    isStructuredDebt,
    stadiumOp,
    medicalOp,
    academyOp,
    travelAdminOp,
    euroTravelTax,
    luxuryTax,
    treasuryLuxuryTax: tier <= 2 ? treasuryLuxuryTax : 0,
    payrollLuxuryTax: tier <= 2 ? effectivePayrollLuxuryTax : 0,
    luxuryThreshold: tierTreasuryThreshold,
    softPayrollCap: softCap,
    debtInterest,
    loanInstallment,
    estRevenue,
    net,
    sponsorInc,
    sponsorDrivers,
    parentClubGrant: regionalGrant,
    matchdayIncome: matchdayIncomeK,
    posPrize: posPrizeK,
    matchdayIncomeK,
    tvPrize,
    posPrizeK,
    euroRev,
    youthMaintenance: academyOp,
    requiredCap: 0,
    expectedAtt,
    catchmentCeiling: catchment.maxCeiling,
    catchment
  };
};

export interface HistoricalManager {
  id: string;
  name: string;
  score: number;
}

export const HISTORICAL_MANAGERS: HistoricalManager[] = [
  { id: 'gislason', name: 'Alfred Gislason', score: 250000 },
  { id: 'jicha', name: 'Filip Jicha', score: 450000 },
  { id: 'wiegert', name: 'Bennet Wiegert', score: 750000 },
  { id: 'dujshebaev', name: 'Talant Dujshebaev', score: 1100000 },
  { id: 'pastor', name: 'Carlos Pastor', score: 1400000 },
  { id: 'rivera', name: 'Valero Rivera', score: 1800000 },
];

export const KNOWN_ARENAS: Record<string, string> = {
  'SC Magdeburg': 'GETEC Arena, Magdeburg',
  'Füchse Berlin': 'Max-Schmeling-Halle, Berlin',
  'THW Kiel': 'Wunderino Arena, Kiel',
  'SG Flensburg-Handewitt': 'GP JOULE Arena, Flensburg',
  'Rhein-Neckar Löwen': 'SAP Arena, Mannheim',
  'MT Melsungen': 'Rothenbach-Halle, Kassel',
  'TSV Hannover-Burgdorf': 'ZAG Arena, Hannover',
  'VfL Gummersbach': 'SCHWALBE arena, Gummersbach',
  'SC DHfK Leipzig': 'QUARTERBACK Immobilien ARENA, Leipzig',
  'TBV Lemgo Lippe': 'Phoenix Contact Arena, Lemgo',
  'Frisch Auf Göppingen': 'EWS Arena, Göppingen',
  'HC Erlangen': 'Arena Nürnberger Versicherung, Nürnberg',
  'HSG Wetzlar': 'Buderus Arena Wetzlar',
  'HSV Hamburg': 'Sporthalle Hamburg',
  'TVB Stuttgart': 'Porsche-Arena, Stuttgart',
  'ThSV Eisenach': 'Werner-Aßmann-Halle, Eisenach',
  '1. VfL Potsdam': 'MBS Arena Potsdam',
  'SG BBM Bietigheim': 'EgeTrans Arena, Bietigheim',
  'Bergischer HC': 'Uni-Halle, Wuppertal',
  'HBW Balingen-Weilstetten': 'Sparkassen-Arena, Balingen',
  'TuS N-Lübbecke': 'MERKUR Arena, Lübbecke',
  'HSG Nordhorn-Lingen': 'Euregium, Nordhorn',
  'GWD Minden': 'Kampa-Halle, Minden',
  'HC Elbflorenz Dresden': 'Joynext Arena, Dresden',
  'ASV Hamm-Westfalen': 'Westpress Arena, Hamm',
  'HSC 2000 Coburg': 'HUK-COBURG arena, Coburg',
  'Dessau-Roßlauer HV': 'Anhalt-Arena, Dessau',
  'VfL Eintracht Hagen': 'Krollmann Arena, Hagen',
  'Die Eulen Ludwigshafen': 'Friedrich-Ebert-Halle, Ludwigshafen',
  'TV Großwallstadt': 'Untermainhalle, Elsenfeld',
  'Aalborg Håndbold': 'Sparekassen Danmark Isarena, Aalborg',
  'GOG Håndbold': 'Phønix Tag Arena, Gudme',
  'Bjerringbro-Silkeborg': 'Jysk Arena, Silkeborg',
  'Skjern Håndbold': 'Skjern Bank Arena, Skjern',
  'Paris Saint-Germain': 'Stade Pierre de Coubertin, Paris',
  'Montpellier Handball': 'FDI Stadium, Montpellier',
  'Montpellier HB': 'FDI Stadium, Montpellier',
  'HBC Nantes': 'H Arena, Nantes',
  'Barça': 'Palau Blaugrana, Barcelona',
  'FC Barcelona': 'Palau Blaugrana, Barcelona',
  'Telekom Veszprém': 'Veszprém Aréna, Veszprém',
  'Veszprém KC': 'Veszprém Aréna, Veszprém',
  'Pick Szeged': 'Pick Aréna, Szeged',
  'Industria Kielce': 'Hala Legionów, Kielce',
  'Orlen Wisła Płock': 'Orlen Arena, Płock',
  'Górnik Zabrze': 'Hala Pogoń, Zabrze',
  'Alpla HC Hard': 'Sporthalle am See, Hard',
  'Bregenz Handball': 'Handball Arena Rieden-Vorkloster, Bregenz',
  'Handball Tirol': 'Osthalle Schwaz, Schwaz',
  'Fivers Margareten': 'Sporthalle Margareten, Vienna',
  'Kadetten Schaffhausen': 'BBC Arena, Schaffhausen',
  'HC Kriens-Luzern': 'Krauerhalle, Kriens',
  'Pfadi Winterthur': 'AXA Arena, Winterthur',
  'BSV Bern': 'Mobiliar Arena, Gümligen',
  'Wacker Thun': 'Lachenhalle, Thun',
};

export const getClubHomeArena = (club?: Partial<Club> | { name: string; [key: string]: any } | null): string => {
  if (!club) return 'Club Arena';
  if ((club as any).arena) return (club as any).arena;
  if ((club as any).stadiumName) return (club as any).stadiumName;
  if (club.name && KNOWN_ARENAS[club.name]) return KNOWN_ARENAS[club.name];
  const ctx = (club as any).context || (club as any).historicContext || '';
  if (ctx) {
    const match = ctx.match(
      /(?:inside|in|defending|turning|rocking|igniting|packing|operating out of|at|whose|into an?)\s+(?:the\s+)?([A-Z0-9À-ÿ][A-Za-z0-9À-ÿ\s\-'’\.\/]+?\b(?:Arena|Halle[n]?|Centret|Center|Idrætscenter|Idrætspark|Idrætshaller|Sportsby|Park|Spektrum|Parnasse|Phare|Beaublanc|Flandres|Colisée|Sélestat|Boisramé|Dome|Sporthalle|Palais des Sports[A-Za-z0-9À-ÿ\s\-'’]*|Sport- og Fritidscenter))\b/i
    );
    if (match) {
      const cleaned = match[1]
        .replace(
          /^(ear-shattering|fervent|state-of-the-art|iconic|modern|cauldron of|roaring|impenetrable|thunderous|beloved|legendary)\s+/i,
          ''
        )
        .trim();
      if (cleaned.length > 3) return cleaned;
    }
  }
  return `${club.name || 'Club'} Arena`;
};
