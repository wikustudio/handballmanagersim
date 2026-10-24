import { GameState } from '../types';
import { ALL_CLUBS } from '../data/clubsData';
import { getActiveClubs } from './modManager';

const SUPABASE_URL = 'https://wzoalrpjjxacjcxyveln.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VObfts_vuIo_Dqh3Nc_UIQ_QAgotrSb';

export function getReconciledTrophies(state: GameState): number {
  let historyTrophies = 0;
  (state.history || []).forEach(h => {
    const t = h.trophiesThisYear || {};
    const isLower = Boolean(h.promoted || (h.tier && h.tier > 1));
    if (t.cl) historyTrophies += (typeof t.cl === 'number' ? t.cl : 1);
    if (t.cwc) historyTrophies += (typeof t.cwc === 'number' ? t.cwc : 1);
    if (!isLower) {
      if (t.bl) historyTrophies += (typeof t.bl === 'number' ? t.bl : 1);
      else if (!h.trophiesThisYear && h.pos === 1 && (h.tier === 1 || !h.tier)) historyTrophies += 1;
    } else {
      if (t.lower) historyTrophies += (typeof t.lower === 'number' ? t.lower : 1);
      else if (t.bl) historyTrophies += (typeof t.bl === 'number' ? t.bl : 1);
      else if (!h.trophiesThisYear && h.pos === 1) historyTrophies += 1;
    }
    if (t.dfb) historyTrophies += (typeof t.dfb === 'number' ? t.dfb : 1);
    if (t.el) historyTrophies += (typeof t.el === 'number' ? t.el : 1);
    if (t.ecl) historyTrophies += (typeof t.ecl === 'number' ? t.ecl : 1);
    if (t.reg) historyTrophies += (typeof t.reg === 'number' ? t.reg : 1);
    if (t.sc) historyTrophies += (typeof t.sc === 'number' ? t.sc : 1);
    if (t.esc) historyTrophies += (typeof t.esc === 'number' ? t.esc : 1);
  });

  const totalsTrophyCount = Math.max(
    state.totals?.trophies || 0,
    (state.totals?.domTrophies || 0) + (state.totals?.intTrophies || 0)
  );

  return Math.max(
    totalsTrophyCount,
    historyTrophies,
    Array.isArray(state.trophies) ? state.trophies.length : 0
  );
}

export function calculateLiveScore(state: GameState): number {
  const history = state.history || [];
  
  let historyWins = 0;
  history.forEach(h => {
    historyWins += (h.wins || 0);
  });

  const totalWins = Math.max(state.totals?.wins || 0, historyWins);
  const totalTrophies = getReconciledTrophies(state);

  // AUTHENTIC LEADERBOARD SCORING (Calibrated for ~5.5M Max Ceiling)
  
  // 1. Match Wins: 1,000 pts per win
  const winsScore = totalWins * 1000;

  // 2. Trophies: 50,000 pts per title/cup won
  const trophyScore = totalTrophies * 50000;

  // 3. Manager Reputation: 500 pts per reputation point (0-100 scale, up to 50,000 pts)
  const rep = typeof state.reputation === 'number' ? Math.max(0, Math.min(100, state.reputation)) : 50;
  const repScore = rep * 500;

  // 4. Infrastructure: 10 pts per arena seat (Max 300,000 pts for 30k arena)
  const stadium = state.club?.stadium || 0;
  const stadiumScore = stadium * 10;

  // 5. Club Treasury: 1 pt per €1,000 in positive bank balance
  const budgetScore = state.budget > 0 ? Math.floor(state.budget / 1000) : 0;

  // 6. Manager Development: 2,500 pts per managerial skill point earned
  const mpScore = (state.skillPoints || 0) * 2500;

  return Math.floor(winsScore + trophyScore + repScore + stadiumScore + budgetScore + mpScore);
}

