# Operational Runbook: Cache & Rate Limiting System

## Overview

This runbook provides operational procedures for the multi-tier cache and rate limiting system.

**On-Call Contacts:**
- Primary: System Architect
- Secondary: DevOps Engineer
- Escalation: Engineering Manager

**System Status:** https://status.lab-visualizer.app

---

## Daily Operations

### Morning Health Check (10 minutes)

```bash
# 1. Check cache hit rates
curl -X POST https://api.lab-visualizer.app/internal/metrics/cache-stats \
  -H "Authorization: Bearer $INTERNAL_API_KEY" | jq

# Expected output:
# {
#   "l1_hit_rate": 0.30,
#   "l2_hit_rate": 0.35,
#   "l3_hit_rate": 0.25,
#   "combined_hit_rate": 0.70,
#   "timestamp": "2025-11-20T10:00:00Z"
# }

# 2. Check rate limit violations
curl -X POST https://api.lab-visualizer.app/internal/metrics/rate-limit-stats \
  -H "Authorization: Bearer $INTERNAL_API_KEY" | jq

# Expected output:
# {
#   "violation_rate": 0.03,
#   "violations_last_hour": 45,
#   "top_violators": [...]
# }

# 3. Check system costs
curl -X POST https://api.lab-visualizer.app/internal/metrics/costs \
  -H "Authorization: Bearer $INTERNAL_API_KEY" | jq

# Expected: ~$1.50/day ($46.50/month)
```

**Action Items:**
- ✅ Cache hit rate ≥ 65% → All good
- ⚠️ Cache hit rate 50-65% → Investigate cache warming
- 🚨 Cache hit rate < 50% → Immediate escalation

---

## Monitoring & Alerts

### Alert Thresholds

| Alert | Severity | Threshold | Action |
|-------|----------|-----------|--------|
| Low Cache Hit Rate | Warning | <60% for 1 hour | Investigate cache strategy |
| Very Low Cache Hit Rate | Critical | <40% for 15 min | Check cache availability |
| High Rate Limit Violations | Warning | >10% for 30 min | Review limit configs |
| L2 Cache Down | Critical | 3 failures in 60s | Check Vercel KV status |
| L3 Cache Down | Critical | 3 failures in 60s | Check Supabase status |
| High Latency | Warning | P95 >500ms for 10 min | Investigate bottlenecks |
| Cost Spike | Warning | >150% of daily budget | Review usage patterns |

### Dashboard URLs

- **Vercel Analytics:** https://vercel.com/dashboard/analytics
- **Vercel KV Metrics:** https://vercel.com/dashboard/storage
- **Supabase Dashboard:** https://app.supabase.com/project/[project-id]
- **Custom Metrics:** https://lab-visualizer.app/admin/metrics

---

## Common Issues & Resolution

### Issue 1: Low Cache Hit Rate

**Symptoms:**
- Cache hit rate drops below 60%
- Increased origin API calls
- Higher latency for users

**Diagnosis:**
```bash
# Check individual tier hit rates
npx vercel kv --env production keys "l2:*" | wc -l
# Should see ~1000+ keys for popular structures

# Check L3 storage
supabase storage ls pdb-files --recursive | wc -l
# Should see 500+ files
```

**Resolution:**
```bash
# 1. Run cache warming job manually
curl -X POST https://api.lab-visualizer.app/api/internal/cache/warm \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -d '{"count": 100}'

# 2. Check cache warming job status
npx vercel cron ls

# 3. If warming job failed, restart it
npx vercel cron trigger cache-warming
```

**Prevention:**
- Ensure cache warming runs daily at 2 AM UTC
- Monitor top requested PDB IDs
- Adjust cache strategy weights

---

### Issue 2: Rate Limiting Too Aggressive

**Symptoms:**
- High rate of 429 responses (>10%)
- User complaints about being blocked
- Many legitimate users hitting limits

**Diagnosis:**
```bash
# Check violation patterns
curl -X POST https://api.lab-visualizer.app/internal/metrics/violations \
  -H "Authorization: Bearer $INTERNAL_API_KEY" | jq '.top_violators'

# Check if legitimate users are affected
psql $DATABASE_URL -c "
  SELECT tier, COUNT(*)
  FROM rate_limit_events
  WHERE allowed = false
    AND timestamp > NOW() - INTERVAL '1 hour'
  GROUP BY tier;
"
```

