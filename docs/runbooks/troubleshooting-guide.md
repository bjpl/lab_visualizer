# Troubleshooting Guide

## Quick Diagnostic Commands

```bash
# Check all health endpoints
curl https://lab-visualizer.vercel.app/api/health
curl https://lab-visualizer.vercel.app/api/health/ready
curl https://lab-visualizer.vercel.app/api/health/live

# Check deployment status
vercel ls --prod

# View recent logs
vercel logs --prod

# Check environment variables
vercel env ls production

# Run local health check
npm run dev
# Visit http://localhost:3000/api/health
```

## Common Issues & Solutions

### Database Connection Issues

**Symptom**: "Failed to connect to database" errors

**Diagnostic Steps**:
```bash
# 1. Check Supabase status
curl https://[PROJECT_ID].supabase.co/rest/v1/

# 2. Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Test connection from command line
curl -X GET https://[PROJECT].supabase.co/rest/v1/pdb_structures \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]"

# 4. Check connection pool usage in Supabase dashboard
```

**Solutions**:
- Verify Supabase credentials are correct
- Check connection pool isn't exhausted
- Ensure RLS policies aren't blocking connections
- Restart serverless functions: `vercel redeploy`

### Cache Connection Failures

**Symptom**: "Cache unavailable" warnings, slow performance

**Diagnostic Steps**:
```bash
# 1. Check Vercel KV status
vercel env ls | grep KV

# 2. Test KV connection
curl https://[KV_REST_API_URL]/ping \
  -H "Authorization: Bearer [KV_REST_API_TOKEN]"

# 3. Check cache metrics
curl https://lab-visualizer.vercel.app/api/health | jq '.checks.cache'
```

**Solutions**:
- Verify KV_REST_API_URL and KV_REST_API_TOKEN are set
- Application falls back to in-memory cache automatically
- To restore KV: `vercel env pull` and redeploy
- Clear corrupted cache: `npx @vercel/kv-cli flush`

### PDB Structure Loading Failures

**Symptom**: Structures won't load, timeout errors

**Diagnostic Steps**:
```bash
# 1. Test RCSB PDB API
curl https://data.rcsb.org/rest/v1/core/entry/1ATP

# 2. Test fallback sources
curl https://www.ebi.ac.uk/pdbe/api/pdb/entry/summary/1ATP
curl https://pdbj.org/rest/downloadPDBfile?id=1ATP&format=pdb

# 3. Check rate limiting
curl https://lab-visualizer.vercel.app/api/health | jq '.checks.pdb_api'

# 4. Test our API endpoint
curl https://lab-visualizer.vercel.app/api/pdb/1ATP
```

**Solutions**:
- RCSB PDB down: Fallback sources should activate automatically
- Rate limiting: Wait 60 seconds, implement exponential backoff
- Cache the PDB file: Upload to Supabase storage for faster access
- Check network connectivity from Vercel edge functions

### Authentication Issues

**Symptom**: Users can't log in, "Unauthorized" errors

**Diagnostic Steps**:
```bash
# 1. Check Supabase auth status
curl https://[PROJECT].supabase.co/auth/v1/health

# 2. Verify JWT secret
vercel env ls production | grep JWT

# 3. Test OAuth providers
# Visit Supabase dashboard → Authentication → Providers

# 4. Check auth flow
# Open browser console during login attempt
```

**Solutions**:
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Check JWT_SECRET hasn't changed
- Ensure OAuth redirect URLs are configured correctly
- Clear browser cookies and retry
- Check CORS configuration in Supabase

### Performance Degradation

**Symptom**: Slow page loads, high response times

**Diagnostic Steps**:
```bash
# 1. Run Lighthouse audit
npm run lighthouse:audit

# 2. Check Vercel analytics
# Visit https://vercel.com/[team]/lab-visualizer/analytics

# 3. Review Sentry performance traces
# Visit https://sentry.io/[org]/lab-visualizer/performance

# 4. Check database query performance
# Supabase dashboard → Database → Query Performance

# 5. Check bundle size
npm run build
# Review .next/analyze/client.html
```

