# GOAP Action 2.2: Multi-Selection System - Test Plan

## Overview
**Action**: Multi-Selection System
**Precondition**: measurementVisualization = true
**Effect**: multiSelection = true, lineCoverage +2%
**Status**: Tests Written (FAILING - TDD Phase)

## Test Files Created

### 1. Component Tests
**File**: `tests/components/viewer/interactive/multi-selection.test.tsx`
- **Lines**: 1077 lines of comprehensive tests
- **Coverage**: All UI interactions and state management
- **Status**: FAILING (components not yet implemented)

### 2. Utility Tests
**File**: `tests/lib/selection/SelectionManager.test.ts`
- **Lines**: 642 lines of unit tests
- **Coverage**: SelectionManager class logic
- **Status**: FAILING (SelectionManager not yet implemented)

## Test Coverage Matrix

### 1. Selection State Management (11 tests)
- ✅ Initialize with empty selection state
- ✅ Store has addAtomToSelection action
- ✅ Store has removeAtomFromSelection action
- ✅ Store has toggleAtomSelection action
- ✅ Store has selectAllAtoms action
- ✅ Store has clearAllSelections action
- ✅ Store selection metadata (position, element, etc)
- 🔄 **Implements**: Zustand store slice for multi-selection

### 2. Single Atom Selection (3 tests)
- ✅ Select single atom on click
- ✅ Replace previous selection (without modifiers)
- ✅ Emit selection event
- 🔄 **Implements**: Click handler with modifier detection

### 3. Multi-Atom Selection (4 tests)
- ✅ Add atom to selection with Shift+Click
- ✅ Preserve previous selections when adding
- ✅ Prevent duplicate selections
- 🔄 **Implements**: Shift key detection, multi-atom array management

### 4. Toggle Selection (3 tests)
- ✅ Deselect atom when clicking selected atom
- ✅ Add atom when toggling unselected atom
- ✅ Maintain other selections when toggling one
- 🔄 **Implements**: Toggle logic in store

### 5. Select All Atoms (4 tests)
- ✅ Select all atoms with Ctrl+A
- ✅ Handle keyboard event (Ctrl+A)
- ✅ Respect selection limit when selecting all
- ✅ Show warning when select all exceeds limit
- 🔄 **Implements**: Keyboard event handler, selectAllAtoms action

### 6. Clear All Selections (3 tests)
- ✅ Clear all selections with Escape key
- ✅ Call clearAllSelections action
- ✅ Reset selection type to 'none'
- 🔄 **Implements**: Escape key handler, clearAllSelections action

### 7. Selection Limit (5 tests)
- ✅ Enforce maximum of 100 atoms
- ✅ Prevent adding atoms when limit reached
- ✅ Display warning when limit reached
- ✅ Store has selectionLimit property
- 🔄 **Implements**: Limit enforcement logic in store

### 8. Selection Persistence Across Measurements (3 tests)
- ✅ Maintain selection when adding measurements
- ✅ Persist selection when switching measurement modes
- ✅ Use selected atoms for measurements
- 🔄 **Implements**: State isolation between selection and measurements

### 9. Keyboard Modifier Handling (5 tests)
- ✅ Detect Shift key for multi-selection
- ✅ Detect Ctrl/Cmd key for toggle
- ✅ Handle Ctrl+A for select all
- ✅ Handle Cmd+A on Mac for select all
- ✅ Prioritize Shift over Ctrl
- 🔄 **Implements**: Keyboard event handling with modifier keys

### 10. Edge Cases and Error Handling (8 tests)
- ✅ Handle empty selection gracefully
- ✅ Handle invalid atom ID
- ✅ Handle null/undefined atoms
- ✅ Handle rapid selection changes
- ✅ Maintain consistency after errors
- ✅ Handle selection with no loaded structure
- ✅ Handle concurrent selection operations
- 🔄 **Implements**: Error boundaries, validation logic

### 11. Selection UI Component (5 tests)
- ✅ Render MultiSelectionPanel component
- ✅ Display selection count
- ✅ Display clear button when atoms selected
- ✅ Display select all button
- ✅ Show keyboard shortcuts hint
- 🔄 **Implements**: MultiSelectionPanel React component

## SelectionManager Utility Tests

### Initialization (3 tests)
- ✅ Initialize with empty selection
- ✅ Accept custom selection limit
- ✅ Default to 100 selections

### Single Selection (3 tests)
- ✅ Add single atom to selection
- ✅ Replace selection when replaceMode is true
- ✅ Add to selection when replaceMode is false

### Multi-Selection (3 tests)
- ✅ Add multiple atoms to selection
- ✅ Prevent duplicate selections
- ✅ Handle selecting already selected atoms

### Toggle Selection (3 tests)
- ✅ Toggle atom selection on/off
- ✅ Add atom if not selected
- ✅ Remove atom if already selected

### Deselection (3 tests)
- ✅ Deselect atom by ID
- ✅ Deselect multiple atoms
- ✅ Handle deselecting non-selected atoms

### Clear Selection (2 tests)
- ✅ Clear all selections
- ✅ Handle clearing empty selection

### Select All (3 tests)
- ✅ Select all provided atoms
- ✅ Respect selection limit
- ✅ Return warning when limited

