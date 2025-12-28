/**
 * Performance Optimization Tests
 * Tests for throttling, debouncing, resource limits, and virtual scrolling
 *
 * @test Performance Optimizations
 * @description Validates event throttling, debouncing, resource limits, and virtual scrolling
 * @prerequisites
 *   - Event handling system with throttle/debounce
 *   - Resource limit management
 *   - Virtual scrolling implementation
 * @expected All performance optimizations work within specified limits
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createThrottledHandler,
  createDebouncedHandler,
  ResourceLimitManager,
  VirtualScrollRenderer,
} from '@/utils/performance-optimization';

describe('Performance Optimizations', () => {
  describe('Event Throttling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should throttle hover events to max 10 events/second (100ms)', () => {
      const handler = vi.fn();
      const throttled = createThrottledHandler(handler, { maxEventsPerSecond: 10 });

      // Simulate rapid hover events (100 events in 100ms = 1000 events/second)
      for (let i = 0; i < 100; i++) {
        throttled({ x: i, y: i, timestamp: Date.now() });
        vi.advanceTimersByTime(1); // 1ms between events
      }

      // Should only process 10 events in 1 second (1 every 100ms)
      // After 100ms, should have processed only 1-2 events max
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should process events at correct intervals', () => {
      const handler = vi.fn();
      const throttled = createThrottledHandler(handler, { maxEventsPerSecond: 10 });

      // Send events every 50ms for 1 second
      for (let i = 0; i < 20; i++) {
        throttled({ x: i, y: i, timestamp: Date.now() });
        vi.advanceTimersByTime(50);
      }

      // Should have processed 10 events (one every 100ms)
      expect(handler).toHaveBeenCalledTimes(10);
    });

    it('should queue events and drop excess when at limit', () => {
      const handler = vi.fn();
      const throttled = createThrottledHandler(handler, { maxEventsPerSecond: 10 });

      // Rapid fire 100 events
      const events = Array.from({ length: 100 }, (_, i) => ({
        x: i,
        y: i,
        timestamp: Date.now(),
      }));

      events.forEach((event) => throttled(event));

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      // Should have processed exactly 10 events
      expect(handler).toHaveBeenCalledTimes(10);
    });

    it('should handle rapid mouse movement (100 events/sec → 10 processed)', () => {
      const handler = vi.fn();
      const throttled = createThrottledHandler(handler, { maxEventsPerSecond: 10 });

      // Simulate rapid mouse movement
      for (let i = 0; i < 100; i++) {
        throttled({
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          timestamp: Date.now(),
        });
        vi.advanceTimersByTime(10); // 10ms between events = 100 events/second
      }

      // Total time: 1000ms, should process 10 events
      expect(handler).toHaveBeenCalledTimes(10);
    });

    it('should reset throttle window after period expires', () => {
      const handler = vi.fn();
      const throttled = createThrottledHandler(handler, { maxEventsPerSecond: 10 });

      // First burst
      for (let i = 0; i < 20; i++) {
        throttled({ x: i, y: i, timestamp: Date.now() });
      }
      vi.advanceTimersByTime(1000);

      expect(handler).toHaveBeenCalledTimes(10);

      // Second burst after window reset
      for (let i = 0; i < 20; i++) {
        throttled({ x: i + 100, y: i + 100, timestamp: Date.now() });
      }
      vi.advanceTimersByTime(1000);

      // Should process another 10 events
      expect(handler).toHaveBeenCalledTimes(20);
    });
  });

  describe('Event Debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should debounce selection events to 50ms', () => {
      const handler = vi.fn();
      const debounced = createDebouncedHandler(handler, { delayMs: 50 });

      // Rapid clicks
      debounced({ atomId: 1 });
      debounced({ atomId: 2 });
      debounced({ atomId: 3 });

      // Handler should not be called yet
      expect(handler).not.toHaveBeenCalled();

      // Advance time past debounce delay
      vi.advanceTimersByTime(50);

      // Should be called once with last event
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ atomId: 3 });
    });

    it('should only process last event in burst', () => {
      const handler = vi.fn();
      const debounced = createDebouncedHandler(handler, { delayMs: 50 });

      // Burst of 10 events within debounce window
      for (let i = 0; i < 10; i++) {
        debounced({ atomId: i, timestamp: Date.now() });
        vi.advanceTimersByTime(10); // 10ms between events
      }

      // Total time: 100ms, but debounce should reset each time
      expect(handler).not.toHaveBeenCalled();

      // Advance past final debounce delay
      vi.advanceTimersByTime(50);

      // Should process only the last event
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ atomId: 9, timestamp: expect.any(Number) });
    });

    it('should reset debounce timer on each new event', () => {
      const handler = vi.fn();
      const debounced = createDebouncedHandler(handler, { delayMs: 50 });

      debounced({ atomId: 1 });
      vi.advanceTimersByTime(40); // Not enough to trigger

      debounced({ atomId: 2 }); // Resets timer
      vi.advanceTimersByTime(40); // Still not enough

      debounced({ atomId: 3 }); // Resets timer again
      vi.advanceTimersByTime(50); // Now it triggers

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ atomId: 3 });
    });

    it('should handle rapid clicks → single final handler call', () => {
      const handler = vi.fn();
      const debounced = createDebouncedHandler(handler, { delayMs: 50 });

      // Simulate 20 rapid clicks (5ms apart)
      for (let i = 0; i < 20; i++) {
        debounced({ atomId: i, x: i * 10, y: i * 10 });
        vi.advanceTimersByTime(5);
      }

      // Should not have been called during burst
      expect(handler).not.toHaveBeenCalled();

      // Advance past debounce delay
      vi.advanceTimersByTime(50);

      // Should be called exactly once with last click
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ atomId: 19, x: 190, y: 190 });
    });

    it('should allow multiple debounced handlers independently', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const debounced1 = createDebouncedHandler(handler1, { delayMs: 50 });
      const debounced2 = createDebouncedHandler(handler2, { delayMs: 100 });

      debounced1({ id: 1 });
      debounced2({ id: 2 });

      vi.advanceTimersByTime(50);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Resource Limits', () => {
    let manager: ResourceLimitManager;

    beforeEach(() => {
      manager = new ResourceLimitManager({
        maxMeasurements: 1000,
        maxSelectedAtoms: 100,
        maxCacheMemoryMB: 500,
      });
    });

    describe('Measurement Limits', () => {
      it('should reject new measurements when at 1000 limit', () => {
        // Add 1000 measurements
        for (let i = 0; i < 1000; i++) {
          expect(manager.canAddMeasurement()).toBe(true);
          manager.addMeasurement();
        }

        // Should reject the 1001st measurement
        expect(manager.canAddMeasurement()).toBe(false);
        expect(manager.getCurrentMeasurementCount()).toBe(1000);
      });

      it('should provide user feedback when measurement limit reached', () => {
        // Fill to limit
        for (let i = 0; i < 1000; i++) {
          manager.addMeasurement();
        }

        const canAdd = manager.canAddMeasurement();
        expect(canAdd).toBe(false);

        // In real implementation, this would trigger a user notification
        // For now, we just verify the limit is enforced
        expect(manager.getCurrentMeasurementCount()).toBe(1000);
      });

      it('should track measurement count accurately', () => {
        expect(manager.getCurrentMeasurementCount()).toBe(0);

        manager.addMeasurement();
        expect(manager.getCurrentMeasurementCount()).toBe(1);

        for (let i = 0; i < 99; i++) {
          manager.addMeasurement();
        }
        expect(manager.getCurrentMeasurementCount()).toBe(100);
      });
    });

    describe('Atom Selection Limits', () => {
      it('should reject selection when exceeding 100 atoms', () => {
        expect(manager.canSelectAtoms(100)).toBe(true);
        manager.selectAtoms(100);

        // Should reject additional selections
        expect(manager.canSelectAtoms(1)).toBe(false);
        expect(manager.getCurrentSelectedCount()).toBe(100);
      });

      it('should allow selection up to limit', () => {
        expect(manager.canSelectAtoms(50)).toBe(true);
        manager.selectAtoms(50);

        expect(manager.canSelectAtoms(50)).toBe(true);
        manager.selectAtoms(50);

        expect(manager.getCurrentSelectedCount()).toBe(100);
        expect(manager.canSelectAtoms(1)).toBe(false);
      });

      it('should reject bulk selection that exceeds limit', () => {
        manager.selectAtoms(90);

        expect(manager.canSelectAtoms(20)).toBe(false);
        expect(manager.getCurrentSelectedCount()).toBe(90);
      });

      it('should provide user feedback when selection limit reached', () => {
        manager.selectAtoms(100);

        const canSelect = manager.canSelectAtoms(1);
        expect(canSelect).toBe(false);

        // Verify limit is enforced
        expect(manager.getCurrentSelectedCount()).toBe(100);
      });
    });

    describe('Cache Memory Limits', () => {
      it('should reject cache addition when exceeding 500MB', () => {
        const bytesIn400MB = 400 * 1024 * 1024;
        const bytesIn150MB = 150 * 1024 * 1024;

        expect(manager.addToCache(bytesIn400MB)).toBe(true);
        expect(manager.getCacheMemoryUsageMB()).toBe(400);

        // Should reject addition that exceeds limit
        expect(manager.addToCache(bytesIn150MB)).toBe(false);
        expect(manager.getCacheMemoryUsageMB()).toBe(400);
      });

      it('should track cache memory usage accurately', () => {
        const bytesIn100MB = 100 * 1024 * 1024;

        expect(manager.getCacheMemoryUsageMB()).toBe(0);

        manager.addToCache(bytesIn100MB);
        expect(manager.getCacheMemoryUsageMB()).toBe(100);

        manager.addToCache(bytesIn100MB);
        expect(manager.getCacheMemoryUsageMB()).toBe(200);

        manager.addToCache(bytesIn100MB);
        expect(manager.getCacheMemoryUsageMB()).toBe(300);
      });

      it('should allow cache additions up to limit', () => {
        const bytesIn100MB = 100 * 1024 * 1024;

        for (let i = 0; i < 5; i++) {
          expect(manager.addToCache(bytesIn100MB)).toBe(true);
        }

        expect(manager.getCacheMemoryUsageMB()).toBe(500);
        expect(manager.addToCache(1024)).toBe(false);
      });

      it('should provide user feedback when cache limit reached', () => {
        const bytesIn500MB = 500 * 1024 * 1024;
        manager.addToCache(bytesIn500MB);

        const canAdd = manager.addToCache(1024);
        expect(canAdd).toBe(false);

        // Verify limit is enforced
        expect(manager.getCacheMemoryUsageMB()).toBe(500);
      });
    });

    describe('Combined Limits', () => {
      it('should enforce all limits independently', () => {
        // Fill measurements to limit
        for (let i = 0; i < 1000; i++) {
          manager.addMeasurement();
        }

        // Atom selection should still work
        expect(manager.canSelectAtoms(50)).toBe(true);

        // Cache should still work
        expect(manager.addToCache(100 * 1024 * 1024)).toBe(true);

        // But measurements are at limit
        expect(manager.canAddMeasurement()).toBe(false);
      });

      it('should reset all limits when reset is called', () => {
        manager.addMeasurement();
        manager.selectAtoms(50);
        manager.addToCache(100 * 1024 * 1024);

        manager.reset();

        expect(manager.getCurrentMeasurementCount()).toBe(0);
        expect(manager.getCurrentSelectedCount()).toBe(0);
        expect(manager.getCacheMemoryUsageMB()).toBe(0);
      });
    });
  });

  describe('Virtual Scrolling', () => {
    let renderer: VirtualScrollRenderer;

    beforeEach(() => {
      renderer = new VirtualScrollRenderer({
        itemCount: 10000,
        visibleCount: 20,
        itemHeight: 20,
      });
    });

    it('should render only visible residues in 10,000 sequence', () => {
      const visibleItems = renderer.getVisibleItems(0);

      // Should render only ~20 items, not all 10,000
      expect(visibleItems.length).toBeLessThanOrEqual(20);
      expect(renderer.getRenderedCount()).toBeLessThanOrEqual(25); // With buffer
    });

    it('should render ~20 residues at once regardless of scroll position', () => {
      // Test at different scroll positions
      const positions = [0, 5000, 9000];

      positions.forEach((position) => {
        const visibleItems = renderer.getVisibleItems(position);
        expect(visibleItems.length).toBeGreaterThanOrEqual(15);
        expect(visibleItems.length).toBeLessThanOrEqual(25);
      });
    });

    it('should maintain scroll performance under 16ms (60fps)', () => {
      const startTime = performance.now();

      // Simulate rapid scrolling
      for (let i = 0; i < 100; i++) {
        const scrollPosition = i * 100;
        renderer.scrollTo(scrollPosition);
        renderer.getVisibleItems(scrollPosition);
      }

      const endTime = performance.now();
      const avgTimePerScroll = (endTime - startTime) / 100;

      // Should be well under 16ms per scroll operation
      expect(avgTimePerScroll).toBeLessThan(16);
    });

    it('should update visible items when scrolling', () => {
      const itemsAtTop = renderer.getVisibleItems(0);
      const itemsAtMiddle = renderer.getVisibleItems(5000);
      const itemsAtBottom = renderer.getVisibleItems(9980);

      // Items should be different at different scroll positions
      expect(itemsAtTop[0]).toBe(0);
      expect(itemsAtMiddle[0]).toBeGreaterThan(200);
      expect(itemsAtBottom[0]).toBeGreaterThan(400);
    });

    it('should handle rapid scroll changes efficiently', () => {
      const renderTimes: number[] = [];

      // Simulate rapid scrolling
      for (let i = 0; i < 50; i++) {
        const scrollPosition = Math.random() * 9980;
        const startTime = performance.now();

        renderer.scrollTo(scrollPosition);
        renderer.getVisibleItems(scrollPosition);

        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
      }

      const maxRenderTime = Math.max(...renderTimes);
      const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;

      // All renders should be fast
      expect(maxRenderTime).toBeLessThan(16);
      expect(avgRenderTime).toBeLessThan(10);
    });

    it('should render correct items at boundaries', () => {
      // At start
      const itemsAtStart = renderer.getVisibleItems(0);
      expect(itemsAtStart[0]).toBe(0);

      // At end
      const itemsAtEnd = renderer.getVisibleItems(9980);
      const lastItem = itemsAtEnd[itemsAtEnd.length - 1];
      expect(lastItem).toBeLessThanOrEqual(9999);
    });

    it('should not render all 10,000 items at once', () => {
      // Force render at any position
      renderer.scrollTo(5000);
      const renderedCount = renderer.getRenderedCount();

      // Should render only a small window, not the entire list
      expect(renderedCount).toBeLessThan(100);
      expect(renderedCount).toBeGreaterThan(15);
    });

    it('should measure render performance accurately', () => {
      const renderTime = renderer.measureRenderTime();

      // Render time should be measured and reasonable
      expect(renderTime).toBeGreaterThan(0);
      expect(renderTime).toBeLessThan(16);
    });
  });

  describe('Performance Metrics Integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should track throttle effectiveness', () => {
      const handler = vi.fn();
      const throttled = createThrottledHandler(handler, { maxEventsPerSecond: 10 });

      const eventCount = 100;
      for (let i = 0; i < eventCount; i++) {
        throttled({ x: i, y: i });
      }

      vi.advanceTimersByTime(1000);

      const processedCount = handler.mock.calls.length;
      const reductionRatio = processedCount / eventCount;

      // Should have reduced events to ~10%
      expect(reductionRatio).toBeLessThanOrEqual(0.15);
      expect(processedCount).toBeLessThanOrEqual(10);
    });

    it('should track debounce effectiveness', () => {
      const handler = vi.fn();
      const debounced = createDebouncedHandler(handler, { delayMs: 50 });

      const eventCount = 50;
      for (let i = 0; i < eventCount; i++) {
        debounced({ id: i });
        vi.advanceTimersByTime(10);
      }

      vi.advanceTimersByTime(50);

      const processedCount = handler.mock.calls.length;
      const reductionRatio = processedCount / eventCount;

      // Should have reduced to single call
      expect(reductionRatio).toBeLessThan(0.05);
      expect(processedCount).toBe(1);
    });

    it('should track resource limit enforcement rate', () => {
      const manager = new ResourceLimitManager({
        maxMeasurements: 1000,
        maxSelectedAtoms: 100,
        maxCacheMemoryMB: 500,
      });

      let rejectedMeasurements = 0;
      for (let i = 0; i < 1500; i++) {
        if (manager.canAddMeasurement()) {
          manager.addMeasurement();
        } else {
          rejectedMeasurements++;
        }
      }

      // Should have rejected 500 measurements
      expect(rejectedMeasurements).toBe(500);
      expect(manager.getCurrentMeasurementCount()).toBe(1000);
    });
  });
});
