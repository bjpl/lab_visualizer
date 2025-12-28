/**
 * Selection Performance Tests (TDD RED Phase)
 *
 * These tests define performance requirements for the multi-selection system.
 * Tests measure latency, throughput, memory usage, and scalability.
 *
 * All tests should FAIL initially until implementation meets performance targets.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Type definitions
interface AtomSelection {
  atomId: string;
  chainId: string;
  residueNumber: number;
  residueName: string;
  atomName: string;
  position: { x: number; y: number; z: number };
  timestamp: number;
}

interface UseMultiSelectionReturn {
  selections: AtomSelection[];
  addSelection: (selection: AtomSelection) => void;
  removeSelection: (atomId: string) => void;
  clearSelections: () => void;
  isSelected: (atomId: string) => boolean;
}

interface PerformanceMetrics {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  memoryUsed: number;
}

describe('Selection Performance', () => {
  // Mock hook - should fail until performance targets are met
  const useMultiSelection = (): UseMultiSelectionReturn => {
    throw new Error('useMultiSelection not implemented');
  };

  // Helper to create test atom
  const createAtom = (id: number): AtomSelection => ({
    atomId: `atom-${id}`,
    chainId: String.fromCharCode(65 + (id % 26)), // A-Z rotation
    residueNumber: id,
    residueName: ['ALA', 'GLY', 'VAL', 'LEU'][id % 4],
    atomName: 'CA',
    position: {
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
    },
    timestamp: Date.now() + id,
  });

  // Helper to measure operation latency
  const measureLatency = async (operation: () => void): Promise<number> => {
    const start = performance.now();
    await act(async () => {
      operation();
    });
    return performance.now() - start;
  };

  // Helper to calculate statistics
  const calculateStats = (values: number[]): PerformanceMetrics => {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      averageLatency: sum / sorted.length,
      p95Latency: sorted[Math.floor(sorted.length * 0.95)],
      p99Latency: sorted[Math.floor(sorted.length * 0.99)],
      throughput: 1000 / (sum / sorted.length), // ops per second
      memoryUsed: 0, // Will be measured separately
    };
  };

  beforeEach(() => {
    // Clear any cached data
    vi.clearAllMocks();
    if (global.gc) {
      global.gc();
    }
  });

  describe('latency requirements', () => {
    it('should complete single selection operation in <100ms', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const atom = createAtom(1);
      const latency = await measureLatency(() => {
        result.current.addSelection(atom);
      });

      expect(latency).toBeLessThan(100);
    });

    it('should maintain <50ms average latency for 1000 operations', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const latencies: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const atom = createAtom(i);
        const latency = await measureLatency(() => {
          result.current.addSelection(atom);
        });
        latencies.push(latency);
      }

      const stats = calculateStats(latencies);
      expect(stats.averageLatency).toBeLessThan(50);
    });

    it('should maintain <100ms p95 latency under load', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const latencies: number[] = [];

      // Simulate high load with rapid operations
      for (let i = 0; i < 1000; i++) {
        const atom = createAtom(i);
        const latency = await measureLatency(() => {
          if (i % 2 === 0) {
            result.current.addSelection(atom);
          } else {
            result.current.removeSelection(`atom-${i - 1}`);
          }
        });
        latencies.push(latency);
      }

      const stats = calculateStats(latencies);
      expect(stats.p95Latency).toBeLessThan(100);
    });

    it('should maintain <200ms p99 latency under load', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const latencies: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const atom = createAtom(i);
        const latency = await measureLatency(() => {
          result.current.addSelection(atom);
        });
        latencies.push(latency);
      }

      const stats = calculateStats(latencies);
      expect(stats.p99Latency).toBeLessThan(200);
    });

    it('should complete clear operation in <50ms even with 1000 selections', async () => {
      const { result } = renderHook(() => useMultiSelection());

      // Add 1000 selections
      await act(async () => {
        for (let i = 0; i < 1000; i++) {
          result.current.addSelection(createAtom(i));
        }
      });

      const latency = await measureLatency(() => {
        result.current.clearSelections();
      });

      expect(latency).toBeLessThan(50);
    });
  });

  describe('throughput requirements', () => {
    it('should handle 1000 selections without lag', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const startTime = performance.now();

      await act(async () => {
        for (let i = 0; i < 1000; i++) {
          result.current.addSelection(createAtom(i));
        }
      });

      const totalTime = performance.now() - startTime;

      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 1000 operations
      expect(result.current.selections).toHaveLength(1000);
    });

    it('should achieve >100 operations per second', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const operationCount = 1000;
      const latencies: number[] = [];

      for (let i = 0; i < operationCount; i++) {
        const atom = createAtom(i);
        const latency = await measureLatency(() => {
          result.current.addSelection(atom);
        });
        latencies.push(latency);
      }

      const stats = calculateStats(latencies);
      expect(stats.throughput).toBeGreaterThan(100);
    });

    it('should handle rapid add/remove cycles efficiently', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const startTime = performance.now();

      await act(async () => {
        for (let cycle = 0; cycle < 100; cycle++) {
          // Add 10 atoms
          for (let i = 0; i < 10; i++) {
            result.current.addSelection(createAtom(cycle * 10 + i));
          }

          // Remove 5 atoms
          for (let i = 0; i < 5; i++) {
            result.current.removeSelection(`atom-${cycle * 10 + i}`);
          }
        }
      });

      const totalTime = performance.now() - startTime;

      // 100 cycles * 15 operations = 1500 operations
      expect(totalTime).toBeLessThan(3000); // Should complete in <3 seconds
    });
  });

  describe('batch operation efficiency', () => {
    it('should batch selection updates efficiently', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const atoms = Array.from({ length: 100 }, (_, i) => createAtom(i));

      // Mock re-render counter
      let renderCount = 0;
      const { result: testResult } = renderHook(() => {
        renderCount++;
        return useMultiSelection();
      });

      const initialRenderCount = renderCount;

      await act(async () => {
        atoms.forEach((atom) => testResult.current.addSelection(atom));
      });

      // Should batch updates and not cause 100 re-renders
      expect(renderCount - initialRenderCount).toBeLessThan(10);
    });

    it('should optimize bulk clear operations', async () => {
      const { result } = renderHook(() => useMultiSelection());

      // Add many selections
      await act(async () => {
        for (let i = 0; i < 1000; i++) {
          result.current.addSelection(createAtom(i));
        }
      });

      const clearLatency = await measureLatency(() => {
        result.current.clearSelections();
      });

      // Clearing should be O(1) or O(log n), not O(n)
      expect(clearLatency).toBeLessThan(10);
    });

    it('should use efficient data structures for lookup', async () => {
      const { result } = renderHook(() => useMultiSelection());

      // Add 10,000 selections
      await act(async () => {
        for (let i = 0; i < 10000; i++) {
          result.current.addSelection(createAtom(i));
        }
      });

      const lookupLatencies: number[] = [];

      // Test lookup performance
      for (let i = 0; i < 1000; i++) {
        const atomId = `atom-${Math.floor(Math.random() * 10000)}`;
        const latency = await measureLatency(() => {
          result.current.isSelected(atomId);
        });
        lookupLatencies.push(latency);
      }

      const stats = calculateStats(lookupLatencies);

      // Lookups should be O(1) or O(log n), averaging <1ms
      expect(stats.averageLatency).toBeLessThan(1);
    });
  });

  describe('memory management', () => {
    it('should not cause memory leaks with repeated selections', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const getMemoryUsage = () => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      };

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = getMemoryUsage();

      // Perform many cycles of add/clear
      for (let cycle = 0; cycle < 100; cycle++) {
        await act(async () => {
          for (let i = 0; i < 100; i++) {
            result.current.addSelection(createAtom(i));
          }
          result.current.clearSelections();
        });
      }

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const finalMemory = getMemoryUsage();
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be minimal (<10MB)
      if (performance.memory) {
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
      }
    });

    it('should efficiently manage large selection sets', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const getMemoryUsage = () => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      };

      const memoryBefore = getMemoryUsage();

      await act(async () => {
        for (let i = 0; i < 10000; i++) {
          result.current.addSelection(createAtom(i));
        }
      });

      const memoryAfter = getMemoryUsage();
      const memoryUsed = memoryAfter - memoryBefore;

      // Each selection should use reasonable memory
      // Assuming ~200 bytes per selection, 10,000 selections = ~2MB
      if (performance.memory) {
        expect(memoryUsed).toBeLessThan(5 * 1024 * 1024); // <5MB
      }
    });

    it('should release memory on selection removal', async () => {
      const { result } = renderHook(() => useMultiSelection());

      // Add selections
      await act(async () => {
        for (let i = 0; i < 1000; i++) {
          result.current.addSelection(createAtom(i));
        }
      });

      if (global.gc) {
        global.gc();
      }

      const memoryWithSelections = performance.memory?.usedJSHeapSize || 0;

      // Clear all selections
      await act(async () => {
        result.current.clearSelections();
      });

      if (global.gc) {
        global.gc();
      }

      const memoryAfterClear = performance.memory?.usedJSHeapSize || 0;

      // Memory should decrease significantly
      if (performance.memory) {
        expect(memoryAfterClear).toBeLessThan(memoryWithSelections);
      }
    });
  });

  describe('scalability', () => {
    it('should scale linearly with selection count', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const measureTimeForN = async (n: number): Promise<number> => {
        const start = performance.now();
        await act(async () => {
          for (let i = 0; i < n; i++) {
            result.current.addSelection(createAtom(i));
          }
        });
        return performance.now() - start;
      };

      const time100 = await measureTimeForN(100);

      // Clear and measure for 1000
      await act(async () => {
        result.current.clearSelections();
      });

      const time1000 = await measureTimeForN(1000);

      // Time for 1000 should be roughly 10x time for 100 (linear scaling)
      // Allow 50% tolerance for variance
      const expectedTime = time100 * 10;
      expect(time1000).toBeLessThan(expectedTime * 1.5);
      expect(time1000).toBeGreaterThan(expectedTime * 0.5);
    });

    it('should handle edge case of single selection efficiently', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const latency = await measureLatency(() => {
        result.current.addSelection(createAtom(1));
      });

      expect(latency).toBeLessThan(10); // Should be very fast
    });

    it('should handle maximum selection scenario', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const maxSelections = 100000;
      const startTime = performance.now();

      await act(async () => {
        for (let i = 0; i < maxSelections; i++) {
          result.current.addSelection(createAtom(i));
        }
      });

      const totalTime = performance.now() - startTime;

      // Should handle 100k selections in reasonable time
      expect(totalTime).toBeLessThan(60000); // <60 seconds
      expect(result.current.selections).toHaveLength(maxSelections);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent add operations without race conditions', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const promises = Array.from({ length: 100 }, (_, i) =>
        act(async () => {
          result.current.addSelection(createAtom(i));
        })
      );

      await Promise.all(promises);

      expect(result.current.selections).toHaveLength(100);
    });

    it('should handle interleaved add/remove operations', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const operations = [];

      for (let i = 0; i < 50; i++) {
        operations.push(
          act(async () => {
            result.current.addSelection(createAtom(i * 2));
          })
        );
        operations.push(
          act(async () => {
            result.current.addSelection(createAtom(i * 2 + 1));
          })
        );
        operations.push(
          act(async () => {
            result.current.removeSelection(`atom-${i * 2}`);
          })
        );
      }

      await Promise.all(operations);

      // Should have 50 selections remaining (every odd number)
      expect(result.current.selections).toHaveLength(50);
    });
  });

  describe('rendering performance', () => {
    it('should not cause excessive re-renders', async () => {
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useMultiSelection();
      });

      const initialRenderCount = renderCount;

      await act(async () => {
        for (let i = 0; i < 100; i++) {
          result.current.addSelection(createAtom(i));
        }
      });

      // Should batch and minimize re-renders
      expect(renderCount - initialRenderCount).toBeLessThan(20);
    });

    it('should optimize selection state updates', async () => {
      const { result } = renderHook(() => useMultiSelection());

      const selectionsBefore = result.current.selections;

      await act(async () => {
        result.current.addSelection(createAtom(1));
      });

      const selectionsAfter = result.current.selections;

      // References should be different (immutable update)
      expect(selectionsBefore).not.toBe(selectionsAfter);
    });
  });
});
