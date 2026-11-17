import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNotificationBellFeed, mergeNotificationsIntoHistory } from './notificationFeed';

test('mergeNotificationsIntoHistory retains dismissed popups and returns latest 5 in feed', () => {
  let history = mergeNotificationsIntoHistory(
    [],
    [{ id: 'n1', type: 'info', title: 'Transfer', message: 'Signed backcourt starter (+1 OVR)' }],
    2026
  );
  history = mergeNotificationsIntoHistory(
    history,
    [
      { id: 'n2', type: 'success', title: 'Sponsor', message: 'Standard Partner deal signed' },
      { id: 'n3', type: 'warning', title: 'Media', message: 'Press scrutiny rising' },
      { id: 'n4', type: 'info', title: 'Academy', message: 'Scouted Danish wonderkid' },
      { id: 'n5', type: 'celebration', title: 'Cup', message: 'Advanced to Quarter-Finals' },
      { id: 'n6', type: 'success', title: 'Arena', message: 'Expanded seating by +500' },
    ],
    2026
  );

  assert.equal(history.length, 6);
  const feed = buildNotificationBellFeed({
    year: 2026,
    budget: 500000,
    notifications: [],
    notificationHistory: history,
    club: { id: '1', name: 'Aalborg Håndbold', country: 'DEN', tier: 1, baseOvr: 86, morale: 85 },
    seasonSponsorDealsYear: 2026,
    seasonSponsorDeals: { 0: { status: 'signed', brandName: 'Arla', brandLogo: '' } },
    youthPipeline: [],
    schoolTrialistsThisSeason: 1,
  } as any);

  assert.equal(feed.recentPopups.length, 5);
  assert.equal(feed.recentPopups[0].id, 'n6');
  assert.equal(feed.recentPopups[4].id, 'n2');
});

test('buildNotificationBellFeed detects missed updates like unsigned sponsor and U19 tournament ready', () => {
  const feed = buildNotificationBellFeed({
    year: 2026,
    budget: -120000,
    skillPoints: 15,
    notifications: [],
    notificationHistory: [],
    club: { id: '1', name: 'Aalborg Håndbold', country: 'DEN', tier: 1, baseOvr: 86, morale: 55 },
    seasonSponsorDealsYear: 2026,
    seasonSponsorDeals: {},
    youthPipeline: [
      { id: '1', name: 'A', boost: 1 },
      { id: '2', name: 'B', boost: 1 },
      { id: '3', name: 'C', boost: 1 },
      { id: '4', name: 'D', boost: 2 },
      { id: '5', name: 'E', boost: 1 },
      { id: '6', name: 'F', boost: 2 },
    ],
  } as any);

  const ids = feed.missedUpdates.map((u) => u.id);
  assert.ok(ids.includes('treasury-overdraft'));
  assert.ok(ids.includes('unsigned-sponsors'));
  assert.ok(ids.includes('u19-tournament-ready'));
  assert.ok(ids.includes('low-morale-retreat'));
  assert.ok(feed.badgeCount >= 4);
});
