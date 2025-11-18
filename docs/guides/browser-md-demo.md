# Browser MD Demo Guide

## Overview

The Browser MD Demo provides an **educational, interactive molecular dynamics simulation** experience directly in your web browser using WebDynamica. This feature is designed for learning, quick visualization, and understanding MD concepts - not for production research.

## 🚨 Important Limitations

### Educational Demo Only

Browser simulations are **strictly limited** for safety and performance:

- **Maximum 500 atoms** - Larger systems require serverless or desktop tiers
- **Maximum 30 seconds wall-clock time** - Prevents browser freeze
- **Simplified physics** - No periodic boundary conditions, limited accuracy
- **No advanced features** - Constraints, virtual sites, and production features unavailable

### When to Use Browser Tier

✅ **Good Use Cases:**
- Learning MD fundamentals
- Quick structure visualization
- Testing simulation parameters
- Educational demonstrations
- Prototyping workflows

❌ **Do NOT Use For:**
- Research-grade simulations
- Publication-quality data
- Large biomolecular systems
- Long timescale simulations
- Production workflows

## Getting Started

### 1. Quick Start with Presets

The easiest way to start is with pre-configured simulation templates:

```tsx
import SimulationPresets from '@/components/simulation/SimulationPresets';
import BrowserSimulation from '@/components/simulation/BrowserSimulation';

function MyComponent() {
  const [selectedPreset, setSelectedPreset] = useState(null);

  return (
    <>
      <SimulationPresets
        onSelectPreset={(preset) => setSelectedPreset(preset.config)}
      />

      {selectedPreset && (
        <BrowserSimulation
          atomCount={100}
          positions={myPositions}
          onComplete={(frames) => console.log('Done!', frames)}
        />
      )}
    </>
  );
}
```

### 2. Custom Configuration

For custom simulations, configure parameters manually:

```tsx
const config = {
  temperature: 300,      // Kelvin (0-500)
  timestep: 1.0,         // femtoseconds (0.5-2.0)
  steps: 1000,           // 100-10000
  integrator: 'verlet',  // 'verlet' | 'leapfrog' | 'langevin'
  forceField: 'AMBER',   // 'AMBER' | 'CHARMM' | 'OPLS'
  ensemble: 'NVT',       // 'NVE' | 'NVT' | 'NPT'
  outputFrequency: 10,   // frames per 100 steps
};
```

## Available Presets

### Energy Minimization
**Purpose:** Relax structure to local minimum
**Duration:** ~5 seconds
**Learning:** Force fields, potential energy surfaces

### Gentle Heating (0→300K)
**Purpose:** Gradually heat from 0K to room temperature
**Duration:** ~8 seconds
**Learning:** Temperature control, thermostats, kinetic energy

### NVT Equilibration
**Purpose:** Equilibrate at constant temperature
**Duration:** ~12 seconds
**Learning:** Statistical ensembles, equilibration protocols

### Short Production Run
**Purpose:** Collect trajectory data
**Duration:** ~18 seconds
**Learning:** Data collection, trajectory analysis

### Gradual Cooling (300→100K)
**Purpose:** Observe structural changes during cooling
**Duration:** ~10 seconds
**Learning:** Temperature effects, structural stability

### High Temperature Dynamics
**Purpose:** Explore high-energy conformations at 400K
**Duration:** ~15 seconds
**Learning:** Enhanced sampling, conformational changes

### Quick Test Run
**Purpose:** Fast verification of setup
**Duration:** ~3 seconds
**Learning:** System validation, parameter testing

### NPT Ensemble Demo
**Purpose:** Constant pressure and temperature
**Duration:** ~14 seconds
**Learning:** Pressure coupling, NPT ensemble

## Parameter Guide

### Temperature (0-500K)

- **0K** - Energy minimization only
- **100-200K** - Cold dynamics, reduced motion
- **250-350K** - Physiological range (room/body temp)
- **350-500K** - Enhanced sampling, increased conformational changes

**Tip:** Start with 300K for most biological systems.

### Timestep (0.5-2.0 fs)

- **0.5 fs** - Maximum accuracy, slowest
- **1.0 fs** - Good balance (recommended)
- **1.5 fs** - Faster, less accurate
- **2.0 fs** - Maximum speed, minimum accuracy

**Tip:** Use smaller timesteps for high temperatures or stiff bonds.

