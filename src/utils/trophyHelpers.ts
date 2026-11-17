import { isAnyModActive } from './modManager';
import { getCompetitionLogoDataUri, getLeagueLogoDataUri } from '../data/competitionLogos';

export function getTrophyImage(cupId: string, country?: string): string {
  const modActive = isAnyModActive();
  const normId = (cupId || '').toLowerCase();

  if (normId === 'bl' || normId === 'league' || normId === 't1') {
    return getLeagueLogoDataUri(country || 'GER', 1, modActive);
  }
  if (normId === 'lower' || normId === 'generic' || normId === 'division') {
    return getLeagueLogoDataUri(country || 'GER', 2, modActive);
  }
  if (normId === 'cl' || normId === 'ehf_cl') {
    return getCompetitionLogoDataUri('cl', { country, isModActive: modActive });
  }
  if (normId === 'el' || normId === 'ehf_el') {
    return getCompetitionLogoDataUri('el', { country, isModActive: modActive });
  }
  if (normId === 'ecl' || normId === 'ehf_ec' || normId === 'ec') {
    return getCompetitionLogoDataUri('ecl', { country, isModActive: modActive });
  }
  if (normId === 'cwc' || normId === 'globe' || normId === 'super_globe') {
    return getCompetitionLogoDataUri('cwc', { country, isModActive: modActive });
  }
  if (normId === 'dfb' || normId === 'cup' || normId === 'nat_cup') {
    return getCompetitionLogoDataUri('dfb', { country: country || 'GER', isModActive: modActive });
  }
  if (normId === 'sc' || normId === 'supercup') {
    return getCompetitionLogoDataUri('sc', { country: country || 'GER', isModActive: modActive });
  }
  if (normId === 'reg' || normId === 'regional') {
    return getCompetitionLogoDataUri('reg', { country: country || 'GER', isModActive: modActive });
  }

  return '';
}

export function getTrophyFilter(_cupId: string): string {
  return '';
}
