# Multi-Selection System - Implementation Guide

## Quick Reference for GREEN Phase

This guide provides implementation hints based on the test specifications. Follow TDD: make tests pass one at a time.

---

## 1. Selection Store Implementation

**File:** `/src/stores/selection-store.ts`

### Required Interface
```typescript
interface AtomSelection {
  atomId: string;
  chainId: string;
  residueNumber: number;
  residueName: string;
  atomName: string;
  position: { x: number; y: number; z: number };
  timestamp: number;
}

interface ResidueSelection {
  chainId: string;
  residueNumber: number;
  residueName: string;
  atomCount: number;
  timestamp: number;
}

type Selection = AtomSelection | ResidueSelection;
type MeasurementType = 'distance' | 'angle' | 'dihedral' | null;

interface SelectionState {
  selections: Selection[];
  measurementType: MeasurementType;
  maxSelections: number;
  autoTriggerMeasurement: boolean;
}

interface SelectionActions {
  addSelection: (selection: Selection) => void;
  removeSelection: (index: number) => void;
  clearSelections: () => void;
  setMeasurementType: (type: MeasurementType) => void;
  getSelectionOrder: () => Selection[];
}
```

### Key Implementation Points

1. **Zustand Store Setup**
   ```typescript
   import { create } from 'zustand';
   import { persist } from 'zustand/middleware';

   export const useSelectionStore = create<SelectionState & SelectionActions>()(
     persist(
       (set, get) => ({
         // State
         selections: [],
         measurementType: null,
         maxSelections: 0,
         autoTriggerMeasurement: false,

         // Actions
         addSelection: (selection) => { /* ... */ },
         // ...
       }),
       { name: 'selection-store' }
     )
   );
   ```

2. **Selection Limits**
   - Distance: max 2
   - Angle: max 3
   - Dihedral: max 4
   - Implement FIFO when limit exceeded

3. **Auto-Trigger Logic**
   - Emit `measurement-trigger` event when limit reached
   - Listen for `measurement-complete` to clear selections

4. **Duplicate Prevention**
   - Check `atomId` before adding
   - Update timestamp if already exists

---

## 2. Keyboard Shortcuts Hook

**File:** `/src/hooks/useKeyboardShortcuts.ts`

### Required Interface
```typescript
interface KeyboardShortcutConfig {
  selectAll: string;
  clearSelections: string;
  addToSelection: string;
  toggleSelection: string;
  distanceMeasurement: string;
  angleMeasurement: string;
  dihedralMeasurement: string;
  resetView: string;
  toggleSpin: string;
}

interface KeyboardShortcutCallbacks {
  onSelectAll?: () => void;
  onClearSelections?: () => void;
  onMeasurementStart?: (type: MeasurementType) => void;
  onResetView?: () => void;
  onToggleSpin?: () => void;
}

interface UseKeyboardShortcutsReturn {
  isShiftPressed: boolean;
  isCtrlPressed: boolean;
  isMetaPressed: boolean;
  config: KeyboardShortcutConfig;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}
```

### Key Implementation Points

1. **Event Listeners**
   ```typescript
   useEffect(() => {
     if (!enabled) return;

     const handleKeyDown = (e: KeyboardEvent) => {
       // Check if input/textarea focused
       if (isEditableElement(e.target)) return;

       // Handle shortcuts
       // ...
     };

     window.addEventListener('keydown', handleKeyDown);
     window.addEventListener('keyup', handleKeyUp);

     return () => {
       window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('keyup', handleKeyUp);
     };
   }, [enabled, callbacks]);
   ```

2. **Accessibility**
   ```typescript
   const isEditableElement = (target: EventTarget | null): boolean => {
     if (!target || !(target instanceof Element)) return false;
     const tagName = target.tagName.toLowerCase();
     return (
       tagName === 'input' ||
       tagName === 'textarea' ||
       target.getAttribute('contenteditable') === 'true'
     );
   };
   ```

3. **Cross-Platform**
   - Detect Mac: `navigator.platform.includes('Mac')`
   - Use Meta for Mac, Ctrl for Windows/Linux
   - Support both for compatibility

4. **Cleanup**
   - Reset modifier states on blur
   - Remove listeners on unmount

---

## 3. Multi-Selection Hook

**File:** `/src/hooks/viewer/use-multi-selection.ts`

