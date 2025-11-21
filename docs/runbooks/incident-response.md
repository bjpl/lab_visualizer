# Incident Response Runbook

## Overview

This runbook provides step-by-step procedures for responding to production incidents in the LAB Visualizer application.

## Severity Levels

### P0 - Critical (Complete Outage)
- **Definition**: Application completely unavailable or data loss occurring
- **Response Time**: Immediate (< 15 minutes)
- **Examples**: Database down, complete site outage, data corruption

### P1 - High (Major Degradation)
- **Definition**: Core features unavailable or severely degraded
- **Response Time**: < 1 hour
- **Examples**: PDB loading failures, authentication broken, export functions down

### P2 - Medium (Partial Degradation)
- **Definition**: Non-critical features affected
- **Response Time**: < 4 hours
- **Examples**: Slow performance, minor feature issues, cosmetic bugs

### P3 - Low (Minor Issue)
- **Definition**: Minimal user impact
- **Response Time**: < 24 hours
- **Examples**: UI glitches, documentation errors

## Incident Response Process

### 1. Detection & Alert

**Monitoring Sources:**
- Vercel deployment alerts
- Sentry error tracking
- Health check failures
- User reports
- Analytics anomalies

**Initial Steps:**
1. Acknowledge the alert
2. Assess severity level
3. Create incident ticket
4. Notify team if P0/P1

### 2. Initial Assessment (5 minutes)

**Quick Checks:**
```bash
# Check health endpoints
curl https://lab-visualizer.vercel.app/api/health
curl https://lab-visualizer.vercel.app/api/health/ready
curl https://lab-visualizer.vercel.app/api/health/live

# Check Vercel deployment status
vercel ls --prod

# Check recent deployments
vercel deployments --prod --limit 5

# Check Sentry for recent errors
# Visit: https://sentry.io/organizations/lab-visualizer/issues/
```

**Key Questions:**
- When did the issue start?
- What percentage of users are affected?
- Is data at risk?
- Can we reproduce it?

### 3. Triage & Containment

#### For Database Issues (P0)
```bash
# Check Supabase status
# Visit: https://status.supabase.com

# Check database health from Supabase dashboard
# https://app.supabase.com/project/[PROJECT_ID]/database/tables

# Check RLS policies are active
# Review recent database migrations

# If needed, restore from backup
supabase db dump -f backup.sql
```

#### For Deployment Issues (P0/P1)
```bash
# Rollback to previous deployment
vercel rollback [DEPLOYMENT_URL]

# Or promote specific stable deployment
vercel promote [DEPLOYMENT_URL] --prod
```

#### For Cache Issues (P1)
```bash
# Flush Vercel KV cache
npx @vercel/kv-cli flush

# Or via API
curl -X POST https://lab-visualizer.vercel.app/api/cache/flush \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### For Performance Issues (P1/P2)
```bash
# Check Vercel analytics for slow routes
# Visit: https://vercel.com/[team]/lab-visualizer/analytics

# Review Sentry performance metrics
# https://sentry.io/organizations/lab-visualizer/performance/

# Check cache hit rates in monitoring dashboard
```

### 4. Investigation

**Data Collection:**
```bash
# Export recent logs
vercel logs [DEPLOYMENT_URL] > incident-logs.txt

# Export Sentry events
# Use Sentry API or UI to export error details

# Check Supabase logs
# https://app.supabase.com/project/[PROJECT_ID]/logs/explorer

# Review recent deployments
git log --oneline -10

# Check environment variables
vercel env ls
```

**Common Issues & Solutions:**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Database connection pool exhausted | 500 errors, timeout | Increase pool size, restart functions |
| Cache invalidation failure | Stale data shown | Manual cache flush |
| PDB API rate limiting | Failed structure loads | Implement exponential backoff |
| Memory leak | Increasing response times | Identify leak, deploy fix |
| Auth token expiration | 401 errors | Check Supabase auth config |

### 5. Resolution

**Fix Deployment:**
```bash
# For code fixes
git checkout -b hotfix/incident-[ID]
# Make fixes
git commit -m "fix: [description] (resolves incident [ID])"
git push origin hotfix/incident-[ID]

# Deploy hotfix
vercel --prod

# Or fast-track through CI/CD
# Merge to main and auto-deploy
```

**Configuration Fixes:**
```bash
# Update environment variables
vercel env add [KEY] [VALUE] production

# Update secrets
vercel secrets add [NAME] [VALUE]

# Redeploy to pick up new config
vercel --prod --force
```

**Database Fixes:**
```bash
# Run migration
supabase db push

# Or execute SQL directly
supabase db reset
supabase migration up
```

### 6. Verification

**Post-Resolution Checks:**
```bash
# Verify health endpoints
curl https://lab-visualizer.vercel.app/api/health

# Run smoke tests
npm run test:smoke

# Check core user flows
# - Load a PDB structure
# - Run a simulation
# - Export a model
# - Create collaboration session

# Monitor error rates in Sentry
# Should return to baseline within 5 minutes

