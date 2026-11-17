import { GameState, CourtsideNavTab, getAcademySlotLimit } from '../types';
import { formatMoney } from '../data/gameConstants';

export interface NotificationHistoryEntry {
  id: string;
  type?: string;
  title?: string;
  message: string;
  subtitle?: string;
  category?: string;
  seasonYear?: number;
  createdAt?: number;
  seenInBell?: boolean;
}

export interface MissedImportantUpdate {
  id: string;
  severity: 'high' | 'medium' | 'info';
  title: string;
  detail: string;
  actionLabel: string;
  command: string;
  targetTab: CourtsideNavTab;
}

export interface NotificationBellFeed {
  recentPopups: NotificationHistoryEntry[];
  missedUpdates: MissedImportantUpdate[];
  unreadPopupCount: number;
  badgeCount: number;
}

const MAX_HISTORY_ENTRIES = 15;

export function mergeNotificationsIntoHistory(
  existing: NotificationHistoryEntry[] | undefined,
  incoming: any[] | undefined,
  seasonYear?: number
): NotificationHistoryEntry[] {
  const base = Array.isArray(existing) ? existing : [];
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return base.length <= MAX_HISTORY_ENTRIES ? base : base.slice(0, MAX_HISTORY_ENTRIES);
  }

  const seenIds = new Set(base.map((item) => item.id));
  const additions: NotificationHistoryEntry[] = [];

  for (let i = incoming.length - 1; i >= 0; i--) {
    const raw = incoming[i];
    if (!raw || typeof raw.message !== 'string' || !raw.message.trim()) continue;
    const resolvedId = String(raw.id || `${raw.type || 'info'}-${raw.message.slice(0, 48)}`);
    if (seenIds.has(resolvedId)) continue;

    // Avoid duplicating an identical consecutive message pushed in rapid succession
    const latestKnown = additions[additions.length - 1] || base[0];
    if (
      latestKnown &&
      latestKnown.message === raw.message &&
      (latestKnown.title || '') === (raw.title || '') &&
      latestKnown.seasonYear === seasonYear
    ) {
      continue;
    }

    seenIds.add(resolvedId);
    additions.push({
      id: resolvedId,
      type: raw.type || 'info',
      title: raw.title,
      message: raw.message,
      subtitle: raw.subtitle,
      category: raw.category,
      seasonYear,
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
      seenInBell: false,
    });
  }

  if (additions.length === 0 && base.length <= MAX_HISTORY_ENTRIES) {
    return base;
  }

  return [...additions, ...base].slice(0, MAX_HISTORY_ENTRIES);
}

export function buildNotificationBellFeed(state: GameState): NotificationBellFeed {
  const activeUnread = Array.isArray(state.notifications) ? state.notifications : [];
  const mergedHistory = mergeNotificationsIntoHistory(
    state.notificationHistory,
    activeUnread,
    state.year
  );
  const recentPopups = mergedHistory.slice(0, 5);
  const unreadPopupCount = recentPopups.filter((n) => !n.seenInBell).length;

  const missedUpdates: MissedImportantUpdate[] = [];
  const hasClub = Boolean(state.club && state.club.name);

  if (hasClub) {
    const country = state.club?.country || 'GER';

    // 1. Unresolved Press Briefing / Pressure Moment
    if (state.activePressureMoment && !state.activePressureMoment.resolvedChoiceId) {
      missedUpdates.push({
        id: 'unresolved-press-moment',
        severity: 'high',
        title: 'Press Conference Awaiting Response',
        detail:
          state.activePressureMoment.headline ||
          'Journalists are waiting in the Press Room before the campaign continues.',
        actionLabel: 'Address Press',
        command: 'press',
        targetTab: 'board',
      });
    }

    // 2. Negative Treasury / Overdraft Alert
    if ((state.budget ?? 0) < 0) {
      missedUpdates.push({
        id: 'treasury-overdraft',
        severity: 'high',
        title: 'Treasury in Overdraft',
        detail: `Operating balance is ${formatMoney(state.budget, country)}. Structure a loan or raise revenue before licensing checks.`,
        actionLabel: 'Open Loans',
        command: 'loans',
        targetTab: 'commercial',
      });
    }

    // 3. Unsigned Season Sponsorship Deals
    const dealsObj =
      state.seasonSponsorDealsYear === state.year && state.seasonSponsorDeals
        ? state.seasonSponsorDeals
        : {};
    const signedSponsorCount = [0, 1, 2].filter((k) => dealsObj[k]?.status === 'signed').length;
    if (signedSponsorCount === 0) {
      missedUpdates.push({
        id: 'unsigned-sponsors',
        severity: 'medium',
        title: 'Sponsorship Slots Open',
        detail: 'No active shirt or commercial partner signed yet for this season.',
        actionLabel: 'Sign Sponsor',
        command: 'sponsors',
        targetTab: 'commercial',
      });
    }

    // 4. U19 Youth Tournament Ready
    const activeYouthCount = (state.youthPipeline || []).filter((p) => !p.isLoanedOut).length;
    const hasPlayedYouthCup = state.youthChampionshipSimulatedYear === state.year;
    if (activeYouthCount >= 6 && !hasPlayedYouthCup) {
      missedUpdates.push({
        id: 'u19-tournament-ready',
        severity: 'medium',
        title: 'U19 National Cup Ready',
        detail: `${activeYouthCount} academy prospects eligible to compete for +1 Senior OVR & +15 Morale.`,
        actionLabel: 'Enter Cup',
        command: 'youth-tournament',
        targetTab: 'squad',
      });
    }

    // 5. Free School Trialist / Open Academy Slot
    const academyLvl = state.club?.academyLevel || 1;
    const slotLimit = getAcademySlotLimit(academyLvl);
    if (activeYouthCount < slotLimit && (state.schoolTrialistsThisSeason || 0) === 0 && activeYouthCount < 6) {
      missedUpdates.push({
        id: 'academy-scout-open',
        severity: 'info',
        title: 'Academy Scouting Available',
        detail: `${activeYouthCount}/${slotLimit} youth slots filled · Free regional trialist & scouting available.`,
        actionLabel: 'Youth Academy',
        command: 'youth',
        targetTab: 'squad',
      });
    }

    // 6. Low Morale & Unused Team Retreat
    const morale = state.club?.morale ?? 75;
    if (morale <= 62 && (state.teamBondingThisSeason || 0) === 0) {
      missedUpdates.push({
        id: 'low-morale-retreat',
        severity: 'medium',
        title: `Dressing Room Morale at ${morale}%`,
        detail: 'Seasonal Team Retreat is still available to restore +30% squad harmony.',
        actionLabel: 'Team Retreat',
        command: 'team-retreat',
        targetTab: 'squad',
      });
    }

    // 7. Unspent Manager Skill Points
    if ((state.skillPoints || 0) >= 10) {
      missedUpdates.push({
        id: 'unspent-mp',
        severity: 'info',
        title: `${state.skillPoints} Manager Points Available`,
        detail: 'Unlock permanent coaching, scouting, or commercial perks.',
        actionLabel: 'Unlock Skills',
        command: 'skills',
        targetTab: 'board',
      });
    }
  }

  const actionableCount = missedUpdates.filter(
    (u) => u.severity === 'high' || u.severity === 'medium'
  ).length;

  return {
    recentPopups,
    missedUpdates: missedUpdates.slice(0, 5),
    unreadPopupCount,
    badgeCount: unreadPopupCount + actionableCount,
  };
}
