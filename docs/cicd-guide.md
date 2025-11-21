# CI/CD Pipeline Guide

## Overview

This document describes the comprehensive CI/CD pipeline for the Lab Visualizer project. Our pipeline ensures code quality, security, and reliability through automated testing, quality gates, and deployment workflows.

## Table of Contents

1. [Pipeline Architecture](#pipeline-architecture)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Quality Gates](#quality-gates)
4. [Deployment Process](#deployment-process)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Best Practices](#best-practices)

## Pipeline Architecture

### Pipeline Stages

```
┌─────────────┐
│   Commit    │
│   to Repo   │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────────────┐
│  Stage 1: Code Quality & Security           │
│  - Linting (ESLint)                         │
│  - Type Checking (TypeScript)               │
│  - Format Validation (Prettier)             │
│  - Security Scanning (Snyk, CodeQL)         │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Stage 2: Testing                           │
│  - Unit Tests (Vitest)                      │
│  - Integration Tests                        │
│  - E2E Tests (Playwright)                   │
│  - Coverage Analysis (≥75%)                 │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Stage 3: Build & Bundle Analysis           │
│  - TypeScript Compilation                   │
│  - Vite Production Build                    │
│  - Bundle Size Analysis (≤500KB)            │
│  - Asset Optimization                       │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Stage 4: Quality Gate                      │
│  - Verify all checks passed                 │
│  - Lighthouse Score ≥85                     │
│  - Security vulnerabilities = 0             │
│  - Coverage ≥75%                            │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Stage 5: Deployment                        │
│  - Preview (on PR)                          │
│  - Staging (on main merge)                  │
│  - Production (manual/scheduled)            │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  Stage 6: Post-Deployment                   │
│  - Health Checks                            │
│  - Smoke Tests                              │
│  - Performance Monitoring                   │
│  - Error Tracking (Sentry)                  │
└─────────────────────────────────────────────┘
```

## GitHub Actions Workflows

### 1. Main CI Workflow (`ci.yml`)

**Trigger:** Push to `main`/`develop`, Pull Requests

**Jobs:**
- **lint**: ESLint validation and format checking
- **test**: Unit and integration tests with coverage
- **e2e**: Playwright end-to-end tests
- **build**: Production build and bundle analysis
- **security**: npm audit and Snyk scanning
- **quality-gate**: Aggregate check enforcement

**Key Features:**
- Parallel job execution for speed
- Coverage threshold enforcement (75%)
- Bundle size limits (500KB)
- Automatic PR comments with results

### 2. Security Scanning Workflow (`security-scan.yml`)

**Trigger:** Daily schedule, Push, Pull Requests, Manual

**Jobs:**
- **dependency-audit**: npm audit for known vulnerabilities
- **snyk-scan**: Comprehensive Snyk security analysis
- **codeql-analysis**: GitHub CodeQL static analysis
- **secret-scanning**: TruffleHog and Gitleaks for secrets
- **dependency-review**: Review new dependency risks

**Thresholds:**
- Critical vulnerabilities: 0 allowed
- High vulnerabilities: 0 allowed
- Moderate vulnerabilities: ≤5 allowed

### 3. Deployment Workflows

#### Preview Deployment (`deploy-preview.yml`)

**Trigger:** Pull Request open/update

**Features:**
- Automatic Vercel preview deployment
- Visual regression testing
- PR comment with preview URL
- Automatic cleanup on PR close

#### Production Deployment (`deploy-production.yml`)

**Trigger:** Push to `main`, Manual

**Features:**
- Pre-deployment validation
- Sentry release tracking
- Smoke tests after deployment
- Post-deployment monitoring

### 4. Parallel Testing (`parallel-tests.yml`)

**Trigger:** Push, Pull Requests

**Matrix Strategy:**
- Node versions: 18, 20
- Test suites: unit, integration, performance, e2e

**Features:**
- Parallel test execution (2.8-4.4x faster)
- Coverage report merging
- Comprehensive test summary

### 5. Rollback Workflow (`rollback.yml`)

**Trigger:** Manual with parameters

**Parameters:**
- `deployment_id`: Deployment to rollback from
- `reason`: Rollback reason
- `environment`: Target environment

**Process:**
1. Validate rollback conditions
2. Find previous stable deployment
3. Run pre-rollback tests
4. Execute deployment rollback
5. Run health checks
6. Create incident report
7. Monitor for 5 minutes

### 6. Lighthouse Performance (`lighthouse.yml`)

**Trigger:** Pull Requests, Push to `main`

**Features:**
- Performance budgets
- Web Vitals tracking
- Automated PR comments with scores

**Thresholds:**
- Performance: ≥85
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥90

## Quality Gates

### Configuration

Quality gates are defined in `/config/ci/quality-gates.json` and enforced at multiple stages.

### Gate Types

#### 1. PR Gate (Pull Request)
Required checks:
- ✅ Linting passes
- ✅ Type checking passes
- ✅ Test coverage ≥75%
- ✅ Build succeeds
- ✅ Security scan passes

Optional checks:
- Lighthouse performance

#### 2. Staging Gate
All PR gate checks plus:
- ✅ E2E tests pass
- ✅ Bundle size within limits
- ✅ Visual regression tests

#### 3. Production Gate
All staging gate checks plus:
- ✅ Lighthouse scores meet thresholds
- ✅ Smoke tests pass
- ✅ Manual approval required

### Running Quality Gates Locally

```bash
# Run all quality checks
npm run validate

# Run quality gate script
npm run ci:quality-gate

# Run specific checks
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

## Deployment Process

### Preview Deployments (Pull Requests)

1. **Automatic Trigger**: When PR is opened or updated
2. **Build**: Application built with preview configuration
3. **Deploy**: Deploy to Vercel preview environment
4. **Test**: Run visual regression tests
5. **Notify**: Comment on PR with preview URL and checklist

### Staging Deployments

1. **Trigger**: Merge to `develop` branch
2. **Validate**: Run full test suite
3. **Build**: Production build with staging config
4. **Deploy**: Deploy to staging environment
5. **Verify**: Run smoke tests
6. **Monitor**: Track initial traffic and errors

### Production Deployments

1. **Approval**: Manual approval required
2. **Pre-deployment**:
   - Run all tests
   - Verify build
   - Security audit
   - Bundle size check
3. **Deploy**:
   - Create Sentry release
   - Deploy to Vercel production
   - Tag deployment in git
4. **Post-deployment**:
   - Run smoke tests
   - Lighthouse audit
   - Monitor error rates
   - Verify key metrics

## Rollback Procedures

### When to Rollback

Trigger a rollback if:
- Critical bugs in production
- Severe performance degradation
- Security vulnerabilities introduced
- High error rates (>1%)
- User-facing functionality broken

### Rollback Process

#### Automated Rollback

```bash
# Trigger rollback workflow
# Go to Actions → Rollback → Run workflow
# Provide:
# - Deployment ID
# - Reason
# - Environment
```

#### Manual Rollback

```bash
# 1. Find previous stable commit
git log --oneline

# 2. Create rollback branch
git checkout -b rollback/production-fix <commit-hash>

# 3. Run tests
npm run test:all

# 4. Deploy
npm run deploy:production

# 5. Verify
npm run ci:health-check
```

### Post-Rollback

1. Create incident report issue
2. Monitor error rates for 30 minutes
3. Investigate root cause
4. Plan fix or hotfix
5. Update runbook

## Monitoring & Alerts

### Health Checks

Our health check system validates:

```bash
# Run health checks
BASE_URL=https://your-app.vercel.app npm run ci:health-check
```

**Checks:**
- ✅ Homepage accessibility (200 OK)
- ✅ API health endpoint
- ✅ Critical pages load
- ✅ Security headers present
- ✅ Response time <3s
- ✅ Page size reasonable

### Continuous Monitoring

**Vercel Analytics:**
- Real-time traffic monitoring
- Web Vitals tracking
- Performance metrics

**Sentry Error Tracking:**
- Real-time error alerts
- Release tracking
- Performance monitoring
- User impact analysis

**Lighthouse CI:**
- Daily performance audits
- Performance budget enforcement
- Historical trend tracking

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | >0.5% | >1% |
| Response Time | >2s | >5s |
| Availability | <99.5% | <99% |
| Lighthouse Performance | <90 | <85 |
| Bundle Size | >450KB | >500KB |

## Best Practices

### For Developers

1. **Always run tests locally before pushing**
   ```bash
   npm run validate
   ```

2. **Keep commits small and focused**
   - Easier to review
   - Faster CI runs
   - Simpler rollbacks

3. **Write meaningful commit messages**
   ```
   feat: add molecular structure caching
   fix: resolve WebGL memory leak
   test: add LOD transition tests
   ```

4. **Monitor your PR checks**
   - Fix failures immediately
   - Don't merge with warnings
   - Review Lighthouse scores

5. **Test deployments**
   - Verify preview deployments
   - Run smoke tests manually
   - Check console for errors

### For Reviewers

1. **Verify CI passes completely**
2. **Check coverage didn't decrease**
3. **Review bundle size changes**
4. **Test preview deployment**
5. **Validate security scan results**

### For DevOps

1. **Monitor daily security scans**
2. **Review dependency updates weekly**
3. **Check error rates after deployments**
4. **Maintain rollback readiness**
5. **Update runbooks after incidents**

## Scripts Reference

### CI/CD Scripts

```bash
# Quality gate enforcement
npm run ci:quality-gate

# Health check validation
npm run ci:health-check

# Rollback deployment
npm run ci:rollback

# Security scanning
npm run security:audit
npm run security:scan
```

### Testing Scripts

```bash
# All tests
npm run test:all

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Smoke tests
npm run test:smoke

# Visual regression
npm run test:visual
```

### Build Scripts

```bash
# Development build
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## Troubleshooting

### CI Build Failures

**Symptom:** Build fails in CI but works locally

**Solutions:**
1. Clear npm cache: `npm ci` instead of `npm install`
2. Check Node version matches CI (20.x)
3. Verify all env vars are set
4. Check for missing dependencies

### Test Failures

**Symptom:** Tests pass locally but fail in CI

**Solutions:**
1. Check for timing issues in tests
2. Verify test database is clean
3. Look for file system differences
4. Check for race conditions

### Deployment Failures

**Symptom:** Deployment fails or times out

**Solutions:**
1. Check Vercel status page
2. Verify build succeeds
3. Check env vars in Vercel
4. Review deployment logs
5. Try manual deployment

### Coverage Drops

**Symptom:** Coverage below 75% threshold

**Solutions:**
1. Identify uncovered files: `npm run test:coverage`
2. Add missing tests
3. Remove dead code
4. Update coverage config if needed

## Support

- **Documentation**: `/docs/`
- **Issues**: GitHub Issues
- **Deployments**: Vercel Dashboard
- **Monitoring**: Sentry Dashboard
- **CI Logs**: GitHub Actions

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0
**Maintained by**: DevOps Team
