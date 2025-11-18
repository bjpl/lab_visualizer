# ADR-002: Single Visualization Library (Mol*)

## Status
Accepted

## Context

The LAB Visualization Platform needs to visualize complex biomolecular structures (proteins, DNA, RNA) and cellular environments. Initial technical research revealed significant redundancy in the proposed visualization stack:

1. **Redundant Libraries**:
   - Mol*, NGL Viewer, and JSmol all provide similar molecular visualization
   - Each library: 2-5MB bundle size
   - Different APIs requiring separate learning curves
   - Overlapping features and capabilities

2. **Bundle Size Concerns**:
   - Total proposed bundle: ~15-20MB for visualization alone
   - Mobile users on slow connections: 30+ second load times
   - Lighthouse performance budget: <5MB JavaScript

3. **Maintenance Burden**:
   - Must track updates for 3+ molecular visualization libraries
   - Integration complexity with state management
   - Inconsistent rendering quality and performance

4. **User Experience**:
   - Inconsistent UI/UX across different visualization modes
   - Confusion about which tool to use for which task
   - Performance varies wildly between libraries

5. **Strengths Analysis**:
   - **Mol***: Best performance, WebGL2, RCSB PDB standard, active development
   - **NGL Viewer**: Good performance, but slower updates, smaller community
   - **JSmol**: Legacy Java applet heritage, larger bundle, slower rendering

## Decision

We will adopt a **simplified single-library visualization architecture**:

### Molecular Visualization: Mol* Only
- **Primary Library**: Mol* (Molstar) for all molecular visualization
- **Scope**: Proteins, DNA, RNA, ligands, small molecules
- **Features**:
  - All standard representations (cartoon, surface, ball-and-stick)
  - Sequence alignment visualization
  - Electron density maps
  - Animation and trajectory playback
  - Selection and measurement tools

### Cellular Visualization: Three.js
- **Primary Library**: Three.js for cellular and organelle visualization
- **Scope**: Cell membranes, organelles, cellular compartments
- **Features**:
  - Custom geometries for cellular structures
  - Instanced rendering for large particle systems
  - Advanced lighting and materials
  - VR/AR support for future features

### Architecture
```
Visualization Layer
├── MolecularViewer (Mol*)
│   ├── ProteinStructure
│   ├── DNAStructure
│   ├── LigandBinding
│   └── TrajectoryPlayer
└── CellularViewer (Three.js)
    ├── CellMembrane
    ├── Organelles
    ├── VesicleTransport
    └── CellularCompartments
```

### Shared Components
- Unified camera controls (orbit, pan, zoom)
- Consistent selection and highlighting
- Shared state management (Zustand)
- Common UI controls and panels

## Consequences

### Positive
1. **Reduced Bundle Size**: ~40% reduction (from 15MB to 9MB)
2. **Consistent UX**: Single visualization paradigm for molecular structures
3. **Simplified Maintenance**: One library to update and debug
4. **Better Performance**: Mol* optimized for large structures with WebGL2
5. **RCSB PDB Integration**: Mol* is the official PDB viewer (trusted source)
6. **Active Development**: Mol* receives regular updates and features
7. **Better Documentation**: Focus effort on one comprehensive guide
8. **Faster Load Times**: 40% faster initial page load on mobile

### Negative
1. **Single Vendor Risk**: Dependent on Mol* project continuity
2. **Learning Curve**: Team must become Mol* experts
3. **Feature Limitations**: Some niche features may require custom development
4. **Migration Cost**: If Mol* becomes unmaintained, migration is expensive

### Risk Mitigation
- **Vendor Risk**: Mol* is backed by RCSB PDB (stable funding), large open-source community
- **Learning Curve**: Invest in comprehensive documentation and training
- **Feature Gaps**: Contribute back to Mol* project, maintain plugin ecosystem
- **Migration Risk**: Abstract visualization layer behind adapter pattern

## Alternatives Considered

### 1. Keep All Three Libraries (Mol*, NGL, JSmol)
**Rejected**:
- 15MB+ bundle size kills mobile performance
- Maintenance nightmare across 3 libraries
- Inconsistent UX confuses users
- Redundant features with no clear benefit

### 2. Use Only NGL Viewer
**Rejected**:
- Slower development velocity than Mol*
- Smaller community and fewer features
- Not the official RCSB PDB viewer
- Less optimized for large structures

### 3. Use Only JSmol
**Rejected**:
- Largest bundle size (5MB+)
- Legacy codebase with slower updates
- Poorest performance on mobile
- Java applet heritage creates security concerns

### 4. Build Custom WebGL Viewer
**Rejected**:
- 6-12 months development time
- Requires specialized WebGL expertise
- Cannot match feature parity with Mol*
- Ongoing maintenance burden

### 5. Use React-Three-Fiber for Everything
**Rejected**:
- Must implement molecular rendering from scratch
- No built-in PDB parsing or molecular representations
- Poor performance for large molecular structures
- Reinventing the wheel

## Implementation Notes

### Mol* Integration
```typescript
// Unified viewer abstraction
interface MolecularViewer {
  loadStructure(pdbId: string): Promise<void>;
  setRepresentation(type: RepresentationType): void;
  playTrajectory(frames: Frame[]): void;
  exportImage(format: 'png' | 'svg'): Promise<Blob>;
}

class MolstarAdapter implements MolecularViewer {
  private viewer: PluginContext;

  async loadStructure(pdbId: string) {
    const data = await this.fetchPDB(pdbId);
    await this.viewer.builders.structure.parse(data);
  }

  // ... implementation
}
```

### Three.js Integration
```typescript
// Cellular visualization with Three.js
class CellularViewer {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  renderCellMembrane(geometry: CellGeometry) {
    const membrane = new THREE.Mesh(
      geometry,
      new THREE.MeshPhysicalMaterial({ /* ... */ })
    );
    this.scene.add(membrane);
  }

  // ... implementation
}
```

### Performance Optimization
- Code splitting: Load Mol* only when needed
- Progressive enhancement: Show 2D representations first, load 3D on interaction
- Web Workers: Offload PDB parsing and trajectory processing
- IndexedDB caching: Cache parsed structures locally

### Migration Path
If Mol* becomes unmaintained:
1. Adapter pattern abstracts implementation details
2. Swap adapter to NGL Viewer or custom implementation
3. UI components remain unchanged
4. Estimated migration: 2-4 weeks

## References
- Mol* Documentation: https://molstar.org/
- Mol* GitHub: https://github.com/molstar/molstar
- Three.js Documentation: https://threejs.org/docs/
- RCSB PDB: https://www.rcsb.org/
- Technical Analysis: `/docs/analysis/technical-analysis.md`
- Performance Budget: `/docs/adrs/006-performance-budgets.md`
