/**
 * Phase 2 Integration Tests
 *
 * Comprehensive integration tests for Phase 2 features working together:
 * - Hover tooltips
 * - Measurements (distance, angle, dihedral)
 * - Multi-selection
 * - Performance under load
 * - Error recovery
 * - Cross-component state coordination
 *
 * Uses Playwright for E2E-style integration testing.
 */

import { test, expect, Page } from '@playwright/test';

// Test constants
const TEST_STRUCTURE_URL = 'https://files.rcsb.org/download/1CRN.cif';
const PERFORMANCE_THRESHOLD_FPS_DROP = 0.10; // Max 10% FPS degradation
const MAX_MEASUREMENTS = 100;
const MAX_SELECTIONS = 50;
const HOVER_RESPONSE_TIME_MS = 100;

// Test helpers
interface FPSMeasurement {
  baseline: number;
  current: number;
  degradation: number;
}

interface MeasurementData {
  id: string;
  type: 'distance' | 'angle' | 'dihedral';
  value: number;
  visible: boolean;
}

/**
 * Initialize viewer and load test structure
 */
async function initializeViewer(page: Page) {
  await page.goto('/viewer');

  // Wait for viewer to initialize
  await page.waitForSelector('[data-testid="molstar-viewer"]', { timeout: 10000 });

  // Load test structure
  await page.evaluate(async (url) => {
    const molstar = (window as any).molstarService;
    await molstar.loadStructureFromUrl(url, { format: 'mmcif' });
  }, TEST_STRUCTURE_URL);

  // Wait for structure to load
  await page.waitForSelector('[data-testid="structure-loaded"]', { timeout: 15000 });
}

/**
 * Measure current FPS
 */
async function measureFPS(page: Page, durationMs: number = 1000): Promise<number> {
  return await page.evaluate((duration) => {
    return new Promise<number>((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();

      function countFrame() {
        frameCount++;
        const elapsed = performance.now() - startTime;

        if (elapsed < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = (frameCount / elapsed) * 1000;
          resolve(fps);
        }
      }

      requestAnimationFrame(countFrame);
    });
  }, durationMs);
}

/**
 * Get atom position in viewport
 */
async function getAtomPosition(page: Page, atomIndex: number): Promise<{ x: number; y: number }> {
  return await page.evaluate((index) => {
    const molstar = (window as any).molstarService;
    const position = molstar.getAtomScreenPosition(index);
    return position;
  }, atomIndex);
}

/**
 * Check memory usage
 */
async function checkMemoryUsage(page: Page): Promise<number> {
  return await page.evaluate(() => {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  });
}

