# Level of Detail (LOD) Rendering System

## Overview

The LOD rendering system provides progressive loading and dynamic quality adjustment for optimal performance across different devices and structure sizes. It implements a three-stage rendering pipeline: Preview → Interactive → Full Detail.

## Architecture

### Core Components

1. **LOD Manager** (`src/lib/lod-manager.ts`)
   - Analyzes structure complexity
   - Determines appropriate LOD levels
   - Filters atoms based on LOD
   - Manages progressive loading
   - Estimates memory usage

2. **Quality Manager** (`src/services/quality-manager.ts`)
   - Real-time FPS monitoring
   - Automatic quality adjustment
   - Device capability detection
   - Quality presets (Low → Extreme)
   - Performance metrics tracking

3. **Performance Profiler** (`src/lib/performance-profiler.ts`)
   - Frame time tracking
   - Bottleneck detection (CPU/GPU/Memory)
   - Performance reporting
   - Real-time statistics

4. **Geometry Loader Worker** (`src/workers/geometry-loader.worker.ts`)
   - Background geometry preparation
   - Zero-copy data transfer
   - Mesh simplification
   - Instance data preparation

5. **Quality Settings UI** (`src/components/viewer/QualitySettings.tsx`)
   - User-facing quality controls
   - Real-time FPS display
   - Device information
   - Performance statistics

## LOD Levels

### Level 1: Preview (< 200ms)
**Purpose:** Instant visual feedback

**Features:**
- Backbone only (Cα, C, N, O atoms)
- Maximum 100 atoms
- Low-poly spheres (6 segments)
- Solid colors
- No shadows or effects

**Use Cases:**
- Initial load
- Large structure preview
- Quick navigation

### Level 2: Interactive (< 1s)
**Purpose:** Meaningful interaction

**Features:**
- Secondary structure (cartoon representation)
- Up to 1,000 atoms
- Medium-poly spheres (12 segments)
- Simple ligands
- Basic lighting
- FXAA antialiasing

**Use Cases:**
- Structure exploration
- Interactive manipulation
- Most user interactions

### Level 3: Full Detail (< 3s)
**Purpose:** Publication-quality rendering

**Features:**
- All atoms with sidechains
- Up to 100,000 atoms
- High-poly spheres (24 segments)
- Surface rendering
- Shadows and ambient occlusion
- MSAA antialiasing
- Detailed ligands

**Use Cases:**
- Final visualization
- Screenshots
- Detailed analysis

## Quality Levels

### 1. Low
- Render scale: 0.5x
- Backbone only
- No effects
- Target: 60 FPS on low-end devices

### 2. Medium
- Render scale: 0.75x
- Secondary structure
- FXAA antialiasing
- Simple ligands
- Target: 60 FPS on medium devices

### 3. High
- Render scale: 1.0x
- Sidechains
- FXAA antialiasing
- Detailed ligands
- Target: 60 FPS on high-end devices

### 4. Ultra
- Render scale: 1.0x
- Surfaces
- Shadows
- MSAA antialiasing
- Target: 60 FPS on ultra devices

### 5. Extreme
- Render scale: 1.0x
- All features enabled
- Ambient occlusion
- MSAA antialiasing
- Target: 30+ FPS on ultra devices

## Usage

### Basic Setup

```typescript
import { createLODManager } from './lib/lod-manager';
import { createQualityManager } from './services/quality-manager';
import { createPerformanceProfiler } from './lib/performance-profiler';

// Initialize LOD manager
const lodManager = createLODManager({
  onStageComplete: (result) => {
    console.log(`Stage ${result.level} completed in ${result.duration}ms`);
  },
}, 512); // 512MB memory budget

// Initialize quality manager
const qualityManager = createQualityManager(QualityLevel.HIGH, {
  onQualityChange: (settings, reason) => {
    console.log(`Quality changed to ${settings.level}: ${reason}`);
  },
  onMetricsUpdate: (metrics) => {
    console.log(`FPS: ${metrics.fps.toFixed(1)}`);
  },
});

// Initialize performance profiler
const profiler = createPerformanceProfiler();
profiler.initialize(gl);
```

### Progressive Loading

```typescript
// Analyze structure
const complexity = lodManager.analyzeComplexity(structure);

// Load progressively
const results = await lodManager.loadProgressive(
  structure,
  renderer,
  LODLevel.FULL
);

// Check results
results.forEach((result) => {
  console.log(`Level ${result.level}: ${result.fps} FPS`);
});
```

### Auto Quality Adjustment

```typescript
// Initialize quality manager with canvas
await qualityManager.initialize(canvas);

// Auto-adjustment will now run based on FPS
// Downgrades when FPS < minFPS (default: 30)
// Upgrades when FPS > targetFPS * 1.2 (default: 72)

// Manual override
qualityManager.setQualityLevel(QualityLevel.MEDIUM);
qualityManager.setAutoAdjust(false);
```