**Solutions**:
- High bundle size: Implement code splitting, lazy loading
- Slow database queries: Add indexes, optimize queries
- Poor cache hit rate: Warm cache, increase TTLs
- Large images: Optimize with next/image, WebP format
- Too many third-party scripts: Audit and remove unused

### Memory Leaks

**Symptom**: Increasing memory usage, eventual crashes

**Diagnostic Steps**:
```bash
# 1. Check memory usage
curl https://lab-visualizer.vercel.app/api/health | jq '.checks.memory'

# 2. Profile memory in Chrome DevTools
# Open DevTools → Memory → Take heap snapshot

# 3. Check for detached DOM nodes
# Memory profiler → Detached DOM tree

# 4. Review recent code changes
git log --oneline -20
```

**Solutions**:
- Clean up event listeners: Use cleanup functions in useEffect
- Dispose 3D objects: Call dispose() on Three.js/MolStar objects
- Clear intervals/timeouts: Store refs and clear on unmount
- Limit cache size: Implement LRU cache with max size
- Use WeakMap for object associations

### Build Failures

**Symptom**: "Build failed" in Vercel deployment

**Diagnostic Steps**:
```bash
# 1. Check build locally
npm run build

# 2. Check TypeScript errors
npm run typecheck

# 3. Check linting
npm run lint

# 4. Review Vercel build logs
vercel logs [DEPLOYMENT_ID]

# 5. Check dependencies
npm audit
npm outdated
```

**Solutions**:
- TypeScript errors: Fix type issues, update tsconfig.json
- Missing dependencies: `npm install` and commit package-lock.json
- Build timeout: Increase timeout in vercel.json
- Out of memory: Increase memory limit: `NODE_OPTIONS=--max_old_space_size=4096`
- Environment variables missing: Add to Vercel project settings

### Test Failures

**Symptom**: Tests failing in CI/CD or locally

**Diagnostic Steps**:
```bash
# 1. Run tests locally
npm test

# 2. Run with verbose output
npm test -- --reporter=verbose

# 3. Run specific test file
npm test tests/pdb-service.test.ts

# 4. Check test coverage
npm run test:coverage

# 5. Review CI logs
# GitHub Actions → Workflows → Failed run → Logs
```

**Solutions**:
- Flaky tests: Add retries, fix race conditions
- Mock API responses: Use MSW or similar
- Environment differences: Check Node version, OS
- Missing test data: Add fixtures, seed database
- Timeout issues: Increase test timeouts

### Deployment Rollback Needed

**Symptom**: Production broken after deployment

**Steps**:
```bash
# 1. List recent deployments
vercel deployments --prod --limit 10

# 2. Identify last stable deployment
# Check deployment timestamps and notes

# 3. Rollback immediately
vercel rollback [STABLE_DEPLOYMENT_URL]

# 4. Verify rollback successful
curl https://lab-visualizer.vercel.app/api/health

# 5. Monitor for stability
# Watch Sentry error rate for 15 minutes

# 6. Investigate issue in rolled-back deployment
vercel logs [FAILED_DEPLOYMENT_URL]
```

### Error Tracking Issues

**Symptom**: Not seeing errors in Sentry

**Diagnostic Steps**:
```bash
# 1. Verify Sentry DSN
echo $NEXT_PUBLIC_SENTRY_DSN

# 2. Check Sentry initialization
# Open browser console
# Should see "[Sentry] Initialized"

# 3. Test error capture
# Trigger test error in app
# Check Sentry dashboard

# 4. Review Sentry configuration
cat sentry.client.config.js
cat sentry.server.config.js
```

**Solutions**:
- Missing DSN: Add NEXT_PUBLIC_SENTRY_DSN to environment
- Wrong environment: Check NEXT_PUBLIC_SENTRY_ENVIRONMENT
- Sampling too low: Increase tracesSampleRate
- beforeSend filtering: Review filter logic
- Not initialized: Call initSentry() in _app.tsx

### Monitoring Dashboard Empty

**Symptom**: No data in Vercel Analytics or monitoring