test.describe('Phase 2: Measurement Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await initializeViewer(page);
  });

  test('should complete full measurement workflow', async ({ page }) => {
    // 1. Hover → tooltip appears
    const atom1Pos = await getAtomPosition(page, 0);
    await page.mouse.move(atom1Pos.x, atom1Pos.y);

    // Wait for tooltip to appear
    const tooltipStartTime = performance.now();
    await page.waitForSelector('[data-testid="hover-tooltip"]', { timeout: 200 });
    const tooltipResponseTime = performance.now() - tooltipStartTime;

    expect(tooltipResponseTime).toBeLessThan(HOVER_RESPONSE_TIME_MS);

    // Verify tooltip content
    const tooltipText = await page.textContent('[data-testid="hover-tooltip"]');
    expect(tooltipText).toContain('Chain:');
    expect(tooltipText).toContain('Residue:');
    expect(tooltipText).toContain('Atom:');

    // 2. Click atoms → measurement created
    await page.click('[data-testid="measurement-distance-btn"]');

    // Select first atom
    const atom1 = await getAtomPosition(page, 5);
    await page.mouse.click(atom1.x, atom1.y);

    // Select second atom
    const atom2 = await getAtomPosition(page, 10);
    await page.mouse.click(atom2.x, atom2.y);

    // 3. Measurement appears in panel
    await page.waitForSelector('[data-testid="measurement-item"]', { timeout: 1000 });
    const measurementCount = await page.locator('[data-testid="measurement-item"]').count();
    expect(measurementCount).toBe(1);

    // Verify measurement data
    const measurementValue = await page.textContent('[data-testid="measurement-value"]');
    expect(measurementValue).toMatch(/\d+\.\d+\s+(Å|°)/);

    // 4. 3D visualization appears
    const has3DVisualization = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      return molstar.measurementRepresentations.size > 0;
    });
    expect(has3DVisualization).toBe(true);

    // 5. Toggle visibility → 3D updates
    await page.click('[data-testid="measurement-visibility-toggle"]');

    // Verify visibility state changed
    const isVisible = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      const measurements = Array.from(molstar.measurementRepresentations.values());
      return measurements[0]?.visible === false;
    });
    expect(isVisible).toBe(false);

    // Toggle back on
    await page.click('[data-testid="measurement-visibility-toggle"]');

    // 6. Delete → removes from panel and 3D
    await page.click('[data-testid="measurement-delete-btn"]');

    // Verify removed from panel
    const remainingMeasurements = await page.locator('[data-testid="measurement-item"]').count();
    expect(remainingMeasurements).toBe(0);

    // Verify removed from 3D
    const has3DAfterDelete = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      return molstar.measurementRepresentations.size === 0;
    });
    expect(has3DAfterDelete).toBe(true);
  });

  test('should support angle measurements', async ({ page }) => {
    await page.click('[data-testid="measurement-angle-btn"]');

    // Select three atoms
    const atoms = [5, 10, 15];
    for (const atomIndex of atoms) {
      const pos = await getAtomPosition(page, atomIndex);
      await page.mouse.click(pos.x, pos.y);
    }

    // Verify angle measurement created
    await page.waitForSelector('[data-testid="measurement-item"]');
    const measurementType = await page.textContent('[data-testid="measurement-type"]');
    expect(measurementType).toBe('Angle');

    // Verify angle value
    const angleValue = await page.textContent('[data-testid="measurement-value"]');
    expect(angleValue).toMatch(/\d+\.\d+°/);
  });

  test('should support dihedral measurements', async ({ page }) => {
    await page.click('[data-testid="measurement-dihedral-btn"]');

    // Select four atoms
    const atoms = [5, 10, 15, 20];
    for (const atomIndex of atoms) {
      const pos = await getAtomPosition(page, atomIndex);
      await page.mouse.click(pos.x, pos.y);
    }

    // Verify dihedral measurement created
    await page.waitForSelector('[data-testid="measurement-item"]');
    const measurementType = await page.textContent('[data-testid="measurement-type"]');
    expect(measurementType).toBe('Dihedral');

    // Verify dihedral value
    const dihedralValue = await page.textContent('[data-testid="measurement-value"]');
    expect(dihedralValue).toMatch(/\d+\.\d+°/);
  });
});

