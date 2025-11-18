/**
 * WebDynamica Wrapper
 * Lightweight browser-based molecular dynamics engine
 * Limitations: <500 atoms, <30s wall-clock time, educational demos only
 */

export interface ForceFieldType {
  type: 'AMBER' | 'CHARMM' | 'OPLS';
  parameters?: Record<string, number>;
}

export interface IntegratorConfig {
  type: 'verlet' | 'leapfrog' | 'langevin';
  timestep: number; // femtoseconds
  friction?: number; // for Langevin
}

export interface DynamicaConfig {
  forceField: ForceFieldType;
  integrator: IntegratorConfig;
  temperature: number; // Kelvin
  ensemble: 'NVE' | 'NVT' | 'NPT';
  maxSteps: number;
  outputFrequency: number; // frames per 100 steps
}

export interface SimulationFrame {
  step: number;
  time: number; // picoseconds
  positions: Float32Array; // flattened [x,y,z,x,y,z,...]
  velocities?: Float32Array;
  potentialEnergy: number; // kJ/mol
  kineticEnergy: number; // kJ/mol
  temperature: number; // K
  pressure?: number; // bar
}

export interface SimulationProgress {
  currentStep: number;
  totalSteps: number;
  elapsedTime: number; // seconds
  estimatedRemaining: number; // seconds
  fps: number;
  currentFrame: SimulationFrame;
}

export type ProgressCallback = (progress: SimulationProgress) => void;
export type CompleteCallback = (frames: SimulationFrame[]) => void;
export type ErrorCallback = (error: Error) => void;

/**
 * WebDynamica Engine Wrapper
 * Provides controlled access to browser-based MD simulations
 */
export class WebDynamicaEngine {
  private atoms: number = 0;
  private config: DynamicaConfig | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private frames: SimulationFrame[] = [];
  private currentStep: number = 0;
  private startTime: number = 0;
  private animationFrameId: number | null = null;

  private progressCallback?: ProgressCallback;
  private completeCallback?: CompleteCallback;
  private errorCallback?: ErrorCallback;

  // Performance tracking
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  // Safety limits
  private readonly MAX_ATOMS = 500;
  private readonly MAX_WALL_TIME = 30; // seconds
  private readonly MIN_FPS_THRESHOLD = 5;

  /**
   * Initialize simulation with structure and configuration
   */
  async initialize(
    positions: Float32Array,
    atomCount: number,
    config: DynamicaConfig
  ): Promise<void> {
    // Validate atom count
    if (atomCount > this.MAX_ATOMS) {
      throw new Error(
        `Atom count ${atomCount} exceeds browser limit of ${this.MAX_ATOMS}. Use serverless tier instead.`
      );
    }

    this.atoms = atomCount;
    this.config = config;
    this.frames = [];
    this.currentStep = 0;
    this.isRunning = false;
    this.isPaused = false;

    // Validate timestep
    if (config.integrator.timestep < 0.5 || config.integrator.timestep > 2.0) {
      throw new Error('Timestep must be between 0.5 and 2.0 femtoseconds');
    }

    // Validate steps
    if (config.maxSteps < 100 || config.maxSteps > 10000) {
      throw new Error('Step count must be between 100 and 10,000');
    }

    // Initialize positions (mock - real implementation would use WebDynamica library)
    console.log('WebDynamica initialized:', {
      atoms: atomCount,
      forceField: config.forceField.type,
      integrator: config.integrator.type,
      temperature: config.temperature,
      timestep: config.integrator.timestep,
    });
  }

  /**
   * Start simulation
   */
  start(
    onProgress?: ProgressCallback,
    onComplete?: CompleteCallback,
    onError?: ErrorCallback
  ): void {
    if (!this.config) {
      throw new Error('Simulation not initialized');
    }

    if (this.isRunning) {
      throw new Error('Simulation already running');
    }

    this.progressCallback = onProgress;
    this.completeCallback = onComplete;
    this.errorCallback = onError;

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;

    this.runSimulationLoop();
  }

  /**
   * Pause simulation
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume simulation
   */
  resume(): void {
    if (!this.isRunning) {
      throw new Error('Simulation not running');
    }
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.runSimulationLoop();
  }

