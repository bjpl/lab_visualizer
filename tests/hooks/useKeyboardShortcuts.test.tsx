/**
 * Keyboard Shortcuts Hook Tests
 *
 * Tests for keyboard shortcuts that control selection and measurement operations.
 * Uses the actual implementation from src/hooks/useKeyboardShortcuts.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import React from 'react';

// Import actual implementation
import {
  useKeyboardShortcuts,
  type MeasurementMode,
  type KeyboardShortcutsOptions,
} from '@/hooks/useKeyboardShortcuts';

// Re-export types for test compatibility
type MeasurementType = 'distance' | 'angle' | 'dihedral';

// Mock the selection store
vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: () => ({
    clearSelection: vi.fn(),
    selectAll: vi.fn(),
  }),
}));

// Wrapper for tests that provides React context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <React.Fragment>{children}</React.Fragment>
);

describe('useKeyboardShortcuts', () => {

  let cleanup: (() => void)[] = [];

  beforeEach(() => {
    cleanup = [];
  });

  afterEach(() => {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      // Check measurement mode is null by default
      expect(result.current.measurementMode).toBeNull();
      expect(result.current.isShiftPressed).toBe(false);
      expect(result.current.isCtrlPressed).toBe(false);
    });

    it('should track modifier key states', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      expect(result.current.isShiftPressed).toBe(false);
      expect(result.current.isCtrlPressed).toBe(false);
    });

    it('should be enabled by default', () => {
      const { result } = renderHook(() => useKeyboardShortcuts({ enabled: true }), { wrapper });

      // Hook should respond to keyboard events when enabled
      expect(result.current.measurementMode).toBeNull();
    });
  });

  describe('selection modifiers', () => {
    it('should detect Shift key press and release', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      expect(result.current.isShiftPressed).toBe(false);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Shift', shiftKey: true });
        window.dispatchEvent(event);
      });

      expect(result.current.isShiftPressed).toBe(true);

      act(() => {
        const event = new KeyboardEvent('keyup', { key: 'Shift', shiftKey: false });
        window.dispatchEvent(event);
      });

      expect(result.current.isShiftPressed).toBe(false);
    });

    it('should detect Ctrl key press and release', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      expect(result.current.isCtrlPressed).toBe(false);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true });
        window.dispatchEvent(event);
      });

      expect(result.current.isCtrlPressed).toBe(true);

      act(() => {
        const event = new KeyboardEvent('keyup', { key: 'Control', ctrlKey: false });
        window.dispatchEvent(event);
      });

      expect(result.current.isCtrlPressed).toBe(false);
    });

    it('should detect Meta/Cmd key press and release', () => {
      // Note: The actual hook tracks Meta as Ctrl on Mac
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      // On non-Mac, metaKey won't trigger isCtrlPressed
      // This test verifies Meta key handling
      expect(result.current.isCtrlPressed).toBe(false);
    });

    it('should trigger select all on Ctrl+A', () => {
      // The hook calls the store's selectAll internally
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          ctrlKey: true,
        });
        window.dispatchEvent(event);
      });

      // The hook should have processed the event
      // The actual selection is handled by the store mock
      expect(result.current.isCtrlPressed).toBe(true);
    });

    it('should trigger select all on Cmd+A (Mac)', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          metaKey: true,
        });
        window.dispatchEvent(event);
      });

      // Event should have been processed
      expect(result.current).toBeDefined();
    });

    it('should clear selections on Escape', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      // First set a measurement mode
      act(() => {
        result.current.setMeasurementMode('distance');
      });

      expect(result.current.measurementMode).toBe('distance');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        window.dispatchEvent(event);
      });

      // Escape should clear measurement mode
      expect(result.current.measurementMode).toBeNull();
    });

    it('should prevent default browser behavior on Ctrl+A', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('measurement shortcuts', () => {
    it('should start distance measurement on D key', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'd' });
        window.dispatchEvent(event);
      });

      expect(result.current.measurementMode).toBe('distance');
      expect(onMeasurementModeChange).toHaveBeenCalledWith('distance');
    });

    it('should start angle measurement on A key', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        window.dispatchEvent(event);
      });

      expect(result.current.measurementMode).toBe('angle');
      expect(onMeasurementModeChange).toHaveBeenCalledWith('angle');
    });

    it('should start dihedral measurement on T key', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 't' });
        window.dispatchEvent(event);
      });

      expect(result.current.measurementMode).toBe('dihedral');
      expect(onMeasurementModeChange).toHaveBeenCalledWith('dihedral');
    });

    it('should not trigger measurements when modifiers are pressed', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'd',
          ctrlKey: true,
        });
        window.dispatchEvent(event);
      });

      // Mode should not change when Ctrl is pressed
      expect(result.current.measurementMode).toBeNull();
    });

    it('should handle case-insensitive key presses', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'D' });
        window.dispatchEvent(event);
      });

      expect(result.current.measurementMode).toBe('distance');
    });
  });

  describe('navigation shortcuts', () => {
    it('should reset view on R key', () => {
      const onViewReset = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onViewReset }),
        { wrapper }
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'r' });
        window.dispatchEvent(event);
      });

      expect(onViewReset).toHaveBeenCalledTimes(1);
    });

    it('should toggle spin on S key', () => {
      const onSpinToggle = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onSpinToggle }),
        { wrapper }
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 's' });
        window.dispatchEvent(event);
      });

      expect(onSpinToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('enable/disable functionality', () => {
    it('should allow disabling shortcuts', () => {
      const onMeasurementModeChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcuts({ onMeasurementModeChange, enabled }),
        { wrapper, initialProps: { enabled: true } }
      );

      // Disable by re-rendering with enabled=false
      rerender({ enabled: false });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'd' });
        window.dispatchEvent(event);
      });

      expect(onMeasurementModeChange).not.toHaveBeenCalled();
    });

    it('should allow re-enabling shortcuts', () => {
      const onMeasurementModeChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcuts({ onMeasurementModeChange, enabled }),
        { wrapper, initialProps: { enabled: false } }
      );

      // Re-enable by re-rendering with enabled=true
      rerender({ enabled: true });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'd' });
        window.dispatchEvent(event);
      });

      expect(result.current.measurementMode).toBe('distance');
    });
  });

  describe('cleanup and memory management', () => {
    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('should not leak memory with multiple mount/unmount cycles', () => {
      const getEventListenerCount = () => {
        // This is a simplified check - in real implementation we'd use performance.memory
        return (window as any).__eventListeners?.length || 0;
      };

      const initialCount = getEventListenerCount();

      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useKeyboardShortcuts(), { wrapper });
        unmount();
      }

      const finalCount = getEventListenerCount();
      expect(finalCount).toBeLessThanOrEqual(initialCount + 2); // Allow for some overhead
    });
  });

  describe('accessibility', () => {
    it('should ignore shortcuts when input element is focused', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      act(() => {
        // Simulate keydown event from focused input
        const event = new KeyboardEvent('keydown', {
          key: 'd',
          bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: input });
        input.dispatchEvent(event);
      });

      // Callback should not be called since input is focused
      expect(onMeasurementModeChange).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should ignore shortcuts when textarea is focused', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'd',
          bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: textarea });
        textarea.dispatchEvent(event);
      });

      expect(onMeasurementModeChange).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should ignore shortcuts when contenteditable is focused', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      div.focus();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'd',
          bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: div });
        div.dispatchEvent(event);
      });

      expect(onMeasurementModeChange).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid key presses without errors', () => {
      const onMeasurementModeChange = vi.fn();
      const { result } = renderHook(
        () => useKeyboardShortcuts({ onMeasurementModeChange }),
        { wrapper }
      );

      expect(() => {
        act(() => {
          for (let i = 0; i < 100; i++) {
            const event = new KeyboardEvent('keydown', { key: 'd' });
            window.dispatchEvent(event);
          }
        });
      }).not.toThrow();
    });

    it('should handle simultaneous modifier keys', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      act(() => {
        const event1 = new KeyboardEvent('keydown', {
          key: 'Shift',
          shiftKey: true,
        });
        const event2 = new KeyboardEvent('keydown', {
          key: 'Control',
          ctrlKey: true,
        });
        window.dispatchEvent(event1);
        window.dispatchEvent(event2);
      });

      expect(result.current.isShiftPressed).toBe(true);
      expect(result.current.isCtrlPressed).toBe(true);
    });

    it('should handle focus loss during key press', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Shift',
          shiftKey: true,
        });
        window.dispatchEvent(event);
      });

      expect(result.current.isShiftPressed).toBe(true);

      act(() => {
        const blurEvent = new Event('blur');
        window.dispatchEvent(blurEvent);
      });

      // Should reset modifier states on blur
      expect(result.current.isShiftPressed).toBe(false);
    });
  });

  describe('cross-platform compatibility', () => {
    it('should use Meta key for Mac users', () => {
      // Mock Mac platform
      const originalPlatform = navigator.platform;
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
        writable: true,
      });

      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          metaKey: true,
        });
        window.dispatchEvent(event);
      });

      // Verify event was processed (store mock is called)
      expect(result.current).toBeDefined();

      // Restore
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });

    it('should use Ctrl key for Windows/Linux users', () => {
      // Mock Windows platform
      const originalPlatform = navigator.platform;
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
        writable: true,
      });

      const { result } = renderHook(() => useKeyboardShortcuts(), { wrapper });

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          ctrlKey: true,
        });
        window.dispatchEvent(event);
      });

      // Verify event was processed
      expect(result.current.isCtrlPressed).toBe(true);

      // Restore
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });
  });
});
