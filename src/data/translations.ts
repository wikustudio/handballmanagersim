import { Language } from '../types';

export const LANGUAGE_LABELS: Record<Language, { label: string; flag: string }> = {
  en: { label: 'EN', flag: '🇬🇧' },
  de: { label: 'EN', flag: '🇬🇧' },
  es: { label: 'ES', flag: '🇪🇸' }
};

const GERMAN_TO_ENGLISH_MAP: Record<string, string> = {
  'stufe': 'Tier',
  'stufen': 'Tiers',
  'ligastufe': 'League Tier',
  'ausbaustufe': 'Facility Level',
  'aufstieg': 'Promotion',
  'aufstieg!': 'Promotion!',
  'abstieg': 'Relegation',
  'abstieg!': 'Relegated!',
  'spieltag': 'Matchday',
  'spieltage': 'Matchdays',
  'kader': 'Squad',
  'kaderstärke': 'Squad Rating',
  'verein': 'Club',
  'vereine': 'Clubs',
  'trainer': 'Head Coach',
  'meister': 'Champions',
  'meisterschaft': 'Championship',
  'pokalsieger': 'Cup Winners',
  'sieg': 'Win',
  'siege': 'Wins',
  'niederlage': 'Loss',
  'niederlagen': 'Losses',
  'unentschieden': 'Draw',
  'zuschauer': 'Attendance',
  'kosten': 'Cost',
  'baukosten': 'Construction Cost',
  'unterhalt': 'Upkeep',
  'jahres-unterhalt': 'Annual Upkeep',
  'restschuld': 'Remaining Debt',
  'jahresrate': 'Annual Rate',
  'kredit': 'Loan',
  'fanzufriedenheit': 'Fan Morale',
  'auslastung': 'Capacity Fill',
  'erreicht': 'Achieved',
  'verstanden': 'Understood',
  'zurück': 'Back',
  'weiter': 'Continue',
  'saison': 'Season',
  'tore': 'Goals',
  'torverhältnis': 'Goal Difference',
  'punkte': 'Points',
  'halle': 'Arena',
  'hallen': 'Arenas',
  'platz': 'Rank',
  'plätze': 'Seats'
};

export const sanitizeToEnglish = (text: string): string => {
  if (!text || typeof text !== 'string') return text || '';
  let result = text;
  const lower = text.trim().toLowerCase();
  if (GERMAN_TO_ENGLISH_MAP[lower]) {
    return GERMAN_TO_ENGLISH_MAP[lower];
  }
  for (const [de, en] of Object.entries(GERMAN_TO_ENGLISH_MAP)) {
    const reg = new RegExp(`\\b${de}\\b`, 'gi');
    result = result.replace(reg, en);
  }
  return result;
};

export const t = (arg1: any, arg2?: string, _arg3?: string, _arg4?: string): string => {
  // If first argument is an explicit Language code ('en' | 'de' | 'es')
  if (arg1 === 'en' || arg1 === 'de' || arg1 === 'es') {
    return sanitizeToEnglish(arg2 || '');
  }
  // Otherwise, caller called t(englishText, ...) -> always return the English text
  return typeof arg1 === 'string' ? sanitizeToEnglish(arg1) : '';
};

export const getLoc = (_lang: Language, strObj: any): string => {
  if (!strObj) return '';
  if (typeof strObj === 'string') return sanitizeToEnglish(strObj);
  return sanitizeToEnglish(strObj.en || strObj.es || '');
};
