# Mol* Integration Guide

## Overview

This guide explains how to use the Mol* molecular visualization integration in the LAB Visualization Platform.

## Architecture

The Mol* integration consists of several layers:

```
┌─────────────────────────────────────┐
│     MolecularViewer Component       │  React UI Layer
├─────────────────────────────────────┤
│        useMolstar Hook              │  React Integration
├─────────────────────────────────────┤
│      MolstarService (Singleton)     │  Business Logic
├─────────────────────────────────────┤
│      Mol* Library (molstar)         │  3D Rendering
└─────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```tsx
import { MolecularViewer } from '@/components/MolecularViewer';

function MyPage() {
  return (
    <MolecularViewer
      pdbId="1CRN"
      config={{
        layoutIsExpanded: false,
        layoutShowControls: true,
      }}
      onStructureLoaded={(metadata) => {
        console.log('Structure loaded:', metadata);
      }}
    />
  );
}
```

### Loading PDB Data

```tsx
import { MolecularViewer } from '@/components/MolecularViewer';

function MyPage() {
  const pdbData = `
    HEADER    CRAMBIN
    ATOM      1  N   THR A   1      17.047  14.099   3.625  1.00 13.79           N
    ATOM      2  CA  THR A   1      16.967  12.784   4.338  1.00 10.80           C
    ...
  `;

  return <MolecularViewer pdbData={pdbData} />;
}
```

### Using the Hook Directly

```tsx
import { useMolstar } from '@/hooks/use-molstar';

function CustomViewer() {
  const {
    containerRef,
    isReady,
    isLoading,
    error,
    loadStructureById,
    exportImage,
  } = useMolstar();

  const handleLoad = async () => {
    await loadStructureById('1CRN');
  };

  const handleExport = async () => {
    const blob = await exportImage({ format: 'png', width: 1920, height: 1080 });
    // Download blob...
  };

  return (
    <div>
      <button onClick={handleLoad} disabled={!isReady}>
        Load Structure
      </button>
      <button onClick={handleExport} disabled={!isReady}>
        Export PNG
      </button>
      <div ref={containerRef} style={{ width: '100%', height: '600px' }} />
    </div>
  );
}
```

## Configuration

### MolstarConfig Options

```typescript
interface MolstarConfig {
  // Layout options
  layoutIsExpanded?: boolean;         // Expand control panels (default: false)
  layoutShowControls?: boolean;       // Show control panels (default: false)
  layoutShowRemoteState?: boolean;    // Show remote state (default: false)
  layoutShowSequence?: boolean;       // Show sequence viewer (default: false)
  layoutShowLog?: boolean;            // Show log panel (default: false)
  layoutShowLeftPanel?: boolean;      // Show left panel (default: false)

  // Viewport options
  viewportShowExpand?: boolean;       // Show expand button (default: true)
  viewportShowSelectionMode?: boolean; // Show selection controls (default: true)
  viewportShowAnimation?: boolean;    // Show animation controls (default: false)

  // Data providers
  pdbProvider?: 'pdbe' | 'rcsb';     // PDB data source (default: 'rcsb')
  emdbProvider?: 'pdbe' | 'rcsb';    // EMDB data source (default: 'pdbe')
}
```

### Minimal Configuration (Recommended)

```tsx
<MolecularViewer
  config={{
    layoutShowControls: false,  // Hide all UI panels
    viewportShowExpand: true,   // Allow fullscreen
  }}
/>
```

### Full-Featured Configuration

```tsx
<MolecularViewer
  config={{
    layoutIsExpanded: true,
    layoutShowControls: true,
    layoutShowSequence: true,
    viewportShowSelectionMode: true,
    viewportShowAnimation: true,
  }}
/>
```

## Representations

### Available Representation Types

- **cartoon**: Protein secondary structure (alpha helices, beta sheets)
- **ball-and-stick**: Atoms as spheres, bonds as cylinders
- **spacefill**: Van der Waals spheres (CPK model)
- **surface**: Molecular surface (solvent-accessible)
- **backbone**: Backbone trace only
- **point**: Point cloud representation
- **putty**: Variable-width cartoon (B-factor visualization)

### Changing Representations

Using Zustand store:

```tsx
import { useVisualization } from '@/stores/app-store';