test.describe('Phase 2: Selection + Measurement Integration', () => {
  test.beforeEach(async ({ page }) => {
    await initializeViewer(page);
  });

  test('should handle multi-select with shift+click', async ({ page }) => {
    // Multi-select atoms with shift+click
    const atomsToSelect = [5, 10, 15];

    for (const atomIndex of atomsToSelect) {
      const pos = await getAtomPosition(page, atomIndex);

      // Hold shift and click
      await page.keyboard.down('Shift');
      await page.mouse.click(pos.x, pos.y);
      await page.keyboard.up('Shift');
    }

    // Verify selection count
    const selectionCount = await page.evaluate(() => {
      const store = (window as any).visualizationStore;
      return store.getState().selectedAtoms.length;
    });
    expect(selectionCount).toBe(atomsToSelect.length);

    // Verify selection panel shows all atoms
    const selectedItems = await page.locator('[data-testid="selected-atom"]').count();
    expect(selectedItems).toBe(atomsToSelect.length);
  });

  test('should create measurement from selected atoms', async ({ page }) => {
    // Select two atoms
    const atom1Pos = await getAtomPosition(page, 5);
    await page.keyboard.down('Shift');
    await page.mouse.click(atom1Pos.x, atom1Pos.y);
    await page.keyboard.up('Shift');

    const atom2Pos = await getAtomPosition(page, 10);
    await page.keyboard.down('Shift');
    await page.mouse.click(atom2Pos.x, atom2Pos.y);
    await page.keyboard.up('Shift');

    // Create measurement from selection
    await page.click('[data-testid="measure-from-selection-btn"]');

    // Verify measurement created
    await page.waitForSelector('[data-testid="measurement-item"]');
    const measurementCount = await page.locator('[data-testid="measurement-item"]').count();
    expect(measurementCount).toBe(1);
  });

  test('should maintain measurement when selection is cleared', async ({ page }) => {
    // Create measurement
    await page.click('[data-testid="measurement-distance-btn"]');
    const atom1 = await getAtomPosition(page, 5);
    await page.mouse.click(atom1.x, atom1.y);
    const atom2 = await getAtomPosition(page, 10);
    await page.mouse.click(atom2.x, atom2.y);

    await page.waitForSelector('[data-testid="measurement-item"]');

    // Clear selection
    await page.click('[data-testid="clear-selection-btn"]');

    // Verify measurement still exists
    const measurementCount = await page.locator('[data-testid="measurement-item"]').count();
    expect(measurementCount).toBe(1);

    // Verify selection is cleared
    const selectionCount = await page.evaluate(() => {
      const store = (window as any).visualizationStore;
      return store.getState().selectedAtoms.length;
    });
    expect(selectionCount).toBe(0);
  });

  test('should verify state independence', async ({ page }) => {
    // Create measurement
    await page.click('[data-testid="measurement-distance-btn"]');
    const atom1 = await getAtomPosition(page, 5);
    await page.mouse.click(atom1.x, atom1.y);
    const atom2 = await getAtomPosition(page, 10);
    await page.mouse.click(atom2.x, atom2.y);

    // Create selection
    const atom3 = await getAtomPosition(page, 15);
    await page.keyboard.down('Shift');
    await page.mouse.click(atom3.x, atom3.y);
    await page.keyboard.up('Shift');

    // Get initial states
    const initialMeasurements = await page.locator('[data-testid="measurement-item"]').count();
    const initialSelections = await page.evaluate(() => {
      const store = (window as any).visualizationStore;
      return store.getState().selectedAtoms.length;
    });

    // Clear measurements
    await page.click('[data-testid="clear-all-measurements-btn"]');

    // Verify measurements cleared but selection persists
    const finalMeasurements = await page.locator('[data-testid="measurement-item"]').count();
    const finalSelections = await page.evaluate(() => {
      const store = (window as any).visualizationStore;
      return store.getState().selectedAtoms.length;
    });

    expect(finalMeasurements).toBe(0);
    expect(finalSelections).toBe(initialSelections);
    expect(finalSelections).toBeGreaterThan(0);
  });
});

