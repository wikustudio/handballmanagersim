import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Club, GameState } from '../types';
import { ALL_CLUBS as CLUBS } from '../data/clubsData';
import { TEAMS } from '../mod-data/teams';
import { getRegion, UEFA_COUNTRIES, CONMEBOL_COUNTRIES, CONCACAF_COUNTRIES, AFC_COUNTRIES } from '../utils/regionHelpers';
import { ClubLogo } from './ClubLogo';
import { simplifyClubName } from '../engine/moddingEngine';
import { PrestigeTrophy } from './PrestigeTrophy';
import { getCompetitionTheme } from '../utils/prestigeTheme';
import { BroadcastBadge } from './BroadcastBadge';
import { isCanadianMLSClub, rand } from '../data/gameConstants';

interface CupRunModalProps {
  clubsDb?: Club[];
  isModActive?: boolean;
  cupRun: { id: string; nameEn: string; nameDe: string; startRound?: 'quarter' | 'semi' | 'final'; endRound?: 'quarter' | 'semi' | 'final'; initialPlayedOpponents?: string[] };
  gameState: GameState;
  isDe: boolean;
  onComplete: (result: {won: boolean, exitRound: string, choice?: string, rivalStats?: {w:number, l:number, d:number}, playedOpponents?: string[], winnerId?: number, winnerName?: string}) => void;
  archRivalName?: string;
}

type Round = 'quarter' | 'semi' | 'final';
type Stage = 'tactics' | 'match' | 'result' | 'celebration' | 'eliminated';

const FAMOUS_STADIUMS: Record<string, {name: string, capacity: number}> = {
  'Madrid Blancos': { name: 'Santiago Bernabéu', capacity: 83186 },
  'Catalunya FC': { name: 'Camp Nou', capacity: 99354 },
  'Manchester Blue': { name: 'Etihad Stadium', capacity: 53400 },
  'Munich Red': { name: 'Allianz Arena', capacity: 75024 },
  'Paris Blue': { name: 'Parc des Princes', capacity: 47929 },
  'Merseyside Red': { name: 'Anfield', capacity: 61276 },
  'North London Red': { name: 'Emirates Stadium', capacity: 60704 },
  'Lombardia Blue-Black': { name: 'San Siro', capacity: 75923 },
  'Piemonte Black-White': { name: 'Allianz Stadium', capacity: 41507 },
  'Rhine Red-Black': { name: 'BayArena', capacity: 30210 },
  'Madrid Rojiblanco': { name: 'Cívitas Metropolitano', capacity: 70460 },
  'Westphalia Yellow': { name: 'Signal Iduna Park', capacity: 81365 },
  'Campania Blue': { name: 'Stadio Diego Armando Maradona', capacity: 54726 },
  'West London Blue': { name: 'Stamford Bridge', capacity: 40341 },
  'Lisbon Red': { name: 'Estádio da Luz', capacity: 64642 },
  'Douro Blue': { name: 'Estádio do Dragão', capacity: 50033 },
  'Manchester Red': { name: 'Old Trafford', capacity: 74310 },
  'Capitale Red-Yellow': { name: 'Stadio Olimpico', capacity: 70634 },
  'Lombardia Red-Black': { name: 'San Siro', capacity: 75923 },
  'Sevilla Rojiblanco': { name: 'Ramón Sánchez-Pizjuán', capacity: 43883 },
  'North East London': { name: 'Tottenham Hotspur Stadium', capacity: 62850 },
  'Ajax': { name: 'Johan Cruyff Arena', capacity: 55600 },
  'Lisbon Green': { name: 'Estádio José Alvalade', capacity: 50095 },
  'Marseille Sky-Blue': { name: 'Stade Vélodrome', capacity: 67394 },
  'Club América': { name: 'Estadio Azteca', capacity: 87523 },
  'Buenos Aires Red-White': { name: 'Estadio Monumental', capacity: 84567 },
  'Buenos Aires Blue-Gold': { name: 'La Bombonera', capacity: 54000 },
  'Rio Red-Black': { name: 'Maracanã', capacity: 78838 },
  'SoCal Black-Gold': { name: 'BMO Stadium', capacity: 22000 },
  // Ecuador
  'Barcelona SC': { name: 'Estadio Monumental Banco Pichincha', capacity: 59283 },
  'Guayaquil Amarilla': { name: 'Estadio Monumental Banco Pichincha', capacity: 59283 },
  'LDU Quito': { name: 'Estadio Rodrigo Paz Delgado', capacity: 41575 },
  'Quito Blanca': { name: 'Estadio Rodrigo Paz Delgado', capacity: 41575 },
  'CS Emelec': { name: 'Estadio George Capwell', capacity: 40020 },
  'Guayaquil Azul': { name: 'Estadio George Capwell', capacity: 40020 },
  'Independiente del Valle': { name: 'Estadio Banco Guayaquil', capacity: 12000 },
  'Valle Negra': { name: 'Estadio Banco Guayaquil', capacity: 12000 },
  'CD El Nacional': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'Quito Roja': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'CD Universidad Católica': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'Quito Celeste': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'SD Aucas': { name: 'Estadio Gonzalo Pozo Ripalda', capacity: 18799 },
  'Quito Oro': { name: 'Estadio Gonzalo Pozo Ripalda', capacity: 18799 },
  'Deportivo Cuenca': { name: 'Estadio Alejandro Serrano Aguilar', capacity: 16500 },
  'Cuenca Roja': { name: 'Estadio Alejandro Serrano Aguilar', capacity: 16500 },
  'Orense SC': { name: 'Estadio 9 de Mayo', capacity: 16500 },
  'Machala Verde': { name: 'Estadio 9 de Mayo', capacity: 16500 },
  'CSD Macará': { name: 'Estadio Bellavista', capacity: 16467 },
  'Ambato Celeste': { name: 'Estadio Bellavista', capacity: 16467 },
  'CD Técnico Universitario': { name: 'Estadio Bellavista', capacity: 16467 },
  'Ambato Roja': { name: 'Estadio Bellavista', capacity: 16467 },
  'Delfín SC': { name: 'Estadio Jocay', capacity: 14000 },
  'Manta Amarilla': { name: 'Estadio Jocay', capacity: 14000 },
  'Manta FC': { name: 'Estadio Jocay', capacity: 14000 },
  'Manta Celeste': { name: 'Estadio Jocay', capacity: 14000 },
  'SD Quito': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'Quito Chulla': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'Libertad FC': { name: 'Estadio Reina del Cisne', capacity: 10000 },
  'Loja Blanca': { name: 'Estadio Reina del Cisne', capacity: 10000 },
  'Mushuc Runa SC': { name: 'Estadio Mushuc Runa COAC', capacity: 8200 },
  'Echaleche Verde': { name: 'Estadio Mushuc Runa COAC', capacity: 8200 },
  'Guayaquil City FC': { name: 'Estadio Christian Benítez', capacity: 10152 },
  'Guayaquil Celeste': { name: 'Estadio Christian Benítez', capacity: 10152 },
  'Gualaceo SC': { name: 'Estadio Gerardo León Pozo', capacity: 2791 },
  'Gualaceo Amarilla': { name: 'Estadio Gerardo León Pozo', capacity: 2791 },
  'Cumbayá': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'Cumbayá FC': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'Imbabura SC': { name: 'Estadio Olímpico de Ibarra', capacity: 18600 },
  'Ibarra': { name: 'Estadio Olímpico de Ibarra', capacity: 18600 },
  'Ibarra Roja': { name: 'Estadio Olímpico de Ibarra', capacity: 18600 },
  'Leones del Norte': { name: 'Estadio Olímpico de Ibarra', capacity: 18600 },
  'San Antonio FC': { name: 'Estadio Olímpico de Ibarra', capacity: 18600 },
  'Chacaritas FC': { name: 'Estadio Ciudad de Pelileo', capacity: 8000 },
  'Pelileo': { name: 'Estadio Ciudad de Pelileo', capacity: 8000 },
  '9 de Octubre FC': { name: 'Estadio Los Chirijos', capacity: 15000 },
  'Guayaquil Patria': { name: 'Estadio Los Chirijos', capacity: 15000 },
  'Vargas Torres': { name: 'Estadio Folke Anderson', capacity: 14000 },
  'Esmeraldas': { name: 'Estadio Folke Anderson', capacity: 14000 },
  'Independiente Juniors': { name: 'Estadio Banco Guayaquil', capacity: 12000 },
  'Valle Negra B': { name: 'Estadio Banco Guayaquil', capacity: 12000 },
  'Guayaquil Everest': { name: 'Estadio Christian Benítez', capacity: 10152 },
  'Atuntaqui': { name: 'Estadio Jaime Terán', capacity: 10000 },
  'Quito Policial': { name: 'Estadio Olímpico Atahualpa', capacity: 35258 },
  'Portoviejo': { name: 'Estadio Reales Tamarindos', capacity: 18000 },
  'Riobamba': { name: 'Estadio Olímpico de Riobamba', capacity: 18000 },
  'Machala Amarilla': { name: 'Estadio 9 de Mayo', capacity: 16500 },
  'Vinces': { name: 'Estadio 14 de Junio', capacity: 5000 },
  'Quevedo': { name: 'Estadio 7 de Octubre', capacity: 15000 },
  'Guayaquil Rocafuerte': { name: 'Estadio Holcim Arena', capacity: 10000 }
};

export const GLOBAL_CLUB_CUP_STADIUMS: { name: string; capacity: number; tenantKeywords?: string[] }[] = [
  { name: 'MetLife Stadium, New York / New Jersey', capacity: 82500, tenantKeywords: ['new york'] },
  { name: 'Lusail Iconic Stadium, Qatar', capacity: 88966 },
  { name: 'Maracanã, Rio de Janeiro', capacity: 78838, tenantKeywords: ['flamengo', 'fluminense', 'rio'] },
  { name: 'Santiago Bernabéu, Madrid', capacity: 83186, tenantKeywords: ['madrid', 'real madrid', 'blancos'] },
  { name: 'Wembley Stadium, London', capacity: 90000 },
  { name: 'King Fahd International Stadium, Riyadh', capacity: 68752, tenantKeywords: ['al hilal', 'al nassr', 'riyadh'] },
  { name: 'Japan National Stadium, Tokyo', capacity: 68000, tenantKeywords: ['tokyo'] }
];

export const UEFA_CL_STADIUMS: { name: string; capacity: number; tenantKeywords?: string[] }[] = [
  { name: 'Wembley Stadium, London', capacity: 90000 },
  { name: 'Allianz Arena, Munich', capacity: 75024, tenantKeywords: ['bayern', 'munich'] },
  { name: 'Santiago Bernabéu, Madrid', capacity: 83186, tenantKeywords: ['madrid', 'real madrid', 'blancos'] },
  { name: 'Stade de France, Saint-Denis / Paris', capacity: 81338 },
  { name: 'San Siro, Milan', capacity: 75923, tenantKeywords: ['milan', 'inter', 'lombardia'] },
  { name: 'Stadio Olimpico, Rome', capacity: 70634, tenantKeywords: ['roma', 'lazio', 'capitale'] },
  { name: 'Atatürk Olympic Stadium, Istanbul', capacity: 74753 }
];

export const CONCACAF_CL_STADIUMS: { name: string; capacity: number; tenantKeywords?: string[] }[] = [
  { name: 'Estadio Azteca, Mexico City', capacity: 87523, tenantKeywords: ['américa', 'america', 'cruz azul'] },
  { name: 'SoFi Stadium, Los Angeles', capacity: 70240, tenantKeywords: ['los angeles', 'lafc', 'galaxy'] },
  { name: 'MetLife Stadium, New York / New Jersey', capacity: 82500, tenantKeywords: ['new york'] },
  { name: 'Mercedes-Benz Stadium, Atlanta', capacity: 71000, tenantKeywords: ['atlanta'] },
  { name: 'Estadio BBVA, Monterrey', capacity: 53500, tenantKeywords: ['monterrey', 'rayados'] },
  { name: 'BC Place, Vancouver', capacity: 54500, tenantKeywords: ['vancouver', 'whitecaps'] },
  { name: 'Hard Rock Stadium, Miami', capacity: 65326, tenantKeywords: ['miami'] }
];

