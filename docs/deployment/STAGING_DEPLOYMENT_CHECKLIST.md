# Lab Visualizer - Staging Deployment Checklist

**Version**: 1.0.0
**Date**: 2025-11-22
**Phase**: Rapid Deployment Phase 2
**Target Environment**: Vercel Staging

---

## Quick Reference

```bash
# Pre-deployment validation
npm run validate && npm run build

# Deploy to staging
vercel --env-file .env.staging

# Run smoke tests
BASE_URL=https://lab-visualizer-staging.vercel.app npm run ci:health-check
```

---

## 1. Environment Variables Configuration

### Required Variables

| Variable | Description | How to Obtain | Required |
|----------|-------------|---------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard > Settings > API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard > Settings > API | Yes |
| `CSRF_SECRET` | CSRF protection secret | Generate: `openssl rand -hex 32` | Yes |
| `NODE_ENV` | Environment mode | Set to `production` | Yes |
| `NEXT_PUBLIC_VERCEL_ENV` | Vercel environment | Set to `preview` for staging | Yes |

### Optional Variables (Recommended)

| Variable | Description | How to Obtain | Default |
|----------|-------------|---------------|---------|
| `KV_REST_API_URL` | Vercel KV URL | Vercel Dashboard > Storage > KV | None |
| `KV_REST_API_TOKEN` | Vercel KV token | Vercel Dashboard > Storage > KV | None |
| `REDIS_HOST` | Redis host for rate limiting | Redis provider or self-hosted | localhost |
| `REDIS_PORT` | Redis port | Redis provider | 6379 |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | Sentry Dashboard > Settings > DSN | None |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | Sentry Dashboard > API > Auth Tokens | None |
| `RCSB_PDB_API_URL` | RCSB PDB API base URL | Default available | https://data.rcsb.org |

### Generating Secrets

```bash
# Generate CSRF secret
openssl rand -hex 32

# Example output: a1b2c3d4e5f6...

# Generate JWT secret (if needed)
openssl rand -base64 64
```

### Vercel Environment Setup

```bash
# Add required environment variables to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
# Enter value when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add CSRF_SECRET preview
vercel env add NODE_ENV preview  # Set to "production"

# Verify all variables are set
vercel env ls preview
```

---

## 2. Pre-Deployment Checklist

### Code Quality Gates

- [ ] **Tests Passing**: `npm run test` - All tests must pass
- [ ] **Type Safety**: `npm run typecheck` - No TypeScript errors
- [ ] **Linting**: `npm run lint` - No linting errors
- [ ] **Build Success**: `npm run build` - Build completes without errors
- [ ] **Coverage**: `npm run test:coverage` - Coverage >= 75%

### Security Checks

- [ ] **Dependency Audit**: `npm audit --production` - No high/critical vulnerabilities
- [ ] **Secrets Check**: No hardcoded secrets in codebase
- [ ] **Environment Files**: `.env*` files are in `.gitignore`
- [ ] **Rate Limiting**: Rate limiting middleware is configured
- [ ] **CSRF Protection**: CSRF tokens are generated and validated

### Database Readiness

- [ ] **Migrations**: All migrations applied to staging database
- [ ] **RLS Policies**: Row Level Security enabled on user tables
- [ ] **Storage Buckets**: Required buckets created (structures, exports)
- [ ] **Connection Test**: Database connection verified

---

## 3. Deployment Commands

### Option A: Vercel CLI Deployment

```bash
#!/bin/bash
# staging-deploy.sh

set -e

echo "=========================================="
echo "Lab Visualizer - Staging Deployment"
echo "=========================================="

# Step 1: Run pre-deployment checks
echo "[1/5] Running pre-deployment validation..."
npm run lint || { echo "Linting failed"; exit 1; }
npm run typecheck || { echo "Type check failed"; exit 1; }
npm run test || { echo "Tests failed"; exit 1; }

# Step 2: Build locally to verify
echo "[2/5] Building application..."
npm run build || { echo "Build failed"; exit 1; }

# Step 3: Security audit
echo "[3/5] Running security audit..."
npm audit --production --audit-level=high || echo "Warning: Security issues found"

# Step 4: Deploy to Vercel staging
echo "[4/5] Deploying to Vercel staging..."
vercel --no-production

# Step 5: Get deployment URL
echo "[5/5] Deployment complete!"
echo "Staging URL: Check Vercel dashboard for deployment URL"
echo ""
echo "Next step: Run smoke tests against staging"
```

### Option B: Git-Based Deployment

