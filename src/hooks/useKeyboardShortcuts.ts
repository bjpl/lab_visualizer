/**
 * Keyboard Shortcuts Hook
 *
 * Provides comprehensive keyboard shortcut handling for:
 * - Selection modifiers (Shift+Click, Ctrl/Cmd+Click, Ctrl/Cmd+A, Escape)
 * - Measurement shortcuts (D, A, T, M keys)
 * - View controls (R, S, H, Space keys)
 *
 * Cross-platform support for Mac (Cmd) and Windows/Linux (Ctrl)
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useSelectionStore } from '@/stores/selection-store';

/**
 * Measurement mode types
 */
export type MeasurementMode = 'distance' | 'angle' | 'dihedral' | null;

/**
 * Keyboard shortcut options
 */
export interface KeyboardShortcutsOptions {
  /** Enable/disable all keyboard shortcuts */
  enabled?: boolean;

  /** Callback when measurement mode changes */
  onMeasurementModeChange?: (mode: MeasurementMode) => void;

  /** Callback when view reset is triggered */
  onViewReset?: () => void;

  /** Callback when spin toggle is triggered */
  onSpinToggle?: () => void;

  /** Callback when hydrogen visibility toggle is triggered */
  onHydrogenToggle?: () => void;

  /** Callback when animation pause/resume is triggered */
  onAnimationToggle?: () => void;

  /** Callback when measurements panel visibility toggle is triggered */
  onMeasurementsPanelToggle?: () => void;

  /** Element to attach keyboard listeners to (defaults to window) */
  targetElement?: HTMLElement | null;
}

/**
 * Hook return value
 */
export interface KeyboardShortcutsReturn {
  /** Current measurement mode */
  measurementMode: MeasurementMode;

  /** Programmatically set measurement mode */
  setMeasurementMode: (mode: MeasurementMode) => void;

  /** Whether Shift key is currently pressed */
  isShiftPressed: boolean;

  /** Whether Ctrl/Cmd key is currently pressed */
  isCtrlPressed: boolean;

  /** Whether Alt key is currently pressed */
  isAltPressed: boolean;
}

/**
 * Detect if running on Mac
 */
const isMac = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

/**
 * Check if Ctrl key (or Cmd on Mac) is pressed
 */
const isControlKey = (event: KeyboardEvent): boolean => {
  return isMac() ? event.metaKey : event.ctrlKey;
};

/**
 * Keyboard Shortcuts Hook
 *
 * Manages keyboard shortcuts for selection, measurements, and view controls
 * with cross-platform support (Mac Cmd vs Windows/Linux Ctrl)
 */
