# ADR-001: Hybrid Molecular Dynamics Architecture

## Status
Accepted

## Context

The LAB Visualization Platform requires molecular dynamics (MD) simulations to provide realistic molecular behavior and interactions. Initial technical research revealed critical limitations:

1. **Browser MD Limitations**:
   - WebAssembly (WASM) port of GROMACS limited to ~5,000 atoms
   - ~40-60 second initialization overhead
   - Memory constraints: ~2GB max in browsers
   - WebGL compute shader limitations compared to native CUDA/OpenCL

2. **User Expectations**:
   - Students expect real-time feedback (<1s latency)
   - Need to simulate protein complexes (10,000+ atoms)
   - Educational simulations should "just work" without complex setup

3. **Cost Constraints**:
   - Cloud MD compute is expensive ($0.50-5.00 per simulation hour)
   - Target operational cost: <$500/month for 10,000 MAU
   - Cannot afford full cloud MD for all interactions

4. **Educational Requirements**:
   - Quick exploratory simulations for learning
   - Detailed research-grade simulations for advanced users
   - Offline capability for classroom environments

## Decision

We will implement a **3-tier hybrid molecular dynamics architecture**:

### Tier 1: Browser MD (Lightweight)
- **Scope**: <1,000 atoms, short trajectories (<100 frames)
- **Technology**: WebAssembly-compiled minimalist MD engine
- **Use Cases**: Quick explorations, ligand docking previews, basic tutorials
- **Performance**: <5s initialization, real-time rendering
- **Cost**: $0 (client-side compute)

### Tier 2: Serverless MD (Medium)
- **Scope**: 1,000-10,000 atoms, medium trajectories (100-1,000 frames)
- **Technology**: Vercel Edge Functions + AWS Lambda (GROMACS)
- **Use Cases**: Classroom demonstrations, moderate complexity simulations
- **Performance**: 10-30s initialization, 2-5 minutes runtime
- **Cost**: $0.02-0.10 per simulation (serverless pricing)

### Tier 3: Desktop MD (Full Power)
- **Scope**: 10,000+ atoms, long trajectories (1,000+ frames)
- **Technology**: Native GROMACS, Amber, or LAMMPS on user's machine
- **Use Cases**: Research projects, thesis work, publication-quality data
- **Performance**: User hardware dependent (GPU recommended)
- **Cost**: $0 (user's compute)

### Intelligent Routing Logic
```
if (atoms < 1000 && frames < 100) → Browser MD
else if (atoms < 10000 && frames < 1000) → Serverless MD
else → Desktop MD (downloadable binary + tutorial)
```

## Consequences

### Positive
1. **Optimal Cost Structure**: 80% of simulations run client-side or serverless (<$0.10 each)
2. **Better User Experience**: Fast simulations complete instantly; complex ones use appropriate compute
3. **Realistic Capabilities**: No overselling browser MD capabilities
4. **Scalability**: Can support 10,000+ MAU with <$500/month operational costs
5. **Educational Focus**: Quick iterations for learning, powerful tools for research
6. **Offline Support**: Browser and desktop tiers work without internet

### Negative
1. **Complexity**: Must maintain 3 different MD engines and routing logic
2. **Feature Parity**: Not all force fields available in all tiers
3. **UX Challenges**: Must clearly communicate capabilities and wait times
4. **Desktop Distribution**: Need to package, sign, and distribute desktop applications
5. **Testing**: Must test across all tiers and simulation complexity levels

### Risk Mitigation
- **Vendor Lock-in**: Use open-source MD engines (GROMACS, OpenMM)
- **Browser MD Overhead**: Pre-warm WASM module, cache compiled binaries
- **Serverless Cold Starts**: Keep warm instances for peak hours
- **Desktop Adoption**: Make desktop app optional, provide cloud alternative for paid users

## Alternatives Considered

### 1. Browser-Only MD
**Rejected**: Cannot handle realistic simulation sizes (10,000+ atoms), poor performance for educational use cases.

### 2. Cloud-Only MD
**Rejected**: Cost prohibitive ($2,000-5,000/month for 10,000 MAU), latency issues, requires internet connection.

### 3. Desktop-Only MD
**Rejected**: High barrier to entry, no quick explorations, excludes Chromebook users, poor mobile experience.

### 4. Pre-Computed Trajectories Only
**Rejected**: Not truly interactive, limited to curated content, defeats purpose of exploratory learning.

## Implementation Notes

### Browser MD Engine
- Use OpenMM WebAssembly port or custom minimalist engine
- Implement Verlet integration with simple force fields (Amber ff14SB subset)
- Progressive loading: render while simulating

### Serverless MD
- AWS Lambda with container support (10GB memory)
- Pre-built GROMACS containers with common force fields
- S3 for trajectory storage, CloudFront for delivery

### Desktop MD
- Electron wrapper for cross-platform distribution
- Direct GROMACS integration via child processes
- Local trajectory storage with optional cloud sync

### Monitoring
- Track simulation tier usage and costs
- Monitor success rates and completion times per tier
- A/B test routing thresholds for cost optimization

## References
- Technical Analysis: `/docs/analysis/technical-analysis.md`
- Cost Modeling: `/docs/analysis/cost-estimates.md`
- GROMACS WASM: https://github.com/gromacs/gromacs/discussions/4321
- OpenMM: http://openmm.org/
- Vercel Edge Functions: https://vercel.com/docs/functions/edge-functions
