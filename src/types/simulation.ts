/**
 * Comprehensive Simulation Type Definitions
 * Extends existing MD types with UI and integration types
 */

import { SimulationFrame } from '../lib/md-browser-dynamica';
import { EnergyComponents, TrajectoryData } from '../services/md-simulation';

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  category: 'folding' | 'docking' | 'minimization' | 'equilibration' | 'demo' | 'enzyme-catalysis' | 'fermentation';
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
  },
  // Lactobacillus-specific simulation presets
  {
    id: 'lactate-dehydrogenase-catalysis',
    name: 'Lactate Dehydrogenase Catalysis',
    description: 'Watch how LDH converts pyruvate to lactate',
    category: 'enzyme-catalysis',
    difficulty: 'beginner',
    estimatedTime: 12,
    parameters: {
      temperature: 310,
      timestep: 0.5,
      steps: 6000,
      integrator: 'langevin',
      forceField: 'AMBER',
      ensemble: 'NVT'
    },
    learningObjectives: [
      'NAD+ binding',
      'Substrate specificity',
      'Fermentation mechanism'
    ]
  },
  {
    id: 'bacteriocin-membrane-interaction',
    name: 'Bacteriocin Membrane Interaction',
    description: 'Simulate nisin inserting into bacterial membrane',
    category: 'docking',
    difficulty: 'intermediate',
    estimatedTime: 18,
    parameters: {
      temperature: 310,
      timestep: 2.0,
      steps: 10000,
      integrator: 'leapfrog',
      forceField: 'CHARMM',
      ensemble: 'NPT'
    },
    learningObjectives: [
      'Lipid II binding',
      'Pore formation',
      'Antimicrobial activity'
    ]
  },
  {
    id: 's-layer-protein-assembly',
    name: 'S-Layer Protein Assembly',
    description: 'Watch S-layer proteins self-assemble into lattice',
    category: 'folding',
    difficulty: 'advanced',
    estimatedTime: 25,
    parameters: {
      temperature: 300,
      timestep: 2.0,
      steps: 15000,
      integrator: 'langevin',
      forceField: 'AMBER',
      ensemble: 'NVT'
    },
    learningObjectives: [
      'Self-assembly',
      'Crystalline organization',
      'Surface anchoring'
    ]
  },
  {
    id: 'probiotic-adhesin-binding',
    name: 'Probiotic Adhesin Binding',
    description: 'Simulate adhesin proteins binding to host epithelial cells',
    category: 'docking',
    difficulty: 'intermediate',
    estimatedTime: 16,
    parameters: {
      temperature: 310,
      timestep: 1.0,
      steps: 8000,
      integrator: 'verlet',
      forceField: 'CHARMM',
      ensemble: 'NVT'
    },
    learningObjectives: [
      'Host-microbe interaction',
      'Mucosal adhesion',
      'Colonization'
    ]
  },
  {
    id: 'fermentation-energy-dynamics',
    name: 'Fermentation Energy Dynamics',
    description: 'Visualize energy transformations during lactic acid fermentation',
    category: 'demo',
    difficulty: 'beginner',
    estimatedTime: 8,
    parameters: {
      temperature: 303,
      timestep: 1.0,
      steps: 4000,
      integrator: 'verlet',
      forceField: 'OPLS',
      ensemble: 'NVT'
    },
    learningObjectives: [
      'ATP production',
      'Redox balance',
      'Metabolic efficiency'
    ]
  }
];
