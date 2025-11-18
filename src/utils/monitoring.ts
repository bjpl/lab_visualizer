import { onCLS, onFID, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Web Vitals monitoring and reporting
 */

interface WebVitalsMetric extends Metric {
  rating?: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Send to Vercel Analytics
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body);
  } else {
    fetch('/api/analytics', { body, method: 'POST', keepalive: true });
  }

  // Log in development
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals() {
  if (!import.meta.env.VITE_ENABLE_WEB_VITALS) {
    return;
  }

  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

/**
 * Custom performance metrics
 */
export class PerformanceTracker {
  private marks = new Map<string, number>();

  /**
   * Start timing a custom metric
   */
  start(name: string) {
    this.marks.set(name, performance.now());
  }

  /**
   * End timing and report metric
   */
  end(name: string) {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Report custom metric
    if (import.meta.env.VITE_ENABLE_WEB_VITALS) {
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify({
          name: `custom_${name}`,
          value: duration,
          type: 'custom',
        }),
        keepalive: true,
      });
    }

    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure time for async operation
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  }
}

export const performanceTracker = new PerformanceTracker();