**Resolution:**
```bash
# 1. Temporarily increase limits (emergency)
# Update environment variables in Vercel
vercel env add RATE_LIMIT_FREE_PER_MIN 50 production
vercel env add RATE_LIMIT_PRO_PER_MIN 200 production

# Deploy changes
git commit -am "Emergency: Increase rate limits"
git push origin main

# 2. Reset rate limit for specific user
curl -X POST https://api.lab-visualizer.app/api/internal/rate-limit/reset \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -d '{"userId": "user-123"}'

# 3. Analyze patterns to adjust permanent limits
```

**Prevention:**
- Review rate limits weekly
- Set generous burst allowance (2-3x base limit)
- Monitor violation trends

---

### Issue 3: Vercel KV (L2) Unavailable

**Symptoms:**
- High error rate in logs
- "Circuit breaker open" warnings
- Increased latency

**Diagnosis:**
```bash
# Check Vercel KV status
curl https://status.vercel.com/api/v2/status.json | jq

# Check error logs
vercel logs --follow | grep "L2Cache"

# Test KV connectivity
npx @vercel/kv-cli --token $KV_REST_API_TOKEN ping
```

**Resolution:**
```bash
# 1. Verify circuit breaker is open (automatic failover)
# System should automatically skip L2 and check L3

# 2. Check Vercel status page
open https://status.vercel.com

# 3. If Vercel incident is ongoing:
#    - Circuit breaker will recover automatically
#    - Monitor L3 hit rate (should increase)
#    - No manual action needed unless L3 also fails

# 4. If Vercel is operational but KV is down:
#    - Contact Vercel support
#    - File incident ticket
```

**Prevention:**
- Circuit breaker auto-recovers after 30s
- L3 cache provides fallback
- Origin API is final fallback

---

### Issue 4: Supabase Storage (L3) Unavailable

**Symptoms:**
- L3 cache misses increase
- Origin API load increases
- Slow response times

**Diagnosis:**
```bash
# Check Supabase status
curl https://status.supabase.com/api/v2/status.json | jq

# Test storage connectivity
supabase storage ls pdb-files

# Check storage bucket health
curl -X GET "https://[project].supabase.co/storage/v1/bucket/pdb-files" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

**Resolution:**
```bash
# 1. Verify circuit breaker is open
# System should skip L3 and fetch from origin

# 2. Check Supabase dashboard
open https://app.supabase.com/project/[project-id]

# 3. If storage bucket is corrupted:
supabase storage empty pdb-files
# Then trigger cache warming to repopulate

# 4. If Supabase incident is ongoing:
#    - Monitor status page
#    - System will serve from origin
#    - Re-populate L3 after recovery
```

**Prevention:**
- Regular backups to CloudFlare R2 (backup storage)
- Circuit breaker prevents cascading failures

---

### Issue 5: Cost Spike

**Symptoms:**
- Daily cost >$3 (>$90/month)
- Budget alert triggered
- Unexpected bandwidth usage

**Diagnosis:**
```bash
# Check bandwidth usage
curl -X POST https://api.lab-visualizer.app/internal/metrics/bandwidth \
  -H "Authorization: Bearer $INTERNAL_API_KEY" | jq

# Check top consumers
psql $DATABASE_URL -c "
  SELECT user_id, COUNT(*) as requests
  FROM request_logs
  WHERE timestamp > NOW() - INTERVAL '24 hours'
  GROUP BY user_id
  ORDER BY requests DESC
  LIMIT 10;
"

# Check Vercel KV costs
vercel kv stats

# Check Supabase storage costs
supabase storage usage
```

**Resolution:**
```bash
# 1. Identify abusive users
# Block user if abuse detected
curl -X POST https://api.lab-visualizer.app/api/internal/users/block \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -d '{"userId": "abuser-123", "reason": "Excessive usage"}'

# 2. Reduce cache TTLs temporarily
vercel env add CACHE_L2_TTL_HOURS 12 production  # Was 24
vercel env add CACHE_L3_TTL_DAYS 14 production   # Was 30

# 3. Review and adjust rate limits
# Implement stricter limits for anonymous users

# 4. Enable cost tracking alerts
vercel budget set --monthly 60 --alert-at 80
```

**Prevention:**
- Set budget alerts at 80% threshold
- Monitor cost dashboard daily
- Implement usage quotas per tier

---

## Maintenance Procedures

### Weekly Maintenance (Sundays 2-4 AM UTC)

```bash
# 1. Clear expired L3 cache entries (older than 30 days)
curl -X POST https://api.lab-visualizer.app/api/internal/cache/cleanup \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -d '{"olderThanDays": 30}'

