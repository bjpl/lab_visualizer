# Interactive Molecular Visualization Features - Complete Implementation

## Overview

This document describes the complete implementation of interactive molecular visualization features for the LAB Visualizer, powered by Mol* (Molstar).

## Implemented Features

### 1. ✅ Green Tint for Selected Atoms (Visual Feedback)

**Location:** `src/services/molstar-service.ts`

**Description:** Atoms, residues, and chains now display a green highlight when selected, providing immediate visual feedback to users.

**API:**

```typescript
// Select with green tint (default)
await molstarService.select({
  type: 'atom',
  atomIds: ['1', '2', '3']
}, true);

// Select without green tint
await molstarService.select({
  type: 'residue',
  residueIds: ['10', '20']
}, false);

// Clear selection highlight
await molstarService.clearSelectionHighlight();
```

**Features:**
- Automatic green overlay on selection
- Optional toggle for highlight
- Performance-optimized color application
- Integrates with existing selection system

---

### 2. ✅ 3D Measurement Labels (Distance Lines in Viewport)

**Location:** `src/services/molstar-service.ts`

**Description:** Measurement lines and labels are now rendered directly in the 3D viewport, allowing users to see distances, angles, and dihedral angles spatially.

**API:**

```typescript
// Add 3D label for measurement
await molstarService.add3DMeasurementLabel(measurement);

// Remove measurement from viewport
molstarService.removeMeasurement(measurementId);

// Clear all measurements
molstarService.clearMeasurements();

// Toggle measurement visibility
molstarService.toggleMeasurementVisibility(measurementId);
```

**Features:**
- Distance measurements with visible lines
- Angle and dihedral visualization
- Custom shape rendering using Mol* Shape API
- Dynamic label positioning
- Show/hide individual measurements
- Persistent across viewport rotations

---

### 3. ✅ Hydrogen Bond Visualization

**Location:** `src/services/molstar-service.ts`, `src/components/viewer/interactive/HydrogenBondsToggle.tsx`

**Description:** Hydrogen bonds can be visualized as yellow dashed lines between donor and acceptor atoms, helping users understand protein structure and stability.

**API:**

```typescript
// Show hydrogen bonds
await molstarService.visualizeHydrogenBonds(true);

// Hide hydrogen bonds
await molstarService.visualizeHydrogenBonds(false);
```

**Component Usage:**

```tsx
import { HydrogenBondsToggle } from '@/components/viewer/interactive';

<HydrogenBondsToggle
  defaultVisible={false}
  onToggle={(visible) => console.log('H-bonds:', visible)}
/>
```

**Features:**
- One-click toggle button
- Yellow color coding for easy identification
- Automatic bond detection based on structure
- Integrates with existing representations
- Loading states and error handling

---

### 4. ✅ Sequence Viewer with 3D Synchronization

**Location:** `src/components/viewer/interactive/SequenceViewer.tsx`

**Description:** A linear sequence viewer that displays the amino acid or nucleotide sequence of the loaded structure, with bidirectional synchronization to the 3D viewport.

**Component Usage:**

```tsx
import { SequenceViewer } from '@/components/viewer/interactive';

<SequenceViewer
  onResidueClick={(chainId, residueSeq) => {
    console.log(`Selected ${chainId}:${residueSeq}`);
  }}
/>
```

**Features:**
- **Multi-chain support:** Switch between chains with navigation buttons
- **Click-to-select:** Click any residue to select it in 3D (with green tint)
- **Hover synchronization:** Hovering in 3D highlights in sequence viewer
- **Color-coded residues:**
  - 🟢 Green: Hydrophobic (ALA, VAL, ILE, LEU, MET, PHE, TRP, PRO)
  - 🔵 Blue: Polar (SER, THR, CYS, TYR, ASN, GLN)
  - 🔴 Red: Charged (ASP, GLU, LYS, ARG, HIS)
- **Search functionality:** Filter residues by name or position
- **Auto-scrolling:** Automatically scrolls to hovered residue
- **Single-letter codes:** Displays standard amino acid abbreviations
- **Responsive layout:** Scrollable horizontal sequence track
- **Accessibility:** ARIA labels and keyboard navigation

**Architecture:**
```
┌─────────────────────────────────────┐
│      SequenceViewer Component       │
│  ┌───────────────────────────────┐  │
│  │  Chain Selector & Search      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Residue Track (Scrollable)   │  │
│  │  [A][L][G][K][R][D][E]...     │  │
│  │   1  2  3  4  5  6  7         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Color Legend                 │  │
│  │  🟢 Hydrophobic               │  │
│  │  🔵 Polar                     │  │
│  │  🔴 Charged                   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ↕️ Bidirectional Sync
┌─────────────────────────────────────┐
│       3D MolStar Viewer             │
│   (Highlights selected residue)     │
└─────────────────────────────────────┘
```

---

## Integration Guide

### Complete Example: All Features Together

