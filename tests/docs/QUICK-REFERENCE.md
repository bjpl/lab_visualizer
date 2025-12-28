# Multi-Selection System - Quick Reference

## TDD Status: RED ✅

---

## Quick Stats

```
📁 Test Files: 2
📋 Test Cases: 64
📊 Lines: 754+
📚 Docs: 5 files
✅ Phase: RED complete
🎯 Next: GREEN implementation
```

---

## Test Files

| File | Path | Tests | Purpose |
|------|------|-------|---------|
| Component Tests | `tests/components/viewer/interactive/multi-selection.test.tsx` | 17 | UI & state integration |
| Utility Tests | `tests/lib/selection/SelectionManager.test.ts` | 47 | Core selection logic |

---

## Run Tests

```bash
# All multi-selection tests
npm test -- multi-selection

# Component tests
npm test -- tests/components/viewer/interactive/multi-selection.test.tsx

# Utility tests
npm test -- tests/lib/selection/SelectionManager.test.ts

# With coverage
npm test -- --coverage
```

---

## Test Coverage

### Requirements (All ✅)
- Click atom → adds to selection
- Shift+click → adds to existing
- Click selected → deselects
- Ctrl/Cmd+A → select all
- Escape → clear all
- Limit: 100 atoms max
- Persist across measurements

### Test Suites
1. Selection Store (6 tests)
2. Keyboard Modifiers (3 tests)
3. MolStar Integration (2 tests)
4. Edge Cases (4 tests)
5. State Persistence (2 tests)
6. Initialization (3 tests)
7. Single Selection (3 tests)
8. Multi-Selection (3 tests)
9. Toggle Selection (3 tests)
10. Deselection (3 tests)
11. Clear Selection (2 tests)
12. Select All (3 tests)
13. Limit Enforcement (5 tests)
14. Selection Queries (5 tests)
15. Event Handling (5 tests)
16. Batch Operations (2 tests)
17. Persistence (3 tests)
18. Error Handling (5 tests)
19. Performance (2 tests)

---

## Implementation Checklist

### GREEN Phase 🎯
- [ ] Create `src/stores/selection-store.ts`
- [ ] Create `src/lib/selection/SelectionManager.ts`
- [ ] Add keyboard handlers
- [ ] Integrate MolStar events
- [ ] Run tests → All pass
- [ ] Verify +2% coverage

### Store API Required
```typescript
interface SelectionStore {
  selectedAtoms: Set<string>;
  addSelection: (id: string) => void;
  removeSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
}
```

### Keyboard Shortcuts
```
Shift + Click → Add to selection
Ctrl/Cmd + A → Select all
Escape → Clear all
Click → Single select (replaces)
```

---

## Performance Targets

```typescript
✅ 100 atoms: <100ms
✅ 1000 checks: <50ms
✅ 10,000 atoms: <100ms
🎯 Keyboard: <16ms (60fps)
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `action-2.2-test-plan.md` | Full test plan & requirements |
| `tdd-summary-action-2.2.md` | TDD phase summary |
| `DELIVERABLES-ACTION-2.2.md` | Complete deliverables |
| `QUICK-REFERENCE.md` | This document |

---

## Memory Key

```
action-2.2-tests
```

---

## Status: Ready for Implementation ✅

All tests written. Ready for GREEN phase.
