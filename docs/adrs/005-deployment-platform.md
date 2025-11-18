# ADR-005: Vercel + Supabase Deployment

## Status
Accepted

## Context

The LAB Visualization Platform requires a scalable, cost-effective deployment strategy that supports:

1. **Technical Requirements**:
   - Next.js application with App Router and Server Components
   - Edge functions for low-latency API responses
   - PostgreSQL database for user data and metadata
   - Blob storage for molecular structures and trajectories
   - Real-time collaboration features
   - Authentication and authorization

2. **Performance Requirements**:
   - Global CDN for low-latency content delivery
   - Edge computing for API endpoints (<100ms response)
   - Database connection pooling (avoid cold start issues)
   - WebSocket support for real-time features

3. **Cost Constraints**:
   - Target: <$500/month for 10,000 MAU
   - Minimize egress bandwidth costs
   - Avoid over-provisioning compute resources
   - No upfront infrastructure costs

4. **Developer Experience**:
   - Simple deployment workflow (git push)
   - Preview deployments for PRs
   - Environment management (dev, staging, prod)
   - Monitoring and logging
   - Easy rollbacks

5. **Scalability Requirements**:
   - Auto-scaling for traffic spikes (e.g., classroom usage)
   - Support for 10,000+ concurrent users
   - Database performance at scale
   - Storage growth (100GB → 1TB+)

## Decision

We will deploy on **Vercel for frontend/edge** + **Supabase for backend/database**:

### Vercel (Frontend + Edge Functions)
- **Next.js Hosting**: Automatic builds, deployments, and CDN
- **Edge Functions**: Low-latency API endpoints (<100ms globally)
- **ISR (Incremental Static Regeneration)**: Cached pages with on-demand updates
- **Analytics**: Web Vitals monitoring and performance insights
- **Preview Deployments**: Automatic PR previews

### Supabase (Backend + Database)
- **PostgreSQL Database**: Managed database with connection pooling
- **Auth**: Built-in authentication with JWT and Row-Level Security
- **Storage**: Object storage for structures, trajectories, images
- **Realtime**: WebSocket subscriptions for collaboration
- **Edge Functions**: Optional compute for background jobs

### Architecture
```
User Request
    ↓
Vercel Edge (CDN)
    ↓
Next.js App Router (Server Components)
    ↓
Edge Functions (API Routes)
    ↓
Supabase Client (Database, Auth, Storage)
    ↓
PostgreSQL + Object Storage
```

### Deployment Workflow
```
git push → GitHub
    ↓
Vercel Build (automatic)
    ↓
Preview Deployment (for PRs)
    ↓
Production Deployment (on merge to main)
    ↓
Edge Cache Invalidation
```

### Cost Breakdown (Projected for 10,000 MAU)
- **Vercel Pro**: $20/month (includes 1TB bandwidth, 100GB edge)
- **Supabase Pro**: $25/month (8GB database, 100GB storage, 250GB egress)
- **Additional Bandwidth**: ~$30/month (200GB @ $0.15/GB)
- **Additional Storage**: ~$2.50/month (100GB @ $0.025/GB)
- **Total**: ~$77.50/month (well under $500 target)

## Consequences

### Positive
1. **Great Developer Experience**: Git-based workflow, automatic deployments, PR previews
2. **Low Latency**: Edge functions globally distributed (<100ms response)
3. **Auto-Scaling**: No manual scaling configuration, handles traffic spikes
4. **Cost-Effective**: Pay-as-you-grow pricing, no upfront costs
5. **Integrated Stack**: Vercel + Supabase designed to work together
6. **Built-in Features**: Auth, storage, realtime, edge functions included
7. **Monitoring**: Web Vitals, performance metrics, error tracking built-in
8. **Fast Builds**: Incremental builds and smart caching
9. **Easy Rollbacks**: One-click rollback to previous deployments
10. **Security**: Automatic HTTPS, DDoS protection, WAF

### Negative
1. **Vendor Lock-in**: Difficult to migrate away from Vercel + Supabase
2. **Cold Starts**: Serverless functions have ~100ms cold start penalty
3. **Database Limits**: Supabase Pro has 8GB database limit (must upgrade for >10,000 MAU)
4. **Egress Costs**: Can spike if not careful with caching strategy
5. **Edge Function Limits**: 1MB response limit, 30s timeout
6. **No Full Control**: Cannot optimize infrastructure beyond provided knobs