```tsx
import {
  HoverTooltip,
  MeasurementsPanel,
  HydrogenBondsToggle,
  SequenceViewer
} from '@/components/viewer/interactive';
import { MolStarViewer } from '@/components/viewer/MolStarViewer';

export function InteractiveMolecularViewer() {
  const [showMeasurements, setShowMeasurements] = useState(false);

  return (
    <div className="relative h-screen">
      {/* 3D Viewer */}
      <MolStarViewer pdbId="1CRN" className="h-2/3" />

      {/* Hover Tooltip (always visible) */}
      <HoverTooltip position="bottom-right" />

      {/* Control Panel */}
      <div className="absolute top-4 left-4 space-y-2">
        <HydrogenBondsToggle />
        <Button onClick={() => setShowMeasurements(!showMeasurements)}>
          Toggle Measurements
        </Button>
      </div>

      {/* Measurements Panel (conditional) */}
      {showMeasurements && (
        <MeasurementsPanel
          className="absolute top-4 right-4 w-80"
          onClose={() => setShowMeasurements(false)}
        />
      )}

      {/* Sequence Viewer */}
      <SequenceViewer
        className="h-1/3 border-t"
        onResidueClick={(chain, seq) => {
          console.log(`Selected ${chain}:${seq}`);
        }}
      />
    </div>
  );
}
```

---

## Testing

All features are fully tested with comprehensive test coverage:

### Test Files:
- `src/__tests__/components/interactive/SequenceViewer.test.tsx`
- `src/__tests__/components/interactive/HydrogenBondsToggle.test.tsx`
- `src/__tests__/services/molstar-service-interactive.test.ts`

### Test Coverage:
- ✅ Selection with green tint
- ✅ Hydrogen bond visualization
- ✅ 3D measurement labels
- ✅ Sequence viewer rendering
- ✅ Hover synchronization
- ✅ Chain switching
- ✅ Search functionality
- ✅ Error handling
- ✅ Loading states
- ✅ Event emission

### Running Tests:

```bash
# Run all tests
npm test

# Run interactive feature tests only
npm test -- interactive

# Run with coverage
npm test -- --coverage
```

---

## Performance Considerations

1. **Selection Highlighting:** O(1) color overlay application using Mol*'s built-in overpaint system
2. **Hydrogen Bonds:** Computed on-demand, cached until structure changes
3. **Sequence Viewer:** Virtual scrolling for large proteins (>1000 residues)
4. **3D Labels:** Optimized shape rendering with minimal draw calls
5. **Hover Events:** Throttled to 100ms for smooth performance

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Requires WebGL 2.0 support.

---

## Future Enhancements

Potential future additions:

1. **Advanced Measurements:**
   - Torsion angles
   - Surface area calculations
   - Volume measurements

2. **Sequence Features:**
   - Secondary structure annotations
   - Domain highlighting
   - Conservation coloring
   - PTM (post-translational modification) markers

3. **Hydrogen Bonds:**
   - Adjustable distance/angle thresholds
   - Salt bridge visualization
   - π-π interactions

4. **Export:**
   - Export measurements as CSV
   - Save sequence annotations
   - Generate publication-quality images with labels

---

## API Reference

### MolstarService Methods

```typescript
class MolstarService {
  // Selection with green tint
  select(query: SelectionQuery, applyGreenTint?: boolean): Promise<void>;
  clearSelectionHighlight(): Promise<void>;

  // Hydrogen bonds
  visualizeHydrogenBonds(show: boolean): Promise<void>;

  // 3D measurement labels
  add3DMeasurementLabel(measurement: MeasurementResult): Promise<void>;
  removeMeasurement(id: string): void;
  clearMeasurements(): void;
  toggleMeasurementVisibility(id: string): void;
}
```

### Events

```typescript
interface MolstarEvents {
  'selection-changed': (query: SelectionQuery) => void;
  'representation-changed': (type: MolstarRepresentationType) => void;
  'hover-info': (info: HoverInfo | null) => void;
  'measurement-added': (measurement: MeasurementResult) => void;
  'selection-info': (info: SelectionInfo | null) => void;
}
```

---

## Troubleshooting

### Green tint not appearing
- Ensure `applyGreenTint` parameter is `true` (default)
- Check that structure is loaded
- Verify WebGL context is not lost

### Hydrogen bonds not showing
- Confirm structure has hydrogen atoms
- Check console for errors
- Try toggling off/on

### Sequence viewer empty
- Wait for structure to load completely
- Check that `structure-loaded` event fired
- Verify metadata contains chain information

### Measurements not visible
- Ensure measurements are not hidden (check visibility toggle)
- Verify 3D viewport is not obstructed
- Check z-index of measurement labels

---

## Contributing

When adding new interactive features:

1. Add service methods to `molstar-service.ts`
2. Create React component in `components/viewer/interactive/`
3. Write comprehensive tests
4. Update this documentation
5. Add usage examples

---

## License

MIT License - See LICENSE file for details

---

**Last Updated:** 2025-11-24

**Author:** LAB Visualizer Team

**Status:** ✅ Complete and Production-Ready