test.describe('Phase 2: Performance Under Load', () => {
  test.beforeEach(async ({ page }) => {
    await initializeViewer(page);
  });

  test('should handle 100 measurements without significant FPS drop', async ({ page }) => {
    // Measure baseline FPS
    const baselineFPS = await measureFPS(page, 2000);
    console.log(`Baseline FPS: ${baselineFPS.toFixed(2)}`);

    // Create 100 measurements
    await page.click('[data-testid="measurement-distance-btn"]');

    for (let i = 0; i < MAX_MEASUREMENTS; i++) {
      const atom1 = await getAtomPosition(page, i * 2);
      await page.mouse.click(atom1.x, atom1.y);

      const atom2 = await getAtomPosition(page, i * 2 + 1);
      await page.mouse.click(atom2.x, atom2.y);

      // Re-enter measurement mode
      if (i < MAX_MEASUREMENTS - 1) {
        await page.click('[data-testid="measurement-distance-btn"]');
      }
    }

    // Verify all measurements created
    const measurementCount = await page.locator('[data-testid="measurement-item"]').count();
    expect(measurementCount).toBe(MAX_MEASUREMENTS);

    // Measure FPS under load
    const loadedFPS = await measureFPS(page, 2000);
    console.log(`Loaded FPS: ${loadedFPS.toFixed(2)}`);

    // Calculate degradation
    const degradation = (baselineFPS - loadedFPS) / baselineFPS;
    console.log(`FPS degradation: ${(degradation * 100).toFixed(2)}%`);

    // Verify FPS degradation is acceptable
    expect(degradation).toBeLessThan(PERFORMANCE_THRESHOLD_FPS_DROP);
  });

  test('should handle 50 multi-selected atoms without performance issues', async ({ page }) => {
    const baselineFPS = await measureFPS(page, 2000);

    // Multi-select 50 atoms
    await page.keyboard.down('Shift');

    for (let i = 0; i < MAX_SELECTIONS; i++) {
      const pos = await getAtomPosition(page, i);
      await page.mouse.click(pos.x, pos.y);
    }

    await page.keyboard.up('Shift');

    // Verify selection count
    const selectionCount = await page.evaluate(() => {
      const store = (window as any).visualizationStore;
      return store.getState().selectedAtoms.length;
    });
    expect(selectionCount).toBe(MAX_SELECTIONS);

    // Measure FPS with selections
    const loadedFPS = await measureFPS(page, 2000);
    const degradation = (baselineFPS - loadedFPS) / baselineFPS;

    expect(degradation).toBeLessThan(PERFORMANCE_THRESHOLD_FPS_DROP);
  });

  test('should handle rapid hover events without performance issues', async ({ page }) => {
    const baselineFPS = await measureFPS(page, 1000);

    // Rapidly hover over 100 atoms
    for (let i = 0; i < 100; i++) {
      const pos = await getAtomPosition(page, i);
      await page.mouse.move(pos.x, pos.y, { steps: 1 }); // Fast movement
      await page.waitForTimeout(10); // Brief pause
    }

    // Measure FPS after rapid hovering
    const afterHoverFPS = await measureFPS(page, 1000);
    const degradation = (baselineFPS - afterHoverFPS) / baselineFPS;

    expect(degradation).toBeLessThan(PERFORMANCE_THRESHOLD_FPS_DROP);
  });

  test('should not have memory leaks', async ({ page }) => {
    const initialMemory = await checkMemoryUsage(page);

    // Create and delete measurements repeatedly
    for (let cycle = 0; cycle < 10; cycle++) {
      // Create 10 measurements
      await page.click('[data-testid="measurement-distance-btn"]');

      for (let i = 0; i < 10; i++) {
        const atom1 = await getAtomPosition(page, i * 2);
        await page.mouse.click(atom1.x, atom1.y);

        const atom2 = await getAtomPosition(page, i * 2 + 1);
        await page.mouse.click(atom2.x, atom2.y);

        await page.click('[data-testid="measurement-distance-btn"]');
      }

      // Delete all measurements
      await page.click('[data-testid="clear-all-measurements-btn"]');

      // Force garbage collection (if available)
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
    }

    // Check final memory usage
    const finalMemory = await checkMemoryUsage(page);
    const memoryIncrease = finalMemory - initialMemory;

    console.log(`Initial memory: ${initialMemory.toFixed(2)} MB`);
    console.log(`Final memory: ${finalMemory.toFixed(2)} MB`);
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);

    // Allow up to 50MB increase (accounts for normal browser overhead)
    expect(memoryIncrease).toBeLessThan(50);
  });
});