**Diagnostic Steps**:
```bash
# 1. Verify analytics enabled
# Vercel dashboard → Project → Analytics

# 2. Check analytics script loaded
# View page source, search for "/_vercel/insights"

# 3. Test custom events
# Trigger user action that should send event
# Check Network tab for analytics requests

# 4. Wait for data processing
# Analytics can have 5-10 minute delay
```

**Solutions**:
- Enable Vercel Analytics in project settings
- Add Analytics component to _app.tsx
- Verify custom event tracking code
- Check ad blockers aren't blocking analytics
- Wait 24 hours for initial data population

## Performance Optimization

### Slow Structure Loading

**Quick Wins**:
1. Enable all cache layers (L1, L2, L3)
2. Preload popular structures
3. Implement parallel PDB source fetching
4. Use Web Workers for parsing

**Commands**:
```bash
# Warm cache with popular structures
npm run cache:warm

# Check cache hit rates
curl https://lab-visualizer.vercel.app/api/health | jq '.checks.cache.details'

# Run performance benchmark
npm run benchmark
```

### Large Bundle Size

**Analysis**:
```bash
# Analyze bundle
npm run build
npm run analyze

# Find large dependencies
npx webpack-bundle-analyzer .next/analyze/client.json

# Check tree-shaking
npx depcheck
```

**Optimizations**:
- Use dynamic imports for large components
- Implement route-based code splitting
- Remove unused dependencies
- Use smaller alternatives (e.g., date-fns → day.js)

### Slow Database Queries

**Analysis**:
```bash
# Check query performance in Supabase
# Dashboard → Database → Query Performance

# Explain query plan
supabase db execute "EXPLAIN ANALYZE SELECT ..."

# Check missing indexes
supabase db execute "SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0"
```

**Optimizations**:
- Add indexes on frequently queried columns
- Use RLS policies efficiently
- Implement pagination for large result sets
- Cache query results
- Use database functions for complex queries

## Debugging Tools

### Browser DevTools

**Performance**:
1. Open DevTools → Performance
2. Record page load
3. Look for long tasks (>50ms)
4. Check FPS for smooth animations

**Network**:
1. DevTools → Network
2. Filter by resource type
3. Check request timing
4. Look for failed requests

**Memory**:
1. DevTools → Memory
2. Take heap snapshot
3. Compare snapshots
4. Find detached DOM nodes

### Vercel CLI

```bash
# View real-time logs
vercel logs --follow

# Inspect deployment
vercel inspect [URL]

# List environment variables
vercel env ls

# Run production build locally
vercel build --prod
vercel dev --prod
```

### Supabase CLI

```bash
# View database logs
supabase db logs

# Execute SQL
supabase db execute "SELECT ..."

# Dump database
supabase db dump -f backup.sql

# Manage migrations
supabase migration list
supabase migration up
```

### Sentry CLI

```bash
# Upload source maps
sentry-cli releases files [VERSION] upload-sourcemaps .next

# Create release
sentry-cli releases new [VERSION]

# Finalize release
sentry-cli releases finalize [VERSION]
```

## Getting Help

### Support Channels

1. **Documentation**: Check `/docs` directory
2. **GitHub Issues**: Search existing issues
3. **Sentry**: Review error details and breadcrumbs
4. **Vercel Support**: https://vercel.com/support
5. **Supabase Support**: https://supabase.com/support

### Information to Include

When asking for help, provide:
- Error messages (full stack trace)
- Steps to reproduce
- Expected vs actual behavior
- Environment (production, staging, local)
- Recent changes
- Relevant logs
- Health check output

### Example Support Request

```
**Issue**: Structure loading fails for 1ATP

**Environment**: Production

**Steps to Reproduce**:
1. Navigate to /viewer
2. Search for "1ATP"
3. Click "Load Structure"
4. Error appears

**Error Message**:
```
Failed to fetch PDB structure: Network timeout
```

**Health Check Output**:
```json
{
  "checks": {
    "pdb_api": {
      "status": "warn",
      "message": "PDB API unreachable"
    }
  }
}
```

**Recent Changes**: Deployed v0.1.5 yesterday

**Logs**: See attached vercel-logs.txt

**Impact**: 15% of structure load attempts failing
```

---

**Last Updated**: 2025-11-21
**Maintained By**: Platform Team