# Check Vercel analytics
# Response times should normalize
```

### 7. Communication

**Status Updates:**
- **Initial**: Incident detected, investigating
- **Progress**: Root cause identified, implementing fix
- **Resolution**: Fix deployed, monitoring for stability
- **Closure**: Incident resolved, postmortem scheduled

**Notification Channels:**
- Slack #incidents channel
- Email to stakeholders for P0/P1
- Status page update if needed

### 8. Post-Incident Review

**Within 48 hours, complete:**

1. **Incident Timeline**
   - Detection time
   - Response time
   - Resolution time
   - Total downtime

2. **Root Cause Analysis**
   - What happened?
   - Why did it happen?
   - Why wasn't it caught earlier?

3. **Action Items**
   - Prevent recurrence
   - Improve detection
   - Update runbooks
   - Add monitoring

4. **Documentation Updates**
   - Update this runbook
   - Document new patterns
   - Share learnings

## Common Incident Scenarios

### Scenario 1: Complete Site Down (P0)

**Symptoms:** Users see 503 errors, health checks failing

**Steps:**
1. Check Vercel status: `vercel ls --prod`
2. Check recent deployment: `vercel deployments`
3. If bad deployment, rollback: `vercel rollback`
4. If infrastructure, check Vercel/Supabase status pages
5. Verify resolution with health checks
6. Monitor for 15 minutes

### Scenario 2: Database Connection Failures (P0)

**Symptoms:** "Connection timeout" errors in Sentry

**Steps:**
1. Check Supabase dashboard for connection pool usage
2. Verify database is running: `curl https://[PROJECT].supabase.co/rest/v1/`
3. Check RLS policies aren't blocking connections
4. Scale up connection pool if needed
5. Restart serverless functions if connections are leaked
6. Monitor database CPU/memory usage

### Scenario 3: PDB Structure Loading Failures (P1)

**Symptoms:** Structures fail to load, timeout errors

**Steps:**
1. Test RCSB PDB API: `curl https://data.rcsb.org/rest/v1/core/entry/1ATP`
2. Check fallback sources (PDB EU, PDB JP)
3. Verify cache is not returning corrupted data
4. Check rate limiting isn't blocking requests
5. Increase timeout values if needed
6. Add retry logic if missing

### Scenario 4: Performance Degradation (P1)

**Symptoms:** Slow page loads, high response times

**Steps:**
1. Check Vercel analytics for slow routes
2. Review Sentry performance traces
3. Check database query performance
4. Verify cache hit rates
5. Look for N+1 queries or missing indexes
6. Check for memory leaks
7. Review bundle size for bloat

### Scenario 5: Authentication Issues (P1)

**Symptoms:** Users can't log in, 401 errors

**Steps:**
1. Check Supabase auth status
2. Verify JWT secret hasn't changed
3. Check token expiration settings
4. Test OAuth providers (Google, GitHub)
5. Verify CORS configuration
6. Check auth cookies aren't blocked

## Emergency Contacts

- **On-Call Engineer**: [Slack @oncall]
- **Database Admin**: [Contact info]
- **Platform Lead**: [Contact info]
- **External Support**:
  - Vercel Support: https://vercel.com/support
  - Supabase Support: https://supabase.com/support

## Monitoring & Alerting

**Key Dashboards:**
- Vercel Analytics: https://vercel.com/[team]/lab-visualizer/analytics
- Sentry Performance: https://sentry.io/[org]/lab-visualizer/performance
- Supabase Logs: https://app.supabase.com/project/[id]/logs

**Alert Thresholds:**
- Error rate > 5% → P1 alert
- Response time p95 > 3s → P2 alert
- Health check failures → P0 alert
- Database CPU > 80% → P1 alert

## Rollback Procedures

### Application Rollback
```bash
# List recent deployments
vercel deployments --prod --limit 10

# Identify last stable deployment
vercel inspect [DEPLOYMENT_URL]

# Rollback to stable version
vercel rollback [DEPLOYMENT_URL]

# Or promote specific deployment
vercel promote [DEPLOYMENT_URL] --prod

# Verify rollback successful
curl https://lab-visualizer.vercel.app/api/health
```

### Database Rollback
```bash
# Create backup first
supabase db dump -f pre-rollback-backup.sql

# Rollback migration
supabase migration down

# Or restore from backup
supabase db reset
psql -f backup.sql

# Verify data integrity
npm run test:integration
```

### Cache Rollback
```bash
# Clear potentially corrupted cache
npx @vercel/kv-cli flush

# Or clear specific keys
npx @vercel/kv-cli del "cache:*"

# Warm cache with known good data
npm run cache:warm
```

## Testing After Resolution

**Critical User Flows:**
1. Load homepage
2. Search for PDB structure (e.g., "1ATP")
3. View 3D visualization
4. Toggle visualization controls
5. Run simple simulation
6. Export to PDF
7. Create collaboration session

**Performance Validation:**
```bash
# Run Lighthouse audit
npm run lighthouse:audit

# Check Core Web Vitals
# LCP < 2.5s
# FID < 100ms
# CLS < 0.1

# Verify no console errors
```

## Postmortem Template

```markdown
# Incident Postmortem: [TITLE]

**Date**: [Date]
**Severity**: P[0-3]
**Duration**: [X hours/minutes]
**Impact**: [X users affected, Y% of traffic]

## Summary
[Brief description of what happened]

## Timeline
- HH:MM - Incident detected
- HH:MM - Investigation began
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
[Technical explanation of what caused the incident]

## Resolution
[What was done to fix it]

## Impact
- Users affected: [number]
- Revenue impact: [if applicable]
- Downtime: [duration]

## Action Items
- [ ] [Preventive measure 1]
- [ ] [Monitoring improvement]
- [ ] [Documentation update]
- [ ] [Code fix]

## Lessons Learned
[What we learned and how we'll improve]
```

---

**Last Updated**: 2025-11-21
**Next Review**: Quarterly or after major incidents
