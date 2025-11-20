# Data Pipeline Quick Reference Guide
## Molecular Dynamics Lab Visualizer

### 1. File Processing Pipeline

```
PDB/mmCIF File → Parser → Structured Data → Processing → Rendering
    (text)      (O(n))    (typed objects)    (O(n²))    (O(1) GPU)
```

### 2. Key Data Structures

#### Input Format (PDB)
```
ATOM    123  CA  ALA A  15      12.345  23.456  34.567  1.00 20.00           C
│       │    │   │   │  │       │       │       │       │    │              │
└─ Record type (6 chars)                                                     └─ Element
        └─ Serial number (5 chars)
             └─ Atom name (4 chars)
                 └─ Residue (3 chars)
                     └─ Chain (1 char)
                         └─ Residue seq (4 chars)
                             └─ X coordinate (8 chars)
                                     └─ Y coordinate (8 chars)
                                             └─ Z coordinate (8 chars)
                                                     └─ Occupancy
                                                          └─ Temp factor
```

#### Output Structure (TypeScript)
```typescript
interface Atom {
  serial: number;        // Unique identifier
  name: string;          // "CA", "CB", etc.
  resName: string;       // "ALA", "GLY", etc.
  chainID: string;       // "A", "B", etc.
  x, y, z: number;       // Angstroms
  element: string;       // "C", "N", "O", etc.
}
```

### 3. Processing Stages

| Stage | Input | Output | Time | Complexity |
|-------|-------|--------|------|------------|
| Parse | Text file | Atom[] | 10-1000ms | O(n) |
| Analyze | Atom[] | Statistics | <10ms | O(n) |
| LOD Filter | Atom[] | Filtered Atom[] | <50ms | O(n) |
| Geometry | Atom[] | WebGL Buffers | 50-3000ms | O(n·s²) |
| MD Simulation | Atom[] | Trajectory | 2-30s | O(n²) |

### 4. LOD System Quick Guide

```
PREVIEW (Level 1)
├─ Atoms: 100 max
├─ Features: Backbone only (CA, C, N, O)
├─ Segments: 6 (low-poly spheres)
├─ Target: 200ms load, 60 FPS
└─ Use case: Initial preview

INTERACTIVE (Level 2)
├─ Atoms: 1,000 max
├─ Features: + Secondary structure + Ligands
├─ Segments: 12 (medium-poly)
├─ Target: 1000ms load, 60 FPS
└─ Use case: Interactive exploration

FULL (Level 3)
├─ Atoms: 100,000 max
├─ Features: + Sidechains + Surfaces + Shadows + AO
├─ Segments: 24 (high-poly)
├─ Target: 3000ms load, 30 FPS
└─ Use case: Publication quality
```

### 5. MD Simulation Tiers

```
BROWSER Tier (WebDynamica)
├─ Limit: <500 atoms
├─ Time: <30 seconds wall-clock
├─ Purpose: Educational demos
└─ Technology: JavaScript/WebAssembly

SERVERLESS Tier (OpenMM)
├─ Limit: <5,000 atoms
├─ Time: <5 minutes
├─ Purpose: Production simulations
└─ Technology: Supabase Edge Functions

DESKTOP Tier (Export)
├─ Limit: Unlimited
├─ Time: User's hardware
├─ Purpose: HPC-grade simulations
└─ Technology: GROMACS/NAMD/AMBER
```

### 6. Energy Calculations

```typescript
// Bond Energy (Harmonic)
E_bond = Σ (1/2) * k * (r - r₀)²
// k ~ 300,000 kJ/mol/nm²

// Van der Waals (Lennard-Jones)
E_vdw = Σ 4ε[(σ/r)¹² - (σ/r)⁶]
// ε ~ 0.5 kJ/mol, σ ~ 0.35 nm

// Total Energy
E_total = E_bond + E_angle + E_dihedral + E_vdw + E_coulomb
// Typical: -500 to -2000 kJ/mol for proteins
```

### 7. Performance Budgets

```
Structure Size  | Parse | LOD PREVIEW | MD (1000 steps) | Memory
----------------|-------|-------------|-----------------|--------
100 atoms       | 10ms  | 50ms        | 2s              | 5 MB
500 atoms       | 50ms  | 100ms       | 15s             | 20 MB
1,000 atoms     | 100ms | 150ms       | 45s             | 40 MB
5,000 atoms     | 500ms | 300ms       | Serverless      | 150 MB
10,000 atoms    | 1s    | 500ms       | Serverless      | 300 MB
```

### 8. Bottleneck Detection

```
Symptom                          | Bottleneck | Solution
---------------------------------|------------|------------------
FPS < 30, CPU > 80%             | CPU        | Web Workers, batching
FPS < 30, GPU > 80%             | GPU        | LOD, lower quality
Memory > 500MB                   | Memory     | Aggressive LOD
Slow parsing                     | I/O        | Web Worker, streaming
Slow simulation                  | Algorithm  | Cutoffs, GPU compute
```