function ControlPanel() {
  const { representation, setRepresentation } = useVisualization();

  return (
    <select
      value={representation}
      onChange={(e) => setRepresentation(e.target.value as RepresentationType)}
    >
      <option value="cartoon">Cartoon</option>
      <option value="ball-and-stick">Ball and Stick</option>
      <option value="spacefill">Spacefill</option>
      <option value="surface">Surface</option>
    </select>
  );
}
```

Using service directly:

```tsx
import { molstarService } from '@/services/molstar-service';

await molstarService.applyRepresentation({
  type: 'cartoon',
  colorScheme: 'chain-id',
  quality: 'high',
  alpha: 0.8,
});
```

## Color Schemes

### Available Color Schemes

- **element-symbol**: Color by element (CPK colors)
- **chain-id**: Color by protein chain
- **entity-id**: Color by molecular entity
- **residue-name**: Color by amino acid type
- **secondary-structure**: Color by secondary structure (helix, sheet, loop)
- **uniform**: Single color

### Changing Color Schemes

```tsx
import { useVisualization } from '@/stores/app-store';

function ColorControls() {
  const { colorScheme, setColorScheme } = useVisualization();

  return (
    <select
      value={colorScheme}
      onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
    >
      <option value="element">Element</option>
      <option value="chain">Chain</option>
      <option value="secondary-structure">Secondary Structure</option>
      <option value="residue">Residue</option>
    </select>
  );
}
```

## Performance Optimization

### Lazy Loading

Mol* is automatically code-split and loaded only when needed:

```tsx
// Mol* bundle is loaded on first render of MolecularViewer
<Suspense fallback={<LoadingSpinner />}>
  <MolecularViewer pdbId="1CRN" />
</Suspense>
```

### Web Workers

Large PDB files are parsed in a Web Worker to prevent UI blocking:

```tsx
// Automatically uses Web Worker for files > 1MB
const { loadStructure } = useMolstar();
await loadStructure(largePDBFile); // Parsed in worker thread
```

### IndexedDB Caching

Structures are automatically cached in IndexedDB:

```tsx
// First load: Downloads from RCSB
await loadStructureById('1CRN'); // ~500ms

// Second load: Retrieves from IndexedDB cache
await loadStructureById('1CRN'); // ~50ms (10x faster)
```

### Performance Metrics

Monitor performance in development mode:

```tsx
const { metrics } = useMolstar();

console.log(metrics);
// {
//   loadTime: 234,      // Structure load time (ms)
//   renderTime: 56,     // Initial render time (ms)
//   frameRate: 60,      // Current FPS
//   atomCount: 46772,   // Number of atoms
//   triangleCount: 0,   // Rendered triangles
// }
```

## Camera Controls

### Reset Camera

```tsx
const { centerCamera } = useMolstar();

await centerCamera(); // Resets to default view
```

### Get Camera State

```tsx
import { molstarService } from '@/services/molstar-service';

const snapshot = molstarService.getCameraSnapshot();
// {
//   position: [0, 0, 50],
//   target: [0, 0, 0],
//   up: [0, 1, 0],
//   fov: 45
// }
```

## Image Export

### Export PNG

```tsx
const { exportImage } = useMolstar();

const blob = await exportImage({
  format: 'png',
  width: 1920,
  height: 1080,
  quality: 0.95,
});

// Download file
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'structure.png';
a.click();
URL.revokeObjectURL(url);
```

### Export JPG (smaller file size)

```tsx
const blob = await exportImage({
  format: 'jpg',
  width: 1920,
  height: 1080,
  quality: 0.85,
});
```

## Event Handling

### Structure Loaded

```tsx
<MolecularViewer
  onStructureLoaded={(metadata) => {
    console.log('Loaded:', metadata.title);
    console.log('Chains:', metadata.chains);
    console.log('Atoms:', metadata.atomCount);
    console.log('Resolution:', metadata.resolution);
  }}
/>
```

### Error Handling

```tsx
<MolecularViewer
  onError={(error) => {
    console.error('Viewer error:', error);
    // Show user-friendly error message
  }}
  errorComponent={(error) => (
    <div className="error-panel">
      <h3>Failed to load structure</h3>
      <p>{error.message}</p>
    </div>
  )}