### Performance Profiling

```typescript
// Start recording
profiler.startRecording();

// In render loop
profiler.startFrame();
// ... rendering code ...
const profile = profiler.endFrame(drawCalls, triangles);

// Analyze bottlenecks
const analysis = profiler.analyzeBottleneck();
console.log(`Bottleneck: ${analysis.bottleneck}`);
console.log(`Recommendation: ${analysis.recommendation}`);

// Generate report
const report = profiler.generateReport();
console.log(`Average FPS: ${report.summary.avgFPS}`);
console.log(`Dropped frames: ${report.summary.droppedFrames}`);
```

### Web Worker Geometry Loading

```typescript
const worker = new Worker(
  new URL('./workers/geometry-loader.worker.ts', import.meta.url)
);

// Load geometry in background
worker.postMessage({
  type: 'load',
  atoms: structure.atoms,
  level: LODLevel.INTERACTIVE,
  features: config.features,
  id: 'load-1',
});

worker.addEventListener('message', (event) => {
  if (event.data.type === 'geometry-loaded') {
    const { geometry, bounds } = event.data;
    // Use geometry for rendering
    renderer.updateGeometry(geometry);
  }
});
```

## Device Profiles

The system automatically detects device capabilities and recommends appropriate quality settings:

### Desktop (High-End)
- Tier: Ultra
- Max Atoms: 100,000
- Recommended Quality: Ultra
- WebGL 2 with instancing
- Max texture size: 16384+

### Laptop (Medium)
- Tier: High
- Max Atoms: 50,000
- Recommended Quality: High
- WebGL 2 support
- Max texture size: 8192+

### Tablet (Low-End)
- Tier: Medium
- Max Atoms: 10,000
- Recommended Quality: Medium
- WebGL 1 or 2
- Max texture size: 4096+

### Mobile
- Tier: Low
- Max Atoms: 5,000
- Recommended Quality: Low
- Limited WebGL support
- Max texture size: 2048+

## Performance Targets

### Preview Stage
- **Load Time:** < 200ms
- **Target FPS:** 60
- **Max Atoms:** 100

### Interactive Stage
- **Load Time:** < 1s
- **Target FPS:** 60
- **Max Atoms:** 1,000

### Full Detail Stage
- **Load Time:** < 3s
- **Target FPS:** 30+
- **Max Atoms:** 100,000

## Optimization Techniques

### 1. Frustum Culling
Only render atoms within the camera's view frustum.

```typescript
// Check if atom is in view
function isInFrustum(atom: Atom, frustum: Frustum): boolean {
  return frustum.containsPoint(atom.position);
}

const visibleAtoms = atoms.filter(atom => isInFrustum(atom, camera.frustum));
```

### 2. Instanced Rendering
Render multiple atoms with a single draw call.

```typescript
// Use worker to prepare instance data
worker.postMessage({
  type: 'prepare-instances',
  atoms: atoms,
  instanceType: 'sphere',
});
```

### 3. Mesh Simplification
Reduce polygon count for distant objects.

```typescript
// Simplify to 50% of original
worker.postMessage({
  type: 'simplify',
  geometry: originalGeometry,
  targetRatio: 0.5,
});
```

### 4. Progressive Loading
Load in stages to maintain responsiveness.

```typescript
// Cancel if user navigates away
lodManager.cancelLoading();
```

## Troubleshooting

### Low FPS
1. Check bottleneck analysis: `profiler.analyzeBottleneck()`
2. Enable auto-quality adjustment
3. Reduce structure complexity
4. Lower quality preset
5. Disable expensive features (shadows, AO)

### High Memory Usage
1. Check memory estimate: `lodManager.estimateMemoryUsage()`
2. Reduce max atoms per level
3. Enable aggressive LOD
4. Clear unused resources

### Slow Initial Load
1. Check structure complexity
2. Start at lower LOD level
3. Use Web Worker for geometry
4. Enable progressive loading

## Best Practices

1. **Always analyze complexity first**
   ```typescript
   const complexity = lodManager.analyzeComplexity(structure);
   const canAfford = lodManager.canAffordLevel(complexity, LODLevel.FULL);
   ```

2. **Enable auto-adjustment for most users**
   ```typescript
   qualityManager.setAutoAdjust(true);
   ```

3. **Profile during development**
   ```typescript
   profiler.startRecording();
   // ... test scenarios ...
   const report = profiler.generateReport();
   console.log(profiler.exportReport());
   ```

4. **Use Web Workers for large structures**
   ```typescript
   if (complexity.atomCount > 5000) {
     // Load geometry in worker
   }
   ```

5. **Provide user controls**
   ```typescript
   <QualitySettings qualityManager={qualityManager} />
   ```

## API Reference

### LODManager

