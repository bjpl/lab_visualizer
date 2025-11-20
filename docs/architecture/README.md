# Architecture Documentation

## Overview

This directory contains comprehensive architecture documentation for the lab_visualizer multi-tier cache and distributed rate limiting system.

## Documents

### Architecture Decision Records (ADRs)

1. **[ADR-001: Multi-Tier Cache Strategy](./ADR-001-multi-tier-cache-strategy.md)**
   - L1/L2/L3 cache architecture
   - 70% combined hit rate target
   - Vercel KV (L2) and Supabase Storage (L3)
   - Cache key strategies and TTL policies
   - Cost analysis and performance targets

2. **[ADR-002: Redis Distributed Rate Limiting](./ADR-002-redis-distributed-rate-limiting.md)**
   - Sliding window algorithm implementation
   - Multi-tier rate limits (anonymous/free/pro/enterprise)
   - Distributed counter synchronization
   - Circuit breaker and error handling
   - Monitoring and alerting

### Integration & Design

3. **[Cache & Rate Limiting Integration](./CACHE-RATE-LIMITING-INTEGRATION.md)**
   - System architecture diagram
   - Data flow sequences
   - Configuration management
   - Middleware architecture
   - API route integration
   - Monitoring & observability

4. **[Component Diagrams (C4 Model)](./COMPONENT-DIAGRAMS.md)**
   - Level 1: System Context
   - Level 2: Container Diagram
   - Level 3: Cache System Components
   - Level 3: Rate Limiting Components
   - Data flow diagrams
   - Deployment architecture

### Implementation & Operations

5. **[Implementation Guide](./IMPLEMENTATION-GUIDE.md)**
   - Step-by-step setup instructions
   - Phase 1: L2 Cache (Vercel KV)
   - Phase 2: L3 Cache (Supabase Storage)
   - Phase 3: Monitoring & Metrics
   - Testing strategies
   - Deployment procedures

6. **[Technology Evaluation Matrix](./TECHNOLOGY-EVALUATION.md)**
   - L2 cache solutions comparison
   - L3 storage solutions comparison
   - Rate limiting algorithms comparison
   - Decision rationale and scoring
   - Cost analysis and projections
   - Risk assessment

7. **[Operational Runbook](./RUNBOOK.md)**
   - Daily operations and health checks
   - Monitoring and alerts
   - Common issues and resolutions
   - Maintenance procedures
   - Deployment procedures
   - Disaster recovery
   - Escalation procedures

## Quick Start

### For Architects
1. Read [ADR-001](./ADR-001-multi-tier-cache-strategy.md) for cache strategy
2. Read [ADR-002](./ADR-002-redis-distributed-rate-limiting.md) for rate limiting
3. Review [Component Diagrams](./COMPONENT-DIAGRAMS.md) for system design

### For Developers
1. Read [Implementation Guide](./IMPLEMENTATION-GUIDE.md) for step-by-step setup
2. Review [Integration Architecture](./CACHE-RATE-LIMITING-INTEGRATION.md) for middleware patterns
3. Reference [Technology Evaluation](./TECHNOLOGY-EVALUATION.md) for technology choices

### For Operations
1. Read [Runbook](./RUNBOOK.md) for day-to-day operations
2. Review monitoring dashboards and alert configurations
3. Follow maintenance procedures for weekly/monthly tasks

## Architecture Summary

### Multi-Tier Cache (70% Hit Rate Target)

```
L1 (IndexedDB) → 30% hit rate → <100ms
    ↓ miss
L2 (Vercel KV) → 35% additional → <50ms
    ↓ miss
L3 (Supabase Storage) → 25% additional → <200ms
    ↓ miss
Origin (RCSB PDB) → 10% fallback → ~500ms
```

### Distributed Rate Limiting

```
Request → Middleware → Rate Limiter (Redis Sliding Window)
    ↓
Allowed? → Continue or Return 429
    ↓
Add X-RateLimit-* headers
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Combined Cache Hit Rate | 70% |
| L1 Hit Rate | 30% |
| L2 Hit Rate | 35% (of L1 misses) |
| L3 Hit Rate | 25% (of L2 misses) |
| P50 Latency (cached) | <150ms |
| P99 Latency (cached) | <500ms |
| Rate Limiter Overhead | <5ms |

### Cost Estimate

| Component | Cost/Month |
|-----------|------------|
| Vercel KV (L2) | $18 |
| Supabase Storage (L3) | $28.50 |
| **Total** | **$46.50** |

## Key Technologies

- **L1 Cache:** IndexedDB (idb library)
- **L2 Cache:** Vercel KV (Upstash Redis)
- **L3 Cache:** Supabase Storage (S3-compatible)
- **Rate Limiting:** Redis Sliding Window Log
- **Middleware:** Next.js Edge Functions
- **Monitoring:** Vercel Analytics, Supabase Dashboard

## Implementation Timeline

- **Week 1:** L2 Cache (Vercel KV) + Rate Limiting
- **Week 2:** L3 Cache (Supabase Storage)
- **Week 3:** Optimization & Tuning
- **Week 4:** Production Rollout (gradual: 10% → 50% → 100%)

## Related Documentation

### Codebase References
- `/src/lib/cache/` - Cache implementation
- `/src/lib/rate-limiter/` - Rate limiting implementation
- `/src/middleware.ts` - Main middleware entry point

### External Resources
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Rate Limiting Patterns (Stripe)](https://stripe.com/blog/rate-limiters)

## Contributing

When making architecture changes:
1. Create a new ADR (Architecture Decision Record)
2. Update relevant diagrams
3. Update implementation guide
4. Update runbook if operational procedures change
5. Tag architecture team for review

## Questions?

- Architecture decisions: See ADRs
- Implementation details: See Implementation Guide
- Operations: See Runbook
- Technology choices: See Technology Evaluation

---

**Last Updated:** 2025-11-20
**Status:** Proposed
**Next Review:** 2025-12-20
