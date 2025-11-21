/**
 * Monitoring Library Index
 * Central export for all monitoring functionality
 */

// Sentry exports
export {
  initSentry,
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  startTransaction,
  capturePerformanceMetric,
} from './sentry';

// Analytics exports
export {
  trackEvent,
  trackPageView,
  trackInteraction,
  trackAPICall,
  trackFeatureUsage,
  trackError,
  trackPerformance,
  reportWebVitals,
  initAnalytics,
  metrics,
  AnalyticsProvider,
  SpeedInsightsProvider,
} from './analytics';

// Types
export type { AnalyticsEvent, WebVitals } from './analytics';
export type { SentryConfig } from './sentry';
