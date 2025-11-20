# Data Pipeline Component Index
## Complete Guide to Data Transformation Files

### Overview Documents

1. **`data-transformation-analysis.md`** (THIS FOLDER)
   - Comprehensive 10-section architectural analysis
   - Detailed explanation of all transformations
   - Performance characteristics and complexity analysis
   - Optimization recommendations

2. **`data-pipeline-quick-reference.md`** (THIS FOLDER)
   - Quick lookup tables and formulas
   - Code examples for common operations
   - Performance budgets and targets
   - Debugging checklists

3. **`data-flow-diagrams.md`** (THIS FOLDER)
   - Visual ASCII art diagrams
   - Step-by-step data flow illustrations
   - Complete system architecture views

---

## Source Code by Data Pipeline Stage

### STAGE 1: Parsing & Data Extraction

#### Core Parsers
```
/src/lib/pdb-parser.ts
├─ parsePDB() - Main entry point, auto-detects format
├─ parsePDBFormat() - Fixed-width PDB parsing (O(n))
├─ parseMMCIF() - mmCIF format parsing
├─ parseAtomLine() - Extract atom data from PDB line
├─ calculateStatistics() - Compute structure metrics (O(n))
├─ inferBonds() - Distance-based bond inference (O(n²))
└─ validateStructure() - Data quality checks

Purpose: Transform text files into typed data structures
Input: Raw PDB/mmCIF text
Output: ParsedStructure { atoms, bonds, metadata, statistics }
Complexity: O(n) parsing + O(n²) bond inference (limited to <5K atoms)
```

#### Web Worker Parsers
```
/src/workers/pdb-parser.worker.ts
├─ parsePDB() - PDB format in background thread
├─ parseCIF() - mmCIF format (stub for Mol* integration)
├─ parseSDF() - SDF format (stub)
└─ Message handlers for async communication

Purpose: Prevent UI blocking during large file parsing
Communication: Transferable objects via postMessage
Performance: Offloads 100-1000ms operations to background
```

---

### STAGE 2: Molecular Dynamics Simulation

#### Force Field & Energy Calculations
```
/src/services/md-simulation.ts
├─ MDSimulationService class
│  ├─ setForceField() - Configure AMBER/CHARMM/OPLS parameters
│  ├─ calculateEnergy() - Sum of all energy components
│  │  ├─ calculateBondEnergy() - Harmonic bond potential (O(n))
│  │  ├─ calculateAngleEnergy() - Angle bending energy (O(n))
│  │  ├─ calculateDihedralEnergy() - Torsional energy (O(n))
│  │  ├─ calculateVdWEnergy() - Lennard-Jones 12-6 (O(n²))
│  │  └─ calculateCoulombEnergy() - Electrostatic (O(n²))
│  ├─ minimize() - Energy minimization (steepest descent/CG/L-BFGS)
│  ├─ runSimulation() - MD integration with trajectory output
│  └─ calculateForces() - Numerical gradient (O(n³))

Purpose: Physics-based molecular dynamics calculations
Input: Atom positions (Float32Array) + simulation parameters
Output: TrajectoryData { frames, energies, statistics }
Bottleneck: O(n²) pairwise interactions, O(n³) force calculation
```

#### Browser-Safe MD Engine
```
/src/lib/md-browser-dynamica.ts
├─ WebDynamicaEngine class
│  ├─ initialize() - Setup simulation with safety checks
│  ├─ start() - Begin simulation loop
│  ├─ runSimulationLoop() - Main MD loop (requestAnimationFrame)
│  ├─ performMDStep() - Single integration step
│  ├─ captureFrame() - Save trajectory frame
│  └─ exportTrajectory() - Export to PDB/XYZ/JSON

Safety Limits:
  - Max atoms: 500
  - Max wall-clock time: 30 seconds
  - Min FPS: 5 (auto-stop if too slow)
  - Max steps: 10,000

Purpose: Demo-grade MD for educational use
Architecture: Browser tier of 3-tier system
```

