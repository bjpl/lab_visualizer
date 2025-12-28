/**
 * Performance Optimization Utilities
 *
 * Event throttling, debouncing, resource limits, and virtual scrolling
 * for efficient handling of high-frequency events and large datasets.
 */

/**
 * Throttle options for limiting event frequency
 */
export interface ThrottleOptions {
  maxEventsPerSecond: number;
}

/**
 * Debounce options for delaying handler execution
 */
export interface DebounceOptions {
  delayMs: number;
}

/**
 * Resource limits configuration
 */
export interface ResourceLimits {
  maxMeasurements: number;
  maxSelectedAtoms: number;
  maxCacheMemoryMB: number;
}

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollOptions {
  itemCount: number;
  visibleCount: number;
  itemHeight: number;
}

/**
 * Create a throttled event handler that limits execution to maxEventsPerSecond
 *
 * This throttle implements a "leaky bucket" rate limiter that:
 * - Executes the first event immediately
 * - Queues subsequent events and processes them at the throttle rate
 * - Enforces a maximum of maxEventsPerSecond per 1-second window
 * - Maintains a queue of events to process at intervals
 *
 * @param handler - The function to throttle
 * @param options - Throttle configuration
 * @returns Throttled handler function
 *
 * @example
 * const throttled = createThrottledHandler(handleHover, { maxEventsPerSecond: 10 });
 * element.addEventListener('mousemove', throttled);
 */
export function createThrottledHandler<T>(
  handler: (event: T) => void,
  options: ThrottleOptions
): (event: T) => void {
  const intervalMs = 1000 / options.maxEventsPerSecond;
  const maxQueueSize = options.maxEventsPerSecond; // Queue up to 1 second worth

  let nextAllowedTime = 0;
  const eventQueue: T[] = [];
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let executionCount = 0;
  let windowStartTime = 0;

  const resetWindowIfNeeded = (now: number) => {
    if (now - windowStartTime >= 1000) {
      windowStartTime = now;
      executionCount = 0;
    }
  };

  const processQueue = () => {
    timerId = null;
    const now = Date.now();
    resetWindowIfNeeded(now);

    // Check if we've hit the rate limit
    if (executionCount >= options.maxEventsPerSecond || eventQueue.length === 0) {
      return;
    }

    // Execute the next event from queue
    const event = eventQueue.shift()!;
    handler(event);
    executionCount++;
    nextAllowedTime = now + intervalMs;

    // Schedule next if there are more events and we have capacity
    scheduleIfNeeded();
  };

  const scheduleIfNeeded = () => {
    const now = Date.now();
    resetWindowIfNeeded(now);

    if (timerId !== null || eventQueue.length === 0) {
      return;
    }

    if (executionCount >= options.maxEventsPerSecond) {
      return;
    }

    // Always use full interval for scheduling to ensure proper rate limiting
    timerId = setTimeout(processQueue, intervalMs);
  };

  return (event: T) => {
    const now = Date.now();
    resetWindowIfNeeded(now);

    // If we've hit the rate limit for this window, drop the event
    if (executionCount >= options.maxEventsPerSecond) {
      return;
    }

    // If we can execute immediately (no pending and enough time passed)
    if (now >= nextAllowedTime && eventQueue.length === 0) {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      handler(event);
      executionCount++;
      nextAllowedTime = now + intervalMs;
      return;
    }

    // Add to queue if there's space (latest events get priority by replacing oldest)
    if (eventQueue.length >= maxQueueSize) {
      eventQueue.shift(); // Remove oldest to make room
    }
    eventQueue.push(event);
    scheduleIfNeeded();
  };
}

/**
 * Create a debounced event handler that delays execution until quiet period
 *
 * @param handler - The function to debounce
 * @param options - Debounce configuration
 * @returns Debounced handler function
 *
 * @example
 * const debounced = createDebouncedHandler(handleSearch, { delayMs: 300 });
 * input.addEventListener('input', debounced);
 */
export function createDebouncedHandler<T>(
  handler: (event: T) => void,
  options: DebounceOptions
): (event: T) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let lastEvent: T | null = null;

  return (event: T) => {
    lastEvent = event;

    // Clear any existing timer
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    // Set new timer
    timerId = setTimeout(() => {
      if (lastEvent !== null) {
        handler(lastEvent);
        lastEvent = null;
      }
      timerId = null;
    }, options.delayMs);
  };
}

/**
 * Resource Limit Manager
 *
 * Tracks and enforces limits on measurements, atom selections, and cache memory
 * to prevent memory exhaustion and maintain performance.
 */
export class ResourceLimitManager {
  private limits: ResourceLimits;
  private measurementCount: number = 0;
  private selectedAtomCount: number = 0;
  private cacheMemoryBytes: number = 0;

  constructor(limits: ResourceLimits) {
    this.limits = limits;
  }

  /**
   * Check if a new measurement can be added
   */
  canAddMeasurement(): boolean {
    return this.measurementCount < this.limits.maxMeasurements;
  }

  /**
   * Add a measurement (if within limits)
   * @throws Error if limit reached
   */
  addMeasurement(): void {
    if (!this.canAddMeasurement()) {
      throw new Error(
        `Measurement limit reached (${this.limits.maxMeasurements})`
      );
    }
    this.measurementCount++;
  }

