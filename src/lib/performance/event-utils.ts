/**
 * Performance Event Utilities
 *
 * Throttle and debounce functions for optimizing high-frequency events
 * like hover, scroll, resize, and selection changes.
 */

/**
 * Throttle function - limits execution rate
 *
 * Ensures the wrapped function is called at most once per `delay` milliseconds.
 * Useful for events that fire continuously (scroll, mousemove, resize).
 *
 * @param fn - Function to throttle
 * @param delay - Minimum time between executions in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const handleScroll = throttle((event) => {
 *   console.log('Scrolled', event);
 * }, 100); // At most once per 100ms
 *
 * window.addEventListener('scroll', handleScroll);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    // If enough time has passed, execute immediately
    if (timeSinceLastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }

    // Otherwise, schedule for later (trailing edge)
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, delay - timeSinceLastCall);
    }

    return undefined;
  } as T;
}

/**
 * Debounce function - delays execution until activity stops
 *
 * Ensures the wrapped function is only called after `delay` milliseconds
 * of inactivity. Resets the timer on each call.
 * Useful for events like text input, window resize.
 *
 * @param fn - Function to debounce
 * @param delay - Wait time in milliseconds before execution
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const handleInput = debounce((value: string) => {
 *   console.log('Searching for:', value);
 * }, 300); // Waits 300ms after user stops typing
 *
 * input.addEventListener('input', (e) => handleInput(e.target.value));
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(this: any, ...args: Parameters<T>): void {
    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(this, args);
    }, delay);
  } as T;
}

/**
 * Leading edge debounce - executes immediately on first call,
 * then waits for delay before allowing next execution
 *
 * @param fn - Function to debounce
 * @param delay - Cooldown time in milliseconds
 * @returns Debounced function with leading edge
 */
export function debounceLeading<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCall = 0;

  return function debouncedLeading(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();

    // If enough time has passed since last call, execute immediately
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }

    // Otherwise, schedule for later
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      lastCall = Date.now();
      timeoutId = null;
      fn.apply(this, args);
    }, delay);

    return undefined;
  } as T;
}

/**
 * Request Animation Frame throttle - limits to one execution per frame
 *
 * Ensures function is called at most once per animation frame (~60fps).
 * Ideal for visual updates and rendering.
 *
 * @param fn - Function to throttle
 * @returns RAF-throttled function
 */
export function rafThrottle<T extends (...args: any[]) => any>(fn: T): T {
  let rafId: number | null = null;
  let latestArgs: Parameters<T> | null = null;

  return function rafThrottled(this: any, ...args: Parameters<T>): void {
    latestArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (latestArgs) {
          fn.apply(this, latestArgs);
          latestArgs = null;
        }
      });
    }
  } as T;
}
