# GOAP Action 2.1: 3D Measurement Visualization - Test Plan

## Overview

**Action**: GOAP Action 2.1 - 3D Measurement Visualization
**Precondition**: `phase1Complete = true` (measurements tracked but not visualized)
**Effect**: `measurementVisualization = true`, `lineCoverage +2%`
**Status**: Test-Driven Development Phase - Tests Written, Implementation Pending

## Test-Driven Development Approach

### Phase 1: Write Failing Tests ✓ COMPLETE
- Created comprehensive test suite: `tests/components/viewer/interactive/measurement-visualization.test.tsx`
- Total test cases: 47
- All tests designed to fail until implementation is complete
- Tests define exact requirements for implementation

### Phase 2: Implementation (Next Step)
- Implement methods in `molstar-service.ts`
- Create 3D geometry using MolStar Shape API
- Add visibility controls and deletion
- Optimize for performance

### Phase 3: Verification
- Run tests and verify all 47 pass
- Measure coverage increase (+2% target)
- Performance validation (25+ measurements <1s)

## Test Coverage Matrix

### Functional Requirements

| Feature | Test Count | Status | Priority |
|---------|-----------|--------|----------|
| Distance Line Rendering | 4 | FAILING | High |
| Angle Arc Rendering | 4 | FAILING | High |
| Dihedral Torsion Indicator | 3 | FAILING | High |
| Visibility Toggle | 4 | FAILING | Medium |
| Measurement Deletion | 4 | FAILING | Medium |
| Multiple Measurements | 4 | FAILING | High |
| Error Handling | 4 | FAILING | Medium |
| System Integration | 3 | FAILING | Medium |

### Test Categories Detail

#### 1. Distance Measurement Display (4 tests)

**Requirement**: Display distance measurements as 3D lines connecting atoms

```typescript
// Test: Display distance measurement as 3D line
it('should display distance measurement as 3D line in viewport', async () => {
  const selection1 = { position: [0, 0, 0], ... };
  const selection2 = { position: [10, 0, 0], ... };

  await molstarService.measureDistance(selection1, selection2);

  // Verify line created with label "10.00 Å"
});
```

**Expected Behavior**:
- 3D line geometry from point A to point B
- Label showing distance in Ångströms (Å)
- Label positioned at line midpoint
- Dynamic updates for trajectory playback

**Implementation Notes**:
- Use MolStar Shape API for line geometry
- Calculate midpoint: `[(x1+x2)/2, (y1+y2)/2, (z1+z2)/2]`
- Label format: `value.toFixed(2) + ' Å'`

#### 2. Angle Measurement Display (4 tests)

**Requirement**: Display angle measurements as arcs between vectors

```typescript
// Test: Display angle as arc
it('should display angle measurement as arc between vectors', async () => {
  const sel1 = { position: [-5, 0, 0], ... }; // arm 1
  const sel2 = { position: [0, 0, 0], ... };  // vertex
  const sel3 = { position: [0, 5, 0], ... };  // arm 2

  await molstarService.measureAngle(sel1, sel2, sel3);

  // Verify arc created at vertex showing 90°
});
```

**Expected Behavior**:
- Arc geometry at vertex showing angle span
- Label showing angle in degrees (°)
- Arc radius proportional to structure size
- Label near arc midpoint

**Implementation Notes**:
- Calculate vectors: `v1 = sel1 - vertex`, `v2 = sel3 - vertex`
- Create arc using Shape API
- Arc angle: `acos(dot(v1, v2) / (mag(v1) * mag(v2)))`
- Label format: `angle.toFixed(2) + '°'`

#### 3. Dihedral Angle Display (3 tests)

**Requirement**: Display dihedral angles with torsion indicators

```typescript
// Test: Display dihedral with torsion indicator
it('should display dihedral angle with torsion indicator', async () => {
  const sels = [sel1, sel2, sel3, sel4]; // 4 atoms

  await molstarService.measureDihedral(...sels);

  // Verify torsion indicator with sign
});
```

