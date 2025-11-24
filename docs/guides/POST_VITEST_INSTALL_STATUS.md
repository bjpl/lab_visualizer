# Post-Vitest Installation Status Report

**Date**: 2025-11-17
**Project**: Lab Visualizer
**Status**: ⚠️ Blockers Identified - Manual Intervention Required

---

## ✅ Successfully Completed

1. **Vitest Installation**
   - ✅ `vitest@4.0.10` installed
   - ✅ `@vitest/coverage-v8@4.0.10` installed
   - ✅ Configuration exists at `vitest.config.ts`
   - ✅ Test files found (19 test files)

2. **Project Structure**
   - ✅ TypeScript configuration
   - ✅ Comprehensive test suite
   - ✅ Supabase migrations ready
   - ✅ Complete molecular visualization platform

---

## 🚨 Critical Blockers

### 1. esbuild Version Conflict

**Issue**: Vitest and Vite are using different esbuild versions causing failures

```
Error: Cannot start service: Host version "0.25.12" does not match binary version "0.21.5"
```

**Root Cause**:
- `vite@5.4.21` depends on `esbuild@0.21.5`
- `vitest@4.0.10` → `vite@7.2.2` depends on `esbuild@0.25.12`
- WSL file locking prevents npm from resolving the conflict

**Resolution** (Run in PowerShell, NOT WSL):

```powershell
cd C:\Users\brand\Development\Project_Workspace\active-development\lab_visualizer

# Option 1: Reinstall node_modules in Windows
Remove-Item -Recurse -Force node_modules
npm install

# Option 2: Update vite to compatible version
npm install vite@^7.0.0 --save-dev --legacy-peer-deps
```

**Time Estimate**: 10 minutes

---

### 2. TypeScript Compilation Errors

**Issue**: 88 TypeScript errors in `tests/integration/collaboration-integration.test.ts`

**Sample Errors**:
```
tests/integration/collaboration-integration.test.ts(49,11): error TS1005: '>' expected.
tests/integration/collaboration-integration.test.ts(49,17): error TS1005: ',' expected.
```

**Root Cause**: JSX syntax issues in test file - TypeScript is not recognizing JSX properly

**Resolution**:

Check lines 49-52, 62-65, etc. The issue is with JSX rendering in tests. This typically means:
- Missing `@types/react` or version mismatch
- tsconfig.json not configured for JSX in tests
- Vitest config not loading JSX properly

**Action Required**:
1. Review `tsconfig.json` - ensure `"jsx": "react-jsx"` is set
2. Check test files are included in `tsconfig` compilation
3. Verify `@vitejs/plugin-react` is installed

**Time Estimate**: 15 minutes

---

### 3. Supabase CLI Not Installed

**Issue**: Cannot run `supabase db push` to apply RLS migrations

```
supabase : The term 'supabase' is not recognized
```

**Root Cause**: Supabase CLI must be installed via package manager, not npm

**Resolution** (Choose one method):

**Windows (PowerShell as Administrator)**:
```powershell
# Option 1: Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Option 2: Using Chocolatey
choco install supabase

# Option 3: Using npm (project-local)
npm install supabase --save-dev
npx supabase db push
```

**Linux/WSL**:
```bash
# Using APT (recommended for WSL)
wget -qO - https://github.com/supabase/cli/releases/download/v1.123.4/supabase_1.123.4_linux_amd64.deb
sudo dpkg -i supabase_1.123.4_linux_amd64.deb
```

**Documentation**: https://github.com/supabase/cli#install-the-cli

**Time Estimate**: 5 minutes

---

### 4. Security Vulnerabilities

**Issue**: 2 moderate severity vulnerabilities in esbuild

```
esbuild  <=0.24.2
Severity: moderate
```

**Resolution**: This will be automatically fixed when we resolve the esbuild version conflict (Blocker #1)

---

## 📋 Step-by-Step Recovery Plan

### Phase 1: Fix esbuild Conflict (PowerShell)

```powershell
# Run in PowerShell (NOT WSL)
cd C:\Users\brand\Development\Project_Workspace\active-development\lab_visualizer

# Clean reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Verify installation
npm test -- --version
```

### Phase 2: Fix TypeScript Errors

```bash
# Verify tsconfig includes test files
cat tsconfig.json

# If needed, update tsconfig.json to include:
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}

# Rebuild
npm run build
```

### Phase 3: Install Supabase CLI

```powershell
# PowerShell as Administrator
scoop install supabase

# Or use local npx
npm install supabase --save-dev
```

### Phase 4: Apply Database Migration

```bash
# After Supabase CLI is installed
supabase db push

# Or using npx
npx supabase db push
```

### Phase 5: Run Tests

```bash
npm test
npm run test:coverage
```

### Phase 6: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## 🎯 Quick Action Summary

**For Immediate Progress** (Run these commands in order):

```powershell
# 1. PowerShell - Fix esbuild
cd C:\Users\brand\Development\Project_Workspace\active-development\lab_visualizer
Remove-Item -Recurse -Force node_modules
npm install

# 2. PowerShell - Install Supabase CLI
scoop install supabase

# 3. WSL - Apply migration
cd /mnt/c/Users/brand/Development/Project_Workspace/active-development/lab_visualizer
supabase db push

# 4. WSL - Run tests
npm test

# 5. WSL - Deploy
vercel --prod
```

**Total Time Estimate**: 30-40 minutes

---

## 📊 Current Test Suite Status

```
Test Files Found: 19
├── Integration Tests: 7
│   ├── collaboration-viewer.test.ts
│   ├── collaboration-integration.test.ts ⚠️ (Has TS errors)
│   ├── data-pipeline.test.ts
│   ├── export-functionality.test.ts
│   ├── molstar-lod.test.ts
│   ├── performance-benchmarks.test.ts
│   └── simulation-worker.test.ts
├── Service Tests: 4
│   ├── learning-content.test.ts
│   ├── md-simulation.test.ts
│   ├── molstar-lod-bridge.test.ts
│   └── pdb-service.test.ts
└── Unit Tests: 8
    ├── browser-simulation.test.ts
    ├── cache-warming.test.ts
    ├── lod-system.test.ts
    ├── md-engine.test.ts
    ├── molstar-service.test.ts
    ├── pdb-fetcher.test.ts
    └── pdb-parser.test.ts
```

**E2E Tests**: 1 (user-workflows.spec.ts)

---

## 🔧 Alternative: Skip Tests and Deploy Now

If you want to deploy immediately without fixing tests:

```bash
# Update package.json to skip failing tests temporarily
# Change "build" script to skip tsc check
npm run build -- --skipLibCheck

# Deploy with warnings
vercel --prod
```

**⚠️ Note**: This is NOT recommended for production. Tests exist for a reason!

---

## 📚 Related Documentation

- [Sprint 3 Final Report](./SPRINT_3_FINAL_REPORT.md)
- [Test Coverage Plan](./testing/test-coverage-plan.md)
- [Deployment Guide](./deployment/)
- [RLS Policies](../supabase/migrations/20250117_md_simulation_schema.sql)

---

## 🆘 Getting Help

If these steps don't work:

1. Check WSL vs Windows file permissions
2. Verify Node.js version: `node --version` (Should be v16+)
3. Check npm version: `npm --version` (Should be v8+)
4. Review full error logs in `/home/brand/.npm/_logs/`
5. Open an issue with full error output

---

**Next Steps**: Start with Phase 1 in PowerShell to resolve the esbuild conflict.
