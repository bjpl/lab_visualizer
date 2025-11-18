# Upgrade Roadmap - lab_visualizer
**Generated:** 2025-11-17
**Project:** LAB Visualizer
**Current State:** Next.js 14.2.33, React 18.3.1, Vite 5.4.21

---

## Executive Summary

This roadmap outlines the phased approach to upgrading lab_visualizer dependencies, addressing security vulnerabilities, and modernizing the tech stack.

### Priority Overview
- 🔴 **CRITICAL:** Vite security vulnerability
- 🟡 **HIGH:** React 19 and Next.js 15/16 features
- 🟢 **MEDIUM:** ESLint and tooling updates
- 🔵 **LOW:** Type definition updates

### Total Estimated Timeline: 4-6 weeks
### Required Testing: Comprehensive regression testing after each phase

---

## Phase 1: Security & Foundation (Week 1)
**Status:** 🔴 CRITICAL - Start Immediately

### Objectives
1. Fix security vulnerabilities
2. Establish version management
3. Align package.json with project needs

### Tasks

#### 1.1 Security Fix - Vite Upgrade
**Priority:** CRITICAL
**Effort:** 1-2 days

```bash
# Upgrade Vite
npm install vite@7.2.2 --save-dev

# Update related dependencies
npm install @vitejs/plugin-react@latest --save-dev
```

**Breaking Changes:**
- Plugin API changes
- Build configuration updates
- Dev server improvements

**Testing Checklist:**
- [ ] Development server starts
- [ ] Hot Module Replacement works
- [ ] Production build succeeds
- [ ] Build artifacts are correct
- [ ] No console errors
- [ ] All tests pass

**Files to Review:**
- `vitest.config.ts`
- `package.json` (build scripts)
- Development workflow

#### 1.2 Node.js Version Management
**Priority:** HIGH
**Effort:** 30 minutes

```bash
# Create .nvmrc
echo "20" > .nvmrc

# Verify
nvm use
node --version  # Should show v20.x.x
```

**Update package.json:**
```json
{
  "engines": {
    "node": ">=20.0.0 <21.0.0",
    "npm": ">=10.0.0"
  }
}
```

**Update CI/CD:**
- Verify GitHub Actions uses Node 20
- Add .nvmrc usage in workflows
- Document in README

#### 1.3 Fix Build Scripts
**Priority:** MEDIUM
**Effort:** 1 hour

**Current (Incorrect):**
```json
{
  "dev": "vite",
  "build": "tsc && vite build"
}
```

**Updated (Correct for Next.js):**
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit"
}
```

### Success Criteria
- ✅ No security vulnerabilities
- ✅ .nvmrc file present
- ✅ Engines field in package.json
- ✅ Build scripts use Next.js
- ✅ All tests passing
- ✅ Development workflow functional

---

## Phase 2: Tooling Modernization (Week 2-3)
**Status:** 🟡 HIGH Priority

### Objectives
1. Update ESLint to v9
2. Update TypeScript ESLint
3. Modernize development tooling

### Tasks

#### 2.1 ESLint 9 Migration
**Effort:** 2-3 days

**Current:** ESLint 8.57.1
**Target:** ESLint 9.39.1

**Major Change:** Flat config format required

**Migration Steps:**

1. **Install ESLint 9**
```bash
npm install eslint@9 --save-dev
```

2. **Convert to Flat Config**

Create `eslint.config.js`:
```javascript
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      '@next/next': next
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
];
```

3. **Remove old config**
```bash
rm .eslintrc.json
rm .eslintrc.cjs
```

**Testing:**
```bash
npm run lint
npm run lint -- --fix
```

#### 2.2 TypeScript ESLint Update
**Effort:** 1 day

```bash
npm install @typescript-eslint/eslint-plugin@8 --save-dev
npm install @typescript-eslint/parser@8 --save-dev
```

**Review New Rules:**
- Check for new recommended rules
- Review deprecated rules
- Update custom rules

#### 2.3 IDE Configuration
**Effort:** 1-2 hours

**Create `.vscode/settings.json`:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

**Create `.vscode/extensions.json`:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright"
  ]
}
```

