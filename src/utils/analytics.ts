export const GA_MEASUREMENT_ID = 'G-L8CWHLRP1G';

export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  try {
    if (typeof window !== 'undefined') {
      const sanitizedParams = eventParams
        ? Object.fromEntries(
            Object.entries(eventParams).filter(([_, v]) => v !== undefined && v !== null)
          )
        : undefined;

      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', eventName, sanitizedParams);
      } else if (Array.isArray((window as any).dataLayer)) {
        (window as any).dataLayer.push({
          event: eventName,
          ...(sanitizedParams || {})
        });
      }
    }
  } catch (e) {
    console.warn('Analytics error:', e);
  }
};

export const setAnalyticsUserProperties = (properties: Record<string, any>) => {
  try {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      const sanitized = Object.fromEntries(
        Object.entries(properties).filter(([_, v]) => v !== undefined && v !== null)
      );
      (window as any).gtag('set', 'user_properties', sanitized);
    }
  } catch (e) {
    console.warn('Analytics user properties error:', e);
  }
};