export const CONMEBOL_CL_STADIUMS: { name: string; capacity: number; tenantKeywords?: string[] }[] = [
  { name: 'Maracanã, Rio de Janeiro', capacity: 78838, tenantKeywords: ['flamengo', 'fluminense', 'rio'] },
  { name: 'Estadio Monumental, Buenos Aires', capacity: 84567, tenantKeywords: ['river', 'river plate', 'buenos aires'] },
  { name: 'Estadio Centenario, Montevideo', capacity: 60235, tenantKeywords: ['montevideo', 'nacional', 'peñarol'] },
  { name: 'Estadio Nacional, Santiago', capacity: 48665, tenantKeywords: ['santiago', 'chile'] },
  { name: 'Estadio Monumental Banco Pichincha, Guayaquil', capacity: 59283, tenantKeywords: ['barcelona', 'guayaquil'] },
  { name: 'Estadio Metropolitano Roberto Meléndez, Barranquilla', capacity: 46692, tenantKeywords: ['junior', 'barranquilla'] },
  { name: 'Estadio Monumental "U", Lima', capacity: 80093, tenantKeywords: ['universitario', 'lima'] }
];

export const AFC_CL_STADIUMS: { name: string; capacity: number; tenantKeywords?: string[] }[] = [
  { name: 'King Fahd International Stadium, Riyadh', capacity: 68752, tenantKeywords: ['al hilal', 'al nassr', 'riyadh'] },
  { name: 'Saitama Stadium 2002, Saitama / Tokyo', capacity: 63700, tenantKeywords: ['urawa', 'saitama'] },
  { name: 'Azadi Stadium, Tehran', capacity: 78116, tenantKeywords: ['persepolis', 'esteghlal', 'tehran'] },
  { name: 'Seoul World Cup Stadium, Seoul', capacity: 66704, tenantKeywords: ['fc seoul', 'seoul'] },
  { name: 'Khalifa International Stadium, Doha', capacity: 45857, tenantKeywords: ['doha', 'qatar'] },
  { name: 'Tianhe Stadium, Guangzhou', capacity: 54856, tenantKeywords: ['guangzhou'] },
  { name: 'Hazza bin Zayed Stadium, Al Ain', capacity: 25053, tenantKeywords: ['al ain'] }
];

export const EUROPA_LEAGUE_STADIUMS: { name: string; capacity: number; tenantKeywords?: string[] }[] = [
  { name: 'San Mamés, Bilbao', capacity: 53289, tenantKeywords: ['athletic', 'bilbao'] },
  { name: 'Ramón Sánchez-Pizjuán, Seville', capacity: 43883, tenantKeywords: ['sevilla'] },
  { name: 'Johan Cruyff Arena, Amsterdam', capacity: 55600, tenantKeywords: ['ajax', 'amsterdam'] },
  { name: 'Aviva Stadium, Dublin', capacity: 51700 },
  { name: 'Puskás Aréna, Budapest', capacity: 67215 },
  { name: 'Deutsche Bank Park, Frankfurt', capacity: 58000, tenantKeywords: ['frankfurt', 'eintracht'] },
  { name: 'Stadio Diego Armando Maradona, Naples', capacity: 54726, tenantKeywords: ['napoli', 'naples', 'campania'] }
];

export const CONFERENCE_LEAGUE_STADIUMS: { name: string; capacity: number; tenantKeywords?: string[] }[] = [
  { name: 'Stamford Bridge, London', capacity: 40341, tenantKeywords: ['chelsea', 'west london'] },
  { name: 'OPAP Arena, Athens', capacity: 32500, tenantKeywords: ['aek', 'athens'] },
  { name: 'Fortuna Arena, Prague', capacity: 19370, tenantKeywords: ['slavia', 'prague'] },
  { name: 'Wrocław Stadium, Wrocław', capacity: 45105, tenantKeywords: ['wrocław', 'slask'] },
  { name: 'Red Bull Arena, Leipzig', capacity: 47069, tenantKeywords: ['leipzig', 'rasen'] },
  { name: 'Stade Pierre-Mauroy, Lille', capacity: 50186, tenantKeywords: ['lille'] },
  { name: 'Estadio Benito Villamarín, Seville', capacity: 60721, tenantKeywords: ['betis', 'seville'] }
];

export const pickNeutralStadium = (pool: { name: string; capacity: number; tenantKeywords?: string[] }[], opponentName?: string): { name: string; capacity: number } => {
  const oppLower = (opponentName || '').toLowerCase();
  const neutrals = pool.filter(s => {
    if (!s.tenantKeywords || s.tenantKeywords.length === 0) return true;
    return !s.tenantKeywords.some(kw => oppLower.includes(kw));
  });
  const candidates = neutrals.length > 0 ? neutrals : pool;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return { name: picked.name, capacity: picked.capacity };
};

export const getStadiumInfo = (opponentName: string, round: string, isDe: boolean, cupId: string, country: string, dbSource: Club[] = []) => {
  if (round === 'final') {
    if (cupId === 'cwc') {
      return pickNeutralStadium(GLOBAL_CLUB_CUP_STADIUMS, opponentName);
    }
    if (cupId === 'cl') {
      if (CONCACAF_COUNTRIES.includes(country)) return pickNeutralStadium(CONCACAF_CL_STADIUMS, opponentName);
      if (CONMEBOL_COUNTRIES.includes(country)) return pickNeutralStadium(CONMEBOL_CL_STADIUMS, opponentName);
      if (AFC_COUNTRIES.includes(country)) return pickNeutralStadium(AFC_CL_STADIUMS, opponentName);
      return pickNeutralStadium(UEFA_CL_STADIUMS, opponentName);
    }
    if (cupId === 'el') {
      if (CONMEBOL_COUNTRIES.includes(country)) return pickNeutralStadium(CONMEBOL_CL_STADIUMS, opponentName);
      return pickNeutralStadium(EUROPA_LEAGUE_STADIUMS, opponentName);
    }
    if (cupId === 'ecl') {
      return pickNeutralStadium(CONFERENCE_LEAGUE_STADIUMS, opponentName);
    }
    if (cupId === 'dfb' || cupId === 'efl') {
      if (country === 'GER') return { name: 'Olympiastadion Berlin', capacity: 74475 };
      if (country === 'ENG') return { name: 'Wembley Stadium', capacity: 90000 };
      if (country === 'FRA') return { name: 'Stade de France', capacity: 81338 };
      if (country === 'ITA') return { name: 'Stadio Olimpico', capacity: 70634 };
      if (country === 'ESP') return { name: 'Estadio de La Cartuja', capacity: 57619 };
      if (country === 'USA') return { name: 'Rose Bowl', capacity: 92542 };
      if (country === 'CAN') {
        const lowOpp = (opponentName || '').toLowerCase();
        if (lowOpp.includes('vancouver') || lowOpp.includes('whitecaps')) return { name: 'BC Place, Vancouver', capacity: 54500 };
        if (lowOpp.includes('montreal') || lowOpp.includes('montréal')) return { name: 'Stade Saputo, Montréal', capacity: 19619 };
        if (lowOpp.includes('hamilton') || lowOpp.includes('forge')) return { name: 'Tim Hortons Field, Hamilton', capacity: 23218 };
        if (lowOpp.includes('toronto')) return { name: 'BMO Field, Toronto', capacity: 30991 };
        const canadianFinalGrounds = [
          { name: 'BMO Field, Toronto', capacity: 30991 },
          { name: 'BC Place, Vancouver', capacity: 54500 },
          { name: 'Stade Saputo, Montréal', capacity: 19619 },
          { name: 'Tim Hortons Field, Hamilton', capacity: 23218 }
        ];
        return canadianFinalGrounds[Math.floor(Math.random() * canadianFinalGrounds.length)];
      }
      if (country === 'BRA') return { name: 'Maracanã', capacity: 78838 };
      if (country === 'ARG') return { name: 'Estadio Monumental', capacity: 84567 };
      if (country === 'TUR') return { name: 'Atatürk Olympic Stadium, Istanbul', capacity: 74753 };
      if (country === 'ECU') return { name: 'Estadio Olímpico Atahualpa, Quito', capacity: 35258 };
      if (country === 'COL') return { name: 'Estadio Nemesio Camacho El Campín, Bogotá', capacity: 36343 };
      if (country === 'MEX') return { name: 'Estadio Azteca, Mexico City', capacity: 87523 };
      if (country === 'POL') return { name: 'PGE Narodowy, Warsaw', capacity: 58580 };
      if (country === 'SCO') return { name: 'Hampden Park, Glasgow', capacity: 51866 };
      if (country === 'POR') return { name: 'Estádio Nacional do Jamor, Oeiras', capacity: 37593 };
    }
    if (cupId === 'lower') {
      if (country === 'ENG') return { name: 'Wembley Stadium', capacity: 90000 };
      return { name: 'Municipal Stadium (Final)', capacity: Math.floor(Math.random() * 10000) + 15000 };
    }
    if (cupId === 'reg') {
      return { name: 'Regional Final Ground', capacity: Math.floor(Math.random() * 3000) + 5000 };
    }
    return pickNeutralStadium(GLOBAL_CLUB_CUP_STADIUMS, opponentName);
  }

  // Check known authentic stadiums
  const famous = FAMOUS_STADIUMS[opponentName] || Object.entries(FAMOUS_STADIUMS).find(([k]) => k.toLowerCase() === opponentName.toLowerCase())?.[1];
  if (famous) return famous;

  const match = dbSource.find(c => c.name === opponentName || c.name.toLowerCase() === opponentName.toLowerCase()) || CLUBS.find(c => c.name === opponentName);
  if (match) {
    const cityName = opponentName.replace(/\s+(Red|Blue|Yellow|Green|White|Black|Rasen|Lok|Chemie|Eagle|Timbers|Legion|Amateur|City|United|Red-White|Red-Black|Blue-Black|White-Red|Red-Blue|B|II|2).*$/i, '').trim();
    return { name: match.stadium ? `${match.name} Stadium` : `${cityName} Stadium`, capacity: match.stadium || 40000 };
  }
  
  if (cupId === 'reg') return { name: 'Local Ground', capacity: Math.floor(Math.random() * 2000) + 1000 };
  if (cupId === 'lower') return { name: 'Away Stadium', capacity: Math.floor(Math.random() * 10000) + 5000 };
  
  return { name: 'Away Stadium', capacity: Math.floor(Math.random() * 30000) + 20000 };
};

