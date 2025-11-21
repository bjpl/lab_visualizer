# Production Monitoring Setup

## Overview

The LAB Visualizer application uses a comprehensive monitoring stack to ensure reliability, performance, and security in production.

## Monitoring Stack

### 1. Sentry - Error Tracking & Performance

**Purpose**: Track errors, exceptions, and performance issues

**Configuration**: `/src/lib/monitoring/sentry.ts`

**Features**:
- Error tracking with full stack traces
- Performance monitoring (transactions, traces)
- Session replay for debugging
- Custom breadcrumbs for context
- User context tracking
- Release tracking

**Setup**:
```bash
# 1. Create Sentry account
# Visit: https://sentry.io

# 2. Create new project (Next.js)

# 3. Add environment variables
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add SENTRY_AUTH_TOKEN production

# 4. Initialize in app
# Already configured in /src/lib/monitoring/sentry.ts
```

**Usage**:
```typescript
import { captureError, setUserContext } from '@/lib/monitoring';

// Capture error
try {
  // ... code
} catch (error) {
  captureError(error as Error, { context: 'pdb-loading' });
}

// Set user context
setUserContext({
  id: user.id,
  email: user.email,
});
```

### 2. Vercel Analytics - Usage Metrics

**Purpose**: Track page views, user interactions, and Web Vitals

**Configuration**: `/src/lib/monitoring/analytics.ts`

**Features**:
- Real-time page view tracking
- Custom event tracking
- Web Vitals monitoring (LCP, FID, CLS)
- Audience insights
- Traffic analytics

**Setup**:
```bash
# 1. Enable in Vercel project settings
# Dashboard → Analytics → Enable

# 2. Add Analytics component to _app.tsx
import { AnalyticsProvider } from '@/lib/monitoring';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <AnalyticsProvider />
    </>
  );
}
```

**Custom Events**:
```typescript
import { trackEvent, metrics } from '@/lib/monitoring';

// Track structure load
metrics.structureLoad('1ATP', 1200, 5000);

// Track export
metrics.exportGenerated('PDF', 1024000);

// Track custom event
trackEvent({
  name: 'feature_used',
  properties: {
    feature: 'collaboration',
    action: 'session_created',
  },
});
```

### 3. Vercel Speed Insights - Real User Monitoring

**Purpose**: Monitor real-world performance metrics

**Setup**:
```typescript
import { SpeedInsightsProvider } from '@/lib/monitoring';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <SpeedInsightsProvider />
    </>
  );
}
```

**Metrics Tracked**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

### 4. Health Checks - System Status

**Purpose**: Monitor service availability and health

**Endpoints**:
- `GET /api/health` - Comprehensive health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

**Monitoring**:
```bash
# Manual check
curl https://lab-visualizer.vercel.app/api/health

# Automated monitoring (setup in Vercel)
# Dashboard → Monitoring → Health Checks
# Add: https://lab-visualizer.vercel.app/api/health/ready
# Interval: 60 seconds
# Alert on 3 consecutive failures
```

**Services Checked**:
- Database (Supabase) connectivity
- Cache (Vercel KV) connectivity
- External APIs (PDB) reachability
- Storage availability
- Memory usage

## Dashboards

### Sentry Dashboard

**URL**: https://sentry.io/organizations/[org]/issues/

**Key Metrics**:
- Error count and rate
- Performance trends
- User-affected events
- Release comparison

**Alerts**:
- Error rate > 5% (P1)
- New error patterns (P2)
- Performance degradation (P2)

### Vercel Analytics Dashboard

**URL**: https://vercel.com/[team]/lab-visualizer/analytics

**Key Metrics**:
- Page views
- Unique visitors
- Top pages
- Web Vitals scores
- Custom events

**Views**:
- Real-time: Last 60 minutes
- Overview: Last 7 days
- Audience: Demographics and devices
- Top Pages: Most visited routes

### Vercel Speed Insights

**URL**: https://vercel.com/[team]/lab-visualizer/speed-insights

**Key Metrics**:
- Overall score (0-100)
- Real-world Web Vitals
- Performance trends
- Device breakdown

## Alerting

### Sentry Alerts

**Configuration**: Sentry → Alerts → Alert Rules

**Recommended Alerts**:

1. **High Error Rate**
   - Condition: Error count > 10 in 5 minutes
   - Severity: P1
   - Action: Email + Slack

2. **New Issue**
   - Condition: First seen error
   - Severity: P2
   - Action: Slack

3. **Performance Degradation**
   - Condition: p95 response time > 3s
   - Severity: P2
   - Action: Slack