**Expected Behavior**:
- Visual indicator showing rotation between planes
- Label with signed angle (±X.XX°)
- Direction indicator (color/arrow)
- Positioned along central bond

**Implementation Notes**:
- Calculate planes: plane1(sel1,sel2,sel3), plane2(sel2,sel3,sel4)
- Dihedral = angle between plane normals
- Use cross products for plane normals
- Sign indicates rotation direction

#### 4. Visibility Toggle (4 tests)

**Requirement**: Show/hide measurements without deleting data

```typescript
// Test: Toggle visibility
it('should toggle individual measurement visibility', async () => {
  molstarService.toggleMeasurementVisibility(measurementId);

  // Verify visibility changed in 3D viewport
  // Verify data preserved
});
```

**Expected Behavior**:
- Individual toggle per measurement
- Data retained when hidden
- UI reflects visibility state
- Bulk toggle for all measurements

**Implementation Notes**:
- Use MolStar `PluginCommands.State.ToggleVisibility`
- Track visibility state in measurement metadata
- UI checkbox/eye icon for each measurement

#### 5. Measurement Deletion (4 tests)

**Requirement**: Remove measurements with complete cleanup

```typescript
// Test: Delete measurement
it('should remove measurement from 3D viewport on delete', async () => {
  molstarService.removeMeasurement(measurementId);

  // Verify all geometry removed
  // Verify no artifacts remain
});
```

**Expected Behavior**:
- Complete geometry removal
- No visual artifacts
- Remove from UI list
- Clear all button for bulk delete

**Implementation Notes**:
- Use `PluginCommands.State.RemoveObject`
- Remove all associated shapes (lines, arcs, labels)
- Clean up from internal measurement tracking
- UI updates to remove from list

#### 6. Multiple Measurements (4 tests)

**Requirement**: Handle many concurrent measurements

```typescript
// Test: Multiple measurements
it('should maintain performance with 25+ measurements', async () => {
  const measurements = Array.from({ length: 25 }, createMeasurement);

  const start = performance.now();
  for (const m of measurements) {
    await molstarService.add3DMeasurementLabel(m);
  }
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(1000); // <1s
});
```

**Expected Behavior**:
- 20+ concurrent measurements supported
- Mix of distance, angle, dihedral types
- Render all in <1 second
- No performance degradation
- Independent management

**Implementation Notes**:
- Batch shape creation if possible
- Use efficient data structures (Map for O(1) lookup)
- Consider instancing for similar geometries
- LOD for distant measurements

#### 7. Error Handling (4 tests)

**Requirement**: Graceful handling of edge cases

```typescript
// Test: Extreme distances
it('should handle extremely close atoms (< 0.1 Å)', async () => {
  const measurement = { value: 0.05, ... };

  await molstarService.add3DMeasurementLabel(measurement);

  // Verify renders correctly, no division by zero
});
```

**Expected Behavior**:
- Handle missing atom data gracefully
- Support 0.01 Å to 200+ Å range
- No crashes on bad data
- Appropriate warnings/errors

**Implementation Notes**:
- Validate measurement data before rendering
- Clamp label sizes (min/max)
- Guard against division by zero
- Log warnings for suspicious values

#### 8. System Integration (3 tests)

**Requirement**: Work with existing features

```typescript
// Test: Structure loading
it('should clear measurements on structure change', async () => {
  addMeasurements();

  await molstarService.loadStructureById('2XYZ');

  // Verify measurements cleared
});
```

**Expected Behavior**:
- Clear measurements on new structure load
- Respect LOD settings
- Overlay on all representation types
- Work with trajectory playback

**Implementation Notes**:
- Hook into structure loading events
- Clear measurements in `clear()` method
- Layer measurements above structure
- Update measurements on trajectory frame change

## Implementation Checklist

