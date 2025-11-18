# MolStar-LOD Integration Guide

## Overview

The MolStar-LOD integration enables progressive rendering of molecular structures, automatically adapting quality levels based on structure complexity and system capabilities.

## Architecture

### Components

1. **LOD Manager** (`src/lib/lod-manager.ts`)
   - Analyzes structure complexity
   - Manages progressive loading stages
   - Determines appropriate quality levels

2. **MolStar-LOD Bridge** (`src/services/molstar-lod-bridge.ts`)
   - Translates LOD features to MolStar representations
   - Coordinates progressive loading
   - Manages caching and memory budget

3. **MolecularViewer Component** (`src/components/MolecularViewer.tsx`)
   - Optional LOD integration via `enableLOD` prop
   - Progress callbacks for UI feedback
   - Automatic cleanup and disposal

## LOD Levels

### 1. PREVIEW (Level 1)
- **Representation**: Backbone only (Cα atoms)
- **Max Atoms**: 100
- **Target FPS**: 60
- **Quality**: Low
- **Features**: No antialiasing, no shadows, minimal geometry
- **Use Case**: Initial quick preview, very large structures

### 2. INTERACTIVE (Level 2)
- **Representation**: Cartoon with secondary structure
- **Max Atoms**: 1,000
- **Target FPS**: 60
- **Quality**: High
- **Features**: FXAA antialiasing, simple ligands, no surfaces
- **Use Case**: Interactive exploration, medium structures

### 3. FULL (Level 3)
- **Representation**: Ball-and-stick or surface
- **Max Atoms**: 100,000
- **Target FPS**: 30
- **Quality**: Highest
- **Features**: MSAA antialiasing, shadows, ambient occlusion, surfaces
- **Use Case**: Final high-quality rendering, publication images

## Usage

### Basic Usage (Component)

```tsx
import { MolecularViewer } from '@/components/MolecularViewer';

function App() {
  return (
    <MolecularViewer
      enableLOD={true}
      pdbData={myPDBData}
      onLODProgress={(progress, level, message) => {
        console.log(`${message} (${progress}%)`);
      }}
    />
  );
}
```

### Direct Bridge Usage

```typescript
import { createMolstarLODBridge } from '@/services/molstar-lod-bridge';
import { LODLevel } from '@/types/molstar';

// Create bridge
const bridge = createMolstarLODBridge({
  memoryBudgetMB: 1024,
  enableCaching: true,
  autoProgressToFull: true,
  onProgress: (progress, level, message) => {
    console.log(message);
  }
});

// Load structure progressively
const results = await bridge.loadStructureProgressive({
  content: pdbData,
  label: 'My Protein'
}, LODLevel.FULL);

// Switch to different quality level
await bridge.switchToLevel(LODLevel.INTERACTIVE);

// Check memory affordability
if (bridge.canAffordLevel(LODLevel.FULL)) {
  await bridge.switchToLevel(LODLevel.FULL);
}

// Cleanup
bridge.dispose();
```

## Configuration Options

### BridgeConfig

```typescript
interface BridgeConfig {
  memoryBudgetMB?: number;      // Default: 512
  enableCaching?: boolean;       // Default: true
  autoProgressToFull?: boolean;  // Default: true
  targetFPS?: number;            // Default: 60
  onProgress?: ProgressCallback;
}
```

## Performance Characteristics

### Memory Usage

| LOD Level    | Est. Memory (1000 atoms) | Est. Memory (10,000 atoms) |
|--------------|--------------------------|----------------------------|
| PREVIEW      | ~5 MB                    | ~50 MB                     |
| INTERACTIVE  | ~15 MB                   | ~150 MB                    |
| FULL         | ~40 MB                   | ~400 MB                    |

### Load Times (Typical)

| Structure Size | PREVIEW | INTERACTIVE | FULL   |
|----------------|---------|-------------|--------|
| Small (<500)   | 50ms    | 150ms       | 300ms  |
| Medium (5K)    | 100ms   | 500ms       | 1.5s   |
| Large (50K)    | 200ms   | 1s          | 3s+    |

## API Reference

### MolstarLODBridge Methods

#### `loadStructureProgressive(structure, targetLevel?)`
Load structure with progressive quality levels.

**Parameters:**
- `structure: StructureData` - Structure to load
- `targetLevel?: LODLevel` - Target quality level (default: FULL)

