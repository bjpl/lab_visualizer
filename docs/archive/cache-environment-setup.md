# Cache System Environment Setup

## Required Environment Variables

### Vercel KV (L2 Cache)

The L2 cache uses Vercel KV (Redis-compatible) for edge caching.

#### Option 1: Vercel Platform (Recommended)

1. **Install Vercel KV:**
   ```bash
   # From Vercel dashboard or CLI
   vercel integration add vercel-kv
   ```

2. **Auto-configured variables:**
   When you add Vercel KV to your project, these variables are automatically set:
   ```bash
   KV_REST_API_URL=https://your-instance.upstash.io
   KV_REST_API_TOKEN=your-token
   KV_REST_API_READ_ONLY_TOKEN=your-readonly-token
   ```

3. **Pull to local development:**
   ```bash
   vercel env pull .env.local
   ```

#### Option 2: Upstash Direct

1. **Create account:** https://upstash.com/

2. **Create Redis database:**
   - Choose region closest to your users
   - Enable REST API
   - Copy credentials

3. **Add to `.env.local`:**
   ```bash
   KV_REST_API_URL=https://your-db.upstash.io
   KV_REST_API_TOKEN=AXXXabc...
   ```

#### Option 3: Development (Mock)

For local development without cloud services:

```bash
# Leave these unset or set to empty
KV_REST_API_URL=
KV_REST_API_TOKEN=

# The system will automatically use a mock in-memory cache
```

### Supabase (L3 Cache)

The L3 cache uses Supabase Storage for long-term object storage.

#### Setup Steps

1. **Create Supabase Project:**
   - Go to https://supabase.com/
   - Create new project
   - Wait for provisioning (~2 minutes)

2. **Get credentials from Project Settings > API:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Create storage bucket (automatic or manual):**

   **Automatic:** The cache will create the bucket on first use.

   **Manual:** From Supabase dashboard:
   - Go to Storage
   - Create bucket named `cache-storage`
   - Set to Private
   - File size limit: 1GB

4. **Configure RLS policies (optional):**
   ```sql
   -- Allow service role to manage all files
   CREATE POLICY "Service role full access"
   ON storage.objects FOR ALL
   TO service_role
   USING (bucket_id = 'cache-storage');

   -- Allow authenticated users to read their cache
   CREATE POLICY "Users read own cache"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'cache-storage' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

## Complete `.env.local` Template

```bash
# ============================================
# Multi-Tier Cache Configuration
# ============================================

# L2 Cache - Vercel KV (Optional)
# Leave empty to use mock cache in development
KV_REST_API_URL=
KV_REST_API_TOKEN=

# L3 Cache - Supabase Storage (Required for production)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cache Feature Flags (Optional)
NEXT_PUBLIC_DISABLE_L2_CACHE=false
NEXT_PUBLIC_DISABLE_L3_CACHE=false
NEXT_PUBLIC_CACHE_METRICS=true

# ============================================
# Other Application Variables
# ============================================

# Add your other environment variables here
```

## Installation

### Install Required Dependencies

```bash
# Core dependencies (if not already installed)
npm install @supabase/ssr

# Optional: For Vercel KV (recommended for production)
npm install @vercel/kv
```

**Note:** The current implementation uses REST API for Vercel KV, so `@vercel/kv` is optional. However, installing it will enable the native SDK for better performance.

### Update Cache Implementation (if using @vercel/kv)

If you install `@vercel/kv`, update `/src/services/cache/vercelKvCache.ts`:

```typescript
// Add this import at the top
import { kv } from '@vercel/kv';

// In initializeKVClient(), replace the REST implementation with:
private initializeKVClient(): void {
  try {
    if (typeof window === 'undefined') {
      // Use native @vercel/kv client
      this.kvClient = kv;
      console.log('[VercelKVCache] Initialized with @vercel/kv');
    } else {
      this.kvClient = this.createMockClient();
    }
  } catch (error) {
    console.error('[VercelKVCache] Failed to initialize:', error);
    this.kvClient = this.createMockClient();
  }
}
```

## Verification

### Test L2 Cache (Vercel KV)

```typescript
// In your development console or test file
import { getVercelKVCache } from '@/services/cache/vercelKvCache';

const l2Cache = getVercelKVCache();

// Health check
const isHealthy = await l2Cache.healthCheck();
console.log('L2 Cache Health:', isHealthy);

// Test set/get
await l2Cache.set('test-key', { message: 'Hello L2!' }, { ttl: 300 });
const result = await l2Cache.get('test-key');
console.log('L2 Result:', result);
```

### Test L3 Cache (Supabase)

```typescript
import { getSupabaseStorageCache } from '@/services/cache/supabaseStorageCache';