### Core Functionality
- [ ] Create `visualizeMeasurement(measurement: MeasurementResult)` method
- [ ] Implement distance line rendering
- [ ] Implement angle arc rendering
- [ ] Implement dihedral torsion indicators
- [ ] Add 3D label rendering

### Visibility & Management
- [ ] Implement `hideMeasurement(id: string)` method
- [ ] Implement `showMeasurement(id: string)` method
- [ ] Track measurement visibility state
- [ ] Add bulk toggle functionality

### Deletion & Cleanup
- [ ] Enhance `removeMeasurement(id: string)` for complete cleanup
- [ ] Enhance `clearMeasurements()` for all measurements
- [ ] Ensure no orphaned 3D objects
- [ ] Update UI on deletion

### Performance
- [ ] Optimize for 25+ concurrent measurements
- [ ] Target <1s render time for bulk operations
- [ ] Implement efficient data structures
- [ ] Consider LOD for distant measurements

### Integration
- [ ] Clear measurements on structure load
- [ ] Integrate with LOD system
- [ ] Work with all representation types
- [ ] Support trajectory playback

### Testing & Validation
- [ ] Run all 47 tests
- [ ] Verify 100% pass rate
- [ ] Measure coverage increase (+2% target)
- [ ] Performance benchmarks
- [ ] Visual inspection of all measurement types

## Coverage Target

**Current Coverage**: ~79% (based on existing test suite)
**Target Coverage**: +2% line coverage
**Expected Coverage**: ~81%

**Coverage Areas**:
- `molstar-service.ts`: +2% from new visualization methods
- New shape creation code
- Visibility toggle logic
- Deletion cleanup code

## Performance Targets

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| Single measurement render | <50ms | TBD | Distance, angle, or dihedral |
| 25 measurements bulk | <1s | TBD | Mixed types |
| Toggle visibility | <10ms | TBD | Per measurement |
| Delete measurement | <20ms | TBD | Complete cleanup |
| Clear all (25 measurements) | <100ms | TBD | Bulk deletion |

## Dependencies

### MolStar API
- `StateTransforms.Shape.*`: Create custom 3D shapes
- `PluginCommands.State.*`: Manage object visibility and deletion
- `plugin.build().toRoot().apply()`: Add shapes to scene
- `plugin.state.data.selectQ()`: Query scene state

### TypeScript Types
```typescript
interface MeasurementResult {
  id: string;
  type: 'distance' | 'angle' | 'dihedral';
  value: number;
  unit: 'Å' | '°';
  label: string;
  participants: ParticipantInfo[];
  timestamp: number;
}
```

## Success Criteria

✓ All 47 tests pass
✓ Coverage increases by ≥2%
✓ Performance targets met
✓ Visual quality acceptable
✓ No memory leaks
✓ Integration tests pass
✓ Code review approved

## Next Steps

1. **Coder Agent**: Implement visualization methods in `molstar-service.ts`
2. **Reviewer Agent**: Review code for quality, performance, security
3. **Tester Agent**: Run tests, verify coverage, benchmark performance
4. **Integration**: Merge to main, update documentation

## Related Files

- **Test File**: `tests/components/viewer/interactive/measurement-visualization.test.tsx`
- **Implementation**: `src/services/molstar-service.ts`
- **Types**: `src/types/molstar.ts`
- **Component**: `src/components/viewer/MolStarViewer.tsx`
- **Documentation**: `tests/components/viewer/interactive/README.md`

## Notes

- Tests are comprehensive and define exact requirements
- Implementation should follow MolStar best practices
- Performance is critical for user experience
- Visual quality should match MolStar's native tools
- Error handling must be robust (biological data varies widely)

---

**Test Plan Created**: 2025-12-26
**Status**: Phase 1 Complete (Tests Written)
**Next**: Phase 2 (Implementation)
**GOAP Action**: 2.1 - 3D Measurement Visualization