const FALLBACK_KEY = 'handball_highscores_fallback';
const QUEUE_KEY = 'handball_highscores_queue';

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Storage write failed for key ${key}:`, e);
  }
}

function queueOfflineScore(entry: any) {
  try {
    const raw = safeGetItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    // Deduplicate in queue by careerId if available, or fallback to managerName and clubName
    const filtered = queue.filter((item: any) => {
      if (entry.careerId && item.careerId) {
        return item.careerId !== entry.careerId;
      }
      return (item.managerName || '').trim().toLowerCase() !== entry.managerName.toLowerCase() ||
             (item.clubName || '').trim().toLowerCase() !== entry.clubName.toLowerCase();
    });
    filtered.push(entry);
    safeSetItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to queue offline highscore:', e);
  }
}

export async function fetchHighscores() {
  // Purge any legacy fake mock manager entries from fallback cache
  try {
    const rawLocal = safeGetItem(FALLBACK_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      const cleaned = parsed.filter((item: any) => {
        const name = (item.managerName || item.manager_name || '').toLowerCase();
        return !['wi ku', 'jonas h', 'markus b', 'lukas m', 'test dummy', 'mock manager'].includes(name);
      });
      safeSetItem(FALLBACK_KEY, JSON.stringify(cleaned));
    }
  } catch (e) {
    // Ignore storage parse issues
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/handball_highscores?select=*&order=score.desc&limit=100`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        // Deduplicate records by manager and club so each manager has their best/latest official run
        const byManager = new Map<string, any>();
        data.forEach(item => {
          const key = `${(item.managerName || item.manager_name || '').trim().toLowerCase()}_${(item.clubName || item.club_name || '').trim().toLowerCase()}`;
          if (!key || key === '_') return;
          const existing = byManager.get(key);
          if (!existing) {
            byManager.set(key, item);
          } else {
            const existingScore = Number(existing.score) || 0;
            const newScore = Number(item.score) || 0;
            if (newScore > existingScore) {
              byManager.set(key, item);
            } else if (newScore === existingScore) {
              // Prefer higher starting tier (e.g. Tier 5 over Tier 2) or latest submission
              const existingTier = Number(existing.start_tier ?? existing.startTier ?? existing.tier ?? 1);
              const newTier = Number(item.start_tier ?? item.startTier ?? item.tier ?? 1);
              if (newTier > existingTier || new Date(item.created_at || item.date || 0).getTime() > new Date(existing.created_at || existing.date || 0).getTime()) {
                byManager.set(key, item);
              }
            }
          }
        });
        const deduplicated = Array.from(byManager.values());
        const sorted = deduplicated.sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0)).slice(0, 50);
        // Cache successful fetch to local storage fallback
        safeSetItem(FALLBACK_KEY, JSON.stringify(sorted));
        return sorted;
      }
    }
  } catch (err) {
    console.warn('Failed to load official highscores from Supabase (falling back to local cache):', err);
  }

  // Only fall back to local storage if offline or Supabase unreachable
  try {
    const localScores = JSON.parse(safeGetItem(FALLBACK_KEY) || '[]');
    return localScores.sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0)).slice(0, 50);
  } catch {
    return [];
  }
}

