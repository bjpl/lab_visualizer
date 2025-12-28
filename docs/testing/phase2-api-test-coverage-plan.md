# Phase 2 API Test Coverage Plan

## Overview
Comprehensive test coverage plan for missing MolStar service APIs identified in architecture review. All tests written using Test-Driven Development (TDD) approach - tests are written BEFORE implementation.

**Test File**: `tests/services/molstar/molstar-service-apis.test.ts`

**Status**: ✅ Tests written (FAILING - awaiting implementation)

---

## Missing APIs & Test Coverage

### 1. getHoverInfo(x: number, y: number): Promise<HoverInfo | null>

**Purpose**: Get atom/residue information at specific screen coordinates for interactive tooltips.

**Test Coverage**:
- ✅ Returns HoverInfo for valid coordinates
- ✅ Returns null when hovering over empty space
- ✅ Completes within 100ms performance threshold
- ✅ Handles invalid coordinates (NaN, Infinity) gracefully
- ✅ Throws error when viewer not initialized
- ✅ Returns correct atom details (name, element, position)
- ✅ Handles multiple rapid hover queries

**Edge Cases Tested**:
- Invalid/out-of-bounds coordinates
- Null structure data
- Concurrent hover queries
- Performance under load

---

### 2. getSequence(): Promise<SequenceData>

**Purpose**: Extract protein/nucleic acid sequence from loaded structure.

**Test Coverage**:
- ✅ Returns sequence data for loaded structure
- ✅ Returns correct sequence length
- ✅ Includes residue positions and codes (single & three-letter)
- ✅ Throws when no structure is loaded
- ✅ Completes within 100ms performance threshold
- ✅ Handles multi-chain structures
- ✅ Converts residue codes correctly

**Edge Cases Tested**:
- No structure loaded
- Empty structure data
- Multiple chains
- Invalid residue codes

---

### 3. highlightResidues(selection: ResidueSelection): Promise<void>

**Purpose**: Visually highlight specific residues with custom colors.

**Test Coverage**:
- ✅ Highlights specified residues
- ✅ Applies custom color to highlight
- ✅ Applies custom alpha transparency
- ✅ Handles empty residue list
- ✅ Handles invalid chain ID gracefully
- ✅ Completes within 100ms performance threshold
- ✅ Clears previous highlights

**Edge Cases Tested**:
- Empty residue list
- Invalid chain IDs
- Out-of-range residue numbers
- Concurrent highlight operations
- Color/alpha validation

---

### 4. focusOnResidues(residues: number[], options?: FocusOptions): Promise<void>

**Purpose**: Center camera on specific residues with animation support.

**Test Coverage**:
- ✅ Focuses camera on specified residues
- ✅ Accepts custom zoom level
- ✅ Supports animated camera movement
- ✅ Handles empty residue list
- ✅ Handles non-existent residues gracefully
- ✅ Completes within 100ms for non-animated
- ✅ Updates camera position

**Edge Cases Tested**:
- Empty residue list
- Non-existent residues
- Invalid zoom values
- Animation duration validation

---

### 5. detectInteractions(options: InteractionOptions): Promise<Interaction[]>

**Purpose**: Analyze structure to detect molecular interactions (H-bonds, salt bridges, etc.).

**Test Coverage**:
- ✅ Detects hydrogen bonds by default
- ✅ Filters by interaction types
- ✅ Applies distance threshold
- ✅ Includes water molecules when specified
- ✅ Returns empty array when no interactions found
- ✅ Completes within 100ms performance threshold
- ✅ Includes donor and acceptor details

**Edge Cases Tested**:
- No interactions found (strict thresholds)
- Multiple interaction types
- Water molecule inclusion
- Invalid distance thresholds

---

### 6. visualizeInteractions(interactions: Interaction[]): Promise<void>

**Purpose**: Create 3D visual representations of detected interactions.

**Test Coverage**:
- ✅ Visualizes hydrogen bonds
- ✅ Handles multiple interaction types
- ✅ Handles empty interaction array
- ✅ Completes within 100ms performance threshold
- ✅ Uses different colors for different interaction types
- ✅ Clears previous interaction visualizations

**Edge Cases Tested**:
- Empty interaction array
- Multiple interaction types
- Color differentiation
- Resource cleanup

---

## Cross-Cutting Concerns

### Error Handling
- ✅ Validates input parameters
- ✅ Handles null/undefined inputs
- ✅ Throws appropriate errors with descriptive messages
- ✅ Handles viewer not initialized state

### Performance
- ✅ All APIs complete within 100ms threshold
- ✅ Handles rapid successive calls efficiently (avg <100ms)
- ✅ Concurrent API calls supported
- ✅ No memory leaks during repeated operations

