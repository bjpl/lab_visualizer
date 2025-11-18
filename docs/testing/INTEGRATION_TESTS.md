# Integration Testing Strategy

## Overview

The LAB Visualization Platform uses a comprehensive integration testing strategy that validates the interaction between major system components. This document outlines our testing approach, patterns, and best practices.

## Test Architecture

### Test Pyramid

```
         /\
        /E2E\          <- Playwright (User workflows)
       /------\
      / Integr.\       <- Vitest (Component integration)
     /----------\
    /    Unit     \    <- Vitest (Individual functions)
   /--------------\
```

### Testing Layers

1. **Unit Tests** (`tests/*.test.ts`)
   - LOD Manager logic
   - Quality Manager settings
   - Performance Profiler calculations
   - Collaboration state management

2. **Integration Tests** (`tests/integration/*.test.ts`)
   - MolStar + LOD integration
   - Collaboration + Viewer state sync
   - PDB data pipeline end-to-end
   - Export functionality
   - Performance benchmarks

3. **E2E Tests** (`e2e/*.spec.ts`)
   - Complete user workflows
   - Cross-browser compatibility
   - Mobile responsiveness
   - Accessibility compliance

## Integration Test Suites

### 1. MolStar + LOD Integration (`molstar-lod.test.ts`)

**Purpose**: Validate progressive loading and LOD system integration with MolStar viewer.

**Key Tests**:
- Progressive loading workflow
- Atom filtering per LOD level
- Memory budget enforcement
- Stage callback triggers
- Load cancellation

**Example**:
```typescript
it('should load structure progressively', async () => {
  await molstarService.initialize(container);
  const lodManager = new LODManager({}, 512);

  const mockStructure = {
    atoms: generateMockAtoms(1000),
    atomCount: 1000,
    // ...
  };

  const results = await lodManager.loadProgressive(
    mockStructure,
    mockRenderer,
    LODLevel.FULL
  );

  expect(results.length).toBeGreaterThan(0);
  expect(results[0].success).toBe(true);
});
```

### 2. Collaboration + Viewer Sync (`collaboration-viewer.test.ts`)

**Purpose**: Test real-time collaboration features with viewer state synchronization.

**Key Tests**:
- Session creation and joining
- Camera synchronization between users
- Annotation real-time updates
- User presence tracking
- Activity logging

**Example**:
```typescript
it('should sync camera between users', async () => {
  cameraSync.initialize('user-1');
  cameraSync.setLeader(true);

  const state: CameraState = {
    position: [5, 5, 10],
    target: [0, 0, 0],
    zoom: 2,
    rotation: [0, 0, 0],
  };

  await cameraSync.broadcastCameraUpdate(state);
  // Verify followers receive update
});
```

### 3. PDB Data Pipeline (`data-pipeline.test.ts`)

**Purpose**: Validate complete data flow from PDB fetch to rendering.

**Key Tests**:
- Single PDB fetch and render
- Parallel fetching
- Source fallback on failure
- Search integration
- Cache integration
- Progress tracking

**Example**:
```typescript
it('should fetch and load PDB', async () => {
  const result = await fetchPDB('1ABC', {
    source: 'rcsb',
    format: 'pdb',
  });

  await molstarService.initialize(container);
  const metadata = await molstarService.loadStructure(
    result.content
  );

  expect(metadata).toBeDefined();
});
```

### 4. Export Functionality (`export-functionality.test.ts`)

**Purpose**: Test all export capabilities including images, sessions, and performance data.

**Key Tests**:
- PNG/JPG image export
- Multiple resolutions
- Camera state export
- Performance metrics export
- Session state export
- Bulk export operations

**Example**:
```typescript
it('should export as PNG', async () => {
  await molstarService.initialize(container);
  await molstarService.loadStructure(mockPDBData);

  const blob = await molstarService.exportImage({
    format: 'png',
    width: 1920,
    height: 1080,
  });

  expect(blob).toBeInstanceOf(Blob);
  expect(blob.type).toBe('image/png');
});
```

### 5. Performance Benchmarks (`performance-benchmarks.test.ts`)

**Purpose**: Validate system performance under various load conditions.

**Key Tests**:
- Frame rate benchmarks (target: 60fps small, 30fps large)
- Memory usage tracking
- Load time measurements
- Throughput testing
- Bottleneck detection
- Stress tests

**Example**:
```typescript
it('should maintain 60fps with small structures', async () => {
  profiler.startRecording();

  for (let i = 0; i < 120; i++) {
    profiler.startFrame();
    await simulateFrame(16); // 60fps
    profiler.endFrame(5, 1000);
  }

  const report = profiler.generateReport();
  expect(report.summary.avgFPS).toBeGreaterThan(50);
});
```

## Test Fixtures

### Mock PDB Data (`tests/fixtures/mock-pdb-data.ts`)

Provides realistic test data:
- `SMALL_PROTEIN_PDB` - 16 atoms, single chain
- `generateLargePDB(count)` - Generate large structures
- `generateMockAtoms(count, options)` - Programmatic atom generation
- `MOCK_SEARCH_RESULTS` - Search result fixtures

## Running Tests

### All Tests
```bash
npm test
```

### Integration Tests Only
```bash
npm test tests/integration
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

### Specific Browser
```bash
npx playwright test --project=chromium
```

## Best Practices

### 1. Test Isolation
- Each test creates its own container
- Cleanup after each test
- Reset stores before each test
- Mock external dependencies

```typescript
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  useCollaborationStore.getState().reset();
});

afterEach(() => {
  molstarService.dispose();
  document.body.removeChild(container);
});
```

### 2. Async Handling
- Use `async/await` for all asynchronous operations
- Set appropriate timeouts for long-running tests
- Wait for specific conditions, not arbitrary timeouts

```typescript
// Good
await page.waitForSelector('.structure-loaded', { timeout: 10000 });

// Avoid
await page.waitForTimeout(5000);
```

### 3. Error Testing
- Test both success and failure paths
- Verify error messages are user-friendly
- Test recovery mechanisms

```typescript
it('should handle fetch errors', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));

  await expect(
    fetchPDB('INVALID')
  ).rejects.toThrow();
});
```

### 4. Performance Tests
- Set realistic thresholds
- Use longer timeouts for performance tests
- Test both best-case and worst-case scenarios

```typescript
it('should handle large structures', async () => {
  const largeStructure = generateLargePDB(50000);
  // Test with appropriate timeouts
}, 15000); // 15 second timeout
```

## Coverage Requirements

- **Lines**: >80%
- **Functions**: >80%
- **Branches**: >75%
- **Statements**: >80%

### Coverage Reports
```bash
npm run test:coverage
```

Reports generated in:
- Terminal: Text summary
- `coverage/index.html`: Interactive HTML report
- `coverage/lcov.info`: LCOV format for CI

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Nightly builds

### GitHub Actions Workflow
```yaml
- name: Run tests
  run: |
    npm test
    npm run test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Debugging Tests

### Enable Debug Logs
```bash
DEBUG=* npm test
```

### VS Code Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run"],
  "console": "integratedTerminal"
}
```

### Playwright Debug Mode
```bash
npx playwright test --debug
```

## Known Issues and Limitations

1. **Canvas Export**: Requires canvas mocking in Node environment
2. **WebGL**: Limited support in headless browsers
3. **Performance**: CI runners may have slower performance than local

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement mutation testing
- [ ] Add performance regression detection
- [ ] Expand mobile device testing
- [ ] Add network condition simulation

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
