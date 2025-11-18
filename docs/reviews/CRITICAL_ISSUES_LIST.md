# Critical Issues - Sprint 3 Code Review
## Immediate Action Required

**Review Date**: 2025-11-17
**Status**: 🔴 BLOCKERS PREVENTING DEPLOYMENT

---

## 🔴 BLOCKERS (Must Fix Before Any Deployment)

### 1. TypeScript Build Failure
**File**: `src/hooks/useToast.ts`
**Error**: JSX syntax in TypeScript file
**Impact**: Application cannot build
**Fix Time**: 2 hours

**Solution**:
```bash
# Option 1: Rename file
mv src/hooks/useToast.ts src/hooks/useToast.tsx

# Option 2: Extract component
# Move ToastContainer and ToastItem to src/components/ui/toast.tsx
```

**Lines Affected**: 138-190

---

### 2. Test Infrastructure Broken
**Error**: `vitest: not found`
**Impact**: Cannot run tests, no quality verification
**Fix Time**: 30 minutes

**Solution**:
```bash
npm install --save-dev vitest @vitest/coverage-v8
npm run test
```

---

### 3. Missing Database Security (RLS Policies)
**File**: `supabase/migrations/20250117000001_collaboration_rls.sql` (NOT FOUND)
**Impact**: HIGH SECURITY RISK - Collaboration sessions unprotected
**Fix Time**: 4 hours

**Required Tables**:
- collaboration_sessions
- session_users
- annotations
- activity_log

**Template**:
```sql
-- Enable RLS
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

-- Owner can manage their sessions
CREATE POLICY "session_owner_all"
ON collaboration_sessions
FOR ALL
TO authenticated
USING (owner_id = auth.uid());

-- Participants can view sessions they're part of
CREATE POLICY "session_participant_view"
ON collaboration_sessions
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT session_id FROM session_users WHERE user_id = auth.uid()
  )
);
```

---

## 🟡 HIGH PRIORITY (Fix This Week)

### 4. ESLint Violations (100+ errors)

**Breakdown**:
- Import ordering: 45 violations
- Type imports: 20 violations
- Accessibility: 6 violations (keyboard handlers)
- Console statements: 35 violations
- Unused variables: 12 violations

**Auto-fixable**: 80%

**Commands**:
```bash
# Auto-fix formatting
npm run lint -- --fix

# Check remaining
npm run lint
```

**Manual Fixes Required**:

**Accessibility** (6 violations):
```tsx
// ❌ src/components/admin/CostDashboard.tsx:188, 382
<div onClick={handleClick}>

// ✅ Fix
<button onClick={handleClick} aria-label="Description" type="button">
```

```tsx
// ❌ src/components/collaboration/AnnotationTools.tsx:265
<div onClick={handleSelect}>

// ✅ Fix
<button onClick={handleSelect} onKeyDown={handleKeyDown} role="button">
```

---

### 5. Type Safety Violations (45+ any types)

**Critical Files**:

**app/jobs/page.tsx** (Lines 29, 39, 40, 88):
```typescript
// ❌ Current
const [jobs, setJobs] = useState<any[]>([]);
const handleSubmit = (data: any) => { };

// ✅ Fix
interface Job {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'md_simulation' | 'analysis';
  createdAt: string;
  // ... other fields
}

interface JobSubmission {
  structureId: string;
  simulationType: string;
  parameters: SimulationParams;
}

const [jobs, setJobs] = useState<Job[]>([]);
const handleSubmit = (data: JobSubmission) => { };
```

**components/MolecularViewer.tsx** (Line 54):
```typescript
// ❌ Current
const handleError = (error: any) => { };

// ✅ Fix
const handleError = (error: Error | PDBError) => { };
```

---

### 6. React Hooks Violations

**components/MolecularViewer.tsx** (Lines 184, 227):
```typescript
// ❌ Current
useEffect(() => {
  if (structureId) {
    loadStructureById(structureId);
  }
}, [structureId]); // Missing dependencies

// ✅ Fix
const loadStructureByIdCallback = useCallback(() => {
  if (structureId) {
    loadStructureById(structureId);
  }
}, [structureId, loadStructureById, lodBridge, onError]);

useEffect(() => {
  loadStructureByIdCallback();
}, [loadStructureByIdCallback]);
```

---

## 🟠 MEDIUM PRIORITY (Address This Sprint)

### 7. Security Vulnerabilities

**XSS Risk** (src/hooks/useToast.tsx:175):
```tsx
// ❌ Unsanitized user content
<div className="font-medium">{toast.title}</div>
<div className="text-sm">{toast.message}</div>

// ✅ Sanitize or validate
import DOMPurify from 'isomorphic-dompurify';

<div className="font-medium">
  {DOMPurify.sanitize(toast.title)}
</div>
```

**CSRF Protection Missing** (app/api/pdb/upload/route.ts):
```typescript
// Add CSRF token validation for state-changing operations
import { validateCsrfToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  await validateCsrfToken(request);
  // ... rest of handler
}
```

---

### 8. Integration Inconsistencies

**Complexity Calculation Mismatch**:

**pdb-service.ts:325**:
```typescript
const estimatedVertices = atoms.length * 50 + metadata.residueCount * 10;
```