  /**
   * Remove a measurement
   */
  removeMeasurement(): void {
    if (this.measurementCount > 0) {
      this.measurementCount--;
    }
  }

  /**
   * Get current measurement count
   */
  getCurrentMeasurementCount(): number {
    return this.measurementCount;
  }

  /**
   * Check if atoms can be selected
   * @param count - Number of atoms to select
   */
  canSelectAtoms(count: number): boolean {
    return this.selectedAtomCount + count <= this.limits.maxSelectedAtoms;
  }

  /**
   * Select atoms (if within limits)
   * @param count - Number of atoms to select
   * @throws Error if limit would be exceeded
   */
  selectAtoms(count: number): void {
    if (!this.canSelectAtoms(count)) {
      throw new Error(
        `Atom selection limit would be exceeded (max: ${this.limits.maxSelectedAtoms})`
      );
    }
    this.selectedAtomCount += count;
  }

  /**
   * Deselect atoms
   * @param count - Number of atoms to deselect
   */
  deselectAtoms(count: number): void {
    this.selectedAtomCount = Math.max(0, this.selectedAtomCount - count);
  }

  /**
   * Get current selected atom count
   */
  getCurrentSelectedCount(): number {
    return this.selectedAtomCount;
  }

  /**
   * Get current cache memory usage in MB
   */
  getCacheMemoryUsageMB(): number {
    return Math.floor(this.cacheMemoryBytes / (1024 * 1024));
  }

  /**
   * Add data to cache
   * @param sizeBytes - Size of data in bytes
   * @returns true if added, false if would exceed limit
   */
  addToCache(sizeBytes: number): boolean {
    const newTotalBytes = this.cacheMemoryBytes + sizeBytes;
    const newTotalMB = newTotalBytes / (1024 * 1024);

    if (newTotalMB > this.limits.maxCacheMemoryMB) {
      return false;
    }

    this.cacheMemoryBytes = newTotalBytes;
    return true;
  }

  /**
   * Remove data from cache
   * @param sizeBytes - Size of data removed in bytes
   */
  removeFromCache(sizeBytes: number): void {
    this.cacheMemoryBytes = Math.max(0, this.cacheMemoryBytes - sizeBytes);
  }

  /**
   * Clear all cache memory tracking
   */
  clearCache(): void {
    this.cacheMemoryBytes = 0;
  }

  /**
   * Reset all limits
   */
  reset(): void {
    this.measurementCount = 0;
    this.selectedAtomCount = 0;
    this.cacheMemoryBytes = 0;
  }
}

/**
 * Virtual Scroll Renderer
 *
 * Efficiently renders only visible items from large lists,
 * maintaining smooth 60fps scrolling performance.
 */
export class VirtualScrollRenderer {
  private options: VirtualScrollOptions;
  private currentScrollPosition: number = 0;
  private renderedCount: number = 0;
  private buffer: number = 0; // No buffer - render exactly visibleCount items

  constructor(options: VirtualScrollOptions) {
    this.options = options;
    this.updateRenderedCount();
  }

  /**
   * Update rendered count based on visible items + buffer
   */
  private updateRenderedCount(): void {
    this.renderedCount = Math.min(
      this.options.visibleCount + this.buffer * 2,
      this.options.itemCount
    );
  }

  /**
   * Get visible item indices at current scroll position
   * @param scrollPosition - Current scroll position in pixels
   * @returns Array of visible item indices
   */
  getVisibleItems(scrollPosition: number): number[] {
    // Calculate first visible item index
    const firstVisibleIndex = Math.floor(
      scrollPosition / this.options.itemHeight
    );

    // Apply bounds and buffer
    const startIndex = Math.max(0, firstVisibleIndex - this.buffer);
    const endIndex = Math.min(
      this.options.itemCount,
      firstVisibleIndex + this.options.visibleCount + this.buffer
    );

    // Generate array of visible indices
    const indices: number[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      indices.push(i);
    }

    this.renderedCount = indices.length;
    return indices;
  }

  /**
   * Get number of items currently rendered
   */
  getRenderedCount(): number {
    return this.renderedCount;
  }

  /**
   * Scroll to position
   * @param position - Scroll position in pixels
   */
  scrollTo(position: number): void {
    this.currentScrollPosition = Math.max(
      0,
      Math.min(
        position,
        (this.options.itemCount - this.options.visibleCount) *
          this.options.itemHeight
      )
    );
  }

  /**
   * Measure render time for performance testing
   * @returns Render time in milliseconds
   */
  measureRenderTime(): number {
    const start = performance.now();

    // Simulate render work
    this.getVisibleItems(this.currentScrollPosition);

    return performance.now() - start;
  }

  /**
   * Get total height of scrollable content
   */
  getTotalHeight(): number {
    return this.options.itemCount * this.options.itemHeight;
  }

  /**
   * Get current scroll position
   */
  getScrollPosition(): number {
    return this.currentScrollPosition;
  }

  /**
   * Update item count (for dynamic lists)
   */
  setItemCount(count: number): void {
    this.options.itemCount = count;
    this.updateRenderedCount();
  }
}