### Steps (100-10,000)

- **100-500** - Quick tests (~3-5s)
- **500-2000** - Short equilibration (~8-12s)
- **2000-5000** - Medium production (~15-20s)
- **5000-10000** - Extended simulation (~25-30s)

**Warning:** Browser simulations automatically stop at 30 seconds.

### Integrators

#### Velocity Verlet
- **Use for:** NVE simulations, fastest
- **Pros:** Energy conservation, simple
- **Cons:** No temperature control

#### Leapfrog
- **Use for:** Alternative to Verlet
- **Pros:** Time-reversible, stable
- **Cons:** Similar to Verlet

#### Langevin
- **Use for:** NVT simulations with temperature control
- **Pros:** Built-in thermostat
- **Cons:** Slightly slower

### Force Fields

#### AMBER
- **Use for:** Proteins, nucleic acids, general biomolecules
- **Pros:** Well-tested, widely used
- **Cons:** Older parameterization

#### CHARMM
- **Use for:** Proteins, lipids, carbohydrates
- **Pros:** Extensive parameter sets
- **Cons:** Complex setup

#### OPLS
- **Use for:** Small molecules, organic compounds
- **Pros:** Good for organic chemistry
- **Cons:** Limited biomolecule parameters

### Ensembles

#### NVE (Microcanonical)
- **Constant:** Number of particles (N), Volume (V), Energy (E)
- **Use for:** Testing energy conservation
- **Notes:** No temperature control

#### NVT (Canonical)
- **Constant:** N, V, Temperature (T)
- **Use for:** Most simulations, temperature control
- **Notes:** Requires thermostat (Langevin)

#### NPT (Isothermal-Isobaric)
- **Constant:** N, Pressure (P), T
- **Use for:** Equilibration, pressure effects
- **Notes:** Volume fluctuates

## Real-Time Monitoring

### Energy Plot
Displays total energy (potential + kinetic) vs. time:
- **Decreasing:** Energy minimization
- **Fluctuating around constant:** Good NVT equilibration
- **Linear drift:** Energy leak (increase timestep accuracy)

### Temperature Plot
Shows instantaneous temperature vs. time:
- **Around target:** Good temperature control
- **Large fluctuations:** Normal for small systems
- **Constant drift:** Check thermostat settings

### Progress Bar
- **Green:** Simulation running normally
- **Yellow:** Approaching time limit
- **Red:** Performance issues detected

## Performance Optimization

### Target FPS by Atom Count

| Atom Count | Target FPS | Expected |
|------------|------------|----------|
| <100       | 30+ fps    | Smooth   |
| 100-200    | 20-30 fps  | Good     |
| 200-300    | 15-20 fps  | Acceptable |
| 300-400    | 10-15 fps  | Slow     |
| 400-500    | 5-10 fps   | Very slow |

### Optimization Tips

1. **Reduce atom count** - Most effective
2. **Increase timestep** - Trade accuracy for speed
3. **Decrease output frequency** - Less frame capture overhead
4. **Use Verlet integrator** - Fastest option
5. **Close other browser tabs** - Free up resources

### Warning Signs

⚠️ **Auto-stop conditions:**
- FPS drops below 5 (after 10 frames)
- Wall-clock time exceeds 30 seconds
- Memory usage exceeds 200MB

## Exporting Results

### JSON Format
```json
{
  "step": 1000,
  "time": 1.0,
  "positions": [...],
  "potentialEnergy": -950.2,
  "kineticEnergy": 285.4,
  "temperature": 298.7
}
```
**Use for:** Further analysis, custom visualization

### PDB Format
```
MODEL 1
ATOM      1  CA  ALA A   1       2.345   1.234  -0.567
...
ENDMDL
```
**Use for:** Visualization in PyMOL, VMD, Chimera

### XYZ Format
```
100
Step 1000 Time 1.000 ps
C 2.345 1.234 -0.567
...
```
**Use for:** Simple trajectory viewers

## Upgrading to Production

### When to Use Serverless Tier

Switch to serverless tier when you need:
- 500-5000 atoms
- Longer simulation times
- Better performance
- Job queuing
- Email notifications

```tsx
import { mdEngine } from '@/services/md-engine';

const validation = mdEngine.validateSimulation(atomCount);
if (validation.tier === 'serverless') {
  // Use serverless tier instead
}
```

