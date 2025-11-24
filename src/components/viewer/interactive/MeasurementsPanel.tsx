'use client';

import React from 'react';
import { Ruler, Trash2, Eye, X } from 'lucide-react';
import { useMeasurements } from '@/hooks/viewer/use-measurements';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MeasurementsPanelProps {
  className?: string;
  onClose?: () => void;
}

/**
 * MeasurementsPanel Component
 *
 * Interactive panel for creating and managing molecular measurements.
 * Supports distance, angle, and dihedral angle measurements.
 *
 * Features:
 * - Start new measurements
 * - View measurement history
 * - Toggle visibility
 * - Delete measurements
 * - Real-time selection feedback
 */
export function MeasurementsPanel({ className, onClose }: MeasurementsPanelProps) {
  const {
    measurements,
    mode,
    selectionsCount,
    selectionsRequired,
    startMeasurement,
    cancelMeasurement,
    deleteMeasurement,
    clearAllMeasurements,
    toggleMeasurementVisibility,
  } = useMeasurements();

  const formatValue = (measurement: typeof measurements[0]) => {
    return `${measurement.value.toFixed(2)} ${measurement.unit}`;
  };

  const getMeasurementIcon = (type: string) => {
    return <Ruler className="w-4 h-4" />;
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Measurements
        </h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Measurement Tools */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Create Measurement
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mode === 'distance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => mode === 'distance' ? cancelMeasurement() : startMeasurement('distance')}
            className="justify-start"
          >
            <Ruler className="w-4 h-4 mr-2" />
            Distance
          </Button>

          <Button
            variant={mode === 'angle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => mode === 'angle' ? cancelMeasurement() : startMeasurement('angle')}
            className="justify-start"
          >
            <Ruler className="w-4 h-4 mr-2" />
            Angle
          </Button>
        </div>

        {/* Active measurement feedback */}
        {mode && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              {mode === 'distance' && 'Select 2 atoms'}
              {mode === 'angle' && 'Select 3 atoms (middle = vertex)'}
              {mode === 'dihedral' && 'Select 4 atoms'}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              Selected: {selectionsCount} / {selectionsRequired}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelMeasurement}
              className="mt-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Measurements List */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            History ({measurements.length})
          </div>
          {measurements.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllMeasurements}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          )}
        </div>

        {measurements.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No measurements yet. Start by selecting a measurement type above.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {measurements.map((measurement) => (
              <div
                key={measurement.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-600 dark:text-gray-400">
                      {getMeasurementIcon(measurement.type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatValue(measurement)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMeasurementVisibility(measurement.id)}
                      className="h-8 w-8 p-0"
                      title="Toggle visibility"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMeasurement(measurement.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="Delete measurement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Participants */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2 pl-6">
                  {measurement.participants.map((p, i) => (
                    <div key={i}>
                      {i + 1}. {p.chainId}:{p.residueName}{p.residueSeq}
                      {p.atomName && ` (${p.atomName})`}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
