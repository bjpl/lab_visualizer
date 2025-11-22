/**
 * Vercel Analytics & Web Vitals Tracking
 * Production monitoring for performance metrics
 */

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

export interface WebVitals {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Track custom event
 */
export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return;

  // Send to Vercel Analytics
  if (window.va) {
    window.va('event', { name: event.name, ...event.properties });
  }

  // Also log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }
}

/**
 * Track page view
 */
export function trackPageView(url: string, title?: string) {
  trackEvent({
    name: 'pageview',
    properties: {
      url,
      title: title || document.title,
    },
  });
}

/**
 * Track user interaction
 */
export function trackInteraction(
  element: string,
  action: string,
  properties?: Record<string, string | number>
) {
  trackEvent({
    name: 'interaction',
    properties: {
      element,
      action,
      ...properties,
    },
  });
}

/**
 * Track API call performance
 */
export function trackAPICall(
  endpoint: string,
  duration: number,
  status: number,
  method: string = 'GET'
) {
  trackEvent({
    name: 'api_call',
    properties: {
      endpoint,
      duration,
      status,
      method,
    },
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(
  feature: string,
  action: string,
  metadata?: Record<string, string | number>
) {
  trackEvent({
    name: 'feature_usage',
    properties: {
      feature,
      action,
      ...metadata,
    },
  });
}

/**
 * Track error occurrence
 */
export function trackError(
  error: Error,
  context: string,
  fatal: boolean = false
) {
  trackEvent({
    name: 'error',
    properties: {
      message: error.message,
      context,
      fatal: fatal ? 1 : 0,
      stack: error.stack?.substring(0, 200) || '',
    },
  });
}

/**
 * Track performance metric
 */
export function trackPerformance(
  metric: string,
  value: number,
  unit: string = 'ms'
) {
  trackEvent({
    name: 'performance',
    properties: {
      metric,
      value,
      unit,
    },
  });
}

/**
 * Track Web Vitals
 */
export function reportWebVitals(metric: WebVitals) {
  trackEvent({
    name: 'web_vitals',
    properties: {
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      id: metric.id,
    },
  });

  // Send to Sentry performance monitoring
  if (process.env.NODE_ENV === 'production') {
    import('./sentry').then(({ capturePerformanceMetric }) => {
      capturePerformanceMetric(metric.name, metric.value);
    });
  }
}

/**
 * Analytics Provider Components
 */
export const AnalyticsProvider = Analytics;
export const SpeedInsightsProvider = SpeedInsights;

/**
 * Initialize analytics
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return;

  console.log('[Analytics] Initialized');

  // Track initial page view
  trackPageView(window.location.pathname);

  // Setup automatic link tracking
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');

    if (link && link.href) {
      trackInteraction('link', 'click', {
        url: link.href,
        text: link.textContent?.substring(0, 50) || '',
      });
    }
  });
}

/**
 * Custom metrics tracking
 */
export const metrics = {
  // Molecular visualization metrics
  structureLoad: (pdbId: string, duration: number, atomCount: number) => {
    trackEvent({
      name: 'structure_load',
      properties: { pdbId, duration, atomCount },
    });
  },

  // Simulation metrics
  simulationStart: (type: string, parameters: Record<string, number>) => {
    trackEvent({
      name: 'simulation_start',
      properties: { type, ...parameters },
    });
  },

  // Export metrics
  exportGenerated: (format: string, size: number) => {
    trackEvent({
      name: 'export_generated',
      properties: { format, size },
    });
  },

  // Collaboration metrics
  sessionCreated: (sessionId: string, participants: number) => {
    trackEvent({
      name: 'collaboration_session',
      properties: { sessionId, participants },
    });
  },

  // Cache metrics
  cacheHit: (layer: string, key: string) => {
    trackEvent({
      name: 'cache_hit',
      properties: { layer, key },
    });
  },

  cacheMiss: (layer: string, key: string) => {
    trackEvent({
      name: 'cache_miss',
      properties: { layer, key },
    });
  },
};
