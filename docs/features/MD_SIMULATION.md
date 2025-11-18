# Molecular Dynamics Simulation

Comprehensive browser-based MD simulation system for educational and research purposes.

## Overview

The LAB Visualization Platform includes a complete molecular dynamics simulation framework that runs directly in the browser, with integration capabilities for MolStar visualization and export to professional MD software.

## Architecture

### Three-Tier Design

1. **Browser Tier** (Educational/Demo)
   - WebDynamica-based simulation engine
   - Maximum 500 atoms
   - Maximum 30 seconds wall-clock time
   - Simplified physics for real-time interaction
   - Perfect for learning and quick exploration

2. **Serverless Tier** (Production Research)
   - OpenMM on Vercel Edge Functions
   - Up to 5,000 atoms
   - Cloud-based computation
   - Full production force fields
   - Job queue and result storage in Supabase

3. **Desktop Export** (High-Performance Computing)
   - Export to GROMACS, NAMD, AMBER, LAMMPS
   - Includes topology, parameters, and run scripts
   - For large-scale production simulations
   - Seamless handoff to HPC clusters

## Components

### Core Service

**`src/services/md-simulation.ts`**

Main simulation engine providing:
- Force field initialization (AMBER, CHARMM, OPLS)
- Energy calculation with component breakdown
- Energy minimization (steepest descent, conjugate gradient, L-BFGS)
- Molecular dynamics integration
- Trajectory analysis and export

```typescript
import { createMDSimulation } from '@/services/md-simulation';

const mdService = createMDSimulation();
mdService.setForceField('AMBER');

const energy = mdService.calculateEnergy(positions, atomCount);
const minimized = await mdService.minimize(positions, atomCount, {
  algorithm: 'steepest-descent',
  maxIterations: 1000,
  tolerance: 0.1,
  stepSize: 0.01
});

const trajectory = await mdService.runSimulation(positions, atomCount, {
  temperature: 300,
  timestep: 1.0,
  steps: 5000,
  integrator: 'langevin',
  forceField: 'AMBER',
  ensemble: 'NVT',
  outputFrequency: 10
});
```

### UI Components

#### SimulationControls

Play/pause/step controls for trajectory playback.

```tsx
<SimulationControls
  controls={controlsState}
  onPlay={() => {}}
  onPause={() => {}}
  onStop={() => {}}
  onStepForward={() => {}}
  onStepBackward={() => {}}
  onFrameChange={(frame) => {}}
  onSpeedChange={(speed) => {}}
  onLoopToggle={() => {}}
/>
```

#### ForceFieldSettings

Interactive force field parameter adjustment.

```tsx
<ForceFieldSettings
  config={forceFieldConfig}
  onChange={(newConfig) => {}}
  disabled={isSimulating}
/>
```

#### EnergyPlot

Real-time energy vs time visualization with SVG charts.

```tsx
<EnergyPlot
  data={{
    time: [...],
    potential: [...],
    kinetic: [...],
    total: [...],
    temperature: [...]
  }}
  width={800}
  height={300}
  showLegend
  showGrid
/>
```

#### SimulationPresets

Pre-configured simulation scenarios for learning.

```tsx
<SimulationPresets
  presets={SIMULATION_PRESETS}
  selectedPreset={preset}
  onSelect={(preset) => {}}
/>
```

### Web Worker

**`src/workers/md-simulation.worker.ts`**

Offloads CPU-intensive calculations to background thread:
- Energy calculations
- Force computations
- Integration steps
- Trajectory analysis

Prevents UI freezing during long simulations.

```typescript
const worker = new Worker('/workers/md-simulation.worker.ts');

worker.postMessage({
  type: 'runSimulation',
  payload: {
    positions,
    atomCount,
    params
  }
});

worker.onmessage = (event) => {
  const { type, payload } = event.data;
  switch (type) {
    case 'frame':
      updateVisualization(payload.frame);
      break;
    case 'complete':
      handleComplete(payload.trajectory);
      break;
  }
};
```

## Features

### Force Fields

Three industry-standard force fields included:

- **AMBER**: Optimized for proteins and nucleic acids
- **CHARMM**: Comprehensive biomolecular force field
- **OPLS**: All-atom force field for organic liquids

Each with customizable parameters:
- Bond spring constants and equilibrium distances
- Angle force constants
- Dihedral torsion parameters
- Van der Waals interactions (Lennard-Jones)
- Electrostatic interactions (Coulomb)

### Energy Minimization

Three algorithms available:

1. **Steepest Descent**
   - Fastest convergence initially
   - Good for removing bad contacts
   - May oscillate near minimum

2. **Conjugate Gradient**
   - Better final convergence
   - More efficient near minimum
   - Recommended for most cases

3. **L-BFGS** (Limited-memory BFGS)
   - Quasi-Newton method
   - Excellent convergence properties
   - Best for well-behaved systems

### Integration Methods

1. **Velocity Verlet**
   - Symplectic integrator
   - Good energy conservation
   - Best for NVE ensemble