#### Simulation Controllers
```
/src/services/browser-simulation.ts
├─ BrowserSimulationController class
│  ├─ initialize() - Validate config and setup
│  ├─ start() - Launch simulation with callbacks
│  ├─ getState() - Current progress and metrics
│  ├─ getMetrics() - Statistical analysis
│  └─ validateConfig() - Safety constraint checks

/src/workers/md-simulation.worker.ts
├─ Background MD computation
├─ Energy calculation offloading
├─ Minimization in worker thread
└─ Real-time progress reporting
```

---

### STAGE 3: Level of Detail (LOD) System

#### LOD Manager
```
/src/lib/lod-manager.ts
├─ LODManager class
│  ├─ analyzeComplexity() - Calculate vertices, memory needs
│  ├─ determineStartingLevel() - PREVIEW/INTERACTIVE/FULL decision
│  ├─ loadProgressive() - Multi-stage loading coordinator
│  ├─ filterAtomsForLevel() - Atom subset selection
│  │  ├─ selectBackboneAtoms() - CA, C, N, O only
│  │  └─ selectKeyAtoms() - + CB and ligands
│  ├─ loadStage() - Single LOD stage rendering
│  ├─ measureFPS() - Performance measurement
│  └─ estimateMemoryUsage() - Resource budgeting

LOD Levels:
  PREVIEW (1):    100 atoms, 6 segments, 200ms target, 60 FPS
  INTERACTIVE (2): 1K atoms, 12 segments, 1000ms target, 60 FPS
  FULL (3):       100K atoms, 24 segments, 3000ms target, 30 FPS

Purpose: Progressive quality enhancement
Strategy: Load PREVIEW → INTERACTIVE → FULL
Performance: Perceived instant feedback with progressive detail
```

#### Geometry Generation
```
/src/workers/geometry-loader.worker.ts
├─ handleLoadGeometry() - Main geometry generation
├─ generateGeometry() - Sphere tessellation for all atoms
│  └─ generateSphere() - UV sphere algorithm
├─ handleSimplifyGeometry() - Polygon reduction
├─ handlePrepareInstances() - Instance matrix preparation
└─ calculateBounds() - Bounding box calculation

Data Structures:
  GeometryData {
    vertices: Float32Array   // [x,y,z, x,y,z, ...]
    normals: Float32Array    // [nx,ny,nz, nx,ny,nz, ...]
    indices: Uint32Array     // [i1,i2,i3, i4,i5,i6, ...]
    colors: Float32Array     // [r,g,b, r,g,b, ...]
  }

Purpose: Convert atoms to WebGL-ready geometry
Output: Transferable typed arrays (zero-copy to GPU)
Complexity: O(n × segments²)
```

---

### STAGE 4: Performance Monitoring & Optimization

#### Performance Profiler
```
/src/lib/performance-profiler.ts
├─ PerformanceProfiler class
│  ├─ initialize() - Setup with WebGL context
│  ├─ startFrame() / endFrame() - Per-frame profiling
│  ├─ analyzeBottleneck() - CPU/GPU/Memory detection
│  ├─ generateReport() - Comprehensive analysis
│  ├─ measureFPS() - Average FPS over sample period
│  └─ getRealTimeStats() - Current performance metrics

Metrics Tracked:
  - Frame time (ms)
  - FPS (frames per second)
  - CPU time (ms)
  - GPU time (ms) [via EXT_disjoint_timer_query]
  - Memory usage (bytes)
  - Draw calls
  - Triangle count

Purpose: Real-time performance monitoring and optimization
Algorithm: Rolling buffer of 1000 frames for analysis
```

