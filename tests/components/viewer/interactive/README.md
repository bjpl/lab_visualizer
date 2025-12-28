# Interactive Viewer Tests - Test Documentation

## Test-Driven Development: 3D Measurement Visualization

### Overview
This directory contains tests for interactive molecular visualization features, specifically focusing on 3D measurement visualization as part of GOAP Action 2.1.

### Test File: `measurement-visualization.test.tsx`

**Status**: FAILING (Implementation Pending)
**Purpose**: Define requirements for 3D measurement visualization in MolStar viewer
**Coverage Target**: +2% line coverage
**Test Count**: 47 comprehensive test cases

### Test Categories

#### 1. Distance Measurement Display (4 tests)
Tests for rendering distance measurements as 3D lines connecting atoms:
- ✗ Display distance as 3D line in viewport
- ✗ Show distance label in Ångströms (Å)
- ✗ Render line connecting selected atoms
- ✗ Update distance when atoms move (trajectory)

**Requirements**:
- Line geometry from point A to point B
- Label format: "X.XX Å"
- Label positioned at midpoint
- Dynamic updates for trajectories

#### 2. Angle Measurement Display (4 tests)
Tests for rendering angle measurements as arcs:
- ✗ Display angle as arc between vectors
- ✗ Show angle label in degrees (°)
- ✗ Render arc showing angle span
- ✗ Position label near arc midpoint

**Requirements**:
- Arc geometry at vertex
- Label format: "X.XX°"
- Visual representation of angle span
- Intelligent label positioning

#### 3. Dihedral Angle Display (3 tests)
Tests for rendering torsion angles:
- ✗ Display dihedral with torsion indicator
- ✗ Show signed angle in degrees
- ✗ Indicate rotation direction

**Requirements**:
- Torsion visualization between planes
- Label format: "±X.XX°" (with sign)
- Visual indicator for rotation direction

#### 4. Measurement Visibility Toggle (4 tests)
Tests for showing/hiding measurements:
- ✗ Toggle individual measurement visibility
- ✗ Preserve measurement data when hidden
- ✗ Update visibility state in UI
- ✗ Toggle all measurements at once

**Requirements**:
- Individual toggle per measurement
- Data persistence when hidden
- UI state reflection
- Bulk toggle functionality

#### 5. Measurement Deletion (4 tests)
Tests for removing measurements:
- ✗ Remove measurement from 3D viewport
- ✗ Clean up measurement geometry completely
- ✗ Remove from UI list
- ✗ Clear all measurements at once

**Requirements**:
- Complete geometry cleanup
- No visual artifacts
- UI list updates
- Bulk delete functionality

#### 6. Multiple Simultaneous Measurements (4 tests)
Tests for handling many measurements:
- ✗ Display multiple distances concurrently
- ✗ Display mixed measurement types
- ✗ Maintain performance with 25+ measurements
- ✗ Selective deletion from multiple measurements

**Requirements**:
- Support 20+ concurrent measurements
- Mix distance, angle, dihedral types
- Render in <1 second for 25 measurements
- Independent measurement management

#### 7. Error Handling and Edge Cases (4 tests)
Tests for robustness:
- ✗ Handle missing atom data gracefully
- ✗ Handle extremely close atoms (< 0.1 Å)
- ✗ Handle extremely far atoms (> 100 Å)
- ✗ Handle camera zoom affecting labels

**Requirements**:
- Graceful degradation
- Support 0.01 Å to 200+ Å range
- Zoom-aware label rendering
- No crashes on bad data

#### 8. Integration with Existing Features (3 tests)
Tests for system integration:
- ✗ Work with structure loading
- ✗ Integrate with LOD system
- ✗ Work with representation changes

**Requirements**:
- Clear measurements on structure change
- Respect LOD settings
- Overlay on all representations

### MolStar Service Methods Required

The tests expect these methods on `MolstarService`:

```typescript
// New methods to implement
visualizeMeasurement(measurement: MeasurementResult): Promise<void>
hideMeasurement(id: string): void
showMeasurement(id: string): void

// Existing methods that will be extended
add3DMeasurementLabel(measurement: MeasurementResult): Promise<void>
removeMeasurement(id: string): void
clearMeasurements(): void
toggleMeasurementVisibility(id: string): void
```

### MolStar API Dependencies

Implementation will require:
- **Shape API**: Create custom 3D geometry (lines, arcs, planes)
- **PluginCommands**: Manage object visibility and state
- **StateTransforms**: Query and modify scene state
- **Canvas3D**: Access camera and rendering context

### Test Execution

```bash
# Run all measurement visualization tests
npm test -- tests/components/viewer/interactive/measurement-visualization.test.tsx

# Run specific test category
npm test -- tests/components/viewer/interactive/measurement-visualization.test.tsx -t "Distance Measurement"

# Run with coverage
npm test -- tests/components/viewer/interactive/measurement-visualization.test.tsx --coverage
```

### Expected Behavior

**Before Implementation**:
- All 47 tests should FAIL
- Error: Methods not found on MolstarService
- Status: This is expected and correct for TDD

**After Implementation**:
- All 47 tests should PASS
- Coverage increase: +2% line coverage
- Status: GOAP Action 2.1 complete

### Implementation Checklist

- [ ] Implement `visualizeMeasurement()` for distances
- [ ] Implement `visualizeMeasurement()` for angles
- [ ] Implement `visualizeMeasurement()` for dihedrals
- [ ] Implement `hideMeasurement()` / `showMeasurement()`
- [ ] Create 3D line geometry using MolStar Shape API
- [ ] Create 3D arc geometry for angles
- [ ] Create 3D torsion indicators for dihedrals
- [ ] Add label rendering in 3D space
- [ ] Implement visibility toggling
- [ ] Implement measurement deletion
- [ ] Add UI controls for measurement management
- [ ] Optimize performance for multiple measurements
- [ ] Integrate with LOD system
- [ ] Run tests and verify all pass
- [ ] Update coverage report

### Next Steps

1. **Coder Agent**: Implement the required methods in `molstar-service.ts`
2. **Reviewer Agent**: Code review for quality and performance
3. **Tester Agent**: Verify all tests pass and coverage increases
4. **Integration**: Merge with main codebase

### Notes

- Tests follow existing patterns from `MolStarViewer.test.tsx`
- Mock structure mirrors actual MolStar service
- Tests are comprehensive but focused on functionality
- Performance requirements: <1s for 25 measurements
- Edge cases covered: 0.01 Å to 200+ Å range

### Related Files

- Implementation: `src/services/molstar-service.ts`
- Types: `src/types/molstar.ts`
- Component: `src/components/viewer/MolStarViewer.tsx`
- Existing tests: `tests/components/molstar/MolStarViewer.test.tsx`
