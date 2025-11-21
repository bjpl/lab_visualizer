/**
 * Mock Simulation Job Data Fixtures
 * Demo mode job queue and simulation results
 */

import {
  MDJob,
  JobStatus,
  MDTier,
  MDResult,
  ServerlessMDConfig,
  MDCapabilities,
  ExportFormat,
} from '../../types/md-types';
import { SimulationPreset, SimulationAnalysis, EnergyPlotData } from '../../types/simulation';
import { DEMO_USER, RESEARCHER_USER } from './users';

/**
 * Mock serverless configuration template
 */
const createServerlessConfig = (
  atomCount: number,
  temperature: number = 300,
  totalTime: number = 100,
  priority: 'low' | 'normal' | 'high' = 'normal'
): ServerlessMDConfig => ({
  tier: MDTier.SERVERLESS,
  atomCount,
  timestep: 2.0,
  totalTime,
  temperature,
  ensemble: 'NVT',
  integrator: 'langevin',
  outputFrequency: 10,
  maxAtoms: 5000,
  priority,
  notifyOnComplete: true,
  userId: DEMO_USER.id,
});

/**
 * Completed job - Lysozyme equilibration
 */
export const COMPLETED_JOB_1: MDJob = {
  id: 'md-job-completed-001',
  userId: DEMO_USER.id,
  status: JobStatus.COMPLETED,
  config: createServerlessConfig(1001, 300, 100, 'normal'),
  structureId: '1LYZ',
  structureData: 'MOCK_PDB_DATA_1LYZ',
  createdAt: new Date(Date.now() - 7200000), // 2 hours ago
  startedAt: new Date(Date.now() - 7000000),
  completedAt: new Date(Date.now() - 5400000), // 1.5 hours ago
  progress: 100,
  resultUrl: '/mock/results/md-job-completed-001.json',
};

/**
 * Completed job - Insulin dynamics
 */
export const COMPLETED_JOB_2: MDJob = {
  id: 'md-job-completed-002',
  userId: RESEARCHER_USER.id,
  status: JobStatus.COMPLETED,
  config: createServerlessConfig(787, 310, 200, 'high'),
  structureId: '1ZNI',
  structureData: 'MOCK_PDB_DATA_1ZNI',
  createdAt: new Date(Date.now() - 86400000), // 1 day ago
  startedAt: new Date(Date.now() - 86200000),
  completedAt: new Date(Date.now() - 82800000),
  progress: 100,
  resultUrl: '/mock/results/md-job-completed-002.json',
};

/**
 * Running job - GFP simulation
 */
export const RUNNING_JOB: MDJob = {
  id: 'md-job-running-001',
  userId: DEMO_USER.id,
  status: JobStatus.RUNNING,
  config: createServerlessConfig(1854, 298, 150, 'normal'),
  structureId: '1EMA',
  structureData: 'MOCK_PDB_DATA_1EMA',
  createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
  startedAt: new Date(Date.now() - 1500000), // 25 minutes ago
  progress: 67,
  estimatedTimeRemaining: 720, // 12 minutes
};

/**
 * Queued job - Hemoglobin simulation
 */
export const QUEUED_JOB: MDJob = {
  id: 'md-job-queued-001',
  userId: DEMO_USER.id,
  status: JobStatus.QUEUED,
  config: createServerlessConfig(4460, 300, 100, 'low'),
  structureId: '1HHO',
  structureData: 'MOCK_PDB_DATA_1HHO',
  createdAt: new Date(Date.now() - 600000), // 10 minutes ago
  progress: 0,
  estimatedTimeRemaining: 3600, // 1 hour
};

/**
 * Pending job - Myoglobin
 */
export const PENDING_JOB: MDJob = {
  id: 'md-job-pending-001',
  userId: DEMO_USER.id,
  status: JobStatus.PENDING,
  config: createServerlessConfig(1260, 300, 50, 'normal'),
  structureId: '1MBO',
  structureData: 'MOCK_PDB_DATA_1MBO',
  createdAt: new Date(Date.now() - 120000), // 2 minutes ago
  progress: 0,
};

/**
 * Failed job - Too large structure
 */