#### Cache Strategy Engine
```
/src/lib/cache-strategy.ts
├─ CacheStrategyEngine class
│  ├─ calculateScore() - Multi-factor scoring
│  │  = (popularity × 0.5) + (recency × 0.3) + (relevance × 0.2)
│  ├─ getStructuresToCache() - Budget-constrained selection
│  ├─ updateHistory() - Track recent accesses
│  ├─ updatePopularity() - Increment access count
│  ├─ registerFamily() - Protein family relationships
│  ├─ adaptStrategy() - Self-tuning based on hit rate
│  └─ getHealthMetrics() - Cache effectiveness analysis

Scoring Factors:
  - Popularity: Access frequency (0.0-1.0)
  - Recency: Exponential decay e^(-index/3)
  - Relevance: Family/complex relationships

Purpose: Intelligent pre-caching of popular structures
Performance: 50-70% cache hit rate (target)
```

#### Cache Services
```
/src/lib/cache/cache-service.ts
├─ IndexedDB management
├─ LRU eviction policy
├─ Compression support
└─ Prefetch coordination

/src/workers/cache-worker.ts
├─ Background cache operations
├─ Asynchronous prefetching
└─ Storage management
```

#### Cost Tracking
```
/src/lib/cost-calculator.ts
├─ calculateVercelCosts() - Bandwidth, functions, builds
├─ calculateSupabaseCosts() - Database, storage, auth
├─ calculateSimulationCosts() - MD job pricing
├─ projectCosts() - Linear regression forecasting
├─ generateOptimizationRecommendations() - Cost savings
└─ calculateFeatureCosts() - Per-feature breakdown

Purpose: Infrastructure cost monitoring and optimization
Method: Usage tracking + trend analysis + recommendations
```

---

### STAGE 5: Data Access Hooks & Services

#### React Hooks
```
/src/hooks/use-pdb.ts
├─ Fetch and parse PDB structures
└─ Manage loading states

/src/hooks/use-simulation.ts
├─ Monitor simulation progress
├─ Real-time status updates
└─ Result retrieval

/src/hooks/use-cached-fetch.ts
├─ Cache-aware data fetching
└─ Automatic invalidation

/src/hooks/use-molstar.ts
├─ MolStar integration
└─ Viewer lifecycle management
```

#### External Services
```
/src/services/pdb-service.ts
├─ RCSB PDB API integration
└─ Structure metadata fetching

/src/services/molstar-service.ts
├─ MolStar viewer wrapper
└─ LOD bridge integration

/src/services/simulation-monitor.ts
├─ Real-time simulation tracking
└─ Supabase realtime subscriptions

/src/services/quality-manager.ts
├─ Adaptive quality settings
└─ Device capability detection
```

---

### STAGE 6: Utilities & Helpers

#### General Utilities
```
/src/lib/utils.ts
├─ formatBytes() - Human-readable file sizes
├─ formatDuration() - Time formatting
├─ debounce() - Function debouncing
└─ throttle() - Function throttling

Purpose: Common data formatting and utility functions
```

#### Type Definitions
```
/src/types/md-types.ts
├─ MDTier enum - Browser/Serverless/Desktop
├─ JobStatus enum - Simulation states
├─ MDSimulationConfig - Simulation parameters
├─ TrajectoryFrame - Frame data structure
└─ MDValidation - Validation results

/src/types/pdb.ts
├─ Atom interface
├─ Bond interface
├─ Metadata interface
└─ Statistics interface

Purpose: Type safety for data structures throughout pipeline
```

---

## Data Flow Summary by File

### Parsing Pipeline
```
User uploads file
    ↓
/src/lib/pdb-parser.ts (format detection)
    ↓
/src/workers/pdb-parser.worker.ts (background parsing)
    ↓
Structured Atom[] + Bond[] + Metadata
```

### Simulation Pipeline
```
Atom[] + MDSimulationParams
    ↓
/src/services/md-simulation.ts (force field setup)
    ↓
/src/lib/md-browser-dynamica.ts (integration loop)
    ↓
/src/workers/md-simulation.worker.ts (background calculation)
    ↓
TrajectoryData { frames, energies, statistics }
```