### Vercel Alerts

**Configuration**: Vercel → Project → Settings → Monitoring

**Recommended Alerts**:

1. **Deployment Failure**
   - Severity: P1
   - Action: Email immediately

2. **High Error Rate**
   - Condition: 5xx errors > 5%
   - Severity: P1
   - Action: Email + Slack

3. **Performance Budget Exceeded**
   - Condition: Bundle size > 500KB
   - Severity: P2
   - Action: Block deployment

## Custom Metrics

### Application-Specific Metrics

**Structure Loading**:
```typescript
import { metrics } from '@/lib/monitoring';

const start = Date.now();
const structure = await loadStructure(pdbId);
const duration = Date.now() - start;

metrics.structureLoad(pdbId, duration, structure.atomCount);
```

**Cache Performance**:
```typescript
const cacheHit = await cache.get(key);

if (cacheHit) {
  metrics.cacheHit('L2', key);
} else {
  metrics.cacheMiss('L2', key);
}
```

**API Performance**:
```typescript
import { trackAPICall } from '@/lib/monitoring';

const start = Date.now();
const response = await fetch('/api/pdb/1ATP');
const duration = Date.now() - start;

trackAPICall('/api/pdb/1ATP', duration, response.status, 'GET');
```

## Web Vitals Monitoring

### Core Web Vitals

**LCP - Largest Contentful Paint**:
- Target: < 2.5s
- Measures: Loading performance
- Optimization: Image optimization, lazy loading

**FID - First Input Delay**:
- Target: < 100ms
- Measures: Interactivity
- Optimization: Reduce JavaScript execution

**CLS - Cumulative Layout Shift**:
- Target: < 0.1
- Measures: Visual stability
- Optimization: Reserve space for dynamic content

### Implementation

```typescript
// In _app.tsx or layout.tsx
import { reportWebVitals } from '@/lib/monitoring';

export function reportWebVitals(metric: WebVitals) {
  // Send to analytics
  reportWebVitals(metric);
}
```

## Performance Budgets

### Configured Budgets

See `/lighthouse-budget.json`:

**Timing Budgets**:
- Interactive: < 3000ms
- FCP: < 1500ms
- LCP: < 2500ms
- CLS: < 0.1
- TBT: < 200ms

**Resource Budgets**:
- JavaScript: < 500KB
- CSS: < 50KB
- Images: < 200KB
- Total: < 1000KB

### Enforcement

```bash
# Run Lighthouse audit
npm run lighthouse:audit

# In CI/CD (automated)
# Fails build if performance < 85
```

## Logging

### Structured Logging

**Best Practices**:
- Use Sentry breadcrumbs for context
- Include user ID (privacy-safe)
- Add timestamps
- Include request IDs
- Log errors with full context

**Example**:
```typescript
import { addBreadcrumb, captureError } from '@/lib/monitoring';

// Add context
addBreadcrumb('Fetching PDB structure', 'api', {
  pdbId: '1ATP',
  source: 'RCSB',
});

try {
  await fetchStructure('1ATP');
} catch (error) {
  captureError(error as Error, {
    pdbId: '1ATP',
    source: 'RCSB',
    userId: user.id,
  });
}
```

### Log Levels

- **Error**: Capture in Sentry
- **Warn**: Add as breadcrumb
- **Info**: Analytics event
- **Debug**: Development only

## Monitoring Checklist

### Daily
- [ ] Check Sentry for new errors
- [ ] Review error rate trends
- [ ] Verify health checks passing
- [ ] Check performance metrics

### Weekly
- [ ] Review Web Vitals trends
- [ ] Analyze custom events
- [ ] Check cache hit rates
- [ ] Review user feedback

### Monthly
- [ ] Full Lighthouse audit
- [ ] Performance review meeting
- [ ] Update monitoring thresholds
- [ ] Review and update alerts

## Troubleshooting

### No Data in Sentry

**Checks**:
1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check Sentry initialized: `initSentry()` called
3. Check browser console for errors
4. Verify sampling rate not too low

### Missing Analytics Events

**Checks**:
1. Verify Analytics component added to app
2. Check `window.va` exists in browser
3. Verify events triggered in code
4. Check ad blockers disabled

### Health Checks Failing

**Checks**:
1. Test endpoints manually: `curl /api/health`
2. Check service connectivity (database, cache)
3. Review error logs in Sentry
4. Verify environment variables set

## Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Vercel Analytics**: https://vercel.com/docs/analytics
- **Web Vitals**: https://web.dev/vitals/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse

---

**Last Updated**: 2025-11-21
**Maintained By**: Platform Team
