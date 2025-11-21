# Testing Guide - LAB Visualizer

## Overview

This document provides comprehensive guidance for testing the LAB Visualizer platform, including unit tests, integration tests, security tests, and end-to-end tests.

## Test Infrastructure

### Test Framework

- **Vitest**: Modern, fast test runner with ES modules support
- **@testing-library/react**: React component testing utilities
- **jsdom**: Browser environment simulation
- **Coverage**: v8 code coverage provider

### Test Organization

```
tests/
├── unit/                    # Unit tests for individual functions/classes
│   ├── cache-service.test.ts
│   ├── lod-manager.test.ts
│   └── pdb-parser.test.ts
├── integration/             # Integration tests for API and services
│   ├── api-endpoints.test.ts
│   ├── data-pipeline.test.ts
│   └── molstar-lod.test.ts
├── e2e/                     # End-to-end tests with Playwright
│   └── user-workflows.spec.ts
├── security/                # Security-focused tests
│   ├── auth-service.test.ts
│   ├── rate-limiter.test.ts
│   └── xss-sanitizer.test.ts
├── fixtures/                # Test data and mocks
├── components/              # Component tests
└── setup.ts                 # Global test configuration
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run tests/unit/cache-service.test.ts

# Run tests matching pattern
npx vitest run --grep "authentication"
```

### Coverage Thresholds

The project enforces minimum coverage thresholds:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 75%
- **Statements**: 80%

## Test Categories

### 1. Unit Tests

Test individual functions and classes in isolation.

**Example: Cache Service**

```typescript
describe('Cache Service', () => {
  it('should store items in cache', async () => {
    const key = 'test-key';
    const value = { data: 'test-data' };

    await cacheService.set(key, value);
    const retrieved = await cacheService.get(key);

    expect(retrieved).toEqual(value);
  });
});
```

**Best Practices:**
- Test one thing per test case
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions

### 2. Integration Tests

Test how multiple components work together.

**Example: API Endpoints**

```typescript
describe('PDB API', () => {
  it('should fetch structure by ID', async () => {
    const response = await fetch(`/api/pdb/1ABC`);
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.id).toBe('1ABC');
  });
});
```

**Best Practices:**
- Test actual data flows
- Use realistic test data
- Test error handling
- Verify response formats

### 3. Security Tests

Test authentication, authorization, and input validation.

**Example: Rate Limiting**

```typescript
describe('Rate Limiter', () => {
  it('should block requests exceeding limit', async () => {
    // Make requests up to limit
    for (let i = 0; i < maxRequests; i++) {
      await makeRequest();
    }

    // Next request should be blocked
    const response = await makeRequest();
    expect(response.status).toBe(429);
  });
});
```

**Security Test Areas:**
- Authentication flows
- Password security
- Rate limiting
- XSS prevention
- SQL injection prevention
- CSRF protection
- Session management

### 4. Component Tests

Test React components with user interactions.

**Example: Viewer Controls**

```typescript
describe('Viewer Controls', () => {
  it('should rotate structure on button click', async () => {
    const { getByRole } = render(<ViewerControls />);
    const rotateButton = getByRole('button', { name: /rotate/i });

    await userEvent.click(rotateButton);

    expect(mockRotate).toHaveBeenCalled();
  });
});
```

### 5. E2E Tests

Test complete user workflows with Playwright.

**Example: User Workflow**

```typescript
test('user can load and visualize structure', async ({ page }) => {
  await page.goto('/');
  await page.fill('[name="pdbId"]', '1ABC');
  await page.click('button:has-text("Load")');

  await expect(page.locator('.molstar-viewer')).toBeVisible();
});
```

## Test Patterns

### Arrange-Act-Assert (AAA)

```typescript
it('should calculate total price', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(30);
});
```

### Test Data Builders

```typescript
const buildUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  role: 'student',
  ...overrides,
});

it('should create admin user', () => {
  const admin = buildUser({ role: 'admin' });
  expect(admin.role).toBe('admin');
});
```