# 2. Analyze cache performance
curl -X POST https://api.lab-visualizer.app/internal/metrics/weekly-report \
  -H "Authorization: Bearer $INTERNAL_API_KEY" > weekly-cache-report.json

# 3. Review and tune cache strategy
# Based on weekly report, adjust weights:
# - popularWeight: 0.4-0.7
# - recencyWeight: 0.2-0.4
# - relevanceWeight: 0.1-0.3

# 4. Backup critical cache data
supabase db dump > backup-$(date +%Y%m%d).sql
aws s3 cp backup-*.sql s3://lab-visualizer-backups/
```

### Monthly Maintenance (First Sunday of Month)

```bash
# 1. Review rate limit configurations
# Analyze violation patterns
psql $DATABASE_URL -c "
  SELECT tier, endpoint,
    COUNT(CASE WHEN allowed = false THEN 1 END) as violations,
    COUNT(*) as total_requests,
    ROUND(100.0 * COUNT(CASE WHEN allowed = false THEN 1 END) / COUNT(*), 2) as violation_rate
  FROM rate_limit_events
  WHERE timestamp > NOW() - INTERVAL '30 days'
  GROUP BY tier, endpoint
  ORDER BY violation_rate DESC;
"

# 2. Update cache warming list
# Refresh top 100 popular structures based on usage
curl -X POST https://api.lab-visualizer.app/api/internal/cache/update-popular \
  -H "Authorization: Bearer $INTERNAL_API_KEY"

# 3. Cost optimization review
# Compare actual costs vs projections
# Identify optimization opportunities

# 4. Performance benchmarking
# Run load tests to validate targets
k6 run --vus 1000 --duration 60s performance-test.js

# 5. Security audit
# Review access logs for anomalies
# Update rate limit policies if needed
```

---

## Deployment Procedures

### Deploying Cache Configuration Changes

```bash
# 1. Update configuration in git
git checkout -b feature/cache-config-update
vim src/lib/config/cache-config.ts
git commit -am "Update cache TTL configuration"
git push origin feature/cache-config-update

# 2. Deploy to staging
vercel --env preview

# 3. Test in staging
curl https://staging.lab-visualizer.app/api/structures/1HHO \
  -H "X-Debug: cache-stats" | jq '.cacheStats'

# 4. Verify metrics
# Wait 30 minutes, check hit rates

# 5. Deploy to production (gradual rollout)
# Merge PR
git checkout main && git pull
git merge feature/cache-config-update
git push origin main

# 6. Monitor production
vercel logs --follow | grep "Cache"

# 7. Verify hit rates
# Check dashboard after 1 hour
```

### Rolling Back Cache Changes

```bash
# 1. Identify last good deployment
vercel deployments ls

# 2. Roll back to previous deployment
vercel rollback [deployment-url]

# 3. Clear problematic cache entries
curl -X POST https://api.lab-visualizer.app/api/internal/cache/invalidate-all \
  -H "Authorization: Bearer $INTERNAL_API_KEY"

# 4. Monitor recovery
vercel logs --follow
```

---

## Performance Tuning

### Optimizing L2 Cache Hit Rate

**If L2 hit rate < 30%:**

```typescript
// Increase L2 TTL
CACHE_L2_TTL_HOURS=48  // Was 24

// Increase popular structure count
CACHE_WARMING_TOP_N=150  // Was 100

// Adjust cache strategy weights
popularWeight=0.6  // Was 0.5
recencyWeight=0.25  // Was 0.3
```

### Optimizing L3 Cache Hit Rate

**If L3 hit rate < 20%:**

```typescript
// Increase L3 TTL
CACHE_L3_TTL_DAYS=60  // Was 30

// Enable aggressive prefetching
CACHE_PREFETCH_ENABLED=true
CACHE_PREFETCH_DEPTH=3  // Related structures
```

### Reducing Rate Limit Violations

**If violation rate > 10%:**

```typescript
// Increase base limits
RATE_LIMIT_FREE_PER_MIN=40  // Was 30
RATE_LIMIT_PRO_PER_MIN=150  // Was 100

