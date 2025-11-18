/**
 * Force Field Settings Component
 * Parameter controls for MD force fields
 */

'use client';

import type { ForceFieldConfig } from '../../types/simulation';
import { Card } from '../ui/card';

interface ForceFieldSettingsProps {
  config: ForceFieldConfig;
  onChange: (config: ForceFieldConfig) => void;
  disabled?: boolean;
}

export default function ForceFieldSettings({
  config,
  onChange,
  disabled = false
}: ForceFieldSettingsProps) {
  const handleTypeChange = (type: ForceFieldConfig['type']) => {
    onChange({ ...config, type });
  };

  const handleParameterChange = (param: keyof ForceFieldConfig['parameters'], value: number) => {
    onChange({
      ...config,
      parameters: {
        ...config.parameters,
        [param]: value
      }
    });
  };

  const handleCutoffChange = (cutoff: keyof ForceFieldConfig['cutoffs'], value: number) => {
    onChange({
      ...config,
      cutoffs: {
        ...config.cutoffs,
        [cutoff]: value
      }
    });
  };

  const resetToDefaults = () => {
    onChange({
      type: config.type,
      parameters: {
        bondStrength: 1.0,
        angleStrength: 1.0,
        dihedralStrength: 1.0,
        vdwStrength: 1.0,
        coulombStrength: 1.0
      },
      cutoffs: {
        vdw: 1.0,
        coulomb: 1.0,
        neighborList: 1.2
      }
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Force Field Settings</h3>
          <button
            onClick={resetToDefaults}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Force Field Type */}
        <div>
          <label htmlFor="force-field-type" className="block text-sm font-medium text-gray-700 mb-2">
            Force Field Type
          </label>
          <div id="force-field-type" role="group" aria-label="Force field type selection" className="grid grid-cols-4 gap-2">
            {(['AMBER', 'CHARMM', 'OPLS', 'custom'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                disabled={disabled}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  config.type === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {config.type === 'AMBER' && 'Optimized for proteins and nucleic acids'}
            {config.type === 'CHARMM' && 'Comprehensive force field for biomolecules'}
            {config.type === 'OPLS' && 'All-atom force field for organic liquids'}
            {config.type === 'custom' && 'Customize all force field parameters'}
          </p>
        </div>

        {/* Parameter Strengths */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Interaction Strengths
            <span className="ml-2 text-xs text-gray-500">(relative to defaults)</span>
          </h4>

          {Object.entries(config.parameters).map(([key, value]) => {
            const labels: Record<string, string> = {
              bondStrength: 'Bond',
              angleStrength: 'Angle',
              dihedralStrength: 'Dihedral',
              vdwStrength: 'Van der Waals',
              coulombStrength: 'Electrostatic'
            };

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">
                    {labels[key]}
                  </label>
                  <span className="text-sm font-medium text-gray-900">
                    {value.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={value}
                  onChange={(e) => handleParameterChange(
                    key as keyof ForceFieldConfig['parameters'],
                    parseFloat(e.target.value)
                  )}
                  disabled={disabled || config.type !== 'custom'}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0.0</span>
                  <span>1.0</span>
                  <span>2.0</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cutoff Distances */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium text-gray-700">
            Cutoff Distances
            <span className="ml-2 text-xs text-gray-500">(nm)</span>
          </h4>

          {Object.entries(config.cutoffs).map(([key, value]) => {
            const labels: Record<string, string> = {
              vdw: 'Van der Waals',
              coulomb: 'Electrostatic',
              neighborList: 'Neighbor List'
            };

            const ranges: Record<string, { min: number; max: number; step: number }> = {
              vdw: { min: 0.8, max: 1.5, step: 0.1 },
              coulomb: { min: 0.8, max: 1.5, step: 0.1 },
              neighborList: { min: 1.0, max: 2.0, step: 0.1 }
            };

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">
                    {labels[key]}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleCutoffChange(
                      key as keyof ForceFieldConfig['cutoffs'],
                      parseFloat(e.target.value)
                    )}
                    disabled={disabled || config.type !== 'custom'}
                    min={ranges[key].min}
                    max={ranges[key].max}
                    step={ranges[key].step}
                    className="w-20 px-2 py-1 text-sm border rounded text-right disabled:opacity-50"
                  />
                </div>
                <input
                  type="range"
                  min={ranges[key].min}
                  max={ranges[key].max}
                  step={ranges[key].step}
                  value={value}
                  onChange={(e) => handleCutoffChange(
                    key as keyof ForceFieldConfig['cutoffs'],
                    parseFloat(e.target.value)
                  )}
                  disabled={disabled || config.type !== 'custom'}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            );
          })}
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="space-y-1 text-blue-900">
              <p className="font-medium">Force Field Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Lower cutoffs increase performance but reduce accuracy</li>
                <li>Higher cutoffs improve accuracy but slow simulation</li>
                <li>Custom parameters require validation before production use</li>
                <li>Standard force fields are optimized for specific molecule types</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