**lod-manager.ts:139**:
```typescript
const estimatedVertices = atomCount * (hasSurfaces ? 50 : 20);
```

**Solution**: Centralize in `lib/complexity-analyzer.ts`:
```typescript
export function calculateComplexity(
  atoms: Atom[],
  metadata: StructureMetadata
): StructureComplexity {
  // Single source of truth for complexity calculations
  const hasSurfaces = detectSurfaces(atoms);
  const verticesPerAtom = hasSurfaces ? 50 : 20;
  const estimatedVertices = atoms.length * verticesPerAtom;

  return { /* ... */ };
}
```

---

### 9. Console Statement Cleanup (35 violations)

**Most Critical Files**:
- app/viewer/page.tsx: 9 statements
- components/MolecularViewer.tsx: 2 statements
- services/molstar-lod-bridge.ts: Production logging (line 343)

**Solution**: Create `src/utils/logger.ts`:
```typescript
export const logger = {
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },

  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data);
  },

  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service
    if (typeof window !== 'undefined') {
      // Sentry.captureException(error);
    }
  },

  performance: (label: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  }
};
```

**Replace all console.* calls**:
```typescript
// ❌ Before
console.log('Loading structure:', structureId);
console.error('Failed to load:', error);

// ✅ After
logger.debug('Loading structure', { structureId });
logger.error('Failed to load structure', error);
```

---

## 📊 Issue Summary

| Priority | Count | Est. Hours | Status |
|----------|-------|------------|--------|
| 🔴 Blocker | 3 | 6.5 | NOT STARTED |
| 🟡 High | 6 | 21 | NOT STARTED |
| 🟠 Medium | 3 | 8 | NOT STARTED |
| **TOTAL** | **12** | **35.5** | **0% Complete** |

---

## 🎯 Recommended Fix Order

### Day 1 (8 hours) - BLOCKERS
1. ✅ Fix TypeScript build (2h)
   - Rename useToast.ts → useToast.tsx
   - Verify build: `npm run build`

2. ✅ Install tests (0.5h)
   - `npm install vitest @vitest/coverage-v8`
   - Run: `npm test`

3. ✅ Implement RLS (4h)
   - Create migration file
   - Define policies for 4 tables
   - Test with different user roles

4. ✅ Auto-fix ESLint (1h)
   - Run `npm run lint -- --fix`
   - Commit import ordering fixes

### Day 2 (8 hours) - HIGH PRIORITY
5. ✅ Manual ESLint fixes (4h)
   - Fix 6 accessibility violations
   - Add keyboard handlers
   - Add ARIA labels

6. ✅ Type safety (4h)
   - Define Job, JobSubmission interfaces
   - Replace all `any` types
   - Verify with `npx tsc --noEmit`

### Day 3 (8 hours) - HIGH PRIORITY CONT.
7. ✅ React hooks fixes (3h)
   - Add missing dependencies
   - Wrap callbacks in useCallback
   - Test components

8. ✅ Security fixes (3h)
   - Add XSS sanitization
   - Implement CSRF protection
   - Review input validation

9. ✅ Logger implementation (2h)
   - Create logger utility
   - Replace console statements
   - Test in dev/prod modes

### Day 4 (4 hours) - MEDIUM PRIORITY
10. ✅ Centralize complexity logic (2h)
    - Create complexity-analyzer.ts
    - Update PDB service & LOD manager
    - Add unit tests

11. ✅ Documentation (2h)
    - Update INTEGRATION_STATUS.md
    - Document RLS policies
    - Create TROUBLESHOOTING.md

---

## ✅ Validation Checklist

Before marking as complete:

**Build & Tests**:
- [ ] `npm run build` succeeds with 0 errors
- [ ] `npm run test` passes all tests
- [ ] `npm run lint` shows 0 errors, <5 warnings
- [ ] `npx tsc --noEmit` shows 0 type errors

**Security**:
- [ ] RLS policies created for all 4 tables
- [ ] RLS policies tested with different user roles
- [ ] XSS sanitization verified
- [ ] CSRF protection tested

**Code Quality**:
- [ ] No `any` types in new code
- [ ] All accessibility violations fixed
- [ ] React hooks violations resolved
- [ ] Console statements replaced with logger

**Integration**:
- [ ] Complexity calculations consistent
- [ ] LOD ↔ MolStar integration verified
- [ ] Collaboration ↔ Viewer tested
- [ ] PDB ↔ LOD pipeline validated

---

## 🆘 Need Help?

**TypeScript Build Issues**:
- Check `tsconfig.json` jsx setting
- Verify file extensions (.ts vs .tsx)
- Clear build cache: `rm -rf .next`

**Test Failures**:
- Check test configuration in `vitest.config.ts`
- Verify all mocks are up to date
- Run single test: `npm test -- <filename>`

**RLS Policy Testing**:
```sql
-- Test as owner
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'owner-user-id';
SELECT * FROM collaboration_sessions;

-- Test as participant
SET LOCAL request.jwt.claims.sub TO 'participant-user-id';
SELECT * FROM collaboration_sessions; -- Should only see sessions they're part of
```

---

**Created**: 2025-11-17
**Updated**: 2025-11-17
**Status**: 🔴 ACTIVE - BLOCKERS PRESENT
**Next Review**: After Day 1 blockers are resolved
