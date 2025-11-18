/**
 * Browser MD Integration - WebDynamica Wrapper
 * Tier 1: Browser-based molecular dynamics (<500 atoms, <30s)
 */

import type { BrowserMDConfig, TrajectoryFrame, MDResult } from '../types/md-types';

export interface WebDynamicaOptions {
  containerId: string;
  onFrame?: (frame: TrajectoryFrame) => void;
  onComplete?: (result: MDResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export class BrowserMDEngine {
  private config: BrowserMDConfig | null = null;
  private isRunning = false;
  private isPaused = false;
  private startTime: number = 0;
  private frames: TrajectoryFrame[] = [];
  private animationFrameId: number | null = null;

  constructor(private options: WebDynamicaOptions) {}

  /**
   * Validate browser tier constraints
   */
  private validateConfig(config: BrowserMDConfig): void {
    if (config.atomCount > config.maxAtoms) {
      throw new Error(
        `Browser tier limited to ${config.maxAtoms} atoms. ` +
        `Current system: ${config.atomCount} atoms. ` +
        `Please use serverless or desktop tier.`
      );
    }

    const estimatedTime = this.estimateWallClockTime(config);
    if (estimatedTime > config.maxTime) {
      throw new Error(
        `Simulation estimated at ${estimatedTime.toFixed(1)}s exceeds ` +
        `browser tier limit of ${config.maxTime}s. ` +
        `Please reduce timesteps or use serverless tier.`
      );
    }
  }

  /**
   * Estimate wall-clock execution time
   */
  private estimateWallClockTime(config: BrowserMDConfig): number {
    const totalTimesteps = (config.totalTime / config.timestep) * 1000;
    const timePerTimestep = 0.0001; // 100 microseconds per atom per timestep
    return config.atomCount * totalTimesteps * timePerTimestep;
  }

  /**
   * Initialize WebDynamica simulation
   */
  async initialize(config: BrowserMDConfig, pdbData: string): Promise<void> {
    this.validateConfig(config);

    if (!config.warningShown) {
      console.warn(
        '⚠️ Browser MD Demo Mode:\n' +
        '- Limited to 500 atoms for demonstration purposes\n' +
        '- Real-time performance may vary\n' +
        '- For production simulations, use serverless or desktop tier'
      );
    }

    this.config = config;
    this.frames = [];

    // TODO: Initialize WebDynamica library
    // This is a stub - actual WebDynamica integration needed
    console.log('Initializing WebDynamica with config:', config);
    console.log('PDB data length:', pdbData.length);
  }

  /**
   * Start simulation
   */
  async start(): Promise<void> {
    if (!this.config) {
      throw new Error('Simulation not initialized');
    }

    if (this.isRunning) {
      throw new Error('Simulation already running');
    }

    this.isRunning = true;
    this.startTime = Date.now();

    // Start simulation loop
    await this.runSimulation();
  }

  /**
   * Main simulation loop
   */
  private async runSimulation(): Promise<void> {
    if (!this.config) return;

    const totalTimesteps = (this.config.totalTime / this.config.timestep) * 1000;
    const outputInterval = Math.floor(1000 / this.config.outputFrequency);

    for (let step = 0; step < totalTimesteps && this.isRunning; step++) {
      // Check time limit
      const elapsed = (Date.now() - this.startTime) / 1000;
      if (elapsed > this.config.maxTime) {
        this.stop();
        this.options.onError?.(
          new Error(`Simulation exceeded ${this.config.maxTime}s time limit`)
        );
        return;
      }

      // Handle pause
      while (this.isPaused && this.isRunning) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Simulate MD step (stub)
      await this.performMDStep(step);

      // Output frame
      if (step % outputInterval === 0) {
        const frame = this.captureFrame(step);
        this.frames.push(frame);
        this.options.onFrame?.(frame);
      }

      // Update progress
      const progress = (step / totalTimesteps) * 100;
      this.options.onProgress?.(progress);

      // Yield to browser
      if (step % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    if (this.isRunning) {
      this.complete();
    }
  }

  /**
   * Perform single MD timestep (stub)
   */
  private async performMDStep(step: number): Promise<void> {
    // TODO: Integrate actual WebDynamica MD step
    // This is a placeholder for the integration

    // Simulate computation time
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  /**
   * Capture current frame data
   */
  private captureFrame(step: number): TrajectoryFrame {
    if (!this.config) {
      throw new Error('No configuration available');
    }

    // TODO: Get actual positions from WebDynamica
    // This is stub data
    const positions: number[][] = [];
    for (let i = 0; i < this.config.atomCount; i++) {
      positions.push([
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10
      ]);
    }

    return {
      frameNumber: step,
      time: (step * this.config.timestep) / 1000, // convert to ps
      positions,
      energy: Math.random() * -1000,
      temperature: this.config.temperature + (Math.random() - 0.5) * 10,
      pressure: this.config.ensemble === 'NPT' ? 1.0 + Math.random() * 0.1 : undefined
    };
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
    this.isPaused = false;
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
   * Complete simulation
   */
  private complete(): void {
    this.isRunning = false;

    const result: MDResult = {
      jobId: `browser-${Date.now()}`,
      trajectoryUrl: '', // In-memory for browser
      energyPlotUrl: '',
      statisticsUrl: '',
      logUrl: '',
      frameCount: this.frames.length,
      finalEnergy: this.frames[this.frames.length - 1]?.energy || 0,
      averageTemperature: this.calculateAverageTemperature(),
      averagePressure: this.config?.ensemble === 'NPT'
        ? this.calculateAveragePressure()
        : undefined
    };

    this.options.onComplete?.(result);
  }

  /**
   * Calculate average temperature from frames
   */
  private calculateAverageTemperature(): number {
    if (this.frames.length === 0) return 0;

    const sum = this.frames.reduce(
      (acc, frame) => acc + (frame.temperature || 0),
      0
    );
    return sum / this.frames.length;
  }

  /**
   * Calculate average pressure from frames
   */
  private calculateAveragePressure(): number {
    const pressureFrames = this.frames.filter(f => f.pressure !== undefined);
    if (pressureFrames.length === 0) return 0;

    const sum = pressureFrames.reduce(
      (acc, frame) => acc + (frame.pressure || 0),
      0
    );
    return sum / pressureFrames.length;
  }

  /**
   * Get all captured frames
   */
  getFrames(): TrajectoryFrame[] {
    return [...this.frames];
  }

  /**
   * Get simulation status
   */
  getStatus(): {
    isRunning: boolean;
    isPaused: boolean;
    frameCount: number;
    elapsedTime: number;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      frameCount: this.frames.length,
      elapsedTime: this.startTime ? (Date.now() - this.startTime) / 1000 : 0
    };
  }
}

/**
 * Factory function for creating browser MD engine
 */
export function createBrowserMDEngine(
  options: WebDynamicaOptions
): BrowserMDEngine {
  return new BrowserMDEngine(options);
}

/**
 * Check if WebDynamica is available in browser
 */
export function isWebDynamicaAvailable(): boolean {
  // TODO: Check for actual WebDynamica library
  return typeof window !== 'undefined';
}
