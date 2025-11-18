# ESLint Manual Fixes Checklist
**Quick Reference Guide for Manual ESLint Fixes**

---

## Quick Wins - Unused React Imports (15 files)

These can be fixed immediately by removing the unused React import:

```bash
# Files with unused React import (React 17+ JSX Transform)
./src/app/jobs/page.tsx:15
./src/app/simulation/page.tsx:8
./src/app/viewer/page.tsx:4
./src/components/browse/StructureBrowser.tsx:15
./src/components/browse/StructureCard.tsx:5
./src/components/jobs/JobActions.tsx:14
./src/components/jobs/JobDetails.tsx:15
./src/components/jobs/JobList.tsx:13
./src/components/layout/Footer.tsx:4
./src/components/layout/Header.tsx:12
./src/components/simulation/EnergyPlot.tsx:8
./src/components/simulation/ForceFieldSettings.tsx:12
./src/components/viewer/InfoPanel.tsx:7
./src/components/viewer/LoadingState.tsx:6
./src/components/viewer/Toolbar.tsx:7
```

**Fix:** Simply remove `import React from 'react'` or remove `React` from import list.

---

## Unused Variables by File

### API Routes

**./src/app/api/export/pdf/route.ts:14**
```typescript
// Line 14: Remove or use 'options' variable
const options = {...}; // Currently unused
```

### Pages

**./src/app/simulation/page.tsx:65**
```typescript
// CRITICAL: React purity violation
// Move Math.random() calls to useState initializer
const [mockPositions] = useState(() => {
  const positions = new Float32Array(300 * 3);
  for (let i = 0; i < positions.length; i++) {
    positions[i] = Math.random() * 10 - 5;
  }
  return positions;
});
```

### Components - Collaboration

**./src/components/collaboration/AnnotationTools.tsx**
```typescript
// Line 45: Remove or implement handleAddAnnotation
const handleAddAnnotation = ... // Not used

// Line 96: Remove or implement handleEditAnnotation
const handleEditAnnotation = ... // Not used

// Line 267: Add keyboard handler for accessibility
<div onClick={handleClick}> // Missing onKeyDown
```

**./src/components/collaboration/CollaborationPanel.tsx**
```typescript
// Line 16: Remove unused imports
import { useCollaborationStore, selectCurrentSession } from ...

// Line 36: Remove or use variables
const inviteLink = ...
const inviteCode = ...

// Line 116: Remove or implement
const handleToggleCameraControl = ...

// Lines 167, 200: Fix label associations
<label htmlFor="input-id">Label</label>
<input id="input-id" />
```

### Components - Viewer

**./src/components/MolecularViewer.tsx:12**
```typescript
// Remove unused useCallback import
import { useState, useEffect, useRef } from 'react'; // Remove useCallback

// Lines 186, 229: Add missing dependencies or wrap in useCallback
useEffect(() => {
  // ...
}, [structureId, lodBridge]); // Missing: loadStructure, loadStructureById, onError
```

**./src/components/viewer/ExportPanel.tsx**
```typescript
// Line 190: Add keyboard handler
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>

// Line 384: Add keyboard handler
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>
```

**./src/components/viewer/ControlsPanel.tsx**
```typescript
// Lines 58, 81: Add missing dependencies to useEffect
useEffect(() => {
  // Wrap parent callbacks in useCallback or add to deps
}, [structureId, onError, onLoadComplete, onLoadStart]);
```

### Components - Jobs

**./src/components/jobs/JobSubmissionForm.tsx**
```typescript
// Line 77: Use or remove setStructureId
const [structureId, setStructureId] = useState(...);

// Line 79: Use or remove setAtomCount
const [atomCount, setAtomCount] = useState(...);

// Lines 243, 310: Associate labels with inputs
<label htmlFor="field-id">Label</label>
<input id="field-id" />
```

### Components - Browse

**./src/components/browse/StructureBrowser.tsx**
```typescript
// Line 15: Remove unused imports
// import { getStructuresByCategory, PopularStructure } from ...
```

### Types

**./src/types/molstar.ts:8**
```typescript
// Remove unused export or use it
export type StateTransformer = ... // Currently unused
```

**./src/types/simulation.ts**
```typescript
// Line 6: Remove or use
export type SimulationFrame = ...

// Line 8: Remove or use
export type EnergyComponents = ...
```

### Workers

**./src/workers/geometry-loader.worker.ts**
```typescript
// Line 114: Prefix unused param with _
function process(_features, ...) { // Renamed from 'features'

// Line 134: Prefix unused param with _
function process(coords, _atomIndex, ...) { // Renamed from 'atomIndex'

// Line 273: Remove or use
const instanceType = ... // Currently unused
```

**./src/workers/md-simulation.worker.ts**
```typescript
// Line 7: Remove unused import
import type { MDSimulationParams } from ...
// Remove: SimulationFrame, EnergyComponents
```

**./src/workers/pdb-parser.worker.ts**
```typescript
// Line 28: Remove unused type
type WorkerResponse = ... // Not used

// Lines 161, 175: Prefix unused params with _
function process(_data, ...) { // Renamed from 'data'
```

**./src/workers/cache-worker.ts:245**
```typescript
// Remove unused worker variable
const worker = ... // Not used
```

### Utilities

**./src/utils/sentry.ts**
```typescript
// Line 8: Remove unused import
import type { BrowserOptions } from ... // Not used

// Line 70: Prefix unused param with _
function captureUser(_user, ...) { // Renamed from 'user'
```