2. **Leapfrog**
   - Similar to Verlet
   - Velocities at half-steps
   - Efficient implementation

3. **Langevin**
   - Includes friction and noise
   - Built-in temperature control
   - Required for NVT ensemble

### Simulation Presets

Five educational presets included:

1. **Protein Folding (Basic)**
   - Small peptide folding
   - Beginner difficulty
   - 10-second simulation

2. **Ligand Docking**
   - Small molecule binding
   - Intermediate difficulty
   - 15-second simulation

3. **Energy Minimization**
   - Geometry optimization
   - Beginner difficulty
   - 5-second simulation

4. **Membrane Protein**
   - Protein in lipid bilayer
   - Advanced difficulty
   - 20-second simulation

5. **Water Box**
   - Basic MD demonstration
   - Beginner difficulty
   - 5-second simulation

## Integration with MolStar

The simulation system integrates seamlessly with MolStar viewer:

```typescript
// Update MolStar with simulation frame
const frameData = mdService.exportForMolStar(frameIndex);

// frameData contains:
// - positions: Float32Array of atom coordinates
// - energy: total energy for this frame
// - temperature: instantaneous temperature

// Pass to MolStar for rendering
molstarViewer.updatePositions(frameData.positions);
```

## Performance Considerations

### Browser Tier Limits

- **Atom Count**: Maximum 500 atoms
- **Wall Time**: Maximum 30 seconds
- **Memory**: ~200 MB allocated
- **FPS**: Minimum 5 FPS maintained

Performance automatically monitored and simulation stopped if:
- Wall time exceeds 30 seconds
- FPS drops below 5
- Memory usage exceeds 200 MB

### Optimization Strategies

1. **Web Workers**: Offload computation from main thread
2. **Batch Processing**: Process multiple steps per frame
3. **Selective Output**: Only save frames at specified intervals
4. **Simplified Physics**: No periodic boundary conditions in browser
5. **Cutoff Distances**: Limit interaction range

## Export Capabilities

### Trajectory Export

```typescript
// JSON format (full data)
const json = controller.exportTrajectory('json');

// PDB multi-model (visual inspection)
const pdb = controller.exportTrajectory('pdb');

// XYZ format (lightweight)
const xyz = controller.exportTrajectory('xyz');
```

### Desktop Software Export

Future feature for exporting complete simulation setup:

- GROMACS (.gro, .top, .mdp)
- NAMD (.pdb, .psf, .conf)
- AMBER (.prmtop, .inpcrd)
- LAMMPS (.data, .in)

## API Reference

### MDSimulationService

#### `setForceField(type, customParams?)`

Initialize force field with optional custom parameters.

#### `calculateEnergy(positions, atomCount)`

Calculate energy components for current configuration.

Returns:
```typescript
{
  bond: number;
  angle: number;
  dihedral: number;
  vdw: number;
  coulomb: number;
  total: number;
}
```

#### `minimize(positions, atomCount, config, onProgress?)`

Perform energy minimization.

Returns:
```typescript
{
  success: boolean;
  iterations: number;
  initialEnergy: number;
  finalEnergy: number;
  energyChange: number;
  forceNorm: number;
  trajectory: SimulationFrame[];
}
```

#### `runSimulation(positions, atomCount, params, onStatus?, onFrame?)`

Run molecular dynamics simulation.

Returns:
```typescript
{
  frames: SimulationFrame[];
  energies: EnergyComponents[];
  temperatures: number[];
  pressures?: number[];
  statistics: {
    avgEnergy: number;
    energyDrift: number;
    avgTemperature: number;
    tempFluctuation: number;
  };
}
```

## Testing

Comprehensive test suite in `tests/services/md-simulation.test.ts`:

- Force field initialization
- Energy calculations
- Minimization algorithms
- MD integration
- Trajectory export
- Integration workflows

Run tests:
```bash
npm test tests/services/md-simulation.test.ts
```

## Future Enhancements

1. **Enhanced Physics**
   - Periodic boundary conditions
   - Particle Mesh Ewald for electrostatics
   - Constraints (SHAKE/RATTLE)

2. **Advanced Analysis**
   - RMSD calculations
   - Radius of gyration
   - Secondary structure tracking
   - Hydrogen bond analysis

3. **Serverless Integration**
   - OpenMM on Vercel Edge
   - Job queue with Supabase
   - Progress notifications
   - Result storage

4. **Desktop Export**
   - Complete topology generation
   - Parameter file creation
   - Run script templates
   - Documentation bundles

## References

- WebDynamica: https://github.com/jeffcomer/webdynamica
- AMBER Force Field: http://ambermd.org/
- CHARMM Force Field: https://www.charmm.org/
- OPLS Force Field: http://zarbi.chem.yale.edu/ligpargen/
- MolStar Documentation: https://molstar.org/viewer-docs/

## Support

For issues or questions:
- GitHub Issues: [project repository]
- Documentation: `/docs/features/MD_SIMULATION.md`
- Examples: `/src/app/simulation/page.tsx`