```bash
# Create staging branch if not exists
git checkout -b staging

# Merge latest changes
git merge main

# Push to trigger deployment
git push origin staging

# Vercel auto-deploys preview from non-main branches
```

---

## 4. Post-Deployment Verification

### Immediate Health Checks (< 5 minutes)

```bash
# Set staging URL
export STAGING_URL="https://lab-visualizer-staging.vercel.app"

# 1. Homepage accessibility
curl -s -o /dev/null -w "%{http_code}" $STAGING_URL
# Expected: 200

# 2. Health endpoint
curl -s $STAGING_URL/api/health | jq
# Expected: {"status":"healthy","timestamp":"..."}

# 3. Ready endpoint
curl -s $STAGING_URL/api/health/ready | jq
# Expected: {"ready":true,"checks":{...}}

# 4. Live endpoint
curl -s $STAGING_URL/api/health/live | jq
# Expected: {"alive":true}

# 5. Security headers check
curl -I $STAGING_URL 2>/dev/null | grep -E "^(x-frame|x-content|strict-transport|content-security)"
# Expected: Security headers present
```

### API Endpoint Verification

```bash
# PDB API - Fetch structure
curl -s "$STAGING_URL/api/pdb/1ATP" | jq '.id'
# Expected: "1ATP" or similar

# PDB Search
curl -s "$STAGING_URL/api/pdb/search?q=insulin" | jq '.results | length'
# Expected: > 0

# Learning modules
curl -s "$STAGING_URL/api/learning/modules" | jq '.modules | length'
# Expected: >= 1 (if modules exist)
```

---

## 5. Rollback Procedure

### Quick Rollback (< 2 minutes)

```bash
# List recent deployments
vercel deployments --limit 10

# Rollback to previous deployment
vercel rollback [PREVIOUS_DEPLOYMENT_URL]

# Verify rollback
curl -s $STAGING_URL/api/health
```

### Rollback Decision Matrix

| Condition | Action |
|-----------|--------|
| Error rate > 25% | Immediate rollback |
| Health checks failing | Immediate rollback |
| Critical feature broken | Immediate rollback |
| Performance degraded > 50% | Consider rollback |
| Minor UI issues | Fix forward (no rollback) |

---

## 6. Staging-Specific Configuration

### Feature Flags for Staging

```typescript
// Recommended staging feature flags
NEXT_PUBLIC_ENABLE_DEMO_MODE=true        // Enable demo features
NEXT_PUBLIC_ENABLE_COLLABORATION=true     // Test collaboration
NEXT_PUBLIC_ENABLE_MD_SIMULATIONS=false   // Disable expensive MD simulations
NEXT_PUBLIC_ENABLE_ANALYTICS=false        // Disable analytics tracking
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=true     // Enable debug logs
```

### Rate Limiting (Staging)

```bash
# Relaxed rate limits for testing
RATE_LIMIT_REQUESTS_PER_MINUTE=100  # Higher than production
RATE_LIMIT_AUTH_ATTEMPTS=10          # More lenient for testing
```

---

## 7. Verification Sign-Off

### Deployment Verification Checklist

| Check | Status | Verified By | Time |
|-------|--------|-------------|------|
| Homepage loads | [ ] | | |
| Health endpoint responds | [ ] | | |
| Authentication works | [ ] | | |
| Structure viewer renders | [ ] | | |
| API endpoints respond | [ ] | | |
| Security headers present | [ ] | | |
| No console errors | [ ] | | |
| Response time < 3s | [ ] | | |

### Sign-Off

```
Deployment Verified: [ ] YES  [ ] NO

Verified By: _______________________
Date/Time:  _______________________
Staging URL: _______________________

Notes:
_________________________________________________
_________________________________________________
```

---

## 8. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 errors on all pages | Missing env vars | Check `vercel env ls preview` |
| Database connection failed | Wrong Supabase URL | Verify SUPABASE_URL |
| Authentication not working | Missing ANON_KEY | Check Supabase keys |
| CSRF errors | Missing CSRF_SECRET | Generate and set secret |
| Build fails | TypeScript errors | Run `npm run typecheck` locally |
| Rate limit exceeded | Strict limits | Adjust staging rate limits |

### Debug Commands

```bash
# View Vercel deployment logs
vercel logs --follow

# Check environment variables
vercel env ls preview

# Verify build output
vercel inspect [DEPLOYMENT_URL]

# Test specific route
curl -v $STAGING_URL/api/health
```

---

**Document Status**: Ready for Phase 2 Deployment
**Next Step**: Execute deployment and run smoke tests
**Related Documents**:
- `/docs/testing/STAGING_SMOKE_TESTS.md`
- `/docs/deployment/production-validation.md`
