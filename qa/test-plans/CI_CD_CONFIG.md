# CI/CD Test Integration Configuration

## Overview

This document defines the CI/CD pipeline integration for automated testing across all teams.

---

## 1. GitHub Actions Workflow

### Main Test Workflow (`.github/workflows/test.yml`)

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'
  CI: true

jobs:
  # ===========================================================================
  # Unit Tests
  # ===========================================================================
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unit-tests
          fail_ci_if_error: true

      - name: Archive test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: unit-test-results
          path: |
            coverage/
            test-results.json

  # ===========================================================================
  # Integration Tests
  # ===========================================================================
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test -- --testPathPattern="integration"

      - name: Archive results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: integration-test-results
          path: test-results.json

  # ===========================================================================
  # E2E Tests
  # ===========================================================================
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e -- --project=${{ matrix.browser }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/

  # ===========================================================================
  # Security Scan
  # ===========================================================================
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

      - name: Run security tests
        run: npm run test -- --testPathPattern="security"

  # ===========================================================================
  # Performance Tests
  # ===========================================================================
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [unit-tests]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run performance benchmarks
        run: npm run test -- --testPathPattern="performance"

      - name: Build application
        run: npm run build

      - name: Run Lighthouse audit
        run: npm run lighthouse:audit || true

  # ===========================================================================
  # Quality Gate
  # ===========================================================================
  quality-gate:
    name: Quality Gate
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, security-scan]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download unit test results
        uses: actions/download-artifact@v4
        with:
          name: unit-test-results
          path: coverage/

      - name: Check coverage thresholds
        run: |
          # Check if coverage meets thresholds
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "::error::Coverage ($COVERAGE%) is below threshold (80%)"
            exit 1
          fi

      - name: All checks passed
        run: echo "All quality gates passed!"
```

---

## 2. Pre-commit Hooks

### Husky Configuration (`.husky/pre-commit`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run affected tests
npm run test -- --changed --passWithNoTests
```

### Lint-staged Configuration (`package.json`)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{ts,tsx}": [
      "vitest related --run"
    ]
  }
}
```

---

## 3. Coverage Requirements

### Minimum Thresholds

| Metric | Minimum | Target |
|--------|---------|--------|
| Lines | 80% | 85% |
| Functions | 80% | 85% |
| Branches | 75% | 80% |
| Statements | 80% | 85% |

### Coverage by Team

| Team | Focus Area | Minimum Coverage |
|------|------------|------------------|
| Team 1 | Viewer Core | 85% |
| Team 2 | Collaboration | 80% |
| Team 3 | Learning | 80% |
| Shared | Utilities/Hooks | 90% |

---

## 4. Test Commands

### Quick Reference

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run CI tests (coverage + reporting)
npm run test:ci

# Run E2E tests
npm run test:e2e

# Run smoke tests only
npm run test:smoke

# Run specific test file
npm run test -- tests/unit/lod-manager.test.ts

# Run tests matching pattern
npm run test -- --testPathPattern="security"

# Run tests for changed files
npm run test -- --changed
```

---

## 5. Test Environments

### Development
- Local development with hot reload
- Uses mock data and services
- Coverage reports generated locally

### CI/CD
- Runs on GitHub Actions
- Uses production-like environment
- Generates artifacts and reports

### Staging
- Pre-production validation
- E2E tests against deployed application
- Performance benchmarking

---

## 6. Reporting

### Test Results
- **Location**: `test-results.json`
- **Format**: JSON (vitest)
- **Includes**: Pass/fail status, duration, errors

### Coverage Reports
- **HTML**: `coverage/index.html`
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info`

### E2E Reports
- **HTML**: `playwright-report/index.html`
- **JSON**: `playwright-report/results.json`
- **JUnit**: `playwright-report/junit.xml`

---

## 7. Parallel Test Execution

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // Isolate each test file
    isolate: true,
  },
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  // Run tests in parallel
  fullyParallel: true,
  // Number of workers
  workers: process.env.CI ? 1 : undefined,
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
});
```

---

## 8. Test Data Management

### Fixtures
- Location: `tests/fixtures/`
- Contains mock data for tests
- Versioned with codebase

### Test Database
- Uses in-memory database for integration tests
- Seeded before each test run
- Cleaned up after tests

### API Mocking
- MSW (Mock Service Worker) for API mocking
- Intercepts network requests
- Provides consistent test data

---

## 9. Failure Handling

### Test Failure Protocol

1. **Immediate**: Notify via GitHub Actions status
2. **Retry**: Auto-retry flaky tests (max 2 times)
3. **Report**: Generate failure report with screenshots
4. **Block**: Block merge until fixed

### Flaky Test Management

```typescript
// Mark test as potentially flaky
test.retry(2)('should handle race condition', async () => {
  // Test code
});
```

---

## 10. Performance Budgets

### Build Time
- Maximum build time: 5 minutes
- Maximum test time: 10 minutes

### Runtime
- First contentful paint: < 1.5s
- Time to interactive: < 3s
- Largest contentful paint: < 2.5s

---

## 11. Notifications

### GitHub Status Checks
- Required for merge to main
- Blocks PR if tests fail
- Shows coverage change

### Slack Integration (Optional)
```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: 'Tests failed on ${{ github.ref }}'
```

---

## 12. Maintenance

### Regular Tasks
- [ ] Weekly: Review flaky tests
- [ ] Monthly: Update test dependencies
- [ ] Quarterly: Review coverage thresholds

### Cleanup
- Remove obsolete tests
- Update outdated mocks
- Refactor duplicate test code