  /**
   * Stop simulation
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get current simulation state
   */
  getState(): {
    isRunning: boolean;
    isPaused: boolean;
    currentStep: number;
    totalSteps: number;
    frames: SimulationFrame[];
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentStep: this.currentStep,
      totalSteps: this.config?.maxSteps || 0,
      frames: this.frames,
    };
  }

  /**
   * Export trajectory to various formats
   */
  exportTrajectory(format: 'json' | 'pdb' | 'xyz'): string {
    if (this.frames.length === 0) {
      throw new Error('No frames to export');
    }

    switch (format) {
      case 'json':
        return JSON.stringify(this.frames, null, 2);

      case 'pdb':
        return this.exportPDB();

      case 'xyz':
        return this.exportXYZ();

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Main simulation loop (browser-safe, respects performance budget)
   */
  private runSimulationLoop(): void {
    if (!this.isRunning || this.isPaused || !this.config) {
      return;
    }

    // Check wall-clock time limit
    const elapsed = (performance.now() - this.startTime) / 1000;
    if (elapsed > this.MAX_WALL_TIME) {
      this.handleError(
        new Error(`Simulation exceeded maximum wall time of ${this.MAX_WALL_TIME}s`)
      );
      return;
    }

    // Check FPS performance
    if (this.fps < this.MIN_FPS_THRESHOLD && this.frameCount > 10) {
      this.handleError(
        new Error(`Performance too low (${this.fps.toFixed(1)} FPS). Consider reducing atom count.`)
      );
      return;
    }

    // Perform MD steps
    const stepsPerFrame = Math.ceil(this.config.maxSteps / 100);
    for (let i = 0; i < stepsPerFrame && this.currentStep < this.config.maxSteps; i++) {
      this.performMDStep();
    }

    // Update FPS
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.fps = 1000 / frameTime;
    this.lastFrameTime = now;
    this.frameCount++;

    // Capture frame
    if (this.currentStep % this.config.outputFrequency === 0) {
      const frame = this.captureFrame();
      this.frames.push(frame);

      // Report progress
      if (this.progressCallback) {
        this.progressCallback({
          currentStep: this.currentStep,
          totalSteps: this.config.maxSteps,
          elapsedTime: elapsed,
          estimatedRemaining: ((this.config.maxSteps - this.currentStep) / this.currentStep) * elapsed,
          fps: this.fps,
          currentFrame: frame,
        });
      }
    }

    // Check completion
    if (this.currentStep >= this.config.maxSteps) {
      this.handleComplete();
      return;
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => this.runSimulationLoop());
  }

  /**
   * Perform single MD integration step (mock implementation)
   * Real implementation would use WebDynamica library
   */
  private performMDStep(): void {
    if (!this.config) return;

    // Mock MD integration
    // In real implementation, this would call WebDynamica's integrator
    this.currentStep++;
  }

  /**
   * Capture current frame state
   */
  private captureFrame(): SimulationFrame {
    if (!this.config) {
      throw new Error('Config not set');
    }

    // Mock frame data
    const positions = new Float32Array(this.atoms * 3);
    for (let i = 0; i < positions.length; i++) {
      positions[i] = Math.random() * 10 - 5; // Mock positions
    }

    const time = this.currentStep * this.config.integrator.timestep / 1000; // ps
    const potentialEnergy = -1000 + Math.random() * 100; // kJ/mol
    const kineticEnergy = 300 + Math.random() * 50; // kJ/mol
    const temperature = this.config.temperature + (Math.random() - 0.5) * 10;

    return {
      step: this.currentStep,
      time,
      positions,
      potentialEnergy,
      kineticEnergy,
      temperature,
    };
  }

  /**
   * Handle simulation completion
   */
  private handleComplete(): void {
    this.isRunning = false;
    if (this.completeCallback) {
      this.completeCallback(this.frames);
    }
  }

  /**
   * Handle simulation error
   */
  private handleError(error: Error): void {
    this.stop();
    if (this.errorCallback) {
      this.errorCallback(error);
    } else {
      console.error('Simulation error:', error);
    }
  }

  /**
   * Export to PDB format (mock)
   */
  private exportPDB(): string {
    let pdb = 'REMARK WebDynamica Browser MD Trajectory\n';
    pdb += `REMARK ${this.frames.length} frames\n`;

    this.frames.forEach((frame, modelNum) => {
      pdb += `MODEL ${modelNum + 1}\n`;
      for (let i = 0; i < this.atoms; i++) {
        const x = frame.positions[i * 3];
        const y = frame.positions[i * 3 + 1];
        const z = frame.positions[i * 3 + 2];
        pdb += `ATOM  ${(i + 1).toString().padStart(5)} CA   ALA A${(i + 1).toString().padStart(4)}    `;
        pdb += `${x.toFixed(3).padStart(8)}${y.toFixed(3).padStart(8)}${z.toFixed(3).padStart(8)}\n`;
      }
      pdb += 'ENDMDL\n';
    });

    return pdb;
  }

  /**
   * Export to XYZ format (mock)
   */
  private exportXYZ(): string {
    let xyz = '';

    this.frames.forEach(frame => {
      xyz += `${this.atoms}\n`;
      xyz += `Step ${frame.step} Time ${frame.time.toFixed(3)} ps\n`;
      for (let i = 0; i < this.atoms; i++) {
        const x = frame.positions[i * 3];
        const y = frame.positions[i * 3 + 1];
        const z = frame.positions[i * 3 + 2];
        xyz += `C ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
      }
    });

    return xyz;
  }
}

/**
 * Create WebDynamica engine instance
 */
export function createWebDynamicaEngine(): WebDynamicaEngine {
  return new WebDynamicaEngine();
}
