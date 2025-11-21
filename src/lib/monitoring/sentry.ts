/**
 * Sentry Error Tracking Configuration
 * Production-ready error monitoring with Vercel integration
 */

import * as Sentry from '@sentry/nextjs';

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  enabled: boolean;
}

/**
 * Initialize Sentry with production-ready configuration
 */
export function initSentry(config?: Partial<SentryConfig>) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured - error tracking disabled');
    return;
  }

  const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development';
  const isProd = environment === 'production';

  const defaultConfig: SentryConfig = {
    dsn,
    environment,
    tracesSampleRate: isProd ? 0.1 : 1.0,
    replaysSessionSampleRate: isProd ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    enabled: true,
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.enabled) {
    console.log('[Sentry] Disabled via configuration');
    return;
  }

  Sentry.init({
    dsn: finalConfig.dsn,
    environment: finalConfig.environment,

    // Performance Monitoring
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.vercel\.app/,
          /^https:\/\/lab-visualizer\./,
        ],
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true,
      }),
    ],

    // Performance sampling
    tracesSampleRate: finalConfig.tracesSampleRate,

    // Session Replay
    replaysSessionSampleRate: finalConfig.replaysSessionSampleRate,
    replaysOnErrorSampleRate: finalConfig.replaysOnErrorSampleRate,

    // Additional options
    beforeSend(event, hint) {
      // Filter out non-critical errors
      const error = hint.originalException;

      if (error instanceof Error) {
        // ResizeObserver loop errors are benign
        if (error.message.includes('ResizeObserver loop')) {
          return null;
        }

        // Ignore cancelled fetch requests
        if (error.message.includes('AbortError')) {
          return null;
        }

        // Ignore known browser extension errors
        if (error.stack?.includes('chrome-extension://')) {
          return null;
        }
      }

      return event;
    },

    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Ignore specific errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'ChunkLoadError',
      'Loading chunk',
    ],
  });

  console.log(`[Sentry] Initialized for ${finalConfig.environment}`);
}

/**
 * Capture error with context
 */
export function captureError(
  error: Error,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error, context);
    return;
  }

  Sentry.captureException(error, {
    level,
    extra: context,
  });
}

/**
 * Capture message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Capture performance metric
 */
export function capturePerformanceMetric(
  name: string,
  value: number,
  unit: string = 'millisecond'
) {
  Sentry.metrics.distribution(name, value, {
    unit,
  });
}
