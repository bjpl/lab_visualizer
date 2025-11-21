# Production Deployment Validation

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] Test coverage ≥75% (`npm run test:coverage`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console.log statements in production code
- [ ] No TODO/FIXME in critical paths

### Security

- [ ] All dependencies up to date (`npm audit`)
- [ ] No known vulnerabilities (severity: moderate or higher)
- [ ] Environment variables properly configured
- [ ] No secrets in code or version control
- [ ] CORS configured correctly
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Authentication working
- [ ] RLS policies active and tested

### Performance

- [ ] Lighthouse score ≥85 (`npm run lighthouse:audit`)
- [ ] Core Web Vitals meet thresholds:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- [ ] Bundle size within budget (<500KB)
- [ ] Images optimized
- [ ] Cache strategy implemented

### Infrastructure

- [ ] Database migrations applied
- [ ] Database backups configured
- [ ] Health checks responding
- [ ] Monitoring configured (Sentry, Vercel Analytics)
- [ ] Error tracking active
- [ ] Alerts configured
- [ ] CDN configured for static assets

### Documentation

- [ ] README up to date
- [ ] API documentation current
- [ ] Deployment runbook updated
- [ ] Incident response plan reviewed
- [ ] Environment variables documented

## Deployment Process

### 1. Pre-Deployment Verification

```bash
# Run full test suite
npm run test:ci

# Type check
npm run typecheck

# Lint
npm run lint

# Build production bundle
npm run build

# Verify bundle size
ls -lh .next/static/chunks/*.js

# Run Lighthouse audit
npm run lighthouse:audit
```

### 2. Database Preparation

```bash
# Create database backup
supabase db dump -f pre-deploy-backup-$(date +%Y%m%d).sql

# Review pending migrations
supabase migration list

# Test migrations on staging
supabase db push --db-url $STAGING_DATABASE_URL

# Apply migrations to production
supabase db push --db-url $PRODUCTION_DATABASE_URL

# Verify migrations succeeded
supabase db diff --db-url $PRODUCTION_DATABASE_URL
```

### 3. Environment Configuration

```bash
# Verify all required environment variables
vercel env ls production

# Check for missing variables
cat .env.example | grep -o '^[A-Z_]*' | while read var; do
  vercel env ls production | grep -q $var || echo "Missing: $var"
done

# Add any missing variables
vercel env add [KEY] production

# Pull latest environment (for local verification)
vercel env pull .env.production
```

### 4. Deploy to Production

```bash
# Deploy via Vercel CLI
vercel --prod

# Or via Git (automatic deployment)
git checkout main
git pull origin main
git merge [feature-branch]
git push origin main

# Monitor deployment
vercel logs --prod --follow
```

### 5. Post-Deployment Smoke Tests

```bash
# Wait for deployment to complete (30-60 seconds)

# Check health endpoints
curl https://lab-visualizer.vercel.app/api/health
# Expected: {"status":"healthy",...}

curl https://lab-visualizer.vercel.app/api/health/ready
# Expected: {"ready":true,...}

curl https://lab-visualizer.vercel.app/api/health/live
# Expected: {"alive":true,...}

# Test critical API endpoints
curl https://lab-visualizer.vercel.app/api/pdb/1ATP
# Expected: PDB structure data

# Check homepage loads
curl -I https://lab-visualizer.vercel.app
# Expected: 200 OK

# Verify authentication
curl https://lab-visualizer.vercel.app/api/auth/session
# Expected: Session data or 401 Unauthorized
```

### 6. Functional Validation

**Manual Testing Checklist:**

- [ ] Homepage loads successfully
- [ ] User can search for PDB structures
- [ ] 3D viewer renders correctly
  - Test structure: 1ATP (small)
  - Test structure: 1HTQ (medium)
  - Test structure: 3J3Q (large)
- [ ] Viewer controls work (rotate, zoom, reset)
- [ ] LOD system activates for large structures
- [ ] Export functions work (PDF, PNG, PDB)
- [ ] Authentication flow works
  - Sign up
  - Login
  - Logout
  - OAuth (Google, GitHub)
- [ ] Collaboration features functional
  - Create session
  - Join session
  - Share screen
  - Add annotations
- [ ] Learning modules accessible
- [ ] Job queue functional (if applicable)

### 7. Performance Validation

```bash
# Run Lighthouse audit on production
npm run lighthouse:audit https://lab-visualizer.vercel.app

# Check Core Web Vitals in Vercel Analytics
# Visit: https://vercel.com/[team]/lab-visualizer/analytics

# Monitor performance for 15 minutes
# - Response times should be stable
# - No memory leaks
# - Error rate < 1%
```

### 8. Monitoring Setup Verification

```bash
# Check Sentry integration
# Visit: https://sentry.io/organizations/[org]/issues/

# Trigger test error
curl https://lab-visualizer.vercel.app/api/test-error

# Verify error appears in Sentry (within 1 minute)

# Check Vercel Analytics
# Visit: https://vercel.com/[team]/lab-visualizer/analytics
# Should show recent deployment

# Verify custom events tracking
# Load a structure and check for 'structure_load' event
```

### 9. Database Health Check

```bash
# Check database connection pool usage
# Supabase Dashboard → Database → Connection Pooling

# Verify RLS policies active
supabase db execute "SELECT * FROM pg_policies"

# Check recent activity
# Supabase Dashboard → Logs → Database Logs

# Test database performance
curl https://lab-visualizer.vercel.app/api/health | jq '.checks.database'
# Expected: {"status":"pass","responseTime":<500,...}
```

### 10. Cache Validation

```bash
# Check cache hit rates
curl https://lab-visualizer.vercel.app/api/health | jq '.checks.cache'

# Test cache layers
# L1 (IndexedDB): Load structure twice, check Network tab
# L2 (Vercel KV): Check KV dashboard for hits
# L3 (Supabase): Check storage access logs

# Warm cache with popular structures
npm run cache:warm
```

## Post-Deployment Monitoring

### First Hour

**Monitor every 5 minutes:**
- Error rate in Sentry
- Response times in Vercel Analytics
- Health check status
- User traffic patterns

**Alert Thresholds:**
- Error rate > 5% → Investigate immediately
- Response time p95 > 5s → Check for issues
- Health check failures → Rollback consideration

### First 24 Hours

**Monitor every hour:**
- Database performance
- Cache hit rates
- API success rates
- User engagement metrics

**Success Criteria:**
- Error rate < 1%
- Response time p95 < 3s
- Health checks 100% pass
- Cache hit rate > 70%
- Zero security incidents

### Ongoing (First Week)

**Monitor daily:**
- Performance trends
- Cost metrics
- User feedback
- Feature usage

## Rollback Procedure

### When to Rollback

**Immediate rollback if:**
- Error rate > 25%
- Complete feature failure
- Security vulnerability exposed
- Data corruption detected
- Critical user flows broken

**Consider rollback if:**
- Error rate > 10% for >15 minutes
- Major performance degradation
- Database connection issues
- Cache failures affecting UX

### Rollback Steps

```bash
# 1. Identify last stable deployment
vercel deployments --prod --limit 10

# 2. Announce rollback
# Post in Slack: "Rolling back production due to [reason]"

# 3. Execute rollback
vercel rollback [STABLE_DEPLOYMENT_URL]

# 4. Verify rollback successful
curl https://lab-visualizer.vercel.app/api/health

# 5. Monitor for stability (15 minutes)
# Watch error rate return to baseline

# 6. If database migrations were applied
# Restore from backup if needed
supabase db reset
psql -f pre-deploy-backup-[date].sql

# 7. Notify stakeholders
# Post in Slack: "Rollback complete, investigating issue"

# 8. Create incident postmortem
# Follow incident response runbook
```

## Validation Report Template

```markdown
# Production Deployment Validation Report

**Date**: [YYYY-MM-DD]
**Version**: [vX.Y.Z]
**Deployment ID**: [Vercel deployment ID]
**Deployed By**: [Name]

## Pre-Deployment Checks

- [x] Tests passing
- [x] Type checking passed
- [x] Linting passed
- [x] Build successful
- [x] Lighthouse score: 87/100 ✅
- [x] Security audit: 0 vulnerabilities ✅

## Deployment

- **Start Time**: [HH:MM UTC]
- **End Time**: [HH:MM UTC]
- **Duration**: [X minutes]
- **Method**: [Git push / CLI deploy]

## Post-Deployment Validation

### Health Checks
- [x] /api/health: healthy
- [x] /api/health/ready: ready
- [x] /api/health/live: alive

### Smoke Tests
- [x] Homepage loads
- [x] PDB structure loads (1ATP)
- [x] 3D viewer renders
- [x] Authentication works
- [x] Export functions work

### Performance
- **Lighthouse Score**: 87/100
- **LCP**: 2.1s ✅
- **FID**: 45ms ✅
- **CLS**: 0.05 ✅
- **Response Time p95**: 1.2s ✅

### Monitoring
- [x] Sentry receiving events
- [x] Vercel Analytics tracking
- [x] Custom events logging
- [x] Error rate: 0.2% ✅

## Issues Found

[None / List issues and resolutions]

## Sign-Off

- **Deployment Status**: ✅ SUCCESSFUL
- **Production Ready**: ✅ YES
- **Rollback Required**: ❌ NO
- **Monitoring Active**: ✅ YES

**Approved By**: [Name]
**Date**: [YYYY-MM-DD HH:MM UTC]
```

## Success Metrics

### Deployment Quality

- **Fast**: Deployment completes in <5 minutes
- **Reliable**: Zero downtime during deployment
- **Automated**: 80%+ checks automated
- **Safe**: Rollback procedure tested and ready

### Production Health

- **Performance**: Lighthouse score ≥85
- **Reliability**: Uptime ≥99.9%
- **Security**: Zero critical vulnerabilities
- **Monitoring**: 100% coverage of critical paths

### User Experience

- **Fast**: Page load <3s
- **Smooth**: No visual jank (CLS <0.1)
- **Reliable**: Error rate <1%
- **Responsive**: API response time <500ms

---

**Last Updated**: 2025-11-21
**Next Review**: After each major deployment