**Returns:** `Promise<LODStageResult[]>`

#### `switchToLevel(level)`
Switch to specific quality level.

**Parameters:**
- `level: LODLevel` - Target level

**Returns:** `Promise<void>`

#### `getLODAdapter(level)`
Get representation adapter for quality level.

**Parameters:**
- `level: LODLevel` - Quality level

**Returns:** `LODRenderAdapter`

#### `getComplexity()`
Get current structure complexity analysis.

**Returns:** `StructureComplexity | null`

#### `getCurrentLevel()`
Get current quality level.

**Returns:** `LODLevel`

#### `estimateMemoryUsage(level)`
Estimate memory for quality level.

**Parameters:**
- `level: LODLevel` - Quality level

**Returns:** `number | null` (bytes)

#### `canAffordLevel(level)`
Check if memory budget allows level.

**Parameters:**
- `level: LODLevel` - Quality level to check

**Returns:** `boolean`

#### `cancelLoading()`
Cancel progressive loading.

#### `clearCache()`
Clear cached representations.

#### `dispose()`
Cleanup and dispose resources.

## Examples

### Example 1: Auto-Progressive Loading

```tsx
<MolecularViewer
  enableLOD={true}
  pdbId="1CRN"
  onLODProgress={(progress, level, msg) => {
    setStatus(msg);
  }}
  onStructureLoaded={(metadata) => {
    console.log('Loaded:', metadata);
  }}
/>
```

### Example 2: Manual Level Control

```typescript
const bridge = createMolstarLODBridge({ memoryBudgetMB: 2048 });

// Load to interactive first
await bridge.loadStructureProgressive(
  { content: pdbData },
  LODLevel.INTERACTIVE
);

// Later, upgrade to full quality
if (bridge.canAffordLevel(LODLevel.FULL)) {
  await bridge.switchToLevel(LODLevel.FULL);
}
```

### Example 3: Memory-Constrained Device

```typescript
const bridge = createMolstarLODBridge({
  memoryBudgetMB: 256,  // Low memory budget
  autoProgressToFull: false,  // Stay at best affordable level
});

await bridge.loadStructureProgressive({ content: pdbData });

// Will automatically stop at highest affordable level
const level = bridge.getCurrentLevel();
console.log(`Loaded at: ${LODLevel[level]}`);
```

## Integration with Existing Code

### Minimal Changes Required

The integration is designed to be opt-in and non-breaking:

1. **Without LOD** (existing behavior):
```tsx
<MolecularViewer pdbId="1CRN" />
```

2. **With LOD** (new feature):
```tsx
<MolecularViewer enableLOD={true} pdbId="1CRN" />
```

### Performance Monitoring

In development mode, the viewer displays LOD metrics:

```
FPS: 60
Atoms: 1,234
Load: 250ms
Render: 16ms
─────────────
LOD Level: Interactive
Memory: 45.2MB
```

## Best Practices

1. **Enable LOD for large structures** (>5,000 atoms)
2. **Use caching** for frequent level switching
3. **Monitor memory** usage on mobile devices
4. **Provide progress feedback** to users during loading
5. **Dispose bridges** when components unmount
6. **Start with lower budget** on constrained devices

## Testing

Run integration tests:

```bash
npm test tests/services/molstar-lod-bridge.test.ts
```

## Troubleshooting

### Issue: Loading stuck at PREVIEW
**Solution**: Check memory budget, may be too restrictive

### Issue: Poor performance at FULL
**Solution**: System may not support FULL quality, use INTERACTIVE

### Issue: Memory leak
**Solution**: Ensure `dispose()` is called on cleanup

## Future Enhancements

- [ ] Adaptive quality based on real-time FPS
- [ ] WebGL capability detection
- [ ] Progressive surface generation
- [ ] LOD for trajectory playback
- [ ] Prefetching next quality level

## Related Files

- `/src/lib/lod-manager.ts` - Core LOD logic
- `/src/services/molstar-lod-bridge.ts` - Integration bridge
- `/src/components/MolecularViewer.tsx` - React component
- `/src/types/molstar.ts` - TypeScript types
- `/tests/services/molstar-lod-bridge.test.ts` - Tests

---

**Last Updated:** 2025-11-17
**Author:** Integration Developer Agent
**Status:** Production Ready
