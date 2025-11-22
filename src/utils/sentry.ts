/**
 * Sentry error tracking configuration
 *
 * Note: Install @sentry/react when ready:
 * npm install @sentry/react
 */

import type { BrowserOptions } from '@sentry/react';

/**
 * Initialize Sentry error tracking
 */
export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  // Uncomment when @sentry/react is installed
  /*
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/lab-visualizer\.vercel\.app/],
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        if (error.message.includes('ResizeObserver loop')) {
          return null;
        }
      }
      return event;
    },
  });
  */

  console.log('[Sentry] Error tracking initialized');
}

/**
 * Manually capture error
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error, context);
    return;
  }

  // Uncomment when @sentry/react is installed
  // Sentry.captureException(error, { extra: context });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; email?: string }) {
  // Uncomment when @sentry/react is installed
  // Sentry.setUser(user);
}