### Selection Limit Enforcement (5 tests)
- ✅ Enforce maximum selection limit
- ✅ Return failure when limit exceeded
- ✅ Not add atoms beyond limit
- ✅ Check if limit reached
- ✅ Calculate remaining selection slots

### Selection Queries (5 tests)
- ✅ Check if atom is selected
- ✅ Get all selected atoms
- ✅ Get selected atom IDs
- ✅ Get selection count
- ✅ Check if has selections

### Event Handling (5 tests)
- ✅ Emit event on selection change
- ✅ Emit event on deselection
- ✅ Emit event on clear
- ✅ Emit warning event when limit reached
- ✅ Allow removing event listeners

### Batch Operations (2 tests)
- ✅ Support batch selection without multiple events
- ✅ Support batch deselection

### Selection Persistence (3 tests)
- ✅ Export selection state
- ✅ Restore selection from state
- ✅ Validate state before restoring

### Error Handling (5 tests)
- ✅ Handle null atom gracefully
- ✅ Handle undefined atom gracefully
- ✅ Handle atom without ID
- ✅ Handle empty array for selectAll
- ✅ Maintain state consistency on errors

### Performance (2 tests)
- ✅ Handle large selections efficiently (<100ms for 100 atoms)
- ✅ Perform selection checks efficiently (<50ms for 1000 checks)

## Implementation Requirements

### Store Modifications (visualization-slice.ts)
```typescript
// Add to VisualizationSlice interface
selectedAtoms: AtomSelection[];
selectionLimit: number;
addAtomToSelection: (atom: AtomSelection) => void;
removeAtomFromSelection: (atomId: string) => void;
toggleAtomSelection: (atomId: string) => void;
selectAllAtoms: (atoms: AtomSelection[], options?: { onWarning?: (msg: string) => void }) => void;
clearAllSelections: () => void;
replaceSelection: (atom: AtomSelection) => void;
setMeasurementMode: (mode: string) => void;
addMeasurement: (measurement: any) => void;
createMeasurementFromSelection: () => void;
measurements: any[];
```

### New Components
1. **MultiSelectionPanel** (`src/components/viewer/interactive/MultiSelectionPanel.tsx`)
   - Display selection count
   - Clear button
   - Select all button
   - Keyboard shortcuts hint
   - Selection list with atom details

### New Utilities
1. **SelectionManager** (`src/lib/selection/SelectionManager.ts`)
   - Core selection logic
   - Limit enforcement
   - Event emission
   - State persistence
   - Batch operations

### Keyboard Event Handling
- **Escape**: Clear all selections
- **Ctrl+A / Cmd+A**: Select all atoms
- **Shift+Click**: Add to selection
- **Ctrl+Click / Cmd+Click**: Toggle selection
- **Click (no modifiers)**: Replace selection

## Test Execution Plan

### Phase 1: TDD - Red (Current)
- [x] Write all failing tests
- [x] Document test coverage
- [x] Create test plan

### Phase 2: TDD - Green (Next)
- [ ] Implement SelectionManager utility
- [ ] Add multi-selection state to visualization slice
- [ ] Create MultiSelectionPanel component
- [ ] Implement keyboard event handlers
- [ ] Tests should pass

### Phase 3: TDD - Refactor
- [ ] Optimize performance
- [ ] Improve error messages
- [ ] Add accessibility features
- [ ] Document public API

## Success Criteria

### Test Coverage
- ✅ Component tests: 54 test cases
- ✅ Utility tests: 44 test cases
- ✅ Total: 98 test cases
- 🎯 Target: All tests passing (currently failing - TDD)

### Code Coverage Target
- 🎯 Statements: >90%
- 🎯 Branches: >85%
- 🎯 Functions: >90%
- 🎯 Lines: >90% (+2% from GOAP requirement)

### Performance Targets
- ✅ Large selection (100 atoms): <100ms
- ✅ Selection checks (1000 operations): <50ms
- 🎯 Keyboard response: <16ms (60fps)

### Accessibility
- 🎯 Keyboard navigation support
- 🎯 ARIA labels for screen readers
- 🎯 Focus management
- 🎯 Visual feedback for selections

## Integration Points

### MolStar Integration
- Hook into MolStar's selection events
- Visualize selected atoms (green tint)
- Synchronize with 3D viewer

### Measurement System Integration
- Use selected atoms for distance measurements
- Use selected atoms for angle measurements
- Persist selection across measurement mode changes

### UI Integration
- MultiSelectionPanel in InteractiveMolecularViewer
- Selection count badge in toolbar
- Clear/Select All buttons

## Notes
- All tests written following TDD methodology (Red phase)
- Tests use Vitest and React Testing Library
- Mock data structures defined for type safety
- Event handling tested with userEvent library
- Performance benchmarks included
- Error cases comprehensively covered

## Next Steps
1. Implement SelectionManager utility class
2. Extend visualization-slice with multi-selection state
3. Create MultiSelectionPanel component
4. Add keyboard event handlers to InteractiveMolecularViewer
5. Integrate with MolStar viewer for visual feedback
6. Run tests and achieve green phase
7. Refactor for performance and code quality

---
**Created**: 2025-12-26
**GOAP Action**: 2.2 - Multi-Selection System
**TDD Phase**: Red (Tests Written, Failing)
**Test Count**: 98 comprehensive test cases
