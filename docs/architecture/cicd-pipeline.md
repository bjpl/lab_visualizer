# CI/CD Pipeline Architecture

## Overview

The LAB Visualization Platform uses a comprehensive CI/CD pipeline built with GitHub Actions, ensuring code quality, performance, and reliability through automated testing and deployment.

## Pipeline Components

### 1. Continuous Integration (CI)

**Workflow**: `.github/workflows/ci.yml`

Runs on every push and pull request to `main` and `develop` branches.

#### Jobs

1. **Lint & Format Check**
   - ESLint validation
   - Prettier formatting check
   - TypeScript type checking
   - Ensures code quality standards

2. **Unit & Integration Tests**
   - Vitest test execution
   - Coverage reporting (80% minimum)
   - Codecov integration
   - Fast feedback on code changes

3. **E2E Tests (Playwright)**
   - Cross-browser testing (Chrome, Firefox, Safari)
   - Mobile viewport testing
   - Visual regression detection
   - Comprehensive user flow validation

4. **Build & Bundle Analysis**
   - Production build verification
   - Bundle size validation (500KB limit)
   - Tree-shaking analysis
   - Asset optimization check

5. **Security Audit**
   - npm audit for vulnerabilities
   - Snyk security scanning
   - Dependency vulnerability detection

6. **Quality Gate**
   - Aggregates all job results
   - Posts status to PR
   - Blocks merge on failures

### 2. Performance Monitoring

**Workflow**: `.github/workflows/lighthouse.yml`

#### Lighthouse CI
- Performance score > 90
- Accessibility checks
- Best practices validation
- SEO optimization
- Budget enforcement

#### Web Vitals Analysis
- Core Web Vitals tracking
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- Custom performance metrics

### 3. Preview Deployments

**Workflow**: `.github/workflows/deploy-preview.yml`

Runs on pull request events.

#### Features
- Automatic Vercel preview deployment
- Unique URL per PR
- Visual regression testing on preview
- PR comment with preview links
- Automatic cleanup on PR close

#### Testing Checklist
- Visual regression validation
- Cross-browser compatibility
- Mobile responsiveness
- Performance baseline comparison

### 4. Production Deployment

**Workflow**: `.github/workflows/deploy-production.yml`

Runs on merge to `main` branch.

#### Pre-Deployment
- Full test suite execution
- Build verification
- Bundle size check
- Security audit (production dependencies only)

#### Deployment
- Sentry release creation
- Source map upload
- Production build with optimizations
- Vercel production deployment

#### Post-Deployment
- Smoke tests on live site
- Lighthouse audit
- Traffic monitoring
- Error tracking via Sentry

## Testing Strategy

### Test Pyramid

```
        /\
       /  \
      / E2E\       10% - Critical user flows
     /------\
    /  Inte- \     30% - Component integration
   /   gration\
  /------------\
 /    Unit      \  60% - Business logic
/________________\
```

### Coverage Requirements

- **Overall**: 80% line coverage
- **Functions**: 80% function coverage
- **Branches**: 75% branch coverage
- **Statements**: 80% statement coverage

### Test Types

#### Unit Tests (Vitest)
- Pure functions
- Business logic
- Utility functions
- State management
- Custom hooks

**Location**: `src/**/*.test.{ts,tsx}`

#### Integration Tests (Testing Library)
- Component interactions
- API integration
- State updates
- User events
- Form validation

**Location**: `src/**/*.spec.{ts,tsx}`

#### E2E Tests (Playwright)
- Critical user paths
- Cross-browser compatibility
- Mobile responsiveness
- Performance validation
- Visual regression

**Location**: `e2e/**/*.spec.ts`

## Quality Gates

### Pre-Commit Hooks (Husky)

```bash
# .husky/pre-commit
npx lint-staged
npm run typecheck
```

### Pre-Push Hooks

```bash
# .husky/pre-push
npm run test:ci
npm run build
```

### Pull Request Requirements

- ✅ All CI jobs pass
- ✅ Code coverage meets thresholds
- ✅ No ESLint errors
- ✅ TypeScript type check passes
- ✅ Bundle size within limits
- ✅ Performance budget met
- ✅ Security audit clean

## Monitoring & Observability

### Vercel Analytics
- Real-time traffic monitoring
- Page view analytics
- User engagement metrics
- Geographic distribution

### Sentry Error Tracking
- Error capture and reporting
- Performance monitoring
- Release tracking
- User session replay
- Breadcrumb trail

### Web Vitals
- Core Web Vitals tracking
- Custom performance metrics
- Real user monitoring (RUM)
- Performance regression detection

### Custom Metrics

```typescript
// Performance tracking
performanceTracker.start('labDataLoad');
await fetchLabData();
performanceTracker.end('labDataLoad');

// Error tracking
try {
  await riskyOperation();
} catch (error) {
  captureError(error, { context: 'labVisualization' });
}
```

## Environment Configuration

### Required Secrets

#### Vercel
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### Sentry
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

#### Security
- `SNYK_TOKEN`
- `CODECOV_TOKEN`

### Environment Variables

```env
# Development
VITE_API_URL=http://localhost:8000
VITE_ENABLE_WEB_VITALS=false

# Preview
VITE_API_URL=https://preview-api.example.com
VITE_ENABLE_ANALYTICS=true

# Production
VITE_API_URL=https://api.example.com
VITE_SENTRY_DSN=https://...
VITE_SENTRY_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_VERCEL_ANALYTICS_ID=...
```

## Performance Budgets

### Lighthouse Budgets

```json
{
  "timings": {
    "interactive": 3000,
    "first-contentful-paint": 1500,
    "largest-contentful-paint": 2500,
    "total-blocking-time": 200
  },
  "resourceSizes": {
    "script": 500,
    "stylesheet": 50,
    "image": 200,
    "total": 1000
  }
}
```

### Bundle Size Limits
- JavaScript: 500KB (gzipped)
- CSS: 50KB (gzipped)
- Images: 200KB per page
- Total: 1MB initial load

## Deployment Flow

### Pull Request Flow

```
1. Developer pushes branch
2. CI workflow runs
   ├── Lint & type check
   ├── Unit tests
   ├── E2E tests
   └── Build verification
3. Preview deployment created
4. Lighthouse audit on preview
5. Manual review & approval
6. Merge to main
```

### Production Flow

```
1. Merge to main branch
2. Pre-deployment checks
   ├── Full test suite
   ├── Security audit
   └── Build verification
3. Sentry release creation
4. Deploy to Vercel production
5. Post-deployment monitoring
   ├── Smoke tests
   ├── Lighthouse audit
   └── Error monitoring
```

## Rollback Strategy

### Automatic Rollback Triggers
- Build failures
- Failed smoke tests
- Critical errors in Sentry (> 10/min)
- Performance degradation (Lighthouse < 70)

### Manual Rollback
```bash
# Revert to previous deployment
vercel rollback [deployment-url]

# Or use Vercel dashboard
```

## Continuous Improvement

### Metrics Tracked
- Build time trends
- Test execution time
- Bundle size over time
- Performance scores
- Error rates
- Deployment frequency

### Optimization Goals
- Keep build time < 5 minutes
- Maintain test execution < 3 minutes
- Zero security vulnerabilities
- Performance score > 90
- Error rate < 0.1%

## References

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)
- [Vercel Deployment](https://vercel.com/docs)