### Rendering Pipeline
```
Atom[]
    ↓
/src/lib/lod-manager.ts (complexity analysis, LOD selection)
    ↓
/src/workers/geometry-loader.worker.ts (sphere tessellation)
    ↓
GeometryData { vertices, normals, indices, colors }
    ↓
WebGL buffers (GPU upload)
    ↓
Rendered visualization
```

### Performance Monitoring
```
Each render frame
    ↓
/src/lib/performance-profiler.ts (metric collection)
    ↓
PerformanceProfile { fps, cpuTime, gpuTime, memory }
    ↓
Bottleneck analysis
    ↓
Recommendations for optimization
```

### Caching Pipeline
```
Structure access
    ↓
/src/lib/cache-strategy.ts (scoring algorithm)
    ↓
/src/lib/cache/cache-service.ts (IndexedDB storage)
    ↓
/src/workers/cache-worker.ts (background prefetch)
    ↓
Improved load times
```

---

## Key Algorithms by Complexity

```
Operation                          | File                          | Complexity
-----------------------------------|-------------------------------|------------
PDB line parsing                   | pdb-parser.ts                 | O(n)
Bond inference                     | pdb-parser.ts                 | O(n²)
Energy calculation (full)          | md-simulation.ts              | O(n²)
Force calculation (numerical)      | md-simulation.ts              | O(n³)
MD integration (per step)          | md-browser-dynamica.ts        | O(n²)
Sphere tessellation                | geometry-loader.worker.ts     | O(n·s²)
LOD atom filtering                 | lod-manager.ts                | O(n)
Bottleneck analysis                | performance-profiler.ts       | O(1)
Cache score calculation            | cache-strategy.ts             | O(m)
Instanced rendering                | geometry-loader.worker.ts     | O(1)
```

---

## Performance Characteristics

```
File                          | Operation          | Time (1000 atoms)
------------------------------|--------------------|-----------------
pdb-parser.ts                 | Parse              | ~100ms
md-simulation.ts              | Energy calc        | ~10ms
md-simulation.ts              | Force calc         | ~500ms
md-simulation.ts              | 1000 MD steps      | ~45s
lod-manager.ts                | PREVIEW load       | ~150ms
lod-manager.ts                | FULL load          | ~800ms
geometry-loader.worker.ts     | Geometry gen       | ~200ms
performance-profiler.ts       | Analysis           | <5ms
cache-strategy.ts             | Scoring            | <1ms
```

---

## Testing Files

```
/tests/services/pdb-service.test.ts
/tests/services/md-simulation.test.ts
/tests/services/molstar-lod-bridge.test.ts
/tests/services/learning-content.test.ts
```

---

## Configuration Files

```
/config/cost-budgets.ts
├─ VERCEL_PRICING - Bandwidth, functions, builds
├─ SUPABASE_PRICING - Database, storage, auth
├─ SIMULATION_PRICING - MD job costs
└─ OPTIMIZATION_THRESHOLDS - Performance limits

/src/config/constants.ts
├─ Application-wide constants
└─ Default values
```

---

## Next Steps

1. **For Performance Optimization**: Start with `/src/lib/performance-profiler.ts`
2. **For MD Simulation**: Review `/src/services/md-simulation.ts`
3. **For Rendering**: Explore `/src/lib/lod-manager.ts` and geometry workers
4. **For Caching**: Study `/src/lib/cache-strategy.ts`
5. **For Data Parsing**: Begin with `/src/lib/pdb-parser.ts`

---

**Complete Documentation Set:**
- Architecture Analysis: `data-transformation-analysis.md` (detailed)
- Quick Reference: `data-pipeline-quick-reference.md` (lookup)
- Visual Diagrams: `data-flow-diagrams.md` (illustrations)
- Component Index: `data-pipeline-index.md` (this file)