### Required Interface
```typescript
interface UseMultiSelectionOptions {
  maxSelections?: number;
  onSelectionChanged?: (event: SelectionEvent) => void;
  enableHighlighting?: boolean;
  highlightColor?: string;
}

interface UseMultiSelectionReturn {
  selections: AtomSelection[];
  addSelection: (selection: AtomSelection) => void;
  removeSelection: (atomId: string) => void;
  clearSelections: () => void;
  toggleSelection: (selection: AtomSelection) => void;
  isSelected: (atomId: string) => boolean;
  selectionCount: number;
}
```

### Key Implementation Points

1. **Integration with Store**
   ```typescript
   export const useMultiSelection = (options?: UseMultiSelectionOptions) => {
     const store = useSelectionStore();

     const addSelection = useCallback((selection: AtomSelection) => {
       store.addSelection(selection);

       if (options?.enableHighlighting) {
         highlightAtom(selection.atomId, options.highlightColor);
       }

       options?.onSelectionChanged?.({
         type: 'add',
         selection,
       });
     }, [store, options]);

     // ...
   };
   ```

2. **MolStar Highlighting**
   ```typescript
   const highlightAtom = (atomId: string, color?: string) => {
     if (window.molstar?.highlight) {
       window.molstar.highlight({ atomId, color: color || '#FFD700' });
     }
   };
   ```

3. **Performance Optimization**
   - Use `useMemo` for derived state
   - Use `useCallback` for stable functions
   - Batch MolStar updates

4. **Duplicate Prevention**
   ```typescript
   const isSelected = useCallback(
     (atomId: string) => {
       return selections.some(s => 'atomId' in s && s.atomId === atomId);
     },
     [selections]
   );
   ```

---

## 4. Performance Optimization

### Target Metrics
- **Single operation:** <100ms
- **Average latency (1000 ops):** <50ms
- **P95 latency:** <100ms
- **Throughput:** >100 ops/sec
- **Memory (10k selections):** <5MB

### Optimization Strategies

1. **Efficient Data Structures**
   ```typescript
   // Use Set for O(1) lookup
   const selectionSet = useMemo(
     () => new Set(selections.map(s => 'atomId' in s ? s.atomId : `${s.chainId}-${s.residueNumber}`)),
     [selections]
   );
   ```

2. **Batch Updates**
   ```typescript
   const addMultiple = useCallback((atoms: AtomSelection[]) => {
     // Batch store update
     set(state => ({
       selections: [...state.selections, ...atoms]
     }));

     // Batch MolStar update
     if (window.molstar?.batchHighlight) {
       window.molstar.batchHighlight(
         atoms.map(a => ({ atomId: a.atomId, color: highlightColor }))
       );
     }
   }, [highlightColor]);
   ```

3. **Memoization**
   - Memoize sorted selections
   - Memoize lookup functions
   - Use stable callbacks

---

## Test Execution Order

1. **Start with Store Tests**
   ```bash
   npm test -- tests/stores/selection-store.test.ts --watch
   ```

2. **Then Keyboard Shortcuts**
   ```bash
   npm test -- tests/hooks/useKeyboardShortcuts.test.ts --watch
   ```

3. **Then Multi-Selection Hook**
   ```bash
   npm test -- tests/hooks/viewer/use-multi-selection.test.ts --watch
   ```

4. **Finally Performance**
   ```bash
   npm test -- tests/performance/selection-performance.test.ts
   ```

---

## Common Pitfalls

1. **Memory Leaks**
   - Always cleanup event listeners
   - Clear MolStar highlights on unmount
   - Don't store circular references

2. **Race Conditions**
   - Use functional updates in Zustand
   - Batch state updates properly
   - Handle async operations carefully

3. **Performance**
   - Don't iterate arrays unnecessarily
   - Use Set/Map for lookups
   - Batch MolStar operations

4. **Accessibility**
   - Check for editable elements
   - Don't capture navigation shortcuts
   - Support keyboard-only usage

---

## Debugging Tips

1. **Use React DevTools**
   - Monitor re-renders
   - Inspect Zustand state

2. **Performance Profiling**
   ```typescript
   console.time('addSelection');
   addSelection(atom);
   console.timeEnd('addSelection');
   ```

3. **Event Logging**
   ```typescript
   window.addEventListener('measurement-trigger', (e) => {
     console.log('Measurement triggered:', e.detail);
   });
   ```

---

## Completion Checklist

- [ ] All 19 store tests passing
- [ ] All 28 keyboard shortcut tests passing
- [ ] All 24 hook tests passing
- [ ] All 21 performance tests passing
- [ ] No console errors or warnings
- [ ] TypeScript compilation successful
- [ ] Coverage >90% for new code
- [ ] Manual testing with MolStar viewer

---

**Next Phase:** REFACTOR (optimize and clean up passing code)