export const FAILED_JOB: MDJob = {
  id: 'md-job-failed-001',
  userId: RESEARCHER_USER.id,
  status: JobStatus.FAILED,
  config: createServerlessConfig(21567, 300, 100, 'high'),
  structureId: '6VXX',
  structureData: 'MOCK_PDB_DATA_6VXX',
  createdAt: new Date(Date.now() - 3600000), // 1 hour ago
  startedAt: new Date(Date.now() - 3500000),
  completedAt: new Date(Date.now() - 3400000),
  progress: 5,
  errorMessage: 'Structure too large for serverless tier. Maximum atoms: 5000, provided: 21567. Please use desktop export for large structures.',
};

/**
 * Cancelled job
 */
export const CANCELLED_JOB: MDJob = {
  id: 'md-job-cancelled-001',
  userId: DEMO_USER.id,
  status: JobStatus.CANCELLED,
  config: createServerlessConfig(1001, 350, 200, 'low'),
  structureId: '1LYZ',
  structureData: 'MOCK_PDB_DATA_1LYZ',
  createdAt: new Date(Date.now() - 5400000), // 1.5 hours ago
  startedAt: new Date(Date.now() - 5200000),
  completedAt: new Date(Date.now() - 4800000),
  progress: 32,
  errorMessage: 'Job cancelled by user',
};

/**
 * All mock jobs
 */
export const MOCK_JOBS: MDJob[] = [
  COMPLETED_JOB_1,
  COMPLETED_JOB_2,
  RUNNING_JOB,
  QUEUED_JOB,
  PENDING_JOB,
  FAILED_JOB,
  CANCELLED_JOB,
];

/**
 * Get jobs by user ID
 */
export function getMockJobsByUser(userId: string): MDJob[] {
  return MOCK_JOBS.filter((job) => job.userId === userId);
}

/**
 * Get jobs by status
 */
export function getMockJobsByStatus(status: JobStatus): MDJob[] {
  return MOCK_JOBS.filter((job) => job.status === status);
}

/**
 * Get job by ID
 */
export function getMockJobById(jobId: string): MDJob | null {
  return MOCK_JOBS.find((job) => job.id === jobId) || null;
}

/**
 * Mock job result for completed job
 */
export const MOCK_JOB_RESULT: MDResult = {
  jobId: COMPLETED_JOB_1.id,
  trajectoryUrl: '/mock/results/trajectory-001.xtc',
  energyPlotUrl: '/mock/results/energy-001.png',
  statisticsUrl: '/mock/results/stats-001.json',
  logUrl: '/mock/results/log-001.txt',
  frameCount: 1000,
  finalEnergy: -45234.56,
  averageTemperature: 299.8,
  averagePressure: 1.01,
};

/**
 * Mock energy plot data for visualization
 */
export const MOCK_ENERGY_DATA: EnergyPlotData = {
  time: Array.from({ length: 100 }, (_, i) => i * 1), // 0-100 ps
  potential: Array.from({ length: 100 }, (_, i) => -45000 - Math.random() * 500 + i * 2),
  kinetic: Array.from({ length: 100 }, (_, i) => 12000 + Math.random() * 300 - Math.sin(i * 0.1) * 100),
  total: Array.from({ length: 100 }, (_, i) => -33000 - Math.random() * 400 + i * 1.5),
  temperature: Array.from({ length: 100 }, (_, i) => 298 + Math.random() * 4 - 2 + Math.sin(i * 0.05) * 1),
  pressure: Array.from({ length: 100 }, (_, i) => 1.0 + Math.random() * 0.02 - 0.01),
};

/**
 * Mock simulation analysis results
 */
export const MOCK_ANALYSIS: SimulationAnalysis = {
  rmsd: Array.from({ length: 100 }, (_, i) => 0.5 + Math.log(i + 1) * 0.3 + Math.random() * 0.2),
  rmsf: Array.from({ length: 129 }, () => 0.3 + Math.random() * 1.5),
  radiusOfGyration: Array.from({ length: 100 }, (_, i) => 14.5 + Math.sin(i * 0.02) * 0.3 + Math.random() * 0.1),
  energyDrift: 0.002, // kJ/mol/ps
  temperatureEquilibration: {
    equilibrated: true,
    equilibrationTime: 10.5, // ps
    fluctuation: 2.3, // K
  },
  bondLengths: {
    average: 1.53, // Angstrom
    stdDev: 0.02,
    histogram: Array.from({ length: 20 }, (_, i) => ({
      bin: 1.4 + i * 0.02,
      count: Math.floor(Math.exp(-Math.pow(i - 10, 2) / 20) * 1000),
    })),
  },
};