export function useKeyboardShortcuts(
  options: KeyboardShortcutsOptions = {}
): KeyboardShortcutsReturn {
  const {
    enabled = true,
    onMeasurementModeChange,
    onViewReset,
    onSpinToggle,
    onHydrogenToggle,
    onAnimationToggle,
    onMeasurementsPanelToggle,
    targetElement,
  } = options;

  // Selection store actions
  const { clearSelection, selectAll } = useSelectionStore();

  // Measurement mode state
  const [measurementMode, setMeasurementModeState] = useState<MeasurementMode>(null);

  // Modifier key states
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);

  // Track active keys to prevent repeat events
  const activeKeysRef = useRef<Set<string>>(new Set());

  /**
   * Set measurement mode and notify parent
   */
  const setMeasurementMode = useCallback((mode: MeasurementMode) => {
    setMeasurementModeState(mode);
    onMeasurementModeChange?.(mode);
  }, [onMeasurementModeChange]);

  /**
   * Handle keydown events
   */
  const handleKeyDown = useCallback((event: Event) => {
    const keyEvent = event as KeyboardEvent;
    const key = keyEvent.key.toLowerCase();
    const code = keyEvent.code;

    // Prevent handling when typing in input fields
    const target = keyEvent.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Track modifier keys
    if (keyEvent.shiftKey) setIsShiftPressed(true);
    if (isControlKey(keyEvent)) setIsCtrlPressed(true);
    if (keyEvent.altKey) setIsAltPressed(true);

    // Prevent repeat events for the same key
    if (activeKeysRef.current.has(code)) {
      return;
    }
    activeKeysRef.current.add(code);

    // === SELECTION SHORTCUTS ===

    // Ctrl/Cmd+A: Select all
    if (isControlKey(keyEvent) && key === 'a') {
      keyEvent.preventDefault();
      // Get all visible atoms - this would need to be provided by the caller
      // For now, we just trigger the selectAll with an empty array
      // The actual implementation should get atom IDs from the viewer
      selectAll([]);
      return;
    }

    // Escape: Clear selection
    if (key === 'escape') {
      keyEvent.preventDefault();
      clearSelection();
      // Also clear measurement mode
      setMeasurementMode(null);
      return;
    }

    // === MEASUREMENT SHORTCUTS ===

    // D key: Distance measurement mode
    if (key === 'd' && !isControlKey(keyEvent)) {
      keyEvent.preventDefault();
      const newMode = measurementMode === 'distance' ? null : 'distance';
      setMeasurementMode(newMode);
      return;
    }

    // A key: Angle measurement mode
    if (key === 'a' && !isControlKey(keyEvent)) {
      keyEvent.preventDefault();
      const newMode = measurementMode === 'angle' ? null : 'angle';
      setMeasurementMode(newMode);
      return;
    }

    // T key: Dihedral (torsion) measurement mode
    if (key === 't' && !isControlKey(keyEvent)) {
      keyEvent.preventDefault();
      const newMode = measurementMode === 'dihedral' ? null : 'dihedral';
      setMeasurementMode(newMode);
      return;
    }

    // M key: Toggle measurements panel
    if (key === 'm' && !isControlKey(keyEvent)) {
      keyEvent.preventDefault();
      onMeasurementsPanelToggle?.();
      return;
    }

    // === VIEW CONTROL SHORTCUTS ===

    // R key: Reset camera view
    if (key === 'r' && !isControlKey(keyEvent)) {
      keyEvent.preventDefault();
      onViewReset?.();
      return;
    }

    // S key: Toggle structure spin animation
    if (key === 's' && !isControlKey(keyEvent)) {
      keyEvent.preventDefault();
      onSpinToggle?.();
      return;
    }

    // H key: Toggle hydrogen atom visibility
    if (key === 'h' && !isControlKey(keyEvent)) {
      keyEvent.preventDefault();
      onHydrogenToggle?.();
      return;
    }

    // Space: Pause/resume animation
    if (key === ' ' || code === 'Space') {
      keyEvent.preventDefault();
      onAnimationToggle?.();
      return;
    }
  }, [
    measurementMode,
    setMeasurementMode,
    clearSelection,
    selectAll,
    onViewReset,
    onSpinToggle,
    onHydrogenToggle,
    onAnimationToggle,
    onMeasurementsPanelToggle,
  ]);

  /**
   * Handle keyup events to track modifier key states
   */
  const handleKeyUp = useCallback((event: Event) => {
    const keyEvent = event as KeyboardEvent;
    const code = keyEvent.code;

    // Update modifier key states
    if (!keyEvent.shiftKey) setIsShiftPressed(false);
    if (!isControlKey(keyEvent)) setIsCtrlPressed(false);
    if (!keyEvent.altKey) setIsAltPressed(false);

    // Remove from active keys
    activeKeysRef.current.delete(code);
  }, []);

  /**
   * Reset modifier states when window loses focus
   */
  const handleBlur = useCallback(() => {
    setIsShiftPressed(false);
    setIsCtrlPressed(false);
    setIsAltPressed(false);
    activeKeysRef.current.clear();
  }, []);

  /**
   * Setup and cleanup keyboard event listeners
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const target = targetElement || window;

    // Add event listeners
    target.addEventListener('keydown', handleKeyDown);
    target.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Cleanup
    return () => {
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);

      // Reset states on cleanup
      setIsShiftPressed(false);
      setIsCtrlPressed(false);
      setIsAltPressed(false);
      activeKeysRef.current.clear();
    };
  }, [enabled, handleKeyDown, handleKeyUp, handleBlur, targetElement]);

  return {
    measurementMode,
    setMeasurementMode,
    isShiftPressed,
    isCtrlPressed,
    isAltPressed,
  };
}

/**
 * Helper hook to get modifier key display names for UI
 */
export function useModifierKeyName(): {
  ctrl: string;
  shift: string;
  alt: string;
} {
  const [modifierKeys, setModifierKeys] = useState({
    ctrl: 'Ctrl',
    shift: 'Shift',
    alt: 'Alt',
  });

  useEffect(() => {
    if (isMac()) {
      setModifierKeys({
        ctrl: 'Cmd',
        shift: 'Shift',
        alt: 'Option',
      });
    }
  }, []);

  return modifierKeys;
}

/**
 * Helper to format keyboard shortcut for display
 * @example formatShortcut('ctrl+a') => 'Cmd+A' on Mac, 'Ctrl+A' on Windows/Linux
 */
export function formatShortcut(shortcut: string): string {
  const parts = shortcut.split('+').map(part => part.toLowerCase());
  const formatted = parts.map(part => {
    if (part === 'ctrl') {
      return isMac() ? 'Cmd' : 'Ctrl';
    }
    if (part === 'alt') {
      return isMac() ? 'Option' : 'Alt';
    }
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
  return formatted.join('+');
}