export async function saveHighscore(state: GameState): Promise<{ success: boolean; message: string }> {
  if (!state.managerName) return { success: false, message: 'Manager name required' };
  
  const userTeam = state.club;
  if (!userTeam) return { success: false, message: 'Club required' };

  // Calculate the inaugural starting club name:
  // 1. Explicit startClubName on state
  // 2. Earliest season recorded in career history (history[0].clubName)
  // 3. Fallback to current club name
  const startClubName = 
    state.startClubName ||
    (state.history && state.history.length > 0 ? state.history[0]?.clubName : undefined) ||
    userTeam.name;

  // Calculate the true starting tier of the manager's career:
  // 1. Explicit startTier on state
  // 2. Earliest season recorded in career history (history[0].tier)
  // 3. originalStartLeague on club
  // 4. Default database starting tier for the starting club
  // 5. Current club tier fallback
  const activePool = getActiveClubs(userTeam.country);
  const startTier = 
    state.startTier ||
    (state.history && state.history.length > 0 ? state.history[0]?.tier : undefined) ||
    userTeam.originalStartLeague ||
    activePool.find(c => c.name === startClubName || c.name === userTeam.name)?.tier ||
    ALL_CLUBS.find(c => c.name === startClubName || c.name === userTeam.name)?.tier ||
    userTeam.tier ||
    1;

  const totalTrophies = getReconciledTrophies(state);
  const careerId = state.careerId || `${(state.managerName || '').trim().toLowerCase()}_${(startClubName || '').trim().toLowerCase()}`;

  const entry = {
    careerId,
    managerName: state.managerName.trim(),
    clubName: startClubName,
    score: calculateLiveScore(state),
    trophies: totalTrophies,
    start_tier: startTier,
    date: new Date().toISOString()
  };

  const syncLocal = () => {
    try {
      const scores = JSON.parse(safeGetItem(FALLBACK_KEY) || '[]');
      const filtered = scores.filter((s: any) => {
        if (entry.careerId && s.careerId) {
          return s.careerId !== entry.careerId;
        }
        return (s.managerName || s.manager_name) !== entry.managerName || 
               (s.clubName || s.club_name) !== entry.clubName;
      });
      filtered.push(entry);
      filtered.sort((a: any, b: any) => Number(b.score) - Number(a.score));
      safeSetItem(FALLBACK_KEY, JSON.stringify(filtered.slice(0, 50)));
    } catch (e) {
      // Storage failure
    }
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    syncLocal();
    queueOfflineScore(entry);
    return { success: true, message: 'Saved locally and queued for Supabase sync when online.' };
  }

  const supabasePayload = {
    managerName: entry.managerName,
    clubName: entry.clubName,
    score: entry.score,
    trophies: entry.trophies,
    start_tier: entry.start_tier,
    date: entry.date
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/handball_highscores`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(supabasePayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      syncLocal();
      // Background drain any previously queued offline scores
      syncOfflineScores().catch(() => {});
      return { success: true, message: 'Score successfully posted to official Supabase leaderboard!' };
    } else {
      console.warn('Supabase rejected highscore post, status:', res.status);
      syncLocal();
      queueOfflineScore(entry);
      return { success: false, message: `Server status ${res.status}, saved locally & queued.` };
    }
  } catch (err: any) {
    console.warn('Failed to post highscore to Supabase, queuing locally:', err);
    syncLocal();
    queueOfflineScore(entry);
    return { success: false, message: 'Network offline, saved locally & queued.' };
  }
}

let isSyncing = false;

export async function syncOfflineScores(): Promise<{ synced: number; remaining: number }> {
  if (isSyncing) return { synced: 0, remaining: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, remaining: 0 };
  }

  isSyncing = true;
  let synced = 0;
  try {
    const raw = safeGetItem(QUEUE_KEY);
    if (!raw) {
      isSyncing = false;
      return { synced: 0, remaining: 0 };
    }
    const queue = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) {
      isSyncing = false;
      return { synced: 0, remaining: 0 };
    }

    const remainingQueue: any[] = [];
    for (const item of queue) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const itemPayload = {
          managerName: item.managerName,
          clubName: item.clubName,
          score: item.score,
          trophies: item.trophies,
          start_tier: item.start_tier,
          date: item.date
        };

        const res = await fetch(`${SUPABASE_URL}/rest/v1/handball_highscores`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(itemPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          synced++;
        } else {
          remainingQueue.push(item);
        }
      } catch (err) {
        remainingQueue.push(item);
      }
    }

    safeSetItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    return { synced, remaining: remainingQueue.length };
  } catch (e) {
    console.warn('syncOfflineScores error:', e);
    return { synced, remaining: 0 };
  } finally {
    isSyncing = false;
  }
}

// Auto-register listener when coming online in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineScores().catch(() => {});
  });
}