/**
 * Mock queue statistics
 */
export const MOCK_QUEUE_STATS = {
  pending: 3,
  queued: 5,
  running: 2,
  completed: 156,
  failed: 12,
  averageWaitTime: 180, // seconds
  averageProcessingTime: 1800, // seconds
};

/**
 * Mock system capabilities
 */
export const MOCK_CAPABILITIES: MDCapabilities = {
  supportedTiers: [MDTier.BROWSER, MDTier.SERVERLESS, MDTier.DESKTOP],
  maxAtomsPerTier: {
    [MDTier.BROWSER]: 500,
    [MDTier.SERVERLESS]: 5000,
    [MDTier.DESKTOP]: 1000000,
  },
  supportedEnsembles: ['NVE', 'NVT', 'NPT'],
  supportedIntegrators: ['verlet', 'leapfrog', 'langevin'],
  supportedExportFormats: [ExportFormat.GROMACS, ExportFormat.NAMD, ExportFormat.AMBER, ExportFormat.LAMMPS],
};

/**
 * Estimate wait time for new job
 */
export function estimateMockWaitTime(priority: 'low' | 'normal' | 'high'): number {
  const baseTime = MOCK_QUEUE_STATS.averageWaitTime;
  const multipliers = { low: 2.0, normal: 1.0, high: 0.5 };
  const queueLength = MOCK_QUEUE_STATS.pending + MOCK_QUEUE_STATS.queued;
  return Math.round(baseTime * multipliers[priority] * (1 + queueLength * 0.1));
}

/**
 * Simulate job progress update (for demo animation)
 */
export function simulateJobProgress(job: MDJob, elapsedSeconds: number): MDJob {
  if (job.status !== JobStatus.RUNNING) return job;

  const totalTime = job.config.totalTime;
  const progressRate = 100 / (totalTime / 10); // Assume 10x realtime
  const newProgress = Math.min(100, job.progress + progressRate * elapsedSeconds);

  return {
    ...job,
    progress: Math.round(newProgress),
    estimatedTimeRemaining: Math.round((100 - newProgress) / progressRate),
  };
}

/**
 * Demo simulation presets for quick start
 */
export const DEMO_PRESETS: SimulationPreset[] = [
  {
    id: 'demo-quick-viz',
    name: 'Quick Visualization',
    description: 'Short simulation to see basic molecular motion',
    category: 'demo',
    difficulty: 'beginner',
    estimatedTime: 30,
    parameters: {
      temperature: 300,
      timestep: 2.0,
      steps: 1500,
      integrator: 'langevin',
      forceField: 'AMBER',
      ensemble: 'NVT',
    },
    pdbId: '1LYZ',
    learningObjectives: [
      'Observe thermal motion of atoms',
      'Understand basic MD output',
      'See protein dynamics',
    ],
  },
  {
    id: 'demo-equilibration',
    name: 'System Equilibration',
    description: 'Equilibrate a protein in water-like environment',
    category: 'equilibration',
    difficulty: 'beginner',
    estimatedTime: 60,
    parameters: {
      temperature: 300,
      timestep: 1.0,
      steps: 5000,
      integrator: 'verlet',
      forceField: 'CHARMM',
      ensemble: 'NVT',
    },
    learningObjectives: [
      'Understand equilibration process',
      'Monitor temperature stability',
      'Observe energy convergence',
    ],
  },
  {
    id: 'demo-heating',
    name: 'Temperature Ramp',
    description: 'Heat a protein from 100K to 300K',
    category: 'demo',
    difficulty: 'intermediate',
    estimatedTime: 90,
    parameters: {
      temperature: 100, // Starting temperature
      timestep: 1.0,
      steps: 10000,
      integrator: 'langevin',
      forceField: 'AMBER',
      ensemble: 'NVT',
    },
    learningObjectives: [
      'Observe temperature effects on structure',
      'Understand heating protocols',
      'See increased molecular motion',
    ],
  },
];
