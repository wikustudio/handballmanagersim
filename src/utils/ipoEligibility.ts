import { GameState } from '../types';
import { formatMoney, formatNum, isReserveClub } from '../data/gameConstants';

export type IPOCheckKey = 'independent' | 'top_flight' | 'solvency' | 'scale';

export interface IPOEligibilityCheck {
  key: IPOCheckKey;
  label: string;
  passed: boolean;
  currentText: string;
  requiredText: string;
  detail: string;
}

export interface IPOEligibilityResult {
  eligible: boolean;
  isReserve: boolean;
  checks: IPOEligibilityCheck[];
  primaryBlocker: string | null;
  summary: string;
}

export const IPO_MIN_OVR = 75;
export const IPO_MIN_FANBASE = 5000;

export function evaluateIPOEligibility(
  state: Pick<GameState, 'club' | 'budget' | 'seasonsInDebt' | 'bankruptcyPending'>
): IPOEligibilityResult {
  const club = state.club;
  const clubName = club?.name || 'Club';
  const country = club?.country || 'GER';
  const tier = club?.tier || 1;
  const baseOvr = Math.round(club?.baseOvr || 0);
  const fanBase = Math.round(club?.fanBase || 0);
  const budget = Math.round(state.budget ?? 0);
  const seasonsInDebt = state.seasonsInDebt || 0;
  const bankruptcyPending = Boolean(state.bankruptcyPending);

  const isReserve = isReserveClub(clubName);
  const isTopFlight = tier === 1;
  const isSolvent = budget >= 0 && seasonsInDebt === 0 && !bankruptcyPending;
  const meetsScale = baseOvr >= IPO_MIN_OVR && fanBase >= IPO_MIN_FANBASE;

  const checks: IPOEligibilityCheck[] = [
    {
      key: 'independent',
      label: 'Independent Legal Entity',
      passed: !isReserve,
      currentText: isReserve ? 'Reserve / Subsidiary Squad' : 'Independent Senior Club',
      requiredText: 'Non-reserve corporate entity',
      detail: isReserve
        ? 'Reserve and secondary squads cannot issue independent public equity.'
        : 'Club operates as an independent corporate licensing entity.',
    },
    {
      key: 'top_flight',
      label: 'Top-Flight League License',
      passed: isTopFlight,
      currentText: `Tier ${tier}`,
      requiredText: 'Tier 1 Premier Division',
      detail: isTopFlight
        ? 'Active Tier 1 top-flight domestic licensing verified.'
        : `Earn promotion from Tier ${tier} to Tier 1 before listing public shares.`,
    },
    {
      key: 'solvency',
      label: 'Clean Financial Solvency',
      passed: isSolvent,
      currentText:
        budget < 0
          ? `${formatMoney(budget, country)} Deficit`
          : seasonsInDebt > 0 || bankruptcyPending
          ? `${seasonsInDebt} Debt Strike${seasonsInDebt === 1 ? '' : 's'}`
          : `${formatMoney(budget, country)} Cash`,
      requiredText: `${formatMoney(0, country)}+ Treasury & 0 Debt Strikes`,
      detail: isSolvent
        ? 'Treasury is positive with clean league licensing compliance.'
        : 'Restore a non-negative treasury balance with zero active debt strikes.',
    },
    {
      key: 'scale',
      label: 'Sporting & Commercial Scale',
      passed: meetsScale,
      currentText: `${baseOvr} OVR · ${formatNum(fanBase)} Fans`,
      requiredText: `${IPO_MIN_OVR}+ OVR · ${formatNum(IPO_MIN_FANBASE)}+ Fans`,
      detail: meetsScale
        ? 'Squad stature and active supporter base meet institutional underwriter thresholds.'
        : `Reach at least ${IPO_MIN_OVR} Squad OVR and ${formatNum(IPO_MIN_FANBASE)} active supporters.`,
    },
  ];

  const eligible = checks.every((c) => c.passed);

  let primaryBlocker: string | null = null;
  let summary = 'All stock exchange listing requirements satisfied.';

  if (!eligible) {
    if (isReserve) {
      primaryBlocker = 'Reserve Subsidiary';
      summary = 'Reserve squads are corporate subsidiaries and cannot go public.';
    } else if (!isTopFlight) {
      primaryBlocker = 'Tier 1 Required';
      summary = `Win promotion to Tier 1 to unlock stock exchange listing (currently Tier ${tier}).`;
    } else if (!isSolvent) {
      primaryBlocker = 'Restore Solvency';
      summary = 'Clear your negative treasury or debt compliance warning before launching an IPO.';
    } else if (baseOvr < IPO_MIN_OVR && fanBase < IPO_MIN_FANBASE) {
      primaryBlocker = `Need ${IPO_MIN_OVR} OVR & ${formatNum(IPO_MIN_FANBASE)} Fans`;
      summary = `Build squad quality to ${IPO_MIN_OVR}+ OVR and grow fanbase to ${formatNum(IPO_MIN_FANBASE)}+ supporters.`;
    } else if (baseOvr < IPO_MIN_OVR) {
      primaryBlocker = `Need ${IPO_MIN_OVR}+ OVR`;
      summary = `Raise Squad OVR to ${IPO_MIN_OVR}+ (currently ${baseOvr}) to meet listing standards.`;
    } else {
      primaryBlocker = `Need ${formatNum(IPO_MIN_FANBASE)}+ Fans`;
      summary = `Grow your active fanbase to ${formatNum(IPO_MIN_FANBASE)}+ supporters (currently ${formatNum(fanBase)}).`;
    }
  }

  return {
    eligible,
    isReserve,
    checks,
    primaryBlocker,
    summary,
  };
}
