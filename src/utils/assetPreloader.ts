import { Club } from '../types';
import { REAL_WORLD_LOGOS } from '../data/realWorldLogos';
import { getLocalAssetPath, hasVerifiedLocalAsset } from '../data/teams';

// In-memory set of URLs that have already been warm-loaded
const preloadedUrls = new Set<string>();

/**
 * Pre-warms an image asset in the browser's memory cache with asynchronous decoding
 * so it renders instantaneously with zero layout shift or pop-in when displayed.
 */
export const preloadImage = (url: string): Promise<void> => {
  if (!url || typeof window === 'undefined' || preloadedUrls.has(url)) {
    return Promise.resolve();
  }
  preloadedUrls.add(url);

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resilient fallback: errors resolve cleanly
    img.src = url;
  });
};

/**
 * Pre-warms verified local crests and official real-world logos for clubs upfront.
 * Guarantees zero-flicker rendering across the Dashboard, Season History, and Table Modals.
 */
export const preloadClubAssets = (clubs: Club[]): void => {
  if (typeof window === 'undefined' || !clubs || !Array.isArray(clubs)) return;

  // Pre-warm crests in microtask batches to prevent main-thread contention
  requestIdleCallback?.(() => {
    clubs.forEach((c) => {
      const numericId = typeof c.id === 'number' ? c.id : Number(c.id);
      if (!isNaN(numericId) && hasVerifiedLocalAsset(numericId)) {
        preloadImage(getLocalAssetPath(numericId));
      }
      if (!isNaN(numericId) && REAL_WORLD_LOGOS[numericId]) {
        preloadImage(REAL_WORLD_LOGOS[numericId]);
      }
      if (c.logo && typeof c.logo === 'string') {
        preloadImage(c.logo);
      }
      if (c.fallbackLogo && typeof c.fallbackLogo === 'string') {
        preloadImage(c.fallbackLogo);
      }
    });
  }) || setTimeout(() => {
    clubs.forEach((c) => {
      const numericId = typeof c.id === 'number' ? c.id : Number(c.id);
      if (!isNaN(numericId) && hasVerifiedLocalAsset(numericId)) {
        preloadImage(getLocalAssetPath(numericId));
      }
      if (!isNaN(numericId) && REAL_WORLD_LOGOS[numericId]) {
        preloadImage(REAL_WORLD_LOGOS[numericId]);
      }
      if (c.logo && typeof c.logo === 'string') {
        preloadImage(c.logo);
      }
      if (c.fallbackLogo && typeof c.fallbackLogo === 'string') {
        preloadImage(c.fallbackLogo);
      }
    });
  }, 10);
};