### When to Export to Desktop

Use desktop export (GROMACS/NAMD) when you need:
- >5000 atoms
- Production-quality results
- Advanced features (constraints, virtual sites)
- Long timescales (>1 ns)
- Publication-quality data
- HPC resources

```tsx
import { exportToGROMACS } from '@/services/desktop-export';

const files = exportToGROMACS(structure, config);
// Download .gro, .top, .mdp files
```

## Educational Examples

### Example 1: Learning Energy Minimization

```tsx
// Start with high-energy structure
const config = {
  temperature: 0,
  timestep: 0.5,
  steps: 500,
  integrator: 'verlet',
  forceField: 'AMBER',
  ensemble: 'NVE',
  outputFrequency: 5,
};

// Observe: Energy should decrease over time
// Watch: Structure relaxes to local minimum
```

### Example 2: Understanding Thermostats

```tsx
// Compare NVE vs NVT
const nveConfig = {
  temperature: 300,
  ensemble: 'NVE',  // No temperature control
  integrator: 'verlet',
  steps: 1000,
};

const nvtConfig = {
  temperature: 300,
  ensemble: 'NVT',  // With temperature control
  integrator: 'langevin',
  steps: 1000,
};

// Observe: NVT maintains constant temperature
//          NVE shows temperature drift
```

### Example 3: Temperature Effects

```tsx
// Run same system at different temperatures
const temperatures = [100, 200, 300, 400];

temperatures.forEach(temp => {
  const config = {
    temperature: temp,
    timestep: 1.0,
    steps: 1000,
    integrator: 'langevin',
    forceField: 'AMBER',
    ensemble: 'NVT',
    outputFrequency: 10,
  };

  // Observe: Higher temps = more motion
  //          Structure stability varies
});
```

## Troubleshooting

### "Atom count exceeds browser limit"
**Solution:** Reduce atoms to ≤500 or use serverless tier

### "Simulation too slow / Low FPS"
**Solution:**
- Reduce atom count
- Increase timestep
- Use faster integrator (Verlet)

### "Simulation exceeded maximum wall time"
**Solution:**
- Reduce step count
- Increase timestep
- Optimize system size

### "Performance too low"
**Solution:**
- Close other tabs/applications
- Upgrade browser
- Use desktop tier

### "Energy exploding"
**Solution:**
- Decrease timestep
- Check structure for overlaps
- Run energy minimization first

## Learning Resources

### Recommended Reading
- [Introduction to Molecular Dynamics](link)
- [Force Fields Explained](link)
- [Statistical Mechanics for MD](link)
- [Integration Algorithms](link)

### Video Tutorials
- [Getting Started with Browser MD](link)
- [Understanding MD Parameters](link)
- [Analyzing Trajectories](link)

### Interactive Exercises
1. **Energy Minimization Challenge** - Minimize structure in <500 steps
2. **Temperature Control** - Maintain 300K ±5K for 1000 steps
3. **Heating Protocol** - Design smooth heating curve from 0→300K

## API Reference

### BrowserSimulation Component

```tsx
interface BrowserSimulationProps {
  atomCount: number;
  positions: Float32Array;
  onComplete?: (frames: SimulationFrame[]) => void;
  onError?: (error: string) => void;
}
```

### BrowserSimulationController

```typescript
class BrowserSimulationController {
  initialize(positions: Float32Array, atomCount: number, config: BrowserSimulationConfig): Promise<Result>;
  start(onStateUpdate?: StateUpdateCallback): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getState(): SimulationState;
  getFrames(): SimulationFrame[];
  getMetrics(): SimulationMetrics | null;
  exportTrajectory(format: 'json' | 'pdb' | 'xyz'): string;
}
```

### WebDynamicaEngine

```typescript
class WebDynamicaEngine {
  initialize(positions: Float32Array, atomCount: number, config: DynamicaConfig): Promise<void>;
  start(onProgress?: ProgressCallback, onComplete?: CompleteCallback, onError?: ErrorCallback): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getState(): EngineState;
  exportTrajectory(format: 'json' | 'pdb' | 'xyz'): string;
}
```

## Support

For issues or questions:
- [GitHub Issues](link)
- [Documentation](link)
- [Community Forum](link)

---

**Remember:** Browser MD is for education only. Use serverless or desktop tiers for real research!
