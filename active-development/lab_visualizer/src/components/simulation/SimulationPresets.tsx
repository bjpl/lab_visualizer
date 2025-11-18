/**
 * Simulation Presets Component
 * Pre-configured educational simulation templates
 */

'use client';

import type { BrowserSimulationConfig } from '../../services/browser-simulation';

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  config: BrowserSimulationConfig;
  category: 'minimization' | 'heating' | 'equilibration' | 'production' | 'cooling';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // seconds
  learningObjectives: string[];
}

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'minimize-basic',
    name: 'Energy Minimization',
    description: 'Relax structure to nearest local energy minimum',
    config: {
      temperature: 0,
      timestep: 0.5,
      steps: 500,
      integrator: 'verlet',
      forceField: 'AMBER',
      ensemble: 'NVE',
      outputFrequency: 10,
    },
    category: 'minimization',
    difficulty: 'beginner',
    estimatedTime: 5,
    learningObjectives: [
      'Understand energy minimization concepts',
      'Observe potential energy reduction',
      'Learn about force fields',
    ],
  },
  {
    id: 'heat-gentle',
    name: 'Gentle Heating (0→300K)',
    description: 'Gradually heat system from 0K to room temperature',
    config: {
      temperature: 300,
      timestep: 1.0,
      steps: 1000,
      integrator: 'langevin',
      forceField: 'AMBER',
      ensemble: 'NVT',
      outputFrequency: 10,
    },
    category: 'heating',
    difficulty: 'beginner',
    estimatedTime: 8,
    learningObjectives: [
      'Learn about temperature control',
      'Observe kinetic energy increase',
      'Understand Langevin thermostat',
    ],
  },
  {
    id: 'equilibrate-nvt',
    name: 'NVT Equilibration',
    description: 'Equilibrate at constant temperature (300K)',
    config: {
      temperature: 300,
      timestep: 1.0,
      steps: 2000,
      integrator: 'langevin',
      forceField: 'AMBER',
      ensemble: 'NVT',
      outputFrequency: 20,
    },
    category: 'equilibration',
    difficulty: 'intermediate',
    estimatedTime: 12,
    learningObjectives: [
      'Understand equilibration process',
      'Monitor system stability',
      'Observe temperature fluctuations',
    ],
  },
  {
    id: 'production-short',
    name: 'Short Production Run',
    description: 'Production simulation for data collection',
    config: {
      temperature: 300,
      timestep: 1.5,
      steps: 3000,
      integrator: 'verlet',
      forceField: 'AMBER',
      ensemble: 'NVT',
      outputFrequency: 30,
    },
    category: 'production',
    difficulty: 'intermediate',
    estimatedTime: 18,
    learningObjectives: [
      'Collect statistical data',
      'Analyze energy conservation',
      'Practice trajectory analysis',
    ],
  },
  {
    id: 'cool-gradual',
    name: 'Gradual Cooling (300→100K)',
    description: 'Cool system gradually to observe structural changes',
    config: {
      temperature: 100,
      timestep: 1.0,
      steps: 1500,
      integrator: 'langevin',
      forceField: 'AMBER',
      ensemble: 'NVT',
      outputFrequency: 15,
    },
    category: 'cooling',
    difficulty: 'intermediate',
    estimatedTime: 10,
    learningObjectives: [
      'Observe temperature effects on structure',
      'Learn about cooling protocols',
      'Understand kinetic to potential energy conversion',
    ],
  },
  {
    id: 'high-temp-dynamics',
    name: 'High Temperature Dynamics',
    description: 'Explore high-energy conformations at 400K',
    config: {
      temperature: 400,
      timestep: 1.5,
      steps: 2000,
      integrator: 'langevin',
      forceField: 'CHARMM',
      ensemble: 'NVT',
      outputFrequency: 20,
    },
    category: 'production',
    difficulty: 'advanced',
    estimatedTime: 15,
    learningObjectives: [
      'Study enhanced sampling',
      'Observe increased conformational changes',
      'Compare force fields',
    ],
  },
  {
    id: 'quick-test',
    name: 'Quick Test Run',
    description: 'Fast test simulation for verification',
    config: {
      temperature: 300,
      timestep: 1.0,
      steps: 500,
      integrator: 'verlet',
      forceField: 'AMBER',
      ensemble: 'NVE',
      outputFrequency: 5,
    },
    category: 'production',
    difficulty: 'beginner',
    estimatedTime: 3,
    learningObjectives: [
      'Verify system setup',
      'Quick sanity check',
      'Test simulation parameters',
    ],
  },
  {
    id: 'npt-ensemble',
    name: 'NPT Ensemble Demo',
    description: 'Constant pressure and temperature simulation',
    config: {
      temperature: 300,
      timestep: 1.0,
      steps: 2000,
      integrator: 'langevin',
      forceField: 'OPLS',
      ensemble: 'NPT',
      outputFrequency: 20,
    },
    category: 'equilibration',
    difficulty: 'advanced',
    estimatedTime: 14,
    learningObjectives: [
      'Understand NPT ensemble',
      'Learn about pressure coupling',
      'Observe volume fluctuations',
    ],
  },
];

interface SimulationPresetsProps {
  onSelectPreset: (preset: SimulationPreset) => void;
  disabled?: boolean;
}

export default function SimulationPresets({
  onSelectPreset,
  disabled = false,
}: SimulationPresetsProps) {
  const categories = Array.from(new Set(SIMULATION_PRESETS.map(p => p.category)));

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Simulation Presets</h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose a pre-configured simulation template to get started quickly. Each preset is designed for specific learning objectives.
      </p>

      {categories.map(category => (
        <div key={category} className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3 capitalize">
            {category.replace('-', ' ')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SIMULATION_PRESETS.filter(p => p.category === category).map(preset => (
              <div
                key={preset.id}
                className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                onClick={() => !disabled && onSelectPreset(preset)}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectPreset(preset);
                  }
                }}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label={`Load ${preset.name} preset - ${preset.difficulty} difficulty`}
                aria-disabled={disabled}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{preset.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    preset.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    preset.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {preset.difficulty}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-3">
                  {preset.description}
                </p>

                {/* Config Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <div>🌡️ {preset.config.temperature}K</div>
                  <div>⏱️ {preset.config.timestep}fs</div>
                  <div>🔄 {preset.config.steps} steps</div>
                  <div>⚙️ {preset.config.integrator}</div>
                </div>

                {/* Estimated Time */}
                <div className="text-xs text-gray-500 mb-3">
                  ⏰ Est. time: {preset.estimatedTime}s
                </div>

                {/* Learning Objectives */}
                <div className="border-t border-gray-200 pt-2">
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    Learning Objectives:
                  </div>
                  <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                    {preset.learningObjectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <button
                  className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={disabled}
                >
                  Load Preset
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Custom Configuration Note */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-6">
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
          <li>
            <button type="button" className="text-left hover:underline">→ Introduction to Molecular Dynamics</button>
          </li>
          <li>
            <button type="button" className="text-left hover:underline">→ Understanding Force Fields</button>
          </li>
          <li>
            <button type="button" className="text-left hover:underline">→ Statistical Ensembles (NVE, NVT, NPT)</button>
          </li>
          <li>
            <button type="button" className="text-left hover:underline">→ Integration Algorithms Explained</button>
          </li>
          <li>
            <button type="button" className="text-left hover:underline">→ Analyzing MD Trajectories</button>
          </li>
        </ul>
      </div>
    </div>
  );
}
