/**
 * Molecular Dynamics Type Definitions
 * 3-Tier Architecture: Browser Demo | Serverless | Desktop Export
 */

export enum MDTier {
  BROWSER = 'browser',      // WebDynamica (<500 atoms, <30s)
  SERVERLESS = 'serverless', // OpenMM Edge Functions (<5K atoms)
  DESKTOP = 'desktop'        // GROMACS/NAMD export for production
}

export enum JobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ExportFormat {
  GROMACS = 'gromacs',      // .gro, .top, .mdp
  NAMD = 'namd',            // .pdb, .psf, .conf
  AMBER = 'amber',          // .prmtop, .inpcrd
  LAMMPS = 'lammps'         // .data, .in
}

export interface MDSimulationConfig {
  tier: MDTier;
  atomCount: number;
  timestep: number;          // in femtoseconds
  totalTime: number;         // in picoseconds
  temperature: number;       // in Kelvin
  ensemble: 'NVE' | 'NVT' | 'NPT';
  integrator: 'verlet' | 'leapfrog' | 'langevin';
  outputFrequency: number;   // frames per picosecond
}

export interface BrowserMDConfig extends MDSimulationConfig {
  tier: MDTier.BROWSER;
  maxAtoms: 500;
  maxTime: 30;               // seconds wall-clock time
  warningShown: boolean;
}

export interface ServerlessMDConfig extends MDSimulationConfig {
  tier: MDTier.SERVERLESS;
  maxAtoms: 5000;
  priority: 'low' | 'normal' | 'high';
  notifyOnComplete: boolean;
  userId: string;
}

export interface DesktopExportConfig {
  format: ExportFormat;
  includeTopology: boolean;
  includeParameters: boolean;
  includeRunScript: boolean;
  includeDocumentation: boolean;
}

export interface MDJob {
  id: string;
  userId: string;
  status: JobStatus;
  config: ServerlessMDConfig;
  structureId: string;
  structureData: string;     // PDB/mmCIF content
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  resultUrl?: string;
  errorMessage?: string;
  progress: number;          // 0-100
  estimatedTimeRemaining?: number; // seconds
}

export interface MDResult {
  jobId: string;
  trajectoryUrl: string;     // Supabase Storage URL
  energyPlotUrl: string;
  statisticsUrl: string;
  logUrl: string;
  frameCount: number;
  finalEnergy: number;
  averageTemperature: number;
  averagePressure?: number;
}

export interface MDValidation {
  isValid: boolean;
  tier: MDTier;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface TrajectoryFrame {
  frameNumber: number;
  time: number;              // picoseconds
  positions: number[][];     // [atom][x,y,z]
  energy?: number;
  temperature?: number;
  pressure?: number;
}

export interface MDCapabilities {
  supportedTiers: MDTier[];
  maxAtomsPerTier: Record<MDTier, number>;
  supportedEnsembles: string[];
  supportedIntegrators: string[];
  supportedExportFormats: ExportFormat[];
}