/>
```

## Custom Loading States

```tsx
<MolecularViewer
  loadingComponent={
    <div className="custom-loading">
      <Spinner />
      <p>Loading molecular structure...</p>
    </div>
  }
/>
```

## Advanced: Using the Service API Directly

### Initialize Manually

```tsx
import { molstarService } from '@/services/molstar-service';

const container = document.getElementById('viewer') as HTMLDivElement;

await molstarService.initialize(container, {
  layoutShowControls: false,
});

// Load structure
await molstarService.loadStructureById('1CRN');

// Change representation
await molstarService.applyRepresentation({
  type: 'surface',
  colorScheme: 'secondary-structure',
  quality: 'high',
});

// Cleanup
molstarService.dispose();
```

### Event Listeners

```tsx
import { molstarService } from '@/services/molstar-service';

molstarService.on('structure-loaded', (metadata) => {
  console.log('Loaded:', metadata);
});

molstarService.on('representation-changed', (type) => {
  console.log('Representation:', type);
});

molstarService.on('color-scheme-changed', (scheme) => {
  console.log('Color scheme:', scheme);
});

molstarService.on('error', (error) => {
  console.error('Error:', error);
});
```

## Performance Targets

Our Mol* integration meets these performance benchmarks:

- **Initial Load**: < 2s (cold start)
- **5K atoms**: 60 FPS (smooth animation)
- **50K atoms**: 30 FPS (with level-of-detail)
- **Bundle Size**: < 1.5MB gzipped
- **Memory**: < 200MB for typical structures

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements**: WebGL 2.0 support

## Troubleshooting

### "Mol* viewer not initialized" Error

Ensure you're waiting for initialization:

```tsx
const { isReady, loadStructure } = useMolstar();

useEffect(() => {
  if (isReady) {
    loadStructure(data);
  }
}, [isReady]);
```

### Low Frame Rate

1. Reduce quality setting:
   ```tsx
   await molstarService.applyRepresentation({
     type: 'cartoon',
     colorScheme: 'chain-id',
     quality: 'low', // Lower triangle count
   });
   ```

2. Use simpler representations:
   - `backbone` instead of `cartoon`
   - `point` instead of `spacefill`

3. Monitor metrics:
   ```tsx
   const { metrics } = useMolstar();
   if (metrics.frameRate < 30) {
     // Reduce quality automatically
   }
   ```

### Memory Issues

Large structures (> 100K atoms) may cause memory issues:

1. Use level-of-detail (LOD) representations
2. Limit visible chains
3. Use `quality: 'low'` setting

## Examples

### Complete Integration Example

```tsx
import React, { useState } from 'react';
import { MolecularViewer } from '@/components/MolecularViewer';
import { useVisualization } from '@/stores/app-store';

export default function ProteinViewer() {
  const [pdbId, setPdbId] = useState('1CRN');
  const { representation, setRepresentation, colorScheme, setColorScheme } = useVisualization();

  return (
    <div className="h-screen flex flex-col">
      {/* Controls */}
      <div className="p-4 bg-gray-100 flex gap-4">
        <input
          type="text"
          value={pdbId}
          onChange={(e) => setPdbId(e.target.value)}
          placeholder="PDB ID"
          className="px-3 py-2 border rounded"
        />

        <select value={representation} onChange={(e) => setRepresentation(e.target.value)}>
          <option value="cartoon">Cartoon</option>
          <option value="ball-and-stick">Ball and Stick</option>
          <option value="surface">Surface</option>
        </select>

        <select value={colorScheme} onChange={(e) => setColorScheme(e.target.value)}>
          <option value="chain">Chain</option>
          <option value="element">Element</option>
          <option value="secondary-structure">Secondary Structure</option>
        </select>
      </div>

      {/* Viewer */}
      <div className="flex-1">
        <MolecularViewer
          pdbId={pdbId}
          config={{ layoutShowControls: false }}
          onStructureLoaded={(metadata) => {
            console.log(`Loaded ${metadata.atomCount} atoms`);
          }}
        />
      </div>
    </div>
  );
}
```

## References

- [Mol* Documentation](https://molstar.org/)
- [Mol* GitHub](https://github.com/molstar/molstar)
- [RCSB PDB](https://www.rcsb.org/)
- [ADR-002: Visualization Library Choice](/docs/adrs/002-visualization-library-choice.md)