### 9. Cache Strategy Scoring

```
Score = (Popularity × 0.5) + (Recency × 0.3) + (Relevance × 0.2)

Popularity: 0.0-1.0 (based on access frequency)
Recency: e^(-index/3) (exponential decay)
Relevance: 0.0-1.0 (family/complex relationships)

Top Educational Structures (pre-cached):
1HHO, 2DHB, 1MBO, 2LYZ, 4HHB, 1CRN, 1UBQ, 1GFL, 1BNA, 1TIM
```

### 10. Common Operations

#### Parse PDB File
```typescript
import { parsePDB } from '@/lib/pdb-parser';

const structure = await parsePDB(fileContent, {
  includeHydrogens: false,
  includeWater: false,
  onProgress: (percent, message) => console.log(percent, message)
});
```

#### Run Browser MD Simulation
```typescript
import { createBrowserSimulation } from '@/services/browser-simulation';

const sim = createBrowserSimulation();
await sim.initialize(positions, atomCount, {
  temperature: 300,    // Kelvin
  timestep: 1.0,       // femtoseconds
  steps: 1000,         // integration steps
  integrator: 'verlet',
  forceField: 'AMBER',
  ensemble: 'NVT',
  outputFrequency: 10
});

sim.start((state) => {
  console.log(`Progress: ${state.progress}%`);
});
```

#### Progressive LOD Rendering
```typescript
import { createLODManager } from '@/lib/lod-manager';

const lod = createLODManager({
  onStageComplete: (result) => {
    console.log(`${result.level}: ${result.duration}ms, ${result.fps} FPS`);
  }
});

const complexity = lod.analyzeComplexity(structure);
await lod.loadProgressive(structure, renderer, LODLevel.FULL);
```

### 11. Memory Estimation

```
Component               | Formula                    | Example (1000 atoms)
------------------------|----------------------------|----------------------
Parsed Structure        | atoms × 200 bytes          | 200 KB
Geometry (PREVIEW)      | atoms × 0.25 × 5 KB        | 1.25 MB
Geometry (INTERACTIVE)  | atoms × 0.3 × 6 KB         | 1.8 MB
Geometry (FULL)         | atoms × 1.0 × 36 KB        | 36 MB
Trajectory (100 frames) | atoms × frames × 12 bytes  | 1.2 MB
```

### 12. File Size Reference

```
Structure Type           | Atoms    | File Size | Parse Time
-------------------------|----------|-----------|------------
Small molecule           | 50       | 5 KB      | <10ms
Protein monomer          | 1,000    | 100 KB    | ~100ms
Protein complex          | 5,000    | 500 KB    | ~500ms
Large assembly           | 10,000   | 1 MB      | ~1s
Virus capsid             | 100,000  | 10 MB     | ~10s
```

### 13. Force Field Parameters

```
Parameter    | AMBER     | CHARMM    | OPLS
-------------|-----------|-----------|----------
k_bond       | 284,512   | 322,560   | 265,265  (kJ/mol/nm²)
k_angle      | 418.4     | 460.24    | 383.25   (kJ/mol/rad²)
epsilon_vdw  | 0.6364    | 0.4577    | 0.6502   (kJ/mol)
sigma_vdw    | 0.3550    | 0.3500    | 0.3550   (nm)
coulomb_k    | 138.935   | 138.935   | 138.935  (kJ·nm/mol/e²)
```

### 14. Debugging Checklist

**Slow Parsing?**
- [ ] Check file size (>10MB?)
- [ ] Enable Web Worker parsing
- [ ] Disable hydrogen/water atoms

**Low FPS?**
- [ ] Check LOD level (use PREVIEW first)
- [ ] Analyze bottleneck (CPU/GPU/Memory)
- [ ] Enable instanced rendering
- [ ] Reduce atom count via filtering

**High Memory?**
- [ ] Disable FULL quality LOD
- [ ] Clear unused buffers
- [ ] Reduce cached structures
- [ ] Limit trajectory frame count

**Simulation Too Slow?**
- [ ] Reduce atom count (<500 for browser)
- [ ] Decrease timestep count
- [ ] Use serverless tier
- [ ] Export to desktop MD software

### 15. Best Practices

1. **Always use Web Workers** for parsing files >100KB
2. **Start with PREVIEW LOD** for structures >1000 atoms
3. **Enable progressive loading** for better UX
4. **Monitor performance** with built-in profiler
5. **Cache popular structures** (top 20 educational)
6. **Validate configurations** before simulation
7. **Use transferable objects** for worker communication
8. **Implement error boundaries** for parsing failures
9. **Track memory usage** in production
10. **Optimize for target device** (mobile vs desktop)

---

**Quick Links:**
- Full Analysis: `data-transformation-analysis.md`
- Performance Guide: `../../PERFORMANCE.md`
- LOD Documentation: `../../LOD_SPRINT_COMPLETE.md`