### Mocking

```typescript
// Mock module
vi.mock('@/services/pdb-service', () => ({
  PDBService: {
    fetchStructure: vi.fn(),
  },
}));

// Mock implementation
mockFetchStructure.mockResolvedValue({
  id: '1ABC',
  atoms: [],
});
```

## Browser API Mocks

The test setup includes comprehensive mocks for browser APIs:

### IndexedDB

```typescript
// Mocked in tests/setup.ts
const db = await indexedDB.open('test-db', 1);
// Works in tests without real IndexedDB
```

### WebGL

```typescript
// Mocked in tests/setup.ts
const gl = canvas.getContext('webgl');
// Returns mock WebGL context
```

### localStorage/sessionStorage

```typescript
// Mocked in tests/setup.ts
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
```

## Performance Testing

### Benchmarking

```typescript
it('should process 1000 items under 100ms', async () => {
  const items = generateItems(1000);

  const start = performance.now();
  await processItems(items);
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(100);
});
```

### Memory Testing

```typescript
it('should handle memory efficiently', () => {
  const initialMemory = process.memoryUsage().heapUsed;

  processLargeDataset();
  global.gc(); // Force garbage collection

  const finalMemory = process.memoryUsage().heapUsed;
  const increase = finalMemory - initialMemory;

  expect(increase).toBeLessThan(50 * 1024 * 1024); // <50MB
});
```

## Debugging Tests

### Debug Single Test

```bash
# Run with debugger
npx vitest run --inspect-brk tests/unit/cache-service.test.ts

# Then attach debugger from VS Code or Chrome DevTools
```

### Verbose Output

```bash
# Show console.log statements
npx vitest run --reporter=verbose

# Show full error stack traces
npx vitest run --reporter=verbose --no-coverage
```

### Test Isolation

```typescript
// Run only this test
it.only('should test specific behavior', () => {
  // ...
});

// Skip this test
it.skip('should test future behavior', () => {
  // ...
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test:coverage
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

## Common Issues

### Test Timeouts

```typescript
// Increase timeout for slow tests
it('should complete long operation', async () => {
  // ...
}, 30000); // 30 second timeout
```

### Async Issues

```typescript
// Always await async operations
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Mock Cleanup

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Best Practices

### DO

✅ Write tests first (TDD)
✅ Test behavior, not implementation
✅ Use descriptive test names
✅ Keep tests simple and focused
✅ Mock external dependencies
✅ Test error cases
✅ Maintain high coverage
✅ Run tests before commits

### DON'T

❌ Test implementation details
❌ Share state between tests
❌ Use real databases in unit tests
❌ Ignore failing tests
❌ Write tests without assertions
❌ Skip error case testing
❌ Commit without running tests

## Test Quality Metrics

### Fast Tests

- Unit tests: <100ms each
- Integration tests: <500ms each
- E2E tests: <5s each

### Isolated Tests

- No dependencies between tests
- Each test can run independently
- Tests run in any order

### Repeatable Tests

- Same results every time
- No flaky tests
- Deterministic behavior

### Self-Validating

- Clear pass/fail
- Meaningful error messages
- No manual verification needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## Current Test Status

### Summary (as of 2025-11-21)

- **Total Tests**: 357
- **Passing**: 312 (87%)
- **Failing**: 45 (13%)
- **Coverage**: Improving towards 75%+ target

### Passing Test Suites

✅ Browser simulation tests
✅ Cache warming tests
✅ LOD system tests
✅ MD engine tests
✅ PDB parser tests
✅ Authentication service (new)
✅ Cache service (new)
✅ LOD manager (new)
✅ API endpoints (new)

### Areas for Improvement

- Fix timeout issues in PDB service tests
- Improve Redis rate limiter mocking
- Add more edge case coverage
- Increase integration test coverage

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure tests pass locally
3. Maintain coverage thresholds
4. Update this guide as needed
5. Add examples for complex scenarios

---

Last updated: 2025-11-21