const l3Cache = getSupabaseStorageCache();

// Health check
const isHealthy = await l3Cache.healthCheck();
console.log('L3 Cache Health:', isHealthy);

// Test set/get
await l3Cache.set('test-key', { message: 'Hello L3!' }, { ttl: 3600 });
const result = await l3Cache.get('test-key');
console.log('L3 Result:', result);
```

### Test Full Cache Manager

```typescript
import { getCacheManager } from '@/services/cache';

const cache = getCacheManager();

// Health check all tiers
const health = await cache.healthCheck();
console.log('Cache Health:', health);
// Expected: { l1: true, l2: true, l3: true }

// Test multi-tier flow
await cache.set('test:multi-tier', { data: 'test' });
const result = await cache.get('test:multi-tier');
console.log('Source:', result.source); // Should be 'l1' if retrieved quickly

// Get metrics
const metrics = await cache.getMetrics();
console.log('Metrics:', metrics);
```

## Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**

2. **Add environment variables in Vercel dashboard:**
   - Go to Project Settings > Environment Variables
   - Add KV_REST_API_URL and KV_REST_API_TOKEN
   - Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

3. **Enable Vercel KV integration:**
   ```bash
   vercel integration add vercel-kv
   ```

4. **Deploy:**
   ```bash
   vercel deploy --prod
   ```

### Other Platforms

For platforms other than Vercel:

1. **Use Upstash directly for L2 cache:**
   - Create Upstash Redis database
   - Add credentials to environment variables

2. **Ensure Supabase credentials are set**

3. **Deploy with your platform's CLI**

## Monitoring

### Check Cache Performance

```typescript
// Add to your monitoring/observability
import { getCacheManager } from '@/services/cache';

setInterval(async () => {
  const metrics = await getCacheManager().getMetrics();

  // Log to your monitoring service
  console.log({
    l1HitRate: metrics.l1.hitRate,
    l2HitRate: metrics.l2.hitRate,
    l3HitRate: metrics.l3.hitRate,
    combinedHitRate: metrics.overall.combinedHitRate,
    avgLatency: metrics.overall.avgLatency,
  });
}, 60000); // Every minute
```

### Alerts

Set up alerts for:
- L2 hit rate < 60% (target is 70%)
- L3 hit rate < 80% (target is 90%)
- Average latency > 1000ms
- Cache health check failures

## Troubleshooting

### Common Issues

#### 1. L2 Cache Not Connecting

**Symptom:** "KV credentials not configured" in logs

**Solution:**
```bash
# Verify environment variables are set
echo $KV_REST_API_URL
echo $KV_REST_API_TOKEN

# If using Vercel, pull latest env
vercel env pull .env.local

# Restart development server
npm run dev
```

#### 2. L3 Bucket Creation Failed

**Symptom:** "Failed to create bucket" in logs

**Solution:**
- Manually create bucket in Supabase dashboard
- Ensure bucket name is `cache-storage`
- Set bucket to Private
- Check Supabase project is active (not paused)

#### 3. CORS Errors with Supabase

**Symptom:** CORS errors when accessing storage

**Solution:**
```sql
-- In Supabase SQL Editor, add CORS policy
ALTER TABLE storage.buckets
ADD COLUMN IF NOT EXISTS allowed_origins text[];

UPDATE storage.buckets
SET allowed_origins = ARRAY['http://localhost:3000', 'https://your-domain.com']
WHERE name = 'cache-storage';
```

#### 4. Mock Cache in Production

**Symptom:** Cache always returns mock data

**Solution:**
- Verify environment variables are set in production
- Check variables are not empty strings
- Restart application after setting variables

## Cost Estimation

### Vercel KV (Upstash)

- **Free Tier:** 10,000 commands/day
- **Pay-as-you-go:** $0.20 per 100K commands
- **Hobby:** Typically $0-10/month for small apps

### Supabase Storage

- **Free Tier:** 1GB storage, 2GB bandwidth/month
- **Pro:** $25/month (100GB storage, 200GB bandwidth)
- **Typical Usage:**
  - 100 PDB structures (~50MB) = $0
  - 1000 simulation frames (~500MB) = $0
  - Scale up as needed

### Total Estimated Cost

- **Development:** $0 (using mocks or free tiers)
- **Small Production:** $0-25/month
- **Medium Production:** $25-100/month
- **Large Scale:** Custom pricing

## Next Steps

1. Set up environment variables
2. Test cache system locally
3. Monitor metrics during development
4. Deploy to staging
5. Verify production performance
6. Set up alerts
7. Optimize based on metrics
