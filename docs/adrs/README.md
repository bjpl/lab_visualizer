# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the LAB Visualization Platform. ADRs document significant architectural decisions, their context, consequences, and alternatives considered.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences. ADRs help teams:

- Understand why certain decisions were made
- Avoid revisiting settled discussions
- Onboard new team members quickly
- Learn from past decisions (good and bad)

## ADR Format

Each ADR follows this structure:

```markdown
# ADR-XXX: Title

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[Problem, constraints, and requirements]

## Decision
[What we decided to do]

## Consequences
[Impact, trade-offs, and implications]

## Alternatives Considered
[Other options and why they were rejected]
```

## ADR Index

### ADR-001: Hybrid Molecular Dynamics Architecture
**Status**: Accepted
**Date**: 2025-11-17
**Summary**: 3-tier MD approach (browser/serverless/desktop) to balance performance, cost, and capabilities.

**Key Points**:
- Browser MD: <1,000 atoms, <5s initialization, $0 cost
- Serverless MD: 1,000-10,000 atoms, $0.02-0.10 per simulation
- Desktop MD: 10,000+ atoms, user's compute
- Intelligent routing based on simulation complexity

**Consequences**: 80% cost reduction, better UX, realistic capabilities

**File**: [`001-hybrid-md-architecture.md`](./001-hybrid-md-architecture.md)

---

### ADR-002: Single Visualization Library (Mol*)
**Status**: Accepted
**Date**: 2025-11-17
**Summary**: Use only Mol* for molecular visualization, Three.js for cellular.

**Key Points**:
- Removed redundant libraries (NGL Viewer, JSmol)
- 40% bundle size reduction (15MB → 9MB)
- Consistent UX across all molecular visualizations
- RCSB PDB official viewer (trusted source)

**Consequences**: Faster loads, simpler maintenance, single vendor dependency

**File**: [`002-visualization-library-choice.md`](./002-visualization-library-choice.md)

---

### ADR-003: Multi-Tier Caching Strategy
**Status**: Accepted
**Date**: 2025-11-17
**Summary**: 3-tier caching (IndexedDB → Vercel KV → Supabase Storage) for 95%+ cache hit rate.

**Key Points**:
- Tier 1: IndexedDB (browser cache, <50ms)
- Tier 2: Vercel KV (edge cache, <200ms)
- Tier 3: Supabase Storage (long-term, <1s)
- 10x faster load times with caching

**Consequences**: 95%+ cache hit rate, 90% bandwidth savings, offline support

**File**: [`003-caching-strategy.md`](./003-caching-strategy.md)

---

### ADR-004: State Management with Zustand
**Status**: Accepted
**Date**: 2025-11-17
**Summary**: Zustand for global state, React Query for server state.

**Key Points**:
- Zustand: 1.3KB, no boilerplate, type-safe
- React Query: Smart caching, optimistic updates
- Combined: 15KB total (vs Redux 42KB)
- Better performance (no context re-renders)

**Consequences**: Lightweight, performant, easy testing, smaller ecosystem

**File**: [`004-state-management.md`](./004-state-management.md)

---

### ADR-005: Vercel + Supabase Deployment
**Status**: Accepted
**Date**: 2025-11-17
**Summary**: Vercel for frontend/edge, Supabase for backend/database.

**Key Points**:
- Vercel: Next.js hosting, edge functions, CDN, analytics
- Supabase: PostgreSQL, auth, storage, realtime
- Cost: ~$77.50/month for 10,000 MAU
- Great DX: Git-based workflow, automatic deployments

**Consequences**: Low latency, auto-scaling, cost-effective, vendor lock-in

**File**: [`005-deployment-platform.md`](./005-deployment-platform.md)

---

### ADR-006: Performance-First Development
**Status**: Accepted
**Date**: 2025-11-17
**Summary**: Lighthouse >90 budget, <200KB initial bundle, progressive loading.

**Key Points**:
- Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
- Initial bundle: <200KB (Mol* lazy loaded)
- Code splitting, progressive enhancement
- Automated CI/CD performance checks

**Consequences**: Better UX, mobile support, SEO benefits, development overhead

**File**: [`006-performance-budgets.md`](./006-performance-budgets.md)

---

## Decision-Making Process

When creating a new ADR:

1. **Identify the Decision**: What architectural choice needs to be made?
2. **Research**: Gather context, constraints, and alternatives
3. **Draft ADR**: Document in standard format
4. **Team Review**: Discuss with team, iterate on draft
5. **Accept**: Once consensus reached, set status to "Accepted"
6. **Communicate**: Share with broader team and stakeholders
7. **Implement**: Use ADR as guide during implementation
8. **Update Index**: Add to this README with summary

## Status Definitions

- **Proposed**: Under discussion, not yet decided
- **Accepted**: Decision made and being implemented
- **Deprecated**: No longer recommended, but not yet replaced
- **Superseded**: Replaced by a newer ADR (reference new ADR)

## Related Documentation

- [Technical Analysis](../analysis/technical-analysis.md) - In-depth technical research
- [Cost Estimates](../analysis/cost-estimates.md) - Cost modeling and projections
- [Sprint 0 Planning](../sprints/sprint-0-plan.md) - Implementation roadmap

## Contributing

To create a new ADR:

1. Copy template from [`000-template.md`](./000-template.md)
2. Number sequentially (e.g., ADR-007)
3. Fill in all sections with context and rationale
4. Submit PR with ADR for team review
5. Update this README index after acceptance

## Contact

For questions about ADRs or architectural decisions, contact:
- Technical Lead: [contact info]
- Architecture Review Board: [contact info]

---

**Last Updated**: 2025-11-17
**Total ADRs**: 6 Accepted, 0 Proposed, 0 Deprecated
