# Deployment Runbook

## Overview

This runbook provides step-by-step procedures for deploying, monitoring, and troubleshooting the Lab Visualizer application.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedures](#deployment-procedures)
3. [Post-Deployment Validation](#post-deployment-validation)
4. [Rollback Procedures](#rollback-procedures)
5. [Incident Response](#incident-response)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Common Issues](#common-issues)

## Pre-Deployment Checklist

### Before Every Deployment

- [ ] All CI checks passed on the main branch
- [ ] Code review approved by at least 2 reviewers
- [ ] Test coverage ≥75%
- [ ] Security scan passed (0 critical/high vulnerabilities)
- [ ] Bundle size within limits (≤500KB)
- [ ] Lighthouse scores meet thresholds (Performance ≥85)
- [ ] Database migrations tested (if applicable)
- [ ] Environment variables updated in Vercel
- [ ] Feature flags configured (if applicable)
- [ ] Team notified of deployment window

### Production-Specific Checks

- [ ] Staging deployment tested and validated
- [ ] Load testing completed (if major changes)
- [ ] Rollback plan documented
- [ ] On-call engineer identified
- [ ] Deployment announcement sent
- [ ] Monitoring dashboards accessible
- [ ] Incident response team on standby

## Deployment Procedures

### Preview Deployment (Automatic)

Preview deployments are triggered automatically when a PR is opened or updated.

**Process:**
1. Open or update a Pull Request
2. Wait for CI checks to pass
3. GitHub Actions automatically deploys to Vercel preview
4. PR comment added with preview URL
5. Test preview deployment
6. Visual regression tests run automatically

**Validation:**
```bash
# Check preview deployment
curl -I https://lab-visualizer-<branch>.vercel.app

# Run smoke tests manually
BASE_URL=https://lab-visualizer-<branch>.vercel.app npm run test:smoke
```

### Staging Deployment (Automatic)

Staging deployments are triggered when code is merged to `develop`.

**Process:**
1. Merge approved PR to `develop`
2. CI pipeline runs all tests
3. GitHub Actions builds and deploys to staging
4. Automated smoke tests run
5. Team notified of staging deployment

**Validation:**
```bash
# Verify staging deployment
curl -I https://staging.lab-visualizer.vercel.app

# Run full E2E suite against staging
BASE_URL=https://staging.lab-visualizer.vercel.app npm run test:e2e

# Check health
BASE_URL=https://staging.lab-visualizer.vercel.app npm run ci:health-check
```

### Production Deployment (Manual Approval Required)

Production deployments require manual approval and should be done during low-traffic periods.

**Process:**

#### 1. Pre-Deployment (30 minutes before)

```bash
# Ensure you're on the latest main branch
git checkout main
git pull origin main

# Verify no uncommitted changes
git status

# Run local validation
npm run validate

# Check current production status
curl -I https://lab-visualizer.vercel.app
```

#### 2. Deployment Trigger

**Option A: Via GitHub Actions (Recommended)**

1. Go to GitHub Actions → Deploy Production workflow
2. Click "Run workflow"
3. Select `main` branch
4. Add deployment notes
5. Click "Run workflow"
6. Wait for approval request
7. Approve deployment (requires admin rights)

**Option B: Via Git Push**

```bash
# Push to main branch (requires CI to pass)
git push origin main
```

#### 3. During Deployment (5-10 minutes)

Monitor the deployment:

1. **Watch GitHub Actions logs**
   - Pre-deployment checks
   - Build process
   - Vercel deployment
   - Post-deployment tests

2. **Monitor Vercel dashboard**
   - Deployment progress
   - Build logs
   - Function logs

3. **Check Sentry**
   - No new errors appearing
   - Error rate stable

#### 4. Post-Deployment (15 minutes)

```bash
# Run health checks
BASE_URL=https://lab-visualizer.vercel.app npm run ci:health-check

# Run smoke tests
BASE_URL=https://lab-visualizer.vercel.app npm run test:smoke

# Monitor deployment
BASE_URL=https://lab-visualizer.vercel.app \
MONITOR_DURATION=300000 \
node scripts/ci/deployment-monitor.js
```

**Manual validation checklist:**

- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] Lab viewer renders molecules
- [ ] Search functionality works
- [ ] No console errors
- [ ] Mobile responsiveness intact
- [ ] All critical features functional

## Post-Deployment Validation

### Automated Checks

These run automatically after deployment:

1. **Health Checks** (2 minutes)
   - Homepage accessibility
   - API endpoints responding
   - Critical pages loading
   - Response times acceptable

2. **Smoke Tests** (5 minutes)
   - Core user flows
   - Authentication
   - Data fetching
   - Error handling

3. **Lighthouse Audit** (3 minutes)
   - Performance score
   - Accessibility score
   - Best practices score
   - SEO score

4. **Monitoring** (5 minutes)
   - Error rate tracking
   - Response time tracking
   - Availability tracking

### Manual Validation

**Critical User Flows:**

1. **Authentication Flow**
   ```
   - Visit homepage
   - Click "Sign In"
   - Enter credentials
   - Verify redirect to dashboard
   - Check user menu
   ```

2. **Lab Viewer Flow**
   ```
   - Navigate to /lab/1
   - Verify molecule renders
   - Test rotation/zoom
   - Change rendering mode
   - Test LOD transitions
   ```

3. **Search Flow**
   ```
   - Navigate to /search
   - Enter search query
   - Verify results display
   - Click on result
   - Verify detail page loads
   ```

### Metrics to Monitor

**First 15 Minutes:**
- Error rate should be <0.5%
- Response time P95 <3s
- Availability >99.5%

**First Hour:**
- Error rate stable or decreasing
- No new error types in Sentry
- User engagement metrics normal
- Performance metrics stable

**First 24 Hours:**
- Monitor Vercel Analytics dashboard
- Review Sentry error trends
- Check Web Vitals metrics
- Verify no user reports of issues

## Rollback Procedures

### When to Rollback

Trigger a rollback immediately if:

- 🔴 **Critical:** Error rate >1%
- 🔴 **Critical:** Application completely down
- 🔴 **Critical:** Data corruption detected
- 🔴 **Critical:** Security breach discovered
- 🟠 **High:** Core functionality broken for all users
- 🟠 **High:** Performance degradation >50%
- 🟠 **High:** Multiple high-severity bugs

Do NOT rollback for:
- Minor UI issues
- Single non-critical bug
- Feature requests
- Performance <25% degradation

### Automated Rollback

Use the GitHub Actions rollback workflow:

```bash
# 1. Go to GitHub Actions → Rollback workflow
# 2. Click "Run workflow"
# 3. Fill in parameters:
#    - deployment_id: <current-deployment-id>
#    - reason: "Critical bug: user authentication failing"
#    - environment: production
# 4. Click "Run workflow"
# 5. Monitor rollback progress
```

The automated rollback will:
1. Find previous stable deployment
2. Run tests on previous version
3. Deploy previous version
4. Run health checks
5. Create incident report
6. Monitor for 5 minutes

### Manual Rollback

If automated rollback fails:

```bash
# 1. Identify last stable commit
git log --oneline -10

# 2. Checkout stable commit
git checkout <stable-commit-hash>

# 3. Create rollback branch
git checkout -b rollback/production-$(date +%Y%m%d-%H%M%S)

# 4. Run tests
npm run test:all

# 5. Deploy to production
# Via Vercel CLI:
vercel --prod

# Or via git push:
git push origin rollback/production-<timestamp>

# 6. Verify rollback
BASE_URL=https://lab-visualizer.vercel.app npm run ci:health-check

# 7. Monitor
BASE_URL=https://lab-visualizer.vercel.app \
MONITOR_DURATION=300000 \
node scripts/ci/deployment-monitor.js
```

### Post-Rollback Actions

1. **Create incident report**
   ```bash
   # Automated via rollback workflow
   # Or manually create GitHub issue with label: incident
   ```

2. **Notify team**
   - Post in team channel
   - Update status page
   - Send user notification if needed

3. **Investigate root cause**
   - Review error logs
   - Analyze Sentry errors
   - Identify failing code
   - Create fix plan

4. **Plan hotfix or revert**
   - Create hotfix branch if quick fix available
   - Or plan proper fix for next deployment

## Incident Response

### Severity Levels

**P0 - Critical (Immediate Response)**
- Complete service outage
- Data loss or corruption
- Security breach
- Error rate >5%

**Response Time:** Immediate (5 minutes)
**Team:** Full on-call team
**Action:** Rollback immediately, investigate after

**P1 - High (Urgent Response)**
- Core feature broken for all users
- Authentication issues
- Error rate >1%
- Performance degradation >50%

**Response Time:** 15 minutes
**Team:** On-call engineer + DevOps
**Action:** Assess, rollback if needed, or hotfix

**P2 - Medium (Standard Response)**
- Non-critical feature broken
- Performance degradation <50%
- Error rate 0.5-1%

**Response Time:** 1 hour
**Team:** On-call engineer
**Action:** Investigate, plan fix for next deployment

**P3 - Low (Scheduled Response)**
- Minor UI issues
- Low-priority bugs
- Error rate <0.5%

**Response Time:** Next business day
**Team:** Development team
**Action:** Create issue, prioritize in backlog

### Incident Response Workflow

1. **Detection** (Automated alerts or manual discovery)
   - Monitor dashboards show anomaly
   - Sentry alert triggered
   - User report received
   - Health check fails

2. **Assessment** (5 minutes)
   - Determine severity
   - Identify affected users
   - Check recent deployments
   - Review error logs

3. **Communication** (Immediately after assessment)
   - Alert team in incident channel
   - Update status page
   - Notify stakeholders
   - Start incident log

4. **Mitigation** (P0/P1: immediate, P2: 1 hour)
   - Rollback if needed
   - Apply hotfix if available
   - Implement workaround
   - Monitor metrics

5. **Resolution**
   - Verify fix deployed
   - Run health checks
   - Monitor for recurrence
   - Update status page

6. **Post-Mortem** (Within 48 hours)
   - Document timeline
   - Identify root cause
   - List action items
   - Update runbook

## Monitoring & Alerts

### Dashboards

**Vercel Analytics**
- URL: https://vercel.com/dashboard/analytics
- Metrics: Traffic, performance, Web Vitals
- Check: Daily

**Sentry**
- URL: https://sentry.io/organizations/lab-visualizer
- Metrics: Errors, releases, performance
- Check: After every deployment, daily

**GitHub Actions**
- URL: https://github.com/<org>/<repo>/actions
- Metrics: Workflow runs, deployment status
- Check: On deployment, weekly

### Key Metrics

**Health Metrics:**
- Availability: >99.5%
- Error Rate: <0.5%
- Response Time P95: <3s
- Response Time P99: <5s

**Performance Metrics:**
- Lighthouse Performance: >85
- Time to First Byte: <500ms
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s

**Business Metrics:**
- Active users
- Session duration
- Conversion rate
- Feature usage

### Alert Thresholds

Configure alerts in Sentry/Vercel:

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | >0.5% | >1% |
| Response Time P95 | >2s | >5s |
| Availability | <99.5% | <99% |
| New Error Type | - | Any |

## Common Issues

### Issue: High Error Rate After Deployment

**Symptoms:**
- Sentry shows spike in errors
- Users report errors
- Error rate >1%

**Investigation:**
```bash
# Check Sentry for error details
# Review recent code changes
git log --since="1 hour ago" --oneline

# Check environment variables
vercel env ls

# Review deployment logs
vercel logs <deployment-url>
```

**Resolution:**
1. If error rate >1%: Rollback immediately
2. If error rate 0.5-1%: Investigate, prepare hotfix
3. Deploy hotfix or wait for next deployment

### Issue: Slow Performance

**Symptoms:**
- Lighthouse score dropped
- Users report slow loading
- Response time >3s

**Investigation:**
```bash
# Check bundle size
npm run build
du -sh dist/

# Run Lighthouse
npm run lighthouse

# Check for memory leaks
# Review recent performance changes
```

**Resolution:**
1. If performance <50% of normal: Consider rollback
2. Investigate bundle size increase
3. Check for inefficient queries
4. Review caching configuration

### Issue: Deployment Fails

**Symptoms:**
- GitHub Actions workflow fails
- Vercel deployment errors
- Build fails

**Investigation:**
```bash
# Check GitHub Actions logs
# Review build errors

# Try building locally
npm ci
npm run build

# Check Node version matches CI
node --version  # Should be 20.x
```

**Resolution:**
1. Fix build errors
2. Update dependencies if needed
3. Verify environment variables
4. Retry deployment

### Issue: Health Checks Fail

**Symptoms:**
- Health check script exits with error
- Endpoints not responding
- Timeouts

**Investigation:**
```bash
# Test manually
curl -I https://lab-visualizer.vercel.app
curl https://lab-visualizer.vercel.app/api/health

# Check Vercel function logs
vercel logs

# Verify DNS
nslookup lab-visualizer.vercel.app
```

**Resolution:**
1. Check Vercel function status
2. Verify environment variables
3. Check database connectivity
4. Review API errors in Sentry

## Emergency Contacts

**On-Call Rotation:**
- Primary: Check PagerDuty
- Secondary: Check PagerDuty
- Escalation: DevOps Lead

**Key Personnel:**
- DevOps Lead: [Contact Info]
- Engineering Manager: [Contact Info]
- CTO: [Contact Info]

**External Services:**
- Vercel Support: support@vercel.com
- Sentry Support: support@sentry.io

## Appendix

### Useful Commands

```bash
# Full validation
npm run validate

# Quality gate
npm run ci:quality-gate

# Health check
BASE_URL=<url> npm run ci:health-check

# Deployment monitoring
BASE_URL=<url> node scripts/ci/deployment-monitor.js

# Security scan
npm audit --json > audit-report.json
npm run security:scan

# Rollback
npm run ci:rollback
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | API base URL | Yes |
| `VITE_SENTRY_DSN` | Sentry DSN | Yes |
| `VITE_SENTRY_ENVIRONMENT` | Environment name | Yes |
| `VERCEL_TOKEN` | Vercel API token | Yes (CI) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | Yes (CI) |

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-21 | Initial runbook creation | DevOps Team |

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0
**Maintained by**: DevOps Team
