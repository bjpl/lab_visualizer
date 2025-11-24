'use client';

import { useState, useCallback, useEffect } from 'react';
import { molstarService } from '@/services/molstar-service';
import type { MeasurementResult, SelectionInfo } from '@/types/molstar';

export type MeasurementMode = 'distance' | 'angle' | 'dihedral' | null;

interface UseMeasurementsOptions {
  onMeasurementComplete?: (measurement: MeasurementResult) => void;
  onMeasurementError?: (error: Error) => void;
}

/**
 * Hook for managing molecular measurements
 *
 * Handles:
 * - Distance measurements (2 points)
 * - Angle measurements (3 points)
 * - Dihedral angle measurements (4 points)
 * - Measurement history and management
 *
 * @example
 * ```tsx
 * const {
 *   measurements,
 *   mode,
 *   startMeasurement,
 *   deleteMeasurement
 * } = useMeasurements();
 *
 * // Start distance measurement
 * startMeasurement('distance');
 *
 * // User clicks on atoms... measurement auto-completes
 * ```
 */
export function useMeasurements(options: UseMeasurementsOptions = {}) {
  const [measurements, setMeasurements] = useState<MeasurementResult[]>([]);
  const [mode, setMode] = useState<MeasurementMode>(null);
  const [selections, setSelections] = useState<SelectionInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const requiredSelections = {
    distance: 2,
    angle: 3,
    dihedral: 4,
  };

  // Listen for new measurements from the service
  useEffect(() => {
    const handleMeasurementAdded = (measurement: MeasurementResult) => {
      setMeasurements(prev => [...prev, measurement]);
      options.onMeasurementComplete?.(measurement);
    };

    molstarService.on('measurement-added', handleMeasurementAdded);
    return () => molstarService.off('measurement-added', handleMeasurementAdded);
  }, [options.onMeasurementComplete]);

  // Listen for selections when in measurement mode
  useEffect(() => {
    if (!mode) return;

    const handleSelection = (info: SelectionInfo | null) => {
      if (!info || isProcessing) return;

      setSelections(prev => {
        const newSelections = [...prev, info];
        const required = requiredSelections[mode];

        // Auto-complete measurement when enough selections
        if (newSelections.length === required) {
          completeMeasurement(mode, newSelections);
          return [];
        }

        return newSelections;
      });
    };

    molstarService.on('selection-info', handleSelection);
    return () => molstarService.off('selection-info', handleSelection);
  }, [mode, isProcessing]);

  const completeMeasurement = async (
    type: MeasurementMode,
    selectedPoints: SelectionInfo[]
  ) => {
    if (!type) return;

    setIsProcessing(true);
    try {
      // Create measurement based on type
      // This will emit 'measurement-added' event that we're listening to
      switch (type) {
        case 'distance':
          await molstarService.measureDistance(
            selectedPoints[0],
            selectedPoints[1]
          );
          break;
        case 'angle':
          await molstarService.measureAngle(
            selectedPoints[0],
            selectedPoints[1], // vertex
            selectedPoints[2]
          );
          break;
        case 'dihedral':
          await molstarService.measureDihedral(
            selectedPoints[0],
            selectedPoints[1],
            selectedPoints[2],
            selectedPoints[3]
          );
          break;
      }

      // Reset mode after successful measurement
      setMode(null);
    } catch (error) {
      console.error('[useMeasurements] Measurement failed:', error);
      options.onMeasurementError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startMeasurement = useCallback((type: MeasurementMode) => {
    setMode(type);
    setSelections([]);
    setIsProcessing(false);
  }, []);

  const cancelMeasurement = useCallback(() => {
    setMode(null);
    setSelections([]);
    setIsProcessing(false);
  }, []);

  const deleteMeasurement = useCallback((id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
    // Also remove from Mol* viewer
    molstarService.removeMeasurement?.(id);
  }, []);

  const clearAllMeasurements = useCallback(() => {
    setMeasurements([]);
    molstarService.clearMeasurements?.();
  }, []);

  const toggleMeasurementVisibility = useCallback((id: string) => {
    molstarService.toggleMeasurementVisibility?.(id);
  }, []);

  return {
    measurements,
    mode,
    selections,
    selectionsRequired: mode ? requiredSelections[mode] : 0,
    selectionsCount: selections.length,
    isProcessing,
    startMeasurement,
    cancelMeasurement,
    deleteMeasurement,
    clearAllMeasurements,
    toggleMeasurementVisibility,
  };
}
