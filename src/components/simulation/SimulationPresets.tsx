/**
 * Simulation Presets Component
 * Pre-configured educational simulation templates with LAB focus
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Beaker,
  Activity,
  Dna,
  Target,
  Layers,
  Droplets,
  FlaskConical,
  Microscope,
  Info
} from 'lucide-react';
import { SIMULATION_PRESETS, SimulationPreset } from '../../types/simulation';

// LAB simulation identifiers
const LAB_IDENTIFIERS = ['lactate', 'bacteriocin', 's-layer', 'adhesin', 'fermentation'];

const isLABSimulation = (preset: SimulationPreset): boolean => {
  return LAB_IDENTIFIERS.some(id => preset.id.toLowerCase().includes(id));
};

// Category icons mapping
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'folding':
      return <Dna className="w-5 h-5" />;
    case 'docking':
      return <Target className="w-5 h-5" />;
    case 'minimization':
      return <Layers className="w-5 h-5" />;
    case 'equilibration':
      return <Droplets className="w-5 h-5" />;
    case 'demo':
      return <Microscope className="w-5 h-5" />;
    case 'enzyme-catalysis':
      return <FlaskConical className="w-5 h-5" />;
    case 'fermentation':
      return <Activity className="w-5 h-5" />;
    default:
      return <Beaker className="w-5 h-5" />;
  }
};

// Category display names
const getCategoryDisplayName = (category: string): string => {
  const names: Record<string, string> = {
    'folding': 'Protein Folding',
    'docking': 'Molecular Docking',
    'minimization': 'Energy Minimization',
    'equilibration': 'System Equilibration',
    'demo': 'Demonstrations',
    'enzyme-catalysis': 'Enzyme Catalysis',
    'fermentation': 'Fermentation Dynamics'
  };
  return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

type ViewMode = 'lab' | 'all';

interface SimulationPresetsProps {
  onSelectPreset: (preset: SimulationPreset) => void;
  disabled?: boolean;
}

export default function SimulationPresets({
  onSelectPreset,
  disabled = false,
}: SimulationPresetsProps) {
  // Default to LAB mode since this is a LAB-focused app
  const [viewMode, setViewMode] = useState<ViewMode>('lab');

  // Filter presets based on view mode
  const filteredPresets = useMemo(() => {
    if (viewMode === 'lab') {
      return SIMULATION_PRESETS.filter(isLABSimulation);
    }
    return SIMULATION_PRESETS;
  }, [viewMode]);

  // Get unique categories from filtered presets
  const categories = useMemo(() => {
    return Array.from(new Set(filteredPresets.map(p => p.category)));
  }, [filteredPresets]);

  // Count LAB simulations for the tab badge
  const labCount = useMemo(() => {
    return SIMULATION_PRESETS.filter(isLABSimulation).length;
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {viewMode === 'lab' ? 'Lactobacillus Simulations' : 'Simulation Presets'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {viewMode === 'lab'
              ? 'Explore LAB-specific molecular dynamics simulations'
              : 'Choose a pre-configured simulation template to get started'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('lab')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'lab'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Microscope className="w-4 h-4" />
              LAB Simulations
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                viewMode === 'lab' ? 'bg-green-500' : 'bg-gray-200'
              }`}>
                {labCount}
              </span>
            </span>
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              All Simulations
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                viewMode === 'all' ? 'bg-blue-500' : 'bg-gray-200'
              }`}>
                {SIMULATION_PRESETS.length}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* LAB Info Box - only shown in LAB mode */}
      {viewMode === 'lab' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <Info className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Lactic Acid Bacteria Simulations</h3>
              <p className="text-sm text-green-700 mt-1">
                Explore molecular dynamics simulations specific to lactic acid bacteria proteins and processes.
                These simulations cover key LAB mechanisms including lactate dehydrogenase catalysis,
                bacteriocin antimicrobial activity, S-layer protein assembly, probiotic adhesion,
                and fermentation energy dynamics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Presets by Category */}
      {categories.map(category => (
        <div key={category} className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
            <span className={viewMode === 'lab' ? 'text-green-600' : 'text-blue-600'}>
              {getCategoryIcon(category)}
            </span>
            {getCategoryDisplayName(category)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPresets.filter(p => p.category === category).map(preset => {
              const isLAB = isLABSimulation(preset);
              return (
                <div
                  key={preset.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                    isLAB
                      ? 'border-green-300 bg-green-50/30 hover:border-green-500 hover:bg-green-50'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                  onClick={() => !disabled && onSelectPreset(preset)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={isLAB ? 'text-green-600' : 'text-gray-600'}>
                        {getCategoryIcon(preset.category)}
                      </span>
                      <h4 className="font-medium text-gray-900">{preset.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLAB && (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 font-medium">
                          LAB
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        preset.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        preset.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {preset.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3">
                    {preset.description}
                  </p>

                  {/* Config Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <span>Temperature:</span>
                      <span className="font-medium">{preset.parameters.temperature}K</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Timestep:</span>
                      <span className="font-medium">{preset.parameters.timestep}fs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Steps:</span>
                      <span className="font-medium">{preset.parameters.steps}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Integrator:</span>
                      <span className="font-medium">{preset.parameters.integrator}</span>
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <div className="text-xs text-gray-500 mb-3">
                    Estimated time: <span className="font-medium">{preset.estimatedTime}s</span>
                  </div>

                  {/* Learning Objectives */}
                  {preset.learningObjectives && preset.learningObjectives.length > 0 && (
                    <div className={`border-t pt-2 ${isLAB ? 'border-green-200' : 'border-gray-200'}`}>
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Learning Objectives:
                      </div>
                      <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                        {preset.learningObjectives.map((obj, idx) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Button */}
                  <button
                    className={`w-full mt-3 px-3 py-2 text-white text-sm rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
                      isLAB
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!disabled) onSelectPreset(preset);
                    }}
                  >
                    Load Preset
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {filteredPresets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No simulations found for the selected filter.
        </div>
      )}

      {/* Custom Configuration Note */}
      <div className={`border rounded-lg p-4 mt-6 ${
        viewMode === 'lab' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-300'
      }`}>
        <h4 className="font-medium text-gray-900 mb-2">Custom Configuration</h4>
        <p className="text-sm text-gray-600">
          After loading a preset, you can modify any parameters to create your own custom simulation.
          Experiment with different temperatures, timesteps, and integrators to learn how they affect the results.
        </p>
      </div>

      {/* Learning Resources */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-2">Learning Resources</h4>
        <ul className="text-sm text-blue-600 space-y-1">
          {viewMode === 'lab' ? (
            <>
              <li>
                <a href="#" className="hover:underline flex items-center gap-1">
                  <Microscope className="w-4 h-4" />
                  Introduction to Lactic Acid Bacteria
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline flex items-center gap-1">
                  <FlaskConical className="w-4 h-4" />
                  Lactate Dehydrogenase Mechanism
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Bacteriocin Structure and Function
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline flex items-center gap-1">
                  <Layers className="w-4 h-4" />
                  S-Layer Protein Assembly
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  Lactic Acid Fermentation Pathways
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <a href="#" className="hover:underline">Introduction to Molecular Dynamics</a>
              </li>
              <li>
                <a href="#" className="hover:underline">Understanding Force Fields</a>
              </li>
              <li>
                <a href="#" className="hover:underline">Statistical Ensembles (NVE, NVT, NPT)</a>
              </li>
              <li>
                <a href="#" className="hover:underline">Integration Algorithms Explained</a>
              </li>
              <li>
                <a href="#" className="hover:underline">Analyzing MD Trajectories</a>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

// Re-export for backwards compatibility
export { SIMULATION_PRESETS };
export type { SimulationPreset };