**Create `.editorconfig`:**
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,jsx,ts,tsx,json,css,md}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

#### 2.4 Update Type Definitions
**Effort:** 30 minutes

```bash
npm install @types/node@24 --save-dev
# Note: Wait for React 19 before updating @types/react
```

### Success Criteria
- ✅ ESLint 9 with flat config
- ✅ TypeScript ESLint v8
- ✅ IDE configurations committed
- ✅ All linting passes
- ✅ Team onboarded to new setup

---

## Phase 3: React Ecosystem Upgrade (Week 3-5)
**Status:** 🟡 HIGH Priority - Complex Migration

### Objectives
1. Upgrade to Next.js 15
2. Upgrade to React 19
3. Upgrade to Next.js 16 (latest)

### Pre-requisites
- ✅ Phase 1 complete
- ✅ Phase 2 complete
- ✅ All tests passing
- ✅ Full test coverage

### Tasks

#### 3.1 Next.js 14 → 15 Migration
**Effort:** 3-5 days
**Risk:** HIGH

**Review Breaking Changes:**
1. Read [Next.js 15 upgrade guide](https://nextjs.org/docs/upgrade-guide)
2. Check for deprecated APIs
3. Review codebase for affected patterns

**Key Changes to Address:**
- App Router updates
- Server Actions improvements
- Caching behavior changes
- TypeScript improvements

**Migration Steps:**

1. **Update Next.js**
```bash
npm install next@15 --save
```

2. **Update Related Packages**
```bash
npm install react@19 react-dom@19 --save
npm install @types/react@19 @types/react-dom@19 --save-dev
```

3. **Code Updates**

Check for:
- `async` Server Components (now required)
- Dynamic rendering opt-ins
- Server Action changes
- Metadata API updates
- Image component updates

4. **Configuration Updates**

Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Review and update experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '2mb',
    }
  }
};

export default nextConfig;
```

**Testing Checklist:**
- [ ] Development server starts
- [ ] All pages render correctly
- [ ] Server Actions work
- [ ] API routes functional
- [ ] Authentication flows work
- [ ] 3D viewer loads
- [ ] Collaboration features work
- [ ] Job queue functions
- [ ] E2E tests pass
- [ ] Performance metrics acceptable

#### 3.2 React 19 Features Integration
**Effort:** 2-3 days

**New Features to Explore:**

1. **React Compiler (Optional)**
```javascript
// next.config.js
experimental: {
  reactCompiler: true
}
```

2. **New Hooks**
```typescript
// useActionState (replacement for useFormState)
const [state, formAction] = useActionState(action, initialState);

// useFormStatus
const { pending, data, method, action } = useFormStatus();

// useOptimistic (enhanced)
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);
```

3. **Server Components Enhancements**
- Better streaming
- Improved error handling
- Enhanced data fetching

**Migration Tasks:**
- [ ] Review all forms for useFormState → useActionState
- [ ] Consider adding React Compiler
- [ ] Test Server Components
- [ ] Update error boundaries
- [ ] Test Suspense boundaries

#### 3.3 Next.js 15 → 16 Migration
**Effort:** 2-3 days
**Risk:** MEDIUM

**Steps:**

1. **Review Next.js 16 Changes**
   - Read changelog
   - Check breaking changes
   - Review new features

2. **Update**
```bash
npm install next@16 --save
```

3. **Test Thoroughly**
   - Full regression test suite
   - Performance benchmarks
   - Lighthouse scores
   - Accessibility audit

### Success Criteria
- ✅ Next.js 16 running
- ✅ React 19 features working
- ✅ All tests passing
- ✅ No console errors/warnings
- ✅ Performance maintained or improved
- ✅ Lighthouse scores ≥90

---

## Phase 4: Continuous Improvement (Ongoing)
**Status:** 🔵 LOW Priority - Quality of Life

### Objectives
1. Establish maintenance schedule
2. Add tooling enhancements
3. Improve developer experience

### Tasks

#### 4.1 Package Manager Evaluation
**Effort:** 1-2 days (POC)

**Evaluate pnpm:**

**Pros:**
- 50-70% disk space savings
- 2-3x faster installs
- Stricter dependency resolution
- Better monorepo support

**Cons:**
- Team learning curve
- CI/CD updates required
- Potential compatibility issues

**POC Steps:**
```bash
# Install pnpm
npm install -g pnpm