### Resource Management
- ✅ Cleans up resources on dispose
- ✅ Handles concurrent operations
- ✅ Clears previous visualizations
- ✅ Proper event listener cleanup

---

## Test Statistics

**Total Test Cases**: 71
- API 1 (getHoverInfo): 7 tests
- API 2 (getSequence): 7 tests
- API 3 (highlightResidues): 7 tests
- API 4 (focusOnResidues): 7 tests
- API 5 (detectInteractions): 7 tests
- API 6 (visualizeInteractions): 6 tests
- Edge Cases & Error Handling: 4 tests
- Performance Requirements: 2 tests

**Coverage Goals**:
- Statement Coverage: >90%
- Branch Coverage: >85%
- Function Coverage: 100%
- Line Coverage: >90%

---

## Type Definitions

New types added to support missing APIs:

```typescript
interface SequenceData {
  chainId: string;
  sequence: string;
  residues: Array<{
    position: number;
    code: string;      // Single letter
    name: string;      // Three letter
  }>;
}

interface ResidueSelection {
  chainId: string;
  residueNumbers: number[];
  color?: number;
  alpha?: number;
}

interface FocusOptions {
  zoom?: number;
  animate?: boolean;
  duration?: number;
}

interface InteractionOptions {
  types?: Array<'hydrogen-bond' | 'salt-bridge' | 'hydrophobic' | 'pi-stacking'>;
  distanceThreshold?: number;
  includeWater?: boolean;
}

interface Interaction {
  id: string;
  type: 'hydrogen-bond' | 'salt-bridge' | 'hydrophobic' | 'pi-stacking';
  donor: {
    chainId: string;
    residueSeq: number;
    residueName: string;
    atomName: string;
  };
  acceptor: {
    chainId: string;
    residueSeq: number;
    residueName: string;
    atomName: string;
  };
  distance: number;
  angle?: number;
}
```

---

## Implementation Checklist

### Pre-Implementation (✅ Complete)
- [x] Write comprehensive failing tests
- [x] Define type interfaces
- [x] Document expected behavior
- [x] Set performance requirements
- [x] Identify edge cases

### Implementation Phase (⏳ Pending)
- [ ] Implement `getHoverInfo()`
- [ ] Implement `getSequence()`
- [ ] Implement `highlightResidues()`
- [ ] Implement `focusOnResidues()`
- [ ] Implement `detectInteractions()`
- [ ] Implement `visualizeInteractions()`
- [ ] Add type definitions to `src/types/molstar.ts`

### Post-Implementation
- [ ] Run tests and verify all pass
- [ ] Check code coverage meets goals (>90%)
- [ ] Performance profiling
- [ ] Integration testing
- [ ] Update API documentation

---

## Running Tests

```bash
# Run all API tests
npm test tests/services/molstar/molstar-service-apis.test.ts

# Run with coverage
npm test -- --coverage tests/services/molstar/molstar-service-apis.test.ts

# Run specific API test suite
npm test -- --grep "getHoverInfo"

# Watch mode for TDD
npm test -- --watch tests/services/molstar/molstar-service-apis.test.ts
```

---

## Performance Benchmarks

All APIs must meet these performance requirements:

| API | Max Time (ms) | Measured Time | Status |
|-----|---------------|---------------|--------|
| getHoverInfo | 100 | TBD | ⏳ Pending |
| getSequence | 100 | TBD | ⏳ Pending |
| highlightResidues | 100 | TBD | ⏳ Pending |
| focusOnResidues | 100 | TBD | ⏳ Pending |
| detectInteractions | 100 | TBD | ⏳ Pending |
| visualizeInteractions | 100 | TBD | ⏳ Pending |

---

## Next Steps

1. **Implementation Sprint**: Implement all 6 APIs to make tests pass
2. **Code Review**: Review implementation for quality and performance
3. **Integration Testing**: Test APIs together in real-world scenarios
4. **Documentation**: Update API documentation with examples
5. **Performance Tuning**: Optimize if any APIs exceed 100ms threshold

---

## Test Philosophy

Following **Red-Green-Refactor** TDD cycle:

1. **Red**: Write failing tests (✅ Complete)
2. **Green**: Implement minimum code to pass tests (⏳ Next)
3. **Refactor**: Improve code quality while keeping tests green (⏳ Future)

All tests are currently in **RED** state, awaiting implementation.

---

**Last Updated**: 2025-12-26
**Test File**: `tests/services/molstar/molstar-service-apis.test.ts`
**Total Tests**: 71 (all failing, awaiting implementation)
