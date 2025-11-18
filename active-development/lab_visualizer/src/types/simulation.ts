/**
 * Comprehensive Simulation Type Definitions
 * Extends existing MD types with UI and integration types
 */

import { SimulationFrame } from '../lib/md-browser-dynamica';
import type { TrajectoryData } from '../services/md-simulation';
import { EnergyComponents } from '../services/md-simulation';

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  category: 'folding' | 'docking' | 'minimization' | 'equilibration' | 'demo';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // seconds
  parameters: {
    temperature: number;
    timestep: number;
    steps: number;
    integrator: 'verlet' | 'leapfrog' | 'langevin';
    forceField: 'AMBER' | 'CHARMM' | 'OPLS';
    ensemble: 'NVE' | 'NVT' | 'NPT';
  };
  pdbId?: string; // Optional structure to load
  thumbnail?: string;
  learningObjectives?: string[];
}

export interface SimulationControls {
  isPlaying: boolean;
  isPaused: boolean;
  currentFrame: number;
  totalFrames: number;
  playbackSpeed: number; // 0.5x to 4x
  loopMode: boolean;
}

export interface EnergyPlotData {
  time: number[]; // ps
  potential: number[];
  kinetic: number[];
  total: number[];
  temperature: number[];
  pressure?: number[];
}

export interface ForceFieldConfig {
  type: 'AMBER' | 'CHARMM' | 'OPLS' | 'custom';
  parameters: {
    bondStrength: number; // relative to default
    angleStrength: number;
    dihedralStrength: number;
    vdwStrength: number;
    coulombStrength: number;
  };
  cutoffs: {
    vdw: number; // nm
    coulomb: number; // nm
    neighborList: number; // nm
  };
}

export interface SimulationVisualizationOptions {
  showForces: boolean;
  forceScale: number;
  showTrajectory: boolean;
  trajectoryLength: number; // number of frames to show
  showVelocities: boolean;
  velocityScale: number;
  colorByEnergy: boolean;
  colorByTemperature: boolean;
  showPeriodic: boolean; // periodic boundary conditions
}

export interface SimulationAnalysis {
  rmsd: number[]; // root mean square deviation
  rmsf: number[]; // root mean square fluctuation per atom
  radiusOfGyration: number[];
  energyDrift: number;
  temperatureEquilibration: {
    equilibrated: boolean;
    equilibrationTime: number; // ps
    fluctuation: number; // K
  };
  bondLengths: {
    average: number;
    stdDev: number;
    histogram: { bin: number; count: number }[];
  };
}

export interface SimulationSessionState {
  sessionId: string;
  startTime: number;
  structureId: string;
  preset?: SimulationPreset;
  controls: SimulationControls;
  trajectory: TrajectoryData | null;
  analysis: SimulationAnalysis | null;
  visualization: SimulationVisualizationOptions;
  forceField: ForceFieldConfig;
  bookmarks: SimulationBookmark[];
}

export interface SimulationBookmark {
  id: string;
  frame: number;
  timestamp: number;
  label: string;
  notes?: string;
  thumbnail?: string;
}

export interface SimulationExport {
  format: 'json' | 'pdb' | 'xyz' | 'gromacs' | 'namd' | 'amber';
  includeTrajectory: boolean;
  includeEnergies: boolean;
  includeAnalysis: boolean;
  frameRange?: {
    start: number;
    end: number;
    stride: number;
  };
}

export interface SimulationPerformanceMetrics {
  fps: number;
  stepsPerSecond: number;
  memoryUsage: number; // MB
  renderTime: number; // ms per frame
  computeTime: number; // ms per step
  totalWallTime: number; // seconds
}

export interface SimulationEvent {
  type: 'start' | 'pause' | 'resume' | 'stop' | 'complete' | 'error' | 'frame_update';
  timestamp: number;
  frame?: number;
  data?: unknown;
  error?: Error;
}

export type SimulationEventCallback = (event: SimulationEvent) => void;

/**
 * Preset library for common simulations
 */
export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'protein-folding-basic',
    name: 'Protein Folding (Basic)',
    description: 'Watch a small peptide fold into its native structure',
    category: 'folding',
    difficulty: 'beginner',
    estimatedTime: 10,
    parameters: {
      temperature: 300,
      timestep: 1.0,
      steps: 5000,
      integrator: 'langevin',
      forceField: 'AMBER',
      ensemble: 'NVT'
    },
    learningObjectives: [
      'Understand protein folding dynamics',
      'Observe secondary structure formation',
      'Learn about energy minimization'
    ]
  },
  {
    id: 'ligand-docking',
    name: 'Ligand Docking',
    description: 'Simulate a small molecule binding to a protein',
    category: 'docking',
    difficulty: 'intermediate',
    estimatedTime: 15,
    parameters: {
      temperature: 298,
      timestep: 0.5,
      steps: 8000,
      integrator: 'verlet',
      forceField: 'CHARMM',
      ensemble: 'NVT'
    },
    learningObjectives: [
      'Understand molecular recognition',
      'Observe binding dynamics',
      'Learn about non-covalent interactions'
    ]
  },
  {
    id: 'energy-minimization',
    name: 'Energy Minimization',
    description: 'Optimize molecular geometry to find lowest energy state',
    category: 'minimization',
    difficulty: 'beginner',
    estimatedTime: 5,
    parameters: {
      temperature: 0,
      timestep: 0.1,
      steps: 1000,
      integrator: 'steepest-descent' as any,
      forceField: 'OPLS',
      ensemble: 'NVE'
    },
    learningObjectives: [
      'Understand potential energy surfaces',
      'Learn optimization algorithms',
      'Observe structural relaxation'
    ]
  },
  {
    id: 'membrane-protein',
    name: 'Membrane Protein in Lipid Bilayer',
    description: 'Simulate a membrane protein embedded in a lipid bilayer',
    category: 'equilibration',
    difficulty: 'advanced',
    estimatedTime: 20,
    parameters: {
      temperature: 310,
      timestep: 2.0,
      steps: 10000,
      integrator: 'leapfrog',
      forceField: 'AMBER',
      ensemble: 'NPT'
    },
    learningObjectives: [
      'Understand membrane protein dynamics',
      'Observe lipid-protein interactions',
      'Learn about periodic boundary conditions'
    ]
  },
  {
    id: 'water-box',
    name: 'Water Box Equilibration',
    description: 'Simple water simulation to learn MD basics',
    category: 'demo',
    difficulty: 'beginner',
    estimatedTime: 5,
    parameters: {
      temperature: 300,
      timestep: 1.0,
      steps: 2000,
      integrator: 'verlet',
      forceField: 'OPLS',
      ensemble: 'NVT'
    },
    learningObjectives: [
      'Understand molecular dynamics basics',
      'Observe hydrogen bonding',
      'Learn about temperature control'
    ]
  }
];