### Risk Mitigation
- **Vendor Lock-in**: Use standard PostgreSQL, minimize Vercel-specific features
- **Cold Starts**: Use edge caching and keep-alive pings for critical endpoints
- **Database Scaling**: Monitor usage, plan upgrade path ($99/month for 32GB)
- **Egress Costs**: Aggressive caching strategy (see ADR-003)
- **Edge Limits**: Move large payloads to background jobs or storage links

## Alternatives Considered

### 1. AWS (EC2 + RDS + S3 + CloudFront)
**Rejected**:
- **Complexity**: High operational overhead (VPC, load balancers, scaling groups)
- **Cost**: More expensive at low scale ($200-500/month minimum)
- **Setup Time**: 2-4 weeks to configure properly
- **DevOps Burden**: Must manage infrastructure, deployments, monitoring
- **Developer Experience**: Poor compared to Vercel (manual CI/CD)

### 2. Railway (All-in-One Platform)
**Rejected**:
- **Newer Platform**: Less mature than Vercel/Supabase
- **No Edge Functions**: All compute is regional (higher latency)
- **Limited CDN**: Basic CDN, not as fast as Vercel Edge
- **Smaller Community**: Fewer examples and plugins
- **Pricing Uncertainty**: Pricing model less proven at scale

### 3. Netlify + Firebase
**Rejected**:
- **Bundle Size**: Netlify has smaller function size limits (50MB vs 250MB)
- **Database**: Firebase Firestore is NoSQL (not ideal for relational data)
- **Cost**: Firebase egress more expensive ($0.12/GB vs Supabase $0.09/GB)
- **Developer Experience**: Firebase SDK more complex than Supabase

### 4. DigitalOcean App Platform
**Rejected**:
- **No Edge Functions**: Regional compute only
- **Limited Next.js Support**: Not as optimized as Vercel
- **Manual Scaling**: Must configure scaling rules
- **Developer Experience**: Less polished than Vercel

### 5. Self-Hosted (Docker + Kubernetes)
**Rejected**:
- **Operational Overhead**: Must manage servers, updates, monitoring
- **Setup Time**: 4-8 weeks to get production-ready
- **DevOps Expertise**: Requires dedicated infrastructure team
- **Cost**: More expensive at low scale (must provision capacity upfront)

## Implementation Notes

### Vercel Configuration
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['supabase.co', 'rcsb.org'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: true, // Enable Server Actions
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};
```

### Edge Function Example
```typescript
// app/api/structures/[pdbId]/route.ts
export const runtime = 'edge'; // Run on edge

export async function GET(request: Request, { params }: { params: { pdbId: string } }) {
  const { pdbId } = params;

  // Check edge cache (Vercel KV)
  const cached = await kv.get(`structure:${pdbId}`);
  if (cached) {
    return new Response(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, max-age=604800' },
    });
  }

  // Fetch from Supabase or external API
  const structure = await fetchStructure(pdbId);

  // Cache for 7 days
  await kv.set(`structure:${pdbId}`, structure, { ex: 604800 });

  return new Response(structure, {
    headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, max-age=604800' },
  });
}
```

### Supabase Client Configuration
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: { 'x-application-name': 'lab-visualizer' },
    },
  }
);
```

### Database Schema (Supabase)
```sql
-- Users table (handled by Supabase Auth)
-- Structures metadata table
CREATE TABLE structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdb_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  organism TEXT,
  resolution FLOAT,
  size_bytes INTEGER,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, structure_id)
);

-- Simulations
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES structures(id),
  parameters JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  trajectory_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Row-Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);
```

### Monitoring
```typescript
// Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

# Install dependencies
npm ci

# Run type checking
npm run typecheck

# Run tests
npm run test

# Build for production
npm run build

# Deploy to Vercel (automatic via GitHub integration)
# Manual: vercel --prod
```

## References
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Vercel Edge Functions: https://vercel.com/docs/functions/edge-functions
- Technical Analysis: `/docs/analysis/technical-analysis.md`
- Cost Estimates: `/docs/analysis/cost-estimates.md`