#### Methods
- `analyzeComplexity(structure): StructureComplexity`
- `determineStartingLevel(complexity): LODLevel`
- `loadProgressive(structure, renderer, targetLevel): Promise<LODStageResult[]>`
- `filterAtomsForLevel(atoms, level, complexity): any[]`
- `estimateMemoryUsage(complexity, level): number`
- `canAffordLevel(complexity, level): boolean`
- `cancelLoading(): void`

### QualityManager

#### Methods
- `initialize(canvas): Promise<void>`
- `setQualityLevel(level): void`
- `setAutoAdjust(enabled): void`
- `getSettings(): QualitySettings`
- `getMetrics(): PerformanceMetrics`
- `getDeviceCapability(): DeviceCapability`
- `startMonitoring(): void`
- `stopMonitoring(): void`

### PerformanceProfiler

#### Methods
- `initialize(gl): void`
- `startFrame(): void`
- `endFrame(drawCalls, triangles): PerformanceProfile`
- `startRecording(): void`
- `stopRecording(): void`
- `analyzeBottleneck(): BottleneckAnalysis`
- `generateReport(): PerformanceReport`
- `exportReport(): string`
- `getRealTimeStats(): object`

## Examples

### Complete Integration

```typescript
import { createLODManager } from './lib/lod-manager';
import { createQualityManager, QualityLevel } from './services/quality-manager';
import { createPerformanceProfiler } from './lib/performance-profiler';
import { QualitySettings } from './components/viewer/QualitySettings';

class MoleculeViewer {
  private lodManager: LODManager;
  private qualityManager: QualityManager;
  private profiler: PerformanceProfiler;

  async initialize(canvas: HTMLCanvasElement) {
    // Setup managers
    this.lodManager = createLODManager({
      onStageComplete: (result) => {
        console.log(`LOD stage ${result.level} complete`);
      },
    });

    this.qualityManager = createQualityManager(QualityLevel.HIGH, {
      onQualityChange: (settings, reason) => {
        this.updateRenderSettings(settings);
      },
    });

    this.profiler = createPerformanceProfiler();
    this.profiler.initialize(this.gl);

    // Initialize quality manager
    await this.qualityManager.initialize(canvas);

    // Start monitoring
    this.qualityManager.startMonitoring();
  }

  async loadStructure(structure: any) {
    // Analyze complexity
    const complexity = this.lodManager.analyzeComplexity(structure);

    // Check if we can afford full quality
    const maxLevel = this.lodManager.canAffordLevel(complexity, LODLevel.FULL)
      ? LODLevel.FULL
      : LODLevel.INTERACTIVE;

    // Load progressively
    const results = await this.lodManager.loadProgressive(
      structure,
      this.renderer,
      maxLevel
    );

    return results;
  }

  render() {
    // Start profiling
    this.profiler.startFrame();

    // Render scene
    this.renderer.render();

    // End profiling
    const profile = this.profiler.endFrame(
      this.renderer.drawCalls,
      this.renderer.triangles
    );

    // Update quality manager with metrics
    this.qualityManager.updateRenderMetrics(
      profile.drawCalls,
      profile.triangles,
      profile.memoryUsed
    );
  }
}
```

## Performance Benchmarks

### Small Structure (< 1,000 atoms)
- Preview: 50-100ms @ 60 FPS
- Interactive: 200-400ms @ 60 FPS
- Full: 500-1000ms @ 60 FPS

### Medium Structure (1,000-10,000 atoms)
- Preview: 100-150ms @ 60 FPS
- Interactive: 400-800ms @ 60 FPS
- Full: 1000-2000ms @ 45 FPS

### Large Structure (10,000-50,000 atoms)
- Preview: 150-200ms @ 60 FPS
- Interactive: 800-1500ms @ 50 FPS
- Full: 2000-3000ms @ 30 FPS

### Very Large Structure (50,000+ atoms)
- Preview: 180-250ms @ 55 FPS
- Interactive: 1500-2500ms @ 40 FPS
- Full: 3000-5000ms @ 25 FPS

## Accessibility

### Reduce Motion
Disable animations and transitions for users with motion sensitivity.

### High Contrast
Use high-contrast colors for better visibility.

### Keyboard Controls
- `Q`: Cycle quality presets
- `A`: Toggle auto-adjustment
- `P`: Toggle performance overlay

## Future Enhancements

1. **Adaptive LOD based on viewport**
   - Higher detail for objects in focus
   - Lower detail for periphery

2. **Predictive quality adjustment**
   - Machine learning for performance prediction
   - Preemptive quality changes

3. **Network-aware loading**
   - Adjust based on connection speed
   - Progressive streaming

4. **Memory pooling**
   - Reuse geometry buffers
   - Reduce allocation overhead

5. **Occlusion culling**
   - Skip hidden atoms
   - Hierarchical Z-buffer

## Conclusion

The LOD system provides a robust foundation for high-performance molecular visualization across diverse devices and structure sizes. By combining progressive loading, automatic quality adjustment, and comprehensive performance monitoring, it ensures smooth, responsive rendering while maintaining visual quality.