export const CupRunModal: React.FC<CupRunModalProps> = ({ cupRun, gameState, isDe, onComplete, clubsDb = [], archRivalName, isModActive }) => {
  const isCanadian = isCanadianMLSClub(gameState.club.name, gameState.club.id, gameState.club.country);
  const isDomesticCupRun = cupRun.id === 'dfb' || cupRun.nameEn?.toLowerCase().includes('canadian') || cupRun.nameEn?.toLowerCase().includes('voyageurs') || cupRun.nameEn?.toLowerCase().includes('open cup');
  const effectiveCountry = (isCanadian && isDomesticCupRun) ? 'CAN' : (gameState.club.country || 'GER');
  const displayNameEn = (isCanadian && isDomesticCupRun) ? 'Voyageurs Cup' : cupRun.nameEn;
  const broadcastComp = (isCanadian && isDomesticCupRun) ? 'Voyageurs Cup' : `${cupRun.id} ${cupRun.nameEn || ''}`;
  const theme = useMemo(() => getCompetitionTheme(cupRun.id, effectiveCountry, displayNameEn), [cupRun.id, effectiveCountry, displayNameEn]);
  
  const [round, setRound] = useState<Round>(cupRun.startRound || 'semi');
  const [stage, setStage] = useState<Stage>('tactics');
  const [appliedDirective, setAppliedDirective] = useState<string>('');
  const [currentStadium, setCurrentStadium] = useState<{ name: string; capacity: number } | null>(null);

  // Responsive mobile detection (Pixel 10 and mobile viewports)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const responsiveTrophyHeight = isMobile ? 64 : theme.trophyHeight;
  const responsiveCelebrationTrophyHeight = isMobile ? 96 : Math.round(theme.trophyHeight * 1.15);
  
  const intervalRef = useRef<any>(null);
  const penIntervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const isResolvedRef = useRef(false);

  const clearAllTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (penIntervalRef.current) clearInterval(penIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    penIntervalRef.current = null;
    timeoutRef.current = null;
  };
  
  const handleComplete = (result: {won: boolean, exitRound: string, choice?: string, winnerId?: number, winnerName?: string}) => {
    if (isResolvedRef.current) return;
    isResolvedRef.current = true;
    clearAllTimers();
    onComplete({ ...result, mpSpent: mpBoostCount * 5, rivalStats, playedOpponents: playedOpponentsRef.current });
    delete (window as any)._cupChoice;
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
      delete (window as any)._cupChoice;
    };
  }, []);

  const [rivalStats, setRivalStats] = useState<{w:number, l:number, d:number}>({w:0, l:0, d:0});
  const [selectedCupChoice, setSelectedCupChoice] = useState<string | undefined>(undefined);
  const [mpBoostCount, setMpBoostCount] = useState<number>(0);
  const availableMp = Math.max(0, (gameState.skillPoints || 0) - mpBoostCount * 5);
  const [opponent, setOpponent] = useState<{
    id?: number;
    name: string;
    ovr: number;
    color?: string;
    logo?: string;
    fallbackLogo?: string;
    tactic: string;
    tacticDe: string;
    isDerby?: boolean;
  } | null>(null);

  const [playedOpponents, setPlayedOpponents] = useState<string[]>(cupRun.initialPlayedOpponents || []);
  const playedOpponentsRef = useRef<string[]>(cupRun.initialPlayedOpponents || []);
  const [matchResult, setMatchResult] = useState<{won: boolean, score: string, description: string} | null>(null);
  const [matchMinute, setMatchMinute] = useState(0);
  const [liveScore, setLiveScore] = useState({ me: 0, opp: 0 });
  const [isShootout, setIsShootout] = useState(false);   
  const [regularScore, setRegularScore] = useState<{ me: number; opp: number } | null>(null);
  const [recentEvent, setRecentEvent] = useState<string | null>(null);

  const liveClub = useMemo(() => {
    const dbClub = clubsDb?.find(c => 
      c.id === gameState.club.id || 
      String(c.id) === String(gameState.club.id) ||
      c.name.toLowerCase().trim() === gameState.club.name.toLowerCase().trim()
    );
    const modTeam = isModActive ? TEAMS.find(t => 
      t.id === gameState.club.id || 
      String(t.id) === String(gameState.club.id) || 
      t.name.toLowerCase().trim() === gameState.club.name.toLowerCase().trim()
    ) : undefined;

    return {
      ...gameState.club,
      name: (isModActive && (dbClub?.name || modTeam?.name)) || gameState.club.name,
      id: dbClub?.id ?? modTeam?.id ?? gameState.club.id,
      logo: isModActive ? (dbClub?.logo || modTeam?.logo || gameState.club.logo) : gameState.club.logo,
      fallbackLogo: isModActive ? (dbClub?.fallbackLogo || modTeam?.fallbackLogo || gameState.club.fallbackLogo) : gameState.club.fallbackLogo,
      color: dbClub?.color || modTeam?.color || gameState.club.color,
    };
  }, [clubsDb, gameState.club, isModActive]);

  const club = liveClub;
  const hasTacticalGeniusPerk = Boolean(
    gameState.managerSkills?.includes('tactical_mastermind') ||
    gameState.managerSkills?.includes('tactical_genius')
  );
  const isTacticalMasterCoach = gameState.currentCoach?.strength === 'Tactical Chessboard Maestro';
  const coachUnderstandsOpponent = useMemo(() => {
    if (!isTacticalMasterCoach || !opponent) return false;
    const key = `${opponent.name || ''}_${round}_${gameState.year || 2026}_${gameState.currentCoach?.id || gameState.currentCoach?.name || ''}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    // Tactical Master coaches only fully understand and reveal odds against some opponents (~30%)
    return (Math.abs(hash) % 10) < 3;
  }, [isTacticalMasterCoach, opponent, round, gameState.year, gameState.currentCoach?.id, gameState.currentCoach?.name]);

  const canSeeOdds = hasTacticalGeniusPerk || coachUnderstandsOpponent;
  const playerOvr = Math.min(100, club.baseOvr + (hasTacticalGeniusPerk ? 2 : 0));

  const generateOpponent = (r: Round) => {
    const isReserveTeam = (name: string) => {
      const lower = name.toLowerCase();
      return lower.endsWith(' ii') || lower.endsWith(' b') || lower.includes('reserve') || lower.includes(' u21') || lower.includes(' u23') || lower.includes(' castilla') || lower.startsWith('jong ') || lower.includes(' jong ');
    };
    
    let selectedName = 'FC Opponent';
    let selectedOvr = 80;

    const isCanadianClub = (cName: string, cCountry?: string, cId?: number) => cCountry === 'CAN' || isCanadianMLSClub(cName, cId, cCountry);
    const baseCountry = gameState.club.country || 'GER';
    const country = isCanadian && isDomesticCupRun ? 'CAN' : baseCountry;
    
    const dbSource = clubsDb.length > 0 ? clubsDb : CLUBS;

    const isCONCACAF = CONCACAF_COUNTRIES.includes(country);
    const isCONMEBOL = CONMEBOL_COUNTRIES.includes(country);
    const isAFC = AFC_COUNTRIES.includes(country);

    const isSameContinent = (cCountry: string) => {
      if (isCONCACAF) return CONCACAF_COUNTRIES.includes(cCountry);
      if (isCONMEBOL) return CONMEBOL_COUNTRIES.includes(cCountry);
      if (isAFC) return AFC_COUNTRIES.includes(cCountry);
      return UEFA_COUNTRIES.includes(cCountry) || (!CONCACAF_COUNTRIES.includes(cCountry) && !CONMEBOL_COUNTRIES.includes(cCountry) && !AFC_COUNTRIES.includes(cCountry));
    };

    let pickedClub: Club | null = null;

    const allPlayed = new Set([
      ...playedOpponentsRef.current.map(n => n.toLowerCase().trim()),
      ...playedOpponents.map(n => n.toLowerCase().trim())
    ]);

    const isCandidatePlayed = (c: Club) => {
      if (allPlayed.has(c.name.toLowerCase().trim())) return true;
      const modT = TEAMS.find(t => t.id === c.id || t.name.toLowerCase().trim() === c.name.toLowerCase().trim());
      if (modT && allPlayed.has(modT.name.toLowerCase().trim())) return true;
      return false;
    };

    const isClubEligibleForCup = (c: Club): boolean => {
      if (c.id === gameState.club.id || isReserveTeam(c.name)) return false;
      const cCountry = c.country || 'GER';
      if (cupRun.id === 'dfb') {
        if (country === 'CAN') {
          return cCountry === 'CAN' || isCanadianClub(c.name, cCountry, c.id);
        }
        if (country === 'USA') {
          return cCountry === 'USA' && !isCanadianClub(c.name, cCountry, c.id);
        }
        return cCountry === country;
      }
      if (cupRun.id === 'efl') {
        return cCountry === 'ENG' && c.tier <= 4;
      }
      if (cupRun.id === 'reg' || cupRun.id === 'lower') {
        return cCountry === country && c.tier >= 3;
      }
      if (['cl', 'el', 'ecl', 'cwc'].includes(cupRun.id)) {
        const isForeign = cCountry !== country;
        const sameCont = isSameContinent(cCountry);
        if (cupRun.id === 'cwc') return isForeign && c.tier === 1 && !sameCont;
        return c.tier === 1 && sameCont;
      }
      return cCountry === country;
    };

    if (cupRun.id === 'dfb' || cupRun.id === 'efl') {
      // 1. Gather all eligible clubs for this competition (correct country, not reserve, not user club)
      let eligible = dbSource.filter(c => isClubEligibleForCup(c));
      
      // 2. Sort all eligible clubs by baseOvr descending
      eligible.sort((a, b) => b.baseOvr - a.baseOvr);
      const highestOvr = eligible[0]?.baseOvr || 85;

      // 3. Separate into unplayed clubs in this tournament run vs already played
      const unplayedEligible = eligible.filter(c => !isCandidatePlayed(c));
      const usableEligible = unplayedEligible.length > 0 ? unplayedEligible : eligible;

      // 4. Check for authentic Cinderella underdog miracle
      // Under 5% in Semi-Finals, under 1% in Finals
      const isCinderellaRoll = (r === 'semi' && Math.random() < 0.04) || (r === 'final' && Math.random() < 0.006);
      const cinderellaPool = usableEligible.filter(c => c.baseOvr <= highestOvr - 8 || c.tier >= 3);

      if (isCinderellaRoll && cinderellaPool.length > 0) {
        // A miraculous underdog run!
        const underdog = cinderellaPool[Math.floor(Math.random() * cinderellaPool.length)];
        pickedClub = underdog;
        selectedName = underdog.name;
        selectedOvr = Math.min(99, Math.max(40, underdog.baseOvr + (r === 'final' ? 2 : 0)));
      } else {
        // 5. Standard Competitive Selection: OVR-WEIGHTED HIERARCHY
        // Regardless of tier, higher OVR clubs go deep.
        // Provides broad pool diversity across contenders while preserving elite caliber
        let poolSize = 16;
        if (r === 'final') {
          poolSize = Math.min(8, usableEligible.length);
        } else if (r === 'semi') {
          poolSize = Math.min(12, usableEligible.length);
        } else {
          poolSize = Math.min(16, usableEligible.length);
        }

        const topCandidates = usableEligible.slice(0, Math.max(1, poolSize));

        const fallbackOpponent: Club = dbSource.find(c => c.id !== gameState.club.id && !isReserveTeam(c.name))
          || dbSource.find(c => c.id !== gameState.club.id)
          || CLUBS.find(c => c.id !== gameState.club.id)
          || { id: 9999, name: country === 'GER' ? 'Traditionsklub FC' : 'Metropolitan FC', baseOvr: 78, color: '#3b82f6', tier: 1 };

        if (topCandidates.length === 0) {
          pickedClub = fallbackOpponent;
          selectedName = fallbackOpponent.name;
          selectedOvr = Math.min(99, Math.max(40, (fallbackOpponent.baseOvr || 75) + (r === 'final' ? 2 : (r === 'quarter' ? -2 : 0))));
        } else {
          const isRivalClub = (c: Club) => !!(
            archRivalName && (
              c.name.toLowerCase().trim() === archRivalName.toLowerCase().trim() ||
              simplifyClubName(c.name) === simplifyClubName(archRivalName)
            )
          );

          // Weight selection by OVR with rival fatigue mitigation:
          // Prevents drawing the arch-rival in almost every domestic cup campaign,
          // allowing other domestic contenders (e.g. Leverkusen, Leipzig, Frankfurt, Stuttgart, Bilbao, Chelsea)
          // to legitimately reach the later stages while keeping derbies a special, authentic occasion.
          const minOvrInPool = Math.min(...topCandidates.map(c => c.baseOvr ?? 75));
          const weights = topCandidates.map(c => {
            let baseWeight = Math.pow(Math.max(1, (c.baseOvr ?? 75) - minOvrInPool + 4), 2.2);
            if (isRivalClub(c)) {
              baseWeight *= 0.35;
            }
            return baseWeight;
          });
          const totalWeight = weights.reduce((sum, w) => sum + w, 0);

          let randomWeight = Math.random() * (totalWeight || 1);
          let chosenClub = topCandidates[0] || fallbackOpponent;
          for (let i = 0; i < topCandidates.length; i++) {
            randomWeight -= weights[i];
            if (randomWeight <= 0) {
              chosenClub = topCandidates[i];
              break;
            }
          }

          pickedClub = chosenClub;
          selectedName = chosenClub.name;
          selectedOvr = Math.min(99, Math.max(40, (chosenClub.baseOvr ?? 75) + (r === 'final' ? 2 : (r === 'quarter' ? -2 : 0))));
        }
      }
    } else if (cupRun.id === 'reg' || cupRun.id === 'lower') {
      let candidates = dbSource.filter(c => isClubEligibleForCup(c));
      candidates.sort((a, b) => b.baseOvr - a.baseOvr);
      
      const unplayed = candidates.filter(c => !isCandidatePlayed(c));
      const pool = unplayed.length > 0 ? unplayed : candidates;

      let poolSize = 16;
      if (r === 'final') {
        poolSize = Math.min(4, pool.length);
      } else if (r === 'semi') {
        poolSize = Math.min(8, pool.length);
      } else {
        poolSize = Math.min(16, pool.length);
      }

      const topRegional = pool.slice(0, Math.max(1, poolSize));
      const c = topRegional.length > 0 ? topRegional[Math.floor(Math.random() * topRegional.length)] : undefined;
      if (c) {
        pickedClub = c;
        selectedName = c.name;
        selectedOvr = Math.min(99, Math.max(40, (c.baseOvr ?? 70) + (r === 'final' ? 2 : (r === 'quarter' ? -2 : 0))));
      } else {
        const fallback = dbSource.find(cl => cl.id !== gameState.club.id && !isReserveTeam(cl.name))
          || dbSource.find(cl => cl.id !== gameState.club.id)
          || CLUBS[0]
          || { id: 9999, name: country === 'GER' ? 'Traditionsklub FC' : 'Metropolitan FC', baseOvr: 70, color: '#3b82f6', tier: 3 };
        pickedClub = fallback;
        selectedName = fallback.name;
        selectedOvr = Math.min(99, Math.max(40, fallback.baseOvr ?? 70));
      }
    } else if (['cl', 'el', 'ecl', 'cwc'].includes(cupRun.id)) {
      const allPlayed = new Set([...playedOpponentsRef.current, ...playedOpponents]);
      const candidates = dbSource.filter(c => {
        if (c.id === gameState.club.id || isReserveTeam(c.name)) return false;
        const cCountry = c.country || 'GER';
        const isForeign = cCountry !== country;
        const sameCont = isSameContinent(cCountry);
        
        if (cupRun.id === 'cwc') {
          return isForeign && c.tier === 1 && !sameCont;
        } else {
          return c.tier === 1 && sameCont;
        }
      });
      
      let ovrMin = 75; let ovrMax = 99;
      if (cupRun.id === 'cl') { ovrMin = (isCONCACAF || isCONMEBOL || isAFC) ? 70 : 85; }
      else if (cupRun.id === 'el') { ovrMin = (isCONCACAF || isCONMEBOL || isAFC) ? 65 : 80; ovrMax = 89; }
      else if (cupRun.id === 'ecl') { ovrMin = (isCONCACAF || isCONMEBOL || isAFC) ? 60 : 75; ovrMax = 83; }
      else if (cupRun.id === 'cwc') { ovrMin = 85; }
      
      let validCandidates = candidates.filter(c => c.baseOvr >= ovrMin && c.baseOvr <= ovrMax);
      if (validCandidates.length === 0) validCandidates = candidates;

      const pool = validCandidates.filter(c => !isCandidatePlayed(c));
      const fallbackUnplayed = candidates.filter(c => !isCandidatePlayed(c));
      const continentUnplayed = dbSource.filter(c => {
        if (c.id === gameState.club.id || isReserveTeam(c.name)) return false;
        const cCountry = c.country || 'GER';
        return isSameContinent(cCountry) && !isCandidatePlayed(c);
      });
      const rawFinalPool = pool.length > 0 ? pool : (fallbackUnplayed.length > 0 ? fallbackUnplayed : (continentUnplayed.length > 0 ? continentUnplayed : []));
      
      if (rawFinalPool.length > 0) {
        // Sort by OVR descending so Semi-Finals and Finals draw true continental heavyweights
        const sortedPool = [...rawFinalPool].sort((a, b) => (b.baseOvr ?? 80) - (a.baseOvr ?? 80));
        const roundSliceCap = r === 'final' ? Math.min(4, sortedPool.length) : r === 'semi' ? Math.min(8, sortedPool.length) : Math.min(14, sortedPool.length);
        const seededPool = sortedPool.slice(0, Math.max(1, roundSliceCap));
        const c = seededPool[Math.floor(Math.random() * seededPool.length)];
        pickedClub = c;
        selectedName = c.name;
        let computedOppOvr = Math.min(99, Math.max(40, (c.baseOvr ?? 80) + (r === 'final' ? 2 : (r === 'quarter' ? -2 : 0))));
        // Late-Game Heavyweight Final Parity: If the user is a 92+ OVR Dynasty in the Champions Cup or CWC Final,
        // ensure the opposing continental finalist is a true 90-96 OVR titan (while keeping the user favored).
        if ((cupRun.id === 'cl' || cupRun.id === 'cwc') && r === 'final' && playerOvr >= 92) {
          computedOppOvr = Math.max(computedOppOvr, Math.min(96, playerOvr - rand(2, 4)));
        }
        selectedOvr = computedOppOvr;
      } else {
        const foreignCandidates = dbSource.filter(c => c.id !== gameState.club.id && !isReserveTeam(c.name) && (c.country || 'GER') !== country);
        const c = (foreignCandidates.length > 0 ? foreignCandidates : dbSource.filter(c => c.id !== gameState.club.id && !isReserveTeam(c.name)))[0];
        if (c) {
          pickedClub = c;
          selectedName = c.name;
          selectedOvr = Math.min(99, Math.max(40, (c.baseOvr ?? 80) + (r === 'final' ? 2 : 0)));
        } else {
          const fallbackClub: Club = CLUBS.find(cl => (cl.country || 'GER') !== country) || {
            id: 9998,
            name: gameState.club.country === 'USA' ? 'Mexico Elite' : 'Continental Elite',
            baseOvr: 85,
            color: '#1e40af',
            tier: 1,
            stadium: 45000
          };
          pickedClub = fallbackClub;
          selectedName = fallbackClub.name;
          selectedOvr = fallbackClub.baseOvr;
        }
      }
    }

    if (!pickedClub) {
      pickedClub = {
        id: 9998,
        name: 'Intercontinental Champion',
        baseOvr: Math.min(99, Math.max(78, playerOvr + rand(-2, 4))),
        color: '#1e40af',
        tier: 1,
        stadium: 65000,
        country: 'BRA'
      };
      selectedName = pickedClub.name;
      selectedOvr = pickedClub.baseOvr;
    }

    const tacs = [
      { id: 'Tiki-Taka', de: 'Tiki-Taka' },
      { id: 'Gegenpressing', de: 'Gegenpressing' },
      { id: 'Direct Counter', de: 'Direct Counter' },
      { id: 'Park the Bus', de: 'Catenaccio' }
    ];
    
    const selectedTac = tacs[Math.floor(Math.random() * tacs.length)];

    let modOpponent = undefined;
    if (isModActive && pickedClub) {
      modOpponent = TEAMS.find(t => t.id === pickedClub.id || String(t.id) === String(pickedClub.id));
      if (!modOpponent) modOpponent = TEAMS.find(t => t.name.toLowerCase().trim() === pickedClub.name.toLowerCase().trim());
      if (!modOpponent) modOpponent = TEAMS.find(t => t.country === pickedClub.country && simplifyClubName(t.name) === simplifyClubName(pickedClub.name));
      if (!modOpponent) modOpponent = TEAMS.find(t => simplifyClubName(t.name) === simplifyClubName(pickedClub.name) || (selectedName && simplifyClubName(t.name) === simplifyClubName(selectedName)));
    }

    const finalOpponentName = (isModActive && modOpponent?.name) || selectedName;
    const finalOpponentId = modOpponent?.id ?? pickedClub?.id;
    const finalOpponentLogo = isModActive ? (modOpponent?.logo || pickedClub?.logo) : pickedClub?.logo;
    const finalOpponentFallback = isModActive ? (modOpponent?.fallbackLogo || pickedClub?.fallbackLogo) : pickedClub?.fallbackLogo;
    const finalOpponentColor = modOpponent?.color || pickedClub?.color;

    const isDerbyMatch = !!(
      archRivalName && (
        simplifyClubName(finalOpponentName) === simplifyClubName(archRivalName) ||
        (pickedClub && simplifyClubName(pickedClub.name) === simplifyClubName(archRivalName))
      )
    );

    setOpponent({ 
      id: finalOpponentId,
      name: finalOpponentName, 
      ovr: Math.min(99, Math.max(35, selectedOvr)), 
      color: finalOpponentColor,
      logo: finalOpponentLogo,
      fallbackLogo: finalOpponentFallback,
      tactic: selectedTac.id, 
      tacticDe: selectedTac.de,
      isDerby: isDerbyMatch
    });
    const roundStadium = getStadiumInfo(finalOpponentName, r, isDe, cupRun.id, effectiveCountry, clubsDb);
    setCurrentStadium(roundStadium);
    const namesToAdd = Array.from(new Set([finalOpponentName, selectedName, pickedClub?.name].filter(Boolean))) as string[];
    playedOpponentsRef.current = [...playedOpponentsRef.current, ...namesToAdd];
    setPlayedOpponents(prev => [...prev, ...namesToAdd]);
  };

  useEffect(() => {
    setRound(cupRun.startRound || 'semi');
    setStage('tactics');
    setMatchResult(null);
    setMatchMinute(0);
    setLiveScore({ me: 0, opp: 0 });
    setIsShootout(false);
    setRegularScore(null);
    setRecentEvent(null);
    setAppliedDirective('');
    isResolvedRef.current = false;
    generateOpponent(cupRun.startRound || 'semi');
  }, [cupRun.id, cupRun.startRound]);

  useEffect(() => {
    if (stage === 'celebration') {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      intervalRef.current = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(intervalRef.current);
        }

        const particleCount = 70 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      return () => clearInterval(intervalRef.current);
    }
  }, [stage]);

  const isContinentalLegend = gameState.currentCoach?.strength === 'Continental Legend' && ['cl', 'el', 'ecl'].includes(cupRun.id);
  const isCupSpecialist = gameState.currentCoach?.strength === 'Cup Specialist' && ['dfb', 'reg'].includes(cupRun.id);
  const coachCupBonusOvr = isContinentalLegend || isCupSpecialist ? 4 : 0;

  // --- TACTICAL DUEL & PHILOSOPHY/COACH SYNERGY LOGIC ---
  const [isTacticalDuel] = useState<boolean>(() => Math.random() > 0.5);

  const normalizeTacticKey = (style?: string): string => {
    if (!style) return 'Total Football';
    const s = style.trim().toLowerCase();
    if (s === 'catenaccio' || s === 'park the bus' || s === 'defensive') return 'Park the Bus';
    if (s === 'tiki-taka' || s === 'possession') return 'Tiki-Taka';
    if (s === 'gegenpressing' || s === 'gegenpress' || s === 'pressing') return 'Gegenpressing';
    if (s === 'direct counter' || s === 'counter' || s === 'counter-attack' || s === 'wing play') return 'Direct Counter';
    if (s === 'total football' || s === 'attacking' || s === 'balanced') return 'Total Football';
    return style;
  };

  const getTacticalAdvantage = (myTac: string, oppTac: string) => {
    const p = normalizeTacticKey(myTac);
    const o = normalizeTacticKey(oppTac);
    if (p === 'Tiki-Taka' && o === 'Park the Bus') return 1;
    if (p === 'Tiki-Taka' && o === 'Gegenpressing') return -1;
    if (p === 'Park the Bus' && o === 'Direct Counter') return 1;
    if (p === 'Park the Bus' && o === 'Tiki-Taka') return -1;
    if (p === 'Direct Counter' && o === 'Gegenpressing') return 1;
    if (p === 'Direct Counter' && o === 'Park the Bus') return -1;
    if (p === 'Gegenpressing' && o === 'Tiki-Taka') return 1;
    if (p === 'Gegenpressing' && o === 'Direct Counter') return -1;
    return 0;
  };

  // Evaluates alignment between a chosen tactical direction and either the Club Philosophy or Head Coach Style
  const getSingleAlignmentOvr = (chosenStyle: string, refStyle?: string): number => {
    if (!refStyle) return 0;
    const c = normalizeTacticKey(chosenStyle);
    const r = normalizeTacticKey(refStyle);
    if (c === r) return 5; // Perfect match (+5 OVR)

    const isOppositePair =
      (c === 'Gegenpressing' && r === 'Park the Bus') ||
      (c === 'Park the Bus' && r === 'Gegenpressing') ||
      (c === 'Tiki-Taka' && r === 'Direct Counter') ||
      (c === 'Direct Counter' && r === 'Tiki-Taka');
    if (isOppositePair) return -7; // Direct tactical opposite (-7 OVR)

    const isSevereClash =
      (c === 'Tiki-Taka' && r === 'Park the Bus') ||
      (c === 'Park the Bus' && r === 'Tiki-Taka') ||
      (c === 'Total Football' && r === 'Park the Bus') ||
      (c === 'Park the Bus' && r === 'Total Football');
    if (isSevereClash) return -6; // High-line/possession vs deep low block (-6 OVR)

    if (c === 'Total Football' || r === 'Total Football') return -2;
    return -3.5; // Non-aligned philosophy mismatch
  };

  const getTacticalStyleOffset = (choice: string) => {
    const normalizedChoice = normalizeTacticKey(choice);
    const clubAlign = getSingleAlignmentOvr(normalizedChoice, gameState.tactic);
    const coachAlign = getSingleAlignmentOvr(normalizedChoice, gameState.currentCoach?.style);
    const synergyBonus =
      clubAlign > 0 && coachAlign > 0
        ? 2
        : clubAlign <= -6 && coachAlign <= -6
        ? -2
        : 0;
    const tieBreaker =
      normalizedChoice === 'Total Football'
        ? 0.8
        : normalizedChoice === 'Gegenpressing'
        ? 0.4
        : normalizedChoice === 'Tiki-Taka'
        ? -0.4
        : normalizedChoice === 'Direct Counter'
        ? -0.8
        : -1.2;
    return clubAlign + coachAlign + synergyBonus + tieBreaker;
  };

  const calcProb = (ovrMod: number) =>
    Math.round(Math.max(5, Math.min(95, 50 + ((playerOvr + coachCupBonusOvr + ovrMod - (opponent?.ovr || playerOvr)) * 2.5))));

  const getDynamicMods = (pOvr: number, oOvr: number, oName: string, oppTac: string) => {
    const diff = pOvr - oOvr;
    const seed = (oName.charCodeAt(0) + pOvr) % 4;

    const strengthsFit = getTacticalStyleOffset(gameState.tactic) + getTacticalAdvantage(gameState.tactic, oppTac) * 6;
    const pressFit = getTacticalStyleOffset('Gegenpressing') + getTacticalAdvantage('Gegenpressing', oppTac) * 6;
    const attackBaseTac = normalizeTacticKey(gameState.tactic) === 'Tiki-Taka' ? 'Tiki-Taka' : 'Total Football';
    const attackFit =
      Math.max(getTacticalStyleOffset('Tiki-Taka'), getTacticalStyleOffset('Total Football')) +
      getTacticalAdvantage(attackBaseTac, oppTac) * 6;
    const busFit = getTacticalStyleOffset('Park the Bus') + getTacticalAdvantage('Park the Bus', oppTac) * 6;

    let safeGood = Math.round(strengthsFit + (seed % 2));
    let pressGood = Math.round(pressFit + 4 + seed);
    let pressBad = Math.round(pressFit - 6 - seed);
    let attackGood = Math.round(attackFit + 1 + (seed % 3));
    let busBad = Math.round(busFit - 1 - (seed % 2));

    if (diff < -4) {
      pressGood += 3;
      pressBad += 1;
      attackGood += 2;
    }

    return { safeGood, pressGood, pressBad, attackGood, busBad };
  };

  const mods = opponent
    ? getDynamicMods(playerOvr + coachCupBonusOvr, opponent.ovr, opponent.name, opponent.tactic)
    : { safeGood: 2, pressGood: 10, pressBad: -8, attackGood: 5, busBad: -3 };

  const getNetProb = (probGood: number, goodMod: number, badMod: number) => {
    return Math.round((probGood * calcProb(goodMod)) + ((1 - probGood) * calcProb(badMod)));
  };
  const getBusProb = (busMod: number) => {
    const wP = calcProb(busMod) / 100;
    const drawW = 0.50;
    const win90 = Math.max(0, wP - (drawW / 2));
    const lose90 = Math.max(0, 1 - (wP + (drawW / 2)));
    const drawP = 1 - win90 - lose90;
    return Math.round((win90 + (drawP * 0.5)) * 100);
  };

  const rawSafe = calcProb(mods.safeGood);
  const rawPress = getNetProb(0.55, mods.pressGood, mods.pressBad);
  const rawAttack = calcProb(mods.attackGood);
  const rawBus = getBusProb(mods.busBad);

  const usedCupProbs = new Set<number>();
  const ensureDistinctCupProb = (val: number, fallbackDelta: number) => {
    let candidate = Math.max(5, Math.min(95, val));
    if (!usedCupProbs.has(candidate)) {
      usedCupProbs.add(candidate);
      return candidate;
    }
    const step = fallbackDelta >= 0 ? 1 : -1;
    for (let i = 1; i <= 12; i++) {
      const next = Math.max(5, Math.min(95, candidate + step * i));
      if (!usedCupProbs.has(next)) {
        usedCupProbs.add(next);
        return next;
      }
      const alt = Math.max(5, Math.min(95, candidate - step * i));
      if (!usedCupProbs.has(alt)) {
        usedCupProbs.add(alt);
        return alt;
      }
    }
    return candidate;
  };
  const netSafe = ensureDistinctCupProb(rawSafe, 2);
  const netPress = ensureDistinctCupProb(rawPress, -2);
  const netAttack = ensureDistinctCupProb(rawAttack, 3);
  const netBus = ensureDistinctCupProb(rawBus, -3);

  const getRpsColor = (choice: string) => {
    if (!opponent || !canSeeOdds) return 'text-zinc-500';
    const prob = getRpsWinProb(choice);
    if (prob >= 60) return 'text-emerald-400';
    if (prob <= 40) return 'text-rose-400';
    return 'text-sky-400';
  };

  const computeRawRpsWinProb = (choice: string) => {
    if (!opponent) return 50;
    let eff = playerOvr + coachCupBonusOvr + getTacticalStyleOffset(choice);
    const adv = getTacticalAdvantage(choice, opponent.tactic);
    if (adv === 1) eff += 8;
    if (adv === -1) eff -= 8;
    return Math.round(Math.max(5, Math.min(95, 50 + ((eff - opponent.ovr) * 2.5))));
  };

  const rpsProbMap = (() => {
    const usedRps = new Set<number>();
    const choices = ['Total Football', 'Gegenpressing', 'Tiki-Taka', 'Direct Counter', 'Catenaccio'];
    const map: Record<string, number> = {};
    choices.forEach((ch, idx) => {
      const raw = computeRawRpsWinProb(ch);
      let candidate = Math.max(5, Math.min(95, raw));
      if (!usedRps.has(candidate)) {
        usedRps.add(candidate);
        map[ch] = candidate;
        return;
      }
      const step = idx % 2 === 0 ? -1 : 1;
      for (let i = 1; i <= 12; i++) {
        const next = Math.max(5, Math.min(95, candidate + step * i));
        if (!usedRps.has(next)) {
          usedRps.add(next);
          map[ch] = next;
          return;
        }
        const alt = Math.max(5, Math.min(95, candidate - step * i));
        if (!usedRps.has(alt)) {
          usedRps.add(alt);
          map[ch] = alt;
          return;
        }
      }
      map[ch] = candidate;
    });
    return map;
  })();

  const getRpsWinProb = (choice: string) => rpsProbMap[choice] ?? computeRawRpsWinProb(choice);

  const handleTacticalDuelChoice = (choice: string) => {
    if (!opponent) return;
    setAppliedDirective(`Directive: ${choice}`);
    const styleOffset = getTacticalStyleOffset(choice);
    let myEffectiveOvr = playerOvr + coachCupBonusOvr + styleOffset;
    const adv = getTacticalAdvantage(choice, opponent.tactic);
    let specialDesc = '';

    if (adv === 1 && styleOffset >= 4) {
      myEffectiveOvr += 8;
      specialDesc = `Tactical Masterclass! Your squad & coach executed ${choice} to perfection and dismantled their ${opponent.tactic}!`;
    } else if (adv === 1 && styleOffset <= -5) {
      myEffectiveOvr += 8;
      specialDesc = `Your ${choice} countered their ${opponent.tactic}, but the squad & coach struggled with the unfamiliar tactical philosophy!`;
    } else if (adv === 1) {
      myEffectiveOvr += 8;
      specialDesc = `Tactical Masterclass! Your ${choice} completely dismantled their ${opponent.tactic}!`;
    } else if (adv === -1 && styleOffset <= -5) {
      myEffectiveOvr -= 8;
      specialDesc = `Total Tactical Collapse! Ordering ${choice} clashed with your club & coach philosophy and walked right into their ${opponent.tactic}!`;
    } else if (adv === -1) {
      myEffectiveOvr -= 8;
      specialDesc = `Tactical Disaster! Their ${opponent.tactic} countered your ${choice}!`;
    } else if (styleOffset <= -6) {
      specialDesc = `System Mismatch! Your squad & coach looked disjointed playing ${choice} against their ${opponent.tactic}.`;
    } else if (styleOffset >= 6) {
      specialDesc = `Fluid Identity! Your squad & coach were in complete harmony executing ${choice}.`;
    } else {
      specialDesc = `A gritty, evenly matched tactical battle.`;
    }
    
    const diff = myEffectiveOvr - opponent.ovr;
    const winProb = (getRpsWinProb(choice)) / 100;
    
    executeMatch(winProb, diff, specialDesc, false);
  };

  const handleTacticChoice = (choice: 'strengths' | 'bus' | 'attack' | 'high_press' | 'set_pieces' | 'mp_boost') => {
    if (!opponent) return;
    if (choice === 'mp_boost' && availableMp < 5) return;
    if (choice === 'mp_boost') {
      setSelectedCupChoice('mp_boost');
      setMpBoostCount(prev => prev + 1);
    }

    let myEffectiveOvr = playerOvr + coachCupBonusOvr;
    let flatWinProb: number | null = null;
    let specialDesc = '';

    if (choice === 'mp_boost') {
      myEffectiveOvr += 12;
      setAppliedDirective('Directive: Masterclass Plan (+12 OVR)');
      specialDesc = 'Masterclass tactic executed to perfection!';
    } else if (choice === 'strengths') {
      myEffectiveOvr += mods.safeGood;
      setAppliedDirective('Directive: Play to Strengths');
      flatWinProb = netSafe / 100;
    } else if (choice === 'bus') {
      myEffectiveOvr += mods.busBad;
      setAppliedDirective('Directive: Park the Bus');
      flatWinProb = netBus / 100;
    } else if (choice === 'attack') {
      myEffectiveOvr += mods.attackGood;
      setAppliedDirective('Directive: All Out Attack');
      flatWinProb = netAttack / 100;
    } else if (choice === 'high_press') {
      setAppliedDirective('Directive: Aggressive High Press');
      if (Math.random() < 0.55) {
        myEffectiveOvr += mods.pressGood;
        specialDesc = 'Opponent completely overwhelmed by intense pressing!';
      } else {
        myEffectiveOvr += mods.pressBad;
        specialDesc = 'Team gassed after relentless pressing and caught out.';
      }
      flatWinProb = netPress / 100;
    } else if (choice === 'set_pieces') {
      setAppliedDirective('Directive: Set-Piece Chaos');
      flatWinProb = 0.33;
    }

    const diff = myEffectiveOvr - opponent.ovr;
    const winProb = flatWinProb !== null ? flatWinProb : Math.max(5, Math.min(95, 50 + (diff * 2.5))) / 100;
    
    executeMatch(winProb, diff, specialDesc, choice === 'set_pieces');
  };

  const executeMatch = (winProb: number, diff: number, specialDesc: string, isSetPiece: boolean) => {
    if (!opponent) return;

    const roll = Math.random();
    let isWin = false;
    let finalScoreMe = 0;
    let finalScoreOpp = 0;
    let desc = '';
    let hasPenalties = false;
    let penScoreMe = 0;
    let penScoreOpp = 0;
    let scoreStr = '';

    const stadium = currentStadium || getStadiumInfo(opponent.name, round, isDe, cupRun.id, effectiveCountry, clubsDb);
    const magicText = round === 'final'
      ? `A magical cup final at ${stadium.name} in front of ${stadium.capacity.toLocaleString()} roaring supporters!`
      : `Electric cup tie at ${stadium.name} with ${stadium.capacity.toLocaleString()} fans in attendance.`;

    if (isSetPiece) {
      isWin = roll < winProb;
      if (isWin) {
        finalScoreOpp = Math.random() > 0.8 ? 1 : 0;
        finalScoreMe = Math.max(finalScoreOpp + 1, Math.random() > 0.8 ? 2 : 1);
        desc = finalScoreMe > 1 ? 'Late set-piece chaos secures the glory!' : '92nd minute towering header from a corner kick!';
      } else {
        finalScoreMe = Math.floor(Math.random() * 2); 
        finalScoreOpp = Math.max(finalScoreMe + 1, diff < -20 ? 3 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2));
        desc = 'Set-pieces neutralized. Left exposed on the counter.';
      }
    } else if (roll < winProb - 0.05) {
      isWin = true;
      const r = Math.random();
      const margin = Math.abs(diff);
      const isBlowoutEligible = margin > 15 || r > 0.88;

      // Ultra-Wide Spectrum Matrix for Wins (Over 25 winning scorelines)
      if (r < 0.20) {
        // 1. Gritty Defensive Grinds (20%): 1-0, 2-0
        const grittyWins = [[1, 0], [1, 0], [2, 0]];
        const pick = grittyWins[Math.floor(Math.random() * grittyWins.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Gritty defensive triumph!` : 'Masterclass in defensive discipline. Resolute low-block and a clinical finish secure the tie!';
      } else if (r < 0.52) {
        // 2. Balanced Clashes (32%): 2-1, 3-1, 3-0
        const balancedWins = [[2, 1], [2, 1], [3, 1], [3, 1], [3, 0]];
        const pick = balancedWins[Math.floor(Math.random() * balancedWins.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Solid cup victory!` : 'Tactical blueprint executed with composure and clinical finishing!';
      } else if (r < 0.74) {
        // 3. High-Scoring Entertainers (22%): 3-2, 4-2, 4-1
        const highScoringWins = [[3, 2], [3, 2], [4, 2], [4, 1]];
        const pick = highScoringWins[Math.floor(Math.random() * highScoringWins.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Electric end-to-end clash!` : 'Thrilling attacking football! Both sides trade punches before a sensational finish!';
      } else if (r < 0.88) {
        // 4. Wild Thrillers & Slugfests (14%): 4-3, 5-2, 5-3, 5-4
        const wildWins = [[4, 3], [5, 2], [5, 3], [5, 4]];
        const pick = wildWins[Math.floor(Math.random() * wildWins.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Unbelievable goal fest!` : 'What an instant classic! An unhinged, heart-stopping cup thriller ending in joyous ecstasy!';
      } else {
        // 5. Statement Blowouts & Routs (12%): 4-0, 5-0, 5-1, 6-0, 6-1, 6-2, 7-0, 7-1, 8-1
        const blowouts = isBlowoutEligible
          ? [[4, 0], [5, 0], [5, 1], [6, 0], [6, 1], [6, 2], [7, 0], [7, 1], [7, 2], [8, 1]]
          : [[4, 0], [5, 1], [5, 0], [6, 2]];
        const pick = blowouts[Math.floor(Math.random() * blowouts.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Total demolition!` : 'Absolute footballing masterclass! A breathtaking demolition that will live long in cup folklore!';
      }
    } else if (roll > winProb + 0.05) {
      isWin = false;
      const r = Math.random();
      const margin = Math.abs(diff);
      const isBlowoutEligible = margin > 15 || r > 0.88;

      // Ultra-Wide Spectrum Matrix for Losses (Over 25 losing scorelines)
      if (r < 0.20) {
        // 1. Gritty Defensive Grinds (20%): 0-1, 0-2
        const grittyLosses = [[0, 1], [0, 1], [0, 2]];
        const pick = grittyLosses[Math.floor(Math.random() * grittyLosses.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Agonizing 1-goal margin.` : 'Frustration in a tight tactical chess match. A solitary defensive lapse proved fatal.';
      } else if (r < 0.52) {
        // 2. Balanced Clashes (32%): 1-2, 1-3, 0-3
        const balancedLosses = [[1, 2], [1, 2], [1, 3], [1, 3], [0, 3]];
        const pick = balancedLosses[Math.floor(Math.random() * balancedLosses.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Bitter defeat.` : `${opponent.name} found the decisive breakthrough in a well-matched contest.`;
      } else if (r < 0.74) {
        // 3. High-Scoring Entertainers (22%): 2-3, 2-4, 1-4
        const highScoringLosses = [[2, 3], [2, 3], [2, 4], [1, 4]];
        const pick = highScoringLosses[Math.floor(Math.random() * highScoringLosses.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Fell short in open battle.` : 'High-octane cup duel. The squad threw everything forward but were caught out in transition.';
      } else if (r < 0.88) {
        // 4. Wild Thrillers & Slugfests (14%): 3-4, 2-5, 3-5, 4-5
        const wildLosses = [[3, 4], [2, 5], [3, 5], [4, 5]];
        const pick = wildLosses[Math.floor(Math.random() * wildLosses.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Heartbreak in a wild shootout!` : 'Heartbreak in an all-time cup classic. Left everything on the pitch in an unbelievable slugfest.';
      } else {
        // 5. Statement Blowouts (12%): 0-4, 0-5, 1-5, 0-6, 1-6, 2-6, 0-7, 1-7, 1-8
        const blowouts = isBlowoutEligible
          ? [[0, 4], [0, 5], [1, 5], [0, 6], [1, 6], [2, 6], [0, 7], [1, 7], [1, 8]]
          : [[0, 4], [1, 5], [0, 5], [2, 6]];
        const pick = blowouts[Math.floor(Math.random() * blowouts.length)];
        finalScoreMe = pick[0];
        finalScoreOpp = pick[1];
        desc = specialDesc ? `${specialDesc} Heavy cup defeat.` : 'A chastening, brutal cup exit. Completely dismantled by a ruthless opponent.';
      }
    } else {
      // Draw at full-time -> Extra Time and Penalty Shootout!
      isWin = Math.random() > 0.5;
      const draws = [0, 1, 1, 1, 2, 2, 2, 3, 3, 4];
      const baseGoals = draws[Math.floor(Math.random() * draws.length)];
      finalScoreMe = baseGoals;
      finalScoreOpp = baseGoals;
      hasPenalties = true;

      // 30% chance for Sudden-Death Marathon Shootout (6-5, 7-6, 8-7, 9-8, 10-9, 11-10!)
      const isMarathonShootout = Math.random() < 0.30;
      if (isMarathonShootout) {
        const suddenDeathRounds = [6, 7, 8, 9, 10, 11];
        const winKicks = suddenDeathRounds[Math.floor(Math.random() * suddenDeathRounds.length)];
        penScoreMe = isWin ? winKicks : winKicks - 1;
        penScoreOpp = isWin ? winKicks - 1 : winKicks;

        const marathonWinCommentary = [
          `Nerve-shredding sudden-death shootout marathon! After ${penScoreMe + penScoreOpp} penalties, your goalkeeper makes the historic match-winning save (${penScoreMe}-${penScoreOpp} on pens)!`,
          `Unbelievable drama from 12 yards! Deep into sudden death, the stadium explodes as your penalty ripples the net (${penScoreMe}-${penScoreOpp})!`,
          `Pure nerves of steel! An unforgettable ${penScoreMe + penScoreOpp}-penalty duel settled by a diving stop at full stretch (${penScoreMe}-${penScoreOpp} pens)!`
        ];
        const marathonLossCommentary = [
          `Cruel marathon sudden-death shootout exit! After ${penScoreMe + penScoreOpp} exhausting spot-kicks, the decisive kick was tipped wide (${penScoreMe}-${penScoreOpp} on penalties).`,
          `Agony in sudden death from 12 yards. After ${penScoreMe + penScoreOpp} penalties, the opponent keeper produces a fingertip miracle (${penScoreMe}-${penScoreOpp}).`,
          `Heartbreak after a legendary shootout duel! Both sides pushed past the 11th round before the dream ended (${penScoreMe}-${penScoreOpp} on pens).`
        ];
        desc = specialDesc ? `${specialDesc}\n${isWin ? marathonWinCommentary[Math.floor(Math.random()*marathonWinCommentary.length)] : marathonLossCommentary[Math.floor(Math.random()*marathonLossCommentary.length)]}` : (isWin ? marathonWinCommentary[Math.floor(Math.random()*marathonWinCommentary.length)] : marathonLossCommentary[Math.floor(Math.random()*marathonLossCommentary.length)]);
      } else {
        // Standard 5-Round Shootout (4-2, 4-3, 5-3, 5-4)
        penScoreMe = isWin ? (4 + Math.floor(Math.random() * 2)) : (2 + Math.floor(Math.random() * 2));
        penScoreOpp = isWin ? (penScoreMe - 1 - Math.floor(Math.random() * 2)) : (penScoreMe + 1 + Math.floor(Math.random() * 2));
        if (penScoreOpp < 0) penScoreOpp = 1;
        if (penScoreMe === penScoreOpp) {
          if (isWin) penScoreMe++; else penScoreOpp++;
        }

        const winPens = [
          `Nerve-shredding penalty shootout! Your goalkeeper produces a heroic save (${penScoreMe}-${penScoreOpp} on pens)!`,
          `Dramatic shootout triumph as the stadium erupts (${penScoreMe}-${penScoreOpp} on penalties)!`,
          `Ice in their veins! Your players execute penalties under immense pressure (${penScoreMe}-${penScoreOpp})!`
        ];
        const lossPens = [
          `Agony from 12 yards. The decisive penalty clatters the woodwork (${penScoreMe}-${penScoreOpp} on penalties).`,
          `Cruel penalty shootout exit after 120 grueling minutes (${penScoreMe}-${penScoreOpp}).`,
          `Heartbreak from the spot. The goalkeeper guessed right (${penScoreMe}-${penScoreOpp}).`
        ];
        desc = specialDesc ? `${specialDesc}\n${isWin ? winPens[Math.floor(Math.random()*winPens.length)] : lossPens[Math.floor(Math.random()*lossPens.length)]}` : (isWin ? winPens[Math.floor(Math.random()*winPens.length)] : lossPens[Math.floor(Math.random()*lossPens.length)]);
      }
    }

    if (hasPenalties) {
      scoreStr = `${finalScoreMe}-${finalScoreOpp} AET (${penScoreMe}-${penScoreOpp} pens)`;
    } else {
      scoreStr = `${finalScoreMe}-${finalScoreOpp}`;
    }

    // Timeline Generation
    const eventTimeline: { min: number, isMe: boolean, text: string }[] = [];
    const isComeback = isWin && finalScoreOpp > 0 && !hasPenalties && Math.random() > 0.5;
    const oppComeback = !isWin && finalScoreMe > 0 && !hasPenalties && Math.random() > 0.5;

    if (isComeback && finalScoreOpp >= 2) {
      desc = `Incredible comeback! Trailing ${finalScoreOpp}-0 early, the squad mounts a heroic fightback to win ${finalScoreMe}-${finalScoreOpp}!`;
    } else if (isComeback) {
      desc = `A dramatic late comeback seals the ${finalScoreMe}-${finalScoreOpp} victory!`;
    } else if (oppComeback && finalScoreMe >= 2) {
      desc = `Total collapse! The team squanders a ${finalScoreMe}-0 lead and bows out ${finalScoreMe}-${finalScoreOpp}.`;
    }

    const usedMins = new Set<number>();
    const getUniqueMin = (start: number, end: number) => {
      let m = Math.floor(Math.random() * (end - start + 1)) + start;
      let tries = 0;
      while (usedMins.has(m) && tries < 30) {
        m = Math.floor(Math.random() * (end - start + 1)) + start;
        tries++;
      }
      usedMins.add(m);
      return m;
    };

    for (let i = 0; i < finalScoreMe; i++) {
      let min = getUniqueMin(1, hasPenalties ? 118 : 89);
      if (isComeback) min = getUniqueMin(58, 90);
      else if (oppComeback) min = getUniqueMin(5, 45);
      eventTimeline.push({ min, isMe: true, text: `GOAL! ${club.name} finds the net!` });
    }
    for (let i = 0; i < finalScoreOpp; i++) {
      let min = getUniqueMin(1, hasPenalties ? 118 : 89);
      if (isComeback) min = getUniqueMin(5, 45);
      else if (oppComeback) min = getUniqueMin(58, 90);
      eventTimeline.push({ min, isMe: false, text: `GOAL! ${opponent.name} scores.` });
    }
    
    eventTimeline.sort((a, b) => a.min - b.min);

    if (opponent.isDerby) {
      setRivalStats(prev => ({
        w: prev.w + (isWin && !hasPenalties ? 1 : 0),
        l: prev.l + (!isWin && !hasPenalties ? 1 : 0),
        d: prev.d + (hasPenalties ? 1 : 0)
      }));
    }

    // Begin match unfolding
    setStage('match');
    setMatchMinute(0);
    setLiveScore({ me: 0, opp: 0 });
    setIsShootout(false);
    setRegularScore(null);
    setRecentEvent('Kickoff whistle blown. Game underway!');

    let currentMin = 0;
    let currentMe = 0;
    let currentOpp = 0;

    clearAllTimers();
    intervalRef.current = setInterval(() => {
      currentMin += 1;
      setMatchMinute(currentMin);

      const eventsThisMin = eventTimeline.filter(e => e.min === currentMin);
      if (eventsThisMin.length > 0) {
        eventsThisMin.forEach(e => {
          if (e.isMe) currentMe++;
          else currentOpp++;
          setRecentEvent(`${e.min}' - ${e.text}`);
        });
        setLiveScore({ me: currentMe, opp: currentOpp });
        if (navigator.vibrate) navigator.vibrate(20);
      }

      if (currentMin >= 90) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        
        if (hasPenalties) {
          setMatchMinute(120);
          setIsShootout(true);
          setRegularScore({ me: finalScoreMe, opp: finalScoreOpp });
          setLiveScore({ me: 0, opp: 0 });
          setRecentEvent('Full Time (AET). Penalty shootout commences!');
          
          let pMe = 0;
          let pOpp = 0;
          let turn = 0;
          
          penIntervalRef.current = setInterval(() => {
            if (pMe < penScoreMe || pOpp < penScoreOpp) {
              if (turn % 2 === 0) {
                if (pMe < penScoreMe) {
                  pMe++;
                  setRecentEvent(`Spot kick converted for ${club.name}!`);
                } else {
                  setRecentEvent(`${club.name} misses from the spot!`);
                }
              } else {
                if (pOpp < penScoreOpp) {
                  pOpp++;
                  setRecentEvent(`Spot kick converted for ${opponent.name}!`);
                } else {
                  setRecentEvent(`${opponent.name} misses from the spot!`);
                }
              }
              turn++;
              
              setLiveScore({ me: pMe, opp: pOpp });
              if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
            } else {
              if (penIntervalRef.current) clearInterval(penIntervalRef.current);
              penIntervalRef.current = null;
              if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
              timeoutRef.current = setTimeout(() => {
                setMatchResult({ won: isWin, score: scoreStr, description: magicText + '\n' + desc });
                setStage('result');
              }, 700);
            }
          }, 320);

        } else {
          if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
          timeoutRef.current = setTimeout(() => {
            setMatchResult({ won: isWin, score: scoreStr, description: magicText + '\n' + desc });
            setStage('result');
          }, 700);
        }
      }
    }, 40);
  };

  const handleNext = () => {
    if (stage === 'result' && matchResult) {
      if (matchResult.won) {
        if (round === 'quarter') {
          if (cupRun.endRound === 'quarter') {
            handleComplete({ won: true, exitRound: 'quarter', choice: selectedCupChoice });
            return;
          }
          setRound('semi');
          generateOpponent('semi');
          setStage('tactics');
        } else if (round === 'semi') {
          if (cupRun.endRound === 'semi') {
            handleComplete({ won: true, exitRound: 'semi', choice: selectedCupChoice });
            return;
          }
          setRound('final');
          generateOpponent('final');
          setStage('tactics');
        } else {
          setStage('celebration');
        }
      } else {
        setStage('eliminated');
      }
    } else if (stage === 'celebration') {
      handleComplete({ won: true, exitRound: 'final', choice: selectedCupChoice });
    } else if (stage === 'eliminated') {
      handleComplete({ 
        won: false, 
        exitRound: round, 
        choice: selectedCupChoice,
        winnerId: round === 'final' && opponent ? opponent.id : undefined,
        winnerName: round === 'final' && opponent ? opponent.name : undefined
      });
    }
  };

  const stadium = currentStadium || (opponent ? getStadiumInfo(opponent.name, round, isDe, cupRun.id, effectiveCountry, clubsDb) : { name: 'Stadium', capacity: 45000 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center p-2.5 sm:p-4 pt-3.5 sm:pt-4 pb-6 backdrop-blur-2xl bg-black/75 overflow-y-auto overscroll-contain"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-[#12141c]/90 backdrop-blur-2xl rounded-[20px] sm:rounded-[32px] border border-white/[0.08] p-3.5 sm:p-7 my-auto shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative overflow-hidden text-left shrink-0"
      >
        {/* Subtle Ambient Prestige Accent Glow */}
        <div 
          className="absolute -top-28 -right-28 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: theme.accentHex }}
        />

        {/* ========================================================================= */}
        {/* STAGE 1: TACTICAL RECOMMENDATIONS FOR HEAD COACH                          */}
        {/* ========================================================================= */}
        {stage === 'tactics' && opponent && (
          <div className="flex flex-col gap-3.5 sm:gap-5 relative z-10 animate-in fade-in duration-300">
            {/* Header: Trophy Presentation & Tournament Title */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-b border-white/[0.06] pb-3 sm:pb-4">
              <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
                {/* Prestige Trophy Sized by Prestige Level */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <PrestigeTrophy
                    type={cupRun.id}
                    size={responsiveTrophyHeight}
                    className="drop-shadow-lg max-h-16 sm:max-h-none w-auto"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.tagPillBg}`}>
                      {theme.badgeLabel.en}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300 bg-sky-500/10 border border-sky-400/20 px-2.5 py-0.5 rounded-full">
                      {round === 'quarter' ? 'Quarter-Final' : round === 'semi' ? 'Semi-Final' : 'Grand Final'}
                    </span>
                    <BroadcastBadge country={effectiveCountry} competitionId={broadcastComp} isModActive={isModActive} tier={gameState.club.tier} />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                    {displayNameEn}
                  </h2>
                  <p className="text-xs text-zinc-400 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5 sm:mt-1 font-normal">
                    <i className="fa-solid fa-location-dot text-zinc-500 text-[10px]" />
                    <span>{stadium.name}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="tabular-nums text-zinc-300">{stadium.capacity.toLocaleString()}</span> capacity
                  </p>
                </div>
              </div>

              {/* Head Coach Pill */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl px-3.5 py-2 text-right shrink-0 hidden sm:block">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Head Coach</div>
                <div className="text-xs font-bold text-white truncate max-w-[140px] mt-0.5">
                  {gameState.currentCoach?.name || 'Head Coach'}
                </div>
                <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                  {gameState.currentCoach?.role || 'Staff Lead'}
                </div>
              </div>
            </div>

            {/* Arch Rival Derby Alert */}
            {opponent.isDerby && (
              <div className="w-full text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 font-semibold text-xs uppercase tracking-wider shadow-sm">
                  <i className="fas fa-fire text-rose-400 text-xs" />
                  <span>Arch Rival · Fierce Cup Derby</span>
                  <i className="fas fa-fire text-rose-400 text-xs" />
                </div>
              </div>
            )}

            {/* Matchup Card with Broadcast Presentation Header */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-3 sm:p-5 shadow-sm space-y-2 sm:space-y-3">
              {isModActive && (
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-1.5 sm:pb-2 text-[10px]">
                  <span className="text-zinc-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                    <i className="fa-solid fa-satellite-dish text-sky-400 text-xs" />
                    <span>Official Matchday Broadcast</span>
                  </span>
                  <BroadcastBadge country={effectiveCountry} competitionId={broadcastComp} isModActive={isModActive} tier={gameState.club.tier} />
                </div>
              )}
              <div className="grid grid-cols-7 items-center">
              {/* User Team */}
              <div className="col-span-3 flex flex-col items-center text-center">
                <ClubLogo
                  name={club.name}
                  id={club.id}
                  color={club.color}
                  logo={club.logo}
                  fallbackLogo={club.fallbackLogo}
                  isModActive={isModActive}
                  className="w-11 h-11 sm:w-16 sm:h-16 object-contain mb-1 drop-shadow-sm"
                  fallbackClassName="w-11 h-11 sm:w-16 sm:h-16 text-xs sm:text-sm rounded-full flex items-center justify-center font-bold text-white shrink-0 mb-1"
                />
                <div className="text-lg sm:text-2xl font-bold text-emerald-400 tabular-nums">{playerOvr}</div>
                {hasTacticalGeniusPerk && (
                  <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25 tracking-wider mt-0.5">
                    +2 GENIUS
                  </span>
                )}
                <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px] sm:max-w-[130px] mt-0.5 py-0.5 leading-normal">{club.name}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">{gameState.tactic}</div>
              </div>

              {/* VS Centerpiece */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">VS</span>
                <span className="text-[9px] tabular-nums text-zinc-600 mt-1">90' K.O.</span>
              </div>

              {/* Opponent Team */}
              <div className="col-span-3 flex flex-col items-center text-center">
                <ClubLogo
                  name={opponent.name}
                  id={opponent.id}
                  color={opponent.color}
                  logo={opponent.logo}
                  fallbackLogo={opponent.fallbackLogo}
                  isModActive={isModActive}
                  className="w-11 h-11 sm:w-16 sm:h-16 object-contain mb-1 drop-shadow-sm"
                  fallbackClassName="w-11 h-11 sm:w-16 sm:h-16 text-xs sm:text-sm rounded-full flex items-center justify-center font-bold text-white shrink-0 mb-1"
                />
                <div className="text-lg sm:text-2xl font-bold text-rose-400 tabular-nums">{opponent.ovr}</div>
                <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px] sm:max-w-[130px] mt-0.5 py-0.5 leading-normal">{opponent.name}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">
                  {canSeeOdds ? opponent.tactic : '???'}
                </div>
              </div>
            </div>
          </div>

            {/* Tactical Directives / Recommendations Panel */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-clipboard-list text-sky-400 text-xs" />
                  <span>Director Recommendation to Head Coach</span>
                </span>
                <span className="text-zinc-500 text-[11px] font-medium">
                  {isTacticalDuel ? 'Counter System' : 'Gameplan Approach'}
                </span>
              </div>

              {/* Scout Insight & Identity Alignment Bar */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2 text-xs flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <i className="fa-solid fa-compass text-sky-400 text-[11px]" />
                    <span>Club Philosophy: <strong className="text-white font-semibold">{gameState.tactic || 'Total Football'}</strong></span>
                    <span className="text-zinc-600">·</span>
                    <span>Coach: <strong className="text-sky-300 font-semibold">{gameState.currentCoach?.style || 'Balanced'}</strong></span>
                  </span>
                  {hasTacticalGeniusPerk ? (
                    <span className="font-semibold text-white text-[11px] sm:text-xs">
                      <i className="fa-solid fa-chess-knight text-amber-400 text-[10px] mr-1" />
                      Tactical Genius: Opponent plays <strong className="text-amber-300 font-semibold">{opponent.tactic}</strong>
                    </span>
                  ) : coachUnderstandsOpponent ? (
                    <span className="font-semibold text-sky-200 text-[11px] sm:text-xs">
                      <i className="fa-solid fa-chess text-sky-400 text-[10px] mr-1" />
                      Tactical Master Coach decoded <strong className="text-amber-300 font-semibold">{opponent.tactic}</strong>
                    </span>
                  ) : isTacticalMasterCoach ? (
                    <span className="text-zinc-500 italic text-[10px] sm:text-[11px]">
                      <i className="fa-solid fa-lock text-[10px] mr-1" />
                      Coach couldn't decode {opponent.name} · Activate 'Tactical Genius' perk for all odds
                    </span>
                  ) : (
                    <span className="text-zinc-500 italic text-[10px] sm:text-[11px]">
                      <i className="fa-solid fa-lock text-[10px] mr-1" />
                      Activate 'Tactical Genius' manager perk to reveal opponent system &amp; odds
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Tactical Recommendation Buttons */}
              <div className="space-y-1.5 sm:space-y-2">
                {isTacticalDuel ? (
                  <>
                    <button
                      onClick={() => handleTacticalDuelChoice('Gegenpressing')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors">
                          ⚡ Gegenpressing
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Beats Tiki-Taka · Vulnerable to Direct Counter</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Gegenpressing')}`}>
                        {canSeeOdds ? `${getRpsWinProb('Gegenpressing')}% Win Prob` : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticalDuelChoice('Direct Counter')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors">
                          🎯 Direct Counter
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Beats Gegenpress · Vulnerable to Catenaccio</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Direct Counter')}`}>
                        {canSeeOdds ? `${getRpsWinProb('Direct Counter')}% Win Prob` : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticalDuelChoice('Catenaccio')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors">
                          🛡️ Catenaccio (Park the Bus)
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Beats Direct Counter · Vulnerable to Tiki-Taka</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Catenaccio')}`}>
                        {canSeeOdds ? `${getRpsWinProb('Catenaccio')}% Win Prob` : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticalDuelChoice('Tiki-Taka')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors">
                          🧠 Tiki-Taka
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Beats Catenaccio · Vulnerable to Gegenpress</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Tiki-Taka')}`}>
                        {canSeeOdds ? `${getRpsWinProb('Tiki-Taka')}% Win Prob` : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticalDuelChoice('Total Football')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs group-hover:text-sky-300 transition-colors">
                          ⚖️ Total Football
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Fluid positional play · Dependent on philosophy &amp; coach</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${getRpsColor('Total Football')}`}>
                        {canSeeOdds ? `${getRpsWinProb('Total Football')}% Win Prob` : '???% Odds'}
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleTacticChoice('strengths')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs">Play to Squad Strengths ({gameState.tactic || 'Club Identity'})</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Execute your established club philosophy &amp; coach alignment</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${canSeeOdds ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {canSeeOdds ? `${netSafe}% Win Prob` : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticChoice('high_press')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs">High Press Gamble (Gegenpressing Direction)</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Relentless high line · Thrives on Pressing identity, clashes with Low Block</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${canSeeOdds ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {canSeeOdds ? `${netPress}% Win Prob` : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticChoice('attack')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs">All Out Attack (Possession / Total Football)</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Maximum offensive overload · Favors attacking &amp; possession setups</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${canSeeOdds ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {canSeeOdds ? `${netAttack}% Win Prob` : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticChoice('bus')}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs">Park the Bus (Catenaccio Low Block)</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Ultra-defensive posture · Severe penalty if club/coach play High Press</div>
                      </div>
                      <div className={`text-xs tabular-nums font-semibold px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 ${canSeeOdds ? 'text-sky-400' : 'text-zinc-500'}`}>
                        {canSeeOdds ? `${netBus}% Win Prob` : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticChoice('set_pieces')}
                      className="w-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-semibold text-emerald-300 text-xs">Set-Piece Focus (Underdog Strategy)</div>
                        <div className="text-[11px] text-emerald-200/70 mt-0.5">Pin all hope on corners and free-kicks</div>
                      </div>
                      <div className="text-xs tabular-nums font-semibold text-emerald-300 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                        {canSeeOdds ? '33% Fixed Prob' : '???% Odds'}
                      </div>
                    </button>

                    <button
                      onClick={() => handleTacticChoice('mp_boost')}
                      disabled={availableMp < 5}
                      className={`w-full ${availableMp >= 5 ? 'bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 cursor-pointer' : 'bg-white/[0.02] border border-white/[0.05] opacity-40 cursor-not-allowed'} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all flex items-center justify-between gap-3 active:scale-[0.99]`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-amber-300 text-xs flex items-center gap-1.5">
                          <span className="truncate">Masterclass Directive</span>
                          <span className="text-[11px] font-bold bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/40 tabular-nums whitespace-nowrap shrink-0 inline-flex items-center leading-normal">-5 MP</span>
                        </div>
                        <div className="text-[11px] text-amber-200/70 mt-0.5">+12 OVR tactical blueprint boost</div>
                      </div>
                      <div className="text-xs tabular-nums font-semibold text-amber-300 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 whitespace-nowrap shrink-0">
                        {canSeeOdds ? `${calcProb(12)}% Win Prob` : '???% Odds'}
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: THE GAME UNFOLDS (BROADCAST SCOREBOARD SIMULATION)               */}
        {/* ========================================================================= */}
        {stage === 'match' && opponent && (
          <div className="flex flex-col items-center justify-center min-h-[360px] animate-in fade-in duration-300 py-2 relative z-10">
            {/* Broadcast Scoreboard Header */}
            <div className="w-full max-w-md rounded-[24px] border border-white/[0.08] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#12141c]/95 backdrop-blur-2xl">
              {/* Competition Banner */}
              <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02] gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <i className={`fas ${theme.iconClass} text-xs ${theme.bannerAccentText} shrink-0`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white truncate">
                    {cupRun.nameEn}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 tabular-nums">
                    <span className="text-sky-300 font-semibold">{round === 'quarter' ? 'QF' : round === 'semi' ? 'SF' : 'FINAL'}</span>
                    <span className="text-zinc-600 hidden sm:inline">·</span>
                    <span className="truncate max-w-[120px] hidden sm:inline">{stadium.name}</span>
                  </div>
                  <BroadcastBadge country={effectiveCountry} competitionId={broadcastComp} isModActive={isModActive} tier={gameState.club.tier} />
                </div>
              </div>

              {/* Ticking Clock & Directive Bar */}
              <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-2xl font-bold tabular-nums tracking-wider text-white">
                    {matchMinute}'
                  </span>
                  {isShootout && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      PENS
                    </span>
                  )}
                </div>
                {appliedDirective && (
                  <div className="text-[10px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full truncate max-w-[190px]">
                    {appliedDirective}
                  </div>
                )}
              </div>

              {/* Scoreboard Teams & Live Score */}
              <div className="flex items-center justify-between p-3.5 sm:p-6 gap-2 sm:gap-4">
                {/* Home (Player) */}
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <ClubLogo
                    name={club.name}
                    id={club.id}
                    color={club.color}
                    logo={club.logo}
                    fallbackLogo={club.fallbackLogo}
                    isModActive={isModActive}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-1.5 sm:mb-2 drop-shadow-sm"
                    fallbackClassName="w-12 h-12 sm:w-16 sm:h-16 text-sm sm:text-base rounded-full flex items-center justify-center font-bold text-white shrink-0 mb-1.5 sm:mb-2"
                  />
                  <div className="text-xs font-bold text-white truncate max-w-[95px] sm:max-w-[130px] py-0.5 leading-normal">{club.name}</div>
                  <div className="text-[10px] text-zinc-400 tabular-nums mt-0.5">OVR {playerOvr}</div>
                </div>

                {/* Score */}
                <div className="shrink-0 px-1 sm:px-3 flex flex-col items-center justify-center min-w-[80px] sm:min-w-[110px]">
                  <div className="bg-black/50 border border-white/10 rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center gap-1 sm:gap-2 shadow-inner">
                    <span className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight min-w-[16px] sm:min-w-[22px] text-center ${theme.scoreboardScoreColor}`}>
                      {isShootout && regularScore ? regularScore.me : liveScore.me}
                    </span>
                    <span className="text-zinc-400 font-bold text-sm sm:text-lg select-none px-0.5 leading-none">–</span>
                    <span className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight min-w-[16px] sm:min-w-[22px] text-center ${theme.scoreboardScoreColor}`}>
                      {isShootout && regularScore ? regularScore.opp : liveScore.opp}
                    </span>
                  </div>
                  {isShootout && (
                    <div className="text-[10px] font-semibold tabular-nums text-zinc-400 mt-1 whitespace-nowrap bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                      Shootout ({liveScore.me}-{liveScore.opp})
                    </div>
                  )}
                </div>

                {/* Away (Opponent) */}
                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                  <ClubLogo
                    name={opponent.name}
                    id={opponent.id}
                    color={opponent.color}
                    logo={opponent.logo}
                    fallbackLogo={opponent.fallbackLogo}
                    isModActive={isModActive}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-1.5 sm:mb-2 drop-shadow-sm"
                    fallbackClassName="w-12 h-12 sm:w-16 sm:h-16 text-sm sm:text-base rounded-full flex items-center justify-center font-bold text-white shrink-0 mb-1.5 sm:mb-2"
                  />
                  <div className="text-xs font-bold text-white truncate max-w-[95px] sm:max-w-[130px] py-0.5 leading-normal">{opponent.name}</div>
                  <div className="text-[10px] text-zinc-400 tabular-nums mt-0.5">OVR {opponent.ovr}</div>
                </div>
              </div>

              {/* Live Match Ticker / Event */}
              {recentEvent && (
                <div className="bg-white/[0.02] border-t border-white/[0.06] px-4 py-2.5 text-center text-xs font-medium text-zinc-300">
                  <i className="fa-regular fa-futbol text-sky-400 mr-1.5" />
                  {recentEvent}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: RESULT SUMMARY                                                   */}
        {/* ========================================================================= */}
        {stage === 'result' && matchResult && opponent && (
          <div className="flex flex-col items-center justify-center min-h-[360px] text-center animate-in zoom-in duration-300 py-4 relative z-10">
            <div className="mb-3">
              <span className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl text-xl shadow-inner ${matchResult.won ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'}`}>
                {matchResult.won ? '✓' : '✕'}
              </span>
            </div>

            {isModActive && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <BroadcastBadge country={effectiveCountry} competitionId={broadcastComp} isModActive={isModActive} tier={gameState.club.tier} />
                <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md">
                  Full-Time
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3">
              <ClubLogo
                name={club.name}
                id={club.id}
                color={club.color}
                logo={club.logo}
                fallbackLogo={club.fallbackLogo}
                isModActive={isModActive}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow"
                fallbackClassName="w-12 h-12 sm:w-14 sm:h-14 text-sm rounded-full flex items-center justify-center font-bold text-white shrink-0"
              />
              <div className="flex flex-col items-center justify-center shrink-0 px-1">
                <div className="bg-black/50 border border-white/10 rounded-2xl px-4 sm:px-5 py-1.5 sm:py-2 text-2xl sm:text-3xl font-black tabular-nums text-white tracking-wider whitespace-nowrap shadow-inner">
                  {matchResult.score.includes(' ') ? matchResult.score.split(' ')[0].replace('-', ' – ') : matchResult.score.replace('-', ' – ')}
                </div>
                {matchResult.score.includes(' ') && (
                  <span className="text-[11px] font-semibold text-zinc-400 mt-1 whitespace-nowrap bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                    {matchResult.score.substring(matchResult.score.indexOf(' ') + 1)}
                  </span>
                )}
              </div>
              <ClubLogo
                name={opponent.name}
                id={opponent.id}
                color={opponent.color}
                logo={opponent.logo}
                fallbackLogo={opponent.fallbackLogo}
                isModActive={isModActive}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow"
                fallbackClassName="w-12 h-12 sm:w-14 sm:h-14 text-sm rounded-full flex items-center justify-center font-bold text-white shrink-0"
              />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              {matchResult.won 
                ? (round === 'quarter' && cupRun.endRound === 'quarter'
                    ? (isDe ? `${club.name} bucht das Halbfinal-Ticket!` : `${club.name} Books Semi-Final Ticket!`)
                    : (isDe ? `${club.name} triumphiert!` : `${club.name} Prevails!`))
                : (isDe ? `${opponent.name} gewinnt` : `${opponent.name} Takes Victory`)}
            </h3>

            {matchResult.won && round === 'quarter' && cupRun.endRound === 'quarter' && (
              <div className="bg-sky-500/15 border border-sky-400/30 rounded-xl px-4 py-2 text-xs text-sky-200 mb-4 flex items-center justify-center gap-2">
                <i className="fa-solid fa-snowflake text-sky-300"></i>
                <span>{isDe ? 'Viertelfinale gewonnen! Das Halbfinale wird nach der zweiten Saisonhälfte ausgetragen.' : 'Quarter-Final won! The Semi-Final will be played after the second part of the season.'}</span>
              </div>
            )}

            <p className={`text-xs sm:text-sm max-w-md whitespace-pre-line mb-3 sm:mb-5 font-normal leading-relaxed ${matchResult.won ? 'text-zinc-300' : 'text-zinc-400'}`}>
              {matchResult.description}
            </p>

            <button
              onClick={handleNext}
              className={`px-8 py-3 sm:py-3.5 rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0 active:scale-[0.98] ${theme.primaryBtnClass}`}
            >
              {matchResult.won
                ? (round === 'quarter'
                    ? (cupRun.endRound === 'quarter'
                        ? (isDe ? 'Ins Halbfinale eingezogen · Zur Winterpause' : 'Advance to Semi-Finals · To Winter Break')
                        : (isDe ? 'Nächste Runde · Einzug ins Halbfinale' : 'Next Round · Advance to Semi-Final'))
                    : round === 'semi'
                    ? (isDe ? 'Einzug ins große Finale' : 'Advance to Grand Final')
                    : (isDe ? 'Trophäe in die Höhe stemmen' : 'Lift the Trophy'))
                : (isDe ? 'Weiter' : 'Continue')}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: CELEBRATION (CHAMPIONSHIP / TROPHY PRESENTATION)                  */}
        {/* ========================================================================= */}
        {stage === 'celebration' && (
          <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[380px] text-center animate-in zoom-in duration-400 py-2 sm:py-4 relative z-10">
            {/* Grand Prestige Trophy Centerpiece */}
            <div className="mb-3 sm:mb-4 relative">
              <PrestigeTrophy
                type={cupRun.id}
                size={responsiveCelebrationTrophyHeight}
                className="animate-pulse drop-shadow-2xl max-h-24 sm:max-h-none w-auto"
              />
            </div>

            {isModActive && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <BroadcastBadge country={effectiveCountry} competitionId={broadcastComp} isModActive={isModActive} tier={gameState.club.tier} />
                <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase bg-amber-500/10 border border-amber-400/20 px-2.5 py-0.5 rounded-md">
                  Live Trophy Presentation
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-300 mb-1">
              <span>★</span>
              <span>{displayNameEn} Champions</span>
              <span>★</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tight mb-2">
              CUP GLORY!
            </h2>

            <p className="text-sm text-zinc-300 max-w-sm mb-5 font-normal leading-relaxed">
              A historic achievement! {club.name} hoists the prestigious {cupRun.nameEn} trophy into the sky!
            </p>

            {cupRun.id === 'reg' && round === 'final' && (
              <div className="bg-emerald-500/15 text-emerald-300 font-semibold text-xs px-4 py-2 rounded-2xl mb-6 inline-flex items-center gap-2 border border-emerald-500/25">
                <i className="fas fa-ticket-alt text-emerald-400 text-xs" />
                <span>Qualified for Domestic National Cup next season!</span>
              </div>
            )}

            <button
              onClick={handleNext}
              className={`px-10 py-3.5 rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-sm ${theme.primaryBtnClass}`}
            >
              Complete Season
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 5: ELIMINATED                                                       */}
        {/* ========================================================================= */}
        {stage === 'eliminated' && (
          <div className="flex flex-col items-center justify-center min-h-[340px] text-center animate-in zoom-in duration-300 py-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 text-xl mb-4">
              <i className="fas fa-flag-checkered text-zinc-500" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-200 uppercase tracking-tight mb-2">
              Valiant Cup Run Concluded
            </h2>

            <p className="text-sm text-zinc-400 max-w-sm mb-6 font-normal leading-relaxed">
              Your journey in the {cupRun.nameEn} ends at the {round === 'quarter' ? 'Quarter-Final' : round === 'semi' ? 'Semi-Final' : 'Final'} stage. Your supporters will remember the fight.
            </p>

            <button
              onClick={handleNext}
              className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white px-8 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Complete Season
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