# Import existing lock file
pnpm import

# Test
pnpm install
pnpm dev
pnpm build
pnpm test
```

**Decision Criteria:**
- Team approval
- Build time improvement
- Compatibility verified
- CI/CD updated successfully

#### 4.2 Maintenance Schedule
**Establish:**

**Weekly:**
- Check for security advisories
- Review dependabot PRs

**Monthly:**
- Run `npm outdated`
- Update patch versions
- Review and update dev dependencies

**Quarterly:**
- Evaluate major version updates
- Review and update tooling
- Audit dependencies

**Annually:**
- Full dependency audit
- Framework migration planning
- Tech stack review

#### 4.3 Documentation
**Create/Update:**

1. **DEPENDENCY_MANAGEMENT.md**
   - Update procedures
   - Testing requirements
   - Rollback procedures

2. **DEVELOPMENT_SETUP.md**
   - Environment setup
   - IDE configuration
   - Common issues

3. **CONTRIBUTING.md**
   - Coding standards
   - PR process
   - Testing requirements

---

## Risk Mitigation

### High-Risk Items
1. **React 19 Migration**
   - Risk: Breaking changes in components
   - Mitigation: Comprehensive test coverage
   - Rollback: Keep React 18 branch

2. **Next.js 15/16 Migration**
   - Risk: App Router changes
   - Mitigation: Incremental migration, feature flags
   - Rollback: Version control, staging environment

### Testing Strategy

**Per Phase:**
1. Unit tests (Vitest)
2. Integration tests
3. E2E tests (Playwright)
4. Manual testing
5. Performance testing
6. Accessibility testing

**Regression Testing:**
- Full test suite after each phase
- Visual regression testing
- Cross-browser testing
- Mobile testing

### Rollback Procedures

**For Each Phase:**
1. Create git branch before starting
2. Tag stable versions
3. Document rollback steps
4. Keep previous version in package.json comments

**Example:**
```json
{
  "dependencies": {
    "next": "16.0.3"
    // "next": "14.2.33" // Previous stable version
  }
}
```

---

## Success Metrics

### Technical Metrics
- [ ] Zero security vulnerabilities
- [ ] All packages on supported versions
- [ ] Test coverage maintained/improved
- [ ] Build times ≤ baseline
- [ ] Lighthouse scores ≥ 90

### Developer Experience
- [ ] Setup time ≤ 10 minutes
- [ ] Clear documentation
- [ ] IDE integration working
- [ ] Fast feedback loops

### Code Quality
- [ ] ESLint passing
- [ ] TypeScript strict mode
- [ ] No console errors
- [ ] Accessibility maintained

---

## Timeline Summary

| Phase | Duration | Priority | Risk |
|-------|----------|----------|------|
| Phase 1: Security & Foundation | Week 1 | CRITICAL | LOW |
| Phase 2: Tooling | Week 2-3 | HIGH | MEDIUM |
| Phase 3: React Ecosystem | Week 3-5 | HIGH | HIGH |
| Phase 4: Continuous | Ongoing | LOW | LOW |

**Total Estimated Time:** 4-6 weeks
**Recommended Approach:** Sequential phases with full testing between each

---

## Communication Plan

### Stakeholders
1. Development team
2. QA team
3. Product management
4. DevOps/Infrastructure

### Updates
- **Daily:** Standups during active phases
- **Weekly:** Progress reports
- **Per Phase:** Completion reports

### Documentation
- Update CHANGELOG.md
- Document breaking changes
- Update README.md
- Create migration guides

---

**Document Owner:** Architecture Team
**Last Updated:** 2025-11-17
**Next Review:** After Phase 1 completion