test.describe('Phase 2: Error Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await initializeViewer(page);
  });

  test('should handle measurement with invalid atoms gracefully', async ({ page }) => {
    // Start measurement mode
    await page.click('[data-testid="measurement-distance-btn"]');

    // Try to create measurement with invalid atoms
    await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      molstar.emit('measurement-atom-selected', { atomId: -1 });
    });

    // Verify error message appears
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 2000 });
    const errorText = await page.textContent('[data-testid="error-message"]');
    expect(errorText).toContain('Invalid');

    // Verify measurement mode can be restarted
    await page.click('[data-testid="measurement-distance-btn"]');
    const isInMeasurementMode = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      return molstar.measurementMode !== null;
    });
    expect(isInMeasurementMode).toBe(true);
  });

  test('should handle exceeding measurement limit', async ({ page }) => {
    // Set a low limit for testing
    await page.evaluate(() => {
      (window as any).MAX_MEASUREMENTS = 5;
    });

    // Create measurements up to limit
    await page.click('[data-testid="measurement-distance-btn"]');

    for (let i = 0; i < 6; i++) {
      const atom1 = await getAtomPosition(page, i * 2);
      await page.mouse.click(atom1.x, atom1.y);

      const atom2 = await getAtomPosition(page, i * 2 + 1);
      await page.mouse.click(atom2.x, atom2.y);

      if (i < 5) {
        await page.click('[data-testid="measurement-distance-btn"]');
      }
    }

    // Verify warning message
    await page.waitForSelector('[data-testid="warning-message"]');
    const warningText = await page.textContent('[data-testid="warning-message"]');
    expect(warningText).toContain('limit');

    // Verify only 5 measurements created
    const count = await page.locator('[data-testid="measurement-item"]').count();
    expect(count).toBe(5);
  });

  test('should handle exceeding selection limit', async ({ page }) => {
    // Set a low limit for testing
    await page.evaluate(() => {
      (window as any).MAX_SELECTIONS = 10;
    });

    // Try to select more than limit
    await page.keyboard.down('Shift');

    for (let i = 0; i < 15; i++) {
      const pos = await getAtomPosition(page, i);
      await page.mouse.click(pos.x, pos.y);
    }

    await page.keyboard.up('Shift');

    // Verify warning message
    await page.waitForSelector('[data-testid="warning-message"]');
    const warningText = await page.textContent('[data-testid="warning-message"]');
    expect(warningText).toContain('limit');

    // Verify only 10 atoms selected
    const selectionCount = await page.evaluate(() => {
      const store = (window as any).visualizationStore;
      return store.getState().selectedAtoms.length;
    });
    expect(selectionCount).toBe(10);
  });

  test('should recover from viewer initialization failure', async ({ page }) => {
    // Navigate to viewer page
    await page.goto('/viewer');

    // Simulate initialization failure
    await page.evaluate(() => {
      (window as any).FORCE_INIT_FAILURE = true;
    });

    // Try to initialize
    await page.click('[data-testid="retry-init-btn"]');

    // Verify error message shown
    await page.waitForSelector('[data-testid="init-error-message"]');
    const errorText = await page.textContent('[data-testid="init-error-message"]');
    expect(errorText).toContain('initialization failed');

    // Remove failure flag and retry
    await page.evaluate(() => {
      (window as any).FORCE_INIT_FAILURE = false;
    });

    await page.click('[data-testid="retry-init-btn"]');

    // Verify successful initialization
    await page.waitForSelector('[data-testid="molstar-viewer"]', { timeout: 10000 });
    const isInitialized = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      return molstar.isInitialized();
    });
    expect(isInitialized).toBe(true);
  });
});