// Increase burst allowance
RATE_LIMIT_BURST_MULTIPLIER=3  // Was 2
```

---

## Disaster Recovery

### Complete L2 Cache Failure

**Recovery Time Objective (RTO): 5 minutes**

```bash
# 1. Circuit breaker opens automatically
# System falls back to L3 + Origin

# 2. Verify fallback working
curl https://api.lab-visualizer.app/api/structures/1HHO
# Should return 200 OK with X-Cache: L3 or X-Cache: MISS

# 3. Monitor L3 load
# L3 hit rate should spike to ~60%

# 4. Wait for Vercel KV recovery
# Check https://status.vercel.com

# 5. After recovery, warm L2 cache
curl -X POST https://api.lab-visualizer.app/api/internal/cache/warm
```

### Complete L3 Cache Failure

**Recovery Time Objective (RTO): 10 minutes**

```bash
# 1. Verify origin API can handle load
# Origin should serve ~50% of requests

# 2. Check RCSB PDB API rate limits
# Ensure we're not hitting their limits

# 3. If L3 corrupted, recreate bucket
supabase storage empty pdb-files
supabase storage delete-bucket pdb-files
supabase storage create-bucket pdb-files --public

# 4. Trigger full cache warming
curl -X POST https://api.lab-visualizer.app/api/internal/cache/warm \
  -d '{"full": true, "count": 500}'

# ETA: 2-3 hours for full restoration
```

### Complete System Failure

**Recovery Time Objective (RTO): 30 minutes**

```bash
# 1. Switch to backup infrastructure
# DNS failover to backup Vercel project

# 2. Restore from backups
aws s3 cp s3://lab-visualizer-backups/latest.sql backup.sql
psql $BACKUP_DATABASE_URL < backup.sql

# 3. Warm caches from scratch
# Start with top 50 most critical structures

# 4. Enable maintenance mode
vercel env add MAINTENANCE_MODE true production

# 5. Gradually restore service
# Increase rate limits as caches warm up
```

---

## Escalation Procedures

### Level 1: On-Call Engineer (You)

**Handle:**
- Cache hit rate warnings (60-50%)
- Minor rate limit adjustments
- Cost alerts (<150% of budget)
- Routine deployments

**Escalate if:**
- Issue persists >1 hour
- Cache hit rate <40%
- Cost spike >200%
- Unable to resolve

### Level 2: Senior Engineer

**Handle:**
- Complex performance issues
- Architecture changes
- Vercel/Supabase vendor issues
- Security incidents

**Escalate if:**
- System-wide outage
- Data loss
- Critical security breach

### Level 3: Engineering Manager

**Handle:**
- Major incidents
- Vendor escalation
- Business impact decisions
- Post-mortem coordination

---

## Useful Commands Cheatsheet

```bash
# Cache Operations
npx vercel kv get "l2:pdb:1hho"
npx vercel kv set "l2:pdb:1hho" '{"data":"..."}'
npx vercel kv del "l2:pdb:1hho"
supabase storage ls pdb-files
supabase storage download pdb-files/1HHO.pdb

# Rate Limiting
npx vercel kv get "ratelimit:user:123:global"
npx vercel kv del "ratelimit:user:123:global"

# Monitoring
vercel logs --follow --filter "error"
vercel logs --since 1h | grep "Cache"
supabase logs --type api --limit 100

# Metrics
curl https://api.lab-visualizer.app/internal/metrics/cache-stats
curl https://api.lab-visualizer.app/internal/metrics/rate-limit-stats

# Deployments
vercel --prod
vercel rollback [url]
vercel env ls

# Database
psql $DATABASE_URL -c "SELECT version();"
supabase db dump > backup.sql
```

---

## Post-Incident Checklist

After resolving an incident:

- [ ] Document incident in GitHub Issues
- [ ] Update runbook with new procedures
- [ ] Schedule post-mortem meeting
- [ ] Identify root cause
- [ ] Implement preventive measures
- [ ] Update alerts/monitoring
- [ ] Communicate to stakeholders
- [ ] Update SLA reports

---

## Contact Information

**Vercel Support:** support@vercel.com (Enterprise Plan)
**Supabase Support:** support@supabase.io (Pro Plan)
**RCSB PDB:** info@rcsb.org

**Internal:**
- Slack: #lab-visualizer-alerts
- PagerDuty: https://lab-visualizer.pagerduty.com
- Status Page: https://status.lab-visualizer.app
