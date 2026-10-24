import { Club } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import realDataJson from '../mod-data/handball_base_database.json';

export const REALDATA_MOD_ID = 'handball_base_database';
export const REALDATA_MOD_NAME = 'Handball Manager Database';
export const REALDATA_MOD_FILE = 'src/mod-data/handball_base_database.json';
export const REALDATA_MOD_VERSION = 'v2026.4';
export const REALDATA_MOD_CLUBS_COUNT = 680;
export const REALDATA_MOD_NATIONS_COUNT = 13;

export const isRealDataModActive = (): boolean => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return true;
    const val = localStorage.getItem('mod_realdata_active');
    // Default to true so the official Handball Manager database is active unless explicitly disabled
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
};

export const isAnyModActive = (): boolean => {
  return isRealDataModActive() || Boolean(getCustomDb());
};

export const setRealDataModActive = (active: boolean): void => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem('mod_realdata_active', active ? 'true' : 'false');
    window.dispatchEvent(new Event('mod-state-change'));
  } catch (e) {
    console.error('Failed to set mod active state', e);
  }
};

export const getCustomDb = (): Club[] | null => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem('custom_db');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (validateCustomDb(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load custom db, falling back to base database', e);
  }
  return null;
};

export const setCustomDb = (clubs: Club[] | null): void => {
  try {
    if (clubs && clubs.length > 0) {
      localStorage.setItem('custom_db', JSON.stringify(clubs));
    } else {
      localStorage.removeItem('custom_db');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mod-state-change'));
    }
  } catch (e) {
    console.error('Failed to save custom db', e);
  }
};

const getActiveCareerCountry = (): string | null => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem('handball-manager-storage');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed?.state?.managerName && parsed?.state?.club?.country) {
      return String(parsed.state.club.country).trim().toUpperCase();
    }
  } catch {
    // ignore
  }
  return null;
};

export const getDefaultClubs = (includeCountry?: string): Club[] => {
  const preserveCountry = (includeCountry || '').trim().toUpperCase();
  return ALL_CLUBS
    .filter(c => {
      const ctry = (c.country || '').trim().toUpperCase();
      if (preserveCountry && ctry === preserveCountry) return true;
      return !['POL', 'AUT', 'SUI'].includes(ctry);
    })
    .map(c => ({
      ...c,
      logo: undefined,
      fallbackLogo: undefined,
    }));
};

export const getRealDataClubs = (): Club[] => {
  if (Array.isArray(realDataJson) && realDataJson.length > 0) {
    return (realDataJson as unknown as Club[]).map(c => ({ ...c }));
  }
  return ALL_CLUBS.map(c => ({ ...c }));
};

export const fetchModDataDatabase = async (): Promise<Club[]> => {
  try {
    const res = await fetch('/mod-data/handball_base_database.json');
    if (res.ok) {
      const data = await res.json();
      if (validateCustomDb(data)) {
        return (data as Club[]).map(c => ({ ...c }));
      }
    }
  } catch (e) {
    console.warn('Fetch fallback to bundled json', e);
  }
  return getRealDataClubs();
};

export const getActiveClubs = (includeCountry?: string): Club[] => {
  const custom = getCustomDb();
  if (custom) return custom.map(c => ({ ...c }));

  if (isRealDataModActive()) {
    return getRealDataClubs();
  }

  const activeCareerCountry = includeCountry || getActiveCareerCountry() || undefined;
  return getDefaultClubs(activeCareerCountry);
};

/**
 * Merges a base database club with dynamic worldClubs state while ensuring static
 * identity (name, color, color2, logo, fallbackLogo, historicContext, context) flows
 * cleanly from the currently active database (mod, custom mod, or non-mod).
 */
export const mergeClubWithWorldState = (baseClub: Club, worldClub?: Partial<Club>): Club => {
  const modActive = isAnyModActive();
  if (!worldClub) {
    return {
      ...baseClub,
      logo: modActive ? baseClub.logo : undefined,
      fallbackLogo: modActive ? baseClub.fallbackLogo : undefined,
    };
  }
  return {
    ...baseClub,
    ...worldClub,
    name: baseClub.name || worldClub.name || 'Club',
    country: baseClub.country || worldClub.country,
    color: baseClub.color || worldClub.color || '1e3a8a',
    color2: baseClub.color2 ?? worldClub.color2,
    logo: modActive ? (baseClub.logo ?? worldClub.logo) : undefined,
    fallbackLogo: modActive ? (baseClub.fallbackLogo ?? worldClub.fallbackLogo) : undefined,
    historicContext: baseClub.historicContext || baseClub.context || worldClub.historicContext || worldClub.context,
    context: baseClub.context || baseClub.historicContext || worldClub.context || worldClub.historicContext,
  };
};

export const validateCustomDb = (data: any): boolean => {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;
  for (const club of data) {
    if (typeof club !== 'object' || club === null) return false;
    if (typeof club.id !== 'string' && typeof club.id !== 'number') return false;
    if (typeof club.name !== 'string') return false;
    if (typeof club.tier !== 'number') return false;
    if (typeof club.baseOvr !== 'number') return false;
  }
  return true;
};