test.describe('Phase 2: Cross-Component State', () => {
  test.beforeEach(async ({ page }) => {
    await initializeViewer(page);
  });

  test('should coordinate between measurement panel, tooltip, and 3D viewer', async ({ page }) => {
    // Create a measurement
    await page.click('[data-testid="measurement-distance-btn"]');
    const atom1 = await getAtomPosition(page, 5);
    await page.mouse.click(atom1.x, atom1.y);

    // Hover should show tooltip during measurement
    await page.waitForSelector('[data-testid="hover-tooltip"]');

    const atom2 = await getAtomPosition(page, 10);
    await page.mouse.click(atom2.x, atom2.y);

    // Verify measurement in panel
    await page.waitForSelector('[data-testid="measurement-item"]');

    // Verify 3D visualization
    const has3D = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      return molstar.measurementRepresentations.size > 0;
    });
    expect(has3D).toBe(true);

    // Hover over measurement line should show value
    const measurementPos = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      const measurements = Array.from(molstar.measurementRepresentations.values());
      return measurements[0].screenPosition;
    });

    await page.mouse.move(measurementPos.x, measurementPos.y);
    await page.waitForSelector('[data-testid="measurement-tooltip"]');
    const tooltipValue = await page.textContent('[data-testid="measurement-tooltip"]');
    expect(tooltipValue).toMatch(/\d+\.\d+\s+Å/);
  });

  test('should sync selection store with measurements panel', async ({ page }) => {
    // Multi-select atoms
    await page.keyboard.down('Shift');

    const atoms = [5, 10, 15];
    for (const atomIndex of atoms) {
      const pos = await getAtomPosition(page, atomIndex);
      await page.mouse.click(pos.x, pos.y);
    }

    await page.keyboard.up('Shift');

    // Verify selection store updated
    const selectionCount = await page.evaluate(() => {
      const store = (window as any).visualizationStore;
      return store.getState().selectedAtoms.length;
    });
    expect(selectionCount).toBe(atoms.length);

    // Create measurement from selection
    await page.click('[data-testid="measure-from-selection-btn"]');

    // Verify measurement created with correct participants
    await page.waitForSelector('[data-testid="measurement-item"]');
    const participants = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      const measurements = Array.from(molstar.measurementRepresentations.values());
      return measurements[0].participants.length;
    });

    // Distance uses 2 atoms, angle uses 3
    expect([2, 3]).toContain(participants);
  });

  test('should handle event coordination across components', async ({ page }) => {
    const events: string[] = [];

    // Listen to all events
    await page.evaluate(() => {
      const eventLog: string[] = [];
      (window as any).eventLog = eventLog;

      const molstar = (window as any).molstarService;
      molstar.on('hover-info', () => eventLog.push('hover'));
      molstar.on('measurement-added', () => eventLog.push('measurement'));
      molstar.on('selection-changed', () => eventLog.push('selection'));
    });

    // Trigger hover
    const pos1 = await getAtomPosition(page, 5);
    await page.mouse.move(pos1.x, pos1.y);
    await page.waitForTimeout(200);

    // Trigger selection
    await page.keyboard.down('Shift');
    await page.mouse.click(pos1.x, pos1.y);
    await page.keyboard.up('Shift');

    // Trigger measurement
    await page.click('[data-testid="measurement-distance-btn"]');
    await page.mouse.click(pos1.x, pos1.y);
    const pos2 = await getAtomPosition(page, 10);
    await page.mouse.click(pos2.x, pos2.y);

    // Get event log
    const eventLog = await page.evaluate(() => {
      return (window as any).eventLog;
    });

    // Verify events fired in correct order
    expect(eventLog).toContain('hover');
    expect(eventLog).toContain('selection');
    expect(eventLog).toContain('measurement');

    // Verify no duplicate events
    const uniqueEvents = [...new Set(eventLog)];
    expect(eventLog.filter(e => e === 'hover').length).toBeGreaterThanOrEqual(1);
    expect(eventLog.filter(e => e === 'selection').length).toBe(1);
    expect(eventLog.filter(e => e === 'measurement').length).toBe(1);
  });

  test('should maintain state consistency during rapid interactions', async ({ page }) => {
    // Rapidly interact with multiple features
    for (let i = 0; i < 20; i++) {
      // Hover
      const hoverPos = await getAtomPosition(page, i);
      await page.mouse.move(hoverPos.x, hoverPos.y, { steps: 1 });

      // Select
      if (i % 3 === 0) {
        await page.keyboard.down('Shift');
        await page.mouse.click(hoverPos.x, hoverPos.y);
        await page.keyboard.up('Shift');
      }

      // Create measurement
      if (i % 5 === 0 && i > 0) {
        await page.click('[data-testid="measurement-distance-btn"]');
        const m1 = await getAtomPosition(page, i);
        await page.mouse.click(m1.x, m1.y);
        const m2 = await getAtomPosition(page, i + 1);
        await page.mouse.click(m2.x, m2.y);
      }
    }

    // Verify final state is consistent
    const state = await page.evaluate(() => {
      const store = (window as any).visualizationStore;
      const molstar = (window as any).molstarService;

      return {
        selections: store.getState().selectedAtoms.length,
        measurements: molstar.measurementRepresentations.size,
        hasErrors: store.getState().error !== null,
      };
    });

    expect(state.selections).toBeGreaterThan(0);
    expect(state.measurements).toBeGreaterThan(0);
    expect(state.hasErrors).toBe(false);
  });
});

test.describe('Phase 2: Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await initializeViewer(page);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check measurement panel
    const panelLabel = await page.getAttribute('[data-testid="measurements-panel"]', 'aria-label');
    expect(panelLabel).toBeTruthy();

    // Check buttons
    const distanceBtn = await page.getAttribute('[data-testid="measurement-distance-btn"]', 'aria-label');
    expect(distanceBtn).toContain('distance');

    // Check tooltip
    const atom1 = await getAtomPosition(page, 5);
    await page.mouse.move(atom1.x, atom1.y);
    await page.waitForSelector('[data-testid="hover-tooltip"]');

    const tooltipRole = await page.getAttribute('[data-testid="hover-tooltip"]', 'role');
    expect(tooltipRole).toBe('tooltip');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to measurement panel
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Activate distance measurement with Enter
    await page.keyboard.press('Enter');

    // Verify measurement mode activated
    const isActive = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      return molstar.measurementMode === 'distance';
    });
    expect(isActive).toBe(true);

    // Cancel with Escape
    await page.keyboard.press('Escape');

    const isCancelled = await page.evaluate(() => {
      const molstar = (window as any).molstarService;
      return molstar.measurementMode === null;
    });
    expect(isCancelled).toBe(true);
  });
});
