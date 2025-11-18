/**
 * Browser Simulation Controller
 * Manages WebDynamica simulations with safety limits and monitoring
 */

import {
  WebDynamicaEngine,
  createWebDynamicaEngine,
  DynamicaConfig,
  SimulationFrame,
  SimulationProgress,
} from '../lib/md-browser-dynamica';
import { MDTier } from '../types/md-types';

export interface BrowserSimulationConfig {
  temperature: number; // Kelvin (0-500)
  timestep: number; // femtoseconds (0.5-2.0)
  steps: number; // 100-10000
  integrator: 'verlet' | 'leapfrog' | 'langevin';
  forceField: 'AMBER' | 'CHARMM' | 'OPLS';
  ensemble: 'NVE' | 'NVT' | 'NPT';
  outputFrequency: number; // frames per 100 steps
}

export interface SimulationMetrics {
  avgEnergy: number;
  minEnergy: number;
  maxEnergy: number;
  avgTemperature: number;
  tempStdDev: number;
  performanceFps: number;
  wallClockTime: number;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number; // 0-100
  elapsedTime: number;
  estimatedRemaining: number;
  currentFrame?: SimulationFrame;
  metrics?: SimulationMetrics;
}

export type StateUpdateCallback = (state: SimulationState) => void;

/**
 * Browser Simulation Controller
 * Wraps WebDynamica engine with safety checks and monitoring
 */
export class BrowserSimulationController {
  private engine: WebDynamicaEngine;
  private state: SimulationState;
  private stateCallback?: StateUpdateCallback;
  private frames: SimulationFrame[] = [];
  private startWallTime: number = 0;
  private metrics: Partial<SimulationMetrics> = {};

  // Performance monitoring
  private memoryCheckInterval?: number;
  private readonly MAX_MEMORY_MB = 200;

  constructor() {
    this.engine = createWebDynamicaEngine();
    this.state = this.createInitialState();
  }

  /**
   * Initialize simulation with structure
   */
  async initialize(
    positions: Float32Array,
    atomCount: number,
    config: BrowserSimulationConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate configuration
      const validation = this.validateConfig(atomCount, config);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Convert to WebDynamica config
      const dynamicaConfig: DynamicaConfig = {
        forceField: { type: config.forceField },
        integrator: {
          type: config.integrator,
          timestep: config.timestep,
          friction: config.integrator === 'langevin' ? 1.0 : undefined,
        },
        temperature: config.temperature,
        ensemble: config.ensemble,
        maxSteps: config.steps,
        outputFrequency: config.outputFrequency,
      };

      await this.engine.initialize(positions, atomCount, dynamicaConfig);

      this.state = this.createInitialState();
      this.state.totalSteps = config.steps;
      this.frames = [];
      this.metrics = {};

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Start simulation
   */
  start(onStateUpdate?: StateUpdateCallback): void {
    this.stateCallback = onStateUpdate;
    this.startWallTime = Date.now();

    // Start performance monitoring
    this.startMemoryMonitoring();

    this.engine.start(
      (progress) => this.handleProgress(progress),
      (frames) => this.handleComplete(frames),
      (error) => this.handleError(error)
    );

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.notifyStateChange();
  }

  /**
   * Pause simulation
   */
  pause(): void {
    this.engine.pause();
    this.state.isPaused = true;
    this.notifyStateChange();
  }

  /**
   * Resume simulation
   */
  resume(): void {
    this.engine.resume();
    this.state.isPaused = false;
    this.notifyStateChange();
  }

  /**
   * Stop simulation
   */
  stop(): void {
    this.engine.stop();
    this.stopMemoryMonitoring();
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.notifyStateChange();
  }

  /**
   * Get current state
   */
  getState(): SimulationState {
    return { ...this.state };
  }

  /**
   * Get all captured frames
   */
  getFrames(): SimulationFrame[] {
    return [...this.frames];
  }

  /**
   * Export trajectory
   */
  exportTrajectory(format: 'json' | 'pdb' | 'xyz'): string {
    return this.engine.exportTrajectory(format);
  }

  /**
   * Get simulation metrics
   */
  getMetrics(): SimulationMetrics | null {
    if (this.frames.length === 0) {
      return null;
    }

    const energies = this.frames.map(f => f.potentialEnergy + f.kineticEnergy);
    const temperatures = this.frames.map(f => f.temperature);

    const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
    const avgTemperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

    const tempVariance = temperatures.reduce((acc, t) => acc + Math.pow(t - avgTemperature, 2), 0) / temperatures.length;
    const tempStdDev = Math.sqrt(tempVariance);

    return {
      avgEnergy,
      minEnergy: Math.min(...energies),
      maxEnergy: Math.max(...energies),
      avgTemperature,
      tempStdDev,
      performanceFps: this.state.currentFrame ?
        1000 / ((Date.now() - this.startWallTime) / this.frames.length) : 0,
      wallClockTime: (Date.now() - this.startWallTime) / 1000,
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(
    atomCount: number,
    config: BrowserSimulationConfig
  ): { valid: boolean; error?: string } {
    if (atomCount > 500) {
      return {
        valid: false,
        error: 'Browser tier limited to 500 atoms. Use serverless tier instead.',
      };
    }

    if (config.temperature < 0 || config.temperature > 500) {
      return { valid: false, error: 'Temperature must be between 0 and 500 K' };
    }

    if (config.timestep < 0.5 || config.timestep > 2.0) {
      return { valid: false, error: 'Timestep must be between 0.5 and 2.0 fs' };
    }

    if (config.steps < 100 || config.steps > 10000) {
      return { valid: false, error: 'Steps must be between 100 and 10,000' };
    }

    return { valid: true };
  }

  /**
   * Handle progress updates from engine
   */
  private handleProgress(progress: SimulationProgress): void {
    this.state.currentStep = progress.currentStep;
    this.state.progress = (progress.currentStep / progress.totalSteps) * 100;
    this.state.elapsedTime = progress.elapsedTime;
    this.state.estimatedRemaining = progress.estimatedRemaining;
    this.state.currentFrame = progress.currentFrame;

    this.notifyStateChange();
  }

  /**
   * Handle simulation completion
   */
  private handleComplete(frames: SimulationFrame[]): void {
    this.frames = frames;
    this.state.isRunning = false;
    this.state.progress = 100;
    this.state.metrics = this.getMetrics() || undefined;

    this.stopMemoryMonitoring();
    this.notifyStateChange();
  }

  /**
   * Handle simulation error
   */
  private handleError(error: Error): void {
    console.error('Simulation error:', error);
    this.stop();
    // Error would be communicated through state callback
  }

  /**
   * Create initial state
   */
  private createInitialState(): SimulationState {
    return {
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 0,
      progress: 0,
      elapsedTime: 0,
      estimatedRemaining: 0,
    };
  }

  /**
   * Notify state change to callback
   */
  private notifyStateChange(): void {
    if (this.stateCallback) {
      this.stateCallback({ ...this.state });
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return;
    }

    this.memoryCheckInterval = window.setInterval(() => {
      // @ts-ignore - memory API may not be available in all browsers
      if (performance.memory) {
        // @ts-ignore
        const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (usedMB > this.MAX_MEMORY_MB) {
          console.warn(`Memory usage high: ${usedMB.toFixed(1)} MB`);
        }
      }
    }, 1000);
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }
}

/**
 * Create simulation controller instance
 */
export function createBrowserSimulation(): BrowserSimulationController {
  return new BrowserSimulationController();
}