---

## TypeScript Any Types to Fix

### Pattern 1: Error Handlers
```typescript
// ❌ Before
} catch (error: any) {
  console.error(error);
}

// ✅ After
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Pattern 2: Event Handlers
```typescript
// ❌ Before
const handleClick = (e: any) => { ... }

// ✅ After
import type { MouseEvent } from 'react';
const handleClick = (e: MouseEvent<HTMLButtonElement>) => { ... }
```

### Pattern 3: Worker Messages
```typescript
// ❌ Before
self.onmessage = (e: any) => { ... }

// ✅ After
interface WorkerMessage {
  type: string;
  payload: unknown;
}
self.onmessage = (e: MessageEvent<WorkerMessage>) => { ... }
```

### Files with Any Types (Sample)
```
./src/app/api/learning/modules/[id]/route.ts:59,110,147
./src/app/api/learning/modules/route.ts:24,25,32,33,43,108
./src/app/api/learning/pathways/route.ts:35,112
./src/app/api/learning/progress/route.ts:53,130
./src/workers/cache-worker.ts:10,15,157
./src/workers/geometry-loader.worker.ts:19,34,112
./src/workers/md-simulation.worker.ts:13,18,65
```

---

## React Hooks Exhaustive Deps

### Pattern: Wrap Parent Callbacks in useCallback
```typescript
// In parent component:
const handleError = useCallback((error: Error) => {
  // handle error
}, []);

const handleLoadComplete = useCallback(() => {
  // handle completion
}, []);

// Pass to child
<ChildComponent
  onError={handleError}
  onLoadComplete={handleLoadComplete}
/>
```

### Files to Fix
```
./src/components/MolecularViewer.tsx:186,229
./src/components/admin/CacheWarmingPanel.tsx:175,186,205
./src/components/viewer/ControlsPanel.tsx:58,81
./src/components/viewer/CollaborativeViewer.tsx (multiple)
./src/components/simulation/BrowserSimulation.tsx (multiple)
```

---

## Accessibility Fixes

### Pattern 1: Interactive Divs
```typescript
// ❌ Before
<div onClick={handleClick}>Click me</div>

// ✅ After
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
  aria-label="Descriptive label"
>
  Click me
</div>
```

### Pattern 2: Form Labels
```typescript
// ❌ Before
<label>Name</label>
<input />

// ✅ After
<label htmlFor="name-input">Name</label>
<input id="name-input" />
```

### Files to Fix
```
./src/components/viewer/ExportPanel.tsx:190,384
./src/components/collaboration/CollaborationPanel.tsx:167,200
./src/components/collaboration/AnnotationTools.tsx:267
./src/components/jobs/JobSubmissionForm.tsx:243,310
./src/components/jobs/JobList.tsx:252
./src/components/ui/card.tsx (multiple)
./src/components/admin/CostDashboard.tsx (multiple)
```

---

## Other Fixes

### Unescaped Entities
```typescript
// ❌ Before
<p>Don't do this</p>

// ✅ After
<p>Don&apos;t do this</p>
// OR
<p>{"Don't do this"}</p>
```

**Files:**
```
./src/app/not-found.tsx:17
./src/components/admin/CostDashboard.tsx:254
./src/components/browse/StructureCard.tsx:124
```

---

## Files NOT to Fix (Console Statements)

**DO NOT remove console statements from these files yet:**
```
./src/app/api/pdb/[id]/route.ts
./src/app/jobs/page.tsx
./src/app/viewer/page.tsx
./src/components/MolecularViewer.tsx
./src/lib/cache/cache-service.ts
./src/lib/cache/indexeddb.ts
./src/lib/md-browser-dynamica.ts
./src/lib/md-browser.ts
./src/lib/performance-benchmark.ts
./src/services/cache-warming.ts
./src/services/job-queue.ts
./src/services/simulation-monitor.ts
./src/stores/slices/collaboration-slice.ts
./src/stores/slices/simulation-slice.ts
./src/utils/monitoring.ts
./src/utils/sentry.ts
```

---

## Automated Fix Scripts

### Remove Unused React Imports
```bash
# Use sed to remove unused React imports
find ./src -name "*.tsx" -exec sed -i "/^import React from 'react';$/d" {} \;
```

### Prefix Unused Variables with _
```bash
# Manual review required - cannot be fully automated
# Use your IDE's "Rename Symbol" feature
```

---

## Summary Checklist

- [ ] Fix 15 unused React imports (quick win)
- [ ] Fix React purity violation in simulation page
- [ ] Remove/implement unused handlers in collaboration components
- [ ] Add keyboard handlers for accessibility (3 files)
- [ ] Associate form labels with inputs (3 files)
- [ ] Fix React hooks dependencies (8 files)
- [ ] Replace any types with proper types (40+ files)
- [ ] Fix unescaped entities (3 files)
- [ ] Remove/prefix unused variables (58 files)
- [ ] **SKIP:** Console statements (separate task)

---

**Estimated Time:**
- Quick wins: 30 minutes
- Unused variables: 2-3 hours
- Type safety: 4-6 hours
- Accessibility: 2-3 hours
- React hooks: 1-2 hours

**Total:** 10-15 hours of manual work

---

**Report Location:** `/home/user/lab_visualizer/active-development/lab_visualizer/docs/manual-fixes-checklist.md`
